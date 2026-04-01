import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Container } from '@/components/ui/Container';

export default function BookingCancelled() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Container>
        <div className="text-center py-16 sm:py-24">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Betaling avbrutt</h1>
          <p className="text-stone-400 text-sm mb-8 max-w-xs mx-auto">
            Betalingen ble ikke fullført. Du har ikke blitt belastet.
          </p>
          <Link
            href="/book"
            className="inline-block bg-[var(--color-accent)] text-white px-8 py-4 rounded-2xl font-semibold active:scale-[0.98] transition-all"
          >
            Prøv igjen
          </Link>
        </div>
      </Container>
    </div>
  );
}
