'use server'

import { db } from "@/drizzle/db"
import { eq } from "drizzle-orm"
import { ScheduleAvailabilityTable, ScheduleTable } from "@/drizzle/schema"
import z from "zod"
import { scheduleFormSchema } from "@/schemas/schedule"
import { auth } from "@clerk/nextjs/server"
import { BatchItem } from "drizzle-orm/batch"
import { revalidatePath } from "next/cache"

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