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
  // Legacy NFT names (backwards compatibility)
  CONVEXO_LPS: `0x${string}`;            // Same as LP_INDIVIDUALS
  CONVEXO_VAULTS: `0x${string}`;         // Same as LP_BUSINESS
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
  COMPLIANT_LP_HOOK: `0x${string}`;
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
    // NFT Contracts - Tier System
    CONVEXO_PASSPORT: '0x5c999003291235dce835500b183049a3b28fe783',
    LP_INDIVIDUALS: '0xd75edf919d744e9dfcad68939674d8c9fada5c97',
    LP_BUSINESS: '0x60c03e49f6567528ec30d27091b1588b31f71c2d',
    ECREDITSCORING: '0x45b4f3fbe30e7449f746e5f006c6c8f362f113b5',
    // Legacy names (point to same contracts)
    CONVEXO_LPS: '0x6d2101b853e80ea873d2c7c0ec6138c837779c6a',
    CONVEXO_VAULTS: '0xd1ff2d103a864ccb150602dedc09804037b8ce85',
    // Core Protocol
    REPUTATION_MANAGER: '0x998e0acc4e7848b208f217a7bc928b1794e520a9',
    VAULT_FACTORY: '0x013aab7022fb502a896b767f2a4615f402521881',
    TREASURY_FACTORY: '0xcc202e61099b3e8d5b4d7b8ecf6d56d0502a84ac',
    CONTRACT_SIGNER: '0xa28e1f376089b94a6e0b2132c035fae8c036ad12',
    // Verification
    VERIFF_VERIFIER: '0x8fd1a5f5412911223be9d11b730078c4cbd8a122',
    SUMSUB_VERIFIER: '0x0ec07bb1329c87c26d1fb3272404aaa928ee13be',
    // Hooks & Pools
    HOOK_DEPLOYER: '0xecb0bd3364ab749a453a1ef8a89030f2244f9b3d',
    COMPLIANT_LP_HOOK: '0xb1697c34cc15cb1fba579f94693e9ab53292b51b',
    PASSPORT_GATED_HOOK: '0x139e66f6649ace050fc0203318d83124c33406f2',
    POOL_REGISTRY: '0x02863745fef5235e7d25f133b245a1d7cf4a154e',
    PRICE_FEED_MANAGER: '0xfcd198b5e750c45c44452d173ca3554f1291443f',
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
    // NFT Contracts - Tier System
    CONVEXO_PASSPORT: '0x33480dfdde5c9a6314944d3830c8840924fc3484',
    LP_INDIVIDUALS: '0xa9f895aab982d10a6df724139826890e6fb00cd1',
    LP_BUSINESS: '0x45abbac725831956b9a2d37267e339883ce2ba26',
    ECREDITSCORING: '0x91112795b89893a73b8bf61a6529a080bc1e16a6',
    // Legacy names
    CONVEXO_LPS: '0xf048da86da99a76856c02a83fb53e72277acacdf',
    CONVEXO_VAULTS: '0xe9309e75f168b5c98c37a5465e539a0fdbf33eb9',
    // Core Protocol
    REPUTATION_MANAGER: '0x0873a0adb98d8f7bfaa4535fd04801e1b5bf1221',
    VAULT_FACTORY: '0x2bd7b41c856b4b1f77a740cd7252532bb7341279',
    TREASURY_FACTORY: '0x29b65797a9597786ff8296827236fe9b7734fc44',
    CONTRACT_SIGNER: '0x478b79b0844edfc0e55cecfe639169bb113b9b9b',
    // Verification
    VERIFF_VERIFIER: '0xb31fac9deba65e5caac659036ded336987c014fc',
    SUMSUB_VERIFIER: '0xf13dac2abc1405af5f483338877c30ec35b95c19',
    // Hooks & Pools
    HOOK_DEPLOYER: '0xc9193105fc850966a94118d687041bdd1a8250dd',
    COMPLIANT_LP_HOOK: '0x058faa5e95b3deb41e6ecabe4dd870b8e3d90475',
    PASSPORT_GATED_HOOK: '0xca93170427c8f528e03eafb86301e9f21fc1e513',
    POOL_REGISTRY: '0x08e8852938dde4dccb02e2c51c0f2ee4556d2ad7',
    PRICE_FEED_MANAGER: '0x04876d3d4c89cee3c4f88ef8878e7d8269c35959',
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
    // NFT Contracts - Tier System
    CONVEXO_PASSPORT: '0x83df102f62c4640ac8be584c2b4e20c8c373dc2e',
    LP_INDIVIDUALS: '0x60afa63fdf17a75534e8218baac1d64e7fd93b4a',
    LP_BUSINESS: '0x6a9af3b1da3fc07c78c37c380368773b1e830fac',
    ECREDITSCORING: '0xe6b658c4d1e00a675df046ca0baeb86bef7da985',
    // Legacy names
    CONVEXO_LPS: '0xfb965542aa0b58538a9b50fe020314dd687eb128',
    CONVEXO_VAULTS: '0x503f203ce6d6462f433cd04c7ad2b05d61b56548',
    // Core Protocol
    REPUTATION_MANAGER: '0x8c2d66210a43201bae2a7bf924eca0f53364967f',
    VAULT_FACTORY: '0x43d5c9507f399e689ddf4c05ba542a3ad5dbe53e',
    TREASURY_FACTORY: '0x549858f0f85ecce1f9713dc3ba5b61c7f9cca69d',
    CONTRACT_SIGNER: '0x7fcc3c235cbd5bd6059e4744c3a005c68a2d4da4',
    // Verification
    VERIFF_VERIFIER: '0xd34de952cec3af29abab321e68d7e51c098dc063',
    SUMSUB_VERIFIER: '0xa2dfbe7252fcf7dd1b7760342ba126483d3b0548',
    // Hooks & Pools
    HOOK_DEPLOYER: '0x2f781b3fffd6853a3d8ffca338d33b1d61ffab0e',
    COMPLIANT_LP_HOOK: '0x50ace0dce54df668477adee4e9d6a6c0df4fedee',
    PASSPORT_GATED_HOOK: '0xefa4e787c96df9df08de5230ec6cf6126a211edc',
    POOL_REGISTRY: '0x19d9fc7c6c3e62c1c7358504f47e629333b10627',
    PRICE_FEED_MANAGER: '0xda82a962e5671cfa97663e25495028c313a524e8',
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
    // NFT Contracts - Tier System
    CONVEXO_PASSPORT: '0x0b788fbc303f9b62b9012a3e551aedd7f7ede9e4',
    LP_INDIVIDUALS: '0x3d8e5f30c83e1f5decac6c70bc3d1782043b2628',
    LP_BUSINESS: '0xaf5a98aa5208a2bb19ba91f75f10a76358d911a0',
    ECREDITSCORING: '0xa0eff2c7e0569fcb9c70131d7abc25b33a8689e7',
    // Legacy names
    CONVEXO_LPS: '0x5e252bb1642cfa13d4ad93cdfdbabcb9c64ac841',
    CONVEXO_VAULTS: '0xfe381737efb123a24dc41b0e3eeffc0ccb5eee71',
    // Core Protocol
    REPUTATION_MANAGER: '0xdb2a87f9b7b40eb279007fd7eb23bd2bfa74ed33',
    VAULT_FACTORY: '0x50ace0dce54df668477adee4e9d6a6c0df4fedee',
    TREASURY_FACTORY: '0xa46629011e0b8561a45ea03b822d28c0b2432c3a',
    CONTRACT_SIGNER: '0x18fb358bc74054b0c2530c48ef23f8a8d464cb18',
    // Verification
    VERIFF_VERIFIER: '0x62227ff7ccbdb4d72c3511290b28c3424f1500ef',
    SUMSUB_VERIFIER: '0x8efc7e25c12a815329331da5f0e96affb4014472',
    // Hooks & Pools
    HOOK_DEPLOYER: '0xd05df511dbe7d793d82b7344a955f15485ff0787',
    COMPLIANT_LP_HOOK: '0x805b733cc50818dabede4847c4a775a7b1610f96',
    PASSPORT_GATED_HOOK: '0xfb965542aa0b58538a9b50fe020314dd687eb128',
    POOL_REGISTRY: '0x503f203ce6d6462f433cd04c7ad2b05d61b56548',
    PRICE_FEED_MANAGER: '0xab83ce760054c1d048d5a9de5194b05398a09d41',
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
    // NFT Contracts - Tier System
    CONVEXO_PASSPORT: '0xa0eff2c7e0569fcb9c70131d7abc25b33a8689e7',
    LP_INDIVIDUALS: '0xdb2a87f9b7b40eb279007fd7eb23bd2bfa74ed33',
    LP_BUSINESS: '0xd05df511dbe7d793d82b7344a955f15485ff0787',
    ECREDITSCORING: '0xfb965542aa0b58538a9b50fe020314dd687eb128',
    // Legacy names
    CONVEXO_LPS: '0xa03e2718e0ade2d07bfd9ea5705af9a83bb2db96',
    CONVEXO_VAULTS: '0x805b733cc50818dabede4847c4a775a7b1610f96',
    // Core Protocol
    REPUTATION_MANAGER: '0x503f203ce6d6462f433cd04c7ad2b05d61b56548',
    VAULT_FACTORY: '0x8efc7e25c12a815329331da5f0e96affb4014472',
    TREASURY_FACTORY: '0xa932e3eaa0a5e5e65f0567405207603266937618',
    CONTRACT_SIGNER: '0x62227ff7ccbdb4d72c3511290b28c3424f1500ef',
    // Verification
    VERIFF_VERIFIER: '0x2cfa02372782cf20ef8342b0193fd69e4c5b04a8',
    SUMSUB_VERIFIER: '0xecde45fefb5c2ef6e5cc615291de9be9a99b46a6',
    // Hooks & Pools
    HOOK_DEPLOYER: '0xab83ce760054c1d048d5a9de5194b05398a09d41',
    COMPLIANT_LP_HOOK: '0x2a0d9da5a72dfe20b65b25e9fefc0e6e090ac194',
    PASSPORT_GATED_HOOK: '0x18fb358bc74054b0c2530c48ef23f8a8d464cb18',
    POOL_REGISTRY: '0x50ace0dce54df668477adee4e9d6a6c0df4fedee',
    PRICE_FEED_MANAGER: '0xa46629011e0b8561a45ea03b822d28c0b2432c3a',
    // Tokens
    USDC: '0x078D782b760474a361dDA0AF3839290b0EF57AD6',
    ECOP: '0x0000000000000000000000000000000000000000', // Not deployed on mainnet
    // External
    POOL_MANAGER: '0x1F98400000000000000000000000000000000004',
    ZKPASSPORT_VERIFIER: '0x1D000001000EFD9a6371f4d90bB8920D5431c0D8',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },
  // Ethereum Mainnet - Chain ID 1
  1: {
    CHAIN_ID: 1,
    CHAIN_NAME: 'Ethereum Mainnet',
    // NFT Contracts - Tier System
    CONVEXO_PASSPORT: '0x6b51adc34a503b23db99444048ac7c2dc735a12e',
    LP_INDIVIDUALS: '0x5d88bcf0d62f17846d41e161e92e497d4224764d',
    LP_BUSINESS: '0x6a6357c387331e75d6eeb4d4abc0f0200cd32830',
    ECREDITSCORING: '0xafb16cfaf1389713c59f7aee3c1a08d3cedc3ee3',
    // Legacy names
    CONVEXO_LPS: '0x85c795fdc63a106fa6c6922d0bfd6cefd04a29d7',
    CONVEXO_VAULTS: '0x5a1f415986a189d79d19d65cb6e3d6dd7b807268',
    // Core Protocol
    REPUTATION_MANAGER: '0xc5e04ab886025b3fe3d99249d1db069e0b599d8e',
    VAULT_FACTORY: '0xdd973ce09ba55260e217d10f9dec6d7945d73e79',
    TREASURY_FACTORY: '0x24d91b11b0dd12d6520e58c72f8fcc9dc1c5b935',
    CONTRACT_SIGNER: '0xe0c0d95701558ef10768a13a944f56311ead4649',
    // Verification
    VERIFF_VERIFIER: '0x3770bb3bbeb0102a36f51aa253e69034058e4f84',
    SUMSUB_VERIFIER: '0x2fa95f79ce8c5c01581f6792acc4181282aaefb0',
    // Hooks & Pools
    HOOK_DEPLOYER: '0xd09e7252c6402155f9d13653de24ae4f0a220fec',
    COMPLIANT_LP_HOOK: '0x6a6357c387331e75d6eeb4d4abc0f0200cd32830',
    PASSPORT_GATED_HOOK: '0x74577d6e9140944db7ae2f1e103a39962c80c235',
    POOL_REGISTRY: '0xbabee8acecc117c1295f8950f51db59f7a881646',
    PRICE_FEED_MANAGER: '0xd189d95ee1a126a66fc5a84934372aa0fc0bb6d2',
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

// IPFS URIs for NFT metadata
export const IPFS = {
  CONVEXO_LPS_URI: 'ipfs://bafkreib7mkjzpdm3id6st6d5vsxpn7v5h6sxeiswejjmrbcb5yoagaf4em',
  CONVEXO_VAULTS_URI: 'ipfs://bafkreignxas6gqi7it5ng6muoykujxlgxxc4g7rr6sqvwgdfwveqf2zw3e',
  CONVEXO_PASSPORT_URI: 'ipfs://QmPassportMetadataPlaceholder', // Update with actual IPFS hash
  LP_INDIVIDUALS_URI: 'ipfs://QmLPIndividualsMetadata',
  LP_BUSINESS_URI: 'ipfs://QmLPBusinessMetadata',
  ECREDITSCORING_URI: 'ipfs://QmEcreditscoringMetadata',
} as const;

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
