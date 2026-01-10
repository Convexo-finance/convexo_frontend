import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia, sepolia, base, mainnet } from 'wagmi/chains';
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
      http: [process.env.NEXT_PUBLIC_UNICHAIN_SEPOLIA_RPC_URL || 'https://sepolia.unichain.org'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_UNICHAIN_SEPOLIA_RPC_URL || 'https://sepolia.unichain.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Uniscan', url: 'https://uniscan.uniwhale.io' },
  },
  testnet: true,
});

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
      http: [process.env.NEXT_PUBLIC_UNICHAIN_MAINNET_RPC_URL || 'https://rpc.unichain.org'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_UNICHAIN_MAINNET_RPC_URL || 'https://rpc.unichain.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Uniscan', url: 'https://unichain-sepolia.blockscout.com/' },
  },
  testnet: false,
});

// Fallback project ID for development - replace with your actual WalletConnect Cloud project ID
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export const config = getDefaultConfig({
  appName: 'Convexo Protocol',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [baseSepolia, sepolia, unichainSepolia, base, mainnet, unichainMainnet],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL),
    [unichainSepolia.id]: http(process.env.NEXT_PUBLIC_UNICHAIN_SEPOLIA_RPC_URL),
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL),
    [mainnet.id]: http(process.env.NEXT_PUBLIC_ETHEREUM_MAINNET_RPC_URL),
    [unichainMainnet.id]: http(process.env.NEXT_PUBLIC_UNICHAIN_MAINNET_RPC_URL),
  },
  ssr: true,
});

