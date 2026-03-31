import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Container } from '@/components/ui/Container';

export default function BookingCancelled() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Container>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="text-5xl mb-4">✕</div>
          <h1 className="text-2xl font-bold mb-2">Betaling avbrutt</h1>
          <p className="text-stone-500 mb-8">
            Betalingen ble avbrutt eller mislyktes. Du har ikke blitt belastet.
          </p>
          <Link
            href="/book"
            className="inline-block bg-[var(--color-brand)] text-white px-8 py-3 rounded-xl font-medium hover:bg-[var(--color-brand-light)] transition-colors"
          >
            Prøv igjen
          </Link>
        </div>
      </Container>
    </div>
  );
}
