// Multi-chain contract addresses configuration - convexo.v3.16
// Auto-generated from addresses.json - DO NOT EDIT MANUALLY
// Run: node scripts/sync-addresses.js

export type ChainId = 84532 | 11155111 | 1301 | 8453 | 1 | 130;

export interface ChainContracts {
  CHAIN_ID: ChainId;
  CHAIN_NAME: string;
  CONVEXO_PASSPORT: `0x${string}`;
  LP_INDIVIDUALS: `0x${string}`;
  LP_BUSINESS: `0x${string}`;
  ECREDITSCORING: `0x${string}`;
  REPUTATION_MANAGER: `0x${string}`;
  VAULT_FACTORY: `0x${string}`;
  TREASURY_FACTORY: `0x${string}`;
  CONTRACT_SIGNER: `0x${string}`;
  VERIFF_VERIFIER: `0x${string}`;
  SUMSUB_VERIFIER: `0x${string}`;
  HOOK_DEPLOYER: `0x${string}`;
  PASSPORT_GATED_HOOK: `0x${string}`;
  POOL_REGISTRY: `0x${string}`;
  PRICE_FEED_MANAGER: `0x${string}`;
  USDC: `0x${string}`;
  ECOP: `0x${string}`;
  POOL_MANAGER: `0x${string}`;
  ZKPASSPORT_VERIFIER: `0x${string}`;
  ADMIN_ADDRESS: `0x${string}`;
}

