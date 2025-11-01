# 🌱 Carbon Credit Exchange - Celo DApp

A decentralized marketplace for trading carbon credits on Celo blockchain using ERC-1155 tokens.

## 🌍 What is This?

The Carbon Credit Exchange enables:
- **Project Issuers**: Create and tokenize carbon offset projects
- **Traders**: Buy and sell carbon credits in a decentralized marketplace  
- **Companies**: Purchase and retire credits to offset their carbon footprint
- **Transparency**: All transactions recorded on-chain with full traceability

Each carbon project is represented as an ERC-1155 token, where each token represents 1 tonne of CO2 offset.

## ✨ Unique Features

1. **Multi-Project Support**: ERC-1155 allows multiple carbon projects in one contract
2. **Marketplace Built-in**: Create sell orders and trade credits without external DEX
3. **Credit Retirement**: Permanently burn credits to prove carbon offsetting
4. **Project Verification**: Platform can verify legitimate carbon projects
5. **On-Chain Transparency**: All projects, trades, and retirements are public
6. **Low Fees**: Only 2% platform fee on trades

## 📋 Prerequisites

- Node.js v16+
- Hardhat
- MetaMask or Celo wallet
- Testnet CELO tokens

## 🚀 Quick Start

### 1. Installation

```bash
cd carbon-credit-exchange
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env and add your MNEMONIC
```

### 3. Compile

```bash
npm run compile
```

### 4. Test

```bash
npm test
```

### 5. Deploy to Celo Sepolia Testnet

```bash
npm run deploy:testnet
```

## 📝 Smart Contract Functions

### For Project Issuers

**Create Carbon Project**
```solidity
createProject(
    string name,
    string location, 
    string projectType,
    uint256 totalCredits,
    uint256 pricePerCredit,
    string metadataURI
)
```

**Deactivate Project**
```solidity
deactivateProject(uint256 projectId)
```

### For Traders

**Create Sell Order**
```solidity
createSellOrder(
    uint256 projectId,
    uint256 amount,
    uint256 pricePerCredit
)
```

**Purchase Credits**
```solidity
purchaseCredits(
    uint256 orderId,
    uint256 amount
) payable
```

**Cancel Order**
```solidity
cancelSellOrder(uint256 orderId)
```

### For Carbon Offsetting

**Retire Credits**
```solidity
retireCredits(
    uint256 projectId,
    uint256 amount,
    string reason
)
```

### View Functions

```solidity
getTotalProjects() → uint256
getUserProjects(address) → uint256[]
getUserRetiredCredits(address) → uint256
getProjectRetirements(uint256) → Retirement[]
```

## 🎯 Use Cases

### 1. Carbon Project Developer
```javascript
// Create a reforestation project
const tx = await exchange.createProject(
    "Amazon Rainforest Protection",
    "Brazil",
    "Reforestation",
    ethers.parseUnits("50000", 0), // 50,000 tonnes CO2
    ethers.parseEther("0.015"), // 0.015 CELO per tonne
    "ipfs://QmProjectMetadata..."
);
```

### 2. Carbon Credit Trader
```javascript
// List credits for sale
const tx = await exchange.createSellOrder(
    1, // projectId
    1000, // 1000 tonnes
    ethers.parseEther("0.02") // 0.02 CELO per tonne
);

// Buy credits
const tx = await exchange.purchaseCredits(
    1, // orderId
    100, // buy 100 tonnes
    { value: ethers.parseEther("2.0") }
);
```

### 3. Company Offsetting Carbon
```javascript
// Retire credits to offset emissions
const tx = await exchange.retireCredits(
    1, // projectId
    500, // 500 tonnes
    "Q4 2024 carbon neutrality initiative"
);

// Check total retired
const total = await exchange.getUserRetiredCredits(myAddress);
console.log(`Total offset: ${total} tonnes CO2`);
```

## 🏗️ Project Structure

```
carbon-credit-exchange/
├── contracts/
│   └── CarbonCreditExchange.sol    # Main smart contract
├── scripts/
│   ├── deploy.js                   # Deployment script
│   ├── verify.js                   # Contract verification
│   └── interact.js                 # Interaction examples
├── test/
│   └── CarbonCreditExchange.test.js # Comprehensive tests
├── hardhat.config.js               # Hardhat configuration
├── package.json                    # Dependencies
└── README.md                       # This file
```

## 🧪 Testing

Run the full test suite:

```bash
npm test
```

Test coverage includes:
- ✅ Project creation and verification
- ✅ Sell order creation and management
- ✅ Credit purchasing with payments
- ✅ Credit retirement (burning)
- ✅ Platform fee calculations
- ✅ Admin functions
- ✅ Access control
- ✅ Edge cases and error handling

## 🌐 Network Information

### Celo Sepolia Testnet
- **Chain ID**: 11142220
- **RPC**: https://forno.celo-sepolia.celo-testnet.org
- **Explorer**: https://sepolia.celoscan.io
- **Faucet**: https://faucet.celo.org/sepolia

### Celo Mainnet
- **Chain ID**: 42220
- **RPC**: https://forno.celo.org
- **Explorer**: https://celoscan.io

## 💡 Example Scenarios

### Scenario 1: Solar Farm Project

```javascript
// 1. Create project
await exchange.createProject(
    "Texas Solar Farm 2024",
    "Texas, USA",
    "Solar Energy",
    25000, // 25,000 tonnes CO2 saved
    ethers.parseEther("0.012"),
    "ipfs://solar-farm-data"
);

// 2. Platform verifies project
await exchange.verifyProject(1);

// 3. Issuer lists credits
await exchange.createSellOrder(1, 5000, ethers.parseEther("0.012"));

// 4. Company buys credits
await exchange.purchaseCredits(1, 1000, { value: ethers.parseEther("12") });

// 5. Company retires for annual offset
await exchange.retireCredits(1, 1000, "2024 Carbon Neutrality Goal");
```

## 🔒 Security Features

- ✅ ReentrancyGuard on all payment functions
- ✅ Ownable for admin functions
- ✅ Input validation on all parameters
- ✅ SafeTransfer for token movements
- ✅ Checks-Effects-Interactions pattern
- ✅ No external contract calls during transfers

## 📊 Gas Optimization

- Uses ERC-1155 (more efficient than ERC-721 for multiple tokens)
- Optimized storage patterns
- Minimal external calls
- Efficient event emission

## 🔗 Resources

- [Celo Documentation](https://docs.celo.org/)
- [ERC-1155 Standard](https://eips.ethereum.org/EIPS/eip-1155)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)

## 🤝 Contributing

Contributions welcome! This is a unique DApp demonstrating:
- Environmental impact through blockchain
- ERC-1155 multi-token functionality
- Built-in marketplace mechanics
- Carbon credit lifecycle management

## 📄 License

MIT License

## 🌟 Why This DApp is Unique

Unlike the Skill Marketplace, this DApp:
1. Uses **ERC-1155** (multi-token) instead of ERC-721
2. Focuses on **environmental impact** - carbon offsetting
3. Has **built-in marketplace** with direct buy/sell orders
4. Implements **credit retirement** (permanent burning)
5. Supports **project verification** system
6. Tracks **on-chain carbon impact** metrics
7. Perfect for Celo's **regenerative finance** mission

---

**Built with 🌱 for a greener future on Celo**
