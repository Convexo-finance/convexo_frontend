'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { AlchemyAccountProvider } from '@account-kit/react';
import { config } from '@/lib/wagmi/config';
import { alchemyConfig } from '@/lib/alchemy/config';
import { NavigationProvider } from '@/lib/contexts/NavigationContext';
import '@account-kit/react/styles.css';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
        refetchOnWindowFocus: false,
        retry: 2,
      },
    },
  }));

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AlchemyAccountProvider config={alchemyConfig} queryClient={queryClient}>
          <NavigationProvider>
            {children}
          </NavigationProvider>
        </AlchemyAccountProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
