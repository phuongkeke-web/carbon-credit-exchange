// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CarbonCreditExchange
 * @dev Decentralized marketplace for carbon credit trading using ERC-1155 tokens
 * @notice Each token ID represents a different carbon credit project
 */
contract CarbonCreditExchange is ERC1155, Ownable, ReentrancyGuard {
    
    // ============ State Variables ============
    
    uint256 private _projectIdCounter;
    uint256 private _orderIdCounter;
    uint256 public platformFeePercent = 200; // 2% in basis points
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public accumulatedFees;
    
    // ============ Structs ============
    
    struct CarbonProject {
        uint256 projectId;
        address issuer;
        string name;
        string location;
        string projectType; // e.g., "Reforestation", "Solar", "Wind"
        uint256 totalCredits; // Total credits issued (in tonnes CO2)
        uint256 availableCredits;
        uint256 pricePerCredit; // Price per tonne in wei
        bool isActive;
        bool isVerified; // Verified by platform
        uint256 createdAt;
        string metadataURI; // IPFS or external link
    }
    
    struct SellOrder {
        uint256 orderId;
        uint256 projectId;
        address seller;
        uint256 amount; // Tonnes of CO2
        uint256 pricePerCredit;
        bool isActive;
        uint256 createdAt;
    }
    
    struct Retirement {
        uint256 projectId;
        address retirer;
        uint256 amount;
        uint256 timestamp;
        string reason; // Why credits are retired
    }
    
    // ============ Mappings ============
    
    mapping(uint256 => CarbonProject) public projects;
    mapping(uint256 => SellOrder) public sellOrders;
    mapping(address => uint256[]) public userProjects;
    mapping(address => uint256) public retiredCredits;
    mapping(uint256 => Retirement[]) public projectRetirements;
    
    // ============ Events ============
    
    event ProjectCreated(
        uint256 indexed projectId,
        address indexed issuer,
        string name,
        uint256 totalCredits,
        uint256 pricePerCredit
    );
    
    event ProjectVerified(
        uint256 indexed projectId,
        address indexed verifier
    );
    
    event CreditsIssued(
        uint256 indexed projectId,
        address indexed recipient,
        uint256 amount
    );
    
    event SellOrderCreated(
        uint256 indexed orderId,
        uint256 indexed projectId,
        address indexed seller,
        uint256 amount,
        uint256 pricePerCredit
    );
    
    event CreditsPurchased(
        uint256 indexed orderId,
        uint256 indexed projectId,
        address indexed buyer,
        address seller,
        uint256 amount,
        uint256 totalPrice
    );
    
    event CreditsRetired(
        uint256 indexed projectId,
        address indexed retirer,
        uint256 amount,
        string reason
    );
    
    event ProjectDeactivated(uint256 indexed projectId);
    
    // ============ Constructor ============
    
    constructor() ERC1155("https://api.carboncredit.io/metadata/{id}.json") Ownable(msg.sender) {}
    
    // ============ Project Management ============
    
    /**
     * @dev Create a new carbon credit project
     * @param _name Project name
     * @param _location Geographic location
     * @param _projectType Type of project
     * @param _totalCredits Total carbon credits in tonnes CO2
     * @param _pricePerCredit Initial price per credit
     * @param _metadataURI Link to project metadata
     */
    function createProject(
        string memory _name,
        string memory _location,
        string memory _projectType,
        uint256 _totalCredits,
        uint256 _pricePerCredit,
        string memory _metadataURI
    ) external returns (uint256) {
        require(_totalCredits > 0, "Total credits must be > 0");
        require(_pricePerCredit > 0, "Price must be > 0");
        require(bytes(_name).length > 0, "Name required");
        
        _projectIdCounter++;
        uint256 newProjectId = _projectIdCounter;
        
        projects[newProjectId] = CarbonProject({
            projectId: newProjectId,
            issuer: msg.sender,
            name: _name,
            location: _location,
            projectType: _projectType,
            totalCredits: _totalCredits,
            availableCredits: _totalCredits,
            pricePerCredit: _pricePerCredit,
            isActive: true,
            isVerified: false,
            createdAt: block.timestamp,
            metadataURI: _metadataURI
        });
        
        userProjects[msg.sender].push(newProjectId);
        
        // Mint credits to issuer
        _mint(msg.sender, newProjectId, _totalCredits, "");
        
        emit ProjectCreated(newProjectId, msg.sender, _name, _totalCredits, _pricePerCredit);
        emit CreditsIssued(newProjectId, msg.sender, _totalCredits);
        
        return newProjectId;
    }
    
    /**
     * @dev Verify a carbon project (only owner)
     * @param _projectId Project ID to verify
     */
    function verifyProject(uint256 _projectId) external onlyOwner {
        require(projects[_projectId].projectId != 0, "Project doesn't exist");
        require(!projects[_projectId].isVerified, "Already verified");
        
        projects[_projectId].isVerified = true;
        
        emit ProjectVerified(_projectId, msg.sender);
    }
    
    /**
     * @dev Deactivate a project
     * @param _projectId Project ID to deactivate
     */
    function deactivateProject(uint256 _projectId) external {
        CarbonProject storage project = projects[_projectId];
        require(project.projectId != 0, "Project doesn't exist");
        require(project.issuer == msg.sender || owner() == msg.sender, "Not authorized");
        require(project.isActive, "Already inactive");
        
        project.isActive = false;
        
        emit ProjectDeactivated(_projectId);
    }
    
    // ============ Trading Functions ============
    
    /**
     * @dev Create a sell order for carbon credits
     * @param _projectId Project ID
     * @param _amount Amount of credits to sell
     * @param _pricePerCredit Price per credit in wei
     */
    function createSellOrder(
        uint256 _projectId,
        uint256 _amount,
        uint256 _pricePerCredit
    ) external returns (uint256) {
        require(projects[_projectId].projectId != 0, "Project doesn't exist");
        require(_amount > 0, "Amount must be > 0");
        require(_pricePerCredit > 0, "Price must be > 0");
        require(balanceOf(msg.sender, _projectId) >= _amount, "Insufficient balance");
        
        _orderIdCounter++;
        uint256 newOrderId = _orderIdCounter;
        
        sellOrders[newOrderId] = SellOrder({
            orderId: newOrderId,
            projectId: _projectId,
            seller: msg.sender,
            amount: _amount,
            pricePerCredit: _pricePerCredit,
            isActive: true,
            createdAt: block.timestamp
        });
        
        emit SellOrderCreated(newOrderId, _projectId, msg.sender, _amount, _pricePerCredit);
        
        return newOrderId;
    }
    
    /**
     * @dev Purchase carbon credits from a sell order
     * @param _orderId Order ID to purchase from
     * @param _amount Amount of credits to buy
     */
    function purchaseCredits(uint256 _orderId, uint256 _amount) 
        external 
        payable 
        nonReentrant 
    {
        SellOrder storage order = sellOrders[_orderId];
        require(order.isActive, "Order not active");
        require(_amount > 0 && _amount <= order.amount, "Invalid amount");
        require(msg.sender != order.seller, "Cannot buy own credits");
        
        uint256 totalPrice = _amount * order.pricePerCredit;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // Calculate platform fee
        uint256 fee = (totalPrice * platformFeePercent) / FEE_DENOMINATOR;
        uint256 sellerAmount = totalPrice - fee;
        
        // Update order
        order.amount -= _amount;
        if (order.amount == 0) {
            order.isActive = false;
        }
        
        // Transfer credits
        _safeTransferFrom(order.seller, msg.sender, order.projectId, _amount, "");
        
        // Transfer payment
        accumulatedFees += fee;
        (bool success, ) = payable(order.seller).call{value: sellerAmount}("");
        require(success, "Transfer failed");
        
        // Refund excess
        if (msg.value > totalPrice) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - totalPrice}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit CreditsPurchased(_orderId, order.projectId, msg.sender, order.seller, _amount, totalPrice);
    }
    
    /**
     * @dev Cancel a sell order
     * @param _orderId Order ID to cancel
     */
    function cancelSellOrder(uint256 _orderId) external {
        SellOrder storage order = sellOrders[_orderId];
        require(order.seller == msg.sender, "Not seller");
        require(order.isActive, "Order not active");
        
        order.isActive = false;
    }
    
    // ============ Credit Retirement ============
    
    /**
     * @dev Retire carbon credits (permanently remove from circulation)
     * @param _projectId Project ID
     * @param _amount Amount to retire
     * @param _reason Reason for retirement
     */
    function retireCredits(
        uint256 _projectId,
        uint256 _amount,
        string memory _reason
    ) external {
        require(projects[_projectId].projectId != 0, "Project doesn't exist");
        require(_amount > 0, "Amount must be > 0");
        require(balanceOf(msg.sender, _projectId) >= _amount, "Insufficient balance");
        
        // Burn the credits
        _burn(msg.sender, _projectId, _amount);
        
        // Record retirement
        retiredCredits[msg.sender] += _amount;
        projectRetirements[_projectId].push(Retirement({
            projectId: _projectId,
            retirer: msg.sender,
            amount: _amount,
            timestamp: block.timestamp,
            reason: _reason
        }));
        
        emit CreditsRetired(_projectId, msg.sender, _amount, _reason);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get total number of projects
     */
    function getTotalProjects() external view returns (uint256) {
        return _projectIdCounter;
    }
    
    /**
     * @dev Get total number of orders
     */
    function getTotalOrders() external view returns (uint256) {
        return _orderIdCounter;
    }
    
    /**
     * @dev Get user's project IDs
     */
    function getUserProjects(address _user) external view returns (uint256[] memory) {
        return userProjects[_user];
    }
    
    /**
     * @dev Get all retirements for a project
     */
    function getProjectRetirements(uint256 _projectId) 
        external 
        view 
        returns (Retirement[] memory) 
    {
        return projectRetirements[_projectId];
    }
    
    /**
     * @dev Get user's retired credits total
     */
    function getUserRetiredCredits(address _user) external view returns (uint256) {
        return retiredCredits[_user];
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Update platform fee percentage
     * @param _newFee New fee in basis points
     */
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        platformFeePercent = _newFee;
    }
    
    /**
     * @dev Withdraw accumulated fees
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees to withdraw");
        
        accumulatedFees = 0;
        
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Update metadata URI
     */
    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }
}
