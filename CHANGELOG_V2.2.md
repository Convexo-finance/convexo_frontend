# Convexo Protocol v2.2 - Changelog

**Release Date:** December 2, 2025  
**Status:** ✅ Deployed on all 3 testnets

---

## 🎯 Version 2.2 - Major Security & UX Enhancements

### 🔐 Critical Security Fix: Protocol Fee Protection

**Problem Solved:**
- In v2.0-2.1, investors could withdraw ALL funds including protocol fees
- Protocol fees were not protected, leading to potential loss of protocol revenue

**Solution Implemented:**
```solidity
// New internal function
function _calculateReservedProtocolFees() internal view returns (uint256)

// New public view function  
function getAvailableForInvestors() public view returns (uint256)

// Updated redeemShares() logic
// Now excludes protocol fees from available balance for investors
```

**Impact:**
- ✅ Protocol fees are now **protected** and reserved for protocol collector
- ✅ Investors can only withdraw their proportional share (principal + interest)
- ✅ Clear separation between investor funds and protocol fees

**Example:**
```
Total Repaid: $57,000
├─ Principal + Interest: $56,000 → Available for investors ✅
└─ Protocol Fee: $1,000 → Reserved for protocol collector ✅

Before v2.2: Investors could withdraw all $57,000 ❌
After v2.2: Investors can only withdraw $56,000 ✅
```

---

### ⏱️ Timestamp Tracking System

**New Fields in VaultInfo Struct:**
```solidity
uint256 fundedAt;           // Timestamp when vault is fully funded
uint256 contractAttachedAt; // Timestamp when contract is attached
uint256 fundsWithdrawnAt;   // Timestamp when borrower withdraws funds
```

**New Getter Functions:**
```solidity
function getVaultCreatedAt() external view returns (uint256)
function getVaultFundedAt() external view returns (uint256)
function getVaultContractAttachedAt() external view returns (uint256)
function getVaultFundsWithdrawnAt() external view returns (uint256)
function getActualDueDate() external view returns (uint256)
```

**Benefits:**
- 📅 **Accurate Due Dates:** Calculated from withdrawal time, not creation time
- 🔍 **Complete Audit Trail:** Immutable timestamps for all major events
- 📊 **Better UX:** Users see exact dates for vault milestones
- ⚖️ **Compliance:** Transparent timeline for all parties

**Timeline Example:**
```
Vault Lifecycle with Timestamps:
├─ Created: Dec 1, 2025 10:00 AM
├─ Funded: Dec 2, 2025 3:00 PM
├─ Contract Attached: Dec 3, 2025 9:00 AM
├─ Funds Withdrawn: Dec 3, 2025 2:00 PM
└─ Due Date: Mar 3, 2026 2:00 PM (90 days from withdrawal)
```

---

### 🎯 Vault Completion Logic

**New Internal Function:**
```solidity
function _checkVaultCompletion() internal
```

**Completion Criteria (All must be met):**
1. ✅ All debt is repaid (principal + interest + protocol fee)
2. ✅ Protocol fees have been withdrawn by collector
3. ✅ All investors have redeemed their shares
4. ✅ Vault balance < 0.0001 USDC (dust threshold)

**Why This Matters:**
- Vault state only changes to `Completed` when **everyone** has received their funds
- Prevents premature completion status
- Ensures all parties can track outstanding distributions

---

## 📊 Frontend Integration Changes

### New Contract Functions to Integrate

#### 1. Protocol Fee Protection
```typescript
// Check available funds for investors (excludes protocol fees)
const availableForInvestors = await vault.getAvailableForInvestors();

// Example: 
// Total balance: $57,000
// Protocol fees reserved: $1,000
// Available for investors: $56,000 ✅
```

#### 2. Timestamp Tracking
```typescript
// Get all vault timestamps
const createdAt = await vault.getVaultCreatedAt();
const fundedAt = await vault.getVaultFundedAt();
const contractAttachedAt = await vault.getVaultContractAttachedAt();
const fundsWithdrawnAt = await vault.getVaultFundsWithdrawnAt();
const actualDueDate = await vault.getActualDueDate();

// Calculate days remaining
const now = Math.floor(Date.now() / 1000);
const daysRemaining = Math.floor((actualDueDate - now) / 86400);
```

#### 3. Vault Completion Status
```typescript
// Check if vault is truly completed
const state = await vault.getVaultState();
const balance = await usdc.balanceOf(vaultAddress);

// Completed = state is 4 AND balance is near zero
const isFullyCompleted = state === 4 && balance < 100n; // < 0.0001 USDC
```

---

## 🔄 Updated Contract Addresses (v2.2)

### Base Sepolia (Chain ID: 84532)
```
Convexo_LPs:         0xd05df511dbe7d793d82b7344a955f15485ff0787
Convexo_Vaults:      0xfb965542aa0b58538a9b50fe020314dd687eb128
VaultFactory:        0x8efc7e25c12a815329331da5f0e96affb4014472
ContractSigner:      0x62227ff7ccbdb4d72c3511290b28c3424f1500ef
ReputationManager:   0x50ace0dce54df668477adee4e9d6a6c0df4fedee
```

