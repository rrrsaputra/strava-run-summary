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

    return (
        <div className="w-full h-[650px] rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-sm relative z-0">
            <MapContainer center={center} zoom={13} scrollWheelZoom={true} className="w-full h-full bg-[#0a0a0a]">
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
        </div>
    );
}
