/**
 * @deprecated v3.18 — TreasuryFactory removed from protocol.
 * Multi-sig treasury is now handled via Gnosis Safe on Base.
 * These exports are stubs kept for backwards compatibility.
 */

export function useTreasuryFactory() {
  return {
    treasuryCount: undefined,
    userTreasuries: undefined,
    userTreasuryCount: undefined,
    isLoadingCount: false,
    isLoadingUserTreasuries: false,
    isLoadingUserCount: false,
    refetchCount: () => {},
    refetchUserTreasuries: () => {},
    useTreasury: () => ({ data: undefined, isLoading: false }),
    useTreasuryAddressAtIndex: () => ({ data: undefined, isLoading: false }),
    createTreasury: async () => { throw new Error('TreasuryFactory removed in v3.18'); },
    isCreating: false,
    isConfirmingCreate: false,
    isCreateSuccess: false,
    createHash: undefined,
    createError: null,
  };
}

export function useTreasuryVaultInfo(_treasuryAddress?: `0x${string}`) {
  return {
    signers: undefined,
    signaturesRequired: undefined,
    transactionCount: undefined,
    owner: undefined,
    isLoading: false,
    refetch: () => {},
  };
}

export function useTreasuryTransaction(_treasuryAddress?: `0x${string}`, _txIndex?: bigint) {
  return { transaction: undefined, isLoading: false, refetch: () => {} };
}

export function useIsTreasurySigner(_treasuryAddress?: `0x${string}`, _signerAddress?: `0x${string}`) {
  return { isSigner: false, isLoading: false, refetch: () => {} };
}

export function useHasConfirmed(_treasuryAddress?: `0x${string}`, _txIndex?: bigint, _signerAddress?: `0x${string}`) {
  return { hasConfirmed: false, isLoading: false, refetch: () => {} };
}

export function useSubmitTransaction(_treasuryAddress?: `0x${string}`) {
  return {
    submitTransaction: async () => { throw new Error('TreasuryFactory removed in v3.18'); },
    isPending: false, isConfirming: false, isSuccess: false, hash: undefined, error: null,
  };
}

export function useConfirmTransaction(_treasuryAddress?: `0x${string}`) {
  return {
    confirmTransaction: async () => { throw new Error('TreasuryFactory removed in v3.18'); },
    isPending: false, isConfirming: false, isSuccess: false, hash: undefined, error: null,
  };
}

export function useRevokeConfirmation(_treasuryAddress?: `0x${string}`) {
  return {
    revokeConfirmation: async () => { throw new Error('TreasuryFactory removed in v3.18'); },
    isPending: false, isConfirming: false, isSuccess: false, hash: undefined, error: null,
  };
}

export function useExecuteTransaction(_treasuryAddress?: `0x${string}`) {
  return {
    executeTransaction: async () => { throw new Error('TreasuryFactory removed in v3.18'); },
    isPending: false, isConfirming: false, isSuccess: false, hash: undefined, error: null,
  };
}

export function useDepositToTreasury(_treasuryAddress?: `0x${string}`) {
  return {
    approveUsdc: async () => { throw new Error('TreasuryFactory removed in v3.18'); },
    isApproving: false, isConfirmingApprove: false, isApproveSuccess: false, approveHash: undefined,
    depositUsdc: async () => { throw new Error('TreasuryFactory removed in v3.18'); },
    isDepositing: false, isConfirmingDeposit: false, isDepositSuccess: false, depositHash: undefined,
  };
}

export function useTreasuryVault(_treasuryAddress?: `0x${string}`) {
  const info = useTreasuryVaultInfo(_treasuryAddress);
  const submit = useSubmitTransaction(_treasuryAddress);
  const confirm = useConfirmTransaction(_treasuryAddress);
  const revoke = useRevokeConfirmation(_treasuryAddress);
  const execute = useExecuteTransaction(_treasuryAddress);
  const deposit = useDepositToTreasury(_treasuryAddress);
  return { treasuryAddress: _treasuryAddress, ...info, isSigner: false, isOwner: false, canSign: false, submit, confirm, revoke, execute, deposit };
}

export function useTreasuryUsdcTransfer(_treasuryAddress?: `0x${string}`) {
  const submit = useSubmitTransaction(_treasuryAddress);
  return {
    submitUsdcTransfer: async () => { throw new Error('TreasuryFactory removed in v3.18'); },
    ...submit,
  };
}
