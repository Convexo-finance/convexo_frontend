'use client';

import { useState, useEffect, useRef } from 'react';
import {
  useAccount,
  useChainId,
  useReadContract,
  useWaitForTransactionReceipt
} from '@/lib/wagmi/compat';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { ConvexoPassportABI } from '@/lib/contracts/abis';
import { IS_MAINNET } from '@/lib/config/network';
import {
  createPassportMetadata,
  uploadMetadataToPinata,
  type PassportTraits as PinataPassportTraits
} from '@/lib/config/pinata';
import {
  ShieldCheckIcon,
  FingerPrintIcon,
  CheckBadgeIcon,
  LockClosedIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { ZKPassport, type SolidityVerifierParameters, type SupportedChain } from '@zkpassport/sdk';

// Maps viem chain IDs to zkPassport SupportedChain strings
const ZK_CHAIN_MAP: Record<number, SupportedChain> = {
  1:         'ethereum',
  8453:      'base',
  11155111:  'ethereum_sepolia',
  84532:     'base_sepolia',
  42161:     'arbitrum',
  421614:    'arbitrum_sepolia',
};
import { QRCodeSVG } from 'qrcode.react';
import { useConvexoWrite } from '@/lib/hooks/useConvexoWrite';

// Your app's unique scope for identity verification
const APP_SCOPE_STRING = 'convexo-passport-identity';

// Must match Convexo_Passport._getSanctionedCountries() exactly —
// ISO 3166-1 alpha-3 codes, alphabetically sorted (ZKPassport Merkle requirement).
// The SDK's SANCTIONED_COUNTRIES uses full country names and is NOT compatible.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CONVEXO_SANCTIONED_COUNTRIES: any[] = [
  'AFG', 'BLR', 'CAF', 'COD', 'CUB', 'IRN', 'IRQ', 'LBY', 'MLI', 'MMR',
  'NIC', 'PRK', 'RUS', 'SDN', 'SOM', 'SSD', 'SYR', 'VEN', 'YEM', 'ZWE',
];

// Interface for the verified traits stored privately
interface ConvexoPassportTraits {
  uniqueIdentifier: string;
  kycVerified: boolean;
  sanctionsPassed: boolean;
  isOver18: boolean;
  nationalityCompliant: boolean;
  zkPassportTimestamp: number;
  zkPassportResult: any;
  // Solidity-compatible ZK proof params for on-chain verification
  solidityParams: SolidityVerifierParameters | null;
}

