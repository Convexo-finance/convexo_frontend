'use client';

import { useState } from 'react';
import { useChainId, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { getContractsForChain, getBlockExplorerUrl, IPFS } from '@/lib/contracts/addresses';
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

type NFTType = 'passport' | 'lp_individuals' | 'lp_business' | 'ecreditscoring';

export function UserManagement() {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const [selectedNFT, setSelectedNFT] = useState<NFTType>('passport');
  const [recipient, setRecipient] = useState('');
  const [uri, setUri] = useState('');
  const [lookupAddress, setLookupAddress] = useState('');

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
      id: 'passport' as NFTType,
      name: 'Convexo Passport',
      description: 'Tier 1 - ZKPassport verified',
      icon: CheckBadgeIcon,
      color: 'emerald',
      contractAddress: contracts?.CONVEXO_PASSPORT,
      abi: ConvexoPassportABI,
      defaultUri: IPFS.CONVEXO_PASSPORT_URI,
    },
    {
      id: 'lp_individuals' as NFTType,
      name: 'LP Individuals',
      description: 'Tier 2 - Veriff KYC',
      icon: UserGroupIcon,
      color: 'blue',
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

    writeContract({
      address: selectedNFTConfig.contractAddress as `0x${string}`,
      abi: selectedNFTConfig.abi,
      functionName: 'safeMint',
      args: [recipient as `0x${string}`, uri || selectedNFTConfig.defaultUri],
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

        {/* NFT Type Selection */}
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
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-${nft.color}-600 to-${nft.color}-700 flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-white">{nft.name}</p>
                    <p className="text-xs text-gray-400">{nft.description}</p>
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
