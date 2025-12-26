"use client";

import { Activity } from "@/lib/strava";
import { Gear } from "./Dashboard";
import { useMemo } from "react";
import { Gauge, Footprints, Timer, TrendingUp } from "lucide-react";

export function GearStats({ activities, shoes }: { activities: Activity[]; shoes: Gear[] }) {
    const stats = useMemo(() => {
        const gearStats = new Map<string, { count: number; distance: number; totalSpeed: number; name: string }>();

        // Initialize with known shoes
        shoes.forEach(shoe => {
            gearStats.set(shoe.id, { count: 0, distance: 0, totalSpeed: 0, name: shoe.name });
        });

        // Aggregate stats
        activities.forEach(activity => {
            if (activity.gear_id && activity.type === "Run") {
                const current = gearStats.get(activity.gear_id) || {
                    count: 0,
                    distance: 0,
                    totalSpeed: 0,
                    name: activity.gear?.name || "Unknown Gear"
                };

                current.count += 1;
                current.distance += activity.distance;
                current.totalSpeed += activity.average_speed;

                gearStats.set(activity.gear_id, current);
            }
        });

        // Convert to array and filter out unused gear (optional, keeping for now to show inventory)
        return Array.from(gearStats.values())
            .filter(stat => stat.count > 0) // Only show gear with activities
            .map(stat => ({
                name: stat.name,
                count: stat.count,
                distance: (stat.distance / 1000).toFixed(1), // km
                avgPace: stat.count > 0 ? (1000 / (stat.totalSpeed / stat.count)) : 0 // sec/km
            }))
            .sort((a, b) => parseFloat(b.distance) - parseFloat(a.distance)); // Sort by distance
    }, [activities, shoes]);

    const formatPace = (secondsPerKm: number) => {
        if (secondsPerKm === 0) return "-";
        const m = Math.floor(secondsPerKm / 60);
        const s = Math.round(secondsPerKm % 60);
        return `${m}:${s.toString().padStart(2, "0")}/km`;
    };

    if (stats.length === 0) return null;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                    <Footprints className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold">Gear Usage</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.map((item) => (
                    <div key={item.name} className="flex flex-col p-4 rounded-xl border border-gray-100 dark:border-zinc-800 hover:border-orange-200 dark:hover:border-orange-900/50 transition-colors bg-gray-50/50 dark:bg-zinc-800/30">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 line-clamp-1" title={item.name}>
                            {item.name}
                        </h3>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="flex flex-col">
                                <span className="text-gray-500 mb-1 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> Dist
                                </span>
                                <span className="font-medium text-base">{item.distance} <span className="text-[10px] text-gray-400 font-normal">km</span></span>
                            </div>

                            <div className="flex flex-col border-l border-gray-200 dark:border-zinc-700 pl-3">
                                <span className="text-gray-500 mb-1 flex items-center gap-1">
                                    <Gauge className="w-3 h-3" /> Runs
                                </span>
                                <span className="font-medium text-base">{item.count}</span>
                            </div>

                            <div className="flex flex-col border-l border-gray-200 dark:border-zinc-700 pl-3">
                                <span className="text-gray-500 mb-1 flex items-center gap-1">
                                    <Timer className="w-3 h-3" /> Pace
                                </span>
                                <span className="font-medium text-base">{formatPace(item.avgPace)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
