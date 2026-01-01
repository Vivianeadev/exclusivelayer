// ======================================================
// ARQUIVO PRINCIPAL - INICIALIZAÇÃO DO SISTEMA
// ======================================================

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  // Carregar tema salvo
  const savedTheme = loadFromStorage('premiumWalletTheme', 'luxury');
  document.body.className = `theme-${savedTheme}`;
  updateThemeButton();
  
  // Elementos de Login
  const themeToggle = document.getElementById('themeToggle');
  const loginPrivateKey = document.getElementById('loginPrivateKey');
  const createWallet = document.getElementById('createWallet');
  const restoreMnemonicLogin = document.getElementById('restoreMnemonicLogin');
  const restoreMnemonicNew = document.getElementById('restoreMnemonicNew');
  
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
  if (loginPrivateKey) loginPrivateKey.addEventListener('click', connectPrivateKey);
  if (createWallet) createWallet.addEventListener('click', createNewWallet);
  if (restoreMnemonicLogin) restoreMnemonicLogin.addEventListener('click', openMnemonicModal);
  if (restoreMnemonicNew) restoreMnemonicNew.addEventListener('click', openMnemonicModal);
  
  // Modal de Mnemônica (Criação)
  const closeMnemonicCreationModal = document.getElementById('closeMnemonicCreationModal');
  const cancelWalletCreation = document.getElementById('cancelWalletCreation');
  const confirmMnemonicSaved = document.getElementById('confirmMnemonicSaved');
  
  if (closeMnemonicCreationModal) closeMnemonicCreationModal.addEventListener('click', window.wallet?.closeMnemonicCreationModal);
  if (cancelWalletCreation) cancelWalletCreation.addEventListener('click', window.wallet?.closeMnemonicCreationModal);
  if (confirmMnemonicSaved) confirmMnemonicSaved.addEventListener('click', window.wallet?.confirmMnemonicSaved);
  
  // Modal de Mnemônica (Restauração)
  const closeMnemonicModal = document.getElementById('closeMnemonicModal');
  const cancelRestore = document.getElementById('cancelRestore');
  const confirmRestore = document.getElementById('confirmRestore');
  
  if (closeMnemonicModal) closeMnemonicModal.addEventListener('click', window.wallet?.closeMnemonicModal);
  if (cancelRestore) cancelRestore.addEventListener('click', window.wallet?.closeMnemonicModal);
  if (confirmRestore) confirmRestore.addEventListener('click', window.wallet?.restoreWalletFromMnemonic);
  
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
  
  // Segurança
  const togglePrivateKey = document.getElementById('togglePrivateKey');
  const toggleMnemonic = document.getElementById('toggleMnemonic');
  const copyPrivateKey = document.getElementById('copyPrivateKey');
  const copyMnemonic = document.getElementById('copyMnemonic');
  const showPrivateKey = document.getElementById('showPrivateKey');
  const exportWallet = document.getElementById('exportWallet');
  const disconnectWallet = document.getElementById('disconnectWallet');
  
  if (togglePrivateKey) togglePrivateKey.addEventListener('click', window.wallet?.togglePrivateKeyVisibility);
  if (toggleMnemonic) toggleMnemonic.addEventListener('click', window.wallet?.toggleMnemonicVisibility);
  if (copyPrivateKey) copyPrivateKey.addEventListener('click', window.wallet?.copyPrivateKey);
  if (copyMnemonic) copyMnemonic.addEventListener('click', window.wallet?.copyMnemonic);
  if (showPrivateKey) showPrivateKey.addEventListener('click', window.wallet?.showPrivateKey);
  if (exportWallet) exportWallet.addEventListener('click', window.wallet?.exportWallet);
  if (disconnectWallet) disconnectWallet.addEventListener('click', window.wallet?.disconnectWallet);
  
  // Verificar se já tem wallet conectada
  const savedPK = loadFromStorage('exclusiveWalletPK');
  if (savedPK) {
    try {
      const ethers = window.ethers;
      if (ethers) {
        window.currentWallet = new ethers.Wallet(savedPK);
        
        // Restaurar autorização Identity Dynamic se existir
        const savedAuth = loadFromStorage('identityDynamicAuth', false);
        if (savedAuth) {
          window.identityDynamicAuthorized = true;
          window.identityDynamicSessionId = loadFromStorage('identityDynamicSession');
          window.identityDynamicSignature = loadFromStorage('identityDynamicSignature');
        }
        
        // Restaurar registro de endereço
        window.isAddressRegistered = loadFromStorage('exclusiveWalletAddressRegistered', false);
        
        // Inicializar sistema
        if (window.initializeRpcProvider) {
          window.initializeRpcProvider();
        }
        
        if (window.showWalletDashboard) {
          window.showWalletDashboard();
        }
        
        showNotification('Identidade Polygon restaurada da sessão anterior', 'success');
      }
    } catch (error) {
      console.error('Erro ao restaurar wallet:', error);
      removeFromStorage('exclusiveWalletPK');
    }
  }
  
  // Adicionar explicação do sistema
  addSystemExplanation();
});

