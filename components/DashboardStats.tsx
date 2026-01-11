'use client';

import { useAccount, useBalance, useContractRead, useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { erc20Abi } from 'viem';
import { ecopAbi } from '@/lib/contracts/ecopAbi';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { LPIndividualsABI, LPBusinessABI, EcreditscoringABI } from '@/lib/contracts/abis';
import { VaultFactoryABI, ContractSignerABI } from '@/lib/contracts/abis';
import { useState, useEffect } from 'react';

const GATEWAY_URL = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'lime-famous-condor-7.mypinata.cloud';

// IPFS hashes for NFT images
const IPFS_HASHES = {
  passport: 'bafybeiekwlyujx32cr5u3ixt5esfxhusalt5ljtrmsng74q7k45tilugh4',
  lpIndividuals: 'bafkreib7mkjzpdm3id6st6d5vsxpn7v5h6sxeiswejjmrbcb5yoagaf4em',
  lpBusiness: 'bafkreiejesvgsvohwvv7q5twszrbu5z6dnpke6sg5cdiwgn2rq7dilu33m',
  ecreditscoring: 'bafkreignxas6gqi7it5ng6muoykujxlgxxc4g7rr6sqvwgdfwveqf2zw3e',
};

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

export function DashboardStats() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const { 
    hasPassportNFT, 
    hasLPIndividualsNFT, 
    hasLPBusinessNFT, 
    hasEcreditscoringNFT,
    hasAnyLPNFT,
  } = useNFTBalance();

  // ETH Balance
  const { data: ethBalance, isLoading: isLoadingETH } = useBalance({
    address,
    query: {
      enabled: !!address && isConnected,
    },
  });

  // USDC Balance
  const { data: usdcBalance, isLoading: isLoadingUSDC } = useContractRead({
    address: address && contracts ? contracts.USDC : undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected && !!contracts,
    },
  });

  const { data: usdcDecimals } = useContractRead({
    address: contracts?.USDC,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: !!contracts,
    },
  });

  // ECOP Balance
  const { data: ecopBalance, isLoading: isLoadingECOP } = useContractRead({
    address: address && contracts ? contracts.ECOP : undefined,
    abi: ecopAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected && !!contracts,
    },
  });

  const { data: ecopDecimals } = useContractRead({
    address: contracts?.ECOP,
    abi: ecopAbi,
    functionName: 'decimals',
    query: {
      enabled: !!contracts,
    },
  });

  // Get NFT Metadata from IPFS
  const [lpIndividualsMetadata, setLpIndividualsMetadata] = useState<NFTMetadata | null>(null);
  const [lpBusinessMetadata, setLpBusinessMetadata] = useState<NFTMetadata | null>(null);
  const [ecreditscoringMetadata, setEcreditscoringMetadata] = useState<NFTMetadata | null>(null);

  useEffect(() => {
    if (hasLPIndividualsNFT) {
      const metadataUrl = `https://${GATEWAY_URL}/ipfs/${IPFS_HASHES.lpIndividuals}`;
      fetch(metadataUrl)
        .then((res) => {
          const contentType = res.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            return res.json().then((data) => setLpIndividualsMetadata(data));
          } else {
            setLpIndividualsMetadata({ name: 'LP Individual NFT', image: metadataUrl });
          }
        })
        .catch(() => {
          setLpIndividualsMetadata({ name: 'LP Individual NFT', image: metadataUrl });
        });
    }
  }, [hasLPIndividualsNFT]);

  useEffect(() => {
    if (hasLPBusinessNFT) {
      const metadataUrl = `https://${GATEWAY_URL}/ipfs/${IPFS_HASHES.lpBusiness}`;
      fetch(metadataUrl)
        .then((res) => {
          const contentType = res.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            return res.json().then((data) => setLpBusinessMetadata(data));
          } else {
            setLpBusinessMetadata({ name: 'LP Business NFT', image: metadataUrl });
          }
        })
        .catch(() => {
          setLpBusinessMetadata({ name: 'LP Business NFT', image: metadataUrl });
        });
    }
  }, [hasLPBusinessNFT]);

  useEffect(() => {
    if (hasEcreditscoringNFT) {
      const metadataUrl = `https://${GATEWAY_URL}/ipfs/${IPFS_HASHES.ecreditscoring}`;
      fetch(metadataUrl)
        .then((res) => {
          const contentType = res.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            return res.json().then((data) => setEcreditscoringMetadata(data));
          } else {
            setEcreditscoringMetadata({ name: 'Credit Score NFT', image: metadataUrl });
          }
        })
        .catch(() => {
          setEcreditscoringMetadata({ name: 'Credit Score NFT', image: metadataUrl });
        });
    }
  }, [hasEcreditscoringNFT]);

  // Get total counts
  const { data: vaultCount } = useContractRead({
    address: contracts?.VAULT_FACTORY,
    abi: VaultFactoryABI,
    functionName: 'getVaultCount',
    query: {
      enabled: !!contracts,
    },
  });

  const { data: contractCount } = useContractRead({
    address: contracts?.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'getContractCount',
    query: {
      enabled: !!contracts,
    },
  });

  if (!isConnected || !address) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Token Balances */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Token Balances
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BalanceCard
            label="ETH"
            balance={ethBalance?.value}
            decimals={18}
            isLoading={isLoadingETH}
            symbol="ETH"
          />
          <BalanceCard
            label="USDC"
            balance={usdcBalance as bigint | undefined}
            decimals={usdcDecimals as number | undefined}
            isLoading={isLoadingUSDC}
            symbol="USDC"
          />
          <BalanceCard
            label="ECOP"
            balance={ecopBalance as bigint | undefined}
            decimals={ecopDecimals as number | undefined}
            isLoading={isLoadingECOP}
            symbol="ECOP"
          />
        </div>
      </div>

      {/* NFT Holdings */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          NFT Holdings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <NFTCard
            name="Convexo Passport"
            metadata={null}
            ipfsUrl={`https://${GATEWAY_URL}/ipfs/${IPFS_HASHES.passport}`}
            imageUrl="/NFTs/convexo_zkpassport.png"
            isOwned={hasPassportNFT}
            tier={1}
            benefits="Tier 1 - ZKPassport verified. Access to Treasury, Vaults, and LP Pools."
          />
          <NFTCard
            name="LP Individual"
            metadata={lpIndividualsMetadata}
            ipfsUrl={`https://${GATEWAY_URL}/ipfs/${IPFS_HASHES.lpIndividuals}`}
            imageUrl={lpIndividualsMetadata?.image || `https://${GATEWAY_URL}/ipfs/${IPFS_HASHES.lpIndividuals}`}
            isOwned={hasLPIndividualsNFT}
            tier={2}
            benefits="Tier 2 - Veriff KYC verified individual. Credit scoring and monetization access."
          />
          <NFTCard
            name="LP Business"
            metadata={lpBusinessMetadata}
            ipfsUrl={`https://${GATEWAY_URL}/ipfs/${IPFS_HASHES.lpBusiness}`}
            imageUrl={lpBusinessMetadata?.image || `https://${GATEWAY_URL}/ipfs/${IPFS_HASHES.lpBusiness}`}
            isOwned={hasLPBusinessNFT}
            tier={2}
            benefits="Tier 2 - Sumsub KYB verified business. Credit scoring and monetization access."
          />
          <NFTCard
            name="Credit Score"
            metadata={ecreditscoringMetadata}
            ipfsUrl={`https://${GATEWAY_URL}/ipfs/${IPFS_HASHES.ecreditscoring}`}
            imageUrl={ecreditscoringMetadata?.image || `https://${GATEWAY_URL}/ipfs/${IPFS_HASHES.ecreditscoring}`}
            isOwned={hasEcreditscoringNFT}
            tier={3}
            benefits="Tier 3 - AI Credit Score verified. Vault creation and advanced lending."
          />
        </div>
      </div>

      {/* Total Counts */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Protocol Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            label="Total Vaults"
            value={vaultCount ? Number(vaultCount) : 0}
            href="/investments/vaults"
          />
          <StatCard
            label="Total Contracts"
            value={contractCount ? Number(contractCount) : 0}
            href="/funding/e-contracts"
          />
        </div>
      </div>
    </div>
  );
}

