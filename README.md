# Convexo Protocol Frontend

A Next.js frontend application for the Convexo Protocol - Reducing the funding gap for SMEs in Latin America using stablecoins, NFT-permissioned liquidity pools, and vaults.

Convexo Protocol bridges the gap between international investors and Latin American SMEs through compliant, on-chain lending infrastructure. Access liquidity pools, create funding vaults, and invest in tokenized bonds.


[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deployed](https://img.shields.io/badge/Deployed-Base%20Sepolia-blue)](https://sepolia.basescan.org)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Features](#features)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [Deployment](#deployment)

---

## 🌟 Overview

Convexo Protocol bridges the gap between international investors and Latin American SMEs through compliant, on-chain lending infrastructure. This frontend application provides a clean, user-friendly interface for:

- **Enterprises (SMEs)**: Create funding vaults, manage invoices, and access liquidity
- **Investors**: Browse and invest in tokenized bond vaults
- **Admins**: Manage NFTs and protocol settings

### Key Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern, responsive styling
- **RainbowKit** - Wallet connection UI
- **Wagmi** - Ethereum React hooks
- **Viem** - TypeScript Ethereum library

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- WalletConnect Project ID ([Get one here](https://cloud.walletconnect.com/))
- Pinata JWT Token ([Get one here](https://app.pinata.cloud/))

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add:
   ```bash
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   PINATA_JWT=your_pinata_jwt_token
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser

For detailed setup instructions, see [QUICKSTART.md](./QUICKSTART.md).

---

## ✨ Features

### User Views

#### 🏢 Enterprise Dashboard
- View reputation tier and NFT ownership
- Create funding vaults (Tier 2 required)
- Create invoice factoring agreements (Tier 1 required)
- Upload contract PDFs to IPFS via Pinata
- Create on-chain contract agreements

#### 💰 Investor Dashboard
- Browse available vaults with real-time metrics
- View TVL, APY, and maturity dates
- Invest USDC in tokenized bond vaults
- Track investment returns

#### ⚙️ Admin Dashboard
- Mint Convexo_LPs NFTs (Tier 1 - Compliance)
- Mint Convexo_Vaults NFTs (Tier 2 - Credit Scoring)
- Manage protocol settings
- Restricted to admin address only

#### 💵 Funding & Conversion
- **Funding Page**: Request ECOP minting or redemption (agent-assisted)
- **Conversion Page**: Swap ECOP/USDC via Uniswap V4

#### 📄 Contracts Management
- Upload PDF contracts to Pinata IPFS
- Create on-chain contract agreements
- Support for 3 product types:
  - Tokenized Bond Vaults
  - Invoice Factoring
  - Tokenized Bond Credits

### Technical Features

- ✅ **RainbowKit Wallet Connection** - Support for MetaMask, WalletConnect, Coinbase Wallet, and more
- ✅ **Real-time Contract Interactions** - Direct interaction with deployed smart contracts
- ✅ **NFT-based Access Control** - Tier-based permissions system
- ✅ **IPFS Integration** - PDF upload to Pinata for contract storage
- ✅ **Request-based Funding** - Agent-assisted ECOP minting and redemption
- ✅ **Transaction Tracking** - Real-time status updates
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Dark Mode Support** - Automatic theme switching

---

## 📁 Project Structure

```
frontendconvexo/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin dashboard page
│   ├── contracts/                # Contract management page
│   ├── conversion/               # ECOP/USDC conversion page
│   ├── enterprise/               # Enterprise/SME dashboard
│   ├── funding/                  # ECOP minting/burning page
│   ├── investor/                 # Investor dashboard
│   ├── api/
│   │   └── upload-pinata/        # Pinata IPFS upload API route
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── providers.tsx              # Wagmi & RainbowKit providers
│
├── components/                    # React components
│   ├── CreateVaultForm.tsx       # Vault creation form
│   ├── DashboardLayout.tsx       # Main layout wrapper
│   ├── InvoiceFactoringForm.tsx   # Invoice creation form
│   ├── PinataUpload.tsx          # PDF upload component
│   ├── Sidebar.tsx               # Navigation sidebar
│   └── VaultCard.tsx             # Vault display card
│
├── lib/                          # Library code
│   ├── contracts/
│   │   ├── addresses.ts          # Contract addresses
│   │   ├── abis.ts               # Contract ABIs
│   │   └── ecopAbi.ts            # ECOP token ABI
│   ├── hooks/
│   │   ├── useNFTBalance.ts      # NFT ownership hook
│   │   ├── useUserReputation.ts  # Reputation tier hook
│   │   └── useVaults.ts          # Vault data hooks
│   └── wagmi/
│       └── config.ts             # Wagmi configuration
│
├── abis/                         # Contract ABIs (JSON files)
├── public/                       # Static assets
└── addresses.json                # Contract addresses by network
```

---

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Quick setup guide and getting started
- **[README_FRONTEND.md](./README_FRONTEND.md)** - Detailed frontend documentation
- **[FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)** - Contract integration details
- **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** - System architecture overview
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and changes

---

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env.local` file in the root directory:

```bash
# WalletConnect Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

# Pinata IPFS Configuration
PINATA_JWT=your_pinata_jwt_token_here
```

### Getting API Keys

1. **WalletConnect Project ID**
   - Visit [https://cloud.walletconnect.com/](https://cloud.walletconnect.com/)
   - Create a new project or use existing
   - Copy the Project ID

2. **Pinata JWT Token**
   - Visit [https://app.pinata.cloud/](https://app.pinata.cloud/)
   - Navigate to **API Keys** section
   - Create a new API key or use existing
   - Copy the **JWT token** (starts with `eyJ...`)
   - Used for uploading PDF contracts to IPFS

---

## 🛠️ Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Network Configuration

The app is configured for **Base Sepolia** testnet (Chain ID: 84532).

To change networks, update `lib/wagmi/config.ts`.

### Contract Addresses

All contract addresses are stored in:
- `lib/contracts/addresses.ts` - TypeScript constants
- `addresses.json` - JSON format with deployment info

See [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) for complete contract details.

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

### Environment Variables for Production

Make sure to set these in your deployment platform:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `PINATA_JWT`

---

## 🔗 Important Links

- **Base Sepolia Explorer**: [https://sepolia.basescan.org](https://sepolia.basescan.org)
- **Base Sepolia Faucet**: [https://www.coinbase.com/faucets/base-ethereum-goerli-faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
- **WalletConnect Cloud**: [https://cloud.walletconnect.com](https://cloud.walletconnect.com)
- **Pinata Dashboard**: [https://app.pinata.cloud](https://app.pinata.cloud)

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

## 📧 Support

For questions or issues:
- Check the [QUICKSTART.md](./QUICKSTART.md) for common issues
- Review [README_FRONTEND.md](./README_FRONTEND.md) for detailed documentation
- Open an issue on GitHub

---

**Built with ❤️ for Latin American SMEs**
