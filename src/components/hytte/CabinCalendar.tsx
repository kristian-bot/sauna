'use client';

import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameMonth,
  isWithinInterval,
  parseISO,
  isSameDay,
} from 'date-fns';
import { nb } from 'date-fns/locale';

interface Cabin {
  id: number;
  name: string;
  color: string;
}

interface Booking {
  id: number;
  cabin_id: number;
  check_in: string;
  check_out: string;
  status: string;
  cabins: { name: string; color: string };
  family_members: { name: string };
}

interface CabinCalendarProps {
  cabins: Cabin[];
  bookings: Booking[];
}

export function CabinCalendar({ cabins, bookings }: CabinCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const activeBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending'
  );

  function getBookingsForDay(day: Date) {
    return activeBookings.filter((b) => {
      const checkIn = parseISO(b.check_in);
      const checkOut = parseISO(b.check_out);
      // Check-out day is not included (departure day)
      return (
        isWithinInterval(day, { start: checkIn, end: checkOut }) &&
        !isSameDay(day, checkOut)
      );
    });
  }

  return (
    <div>
      {/* Header with month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-stone-200 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: nb })}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-stone-200 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {cabins.map((cabin) => (
          <div key={cabin.id} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: cabin.color }}
            />
            <span>{cabin.name}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <div className="w-3 h-3 rounded-full border-2 border-dashed border-stone-400" />
          <span>Venter på godkjenning</span>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-stone-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-stone-200 rounded-xl overflow-hidden">
        {days.map((day) => {
          const dayBookings = getBookingsForDay(day);
          const inMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`bg-white min-h-[80px] p-1 ${
                !inMonth ? 'opacity-40' : ''
              }`}
            >
              <div
                className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-[var(--color-accent)] text-white' : 'text-stone-600'
                }`}
              >
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="text-[10px] leading-tight px-1 py-0.5 rounded truncate text-white font-medium"
                    style={{
                      backgroundColor:
                        booking.status === 'pending'
                          ? 'transparent'
                          : booking.cabins.color,
                      border:
                        booking.status === 'pending'
                          ? `2px dashed ${booking.cabins.color}`
                          : 'none',
                      color:
                        booking.status === 'pending'
                          ? booking.cabins.color
                          : 'white',
                    }}
                    title={`${booking.cabins.name} – ${booking.family_members.name}`}
                  >
                    {booking.cabins.name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
