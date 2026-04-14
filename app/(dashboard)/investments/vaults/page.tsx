'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract } from '@/lib/wagmi/compat';
import { useAuth } from '@/lib/hooks/useAuth';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { apiFetch, ApiError } from '@/lib/api/client';
import { useSmartAccountClient, useSendUserOperation } from '@account-kit/react';
import { useContracts } from '@/lib/hooks/useContracts';
import TokenizedBondVaultABI from '@/abis/TokenizedBondVault.json';
import ERC20ABI from '@/ERC20.json';
import Link from 'next/link';
import {
  CubeIcon,
  LockClosedIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { parseUnits, formatUnits, encodeFunctionData, type Abi } from 'viem';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VaultRecord {
  id: string;
  onchainVaultId: string;
  vaultAddress: string;
  chainId: number;
  name: string;
  symbol: string;
  principalAmount: string;   // USDC wei (6 dec)
  interestRate: string;      // basis points
  protocolFeeRate: string;
  maturityDate: string;      // ISO date
  totalShareSupply: string;
  minInvestment: string;     // USDC wei (6 dec)
  borrowerAddress: string;
  fundingRequestId?: string;
  txHash?: string;
  createdAt: string;
}

interface VaultListResponse {
  items: VaultRecord[];
  total: number;
}

// ─── Vault state labels ───────────────────────────────────────────────────────

const VAULT_STATES: Record<number, { label: string; color: string }> = {
  0: { label: 'Created',   color: 'text-gray-400' },
  1: { label: 'Funding',   color: 'text-blue-400' },
  2: { label: 'Funded',    color: 'text-emerald-400' },
  3: { label: 'Active',    color: 'text-purple-400' },
  4: { label: 'Repaying',  color: 'text-yellow-400' },
  5: { label: 'Completed', color: 'text-emerald-400' },
  6: { label: 'Defaulted', color: 'text-red-400' },
};

function formatUSDC(wei: string) {
  try { return Number(formatUnits(BigInt(wei), 6)).toLocaleString('en-US', { maximumFractionDigits: 2 }); }
  catch { return '0'; }
}

function formatRate(bps: string) {
  return (Number(bps) / 100).toFixed(2) + '%';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Single Vault Card (reads live state from chain) ─────────────────────────

function VaultCard({
  vault,
  onDeposit,
}: {
  vault: VaultRecord;
  onDeposit: (vault: VaultRecord) => void;
}) {
  const { data: stateData } = useReadContract({
    address: vault.vaultAddress as `0x${string}`,
    abi: TokenizedBondVaultABI,
    functionName: 'getVaultState',
    chainId: vault.chainId,
  });

  const { data: totalRaisedData } = useReadContract({
    address: vault.vaultAddress as `0x${string}`,
    abi: TokenizedBondVaultABI,
    functionName: 'totalAssets',
    chainId: vault.chainId,
  });

  const state = stateData !== undefined ? Number(stateData) : -1;
  const totalRaised = totalRaisedData ? formatUSDC(totalRaisedData.toString()) : '…';
  const principal   = formatUSDC(vault.principalAmount);
  const stateInfo   = VAULT_STATES[state] ?? { label: 'Loading…', color: 'text-gray-400' };
  const maturity    = formatDate(vault.maturityDate);
  const canDeposit  = state === 1; // Funding state

  const progress = totalRaisedData && vault.principalAmount
    ? Math.min(100, Number((BigInt(totalRaisedData.toString()) * 100n) / BigInt(vault.principalAmount)))
    : 0;

  return (
    <div className="card p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shrink-0">
            <CubeIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{vault.name}</h3>
            <p className="text-sm text-gray-400">{vault.symbol}</p>
          </div>
        </div>
        <span className={`text-xs font-medium ${stateInfo.color}`}>{stateInfo.label}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500 text-xs">Principal</p>
          <p className="text-white font-medium">{principal} USDC</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Interest</p>
          <p className="text-emerald-400 font-medium">{formatRate(vault.interestRate)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Raised</p>
          <p className="text-white font-medium">{totalRaised} USDC</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Maturity</p>
          <p className="text-white font-medium">{maturity}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Min. Investment</p>
          <p className="text-white font-medium">{formatUSDC(vault.minInvestment)} USDC</p>
        </div>
      </div>

      {/* Progress bar (when Funding) */}
      {state === 1 && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Funded</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action */}
      <button
        onClick={() => onDeposit(vault)}
        disabled={!canDeposit}
        className={`btn-primary w-full text-sm ${!canDeposit ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        {canDeposit ? 'Deposit USDC' : state === 0 ? 'Not Open Yet' : state >= 2 ? 'Closed' : 'Unavailable'}
      </button>
    </div>
  );
}

// ─── Deposit Modal ────────────────────────────────────────────────────────────

function DepositModal({
  vault,
  contracts,
  onClose,
  onSuccess,
}: {
  vault: VaultRecord;
  contracts: { USDC: `0x${string}` };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'processing' | 'done' | 'error'>('input');
  const [errorMsg, setErrorMsg] = useState('');

  const minInvest = formatUSDC(vault.minInvestment);
  const amountWei = amount ? parseUnits(amount, 6) : 0n;

  const { client } = useSmartAccountClient({ type: 'MultiOwnerModularAccount' });
  const { sendUserOperation, sendUserOperationResult, error: uoError } = useSendUserOperation({ client, waitForTxn: true });

  // Watch for UO completion
  useEffect(() => {
    if (sendUserOperationResult?.hash && step === 'processing') {
      setStep('done');
    }
  }, [sendUserOperationResult, step]);

  // Watch for UO error
  useEffect(() => {
    if (uoError && step === 'processing') {
      const msg = (uoError as { shortMessage?: string; message?: string })?.shortMessage ?? uoError.message ?? 'Transaction failed';
      setErrorMsg(msg);
      setStep('error');
    }
  }, [uoError, step]);

  const handleDeposit = () => {
    if (!amount || Number(amount) <= 0 || !address) return;
    const minWei = BigInt(vault.minInvestment);
    if (amountWei < minWei) {
      setErrorMsg(`Minimum investment is ${minInvest} USDC`);
      return;
    }
    setStep('processing');
    setErrorMsg('');

    // Batch approve + deposit into a single UserOperation
    sendUserOperation({
      uo: [
        {
          target: contracts.USDC,
          data: encodeFunctionData({
            abi: ERC20ABI as Abi,
            functionName: 'approve',
            args: [vault.vaultAddress as `0x${string}`, amountWei],
          }),
          value: 0n,
        },
        {
          target: vault.vaultAddress as `0x${string}`,
          data: encodeFunctionData({
            abi: TokenizedBondVaultABI as Abi,
            functionName: 'deposit',
            args: [amountWei, address],
          }),
          value: 0n,
        },
      ],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card max-w-sm w-full p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Deposit into {vault.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        {step === 'done' ? (
          <div className="text-center py-6">
            <CheckCircleIcon className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">Deposit Successful!</p>
            <p className="text-gray-400 text-sm mb-4">You&apos;ve deposited {amount} USDC into {vault.name}</p>
            <button onClick={() => { onSuccess(); onClose(); }} className="btn-primary w-full">Done</button>
          </div>
        ) : step === 'error' ? (
          <div className="text-center py-6">
            <XCircleIcon className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">Transaction Failed</p>
            <p className="text-gray-400 text-sm mb-4">{errorMsg}</p>
            <button onClick={() => setStep('input')} className="btn-secondary w-full">Try Again</button>
          </div>
        ) : (
          <>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Interest Rate</span>
                <span className="text-emerald-400 font-medium">{formatRate(vault.interestRate)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Maturity</span>
                <span className="text-white">{formatDate(vault.maturityDate)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Min Investment</span>
                <span className="text-white">{minInvest} USDC</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Amount (USDC)</label>
              <input
                type="number"
                min={minInvest}
                step="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={`Min ${minInvest}`}
                disabled={step !== 'input'}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              {errorMsg && <p className="text-red-400 text-xs mt-1">{errorMsg}</p>}
            </div>

            <div className="space-y-2">
              {step === 'processing' && (
                <div className="flex items-center gap-2 text-sm text-purple-300">
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  Approving &amp; Depositing…
                </div>
              )}
              <button
                onClick={handleDeposit}
                disabled={step !== 'input' || !amount}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step === 'input' ? 'Approve & Deposit' : 'Processing…'}
              </button>
              <button onClick={onClose} disabled={step !== 'input'} className="btn-secondary w-full">
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EarnVaultsPage() {
  const { isConnected, address } = useAccount();
  const { isAuthenticated, isSigningIn, signIn } = useAuth();
  const { hasAnyLPNFT, hasPassportNFT, hasActivePassport, isLoading: nftLoading } = useNFTBalance();
  const contracts = useContracts();

  const [vaults, setVaults]           = useState<VaultRecord[]>([]);
  const [loading, setLoading]         = useState(false);
  const [apiError, setApiError]       = useState<string | null>(null);
  const [selectedVault, setSelected]  = useState<VaultRecord | null>(null);

  const canAccess = hasPassportNFT || hasActivePassport || hasAnyLPNFT;

  const loadVaults = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await apiFetch<VaultListResponse>('/vaults');
      setVaults(data.items ?? []);
    } catch (err) {
      if (err instanceof ApiError) setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && canAccess) loadVaults();
  }, [isAuthenticated, canAccess, loadVaults]);

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!isConnected) {
    return (
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <CubeIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to access Earn Vaults</p>
          </div>
        </div>
    );
  }

  if (!isAuthenticated) {
    return (
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <CubeIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
            <p className="text-gray-400 mb-6">Sign in to access Earn Vaults</p>
            <button onClick={signIn} disabled={isSigningIn} className="btn-primary">
              {isSigningIn ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
        </div>
    );
  }

  if (nftLoading) {
    return (
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Checking access…</p>
          </div>
        </div>
    );
  }

  if (!canAccess) {
    return (
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="card p-8 text-center">
              <LockClosedIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h2 className="text-2xl font-bold text-white mb-2">CONVEXO PASSPORT Required</h2>
              <p className="text-gray-400 mb-6">
                You need at least a CONVEXO PASSPORT (Tier 1) to access Earn Vaults.
              </p>
              <Link href="/digital-id/humanity">
                <button className="btn-primary">Get Verified</button>
              </Link>
            </div>
          </div>
        </div>
    );
  }

  // ── Main view ──────────────────────────────────────────────────────────────

  return (
    <>
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link href="/investments" className="text-gray-400 hover:text-white">Investments</Link>
                <span className="text-gray-600">/</span>
                <span className="text-white">Earn Vaults</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Earn Vaults</h1>
              <p className="text-gray-400">Tokenized bond vaults created by verified businesses</p>
            </div>
            <button
              onClick={loadVaults}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Error */}
          {apiError && (
            <div className="card bg-red-900/20 border-red-700/50 p-4">
              <p className="text-red-400 text-sm">{apiError}</p>
            </div>
          )}

          {/* Vault grid */}
          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading vaults…</p>
            </div>
          ) : vaults.length === 0 ? (
            <div className="card p-16 text-center">
              <CubeIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">No Vaults Available Yet</h3>
              <p className="text-gray-400">
                Tokenized bond vaults will appear here once businesses submit and receive approved funding requests.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vaults.map(vault => (
                <VaultCard
                  key={vault.id}
                  vault={vault}
                  onDeposit={v => setSelected(v)}
                />
              ))}
            </div>
          )}

          {/* How it works */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">How Earn Vaults Work</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: '1', title: 'Choose Vault',   desc: 'Pick a tokenized bond vault based on interest rate and maturity' },
                { step: '2', title: 'Deposit USDC',   desc: 'Approve and deposit USDC into the vault smart contract' },
                { step: '3', title: 'Earn Interest',  desc: 'Your funds are deployed to a verified business borrower' },
                { step: '4', title: 'Redeem at Maturity', desc: 'Request redemption when the vault reaches maturity date' },
              ].map(item => (
                <div key={item.step} className="text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold mx-auto mb-3">
                    {item.step}
                  </div>
                  <p className="font-medium text-white mb-1">{item.title}</p>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deposit modal */}
      {selectedVault && contracts && (
        <DepositModal
          vault={selectedVault}
          contracts={{ USDC: contracts.USDC }}
          onClose={() => setSelected(null)}
          onSuccess={loadVaults}
        />
      )}
    </>
  );
}
