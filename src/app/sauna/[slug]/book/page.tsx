'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { Container } from '@/components/ui/Container';
import { BookingWidget } from '@/components/sauna/BookingWidget';
import type { SaunaWithHost } from '@/lib/types';

export default function SaunaBookPage() {
  const { slug } = useParams<{ slug: string }>();
  const [sauna, setSauna] = useState<SaunaWithHost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/saunas/${slug}`)
      .then(r => r.json())
      .then(data => { setSauna(data.sauna); setLoading(false); })
      .catch(() => setLoading(false));
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

  if (!sauna) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <Container>
          <p className="text-center py-20 text-stone-500">Badstu ikke funnet</p>
        </Container>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Container>
        <div className="max-w-md mx-auto py-4">
          <h1 className="text-xl font-bold text-[var(--color-brand)] mb-6">Book {sauna.name}</h1>
          <BookingWidget sauna={sauna} />
        </div>
      </Container>
    </div>
  );
}
