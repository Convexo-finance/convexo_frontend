'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from '@/lib/wagmi/compat';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PortfolioToken {
  address: string;       // wallet address
  network: string;       // e.g. "base-mainnet", "eth-mainnet"
  tokenAddress: string | null; // null = native token
  tokenBalance: string;  // raw balance string
  tokenMetadata: {
    decimals: number;
    logo: string | null;
    name: string;
    symbol: string;
  } | null;
  tokenPrices: Array<{
    currency: string;    // "usd"
    value: string;       // e.g. "3200.50"
    lastUpdatedAt: string;
  }> | null;
  error: string | null;
}

export interface AggregatedToken {
  symbol: string;
  name: string;
  logo: string | null;
  decimals: number;
  /** Total balance across all chains (human-readable) */
  totalBalance: number;
  /** USD value of total balance */
  totalValueUsd: number;
  /** USD price per token */
  priceUsd: number;
  /** Per-chain breakdown */
  chains: Array<{
    network: string;
    networkLabel: string;
    tokenAddress: string | null;
    balance: number;
    valueUsd: number;
  }>;
  /** Whether this is a "known" Convexo-tracked token */
  isKnown: boolean;
}

// ─── Known tokens (pinned at top of portfolio) ────────────────────────────────

const KNOWN_SYMBOLS = new Set(['ETH', 'USDC', 'USDT', 'EURC', 'WBTC', 'cbBTC']);

const NETWORK_LABELS: Record<string, string> = {
  'base-mainnet': 'Base',
  'eth-mainnet': 'Ethereum',
};

// ─── Alchemy API call ─────────────────────────────────────────────────────────

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ?? '';

async function fetchPortfolioBalances(address: string): Promise<PortfolioToken[]> {
  const url = `https://api.g.alchemy.com/data/v1/${ALCHEMY_API_KEY}/assets/tokens/by-address`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      addresses: [
        {
          address,
          networks: ['base-mainnet', 'eth-mainnet'],
        },
      ],
      withMetadata: true,
      withPrices: true,
      includeNativeTokens: true,
      includeErc20Tokens: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`Alchemy Portfolio API error: ${res.status}`);
  }

  const json = await res.json();
  return json.data?.tokens ?? [];
}

// ─── Aggregation logic ────────────────────────────────────────────────────────

function aggregateTokens(tokens: PortfolioToken[]): AggregatedToken[] {
  const map = new Map<string, AggregatedToken>();

  for (const token of tokens) {
    if (token.error) continue;
    if (!token.tokenMetadata) continue;

    const { symbol, name, logo, decimals } = token.tokenMetadata;
    if (!symbol) continue;

    const balance = parseFloat(token.tokenBalance) / Math.pow(10, decimals);
    if (balance <= 0) continue;

    const priceUsd = token.tokenPrices?.[0]
      ? parseFloat(token.tokenPrices[0].value)
      : 0;
    const valueUsd = balance * priceUsd;

    const key = symbol.toUpperCase();
    const existing = map.get(key);

    if (existing) {
      existing.totalBalance += balance;
      existing.totalValueUsd += valueUsd;
      existing.priceUsd = priceUsd || existing.priceUsd;
      existing.logo = existing.logo || logo;
      existing.chains.push({
        network: token.network,
        networkLabel: NETWORK_LABELS[token.network] ?? token.network,
        tokenAddress: token.tokenAddress,
        balance,
        valueUsd,
      });
    } else {
      map.set(key, {
        symbol: key,
        name,
        logo,
        decimals,
        totalBalance: balance,
        totalValueUsd: valueUsd,
        priceUsd,
        chains: [
          {
            network: token.network,
            networkLabel: NETWORK_LABELS[token.network] ?? token.network,
            tokenAddress: token.tokenAddress,
            balance,
            valueUsd,
          },
        ],
        isKnown: KNOWN_SYMBOLS.has(key),
      });
    }
  }

  // Sort: known tokens first (by USD value desc), then other tokens (by USD value desc)
  return Array.from(map.values()).sort((a, b) => {
    if (a.isKnown && !b.isKnown) return -1;
    if (!a.isKnown && b.isKnown) return 1;
    return b.totalValueUsd - a.totalValueUsd;
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePortfolioBalances() {
  const { address, isConnected } = useAccount();

  const {
    data: rawTokens,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolio-balances', address],
    queryFn: () => fetchPortfolioBalances(address!),
    enabled: !!address && isConnected && !!ALCHEMY_API_KEY,
    staleTime: 60_000,     // 60s — matches previous CoinGecko poll
    gcTime: 5 * 60_000,    // 5 min cache
    refetchOnWindowFocus: false,
  });

  const tokens = rawTokens ? aggregateTokens(rawTokens) : [];
  const knownTokens = tokens.filter((t) => t.isKnown);
  const otherTokens = tokens.filter((t) => !t.isKnown);
  const totalPortfolioUsd = tokens.reduce((sum, t) => sum + t.totalValueUsd, 0);

  return {
    /** All tokens, sorted: known first, then by USD value */
    tokens,
    /** Just the tracked tokens (ETH, USDC, USDT, EURC, BTC) */
    knownTokens,
    /** Discovered ERC-20s not in the known list */
    otherTokens,
    /** Total portfolio value in USD */
    totalPortfolioUsd,
    /** Raw Alchemy response tokens (for advanced use) */
    rawTokens: rawTokens ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
}
