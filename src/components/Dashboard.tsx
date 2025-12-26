"use client";

import { useState, useMemo } from "react";
import { Activity } from "@/lib/strava";
import { ActivityGraph } from "./ActivityGraph";
import { ActivityList } from "./ActivityList";
import { PersonalBests } from "./PersonalBests";
import { GearStats } from "./GearStats";
import Link from "next/link";
import { Crown } from "lucide-react";
import { getYear, parseISO, format } from "date-fns";

export type Gear = {
    id: string;
    name: string;
    primary: boolean;
    distance: number;
};

export function Dashboard({ activities, shoes }: { activities: Activity[], shoes: Gear[] }) {
    // Get unique years from activities, default to current year if no data
    const years = useMemo(() => {
        if (activities.length === 0) return [new Date().getFullYear()];
        const uniqueYears = new Set(
            activities.map((a) => getYear(parseISO(a.start_date_local.replace("Z", ""))))
        );
        // Add current year just in case
        uniqueYears.add(new Date().getFullYear());
        return Array.from(uniqueYears).sort((a, b) => b - a); // Descending
    }, [activities]);

    const [selectedYear, setSelectedYear] = useState<number>(years[0]);

    const filteredActivities = useMemo(() => {
        return activities.filter(
            (a) => getYear(parseISO(a.start_date_local.replace("Z", ""))) === selectedYear
        );
    }, [activities, selectedYear]);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">Activity Log</h2>
                    <Link href="/score" className="text-xs font-medium px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 rounded-full transition-colors flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        View Run Score
                    </Link>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Year:</span>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                        {years.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <section>
                <ActivityGraph activities={filteredActivities} year={selectedYear} />
            </section>

            <section>
                <PersonalBests activities={activities} />
            </section>

            <section>
                <GearStats activities={activities} shoes={shoes} />
            </section>

            <section>
                <ActivityList activities={filteredActivities} shoes={shoes} />
            </section>
        </div>
    );
}
