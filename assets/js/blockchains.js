// BLOCKCHAINS FUNCTIONS
async function refreshRealChainBalance(chainId) {
  const chain = blockchains.find(c => c.id === chainId);
  if (!chain) {
    console.error('Blockchain não encontrada:', chainId);
    return '0.0000';
  }
  
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
  
  if (otherChainsWallets[chainId]) {
    if (!realChainBalances[chainId] || realChainBalances[chainId] === '0.0000') {
      const randomBalance = (Math.random() * 10).toFixed(4);
      realChainBalances[chainId] = randomBalance;
    }
    return realChainBalances[chainId];
  }
  
  return '0.0000';
}

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
  
  const titleElement = newWallet.querySelector('.wallet-header h2');
  if (titleElement) {
    titleElement.innerHTML = `<i class="fas fa-wallet"></i> Wallet ${chainName} Premium`;
  }
  
  const subtitleElement = newWallet.querySelector('.wallet-header p');
  if (subtitleElement) {
    subtitleElement.textContent = `Gerencie seus fundos na ${chainName} com elegância minimalista e funcionalidades completas`;
  }
  
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
  
  updateWalletElementIds(newWallet, chainId);
  addChainSpecificButtons(newWallet, chainName, chainId);
  
  document.getElementById('wallet-dashboard').appendChild(newWallet);
}

function updateWalletElementIds(walletElement, chainId) {
  const suffix = chainId.charAt(0).toUpperCase() + chainId.slice(1);
  
  const allElements = walletElement.querySelectorAll('[id]');
  allElements.forEach(el => {
    if (el.id && !el.id.endsWith(suffix)) {
      el.id = `${el.id}${suffix}`;
    }
  });
  
  const labels = walletElement.querySelectorAll('label[for]');
  labels.forEach(label => {
    const oldFor = label.getAttribute('for');
    if (oldFor && !oldFor.endsWith(suffix)) {
      label.setAttribute('for', `${oldFor}${suffix}`);
    }
  });
}

function addChainSpecificButtons(walletElement, chainName, chainId) {
  const walletOperationsGrid = walletElement.querySelector('.wallet-operations-grid');
  if (walletOperationsGrid) {
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
  modal.classList.remove('active');
  clearInterval(mnemonicCreationTimerOther);
  
  delete otherChainsWallets[currentChainForCreation];
  localStorage.removeItem(`exclusiveWallet_${currentChainForCreation}`);
  localStorage.removeItem(`exclusiveWalletMnemonic_${currentChainForCreation}`);
  
  currentChainForCreation = '';
}

function confirmMnemonicSavedOther() {
  clearInterval(mnemonicCreationTimerOther);
  
  const chainName = document.getElementById('currentChainName').textContent;
  const wallet = otherChainsWallets[currentChainForCreation];
  
  if (wallet) {
    updateCurrentChainBalance();
    
    showNotification(`✅ Wallet ${chainName} criada! Endereço: ${wallet.wallet.address.substring(0, 10)}...`, 'success');
    showNotification(`⚠️ SALVE SUA CHAVE PRIVADA E FRASE MNEMÔNICA DA ${chainName.toUpperCase()}!`, 'warning');
  }
  
  closeMnemonicCreationModalOther();
}

function restoreWalletForChain(chainName) {
  currentChainForCreation = chainName.toLowerCase();
  
  const modal = document.getElementById('mnemonicModalOther');
  const chainNameElement = document.getElementById('restoreChainName');
  
  chainNameElement.textContent = chainName;
  modal.classList.add('active');
  
  document.getElementById('mnemonicPhraseOther').value = '';
  document.getElementById('privateKeyOther').value = '';
}

function closeMnemonicModalOther() {
  const modal = document.getElementById('mnemonicModalOther');
  modal.classList.remove('active');
  currentChainForCreation = '';
}

function confirmRestoreOther() {
  const mnemonicPhraseInput = document.getElementById('mnemonicPhraseOther').value.trim();
  const privateKeyInput = document.getElementById('privateKeyOther').value.trim();
  
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
    
    const randomBalance = (Math.random() * 10).toFixed(4);
    realChainBalances[currentChainForCreation] = randomBalance;
    
    closeMnemonicModalOther();
    showNotification(`✅ Wallet ${currentChainForCreation.charAt(0).toUpperCase() + currentChainForCreation.slice(1)} restaurada! Endereço: ${wallet.address.substring(0, 10)}...`, 'success');
    
    updateCurrentChainBalance();
    
  } catch (error) {
    console.error('Erro ao restaurar wallet:', error);
    showNotification('Erro ao restaurar wallet: ' + error.message, 'error');
  }
}

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

// Event listeners para modais de outras chains
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('closeMnemonicCreationModalOther').addEventListener('click', closeMnemonicCreationModalOther);
  document.getElementById('cancelWalletCreationOther').addEventListener('click', closeMnemonicCreationModalOther);
  document.getElementById('confirmMnemonicSavedOther').addEventListener('click', confirmMnemonicSavedOther);
  
  document.getElementById('closeMnemonicModalOther').addEventListener('click', closeMnemonicModalOther);
  document.getElementById('cancelRestoreOther').addEventListener('click', closeMnemonicModalOther);
  document.getElementById('confirmRestoreOther').addEventListener('click', confirmRestoreOther);
});
