// ======================================================
// FUNÇÕES DE WALLET E TRANSACTIONS
// ======================================================

async function connectPrivateKey() {
  const pk = document.getElementById('privateKey').value.trim();
  if(!pk){ 
    showNotification('Insira sua chave privada Polygon', 'error');
    return;
  }
  
  let privateKey = pk.replace(/\s/g, '');
  if (!privateKey.startsWith('0x')) {
    privateKey = '0x' + privateKey;
  }
  
  try {
    currentWallet = new ethers.Wallet(privateKey);
    localStorage.setItem('exclusiveWalletPK', privateKey);
    
    // Verificar autorização Identity Dynamic salva
    if (localStorage.getItem('identityDynamicAuth') === 'true') {
      identityDynamicAuthorized = true;
      identityDynamicSessionId = localStorage.getItem('identityDynamicSession');
      identityDynamicSignature = localStorage.getItem('identityDynamicSignature');
    }
    
    initializeRpcProvider();
    
    showNotification(`✅ Identidade Polygon conectada! Endereço: ${currentWallet.address.substring(0, 10)}...`, 'success');
    showWalletDashboard();
    
  } catch (error) {
    console.error('Erro ao conectar identidade Polygon:', error);
    showNotification('Erro ao conectar identidade Polygon. Verifique sua chave privada.', 'error');
  }
}

