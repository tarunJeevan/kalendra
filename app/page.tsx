import LandingPage from "@/components/LandingPage"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function HomePage() {

    const user = await currentUser()

    // If there is no logged in user, render the public landing page
    if (!user)
        return <LandingPage />

    // If user is logged in, redirect to 'events' page
    return redirect('/events')
}
