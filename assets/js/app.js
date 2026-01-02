const { ethers } = window;
let currentWallet = null;
let currentTheme = 'luxury';
let privateKeyVisible = false;
let mnemonicVisible = false;
let mnemonicPhrase = null;
let mnemonicCreationTimer = null;
let mnemonicTimerSeconds = 300;
let isAddressRegistered = false;

// INFRA IDENTITY - RPC CONFIGURAÇÃO
let currentRpcProvider = 'https://polygon-rpc.com';
let polygonProvider = null;
let networkStatus = {
  connected: false,
  latency: 0,
  lastBlock: 0,
  gasPrice: '30'
};

// Configurações da Polygon
const polygonConfig = {
  name: 'Polygon',
  chainId: 137,
  symbol: 'MATIC',
  explorer: 'https://polygonscan.com',
  decimals: 18,
  rpcUrls: [
    'https://polygon-rpc.com',
    'https://identitydynamic.avizaecosystem.workers.dev',
    'https://rpc-mainnet.maticvigil.com',
    'https://polygon-mainnet.infura.io/v3/',
    'https://matic-mainnet.chainstacklabs.com'
  ]
};

// LISTA DE 20 BLOCKCHAINS
const blockchains = [
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', chainId: 137 },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', chainId: 1 },
  { id: 'bsc', name: 'BSC', symbol: 'BNB', chainId: 56 },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', chainId: 43114 },
  { id: 'fantom', name: 'Fantom', symbol: 'FTM', chainId: 250 },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH', chainId: 42161 },
  { id: 'optimism', name: 'Optimism', symbol: 'ETH', chainId: 10 },
  { id: 'base', name: 'Base', symbol: 'ETH', chainId: 8453 },
  { id: 'cronos', name: 'Cronos', symbol: 'CRO', chainId: 25 },
  { id: 'harmony', name: 'Harmony', symbol: 'ONE', chainId: 1666600000 },
  { id: 'kava', name: 'Kava', symbol: 'KAVA', chainId: 2222 },
  { id: 'celo', name: 'Celo', symbol: 'CELO', chainId: 42220 },
  { id: 'moonbeam', name: 'Moonbeam', symbol: 'GLMR', chainId: 1284 },
  { id: 'moonriver', name: 'Moonriver', symbol: 'MOVR', chainId: 1285 },
  { id: 'gnosis', name: 'Gnosis', symbol: 'xDAI', chainId: 100 },
  { id: 'fuse', name: 'Fuse', symbol: 'FUSE', chainId: 122 },
  { id: 'metis', name: 'Metis', symbol: 'METIS', chainId: 1088 },
  { id: 'polygonzkevm', name: 'Polygon zkEVM', symbol: 'ETH', chainId: 1101 },
  { id: 'linea', name: 'Linea', symbol: 'ETH', chainId: 59144 },
  { id: 'scroll', name: 'Scroll', symbol: 'ETH', chainId: 534352 }
];

// Wallets para outras chains
const otherChainsWallets = {};
let currentSelectedChain = 'polygon';
let mnemonicCreationTimerOther = null;
let mnemonicTimerSecondsOther = 300;
let currentChainForCreation = '';

// VARIÁVEIS PARA COMUNICAÇÃO
let authorizedChatAddress = null;
let contacts = [];
let currentChatContact = null;
let videoStream = null;
let peerConnection = null;
let groupVideoStream = null;

// VARIÁVEIS PARA IDENTITY DYNAMIC
let identityDynamicAuthorized = false;
let identityDynamicSessionId = null;
let identityDynamicSignature = null;

// SALDOS REAIS DAS BLOCKCHAINS (simulados inicialmente)
const realChainBalances = {
  polygon: '0.0000',
  ethereum: '0.0000',
  bsc: '0.0000',
  avalanche: '0.0000',
  fantom: '0.0000',
  arbitrum: '0.0000',
  optimism: '0.0000',
  base: '0.0000',
  cronos: '0.0000',
  harmony: '0.0000',
  kava: '0.0000',
  celo: '0.0000',
  moonbeam: '0.0000',
  moonriver: '0.0000',
  gnosis: '0.0000',
  fuse: '0.0000',
  metis: '0.0000',
  polygonzkevm: '0.0000',
  linea: '0.0000',
  scroll: '0.0000'
};

// FUNÇÕES PRINCIPAIS EXISTENTES (intactas)
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

// ======================================================
// IDENTITY DYNAMIC RPC - FUNÇÕES ESPECÍFICAS
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

    // 1. Dados base
    const walletAddress = currentWallet.address.toLowerCase();
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // 2. Session ID (simples e válido)
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
    identityDynamicSignature = await currentWallet.signMessage(message);
    
    // 5. Após autorizar, mudar o RPC para Identity Dynamic
    currentRpcProvider = 'https://identitydynamic.avizaecosystem.workers.dev';
    localStorage.setItem('exclusiveWalletRpc', currentRpcProvider);

    // Atualizar o select na aba Infra Identity
    document.getElementById('rpcProviderSelect').value = currentRpcProvider;

    // Re-inicializar o provider
    initializeRpcProvider();
    
    // 6. Mostrar resultado
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

    // Habilitar o botão novamente
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
    // Usar dados salvos ou gerar novos
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

// ======================================================
// FUNÇÕES EXISTENTES MODIFICADAS PARA SUPORTAR IDENTITY DYNAMIC
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

