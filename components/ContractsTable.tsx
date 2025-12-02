'use client';

import { useContractRead, useChainId } from 'wagmi';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { ContractSignerABI } from '@/lib/contracts/abis';

interface ContractsTableProps {
  gatewayUrl?: string;
}

const AGREEMENT_TYPES = {
  0: 'Tokenized Bond Vault',
} as const;

export function ContractsTable({ gatewayUrl }: ContractsTableProps) {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data: count, isLoading: isLoadingCount } = useContractRead({
    address: contracts?.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'getContractCount',
    query: {
      enabled: !!contracts,
    },
  });

  const contractCount = count ? Number(count) : 0;

  if (!contracts) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">
          Unsupported network. Please switch to Base Sepolia, Ethereum Sepolia, or Unichain Sepolia.
        </p>
      </div>
    );
  }

  if (isLoadingCount) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading contracts...</p>
      </div>
    );
  }

  if (contractCount === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">No contracts created yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Contract Hash
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Agreement Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              IPFS Hash
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              IPFS Link
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: contractCount }).map((_, index) => (
            <ContractTableRow 
              key={index} 
              index={index} 
              gatewayUrl={gatewayUrl}
              contractSignerAddress={contracts.CONTRACT_SIGNER}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContractTableRow({ 
  index, 
  gatewayUrl,
  contractSignerAddress 
}: { 
  index: number; 
  gatewayUrl?: string;
  contractSignerAddress: `0x${string}`;
}) {
  // Get document hash at index
  const { data: documentHash, isLoading: isLoadingHash } = useContractRead({
    address: contractSignerAddress,
    abi: ContractSignerABI,
    functionName: 'getDocumentHashAtIndex',
    args: [BigInt(index)],
  });

  // Get contract details
  const { data: contractData, isLoading: isLoadingContract } = useContractRead({
    address: documentHash ? contractSignerAddress : undefined,
    abi: ContractSignerABI,
    functionName: 'getContract',
    args: documentHash ? [documentHash as `0x${string}`] : undefined,
    query: {
      enabled: !!documentHash,
    },
  });

  if (isLoadingHash || isLoadingContract) {
    return (
      <tr>
        <td colSpan={7} className="px-6 py-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </td>
      </tr>
    );
  }

  if (!contractData || !documentHash) {
    return null;
  }

  const contract = contractData as {
    documentHash: `0x${string}`;
    agreementType: number;
    initiator: `0x${string}`;
    createdAt: bigint;
    expiresAt: bigint;
    isExecuted: boolean;
    isCancelled: boolean;
    ipfsHash: string;
    nftReputationTier: bigint;
    vaultId: bigint;
  };

  // Extract IPFS hash from ipfsHash (could be "ipfs://..." or just the hash)
  const ipfsHash = contract.ipfsHash.replace('ipfs://', '').trim();
  
  // Construct IPFS URL
  const ipfsUrl = gatewayUrl 
    ? `https://${gatewayUrl}/ipfs/${ipfsHash}`
    : `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

  const agreementTypeName = AGREEMENT_TYPES[contract.agreementType as keyof typeof AGREEMENT_TYPES] || `Type ${contract.agreementType}`;
  
  const status = contract.isCancelled 
    ? 'Cancelled' 
    : contract.isExecuted 
    ? 'Executed' 
    : 'Active';

  const statusColor = contract.isCancelled
    ? 'text-red-600 dark:text-red-400'
    : contract.isExecuted
    ? 'text-green-600 dark:text-green-400'
    : 'text-blue-600 dark:text-blue-400';

  const createdDate = new Date(Number(contract.createdAt) * 1000).toLocaleDateString();

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-900">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
        {index + 1}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded font-mono">
          {contract.documentHash.slice(0, 10)}...{contract.documentHash.slice(-8)}
        </code>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {agreementTypeName}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {ipfsHash ? (
          <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded font-mono">
            {ipfsHash.slice(0, 12)}...
          </code>
        ) : (
          <span className="text-xs text-gray-400">N/A</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {ipfsHash ? (
          <a
            href={ipfsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            View PDF
          </a>
        ) : (
          <span className="text-xs text-gray-400">N/A</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`text-sm font-medium ${statusColor}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {createdDate}
      </td>
    </tr>
  );
}

