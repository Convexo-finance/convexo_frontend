// Re-export everything from wagmi so existing imports keep working
export * from 'wagmi';

// Override useAccount with our bridge that maps Account Kit state to wagmi-compatible shape
export { useAccount } from '@/lib/hooks/useWalletAccount';

// Override useChainId to always return the PRIMARY_CHAIN_ID derived from
// NEXT_PUBLIC_NETWORK_MODE. The app-level wagmi config has no active wallet
// connection (all connections go through Account Kit), so wagmi's default
// useChainId() would return the first chain in the config — which is correct,
// but we make it explicit here so every hook reads the same chain.
//
// Rule: ALL protocol contract calls (NFT mint, vault, reputation) target Base
// mainnet (8453) in production or Base Sepolia (84532) in dev/testnet.
// The wallet page reads balances on ALL chains separately via explicit chainId params.
import { PRIMARY_CHAIN_ID } from '@/lib/config/network';
export function useChainId(): number {
  return PRIMARY_CHAIN_ID;
}
