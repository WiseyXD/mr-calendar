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

    const [loadingId, setLoadingId] = useState<string | null>(null)

    const search = searchParams.get("search") || ""

    function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {

        const value = e.target.value

        const params = new URLSearchParams(searchParams)

        if (value) {
            params.set("search", value)
        } else {
            params.delete("search")
        }

        params.set("page", "1")

        router.push(`/?${params.toString()}`)
    }

    async function handleVisit(mrId: string) {

        setLoadingId(mrId)

        const result = await markVisit(mrId)

        setLoadingId(null)

        if (result?.success) {
            router.refresh()
        }
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

                    {data.map((mr) => (
                        <TableRow key={mr.id}>

                            <TableCell className="font-medium">
                                {mr.name}
                            </TableCell>

                            <TableCell>
                                {mr.company}
                            </TableCell>

                            <TableCell>
                                {mr.division}
                            </TableCell>

                            <TableCell>
                                <span
                                    className={
                                        mr.visitsThisMonth === 2
                                            ? "text-red-500 font-semibold"
                                            : "text-green-600"
                                    }
                                >
                                    {mr.visitsThisMonth} / 2
                                </span>
                            </TableCell>

                            <TableCell className="text-right">

                                <Button
                                    size="sm"
                                    disabled={
                                        mr.visitsThisMonth >= 2 ||
                                        loadingId === mr.id
                                    }
                                    variant={
                                        mr.visitsThisMonth >= 2
                                            ? "destructive"
                                            : "default"
                                    }
                                    onClick={() => handleVisit(mr.id)}
                                >
                                    {loadingId === mr.id
                                        ? "Marking..."
                                        : mr.visitsThisMonth >= 2
                                            ? "Limit Reached"
                                            : "Mark Visit"}
                                </Button>

                            </TableCell>

                        </TableRow>
                    ))}

                </TableBody>

            </Table>

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
