'use client';

import { useEffect, useState } from 'react';
import { HostShell } from '@/components/host/HostShell';
import { StarRating } from '@/components/ui/StarRating';

interface HostReview {
  id: string;
  sauna_id: number;
  sauna_name: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  host_reply: string | null;
  host_reply_at: string | null;
}

export default function HostReviews() {
  const [reviews, setReviews] = useState<HostReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/host/reviews')
      .then(r => r.json())
      .then(data => { setReviews(data.reviews || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleReply(reviewId: string) {
    if (!replyText.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/host/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText }),
      });

      if (!res.ok) throw new Error();

      setReviews(prev => prev.map(r =>
        r.id === reviewId
          ? { ...r, host_reply: replyText.trim(), host_reply_at: new Date().toISOString() }
          : r
      ));
      setReplyingTo(null);
      setReplyText('');
    } catch {
      alert('Kunne ikke lagre svar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <HostShell>
      <h1 className="text-2xl font-bold mb-8">Anmeldelser</h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-brand)]" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-stone-500">
          <p className="text-lg mb-2">Ingen anmeldelser ennå</p>
          <p className="text-sm">Anmeldelser vil vises her når gjester har gitt tilbakemelding.</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-xl p-5 shadow-sm border border-stone-200">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center text-sm font-bold text-[var(--color-accent)]">
                      {review.customer_name[0]}
                    </div>
                    <span className="font-medium text-sm">{review.customer_name}</span>
                  </div>
                  <p className="text-xs text-stone-400">{review.sauna_name}</p>
                </div>
                <div className="text-right">
                  <StarRating rating={review.rating} size="sm" />
                  <p className="text-xs text-stone-400 mt-1">
                    {new Date(review.created_at).toLocaleDateString('nb-NO')}
                  </p>
                </div>
              </div>

              {review.comment && (
                <p className="text-sm text-stone-600 mt-3">{review.comment}</p>
              )}

              {/* Host reply */}
              {review.host_reply ? (
                <div className="mt-4 bg-stone-50 rounded-lg p-3 border-l-2 border-[var(--color-accent)]">
                  <p className="text-xs font-medium text-stone-500 mb-1">Ditt svar</p>
                  <p className="text-sm text-stone-600">{review.host_reply}</p>
                  {review.host_reply_at && (
                    <p className="text-xs text-stone-400 mt-1">
                      {new Date(review.host_reply_at).toLocaleDateString('nb-NO')}
                    </p>
                  )}
                </div>
              ) : replyingTo === review.id ? (
                <div className="mt-4 space-y-2">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Skriv ditt svar..."
                    rows={3}
                    maxLength={1000}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReply(review.id)}
                      disabled={submitting || !replyText.trim()}
                      className="px-4 py-1.5 text-sm bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent)]/90 disabled:opacity-50 transition-all"
                    >
                      {submitting ? 'Sender...' : 'Send svar'}
                    </button>
                    <button
                      onClick={() => { setReplyingTo(null); setReplyText(''); }}
                      className="px-4 py-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setReplyingTo(review.id)}
                  className="mt-3 text-sm text-[var(--color-accent)] hover:underline"
                >
                  Svar på anmeldelse
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </HostShell>
  );
}
