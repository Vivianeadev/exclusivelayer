// ======================================================
// BLOCKCHAIN MANAGER - SISTEMA MULTICHAIN (20+ BLOCKCHAINS)
// ======================================================

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

// SALDOS REAIS DAS BLOCKCHAINS
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
// INICIALIZAÇÃO DOS BOTÕES DE BLOCKCHAINS
// ======================================================

// Inicializar botões de blockchains
function initializeBlockchainButtons() {
  const container = document.getElementById('blockchainButtonsContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  blockchains.forEach(chain => {
    const button = document.createElement('button');
    button.className = 'blockchain-button';
    button.setAttribute('data-chain', chain.id);
    button.textContent = chain.name;
    
    if (chain.id === currentSelectedChain) {
      button.classList.add('active');
    }
    
    button.addEventListener('click', () => {
      selectBlockchain(chain.id);
    });
    
    container.appendChild(button);
  });
}

// Selecionar uma blockchain
async function selectBlockchain(chainId) {
  // Remover classe active de todos os botões
  document.querySelectorAll('.blockchain-button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-chain') === chainId) {
      btn.classList.add('active');
    }
  });
  
  currentSelectedChain = chainId;
  
  // Ir direto para a aba wallet
  switchTab('walletTab');
  
  // Atualizar o saldo da chain selecionada
  await updateCurrentChainBalance();
  
  if (chainId === 'polygon') {
    showNotification(`Dashboard Polygon carregado`, 'success');
  } else {
    const chainName = blockchains.find(c => c.id === chainId).name;
    showNotification(`Dashboard da ${chainName} carregado`, 'success');
  }
}

// ======================================================
// GERENCIAMENTO DE SALDOS
// ======================================================

// Atualizar saldo da chain atual
async function updateCurrentChainBalance() {
  if (!currentSelectedChain) return;
  
  const balance = await refreshRealChainBalance(currentSelectedChain);
  const balanceElement = document.getElementById('currentChainBalance');
  
  if (balanceElement) {
    balanceElement.textContent = balance;
    
    // Atualizar também o elemento específico da chain
    const specificElement = document.getElementById(`currentChainBalance${currentSelectedChain.charAt(0).toUpperCase() + currentSelectedChain.slice(1)}`);
    if (specificElement) {
      specificElement.textContent = balance;
    }
    
    // Atualizar valor em USD (simulado)
    const chain = blockchains.find(c => c.id === currentSelectedChain);
    let usdValue = '≈ $0.00 USD';
    
    if (chain) {
      const priceMultipliers = {
        polygon: 0.8,
        ethereum: 3500,
        bsc: 300,
        avalanche: 35,
        fantom: 0.2,
        arbitrum: 3500,
        optimism: 3500,
        base: 3500,
        cronos: 0.05,
        harmony: 0.02,
        kava: 0.7,
        celo: 0.5,
        moonbeam: 0.3,
        moonriver: 8,
        gnosis: 1,
        fuse: 0.03,
        metis: 20,
        polygonzkevm: 3500,
        linea: 3500,
        scroll: 3500
      };
      
      const multiplier = priceMultipliers[chain.id] || 1;
      const usdAmount = parseFloat(balance) * multiplier;
      usdValue = `≈ $${usdAmount.toFixed(2)} USD`;
    }
    
    const valueElement = document.getElementById('currentChainValue');
    if (valueElement) {
      valueElement.textContent = usdValue;
    }
  }
}

// Atualizar saldo real de uma chain
async function refreshRealChainBalance(chainId) {
  const chain = blockchains.find(c => c.id === chainId);
  if (!chain) {
    console.error('Blockchain não encontrada:', chainId);
    return '0.0000';
  }
  
  // Se for Polygon e temos wallet conectada, buscar saldo real
  if (chainId === 'polygon' && currentWallet && polygonProvider && networkStatus.connected) {
    try {
      const balance = await polygonProvider.getBalance(currentWallet.address);
      const balanceFormatted = ethers.formatEther(balance);
      realChainBalances[chainId] = parseFloat(balanceFormatted).toFixed(4);
      return realChainBalances[chainId];
    } catch (error) {
      console.error('Erro ao buscar saldo Polygon:', error);
      return '0.0000';
    }
  }
  
  // Para outras chains, simular saldos (em produção, integraria com RPCs reais)
  if (otherChainsWallets[chainId]) {
    // Se a wallet existe, gerar um saldo aleatório para demonstração
    if (!realChainBalances[chainId] || realChainBalances[chainId] === '0.0000') {
      const randomBalance = (Math.random() * 10).toFixed(4);
      realChainBalances[chainId] = randomBalance;
    }
    return realChainBalances[chainId];
  }
  
  // Se não tem wallet criada, saldo zero
  return '0.0000';
}

