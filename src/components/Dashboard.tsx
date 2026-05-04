"use client";

import { useState, useMemo, useEffect } from "react";
import { Activity } from "@/lib/strava";
import { ActivityGraph } from "./ActivityGraph";
import { ActivityList } from "./ActivityList";
import { PersonalBests } from "./PersonalBests";
import { GearStats } from "./GearStats";
import { MonthlySummary } from "./MonthlySummary";
import Link from "next/link";
import { Crown } from "lucide-react";
import { getYear, getMonth, parseISO, format } from "date-fns";

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
    const [selectedGearId, setSelectedGearId] = useState<string | null>(null);

    // Available months for the selected year
    const availableMonths = useMemo(() => {
        const yearActivities = activities.filter(a => getYear(parseISO(a.start_date_local.replace("Z", ""))) === selectedYear);
        if (yearActivities.length === 0) return [];
        const months = new Set(
            yearActivities.map((a) => getMonth(parseISO(a.start_date_local.replace("Z", ""))))
        );
        return Array.from(months).sort((a, b) => b - a); // Descending
    }, [activities, selectedYear]);

    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

    // Reset to "all" if the year changes
    useEffect(() => {
        setSelectedMonth('all');
    }, [selectedYear]);

    // Used for Graph and other general year stats
    const yearFilteredActivities = useMemo(() => {
        return activities.filter((a) => {
            const matchesYear = getYear(parseISO(a.start_date_local.replace("Z", ""))) === selectedYear;
            const matchesGear = selectedGearId ? a.gear_id === selectedGearId : true;
            return matchesYear && matchesGear;
        });
    }, [activities, selectedYear, selectedGearId]);

    // Used for ActivityList
    const listFilteredActivities = useMemo(() => {
        return yearFilteredActivities.filter(a => {
            if (selectedMonth === 'all') return true;
            return getMonth(parseISO(a.start_date_local.replace("Z", ""))) === selectedMonth;
        });
    }, [yearFilteredActivities, selectedMonth]);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">Activity Log</h2>
                </div>
                <div className="flex items-center space-x-4">
                    {/* Month Filter */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 hidden sm:inline">Month:</span>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
                        >
                            <option value="all">All Months</option>
                            {availableMonths.map((m) => {
                                const date = new Date();
                                date.setMonth(m);
                                return (
                                    <option key={m} value={m}>
                                        {format(date, "MMMM")}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Year Filter */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 hidden sm:inline">Year:</span>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
                        >
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <section>
                <MonthlySummary activities={activities} year={selectedYear} selectedMonth={selectedMonth} />
            </section>

            <section>
                <ActivityGraph activities={yearFilteredActivities} year={selectedYear} />
            </section>

            <section>
                <PersonalBests activities={activities} />
            </section>

            <section>
                <GearStats
                    activities={activities}
                    shoes={shoes}
                    selectedGearId={selectedGearId}
                    onSelectGear={setSelectedGearId}
                />
            </section>

            <section>
                <ActivityList activities={listFilteredActivities} shoes={shoes} />
            </section>
        </div>
    );
}
