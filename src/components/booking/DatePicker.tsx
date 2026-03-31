'use client';

import { useState, useMemo } from 'react';
import { todayDateString } from '@/lib/timezone';

interface DatePickerProps {
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('nb-NO', { month: 'long', year: 'numeric' });
}

export function DatePicker({ selectedDate, onSelect }: DatePickerProps) {
  const today = todayDateString();
  const [viewYear, setViewYear] = useState(() => parseInt(today.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => parseInt(today.slice(5, 7)) - 1);

  const days = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    // Adjust for Monday start (0 = Mon, 6 = Sun)
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    const cells: (string | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const m = String(viewMonth + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push(`${viewYear}-${m}-${dd}`);
    }
    return cells;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200 max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-stone-100 rounded-lg text-stone-600">
          ←
        </button>
        <h3 className="font-medium capitalize">{formatMonthYear(viewYear, viewMonth)}</h3>
        <button onClick={nextMonth} className="p-2 hover:bg-stone-100 rounded-lg text-stone-600">
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'].map((d) => (
          <div key={d} className="text-xs font-medium text-stone-400 py-1">
            {d}
          </div>
        ))}
        {days.map((dateStr, i) => {
          if (!dateStr) return <div key={`empty-${i}`} />;
          const isPast = dateStr < today;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;
          const day = parseInt(dateStr.slice(8));

          return (
            <button
              key={dateStr}
              disabled={isPast}
              onClick={() => onSelect(dateStr)}
              className={`py-2 rounded-lg text-sm transition-all ${
                isPast
                  ? 'text-stone-300 cursor-not-allowed'
                  : isSelected
                  ? 'bg-[var(--color-brand)] text-white font-medium'
                  : isToday
                  ? 'bg-stone-100 font-medium hover:bg-stone-200'
                  : 'hover:bg-stone-100'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
