"use server"

import { db } from "@/lib/db"
import { mrMaster, mrVisits } from "@/drizzle/schema"
import { ilike, eq, sql } from "drizzle-orm"

export async function getMRs({
    search = "",
    company,
    page = 1,
    limit = 10,
}: {
    search?: string
    company?: string
    page?: number
    limit?: number
}) {
    const offset = (page - 1) * limit


    const baseQuery = db
        .select({
            id: mrMaster.mrId,
            name: mrMaster.name,
            company: mrMaster.company,
            division: mrMaster.division,
            visitsThisMonth: sql<number>`
        COUNT(${mrVisits.visitId})
      `,
        })
        .from(mrMaster)
        .leftJoin(
            mrVisits,
            sql`${mrVisits.mrId} = ${mrMaster.mrId}
      AND date_trunc('month', ${mrVisits.visitDate}) = date_trunc('month', CURRENT_DATE)`
        )
        .groupBy(mrMaster.mrId)

    if (search) {
        baseQuery.where(ilike(mrMaster.name, `%${search}%`))
    }

    if (company) {
        baseQuery.where(eq(mrMaster.company, company))
    }

    const data = await baseQuery.limit(limit).offset(offset)

    return data
}
