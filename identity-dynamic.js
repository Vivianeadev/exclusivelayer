// ======================================================
// IDENTITY DYNAMIC - RPC INFRAESTRUTURA COM WEBRTC
// ======================================================

// VARIÁVEIS GLOBAIS IDENTITY DYNAMIC
let identityDynamicAuthorized = false;
let identityDynamicSessionId = null;
let identityDynamicSignature = null;
let identityDynamicConnection = null;

// CONFIGURAÇÃO IDENTITY DYNAMIC
const IDENTITY_DYNAMIC_CONFIG = {
  rpcUrl: 'https://identitydynamic.avizaecosystem.workers.dev',
  authRequired: true,
  sessionTimeout: 3600, // 1 hora
  reconnectAttempts: 3
};

// ======================================================
// AUTORIZAÇÃO IDENTITY DYNAMIC
// ======================================================

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

  const authResult = document.getElementById('identityAuthResult');
  const authorizeBtn = document.getElementById('identityAuthorizeBtn');

  if (authResult) authResult.style.display = 'none';
  if (authorizeBtn) {
    authorizeBtn.disabled = false;
    authorizeBtn.innerHTML = '<i class="fas fa-key"></i> Autorizar Identity Dynamic';
  }

  if (modal) modal.classList.add('active');
}

function closeIdentityAuthModal() {
  const modal = document.getElementById('identityAuthModal');
  if (modal) modal.classList.remove('active');
}

async function performIdentityDynamicAuth() {
  if (!currentWallet) {
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
    const walletAddress = currentWallet.address.toLowerCase();
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // 2. Session ID
    identityDynamicSessionId = ethers.id(walletAddress + timestamp).substring(0, 32);

    // 3. Mensagem Identity (formato exato)
    const message = [
      "IDENTITY_DYNAMIC_ACCESS",
      `wallet:${walletAddress}`,
      `session:${identityDynamicSessionId}`,
      `issued_at:${timestamp}`,
      "chain:polygon",
      "scope:rpc"
    ].join("\n");

    // 4. Assinatura
    identityDynamicSignature = await currentWallet.signMessage(message);
    
    // 5. Atualizar RPC para Identity Dynamic
    currentRpcProvider = IDENTITY_DYNAMIC_CONFIG.rpcUrl;
    localStorage.setItem('exclusiveWalletRpc', currentRpcProvider);

    // Atualizar select
    const rpcSelect = document.getElementById('rpcProviderSelect');
    if (rpcSelect) rpcSelect.value = currentRpcProvider;

    // Re-inicializar provider
    if (typeof initializeRpcProvider === 'function') {
      initializeRpcProvider();
    }
    
    // 6. Mostrar resultado
    const authResult = document.getElementById('identityAuthResult');
    const resultText = document.getElementById('identityAuthResultText');
    const signaturePreview = document.getElementById('identitySignaturePreview');

    if (authResult) authResult.style.display = 'block';
    if (resultText) resultText.textContent = 'Autorização Identity Dynamic bem-sucedida!';
    if (signaturePreview) signaturePreview.textContent = `Assinatura: ${identityDynamicSignature.substring(0, 40)}...`;

    identityDynamicAuthorized = true;
    localStorage.setItem('identityDynamicAuth', 'true');
    localStorage.setItem('identityDynamicSession', identityDynamicSessionId);
    localStorage.setItem('identityDynamicSignature', identityDynamicSignature);

    showNotification('✅ Autorização Identity Dynamic realizada!', 'success');

    // Habilitar o botão novamente
    setTimeout(() => {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-key"></i> Autorização Concluída';
      }
    }, 2000);

  } catch (error) {
    console.error('Erro na autorização Identity Dynamic:', error);
    showNotification('Erro na autorização: ' + error.message, 'error');
    
    const btn = document.getElementById('identityAuthorizeBtn');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-key"></i> Tentar Novamente';
    }
  }
}

// ======================================================
// CONEXÃO IDENTITY DYNAMIC RPC
// ======================================================

