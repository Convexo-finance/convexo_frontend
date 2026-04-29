import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { IS_MAINNET } from '@/lib/config/network';

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

const ethRpc = alchemyKey
  ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`
  : (process.env.NEXT_PUBLIC_ETHEREUM_MAINNET_RPC_URL || 'https://cloudflare-eth.com');

const ethSepoliaRpc = alchemyKey
  ? `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`
  : (process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org');

// READ-ONLY config — no connectors, no SSR. Exists only to provide Alchemy RPC
// transports for useReadContract and usePublicClient. Primary chain is always
// overridden by useChainId() in compat.ts → PRIMARY_CHAIN_ID.
export const config = createConfig({
  chains: IS_MAINNET ? [mainnet, sepolia] : [sepolia, mainnet],
  pollingInterval: 3_000,
  transports: {
    [mainnet.id]: http(ethRpc),
    [sepolia.id]: http(ethSepoliaRpc),
  },
});
