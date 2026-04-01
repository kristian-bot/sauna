'use client';

import { useEffect, useState, use } from 'react';
import { Header } from '@/components/ui/Header';
import { Container } from '@/components/ui/Container';
import { formatDateNorwegian, formatHourRange } from '@/lib/timezone';
import { formatPriceNOK } from '@/lib/pricing';
import type { BookingWithSlot } from '@/lib/types';

export default function BookingSuccess({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const [booking, setBooking] = useState<BookingWithSlot | null>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const lookupRes = await fetch(`/api/bookings/by-id?id=${bookingId}`);
        const lookupData = await lookupRes.json();

        if (lookupData.booking) {
          setBooking(lookupData.booking);
          const baseUrl = window.location.origin;
          setQrUrl(`${baseUrl}/booking/${lookupData.booking.qr_token}`);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <Container>
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-accent)]" />
          </div>
        </Container>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <Container>
          <div className="text-center py-20">
            <h1 className="text-xl font-bold mb-2">Booking ikke funnet</h1>
            <a href="/" className="text-[var(--color-accent)] font-medium text-sm">Til forsiden</a>
          </div>
        </Container>
      </div>
    );
  }

  const slot = booking.slot;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Container>
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-accent-light)] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-brand)]">Booking bekreftet!</h1>
          <p className="text-stone-400 text-sm mt-1">
            Bekreftelse sendt til {booking.customer_email}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 mb-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-stone-100">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-light)] flex items-center justify-center text-lg">
              🧖
            </div>
            <div className="flex-1">
              <div className="font-semibold">{slot.sauna.name}</div>
              <div className="text-xs text-stone-400 capitalize">{formatDateNorwegian(slot.date)}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div>
              <div className="text-xs text-stone-400 mb-0.5">Tid</div>
              <div className="text-sm font-semibold">{formatHourRange(slot.hour)}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400 mb-0.5">Type</div>
              <div className="text-sm font-semibold">{booking.booking_type === 'private' ? 'Privat' : 'Felles'}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400 mb-0.5">Antall</div>
              <div className="text-sm font-semibold">{booking.num_people} pers.</div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-stone-100">
            <span className="text-stone-500">Betalt</span>
            <span className="font-bold text-lg">{formatPriceNOK(booking.price_nok)}</span>
          </div>
        </div>

        {qrUrl && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 mb-6 text-center">
            <p className="text-sm font-medium text-[var(--color-brand)] mb-3">
              Vis QR-koden ved ankomst
            </p>
            <a
              href={qrUrl}
              className="inline-block bg-[var(--color-accent-light)] text-[var(--color-accent)] font-medium text-sm px-4 py-3 rounded-xl hover:bg-[var(--color-accent)]/20 transition-colors break-all"
            >
              Åpne bookingbevis →
            </a>
          </div>
        )}

        <a
          href="/"
          className="block w-full text-center bg-[var(--color-brand)] text-white py-4 rounded-2xl font-semibold active:scale-[0.98] transition-all"
        >
          Tilbake til forsiden
        </a>
      </Container>
    </div>
  );
}
