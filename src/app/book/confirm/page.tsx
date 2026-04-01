'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Header } from '@/components/ui/Header';
import { Container } from '@/components/ui/Container';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { formatDateNorwegian, formatHourRange } from '@/lib/timezone';
import { formatPriceNOK, getSaunaPrice, calculatePrice } from '@/lib/pricing';
import type { BookingType, Sauna } from '@/lib/types';

function ConfirmForm() {
  const searchParams = useSearchParams();
  const saunaId = searchParams.get('sauna_id') || '';
  const date = searchParams.get('date') || '';
  const hour = parseInt(searchParams.get('hour') || '0');
  const bookingType = (searchParams.get('booking_type') || 'shared') as BookingType;
  const numPeople = parseInt(searchParams.get('num_people') || '1');
  const saunaName = searchParams.get('sauna_name') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [priceOere, setPriceOere] = useState(() => calculatePrice(bookingType, numPeople));

  // Try to fetch actual sauna pricing
  useEffect(() => {
    if (!saunaId) return;
    fetch(`/api/saunas`)
      .then(r => r.json())
      .then(data => {
        const sauna = (data.saunas || []).find((s: Sauna) => s.id === parseInt(saunaId));
        if (sauna) {
          setPriceOere(getSaunaPrice(sauna as Sauna, bookingType, numPeople));
        }
      })
      .catch(() => {/* use fallback price */});
  }, [saunaId, bookingType, numPeople]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sauna_id: parseInt(saunaId),
          date,
          hour,
          booking_type: bookingType,
          num_people: numPeople,
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Noe gikk galt');
      }

      window.location.href = data.vipps_redirect_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt');
      setSubmitting(false);
    }
  }

  return (
    <>
      <StepIndicator currentStep={3} />

      {/* Order summary card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 mb-6">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-stone-100">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-light)] flex items-center justify-center text-lg">
            🧖
          </div>
          <div className="flex-1">
            <div className="font-semibold">{saunaName}</div>
            <div className="text-xs text-stone-400 capitalize">{formatDateNorwegian(date)}</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg">{formatPriceNOK(priceOere)}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xs text-stone-400 mb-0.5">Tid</div>
            <div className="text-sm font-semibold">{formatHourRange(hour)}</div>
          </div>
          <div>
            <div className="text-xs text-stone-400 mb-0.5">Type</div>
            <div className="text-sm font-semibold">{bookingType === 'private' ? 'Privat' : 'Felles'}</div>
          </div>
          <div>
            <div className="text-xs text-stone-400 mb-0.5">Antall</div>
            <div className="text-sm font-semibold">{numPeople} {numPeople === 1 ? 'pers.' : 'pers.'}</div>
          </div>
        </div>
      </div>

      {/* Customer form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-base font-semibold text-[var(--color-brand)]">Dine opplysninger</h2>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">Navn</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ola Nordmann"
            autoComplete="name"
            className="w-full px-4 py-3.5 rounded-xl border border-stone-300 bg-white focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">E-post</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ola@eksempel.no"
            autoComplete="email"
            className="w-full px-4 py-3.5 rounded-xl border border-stone-300 bg-white focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">Telefon</label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="412 34 567"
            autoComplete="tel"
            className="w-full px-4 py-3.5 rounded-xl border border-stone-300 bg-white focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 outline-none transition-all"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-100 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[var(--color-accent)] text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-[var(--color-accent)]/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-[var(--color-accent)]/20"
        >
          {submitting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            <>
              Bekreft booking — {formatPriceNOK(priceOere)}
            </>
          )}
        </button>

        <p className="text-xs text-center text-stone-400">
          Betaling med Vipps og Apple/Google Pay kommer snart.
        </p>
      </form>
    </>
  );
}

export default function BookConfirm() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Container>
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-accent)]" />
          </div>
        }>
          <ConfirmForm />
        </Suspense>
      </Container>
    </div>
  );
}
