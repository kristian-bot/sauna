'use client';

import { Sidebar } from './Sidebar';

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-stone-50 p-8">
        {children}
      </main>
    </div>
  );
}
