"use client";

import dynamic from "next/dynamic";
import { Activity } from "@/lib/strava";

// Leaflet hanya bisa berjalan di client-side
const MapHeatmap = dynamic(() => import("@/components/MapHeatmap"), { 
    ssr: false, 
    loading: () => (
        <div className="w-full h-[650px] animate-pulse bg-gray-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center border border-gray-200 dark:border-zinc-700 shadow-sm">
            <span className="text-gray-500 font-medium">Memuat Peta Panas Rute...</span>
        </div>
    )
});

export default function MapHeatmapLoader({ activities }: { activities: Activity[] }) {
    return <MapHeatmap activities={activities} />;
}
