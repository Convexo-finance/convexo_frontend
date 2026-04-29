'use client';

import { useCallback, useState } from 'react';
import { createSmartWalletClient, alchemyWalletTransport } from '@alchemy/wallet-apis';
import { usePrivySigner } from '@/lib/privy/usePrivySigner';
import { getPolicyId } from '@/lib/privy/config';
import { encodeFunctionData, parseUnits } from 'viem';
import { erc20Abi } from 'viem';
import { base, mainnet } from 'viem/chains';
import type { Chain } from 'viem';
import { TOKEN_ADDRESSES, TOKEN_METADATA, type TokenSymbol } from '@/lib/config/tokens';

export type SendStatus = 'idle' | 'pending' | 'success' | 'error';

export interface SendParams {
  token: TokenSymbol;
  chainId: number;
  to: `0x${string}`;
  amount: string;
}

const SEND_CHAINS: Record<number, Chain> = {
  [base.id]: base,
  [mainnet.id]: mainnet,
};

function getErc20Address(token: Exclude<TokenSymbol, 'ETH'>, chainId: number): `0x${string}` {
  return chainId === base.id
    ? TOKEN_ADDRESSES.base[token]
    : TOKEN_ADDRESSES.ethereum[token];
}

export function useSendToken() {
  const signer = usePrivySigner();
  const [status, setStatus] = useState<SendStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (params: SendParams) => {
    if (!signer) { setError('Wallet not ready'); return; }

    const targetChain = SEND_CHAINS[params.chainId];
    if (!targetChain) { setError('Unsupported network'); return; }

    const client = createSmartWalletClient({
      signer,
      transport: alchemyWalletTransport({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY! }),
      chain: targetChain,
      paymaster: { policyId: getPolicyId(params.chainId) },
    });

    setStatus('pending');
    setError(null);
    setTxHash(null);

    try {
      let call: { to: `0x${string}`; data: `0x${string}`; value: bigint };

      if (params.token === 'ETH') {
        call = { to: params.to, data: '0x', value: parseUnits(params.amount, 18) };
      } else {
        const addr = getErc20Address(params.token, params.chainId);
        const decimals = TOKEN_METADATA[params.token].decimals;
        call = {
          to: addr,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'transfer',
            args: [params.to, parseUnits(params.amount, decimals)],
          }),
          value: 0n,
        };
      }

      const { id } = await client.sendCalls({ calls: [call] });
      const result = await client.waitForCallsStatus({ id });
      setTxHash(result.receipts?.[0]?.transactionHash ?? null);
      setStatus('success');
    } catch (err) {
      const e = err as { shortMessage?: string; message?: string };
      setError(e.shortMessage ?? e.message ?? 'Send failed');
      setStatus('error');
    }
  }, [signer]);

  return {
    send,
    isPending: status === 'pending',
    isSuccess: status === 'success',
    txHash,
    error,
    reset: () => { setStatus('idle'); setTxHash(null); setError(null); },
  };
}
