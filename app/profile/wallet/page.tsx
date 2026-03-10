'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useBalance, useReadContracts } from '@/lib/wagmi/compat';
import { formatUnits } from 'viem';
import { erc20Abi } from 'viem';
import DashboardLayout from '@/components/DashboardLayout';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import {
  TOKEN_ADDRESSES,
  TOKEN_METADATA,
  type CoinGeckoMarketData,
  type TokenSymbol,
} from '@/lib/config/tokens';
import { fetchAlchemyPrices } from '@/lib/hooks/usePortfolioBalances';
import { IS_MAINNET } from '@/lib/config/network';
import {
  type ChainBalanceEntry,
  CollapsibleTokenRow,
  SendModal,
  ReceiveModal,
  WalletSkeleton,
} from '@/components/wallet';

// ─── Network-mode constants (determined at build time) ────────────────────────

const C1_ID   = IS_MAINNET ? 8453    : 84532;    // Base / Base Sepolia
const C2_ID   = IS_MAINNET ? 1       : 11155111; // Ethereum / Eth Sepolia
const C3_ID   = IS_MAINNET ? 130     : 1301;     // Unichain / Uni Sepolia
const C4_ID   = IS_MAINNET ? 42161   : 421614;   // Arbitrum / Arb Sepolia

const C1_LABEL = IS_MAINNET ? 'Base'         : 'Base Sepolia';
const C2_LABEL = IS_MAINNET ? 'Ethereum'     : 'Eth Sepolia';
const C3_LABEL = IS_MAINNET ? 'Unichain'     : 'Uni Sepolia';
const C4_LABEL = IS_MAINNET ? 'Arbitrum'     : 'Arb Sepolia';

const NETWORK_SUBTITLE = IS_MAINNET
  ? 'Base · Unichain · Arbitrum · Ethereum'
  : 'Base Sepolia · Eth Sepolia · Uni Sepolia · Arb Sepolia';

// ERC-20 addresses per chain for this network mode
const A1 = IS_MAINNET ? TOKEN_ADDRESSES.base      : TOKEN_ADDRESSES.baseSepolia;
const A2 = IS_MAINNET ? TOKEN_ADDRESSES.ethereum  : TOKEN_ADDRESSES.ethSepolia;
const A3 = IS_MAINNET ? TOKEN_ADDRESSES.unichain  : TOKEN_ADDRESSES.unichainSepolia;
const A4 = IS_MAINNET ? TOKEN_ADDRESSES.arbitrum  : TOKEN_ADDRESSES.arbSepolia;

// Chain logos
const LOGO_C1 = '/chains/base_logo.svg';
const LOGO_C2 = '/chains/ethereum.png';
const LOGO_C3 = '/chains/unichain.png';
const LOGO_C4 = '/chains/arb.png';

