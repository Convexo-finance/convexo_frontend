import { useAccount, useContractRead } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts/addresses';
import { ConvexoLPsABI, ConvexoVaultsABI } from '@/lib/contracts/abis';

export function useNFTBalance() {
  const { address } = useAccount();

  const { data: lpsBalance } = useContractRead({
    address: address ? CONTRACTS.BASE_SEPOLIA.CONVEXO_LPS : undefined,
    abi: ConvexoLPsABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: vaultsBalance } = useContractRead({
    address: address ? CONTRACTS.BASE_SEPOLIA.CONVEXO_VAULTS : undefined,
    abi: ConvexoVaultsABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const lps = lpsBalance ?? undefined;
  const vaults = vaultsBalance ?? undefined;

  return {
    hasLPsNFT: typeof lps === 'bigint' && lps > 0n,
    hasVaultsNFT: typeof vaults === 'bigint' && vaults > 0n,
    lpsBalance: typeof lps === 'bigint' ? lps : undefined,
    vaultsBalance: typeof vaults === 'bigint' ? vaults : undefined,
  };
}

