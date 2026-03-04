'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount } from '@/lib/wagmi/compat';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiFetch, getToken, ApiError } from '@/lib/api/client';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import {
  SparklesIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

type SubmitStatus = 'idle' | 'submitting' | 'submitted' | 'error';
type PollStatus = 'PENDING' | 'COMPLETE' | 'REJECTED';

interface CreditScoreRequest {
  id: string;
  status: PollStatus;
  period: string;
  submittedAt: string;
  score: number | null;
  rating: string | null;
  approved: boolean | null;
  maxCreditLimit: number | null;
  analysisNotes: string | null;
}

interface RequiredFile {
  key: 'income_statement' | 'balance_sheet' | 'cash_flow';
  label: string;
  description: string;
}

const REQUIRED_FILES: RequiredFile[] = [
  { key: 'income_statement', label: 'Income Statement', description: 'Revenue & expenses' },
  { key: 'balance_sheet', label: 'Balance Sheet', description: 'Assets & liabilities' },
  { key: 'cash_flow', label: 'Cash Flow Statement', description: 'Operating, investing & financing' },
];

function scoreColor(score: number) {
  if (score >= 750) return 'text-emerald-400';
  if (score >= 700) return 'text-green-400';
  if (score >= 650) return 'text-yellow-400';
  return 'text-red-400';
}

function scoreRating(score: number) {
  if (score >= 750) return 'Excellent';
  if (score >= 700) return 'Good';
  if (score >= 650) return 'Fair';
  return 'Poor';
}

