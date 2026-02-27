import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, mainnet } from 'wagmi/chains';
import { defineChain } from 'viem';
import { http } from 'wagmi';

// Define Unichain Mainnet
export const unichainMainnet = defineChain({
  id: 130,
  name: 'Unichain Mainnet',
  network: 'unichain',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_UNICHAIN_MAINNET_RPC_URL || 'https://mainnet.unichain.org'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_UNICHAIN_MAINNET_RPC_URL || 'https://mainnet.unichain.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Uniscan', url: 'https://unichain.blockscout.com' },
  },
  testnet: false,
});

// Fallback project ID for development - replace with your actual WalletConnect Cloud project ID
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

export const config = getDefaultConfig({
  appName: 'Convexo Protocol',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [base, mainnet, unichainMainnet],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL),
    [mainnet.id]: http(process.env.NEXT_PUBLIC_ETHEREUM_MAINNET_RPC_URL),
    [unichainMainnet.id]: http(process.env.NEXT_PUBLIC_UNICHAIN_MAINNET_RPC_URL),
  },
  ssr: true,
});

