"use server"

import { db } from "@/lib/db"
import { mrMaster } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { cleanText, dedupeKey, mrSchema, type MRInput } from "@/lib/mr-schema"
import { guardedVisitInsert } from "@/lib/visit-insert"
import { addDays, checkMessage, isVisitDay, nextVisitDay, todayIST } from "@/lib/visit-rules"

type ExistingMR = { name: string; company: string; division: string }

export type AddMRResult =
    // visitNote explains why no visit was recorded when one was asked for
    | { success: true; name: string; visitRecorded: boolean; visitNote?: string }
    | {
          success: false
          message: string
          fieldErrors?: Partial<Record<keyof MRInput, string>>
          duplicate?: ExistingMR
      }

function isUniqueViolation(error: unknown) {
    const e = error as { code?: string; cause?: { code?: string } }
    return e?.code === "23505" || e?.cause?.code === "23505"
}

async function findDuplicate(data: MRInput) {
    const [existing] = await db
        .select({ name: mrMaster.name, company: mrMaster.company, division: mrMaster.division })
        .from(mrMaster)
        .where(eq(mrMaster.dedupeKey, dedupeKey(data)))
        .limit(1)

    return existing
}

function duplicateResult(existing: ExistingMR): AddMRResult {
    return {
        success: false,
        message: `${existing.name} (${existing.company}, ${existing.division}) is already registered.`,
        duplicate: existing,
    }
}

export async function addMR(
    input: MRInput,
    // record his first visit today as well (only on a Tue/Thu with a free slot)
    { visitingToday = false }: { visitingToday?: boolean } = {}
): Promise<AddMRResult> {
    // never trust the client: validate again on the server
    const parsed = mrSchema.safeParse(input)

    if (!parsed.success) {
        const fieldErrors: Partial<Record<keyof MRInput, string>> = {}

        for (const issue of parsed.error.issues) {
            const field = issue.path[0] as keyof MRInput
            fieldErrors[field] ??= issue.message
        }

        return { success: false, message: "Please fix the highlighted fields.", fieldErrors }
    }

    const data = {
        name: cleanText(parsed.data.name),
        company: cleanText(parsed.data.company),
        division: cleanText(parsed.data.division),
    }

    const today = todayIST()

    try {
        const existing = await findDuplicate(data)

        if (existing) return duplicateResult(existing)

        if (!visitingToday || !isVisitDay(today)) {
            await db.insert(mrMaster).values(data)

            revalidatePath("/")

            return {
                success: true,
                name: data.name,
                visitRecorded: false,
                visitNote: visitingToday
                    ? checkMessage({ ok: false, reason: "not-visit-day", nextVisitDay: nextVisitDay(addDays(today, 1)) })
                    : undefined,
            }
        }

        // add the MR and his first visit in one transaction, so a duplicate
        // MR never leaves a visit behind. If today is already full, the
        // visit insert adds no row but the MR is still added.
        const mrId = crypto.randomUUID()
        const visit = guardedVisitInsert({ mrId, today, type: "normal", lastVisitId: null })

        const [, , inserted] = await db.batch([
            visit.lock,
            db.insert(mrMaster).values({ mrId, ...data }),
            visit.insert,
        ])

        revalidatePath("/")

        const visitRecorded = inserted.rows.length > 0

        return {
            success: true,
            name: data.name,
            visitRecorded,
            visitNote: visitRecorded ? undefined : checkMessage({ ok: false, reason: "daily-limit" }),
        }
    } catch (error) {
        // two people adding the same MR at the same moment: the unique index catches it
        if (isUniqueViolation(error)) {
            const existing = await findDuplicate(data)
            if (existing) return duplicateResult(existing)
        }

        console.error("Add MR failed:", error)
        return { success: false, message: "Could not add the MR. Please try again." }
    }
}
