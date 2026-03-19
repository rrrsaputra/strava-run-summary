"use client";

import { Activity } from "@/lib/strava";
import { Gear } from "./Dashboard";
import { useMemo, useState, useEffect } from "react";
import { Gauge, Footprints, Timer, TrendingUp, Calendar, Zap, History, Settings, Edit2, Check } from "lucide-react";

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
    const [gearMaxMileage, setGearMaxMileage] = useState<Record<string, number>>({});
    const [editingGearId, setEditingGearId] = useState<string | null>(null);
    const [editMileageValue, setEditMileageValue] = useState<string>("");

    useEffect(() => {
        const savedMileage = localStorage.getItem("strava_gear_max_mileage");
        if (savedMileage) {
            try { setGearMaxMileage(JSON.parse(savedMileage)); } catch (e) {}
        }
    }, []);

    const saveStats = (id: string) => {
        const mileageValue = parseInt(editMileageValue.replace(/[^0-9]/g, "")) || 800; // default 800
        const newMileages = { ...gearMaxMileage, [id]: mileageValue };
        setGearMaxMileage(newMileages);
        localStorage.setItem("strava_gear_max_mileage", JSON.stringify(newMileages));

        setEditingGearId(null);
    };

    const stats = useMemo(() => {
        // Include ID in the stored object type
        const gearStats = new Map<string, { id: string; count: number; distance: number; totalSpeed: number; name: string; lastUsed?: string; firstUsed?: string; fastestPaceSpeed?: number }>();

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
                    if (!current.firstUsed || new Date(activity.start_date) < new Date(current.firstUsed)) {
                        current.firstUsed = activity.start_date;
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
                lastUsed: stat.lastUsed,
                firstUsed: stat.firstUsed
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
                    const distanceFloat = parseFloat(item.distance);
                    
                    const MAX_MILEAGE = gearMaxMileage[item.id] || 800; // Gunakan target yg diset user, default 800
                    const percentageUsed = (distanceFloat / MAX_MILEAGE) * 100;
                    const healthPercentage = Math.max(0, 100 - percentageUsed);

                    return (
                        <div
                            key={item.id}
                            onClick={() => onSelectGear?.(isSelected ? null : item.id)}
                            className={`flex flex-col p-4 rounded-xl border transition-all cursor-pointer ${isSelected
                                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-md ring-1 ring-orange-500"
                                : "border-gray-100 dark:border-zinc-800 hover:border-orange-200 dark:hover:border-orange-900/50 bg-gray-50/50 dark:bg-zinc-800/30"
                                }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1" title={item.name}>
                                    {item.name}
                                </h3>
                                {percentageUsed >= 90 && (
                                    <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 px-1.5 py-0.5 rounded font-medium flex-shrink-0 animate-pulse">
                                        ⚠️ Ganti Sepatu
                                    </span>
                                )}
                            </div>

                            <div className="mb-5 space-y-1.5 bg-white dark:bg-zinc-800/80 p-2.5 rounded border border-gray-100 dark:border-zinc-700/50">
                                <div className="flex justify-between text-[11px] font-medium">
                                    <span className="text-gray-500 dark:text-gray-400">Kondisi Sepatu</span>
                                    <span className={healthPercentage < 20 ? "text-red-600 dark:text-red-400 font-bold" : healthPercentage < 40 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}>
                                        {healthPercentage > 0 ? `${healthPercentage.toFixed(0)}% Sisa` : "100% Habis"}
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden shadow-inner flex">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${
                                            percentageUsed >= 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                            percentageUsed >= 70 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                                            'bg-gradient-to-r from-green-400 to-green-500'
                                        }`}
                                        style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                                    <span>Digunakan: <strong className="text-gray-700 dark:text-gray-200">{distanceFloat} km</strong></span>
                                    <span>Maks: {MAX_MILEAGE} km</span>
                                </div>
                            </div>

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

                            <div className="mt-auto pt-3 border-t border-gray-100 dark:border-zinc-800 flex flex-col gap-3">
                                <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-300 relative">
                                    <div className="flex items-center gap-1.5 font-medium">
                                        <Settings className="w-3.5 h-3.5" />
                                        <span>Target Maksimal</span>
                                    </div>
                                    {editingGearId === item.id ? (
                                        <div className="absolute bottom-5 right-0 z-10 p-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl flex flex-col gap-2.5 w-48" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="text-gray-500 font-medium text-xs">Maksimal KM</span>
                                                <input 
                                                    autoFocus
                                                    type="text" 
                                                    value={editMileageValue}
                                                    onChange={(e) => setEditMileageValue(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveStats(item.id);
                                                        if (e.key === 'Escape') setEditingGearId(null);
                                                    }}
                                                    className="w-24 px-2 py-1.5 text-xs border border-gray-300 rounded dark:bg-zinc-900 dark:border-zinc-600 outline-none focus:border-orange-500"
                                                    placeholder="800"
                                                />
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); saveStats(item.id); }} className="p-1.5 mt-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400 w-full flex justify-center items-center shadow-sm">
                                                <Check className="w-3.5 h-3.5" /> <span className="text-xs ml-1.5 font-bold">Simpan</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 group cursor-text" onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingGearId(item.id);
                                            setEditMileageValue(MAX_MILEAGE.toString());
                                        }}>
                                            <div className="flex flex-col items-end leading-tight">
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">{MAX_MILEAGE} km</span>
                                            </div>
                                            <button className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {(item.firstUsed || item.lastUsed) && (
                                    <div className="flex flex-col gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-zinc-800/30 p-2 rounded-lg">
                                        {item.firstUsed && (
                                            <div className="flex items-center gap-1.5">
                                                <History className="w-3.5 h-3.5" />
                                                <span>Pertama: {new Date(item.firstUsed).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                        )}
                                        {item.lastUsed && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>Terakhir: {new Date(item.lastUsed).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                                {item.fastestPace > 0 && (
                                                    <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400" title="Fastest Pace">
                                                        <Zap className="w-3.5 h-3.5" />
                                                        <span className="font-semibold">{formatPace(item.fastestPace)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
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
