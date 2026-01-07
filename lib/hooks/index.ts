/**
 * Convexo Protocol Hooks - Main Export
 * All contract read and write functions for the frontend
 */

// NFT & Core Contract Hooks
export {
  useConvexoLPs,
  useConvexoVaultsNFT,
  useConvexoPassport,
  useReputationManager,
  useVaultFactory,
  useUSDC,
  usePoolRegistry,
  usePriceFeedManager,
  useConvexoProtocol,
} from './useConvexoContracts';

// TokenizedBondVault Hooks
export {
  useVaultInfo,
  useVaultMetrics,
  useVaultState,
  useInvestorReturn,
  useIsInvestor,
  useVaultInvestors,
  useRepaymentStatus,
  useAccruedInterest,
  useVaultBalance,
  useAvailableForInvestors,
  useShareValue,
  useVaultTokenBalance,
  useVaultTokenSupply,
  useVaultTokenName,
  useVaultTokenSymbol,
  useVaultTimestamps,
  usePurchaseShares,
  useRedeemShares,
  useWithdrawFunds,
  useMakeRepayment,
  useAttachContract,
  useDisburseLoan,
  useMarkAsDefaulted,
  useWithdrawProtocolFees,
  useTokenizedBondVault,
} from './useTokenizedBondVault';

// Treasury Hooks
export {
  useTreasuryFactory,
  useTreasuryVaultInfo,
  useTreasuryTransaction,
  useIsTreasurySigner,
  useHasConfirmed,
  useSubmitTransaction,
  useConfirmTransaction,
  useRevokeConfirmation,
  useExecuteTransaction,
  useDepositToTreasury,
  useTreasuryVault,
  useTreasuryUsdcTransfer,
} from './useTreasury';

// Verification Hooks
export {
  useVerificationStatus,
  useIsVerified,
  useIsSessionIdUsed,
  useUserBySessionId,
  useSubmitVerification,
  useApproveVerification,
  useRejectVerification,
  useResetVerification,
  useVerifierRole,
  useVerification,
  useVerificationFlow,
} from './useVerification';

// Contract Signer Hooks
export {
  useContractDocument,
  useDocumentExists,
  useContractCount,
  useDocumentHashAtIndex,
  useContractSignatures,
  useRequiredSigners,
  useHasSigned,
  useIsFullySigned,
  useCreateContract,
  useSignContract,
  useCancelContract,
  useExecuteContract,
  useContractSignerRoles,
  useContractSigner,
  generateDocumentHash,
  getAgreementTypeLabel,
  DEFAULT_EXPIRY_DURATION,
  calculateExpiryTimestamp,
} from './useContractSigner';

// Legacy hooks (for backwards compatibility)
export { useVaultCount, useVaultAddress } from './useVaults';
export { useUserReputation } from './useUserReputation';
export { useNFTBalance } from './useNFTBalance';


