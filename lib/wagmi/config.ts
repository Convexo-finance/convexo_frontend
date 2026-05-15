import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, base, baseSepolia } from 'wagmi/chains';
import { IS_MAINNET } from '@/lib/config/network';

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

const ethRpc = alchemyKey
  ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`
  : (process.env.NEXT_PUBLIC_ETHEREUM_MAINNET_RPC_URL || 'https://cloudflare-eth.com');

const ethSepoliaRpc = alchemyKey
  ? `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`
  : (process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org');

const baseRpc = alchemyKey
  ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`
  : (process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL || 'https://mainnet.base.org');

const baseSepoliaRpc = alchemyKey
  ? `https://base-sepolia.g.alchemy.com/v2/${alchemyKey}`
  : (process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org');

// READ-ONLY config — no connectors, no SSR. Exists only to provide Alchemy RPC
// transports for useReadContract and usePublicClient. Primary chain is always
// overridden by useChainId() in compat.ts → PRIMARY_CHAIN_ID.
export const config = createConfig({
  chains: IS_MAINNET ? [base, mainnet, baseSepolia, sepolia] : [sepolia, baseSepolia, mainnet, base],
  pollingInterval: 3_000,
  transports: {
    [mainnet.id]:    http(ethRpc),
    [sepolia.id]:    http(ethSepoliaRpc),
    [base.id]:       http(baseRpc),
    [baseSepolia.id]:http(baseSepoliaRpc),
  },
});
