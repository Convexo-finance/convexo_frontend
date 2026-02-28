'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from '@/lib/wagmi/compat';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import {
  ArrowsRightLeftIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

type OrderType = 'buy' | 'sell';

interface USDCOPRate {
  rate: number;
  timestamp: number;
}

export default function OTCPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { hasPassportNFT } = useNFTBalance();

  const [orderType, setOrderType] = useState<OrderType>('buy');
  const [amount, setAmount] = useState('');
  const [usdcopRate, setUsdcopRate] = useState<USDCOPRate | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  // Payment method fields (both buy & sell)
  const [walletAddress, setWalletAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [accountType, setAccountType] = useState<'savings' | 'checking'>('savings');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userTelegram, setUserTelegram] = useState('');

  useEffect(() => {
    if (address) setWalletAddress(address);
  }, [address]);

  useEffect(() => {
    fetchUSDCOPRate();
    const interval = setInterval(fetchUSDCOPRate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchUSDCOPRate = async () => {
    setIsLoadingRate(true);
    try {
      const response = await fetch('/api/exchange-rate/usdcop');
      const data = await response.json();
      setUsdcopRate({ rate: data.rate, timestamp: data.timestamp });
    } catch {
      setUsdcopRate({ rate: 4350.50, timestamp: Date.now() });
    } finally {
      setIsLoadingRate(false);
    }
  };

  const calculateFinalRate = (baseRate: number, type: OrderType) => {
    const spread = 1.5;
    return type === 'buy' ? baseRate * (1 + spread / 100) : baseRate * (1 - spread / 100);
  };

  const calculateTotal = () => {
    if (!amount || !usdcopRate) return 0;
    return parseFloat(amount) * calculateFinalRate(usdcopRate.rate, orderType);
  };

  const generateOrderMessage = () => {
    const finalRate = usdcopRate ? calculateFinalRate(usdcopRate.rate, orderType) : 0;
    const total = calculateTotal();
    const chainName =
      chainId === 8453 ? 'Base Mainnet' :
      chainId === 1 ? 'Ethereum Mainnet' :
      chainId === 130 ? 'Unichain Mainnet' : `Chain ${chainId}`;

    let msg = `🔄 *NEW OTC ORDER — ${orderType.toUpperCase()}*\n\n`;
    msg += `💱 Amount: *${amount} USDC*\n`;
    msg += `📊 Rate: 1 USD = ${finalRate.toFixed(2)} COP (1.5% spread)\n`;
    msg += `💵 Total: *${total.toLocaleString('es-CO', { minimumFractionDigits: 2 })} COP*\n`;
    msg += `🔗 Chain: ${chainName}\n`;
    msg += `🕐 Time: ${new Date().toISOString()}\n\n`;

    msg += `💳 *PAYMENT METHOD*\n`;
    msg += `Bank: ${bankName || '—'}\n`;
    msg += `Account #: ${bankAccount || '—'}\n`;
    msg += `Type: ${accountType === 'savings' ? 'Savings' : 'Checking'}\n`;
    if (userEmail) msg += `Email: ${userEmail}\n`;
    if (userPhone) msg += `Phone: ${userPhone}\n`;
    if (userTelegram) msg += `Telegram: @${userTelegram.replace(/^@/, '')}\n`;

    msg += `\n👛 *WALLET*\n`;
    msg += `Address: ${walletAddress}`;

    return msg;
  };

  const isFormValid = () =>
    !!amount && parseFloat(amount) > 0 && !!bankName && !!bankAccount;

  const sendViaWhatsApp = () => {
    const url = `https://wa.me/573186766035?text=${encodeURIComponent(generateOrderMessage())}`;
    window.open(url, '_blank');
  };

  const sendViaTelegram = () => {
    const url = `https://t.me/convexoprotocol?text=${encodeURIComponent(generateOrderMessage())}`;
    window.open(url, '_blank');
  };

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Please connect your wallet to access OTC services</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasPassportNFT) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Identity Verification Required</h2>
            <p className="text-gray-400 mb-4">You need a Convexo Passport to access Treasury services.</p>
            <a href="/digital-id/humanity/verify" className="btn-primary inline-block">
              Get Verified with ZKPassport
            </a>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white">OTC Trading</h1>
            <p className="mt-1 text-gray-400">Buy or sell USDC with COP at competitive rates</p>
          </div>

          {/* Live Rate Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 rounded-xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200 mb-1 flex items-center gap-2">
                  Live Exchange Rate
                  {isLoadingRate && <span className="inline-block w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />}
                </p>
                {usdcopRate ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg">1 USD =</span>
                    <span className="text-4xl font-bold">
                      {usdcopRate.rate.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-lg">COP</span>
                  </div>
                ) : (
                  <div className="h-10 w-48 bg-white/20 rounded animate-pulse" />
                )}
                {usdcopRate && (
                  <p className="text-xs text-blue-200 mt-1">
                    Updated {new Date(usdcopRate.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              <div className="hidden md:flex p-4 bg-white/10 rounded-xl">
                <ArrowsRightLeftIcon className="w-12 h-12" />
              </div>
            </div>
          </div>

          {/* Order Form Card */}
          <div className="card space-y-6">

            {/* Buy / Sell Toggle */}
            <div>
              <p className="text-sm font-medium text-gray-400 mb-3">Order Type</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setOrderType('buy')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    orderType === 'buy'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <BanknotesIcon className={`w-7 h-7 mb-2 ${orderType === 'buy' ? 'text-emerald-400' : 'text-gray-500'}`} />
                  <p className="font-semibold text-white">Buy USDC</p>
                  <p className="text-xs text-gray-400 mt-0.5">Pay with COP</p>
                </button>
                <button
                  onClick={() => setOrderType('sell')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    orderType === 'sell'
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <BanknotesIcon className={`w-7 h-7 mb-2 ${orderType === 'sell' ? 'text-red-400' : 'text-gray-500'}`} />
                  <p className="font-semibold text-white">Sell USDC</p>
                  <p className="text-xs text-gray-400 mt-0.5">Receive COP</p>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {orderType === 'buy' ? 'USDC Amount to Buy' : 'USDC Amount to Sell'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1000"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-4 pr-20 bg-gray-800 border border-gray-700 rounded-xl text-white text-2xl font-semibold focus:border-purple-500 focus:outline-none placeholder-gray-600"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">USDC</span>
              </div>
            </div>

            {/* Conversion Preview */}
            {amount && usdcopRate && parseFloat(amount) > 0 && (
              <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
                      {orderType === 'buy' ? 'You Pay' : 'You Send'}
                    </p>
                    <p className="text-xl font-bold text-white">
                      {orderType === 'buy'
                        ? `${calculateTotal().toLocaleString('es-CO', { minimumFractionDigits: 2 })} COP`
                        : `${parseFloat(amount).toLocaleString()} USDC`}
                    </p>
                  </div>
                  <ArrowsRightLeftIcon className="w-5 h-5 text-gray-500" />
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">You Receive</p>
                    <p className="text-xl font-bold text-emerald-400">
                      {orderType === 'buy'
                        ? `${parseFloat(amount).toLocaleString()} USDC`
                        : `${calculateTotal().toLocaleString('es-CO', { minimumFractionDigits: 2 })} COP`}
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-3 flex justify-between text-sm text-gray-400">
                  <span>Your rate (1.5% spread)</span>
                  <span className="text-white font-medium">
                    1 USD = {calculateFinalRate(usdcopRate.rate, orderType).toLocaleString('es-CO', { minimumFractionDigits: 2 })} COP
                  </span>
                </div>
              </div>
            )}

            {/* Payment Method Section */}
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-300 uppercase tracking-wider border-t border-gray-700 pt-4">
                Payment Method
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Bank Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Bancolombia"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Account Type <span className="text-red-400">*</span></label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as 'savings' | 'checking')}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="savings">Savings</option>
                    <option value="checking">Checking</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Bank Account Number <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="1234567890"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Email <span className="text-gray-600 text-xs">(optional)</span></label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Phone <span className="text-gray-600 text-xs">(optional)</span></label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="+57 300 000 0000"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Telegram Username <span className="text-gray-600 text-xs">(optional)</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                  <input
                    type="text"
                    value={userTelegram}
                    onChange={(e) => setUserTelegram(e.target.value.replace(/^@/, ''))}
                    placeholder="username"
                    className="w-full pl-7 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Receiving Wallet Address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Send via WhatsApp / Telegram */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={sendViaWhatsApp}
                disabled={!isFormValid()}
                className="flex items-center justify-center gap-3 py-4 rounded-xl bg-[#25D366]/10 border-2 border-[#25D366] hover:bg-[#25D366]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <DevicePhoneMobileIcon className="w-6 h-6 text-[#25D366]" />
                <div className="text-left">
                  <p className="font-semibold text-[#25D366]">WhatsApp</p>
                  <p className="text-xs text-gray-400">+57 318 676 6035</p>
                </div>
              </button>

              <button
                onClick={sendViaTelegram}
                disabled={!isFormValid()}
                className="flex items-center justify-center gap-3 py-4 rounded-xl bg-[#229ED9]/10 border-2 border-[#229ED9] hover:bg-[#229ED9]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-[#229ED9]" />
                <div className="text-left">
                  <p className="font-semibold text-[#229ED9]">Telegram</p>
                  <p className="text-xs text-gray-400">@convexoprotocol</p>
                </div>
              </button>
            </div>

            {!isFormValid() && (
              <p className="text-xs text-gray-500 text-center -mt-2">
                Fill in amount, bank name, and account number to send your order
              </p>
            )}

          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
