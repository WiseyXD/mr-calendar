"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
    Field,
    FieldContent,
    FieldLabel,
    FieldError,
} from "@/components/ui/field"

import { Loader2 } from "lucide-react"

import { addMR } from "@/app/actions/add-mr"

const schema = z.object({
    name: z.string().min(2, "Name required"),
    company: z.string().min(2, "Company required"),
    division: z.string().min(2, "Division required"),
})

type FormData = z.infer<typeof schema>

export function MRForm({
    onSuccess,
}: {
    onSuccess?: () => void
}) {

    const [loading, setLoading] = useState(false)

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            company: "",
            division: "",
        },
    })

    async function onSubmit(data: FormData) {
        setLoading(true)

        const result = await addMR(data)

        setLoading(false)

        if (result?.success) {
            form.reset()
            onSuccess?.()
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Name</FieldLabel>
                        <FieldContent>
                            <Input {...field} placeholder="Rahul Sharma" />
                        </FieldContent>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )}
            />

            <Controller
                name="company"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Company</FieldLabel>
                        <FieldContent>
                            <Input {...field} placeholder="Pfizer" />
                        </FieldContent>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )}
            />

            <Controller
                name="division"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Division</FieldLabel>
                        <FieldContent>
                            <Input {...field} placeholder="Cardiology" />
                        </FieldContent>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )}
            />

            <Button
                type="submit"
                className="w-full"
                disabled={loading}
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                    </span>
                ) : (
                    "Register MR"
                )}
            </Button>

        </form>
    )
}
