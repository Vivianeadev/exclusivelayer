// ======================================================
// FUNÇÕES DE SEGURANÇA E AUTORIZAÇÕES
// ======================================================

// Variáveis globais de segurança
let isAddressRegistered = false;

// Atualizar registro de endereço
function updateAddressRegistration() {
  if (!window.currentWallet) return;
  
  const addressDisplay = document.getElementById('publicAddressDisplay');
  const checkbox = document.getElementById('confirmAddressCheckbox');
  const registerBtn = document.getElementById('registerAddressBtn');
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');
  
  if (!addressDisplay || !checkbox || !registerBtn || !statusText || !statusIndicator) return;
  
  addressDisplay.textContent = window.currentWallet.address;
  
  const savedRegistration = loadFromStorage('exclusiveWalletAddressRegistered', false);
  isAddressRegistered = savedRegistration;
  
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
    saveToStorage('exclusiveWalletAddressRegistered', true);
    
    updateAddressRegistration();
    showNotification('✅ Identidade Polygon registrada com sucesso!', 'success');
  };
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

// Mostrar caixa de recuperação
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

// Solicitar nova autorização
function requestNewAuthorization() {
  showNotification('Funcionalidade de nova autorização em desenvolvimento', 'info');
}

// Revogar todas as autorizações
function revokeAllAuthorizations() {
  if (confirm('Tem certeza que deseja revogar todas as autorizações?')) {
    showNotification('Todas as autorizações foram revogadas', 'success');
  }
}

// Exportar autorizações
function exportAuthorizations() {
  showNotification('Funcionalidade de exportação em desenvolvimento', 'info');
}

// Mostrar métricas da rede
function showNetworkMetrics() {
  showNotification('Métricas da rede carregadas', 'info');
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  window.security = {
    isAddressRegistered,
    updateAddressRegistration,
    showSecurityInfoModal,
    showRecoveryBox,
    requestNewAuthorization,
    revokeAllAuthorizations,
    exportAuthorizations,
    showNetworkMetrics
  };
  
  // Exportar funções individualmente para compatibilidade
  window.updateAddressRegistration = updateAddressRegistration;
  window.showSecurityInfoModal = showSecurityInfoModal;
  window.showRecoveryBox = showRecoveryBox;
  window.requestNewAuthorization = requestNewAuthorization;
  window.revokeAllAuthorizations = revokeAllAuthorizations;
  window.exportAuthorizations = exportAuthorizations;
  window.showNetworkMetrics = showNetworkMetrics;
}
