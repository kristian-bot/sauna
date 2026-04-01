'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Cabin {
  id: number;
  name: string;
  color: string;
}

interface BookingFormProps {
  cabins: Cabin[];
}

export function BookingForm({ cabins }: BookingFormProps) {
  const router = useRouter();
  const [cabinId, setCabinId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/hytte/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cabin_id: Number(cabinId),
        check_in: checkIn,
        check_out: checkOut,
        note: note || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Noe gikk galt');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push('/hytte/mine'), 1500);
  }

  if (success) {
    return (
      <div className="bg-green-50 text-green-800 px-6 py-8 rounded-xl text-center">
        <p className="text-lg font-medium">Booking sendt!</p>
        <p className="text-sm mt-1">Venter på godkjenning fra admin.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">Velg hytte</label>
        <div className="grid grid-cols-3 gap-3">
          {cabins.map((cabin) => (
            <button
              key={cabin.id}
              type="button"
              onClick={() => setCabinId(String(cabin.id))}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                cabinId === String(cabin.id)
                  ? 'border-current shadow-md scale-[1.02]'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
              style={{
                borderColor: cabinId === String(cabin.id) ? cabin.color : undefined,
                backgroundColor: cabinId === String(cabin.id) ? `${cabin.color}10` : undefined,
              }}
            >
              <div
                className="w-4 h-4 rounded-full mx-auto mb-2"
                style={{ backgroundColor: cabin.color }}
              />
              <span className="text-sm font-medium">{cabin.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Innsjekk</label>
          <input
            type="date"
            required
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Utsjekk</label>
          <input
            type="date"
            required
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            min={checkIn || new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Kommentar (valgfritt)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="F.eks. antall gjester, spesielle behov..."
          className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] outline-none resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading || !cabinId || !checkIn || !checkOut}
        className="w-full bg-[var(--color-accent)] text-white px-4 py-3.5 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? 'Sender...' : 'Send bookingforespørsel'}
      </button>
    </form>
  );
}
