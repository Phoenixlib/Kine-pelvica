import React, { useEffect, useState } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Download } from 'lucide-react';
import type { Appointment, Client } from '../types';

export function CalendarView() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    Promise.all([
      fetch('/api/appointments').then(r => r.json()),
      fetch('/api/clients').then(r => r.json())
    ]).then(([appts, cs]) => {
      setAppointments(appts || []);
      setClients(cs || []);
    });
  }, []);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 11 }).map((_, i) => i + 8); // 8 AM to 6 PM

  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Unknown Client';

  // Basic Export Mock
  const handleExport = () => {
    alert("Exporting appointments as PDF... (mock)");
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[calc(100vh-8rem)]">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex rounded-md shadow-sm">
            <button onClick={prevWeek} className="p-2 border border-slate-200 dark:border-slate-700 rounded-l-md hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="px-4 py-2 border-y border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-sm text-slate-700 dark:text-slate-200">
              Today
            </button>
            <button onClick={nextWeek} className="p-2 border border-slate-200 dark:border-slate-700 rounded-r-md hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
            {format(weekStart, 'MMMM yyyy')}
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition">
            <Plus className="w-4 h-4" /> New Appointment
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex">
        {/* Time Sidebar */}
        <div className="w-16 flex-none border-r border-slate-200 dark:border-slate-800 pt-12">
          {hours.map(hour => (
            <div key={hour} className="h-20 border-b border-slate-100 dark:border-slate-800/50 text-right pr-2">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </span>
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="flex-1 grid grid-cols-7 min-w-[800px]">
          {weekDays.map(day => (
            <div key={day.toISOString()} className="flex flex-col border-r border-slate-200 dark:border-slate-800">
              {/* Day Header */}
              <div className="h-12 border-b border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50">
                <span className="text-xs font-medium text-slate-500 uppercase">{format(day, 'EEE')}</span>
                <span className={`text-sm font-bold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-indigo-600 text-white' : 'text-slate-900 dark:text-white'}`}>
                  {format(day, 'd')}
                </span>
              </div>
              
              {/* Day Slots */}
              <div className="flex-1 relative pb-20">
                {hours.map(hour => (
                  <div key={hour} className="h-20 border-b border-slate-100 dark:border-slate-800/50"></div>
                ))}

                {/* Render Appointments for this day */}
                {appointments
                  .filter(a => isSameDay(new Date(a.date), day))
                  .map(appt => {
                    const d = new Date(appt.date);
                    const startHour = d.getHours() + d.getMinutes() / 60;
                    if (startHour < 8 || startHour > 18) return null;
                    
                    const top = (startHour - 8) * 80; // 80px per hour
                    const height = (appt.durationMinutes / 60) * 80;

                    return (
                      <div 
                        key={appt.id}
                        className="absolute left-1 right-1 rounded-md p-2 text-xs overflow-hidden shadow-sm border"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor: appt.status === 'Confirmed' ? 'var(--color-emerald-50, #ecfdf5)' : 'var(--color-amber-50, #fffbeb)',
                          borderColor: appt.status === 'Confirmed' ? 'var(--color-emerald-200, #a7f3d0)' : 'var(--color-amber-200, #fde68a)',
                          color: appt.status === 'Confirmed' ? 'var(--color-emerald-900, #064e3b)' : 'var(--color-amber-900, #78350f)'
                        }}
                      >
                        <div className="font-semibold">{appt.title}</div>
                        <div className="opacity-80 mt-0.5">{getClientName(appt.clientId)}</div>
                        <div className="opacity-75 mt-0.5">{format(d, 'h:mm a')}</div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
