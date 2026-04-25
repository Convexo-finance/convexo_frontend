'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useChainId } from '@/lib/wagmi/compat';
import { getContractsForChain, getBlockExplorerUrl } from '@/lib/contracts/addresses';
import { buildIPFSUrl, PINATA_CONFIG } from '@/lib/config/pinata';
import { useNFTMetadata } from '@/lib/hooks/useNFTMetadata';
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
  value: string | number;
}

interface NFTDisplayCardProps {
  type: 'passport' | 'lpIndividuals' | 'lpBusiness' | 'creditScore';
  address?: `0x${string}`;
  compact?: boolean;
}

const TYPE_CONFIG = {
  passport: {
    title: 'Convexo Passport',
    tier: 1,
    icon: ShieldCheckIcon,
    gradient: 'from-emerald-600 to-teal-600',
    glowColor: 'emerald',
    fallbackImage: PINATA_CONFIG.images.passport,
  },
  lpIndividuals: {
    title: 'LP Individual',
    tier: 2,
    icon: UserGroupIcon,
    gradient: 'from-blue-600 to-cyan-600',
    glowColor: 'blue',
    fallbackImage: PINATA_CONFIG.images.lpIndividuals,
  },
  lpBusiness: {
    title: 'LP Business',
    tier: 2,
    icon: BuildingOffice2Icon,
    gradient: 'from-purple-600 to-pink-600',
    glowColor: 'purple',
    fallbackImage: PINATA_CONFIG.images.lpBusiness,
  },
  creditScore: {
    title: 'Credit Score',
    tier: 3,
    icon: SparklesIcon,
    gradient: 'from-amber-500 to-orange-600',
    glowColor: 'amber',
    fallbackImage: PINATA_CONFIG.images.creditScore,
  },
} as const;

// Resolve ipfs:// URIs through the Pinata gateway
function resolveIpfs(uri: string): string {
  if (uri.startsWith('ipfs://')) return buildIPFSUrl(uri.slice(7));
  if (uri.includes('/ipfs/')) return buildIPFSUrl(uri.split('/ipfs/')[1]);
  return uri;
}

export function NFTDisplayCard({ type, address, compact = false }: NFTDisplayCardProps) {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  // ── Get NFT data from Alchemy (correct chain + addresses) ─────────────────
  const { passport, lpIndividual, lpBusiness, creditScore, isLoading } = useNFTMetadata();

  const nftList = {
    passport,
    lpIndividuals: lpIndividual,
    lpBusiness,
    creditScore,
  }[type];

  const nft = nftList?.[0] ?? null;

  // ── Fetch IPFS metadata JSON if Alchemy didn't cache attributes ───────────
  // This covers the case where Alchemy returns the NFT but hasn't indexed
  // the metadata yet (common right after minting on testnet).
  const [ipfsMetadata, setIpfsMetadata] = useState<{
    name?: string; description?: string; image?: string;
    attributes?: NFTAttribute[];
  } | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setIpfsMetadata(null);
    setImageError(false);

    const tokenUri = nft?.tokenUri;
    // Only fetch if Alchemy didn't already provide attributes
    if (!tokenUri || (nft?.attributes && nft.attributes.length > 0)) return;

    const url = resolveIpfs(tokenUri);
    fetch(url)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        if (data.image) data.image = resolveIpfs(data.image);
        setIpfsMetadata(data);
      })
      .catch(() => {});
  }, [nft?.tokenUri, nft?.attributes]);

  // ── Resolved display values ────────────────────────────────────────────────
  const name = nft?.name || ipfsMetadata?.name || config.title;
  const description = nft?.description || ipfsMetadata?.description || '';
  const attributes: NFTAttribute[] = (nft?.attributes?.length
    ? nft.attributes
    : ipfsMetadata?.attributes ?? []) as NFTAttribute[];

  // Image: Alchemy cached > IPFS from metadata > fallback from Pinata
  const imageUrl = imageError
    ? buildIPFSUrl(config.fallbackImage)
    : (nft?.imageUrl || ipfsMetadata?.image || buildIPFSUrl(config.fallbackImage));

  const tokenId = nft?.tokenId;

  const contractAddress = (() => {
    if (!contracts) return undefined;
    switch (type) {
      case 'passport':     return contracts.CONVEXO_PASSPORT;
      case 'lpIndividuals': return contracts.LP_INDIVIDUALS;
      case 'lpBusiness':   return contracts.LP_BUSINESS;
      case 'creditScore':  return contracts.ECREDITSCORING;
    }
  })();

  const explorerUrl = contractAddress
    ? `${getBlockExplorerUrl(chainId)}/token/${contractAddress}${tokenId ? `?a=${tokenId}` : ''}`
    : undefined;

  // ── Compact variant ────────────────────────────────────────────────────────
  if (compact) {
    return (
      <div className="card p-4 border border-gray-700/50">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-800">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin" />
              </div>
            ) : (
              <Image
                src={imageUrl}
                alt={name}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-semibold text-sm truncate">{name}</span>
            </div>
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-gray-800 text-gray-400 border border-gray-700">
              Tier {config.tier}
            </span>
          </div>
          <CheckBadgeIcon className="w-6 h-6 text-emerald-400 flex-shrink-0" />
        </div>
      </div>
    );
  }

  // ── Full card ──────────────────────────────────────────────────────────────
  return (
    <div className="card overflow-hidden border-gray-700/50">
      {/* Header gradient */}
      <div className={`bg-gradient-to-r ${config.gradient} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-white font-bold text-lg">{name}</h3>
              <span className="text-white/80 text-sm">Tier {config.tier} · Soulbound</span>
            </div>
          </div>
          <CheckBadgeIcon className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* NFT image */}
      <div className="relative aspect-square max-h-64 bg-slate-900">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-contain p-4"
            onError={() => setImageError(true)}
          />
        )}
      </div>

      {/* Description */}
      {description && (
        <div className="px-6 py-4 border-b border-slate-700/50">
          <p className="text-gray-400 text-sm line-clamp-3">{description}</p>
        </div>
      )}

      {/* Attributes */}
      {attributes.length > 0 && (
        <div className="px-6 py-4">
          <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <DocumentTextIcon className="w-4 h-4" />
            Traits
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {attributes.map((attr, i) => (
              <div key={i} className="bg-slate-800/50 rounded-lg p-2">
                <p className="text-gray-500 text-xs uppercase">{attr.trait_type}</p>
                <p className="text-white text-sm font-medium truncate">{String(attr.value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700/50 flex items-center justify-between">
        <span className="text-sm text-gray-400 font-mono">
          {tokenId != null ? `ID: ${tokenId}` : isLoading ? 'Loading…' : 'No token found'}
        </span>
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition"
          >
            View on Explorer <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
