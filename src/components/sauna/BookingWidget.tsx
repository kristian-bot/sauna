'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatPriceNOK } from '@/lib/pricing';
import type { Sauna, BookingType } from '@/lib/types';

interface BookingWidgetProps {
  sauna: Sauna;
}

export function BookingWidget({ sauna }: BookingWidgetProps) {
  const router = useRouter();
  const [date, setDate] = useState('');
  const [hour, setHour] = useState(10);
  const [bookingType, setBookingType] = useState<BookingType>(
    sauna.allowed_booking_types?.includes('shared') ? 'shared' : 'private'
  );
  const [numPeople, setNumPeople] = useState(sauna.min_people || 1);

  const allowPrivate = sauna.allowed_booking_types?.includes('private');
  const allowShared = sauna.allowed_booking_types?.includes('shared');

  function getPrice(): number {
    if (bookingType === 'private') {
      return sauna.private_price_oere || 0;
    }
    return (sauna.shared_price_per_person_oere || 0) * numPeople;
  }

  function handleBook() {
    if (!date) return;
    const params = new URLSearchParams({
      sauna_id: sauna.id.toString(),
      date,
      hour: hour.toString(),
      booking_type: bookingType,
      num_people: numPeople.toString(),
      sauna_name: sauna.name,
    });
    router.push(`/book/confirm?${params}`);
  }

  const price = getPrice();

  return (
    <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-4">
      <h3 className="font-semibold text-[var(--color-brand)]">Book badstu</h3>

      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1.5">Dato</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1.5">Klokkeslett</label>
        <select
          value={hour}
          onChange={e => setHour(parseInt(e.target.value))}
          className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 outline-none transition-all"
        >
          {Array.from({ length: 15 }, (_, i) => i + 8).map(h => (
            <option key={h} value={h}>{h}:00 – {h + 1}:00</option>
          ))}
        </select>
      </div>

      {allowPrivate && allowShared && (
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setBookingType('shared')}
              className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                bookingType === 'shared'
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                  : 'border-stone-200 text-stone-600 hover:border-stone-300'
              }`}
            >
              Felles
            </button>
            <button
              type="button"
              onClick={() => setBookingType('private')}
              className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                bookingType === 'private'
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                  : 'border-stone-200 text-stone-600 hover:border-stone-300'
              }`}
            >
              Privat
            </button>
          </div>
        </div>
      )}

      {bookingType === 'shared' && (
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">Antall personer</label>
          <input
            type="number"
            min={sauna.min_people || 1}
            max={sauna.max_people || sauna.capacity}
            value={numPeople}
            onChange={e => setNumPeople(parseInt(e.target.value) || 1)}
            className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 outline-none transition-all"
          />
        </div>
      )}

      <div className="pt-2 border-t border-stone-100">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-stone-500">Totalt</span>
          <span className="text-xl font-bold">{formatPriceNOK(price)}</span>
        </div>
        <button
          onClick={handleBook}
          disabled={!date}
          className="w-full bg-[var(--color-accent)] text-white py-3.5 rounded-2xl font-semibold hover:bg-[var(--color-accent)]/90 active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg shadow-[var(--color-accent)]/20"
        >
          Gå til betaling
        </button>
      </div>
    </div>
  );
}
