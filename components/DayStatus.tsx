import { CalendarCheck, CalendarX } from "lucide-react"

import { DAILY_LIMIT, addDays, formatDate, isVisitDay, nextVisitDay } from "@/lib/visit-rules"
import { cn } from "@/lib/utils"

export function DayStatus({ today, count }: { today: string; count: number }) {
    const visitDay = isVisitDay(today)
    const full = count >= DAILY_LIMIT

    return (
        <section
            aria-label="Today"
            className="sticky top-14 z-20 -mx-4 border-b bg-background/95 px-4 py-3 supports-backdrop-filter:backdrop-blur"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                    {visitDay ? (
                        <CalendarCheck className="size-5 shrink-0 text-emerald-600" />
                    ) : (
                        <CalendarX className="size-5 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                        <div className="text-sm font-semibold">{formatDate(today, { year: true })}</div>
                        <div className="truncate text-xs text-muted-foreground">
                            {!visitDay
                                ? `No MR visits today · Next: ${formatDate(nextVisitDay(addDays(today, 1)))}`
                                : full
                                    ? "Visit day · Limit reached"
                                    : `Visit day · ${DAILY_LIMIT - count} slots left`}
                        </div>
                    </div>
                </div>

                {visitDay && (
                    <div className="shrink-0 text-right tabular-nums">
                        <span className={cn("text-xl font-semibold", full && "text-red-600")}>{count}</span>
                        <span className="text-sm text-muted-foreground"> / {DAILY_LIMIT}</span>
                    </div>
                )}
            </div>

            {visitDay && (
                <div
                    role="progressbar"
                    aria-label="MR visits today"
                    aria-valuemin={0}
                    aria-valuemax={DAILY_LIMIT}
                    aria-valuenow={count}
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                >
                    <div
                        className={cn("h-full rounded-full transition-all", full ? "bg-red-500" : "bg-emerald-500")}
                        style={{ width: `${Math.min(100, (count / DAILY_LIMIT) * 100)}%` }}
                    />
                </div>
            )}
        </section>
    )
}
