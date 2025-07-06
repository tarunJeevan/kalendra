import PublicProfile from "@/components/PublicProfile"
import { clerkClient } from "@clerk/nextjs/server"

export default async function PublicProfilePage({
    params
}: {
    params: Promise<{ clerkUserId: string }>
}) {
    // Get clerkUserId from URL params
    const { clerkUserId } = await params
    const client = await clerkClient()
    const user = await client.users.getUser(clerkUserId)
    // Extract user's full name from user object
    const { fullName } = user

    return <PublicProfile userId={clerkUserId} fullName={fullName} />
}
