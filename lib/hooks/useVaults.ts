import { useContractRead, useChainId } from 'wagmi';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { VaultFactoryABI } from '@/lib/contracts/abis';

export function useVaultCount() {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data: count, isLoading } = useContractRead({
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
  };
}

export function useVaultAddress(index: number) {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data: vaultAddress, isLoading } = useContractRead({
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
  };
}
