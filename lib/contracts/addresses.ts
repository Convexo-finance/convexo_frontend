// Multi-chain contract addresses configuration - Version 2.2
// Supports: Base Sepolia, Ethereum Sepolia, Unichain Sepolia
// v2.2 Updates: Protocol fee protection, timestamp tracking, vault completion logic

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
  // Base Sepolia - Version 2.2
  84532: {
    CHAIN_ID: 84532,
    CHAIN_NAME: 'Base Sepolia',
    CONVEXO_LPS: '0xd05df511dbe7d793d82b7344a955f15485ff0787',
    CONVEXO_VAULTS: '0xfb965542aa0b58538a9b50fe020314dd687eb128',
    HOOK_DEPLOYER: '0x503f203ce6d6462f433cd04c7ad2b05d61b56548',
    COMPLIANT_LP_HOOK: '0xab83ce760054c1d048d5a9de5194b05398a09d41',
    POOL_REGISTRY: '0x18fb358bc74054b0c2530c48ef23f8a8d464cb18',
    PRICE_FEED_MANAGER: '0xa46629011e0b8561a45ea03b822d28c0b2432c3a',
    CONTRACT_SIGNER: '0x62227ff7ccbdb4d72c3511290b28c3424f1500ef',
    REPUTATION_MANAGER: '0x50ace0dce54df668477adee4e9d6a6c0df4fedee',
    VAULT_FACTORY: '0x8efc7e25c12a815329331da5f0e96affb4014472',
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    ECOP: '0xb934dcb57fb0673b7bc0fca590c5508f1cde955d',
    POOL_MANAGER: '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },
  // Ethereum Sepolia - Version 2.2
  11155111: {
    CHAIN_ID: 11155111,
    CHAIN_NAME: 'Ethereum Sepolia',
    CONVEXO_LPS: '0x2a0d9da5a72dfe20b65b25e9fefc0e6e090ac194',
    CONVEXO_VAULTS: '0x744e39b3eb1be014cb8d14a585c31e22b7f4a9b8',
    HOOK_DEPLOYER: '0xb2785f4341b5bf26be07f7e2037550769ce830cd',
    COMPLIANT_LP_HOOK: '0x3738d60fcb27d719fdd5113b855e1158b93a95b1',
    POOL_REGISTRY: '0x7ffbee85cb513753fe6ca4f476c7206ad1b3fbff',
    PRICE_FEED_MANAGER: '0xd7cf4aba5b9b4877419ab8af3979da637493afb1',
    CONTRACT_SIGNER: '0x99e9880a08e14112a18c091bd49a2b1713133687',
    REPUTATION_MANAGER: '0xe4a58592171cd0770e6792600ea3098060a42d46',
    VAULT_FACTORY: '0xf54e26527bec4847f66afb5166a7a5c3d1fd6304',
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    ECOP: '0x19ac2612e560b2bbedf88660a2566ef53c0a15a1',
    POOL_MANAGER: '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },
  // Unichain Sepolia - Version 2.2
  1301: {
    CHAIN_ID: 1301,
    CHAIN_NAME: 'Unichain Sepolia',
    CONVEXO_LPS: '0x6ba429488cad3795af1ec65d80be760b70f58e4b',
    CONVEXO_VAULTS: '0x64fd5631ffe78e907da7b48542abfb402680891a',
    HOOK_DEPLOYER: '0x1917aac9c182454b3ab80aa8703734d2831adf08',
    COMPLIANT_LP_HOOK: '0x3933f0018fc7d21756b86557640d66b97f514bae',
    POOL_REGISTRY: '0x9fee07c87bcc09b07f76c728cce56e6c8fdffb02',
    PRICE_FEED_MANAGER: '0x8b346a47413991077f6ad38bfa4bfd3693187e6e',
    CONTRACT_SIGNER: '0x834dbab5c4bf2f9f2c80c9d7513ff986d3a835c8',
    REPUTATION_MANAGER: '0x7c22db98a3f8da11f8c79d60a78d12df4a18516b',
    VAULT_FACTORY: '0x5e252bb1642cfa13d4ad93cdfdbabcb9c64ac841',
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
