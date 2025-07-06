'use server'

import { db } from "@/drizzle/db";
import { meetingActionSchema } from "@/schemas/meetings";
import z from "zod";
import { fromZonedTime } from "date-fns-tz";
import { getValidTimesFromSchedule } from "./schedule";
import { createCalendarEvent } from "../google/googleCalendar";

export async function createMeeting(
    unsafeData: z.infer<typeof meetingActionSchema>
): Promise<{ clerkUserId: string, eventId: string, startTime: Date }> {
    try {
        // Validate incoming data against schema
        const { success, data } = meetingActionSchema.safeParse(unsafeData)

        // Throw error if validation fails
        if (!success)
            throw new Error("Invalid data.")

        // Try to find the event in the database
        const event = await db.query.EventTable.findFirst({
            where: ({ clerkUserId, isPublic, id }, { eq, and }) =>
                and(
                    eq(clerkUserId, data.clerkUserId),
                    eq(isPublic, true),
                    eq(id, data.eventId)
                )
        })

        // Throw error if no event is found
        if (!event)
            throw new Error("Event not found.")

        // Convert timezone from client to server
        const startInTimezone = fromZonedTime(data.startTime, data.timezone)

        // Check if selected time is valid for the event
        const validTimes = await getValidTimesFromSchedule([startInTimezone], event)

        // Throw error if selected time is invalid
        if (validTimes.length === 0)
            throw new Error("Selected time is invalid.")

        // Create the Google Calendar event
        await createCalendarEvent({
            ...data,
            startTime: startInTimezone,
            durationInMins: event.durationInMins,
            eventName: event.name
        })

        // Return data to create path
        return {
            clerkUserId: data.clerkUserId,
            eventId: data.eventId,
            startTime: data.startTime
        }
    } catch (error: any) {
        console.error(`Error creating meeting: ${error.message || error}`)
        throw new Error(`Failed to create meeting: ${error.message || error}`)
    }
}