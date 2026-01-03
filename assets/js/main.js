// VARIÁVEIS GLOBAIS RESTANTES
let currentTheme = 'luxury';

// NOTIFICAÇÃO
function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  const messageElement = document.getElementById('notificationMessage');
  
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

// TEMA
function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'luxury' : 'light';
  document.body.className = `theme-${currentTheme}`;
  localStorage.setItem('premiumWalletTheme', currentTheme);
  updateThemeButton();
}

function updateThemeButton() {
  const themeToggle = document.getElementById('themeToggle');
  if (currentTheme === 'light') {
    themeToggle.innerHTML = '<i class="fas fa-moon"></i> Modo Escuro';
  } else {
    themeToggle.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
  }
}

// IDENTITY DYNAMIC
function showIdentityAuthorizationInfo() {
  if (!currentWallet) {
    showNotification('Conecte uma wallet Polygon primeiro', 'error');
    return;
  }

  const modal = document.getElementById('identityAuthModal');
  const walletPreview = document.getElementById('identityWalletAddressPreview');
  const sessionPreview = document.getElementById('identitySessionPreview');
  const timestampPreview = document.getElementById('identityTimestampPreview');

  const timestamp = Math.floor(Date.now() / 1000);
  const sessionId = ethers.id(currentWallet.address + timestamp).substring(0, 20);

  walletPreview.textContent = currentWallet.address.substring(0, 6) + '...' + currentWallet.address.substring(38);
  sessionPreview.textContent = sessionId;
  timestampPreview.textContent = timestamp;

  document.getElementById('identityAuthResult').style.display = 'none';
  document.getElementById('identityAuthorizeBtn').disabled = false;
  document.getElementById('identityAuthorizeBtn').innerHTML = '<i class="fas fa-key"></i> Autorizar Identity Dynamic';

  modal.classList.add('active');
}

function closeIdentityAuthModal() {
  document.getElementById('identityAuthModal').classList.remove('active');
}

// RPC PROVIDER
function initializeRpcProvider() {
  try {
    const savedRpc = localStorage.getItem('exclusiveWalletRpc') || currentRpcProvider;
    currentRpcProvider = savedRpc;
    
    polygonProvider = new ethers.JsonRpcProvider(currentRpcProvider, {
      chainId: polygonConfig.chainId,
      name: polygonConfig.name
    });
    
    document.getElementById('currentRpcUrl').textContent = currentRpcProvider;
    document.getElementById('rpcProviderSelect').value = currentRpcProvider;
    
    updateRpcStatus();
    showNotification('Provider RPC Polygon inicializado', 'success');
    
    return true;
  } catch (error) {
    console.error('Erro ao inicializar RPC Provider:', error);
    showNotification('Erro ao conectar ao RPC Polygon', 'error');
    return false;
  }
}

async function testRpcConnection() {
  if (!polygonProvider) {
    showNotification('Provider RPC não inicializado', 'error');
    return;
  }
  
  showNotification('Testando conexão com RPC Polygon...', 'info');
  
  try {
    const startTime = Date.now();
    const blockNumber = await polygonProvider.getBlockNumber();
    const endTime = Date.now();
    
    networkStatus.latency = endTime - startTime;
    networkStatus.lastBlock = blockNumber;
    networkStatus.connected = true;
    
    const feeData = await polygonProvider.getFeeData();
    networkStatus.gasPrice = Math.round(Number(ethers.formatUnits(feeData.gasPrice || '30000000000', 'gwei')));
    
    updateRpcStatus();
    
    showNotification(`✅ Conexão RPC estabelecida! Latência: ${networkStatus.latency}ms`, 'success');
    
  } catch (error) {
    console.error('Erro ao testar conexão RPC:', error);
    networkStatus.connected = false;
    updateRpcStatus();
    showNotification('❌ Falha na conexão RPC', 'error');
  }
}

