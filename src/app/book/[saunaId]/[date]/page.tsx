'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { Container } from '@/components/ui/Container';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { TimeSlotGrid } from '@/components/booking/TimeSlotGrid';
import type { SlotAvailability, BookingType } from '@/lib/types';
import { formatDateNorwegian } from '@/lib/timezone';
import { PRIVATE_PRICE_NOK, SHARED_PRICE_PER_PERSON_NOK } from '@/lib/pricing';

export default function BookStep2({ params }: { params: Promise<{ saunaId: string; date: string }> }) {
  const { saunaId, date } = use(params);
  const router = useRouter();
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingType, setBookingType] = useState<BookingType>('shared');
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [numPeople, setNumPeople] = useState(1);
  const [saunaName, setSaunaName] = useState('');

  useEffect(() => {
    fetch(`/api/saunas/${saunaId}/availability?date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots || []);
        setSaunaName(data.sauna_name || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [saunaId, date]);

  function handleNext() {
    if (selectedHour === null) return;
    const searchParams = new URLSearchParams({
      sauna_id: saunaId,
      date,
      hour: String(selectedHour),
      booking_type: bookingType,
      num_people: String(numPeople),
      sauna_name: saunaName,
    });
    router.push(`/book/confirm?${searchParams.toString()}`);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Container>
        <StepIndicator currentStep={2} />

        <div className="mb-6">
          <h1 className="text-2xl font-bold">{saunaName || `Badstu ${saunaId}`}</h1>
          <p className="text-stone-500 capitalize">{formatDateNorwegian(date)}</p>
        </div>

        {/* Booking type selector */}
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-3">Velg bookingtype</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => { setBookingType('private'); setSelectedHour(null); }}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                bookingType === 'private'
                  ? 'border-[var(--color-brand)] bg-[var(--color-warm)]'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <h3 className="font-semibold">Privat</h3>
              <p className="text-sm text-stone-500 mt-1">Hele badstuen for deg. {PRIVATE_PRICE_NOK} kr/time.</p>
            </button>
            <button
              onClick={() => { setBookingType('shared'); setSelectedHour(null); }}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                bookingType === 'shared'
                  ? 'border-[var(--color-brand)] bg-[var(--color-warm)]'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <h3 className="font-semibold">Felles</h3>
              <p className="text-sm text-stone-500 mt-1">Del med andre. {SHARED_PRICE_PER_PERSON_NOK} kr/person.</p>
            </button>
          </div>
        </div>

        {/* Number of people (shared only) */}
        {bookingType === 'shared' && (
          <div className="mb-8">
            <h2 className="text-lg font-medium mb-3">Antall personer</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setNumPeople(Math.max(1, numPeople - 1))}
                className="w-10 h-10 rounded-lg border border-stone-300 flex items-center justify-center hover:bg-stone-100"
              >
                −
              </button>
              <span className="text-xl font-medium w-8 text-center">{numPeople}</span>
              <button
                onClick={() => setNumPeople(numPeople + 1)}
                className="w-10 h-10 rounded-lg border border-stone-300 flex items-center justify-center hover:bg-stone-100"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Time slots */}
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-3">Velg tid</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-brand)]" />
            </div>
          ) : (
            <TimeSlotGrid
              slots={slots}
              selectedHour={selectedHour}
              onSelect={setSelectedHour}
              bookingType={bookingType}
            />
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={selectedHour === null}
          className="bg-[var(--color-brand)] text-white px-8 py-3 rounded-xl font-medium hover:bg-[var(--color-brand-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Gå til betaling →
        </button>
      </Container>
    </div>
  );
}
