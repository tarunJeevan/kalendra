// Formats duration (in mins) into a readable string (1 hr 30 mins)
export function formatEventDuration(durationInMins: number): string {
    // Number of full hours
    const hrs = Math.floor(durationInMins / 60)
    // Remaining minutes
    const mins = durationInMins % 60

    // Format hours string
    const hrsString = `${hrs} ${hrs > 1 ? "hrs" : "hr"}`
    // Format minutes string
    const minsString = `${mins} ${mins > 1 ? "mins" : "mins"}`

    // Return only mins if there are no full hours
    if (hrs === 0)
        return minsString
    // Return only hrs if there are no extra minutes
    if (mins === 0)
        return hrsString
    // Return both if both are present
    return `${hrsString} ${minsString}`
}

// Returns a short offset string for a given timezone
export function formatTimezoneOffset(timezone: string): string | undefined {
    return new Intl.DateTimeFormat(undefined, {
        timeZone: timezone,
        timeZoneName: "shortOffset"
    })
        .formatToParts(new Date())
        .find(part => part.type == "timeZoneName")?.value
}

// Formatter for displaying only the time
const timeFormatter = new Intl.DateTimeFormat(undefined, {
    timeStyle: "short"
})

// Format Date into short-style time string
export function formatTimeString(date: Date) {
    return timeFormatter.format(date)
}

// Formatter for displaying only the date
const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
})

// Format Date into medium-style date string
export function formatDate(date: Date) {
    return dateFormatter.format(date)
}

// Formatter for displaying date and time
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
})

// Format Date into date-time string
export function formatDateTime(date: Date) {
    return dateTimeFormatter.format(date)
}