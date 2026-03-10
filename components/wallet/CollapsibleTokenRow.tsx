'use client';

import { formatUnits } from 'viem';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { TokenLogo } from './TokenLogo';
import { PriceChange } from './PriceChange';
import type { TokenSymbol, CoinGeckoMarketData } from '@/lib/config/tokens';
import { TOKEN_METADATA } from '@/lib/config/tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChainBalanceEntry {
  chainId: number;
  label: string;
  logo: string;
  balance: bigint | undefined;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBalance(balance: bigint | undefined, decimals: number, maxFrac = 6) {
  if (!balance) return '0';
  return parseFloat(formatUnits(balance, decimals)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxFrac,
  });
}

function toUsd(balance: bigint | undefined, decimals: number, price: number): string | null {
  if (!balance || !price) return null;
  const val = parseFloat(formatUnits(balance, decimals)) * price;
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CollapsibleTokenRowProps {
  symbol: TokenSymbol;
  chainBalances: ChainBalanceEntry[];
  isLoading: boolean;
  marketData: Map<string, CoinGeckoMarketData>;
  isExpanded: boolean;
  onToggle: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CollapsibleTokenRow({
  symbol,
  chainBalances,
  isLoading,
  marketData,
  isExpanded,
  onToggle,
}: CollapsibleTokenRowProps) {
  const meta = TOKEN_METADATA[symbol];
  const coin = marketData.get(meta.coingeckoId);
  const price = coin?.current_price ?? 0;
  const decimals = meta.decimals;

  const totalBig = chainBalances.reduce<bigint>((acc, c) => acc + (c.balance ?? 0n), 0n);
  const totalFmt = fmtBalance(totalBig, decimals);
  const totalUsd = toUsd(totalBig, decimals, price);

  return (
    <div className="rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.07] transition-all">
      {/* Main row */}
      <button
        className="w-full flex items-center justify-between py-3.5 px-4 hover:bg-white/[0.04] transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <TokenLogo image={coin?.image} symbol={symbol} size={40} />
          <div className="text-left">
            <p className="text-sm font-semibold text-white leading-snug">{meta.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-gray-400">{symbol}</span>
              {coin && <PriceChange pct={coin.price_change_percentage_24h} />}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-right">
            {isLoading ? (
              <div className="space-y-1.5 items-end flex flex-col">
                <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-white">
                  {totalFmt}{' '}
                  <span className="text-gray-400 font-normal text-xs">{symbol}</span>
                </p>
                {totalUsd && <p className="text-xs text-gray-400 mt-0.5">${totalUsd}</p>}
              </>
            )}
          </div>
          <ChevronDownIcon
            className={`w-4 h-4 text-gray-500 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expanded per-chain breakdown */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/[0.06] space-y-2">
          {chainBalances.map(({ chainId, label, logo, balance }) => (
            <div key={chainId} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <img
                  src={logo}
                  alt={label}
                  className="w-4 h-4 rounded-full object-contain shrink-0"
                  onError={(e) => {
                    const t = e.currentTarget;
                    t.style.display = 'none';
                    const sibling = t.nextElementSibling as HTMLElement | null;
                    if (sibling) sibling.style.display = 'flex';
                  }}
                />
                <span
                  className="w-4 h-4 rounded-full bg-gray-700 items-center justify-center text-[8px] font-bold text-gray-300 shrink-0"
                  style={{ display: 'none' }}
                >
                  {label[0]}
                </span>
                <span className="text-gray-400">{label}</span>
              </div>
              <div className="text-right">
                <span className="text-white">
                  {fmtBalance(balance, decimals)} {symbol}
                </span>
                {toUsd(balance, decimals, price) && (
                  <span className="text-gray-500 ml-2 text-xs">
                    ${toUsd(balance, decimals, price)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
