'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { HytteShell } from '@/components/hytte/HytteShell';

interface Member {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  created_at: string;
}

export default function MedlemmerPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    const res = await fetch('/api/hytte/members');
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members || []);
    }
  }, []);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/hytte');
        return;
      }

      const { data: member } = await supabase
        .from('family_members')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!member?.is_admin) {
        router.push('/hytte/kalender');
        return;
      }

      await loadMembers();
      setLoading(false);
    }
    load();
  }, [router, loadMembers]);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    const res = await fetch('/api/hytte/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setFormError(data.error || 'Noe gikk galt');
      setFormLoading(false);
      return;
    }

    setName('');
    setEmail('');
    setPassword('');
    setShowForm(false);
    setFormLoading(false);
    await loadMembers();
  }

  async function handleDelete(memberId: string) {
    if (!confirm('Er du sikker på at du vil fjerne dette medlemmet?')) return;

    setDeleteLoading(memberId);
    const res = await fetch('/api/hytte/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    });

    if (res.ok) {
      await loadMembers();
    }
    setDeleteLoading(null);
  }

  if (loading) {
    return (
      <HytteShell isAdmin>
        <div className="flex items-center justify-center h-64">
          <div className="text-stone-400">Laster...</div>
        </div>
      </HytteShell>
    );
  }

  return (
    <HytteShell isAdmin>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Medlemmer</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {showForm ? 'Avbryt' : 'Legg til'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleAddMember}
            className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm mb-6 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Navn</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">E-post</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Passord</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] outline-none"
              />
            </div>

            {formError && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{formError}</div>
            )}

            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-[var(--color-accent)] text-white px-4 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {formLoading ? 'Oppretter...' : 'Opprett medlem'}
            </button>
          </form>
        )}

        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="font-medium">
                  {member.name}
                  {member.is_admin && (
                    <span className="ml-2 text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent)] px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </p>
                <p className="text-sm text-stone-500">{member.email}</p>
              </div>
              {!member.is_admin && (
                <button
                  onClick={() => handleDelete(member.id)}
                  disabled={deleteLoading === member.id}
                  className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Fjern
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </HytteShell>
  );
}
