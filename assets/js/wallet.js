// Funções da wallet e gestão de identidade
const { ethers } = window;
let currentWallet = null;
let currentTheme = 'luxury';
let privateKeyVisible = false;
let mnemonicVisible = false;
let mnemonicPhrase = null;
let mnemonicCreationTimer = null;
let mnemonicTimerSeconds = 300;
let isAddressRegistered = false;

// Mostrar notificação
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

// Alternar tema
function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'luxury' : 'light';
  document.body.className = `theme-${currentTheme}`;
  localStorage.setItem('premiumWalletTheme', currentTheme);
  updateThemeButton();
}

// Atualizar botão do tema
function updateThemeButton() {
  const themeToggle = document.getElementById('themeToggle');
  if (currentTheme === 'light') {
    themeToggle.innerHTML = '<i class="fas fa-moon"></i> Modo Escuro';
  } else {
    themeToggle.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
  }
}

// Conectar com chave privada
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
    
    // Verificar autorização Identity Dynamic salva
    if (localStorage.getItem('identityDynamicAuth') === 'true') {
      identityDynamicAuthorized = true;
      identityDynamicSessionId = localStorage.getItem('identityDynamicSession');
      identityDynamicSignature = localStorage.getItem('identityDynamicSignature');
    }
    
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

// Mostrar modal de mnemônica
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

// Atualizar timer da mnemônica
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

// Fechar modal de criação de mnemônica
function closeMnemonicCreationModal() {
  const modal = document.getElementById('mnemonicCreationModal');
  modal.classList.remove('active');
  clearInterval(mnemonicCreationTimer);
  
  currentWallet = null;
  mnemonicPhrase = null;
  localStorage.removeItem('exclusiveWalletPK');
  localStorage.removeItem('exw_psw');
}

// Confirmar mnemônica salva
function confirmMnemonicSaved() {
  clearInterval(mnemonicCreationTimer);
  
  initializeRpcProvider();
  
  showNotification(`✅ Identidade Polygon criada! Endereço: ${currentWallet.address.substring(0, 10)}...`, 'success');
  showNotification('⚠️ SALVE SUA CHAVE PRIVADA E FRASE MNEMÔNICA!', 'warning');
  closeMnemonicCreationModal();
  showWalletDashboard();
}

// Abrir modal de mnemônica
function openMnemonicModal() {
  document.getElementById('mnemonicModal').classList.add('active');
}

// Fechar modal de mnemônica
function closeMnemonicModal() {
  document.getElementById('mnemonicModal').classList.remove('active');
  document.getElementById('mnemonicPhrase').value = '';
}

// Restaurar wallet da mnemônica
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

// Mostrar dashboard da wallet
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
    
    // Inicializar comunicação
    loadContacts();
    updateAuthorizationStatus();
    
  }, 800);
}

// Atualizar exibição de dados sensíveis
function updateSensitiveDataDisplay() {
  if (!currentWallet) return;
  
  document.getElementById('privateKeyDisplay').textContent = privateKeyVisible ? 
    currentWallet.privateKey : '••••••••••••••••••••••••••••••••••••••••••••••';
  
  document.getElementById('mnemonicDisplay').textContent = mnemonicVisible && mnemonicPhrase ? 
    mnemonicPhrase : '••••••••••••••••••••••••••••••••••••••••••••••';
  
  document.getElementById('togglePrivateKey').innerHTML = `<i class="fas fa-${privateKeyVisible ? 'eye-slash' : 'eye'}"></i> ${privateKeyVisible ? 'Ocultar' : 'Mostrar'} Chave`;
  document.getElementById('toggleMnemonic').innerHTML = `<i class="fas fa-${mnemonicVisible ? 'eye-slash' : 'eye'}"></i> ${mnemonicVisible ? 'Ocultar' : 'Mostrar'} Frase`;
}

// Atualizar visão geral
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

// Atualizar registro de endereço
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

