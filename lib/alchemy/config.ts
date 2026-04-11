import { createConfig, type AlchemyAccountsUIConfig, cookieStorage } from '@account-kit/react';
import { alchemy, base, baseSepolia, sepolia, mainnet } from '@account-kit/infra';
import { metaMask, coinbaseWallet } from 'wagmi/connectors';
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
      [
        {
          type: 'external_wallets',
          walletConnect: { projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '' },
          wallets: ['wallet_connect', 'metamask', 'coinbase wallet'],
          chainType: ['evm'],
          numFeaturedWallets: 1,
          hideMoreButton: false,
          moreButtonText: 'More wallets',
        },
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
        // Gas Manager policy for Base mainnet — no gas sponsorship on testnet
        policyId: IS_MAINNET ? process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID : undefined,
      },
      {
        chain: sepolia,
        // No gas sponsorship on testnet (policyId omitted)
      },
      {
        chain: baseSepolia,
        // Kept for balance reads on Base Sepolia (wallet page)
      },
      {
        chain: mainnet,
        policyId: IS_MAINNET ? process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID_ETH : undefined,
      },
    ],
    policyId: IS_MAINNET ? process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID : undefined,
    ssr: true,
    storage: cookieStorage,
    enablePopupOauth: true,
    connectors: [
      metaMask({ enableAnalytics: false }),
      coinbaseWallet({ appName: 'Convexo' }),
    ],
  },
  uiConfig,
);
