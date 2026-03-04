'use client';

import { useState, useRef } from 'react';
import { useAccount } from '@/lib/wagmi/compat';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiFetch, getToken, ApiError } from '@/lib/api/client';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import {
  SparklesIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

type SubmitStatus = 'idle' | 'submitting' | 'submitted' | 'error';

interface CreditScoreRequest {
  id: string;
  status: string;
  period: string;
  submittedAt: string;
  result: number | null;
  rating: string | null;
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

const SCORE_COLOR = (score: number) => {
  if (score >= 750) return 'text-emerald-400';
  if (score >= 700) return 'text-green-400';
  if (score >= 650) return 'text-yellow-400';
  return 'text-red-400';
};

const SCORE_RATING = (score: number) => {
  if (score >= 750) return 'Excellent';
  if (score >= 700) return 'Good';
  if (score >= 650) return 'Fair';
  return 'Poor';
};

export default function CreditScoreVerifyPage() {
  const { address, isConnected } = useAccount();
  const { isAuthenticated, isSigningIn, signIn } = useAuth();
  const { hasEcreditscoringNFT, ecreditscoringBalance } = useNFTBalance();

  // File state — one File per required slot
  const [files, setFiles] = useState<Record<string, File | null>>({
    income_statement: null,
    balance_sheet: null,
    cash_flow: null,
  });

  // Business info fields
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

  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [request, setRequest] = useState<CreditScoreRequest | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFiles(prev => ({ ...prev, [key]: file }));
  };

  const removeFile = (key: string) => {
    setFiles(prev => ({ ...prev, [key]: null }));
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key]!.value = '';
    }
  };

  const allFilesSelected = REQUIRED_FILES.every(f => files[f.key] !== null);
  const allFieldsFilled =
    period && annualRevenue && netProfit && totalAssets &&
    totalLiabilities && employeeCount && yearsOperating &&
    existingDebt && monthlyExpenses;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allFilesSelected || !allFieldsFilled) return;

    setStatus('submitting');
    setApiError(null);

    try {
      const token = getToken();
      const formData = new FormData();

      // Attach required files
      REQUIRED_FILES.forEach(f => {
        formData.append(f.key, files[f.key]!);
      });

      // Attach business info fields
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
      setStatus('submitted');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Submission failed');
      setStatus('error');
    }
  };

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please connect your wallet to start credit check
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <SparklesIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Sign In Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Sign in to submit your credit score request
            </p>
            <button
              onClick={signIn}
              disabled={isSigningIn}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg disabled:opacity-50"
            >
              {isSigningIn ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Already has credit score NFT
  if (hasEcreditscoringNFT) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-8">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
                <SparklesIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Already Verified
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You hold {ecreditscoringBalance?.toString() ?? '0'} Credit Score NFT(s).
            </p>
            <p className="text-sm text-gray-500">{address}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Submitted — show pending state
  if (status === 'submitted' && request) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-8">
          <div className="card p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-blue-900/30 rounded-full">
                <ClockIcon className="h-12 w-12 text-blue-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">Submission Received</h2>
            <p className="text-gray-400">
              Your financial documents have been uploaded and your credit score request is being
              processed by our AI. You will be notified when the analysis is complete.
            </p>

            {request.result !== null ? (
              <div className="space-y-2">
                <div className={`text-6xl font-bold ${SCORE_COLOR(request.result)}`}>
                  {request.result}
                </div>
                <div className="text-xl text-gray-400">{SCORE_RATING(request.result)}</div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-blue-400">
                <SparklesIcon className="h-5 w-5 animate-pulse" />
                <span>Analysis in progress…</span>
              </div>
            )}

            <div className="p-4 bg-gray-800/50 rounded-lg text-sm text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Request ID</span>
                <span className="text-white font-mono">{request.id.slice(0, 8)}…</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Period</span>
                <span className="text-white">{request.period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className="text-blue-400 capitalize">{request.status.toLowerCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 p-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Credit Check</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Submit your financial statements for AI-powered credit scoring
          </p>
        </div>

        {/* n8n AI Evaluation Request */}
        <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-700/50 rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Request AI Evaluation</h2>
            <p className="text-sm text-gray-400 mt-1">
              Fill out our guided form and let our AI agent evaluate your credit profile.
            </p>
          </div>
          <a
            href="http://localhost:5678/form/a81b4eb1-3006-4db2-87e3-3a5c503f9685"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors"
          >
            Solicitar Evaluación Crediticia
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </a>
        </div>

        {/* Error */}
        {apiError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4 text-red-700 dark:text-red-400 text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Required Documents */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Required Financial Statements
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              All three documents are required. Supported formats: PDF, XLSX, XLS, JPG, PNG (max 20 MB each).
            </p>

            <div className="space-y-4">
              {REQUIRED_FILES.map(({ key, label, description }) => (
                <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {files[key] ? (
                        <CheckCircleIcon className="h-6 w-6 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <DocumentTextIcon className="h-6 w-6 text-gray-400 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {files[key] ? (
                        <>
                          <span className="text-sm text-gray-500 dark:text-gray-400 max-w-[160px] truncate">
                            {files[key]!.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(key)}
                            className="p-1 text-gray-400 hover:text-red-400"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </>
                      ) : (
                        <label
                          htmlFor={`file-${key}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-1.5 px-4 rounded-lg cursor-pointer"
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
                </div>
              ))}
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Business Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Reporting Period <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  placeholder='e.g. "2024" or "Q3-2024"'
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Annual Revenue (USD) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={annualRevenue}
                  onChange={e => setAnnualRevenue(e.target.value)}
                  placeholder="500000"
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Net Profit (USD) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={netProfit}
                  onChange={e => setNetProfit(e.target.value)}
                  placeholder="75000"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Total Assets (USD) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={totalAssets}
                  onChange={e => setTotalAssets(e.target.value)}
                  placeholder="1200000"
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Total Liabilities (USD) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={totalLiabilities}
                  onChange={e => setTotalLiabilities(e.target.value)}
                  placeholder="400000"
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Monthly Expenses (USD) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={monthlyExpenses}
                  onChange={e => setMonthlyExpenses(e.target.value)}
                  placeholder="35000"
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Existing Debt (USD) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={existingDebt}
                  onChange={e => setExistingDebt(e.target.value)}
                  placeholder="200000"
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Employees <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={employeeCount}
                  onChange={e => setEmployeeCount(e.target.value)}
                  placeholder="25"
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Years Operating <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={yearsOperating}
                  onChange={e => setYearsOperating(e.target.value)}
                  placeholder="5"
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Additional Context <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={additionalContext}
                onChange={e => setAdditionalContext(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Any additional information about your business, industry specifics, or context for the credit analysis…"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {additionalContext.length}/2000
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={status === 'submitting' || !allFilesSelected || !allFieldsFilled}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? (
              <span className="flex items-center justify-center">
                <SparklesIcon className="h-5 w-5 mr-2 animate-pulse" />
                Uploading & Submitting…
              </span>
            ) : (
              'Submit for Credit Analysis'
            )}
          </button>

          {(!allFilesSelected || !allFieldsFilled) && (
            <p className="text-center text-sm text-gray-500">
              {!allFilesSelected
                ? 'Upload all 3 required financial statements to continue'
                : 'Fill in all required business information fields'}
            </p>
          )}
        </form>

        {/* How it works */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">How It Works</h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>1. Upload your income statement, balance sheet, and cash flow statement.</p>
            <p>2. Our AI analyzes your financials and generates a credit score (650–850 scale).</p>
            <p>3. If approved, an Ecreditscoring NFT is minted to your wallet as proof of creditworthiness.</p>
            <p>All documents are encrypted on IPFS and never shared with third parties.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
