// Função para carregar componentes HTML
async function loadComponent(elementId, componentPath) {
  try {
    const response = await fetch(componentPath);
    const html = await response.text();
    document.getElementById(elementId).innerHTML = html;
  } catch (error) {
    console.error(`Erro ao carregar ${componentPath}:`, error);
  }
}

// Função para trocar de aba
function switchTab(tabId) {
  // Esconde todas as abas
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remove classe active de todos os botões
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Mostra a aba selecionada
  const selectedTab = document.getElementById(tabId);
  if (selectedTab) {
    selectedTab.classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
  }
  
  // Carrega o conteúdo da aba se ainda não estiver carregado
  loadTabContent(tabId);
}

// Carrega conteúdo específico da aba
async function loadTabContent(tabId) {
  const componentMap = {
    'overviewTab': 'components/overview.html',
    'walletTab': 'components/wallet.html',
    'blockchainsTab': 'components/blockchains.html',
    'communicationTab': 'components/communication.html',
    'securityTab': 'components/security.html'
  };
  
  if (componentMap[tabId]) {
    await loadComponent(tabId, componentMap[tabId]);
  }
}