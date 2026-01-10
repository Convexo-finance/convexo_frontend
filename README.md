# Convexo Protocol Frontend

A Next.js frontend application for the Convexo Protocol - Reducing the funding gap for SMEs in Latin America using stablecoins, NFT-permissioned liquidity pools, and vaults.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-2.2-green)](./CHANGELOG_V2.2.md)
[![Deployed](https://img.shields.io/badge/Deployed-3%20Testnets-blue)](https://sepolia.basescan.org)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- WalletConnect Project ID ([Get one here](https://cloud.walletconnect.com/))
- Pinata JWT Token ([Get one here](https://app.pinata.cloud/))

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```bash
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   PINATA_JWT=your_pinata_jwt_token
   NEXT_PUBLIC_PINATA_GATEWAY=lime-famous-condor-7.mypinata.cloud  # Optional
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** and connect your wallet to Base Sepolia

---

## 🎉 What's New in v2.2

### 🔐 Protocol Fee Protection
- **Fixed:** Investors can no longer withdraw protocol fees
- **Security:** Protocol fees are now reserved and protected
- **Transparency:** New `getAvailableForInvestors()` function shows exact withdrawable amount

### ⏱️ Timestamp Tracking
- **Accurate Due Dates:** Calculated from withdrawal time, not creation
- **Complete Timeline:** Track vault creation, funding, contract attachment, and withdrawal
- **New Functions:** `getVaultCreatedAt()`, `getVaultFundedAt()`, `getActualDueDate()`, and more

### 🎯 Improved Completion Logic
- Vault only marked as `Completed` when all parties have withdrawn their funds
- Better state tracking for transparency

**[See Full Changelog →](./CHANGELOG_V2.2.md)**

---

## ✨ Features

### User Views

#### 🏢 Loans Dashboard (`/loans`)
- **Vaults** (`/loans/vaults`): Create tokenized bond vaults (Tier 2 required)
- **Invoices** (`/loans/invoices`): Create invoice factoring agreements (Tier 1 required)
- **Credits** (`/loans/credits`): Create tokenized bond credits (Tier 2 required)

#### 💰 Investments Dashboard (`/investments`)
- Browse available vaults with real-time metrics
- View TVL, APY, and maturity dates
- Invest USDC in tokenized bond vaults
- Track investment returns

#### 🏦 Treasury
- **Funding** (`/funding`): Request ECOP minting or redemption (agent-assisted)
- **Conversion** (`/conversion`): Swap ECOP/USDC via Uniswap V4

#### 📄 Contracts (`/contracts`)
- Upload PDF contracts to Pinata IPFS
- Create on-chain contract agreements
- Support for 3 product types:
  - Tokenized Bond Vaults (Type 0)
  - Invoice Factoring (Type 1)
  - Tokenized Bond Credits (Type 2)

#### 👨‍💼 Admin Dashboard (`/admin`)
- Mint Convexo_LPs NFTs (Tier 1 - Compliance)
- Mint Convexo_Vaults NFTs (Tier 2 - Credit Scoring)
- Restricted to admin address: `0x156d3C1648ef2f50A8de590a426360Cf6a89C6f8`

### Technical Features

- ✅ **RainbowKit Wallet Connection** - MetaMask, WalletConnect, Coinbase Wallet
- ✅ **Real-time Contract Interactions** - Direct interaction with deployed smart contracts
- ✅ **NFT-based Access Control** - Tier-based permissions system
- ✅ **IPFS Integration** - PDF upload to Pinata for contract storage
- ✅ **Request-based Funding** - Agent-assisted ECOP minting and redemption
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Dark Mode Support** - Automatic theme switching

---

## 📁 Project Structure

```
frontendconvexo/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin dashboard
│   ├── contracts/               # Contract management
│   ├── conversion/              # ECOP/USDC conversion
│   ├── funding/                 # ECOP minting/burning
│   ├── investments/             # Investor dashboard
│   ├── loans/                    # Loans dashboard
│   │   ├── vaults/              # Vault creation
│   │   ├── invoices/            # Invoice factoring
│   │   └── credits/             # Bond credits
│   ├── treasury/                # Treasury landing
│   ├── api/                      # API routes
│   │   ├── upload-pinata/       # Pinata IPFS upload
│   │   ├── list-documents/      # List uploaded docs
│   │   └── funding-request/     # Funding requests
│   └── page.tsx                 # Dashboard home
│
├── components/                    # React components
│   ├── Sidebar.tsx              # Left navigation
│   ├── DashboardLayout.tsx      # Layout wrapper
│   ├── CreateVaultForm.tsx      # Vault creation
│   ├── InvoiceFactoringForm.tsx # Invoice creation
│   ├── PinataUpload.tsx         # PDF upload
│   ├── ContractsTable.tsx      # Contract listing
│   └── DashboardStats.tsx      # Dashboard stats
│
├── lib/                          # Library code
│   ├── contracts/
│   │   ├── addresses.ts         # Contract addresses
│   │   ├── abis.ts             # Contract ABIs
│   │   └── ecopAbi.ts          # ECOP token ABI
│   ├── hooks/
│   │   ├── useNFTBalance.ts    # NFT ownership
│   │   └── useUserReputation.ts # Reputation tier
│   └── wagmi/
│       └── config.ts           # Wagmi configuration
│
└── public/                      # Static assets
    └── logo_convexo.png         # Favicon
```

---

## 🔗 Contract Addresses (Base Sepolia)

| Contract | Address | Explorer |
|----------|---------|----------|
| **Convexo_LPs** (NFT) | `0x4ACB3B523889f437D9FfEe9F2A50BBBa9580198d` | [View](https://sepolia.basescan.org/address/0x4ACB3B523889f437D9FfEe9F2A50BBBa9580198d) |
| **Convexo_Vaults** (NFT) | `0xc056c0Ddf959b8b63fb6Bc73b5E79e85a6bFB9b5` | [View](https://sepolia.basescan.org/address/0xc056c0Ddf959b8b63fb6Bc73b5E79e85a6bFB9b5) |
| **VaultFactory** | `0xDe8daB3182426234ACf68E4197A1eDF5172450dD` | [View](https://sepolia.basescan.org/address/0xDe8daB3182426234ACf68E4197A1eDF5172450dD) |
| **InvoiceFactoring** | `0xbc4023284D789D7EB8512c1EDe245C77591a5D96` | [View](https://sepolia.basescan.org/address/0xbc4023284D789D7EB8512c1EDe245C77591a5D96) |
| **TokenizedBondCredits** | `0xC058588A8D82B2E2129119B209c80af8bF3d4961` | [View](https://sepolia.basescan.org/address/0xC058588A8D82B2E2129119B209c80af8bF3d4961) |
| **ContractSigner** | `0x87af0C8203C84192dBf07f4B6D934fD00eB3F723` | [View](https://sepolia.basescan.org/address/0x87af0C8203C84192dBf07f4B6D934fD00eB3F723) |
| **ReputationManager** | `0x99612857Bb85b1de04d06385E44Fa53DC2aF79E1` | [View](https://sepolia.basescan.org/address/0x99612857Bb85b1de04d06385E44Fa53DC2aF79E1) |
| **USDC** | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | [View](https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e) |
| **ECOP** | `0xb934dcb57fb0673b7bc0fca590c5508f1cde955d` | [View](https://sepolia.basescan.org/address/0xb934dcb57fb0673b7bc0fca590c5508f1cde955d) |

**IPFS Metadata:**
- Convexo_LPs: `ipfs://bafkreib7mkjzpdm3id6st6d5vsxpn7v5h6sxeiswejjmrbcb5yoagaf4em`
- Convexo_Vaults: `ipfs://bafkreignxas6gqi7it5ng6muoykujxlgxxc4g7rr6sqvwgdfwveqf2zw3e`

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm start        # Start production server
npm run lint     # Lint code
```

### Network Configuration

The app is configured for **Base Sepolia** testnet (Chain ID: 84532).

To change networks, update `lib/wagmi/config.ts`.

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | ✅ Yes | WalletConnect Project ID |
| `PINATA_JWT` | ✅ Yes | Pinata JWT token for IPFS uploads |
| `PINATA_GATEWAY` | ⚠️ Optional | Pinata gateway subdomain (server-side) |
| `NEXT_PUBLIC_PINATA_GATEWAY` | ⚠️ Optional | Pinata gateway subdomain (client-side) |

**Get API Keys:**
- **WalletConnect**: [https://cloud.walletconnect.com](https://cloud.walletconnect.com) → Create project → Copy Project ID
- **Pinata JWT**: [https://app.pinata.cloud](https://app.pinata.cloud) → API Keys → Create key → Copy JWT token
- **Pinata Gateway**: [https://app.pinata.cloud](https://app.pinata.cloud) → Gateways → Copy subdomain

---

## 🐛 Troubleshooting

### Wallet Connection Issues
- ✅ Ensure you're on **Base Sepolia** network
- ✅ Check `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set in `.env.local`
- ✅ Try disconnecting and reconnecting wallet
- ✅ Clear browser cache and hard refresh

### Transaction Failures
- ✅ Check ETH balance for gas fees
- ✅ Verify you have required NFTs for restricted functions
- ✅ Ensure contract addresses are correct
- ✅ Check transaction on [BaseScan](https://sepolia.basescan.org)

### Upload Failures
- ✅ Verify `PINATA_JWT` is set correctly
- ✅ Check file is PDF format and under 10MB
- ✅ Verify Pinata API key has upload permissions
- ✅ Check Pinata dashboard for API rate limits

### Build Errors
- ✅ Run `npm install` to ensure dependencies are installed
- ✅ Clear `.next` folder: `rm -rf .next`
- ✅ Check TypeScript errors: `npm run build`

---

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

**Required Environment Variables in Production:**
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `PINATA_JWT`
- `PINATA_GATEWAY` (optional)
- `NEXT_PUBLIC_PINATA_GATEWAY` (optional)

---

## 📖 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Web3**: Wagmi v2, Viem v2, RainbowKit v2
- **State**: React Query (via Wagmi)
- **IPFS**: Pinata

---

## 🔗 Useful Links

- **Base Sepolia Explorer**: [https://sepolia.basescan.org](https://sepolia.basescan.org)
- **Base Sepolia Faucet**: [https://www.coinbase.com/faucets/base-ethereum-goerli-faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
- **WalletConnect Cloud**: [https://cloud.walletconnect.com](https://cloud.walletconnect.com)
- **Pinata Dashboard**: [https://app.pinata.cloud](https://app.pinata.cloud)
- **Wagmi Docs**: [https://wagmi.sh](https://wagmi.sh)
- **RainbowKit Docs**: [https://rainbowkit.com](https://rainbowkit.com)

---

## 📝 License

MIT License - see LICENSE file for details

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Built with ❤️ for Latin American SMEs**
