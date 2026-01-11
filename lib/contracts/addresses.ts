// Multi-chain contract addresses configuration - Version 3.0
// Supports: Base Sepolia, Ethereum Sepolia, Unichain Sepolia, Base Mainnet, Ethereum Mainnet, Unichain Mainnet
// Auto-synced with addresses.json deployments

export type ChainId = 84532 | 11155111 | 1301 | 8453 | 1 | 130;

export interface ChainContracts {
  CHAIN_ID: ChainId;
  CHAIN_NAME: string;
  // NFT Contracts - Tier System
  CONVEXO_PASSPORT: `0x${string}`;      // Tier 1 - ZKPassport verified individuals
  LP_INDIVIDUALS: `0x${string}`;         // Tier 2 - Veriff verified individuals
  LP_BUSINESS: `0x${string}`;            // Tier 2 - Sumsub verified businesses
  ECREDITSCORING: `0x${string}`;         // Tier 3 - AI Credit Scored vault creators
  // Core Protocol
  REPUTATION_MANAGER: `0x${string}`;
  VAULT_FACTORY: `0x${string}`;
  TREASURY_FACTORY: `0x${string}`;
  CONTRACT_SIGNER: `0x${string}`;
  // Verification
  VERIFF_VERIFIER: `0x${string}`;
  SUMSUB_VERIFIER: `0x${string}`;
  // Hooks & Pools
  HOOK_DEPLOYER: `0x${string}`;
  PASSPORT_GATED_HOOK: `0x${string}`;
  POOL_REGISTRY: `0x${string}`;
  PRICE_FEED_MANAGER: `0x${string}`;
  // Tokens
  USDC: `0x${string}`;
  ECOP: `0x${string}`;
  // External
  POOL_MANAGER: `0x${string}`;
  ZKPASSPORT_VERIFIER: `0x${string}`;
  ADMIN_ADDRESS: `0x${string}`;
}

