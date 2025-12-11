'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  label?: string;
};

export default function SubmitBar({ disabled, loading, onClick, label = 'Submit Application' }: Props) {
  // Compute disabled state from loading or parent-disabled (form validity/uploading)
  const isDisabled = !!loading || !!disabled;

  return (
    <div className="sticky bottom-0 left-0 right-0 z-10 mt-6 bg-white/90 backdrop-blur shadow-[0_-4px_20px_rgb(0,0,0,0.08)] supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-end">
        <Button
          type="button"
          variant="default"
          className="min-w-[180px]"
          disabled={isDisabled}
          aria-disabled={isDisabled}
          onClick={() => {
            if (!isDisabled) onClick();
          }}
        >
          {loading ? 'Submitting...' : label}
        </Button>
      </div>
    </div>
  );
}