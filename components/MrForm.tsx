"use client"

import { useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
    Field,
    FieldContent,
    FieldDescription,
    FieldLabel,
    FieldError,
} from "@/components/ui/field"

import { CircleCheck, Info, Loader2, TriangleAlert } from "lucide-react"

import { addMR, type AddMRResult } from "@/app/actions/add-mr"
import { findMatchingMRs } from "@/app/actions/search-mr"
import { mrSchema, type MRInput } from "@/lib/mr-schema"
import { COOLDOWN_DAYS, addDays, formatDate, isVisitDay, nextVisitDay, todayIST } from "@/lib/visit-rules"

type Matches = Awaited<ReturnType<typeof findMatchingMRs>>

const FIELDS = [
    { name: "name", label: "Name", placeholder: "Rahul Sharma", enterKeyHint: "next" },
    { name: "company", label: "Company", placeholder: "Pfizer", enterKeyHint: "next" },
    { name: "division", label: "Division", placeholder: "Cardiology", enterKeyHint: "done" },
] as const

export function MRForm({
    onSuccess,
}: {
    onSuccess?: () => void
}) {

    const [loading, setLoading] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [matches, setMatches] = useState<Matches>({ exact: null, similar: [] })
    const [checking, setChecking] = useState(false)
    const checkId = useRef(0)

    // today's date on this device; the server decides for real when saving
    const [today] = useState(() => todayIST())
    const visitDay = isVisitDay(today)
    const [visitingToday, setVisitingToday] = useState(visitDay)
    const [added, setAdded] = useState<Extract<AddMRResult, { success: true }> | null>(null)

    const form = useForm<MRInput>({
        resolver: zodResolver(mrSchema),
        mode: "onTouched",
        defaultValues: {
            name: "",
            company: "",
            division: "",
        },
    })

    const values = useWatch({ control: form.control })

    // check for duplicates / similar names once typing pauses
    useEffect(() => {
        const input = {
            name: values.name ?? "",
            company: values.company ?? "",
            division: values.division ?? "",
        }

        const id = ++checkId.current

        if (input.name.trim().length < 3) {
            setMatches({ exact: null, similar: [] })
            setChecking(false)
            return
        }

        const timer = setTimeout(async () => {
            setChecking(true)
            try {
                const result = await findMatchingMRs(input)
                // ignore answers to older keystrokes
                if (id === checkId.current) setMatches(result)
            } catch {
                // the server checks again on submit
            } finally {
                if (id === checkId.current) setChecking(false)
            }
        }, 400)

        return () => clearTimeout(timer)
    }, [values.name, values.company, values.division])

    async function onSubmit(data: MRInput) {
        setLoading(true)
        setFormError(null)

        const result = await addMR(data, { visitingToday: visitDay && visitingToday })

        setLoading(false)

        if (result.success) {
            form.reset()
            setMatches({ exact: null, similar: [] })
            setAdded(result)
            return
        }

        if (result.fieldErrors) {
            for (const [field, message] of Object.entries(result.fieldErrors)) {
                form.setError(field as keyof MRInput, { message })
            }
        }

        if (result.duplicate) {
            setMatches((m) => ({ ...m, exact: { id: "", isExact: true, ...result.duplicate! } }))
        } else {
            setFormError(result.message)
        }
    }

    const { exact, similar } = matches

    if (added) {
        return (
            <div className="space-y-4">
                <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                    <p className="flex items-center gap-2 text-base font-semibold">
                        <CircleCheck className="size-5 shrink-0" />
                        {added.name} added
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed">
                        {added.visitRecorded
                            ? `First visit recorded for today. Next visit allowed from ${formatDate(nextVisitDay(addDays(today, COOLDOWN_DAYS)))}, or earlier only with a senior.`
                            : "No visit recorded."}
                    </p>
                </div>

                {added.visitNote && (
                    <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                        {added.visitNote}
                    </p>
                )}

                <div className="flex flex-col gap-2 sm:flex-row-reverse">
                    <Button type="button" className="h-11 flex-1 cursor-pointer md:h-9" onClick={() => onSuccess?.()}>
                        Done
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11 flex-1 cursor-pointer md:h-9"
                        onClick={() => {
                            setAdded(null)
                            setVisitingToday(visitDay)
                        }}
                    >
                        Add another
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">

            {FIELDS.map(({ name, label, placeholder, enterKeyHint }) => (
                <Controller
                    key={name}
                    name={name}
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={`mr-${name}`}>{label}</FieldLabel>
                            <FieldContent>
                                <Input
                                    {...field}
                                    id={`mr-${name}`}
                                    placeholder={placeholder}
                                    aria-invalid={fieldState.invalid}
                                    autoComplete="off"
                                    autoCapitalize="words"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    enterKeyHint={enterKeyHint}
                                    className="h-11 md:h-9"
                                />
                            </FieldContent>
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />
            ))}

            {visitDay ? (
                <label
                    htmlFor="mr-visiting-today"
                    className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors has-checked:border-emerald-300 has-checked:bg-emerald-50"
                >
                    <input
                        id="mr-visiting-today"
                        type="checkbox"
                        checked={visitingToday}
                        onChange={(e) => setVisitingToday(e.target.checked)}
                        className="mt-0.5 size-5 shrink-0 cursor-pointer accent-emerald-600"
                    />
                    <span className="text-sm">
                        <span className="block font-medium">He is visiting today</span>
                        <span className="text-muted-foreground">
                            Counts as his first visit today and starts his {COOLDOWN_DAYS}-day cooldown.
                        </span>
                    </span>
                </label>
            ) : (
                <p className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                    <Info className="mt-0.5 size-4 shrink-0" />
                    Today isn&apos;t an MR visit day, so no visit will be recorded. Mark his first visit when he comes on
                    a Tue or Thu (next: {formatDate(nextVisitDay(addDays(today, 1)))}).
                </p>
            )}

            {exact && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                    <p className="font-semibold">This MR is already registered</p>
                    <p>
                        {exact.name} · {exact.company} · {exact.division}
                    </p>
                </div>
            )}

            {!exact && similar.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="flex items-center gap-1.5 font-semibold">
                        <TriangleAlert className="size-4" />
                        Similar MRs already registered
                    </p>
                    <p className="mb-1.5">Make sure he isn&apos;t one of these:</p>
                    <ul className="list-disc space-y-0.5 pl-5">
                        {similar.map((mr) => (
                            <li key={mr.id}>
                                {mr.name} · {mr.company} · {mr.division}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {formError && (
                <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {formError}
                </p>
            )}

            <Button
                type="submit"
                className="h-11 w-full cursor-pointer md:h-9"
                disabled={loading || !!exact}
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                    </span>
                ) : visitDay && visitingToday ? (
                    "Register MR & record visit"
                ) : (
                    "Register MR"
                )}
            </Button>

            <FieldDescription className="text-center text-xs">
                {checking ? "Checking for existing MRs…" : "Same name, company and division can't be added twice."}
            </FieldDescription>

        </form>
    )
}
