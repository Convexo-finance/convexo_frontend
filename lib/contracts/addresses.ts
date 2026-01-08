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
    CONVEXO_PASSPORT: '0x04b26cac4419132c010ea339316dba3baa638acc',
    LP_INDIVIDUALS: '0x484c05645ebacc71f1adde1cfd6a052f6fad29ed',
    LP_BUSINESS: '0x10fc2c87e6b673849bbc8833ed6f9343494225a3',
    ECREDITSCORING: '0xe45cad4eb3c9b49c5bac985f043d635627becceb',
    // Legacy names (point to same contracts)
    CONVEXO_LPS: '0x6d2101b853e80ea873d2c7c0ec6138c837779c6a',
    CONVEXO_VAULTS: '0xd1ff2d103a864ccb150602dedc09804037b8ce85',
    // Core Protocol
    REPUTATION_MANAGER: '0xe618c18dc57a431a5826abf5fe4329b4422f9eb0',
    VAULT_FACTORY: '0x7a88b6f5039f86d827fb098aa83eacca7345a182',
    TREASURY_FACTORY: '0xa1117a2df674b896b57cacd3ca0c77a667e6ab6e',
    CONTRACT_SIGNER: '0x54b9675e649765e401632db548ee2f09f83e359c',
    // Verification
    VERIFF_VERIFIER: '0x1cbf87e0410338e0ea6bfcd21f66584e92d168bb',
    SUMSUB_VERIFIER: '0xe9c905ebf5e1bb970a2571d6112eb1d37f550ca8',
    // Hooks & Pools
    HOOK_DEPLOYER: '0x0c34b1c9cdd55f62cdbe070af46b57c33527d80b',
    COMPLIANT_LP_HOOK: '0xb1697c34cc15cb1fba579f94693e9ab53292b51b',
    PASSPORT_GATED_HOOK: '0xe43c57a4be9578b8f8be98608135bb6ff7e7941a',
    POOL_REGISTRY: '0x4b99d117b1d058ab7efda061560f035e0280b355',
    PRICE_FEED_MANAGER: '0xf3e60a65f93720e2b863a7182208a93cb23a3af8',
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
    CONVEXO_PASSPORT: '0x6a7fa6e40315b54f22555d892569b1f310a500e3',
    LP_INDIVIDUALS: '0xdfd8aeec2594faf1f2ad9b86893b22f32f1be2bb',
    LP_BUSINESS: '0xf017d61001441139d9e48e8558479d347a1689a7',
    ECREDITSCORING: '0x83b1707ca91f0888ea7401cab66e4eb6a045eec2',
    // Legacy names
    CONVEXO_LPS: '0xf048da86da99a76856c02a83fb53e72277acacdf',
    CONVEXO_VAULTS: '0xe9309e75f168b5c98c37a5465e539a0fdbf33eb9',
    // Core Protocol
    REPUTATION_MANAGER: '0x0373f84a46e4be3f6dbb47f07fb3ed1f17c4ee1f',
    VAULT_FACTORY: '0x7b71bb4dc9cdff46bbd8f11bfd87e1f9e4eae15a',
    TREASURY_FACTORY: '0x426d9dfb361d5374c114116778b3c225944aec32',
    CONTRACT_SIGNER: '0xad58ba3f1e4a9c8f0f8b6e5f5f5f5f5f5f5f5f5f',
    // Verification
    VERIFF_VERIFIER: '0x2a4a50c324a12881c732d7bb23fce472195994a7',
    SUMSUB_VERIFIER: '0x3b47b35f65086309861f293448f579df4f2ae727',
    // Hooks & Pools
    HOOK_DEPLOYER: '0x3609c081d5558e4ec5d3a848ffc738a7c3d21cd5',
    COMPLIANT_LP_HOOK: '0x058faa5e95b3deb41e6ecabe4dd870b8e3d90475',
    PASSPORT_GATED_HOOK: '0xd3c603e95f06d2e9f398caa198f44477f78b28fd',
    POOL_REGISTRY: '0x7b71bb4dc9cdff46bbd8f11bfd87e1f9e4eae15a',
    PRICE_FEED_MANAGER: '0xf017d61001441139d9e48e8558479d347a1689a7',
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
    CONVEXO_PASSPORT: '0xe48f35fd0e00af2059f18cf67268cce6e87f4ea4',
    LP_INDIVIDUALS: '0x8f63093ded306d36002213af027e597210b6bb21',
    LP_BUSINESS: '0x1115fc70b349ec8d3912fedac903ff27527bbb30',
    ECREDITSCORING: '0x35f82e74ef83c94d11474e1a6f69361f4e961117',
    // Legacy names
    CONVEXO_LPS: '0xfb965542aa0b58538a9b50fe020314dd687eb128',
    CONVEXO_VAULTS: '0x503f203ce6d6462f433cd04c7ad2b05d61b56548',
    // Core Protocol
    REPUTATION_MANAGER: '0x9f0e8f3e5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f',
    VAULT_FACTORY: '0x1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b',
    TREASURY_FACTORY: '0x2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c',
    CONTRACT_SIGNER: '0x3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d',
    // Verification
    VERIFF_VERIFIER: '0x29da93ef19643d51dc27c78af271f4ee2394938f',
    SUMSUB_VERIFIER: '0x6d2101b853e80ea873d2c7c0ec6138c837779c6a',
    // Hooks & Pools
    HOOK_DEPLOYER: '0x4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e',
    COMPLIANT_LP_HOOK: '0x50ace0dce54df668477adee4e9d6a6c0df4fedee',
    PASSPORT_GATED_HOOK: '0xee93435e75f18468e518ee5bc9e5b3b99197d31f',
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
    CONVEXO_PASSPORT: '0xecde45fefb5c2ef6e5cc615291de9be9a99b46a6',
    LP_INDIVIDUALS: '0xe99a49bd81bbe61cdf7f6b7d247f76cacc2e5776',
    LP_BUSINESS: '0x83df102f62c4640ac8be584c2b4e20c8c373dc2e',
    ECREDITSCORING: '0x60afa63fdf17a75534e8218baac1d64e7fd93b4a',
    // Legacy names
    CONVEXO_LPS: '0x5e252bb1642cfa13d4ad93cdfdbabcb9c64ac841',
    CONVEXO_VAULTS: '0xfe381737efb123a24dc41b0e3eeffc0ccb5eee71',
    // Core Protocol
    REPUTATION_MANAGER: '0xdb2a87f9b7b40eb279007fd7eb23bd2bfa74ed33',
    VAULT_FACTORY: '0x50ace0dce54df668477adee4e9d6a6c0df4fedee',
    TREASURY_FACTORY: '0x7fcc3c235cbd5bd6059e4744c3a005c68a2d4da4',
    CONTRACT_SIGNER: '0x18fb358bc74054b0c2530c48ef23f8a8d464cb18',
    // Verification
    VERIFF_VERIFIER: '0x43d5c9507f399e689ddf4c05ba542a3ad5dbe53e',
    SUMSUB_VERIFIER: '0x549858f0f85ecce1f9713dc3ba5b61c7f9cca69d',
    // Hooks & Pools
    HOOK_DEPLOYER: '0xd05df511dbe7d793d82b7344a955f15485ff0787',
    COMPLIANT_LP_HOOK: '0x805b733cc50818dabede4847c4a775a7b1610f96',
    PASSPORT_GATED_HOOK: '0x8c2d66210a43201bae2a7bf924eca0f53364967f',
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
    CONVEXO_PASSPORT: '0x6a9af3b1da3fc07c78c37c380368773b1e830fac',
    LP_INDIVIDUALS: '0x6a9af3b1da3fc07c78c37c380368773b1e830fac',
    LP_BUSINESS: '0x6a9af3b1da3fc07c78c37c380368773b1e830fac',
    ECREDITSCORING: '0x6a9af3b1da3fc07c78c37c380368773b1e830fac',
    // Legacy names
    CONVEXO_LPS: '0xa03e2718e0ade2d07bfd9ea5705af9a83bb2db96',
    CONVEXO_VAULTS: '0x805b733cc50818dabede4847c4a775a7b1610f96',
    // Core Protocol
    REPUTATION_MANAGER: '0xe6b658c4d1e00a675df046ca0baeb86bef7da985',
    VAULT_FACTORY: '0x2f781b3fffd6853a3d8ffca338d33b1d61ffab0e',
    TREASURY_FACTORY: '0x19d9fc7c6c3e62c1c7358504f47e629333b10627',
    CONTRACT_SIGNER: '0xda82a962e5671cfa97663e25495028c313a524e8',
    // Verification
    VERIFF_VERIFIER: '0x2cfa02372782cf20ef8342b0193fd69e4c5b04a8',
    SUMSUB_VERIFIER: '0xd34de952cec3af29abab321e68d7e51c098dc063',
    // Hooks & Pools
    HOOK_DEPLOYER: '0x8c2d66210a43201bae2a7bf924eca0f53364967f',
    COMPLIANT_LP_HOOK: '0x2a0d9da5a72dfe20b65b25e9fefc0e6e090ac194',
    PASSPORT_GATED_HOOK: '0x2f781b3fffd6853a3d8ffca338d33b1d61ffab0e',
    POOL_REGISTRY: '0xefa4e787c96df9df08de5230ec6cf6126a211edc',
    PRICE_FEED_MANAGER: '0x19d9fc7c6c3e62c1c7358504f47e629333b10627',
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