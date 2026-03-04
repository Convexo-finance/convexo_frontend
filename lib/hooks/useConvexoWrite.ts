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
 * Internally encodes the call and sends it as a UserOperation via the ERC-4337
 * path. Gas Manager sponsorship is applied automatically via the policyId set
 * in lib/alchemy/config.ts (createConfig chains[].policyId).
 *
 * Account type: MultiOwnerModularAccount (MAv2 / EIP-7702)
 *   - Signer EOA = Smart Wallet address (same address)
 *   - Supports gas sponsorship, batching, session keys
 *
 * Usage is identical to useWriteContract:
 *   const { writeContract, isPending, data, isSuccess, error, reset } = useConvexoWrite();
 *   writeContract({ address, abi, functionName, args, value });
 */
export function useConvexoWrite() {
  // MAv2 = Modular Account V2 with EIP-7702 support
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

    // ERC-4337 path — Gas Manager paymaster applied automatically via policyId
    // configured in lib/alchemy/config.ts createConfig chains[].policyId.
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