async function testIdentityDynamicConnection() {
  if (!currentWallet) {
    showNotification('Conecte uma wallet Polygon primeiro', 'error');
    return;
  }

  if (!identityDynamicAuthorized && !localStorage.getItem('identityDynamicAuth')) {
    showNotification('Autorize primeiro o Identity Dynamic', 'error');
    showIdentityAuthorizationInfo();
    return;
  }

  showNotification('Testando conexão Identity Dynamic...', 'info');

  try {
    // Usar dados salvos
    const walletAddress = currentWallet.address.toLowerCase();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const sessionId = identityDynamicSessionId || localStorage.getItem('identityDynamicSession') || ethers.id(walletAddress + timestamp).substring(0, 32);
    const signature = identityDynamicSignature || localStorage.getItem('identityDynamicSignature');

    if (!signature) {
      showNotification('Reautorize o Identity Dynamic', 'error');
      showIdentityAuthorizationInfo();
      return;
    }

    // Chamada RPC via Identity Dynamic
    const response = await fetch(
      IDENTITY_DYNAMIC_CONFIG.rpcUrl,
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
      
      if (typeof updateRpcStatus === 'function') {
        updateRpcStatus();
      }
      
      showNotification(`✅ Identity Dynamic conectado! Bloco: ${blockNumber.toLocaleString()}`, 'success');
    } else if (data.error) {
      showNotification(`Identity Dynamic: ${data.error.message}`, 'error');
    }

  } catch (error) {
    console.error('Erro ao testar Identity Dynamic:', error);
    showNotification('Falha na conexão Identity Dynamic', 'error');
  }
}

async function callIdentityDynamicRPC(method, params = []) {
  if (!currentWallet || !identityDynamicAuthorized) {
    throw new Error('Wallet não autorizada para Identity Dynamic');
  }

  const walletAddress = currentWallet.address.toLowerCase();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const sessionId = identityDynamicSessionId;

  const response = await fetch(
    IDENTITY_DYNAMIC_CONFIG.rpcUrl,
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
        id: Math.floor(Math.random() * 1000)
      })
    }
  );

  return await response.json();
}

// ======================================================
// WEBSOCKET/RPC TUNNEL COM WEBRTC (OPCIONAL)
// ======================================================

class IdentityDynamicTunnel {
  constructor() {
    this.wsConnection = null;
    this.rtcConnection = null;
    this.reconnectInterval = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (!identityDynamicAuthorized) {
        throw new Error('Não autorizado');
      }

      // Tentar WebSocket primeiro
      await this.connectWebSocket();
      
      // Fallback para WebRTC DataChannel
      if (!this.isConnected) {
        await this.connectWebRTC();
      }

      return this.isConnected;
    } catch (error) {
      console.error('Erro ao conectar tunnel:', error);
      return false;
    }
  }

  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      const wsUrl = IDENTITY_DYNAMIC_CONFIG.rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://');
      
      this.wsConnection = new WebSocket(wsUrl);
      
      this.wsConnection.onopen = () => {
        this.isConnected = true;
        showNotification('Tunnel Identity Dynamic conectado (WebSocket)', 'success');
        resolve(true);
      };
      
      this.wsConnection.onerror = (error) => {
        this.isConnected = false;
        reject(error);
      };
      
      this.wsConnection.onmessage = (event) => {
        this.handleMessage(event.data);
      };
      
      // Timeout após 5 segundos
      setTimeout(() => {
        if (!this.isConnected) {
          this.wsConnection.close();
          reject(new Error('Timeout WebSocket'));
        }
      }, 5000);
    });
  }

  async connectWebRTC() {
    // Implementação de tunnel WebRTC (Data Channels)
    // Similar à implementação no communication-system.js
    showNotification('Usando tunnel WebRTC para Identity Dynamic', 'info');
    return false; // Placeholder
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'rpc-response') {
        // Processar resposta RPC
        this.handleRPCResponse(message);
      } else if (message.type === 'notification') {
        // Notificações do servidor
        showNotification(`Identity: ${message.message}`, 'info');
      }
    } catch (error) {
      console.error('Erro ao processar mensagem tunnel:', error);
    }
  }

  handleRPCResponse(response) {
    // Processar respostas RPC recebidas via tunnel
    console.log('Resposta RPC via tunnel:', response);
  }

  sendRPCRequest(method, params) {
    if (!this.isConnected || !this.wsConnection) {
      throw new Error('Tunnel não conectado');
    }

    const request = {
      type: 'rpc-request',
      method: method,
      params: params,
      timestamp: Date.now(),
      signature: identityDynamicSignature
    };

    this.wsConnection.send(JSON.stringify(request));
  }

  disconnect() {
    if (this.wsConnection) {
      this.wsConnection.close();
    }
    
    if (this.rtcConnection) {
      this.rtcConnection.close();
    }
    
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }
    
    this.isConnected = false;
    showNotification('Tunnel Identity Dynamic desconectado', 'info');
  }
}

