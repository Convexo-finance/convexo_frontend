'use client';

import { useAccount, useChainId } from 'wagmi';
import { useState } from 'react';
import { CONTRACTS, getContractsForChain, IPFS } from '@/lib/contracts/addresses';
import { ConvexoLPsABI, ConvexoVaultsABI, ContractSignerABI } from '@/lib/contracts/abis';
import { useWriteContract, useWaitForTransactionReceipt, useContractRead } from 'wagmi';
import { parseUnits } from 'viem';
import DashboardLayout from '@/components/DashboardLayout';
import { ContractsTable } from '@/components/ContractsTable';
import { DocumentList } from '@/components/DocumentList';

export default function AdminPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const isAdmin = address?.toLowerCase() === contracts?.ADMIN_ADDRESS.toLowerCase();

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-4">Please connect your wallet</h2>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-red-800 dark:text-red-200">
                Access Denied
              </h2>
              <p className="text-red-700 dark:text-red-300 mb-4">
                This page is restricted to the admin address only.
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Your address: {address}
                <br />
                Required address: {contracts?.ADMIN_ADDRESS || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!contracts) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center py-20">
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold mb-4 text-red-800 dark:text-red-200">
                Unsupported Network
              </h2>
              <p className="text-red-700 dark:text-red-300">
                Please switch to one of the supported networks:
              </p>
              <ul className="mt-4 space-y-2 text-left">
                <li className="text-red-700 dark:text-red-300">• Base Sepolia (Chain ID: 84532)</li>
                <li className="text-red-700 dark:text-red-300">• Ethereum Sepolia (Chain ID: 11155111)</li>
                <li className="text-red-700 dark:text-red-300">• Unichain Sepolia (Chain ID: 1301)</li>
              </ul>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Network: <span className="font-semibold">{contracts.CHAIN_NAME}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MintNFT
            title="Mint Convexo_LPs NFT"
            description="Mint Tier 1 NFT for compliance verification"
            contractAddress={contracts.CONVEXO_LPS}
            abi={ConvexoLPsABI}
            functionName="safeMint"
            defaultUri={IPFS.CONVEXO_LPS_URI}
            chainId={chainId}
          />

          <MintNFT
            title="Mint Convexo_Vaults NFT"
            description="Mint Tier 2 NFT for credit scoring"
            contractAddress={contracts.CONVEXO_VAULTS}
            abi={ConvexoVaultsABI}
            functionName="safeMint"
            defaultUri={IPFS.CONVEXO_VAULTS_URI}
            chainId={chainId}
          />
        </div>

        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Admin Functions
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Use this interface to mint NFTs for verified users. Ensure KYB
            verification is complete before minting Convexo_LPs NFT, and credit
            score is above 70 before minting Convexo_Vaults NFT.
          </p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>IPFS Metadata:</strong> NFT metadata is hosted on Pinata IPFS.
              The Token URI fields are pre-filled with the correct IPFS links.
            </p>
            <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
              <p>Convexo_LPs: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{IPFS.CONVEXO_LPS_URI}</code></p>
              <p className="mt-1">Convexo_Vaults: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{IPFS.CONVEXO_VAULTS_URI}</code></p>
            </div>
          </div>
        </div>

        {/* Contract Information Section - Admin Only */}
        <div className="mt-8">
          <ContractInformationAdmin />
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MintNFT({
  title,
  description,
  contractAddress,
  abi,
  functionName,
  defaultUri,
  chainId,
}: {
  title: string;
  description: string;
  contractAddress: `0x${string}`;
  abi: any;
  functionName: string;
  defaultUri: string;
  chainId: number;
}) {
  const [recipient, setRecipient] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [uri, setUri] = useState(defaultUri);

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({
      hash,
    });

  const handleMint = () => {
    if (!recipient || !tokenId) {
      alert('Please fill in all required fields');
      return;
    }

    writeContract({
      address: contractAddress,
      abi,
      functionName,
      args: [
        recipient as `0x${string}`,
        BigInt(tokenId),
        uri || defaultUri,
      ],
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Token ID
          </label>
          <input
            type="text"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Token URI (pre-filled with Pinata IPFS)
          </label>
          <input
            type="text"
            value={uri}
            onChange={(e) => setUri(e.target.value)}
            placeholder="ipfs://..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Default IPFS URI is pre-filled. You can modify if needed.
          </p>
        </div>

        <button
          onClick={handleMint}
          disabled={isPending || isConfirming}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending || isConfirming
            ? 'Processing...'
            : isSuccess
            ? 'Minted!'
            : 'Mint NFT'}
        </button>

        {writeError && (
          <div className="text-red-600 text-sm">
            Error: {writeError.message}
          </div>
        )}

        {isSuccess && (
          <div className="text-green-600 text-sm">
            Transaction successful!{' '}
            <a
              href={
                chainId === 84532
                  ? `https://sepolia.basescan.org/tx/${hash}`
                  : chainId === 11155111
                  ? `https://sepolia.etherscan.io/tx/${hash}`
                  : chainId === 1301
                  ? `https://uniscan.uniwhale.io/tx/${hash}`
                  : '#'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on Block Explorer
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function ContractInformationAdmin() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  // Get total contract count
  const { data: count } = useContractRead({
    address: contracts?.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'getContractCount',
    query: {
      enabled: !!address && !!contracts,
    },
  });

  // Get gateway URL from environment (client-side)
  const gatewayUrl = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_PINATA_GATEWAY 
    : undefined;

  if (!contracts) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
        📊 Contract Information & Statistics
      </h2>
      
      <div className="space-y-6">
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Total contracts on {contracts.CHAIN_NAME}:
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {count ? Number(count) : 'Loading...'}
          </p>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            All Contracts List
          </h3>
          <ContractsTable gatewayUrl={gatewayUrl} />
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Product Type:
          </h3>
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Tokenized Bond Vault
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Create funding vaults via VaultFactory. Requires Tier 2 (both NFTs).
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            IPFS Documents
          </h3>
          <DocumentList />
        </div>
      </div>
    </div>
  );
}