export const CONTRACTS: Record<ChainId, ChainContracts> = {
  // Unichain Mainnet - Chain ID 130
  130: {
    CHAIN_ID: 130,
    CHAIN_NAME: 'Unichain Mainnet',
    // NFT Contracts - Tier System (convexo.v3.16)
    CONVEXO_PASSPORT: '0x2AD6aA7652C5167881b60C5bEa8713A0F0520cDD',
    LP_INDIVIDUALS: '0xF4aA32C029CfFa6050107E65FFF6e25AA2E58554',
    LP_BUSINESS: '0x147070275646d9Cab76Ae26e5Eb632f5A6e8024C',
    ECREDITSCORING: '0x20Be7F2D32Ddaa7c056CC6C39415275401cdF9E7',
    // Core Protocol
    VAULT_FACTORY: '0xd436D9966E646148e1A9c35ed1C8cF055BF386Ef',
    TREASURY_FACTORY: '0x6B4f7b99cfa1bD9d959c48A2bA50bB603780086d',
    REPUTATION_MANAGER: '0x64DA6680046F15909413bc93a822FEFB342F5861',
    CONTRACT_SIGNER: '0xF925230D5dE3b77A2f091089e4aABbdF41Cd8613',
    // Verification
    VERIFF_VERIFIER: '0xE118A7FdAeCaBc0FA828f9095A193B73BD6A1920',
    SUMSUB_VERIFIER: '0x7d651570E5291EB38E725462863d3dB9Bb5c4e4b',
    // Hooks & Pools
    PASSPORT_GATED_HOOK: '0xa38fC37c8dD3609c769A1f63DeCfBB3866E6983F',
    HOOK_DEPLOYER: '0x68beEA4F147711aFD06121A3ED7e77823c6cd338',
    POOL_REGISTRY: '0xd45cAfCECb1172b4E850Cd9Ad57479e1E77Cfa30',
    PRICE_FEED_MANAGER: '0xA114017d6F362B7fe74cd76F5A48282F343DF940',
    // Tokens
    USDC: '0x078D782b760474a361dDA0AF3839290b0EF57AD6',
    ECOP: '0x0000000000000000000000000000000000000000',
    // External
    POOL_MANAGER: '0x1F98400000000000000000000000000000000004',
    ZKPASSPORT_VERIFIER: '0x1D000001000EFD9a6371f4d90bB8920D5431c0D8',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },

  // Base Mainnet - Chain ID 8453
  8453: {
    CHAIN_ID: 8453,
    CHAIN_NAME: 'Base Mainnet',
    // NFT Contracts - Tier System (convexo.v3.16)
    CONVEXO_PASSPORT: '0x2AD6aA7652C5167881b60C5bEa8713A0F0520cDD',
    LP_INDIVIDUALS: '0xF4aA32C029CfFa6050107E65FFF6e25AA2E58554',
    LP_BUSINESS: '0x147070275646d9Cab76Ae26e5Eb632f5A6e8024C',
    ECREDITSCORING: '0x20Be7F2D32Ddaa7c056CC6C39415275401cdF9E7',
    // Core Protocol
    VAULT_FACTORY: '0xb57e0366B65B141d92D17f13b7f7076610bf6805',
    TREASURY_FACTORY: '0x521bf04AB091Feccd2d2883411b57aEEeb3B77C3',
    REPUTATION_MANAGER: '0x64DA6680046F15909413bc93a822FEFB342F5861',
    CONTRACT_SIGNER: '0xF925230D5dE3b77A2f091089e4aABbdF41Cd8613',
    // Verification
    VERIFF_VERIFIER: '0xE118A7FdAeCaBc0FA828f9095A193B73BD6A1920',
    SUMSUB_VERIFIER: '0x7d651570E5291EB38E725462863d3dB9Bb5c4e4b',
    // Hooks & Pools
    PASSPORT_GATED_HOOK: '0xCF4ddd96Eb9977FffBDfcaDFac424F9Ce6161bb4',
    HOOK_DEPLOYER: '0x68beEA4F147711aFD06121A3ED7e77823c6cd338',
    POOL_REGISTRY: '0xd45cAfCECb1172b4E850Cd9Ad57479e1E77Cfa30',
    PRICE_FEED_MANAGER: '0xA114017d6F362B7fe74cd76F5A48282F343DF940',
    // Tokens
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    ECOP: '0x0000000000000000000000000000000000000000',
    // External
    POOL_MANAGER: '0x7Da1D65F8B249183667cdE74C5CBD46dD38AA829',
    ZKPASSPORT_VERIFIER: '0x1D000001000EFD9a6371f4d90bB8920D5431c0D8',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },

  // Unichain Sepolia - Chain ID 1301
  1301: {
    CHAIN_ID: 1301,
    CHAIN_NAME: 'Unichain Sepolia',
    // NFT Contracts - Tier System (convexo.v3.16)
    CONVEXO_PASSPORT: '0x2AD6aA7652C5167881b60C5bEa8713A0F0520cDD',
    LP_INDIVIDUALS: '0xF4aA32C029CfFa6050107E65FFF6e25AA2E58554',
    LP_BUSINESS: '0x147070275646d9Cab76Ae26e5Eb632f5A6e8024C',
    ECREDITSCORING: '0x20Be7F2D32Ddaa7c056CC6C39415275401cdF9E7',
    // Core Protocol
    VAULT_FACTORY: '0x5d832F297C0ce5AF001FC0cF26d34D30EA5224f2',
    TREASURY_FACTORY: '0x3bCdD141c763f8b8b134B1624f748cF81Ae278E0',
    REPUTATION_MANAGER: '0x64DA6680046F15909413bc93a822FEFB342F5861',
    CONTRACT_SIGNER: '0xF925230D5dE3b77A2f091089e4aABbdF41Cd8613',
    // Verification
    VERIFF_VERIFIER: '0xE118A7FdAeCaBc0FA828f9095A193B73BD6A1920',
    SUMSUB_VERIFIER: '0x7d651570E5291EB38E725462863d3dB9Bb5c4e4b',
    // Hooks & Pools
    PASSPORT_GATED_HOOK: '0x42Bb5e9955FD6b8F56a3BD6cF42c22a4566ec222',
    HOOK_DEPLOYER: '0x68beEA4F147711aFD06121A3ED7e77823c6cd338',
    POOL_REGISTRY: '0xd45cAfCECb1172b4E850Cd9Ad57479e1E77Cfa30',
    PRICE_FEED_MANAGER: '0xA114017d6F362B7fe74cd76F5A48282F343DF940',
    // Tokens
    USDC: '0x31d0220469e10c4E71834a79b1f276d740d3768F',
    ECOP: '0xbb0d7c4141ee1fed53db766e1ffcb9c618df8260',
    // External
    POOL_MANAGER: '0x00B036B58a818B1BC34d502D3fE730Db729e62AC',
    ZKPASSPORT_VERIFIER: '0x1D000001000EFD9a6371f4d90bB8920D5431c0D8',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },

  // Base Sepolia - Chain ID 84532
  84532: {
    CHAIN_ID: 84532,
    CHAIN_NAME: 'Base Sepolia',
    // NFT Contracts - Tier System (convexo.v3.16)
    CONVEXO_PASSPORT: '0x2AD6aA7652C5167881b60C5bEa8713A0F0520cDD',
    LP_INDIVIDUALS: '0xF4aA32C029CfFa6050107E65FFF6e25AA2E58554',
    LP_BUSINESS: '0x147070275646d9Cab76Ae26e5Eb632f5A6e8024C',
    ECREDITSCORING: '0x20Be7F2D32Ddaa7c056CC6C39415275401cdF9E7',
    // Core Protocol
    VAULT_FACTORY: '0x9CA1Ab5C33C37cDA2c15e7756E235F7DAbF50E7d',
    TREASURY_FACTORY: '0x3ade68Ae89e2B84532b56BFecd6510FEB2F41640',
    REPUTATION_MANAGER: '0x64DA6680046F15909413bc93a822FEFB342F5861',
    CONTRACT_SIGNER: '0xF925230D5dE3b77A2f091089e4aABbdF41Cd8613',
    // Verification
    VERIFF_VERIFIER: '0xE118A7FdAeCaBc0FA828f9095A193B73BD6A1920',
    SUMSUB_VERIFIER: '0x7d651570E5291EB38E725462863d3dB9Bb5c4e4b',
    // Hooks & Pools
    PASSPORT_GATED_HOOK: '0x09E5Cdf93ED5C45e530459C015d07224b0A2026b',
    HOOK_DEPLOYER: '0x68beEA4F147711aFD06121A3ED7e77823c6cd338',
    POOL_REGISTRY: '0xd45cAfCECb1172b4E850Cd9Ad57479e1E77Cfa30',
    PRICE_FEED_MANAGER: '0xA114017d6F362B7fe74cd76F5A48282F343DF940',
    // Tokens
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    ECOP: '0xb934dcb57fb0673b7bc0fca590c5508f1cde955d',
    // External
    POOL_MANAGER: '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408',
    ZKPASSPORT_VERIFIER: '0x1D000001000EFD9a6371f4d90bB8920D5431c0D8',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },

  // Ethereum Sepolia - Chain ID 11155111
  11155111: {
    CHAIN_ID: 11155111,
    CHAIN_NAME: 'Ethereum Sepolia',
    // NFT Contracts - Tier System (convexo.v3.16)
    CONVEXO_PASSPORT: '0x2AD6aA7652C5167881b60C5bEa8713A0F0520cDD',
    LP_INDIVIDUALS: '0xF4aA32C029CfFa6050107E65FFF6e25AA2E58554',
    LP_BUSINESS: '0x147070275646d9Cab76Ae26e5Eb632f5A6e8024C',
    ECREDITSCORING: '0x20Be7F2D32Ddaa7c056CC6C39415275401cdF9E7',
    // Core Protocol
    VAULT_FACTORY: '0xA65Ad8A0c5B70dcE566E090daB963ceD2E2866c8',
    TREASURY_FACTORY: '0x7B45DD3Cdc9e0e43216fFEf3836722DDD2BA3A93',
    REPUTATION_MANAGER: '0x64DA6680046F15909413bc93a822FEFB342F5861',
    CONTRACT_SIGNER: '0xF925230D5dE3b77A2f091089e4aABbdF41Cd8613',
    // Verification
    VERIFF_VERIFIER: '0xE118A7FdAeCaBc0FA828f9095A193B73BD6A1920',
    SUMSUB_VERIFIER: '0x7d651570E5291EB38E725462863d3dB9Bb5c4e4b',
    // Hooks & Pools
    PASSPORT_GATED_HOOK: '0xD238a970Dc0Ea8f430cF8A7d51846E91a5418210',
    HOOK_DEPLOYER: '0x68beEA4F147711aFD06121A3ED7e77823c6cd338',
    POOL_REGISTRY: '0xd45cAfCECb1172b4E850Cd9Ad57479e1E77Cfa30',
    PRICE_FEED_MANAGER: '0xA114017d6F362B7fe74cd76F5A48282F343DF940',
    // Tokens
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    ECOP: '0x19ac2612e560b2bbedf88660a2566ef53c0a15a1',
    // External
    POOL_MANAGER: '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543',
    ZKPASSPORT_VERIFIER: '0x1D000001000EFD9a6371f4d90bB8920D5431c0D8',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },

  // Ethereum Mainnet - Chain ID 1 (Placeholder)
  1: {
    CHAIN_ID: 1,
    CHAIN_NAME: 'Ethereum Mainnet',
    CONVEXO_PASSPORT: '0x0000000000000000000000000000000000000000',
    LP_INDIVIDUALS: '0x0000000000000000000000000000000000000000',
    LP_BUSINESS: '0x0000000000000000000000000000000000000000',
    ECREDITSCORING: '0x0000000000000000000000000000000000000000',
    VAULT_FACTORY: '0x0000000000000000000000000000000000000000',
    TREASURY_FACTORY: '0x0000000000000000000000000000000000000000',
    REPUTATION_MANAGER: '0x0000000000000000000000000000000000000000',
    CONTRACT_SIGNER: '0x0000000000000000000000000000000000000000',
    VERIFF_VERIFIER: '0x0000000000000000000000000000000000000000',
    SUMSUB_VERIFIER: '0x0000000000000000000000000000000000000000',
    PASSPORT_GATED_HOOK: '0x0000000000000000000000000000000000000000',
    HOOK_DEPLOYER: '0x0000000000000000000000000000000000000000',
    POOL_REGISTRY: '0x0000000000000000000000000000000000000000',
    PRICE_FEED_MANAGER: '0x0000000000000000000000000000000000000000',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    ECOP: '0x0000000000000000000000000000000000000000',
    POOL_MANAGER: '0x000000000004444c5dc75cB358380D2e3dE08A90',
    ZKPASSPORT_VERIFIER: '0x1D000001000EFD9a6371f4d90bB8920D5431c0D8',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },
};

