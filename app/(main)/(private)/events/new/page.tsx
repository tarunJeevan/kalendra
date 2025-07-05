import EventForm from "@/components/forms/EventForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewEventPage() {
    return (
        <Card className="max-w-md mx-auto border-8 border-blue-200 shadow-2xl shadow-accent-foreground">
            {/* Header section with title and description? */}
            <CardHeader>
                <CardTitle>New Event</CardTitle>
            </CardHeader>

            {/* Content section containing new event form */}
            <CardContent>
                <EventForm />
            </CardContent>

            {/* Footer section? */}
        </Card>
    )
}
