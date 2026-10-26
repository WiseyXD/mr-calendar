import { CalendarX } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { addDays, formatDate, isVisitDay, nextVisitDay } from "@/lib/visit-rules"
import { UndoVisitButton } from "./UndoVisitButton"

export type TodayVisitItem = {
    id: string
    type: string | null
    time: string
    name: string
    company: string
    division: string
}

export function TodayVisits({ visits, today }: { visits: TodayVisitItem[]; today: string }) {
    if (visits.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-12 text-center">
                <CalendarX className="size-8 text-muted-foreground" />
                <p className="font-medium">No MR visits recorded today</p>
                {!isVisitDay(today) && (
                    <p className="text-sm text-muted-foreground">
                        Visits are only on Tuesday and Thursday. Next: {formatDate(nextVisitDay(addDays(today, 1)))}
                    </p>
                )}
            </div>
        )
    }

    return (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visits.map((visit, i) => (
                <li key={visit.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="truncate font-medium">
                                <span className="mr-1.5 text-muted-foreground tabular-nums">{visits.length - i}.</span>
                                {visit.name}
                            </div>
                            <div className="truncate text-sm text-muted-foreground">
                                {visit.company} · {visit.division}
                            </div>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{visit.time}</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        {visit.type === "senior" ? (
                            <Badge variant="warning">With senior</Badge>
                        ) : (
                            <Badge variant="outline">Normal</Badge>
                        )}
                        <UndoVisitButton visitId={visit.id} />
                    </div>
                </li>
            ))}
        </ul>
    )
}
