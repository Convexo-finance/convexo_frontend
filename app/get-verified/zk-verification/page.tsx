'use client';

import { useState, useEffect } from 'react';
import { 
  useAccount, 
  useChainId, 
  useBalance,
  useReadContract, 
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi';
import { parseEther, formatEther, keccak256, toBytes } from 'viem';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { ConvexoPassportABI } from '@/lib/contracts/abis';
import { IdentificationIcon, ClipboardDocumentIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { ZKPassport } from '@zkpassport/sdk';
import { QRCodeSVG } from 'qrcode.react';

// Your app's unique scope
const APP_SCOPE_STRING = 'convexo-identity';

export default function ZKVerificationPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const { hasPassportNFT, hasActivePassport } = useNFTBalance();

  const [uniqueIdentifier, setUniqueIdentifier] = useState<string | null>(null);
  const [verifiedData, setVerifiedData] = useState<{
    nationality: string;
    birthdate: string;
    fullname: string;
  } | null>(null);
  const [identifierInput, setIdentifierInput] = useState<string>('');
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'verifying' | 'verified' | 'minting' | 'success'>('idle');
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Get domain from environment or use default
  const domain = typeof window !== 'undefined' ? window.location.hostname : 'convexo.io';
  const [zkPassport] = useState(() => new ZKPassport(domain));

  // Check user's ETH balance
  const { data: balance, isLoading: loadingBalance } = useBalance({ address });
  const MIN_ETH_REQUIRED = parseEther('0.01');
  const hasEnoughETH = balance && balance.value >= MIN_ETH_REQUIRED;

  // Check if user already has passport
  const { data: hasPassport, isLoading: checkingPassport, refetch: refetchPassport } = useReadContract({
    address: contracts?.CONVEXO_PASSPORT as `0x${string}`,
    abi: ConvexoPassportABI,
    functionName: 'holdsActivePassport',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts?.CONVEXO_PASSPORT,
    },
  }) as { data: boolean | undefined; isLoading: boolean; refetch: () => void };

  // Check if identifier has already been used (only when we have an identifier)
  const identifierBytes32 = identifierInput && identifierInput.length > 0 
    ? keccak256(toBytes(identifierInput)) 
    : null;
  
  const { data: identifierUsed, refetch: refetchIdentifierUsed } = useReadContract({
    address: contracts?.CONVEXO_PASSPORT as `0x${string}`,
    abi: ConvexoPassportABI,
    functionName: 'isIdentifierUsed',
    args: identifierBytes32 ? [identifierBytes32 as `0x${string}`] : undefined,
    query: {
      enabled: !!identifierBytes32 && !!contracts?.CONVEXO_PASSPORT,
    },
  }) as { data: boolean | undefined; refetch: () => void };

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

  // Start ZKPassport Verification
  const generateProof = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!contracts?.CONVEXO_PASSPORT) {
      setError('Unsupported network. Please switch to a supported network');
      return;
    }

    if (!hasEnoughETH) {
      setError(`Insufficient ETH for gas. Please add at least ${formatEther(MIN_ETH_REQUIRED)} ETH to your wallet.`);
      return;
    }

    try {
      setIsGeneratingProof(true);
      setError(null);
      setStep('verifying');

      // Create verification request
      const queryBuilder = await zkPassport.request({
        name: 'Convexo Identity Verification',
        logo: typeof window !== 'undefined' ? `${window.location.origin}/logo_convexo.png` : '',
        purpose: 'Verify user identity for Convexo Passport NFT',
        scope: APP_SCOPE_STRING,
      });

      // Request with nationality, birthdate, fullname, sanctions, facematch
      const { url, onResult } = queryBuilder
        .disclose('nationality')
        .disclose('birthdate')
        .disclose('fullname')
        .sanctions() // Enable sanctions screening
        .facematch('strict') // Enable face match with strict mode
        .done();

      setVerificationUrl(url);

      // Handle verification result
      onResult((callbackParams) => {
        console.log('ZKPassport callback:', callbackParams);
        
        const { verified, result, uniqueIdentifier: uid } = callbackParams as any;
        
        setIsGeneratingProof(false);
        setVerificationUrl(null);
        
        if (verified) {
          // Check facematch and sanctions
          const facematchPassed = result?.facematch?.passed;
          const sanctionsPassed = result?.sanctions?.passed;
          
          if (!facematchPassed) {
            setError('Face match failed. Please try again.');
            setStep('idle');
            return;
          }
          
          if (!sanctionsPassed) {
            setError('Sanctions check failed. Account flagged for review.');
            setStep('idle');
            return;
          }
          
          // Extract disclosed data
          const nationality = result?.nationality?.disclose?.result;
          const birthdate = result?.birthdate?.disclose?.result;
          const fullname = result?.fullname?.disclose?.result;
          
          console.log('✅ Verification successful:', { nationality, birthdate, fullname, uniqueIdentifier: uid });
          
          // Store the unique identifier and verified data
          setUniqueIdentifier(uid);
          setVerifiedData({
            nationality: nationality || 'N/A',
            birthdate: birthdate || 'N/A',
            fullname: fullname || 'N/A',
          });
          setIdentifierInput(uid); // Pre-fill the input
          setStep('verified');
          
        } else {
          setError('Verification failed. Please try again.');
          setStep('idle');
        }
      });
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to start ZKPassport verification.');
      setStep('idle');
      setIsGeneratingProof(false);
      setVerificationUrl(null);
    }
  };

  // Mint Passport NFT with unique identifier
  const { writeContract: mintPassport, data: hash, isPending: isMinting, error: mintError } = useWriteContract();
  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      setError(null);
      setUniqueIdentifier(null);
      setVerifiedData(null);
      setIdentifierInput('');
      setStep('success');
      refetchPassport();
    }
  }, [isSuccess, refetchPassport]);

  const handleMint = () => {
    if (!identifierInput || !contracts?.CONVEXO_PASSPORT) {
      setError('Please enter your unique identifier');
      return;
    }

    if (identifierUsed) {
      setError('This identifier has already been used to mint a passport.');
      return;
    }

    setStep('minting');
    setError(null);
    
    // Hash the identifier to bytes32
    const identifierHash = keccak256(toBytes(identifierInput)) as `0x${string}`;

    mintPassport({
      address: contracts.CONVEXO_PASSPORT,
      abi: ConvexoPassportABI,
      functionName: 'safeMintWithIdentifier',
      args: [identifierHash], // Only uniqueIdentifier parameter
    });
  };

  useEffect(() => {
    if (mintError) {
      const errorMessage = mintError.message || mintError.toString();
      if (errorMessage.includes('AlreadyHasPassport')) {
        setError('You already have a passport NFT.');
        refetchPassport();
      } else if (errorMessage.includes('IdentifierAlreadyUsed')) {
        setError('This identifier has already been used.');
      } else {
        setError(errorMessage);
      }
      setStep('verified'); // Go back to verified state
    }
  }, [mintError, refetchPassport]);

  const handleCopy = () => {
    if (uniqueIdentifier) {
      navigator.clipboard.writeText(uniqueIdentifier);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isLoading = isGeneratingProof || isMinting || isWaiting || checkingPassport;

  interface VerifiedIdentity {
    uniqueIdentifier: `0x${string}`;
    verifiedAt: bigint;
    isActive: boolean;
    nationality: string;
  }

  // Render logic
  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 text-center">
            <p className="font-semibold text-gray-900 dark:text-white">🔌 Please connect your wallet</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (checkingPassport || loadingBalance) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasEnoughETH) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">⚠️ Insufficient ETH</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Need at least <strong>{formatEther(MIN_ETH_REQUIRED)} ETH</strong>
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Balance: <strong>{balance ? formatEther(balance.value) : '0'} ETH</strong>
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (hasPassport && identity) {
    const identityData = identity as VerifiedIdentity;
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">✅ Active Passport NFT</h3>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p><strong>Nationality:</strong> {identityData.nationality}</p>
              <p><strong>Verified:</strong> {new Date(Number(identityData.verifiedAt) * 1000).toLocaleString()}</p>
              <p><strong>Status:</strong> {identityData.isActive ? 'Active' : 'Inactive'}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">ZK Verification</h1>
          <p className="text-gray-600 dark:text-gray-400">Verify with ZKPassport for Tier 3 access</p>
        </div>

        {/* Passport Image */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <Image src="/NFTs/convexo_zkpassport.png" alt="Passport NFT" width={200} height={200} className="mx-auto rounded-lg" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">Convexo Passport NFT</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Soulbound NFT - Individual Investor Access</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="font-semibold text-red-800 dark:text-red-200">❌ {error}</p>
          </div>
        )}

        {/* Step 1: Start Verification */}
        {step === 'idle' && !verificationUrl && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Step 1: Verify Identity</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Complete ZKPassport verification including:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 mb-4 list-disc list-inside space-y-1">
              <li>Face match verification</li>
              <li>Sanctions screening</li>
              <li>Identity disclosure</li>
            </ul>
            <button
              onClick={generateProof}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGeneratingProof ? 'Starting...' : 'Start Verification'}
            </button>
          </div>
        )}

        {/* QR Code Display */}
        {verificationUrl && step === 'verifying' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                <IdentificationIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Scan with ZKPassport App</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Open ZKPassport app and scan this QR code</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 inline-block">
              <QRCodeSVG value={verificationUrl} size={280} level="H" includeMargin />
            </div>
            
            <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Waiting for verification...</p>
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Complete verification in ZKPassport app
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Verification Success - Show Unique Identifier */}
        {step === 'verified' && uniqueIdentifier && verifiedData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
              <p className="font-semibold text-green-800 dark:text-green-200 text-center">✅ Verification Complete</p>
              <div className="mt-3 text-sm text-green-700 dark:text-green-300 space-y-1">
                <p><strong>Name:</strong> {verifiedData.fullname}</p>
                <p><strong>Nationality:</strong> {verifiedData.nationality}</p>
                <p><strong>Birth Date:</strong> {new Date(verifiedData.birthdate).toLocaleDateString()}</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Your Unique Identifier</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This identifier is required to mint your NFT. Keep it safe!
            </p>

            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <code className="text-sm text-gray-800 dark:text-gray-200 break-all flex-1 mr-2">
                  {uniqueIdentifier}
                </code>
                <button
                  onClick={handleCopy}
                  className="flex-shrink-0 p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <ClipboardDocumentCheckIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <ClipboardDocumentIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Paste Identifier to Mint
              </label>
              <input
                type="text"
                value={identifierInput}
                onChange={(e) => setIdentifierInput(e.target.value)}
                placeholder="Paste your unique identifier here"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {identifierUsed && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  ⚠️ This identifier has already been used
                </p>
              )}
            </div>

            <button
              onClick={handleMint}
              disabled={isLoading || !identifierInput || identifierUsed}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isMinting || isWaiting ? 'Minting...' : 'Mint Passport NFT'}
            </button>
          </div>
        )}

        {/* Success */}
        {isSuccess && step === 'success' && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">🎉 Success!</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Your Convexo Passport NFT has been minted. You now have Tier 3 access.
            </p>
            {hash && (
              <a
                href={`https://${chainId === 84532 ? 'sepolia.basescan.org' : chainId === 11155111 ? 'sepolia.etherscan.io' : chainId === 8453 ? 'basescan.org' : chainId === 1 ? 'etherscan.io' : 'unichain-sepolia.blockscout.com'}/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View Transaction →
              </a>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
