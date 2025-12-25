"use client";

import { signIn } from "next-auth/react";
import { ArrowRight } from "lucide-react";

export function LoginButton() {
    return (
        <button
            onClick={() => signIn("strava")}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-6 rounded-full transition-colors shadow-lg shadow-orange-500/20"
        >
            Connect with Strava
            <ArrowRight className="w-5 h-5" />
        </button>
    );
}
