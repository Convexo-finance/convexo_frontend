import { createConfig, type AlchemyAccountsUIConfig, cookieStorage } from '@account-kit/react';
import { alchemy, base, mainnet } from '@account-kit/infra';
import { metaMask, coinbaseWallet, injected } from 'wagmi/connectors';

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
          numFeaturedWallets: 1,   // WalletConnect shown up front; rest in "More wallets"
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

export const alchemyConfig = createConfig(
  {
    transport: alchemy({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '' }),
    chain: base,
    chains: [
      {
        chain: base,
        // Gas Manager policy for Base mainnet.
        // Set NEXT_PUBLIC_ALCHEMY_POLICY_ID in .env.
        // Create additional policies per chain at dashboard.alchemy.com/gas-manager
        // and add chain-specific env vars (e.g. NEXT_PUBLIC_ALCHEMY_POLICY_ID_ETH)
        // when ready to sponsor on other networks.
        policyId: process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID,
      },
      {
        chain: mainnet,
        // Gas Manager policy for Ethereum mainnet.
        policyId: process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID_ETH,
      },
    ],
    // Top-level policyId is the Base mainnet default (used when no chain-specific
    // override is present). Matches NEXT_PUBLIC_ALCHEMY_POLICY_ID in .env.
    policyId: process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID,
    ssr: true,
    storage: cookieStorage,
    enablePopupOauth: true,
    // These connectors are registered in Account Kit's internal wagmi instance.
    // metaMask() + coinbaseWallet() → show as named buttons in the modal.
    // injected() → auto-detects any EIP-6963 wallet (Rabby, Phantom, etc.)
    //   so they appear in "More wallets" even if not explicitly listed.
    connectors: [
      metaMask({ enableAnalytics: false }),
      coinbaseWallet({ appName: 'Convexo' }),
      injected(),
    ],
  },
  uiConfig,
);
