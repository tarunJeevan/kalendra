import ScheduleForm from "@/components/forms/ScheduleForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSchedule } from "@/server/actions/schedule"
import { auth } from "@clerk/nextjs/server"

export default async function SchedulePage() {
    // Get authenticated user
    const { userId, redirectToSignIn } = await auth()

    if (!userId)
        return redirectToSignIn()

    const schedule = await getSchedule(userId)

    return (
        <Card className="max-w-md mx-auto border-8 border-blue-200 shadow-2xl shadow-accent-foreground">
            <CardHeader>
                <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Render ScheduleForm component with the fetched schedule data */}
                <ScheduleForm schedule={schedule} />
            </CardContent>
        </Card>
    )
}
