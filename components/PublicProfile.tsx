'use client'

import { getPublicEvents, PublicEvent } from "@/server/actions/events"
import { useEffect, useState } from "react"
import Loading from "./Loading"
import { Copy, Eye } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { Button } from "./ui/button"
import { toast } from "sonner"
import PublicEventCard from "./cards/PublicEventCard"

// PublicProfileProps type def
type PublicProfileProps = {
    userId: string,
    fullName: string | null
}

export default function PublicProfile({
    userId,
    fullName
}: PublicProfileProps) {
    const [events, setEvents] = useState<PublicEvent[] | null>(null)
    const { user } = useUser()

    // Fetch all public events when component mounts
    useEffect(() => {
        const fetchEvents = async () => {
            // Try to fetch public events and set state as fetched events or empty array
            try {
                const fetchedEvents = await getPublicEvents(userId)
                setEvents(fetchedEvents)
            } catch (error: any) {
                console.error("Error fetching events: ", error)
                setEvents([])
            }
        }

        fetchEvents()
    }, [userId])

    const copyProfileUrl = async () => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/book/${userId}`)
            toast("Profile URL coped to clipboard!")
        } catch (error: any) {
            console.error("Failed to copy URL: ", error)
        }
    }

    if (events === null)
        return (
            <div className="max-w-5xl mx-auto text-center">
                <Loading />
            </div>
        )

    return (
        <div className="max-w-5xl mx-auto p-5">
            {/* Note for profile owner */}
            {user?.id == userId && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 font-bold">
                    <Eye className="w-4 h-4" />
                    <p>This is how people will see your public profile</p>
                </div>
            )}

            {/* Display profile owner's name */}
            <div className="text-4xl md:text-5xl font-black mb-4 text-center">
                {fullName}
            </div>

            {/* Copy Public Profile URL (for profile owner) */}
            {user?.id === userId && (
                <div className="flex justify-center mb-6">
                    <Button
                        className="cursor-pointer"
                        variant="outline"
                        onClick={copyProfileUrl}
                    >
                        <Copy className="size-4" />
                        Copy Public Profile URL
                    </Button>
                </div>
            )}

            {/* Welcome message */}
            <div className="text-muted-foreground mb-6 max-w-sm mx-auto text-center">
                <p className="font-bold text-2xl">
                    Time to meet!
                </p>
                <br />
                Pick an event and let's make it official by booking a time.
            </div>

            {/* Grid of public event cards */}
            {events.length === 0 ? (
                <div className="text-center text-muted-foreground">
                    No events available at the moment
                </div>
            ) : (
                <div className="grid gap-4 grid-cols-[repeat(auto-fill, minmax(300px, 1fr))]">
                    {events.map(event => (
                        <PublicEventCard key={event.id} {...event} />
                    ))}
                </div>
            )}
        </div>
    )
}
