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
      <Container className="pb-28 sm:pb-8">
        <StepIndicator currentStep={2} />

        {/* Context badge */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-light)] flex items-center justify-center text-lg">
            🧖
          </div>
          <div>
            <div className="font-semibold text-sm">{saunaName || `Badstu ${saunaId}`}</div>
            <div className="text-xs text-stone-400 capitalize">{formatDateNorwegian(date)}</div>
          </div>
        </div>

        {/* Booking type */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-[var(--color-brand)] mb-3">Bookingtype</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setBookingType('private'); setSelectedHour(null); }}
              className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${
                bookingType === 'private'
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div className="text-lg mb-1">🔒</div>
              <h3 className="font-semibold text-sm">Privat</h3>
              <p className="text-xs text-stone-400 mt-0.5">{PRIVATE_PRICE_NOK} kr/time</p>
            </button>
            <button
              onClick={() => { setBookingType('shared'); setSelectedHour(null); }}
              className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${
                bookingType === 'shared'
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div className="text-lg mb-1">👥</div>
              <h3 className="font-semibold text-sm">Felles</h3>
              <p className="text-xs text-stone-400 mt-0.5">{SHARED_PRICE_PER_PERSON_NOK} kr/person</p>
            </button>
          </div>
        </div>

        {/* Number of people */}
        {bookingType === 'shared' && (
          <div className="mb-6">
            <h2 className="text-base font-semibold text-[var(--color-brand)] mb-3">Antall personer</h2>
            <div className="flex items-center gap-3 bg-white rounded-2xl border border-stone-200 p-3 w-fit">
              <button
                onClick={() => setNumPeople(Math.max(1, numPeople - 1))}
                className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center text-lg font-medium hover:bg-stone-200 active:bg-stone-300 transition-colors"
              >
                −
              </button>
              <span className="text-2xl font-bold w-10 text-center tabular-nums">{numPeople}</span>
              <button
                onClick={() => setNumPeople(numPeople + 1)}
                className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center text-lg font-medium hover:bg-stone-200 active:bg-stone-300 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Time slots */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-[var(--color-brand)] mb-3">Velg tid</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-accent)]" />
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

        {/* Desktop button */}
        <button
          onClick={handleNext}
          disabled={selectedHour === null}
          className="hidden sm:flex w-full bg-[var(--color-accent)] text-white py-4 rounded-2xl font-semibold text-lg hover:bg-[var(--color-accent)]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed items-center justify-center gap-2"
        >
          Gå til betaling
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </Container>

      {/* Sticky mobile bottom bar */}
      {!loading && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 sm:hidden">
          <button
            onClick={handleNext}
            disabled={selectedHour === null}
            className="w-full bg-[var(--color-accent)] text-white py-4 rounded-2xl font-semibold text-base active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Gå til betaling
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
