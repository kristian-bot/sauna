'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { HostShell } from '@/components/host/HostShell';
import { EventForm } from '@/components/host/EventForm';
import { formatPriceNOK } from '@/lib/pricing';
import { formatDateNorwegian, formatHour } from '@/lib/timezone';
import type { Event } from '@/lib/types';

export default function EventsPage() {
  const { id } = useParams<{ id: string }>();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  function loadEvents() {
    fetch(`/api/host/saunas/${id}/events`)
      .then(r => r.json())
      .then(data => { setEvents(data.events || []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { loadEvents(); }, [id]);

  const eventTypeLabels: Record<string, string> = {
    yoga: 'Yoga',
    breathing: 'Pusteøvelser',
    meditation: 'Meditasjon',
    custom: 'Annet',
  };

  return (
    <HostShell>
      <h1 className="text-2xl font-bold mb-8">Events</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Kommende events</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-brand)]" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-stone-400 text-sm">Ingen events ennå.</p>
          ) : (
            <div className="space-y-3">
              {events.map(event => (
                <div key={event.id} className="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{event.title}</h3>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {formatDateNorwegian(event.date)} kl {formatHour(event.start_hour)} &middot; {eventTypeLabels[event.event_type] || event.event_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">{formatPriceNOK(event.price_per_person_oere)}/pers</span>
                      <p className="text-xs text-stone-400">{event.current_participants}/{event.max_participants} deltakere</p>
                    </div>
                  </div>
                  {event.is_full && (
                    <span className="inline-block mt-2 text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Fullt</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <EventForm saunaId={parseInt(id)} />
        </div>
      </div>
    </HostShell>
  );
}