// Token list order
const TOKEN_LIST: TokenSymbol[] = ['ECOP', 'ETH', 'USDC', 'USDT', 'EURC', 'BTC'];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const router = useRouter();
  const { isConnected, address, isResolvingAddress, authMode, isReconnecting } = useAccount();

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedTokens, setExpandedTokens] = useState<Set<TokenSymbol>>(new Set());
  const [marketData, setMarketData] = useState<Map<string, CoinGeckoMarketData>>(new Map());

  const zeroAddr = '0x0000000000000000000000000000000000000000' as `0x${string}`;
  const userAddr = address ?? zeroAddr;
  const balancesReady = !!address && !isResolvingAddress;

  // ── Native ETH on all 4 chains ─────────────────────────────────────────────
  const { data: ethC1, isLoading: ethC1L } = useBalance({ address, chainId: C1_ID, query: { enabled: balancesReady } });
  const { data: ethC2, isLoading: ethC2L } = useBalance({ address, chainId: C2_ID, query: { enabled: balancesReady } });
  const { data: ethC3, isLoading: ethC3L } = useBalance({ address, chainId: C3_ID, query: { enabled: balancesReady } });
  const { data: ethC4, isLoading: ethC4L } = useBalance({ address, chainId: C4_ID, query: { enabled: balancesReady } });

  // ── ERC-20 on Chain 1 (Base / Base Sepolia): USDC[0] USDT[1] EURC[2] BTC[3] ECOP[4] ──
  // testnet: only USDC[0] ECOP[1] (USDT/EURC/BTC not on testnets)
  const { data: erc20C1, isLoading: erc20C1L } = useReadContracts({
    contracts: IS_MAINNET ? [
      { address: A1.USDC, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C1_ID },
      { address: (A1 as typeof TOKEN_ADDRESSES.base).USDT, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C1_ID },
      { address: (A1 as typeof TOKEN_ADDRESSES.base).EURC, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C1_ID },
      { address: (A1 as typeof TOKEN_ADDRESSES.base).BTC,  abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C1_ID },
      { address: (A1 as typeof TOKEN_ADDRESSES.base).ECOP, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C1_ID },
    ] : [
      { address: A1.USDC, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C1_ID },
      { address: A1.ECOP, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C1_ID },
    ],
    query: { enabled: balancesReady },
  });

  // ── ERC-20 on Chain 2 (ETH / Eth Sepolia): USDC[0] USDT[1] EURC[2] BTC[3] ECOP[4] ──
  const { data: erc20C2, isLoading: erc20C2L } = useReadContracts({
    contracts: IS_MAINNET ? [
      { address: A2.USDC, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C2_ID },
      { address: (A2 as typeof TOKEN_ADDRESSES.ethereum).USDT, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C2_ID },
      { address: (A2 as typeof TOKEN_ADDRESSES.ethereum).EURC, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C2_ID },
      { address: (A2 as typeof TOKEN_ADDRESSES.ethereum).BTC,  abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C2_ID },
      { address: (A2 as typeof TOKEN_ADDRESSES.ethereum).ECOP, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C2_ID },
    ] : [
      { address: A2.USDC, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C2_ID },
      { address: A2.ECOP, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C2_ID },
    ],
    query: { enabled: balancesReady },
  });

  // ── ERC-20 on Chain 3 (Unichain): USDC[0] ECOP[1] ─────────────────────────
  const { data: erc20C3, isLoading: erc20C3L } = useReadContracts({
    contracts: [
      { address: A3.USDC, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C3_ID },
      { address: A3.ECOP, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C3_ID },
    ],
    query: { enabled: balancesReady },
  });

  // ── ERC-20 on Chain 4 (Arbitrum): USDC[0] USDT[1] BTC[2] ECOP[3] ──────────
  const { data: erc20C4, isLoading: erc20C4L } = useReadContracts({
    contracts: IS_MAINNET ? [
      { address: A4.USDC, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C4_ID },
      { address: (A4 as typeof TOKEN_ADDRESSES.arbitrum).USDT, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C4_ID },
      { address: (A4 as typeof TOKEN_ADDRESSES.arbitrum).BTC,  abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C4_ID },
      { address: (A4 as typeof TOKEN_ADDRESSES.arbitrum).ECOP, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C4_ID },
    ] : [
      { address: A4.USDC, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C4_ID },
      { address: A4.ECOP, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: C4_ID },
    ],
    query: { enabled: balancesReady },
  });

  // ── Prices via Alchemy Prices API (replaces CoinGecko — same key, no rate limits) ──
  // Maps coingeckoId → CoinGeckoMarketData-compatible object so all existing
  // components (CollapsibleTokenRow, PriceChange) work without change.
  useEffect(() => {
    const ALCHEMY_SYMBOL_TO_COINGECKO: Record<string, string> = {
      ETH:  TOKEN_METADATA.ETH.coingeckoId,
      BTC:  TOKEN_METADATA.BTC.coingeckoId,
      USDC: TOKEN_METADATA.USDC.coingeckoId,
      USDT: TOKEN_METADATA.USDT.coingeckoId,
      EURC: TOKEN_METADATA.EURC.coingeckoId,
    };

    const loadPrices = async () => {
      const prices = await fetchAlchemyPrices();
      if (!prices.size) return;

      setMarketData((prev) => {
        const next = new Map(prev);
        for (const [sym, cgId] of Object.entries(ALCHEMY_SYMBOL_TO_COINGECKO)) {
          const price = prices.get(sym);
          if (!price || !cgId) continue;
          const existing = next.get(cgId);
          next.set(cgId, {
            id: cgId,
            symbol: sym.toLowerCase(),
            name: TOKEN_METADATA[sym as TokenSymbol]?.name ?? sym,
            image: existing?.image ?? '',
            current_price: price,
            // Alchemy Prices API doesn't provide 24h change — keep previous if available
            price_change_percentage_24h: existing?.price_change_percentage_24h ?? null,
          } satisfies CoinGeckoMarketData);
        }
        return next;
      });
    };

    loadPrices();
    const id = setInterval(loadPrices, 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const big = (data: { status: string; result?: any }[] | undefined, idx: number): bigint | undefined => {
    const r = data?.[idx];
    return r?.status === 'success' ? (r.result as bigint) : undefined;
  };

  const toggleExpand = (sym: TokenSymbol) =>
    setExpandedTokens((prev) => {
      const next = new Set(prev);
      next.has(sym) ? next.delete(sym) : next.add(sym);
      return next;
    });

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Per-token chain balances ───────────────────────────────────────────────
  // Index mapping per mode:
  // Mainnet C1/C2: [USDC=0, USDT=1, EURC=2, BTC=3, ECOP=4]
  // Testnet C1/C2: [USDC=0, ECOP=1]
  // C3 (Unichain): [USDC=0, ECOP=1]
  // Mainnet C4:    [USDC=0, USDT=1, BTC=2, ECOP=3]
  // Testnet C4:    [USDC=0, ECOP=1]

  const usdcC1 = big(erc20C1, 0);
  const usdcC2 = big(erc20C2, 0);
  const usdcC3 = big(erc20C3, 0);
  const usdcC4 = big(erc20C4, 0);

  const usdtC1 = IS_MAINNET ? big(erc20C1, 1) : undefined;
  const usdtC2 = IS_MAINNET ? big(erc20C2, 1) : undefined;
  const usdtC4 = IS_MAINNET ? big(erc20C4, 1) : undefined;

  const eurcC1 = IS_MAINNET ? big(erc20C1, 2) : undefined;
  const eurcC2 = IS_MAINNET ? big(erc20C2, 2) : undefined;

  const btcC1  = IS_MAINNET ? big(erc20C1, 3) : undefined;
  const btcC2  = IS_MAINNET ? big(erc20C2, 3) : undefined;
  const btcC4  = IS_MAINNET ? big(erc20C4, 2) : undefined;

  const ecopC1 = IS_MAINNET ? big(erc20C1, 4) : big(erc20C1, 1);
  const ecopC2 = IS_MAINNET ? big(erc20C2, 4) : big(erc20C2, 1);
  const ecopC3 = big(erc20C3, 1);
  const ecopC4 = IS_MAINNET ? big(erc20C4, 3) : big(erc20C4, 1);

  const ethLoading  = erc20C1L || erc20C2L || erc20C3L || erc20C4L || ethC1L || ethC2L || ethC3L || ethC4L;
  const erc20Loading = erc20C1L || erc20C2L || erc20C3L || erc20C4L;

  const tokenBalances: Record<TokenSymbol, { chainBalances: ChainBalanceEntry[]; loading: boolean }> = {
    ECOP: {
      chainBalances: [
        { chainId: C1_ID, label: C1_LABEL, logo: LOGO_C1, balance: ecopC1 },
        { chainId: C2_ID, label: C2_LABEL, logo: LOGO_C2, balance: ecopC2 },
        { chainId: C3_ID, label: C3_LABEL, logo: LOGO_C3, balance: ecopC3 },
        { chainId: C4_ID, label: C4_LABEL, logo: LOGO_C4, balance: ecopC4 },
      ],
      loading: erc20Loading,
    },
    ETH: {
      chainBalances: [
        { chainId: C1_ID, label: C1_LABEL, logo: LOGO_C1, balance: ethC1?.value },
        { chainId: C2_ID, label: C2_LABEL, logo: LOGO_C2, balance: ethC2?.value },
        { chainId: C3_ID, label: C3_LABEL, logo: LOGO_C3, balance: ethC3?.value },
        { chainId: C4_ID, label: C4_LABEL, logo: LOGO_C4, balance: ethC4?.value },
      ],
      loading: ethC1L || ethC2L || ethC3L || ethC4L,
    },
    USDC: {
      chainBalances: [
        { chainId: C1_ID, label: C1_LABEL, logo: LOGO_C1, balance: usdcC1 },
        { chainId: C2_ID, label: C2_LABEL, logo: LOGO_C2, balance: usdcC2 },
        { chainId: C3_ID, label: C3_LABEL, logo: LOGO_C3, balance: usdcC3 },
        { chainId: C4_ID, label: C4_LABEL, logo: LOGO_C4, balance: usdcC4 },
      ],
      loading: erc20Loading,
    },
    USDT: {
      chainBalances: [
        { chainId: C1_ID, label: C1_LABEL, logo: LOGO_C1, balance: usdtC1 },
        { chainId: C2_ID, label: C2_LABEL, logo: LOGO_C2, balance: usdtC2 },
        { chainId: C4_ID, label: C4_LABEL, logo: LOGO_C4, balance: usdtC4 },
      ],
      loading: erc20Loading,
    },
    EURC: {
      chainBalances: [
        { chainId: C1_ID, label: C1_LABEL, logo: LOGO_C1, balance: eurcC1 },
        { chainId: C2_ID, label: C2_LABEL, logo: LOGO_C2, balance: eurcC2 },
      ],
      loading: erc20Loading,
    },
    BTC: {
      chainBalances: [
        { chainId: C1_ID, label: C1_LABEL, logo: LOGO_C1, balance: btcC1 },
        { chainId: C2_ID, label: C2_LABEL, logo: LOGO_C2, balance: btcC2 },
        { chainId: C4_ID, label: C4_LABEL, logo: LOGO_C4, balance: btcC4 },
      ],
      loading: erc20Loading,
    },
  };

  // ── Total portfolio ────────────────────────────────────────────────────────
  const isBalancesLoading = isResolvingAddress || ethLoading;

  const totalPortfolio = (() => {
    if (isBalancesLoading) return null;
    let sum = 0;
    for (const sym of TOKEN_LIST) {
      const price = marketData.get(TOKEN_METADATA[sym].coingeckoId)?.current_price ?? 0;
      if (!price) continue;
      const dec = TOKEN_METADATA[sym].decimals;
      for (const { balance } of tokenBalances[sym].chainBalances) {
        if (balance) sum += parseFloat(formatUnits(balance, dec)) * price;
      }
    }
    return sum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  })();

  // ── Redirect if no address ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isReconnecting && !isResolvingAddress && !address) {
      router.push('/');
    }
  }, [isReconnecting, isResolvingAddress, address, router]);

  // ── Loading / guard states ─────────────────────────────────────────────────
  if (isReconnecting) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="w-7 h-7 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isConnected || isResolvingAddress) {
    return (
      <DashboardLayout>
        <WalletSkeleton />
      </DashboardLayout>
    );
  }

  if (!address) return null;

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-xl mx-auto space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Wallet</h1>
              <p className="text-xs text-gray-500">{NETWORK_SUBTITLE}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReceiveModal(true)}
                className="btn-secondary flex items-center gap-1.5 text-sm"
              >
                <ArrowDownIcon className="w-4 h-4" />
                Receive
              </button>
              <button
                onClick={() => setShowSendModal(true)}
                className="btn-primary flex items-center gap-1.5 text-sm"
              >
                <ArrowUpIcon className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>

          {/* Account type + address pill */}
          <div className="flex items-center gap-2 flex-wrap">
            {authMode === 'embedded' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-900/40 border border-purple-700/30 text-purple-300">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                Smart Wallet · EIP-7702
              </span>
            )}
            {authMode === 'external' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-800/60 border border-white/[0.07] text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                External Wallet
              </span>
            )}
            <button
              onClick={copyAddress}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-white/[0.04] border border-white/[0.07] text-gray-400 hover:text-white hover:border-white/20 transition-colors"
              title="Copy address"
            >
              {address.slice(0, 6)}…{address.slice(-4)}
              {copied
                ? <CheckIcon className="w-3 h-3 text-emerald-400" />
                : <ClipboardDocumentIcon className="w-3 h-3" />}
            </button>
          </div>

          {/* Smart Wallet status */}
          {authMode === 'embedded' && (
            <div className="rounded-2xl border border-emerald-700/30 bg-emerald-900/10 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-300">Smart Wallet Active</p>
                <p className="text-xs text-emerald-600">Gas-free transactions enabled · EIP-7702 · MAv2</p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600 bg-emerald-900/40 px-2 py-0.5 rounded-full shrink-0">Live</span>
            </div>
          )}

          {/* Total portfolio card */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-900/40 to-blue-900/30 border border-purple-700/30 p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Portfolio</p>
            {totalPortfolio === null ? (
              <div className="h-9 w-36 bg-white/10 rounded animate-pulse mt-1" />
            ) : (
              <p className="text-3xl font-bold text-white">
                ${totalPortfolio}
                <span className="text-sm text-gray-400 font-normal ml-2">USD</span>
              </p>
            )}
          </div>

          {/* Token list */}
          <div className="space-y-2">
            {TOKEN_LIST.map((sym) => (
              <CollapsibleTokenRow
                key={sym}
                symbol={sym}
                chainBalances={tokenBalances[sym].chainBalances}
                isLoading={tokenBalances[sym].loading}
                marketData={marketData}
                isExpanded={expandedTokens.has(sym)}
                onToggle={() => toggleExpand(sym)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <SendModal
          onClose={() => setShowSendModal(false)}
          balances={{
            baseEth:  tokenBalances.ETH.chainBalances[0]?.balance,
            ethEth:   tokenBalances.ETH.chainBalances[1]?.balance,
            baseUsdc: tokenBalances.USDC.chainBalances[0]?.balance,
            baseUsdt: tokenBalances.USDT.chainBalances[0]?.balance,
            baseEurc: tokenBalances.EURC.chainBalances[0]?.balance,
            baseBtc:  tokenBalances.BTC.chainBalances[0]?.balance,
            ethUsdc:  tokenBalances.USDC.chainBalances[1]?.balance,
            ethUsdt:  tokenBalances.USDT.chainBalances[1]?.balance,
            ethEurc:  tokenBalances.EURC.chainBalances[1]?.balance,
            ethBtc:   tokenBalances.BTC.chainBalances[1]?.balance,
          }}
          marketData={marketData}
        />
      )}

      {/* Receive Modal */}
      {showReceiveModal && (
        <ReceiveModal
          address={address}
          onClose={() => setShowReceiveModal(false)}
        />
      )}
    </DashboardLayout>
  );
}
