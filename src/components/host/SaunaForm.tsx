'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImageUploader } from './ImageUploader';
import { LocationPicker } from './LocationPicker';

interface SaunaFormData {
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  capacity: number;
  max_people: number | null;
  min_people: number;
  private_price_oere: number | null;
  shared_price_per_person_oere: number | null;
  allowed_booking_types: string[];
  image_urls?: string[];
}

interface SaunaFormProps {
  initialData?: Partial<SaunaFormData>;
  saunaId?: number;
}

export function SaunaForm({ initialData, saunaId }: SaunaFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [lat, setLat] = useState<number | null>(initialData?.lat ?? null);
  const [lng, setLng] = useState<number | null>(initialData?.lng ?? null);
  const [capacity, setCapacity] = useState(initialData?.capacity || 10);
  const [maxPeople, setMaxPeople] = useState(initialData?.max_people || 10);
  const [minPeople, setMinPeople] = useState(initialData?.min_people || 1);
  const [privatePriceNok, setPrivatePriceNok] = useState(
    initialData?.private_price_oere ? initialData.private_price_oere / 100 : 2000
  );
  const [sharedPriceNok, setSharedPriceNok] = useState(
    initialData?.shared_price_per_person_oere ? initialData.shared_price_per_person_oere / 100 : 200
  );
  const [allowPrivate, setAllowPrivate] = useState(
    initialData?.allowed_booking_types?.includes('private') ?? true
  );
  const [allowShared, setAllowShared] = useState(
    initialData?.allowed_booking_types?.includes('shared') ?? true
  );
  const [imageUrls, setImageUrls] = useState<string[]>(initialData?.image_urls || []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const allowedTypes: string[] = [];
    if (allowPrivate) allowedTypes.push('private');
    if (allowShared) allowedTypes.push('shared');

    if (allowedTypes.length === 0) {
      setError('Velg minst én bookingtype');
      setSubmitting(false);
      return;
    }

    if (!lat || !lng) {
      setError('Velg plassering på kartet');
      setSubmitting(false);
      return;
    }

    const payload = {
      name,
      description,
      address,
      city,
      lat,
      lng,
      capacity,
      max_people: maxPeople,
      min_people: minPeople,
      private_price_oere: allowPrivate ? Math.round(privatePriceNok * 100) : null,
      shared_price_per_person_oere: allowShared ? Math.round(sharedPriceNok * 100) : null,
      allowed_booking_types: allowedTypes,
      image_urls: imageUrls,
    };

    try {
      const url = saunaId ? `/api/host/saunas/${saunaId}` : '/api/host/saunas';
      const method = saunaId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Noe gikk galt');
      }

      router.push('/host/saunas');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt');
      setSubmitting(false);
    }
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-stone-300 bg-white focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 outline-none transition-all';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1.5">Navn på badstu</label>
        <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="F.eks. Sjøbad Sauna" />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1.5">Beskrivelse</label>
        <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClass} placeholder="Beskriv badstuen din..." />
      </div>

      <ImageUploader existingUrls={imageUrls} onImagesChange={setImageUrls} />

      <LocationPicker
        address={address}
        city={city}
        lat={lat}
        lng={lng}
        onAddressChange={setAddress}
        onCityChange={setCity}
        onCoordsChange={(newLat, newLng) => { setLat(newLat); setLng(newLng); }}
      />

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">Kapasitet</label>
          <input type="number" required min={1} max={50} value={capacity} onChange={e => setCapacity(parseInt(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">Maks personer</label>
          <input type="number" required min={1} max={50} value={maxPeople} onChange={e => setMaxPeople(parseInt(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">Min personer</label>
          <input type="number" required min={1} max={50} value={minPeople} onChange={e => setMinPeople(parseInt(e.target.value))} className={inputClass} />
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-stone-600">Bookingtyper</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={allowPrivate} onChange={e => setAllowPrivate(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm">Privat booking</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={allowShared} onChange={e => setAllowShared(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm">Felles booking</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {allowPrivate && (
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">Pris privat (NOK/time)</label>
            <input type="number" min={0} value={privatePriceNok} onChange={e => setPrivatePriceNok(parseInt(e.target.value))} className={inputClass} />
          </div>
        )}
        {allowShared && (
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">Pris felles (NOK/person)</label>
            <input type="number" min={0} value={sharedPriceNok} onChange={e => setSharedPriceNok(parseInt(e.target.value))} className={inputClass} />
          </div>
        )}
      </div>

      <p className="text-xs text-stone-400">Plattformen tar 15% provisjon av alle bookinger.</p>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[var(--color-accent)] text-white py-3.5 rounded-xl font-semibold hover:bg-[var(--color-accent)]/90 transition-all disabled:opacity-50"
      >
        {submitting ? 'Lagrer...' : (saunaId ? 'Oppdater badstu' : 'Opprett badstu')}
      </button>
    </form>
  );
}
