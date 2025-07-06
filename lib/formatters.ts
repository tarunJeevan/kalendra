// Formats duration (in mins) into a readable string (1 hr 30 mins)
export function formatEventDuration(durationInMins: number): string {
    // Number of full hours
    const hrs = Math.floor(durationInMins / 60)
    // Remaining minutes
    const mins = durationInMins % 60

    // Format hours string
    const hrsString = `${hrs} ${hrs > 1 ? "hrs" : "hr"}`
    // Format minutes string
    const minsString = `${mins} ${mins > 1 ? "hrs" : "hr"}`

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