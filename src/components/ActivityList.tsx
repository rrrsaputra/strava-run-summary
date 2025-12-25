"use client";

import { useState } from "react";
import { Activity } from "@/lib/strava";
import { format } from "date-fns";
import { Bike, Footprints, Waves, Dumbbell, Activity as ActivityIcon, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const getIcon = (type: string) => {
    switch (type) {
        case "Run":
            return <Footprints className="h-5 w-5 text-orange-500" />;
        case "Ride":
            return <Bike className="h-5 w-5 text-red-500" />;
        case "Swim":
            return <Waves className="h-5 w-5 text-blue-500" />;
        case "WeightTraining":
        case "Workout":
            return <Dumbbell className="h-5 w-5 text-purple-500" />;
        default:
            return <ActivityIcon className="h-5 w-5 text-gray-500" />;
    }
};

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(2) + " km";
};

const ITEMS_PER_PAGE = 50;

// Import Gear type or define it if not exported
type Gear = {
    id: string;
    name: string;
};

export function ActivityList({ activities, shoes }: { activities: Activity[], shoes: Gear[] }) {
    const [currentPage, setCurrentPage] = useState(1);

    // Create a map for fast shoe lookup
    const shoeMap = new Map(shoes?.map(s => [s.id, s.name]) || []);

    const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedActivities = activities.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage((p) => p + 1);
    };

    const goToPrevPage = () => {
        if (currentPage > 1) setCurrentPage((p) => p - 1);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recent Activities</h2>
                <span className="text-sm text-gray-500">
                    Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, activities.length)} of {activities.length}
                </span>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow divide-y dark:divide-zinc-800">
                {paginatedActivities.map((activity) => {
                    const shoeName = activity.gear_id ? shoeMap.get(activity.gear_id) : null;

                    return (
                        <Link
                            href={`/activity/${activity.id}`}
                            key={activity.id}
                            className="block p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full">
                                    {getIcon(activity.type)}
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1 flex items-center gap-2">
                                        {activity.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {format(new Date(activity.start_date_local), "MMM d, yyyy • h:mm a")}
                                        {shoeName && (
                                            <span className="ml-2 inline-flex items-center text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded">
                                                👟 {shoeName}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right text-sm">
                                {activity.distance > 0 && (
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                        {formatDistance(activity.distance)}
                                    </div>
                                )}
                                <div className="text-gray-500 dark:text-gray-400">{formatDuration(activity.moving_time)}</div>
                            </div>
                        </Link>
                    );
                })}

                {activities.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No activities found for this period.
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-4">
                    <button
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
