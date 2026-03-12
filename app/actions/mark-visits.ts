"use server"

import { db } from "@/lib/db"
import { mrVisits } from "@/drizzle/schema"
import { revalidatePath } from "next/cache"

export async function markVisit(mrId: string) {
    try {

        await db.insert(mrVisits).values({
            mrId,
            visitDate: new Date().toISOString().split("T")[0],
        })

        revalidatePath("/")

        return { success: true }

    } catch (error) {

        console.error(error)

        return { success: false }
    }
}
