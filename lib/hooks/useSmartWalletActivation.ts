'use client';

import { useSmartAccountClient, useSendUserOperation } from '@account-kit/react';
import { useQuery } from '@tanstack/react-query';

/**
 * Checks whether the user's LightAccount smart wallet has been deployed on-chain
 * and provides an `activate()` function to deploy it via a no-op user operation.
 *
 * Activation context:
 *  - Account Kit creates a "counterfactual" LightAccount address on sign-up.
 *  - The contract is not deployed until the first user operation is sent.
 *  - This hook lets us detect that state and let users activate proactively.
 */
export function useSmartWalletActivation() {
  const { client, isLoadingClient } = useSmartAccountClient({ type: 'LightAccount' });

  // Check on-chain bytecode — '0x' means not deployed yet (counterfactual)
  const {
    data: isActivated,
    isLoading: isCheckingStatus,
    refetch,
  } = useQuery({
    queryKey: ['smartWalletActivated', client?.account?.address],
    queryFn: async () => {
      const code = await client!.getCode({ address: client!.account.address });
      return !!code && code !== '0x';
    },
    enabled: !!client && !isLoadingClient,
    staleTime: 60_000,
  });

  const { sendUserOperation, isSendingUserOperation, error } = useSendUserOperation({
    client,
    waitForTxn: true,
    onSuccess: () => refetch(),
  });

  // Send a no-op user operation (self-transfer, 0 value) to trigger deployment
  const activate = () => {
    if (!client) return;
    sendUserOperation({
      uo: {
        target: client.account.address,
        value: 0n,
        data: '0x',
      },
    });
  };

  return {
    isActivated: isActivated ?? false,
    isCheckingStatus: isCheckingStatus || isLoadingClient,
    isActivating: isSendingUserOperation,
    activate,
    error: error ? (error as Error).message : null,
    smartWalletAddress: client?.account?.address,
  };
}
