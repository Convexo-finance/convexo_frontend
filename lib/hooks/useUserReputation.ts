import { useAccount, useContractRead, useChainId } from 'wagmi';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { ReputationManagerABI } from '@/lib/contracts/abis';

export function useUserReputation() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data: tier, isLoading, refetch } = useContractRead({
    address: address && contracts ? contracts.REPUTATION_MANAGER : undefined,
    abi: ReputationManagerABI,
    functionName: 'getReputationTier',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts,
    },
  });

  const tierValue = tier ?? undefined;

  return {
    tier: typeof tierValue === 'number' ? tierValue : undefined,
    hasCompliantAccess: typeof tierValue === 'number' && tierValue >= 1,
    hasCreditscoreAccess: typeof tierValue === 'number' && tierValue >= 2,
    isLoading,
    refetch,
  };
}
