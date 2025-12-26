// Multi-chain contract addresses configuration - Version 2.2
// Supports: Base Sepolia, Ethereum Sepolia, Unichain Sepolia, Base Mainnet, Ethereum Mainnet, Unichain Mainnet
// v2.2 Updates: Protocol fee protection, timestamp tracking, vault completion logic

export type ChainId = 84532 | 11155111 | 1301 | 8453 | 1 | 130;

export interface ChainContracts {
  CHAIN_ID: ChainId;
  CHAIN_NAME: string;
  CONVEXO_LPS: `0x${string}`;
  CONVEXO_VAULTS: `0x${string}`;
  CONVEXO_PASSPORT: `0x${string}`;
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
  // Base Sepolia - Version 2.2
  84532: {
    CHAIN_ID: 84532,
    CHAIN_NAME: 'Base Sepolia',
    CONVEXO_LPS: '0x45723f029ed2bd61c5a34ba17eed92219e867513',
    CONVEXO_VAULTS: '0x15a2bde93252ab0bbca9eefeb83f1e489f6ac770',
    CONVEXO_PASSPORT: '0xaaf4c852636731005a3d194c3f543a70d9bbcce4',
    HOOK_DEPLOYER: '0xb35a6c66aa8f9fb3abd5f85158b98961d07e39d3',
    COMPLIANT_LP_HOOK: '0xbceeb5aef8905671846ffd187e482a729b5587de',
    POOL_REGISTRY: '0x3e192a3c3834fbdaef437efef005dadd1f04d8db',
    PRICE_FEED_MANAGER: '0x8a28297cb1a778010a571f20d0a5df4450a061c0',
    CONTRACT_SIGNER: '0x9b300ebf48b9fbf6a1489ae663194d62f2b35525',
    REPUTATION_MANAGER: '0x17fb3ef8ddcd1b1afe64665fed589e8b56a1085f',
    VAULT_FACTORY: '0x87982c6485452efea111b0babb212a604635c94d',
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    ECOP: '0xb934dcb57fb0673b7bc0fca590c5508f1cde955d',
    POOL_MANAGER: '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },
  // Ethereum Sepolia - Version 2.2
  11155111: {
    CHAIN_ID: 11155111,
    CHAIN_NAME: 'Ethereum Sepolia',
    CONVEXO_LPS: '0x2f781b3fffd6853a3d8ffca338d33b1d61ffab0e',
    CONVEXO_VAULTS: '0xefa4e787c96df9df08de5230ec6cf6126a211edc',
    CONVEXO_PASSPORT: '0x19d9fc7c6c3e62c1c7358504f47e629333b10627',
    HOOK_DEPLOYER: '0xda82a962e5671cfa97663e25495028c313a524e8',
    COMPLIANT_LP_HOOK: '0x7fcc3c235cbd5bd6059e4744c3a005c68a2d4da4',
    POOL_REGISTRY: '0x43d5c9507f399e689ddf4c05ba542a3ad5dbe53e',
    PRICE_FEED_MANAGER: '0xd34de952cec3af29abab321e68d7e51c098dc063',
    CONTRACT_SIGNER: '0xa2dfbe7252fcf7dd1b7760342ba126483d3b0548',
    REPUTATION_MANAGER: '0x549858f0f85ecce1f9713dc3ba5b61c7f9cca69d',
    VAULT_FACTORY: '0xe48f35fd0e00af2059f18cf67268cce6e87f4ea4',
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    ECOP: '0x19ac2612e560b2bbedf88660a2566ef53c0a15a1',
    POOL_MANAGER: '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },
  // Unichain Sepolia - Version 2.2
  1301: {
    CHAIN_ID: 1301,
    CHAIN_NAME: 'Unichain Sepolia',
    CONVEXO_LPS: '0x76da1b31497bbd1093f9226dcad505518cf62ca1',
    CONVEXO_VAULTS: '0xe542857f76dba4a53ef7d244cadc227b454b1502',
    CONVEXO_PASSPORT: '0xb612db1fe343c4b5ffa9e8c3f4dde37769f7c5b6',
    HOOK_DEPLOYER: '0xbfba31d3f7b36a78abd7c7905dacdecbe6bb97ad',
    COMPLIANT_LP_HOOK: '0x2b09a55380e9023b85886005dc53b600cf6e3f17',
    POOL_REGISTRY: '0xf75af6f9d586f9c16c5789b2c310dd7a98df97ae',
    PRICE_FEED_MANAGER: '0x9c60e348dfbb8bba62f8408cb7fa85dc88bd9957',
    CONTRACT_SIGNER: '0x71e7aab4d65383fb75eea51ec58b5d5b999e0aec',
    REPUTATION_MANAGER: '0xb286824b6f5789ba6a6710a5e9fe487a4cb21f06',
    VAULT_FACTORY: '0x0bb2e0ce69aa107e3f3b7a5dd3d8192c212ff0d5',
    USDC: '0x31d0220469e10c4E71834a79b1f276d740d3768F',
    ECOP: '0xbb0d7c4141ee1fed53db766e1ffcb9c618df8260',
    POOL_MANAGER: '0x00B036B58a818B1BC34d502D3fE730Db729e62AC',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },
  // Base Mainnet - Version 2.2
  8453: {
    CHAIN_ID: 8453,
    CHAIN_NAME: 'Base Mainnet',
    CONVEXO_LPS: '0x24d91b11b0dd12d6520e58c72f8fcc9dc1c5b935',
    CONVEXO_VAULTS: '0x3770bb3bbeb0102a36f51aa253e69034058e4f84',
    CONVEXO_PASSPORT: '0x2fa95f79ce8c5c01581f6792acc4181282aaefb0',
    HOOK_DEPLOYER: '0xf8dce148ab008f7ae47a26377252673438801712',
    COMPLIANT_LP_HOOK: '0x3d684ac58f25a95c107565bcffffb219b00557c7',
    POOL_REGISTRY: '0x8b99bfaae6e24251017eed64536ac7df6f155c96',
    PRICE_FEED_MANAGER: '0x4995b505d90d59e1688a24705698953f0c460c4d',
    CONTRACT_SIGNER: '0x1ad4c60a50d184f16fe3cdab2a80d5fdbee405e2',
    REPUTATION_MANAGER: '0x6441431e6658ef7aab95f2125055ea6f0c42b06e',
    VAULT_FACTORY: '0x7fd91438eacffe828f61737d64926ee44cf6695c',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    ECOP: '0x0000000000000000000000000000000000000000', // Not deployed on mainnet
    POOL_MANAGER: '0x7Da1D65F8B249183667cdE74C5CBD46dD38AA829',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },
  // Ethereum Mainnet - Version 2.2
  1: {
    CHAIN_ID: 1,
    CHAIN_NAME: 'Ethereum Mainnet',
    CONVEXO_LPS: '0x7356bf8000de3ca7518a363b954d67cc54f7c84d',
    CONVEXO_VAULTS: '0x282a52f7607ef04415c6567d18f1bf9acd043f42',
    CONVEXO_PASSPORT: '0x292ef88a7199916899fc296ff6b522306fa2b19a',
    HOOK_DEPLOYER: '0x4dbccff8730398a35d517ab8a1e8413a45d686c4',
    COMPLIANT_LP_HOOK: '0xbb13194b2792e291109402369cb4fc0358aed132',
    POOL_REGISTRY: '0xec02a78f2e6db438eb9b75aa173ac0f0d1d3126a',
    PRICE_FEED_MANAGER: '0x85c795fdc63a106fa6c6922d0bfd6cefd04a29d7',
    CONTRACT_SIGNER: '0x5a1f415986a189d79d19d65cb6e3d6dd7b807268',
    REPUTATION_MANAGER: '0xc98bce4617f9708dd1363f21177be5ef21fb4993',
    VAULT_FACTORY: '0x6b51adc34a503b23db99444048ac7c2dc735a12e',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    ECOP: '0x0000000000000000000000000000000000000000', // Not deployed on mainnet
    POOL_MANAGER: '0x8C4BcBE6b9eF47855f97E675296FA3F6fafa5F1A',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },
  // Unichain Mainnet - Version 2.2
  130: {
    CHAIN_ID: 130,
    CHAIN_NAME: 'Unichain Mainnet',
    CONVEXO_LPS: '0x8b99bfaae6e24251017eed64536ac7df6f155c96',
    CONVEXO_VAULTS: '0x6441431e6658ef7aab95f2125055ea6f0c42b06e',
    CONVEXO_PASSPORT: '0x4995b505d90d59e1688a24705698953f0c460c4d',
    HOOK_DEPLOYER: '0x1ad4c60a50d184f16fe3cdab2a80d5fdbee405e2',
    COMPLIANT_LP_HOOK: '0x7fd91438eacffe828f61737d64926ee44cf6695c',
    POOL_REGISTRY: '0xf02d84e56da48cec9233cb7982db0ac82f29a973',
    PRICE_FEED_MANAGER: '0x9fe009296cc964573cc8fb394598a3d5b9800394',
    CONTRACT_SIGNER: '0x0f0e9e5e7e6a47d35e261dd876438cd144f97f1e',
    REPUTATION_MANAGER: '0x1843c76dfe7a353d239912d8e23bdebda712f4c9',
    VAULT_FACTORY: '0x6ba429488cad3795af1ec65d80be760b70f58e4b',
    USDC: '0x078D782b760474a361dDA0AF3839290b0EF57AD6',
    ECOP: '0x0000000000000000000000000000000000000000', // Not deployed on mainnet
    POOL_MANAGER: '0x1F98400000000000000000000000000000000004',
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

// IPFS URIs for NFT metadata
export const IPFS = {
  CONVEXO_LPS_URI: 'ipfs://bafkreib7mkjzpdm3id6st6d5vsxpn7v5h6sxeiswejjmrbcb5yoagaf4em',
  CONVEXO_VAULTS_URI: 'ipfs://bafkreignxas6gqi7it5ng6muoykujxlgxxc4g7rr6sqvwgdfwveqf2zw3e',
} as const;

// Legacy export for backwards compatibility
export const BASE_SEPOLIA = CONTRACTS[84532];
