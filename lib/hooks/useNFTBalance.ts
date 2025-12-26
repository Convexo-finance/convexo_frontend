import { useAccount, useContractRead, useChainId } from 'wagmi';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { ConvexoLPsABI, ConvexoVaultsABI, ConvexoPassportABI } from '@/lib/contracts/abis';

export function useNFTBalance() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data: lpsBalance } = useContractRead({
    address: address && contracts ? contracts.CONVEXO_LPS : undefined,
    abi: ConvexoLPsABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts,
    },
  });

  const { data: vaultsBalance } = useContractRead({
    address: address && contracts ? contracts.CONVEXO_VAULTS : undefined,
    abi: ConvexoVaultsABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts,
    },
  });

  const { data: passportBalance } = useContractRead({
    address: address && contracts ? contracts.CONVEXO_PASSPORT : undefined,
    abi: ConvexoPassportABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts,
    },
  });

  const { data: hasActivePassport } = useContractRead({
    address: address && contracts ? contracts.CONVEXO_PASSPORT : undefined,
    abi: ConvexoPassportABI,
    functionName: 'holdsActivePassport',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts,
    },
  });

  const lps = lpsBalance ?? undefined;
  const vaults = vaultsBalance ?? undefined;
  const passport = passportBalance ?? undefined;

  return {
    hasLPsNFT: typeof lps === 'bigint' && lps > 0n,
    hasVaultsNFT: typeof vaults === 'bigint' && vaults > 0n,
    hasPassportNFT: typeof passport === 'bigint' && passport > 0n,
    hasActivePassport: hasActivePassport === true,
    lpsBalance: typeof lps === 'bigint' ? lps : undefined,
    vaultsBalance: typeof vaults === 'bigint' ? vaults : undefined,
    passportBalance: typeof passport === 'bigint' ? passport : undefined,
  };
}
