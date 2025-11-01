const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("CarbonCreditExchange", function () {
  
  async function deployExchangeFixture() {
    const [owner, issuer, buyer, seller] = await ethers.getSigners();
    
    const CarbonCreditExchange = await ethers.getContractFactory("CarbonCreditExchange");
    const exchange = await CarbonCreditExchange.deploy();
    
    return { exchange, owner, issuer, buyer, seller };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { exchange, owner } = await loadFixture(deployExchangeFixture);
      expect(await exchange.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct platform fee", async function () {
      const { exchange } = await loadFixture(deployExchangeFixture);
      expect(await exchange.platformFeePercent()).to.equal(200); // 2%
    });

    it("Should start with zero projects", async function () {
      const { exchange } = await loadFixture(deployExchangeFixture);
      expect(await exchange.getTotalProjects()).to.equal(0);
    });
  });

  describe("Project Creation", function () {
    it("Should create a carbon project", async function () {
      const { exchange, issuer } = await loadFixture(deployExchangeFixture);
      
      const tx = await exchange.connect(issuer).createProject(
        "Solar Farm Project",
        "California, USA",
        "Solar Energy",
        ethers.parseUnits("5000", 0),
        ethers.parseEther("0.01"),
        "ipfs://QmExample"
      );
      
      await expect(tx)
        .to.emit(exchange, "ProjectCreated")
        .withArgs(1, issuer.address, "Solar Farm Project", 5000, ethers.parseEther("0.01"));
      
      const project = await exchange.projects(1);
      expect(project.name).to.equal("Solar Farm Project");
      expect(project.totalCredits).to.equal(5000);
      expect(project.isActive).to.be.true;
      expect(project.isVerified).to.be.false;
    });

    it("Should mint credits to issuer", async function () {
      const { exchange, issuer } = await loadFixture(deployExchangeFixture);
      
      await exchange.connect(issuer).createProject(
        "Wind Farm",
        "Texas",
        "Wind Energy",
        ethers.parseUnits("3000", 0),
        ethers.parseEther("0.015"),
        "ipfs://QmWind"
      );
      
      const balance = await exchange.balanceOf(issuer.address, 1);
      expect(balance).to.equal(3000);
    });

    it("Should fail with zero credits", async function () {
      const { exchange, issuer } = await loadFixture(deployExchangeFixture);
      
      await expect(
        exchange.connect(issuer).createProject(
          "Invalid Project",
          "Location",
          "Type",
          0,
          ethers.parseEther("0.01"),
          "ipfs://QmInvalid"
        )
      ).to.be.revertedWith("Total credits must be > 0");
    });

    it("Should fail with zero price", async function () {
      const { exchange, issuer } = await loadFixture(deployExchangeFixture);
      
      await expect(
        exchange.connect(issuer).createProject(
          "Invalid Project",
          "Location",
          "Type",
          1000,
          0,
          "ipfs://QmInvalid"
        )
      ).to.be.revertedWith("Price must be > 0");
    });
  });

  describe("Project Verification", function () {
    it("Should allow owner to verify project", async function () {
      const { exchange, owner, issuer } = await loadFixture(deployExchangeFixture);
      
      await exchange.connect(issuer).createProject(
        "Verified Project",
        "Location",
        "Reforestation",
        1000,
        ethers.parseEther("0.01"),
        "ipfs://QmVerified"
      );
      
      await expect(exchange.connect(owner).verifyProject(1))
        .to.emit(exchange, "ProjectVerified")
        .withArgs(1, owner.address);
      
      const project = await exchange.projects(1);
      expect(project.isVerified).to.be.true;
    });

    it("Should not allow non-owner to verify", async function () {
      const { exchange, issuer } = await loadFixture(deployExchangeFixture);
      
      await exchange.connect(issuer).createProject(
        "Project",
        "Location",
        "Type",
        1000,
        ethers.parseEther("0.01"),
        "ipfs://Qm"
      );
      
      await expect(
        exchange.connect(issuer).verifyProject(1)
      ).to.be.revertedWithCustomError(exchange, "OwnableUnauthorizedAccount");
    });
  });

  describe("Sell Orders", function () {
    it("Should create a sell order", async function () {
      const { exchange, issuer } = await loadFixture(deployExchangeFixture);
      
      await exchange.connect(issuer).createProject(
        "Project",
        "Location",
        "Type",
        1000,
        ethers.parseEther("0.01"),
        "ipfs://Qm"
      );
      
      const tx = await exchange.connect(issuer).createSellOrder(
        1,
        100,
        ethers.parseEther("0.012")
      );
      
      await expect(tx)
        .to.emit(exchange, "SellOrderCreated")
        .withArgs(1, 1, issuer.address, 100, ethers.parseEther("0.012"));
      
      const order = await exchange.sellOrders(1);
      expect(order.amount).to.equal(100);
      expect(order.isActive).to.be.true;
    });

    it("Should fail if insufficient balance", async function () {
      const { exchange, issuer, buyer } = await loadFixture(deployExchangeFixture);
      
      await exchange.connect(issuer).createProject(
        "Project",
        "Location",
        "Type",
        100,
        ethers.parseEther("0.01"),
        "ipfs://Qm"
      );
      
      await expect(
        exchange.connect(buyer).createSellOrder(1, 50, ethers.parseEther("0.01"))
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should allow canceling sell order", async function () {
      const { exchange, issuer } = await loadFixture(deployExchangeFixture);
      
      await exchange.connect(issuer).createProject(
        "Project",
        "Location",
        "Type",
        1000,
        ethers.parseEther("0.01"),
        "ipfs://Qm"
      );
      
      await exchange.connect(issuer).createSellOrder(1, 100, ethers.parseEther("0.01"));
      await exchange.connect(issuer).cancelSellOrder(1);
      
      const order = await exchange.sellOrders(1);
      expect(order.isActive).to.be.false;
    });
  });

  describe("Credit Purchase", function () {
    it("Should purchase credits successfully", async function () {
      const { exchange, issuer, buyer } = await loadFixture(deployExchangeFixture);
      
      await exchange.connect(issuer).createProject(
        "Project",
        "Location",
        "Type",
        1000,
        ethers.parseEther("0.01"),
        "ipfs://Qm"
      );
      
      await exchange.connect(issuer).createSellOrder(1, 100, ethers.parseEther("0.01"));
      
      const totalPrice = ethers.parseEther("0.5"); // 50 * 0.01
      
      await expect(
        exchange.connect(buyer).purchaseCredits(1, 50, { value: totalPrice })
      ).to.emit(exchange, "CreditsPurchased");
      
      const buyerBalance = await exchange.balanceOf(buyer.address, 1);
      expect(buyerBalance).to.equal(50);
    });

    it("Should update order amount after partial purchase", async function () {
      const { exchange, issuer, buyer } = await loadFixture(deployExchangeFixture);
      
      await exchange.connect(issuer).createProject(
        "Project",
        "Location",
        "Type",
        1000,
        ethers.parseEther("0.01"),
        "ipfs://Qm"
      );
      
      await exchange.connect(issuer).createSellOrder(1, 100, ethers.parseEther("0.01"));
      
      await exchange.connect(buyer).purchaseCredits(1, 30, { 
        value: ethers.parseEther("0.3") 
      });
      
      const order = await exchange.sellOrders(1);
      expect(order.amount).to.equal(70);
      expect(order.isActive).to.be.true;
    });

    it("Should deactivate order when fully purchased", async function () {
      const { exchange, issuer, buyer } = await loadFixture(deployExchangeFixture);
      
      await exchange.connect(issuer).createProject(
        "Project",
        "Location",
        "Type",
        1000,
        ethers.parseEther("0.01"),
        "ipfs://Qm"
      );
      
      await exchange.connect(issuer).createSellOrder(1, 100, ethers.parseEther("0.01"));
      
      await exchange.connect(buyer).purchaseCredits(1, 100, { 
        value: ethers.parseEther("1.0") 
      });
      
      const order = await exchange.sellOrders(1);
      expect(order.isActive).to.be.false;
    });

    it("Should fail if insufficient payment", async function () {
      const { exchange, issuer, buyer } = await loadFixture(deployExchangeFixture);
      
      await exchange.connect(issuer).createProject(
        "Project",
        "Location",
        "Type",
        1000,
        ethers.parseEther("0.01"),
        "ipfs://Qm"
      );
      
      await exchange.connect(issuer).createSellOrder(1, 100, ethers.parseEther("0.01"));
      
      await expect(
        exchange.connect(buyer).purchaseCredits(1, 50, { 
          value: ethers.parseEther("0.1") // Too low
        })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should prevent buying own credits", async function () {
      const { exchange, issuer } = await loadFixture(deployExchangeFixture);
      
      await exchange.connect(issuer).createProject(
        "Project",
        "Location",
        "Type",
        1000,
        ethers.parseEther("0.01"),
        "ipfs://Qm"
      );
      
      await exchange.connect(issuer).createSellOrder(1, 100, ethers.parseEther("0.01"));
      
      await expect(
        exchange.connect(issuer).purchaseCredits(1, 50, { 
          value: ethers.parseEther("0.5") 
        })
      ).to.be.revertedWith("Cannot buy own credits");
    });
  });

  describe("Credit Retirement", function () {
    it("Should retire credits successfully", async function () {
      const { exchange, issuer } = await loadFixture(deployExchangeFixture);
      
      await exchange.connect(issuer).createProject(
        "Project",
        "Location",
        "Type",
        1000,
        ethers.parseEther("0.01"),
        "ipfs://Qm"
      );
      
      await expect(
        exchange.connect(issuer).retireCredits(1, 100, "Annual carbon offset")
      ).to.emit(exchange, "CreditsRetired")
        .withArgs(1, issuer.address, 100, "Annual carbon offset");
      
      const balance = await exchange.balanceOf(issuer.address, 1);
      expect(balance).to.equal(900);
      
      const retiredTotal = await exchange.getUserRetiredCredits(issuer.address);
      expect(retiredTotal).to.equal(100);
    });

    it("Should fail if insufficient balance to retire", async function () {
      const { exchange, issuer, buyer } = await loadFixture(deployExchangeFixture);
      
      await exchange.connect(issuer).createProject(
        "Project",
        "Location",
        "Type",
        100,
        ethers.parseEther("0.01"),
        "ipfs://Qm"
      );
      
      await expect(
        exchange.connect(buyer).retireCredits(1, 50, "Offset")
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Admin Functions", function () {
    it("Should update platform fee", async function () {
      const { exchange, owner } = await loadFixture(deployExchangeFixture);
      
      await exchange.connect(owner).updatePlatformFee(300); // 3%
      expect(await exchange.platformFeePercent()).to.equal(300);
    });

    it("Should not allow fee above 10%", async function () {
      const { exchange, owner } = await loadFixture(deployExchangeFixture);
      
      await expect(
        exchange.connect(owner).updatePlatformFee(1100)
      ).to.be.revertedWith("Fee too high");
    });

    it("Should withdraw accumulated fees", async function () {
      const { exchange, owner, issuer, buyer } = await loadFixture(deployExchangeFixture);
      
      await exchange.connect(issuer).createProject(
        "Project",
        "Location",
        "Type",
        1000,
        ethers.parseEther("0.01"),
        "ipfs://Qm"
      );
      
      await exchange.connect(issuer).createSellOrder(1, 100, ethers.parseEther("0.01"));
      
      await exchange.connect(buyer).purchaseCredits(1, 100, { 
        value: ethers.parseEther("1.0") 
      });
      
      const feesBefore = await exchange.accumulatedFees();
      expect(feesBefore).to.be.gt(0);
      
      await exchange.connect(owner).withdrawFees();
      
      const feesAfter = await exchange.accumulatedFees();
      expect(feesAfter).to.equal(0);
    });
  });

  describe("View Functions", function () {
    it("Should return user projects", async function () {
      const { exchange, issuer } = await loadFixture(deployExchangeFixture);
      
      await exchange.connect(issuer).createProject(
        "Project 1",
        "Location",
        "Type",
        1000,
        ethers.parseEther("0.01"),
        "ipfs://Qm1"
      );
      
      await exchange.connect(issuer).createProject(
        "Project 2",
        "Location",
        "Type",
        2000,
        ethers.parseEther("0.02"),
        "ipfs://Qm2"
      );
      
      const projects = await exchange.getUserProjects(issuer.address);
      expect(projects.length).to.equal(2);
      expect(projects[0]).to.equal(1);
      expect(projects[1]).to.equal(2);
    });

    it("Should return project retirements", async function () {
      const { exchange, issuer } = await loadFixture(deployExchangeFixture);
      
      await exchange.connect(issuer).createProject(
        "Project",
        "Location",
        "Type",
        1000,
        ethers.parseEther("0.01"),
        "ipfs://Qm"
      );
      
      await exchange.connect(issuer).retireCredits(1, 50, "Reason 1");
      await exchange.connect(issuer).retireCredits(1, 30, "Reason 2");
      
      const retirements = await exchange.getProjectRetirements(1);
      expect(retirements.length).to.equal(2);
      expect(retirements[0].amount).to.equal(50);
      expect(retirements[1].amount).to.equal(30);
    });
  });
});
