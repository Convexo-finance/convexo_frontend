interface PriceChangeProps {
  pct: number | null;
}

export function PriceChange({ pct }: PriceChangeProps) {
  if (pct === null) return null;
  const up = pct >= 0;
  return (
    <span className={`text-xs font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(2)}%
    </span>
  );
}
