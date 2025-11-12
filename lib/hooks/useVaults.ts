import { useContractRead } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts/addresses';
import { VaultFactoryABI } from '@/lib/contracts/abis';
import { useMemo } from 'react';

export function useVaultCount() {
  const { data: count, isLoading } = useContractRead({
    address: CONTRACTS.BASE_SEPOLIA.VAULT_FACTORY,
    abi: VaultFactoryABI,
    functionName: 'getVaultCount',
  });

  return {
    count: count ? Number(count) : 0,
    isLoading,
  };
}

export function useVaultAddress(index: number) {
  const { data: vaultAddress, isLoading } = useContractRead({
    address: index >= 0 ? CONTRACTS.BASE_SEPOLIA.VAULT_FACTORY : undefined,
    abi: VaultFactoryABI,
    functionName: 'getVault',
    args: [BigInt(index)],
    query: {
      enabled: index >= 0,
    },
  });

  return {
    vaultAddress: vaultAddress as `0x${string}` | undefined,
    isLoading,
  };
}

