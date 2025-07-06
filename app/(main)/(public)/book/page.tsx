'use client'

import Loading from "@/components/Loading"
import { useUser } from "@clerk/nextjs"
import { redirect } from "next/navigation"

export default function PublicPage() {
    // Get current user object
    const { user, isLoaded } = useUser()

    // Display loading component until user data is loaded
    if (!isLoaded)
        return <Loading />

    // Redirect to login if no user is found
    if (!user)
        return redirect('/login')

    // Redirect to user's booking page once loaded
    return redirect(`/book/${user.id}`)
}
