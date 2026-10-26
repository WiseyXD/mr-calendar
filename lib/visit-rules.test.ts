import { describe, expect, test } from "bun:test"
import {
    addDays,
    checkVisit,
    formatDate,
    formatTimeIST,
    getMrStatus,
    isVisitDay,
    nextVisitDay,
    todayIST,
    type Visit,
} from "./visit-rules"

const visit = (date: string, type: Visit["type"] = "normal"): Visit => ({ id: date, date, type })

const base = { todayCount: 0, withSenior: false }

describe("calendar helpers", () => {
    test("Tue and Thu are visit days", () => {
        expect(isVisitDay("2026-10-27")).toBe(true) // Tue
        expect(isVisitDay("2026-10-29")).toBe(true) // Thu
        expect(isVisitDay("2026-10-26")).toBe(false) // Mon
        expect(isVisitDay("2026-10-31")).toBe(false) // Sat
    })

    test("nextVisitDay rolls forward to Tue/Thu", () => {
        expect(nextVisitDay("2026-10-27")).toBe("2026-10-27")
        expect(nextVisitDay("2026-10-28")).toBe("2026-10-29")
        expect(nextVisitDay("2026-10-30")).toBe("2026-11-03")
    })

    test("addDays crosses month boundaries", () => {
        expect(addDays("2026-10-13", 30)).toBe("2026-11-12")
    })

    test("todayIST uses India time, not UTC", () => {
        // 20:00 UTC on Mon 26 Oct is 01:30 Tue 27 Oct in India
        expect(todayIST(new Date("2026-10-26T20:00:00Z"))).toBe("2026-10-27")
    })
})

describe("the agreed timeline", () => {
    test("normal → senior bypass → blocked → eligible", () => {
        // Tue 6 Oct: first visit
        expect(checkVisit({ ...base, lastVisit: null, today: "2026-10-06" })).toEqual({ ok: true, type: "normal" })

        // Tue 13 Oct: in cooldown, needs a senior
        const afterNormal = visit("2026-10-06")
        expect(checkVisit({ ...base, lastVisit: afterNormal, today: "2026-10-13" })).toEqual({
            ok: false,
            reason: "needs-senior",
            nextEligible: "2026-11-05",
        })
        expect(
            checkVisit({ ...base, lastVisit: afterNormal, today: "2026-10-13", withSenior: true })
        ).toEqual({ ok: true, type: "senior" })

        // Tue 27 Oct: senior bypass already used, cooldown runs to 12 Nov
        const afterSenior = visit("2026-10-13", "senior")
        expect(
            checkVisit({ ...base, lastVisit: afterSenior, today: "2026-10-27", withSenior: true })
        ).toEqual({ ok: false, reason: "cooldown", nextEligible: "2026-11-12" })

        // Thu 12 Nov: eligible again
        expect(checkVisit({ ...base, lastVisit: afterSenior, today: "2026-11-12" })).toEqual({
            ok: true,
            type: "normal",
        })
    })
})

describe("cooldown", () => {
    test("eligible exactly 30 days after the last visit", () => {
        expect(getMrStatus(visit("2026-10-13"), "2026-11-11").kind).toBe("senior-only")
        expect(getMrStatus(visit("2026-10-13"), "2026-11-12").kind).toBe("ready")
    })

    test("next eligible date lands on a Tue/Thu", () => {
        // Thu 1 Oct + 30 = Sat 31 Oct → Tue 3 Nov
        const status = getMrStatus(visit("2026-10-01", "senior"), "2026-10-20")
        expect(status).toMatchObject({ kind: "blocked", cooldownEnds: "2026-10-31", nextEligible: "2026-11-03" })
    })

    test("eligible MR who brings a senior is recorded as normal", () => {
        expect(
            checkVisit({ ...base, lastVisit: visit("2026-09-01"), today: "2026-10-27", withSenior: true })
        ).toEqual({ ok: true, type: "normal" })
    })

    test("a second visit on the same day is refused, even with a senior", () => {
        expect(
            checkVisit({ ...base, lastVisit: visit("2026-10-27"), today: "2026-10-27", withSenior: true })
        ).toEqual({ ok: false, reason: "already-today" })
    })
})

describe("day rules", () => {
    test("refused on non-visit days", () => {
        expect(checkVisit({ ...base, lastVisit: null, today: "2026-10-26" })).toEqual({
            ok: false,
            reason: "not-visit-day",
            nextVisitDay: "2026-10-27",
        })
        // on a Tuesday the next visit day is Thursday, not today
        expect(checkVisit({ ...base, lastVisit: null, today: "2026-10-28" })).toMatchObject({
            nextVisitDay: "2026-10-29",
        })
    })

    test("20 visits per day, senior visits included", () => {
        expect(checkVisit({ ...base, lastVisit: null, today: "2026-10-27", todayCount: 19 }).ok).toBe(true)
        expect(
            checkVisit({ lastVisit: visit("2026-10-20"), today: "2026-10-27", todayCount: 20, withSenior: true })
        ).toEqual({ ok: false, reason: "daily-limit" })
    })
})

describe("formatting", () => {
    test("dates and IST times", () => {
        expect(formatDate("2026-10-13")).toBe("Tue 13 Oct")
        expect(formatDate("2026-10-13", { year: true })).toBe("Tue 13 Oct 2026")
        expect(formatTimeIST(new Date("2026-10-27T04:35:00Z"))).toBe("10:05 AM")
        expect(formatTimeIST(new Date("2026-10-27T18:40:00Z"))).toBe("12:10 AM")
    })
})
