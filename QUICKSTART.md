# Quick Start Guide

Get the Convexo frontend up and running in minutes.

## 🚀 3-Step Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment

Create a `.env.local` file in the root directory:

```bash
# WalletConnect (required)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Pinata IPFS (required for contract uploads)
PINATA_JWT=your_pinata_jwt_token_here

# Pinata Gateway (optional but recommended for better performance)
# Get this from Pinata dashboard → Gateways → Copy your gateway subdomain
PINATA_GATEWAY=lime-famous-condor-7.mypinata.cloud
NEXT_PUBLIC_PINATA_GATEWAY=lime-famous-condor-7.mypinata.cloud
```

**Get your API keys:**
- **WalletConnect**: [https://cloud.walletconnect.com](https://cloud.walletconnect.com) → Create project → Copy Project ID
- **Pinata JWT**: [https://app.pinata.cloud](https://app.pinata.cloud) → API Keys → Create key → Copy JWT token
- **Pinata Gateway**: [https://app.pinata.cloud](https://app.pinata.cloud) → Gateways → Copy your gateway subdomain (e.g., `lime-famous-condor-7.mypinata.cloud`)

### Step 3: Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 🔌 Connect Your Wallet

1. Click **"Connect Wallet"** in the sidebar
2. Select your wallet (MetaMask, WalletConnect, Coinbase Wallet, etc.)
3. Switch to **Base Sepolia** network when prompted
4. Approve the connection

> **Note**: Make sure you have test ETH on Base Sepolia for gas fees.

## 🎯 Explore Features

### 👨‍💼 Admin View
**Access**: `/admin` (Admin address only)

- Mint **Convexo_LPs NFT** (Tier 1 - Compliance)
- Mint **Convexo_Vaults NFT** (Tier 2 - Credit Scoring)
- Pre-filled IPFS metadata from Pinata

### 🏢 Enterprise View
**Access**: `/enterprise`

- View reputation tier and NFT ownership
- **Tier 1+**: Create invoice factoring agreements
- **Tier 2**: Create funding vaults
- Upload contract PDFs to IPFS

### 💰 Investor View
**Access**: `/investor`

- Browse all available vaults
- View metrics: TVL, APY, maturity date
- Invest USDC in vaults
- Track investment returns

### 📄 Contracts
**Access**: `/contracts`

- Upload PDF contracts to Pinata IPFS
- Create on-chain contract agreements
- Copy document hashes for vault/invoice creation

### 💵 Funding & Conversion
- **Funding** (`/funding`): Request ECOP minting or redemption (agent-assisted)
- **Conversion** (`/conversion`): Swap ECOP/USDC via Uniswap V4

## ⚠️ Important Notes

- **Network**: All contracts are on **Base Sepolia** testnet (Chain ID: 84532)
- **Gas Fees**: You need test ETH for transactions
- **Investments**: You need test USDC for investing in vaults
- **Admin Access**: Admin functions restricted to specific address

## 🔗 Useful Links

- **Base Sepolia Explorer**: [https://sepolia.basescan.org](https://sepolia.basescan.org)
- **Base Sepolia Faucet**: [https://www.coinbase.com/faucets/base-ethereum-goerli-faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
- **WalletConnect**: [https://cloud.walletconnect.com](https://cloud.walletconnect.com)
- **Pinata**: [https://app.pinata.cloud](https://app.pinata.cloud)

## 🐛 Common Issues

### Wallet Connection
- ✅ Ensure you're on Base Sepolia network
- ✅ Check WalletConnect Project ID is set in `.env.local`
- ✅ Try disconnecting and reconnecting wallet

### Transactions Fail
- ✅ Check ETH balance for gas fees
- ✅ Verify you have required NFTs for restricted functions
- ✅ Ensure contract addresses are correct

### Upload Fails
- ✅ Verify `PINATA_JWT` is set correctly
- ✅ Check file is PDF format and under 10MB
- ✅ Verify Pinata API key has upload permissions
- ✅ (Optional) Set `PINATA_GATEWAY` for better file access performance

### No Vaults Showing
- ✅ Vaults must be created via Enterprise view first
- ✅ Check VaultFactory contract on BaseScan

## 📚 Documentation

- **[README.md](./README.md)** - Main documentation
- **[README_FRONTEND.md](./README_FRONTEND.md)** - Detailed frontend docs
- **[FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)** - Contract integration
- **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** - System overview

