'use client'

import { useWallets, toViemAccount } from '@privy-io/react-auth'
import { useEffect, useRef, useState } from 'react'
import type { LocalAccount } from 'viem'

// @privy-io/react-auth bundles its own viem copy, so toViemAccount returns
// privy's internal LocalAccount type. We bridge to the project's viem type
// via unknown cast — the shapes are structurally identical at runtime.
type Signer = LocalAccount

export function usePrivySigner(): Signer | undefined {
  const { wallets } = useWallets()
  const wallet = wallets[0]
  const [signer, setSigner] = useState<Signer | undefined>()
  const lastAddress = useRef<string | undefined>()

  useEffect(() => {
    if (!wallet) { setSigner(undefined); lastAddress.current = undefined; return }
    if (wallet.address === lastAddress.current) return
    lastAddress.current = wallet.address
    toViemAccount({ wallet })
      .then((s) => setSigner(s as unknown as Signer))
      .catch(() => { setSigner(undefined); lastAddress.current = undefined })
  }, [wallet])

  return signer
}