// Helper functions
export function getContractsForChain(chainId: number): ChainContracts | null {
  return chainId in CONTRACTS ? CONTRACTS[chainId as ChainId] : null;
}

export function isSupportedChain(chainId: number): chainId is ChainId {
  return chainId in CONTRACTS;
}

export function getChainName(chainId: number): string {
  return getContractsForChain(chainId)?.CHAIN_NAME ?? 'Unknown Chain';
}

export const BLOCK_EXPLORERS: Record<ChainId, string> = {
  130: 'https://unichain.blockscout.com',
  8453: 'https://basescan.org',
  1301: 'https://unichain-sepolia.blockscout.com',
  84532: 'https://sepolia.basescan.org',
  11155111: 'https://sepolia.etherscan.io',
  1: 'https://etherscan.io',
};

export function getBlockExplorerUrl(chainId: number): string {
  return BLOCK_EXPLORERS[chainId as ChainId] ?? '';
}

export function getAddressExplorerLink(chainId: number, address: string): string {
  const baseUrl = getBlockExplorerUrl(chainId);
  return baseUrl ? `${baseUrl}/address/${address}` : '';
}

export function getTxExplorerLink(chainId: number, txHash: string): string {
  const baseUrl = getBlockExplorerUrl(chainId);
  return baseUrl ? `${baseUrl}/tx/${txHash}` : '';
}

