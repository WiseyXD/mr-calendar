"use client"

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

const schema = z.object({
    name: z.string().min(2, "Name required"),
    company: z.string().min(2, "Company required"),
    division: z.string().min(2, "Division required"),
})

type FormData = z.infer<typeof schema>

export function MRForm() {
    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            company: "",
            division: "",
        },
    })

    function onSubmit(data: FormData) {
        console.log("MR Data:", data)
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

            <Button type="submit" className="w-full">
                Register MR
            </Button>
        </form>
    )
}
