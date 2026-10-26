"use server"

import { db } from "@/lib/db"
import { mrVisits } from "@/drizzle/schema"
import { and, count, desc, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import {
    DAILY_LIMIT,
    checkMessage,
    checkVisit,
    todayIST,
    type Visit,
    type VisitCheck,
    type VisitType,
} from "@/lib/visit-rules"

export type MarkVisitResult =
    | { ok: true; type: VisitType }
    | { ok: false; reason: Exclude<VisitCheck, { ok: true }>["reason"] | "changed" | "error"; message: string }

async function loadState(mrId: string, today: string) {
    const [latest, [{ todayCount }]] = await Promise.all([
        db
            .select({ id: mrVisits.visitId, date: mrVisits.visitDate, type: mrVisits.visitType })
            .from(mrVisits)
            .where(eq(mrVisits.mrId, mrId))
            .orderBy(desc(mrVisits.visitDate), desc(mrVisits.createdAt))
            .limit(1),
        db.select({ todayCount: count() }).from(mrVisits).where(eq(mrVisits.visitDate, today)),
    ])

    const lastVisit: Visit | null = latest[0]
        ? { ...latest[0], type: latest[0].type === "senior" ? "senior" : "normal" }
        : null

    return { lastVisit, todayCount }
}

function isUniqueViolation(error: unknown) {
    const e = error as { code?: string; cause?: { code?: string } }
    return e?.code === "23505" || e?.cause?.code === "23505"
}

export async function markVisit(
    mrId: string,
    withSenior: boolean = false
): Promise<MarkVisitResult> {
    const today = todayIST()

    try {
        const { lastVisit, todayCount } = await loadState(mrId, today)

        const check = checkVisit({ lastVisit, today, todayCount, withSenior })

        if (!check.ok) {
            return { ok: false, reason: check.reason, message: checkMessage(check) }
        }

        // Insert under a per-day lock, and only if nothing changed since we checked:
        // today's count is still under the limit and the MR's latest visit is the same.
        // This stops two phones from both taking the 20th slot.
        const [, inserted] = await db.batch([
            db.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`mr_visits:${today}`}))`),
            db.execute(sql`
                INSERT INTO ${mrVisits} (mr_id, visit_date, visit_type)
                SELECT ${mrId}::uuid, ${today}::date, ${check.type}::text
                WHERE (SELECT COUNT(*) FROM ${mrVisits} WHERE visit_date = ${today}::date) < ${DAILY_LIMIT}
                  AND COALESCE((
                      SELECT visit_id::text FROM ${mrVisits}
                      WHERE mr_id = ${mrId}::uuid
                      ORDER BY visit_date DESC, created_at DESC
                      LIMIT 1
                  ), '') = ${lastVisit?.id ?? ""}
                RETURNING visit_id
            `),
        ])

        if (inserted.rows.length === 0) {
            // someone else got in first; report the current reason if there is one
            const current = await loadState(mrId, today)
            const recheck = checkVisit({ ...current, today, withSenior })

            return recheck.ok
                ? { ok: false, reason: "changed", message: "This MR's visits just changed. Please check again." }
                : { ok: false, reason: recheck.reason, message: checkMessage(recheck) }
        }

        revalidatePath("/")

        return { ok: true, type: check.type }
    } catch (error) {
        if (isUniqueViolation(error)) {
            return { ok: false, reason: "already-today", message: "This MR has already visited today." }
        }

        console.error("Mark visit failed:", error)
        return { ok: false, reason: "error", message: "Could not record the visit. Please try again." }
    }
}

export async function undoVisit(
    visitId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
    try {
        // only today's visits can be undone, so older history can't be rewritten
        const deleted = await db
            .delete(mrVisits)
            .where(and(eq(mrVisits.visitId, visitId), eq(mrVisits.visitDate, todayIST())))
            .returning({ id: mrVisits.visitId })

        if (deleted.length === 0) {
            return { ok: false, message: "Only visits recorded today can be undone." }
        }

        revalidatePath("/")

        return { ok: true }
    } catch (error) {
        console.error("Undo visit failed:", error)
        return { ok: false, message: "Could not undo the visit. Please try again." }
    }
}
