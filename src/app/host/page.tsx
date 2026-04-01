'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { Container } from '@/components/ui/Container';
import { createClient } from '@/lib/supabase/client';

export default function HostLogin() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Feil e-post eller passord');
      setLoading(false);
      return;
    }

    router.push('/host/dashboard');
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/host/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, bio: bio || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registrering feilet');
      }

      // Log in after registration
      const supabase = createClient();
      await supabase.auth.signInWithPassword({ email, password });
      router.push('/host/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt');
      setLoading(false);
    }
  }

  const inputClass = 'w-full px-4 py-3.5 rounded-xl border border-stone-300 bg-white focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 outline-none transition-all';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Container>
        <div className="max-w-sm mx-auto py-8">
          <h1 className="text-2xl font-bold text-[var(--color-brand)] mb-2 text-center">
            {isRegistering ? 'Bli badstumester' : 'Logg inn som host'}
          </h1>
          <p className="text-sm text-stone-500 text-center mb-8">
            {isRegistering
              ? 'Registrer deg og del badstuen din med verden.'
              : 'Administrer dine badstuer og bookinger.'
            }
          </p>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering && (
              <>
                <input type="text" required placeholder="Ditt navn" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
                <input type="tel" required placeholder="Telefon" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
              </>
            )}
            <input type="email" required placeholder="E-post" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} autoComplete="email" />
            <input type="password" required placeholder="Passord" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} autoComplete={isRegistering ? 'new-password' : 'current-password'} />
            {isRegistering && (
              <textarea placeholder="Kort bio (valgfritt)" value={bio} onChange={e => setBio(e.target.value)} rows={2} className={inputClass} />
            )}

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-100">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-accent)] text-white py-4 rounded-2xl font-semibold text-lg hover:bg-[var(--color-accent)]/90 transition-all disabled:opacity-50"
            >
              {loading ? 'Venter...' : (isRegistering ? 'Registrer meg' : 'Logg inn')}
            </button>
          </form>

          <button
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="w-full text-center text-sm text-[var(--color-accent)] mt-4 hover:underline"
          >
            {isRegistering ? 'Har du allerede konto? Logg inn' : 'Ny host? Registrer deg'}
          </button>
        </div>
      </Container>
    </div>
  );
}
