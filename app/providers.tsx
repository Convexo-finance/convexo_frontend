'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { PrivyProvider, createWalletCreationOnLoginPlugin, type User } from '@privy-io/react-auth';
import { MigrationProvider } from '@privy-io/alchemy-migration';
import { config } from '@/lib/wagmi/config';
import { mainnet, sepolia } from 'viem/chains';
import { PRIVY_APP_ID, PRIVY_CLIENT_ID, migrationAlchemyConfig } from '@/lib/privy/config';
import { NavigationProvider } from '@/lib/contexts/NavigationContext';
import { AuthProvider } from '@/lib/contexts/AuthContext';

const walletCreationPlugin = createWalletCreationOnLoginPlugin({
  shouldCreateWallet: ({ user }: { user: User }) =>
    user.customMetadata?.['alchemy_org_id'] === undefined,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        retry: 2,
      },
    },
  }));

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <PrivyProvider
          appId={PRIVY_APP_ID}
          config={{
            plugins: [walletCreationPlugin],
            defaultChain: sepolia,
            supportedChains: [mainnet, sepolia],
            embeddedWallets: {
              ethereum: { createOnLogin: 'users-without-wallets' },
            },
          }}
        >
          <MigrationProvider
            alchemyConfig={migrationAlchemyConfig}
            privyAppId={PRIVY_APP_ID}
            privyClientId={PRIVY_CLIENT_ID}
          >
            <AuthProvider>
              <NavigationProvider>
                {children}
              </NavigationProvider>
            </AuthProvider>
          </MigrationProvider>
        </PrivyProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
