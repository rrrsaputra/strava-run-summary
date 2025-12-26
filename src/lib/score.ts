import { Activity } from "./strava";
import { differenceInDays, subWeeks, startOfWeek, endOfWeek, eachWeekOfInterval, differenceInWeeks } from "date-fns";

export type RunScoreBreakdown = {
    pace: number;
    endurance: number;
    consistency: number;
    progress: number;
    social: number;
    elevation: number;
    overall: number;
};

// Helper: Clamp score between 1 and 100
const clamp = (num: number, min = 1, max = 100) => Math.min(Math.max(Math.round(num), min), max);

export function calculateRunScore(activities: Activity[]): RunScoreBreakdown {
    const runs = activities.filter((a) => a.type === "Run");

    if (runs.length === 0) {
        return { pace: 0, endurance: 0, consistency: 0, progress: 0, social: 0, elevation: 0, overall: 0 };
    }

    // 1. Pace Score
    // Baseline: 6:00/km (Run) -> Score 50.
    // 3:30/km -> Score 100.
    // 8:00/km -> Score 20.
    // Use average speed (m/s).
    // 6:00/km = 2.78 m/s
    // 3:30/km = 4.76 m/s
    const avgSpeed = runs.reduce((acc, curr) => acc + curr.average_speed, 0) / runs.length;
    // Simple linear interpolation: 2.5 m/s (6:40/km) = 40pts, 5.0 m/s (3:20/km) = 100pts.
    const paceScore = clamp(((avgSpeed - 2.0) / 2.5) * 100);

    // 2. Endurance Score
    // Max Distance + Weekly Volume
    const maxDistance = Math.max(...runs.map((r) => r.distance));
    // 42km (Marathon) = 100pts
    // 5km = 30pts
    const distScore = (maxDistance / 42195) * 100;
    const enduranceScore = clamp(distScore);

    // 3. Consistency Score
    // Runs per week over last 8 weeks
    const today = new Date();
    const eightWeeksAgo = subWeeks(today, 8);
    const recentRuns = runs.filter(r => new Date(r.start_date_local) >= eightWeeksAgo);

    // Group by week using a simple key
    const weeksWithRuns = new Set();
    recentRuns.forEach(r => {
        const weekStart = startOfWeek(new Date(r.start_date_local));
        weeksWithRuns.add(weekStart.toISOString());
    });

    const weeksActive = weeksWithRuns.size;
    const runsPerActiveWeek = recentRuns.length / (weeksActive || 1);

    // 4 runs/week = 100pts
    // 1 run/week = 25pts
    let consistencyScore = clamp((runsPerActiveWeek / 4) * 100);
    // Penalty if weeks skipped
    if (weeksActive < 4 && differenceInWeeks(today, eightWeeksAgo) >= 4) {
        consistencyScore *= 0.5;
    }
    consistencyScore = clamp(consistencyScore);

    // 4. Progress Score
    // Recent Avg Speed vs All Time Avg Speed
    // If Recent > All Time = >50.
    const fourWeeksAgo = subWeeks(today, 4);
    const last4WeeksRuns = runs.filter(r => new Date(r.start_date_local) >= fourWeeksAgo);

    let progressScore = 50; // Default flat
    if (last4WeeksRuns.length > 0) {
        const recentAvgSpeed = last4WeeksRuns.reduce((acc, curr) => acc + curr.average_speed, 0) / last4WeeksRuns.length;
        // Compare to total avgSpeed
        const improvement = (recentAvgSpeed - avgSpeed) / avgSpeed; // % difference
        // +10% improvement = 100 score (approx)
        // -10% decline = 0 score
        // Base 60 + (imp * 400) -> 0.1 * 400 = 40 -> 100.
        progressScore = clamp(60 + (improvement * 300));
    } else {
        progressScore = 40; // Penalty for inactivity recently
    }

    // 5. Social Score
    // Kudos count avg
    const avgKudos = runs.reduce((acc, curr) => acc + curr.kudos_count, 0) / runs.length;
    // 15 kudos avg = 100pts
    const socialScore = clamp((avgKudos / 15) * 100);

    // 6. Elevation Score
    // Elevation gain per distance (m/km)
    const totalElev = runs.reduce((acc, curr) => acc + curr.total_elevation_gain, 0);
    const totalDist = runs.reduce((acc, curr) => acc + curr.distance, 0);
    const metersPerKm = totalDist > 0 ? (totalElev / (totalDist / 1000)) : 0;
    // 15m/km = 100pts (Hilly)
    // 0m/km = 10pts
    const elevationScore = clamp((metersPerKm / 15) * 100);

    const scores = {
        pace: Math.round(paceScore),
        endurance: Math.round(enduranceScore),
        consistency: Math.round(consistencyScore),
        progress: Math.round(progressScore),
        social: Math.round(socialScore),
        elevation: Math.round(elevationScore),
    };

    const overall = Math.round(
        (scores.pace + scores.endurance + scores.consistency + scores.progress + scores.social + scores.elevation) / 6
    );

    return { ...scores, overall };
}
