'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useSignerStatus,
  useSmartAccountClient,
  useSendUserOperation,
  useAlchemyAccountContext,
  useChain,
} from '@account-kit/react';
import { useAccount as wagmi_useAccount } from 'wagmi';
import { writeContract, sendTransaction } from '@wagmi/core';
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
 * Unified token-send hook.
 *
 * Smart account (email / passkey / OAuth):
 *   Sends via useSendUserOperation. Handles chain switching via useChain()
 *   before firing the UO — when the chain changes the pending params are
 *   consumed in a useEffect.
 *
 * EOA wallet (MetaMask / WalletConnect / Coinbase):
 *   Uses @wagmi/core writeContract / sendTransaction with Account Kit's
 *   internal wagmi config (the EOA connects there, not the parent WagmiProvider).
 */
export function useSendToken() {
  // ── Smart account ────────────────────────────────────────────────────────
  const { client } = useSmartAccountClient({ type: 'LightAccount' });
  const {
    sendUserOperation,
    isSendingUserOperation,
    sendUserOperationResult,
    error: uoError,
  } = useSendUserOperation({ client, waitForTxn: true });

  const { isConnected: isSignerConnected } = useSignerStatus();
  const { chain, setChain } = useChain();
  const pendingRef = useRef<SendParams | null>(null);

  // ── EOA wallet ───────────────────────────────────────────────────────────
  const { config: alchemyConfig } = useAlchemyAccountContext();
  const internalConfig = alchemyConfig._internal.wagmiConfig;
  const { isConnected: isEoaConnected } = wagmi_useAccount({ config: internalConfig });

  // Manual state for EOA path (UO path uses hook-managed state above)
  const [eoaPending, setEoaPending] = useState(false);
  const [eoaHash, setEoaHash] = useState<string | null>(null);
  const [eoaError, setEoaError] = useState<string | null>(null);

  // ── Build & fire a user operation ────────────────────────────────────────
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

  // ── Main send entry point ─────────────────────────────────────────────────
  const send = useCallback(
    async (params: SendParams) => {
      setEoaHash(null);
      setEoaError(null);

      if (isSignerConnected) {
        // Smart account path
        if (chain.id !== params.chainId) {
          const targetChain = SEND_CHAINS[params.chainId];
          if (!targetChain) return;
          pendingRef.current = params;
          setChain({ chain: targetChain });
        } else {
          executeUO(params);
        }
      } else if (isEoaConnected) {
        // EOA path via Account Kit's internal wagmi config
        setEoaPending(true);
        try {
          const { token, chainId, to, amount } = params;
          let hash: string;
          if (token === 'ETH') {
            hash = await sendTransaction(internalConfig, {
              to,
              value: parseUnits(amount, 18),
              chainId,
            });
          } else {
            const addr = getErc20Address(token, chainId);
            const decimals = TOKEN_METADATA[token].decimals;
            hash = await writeContract(internalConfig, {
              address: addr,
              abi: erc20Abi,
              functionName: 'transfer',
              args: [to, parseUnits(amount, decimals)],
              chainId,
            });
          }
          setEoaHash(hash);
        } catch (err) {
          setEoaError(err instanceof Error ? err.message : 'Transaction failed');
        } finally {
          setEoaPending(false);
        }
      }
    },
    [isSignerConnected, isEoaConnected, chain.id, setChain, executeUO, internalConfig],
  );

  const reset = useCallback(() => {
    setEoaHash(null);
    setEoaError(null);
    pendingRef.current = null;
  }, []);

  return {
    send,
    isPending: isSendingUserOperation || eoaPending,
    isSuccess: !!sendUserOperationResult?.hash || !!eoaHash,
    txHash: sendUserOperationResult?.hash ?? eoaHash,
    error: uoError?.message ?? eoaError,
    reset,
  };
}
