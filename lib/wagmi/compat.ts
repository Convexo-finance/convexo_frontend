// Re-export everything from wagmi so existing imports keep working
export * from 'wagmi';

// Override useAccount with our bridge that maps Account Kit state to wagmi-compatible shape
export { useAccount } from '@/lib/hooks/useWalletAccount';
