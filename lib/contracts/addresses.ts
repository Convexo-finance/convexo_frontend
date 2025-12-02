// Multi-chain contract addresses configuration - Version 2.0
// Supports: Base Sepolia, Ethereum Sepolia, Unichain Sepolia

export type ChainId = 84532 | 11155111 | 1301;

export interface ChainContracts {
  CHAIN_ID: ChainId;
  CHAIN_NAME: string;
  CONVEXO_LPS: `0x${string}`;
  CONVEXO_VAULTS: `0x${string}`;
  HOOK_DEPLOYER: `0x${string}`;
  COMPLIANT_LP_HOOK: `0x${string}`;
  POOL_REGISTRY: `0x${string}`;
  PRICE_FEED_MANAGER: `0x${string}`;
  CONTRACT_SIGNER: `0x${string}`;
  REPUTATION_MANAGER: `0x${string}`;
  VAULT_FACTORY: `0x${string}`;
  USDC: `0x${string}`;
  ECOP: `0x${string}`;
  POOL_MANAGER: `0x${string}`;
  ADMIN_ADDRESS: `0x${string}`;
}

export const CONTRACTS: Record<ChainId, ChainContracts> = {
  // Base Sepolia - Version 2.0
  84532: {
    CHAIN_ID: 84532,
    CHAIN_NAME: 'Base Sepolia',
    CONVEXO_LPS: '0xbABEe8acECC117c1295F8950f51Db59F7a881646',
    CONVEXO_VAULTS: '0xd189d95eE1a126A66fc5A84934372Aa0Fc0bb6d2',
    HOOK_DEPLOYER: '0xE0c0d95701558eF10768A13A944F56311EAD4649',
    COMPLIANT_LP_HOOK: '0xDd973cE09ba55260e217d10f9DeC6D7945D73E79',
    POOL_REGISTRY: '0x24d91b11B0Dd12d6520E58c72F8FCC9dC1C5b935',
    PRICE_FEED_MANAGER: '0x2Fa95f79Ce8C5c01581f6792ACc4181282aaEFB0',
    CONTRACT_SIGNER: '0xf8dce148AB008f7ae47A26377252673438801712',
    REPUTATION_MANAGER: '0x3770Bb3BBEb0102a36f51aA253E69034058E4F84',
    VAULT_FACTORY: '0x3D684Ac58f25a95c107565bCFfffb219B00557C7',
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    ECOP: '0xb934dcb57fb0673b7bc0fca590c5508f1cde955d',
    POOL_MANAGER: '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },
  // Ethereum Sepolia - Version 2.0
  11155111: {
    CHAIN_ID: 11155111,
    CHAIN_NAME: 'Ethereum Sepolia',
    CONVEXO_LPS: '0x7fd91438eacffe828f61737d64926ee44cf6695c',
    CONVEXO_VAULTS: '0xf02d84e56da48cec9233cb7982db0ac82f29a973',
    HOOK_DEPLOYER: '0x1843c76dfe7a353d239912d8e23bdebda712f4c9',
    COMPLIANT_LP_HOOK: '0x9fe009296cc964573cc8fb394598a3d5b9800394',
    POOL_REGISTRY: '0x0f0e9e5e7e6a47d35e261dd876438cd144f97f1e',
    PRICE_FEED_MANAGER: '0x64fd5631ffe78e907da7b48542abfb402680891a',
    CONTRACT_SIGNER: '0x1917aac9c182454b3ab80aa8703734d2831adf08',
    REPUTATION_MANAGER: '0x6ba429488cad3795af1ec65d80be760b70f58e4b',
    VAULT_FACTORY: '0x3933f0018fc7d21756b86557640d66b97f514bae',
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    ECOP: '0x19ac2612e560b2bbedf88660a2566ef53c0a15a1',
    POOL_MANAGER: '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },
  // Unichain Sepolia - Version 2.0
  1301: {
    CHAIN_ID: 1301,
    CHAIN_NAME: 'Unichain Sepolia',
    CONVEXO_LPS: '0xbb13194b2792e291109402369cb4fc0358aed132',
    CONVEXO_VAULTS: '0xec02a78f2e6db438eb9b75aa173ac0f0d1d3126a',
    HOOK_DEPLOYER: '0xc98bce4617f9708dd1363f21177be5ef21fb4993',
    COMPLIANT_LP_HOOK: '0x85c795fdc63a106fa6c6922d0bfd6cefd04a29d7',
    POOL_REGISTRY: '0x5a1f415986a189d79d19d65cb6e3d6dd7b807268',
    PRICE_FEED_MANAGER: '0x5d88bcf0d62f17846d41e161e92e497d4224764d',
    CONTRACT_SIGNER: '0x6a6357c387331e75d6eeb4d4abc0f0200cd32830',
    REPUTATION_MANAGER: '0x6b51adc34a503b23db99444048ac7c2dc735a12e',
    VAULT_FACTORY: '0xafb16cfaf1389713c59f7aee3c1a08d3cedc3ee3',
    USDC: '0x31d0220469e10c4E71834a79b1f276d740d3768F',
    ECOP: '0xbb0d7c4141ee1fed53db766e1ffcb9c618df8260',
    POOL_MANAGER: '0x00B036B58a818B1BC34d502D3fE730Db729e62AC',
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
  return chainId === 84532 || chainId === 11155111 || chainId === 1301;
}

// IPFS URIs for NFT metadata
export const IPFS = {
  CONVEXO_LPS_URI: 'ipfs://bafkreib7mkjzpdm3id6st6d5vsxpn7v5h6sxeiswejjmrbcb5yoagaf4em',
  CONVEXO_VAULTS_URI: 'ipfs://bafkreignxas6gqi7it5ng6muoykujxlgxxc4g7rr6sqvwgdfwveqf2zw3e',
} as const;

// Legacy export for backwards compatibility
export const BASE_SEPOLIA = CONTRACTS[84532];
