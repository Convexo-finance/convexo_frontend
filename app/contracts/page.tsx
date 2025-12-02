'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useWriteContract, useWaitForTransactionReceipt, useContractRead } from 'wagmi';
import { keccak256, stringToBytes } from 'viem';
import { CONTRACTS } from '@/lib/contracts/addresses';
import { ContractSignerABI } from '@/lib/contracts/abis';
import { PinataUpload } from '@/components/PinataUpload';
import { DocumentList } from '@/components/DocumentList';
import { ContractsTable } from '@/components/ContractsTable';
import DashboardLayout from '@/components/DashboardLayout';

export default function ContractsPage() {
  const { isConnected, address } = useAccount();

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

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
            Contract Agreements
          </h1>

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>About Contract Signing:</strong> Create on-chain contract agreements for the three Convexo product types. 
              Upload a PDF contract document to Pinata IPFS, then use the document hash when creating vaults, invoices, or credits.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CreateContractForm />
            <ContractsList />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function CreateContractForm() {
  const { address } = useAccount();
  const [ipfsHash, setIpfsHash] = useState('');
  const [requiredSigners, setRequiredSigners] = useState('');
  const [expiryDays, setExpiryDays] = useState('365');
  const [nftReputationTier, setNftReputationTier] = useState('2');
  const [agreementType, setAgreementType] = useState('0');
  const [documentHash, setDocumentHash] = useState<`0x${string}` | null>(null);

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleCreateContract = () => {
    if (!address || !ipfsHash) {
      alert('Please fill in IPFS hash');
      return;
    }

    // Generate document hash from IPFS hash, address, and timestamp
    const generatedHash = keccak256(
      stringToBytes(ipfsHash + address + Date.now().toString())
    ) as `0x${string}`;
    
    setDocumentHash(generatedHash);

    const signersList = requiredSigners
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.startsWith('0x')) as `0x${string}`[];

    const expiryDuration = BigInt(parseInt(expiryDays) * 24 * 60 * 60);

    writeContract({
      address: CONTRACTS[84532].CONTRACT_SIGNER,
      abi: ContractSignerABI,
      functionName: 'createContract',
      args: [
        generatedHash,
        BigInt(agreementType),
        signersList.length > 0 ? signersList : [],
        ipfsHash,
        BigInt(nftReputationTier),
        expiryDuration,
      ],
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getAgreementTypeDescription = (type: string) => {
    switch (type) {
      case '0':
        return 'For Tokenized Bond Vaults - Create funding vaults via VaultFactory (Requires Tier 2)';
      case '1':
        return 'For Invoice Factoring - Sell unpaid invoices for immediate liquidity (Requires Tier 1)';
      case '2':
        return 'For Tokenized Bond Credits - Cash flow-backed loans via TokenizedBondCredits (Requires Tier 2)';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Create New Contract
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Create a signed contract agreement for one of the three Convexo product types.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Agreement Type *
          </label>
          <select
            value={agreementType}
            onChange={(e) => setAgreementType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="0">0 - Tokenized Bond Vault</option>
            <option value="1">1 - Invoice Factoring</option>
            <option value="2">2 - Tokenized Bond Credits</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {getAgreementTypeDescription(agreementType)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            IPFS Hash (Contract Document) *
          </label>
          
          {/* PDF Upload Component */}
          <div className="mb-3">
            <PinataUpload
              walletAddress={address}
              onUploadSuccess={(ipfsHash, ipfsUri, fileName) => {
                // Auto-fill the IPFS hash field
                setIpfsHash(ipfsUri);
                console.log('Upload successful:', { ipfsHash, ipfsUri, fileName });
              }}
              onUploadError={(error) => {
                alert(`Upload failed: ${error}`);
              }}
            />
          </div>
          
          {/* Manual input as fallback */}
          <div className="relative">
            <input
              type="text"
              value={ipfsHash}
              onChange={(e) => setIpfsHash(e.target.value)}
              placeholder="ipfs://... or Qm... (upload PDF above or paste manually)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10"
            />
            {ipfsHash && (
              <button
                onClick={() => {
                  setIpfsHash('');
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                type="button"
                title="Clear"
              >
                ✕
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Upload a PDF above or paste an IPFS hash manually
          </p>
          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
            <p className="text-yellow-800 dark:text-yellow-200">
              <strong>Privacy Note:</strong> Files uploaded to IPFS are publicly accessible. 
              Anyone with the IPFS hash can view the document. For sensitive contracts, 
              consider using private IPFS or encrypting documents before upload.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Required Signers (optional)
          </label>
          <input
            type="text"
            value={requiredSigners}
            onChange={(e) => setRequiredSigners(e.target.value)}
            placeholder="0x..., 0x... (comma-separated)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Comma-separated list of addresses that must sign the contract
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            NFT Reputation Tier Required
          </label>
          <input
            type="number"
            value={nftReputationTier}
            onChange={(e) => setNftReputationTier(e.target.value)}
            placeholder="2"
            min="0"
            max="2"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            0 = No NFT, 1 = Convexo_LPs NFT (Tier 1), 2 = Both NFTs (Tier 2)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Expiry Duration (Days)
          </label>
          <input
            type="number"
            value={expiryDays}
            onChange={(e) => setExpiryDays(e.target.value)}
            placeholder="365"
            min="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Number of days until the contract expires
          </p>
        </div>

        <button
          onClick={handleCreateContract}
          disabled={isPending || isConfirming}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending || isConfirming
            ? 'Creating Contract...'
            : isSuccess
            ? 'Contract Created!'
            : 'Create Contract'}
        </button>

        {writeError && (
          <div className="text-red-600 text-sm">Error: {writeError.message}</div>
        )}

        {isSuccess && documentHash && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
              ✓ Contract Created Successfully!
            </p>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-green-700 dark:text-green-300 block mb-1">
                  Document Hash (copy this for product creation):
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white dark:bg-gray-800 p-2 rounded border break-all text-gray-900 dark:text-white">
                    {documentHash}
                  </code>
                  <button
                    onClick={() => copyToClipboard(documentHash)}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 whitespace-nowrap"
                    type="button"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">
                <p className="mb-1">Use this hash when:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {agreementType === '0' && (
                    <li>Creating a vault in Enterprise → Create Funding Vault</li>
                  )}
                  {agreementType === '1' && (
                    <li>Creating an invoice in Enterprise → Invoice Factoring</li>
                  )}
                  {agreementType === '2' && (
                    <li>Creating a credit in Enterprise → Tokenized Bond Credits</li>
                  )}
                </ul>
              </div>
              <a
                href={`https://sepolia.basescan.org/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 underline block"
              >
                View Transaction on BaseScan →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ContractsList() {
  const { address } = useAccount();

  // Get total contract count
  const { data: count } = useContractRead({
    address: CONTRACTS[84532].CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'getContractCount',
    query: {
      enabled: !!address,
    },
  });

  // Get gateway URL from environment (client-side)
  const gatewayUrl = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_PINATA_GATEWAY 
    : undefined;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Contract Information
      </h2>
      
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Total contracts on chain:
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {count ? Number(count) : 'Loading...'}
          </p>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Contracts List
          </h3>
          <ContractsTable gatewayUrl={gatewayUrl} />
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Product Types:
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                0 - Tokenized Bond Vault
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Create funding vaults via VaultFactory. Requires Tier 2 (both NFTs).
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                1 - Invoice Factoring
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Sell unpaid invoices for immediate liquidity. Requires Tier 1 (Convexo_LPs NFT).
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                2 - Tokenized Bond Credits
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Cash flow-backed loans via TokenizedBondCredits. Requires Tier 2 (both NFTs).
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <DocumentList />
        </div>
      </div>
    </div>
  );
}

