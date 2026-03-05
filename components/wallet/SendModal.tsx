'use client';

import { useState, useCallback } from 'react';
import { formatUnits, isAddress, parseUnits } from 'viem';
import { base, mainnet } from 'wagmi/chains';
import {
  XMarkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  QrCodeIcon,
  ArrowUpIcon,
} from '@heroicons/react/24/outline';
import { TOKEN_METADATA, type TokenSymbol, type CoinGeckoMarketData } from '@/lib/config/tokens';
import { useSendToken } from '@/lib/hooks/useSendToken';
import { getBlockExplorerUrl } from '@/lib/contracts/addresses';
import { TokenLogo } from './TokenLogo';
import { QRScanner } from './QRScanner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBalance(balance: bigint | undefined, decimals: number, maxFrac = 6) {
  if (!balance) return '0';
  return parseFloat(formatUnits(balance, decimals)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxFrac,
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SEND_TOKENS: TokenSymbol[] = ['ETH', 'USDC', 'USDT', 'EURC', 'BTC'];
const SEND_CHAINS = [
  { id: base.id, label: 'Base', logo: '/chains/base_logo.svg', color: 'text-blue-300' },
  { id: mainnet.id, label: 'Ethereum', logo: '/chains/ethereum.png', color: 'text-indigo-300' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SendModalBalances {
  baseEth: bigint | undefined;
  ethEth: bigint | undefined;
  baseUsdc: bigint | undefined;
  baseUsdt: bigint | undefined;
  baseEurc: bigint | undefined;
  baseBtc: bigint | undefined;
  ethUsdc: bigint | undefined;
  ethUsdt: bigint | undefined;
  ethEurc: bigint | undefined;
  ethBtc: bigint | undefined;
}

interface SendModalProps {
  onClose: () => void;
  balances: SendModalBalances;
  marketData: Map<string, CoinGeckoMarketData>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SendModal({ onClose, balances, marketData }: SendModalProps) {
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>('USDC');
  const [selectedChain, setSelectedChain] = useState<number>(base.id);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [addrErr, setAddrErr] = useState<string | null>(null);

  const { send, isPending, isSuccess, txHash, error: sendError, reset } = useSendToken();

  // Get available balance for selected token+chain
  const getBalance = (): bigint | undefined => {
    const onBase = selectedChain === base.id;
    switch (selectedToken) {
      case 'ETH':  return onBase ? balances.baseEth : balances.ethEth;
      case 'USDC': return onBase ? balances.baseUsdc : balances.ethUsdc;
      case 'USDT': return onBase ? balances.baseUsdt : balances.ethUsdt;
      case 'EURC': return onBase ? balances.baseEurc : balances.ethEurc;
      case 'BTC':  return onBase ? balances.baseBtc : balances.ethBtc;
    }
  };

  const availableBal = getBalance();
  const meta = TOKEN_METADATA[selectedToken];
  const coin = marketData.get(meta.coingeckoId);
  const availableFmt = fmtBalance(availableBal, meta.decimals);

  const usdEquiv = (() => {
    if (!amount || !coin?.current_price) return null;
    try {
      const val = parseFloat(amount) * coin.current_price;
      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch {
      return null;
    }
  })();

  const handleMax = () => {
    if (!availableBal) return;
    setAmount(formatUnits(availableBal, meta.decimals));
  };

  const handleQrScan = useCallback((value: string) => {
    setShowScanner(false);
    const addr = value.replace(/^ethereum:/i, '').split('@')[0].split('?')[0];
    setToAddress(addr);
    if (isAddress(addr)) setAddrErr(null);
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setToAddress(text.trim());
      setAddrErr(null);
    } catch {
      /* clipboard denied */
    }
  };

  const handleSend = async () => {
    if (!isAddress(toAddress)) {
      setAddrErr('Invalid Ethereum address');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) return;

    if (availableBal) {
      try {
        const requested = parseUnits(amount, meta.decimals);
        if (requested > availableBal) {
          setAddrErr('Amount exceeds available balance');
          return;
        }
      } catch {
        setAddrErr('Invalid amount');
        return;
      }
    }

    setAddrErr(null);
    await send({
      token: selectedToken,
      chainId: selectedChain,
      to: toAddress as `0x${string}`,
      amount,
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const explorerBase = getBlockExplorerUrl(selectedChain);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Send</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {isSuccess && txHash ? (
          /* ── Success state ── */
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckIcon className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Transaction sent!</p>
              <p className="text-gray-400 text-sm mt-1">Your tokens are on the way.</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Transaction hash</p>
              <p className="text-xs text-gray-300 font-mono break-all">{txHash}</p>
            </div>
            {explorerBase && (
              <a
                href={`${explorerBase}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 text-sm underline"
              >
                View on explorer →
              </a>
            )}
            <button onClick={handleClose} className="btn-primary w-full">
              Done
            </button>
          </div>
        ) : (
          <>
            {/* ── Token selector ── */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Token</label>
              <div className="grid grid-cols-4 gap-2">
                {SEND_TOKENS.map((tok) => {
                  const c = marketData.get(TOKEN_METADATA[tok].coingeckoId);
                  return (
                    <button
                      key={tok}
                      onClick={() => setSelectedToken(tok)}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-colors ${
                        selectedToken === tok
                          ? 'border-purple-500 bg-purple-900/30'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <TokenLogo image={c?.image} symbol={tok} size={28} />
                      <span className="text-xs font-medium text-white">{tok}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Chain selector ── */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Network</label>
              <div className="grid grid-cols-2 gap-2">
                {SEND_CHAINS.map(({ id, label, logo, color }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedChain(id)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-colors ${
                      selectedChain === id
                        ? 'border-purple-500 bg-purple-900/30'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <img src={logo} alt={label} className="w-4 h-4 rounded-full object-contain shrink-0" />
                    <span className={`text-sm font-medium ${selectedChain === id ? 'text-white' : color}`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Available:{' '}
                <span className="text-gray-300">{availableFmt} {selectedToken}</span>
              </p>
            </div>

            {/* ── Recipient address ── */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Recipient</label>
              {showScanner ? (
                <QRScanner onScan={handleQrScan} onClose={() => setShowScanner(false)} />
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={toAddress}
                      onChange={(e) => {
                        setToAddress(e.target.value);
                        setAddrErr(null);
                      }}
                      placeholder="0x..."
                      className={`flex-1 px-3 py-2.5 bg-white/5 border rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none transition-colors ${
                        addrErr ? 'border-red-500/60' : 'border-white/10 focus:border-purple-500'
                      }`}
                    />
                    <button
                      onClick={handlePaste}
                      className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/20 transition-colors text-xs"
                      title="Paste"
                    >
                      <ClipboardDocumentIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowScanner(true)}
                      className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                      title="Scan QR code"
                    >
                      <QrCodeIcon className="w-4 h-4" />
                    </button>
                  </div>
                  {addrErr && <p className="text-xs text-red-400">{addrErr}</p>}
                </div>
              )}
            </div>

            {/* ── Amount ── */}
            {!showScanner && (
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="any"
                    min="0"
                    className="w-full px-3 py-2.5 pr-16 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <button
                    onClick={handleMax}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    MAX
                  </button>
                </div>
                {usdEquiv && (
                  <p className="text-xs text-gray-500 mt-1">≈ ${usdEquiv} USD</p>
                )}
              </div>
            )}

            {/* ── Error from hook ── */}
            {sendError && (
              <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-xl text-xs text-red-400 break-words">
                {sendError}
              </div>
            )}

            {/* ── Send button ── */}
            {!showScanner && (
              <button
                onClick={handleSend}
                disabled={isPending || !toAddress || !amount || parseFloat(amount) <= 0}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  <>
                    <ArrowUpIcon className="w-4 h-4" />
                    Send {selectedToken}
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
