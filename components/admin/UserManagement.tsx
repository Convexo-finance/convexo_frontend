'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useChainId, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { getContractsForChain, getBlockExplorerUrl, IPFS, getIPFSUrl } from '@/lib/contracts/addresses';
import {
  ConvexoPassportABI,
  LPIndividualsABI,
  LPBusinessABI,
  EcreditscoringABI,
  ReputationManagerABI,
} from '@/lib/contracts/abis';
import {
  CheckBadgeIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  SparklesIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

type NFTType = 'lp_individuals' | 'lp_business' | 'ecreditscoring';

export function UserManagement() {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const [selectedNFT, setSelectedNFT] = useState<NFTType>('lp_individuals');
  const [recipient, setRecipient] = useState('');
  const [uri, setUri] = useState('');
  const [lookupAddress, setLookupAddress] = useState('');
  
  // LP Individuals fields
  const [verificationId, setVerificationId] = useState('');
  
  // LP Business fields
  const [companyName, setCompanyName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [businessType, setBusinessType] = useState<0 | 1 | 2>(0); // 0: LLC, 1: Corporation, 2: Partnership
  const [sumsubApplicantId, setSumsubApplicantId] = useState('');

  // Ecreditscoring fields
  const [creditScore, setCreditScore] = useState('');
  const [creditTier, setCreditTier] = useState<0 | 1 | 2 | 3>(0); // 0: Poor, 1: Fair, 2: Good, 3: Excellent
  const [maxLoanAmount, setMaxLoanAmount] = useState('');
  const [referenceId, setReferenceId] = useState('');

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // User lookup
  const { data: userDetails, refetch: refetchUserDetails } = useReadContract({
    address: contracts?.REPUTATION_MANAGER,
    abi: ReputationManagerABI,
    functionName: 'getReputationDetails',
    args: lookupAddress ? [lookupAddress as `0x${string}`] : undefined,
    query: { enabled: !!lookupAddress && lookupAddress.startsWith('0x') },
  });

  const nftTypes = [
    {
      id: 'lp_individuals' as NFTType,
      name: 'LP Individuals',
      description: 'Tier 2 - Veriff KYC',
      icon: UserGroupIcon,
      color: 'blue',
      ipfsHash: IPFS.LP_INDIVIDUALS_HASH,
      contractAddress: contracts?.LP_INDIVIDUALS,
      abi: LPIndividualsABI,
      defaultUri: IPFS.LP_INDIVIDUALS_URI,
    },
    {
      id: 'lp_business' as NFTType,
      name: 'LP Business',
      description: 'Tier 2 - Sumsub KYB',
      icon: BuildingOffice2Icon,
      color: 'cyan',
      ipfsHash: IPFS.LP_BUSINESS_HASH,
      contractAddress: contracts?.LP_BUSINESS,
      abi: LPBusinessABI,
      defaultUri: IPFS.LP_BUSINESS_URI,
    },
    {
      id: 'ecreditscoring' as NFTType,
      name: 'Ecreditscoring',
      description: 'Tier 3 - AI Credit Score',
      icon: SparklesIcon,
      color: 'purple',
      ipfsHash: IPFS.ECREDITSCORING_HASH,
      contractAddress: contracts?.ECREDITSCORING,
      abi: EcreditscoringABI,
      defaultUri: IPFS.ECREDITSCORING_URI,
    },
  ];

  const selectedNFTConfig = nftTypes.find((nft) => nft.id === selectedNFT);

  const handleMint = () => {
    if (!recipient || !selectedNFTConfig || !selectedNFTConfig.contractAddress) {
      alert('Please fill in recipient address');
      return;
    }

    let args: any[] = [];

    if (selectedNFT === 'lp_individuals') {
      // LP_Individuals: safeMint(address to, string verificationId, string uri)
      if (!verificationId) {
        alert('Please fill in verification ID for LP Individuals');
        return;
      }
      args = [recipient as `0x${string}`, verificationId, uri || selectedNFTConfig.defaultUri];
    } else if (selectedNFT === 'lp_business') {
      // LP_Business: safeMint(address to, string companyName, string registrationNumber, string jurisdiction, uint8 businessType, string sumsubApplicantId, string uri)
      if (!companyName || !registrationNumber || !jurisdiction || !sumsubApplicantId) {
        alert('Please fill in all LP Business fields');
        return;
      }
      args = [
        recipient as `0x${string}`,
        companyName,
        registrationNumber,
        jurisdiction,
        businessType,
        sumsubApplicantId,
        uri || selectedNFTConfig.defaultUri,
      ];
    } else if (selectedNFT === 'ecreditscoring') {
      // Ecreditscoring: safeMint(address to, uint256 score, uint8 tier, uint256 maxLoanAmount, string referenceId, string uri)
      if (!creditScore || !maxLoanAmount || !referenceId) {
        alert('Please fill in all Ecreditscoring fields (score, tier, max loan amount, reference ID)');
        return;
      }
      args = [
        recipient as `0x${string}`,
        BigInt(creditScore),
        creditTier,
        BigInt(maxLoanAmount),
        referenceId,
        uri || selectedNFTConfig.defaultUri,
      ];
    }

    writeContract({
      address: selectedNFTConfig.contractAddress as `0x${string}`,
      abi: selectedNFTConfig.abi,
      functionName: 'safeMint',
      args,
    });
  };

  const handleLookup = () => {
    if (lookupAddress && lookupAddress.startsWith('0x')) {
      refetchUserDetails();
    }
  };

  const getTierName = (tier: number) => {
    const tiers = ['None', 'Passport', 'Limited Partner', 'Vault Creator'];
    return tiers[tier] || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* User Lookup */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">User Lookup</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={lookupAddress}
            onChange={(e) => setLookupAddress(e.target.value)}
            placeholder="0x... address to lookup"
            className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
          />
          <button onClick={handleLookup} className="btn-primary flex items-center gap-2">
            <MagnifyingGlassIcon className="w-5 h-5" />
            Lookup
          </button>
        </div>

        {userDetails && Array.isArray(userDetails) ? (
          <div className="mt-4 p-4 bg-gray-800/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Tier</span>
              <span className="text-white font-medium">
                {getTierName(Number(userDetails[0]))} (Tier {Number(userDetails[0])})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Passport Balance</span>
              <span className="text-emerald-400 font-medium">{userDetails[1]?.toString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">LP Individuals Balance</span>
              <span className="text-blue-400 font-medium">{userDetails[2]?.toString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">LP Business Balance</span>
              <span className="text-cyan-400 font-medium">{userDetails[3]?.toString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Ecreditscoring Balance</span>
              <span className="text-purple-400 font-medium">{userDetails[4]?.toString()}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* NFT Minting */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Mint NFT</h3>

        {/* NFT Type Selection with Images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {nftTypes.map((nft) => {
            const Icon = nft.icon;
            const isSelected = selectedNFT === nft.id;

            return (
              <button
                key={nft.id}
                onClick={() => {
                  setSelectedNFT(nft.id);
                  setUri(nft.defaultUri);
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-900/20'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* NFT Image from IPFS */}
                  <div className="w-16 h-16 rounded-lg bg-gray-700 flex-shrink-0 overflow-hidden border border-gray-600">
                    <Image
                      src={getIPFSUrl(nft.ipfsHash)}
                      alt={nft.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to icon if image fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-white">{nft.name}</p>
                    <p className="text-xs text-gray-400">{nft.description}</p>
                    <p className="text-xs text-gray-500 mt-1 font-mono">{nft.ipfsHash.substring(0, 16)}...</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mint Form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Recipient Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* LP Individuals Fields */}
          {selectedNFT === 'lp_individuals' && (
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Verification ID</label>
              <input
                type="text"
                value={verificationId}
                onChange={(e) => setVerificationId(e.target.value)}
                placeholder="Veriff verification ID"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">The verification ID from Veriff KYC process</p>
            </div>
          )}

          {/* LP Business Fields */}
          {selectedNFT === 'lp_business' && (
            <>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Company legal name"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Registration Number</label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="Company registration/tax ID"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Jurisdiction</label>
                <input
                  type="text"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  placeholder="Country/State of incorporation"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Business Type</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(Number(e.target.value) as 0 | 1 | 2)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value={0}>LLC</option>
                  <option value={1}>Corporation</option>
                  <option value={2}>Partnership</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Sumsub Applicant ID</label>
                <input
                  type="text"
                  value={sumsubApplicantId}
                  onChange={(e) => setSumsubApplicantId(e.target.value)}
                  placeholder="Sumsub applicant ID from KYB"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* Ecreditscoring Fields */}
          {selectedNFT === 'ecreditscoring' && (
            <>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Credit Score (0-999)</label>
                <input
                  type="number"
                  value={creditScore}
                  onChange={(e) => setCreditScore(e.target.value)}
                  placeholder="e.g., 750"
                  min="0"
                  max="999"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Numerical credit score between 0-999</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Credit Tier</label>
                <select
                  value={creditTier}
                  onChange={(e) => setCreditTier(Number(e.target.value) as 0 | 1 | 2 | 3)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value={0}>Poor (0-400)</option>
                  <option value={1}>Fair (401-600)</option>
                  <option value={2}>Good (601-800)</option>
                  <option value={3}>Excellent (801-999)</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Max Loan Amount (Wei)</label>
                <input
                  type="number"
                  value={maxLoanAmount}
                  onChange={(e) => setMaxLoanAmount(e.target.value)}
                  placeholder="e.g., 1000000000000000000"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum loan amount in Wei (1 ETH = 1e18 Wei)</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Reference ID</label>
                <input
                  type="text"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  placeholder="Unique reference ID for this credit assessment"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Unique identifier for audit trail</p>
              </div>
            </>
          )}

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Token URI (IPFS)</label>
            <input
              type="text"
              value={uri}
              onChange={(e) => setUri(e.target.value)}
              placeholder="ipfs://..."
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Default IPFS URI is pre-filled. Modify only if needed.
            </p>
          </div>

          <button
            onClick={handleMint}
            disabled={isPending || isConfirming || !recipient}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending || isConfirming
              ? 'Processing...'
              : isSuccess
              ? 'Minted Successfully!'
              : `Mint ${selectedNFTConfig?.name}`}
          </button>

          {writeError ? (
            <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg text-red-400 text-sm">
              Error: {writeError.message}
            </div>
          ) : null}

          {isSuccess && hash ? (
            <div className="p-3 bg-emerald-900/20 border border-emerald-700/50 rounded-lg text-emerald-400 text-sm">
              Transaction successful!{' '}
              <a
                href={`${getBlockExplorerUrl(chainId)}/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View on Explorer
              </a>
            </div>
          ) : null}
        </div>
      </div>

      {/* IPFS Metadata Info */}
      <div className="card p-6 bg-blue-900/10 border-blue-700/30">
        <h3 className="text-lg font-semibold text-white mb-3">NFT Metadata (IPFS)</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-gray-400 w-40 flex-shrink-0">Convexo Passport:</span>
            <code className="text-emerald-400 font-mono text-xs break-all">{IPFS.CONVEXO_PASSPORT_URI}</code>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-400 w-40 flex-shrink-0">LP Individuals:</span>
            <code className="text-blue-400 font-mono text-xs break-all">{IPFS.LP_INDIVIDUALS_URI}</code>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-400 w-40 flex-shrink-0">LP Business:</span>
            <code className="text-cyan-400 font-mono text-xs break-all">{IPFS.LP_BUSINESS_URI}</code>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-400 w-40 flex-shrink-0">Ecreditscoring:</span>
            <code className="text-purple-400 font-mono text-xs break-all">{IPFS.ECREDITSCORING_URI}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