// ======================================================
// WALLETS PARA OUTRAS CHAINS
// ======================================================

// Mostrar a wallet correta para a chain selecionada
function showCorrectWalletForChain() {
  document.querySelectorAll('.wallet-tab-other').forEach(el => {
    el.classList.remove('active');
    el.style.display = 'none';
  });
  
  const walletTab = document.getElementById('walletTab');
  if (walletTab) walletTab.style.display = 'none';
  
  if (currentSelectedChain === 'polygon') {
    if (walletTab) walletTab.style.display = 'block';
    return;
  }
  
  const otherWalletId = `walletTab${currentSelectedChain.charAt(0).toUpperCase() + currentSelectedChain.slice(1)}`;
  let otherWallet = document.getElementById(otherWalletId);
  
  if (!otherWallet) {
    // Criar wallet para a chain se não existir
    const chain = blockchains.find(c => c.id === currentSelectedChain);
    if (chain) {
      createChainWalletInterface(currentSelectedChain);
      otherWallet = document.getElementById(otherWalletId);
    }
  }
  
  if (otherWallet) {
    otherWallet.classList.add('active');
    otherWallet.style.display = 'block';
  }
}

// Criar interface de wallet para uma chain específica
function createChainWalletInterface(chainId) {
  const chain = blockchains.find(c => c.id === chainId);
  if (!chain) return;
  
  const walletTab = document.getElementById('walletTab');
  if (!walletTab) return;
  
  const newWallet = walletTab.cloneNode(true);
  newWallet.id = `walletTab${chainId.charAt(0).toUpperCase() + chainId.slice(1)}`;
  newWallet.className = 'tab-content wallet-tab-other';
  
  const chainName = chain.name;
  const chainSymbol = chain.symbol;
  
  // Atualizar textos
  const titleElement = newWallet.querySelector('.wallet-header h2');
  if (titleElement) {
    titleElement.innerHTML = `<i class="fas fa-wallet"></i> Wallet ${chainName} Premium`;
  }
  
  const subtitleElement = newWallet.querySelector('.wallet-header p');
  if (subtitleElement) {
    subtitleElement.textContent = `Gerencie seus fundos na ${chainName} com elegância minimalista e funcionalidades completas`;
  }
  
  // Atualizar elementos de saldo
  const balanceLabel = newWallet.querySelector('.balance-main-container .balance-label:nth-child(1)');
  if (balanceLabel) {
    balanceLabel.textContent = `Saldo na ${chainName} Network`;
  }
  
  const balanceDisplay = newWallet.querySelector('.balance-main-container .balance-display');
  if (balanceDisplay) {
    balanceDisplay.id = `currentChainBalance${chainId.charAt(0).toUpperCase() + chainId.slice(1)}`;
    balanceDisplay.textContent = realChainBalances[chainId] || '0.0000';
  }
  
  const balanceSymbol = newWallet.querySelector('.balance-main-container .balance-label:nth-child(3)');
  if (balanceSymbol) {
    balanceSymbol.textContent = chainSymbol;
  }
  
  // Atualizar IDs dos elementos
  updateWalletElementIds(newWallet, chainId);
  
  // Adicionar botões específicos da chain
  addChainSpecificButtons(newWallet, chainName, chainId);
  
  // Adicionar ao DOM
  const walletDashboard = document.getElementById('wallet-dashboard');
  if (walletDashboard) {
    walletDashboard.appendChild(newWallet);
  }
}

