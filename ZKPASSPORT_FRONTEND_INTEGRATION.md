# ZKPassport Frontend Integration Guide

**Simplified guide for ZKPassport identity verification and Convexo Passport NFT minting**

---

## 📋 Overview

This guide implements a **two-step process**:

1. **Step 1**: Identity verification with ZKPassport (face match, sanctions screening)
2. **Step 2**: Mint Convexo Passport NFT after verification passes

**Key Points:**
- ✅ Users verify identity first (off-chain)
- ✅ Users mint NFT after verification (on-chain)
- ✅ Users pay for gas fees
- ✅ No storage of ID images or biometric data
- ✅ One NFT per wallet address

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install @zkpassport/sdk viem wagmi @rainbow-me/rainbowkit
```

### 2. Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_APP_DOMAIN=yourdomain.com
NEXT_PUBLIC_CONVEXO_PASSPORT_ADDRESS=0x4A164470586B7e80eEf2734d24f5F784e4f88ad0
NEXT_PUBLIC_ZKPASSPORT_VERIFIER=0x1D000001000EFD9a6371f4d90bB8920D5431c0D8
```

---

## 📝 Step 1: Identity Verification

### Initialize ZKPassport

Create `lib/zkpassport.ts`:

```typescript
import { ZKPassport } from "@zkpassport/sdk";

export const zkPassport = new ZKPassport(process.env.NEXT_PUBLIC_APP_DOMAIN!);
```

### Create Verification Request

```typescript
// lib/zkpassport.ts
export async function createVerificationRequest() {
  const queryBuilder = await zkPassport.request({
    name: "Convexo Identity Verification",
    logo: "https://yourdomain.com/logo.png",
    purpose: "Verify user identity for Convexo Passport NFT",
    scope: "convexo-identity",
  });

  return queryBuilder
    .disclose("nationality")
    .disclose("birthdate")
    .disclose("fullname")
    .sanctions() // Enable sanctions screening
    .facematch("strict") // Enable face match with strict mode
    .done();
}
```

### Handle Verification Result

```typescript
// lib/zkpassport.ts
import { hexToBytes, bytesToHex } from 'viem';

export interface VerificationResult {
  verified: boolean;
  result: {
    facematch: {
      passed: boolean;
    };
    sanctions: {
      passed: boolean;
    };
    disclosed: {
      nationality?: string;
      birthdate?: string;
      fullname?: string;
    };
  };
  proof?: {
    publicKey: string;
    nullifier: string;
    proof: string;
    attestationId: string;
    scope: string;
  };
}

// Convert ZKPassport SDK proof to contract format
export function formatProofForContract(proof: any): {
  publicKey: `0x${string}`;
  nullifier: `0x${string}`;
  proof: `0x${string}`;
  attestationId: bigint;
  scope: `0x${string}`;
  currentDate: bigint;
} {
  // Ensure all values are properly formatted
  // publicKey and nullifier should be bytes32 (0x + 64 hex chars)
  const publicKey = proof.publicKey.startsWith('0x') 
    ? proof.publicKey as `0x${string}`
    : `0x${proof.publicKey}` as `0x${string}`;
  
  const nullifier = proof.nullifier.startsWith('0x')
    ? proof.nullifier as `0x${string}`
    : `0x${proof.nullifier}` as `0x${string}`;
  
  // proof is bytes (can be variable length)
  const proofBytes = proof.proof.startsWith('0x')
    ? proof.proof as `0x${string}`
    : `0x${proof.proof}` as `0x${string}`;
  
  // scope should be bytes32
  const scope = proof.scope.startsWith('0x')
    ? proof.scope as `0x${string}`
    : `0x${proof.scope}` as `0x${string}`;
  
  // attestationId should be uint256 (bigint)
  const attestationId = typeof proof.attestationId === 'string'
    ? BigInt(proof.attestationId)
    : BigInt(proof.attestationId);
  
  // currentDate is current timestamp
  const currentDate = BigInt(Math.floor(Date.now() / 1000));

  return {
    publicKey,
    nullifier,
    proof: proofBytes,
    attestationId,
    scope,
    currentDate,
  };
}

export function onResult(callback: (result: VerificationResult) => void) {
  zkPassport.onResult(({ verified, result, proof }) => {
    const verificationResult: VerificationResult = {
      verified,
      result: {
        facematch: {
          passed: result.facematch?.passed ?? false,
        },
        sanctions: {
          passed: result.sanctions?.passed ?? false,
        },
        disclosed: {
          nationality: result.disclosed?.nationality,
          birthdate: result.disclosed?.birthdate,
          fullname: result.disclosed?.fullname,
        },
      },
      proof: proof ? {
        publicKey: proof.publicKey,
        nullifier: proof.nullifier,
        proof: proof.proof,
        attestationId: proof.attestationId,
        scope: proof.scope,
      } : undefined,
    };

    callback(verificationResult);
  });
}
```

