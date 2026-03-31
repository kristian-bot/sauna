'use client';

import { useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Header } from '@/components/ui/Header';
import { Container } from '@/components/ui/Container';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { formatDateNorwegian, formatHourRange } from '@/lib/timezone';
import { getPriceDisplay, calculatePrice, formatPriceNOK } from '@/lib/pricing';
import type { BookingType } from '@/lib/types';

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

  const priceOere = calculatePrice(bookingType, numPeople);

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

      // Redirect to Vipps
      window.location.href = data.vipps_redirect_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt');
      setSubmitting(false);
    }
  }

  return (
    <>
      <StepIndicator currentStep={3} />
      <h1 className="text-2xl font-bold mb-6">Bekreft og betal</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
          <h2 className="font-semibold text-lg mb-4">Oppsummering</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-stone-500">Badstu</dt>
              <dd className="font-medium">{saunaName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Dato</dt>
              <dd className="font-medium capitalize">{formatDateNorwegian(date)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Tid</dt>
              <dd className="font-medium">{formatHourRange(hour)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Type</dt>
              <dd className="font-medium">{bookingType === 'private' ? 'Privat' : 'Felles'}</dd>
            </div>
            {bookingType === 'shared' && (
              <div className="flex justify-between">
                <dt className="text-stone-500">Antall</dt>
                <dd className="font-medium">{numPeople} {numPeople === 1 ? 'person' : 'personer'}</dd>
              </div>
            )}
            <hr className="border-stone-100" />
            <div className="flex justify-between">
              <dt className="text-stone-500">Pris</dt>
              <dd className="font-medium text-sm">{getPriceDisplay(bookingType, numPeople)}</dd>
            </div>
            <div className="flex justify-between text-lg">
              <dt className="font-semibold">Totalt</dt>
              <dd className="font-bold">{formatPriceNOK(priceOere)}</dd>
            </div>
          </dl>
        </div>

        {/* Customer form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="font-semibold text-lg">Dine opplysninger</h2>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Navn</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ola Nordmann"
              className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">E-post</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ola@eksempel.no"
              className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Telefon</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="412 34 567"
              className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] outline-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#ff5b24] text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-[#e54d1a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              'Betal med Vipps'
            )}
          </button>
        </form>
      </div>
    </>
  );
}

export default function BookConfirm() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Container>
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-brand)]" />
          </div>
        }>
          <ConfirmForm />
        </Suspense>
      </Container>
    </div>
  );
}
