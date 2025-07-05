import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { formatEventDuration } from "@/lib/formatters";
import { Button } from "../ui/button";
import Link from "next/link";
import CopyEventButton from "../CopyEventButton";

// EventCardProps type def
type EventCardProps = {
    id: string,
    name: string,
    description: string | null,
    isPublic: boolean,
    durationInMins: number,
    clerkUserId: string
};

export default function EventCard({
    id,
    name,
    description,
    isPublic,
    durationInMins,
    clerkUserId,
}: EventCardProps) {
    return (
        <Card
            className={cn("flex flex-col border-4 border-blue-500/10 shadow-2xl transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110", !isPublic && " bg-accent border-accent")}
        >
            {/* Card header with title and formatted duration */}
            <CardHeader className={cn(!isPublic && "opacity-50")}>
                <CardTitle>{name}</CardTitle>
                <CardDescription>
                    {formatEventDuration(durationInMins)}
                </CardDescription>
            </CardHeader>

            {/* Card content with event description if available */}
            {description != null && (
                <CardContent className={cn(!isPublic && "opacity-50")}>
                    {description}
                </CardContent>
            )}

            {/* Card footer with Copy URL and Edit buttons */}
            <CardFooter className="flex justify-end gap-2 mt-auto">
                {/* Show Copy button only if event is active */}
                {isPublic && (
                    <CopyEventButton
                        variant="outline"
                        eventId={id}
                        clerkUserId={clerkUserId}
                    />
                )}
                {/* Edit event button */}
                <Button
                    className="cursor-pointer hover:scale-105 bg-blue-400 hover:bg-blue-600"
                    asChild
                >
                    <Link href={`/events/${id}/edit`}>Edit</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
