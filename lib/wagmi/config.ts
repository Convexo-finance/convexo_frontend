import { createConfig, injected } from 'wagmi';
import { arbitrum, arbitrumSepolia, base, baseSepolia, mainnet, sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';
import { http } from 'wagmi';

// ─── Custom chain definitions ─────────────────────────────────────────────────

export const unichainMainnet = defineChain({
  id: 130,
  name: 'Unichain Mainnet',
  network: 'unichain',
  nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_UNICHAIN_MAINNET_RPC_URL || 'https://mainnet.unichain.org'] },
    public:  { http: [process.env.NEXT_PUBLIC_UNICHAIN_MAINNET_RPC_URL || 'https://mainnet.unichain.org'] },
  },
  blockExplorers: {
    default: { name: 'Uniscan', url: 'https://unichain.blockscout.com' },
  },
  testnet: false,
});

export const unichainSepolia = defineChain({
  id: 1301,
  name: 'Unichain Sepolia',
  network: 'unichain-sepolia',
  nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_UNICHAIN_SEPOLIA_RPC_URL || 'https://sepolia.unichain.org'] },
    public:  { http: [process.env.NEXT_PUBLIC_UNICHAIN_SEPOLIA_RPC_URL || 'https://sepolia.unichain.org'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://unichain-sepolia.blockscout.com' },
  },
  testnet: true,
});

// ─── RPC URLs ─────────────────────────────────────────────────────────────────

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

const baseRpc = alchemyKey
  ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`
  : (process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL || 'https://mainnet.base.org');

const ethRpc = alchemyKey
  ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`
  : (process.env.NEXT_PUBLIC_ETHEREUM_MAINNET_RPC_URL || 'https://cloudflare-eth.com');

const baseSepoliaRpc = alchemyKey
  ? `https://base-sepolia.g.alchemy.com/v2/${alchemyKey}`
  : (process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org');

const ethSepoliaRpc = alchemyKey
  ? `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`
  : 'https://rpc.sepolia.org';

// ─── Wagmi config — all chains registered so balance reads work across networks ─

export const config = createConfig({
  chains: [
    base,           // 8453
    unichainMainnet,// 130
    arbitrum,       // 42161
    mainnet,        // 1
    baseSepolia,    // 84532
    sepolia,        // 11155111
    unichainSepolia,// 1301
    arbitrumSepolia,// 421614
  ],
  connectors: [injected()],
  transports: {
    [base.id]:            http(baseRpc),
    [unichainMainnet.id]: http(process.env.NEXT_PUBLIC_UNICHAIN_MAINNET_RPC_URL || 'https://mainnet.unichain.org'),
    [arbitrum.id]:        http(process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc'),
    [mainnet.id]:         http(ethRpc),
    [baseSepolia.id]:     http(baseSepoliaRpc),
    [sepolia.id]:         http(ethSepoliaRpc),
    [unichainSepolia.id]: http(process.env.NEXT_PUBLIC_UNICHAIN_SEPOLIA_RPC_URL || 'https://sepolia.unichain.org'),
    [arbitrumSepolia.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'),
  },
  ssr: true,
});
