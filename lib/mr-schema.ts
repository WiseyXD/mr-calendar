import * as z from "zod"

// Same normalization as DEDUPE_KEY_SQL in drizzle/schema.ts
export function cleanText(value: string) {
    return value.replace(/\s+/g, " ").trim()
}

export function dedupeKey(mr: { name: string; company: string; division: string }) {
    return [mr.name, mr.company, mr.division].map((v) => cleanText(v).toLowerCase()).join("|")
}

// letters (any script), spaces and . ' -
const PERSON_NAME = /^[\p{L} .'-]+$/u
// company / division names can also have digits and & ( ) / , +
const ORG_NAME = /^[\p{L}\p{N} .'&()/,+-]+$/u

export const mrSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(60, "Name must be at most 60 characters")
        .regex(PERSON_NAME, "Name can only contain letters, spaces, . ' and -"),
    company: z
        .string()
        .trim()
        .min(2, "Company must be at least 2 characters")
        .max(80, "Company must be at most 80 characters")
        .regex(ORG_NAME, "Company contains characters that aren't allowed"),
    division: z
        .string()
        .trim()
        .min(2, "Division must be at least 2 characters")
        .max(60, "Division must be at most 60 characters")
        .regex(ORG_NAME, "Division contains characters that aren't allowed"),
})

export type MRInput = z.infer<typeof mrSchema>
