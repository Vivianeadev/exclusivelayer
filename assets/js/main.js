// CONFIGURAÇÕES GLOBAIS
let currentWallet = null;
let currentChain = 'polygon';
let theme = 'luxury';

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', function() {
  console.log('Exclusive Wallet Premium iniciado');
  
  // Verificar wallet salva
  const savedWallet = localStorage.getItem('wallet_privateKey');
  if (savedWallet) {
    try {
      currentWallet = new ethers.Wallet(savedWallet);
      showDashboard();
    } catch (error) {
      console.error('Erro ao restaurar wallet:', error);
      localStorage.removeItem('wallet_privateKey');
    }
  }
  
  // Event Listeners básicos
  document.getElementById('connectBtn').addEventListener('click', connectWallet);
  document.getElementById('createBtn').addEventListener('click', createWallet);
});

// FUNÇÕES BÁSICAS
async function connectWallet() {
  const privateKey = document.getElementById('privateKey').value.trim();
  if (!privateKey) return alert('Insira a chave privada');
  
  try {
    currentWallet = new ethers.Wallet(privateKey);
    localStorage.setItem('wallet_privateKey', privateKey);
    showDashboard();
    alert('Conectado!');
  } catch (error) {
    alert('Chave inválida');
  }
}

async function createWallet() {
  try {
    const wallet = ethers.Wallet.createRandom();
    currentWallet = wallet;
    localStorage.setItem('wallet_privateKey', wallet.privateKey);
    
    alert(`Nova wallet criada!\nEndereço: ${wallet.address}\nSalve a chave privada!`);
    showDashboard();
  } catch (error) {
    alert('Erro ao criar wallet');
  }
}

function showDashboard() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  
  // Carregar dados iniciais
  loadDashboard();
}

async function loadDashboard() {
  if (!currentWallet) return;
  
  // Exibir endereço
  document.getElementById('walletAddress').textContent = 
    `${currentWallet.address.slice(0, 10)}...${currentWallet.address.slice(-8)}`;
  
  // Buscar saldo da chain atual
  const balance = await getChainBalance(currentChain, currentWallet.address);
  document.getElementById('balance').textContent = `${balance} ${BLOCKCHAINS[currentChain].symbol}`;
}

// TROCAR TEMA
function toggleTheme() {
  theme = theme === 'light' ? 'luxury' : 'light';
  document.body.className = `theme-${theme}`;
  localStorage.setItem('wallet_theme', theme);
}

// EXPORTAR
window.toggleTheme = toggleTheme;
window.currentWallet = currentWallet;
window.currentChain = currentChain;