export const CONTRACTS: Record<ChainId, ChainContracts> = {
  // Ethereum Sepolia - Chain ID 11155111
  11155111: {
    CHAIN_ID: 11155111,
    CHAIN_NAME: 'Ethereum Sepolia',
    // NFT Contracts - Tier System (v3.15)
    CONVEXO_PASSPORT: '0x248365C816b6F89cD0cb0AE09872ee46E9Ffff2D',
    LP_INDIVIDUALS: '0x60123D089a8a3Dc4578eC7C7f87276B1E132c278',
    LP_BUSINESS: '0x7203Aa9Bd8c68db0Ebf2E5f49E2EC2d53Daef25f',
    ECREDITSCORING: '0xd91bfc46A53d54554515Ecc0B72fE107bC0120e9',
    
    // Core Protocol
    VAULT_FACTORY: '0x0227852888f83CD702dcCCFDCc1bB2495C8516AE',
    TREASURY_FACTORY: '0x8613D8f4d7be435017589ae90c1506628B28FDF5',
    REPUTATION_MANAGER: '0x3D867565f94E8E838afe652E176b63F432b3d19d',
    CONTRACT_SIGNER: '0x49d5BB72fA5AAbC29c2d32b2CDF74b1b22e0f140',
    
    // Verification
    VERIFF_VERIFIER: '0x78A5ced1325e9afEa07532Edd06f0eCa5c298E24',
    SUMSUB_VERIFIER: '0x2c626CAF9b86D560b2Cb7Be9CAF3249C9B98223b',
    
    // Hooks & Pools
    PASSPORT_GATED_HOOK: '0xBfF88285b70E4d58AB82Bb6cE8dEbf7A7f70D15c',
    HOOK_DEPLOYER: '0xA23270a73787b46deb12E1560B1886b47105e924',
    POOL_REGISTRY: '0x0211E9720AC9E35105852414333a7a095F1E1B5f',
    PRICE_FEED_MANAGER: '0x9715f1c997E1F6916a07866B1d722a8D90A4Cb8F',
    
    // Tokens
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    ECOP: '0x19ac2612e560b2bbedf88660a2566ef53c0a15a1',
    
    // External
    POOL_MANAGER: '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543',
    ZKPASSPORT_VERIFIER: '0x1D000001000EFD9a6371f4d90bB8920D5431c0D8',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },
  
  // Base Sepolia - Chain ID 84532
  84532: {
    CHAIN_ID: 84532,
    CHAIN_NAME: 'Base Sepolia',
    // NFT Contracts - Tier System (v3.1)
    CONVEXO_PASSPORT: '0x248365C816b6F89cD0cb0AE09872ee46E9Ffff2D',
    LP_INDIVIDUALS: '0x60123D089a8a3Dc4578eC7C7f87276B1E132c278',
    LP_BUSINESS: '0x7203Aa9Bd8c68db0Ebf2E5f49E2EC2d53Daef25f',
    ECREDITSCORING: '0xd91bfc46A53d54554515Ecc0B72fE107bC0120e9',
    // Core Protocol
    VAULT_FACTORY: '0x7dE9fCFD85Df6dDeE996c07d517D7c7108C776EF',
    TREASURY_FACTORY: '0x8613D8f4d7be435017589ae90c1506628B28FDF5',
    REPUTATION_MANAGER: '0x3D867565f94E8E838afe652E176b63F432b3d19d',
    CONTRACT_SIGNER: '0x49d5BB72fA5AAbC29c2d32b2CDF74b1b22e0f140',
    // Verification
    VERIFF_VERIFIER: '0x78A5ced1325e9afEa07532Edd06f0eCa5c298E24',
    SUMSUB_VERIFIER: '0x2c626CAF9b86D560b2Cb7Be9CAF3249C9B98223b',
    // Hooks & Pools
    PASSPORT_GATED_HOOK: '0xCD6c5A2BEd517972BC8B80F21B597Fbe17D8eA69',
    HOOK_DEPLOYER: '0xA23270a73787b46deb12E1560B1886b47105e924',
    POOL_REGISTRY: '0x0211E9720AC9E35105852414333a7a095F1E1B5f',
    PRICE_FEED_MANAGER: '0x9715f1c997E1F6916a07866B1d722a8D90A4Cb8F',
    // Tokens
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    ECOP: '0xb934dcb57fb0673b7bc0fca590c5508f1cde955d',
    // External
    POOL_MANAGER: '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408',
    ZKPASSPORT_VERIFIER: '0x1D000001000EFD9a6371f4d90bB8920D5431c0D8',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },
  
  
  // Unichain Sepolia - Chain ID 1301
  1301: {
    CHAIN_ID: 1301,
    CHAIN_NAME: 'Unichain Sepolia',
    // NFT Contracts - Tier System (v3.1)
    CONVEXO_PASSPORT: '0x248365C816b6F89cD0cb0AE09872ee46E9Ffff2D',
    LP_INDIVIDUALS: '0x60123D089a8a3Dc4578eC7C7f87276B1E132c278',
    LP_BUSINESS: '0x7203Aa9Bd8c68db0Ebf2E5f49E2EC2d53Daef25f',
    ECREDITSCORING: '0xd91bfc46A53d54554515Ecc0B72fE107bC0120e9',
    // Core Protocol
    VAULT_FACTORY: '0x6d29c04416Eb076E5ebF6aB610EFaA3893621430',
    TREASURY_FACTORY: '0x04B19Ab39B4fBEB2218f9B4e5D9a13E10Dc33B9d',
    REPUTATION_MANAGER: '0x3D867565f94E8E838afe652E176b63F432b3d19d',
    CONTRACT_SIGNER: '0x49d5BB72fA5AAbC29c2d32b2CDF74b1b22e0f140',
    // Verification
    VERIFF_VERIFIER: '0x78A5ced1325e9afEa07532Edd06f0eCa5c298E24',
    SUMSUB_VERIFIER: '0x2c626CAF9b86D560b2Cb7Be9CAF3249C9B98223b',
    // Hooks & Pools
    PASSPORT_GATED_HOOK: '0xDc9bB6A282b122C2912AE36Ebe379406eCCC7F2c',
    HOOK_DEPLOYER: '0xA23270a73787b46deb12E1560B1886b47105e924',
    POOL_REGISTRY: '0x0211E9720AC9E35105852414333a7a095F1E1B5f',
    PRICE_FEED_MANAGER: '0x9715f1c997E1F6916a07866B1d722a8D90A4Cb8F',
    // Tokens
    USDC: '0x31d0220469e10c4E71834a79b1f276d740d3768F',
    ECOP: '0xbb0d7c4141ee1fed53db766e1ffcb9c618df8260',
    // External
    POOL_MANAGER: '0x00B036B58a818B1BC34d502D3fE730Db729e62AC',
    ZKPASSPORT_VERIFIER: '0x1D000001000EFD9a6371f4d90bB8920D5431c0D8',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },
  // Base Mainnet - Chain ID 8453
  8453: {
    CHAIN_ID: 8453,
    CHAIN_NAME: 'Base Mainnet',
    // NFT Contracts - Tier System (v3.15)
    CONVEXO_PASSPORT: '0x248365C816b6F89cD0cb0AE09872ee46E9Ffff2D',
    LP_INDIVIDUALS: '0x60123D089a8a3Dc4578eC7C7f87276B1E132c278',
    LP_BUSINESS: '0x7203Aa9Bd8c68db0Ebf2E5f49E2EC2d53Daef25f',
    ECREDITSCORING: '0xd91bfc46A53d54554515Ecc0B72fE107bC0120e9',
    // Core Protocol
    VAULT_FACTORY: '0xEe79CA9ECA5d363f47b7243CF76069054c04401B',
    TREASURY_FACTORY: '0xE5Bb532C995852aeb5b9D0bAAe6d8Ad3Db747cF7',
    REPUTATION_MANAGER: '0x3D867565f94E8E838afe652E176b63F432b3d19d',
    CONTRACT_SIGNER: '0x49d5BB72fA5AAbC29c2d32b2CDF74b1b22e0f140',
    // Verification
    VERIFF_VERIFIER: '0x78A5ced1325e9afEa07532Edd06f0eCa5c298E24',
    SUMSUB_VERIFIER: '0x2c626CAF9b86D560b2Cb7Be9CAF3249C9B98223b',
    // Hooks & Pools
    PASSPORT_GATED_HOOK: '0x223506790f7D5786dc40010B58230c0206b4c98d',
    HOOK_DEPLOYER: '0xA23270a73787b46deb12E1560B1886b47105e924',
    POOL_REGISTRY: '0x0211E9720AC9E35105852414333a7a095F1E1B5f',
    PRICE_FEED_MANAGER: '0x9715f1c997E1F6916a07866B1d722a8D90A4Cb8F',
    // Tokens
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    ECOP: '0x0000000000000000000000000000000000000000', // Not deployed on mainnet
    // External
    POOL_MANAGER: '0x7Da1D65F8B249183667cdE74C5CBD46dD38AA829',
    ZKPASSPORT_VERIFIER: '0x1D000001000EFD9a6371f4d90bB8920D5431c0D8',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },
  // Unichain Mainnet - Chain ID 130
  130: {
    CHAIN_ID: 130,
    CHAIN_NAME: 'Unichain Mainnet',
    // NFT Contracts - Tier System (v3.15)
    CONVEXO_PASSPORT: '0x248365C816b6F89cD0cb0AE09872ee46E9Ffff2D',
    LP_INDIVIDUALS: '0x60123D089a8a3Dc4578eC7C7f87276B1E132c278',
    LP_BUSINESS: '0x7203Aa9Bd8c68db0Ebf2E5f49E2EC2d53Daef25f',
    ECREDITSCORING: '0xd91bfc46A53d54554515Ecc0B72fE107bC0120e9',
    // Core Protocol
    VAULT_FACTORY: '0xDFC5B7FbC50F266E67bF74F1b21D262305Ff0069',
    TREASURY_FACTORY: '0x9887CF9c8D970e51330Dd0b4c2e3698851b31fA1',
    REPUTATION_MANAGER: '0x3D867565f94E8E838afe652E176b63F432b3d19d',
    CONTRACT_SIGNER: '0x49d5BB72fA5AAbC29c2d32b2CDF74b1b22e0f140',
    // Verification
    VERIFF_VERIFIER: '0x78A5ced1325e9afEa07532Edd06f0eCa5c298E24',
    SUMSUB_VERIFIER: '0x2c626CAF9b86D560b2Cb7Be9CAF3249C9B98223b',
    // Hooks & Pools
    PASSPORT_GATED_HOOK: '0xBE08eFDf8E4994cad5B7C055C045d783Cc7E052E',
    HOOK_DEPLOYER: '0xA23270a73787b46deb12E1560B1886b47105e924',
    POOL_REGISTRY: '0x0211E9720AC9E35105852414333a7a095F1E1B5f',
    PRICE_FEED_MANAGER: '0x9715f1c997E1F6916a07866B1d722a8D90A4Cb8F',
    // Tokens
    USDC: '0x078D782b760474a361dDA0AF3839290b0EF57AD6',
    ECOP: '0x0000000000000000000000000000000000000000', // Not deployed on mainnet
    // External
    POOL_MANAGER: '0x1F98400000000000000000000000000000000004',
    ZKPASSPORT_VERIFIER: '0x1D000001000EFD9a6371f4d90bB8920D5431c0D8',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },
  // Ethereum Mainnet - Chain ID 1 (placeholder - no addresses in JSON)
  1: {
    CHAIN_ID: 1,
    CHAIN_NAME: 'Ethereum Mainnet',
    // NFT Contracts - Tier System
    CONVEXO_PASSPORT: '0x248365C816b6F89cD0cb0AE09872ee46E9Ffff2D',
    LP_INDIVIDUALS: '0x60123D089a8a3Dc4578eC7C7f87276B1E132c278',
    LP_BUSINESS: '0x7203Aa9Bd8c68db0Ebf2E5f49E2EC2d53Daef25f',
    ECREDITSCORING: '0xd91bfc46A53d54554515Ecc0B72fE107bC0120e9',
    // Core Protocol
    REPUTATION_MANAGER: '0x3D867565f94E8E838afe652E176b63F432b3d19d',
    VAULT_FACTORY: '0x0000000000000000000000000000000000000000',
    TREASURY_FACTORY: '0x0000000000000000000000000000000000000000',
    CONTRACT_SIGNER: '0x49d5BB72fA5AAbC29c2d32b2CDF74b1b22e0f140',
    // Verification
    VERIFF_VERIFIER: '0x78A5ced1325e9afEa07532Edd06f0eCa5c298E24',
    SUMSUB_VERIFIER: '0x2c626CAF9b86D560b2Cb7Be9CAF3249C9B98223b',
    // Hooks & Pools
    PASSPORT_GATED_HOOK: '0x0000000000000000000000000000000000000000',
    HOOK_DEPLOYER: '0xA23270a73787b46deb12E1560B1886b47105e924',
    POOL_REGISTRY: '0x0211E9720AC9E35105852414333a7a095F1E1B5f',
    PRICE_FEED_MANAGER: '0x9715f1c997E1F6916a07866B1d722a8D90A4Cb8F',
    // Tokens
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    ECOP: '0x0000000000000000000000000000000000000000', // Not deployed on mainnet
    // External
    POOL_MANAGER: '0x8C4BcBE6b9eF47855f97E675296FA3F6fafa5F1A',
    ZKPASSPORT_VERIFIER: '0x1D000001000EFD9a6371f4d90bB8920D5431c0D8',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },
} as const;

