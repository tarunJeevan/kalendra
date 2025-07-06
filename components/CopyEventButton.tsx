'use client'

import { VariantProps } from "class-variance-authority"
import { Button, buttonVariants } from "./ui/button"
import { CopyIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { toast } from "sonner"

// CopyEventButtonProps type def
interface CopyEventButtonProps extends
    Omit<React.ComponentProps<"button">, "children" | "onClick">,
    VariantProps<typeof buttonVariants> {

    eventId: string,
    clerkUserId: string,
}

// CopyState type def
type CopyState = "idle" | "copied" | "error"

export default function CopyEventButton({
    eventId,
    clerkUserId,
    variant,
    className,
    size,
    ...props // Any other button props (e.g., disabled)
}: CopyEventButtonProps) {
    const [copyState, setCopyState] = useState<CopyState>("idle")

    // Copy event URL to clipboard
    const handleCopy = () => {
        // Construct booking URL
        const url = `${location.origin}/book/${clerkUserId}/${eventId}`

        navigator.clipboard
            .writeText(url) // Try to copy URL to clipboard
            .then(() => {
                setCopyState("copied")
                toast("Link copied successfully!", {
                    duration: 3000,
                })
                setTimeout(() => setCopyState("idle"), 2000)
            })
            .catch(() => {
                setCopyState("error")
                setTimeout(() => setCopyState("idle"), 2000)
            })
    }

    return (
        <Button
            onClick={handleCopy}
            className={cn(buttonVariants({ variant, size }), "cursor-pointer", className)}
            variant={variant}
            size={size}
            {...props}
        >
            <CopyIcon className="size-4 mr-2" />
            {getCopyLabel(copyState)}
        </Button>
    )
}

// Returns button label based on copy state
function getCopyLabel(state: CopyState) {
    switch (state) {
        case "copied":
            return "Copied!"
        case "error":
            return "Error"
        case "idle":
        default:
            return "Copy Link"
    }
}
