import Link from 'next/link';
import { Header } from '@/components/ui/Header';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20 bg-gradient-to-b from-[var(--color-warm)] to-stone-50">
        <div className="max-w-lg text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-[var(--color-accent-light)] text-[var(--color-accent)] px-4 py-1.5 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-pulse" />
            9 badstuer tilgjengelig
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--color-brand)] leading-[1.1]">
            Din neste<br />badstu-opplevelse
          </h1>
          <p className="text-base sm:text-lg text-stone-500 max-w-sm mx-auto leading-relaxed">
            Book privat eller felles badstu. Enkel betaling med Vipps.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center justify-center bg-[var(--color-accent)] text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-[var(--color-accent)]/90 active:scale-[0.98] transition-all shadow-lg shadow-[var(--color-accent)]/20"
          >
            Book nå
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            { icon: '🔒', title: 'Privat', desc: 'Hele badstuen for deg og dine.', detail: '2 000 kr/time' },
            { icon: '👥', title: 'Felles', desc: 'Del badstuen med andre.', detail: '200 kr/person' },
            { icon: '⚡', title: 'Vipps', desc: 'Betal raskt, få QR-billett.', detail: 'Enkel innsjekk' },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
              <div className="text-2xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-[var(--color-brand)] mb-1">{item.title}</h3>
              <p className="text-sm text-stone-500 mb-2">{item.desc}</p>
              <span className="text-xs font-medium text-[var(--color-accent)] bg-[var(--color-accent-light)] px-2.5 py-1 rounded-full">
                {item.detail}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
