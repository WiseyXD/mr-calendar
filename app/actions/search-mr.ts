"use server"

import { db } from "@/lib/db"
import { mrMaster } from "@/drizzle/schema"
import { ilike } from "drizzle-orm"

export async function searchMRByName(name: string) {
    if (!name) return []

    const mrs = await db
        .select()
        .from(mrMaster)
        .where(ilike(mrMaster.name, `%${name}%`))

    return mrs
}
