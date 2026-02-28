import { createConfig, type AlchemyAccountsUIConfig } from '@account-kit/react';
import { alchemy, base, mainnet } from '@account-kit/infra';

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
          wallets: ['wallet_connect', 'coinbase wallet'],
          chainType: ['evm'],
          numFeaturedWallets: 2,
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
    enablePopupOauth: true,
  },
  uiConfig,
);