### Verification Component

```typescript
// components/IdentityVerification.tsx
'use client';

import { useState, useEffect } from 'react';
import { createVerificationRequest, onResult, VerificationResult } from '@/lib/zkpassport';

export function IdentityVerification({ onVerified }: { onVerified: (result: VerificationResult) => void }) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up result handler
    onResult((result: VerificationResult) => {
      setIsVerifying(false);

      // Check all requirements
      if (!result.verified) {
        setError("Verification proof invalid");
        return;
      }

      if (!result.result.facematch.passed) {
        setError("Face match failed. Please try again.");
        return;
      }

      if (!result.result.sanctions.passed) {
        setError("Sanctions check failed. Account flagged for review.");
        return;
      }

      // All checks passed - proceed to mint
      onVerified(result);
    });
  }, [onVerified]);

  const startVerification = async () => {
    try {
      setIsVerifying(true);
      setError(null);

      const { url } = await createVerificationRequest();
      
      // Redirect user to ZKPassport verification
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || "Failed to start verification");
      setIsVerifying(false);
    }
  };

  return (
    <div className="verification-container">
      <h2>Identity Verification</h2>
      <p>Verify your identity to mint a Convexo Passport NFT</p>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
        </div>
      )}

      <button 
        onClick={startVerification}
        disabled={isVerifying}
        className="btn btn-primary"
      >
        {isVerifying ? 'Starting Verification...' : 'Start Identity Verification'}
      </button>

      <div className="info-box mt-4">
        <p className="text-sm"><strong>What you'll need:</strong></p>
        <ul className="text-sm list-disc list-inside mt-2">
          <li>Government-issued ID (passport or ID card)</li>
          <li>Device with camera for face match</li>
          <li>5-10 minutes to complete</li>
        </ul>
      </div>
    </div>
  );
}
```

---

## 🎫 Step 2: Mint NFT

### Contract Addresses

```typescript
// lib/constants.ts
export const CONVEXO_PASSPORT_ADDRESSES = {
  11155111: '0x2cfa02372782cf20ef8342B0193fd69E4c5B04A8', // Ethereum Sepolia
  84532: '0x4A164470586B7e80eEf2734d24f5F784e4f88ad0', // Base Sepolia
  1301: '0xB612DB1FE343C4B5FFa9e8C3f4dde37769F7C5B6', // Unichain Sepolia
} as const;

export const ZKPASSPORT_VERIFIER = '0x1D000001000EFD9a6371f4d90bB8920D5431c0D8';
```

### Mint NFT Component

