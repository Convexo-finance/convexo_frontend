'use client';

import { useState, useEffect, useRef } from 'react';
import {
  useAccount,
  useChainId,
  useReadContract,
  usePublicClient,
  useWaitForTransactionReceipt,
} from '@/lib/wagmi/compat';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { useConvexoWrite } from '@/lib/hooks/useConvexoWrite';
import { getContractsForChain, getBlockExplorerUrl } from '@/lib/contracts/addresses';
import { ConvexoPassportABI } from '@/lib/contracts/abis';
import { IS_MAINNET } from '@/lib/config/network';
import {
  createPassportMetadata,
  uploadMetadataToPinata,
  type PassportTraits as PinataPassportTraits,
} from '@/lib/config/pinata';
import {
  ShieldCheckIcon,
  FingerPrintIcon,
  CheckBadgeIcon,
  LockClosedIcon,
  GlobeAltIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { ZKPassport, type SolidityVerifierParameters, type SupportedChain } from '@zkpassport/sdk';

// ─── Constants ────────────────────────────────────────────────────────────────

const ZK_CHAIN_MAP: Record<number, SupportedChain> = {
  1:         'ethereum',
  8453:      'base',
  11155111:  'ethereum_sepolia',
  84532:     'base_sepolia',
  42161:     'arbitrum',
  421614:    'arbitrum_sepolia',
};

// Must match Convexo_Passport.APP_DOMAIN exactly — hardcoded to match the
// on-chain constant. Using window.location.origin breaks preview/localhost.
const APP_DOMAIN = process.env.NEXT_PUBLIC_ZKPASSPORT_DOMAIN ?? 'protocol.convexo.xyz';

// Must match Convexo_Passport.APP_SCOPE exactly
const APP_SCOPE_STRING = 'convexo-passport-identity';

// ISO 3166-1 alpha-3 codes, alphabetically sorted (ZKPassport Merkle requirement).
// Must match Convexo_Passport._getSanctionedCountries() exactly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CONVEXO_SANCTIONED_COUNTRIES: any[] = [
  'AFG', 'BLR', 'CAF', 'COD', 'CUB', 'IRN', 'IRQ', 'LBY', 'MLI', 'MMR',
  'NIC', 'PRK', 'RUS', 'SDN', 'SOM', 'SSD', 'SYR', 'VEN', 'YEM', 'ZWE',
];

