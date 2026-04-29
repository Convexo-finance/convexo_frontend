import { IS_MAINNET } from '@/lib/config/network'
import { createMigrationConfig } from '@privy-io/alchemy-migration'
import { alchemy, base as alchemyBase, sepolia as alchemySepolia } from '@account-kit/infra'
import { base, mainnet, sepolia, baseSepolia, arbitrum, arbitrumSepolia } from 'viem/chains'
import type { Chain } from 'viem'

export const PRIVY_APP_ID = 'cmok5banj000c0ckvotv8lgg7'
export const PRIVY_CLIENT_ID = 'client-WY6YftQbLZuxRdFf7bxZRNPHPT6nK917kWYuLFGyHT7sz'

const CHAIN_MAP: Record<number, Chain> = {
  8453:    base,
  1:       mainnet,
  11155111: sepolia,
  84532:   baseSepolia,
  42161:   arbitrum,
  421614:  arbitrumSepolia,
}

export function getViemChain(chainId: number): Chain {
  return CHAIN_MAP[chainId] ?? sepolia
}

export function getPolicyId(chainId: number): string | undefined {
  if (IS_MAINNET) {
    if (chainId === 8453) return process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID || undefined
    if (chainId === 1)    return process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID_ETH || undefined
  } else {
    if (chainId === 11155111) return process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID_SEPOLIA || undefined
  }
  return undefined
}

export const migrationAlchemyConfig = createMigrationConfig(
  {
    transport: alchemy({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ?? '' }),
    chain: IS_MAINNET ? alchemyBase : alchemySepolia,
    ssr: true,
  },
  {
    auth: {
      sections: [
        [{ type: 'email' }],
        [
          { type: 'passkey' },
          { type: 'social', authProviderId: 'google', mode: 'popup' },
        ],
      ],
    },
  }
)
