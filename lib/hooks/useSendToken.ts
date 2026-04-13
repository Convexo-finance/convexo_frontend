'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  useSignerStatus,
  useSmartAccountClient,
  useSendUserOperation,
  useChain,
} from '@account-kit/react';
import { encodeFunctionData, parseUnits } from 'viem';
import { erc20Abi } from 'viem';
import { base, mainnet } from 'wagmi/chains';
import { TOKEN_ADDRESSES, TOKEN_METADATA, type TokenSymbol } from '@/lib/config/tokens';

export type SendStatus = 'idle' | 'pending' | 'success' | 'error';

export interface SendParams {
  token: TokenSymbol;
  chainId: number;
  to: `0x${string}`;
  amount: string; // human-readable decimal string
}

const SEND_CHAINS: Record<number, typeof base | typeof mainnet> = {
  [base.id]: base,
  [mainnet.id]: mainnet,
};

function getErc20Address(token: Exclude<TokenSymbol, 'ETH'>, chainId: number): `0x${string}` {
  return chainId === base.id
    ? TOKEN_ADDRESSES.base[token]
    : TOKEN_ADDRESSES.ethereum[token];
}

/**
 * Unified token-send hook for embedded smart accounts (email / passkey / OAuth).
 * Sends via useSendUserOperation using MultiOwnerModularAccount (MAv2 / EIP-7702).
 * Handles chain switching via useChain() before firing the UserOperation.
 */
export function useSendToken() {
  const { client } = useSmartAccountClient({ type: 'MultiOwnerModularAccount' });
  const {
    sendUserOperation,
    isSendingUserOperation,
    sendUserOperationResult,
    error: uoError,
  } = useSendUserOperation({ client, waitForTxn: true });

  const { isConnected: isSignerConnected } = useSignerStatus();
  const { chain, setChain } = useChain();
  const pendingRef = useRef<SendParams | null>(null);

  const executeUO = useCallback(
    (params: SendParams) => {
      const { token, chainId, to, amount } = params;
      if (token === 'ETH') {
        sendUserOperation({ uo: { target: to, data: '0x', value: parseUnits(amount, 18) } });
      } else {
        const addr = getErc20Address(token, chainId);
        const decimals = TOKEN_METADATA[token].decimals;
        sendUserOperation({
          uo: {
            target: addr,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'transfer',
              args: [to, parseUnits(amount, decimals)],
            }),
            value: 0n,
          },
        });
      }
    },
    [sendUserOperation],
  );

  // When the active chain changes to match a pending send, fire it
  useEffect(() => {
    const pending = pendingRef.current;
    if (pending && chain.id === pending.chainId) {
      pendingRef.current = null;
      executeUO(pending);
    }
  }, [chain.id, executeUO]);

  const send = useCallback(
    (params: SendParams) => {
      if (!isSignerConnected) return;

      if (chain.id !== params.chainId) {
        const targetChain = SEND_CHAINS[params.chainId];
        if (!targetChain) return;
        pendingRef.current = params;
        setChain({ chain: targetChain });
      } else {
        executeUO(params);
      }
    },
    [isSignerConnected, chain.id, setChain, executeUO],
  );

  const reset = useCallback(() => {
    pendingRef.current = null;
  }, []);

  return {
    send,
    isPending: isSendingUserOperation,
    isSuccess: !!sendUserOperationResult?.hash,
    txHash: sendUserOperationResult?.hash ?? null,
    error: uoError?.message ?? null,
    reset,
  };
}
