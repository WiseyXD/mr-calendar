"use server"

import { db } from "@/lib/db"
import { mrVisits } from "@/drizzle/schema"
import { revalidatePath } from "next/cache"
export async function markVisit(
    mrId: string,
    type: "normal" | "senior" = "normal"
) {
    try {
        await db.insert(mrVisits).values({
            mrId,
            visitType: type,
        })

        revalidatePath("/")

        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false }
    }
}
