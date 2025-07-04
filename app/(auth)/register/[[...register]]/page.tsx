import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function RegisterPage() {
    return (
        <main className="flex flex-col items-center p-5 gap-10 animate-fade-in">
            <Image
                src='assets/logo.svg'
                alt='Logo'
                width={100}
                height={100}
            />

            <div className="mt-3">
                <SignUp />
            </div>
        </main>
    )
}

// TODO: Expand when adding additional authentication sources