export default function CreditScoreVerifyPage() {
  const { address, isConnected } = useAccount();
  const { isAuthenticated, isSigningIn, signIn } = useAuth();
  const { hasEcreditscoringNFT, ecreditscoringBalance } = useNFTBalance();

  // File state
  const [files, setFiles] = useState<Record<string, File | null>>({
    income_statement: null,
    balance_sheet: null,
    cash_flow: null,
  });

  // Business info
  const [period, setPeriod] = useState('');
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [netProfit, setNetProfit] = useState('');
  const [totalAssets, setTotalAssets] = useState('');
  const [totalLiabilities, setTotalLiabilities] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [yearsOperating, setYearsOperating] = useState('');
  const [existingDebt, setExistingDebt] = useState('');
  const [monthlyExpenses, setMonthlyExpenses] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');

  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [request, setRequest] = useState<CreditScoreRequest | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Polling after submission ────────────────────────────────────────────────
  useEffect(() => {
    if (submitStatus !== 'submitted' || !request?.id) return;
    if (request.status === 'COMPLETE' || request.status === 'REJECTED') return;

    const interval = setInterval(async () => {
      try {
        const updated = await apiFetch<CreditScoreRequest>('/verification/credit-score/status');
        setRequest(updated);
        if (updated.status === 'COMPLETE' || updated.status === 'REJECTED') {
          clearInterval(interval);
        }
      } catch {
        // silently retry
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [submitStatus, request?.id, request?.status]);

  const handleFileChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFiles(prev => ({ ...prev, [key]: file }));
  };

  const removeFile = (key: string) => {
    setFiles(prev => ({ ...prev, [key]: null }));
    if (fileInputRefs.current[key]) fileInputRefs.current[key]!.value = '';
  };

  const allFilesSelected = REQUIRED_FILES.every(f => files[f.key] !== null);
  const allFieldsFilled =
    period && annualRevenue && netProfit && totalAssets &&
    totalLiabilities && employeeCount && yearsOperating &&
    existingDebt && monthlyExpenses;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allFilesSelected || !allFieldsFilled) return;

    setSubmitStatus('submitting');
    setApiError(null);

    try {
      const token = getToken();
      const formData = new FormData();
      REQUIRED_FILES.forEach(f => formData.append(f.key, files[f.key]!));
      formData.append('period', period);
      formData.append('annualRevenue', annualRevenue);
      formData.append('netProfit', netProfit);
      formData.append('totalAssets', totalAssets);
      formData.append('totalLiabilities', totalLiabilities);
      formData.append('employeeCount', employeeCount);
      formData.append('yearsOperating', yearsOperating);
      formData.append('existingDebt', existingDebt);
      formData.append('monthlyExpenses', monthlyExpenses);
      if (additionalContext) formData.append('additionalContext', additionalContext);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/verification/credit-score/submit`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new ApiError(res.status, (err as { message?: string }).message ?? `Error ${res.status}`);
      }

      const data = await res.json() as CreditScoreRequest;
      setRequest(data);
      setSubmitStatus('submitted');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Submission failed');
      setSubmitStatus('error');
    }
  };

  // ── Not connected ───────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <SparklesIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to start credit check</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <SparklesIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
            <p className="text-gray-400 mb-6">Sign in to submit your credit score request</p>
            <button onClick={signIn} disabled={isSigningIn} className="btn-primary">
              {isSigningIn ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Already has credit score NFT ────────────────────────────────────────────
  if (hasEcreditscoringNFT) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-8">
          <div className="card p-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-900/30 border border-emerald-700/50 flex items-center justify-center mx-auto">
              <CheckBadgeIcon className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Credit Score Verified</h2>
            <p className="text-gray-400">
              You hold {ecreditscoringBalance?.toString() ?? '0'} Ecreditscoring NFT
              {(ecreditscoringBalance ?? 0n) !== 1n ? 's' : ''}.
            </p>
            <p className="text-xs text-gray-600 font-mono">{address}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Submitted — show status ─────────────────────────────────────────────────
  if (submitStatus === 'submitted' && request) {
    const isApproved = request.status === 'COMPLETE' && request.approved === true;
    const isRejected = request.status === 'REJECTED' || (request.status === 'COMPLETE' && request.approved === false);
    const isPending = !isApproved && !isRejected;

    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-8">
          <div className="card p-8 text-center space-y-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
              isApproved ? 'bg-emerald-900/30 border border-emerald-700/50' :
              isRejected ? 'bg-red-900/30 border border-red-700/50' :
              'bg-blue-900/30 border border-blue-700/50'
            }`}>
              {isApproved
                ? <CheckBadgeIcon className="w-10 h-10 text-emerald-400" />
                : isRejected
                ? <ExclamationCircleIcon className="w-10 h-10 text-red-400" />
                : <ClockIcon className="w-10 h-10 text-blue-400" />
              }
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {isApproved ? 'Analysis Complete!' : isRejected ? 'Analysis Rejected' : 'Analysis in Progress'}
              </h2>
              <p className="text-gray-400 text-sm">
                {isApproved
                  ? 'Your credit score is ready. An NFT will be minted to your wallet.'
                  : isRejected
                  ? 'Your credit score request was rejected. Please contact support.'
                  : 'Your documents are being analyzed by our AI. This usually takes 5–15 minutes.'}
              </p>
            </div>

            {/* Score result */}
            {request.score !== null && request.score !== undefined && (
              <div className="space-y-1">
                <div className={`text-7xl font-bold ${scoreColor(request.score)}`}>
                  {request.score}
                </div>
                <div className="text-lg text-gray-300">{request.rating ?? scoreRating(request.score)}</div>
              </div>
            )}

            {/* Credit limit */}
            {request.maxCreditLimit !== null && request.maxCreditLimit !== undefined && (
              <div className="p-4 bg-gray-800/50 rounded-xl text-sm">
                <p className="text-gray-400 mb-1">Max Credit Limit</p>
                <p className="text-white font-semibold text-lg">
                  ${request.maxCreditLimit.toLocaleString()}
                </p>
              </div>
            )}

            {/* Analysis notes */}
            {request.analysisNotes && (
              <div className="p-4 bg-gray-800/50 rounded-xl text-sm text-left">
                <p className="text-gray-400 mb-1">Analysis Notes</p>
                <p className="text-gray-300">{request.analysisNotes}</p>
              </div>
            )}

            {/* Pending pulse */}
            {isPending && (
              <div className="flex items-center justify-center gap-2 text-blue-400">
                <SparklesIcon className="h-5 w-5 animate-pulse" />
                <span className="text-sm">AI analysis in progress…</span>
              </div>
            )}

            {/* Request summary */}
            <div className="p-4 bg-gray-800/50 rounded-xl text-sm text-left space-y-2.5">
              <div className="flex justify-between">
                <span className="text-gray-400">Request ID</span>
                <span className="text-white font-mono text-xs">{request.id.slice(0, 8)}…</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Period</span>
                <span className="text-white">{request.period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className={`capitalize font-medium ${
                  isApproved ? 'text-emerald-400' : isRejected ? 'text-red-400' : 'text-blue-400'
                }`}>
                  {request.status.toLowerCase()}
                </span>
              </div>
            </div>

            {isPending && (
              <p className="text-xs text-gray-600">
                This page automatically refreshes every 30 seconds.
              </p>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">AI Credit Score</h1>
          <p className="text-gray-400">Submit your financial statements for AI-powered credit scoring</p>
        </div>

        {/* Error */}
        {apiError && (
          <div className="card bg-red-900/20 border-red-700/50 text-red-400 text-sm p-4">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section 1: Documents */}
          <div className="card">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white mb-1">Financial Statements</h2>
              <p className="text-sm text-gray-400">
                All three documents required. Supported: PDF, XLSX, XLS, JPG, PNG (max 20 MB each).
              </p>
            </div>

            <div className="space-y-3">
              {REQUIRED_FILES.map(({ key, label, description }) => (
                <div
                  key={key}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                    files[key]
                      ? 'bg-emerald-900/10 border-emerald-700/40'
                      : 'bg-gray-800/50 border-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {files[key]
                      ? <CheckCircleIcon className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                      : <DocumentTextIcon className="h-6 w-6 text-gray-400 flex-shrink-0" />
                    }
                    <div>
                      <p className="font-medium text-white text-sm">{label}</p>
                      <p className="text-xs text-gray-500">{description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {files[key] ? (
                      <>
                        <span className="text-xs text-gray-400 max-w-[140px] truncate">{files[key]!.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(key)}
                          className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <label
                        htmlFor={`file-${key}`}
                        className="text-xs font-semibold py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white cursor-pointer transition-colors"
                      >
                        Upload
                      </label>
                    )}
                    <input
                      id={`file-${key}`}
                      type="file"
                      accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png"
                      onChange={e => handleFileChange(key, e)}
                      ref={el => { fileInputRefs.current[key] = el; }}
                      className="hidden"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Business info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-5">Business Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Reporting Period', value: period, setter: setPeriod, placeholder: 'e.g. "2024" or "Q3-2024"', type: 'text' },
                { label: 'Annual Revenue (USD)', value: annualRevenue, setter: setAnnualRevenue, placeholder: '500000', type: 'number' },
                { label: 'Net Profit (USD)', value: netProfit, setter: setNetProfit, placeholder: '75000', type: 'number' },
                { label: 'Total Assets (USD)', value: totalAssets, setter: setTotalAssets, placeholder: '1200000', type: 'number' },
                { label: 'Total Liabilities (USD)', value: totalLiabilities, setter: setTotalLiabilities, placeholder: '400000', type: 'number' },
                { label: 'Monthly Expenses (USD)', value: monthlyExpenses, setter: setMonthlyExpenses, placeholder: '35000', type: 'number' },
                { label: 'Existing Debt (USD)', value: existingDebt, setter: setExistingDebt, placeholder: '200000', type: 'number' },
                { label: 'Employees', value: employeeCount, setter: setEmployeeCount, placeholder: '25', type: 'number' },
                { label: 'Years Operating', value: yearsOperating, setter: setYearsOperating, placeholder: '5', type: 'number' },
              ].map(({ label, value, setter, placeholder, type }) => (
                <div key={label}>
                  <label className="block text-sm text-gray-400 mb-1.5">
                    {label} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type={type}
                    value={value}
                    onChange={e => setter(e.target.value)}
                    placeholder={placeholder}
                    required
                    min={type === 'number' ? '0' : undefined}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-sm text-gray-400 mb-1.5">
                Additional Context <span className="text-gray-600">(optional)</span>
              </label>
              <textarea
                value={additionalContext}
                onChange={e => setAdditionalContext(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Industry specifics, business model, or context for the credit analysis…"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none transition-colors resize-none"
              />
              <p className="text-xs text-gray-600 mt-1 text-right">{additionalContext.length}/2000</p>
            </div>
          </div>

          {/* Submit */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={submitStatus === 'submitting' || !allFilesSelected || !allFieldsFilled}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitStatus === 'submitting' ? (
                <>
                  <SparklesIcon className="h-5 w-5 animate-pulse" />
                  Uploading & Submitting…
                </>
              ) : (
                'Submit for Credit Analysis'
              )}
            </button>

            {(!allFilesSelected || !allFieldsFilled) && (
              <p className="text-center text-sm text-gray-500">
                {!allFilesSelected
                  ? 'Upload all 3 financial statements to continue'
                  : 'Fill in all required business information fields'}
              </p>
            )}
          </div>
        </form>

        {/* How it works */}
        <div className="card bg-purple-900/10 border-purple-700/30">
          <h3 className="text-sm font-semibold text-white mb-3">How It Works</h3>
          <div className="space-y-2 text-sm text-gray-400">
            <p>1. Upload your income statement, balance sheet, and cash flow statement.</p>
            <p>2. Our AI analyzes your financials and generates a credit score (650–850 scale).</p>
            <p>3. If approved, an Ecreditscoring NFT is minted to your wallet as proof of creditworthiness.</p>
            <p className="text-xs text-gray-600">All documents are encrypted on IPFS and never shared with third parties.</p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
