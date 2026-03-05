'use client';

import React from 'react';
import Image from 'next/image';

interface SpinnerProps {
  /** Size in pixels */
  size?: number;
  className?: string;
}

/**
 * Spinner — branded loading spinner with purple accent.
 */
export function Spinner({ size = 24, className = '' }: SpinnerProps) {
  return (
    <div
      className={`rounded-full border-2 border-purple-500 border-t-transparent animate-spin ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * FullScreenSpinner — centered loading state with Convexo branding.
 * Use as a standalone page-level loading indicator.
 */
export function FullScreenSpinner({ text }: { text?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Image
        src="/logo_convexo.png"
        alt="Convexo"
        width={48}
        height={48}
        className="object-contain opacity-70"
      />
      <Spinner size={24} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}