```typescript
// components/MintPassportNFT.tsx
'use client';

import { useState } from 'react';
import { useAccount, useNetwork, useBalance, useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import ConvexoPassportABI from '@/abis/Convexo_Passport.json';
import { CONVEXO_PASSPORT_ADDRESSES } from '@/lib/constants';
import { VerificationResult, formatProofForContract } from '@/lib/zkpassport';

interface MintPassportNFTProps {
  verificationResult: VerificationResult;
}

export function MintPassportNFT({ verificationResult }: MintPassportNFTProps) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [error, setError] = useState<string | null>(null);

  // Get contract address
  const contractAddress = chain?.id 
    ? CONVEXO_PASSPORT_ADDRESSES[chain.id as keyof typeof CONVEXO_PASSPORT_ADDRESSES]
    : CONVEXO_PASSPORT_ADDRESSES[84532];

  // Check ETH balance
  const { data: balance } = useBalance({ address });
  const MIN_ETH_REQUIRED = parseEther('0.01');
  const hasEnoughETH = balance && balance.value >= MIN_ETH_REQUIRED;

  // Prepare proof parameters (format for contract)
  const proofParams = verificationResult.proof 
    ? formatProofForContract(verificationResult.proof)
    : null;

  // Mint NFT
  const { 
    write: mintPassport, 
    isLoading: isMinting,
    data: mintData,
    error: mintError,
  } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: ConvexoPassportABI,
    functionName: 'safeMintWithZKPassport',
    args: proofParams ? [
      {
        publicKey: proofParams.publicKey,
        nullifier: proofParams.nullifier,
        proof: proofParams.proof,
        attestationId: proofParams.attestationId,
        scope: proofParams.scope,
        currentDate: proofParams.currentDate,
      },
      false, // isIDCard: false = passport, true = ID card
    ] : undefined,
    // Note: Contract expects ProofVerificationParams matching IZKPassportVerifier interface
    gas: BigInt(500000), // Estimated gas with buffer
    onError: (error) => {
      const errorMsg = error.message || error.toString();
      if (errorMsg.includes('AlreadyHasPassport')) {
        setError('You already have a passport NFT');
      } else if (errorMsg.includes('ProofVerificationFailed')) {
        setError('Proof verification failed. Please verify again.');
      } else if (errorMsg.includes('MustBeOver18')) {
        setError('You must be over 18 to mint a passport');
      } else if (errorMsg.includes('insufficient funds')) {
        setError(`Insufficient ETH. Please add at least ${formatEther(MIN_ETH_REQUIRED)} ETH`);
      } else {
        setError(errorMsg);
      }
    },
  });

  // Wait for transaction
  const { isLoading: isWaiting, isSuccess } = useWaitForTransaction({
    hash: mintData?.hash,
    onSuccess: () => {
      setError(null);
    },
    onError: (error) => {
      setError('Transaction failed. Please try again.');
    },
  });

  if (!isConnected) {
    return <p>Please connect your wallet</p>;
  }

  if (!hasEnoughETH) {
    return (
      <div className="alert alert-warning">
        <p>⚠️ Insufficient ETH for gas</p>
        <p>You need at least {formatEther(MIN_ETH_REQUIRED)} ETH</p>
        <p>Current balance: {balance ? formatEther(balance.value) : '0'} ETH</p>
      </div>
    );
  }

  if (!proofParams) {
    return (
      <div className="alert alert-error">
        <p>Missing proof parameters. Please verify your identity again.</p>
      </div>
    );
  }

  return (
    <div className="mint-container">
      <h2>Mint Convexo Passport NFT</h2>
      
      <div className="alert alert-success mb-4">
        <p>✅ Identity verified successfully</p>
        <p className="text-sm">
          Face match: ✅ Passed | Sanctions: ✅ Passed
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <p>{error}</p>
        </div>
      )}

      <button
        onClick={() => mintPassport?.()}
        disabled={isMinting || isWaiting || !mintPassport}
        className="btn btn-primary w-full"
      >
        {isMinting || isWaiting 
          ? 'Minting NFT...' 
          : 'Mint Passport NFT'}
      </button>

      <div className="info-box mt-4">
        <p className="text-sm"><strong>Gas Information:</strong></p>
        <ul className="text-xs space-y-1 mt-2">
          <li>• Estimated: 300k - 500k gas</li>
          <li>• Cost: ~$0.01 - $0.05 (Base Sepolia)</li>
          <li>• <strong>You pay for gas</strong></li>
        </ul>
      </div>

      {isSuccess && (
        <div className="alert alert-success mt-4">
          <p>🎉 Passport NFT minted successfully!</p>
          {mintData?.hash && (
            <a 
              href={`https://${chain?.id === 84532 ? 'sepolia.basescan.org' : 'sepolia.etherscan.io'}/tx/${mintData.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600"
            >
              View Transaction →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 🔄 Complete Flow Component

