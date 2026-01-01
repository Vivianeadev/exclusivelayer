// ======================================================
// FUNÇÕES UTILITÁRIAS
// ======================================================

// Mostrar notificação
function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  const messageElement = document.getElementById('notificationMessage');
  
  if (!notification || !messageElement) {
    console.warn('Elementos de notificação não encontrados');
    return;
  }
  
  messageElement.textContent = message;
  
  const colors = CONSTANTS ? CONSTANTS.NOTIFICATION_COLORS : {
    info: 'var(--primary-color)',
    success: 'var(--success-color)',
    warning: 'var(--warning-color)',
    error: 'var(--error-color)'
  };
  
  notification.style.borderColor = colors[type] || colors.info;
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, CONSTANTS ? CONSTANTS.NOTIFICATION_TIMEOUT : 4000);
}

// Alternar tema
function toggleTheme() {
  const currentTheme = document.body.classList.contains('theme-light') ? 'light' : 'luxury';
  const newTheme = currentTheme === 'light' ? 'luxury' : 'light';
  
  document.body.className = `theme-${newTheme}`;
  localStorage.setItem('premiumWalletTheme', newTheme);
  updateThemeButton();
}

// Atualizar botão de tema
function updateThemeButton() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;
  
  const currentTheme = document.body.classList.contains('theme-light') ? 'light' : 'luxury';
  
  if (currentTheme === 'light') {
    themeToggle.innerHTML = '<i class="fas fa-moon"></i> Modo Escuro';
  } else {
    themeToggle.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
  }
}

// Formatar endereço
function formatAddress(address, start = 6, end = 4) {
  if (!address || address.length < 10) return address;
  return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
}

// Formatar número
function formatNumber(number, decimals = 4) {
  if (isNaN(number)) return '0.0000';
  return parseFloat(number).toFixed(decimals);
}

// Formatar moeda
function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

// Copiar para área de transferência
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Erro ao copiar:', error);
    return false;
  }
}

// Validar endereço Ethereum
function isValidEthereumAddress(address) {
  if (!address) return false;
  if (!address.startsWith('0x')) return false;
  if (address.length !== 42) return false;
  
  // Verificar se é hexadecimal
  const hexRegex = /^0x[0-9a-fA-F]{40}$/;
  return hexRegex.test(address);
}

// Validar chave privada
function isValidPrivateKey(key) {
  if (!key) return false;
  
  let cleanKey = key.replace(/\s/g, '');
  if (!cleanKey.startsWith('0x')) {
    cleanKey = '0x' + cleanKey;
  }
  
  // Chave privada Ethereum tem 64 caracteres hexadecimais (sem o 0x)
  const hexRegex = /^0x[0-9a-fA-F]{64}$/;
  return hexRegex.test(cleanKey);
}

// Validar frase mnemônica
function isValidMnemonic(phrase) {
  if (!phrase) return false;
  
  const words = phrase.trim().split(/\s+/);
  return words.length === 12 || words.length === 24;
}

// Gerar ID único
function generateId(length = 8) {
  return Math.random().toString(36).substring(2, 2 + length);
}

// Formatar data
function formatDate(date, format = 'pt-BR') {
  if (!date) return '';
  
  const d = new Date(date);
  
  if (format === 'pt-BR') {
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  if (format === 'iso') {
    return d.toISOString();
  }
  
  return d.toString();
}

// Calcular tempo decorrido
function timeAgo(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diff = now - past;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}m atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days}d atrás`;
  
  return formatDate(past, 'pt-BR');
}

// Sanitizar entrada do usuário
function sanitizeInput(input) {
  if (!input) return '';
  
  return input
    .toString()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Converter wei para ether
function weiToEther(wei) {
  if (!wei) return '0';
  const ethers = window.ethers;
  if (!ethers) {
    console.error('Ethers.js não carregado');
    return '0';
  }
  return ethers.formatEther(wei.toString());
}

// Converter ether para wei
function etherToWei(ether) {
  if (!ether) return '0';
  const ethers = window.ethers;
  if (!ethers) {
    console.error('Ethers.js não carregado');
    return '0';
  }
  return ethers.parseEther(ether.toString()).toString();
}

// Calcular estimativa de gás
async function estimateGasCost(to, value, data = '0x') {
  try {
    if (!window.currentWallet || !window.polygonProvider) {
      throw new Error('Wallet ou provider não disponível');
    }
    
    const tx = {
      to: to,
      value: etherToWei(value),
      data: data
    };
    
    const connectedWallet = window.currentWallet.connect(window.polygonProvider);
    const estimatedGas = await connectedWallet.estimateGas(tx);
    
    const feeData = await window.polygonProvider.getFeeData();
    const gasPrice = feeData.maxFeePerGas || feeData.gasPrice;
    
    const gasCost = estimatedGas * gasPrice;
    const gasCostInMatic = weiToEther(gasCost);
    
    return {
      gasLimit: estimatedGas.toString(),
      gasPrice: gasPrice.toString(),
      totalCost: gasCost.toString(),
      totalCostMatic: gasCostInMatic,
      totalCostUSD: (parseFloat(gasCostInMatic) * 0.8).toFixed(2) // MATIC a $0.8
    };
  } catch (error) {
    console.error('Erro ao estimar gás:', error);
    return null;
  }
}

// Verificar se é mobile
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Verificar conexão com internet
function checkInternetConnection() {
  return navigator.onLine;
}

// Carregar dados do localStorage
function loadFromStorage(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Erro ao carregar ${key} do localStorage:`, error);
    return defaultValue;
  }
}

// Salvar dados no localStorage
function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Erro ao salvar ${key} no localStorage:`, error);
    return false;
  }
}

// Remover dados do localStorage
function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Erro ao remover ${key} do localStorage:`, error);
    return false;
  }
}

// Limpar todos os dados do localStorage
function clearStorage() {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Erro ao limpar localStorage:', error);
    return false;
  }
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  window.utils = {
    showNotification,
    toggleTheme,
    updateThemeButton,
    formatAddress,
    formatNumber,
    formatCurrency,
    copyToClipboard,
    isValidEthereumAddress,
    isValidPrivateKey,
    isValidMnemonic,
    generateId,
    formatDate,
    timeAgo,
    sanitizeInput,
    weiToEther,
    etherToWei,
    estimateGasCost,
    isMobile,
    checkInternetConnection,
    loadFromStorage,
    saveToStorage,
    removeFromStorage,
    clearStorage
  };
}
