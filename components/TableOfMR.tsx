"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { markVisit } from "@/app/actions/mark-visits"

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

export function TableOfMR({
    data,
    page,
}: {
    data: any[]
    page: number
}) {

    const router = useRouter()
    const searchParams = useSearchParams()

    const [loading, setLoading] = useState<{
        id: string | null
        type: "normal" | "senior" | null
    }>({
        id: null,
        type: null,
    })

    const search = searchParams.get("search") || ""

    function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value

        const params = new URLSearchParams(searchParams)

        if (value) params.set("search", value)
        else params.delete("search")

        params.set("page", "1")

        router.push(`/?${params.toString()}`)
    }

    async function handleVisit(mrId: string, type: "normal" | "senior") {

        setLoading({ id: mrId, type })

        const result = await markVisit(mrId, type)

        setLoading({ id: null, type: null })

        if (!result?.success) {
            alert("Visit limit reached")
            return
        }

        router.refresh()
    }

    return (
        <div className="w-full space-y-6">

            <Input
                placeholder="Search MR..."
                defaultValue={search}
                onChange={handleSearch}
            />

            <Table>

                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Division</TableHead>
                        <TableHead>Visits</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>

                    {data.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-6">
                                No results found
                            </TableCell>
                        </TableRow>
                    )}

                    {data.map((mr) => {

                        // ✅ FIXED parsing (handles nulls safely)
                        const visits = (mr.visits || []).filter(Boolean)

                        const normalVisits = visits.filter((v: any) => v.type === "normal")
                        const seniorVisits = visits.filter((v: any) => v.type === "senior")

                        const hasSeniorVisit = seniorVisits.length > 0

                        return (
                            <TableRow key={mr.id}>

                                <TableCell className="font-medium">
                                    {mr.name}
                                </TableCell>

                                <TableCell>{mr.company}</TableCell>

                                <TableCell>{mr.division}</TableCell>

                                {/* VISIT COLUMN */}
                                <TableCell>

                                    {(() => {

                                        const visits = (mr.allVisits || []).filter(Boolean)

                                        const now = new Date()

                                        const isSameMonth = (date: string) => {
                                            const d = new Date(date)
                                            return (
                                                d.getMonth() === now.getMonth() &&
                                                d.getFullYear() === now.getFullYear()
                                            )
                                        }

                                        // split visits
                                        const thisMonthVisits = visits.filter((v: any) =>
                                            isSameMonth(v.date)
                                        )

                                        const previousVisits = visits.filter((v: any) =>
                                            !isSameMonth(v.date)
                                        )

                                        const normalVisits = thisMonthVisits.filter((v: any) => v.type === "normal")
                                        const seniorVisits = thisMonthVisits.filter((v: any) => v.type === "senior")

                                        // group previous visits by month
                                        const grouped: Record<string, any[]> = {}

                                        previousVisits.forEach((v: any) => {
                                            const d = new Date(v.date)
                                            const key = `${d.getMonth()}-${d.getFullYear()}`
                                            if (!grouped[key]) grouped[key] = []
                                            grouped[key].push(v)
                                        })

                                        return (
                                            <div className="flex flex-col gap-2 text-sm">

                                                {/* THIS MONTH */}
                                                <div>
                                                    <div className="font-semibold text-xs text-muted-foreground">
                                                        This Month
                                                    </div>

                                                    <div>
                                                        <span>
                                                            Visit 1:{" "}
                                                            {normalVisits[0]
                                                                ? new Date(normalVisits[0].date).toLocaleDateString()
                                                                : "—"}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            Visit 2:{" "}
                                                            {normalVisits[1]
                                                                ? new Date(normalVisits[1].date).toLocaleDateString()
                                                                : "—"}
                                                        </span>
                                                    </div>

                                                    {seniorVisits.map((v: any, i: number) => (
                                                        <div key={i} className="text-blue-600">
                                                            Senior: {new Date(v.date).toLocaleDateString()}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* PREVIOUS MONTHS */}
                                                {Object.keys(grouped).length > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-xs text-muted-foreground mt-1">
                                                            Previous
                                                        </div>

                                                        {Object.entries(grouped).map(([key, visits]) => {

                                                            const [month, year] = key.split("-")
                                                            const date = new Date(Number(year), Number(month))

                                                            return (
                                                                <div key={key} className="text-xs text-gray-500">
                                                                    {date.toLocaleString("default", {
                                                                        month: "short",
                                                                        year: "numeric",
                                                                    })} → {visits.length} visits
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}

                                            </div>
                                        )
                                    })()}

                                </TableCell>
                                {/* ACTION COLUMN */}
                                <TableCell className="text-right">

                                    <div className="flex gap-2 justify-end">

                                        {/* NORMAL VISIT */}
                                        <Button
                                            className="cursor-pointer"
                                            size="sm"
                                            disabled={
                                                mr.visitsThisMonth >= 2 ||
                                                (loading.id === mr.id && loading.type === "normal")
                                            }
                                            onClick={() => handleVisit(mr.id, "normal")}
                                        >
                                            {loading.id === mr.id && loading.type === "normal"
                                                ? "..."
                                                : "Mark Visit"}
                                        </Button>

                                        {/* SENIOR VISIT */}
                                        <Button
                                            className="cursor-pointer"
                                            size="sm"
                                            variant="secondary"
                                            disabled={
                                                hasSeniorVisit ||
                                                (loading.id === mr.id && loading.type === "senior")
                                            }
                                            onClick={() => handleVisit(mr.id, "senior")}
                                        >
                                            {loading.id === mr.id && loading.type === "senior"
                                                ? "..."
                                                : hasSeniorVisit
                                                    ? "Senior Used"
                                                    : "Senior Visit"}
                                        </Button>

                                    </div>

                                </TableCell>

                            </TableRow>
                        )
                    })}

                </TableBody>

            </Table>

            {/* PAGINATION */}
            <div className="flex gap-4">

                <Button
                    variant="outline"
                    onClick={() =>
                        router.push(`/?page=${page - 1}&search=${search}`)
                    }
                    disabled={page <= 1}
                >
                    Previous
                </Button>

                <Button
                    variant="outline"
                    onClick={() =>
                        router.push(`/?page=${page + 1}&search=${search}`)
                    }
                >
                    Next
                </Button>

            </div>

        </div>
    )
}
