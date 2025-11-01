const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🌱 Deploying Carbon Credit Exchange to Celo...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📤 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "CELO");
  
  if (balance === 0n) {
    console.error("❌ Account has no CELO! Get testnet tokens from https://faucet.celo.org/sepolia");
    process.exit(1);
  }
  
  console.log();
  console.log("⏳ Deploying CarbonCreditExchange contract...");
  
  const CarbonCreditExchange = await hre.ethers.getContractFactory("CarbonCreditExchange");
  const exchange = await CarbonCreditExchange.deploy();
  
  await exchange.waitForDeployment();
  const contractAddress = await exchange.getAddress();
  
  console.log("✅ CarbonCreditExchange deployed to:", contractAddress);
  console.log();
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    deploymentTime: new Date().toISOString(),
    blockExplorer: hre.network.name === "celoSepolia" 
      ? `https://sepolia.celoscan.io/address/${contractAddress}`
      : `https://celoscan.io/address/${contractAddress}`,
  };
  
  const deploymentFile = `deployment-${hre.network.name}.json`;
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("📝 Deployment info saved to:", deploymentFile);
  console.log();
  console.log("🎉 Deployment successful!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 Contract Details:");
  console.log("   Address:", contractAddress);
  console.log("   Network:", hre.network.name);
  console.log("   Chain ID:", hre.network.config.chainId);
  console.log();
  console.log("🔗 View on Explorer:");
  console.log("  ", deploymentInfo.blockExplorer);
  console.log();
  console.log("💡 Next steps:");
  console.log("   1. Verify contract: node scripts/verify.js");
  console.log("   2. Test contract: node scripts/interact.js");
  console.log("   3. Create a carbon project!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
