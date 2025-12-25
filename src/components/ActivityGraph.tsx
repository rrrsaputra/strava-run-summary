import { Activity } from "@/lib/strava";
import {
    format,
    startOfYear,
    endOfYear,
    eachDayOfInterval,
    getDay,
    eachWeekOfInterval,
    endOfWeek,
} from "date-fns";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Bike, Footprints, Waves, Dumbbell, Activity as ActivityIcon } from "lucide-react";

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

// Hex codes for gradients
const ACTIVITY_COLORS: Record<string, string> = {
    Run: "#f97316", // orange-500
    Ride: "#ef4444", // red-500
    Swim: "#3b82f6", // blue-500
    WeightTraining: "#a855f7", // purple-500
    Workout: "#a855f7", // purple-500
    Walk: "#22c55e", // green-500
    Default: "#22c55e", // green-500
};

const getActivityColorClass = (type: string) => {
    switch (type) {
        case "Run": return "bg-orange-500";
        case "Ride": return "bg-red-500";
        case "Swim": return "bg-blue-500";
        case "WeightTraining":
        case "Workout": return "bg-purple-500";
        default: return "bg-green-500";
    }
};

const getIcon = (type: string) => {
    switch (type) {
        case "Run": return <Footprints className="h-3 w-3 text-orange-500" />;
        case "Ride": return <Bike className="h-3 w-3 text-red-500" />;
        case "Swim": return <Waves className="h-3 w-3 text-blue-500" />;
        case "WeightTraining":
        case "Workout": return <Dumbbell className="h-3 w-3 text-purple-500" />;
        default: return <ActivityIcon className="h-3 w-3 text-gray-500" />;
    }
}

export function ActivityGraph({
    activities,
    year,
}: {
    activities: Activity[];
    year: number;
}) {
    // Generate all days for the selected year
    const firstDayOfYear = startOfYear(new Date(year, 0, 1));
    const lastDayOfYear = endOfYear(new Date(year, 0, 1));
    const daysInYear = eachDayOfInterval({
        start: firstDayOfYear,
        end: lastDayOfYear,
    });

    const startDayOfWeek = getDay(firstDayOfYear);
    const weeks = eachWeekOfInterval({
        start: firstDayOfYear,
        end: lastDayOfYear,
    });

    // Map activities to dates
    const activityMap = new Map<string, Activity[]>();
    activities.forEach((act) => {
        // Use local start date if available to avoid timezone hydration issues
        const dateStr = format(new Date(act.start_date_local || act.start_date), "yyyy-MM-dd");
        const existing = activityMap.get(dateStr) || [];
        existing.push(act);
        activityMap.set(dateStr, existing);
    });

    // Calculate Month Positions
    // Find which week index contains the 1st of each month
    const months: { name: string; weekIndex: number }[] = [];
    weeks.forEach((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart);
        const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
        const firstOfMonth = daysInWeek.find(d => d.getDate() === 1 && d.getFullYear() === year);
        if (firstOfMonth) {
            months.push({ name: format(firstOfMonth, "MMM"), weekIndex: index });
        }
    });

    if (months.length === 0 || (months.length > 0 && months[0].name !== "Jan")) {
        months.unshift({ name: "Jan", weekIndex: 0 });
    }

    return (
        <div className="w-full overflow-x-auto pb-32 pt-4 -mb-24 overflow-visible flex justify-center">
            <div className="min-w-max">
                {/* Month Labels */}
                <div className="flex text-xs text-gray-400 mb-2 ml-8 relative h-4">
                    {months.map((m, i) => (
                        <span key={i} style={{ position: 'absolute', left: `${m.weekIndex * 20}px` }}>
                            {m.name}
                        </span>
                    ))}
                </div>

                <div className="flex">
                    {/* Day Labels */}
                    <div className="flex flex-col justify-between text-[10px] text-gray-400 mr-2 py-2 h-[130px] leading-3">
                        <span></span><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-rows-7 grid-flow-col gap-1" style={{ height: 'max-content' }}>
                        {Array.from({ length: startDayOfWeek }).map((_, i) => (
                            <div key={`pad-${i}`} className="w-4 h-4" />
                        ))}

                        {daysInYear.map((date) => {
                            const dateStr = format(date, "yyyy-MM-dd");
                            const dayActivities = activityMap.get(dateStr);
                            const hasActivity = dayActivities && dayActivities.length > 0;

                            // Determine Style
                            let cellStyle = {};
                            let cellClass = "bg-gray-100 dark:bg-zinc-800";

                            if (hasActivity) {
                                // Get unique types
                                const types = Array.from(new Set(dayActivities.map(a => a.type)));

                                if (types.length === 1) {
                                    cellClass = getActivityColorClass(types[0]);
                                } else {
                                    // Multiple types: Create Gradient
                                    const colors = types.map(t => ACTIVITY_COLORS[t] || ACTIVITY_COLORS.Default);
                                    // Smooth gradient looks cleaner for small cells
                                    const percent = 100 / colors.length;
                                    const gradientStops = colors.map((c, i) => `${c} ${i * percent}% ${(i + 1) * percent}%`).join(", ");
                                    cellStyle = { background: `linear-gradient(135deg, ${gradientStops})` };
                                    cellClass = ""; // Style overrides class background
                                }
                            }

                            return (
                                <div key={dateStr} className="relative group">
                                    <div
                                        className={cn("w-4 h-4 rounded-[2px]", cellClass)}
                                        style={cellStyle}
                                    />

                                    {/* Custom Tooltip */}
                                    {hasActivity && (
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block z-50 pointer-events-none">
                                            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl rounded-lg p-3 w-48 text-xs relative">
                                                {/* Tooltip Arrow */}
                                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-zinc-900 border-t border-l border-gray-200 dark:border-zinc-700 rotate-45"></div>

                                                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2 border-b border-gray-100 dark:border-zinc-800 pb-1">
                                                    {format(date, "EEEE, MMM d, yyyy")}
                                                </div>

                                                <div className="space-y-2">
                                                    {dayActivities.map((act) => (
                                                        <div key={act.id} className="flex items-center gap-2">
                                                            {getIcon(act.type)}
                                                            <div className="flex-1 min-w-0 text-left">
                                                                <div className="truncate font-medium text-gray-900 dark:text-gray-100">{act.name}</div>
                                                                <div className="text-gray-500 dark:text-gray-400 font-mono text-[10px]">
                                                                    {act.distance > 0 ? (act.distance / 1000).toFixed(2) + "km" : ""}
                                                                    {act.distance > 0 && " • "}
                                                                    {Math.floor(act.moving_time / 60)}m
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Legend - Simplified for space */}
                <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-gray-500 dark:text-gray-400 pl-8">
                    {Object.entries(ACTIVITY_COLORS).filter(([k]) => k !== 'Default').map(([type, color]) => (
                        <div key={type} className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-[2px]" style={{ backgroundColor: color }} />
                            {type}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
