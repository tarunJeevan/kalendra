'use client'

import { eventFormSchema } from "@/schemas/events"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Switch } from "../ui/switch"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog"
import { Button } from "../ui/button"
import Link from "next/link"
import { useTransition } from "react"
import { createEvent, deleteEvent, updateEvent } from "@/server/actions/events"
import { useRouter } from "next/navigation"

// Handles creating, editing, and deleting events
export default function EventForm({ event }: {
    event?: {
        id: string              // Unique ID,
        name: string            // Event name,
        description?: string    // Optional event description,
        durationInMins: number  // Event duration in mins,
        isPublic: boolean       // Indicates event visibility
    }
}) {
    const router = useRouter()

    const [isDeletePending, startDeleteTransition] = useTransition()

    const form = useForm<z.infer<typeof eventFormSchema>>({
        resolver: zodResolver(eventFormSchema),
        defaultValues: event
            ? {
                // If event is provided, use its values
                ...event,
            }
            : {
                // Else use these defaults
                name: '',
                description: '',
                isPublic: true,
                durationInMins: 30,
            },
    })

    // Handle form submission
    async function onSubmit(values: z.infer<typeof eventFormSchema>) {
        const action = event == null ? createEvent : updateEvent.bind(null, event.id)

        try {
            await action(values)

            // Redirect to '/events'
            router.push('/events')
        } catch (error: any) {
            form.setError("root", {
                message: `There was an error saving your event: ${error.message}`
            })
        }
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex gap-6 flex-col"
            >
                {/* Show root error if any */}
                {form.formState.errors.root && (
                    <div className="text-destructive text-sm">
                        {form.formState.errors.root.message}
                    </div>
                )}

                {/* Event Name Field */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Event Name</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormDescription>
                                The name users will see when booking
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Event Duration Field */}
                <FormField
                    control={form.control}
                    name="durationInMins"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Duration</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                                In minutes
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Optional Event Description Field */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea className="resize-none h-32" {...field} />
                            </FormControl>
                            <FormDescription>
                                Optional description of the event
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Event Visibility Toggle */}
                <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center gap-2">
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <FormLabel>Public</FormLabel>
                            </div>
                            <FormDescription>
                                Only Public events will be visible for users to book
                            </FormDescription>
                        </FormItem>
                    )}
                />

                {/* Buttons: Delete, Cancel, and Save */}
                <div className="flex gap-2 justify-end">
                    {/* Delete Button: Show only if editing existing event */}
                    {event && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    className="cursor-pointer hover:scale-105 hover:bg-red-700"
                                    variant='destructive'
                                    disabled={isDeletePending || form.formState.isSubmitting}
                                >
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete this event.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-red-500 hover:bg-red-700 cursor-pointer"
                                        disabled={isDeletePending || form.formState.isSubmitting}
                                        onClick={() => {
                                            // Start transition to keep UI responsive during async operation
                                            startDeleteTransition(async () => {
                                                try {
                                                    // Try to delete event by ID
                                                    await deleteEvent(event.id)
                                                    router.push('/events')
                                                } catch (error: any) {
                                                    // Show error at root level
                                                    form.setError("root", {
                                                        message: `There was an error deleting your event: ${error.message}`
                                                    })
                                                }
                                            })
                                        }}
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    {/* Cancel Button: Redirect to events list */}
                    <Button
                        disabled={isDeletePending || form.formState.isSubmitting}
                        type="button"
                        asChild
                        variant='outline'
                    >
                        <Link href='/events'>Cancel</Link>
                    </Button>

                    {/* Save Button: Submit the form */}
                    <Button
                        className="cursor-pointer hover:scale-105 bg-blue-400 hover:bg-blue-600"
                        disabled={isDeletePending || form.formState.isSubmitting}
                        type="submit"
                    >
                        Save
                    </Button>
                </div>
            </form>
        </Form>
    )
}
