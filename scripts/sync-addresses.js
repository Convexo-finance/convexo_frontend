#!/usr/bin/env node
/**
 * Sync addresses.ts from addresses.json
 * Run: node scripts/sync-addresses.js
 */

const fs = require('fs');
const path = require('path');

const addressesJsonPath = path.join(__dirname, '..', 'addresses.json');
const addressesTsPath = path.join(__dirname, '..', 'lib', 'contracts', 'addresses.ts');

const addressesJson = JSON.parse(fs.readFileSync(addressesJsonPath, 'utf8'));

// Map JSON keys to TS keys
const keyMap = {
  convexo_passport: 'CONVEXO_PASSPORT',
  lp_individuals: 'LP_INDIVIDUALS',
  lp_business: 'LP_BUSINESS',
  ecreditscoring: 'ECREDITSCORING',
  reputation_manager: 'REPUTATION_MANAGER',
  vault_factory: 'VAULT_FACTORY',
  treasury_factory: 'TREASURY_FACTORY',
  contract_signer: 'CONTRACT_SIGNER',
  veriff_verifier: 'VERIFF_VERIFIER',
  sumsub_verifier: 'SUMSUB_VERIFIER',
  hook_deployer: 'HOOK_DEPLOYER',
  passport_gated_hook: 'PASSPORT_GATED_HOOK',
  pool_registry: 'POOL_REGISTRY',
  price_feed_manager: 'PRICE_FEED_MANAGER',
};

const externalKeyMap = {
  usdc: 'USDC',
  pool_manager: 'POOL_MANAGER',
  zkpassport_verifier: 'ZKPASSPORT_VERIFIER',
};

// ECOP addresses (testnet only)
const ECOP_ADDRESSES = {
  '11155111': '0x19ac2612e560b2bbedf88660a2566ef53c0a15a1', // Eth Sepolia
  '84532': '0xb934dcb57fb0673b7bc0fca590c5508f1cde955d',   // Base Sepolia
  '1301': '0xbb0d7c4141ee1fed53db766e1ffcb9c618df8260',    // Unichain Sepolia
  '130': '0x0000000000000000000000000000000000000000',     // Unichain Mainnet
  '8453': '0x0000000000000000000000000000000000000000',    // Base Mainnet
  '1': '0x0000000000000000000000000000000000000000',       // Eth Mainnet
};

function generateChainConfig(chainId, data) {
  const contracts = data.contracts;
  const external = data.external;
  
  // ECOP from hardcoded addresses
  const ecop = ECOP_ADDRESSES[chainId] || '0x0000000000000000000000000000000000000000';
  
  let config = `  // ${data.name} - Chain ID ${chainId}
  ${chainId}: {
    CHAIN_ID: ${chainId},
    CHAIN_NAME: '${data.name}',
    // NFT Contracts - Tier System (${data.version})
    CONVEXO_PASSPORT: '${contracts.convexo_passport.address}',
    LP_INDIVIDUALS: '${contracts.lp_individuals.address}',
    LP_BUSINESS: '${contracts.lp_business.address}',
    ECREDITSCORING: '${contracts.ecreditscoring.address}',
    // Core Protocol
    VAULT_FACTORY: '${contracts.vault_factory.address}',
    TREASURY_FACTORY: '${contracts.treasury_factory.address}',
    REPUTATION_MANAGER: '${contracts.reputation_manager.address}',
    CONTRACT_SIGNER: '${contracts.contract_signer.address}',
    // Verification
    VERIFF_VERIFIER: '${contracts.veriff_verifier.address}',
    SUMSUB_VERIFIER: '${contracts.sumsub_verifier.address}',
    // Hooks & Pools
    PASSPORT_GATED_HOOK: '${contracts.passport_gated_hook.address}',
    HOOK_DEPLOYER: '${contracts.hook_deployer.address}',
    POOL_REGISTRY: '${contracts.pool_registry.address}',
    PRICE_FEED_MANAGER: '${contracts.price_feed_manager.address}',
    // Tokens
    USDC: '${external.usdc}',
    ECOP: '${ecop}',
    // External
    POOL_MANAGER: '${external.pool_manager}',
    ZKPASSPORT_VERIFIER: '${external.zkpassport_verifier}',
    ADMIN_ADDRESS: '0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8',
  },`;
  
  return config;
}

// Generate the full file
const version = addressesJson['130']?.version || 'v3.16';

let output = `// Multi-chain contract addresses configuration - ${version}
// Auto-generated from addresses.json - DO NOT EDIT MANUALLY
// Run: node scripts/sync-addresses.js

export type ChainId = 84532 | 11155111 | 1301 | 8453 | 1 | 130;

export interface ChainContracts {
  CHAIN_ID: ChainId;
  CHAIN_NAME: string;
  CONVEXO_PASSPORT: \`0x\${string}\`;
  LP_INDIVIDUALS: \`0x\${string}\`;
  LP_BUSINESS: \`0x\${string}\`;
  ECREDITSCORING: \`0x\${string}\`;
  REPUTATION_MANAGER: \`0x\${string}\`;
  VAULT_FACTORY: \`0x\${string}\`;
  TREASURY_FACTORY: \`0x\${string}\`;
  CONTRACT_SIGNER: \`0x\${string}\`;
  VERIFF_VERIFIER: \`0x\${string}\`;
  SUMSUB_VERIFIER: \`0x\${string}\`;
  HOOK_DEPLOYER: \`0x\${string}\`;
  PASSPORT_GATED_HOOK: \`0x\${string}\`;
  POOL_REGISTRY: \`0x\${string}\`;
  PRICE_FEED_MANAGER: \`0x\${string}\`;
  USDC: \`0x\${string}\`;
  ECOP: \`0x\${string}\`;
  POOL_MANAGER: \`0x\${string}\`;
  ZKPASSPORT_VERIFIER: \`0x\${string}\`;
  ADMIN_ADDRESS: \`0x\${string}\`;
}

export const CONTRACTS: Record<ChainId, ChainContracts> = {
`;

// Order: Mainnet first, then testnets
const chainOrder = ['130', '8453', '1301', '84532', '11155111'];

for (const chainId of chainOrder) {
  if (addressesJson[chainId]) {
    output += generateChainConfig(chainId, addressesJson[chainId]) + '\n\n';
  }
}

// Add Ethereum Mainnet placeholder if not in JSON
if (!addressesJson['1']) {
  output += `  // Ethereum Mainnet - Chain ID 1 (Placeholder)
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
`;
}

output += `};

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
  return baseUrl ? \`\${baseUrl}/address/\${address}\` : '';
}

export function getTxExplorerLink(chainId: number, txHash: string): string {
  const baseUrl = getBlockExplorerUrl(chainId);
  return baseUrl ? \`\${baseUrl}/tx/\${txHash}\` : '';
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
  return \`https://\${gateway}/ipfs/\${hash}\`;
}

export const SUPPORTED_CHAIN_IDS: ChainId[] = [130, 8453, 1301, 84532, 11155111, 1];
export const TESTNET_CHAIN_IDS: ChainId[] = [1301, 84532, 11155111];
export const MAINNET_CHAIN_IDS: ChainId[] = [130, 8453, 1];
`;

fs.writeFileSync(addressesTsPath, output);
console.log('✅ addresses.ts synced from addresses.json');
console.log(`   Version: ${version}`);
console.log(`   Chains: ${chainOrder.filter(c => addressesJson[c]).join(', ')}`);
