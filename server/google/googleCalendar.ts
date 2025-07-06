'use server'

import { clerkClient } from "@clerk/nextjs/server"
import { endOfDay, startOfDay } from "date-fns"
import { google } from "googleapis"

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