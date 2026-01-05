// blockchains.js - Sistema de Gerenciamento de Blockchains
const blockchains = [
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    chainId: 137,
    rpcUrls: [
      'https://polygon-rpc.com',
      'https://identitydynamic.avizaecosystem.workers.dev',
      'https://rpc-mainnet.maticvigil.com',
      'https://polygon-mainnet.infura.io/v3/',
      'https://matic-mainnet.chainstacklabs.com'
    ],
    explorer: 'https://polygonscan.com',
    decimals: 18,
    color: '#8247E5',
    icon: 'fas fa-gem'
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: 1,
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    explorer: 'https://etherscan.io',
    decimals: 18,
    color: '#627EEA',
    icon: 'fab fa-ethereum'
  },
  {
    id: 'bsc',
    name: 'BSC',
    symbol: 'BNB',
    chainId: 56,
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    explorer: 'https://bscscan.com',
    decimals: 18,
    color: '#F0B90B',
    icon: 'fas fa-exchange-alt'
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    symbol: 'AVAX',
    chainId: 43114,
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    explorer: 'https://snowtrace.io',
    decimals: 18,
    color: '#E84142',
    icon: 'fas fa-snowflake'
  },
  {
    id: 'fantom',
    name: 'Fantom',
    symbol: 'FTM',
    chainId: 250,
    rpcUrls: ['https://rpc.ftm.tools/'],
    explorer: 'https://ftmscan.com',
    decimals: 18,
    color: '#1969FF',
    icon: 'fas fa-bolt'
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    symbol: 'ETH',
    chainId: 42161,
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    explorer: 'https://arbiscan.io',
    decimals: 18,
    color: '#28A0F0',
    icon: 'fas fa-layer-group'
  },
  {
    id: 'optimism',
    name: 'Optimism',
    symbol: 'ETH',
    chainId: 10,
    rpcUrls: ['https://mainnet.optimism.io'],
    explorer: 'https://optimistic.etherscan.io',
    decimals: 18,
    color: '#FF0420',
    icon: 'fas fa-chart-line'
  },
  {
    id: 'base',
    name: 'Base',
    symbol: 'ETH',
    chainId: 8453,
    rpcUrls: ['https://mainnet.base.org'],
    explorer: 'https://basescan.org',
    decimals: 18,
    color: '#0052FF',
    icon: 'fas fa-database'
  },
  {
    id: 'cronos',
    name: 'Cronos',
    symbol: 'CRO',
    chainId: 25,
    rpcUrls: ['https://evm.cronos.org'],
    explorer: 'https://cronoscan.com',
    decimals: 18,
    color: '#121926',
    icon: 'fas fa-clock'
  },
  {
    id: 'harmony',
    name: 'Harmony',
    symbol: 'ONE',
    chainId: 1666600000,
    rpcUrls: ['https://api.harmony.one'],
    explorer: 'https://explorer.harmony.one',
    decimals: 18,
    color: '#00AEE9',
    icon: 'fas fa-music'
  },
  {
    id: 'kava',
    name: 'Kava',
    symbol: 'KAVA',
    chainId: 2222,
    rpcUrls: ['https://evm.kava.io'],
    explorer: 'https://explorer.kava.io',
    decimals: 18,
    color: '#FF433E',
    icon: 'fas fa-shield-alt'
  },
  {
    id: 'celo',
    name: 'Celo',
    symbol: 'CELO',
    chainId: 42220,
    rpcUrls: ['https://forno.celo.org'],
    explorer: 'https://celoscan.io',
    decimals: 18,
    color: '#35D07F',
    icon: 'fas fa-leaf'
  },
  {
    id: 'moonbeam',
    name: 'Moonbeam',
    symbol: 'GLMR',
    chainId: 1284,
    rpcUrls: ['https://rpc.api.moonbeam.network'],
    explorer: 'https://moonscan.io',
    decimals: 18,
    color: '#53CBC9',
    icon: 'fas fa-moon'
  },
  {
    id: 'moonriver',
    name: 'Moonriver',
    symbol: 'MOVR',
    chainId: 1285,
    rpcUrls: ['https://rpc.api.moonriver.moonbeam.network'],
    explorer: 'https://moonriver.moonscan.io',
    decimals: 18,
    color: '#F3B404',
    icon: 'fas fa-water'
  },
  {
    id: 'gnosis',
    name: 'Gnosis',
    symbol: 'xDAI',
    chainId: 100,
    rpcUrls: ['https://rpc.gnosischain.com'],
    explorer: 'https://gnosisscan.io',
    decimals: 18,
    color: '#04795B',
    icon: 'fas fa-brain'
  },
  {
    id: 'fuse',
    name: 'Fuse',
    symbol: 'FUSE',
    chainId: 122,
    rpcUrls: ['https://rpc.fuse.io'],
    explorer: 'https://explorer.fuse.io',
    decimals: 18,
    color: '#46E8B6',
    icon: 'fas fa-bolt'
  },
  {
    id: 'metis',
    name: 'Metis',
    symbol: 'METIS',
    chainId: 1088,
    rpcUrls: ['https://andromeda.metis.io/?owner=1088'],
    explorer: 'https://andromeda-explorer.metis.io',
    decimals: 18,
    color: '#00D3D5',
    icon: 'fas fa-network-wired'
  },
  {
    id: 'polygonzkevm',
    name: 'Polygon zkEVM',
    symbol: 'ETH',
    chainId: 1101,
    rpcUrls: ['https://zkevm-rpc.com'],
    explorer: 'https://zkevm.polygonscan.com',
    decimals: 18,
    color: '#8247E5',
    icon: 'fas fa-lock'
  },
  {
    id: 'linea',
    name: 'Linea',
    symbol: 'ETH',
    chainId: 59144,
    rpcUrls: ['https://rpc.linea.build'],
    explorer: 'https://lineascan.build',
    decimals: 18,
    color: '#121212',
    icon: 'fas fa-road'
  },
  {
    id: 'scroll',
    name: 'Scroll',
    symbol: 'ETH',
    chainId: 534352,
    rpcUrls: ['https://rpc.scroll.io'],
    explorer: 'https://scrollscan.com',
    decimals: 18,
    color: '#FFE66D',
    icon: 'fas fa-scroll'
  }
];

