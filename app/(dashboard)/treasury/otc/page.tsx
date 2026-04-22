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

// Fixed rate for USDC/USDT vs USD and ECOP vs COP
const FIXED_RATE = 0.9994;
// +1% fee applied to live USD/COP rate for USDC and USDT vs COP
const COP_FEE = 1.01;

// Convexo's payment details shown when user is buying crypto
const CONVEXO_BANK = {
  bankName: 'Bancolombia',
  accountNumber: '******************',
  accountType: 'Savings',
  holderName: 'Convexo Protocol SAS',
  note: 'Contact us via WhatsApp or Telegram to receive payment instructions.',
};

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

  // ECOP is always traded against COP
  useEffect(() => {
    if (digitalAsset === 'ECOP') setFiatCurrency('COP');
  }, [digitalAsset]);

  // Fetch live USD/COP rate from internal Next.js route (has fallback)
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

  // Load user's bank accounts for sell payment method
  useEffect(() => {
    if (!isConnected) return;
    apiFetch<{ items: BankAccount[] }>('/bank-accounts')
      .then(data => {
        const items = data.items ?? [];
        setBankAccounts(items);
        const def = items.find(a => a.isDefault);
        if (def) setSelectedAccountId(def.id);
        else if (items.length > 0) setSelectedAccountId(items[0].id);
      })
      .catch(() => {});
  }, [isConnected]);

  // Rate logic:
  // USDC/USDT vs USD → 0.9994 (fixed)
  // ECOP vs COP      → 0.9994 (fixed)
  // USDC/USDT vs COP → live USD/COP × 1.01
  const getRate = (): number | null => {
    if (fiatCurrency === 'USD') return FIXED_RATE;
    if (digitalAsset === 'ECOP') return FIXED_RATE;
    return liveUSDCOP ? liveUSDCOP * COP_FEE : null;
  };

  const rate = getRate();
  const parsedAmount = assetAmount ? parseFloat(assetAmount) : 0;
  const estimatedFiat = rate && parsedAmount > 0 ? parsedAmount * rate : null;

  const formatFiat = (amount: number) =>
    fiatCurrency === 'COP'
      ? `${amount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} COP`
      : `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USD`;

  const formatRate = (r: number) =>
    fiatCurrency === 'COP'
      ? `1 ${digitalAsset} = ${r.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} COP`
      : `1 ${digitalAsset} = ${r.toFixed(4)} USD`;

  const selectedAccount = bankAccounts.find(a => a.id === selectedAccountId);

  const generateOrderMessage = () => {
    let msg = `🔄 *NEW OTC ORDER — ${orderType.toUpperCase()}*\n\n`;

    msg += `💱 *ORDER DETAILS*\n`;
    msg += `Type: ${orderType === 'buy' ? '🟢 BUY (receive crypto)' : '🔴 SELL (receive fiat)'}\n`;
    msg += `Asset: ${assetAmount || '—'} ${digitalAsset}\n`;
    msg += `Fiat: ${fiatCurrency}\n`;
    msg += `Rate: ${rate ? formatRate(rate) : 'Rate unavailable'}\n`;
    if (estimatedFiat) {
      msg += `Estimated ${fiatCurrency}: ${formatFiat(estimatedFiat)}\n`;
    }
    msg += `🕐 Time: ${new Date().toISOString()}\n\n`;

    msg += `👛 *WALLET*\n`;
    msg += `Address: ${address || '—'}\n\n`;

    if (orderType === 'sell' && selectedAccount) {
      msg += `🏦 *RECEIVING BANK ACCOUNT (send ${fiatCurrency} here)*\n`;
      msg += `Bank: ${selectedAccount.bankName}\n`;
      msg += `Account: ${selectedAccount.accountNumber}\n`;
      msg += `Type: ${selectedAccount.accountType}\n`;
      if (selectedAccount.holderName) msg += `Holder: ${selectedAccount.holderName}\n`;
      msg += `Label: ${selectedAccount.accountName}\n`;
    } else if (orderType === 'buy') {
      msg += `🏦 *SEND PAYMENT TO (Convexo)*\n`;
      msg += `Bank: ${CONVEXO_BANK.bankName}\n`;
      msg += `Holder: ${CONVEXO_BANK.holderName}\n`;
      msg += `Note: ${CONVEXO_BANK.note}\n`;
    }

    return msg;
  };

  const isFormValid = () => {
    if (!assetAmount || parseFloat(assetAmount) <= 0) return false;
    if (orderType === 'sell' && !selectedAccountId) return false;
    return true;
  };

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

        {/* Live Rate Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 rounded-xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200 mb-1 flex items-center gap-2">
                Live USD/COP Rate
                {isLoadingRate && <span className="inline-block w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />}
              </p>
              {liveUSDCOP ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-lg">1 USD =</span>
                  <span className="text-4xl font-bold">
                    {liveUSDCOP.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-lg">COP</span>
                </div>
              ) : (
                <div className="h-10 w-48 bg-white/20 rounded animate-pulse" />
              )}
              <p className="text-xs text-blue-200 mt-2">
                USDC / USDT vs USD: <span className="font-semibold">0.9994</span>
                &nbsp;·&nbsp;
                ECOP vs COP: <span className="font-semibold">0.9994</span>
              </p>
            </div>
            <div className="hidden md:flex p-4 bg-white/10 rounded-xl">
              <ArrowsRightLeftIcon className="w-12 h-12" />
            </div>
          </div>
        </div>

        {/* Order Form */}
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
                <p className="font-semibold text-white">Buy</p>
                <p className="text-xs text-gray-400 mt-0.5">Pay fiat, receive crypto</p>
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
                <p className="font-semibold text-white">Sell</p>
                <p className="text-xs text-gray-400 mt-0.5">Send crypto, receive fiat</p>
              </button>
            </div>
          </div>

          {/* Asset + Fiat selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Digital Asset</label>
              <select
                value={digitalAsset}
                onChange={e => setDigitalAsset(e.target.value as DigitalAsset)}
                className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
                <option value="ECOP">ECOP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Fiat Currency</label>
              <select
                value={fiatCurrency}
                onChange={e => setFiatCurrency(e.target.value as FiatCurrency)}
                disabled={digitalAsset === 'ECOP'}
                className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:outline-none disabled:opacity-50"
              >
                <option value="USD">USD</option>
                <option value="COP">COP</option>
              </select>
              {digitalAsset === 'ECOP' && (
                <p className="text-xs text-gray-500 mt-1">ECOP only trades against COP</p>
              )}
            </div>
          </div>

          {/* Asset Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Amount ({digitalAsset})
            </label>
            <div className="relative">
              <input
                type="number"
                value={assetAmount}
                onChange={e => setAssetAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-4 py-4 pr-20 bg-gray-800 border border-gray-700 rounded-xl text-white text-2xl font-semibold focus:border-purple-500 focus:outline-none placeholder-gray-600"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                {digitalAsset}
              </span>
            </div>
          </div>

          {/* Rate + Estimated Fiat */}
          {parsedAmount > 0 && (
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
                    {orderType === 'buy' ? 'You Pay' : 'You Send'}
                  </p>
                  <p className="text-xl font-bold text-white">
                    {orderType === 'buy'
                      ? estimatedFiat ? formatFiat(estimatedFiat) : '—'
                      : `${parsedAmount.toLocaleString()} ${digitalAsset}`}
                  </p>
                </div>
                <ArrowsRightLeftIcon className="w-5 h-5 text-gray-500" />
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">You Receive</p>
                  <p className="text-xl font-bold text-emerald-400">
                    {orderType === 'buy'
                      ? `${parsedAmount.toLocaleString()} ${digitalAsset}`
                      : estimatedFiat ? formatFiat(estimatedFiat) : '—'}
                  </p>
                </div>
              </div>
              {rate ? (
                <div className="border-t border-gray-700 pt-3 flex justify-between text-sm text-gray-400">
                  <span>
                    Rate
                    {fiatCurrency === 'COP' && digitalAsset !== 'ECOP' && ' (live + 1%)'}
                    {fiatCurrency === 'USD' && ' (fixed)'}
                    {digitalAsset === 'ECOP' && ' (fixed)'}
                  </span>
                  <span className="text-white font-medium">{formatRate(rate)}</span>
                </div>
              ) : (
                <div className="border-t border-gray-700 pt-3 text-sm text-yellow-400">
                  Loading live rate…
                </div>
              )}
            </div>
          )}

          {/* Payment Method */}
          <div className="border-t border-gray-700 pt-6 space-y-4">
            <p className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Payment Method
            </p>

            {orderType === 'sell' ? (
              /* Sell: user picks their saved bank account */
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Select your bank account <span className="text-red-400">*</span>
                </label>
                {bankAccounts.length > 0 ? (
                  <select
                    value={selectedAccountId}
                    onChange={e => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                  >
                    {bankAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName} — {acc.accountName} ({acc.accountNumber})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                    <BuildingLibraryIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-300">No bank accounts found</p>
                      <a href="/profile/bank-accounts" className="text-xs text-purple-400 hover:text-purple-300">
                        Add a bank account in your profile →
                      </a>
                    </div>
                  </div>
                )}
                {selectedAccount && (
                  <div className="mt-3 p-3 bg-gray-800/40 rounded-lg text-sm space-y-1 text-gray-300">
                    <p><span className="text-gray-500">Bank:</span> {selectedAccount.bankName}</p>
                    <p><span className="text-gray-500">Account:</span> {selectedAccount.accountNumber}</p>
                    <p><span className="text-gray-500">Type:</span> {selectedAccount.accountType}</p>
                    {selectedAccount.holderName && (
                      <p><span className="text-gray-500">Holder:</span> {selectedAccount.holderName}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Buy: show Convexo's payment info */
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl space-y-2 text-sm">
                <p className="text-gray-300 font-medium mb-3">Send your payment to Convexo:</p>
                <p><span className="text-gray-500">Bank:</span> <span className="text-white">{CONVEXO_BANK.bankName}</span></p>
                <p><span className="text-gray-500">Holder:</span> <span className="text-white">{CONVEXO_BANK.holderName}</span></p>
                <p className="text-xs text-yellow-400 pt-1">{CONVEXO_BANK.note}</p>
              </div>
            )}
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
              {orderType === 'sell' && bankAccounts.length === 0
                ? 'Add a bank account to your profile to place a sell order'
                : 'Enter an amount to generate your order'}
            </p>
          )}

        </div>
      </div>
    </div>
  );
}
