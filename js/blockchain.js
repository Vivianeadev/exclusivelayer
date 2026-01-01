// ======================================================
// FUNÇÕES PARA GESTÃO DE BLOCKCHAINS
// ======================================================

// Variáveis globais para blockchains
let currentSelectedChain = 'polygon';
let otherChainsWallets = {};
let currentChainForCreation = '';

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

// Inicializar botões de blockchains
function initializeBlockchainButtons() {
  const container = document.getElementById('blockchainButtonsContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  CONSTANTS.BLOCKCHAINS.forEach(chain => {
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
  document.querySelectorAll('.blockchain-button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-chain') === chainId) {
      btn.classList.add('active');
    }
  });
  
  currentSelectedChain = chainId;
  
  // Ir direto para a aba wallet
  if (typeof window.switchTab === 'function') {
    window.switchTab('walletTab');
  }
  
  // Atualizar o saldo da chain selecionada
  await updateCurrentChainBalance();
  
  if (chainId === 'polygon') {
    showNotification(`Dashboard Polygon carregado`, 'success');
  } else {
    const chainName = CONSTANTS.BLOCKCHAINS.find(c => c.id === chainId)?.name;
    showNotification(`Dashboard da ${chainName} carregado`, 'success');
  }
}

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
    const chain = CONSTANTS.BLOCKCHAINS.find(c => c.id === currentSelectedChain);
    let usdValue = '≈ $0.00 USD';
    
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
        // outros...
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

