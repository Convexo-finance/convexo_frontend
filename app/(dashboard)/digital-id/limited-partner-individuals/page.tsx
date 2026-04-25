'use client';

import { useState, useRef } from 'react';
import { useAccount } from '@/lib/wagmi/compat';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { useNavigation } from '@/lib/contexts/NavigationContext';
import { NFTDisplayCard } from '@/components/NFTDisplayCard';
import { apiFetch } from '@/lib/api/client';
import Image from 'next/image';
import Link from 'next/link';
import {
  CheckBadgeIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  IdentificationIcon,
  LockClosedIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { getIPFSUrl } from '@/lib/contracts/addresses';

// ─── File upload field ────────────────────────────────────────────────────────

function FileField({
  label,
  hint,
  required,
  file,
  onChange,
}: {
  label: string;
  hint: string;
  required?: boolean;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <p className="text-xs text-gray-500">{hint}</p>
      <div
        onClick={() => ref.current?.click()}
        className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-700 hover:border-purple-500/60 cursor-pointer transition-colors bg-gray-800/30 hover:bg-gray-800/60"
      >
        <ArrowUpTrayIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
        {file ? (
          <div className="flex items-center justify-between flex-1 min-w-0">
            <span className="text-sm text-white truncate">{file.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="ml-2 flex-shrink-0"
            >
              <XMarkIcon className="w-4 h-4 text-gray-500 hover:text-red-400" />
            </button>
          </div>
        ) : (
          <span className="text-sm text-gray-500">Click to upload</span>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i < current ? 'w-6 bg-purple-500' : i === current ? 'w-8 bg-purple-400' : 'w-4 bg-gray-700'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LimitedPartnerIndividualsPage() {
  const { isConnected, address } = useAccount();
  const { accountType } = useNavigation();
  const { hasLPIndividualsNFT } = useNFTBalance();

  // Form state
  const [step, setStep] = useState(0); // 0 = docs, 1 = review
  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [rutDoc, setRutDoc] = useState<File | null>(null);
  const [proofAddress, setProofAddress] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const isVerified = hasLPIndividualsNFT;

  const canProceed = idDoc !== null && proofAddress !== null;

  async function handleSubmit() {
    if (!idDoc || !proofAddress) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const form = new FormData();
      form.append('documentId', idDoc);
      if (rutDoc) form.append('rut', rutDoc);
      form.append('proofOfAddress', proofAddress);

      await apiFetch('/verification/kyc/submit', {
        method: 'POST',
        body: form,
        headers: {},
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Guards ──────────────────────────────────────────────────────────────────

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full min-h-[80vh]">
        <div className="text-center p-8">
          <IdentificationIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">Sign in to view LP Individual verification</p>
        </div>
      </div>
    );
  }

  if (accountType === 'BUSINESS') {
    return (
      <div className="flex items-center justify-center h-full min-h-[80vh]">
        <div className="text-center p-8 max-w-md">
          <LockClosedIcon className="w-16 h-16 mx-auto mb-4 text-amber-500/60" />
          <h2 className="text-2xl font-bold text-white mb-2">Individual Accounts Only</h2>
          <p className="text-gray-400 mb-6">Business entities use LP Business verification.</p>
          <Link href="/digital-id/limited-partner-business">
            <button className="btn-primary">Go to LP Business</button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Verified state ──────────────────────────────────────────────────────────

  if (isVerified) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/digital-id" className="text-gray-400 hover:text-white text-sm">Digital ID</Link>
              <span className="text-gray-600">/</span>
              <span className="text-white text-sm">LP Individuals</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Individual Investor Verification</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NFTDisplayCard type="lpIndividuals" address={address} />
            <div className="space-y-4">
              <div className="card p-6 bg-blue-900/20 border-blue-700/50">
                <div className="flex items-center gap-4">
                  <CheckBadgeIcon className="w-12 h-12 text-blue-400" />
                  <div>
                    <p className="text-lg font-semibold text-white">Individual LP Verified</p>
                    <p className="text-gray-400 text-sm">LP_Individuals NFT minted — Tier 2 active</p>
                  </div>
                </div>
              </div>
              <div className="card p-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-400">Quick Access</h4>
                {[
                  { href: '/investments/market-lps', label: 'LP Market Pools' },
                  { href: '/digital-id/credit-score', label: 'Request Credit Score' },
                ].map(({ href, label }) => (
                  <Link key={href} href={href} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition group">
                    <span className="text-white text-sm">{label}</span>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-white" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Submitted / pending state ───────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="card p-8 text-center space-y-4 bg-amber-900/10 border-amber-700/30">
            <ClockIcon className="w-14 h-14 mx-auto text-amber-400" />
            <h2 className="text-2xl font-bold text-white">Application Submitted</h2>
            <p className="text-gray-400">
              Your documents have been received. Our team will review your application and issue the LP_Individuals NFT upon approval.
            </p>
            <p className="text-amber-300 text-sm">Typical review time: 1–3 business days</p>
            <Link href="/digital-id">
              <button className="mt-2 px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
                Back to Digital ID
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Unverified: landing + form ──────────────────────────────────────────────

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/digital-id" className="text-gray-400 hover:text-white text-sm">Digital ID</Link>
              <span className="text-gray-600">/</span>
              <span className="text-white text-sm">LP Individuals</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">Individual Investor Verification</h1>
            <p className="text-gray-400 text-sm">Submit your documents for admin review to receive the LP_Individuals NFT (Tier 2)</p>
          </div>
          <Image
            src={getIPFSUrl('bafkreib7mkjzpdm3id6st6d5vsxpn7v5h6sxeiswejjmrbcb5yoagaf4em')}
            alt="LP Individuals NFT"
            width={72}
            height={72}
            className="rounded-2xl opacity-50 grayscale"
            onError={(e) => { e.currentTarget.src = '/NFTs/Convexo_lps.png'; }}
          />
        </div>

        {/* Inline form */}
        {!showForm ? (
          /* Landing card */
          <div className="card p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                <IdentificationIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">KYC Verification</h3>
                <p className="text-gray-400 text-sm">Upload your documents — reviewed by our compliance team</p>
              </div>
            </div>

            <ul className="space-y-2">
              {[
                { label: 'Government-issued ID', sub: 'Passport, national ID, or driver\'s license' },
                { label: 'Tax document (RUT / NIT)', sub: 'Colombian tax ID — required for CO residents' },
                { label: 'Proof of Address', sub: 'Utility bill or bank statement (max 3 months old)' },
              ].map(({ label, sub }) => (
                <li key={label} className="flex items-start gap-3 text-gray-300">
                  <DocumentTextIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-gray-500">{sub}</p>
                  </div>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setShowForm(true)}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Start Verification
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Document upload form */
          <div className="card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Upload Documents</h3>
                <p className="text-gray-400 text-sm">PDF, JPG or PNG — max 20 MB each</p>
              </div>
              <StepDots current={step} total={2} />
            </div>

            {step === 0 && (
              <div className="space-y-5">
                <FileField
                  label="Government-issued ID"
                  hint="Passport, national ID, or driver's license (front + back if applicable)"
                  required
                  file={idDoc}
                  onChange={setIdDoc}
                />
                <FileField
                  label="Tax Document (RUT / NIT)"
                  hint="Colombian RUT or equivalent tax document — required for CO residents"
                  file={rutDoc}
                  onChange={setRutDoc}
                />
                <FileField
                  label="Proof of Address"
                  hint="Utility bill or bank statement issued within the last 3 months"
                  required
                  file={proofAddress}
                  onChange={setProofAddress}
                />

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!canProceed}
                    onClick={() => setStep(1)}
                    className="flex-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors"
                  >
                    Review & Submit
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <h4 className="text-sm font-medium text-gray-300">Documents to submit</h4>
                <ul className="space-y-2">
                  {[
                    { label: 'Government ID', file: idDoc },
                    { label: 'Tax Document', file: rutDoc },
                    { label: 'Proof of Address', file: proofAddress },
                  ].map(({ label, file }) => file && (
                    <li key={label} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                      <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="text-sm text-white truncate">{file.name}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                {submitError && (
                  <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3">
                    {submitError}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(0)}
                    className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                  >
                    Back
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                    className="flex-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting…
                      </>
                    ) : 'Submit for Review'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tier 2 benefits */}
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Tier 2 Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: 'LP Pool Access', desc: 'Trade in USDC/ECOP and compliant pools' },
              { title: 'E-Contracts', desc: 'Sign and manage smart contracts' },
              { title: 'OTC Orders', desc: 'Over-the-counter trades' },
              { title: 'Token Swaps', desc: 'USDC ↔ ECOP via Uniswap V4' },
              { title: 'Credit Score', desc: 'AI-powered credit analysis' },
              { title: 'Vault Investments', desc: 'Tokenized bond vaults' },
            ].map(({ title, desc }) => (
              <div key={title} className="p-3 bg-gray-800/40 rounded-lg">
                <p className="font-medium text-white text-sm">{title}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Security notice */}
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 flex gap-3">
          <ShieldCheckIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-200 font-medium text-sm">Secure & Compliant</p>
            <p className="text-blue-300/70 text-xs mt-0.5">
              Your documents are encrypted in transit and stored securely. Convexo's compliance team reviews each application manually before issuing the NFT.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
