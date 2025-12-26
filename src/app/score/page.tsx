import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStravaActivities } from "@/lib/strava";
import { RunScore } from "@/components/RunScore";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function RunScorePage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        redirect("/");
    }

    // 1. Fetch Data
    const activities = await getStravaActivities(session.accessToken as string);

    // 2. Artificial Delay for "Calculating" Effect (as requested)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return (
        <main className="p-8 max-w-7xl mx-auto flex flex-col justify-center">
            <div className="mb-8">
                <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-purple-600 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Dashboard
                </Link>
            </div>

            <div className="w-full">
                <RunScore activities={activities} />
            </div>
        </main>
    );
}
