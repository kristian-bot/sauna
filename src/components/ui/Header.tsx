import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-[var(--color-brand)] text-white">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          BON DEP Badstu
        </Link>
        <Link
          href="/book"
          className="bg-white text-[var(--color-brand)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-100 transition-colors"
        >
          Book nå
        </Link>
      </div>
    </header>
  );
}
