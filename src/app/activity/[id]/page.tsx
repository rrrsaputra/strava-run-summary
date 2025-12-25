import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActivityById } from "@/lib/strava";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { ArrowLeft, Calendar, Clock, MapPin, Mountain, Zap } from "lucide-react";
import Link from "next/link";

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
};

const formatDistance = (meters: number) => (meters / 1000).toFixed(2) + " km";
const formatPace = (speed: number) => {
    if (speed === 0) return "0:00";
    const secondsPerKm = 1000 / speed;
    const m = Math.floor(secondsPerKm / 60);
    const s = Math.round(secondsPerKm % 60);
    return `${m}:${s.toString().padStart(2, "0")}/km`;
};

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    // Await params as required in newer Next.js versions
    const { id } = await params;

    if (!session || !session.accessToken) {
        redirect("/");
    }

    let activity;
    try {
        activity = await getActivityById(session.accessToken as string, id);
    } catch (error) {
        return <div className="p-8 text-center text-red-500">Failed to load activity.</div>;
    }

    return (
        <main className="min-h-screen p-8 max-w-7xl mx-auto">
            <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-orange-600 mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
            </Link>

            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                        {activity.name}
                    </h1>
                    <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(activity.start_date_local), "EEEE, MMM d, yyyy • h:mm a")}
                        </div>
                        <div className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-xs font-medium border border-gray-200 dark:border-zinc-700">
                            {activity.type}
                        </div>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Distance" value={formatDistance(activity.distance)} icon={<MapPin className="w-5 h-5 text-blue-500" />} />
                    <StatCard label="Moving Time" value={formatDuration(activity.moving_time)} icon={<Clock className="w-5 h-5 text-orange-500" />} />
                    <StatCard label="Avg Pace" value={formatPace(activity.average_speed)} icon={<Zap className="w-5 h-5 text-purple-500" />} />
                    <StatCard label="Elevation" value={`${Math.round(activity.total_elevation_gain)} m`} icon={<Mountain className="w-5 h-5 text-gray-500" />} />
                </div>

                {/* Splits / Laps (if available) - Strava Detail usually has splits_metric */}
                {activity.splits_metric && (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
                            <h3 className="font-semibold">Splits</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-zinc-800/50">
                                    <tr>
                                        <th className="px-6 py-3">Km</th>
                                        <th className="px-6 py-3">Pace</th>
                                        <th className="px-6 py-3">Elev</th>
                                        <th className="px-6 py-3">HR</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                    {activity.splits_metric.map((split: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                                            <td className="px-6 py-3 font-medium">{split.split}</td>
                                            <td className="px-6 py-3">{formatPace(split.average_speed)}</td>
                                            <td className="px-6 py-3">{split.elevation_difference ? Math.round(split.elevation_difference) : 0} m</td>
                                            <td className="px-6 py-3">{split.average_heartrate ? Math.round(split.average_heartrate) : "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

function StatCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col items-center text-center">
            <div className="mb-2 p-3 bg-gray-50 dark:bg-zinc-800 rounded-full">{icon}</div>
            <div className="text-2xl font-bold mb-1">{value}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
        </div>
    )
}
