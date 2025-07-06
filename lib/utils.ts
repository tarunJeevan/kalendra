import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Converts a time string (e.g., "09:15") to a number (e.g., 9.25)
export function timeToFloat(time: string): number {
    // Split time string to get hours and minutes
    const [hrs, mins] = time.split(":").map(Number)

    // Convert minutes into a fraction of an hour and return new decimal
    return hrs + mins / 60
}