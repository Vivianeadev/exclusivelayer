// ======================================================
// WALLET CORE - GERENCIAMENTO DA WALLET POLYGON PRINCIPAL
// ======================================================

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

// ======================================================
// CONEXÃO E CRIAÇÃO DE WALLET
// ======================================================

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
  
  try {
    currentWallet = new ethers.Wallet(privateKey);
    localStorage.setItem('exclusiveWalletPK', privateKey);
    
    initializeRpcProvider();
    
    showNotification(`✅ Identidade Polygon conectada! Endereço: ${currentWallet.address.substring(0, 10)}...`, 'success');
    showWalletDashboard();
    
  } catch (error) {
    console.error('Erro ao conectar identidade Polygon:', error);
    showNotification('Erro ao conectar identidade Polygon. Verifique sua chave privada.', 'error');
  }
}

// Criar nova wallet
async function createNewWallet() {
  try {
    showNotification('Criando identidade Polygon premium...', 'info');
    
    const wallet = ethers.Wallet.createRandom();
    currentWallet = wallet;
    mnemonicPhrase = wallet.mnemonic.phrase;
    
    localStorage.setItem('exclusiveWalletPK', currentWallet.privateKey);
    
    const password = document.getElementById('newWalletPassword')?.value.trim();
    if (password) {
      localStorage.setItem('exw_psw', password);
      showNotification('Senha local salva (apenas neste dispositivo).', 'info');
    }
    
    showMnemonicCreationModal(mnemonicPhrase);
    
  } catch (error) {
    console.error('Erro ao criar identidade Polygon:', error);
    showNotification('Erro ao criar identidade Polygon premium: ' + error.message, 'error');
  }
}

// ======================================================
// MODAL DE MNEMÔNICA
// ======================================================

// Mostrar modal de criação de mnemônica
function showMnemonicCreationModal(mnemonic) {
  const modal = document.getElementById('mnemonicCreationModal');
  const wordsContainer = document.getElementById('mnemonicWordsContainer');
  const timerElement = document.getElementById('mnemonicTimer');
  
  if (!modal || !wordsContainer || !timerElement) return;
  
  const words = mnemonic.split(' ');
  wordsContainer.innerHTML = '';
  
  words.forEach((word, index) => {
    const wordElement = document.createElement('div');
    wordElement.className = 'mnemonic-word';
    wordElement.setAttribute('data-index', index + 1);
    wordElement.textContent = word;
    wordsContainer.appendChild(wordElement);
  });
  
  mnemonicTimerSeconds = 300;
  updateMnemonicTimer();
  mnemonicCreationTimer = setInterval(updateMnemonicTimer, 1000);
  
  modal.classList.add('active');
}