// Standard ERC20 ABI for token interactions
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
] as const;

// IPFS config - Hashes and full URIs for NFT metadata
export const IPFS = {
  // Hashes
  CONVEXO_PASSPORT_HASH: 'bafybeiekwlyujx32cr5u3ixt5esfxhusalt5ljtrmsng74q7k45tilugh4',
  LP_INDIVIDUALS_HASH: 'bafkreib7mkjzpdm3id6st6d5vsxpn7v5h6sxeiswejjmrbcb5yoagaf4em',
  LP_BUSINESS_HASH: 'bafkreiejesvgsvohwvv7q5twszrbu5z6dnpke6sg5cdiwgn2rq7dilu33m',
  ECREDITSCORING_HASH: 'bafkreignxas6gqi7it5ng6muoykujxlgxxc4g7rr6sqvwgdfwveqf2zw3e',
  // Full IPFS URIs
  CONVEXO_PASSPORT_URI: 'ipfs://bafybeiekwlyujx32cr5u3ixt5esfxhusalt5ljtrmsng74q7k45tilugh4',
  LP_INDIVIDUALS_URI: 'ipfs://bafkreib7mkjzpdm3id6st6d5vsxpn7v5h6sxeiswejjmrbcb5yoagaf4em',
  LP_BUSINESS_URI: 'ipfs://bafkreiejesvgsvohwvv7q5twszrbu5z6dnpke6sg5cdiwgn2rq7dilu33m',
  ECREDITSCORING_URI: 'ipfs://bafkreignxas6gqi7it5ng6muoykujxlgxxc4g7rr6sqvwgdfwveqf2zw3e',
} as const;

export function getIPFSUrl(hash: string): string {
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'lime-famous-condor-7.mypinata.cloud';
  return `https://${gateway}/ipfs/${hash}`;
}

export const SUPPORTED_CHAIN_IDS: ChainId[] = [130, 8453, 1301, 84532, 11155111, 1];
export const TESTNET_CHAIN_IDS: ChainId[] = [1301, 84532, 11155111];
export const MAINNET_CHAIN_IDS: ChainId[] = [130, 8453, 1];
