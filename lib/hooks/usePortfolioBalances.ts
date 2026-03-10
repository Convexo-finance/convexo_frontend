'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from '@/lib/wagmi/compat';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PortfolioToken {
  address: string;
  network: string;
  tokenAddress: string | null;
  tokenBalance: string;
  tokenMetadata: {
    decimals: number;
    logo: string | null;
    name: string;
    symbol: string;
  } | null;
  tokenPrices: Array<{
    currency: string;
    value: string;
    lastUpdatedAt: string;
  }> | null;
  error: string | null;
}

export interface AggregatedToken {
  symbol: string;
  name: string;
  logo: string | null;
  decimals: number;
  totalBalance: number;
  totalValueUsd: number;
  priceUsd: number;
  chains: Array<{
    network: string;
    networkLabel: string;
    chainId: number;
    tokenAddress: string | null;
    balance: number;
    valueUsd: number;
  }>;
  isKnown: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KNOWN_SYMBOLS = new Set(['ETH', 'USDC', 'USDT', 'EURC', 'WBTC', 'CBBTC', 'ECOP']);

const NETWORK_META: Record<string, { label: string; chainId: number }> = {
  'base-mainnet': { label: 'Base',      chainId: 8453  },
  'eth-mainnet':  { label: 'Ethereum',  chainId: 1     },
  'arb-mainnet':  { label: 'Arbitrum',  chainId: 42161 },
  'opt-mainnet':  { label: 'Optimism',  chainId: 10    },
};

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ?? '';

// ─── Portfolio API ─────────────────────────────────────────────────────────────

async function fetchPortfolioBalances(address: string): Promise<PortfolioToken[]> {
  const url = `https://api.g.alchemy.com/data/v1/${ALCHEMY_API_KEY}/assets/tokens/by-address`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      addresses: [
        {
          address,
          networks: ['base-mainnet', 'eth-mainnet', 'arb-mainnet'],
        },
      ],
      withMetadata: true,
      withPrices: true,
      includeNativeTokens: true,
      includeErc20Tokens: true,
    }),
  });

  if (!res.ok) throw new Error(`Alchemy Portfolio API error: ${res.status}`);

  const json = await res.json();
  return json.data?.tokens ?? [];
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

function aggregateTokens(tokens: PortfolioToken[]): AggregatedToken[] {
  const map = new Map<string, AggregatedToken>();

  for (const token of tokens) {
    if (token.error || !token.tokenMetadata) continue;

    const { symbol, name, logo, decimals } = token.tokenMetadata;
    if (!symbol) continue;

    const balance = parseFloat(token.tokenBalance) / Math.pow(10, decimals);
    if (balance <= 0) continue;

    const priceUsd = token.tokenPrices?.[0] ? parseFloat(token.tokenPrices[0].value) : 0;
    const valueUsd = balance * priceUsd;

    const key = symbol.toUpperCase();
    const networkMeta = NETWORK_META[token.network];
    const existing = map.get(key);

    if (existing) {
      existing.totalBalance += balance;
      existing.totalValueUsd += valueUsd;
      existing.priceUsd = priceUsd || existing.priceUsd;
      existing.logo = existing.logo || logo;
      existing.chains.push({
        network: token.network,
        networkLabel: networkMeta?.label ?? token.network,
        chainId: networkMeta?.chainId ?? 0,
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
            networkLabel: networkMeta?.label ?? token.network,
            chainId: networkMeta?.chainId ?? 0,
            tokenAddress: token.tokenAddress,
            balance,
            valueUsd,
          },
        ],
        isKnown: KNOWN_SYMBOLS.has(key),
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.isKnown && !b.isKnown) return -1;
    if (!a.isKnown && b.isKnown) return 1;
    return b.totalValueUsd - a.totalValueUsd;
  });
}

// ─── Alchemy Prices API ───────────────────────────────────────────────────────

export interface AlchemyPrice {
  symbol: string;
  priceUsd: number;
}

export async function fetchAlchemyPrices(): Promise<Map<string, number>> {
  if (!ALCHEMY_API_KEY) return new Map();

  // Fetch prices for all tracked symbols
  const symbols = ['ETH', 'BTC', 'USDC', 'USDT', 'EURC'];
  const params = symbols.map((s) => `symbols=${s}`).join('&');
  const url = `https://api.g.alchemy.com/prices/v1/${ALCHEMY_API_KEY}/tokens/by-symbol?${params}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status}`);
    const json = await res.json();

    const map = new Map<string, number>();
    for (const item of json.data ?? []) {
      const price = parseFloat(item.prices?.[0]?.value ?? '0');
      if (price > 0) map.set(item.symbol.toUpperCase(), price);
    }
    return map;
  } catch {
    return new Map();
  }
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
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const tokens = rawTokens ? aggregateTokens(rawTokens) : [];
  const knownTokens = tokens.filter((t) => t.isKnown);
  const otherTokens = tokens.filter((t) => !t.isKnown);
  const totalPortfolioUsd = tokens.reduce((sum, t) => sum + t.totalValueUsd, 0);

  return {
    tokens,
    knownTokens,
    otherTokens,
    totalPortfolioUsd,
    rawTokens: rawTokens ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
}
