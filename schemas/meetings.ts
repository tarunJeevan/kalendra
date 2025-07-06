import { startOfDay } from "date-fns"
import z from "zod"

// Base schema for both creating and processing a meeting
const meetingSchemaBase = z.object({
    // 'timezone' must be a non-empty string
    timezone: z.string().min(1, "Required"),
    // 'startTime' must be a valid date in the future
    startTime: z.date().min(new Date()),
    // 'guestName' must be a non-empty string
    guestName: z.string().min(1, "Required"),
    // 'guestEmail' must be a valid email
    guestEmail: z.string().email().min(1, "Required"),
    // 'guestNotes' is an optional string
    guestNotes: z.string().optional()
})

// Validation schema for booking form using Zod
export const meetingFormSchema = z.object({
    // 'date' must be a valid date some time after now
    date: z.date().min(startOfDay(new Date()), "Must be in the future")
})
    .merge(meetingSchemaBase)

// Schema for handling meeting actions such as saving to database
export const meetingActionSchema = z.object({
    // 'eventId' must be a non-empty string
    eventId: z.string().min(1, "Required"),
    // 'clerkUserId' must be a non-empty string
    clerkUserId: z.string().min(1, "Required")
})
    .merge(meetingSchemaBase)