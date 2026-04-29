'use client';

import { useState, useCallback } from 'react';
import { createSmartWalletClient, alchemyWalletTransport } from '@alchemy/wallet-apis';
import { encodeFunctionData, type Abi } from 'viem';
import { usePrivySigner } from '@/lib/privy/usePrivySigner';
import { getViemChain, getPolicyId } from '@/lib/privy/config';
import { PRIMARY_CHAIN_ID } from '@/lib/config/network';

interface WriteContractParams {
  address: `0x${string}`;
  abi: readonly unknown[];
  functionName: string;
  args?: unknown[];
  value?: bigint;
}

export function useConvexoWrite() {
  const signer = usePrivySigner();
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const writeContract = useCallback(async (params: WriteContractParams) => {
    if (!signer) return;

    const chain = getViemChain(PRIMARY_CHAIN_ID);
    const client = createSmartWalletClient({
      signer,
      transport: alchemyWalletTransport({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY! }),
      chain,
      paymaster: { policyId: getPolicyId(PRIMARY_CHAIN_ID) },
    });

    setIsPending(true);
    setError(null);
    setTxHash(undefined);

    try {
      const data = encodeFunctionData({
        abi: params.abi as Abi,
        functionName: params.functionName,
        args: params.args ?? [],
      });

      const { id } = await client.sendCalls({
        calls: [{ to: params.address, data, value: params.value ?? 0n }],
      });
      const result = await client.waitForCallsStatus({ id });
      setTxHash(result.receipts?.[0]?.transactionHash);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsPending(false);
    }
  }, [signer]);

  return {
    writeContract,
    isPending,
    data: txHash,
    isSuccess: !!txHash,
    error,
    reset: () => { setTxHash(undefined); setError(null); },
  };
}