// Função para alternar entre tabs
function switchTab(tabId) {
  // Remover classe active de todas as tabs
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  // Adicionar classe active à tab selecionada
  const targetTab = document.getElementById(tabId);
  const targetButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
  
  if (targetButton) targetButton.classList.add('active');
  if (targetTab) targetTab.classList.add('active');
  
  // Executar ações específicas da tab
  if (tabId === 'infraIdentityTab' && window.testRpcConnection) {
    window.testRpcConnection();
  }
  
  if (tabId === 'walletTab' && window.showCorrectWalletForChain) {
    window.showCorrectWalletForChain();
    if (window.updateCurrentChainBalance) {
      window.updateCurrentChainBalance();
    }
  }
  
  if (tabId === 'communicationTab') {
    if (window.loadContacts) window.loadContacts();
    if (window.updateAuthorizationStatus) window.updateAuthorizationStatus();
  }
  
  if (tabId === 'agendaTab' && window.initAgenda) {
    window.initAgenda();
  }
}

// Adicionar explicação do sistema
function addSystemExplanation() {
  const communicationTab = document.getElementById('communicationTab');
  if (!communicationTab) return;
  
  // Verificar se a explicação já foi adicionada
  if (communicationTab.querySelector('.system-explanation')) return;
  
  const explanation = document.createElement('div');
  explanation.className = 'system-explanation';
  explanation.style.marginTop = '40px';
  explanation.style.paddingTop = '30px';
  explanation.style.borderTop = '1px solid var(--gold-primary)';
  explanation.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="width: 80px; height: 2px; background: var(--gradient-gold); margin: 0 auto 20px;"></div>
      <h3 style="font-family: 'Cinzel', serif; color: var(--primary-color); margin-bottom: 15px;">
        <i class="fas fa-graduation-cap"></i> Como Usar o Sistema de Comunicação
      </h3>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px;">
      <div style="background: var(--gradient-card); padding: 20px; border-radius: 12px; border: 1px solid var(--card-border);">
        <h4 style="color: var(--primary-color); margin-bottom: 10px; font-size: 14px;">
          <i class="fas fa-user-friends"></i> 1. Convidar Amigos
        </h4>
        <p style="color: var(--text-secondary); font-size: 11px; line-height: 1.5;">
          • Vá para a aba "Contatos"<br>
          • Adicione o endereço Polygon do seu amigo<br>
          • Ambos precisam estar autorizados no sistema
        </p>
      </div>
      
      <div style="background: var(--gradient-card); padding: 20px; border-radius: 12px; border: 1px solid var(--card-border);">
        <h4 style="color: var(--primary-color); margin-bottom: 10px; font-size: 14px;">
          <i class="fas fa-key"></i> 2. Autorização
        </h4>
        <p style="color: var(--text-secondary); font-size: 11px; line-height: 1.5;">
          • Autorize seu endereço Polygon na aba "Autorização"<br>
          • Cada participante deve autorizar individualmente<br>
          • A autorização é local e segura
        </p>
      </div>
      
      <div style="background: var(--gradient-card); padding: 20px; border-radius: 12px; border: 1px solid var(--card-border);">
        <h4 style="color: var(--primary-color); margin-bottom: 10px; font-size: 14px;">
          <i class="fas fa-video"></i> 3. Reuniões em Grupo
        </h4>
        <p style="color: var(--text-secondary); font-size: 11px; line-height: 1.5;">
          • Crie uma reunião na aba "Vídeo em Grupo"<br>
          • Compartilhe o código com os participantes<br>
          • Todos entram com o mesmo código<br>
          • Conexão P2P criptografada via WebRTC
        </p>
      </div>
    </div>
    
    <div style="background: rgba(212, 175, 55, 0.05); padding: 15px; border-radius: 10px; border: 1px solid rgba(212, 175, 55, 0.2);">
      <p style="color: var(--text-secondary); font-size: 10px; text-align: center; line-height: 1.4;">
        <strong>✅ Sistema Real:</strong> WebRTC funcional com comunicação P2P • 
        <strong>✅ Criptografia:</strong> Todas as conexões são criptografadas • 
        <strong>✅ Sem Intermediários:</strong> Conexão direta entre participantes • 
        <strong>✅ Responsivo:</strong> Vídeos otimizados para todos os dispositivos
      </p>
      <p style="color: var(--text-secondary); font-size: 9px; text-align: center; margin-top: 10px; font-style: italic;">
        O sistema usa tecnologia WebRTC para comunicação em tempo real. As chamadas são diretas entre os participantes,
        sem servidores intermediários. A qualidade se adapta automaticamente à conexão de rede.
      </p>
    </div>
    
    <div style="display: flex; justify-content: center; gap: 15px; margin-top: 25px; flex-wrap: wrap;">
      <div style="text-align: center;">
        <div style="font-size: 14px; font-weight: 600; color: var(--success-color);">✅ Auditável</div>
        <div style="font-size: 9px; color: var(--text-secondary);">Transações verificáveis</div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 14px; font-weight: 600; color: var(--primary-color);">✅ Modular</div>
        <div style="font-size: 9px; color: var(--text-secondary);">Chains independentes</div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 14px; font-weight: 600; color: var(--accent-color);">✅ Seguro</div>
        <div style="font-size: 9px; color: var(--text-secondary);">Isolamento completo</div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 14px; font-weight: 600; color: var(--sapphire);">✅ Escalável</div>
        <div style="font-size: 9px; color: var(--text-secondary);">100+ chains</div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 14px; font-weight: 600; color: var(--ruby);">✅ Real</div>
        <div style="font-size: 9px; color: var(--text-secondary);">Nada simulado</div>
      </div>
    </div>
  `;
  
  communicationTab.appendChild(explanation);
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  window.switchTab = switchTab;
  window.addSystemExplanation = addSystemExplanation;
}
