"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Undo2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { undoVisit } from "@/app/actions/mark-visits"
import { cn } from "@/lib/utils"

// Two taps to undo, so a stray tap can't delete a visit
export function UndoVisitButton({
    visitId,
    className,
}: {
    visitId: string
    className?: string
}) {
    const router = useRouter()
    const [armed, setArmed] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    useEffect(() => {
        if (!armed) return
        const timer = setTimeout(() => setArmed(false), 4000)
        return () => clearTimeout(timer)
    }, [armed])

    function handleClick() {
        if (!armed) {
            setError(null)
            setArmed(true)
            return
        }

        startTransition(async () => {
            const result = await undoVisit(visitId)

            if (!result.ok) {
                setError(result.message)
                setArmed(false)
                return
            }

            router.refresh()
        })
    }

    return (
        <div className={cn("flex flex-col items-stretch gap-1 sm:items-end", className)}>
            <Button
                type="button"
                variant={armed ? "destructive" : "outline"}
                className="h-11 cursor-pointer sm:h-9"
                disabled={pending}
                onClick={handleClick}
            >
                {pending ? <Loader2 className="animate-spin" /> : <Undo2 />}
                {armed ? "Tap again to undo" : "Undo"}
            </Button>
            {error && (
                <span role="alert" className="text-xs text-destructive">
                    {error}
                </span>
            )}
        </div>
    )
}