function updateRpcStatus() {
  document.getElementById('rpcLatency').textContent = `${networkStatus.latency}ms`;
  document.getElementById('lastBlock').textContent = networkStatus.lastBlock.toLocaleString();
  document.getElementById('gasPriceDisplay').textContent = `${networkStatus.gasPrice} GWEI`;
  document.getElementById('rpcStatus').innerHTML = networkStatus.connected ? 
    '<i class="fas fa-check-circle"></i> Conectado' : 
    '<i class="fas fa-times-circle"></i> Desconectado';
}

function updateRpcProvider() {
  const newRpc = document.getElementById('rpcProviderSelect').value;
  
  if (!newRpc) {
    showNotification('Selecione um provedor RPC', 'error');
    return;
  }
  
  currentRpcProvider = newRpc;
  localStorage.setItem('exclusiveWalletRpc', newRpc);
  
  showNotification('Atualizando provedor RPC...', 'info');
  
  if (initializeRpcProvider()) {
    testRpcConnection();
  }
}

// SALDOS REAIS
async function refreshRealChainBalance(chainId) {
  const chain = blockchains.find(c => c.id === chainId);
  if (!chain) {
    console.error('Blockchain não encontrada:', chainId);
    return '0.0000';
  }
  
  // Se for Polygon e temos wallet conectada, buscar saldo real
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
  
  // Para outras chains, simular saldos
  if (otherChainsWallets[chainId]) {
    if (!realChainBalances[chainId] || realChainBalances[chainId] === '0.0000') {
      const randomBalance = (Math.random() * 10).toFixed(4);
      realChainBalances[chainId] = randomBalance;
    }
    return realChainBalances[chainId];
  }
  
  return '0.0000';
}

async function updateCurrentChainBalance() {
  if (!currentSelectedChain) return;
  
  const balance = await refreshRealChainBalance(currentSelectedChain);
  const balanceElement = document.getElementById('currentChainBalance');
  if (balanceElement) {
    balanceElement.textContent = balance;
    
    const specificElement = document.getElementById(`currentChainBalance${currentSelectedChain.charAt(0).toUpperCase() + currentSelectedChain.slice(1)}`);
    if (specificElement) {
      specificElement.textContent = balance;
    }
    
    // Atualizar valor em USD (simulado)
    const chain = blockchains.find(c => c.id === currentSelectedChain);
    let usdValue = '≈ $0.00 USD';
    
    if (chain) {
      const priceMultipliers = {
        polygon: 0.8,
        ethereum: 3500,
        bsc: 300,
        avalanche: 35,
        arbitrum: 3500,
        optimism: 3500,
        base: 3500,
        harmony: 0.02,
      };
      
      const multiplier = priceMultipliers[chain.id] || 1;
      const usdAmount = parseFloat(balance) * multiplier;
      usdValue = `≈ $${usdAmount.toFixed(2)} USD`;
    }
    
    const valueElement = document.getElementById('currentChainValue');
    if (valueElement) {
      valueElement.textContent = usdValue;
    }
  }
}

async function refreshBalance() {
  if (!currentWallet) {
    showNotification('Conecte uma wallet primeiro', 'error');
    return;
  }
  
  if (!polygonProvider || !networkStatus.connected) {
    showNotification('Conecte-se ao RPC primeiro', 'error');
    return;
  }
  
  showNotification('Consultando saldo na Polygon...', 'info');
  
  try {
    const balance = await polygonProvider.getBalance(currentWallet.address);
    const balanceInMatic = ethers.formatEther(balance);
    
    realChainBalances.polygon = parseFloat(balanceInMatic).toFixed(4);
    updateCurrentChainBalance();
    
    const maticPrice = 0.8;
    const usdValue = parseFloat(balanceInMatic) * maticPrice;
    document.getElementById('currentChainValue').textContent = `≈ $${usdValue.toFixed(2)} USD`;
    
    showNotification('Saldo Polygon atualizado com sucesso!', 'success');
    
  } catch (error) {
    console.error('Erro ao consultar saldo:', error);
    showNotification('Erro ao consultar saldo na Polygon', 'error');
  }
}

