'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { Container } from '@/components/ui/Container';
import { SaunaDetail } from '@/components/sauna/SaunaDetail';
import { BookingWidget } from '@/components/sauna/BookingWidget';
import type { SaunaWithHost, Event } from '@/lib/types';

export default function SaunaPage() {
  const { slug } = useParams<{ slug: string }>();
  const [sauna, setSauna] = useState<SaunaWithHost | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/saunas/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error('Ikke funnet');
        return r.json();
      })
      .then(data => {
        setSauna(data.sauna);
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Badstu ikke funnet');
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-accent)]" />
        </div>
      </div>
    );
  }

  if (error || !sauna) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <Container>
          <div className="text-center py-20">
            <p className="text-lg text-stone-500">{error || 'Badstu ikke funnet'}</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-4">
          <div className="lg:col-span-2">
            <SaunaDetail sauna={sauna} events={events} />
          </div>
          <div className="lg:sticky lg:top-20 lg:self-start">
            <BookingWidget sauna={sauna} />
          </div>
        </div>
      </Container>
    </div>
  );
}
