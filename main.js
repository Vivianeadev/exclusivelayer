// ======================================================
// CONFIGURAÇÕES GLOBAIS
// ======================================================

const { ethers } = window;
let currentWallet = null;
let currentTheme = 'luxury';
let privateKeyVisible = false;
let mnemonicVisible = false;
let mnemonicPhrase = null;
let mnemonicCreationTimer = null;
let mnemonicTimerSeconds = 300;
let isAddressRegistered = false;

// Sistema de notificação
function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  const messageElement = document.getElementById('notificationMessage');
  
  if (!notification || !messageElement) return;
  
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

// Sistema de tema
function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'luxury' : 'light';
  document.body.className = `theme-${currentTheme}`;
  localStorage.setItem('premiumWalletTheme', currentTheme);
  updateThemeButton();
}

function updateThemeButton() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;
  
  if (currentTheme === 'light') {
    themeToggle.innerHTML = '<i class="fas fa-moon"></i> Modo Escuro';
  } else {
    themeToggle.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
  }
}

// Trocar entre abas
function switchTab(tabId) {
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  const targetTab = document.getElementById(tabId);
  if (!targetTab) return;
  
  const tabButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
  if (tabButton) tabButton.classList.add('active');
  
  targetTab.classList.add('active');
  
  // Ações específicas por aba
  if (tabId === 'infraIdentityTab' && typeof testRpcConnection === 'function') {
    testRpcConnection();
  }
  
  if (tabId === 'walletTab' && typeof showCorrectWalletForChain === 'function') {
    showCorrectWalletForChain();
    updateCurrentChainBalance();
  }
  
  if (tabId === 'communicationTab' && typeof loadContacts === 'function') {
    loadContacts();
    updateAuthorizationStatus();
  }
  
  if (tabId === 'agendaTab' && window.agendaSystem && typeof window.agendaSystem.init === 'function') {
    window.agendaSystem.init();
  }
}

// Trocar entre sub-abas
function switchSubTab(subTabId) {
  document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.sub-tab-content').forEach(content => content.classList.add('hidden'));
  
  const subTabButton = document.querySelector(`.sub-tab-btn[data-subtab="${subTabId}"]`);
  const targetSubTab = document.getElementById(subTabId);
  
  if (subTabButton) subTabButton.classList.add('active');
  if (targetSubTab) targetSubTab.classList.remove('hidden');
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
    
    // Inicializar componentes
    if (typeof updateSensitiveDataDisplay === 'function') updateSensitiveDataDisplay();
    if (typeof updateOverview === 'function') updateOverview();
    if (typeof refreshBalance === 'function') refreshBalance();
    if (typeof testRpcConnection === 'function') testRpcConnection();
    if (typeof initializeBlockchainButtons === 'function') initializeBlockchainButtons();
  }, 800);
}

// ======================================================
// INICIALIZAÇÃO
// ======================================================

document.addEventListener('DOMContentLoaded', function() {
  // Tema
  const savedTheme = localStorage.getItem('premiumWalletTheme') || 'luxury';
  currentTheme = savedTheme;
  document.body.className = `theme-${currentTheme}`;
  updateThemeButton();
  
  // Event Listeners básicos
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
  
  // Tabs
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
  
  // Sub-tabs
  document.querySelectorAll('.sub-tab-btn').forEach(button => {
    button.addEventListener('click', () => {
      const subTabId = button.getAttribute('data-subtab');
      switchSubTab(subTabId);
    });
  });
  
  // Verificar se já tem wallet conectada
  const savedPK = localStorage.getItem('exclusiveWalletPK');
  if (savedPK) {
    try {
      currentWallet = new ethers.Wallet(savedPK);
      
      // Restaurar registro de endereço
      isAddressRegistered = localStorage.getItem('exclusiveWalletAddressRegistered') === 'true';
      
      showWalletDashboard();
      showNotification('Identidade Polygon restaurada da sessão anterior', 'success');
    } catch (error) {
      console.error('Erro ao restaurar wallet:', error);
      localStorage.removeItem('exclusiveWalletPK');
    }
  }
  
  // Adicionar explicação do sistema (opcional)
  if (typeof addSystemExplanation === 'function') {
    setTimeout(addSystemExplanation, 1000);
  }
});

// Exportar funções para uso em outros módulos
window.showNotification = showNotification;
window.switchTab = switchTab;
window.switchSubTab = switchSubTab;
window.showWalletDashboard = showWalletDashboard;
