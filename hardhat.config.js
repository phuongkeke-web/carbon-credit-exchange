require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const MNEMONIC = process.env.MNEMONIC || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    celoSepolia: {
      url: "https://forno.celo-sepolia.celo-testnet.org",
      accounts: {
        mnemonic: MNEMONIC,
        path: "m/44'/52752'/0'/0",
      },
      chainId: 11142220,
    },
    celo: {
      url: "https://forno.celo.org",
      accounts: {
        mnemonic: MNEMONIC,
        path: "m/44'/52752'/0'/0",
      },
      chainId: 42220,
    },
  },
  etherscan: {
    apiKey: {
      celoSepolia: process.env.CELOSCAN_API_KEY || "api-key",
      celo: process.env.CELOSCAN_API_KEY || "api-key",
    },
    customChains: [
      {
        network: "celoSepolia",
        chainId: 11142220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://sepolia.celoscan.io",
        },
      },
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io",
        },
      },
    ],
  },
};