function BalanceCard({
  label,
  balance,
  decimals,
  isLoading,
  symbol,
}: {
  label: string;
  balance: bigint | undefined;
  decimals: number | undefined;
  isLoading: boolean;
  symbol: string;
}) {
  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const formattedBalance =
    balance && decimals ? formatUnits(balance, decimals) : '0.00';

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {parseFloat(formattedBalance).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })}{' '}
        {symbol}
      </p>
    </div>
  );
}

function NFTCard({
  name,
  metadata,
  ipfsUrl,
  imageUrl,
  isOwned,
  tier,
  benefits,
}: {
  name: string;
  metadata: NFTMetadata | null;
  ipfsUrl: string;
  imageUrl: string;
  isOwned: boolean;
  tier: number;
  benefits: string;
}) {
  const tierColors: Record<number, string> = {
    1: 'bg-blue-500',
    2: 'bg-purple-500',
    3: 'bg-amber-500',
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col items-center">
        <div className="relative mb-3">
          <img
            src={imageUrl}
            alt={name}
            className="w-20 h-20 rounded-lg object-cover border-2 border-gray-300 dark:border-gray-600"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://via.placeholder.com/80?text=${name}`;
            }}
          />
          {/* Tier Badge */}
          <div className={`absolute -top-2 -left-2 w-6 h-6 ${tierColors[tier]} rounded-full flex items-center justify-center text-white text-xs font-bold shadow`}>
            {tier}
          </div>
          {/* Ownership Badge */}
          <div className="absolute -top-2 -right-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs shadow ${
                isOwned ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {isOwned ? '✓' : '✗'}
            </div>
          </div>
        </div>
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white text-center mb-1">
          {name}
        </h3>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded mb-2 ${
            isOwned
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}
        >
          {isOwned ? 'Owned' : 'Not Owned'}
        </span>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
          {benefits}
        </p>
        <a
          href={ipfsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          View on IPFS →
        </a>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block hover:opacity-80 transition-opacity">
        {content}
      </a>
    );
  }

  return content;
}

