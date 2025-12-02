'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useWriteContract, useWaitForTransactionReceipt, useContractRead } from 'wagmi';
import { keccak256, stringToBytes } from 'viem';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { ContractSignerABI } from '@/lib/contracts/abis';
import { PinataUpload } from '@/components/PinataUpload';
import { DocumentList } from '@/components/DocumentList';
import { ContractsTable } from '@/components/ContractsTable';
import DashboardLayout from '@/components/DashboardLayout';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function ContractsPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

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
              Contract Agreements
            </h1>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Network: <span className="font-semibold">{contracts.CHAIN_NAME}</span>
            </div>
          </div>

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>About Contract Signing:</strong> Create on-chain contract agreements for Tokenized Bond Vaults. 
              Upload a PDF contract document to Pinata IPFS, then use the document hash when creating vaults.
            </p>
          </div>

          {/* Create New Contract Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Create New Contract
            </h2>
            <CreateContractForm />
          </div>

          {/* My Contracts Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              My Contracts
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Contracts where you are involved as borrower or lender
            </p>
            <MyContractsSection />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function CreateContractForm() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  
  const [ipfsHash, setIpfsHash] = useState('');
  const [lenders, setLenders] = useState('');
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
    if (!address || !ipfsHash || !contracts) {
      alert('Please fill in IPFS hash and ensure you are on a supported network');
      return;
    }

    // Generate document hash from IPFS hash, address, and timestamp
    const generatedHash = keccak256(
      stringToBytes(ipfsHash + address + Date.now().toString())
    ) as `0x${string}`;
    
    setDocumentHash(generatedHash);

    const lendersList = lenders
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.startsWith('0x')) as `0x${string}`[];

    const expiryDuration = BigInt(365 * 24 * 60 * 60); // Default 1 year

    writeContract({
      address: contracts.CONTRACT_SIGNER,
      abi: ContractSignerABI,
      functionName: 'createContract',
      args: [
        generatedHash,
        BigInt(0), // Agreement type 0 = Tokenized Bond Vault
        lendersList.length > 0 ? lendersList : [],
        ipfsHash,
        BigInt(2), // Default Tier 2 (both NFTs required)
        expiryDuration,
      ],
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getExplorerUrl = () => {
    if (!hash || !contracts) return '#';
    
    switch (contracts.CHAIN_ID) {
      case 84532:
        return `https://sepolia.basescan.org/tx/${hash}`;
      case 11155111:
        return `https://sepolia.etherscan.io/tx/${hash}`;
      case 1301:
        return `https://uniscan.uniwhale.io/tx/${hash}`;
      default:
        return '#';
    }
  };

  if (!contracts) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Create New Contract
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Create a signed contract agreement for Tokenized Bond Vaults.
      </p>

      <div className="space-y-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Agreement Type: Tokenized Bond Vault
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Create funding vaults via VaultFactory. Requires Tier 2 (both NFTs).
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
            Lenders (optional)
          </label>
          <input
            type="text"
            value={lenders}
            onChange={(e) => setLenders(e.target.value)}
            placeholder="0x..., 0x... (comma-separated wallet addresses)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Add lender wallet addresses (comma-separated). These addresses will be able to invest in the vault.
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
                  Document Hash (copy this for vault creation):
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
                <p className="mb-1">Use this hash when creating a vault in Loans → Vaults</p>
              </div>
              <a
                href={getExplorerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 underline block"
              >
                View Transaction on Block Explorer →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ContractsList component has been moved to admin module
// See: app/admin/page.tsx -> ContractInformationAdmin component

function MyContractsSection() {
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

  if (!contracts || !address) return null;

  const totalContracts = count ? Number(count) : 0;

  if (totalContracts === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
        <p className="text-gray-600 dark:text-gray-400">No contracts found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: totalContracts }).map((_, index) => (
        <MyContractCard key={index} contractIndex={index} userAddress={address} />
      ))}
    </div>
  );
}

function MyContractCard({ contractIndex, userAddress }: { contractIndex: number; userAddress: `0x${string}` }) {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  // Get document hash at index
  const { data: documentHash } = useContractRead({
    address: contracts?.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'getDocumentHashAtIndex',
    args: [BigInt(contractIndex)],
    query: {
      enabled: !!contracts,
    },
  });

  // Get contract data
  const { data: contractData } = useContractRead({
    address: documentHash && contracts ? contracts.CONTRACT_SIGNER : undefined,
    abi: ContractSignerABI,
    functionName: 'getContract',
    args: documentHash ? [documentHash as `0x${string}`] : undefined,
    query: {
      enabled: !!documentHash && !!contracts,
    },
  });

  // Get required signers
  const { data: requiredSignersData } = useContractRead({
    address: contracts?.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'getRequiredSigners',
    args: documentHash ? [documentHash as `0x${string}`] : undefined,
    query: {
      enabled: !!documentHash && !!contracts,
    },
  });

  // Check if user has signed
  const { data: hasSignedData } = useContractRead({
    address: contracts?.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'hasSigned',
    args: documentHash ? [documentHash as `0x${string}`, userAddress] : undefined,
    query: {
      enabled: !!documentHash && !!contracts,
    },
  });

  // Check if fully signed
  const { data: isFullySignedData } = useContractRead({
    address: contracts?.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'isFullySigned',
    args: documentHash ? [documentHash as `0x${string}`] : undefined,
    query: {
      enabled: !!documentHash && !!contracts,
    },
  });

  // Sign contract function
  const {
    writeContract: signContract,
    data: signHash,
    isPending: isSigning,
  } = useWriteContract();

  const { isLoading: isConfirmingSign, isSuccess: signSuccess } =
    useWaitForTransactionReceipt({
      hash: signHash,
    });

  // Cancel contract function
  const {
    writeContract: cancelContract,
    data: cancelHash,
    isPending: isCancelling,
  } = useWriteContract();

  const { isLoading: isConfirmingCancel, isSuccess: cancelSuccess } =
    useWaitForTransactionReceipt({
      hash: cancelHash,
    });

  // Execute contract function (Admin only)
  const {
    writeContract: executeContract,
    data: executeHash,
    isPending: isExecuting,
  } = useWriteContract();

  const { isLoading: isConfirmingExecute, isSuccess: executeSuccess } =
    useWaitForTransactionReceipt({
      hash: executeHash,
    });

  const [copied, setCopied] = useState(false);

  // Early returns after all hooks
  if (!contractData || !contracts) return null;

  // ContractDocument struct from the ABI
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

  const requiredSigners = (requiredSignersData as `0x${string}`[]) || [];
  const hasSigned = hasSignedData as boolean;
  const isFullySigned = isFullySignedData as boolean;

  // Check if user is involved (creator or required signer)
  const isCreator = contract.initiator.toLowerCase() === userAddress.toLowerCase();
  const isRequiredSigner = requiredSigners.some(
    (signer) => signer.toLowerCase() === userAddress.toLowerCase()
  );

  if (!isCreator && !isRequiredSigner) {
    return null; // User is not involved in this contract
  }

  const handleSign = async () => {
    if (!documentHash || !contracts) return;
    
    try {
      // Request signature from wallet
      const signature = await window.ethereum?.request({
        method: 'personal_sign',
        params: [documentHash, userAddress],
      });

      if (!signature) {
        alert('Signature cancelled');
        return;
      }
      
      signContract({
        address: contracts.CONTRACT_SIGNER,
        abi: ContractSignerABI,
        functionName: 'signContract',
        args: [documentHash as `0x${string}`, signature as `0x${string}`],
      });
    } catch (error) {
      console.error('Error signing:', error);
      alert('Failed to sign contract');
    }
  };

  const handleCancel = () => {
    if (!documentHash || !contracts) return;
    
    cancelContract({
      address: contracts.CONTRACT_SIGNER,
      abi: ContractSignerABI,
      functionName: 'cancelContract',
      args: [documentHash as `0x${string}`],
    });
  };

  const handleExecute = () => {
    if (!documentHash || !contracts) return;
    
    // For execute, we need the vaultId. If it's 0, we need to prompt the user
    const vaultIdToUse = contract.vaultId || BigInt(0);
    
    executeContract({
      address: contracts.CONTRACT_SIGNER,
      abi: ContractSignerABI,
      functionName: 'executeContract',
      args: [documentHash as `0x${string}`, vaultIdToUse],
    });
  };

  const copyHash = () => {
    if (documentHash) {
      navigator.clipboard.writeText(documentHash as string);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const gatewayUrl = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_PINATA_GATEWAY 
    : undefined;

  const getIpfsUrl = (hash: string) => {
    if (!hash) return '';
    if (hash.startsWith('ipfs://')) {
      const cid = hash.replace('ipfs://', '');
      return gatewayUrl ? `${gatewayUrl}/ipfs/${cid}` : `https://lime-famous-condor-7.mypinata.cloud/ipfs/${cid}`;
    }
    if (hash.startsWith('Qm') || hash.startsWith('baf')) {
      return gatewayUrl ? `${gatewayUrl}/ipfs/${hash}` : `https://lime-famous-condor-7.mypinata.cloud/ipfs/${hash}`;
    }
    return hash;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Contract #{contractIndex}
          </h3>
          <div className="flex items-center space-x-2 flex-wrap gap-1">
            {isCreator && (
              <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                Borrower
              </span>
            )}
            {isRequiredSigner && (
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                Lender
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded ${
              contract.isCancelled
                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                : contract.isExecuted
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                : isFullySigned
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
            }`}>
              {contract.isCancelled 
                ? '❌ Cancelled' 
                : contract.isExecuted 
                ? '✅ Executed' 
                : isFullySigned 
                ? '✓ Fully Signed - Ready to Execute'
                : '⏳ Pending Signatures'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Contract Hash:</p>
          <div className="flex items-center justify-between">
            <p className="text-sm font-mono text-gray-900 dark:text-white break-all mr-2">
              {documentHash ? (documentHash as string).slice(0, 20) + '...' + (documentHash as string).slice(-20) : 'N/A'}
            </p>
            <button
              onClick={copyHash}
              className="flex-shrink-0 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Copy hash"
            >
              {copied ? (
                <CheckIcon className="h-4 w-4 text-green-600" />
              ) : (
                <ClipboardDocumentIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Use this hash to attach the contract to your vault
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Borrower:</p>
          <div className="flex items-center justify-between">
            <p className="text-sm font-mono text-gray-900 dark:text-white">
              {contract.initiator.slice(0, 10)}...{contract.initiator.slice(-8)}
            </p>
            {isCreator && hasSigned && (
              <span className="text-xs text-green-600 dark:text-green-400">✓ Signed</span>
            )}
          </div>
        </div>

        {requiredSigners.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Lenders ({requiredSigners.length}):
            </p>
            <div className="space-y-1">
              {requiredSigners.map((signer, idx) => {
                const signerHasSigned = hasSigned && signer.toLowerCase() === userAddress.toLowerCase();
                return (
                  <div key={idx} className="flex items-center justify-between">
                    <p className="text-sm font-mono text-gray-900 dark:text-white">
                      {signer.slice(0, 10)}...{signer.slice(-8)}
                    </p>
                    {signerHasSigned && (
                      <span className="text-xs text-green-600 dark:text-green-400">✓ Signed</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {contract.ipfsHash && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document:</p>
            <a
              href={getIpfsUrl(contract.ipfsHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
            >
              {contract.ipfsHash.slice(0, 40)}...
            </a>
          </div>
        )}

        {/* Sign Button - For parties who haven't signed yet */}
        {(isCreator || isRequiredSigner) && !hasSigned && !contract.isCancelled && !contract.isExecuted && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSign}
              disabled={isSigning || isConfirmingSign}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSigning || isConfirmingSign ? 'Signing...' : 'Sign Contract'}
            </button>
            {signSuccess && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2 text-center">
                Contract signed successfully!
              </p>
            )}
          </div>
        )}

        {/* Execute Button - Only for Admin when fully signed */}
        {isFullySigned && !contract.isExecuted && !contract.isCancelled && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleExecute}
              disabled={isExecuting || isConfirmingExecute}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExecuting || isConfirmingExecute ? 'Executing...' : '✅ Execute Contract (Admin)'}
            </button>
            {executeSuccess && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2 text-center">
                Contract executed successfully!
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Only admin can execute fully signed contracts
            </p>
          </div>
        )}

        {/* Cancel Button - For creator or admin */}
        {!contract.isCancelled && !contract.isExecuted && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleCancel}
              disabled={isCancelling || isConfirmingCancel}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancelling || isConfirmingCancel ? 'Cancelling...' : '❌ Cancel Contract'}
            </button>
            {cancelSuccess && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2 text-center">
                Contract cancelled successfully!
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Only borrower or admin can cancel contracts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

