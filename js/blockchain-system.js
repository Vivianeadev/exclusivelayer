// EXCLUSIVE WALLET PREMIUM - BLOCKCHAIN SYSTEM

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
function selectBlockchain(chainId) {
  document.querySelectorAll('.blockchain-button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-chain') === chainId) {
      btn.classList.add('active');
    }
  });
  
  currentSelectedChain = chainId;
  
  switchTab('blockchainsTab');
  
  if (chainId === 'base') {
    showNotification(`Dashboard da Base carregado`, 'success');
  } else if (chainId !== 'polygon') {
    showNotification(`Dashboard da ${blockchains.find(c => c.id === chainId).name} carregado`, 'success');
  }
}

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
    
    closeMnemonicModalOther();
    showNotification(`✅ Wallet ${currentChainForCreation.charAt(0).toUpperCase() + currentChainForCreation.slice(1)} restaurada! Endereço: ${wallet.address.substring(0, 10)}...`, 'success');
    
  } catch (error) {
    console.error('Erro ao restaurar wallet:', error);
    showNotification('Erro ao restaurar wallet: ' + error.message, 'error');
  }
}

// Event Listeners para modals de outras chains
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('closeMnemonicCreationModalOther')) {
    document.getElementById('closeMnemonicCreationModalOther').addEventListener('click', closeMnemonicCreationModalOther);
  }
  
  if (document.getElementById('cancelWalletCreationOther')) {
    document.getElementById('cancelWalletCreationOther').addEventListener('click', closeMnemonicCreationModalOther);
  }
  
  if (document.getElementById('confirmMnemonicSavedOther')) {
    document.getElementById('confirmMnemonicSavedOther').addEventListener('click', confirmMnemonicSavedOther);
  }
  
  if (document.getElementById('closeMnemonicModalOther')) {
    document.getElementById('closeMnemonicModalOther').addEventListener('click', closeMnemonicModalOther);
  }
  
  if (document.getElementById('cancelRestoreOther')) {
    document.getElementById('cancelRestoreOther').addEventListener('click', closeMnemonicModalOther);
  }
  
  if (document.getElementById('confirmRestoreOther')) {
    document.getElementById('confirmRestoreOther').addEventListener('click', confirmRestoreOther);
  }
  
  // Carregar wallets salvas de outras chains
  blockchains.forEach(chain => {
    if (chain.id !== 'polygon') {
      const savedPk = localStorage.getItem(`exclusiveWallet_${chain.id}`);
      if (savedPk) {
        try {
          const wallet = new ethers.Wallet(savedPk);
          const savedMnemonic = localStorage.getItem(`exclusiveWalletMnemonic_${chain.id}`);
          
          otherChainsWallets[chain.id] = {
            wallet: wallet,
            mnemonic: savedMnemonic || ''
          };
        } catch (error) {
          console.error(`Erro ao carregar wallet ${chain.id}:`, error);
        }
      }
    }
  });
});
