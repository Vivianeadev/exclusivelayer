// INFRA IDENTITY FUNCTIONS
async function testRpcConnection() {
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

function updateRpcProvider() {
  const newRpc = document.getElementById('rpcProviderSelect').value;
  
  if (!newRpc) {
    showNotification('Selecione um provedor RPC', 'error');
    return;
  }
  
  if (newRpc.includes('identitydynamic') && !identityDynamicAuthorized && !localStorage.getItem('identityDynamicAuth')) {
    showNotification('Autorize o Identity Dynamic antes de usar', 'warning');
    showIdentityAuthorizationInfo();
    return;
  }
  
  currentRpcProvider = newRpc;
  localStorage.setItem('exclusiveWalletRpc', newRpc);
  
  showNotification('Atualizando provedor RPC...', 'info');
  
  if (initializeRpcProvider()) {
    testRpcConnection();
  }
}

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

async function performIdentityDynamicAuth() {
  if (!currentWallet) {
    showNotification('Wallet não conectada', 'error');
    return;
  }

  try {
    const btn = document.getElementById('identityAuthorizeBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Autorizando...';

    const walletAddress = currentWallet.address.toLowerCase();
    const timestamp = Math.floor(Date.now() / 1000).toString();

    identityDynamicSessionId = ethers.id(walletAddress + timestamp).substring(0, 32);

    const message = [
      "IDENTITY_DYNAMIC_ACCESS",
      `wallet:${walletAddress}`,
      `session:${identityDynamicSessionId}`,
      `issued_at:${timestamp}`,
      "chain:polygon",
      "scope:rpc"
    ].join("\n");

    identityDynamicSignature = await currentWallet.signMessage(message);
    
    currentRpcProvider = 'https://identitydynamic.avizaecosystem.workers.dev';
    localStorage.setItem('exclusiveWalletRpc', currentRpcProvider);

    document.getElementById('rpcProviderSelect').value = currentRpcProvider;

    initializeRpcProvider();
    
    const authResult = document.getElementById('identityAuthResult');
    const resultText = document.getElementById('identityAuthResultText');
    const signaturePreview = document.getElementById('identitySignaturePreview');

    authResult.style.display = 'block';
    resultText.textContent = 'Autorização Identity Dynamic bem-sucedida!';
    signaturePreview.textContent = `Assinatura: ${identityDynamicSignature.substring(0, 40)}...`;

    identityDynamicAuthorized = true;
    localStorage.setItem('identityDynamicAuth', 'true');
    localStorage.setItem('identityDynamicSession', identityDynamicSessionId);
    localStorage.setItem('identityDynamicSignature', identityDynamicSignature);

    showNotification('✅ Autorização Identity Dynamic realizada com sucesso!', 'success');

    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-key"></i> Autorização Concluída';
    }, 2000);

  } catch (error) {
    console.error('Erro na autorização Identity Dynamic:', error);
    showNotification('Erro na autorização Identity: ' + error.message, 'error');
    
    const btn = document.getElementById('identityAuthorizeBtn');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-key"></i> Tentar Novamente';
  }
}

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
    const walletAddress = currentWallet.address.toLowerCase();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const sessionId = identityDynamicSessionId || localStorage.getItem('identityDynamicSession') || ethers.id(walletAddress + timestamp).substring(0, 32);
    const signature = identityDynamicSignature || localStorage.getItem('identityDynamicSignature');

    if (!signature) {
      showNotification('Reautorize o Identity Dynamic', 'error');
      showIdentityAuthorizationInfo();
      return;
    }

    const response = await fetch(
      "https://identitydynamic.avizaecosystem.workers.dev",
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

async function callIdentityDynamicRPC(method, params = []) {
  if (!currentWallet || !identityDynamicAuthorized) {
    throw new Error('Wallet não autorizada para Identity Dynamic');
  }

  const walletAddress = currentWallet.address.toLowerCase();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const sessionId = identityDynamicSessionId;

  const response = await fetch(
    "https://identitydynamic.avizaecosystem.workers.dev",
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

function showRpcInfo() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title"><i class="fas fa-info-circle"></i> Informações RPC Polygon</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <p style="color: var(--text-secondary); margin-bottom: 15px;">
          <strong>RPC (Remote Procedure Call)</strong> é a conexão entre sua wallet e a blockchain Polygon.
        </p>
        <ul style="color: var(--text-secondary); padding-left: 20px; margin-bottom: 20px;">
          <li>Consulta saldos e transações</li>
          <li>Envia transações para a rede</li>
          <li>Obtém informações da blockchain</li>
          <li>Estimativa de taxas de gás</li>
        </ul>
        <p style="color: var(--warning-color); font-size: 13px;">
          <i class="fas fa-exclamation-triangle"></i> Suas chaves NUNCA são enviadas ao RPC
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Fechar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function refreshNetworkStatus() {
  testRpcConnection();
}

function showNetworkMetrics() {
  showNotification('Métricas de rede carregadas', 'info');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('identityAuthorizeBtn').addEventListener('click', performIdentityDynamicAuth);
  document.querySelector('.modal-close[onclick*="closeIdentityAuthModal"]')?.addEventListener('click', closeIdentityAuthModal);
});
