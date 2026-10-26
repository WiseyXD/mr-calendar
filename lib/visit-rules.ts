// Shared visit rules. Used by the server actions (authoritative) and the UI
// (for showing status), so both always agree. All dates are IST calendar
// dates as "YYYY-MM-DD" strings.

export const TIME_ZONE = "Asia/Kolkata"
export const COOLDOWN_DAYS = 30
export const DAILY_LIMIT = 20
export const VISIT_WEEKDAYS = [2, 4] // Tuesday, Thursday

export type VisitType = "normal" | "senior"

export type Visit = {
    id: string
    date: string
    type: VisitType
}

export type MrStatus =
    | { kind: "ready"; lastVisit: Visit | null }
    // in cooldown after a normal visit: allowed only with a senior
    | { kind: "senior-only"; lastVisit: Visit; cooldownEnds: string; nextEligible: string }
    // in cooldown after a senior visit: not allowed at all
    | { kind: "blocked"; lastVisit: Visit; cooldownEnds: string; nextEligible: string }
    | { kind: "visited-today"; lastVisit: Visit }

export type VisitCheck =
    | { ok: true; type: VisitType }
    | { ok: false; reason: "not-visit-day"; nextVisitDay: string }
    | { ok: false; reason: "daily-limit" }
    | { ok: false; reason: "already-today" }
    | { ok: false; reason: "needs-senior"; nextEligible: string }
    | { ok: false; reason: "cooldown"; nextEligible: string }

export function todayIST(now: Date = new Date()): string {
    // en-CA formats as YYYY-MM-DD
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(now)
}

function toUTCDate(date: string) {
    return new Date(`${date}T00:00:00Z`)
}

export function addDays(date: string, days: number): string {
    const d = toUTCDate(date)
    d.setUTCDate(d.getUTCDate() + days)
    return d.toISOString().slice(0, 10)
}

export function daysBetween(from: string, to: string): number {
    return Math.round((toUTCDate(to).getTime() - toUTCDate(from).getTime()) / 86_400_000)
}

export function isVisitDay(date: string): boolean {
    return VISIT_WEEKDAYS.includes(toUTCDate(date).getUTCDay())
}

// First Tue/Thu on or after `date`
export function nextVisitDay(date: string): string {
    let d = date
    while (!isVisitDay(d)) d = addDays(d, 1)
    return d
}

export function getMrStatus(lastVisit: Visit | null, today: string): MrStatus {
    if (!lastVisit) return { kind: "ready", lastVisit: null }

    if (lastVisit.date === today) return { kind: "visited-today", lastVisit }

    const cooldownEnds = addDays(lastVisit.date, COOLDOWN_DAYS)

    if (today >= cooldownEnds) return { kind: "ready", lastVisit }

    const nextEligible = nextVisitDay(cooldownEnds)

    return lastVisit.type === "senior"
        ? { kind: "blocked", lastVisit, cooldownEnds, nextEligible }
        : { kind: "senior-only", lastVisit, cooldownEnds, nextEligible }
}

export function checkVisit({
    lastVisit,
    today,
    todayCount,
    withSenior,
}: {
    lastVisit: Visit | null
    today: string
    todayCount: number
    withSenior: boolean
}): VisitCheck {
    if (!isVisitDay(today)) {
        return { ok: false, reason: "not-visit-day", nextVisitDay: nextVisitDay(addDays(today, 1)) }
    }

    if (todayCount >= DAILY_LIMIT) return { ok: false, reason: "daily-limit" }

    const status = getMrStatus(lastVisit, today)

    switch (status.kind) {
        case "visited-today":
            return { ok: false, reason: "already-today" }
        // an eligible MR who brings a senior hasn't skipped anything, so it's a normal visit
        case "ready":
            return { ok: true, type: "normal" }
        case "senior-only":
            return withSenior
                ? { ok: true, type: "senior" }
                : { ok: false, reason: "needs-senior", nextEligible: status.nextEligible }
        case "blocked":
            return { ok: false, reason: "cooldown", nextEligible: status.nextEligible }
    }
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// "Tue 13 Oct". Formatted by hand (not toLocaleDateString) so the server
// render and the phone's browser always produce identical text.
export function formatDate(date: string, opts: { year?: boolean } = {}): string {
    const d = toUTCDate(date)
    const text = `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
    return opts.year ? `${text} ${d.getUTCFullYear()}` : text
}

// "10:05 AM" in IST (India has no daylight saving, so a fixed offset is exact)
export function formatTimeIST(at: Date): string {
    const d = new Date(at.getTime() + 330 * 60_000)
    const h = d.getUTCHours()
    const m = String(d.getUTCMinutes()).padStart(2, "0")
    return `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`
}

export function checkMessage(check: Exclude<VisitCheck, { ok: true }>): string {
    switch (check.reason) {
        case "not-visit-day":
            return `MR visits are only on Tuesday and Thursday. Next visit day: ${formatDate(check.nextVisitDay)}.`
        case "daily-limit":
            return `Today's limit of ${DAILY_LIMIT} MR visits has been reached.`
        case "already-today":
            return "This MR has already visited today."
        case "needs-senior":
            return `In cooldown until ${formatDate(check.nextEligible)}. Allowed today only with a senior.`
        case "cooldown":
            return `Senior visit already used. Next eligible: ${formatDate(check.nextEligible)}.`
    }
}
