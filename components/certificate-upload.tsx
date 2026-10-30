'use client';

import { useEffect, useState } from 'react';
import { FileBadge, ShieldCheck, X } from 'lucide-react';
import type { CertificateRequirement } from '@/lib/shop-certificate';

/**
 * The required licence / certificate photo for Food, Clinic & Doctors and Sports & Fitness
 * sellers (see lib/shop-certificate.ts) — in Post Your Ad and when a clinic adds a doctor.
 */
export function CertificateUpload({
  requirement,
  file,
  onFileChange,
  number,
  onNumberChange,
  inputClassName,
}: {
  requirement: CertificateRequirement;
  file: File | null;
  onFileChange: (file: File | null) => void;
  number: string;
  onNumberChange: (value: string) => void;
  inputClassName: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="rounded-xl border border-brand/30 bg-brand-soft/30 p-4">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-ink">
          <ShieldCheck size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">
            {requirement.title} <span className="text-accent">*</span>
          </p>
          <p className="text-xs leading-snug text-ink-muted">{requirement.hint}</p>
        </div>
      </div>

      {previewUrl ? (
        <div className="flex items-center gap-3">
          <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-border bg-bg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={requirement.title} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onFileChange(null)}
              aria-label="Remove certificate photo"
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X size={12} />
            </button>
          </div>
          <p className="min-w-0 text-xs text-ink-muted">
            <span className="block truncate font-medium text-ink">{file?.name}</span>
            Remove it to pick a different photo.
          </p>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-bg px-4 py-3.5 transition-colors hover:border-brand hover:bg-brand-soft/30">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <FileBadge size={20} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">Upload certificate photo</span>
            <span className="block text-xs text-ink-muted">A clear photo or scan (JPG / PNG) where the text can be read</span>
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const picked = e.target.files?.[0];
              if (picked && picked.type.startsWith('image/')) onFileChange(picked);
              e.target.value = '';
            }}
            className="sr-only"
          />
        </label>
      )}

      <div className="mt-3">
        <label className="mb-1.5 block text-xs font-semibold text-ink">
          {requirement.numberLabel} <span className="font-normal text-ink-muted">(optional)</span>
        </label>
        <input
          value={number}
          onChange={(e) => onNumberChange(e.target.value.slice(0, 40))}
          placeholder={requirement.numberPlaceholder}
          className={inputClassName}
        />
      </div>
    </div>
  );
}