// ======================================================
// FUNÇÕES DE ATUALIZAÇÃO DE RPC
// ======================================================

function updateRpcProvider() {
  const rpcSelect = document.getElementById('rpcProviderSelect');
  if (!rpcSelect) return;
  
  const newRpc = rpcSelect.value;
  
  if (!newRpc) {
    showNotification('Selecione um provedor RPC', 'error');
    return;
  }
  
  // Verificar se é Identity Dynamic e se está autorizado
  if (newRpc.includes('identitydynamic') && !identityDynamicAuthorized && !localStorage.getItem('identityDynamicAuth')) {
    showNotification('Autorize o Identity Dynamic antes de usar', 'warning');
    showIdentityAuthorizationInfo();
    return;
  }
  
  currentRpcProvider = newRpc;
  localStorage.setItem('exclusiveWalletRpc', newRpc);
  
  showNotification('Atualizando provedor RPC...', 'info');
  
  if (typeof initializeRpcProvider === 'function') {
    if (initializeRpcProvider()) {
      testRpcConnection();
    }
  }
}

// ======================================================
// MONITORAMENTO DE STATUS
// ======================================================

async function refreshNetworkStatus() {
  if (!polygonProvider) return;
  
  try {
    const startTime = Date.now();
    const blockNumber = await polygonProvider.getBlockNumber();
    const endTime = Date.now();
    
    networkStatus.latency = endTime - startTime;
    networkStatus.lastBlock = blockNumber;
    networkStatus.connected = true;
    
    const feeData = await polygonProvider.getFeeData();
    networkStatus.gasPrice = Math.round(Number(ethers.formatUnits(feeData.gasPrice || '30000000000', 'gwei')));
    
    if (typeof updateRpcStatus === 'function') {
      updateRpcStatus();
    }
    
    showNotification('Status da rede atualizado', 'success');
    
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    networkStatus.connected = false;
    
    if (typeof updateRpcStatus === 'function') {
      updateRpcStatus();
    }
    
    showNotification('Erro ao atualizar status da rede', 'error');
  }
}

