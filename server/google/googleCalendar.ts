'use server'

import { clerkClient } from "@clerk/nextjs/server"
import { addMinutes, endOfDay, startOfDay } from "date-fns"
import { calendar_v3, google } from "googleapis"

// Get OAuth client for Google API operations
async function getOAuthClient(clerkUserId: string) {
    try {
        // Initialize Clerk client
        const client = await clerkClient()

        // Fetch OAuth access token for given ClerkUserId
        const { data } = await client.users.getUserOauthAccessToken(clerkUserId, 'google')

        // Validate data
        if (data.length === 0 || !data[0].token)
            throw new Error("No OAuth data or token found for the user.")

        // Initialize OAuth2 client with Google credentials
        const oAuthClient = new google.auth.OAuth2(
            process.env.GOOGLE_OAUTH_CLIENT_ID,
            process.env.GOOGLE_OAUTH_CLIENT_SECRET,
            process.env.GOOGLE_OAUTH_REDIRECT_URL,
        )

        // Set credentials with obtained access token
        oAuthClient.setCredentials({ access_token: data[0].token })

        return oAuthClient
    } catch (error: any) {
        throw new Error(`Failed to get OAuth client: ${error.message}`)
    }
}

// Fetch and format calendar events for a user in a given time period
export async function getCalendarEventTimes(
    clerkUserId: string,
    { start, end }: { start: Date, end: Date }
): Promise<{ start: Date, end: Date }[]> {
    try {
        // Get Google OAuth client
        const oAuthClient = await getOAuthClient(clerkUserId)

        if (!oAuthClient)
            throw new Error("OAuth client could not be obtained.")

        // Fetch events from Google Calendar API
        const events = await google.calendar("v3").events.list({
            calendarId: "primary",
            eventTypes: ["default"],
            singleEvents: true,
            timeMin: start.toISOString(),
            timeMax: end.toISOString(),
            maxResults: 2500,
            auth: oAuthClient
        })

        // Process and format events
        return (
            events.data.items?.map(event => {
                // Handle all-day events (no time, just a date)
                if (event.start?.date && event.end?.date)
                    return {
                        start: startOfDay(new Date(event.start.date)),
                        end: endOfDay(new Date(event.end.date)),
                    }

                // Handle timed events (date and time)
                if (event.start?.dateTime && event.end?.dateTime)
                    return {
                        start: new Date(event.start.dateTime),
                        end: new Date(event.end.dateTime)
                    }

                // Ignore events missing required time data
                return undefined
            })
                // Filter out undefined results and enforce correct typing
                .filter((date): date is { start: Date; end: Date } => date !== undefined) || []
        )
    } catch (error: any) {
        throw new Error(`Failed to fetch calendar events: ${error.message || error}`)
    }
}

// Create Google Calendar meeting with necessary details
export async function createCalendarEvent({
    clerkUserId,
    guestName,
    guestEmail,
    guestNotes,
    startTime,
    durationInMins,
    eventName
}: {
    clerkUserId: string,
    guestName: string,
    guestEmail: string,
    guestNotes?: string | undefined,
    startTime: Date,
    durationInMins: number,
    eventName: string
}): Promise<calendar_v3.Schema$Event> {
    try {
        // Get OAuth client
        const oAuthClient = await getOAuthClient(clerkUserId)

        // Throw error if there is no OAuth client
        if (!oAuthClient)
            throw new Error("OAuth client could not be obtained.")

        // Get Clerk client and user
        const client = await clerkClient()
        const calendarUser = await client.users.getUser(clerkUserId)

        // Get user's primary email
        const primaryEmail = calendarUser.emailAddresses.find(
            ({ id }) => id === calendarUser.primaryEmailAddressId
        )

        // Throw error if primary email not found
        if (!primaryEmail)
            throw new Error("Clerk user has no email.")

        // Create Google Calendar event
        const calendarEvent = await google.calendar("v3").events.insert({
            calendarId: "primary",
            auth: oAuthClient,
            sendUpdates: "all",
            requestBody: {
                attendees: [
                    { email: guestEmail, displayName: guestName },
                    {
                        email: primaryEmail.emailAddress,
                        displayName: calendarUser.fullName,
                        responseStatus: "accepted"
                    }
                ],
                description: guestNotes
                    ? `Additional details; ${guestNotes}`
                    : "No additional details.",
                start: {
                    dateTime: startTime.toISOString()
                },
                end: {
                    dateTime: addMinutes(startTime, durationInMins).toISOString()
                },
                summary: `${guestName} + ${calendarUser.fullName}: ${eventName}`
            }
        })

        // Return calendar event data
        return calendarEvent.data
    } catch (error: any) {
        console.error(`Error creating calendar event: ${error.message || error}`)
        throw new Error(`Failed to create Kalendra event: ${error.message || error}`)
    }
}