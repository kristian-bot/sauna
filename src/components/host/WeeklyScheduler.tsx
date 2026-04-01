'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface WeeklySchedulerProps {
  saunaId: number;
  initialSchedule?: Record<number, number[]>;
  onSave: (schedule: Record<number, number[]>) => Promise<void>;
}

const DAYS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
const DAY_FULL = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 - 22:00

export function WeeklyScheduler({ initialSchedule = {}, onSave }: WeeklySchedulerProps) {
  const [schedule, setSchedule] = useState<Record<number, number[]>>(() => {
    const s: Record<number, number[]> = {};
    for (let d = 0; d < 7; d++) s[d] = initialSchedule[d] || [];
    return s;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Desktop drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'add' | 'remove'>('add');
  const dragStartRef = useRef<{ day: number; hour: number } | null>(null);

  // Mobile state
  const [activeDay, setActiveDay] = useState(0);

  function isSelected(day: number, hour: number) {
    return schedule[day]?.includes(hour) ?? false;
  }

  function toggleCell(day: number, hour: number) {
    setSchedule(prev => {
      const hours = prev[day] || [];
      const next = hours.includes(hour)
        ? hours.filter(h => h !== hour)
        : [...hours, hour].sort((a, b) => a - b);
      return { ...prev, [day]: next };
    });
    setSaved(false);
  }

  function applyRange(startDay: number, startHour: number, endDay: number, endHour: number, mode: 'add' | 'remove') {
    const minDay = Math.min(startDay, endDay);
    const maxDay = Math.max(startDay, endDay);
    const minHour = Math.min(startHour, endHour);
    const maxHour = Math.max(startHour, endHour);

    setSchedule(prev => {
      const next = { ...prev };
      for (let d = minDay; d <= maxDay; d++) {
        const hours = [...(next[d] || [])];
        for (let h = minHour; h <= maxHour; h++) {
          if (mode === 'add' && !hours.includes(h)) {
            hours.push(h);
          } else if (mode === 'remove') {
            const idx = hours.indexOf(h);
            if (idx !== -1) hours.splice(idx, 1);
          }
        }
        next[d] = hours.sort((a, b) => a - b);
      }
      return next;
    });
    setSaved(false);
  }

  const handleMouseDown = useCallback((day: number, hour: number) => {
    const mode = isSelected(day, hour) ? 'remove' : 'add';
    setDragMode(mode);
    setIsDragging(true);
    dragStartRef.current = { day, hour };
    toggleCell(day, hour);
  }, [schedule]);

  const handleMouseEnter = useCallback((day: number, hour: number) => {
    if (!isDragging || !dragStartRef.current) return;
    applyRange(dragStartRef.current.day, dragStartRef.current.hour, day, hour, dragMode);
  }, [isDragging, dragMode]);

  useEffect(() => {
    function handleMouseUp() {
      setIsDragging(false);
      dragStartRef.current = null;
    }
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  function presetWeekdays() {
    setSchedule(prev => {
      const next = { ...prev };
      for (let d = 0; d < 5; d++) {
        next[d] = HOURS.filter(h => h >= 8 && h <= 21);
      }
      return next;
    });
    setSaved(false);
  }

  function presetAll() {
    setSchedule(() => {
      const next: Record<number, number[]> = {};
      for (let d = 0; d < 7; d++) next[d] = [...HOURS];
      return next;
    });
    setSaved(false);
  }

  function clearAll() {
    setSchedule(() => {
      const next: Record<number, number[]> = {};
      for (let d = 0; d < 7; d++) next[d] = [];
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(schedule);
      setSaved(true);
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Quick buttons */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={presetWeekdays} className="px-3 py-1.5 text-xs bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors">
          Hverdager 08-22
        </button>
        <button type="button" onClick={presetAll} className="px-3 py-1.5 text-xs bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors">
          Alle
        </button>
        <button type="button" onClick={clearAll} className="px-3 py-1.5 text-xs bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors">
          Fjern alle
        </button>
      </div>

      {/* Desktop grid */}
      <div className="hidden md:block overflow-x-auto select-none">
        <div className="inline-grid" style={{ gridTemplateColumns: `60px repeat(7, 1fr)` }}>
          {/* Header row */}
          <div />
          {DAYS.map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-stone-500 pb-2 px-1 min-w-[60px]">
              {day}
            </div>
          ))}

          {/* Hour rows */}
          {HOURS.map(hour => (
            <div key={hour} className="contents">
              <div className="text-xs text-stone-400 pr-2 py-0.5 text-right whitespace-nowrap">
                {String(hour).padStart(2, '0')}:00
              </div>
              {DAYS.map((_, day) => (
                <div
                  key={`${day}-${hour}`}
                  onMouseDown={() => handleMouseDown(day, hour)}
                  onMouseEnter={() => handleMouseEnter(day, hour)}
                  className={`h-7 border border-stone-100 cursor-pointer transition-colors min-w-[60px] ${
                    isSelected(day, hour)
                      ? 'bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/80'
                      : 'bg-white hover:bg-stone-50'
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: day tabs + hour buttons */}
      <div className="md:hidden space-y-3">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {DAYS.map((day, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveDay(i)}
              className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${
                activeDay === i
                  ? 'bg-[var(--color-brand)] text-white'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        <p className="text-sm font-medium text-stone-600">{DAY_FULL[activeDay]}</p>

        <div className="grid grid-cols-4 gap-2">
          {HOURS.map(hour => (
            <button
              key={hour}
              type="button"
              onClick={() => toggleCell(activeDay, hour)}
              className={`py-2 text-sm rounded-lg transition-colors ${
                isSelected(activeDay, hour)
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {String(hour).padStart(2, '0')}:00
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full sm:w-auto bg-[var(--color-accent)] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[var(--color-accent)]/90 transition-all disabled:opacity-50"
      >
        {saving ? 'Lagrer...' : saved ? 'Lagret!' : 'Lagre tilgjengelighet'}
      </button>
    </div>
  );
}
