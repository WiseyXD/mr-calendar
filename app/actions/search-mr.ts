"use server"

import { db } from "@/lib/db"
import { mrMaster } from "@/drizzle/schema"
import { eq, or, sql } from "drizzle-orm"
import { cleanText, dedupeKey } from "@/lib/mr-schema"

function escapeLike(value: string) {
    return value.replace(/[\\%_]/g, "\\$&")
}

// Used by the Add MR form while typing: the exact duplicate (if any) plus
// similar names, e.g. "Rahul Sharmaa" while "Rahul Sharma" already exists.
export async function findMatchingMRs(input: {
    name: string
    company: string
    division: string
}) {
    const name = cleanText(input.name).toLowerCase()

    if (name.length < 3) return { exact: null, similar: [] }

    const key = dedupeKey(input)

    const rows = await db
        .select({
            id: mrMaster.mrId,
            name: mrMaster.name,
            company: mrMaster.company,
            division: mrMaster.division,
            isExact: sql<boolean>`${mrMaster.dedupeKey} = ${key}`,
        })
        .from(mrMaster)
        .where(
            or(
                eq(mrMaster.dedupeKey, key),
                sql`lower(${mrMaster.name}) LIKE ${`%${escapeLike(name)}%`}`,
                sql`length(${mrMaster.name}) >= 4 AND ${name} LIKE '%' || lower(${mrMaster.name}) || '%'`
            )
        )
        .orderBy(sql`${mrMaster.dedupeKey} = ${key} DESC`, mrMaster.name)
        .limit(6)

    return {
        exact: rows.find((r) => r.isExact) ?? null,
        similar: rows.filter((r) => !r.isExact).slice(0, 5),
    }
}
