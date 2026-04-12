import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStravaActivities } from "@/lib/strava";
import { redirect } from "next/navigation";
import { ArrowLeft, Trophy, Medal } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
        return `${h}h ${m}m ${s}s`;
    }
    return `${m}m ${s}s`;
};

const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(2) + " km";
};

const formatPace = (seconds: number, meters: number) => {
    if (meters === 0) return "0:00 /km";
    const kms = meters / 1000;
    const paceSeconds = Math.floor(seconds / kms);
    const m = Math.floor(paceSeconds / 60);
    const s = paceSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")} /km`;
};

export default async function RacesPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        redirect("/");
    }

    const allActivities = await getStravaActivities(session.accessToken as string);
    // Filter out only activities marked as Race (workout_type === 1)
    const races = allActivities.filter((a) => a.workout_type === 1);

    // Sort by date (descending)
    const sortedRaces = races.sort((a, b) => 
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );

    return (
        <main className="p-8 max-w-7xl mx-auto flex flex-col justify-center">
            <div className="mb-8">
                <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-purple-600 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Dashboard
                </Link>
            </div>

            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-500">
                    <Trophy className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Daftar Balapan (Races)</h1>
                    <p className="text-gray-500 mt-1">
                        Menampilkan semua aktivitas yang di-tag sebagai "Race". Total: {races.length} balapan.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm divide-y dark:divide-zinc-800 border border-gray-100 dark:border-zinc-800">
                {sortedRaces.map((race) => (
                    <div
                        key={race.id}
                        className="block p-6"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="mt-1">
                                    <Medal className="w-6 h-6 text-yellow-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                        {race.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {format(new Date(race.start_date_local.replace("Z", "")), "MMMM d, yyyy • h:mm a")}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-8 md:text-right">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Jarak</p>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                                        {formatDistance(race.distance)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Pace</p>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                                        {formatPace(race.moving_time, race.distance)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Waktu Resmi</p>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                                        {formatDuration(race.elapsed_time)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {sortedRaces.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        <Trophy className="w-12 h-12 mx-auto text-gray-300 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Belum ada aktivitas Race</p>
                        <p className="mt-2 text-sm max-w-md mx-auto">
                            Kamu belum memiliki aktivitas dengan tag "Race". Pastikan untuk mengubah "Workout Type" menjadi "Race" di aplikasi Strava.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
