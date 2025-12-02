import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia, sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';
import { http } from 'wagmi';

// Define Unichain Sepolia as it's not in the standard chains
export const unichainSepolia = defineChain({
  id: 1301,
  name: 'Unichain Sepolia',
  network: 'unichain-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_UNICHAIN_SEPOLIA_RPC_URL || 'https://unichain-sepolia.infura.io/v3/'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_UNICHAIN_SEPOLIA_RPC_URL || 'https://unichain-sepolia.infura.io/v3/'],
    },
  },
  blockExplorers: {
    default: { name: 'Uniscan', url: 'https://uniscan.uniwhale.io' },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'Convexo Protocol',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: [baseSepolia, sepolia, unichainSepolia],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL),
    [unichainSepolia.id]: http(process.env.NEXT_PUBLIC_UNICHAIN_SEPOLIA_RPC_URL),
  },
  ssr: true,
});

