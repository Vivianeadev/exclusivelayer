// Controle de abas e navegação

function switchTab(tabId) {
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  const targetTab = document.getElementById(tabId);
  if (!targetTab) return;
  
  document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
  targetTab.classList.add('active');
  
  if (tabId === 'infraIdentityTab') {
    testRpcConnection();
  }
  
  if (tabId === 'walletTab') {
    showCorrectWalletForChain();
    updateCurrentChainBalance();
  }
  
  if (tabId === 'communicationTab') {
    loadContacts();
    updateAuthorizationStatus();
  }
  
  // Inicializar agenda quando a aba for ativada
  if (tabId === 'agendaTab') {
    agendaSystem.init();
  }
}

function switchSubTab(subTabId) {
  document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.sub-tab-content').forEach(content => content.classList.add('hidden'));
  
  document.querySelector(`.sub-tab-btn[data-subtab="${subTabId}"]`).classList.add('active');
  document.getElementById(subTabId).classList.remove('hidden');
}

// Event Listeners para abas
document.addEventListener('DOMContentLoaded', function() {
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
});
