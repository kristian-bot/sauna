import Link from 'next/link';
import { Header } from '@/components/ui/Header';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-2xl text-center space-y-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--color-brand)]">
            BON DEP Badstu
          </h1>
          <p className="text-lg text-stone-600 max-w-md mx-auto">
            Book din private badstu-opplevelse, eller bli med på en fellestur.
            9 badstuer tilgjengelig.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book"
              className="inline-flex items-center justify-center bg-[var(--color-brand)] text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-[var(--color-brand-light)] transition-colors"
            >
              Book nå
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-2xl mb-2">🧖</div>
              <h3 className="font-semibold mb-1">Privat booking</h3>
              <p className="text-sm text-stone-500">Hele badstuen for deg og dine. 2 000 kr/time.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-2xl mb-2">👥</div>
              <h3 className="font-semibold mb-1">Felles booking</h3>
              <p className="text-sm text-stone-500">Del badstuen med andre. 200 kr/person.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-2xl mb-2">📱</div>
              <h3 className="font-semibold mb-1">Betal med Vipps</h3>
              <p className="text-sm text-stone-500">Enkel og rask betaling. QR-kode som billett.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
