'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useChainId, useReadContract } from 'wagmi';
import { getContractsForChain, getBlockExplorerUrl, getIPFSUrl } from '@/lib/contracts/addresses';
import { buildIPFSUrl, PINATA_CONFIG } from '@/lib/config/pinata';
import {
  CheckBadgeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface NFTAttribute {
  trait_type: string;
  value: string;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: NFTAttribute[];
}

interface NFTDisplayCardProps {
  type: 'passport' | 'lpIndividuals' | 'lpBusiness' | 'creditScore';
  tokenId?: bigint;
  address?: `0x${string}`;
  compact?: boolean;
}

const typeConfig = {
  passport: {
    title: 'Convexo Passport',
    tier: 1,
    icon: ShieldCheckIcon,
    gradient: 'from-emerald-600 to-teal-600',
    bgGlow: 'emerald',
    fallbackImage: PINATA_CONFIG.images.passport,
  },
  lpIndividuals: {
    title: 'LP Individual',
    tier: 2,
    icon: UserGroupIcon,
    gradient: 'from-blue-600 to-cyan-600',
    bgGlow: 'blue',
    fallbackImage: PINATA_CONFIG.images.lpIndividuals,
  },
  lpBusiness: {
    title: 'LP Business',
    tier: 2,
    icon: BuildingOffice2Icon,
    gradient: 'from-purple-600 to-pink-600',
    bgGlow: 'purple',
    fallbackImage: PINATA_CONFIG.images.lpBusiness,
  },
  creditScore: {
    title: 'Credit Score',
    tier: 3,
    icon: SparklesIcon,
    gradient: 'from-amber-500 to-orange-600',
    bgGlow: 'amber',
    fallbackImage: PINATA_CONFIG.images.creditScore,
  },
};

export function NFTDisplayCard({ type, tokenId, address, compact = false }: NFTDisplayCardProps) {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const config = typeConfig[type];
  const Icon = config.icon;

  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get contract address based on type
  const getContractAddress = () => {
    if (!contracts) return undefined;
    switch (type) {
      case 'passport': return contracts.CONVEXO_PASSPORT;
      case 'lpIndividuals': return contracts.LP_INDIVIDUALS;
      case 'lpBusiness': return contracts.LP_BUSINESS;
      case 'creditScore': return contracts.ECREDITSCORING;
    }
  };

  // Get ABI based on type
  const getABI = () => {
    // Simple ERC721 tokenURI ABI
    return [
      {
        type: 'function',
        name: 'tokenURI',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
      },
      {
        type: 'function',
        name: 'tokenOfOwnerByIndex',
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'index', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
      },
    ] as const;
  };

  // Get token ID by owner
  const { data: ownerTokenId } = useReadContract({
    address: getContractAddress(),
    abi: getABI(),
    functionName: 'tokenOfOwnerByIndex',
    args: address ? [address, BigInt(0)] : undefined,
    query: { enabled: !!address && !tokenId && !!getContractAddress() },
  });

  const effectiveTokenId = tokenId ?? ownerTokenId;

  // Get tokenURI
  const { data: tokenURI } = useReadContract({
    address: getContractAddress(),
    abi: getABI(),
    functionName: 'tokenURI',
    args: effectiveTokenId !== undefined ? [effectiveTokenId] : undefined,
    query: { enabled: effectiveTokenId !== undefined && !!getContractAddress() },
  });

  // Fetch metadata from IPFS
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!tokenURI) return;
      
      setIsLoadingMetadata(true);
      try {
        let uri = tokenURI as string;
        
        // Handle IPFS URI
        if (uri.startsWith('ipfs://')) {
          const hash = uri.replace('ipfs://', '');
          uri = buildIPFSUrl(hash);
        }
        
        // Handle gateway URLs
        if (uri.includes('/ipfs/')) {
          const hash = uri.split('/ipfs/')[1];
          uri = buildIPFSUrl(hash);
        }

        const response = await fetch(uri);
        if (response.ok) {
          const data = await response.json();
          // Process image URL
          if (data.image) {
            if (data.image.startsWith('ipfs://')) {
              data.image = buildIPFSUrl(data.image.replace('ipfs://', ''));
            }
          }
          setMetadata(data);
        }
      } catch (error) {
        console.error('Failed to fetch NFT metadata:', error);
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [tokenURI]);

  // Get image URL
  const imageUrl = metadata?.image || buildIPFSUrl(config.fallbackImage);

  // Get block explorer link
  const explorerUrl = effectiveTokenId !== undefined 
    ? `${getBlockExplorerUrl(chainId)}/token/${getContractAddress()}?a=${effectiveTokenId.toString()}`
    : `${getBlockExplorerUrl(chainId)}/token/${getContractAddress()}`;

  if (compact) {
    return (
      <div className={`card p-4 bg-gradient-to-br ${config.gradient} bg-opacity-10 border-${config.bgGlow}-500/30`}>
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
            <Image
              src={imageError ? `/NFTs/convexo_${type}.png` : imageUrl}
              alt={config.title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 text-${config.bgGlow}-400`} />
              <span className="text-white font-semibold text-sm">
                {metadata?.name || `${config.title} #${effectiveTokenId?.toString() || '?'}`}
              </span>
            </div>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs bg-${config.bgGlow}-900/50 text-${config.bgGlow}-400 border border-${config.bgGlow}-700/50`}>
              Tier {config.tier}
            </span>
          </div>
          <CheckBadgeIcon className={`w-6 h-6 text-${config.bgGlow}-400`} />
        </div>
      </div>
    );
  }

  return (
    <div className={`card overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-${config.bgGlow}-500/30`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.gradient} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-white font-bold text-lg">
                {metadata?.name || `${config.title} #${effectiveTokenId?.toString() || '?'}`}
              </h3>
              <span className="text-white/80 text-sm">Tier {config.tier} • Soulbound</span>
            </div>
          </div>
          <CheckBadgeIcon className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Image */}
      <div className="relative aspect-square max-h-64 bg-slate-900">
        <Image
          src={imageError ? `/NFTs/convexo_${type}.png` : imageUrl}
          alt={metadata?.name || config.title}
          fill
          className="object-contain p-4"
          onError={() => setImageError(true)}
        />
        {isLoadingMetadata && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Description */}
      {metadata?.description && (
        <div className="px-6 py-4 border-b border-slate-700/50">
          <p className="text-gray-400 text-sm line-clamp-3">{metadata.description}</p>
        </div>
      )}

      {/* Attributes Grid */}
      {metadata?.attributes && metadata.attributes.length > 0 && (
        <div className="px-6 py-4">
          <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <DocumentTextIcon className="w-4 h-4" />
            Traits
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {metadata.attributes.map((attr, i) => (
              <div key={i} className="bg-slate-800/50 rounded-lg p-2">
                <p className="text-gray-500 text-xs uppercase">{attr.trait_type}</p>
                <p className="text-white text-sm font-medium truncate">{attr.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            <span className="font-mono">ID: {effectiveTokenId?.toString() || '—'}</span>
          </div>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 text-sm text-${config.bgGlow}-400 hover:text-${config.bgGlow}-300 transition`}
          >
            View on Explorer
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
