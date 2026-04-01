'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { HytteShell } from '@/components/hytte/HytteShell';
import { BookingForm } from '@/components/hytte/BookingForm';

export default function BookPage() {
  const router = useRouter();
  const [cabins, setCabins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/hytte');
        return;
      }

      const [cabinsRes, memberRes] = await Promise.all([
        fetch('/api/hytte/cabins'),
        supabase.from('family_members').select('is_admin').eq('id', user.id).single(),
      ]);

      if (!cabinsRes.ok) {
        router.push('/hytte');
        return;
      }

      const data = await cabinsRes.json();
      setCabins(data.cabins || []);
      setIsAdmin(memberRes.data?.is_admin || false);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <HytteShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-stone-400">Laster...</div>
        </div>
      </HytteShell>
    );
  }

  return (
    <HytteShell isAdmin={isAdmin}>
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Ny booking</h1>
        <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
          <BookingForm cabins={cabins} />
        </div>
      </div>
    </HytteShell>
  );
}
