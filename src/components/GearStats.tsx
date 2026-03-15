"use client";

import { Activity } from "@/lib/strava";
import { Gear } from "./Dashboard";
import { useMemo } from "react";
import { Gauge, Footprints, Timer, TrendingUp, Calendar, Zap } from "lucide-react";

export function GearStats({
    activities,
    shoes,
    onSelectGear,
    selectedGearId
}: {
    activities: Activity[];
    shoes: Gear[];
    onSelectGear?: (id: string | null) => void;
    selectedGearId?: string | null;
}) {
    const stats = useMemo(() => {
        // Include ID in the stored object type
        const gearStats = new Map<string, { id: string; count: number; distance: number; totalSpeed: number; name: string; lastUsed?: string; fastestPaceSpeed?: number }>();

        // Initialize with known shoes
        shoes.forEach(shoe => {
            gearStats.set(shoe.id, { id: shoe.id, count: 0, distance: 0, totalSpeed: 0, name: shoe.name });
        });

        // Aggregate stats
        activities.forEach(activity => {
            if (activity.gear_id && activity.type === "Run") {
                const current = gearStats.get(activity.gear_id) || {
                    id: activity.gear_id,
                    count: 0,
                    distance: 0,
                    totalSpeed: 0,
                    name: activity.gear?.name || "Unknown Gear"
                };

                current.count += 1;
                current.distance += activity.distance;
                current.totalSpeed += activity.average_speed;
                
                if (activity.start_date) {
                    if (!current.lastUsed || new Date(activity.start_date) > new Date(current.lastUsed)) {
                        current.lastUsed = activity.start_date;
                    }
                }

                if (activity.average_speed > 0) {
                    if (!current.fastestPaceSpeed || activity.average_speed > current.fastestPaceSpeed) {
                        current.fastestPaceSpeed = activity.average_speed;
                    }
                }

                gearStats.set(activity.gear_id, current);
            }
        });

        // Convert to array and filter out unused gear (optional, keeping for now to show inventory)
        return Array.from(gearStats.values())
            .filter(stat => stat.count > 0) // Only show gear with activities
            .map(stat => ({
                id: stat.id,
                name: stat.name,
                count: stat.count,
                distance: (stat.distance / 1000).toFixed(1), // km
                avgPace: stat.count > 0 ? (1000 / (stat.totalSpeed / stat.count)) : 0, // sec/km
                fastestPace: stat.fastestPaceSpeed ? (1000 / stat.fastestPaceSpeed) : 0, // sec/km
                lastUsed: stat.lastUsed
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
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                        <Footprints className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-semibold">Gear Usage</h2>
                </div>
                {selectedGearId && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectGear?.(null);
                        }}
                        className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-medium"
                    >
                        Clear Filter
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.map((item) => {
                    const isSelected = selectedGearId === item.id;
                    return (
                        <div
                            key={item.id}
                            onClick={() => onSelectGear?.(isSelected ? null : item.id)}
                            className={`flex flex-col p-4 rounded-xl border transition-all cursor-pointer ${isSelected
                                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-md ring-1 ring-orange-500"
                                : "border-gray-100 dark:border-zinc-800 hover:border-orange-200 dark:hover:border-orange-900/50 bg-gray-50/50 dark:bg-zinc-800/30"
                                }`}
                        >
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 line-clamp-1" title={item.name}>
                                {item.name}
                            </h3>

                            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
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

                            <div className="mt-auto pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                                {item.lastUsed ? (
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Terakhir: {new Date(item.lastUsed).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                ) : (
                                    <div />
                                )}
                                {item.fastestPace > 0 && (
                                    <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400" title="Fastest Pace">
                                        <Zap className="w-3.5 h-3.5" />
                                        <span className="font-semibold">{formatPace(item.fastestPace)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
