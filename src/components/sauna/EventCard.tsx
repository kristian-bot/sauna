'use client';

import Link from 'next/link';
import { formatPriceNOK } from '@/lib/pricing';
import { formatDateNorwegian, formatHour } from '@/lib/timezone';
import type { Event } from '@/lib/types';

const EVENT_TYPE_LABELS: Record<string, string> = {
  yoga: 'Yoga',
  breathing: 'Pusteøvelser',
  meditation: 'Meditasjon',
  custom: 'Arrangement',
};

const EVENT_TYPE_EMOJIS: Record<string, string> = {
  yoga: '🧘',
  breathing: '💨',
  meditation: '🧠',
  custom: '✨',
};

interface EventCardProps {
  event: Event;
  saunaSlug: string;
}

export function EventCard({ event, saunaSlug }: EventCardProps) {
  const spotsLeft = event.max_participants - event.current_participants;

  return (
    <Link
      href={`/sauna/${saunaSlug}/event/${event.id}`}
      className="block bg-white rounded-xl p-4 border border-stone-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{EVENT_TYPE_EMOJIS[event.event_type] || '✨'}</span>
          <div>
            <h3 className="font-semibold text-sm">{event.title}</h3>
            <p className="text-xs text-stone-400">
              {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
            </p>
          </div>
        </div>
        <span className="text-sm font-semibold text-[var(--color-accent)]">
          {formatPriceNOK(event.price_per_person_oere)}
        </span>
      </div>

      <p className="text-xs text-stone-500 mb-2">
        {formatDateNorwegian(event.date)} kl {formatHour(event.start_hour)} &middot; {event.duration_hours}t
      </p>

      {event.is_full ? (
        <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Fullt</span>
      ) : (
        <span className="text-xs bg-[var(--color-accent-light)] text-[var(--color-accent)] px-2 py-0.5 rounded-full">
          {spotsLeft} {spotsLeft === 1 ? 'plass' : 'plasser'} igjen
        </span>
      )}
    </Link>
  );
}
