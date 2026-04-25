'use client';

import { useAccount, useChainId, useReadContract } from '@/lib/wagmi/compat';
import { formatUnits, parseUnits } from 'viem';
import { erc20Abi } from 'viem';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { useV4Swap } from '@/lib/hooks/useV4Swap';
import { useV4Quote } from '@/lib/hooks/useV4Quote';
import { getContractsForChain, getTxExplorerLink } from '@/lib/contracts/addresses';
import { ecopAbi } from '@/lib/contracts/ecopAbi';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import {
  ArrowsRightLeftIcon,
  LockClosedIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';

const TOKENS = {
  USDC: { symbol: 'USDC', name: 'USD Coin',        decimals: 6,  icon: '$' },
  ECOP: { symbol: 'ECOP', name: 'Electronic COP',  decimals: 18, icon: '₱' },
} as const;

type TokenSymbol = keyof typeof TOKENS;

const STEP_LABELS: Record<string, string> = {
  'swapping': 'Swapping…',
};

// Alchemy RPC URL derived from chain ID
function alchemyRpcUrl(chainId: number, apiKey: string): string {
  const map: Record<number, string> = {
    1:        `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`,
    8453:     `https://base-mainnet.g.alchemy.com/v2/${apiKey}`,
    11155111: `https://eth-sepolia.g.alchemy.com/v2/${apiKey}`,
    84532:    `https://base-sepolia.g.alchemy.com/v2/${apiKey}`,
    42161:    `https://arb-mainnet.g.alchemy.com/v2/${apiKey}`,
    421614:   `https://arb-sepolia.g.alchemy.com/v2/${apiKey}`,
    130:      `https://unichain-mainnet.g.alchemy.com/v2/${apiKey}`,
    1301:     `https://unichain-sepolia.g.alchemy.com/v2/${apiKey}`,
  };
  return map[chainId] ?? `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`;
}

interface AlchemyTransfer {
  hash: string;
  from: string;
  to: string | null;
  asset: string;
  value: number | null;
  metadata: { blockTimestamp: string };
}

interface TransferRow {
  hash: string;
  direction: 'out' | 'in';
  asset: string;
  value: number | null;
  timestamp: string;
}

export default function SwapsPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const { hasPassportNFT, hasActivePassport, hasAnyLPNFT, hasEcreditscoringNFT } = useNFTBalance();

  const [fromSymbol, setFromSymbol] = useState<TokenSymbol>('USDC');
  const [fromAmount, setFromAmount] = useState('');

  const fromToken = TOKENS[fromSymbol];
  const toSymbol: TokenSymbol = fromSymbol === 'USDC' ? 'ECOP' : 'USDC';
  const toToken = TOKENS[toSymbol];

  const amountInWei = (() => {
    try {
      return fromAmount ? parseUnits(fromAmount, fromToken.decimals) : 0n;
    } catch {
      return 0n;
    }
  })();

  const { amountOut, isLoading: isQuoting, error: quoteError } = useV4Quote({
    fromSymbol,
    amountIn: amountInWei,
  });

  const toAmount = amountOut
    ? parseFloat(formatUnits(amountOut, toToken.decimals)).toLocaleString('en-US', {
        maximumFractionDigits: toToken.decimals === 6 ? 2 : 0,
      })
    : '';

  const { swap, step, errorMsg, txHash, reset } = useV4Swap();

  const canAccess = hasPassportNFT || hasActivePassport || hasAnyLPNFT || hasEcreditscoringNFT;
  const isProcessing = step === 'swapping';

  // Token balances
  const { data: usdcBalance } = useReadContract({
    address: contracts?.USDC,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  const { data: ecopBalance } = useReadContract({
    address: contracts?.ECOP,
    abi: ecopAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts && contracts.ECOP !== '0x0000000000000000000000000000000000000000' },
  });

  const getBalance = (symbol: TokenSymbol) => {
    if (symbol === 'USDC' && usdcBalance) return parseFloat(formatUnits(usdcBalance as bigint, 6)).toLocaleString();
    if (symbol === 'ECOP' && ecopBalance) return parseFloat(formatUnits(ecopBalance as bigint, 18)).toLocaleString();
    return '0';
  };

  // ── Transaction history ──────────────────────────────────────────────
  const [transfers, setTransfers] = useState<TransferRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!address || !contracts) return;
    const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ?? '';
    if (!apiKey) return;

    const rpc = alchemyRpcUrl(chainId, apiKey);
    const contractAddresses = [contracts.USDC, contracts.ECOP].filter(
      a => a && a !== '0x0000000000000000000000000000000000000000'
    );
    if (contractAddresses.length === 0) return;

    setLoadingHistory(true);
    try {
      // Fetch sent + received transfers in parallel
      const [sentRes, receivedRes] = await Promise.all([
        fetch(rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: 1, jsonrpc: '2.0',
            method: 'alchemy_getAssetTransfers',
            params: [{
              fromBlock: '0x0', toBlock: 'latest',
              fromAddress: address,
              contractAddresses,
              category: ['erc20'],
              maxCount: '0x19',
              withMetadata: true,
              order: 'desc',
            }],
          }),
        }),
        fetch(rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: 2, jsonrpc: '2.0',
            method: 'alchemy_getAssetTransfers',
            params: [{
              fromBlock: '0x0', toBlock: 'latest',
              toAddress: address,
              contractAddresses,
              category: ['erc20'],
              maxCount: '0x19',
              withMetadata: true,
              order: 'desc',
            }],
          }),
        }),
      ]);

      const [sentData, receivedData] = await Promise.all([sentRes.json(), receivedRes.json()]);

      const sent: TransferRow[] = (sentData?.result?.transfers ?? []).map((t: AlchemyTransfer) => ({
        hash: t.hash,
        direction: 'out' as const,
        asset: t.asset,
        value: t.value,
        timestamp: t.metadata?.blockTimestamp ?? '',
      }));

      const received: TransferRow[] = (receivedData?.result?.transfers ?? []).map((t: AlchemyTransfer) => ({
        hash: t.hash,
        direction: 'in' as const,
        asset: t.asset,
        value: t.value,
        timestamp: t.metadata?.blockTimestamp ?? '',
      }));

      // Merge, deduplicate by hash+direction, sort newest first
      const merged = [...sent, ...received];
      const seen = new Set<string>();
      const deduped = merged.filter(t => {
        const key = `${t.hash}-${t.direction}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      deduped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setTransfers(deduped.slice(0, 20));
    } catch {
      // silently ignore — history is non-critical
    } finally {
      setLoadingHistory(false);
    }
  }, [address, chainId, contracts]);

  useEffect(() => {
    if (isConnected && address) fetchHistory();
  }, [isConnected, address, fetchHistory]);

  // Refresh history after a successful swap
  useEffect(() => {
    if (step === 'success') {
      setFromAmount('');
      // Small delay to let the tx index
      const t = setTimeout(() => fetchHistory(), 3000);
      return () => clearTimeout(t);
    }
  }, [step, fetchHistory]);

  const handleSwapDirection = () => {
    setFromSymbol(toSymbol);
    setFromAmount('');
    reset();
  };

  const handleSwap = async () => {
    if (!fromAmount || amountInWei === 0n) return;
    await swap({
      fromSymbol,
      amountIn: amountInWei,
      amountOutMinimum: amountOut ? (amountOut * 95n) / 100n : 0n,
    });
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full min-h-[80vh]">
        <div className="text-center p-8">
          <ArrowsRightLeftIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">Connect your wallet to access swaps</p>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="card p-8 text-center">
            <LockClosedIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Tier 1 Required</h2>
            <p className="text-gray-400 mb-6">
              You need at least a CONVEXO PASSPORT (Tier 1) to access swap features.
            </p>
            <Link href="/digital-id/humanity">
              <button className="btn-primary">Get Verified</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/treasury" className="text-gray-400 hover:text-white">Treasury</Link>
            <span className="text-gray-600">/</span>
            <span className="text-white">Swaps</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Token Swaps</h1>
          <p className="text-gray-400">Swap USDC and ECOP via Uniswap V4</p>
        </div>

        {/* Success state */}
        {step === 'success' && (
          <div className="card p-6 text-center space-y-4">
            <CheckCircleIcon className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="text-white font-semibold text-lg">Swap successful!</p>
            {txHash && (
              <a
                href={getTxExplorerLink(chainId, txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
              >
                View transaction <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </a>
            )}
            <button onClick={reset} className="btn-secondary w-full">
              Swap again
            </button>
          </div>
        )}

        {/* Swap card */}
        {step !== 'success' && (
          <div className="card p-6">
            {/* From */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">From</span>
                <span className="text-sm text-gray-400">
                  Balance: {getBalance(fromSymbol)} {fromSymbol}
                </span>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => { setFromAmount(e.target.value); reset(); }}
                  placeholder="0.00"
                  disabled={isProcessing}
                  className="flex-1 bg-transparent text-2xl font-semibold text-white outline-none disabled:opacity-50"
                />
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                    {fromToken.icon}
                  </span>
                  <span className="font-medium text-white">{fromToken.symbol}</span>
                </div>
              </div>
            </div>

            {/* Direction toggle */}
            <div className="flex justify-center -my-2 relative z-10">
              <button
                onClick={handleSwapDirection}
                disabled={isProcessing}
                className="p-3 bg-gray-900 rounded-xl border border-gray-700 hover:border-purple-500 transition-colors disabled:opacity-50"
              >
                <ArrowsRightLeftIcon className="w-5 h-5 text-gray-400 rotate-90" />
              </button>
            </div>

            {/* To */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">To (estimated)</span>
                <span className="text-sm text-gray-400">
                  Balance: {getBalance(toSymbol)} {toSymbol}
                </span>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl">
                <div className="flex-1 text-2xl font-semibold text-white">
                  {isQuoting ? (
                    <span className="text-gray-500 text-base">Fetching quote…</span>
                  ) : (
                    toAmount || <span className="text-gray-600">0.00</span>
                  )}
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
                    {toToken.icon}
                  </span>
                  <span className="font-medium text-white">{toToken.symbol}</span>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400 opacity-0" />
                </div>
              </div>
            </div>

            {/* Quote info */}
            {amountOut && fromAmount && (
              <div className="mt-4 p-3 bg-gray-800/50 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Rate</span>
                  <span className="text-white">
                    1 {fromSymbol} ={' '}
                    {fromSymbol === 'USDC'
                      ? parseFloat(formatUnits(amountOut, 18)).toLocaleString('en-US', { maximumFractionDigits: 0 })
                      : parseFloat(formatUnits(amountOut, 6)).toFixed(6)
                    } {toSymbol}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Slippage tolerance</span>
                  <span className="text-white">5%</span>
                </div>
              </div>
            )}

            {/* Quote error */}
            {quoteError && fromAmount && (
              <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-700/40 rounded-xl">
                <p className="text-yellow-400 text-sm">{quoteError}</p>
              </div>
            )}

            {/* Processing status */}
            {isProcessing && (
              <div className="mt-4 flex items-center gap-3 p-3 bg-purple-900/20 border border-purple-700/40 rounded-xl">
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="text-purple-300 text-sm">{STEP_LABELS[step]}</span>
              </div>
            )}

            {/* Swap error */}
            {step === 'error' && errorMsg && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-700/40 rounded-xl">
                <p className="text-red-400 text-sm">{errorMsg}</p>
              </div>
            )}

            {/* Swap button */}
            <button
              onClick={handleSwap}
              disabled={!fromAmount || amountInWei === 0n || isProcessing || isQuoting}
              className="btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? STEP_LABELS[step] : 'Swap'}
            </button>
          </div>
        )}

        {/* Pool info */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">USDC / ECOP Pool</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Protocol</span>
              <span className="text-white">Uniswap V4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Fee tier</span>
              <span className="text-white">0.05%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Access</span>
              <span className="text-emerald-400">Tier 1+ (Convexo Passport)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Network</span>
              <span className="text-white">{contracts?.CHAIN_NAME ?? 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
            <button
              onClick={fetchHistory}
              disabled={loadingHistory}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40"
            >
              {loadingHistory ? 'Loading…' : 'Refresh'}
            </button>
          </div>

          {loadingHistory && transfers.length === 0 ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              <span className="text-gray-500 text-sm">Loading history…</span>
            </div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No USDC or ECOP transfers found for this wallet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transfers.map((t, i) => (
                <div
                  key={`${t.hash}-${t.direction}-${i}`}
                  className="flex items-center gap-3 py-2.5 border-b border-gray-800/60 last:border-0"
                >
                  {/* Direction icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    t.direction === 'in'
                      ? 'bg-emerald-500/10'
                      : 'bg-red-500/10'
                  }`}>
                    {t.direction === 'in'
                      ? <ArrowDownIcon className="w-4 h-4 text-emerald-400" />
                      : <ArrowUpIcon className="w-4 h-4 text-red-400" />
                    }
                  </div>

                  {/* Token + direction */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      {t.direction === 'in' ? 'Received' : 'Sent'} {t.asset}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t.timestamp
                        ? new Date(t.timestamp).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })
                        : '—'}
                    </p>
                  </div>

                  {/* Amount + link */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${
                      t.direction === 'in' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {t.direction === 'in' ? '+' : '-'}
                      {t.value != null
                        ? t.value.toLocaleString('en-US', { maximumFractionDigits: t.asset === 'USDC' ? 2 : 0 })
                        : '—'}
                    </p>
                    <a
                      href={getTxExplorerLink(chainId, t.hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-xs text-gray-500 hover:text-purple-400 transition-colors"
                    >
                      {t.hash.slice(0, 8)}… <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
