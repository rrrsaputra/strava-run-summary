"use client";

import { useMemo, useState, useEffect } from "react";
import { Activity } from "@/lib/strava";
import { parseISO, getMonth, getYear, format } from "date-fns";
import { Timer, Route, Mountain, TrendingUp, Trophy, CalendarDays, Zap } from "lucide-react";

interface MonthlySummaryProps {
    activities: Activity[];
    year: number;
    selectedMonth: number | 'all';
}

export function MonthlySummary({ activities, year, selectedMonth }: MonthlySummaryProps) {
    // Filter activities by the selected year
    const yearActivities = useMemo(() => {
        return activities.filter((a) => {
            const actYear = getYear(parseISO(a.start_date_local.replace("Z", "")));
            return actYear === year;
        });
    }, [activities, year]);

    const targetActivities = useMemo(() => {
        if (selectedMonth === 'all') {
            return yearActivities;
        }
        return yearActivities.filter((a) => getMonth(parseISO(a.start_date_local.replace("Z", ""))) === selectedMonth);
    }, [yearActivities, selectedMonth]);

    const groupedActivities = useMemo(() => {
        const groups: Record<string, Activity[]> = {};
        targetActivities.forEach((a) => {
            // Simplify some common virtual types back to their base type
            let type = a.sport_type || a.type;
            if (type === "VirtualRun") type = "Run";
            if (type === "VirtualRide") type = "Ride";
            
            if (!groups[type]) groups[type] = [];
            groups[type].push(a);
        });
        
        // Sort so "Run" is always first
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            if (a === "Run") return -1;
            if (b === "Run") return 1;
            return a.localeCompare(b);
        });

        const sortedGroups: Record<string, Activity[]> = {};
        sortedKeys.forEach(k => {
            sortedGroups[k] = groups[k];
        });

        return sortedGroups;
    }, [targetActivities]);

    const availableTypes = useMemo(() => Object.keys(groupedActivities), [groupedActivities]);
    
    const [selectedType, setSelectedType] = useState<string>("Run");

    useEffect(() => {
        if (availableTypes.length > 0 && !availableTypes.includes(selectedType)) {
            if (availableTypes.includes("Run")) {
                setSelectedType("Run");
            } else {
                setSelectedType(availableTypes[0]);
            }
        }
    }, [availableTypes, selectedType]);

    const getStats = (acts: Activity[]) => {
        let totalDist = 0;
        let totalTime = 0;
        let totalElevation = 0;
        let longestRun = 0;

        acts.forEach((a) => {
            totalDist += a.distance;
            totalTime += a.moving_time;
            totalElevation += a.total_elevation_gain;
            if (a.distance > longestRun) {
                longestRun = a.distance;
            }
        });

        return {
            totalDistance: totalDist / 1000,
            totalTime: totalTime,
            totalElevation: totalElevation,
            count: acts.length,
            longestRun: longestRun / 1000,
            averagePace: totalDist > 0 ? (totalTime / 60) / (totalDist / 1000) : 0,
            averageSpeedKmH: totalTime > 0 ? (totalDist / 1000) / (totalTime / 3600) : 0,
        };
    };

    const formatPace = (paceInMinutes: number) => {
        if (paceInMinutes === 0) return "-:-- /km";
        const mins = Math.floor(paceInMinutes);
        const secs = Math.floor((paceInMinutes - mins) * 60);
        return `${mins}:${secs.toString().padStart(2, "0")} /km`;
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hrs > 0) {
            return `${hrs}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string | number, icon: any, colorClass: string }) => (
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.02]">
            <div className={`p-3 rounded-lg ${colorClass}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-zinc-400">{title}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-zinc-100">{value}</p>
            </div>
        </div>
    );

    const titleText = selectedMonth === 'all' 
        ? `${year} Summary`
        : `${format(new Date().setMonth(selectedMonth as number), "MMMM")} Summary`;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                        <CalendarDays className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-semibold">{titleText}</h2>
                </div>
            </div>

            {availableTypes.length > 0 ? (
                <div className="space-y-6">
                    {/* Activity Type Filters */}
                    {availableTypes.length > 1 && (
                        <div className="flex flex-wrap gap-2">
                            {availableTypes.map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedType(type)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                        selectedType === type
                                            ? "bg-orange-500 text-white"
                                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Stats Grid */}
                    {selectedType && groupedActivities[selectedType] && (() => {
                        const acts = groupedActivities[selectedType];
                        const stats = getStats(acts);
                        const isRide = selectedType.toLowerCase().includes("ride");

                        return (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <StatCard 
                                    title="Total Distance" 
                                    value={`${stats.totalDistance.toFixed(1)} km`}
                                    icon={Route}
                                    colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                />
                                <StatCard 
                                    title="Total Activities" 
                                    value={stats.count}
                                    icon={TrendingUp}
                                    colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                />
                                <StatCard 
                                    title="Total Time" 
                                    value={formatTime(stats.totalTime)}
                                    icon={Timer}
                                    colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                                />
                                {isRide ? (
                                    <StatCard 
                                        title="Average Speed" 
                                        value={`${stats.averageSpeedKmH.toFixed(1)} km/h`}
                                        icon={Zap}
                                        colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                                    />
                                ) : (
                                    <StatCard 
                                        title="Average Pace" 
                                        value={formatPace(stats.averagePace)}
                                        icon={Timer}
                                        colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                                    />
                                )}
                                <StatCard 
                                    title="Max Distance" 
                                    value={`${stats.longestRun.toFixed(1)} km`}
                                    icon={Trophy}
                                    colorClass="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                                />
                                <StatCard 
                                    title="Elevation Gain" 
                                    value={`${Math.round(stats.totalElevation)} m`}
                                    icon={Mountain}
                                    colorClass="bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
                                />
                            </div>
                        );
                    })()}
                </div>
            ) : (
                <div className="p-8 text-center text-gray-500 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                    No activities recorded in this period.
                </div>
            )}
        </div>
    );
}
