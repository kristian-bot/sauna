'use client';

import { useState, useEffect, use } from 'react';
import { Header } from '@/components/ui/Header';
import { StarRating } from '@/components/ui/StarRating';

interface BookingInfo {
  id: string;
  customer_name: string;
  sauna_name: string;
}

export default function ReviewPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/bookings/by-id?id=${bookingId}`);
        if (!res.ok) {
          setError('Kunne ikke finne bookingen.');
          return;
        }
        const data = await res.json();
        setBooking({
          id: data.booking.id,
          customer_name: data.booking.customer_name,
          sauna_name: data.booking.slot?.sauna?.name || 'Badstu',
        });
      } catch {
        setError('Noe gikk galt.');
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [bookingId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError('Velg en rating fra 1 til 5.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Noe gikk galt.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Kunne ikke sende vurderingen.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-warm)]">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-accent)]" />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--color-warm)]">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-[var(--color-brand)] mb-2">
              Takk for din vurdering!
            </h1>
            <p className="text-stone-500">
              Din tilbakemelding hjelper andre med å finne gode badstuer.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-warm)]">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h1 className="text-xl font-bold text-[var(--color-brand)] mb-1">
            Hvordan var opplevelsen?
          </h1>
          {booking && (
            <p className="text-stone-500 mb-6">{booking.sauna_name}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-3">
                Din vurdering
              </label>
              <StarRating rating={rating} size="lg" onRate={setRating} />
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-stone-700 mb-2">
                Kommentar (valgfritt)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent resize-none"
                placeholder="Fortell om din opplevelse..."
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="w-full bg-[var(--color-accent)] text-white py-3 rounded-xl font-semibold hover:bg-[var(--color-accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? 'Sender...' : 'Send vurdering'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
