"use server"

import { db } from "@/lib/db"
import { mrMaster, mrVisits } from "@/drizzle/schema"
import { asc, count, desc, eq, ilike, or, sql } from "drizzle-orm"
import type { Visit } from "@/lib/visit-rules"

// visits shown in the MR popup; the newest one drives the rules
const HISTORY_LIMIT = 6

export type MRRow = {
    id: string
    name: string
    company: string
    division: string
    visits: Visit[] // newest first
}

function escapeLike(value: string) {
    return value.replace(/[\\%_]/g, "\\$&")
}

export async function getMRs({
    search = "",
    page = 1,
    limit = 10,
}: {
    search?: string
    page?: number
    limit?: number
}) {

    const offset = (page - 1) * limit

    const term = `%${escapeLike(search.trim())}%`

    const where = search.trim()
        ? or(ilike(mrMaster.name, term), ilike(mrMaster.company, term))
        : undefined

    const [rows, [{ total }]] = await Promise.all([
        db
            .select({
                id: mrMaster.mrId,
                name: mrMaster.name,
                company: mrMaster.company,
                division: mrMaster.division,
                visits: sql<Visit[]>`(
                    SELECT COALESCE(
                        JSON_AGG(
                            JSON_BUILD_OBJECT('id', v.visit_id, 'date', v.visit_date, 'type', COALESCE(v.visit_type, 'normal'))
                            ORDER BY v.visit_date DESC, v.created_at DESC
                        ),
                        '[]'::json
                    )
                    FROM (
                        -- ${mrMaster.mrId} would render unqualified ("mr_id") and match
                        -- mr_visits.mr_id inside this subquery, so name the table explicitly
                        SELECT * FROM ${mrVisits} iv
                        WHERE iv.mr_id = ${mrMaster}.mr_id
                        ORDER BY iv.visit_date DESC, iv.created_at DESC
                        LIMIT ${HISTORY_LIMIT}
                    ) v
                )`,
            })
            .from(mrMaster)
            .where(where)
            .orderBy(sql`lower(${mrMaster.name})`, asc(mrMaster.mrId))
            .limit(limit)
            .offset(offset),

        db.select({ total: count() }).from(mrMaster).where(where),
    ])

    return { rows: rows as MRRow[], total }
}

export type TodayVisit = Awaited<ReturnType<typeof getTodayVisits>>[number]

export async function getTodayVisits(today: string) {
    return db
        .select({
            id: mrVisits.visitId,
            type: mrVisits.visitType,
            createdAt: mrVisits.createdAt,
            mrId: mrMaster.mrId,
            name: mrMaster.name,
            company: mrMaster.company,
            division: mrMaster.division,
        })
        .from(mrVisits)
        .innerJoin(mrMaster, eq(mrVisits.mrId, mrMaster.mrId))
        .where(eq(mrVisits.visitDate, today))
        .orderBy(desc(mrVisits.createdAt))
}
