// Token configuration — mainnet and testnet chains
// ECOP is the Convexo native token (no CoinGecko ID yet — USD value shows as 0)

export const TOKEN_ADDRESSES = {
  // ── Mainnet chains ───────────────────────────────────────────────────────────
  base: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
    USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' as `0x${string}`,
    EURC: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42' as `0x${string}`,
    BTC:  '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf' as `0x${string}`, // cbBTC
    ECOP: '0x2d7d0fd51f14cb3fe86e15a944acdc7ae121acbe' as `0x${string}`,
  },
  ethereum: {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as `0x${string}`,
    EURC: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c' as `0x${string}`,
    BTC:  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' as `0x${string}`, // WBTC
    ECOP: '0xff404bd4f52784fc3ddfa4a064e096bb8c84f7bf' as `0x${string}`,
  },
  unichain: {
    USDC: '0x078D782b760474a361dDA0AF3839290b0EF57AD6' as `0x${string}`,
    ECOP: '0x8d54238aed827a6d26f60efae5c855c205622e79' as `0x${string}`,
  },
  arbitrum: {
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as `0x${string}`,
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' as `0x${string}`,
    BTC:  '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f' as `0x${string}`, // WBTC
    ECOP: '0xedb7068a83dcc9c437bed70a979df62396c53c12' as `0x${string}`,
  },
  // ── Testnet chains ───────────────────────────────────────────────────────────
  baseSepolia: {
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`,
    ECOP: '0xb934dcb57fb0673b7bc0fca590c5508f1cde955d' as `0x${string}`,
  },
  ethSepolia: {
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as `0x${string}`,
    ECOP: '0x19ac2612e560b2bbedf88660a2566ef53c0a15a1' as `0x${string}`,
  },
  unichainSepolia: {
    USDC: '0x31d0220469e10c4E71834a79b1f276d740d3768F' as `0x${string}`,
    ECOP: '0xbb0d7c4141ee1fed53db766e1ffcb9c618df8260' as `0x${string}`,
  },
  arbSepolia: {
    USDC: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' as `0x${string}`,
    ECOP: '0x284d760b6fbb064e635c1f59ca0ef51490c93a06' as `0x${string}`,
  },
} as const;

export type TokenSymbol = 'ECOP' | 'ETH' | 'USDC' | 'USDT' | 'EURC' | 'BTC';

export interface TokenMetadata {
  name: string;
  symbol: TokenSymbol;
  decimals: number;
  coingeckoId: string; // empty string = not on CoinGecko yet
}

export const TOKEN_METADATA: Record<TokenSymbol, TokenMetadata> = {
  ECOP: { name: 'Convexo',   symbol: 'ECOP', decimals: 18, coingeckoId: '' },
  ETH:  { name: 'Ethereum',  symbol: 'ETH',  decimals: 18, coingeckoId: 'ethereum' },
  USDC: { name: 'USD Coin',  symbol: 'USDC', decimals: 6,  coingeckoId: 'usd-coin' },
  USDT: { name: 'Tether',    symbol: 'USDT', decimals: 6,  coingeckoId: 'tether' },
  EURC: { name: 'Euro Coin', symbol: 'EURC', decimals: 6,  coingeckoId: 'euro-coin' },
  BTC:  { name: 'Bitcoin',   symbol: 'BTC',  decimals: 8,  coingeckoId: 'wrapped-bitcoin' },
};

// Only include tokens that have a CoinGecko ID
export const COINGECKO_IDS = Object.values(TOKEN_METADATA)
  .map((t) => t.coingeckoId)
  .filter(Boolean);

export interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number | null;
}
