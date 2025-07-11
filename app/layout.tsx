import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Toaster } from "sonner"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: "Kalendra",
    description: "Kalendra is a simple and efficient calendar app that helps you manage your events, meetings, and schedulues with ease. Stay organized and never miss an important date again!",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body
                    className={`${geistSans.variable} ${geistMono.variable} antialiased animate-fade-in`}
                >
                    {children}
                    <Toaster position="bottom-right" />
                </body>
            </html>
        </ClerkProvider>
    )
}
