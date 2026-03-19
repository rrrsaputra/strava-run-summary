"use client";

import { useMemo } from "react";
import { Activity } from "@/lib/strava";
import { differenceInDays, differenceInWeeks, parseISO, startOfDay, startOfWeek, isToday, isYesterday, isSameWeek, subWeeks } from "date-fns";
import { Flame, Trophy, CalendarDays, Activity as ActivityIcon } from "lucide-react";

export function RunningStreak({ activities }: { activities: Activity[] }) {
    const { currentStreak, longestStreak, currentWeekStreak, longestWeekStreak } = useMemo(() => {
        // Ambil semua tanggal unik (startOfDay) dari aktivitas jenis "Run"
        const runDates = activities
            .filter(a => a.type === "Run")
            .map(a => startOfDay(parseISO(a.start_date_local.replace("Z", ""))).getTime());

        if (runDates.length === 0) return { currentStreak: 0, longestStreak: 0, currentWeekStreak: 0, longestWeekStreak: 0 };

        // Sort dari yang paling baru (descending) dan filter duplikat (kalau lari 2 kali sehari dihitung 1)
        const uniqueDates = Array.from(new Set(runDates)).sort((a, b) => b - a);

        let currStreak = 0;
        let maxStreak = 0;
        let tempStreak = 1;

        // --- Calculate Current Streak ---
        const newestRun = new Date(uniqueDates[0]);
        // Streak dibilang "hidup" bila lari terbaru adalah HARI INI atau KEMARIN.
        const isStreakAlive = isToday(newestRun) || isYesterday(newestRun);
        
        if (isStreakAlive) {
            currStreak = 1;
            for (let i = 0; i < uniqueDates.length - 1; i++) {
                // differenceInDays(newest, oldest) mengembalikan angka positif misal Hari ini & Kemarin = 1
                const diff = differenceInDays(uniqueDates[i], uniqueDates[i + 1]);
                if (diff === 1) {
                    currStreak++;
                } else {
                    break;
                }
            }
        }

        // --- Calculate Longest Streak ---
        tempStreak = 1;
        maxStreak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
            const diff = differenceInDays(uniqueDates[i], uniqueDates[i + 1]);
            if (diff === 1) {
                tempStreak++;
                if (tempStreak > maxStreak) {
                    maxStreak = tempStreak;
                }
            } else {
                tempStreak = 1; // broken, reset ke 1 hari (hari itu sendirinya bernilai 1)
            }
        }

        // --- Calculate Week Streaks ---
        const runWeeks = Array.from(new Set(
            runDates.map(date => startOfWeek(date, { weekStartsOn: 1 }).getTime())
        )).sort((a, b) => b - a);

        let currWeekStreak = 0;
        let maxWeekStreak = 0;
        let tempWeekStreak = 1;

        if (runWeeks.length > 0) {
            const newestWeek = new Date(runWeeks[0]);
            const thisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
            const lastWeek = subWeeks(thisWeek, 1);
            
            const isWeekStreakAlive = isSameWeek(newestWeek, thisWeek, { weekStartsOn: 1 }) || isSameWeek(newestWeek, lastWeek, { weekStartsOn: 1 });

            if (isWeekStreakAlive) {
                currWeekStreak = 1;
                for (let i = 0; i < runWeeks.length - 1; i++) {
                    const diff = differenceInWeeks(runWeeks[i], runWeeks[i + 1]);
                    if (diff === 1) {
                        currWeekStreak++;
                    } else {
                        break;
                    }
                }
            }

            maxWeekStreak = 1;
            for (let i = 0; i < runWeeks.length - 1; i++) {
                const diff = differenceInWeeks(runWeeks[i], runWeeks[i + 1]);
                if (diff === 1) {
                    tempWeekStreak++;
                    if (tempWeekStreak > maxWeekStreak) {
                        maxWeekStreak = tempWeekStreak;
                    }
                } else {
                    tempWeekStreak = 1;
                }
            }
        }

        return { currentStreak: currStreak, longestStreak: maxStreak, currentWeekStreak: currWeekStreak, longestWeekStreak: maxWeekStreak };
    }, [activities]);

    if (longestStreak === 0 && longestWeekStreak === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/40 dark:to-zinc-900 rounded-xl p-6 border border-orange-200 dark:border-orange-800/40 flex items-center justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 opacity-10 dark:opacity-5 group-hover:scale-110 transition-transform">
                    <Flame className="w-32 h-32 text-orange-500" />
                </div>
                <div className="z-10">
                    <h3 className="text-orange-900 dark:text-orange-200 font-bold mb-1 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        Current Streak
                    </h3>
                    <p className="text-xs text-orange-800 dark:text-orange-400 font-medium">Lari rutin tanpa jeda hari</p>
                </div>
                <div className="text-5xl font-black text-orange-500 dark:text-orange-500 z-10 flex items-baseline gap-1">
                    {currentStreak}
                    <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">hari</span>
                </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-amber-100/50 dark:from-yellow-950/30 dark:to-zinc-900 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800/30 flex items-center justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 opacity-10 dark:opacity-5 group-hover:scale-110 transition-transform">
                    <Trophy className="w-32 h-32 text-yellow-500" />
                </div>
                <div className="z-10">
                    <h3 className="text-amber-900 dark:text-yellow-200 font-bold mb-1 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Longest Streak
                    </h3>
                    <p className="text-xs text-amber-800 dark:text-yellow-500/80 font-medium">Rekor berturut-turut terlama</p>
                </div>
                <div className="text-5xl font-black text-yellow-500 dark:text-yellow-500 z-10 flex items-baseline gap-1">
                    {longestStreak}
                    <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-500/80">hari</span>
                </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-zinc-900 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800/30 flex items-center justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 opacity-10 dark:opacity-5 group-hover:scale-110 transition-transform">
                    <CalendarDays className="w-32 h-32 text-emerald-500" />
                </div>
                <div className="z-10">
                    <h3 className="text-emerald-900 dark:text-emerald-200 font-bold mb-1 flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-emerald-500" />
                        Weekly Streak
                    </h3>
                    <p className="text-xs text-emerald-800 dark:text-emerald-500 font-medium">Lari per minggu aktif</p>
                </div>
                <div className="text-5xl font-black text-emerald-500 dark:text-emerald-500 z-10 flex items-baseline gap-1">
                    {currentWeekStreak}
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-600/80">mgg</span>
                </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-zinc-900 rounded-xl p-6 border border-blue-200 dark:border-blue-800/30 flex items-center justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 opacity-10 dark:opacity-5 group-hover:scale-110 transition-transform">
                    <ActivityIcon className="w-32 h-32 text-blue-500" />
                </div>
                <div className="z-10">
                    <h3 className="text-blue-900 dark:text-blue-200 font-bold mb-1 flex items-center gap-2">
                        <ActivityIcon className="w-5 h-5 text-blue-500" />
                        Max W-Streak
                    </h3>
                    <p className="text-xs text-blue-800 dark:text-blue-500 font-medium">Rentetan terlama</p>
                </div>
                <div className="text-5xl font-black text-blue-500 dark:text-blue-500 z-10 flex items-baseline gap-1">
                    {longestWeekStreak}
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-600/80">mgg</span>
                </div>
            </div>
        </div>
    );
}
