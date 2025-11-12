# Convexo Frontend

A clean and structured Next.js frontend for the Convexo Protocol, enabling interactions with deployed smart contracts on Base Sepolia.

## Features

- **RainbowKit Wallet Connection**: Easy wallet connection with support for multiple wallets
- **Three User Views**:
  - **Admin View**: Mint NFTs and manage protocol settings
  - **Enterprise View**: Create vaults, manage invoices, and access funding
  - **Investor View**: Browse vaults, invest USDC, and track returns
- **Real Contract Interactions**: All features interact directly with deployed contracts
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Modern, responsive UI

## Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- WalletConnect Project ID (get one at https://cloud.walletconnect.com)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file:
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
frontendconvexo/
├── app/
│   ├── admin/          # Admin dashboard
│   ├── enterprise/     # Enterprise/SME dashboard
│   ├── investor/       # Investor dashboard
│   ├── layout.tsx      # Root layout with providers
│   ├── page.tsx        # Home page
│   └── providers.tsx    # Wagmi & RainbowKit providers
├── components/
│   ├── CreateVaultForm.tsx      # Form to create funding vaults
│   ├── InvoiceFactoringForm.tsx # Form to create invoices
│   └── VaultCard.tsx            # Vault display and investment
├── lib/
│   ├── contracts/
│   │   ├── addresses.ts  # Contract addresses
│   │   └── abis.ts       # Contract ABIs
│   ├── hooks/
│   │   ├── useNFTBalance.ts      # Check NFT ownership
│   │   ├── useUserReputation.ts  # Get user reputation tier
│   │   └── useVaults.ts          # Get vault data
│   └── wagmi/
│       └── config.ts     # Wagmi/RainbowKit configuration
└── abis/                # Contract ABIs (from backend)
```

## Usage

### Admin View

1. Connect your wallet (must be admin)
2. Navigate to `/admin`
3. Mint Convexo_LPs NFT (Tier 1) or Convexo_Vaults NFT (Tier 2) for verified users
4. Fill in recipient address, token ID, and optional URI

### Enterprise View

1. Connect your wallet
2. Navigate to `/enterprise`
3. View your reputation tier and NFT ownership status
4. **If Tier 1+**: Create invoices for factoring
5. **If Tier 2**: Create funding vaults to request investment

### Investor View

1. Connect your wallet
2. Navigate to `/investor`
3. Browse all available vaults with metrics (TVL, APY, progress)
4. Click "Invest in Vault" to invest USDC
5. Approve USDC spending if needed
6. Track your investments and returns

## Contract Addresses

All contracts are deployed on **Base Sepolia (Chain ID: 84532)**:

- Convexo_LPs: `0x4ACB3B523889f437D9FfEe9F2A50BBBa9580198d`
- Convexo_Vaults: `0xc056c0Ddf959b8b63fb6Bc73b5E79e85a6bFB9b5`
- ReputationManager: `0x99612857Bb85b1de04d06385E44Fa53DC2aF79E1`
- VaultFactory: `0xDe8daB3182426234ACf68E4197A1eDF5172450dD`
- InvoiceFactoring: `0xbc4023284D789D7EB8512c1EDe245C77591a5D96`
- TokenizedBondCredits: `0xC058588A8D82B2E2129119B209c80af8bF3d4961`
- USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## Network Configuration

The app is configured for **Base Sepolia** testnet. To switch networks, update `lib/wagmi/config.ts`.

## Development

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Lint

```bash
npm run lint
```

## Key Features

### Wallet Connection
- Uses RainbowKit for a beautiful wallet connection UI
- Supports MetaMask, WalletConnect, Coinbase Wallet, and more
- Automatically switches to Base Sepolia network

### Contract Interactions
- All contract calls use wagmi hooks
- Real-time updates using React Query
- Transaction status tracking
- Error handling with user-friendly messages

### User Reputation System
- Automatically checks user's reputation tier
- Tier 0: No access
- Tier 1: Compliant (can use pools and invoice factoring)
- Tier 2: Creditscore (full access including vault creation)

## Troubleshooting

### Wallet Connection Issues
- Ensure you're on Base Sepolia network
- Check that your WalletConnect Project ID is set correctly
- Try disconnecting and reconnecting your wallet

### Transaction Failures
- Check you have enough ETH for gas
- Verify you have sufficient USDC balance (for investments)
- Ensure you have the required NFTs for certain actions
- Check contract permissions (admin roles, etc.)

### Network Issues
- Verify RPC endpoint is accessible
- Check Base Sepolia network status
- Try switching networks and back

## Next Steps

- Add more detailed vault analytics
- Implement invoice browsing for investors
- Add transaction history
- Implement pool trading interface
- Add real-time notifications for vault updates

## Support

For contract-related questions, see the main [README.md](./README.md) and [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md).

