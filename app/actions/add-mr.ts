"use server"

import { db } from "@/lib/db"
import { mrMaster } from "@/drizzle/schema"
import { revalidatePath } from "next/cache"

export async function addMR(data: {
    name: string
    company: string
    division: string
}) {
    try {
        await db.insert(mrMaster).values({
            name: data.name,
            company: data.company,
            division: data.division,
        })

        revalidatePath("/")

        return { success: true }
    } catch (error) {
        console.error("Add MR failed:", error)
        return { success: false }
    }
}