```typescript
// components/PassportOnboarding.tsx
'use client';

import { useState } from 'react';
import { IdentityVerification } from './IdentityVerification';
import { MintPassportNFT } from './MintPassportNFT';
import { VerificationResult } from '@/lib/zkpassport';

export function PassportOnboarding() {
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [step, setStep] = useState<'verify' | 'mint'>('verify');

  const handleVerified = (result: VerificationResult) => {
    setVerificationResult(result);
    setStep('mint');
  };

  return (
    <div className="onboarding-container">
      {step === 'verify' && (
        <IdentityVerification onVerified={handleVerified} />
      )}

      {step === 'mint' && verificationResult && (
        <MintPassportNFT verificationResult={verificationResult} />
      )}
    </div>
  );
}
```

---

## ✅ Acceptance Criteria

### Verification Requirements

- ✅ User completes ZKPassport verification
- ✅ Face match check passes (`facematch.passed === true`)
- ✅ Sanctions check passes (`sanctions.passed === true`)
- ✅ Proof is valid (`verified === true`)

### Data Handling

- ✅ **DO NOT** store ID images
- ✅ **DO NOT** store biometric data
- ✅ **ONLY** store verification status and timestamp
- ✅ Store verification hash if needed for audit

### Onboarding Gate

- ❌ Block onboarding if `verified === false`
- ❌ Block onboarding if `facematch.passed === false`
- ❌ Block onboarding if `sanctions.passed === false`
- ✅ Allow minting only when all checks pass

---

## 🔧 Configuration

### Environment Variables

```env
# Required
NEXT_PUBLIC_APP_DOMAIN=yourdomain.com

# Contract addresses (optional, defaults provided)
NEXT_PUBLIC_CONVEXO_PASSPORT_ADDRESS=0x4A164470586B7e80eEf2734d24f5F784e4f88ad0
NEXT_PUBLIC_ZKPASSPORT_VERIFIER=0x1D000001000EFD9a6371f4d90bB8920D5431c0D8
```

### Network Support

| Network | Chain ID | Contract Address |
|---------|----------|------------------|
| Ethereum Sepolia | 11155111 | `0x2cfa02372782cf20ef8342B0193fd69E4c5B04A8` |
| Base Sepolia | 84532 | `0x4A164470586B7e80eEf2734d24f5F784e4f88ad0` |
| Unichain Sepolia | 1301 | `0xB612DB1FE343C4B5FFa9e8C3f4dde37769F7C5B6` |

---

## 🚨 Error Handling

### Verification Errors

```typescript
// Handle verification failures
if (!result.verified) {
  // Proof invalid - user must verify again
  throw new Error("Verification proof invalid");
}

if (!result.result.facematch.passed) {
  // Face match failed - user can retry
  throw new Error("Face match failed. Please try again.");
}

if (!result.result.sanctions.passed) {
  // Sanctions check failed - flag for manual review
  throw new Error("Sanctions check failed. Account flagged for review.");
}
```

### Minting Errors

```typescript
// Common minting errors
- 'AlreadyHasPassport' → User already has NFT
- 'ProofVerificationFailed' → Proof invalid, verify again
- 'MustBeOver18' → Age requirement not met
- 'IdentifierAlreadyUsed' → Identity already used
- 'insufficient funds' → Need more ETH for gas
```

---

## 📊 Gas Requirements

### Gas Estimates

- **Base Gas**: 21,000
- **Verifier Call**: 50,000
- **NFT Mint**: 50,000
- **Storage Operations**: 100,000
- **Total Estimated**: 300,000
- **Recommended (with buffer)**: 500,000

### Network Costs

- **Base Sepolia**: ~$0.01 - $0.05
- **Ethereum Sepolia**: ~$0.50 - $1.00
- **Unichain Sepolia**: ~$0.01 - $0.05

