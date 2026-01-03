// ======================================================
// VARIÁVEIS GLOBAIS E CONFIGURAÇÕES
// ======================================================

const { ethers } = window;
let currentWallet = null;
let currentTheme = 'luxury';
let privateKeyVisible = false;
let mnemonicVisible = false;
let mnemonicPhrase = null;
let mnemonicCreationTimer = null;
let mnemonicTimerSeconds = 300;
let isAddressRegistered = false;

// INFRA IDENTITY - RPC CONFIGURAÇÃO
let currentRpcProvider = 'https://polygon-rpc.com';
let polygonProvider = null;
let networkStatus = {
  connected: false,
  latency: 0,
  lastBlock: 0,
  gasPrice: '30'
};

// Configurações da Polygon
const polygonConfig = {
  name: 'Polygon',
  chainId: 137,
  symbol: 'MATIC',
  explorer: 'https://polygonscan.com',
  decimals: 18,
  rpcUrls: [
    'https://polygon-rpc.com',
    'https://identitydynamic.avizaecosystem.workers.dev',
    'https://rpc-mainnet.maticvigil.com',
    'https://polygon-mainnet.infura.io/v3/',
    'https://matic-mainnet.chainstacklabs.com'
  ]
};

// LISTA DE 20 BLOCKCHAINS
const blockchains = [
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', chainId: 137 },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', chainId: 1 },
  { id: 'bsc', name: 'BSC', symbol: 'BNB', chainId: 56 },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', chainId: 43114 },
  { id: 'fantom', name: 'Fantom', symbol: 'FTM', chainId: 250 },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH', chainId: 42161 },
  { id: 'optimism', name: 'Optimism', symbol: 'ETH', chainId: 10 },
  { id: 'base', name: 'Base', symbol: 'ETH', chainId: 8453 },
  { id: 'cronos', name: 'Cronos', symbol: 'CRO', chainId: 25 },
  { id: 'harmony', name: 'Harmony', symbol: 'ONE', chainId: 1666600000 },
  { id: 'kava', name: 'Kava', symbol: 'KAVA', chainId: 2222 },
  { id: 'celo', name: 'Celo', symbol: 'CELO', chainId: 42220 },
  { id: 'moonbeam', name: 'Moonbeam', symbol: 'GLMR', chainId: 1284 },
  { id: 'moonriver', name: 'Moonriver', symbol: 'MOVR', chainId: 1285 },
  { id: 'gnosis', name: 'Gnosis', symbol: 'xDAI', chainId: 100 },
  { id: 'fuse', name: 'Fuse', symbol: 'FUSE', chainId: 122 },
  { id: 'metis', name: 'Metis', symbol: 'METIS', chainId: 1088 },
  { id: 'polygonzkevm', name: 'Polygon zkEVM', symbol: 'ETH', chainId: 1101 },
  { id: 'linea', name: 'Linea', symbol: 'ETH', chainId: 59144 },
  { id: 'scroll', name: 'Scroll', symbol: 'ETH', chainId: 534352 }
];

// Wallets para outras chains
const otherChainsWallets = {};
let currentSelectedChain = 'polygon';
let mnemonicCreationTimerOther = null;
let mnemonicTimerSecondsOther = 300;
let currentChainForCreation = '';

// VARIÁVEIS PARA COMUNICAÇÃO
let authorizedChatAddress = null;
let contacts = [];
let currentChatContact = null;
let videoStream = null;
let peerConnection = null;
let groupVideoStream = null;

// VARIÁVEIS PARA IDENTITY DYNAMIC
let identityDynamicAuthorized = false;
let identityDynamicSessionId = null;
let identityDynamicSignature = null;

// SALDOS REAIS DAS BLOCKCHAINS (simulados inicialmente)
const realChainBalances = {
  polygon: '0.0000',
  ethereum: '0.0000',
  bsc: '0.0000',
  avalanche: '0.0000',
  fantom: '0.0000',
  arbitrum: '0.0000',
  optimism: '0.0000',
  base: '0.0000',
  cronos: '0.0000',
  harmony: '0.0000',
  kava: '0.0000',
  celo: '0.0000',
  moonbeam: '0.0000',
  moonriver: '0.0000',
  gnosis: '0.0000',
  fuse: '0.0000',
  metis: '0.0000',
  polygonzkevm: '0.0000',
  linea: '0.0000',
  scroll: '0.0000'
};