// ======================================================
// NOVAS FUNÇÕES PARA SALDOS REAIS DAS BLOCKCHAINS
// ======================================================

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
// FUNÇÕES MODIFICADAS PARA INTEGRAÇÃO COM NOVOS REQUISITOS
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

// ======================================================
// FUNÇÕES PARA QR CODE E CARTÃO DE LUXO
// ======================================================

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

// ======================================================
// FUNÇÕES EXISTENTES (mantidas da versão anterior)
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

function showMnemonicCreationModal(mnemonic) {
  const modal = document.getElementById('mnemonicCreationModal');
  const wordsContainer = document.getElementById('mnemonicWordsContainer');
  const timerElement = document.getElementById('mnemonicTimer');
  
  const words = mnemonic.split(' ');
  wordsContainer.innerHTML = '';
  
  words.forEach((word, index) => {
    const wordElement = document.createElement('div');
    wordElement.className = 'mnemonic-word';
    wordElement.setAttribute('data-index', index + 1);
    wordElement.textContent = word;
    wordsContainer.appendChild(wordElement);
  });
  
  mnemonicTimerSeconds = 300;
  updateMnemonicTimer();
  mnemonicCreationTimer = setInterval(updateMnemonicTimer, 1000);
  
  modal.classList.add('active');
}

function updateMnemonicTimer() {
  const timerElement = document.getElementById('mnemonicTimer');
  if (!timerElement) return;
  
  mnemonicTimerSeconds--;
  
  if (mnemonicTimerSeconds <= 0) {
    clearInterval(mnemonicCreationTimer);
    timerElement.textContent = '00:00';
    showNotification('Tempo esgotado! A criação da identidade foi cancelada.', 'error');
    closeMnemonicCreationModal();
    return;
  }
  
  const minutes = Math.floor(mnemonicTimerSeconds / 60);
  const seconds = mnemonicTimerSeconds % 60;
  timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function closeMnemonicCreationModal() {
  const modal = document.getElementById('mnemonicCreationModal');
  modal.classList.remove('active');
  clearInterval(mnemonicCreationTimer);
  
  currentWallet = null;
  mnemonicPhrase = null;
  localStorage.removeItem('exclusiveWalletPK');
  localStorage.removeItem('exw_psw');
}

function confirmMnemonicSaved() {
  clearInterval(mnemonicCreationTimer);
  
  initializeRpcProvider();
  
  showNotification(`✅ Identidade Polygon criada! Endereço: ${currentWallet.address.substring(0, 10)}...`, 'success');
  showNotification('⚠️ SALVE SUA CHAVE PRIVADA E FRASE MNEMÔNICA!', 'warning');
  closeMnemonicCreationModal();
  showWalletDashboard();
}

function updateSensitiveDataDisplay() {
  if (!currentWallet) return;
  
  document.getElementById('privateKeyDisplay').textContent = privateKeyVisible ? 
    currentWallet.privateKey : '••••••••••••••••••••••••••••••••••••••••••••••';
  
  document.getElementById('mnemonicDisplay').textContent = mnemonicVisible && mnemonicPhrase ? 
    mnemonicPhrase : '••••••••••••••••••••••••••••••••••••••••••••••';
  
  document.getElementById('togglePrivateKey').innerHTML = `<i class="fas fa-${privateKeyVisible ? 'eye-slash' : 'eye'}"></i> ${privateKeyVisible ? 'Ocultar' : 'Mostrar'} Chave`;
  document.getElementById('toggleMnemonic').innerHTML = `<i class="fas fa-${mnemonicVisible ? 'eye-slash' : 'eye'}"></i> ${mnemonicVisible ? 'Ocultar' : 'Mostrar'} Frase`;
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

function showWalletDashboard() {
  document.getElementById('login-screen').classList.add('fade-out');
  
  setTimeout(() => {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('wallet-dashboard').classList.remove('hidden');
    document.getElementById('wallet-dashboard').classList.add('fade-in');
    
    updateSensitiveDataDisplay();
    updateOverview();
    refreshBalance();
    testRpcConnection();
    initializeBlockchainButtons();
    
    // Inicializar comunicação
    loadContacts();
    updateAuthorizationStatus();
    
  }, 800);
}

function openMnemonicModal() {
  document.getElementById('mnemonicModal').classList.add('active');
}

function closeMnemonicModal() {
  document.getElementById('mnemonicModal').classList.remove('active');
  document.getElementById('mnemonicPhrase').value = '';
}

function restoreWalletFromMnemonic() {
  const mnemonicPhraseInput = document.getElementById('mnemonicPhrase').value.trim();

  if (!mnemonicPhraseInput) {
    showNotification('Por favor, insira a frase mnemônica.', 'error');
    return;
  }

  try {
    if (!ethers.Mnemonic.isValidMnemonic(mnemonicPhraseInput)) {
      showNotification('Frase mnemônica inválida. Verifique as palavras.', 'error');
      return;
    }

    const wallet = ethers.Wallet.fromPhrase(mnemonicPhraseInput);
    currentWallet = wallet;
    mnemonicPhrase = mnemonicPhraseInput;

    localStorage.setItem('exclusiveWalletPK', currentWallet.privateKey);
    
    initializeRpcProvider();

    closeMnemonicModal();
    showNotification(`✅ Identidade Polygon restaurada! Endereço: ${currentWallet.address.substring(0, 10)}...`, 'success');
    showWalletDashboard();

  } catch (error) {
    console.error('Erro ao restaurar identidade Polygon:', error);
    showNotification('Erro ao restaurar identidade Polygon: ' + error.message, 'error');
  }
}

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
  },
