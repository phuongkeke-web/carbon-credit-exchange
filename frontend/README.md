# Carbon Credit Exchange Frontend

Modern React frontend for the Carbon Credit Exchange DApp on Celo blockchain.

## Features

- 🌱 Create carbon offset projects
- 💰 Trade carbon credits as ERC-1155 tokens
- 🔥 Retire credits for carbon offsetting
- 🛒 Built-in marketplace
- 🦊 MetaMask integration
- 📊 Real-time stats and balances

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **ethers.js 6** - Blockchain interaction
- **Celo Sepolia** - Testnet

## Contract

- **Address**: `0xFBc1839eA6A6De2c92Fd06e67d8853e66aC05848`
- **Network**: Celo Sepolia (Chain ID: 11142220)
- **Explorer**: https://sepolia.celoscan.io/address/0xFBc1839eA6A6De2c92Fd06e67d8853e66aC05848

## Usage

1. Connect MetaMask to Celo Sepolia
2. Get testnet CELO from https://faucet.celo.org/sepolia
3. Create carbon projects or browse marketplace
4. Trade credits or retire them for carbon offsetting

## Development

The frontend runs on **port 3001** (different from Skill Marketplace on 3000).

```bash
npm run dev
# Opens at http://localhost:3001
```

## Build

```bash
npm run build
# Output in dist/
```

## License

MIT