// What we actually request from ZKPassport — kept in sync with generateProof().
const VERIFICATION_CHECKS = [
  {
    icon: FingerPrintIcon,
    label: 'Age 18+',
    detail: 'ZK-proven — your birthdate is never revealed',
    color: 'text-purple-400',
    bg: 'bg-purple-900/20',
  },
  {
    icon: ShieldCheckIcon,
    label: 'Sanctions clear',
    detail: 'US, UK, EU, and CH sanction lists',
    color: 'text-emerald-400',
    bg: 'bg-emerald-900/20',
  },
  {
    icon: GlobeAltIcon,
    label: 'Nationality compliance',
    detail: 'Not from a restricted jurisdiction',
    color: 'text-blue-400',
    bg: 'bg-blue-900/20',
  },
  {
    icon: CheckBadgeIcon,
    label: 'Valid document',
    detail: 'Passport or national ID not expired',
    color: 'text-amber-400',
    bg: 'bg-amber-900/20',
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface PassportTraits {
  uniqueIdentifier: string;
  kycVerified: boolean;
  sanctionsPassed: boolean;
  isOver18: boolean;
  nationalityCompliant: boolean;
  zkPassportTimestamp: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  zkPassportResult: any;
  solidityParams: SolidityVerifierParameters | null;
  // UTC date (YYYY-MM-DD) stamped at proof receipt — used to detect day-boundary staleness.
  // The proof commits to today's UTC date (YYYYMMDD); block.timestamp is compared to this
  // on-chain. If the UTC day rolled over since proof generation, claimPassport() reverts
  // with PassportExpired() even when the physical document is valid.
  proofDateUTC: string;
}

interface VerifiedIdentity {
  uniqueIdentifier: `0x${string}`;
  personhoodProof: `0x${string}`;
  verifiedAt: bigint;
  zkPassportTimestamp: bigint;
  isActive: boolean;
  kycVerified: boolean;
  sanctionsPassed: boolean;
  isOver18: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HumanityPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const publicClient = usePublicClient();
  const { hasPassportNFT, hasActivePassport } = useNFTBalance();

  const [passportTraits, setPassportTraits] = useState<PassportTraits | null>(null);
  const [identifierInput, setIdentifierInput] = useState('');
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'verifying' | 'verified' | 'minting' | 'success'>('idle');
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [verificationTimedOut, setVerificationTimedOut] = useState(false);
  const verificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collectedProofRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  const [zkPassport] = useState(() => new ZKPassport(APP_DOMAIN));

  // ── On-chain reads ───────────────────────────────────────────────────────

  const { data: hasPassport, isLoading: checkingPassport, refetch: refetchPassport } = useReadContract({
    address: contracts?.CONVEXO_PASSPORT as `0x${string}`,
    abi: ConvexoPassportABI,
    functionName: 'holdsActivePassport',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts?.CONVEXO_PASSPORT },
  }) as { data: boolean | undefined; isLoading: boolean; refetch: () => void };

  const { data: identifierUsed } = useReadContract({
    address: contracts?.CONVEXO_PASSPORT as `0x${string}`,
    abi: ConvexoPassportABI,
    functionName: 'isIdentifierUsed',
    args: identifierInput ? [identifierInput as `0x${string}`] : undefined,
    query: {
      enabled: !!identifierInput && identifierInput.startsWith('0x') && !!contracts?.CONVEXO_PASSPORT,
    },
  }) as { data: boolean | undefined };

  const { data: identity } = useReadContract({
    address: contracts?.CONVEXO_PASSPORT as `0x${string}`,
    abi: ConvexoPassportABI,
    functionName: 'getVerifiedIdentity',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts?.CONVEXO_PASSPORT && !!hasPassport },
  });

  // ── ZKPassport verification ──────────────────────────────────────────────

  const generateProof = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }
    if (!contracts?.CONVEXO_PASSPORT) {
      setError('Unsupported network. Please switch to a supported network.');
      return;
    }

    try {
      setIsGeneratingProof(true);
      setError(null);
      setStep('verifying');
      collectedProofRef.current = null;

      const queryBuilder = await zkPassport.request({
        name: 'CONVEXO PASSPORT Verification',
        logo: typeof window !== 'undefined' ? `${window.location.origin}/logo_convexo.png` : '',
        purpose: 'Verify identity for CONVEXO PASSPORT — Proof of Personhood & Compliance',
        scope: APP_SCOPE_STRING,
        mode: 'compressed-evm',
        devMode: !IS_MAINNET,
      });

      const zkChain = ZK_CHAIN_MAP[chainId] ?? 'ethereum_sepolia';

      // These four claims mirror exactly what the on-chain contract verifies.
      // Adding or removing a claim here without updating the contract will cause revert.
      const { url, onProofGenerated, onResult } = queryBuilder
        .gte('age', 18)
        .sanctions()
        .out('nationality', CONVEXO_SANCTIONED_COUNTRIES)
        .gte('expiry_date', new Date())
        .bind('user_address', address as `0x${string}`)
        .bind('chain', zkChain)
        .done();

      setVerificationUrl(url);

      onProofGenerated((proof) => {
        collectedProofRef.current = proof;
      });

      onResult(({ uniqueIdentifier: uid, verified, result }) => {
        if (verificationTimeoutRef.current) {
          clearTimeout(verificationTimeoutRef.current);
          verificationTimeoutRef.current = null;
        }
        setIsGeneratingProof(false);
        setVerificationUrl(null);

        if (!verified) {
          setError('Verification failed. Please try again.');
          setStep('idle');
          return;
        }

        const sanctionsPassed      = result?.sanctions?.passed ?? false;
        const isOver18             = result?.age?.gte?.result ?? false;
        const nationalityCompliant = result?.nationality?.out?.result ?? false;
        const isNotExpired         = result?.expiry_date?.gte?.result ?? false;

        if (!sanctionsPassed) {
          setError('Sanctions check did not pass.');
          setStep('idle');
          return;
        }
        if (!isOver18) {
          setError('Age verification failed — must be 18 or older.');
          setStep('idle');
          return;
        }
        if (!nationalityCompliant) {
          setError('Your nationality is not permitted.');
          setStep('idle');
          return;
        }
        if (!isNotExpired) {
          setError('Your passport or ID is expired.');
          setStep('idle');
          return;
        }

        let solidityParams: SolidityVerifierParameters | null = null;
        try {
          if (collectedProofRef.current) {
            solidityParams = zkPassport.getSolidityVerifierParameters({
              proof: collectedProofRef.current,
              scope: APP_SCOPE_STRING,
              devMode: !IS_MAINNET,
            });
          }
        } catch (e) {
          console.error('getSolidityVerifierParameters failed:', e);
        }

        setPassportTraits({
          uniqueIdentifier: uid ?? '',
          kycVerified: sanctionsPassed,
          sanctionsPassed,
          isOver18,
          nationalityCompliant,
          zkPassportTimestamp: Math.floor(Date.now() / 1000),
          zkPassportResult: result,
          solidityParams,
          proofDateUTC: new Date().toISOString().slice(0, 10),
        });
        setIdentifierInput(uid ?? '');
        setStep('verified');
      });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err.message || 'Failed to start ZKPassport verification.');
      setStep('idle');
      setIsGeneratingProof(false);
      setVerificationUrl(null);
    }
  };

  // ── Mint ─────────────────────────────────────────────────────────────────

  const { writeContract: mintPassport, data: hash, isPending: isMinting, error: mintError } = useConvexoWrite();
  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      setError(null);
      setPassportTraits(null);
      setIdentifierInput('');
      setStep('success');
      refetchPassport();
    }
  }, [isSuccess, refetchPassport]);

  const handleMint = async () => {
    if (!identifierInput || !contracts?.CONVEXO_PASSPORT || !passportTraits) {
      setError('Please complete verification first.');
      return;
    }

    // Proof commits to today's UTC date; block.timestamp is compared to this on-chain.
    // If the UTC day rolled over the proof is stale and will revert with PassportExpired().
    const todayUTC = new Date().toISOString().slice(0, 10);
    if (passportTraits.proofDateUTC && passportTraits.proofDateUTC !== todayUTC) {
      setError('Your proof has expired (generated on a previous day). Please verify again.');
      setPassportTraits(null);
      setIdentifierInput('');
      setStep('idle');
      return;
    }

    if (identifierUsed) {
      setError('This identifier has already been used to mint a CONVEXO PASSPORT.');
      return;
    }

    if (!IS_MAINNET) {
      const mockId = '0x0000000000000000000000000000000000000000000000000000000000000001';
      if (identifierInput === mockId || identifierInput.toLowerCase() === mockId) {
        setError(
          'The mock passport identifier is already used on this testnet contract. ' +
          'All devMode proofs share the same identifier. An admin must call clearIdentifier().'
        );
        return;
      }
    } else if (identifierUsed) {
      setError('This passport has already been used to mint a CONVEXO PASSPORT.');
      return;
    }

    if (!passportTraits.solidityParams) {
      setError('Missing ZK proof data. Please verify again.');
      setStep('idle');
      return;
    }

    setStep('minting');
    setError(null);

    try {
      const traits: PinataPassportTraits = {
        kycVerified: passportTraits.kycVerified,
        sanctionsPassed: passportTraits.sanctionsPassed,
        isOver18: passportTraits.isOver18,
        nationalityCompliant: passportTraits.nationalityCompliant,
      };
      const metadata = createPassportMetadata(Math.floor(Date.now() / 1000), traits);

      let ipfsMetadataHash: string;
      try {
        ipfsMetadataHash = await uploadMetadataToPinata(metadata);
      } catch {
        setError('Failed to upload NFT metadata. Please try again.');
        setStep('verified');
        return;
      }

      const sp = passportTraits.solidityParams;
      const zkParams = {
        version: sp.version as `0x${string}`,
        proofVerificationData: {
          vkeyHash: sp.proofVerificationData.vkeyHash as `0x${string}`,
          proof: sp.proofVerificationData.proof as `0x${string}`,
          publicInputs: sp.proofVerificationData.publicInputs as `0x${string}`[],
        },
        committedInputs: sp.committedInputs as `0x${string}`,
        serviceConfig: {
          validityPeriodInSeconds: BigInt(sp.serviceConfig.validityPeriodInSeconds),
          domain: sp.serviceConfig.domain,
          scope: sp.serviceConfig.scope,
          devMode: sp.serviceConfig.devMode,
        },
      };

      // Pre-simulate to decode the exact revert reason before sending the UserOperation.
      // wallet_prepareCalls returns a generic "execution reverted" — simulateContract
      // decodes the custom error name so we can show a clear message and skip the UO.
      if (publicClient && address) {
        try {
          await publicClient.simulateContract({
            address: contracts.CONVEXO_PASSPORT as `0x${string}`,
            abi: ConvexoPassportABI,
            functionName: 'claimPassport',
            args: [zkParams, false, ipfsMetadataHash],
            account: address,
          });
        } catch (simErr: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
          // simErr.name is the viem error class, not the Solidity error name.
          // Use message which contains the full decoded error text.
          const simMsg: string = simErr?.message ?? String(simErr);
          if (simMsg.includes('AlreadyHasPassport')) {
            setError('You already have a CONVEXO PASSPORT.');
            refetchPassport();
          } else if (simMsg.includes('IdentifierAlreadyUsed')) {
            setError('This passport identifier is already registered.' +
              (!IS_MAINNET ? ' Contact admin to reset the mock identifier.' : ''));
          } else if (simMsg.includes('ProofVerificationFailed')) {
            setError('ZK proof verification failed. Please regenerate your proof.');
          } else if (simMsg.includes('InvalidScope')) {
            setError('Proof domain/scope mismatch. Please regenerate your proof.');
          } else if (simMsg.includes('InvalidSender')) {
            setError('Proof was not generated for this wallet. Please regenerate.');
          } else if (simMsg.includes('InvalidChain')) {
            setError('Proof was generated for a different network. Please regenerate.');
          } else if (simMsg.includes('SanctionsCheckFailed')) {
            setError('Sanctions check failed onchain.');
          } else if (simMsg.includes('NationalityNotCompliant')) {
            setError('Nationality check failed onchain.');
          } else if (simMsg.includes('PassportExpired')) {
            setError('Your ZKPassport proof has expired. Please verify again to generate a fresh proof.');
            setPassportTraits(null);
            setIdentifierInput('');
            setStep('idle');
            return;
          } else {
            console.error('[claimPassport simulate error]', simErr);
            setError(`Simulation failed: ${simMsg}`);
          }
          setStep('verified');
          return;
        }
      }

      mintPassport({
        address: contracts.CONVEXO_PASSPORT,
        abi: ConvexoPassportABI,
        functionName: 'claimPassport',
        args: [zkParams, false, ipfsMetadataHash],
      });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(`Failed to prepare mint: ${err.message}`);
      setStep('verified');
    }
  };

  useEffect(() => {
    if (mintError) {
      const msg = mintError.message || mintError.toString();
      if (msg.includes('AlreadyHasPassport')) {
        setError('You already have a CONVEXO PASSPORT.');
        refetchPassport();
      } else if (msg.includes('IdentifierAlreadyUsed')) {
        setError(`This passport identifier is already registered.${!IS_MAINNET ? ' Contact admin to reset the mock identifier.' : ''}`);
      } else if (msg.includes('ProofVerificationFailed')) {
        setError('ZK proof verification failed. Please regenerate your proof.');
      } else if (msg.includes('InvalidScope')) {
        setError('Proof scope mismatch. Please regenerate your proof.');
      } else if (msg.includes('InvalidSender')) {
        setError('Proof was not generated for this wallet. Please regenerate.');
      } else if (msg.includes('InvalidChain')) {
        setError('Proof was generated for a different network. Please regenerate.');
      } else if (msg.includes('SanctionsCheckFailed')) {
        setError('Sanctions check failed onchain.');
      } else if (msg.includes('NationalityNotCompliant')) {
        setError('Nationality check failed onchain.');
      } else if (msg.includes('PassportExpired')) {
        setError('Your ZKPassport proof has expired. Please verify again to generate a fresh proof.');
        setPassportTraits(null);
        setIdentifierInput('');
        setStep('idle');
      } else if (msg.includes('execution reverted')) {
        setError(
          !IS_MAINNET
            ? 'Transaction reverted. On testnet this is usually the mock identifier already in use — contact admin to call clearIdentifier().'
            : 'Transaction reverted. Possible causes: proof expired, identifier already used, or verification failed.'
        );
      } else {
        setError(msg);
      }
      if (step !== 'idle') setStep('verified');
    }
  }, [mintError, refetchPassport, step]);

  // 5-minute timeout on QR scan wait
  useEffect(() => {
    if (step === 'verifying') {
      setVerificationTimedOut(false);
      verificationTimeoutRef.current = setTimeout(() => setVerificationTimedOut(true), 5 * 60 * 1000);
    } else {
      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
        verificationTimeoutRef.current = null;
      }
      setVerificationTimedOut(false);
    }
    return () => {
      if (verificationTimeoutRef.current) clearTimeout(verificationTimeoutRef.current);
    };
  }, [step]);

  const handleRetry = () => {
    if (verificationTimeoutRef.current) clearTimeout(verificationTimeoutRef.current);
    setStep('idle');
    setVerificationUrl(null);
    setVerificationTimedOut(false);
    setError(null);
    setIsGeneratingProof(false);
    collectedProofRef.current = null;
  };

  const handleCopy = () => {
    if (passportTraits?.uniqueIdentifier) {
      navigator.clipboard.writeText(passportTraits.uniqueIdentifier);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyUrl = () => {
    if (verificationUrl) {
      navigator.clipboard.writeText(verificationUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    }
  };

  const isLoading = isGeneratingProof || isMinting || isWaiting || checkingPassport;

  // ── Breadcrumb ────────────────────────────────────────────────────────────

  const Breadcrumb = () => (
    <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
      <Link href="/digital-id" className="hover:text-white transition-colors">Digital ID</Link>
      <span>/</span>
      <span className="text-white">CONVEXO PASSPORT</span>
    </div>
  );

  // ── Guard: wallet not connected ───────────────────────────────────────────

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Breadcrumb />
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-8 text-center">
          <LockClosedIcon className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <p className="font-semibold text-gray-900 dark:text-white text-lg">Connect your wallet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Required to generate and bind the ZKPassport proof to your address.
          </p>
        </div>
      </div>
    );
  }

  // ── Guard: loading ────────────────────────────────────────────────────────

  if (checkingPassport) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="animate-pulse space-y-4">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto" />
          <p className="text-gray-500 dark:text-gray-400">Checking passport status…</p>
        </div>
      </div>
    );
  }

  // ── Already verified ──────────────────────────────────────────────────────

  if (hasPassport && identity) {
    const id = identity as VerifiedIdentity;
    const shortId = id.uniqueIdentifier
      ? `${id.uniqueIdentifier.slice(0, 10)}…${id.uniqueIdentifier.slice(-8)}`
      : '—';
    const verifiedDate = new Date(Number(id.verifiedAt) * 1000).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Breadcrumb />

        <div>
          <h1 className="text-3xl font-bold text-white">CONVEXO PASSPORT</h1>
          <p className="text-gray-400 mt-1">Your verified digital identity — Tier 1 active</p>
        </div>

        {/* Passport Card */}
        <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 shadow-2xl shadow-emerald-900/20">
          {/* Card header strip */}
          <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold tracking-widest text-xs uppercase">Convexo Protocol</p>
                <p className="text-emerald-200 text-xs">Digital Passport</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-white/20 text-white text-xs font-bold rounded-full tracking-wider">
              TIER 1
            </span>
          </div>

          {/* Card body */}
          <div className="bg-gradient-to-br from-[#0a1a12] to-[#0f1a16] px-6 py-5 flex gap-5">
            {/* NFT image */}
            <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 border-emerald-500/40">
              <Image
                src="/NFTs/convexo_zkpassport.png"
                alt="Convexo Passport NFT"
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            </div>

            {/* Identity fields */}
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <p className="text-xs text-emerald-500/70 uppercase tracking-widest mb-0.5">Holder</p>
                <p className="text-white font-mono text-sm truncate">
                  {address ? `${address.slice(0, 12)}…${address.slice(-8)}` : '—'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-emerald-500/70 uppercase tracking-widest mb-0.5">Status</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-emerald-400 text-sm font-semibold">
                      {id.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-emerald-500/70 uppercase tracking-widest mb-0.5">Verified</p>
                  <p className="text-gray-300 text-sm">{verifiedDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification checks */}
          <div className="bg-[#0d1a10] border-t border-emerald-900/50 px-6 py-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'KYC', ok: id.kycVerified },
                { label: 'Sanctions', ok: id.sanctionsPassed },
                { label: 'Age 18+', ok: id.isOver18 },
                { label: 'Nationality', ok: true },
              ].map(({ label, ok }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${ok ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                    <span className={`text-sm ${ok ? 'text-emerald-400' : 'text-red-400'}`}>{ok ? '✓' : '✗'}</span>
                  </div>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card footer */}
          <div className="bg-[#091510] border-t border-emerald-900/40 px-6 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-500/50 uppercase tracking-widest">Unique ID</p>
              <p className="text-gray-400 font-mono text-xs mt-0.5">{shortId}</p>
            </div>
            <a
              href={`${getBlockExplorerUrl(chainId)}/token/${contracts?.CONVEXO_PASSPORT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View on Explorer
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Error banner ──────────────────────────────────────────────────────────

  const ErrorBanner = () =>
    error ? (
      <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
      </div>
    ) : null;

  // ── Unverified — main flow ────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CONVEXO PASSPORT</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Tier 1 · Identity verification via ZKPassport
          </p>
        </div>
        <Image
          src="/NFTs/convexo_zkpassport.png"
          alt="CONVEXO PASSPORT NFT"
          width={72}
          height={72}
          className="rounded-xl opacity-60 grayscale"
        />
      </div>

      <ErrorBanner />

      {/* ── IDLE — start screen ─────────────────────────────────────────── */}
      {step === 'idle' && (
        <div className="space-y-4">
          {/* What we verify */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">What gets verified</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              ZKPassport reads your passport&apos;s NFC chip and generates a zero-knowledge proof.
              None of your personal data is stored — only the proof result goes onchain.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VERIFICATION_CHECKS.map(({ icon: Icon, label, detail, color, bg }) => (
                <div key={label} className={`flex items-start gap-3 p-3 ${bg} rounded-lg`}>
                  <Icon className={`h-5 w-5 ${color} flex-shrink-0 mt-0.5`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <LockClosedIcon className="h-3.5 w-3.5" />
              Name, birthdate, nationality, and document number are never stored anywhere.
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={generateProof}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {isGeneratingProof ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Starting…
              </span>
            ) : (
              'Start Verification'
            )}
          </button>
        </div>
      )}

      {/* ── VERIFYING — QR code ─────────────────────────────────────────── */}
      {step === 'verifying' && verificationUrl && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center space-y-5">
          <div>
            <FingerPrintIcon className="h-10 w-10 text-blue-500 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Scan with ZKPassport</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Open the ZKPassport app on your phone and scan this QR code
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border-2 border-gray-100 dark:border-gray-700 inline-block">
            <QRCodeSVG value={verificationUrl} size={260} level="H" includeMargin />
          </div>

          <div className="space-y-2 max-w-sm mx-auto">
            <p className="text-xs text-gray-400">On mobile? Open the link directly:</p>
            <div className="flex gap-2">
              <a
                href={verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                Open ZKPassport
              </a>
              <button
                onClick={handleCopyUrl}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors"
              >
                {urlCopied
                  ? <ClipboardDocumentCheckIcon className="h-4 w-4 text-emerald-500" />
                  : <ClipboardDocumentIcon className="h-4 w-4" />}
                {urlCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {verificationTimedOut ? (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-left">
              <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">Verification timed out</p>
              <p className="text-xs text-red-600 dark:text-red-300 mb-3">
                The proof was not received. Check your connection and try again.
              </p>
              <button
                onClick={handleRetry}
                className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600" />
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Waiting for proof…</p>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-300 mb-3">
                Complete the scan in the ZKPassport app
              </p>
              <button
                onClick={handleRetry}
                className="text-xs text-amber-600 dark:text-amber-400 underline"
              >
                Cancel and start over
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── VERIFIED — mint step ─────────────────────────────────────────── */}
      {step === 'verified' && passportTraits && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          {/* Proof result */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckBadgeIcon className="h-5 w-5 text-emerald-500" />
              <p className="font-semibold text-emerald-800 dark:text-emerald-200">Proof generated</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { label: 'Age 18+', ok: passportTraits.isOver18 },
                { label: 'Sanctions clear', ok: passportTraits.sanctionsPassed },
                { label: 'KYC verified', ok: passportTraits.kycVerified },
                { label: 'Nationality', ok: passportTraits.nationalityCompliant },
              ].map(({ label, ok }) => (
                <div key={label} className={`flex items-center gap-2 ${ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600'}`}>
                  <span>{ok ? '✓' : '✗'}</span> {label}
                </div>
              ))}
            </div>
          </div>

          {/* Unique identifier */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unique identifier</p>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
              <code className="text-xs text-gray-700 dark:text-gray-200 break-all flex-1 font-mono">
                {passportTraits.uniqueIdentifier}
              </code>
              <button onClick={handleCopy} className="flex-shrink-0 p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                {copied
                  ? <ClipboardDocumentCheckIcon className="h-4 w-4 text-emerald-500" />
                  : <ClipboardDocumentIcon className="h-4 w-4 text-gray-500" />}
              </button>
            </div>
            {identifierUsed && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                This identifier is already registered
              </p>
            )}
          </div>

          {/* Confirm input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Confirm identifier to mint
            </label>
            <input
              type="text"
              value={identifierInput}
              onChange={(e) => setIdentifierInput(e.target.value)}
              placeholder="Paste your unique identifier"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {!passportTraits.solidityParams && (
            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
              ZK proof not captured. Please verify again with a real passport scan.
            </div>
          )}

          <button
            onClick={handleMint}
            disabled={isLoading || !identifierInput || !!identifierUsed || !passportTraits.isOver18 || !passportTraits.solidityParams}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-4 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {isMinting || isWaiting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Minting CONVEXO PASSPORT…
              </span>
            ) : (
              'Mint CONVEXO PASSPORT'
            )}
          </button>
        </div>
      )}

      {/* ── SUCCESS ──────────────────────────────────────────────────────── */}
      {isSuccess && step === 'success' && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full">
            <CheckBadgeIcon className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">CONVEXO PASSPORT minted</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              You now have Tier 1 Individual Investor access.
            </p>
          </div>
          {hash && (
            <a
              href={`https://${
                chainId === 11155111 ? 'sepolia.etherscan.io' :
                chainId === 84532    ? 'sepolia.basescan.org' :
                chainId === 8453     ? 'basescan.org' :
                                       'etherscan.io'
              }/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline text-sm font-medium"
            >
              View transaction
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
          )}
          <div className="pt-2">
            <Link
              href="/treasury"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
            >
              Go to Treasury
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
