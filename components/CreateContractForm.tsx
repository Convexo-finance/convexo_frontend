'use client';

import { useState } from 'react';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { ContractSignerABI } from '@/lib/contracts/abis';
import { PinataUpload } from './PinataUpload';
import { keccak256, toBytes } from 'viem';
import {
  DocumentPlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface CreateContractFormProps {
  onSuccess?: () => void;
}

const AGREEMENT_TYPES = {
  0: 'Tokenized Bond Vault',
} as const;

export function CreateContractForm({ onSuccess }: CreateContractFormProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const [formData, setFormData] = useState({
    documentName: '',
    agreementType: '0',
    ipfsHash: '',
    requiredSigners: '',
    expiryDays: '30',
  });

  const [uploadedFile, setUploadedFile] = useState<{
    ipfsHash: string;
    ipfsUri: string;
    fileName?: string;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (!isConnected) {
    return (
      <div className="card p-6 border-amber-700/50 bg-amber-900/20">
        <p className="text-amber-200">Please connect your wallet to create a contract.</p>
      </div>
    );
  }

  const handleFileUpload = (ipfsHash: string, ipfsUri: string, fileName?: string) => {
    setUploadedFile({ ipfsHash, ipfsUri, fileName });
    setFormData((prev) => ({ ...prev, ipfsHash }));
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateContract = async () => {
    // Validate inputs
    if (!formData.documentName.trim()) {
      setError('Document name is required');
      return;
    }

    if (!uploadedFile?.ipfsHash) {
      setError('Please upload a document first');
      return;
    }

    if (!formData.requiredSigners.trim()) {
      setError('Please enter at least one signer address');
      return;
    }

    // Parse signer addresses
    const signerAddresses = formData.requiredSigners
      .split(',')
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);

    if (signerAddresses.length === 0) {
      setError('Please enter valid signer addresses');
      return;
    }

    // Validate addresses format
    const invalidAddresses = signerAddresses.filter((addr) => !addr.startsWith('0x') || addr.length !== 42);
    if (invalidAddresses.length > 0) {
      setError('Invalid Ethereum address format. Addresses must start with 0x and be 42 characters long.');
      return;
    }

    try {
      setError(null);

      // Create document hash
      const documentHash = keccak256(toBytes(formData.documentName + uploadedFile.ipfsHash));

      // Parse expiry duration (convert days to seconds)
      const expiryDuration = BigInt(parseInt(formData.expiryDays) * 86400);

      // Call contract create function
      writeContract({
        address: contracts?.CONTRACT_SIGNER as `0x${string}`,
        abi: ContractSignerABI,
        functionName: 'createContract',
        args: [
          documentHash,
          parseInt(formData.agreementType),
          signerAddresses as `0x${string}`[],
          uploadedFile.ipfsHash,
          1n, // Default tier requirement (Tier 1+)
          expiryDuration,
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contract');
    }
  };

  // Handle transaction success
  if (isSuccess && !success) {
    setSuccess(true);
    setTimeout(() => {
      setFormData({
        documentName: '',
        agreementType: '0',
        ipfsHash: '',
        requiredSigners: '',
        expiryDays: '30',
      });
      setUploadedFile(null);
      onSuccess?.();
    }, 2000);
  }

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
          <DocumentPlusIcon className="w-5 h-5" />
          Create New Contract
        </h3>
        <p className="text-gray-400 text-sm">Upload a document, add signers, and create an on-chain contract agreement.</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 flex gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-200 font-medium">Error</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-4 flex gap-3">
          <CheckCircleIcon className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-emerald-200 font-medium">Contract Created Successfully!</p>
            <p className="text-emerald-300 text-sm">Your contract has been stored on-chain. Signers can now sign the agreement.</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Document Upload */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">1. Upload Document (PDF)</label>
          <PinataUpload
            onUploadSuccess={handleFileUpload}
            walletAddress={address}
          />
          {uploadedFile && (
            <div className="mt-2 p-3 bg-emerald-900/20 border border-emerald-700/50 rounded-lg">
              <p className="text-emerald-200 text-sm">
                ✓ Uploaded: <span className="font-mono">{uploadedFile.fileName}</span>
              </p>
              <p className="text-emerald-300 text-xs mt-1">IPFS: {uploadedFile.ipfsHash.slice(0, 16)}...</p>
            </div>
          )}
        </div>

        {/* Document Name */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">2. Document Name</label>
          <input
            type="text"
            name="documentName"
            value={formData.documentName}
            onChange={handleInputChange}
            placeholder="e.g., Loan Agreement #1"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <p className="text-gray-500 text-xs mt-1">A descriptive name for this contract</p>
        </div>

        {/* Agreement Type */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">3. Agreement Type</label>
          <select
            name="agreementType"
            value={formData.agreementType}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            {Object.entries(AGREEMENT_TYPES).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </div>

        {/* Required Signers */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">4. Required Signers (Addresses)</label>
          <textarea
            name="requiredSigners"
            value={formData.requiredSigners}
            onChange={handleInputChange}
            placeholder="0x1234...&#10;0x5678...&#10;0x9abc..."
            rows={4}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
          />
          <p className="text-gray-500 text-xs mt-1">Enter one Ethereum address per line. All signers must sign before the contract can be executed.</p>
        </div>

        {/* Expiry Duration */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">5. Expiry Duration (Days)</label>
          <input
            type="number"
            name="expiryDays"
            value={formData.expiryDays}
            onChange={handleInputChange}
            min="1"
            max="365"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
          <p className="text-gray-500 text-xs mt-1">Contract expires after this many days if not signed by all parties</p>
        </div>
      </div>

      {/* Create Button */}
      <button
        onClick={handleCreateContract}
        disabled={isPending || isConfirming || !uploadedFile || !formData.documentName.trim()}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
      >
        {isPending ? 'Submitting...' : isConfirming ? 'Confirming...' : 'Create Contract on Chain'}
      </button>

      {/* Info Banner */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <p className="text-blue-300 text-sm">
          <strong>Note:</strong> Creating a contract on-chain requires a transaction. All signers will receive notifications to sign the agreement.
        </p>
      </div>
    </div>
  );
}
