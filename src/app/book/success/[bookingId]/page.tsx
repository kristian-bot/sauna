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
    // Fetch booking details by looking up the booking ID via the API
    async function load() {
      try {
        // First get the booking to get the qr_token
        const res = await fetch(`/api/payments/status?booking_id=${bookingId}`);
        const data = await res.json();

        // Then look up the full booking
        // We need another endpoint or use the booking_id to look up
        const lookupRes = await fetch(`/api/bookings/by-id?id=${bookingId}`);
        const lookupData = await lookupRes.json();

        if (lookupData.booking) {
          setBooking(lookupData.booking);
          // Generate QR on client side for display
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
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-brand)]" />
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
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-2">Booking ikke funnet</h1>
            <a href="/" className="text-[var(--color-brand)] underline">Gå til forsiden</a>
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
        <div className="max-w-lg mx-auto text-center">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold mb-2">Booking bekreftet!</h1>
          <p className="text-stone-500 mb-8">
            En bekreftelse er sendt til {booking.customer_email}
          </p>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200 mb-8">
            <dl className="space-y-3 text-left">
              <div className="flex justify-between">
                <dt className="text-stone-500">Badstu</dt>
                <dd className="font-medium">{slot.sauna.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Dato</dt>
                <dd className="font-medium capitalize">{formatDateNorwegian(slot.date)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Tid</dt>
                <dd className="font-medium">{formatHourRange(slot.hour)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Type</dt>
                <dd className="font-medium">{booking.booking_type === 'private' ? 'Privat' : 'Felles'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Antall</dt>
                <dd className="font-medium">{booking.num_people} {booking.num_people === 1 ? 'person' : 'personer'}</dd>
              </div>
              <hr className="border-stone-100" />
              <div className="flex justify-between text-lg">
                <dt className="font-semibold">Betalt</dt>
                <dd className="font-bold">{formatPriceNOK(booking.price_nok)}</dd>
              </div>
            </dl>
          </div>

          {qrUrl && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200 mb-8">
              <h2 className="font-semibold mb-4">Vis denne QR-koden ved ankomst</h2>
              {/* QR code rendered via canvas on the booking lookup page */}
              <div className="bg-stone-50 p-4 rounded-lg break-all text-sm text-stone-600">
                <a href={qrUrl} className="text-[var(--color-brand)] underline">{qrUrl}</a>
              </div>
            </div>
          )}

          <a
            href="/"
            className="inline-block bg-[var(--color-brand)] text-white px-8 py-3 rounded-xl font-medium hover:bg-[var(--color-brand-light)] transition-colors"
          >
            Tilbake til forsiden
          </a>
        </div>
      </Container>
    </div>
  );
}
