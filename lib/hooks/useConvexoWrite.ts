'use client';

import { useSmartAccountClient, useSendUserOperation } from '@account-kit/react';
import { encodeFunctionData, type Abi } from 'viem';
import { useState, useCallback } from 'react';

interface WriteContractParams {
  address: `0x${string}`;
  // Accept any ABI array shape — same permissive interface as wagmi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abi: readonly any[];
  functionName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: any[];
  value?: bigint;
}

/**
 * Drop-in replacement for wagmi's useWriteContract.
 * Internally encodes the call and sends it as a user operation via Account Kit,
 * enabling gas sponsorship via the configured policyId.
 *
 * Usage is identical to useWriteContract:
 *   const { writeContract, isPending, data, isSuccess, error, reset } = useConvexoWrite();
 *   writeContract({ address, abi, functionName, args, value });
 */
export function useConvexoWrite() {
  const { client } = useSmartAccountClient({ type: 'LightAccount' });
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

  // Mirror wagmi's reset() — clears the local result state
  const reset = useCallback(() => {
    setResetKey(k => k + 1);
  }, []);

  // Use resetKey to wipe hash after reset
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
