import { Activity } from "@/lib/strava";
import { Timer, Footprints, Medal, Trophy, Crown, Flame, Zap } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);

    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatDistance = (meters: number) => (meters / 1000).toFixed(2) + " km";

type BestStat = {
    id: number; // Added for linking
    label: string;
    value: string;
    subValue: string;
    date: string;
    icon: React.ReactNode;
    colorClass: string;
    textColor: string;
};

// Filtered Milestones as requested: 5K, 10K, HM. (Plus Longest Run separate logic)
const MILESTONES = [
    { label: "5K", distance: 5000, icon: <Timer className="w-5 h-5" /> },
    { label: "10K", distance: 10000, icon: <Timer className="w-5 h-5" /> },
    { label: "Half Marathon", distance: 21097.5, icon: <Medal className="w-5 h-5" /> },
    // Removed 400m, 1K, 1 Mile, FM per user request to keep it cleaner
];

export function PersonalBests({ activities }: { activities: Activity[] }) {
    const runs = activities.filter((a) => a.type === "Run");
    if (runs.length === 0) return null;

    const stats: BestStat[] = [];

    // 1. Longest Run (Distance)
    const longestRun = runs.reduce((max, curr) => (curr.distance > max.distance ? curr : max), runs[0]);
    stats.push({
        id: longestRun.id,
        label: "Longest Run",
        value: formatDistance(longestRun.distance),
        subValue: formatDuration(longestRun.moving_time),
        date: longestRun.start_date,
        icon: <Footprints className="w-6 h-6" />,
        colorClass: "from-blue-500 to-indigo-600",
        textColor: "text-blue-50",
    });

    // 2. Fastest Distances logic
    MILESTONES.forEach(milestone => {
        const minDist = milestone.distance * 0.98;
        let maxDist = milestone.distance * 1.25;

        if (milestone.label === "Half Marathon") maxDist = 24000;

        const matchingRuns = runs.filter(r => r.distance >= minDist && r.distance <= maxDist);

        if (matchingRuns.length > 0) {
            const bestRun = matchingRuns.reduce((min, curr) => (curr.moving_time < min.moving_time ? curr : min), matchingRuns[0]);

            stats.push({
                id: bestRun.id,
                label: `Fastest ${milestone.label}`,
                value: formatDuration(bestRun.moving_time),
                subValue: `${formatDistance(bestRun.distance)} run`,
                date: bestRun.start_date,
                icon: milestone.icon,
                colorClass: "from-orange-500 to-amber-600",
                textColor: "text-orange-50",
            });
        }
    });

    if (stats.length === 0) return null;

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    Running Personal Bests
                </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <Link
                        href={`/activity/${stat.id}`}
                        key={idx}
                        className={`relative overflow-hidden rounded-xl p-6 bg-gradient-to-br ${stat.colorClass} text-white shadow-lg shadow-gray-200 dark:shadow-none transition-transform hover:scale-[1.02] cursor-pointer`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 bg-white/20 rounded-lg backdrop-blur-sm ${stat.textColor}`}>
                                {stat.icon}
                            </div>
                            <span className="text-[10px] font-medium bg-black/20 px-2 py-0.5 rounded-full text-white/90 truncate max-w-[80px]">
                                {format(new Date(stat.date), "MMM yyyy")}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">{stat.label}</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
                            </div>
                            <p className="text-xs text-white/70 mt-1 font-medium">{stat.subValue}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
