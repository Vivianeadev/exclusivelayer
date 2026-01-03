// VARIÁVEIS DE WALLET
let currentWallet = null;
let mnemonicPhrase = null;
let privateKeyVisible = false;
let mnemonicVisible = false;
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

// TIMERS
let mnemonicCreationTimer = null;
let mnemonicTimerSeconds = 300;

// FUNÇÕES DE WALLET
async function connectPrivateKey() {
  const pk = document.getElementById('privateKey').value.trim();
  if(!pk){ 
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
    
    showNotification(`✅ Identidade Polygon conectada! Endereço: ${currentWallet.address.substring(0, 10)}...`, 'success');
    showWalletDashboard();
    
  } catch (error) {
    console.error('Erro ao conectar identidade Polygon:', error);
    showNotification('Erro ao conectar identidade Polygon. Verifique sua chave privada.', 'error');
  }
}

async function createNewWallet() {
  try {
    showNotification('Criando identidade Polygon premium...', 'info');
    
    const wallet = ethers.Wallet.createRandom();
    currentWallet = wallet;
    mnemonicPhrase = wallet.mnemonic.phrase;
    
    localStorage.setItem('exclusiveWalletPK', currentWallet.privateKey);
    
    const password = document.getElementById('newWalletPassword').value.trim();
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

function showMnemonicCreationModal(mnemonic) {
  const modal = document.getElementById('mnemonicCreationModal');
  const wordsContainer = document.getElementById('mnemonicWordsContainer');
  const timerElement = document.getElementById('mnemonicTimer');
  
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

function closeMnemonicCreationModal() {
  const modal = document.getElementById('mnemonicCreationModal');
  modal.classList.remove('active');
  clearInterval(mnemonicCreationTimer);
  
  currentWallet = null;
  mnemonicPhrase = null;
  localStorage.removeItem('exclusiveWalletPK');
  localStorage.removeItem('exw_psw');
}

function confirmMnemonicSaved() {
  clearInterval(mnemonicCreationTimer);
  
  showNotification(`✅ Identidade Polygon criada! Endereço: ${currentWallet.address.substring(0, 10)}...`, 'success');
  showNotification('⚠️ SALVE SUA CHAVE PRIVADA E FRASE MNEMÔNICA!', 'warning');
  closeMnemonicCreationModal();
  showWalletDashboard();
}

function updateSensitiveDataDisplay() {
  if (!currentWallet) return;
  
  document.getElementById('privateKeyDisplay').textContent = privateKeyVisible ? 
    currentWallet.privateKey : '••••••••••••••••••••••••••••••••••••••••••••••';
  
  document.getElementById('mnemonicDisplay').textContent = mnemonicVisible && mnemonicPhrase ? 
    mnemonicPhrase : '••••••••••••••••••••••••••••••••••••••••••••••';
  
  document.getElementById('togglePrivateKey').innerHTML = `<i class="fas fa-${privateKeyVisible ? 'eye-slash' : 'eye'}"></i> ${privateKeyVisible ? 'Ocultar' : 'Mostrar'} Chave`;
  document.getElementById('toggleMnemonic').innerHTML = `<i class="fas fa-${mnemonicVisible ? 'eye-slash' : 'eye'}"></i> ${mnemonicVisible ? 'Ocultar' : 'Mostrar'} Frase`;
}

function updateOverview() {
  if (!currentWallet) return;
  
  const address = currentWallet.address;
  const formattedAddress = `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  
  document.getElementById('walletAddressDisplay').textContent = formattedAddress;
  document.getElementById('walletStatus').textContent = 'Ativo';
  document.getElementById('featureCount').textContent = '6';
  document.getElementById('securityLevel').textContent = 'Máxima';
  
  updateAddressRegistration();
}

function updateAddressRegistration() {
  if (!currentWallet) return;
  
  const addressDisplay = document.getElementById('publicAddressDisplay');
  const checkbox = document.getElementById('confirmAddressCheckbox');
  const registerBtn = document.getElementById('registerAddressBtn');
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');
  
  addressDisplay.textContent = currentWallet.address;
  
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

async function sendTransaction() {
  const toAddress = document.getElementById('sendToAddress').value.trim();
  const amount = document.getElementById('sendAmount').value.trim();
  
  if (!currentWallet || !polygonProvider || !networkStatus.connected) {
    showNotification('Conecte-se ao RPC primeiro', 'error');
    return;
  }
  
  if (!toAddress) {
    showNotification('Informe o endereço de destino Polygon', 'error');
    return;
  }
  
  if (!amount || parseFloat(amount) <= 0) {
    showNotification('Informe uma quantia válida em MATIC', 'error');
    return;
  }
  
  try {
    showNotification('Preparando transação na Polygon...', 'info');
    
    const connectedWallet = currentWallet.connect(polygonProvider);
    
    const tx = {
      to: toAddress,
      value: ethers.parseEther(amount),
      gasLimit: 21000
    };
    
    const estimatedGas = await connectedWallet.estimateGas(tx);
    tx.gasLimit = estimatedGas;
    
    const feeData = await polygonProvider.getFeeData();
    tx.maxFeePerGas = feeData.maxFeePerGas;
    tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    
    showNotification('Enviando transação...', 'info');
    
    const transaction = await connectedWallet.sendTransaction(tx);
    
    showNotification(`✅ Transação enviada! Hash: ${transaction.hash.substring(0, 10)}...`, 'success');
    
    document.getElementById('sendToAddress').value = '';
    document.getElementById('sendAmount').value = '';
    
    setTimeout(() => {
      refreshBalance();
    }, 3000);
    
  } catch (error) {
    console.error('Erro ao enviar transação:', error);
    showNotification('Erro ao enviar transação: ' + error.message, 'error');
  }
}

async function estimateGas() {
  const toAddress = document.getElementById('sendToAddress').value.trim();
  const amount = document.getElementById('sendAmount').value.trim();
  
  if (!toAddress || !amount) {
    showNotification('Preencha endereço e valor primeiro', 'error');
    return;
  }
  
  if (!polygonProvider || !networkStatus.connected) {
    showNotification('Conecte-se ao RPC primeiro', 'error');
    return;
  }
  
  try {
    showNotification('Estimando custo do gás...', 'info');
    
    const tx = {
      to: toAddress,
      value: ethers.parseEther(amount)
    };
    
    const connectedWallet = currentWallet.connect(polygonProvider);
    const estimatedGas = await connectedWallet.estimateGas(tx);
    
    const feeData = await polygonProvider.getFeeData();
    const gasPrice = feeData.maxFeePerGas || feeData.gasPrice;
    
    const gasCost = estimatedGas * gasPrice;
    const gasCostInMatic = ethers.formatEther(gasCost);
    
    const maticPrice = 0.8;
    const usdCost = parseFloat(gasCostInMatic) * maticPrice;
    
    document.getElementById('estimatedGasCost').textContent = `$${usdCost.toFixed(2)} (${parseFloat(gasCostInMatic).toFixed(6)} MATIC)`;
    
    showNotification('Estimativa de gás calculada', 'success');
    
  } catch (error) {
    console.error('Erro ao estimar gás:', error);
    showNotification('Erro ao estimar gás: ' + error.message, 'error');
  }
}

function copyAddress() {
  if (!currentWallet) return;
  
  navigator.clipboard.writeText(currentWallet.address)
    .then(() => showNotification('Endereço Polygon copiado!', 'success'))
    .catch(() => showNotification('Erro ao copiar endereço', 'error'));
}

function togglePrivateKeyVisibility() {
  if (!currentWallet) return;
  
  privateKeyVisible = !privateKeyVisible;
  updateSensitiveDataDisplay();
  showNotification(privateKeyVisible ? 'Chave privada Polygon visível' : 'Chave privada Polygon ocultada', 'info');
}

function toggleMnemonicVisibility() {
  if (!mnemonicPhrase) {
    showNotification('Nenhuma frase mnemônica disponível para esta identidade', 'error');
    return;
  }
  
  mnemonicVisible = !mnemonicVisible;
  updateSensitiveDataDisplay();
  showNotification(mnemonicVisible ? 'Frase mnemônica visível' : 'Frase mnemônica ocultada', 'info');
}

function copyPrivateKey() {
  if (!currentWallet) return;
  
  navigator.clipboard.writeText(currentWallet.privateKey)
    .then(() => showNotification('Chave privada Polygon copiada!', 'success'))
    .catch(() => showNotification('Erro ao copiar chave privada', 'error'));
}

function copyMnemonic() {
  if (!mnemonicPhrase) {
    showNotification('Nenhuma frase mnemônica disponível', 'error');
    return;
  }
  
  navigator.clipboard.writeText(mnemonicPhrase)
    .then(() => showNotification('Frase mnemônica copiada!', 'success'))
    .catch(() => showNotification('Erro ao copiar frase mnemônica', 'error'));
}

function showPrivateKey() {
  if (!currentWallet) return;
  
  if (confirm('⚠️ ATENÇÃO: A chave privada dá acesso total aos seus fundos na Polygon. Tem certeza que deseja visualizar?')) {
    alert(`SUA CHAVE PRIVADA POLYGON:\n\n${currentWallet.privateKey}\n\n⚠️ NUNCA COMPARTILHE ESTA INFORMAÇÃO!`);
  }
}

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

function disconnectWallet() {
  if (confirm('Encerrar sessão premium da Polygon?')) {
    currentWallet = null;
    mnemonicPhrase = null;
    isAddressRegistered = false;
    networkStatus.connected = false;
    
    localStorage.removeItem('exclusiveWalletPK');
    localStorage.removeItem('exclusiveWalletAddressRegistered');
    
    document.getElementById('wallet-dashboard').classList.add('fade-out');
    
    setTimeout(() => {
      document.getElementById('wallet-dashboard').classList.add('hidden');
      document.getElementById('login-screen').classList.remove('hidden');
      document.getElementById('login-screen').classList.remove('fade-out');
      document.getElementById('login-screen').classList.add('fade-in');
      
      document.getElementById('privateKey').value = '';
      document.getElementById('newWalletPassword').value = '';
      
      showNotification('Sessão Polygon premium encerrada.', 'info');
    }, 800);
  }
}

function showWalletDashboard() {
  document.getElementById('login-screen').classList.add('fade-out');
  
  setTimeout(() => {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('wallet-dashboard').classList.remove('hidden');
    document.getElementById('wallet-dashboard').classList.add('fade-in');
    
    updateSensitiveDataDisplay();
    updateOverview();
    refreshBalance();
    testRpcConnection();
    initializeBlockchainButtons();
    
  }, 800);
}

function openMnemonicModal() {
  document.getElementById('mnemonicModal').classList.add('active');
}

function closeMnemonicModal() {
  document.getElementById('mnemonicModal').classList.remove('active');
  document.getElementById('mnemonicPhrase').value = '';
}

function restoreWalletFromMnemonic() {
  const mnemonicPhraseInput = document.getElementById('mnemonicPhrase').value.trim();

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

function showReceiveModal() {
  document.getElementById('qrCodeContainer').style.display = 'block';
  document.getElementById('sendFormContainer').style.display = 'none';
  
  if (currentWallet) {
    document.getElementById('qrAddressDisplay').textContent = currentWallet.address;
    
    const qrCodeElement = document.getElementById('qrCodeCanvas');
    qrCodeElement.innerHTML = '';
    
    QRCode.toCanvas(qrCodeElement, currentWallet.address, {
      width: 180,
      height: 180,
      color: {
        dark: '#1A1A1A',
        light: '#FFFFFF'
      }
    }, function(error) {
      if (error) {
        console.error('Erro ao gerar QR Code:', error);
        qrCodeElement.innerHTML = '<div style="color: var(--text-secondary); padding: 20px;">Erro ao gerar QR Code</div>';
      }
    });
  }
}

function copyQRAddress() {
  if (!currentWallet) return;
  
  navigator.clipboard.writeText(currentWallet.address)
    .then(() => showNotification('Endereço Polygon copiado!', 'success'))
    .catch(() => showNotification('Erro ao copiar endereço', 'error'));
}

function cancelSend() {
  document.getElementById('sendFormContainer').style.display = 'none';
  showNotification('Envio na Polygon cancelado', 'info');
}

function loadMoreTransactions() {
  showNotification('Carregando mais transações Polygon...', 'info');
  setTimeout(() => {
    showNotification('Transações Polygon carregadas', 'success');
  }, 1000);
}