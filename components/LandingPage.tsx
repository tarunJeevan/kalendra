'use client';

import { SignIn } from "@clerk/nextjs";
import { neobrutalism } from "@clerk/themes";
import Image from "next/image";

export default function LandingPage() {
    return (
        <main className="flex items-center p-10 gap-24 animate-fade-in max-md:flex-col">
            {/* NOTE: Section with branding, heading, and subheading as well as illustrations and other aesthetic elements */}
            <section className="flex flex-col items-center">
                {/* App logo */}
                <Image
                    src='/assets/logo.svg'
                    alt="Logo"
                    width={300}
                    height={300}
                />

                {/* Main heading */}
                {/* NOTE: Use LLM to create new heading and subheading */}
                <h1 className="text-2xl font-black lg:text-3xl">
                    Your time, perfectly planned
                </h1>

                {/* Subheading */}
                <p className="font-extralight">
                    Join millions of professionals who easily book meetings with the #1 scheduling tool!
                </p>

                {/* TODO: Add other illustrations and aesthetic elements to landing page */}
            </section>

            <div className="mt-3">
                <SignIn
                    routing="hash"
                    appearance={{
                        baseTheme: neobrutalism
                    }}
                />
                {/* NOTE: Make this section with SignIn sticky? */}
            </div>
        </main>
    )
}
