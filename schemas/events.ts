import z from "zod"

// Validation schema for event form using Zod
export const eventFormSchema = z.object({
    // 'name' must be a string of at least 1 character
    name: z.string().min(1, "Required"),
    // 'description' is an optional string
    description: z.string().optional(),
    // 'isPublic' is a boolean that defaults to true
    isPublic: z.boolean(),
    // 'durationInMins' will be coerced into an integer > 0 and <= 720 (12 hrs)
    durationInMins: z.coerce
        .number()
        .int()
        .positive("Duration must be greater than 0")
        .max(60 * 12, `Duration must be less than 12 hours (${60 * 12} minutes)`),
})