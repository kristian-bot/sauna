'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { Container } from '@/components/ui/Container';
import { formatPriceNOK } from '@/lib/pricing';
import { formatDateNorwegian, formatHour } from '@/lib/timezone';
import type { Event } from '@/lib/types';

const EVENT_TYPE_LABELS: Record<string, string> = {
  yoga: 'Yoga',
  breathing: 'Pusteøvelser',
  meditation: 'Meditasjon',
  custom: 'Arrangement',
};

export default function EventDetailPage() {
  const { slug, eventId } = useParams<{ slug: string; eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [saunaName, setSaunaName] = useState('');
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [numPeople, setNumPeople] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/saunas/${slug}`)
      .then(r => r.json())
      .then(data => {
        setSaunaName(data.sauna?.name || '');
        const found = (data.events || []).find((e: Event) => e.id === eventId);
        setEvent(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug, eventId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/events/${eventId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          num_people: numPeople,
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Noe gikk galt');

      window.location.href = data.vipps_redirect_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-accent)]" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <Container>
          <p className="text-center py-20 text-stone-500">Event ikke funnet</p>
        </Container>
      </div>
    );
  }

  const spotsLeft = event.max_participants - event.current_participants;
  const totalPrice = event.price_per_person_oere * numPeople;
  const inputClass = 'w-full px-4 py-3.5 rounded-xl border border-stone-300 bg-white focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 outline-none transition-all';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Container>
        <div className="max-w-lg mx-auto py-4">
          {/* Event info */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 mb-6">
            <span className="text-xs bg-[var(--color-accent-light)] text-[var(--color-accent)] px-2 py-0.5 rounded-full font-medium">
              {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
            </span>
            <h1 className="text-xl font-bold text-[var(--color-brand)] mt-2 mb-1">{event.title}</h1>
            <p className="text-sm text-stone-500 mb-3">{saunaName}</p>
            {event.description && (
              <p className="text-sm text-stone-600 mb-4">{event.description}</p>
            )}
            <div className="grid grid-cols-3 gap-3 text-center border-t border-stone-100 pt-3">
              <div>
                <p className="text-xs text-stone-400">Dato</p>
                <p className="text-sm font-semibold">{formatDateNorwegian(event.date)}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400">Tid</p>
                <p className="text-sm font-semibold">{formatHour(event.start_hour)}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400">Pris</p>
                <p className="text-sm font-semibold">{formatPriceNOK(event.price_per_person_oere)}/pers</p>
              </div>
            </div>
            <p className="text-xs text-center text-stone-400 mt-2">
              {spotsLeft} av {event.max_participants} plasser igjen
            </p>
          </div>

          {/* Booking form */}
          {event.is_full ? (
            <div className="text-center py-8">
              <p className="text-lg font-semibold text-red-600">Eventet er fullt</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-base font-semibold text-[var(--color-brand)]">Book plasser</h2>

              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">Antall personer</label>
                <input type="number" min={1} max={spotsLeft} value={numPeople} onChange={e => setNumPeople(parseInt(e.target.value) || 1)} className={inputClass} />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">Navn</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Ola Nordmann" autoComplete="name" className={inputClass} />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">E-post</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="ola@eksempel.no" autoComplete="email" className={inputClass} />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">Telefon</label>
                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="412 34 567" autoComplete="tel" className={inputClass} />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-100">{error}</div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#ff5b24] text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-[#e54d1a] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-[#ff5b24]/20"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>Betal {formatPriceNOK(totalPrice)} med Vipps</>
                )}
              </button>
            </form>
          )}
        </div>
      </Container>
    </div>
  );
}
