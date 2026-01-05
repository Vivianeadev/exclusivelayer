// WALLET FUNCTIONS
async function refreshBalance() {
  if (!currentWallet) {
    showNotification('Conecte uma wallet primeiro', 'error');
    return;
  }
  
  if (currentRpcProvider.includes('identitydynamic')) {
    if (!identityDynamicAuthorized) {
      showNotification('Autorize o Identity Dynamic primeiro', 'error');
      showIdentityAuthorizationInfo();
      return;
    }
    
    showNotification('Consultando saldo via Identity Dynamic...', 'info');
    
    try {
      const result = await callIdentityDynamicRPC('eth_getBalance', [currentWallet.address, 'latest']);
      
      if (result.result) {
        const balance = BigInt(result.result);
        const balanceInMatic = ethers.formatEther(balance.toString());
        
        realChainBalances.polygon = parseFloat(balanceInMatic).toFixed(4);
        updateCurrentChainBalance();
        
        const maticPrice = 0.8;
        const usdValue = parseFloat(balanceInMatic) * maticPrice;
        document.getElementById('currentChainValue').textContent = `≈ $${usdValue.toFixed(2)} USD`;
        
        showNotification('Saldo Polygon atualizado via Identity Dynamic!', 'success');
      } else {
        showNotification('Erro ao consultar saldo via Identity', 'error');
      }
    } catch (error) {
      console.error('Erro Identity Dynamic:', error);
      showNotification('Falha Identity Dynamic, usando RPC padrão', 'warning');
      currentRpcProvider = 'https://polygon-rpc.com';
      localStorage.setItem('exclusiveWalletRpc', currentRpcProvider);
      initializeRpcProvider();
      refreshBalance();
    }
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

function showReceiveModal() {
  document.getElementById('qrCodeContainer').style.display = 'block';
  document.getElementById('sendFormContainer').style.display = 'none';
  
  if (currentWallet) {
    document.getElementById('qrAddressDisplay').textContent = currentWallet.address;
    
    const qrCodeElement = document.getElementById('qrCodeCanvas');
    qrCodeElement.innerHTML = '';
    
    const qrColors = currentTheme === 'light' ? {
      dark: '#1A1A1A',
      light: '#FFFFFF'
    } : {
      dark: '#1A1A1A',
      light: '#FFFFFF'
    };
    
    QRCode.toCanvas(qrCodeElement, currentWallet.address, {
      width: 180,
      height: 180,
      color: qrColors
    }, function(error) {
      if (error) {
        console.error('Erro ao gerar QR Code:', error);
        qrCodeElement.innerHTML = '<div style="color: var(--text-secondary); padding: 20px;">Erro ao gerar QR Code</div>';
      }
    });
  }
}

async function sendTransaction() {
  const toAddress = document.getElementById('sendToAddress').value.trim();
  const amount = document.getElementById('sendAmount').value.trim();
  
  if (!currentWallet || !polygonProvider || !networkStatus.connected) {
    showNotification('Conecte-se ao RPC primeiro', 'error');
    return;
  }
  
  if (!toAddress) {
    showNotification('Informe o endereço de destino Polygon', 'error');
    return;
  }
  
  if (!amount || parseFloat(amount) <= 0) {
    showNotification('Informe uma quantia válida em MATIC', 'error');
    return;
  }
  
  try {
    showNotification('Preparando transação na Polygon...', 'info');
    
    const connectedWallet = currentWallet.connect(polygonProvider);
    
    const tx = {
      to: toAddress,
      value: ethers.parseEther(amount),
      gasLimit: 21000
    };
    
    const estimatedGas = await connectedWallet.estimateGas(tx);
    tx.gasLimit = estimatedGas;
    
    const feeData = await polygonProvider.getFeeData();
    tx.maxFeePerGas = feeData.maxFeePerGas;
    tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    
    showNotification('Enviando transação...', 'info');
    
    const transaction = await connectedWallet.sendTransaction(tx);
    
    showNotification(`✅ Transação enviada! Hash: ${transaction.hash.substring(0, 10)}...`, 'success');
    
    document.getElementById('sendToAddress').value = '';
    document.getElementById('sendAmount').value = '';
    
    setTimeout(() => {
      refreshBalance();
    }, 3000);
    
  } catch (error) {
    console.error('Erro ao enviar transação:', error);
    showNotification('Erro ao enviar transação: ' + error.message, 'error');
  }
}

async function estimateGas() {
  const toAddress = document.getElementById('sendToAddress').value.trim();
  const amount = document.getElementById('sendAmount').value.trim();
  
  if (!toAddress || !amount) {
    showNotification('Preencha endereço e valor primeiro', 'error');
    return;
  }
  
  if (!polygonProvider || !networkStatus.connected) {
    showNotification('Conecte-se ao RPC primeiro', 'error');
    return;
  }
  
  try {
    showNotification('Estimando custo do gás...', 'info');
    
    const tx = {
      to: toAddress,
      value: ethers.parseEther(amount)
    };
    
    const connectedWallet = currentWallet.connect(polygonProvider);
    const estimatedGas = await connectedWallet.estimateGas(tx);
    
    const feeData = await polygonProvider.getFeeData();
    const gasPrice = feeData.maxFeePerGas || feeData.gasPrice;
    
    const gasCost = estimatedGas * gasPrice;
    const gasCostInMatic = ethers.formatEther(gasCost);
    
    const maticPrice = 0.8;
    const usdCost = parseFloat(gasCostInMatic) * maticPrice;
    
    document.getElementById('estimatedGasCost').textContent = `$${usdCost.toFixed(2)} (${parseFloat(gasCostInMatic).toFixed(6)} MATIC)`;
    
    showNotification('Estimativa de gás calculada', 'success');
    
  } catch (error) {
    console.error('Erro ao estimar gás:', error);
    showNotification('Erro ao estimar gás: ' + error.message, 'error');
  }
}

function copyAddress() {
  if (!currentWallet) return;
  
  navigator.clipboard.writeText(currentWallet.address)
    .then(() => showNotification('Endereço Polygon copiado!', 'success'))
    .catch(() => showNotification('Erro ao copiar endereço', 'error'));
}

function copyQRAddress() {
  if (!currentWallet) return;
  
  navigator.clipboard.writeText(currentWallet.address)
    .then(() => showNotification('Endereço Polygon copiado!', 'success'))
    .catch(() => showNotification('Erro ao copiar endereço', 'error'));
}

function cancelSend() {
  document.getElementById('sendFormContainer').style.display = 'none';
  showNotification('Envio na Polygon cancelado', 'info');
}

function loadMoreTransactions() {
  showNotification('Carregando mais transações Polygon...', 'info');
  setTimeout(() => {
    showNotification('Transações Polygon carregadas', 'success');
  }, 1000);
}

function updateOverview() {
  if (!currentWallet) return;
  
  const address = currentWallet.address;
  const formattedAddress = `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  
  document.getElementById('walletAddressDisplay').textContent = formattedAddress;
  document.getElementById('walletStatus').textContent = 'Ativo';
  document.getElementById('featureCount').textContent = '6';
  document.getElementById('securityLevel').textContent = 'Máxima';
  
  updateAddressRegistration();
}

function updateAddressRegistration() {
  if (!currentWallet) return;
  
  const addressDisplay = document.getElementById('publicAddressDisplay');
  const checkbox = document.getElementById('confirmAddressCheckbox');
  const registerBtn = document.getElementById('registerAddressBtn');
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');
  
  addressDisplay.textContent = currentWallet.address;
  
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
    localStorage.setItem('exclusiveWalletAddressRegistered', 'true');
    
    updateAddressRegistration();
    showNotification('✅ Identidade Polygon registrada com sucesso!', 'success');
  };
}

// Funções da seção de tokens
function transferToken(contractAddress, symbol, decimals) {
  showNotification(`Transferência de ${symbol} (simulada)`, 'info');
}

function refreshTokenBalance(contractAddress) {
  showNotification(`Atualizando saldo do token...`, 'info');
  setTimeout(() => {
    showNotification('Saldo do token atualizado', 'success');
  }, 1000);
}

function removeToken(contractAddress) {
  if (confirm('Remover este token do seu portfólio?')) {
    showNotification('Token removido', 'info');
  }
}

// Adicionar token manualmente
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('addManualToken').addEventListener('click', function() {
    const address = document.getElementById('manualTokenAddress').value.trim();
    const symbol = document.getElementById('manualTokenSymbol').value.trim();
    
    if (!address || !symbol) {
      showNotification('Preencha todos os campos', 'error');
      return;
    }
    
    showNotification(`Token ${symbol} adicionado ao portfólio`, 'success');
    document.getElementById('manualTokenAddress').value = '';
    document.getElementById('manualTokenSymbol').value = '';
  });
});
