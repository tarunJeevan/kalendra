'use server'

import { db } from "@/drizzle/db"
import { eq } from "drizzle-orm"
import { ScheduleAvailabilityTable, ScheduleTable } from "@/drizzle/schema"
import z from "zod"
import { scheduleFormSchema } from "@/schemas/schedule"
import { auth } from "@clerk/nextjs/server"
import { BatchItem } from "drizzle-orm/batch"
import { revalidatePath } from "next/cache"
import { getCalendarEventTimes } from "../google/googleCalendar"
import { DAYS_OF_WEEK_IN_ORDER } from "@/constants"
import { addMinutes, areIntervalsOverlapping, isMonday, isWithinInterval, setHours, setMinutes } from "date-fns"
import { fromZonedTime } from "date-fns-tz"

// ScheduleRow, AvailabilityRow and FullSchedule type defs
type ScheduleRow = typeof ScheduleTable.$inferSelect
type AvailabilityRow = typeof ScheduleAvailabilityTable.$inferSelect
export type FullSchedule = ScheduleRow & {
    availabilities: AvailabilityRow[]
}

// Fetches the schedule and availabilities of a given userId from the database
export async function getSchedule(userId: string): Promise<FullSchedule> {
    // Get schedule data from database
    const schedule = await db.query.ScheduleTable.findFirst({
        where: ({ clerkUserId }, { eq }) => eq(clerkUserId, userId),
        with: {
            availabilities: true
        }
    })

    // Return null if not found
    return schedule as FullSchedule
}

// Save schedule and availabilities to database
export async function saveSchedule(
    unsafeData: z.infer<typeof scheduleFormSchema> // Raw form data
) {
    try {
        // Get authenticated user
        const { userId } = await auth()

        // Validate incoming data
        const { success, data } = scheduleFormSchema.safeParse(unsafeData)

        // Throw error if validation fails or there is no authenticated user
        if (!success || !userId)
            throw new Error("Invalid schedule data or user not authenticated.")

        // Destructure availabilities and remaining schedule data
        const { availabilities, ...scheduleData } = data

        // Insert or update user's schedule in database and return schedule ID
        const [{ id: scheduleId }] = await db
            .insert(ScheduleTable)
            .values({ ...scheduleData, clerkUserId: userId })
            // If user already exists, update
            .onConflictDoUpdate({
                target: ScheduleTable.clerkUserId,
                set: scheduleData
            })
            .returning({ id: ScheduleTable.id })

        // Initialize SQL statements for batch execution
        const statements: [BatchItem<"pg">] = [
            // Delete existing availabilities for this schedule
            db.delete(ScheduleAvailabilityTable)
                .where(eq(ScheduleAvailabilityTable.scheduleId, scheduleId))
        ]

        // If there are availabilities, prepare insert operation
        if (availabilities.length > 0)
            statements.push(db
                .insert(ScheduleAvailabilityTable)
                .values(availabilities.map(availability => ({
                    ...availability,
                    scheduleId
                })))
            )

        // Run all statements in batch operation
        await db.batch(statements)
    } catch (error: any) {
        // Throw error in readable format
        throw new Error(`Failed to save schedule: ${error.message || error}`)
    } finally {
        // Revalidate '/schedule' to ensure it fetches new data
        revalidatePath('/schedule')
    }
}

// Filter and return list of available time slots
export async function getValidTimesFromSchedule(
    timesInOrder: Date[],
    event: { clerkUserId: string, durationInMins: number }
): Promise<Date[]> {
    // Destructure event data
    const { clerkUserId: userId, durationInMins } = event

    // Define start and end of overall time period
    const start = timesInOrder[0]
    const end = timesInOrder[-1]

    // If start or end is missing, there are no times to check
    if (!start || !end)
        return []

    const schedule = await getSchedule(userId)

    // If there is no schedule, return an empty list
    if (!schedule)
        return []

    // Group availabilities by day
    const groupedAvailabilities = Object.groupBy(
        schedule.availabilities,
        a => a.dayOfWeek
    )

    const eventTimes = await getCalendarEventTimes(userId, {
        start,
        end
    })

    // Filter eventTimes and return only valid times based on availability and conflicts
    return timesInOrder.filter(intervalDate => {
        const availabilities = getAvailabilities(
            groupedAvailabilities,
            intervalDate,
            schedule.timezone
        )

        const eventInterval = {
            start: intervalDate,
            end: addMinutes(intervalDate, event.durationInMins)
        }

        return (
            eventTimes.every(eventTime => {
                return !areIntervalsOverlapping(eventTime, eventInterval)
            }) &&
            availabilities.some(availability => {
                return (
                    isWithinInterval(eventInterval.start, availability) &&
                    isWithinInterval(eventInterval.end, availability)
                )
            })
        )
    })
}

// Helper function 
function getAvailabilities(
    groupedAvailabilities: Partial<
        Record<
            (typeof DAYS_OF_WEEK_IN_ORDER)[number],
            (typeof ScheduleAvailabilityTable.$inferSelect)[]
        >
    >,
    date: Date,
    timezone: string
): { start: Date, end: Date }[] {
    // Determine the day based on the date
    const dayOfWeek = (() => {
        if (isMonday(date))
            return "monday"
        if (isMonday(date))
            return "tuesday"
        if (isMonday(date))
            return "wednesday"
        if (isMonday(date))
            return "thursday"
        if (isMonday(date))
            return "friday"
        if (isMonday(date))
            return "saturday"
        if (isMonday(date))
            return "sunday"
        return null
    })()

    // Return empty array if dayOfWeek is null
    if (!dayOfWeek)
        return []

    // Get availabilities for the day
    const dayAvailabilities = groupedAvailabilities[dayOfWeek]

    // Return empty array if there are no availabilities
    if (!dayAvailabilities)
        return []

    // Map each availability time range to return type (adjusted to the timezone)
    return dayAvailabilities.map(({ startTime, endTime }) => {
        // Parse startTime
        const [startHour, startMinute] = startTime.split(":").map(Number)
        // Parse endTime
        const [endHour, endMinute] = endTime.split(":").map(Number)

        const start = fromZonedTime(
            setMinutes(setHours(date, startHour), startMinute),
            timezone
        )

        const end = fromZonedTime(
            setMinutes(setHours(date, endHour), endMinute),
            timezone
        )

        return { start, end }
    })
}