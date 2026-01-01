// ======================================================
// INFRA IDENTITY RPC - FUNÇÕES ESPECÍFICAS
// ======================================================

// Variáveis globais para Identity RPC
let currentRpcProvider = CONSTANTS.DEFAULT_RPC;
let polygonProvider = null;
let networkStatus = {
  connected: false,
  latency: 0,
  lastBlock: 0,
  gasPrice: '30'
};

let identityDynamicAuthorized = false;
let identityDynamicSessionId = null;
let identityDynamicSignature = null;

// Inicializar provider RPC
function initializeRpcProvider() {
  try {
    const savedRpc = loadFromStorage('exclusiveWalletRpc', CONSTANTS.DEFAULT_RPC);
    currentRpcProvider = savedRpc;
    
    // Verificar se é Identity Dynamic
    if (currentRpcProvider.includes('identitydynamic')) {
      if (!identityDynamicAuthorized && !loadFromStorage('identityDynamicAuth', false)) {
        showNotification('Identity Dynamic requer autorização. Usando RPC padrão.', 'warning');
        currentRpcProvider = CONSTANTS.DEFAULT_RPC;
        saveToStorage('exclusiveWalletRpc', currentRpcProvider);
      }
    }
    
    const ethers = window.ethers;
    if (!ethers) {
      throw new Error('Ethers.js não carregado');
    }
    
    polygonProvider = new ethers.JsonRpcProvider(currentRpcProvider, {
      chainId: CONSTANTS.POLYGON_CONFIG.chainId,
      name: CONSTANTS.POLYGON_CONFIG.name
    });
    
    const currentRpcUrlElement = document.getElementById('currentRpcUrl');
    const rpcProviderSelectElement = document.getElementById('rpcProviderSelect');
    
    if (currentRpcUrlElement) currentRpcUrlElement.textContent = currentRpcProvider;
    if (rpcProviderSelectElement) rpcProviderSelectElement.value = currentRpcProvider;
    
    updateRpcStatus();
    showNotification('Provider RPC Polygon inicializado', 'success');
    
    return true;
  } catch (error) {
    console.error('Erro ao inicializar RPC Provider:', error);
    showNotification('Erro ao conectar ao RPC Polygon', 'error');
    return false;
  }
}

// Testar conexão RPC
async function testRpcConnection() {
  // Se for Identity Dynamic, usar método específico
  if (currentRpcProvider.includes('identitydynamic')) {
    await testIdentityDynamicConnection();
    return;
  }
  
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
    const ethers = window.ethers;
    if (ethers) {
      networkStatus.gasPrice = Math.round(Number(ethers.formatUnits(feeData.gasPrice || '30000000000', 'gwei')));
    }
    
    updateRpcStatus();
    
    showNotification(`✅ Conexão RPC estabelecida! Latência: ${networkStatus.latency}ms`, 'success');
    
  } catch (error) {
    console.error('Erro ao testar conexão RPC:', error);
    networkStatus.connected = false;
    updateRpcStatus();
    showNotification('❌ Falha na conexão RPC', 'error');
  }
}

// Atualizar provedor RPC
function updateRpcProvider() {
  const rpcProviderSelect = document.getElementById('rpcProviderSelect');
  if (!rpcProviderSelect) return;
  
  const newRpc = rpcProviderSelect.value;
  
  if (!newRpc) {
    showNotification('Selecione um provedor RPC', 'error');
    return;
  }
  
  // Verificar se é Identity Dynamic e se está autorizado
  if (newRpc.includes('identitydynamic') && !identityDynamicAuthorized && !loadFromStorage('identityDynamicAuth', false)) {
    showNotification('Autorize o Identity Dynamic antes de usar', 'warning');
    showIdentityAuthorizationInfo();
    return;
  }
  
  currentRpcProvider = newRpc;
  saveToStorage('exclusiveWalletRpc', newRpc);
  
  showNotification('Atualizando provedor RPC...', 'info');
  
  if (initializeRpcProvider()) {
    testRpcConnection();
  }
}

// Atualizar status do RPC na interface
function updateRpcStatus() {
  const statusElement = document.getElementById('rpcStatus');
  const latencyElement = document.getElementById('rpcLatency');
  const lastBlockElement = document.getElementById('lastBlock');
  const gasPriceElement = document.getElementById('gasPriceDisplay');
  const connectionStatus = document.getElementById('connectionStatus');
  
  if (networkStatus.connected) {
    if (statusElement) {
      statusElement.innerHTML = '<i class="fas fa-check-circle"></i> Conectado';
      statusElement.style.color = 'var(--success-color)';
    }
    if (connectionStatus) {
      connectionStatus.textContent = `LATÊNCIA: ${networkStatus.latency}ms`;
    }
  } else {
    if (statusElement) {
      statusElement.innerHTML = '<i class="fas fa-times-circle"></i> Desconectado';
      statusElement.style.color = 'var(--error-color)';
    }
    if (connectionStatus) {
      connectionStatus.textContent = 'LATÊNCIA: --';
    }
  }
  
  if (latencyElement) latencyElement.textContent = `${networkStatus.latency}ms`;
  if (lastBlockElement) lastBlockElement.textContent = networkStatus.lastBlock.toLocaleString();
  if (gasPriceElement) gasPriceElement.textContent = `${networkStatus.gasPrice} GWEI`;
}

