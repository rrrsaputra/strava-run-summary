"use client";

import { useEffect, useState } from "react";
import { Activity } from "@/lib/strava";
import { MapContainer, TileLayer, Polyline, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Dekode algoritma dari Strava API `summary_polyline` menjadi set titik kordinat lat/long
function decodePolyline(encoded: string) {
    let index = 0, lat = 0, lng = 0;
    const coordinates: [number, number][] = [];
    
    while (index < encoded.length) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        coordinates.push([lat / 1e5, lng / 1e5]);
    }
    return coordinates;
}

// Bounding box estimasi Mainland Jakarta
const JKT_NORTH = -6.08;
const JKT_SOUTH = -6.37;
const JKT_WEST = 106.68;
const JKT_EAST = 106.97;
const GRID_SIZE = 150; // Grid lebih rapat untuk akurasi lebih baik

function calculateJakartaExploration(polylines: { positions: [number, number][] }[]) {
    const visitedCells = new Set<string>();
    
    polylines.forEach(route => {
        route.positions.forEach(pos => {
            const lat = pos[0];
            const lng = pos[1];
            
            if (lat <= JKT_NORTH && lat >= JKT_SOUTH && lng >= JKT_WEST && lng <= JKT_EAST) {
                const latIdx = Math.floor(((lat - JKT_SOUTH) / (JKT_NORTH - JKT_SOUTH)) * GRID_SIZE);
                const lngIdx = Math.floor(((lng - JKT_WEST) / (JKT_EAST - JKT_WEST)) * GRID_SIZE);
                
                visitedCells.add(`${latIdx}-${lngIdx}`);
            }
        });
    });
    
    const totalCells = GRID_SIZE * GRID_SIZE;
    const percentage = (visitedCells.size / totalCells) * 100;
    
    return {
        visited: visitedCells.size,
        total: totalCells,
        percentage: percentage.toFixed(2)
    };
}

export default function MapHeatmap({ activities }: { activities: Activity[] }) {
    // Siapkan semua polyline jalanan yang pernah dilewati
    const polylines = activities
        .filter(a => a.map && a.map.summary_polyline)
        .map(a => ({
            id: a.id,
            name: a.name,
            type: a.type,
            distance: a.distance,
            positions: decodePolyline(a.map.summary_polyline)
        }));

    if (polylines.length === 0) {
        return <div className="p-8 text-center text-gray-500 bg-white dark:bg-zinc-900 rounded-xl border border-dashed dark:border-zinc-800">Belum ada satupun rute peta yang terekam dari aktivitasmu.</div>;
    }

    // Pusat peta: Ambil rute paling terbaru sebagai pusat
    const center = polylines[0].positions[Math.floor(polylines[0].positions.length / 2)] || [ -6.2088, 106.8456 ]; // Default Jakarta

    const explorationStat = calculateJakartaExploration(polylines);

    return (
        <div className="w-full h-[650px] rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-sm relative z-0">
            <MapContainer center={center as [number, number]} zoom={13} scrollWheelZoom={true} className="w-full h-full bg-[#0a0a0a] z-0">
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                
                {polylines.map((route) => (
                    <Polyline 
                        key={route.id} 
                        positions={route.positions} 
                        color={route.type === "Run" ? "#ff5a1f" : "#3b82f6"} // Strava Orange for Runs, Blue for others
                        weight={3}
                        opacity={0.4}
                    >
                        <Tooltip sticky className="dark:bg-zinc-800 dark:text-white dark:border-zinc-700">
                            <span className="font-semibold block">{route.name}</span>
                            <span className="text-xs">{(route.distance / 1000).toFixed(2)} km</span>
                        </Tooltip>
                    </Polyline>
                ))}
            </MapContainer>

            {/* Panel Floating untuk Statistik Eksplorasi Jakarta */}
            <div className="absolute top-4 right-4 z-[1000] bg-white/90 dark:bg-black/80 backdrop-blur-md p-4 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-lg pointer-events-none">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Eksplorasi Jakarta</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-orange-600">{explorationStat.percentage}%</span>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">Area terjelajahi berdasarkan estimasi grid</p>
            </div>
        </div>
    );
}
