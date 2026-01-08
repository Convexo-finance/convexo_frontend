# 🎨 Frontend Integration Guide

Complete guide for integrating Convexo Protocol smart contracts into your frontend application.

**Version**: 2.2  
**Framework**: React + Viem + Wagmi + RainbowKit  
**Last Updated**: January 2026

---

## 📋 Table of Contents

1. [Quick Setup](#quick-setup)
2. [Contract Configuration](#contract-configuration)
3. [NFT & Reputation System](#nft--reputation-system)
4. [User Authentication Flow](#user-authentication-flow)
5. [Vault Operations](#vault-operations)
6. [Treasury Operations](#treasury-operations)
7. [React Hooks](#react-hooks)
8. [Complete Examples](#complete-examples)

---

## ⚡ Quick Setup

### Install Dependencies

```bash
npm install viem wagmi @rainbow-me/rainbowkit @tanstack/react-query
```

### Configure Chains

```typescript
// config/wagmi.ts
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, base, baseSepolia } from 'wagmi/chains';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { 
  rainbowWallet, 
  walletConnectWallet,
  metaMaskWallet,
  coinbaseWallet 
} from '@rainbow-me/rainbowkit/wallets';

// Define Unichain
const unichain = {
  id: 130,
  name: 'Unichain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.unichain.org'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://unichain.blockscout.com' },
  },
};

const unichainSepolia = {
  id: 1301,
  name: 'Unichain Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia.unichain.org'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://unichain-sepolia.blockscout.com' },
  },
  testnet: true,
};

export const config = createConfig({
  chains: [mainnet, base, unichain, sepolia, baseSepolia, unichainSepolia],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [unichain.id]: http(),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [unichainSepolia.id]: http(),
  },
});
```

---

## 📍 Contract Configuration

### Contract Addresses

```typescript
// config/contracts.ts
export const CONTRACTS = {
  // Ethereum Sepolia (11155111)
  ETHEREUM_SEPOLIA: {
    CHAIN_ID: 11155111,
    CONVEXO_PASSPORT: '0x04b26cac4419132c010ea339316dba3baa638acc',
    LP_INDIVIDUALS: '0x484c05645ebacc71f1adde1cfd6a052f6fad29ed',
    LP_BUSINESS: '0x10fc2c87e6b673849bbc8833ed6f9343494225a3',
    ECREDITSCORING: '0xe45cad4eb3c9b49c5bac985f043d635627becceb',
    REPUTATION_MANAGER: '0xe618c18dc57a431a5826abf5fe4329b4422f9eb0',
    VAULT_FACTORY: '0x7a88b6f5039f86d827fb098aa83eacca7345a182',
    TREASURY_FACTORY: '0xa1117a2df674b896b57cacd3ca0c77a667e6ab6e',
    CONTRACT_SIGNER: '0x54b9675e649765e401632db548ee2f09f83e359c',
    VERIFF_VERIFIER: '0x1cbf87e0410338e0ea6bfcd21f66584e92d168bb',
    SUMSUB_VERIFIER: '0xe9c905ebf5e1bb970a2571d6112eb1d37f550ca8',
    COMPLIANT_LP_HOOK: '0xb1697c34cc15cb1fba579f94693e9ab53292b51b',
    POOL_REGISTRY: '0x4b99d117b1d058ab7efda061560f035e0280b355',
    PRICE_FEED_MANAGER: '0xf3e60a65f93720e2b863a7182208a93cb23a3af8',
    HOOK_DEPLOYER: '0x0c34b1c9cdd55f62cdbe070af46b57c33527d80b',
    PASSPORT_GATED_HOOK: '0xe43c57a4be9578b8f8be98608135bb6ff7e7941a',
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  },

  // Base Sepolia (84532)
  BASE_SEPOLIA: {
    CHAIN_ID: 84532,
    CONVEXO_PASSPORT: '0x6a7fa6e40315b54f22555d892569b1f310a500e3',
    LP_INDIVIDUALS: '0xdfd8aeec2594faf1f2ad9b86893b22f32f1be2bb',
    LP_BUSINESS: '0xf017d61001441139d9e48e8558479d347a1689a7',
    ECREDITSCORING: '0x83b1707ca91f0888ea7401cab66e4eb6a045eec2',
    REPUTATION_MANAGER: '0x023a4bd2805b5af96db90aa42150f800dd5c4717',
    VAULT_FACTORY: '0x60aedc85a107edb27f075c40c18494c44427456f',
    TREASURY_FACTORY: '0x9d956ceb48c1c5ce07fe9aee2574b81fbf92e16c',
    CONTRACT_SIGNER: '0x40d2f2830fb94f055ef4f57b1f6318659033ee8d',
    VERIFF_VERIFIER: '0x2a4a50c324a12881c732d7bb23fce472195994a7',
    SUMSUB_VERIFIER: '0x3b47b35f65086309861f293448f579df4f2ae727',
    COMPLIANT_LP_HOOK: '0x058faa5e95b3deb41e6ecabe4dd870b8e3d90475',
    POOL_REGISTRY: '0x426d9dfb361d5374c114116778b3c225944aec32',
    PRICE_FEED_MANAGER: '0xf186dadf2a9366101009b87b08fc168874b758d6',
    HOOK_DEPLOYER: '0x3609c081d5558e4ec5d3a848ffc738a7c3d21cd5',
    PASSPORT_GATED_HOOK: '0xd3c603e95f06d2e9f398caa198f44477f78b28fd',
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  },

  // Unichain Sepolia (1301)
  UNICHAIN_SEPOLIA: {
    CHAIN_ID: 1301,
    CONVEXO_PASSPORT: '0xe48f35fd0e00af2059f18cf67268cce6e87f4ea4',
    LP_INDIVIDUALS: '0x8f63093ded306d36002213af027e597210b6bb21',
    LP_BUSINESS: '0x1115fc70b349ec8d3912fedac903ff27527bbb30',
    ECREDITSCORING: '0x35f82e74ef83c94d11474e1a6f69361f4e961117',
    REPUTATION_MANAGER: '0x4230cdf3e203fb65e5f8462d36b3e8627dd1486d',
    VAULT_FACTORY: '0x12b632d56ec9ae105ace77ac37b5ffadf9e049a8',
    TREASURY_FACTORY: '0x6542604acd10edfee43836d545ceea3cc6320b3c',
    CONTRACT_SIGNER: '0x9ea14625f8b596c0b7361a861642035bb7f8b422',
    VERIFF_VERIFIER: '0x29da93ef19643d51dc27c78af271f4ee2394938f',
    SUMSUB_VERIFIER: '0x6d2101b853e80ea873d2c7c0ec6138c837779c6a',
    COMPLIANT_LP_HOOK: '0x50ace0dce54df668477adee4e9d6a6c0df4fedee',
    POOL_REGISTRY: '0xf7e960e07cc225c33e383d5219af5a57555a4fce',
    PRICE_FEED_MANAGER: '0x318415c639fb2687d55da236f097a146dbcf5366',
    HOOK_DEPLOYER: '0xf8093cb4d499790e4cb87dce82b2b0a924610775',
    PASSPORT_GATED_HOOK: '0xee93435e75f18468e518ee5bc9e5b3b99197d31f',
    USDC: '0x31d0220469e10c4E71834a79b1f276d740d3768F',
  },

  // Base Mainnet (8453)
  BASE_MAINNET: {
    CHAIN_ID: 8453,
    CONVEXO_PASSPORT: '0xecde45fefb5c2ef6e5cc615291de9be9a99b46a6',
    LP_INDIVIDUALS: '0xe99a49bd81bbe61cdf7f6b7d247f76cacc2e5776',
    LP_BUSINESS: '0x83df102f62c4640ac8be584c2b4e20c8c373dc2e',
    ECREDITSCORING: '0x60afa63fdf17a75534e8218baac1d64e7fd93b4a',
    REPUTATION_MANAGER: '0x6a9af3b1da3fc07c78c37c380368773b1e830fac',
    VAULT_FACTORY: '0xda82a962e5671cfa97663e25495028c313a524e8',
    TREASURY_FACTORY: '0x7fcc3c235cbd5bd6059e4744c3a005c68a2d4da4',
    CONTRACT_SIGNER: '0x19d9fc7c6c3e62c1c7358504f47e629333b10627',
    VERIFF_VERIFIER: '0x43d5c9507f399e689ddf4c05ba542a3ad5dbe53e',
    SUMSUB_VERIFIER: '0x549858f0f85ecce1f9713dc3ba5b61c7f9cca69d',
    COMPLIANT_LP_HOOK: '0x805b733cc50818dabede4847c4a775a7b1610f96',
    POOL_REGISTRY: '0x2f781b3fffd6853a3d8ffca338d33b1d61ffab0e',
    PRICE_FEED_MANAGER: '0xefa4e787c96df9df08de5230ec6cf6126a211edc',
    HOOK_DEPLOYER: '0xe6b658c4d1e00a675df046ca0baeb86bef7da985',
    PASSPORT_GATED_HOOK: '0x8c2d66210a43201bae2a7bf924eca0f53364967f',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },

  // Unichain Mainnet (130)
  UNICHAIN_MAINNET: {
    CHAIN_ID: 130,
    CONVEXO_PASSPORT: '0xe99a49bd81bbe61cdf7f6b7d247f76cacc2e5776',
    LP_INDIVIDUALS: '0x83df102f62c4640ac8be584c2b4e20c8c373dc2e',
    LP_BUSINESS: '0x60afa63fdf17a75534e8218baac1d64e7fd93b4a',
    ECREDITSCORING: '0x6a9af3b1da3fc07c78c37c380368773b1e830fac',
    REPUTATION_MANAGER: '0xe6b658c4d1e00a675df046ca0baeb86bef7da985',
    VAULT_FACTORY: '0x7fcc3c235cbd5bd6059e4744c3a005c68a2d4da4',
    TREASURY_FACTORY: '0x43d5c9507f399e689ddf4c05ba542a3ad5dbe53e',
    CONTRACT_SIGNER: '0xda82a962e5671cfa97663e25495028c313a524e8',
    VERIFF_VERIFIER: '0x549858f0f85ecce1f9713dc3ba5b61c7f9cca69d',
    SUMSUB_VERIFIER: '0xd34de952cec3af29abab321e68d7e51c098dc063',
    COMPLIANT_LP_HOOK: '0x2a0d9da5a72dfe20b65b25e9fefc0e6e090ac194',
    POOL_REGISTRY: '0xefa4e787c96df9df08de5230ec6cf6126a211edc',
    PRICE_FEED_MANAGER: '0x19d9fc7c6c3e62c1c7358504f47e629333b10627',
    HOOK_DEPLOYER: '0x8c2d66210a43201bae2a7bf924eca0f53364967f',
    PASSPORT_GATED_HOOK: '0x2f781b3fffd6853a3d8ffca338d33b1d61ffab0e',
    USDC: '0x078D782b760474a361dDA0AF3839290b0EF57AD6',
  },

  // Ethereum Mainnet (1)
  ETHEREUM_MAINNET: {
    CHAIN_ID: 1,
    CONVEXO_PASSPORT: '0x6b51adc34a503b23db99444048ac7c2dc735a12e',
    LP_INDIVIDUALS: '0x5d88bcf0d62f17846d41e161e92e497d4224764d',
    LP_BUSINESS: '0x6a6357c387331e75d6eeb4d4abc0f0200cd32830',
    ECREDITSCORING: '0xafb16cfaf1389713c59f7aee3c1a08d3cedc3ee3',
    REPUTATION_MANAGER: '0xc5e04ab886025b3fe3d99249d1db069e0b599d8e',
    VAULT_FACTORY: '0xdd973ce09ba55260e217d10f9dec6d7945d73e79',
    TREASURY_FACTORY: '0x24d91b11b0dd12d6520e58c72f8fcc9dc1c5b935',
    CONTRACT_SIGNER: '0xe0c0d95701558ef10768a13a944f56311ead4649',
    VERIFF_VERIFIER: '0x3770bb3bbeb0102a36f51aa253e69034058e4f84',
    SUMSUB_VERIFIER: '0x2fa95f79ce8c5c01581f6792acc4181282aaefb0',
    COMPLIANT_LP_HOOK: '0x6a6357c387331e75d6eeb4d4abc0f0200cd32830',
    POOL_REGISTRY: '0xbabee8acecc117c1295f8950f51db59f7a881646',
    PRICE_FEED_MANAGER: '0xd189d95ee1a126a66fc5a84934372aa0fc0bb6d2',
    HOOK_DEPLOYER: '0xd09e7252c6402155f9d13653de24ae4f0a220fec',
    PASSPORT_GATED_HOOK: '0x74577d6e9140944db7ae2f1e103a39962c80c235',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  },
} as const;

// Helper to get contracts for current chain
export function getContracts(chainId: number) {
  switch (chainId) {
    case 1: return CONTRACTS.ETHEREUM_MAINNET;
    case 11155111: return CONTRACTS.ETHEREUM_SEPOLIA;
    case 8453: return CONTRACTS.BASE_MAINNET;
    case 84532: return CONTRACTS.BASE_SEPOLIA;
    case 130: return CONTRACTS.UNICHAIN_MAINNET;
    case 1301: return CONTRACTS.UNICHAIN_SEPOLIA;
    default: return CONTRACTS.BASE_SEPOLIA;
  }
}
```

### Import ABIs

```typescript
// config/abis.ts
import ConvexoPassportABI from '../abis/Convexo_Passport.json';
import ReputationManagerABI from '../abis/ReputationManager.json';
import TokenizedBondVaultABI from '../abis/TokenizedBondVault.json';
import VaultFactoryABI from '../abis/VaultFactory.json';
import TreasuryFactoryABI from '../abis/TreasuryFactory.json';
import ContractSignerABI from '../abis/ContractSigner.json';
import VeriffVerifierABI from '../abis/VeriffVerifier.json';
import ERC20ABI from '../abis/ERC20.json';

export {
  ConvexoPassportABI,
  ReputationManagerABI,
  TokenizedBondVaultABI,
  VaultFactoryABI,
  TreasuryFactoryABI,
  ContractSignerABI,
  VeriffVerifierABI,
  ERC20ABI,
};
```
 with IPFS Metadata

### NFT Types & IPFS Images

Each NFT is minted with unique metadata stored on IPFS, with images displayed across the frontend:

| NFT Type | Tier | Purpose | Traits | IPFS Metadata |
|----------|------|---------|--------|---------------|
| **Convexo Passport** | Tier 1 | Individual investor verification | Verification Date | ✅ Profile Image |
| **LP Individuals** | Tier 2 | Limited Partner (Individual) | LP Status, Joined Date | ✅ Member Badge |
| **LP Business** | Tier 2 | Limited Partner (Business) | Business Type, Joined Date | ✅ Business Badge |
| **Ecreditscoring** | Tier 3 | Vault Creator with credit data  | Enable swaps on Uniswap V4
  LimitedPartner = 2, // LP_Individuals OR LP_Business - LP access | Monetization + OTC Trade
**Key Features:**
- All NFTs have IPFS-hosted metadata with unique images
- Credit Score NFT has editable traits for dynamic updates
- Images are automatically displayed in the frontend UI
- Traits update on-chain without re-minting
---

## 🎫 NFT & Reputation System

### Understanding the Tier System

```typescript
// types/reputation.ts
export enum ReputationTier {
  None = 0,           // No NFTs - No access
  Passport = 1,       // Convexo_Passport - ZKPassport verified
  LimitedPartner = 2, // LP_Individuals OR LP_Business - Full LP access
  VaultCreator = 3,   // Ecreditscoring - Can create vaults
}

export interface UserReputation {
  tier: ReputationTier;
  tierName: string;
  passportBalance: bigint;
  lpIndividualsBalance: bigint;
  lpBusinessBalance: bigint;
  ecreditscoringBalance: bigint;
  // Access permissions
  canAccessLPPools: boolean;
  canCreateTreasury: boolean;
  

export const TIER_FEATURES: Record<ReputationTier, string[]> = {
  [ReputationTier.None]: [],
  [ReputationTier.Passport]: [
    '🛂 Treasury creation',
    '💰 Vault investments',
    '🔄 Uniswap V4 swaps (via PassportGatedHook)',
  ],
  [ReputationTier.LimitedPartner]: [
    '🛂 Treasury creation',
    '💰 Vault investments',
    '💸 Monetization access',
    '🔀 OTC Trades',
  ],
  [ReputationTier.VaultCreator]: [
    '🛂 Treasury creation',
    '💰 Vault investments',
    '💸 Monetization access',
    '🔀 OTC Trades',
    '🏗️ Vault creation',
  ],
};canInvestInVaults: boolean;
  canRequestCreditScore: boolean;
  canCreateVaults: boolean;
}

export const TIER_NAMES: Record<ReputationTier, string> = {
  [ReputationTier.None]: 'Unverified',
  [ReputationTier.Passport]: 'Passport Holder',
  [ReputationTier.LimitedPartner]: 'Limited Partner',
  [ReputationTier.VaultCreator]: 'Vault Creator',
};

export const TIER_COLORS: Record<ReputationTier, string> = {
  [ReputationTier.None]: 'gray',
  [ReputationTier.Passport]: 'blue',
  [ReputationTier.LimitedPartner]: 'purple',
  [ReputationTier.VaultCreator]: 'gold',
};
```

### useUserReputation Hook

```typescript
// hooks/useUserReputation.ts
import { useReadContracts } from 'wagmi';
import { getContracts } from '../config/contracts';
import { ReputationManagerABI } from '../config/abis';
import { ReputationTier, UserReputation, TIER_NAMES } from '../types/reputation';

export function useUserReputation(address: `0x${string}` | undefined, chainId: number) {
  const contracts = getContracts(chainId);

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: address ? [
      {
        address: contracts.REPUTATION_MANAGER as `0x${string}`,
        abi: ReputationManagerABI,
        functionName: 'getReputationDetails',
        args: [address],
      },
      {
        address: contracts.REPUTATION_MANAGER as `0x${string}`,
        abi: ReputationManagerABI,
        functionName: 'canAccessLPPools',
        args: [address],
      },
      {
        address: contracts.REPUTATION_MANAGER as `0x${string}`,
        abi: ReputationManagerABI,
        functionName: 'canCreateTreasury',
        args: [address],
      },
      {
        address: contracts.REPUTATION_MANAGER as `0x${string}`,
        abi: ReputationManagerABI,
        functionName: 'canInvestInVaults',
        args: [address],
      },
      {
        address: contracts.REPUTATION_MANAGER as `0x${string}`,
        abi: ReputationManagerABI,
        functionName: 'canRequestCreditScore',
        args: [address],
      },
      {
        address: contracts.REPUTATION_MANAGER as `0x${string}`,
        abi: ReputationManagerABI,
        functionName: 'canCreateVaults',
        args: [address],
      },
    ] : [],
  });

  const reputation: UserReputation | null = data ? {
    tier: Number(data[0].result?.[0]) as ReputationTier,
    tierName: TIER_NAMES[Number(data[0].result?.[0]) as ReputationTier],
    passportBalance: data[0].result?.[1] ?? 0n,
    lpIndividualsBalance: data[0].result?.[2] ?? 0n,
    lpBusinessBalance: data[0].result?.[3] ?? 0n,
    ecreditscoringBalance: data[0].result?.[4] ?? 0n,
    canAccessLPPools: data[1].result ?? false,
    canCreateTreasury: data[2].result ?? false,
    canInvestInVaults: data[3].result ?? false,
    canRequestCreditScore: data[4].result ?? false,
    canCreateVaults: data[5].result ?? false,
  } : null;

  return { reputation, isLoading, error, refetch };
}
```

### Reputation Badge Component

```tsx
// components/ReputationBadge.tsx
import { ReputationTier, TIER_NAMES, TIER_COLORS } from '../types/reputation';

interface ReputationBadgeProps {
  tier: ReputationTier;
  size?: 'sm' | 'md' | 'lg';
}

const TIER_ICONS: Record<ReputationTier, string> = {
  [ReputationTier.None]: '⚪',
  [ReputationTier.Passport]: '🛂',
  [ReputationTier.LimitedPartner]: '💼',
  [ReputationTier.VaultCreator]: '🏆',
};

export function ReputationBadge({ tier, size = 'md' }: ReputationBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span 
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]}`}
      style={{ 
        backgroundColor: `${TIER_COLORS[tier]}20`,
        color: TIER_COLORS[tier],
        border: `1px solid ${TIER_COLORS[tier]}40`
      }}
    >
      <span>{TIER_ICONS[tier]}</span>
      <span>{TIER_NAMES[tier]}</span>
    </span>
  );
}
```

### Access Matrix Component

```tsx
// components/AccessMatrix.tsx
import { UserReputation } from '../types/reputation';

interface AccessMatrixProps {
  reputation: UserReputation;
}

export function AccessMatrix({ reputation }: AccessMatrixProps) {
  const accessItems = [
    { label: 'LP Pools', hasAccess: reputation.canAccessLPPools },
    { label: 'Create Treasury', hasAccess: reputation.canCreateTreasury },
    { label: 'Invest in Vaults', hasAccess: reputation.canInvestInVaults },
    { label: 'Request Credit Score', hasAccess: reputation.canRequestCreditScore },
    { label: 'Create Vaults', hasAccess: reputation.canCreateVaults },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {accessItems.map((item) => (
        <div 
          key={item.label}
          className={`p-3 rounded-lg border ${
            item.hasAccess 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={item.hasAccess ? 'text-green-500' : 'text-gray-400'}>
              {item.hasAccess ? '✅' : '❌'}
            </span>
            <span className=" - Tier 1 with IPFS Metadata

```typescript
// hooks/useMintPassport.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { keccak256, toBytes } from 'viem';
import { ConvexoPassportABI } from '../config/abis';
import { getContracts } from '../config/contracts';

export interface PassportMetadata {
  name: string;
  description: string;
  image: string; // IPFS image URL (ipfs://QmHash)
  attributes: {
    trait_type: string;
    value: string;
  }[];
}

export function useMintPassport(chainId: number) {
  const contracts = getContracts(chainId);
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const mintWithIdentifier = async (uniqueIdentifier: `0x${string}`, ipfsMetadataUri: string) => {
    await writeContract({
      address: contracts.CONVEXO_PASSPORT as `0x${string}`,
      abi: ConvexoPassportABI,
      functionName: 'safeMintWithIdentifier',
      args: [uniqueIdentifier, ipfsMetadataUri],
    });
  };

  // Helper to generate identifier from ZKPassport data
  const generateIdentifier = (publicKey: string, scope: string): `0x${string}` => {
    const combined = publicKey + scope.replace('0x', '');
    return keccak256(toBytes(combined));
  };

  // Helper to create IPFS metadata for Passport
  const createPassportMetadata = (address: string, verificationDate: string): PassportMetadata => ({
    name: `Convexo Passport #${address.slice(-6).toUpperCase()}`,
    description: 'Verified individual investor on Convexo Protocol. Enables treasury creation, vault investments, and Uniswap V4 swaps.',
    image: 'ipfs://YOUR_IPFS_IMAGE_HASH', // Upload to IPFS and replace
    attributes: [
      { trait_type: 'Tier', value: '1 - Passport' },
      { trait_type: 'Verification Date', value: verificationDate },
      { trait_type: 'Status', value: 'Active' },
    ],
  });

  return {
    mintWithIdentifier,
    generateIdentifier,
    createPassportMetadataor (Tier 3)                                           │
│  ═══════════════════════════════                                          │
│  LP NFT + AI Credit Score ──▶ mint() ──▶ Ecreditscoring NFT               │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Passport Minting (Path 1)

```typescript
// hooks/useMintPassport.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { keccak256, toBytes } from 'viem';
import { ConvexoPassportABI } from '../config/abis';
import { getContracts } from '../config/contracts';

export function useMintPassport(chainId: number) {
  const contracts = getContracts(chainId);
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const mintWithIdentifier = async (uniqueIdentifier: `0x${string}`) => {
    await writeContract({
      address: contracts.CONVEXO_PASSPORT as `0x${string}`,
      abi: ConvexoPassportABI,
      functionName: 'safeMintWithIdentifier',
      args: [uniqueIdentifier],
    });
  };

  // Helper to generate identifier from ZKPassport data
  const generateIdentifier = (publicKey: string, scope: string): `0x${string}` => {
    const combined = publicKey + scope.replace('0x', '');
    return keccak256(toBytes(combined));
  };

  return {
    mintWithIdentifier,
    generateIdentifier,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
```

### Passport Minting Component

```tsx
// components/MintPassport.tsx
import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useMintPassport } from '../hooks/useMintPassport';

export function MintPassport() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { mintWithIdentifier, generateIdentifier, isPending, isConfirming, isSuccess, error } = useMintPassport(chainId);
  
  const [zkPassportData, setZkPassportData] = useState<{
    publicKey: string;
    scope: string;
  } | null>(null);

  const handleMint = async () => {
    if (!zkPassportData) return;
    
    const identifier = generateIdentifier(zkPassportData.publicKey, zkPassportData.scope);
    await mintWithIdentifier(identifier);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">🛂 Get Your Convexo Passport</h2>
      
      <div className="space-y-4">
        {/* Step 1: ZKPassport Verification */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Step 1: Verify with ZKPassport</h3>
          <p className="text-sm text-gray-600 mb-3">
            Complete identity verification using your passport or ID card.
          </p>
          <button
            onClick={() => {
              // Trigger ZKPassport flow
              // On success, set zkPassportData
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start Verification
          </button>
        </div>

        {/* Step 2: Mint NFT */}
        {zkPassportData && (
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold mb-2">Step 2: Mint Your Passport NFT</h3>
            <p className="text-sm text-gray-600 mb-3">
              ✅ Verification complete! Now mint your soulbound Passport NFT.
            </p>
            <button
              onClick={handleMint}
              disabled={isPending || isConfirming}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isPending ? 'Confirming...' : isConfirming ? 'Minting...' : 'Mint Passport NFT'}
            </button>
          </div>
        )}

        {/* Success */}
        {isSuccess && (
          <div className="p-4 bg-emerald-100 rounded-lg text-emerald-800">
            🎉 Passport NFT minted successfully! You now have Tier 1 access.
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-100 rounded-lg text-red-800">
            ❌ Error: {error.message}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🏦 Vault Operations

### Vault Types

```typescript
// types/vault.ts
export enum VaultState {
  Pending = 0,    // Accepting investments
  Funded = 1,     // Fully funded
  Active = 2,     // Contract signed
  Repaying = 3,   // Making repayments
  Completed = 4,  // All done
  Defaulted = 5,  // Failed
}

export interface VaultInfo {
  vaultId: bigint;
  borrower: `0x${string}`;
  contractHash: `0x${string}`;
  principalAmount: bigint;
  interestRate: bigint;
  protocolFeeRate: bigint;
  maturityDate: bigint;
  state: VaultState;
  totalRaised: bigint;
  totalRepaid: bigint;
  createdAt: bigint;
  fundedAt: bigint;
  contractAttachedAt: bigint;
  fundsWithdrawnAt: bigint;
}

export interface VaultMetrics {
  totalShares: bigint;
  sharePrice: bigint;
  totalValueLocked: bigint;
  targetAmount: bigint;
  fundingProgress: bigint;
  currentAPY: bigint;
}

export interface InvestorReturn {
  invested: bigint;
  currentValue: bigint;
  profit: bigint;
  apy: bigint;
}
```

### useVaultData Hook

```typescript
// hooks/useVaultData.ts
import { useReadContracts } from 'wagmi';
import { TokenizedBondVaultABI } from '../config/abis';
import { VaultInfo, VaultMetrics, VaultState } from '../types/vault';

export function useVaultData(vaultAddress: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      {
        address: vaultAddress,
        abi: TokenizedBondVaultABI,
        functionName: 'vaultInfo',
      },
      {
        address: vaultAddress,
        abi: TokenizedBondVaultABI,
        functionName: 'getVaultMetrics',
      },
    ],
  });

  const vaultInfo: VaultInfo | null = data?.[0]?.result ? {
    vaultId: data[0].result[0],
    borrower: data[0].result[1],
    contractHash: data[0].result[2],
    principalAmount: data[0].result[3],
    interestRate: data[0].result[4],
    protocolFeeRate: data[0].result[5],
    maturityDate: data[0].result[6],
    state: Number(data[0].result[7]) as VaultState,
    totalRaised: data[0].result[8],
    totalRepaid: data[0].result[9],
    createdAt: data[0].result[10],
    fundedAt: data[0].result[11],
    contractAttachedAt: data[0].result[12],
    fundsWithdrawnAt: data[0].result[13],
  } : null;

  const metrics: VaultMetrics | null = data?.[1]?.result ? {
    totalShares: data[1].result[0],
    sharePrice: data[1].result[1],
    totalValueLocked: data[1].result[2],
    targetAmount: data[1].result[3],
    fundingProgress: data[1].result[4],
    currentAPY: data[1].result[5],
  } : null;

  return { vaultInfo, metrics, isLoading, error, refetch };
}
```

### Create Vault (Tier 3 Only)

```typescript
// hooks/useCreateVault.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { VaultFactoryABI } from '../config/abis';
import { getContracts } from '../config/contracts';

interface CreateVaultParams {
  principalAmount: string;      // USDC amount (e.g., "10000")
  interestRate: number;         // Basis points (1200 = 12%)
  protocolFeeRate: number;      // Basis points (200 = 2%)
  maturityDays: number;         // Days until maturity
  name: string;
  symbol: string;
}

export function useCreateVault(chainId: number) {
  const contracts = getContracts(chainId);
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

  const createVault = async (params: CreateVaultParams) => {
    const principalAmount = parseUnits(params.principalAmount, 6); // USDC has 6 decimals
    const maturityDate = BigInt(Math.floor(Date.now() / 1000) + params.maturityDays * 24 * 60 * 60);

    await writeContract({
      address: contracts.VAULT_FACTORY as `0x${string}`,
      abi: VaultFactoryABI,
      functionName: 'createVault',
      args: [
        principalAmount,
        BigInt(params.interestRate),
        BigInt(params.protocolFeeRate),
        maturityDate,
        params.name,
        params.symbol,
      ],
    });
  };

  return {
    createVault,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    receipt,
    error,
  };
}
```

### Invest in Vault (Tier 1+)

```typescript
// hooks/useInvestInVault.ts
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, maxUint256 } from 'viem';
import { TokenizedBondVaultABI, ERC20ABI } from '../config/abis';
import { getContracts } from '../config/contracts';

export function useInvestInVault(vaultAddress: `0x${string}`, chainId: number) {
  const contracts = getContracts(chainId);
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: contracts.USDC as `0x${string}`,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: [vaultAddress],
  });

  const approve = async (amount: string) => {
    await writeContract({
      address: contracts.USDC as `0x${string}`,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [vaultAddress, parseUnits(amount, 6)],
    });
  };

  const invest = async (amount: string) => {
    const amountWei = parseUnits(amount, 6);
    
    await writeContract({
      address: vaultAddress,
      abi: TokenizedBondVaultABI,
      functionName: 'purchaseShares',
      args: [amountWei],
    });
  };

  return {
    approve,
    invest,
    allowance,
    refetchAllowance,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
```

### Vault Investment Card

```tsx
// components/VaultInvestmentCard.tsx
import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { useVaultData } from '../hooks/useVaultData';
import { useInvestInVault } from '../hooks/useInvestInVault';
import { useUserReputation } from '../hooks/useUserReputation';
import { VaultState } from '../types/vault';

interface VaultInvestmentCardProps {
  vaultAddress: `0x${string}`;
}

export function VaultInvestmentCard({ vaultAddress }: VaultInvestmentCardProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { vaultInfo, metrics, isLoading } = useVaultData(vaultAddress);
  const { reputation } = useUserReputation(address, chainId);
  const { approve, invest, isPending, isConfirming, isSuccess } = useInvestInVault(vaultAddress, chainId);
  
  const [amount, setAmount] = useState('');

  if (isLoading || !vaultInfo || !metrics) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded-xl" />;
  }

  const canInvest = reputation?.canInvestInVaults && vaultInfo.state === VaultState.Pending;
  const fundingPercentage = Number(metrics.fundingProgress) / 100;
  const apy = Number(metrics.currentAPY) / 100;

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">Vault #{vaultInfo.vaultId.toString()}</h3>
          <p className="text-sm text-gray-500">
            Borrower: {vaultInfo.borrower.slice(0, 6)}...{vaultInfo.borrower.slice(-4)}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          vaultInfo.state === VaultState.Pending ? 'bg-blue-100 text-blue-800' :
          vaultInfo.state === VaultState.Funded ? 'bg-yellow-100 text-yellow-800' :
          vaultInfo.state === VaultState.Active ? 'bg-green-100 text-green-800' :
          vaultInfo.state === VaultState.Repaying ? 'bg-purple-100 text-purple-800' :
          vaultInfo.state === VaultState.Completed ? 'bg-emerald-100 text-emerald-800' :
          'bg-red-100 text-red-800'
        }`}>
          {VaultState[vaultInfo.state]}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Target Amount</p>
          <p className="text-lg font-bold">
            ${formatUnits(metrics.targetAmount, 6).toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">APY</p>
          <p className="text-lg font-bold text-green-600">{apy}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span>Funding Progress</span>
          <span>{fundingPercentage.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          ${formatUnits(vaultInfo.totalRaised, 6)} / ${formatUnits(metrics.targetAmount, 6)} USDC
        </p>
      </div>

      {/* Investment Form */}
      {canInvest && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Investment Amount (USDC)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => approve(amount)}
              disabled={!amount || isPending || isConfirming}
              className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => invest(amount)}
              disabled={!amount || isPending || isConfirming}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Confirming...' : isConfirming ? 'Investing...' : 'Invest'}
            </button>
          </div>
        </div>
      )}

      {/* Access Denied */}
      {!reputation?.canInvestInVaults && (
        <div className="p-4 bg-amber-50 rounded-lg text-amber-800 text-sm">
          ⚠️ You need at least Tier 1 (Passport) to invest in vaults.
        </div>
      )}

      {/* Success Message */}
      {isSuccess && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg text-green-800">
          ✅ Investment successful! You now own shares in this vault.
        </div>
      )}
    </div>
  );
}
```

---

## 🏛️ Treasury Operations

### Create Treasury (Tier 1+)

```typescript
// hooks/useCreateTreasury.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { TreasuryFactoryABI } from '../config/abis';
import { getContracts } from '../config/contracts';

interface CreateTreasuryParams {
  signers?: `0x${string}`[];  // Empty for single-sig
  signaturesRequired?: number; // 0 for single-sig
}

export function useCreateTreasury(chainId: number) {
  const contracts = getContracts(chainId);
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

  const createTreasury = async (params?: CreateTreasuryParams) => {
    const signers = params?.signers || [];
    const signaturesRequired = params?.signaturesRequired || 0;

    await writeContract({
      address: contracts.TREASURY_FACTORY as `0x${string}`,
      abi: TreasuryFactoryABI,
      functionName: 'createTreasury',
      args: [signers, BigInt(signaturesRequired)],
    });
  };

  return {
    createTreasury,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    receipt,
    error,
  };
}
```

---

## 🪝 React Hooks Summary

| Hook | Purpose | Tier Required |
|------|---------|---------------|
| `useUserReputation` | Get user's tier and permissions | None |
| `useMintPassport` | Mint Convexo_Passport NFT | None |
| `useVaultData` | Read vault information | None |
| `useCreateVault` | Create new vault | Tier 3 |
| `useInvestInVault` | Invest USDC in vault | Tier 1+ |
| `useCreateTreasury` | Create personal treasury | Tier 1+ |
| `useRedeemShares` | Redeem vault shares | Tier 1+ |
| `useContractSigner` | Sign contracts on-chain | Tier 1+ |

---

## 📱 Complete Examples

### Full Dashboard Component

```tsx
// pages/Dashboard.tsx
import { useAccount, useChainId } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useUserReputation } from '../hooks/useUserReputation';
import { ReputationBadge } from '../components/ReputationBadge';
import { AccessMatrix } from '../components/AccessMatrix';
import { MintPassport } from '../components/MintPassport';
import { VaultList } from '../components/VaultList';
import { ReputationTier } from '../types/reputation';

export function Dashboard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { reputation, isLoading } = useUserReputation(address, chainId);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-6">Welcome to Convexo</h1>
          <p className="text-gray-600 mb-8">Connect your wallet to get started</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-500">Welcome back!</p>
          </div>
          <ConnectButton />
        </div>

        {/* Reputation Section */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Status</h2>
            {reputation && <ReputationBadge tier={reputation.tier} size="lg" />}
          </div>
          {reputation && <AccessMatrix reputation={reputation} />}
        </div>

        {/* Get Verified (if no NFTs) */}
        {reputation?.tier === ReputationTier.None && (
          <MintPassport />
        )}

        {/* Vault List (if Tier 1+) */}
        {reputation && reputation.tier >= ReputationTier.Passport && (
          <VaultList />
        )}

        {/* Create Vault Button (if Tier 3) */}
        {reputation?.canCreateVaults && (
          <div className="bg-gradient-to-r from-gold-500 to-amber-600 rounded-xl p-6 text-white">
            <h2 className="text-xl font-bold mb-2">🏆 Vault Creator Access</h2>
            <p className="mb-4">As a verified Vault Creator, you can create new tokenized bond vaults.</p>
            <button className="px-6 py-2 bg-white text-amber-600 rounded-lg font-semibold hover:bg-gray-100">
              Create New Vault
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🔄 Breaking Changes from v2.1

### NFT Contract Renames

| Old Name | New Name | Purpose |
|----------|----------|---------|
| `Convexo_LPs` | `Limited_Partners_Individuals` | Individual LP verification |
| `Convexo_Vaults` | `Limited_Partners_Business` | Business LP verification |
| (new) | `Ecreditscoring` | Credit-scored vault creators |

### ReputationManager Changes

```typescript
// OLD (v2.1)
const tier = await reputationManager.getReputationTier(address);
// 0: None, 1: Passport, 2: LimitedPartner, 3: VaultCreator

// NEW (v2.2) - Same enum values, but different underlying NFTs:
// Tier 2 now requires LP_Individuals OR LP_Business (not old Convexo_LPs)
// Tier 3 now requires Ecreditscoring (not old Convexo_Vaults)
```

### New Functions

```typescript
// Check if user can request credit score (Tier 2 required)
canRequestCreditScore(address user) returns (bool)

// Check specific LP NFT holdings
holdsLPIndividuals(address user) returns (bool)
holdsLPBusiness(address user) returns (bool)
holdsAnyLP(address user) returns (bool)
holdsEcreditscoring(address user) returns (bool)
```

---

## 📚 Additional Resources

- [Contracts Reference](./CONTRACTS_REFERENCE.md)
- [ZKPassport Integration](./ZKPASSPORT_FRONTEND_INTEGRATION.md)
- [Deployment Addresses](./addresses.json)
- [Security Audit](./SECURITY_AUDIT.md)

---

*Last updated: January 2026 - v2.2*
