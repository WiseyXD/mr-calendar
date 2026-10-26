// One-off cleanup to run BEFORE `bunx drizzle-kit push` adds the unique indexes
// (one MR per name+company+division, one visit per MR per day).
//
//   bun scripts/dedupe-mrs.ts           dry run: only reports what it would change
//   bun scripts/dedupe-mrs.ts --apply   merges duplicates in a single transaction
//
// For each group of duplicate MRs the oldest record is kept, the others' visits
// are moved onto it and the extra records are deleted. If an MR then has two
// visits on the same day, the earliest-entered one is kept.

import { neon } from "@neondatabase/serverless"
import { DEDUPE_KEY_SQL } from "../drizzle/schema"

const apply = process.argv.includes("--apply")

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Add it to .env first.")
    process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

const clean = (column: string) => `btrim(regexp_replace(${column}, '\\s+', ' ', 'g'))`

type Member = {
    id: string
    name: string
    company: string
    division: string
    created_at: string | null
    visits: number
}

const groups = (await sql.query(`
    SELECT key,
           json_agg(
               json_build_object('id', mr_id, 'name', name, 'company', company, 'division', division,
                                 'created_at', created_at, 'visits', visits)
               ORDER BY created_at NULLS LAST, mr_id
           ) AS members
    FROM (
        SELECT m.*, ${DEDUPE_KEY_SQL} AS key,
               (SELECT count(*)::int FROM mr_visits v WHERE v.mr_id = m.mr_id) AS visits
        FROM mr_master m
    ) t
    GROUP BY key
    HAVING count(*) > 1
    ORDER BY key
`)) as { key: string; members: Member[] }[]

// same-day visits, counted as if the duplicate MRs were already merged
const sameDay = (await sql.query(`
    SELECT (array_agg(m.name ORDER BY m.created_at NULLS LAST))[1] AS name, v.visit_date::text AS date, count(*)::int AS visits,
           json_agg(COALESCE(v.visit_type, 'normal') ORDER BY v.created_at NULLS LAST, v.visit_id) AS types
    FROM mr_visits v
    JOIN (SELECT mr_id, name, created_at, ${DEDUPE_KEY_SQL} AS key FROM mr_master) m USING (mr_id)
    GROUP BY m.key, v.visit_date
    HAVING count(*) > 1
    ORDER BY v.visit_date
`)) as { name: string; date: string; visits: number; types: string[] }[]

const [{ messy }] = (await sql.query(`
    SELECT count(*)::int AS messy FROM mr_master
    WHERE name <> ${clean("name")} OR company <> ${clean("company")} OR division <> ${clean("division")}
`)) as { messy: number }[]

console.log(`\nDuplicate MR groups: ${groups.length}`)
for (const { members } of groups) {
    const [keep, ...extra] = members
    console.log(`\n  KEEP   ${keep.name} | ${keep.company} | ${keep.division}  (${keep.visits} visits, added ${keep.created_at ?? "?"})`)
    for (const mr of extra) {
        console.log(`  MERGE  ${mr.name} | ${mr.company} | ${mr.division}  (${mr.visits} visits, added ${mr.created_at ?? "?"})`)
    }
}

console.log(`\nSame-day visits (only the first entered is kept): ${sameDay.length}`)
for (const row of sameDay) {
    console.log(`  ${row.date}  ${row.name}: ${row.visits} visits [${row.types.join(", ")}] → keep "${row.types[0]}"`)
}

console.log(`\nMRs with extra spaces in name/company/division (will be tidied): ${messy}`)

if (!apply) {
    console.log("\nDry run: nothing was changed. Re-run with --apply to make these changes.\n")
    process.exit(0)
}

const queries = []

for (const { members } of groups) {
    const [keep, ...extra] = members
    const ids = extra.map((mr) => mr.id)
    queries.push(sql`UPDATE mr_visits SET mr_id = ${keep.id}::uuid WHERE mr_id = ANY(${ids}::uuid[])`)
    queries.push(sql`DELETE FROM mr_master WHERE mr_id = ANY(${ids}::uuid[])`)
}

queries.push(sql`
    DELETE FROM mr_visits v
    USING (
        SELECT visit_id,
               row_number() OVER (PARTITION BY mr_id, visit_date ORDER BY created_at NULLS LAST, visit_id) AS rn
        FROM mr_visits
    ) d
    WHERE v.visit_id = d.visit_id AND d.rn > 1
`)

queries.push(
    sql.query(`
        UPDATE mr_master
        SET name = ${clean("name")}, company = ${clean("company")}, division = ${clean("division")}
        WHERE name <> ${clean("name")} OR company <> ${clean("company")} OR division <> ${clean("division")}
    `)
)

await sql.transaction(queries)

console.log("\nDone. Now run: bunx drizzle-kit push\n")
