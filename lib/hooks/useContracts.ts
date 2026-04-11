import { useChainId } from '@/lib/wagmi/compat';
import { getContractsForChain, type ChainContracts } from '@/lib/contracts/addresses';

/** Returns the contract addresses for the current chain. */
export function useContracts(): ChainContracts | null {
  const chainId = useChainId();
  return getContractsForChain(chainId);
}
