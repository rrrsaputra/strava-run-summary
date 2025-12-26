"use client";

import { Activity } from "@/lib/strava";
import { calculateRunScore, RunScoreBreakdown } from "@/lib/score";
import { useMemo, useState } from "react";
import { Crown, Info } from "lucide-react";
import { getYear, parseISO } from "date-fns";

export function RunScore({ activities }: { activities: Activity[] }) {
    // Get unique years
    const years = useMemo(() => {
        if (activities.length === 0) return [new Date().getFullYear()];
        const uniqueYears = new Set(
            activities.map((a) => getYear(parseISO(a.start_date_local.replace("Z", ""))))
        );
        uniqueYears.add(new Date().getFullYear());
        return Array.from(uniqueYears).sort((a, b) => b - a);
    }, [activities]);

    const [selectedYear, setSelectedYear] = useState<number>(years[0]);

    // Filter activities by selected year
    const filteredActivities = useMemo(() => {
        return activities.filter(
            (a) => getYear(parseISO(a.start_date_local.replace("Z", ""))) === selectedYear
        );
    }, [activities, selectedYear]);

    const scores = useMemo(() => calculateRunScore(filteredActivities), [filteredActivities]);

    // Graph config
    const size = 400;
    const center = size / 2;
    const radius = 140;
    const axes = [
        { key: "pace", label: "Pace" },
        { key: "endurance", label: "Endurance" },
        { key: "consistency", label: "Consistency" },
        { key: "progress", label: "Progress" },
        { key: "social", label: "Social" },
        { key: "elevation", label: "Elevation" },
    ];

    // Helper to get coordinates
    const getCoordinates = (value: number, index: number, max: number = 100) => {
        const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2; // Start at top
        const r = (value / max) * radius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return { x, y };
    };

    // Generate path based on scores
    const polyPoints = axes
        .map((axis, i) => {
            const score = scores[axis.key as keyof RunScoreBreakdown];
            const { x, y } = getCoordinates(score, i);
            return `${x},${y}`;
        })
        .join(" ");

    // Generate background grids (20, 40, 60, 80, 100)
    const levels = [20, 40, 60, 80, 100];

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Crown className="w-6 h-6 text-purple-500" />
                        Run Score
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Based on activities in {selectedYear}</p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Year:</span>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                        >
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="text-right">
                        <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">{scores.overall}</div>
                        <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">Overall</div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
                {/* SVG Radar Chart */}
                <div className="relative mx-auto">
                    <svg width={size} height={size} className="transform drop-shadow-sm">
                        {/* Background Polygons */}
                        {levels.map((level, lvlIdx) => {
                            const pts = axes.map((_, i) => {
                                const { x, y } = getCoordinates(level, i);
                                return `${x},${y}`;
                            }).join(" ");
                            return (
                                <polygon
                                    key={level}
                                    points={pts}
                                    fill="none"
                                    stroke="currentColor"
                                    className="text-gray-200 dark:text-zinc-700"
                                    strokeWidth="1"
                                />
                            );
                        })}

                        {/* Axes Lines */}
                        {axes.map((axis, i) => {
                            const { x, y } = getCoordinates(100, i);
                            return (
                                <line
                                    key={axis.label}
                                    x1={center}
                                    y1={center}
                                    x2={x}
                                    y2={y}
                                    stroke="currentColor"
                                    className="text-gray-200 dark:text-zinc-700"
                                    strokeWidth="1"
                                />
                            );
                        })}

                        {/* Data Polygon */}
                        <polygon
                            points={polyPoints}
                            fill="rgba(168, 85, 247, 0.2)" // purple-500/20
                            stroke="#a855f7" // purple-500
                            strokeWidth="2"
                            className="transition-all duration-1000 ease-out"
                        />

                        {/* Data Vertex Dots */}
                        {axes.map((axis, i) => {
                            const score = scores[axis.key as keyof RunScoreBreakdown];
                            const { x, y } = getCoordinates(score, i);
                            return (
                                <circle
                                    key={axis.label}
                                    cx={x}
                                    cy={y}
                                    r="3"
                                    fill="#a855f7"
                                    className="transition-all duration-1000 ease-out delay-75"
                                />
                            );
                        })}

                        {/* Labels */}
                        {axes.map((axis, i) => {
                            const { x, y } = getCoordinates(120, i);
                            return (
                                <text
                                    key={axis.label}
                                    x={x}
                                    y={y}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="text-[10px] font-medium fill-gray-500 dark:fill-gray-400 uppercase tracking-widest"
                                >
                                    {axis.label}
                                </text>
                            );
                        })}
                    </svg>
                </div>

                {/* Legend / Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full flex-1">
                    {axes.map((axis) => (
                        <div key={axis.key} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 min-w-[140px]">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{axis.label}</span>
                            <span className={`font-bold ${scores[axis.key as keyof RunScoreBreakdown] >= 80 ? 'text-green-500' : scores[axis.key as keyof RunScoreBreakdown] >= 50 ? 'text-yellow-500' : 'text-orange-500'}`}>
                                {scores[axis.key as keyof RunScoreBreakdown]}
                            </span>
                        </div>
                    ))}

                    <div className="col-span-2 text-[10px] text-gray-400 mt-2 flex gap-1 items-start">
                        <Info className="w-3 h-3 mt-0.5 shrink-0" />
                        <p>Scores are calculated based on your Strava history, comparing metrics like max distance, weekly consistency, and pace against general running benchmarks.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
