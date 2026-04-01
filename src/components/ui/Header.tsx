import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-[var(--color-brand)] text-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="text-lg sm:text-xl font-bold tracking-tight">
          Chill Sauna
        </Link>
        <Link
          href="/book"
          className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-accent)]/90 active:scale-95 transition-all"
        >
          Book nå
        </Link>
      </div>
    </header>
  );
}
