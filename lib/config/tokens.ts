// Token configuration for mainnet chains
// Base Mainnet (8453) and Ethereum Mainnet (1)

export const TOKEN_ADDRESSES = {
  base: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
    USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' as `0x${string}`,
    EURC: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42' as `0x${string}`,
    BTC:  '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf' as `0x${string}`, // Coinbase Wrapped BTC (cbBTC)
  },
  ethereum: {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as `0x${string}`,
    EURC: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c' as `0x${string}`,
    BTC:  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' as `0x${string}`, // Wrapped Bitcoin (WBTC)
  },
} as const;

export type TokenSymbol = 'ETH' | 'USDC' | 'USDT' | 'EURC' | 'BTC';

export interface TokenMetadata {
  name: string;
  symbol: TokenSymbol;
  decimals: number;
  coingeckoId: string;
}

export const TOKEN_METADATA: Record<TokenSymbol, TokenMetadata> = {
  ETH: { name: 'Ethereum', symbol: 'ETH', decimals: 18, coingeckoId: 'ethereum' },
  USDC: { name: 'USD Coin', symbol: 'USDC', decimals: 6, coingeckoId: 'usd-coin' },
  USDT: { name: 'Tether', symbol: 'USDT', decimals: 6, coingeckoId: 'tether' },
  EURC: { name: 'Euro Coin', symbol: 'EURC', decimals: 6, coingeckoId: 'euro-coin' },
  BTC:  { name: 'Bitcoin', symbol: 'BTC', decimals: 8, coingeckoId: 'wrapped-bitcoin' },
};

export const COINGECKO_IDS = Object.values(TOKEN_METADATA).map((t) => t.coingeckoId);

export interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number | null;
}
