'use client';

import { useState } from 'react';

// ─── Fallback gradient colors ─────────────────────────────────────────────────

const FALLBACK_GRADIENT: Record<string, string> = {
  ETH: 'from-indigo-500 to-purple-600',
  USDC: 'from-blue-400 to-cyan-500',
  USDT: 'from-emerald-400 to-teal-600',
  EURC: 'from-blue-600 to-blue-400',
  BTC: 'from-orange-400 to-yellow-500',
  WBTC: 'from-orange-400 to-yellow-500',
};

interface TokenLogoProps {
  image?: string | null;
  symbol: string;
  size?: number;
}

export function TokenLogo({ image, symbol, size = 40 }: TokenLogoProps) {
  const [err, setErr] = useState(false);
  if (image && !err) {
    return (
      <img
        src={image}
        alt={symbol}
        width={size}
        height={size}
        className="rounded-full"
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full bg-gradient-to-br ${FALLBACK_GRADIENT[symbol] ?? 'from-gray-500 to-gray-700'} flex items-center justify-center text-white font-bold text-sm shrink-0`}
    >
      {symbol[0]}
    </div>
  );
}
