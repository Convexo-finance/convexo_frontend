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
  BuildingOffice2Icon,
  LockClosedIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { getIPFSUrl } from '@/lib/contracts/addresses';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Shareholder {
  id: string;
  name: string;
  idType: string;
  idNumber: string;
  nationality: string;
  participation: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const COMPANY_TYPES: Record<string, string[]> = {
  CO: ['SAS', 'Sociedad Anónima (SA)', 'LTDA', 'SCA', 'Empresa Unipersonal'],
  US: ['LLC', 'Corporation (C-Corp)', 'S-Corp', 'Partnership', 'Sole Proprietorship'],
  EU: ['GmbH', 'AG', 'SAS', 'SRL', 'PLC', 'SA'],
  CN: ['Limited Liability Company', 'Joint-Stock Company', 'Partnership', 'WFOE'],
  OTHER: ['Limited', 'Corporation', 'Partnership', 'Other'],
};

const TAX_DOC_LABEL: Record<string, string> = {
  CO: 'RUT (Registro Único Tributario)',
  US: 'EIN (Employer Identification Number)',
  EU: 'VAT Number / Tax Identification',
  CN: 'Unified Social Credit Code',
  OTHER: 'Tax Identification Document',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function FileField({
  label, hint, required, file, onChange,
}: {
  label: string; hint: string; required?: boolean; file: File | null; onChange: (f: File | null) => void;
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
            <button onClick={(e) => { e.stopPropagation(); onChange(null); }} className="ml-2 flex-shrink-0">
              <XMarkIcon className="w-4 h-4 text-gray-500 hover:text-red-400" />
            </button>
          </div>
        ) : (
          <span className="text-sm text-gray-500">Click to upload (PDF, JPG, PNG — max 20 MB)</span>
        )}
      </div>
      <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </div>
  );
}

function InputField({
  label, required, value, onChange, placeholder, type = 'text',
}: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
      />
    </div>
  );
}

