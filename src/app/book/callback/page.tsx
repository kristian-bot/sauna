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

        // Still pending — retry
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
    <div className="text-center py-16">
      {status === 'checking' && (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-stone-300 border-t-[var(--color-brand)] mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Sjekker betaling...</h1>
          <p className="text-stone-500">Vennligst vent mens vi bekrefter betalingen din.</p>
        </>
      )}

      {status === 'timeout' && (
        <>
          <h1 className="text-2xl font-bold mb-2">Tar litt tid...</h1>
          <p className="text-stone-500 mb-4">
            Betalingen tar lenger enn forventet. Du vil motta en e-postbekreftelse når betalingen er gjennomført.
          </p>
          <a href="/" className="text-[var(--color-brand)] underline">
            Gå til forsiden
          </a>
        </>
      )}

      {status === 'error' && (
        <>
          <h1 className="text-2xl font-bold mb-2">Noe gikk galt</h1>
          <p className="text-stone-500 mb-4">
            Kunne ikke sjekke betalingsstatus. Kontakt oss hvis du har blitt belastet.
          </p>
          <a href="/" className="text-[var(--color-brand)] underline">
            Gå til forsiden
          </a>
        </>
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
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-stone-300 border-t-[var(--color-brand)]" />
          </div>
        }>
          <CallbackContent />
        </Suspense>
      </Container>
    </div>
  );
}
