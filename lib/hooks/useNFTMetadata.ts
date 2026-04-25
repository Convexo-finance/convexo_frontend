'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount, useChainId } from '@/lib/wagmi/compat';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { IS_MAINNET } from '@/lib/config/network';

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ?? '';

function alchemyNftBase(): string {
  return IS_MAINNET
    ? `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`
    : `https://eth-sepolia.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AlchemyNFT {
  contract: { address: string; name?: string };
  tokenId: string;
  name?: string;
  description?: string;
  image?: { cachedUrl?: string; thumbnailUrl?: string; originalUrl?: string };
  raw?: {
    tokenUri?: string;
    metadata?: {
      name?: string;
      description?: string;
      image?: string;
      attributes?: Array<{ trait_type: string; value: string | number }>;
    };
  };
  tokenUri?: string;
}

interface AlchemyGetNFTsResponse {
  ownedNfts: AlchemyNFT[];
  totalCount: number;
}

export interface ConvexoNFT {
  contractAddress: string;
  contractLabel: string;
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string | null;
  attributes: Array<{ trait_type: string; value: string | number }>;
  tokenUri: string | null;
}

const LABEL_BY_KEY = ['Convexo Passport', 'LP Individual', 'LP Business', 'eCreditscoring'];

async function fetchNFTMetadata(owner: string, contractAddresses: string[]): Promise<ConvexoNFT[]> {
  const active = contractAddresses.filter(
    (a) => a && a !== '0x0000000000000000000000000000000000000000'
  );
  if (active.length === 0) return [];

  const params = active.map((a) => `contractAddresses[]=${a}`).join('&');
  const url = `${alchemyNftBase()}/getNFTsForOwner?owner=${owner}&${params}&withMetadata=true&pageSize=100`;

  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Alchemy NFT API ${res.status}`);

  const json: AlchemyGetNFTsResponse = await res.json();

  return json.ownedNfts.map((nft) => {
    const addr = nft.contract.address.toLowerCase();
    const idx = contractAddresses.findIndex((a) => a.toLowerCase() === addr);
    const label = idx >= 0 ? LABEL_BY_KEY[idx] : (nft.contract.name ?? 'Unknown');

    const imageUrl =
      nft.image?.cachedUrl ||
      nft.image?.thumbnailUrl ||
      nft.image?.originalUrl ||
      nft.raw?.metadata?.image ||
      null;

    return {
      contractAddress: nft.contract.address,
      contractLabel: label ?? 'Unknown',
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
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const contractAddresses = contracts
    ? [
        contracts.CONVEXO_PASSPORT,
        contracts.LP_INDIVIDUALS,
        contracts.LP_BUSINESS,
        contracts.ECREDITSCORING,
      ]
    : [];

  const { data: nfts, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['nft-metadata', address, chainId],
    queryFn: () => fetchNFTMetadata(address!, contractAddresses),
    enabled: !!address && isConnected && !!ALCHEMY_API_KEY && contractAddresses.length > 0,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    refetchOnWindowFocus: false,
  });

  const passportAddr  = contracts?.CONVEXO_PASSPORT?.toLowerCase();
  const lpIndAddr     = contracts?.LP_INDIVIDUALS?.toLowerCase();
  const lpBizAddr     = contracts?.LP_BUSINESS?.toLowerCase();
  const creditAddr    = contracts?.ECREDITSCORING?.toLowerCase();

  const passport     = nfts?.filter((n) => n.contractAddress.toLowerCase() === passportAddr) ?? [];
  const lpIndividual = nfts?.filter((n) => n.contractAddress.toLowerCase() === lpIndAddr) ?? [];
  const lpBusiness   = nfts?.filter((n) => n.contractAddress.toLowerCase() === lpBizAddr) ?? [];
  const creditScore  = nfts?.filter((n) => n.contractAddress.toLowerCase() === creditAddr) ?? [];

  return { nfts: nfts ?? [], passport, lpIndividual, lpBusiness, creditScore, isLoading, isError, error, refetch };
}