// Helper function to get contracts for current chain
export function getContractsForChain(chainId: number): ChainContracts | null {
  if (chainId in CONTRACTS) {
    return CONTRACTS[chainId as ChainId];
  }
  return null;
}

// Helper to check if chain is supported
export function isSupportedChain(chainId: number): chainId is ChainId {
  return chainId === 84532 || chainId === 11155111 || chainId === 1301 || chainId === 8453 || chainId === 1 || chainId === 130;
}

// Get chain name by ID
export function getChainName(chainId: number): string {
  const contracts = getContractsForChain(chainId);
  return contracts?.CHAIN_NAME ?? 'Unknown Chain';
}

// Get block explorer URL for a chain
export function getBlockExplorerUrl(chainId: number): string {
  const explorers: Record<ChainId, string> = {
    11155111: 'https://sepolia.etherscan.io',
    84532: 'https://sepolia.basescan.org',
    1301: 'https://unichain-sepolia.blockscout.com',
    8453: 'https://basescan.org',
    130: 'https://unichain.blockscout.com',
    1: 'https://etherscan.io',
  };
  return explorers[chainId as ChainId] ?? '';
}

// Get address link for block explorer
export function getAddressExplorerLink(chainId: number, address: string): string {
  const baseUrl = getBlockExplorerUrl(chainId);
  return baseUrl ? `${baseUrl}/address/${address}` : '';
}

