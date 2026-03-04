import { createConfig, injected } from 'wagmi';
import { base, mainnet } from 'wagmi/chains';
import { defineChain } from 'viem';
import { http } from 'wagmi';

// Define Unichain Mainnet (reads only — no smart wallet support)
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

// Prefer Alchemy RPC for Base and Ethereum — same key used by Account Kit,
// more reliable for balance reads than Infura (no rate-limit surprises).
const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const baseRpc = alchemyKey
  ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`
  : (process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL || 'https://mainnet.base.org');
const ethRpc = alchemyKey
  ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`
  : (process.env.NEXT_PUBLIC_ETHEREUM_MAINNET_RPC_URL || 'https://cloudflare-eth.com');

export const config = createConfig({
  chains: [base, mainnet, unichainMainnet],
  connectors: [injected()],  // enables MetaMask and other browser-injected wallets
  transports: {
    [base.id]: http(baseRpc),
    [mainnet.id]: http(ethRpc),
    [unichainMainnet.id]: http(process.env.NEXT_PUBLIC_UNICHAIN_MAINNET_RPC_URL),
  },
  ssr: true,
});