// Mostrar informações de autorização Identity
function showIdentityAuthorizationInfo() {
  if (!window.currentWallet) {
    showNotification('Conecte uma wallet Polygon primeiro', 'error');
    return;
  }

  const modal = document.getElementById('identityAuthModal');
  const walletPreview = document.getElementById('identityWalletAddressPreview');
  const sessionPreview = document.getElementById('identitySessionPreview');
  const timestampPreview = document.getElementById('identityTimestampPreview');

  const timestamp = Math.floor(Date.now() / 1000);
  const ethers = window.ethers;
  if (!ethers) {
    showNotification('Ethers.js não carregado', 'error');
    return;
  }
  
  const sessionId = ethers.id(window.currentWallet.address + timestamp).substring(0, 20);

  if (walletPreview) walletPreview.textContent = formatAddress(window.currentWallet.address);
  if (sessionPreview) sessionPreview.textContent = sessionId;
  if (timestampPreview) timestampPreview.textContent = timestamp;

  const identityAuthResult = document.getElementById('identityAuthResult');
  const identityAuthorizeBtn = document.getElementById('identityAuthorizeBtn');
  
  if (identityAuthResult) identityAuthResult.style.display = 'none';
  if (identityAuthorizeBtn) {
    identityAuthorizeBtn.disabled = false;
    identityAuthorizeBtn.innerHTML = '<i class="fas fa-key"></i> Autorizar Identity Dynamic';
  }

  if (modal) modal.classList.add('active');
}

// Fechar modal de autorização Identity
function closeIdentityAuthModal() {
  const modal = document.getElementById('identityAuthModal');
  if (modal) modal.classList.remove('active');
}

// Realizar autorização Identity Dynamic
async function performIdentityDynamicAuth() {
  if (!window.currentWallet) {
    showNotification('Wallet não conectada', 'error');
    return;
  }

  try {
    const btn = document.getElementById('identityAuthorizeBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Autorizando...';
    }

    // 1. Dados base
    const walletAddress = window.currentWallet.address.toLowerCase();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const ethers = window.ethers;
    if (!ethers) {
      throw new Error('Ethers.js não carregado');
    }

    // 2. Session ID
    identityDynamicSessionId = ethers.id(walletAddress + timestamp).substring(0, 32);

    // 3. Mensagem Identity (EXATA conforme especificado)
    const message = [
      "IDENTITY_DYNAMIC_ACCESS",
      `wallet:${walletAddress}`,
      `session:${identityDynamicSessionId}`,
      `issued_at:${timestamp}`,
      "chain:polygon",
      "scope:rpc"
    ].join("\n");

    // 4. Assinatura
    identityDynamicSignature = await window.currentWallet.signMessage(message);
    
    // 5. Após autorizar, mudar o RPC para Identity Dynamic
    currentRpcProvider = CONSTANTS.IDENTITY_DYNAMIC_RPC;
    saveToStorage('exclusiveWalletRpc', currentRpcProvider);

    // Atualizar o select na aba Infra Identity
    const rpcProviderSelect = document.getElementById('rpcProviderSelect');
    if (rpcProviderSelect) rpcProviderSelect.value = currentRpcProvider;

    // Re-inicializar o provider
    initializeRpcProvider();
    
    // 6. Mostrar resultado
    const authResult = document.getElementById('identityAuthResult');
    const resultText = document.getElementById('identityAuthResultText');
    const signaturePreview = document.getElementById('identitySignaturePreview');

    if (authResult) authResult.style.display = 'block';
    if (resultText) resultText.textContent = 'Autorização Identity Dynamic bem-sucedida!';
    if (signaturePreview) signaturePreview.textContent = `Assinatura: ${identityDynamicSignature.substring(0, 40)}...`;

    identityDynamicAuthorized = true;
    saveToStorage('identityDynamicAuth', true);
    saveToStorage('identityDynamicSession', identityDynamicSessionId);
    saveToStorage('identityDynamicSignature', identityDynamicSignature);

    showNotification('✅ Autorização Identity Dynamic realizada com sucesso!', 'success');

    // Habilitar o botão novamente
    setTimeout(() => {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-key"></i> Autorização Concluída';
      }
    }, 2000);

  } catch (error) {
    console.error('Erro na autorização Identity Dynamic:', error);
    showNotification('Erro na autorização Identity: ' + error.message, 'error');
    
    const btn = document.getElementById('identityAuthorizeBtn');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-key"></i> Tentar Novamente';
    }
  }
}

