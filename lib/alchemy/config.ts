import { createConfig, type AlchemyAccountsUIConfig, cookieStorage } from '@account-kit/react';
import { alchemy, base, baseSepolia, mainnet } from '@account-kit/infra';
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
// Mainnet: Base (8453), Testnet: Base Sepolia (84532)
const primaryChain = IS_MAINNET ? base : baseSepolia;

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
        chain: baseSepolia,
        // No gas sponsorship on testnet (policyId omitted)
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