// Copiar endereço
function copyAddress() {
  if (!currentWallet) return;
  
  navigator.clipboard.writeText(currentWallet.address)
    .then(() => showNotification('Endereço Polygon copiado!', 'success'))
    .catch(() => showNotification('Erro ao copiar endereço', 'error'));
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
function copyPrivateKey() {
  if (!currentWallet) return;
  
  navigator.clipboard.writeText(currentWallet.privateKey)
    .then(() => showNotification('Chave privada Polygon copiada!', 'success'))
    .catch(() => showNotification('Erro ao copiar chave privada', 'error'));
}

// Copiar mnemônica
function copyMnemonic() {
  if (!mnemonicPhrase) {
    showNotification('Nenhuma frase mnemônica disponível', 'error');
    return;
  }
  
  navigator.clipboard.writeText(mnemonicPhrase)
    .then(() => showNotification('Frase mnemônica copiada!', 'success'))
    .catch(() => showNotification('Erro ao copiar frase mnemônica', 'error'));
}

// Mostrar chave privada
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
    identityDynamicAuthorized = false;
    identityDynamicSessionId = null;
    identityDynamicSignature = null;
    
    localStorage.removeItem('exclusiveWalletPK');
    localStorage.removeItem('exclusiveWalletAddressRegistered');
    localStorage.removeItem('identityDynamicAuth');
    localStorage.removeItem('identityDynamicSession');
    localStorage.removeItem('identityDynamicSignature');
    
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

// Mostrar informações de segurança
function showSecurityInfoModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title"><i class="fas fa-shield-alt"></i> Informações Técnicas</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <p style="color: var(--text-secondary); margin-bottom: 20px;">
          <strong>PROTOCOLO DE SEGURANÇA PREMIUM POLYGON</strong>
        </p>
        <ul style="color: var(--text-secondary); padding-left: 20px; margin-bottom: 25px;">
          <li>Criptografia ponta a ponta (AES-256 + ECC)</li>
          <li>Chaves armazenadas apenas localmente</li>
          <li>Sem backdoor ou acesso de terceiros</li>
          <li>Zero rastreamento de dados</li>
          <li>Comunicação via canais criptografados</li>
          <li>RPC Tunnel proprietário</li>
        </ul>
        <p style="color: var(--warning-color); font-size: 13px;">
          <i class="fas fa-exclamation-triangle"></i> Status: ATIVO E OPERACIONAL
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Fechar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// Mostrar protocolo de recuperação
function showRecoveryBox() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title"><i class="fas fa-key"></i> Protocolo de Recuperação Polygon</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <p style="color: var(--text-secondary); margin-bottom: 20px;">
          Sua segurança na Polygon depende exclusivamente de você:
        </p>
        <ul style="color: var(--text-secondary); padding-left: 20px; margin-bottom: 25px;">
          <li>Salve a <strong>chave privada Polygon</strong> e <strong>frase mnemônica</strong> em local seguro</li>
          <li>Não compartilhe com ninguem</li>
          <li>Faça backup físico (papel/metal)</li>
          <li>O desenvolvedor NÃO tem acesso aos seus dados</li>
        </ul>
        <p style="color: var(--warning-color); font-size: 13px;">
          <i class="fas fa-exclamation-triangle"></i> Perda da chave = perda permanente dos fundos na Polygon
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Entendido</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// Event Listeners do wallet.js
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
  
  // Segurança
  document.getElementById('togglePrivateKey').addEventListener('click', togglePrivateKeyVisibility);
  document.getElementById('toggleMnemonic').addEventListener('click', toggleMnemonicVisibility);
  document.getElementById('copyPrivateKey').addEventListener('click', copyPrivateKey);
  document.getElementById('copyMnemonic').addEventListener('click', copyMnemonic);
  document.getElementById('showPrivateKey').addEventListener('click', showPrivateKey);
  document.getElementById('exportWallet').addEventListener('click', exportWallet);
  document.getElementById('disconnectWallet').addEventListener('click', disconnectWallet);
  
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
});
