'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance, useChainId, useReadContract, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { erc20Abi } from 'viem';
import DashboardLayout from '@/components/DashboardLayout';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { ecopAbi } from '@/lib/contracts/ecopAbi';
import {
  WalletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsRightLeftIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  QrCodeIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import QRCode from 'qrcode';

export default function WalletPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  // Modal states
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Send form states
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<'ETH' | 'USDC' | 'ECOP'>('USDC');

  // Price states
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [copRate, setCopRate] = useState<number | null>(null);

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

  // Fetch prices on mount
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // Fetch ETH price from CoinGecko
        const ethRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const ethData = await ethRes.json();
        setEthPrice(ethData.ethereum.usd);

        // Fetch USD/COP rate from exchange rate API
        const copRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const copData = await copRes.json();
        setCopRate(copData.rates.COP);
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Generate QR code when showing receive modal
  useEffect(() => {
    if (address && showReceiveModal) {
      QRCode.toDataURL(address, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }).then(setQrCodeUrl);
    }
  }, [address, showReceiveModal]);

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const calculateEthUsdValue = () => {
    if (!ethBalance?.value || !ethPrice) return '0.00';
    const ethAmount = parseFloat(formatUnits(ethBalance.value, 18));
    return (ethAmount * ethPrice).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const calculateEcopUsdValue = () => {
    if (!ecopBalance || !copRate) return '0.00';
    const ecopAmount = parseFloat(formatUnits(ecopBalance as bigint, 18));
    // ECOP is pegged 1:1 with COP, so convert COP to USD
    const usdValue = ecopAmount / copRate;
    return usdValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const calculateTotalPortfolioValue = () => {
    let total = 0;

    // Add USDC value
    if (usdcBalance) {
      total += parseFloat(formatUnits(usdcBalance as bigint, 6));
    }

    // Add ETH value
    if (ethBalance?.value && ethPrice) {
      const ethAmount = parseFloat(formatUnits(ethBalance.value, 18));
      total += ethAmount * ethPrice;
    }

    // Add ECOP value
    if (ecopBalance && copRate) {
      const ecopAmount = parseFloat(formatUnits(ecopBalance as bigint, 18));
      total += ecopAmount / copRate;
    }

    return total.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
              <button
                onClick={() => setShowReceiveModal(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <ArrowDownIcon className="w-4 h-4" />
                Receive
              </button>
              <button
                onClick={() => setShowSendModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <ArrowUpIcon className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>

          {/* Total Balance Card */}
          <div className="card bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-700/30">
            <p className="text-gray-400 text-sm mb-2">Total Portfolio Value</p>
            <p className="text-4xl font-bold text-white mb-4">
              ${calculateTotalPortfolioValue()}
              <span className="text-lg text-gray-400 ml-2">USD</span>
            </p>
            <p className="text-sm text-gray-500">
              Includes ETH, USDC, and ECOP balances converted to USD
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
                      {token.symbol === 'ETH' && ethPrice && token.balance && (
                        <p className="text-sm text-emerald-400">
                          ≈ ${calculateEthUsdValue()} USD
                        </p>
                      )}
                      {token.symbol === 'ECOP' && copRate && token.balance && (
                        <p className="text-sm text-emerald-400">
                          ≈ ${calculateEcopUsdValue()} USD
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

      {/* Receive Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Receive Funds</h2>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {qrCodeUrl && (
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white rounded-xl">
                  <img src={qrCodeUrl} alt="Wallet QR Code" className="w-64 h-64" />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Your Wallet Address</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-white text-sm font-mono break-all">{address}</p>
                  </div>
                  <button
                    onClick={copyAddress}
                    className="btn-secondary p-3"
                  >
                    {copied ? (
                      <CheckIcon className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ClipboardDocumentIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {copied && (
                  <p className="text-sm text-emerald-400 mt-2">Address copied to clipboard!</p>
                )}
              </div>

              <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <p className="text-sm text-gray-300">
                  Send only supported tokens (ETH, USDC, ECOP) to this address. Sending other tokens may result in permanent loss.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Send Funds</h2>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Select Token</label>
                <div className="grid grid-cols-3 gap-2">
                  {['ETH', 'USDC', 'ECOP'].map((token) => (
                    <button
                      key={token}
                      onClick={() => setSelectedToken(token as 'ETH' | 'USDC' | 'ECOP')}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedToken === token
                          ? 'border-purple-500 bg-purple-900/30'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <p className="font-medium text-white">{token}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Recipient Address</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sendTo}
                    onChange={(e) => setSendTo(e.target.value)}
                    placeholder="0x..."
                    className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      // QR Scanner functionality would go here
                      alert('QR Scanner feature coming soon! For now, paste the address manually.');
                    }}
                    className="btn-secondary p-3"
                    title="Scan QR Code"
                  >
                    <CameraIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Amount</label>
                <input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.000001"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                <p className="text-sm text-amber-400">
                  This is a basic send interface. For the full implementation, you'll need to integrate with the token contracts and handle transaction signing.
                </p>
              </div>

              <button
                onClick={() => {
                  alert('Send functionality will be implemented with proper contract integration.');
                }}
                disabled={!sendTo || !sendAmount}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send {selectedToken}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}


