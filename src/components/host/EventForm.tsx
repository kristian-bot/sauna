'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EventFormProps {
  saunaId: number;
}

export function EventForm({ saunaId }: EventFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('yoga');
  const [date, setDate] = useState('');
  const [startHour, setStartHour] = useState(18);
  const [durationHours, setDurationHours] = useState(1);
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [priceNok, setPriceNok] = useState(300);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/host/saunas/${saunaId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          event_type: eventType,
          date,
          start_hour: startHour,
          duration_hours: durationHours,
          max_participants: maxParticipants,
          price_per_person_oere: Math.round(priceNok * 100),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Noe gikk galt');
      }

      router.refresh();
      // Reset form
      setTitle('');
      setDescription('');
      setDate('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-stone-300 bg-white focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 outline-none transition-all';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-semibold text-[var(--color-brand)]">Nytt event</h3>

      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1">Tittel</label>
        <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="F.eks. Yoga i badstuen" />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1">Beskrivelse</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={inputClass} placeholder="Hva skjer på eventet?" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">Type</label>
          <select value={eventType} onChange={e => setEventType(e.target.value)} className={inputClass}>
            <option value="yoga">Yoga</option>
            <option value="breathing">Pusteøvelser</option>
            <option value="meditation">Meditasjon</option>
            <option value="custom">Annet</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">Dato</label>
          <input type="date" required value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">Klokkeslett</label>
          <input type="number" min={0} max={23} value={startHour} onChange={e => setStartHour(parseInt(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">Varighet (timer)</label>
          <input type="number" min={1} max={8} value={durationHours} onChange={e => setDurationHours(parseInt(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">Maks deltakere</label>
          <input type="number" min={1} max={100} value={maxParticipants} onChange={e => setMaxParticipants(parseInt(e.target.value))} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1">Pris per person (NOK)</label>
        <input type="number" min={0} value={priceNok} onChange={e => setPriceNok(parseInt(e.target.value))} className={inputClass} />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-100">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[var(--color-accent)] text-white py-3 rounded-xl font-semibold hover:bg-[var(--color-accent)]/90 transition-all disabled:opacity-50"
      >
        {submitting ? 'Oppretter...' : 'Opprett event'}
      </button>
    </form>
  );
}
