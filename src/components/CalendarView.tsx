"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isToday, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Activity } from "@/lib/strava";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarView({ activities }: { activities: Activity[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  // Map activities by date string (YYYY-MM-DD)
  const activitiesByDate: Record<string, Activity[]> = {};
  activities.forEach(a => {
    // start_date_local format is usually "YYYY-MM-DDTHH:mm:ssZ"
    const dateStr = a.start_date_local.split('T')[0];
    if (!activitiesByDate[dateStr]) {
      activitiesByDate[dateStr] = [];
    }
    activitiesByDate[dateStr].push(a);
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Calculate padding days to correctly align the first day to the correct weekday
  const firstDayOfMonth = startDate.getDay(); // 0 is Sunday
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 min-w-[200px]">
          {format(currentDate, 'MMMM yyyy', { locale: idLocale })}
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-md transition mr-2"
          >
            Hari Ini
          </button>
          <button 
            onClick={prevMonth}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-700"
            aria-label="Bulan Sebelumnya"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={nextMonth}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-700"
            aria-label="Bulan Selanjutnya"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {/* Nama-nama hari */}
        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((hari, idx) => (
          <div key={idx} className="hidden lg:block text-center text-sm font-semibold text-gray-500 mb-2">
            {hari}
          </div>
        ))}

        {/* Padding awal bulan */}
        {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
          <div key={`offset-${idx}`} className="hidden lg:block min-h-[140px] rounded-lg border border-dashed border-gray-100 dark:border-zinc-800/50" />
        ))}

        {/* Hari-hari dalam bulan ini */}
        {daysInMonth.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayActivities = activitiesByDate[dateStr] || [];
          const isCurrentToday = isToday(day);

          return (
             <div 
              key={dateStr} 
              className={`border rounded-lg p-3 min-h-[140px] flex flex-col transition shadow-sm
                ${isCurrentToday 
                  ? 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-300 dark:border-orange-800/80' 
                  : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-600'
                }
              `}
            >
              <div className={`flex justify-between items-start mb-3 border-b pb-2
                ${isCurrentToday ? 'border-orange-200 dark:border-orange-900/50' : 'border-gray-100 dark:border-zinc-800'}
              `}>
                <span className={`font-semibold text-lg flex items-center justify-center w-8 h-8 rounded-full
                  ${isCurrentToday ? 'bg-orange-600 text-white' : 'text-gray-800 dark:text-gray-200'}
                `}>
                  {format(day, 'd', { locale: idLocale })}
                </span>
                <span className={`text-xs font-medium px-2 py-1 rounded
                   ${isCurrentToday ? 'text-orange-800 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/50' : 'text-gray-500 bg-gray-100 dark:bg-zinc-800'}
                `}>
                  {format(day, 'MMM', { locale: idLocale })}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2">
                {dayActivities.length > 0 ? (
                  dayActivities.map(act => (
                    <div 
                      key={act.id} 
                      className={`text-xs p-2 rounded border flex flex-col gap-1
                        ${act.type === 'Run' 
                          ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-900 dark:text-orange-200 border-orange-100 dark:border-orange-900/50'
                          : act.type === 'Ride'
                            ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 border-blue-100 dark:border-blue-900/50'
                            : 'bg-gray-50 dark:bg-zinc-800/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-zinc-700/50'
                        }
                      `}
                    >
                      <div className="font-semibold truncate" title={act.name}>
                        {act.name}
                      </div>
                      <div className="flex justify-between text-[10px] opacity-80 font-medium">
                        <span>{(act.distance / 1000).toFixed(2)} km</span>
                        <span>{Math.floor(act.moving_time / 60)} mnt</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 dark:text-zinc-600 italic text-center py-4">
                    -
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