// Testar conexão Identity Dynamic
async function testIdentityDynamicConnection() {
  if (!window.currentWallet) {
    showNotification('Conecte uma wallet Polygon primeiro', 'error');
    return;
  }

  if (!identityDynamicAuthorized && !loadFromStorage('identityDynamicAuth', false)) {
    showNotification('Autorize primeiro o Identity Dynamic', 'error');
    showIdentityAuthorizationInfo();
    return;
  }

  showNotification('Testando conexão Identity Dynamic...', 'info');

  try {
    // Usar dados salvos ou gerar novos
    const walletAddress = window.currentWallet.address.toLowerCase();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const ethers = window.ethers;
    if (!ethers) {
      throw new Error('Ethers.js não carregado');
    }
    
    const sessionId = identityDynamicSessionId || loadFromStorage('identityDynamicSession') || ethers.id(walletAddress + timestamp).substring(0, 32);
    const signature = identityDynamicSignature || loadFromStorage('identityDynamicSignature');

    if (!signature) {
      showNotification('Reautorize o Identity Dynamic', 'error');
      showIdentityAuthorizationInfo();
      return;
    }

    // Chamada RPC via Identity Dynamic
    const response = await fetch(
      CONSTANTS.IDENTITY_DYNAMIC_RPC,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-identity-wallet": walletAddress,
          "x-identity-timestamp": timestamp,
          "x-identity-session": sessionId,
          "x-identity-signature": signature
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1
        })
      }
    );

    const data = await response.json();

    if (data.result) {
      const blockNumber = parseInt(data.result, 16);
      networkStatus.lastBlock = blockNumber;
      networkStatus.connected = true;
      updateRpcStatus();
      
      showNotification(`✅ Identity Dynamic conectado! Bloco: ${blockNumber.toLocaleString()}`, 'success');
    } else if (data.error) {
      showNotification(`Identity Dynamic: ${data.error.message}`, 'error');
    }

  } catch (error) {
    console.error('Erro ao testar Identity Dynamic:', error);
    showNotification('Falha na conexão Identity Dynamic', 'error');
  }
}

// Chamada RPC via Identity Dynamic
async function callIdentityDynamicRPC(method, params = []) {
  if (!window.currentWallet || !identityDynamicAuthorized) {
    throw new Error('Wallet não autorizada para Identity Dynamic');
  }

  const walletAddress = window.currentWallet.address.toLowerCase();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const sessionId = identityDynamicSessionId;

  const response = await fetch(
    CONSTANTS.IDENTITY_DYNAMIC_RPC,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-identity-wallet": walletAddress,
        "x-identity-timestamp": timestamp,
        "x-identity-session": sessionId,
        "x-identity-signature": identityDynamicSignature
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: method,
        params: params,
        id: 1
      })
    }
  );

  return await response.json();
}

// Testar conexão com a rede
async function testNetworkConnection() {
  return testRpcConnection();
}

// Atualizar status da rede
function refreshNetworkStatus() {
  testRpcConnection();
}

// Mostrar informações do RPC
function showRpcInfo() {
  showNotification('Informações do RPC: ' + currentRpcProvider, 'info');
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  window.identityRpc = {
    currentRpcProvider,
    polygonProvider,
    networkStatus,
    identityDynamicAuthorized,
    identityDynamicSessionId,
    identityDynamicSignature,
    initializeRpcProvider,
    testRpcConnection,
    updateRpcProvider,
    updateRpcStatus,
    showIdentityAuthorizationInfo,
    closeIdentityAuthModal,
    performIdentityDynamicAuth,
    testIdentityDynamicConnection,
    callIdentityDynamicRPC,
    testNetworkConnection,
    refreshNetworkStatus,
    showRpcInfo
  };
  
  // Exportar funções individualmente para compatibilidade
  window.initializeRpcProvider = initializeRpcProvider;
  window.testRpcConnection = testRpcConnection;
  window.updateRpcProvider = updateRpcProvider;
  window.updateRpcStatus = updateRpcStatus;
  window.showIdentityAuthorizationInfo = showIdentityAuthorizationInfo;
  window.closeIdentityAuthModal = closeIdentityAuthModal;
  window.performIdentityDynamicAuth = performIdentityDynamicAuth;
  window.testIdentityDynamicConnection = testIdentityDynamicConnection;
  window.refreshNetworkStatus = refreshNetworkStatus;
  window.showRpcInfo = showRpcInfo;
}
