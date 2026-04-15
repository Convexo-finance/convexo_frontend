import { createConfig, type AlchemyAccountsUIConfig, cookieStorage } from '@account-kit/react';
import { alchemy, base, baseSepolia, sepolia, mainnet } from '@account-kit/infra';
import { IS_MAINNET } from '@/lib/config/network';

const uiConfig: AlchemyAccountsUIConfig = {
  illustrationStyle: 'outline',
  auth: {
    sections: [
      [{ type: 'email' }],
      [
        { type: 'passkey' },
        { type: 'social', authProviderId: 'google', mode: 'popup' },
      ],
    ],
    addPasskeyOnSignup: true,
    header: undefined,
  },
  supportUrl: 'support@convexo.xyz',
};

// Primary chain for Account Kit — follows NEXT_PUBLIC_NETWORK_MODE
// Mainnet: Base (8453), Testnet: Ethereum Sepolia (11155111)
// ETH Sepolia is required because ZKPassport verifier is not deployed on Base Sepolia.
const primaryChain = IS_MAINNET ? base : sepolia;

export const alchemyConfig = createConfig(
  {
    transport: alchemy({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '' }),
    chain: primaryChain,
    chains: [
      {
        chain: base,
        policyId: IS_MAINNET ? (process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID || undefined) : undefined,
      },
      {
        chain: sepolia,
        // Empty string env var must become undefined — Alchemy SDK treats "" differently from undefined
        policyId: process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID_SEPOLIA || undefined,
      },
      {
        chain: baseSepolia,
        // Kept for balance reads on Base Sepolia (wallet page)
      },
      {
        chain: mainnet,
        policyId: IS_MAINNET ? (process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID_ETH || undefined) : undefined,
      },
    ],
    policyId: IS_MAINNET
      ? (process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID || undefined)
      : (process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID_SEPOLIA || undefined),
    ssr: true,
    storage: cookieStorage,
    enablePopupOauth: true,
  },
  uiConfig,
);
