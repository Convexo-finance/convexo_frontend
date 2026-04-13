'use client';

import { useSmartAccountClient, useSendUserOperation } from '@account-kit/react';
import { encodeFunctionData, type Abi } from 'viem';
import { useState, useCallback } from 'react';

interface WriteContractParams {
  address: `0x${string}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abi: readonly any[];
  functionName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: any[];
  value?: bigint;
}

/**
 * Drop-in replacement for wagmi's useWriteContract.
 * Sends a UserOperation via ERC-4337. Gas Manager sponsorship is applied
 * automatically via the policyId set in lib/alchemy/config.ts.
 *
 * Account type: MultiOwnerModularAccount (MAv2 / EIP-7702)
 *   - Signer EOA = Smart Wallet address (same address)
 *   - Supports gas sponsorship, batching, session keys
 */
export function useConvexoWrite() {
  const { client } = useSmartAccountClient({ type: 'MultiOwnerModularAccount' });
  const [resetKey, setResetKey] = useState(0);

  const {
    sendUserOperation,
    isSendingUserOperation,
    sendUserOperationResult,
    error,
  } = useSendUserOperation({
    client,
    waitForTxn: true,
  });

  const writeContract = useCallback((params: WriteContractParams) => {
    const calldata = encodeFunctionData({
      abi: params.abi as Abi,
      functionName: params.functionName,
      args: params.args ?? [],
    });

    sendUserOperation({
      uo: {
        target: params.address,
        data: calldata,
        value: params.value ?? 0n,
      },
    });
  }, [sendUserOperation]);

  const reset = useCallback(() => {
    setResetKey(k => k + 1);
  }, []);

  const hash = resetKey >= 0 ? sendUserOperationResult?.hash : undefined;

  return {
    writeContract,
    isPending: isSendingUserOperation,
    data: hash,
    isSuccess: !!hash,
    error,
    reset,
  };
}