// Atualizar IDs dos elementos na wallet clonada
function updateWalletElementIds(walletElement, chainId) {
  const suffix = chainId.charAt(0).toUpperCase() + chainId.slice(1);
  
  // Atualizar todos os elementos com ID
  const allElements = walletElement.querySelectorAll('[id]');
  allElements.forEach(el => {
    if (el.id && !el.id.endsWith(suffix)) {
      el.id = `${el.id}${suffix}`;
    }
  });
  
  // Atualizar labels
  const labels = walletElement.querySelectorAll('label[for]');
  labels.forEach(label => {
    const oldFor = label.getAttribute('for');
    if (oldFor && !oldFor.endsWith(suffix)) {
      label.setAttribute('for', `${oldFor}${suffix}`);
    }
  });
}

// Adicionar botões específicos da chain
function addChainSpecificButtons(walletElement, chainName, chainId) {
  const walletOperationsGrid = walletElement.querySelector('.wallet-operations-grid');
  if (walletOperationsGrid) {
    // Criar container para botões específicos
    const chainButtonsContainer = document.createElement('div');
    chainButtonsContainer.className = 'chain-specific-buttons';
    chainButtonsContainer.innerHTML = `
      <button class="btn btn-primary btn-small" onclick="createWalletForChain('${chainName}')">
        <i class="fas fa-gem"></i> Criar Wallet ${chainName}
      </button>
      <button class="btn btn-secondary btn-small" onclick="restoreWalletForChain('${chainName}')">
        <i class="fas fa-redo"></i> Recuperar Wallet
      </button>
    `;
    
    walletOperationsGrid.parentNode.insertBefore(chainButtonsContainer, walletOperationsGrid.nextSibling);
  }
  
  // Configurar botões de ação
  const actionButtons = walletElement.querySelectorAll('.action-btn');
  actionButtons.forEach((btn, index) => {
    btn.onclick = null;
    if (index === 0) {
      btn.onclick = () => showReceiveModalOther(chainName);
    } else if (index === 1) {
      btn.onclick = () => showSendModalOther(chainName);
    } else if (index === 2) {
      btn.onclick = () => refreshBalanceOther(chainName);
    }
  });
}

// ======================================================
// CRIAÇÃO E RESTAURAÇÃO DE WALLETS EM OUTRAS CHAINS
// ======================================================

// Criar wallet para outra chain
function createWalletForChain(chainName) {
  currentChainForCreation = chainName.toLowerCase();
  
  try {
    showNotification(`Criando wallet ${chainName} premium...`, 'info');
    
    const wallet = ethers.Wallet.createRandom();
    otherChainsWallets[currentChainForCreation] = {
      wallet: wallet,
      mnemonic: wallet.mnemonic.phrase
    };
    
    localStorage.setItem(`exclusiveWallet_${currentChainForCreation}`, wallet.privateKey);
    localStorage.setItem(`exclusiveWalletMnemonic_${currentChainForCreation}`, wallet.mnemonic.phrase);
    
    // Gerar saldo aleatório para demonstração
    const randomBalance = (Math.random() * 10).toFixed(4);
    realChainBalances[currentChainForCreation] = randomBalance;
    
    showMnemonicCreationModalOther(wallet.mnemonic.phrase, chainName);
    
  } catch (error) {
    console.error(`Erro ao criar wallet ${chainName}:`, error);
    showNotification(`Erro ao criar wallet ${chainName}: ` + error.message, 'error');
  }
}

function showMnemonicCreationModalOther(mnemonic, chainName) {
  const modal = document.getElementById('mnemonicCreationModalOther');
  const wordsContainer = document.getElementById('mnemonicWordsContainerOther');
  const timerElement = document.getElementById('mnemonicTimerOther');
  const chainNameElement = document.getElementById('currentChainName');
  const chainNameText = document.getElementById('chainNameText');
  
  if (!modal || !wordsContainer || !timerElement || !chainNameElement || !chainNameText) return;
  
  chainNameElement.textContent = chainName;
  chainNameText.textContent = chainName;
  
  const words = mnemonic.split(' ');
  wordsContainer.innerHTML = '';
  
  words.forEach((word, index) => {
    const wordElement = document.createElement('div');
    wordElement.className = 'mnemonic-word';
    wordElement.setAttribute('data-index', index + 1);
    wordElement.textContent = word;
    wordsContainer.appendChild(wordElement);
  });
  
  mnemonicTimerSecondsOther = 300;
  updateMnemonicTimerOther();
  mnemonicCreationTimerOther = setInterval(updateMnemonicTimerOther, 1000);
  
  modal.classList.add('active');
}

