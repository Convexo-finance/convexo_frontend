'use client';

import { useEffect } from 'react';
import Image from 'next/image';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service in production
    console.error('[Convexo] Unhandled error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-8">
      <Image
        src="/logo_convexo.png"
        alt="Convexo"
        width={48}
        height={48}
        className="object-contain opacity-50"
      />

      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
        <p className="text-gray-400 text-sm mb-6">
          An unexpected error occurred. Our team has been notified.
          Please try again or refresh the page.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="btn-primary text-sm"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/profile'}
            className="btn-secondary text-sm"
          >
            Go to Dashboard
          </button>
        </div>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <details className="mt-6 max-w-lg w-full">
          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400">
            Error details (dev only)
          </summary>
          <pre className="mt-2 p-4 bg-gray-900 rounded-xl text-xs text-red-400 overflow-auto max-h-48">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}
    </div>
  );
}
