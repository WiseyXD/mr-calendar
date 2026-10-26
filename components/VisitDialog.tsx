"use client"

import { useState, useTransition, type ComponentType, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Ban, CalendarCheck, CalendarX, CircleCheck, Clock, Loader2 } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { markVisit, type MarkVisitResult } from "@/app/actions/mark-visits"
import type { MRRow } from "@/app/actions/get-mrs"
import {
    COOLDOWN_DAYS,
    DAILY_LIMIT,
    addDays,
    daysBetween,
    formatDate,
    getMrStatus,
    isVisitDay,
    nextVisitDay,
} from "@/lib/visit-rules"
import { cn } from "@/lib/utils"
import { statusSummary } from "./StatusBadge"
import { UndoVisitButton } from "./UndoVisitButton"

const TONES = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    danger: "border-red-200 bg-red-50 text-red-900",
    info: "border-sky-200 bg-sky-50 text-sky-900",
}

function Verdict({
    tone,
    icon: Icon,
    title,
    children,
}: {
    tone: keyof typeof TONES
    icon: ComponentType<{ className?: string }>
    title: string
    children: ReactNode
}) {
    return (
        <div role="status" className={cn("rounded-lg border p-4", TONES[tone])}>
            <div className="flex items-center gap-2 text-base font-semibold">
                <Icon className="size-5 shrink-0" />
                {title}
            </div>
            <div className="mt-1.5 space-y-1 leading-relaxed">{children}</div>
        </div>
    )
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

export function VisitDialog({
    mr,
    open,
    session,
    today,
    todayCount,
    onOpenChange,
}: {
    mr: MRRow | null
    open: boolean
    // bumped on every open so the popup starts fresh
    session: number
    today: string
    todayCount: number
    onOpenChange: (open: boolean) => void
}) {
    return (
        <Dialog open={open && mr !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                {mr && (
                    <VisitCheck
                        key={`${mr.id}-${session}`}
                        mr={mr}
                        today={today}
                        todayCount={todayCount}
                        onClose={() => onOpenChange(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}

function VisitCheck({
    mr,
    today,
    todayCount,
    onClose,
}: {
    mr: MRRow
    today: string
    todayCount: number
    onClose: () => void
}) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [result, setResult] = useState<MarkVisitResult | null>(null)

    const lastVisit = mr.visits[0] ?? null
    const status = getMrStatus(lastVisit, today)
    const visitDay = isVisitDay(today)
    const dayFull = todayCount >= DAILY_LIMIT

    function confirm(withSenior: boolean) {
        startTransition(async () => {
            const res = await markVisit(mr.id, withSenior)
            setResult(res)
            router.refresh()
        })
    }

    const header = (
        <DialogHeader>
            <DialogTitle>{mr.name}</DialogTitle>
            <DialogDescription>
                {mr.company} · {mr.division}
            </DialogDescription>
        </DialogHeader>
    )

    if (result?.ok) {
        return (
            <>
                {header}
                <Verdict tone="success" icon={CircleCheck} title="Visit recorded">
                    <p>
                        {result.type === "senior"
                            ? "Recorded as a visit with a senior. His senior visit is now used."
                            : "Recorded as a normal visit."}
                    </p>
                    <p>
                        Next visit allowed from{" "}
                        <strong>{formatDate(nextVisitDay(addDays(today, COOLDOWN_DAYS)))}</strong>
                        {result.type === "normal" && ", or earlier only with a senior"}.
                    </p>
                </Verdict>
                <DialogFooter>
                    <Button className="h-11 cursor-pointer sm:h-9" onClick={onClose}>
                        Done
                    </Button>
                </DialogFooter>
            </>
        )
    }

    let verdict: ReactNode
    let action: { label: string; withSenior: boolean } | null = null

    if (status.kind === "visited-today") {
        verdict = (
            <Verdict tone="info" icon={CalendarCheck} title="Already visited today">
                <p>
                    Recorded {status.lastVisit.type === "senior" ? "as a visit with a senior" : "as a normal visit"}.
                    Entered by mistake? You can undo it until the end of today.
                </p>
            </Verdict>
        )
    } else if (!visitDay || dayFull) {
        verdict = (
            <Verdict tone="danger" icon={CalendarX} title="Not allowed today">
                {!visitDay ? (
                    <>
                        <p>MR visits are only on Tuesday and Thursday.</p>
                        <p>
                            Next visit day: <strong>{formatDate(nextVisitDay(addDays(today, 1)))}</strong>
                        </p>
                    </>
                ) : (
                    <p>Today&apos;s limit of {DAILY_LIMIT} MR visits has been reached.</p>
                )}
                <p className="text-sm opacity-80">MR status: {statusSummary(status)}</p>
            </Verdict>
        )
    } else if (status.kind === "ready") {
        verdict = (
            <Verdict tone="success" icon={CircleCheck} title="Allowed">
                <p>
                    {status.lastVisit
                        ? `Last visit ${formatDate(status.lastVisit.date)} (${plural(daysBetween(status.lastVisit.date, today), "day")} ago).`
                        : "First visit, no previous visits."}
                </p>
            </Verdict>
        )
        action = { label: "Confirm visit", withSenior: false }
    } else if (status.kind === "senior-only") {
        verdict = (
            <Verdict tone="warning" icon={Clock} title="Only with a senior">
                <p>
                    Last visit {formatDate(status.lastVisit.date)}. In cooldown until{" "}
                    <strong>{formatDate(status.nextEligible)}</strong>.
                </p>
                <p>
                    Allowed today <strong>only if a senior is with him</strong>. This uses his senior visit and
                    restarts the {COOLDOWN_DAYS}-day cooldown.
                </p>
            </Verdict>
        )
        action = { label: "Confirm visit with senior", withSenior: true }
    } else {
        verdict = (
            <Verdict tone="danger" icon={Ban} title="Not allowed">
                <p>
                    Visited {formatDate(status.lastVisit.date)} with a senior, so his senior visit is already used.
                </p>
                <p>
                    Next eligible: <strong>{formatDate(status.nextEligible)}</strong> (
                    {plural(daysBetween(today, status.nextEligible), "day")}).
                </p>
            </Verdict>
        )
    }

    return (
        <>
            {header}

            {verdict}

            {result && !result.ok && (
                <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-destructive">
                    {result.message}
                </p>
            )}

            {mr.visits.length > 0 && (
                <div>
                    <div className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        Recent visits
                    </div>
                    <ul className="divide-y rounded-lg border">
                        {mr.visits.map((v) => (
                            <li key={v.id} className="flex items-center justify-between gap-2 px-3 py-2">
                                <span>{formatDate(v.date, { year: true })}</span>
                                {v.type === "senior" ? (
                                    <Badge variant="warning">With senior</Badge>
                                ) : (
                                    <span className="text-xs text-muted-foreground">Normal</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <DialogFooter>
                <Button variant="outline" className="h-11 cursor-pointer sm:h-9" onClick={onClose}>
                    {action ? "Cancel" : "Close"}
                </Button>
                {status.kind === "visited-today" && <UndoVisitButton visitId={status.lastVisit.id} />}
                {action && (
                    <Button
                        className="h-11 cursor-pointer sm:h-9"
                        disabled={pending}
                        onClick={() => confirm(action.withSenior)}
                    >
                        {pending && <Loader2 className="animate-spin" />}
                        {action.label}
                    </Button>
                )}
            </DialogFooter>

            {visitDay && (
                <p className="-mt-1 text-center text-xs text-muted-foreground sm:text-right">
                    Today: {todayCount} / {DAILY_LIMIT} visits
                </p>
            )}
        </>
    )
}
