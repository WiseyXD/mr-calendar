import { sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { mrVisits } from "@/drizzle/schema"
import { DAILY_LIMIT, type VisitType } from "@/lib/visit-rules"

// Queries to run inside db.batch() (one transaction): `lock` takes a per-day
// lock, then `insert` adds the visit only if today's count is still under the
// limit and the MR's latest visit is still `lastVisitId` (null = no visits).
// This stops two phones from both taking the 20th slot.
//
// Deliberately not a server action: callers must check the visit rules first.
export function guardedVisitInsert({
    mrId,
    today,
    type,
    lastVisitId,
}: {
    mrId: string
    today: string
    type: VisitType
    lastVisitId: string | null
}) {
    return {
        lock: db.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`mr_visits:${today}`}))`),
        insert: db.execute(sql`
            INSERT INTO ${mrVisits} (mr_id, visit_date, visit_type)
            SELECT ${mrId}::uuid, ${today}::date, ${type}::text
            WHERE (SELECT COUNT(*) FROM ${mrVisits} WHERE visit_date = ${today}::date) < ${DAILY_LIMIT}
              AND COALESCE((
                  SELECT visit_id::text FROM ${mrVisits}
                  WHERE mr_id = ${mrId}::uuid
                  ORDER BY visit_date DESC, created_at DESC
                  LIMIT 1
              ), '') = ${lastVisitId ?? ""}
            RETURNING visit_id
        `),
    }
}
