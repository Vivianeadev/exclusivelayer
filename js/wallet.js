// Sistema de Carregamento Dinâmico
async function loadComponent(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Erro ao carregar: ${path}`);
    return await response.text();
  } catch (error) {
    console.error(error);
    return `<div class="error">Erro ao carregar componente: ${path}</div>`;
  }
}

// Carregar todos os componentes
async function loadAllComponents() {
  // Carregar Header
  const header = await loadComponent('components/header.html');
  document.getElementById('header-container').innerHTML = header;

  // Carregar Tela de Login
  const loginScreen = await loadComponent('tabs/loginScreen.html');
  document.getElementById('login-screen').innerHTML = loginScreen;

  // Carregar Aba Inicial
  await switchTab('overviewTab');

  // Carregar Modais
  const modals = await loadComponent('modals/allModals.html');
  document.getElementById('modals-container').innerHTML = modals;
}

// Sistema de Navegação
async function switchTab(tabId) {
  // Atualizar botões
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    }
  });

  // Carregar conteúdo da aba
  const content = await loadComponent(`tabs/${tabId}.html`);
  document.getElementById('tab-content-container').innerHTML = content;

  // Executar ações específicas da aba
  switch(tabId) {
    case 'infraIdentityTab':
      await testRpcConnection();
      break;
    case 'walletTab':
      await updateCurrentChainBalance();
      break;
    case 'agendaTab':
      if (typeof agendaSystem !== 'undefined') agendaSystem.init();
      break;
  }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
  await loadAllComponents();
  
  // Inicializar tema
  const savedTheme = localStorage.getItem('premiumWalletTheme') || 'luxury';
  document.body.className = `theme-${savedTheme}`;
  
  // Adicionar event listeners aos botões das abas
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
  
  // Resto do seu código JavaScript aqui...
  // [Todo o resto do seu código JavaScript atual]
});

// Sistema de Agenda (placeholder)
const agendaSystem = {
  init: function() {
    console.log('Sistema de agenda carregado');
  }
};
