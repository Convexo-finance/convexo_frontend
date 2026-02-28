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
    addPasskeyOnSignup: false,
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
        policyId: process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID,
      },
      {
        chain: mainnet,
        policyId: process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID,
      },
    ],
    policyId: process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID,
    ssr: true,
    storage: cookieStorage,
    enablePopupOauth: true,
    // These connectors are registered in Account Kit's internal wagmi instance.
    // metaMask() + coinbaseWallet() → show as named buttons in the modal.
    // injected() → auto-detects any EIP-6963 wallet (Rabby, Phantom, etc.)
    //   so they appear in "More wallets" even if not explicitly listed.
    connectors: [
      metaMask(),
      coinbaseWallet({ appName: 'Convexo' }),
      injected(),
    ],
  },
  uiConfig,
);
