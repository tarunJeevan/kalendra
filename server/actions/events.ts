'use server'

import { db } from "@/drizzle/db"
import { EventTable } from "@/drizzle/schema"
import { eventFormSchema } from "@/schemas/events"
import { auth } from "@clerk/nextjs/server"
import { and, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import z from "zod"

// Creates a new event in the database after validating the input data
export async function createEvent(
    unsafeData: z.infer<typeof eventFormSchema> // Raw event data
): Promise<void> {
    try {
        // Get authenticated user
        const { userId } = await auth()

        // Validate incoming data
        const { success, data } = eventFormSchema.safeParse(unsafeData)

        // Throw error if validation fails or there is no authenticated user
        if (!success || !userId)
            throw new Error("Invalid event data or user not authenticated.")

        // Insert validated data into database and link it to user
        await db.insert(EventTable).values({ ...data, clerkUserId: userId })
    } catch (error: any) {
        throw new Error(`Failed to create event: ${error.message || error}`)
    } finally {
        // Revalidate '/events' path to ensure page fetches fresh data
        revalidatePath('/events')
    }
}

// Updates an existing event in the database after validating the input data
export async function updateEvent(
    id: string,                                 // Event ID
    unsafeData: z.infer<typeof eventFormSchema> // Raw event data
): Promise<void> {
    // Get authenticated user
    const { userId } = await auth()

    // Validate incoming data
    const { success, data } = eventFormSchema.safeParse(unsafeData)

    // Throw error if validation fails or there is no authenticated user
    if (!success || !userId)
        throw new Error("Invalid event data or user not authenticated.")

    // Update database with validated data
    const { rowCount } = await db.update(EventTable)
        .set({ ...data })
        .where(and(
            eq(EventTable.id, id),
            eq(EventTable.clerkUserId, userId)
        ))

    // Throw error is event wasn't updated
    if (rowCount === 0)
        throw new Error("Event not found or user not authorized to update this event.")
    try {
        // 
    } catch (error: any) {
        throw new Error(`Failed to update event: ${error.message || error}`)
    } finally {
        // Revalidate '/events' path to ensure page fetches fresh data
        revalidatePath('/events')
    }
}

// Deletes an existing event in the database after confirming ownership
export async function deleteEvent(
    id: string // Event ID
): Promise<void> {
    try {
        // Get authenticated user
        const { userId } = await auth()

        // Throw error if there is no authenticated user
        if (!userId)
            throw new Error("User not authenticated.")

        // Delete validated event from database
        const { rowCount } = await db.delete(EventTable)
            .where(and(
                eq(EventTable.id, id),
                eq(EventTable.clerkUserId, userId)
            ))

        // Throw error if no event was deleted
        if (rowCount === 0)
            throw new Error("Event not found or user not authorized to delete this event")
    } catch (error: any) {
        throw new Error(`Failed to create event: ${error.message || error}`)
    } finally {
        // Revalidate '/events' path to ensure page fetches fresh data
        revalidatePath('/events')
    }
}

// Infer the type of a row from EventTable
type EventRow = typeof EventTable.$inferSelect

// Fetch all events linked to given user from database
export async function getEvents(clerkUserId: string): Promise<EventRow[]> {
    const events = await db.query.EventTable.findMany({
        // Where clause
        where: ({ clerkUserId: userIdCol }, { eq }) => eq(userIdCol, clerkUserId),
        // Order alphabetically by name (case-insensitive)
        orderBy: ({ name }, { asc, sql }) => asc(sql`lower(${name})`),
    })

    return events
}

// Fetch specific event linked to a given user
export async function getEvent(
    eventId: string,
    userId: string
): Promise<EventRow | undefined> {
    const event = await db.query.EventTable.findFirst({
        where: ({ id, clerkUserId }, { and, eq }) =>
            and(
                eq(clerkUserId, userId),
                eq(id, eventId)
            ),
    })

    // Explicitly return underfined if not found
    return event ?? undefined
}

// Type based on EventRow omitting the isPublic field since all returned events MUST be public
export type PublicEvent = Omit<EventRow, "isPublic"> & { isPublic: true }

// Fetch all public events for a given user
export async function getPublicEvents(clerkUserId: string): Promise<PublicEvent[]> {
    // Query database for public events belonging to user with the given clerkUserId
    const events = await db.query.EventTable.findMany({
        where: ({ clerkUserId: userIdCol, isPublic }, { eq, and }) =>
            and(
                eq(userIdCol, clerkUserId),
                eq(isPublic, true)
            ),
        orderBy: ({ name }, { asc, sql }) => asc(sql`lower(${name})`)
    })

    return events as PublicEvent[]
}