'use client';

import { useAccount, useBalance, useChainId, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { erc20Abi } from 'viem';
import DashboardLayout from '@/components/DashboardLayout';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { ecopAbi } from '@/lib/contracts/ecopAbi';
import {
  WalletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function WalletPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data: ethBalance, isLoading: isLoadingEth } = useBalance({ address });
  
  const { data: usdcBalance, isLoading: isLoadingUsdc } = useReadContract({
    address: contracts?.USDC,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  const { data: ecopBalance, isLoading: isLoadingEcop } = useReadContract({
    address: contracts?.ECOP,
    abi: ecopAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts && contracts.ECOP !== '0x0000000000000000000000000000000000000000' },
  });

  const tokens = [
    {
      name: 'Ethereum',
      symbol: 'ETH',
      balance: ethBalance?.value,
      decimals: 18,
      isLoading: isLoadingEth,
      color: 'from-blue-500 to-purple-500',
      icon: '⟠',
      usdValue: null, // Would need price oracle
    },
    {
      name: 'USD Coin',
      symbol: 'USDC',
      balance: usdcBalance as bigint | undefined,
      decimals: 6,
      isLoading: isLoadingUsdc,
      color: 'from-blue-400 to-cyan-400',
      icon: '$',
      usdValue: usdcBalance ? formatUnits(usdcBalance as bigint, 6) : '0',
    },
    {
      name: 'Electronic COP',
      symbol: 'ECOP',
      balance: ecopBalance as bigint | undefined,
      decimals: 18,
      isLoading: isLoadingEcop,
      color: 'from-emerald-400 to-teal-400',
      icon: '₱',
      usdValue: null,
      disabled: contracts?.ECOP === '0x0000000000000000000000000000000000000000',
    },
  ];

  const formatBalance = (balance: bigint | undefined, decimals: number) => {
    if (!balance) return '0.00';
    const formatted = parseFloat(formatUnits(balance, decimals));
    return formatted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <WalletIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to view your balances</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Wallet</h1>
              <p className="text-gray-400">View and manage your token balances</p>
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary flex items-center gap-2">
                <ArrowDownIcon className="w-4 h-4" />
                Receive
              </button>
              <button className="btn-primary flex items-center gap-2">
                <ArrowUpIcon className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>

          {/* Total Balance Card */}
          <div className="card bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-700/30">
            <p className="text-gray-400 text-sm mb-2">Total Portfolio Value</p>
            <p className="text-4xl font-bold text-white mb-4">
              ${usdcBalance ? parseFloat(formatUnits(usdcBalance as bigint, 6)).toLocaleString() : '0.00'}
              <span className="text-lg text-gray-400 ml-2">USD</span>
            </p>
            <p className="text-sm text-gray-500">
              * Only USDC value shown. ETH and ECOP values require price oracles.
            </p>
          </div>

          {/* Token List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Your Tokens</h2>
            
            {tokens.filter(t => !t.disabled).map((token) => (
              <div
                key={token.symbol}
                className="card p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${token.color} flex items-center justify-center text-white text-xl font-bold`}>
                    {token.icon}
                  </div>
                  <div>
                    <p className="font-medium text-white">{token.name}</p>
                    <p className="text-sm text-gray-400">{token.symbol}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  {token.isLoading ? (
                    <div className="animate-pulse">
                      <div className="h-6 w-24 bg-gray-700 rounded mb-1" />
                      <div className="h-4 w-16 bg-gray-700 rounded ml-auto" />
                    </div>
                  ) : (
                    <>
                      <p className="text-xl font-semibold text-white">
                        {formatBalance(token.balance, token.decimals)} {token.symbol}
                      </p>
                      {token.symbol === 'USDC' && token.balance && (
                        <p className="text-sm text-emerald-400">
                          ≈ ${parseFloat(formatUnits(token.balance, token.decimals)).toLocaleString()} USD
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/treasury/swaps" className="card-interactive p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-900/30">
                  <ArrowsRightLeftIcon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Swap Tokens</p>
                  <p className="text-sm text-gray-400">Exchange between USDC, ECOP</p>
                </div>
              </div>
            </Link>
            <Link href="/treasury/monetization" className="card-interactive p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-900/30">
                  <WalletIcon className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Monetization</p>
                  <p className="text-sm text-gray-400">Convert COP to ECOP</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


