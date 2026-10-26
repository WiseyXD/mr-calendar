import { Ban, CalendarCheck, CircleCheck, Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { formatDate, type MrStatus } from "@/lib/visit-rules"

const STATUS = {
    ready: { label: "Ready", variant: "success", Icon: CircleCheck },
    "senior-only": { label: "Senior only", variant: "warning", Icon: Clock },
    blocked: { label: "Blocked", variant: "danger", Icon: Ban },
    "visited-today": { label: "Visited today", variant: "info", Icon: CalendarCheck },
} as const

export function StatusBadge({ status }: { status: MrStatus }) {
    const { label, variant, Icon } = STATUS[status.kind]

    return (
        <Badge variant={variant}>
            <Icon />
            {label}
        </Badge>
    )
}

// one-line summary shown under the MR's name
export function statusSummary(status: MrStatus): string {
    switch (status.kind) {
        case "ready":
            return status.lastVisit ? `Last visit ${formatDate(status.lastVisit.date)}` : "No visits yet"
        case "senior-only":
            return `Last visit ${formatDate(status.lastVisit.date)} · Free ${formatDate(status.nextEligible)}`
        case "blocked":
            return `Visited ${formatDate(status.lastVisit.date)} with senior · Free ${formatDate(status.nextEligible)}`
        case "visited-today":
            return status.lastVisit.type === "senior" ? "Visited today with senior" : "Visited today"
    }
}
