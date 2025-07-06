import { DAYS_OF_WEEK_IN_ORDER } from "@/constants";
import { timeToFloat } from "@/lib/utils";
import z from "zod";

export const scheduleFormSchema = z.object({
    // 'timezone' must be a string at least one character long
    timezone: z.string().min(1, "Required"),
    // An array containing availabilities for every day
    availabilities: z.array(z.object({
        // Which day of the week
        dayOfWeek: z.enum(DAYS_OF_WEEK_IN_ORDER),
        // Availability start time for a given day
        startTime: z.string()
            .regex(
                /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
                "Time must be in the format HH:MM"
            ),
        endTime: z.string()
            .regex(
                /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
                "Time must be in the format HH:MM"
            )
    }))
        // Logic to ensure users can't submit overlapping or backwards time ranges
        .superRefine((availabilities, ctx) => {
            availabilities.forEach((availability, index) => {
                // Check for overlaps with other availabilities
                const overlaps = availabilities.some((a, i) => {
                    return (
                        // Check it's not comparing to itself
                        i !== index
                        // Check if it's the same day of the week
                        && a.dayOfWeek === availability.dayOfWeek
                        // Check if start time of one is before end time of another
                        && timeToFloat(a.startTime) < timeToFloat(availability.endTime)
                        // Check if end time of one is after start time of another
                        && timeToFloat(a.endTime) > timeToFloat(availability.startTime)
                    )
                })

                // Add a validation issue if there is an overlap
                if (overlaps)
                    ctx.addIssue({
                        code: "custom",
                        message: "Availability overlaps with another",
                        path: [index, "startTime"]
                    })

                // Add a validation issue if startTime comes after endTime
                if (timeToFloat(availability.startTime) >= timeToFloat(availability.endTime))
                    ctx.addIssue({
                        code: "custom",
                        message: "End time must come after start time",
                        path: [index, "endTime"]
                    })
            })
        })
})