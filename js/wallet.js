// ======================================================
// FUNÇÕES PRINCIPAIS DA WALLET
// ======================================================

// Variáveis globais da wallet
let currentWallet = null;
let mnemonicPhrase = null;
let privateKeyVisible = false;
let mnemonicVisible = false;

// Conectar com chave privada
async function connectPrivateKey() {
  const pk = document.getElementById('privateKey')?.value.trim();
  if (!pk) {
    showNotification('Insira sua chave privada Polygon', 'error');
    return;
  }
  
  let privateKey = pk.replace(/\s/g, '');
  if (!privateKey.startsWith('0x')) {
    privateKey = '0x' + privateKey;
  }
  
  if (!isValidPrivateKey(privateKey)) {
    showNotification('Chave privada inválida', 'error');
    return;
  }
  
  try {
    const ethers = window.ethers;
    if (!ethers) {
      throw new Error('Ethers.js não carregado');
    }
    
    currentWallet = new ethers.Wallet(privateKey);
    saveToStorage('exclusiveWalletPK', privateKey);
    
    // Verificar autorização Identity Dynamic salva
    const savedAuth = loadFromStorage('identityDynamicAuth', false);
    if (savedAuth) {
      window.identityDynamicAuthorized = true;
      window.identityDynamicSessionId = loadFromStorage('identityDynamicSession');
      window.identityDynamicSignature = loadFromStorage('identityDynamicSignature');
    }
    
    // Inicializar provider RPC
    if (typeof window.initializeRpcProvider === 'function') {
      window.initializeRpcProvider();
    }
    
    showNotification(`✅ Identidade Polygon conectada! Endereço: ${formatAddress(currentWallet.address)}`, 'success');
    
    if (typeof window.showWalletDashboard === 'function') {
      window.showWalletDashboard();
    }
    
  } catch (error) {
    console.error('Erro ao conectar identidade Polygon:', error);
    showNotification('Erro ao conectar identidade Polygon. Verifique sua chave privada.', 'error');
  }
}

// Criar nova wallet
async function createNewWallet() {
  try {
    const ethers = window.ethers;
    if (!ethers) {
      throw new Error('Ethers.js não carregado');
    }
    
    showNotification('Criando identidade Polygon premium...', 'info');
    
    const wallet = ethers.Wallet.createRandom();
    currentWallet = wallet;
    mnemonicPhrase = wallet.mnemonic?.phrase;
    
    if (!mnemonicPhrase) {
      throw new Error('Frase mnemônica não gerada');
    }
    
    saveToStorage('exclusiveWalletPK', currentWallet.privateKey);
    
    const password = document.getElementById('newWalletPassword')?.value.trim();
    if (password) {
      saveToStorage('exw_psw', password);
      showNotification('Senha local salva (apenas neste dispositivo).', 'info');
    }
    
    if (typeof window.showMnemonicCreationModal === 'function') {
      window.showMnemonicCreationModal(mnemonicPhrase);
    }
    
  } catch (error) {
    console.error('Erro ao criar identidade Polygon:', error);
    showNotification('Erro ao criar identidade Polygon premium: ' + error.message, 'error');
  }
}

