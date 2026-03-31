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
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {slots.map((slot) => {
        const isAvailable = slot.available;
        const isSelected = slot.hour === selectedHour;
        const conflictsType = !isAvailable && slot.booking_type && slot.booking_type !== bookingType;

        let statusText = '';
        if (!isAvailable) {
          if (slot.is_full) {
            statusText = 'Fullt';
          } else if (conflictsType) {
            statusText = slot.booking_type === 'private' ? 'Privat' : 'Felles';
          }
        } else if (slot.booking_type === 'shared' && slot.spots_left !== null) {
          statusText = `${slot.spots_left} plasser ledig`;
        }

        return (
          <button
            key={slot.hour}
            disabled={!isAvailable}
            onClick={() => onSelect(slot.hour)}
            className={`p-3 rounded-xl border-2 text-center transition-all ${
              !isAvailable
                ? 'border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed'
                : isSelected
                ? 'border-[var(--color-brand)] bg-[var(--color-warm)] shadow-md'
                : 'border-stone-200 bg-white hover:border-stone-300'
            }`}
          >
            <div className="font-medium text-sm">{formatHourRange(slot.hour)}</div>
            {statusText && (
              <div className="text-xs mt-1 text-stone-400">{statusText}</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
