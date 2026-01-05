// LOGIN FUNCTIONS
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
  
  initializeRpcProvider();
  
  showNotification(`✅ Identidade Polygon criada! Endereço: ${currentWallet.address.substring(0, 10)}...`, 'success');
  showNotification('⚠️ SALVE SUA CHAVE PRIVADA E FRASE MNEMÔNICA!', 'warning');
  closeMnemonicCreationModal();
  showWalletDashboard();
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
    
    loadContacts();
    updateAuthorizationStatus();
    
  }, 800);
}

// Event listeners para login
document.addEventListener('DOMContentLoaded', function() {
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
});
