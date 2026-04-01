'use client';

import { useState } from 'react';

interface AvailabilityCalendarProps {
  saunaId: number;
}

export function AvailabilityCalendar({ saunaId }: AvailabilityCalendarProps) {
  const [date, setDate] = useState('');
  const [hours, setHours] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  function toggleHour(hour: number) {
    setHours(prev => ({ ...prev, [hour]: !prev[hour] }));
  }

  function selectAll() {
    const allHours: Record<number, boolean> = {};
    for (let h = 6; h <= 22; h++) allHours[h] = true;
    setHours(allHours);
  }

  function clearAll() {
    setHours({});
  }

  async function handleSave() {
    if (!date) {
      setMessage('Velg en dato først');
      return;
    }
    setSaving(true);
    setMessage('');

    const hoursList = Object.entries(hours).map(([h, available]) => ({
      hour: parseInt(h),
      is_available: available,
    }));

    try {
      const response = await fetch(`/api/host/saunas/${saunaId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, hours: hoursList }),
      });

      if (!response.ok) throw new Error('Feil ved lagring');
      setMessage('Tilgjengelighet lagret!');
    } catch {
      setMessage('Kunne ikke lagre tilgjengelighet');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1.5">Dato</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="px-4 py-3 rounded-xl border border-stone-300 bg-white focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 outline-none transition-all"
        />
      </div>

      <div className="flex gap-2 mb-2">
        <button type="button" onClick={selectAll} className="text-xs text-[var(--color-accent)] hover:underline">Velg alle</button>
        <button type="button" onClick={clearAll} className="text-xs text-stone-400 hover:underline">Fjern alle</button>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
        {Array.from({ length: 17 }, (_, i) => i + 6).map(hour => (
          <button
            key={hour}
            type="button"
            onClick={() => toggleHour(hour)}
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              hours[hour]
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {hour}:00
          </button>
        ))}
      </div>

      {message && (
        <p className={`text-sm ${message.includes('lagret') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-[var(--color-accent)] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[var(--color-accent)]/90 transition-all disabled:opacity-50"
      >
        {saving ? 'Lagrer...' : 'Lagre tilgjengelighet'}
      </button>
    </div>
  );
}
