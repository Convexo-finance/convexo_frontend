'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from '@/lib/wagmi/compat';

// ─── NFT contract addresses (deterministic, same on all chains) ───────────────

const NFT_CONTRACTS = [
  '0x2AD6aA7652C5167881b60C5bEa8713A0F0520cDD', // Convexo Passport
  '0xF4aA32C029CfFa6050107E65FFF6e25AA2E58554', // LP Individuals
  '0x147070275646d9Cab76Ae26e5Eb632f5A6e8024C', // LP Business
  '0x20Be7F2D32Ddaa7c056CC6C39415275401cdF9E7', // eCreditscoring
] as const;

const CONTRACT_LABELS: Record<string, string> = {
  '0x2AD6aA7652C5167881b60C5bEa8713A0F0520cDD': 'Convexo Passport',
  '0xF4aA32C029CfFa6050107E65FFF6e25AA2E58554': 'LP Individual',
  '0x147070275646d9Cab76Ae26e5Eb632f5A6e8024C': 'LP Business',
  '0x20Be7F2D32Ddaa7c056CC6C39415275401cdF9E7': 'eCreditscoring',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface AlchemyNFTImage {
  cachedUrl?: string;
  thumbnailUrl?: string;
  pngUrl?: string;
  contentType?: string;
  size?: number;
  originalUrl?: string;
}

interface AlchemyRawMetadata {
  tokenUri?: string;
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{ trait_type: string; value: string | number }>;
  };
  error?: string;
}

interface AlchemyNFT {
  contract: { address: string; name?: string; symbol?: string; tokenType?: string };
  tokenId: string;
  tokenType: string;
  name?: string;
  description?: string;
  image?: AlchemyNFTImage;
  raw?: AlchemyRawMetadata;
  tokenUri?: string;
  balance?: string;
  timeLastUpdated?: string;
}

interface AlchemyGetNFTsResponse {
  ownedNfts: AlchemyNFT[];
  totalCount: number;
  pageKey?: string;
}

export interface ConvexoNFT {
  contractAddress: string;
  contractLabel: string;
  tokenId: string;
  name: string;
  description: string;
  /** Best available image URL (cached > thumbnail > original > raw metadata) */
  imageUrl: string | null;
  attributes: Array<{ trait_type: string; value: string | number }>;
  tokenUri: string | null;
}

// ─── Alchemy API call ─────────────────────────────────────────────────────────

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ?? '';

async function fetchNFTMetadata(owner: string): Promise<ConvexoNFT[]> {
  // Query Base Mainnet (primary chain for NFTs)
  const contractParams = NFT_CONTRACTS.map(
    (addr) => `contractAddresses[]=${addr}`
  ).join('&');

  const url = `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getNFTsForOwner?owner=${owner}&${contractParams}&withMetadata=true&pageSize=100`;

  const res = await fetch(url, {
    headers: { accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Alchemy NFT API error: ${res.status}`);
  }

  const json: AlchemyGetNFTsResponse = await res.json();

  return json.ownedNfts.map((nft) => {
    const addr = nft.contract.address.toLowerCase();
    const contractKey = Object.keys(CONTRACT_LABELS).find(
      (k) => k.toLowerCase() === addr
    );

    // Resolve best image URL
    const imageUrl =
      nft.image?.cachedUrl ||
      nft.image?.thumbnailUrl ||
      nft.image?.originalUrl ||
      nft.raw?.metadata?.image ||
      null;

    return {
      contractAddress: nft.contract.address,
      contractLabel: contractKey ? CONTRACT_LABELS[contractKey] : (nft.contract.name ?? 'Unknown'),
      tokenId: nft.tokenId,
      name: nft.name ?? nft.raw?.metadata?.name ?? `#${nft.tokenId}`,
      description: nft.description ?? nft.raw?.metadata?.description ?? '',
      imageUrl,
      attributes: nft.raw?.metadata?.attributes ?? [],
      tokenUri: nft.tokenUri ?? nft.raw?.tokenUri ?? null,
    };
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNFTMetadata() {
  const { address, isConnected } = useAccount();

  const {
    data: nfts,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['nft-metadata', address],
    queryFn: () => fetchNFTMetadata(address!),
    enabled: !!address && isConnected && !!ALCHEMY_API_KEY,
    staleTime: 5 * 60_000,  // 5 min — NFTs don't change frequently
    gcTime: 15 * 60_000,    // 15 min cache
    refetchOnWindowFocus: false,
  });

  // Group NFTs by contract
  const passport = nfts?.filter(
    (n) => n.contractAddress.toLowerCase() === NFT_CONTRACTS[0].toLowerCase()
  ) ?? [];
  const lpIndividual = nfts?.filter(
    (n) => n.contractAddress.toLowerCase() === NFT_CONTRACTS[1].toLowerCase()
  ) ?? [];
  const lpBusiness = nfts?.filter(
    (n) => n.contractAddress.toLowerCase() === NFT_CONTRACTS[2].toLowerCase()
  ) ?? [];
  const creditScore = nfts?.filter(
    (n) => n.contractAddress.toLowerCase() === NFT_CONTRACTS[3].toLowerCase()
  ) ?? [];

  return {
    /** All Convexo NFTs owned by this address */
    nfts: nfts ?? [],
    /** Convexo Passport NFTs (Tier 1) */
    passport,
    /** LP Individual NFTs (Tier 2) */
    lpIndividual,
    /** LP Business NFTs (Tier 2) */
    lpBusiness,
    /** eCreditscoring NFTs (Tier 3) */
    creditScore,
    isLoading,
    isError,
    error,
    refetch,
  };
}
