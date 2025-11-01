const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const network = hre.network.name;
  const deploymentFile = `deployment-${network}.json`;

  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ No deployment found for network: ${network}`);
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contractAddress = deploymentInfo.contractAddress;

  console.log("🌱 Carbon Credit Exchange - Contract Interaction");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📍 Contract:", contractAddress);
  console.log("📡 Network:", network);
  console.log();

  const exchange = await hre.ethers.getContractAt("CarbonCreditExchange", contractAddress);
  const [signer] = await hre.ethers.getSigners();

  console.log("👤 Your account:", signer.address);
  const balance = await hre.ethers.provider.getBalance(signer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "CELO");
  console.log();

  // Get contract stats
  console.log("📊 Contract Statistics:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const totalProjects = await exchange.getTotalProjects();
  const totalOrders = await exchange.getTotalOrders();
  const platformFee = await exchange.platformFeePercent();
  const accumulatedFees = await exchange.accumulatedFees();
  const retiredCredits = await exchange.getUserRetiredCredits(signer.address);

  console.log("Total Projects:", totalProjects.toString());
  console.log("Total Sell Orders:", totalOrders.toString());
  console.log("Platform Fee:", (Number(platformFee) / 100).toFixed(2), "%");
  console.log("Accumulated Fees:", hre.ethers.formatEther(accumulatedFees), "CELO");
  console.log("Your Retired Credits:", retiredCredits.toString(), "tonnes CO2");
  console.log();

  console.log("💡 Example Commands:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  console.log("\n1. Create a Carbon Project:");
  console.log(`
const tx = await exchange.createProject(
  "Amazon Reforestation",
  "Brazil",
  "Reforestation",
  ethers.parseUnits("10000", 0), // 10,000 tonnes CO2
  ethers.parseEther("0.01"), // 0.01 CELO per tonne
  "ipfs://QmExample..."
);
await tx.wait();
  `);

  console.log("\n2. Create Sell Order:");
  console.log(`
const tx = await exchange.createSellOrder(
  1, // projectId
  100, // amount in tonnes
  ethers.parseEther("0.01") // price per tonne
);
await tx.wait();
  `);

  console.log("\n3. Purchase Carbon Credits:");
  console.log(`
const tx = await exchange.purchaseCredits(
  1, // orderId
  10, // amount
  { value: ethers.parseEther("0.1") }
);
await tx.wait();
  `);

  console.log("\n4. Retire Credits (Offset Carbon):");
  console.log(`
const tx = await exchange.retireCredits(
  1, // projectId
  5, // amount
  "Company annual carbon offset"
);
await tx.wait();
  `);

  console.log();
  console.log("🔗 View on Explorer:", deploymentInfo.blockExplorer);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