export default function ZKVerificationPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const { hasPassportNFT, hasActivePassport } = useNFTBalance();

  const [passportTraits, setPassportTraits] = useState<ConvexoPassportTraits | null>(null);
  const [identifierInput, setIdentifierInput] = useState<string>('');
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'verifying' | 'verified' | 'minting' | 'success'>('idle');
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  // Collect the last proof from onProofGenerated — needed for getSolidityVerifierParameters
  const collectedProofRef = useRef<any>(null);

  // Get domain from environment or use default
  const domain = typeof window !== 'undefined' ? window.location.hostname : 'convexo.io';
  const [zkPassport] = useState(() => new ZKPassport(domain));

  // Check if user already has CONVEXO PASSPORT
  const { data: hasPassport, isLoading: checkingPassport, refetch: refetchPassport } = useReadContract({
    address: contracts?.CONVEXO_PASSPORT as `0x${string}`,
    abi: ConvexoPassportABI,
    functionName: 'holdsActivePassport',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts?.CONVEXO_PASSPORT,
    },
  }) as { data: boolean | undefined; isLoading: boolean; refetch: () => void };

  // Check if identifier has already been used (sybil resistance)
  // identifierInput is the nullifier bytes32 hex string from ZKPassport
  const { data: identifierUsed } = useReadContract({
    address: contracts?.CONVEXO_PASSPORT as `0x${string}`,
    abi: ConvexoPassportABI,
    functionName: 'isIdentifierUsed',
    args: identifierInput ? [identifierInput as `0x${string}`] : undefined,
    query: {
      enabled: !!identifierInput && identifierInput.startsWith('0x') && !!contracts?.CONVEXO_PASSPORT,
    },
  }) as { data: boolean | undefined };

  // Get verified identity if passport exists
  const { data: identity } = useReadContract({
    address: contracts?.CONVEXO_PASSPORT as `0x${string}`,
    abi: ConvexoPassportABI,
    functionName: 'getVerifiedIdentity',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts?.CONVEXO_PASSPORT && !!hasPassport,
    },
  });

  // Start ZKPassport Verification - Only collects required proofs
  const generateProof = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!contracts?.CONVEXO_PASSPORT) {
      setError('Unsupported network. Please switch to a supported network');
      return;
    }

    try {
      setIsGeneratingProof(true);
      setError(null);
      setStep('verifying');

      collectedProofRef.current = null;

      // Create verification request — compressed-evm mode generates a single
      // Groth16 proof that can be verified on-chain by the ZKPassport verifier contract.
      const queryBuilder = await zkPassport.request({
        name: 'CONVEXO PASSPORT Verification',
        logo: typeof window !== 'undefined' ? `${window.location.origin}/logo_convexo.png` : '',
        purpose: 'Verify identity for CONVEXO PASSPORT - Proof of Personhood & KYC Status',
        scope: APP_SCOPE_STRING,
        mode: 'compressed-evm',
        devMode: !IS_MAINNET, // allow mock proofs on testnet
      });

      // Request all claims the contract verifies on-chain:
      // age >= 18, sanctions, nationality not in blocked list, passport not expired.
      // All four must be committed in the proof or claimPassport() will revert.
      // Bind proof to the user's wallet address and chain — required by the on-chain verifier.
      // Without this the committedInputs won't include bind data and claimPassport() reverts.
      const zkChain = ZK_CHAIN_MAP[chainId] ?? 'ethereum_sepolia';

      const { url, onProofGenerated, onResult } = queryBuilder
        .gte('age', 18)
        .sanctions()
        .out('nationality', CONVEXO_SANCTIONED_COUNTRIES)
        .gte('expiry_date', new Date())
        .bind('user_address', address as `0x${string}`)
        .bind('chain', zkChain)
        .done();

      setVerificationUrl(url);

      // Collect the EVM-compatible aggregated proof (fires once in compressed-evm mode)
      onProofGenerated((proof) => {
        collectedProofRef.current = proof;
      });

      // Handle verification result
      onResult(({ uniqueIdentifier: uid, verified, result }) => {
        setIsGeneratingProof(false);
        setVerificationUrl(null);

        if (verified) {
          const sanctionsPassed = result?.sanctions?.passed ?? false;
          const isOver18 = result?.age?.gte?.result ?? false;
          const nationalityCompliant = result?.nationality?.out?.result ?? false;
          const isNotExpired = result?.expiry_date?.gte?.result ?? false;

          if (!sanctionsPassed) {
            setError('Verification failed: sanctions check did not pass.');
            setStep('idle');
            return;
          }
          if (!isOver18) {
            setError('Verification failed: must be 18 or older.');
            setStep('idle');
            return;
          }
          if (!nationalityCompliant) {
            setError('Verification failed: your nationality is not permitted.');
            setStep('idle');
            return;
          }
          if (!isNotExpired) {
            setError('Verification failed: your passport or ID is expired.');
            setStep('idle');
            return;
          }

          // Build Solidity-compatible proof params from the collected proof
          let solidityParams: SolidityVerifierParameters | null = null;
          try {
            if (collectedProofRef.current) {
              solidityParams = zkPassport.getSolidityVerifierParameters({
                proof: collectedProofRef.current,
                scope: APP_SCOPE_STRING,
              });
            }
          } catch (e) {
            // Proof may not be available in devMode — minting will fail gracefully
          }

          const timestamp = Math.floor(Date.now() / 1000);
          setPassportTraits({
            uniqueIdentifier: uid ?? '',
            kycVerified: sanctionsPassed,
            sanctionsPassed,
            isOver18,
            nationalityCompliant,
            zkPassportTimestamp: timestamp,
            zkPassportResult: result,
            solidityParams,
          });
          setIdentifierInput(uid ?? '');
          setStep('verified');
        } else {
          setError('Verification failed. Please try again.');
          setStep('idle');
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to start ZKPassport verification.');
      setStep('idle');
      setIsGeneratingProof(false);
      setVerificationUrl(null);
    }
  };

  // Mint CONVEXO PASSPORT with unique identifier
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
      setError('Please complete verification first');
      return;
    }

    if (identifierUsed) {
      setError('This identifier has already been used to mint a CONVEXO PASSPORT.');
      return;
    }

    if (!passportTraits.sanctionsPassed) {
      setError('KYC verification not complete. Please complete verification again.');
      return;
    }

    // CHECK AGE VERIFICATION - Must be 18 or older
    if (!passportTraits.isOver18) {
      setError('Age verification failed. You must be 18 years or older to mint CONVEXO PASSPORT.');
      return;
    }

    setStep('minting');
    setError(null);
    
    try {
      // Use the uniqueIdentifier directly from ZKPassport (no conversion needed)
      if (!identifierInput) {
        setError('Invalid unique identifier. Please complete verification again.');
        setStep('verified');
        return;
      }

      // Check contract state - is this passport's identifier already used?
      if (identifierUsed) {
        setError('This passport has already been used to mint a CONVEXO PASSPORT. Each passport can only mint once across all wallets.');
        setStep('verified');
        return;
      }

      if (!passportTraits.solidityParams) {
        setError('Missing ZK proof data. Please complete verification again.');
        setStep('verified');
        return;
      }

      // Upload NFT metadata to Pinata IPFS
      const traits: PinataPassportTraits = {
        kycVerified: passportTraits.kycVerified,
        sanctionsPassed: passportTraits.sanctionsPassed,
        isOver18: passportTraits.isOver18,
        nationalityCompliant: passportTraits.nationalityCompliant,
      };

      const tempTokenId = Math.floor(Date.now() / 1000);
      const metadata = createPassportMetadata(tempTokenId, traits);

      let ipfsMetadataHash: string;
      try {
        ipfsMetadataHash = await uploadMetadataToPinata(metadata);
      } catch {
        setError('Failed to upload NFT metadata to IPFS. Please try again.');
        setStep('verified');
        return;
      }

      // Build the ProofVerificationParams struct expected by claimPassport
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

      mintPassport({
        address: contracts.CONVEXO_PASSPORT,
        abi: ConvexoPassportABI,
        functionName: 'claimPassport',
        args: [zkParams, false, ipfsMetadataHash], // false = passport (not ID card)
      });
    } catch (err: any) {
      setError(`Failed to prepare mint: ${err.message}`);
      setStep('verified');
    }
  };

  useEffect(() => {
    if (mintError) {
      const errorMessage = mintError.message || mintError.toString();
      if (errorMessage.includes('AlreadyHasPassport')) {
        setError('You already have a CONVEXO PASSPORT.');
        refetchPassport();
      } else if (errorMessage.includes('IdentifierAlreadyUsed')) {
        setError('This identifier has already been used.');
      } else {
        setError(errorMessage);
      }
      setStep('verified');
    }
  }, [mintError, refetchPassport]);

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

  // Render: Wallet not connected
  if (!isConnected) {
    return (
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
            <LockClosedIcon className="h-12 w-12 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
            <p className="font-semibold text-gray-900 dark:text-white">Connect Your Wallet</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Please connect your wallet to get your CONVEXO PASSPORT
            </p>
          </div>
        </div>
    );
  }

  // Render: Loading state
  if (checkingPassport) {
    return (
        <div className="max-w-2xl mx-auto p-6 text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Checking CONVEXO PASSPORT status...</p>
          </div>
        </div>
    );
  }

  // Render: User already has active CONVEXO PASSPORT
  if (hasPassport && identity) {
    const identityData = identity as VerifiedIdentity;
    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">CONVEXO PASSPORT</h1>
            <p className="text-gray-600 dark:text-gray-400">Your verified digital identity</p>
          </div>

          {/* Passport Image */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl p-8 text-center border border-emerald-200 dark:border-emerald-800">
            <div className="relative inline-block">
              <Image 
                src="/NFTs/convexo_zkpassport.png" 
                alt="CONVEXO PASSPORT" 
                width={180} 
                height={180} 
                className="mx-auto rounded-xl shadow-lg"
              />
              <div className="absolute -top-2 -right-2 bg-emerald-500 rounded-full p-2">
                <CheckBadgeIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-6">Active CONVEXO PASSPORT</h3>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Tier 3 Individual Investor Access</p>
          </div>

          {/* Verified Traits - Private Data Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <LockClosedIcon className="h-5 w-5 text-gray-500" />
              Verified Traits (Stored Privately)
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <ShieldCheckIcon className="h-8 w-8 text-emerald-500" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">KYC Status</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {identityData.kycVerified ? '✓ Verified' : '✗ Not Verified'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <CheckBadgeIcon className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sanctions Check</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {identityData.sanctionsPassed ? '✓ Passed' : '✗ Not Passed'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <CheckBadgeIcon className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Age Verification</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {identityData.isOver18 ? '✓ 18+' : '✗ Under 18'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Verified:</strong> {new Date(Number(identityData.verifiedAt) * 1000).toLocaleString()}</p>
              <p><strong>Status:</strong> <span className={identityData.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}>{identityData.isActive ? 'Active' : 'Inactive'}</span></p>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">CONVEXO PASSPORT</h1>
          <p className="text-gray-600 dark:text-gray-400">Verify your identity for Tier 3 Individual Investor access</p>
        </div>

        {/* Passport Image Card */}
        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl p-8 text-center border border-blue-200 dark:border-blue-800">
          <Image 
            src="/NFTs/convexo_zkpassport.png" 
            alt="CONVEXO PASSPORT" 
            width={200} 
            height={200} 
            className="mx-auto rounded-xl shadow-lg"
          />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-6">CONVEXO PASSPORT</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Soulbound NFT • Individual Investor Access</p>
        </div>

        {/* What will be verified */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Required Verifications</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FingerPrintIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Proof of Personhood</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Biometric face verification</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <ShieldCheckIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">KYC Status</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sanctions & compliance check</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <CheckBadgeIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Age Verification</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Must be 18 years or older</p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <LockClosedIcon className="h-4 w-4" />
              Personal information (name, nationality, birthdate) stays private and is never stored.
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="font-semibold text-red-800 dark:text-red-200">❌ {error}</p>
          </div>
        )}

        {/* Step 1: Start Verification */}
        {step === 'idle' && !verificationUrl && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Step 1: Verify Identity</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Complete verification with ZKPassport to prove your identity without revealing personal data.
            </p>
            <button
              onClick={generateProof}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isGeneratingProof ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Starting...
                </span>
              ) : (
                'Start Verification'
              )}
            </button>
          </div>
        )}

        {/* QR Code Display */}
        {verificationUrl && step === 'verifying' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                <FingerPrintIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Scan with ZKPassport</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Open the ZKPassport app and scan this QR code</p>
            </div>

            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 inline-block shadow-inner">
              <QRCodeSVG value={verificationUrl} size={280} level="H" includeMargin />
            </div>

            {/* Mobile / no-camera option */}
            <div className="mt-5 max-w-md mx-auto space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">On your phone? Open the link directly instead:</p>
              <div className="flex items-center gap-2">
                <a
                  href={verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  Open ZKPassport
                </a>
                <button
                  onClick={handleCopyUrl}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm transition-colors"
                >
                  {urlCopied ? (
                    <ClipboardDocumentCheckIcon className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  )}
                  {urlCopied ? 'Copied!' : 'Copy link'}
                </button>
              </div>
            </div>

            <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600"></div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Waiting for verification...</p>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Complete Proof of Personhood & KYC check in ZKPassport
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Verification Success - Ready to Mint */}
        {step === 'verified' && passportTraits && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-6">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 mb-3">
                <CheckBadgeIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <p className="font-bold text-emerald-800 dark:text-emerald-200">Verification Complete!</p>
              </div>
              
              {/* Verified Traits Summary */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <span>✓</span> Proof of Personhood
                </div>
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <span>✓</span> KYC Verified
                </div>
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <span>✓</span> Sanctions Passed
                </div>
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <span>✓</span> Age 18+
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Your Unique Identifier</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                This identifier links to your CONVEXO PASSPORT. Your personal data stays private.
              </p>

              <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <code className="text-sm text-gray-800 dark:text-gray-200 break-all flex-1 mr-2 font-mono">
                    {passportTraits.uniqueIdentifier}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="flex-shrink-0 p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <ClipboardDocumentCheckIcon className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <ClipboardDocumentIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Identifier to Mint
              </label>
              <input
                type="text"
                value={identifierInput}
                onChange={(e) => setIdentifierInput(e.target.value)}
                placeholder="Paste your unique identifier here"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {identifierUsed && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  ⚠️ This identifier has already been used
                </p>
              )}
            </div>

            {/* Missing proof warning */}
            {!passportTraits.solidityParams && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300">
                ZK proof not captured. Please verify again with a real passport scan.
              </div>
            )}

            {/* Verification Checklist Before Minting */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Final Verification Status:</p>
              <div className="flex items-center gap-2">
                {passportTraits.sanctionsPassed ? (
                  <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">✗</span>
                )}
                <span className={passportTraits.sanctionsPassed ? 'text-gray-700 dark:text-gray-300' : 'text-red-600 dark:text-red-400'}>
                  KYC & Sanctions
                </span>
              </div>
              <div className="flex items-center gap-2">
                {passportTraits.isOver18 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">✗</span>
                )}
                <span className={passportTraits.isOver18 ? 'text-gray-700 dark:text-gray-300' : 'text-red-600 dark:text-red-400'}>
                  Age Verification (18+)
                </span>
              </div>
            </div>

            <button
              onClick={handleMint}
              disabled={isLoading || !identifierInput || identifierUsed || !passportTraits.isOver18 || !passportTraits.solidityParams}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-4 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isMinting || isWaiting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Minting CONVEXO PASSPORT...
                </span>
              ) : (
                'Mint CONVEXO PASSPORT'
              )}
            </button>
          </div>
        )}

        {/* Success */}
        {isSuccess && step === 'success' && (
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl p-8 text-center border border-emerald-200 dark:border-emerald-800">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 dark:bg-emerald-900 rounded-full mb-4">
              <CheckBadgeIcon className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">🎉 Success!</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Your CONVEXO PASSPORT has been minted. You now have Tier 3 Individual Investor access.
            </p>
            {hash && (
              <a
                href={`https://${chainId === 84532 ? 'sepolia.basescan.org' : chainId === 11155111 ? 'sepolia.etherscan.io' : chainId === 8453 ? 'basescan.org' : chainId === 1 ? 'etherscan.io' : 'unichain-sepolia.blockscout.com'}/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                View Transaction →
              </a>
            )}
          </div>
        )}
      </div>
  );
}
