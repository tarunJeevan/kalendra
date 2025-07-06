'use client'

import { meetingFormSchema } from "@/schemas/meetings"
import { createMeeting } from "@/server/actions/meetings"
import { zodResolver } from "@hookform/resolvers/zod"
import { toZonedTime } from "date-fns-tz"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@radix-ui/react-select"
import { formatDate, formatTimeString, formatTimezoneOffset } from "@/lib/formatters"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Button } from "../ui/button"
import { isSameDay } from "date-fns"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "../ui/calendar"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import Link from "next/link"
import Booking from "../Booking"

export default function MeetingForm({
    validTimes, // List of available times for booking an event
    eventId,    // Event ID
    clerkUserId // Authenticated user ID
}: {
    validTimes: Date[],
    eventId: string,
    clerkUserId: string
}) {
    // FIXME: Selecting time in form causes error + other formatting errors
    // Initialize router
    const router = useRouter()

    // Initialize form for validation with defaults
    const form = useForm<z.infer<typeof meetingFormSchema>>({
        resolver: zodResolver(meetingFormSchema),
        defaultValues: {
            // Automatically detect booking user's time zone
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            // Empty values for guest fields
            guestName: "",
            guestEmail: "",
            guestNotes: ""
        }
    })

    // Track timezone and selected date for updates
    const timezone = form.watch("timezone")
    const date = form.watch("date")

    // Convert valid times to the selected timezone
    const validTimesInTimezone = useMemo(() => {
        return validTimes.map(date => toZonedTime(date, timezone))
    }, [validTimes, timezone])

    // onSubmit handler
    async function onSubmit(values: z.infer<typeof meetingFormSchema>) {
        try {
            // Try creating the meeting
            const meetingData = await createMeeting({
                ...values,
                eventId,
                clerkUserId
            })

            // Redirect to success page
            const path = `/book/${meetingData.clerkUserId}/${meetingData.eventId}/success?startTime=${meetingData.startTime.toISOString()}`

            router.push(path)

        } catch (error: any) {
            form.setError("root", {
                message: `There was an error saving your event: ${error.message}`
            })
        }
    }

    if (form.formState.isSubmitting)
        return <Booking />

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-6"
            >
                {/* Show root error if any */}
                {form.formState.errors.root && (
                    <div className="text-destructive text-sm">
                        {form.formState.errors.root.message}
                    </div>
                )}

                {/* Timezone selector */}
                <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Timezone</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Intl.supportedValuesOf("timeZone").map(timezone => (
                                        <SelectItem key={timezone} value={timezone}>
                                            {timezone}
                                            {` (${formatTimezoneOffset(timezone)})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex flex-col md:flex-row gap-4">
                    {/* Date picker */}
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <Popover>
                                <FormItem className="flex-1">
                                    <FormLabel>Date</FormLabel>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "pl-3 text-left font-normal flex w-full",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    formatDate(field.value)
                                                ) : (
                                                    <span>Pick a Date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={date =>
                                                // Only allow selection of valid dates
                                                !validTimesInTimezone.some(time =>
                                                    isSameDay(date, time))
                                            }
                                            autoFocus
                                        />
                                    </PopoverContent>
                                </FormItem>
                            </Popover>
                        )}
                    />

                    {/* Time selector */}
                    <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Time</FormLabel>
                                <Select
                                    disabled={date == null || timezone == null}
                                    onValueChange={value =>
                                        field.onChange(new Date(Date.parse(value)))
                                    }
                                    defaultValue={field.value?.toISOString()}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue
                                                placeholder={
                                                    date == null || timezone == null
                                                        ? "Select a date/timezone first"
                                                        : "Select a meeting time"
                                                }
                                            />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {/* Show time options only for selected day */}
                                        {validTimesInTimezone
                                            .filter(time => isSameDay(time, date))
                                            .map(time => (
                                                <SelectItem
                                                    key={time.toISOString()}
                                                    value={time.toISOString()}
                                                >
                                                    {formatTimeString(time)}
                                                </SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    {/* Guest Name Input */}
                    <FormField
                        control={form.control}
                        name="guestName"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Your Name</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Guest Email Input */}
                    <FormField
                        control={form.control}
                        name="guestEmail"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Your Email</FormLabel>
                                <FormControl>
                                    <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Optional Notes Textarea */}
                    <FormField
                        control={form.control}
                        name="guestNotes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Optional Notes</FormLabel>
                                <FormControl>
                                    <Textarea className="resize-none" {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    {/* Cancel and Submit buttons */}
                    <div className="flex gap-2 justify-end">
                        <Button
                            disabled={form.formState.isSubmitting}
                            type="button"
                            variant="outline"
                            asChild
                        >
                            <Link href={`/book/${clerkUserId}`}>Cancel</Link>
                        </Button>

                        <Button
                            disabled={form.formState.isSubmitting}
                            type="submit"
                            className="cursor-pointer hover:scale-105 bg-blue-400 hover:bg-blue-600"
                        >
                            Book Event
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    )
}
