'use client';

import { useState, useEffect } from 'react';
import { useAccount } from '@/lib/wagmi/compat';
import { apiFetch } from '@/lib/api/client';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import {
  ArrowsRightLeftIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  ChatBubbleLeftRightIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

type OrderType = 'buy' | 'sell';
type DigitalAsset = 'USDC' | 'USDT' | 'ECOP';
type FiatCurrency = 'USD' | 'COP';

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  accountType: 'SAVINGS' | 'CHECKING' | 'BUSINESS';
  currency: string;
  holderName: string | null;
  isDefault: boolean;
}

// Rate: 1 unit of asset = RATE units of fiat
// USDC/USDT vs USD → 0.994 (fixed)
// ECOP vs COP      → 0.994 (fixed)
// USDC/USDT vs COP → live USD/COP × 1.01 (live + 1% fee)
const FIXED_RATE = 0.994;
const COP_FEE = 1.01;

function getOrderId(): string {
  return `OTC-${Date.now()}`;
}

export default function OTCPage() {
  const { address, isConnected } = useAccount();
  const { hasPassportNFT } = useNFTBalance();

  const [orderType, setOrderType] = useState<OrderType>('buy');
  const [digitalAsset, setDigitalAsset] = useState<DigitalAsset>('USDC');
  const [fiatCurrency, setFiatCurrency] = useState<FiatCurrency>('USD');
  const [assetAmount, setAssetAmount] = useState('');
  const [liveUSDCOP, setLiveUSDCOP] = useState<number | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ECOP only trades against COP
  useEffect(() => {
    if (digitalAsset === 'ECOP') setFiatCurrency('COP');
  }, [digitalAsset]);

  // Reset account selection when fiat changes
  useEffect(() => {
    const compatible = bankAccounts.filter(
      a => a.currency.toUpperCase() === fiatCurrency
    );
    const def = compatible.find(a => a.isDefault) ?? compatible[0];
    setSelectedAccountId(def?.id ?? '');
  }, [fiatCurrency, bankAccounts]);

  // Fetch live USD/COP rate
  useEffect(() => {
    const fetchRate = async () => {
      setIsLoadingRate(true);
      try {
        const res = await fetch('/api/exchange-rate/usdcop');
        const data = await res.json();
        setLiveUSDCOP(data.rate);
      } catch {
        // keep null
      } finally {
        setIsLoadingRate(false);
      }
    };
    fetchRate();
    const interval = setInterval(fetchRate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Load user's bank accounts
  useEffect(() => {
    if (!isConnected) return;
    apiFetch<{ items: BankAccount[] }>('/bank-accounts')
      .then(data => setBankAccounts(data.items ?? []))
      .catch(() => {});
  }, [isConnected]);

  // Rate calculation
  const getRate = (): number | null => {
    if (fiatCurrency === 'USD') return FIXED_RATE;
    if (digitalAsset === 'ECOP') return FIXED_RATE;
    return liveUSDCOP ? liveUSDCOP * COP_FEE : null;
  };

  const rate = getRate();
  const parsedAmount = assetAmount ? parseFloat(assetAmount) : 0;
  const estimatedFiat = rate && parsedAmount > 0 ? parsedAmount * rate : null;

  // Bank accounts compatible with the selected fiat currency
  const compatibleAccounts = bankAccounts.filter(
    a => a.currency.toUpperCase() === fiatCurrency
  );
  const selectedAccount = compatibleAccounts.find(a => a.id === selectedAccountId);

  const formatFiat = (amount: number) =>
    fiatCurrency === 'COP'
      ? `${amount.toLocaleString('es-CO', { minimumFractionDigits: 2 })} COP`
      : `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USD`;

  const rateLabel = (() => {
    if (fiatCurrency === 'USD') return 'Fixed rate';
    if (digitalAsset === 'ECOP') return 'Fixed rate';
    return 'Live rate + 1% fee';
  })();

  const isFormValid =
    parsedAmount > 0 && (orderType === 'buy' || !!selectedAccountId);

  // Submit: POST to internal API (triggers Telegram + email + backend), then open chat
  const submitOrder = async (channel: 'whatsapp' | 'telegram') => {
    if (!isFormValid || !estimatedFiat || !rate) return;

    const orderId = getOrderId();
    const payload = {
      orderId,
      orderType,
      digitalAsset,
      fiatCurrency,
      assetAmount: parsedAmount,
      estimatedFiat,
      rate,
      walletAddress: address ?? '',
      timestamp: new Date().toISOString(),
      ...(orderType === 'sell' && selectedAccount
        ? {
            bankName: selectedAccount.bankName,
            bankAccount: selectedAccount.accountNumber,
            accountType: selectedAccount.accountType,
            holderName: selectedAccount.holderName ?? undefined,
            accountLabel: selectedAccount.accountName,
          }
        : {}),
    };

    setIsSubmitting(true);
    try {
      await fetch('/api/otc/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // best-effort — still open the chat
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }

    const chatMessage = buildChatMessage(payload);
    const encoded = encodeURIComponent(chatMessage);
    if (channel === 'whatsapp') {
      window.open(`https://wa.me/573186766035?text=${encoded}`, '_blank');
    } else {
      window.open(`https://t.me/convexoprotocol?text=${encoded}`, '_blank');
    }
  };

  interface ChatPayload {
    orderId: string; orderType: OrderType; digitalAsset: string; fiatCurrency: string;
    assetAmount: number; estimatedFiat: number; rate: number; walletAddress: string;
    timestamp: string; bankName?: string; bankAccount?: string; accountType?: string;
    holderName?: string; accountLabel?: string;
  }

  function buildChatMessage(p: ChatPayload): string {
    const fiatStr =
      p.fiatCurrency === 'COP'
        ? `${p.estimatedFiat.toLocaleString('es-CO', { minimumFractionDigits: 2 })} COP`
        : `$${p.estimatedFiat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USD`;

    let msg = `🔄 *NEW OTC ORDER — ${p.orderType.toUpperCase()}*\n`;
    msg += `🆔 ID: ${p.orderId}\n\n`;

    msg += `💱 *ORDER*\n`;
    msg += `Asset: ${p.assetAmount} ${p.digitalAsset}\n`;
    msg += `Fiat: ${p.fiatCurrency}\n`;
    msg += `Rate: 1 ${p.digitalAsset} = ${p.rate} ${p.fiatCurrency} (${rateLabel})\n`;
    msg += `Estimated: ${fiatStr}\n`;
    msg += `Time: ${new Date(p.timestamp).toLocaleString()}\n\n`;

    msg += `👛 *WALLET*\n${p.walletAddress}\n\n`;

    if (p.orderType === 'sell' && p.bankName) {
      msg += `🏦 *DESTINATION BANK*\n`;
      msg += `Bank: ${p.bankName}\n`;
      msg += `Account: ${p.bankAccount}\n`;
      msg += `Type: ${p.accountType}\n`;
      if (p.holderName) msg += `Holder: ${p.holderName}\n`;
      if (p.accountLabel) msg += `Label: ${p.accountLabel}\n`;
    } else {
      msg += `💰 *PAYMENT*\nI will send ${fiatStr} to Convexo's bank account.\nPlease confirm details.`;
    }

    return msg;
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to access OTC services</p>
        </div>
      </div>
    );
  }

  if (!hasPassportNFT) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Identity Verification Required</h2>
          <p className="text-gray-400 mb-4">You need a Convexo Passport to access Treasury services.</p>
          <a href="/digital-id/humanity" className="btn-primary inline-block">
            Get Verified with ZKPassport
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">OTC Trading</h1>
          <p className="mt-1 text-gray-400">Buy or sell digital assets at competitive rates</p>
        </div>

        {/* Rate Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 rounded-xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-blue-200 mb-2 flex items-center gap-2">
                Live USD/COP Reference
                {isLoadingRate && <span className="inline-block w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />}
              </p>
              {liveUSDCOP ? (
                <p className="text-3xl font-bold">
                  1 USD = {liveUSDCOP.toLocaleString('es-CO', { minimumFractionDigits: 2 })} COP
                </p>
              ) : (
                <div className="h-8 w-48 bg-white/20 rounded animate-pulse" />
              )}
            </div>
            <div className="flex-shrink-0 text-right text-sm text-blue-200 space-y-1">
              <p>USDC · USDT · ECOP vs USD → <span className="text-white font-semibold">0.994</span></p>
              <p>ECOP vs COP → <span className="text-white font-semibold">0.994</span></p>
              <p>USDC · USDT vs COP → <span className="text-white font-semibold">live + 1%</span></p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card space-y-6">

          {/* Step 1 — Order type */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Step 1 — Order type</p>
            <div className="grid grid-cols-2 gap-3">
              {(['buy', 'sell'] as OrderType[]).map(type => (
                <button
                  key={type}
                  onClick={() => { setOrderType(type); setSubmitted(false); }}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    orderType === type
                      ? type === 'buy' ? 'border-emerald-500 bg-emerald-500/10' : 'border-red-500 bg-red-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <BanknotesIcon className={`w-6 h-6 mb-2 ${
                    orderType === type ? (type === 'buy' ? 'text-emerald-400' : 'text-red-400') : 'text-gray-500'
                  }`} />
                  <p className="font-semibold text-white capitalize">{type}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {type === 'buy' ? 'Pay fiat → receive crypto' : 'Send crypto → receive fiat'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 — Asset + Fiat */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Step 2 — What to trade</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Digital Asset</label>
                <select
                  value={digitalAsset}
                  onChange={e => { setDigitalAsset(e.target.value as DigitalAsset); setSubmitted(false); }}
                  className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                  <option value="ECOP">ECOP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Fiat Currency</label>
                <select
                  value={fiatCurrency}
                  onChange={e => { setFiatCurrency(e.target.value as FiatCurrency); setSubmitted(false); }}
                  disabled={digitalAsset === 'ECOP'}
                  className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:outline-none disabled:opacity-50"
                >
                  <option value="USD">USD</option>
                  <option value="COP">COP</option>
                </select>
                {digitalAsset === 'ECOP' && (
                  <p className="text-xs text-gray-500 mt-1">ECOP only trades vs COP</p>
                )}
              </div>
            </div>
          </div>

          {/* Step 3 — Amount */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Step 3 — Amount</p>
            <div className="relative">
              <input
                type="number"
                value={assetAmount}
                onChange={e => { setAssetAmount(e.target.value); setSubmitted(false); }}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-4 py-4 pr-24 bg-gray-800 border border-gray-700 rounded-xl text-white text-2xl font-semibold focus:border-purple-500 focus:outline-none placeholder-gray-600"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-lg">
                {digitalAsset}
              </span>
            </div>

            {/* Conversion preview */}
            {estimatedFiat && rate && (
              <div className="mt-3 bg-gray-800/60 border border-gray-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                      {orderType === 'buy' ? 'You Pay' : 'You Send'}
                    </p>
                    <p className="text-xl font-bold text-white">
                      {orderType === 'buy'
                        ? formatFiat(estimatedFiat)
                        : `${parsedAmount.toLocaleString()} ${digitalAsset}`}
                    </p>
                  </div>
                  <ArrowsRightLeftIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">You Receive</p>
                    <p className="text-xl font-bold text-emerald-400">
                      {orderType === 'buy'
                        ? `${parsedAmount.toLocaleString()} ${digitalAsset}`
                        : formatFiat(estimatedFiat)}
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-3 flex justify-between text-sm">
                  <span className="text-gray-500">{rateLabel}</span>
                  <span className="text-white font-medium">
                    1 {digitalAsset} = {fiatCurrency === 'COP'
                      ? rate.toLocaleString('es-CO', { minimumFractionDigits: 2 })
                      : rate.toFixed(4)} {fiatCurrency}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 4 — Payment method */}
          <div className="border-t border-gray-700 pt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Step 4 — Payment method</p>

            {orderType === 'sell' ? (
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Your {fiatCurrency} bank account <span className="text-red-400">*</span>
                </label>
                {compatibleAccounts.length > 0 ? (
                  <>
                    <select
                      value={selectedAccountId}
                      onChange={e => setSelectedAccountId(e.target.value)}
                      className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    >
                      {compatibleAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.bankName} — {acc.accountName}
                          {acc.isDefault ? ' (default)' : ''}
                        </option>
                      ))}
                    </select>
                    {selectedAccount && (
                      <div className="mt-3 p-3 bg-gray-800/40 rounded-lg text-sm grid grid-cols-2 gap-x-4 gap-y-1.5 text-gray-300">
                        <p><span className="text-gray-500">Bank</span><br />{selectedAccount.bankName}</p>
                        <p><span className="text-gray-500">Account</span><br />{selectedAccount.accountNumber}</p>
                        <p><span className="text-gray-500">Type</span><br />{selectedAccount.accountType}</p>
                        {selectedAccount.holderName && (
                          <p><span className="text-gray-500">Holder</span><br />{selectedAccount.holderName}</p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                    <BuildingLibraryIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-300">No {fiatCurrency} bank accounts saved</p>
                      <a href="/profile/bank-accounts" className="text-xs text-purple-400 hover:text-purple-300">
                        Add a bank account in your profile →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl text-sm space-y-1.5">
                <p className="text-gray-300 font-medium mb-2">You will send {fiatCurrency} to Convexo</p>
                <p className="text-xs text-yellow-400">
                  Our team will share payment instructions after you submit the order via WhatsApp or Telegram.
                </p>
              </div>
            )}
          </div>

          {/* Order review + submit */}
          {isFormValid && estimatedFiat && (
            <div className="border-t border-gray-700 pt-6 space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Summary</p>

              <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                <div className={`px-4 py-3 text-sm font-semibold ${orderType === 'buy' ? 'bg-emerald-600/20 text-emerald-300' : 'bg-red-600/20 text-red-300'}`}>
                  {orderType === 'buy' ? '🟢 Buy Order' : '🔴 Sell Order'} — {digitalAsset}/{fiatCurrency}
                </div>
                <div className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{orderType === 'buy' ? 'You receive' : 'You send'}</span>
                    <span className="text-white font-semibold">{parsedAmount.toLocaleString()} {digitalAsset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{orderType === 'buy' ? 'You pay' : 'You receive'}</span>
                    <span className="text-emerald-400 font-semibold">{formatFiat(estimatedFiat)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-800 pt-2 mt-2">
                    <span className="text-gray-500">Rate ({rateLabel})</span>
                    <span className="text-gray-300">
                      1 {digitalAsset} = {fiatCurrency === 'COP'
                        ? (rate ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })
                        : (rate ?? 0).toFixed(4)} {fiatCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Wallet</span>
                    <span className="text-gray-300 font-mono text-xs">
                      {address ? `${address.slice(0, 8)}…${address.slice(-6)}` : '—'}
                    </span>
                  </div>
                  {orderType === 'sell' && selectedAccount && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">To account</span>
                      <span className="text-gray-300">{selectedAccount.bankName} · {selectedAccount.accountNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {submitted && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <CheckCircleIcon className="w-5 h-5" />
                  Order registered. Continue via WhatsApp or Telegram to confirm.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => submitOrder('whatsapp')}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-3 py-4 rounded-xl bg-[#25D366]/10 border-2 border-[#25D366] hover:bg-[#25D366]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-[#25D366] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <DevicePhoneMobileIcon className="w-5 h-5 text-[#25D366]" />
                  )}
                  <div className="text-left">
                    <p className="font-semibold text-[#25D366]">WhatsApp</p>
                    <p className="text-xs text-gray-400">+57 318 676 6035</p>
                  </div>
                </button>

                <button
                  onClick={() => submitOrder('telegram')}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-3 py-4 rounded-xl bg-[#229ED9]/10 border-2 border-[#229ED9] hover:bg-[#229ED9]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-[#229ED9] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-[#229ED9]" />
                  )}
                  <div className="text-left">
                    <p className="font-semibold text-[#229ED9]">Telegram</p>
                    <p className="text-xs text-gray-400">@convexoprotocol</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {!isFormValid && (
            <p className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">
              {orderType === 'sell' && compatibleAccounts.length === 0
                ? `Add a ${fiatCurrency} bank account to your profile to place a sell order`
                : 'Complete the form above to generate your order'}
            </p>
          )}

        </div>
      </div>
    </div>
  );
}