// Atualizar saldo real da chain
async function refreshRealChainBalance(chainId) {
  const chain = CONSTANTS.BLOCKCHAINS.find(c => c.id === chainId);
  if (!chain) {
    console.error('Blockchain não encontrada:', chainId);
    return '0.0000';
  }
  
  // Se for Polygon e temos wallet conectada, buscar saldo real
  if (chainId === 'polygon' && window.currentWallet && window.polygonProvider && window.networkStatus?.connected) {
    try {
      const ethers = window.ethers;
      if (!ethers) {
        console.error('Ethers.js não carregado');
        return '0.0000';
      }
      
      const balance = await window.polygonProvider.getBalance(window.currentWallet.address);
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

// Mostrar wallet correta para a chain selecionada
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
    // Se a wallet não existe, mostrar interface de criação
    createChainWalletInterface(currentSelectedChain);
    otherWallet = document.getElementById(otherWalletId);
  }
  
  if (otherWallet) {
    otherWallet.classList.add('active');
    otherWallet.style.display = 'block';
  }
}

// Criar interface de wallet para uma chain específica
function createChainWalletInterface(chainId) {
  const chain = CONSTANTS.BLOCKCHAINS.find(c => c.id === chainId);
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

// Criar wallet para outra chain
function createWalletForChain(chainName) {
  currentChainForCreation = chainName.toLowerCase();
  
  try {
    const ethers = window.ethers;
    if (!ethers) {
      throw new Error('Ethers.js não carregado');
    }
    
    showNotification(`Criando wallet ${chainName} premium...`, 'info');
    
    const wallet = ethers.Wallet.createRandom();
    otherChainsWallets[currentChainForCreation] = {
      wallet: wallet,
      mnemonic: wallet.mnemonic?.phrase
    };
    
    saveToStorage(`exclusiveWallet_${currentChainForCreation}`, wallet.privateKey);
    if (wallet.mnemonic?.phrase) {
      saveToStorage(`exclusiveWalletMnemonic_${currentChainForCreation}`, wallet.mnemonic.phrase);
    }
    
    // Gerar saldo aleatório para demonstração
    const randomBalance = (Math.random() * 10).toFixed(4);
    realChainBalances[currentChainForCreation] = randomBalance;
    
    showMnemonicCreationModalOther(wallet.mnemonic?.phrase || '', chainName);
    
  } catch (error) {
    console.error(`Erro ao criar wallet ${chainName}:`, error);
    showNotification(`Erro ao criar wallet ${chainName}: ` + error.message, 'error');
  }
}

// Mostrar modal de criação de mnemônica para outras chains
function showMnemonicCreationModalOther(mnemonic, chainName) {
  const modal = document.getElementById('mnemonicCreationModalOther');
  const wordsContainer = document.getElementById('mnemonicWordsContainerOther');
  const timerElement = document.getElementById('mnemonicTimerOther');
  const chainNameElement = document.getElementById('currentChainName');
  const chainNameText = document.getElementById('chainNameText');
  
  if (!modal || !wordsContainer || !timerElement || !chainNameElement || !chainNameText) {
    showNotification('Elementos do modal não encontrados', 'error');
    return;
  }
  
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
  
  let mnemonicTimerSecondsOther = CONSTANTS ? CONSTANTS.MNEMONIC_TIMER_SECONDS : 300;
  window.mnemonicCreationTimerOther = setInterval(() => {
    mnemonicTimerSecondsOther--;
    
    if (mnemonicTimerSecondsOther <= 0) {
      clearInterval(window.mnemonicCreationTimerOther);
      if (timerElement) timerElement.textContent = '00:00';
      showNotification('Tempo esgotado! A criação da wallet foi cancelada.', 'error');
      closeMnemonicCreationModalOther();
      return;
    }
    
    const minutes = Math.floor(mnemonicTimerSecondsOther / 60);
    const seconds = mnemonicTimerSecondsOther % 60;
    if (timerElement) {
      timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }, 1000);
  
  modal.classList.add('active');
}

// Fechar modal de criação de mnemônica para outras chains
function closeMnemonicCreationModalOther() {
  const modal = document.getElementById('mnemonicCreationModalOther');
  if (modal) {
    modal.classList.remove('active');
  }
  
  if (window.mnemonicCreationTimerOther) {
    clearInterval(window.mnemonicCreationTimerOther);
  }
  
  delete otherChainsWallets[currentChainForCreation];
  removeFromStorage(`exclusiveWallet_${currentChainForCreation}`);
  removeFromStorage(`exclusiveWalletMnemonic_${currentChainForCreation}`);
  
  currentChainForCreation = '';
}

// Confirmar mnemônica salva para outras chains
function confirmMnemonicSavedOther() {
  if (window.mnemonicCreationTimerOther) {
    clearInterval(window.mnemonicCreationTimerOther);
  }
  
  const chainName = document.getElementById('currentChainName')?.textContent;
  const wallet = otherChainsWallets[currentChainForCreation];
  
  if (wallet) {
    // Atualizar saldo
    updateCurrentChainBalance();
    
    showNotification(`✅ Wallet ${chainName} criada! Endereço: ${formatAddress(wallet.wallet.address)}`, 'success');
    showNotification(`⚠️ SALVE SUA CHAVE PRIVADA E FRASE MNEMÔNICA DA ${chainName.toUpperCase()}!`, 'warning');
  }
  
  closeMnemonicCreationModalOther();
}

// Restaurar wallet para outra chain
function restoreWalletForChain(chainName) {
  currentChainForCreation = chainName.toLowerCase();
  
  const modal = document.getElementById('mnemonicModalOther');
  const chainNameElement = document.getElementById('restoreChainName');
  
  if (modal) modal.classList.add('active');
  if (chainNameElement) chainNameElement.textContent = chainName;
  
  const mnemonicPhraseInput = document.getElementById('mnemonicPhraseOther');
  const privateKeyInput = document.getElementById('privateKeyOther');
  if (mnemonicPhraseInput) mnemonicPhraseInput.value = '';
  if (privateKeyInput) privateKeyInput.value = '';
}

// Fechar modal de restauração para outras chains
function closeMnemonicModalOther() {
  const modal = document.getElementById('mnemonicModalOther');
  if (modal) {
    modal.classList.remove('active');
  }
  currentChainForCreation = '';
}

// Confirmar restauração para outras chains
function confirmRestoreOther() {
  const mnemonicPhraseInput = document.getElementById('mnemonicPhraseOther');
  const privateKeyInput = document.getElementById('privateKeyOther');
  
  const mnemonicPhrase = mnemonicPhraseInput?.value.trim();
  const privateKey = privateKeyInput?.value.trim();
  
  if (!mnemonicPhrase && !privateKey) {
    showNotification('Por favor, insira a frase mnemônica ou chave privada.', 'error');
    return;
  }
  
  try {
    const ethers = window.ethers;
    if (!ethers) {
      throw new Error('Ethers.js não carregado');
    }
    
    let wallet;
    
    if (mnemonicPhrase) {
      if (!ethers.Mnemonic.isValidMnemonic(mnemonicPhrase)) {
        showNotification('Frase mnemônica inválida. Verifique as palavras.', 'error');
        return;
      }
      wallet = ethers.Wallet.fromPhrase(mnemonicPhrase);
    } else {
      let cleanedPrivateKey = privateKey.replace(/\s/g, '');
      if (!cleanedPrivateKey.startsWith('0x')) {
        cleanedPrivateKey = '0x' + cleanedPrivateKey;
      }
      wallet = new ethers.Wallet(cleanedPrivateKey);
    }
    
    otherChainsWallets[currentChainForCreation] = {
      wallet: wallet,
      mnemonic: mnemonicPhrase || ''
    };
    
    saveToStorage(`exclusiveWallet_${currentChainForCreation}`, wallet.privateKey);
    if (mnemonicPhrase) {
      saveToStorage(`exclusiveWalletMnemonic_${currentChainForCreation}`, mnemonicPhrase);
    }
    
    // Gerar saldo aleatório para demonstração
    const randomBalance = (Math.random() * 10).toFixed(4);
    realChainBalances[currentChainForCreation] = randomBalance;
    
    closeMnemonicModalOther();
    showNotification(`✅ Wallet ${currentChainForCreation.charAt(0).toUpperCase() + currentChainForCreation.slice(1)} restaurada! Endereço: ${formatAddress(wallet.address)}`, 'success');
    
    // Atualizar saldo exibido
    updateCurrentChainBalance();
    
  } catch (error) {
    console.error('Erro ao restaurar wallet:', error);
    showNotification('Erro ao restaurar wallet: ' + error.message, 'error');
  }
}

// Funções para outras chains
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
  
  copyToClipboard(wallet.wallet.address)
    .then(success => {
      if (success) {
        showNotification(`Endereço ${chainName} copiado!`, 'success');
      } else {
        showNotification('Erro ao copiar endereço', 'error');
      }
    });
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

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  window.blockchain = {
    currentSelectedChain,
    otherChainsWallets,
    realChainBalances,
    initializeBlockchainButtons,
    selectBlockchain,
    updateCurrentChainBalance,
    refreshRealChainBalance,
    showCorrectWalletForChain,
    createChainWalletInterface,
    createWalletForChain,
    showMnemonicCreationModalOther,
    closeMnemonicCreationModalOther,
    confirmMnemonicSavedOther,
    restoreWalletForChain,
    closeMnemonicModalOther,
    confirmRestoreOther,
    showReceiveModalOther,
    showSendModalOther,
    refreshBalanceOther,
    copyQRAddressOther,
    cancelSendOther,
    estimateGasOther,
    sendTransactionOther,
    loadMoreTransactionsOther
  };
  
  // Exportar funções individualmente para compatibilidade
  window.initializeBlockchainButtons = initializeBlockchainButtons;
  window.selectBlockchain = selectBlockchain;
  window.updateCurrentChainBalance = updateCurrentChainBalance;
  window.refreshRealChainBalance = refreshRealChainBalance;
  window.showCorrectWalletForChain = showCorrectWalletForChain;
  window.createWalletForChain = createWalletForChain;
  window.showMnemonicCreationModalOther = showMnemonicCreationModalOther;
  window.closeMnemonicCreationModalOther = closeMnemonicCreationModalOther;
  window.confirmMnemonicSavedOther = confirmMnemonicSavedOther;
  window.restoreWalletForChain = restoreWalletForChain;
  window.closeMnemonicModalOther = closeMnemonicModalOther;
  window.confirmRestoreOther = confirmRestoreOther;
  window.showReceiveModalOther = showReceiveModalOther;
  window.showSendModalOther = showSendModalOther;
  window.refreshBalanceOther = refreshBalanceOther;
  window.copyQRAddressOther = copyQRAddressOther;
  window.cancelSendOther = cancelSendOther;
  window.estimateGasOther = estimateGasOther;
  window.sendTransactionOther = sendTransactionOther;
  window.loadMoreTransactionsOther = loadMoreTransactionsOther;
}
