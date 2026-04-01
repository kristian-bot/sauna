'use client';

import type { SlotAvailability, BookingType } from '@/lib/types';
import { formatHourRange } from '@/lib/timezone';

interface TimeSlotGridProps {
  slots: SlotAvailability[];
  selectedHour: number | null;
  onSelect: (hour: number) => void;
  bookingType: BookingType;
}

export function TimeSlotGrid({ slots, selectedHour, onSelect, bookingType }: TimeSlotGridProps) {
  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-stone-400">
        <p>Ingen tilgjengelige tider denne dagen.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
      {slots.map((slot) => {
        const isAvailable = slot.available;
        const isSelected = slot.hour === selectedHour;
        const conflictsType = !isAvailable && slot.booking_type && slot.booking_type !== bookingType;

        let statusText = '';
        let statusColor = 'text-stone-400';
        if (!isAvailable) {
          if (slot.is_full) {
            statusText = 'Fullt';
          } else if (conflictsType) {
            statusText = slot.booking_type === 'private' ? 'Privat' : 'Felles';
          }
        } else if (slot.booking_type === 'shared' && slot.spots_left !== null) {
          statusText = `${slot.spots_left} plasser`;
          statusColor = 'text-[var(--color-accent)]';
        }

        return (
          <button
            key={slot.hour}
            disabled={!isAvailable}
            onClick={() => onSelect(slot.hour)}
            className={`p-3.5 sm:p-4 rounded-2xl border-2 text-center transition-all active:scale-[0.97] ${
              !isAvailable
                ? 'border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed opacity-60'
                : isSelected
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)] shadow-md'
                : 'border-stone-200 bg-white hover:border-stone-300'
            }`}
          >
            <div className={`font-semibold ${isSelected ? 'text-[var(--color-brand)]' : ''}`}>{formatHourRange(slot.hour)}</div>
            {statusText && (
              <div className={`text-xs mt-1 ${isSelected ? 'text-[var(--color-accent)]' : statusColor}`}>{statusText}</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
