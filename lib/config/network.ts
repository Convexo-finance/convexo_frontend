// Network mode — controlled by NEXT_PUBLIC_NETWORK_MODE env var (build-time)
// 'mainnet' → Base Mainnet (8453) as primary chain
// 'testnet' → Base Sepolia (84532) as primary chain
// Default: 'testnet' (safe default for local development)

export type NetworkMode = 'mainnet' | 'testnet';

export const NETWORK_MODE: NetworkMode =
  (process.env.NEXT_PUBLIC_NETWORK_MODE as NetworkMode) === 'mainnet' ? 'mainnet' : 'testnet';

export const IS_MAINNET = NETWORK_MODE === 'mainnet';
export const IS_TESTNET = NETWORK_MODE === 'testnet';

// Primary chain for all protocol operations (passport, vaults, reputation sync)
export const PRIMARY_CHAIN_ID = IS_MAINNET ? 8453 : 84532;

// All active chains for this mode (for wallet balance reads etc.)
export const ACTIVE_CHAIN_IDS = IS_MAINNET
  ? [8453, 130, 42161, 1]            // Base, Unichain, Arbitrum, Ethereum
  : [84532, 11155111, 1301, 421614]; // Base Sep, Eth Sep, Uni Sep, Arb Sep
