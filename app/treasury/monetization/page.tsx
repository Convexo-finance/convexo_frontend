'use client';

import { useAccount, useChainId, useReadContract, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { erc20Abi } from 'viem';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { ecopAbi } from '@/lib/contracts/ecopAbi';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  LockClosedIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

export default function MonetizationPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const { hasPassportNFT, hasActivePassport, hasLPsNFT, hasVaultsNFT } = useNFTBalance();
  const [copAmount, setCopAmount] = useState('');
  const [ecopAmount, setEcopAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  const canAccess = hasPassportNFT || hasActivePassport || hasLPsNFT || hasVaultsNFT;

  // Fetch exchange rate
  useEffect(() => {
    fetch('/api/exchange-rate/usdcop')
      .then(res => res.json())
      .then(data => setExchangeRate(data.rate))
      .catch(() => setExchangeRate(4200)); // Fallback rate
  }, []);

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

  const handleCopChange = (value: string) => {
    setCopAmount(value);
    if (value && exchangeRate) {
      // COP to ECOP is 1:1
      setEcopAmount(value);
    } else {
      setEcopAmount('');
    }
  };

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <CurrencyDollarIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to access monetization</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!canAccess) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="card p-8 text-center">
              <LockClosedIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h2 className="text-2xl font-bold text-white mb-2">Tier 1 Required</h2>
              <p className="text-gray-400 mb-6">
                You need at least a CONVEXO PASSPORT (Tier 1) to access monetization features.
              </p>
              <Link href="/digital-id/humanity">
                <button className="btn-primary">Get Verified</button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/treasury" className="text-gray-400 hover:text-white">Treasury</Link>
              <span className="text-gray-600">/</span>
              <span className="text-white">Monetization</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Monetization</h1>
            <p className="text-gray-400">Convert between COP (Colombian Peso) and ECOP stablecoin</p>
          </div>

          {/* Exchange Rate Banner */}
          <div className="card bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border-emerald-700/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Current Exchange Rate</p>
                <p className="text-3xl font-bold text-white">
                  1 USD = {exchangeRate?.toLocaleString() || '...'} COP
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm mb-1">ECOP Peg</p>
                <p className="text-xl font-semibold text-emerald-400">1 ECOP = 1 COP</p>
              </div>
            </div>
          </div>

          {/* Balances */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-5">
              <p className="text-gray-400 text-sm mb-1">USDC Balance</p>
              <p className="text-2xl font-bold text-white">
                ${usdcBalance ? parseFloat(formatUnits(usdcBalance as bigint, 6)).toLocaleString() : '0.00'}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-gray-400 text-sm mb-1">ECOP Balance</p>
              <p className="text-2xl font-bold text-emerald-400">
                {ecopBalance ? parseFloat(formatUnits(ecopBalance as bigint, 18)).toLocaleString() : '0'} ECOP
              </p>
            </div>
          </div>

          {/* Conversion Form */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-6">Convert COP to ECOP</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount in COP</label>
                <div className="relative">
                  <input
                    type="number"
                    value={copAmount}
                    onChange={(e) => handleCopChange(e.target.value)}
                    placeholder="0.00"
                    className="input pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    COP
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-gray-800">
                  <ArrowsRightLeftIcon className="w-6 h-6 text-gray-400 rotate-90" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">You will receive</label>
                <div className="relative">
                  <input
                    type="number"
                    value={ecopAmount}
                    readOnly
                    placeholder="0.00"
                    className="input pr-16 bg-gray-800"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 font-medium">
                    ECOP
                  </span>
                </div>
              </div>

              <button className="btn-primary w-full" disabled={!copAmount}>
                Request Conversion
              </button>
            </div>

            <div className="mt-6 p-4 bg-gray-800/50 rounded-xl">
              <p className="text-sm text-gray-400">
                <strong>How it works:</strong> Submit a conversion request with your bank transfer details. 
                Once we receive your COP, ECOP will be minted to your wallet at a 1:1 ratio.
              </p>
            </div>
          </div>

          {/* Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/treasury/fiat-to-stable">
              <div className="card-interactive p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-900/30">
                    <BanknotesIcon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Fiat to Stable</p>
                    <p className="text-sm text-gray-400">Bank transfer to USDC</p>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/treasury/swaps">
              <div className="card-interactive p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-purple-900/30">
                    <ArrowsRightLeftIcon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Token Swaps</p>
                    <p className="text-sm text-gray-400">ECOP/USDC pools</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


