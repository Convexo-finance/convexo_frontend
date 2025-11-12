import { useAccount, useContractRead } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts/addresses';
import { ReputationManagerABI } from '@/lib/contracts/abis';

export function useUserReputation() {
  const { address } = useAccount();

  const { data: tier, isLoading, refetch } = useContractRead({
    address: address ? CONTRACTS.BASE_SEPOLIA.REPUTATION_MANAGER : undefined,
    abi: ReputationManagerABI,
    functionName: 'getReputationTier',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
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

