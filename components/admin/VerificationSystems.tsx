'use client';

import { useState } from 'react';
import { useChainId, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { getContractsForChain, getBlockExplorerUrl } from '@/lib/contracts/addresses';
import { VeriffVerifierABI, SumsubVerifierABI } from '@/lib/contracts/abis';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

type VerificationType = 'veriff' | 'sumsub';

export function VerificationSystems() {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const [verificationType, setVerificationType] = useState<VerificationType>('veriff');
  const [userAddress, setUserAddress] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [lookupAddress, setLookupAddress] = useState('');

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Veriff status lookup
  const { data: veriffStatus, refetch: refetchVeriff } = useReadContract({
    address: contracts?.VERIFF_VERIFIER,
    abi: VeriffVerifierABI,
    functionName: 'getVerificationStatus',
    args: lookupAddress ? [lookupAddress as `0x${string}`] : undefined,
    query: { enabled: !!lookupAddress && lookupAddress.startsWith('0x') && verificationType === 'veriff' },
  });

  // Sumsub status lookup
  const { data: sumsubStatus, refetch: refetchSumsub } = useReadContract({
    address: contracts?.SUMSUB_VERIFIER,
    abi: SumsubVerifierABI,
    functionName: 'getVerificationStatus',
    args: lookupAddress ? [lookupAddress as `0x${string}`] : undefined,
    query: { enabled: !!lookupAddress && lookupAddress.startsWith('0x') && verificationType === 'sumsub' },
  });

  const currentContract = verificationType === 'veriff' ? contracts?.VERIFF_VERIFIER : contracts?.SUMSUB_VERIFIER;
  const currentABI = verificationType === 'veriff' ? VeriffVerifierABI : SumsubVerifierABI;

  const handleSubmit = () => {
    if (!userAddress || !sessionId || !currentContract) {
      alert('Please fill in user address and session ID');
      return;
    }

    writeContract({
      address: currentContract as `0x${string}`,
      abi: currentABI,
      functionName: 'submitVerification',
      args: [userAddress as `0x${string}`, sessionId],
    });
  };

  const handleApprove = () => {
    if (!userAddress || !currentContract) {
      alert('Please fill in user address');
      return;
    }

    writeContract({
      address: currentContract as `0x${string}`,
      abi: currentABI,
      functionName: 'approveVerification',
      args: [userAddress as `0x${string}`],
    });
  };

  const handleReject = () => {
    if (!userAddress || !rejectReason || !currentContract) {
      alert('Please fill in user address and rejection reason');
      return;
    }

    writeContract({
      address: currentContract as `0x${string}`,
      abi: currentABI,
      functionName: 'rejectVerification',
      args: [userAddress as `0x${string}`, rejectReason],
    });
  };

  const handleReset = () => {
    if (!userAddress || !currentContract) {
      alert('Please fill in user address');
      return;
    }

    writeContract({
      address: currentContract as `0x${string}`,
      abi: currentABI,
      functionName: 'resetVerification',
      args: [userAddress as `0x${string}`],
    });
  };

  const handleLookup = () => {
    if (verificationType === 'veriff') {
      refetchVeriff();
    } else {
      refetchSumsub();
    }
  };

  const getStatusInfo = (status: number) => {
    const statuses = [
      { label: 'Not Submitted', color: 'gray', icon: ClockIcon },
      { label: 'Pending', color: 'amber', icon: ClockIcon },
      { label: 'Approved', color: 'emerald', icon: CheckCircleIcon },
      { label: 'Rejected', color: 'red', icon: XCircleIcon },
    ];
    return statuses[status] || statuses[0];
  };

  const currentStatus = verificationType === 'veriff' ? veriffStatus : sumsubStatus;
  const statusInfo = currentStatus && Array.isArray(currentStatus) ? getStatusInfo(Number(currentStatus[0])) : null;
  const StatusIcon = statusInfo?.icon;

  return (
    <div className="space-y-6">
      {/* Verification Type Selection */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Verification System</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setVerificationType('veriff')}
            className={`p-4 rounded-xl border-2 transition-all ${
              verificationType === 'veriff'
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            }`}
          >
            <p className="font-medium text-white mb-1">Veriff KYC</p>
            <p className="text-sm text-gray-400">For LP Individuals (Tier 2)</p>
          </button>

          <button
            onClick={() => setVerificationType('sumsub')}
            className={`p-4 rounded-xl border-2 transition-all ${
              verificationType === 'sumsub'
                ? 'border-cyan-500 bg-cyan-900/20'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            }`}
          >
            <p className="font-medium text-white mb-1">Sumsub KYB</p>
            <p className="text-sm text-gray-400">For LP Business (Tier 2)</p>
          </button>
        </div>
      </div>

      {/* Verification Lookup */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Check Verification Status</h3>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={lookupAddress}
            onChange={(e) => setLookupAddress(e.target.value)}
            placeholder="0x... address to lookup"
            className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
          />
          <button onClick={handleLookup} className="btn-primary flex items-center gap-2">
            <MagnifyingGlassIcon className="w-5 h-5" />
            Lookup
          </button>
        </div>

        {statusInfo && currentStatus && Array.isArray(currentStatus) && StatusIcon ? (
          <div className="p-4 bg-gray-800/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status</span>
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-5 h-5 text-${statusInfo.color}-400`} />
                <span className={`text-${statusInfo.color}-400 font-medium`}>{statusInfo.label}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Session ID</span>
              <span className="text-white font-mono text-sm">{currentStatus[1] || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Submitted At</span>
              <span className="text-white text-sm">
                {currentStatus[2] && Number(currentStatus[2]) > 0
                  ? new Date(Number(currentStatus[2]) * 1000).toLocaleString()
                  : 'Not submitted'}
              </span>
            </div>
            {currentStatus[3] ? (
              <div className="pt-3 border-t border-gray-700">
                <span className="text-gray-400 block mb-2">Rejection Reason</span>
                <span className="text-red-400 text-sm">{currentStatus[3]}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Submit Verification */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Submit Verification</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">User Address</label>
            <input
              type="text"
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              placeholder="0x..."
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              {verificationType === 'veriff' ? 'Veriff' : 'Sumsub'} Session ID
            </label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="session_id"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isPending || isConfirming}
            className="btn-secondary w-full"
          >
            Submit Verification
          </button>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Approve */}
        <div className="card p-6">
          <h4 className="font-semibold text-white mb-3">Approve & Mint NFT</h4>
          <p className="text-sm text-gray-400 mb-4">
            Approve verification and mint {verificationType === 'veriff' ? 'LP_Individuals' : 'LP_Business'} NFT
          </p>
          <button
            onClick={handleApprove}
            disabled={isPending || isConfirming}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <CheckCircleIcon className="w-5 h-5" />
            Approve
          </button>
        </div>

        {/* Reject */}
        <div className="card p-6">
          <h4 className="font-semibold text-white mb-3">Reject Verification</h4>
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection"
            className="w-full p-2 mb-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:border-red-500 focus:outline-none"
          />
          <button
            onClick={handleReject}
            disabled={isPending || isConfirming}
            className="btn-danger w-full flex items-center justify-center gap-2"
          >
            <XCircleIcon className="w-5 h-5" />
            Reject
          </button>
        </div>

        {/* Reset */}
        <div className="card p-6">
          <h4 className="font-semibold text-white mb-3">Reset Verification</h4>
          <p className="text-sm text-gray-400 mb-4">
            Reset rejected verification to allow resubmission
          </p>
          <button
            onClick={handleReset}
            disabled={isPending || isConfirming}
            className="btn-secondary w-full"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Transaction Status */}
      {writeError ? (
        <div className="card p-4 bg-red-900/20 border-red-700/50">
          <p className="text-red-400 text-sm">Error: {writeError.message}</p>
        </div>
      ) : null}

      {isSuccess && hash ? (
        <div className="card p-4 bg-emerald-900/20 border-emerald-700/50">
          <p className="text-emerald-400 text-sm">
            Transaction successful!{' '}
            <a
              href={`${getBlockExplorerUrl(chainId)}/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on Explorer
            </a>
          </p>
        </div>
      ) : null}
    </div>
  );
}
