'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import { useOnboarding, type AccountType } from '@/lib/hooks/useOnboarding';
import { useNavigation } from '@/lib/contexts/NavigationContext';
import { apiFetch } from '@/lib/api/client';
import { usePrivy } from '@privy-io/react-auth';
import {
  UserIcon,
  BuildingOffice2Icon,
  CheckIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  IdentificationIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

interface IndividualProfile {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  countryOfResidence: string;
  telegram: string;
  twitter: string;
  linkedin: string;
}

interface BusinessProfile {
  companyName: string;
  legalName: string;
  taxId: string;
  registrationNumber: string;
  industry: string;
  companySize: string;
  foundedYear: string;
  website: string;
  description: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
  email: string;
  phone: string;
  telegram: string;
  linkedin: string;
  repFirstName: string;
  repLastName: string;
  repTitle: string;
  repEmail: string;
  repPhone: string;
}

const defaultIndividual: IndividualProfile = {
  firstName: '',
  lastName: '',
  displayName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  nationality: '',
  countryOfResidence: '',
  telegram: '',
  twitter: '',
  linkedin: '',
};

const defaultBusiness: BusinessProfile = {
  companyName: '',
  legalName: '',
  taxId: '',
  registrationNumber: '',
  industry: '',
  companySize: '',
  foundedYear: '',
  website: '',
  description: '',
  country: '',
  city: '',
  address: '',
  postalCode: '',
  email: '',
  phone: '',
  telegram: '',
  linkedin: '',
  repFirstName: '',
  repLastName: '',
  repTitle: '',
  repEmail: '',
  repPhone: '',
};

/* ------------------------------------------------------------------ */
/* Progress bar                                                         */
/* ------------------------------------------------------------------ */

function StepProgress({ current }: { current: number }) {
  const steps = ['Account Type', 'Profile Details', 'Verification Path'];
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const active = stepNum === current;
        const done = stepNum < current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              done ? 'bg-emerald-600 text-white' :
              active ? 'bg-purple-600 text-white ring-4 ring-purple-500/30' :
              'bg-gray-700 text-gray-400'
            }`}>
              {done ? <CheckIcon className="w-4 h-4" /> : stepNum}
            </div>
            <span className={`text-sm hidden sm:inline ${active ? 'text-white font-medium' : done ? 'text-emerald-400' : 'text-gray-500'}`}>
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-1 ${stepNum < current ? 'bg-emerald-600' : 'bg-gray-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1 — Choose Account Type                                        */
/* ------------------------------------------------------------------ */

function StepTypePicker({
  selected,
  onSelect,
  onContinue,
  isSubmitting,
}: {
  selected: AccountType | null;
  onSelect: (t: AccountType) => void;
  onContinue: () => void;
  isSubmitting: boolean;
}) {
  const options: { type: AccountType; icon: typeof UserIcon; title: string; desc: string; unlocks: string }[] = [
    {
      type: 'INDIVIDUAL',
      icon: UserIcon,
      title: 'Individual',
      desc: 'For personal investing and identity verification.',
      unlocks: 'Unlocks: Trade, Investments',
    },
    {
      type: 'BUSINESS',
      icon: BuildingOffice2Icon,
      title: 'Business',
      desc: 'For companies and funds.',
      unlocks: 'Unlocks: Trade, Investments, Funding, Credit Lines',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white text-center mb-2">Choose your account type</h2>
      <p className="text-gray-400 text-center mb-8">This determines your verification path and available features.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {options.map((opt) => {
          const active = selected === opt.type;
          return (
            <button
              key={opt.type}
              onClick={() => onSelect(opt.type)}
              className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
                active
                  ? 'border-purple-500 bg-purple-900/20 ring-4 ring-purple-500/20'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                active ? 'bg-purple-600' : 'bg-gray-700'
              }`}>
                <opt.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">{opt.title}</h3>
              <p className="text-sm text-gray-400 mb-3">{opt.desc}</p>
              <p className="text-xs text-purple-400 font-medium">{opt.unlocks}</p>
            </button>
          );
        })}
      </div>

      <button
        onClick={onContinue}
        disabled={!selected || isSubmitting}
        className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : (
          <>Continue <ArrowRightIcon className="w-4 h-4" /></>
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 — Profile Form (Individual)                                  */
/* ------------------------------------------------------------------ */

function IndividualForm({
  data,
  onChange,
  onSubmit,
  isSubmitting,
  error,
}: {
  data: IndividualProfile;
  onChange: (d: IndividualProfile) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const set = (field: keyof IndividualProfile, value: string) =>
    onChange({ ...data, [field]: value });

  const isValid = data.firstName.trim() && data.lastName.trim();

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white text-center mb-2">Personal Details</h2>
      <p className="text-gray-400 text-center mb-8">Fields marked with * are required.</p>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-400 text-sm">{error}</div>
      )}

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">First Name *</label>
            <input type="text" value={data.firstName} onChange={(e) => set('firstName', e.target.value)}
              placeholder="John" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Last Name *</label>
            <input type="text" value={data.lastName} onChange={(e) => set('lastName', e.target.value)}
              placeholder="Doe" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Display Name</label>
          <input type="text" value={data.displayName} onChange={(e) => set('displayName', e.target.value)}
            placeholder="John Doe (shown publicly)" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <input type="email" value={data.email} onChange={(e) => set('email', e.target.value)}
              placeholder="john@example.com" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Phone</label>
            <input type="tel" value={data.phone} onChange={(e) => set('phone', e.target.value)}
              placeholder="+57 300 000 0000" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Date of Birth</label>
          <input type="date" value={data.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Nationality (ISO 2)</label>
            <input type="text" value={data.nationality} onChange={(e) => set('nationality', e.target.value.toUpperCase().slice(0, 2))}
              placeholder="CO" maxLength={2} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Country of Residence (ISO 2)</label>
            <input type="text" value={data.countryOfResidence} onChange={(e) => set('countryOfResidence', e.target.value.toUpperCase().slice(0, 2))}
              placeholder="CO" maxLength={2} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
          </div>
        </div>

        {/* Social links */}
        <div className="border-t border-gray-700 pt-5">
          <p className="text-sm font-medium text-gray-300 mb-4">Social Links <span className="text-gray-500 font-normal">(optional)</span></p>
          <div className="space-y-3">
            <input type="text" value={data.telegram} onChange={(e) => set('telegram', e.target.value)}
              placeholder="Telegram @username" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
            <input type="text" value={data.twitter} onChange={(e) => set('twitter', e.target.value)}
              placeholder="X / Twitter @handle" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
            <input type="text" value={data.linkedin} onChange={(e) => set('linkedin', e.target.value)}
              placeholder="LinkedIn profile URL" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
          </div>
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={!isValid || isSubmitting}
        className="w-full mt-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : (
          <>Save & Continue <ArrowRightIcon className="w-4 h-4" /></>
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 — Profile Form (Business)                                    */
/* ------------------------------------------------------------------ */

function BusinessForm({
  data,
  onChange,
  onSubmit,
  isSubmitting,
  error,
}: {
  data: BusinessProfile;
  onChange: (d: BusinessProfile) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const set = (field: keyof BusinessProfile, value: string) =>
    onChange({ ...data, [field]: value });

  const isValid =
    data.companyName.trim() && data.taxId.trim() &&
    data.repFirstName.trim() && data.repLastName.trim() && data.repEmail.trim();

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white text-center mb-2">Company Details</h2>
      <p className="text-gray-400 text-center mb-8">Fields marked with * are required.</p>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-400 text-sm">{error}</div>
      )}

      <div className="space-y-5">
        {/* Company Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Company Name *</label>
            <input type="text" value={data.companyName} onChange={(e) => set('companyName', e.target.value)}
              placeholder="Acme Corp" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Legal Name</label>
            <input type="text" value={data.legalName} onChange={(e) => set('legalName', e.target.value)}
              placeholder="Acme Corporation S.A.S." className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Tax ID *</label>
            <input type="text" value={data.taxId} onChange={(e) => set('taxId', e.target.value)}
              placeholder="900123456-7" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Registration Number</label>
            <input type="text" value={data.registrationNumber} onChange={(e) => set('registrationNumber', e.target.value)}
              placeholder="ABC-12345" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Industry</label>
            <input type="text" value={data.industry} onChange={(e) => set('industry', e.target.value)}
              placeholder="Fintech" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Company Size</label>
            <select value={data.companySize} onChange={(e) => set('companySize', e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none">
              <option value="">Select size</option>
              <option value="MICRO">Micro (1-10)</option>
              <option value="SMALL">Small (11-50)</option>
              <option value="MEDIUM">Medium (51-250)</option>
              <option value="LARGE">Large (250+)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Founded Year</label>
            <input type="number" value={data.foundedYear} onChange={(e) => set('foundedYear', e.target.value)}
              placeholder="2020" min={1800} max={new Date().getFullYear()} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Website</label>
          <input type="url" value={data.website} onChange={(e) => set('website', e.target.value)}
            placeholder="https://company.com" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Description</label>
          <textarea value={data.description} onChange={(e) => set('description', e.target.value)}
            placeholder="Brief description of your company..." rows={3}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Company Email</label>
            <input type="email" value={data.email} onChange={(e) => set('email', e.target.value)}
              placeholder="contact@company.com" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Company Phone</label>
            <input type="tel" value={data.phone} onChange={(e) => set('phone', e.target.value)}
              placeholder="+57 1 234 5678" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Country (ISO 2)</label>
            <input type="text" value={data.country} onChange={(e) => set('country', e.target.value.toUpperCase().slice(0, 2))}
              placeholder="CO" maxLength={2} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">City</label>
            <input type="text" value={data.city} onChange={(e) => set('city', e.target.value)}
              placeholder="Bogotá" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Address</label>
            <input type="text" value={data.address} onChange={(e) => set('address', e.target.value)}
              placeholder="Cra 7 #123" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Postal Code</label>
            <input type="text" value={data.postalCode} onChange={(e) => set('postalCode', e.target.value)}
              placeholder="110111" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
          </div>
        </div>

        {/* Social links */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Telegram</label>
          <input type="text" value={data.telegram} onChange={(e) => set('telegram', e.target.value)}
            placeholder="@company" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">LinkedIn</label>
          <input type="text" value={data.linkedin} onChange={(e) => set('linkedin', e.target.value)}
            placeholder="https://linkedin.com/company/..." className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
        </div>

        {/* Representative */}
        <div className="border-t border-gray-700 pt-5 mt-5">
          <p className="text-sm font-medium text-gray-300 mb-4">Legal Representative</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">First Name *</label>
              <input type="text" value={data.repFirstName} onChange={(e) => set('repFirstName', e.target.value)}
                placeholder="María" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Last Name *</label>
              <input type="text" value={data.repLastName} onChange={(e) => set('repLastName', e.target.value)}
                placeholder="García" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Title</label>
              <input type="text" value={data.repTitle} onChange={(e) => set('repTitle', e.target.value)}
                placeholder="CEO" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email *</label>
              <input type="email" value={data.repEmail} onChange={(e) => set('repEmail', e.target.value)}
                placeholder="rep@company.com" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Phone</label>
              <input type="tel" value={data.repPhone} onChange={(e) => set('repPhone', e.target.value)}
                placeholder="+57 300 000 0000" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={!isValid || isSubmitting}
        className="w-full mt-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : (
          <>Save & Continue <ArrowRightIcon className="w-4 h-4" /></>
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 3 — Verification Path                                          */
/* ------------------------------------------------------------------ */

function StepPathGuide({ accountType }: { accountType: AccountType }) {
  const router = useRouter();

  const individualPath = [
    { icon: ShieldCheckIcon, label: 'Humanity Passport', detail: 'ZKPassport → CONVEXO_PASSPORT NFT', tier: 'Tier 1', color: 'emerald' },
    { icon: IdentificationIcon, label: 'LP Individuals', detail: 'Veriff KYC → LP_INDIVIDUALS NFT → Trade + Invest', tier: 'Tier 2', color: 'blue' },
  ];

  const businessPath = [
    { icon: ShieldCheckIcon, label: 'Humanity Passport', detail: 'ZKPassport → CONVEXO_PASSPORT NFT', tier: 'Tier 1', color: 'emerald' },
    { icon: BuildingOffice2Icon, label: 'LP Business', detail: 'Sumsub KYB → LP_BUSINESS NFT → Trade + Invest', tier: 'Tier 2', color: 'blue' },
    { icon: SparklesIcon, label: 'Credit Score', detail: 'AI Analysis → ECREDITSCORING NFT → Funding + Credit', tier: 'Tier 3', color: 'purple' },
  ];

  const path = accountType === 'INDIVIDUAL' ? individualPath : businessPath;

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-600/20 flex items-center justify-center">
        <CheckIcon className="w-8 h-8 text-emerald-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Profile saved!</h2>
      <p className="text-gray-400 mb-10">Here&apos;s how to unlock full access.</p>

      {/* Vertical roadmap */}
      <div className="relative mx-auto max-w-md text-left">
        {/* Connecting line */}
        <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gray-700" />

        <div className="space-y-8">
          {path.map((step, i) => {
            const colorClasses: Record<string, string> = {
              emerald: 'bg-emerald-600/20 text-emerald-400 border-emerald-700/50',
              blue: 'bg-blue-600/20 text-blue-400 border-blue-700/50',
              purple: 'bg-purple-600/20 text-purple-400 border-purple-700/50',
            };
            return (
              <div key={i} className="relative flex items-start gap-4 pl-0">
                <div className={`z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${colorClasses[step.color]}`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white font-semibold">{step.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">{step.tier}</span>
                  </div>
                  <p className="text-sm text-gray-400">{step.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-10 space-y-3">
        <button
          onClick={() => router.push('/digital-id')}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors flex items-center justify-center gap-2"
        >
          Start Verification <ArrowRightIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => router.replace('/profile')}
          className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition-colors"
        >
          Explore Dashboard
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Onboarding Page                                                */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();
  const { ready } = usePrivy();
  const isSignerInit = !ready;
  const { step: onboardingStep, accountType: existingType, refetch } = useOnboarding();
  // Sync the shared NavigationContext after each step so AuthGuard always
  // reads fresh onboardingStep when the user navigates away from /onboarding.
  const { refetchAll } = useNavigation();

  // Local wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [individualData, setIndividualData] = useState<IndividualProfile>(defaultIndividual);
  const [businessData, setBusinessData] = useState<BusinessProfile>(defaultBusiness);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loading = isInitializing || isSignerInit;

  // Guard: run the initial routing check only once per mount.
  // Without this, every refetch() call (after step 1 or step 2 submit) would
  // re-trigger this effect and either redirect away or skip steps automatically.
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (loading || !isAuthenticated || onboardingStep === null) return;
    if (hasInitialized.current) return; // already ran — wizard owns step state now
    hasInitialized.current = true;

    // User already finished onboarding → go to dashboard
    if (onboardingStep !== 'NOT_STARTED' && onboardingStep !== 'TYPE_SELECTED') {
      router.replace('/profile');
      return;
    }
    // User had previously selected a type but didn't finish profile → resume at step 2
    if (onboardingStep === 'TYPE_SELECTED' && existingType) {
      setSelectedType(existingType);
      setWizardStep(2);
    }
    // NOT_STARTED → stays at step 1 (default)
  }, [loading, isAuthenticated, onboardingStep, existingType, router]);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/');
    }
  }, [loading, isAuthenticated, router]);

  /* ---- Step 1 → POST /onboarding/type ---- */
  const handleTypeSubmit = useCallback(async () => {
    if (!selectedType) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      await apiFetch('/onboarding/type', {
        method: 'POST',
        body: JSON.stringify({ accountType: selectedType }),
      });
      await refetch();
      refetchAll(); // keep NavigationContext in sync so AuthGuard sees updated step
      setWizardStep(2);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save account type');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedType, refetch, refetchAll]);

  /* ---- Step 2 → POST /onboarding/profile ---- */
  const handleProfileSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw: Record<string, any> = selectedType === 'INDIVIDUAL' ? { ...individualData } : { ...businessData };

      // Convert date input (YYYY-MM-DD) to ISO datetime for Zod .datetime()
      if (raw.dateOfBirth && !raw.dateOfBirth.includes('T')) {
        raw.dateOfBirth = `${raw.dateOfBirth}T00:00:00.000Z`;
      }

      // Convert foundedYear string to number (backend expects z.number())
      if (raw.foundedYear) {
        const y = parseInt(raw.foundedYear, 10);
        raw.foundedYear = isNaN(y) ? undefined : y;
      }

      // Strip empty optional strings so backend doesn't try to validate them
      Object.keys(raw).forEach((k) => {
        if (raw[k] === '') delete raw[k];
      });

      await apiFetch('/onboarding/profile', {
        method: 'POST',
        body: JSON.stringify(raw),
      });
      await refetch();
      refetchAll(); // keep NavigationContext in sync so AuthGuard sees PROFILE_COMPLETE
      setWizardStep(3);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedType, individualData, businessData, refetch, refetchAll]);

  // Loading state
  if (loading || (!isAuthenticated && !loading)) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex flex-col items-center justify-center gap-4">
        <Image src="/logo_convexo.png" alt="Convexo" width={48} height={48} className="object-contain opacity-70" />
        <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] flex flex-col">
      {/* Minimal header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-gray-800/50">
        <Image src="/logo_convexo.png" alt="Convexo" width={32} height={32} className="object-contain" />
        <span className="text-white font-bold">Convexo</span>
        <span className="text-gray-500 text-sm ml-2">Setup</span>
      </header>

      {/* Wizard content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <StepProgress current={wizardStep} />

        {wizardStep === 1 && (
          <StepTypePicker
            selected={selectedType}
            onSelect={setSelectedType}
            onContinue={handleTypeSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {wizardStep === 2 && selectedType === 'INDIVIDUAL' && (
          <IndividualForm
            data={individualData}
            onChange={setIndividualData}
            onSubmit={handleProfileSubmit}
            isSubmitting={isSubmitting}
            error={formError}
          />
        )}

        {wizardStep === 2 && selectedType === 'BUSINESS' && (
          <BusinessForm
            data={businessData}
            onChange={setBusinessData}
            onSubmit={handleProfileSubmit}
            isSubmitting={isSubmitting}
            error={formError}
          />
        )}

        {wizardStep === 3 && selectedType && (
          <StepPathGuide accountType={selectedType} />
        )}
      </main>
    </div>
  );
}