function SelectField({
  label, required, value, onChange, options,
}: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
      >
        <option value="">Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
      <div className="w-9 h-9 rounded-xl bg-purple-600/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-purple-400" />
      </div>
      <div>
        <h4 className="font-semibold text-white text-sm">{title}</h4>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LimitedPartnerBusinessPage() {
  const { isConnected, address } = useAccount();
  const { accountType } = useNavigation();
  const { hasLPBusinessNFT } = useNFTBalance();

  // ── Company info ────────────────────────────────────────────────────────────
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [incorporationNumber, setIncorporationNumber] = useState('');
  const [taxNumber, setTaxNumber] = useState('');

  // ── Office address ──────────────────────────────────────────────────────────
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [officeCountry, setOfficeCountry] = useState('');

  // ── Legal representative ────────────────────────────────────────────────────
  const [repFirstName, setRepFirstName] = useState('');
  const [repLastName, setRepLastName] = useState('');
  const [repDocType, setRepDocType] = useState('');
  const [repDocNumber, setRepDocNumber] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [repPhone, setRepPhone] = useState('');

  // ── Shareholders ────────────────────────────────────────────────────────────
  const [shareholders, setShareholders] = useState<Shareholder[]>([
    { id: crypto.randomUUID(), name: '', idType: '', idNumber: '', nationality: '', participation: '' },
  ]);

  // ── Documents ───────────────────────────────────────────────────────────────
  const [incorporationCert, setIncorporationCert] = useState<File | null>(null);
  const [taxDoc, setTaxDoc] = useState<File | null>(null);
  const [proofAddress, setProofAddress] = useState<File | null>(null);
  const [repIdDoc, setRepIdDoc] = useState<File | null>(null);
  const [shareholdersCert, setShareholdersCert] = useState<File | null>(null);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const isVerified = hasLPBusinessNFT;

  // ── Validation ──────────────────────────────────────────────────────────────
  const companyReady = companyName && country && companyType && incorporationNumber && taxNumber;
  const addressReady = street && city && officeCountry;
  const repReady = repFirstName && repLastName && repDocType && repDocNumber && repEmail;
  const docsReady = incorporationCert && taxDoc && proofAddress && repIdDoc;
  const canSubmit = companyReady && addressReady && repReady && docsReady;

  // ── Shareholder helpers ─────────────────────────────────────────────────────
  function updateShareholder(id: string, field: keyof Shareholder, value: string) {
    setShareholders((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  }
  function addShareholder() {
    setShareholders((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: '', idType: '', idNumber: '', nationality: '', participation: '' },
    ]);
  }
  function removeShareholder(id: string) {
    setShareholders((prev) => prev.filter((s) => s.id !== id));
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const form = new FormData();
      form.append('companyName', companyName);
      form.append('country', country);
      form.append('companyType', companyType);
      form.append('incorporationNumber', incorporationNumber);
      form.append('taxNumber', taxNumber);
      form.append('street', street);
      form.append('city', city);
      form.append('stateRegion', stateRegion);
      form.append('officeCountry', officeCountry);
      form.append('repFirstName', repFirstName);
      form.append('repLastName', repLastName);
      form.append('repDocType', repDocType);
      form.append('repDocNumber', repDocNumber);
      form.append('repEmail', repEmail);
      form.append('repPhone', repPhone);
      form.append('shareholders', JSON.stringify(shareholders));
      if (incorporationCert) form.append('incorporationCertificate', incorporationCert);
      if (taxDoc) form.append('taxDocument', taxDoc);
      if (proofAddress) form.append('proofOfAddress', proofAddress);
      if (repIdDoc) form.append('representativeId', repIdDoc);
      if (shareholdersCert) form.append('shareholdersCertificate', shareholdersCert);

      await apiFetch('/verification/kyb/submit', {
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
          <BuildingOffice2Icon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">Sign in to view LP Business verification</p>
        </div>
      </div>
    );
  }

  if (accountType === 'INDIVIDUAL') {
    return (
      <div className="flex items-center justify-center h-full min-h-[80vh]">
        <div className="text-center p-8 max-w-md">
          <LockClosedIcon className="w-16 h-16 mx-auto mb-4 text-amber-500/60" />
          <h2 className="text-2xl font-bold text-white mb-2">Business Accounts Only</h2>
          <p className="text-gray-400 mb-6">Individual investors use LP Individuals verification.</p>
          <Link href="/digital-id/limited-partner-individuals">
            <button className="btn-primary">Go to LP Individuals</button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Verified ────────────────────────────────────────────────────────────────

  if (isVerified) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-2 text-sm">
              <Link href="/digital-id" className="text-gray-400 hover:text-white">Digital ID</Link>
              <span className="text-gray-600">/</span>
              <span className="text-white">LP Business</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Business Entity Verification</h1>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NFTDisplayCard type="lpBusiness" address={address} />
            <div className="space-y-4">
              <div className="card p-6 bg-purple-900/20 border-purple-700/50">
                <div className="flex items-center gap-4">
                  <CheckBadgeIcon className="w-12 h-12 text-purple-400" />
                  <div>
                    <p className="text-lg font-semibold text-white">Business LP Verified</p>
                    <p className="text-gray-400 text-sm">LP_Business NFT minted — Tier 2 active</p>
                  </div>
                </div>
              </div>
              <div className="card p-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-400">Quick Access</h4>
                {[
                  { href: '/investments/market-lps', label: 'LP Market Pools' },
                  { href: '/digital-id/credit-score', label: 'Request Credit Score' },
                  { href: '/funding', label: 'Business Funding' },
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

  // ── Submitted / pending ─────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="card p-8 text-center space-y-4 bg-amber-900/10 border-amber-700/30">
            <ClockIcon className="w-14 h-14 mx-auto text-amber-400" />
            <h2 className="text-2xl font-bold text-white">Application Submitted</h2>
            <p className="text-gray-400">
              Your business documentation has been received. Our compliance team will review it and issue the LP_Business NFT upon approval.
            </p>
            <p className="text-amber-300 text-sm">Typical review time: 2–5 business days</p>
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

  // ── Unverified ──────────────────────────────────────────────────────────────

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2 text-sm">
              <Link href="/digital-id" className="text-gray-400 hover:text-white">Digital ID</Link>
              <span className="text-gray-600">/</span>
              <span className="text-white">LP Business</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">Business Entity Verification</h1>
            <p className="text-gray-400 text-sm">Submit company documentation for admin review to receive the LP_Business NFT (Tier 2)</p>
          </div>
          <Image
            src={getIPFSUrl('bafkreiejesvgsvohwvv7q5twszrbu5z6dnpke6sg5cdiwgn2rq7dilu33m')}
            alt="LP Business NFT" width={72} height={72}
            className="rounded-2xl opacity-50 grayscale"
            onError={(e) => { e.currentTarget.src = '/NFTs/Convexo_lps.png'; }}
          />
        </div>

        {/* Landing card / form */}
        {!showForm ? (
          <div className="card p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <BuildingOffice2Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">KYB Verification</h3>
                <p className="text-gray-400 text-sm">Corporate documents reviewed by our compliance team</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-300">
              {[
                'Certificate of Incorporation',
                'Tax document (RUT / EIN / VAT)',
                'Proof of registered office address',
                'Legal representative ID',
                'Shareholder structure & certificate',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <DocumentTextIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowForm(true)}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Start KYB Verification
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Full form */
          <div className="space-y-6">

            {/* 1 — Company Information */}
            <div className="card p-6 space-y-5">
              <SectionTitle icon={BuildingOffice2Icon} title="Company Information" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Company Name" required value={companyName} onChange={setCompanyName} placeholder="Acme Corp S.A.S." />
                <SelectField
                  label="Country of Incorporation" required value={country}
                  onChange={(v) => { setCountry(v); setCompanyType(''); }}
                  options={['CO', 'US', 'EU', 'CN', 'OTHER']}
                />
                <SelectField
                  label="Type of Company" required value={companyType} onChange={setCompanyType}
                  options={COMPANY_TYPES[country] ?? COMPANY_TYPES.OTHER}
                />
                <InputField label="Incorporation Number" required value={incorporationNumber} onChange={setIncorporationNumber} placeholder="NIT / Registration No." />
                <InputField
                  label={country ? `Tax Number (${TAX_DOC_LABEL[country] ?? 'Tax ID'})` : 'Tax Number'}
                  required value={taxNumber} onChange={setTaxNumber} placeholder="e.g. 900.123.456-7"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <FileField label="Certificate of Incorporation" hint="Official corporate registration document" required file={incorporationCert} onChange={setIncorporationCert} />
                <FileField label={country ? TAX_DOC_LABEL[country] : 'Tax Document'} hint="Official tax registration certificate" required file={taxDoc} onChange={setTaxDoc} />
              </div>
            </div>

            {/* 2 — Office Address */}
            <div className="card p-6 space-y-5">
              <SectionTitle icon={BuildingOffice2Icon} title="Registered Office Address" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <InputField label="Street Address" required value={street} onChange={setStreet} placeholder="Calle 100 # 15-20" />
                </div>
                <InputField label="City" required value={city} onChange={setCity} placeholder="Bogotá" />
                <InputField label="State / Department" value={stateRegion} onChange={setStateRegion} placeholder="Cundinamarca" />
                <InputField label="Country" required value={officeCountry} onChange={setOfficeCountry} placeholder="Colombia" />
              </div>
              <FileField label="Proof of Address" hint="Utility bill or bank statement (max 3 months old)" required file={proofAddress} onChange={setProofAddress} />
            </div>

            {/* 3 — Legal Representative */}
            <div className="card p-6 space-y-5">
              <SectionTitle icon={UserIcon} title="Legal Representative" subtitle="Person authorised to act on behalf of the company" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="First Name" required value={repFirstName} onChange={setRepFirstName} placeholder="Juan" />
                <InputField label="Last Name" required value={repLastName} onChange={setRepLastName} placeholder="García" />
                <SelectField
                  label="Document Type" required value={repDocType} onChange={setRepDocType}
                  options={['Cédula de Ciudadanía', 'Passport', 'Cédula de Extranjería', 'NIT', 'SSN', 'Driver\'s License']}
                />
                <InputField label="Document Number" required value={repDocNumber} onChange={setRepDocNumber} placeholder="1.234.567.890" />
                <InputField label="Email" required value={repEmail} onChange={setRepEmail} placeholder="rep@company.com" type="email" />
                <InputField label="Phone / Mobile" value={repPhone} onChange={setRepPhone} placeholder="+57 300 123 4567" type="tel" />
              </div>
              <FileField label="Representative's ID Document" hint="Passport or national ID" required file={repIdDoc} onChange={setRepIdDoc} />
            </div>

            {/* 4 — Shareholders */}
            <div className="card p-6 space-y-5">
              <SectionTitle icon={UserIcon} title="Shareholders" subtitle="Add all shareholders with 5% or more participation" />

              <div className="space-y-4">
                {shareholders.map((sh, idx) => (
                  <div key={sh.id} className="p-4 bg-gray-800/40 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-400">Shareholder {idx + 1}</p>
                      {shareholders.length > 1 && (
                        <button onClick={() => removeShareholder(sh.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <InputField label="Full Name" required value={sh.name} onChange={(v) => updateShareholder(sh.id, 'name', v)} placeholder="María López" />
                      <SelectField
                        label="Type of ID" required value={sh.idType} onChange={(v) => updateShareholder(sh.id, 'idType', v)}
                        options={['Cédula de Ciudadanía', 'Passport', 'Cédula de Extranjería', 'NIT', 'SSN', 'Driver\'s License']}
                      />
                      <InputField label="ID Number" required value={sh.idNumber} onChange={(v) => updateShareholder(sh.id, 'idNumber', v)} placeholder="98.765.432" />
                      <InputField label="Nationality" required value={sh.nationality} onChange={(v) => updateShareholder(sh.id, 'nationality', v)} placeholder="Colombian" />
                      <InputField label="Participation %" required value={sh.participation} onChange={(v) => updateShareholder(sh.id, 'participation', v)} placeholder="51%" />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addShareholder}
                className="flex items-center gap-2 px-4 py-2 text-sm text-purple-400 border border-purple-500/40 hover:border-purple-500 rounded-lg transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Shareholder
              </button>

              <FileField
                label="Certificate of Shareholders"
                hint="Official document showing shareholder structure and ownership percentages"
                file={shareholdersCert}
                onChange={setShareholdersCert}
              />
            </div>

            {/* Submit */}
            {submitError && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3">
                {submitError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!canSubmit || isSubmitting}
                onClick={handleSubmit}
                className="flex-1 px-5 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
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

        {/* Benefits */}
        {!showForm && (
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Tier 2 Business Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: 'LP Pool Access', desc: 'Trade in USDC/ECOP and compliant pools' },
                { title: 'B2B E-Contracts', desc: 'Structured business agreements on-chain' },
                { title: 'Business Funding', desc: 'E-loans and funding requests (Tier 3)' },
                { title: 'Credit Score', desc: 'AI-powered corporate credit analysis' },
                { title: 'OTC Trading', desc: 'Large-volume over-the-counter trades' },
                { title: 'Vault Investments', desc: 'Tokenized bond vaults' },
              ].map(({ title, desc }) => (
                <div key={title} className="p-3 bg-gray-800/40 rounded-lg">
                  <p className="font-medium text-white text-sm">{title}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security notice */}
        {!showForm && (
          <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4 flex gap-3">
            <ShieldCheckIcon className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-purple-200 font-medium text-sm">Secure & Compliant</p>
              <p className="text-purple-300/70 text-xs mt-0.5">
                All corporate documents are encrypted in transit. Convexo's compliance team reviews each KYB application manually before issuing the NFT.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
