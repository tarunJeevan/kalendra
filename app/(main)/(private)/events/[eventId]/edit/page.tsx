import EventForm from "@/components/forms/EventForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEvent } from "@/server/actions/events";
import { auth } from "@clerk/nextjs/server";

export default async function EditEventPage({
    params, // Extract eventId from URL params
}: {
    params: Promise<{ eventId: string }>
}) {
    const { eventId } = await params;

    // Get authenticated user
    const { userId, redirectToSignIn } = await auth();

    if (!userId)
        return redirectToSignIn();

    // Fetch event from database using eventId and userId
    const event = await getEvent(eventId, userId);

    // TODO: Replace h1 with Not Found page or something else
    if (!event)
        return <h1>Event not found!</h1>;

    return (
        <Card
            className="max-w-md mx-auto border-4 border-blue-100 shadow-2xl shadow-accent-foreground"
        >
            <CardHeader>
                <CardTitle>Edit Event</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Render EventForm with event details */}
                <EventForm
                    event={{ ...event, description: event.description || undefined }}
                />
            </CardContent>
        </Card>
    )
}
