// SECURITY FUNCTIONS
function updateSensitiveDataDisplay() {
  if (!currentWallet) return;
  
  document.getElementById('privateKeyDisplay').textContent = privateKeyVisible ? 
    currentWallet.privateKey : '••••••••••••••••••••••••••••••••••••••••••••••';
  
  document.getElementById('mnemonicDisplay').textContent = mnemonicVisible && mnemonicPhrase ? 
    mnemonicPhrase : '••••••••••••••••••••••••••••••••••••••••••••••';
  
  document.getElementById('togglePrivateKey').innerHTML = `<i class="fas fa-${privateKeyVisible ? 'eye-slash' : 'eye'}"></i> ${privateKeyVisible ? 'Ocultar' : 'Mostrar'} Chave`;
  document.getElementById('toggleMnemonic').innerHTML = `<i class="fas fa-${mnemonicVisible ? 'eye-slash' : 'eye'}"></i> ${mnemonicVisible ? 'Ocultar' : 'Mostrar'} Frase`;
}

function togglePrivateKeyVisibility() {
  if (!currentWallet) return;
  
  privateKeyVisible = !privateKeyVisible;
  updateSensitiveDataDisplay();
  showNotification(privateKeyVisible ? 'Chave privada Polygon visível' : 'Chave privada Polygon ocultada', 'info');
}

function toggleMnemonicVisibility() {
  if (!mnemonicPhrase) {
    showNotification('Nenhuma frase mnemônica disponível para esta identidade', 'error');
    return;
  }
  
  mnemonicVisible = !mnemonicVisible;
  updateSensitiveDataDisplay();
  showNotification(mnemonicVisible ? 'Frase mnemônica visível' : 'Frase mnemônica ocultada', 'info');
}

function copyPrivateKey() {
  if (!currentWallet) return;
  
  navigator.clipboard.writeText(currentWallet.privateKey)
    .then(() => showNotification('Chave privada Polygon copiada!', 'success'))
    .catch(() => showNotification('Erro ao copiar chave privada', 'error'));
}

function copyMnemonic() {
  if (!mnemonicPhrase) {
    showNotification('Nenhuma frase mnemônica disponível', 'error');
    return;
  }
  
  navigator.clipboard.writeText(mnemonicPhrase)
    .then(() => showNotification('Frase mnemônica copiada!', 'success'))
    .catch(() => showNotification('Erro ao copiar frase mnemônica', 'error'));
}

function showPrivateKey() {
  if (!currentWallet) return;
  
  if (confirm('⚠️ ATENÇÃO: A chave privada dá acesso total aos seus fundos na Polygon. Tem certeza que deseja visualizar?')) {
    alert(`SUA CHAVE PRIVADA POLYGON:\n\n${currentWallet.privateKey}\n\n⚠️ NUNCA COMPARTILHE ESTA INFORMAÇÃO!`);
  }
}

function exportWallet() {
  if (!currentWallet) return;
  
  const walletData = {
    address: currentWallet.address,
    privateKey: currentWallet.privateKey,
    mnemonic: mnemonicPhrase,
    chain: 'Polygon',
    rpc: currentRpcProvider,
    exportDate: new Date().toISOString()
  };
  
  const dataStr = JSON.stringify(walletData, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `polygon-identity-${currentWallet.address.slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showNotification('Identidade Polygon exportada com sucesso!', 'success');
}

function disconnectWallet() {
  if (confirm('Encerrar sessão premium da Polygon?')) {
    currentWallet = null;
    mnemonicPhrase = null;
    isAddressRegistered = false;
    networkStatus.connected = false;
    identityDynamicAuthorized = false;
    identityDynamicSessionId = null;
    identityDynamicSignature = null;
    
    localStorage.removeItem('exclusiveWalletPK');
    localStorage.removeItem('exclusiveWalletAddressRegistered');
    localStorage.removeItem('identityDynamicAuth');
    localStorage.removeItem('identityDynamicSession');
    localStorage.removeItem('identityDynamicSignature');
    
    document.getElementById('wallet-dashboard').classList.add('fade-out');
    
    setTimeout(() => {
      document.getElementById('wallet-dashboard').classList.add('hidden');
      document.getElementById('login-screen').classList.remove('hidden');
      document.getElementById('login-screen').classList.remove('fade-out');
      document.getElementById('login-screen').classList.add('fade-in');
      
      document.getElementById('privateKey').value = '';
      document.getElementById('newWalletPassword').value = '';
      
      showNotification('Sessão Polygon premium encerrada.', 'info');
    }, 800);
  }
}

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

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('togglePrivateKey').addEventListener('click', togglePrivateKeyVisibility);
  document.getElementById('toggleMnemonic').addEventListener('click', toggleMnemonicVisibility);
  document.getElementById('copyPrivateKey').addEventListener('click', copyPrivateKey);
  document.getElementById('copyMnemonic').addEventListener('click', copyMnemonic);
  document.getElementById('showPrivateKey').addEventListener('click', showPrivateKey);
  document.getElementById('exportWallet').addEventListener('click', exportWallet);
  document.getElementById('disconnectWallet').addEventListener('click', disconnectWallet);
});
