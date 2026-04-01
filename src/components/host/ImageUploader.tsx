'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface ImageUploaderProps {
  existingUrls?: string[];
  onImagesChange: (urls: string[]) => void;
}

const MAX_IMAGES = 10;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function ImageUploader({ existingUrls = [], onImagesChange }: ImageUploaderProps) {
  const [urls, setUrls] = useState<string[]>(existingUrls);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    if (urls.length + fileArray.length > MAX_IMAGES) {
      setError(`Maks ${MAX_IMAGES} bilder totalt`);
      return;
    }

    const invalidSize = fileArray.find(f => f.size > MAX_SIZE_BYTES);
    if (invalidSize) {
      setError(`"${invalidSize.name}" er over 10MB`);
      return;
    }

    const invalidType = fileArray.find(f => !['image/jpeg', 'image/png', 'image/webp'].includes(f.type));
    if (invalidType) {
      setError('Kun JPEG, PNG og WebP er tillatt');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const supabase = createClient();
      const newUrls: string[] = [];

      for (const file of fileArray) {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('sauna-images')
          .upload(path, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('sauna-images')
          .getPublicUrl(path);

        newUrls.push(publicUrl);
      }

      const updated = [...urls, ...newUrls];
      setUrls(updated);
      onImagesChange(updated);
    } catch {
      setError('Feil ved opplasting. Prøv igjen.');
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    const updated = urls.filter((_, i) => i !== index);
    setUrls(updated);
    onImagesChange(updated);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-stone-600">Bilder (maks {MAX_IMAGES})</label>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
            : 'border-stone-300 hover:border-stone-400'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-stone-500">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-stone-300 border-t-[var(--color-accent)]" />
            Laster opp...
          </div>
        ) : (
          <div className="text-stone-500">
            <svg className="w-8 h-8 mx-auto mb-2 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <p className="text-sm">Dra og slipp bilder hit, eller klikk for å velge</p>
            <p className="text-xs text-stone-400 mt-1">JPEG, PNG, WebP &middot; Maks 10MB per bilde</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Thumbnails */}
      {urls.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {urls.map((url, i) => (
            <div key={url + i} className="relative group aspect-square rounded-lg overflow-hidden bg-stone-100">
              <Image
                src={url}
                alt={`Bilde ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 33vw, 20vw"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Fjern bilde"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