### Ethereum Sepolia (Chain ID: 11155111)
```
Convexo_LPs:         0x2a0d9da5a72dfe20b65b25e9fefc0e6e090ac194
Convexo_Vaults:      0x744e39b3eb1be014cb8d14a585c31e22b7f4a9b8
VaultFactory:        0xf54e26527bec4847f66afb5166a7a5c3d1fd6304
ContractSigner:      0x99e9880a08e14112a18c091bd49a2b1713133687
ReputationManager:   0xe4a58592171cd0770e6792600ea3098060a42d46
```

### Unichain Sepolia (Chain ID: 1301)
```
Convexo_LPs:         0x6ba429488cad3795af1ec65d80be760b70f58e4b
Convexo_Vaults:      0x64fd5631ffe78e907da7b48542abfb402680891a
VaultFactory:        0x5e252bb1642cfa13d4ad93cdfdbabcb9c64ac841
ContractSigner:      0x834dbab5c4bf2f9f2c80c9d7513ff986d3a835c8
ReputationManager:   0x7c22db98a3f8da11f8c79d60a78d12df4a18516b
```

> **Note:** All contracts verified on respective block explorers ✅

---

## 🚀 Migration Guide (v2.0/2.1 → v2.2)

### Step 1: Update Contract Addresses
```typescript
// Update lib/contracts/addresses.ts with new v2.2 addresses
import { CONTRACTS } from '@/lib/contracts/addresses';
```

### Step 2: Update ABIs
```bash
# Replace ABIs in abis/ folder with v2.2 versions
# Key changes:
# - TokenizedBondVault.json (new functions added)
# - VaultFactory.json (updated VaultInfo struct)
```

### Step 3: Integrate New Functions

**For Investors:**
```typescript
// Before withdrawing, check available funds
const available = await vault.getAvailableForInvestors();
console.log(`You can withdraw: ${formatUnits(available, 6)} USDC`);

// This excludes protocol fees automatically ✅
```

**For Protocol Collector:**
```typescript
// Protocol fees are now separate and protected
const protocolFees = await vault.protocolFeesEarned();
await vault.withdrawProtocolFees();
```

**For Timeline Display:**
```typescript
// Show complete vault timeline
const timeline = {
  created: await vault.getVaultCreatedAt(),
  funded: await vault.getVaultFundedAt(),
  contractAttached: await vault.getVaultContractAttachedAt(),
  fundsWithdrawn: await vault.getVaultFundsWithdrawnAt(),
  dueDate: await vault.getActualDueDate(),
};
```

### Step 4: Update UI Components
```typescript
// VaultCard.tsx - Add timeline display
// VaultCard.tsx - Show available funds for investors
// VaultCard.tsx - Update completion logic
```

---

## 🧪 Testing Checklist

### Protocol Fee Protection
- [ ] Create vault with 1,000 USDC principal
- [ ] Investor funds vault
- [ ] Borrower repays 1,140 USDC (1,000 + 120 interest + 20 fee)
- [ ] Verify investor can only withdraw 1,120 USDC (not 1,140)
- [ ] Verify protocol collector can withdraw 20 USDC
- [ ] Verify vault balance is 0 after all withdrawals

### Timestamp Tracking
- [ ] Check `createdAt` is set on vault creation
- [ ] Check `fundedAt` is set when fully funded
- [ ] Check `contractAttachedAt` is set when contract attached
- [ ] Check `fundsWithdrawnAt` is set when borrower withdraws
- [ ] Verify `getActualDueDate()` = fundsWithdrawnAt + maturityDuration

### Vault Completion
- [ ] Verify vault stays in `Repaying` state after full repayment
- [ ] Verify vault moves to `Completed` only after:
  - Full repayment ✅
  - Protocol fees withdrawn ✅
  - All shares redeemed ✅
  - Balance near zero ✅

---

## 📝 Breaking Changes

### ⚠️ Important: Investor Withdrawal Behavior Changed

**Before v2.2:**
```typescript
// Investors could withdraw all funds in vault
const balance = await usdc.balanceOf(vaultAddress);
await vault.redeemShares(myShares);
// Could receive protocol fees ❌
```

**After v2.2:**
```typescript
// Investors can only withdraw their portion
const available = await vault.getAvailableForInvestors();
await vault.redeemShares(myShares);
// Protocol fees are protected ✅
```

### ⚠️ VaultInfo Struct Changed

**New fields added (backwards compatible):**
- `fundedAt` (uint256)
- `contractAttachedAt` (uint256)
- `fundsWithdrawnAt` (uint256)

**Impact:** If you're reading `vaultInfo` directly, update your destructuring to include new fields.

---

## 🎉 Summary

### What's New in v2.2
- ✅ **Security:** Protocol fees are now protected from investor withdrawals
- ✅ **Transparency:** Complete timestamp tracking for all vault events
- ✅ **Accuracy:** Due dates calculated from withdrawal time, not creation
- ✅ **Completion:** Vault only marked complete when all funds distributed

### Deployment Status
- ✅ Base Sepolia - Deployed & Verified
- ✅ Ethereum Sepolia - Deployed & Verified
- ✅ Unichain Sepolia - Deployed & Verified

### Next Steps
1. Update frontend with new contract addresses
2. Integrate new timestamp functions
3. Update investor withdrawal UI to show available funds
4. Test protocol fee protection flow
5. Deploy to production

---

**Questions?** See [CONTRACTS_REFERENCE.md](./CONTRACTS_REFERENCE.md) for detailed function documentation.

**Version:** 2.2.0  
**Last Updated:** December 2, 2025