function showNetworkMetrics() {
  const modalContent = `
    <div class="modal-overlay active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title"><i class="fas fa-chart-bar"></i> Métricas da Rede Polygon</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 25px;">
            <div style="text-align: center; background: var(--gradient-card); padding: 20px; border-radius: 12px;">
              <div style="color: var(--text-secondary); font-size: 12px;">Latência</div>
              <div style="font-size: 24px; font-weight: 600; color: var(--success-color);">${networkStatus.latency}ms</div>
            </div>
            
            <div style="text-align: center; background: var(--gradient-card); padding: 20px; border-radius: 12px;">
              <div style="color: var(--text-secondary); font-size: 12px;">Último Bloco</div>
              <div style="font-size: 24px; font-weight: 600; color: var(--primary-color);">${networkStatus.lastBlock.toLocaleString()}</div>
            </div>
            
            <div style="text-align: center; background: var(--gradient-card); padding: 20px; border-radius: 12px;">
              <div style="color: var(--text-secondary); font-size: 12px;">Preço do Gás</div>
              <div style="font-size: 24px; font-weight: 600; color: var(--primary-color);">${networkStatus.gasPrice} GWEI</div>
            </div>
            
            <div style="text-align: center; background: var(--gradient-card); padding: 20px; border-radius: 12px;">
              <div style="color: var(--text-secondary); font-size: 12px;">Status</div>
              <div style="font-size: 24px; font-weight: 600; color: ${networkStatus.connected ? 'var(--success-color)' : 'var(--error-color)'};">
                ${networkStatus.connected ? 'Conectado' : 'Desconectado'}
              </div>
            </div>
          </div>
          
          <div style="background: var(--gradient-card); padding: 15px; border-radius: 10px; border: 1px solid var(--card-border);">
            <h4 style="color: var(--primary-color); margin-bottom: 10px; font-size: 14px;">
              <i class="fas fa-info-circle"></i> Informações do Provedor
            </h4>
            <div style="font-size: 12px; color: var(--text-secondary);">
              <div><strong>RPC URL:</strong> ${currentRpcProvider}</div>
              <div><strong>Chain ID:</strong> ${polygonConfig.chainId}</div>
              <div><strong>Símbolo:</strong> ${polygonConfig.symbol}</div>
              <div><strong>Explorer:</strong> ${polygonConfig.explorer}</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Fechar</button>
          <button class="btn btn-secondary" onclick="refreshNetworkStatus()">
            <i class="fas fa-redo"></i> Atualizar
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalContent);
}

function showRpcInfo() {
  const modalContent = `
    <div class="modal-overlay active">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title"><i class="fas fa-server"></i> Informações do RPC</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom: 25px;">
            <h4 style="color: var(--primary-color); margin-bottom: 10px; font-size: 16px;">
              RPC Atual
            </h4>
            <div style="background: var(--gradient-card); padding: 15px; border-radius: 10px; font-family: 'Courier New', monospace; font-size: 12px; word-break: break-all;">
              ${currentRpcProvider}
            </div>
          </div>
          
          <div style="background: rgba(212, 175, 55, 0.05); padding: 15px; border-radius: 10px; border: 1px solid rgba(212, 175, 55, 0.2);">
            <h4 style="color: var(--primary-color); margin-bottom: 10px; font-size: 14px;">
              <i class="fas fa-shield-alt"></i> Identity Dynamic
            </h4>
            <p style="color: var(--text-secondary); font-size: 12px; line-height: 1.5;">
              O Identity Dynamic é um RPC premium que requer autorização via assinatura digital.
              Oferece melhor performance e recursos exclusivos para usuários autorizados.
            </p>
            ${identityDynamicAuthorized ? 
              '<div style="color: var(--success-color); font-size: 12px; margin-top: 10px;"><i class="fas fa-check-circle"></i> Autorizado</div>' : 
              '<button class="btn btn-secondary btn-small" onclick="showIdentityAuthorizationInfo()" style="margin-top: 10px;">Autorizar Identity Dynamic</button>'
            }
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Fechar</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalContent);
}

// ======================================================
// EXPORTAÇÃO DAS FUNÇÕES
// ======================================================

window.showIdentityAuthorizationInfo = showIdentityAuthorizationInfo;
window.closeIdentityAuthModal = closeIdentityAuthModal;
window.performIdentityDynamicAuth = performIdentityDynamicAuth;
window.testIdentityDynamicConnection = testIdentityDynamicConnection;
window.callIdentityDynamicRPC = callIdentityDynamicRPC;
window.updateRpcProvider = updateRpcProvider;
window.refreshNetworkStatus = refreshNetworkStatus;
window.showNetworkMetrics = showNetworkMetrics;
window.showRpcInfo = showRpcInfo;

// Inicializar Identity Dynamic se já autorizado
document.addEventListener('DOMContentLoaded', function() {
  if (localStorage.getItem('identityDynamicAuth') === 'true') {
    identityDynamicAuthorized = true;
    identityDynamicSessionId = localStorage.getItem('identityDynamicSession');
    identityDynamicSignature = localStorage.getItem('identityDynamicSignature');
  }
});
