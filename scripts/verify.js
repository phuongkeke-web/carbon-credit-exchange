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

  console.log("🔍 Verifying contract on Celoscan...");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", network);
  console.log();

  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });

    console.log("✅ Contract verified successfully!");
    console.log(`🔗 View on Explorer: ${deploymentInfo.blockExplorer}#code`);
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract already verified!");
    } else {
      console.error("❌ Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
