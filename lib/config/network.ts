// Network mode — controlled by NEXT_PUBLIC_NETWORK_MODE env var (build-time)
// 'mainnet' → Base Mainnet (8453) as primary chain
// 'testnet' → Ethereum Sepolia (11155111) as primary chain
//
// WHY ETH SEPOLIA (not Base Sepolia):
// The ZKPassport verifier (0x1D000001000EFD9a6371f4d90bB8920D5431c0D8) is deployed on
// ETH Mainnet, ETH Sepolia, and Base Mainnet — but NOT on Base Sepolia.
// claimPassport() calls ZKPASSPORT_VERIFIER.verify() on-chain, so it requires the verifier.
// All Convexo contracts + Uniswap V4 infrastructure are deployed on ETH Sepolia.
// The pool must be initialized on ETH Sepolia (run InitializePool.s.sol + AddLiquidity.s.sol).
//
// Default: 'testnet' (safe default for local development)

export type NetworkMode = 'mainnet' | 'testnet';

export const NETWORK_MODE: NetworkMode =
  (process.env.NEXT_PUBLIC_NETWORK_MODE as NetworkMode) === 'mainnet' ? 'mainnet' : 'testnet';

export const IS_MAINNET = NETWORK_MODE === 'mainnet';
export const IS_TESTNET = NETWORK_MODE === 'testnet';

// Primary chain for all protocol operations (passport, vaults, reputation sync)
export const PRIMARY_CHAIN_ID = IS_MAINNET ? 8453 : 11155111;

// All active chains for this mode (for wallet balance reads etc.)
export const ACTIVE_CHAIN_IDS = IS_MAINNET
  ? [8453, 130, 42161, 1]            // Base, Unichain, Arbitrum, Ethereum
  : [84532, 11155111, 1301, 421614]; // Base Sep, Eth Sep, Uni Sep, Arb Sep
