'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useBalance, useReadContracts } from '@/lib/wagmi/compat';
import { formatUnits, isAddress, parseUnits } from 'viem';
import { erc20Abi } from 'viem';
import { base, mainnet } from 'wagmi/chains';
import DashboardLayout from '@/components/DashboardLayout';
import {
  WalletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ChevronDownIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline';
import QRCode from 'qrcode';
import {
  TOKEN_ADDRESSES,
  TOKEN_METADATA,
  COINGECKO_IDS,
  type CoinGeckoMarketData,
  type TokenSymbol,
} from '@/lib/config/tokens';
import { useSendToken } from '@/lib/hooks/useSendToken';
import { getBlockExplorerUrl } from '@/lib/contracts/addresses';
import { SmartWalletActivationBanner } from '@/components/SmartWalletActivationBanner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBalance(balance: bigint | undefined, decimals: number, maxFrac = 6) {
  if (!balance) return '0';
  return parseFloat(formatUnits(balance, decimals)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxFrac,
  });
}

function toUsd(balance: bigint | undefined, decimals: number, price: number): string | null {
  if (!balance || !price) return null;
  const val = parseFloat(formatUnits(balance, decimals)) * price;
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Token logo ───────────────────────────────────────────────────────────────

const FALLBACK_GRADIENT: Record<string, string> = {
  ETH: 'from-indigo-500 to-purple-600',
  USDC: 'from-blue-400 to-cyan-500',
  USDT: 'from-emerald-400 to-teal-600',
  EURC: 'from-blue-600 to-blue-400',
};

function TokenLogo({ image, symbol, size = 40 }: { image?: string; symbol: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (image && !err) {
    return (
      <img
        src={image}
        alt={symbol}
        width={size}
        height={size}
        className="rounded-full"
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full bg-gradient-to-br ${FALLBACK_GRADIENT[symbol] ?? 'from-gray-500 to-gray-700'} flex items-center justify-center text-white font-bold text-sm shrink-0`}
    >
      {symbol[0]}
    </div>
  );
}

function PriceChange({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const up = pct >= 0;
  return (
    <span className={`text-xs font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(2)}%
    </span>
  );
}

// ─── QR Scanner ───────────────────────────────────────────────────────────────

function QRScanner({ onScan, onClose }: { onScan: (v: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanErr, setScanErr] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        if ('BarcodeDetector' in window) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          timer = setInterval(async () => {
            if (!videoRef.current) return;
            try {
              const results = await detector.detect(videoRef.current);
              if (results.length > 0) {
                clearInterval(timer);
                onScan(results[0].rawValue as string);
              }
            } catch {
              // ignore frame errors
            }
          }, 300);
        } else {
          setScanErr('QR scanning is not supported in this browser. Please paste the address.');
        }
      } catch {
        setScanErr('Camera access denied. Please paste the address manually.');
      }
    };

    start();
    return () => {
      clearInterval(timer);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onScan]);

  return (
    <div className="space-y-3">
      {scanErr ? (
        <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-xl text-sm text-red-400">
          {scanErr}
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-square max-w-[260px] mx-auto">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
          {/* Scan frame overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-44 h-44 border-2 border-purple-400 rounded-xl" />
          </div>
          <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/70">
            Point at QR code
          </p>
        </div>
      )}
      <button onClick={onClose} className="w-full text-sm text-gray-400 hover:text-white transition-colors">
        Cancel
      </button>
    </div>
  );
}

// ─── Collapsible token row ────────────────────────────────────────────────────

interface CollapsibleRowProps {
  symbol: TokenSymbol;
  baseBalance: bigint | undefined;
  ethBalance: bigint | undefined;
  isLoading: boolean;
  marketData: Map<string, CoinGeckoMarketData>;
  isExpanded: boolean;
  onToggle: () => void;
}

function CollapsibleTokenRow({
  symbol,
  baseBalance,
  ethBalance,
  isLoading,
  marketData,
  isExpanded,
  onToggle,
}: CollapsibleRowProps) {
  const meta = TOKEN_METADATA[symbol];
  const coin = marketData.get(meta.coingeckoId);
  const price = coin?.current_price ?? 0;
  const decimals = meta.decimals;

  const totalBig = (baseBalance ?? 0n) + (ethBalance ?? 0n);
  const totalFmt = fmtBalance(totalBig, decimals);
  const totalUsd = toUsd(totalBig, decimals, price);
  const baseUsd = toUsd(baseBalance, decimals, price);
  const ethUsd = toUsd(ethBalance, decimals, price);

  return (
    <div className="rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.07] transition-all">
      {/* Main row */}
      <button
        className="w-full flex items-center justify-between py-3.5 px-4 hover:bg-white/[0.04] transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <TokenLogo image={coin?.image} symbol={symbol} size={40} />
          <div className="text-left">
            <p className="text-sm font-semibold text-white leading-snug">{meta.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-gray-400">{symbol}</span>
              {coin && <PriceChange pct={coin.price_change_percentage_24h} />}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-right">
            {isLoading ? (
              <div className="space-y-1.5 items-end flex flex-col">
                <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-white">
                  {totalFmt}{' '}
                  <span className="text-gray-400 font-normal text-xs">{symbol}</span>
                </p>
                {totalUsd && <p className="text-xs text-gray-400 mt-0.5">${totalUsd}</p>}
              </>
            )}
          </div>
          <ChevronDownIcon
            className={`w-4 h-4 text-gray-500 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expanded per-chain breakdown */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/[0.06] space-y-2">
          {(
            [
              { label: 'Base', color: 'bg-blue-400', balance: baseBalance },
              { label: 'Ethereum', color: 'bg-indigo-400', balance: ethBalance },
            ] as const
          ).map(({ label, color, balance }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${color} shrink-0`} />
                <span className="text-gray-400">{label}</span>
              </div>
              <div className="text-right">
                <span className="text-white">
                  {fmtBalance(balance, decimals)} {symbol}
                </span>
                {toUsd(balance, decimals, price) && (
                  <span className="text-gray-500 ml-2 text-xs">
                    ${toUsd(balance, decimals, price)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Send modal ───────────────────────────────────────────────────────────────

const SEND_TOKENS: TokenSymbol[] = ['ETH', 'USDC', 'USDT', 'EURC'];
const SEND_CHAINS = [
  { id: base.id, label: 'Base', color: 'text-blue-300' },
  { id: mainnet.id, label: 'Ethereum', color: 'text-indigo-300' },
];

interface SendModalProps {
  onClose: () => void;
  balances: {
    baseEth: bigint | undefined;
    ethEth: bigint | undefined;
    baseUsdc: bigint | undefined;
    baseUsdt: bigint | undefined;
    baseEurc: bigint | undefined;
    ethUsdc: bigint | undefined;
    ethUsdt: bigint | undefined;
    ethEurc: bigint | undefined;
  };
  marketData: Map<string, CoinGeckoMarketData>;
}

function SendModal({ onClose, balances, marketData }: SendModalProps) {
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
      case 'ETH':   return onBase ? balances.baseEth : balances.ethEth;
      case 'USDC':  return onBase ? balances.baseUsdc : balances.ethUsdc;
      case 'USDT':  return onBase ? balances.baseUsdt : balances.ethUsdt;
      case 'EURC':  return onBase ? balances.baseEurc : balances.ethEurc;
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
    // Strip ethereum: prefix if present
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

    // Check balance
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
                {SEND_CHAINS.map(({ id, label, color }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedChain(id)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-colors ${
                      selectedChain === id
                        ? 'border-purple-500 bg-purple-900/30'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${id === base.id ? 'bg-blue-400' : 'bg-indigo-400'}`} />
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

// ─── Main page ────────────────────────────────────────────────────────────────

const TOKEN_LIST: TokenSymbol[] = ['ETH', 'USDC', 'USDT', 'EURC'];

export default function WalletPage() {
  const { isConnected, address } = useAccount();

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedTokens, setExpandedTokens] = useState<Set<TokenSymbol>>(new Set());
  const [marketData, setMarketData] = useState<Map<string, CoinGeckoMarketData>>(new Map());

  const zeroAddr = '0x0000000000000000000000000000000000000000' as `0x${string}`;
  const userAddr = address ?? zeroAddr;

  // ── Native ETH balances ────────────────────────────────────────────────────
  const { data: ethBase, isLoading: ethBaseLoading } = useBalance({
    address,
    chainId: base.id,
    query: { enabled: !!address },
  });
  const { data: ethEthereum, isLoading: ethEthereumLoading } = useBalance({
    address,
    chainId: mainnet.id,
    query: { enabled: !!address },
  });

  // ── ERC-20 balances — Base ─────────────────────────────────────────────────
  const { data: baseErc20, isLoading: baseErc20Loading } = useReadContracts({
    contracts: [
      { address: TOKEN_ADDRESSES.base.USDC, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: base.id },
      { address: TOKEN_ADDRESSES.base.USDT, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: base.id },
      { address: TOKEN_ADDRESSES.base.EURC, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: base.id },
    ],
    query: { enabled: !!address },
  });

  // ── ERC-20 balances — Ethereum ─────────────────────────────────────────────
  const { data: ethErc20, isLoading: ethErc20Loading } = useReadContracts({
    contracts: [
      { address: TOKEN_ADDRESSES.ethereum.USDC, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: mainnet.id },
      { address: TOKEN_ADDRESSES.ethereum.USDT, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: mainnet.id },
      { address: TOKEN_ADDRESSES.ethereum.EURC, abi: erc20Abi, functionName: 'balanceOf', args: [userAddr], chainId: mainnet.id },
    ],
    query: { enabled: !!address },
  });

  // ── CoinGecko market data ──────────────────────────────────────────────────
  useEffect(() => {
    const fetch60s = async () => {
      try {
        const ids = COINGECKO_IDS.join(',');
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=10&page=1&sparkline=false`
        );
        const data: CoinGeckoMarketData[] = await res.json();
        setMarketData(new Map(data.map((c) => [c.id, c])));
      } catch {
        // degrade gracefully
      }
    };
    fetch60s();
    const id = setInterval(fetch60s, 60_000);
    return () => clearInterval(id);
  }, []);

  // ── QR code generation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (address && showReceiveModal) {
      QRCode.toDataURL(address, { width: 280, margin: 2, color: { dark: '#000', light: '#fff' } })
        .then(setQrCodeUrl);
    }
  }, [address, showReceiveModal]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getErc20Big = (data: typeof baseErc20, idx: number): bigint | undefined => {
    const r = data?.[idx];
    return r?.status === 'success' ? (r.result as bigint) : undefined;
  };

  const toggleExpand = (sym: TokenSymbol) =>
    setExpandedTokens((prev) => {
      const next = new Set(prev);
      next.has(sym) ? next.delete(sym) : next.add(sym);
      return next;
    });

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Per-token balances map ─────────────────────────────────────────────────
  const tokenBalances: Record<
    TokenSymbol,
    { base: bigint | undefined; eth: bigint | undefined; loading: boolean }
  > = {
    ETH: {
      base: ethBase?.value,
      eth: ethEthereum?.value,
      loading: ethBaseLoading || ethEthereumLoading,
    },
    USDC: {
      base: getErc20Big(baseErc20, 0),
      eth: getErc20Big(ethErc20, 0),
      loading: baseErc20Loading || ethErc20Loading,
    },
    USDT: {
      base: getErc20Big(baseErc20, 1),
      eth: getErc20Big(ethErc20, 1),
      loading: baseErc20Loading || ethErc20Loading,
    },
    EURC: {
      base: getErc20Big(baseErc20, 2),
      eth: getErc20Big(ethErc20, 2),
      loading: baseErc20Loading || ethErc20Loading,
    },
  };

  // ── Total portfolio ────────────────────────────────────────────────────────
  const totalPortfolio = (() => {
    let sum = 0;
    for (const sym of TOKEN_LIST) {
      const { base: bBal, eth: eBal } = tokenBalances[sym];
      const price = marketData.get(TOKEN_METADATA[sym].coingeckoId)?.current_price ?? 0;
      const dec = TOKEN_METADATA[sym].decimals;
      if (bBal) sum += parseFloat(formatUnits(bBal, dec)) * price;
      if (eBal) sum += parseFloat(formatUnits(eBal, dec)) * price;
    }
    return sum > 0
      ? sum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : null;
  })();

  // ── Not connected ─────────────────────────────────────────────────────────
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
        <div className="max-w-xl mx-auto space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Wallet</h1>
              <p className="text-xs text-gray-500">Base &amp; Ethereum Mainnet</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReceiveModal(true)}
                className="btn-secondary flex items-center gap-1.5 text-sm"
              >
                <ArrowDownIcon className="w-4 h-4" />
                Receive
              </button>
              <button
                onClick={() => setShowSendModal(true)}
                className="btn-primary flex items-center gap-1.5 text-sm"
              >
                <ArrowUpIcon className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>

          {/* Smart Wallet activation status */}
          <SmartWalletActivationBanner />

          {/* Total portfolio card */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-900/40 to-blue-900/30 border border-purple-700/30 p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Portfolio</p>
            {totalPortfolio === null ? (
              <div className="h-9 w-36 bg-white/10 rounded animate-pulse mt-1" />
            ) : (
              <p className="text-3xl font-bold text-white">
                ${totalPortfolio}
                <span className="text-sm text-gray-400 font-normal ml-2">USD</span>
              </p>
            )}
          </div>

          {/* Token list */}
          <div className="space-y-2">
            {TOKEN_LIST.map((sym) => {
              const { base: bBal, eth: eBal, loading } = tokenBalances[sym];
              return (
                <CollapsibleTokenRow
                  key={sym}
                  symbol={sym}
                  baseBalance={bBal}
                  ethBalance={eBal}
                  isLoading={loading}
                  marketData={marketData}
                  isExpanded={expandedTokens.has(sym)}
                  onToggle={() => toggleExpand(sym)}
                />
              );
            })}
          </div>

        </div>
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <SendModal
          onClose={() => setShowSendModal(false)}
          balances={{
            baseEth: tokenBalances.ETH.base,
            ethEth: tokenBalances.ETH.eth,
            baseUsdc: tokenBalances.USDC.base,
            baseUsdt: tokenBalances.USDT.base,
            baseEurc: tokenBalances.EURC.base,
            ethUsdc: tokenBalances.USDC.eth,
            ethUsdt: tokenBalances.USDT.eth,
            ethEurc: tokenBalances.EURC.eth,
          }}
          marketData={marketData}
        />
      )}

      {/* Receive Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Receive</h2>
              <button onClick={() => setShowReceiveModal(false)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {qrCodeUrl && (
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-2xl shadow-lg">
                  <img src={qrCodeUrl} alt="Wallet QR" className="w-56 h-56" />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">
                Your Address
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-white text-xs font-mono break-all">{address}</p>
                </div>
                <button onClick={copyAddress} className="btn-secondary p-2.5">
                  {copied ? (
                    <CheckIcon className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
              {copied && <p className="text-xs text-emerald-400 mt-1.5">Copied!</p>}
            </div>

            <p className="text-xs text-gray-500 text-center">
              Works on Base and Ethereum Mainnet
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
