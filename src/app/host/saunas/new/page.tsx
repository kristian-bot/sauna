'use client';

import { HostShell } from '@/components/host/HostShell';
import { SaunaForm } from '@/components/host/SaunaForm';

export default function NewSauna() {
  return (
    <HostShell>
      <h1 className="text-2xl font-bold mb-8">Ny badstu</h1>
      <SaunaForm />
    </HostShell>
  );
}
