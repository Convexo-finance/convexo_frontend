'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useBalance, useReadContracts } from '@/lib/wagmi/compat';
import { formatUnits } from 'viem';
import { erc20Abi } from 'viem';
import { base, mainnet } from 'wagmi/chains';
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
  COINGECKO_IDS,
  type CoinGeckoMarketData,
  type TokenSymbol,
} from '@/lib/config/tokens';
import {
  CollapsibleTokenRow,
  SendModal,
  ReceiveModal,
  WalletSkeleton,
} from '@/components/wallet';

// ─── Main page ────────────────────────────────────────────────────────────────

const TOKEN_LIST: TokenSymbol[] = ['ETH', 'USDC', 'USDT', 'EURC', 'BTC'];

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

  // ── Native ETH balances ────────────────────────────────────────────────────
  const { data: ethBase, isLoading: ethBaseLoading } = useBalance({
    address,
    chainId: base.id,
    query: { enabled: balancesReady },
  });
  const { data: ethEthereum, isLoading: ethEthereumLoading } = useBalance({
    address,
    chainId: mainnet.id,
    query: { enabled: balancesReady },
  });

  // ── ERC-20 balances — Base ─────────────────────────────────────────────────
  const { data: baseErc20, isLoading: baseErc20Loading } = useReadContracts({
    contracts: [
      { address: TOKEN_ADDRESSES.base.USDC, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: base.id },
      { address: TOKEN_ADDRESSES.base.USDT, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: base.id },
      { address: TOKEN_ADDRESSES.base.EURC, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: base.id },
      { address: TOKEN_ADDRESSES.base.BTC,  abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: base.id },
    ],
    query: { enabled: balancesReady },
  });

  // ── ERC-20 balances — Ethereum ─────────────────────────────────────────────
  const { data: ethErc20, isLoading: ethErc20Loading } = useReadContracts({
    contracts: [
      { address: TOKEN_ADDRESSES.ethereum.USDC, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: mainnet.id },
      { address: TOKEN_ADDRESSES.ethereum.USDT, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: mainnet.id },
      { address: TOKEN_ADDRESSES.ethereum.EURC, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: mainnet.id },
      { address: TOKEN_ADDRESSES.ethereum.BTC,  abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: mainnet.id },
    ],
    query: { enabled: balancesReady },
  });

  // ── CoinGecko market data ──────────────────────────────────────────────────
  useEffect(() => {
    const fetch60s = async () => {
      try {
        const ids = COINGECKO_IDS.join(',');
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=10&page=1&sparkline=false`
        );
        const data: CoinGeckoMarketData[] = await res.json();
        setMarketData(new Map(data.map((c) => [c.id, c])));
      } catch {
        // degrade gracefully
      }
    };
    fetch60s();
    const id = setInterval(fetch60s, 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getErc20Big = (data: typeof baseErc20, idx: number): bigint | undefined => {
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

  // ── Per-token balances map ─────────────────────────────────────────────────
  const tokenBalances: Record<
    TokenSymbol,
    { base: bigint | undefined; eth: bigint | undefined; loading: boolean }
  > = {
    ETH: {
      base: ethBase?.value,
      eth: ethEthereum?.value,
      loading: ethBaseLoading || ethEthereumLoading,
    },
    USDC: {
      base: getErc20Big(baseErc20, 0),
      eth: getErc20Big(ethErc20, 0),
      loading: baseErc20Loading || ethErc20Loading,
    },
    USDT: {
      base: getErc20Big(baseErc20, 1),
      eth: getErc20Big(ethErc20, 1),
      loading: baseErc20Loading || ethErc20Loading,
    },
    EURC: {
      base: getErc20Big(baseErc20, 2),
      eth: getErc20Big(ethErc20, 2),
      loading: baseErc20Loading || ethErc20Loading,
    },
    BTC: {
      base: getErc20Big(baseErc20, 3),
      eth: getErc20Big(ethErc20, 3),
      loading: baseErc20Loading || ethErc20Loading,
    },
  };

  // ── Total portfolio ────────────────────────────────────────────────────────
  const isBalancesLoading =
    isResolvingAddress ||
    ethBaseLoading || ethEthereumLoading ||
    baseErc20Loading || ethErc20Loading;

  const totalPortfolio = (() => {
    if (isBalancesLoading) return null;
    let sum = 0;
    for (const sym of TOKEN_LIST) {
      const { base: bBal, eth: eBal } = tokenBalances[sym];
      const price = marketData.get(TOKEN_METADATA[sym].coingeckoId)?.current_price ?? 0;
      const dec = TOKEN_METADATA[sym].decimals;
      if (bBal) sum += parseFloat(formatUnits(bBal, dec)) * price;
      if (eBal) sum += parseFloat(formatUnits(eBal, dec)) * price;
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
              <p className="text-xs text-gray-500">Base &amp; Ethereum Mainnet</p>
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
            {TOKEN_LIST.map((sym) => {
              const { base: bBal, eth: eBal, loading } = tokenBalances[sym];
              return (
                <CollapsibleTokenRow
                  key={sym}
                  symbol={sym}
                  baseBalance={bBal}
                  ethBalance={eBal}
                  isLoading={loading}
                  marketData={marketData}
                  isExpanded={expandedTokens.has(sym)}
                  onToggle={() => toggleExpand(sym)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <SendModal
          onClose={() => setShowSendModal(false)}
          balances={{
            baseEth: tokenBalances.ETH.base,
            ethEth: tokenBalances.ETH.eth,
            baseUsdc: tokenBalances.USDC.base,
            baseUsdt: tokenBalances.USDT.base,
            baseEurc: tokenBalances.EURC.base,
            baseBtc: tokenBalances.BTC.base,
            ethUsdc: tokenBalances.USDC.eth,
            ethUsdt: tokenBalances.USDT.eth,
            ethEurc: tokenBalances.EURC.eth,
            ethBtc: tokenBalances.BTC.eth,
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