// ======================================================
// FUNÇÕES DE INICIALIZAÇÃO E BOOTSTRAP
// ======================================================

// Inicialização do sistema quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  // Tema
  const savedTheme = localStorage.getItem('premiumWalletTheme') || 'luxury';
  currentTheme = savedTheme;
  document.body.className = `theme-${currentTheme}`;
  updateThemeButton();
  
  // Elementos de Login
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('loginPrivateKey').addEventListener('click', connectPrivateKey);
  document.getElementById('createWallet').addEventListener('click', createNewWallet);
  document.getElementById('restoreMnemonicLogin').addEventListener('click', openMnemonicModal);
  document.getElementById('restoreMnemonicNew').addEventListener('click', openMnemonicModal);
  
  // Modal de Mnemônica (Criação)
  document.getElementById('closeMnemonicCreationModal').addEventListener('click', closeMnemonicCreationModal);
  document.getElementById('cancelWalletCreation').addEventListener('click', closeMnemonicCreationModal);
  document.getElementById('confirmMnemonicSaved').addEventListener('click', confirmMnemonicSaved);
  
  // Modal de Mnemônica (Restauração)
  document.getElementById('closeMnemonicModal').addEventListener('click', closeMnemonicModal);
  document.getElementById('cancelRestore').addEventListener('click', closeMnemonicModal);
  document.getElementById('confirmRestore').addEventListener('click', restoreWalletFromMnemonic);
  
  // Modal de Mnemônica (Outras Chains - Criação)
  document.getElementById('closeMnemonicCreationModalOther').addEventListener('click', closeMnemonicCreationModalOther);
  document.getElementById('cancelWalletCreationOther').addEventListener('click', closeMnemonicCreationModalOther);
  document.getElementById('confirmMnemonicSavedOther').addEventListener('click', confirmMnemonicSavedOther);
  
  // Modal de Mnemônica (Outras Chains - Restauração)
  document.getElementById('closeMnemonicModalOther').addEventListener('click', closeMnemonicModalOther);
  document.getElementById('cancelRestoreOther').addEventListener('click', closeMnemonicModalOther);
  document.getElementById('confirmRestoreOther').addEventListener('click', confirmRestoreOther);
  
  // Tabs
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
  
  // Sub-tabs
  document.querySelectorAll('.sub-tab-btn').forEach(button => {
    button.addEventListener('click', () => {
      const subTabId = button.getAttribute('data-subtab');
      switchSubTab(subTabId);
    });
  });
  
  // Verificar se já tem wallet conectada
  const savedPK = localStorage.getItem('exclusiveWalletPK');
  if (savedPK) {
    try {
      currentWallet = new ethers.Wallet(savedPK);
      
      // Restaurar autorização Identity Dynamic se existir
      if (localStorage.getItem('identityDynamicAuth') === 'true') {
        identityDynamicAuthorized = true;
        identityDynamicSessionId = localStorage.getItem('identityDynamicSession');
        identityDynamicSignature = localStorage.getItem('identityDynamicSignature');
      }
      
      // Restaurar registro de endereço
      isAddressRegistered = localStorage.getItem('exclusiveWalletAddressRegistered') === 'true';
      
      initializeRpcProvider();
      showWalletDashboard();
      showNotification('Identidade Polygon restaurada da sessão anterior', 'success');
    } catch (error) {
      console.error('Erro ao restaurar wallet:', error);
      localStorage.removeItem('exclusiveWalletPK');
    }
  }
  
  // Adicionar explicação do sistema
  addSystemExplanation();
});

// ======================================================
// FUNÇÕES GLOBAIS DE UTILIDADE
// ======================================================

function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  const messageElement = document.getElementById('notificationMessage');
  
  messageElement.textContent = message;
  
  const colors = {
    info: 'var(--primary-color)',
    success: 'var(--success-color)',
    warning: 'var(--warning-color)',
    error: 'var(--error-color)'
  };
  
  notification.style.borderColor = colors[type] || colors.info;
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 4000);
}

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'luxury' : 'light';
  document.body.className = `theme-${currentTheme}`;
  localStorage.setItem('premiumWalletTheme', currentTheme);
  updateThemeButton();
}

function updateThemeButton() {
  const themeToggle = document.getElementById('themeToggle');
  if (currentTheme === 'light') {
    themeToggle.innerHTML = '<i class="fas fa-moon"></i> Modo Escuro';
  } else {
    themeToggle.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
  }
}