// Atualizar timer do mnemônico
function updateMnemonicTimer() {
  const timerElement = document.getElementById('mnemonicTimer');
  if (!timerElement) return;
  
  mnemonicTimerSeconds--;
  
  if (mnemonicTimerSeconds <= 0) {
    clearInterval(mnemonicCreationTimer);
    timerElement.textContent = '00:00';
    showNotification('Tempo esgotado! A criação da identidade foi cancelada.', 'error');
    closeMnemonicCreationModal();
    return;
  }
  
  const minutes = Math.floor(mnemonicTimerSeconds / 60);
  const seconds = mnemonicTimerSeconds % 60;
  timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Fechar modal de criação
function closeMnemonicCreationModal() {
  const modal = document.getElementById('mnemonicCreationModal');
  if (modal) modal.classList.remove('active');
  
  clearInterval(mnemonicCreationTimer);
  
  currentWallet = null;
  mnemonicPhrase = null;
  localStorage.removeItem('exclusiveWalletPK');
  localStorage.removeItem('exw_psw');
}

// Confirmar mnemônico salvo
function confirmMnemonicSaved() {
  clearInterval(mnemonicCreationTimer);
  
  initializeRpcProvider();
  
  showNotification(`✅ Identidade Polygon criada! Endereço: ${currentWallet.address.substring(0, 10)}...`, 'success');
  showNotification('⚠️ SALVE SUA CHAVE PRIVADA E FRASE MNEMÔNICA!', 'warning');
  closeMnemonicCreationModal();
  showWalletDashboard();
}

// ======================================================
// RESTAURAÇÃO DE WALLET
// ======================================================

// Abrir modal de restauração
function openMnemonicModal() {
  const modal = document.getElementById('mnemonicModal');
  if (modal) modal.classList.add('active');
}

// Fechar modal de restauração
function closeMnemonicModal() {
  const modal = document.getElementById('mnemonicModal');
  if (modal) {
    modal.classList.remove('active');
    const mnemonicInput = document.getElementById('mnemonicPhrase');
    if (mnemonicInput) mnemonicInput.value = '';
  }
}

// Restaurar wallet do mnemônico
function restoreWalletFromMnemonic() {
  const mnemonicPhraseInput = document.getElementById('mnemonicPhrase')?.value.trim();

  if (!mnemonicPhraseInput) {
    showNotification('Por favor, insira a frase mnemônica.', 'error');
    return;
  }

  try {
    if (!ethers.Mnemonic.isValidMnemonic(mnemonicPhraseInput)) {
      showNotification('Frase mnemônica inválida. Verifique as palavras.', 'error');
      return;
    }

    const wallet = ethers.Wallet.fromPhrase(mnemonicPhraseInput);
    currentWallet = wallet;
    mnemonicPhrase = mnemonicPhraseInput;

    localStorage.setItem('exclusiveWalletPK', currentWallet.privateKey);
    
    initializeRpcProvider();

    closeMnemonicModal();
    showNotification(`✅ Identidade Polygon restaurada! Endereço: ${currentWallet.address.substring(0, 10)}...`, 'success');
    showWalletDashboard();

  } catch (error) {
    console.error('Erro ao restaurar identidade Polygon:', error);
    showNotification('Erro ao restaurar identidade Polygon: ' + error.message, 'error');
  }
}

// ======================================================
// SEGURANÇA E DADOS SENSÍVEIS
// ======================================================

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

// Alternar visibilidade do mnemônico
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
function copyPrivateKey() {
  if (!currentWallet) return;
  
  navigator.clipboard.writeText(currentWallet.privateKey)
    .then(() => showNotification('Chave privada Polygon copiada!', 'success'))
    .catch(() => showNotification('Erro ao copiar chave privada', 'error'));
}

// Copiar mnemônico
function copyMnemonic() {
  if (!mnemonicPhrase) {
    showNotification('Nenhuma frase mnemônica disponível', 'error');
    return;
  }
  
  navigator.clipboard.writeText(mnemonicPhrase)
    .then(() => showNotification('Frase mnemônica copiada!', 'success'))
    .catch(() => showNotification('Erro ao copiar frase mnemônica', 'error'));
}

// Mostrar chave privada (com alerta)
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
    rpc: currentRpcProvider,
    exportDate: new Date().toISOString()
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
    isAddressRegistered = false;
    networkStatus.connected = false;
    
    localStorage.removeItem('exclusiveWalletPK');
    localStorage.removeItem('exclusiveWalletAddressRegistered');
    
    const walletDashboard = document.getElementById('wallet-dashboard');
    if (walletDashboard) walletDashboard.classList.add('fade-out');
    
    setTimeout(() => {
      const loginScreen = document.getElementById('login-screen');
      if (walletDashboard) walletDashboard.classList.add('hidden');
      if (loginScreen) {
        loginScreen.classList.remove('hidden');
        loginScreen.classList.remove('fade-out');
        loginScreen.classList.add('fade-in');
      }
      
      const privateKeyInput = document.getElementById('privateKey');
      const passwordInput = document.getElementById('newWalletPassword');
      if (privateKeyInput) privateKeyInput.value = '';
      if (passwordInput) passwordInput.value = '';
      
      showNotification('Sessão Polygon premium encerrada.', 'info');
    }, 800);
  }
}

