# 🚀 Quick Start Guide - Carbon Credit Exchange

## Deployment Summary

**Contract Address**: `0xFBc1839eA6A6De2c92Fd06e67d8853e66aC05848`  
**Network**: Celo Sepolia Testnet  
**Chain ID**: 11142220  
**Explorer**: https://sepolia.celoscan.io/address/0xFBc1839eA6A6De2c92Fd06e67d8853e66aC05848

---

## ⚡ 5-Minute Setup

### 1. Install Dependencies (if not done)
```bash
npm install
```

### 2. Compile Contract
```bash
npm run compile
```

### 3. Run Tests
```bash
npm test
```

### 4. Deploy (Already Done!)
```bash
npm run deploy:testnet
```

✅ **Contract is already deployed and ready to use!**

---

## 🎯 Quick Interaction Examples

### Using the Interact Script

```bash
node scripts/interact.js
```

This will show you:
- Your wallet balance
- How to register a carbon project
- How to mint credits
- How to create sell orders
- How to purchase credits
- How to retire credits

### Using Hardhat Console

```bash
npx hardhat console --network celoSepolia
```

Then run:

```javascript
// Connect to contract
const Exchange = await ethers.getContractFactory("CarbonCreditExchange");
const exchange = Exchange.attach("0xFBc1839eA6A6De2c92Fd06e67d8853e66aC05848");

// Get signer
const [deployer] = await ethers.getSigners();
console.log("Account:", deployer.address);

// Check total projects
const total = await exchange.getTotalProjects();
console.log("Total projects:", total.toString());

// Create a project
const tx = await exchange.createProject(
    "Solar Farm Project",
    "California, USA",
    "Solar Energy",
    ethers.parseUnits("5000", 0),
    ethers.parseEther("0.01"),
    "ipfs://QmExample"
);
await tx.wait();
console.log("Project created!");

// Check my balance for project #1
const balance = await exchange.balanceOf(deployer.address, 1);
console.log("My credits:", balance.toString());
```

---

## 📱 Add to MetaMask

### Celo Sepolia Network Settings

1. Open MetaMask
2. Click Networks → Add Network → Add Network Manually
3. Enter:
   - **Network Name**: Celo Sepolia
   - **RPC URL**: `https://forno.celo-sepolia.celo-testnet.org`
   - **Chain ID**: `11142220`
   - **Currency Symbol**: CELO
   - **Block Explorer**: `https://sepolia.celoscan.io`

### Import Contract in MetaMask

1. Go to Assets → Import Tokens
2. Select "Custom Token"
3. Enter Contract Address: `0xFBc1839eA6A6De2c92Fd06e67d8853e66aC05848`
4. For ERC-1155, you'll need to specify the token ID (project ID)

---

## 🌟 Try These First Actions

### 1. Create Your First Carbon Project

```javascript
const tx = await exchange.createProject(
    "Amazon Reforestation 2024",
    "Brazil",
    "Reforestation",
    10000, // 10,000 tonnes CO2
    ethers.parseEther("0.015"), // 0.015 CELO per tonne
    "ipfs://metadata-uri"
);
await tx.wait();
```

### 2. List Credits for Sale

```javascript
const tx = await exchange.createSellOrder(
    1, // projectId
    1000, // amount
    ethers.parseEther("0.02") // price per credit
);
await tx.wait();
```

### 3. Buy Credits (from another account)

```javascript
const tx = await exchange.purchaseCredits(
    1, // orderId
    100, // amount
    { value: ethers.parseEther("2.0") }
);
await tx.wait();
```

### 4. Retire Credits (Carbon Offset)

```javascript
const tx = await exchange.retireCredits(
    1, // projectId
    50, // amount
    "Q4 2024 Carbon Neutrality"
);
await tx.wait();
```

---

## 🔍 View Functions (No Gas Cost)

```javascript
// Get total projects
await exchange.getTotalProjects();

// Get project details
await exchange.projects(1);

// Get your projects
await exchange.getUserProjects(yourAddress);

// Get your credit balance
await exchange.balanceOf(yourAddress, projectId);

// Get your total retired credits
await exchange.getUserRetiredCredits(yourAddress);

// Get project retirements
await exchange.getProjectRetirements(projectId);

// Get sell order details
await exchange.sellOrders(orderId);
```

---

## 🛠️ Useful Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to testnet
npm run deploy:testnet

# Verify on Celoscan
npm run verify

# Interact with contract
node scripts/interact.js

# Start Hardhat console
npx hardhat console --network celoSepolia
```

---

## 💰 Get Testnet CELO

Visit: https://faucet.celo.org/sepolia

Enter your address: `0x2F83a41E77c57B065Be5022c11595f4bf2eE9eF1`

---

## 📊 Contract Info

```javascript
{
  "address": "0xFBc1839eA6A6De2c92Fd06e67d8853e66aC05848",
  "network": "Celo Sepolia",
  "chainId": 11142220,
  "deployer": "0x2F83a41E77c57B065Be5022c11595f4bf2eE9eF1",
  "platformFee": "2%",
  "tokenStandard": "ERC-1155"
}
```

---

## 🎓 Learning Resources

- [Full README](./README.md) - Complete documentation
- [Contract Code](./contracts/CarbonCreditExchange.sol) - Source code
- [Tests](./test/CarbonCreditExchange.test.js) - 24 comprehensive tests
- [Celo Docs](https://docs.celo.org/) - Celo blockchain documentation
- [ERC-1155 Standard](https://eips.ethereum.org/EIPS/eip-1155) - Token standard

---

## 🆘 Troubleshooting

### "Insufficient balance"
- Get testnet CELO from faucet
- Check balance: `npx hardhat run scripts/check-balance.js --network celoSepolia`

### "Insufficient credits"
- You need to own credits before selling/retiring
- Create a project first, or buy from existing orders

### "Cannot buy own credits"
- Use a different account to test buying
- Or have a friend buy from your sell order

### "Network not found"
- Make sure you're on Celo Sepolia (chainId: 11142220)
- Add network to MetaMask using settings above

---

**🌱 Happy Carbon Trading!**
