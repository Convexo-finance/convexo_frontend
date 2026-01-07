/**
 * Vault Hooks - Legacy exports for backwards compatibility
 * For new code, use useVaultFactory and useTokenizedBondVault from index.ts
 */

import { useChainId, useReadContract } from 'wagmi';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { VaultFactoryABI } from '@/lib/contracts/abis';

export function useVaultCount() {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data: count, isLoading, refetch, error } = useReadContract({
    address: contracts?.VAULT_FACTORY,
    abi: VaultFactoryABI,
    functionName: 'getVaultCount',
    query: {
      enabled: !!contracts,
    },
  });

  return {
    count: count ? Number(count) : 0,
    isLoading,
    refetch,
    error,
  };
}

export function useVaultAddress(index: number) {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data: vaultAddress, isLoading, refetch, error } = useReadContract({
    address: index >= 0 && contracts ? contracts.VAULT_FACTORY : undefined,
    abi: VaultFactoryABI,
    functionName: 'getVault',
    args: [BigInt(index)],
    query: {
      enabled: index >= 0 && !!contracts,
    },
  });

  return {
    vaultAddress: vaultAddress as `0x${string}` | undefined,
    isLoading,
    refetch,
    error,
  };
}

/**
 * Get all vault addresses
 */
export function useAllVaultAddresses() {
  const { count } = useVaultCount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  // Create array of indices
  const indices = Array.from({ length: count }, (_, i) => i);

  // This is a simplified version - in production you'd want to batch these calls
  return {
    count,
    indices,
    contractAddress: contracts?.VAULT_FACTORY,
  };
}
