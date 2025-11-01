// Carbon Credit Exchange Contract Configuration
export const CONTRACT_ADDRESS = "0xFBc1839eA6A6De2c92Fd06e67d8853e66aC05848";

// Celo Sepolia Testnet configuration
export const CELO_SEPOLIA_CONFIG = {
  chainId: "0xAA044C", // 11142220 in hex
  chainName: "Celo Sepolia Testnet",
  nativeCurrency: {
    name: "CELO",
    symbol: "CELO",
    decimals: 18
  },
  rpcUrls: ["https://forno.celo-sepolia.celo-testnet.org"],
  blockExplorerUrls: ["https://sepolia.celoscan.io"]
};

// Contract ABI - All essential functions
export const CONTRACT_ABI = [
  // Write functions
  "function createProject(string name, string location, string projectType, uint256 totalCredits, uint256 pricePerCredit, string metadataURI) external returns (uint256)",
  "function createSellOrder(uint256 projectId, uint256 amount, uint256 pricePerCredit) external returns (uint256)",
  "function purchaseCredits(uint256 orderId, uint256 amount) external payable",
  "function cancelSellOrder(uint256 orderId) external",
  "function retireCredits(uint256 projectId, uint256 amount, string reason) external",
  "function deactivateProject(uint256 projectId) external",
  "function verifyProject(uint256 projectId) external",
  "function updatePlatformFee(uint256 newFeePercent) external",
  "function withdrawFees() external",
  
  // Read functions
  "function projects(uint256) external view returns (uint256 projectId, address issuer, string name, string location, string projectType, uint256 totalCredits, uint256 availableCredits, uint256 pricePerCredit, bool isActive, bool isVerified, uint256 createdAt, string metadataURI)",
  "function sellOrders(uint256) external view returns (uint256 orderId, uint256 projectId, address seller, uint256 amount, uint256 pricePerCredit, bool isActive, uint256 createdAt)",
  "function getTotalProjects() external view returns (uint256)",
  "function getTotalOrders() external view returns (uint256)",
  "function getUserProjects(address user) external view returns (uint256[] memory)",
  "function getUserRetiredCredits(address user) external view returns (uint256)",
  "function getProjectRetirements(uint256 projectId) external view returns (tuple(address user, uint256 amount, uint256 timestamp, string reason)[] memory)",
  "function platformFeePercent() external view returns (uint256)",
  "function accumulatedFees() external view returns (uint256)",
  "function balanceOf(address account, uint256 id) external view returns (uint256)",
  
  // Events
  "event ProjectCreated(uint256 indexed projectId, address indexed owner, string name, uint256 totalCredits, uint256 pricePerCredit)",
  "event SellOrderCreated(uint256 indexed orderId, uint256 indexed projectId, address indexed seller, uint256 amount, uint256 pricePerCredit)",
  "event CreditsPurchased(uint256 indexed orderId, uint256 indexed projectId, address indexed buyer, uint256 amount, uint256 totalPrice)",
  "event CreditsRetired(uint256 indexed projectId, address indexed user, uint256 amount, string reason)",
  "event ProjectVerified(uint256 indexed projectId, address indexed verifier)",
  "event SellOrderCancelled(uint256 indexed orderId, address indexed seller)"
];

// Project types for categorization
export const PROJECT_TYPES = [
  "Solar Energy",
  "Wind Energy",
  "Reforestation",
  "Ocean Conservation",
  "Energy Efficiency",
  "Other"
];