// Sistema de Gerenciamento de Blockchains
const BlockchainManager = {
  // Estado
  currentSelectedChain: 'polygon',
  realChainBalances: {},
  otherChainsWallets: {},
  
  // Inicializar
  initialize: function() {
    this.initializeBalances();
    this.initializeBlockchainButtons();
  },
  
  // Inicializar saldos
  initializeBalances: function() {
    blockchains.forEach(chain => {
      this.realChainBalances[chain.id] = '0.0000';
    });
    
    // Restaurar do localStorage
    const savedBalances = localStorage.getItem('exclusiveWalletChainBalances');
    if (savedBalances) {
      const parsedBalances = JSON.parse(savedBalances);
      Object.keys(parsedBalances).forEach(chainId => {
        if (this.realChainBalances[chainId] !== undefined) {
          this.realChainBalances[chainId] = parsedBalances[chainId];
        }
      });
    }
  },
  
  // Salvar saldos
  saveBalances: function() {
    localStorage.setItem('exclusiveWalletChainBalances', JSON.stringify(this.realChainBalances));
  },
  
  // Atualizar saldo
  updateChainBalance: function(chainId, balance) {
    const formattedBalance = parseFloat(balance).toFixed(4);
    this.realChainBalances[chainId] = formattedBalance;
    this.saveBalances();
    
    // Atualizar UI se for a chain atual
    if (chainId === this.currentSelectedChain) {
      this.updateCurrentChainDisplay();
    }
    
    return formattedBalance;
  },
  
  // Atualizar exibição da chain atual
  updateCurrentChainDisplay: function() {
    const balance = this.realChainBalances[this.currentSelectedChain] || '0.0000';
    const chain = this.getChainById(this.currentSelectedChain);
    
    const balanceElement = document.getElementById('currentChainBalance');
    if (balanceElement) {
      balanceElement.textContent = balance;
    }
    
    // Atualizar valor em USD
    if (chain) {
      const priceMultipliers = {
        polygon: 0.8,
        ethereum: 3500,
        bsc: 300,
        avalanche: 35,
        arbitrum: 3500,
        optimism: 3500,
        base: 3500,
        harmony: 0.02,
        fantom: 0.3,
        cronos: 0.1,
        kava: 0.7,
        celo: 0.5,
        moonbeam: 0.3,
        moonriver: 20,
        gnosis: 100,
        fuse: 0.05,
        metis: 40,
        polygonzkevm: 3500,
        linea: 3500,
        scroll: 3500
      };
      
      const multiplier = priceMultipliers[chain.id] || 1;
      const usdAmount = parseFloat(balance) * multiplier;
      const usdValue = `≈ $${usdAmount.toFixed(2)} USD`;
      
      const valueElement = document.getElementById('currentChainValue');
      if (valueElement) {
        valueElement.textContent = usdValue;
      }
    }
  },
  
  // Obter chain por ID
  getChainById: function(chainId) {
    return blockchains.find(c => c.id === chainId);
  },
  
  // Obter chain por nome
  getChainByName: function(name) {
    return blockchains.find(c => c.name.toLowerCase() === name.toLowerCase());
  },
  
  // Selecionar blockchain
  selectBlockchain: function(chainId) {
    this.currentSelectedChain = chainId;
    
    // Atualizar botões ativos
    document.querySelectorAll('.blockchain-button').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-chain') === chainId) {
        btn.classList.add('active');
      }
    });
    
    // Atualizar exibição
    this.updateCurrentChainDisplay();
    
    return this.getChainById(chainId);
  },
  
  // Inicializar botões
  initializeBlockchainButtons: function() {
    const container = document.getElementById('blockchainButtonsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    blockchains.forEach(chain => {
      const button = document.createElement('button');
      button.className = 'blockchain-button';
      button.setAttribute('data-chain', chain.id);
      button.innerHTML = `
        <i class="${chain.icon}" style="margin-right: 5px;"></i>
        ${chain.name}
      `;
      
      if (chain.id === this.currentSelectedChain) {
        button.classList.add('active');
      }
      
      button.addEventListener('click', () => {
        const selectedChain = this.selectBlockchain(chain.id);
        if (window.switchTab) {
          window.switchTab('walletTab');
        }
        
        // Notificação
        if (window.showNotification) {
          window.showNotification(`Dashboard ${selectedChain.name} carregado`, 'success');
        }
      });
      
      container.appendChild(button);
    });
  },
  
  // Gerar saldo aleatório
  generateRandomBalance: function(chainId) {
    const min = 0.001;
    const max = 100;
    const randomBalance = (Math.random() * (max - min) + min).toFixed(4);
    return this.updateChainBalance(chainId, randomBalance);
  },
  
  // Obter todas as blockchains
  getAllBlockchains: function() {
    return blockchains;
  },
  
  // Verificar se tem wallet
  hasWallet: function(chainId) {
    return !!this.otherChainsWallets[chainId] || 
           (chainId === 'polygon' && !!window.currentWallet);
  },
  
  // Adicionar wallet
  addWallet: function(chainId, walletData) {
    this.otherChainsWallets[chainId] = walletData;
    
    // Gerar saldo inicial
    if (!this.realChainBalances[chainId] || this.realChainBalances[chainId] === '0.0000') {
      this.generateRandomBalance(chainId);
    }
  },
  
  // Remover wallet
  removeWallet: function(chainId) {
    delete this.otherChainsWallets[chainId];
    this.updateChainBalance(chainId, '0.0000');
  },
  
  // Obter saldo atual
  getCurrentBalance: function() {
    return this.realChainBalances[this.currentSelectedChain] || '0.0000';
  },
  
  // Obter chain atual
  getCurrentChain: function() {
    return this.getChainById(this.currentSelectedChain);
  }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  BlockchainManager.initialize();
});
