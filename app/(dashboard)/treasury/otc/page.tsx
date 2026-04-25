'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from '@/lib/wagmi/compat';
import { apiFetch } from '@/lib/api/client';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { getTxExplorerLink } from '@/lib/contracts/addresses';
import { useChainId } from '@/lib/wagmi/compat';
import {
  ArrowsRightLeftIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  ChatBubbleLeftRightIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type OrderType = 'BUY' | 'SELL';
type DigitalAsset = 'USDC' | 'USDT' | 'ECOP';
type FiatCurrency = 'USD' | 'COP';
type WizardStep = 1 | 2 | 3 | 4;

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

interface OTCOrder {
  id: string;
  orderId: string;
  orderType: 'BUY' | 'SELL';
  digitalAsset: string;
  fiatCurrency: string;
  assetAmount: number;
  estimatedFiat: number;
  rate: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  txHash?: string;
  createdAt: string;
  bankName?: string;
  bankAccount?: string;
}

const FIXED_RATE = 0.994;
const COP_FEE = 1.01;

function getOrderId(): string {
  return `OTC-${Date.now()}`;
}

const STATUS_STYLE: Record<OTCOrder['status'], string> = {
  PENDING:     'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  CONFIRMED:   'bg-blue-500/10 text-blue-400 border border-blue-500/30',
  IN_PROGRESS: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
  COMPLETED:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
  CANCELLED:   'bg-red-500/10 text-red-400 border border-red-500/30',
};

const STATUS_LABEL: Record<OTCOrder['status'], string> = {
  PENDING:     'Pending',
  CONFIRMED:   'Confirmed',
  IN_PROGRESS: 'In Progress',
  COMPLETED:   'Completed',
  CANCELLED:   'Cancelled',
};

const STEP_LABELS: Record<WizardStep, string> = {
  1: 'Order Type',
  2: 'Asset & Amount',
  3: 'Payment',
  4: 'Review',
};

export default function OTCPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { hasPassportNFT } = useNFTBalance();

  // ── Orders ─────────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<OTCOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // ── Wizard state ──────────────────────────────────────────────────────────
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>(1);

  // Step 1
  const [orderType, setOrderType] = useState<OrderType>('BUY');
  // Step 2
  const [digitalAsset, setDigitalAsset] = useState<DigitalAsset>('USDC');
  const [fiatCurrency, setFiatCurrency] = useState<FiatCurrency>('USD');
  const [assetAmount, setAssetAmount] = useState('');
  const [liveUSDCOP, setLiveUSDCOP] = useState<number | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  // Step 3
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  // Step 4
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const loadOrders = useCallback(() => {
    if (!isConnected) return;
    setLoadingOrders(true);
    apiFetch<{ items: OTCOrder[]; total: number }>('/otc/orders')
      .then(data => setOrders(data?.items ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [isConnected]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    if (!isConnected) return;
    apiFetch<{ items: BankAccount[] }>('/bank-accounts')
      .then(data => setBankAccounts(data?.items ?? []))
      .catch(() => {});
  }, [isConnected]);

  useEffect(() => {
    const fetchRate = async () => {
      setIsLoadingRate(true);
      try {
        const res = await fetch('/api/exchange-rate/usdcop');
        const data = await res.json();
        setLiveUSDCOP(data.rate);
      } catch { /* keep null */ } finally {
        setIsLoadingRate(false);
      }
    };
    fetchRate();
    const iv = setInterval(fetchRate, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (digitalAsset === 'ECOP') setFiatCurrency('COP');
  }, [digitalAsset]);

  useEffect(() => {
    const compatible = bankAccounts.filter(a => a.currency.toUpperCase() === fiatCurrency);
    const def = compatible.find(a => a.isDefault) ?? compatible[0];
    setSelectedAccountId(def?.id ?? '');
  }, [fiatCurrency, bankAccounts]);

  const getRate = (): number | null => {
    if (fiatCurrency === 'USD') return FIXED_RATE;
    if (digitalAsset === 'ECOP') return FIXED_RATE;
    return liveUSDCOP ? liveUSDCOP * COP_FEE : null;
  };

  const rate = getRate();
  const parsedAmount = assetAmount ? parseFloat(assetAmount) : 0;
  const estimatedFiat = rate && parsedAmount > 0 ? parsedAmount * rate : null;

  const compatibleAccounts = bankAccounts.filter(a => a.currency.toUpperCase() === fiatCurrency);
  const selectedAccount = compatibleAccounts.find(a => a.id === selectedAccountId);

  const rateLabel = fiatCurrency === 'USD' || digitalAsset === 'ECOP'
    ? 'Fixed rate'
    : 'Live rate + 1% fee';

  const formatFiat = (amount: number) =>
    fiatCurrency === 'COP'
      ? `${amount.toLocaleString('es-CO', { minimumFractionDigits: 2 })} COP`
      : `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USD`;

  // ── Wizard navigation ──────────────────────────────────────────────────────

  const openWizard = () => {
    setStep(1);
    setOrderType('BUY');
    setDigitalAsset('USDC');
    setFiatCurrency('USD');
    setAssetAmount('');
    setSubmitted(false);
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setSubmitted(false);
  };

  const canAdvance = (): boolean => {
    if (step === 1) return true;
    if (step === 2) return parsedAmount > 0 && !!estimatedFiat;
    if (step === 3) return orderType === 'BUY' || !!selectedAccountId;
    return true;
  };

  // ── Submit order ───────────────────────────────────────────────────────────

  const submitOrder = async (channel: 'whatsapp' | 'telegram') => {
    if (!estimatedFiat || !rate || isSubmitting) return;

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
      ...(orderType === 'SELL' && selectedAccount
        ? {
            bankName:     selectedAccount.bankName,
            bankAccount:  selectedAccount.accountNumber,
            accountType:  selectedAccount.accountType,
            holderName:   selectedAccount.holderName ?? undefined,
            accountLabel: selectedAccount.accountName,
          }
        : {}),
    };

    setIsSubmitting(true);
    try {
      // Persist to backend with auth — this is the fix for history not showing
      await apiFetch('/otc/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch { /* order still proceeds to chat */ } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }

    // Open WhatsApp or Telegram chat
    const msg = buildChatMessage(payload);
    const encoded = encodeURIComponent(msg);
    if (channel === 'whatsapp') {
      window.open(`https://wa.me/573186766035?text=${encoded}`, '_blank');
    } else {
      window.open(`https://t.me/convexoprotocol?text=${encoded}`, '_blank');
    }

    // Refresh order history after a brief delay
    setTimeout(loadOrders, 1500);
  };

  interface ChatPayload {
    orderId: string; orderType: OrderType; digitalAsset: string; fiatCurrency: string;
    assetAmount: number; estimatedFiat: number; rate: number; walletAddress: string;
    timestamp: string; bankName?: string; bankAccount?: string; accountType?: string;
    holderName?: string; accountLabel?: string;
  }

  function buildChatMessage(p: ChatPayload): string {
    const fiatStr = p.fiatCurrency === 'COP'
      ? `${p.estimatedFiat.toLocaleString('es-CO', { minimumFractionDigits: 2 })} COP`
      : `$${p.estimatedFiat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USD`;

    let msg = `🔄 *NEW OTC ORDER — ${p.orderType}*\n`;
    msg += `🆔 ID: ${p.orderId}\n\n`;
    msg += `💱 *ORDER*\n`;
    msg += `Asset: ${p.assetAmount} ${p.digitalAsset}\n`;
    msg += `Fiat: ${p.fiatCurrency}\n`;
    msg += `Rate: 1 ${p.digitalAsset} = ${p.rate} ${p.fiatCurrency} (${rateLabel})\n`;
    msg += `Estimated: ${fiatStr}\n\n`;
    msg += `👛 *WALLET*\n${p.walletAddress}\n\n`;

    if (p.orderType === 'SELL' && 'bankName' in p && p.bankName) {
      msg += `🏦 *DESTINATION BANK*\n`;
      msg += `Bank: ${p.bankName}\n`;
      msg += `Account: ${p.bankAccount}\n`;
      msg += `Type: ${p.accountType}\n`;
      if (p.holderName) msg += `Holder: ${p.holderName}\n`;
    } else {
      msg += `💰 *PAYMENT*\nI will send ${fiatStr} to Convexo's bank account.`;
    }

    return msg;
  }

  // ── Guards ─────────────────────────────────────────────────────────────────

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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">OTC Trading</h1>
          <p className="mt-1 text-gray-400">Buy or sell digital assets at competitive rates</p>
        </div>

        {/* Rate Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 rounded-xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24" />
          <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-blue-200 mb-2 flex items-center gap-2">
                Live USD/COP Reference
                {isLoadingRate && (
                  <span className="inline-block w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                )}
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

        {/* Order History Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Order History
            </h2>
            {loadingOrders && (
              <div className="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            )}
          </div>

          {!loadingOrders && orders.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <ArrowsRightLeftIcon className="w-10 h-10 mx-auto mb-3 text-gray-600" />
              <p className="font-medium text-gray-400">No orders yet</p>
              <p className="text-sm mt-1">Your OTC order history will appear here once you place your first order.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 pr-4">Order ID</th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 pr-4">Type</th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 pr-4">Asset</th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 pr-4">Fiat</th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 pr-4">Status</th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 pr-4">Date</th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 pr-4 font-mono text-gray-400 text-xs">
                        {order.orderId ?? order.id.slice(0, 12)}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          order.orderType === 'BUY'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {order.orderType}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-white font-medium">
                        {order.assetAmount?.toLocaleString()} {order.digitalAsset}
                      </td>
                      <td className="py-3 pr-4 text-emerald-400 font-medium">
                        {order.fiatCurrency === 'COP'
                          ? `${order.estimatedFiat?.toLocaleString('es-CO', { minimumFractionDigits: 2 })} COP`
                          : `$${order.estimatedFiat?.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLE[order.status ?? 'PENDING']}`}>
                          {STATUS_LABEL[order.status ?? 'PENDING']}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td className="py-3">
                        {order.txHash && (
                          <a
                            href={getTxExplorerLink(chainId, order.txHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                          >
                            Tx <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Create Order button */}
          <div className="mt-6 pt-5 border-t border-gray-700/50">
            <button
              onClick={openWizard}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all"
            >
              <PlusIcon className="w-5 h-5" />
              Create Order
            </button>
          </div>
        </div>

      </div>

      {/* ── Wizard Modal ────────────────────────────────────────────────────── */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f1219] border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">

            {/* Wizard header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-700/50">
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Step {step} of 4 — {STEP_LABELS[step]}
                </p>
                <div className="flex gap-1.5">
                  {([1, 2, 3, 4] as WizardStep[]).map(s => (
                    <div
                      key={s}
                      className={`h-1 rounded-full transition-all ${
                        s <= step ? 'bg-purple-500 w-8' : 'bg-gray-700 w-4'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={closeWizard}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Wizard body */}
            <div className="px-6 py-6 space-y-5">

              {/* ── Step 1: Order Type ──────────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-white font-semibold">What would you like to do?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(['BUY', 'SELL'] as OrderType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setOrderType(type)}
                        className={`p-5 rounded-xl border-2 transition-all text-left ${
                          orderType === type
                            ? type === 'BUY'
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-red-500 bg-red-500/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <BanknotesIcon className={`w-7 h-7 mb-3 ${
                          orderType === type
                            ? type === 'BUY' ? 'text-emerald-400' : 'text-red-400'
                            : 'text-gray-500'
                        }`} />
                        <p className="font-bold text-white text-lg">{type}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {type === 'BUY' ? 'Pay fiat → receive crypto' : 'Send crypto → receive fiat'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 2: Asset & Amount ──────────────────────────────── */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-white font-semibold">What are you trading?</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Digital Asset</label>
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
                      <label className="block text-sm text-gray-400 mb-2">Fiat Currency</label>
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
                        <p className="text-xs text-gray-500 mt-1">ECOP only trades vs COP</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={assetAmount}
                        onChange={e => setAssetAmount(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-4 pr-24 bg-gray-800 border border-gray-700 rounded-xl text-white text-2xl font-semibold focus:border-purple-500 focus:outline-none placeholder-gray-600"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-lg">
                        {digitalAsset}
                      </span>
                    </div>
                  </div>

                  {estimatedFiat && rate && (
                    <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                            {orderType === 'BUY' ? 'You Pay' : 'You Send'}
                          </p>
                          <p className="text-xl font-bold text-white">
                            {orderType === 'BUY'
                              ? formatFiat(estimatedFiat)
                              : `${parsedAmount.toLocaleString()} ${digitalAsset}`}
                          </p>
                        </div>
                        <ArrowsRightLeftIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <div className="text-right">
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">You Receive</p>
                          <p className="text-xl font-bold text-emerald-400">
                            {orderType === 'BUY'
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
              )}

              {/* ── Step 3: Payment Method ──────────────────────────────── */}
              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-white font-semibold">Payment details</p>

                  {orderType === 'SELL' ? (
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Your {fiatCurrency} bank account <span className="text-red-400">*</span>
                      </label>
                      {compatibleAccounts.length > 0 ? (
                        <>
                          <div className="space-y-2">
                            {compatibleAccounts.map(acc => (
                              <button
                                key={acc.id}
                                onClick={() => setSelectedAccountId(acc.id)}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                                  selectedAccountId === acc.id
                                    ? 'border-purple-500 bg-purple-500/10'
                                    : 'border-gray-700 hover:border-gray-600'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-white">{acc.bankName}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{acc.accountName} · {acc.accountNumber}</p>
                                    <p className="text-xs text-gray-500">{acc.accountType}</p>
                                  </div>
                                  {acc.isDefault && (
                                    <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full">
                                      Default
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                          <a href="/profile" className="text-xs text-purple-400 hover:text-purple-300 mt-2 inline-block">
                            Manage bank accounts →
                          </a>
                        </>
                      ) : (
                        <div className="flex items-center gap-3 p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                          <BuildingLibraryIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-300">No {fiatCurrency} bank accounts saved</p>
                            <a href="/profile" className="text-xs text-purple-400 hover:text-purple-300">
                              Add a bank account in your profile →
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl space-y-2">
                      <p className="text-sm text-gray-300 font-medium">
                        You will send {fiatCurrency} to Convexo
                      </p>
                      <p className="text-xs text-yellow-400">
                        Our team will share payment instructions after you continue via WhatsApp or Telegram.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 4: Review & Submit ─────────────────────────────── */}
              {step === 4 && (
                <div className="space-y-4">
                  <p className="text-white font-semibold">Review your order</p>

                  <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                    <div className={`px-4 py-3 text-sm font-semibold ${
                      orderType === 'BUY' ? 'bg-emerald-600/20 text-emerald-300' : 'bg-red-600/20 text-red-300'
                    }`}>
                      {orderType === 'BUY' ? '🟢 Buy Order' : '🔴 Sell Order'} — {digitalAsset}/{fiatCurrency}
                    </div>
                    <div className="p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">{orderType === 'BUY' ? 'You receive' : 'You send'}</span>
                        <span className="text-white font-semibold">{parsedAmount.toLocaleString()} {digitalAsset}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{orderType === 'BUY' ? 'You pay' : 'You receive'}</span>
                        <span className="text-emerald-400 font-semibold">{estimatedFiat ? formatFiat(estimatedFiat) : '—'}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-800 pt-2">
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
                      {orderType === 'SELL' && selectedAccount && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Deposit to</span>
                          <span className="text-gray-300">{selectedAccount.bankName} · {selectedAccount.accountNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {submitted && (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm">
                      <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                      Order registered. Continue via WhatsApp or Telegram to confirm.
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Submitting will save your order and open a chat to complete the transaction.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => submitOrder('whatsapp')}
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366]/10 border-2 border-[#25D366] hover:bg-[#25D366]/20 transition-all disabled:opacity-50"
                    >
                      {isSubmitting
                        ? <span className="w-4 h-4 border-2 border-[#25D366] border-t-transparent rounded-full animate-spin" />
                        : <DevicePhoneMobileIcon className="w-4 h-4 text-[#25D366]" />
                      }
                      <div className="text-left">
                        <p className="text-sm font-semibold text-[#25D366]">WhatsApp</p>
                        <p className="text-xs text-gray-400">+57 318 676 6035</p>
                      </div>
                    </button>

                    <button
                      onClick={() => submitOrder('telegram')}
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#229ED9]/10 border-2 border-[#229ED9] hover:bg-[#229ED9]/20 transition-all disabled:opacity-50"
                    >
                      {isSubmitting
                        ? <span className="w-4 h-4 border-2 border-[#229ED9] border-t-transparent rounded-full animate-spin" />
                        : <ChatBubbleLeftRightIcon className="w-4 h-4 text-[#229ED9]" />
                      }
                      <div className="text-left">
                        <p className="text-sm font-semibold text-[#229ED9]">Telegram</p>
                        <p className="text-xs text-gray-400">@convexoprotocol</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Wizard footer — navigation */}
            <div className="flex items-center justify-between px-6 pb-5 pt-2 border-t border-gray-700/50">
              <button
                onClick={() => step === 1 ? closeWizard() : setStep((step - 1) as WizardStep)}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                {step === 1 ? 'Cancel' : 'Back'}
              </button>

              {step < 4 ? (
                <button
                  onClick={() => setStep((step + 1) as WizardStep)}
                  disabled={!canAdvance()}
                  className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              ) : (
                submitted ? (
                  <button
                    onClick={closeWizard}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all"
                  >
                    Done
                  </button>
                ) : null
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
