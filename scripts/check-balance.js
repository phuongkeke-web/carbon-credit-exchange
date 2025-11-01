const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const network = hre.network.name;
  
  console.log("💰 Balance Checker");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📡 Network:", network);
  console.log();

  const [signer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(signer.address);

  console.log("👤 Your Account:", signer.address);
  console.log("💵 CELO Balance:", hre.ethers.formatEther(balance), "CELO");
  console.log();

  // Check if contract is deployed
  const deploymentFile = `deployment-${network}.json`;
  
  if (fs.existsSync(deploymentFile)) {
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    const contractAddress = deploymentInfo.contractAddress;
    
    console.log("📋 Carbon Credit Exchange Contract:");
    console.log("   Address:", contractAddress);
    
    try {
      const exchange = await hre.ethers.getContractAt("CarbonCreditExchange", contractAddress);
      
      // Get user's projects
      const userProjects = await exchange.getUserProjects(signer.address);
      console.log("   Your Projects:", userProjects.length);
      
      // Get total retired credits
      const retiredCredits = await exchange.getUserRetiredCredits(signer.address);
      console.log("   Retired Credits:", retiredCredits.toString(), "tonnes CO2");
      
      // Check balances for each project
      if (userProjects.length > 0) {
        console.log();
        console.log("🌱 Your Carbon Credits:");
        for (const projectId of userProjects) {
          const balance = await exchange.balanceOf(signer.address, projectId);
          const project = await exchange.projects(projectId);
          console.log(`   Project #${projectId}: ${balance.toString()} credits (${project.name})`);
        }
      }
      
      // Check total stats
      const totalProjects = await exchange.getTotalProjects();
      const totalOrders = await exchange.getTotalOrders();
      console.log();
      console.log("📊 Contract Statistics:");
      console.log("   Total Projects:", totalProjects.toString());
      console.log("   Total Orders:", totalOrders.toString());
      
    } catch (error) {
      console.log("   ⚠️  Could not fetch contract data");
    }
  } else {
    console.log("ℹ️  No contract deployed on this network");
  }
  
  console.log();
  console.log("💡 Need more CELO?");
  console.log("   Visit: https://faucet.celo.org/sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
