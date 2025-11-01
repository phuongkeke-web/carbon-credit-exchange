import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, CELO_SEPOLIA_CONFIG, PROJECT_TYPES } from './config';
import './App.css';

function App() {
  // State management
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('marketplace');
  
  // Data states
  const [projects, setProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [sellOrders, setSellOrders] = useState([]);
  const [retiredCredits, setRetiredCredits] = useState('0');
  const [contractStats, setContractStats] = useState({
    totalProjects: 0,
    totalOrders: 0,
    platformFee: 0
  });
  
  // Form states
  const [newProject, setNewProject] = useState({
    name: '',
    location: '',
    projectType: 'Solar Energy',
    totalCredits: '',
    pricePerCredit: '',
    metadataURI: ''
  });
  
  const [newSellOrder, setNewSellOrder] = useState({
    projectId: '',
    amount: '',
    pricePerCredit: ''
  });
  
  const [purchaseModal, setPurchaseModal] = useState({
    show: false,
    orderId: null,
    projectId: null,
    amount: '',
    pricePerCredit: '0',
    totalCost: '0',
    projectName: ''
  });
  
  const [retireModal, setRetireModal] = useState({
    show: false,
    projectId: null,
    amount: '',
    reason: '',
    projectName: '',
    availableBalance: 0
  });

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      setLoading(true);
      setError('');

      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this DApp');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const network = await web3Provider.getNetwork();

      if (network.chainId !== 11142220n) {
        await switchToCeloSepolia();
      }

      const signer = await web3Provider.getSigner();
      const address = await signer.getAddress();
      const bal = await web3Provider.getBalance(address);

      const exchangeContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      setProvider(web3Provider);
      setContract(exchangeContract);
      setAccount(address);
      setBalance(ethers.formatEther(bal));
      setSuccess('Wallet connected successfully!');
      
      await loadAllData(exchangeContract, address);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  // Switch to Celo Sepolia network
  const switchToCeloSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CELO_SEPOLIA_CONFIG.chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [CELO_SEPOLIA_CONFIG],
          });
        } catch (addError) {
          throw new Error('Failed to add Celo Sepolia network to MetaMask');
        }
      } else {
        throw switchError;
      }
    }
  };

  // Load all data
  const loadAllData = async (contractInstance = contract, address = account) => {
    if (!contractInstance) return;
    
    try {
      await Promise.all([
        loadProjects(contractInstance),
        loadMyProjects(contractInstance, address),
        loadSellOrders(contractInstance),
        loadContractStats(contractInstance),
        loadRetiredCredits(contractInstance, address)
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  // Load all projects
  const loadProjects = async (contractInstance = contract) => {
    if (!contractInstance) return;
    
    try {
      const total = await contractInstance.getTotalProjects();
      const projectsArray = [];

      for (let i = 1; i <= Number(total); i++) {
        try {
          const project = await contractInstance.projects(i);
          projectsArray.push({
            id: Number(project[0]),           // projectId
            owner: project[1],                 // issuer
            name: project[2],                  // name
            location: project[3],              // location
            projectType: project[4],           // projectType
            totalCredits: Number(project[5]),  // totalCredits
            availableCredits: Number(project[6]), // availableCredits
            pricePerCredit: ethers.formatEther(project[7]), // pricePerCredit
            isActive: project[8],              // isActive
            isVerified: project[9],            // isVerified
            createdAt: Number(project[10]),    // createdAt
            metadataURI: project[11]           // metadataURI
          });
        } catch (err) {
          console.log(`Skipping project ${i}:`, err.message);
        }
      }

      setProjects(projectsArray);
    } catch (err) {
      console.error('Error loading projects:', err);
      setProjects([]);
    }
  };

  // Load user's projects
  const loadMyProjects = async (contractInstance = contract, address = account) => {
    if (!contractInstance || !address) return;
    
    try {
      const projectIds = await contractInstance.getUserProjects(address);
      const myProjectsArray = [];

      for (const id of projectIds) {
        const project = await contractInstance.projects(id);
        const balance = await contractInstance.balanceOf(address, id);
        
        myProjectsArray.push({
          id: Number(project[0]),           // projectId
          owner: project[1],                 // issuer
          name: project[2],                  // name
          location: project[3],              // location
          projectType: project[4],           // projectType
          totalCredits: Number(project[5]),  // totalCredits
          availableCredits: Number(project[6]), // availableCredits
          pricePerCredit: ethers.formatEther(project[7]), // pricePerCredit
          isActive: project[8],              // isActive
          isVerified: project[9],            // isVerified
          createdAt: Number(project[10]),    // createdAt
          metadataURI: project[11],          // metadataURI
          myBalance: Number(balance)
        });
      }

      setMyProjects(myProjectsArray);
    } catch (err) {
      console.error('Error loading my projects:', err);
      setMyProjects([]);
    }
  };

  // Load sell orders
  const loadSellOrders = async (contractInstance = contract) => {
    if (!contractInstance) return;
    
    try {
      const total = await contractInstance.getTotalOrders();
      const ordersArray = [];

      for (let i = 1; i <= Number(total); i++) {
        try {
          const order = await contractInstance.sellOrders(i);
          
          if (order[5]) { // isActive
            const project = await contractInstance.projects(order[1]);
            
            ordersArray.push({
              orderId: Number(order[0]),      // orderId
              projectId: Number(order[1]),    // projectId
              seller: order[2],               // seller
              amount: Number(order[3]),       // amount
              pricePerCredit: ethers.formatEther(order[4]), // pricePerCredit
              isActive: order[5],             // isActive
              createdAt: Number(order[6]),    // createdAt
              projectName: project[2],        // name from project
              projectType: project[4],        // projectType from project
              isVerified: project[9]          // isVerified from project
            });
          }
        } catch (err) {
          console.log(`Skipping order ${i}:`, err.message);
        }
      }

      setSellOrders(ordersArray);
    } catch (err) {
      console.error('Error loading sell orders:', err);
      setSellOrders([]);
    }
  };

  // Load contract stats
  const loadContractStats = async (contractInstance = contract) => {
    if (!contractInstance) return;
    
    try {
      const [totalProjects, totalOrders, platformFee] = await Promise.all([
        contractInstance.getTotalProjects(),
        contractInstance.getTotalOrders(),
        contractInstance.platformFeePercent()
      ]);

      setContractStats({
        totalProjects: Number(totalProjects),
        totalOrders: Number(totalOrders),
        platformFee: Number(platformFee) / 100
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // Load retired credits
  const loadRetiredCredits = async (contractInstance = contract, address = account) => {
    if (!contractInstance || !address) return;
    
    try {
      const retired = await contractInstance.getUserRetiredCredits(address);
      setRetiredCredits(Number(retired).toString());
    } catch (err) {
      console.error('Error loading retired credits:', err);
      setRetiredCredits('0');
    }
  };

  // Create new project
  const createProject = async (e) => {
    e.preventDefault();
    if (!contract) return;

    try {
      setLoading(true);
      setError('');

      const priceInWei = ethers.parseEther(newProject.pricePerCredit);
      
      const tx = await contract.createProject(
        newProject.name,
        newProject.location,
        newProject.projectType,
        BigInt(newProject.totalCredits),
        priceInWei,
        newProject.metadataURI || `ipfs://carbon-${Date.now()}`
      );

      setSuccess('Creating project... Please wait for confirmation');
      await tx.wait();

      setSuccess('Project created successfully! You now have the credits as ERC-1155 tokens.');
      setNewProject({
        name: '',
        location: '',
        projectType: 'Solar Energy',
        totalCredits: '',
        pricePerCredit: '',
        metadataURI: ''
      });
      
      await loadAllData();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  // Create sell order
  const createSellOrder = async (e) => {
    e.preventDefault();
    if (!contract) return;

    try {
      setLoading(true);
      setError('');

      const priceInWei = ethers.parseEther(newSellOrder.pricePerCredit);
      
      const tx = await contract.createSellOrder(
        BigInt(newSellOrder.projectId),
        BigInt(newSellOrder.amount),
        priceInWei
      );

      setSuccess('Creating sell order... Please wait');
      await tx.wait();

      setSuccess('Sell order created successfully!');
      setNewSellOrder({
        projectId: '',
        amount: '',
        pricePerCredit: ''
      });
      
      await loadAllData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create sell order');
    } finally {
      setLoading(false);
    }
  };

  // Open purchase modal
  const openPurchaseModal = (order) => {
    setPurchaseModal({
      show: true,
      orderId: order.orderId,
      projectId: order.projectId,
      amount: '1',
      pricePerCredit: order.pricePerCredit,
      totalCost: order.pricePerCredit,
      projectName: order.projectName
    });
  };

  // Update purchase amount
  const updatePurchaseAmount = (amount) => {
    const total = (parseFloat(purchaseModal.pricePerCredit) * parseFloat(amount)).toFixed(6);
    setPurchaseModal({
      ...purchaseModal,
      amount,
      totalCost: total
    });
  };

  // Purchase credits
  const purchaseCredits = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      setError('');

      const totalCostInWei = ethers.parseEther(purchaseModal.totalCost);

      const tx = await contract.purchaseCredits(
        BigInt(purchaseModal.orderId),
        BigInt(purchaseModal.amount),
        { value: totalCostInWei }
      );

      setSuccess('Purchasing credits... Please wait');
      await tx.wait();

      setSuccess('Credits purchased successfully! Check "My Projects" tab.');
      setPurchaseModal({ show: false, orderId: null, projectId: null, amount: '', pricePerCredit: '0', totalCost: '0', projectName: '' });
      
      await loadAllData();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to purchase credits');
    } finally {
      setLoading(false);
    }
  };

  // Open retire modal
  const openRetireModal = async (project) => {
    if (!contract || !account) return;
    
    try {
      const balance = await contract.balanceOf(account, project.id);
      
      setRetireModal({
        show: true,
        projectId: project.id,
        amount: '',
        reason: '',
        projectName: project.name,
        availableBalance: Number(balance)
      });
    } catch (err) {
      setError('Failed to check balance');
    }
  };

  // Retire credits
  const retireCredits = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      setError('');

      const tx = await contract.retireCredits(
        BigInt(retireModal.projectId),
        BigInt(retireModal.amount),
        retireModal.reason || 'Carbon offset'
      );

      setSuccess('Retiring credits... Please wait');
      await tx.wait();

      setSuccess(`Successfully retired ${retireModal.amount} tonnes CO2! 🌱`);
      setRetireModal({ show: false, projectId: null, amount: '', reason: '', projectName: '', availableBalance: 0 });
      
      await loadAllData();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to retire credits');
    } finally {
      setLoading(false);
    }
  };

  // Cancel sell order
  const cancelOrder = async (orderId) => {
    if (!contract) return;

    try {
      setLoading(true);
      setError('');

      const tx = await contract.cancelSellOrder(BigInt(orderId));
      
      setSuccess('Cancelling order... Please wait');
      await tx.wait();

      setSuccess('Order cancelled successfully!');
      await loadAllData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to cancel order');
    } finally {
      setLoading(false);
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          connectWallet();
        } else {
          setAccount('');
          setProvider(null);
          setContract(null);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <h1>🌱 Carbon Credit Exchange</h1>
        <p>Trade tokenized carbon offsets on Celo • ERC-1155 Multi-Token</p>
      </div>

      {/* Wallet Section */}
      <div className="wallet-section">
        {!account ? (
          <button 
            className="connect-button" 
            onClick={connectWallet}
            disabled={loading}
          >
            {loading ? 'Connecting...' : '🦊 Connect MetaMask'}
          </button>
        ) : (
          <div className="wallet-info">
            <div className="wallet-row">
              <div className="wallet-item">
                <strong>Account:</strong>
                <span className="address">{account.slice(0, 6)}...{account.slice(-4)}</span>
              </div>
              <div className="wallet-item">
                <strong>Balance:</strong>
                <span>{parseFloat(balance).toFixed(4)} CELO</span>
              </div>
              <div className="wallet-item">
                <strong>Retired Credits:</strong>
                <span className="retired-badge">{retiredCredits} tonnes CO2 🌍</span>
              </div>
            </div>
            <div className="stats-row">
              <span>📊 Total Projects: {contractStats.totalProjects}</span>
              <span>🏪 Active Orders: {sellOrders.length}</span>
              <span>💰 Platform Fee: {contractStats.platformFee}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && <div className="error-message">❌ {error}</div>}
      {success && <div className="success-message">✅ {success}</div>}

      {/* Main Content */}
      {account && (
        <>
          {/* Tabs */}
          <div className="tabs">
            <button 
              className={`tab-button ${activeTab === 'marketplace' ? 'active' : ''}`}
              onClick={() => setActiveTab('marketplace')}
            >
              🏪 Marketplace
            </button>
            <button 
              className={`tab-button ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveTab('projects')}
            >
              🌳 All Projects
            </button>
            <button 
              className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              ➕ Create Project
            </button>
            <button 
              className={`tab-button ${activeTab === 'myprojects' ? 'active' : ''}`}
              onClick={() => setActiveTab('myprojects')}
            >
              📋 My Projects
            </button>
            <button 
              className={`tab-button ${activeTab === 'sell' ? 'active' : ''}`}
              onClick={() => setActiveTab('sell')}
            >
              💰 Create Order
            </button>
          </div>

          {/* Marketplace Tab */}
          {activeTab === 'marketplace' && (
            <div className="form-section">
              <h2>Active Sell Orders</h2>
              <p className="tab-description">Purchase carbon credits directly from sellers</p>
              {sellOrders.length === 0 ? (
                <div className="no-data">
                  No active sell orders yet. Create a project and list credits for sale!
                </div>
              ) : (
                <div className="cards-grid">
                  {sellOrders.map(order => (
                    <div key={order.orderId} className="card order-card">
                      <div className="card-header">
                        <span className="order-id">Order #{order.orderId}</span>
                        <span className={`badge ${order.isVerified ? 'verified' : 'unverified'}`}>
                          {order.isVerified ? '✅ Verified' : '⏳ Pending'}
                        </span>
                      </div>
                      <h3>{order.projectName}</h3>
                      <div className="project-type">{order.projectType}</div>
                      <div className="card-info">
                        <div className="info-row">
                          <span>Available:</span>
                          <strong>{order.amount} credits</strong>
                        </div>
                        <div className="info-row">
                          <span>Price:</span>
                          <strong>{order.pricePerCredit} CELO/credit</strong>
                        </div>
                        <div className="info-row">
                          <span>Seller:</span>
                          <span className="address">{order.seller.slice(0, 10)}...</span>
                        </div>
                      </div>
                      <div className="card-actions">
                        {order.seller.toLowerCase() === account.toLowerCase() ? (
                          <button
                            className="cancel-button-small"
                            onClick={() => cancelOrder(order.orderId)}
                            disabled={loading}
                          >
                            Cancel Order
                          </button>
                        ) : (
                          <button
                            className="buy-button"
                            onClick={() => openPurchaseModal(order)}
                            disabled={loading}
                          >
                            🛒 Buy Credits
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Projects Tab */}
          {activeTab === 'projects' && (
            <div className="form-section">
              <h2>All Carbon Projects</h2>
              <p className="tab-description">Browse all registered carbon offset projects</p>
              {projects.length === 0 ? (
                <div className="no-data">
                  No projects yet. Be the first to create a carbon offset project!
                </div>
              ) : (
                <div className="cards-grid">
                  {projects.map(project => (
                    <div key={project.id} className="card project-card">
                      <div className="card-header">
                        <span className="project-id">Project #{project.id}</span>
                        <div>
                          <span className={`badge ${project.isVerified ? 'verified' : 'unverified'}`}>
                            {project.isVerified ? '✅ Verified' : '⏳ Pending'}
                          </span>
                          <span className={`badge ${project.isActive ? 'active' : 'inactive'}`}>
                            {project.isActive ? '🟢 Active' : '🔴 Inactive'}
                          </span>
                        </div>
                      </div>
                      <h3>{project.name}</h3>
                      <div className="project-type">{project.projectType}</div>
                      <div className="card-info">
                        <div className="info-row">
                          <span>📍 Location:</span>
                          <span>{project.location}</span>
                        </div>
                        <div className="info-row">
                          <span>🌳 Total Credits:</span>
                          <strong>{project.totalCredits} tonnes CO2</strong>
                        </div>
                        <div className="info-row">
                          <span>💵 Base Price:</span>
                          <strong>{project.pricePerCredit} CELO</strong>
                        </div>
                        <div className="info-row">
                          <span>👤 Owner:</span>
                          <span className="address">{project.owner.slice(0, 10)}...</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create Project Tab */}
          {activeTab === 'create' && (
            <div className="form-section">
              <h2>Create Carbon Offset Project</h2>
              <p className="tab-description">Register your carbon offset project and mint credits as ERC-1155 tokens</p>
              <form onSubmit={createProject} className="form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Project Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Amazon Rainforest Protection"
                      value={newProject.name}
                      onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Location *</label>
                    <input
                      type="text"
                      placeholder="e.g., Brazil"
                      value={newProject.location}
                      onChange={(e) => setNewProject({...newProject, location: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Project Type *</label>
                    <select
                      value={newProject.projectType}
                      onChange={(e) => setNewProject({...newProject, projectType: e.target.value})}
                      required
                    >
                      {PROJECT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Total Credits (tonnes CO2) *</label>
                    <input
                      type="number"
                      placeholder="e.g., 10000"
                      value={newProject.totalCredits}
                      onChange={(e) => setNewProject({...newProject, totalCredits: e.target.value})}
                      required
                      min="1"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Price per Credit (CELO) *</label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder="e.g., 0.01"
                      value={newProject.pricePerCredit}
                      onChange={(e) => setNewProject({...newProject, pricePerCredit: e.target.value})}
                      required
                      min="0.001"
                    />
                  </div>
                  <div className="form-group">
                    <label>Metadata URI (optional)</label>
                    <input
                      type="text"
                      placeholder="ipfs://... (auto-generated if empty)"
                      value={newProject.metadataURI}
                      onChange={(e) => setNewProject({...newProject, metadataURI: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="info-box">
                  <p>💡 <strong>Note:</strong> After creating your project, you will receive {newProject.totalCredits || '0'} ERC-1155 tokens representing your carbon credits. You can then create sell orders to trade them.</p>
                </div>
                
                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? 'Creating...' : '✨ Create Project & Mint Credits'}
                </button>
              </form>
            </div>
          )}

          {/* My Projects Tab */}
          {activeTab === 'myprojects' && (
            <div className="form-section">
              <h2>My Carbon Credits</h2>
              <p className="tab-description">Projects you own and your credit balances</p>
              {myProjects.length === 0 ? (
                <div className="no-data">
                  You don't have any projects yet. Create one or buy credits from the marketplace!
                </div>
              ) : (
                <div className="cards-grid">
                  {myProjects.map(project => (
                    <div key={project.id} className="card my-project-card">
                      <div className="card-header">
                        <span className="project-id">Project #{project.id}</span>
                        <span className={`badge ${project.isVerified ? 'verified' : 'unverified'}`}>
                          {project.isVerified ? '✅ Verified' : '⏳ Pending'}
                        </span>
                      </div>
                      <h3>{project.name}</h3>
                      <div className="project-type">{project.projectType}</div>
                      <div className="card-info">
                        <div className="info-row">
                          <span>📍 Location:</span>
                          <span>{project.location}</span>
                        </div>
                        <div className="info-row">
                          <span>🌳 Total Minted:</span>
                          <strong>{project.totalCredits} credits</strong>
                        </div>
                        <div className="info-row">
                          <span>💼 Your Balance:</span>
                          <strong className="balance-highlight">{project.myBalance} credits</strong>
                        </div>
                        <div className="info-row">
                          <span>💵 Base Price:</span>
                          <span>{project.pricePerCredit} CELO</span>
                        </div>
                      </div>
                      <div className="card-actions">
                        <button
                          className="retire-button"
                          onClick={() => openRetireModal(project)}
                          disabled={loading || project.myBalance === 0}
                        >
                          🔥 Retire Credits
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create Sell Order Tab */}
          {activeTab === 'sell' && (
            <div className="form-section">
              <h2>Create Sell Order</h2>
              <p className="tab-description">List your carbon credits for sale on the marketplace</p>
              
              {myProjects.length === 0 ? (
                <div className="no-data">
                  You need to own carbon credits before creating a sell order. Create a project or buy credits first!
                </div>
              ) : (
                <form onSubmit={createSellOrder} className="form">
                  <div className="form-group">
                    <label>Select Project *</label>
                    <select
                      value={newSellOrder.projectId}
                      onChange={(e) => setNewSellOrder({...newSellOrder, projectId: e.target.value})}
                      required
                    >
                      <option value="">-- Select a project --</option>
                      {myProjects.map(project => (
                        <option key={project.id} value={project.id}>
                          #{project.id} - {project.name} (Balance: {project.myBalance} credits)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Amount to Sell *</label>
                      <input
                        type="number"
                        placeholder="e.g., 100"
                        value={newSellOrder.amount}
                        onChange={(e) => setNewSellOrder({...newSellOrder, amount: e.target.value})}
                        required
                        min="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Price per Credit (CELO) *</label>
                      <input
                        type="number"
                        step="0.001"
                        placeholder="e.g., 0.015"
                        value={newSellOrder.pricePerCredit}
                        onChange={(e) => setNewSellOrder({...newSellOrder, pricePerCredit: e.target.value})}
                        required
                        min="0.001"
                      />
                    </div>
                  </div>
                  
                  {newSellOrder.amount && newSellOrder.pricePerCredit && (
                    <div className="info-box">
                      <p>💰 <strong>Total Value:</strong> {(parseFloat(newSellOrder.amount) * parseFloat(newSellOrder.pricePerCredit)).toFixed(4)} CELO</p>
                      <p>💡 Platform fee ({contractStats.platformFee}%) will be deducted when credits are sold.</p>
                    </div>
                  )}
                  
                  <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? 'Creating...' : '📝 Create Sell Order'}
                  </button>
                </form>
              )}
            </div>
          )}
        </>
      )}

      {/* Purchase Modal */}
      {purchaseModal.show && (
        <div className="modal-overlay" onClick={() => setPurchaseModal({...purchaseModal, show: false})}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Purchase Carbon Credits</h2>
            <p className="modal-project-name">{purchaseModal.projectName}</p>
            <div className="form-group">
              <label>Amount (credits)</label>
              <input
                type="number"
                min="1"
                value={purchaseModal.amount}
                onChange={(e) => updatePurchaseAmount(e.target.value)}
              />
            </div>
            <div className="modal-info">
              <div className="info-row">
                <span>Price per Credit:</span>
                <strong>{purchaseModal.pricePerCredit} CELO</strong>
              </div>
              <div className="info-row total-row">
                <span>Total Cost:</span>
                <strong>{purchaseModal.totalCost} CELO</strong>
              </div>
            </div>
            <p className="modal-note">
              💡 Credits will be transferred to your wallet as ERC-1155 tokens.
            </p>
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => setPurchaseModal({...purchaseModal, show: false})}
              >
                Cancel
              </button>
              <button 
                className="confirm-button"
                onClick={purchaseCredits}
                disabled={loading}
              >
                {loading ? 'Purchasing...' : 'Confirm Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retire Modal */}
      {retireModal.show && (
        <div className="modal-overlay" onClick={() => setRetireModal({...retireModal, show: false})}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Retire Carbon Credits</h2>
            <p className="modal-project-name">{retireModal.projectName}</p>
            <p className="modal-subtitle">Available: {retireModal.availableBalance} credits</p>
            
            <div className="form-group">
              <label>Amount to Retire *</label>
              <input
                type="number"
                min="1"
                max={retireModal.availableBalance}
                placeholder="e.g., 50"
                value={retireModal.amount}
                onChange={(e) => setRetireModal({...retireModal, amount: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Reason (optional)</label>
              <textarea
                placeholder="e.g., Company annual carbon neutrality initiative"
                value={retireModal.reason}
                onChange={(e) => setRetireModal({...retireModal, reason: e.target.value})}
                rows="3"
              />
            </div>
            
            <div className="retire-info-box">
              <p>🔥 <strong>Warning:</strong> Retired credits are permanently burned and cannot be recovered.</p>
              <p>🌍 This action proves your carbon offset contribution on-chain.</p>
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => setRetireModal({...retireModal, show: false})}
              >
                Cancel
              </button>
              <button 
                className="retire-confirm-button"
                onClick={retireCredits}
                disabled={loading || !retireModal.amount || parseInt(retireModal.amount) > retireModal.availableBalance}
              >
                {loading ? 'Retiring...' : '🔥 Retire Credits'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="footer">
        <p>
          <strong>Carbon Credit Exchange</strong> • Built on Celo Sepolia • 
          <a href={`https://sepolia.celoscan.io/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer">
            View Contract
          </a>
        </p>
      </div>
    </div>
  );
}

export default App;
