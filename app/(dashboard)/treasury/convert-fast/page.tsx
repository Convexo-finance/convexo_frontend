'use client';

import { useAccount, useChainId, useReadContract } from '@/lib/wagmi/compat';
import { useState, useEffect } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { erc20Abi } from 'viem';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { useConvexoWrite } from '@/lib/hooks/useConvexoWrite';
import { apiFetch } from '@/lib/api/client';
import Link from 'next/link';
import {
  ArrowsUpDownIcon,
  LockClosedIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

type SwapDir = 'ecop-to-usdc' | 'usdc-to-ecop';

export default function ConvertFastPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const { hasPassportNFT, hasActivePassport, hasAnyLPNFT } = useNFTBalance();

  const [dir, setDir] = useState<SwapDir>('ecop-to-usdc');
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [rate, setRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);

  const canAccess = hasPassportNFT || hasActivePassport || hasAnyLPNFT;

  // ── Fetch rate from backend ─────────────────────────────────────────────────
  useEffect(() => {
    setRateLoading(true);
    const pair = dir === 'ecop-to-usdc' ? 'ECOP-USDC' : 'USDC-ECOP';
    apiFetch<{ pair: string; rate: number }>(`/rates/${pair}`)
      .then(d => setRate(d.rate))
      .catch(() => setRate(null))
      .finally(() => setRateLoading(false));
  }, [dir]);

  // ── Token balances ──────────────────────────────────────────────────────────
  const ecopEnabled = !!address && !!contracts && contracts.ECOP !== '0x0000000000000000000000000000000000000000';

  const { data: ecopBalance } = useReadContract({
    address: contracts?.ECOP,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: ecopEnabled },
  });

  const { data: usdcBalance } = useReadContract({
    address: contracts?.USDC,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  const inputToken = dir === 'ecop-to-usdc' ? 'ECOP' : 'USDC';
  const outputToken = dir === 'ecop-to-usdc' ? 'USDC' : 'ECOP';
  const inputDecimals = inputToken === 'ECOP' ? 18 : 6;
  const outputDecimals = outputToken === 'USDC' ? 6 : 18;

  const inputBalance = dir === 'ecop-to-usdc'
    ? (ecopBalance ? parseFloat(formatUnits(ecopBalance as bigint, 18)) : 0)
    : (usdcBalance ? parseFloat(formatUnits(usdcBalance as bigint, 6)) : 0);

  // ── Calculate output ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!inputAmount || !rate) { setOutputAmount(''); return; }
    const val = parseFloat(inputAmount);
    if (isNaN(val) || val <= 0) { setOutputAmount(''); return; }
    setOutputAmount((val * rate).toFixed(outputDecimals === 6 ? 2 : 4));
  }, [inputAmount, rate, outputDecimals]);

  const flipDirection = () => {
    setDir(d => d === 'ecop-to-usdc' ? 'usdc-to-ecop' : 'ecop-to-usdc');
    setInputAmount('');
    setOutputAmount('');
  };

  const handleMax = () => {
    setInputAmount(inputBalance.toFixed(inputDecimals === 6 ? 2 : 4));
  };

  // ── Not connected ───────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <ArrowsUpDownIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to access Convert Fast</p>
          </div>
        </div>
    );
  }

  // ── Not verified ────────────────────────────────────────────────────────────
  if (!canAccess) {
    return (
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="card p-8 text-center">
              <LockClosedIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h2 className="text-2xl font-bold text-white mb-2">Verification Required</h2>
              <p className="text-gray-400 mb-6">
                You need a CONVEXO PASSPORT (Tier 1) to access treasury features.
              </p>
              <Link href="/digital-id/humanity">
                <button className="btn-primary">Get Verified</button>
              </Link>
            </div>
          </div>
        </div>
    );
  }

  const canSwap = !!inputAmount && parseFloat(inputAmount) > 0 && !!rate && !rateLoading;

  return (
      <div className="p-8">
        <div className="max-w-lg mx-auto space-y-6">

          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2 text-sm">
              <Link href="/treasury" className="text-gray-400 hover:text-white transition-colors">Treasury</Link>
              <span className="text-gray-600">/</span>
              <span className="text-white">Convert Fast</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">Convert Fast</h1>
            <p className="text-gray-400">Swap between ECOP and USDC at the admin-controlled rate</p>
          </div>

          {/* Swap card */}
          <div className="card space-y-2">

            {/* Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">You pay</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Balance: {inputBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {inputToken}
                  </span>
                  <button
                    onClick={handleMax}
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                  >
                    MAX
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-900/60 rounded-xl border border-gray-700/50">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {inputToken[0]}
                </div>
                <input
                  type="number"
                  value={inputAmount}
                  onChange={e => setInputAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="any"
                  className="flex-1 bg-transparent text-2xl font-semibold text-white outline-none placeholder-gray-600"
                />
                <span className="text-white font-semibold text-lg">{inputToken}</span>
              </div>
            </div>

            {/* Flip button */}
            <div className="flex justify-center">
              <button
                onClick={flipDirection}
                className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl hover:border-purple-500/50 hover:bg-gray-700 transition-all"
                title="Flip direction"
              >
                <ArrowsUpDownIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Output */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">You receive</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-900/60 rounded-xl border border-gray-700/50">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {outputToken[0]}
                </div>
                <input
                  type="text"
                  value={outputAmount}
                  readOnly
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-2xl font-semibold text-white outline-none placeholder-gray-600"
                />
                <span className="text-white font-semibold text-lg">{outputToken}</span>
              </div>
            </div>

            {/* Rate info */}
            <div className="p-3 bg-gray-800/50 rounded-xl">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Exchange Rate</span>
                {rateLoading ? (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading…</span>
                  </div>
                ) : rate ? (
                  <span className="text-white">
                    1 {inputToken} = {rate.toLocaleString(undefined, { maximumFractionDigits: 6 })} {outputToken}
                  </span>
                ) : (
                  <span className="text-gray-500">Rate unavailable</span>
                )}
              </div>
            </div>

            {/* Swap button */}
            <button
              disabled={!canSwap}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                // Uniswap V4 integration pending — pool address required
              }}
            >
              {rateLoading ? 'Loading rate…' : !rate ? 'Rate unavailable' : `Swap ${inputToken} → ${outputToken}`}
            </button>
          </div>

          {/* Integration notice */}
          <div className="flex gap-3 p-4 bg-blue-900/20 border border-blue-700/30 rounded-xl">
            <InformationCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-300">
              Full Uniswap V4 swap execution requires the deployed pool address. The rate is live from the admin-controlled price feed.
            </p>
          </div>

          {/* Pool info */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-3">Pool Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">Pair</p>
                <p className="text-white font-medium">ECOP / USDC</p>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">Protocol</p>
                <p className="text-white font-medium">Uniswap V4</p>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">Network</p>
                <p className="text-white font-medium">{contracts?.CHAIN_NAME ?? 'Unknown'}</p>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">Rate Source</p>
                <p className="text-white font-medium">Admin Price Feed</p>
              </div>
            </div>
          </div>

        </div>
      </div>
  );
}
