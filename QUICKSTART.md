# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Create a `.env.local` file:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Get your WalletConnect Project ID at: https://cloud.walletconnect.com

### 3. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Connect Your Wallet

1. Click "Connect Wallet" on the home page
2. Select your wallet (MetaMask, WalletConnect, etc.)
3. Switch to **Base Sepolia** network when prompted
4. Approve the connection

## 🎯 Try the Features

### As an Admin
1. Go to `/admin`
2. Mint NFTs for users:
   - **Convexo_LPs NFT**: For Tier 1 (Compliant) access
   - **Convexo_Vaults NFT**: For Tier 2 (Creditscore) access

### As an Enterprise (SME)
1. Go to `/enterprise`
2. Check your reputation tier
3. **If Tier 1+**: Create invoices for factoring
4. **If Tier 2**: Create funding vaults

### As an Investor
1. Go to `/investor`
2. Browse available vaults
3. Click "Invest in Vault"
4. Approve USDC spending (first time)
5. Enter amount and invest
6. Track your returns

## 🔗 Important Links

- **Base Sepolia Explorer**: https://sepolia.basescan.org
- **Base Sepolia Faucet**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- **WalletConnect Cloud**: https://cloud.walletconnect.com

## ⚠️ Important Notes

- All contracts are on **Base Sepolia** testnet
- You need test ETH for gas fees
- You need test USDC for investments (get from faucet or swap)
- Admin functions require admin role on contracts

## 🐛 Troubleshooting

**Can't connect wallet?**
- Make sure you're on Base Sepolia network
- Check your WalletConnect Project ID is set

**Transaction fails?**
- Check you have enough ETH for gas
- Verify you have required NFTs/permissions
- Check contract addresses are correct

**No vaults showing?**
- Vaults need to be created first via Enterprise view
- Check VaultFactory contract for existing vaults

## 📚 Next Steps

- Read [README_FRONTEND.md](./README_FRONTEND.md) for detailed documentation
- Check [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) for contract details
- Explore the codebase to understand the structure