// Mostrar modal de criação de mnemônica
function showMnemonicCreationModal(mnemonic) {
  const modal = document.getElementById('mnemonicCreationModal');
  const wordsContainer = document.getElementById('mnemonicWordsContainer');
  const timerElement = document.getElementById('mnemonicTimer');
  
  if (!modal || !wordsContainer || !timerElement) {
    showNotification('Elementos do modal não encontrados', 'error');
    return;
  }
  
  const words = mnemonic.split(' ');
  wordsContainer.innerHTML = '';
  
  words.forEach((word, index) => {
    const wordElement = document.createElement('div');
    wordElement.className = 'mnemonic-word';
    wordElement.setAttribute('data-index', index + 1);
    wordElement.textContent = word;
    wordsContainer.appendChild(wordElement);
  });
  
  let mnemonicTimerSeconds = CONSTANTS ? CONSTANTS.MNEMONIC_TIMER_SECONDS : 300;
  window.mnemonicCreationTimer = setInterval(() => {
    mnemonicTimerSeconds--;
    
    if (mnemonicTimerSeconds <= 0) {
      clearInterval(window.mnemonicCreationTimer);
      timerElement.textContent = '00:00';
      showNotification('Tempo esgotado! A criação da identidade foi cancelada.', 'error');
      closeMnemonicCreationModal();
      return;
    }
    
    const minutes = Math.floor(mnemonicTimerSeconds / 60);
    const seconds = mnemonicTimerSeconds % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
  
  modal.classList.add('active');
}

// Fechar modal de criação de mnemônica
function closeMnemonicCreationModal() {
  const modal = document.getElementById('mnemonicCreationModal');
  if (modal) {
    modal.classList.remove('active');
  }
  
  if (window.mnemonicCreationTimer) {
    clearInterval(window.mnemonicCreationTimer);
  }
  
  currentWallet = null;
  mnemonicPhrase = null;
  removeFromStorage('exclusiveWalletPK');
  removeFromStorage('exw_psw');
}

// Confirmar mnemônica salva
function confirmMnemonicSaved() {
  if (window.mnemonicCreationTimer) {
    clearInterval(window.mnemonicCreationTimer);
  }
  
  if (typeof window.initializeRpcProvider === 'function') {
    window.initializeRpcProvider();
  }
  
  showNotification(`✅ Identidade Polygon criada! Endereço: ${formatAddress(currentWallet.address)}`, 'success');
  showNotification('⚠️ SALVE SUA CHAVE PRIVADA E FRASE MNEMÔNICA!', 'warning');
  closeMnemonicCreationModal();
  
  if (typeof window.showWalletDashboard === 'function') {
    window.showWalletDashboard();
  }
}

// Atualizar display de dados sensíveis
function updateSensitiveDataDisplay() {
  if (!currentWallet) return;
  
  const privateKeyDisplay = document.getElementById('privateKeyDisplay');
  const mnemonicDisplay = document.getElementById('mnemonicDisplay');
  const togglePrivateKeyBtn = document.getElementById('togglePrivateKey');
  const toggleMnemonicBtn = document.getElementById('toggleMnemonic');
  
  if (privateKeyDisplay) {
    privateKeyDisplay.textContent = privateKeyVisible ? 
      currentWallet.privateKey : '••••••••••••••••••••••••••••••••••••••••••••••';
  }
  
  if (mnemonicDisplay) {
    mnemonicDisplay.textContent = mnemonicVisible && mnemonicPhrase ? 
      mnemonicPhrase : '••••••••••••••••••••••••••••••••••••••••••••••';
  }
  
  if (togglePrivateKeyBtn) {
    togglePrivateKeyBtn.innerHTML = `<i class="fas fa-${privateKeyVisible ? 'eye-slash' : 'eye'}"></i> ${privateKeyVisible ? 'Ocultar' : 'Mostrar'} Chave`;
  }
  
  if (toggleMnemonicBtn) {
    toggleMnemonicBtn.innerHTML = `<i class="fas fa-${mnemonicVisible ? 'eye-slash' : 'eye'}"></i> ${mnemonicVisible ? 'Ocultar' : 'Mostrar'} Frase`;
  }
}

// Alternar visibilidade da chave privada
function togglePrivateKeyVisibility() {
  if (!currentWallet) return;
  
  privateKeyVisible = !privateKeyVisible;
  updateSensitiveDataDisplay();
  showNotification(privateKeyVisible ? 'Chave privada Polygon visível' : 'Chave privada Polygon ocultada', 'info');
}

// Alternar visibilidade da mnemônica
function toggleMnemonicVisibility() {
  if (!mnemonicPhrase) {
    showNotification('Nenhuma frase mnemônica disponível para esta identidade', 'error');
    return;
  }
  
  mnemonicVisible = !mnemonicVisible;
  updateSensitiveDataDisplay();
  showNotification(mnemonicVisible ? 'Frase mnemônica visível' : 'Frase mnemônica ocultada', 'info');
}

// Copiar chave privada
async function copyPrivateKey() {
  if (!currentWallet) return;
  
  const success = await copyToClipboard(currentWallet.privateKey);
  if (success) {
    showNotification('Chave privada Polygon copiada!', 'success');
  } else {
    showNotification('Erro ao copiar chave privada', 'error');
  }
}

// Copiar mnemônica
async function copyMnemonic() {
  if (!mnemonicPhrase) {
    showNotification('Nenhuma frase mnemônica disponível', 'error');
    return;
  }
  
  const success = await copyToClipboard(mnemonicPhrase);
  if (success) {
    showNotification('Frase mnemônica copiada!', 'success');
  } else {
    showNotification('Erro ao copiar frase mnemônica', 'error');
  }
}

// Mostrar chave privada em alerta
function showPrivateKey() {
  if (!currentWallet) return;
  
  if (confirm('⚠️ ATENÇÃO: A chave privada dá acesso total aos seus fundos na Polygon. Tem certeza que deseja visualizar?')) {
    alert(`SUA CHAVE PRIVADA POLYGON:\n\n${currentWallet.privateKey}\n\n⚠️ NUNCA COMPARTILHE ESTA INFORMAÇÃO!`);
  }
}

// Exportar wallet
function exportWallet() {
  if (!currentWallet) return;
  
  const walletData = {
    address: currentWallet.address,
    privateKey: currentWallet.privateKey,
    mnemonic: mnemonicPhrase,
    chain: 'Polygon',
    rpc: window.currentRpcProvider || CONSTANTS.DEFAULT_RPC,
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };
  
  const dataStr = JSON.stringify(walletData, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `polygon-identity-${currentWallet.address.slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showNotification('Identidade Polygon exportada com sucesso!', 'success');
}

// Desconectar wallet
function disconnectWallet() {
  if (confirm('Encerrar sessão premium da Polygon?')) {
    currentWallet = null;
    mnemonicPhrase = null;
    window.isAddressRegistered = false;
    window.networkStatus = { connected: false };
    window.identityDynamicAuthorized = false;
    window.identityDynamicSessionId = null;
    window.identityDynamicSignature = null;
    
    removeFromStorage('exclusiveWalletPK');
    removeFromStorage('exclusiveWalletAddressRegistered');
    removeFromStorage('identityDynamicAuth');
    removeFromStorage('identityDynamicSession');
    removeFromStorage('identityDynamicSignature');
    
    const walletDashboard = document.getElementById('wallet-dashboard');
    const loginScreen = document.getElementById('login-screen');
    
    if (walletDashboard && loginScreen) {
      walletDashboard.classList.add('fade-out');
      
      setTimeout(() => {
        walletDashboard.classList.add('hidden');
        walletDashboard.classList.remove('fade-out');
        
        loginScreen.classList.remove('hidden');
        loginScreen.classList.remove('fade-out');
        loginScreen.classList.add('fade-in');
        
        // Limpar campos de login
        const privateKeyInput = document.getElementById('privateKey');
        const passwordInput = document.getElementById('newWalletPassword');
        if (privateKeyInput) privateKeyInput.value = '';
        if (passwordInput) passwordInput.value = '';
        
        showNotification('Sessão Polygon premium encerrada.', 'info');
      }, 800);
    }
  }
}

// Mostrar dashboard da wallet
function showWalletDashboard() {
  const loginScreen = document.getElementById('login-screen');
  const walletDashboard = document.getElementById('wallet-dashboard');
  
  if (!loginScreen || !walletDashboard) return;
  
  loginScreen.classList.add('fade-out');
  
  setTimeout(() => {
    loginScreen.classList.add('hidden');
    walletDashboard.classList.remove('hidden');
    walletDashboard.classList.add('fade-in');
    
    updateSensitiveDataDisplay();
    
    if (typeof window.updateOverview === 'function') {
      window.updateOverview();
    }
    
    if (typeof window.refreshBalance === 'function') {
      window.refreshBalance();
    }
    
    if (typeof window.testRpcConnection === 'function') {
      window.testRpcConnection();
    }
    
    if (typeof window.initializeBlockchainButtons === 'function') {
      window.initializeBlockchainButtons();
    }
    
  }, 800);
}

// Abrir modal de mnemônica
function openMnemonicModal() {
  const modal = document.getElementById('mnemonicModal');
  if (modal) {
    modal.classList.add('active');
  }
}

// Fechar modal de mnemônica
function closeMnemonicModal() {
  const modal = document.getElementById('mnemonicModal');
  if (modal) {
    modal.classList.remove('active');
  }
  
  const mnemonicPhraseInput = document.getElementById('mnemonicPhrase');
  if (mnemonicPhraseInput) {
    mnemonicPhraseInput.value = '';
  }
}

// Restaurar wallet a partir de mnemônica
function restoreWalletFromMnemonic() {
  const mnemonicPhraseInput = document.getElementById('mnemonicPhrase')?.value.trim();

  if (!mnemonicPhraseInput) {
    showNotification('Por favor, insira a frase mnemônica.', 'error');
    return;
  }

  try {
    const ethers = window.ethers;
    if (!ethers) {
      throw new Error('Ethers.js não carregado');
    }
    
    if (!ethers.Mnemonic.isValidMnemonic(mnemonicPhraseInput)) {
      showNotification('Frase mnemônica inválida. Verifique as palavras.', 'error');
      return;
    }

    const wallet = ethers.Wallet.fromPhrase(mnemonicPhraseInput);
    currentWallet = wallet;
    mnemonicPhrase = mnemonicPhraseInput;

    saveToStorage('exclusiveWalletPK', currentWallet.privateKey);
    
    if (typeof window.initializeRpcProvider === 'function') {
      window.initializeRpcProvider();
    }

    closeMnemonicModal();
    showNotification(`✅ Identidade Polygon restaurada! Endereço: ${formatAddress(currentWallet.address)}`, 'success');
    showWalletDashboard();

  } catch (error) {
    console.error('Erro ao restaurar identidade Polygon:', error);
    showNotification('Erro ao restaurar identidade Polygon: ' + error.message, 'error');
  }
}

// Atualizar visão geral
function updateOverview() {
  if (!currentWallet) return;
  
  const address = currentWallet.address;
  const formattedAddress = formatAddress(address, 6, 6);
  
  const walletAddressDisplay = document.getElementById('walletAddressDisplay');
  const walletStatus = document.getElementById('walletStatus');
  const featureCount = document.getElementById('featureCount');
  const securityLevel = document.getElementById('securityLevel');
  
  if (walletAddressDisplay) walletAddressDisplay.textContent = formattedAddress;
  if (walletStatus) walletStatus.textContent = 'Ativo';
  if (featureCount) featureCount.textContent = '6';
  if (securityLevel) securityLevel.textContent = 'Máxima';
  
  if (typeof window.updateAddressRegistration === 'function') {
    window.updateAddressRegistration();
  }
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  window.wallet = {
    currentWallet,
    mnemonicPhrase,
    privateKeyVisible,
    mnemonicVisible,
    connectPrivateKey,
    createNewWallet,
    showMnemonicCreationModal,
    closeMnemonicCreationModal,
    confirmMnemonicSaved,
    updateSensitiveDataDisplay,
    togglePrivateKeyVisibility,
    toggleMnemonicVisibility,
    copyPrivateKey,
    copyMnemonic,
    showPrivateKey,
    exportWallet,
    disconnectWallet,
    showWalletDashboard,
    openMnemonicModal,
    closeMnemonicModal,
    restoreWalletFromMnemonic,
    updateOverview
  };
  
  // Também exportar individualmente para compatibilidade
  window.connectPrivateKey = connectPrivateKey;
  window.createNewWallet = createNewWallet;
  window.togglePrivateKeyVisibility = togglePrivateKeyVisibility;
  window.toggleMnemonicVisibility = toggleMnemonicVisibility;
  window.copyPrivateKey = copyPrivateKey;
  window.copyMnemonic = copyMnemonic;
  window.showPrivateKey = showPrivateKey;
  window.exportWallet = exportWallet;
  window.disconnectWallet = disconnectWallet;
  window.showWalletDashboard = showWalletDashboard;
  window.openMnemonicModal = openMnemonicModal;
  window.restoreWalletFromMnemonic = restoreWalletFromMnemonic;
}