// Get transaction link for block explorer
export function getTxExplorerLink(chainId: number, txHash: string): string {
  const baseUrl = getBlockExplorerUrl(chainId);
  return baseUrl ? `${baseUrl}/tx/${txHash}` : '';
}

// IPFS URIs for NFT metadata using Pinata Gateway
export const IPFS = {
  // NFT Metadata IPFS Hashes
  CONVEXO_PASSPORT_HASH: 'bafybeiekwlyujx32cr5u3ixt5esfxhusalt5ljtrmsng74q7k45tilugh4',
  LP_INDIVIDUALS_HASH: 'bafkreib7mkjzpdm3id6st6d5vsxpn7v5h6sxeiswejjmrbcb5yoagaf4em',
  LP_BUSINESS_HASH: 'bafkreiejesvgsvohwvv7q5twszrbu5z6dnpke6sg5cdiwgn2rq7dilu33m',
  ECREDITSCORING_HASH: 'bafkreignxas6gqi7it5ng6muoykujxlgxxc4g7rr6sqvwgdfwveqf2zw3e',
  
  // Legacy URI format (for backwards compatibility)
  CONVEXO_LPS_URI: 'ipfs://bafkreib7mkjzpdm3id6st6d5vsxpn7v5h6sxeiswejjmrbcb5yoagaf4em',
  CONVEXO_VAULTS_URI: 'ipfs://bafkreignxas6gqi7it5ng6muoykujxlgxxc4g7rr6sqvwgdfwveqf2zw3e',
  
  // Standard IPFS URIs
  CONVEXO_PASSPORT_URI: 'ipfs://bafybeiekwlyujx32cr5u3ixt5esfxhusalt5ljtrmsng74q7k45tilugh4',
  LP_INDIVIDUALS_URI: 'ipfs://bafkreib7mkjzpdm3id6st6d5vsxpn7v5h6sxeiswejjmrbcb5yoagaf4em',
  LP_BUSINESS_URI: 'ipfs://bafkreiejesvgsvohwvv7q5twszrbu5z6dnpke6sg5cdiwgn2rq7dilu33m',
  ECREDITSCORING_URI: 'ipfs://bafkreignxas6gqi7it5ng6muoykujxlgxxc4g7rr6sqvwgdfwveqf2zw3e',
} as const;

// Helper function to get full IPFS URL with Pinata Gateway
export function getIPFSUrl(hash: string): string {
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'lime-famous-condor-7.mypinata.cloud';
  return `https://${gateway}/ipfs/${hash}`;
}

// ERC20 ABI for USDC interactions
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const;

// Supported chain IDs list
export const SUPPORTED_CHAIN_IDS: ChainId[] = [11155111, 84532, 1301, 8453, 130, 1];

// Testnet chain IDs
export const TESTNET_CHAIN_IDS: ChainId[] = [11155111, 84532, 1301];

// Mainnet chain IDs  
export const MAINNET_CHAIN_IDS: ChainId[] = [8453, 130, 1];

// Legacy export for backwards compatibility
export const BASE_SEPOLIA = CONTRACTS[84532];
export const ETH_SEPOLIA = CONTRACTS[11155111];
export const UNICHAIN_SEPOLIA = CONTRACTS[1301];