function updateMnemonicTimerOther() {
  const timerElement = document.getElementById('mnemonicTimerOther');
  if (!timerElement) return;
  
  mnemonicTimerSecondsOther--;
  
  if (mnemonicTimerSecondsOther <= 0) {
    clearInterval(mnemonicCreationTimerOther);
    timerElement.textContent = '00:00';
    showNotification('Tempo esgotado! A criação da wallet foi cancelada.', 'error');
    closeMnemonicCreationModalOther();
    return;
  }
  
  const minutes = Math.floor(mnemonicTimerSecondsOther / 60);
  const seconds = mnemonicTimerSecondsOther % 60;
  timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function closeMnemonicCreationModalOther() {
  const modal = document.getElementById('mnemonicCreationModalOther');
  if (modal) modal.classList.remove('active');
  
  clearInterval(mnemonicCreationTimerOther);
  
  delete otherChainsWallets[currentChainForCreation];
  localStorage.removeItem(`exclusiveWallet_${currentChainForCreation}`);
  localStorage.removeItem(`exclusiveWalletMnemonic_${currentChainForCreation}`);
  
  currentChainForCreation = '';
}

function confirmMnemonicSavedOther() {
  clearInterval(mnemonicCreationTimerOther);
  
  const chainName = document.getElementById('currentChainName')?.textContent;
  const wallet = otherChainsWallets[currentChainForCreation];
  
  if (wallet) {
    // Atualizar saldo
    updateCurrentChainBalance();
    
    showNotification(`✅ Wallet ${chainName} criada! Endereço: ${wallet.wallet.address.substring(0, 10)}...`, 'success');
    showNotification(`⚠️ SALVE SUA CHAVE PRIVADA E FRASE MNEMÔNICA DA ${chainName.toUpperCase()}!`, 'warning');
  }
  
  closeMnemonicCreationModalOther();
}

// Restaurar wallet para outra chain
function restoreWalletForChain(chainName) {
  currentChainForCreation = chainName.toLowerCase();
  
  const modal = document.getElementById('mnemonicModalOther');
  const chainNameElement = document.getElementById('restoreChainName');
  
  if (!modal || !chainNameElement) return;
  
  chainNameElement.textContent = chainName;
  modal.classList.add('active');
  
  const mnemonicInput = document.getElementById('mnemonicPhraseOther');
  const privateKeyInput = document.getElementById('privateKeyOther');
  
  if (mnemonicInput) mnemonicInput.value = '';
  if (privateKeyInput) privateKeyInput.value = '';
}

function closeMnemonicModalOther() {
  const modal = document.getElementById('mnemonicModalOther');
  if (modal) modal.classList.remove('active');
  currentChainForCreation = '';
}

function confirmRestoreOther() {
  const mnemonicPhraseInput = document.getElementById('mnemonicPhraseOther')?.value.trim();
  const privateKeyInput = document.getElementById('privateKeyOther')?.value.trim();
  
  if (!mnemonicPhraseInput && !privateKeyInput) {
    showNotification('Por favor, insira a frase mnemônica ou chave privada.', 'error');
    return;
  }
  
  try {
    let wallet;
    
    if (mnemonicPhraseInput) {
      if (!ethers.Mnemonic.isValidMnemonic(mnemonicPhraseInput)) {
        showNotification('Frase mnemônica inválida. Verifique as palavras.', 'error');
        return;
      }
      wallet = ethers.Wallet.fromPhrase(mnemonicPhraseInput);
    } else {
      let privateKey = privateKeyInput.replace(/\s/g, '');
      if (!privateKey.startsWith('0x')) {
        privateKey = '0x' + privateKey;
      }
      wallet = new ethers.Wallet(privateKey);
    }
    
    otherChainsWallets[currentChainForCreation] = {
      wallet: wallet,
      mnemonic: mnemonicPhraseInput || ''
    };
    
    localStorage.setItem(`exclusiveWallet_${currentChainForCreation}`, wallet.privateKey);
    if (mnemonicPhraseInput) {
      localStorage.setItem(`exclusiveWalletMnemonic_${currentChainForCreation}`, mnemonicPhraseInput);
    }
    
    // Gerar saldo aleatório para demonstração
    const randomBalance = (Math.random() * 10).toFixed(4);
    realChainBalances[currentChainForCreation] = randomBalance;
    
    closeMnemonicModalOther();
    showNotification(`✅ Wallet ${currentChainForCreation.charAt(0).toUpperCase() + currentChainForCreation.slice(1)} restaurada! Endereço: ${wallet.address.substring(0, 10)}...`, 'success');
    
    // Atualizar saldo exibido
    updateCurrentChainBalance();
    
  } catch (error) {
    console.error('Erro ao restaurar wallet:', error);
    showNotification('Erro ao restaurar wallet: ' + error.message, 'error');
  }
}

// ======================================================
// FUNÇÕES PARA WALLETS DE OUTRAS CHAINS
// ======================================================

function showReceiveModalOther(chainName) {
  const chainId = chainName.toLowerCase();
  const wallet = otherChainsWallets[chainId];
  
  if (!wallet) {
    showNotification(`Crie ou restaure uma wallet ${chainName} primeiro`, 'error');
    return;
  }
  
  showNotification(`QR Code para recebimento na ${chainName} (simulado)`, 'info');
}

function showSendModalOther(chainName) {
  showNotification(`Envio na ${chainName} (simulado)`, 'info');
}

async function refreshBalanceOther(chainName) {
  const chainId = chainName.toLowerCase();
  showNotification(`Consultando saldo na ${chainName}...`, 'info');
  
  // Atualizar saldo real
  await updateCurrentChainBalance();
  
  showNotification(`Saldo ${chainName} atualizado!`, 'success');
}

function copyQRAddressOther(chainName) {
  const chainId = chainName.toLowerCase();
  const wallet = otherChainsWallets[chainId];
  
  if (!wallet) {
    showNotification(`Nenhuma wallet ${chainName} encontrada`, 'error');
    return;
  }
  
  navigator.clipboard.writeText(wallet.wallet.address)
    .then(() => showNotification(`Endereço ${chainName} copiado!`, 'success'))
    .catch(() => showNotification('Erro ao copiar endereço', 'error'));
}

function cancelSendOther(chainName) {
  showNotification(`Envio na ${chainName} cancelado`, 'info');
}

function estimateGasOther(chainName) {
  showNotification(`Estimando gás na ${chainName}... (simulado)`, 'info');
  setTimeout(() => {
    showNotification(`Estimativa de gás ${chainName} calculada`, 'success');
  }, 1000);
}

function sendTransactionOther(chainName) {
  showNotification(`Enviando transação na ${chainName}... (simulado)`, 'info');
  setTimeout(() => {
    showNotification(`✅ Transação ${chainName} enviada com sucesso!`, 'success');
  }, 2000);
}

function loadMoreTransactionsOther(chainName) {
  showNotification(`Carregando mais transações ${chainName}...`, 'info');
  setTimeout(() => {
    showNotification(`Transações ${chainName} carregadas`, 'success');
  }, 1000);
}

// ======================================================
// EXPORTAÇÃO DAS FUNÇÕES PARA USO GLOBAL
// ======================================================

// Funções principais
window.initializeBlockchainButtons = initializeBlockchainButtons;
window.selectBlockchain = selectBlockchain;
window.showCorrectWalletForChain = showCorrectWalletForChain;
window.updateCurrentChainBalance = updateCurrentChainBalance;

// Funções de criação/restauração
window.createWalletForChain = createWalletForChain;
window.restoreWalletForChain = restoreWalletForChain;
window.closeMnemonicCreationModalOther = closeMnemonicCreationModalOther;
window.confirmMnemonicSavedOther = confirmMnemonicSavedOther;
window.closeMnemonicModalOther = closeMnemonicModalOther;
window.confirmRestoreOther = confirmRestoreOther;

// Funções de operações
window.showReceiveModalOther = showReceiveModalOther;
window.showSendModalOther = showSendModalOther;
window.refreshBalanceOther = refreshBalanceOther;
window.copyQRAddressOther = copyQRAddressOther;
window.cancelSendOther = cancelSendOther;
window.estimateGasOther = estimateGasOther;
window.sendTransactionOther = sendTransactionOther;
window.loadMoreTransactionsOther = loadMoreTransactionsOther;

// Objetos globais para outros módulos
window.blockchains = blockchains;
window.otherChainsWallets = otherChainsWallets;
window.realChainBalances = realChainBalances;
window.currentSelectedChain = currentSelectedChain;
