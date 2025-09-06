'use client';

import React, { useState, useMemo } from 'react';
import { FieldErrors, UseFormRegister, Path, FieldValues, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Label } from '@/components/ui/label';

const MAX_BYTES = 10 * 1024 * 1024;

const CV_ALLOWED = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const DESIGN_ALLOWED = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
]);

function readableSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

type Props<TForm extends FieldValues> = {
  // names in the form
  cvFileName: Path<TForm>;
  designFileName: Path<TForm>;
  designLinkName: Path<TForm>;
  register: UseFormRegister<TForm>;
  setValue: UseFormSetValue<TForm>;
  watch: UseFormWatch<TForm>;
  errors: FieldErrors<TForm>;
};

export default function FileOrLinkInput<TForm extends FieldValues>({
  cvFileName,
  designFileName,
  designLinkName,
  register,
  setValue,
  watch,
  errors,
}: Props<TForm>) {
  const designLink = watch(designLinkName) as unknown as string | undefined;
  const [cvLocalError, setCvLocalError] = useState<string | null>(null);
  const [designLocalError, setDesignLocalError] = useState<string | null>(null);
  const [cvSelected, setCvSelected] = useState<File | null>(null);
  const [designSelected, setDesignSelected] = useState<File | null>(null);

  const designWarning = useMemo(() => {
    if (designSelected && designLink) {
      return 'Both a design file and a link were provided; the file will be prioritized.';
    }
    return null;
  }, [designSelected, designLink]);

  function validateSizeAndType(file: File, allowed: Set<string>): string | null {
    if (file.size > MAX_BYTES) {
      return `File too large (${readableSize(file.size)}). Max is 10 MB.`;
    }
    if (!allowed.has(file.type)) {
      return 'Invalid file type.';
    }
    return null;
  }

  const onCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCvLocalError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setCvSelected(null);
      setValue(cvFileName, undefined as unknown as TForm[keyof TForm], { shouldValidate: true });
      return;
    }
    const err = validateSizeAndType(file, CV_ALLOWED);
    if (err) {
      setCvLocalError(err);
      setCvSelected(null);
      setValue(cvFileName, undefined as unknown as TForm[keyof TForm], { shouldValidate: true });
      return;
    }
    setCvSelected(file);
    setValue(cvFileName, file as unknown as TForm[keyof TForm], { shouldValidate: true });
  };

  const onDesignChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDesignLocalError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setDesignSelected(null);
      setValue(designFileName, undefined as unknown as TForm[keyof TForm], { shouldValidate: true });
      return;
    }
    const err = validateSizeAndType(file, DESIGN_ALLOWED);
    if (err) {
      setDesignLocalError(err);
      setDesignSelected(null);
      setValue(designFileName, undefined as unknown as TForm[keyof TForm], { shouldValidate: true });
      return;
    }
    setDesignSelected(file);
    setValue(designFileName, file as unknown as TForm[keyof TForm], { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor={String(cvFileName)}>CV (optional, PDF/DOC/DOCX, up to 10 MB)</Label>
        <input
          id={String(cvFileName)}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="mt-1 block w-full text-sm file:mr-4 file:rounded-md file:border file:border-gray-300 file:bg-gray-50 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-100"
          aria-describedby={cvLocalError ? `${String(cvFileName)}-error` : undefined}
          onChange={onCvChange}
        />
        {(cvLocalError || (errors as any)[cvFileName]) && (
          <p id={`${String(cvFileName)}-error`} className="mt-1 text-sm text-red-600" aria-live="polite">
            {cvLocalError || String((errors as any)[cvFileName]?.message || '')}
          </p>
        )}
        {cvSelected && (
          <p className="mt-1 text-xs text-gray-600">Selected: {cvSelected.name} ({readableSize(cvSelected.size)})</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={String(designFileName)}>Design work (optional)</Label>
        <input
          id={String(designFileName)}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          className="mt-1 block w-full text-sm file:mr-4 file:rounded-md file:border file:border-gray-300 file:bg-gray-50 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-100"
          aria-describedby={(designLocalError || designWarning) ? `${String(designFileName)}-error` : undefined}
          onChange={onDesignChange}
        />

        <div>
          <Label htmlFor={String(designLinkName)}>Or a link to your design or portfolio(https URL)</Label>
          <input
            id={String(designLinkName)}
            type="url"
            placeholder="https://..."
            className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-describedby={(errors as any)[designLinkName] ? `${String(designLinkName)}-error` : undefined}
            {...register(designLinkName)}
          />
          {(errors as any)[designLinkName] && (
            <p id={`${String(designLinkName)}-error`} className="mt-1 text-sm text-red-600" aria-live="polite">
              {String((errors as any)[designLinkName]?.message || 'Must be a valid https URL')}
            </p>
          )}
        </div>

        {(designLocalError || designWarning) && (
          <p id={`${String(designFileName)}-error`} className="mt-1 text-sm text-yellow-700">
            {designLocalError || designWarning}
          </p>
        )}
        {designSelected && (
          <p className="mt-1 text-xs text-gray-600">Selected: {designSelected.name} ({readableSize(designSelected.size)})</p>
        )}
      </div>
    </div>
  );
}