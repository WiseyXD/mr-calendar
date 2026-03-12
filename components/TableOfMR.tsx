import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"

const mrs = [
    {
        id: "1",
        name: "Rahul Sharma",
        company: "Pfizer",
        division: "Cardiology",
        visitsThisMonth: 1,
    },
    {
        id: "2",
        name: "Anita Mehta",
        company: "Cipla",
        division: "Diabetes",
        visitsThisMonth: 2,
    },
    {
        id: "3",
        name: "Amit Kulkarni",
        company: "Sun Pharma",
        division: "Neurology",
        visitsThisMonth: 0,
    },
]

export function TableOfMR() {
    return (
        <Table>
            <TableCaption>Medical Representative Visit Log</TableCaption>

            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Division</TableHead>
                    <TableHead>Visits This Month</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {mrs.map((mr) => (
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
                                variant={mr.visitsThisMonth >= 2 ? "destructive" : "default"}
                            >
                                {mr.visitsThisMonth >= 2 ? "Limit Reached" : "Mark Visit"}
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