async function createNewWallet() {
  try {
    showNotification('Criando identidade Polygon premium...', 'info');
    
    const wallet = ethers.Wallet.createRandom();
    currentWallet = wallet;
    mnemonicPhrase = wallet.mnemonic.phrase;
    
    localStorage.setItem('exclusiveWalletPK', currentWallet.privateKey);
    
    const password = document.getElementById('newWalletPassword').value.trim();
    if (password) {
      localStorage.setItem('exw_psw', password);
      showNotification('Senha local salva (apenas neste dispositivo).', 'info');
    }
    
    showMnemonicCreationModal(mnemonicPhrase);
    
  } catch (error) {
    console.error('Erro ao criar identidade Polygon:', error);
    showNotification('Erro ao criar identidade Polygon premium: ' + error.message, 'error');
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

// ======================================================
// FUNÇÕES DE RPC E INFRA IDENTITY
// ======================================================

function initializeRpcProvider() {
  try {
    const savedRpc = localStorage.getItem('exclusiveWalletRpc') || currentRpcProvider;
    currentRpcProvider = savedRpc;
    
    // Verificar se é Identity Dynamic
    if (currentRpcProvider.includes('identitydynamic')) {
      if (!identityDynamicAuthorized && !localStorage.getItem('identityDynamicAuth')) {
        showNotification('Identity Dynamic requer autorização. Usando RPC padrão.', 'warning');
        currentRpcProvider = 'https://polygon-rpc.com';
        localStorage.setItem('exclusiveWalletRpc', currentRpcProvider);
      }
    }
    
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
  
  // Verificar se é Identity Dynamic e se está autorizado
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

function updateRpcStatus() {
  const statusElement = document.getElementById('rpcStatus');
  const latencyElement = document.getElementById('rpcLatency');
  const lastBlockElement = document.getElementById('lastBlock');
  const gasPriceElement = document.getElementById('gasPriceDisplay');
  const connectionStatus = document.getElementById('connectionStatus');
  
  if (networkStatus.connected) {
    statusElement.innerHTML = '<i class="fas fa-check-circle"></i> Conectado';
    statusElement.style.color = 'var(--success-color)';
    connectionStatus.textContent = `LATÊNCIA: ${networkStatus.latency}ms`;
  } else {
    statusElement.innerHTML = '<i class="fas fa-times-circle"></i> Desconectado';
    statusElement.style.color = 'var(--error-color)';
    connectionStatus.textContent = 'LATÊNCIA: --';
  }
  
  if (latencyElement) latencyElement.textContent = `${networkStatus.latency}ms`;
  if (lastBlockElement) lastBlockElement.textContent = networkStatus.lastBlock.toLocaleString();
  if (gasPriceElement) gasPriceElement.textContent = `${networkStatus.gasPrice} GWEI`;
}

// ======================================================
// FUNÇÕES DE SALDO E REFRESH
// ======================================================

async function refreshBalance() {
  if (!currentWallet) {
    showNotification('Conecte uma wallet primeiro', 'error');
    return;
  }
  
  // Se for Identity Dynamic, usar método específico
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
      // Tentar com RPC padrão como fallback
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
  
  // Para outras chains, simular saldos (em produção, integraria com RPCs reais)
  if (otherChainsWallets[chainId]) {
    // Se a wallet existe, gerar um saldo aleatório para demonstração
    if (!realChainBalances[chainId] || realChainBalances[chainId] === '0.0000') {
      const randomBalance = (Math.random() * 10).toFixed(4);
      realChainBalances[chainId] = randomBalance;
    }
    return realChainBalances[chainId];
  }
  
  // Se não tem wallet criada, saldo zero
  return '0.0000';
}

async function updateCurrentChainBalance() {
  if (!currentSelectedChain) return;
  
  const balance = await refreshRealChainBalance(currentSelectedChain);
  const balanceElement = document.getElementById('currentChainBalance');
  if (balanceElement) {
    balanceElement.textContent = balance;
    
    // Atualizar também o elemento específico da chain
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
        // outros...
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

// ======================================================
// FUNÇÕES DE QR CODE E RECEBIMENTO
// ======================================================

function showReceiveModal() {
  document.getElementById('qrCodeContainer').style.display = 'block';
  document.getElementById('sendFormContainer').style.display = 'none';
  
  if (currentWallet) {
    document.getElementById('qrAddressDisplay').textContent = currentWallet.address;
    
    const qrCodeElement = document.getElementById('qrCodeCanvas');
    qrCodeElement.innerHTML = '';
    
    // Configurações diferentes para tema claro/escuro
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

    // Criar PDF no formato cartão (A4 horizontal dividido em 2)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const cardWidth = pageWidth / 2 - 20;
    const cardHeight = pageHeight - 40;

    // ===== PRIMEIRO CARTÃO =====
    // Fundo de luxo
    doc.setFillColor(26, 26, 26);
    doc.rect(15, 20, cardWidth, cardHeight, 'F');
    
    // Borda dourada
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(1.5);
    doc.rect(15, 20, cardWidth, cardHeight);

    // Logo e título
    doc.setTextColor(212, 175, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Identity Premium', cardWidth / 2 + 15, 35, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(244, 228, 184);
    doc.text('Cartão de Endereço Polygon', cardWidth / 2 + 15, 42, { align: 'center' });

    // QR Code
    const qrSize = 80;
    const qrX = (cardWidth - qrSize) / 2 + 15;
    doc.addImage(qrDataURL, 'PNG', qrX, 50, qrSize, qrSize);

    // Endereço
    doc.setFontSize(9);
    doc.setTextColor(240, 240, 240);
    doc.text('Endereço Polygon:', cardWidth / 2 + 15, 140, { align: 'center' });
    
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(212, 175, 55);
    const addressLines = doc.splitTextToSize(address, cardWidth - 30);
    doc.text(addressLines, cardWidth / 2 + 15, 148, { align: 'center' });

    // Informações
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(176, 176, 176);
    doc.text(`Gerado em: ${formattedDate}`, cardWidth / 2 + 15, 165, { align: 'center' });
    doc.text('Licença Vitalícia • Sistema Polygon Premium', cardWidth / 2 + 15, 170, { align: 'center' });

    // ===== SEGUNDO CARTÃO =====
    const secondCardX = pageWidth / 2 + 5;
    
    // Fundo de luxo
    doc.setFillColor(10, 10, 10);
    doc.rect(secondCardX, 20, cardWidth, cardHeight, 'F');
    
    // Borda dourada
    doc.setDrawColor(212, 175, 55);
    doc.rect(secondCardX, 20, cardWidth, cardHeight);

    // Título do segundo cartão
    doc.setTextColor(212, 175, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('INFORMAÇÕES DE SEGURANÇA', pageWidth / 4 * 3, 35, { align: 'center' });

    // Instruções
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

    // QR Code menor para referência
    doc.addImage(qrDataURL, 'PNG', secondCardX + cardWidth / 2 - 25, yPos + 10, 50, 50);

    // Texto de licença em minúsculas
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text('este qrcode foi gerado através da licença vitalícia da Identity Premium', 
            pageWidth / 4 * 3, pageHeight - 15, { align: 'center' });

    // Salvar PDF
    const fileName = `cartao-qrcode-polygon-${shortAddress}-${currentDate.getTime()}.pdf`;
    doc.save(fileName);

    showNotification(`✅ Cartão de Luxo salvo como ${fileName}`, 'success');

  } catch (error) {
    console.error('Erro ao gerar cartão:', error);
    showNotification('Erro ao gerar Cartão de Luxo: ' + error.message, 'error');
  }
}

function copyQRAddress() {
  if (!currentWallet) return;
  
  navigator.clipboard.writeText(currentWallet.address)
    .then(() => showNotification('Endereço Polygon copiado!', 'success'))
    .catch(() => showNotification('Erro ao copiar endereço', 'error'));
}

function copyAddress() {
  if (!currentWallet) return;
  
  navigator.clipboard.writeText(currentWallet.address)
    .then(() => showNotification('Endereço Polygon copiado!', 'success'))
    .catch(() => showNotification('Erro ao copiar endereço', 'error'));
}

// ======================================================
// FUNÇÕES DE MULTICHAIN
// ======================================================

// Inicializar botões de blockchains
function initializeBlockchainButtons() {
  const container = document.getElementById('blockchainButtonsContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  blockchains.forEach(chain => {
    const button = document.createElement('button');
    button.className = 'blockchain-button';
    button.setAttribute('data-chain', chain.id);
    button.textContent = chain.name;
    
    if (chain.id === currentSelectedChain) {
      button.classList.add('active');
    }
    
    button.addEventListener('click', () => {
      selectBlockchain(chain.id);
    });
    
    container.appendChild(button);
  });
}

// Selecionar uma blockchain
async function selectBlockchain(chainId) {
  document.querySelectorAll('.blockchain-button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-chain') === chainId) {
      btn.classList.add('active');
    }
  });
  
  currentSelectedChain = chainId;
  
  // Ir direto para a aba wallet
  switchTab('walletTab');
  
  // Atualizar o saldo da chain selecionada
  await updateCurrentChainBalance();
  
  if (chainId === 'polygon') {
    showNotification(`Dashboard Polygon carregado`, 'success');
  } else {
    const chainName = blockchains.find(c => c.id === chainId).name;
    showNotification(`Dashboard da ${chainName} carregado`, 'success');
  }
}

// Mostrar a wallet correta para a chain selecionada
function showCorrectWalletForChain() {
  document.querySelectorAll('.wallet-tab-other').forEach(el => {
    el.classList.remove('active');
    el.style.display = 'none';
  });
  
  document.getElementById('walletTab').style.display = 'none';
  
  if (currentSelectedChain === 'polygon') {
    document.getElementById('walletTab').style.display = 'block';
    return;
  }
  
  const otherWalletId = `walletTab${currentSelectedChain.charAt(0).toUpperCase() + currentSelectedChain.slice(1)}`;
  let otherWallet = document.getElementById(otherWalletId);
  
  if (!otherWallet) {
    // Criar wallet para a chain se não existir
    const chain = blockchains.find(c => c.id === currentSelectedChain);
    if (chain) {
      // Em vez de criar automaticamente, apenas mostrar os botões de criação
      createChainWalletInterface(currentSelectedChain);
      otherWallet = document.getElementById(otherWalletId);
    }
  }
  
  if (otherWallet) {
    otherWallet.classList.add('active');
    otherWallet.style.display = 'block';
  }
}

// Criar interface de wallet para uma chain específica
function createChainWalletInterface(chainId) {
  const chain = blockchains.find(c => c.id === chainId);
  if (!chain) return;
  
  const walletTab = document.getElementById('walletTab');
  if (!walletTab) return;
  
  const newWallet = walletTab.cloneNode(true);
  newWallet.id = `walletTab${chainId.charAt(0).toUpperCase() + chainId.slice(1)}`;
  newWallet.className = 'tab-content wallet-tab-other';
  
  const chainName = chain.name;
  const chainSymbol = chain.symbol;
  
  // Atualizar textos
  const titleElement = newWallet.querySelector('.wallet-header h2');
  if (titleElement) {
    titleElement.innerHTML = `<i class="fas fa-wallet"></i> Wallet ${chainName} Premium`;
  }
  
  const subtitleElement = newWallet.querySelector('.wallet-header p');
  if (subtitleElement) {
    subtitleElement.textContent = `Gerencie seus fundos na ${chainName} com elegância minimalista e funcionalidades completas`;
  }
  
  // Atualizar elementos de saldo
  const balanceLabel = newWallet.querySelector('.balance-main-container .balance-label:nth-child(1)');
  if (balanceLabel) {
    balanceLabel.textContent = `Saldo na ${chainName} Network`;
  }
  
  const balanceDisplay = newWallet.querySelector('.balance-main-container .balance-display');
  if (balanceDisplay) {
    balanceDisplay.id = `currentChainBalance${chainId.charAt(0).toUpperCase() + chainId.slice(1)}`;
    balanceDisplay.textContent = realChainBalances[chainId] || '0.0000';
  }
  
  const balanceSymbol = newWallet.querySelector('.balance-main-container .balance-label:nth-child(3)');
  if (balanceSymbol) {
    balanceSymbol.textContent = chainSymbol;
  }
  
  // Atualizar IDs dos elementos
  updateWalletElementIds(newWallet, chainId);
  
  // Adicionar botões específicos da chain
  addChainSpecificButtons(newWallet, chainName, chainId);
  
  // Adicionar ao DOM
  document.getElementById('wallet-dashboard').appendChild(newWallet);
}

// Atualizar IDs dos elementos na wallet clonada
function updateWalletElementIds(walletElement, chainId) {
  const suffix = chainId.charAt(0).toUpperCase() + chainId.slice(1);
  
  // Atualizar todos os elementos com ID
  const allElements = walletElement.querySelectorAll('[id]');
  allElements.forEach(el => {
    if (el.id && !el.id.endsWith(suffix)) {
      el.id = `${el.id}${suffix}`;
    }
  });
  
  // Atualizar labels
  const labels = walletElement.querySelectorAll('label[for]');
  labels.forEach(label => {
    const oldFor = label.getAttribute('for');
    if (oldFor && !oldFor.endsWith(suffix)) {
      label.setAttribute('for', `${oldFor}${suffix}`);
    }
  });
}

// Adicionar botões específicos da chain
function addChainSpecificButtons(walletElement, chainName, chainId) {
  const walletOperationsGrid = walletElement.querySelector('.wallet-operations-grid');
  if (walletOperationsGrid) {
    // Criar container para botões específicos
    const chainButtonsContainer = document.createElement('div');
    chainButtonsContainer.className = 'chain-specific-buttons';
    chainButtonsContainer.innerHTML = `
      <button class="btn btn-primary btn-small" onclick="createWalletForChain('${chainName}')">
        <i class="fas fa-gem"></i> Criar Wallet ${chainName}
      </button>
      <button class="btn btn-secondary btn-small" onclick="restoreWalletForChain('${chainName}')">
        <i class="fas fa-redo"></i> Recuperar Wallet
      </button>
    `;
    
    walletOperationsGrid.parentNode.insertBefore(chainButtonsContainer, walletOperationsGrid.nextSibling);
  }
  
  // Configurar botões de ação
  const actionButtons = walletElement.querySelectorAll('.action-btn');
  actionButtons.forEach((btn, index) => {
    btn.onclick = null;
    if (index === 0) {
      btn.onclick = () => showReceiveModalOther(chainName);
    } else if (index === 1) {
      btn.onclick = () => showSendModalOther(chainName);
    } else if (index === 2) {
      btn.onclick = () => refreshBalanceOther(chainName);
    }
  });
}

// ======================================================
// FUNÇÕES PARA WALLETS DE OUTRAS CHAINS
// ======================================================

// Criar wallet para outra chain
function createWalletForChain(chainName) {
  currentChainForCreation = chainName.toLowerCase();
  
  try {
    showNotification(`Criando wallet ${chainName} premium...`, 'info');
    
    const wallet = ethers.Wallet.createRandom();
    otherChainsWallets[currentChainForCreation] = {
      wallet: wallet,
      mnemonic: wallet.mnemonic.phrase
    };
    
    localStorage.setItem(`exclusiveWallet_${currentChainForCreation}`, wallet.privateKey);
    localStorage.setItem(`exclusiveWalletMnemonic_${currentChainForCreation}`, wallet.mnemonic.phrase);
    
    // Gerar saldo aleatório para demonstração
    const randomBalance = (Math.random() * 10).toFixed(4);
    realChainBalances[currentChainForCreation] = randomBalance;
    
    showMnemonicCreationModalOther(wallet.mnemonic.phrase, chainName);
    
  } catch (error) {
    console.error(`Erro ao criar wallet ${chainName}:`, error);
    showNotification(`Erro ao criar wallet ${chainName}: ` + error.message, 'error');
  }
}

function showMnemonicCreationModalOther(mnemonic, chainName) {
  const modal = document.getElementById('mnemonicCreationModalOther');
  const wordsContainer = document.getElementById('mnemonicWordsContainerOther');
  const timerElement = document.getElementById('mnemonicTimerOther');
  const chainNameElement = document.getElementById('currentChainName');
  const chainNameText = document.getElementById('chainNameText');
  
  chainNameElement.textContent = chainName;
  chainNameText.textContent = chainName;
  
  const words = mnemonic.split(' ');
  wordsContainer.innerHTML = '';
  
  words.forEach((word, index) => {
    const wordElement = document.createElement('div');
    wordElement.className = 'mnemonic-word';
    wordElement.setAttribute('data-index', index + 1);
    wordElement.textContent = word;
    wordsContainer.appendChild(wordElement);
  });
  
  mnemonicTimerSecondsOther = 300;
  updateMnemonicTimerOther();
  mnemonicCreationTimerOther = setInterval(updateMnemonicTimerOther, 1000);
  
  modal.classList.add('active');
}

function updateMnemonicTimerOther() {
  const timerElement = document.getElementById('mnemonicTimerOther');
  if (!timerElement) return;
  
  mnemonicTimerSecondsOther--;
  
  if (mnemonicTimerSecondsOther <= 0) {
    clearInterval(mnemonicCreationTimerOther);
    timerElement.textContent = '00:00';
    showNotification('Tempo esgotado! A criação da wallet foi cancelada.', 'error');
    closeMnemonicCreationModalOther();
    return;
  }
  
  const minutes = Math.floor(mnemonicTimerSecondsOther / 60);
  const seconds = mnemonicTimerSecondsOther % 60;
  timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function closeMnemonicCreationModalOther() {
  const modal = document.getElementById('mnemonicCreationModalOther');
  modal.classList.remove('active');
  clearInterval(mnemonicCreationTimerOther);
  
  delete otherChainsWallets[currentChainForCreation];
  localStorage.removeItem(`exclusiveWallet_${currentChainForCreation}`);
  localStorage.removeItem(`exclusiveWalletMnemonic_${currentChainForCreation}`);
  
  currentChainForCreation = '';
}

function confirmMnemonicSavedOther() {
  clearInterval(mnemonicCreationTimerOther);
  
  const chainName = document.getElementById('currentChainName').textContent;
  const wallet = otherChainsWallets[currentChainForCreation];
  
  if (wallet) {
    // Atualizar saldo
    updateCurrentChainBalance();
    
    showNotification(`✅ Wallet ${chainName} criada! Endereço: ${wallet.wallet.address.substring(0, 10)}...`, 'success');
    showNotification(`⚠️ SALVE SUA CHAVE PRIVADA E FRASE MNEMÔNICA DA ${chainName.toUpperCase()}!`, 'warning');
  }
  
  closeMnemonicCreationModalOther();
}

// Restaurar wallet para outra chain
function restoreWalletForChain(chainName) {
  currentChainForCreation = chainName.toLowerCase();
  
  const modal = document.getElementById('mnemonicModalOther');
  const chainNameElement = document.getElementById('restoreChainName');
  
  chainNameElement.textContent = chainName;
  modal.classList.add('active');
  
  document.getElementById('mnemonicPhraseOther').value = '';
  document.getElementById('privateKeyOther').value = '';
}

function closeMnemonicModalOther() {
  const modal = document.getElementById('mnemonicModalOther');
  modal.classList.remove('active');
  currentChainForCreation = '';
}

function confirmRestoreOther() {
  const mnemonicPhraseInput = document.getElementById('mnemonicPhraseOther').value.trim();
  const privateKeyInput = document.getElementById('privateKeyOther').value.trim();
  
  if (!mnemonicPhraseInput && !privateKeyInput) {
    showNotification('Por favor, insira a frase mnemônica ou chave privada.', 'error');
    return;
  }
  
  try {
    let wallet;
    
    if (mnemonicPhraseInput) {
      if (!ethers.Mnemonic.isValidMnemonic(mnemonicPhraseInput)) {
        showNotification('Frase mnemônica inválida. Verifique as palavras.', 'error');
        return;
      }
      wallet = ethers.Wallet.fromPhrase(mnemonicPhraseInput);
    } else {
      let privateKey = privateKeyInput.replace(/\s/g, '');
      if (!privateKey.startsWith('0x')) {
        privateKey = '0x' + privateKey;
      }
      wallet = new ethers.Wallet(privateKey);
    }
    
    otherChainsWallets[currentChainForCreation] = {
      wallet: wallet,
      mnemonic: mnemonicPhraseInput || ''
    };
    
    localStorage.setItem(`exclusiveWallet_${currentChainForCreation}`, wallet.privateKey);
    if (mnemonicPhraseInput) {
      localStorage.setItem(`exclusiveWalletMnemonic_${currentChainForCreation}`, mnemonicPhraseInput);
    }
    
    // Gerar saldo aleatório para demonstração
    const randomBalance = (Math.random() * 10).toFixed(4);
    realChainBalances[currentChainForCreation] = randomBalance;
    
    closeMnemonicModalOther();
    showNotification(`✅ Wallet ${currentChainForCreation.charAt(0).toUpperCase() + currentChainForCreation.slice(1)} restaurada! Endereço: ${wallet.address.substring(0, 10)}...`, 'success');
    
    // Atualizar saldo exibido
    updateCurrentChainBalance();
    
  } catch (error) {
    console.error('Erro ao restaurar wallet:', error);
    showNotification('Erro ao restaurar wallet: ' + error.message, 'error');
  }
}

// Funções para outras chains
function showReceiveModalOther(chainName) {
  const chainId = chainName.toLowerCase();
  const wallet = otherChainsWallets[chainId];
  
  if (!wallet) {
    showNotification(`Crie ou restaure uma wallet ${chainName} primeiro`, 'error');
    return;
  }
  
  showNotification(`QR Code para recebimento na ${chainName} (simulado)`, 'info');
}

function showSendModalOther(chainName) {
  showNotification(`Envio na ${chainName} (simulado)`, 'info');
}

async function refreshBalanceOther(chainName) {
  const chainId = chainName.toLowerCase();
  showNotification(`Consultando saldo na ${chainName}...`, 'info');
  
  // Atualizar saldo real
  await updateCurrentChainBalance();
  
  showNotification(`Saldo ${chainName} atualizado!`, 'success');
}

function copyQRAddressOther(chainName) {
  const chainId = chainName.toLowerCase();
  const wallet = otherChainsWallets[chainId];
  
  if (!wallet) {
    showNotification(`Nenhuma wallet ${chainName} encontrada`, 'error');
    return;
  }
  
  navigator.clipboard.writeText(wallet.wallet.address)
    .then(() => showNotification(`Endereço ${chainName} copiado!`, 'success'))
    .catch(() => showNotification('Erro ao copiar endereço', 'error'));
}

function cancelSendOther(chainName) {
  showNotification(`Envio na ${chainName} cancelado`, 'info');
}

function estimateGasOther(chainName) {
  showNotification(`Estimando gás na ${chainName}... (simulado)`, 'info');
  setTimeout(() => {
    showNotification(`Estimativa de gás ${chainName} calculada`, 'success');
  }, 1000);
}

function sendTransactionOther(chainName) {
  showNotification(`Enviando transação na ${chainName}... (simulado)`, 'info');
  setTimeout(() => {
    showNotification(`✅ Transação ${chainName} enviada com sucesso!`, 'success');
  }, 2000);
}

function loadMoreTransactionsOther(chainName) {
  showNotification(`Carregando mais transações ${chainName}...`, 'info');
  setTimeout(() => {
    showNotification(`Transações ${chainName} carregadas`, 'success');
  }, 1000);
}

// ======================================================
// FUNÇÕES DE TOKENS
// ======================================================

function transferToken(contractAddress, symbol, decimals) {
  showNotification(`Transferir ${symbol} (${contractAddress.substring(0, 8)}...)`, 'info');
}

function refreshTokenBalance(contractAddress) {
  showNotification(`Atualizando saldo do token...`, 'info');
  setTimeout(() => {
    showNotification(`Saldo do token atualizado`, 'success');
  }, 1000);
}

function removeToken(contractAddress) {
  if (confirm('Remover este token da sua lista?')) {
    showNotification('Token removido da lista', 'info');
  }
}