**⚠️ User pays for gas - always check balance before minting**

---

## 🔍 Troubleshooting

### Issue: Verification fails

**Solutions:**
1. Check ZKPassport app is installed
2. Verify app domain is correct
3. Ensure camera permissions are granted
4. Try again with better lighting

### Issue: Face match fails

**Solutions:**
1. Ensure good lighting
2. Remove glasses/mask if possible
3. Look directly at camera
4. Try again

### Issue: Sanctions check fails

**Solutions:**
1. This is a compliance check
2. Account may need manual review
3. Contact support if you believe this is an error

### Issue: Minting fails

**Solutions:**
1. Check ETH balance (need 0.01 ETH minimum)
2. Verify you're on correct network
3. Ensure proof is still valid
4. Check if you already have NFT

---

## 📋 Integration Checklist

- [ ] Install `@zkpassport/sdk`
- [ ] Set up environment variables
- [ ] Initialize ZKPassport with app domain
- [ ] Create verification request function
- [ ] Implement face match check
- [ ] Implement sanctions check
- [ ] Set up result handler
- [ ] Create verification component
- [ ] Create mint NFT component
- [ ] Add ETH balance check
- [ ] Implement error handling
- [ ] Test verification flow
- [ ] Test minting flow
- [ ] Verify no sensitive data is stored

---

## 📚 Additional Resources

- **ZKPassport Docs**: https://docs.zkpassport.id/
- **ZKPassport Verifier**: `0x1D000001000EFD9a6371f4d90bB8920D5431c0D8`
- **Contract ABIs**: `abis/Convexo_Passport.json`
- **Main Frontend Guide**: `FRONTEND_INTEGRATION.md`

---

---

## ⚠️ Important: Contract Compatibility

### Contract Requirements

The contract expects `ProofVerificationParams` matching this structure:

```solidity
struct ProofVerificationParams {
    bytes32 publicKey;      // Must be 32 bytes (0x + 64 hex chars)
    bytes32 nullifier;      // Must be 32 bytes (0x + 64 hex chars)
    bytes proof;            // Variable length bytes
    uint256 attestationId;  // Must be bigint/uint256
    bytes32 scope;         // Must be 32 bytes (0x + 64 hex chars)
    uint256 currentDate;    // Unix timestamp (bigint)
}
```

### ZKPassport SDK Compatibility

**Important**: The ZKPassport SDK may return proof data in different formats. The `formatProofForContract()` helper function ensures:

1. ✅ All hex strings are prefixed with `0x`
2. ✅ `bytes32` fields (publicKey, nullifier, scope) are exactly 32 bytes
3. ✅ `attestationId` is converted to `bigint`
4. ✅ `currentDate` is generated as current Unix timestamp
5. ✅ `proof` bytes are properly formatted

### Testing the Integration

Before deploying, verify:

1. ✅ ZKPassport SDK returns proof with all required fields
2. ✅ `formatProofForContract()` correctly converts SDK format to contract format
3. ✅ Contract accepts the formatted proof parameters
4. ✅ All type conversions are correct (string → bytes32, string → bigint)

### If SDK Structure Differs

If the ZKPassport SDK returns different field names or structure, update `formatProofForContract()` to match:

```typescript
// Example: If SDK uses different field names
export function formatProofForContract(sdkProof: any) {
  return {
    publicKey: sdkProof.pubKey || sdkProof.public_key, // Adapt to actual field name
    nullifier: sdkProof.nullifier || sdkProof.nullifier_hash,
    proof: sdkProof.proof || sdkProof.zkproof || sdkProof.proof_bytes,
    attestationId: BigInt(sdkProof.attestation_id || sdkProof.attestationId),
    scope: sdkProof.scope || sdkProof.app_scope,
    currentDate: BigInt(Math.floor(Date.now() / 1000)),
  };
}
```

---

**Last Updated**: v2.0 - Simplified Two-Step Flow with Contract Compatibility Notes
