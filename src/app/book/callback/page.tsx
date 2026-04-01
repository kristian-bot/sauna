'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { Container } from '@/components/ui/Container';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('booking_id');
  const [status, setStatus] = useState<string>('checking');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!bookingId) {
      setStatus('error');
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payments/status?booking_id=${bookingId}`);
        const data = await res.json();

        if (data.status === 'confirmed') {
          router.push(`/book/success/${bookingId}`);
          return;
        }

        if (data.status === 'cancelled' || data.status === 'expired') {
          router.push('/book/cancelled');
          return;
        }

        if (attempts < 30) {
          setTimeout(() => setAttempts((a) => a + 1), 2000);
        } else {
          setStatus('timeout');
        }
      } catch {
        setStatus('error');
      }
    };

    checkStatus();
  }, [bookingId, attempts, router]);

  return (
    <div className="text-center py-16 sm:py-24">
      {status === 'checking' && (
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-accent-light)] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-[var(--color-accent)]/30 border-t-[var(--color-accent)]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">Bekrefter betaling...</h1>
          <p className="text-stone-400 text-sm">Vennligst vent, dette tar bare noen sekunder.</p>
        </div>
      )}

      {status === 'timeout' && (
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-yellow-50 flex items-center justify-center text-3xl">
            ⏳
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">Tar litt tid...</h1>
          <p className="text-stone-400 text-sm max-w-xs mx-auto">
            Du vil motta en e-post når betalingen er bekreftet.
          </p>
          <a href="/" className="inline-block mt-4 text-[var(--color-accent)] font-medium text-sm">
            Tilbake til forsiden
          </a>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">Noe gikk galt</h1>
          <p className="text-stone-400 text-sm max-w-xs mx-auto">
            Kontakt oss hvis du har blitt belastet.
          </p>
          <a href="/" className="inline-block mt-4 text-[var(--color-accent)] font-medium text-sm">
            Tilbake til forsiden
          </a>
        </div>
      )}
    </div>
  );
}

export default function BookCallback() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Container>
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-[var(--color-accent)]" />
          </div>
        }>
          <CallbackContent />
        </Suspense>
      </Container>
    </div>
  );
}
