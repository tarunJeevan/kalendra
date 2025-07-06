import { formatEventDuration } from "@/lib/formatters"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import Link from "next/link"

type PublicEventCardProps = {
    id: string,
    name: string,
    description: string | null,
    clerkUserId: string,
    durationInMins: number
}

export default function PublicEventCard({
    id,
    name,
    description,
    clerkUserId,
    durationInMins
}: PublicEventCardProps) {
    return (
        <Card className="flex flex-col border-4 border-blue-500/10 shadow-2xl transition delay-150 duration-300">
            <CardHeader>
                {/* Card title and duration */}
                <CardTitle>{name}</CardTitle>
                <CardDescription>
                    {formatEventDuration(durationInMins)}
                </CardDescription>
            </CardHeader>

            {/* Card description, if any */}
            {description && <CardContent>{description}</CardContent>}
            <CardFooter className="flex justify-end gap-2 mt-auto">
                {/* Button that links to event booking page */}
                <Button
                    className="cursor-pointer hover:scale-105 bg-blue-400 hover:bg-blue-600"
                    asChild
                >
                    <Link href={`/book/${clerkUserId}/${id}`}>Book a Meeting!</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
