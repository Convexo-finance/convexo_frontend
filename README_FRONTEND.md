# Frontend Documentation

Detailed documentation for the Convexo Protocol frontend application.

## 📋 Table of Contents

- [Architecture](#architecture)
- [Pages & Routes](#pages--routes)
- [Components](#components)
- [Hooks](#hooks)
- [Contract Integration](#contract-integration)
- [State Management](#state-management)
- [Styling](#styling)
- [API Routes](#api-routes)

---

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Web3**: Wagmi v2, Viem v2, RainbowKit v2
- **State**: React Query (via Wagmi)

### Project Structure

```
app/                    # Next.js App Router pages
components/             # Reusable React components
lib/                    # Shared utilities and configurations
  contracts/            # Contract addresses and ABIs
  hooks/                # Custom React hooks
  wagmi/                # Wagmi configuration
abis/                   # Contract ABI JSON files
public/                 # Static assets
```

---

## 📄 Pages & Routes

### `/` - Dashboard
Home page with navigation cards to different views.

### `/enterprise` - Enterprise Dashboard
- Displays user reputation tier and NFT ownership
- Create funding vaults (requires Tier 2)
- Create invoice factoring agreements (requires Tier 1)
- Access to contract creation

### `/investor` - Investor Dashboard
- Browse all available vaults
- View vault metrics (TVL, APY, maturity)
- Invest USDC in vaults
- Track investments

### `/admin` - Admin Dashboard
- Mint Convexo_LPs NFTs (Tier 1)
- Mint Convexo_Vaults NFTs (Tier 2)
- Restricted to admin address: `0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8`

### `/funding` - Funding Page
- Mint ECOP stablecoin from fiat
- Burn ECOP stablecoin to redeem fiat
- View ECOP balance

### `/conversion` - Conversion Page
- Swap ECOP/USDC via Uniswap V4
- View exchange rates
- Approve and execute swaps

### `/contracts` - Contracts Management
- Upload PDF contracts to Pinata IPFS
- Create on-chain contract agreements
- View contract information
- Copy document hashes for use in vault/invoice creation

---

## 🧩 Components

### Layout Components

#### `DashboardLayout`
Main layout wrapper that includes:
- Sidebar navigation
- Content area
- Responsive design

#### `Sidebar`
Left-side navigation bar with:
- Navigation links
- Active route highlighting
- Wallet connection button

### Form Components

#### `CreateVaultForm`
Form for creating funding vaults:
- Vault name and symbol
- Principal amount (USDC)
- Interest rate
- Maturity period
- Optional contract hash

#### `InvoiceFactoringForm`
Form for creating invoice factoring agreements:
- Invoice amount (USDC)
- Maturity days
- Optional contract hash

#### `PinataUpload`
PDF upload component:
- Drag & drop interface
- File validation (PDF only, max 10MB)
- Upload progress
- Auto-fills IPFS hash on success

### Display Components

#### `VaultCard`
Displays vault information:
- Vault name and address
- Metrics (TVL, APY, progress)
- Investment interface
- USDC approval and investment flow

---

## 🪝 Hooks

### Custom Hooks

#### `useUserReputation`
Fetches and interprets user's reputation tier:
```typescript
const { tier, hasCompliantAccess, hasCreditscoreAccess } = useUserReputation();
```

Returns:
- `tier`: 0, 1, or 2
- `hasCompliantAccess`: boolean (tier >= 1)
- `hasCreditscoreAccess`: boolean (tier >= 2)

#### `useNFTBalance`
Checks user's NFT ownership:
```typescript
const { hasLPsNFT, hasVaultsNFT, lpsBalance, vaultsBalance } = useNFTBalance();
```

#### `useVaultCount`
Gets total number of vaults:
```typescript
const { count, isLoading } = useVaultCount();
```

#### `useVaultAddress`
Gets vault address by index:
```typescript
const { vaultAddress, isLoading } = useVaultAddress(index);
```

---

## 🔗 Contract Integration

### Contract Addresses

All addresses are stored in `lib/contracts/addresses.ts`:

```typescript
export const CONTRACTS = {
  BASE_SEPOLIA: {
    CONVEXO_LPS: '0x4ACB3B523889f437D9FfEe9F2A50BBBa9580198d',
    CONVEXO_VAULTS: '0xc056c0Ddf959b8b63fb6Bc73b5E79e85a6bFB9b5',
    VAULT_FACTORY: '0xDe8daB3182426234ACf68E4197A1eDF5172450dD',
    INVOICE_FACTORING: '0xbc4023284D789D7EB8512c1EDe245C77591a5D96',
    CONTRACT_SIGNER: '0x87af0C8203C84192dBf07f4B6D934fD00eB3F723',
    // ... more contracts
  },
  IPFS: {
    CONVEXO_LPS_URI: 'ipfs://...',
    CONVEXO_VAULTS_URI: 'ipfs://...',
  },
};
```

### Contract ABIs

ABIs are imported from `lib/contracts/abis.ts`:
- ConvexoLPsABI
- ConvexoVaultsABI
- VaultFactoryABI
- InvoiceFactoringABI
- ContractSignerABI
- TokenizedBondVaultABI
- And more...

### Reading from Contracts

```typescript
import { useContractRead } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts/addresses';
import { VaultFactoryABI } from '@/lib/contracts/abis';

const { data } = useContractRead({
  address: CONTRACTS.BASE_SEPOLIA.VAULT_FACTORY,
  abi: VaultFactoryABI,
  functionName: 'getVaultCount',
  query: { enabled: !!address },
});
```

### Writing to Contracts

```typescript
import { useWriteContract } from 'wagmi';

const { writeContract, isPending } = useWriteContract();

writeContract({
  address: CONTRACTS.BASE_SEPOLIA.VAULT_FACTORY,
  abi: VaultFactoryABI,
  functionName: 'createVault',
  args: [borrower, contractHash, principal, interest, fee, maturity, name, symbol],
});
```

---

## 📊 State Management

### Wagmi Hooks

The app uses Wagmi v2 hooks for all blockchain interactions:
- `useAccount()` - Current connected account
- `useContractRead()` - Read contract data
- `useWriteContract()` - Write to contracts
- `useWaitForTransactionReceipt()` - Wait for transaction confirmation

### React Query

Wagmi uses React Query under the hood for:
- Automatic caching
- Background refetching
- Loading states
- Error handling

---

## 🎨 Styling

### Tailwind CSS

The app uses Tailwind CSS for styling with:
- Dark mode support (via `dark:` prefix)
- Responsive design (mobile-first)
- Custom color scheme
- Consistent spacing and typography

### Theme Colors

- Primary: Blue (`bg-blue-600`)
- Success: Green (`bg-green-600`)
- Error: Red (`bg-red-600`)
- Background: Gray scale with dark mode variants

---

## 🔌 API Routes

### `/api/upload-pinata`

Handles PDF uploads to Pinata IPFS using Pinata v3 API.

**Method**: POST  
**Body**: FormData with `file` field  
**Response**:
```json
{
  "success": true,
  "ipfsHash": "bafkre...",
  "ipfsUri": "ipfs://bafkre...",
  "pinataUrl": "https://gateway.pinata.cloud/ipfs/bafkre...",
  "cid": "bafkre..."
}
```

**Validation**:
- File type: PDF only
- File size: Max 10MB

**Environment Variable**: `PINATA_JWT` (required)

**API Endpoint**: `https://uploads.pinata.cloud/v3/files`

**Privacy Note**: 
- Files are uploaded to **public IPFS** by default
- Anyone with the IPFS hash can access the document
- For private documents, consider:
  - Using `network=private` parameter (requires Pinata Private IPFS subscription)
  - Encrypting documents before upload
  - Using a different storage solution for sensitive data

---

## 🔐 Security

### API Keys

- **WalletConnect Project ID**: Public (NEXT_PUBLIC_ prefix)
- **Pinata JWT**: Server-side only (no NEXT_PUBLIC_ prefix)

### Access Control

- Admin functions check admin address
- NFT-based access control via hooks
- Contract-level permissions enforced

---

## 🐛 Troubleshooting

### Common Issues

**Wallet won't connect:**
- Check WalletConnect Project ID is set
- Ensure on Base Sepolia network
- Try disconnecting and reconnecting

**Transactions fail:**
- Check ETH balance for gas
- Verify NFT ownership for restricted functions
- Check contract permissions

**Upload fails:**
- Verify PINATA_JWT is set correctly
- Check file is PDF and under 10MB
- Check Pinata API key permissions

**Build errors:**
- Run `npm install` to ensure dependencies are installed
- Clear `.next` folder: `rm -rf .next`
- Check TypeScript errors: `npm run build`

---

## 📖 Additional Resources

- [Wagmi Documentation](https://wagmi.sh)
- [RainbowKit Documentation](https://rainbowkit.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Viem Documentation](https://viem.sh)

---

## 🔄 Version History

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.
