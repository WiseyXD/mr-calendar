"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, Loader2, Search, UserRoundSearch } from "lucide-react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { MRRow } from "@/app/actions/get-mrs"
import { formatDate, getMrStatus } from "@/lib/visit-rules"
import { StatusBadge, statusSummary } from "./StatusBadge"
import { VisitDialog } from "./VisitDialog"

export function MrDirectory({
    rows,
    total,
    page,
    pageSize,
    today,
    todayCount,
}: {
    rows: MRRow[]
    total: number
    page: number
    pageSize: number
    today: string
    todayCount: number
}) {

    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const currentSearch = searchParams.get("search") ?? ""
    const [query, setQuery] = useState(currentSearch)

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [session, setSession] = useState(0)

    // look the MR up in the latest rows so the popup updates after a refresh
    const selected = rows.find((r) => r.id === selectedId) ?? null

    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    // wait until typing stops before searching
    useEffect(() => {
        const value = query.trim()
        if (value === currentSearch) return

        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams)
            if (value) params.set("search", value)
            else params.delete("search")
            params.delete("page")

            const qs = params.toString()
            startTransition(() => router.replace(qs ? `/?${qs}` : "/", { scroll: false }))
        }, 300)

        return () => clearTimeout(timer)
    }, [query, currentSearch, searchParams, router])

    function goToPage(next: number) {
        const params = new URLSearchParams(searchParams)
        if (next > 1) params.set("page", String(next))
        else params.delete("page")

        const qs = params.toString()
        startTransition(() => router.push(qs ? `/?${qs}` : "/"))
    }

    function openMR(id: string) {
        setSelectedId(id)
        setSession((s) => s + 1)
        setDialogOpen(true)
    }

    return (
        <div className="space-y-4">

            <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    inputMode="search"
                    enterKeyHint="search"
                    aria-label="Search MRs"
                    placeholder="Search name or company"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-11 pr-9 pl-9 md:h-9"
                />
                {isPending && (
                    <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
            </div>

            {rows.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-12 text-center">
                    <UserRoundSearch className="size-8 text-muted-foreground" />
                    <p className="font-medium">
                        {currentSearch ? `No MRs match "${currentSearch}"` : "No MRs registered yet"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {currentSearch ? "Check the spelling, or add him with Add MR." : "Use Add MR to register one."}
                    </p>
                </div>
            ) : (
                <>
                    {/* phones and iPad portrait */}
                    <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
                        {rows.map((mr) => {
                            const status = getMrStatus(mr.visits[0] ?? null, today)

                            return (
                                <li key={mr.id}>
                                    <button
                                        type="button"
                                        onClick={() => openMR(mr.id)}
                                        className="flex h-full w-full cursor-pointer flex-col gap-2 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:bg-muted"
                                    >
                                        <div className="flex w-full items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="truncate font-medium">{mr.name}</div>
                                                <div className="truncate text-sm text-muted-foreground">
                                                    {mr.company} · {mr.division}
                                                </div>
                                            </div>
                                            <StatusBadge status={status} />
                                        </div>
                                        <div className="text-xs text-muted-foreground">{statusSummary(status)}</div>
                                    </button>
                                </li>
                            )
                        })}
                    </ul>

                    {/* iPad landscape and desktop */}
                    <div className="hidden rounded-xl border lg:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-4">Name</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Division</TableHead>
                                    <TableHead>Last visit</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="pr-4 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {rows.map((mr) => {
                                    const lastVisit = mr.visits[0] ?? null
                                    const status = getMrStatus(lastVisit, today)

                                    return (
                                        <TableRow key={mr.id}>
                                            <TableCell className="pl-4 font-medium">{mr.name}</TableCell>
                                            <TableCell>{mr.company}</TableCell>
                                            <TableCell>{mr.division}</TableCell>
                                            <TableCell>
                                                {lastVisit ? (
                                                    <>
                                                        {formatDate(lastVisit.date, { year: true })}
                                                        {lastVisit.type === "senior" && (
                                                            <span className="ml-1 text-xs text-amber-700">(senior)</span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col items-start gap-0.5">
                                                    <StatusBadge status={status} />
                                                    {(status.kind === "senior-only" || status.kind === "blocked") && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Free {formatDate(status.nextEligible)}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-4 text-right">
                                                <Button
                                                    variant="outline"
                                                    className="cursor-pointer"
                                                    onClick={() => openMR(mr.id)}
                                                >
                                                    Check visit
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}

            {/* PAGINATION */}
            {total > 0 && (
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                        Page {page} of {totalPages} · {total} {total === 1 ? "MR" : "MRs"}
                    </p>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="h-10 cursor-pointer md:h-8"
                            disabled={page <= 1 || isPending}
                            onClick={() => goToPage(page - 1)}
                        >
                            <ChevronLeft />
                            Prev
                        </Button>

                        <Button
                            variant="outline"
                            className="h-10 cursor-pointer md:h-8"
                            disabled={page >= totalPages || isPending}
                            onClick={() => goToPage(page + 1)}
                        >
                            Next
                            <ChevronRight />
                        </Button>
                    </div>
                </div>
            )}

            <VisitDialog
                mr={selected}
                open={dialogOpen}
                session={session}
                today={today}
                todayCount={todayCount}
                onOpenChange={setDialogOpen}
            />

        </div>
    )
}