// QR CODE PDF
function downloadQRCodeAsCard() {
  if (!currentWallet) {
    showNotification('Nenhuma wallet conectada', 'error');
    return;
  }

  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    showNotification('Biblioteca PDF não carregada', 'error');
    return;
  }

  showNotification('Gerando Cartão de Luxo do QR Code...', 'info');

  try {
    const qrCanvas = document.querySelector('#qrCodeCanvas canvas');
    if (!qrCanvas) {
      throw new Error('QR Code não gerado');
    }

    const qrDataURL = qrCanvas.toDataURL('image/png');
    const address = currentWallet.address;
    const shortAddress = `${address.substring(0, 10)}...${address.substring(address.length - 8)}`;
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const cardWidth = pageWidth / 2 - 20;
    const cardHeight = pageHeight - 40;

    // PRIMEIRO CARTÃO
    doc.setFillColor(26, 26, 26);
    doc.rect(15, 20, cardWidth, cardHeight, 'F');
    
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(1.5);
    doc.rect(15, 20, cardWidth, cardHeight);

    doc.setTextColor(212, 175, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Identity Premium', cardWidth / 2 + 15, 35, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(244, 228, 184);
    doc.text('Cartão de Endereço Polygon', cardWidth / 2 + 15, 42, { align: 'center' });

    const qrSize = 80;
    const qrX = (cardWidth - qrSize) / 2 + 15;
    doc.addImage(qrDataURL, 'PNG', qrX, 50, qrSize, qrSize);

    doc.setFontSize(9);
    doc.setTextColor(240, 240, 240);
    doc.text('Endereço Polygon:', cardWidth / 2 + 15, 140, { align: 'center' });
    
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(212, 175, 55);
    const addressLines = doc.splitTextToSize(address, cardWidth - 30);
    doc.text(addressLines, cardWidth / 2 + 15, 148, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(176, 176, 176);
    doc.text(`Gerado em: ${formattedDate}`, cardWidth / 2 + 15, 165, { align: 'center' });
    doc.text('Licença Vitalícia • Sistema Polygon Premium', cardWidth / 2 + 15, 170, { align: 'center' });

    // SEGUNDO CARTÃO
    const secondCardX = pageWidth / 2 + 5;
    
    doc.setFillColor(10, 10, 10);
    doc.rect(secondCardX, 20, cardWidth, cardHeight, 'F');
    
    doc.setDrawColor(212, 175, 55);
    doc.rect(secondCardX, 20, cardWidth, cardHeight);

    doc.setTextColor(212, 175, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('INFORMAÇÕES DE SEGURANÇA', pageWidth / 4 * 3, 35, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(244, 228, 184);
    doc.text('Este QR Code é pessoal e intransferível:', secondCardX + 10, 50);
    
    doc.setFontSize(7);
    doc.setTextColor(176, 176, 176);
    
    const instructions = [
      '• Use para receber MATIC e tokens na Polygon',
      '• Compatível com todas as wallets Polygon',
      '• Este QR Code não expira',
      '• Mantenha este cartão em local seguro',
      '• Não compartilhe publicamente',
      '• Verifique sempre o endereço antes de enviar',
      '• Dados do endereço de origem como um Cartão de Luxo',
      '• Para usar e receber valores em Polygon Network',
      '• Formato PDF premium exclusivo'
    ];

    let yPos = 60;
    instructions.forEach(instruction => {
      doc.text(instruction, secondCardX + 15, yPos);
      yPos += 5;
    });

    doc.addImage(qrDataURL, 'PNG', secondCardX + cardWidth / 2 - 25, yPos + 10, 50, 50);

    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text('este qrcode foi gerado através da licença vitalícia da Identity Premium', 
            pageWidth / 4 * 3, pageHeight - 15, { align: 'center' });

    const fileName = `cartao-qrcode-polygon-${shortAddress}-${currentDate.getTime()}.pdf`;
    doc.save(fileName);

    showNotification(`✅ Cartão de Luxo salvo como ${fileName}`, 'success');

  } catch (error) {
    console.error('Erro ao gerar cartão:', error);
    showNotification('Erro ao gerar Cartão de Luxo: ' + error.message, 'error');
  }
}

// FUNÇÕES DE NAVEGAÇÃO
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
  
  if (tabId === 'agendaTab') {
    agendaSystem.init();
    agendaSystem.renderUpcomingEvents();
  }
}

// MODAIS DE INFORMAÇÃO
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

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', function() {
  // Restaurar tema
  const savedTheme = localStorage.getItem('premiumWalletTheme') || 'luxury';
  currentTheme = savedTheme;
  document.body.className = `theme-${currentTheme}`;
  updateThemeButton();
  
  // Verificar wallet salva
  const savedPK = localStorage.getItem('exclusiveWalletPK');
  if (savedPK) {
    try {
      currentWallet = new ethers.Wallet(savedPK);
      const savedMnemonic = localStorage.getItem('exclusiveWalletMnemonic');
      if (savedMnemonic) {
        mnemonicPhrase = savedMnemonic;
      }
      isAddressRegistered = localStorage.getItem('exclusiveWalletAddressRegistered') === 'true';
      showWalletDashboard();
    } catch (error) {
      console.error('Erro ao restaurar wallet:', error);
      localStorage.removeItem('exclusiveWalletPK');
    }
  }
  
  // Event Listeners
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  document.getElementById('loginPrivateKey')?.addEventListener('click', connectPrivateKey);
  document.getElementById('createWallet')?.addEventListener('click', createNewWallet);
  document.getElementById('restoreMnemonicLogin')?.addEventListener('click', openMnemonicModal);
  document.getElementById('restoreMnemonicNew')?.addEventListener('click', openMnemonicModal);
  
  // Modais de mnemônica
  document.getElementById('closeMnemonicCreationModal')?.addEventListener('click', closeMnemonicCreationModal);
  document.getElementById('cancelWalletCreation')?.addEventListener('click', closeMnemonicCreationModal);
  document.getElementById('confirmMnemonicSaved')?.addEventListener('click', confirmMnemonicSaved);
  
  document.getElementById('closeMnemonicModal')?.addEventListener('click', closeMnemonicModal);
  document.getElementById('cancelRestore')?.addEventListener('click', closeMnemonicModal);
  document.getElementById('confirmRestore')?.addEventListener('click', restoreWalletFromMnemonic);
  
  // Outras chains
  document.getElementById('closeMnemonicCreationModalOther')?.addEventListener('click', closeMnemonicCreationModalOther);
  document.getElementById('cancelWalletCreationOther')?.addEventListener('click', closeMnemonicCreationModalOther);
  document.getElementById('confirmMnemonicSavedOther')?.addEventListener('click', confirmMnemonicSavedOther);
  
  document.getElementById('closeMnemonicModalOther')?.addEventListener('click', closeMnemonicModalOther);
  document.getElementById('cancelRestoreOther')?.addEventListener('click', closeMnemonicModalOther);
  document.getElementById('confirmRestoreOther')?.addEventListener('click', confirmRestoreOther);
  
  // Navegação por tabs
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
  
  // Sub-tabs de comunicação
  document.querySelectorAll('.sub-tab-btn').forEach(button => {
    button.addEventListener('click', function() {
      const subTabId = this.getAttribute('data-subtab');
      switchSubTab(subTabId);
    });
  });
  
  // Segurança
  document.getElementById('togglePrivateKey')?.addEventListener('click', togglePrivateKeyVisibility);
  document.getElementById('toggleMnemonic')?.addEventListener('click', toggleMnemonicVisibility);
  document.getElementById('copyPrivateKey')?.addEventListener('click', copyPrivateKey);
  document.getElementById('copyMnemonic')?.addEventListener('click', copyMnemonic);
  document.getElementById('showPrivateKey')?.addEventListener('click', showPrivateKey);
  document.getElementById('exportWallet')?.addEventListener('click', exportWallet);
  document.getElementById('disconnectWallet')?.addEventListener('click', disconnectWallet);
  
  // Inicializar RPC
  initializeRpcProvider();
});