"use client"

import { useRouter } from "next/navigation"

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

    function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value
        router.push(`/?search=${value}`)
    }

    return (
        <div className="w-full space-y-6">

            <Input
                placeholder="Search MR..."
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
                    {data.map((mr) => (
                        <TableRow key={mr.id}>
                            <TableCell className="font-medium">{mr.name}</TableCell>
                            <TableCell>{mr.company}</TableCell>
                            <TableCell>{mr.division}</TableCell>

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
                                    disabled={mr.visitsThisMonth >= 2}
                                    variant={
                                        mr.visitsThisMonth >= 2 ? "destructive" : "default"
                                    }
                                >
                                    {mr.visitsThisMonth >= 2
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
                    onClick={() => router.push(`/?page=${page - 1}`)}
                    disabled={page <= 1}
                >
                    Previous
                </Button>

                <Button
                    variant="outline"
                    onClick={() => router.push(`/?page=${page + 1}`)}
                >
                    Next
                </Button>

            </div>
        </div>
    )
}
