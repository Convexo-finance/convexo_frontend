'use client';

import { useAccount, useBalance, useContractRead } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACTS } from '@/lib/contracts/addresses';
import { erc20Abi } from 'viem';
import { ecopAbi } from '@/lib/contracts/ecopAbi';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { ConvexoLPsABI, ConvexoVaultsABI } from '@/lib/contracts/abis';
import { VaultFactoryABI, InvoiceFactoringABI, TokenizedBondCreditsABI, ContractSignerABI } from '@/lib/contracts/abis';
import { useState, useEffect } from 'react';

const GATEWAY_URL = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'gateway.pinata.cloud';
const VAULTS_IPFS = 'bafkreignxas6gqi7it5ng6muoykujxlgxxc4g7rr6sqvwgdfwveqf2zw3e';
const LPS_IPFS = 'bafkreib7mkjzpdm3id6st6d5vsxpn7v5h6sxeiswejjmrbcb5yoagaf4em';

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

export function DashboardStats() {
  const { address, isConnected } = useAccount();
  const { hasLPsNFT, hasVaultsNFT, lpsBalance, vaultsBalance } = useNFTBalance();

  // ETH Balance
  const { data: ethBalance, isLoading: isLoadingETH } = useBalance({
    address,
    query: {
      enabled: !!address && isConnected,
    },
  });

  // USDC Balance
  const { data: usdcBalance, isLoading: isLoadingUSDC } = useContractRead({
    address: address ? CONTRACTS.BASE_SEPOLIA.USDC : undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  const { data: usdcDecimals } = useContractRead({
    address: CONTRACTS.BASE_SEPOLIA.USDC,
    abi: erc20Abi,
    functionName: 'decimals',
  });

  // ECOP Balance
  const { data: ecopBalance, isLoading: isLoadingECOP } = useContractRead({
    address: address ? CONTRACTS.BASE_SEPOLIA.ECOP : undefined,
    abi: ecopAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  const { data: ecopDecimals } = useContractRead({
    address: CONTRACTS.BASE_SEPOLIA.ECOP,
    abi: ecopAbi,
    functionName: 'decimals',
  });

  // Get NFT Token IDs (if contract supports tokenOfOwnerByIndex)
  // Note: If these functions don't exist, the hook will just return undefined
  const { data: lpsTokenId } = useContractRead({
    address: address && hasLPsNFT ? CONTRACTS.BASE_SEPOLIA.CONVEXO_LPS : undefined,
    abi: ConvexoLPsABI,
    functionName: 'tokenOfOwnerByIndex',
    args: address ? [address, 0n] : undefined,
    query: {
      enabled: false, // Disabled - enable if contract supports this function
    },
  });

  const { data: vaultsTokenId } = useContractRead({
    address: address && hasVaultsNFT ? CONTRACTS.BASE_SEPOLIA.CONVEXO_VAULTS : undefined,
    abi: ConvexoVaultsABI,
    functionName: 'tokenOfOwnerByIndex',
    args: address ? [address, 0n] : undefined,
    query: {
      enabled: false, // Disabled - enable if contract supports this function
    },
  });

  // Get NFT Metadata from IPFS
  const [lpsMetadata, setLpsMetadata] = useState<NFTMetadata | null>(null);
  const [vaultsMetadata, setVaultsMetadata] = useState<NFTMetadata | null>(null);
  const [lpsImageUrl, setLpsImageUrl] = useState<string | null>(null);
  const [vaultsImageUrl, setVaultsImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (hasLPsNFT) {
      const metadataUrl = `https://${GATEWAY_URL}/ipfs/${LPS_IPFS}`;
      // Try to fetch as JSON first (metadata)
      fetch(metadataUrl)
        .then((res) => {
          const contentType = res.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            return res.json().then((data) => {
              setLpsMetadata(data);
              if (data.image) {
                // If image is relative, make it absolute
                const imageUrl = data.image.startsWith('ipfs://')
                  ? `https://${GATEWAY_URL}/ipfs/${data.image.replace('ipfs://', '')}`
                  : data.image.startsWith('http')
                  ? data.image
                  : `https://${GATEWAY_URL}/ipfs/${data.image}`;
                setLpsImageUrl(imageUrl);
              }
            });
          } else {
            // If it's an image, use it directly
            setLpsImageUrl(metadataUrl);
            setLpsMetadata({ name: 'Convexo_LPs NFT', image: metadataUrl });
          }
        })
        .catch(() => {
          // Fallback: assume it's an image
          setLpsImageUrl(metadataUrl);
          setLpsMetadata({ name: 'Convexo_LPs NFT', image: metadataUrl });
        });
    }
  }, [hasLPsNFT]);

  useEffect(() => {
    if (hasVaultsNFT) {
      const metadataUrl = `https://${GATEWAY_URL}/ipfs/${VAULTS_IPFS}`;
      // Try to fetch as JSON first (metadata)
      fetch(metadataUrl)
        .then((res) => {
          const contentType = res.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            return res.json().then((data) => {
              setVaultsMetadata(data);
              if (data.image) {
                // If image is relative, make it absolute
                const imageUrl = data.image.startsWith('ipfs://')
                  ? `https://${GATEWAY_URL}/ipfs/${data.image.replace('ipfs://', '')}`
                  : data.image.startsWith('http')
                  ? data.image
                  : `https://${GATEWAY_URL}/ipfs/${data.image}`;
                setVaultsImageUrl(imageUrl);
              }
            });
          } else {
            // If it's an image, use it directly
            setVaultsImageUrl(metadataUrl);
            setVaultsMetadata({ name: 'Convexo_Vaults NFT', image: metadataUrl });
          }
        })
        .catch(() => {
          // Fallback: assume it's an image
          setVaultsImageUrl(metadataUrl);
          setVaultsMetadata({ name: 'Convexo_Vaults NFT', image: metadataUrl });
        });
    }
  }, [hasVaultsNFT]);

  // Get total counts
  const { data: vaultCount } = useContractRead({
    address: CONTRACTS.BASE_SEPOLIA.VAULT_FACTORY,
    abi: VaultFactoryABI,
    functionName: 'getVaultCount',
  });

  // Note: These functions may not exist in the contracts - adjust based on actual ABI
  const { data: invoiceCount } = useContractRead({
    address: CONTRACTS.BASE_SEPOLIA.INVOICE_FACTORING,
    abi: InvoiceFactoringABI,
    functionName: 'getInvoiceCount', // Adjust if function name differs
    query: {
      enabled: false, // Disabled by default - enable when function is confirmed
    },
  });

  const { data: creditCount } = useContractRead({
    address: CONTRACTS.BASE_SEPOLIA.TOKENIZED_BOND_CREDITS,
    abi: TokenizedBondCreditsABI,
    functionName: 'getCreditCount', // Adjust if function name differs
    query: {
      enabled: false, // Disabled by default - enable when function is confirmed
    },
  });

  const { data: contractCount } = useContractRead({
    address: CONTRACTS.BASE_SEPOLIA.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'getContractCount',
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NFTCard
            name="Convexo_Vaults NFT"
            tokenId={vaultsTokenId ? String(vaultsTokenId) : undefined}
            metadata={vaultsMetadata}
            ipfsUrl={`https://${GATEWAY_URL}/ipfs/${VAULTS_IPFS}`}
            imageUrl={vaultsImageUrl || vaultsMetadata?.image || `https://${GATEWAY_URL}/ipfs/${VAULTS_IPFS}`}
            isOwned={hasVaultsNFT}
            benefits="Tier 2 NFT required for creating funding vaults and tokenized bond credits. Enables access to credit scoring features and advanced lending products."
          />
          <NFTCard
            name="Convexo_LPs NFT"
            tokenId={lpsTokenId ? String(lpsTokenId) : undefined}
            metadata={lpsMetadata}
            ipfsUrl={`https://${GATEWAY_URL}/ipfs/${LPS_IPFS}`}
            imageUrl={lpsImageUrl || lpsMetadata?.image || `https://${GATEWAY_URL}/ipfs/${LPS_IPFS}`}
            isOwned={hasLPsNFT}
            benefits="Tier 1 NFT required for invoice factoring and compliant liquidity pool access. Enables participation in Uniswap V4 pools with ECOP/USDC."
          />
        </div>
      </div>

      {/* Total Counts */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Protocol Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Vaults"
            value={vaultCount ? Number(vaultCount) : 0}
            href="/loans/vaults"
          />
          <StatCard
            label="Total Invoices"
            value={invoiceCount ? Number(invoiceCount) : 0}
            href="/loans/invoices"
          />
          <StatCard
            label="Total Credits"
            value={creditCount ? Number(creditCount) : 0}
            href="/loans/credits"
          />
          <StatCard
            label="Total Contracts"
            value={contractCount ? Number(contractCount) : 0}
            href="/contracts"
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
  tokenId,
  metadata,
  ipfsUrl,
  imageUrl,
  isOwned,
  benefits,
}: {
  name: string;
  tokenId?: string;
  metadata: NFTMetadata | null;
  ipfsUrl: string;
  imageUrl: string;
  isOwned: boolean;
  benefits: string;
}) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 relative">
          <img
            src={imageUrl}
            alt={name}
            className="w-24 h-24 rounded-lg object-cover border-2 border-gray-300 dark:border-gray-600"
            onError={(e) => {
              // Fallback if image fails to load
              (e.target as HTMLImageElement).src = `https://via.placeholder.com/96?text=${name}`;
            }}
          />
          {/* Ownership Status Badge */}
          <div className="absolute -top-2 -right-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                isOwned
                  ? 'bg-green-500 dark:bg-green-600'
                  : 'bg-red-500 dark:bg-red-600'
              }`}
              title={isOwned ? 'Owned' : 'Not Owned'}
            >
              {isOwned ? '✓' : '✗'}
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {name}
            </h3>
            <span
              className={`text-xs font-medium px-2 py-1 rounded ${
                isOwned
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}
            >
              {isOwned ? 'Owned (1)' : 'Not Owned (0)'}
            </span>
          </div>
          {tokenId && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Token ID: {tokenId}
            </p>
          )}
          <div className="mb-2">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Benefits:
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {benefits}
            </p>
          </div>
          <a
            href={ipfsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Metadata →
          </a>
        </div>
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

