'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  /** Number of lines to render (each with animate-pulse) */
  lines?: number;
  /** Whether to render as a circle (for avatars) */
  circle?: boolean;
}

/**
 * Skeleton — branded loading placeholder.
 * Uses the Convexo dark theme with subtle purple pulse.
 */
export function Skeleton({ className = '', lines = 1, circle = false }: SkeletonProps) {
  if (circle) {
    return (
      <div
        className={`rounded-full bg-gray-800 animate-pulse ${className}`}
        aria-hidden="true"
      />
    );
  }

  if (lines > 1) {
    return (
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`h-4 bg-gray-800 rounded-lg animate-pulse ${
              i === lines - 1 ? 'w-3/4' : 'w-full'
            } ${className}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-800 rounded-lg animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * SkeletonCard — full card-sized skeleton for dashboard grids.
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card space-y-4 ${className}`} aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton circle className="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-8 w-2/5" />
      <Skeleton lines={2} />
    </div>
  );
}

/**
 * SkeletonTable — table-shaped skeleton for lists.
 */
export function SkeletonTable({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`card space-y-3 ${className}`} aria-hidden="true">
      <Skeleton className="h-5 w-1/4 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-800/50 last:border-0">
          <Skeleton circle className="w-8 h-8" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