// ======================================================
// OVERVIEW E REGISTRO DE IDENTIDADE
// ======================================================

// Atualizar overview
function updateOverview() {
  if (!currentWallet) return;
  
  const address = currentWallet.address;
  const formattedAddress = `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  
  const walletAddressDisplay = document.getElementById('walletAddressDisplay');
  const walletStatus = document.getElementById('walletStatus');
  const featureCount = document.getElementById('featureCount');
  const securityLevel = document.getElementById('securityLevel');
  
  if (walletAddressDisplay) walletAddressDisplay.textContent = formattedAddress;
  if (walletStatus) walletStatus.textContent = 'Ativo';
  if (featureCount) featureCount.textContent = '6';
  if (securityLevel) securityLevel.textContent = 'Máxima';
  
  updateAddressRegistration();
}

// Atualizar registro de endereço
function updateAddressRegistration() {
  if (!currentWallet) return;
  
  const addressDisplay = document.getElementById('publicAddressDisplay');
  const checkbox = document.getElementById('confirmAddressCheckbox');
  const registerBtn = document.getElementById('registerAddressBtn');
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');
  
  if (addressDisplay) addressDisplay.textContent = currentWallet.address;
  
  if (!checkbox || !registerBtn || !statusText || !statusIndicator) return;
  
  if (isAddressRegistered) {
    checkbox.checked = true;
    checkbox.disabled = true;
    registerBtn.disabled = false;
    registerBtn.innerHTML = '<i class="fas fa-check"></i> Identidade Registrada';
    registerBtn.classList.remove('btn-secondary');
    registerBtn.classList.add('btn-success');
    statusText.textContent = 'Identidade Polygon verificada e registrada';
    statusText.style.color = 'var(--success-color)';
    statusIndicator.className = 'status-indicator verified';
  } else {
    checkbox.checked = false;
    checkbox.disabled = false;
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<i class="fas fa-check"></i> Registrar Identidade';
    registerBtn.classList.remove('btn-success');
    registerBtn.classList.add('btn-secondary');
    statusText.textContent = 'Identidade não registrada';
    statusText.style.color = 'var(--text-secondary)';
    statusIndicator.className = 'status-indicator';
    statusIndicator.style.background = 'var(--text-secondary)';
  }
  
  checkbox.onchange = function() {
    registerBtn.disabled = !this.checked;
  };
  
  registerBtn.onclick = function() {
    if (!checkbox.checked) return;
    
    isAddressRegistered = true;
    localStorage.setItem('exclusiveWalletAddressRegistered', 'true');
    
    updateAddressRegistration();
    showNotification('✅ Identidade Polygon registrada com sucesso!', 'success');
  };
}

// ======================================================
// RPC PROVIDER
// ======================================================

// Inicializar RPC Provider
function initializeRpcProvider() {
  try {
    const savedRpc = localStorage.getItem('exclusiveWalletRpc') || currentRpcProvider;
    currentRpcProvider = savedRpc;
    
    polygonProvider = new ethers.JsonRpcProvider(currentRpcProvider, {
      chainId: polygonConfig.chainId,
      name: polygonConfig.name
    });
    
    const rpcUrlElement = document.getElementById('currentRpcUrl');
    const rpcSelect = document.getElementById('rpcProviderSelect');
    
    if (rpcUrlElement) rpcUrlElement.textContent = currentRpcProvider;
    if (rpcSelect) rpcSelect.value = currentRpcProvider;
    
    updateRpcStatus();
    showNotification('Provider RPC Polygon inicializado', 'success');
    
    return true;
  } catch (error) {
    console.error('Erro ao inicializar RPC Provider:', error);
    showNotification('Erro ao conectar ao RPC Polygon', 'error');
    return false;
  }
}

// Testar conexão RPC
async function testRpcConnection() {
  if (!polygonProvider) {
    showNotification('Provider RPC não inicializado', 'error');
    return;
  }
  
  showNotification('Testando conexão com RPC Polygon...', 'info');
  
  try {
    const startTime = Date.now();
    const blockNumber = await polygonProvider.getBlockNumber();
    const endTime = Date.now();
    
    networkStatus.latency = endTime - startTime;
    networkStatus.lastBlock = blockNumber;
    networkStatus.connected = true;
    
    const feeData = await polygonProvider.getFeeData();
    networkStatus.gasPrice = Math.round(Number(ethers.formatUnits(feeData.gasPrice || '30000000000', 'gwei')));
    
    updateRpcStatus();
    
    showNotification(`✅ Conexão RPC estabelecida! Latência: ${networkStatus.latency}ms`, 'success');
    
  } catch (error) {
    console.error('Erro ao testar conexão RPC:', error);
    networkStatus.connected = false;
    updateRpcStatus();
    showNotification('❌ Falha na conexão RPC', 'error');
  }
}

// Atualizar status do RPC
function updateRpcStatus() {
  const statusElement = document.getElementById('rpcStatus');
  const latencyElement = document.getElementById('rpcLatency');
  const lastBlockElement = document.getElementById('lastBlock');
  const gasPriceElement = document.getElementById('gasPriceDisplay');
  const connectionStatus = document.getElementById('connectionStatus');
  
  if (statusElement) {
    if (networkStatus.connected) {
      statusElement.innerHTML = '<i class="fas fa-check-circle"></i> Conectado';
      statusElement.style.color = 'var(--success-color)';
    } else {
      statusElement.innerHTML = '<i class="fas fa-times-circle"></i> Desconectado';
      statusElement.style.color = 'var(--error-color)';
    }
  }
  
  if (connectionStatus) {
    connectionStatus.textContent = networkStatus.connected ? 
      `LATÊNCIA: ${networkStatus.latency}ms` : 'LATÊNCIA: --';
  }
  
  if (latencyElement) latencyElement.textContent = `${networkStatus.latency}ms`;
  if (lastBlockElement) lastBlockElement.textContent = networkStatus.lastBlock.toLocaleString();
  if (gasPriceElement) gasPriceElement.textContent = `${networkStatus.gasPrice} GWEI`;
}

// ======================================================
// EXPORTAÇÃO DAS FUNÇÕES PARA USO GLOBAL
// ======================================================

// Funções de conexão e criação
window.connectPrivateKey = connectPrivateKey;
window.createNewWallet = createNewWallet;

// Funções de mnemônica
window.openMnemonicModal = openMnemonicModal;
window.closeMnemonicModal = closeMnemonicModal;
window.restoreWalletFromMnemonic = restoreWalletFromMnemonic;
window.closeMnemonicCreationModal = closeMnemonicCreationModal;
window.confirmMnemonicSaved = confirmMnemonicSaved;

// Funções de segurança
window.togglePrivateKeyVisibility = togglePrivateKeyVisibility;
window.toggleMnemonicVisibility = toggleMnemonicVisibility;
window.copyPrivateKey = copyPrivateKey;
window.copyMnemonic = copyMnemonic;
window.showPrivateKey = showPrivateKey;
window.exportWallet = exportWallet;
window.disconnectWallet = disconnectWallet;
window.updateSensitiveDataDisplay = updateSensitiveDataDisplay;

// Funções de overview
window.updateOverview = updateOverview;

// Funções de RPC
window.initializeRpcProvider = initializeRpcProvider;
window.testRpcConnection = testRpcConnection;
window.updateRpcStatus = updateRpcStatus;

// Objetos globais para outros módulos
window.currentWallet = currentWallet;
window.polygonProvider = polygonProvider;
window.networkStatus = networkStatus;
window.polygonConfig = polygonConfig;
window.currentRpcProvider = currentRpcProvider;
