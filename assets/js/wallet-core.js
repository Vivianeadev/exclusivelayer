// wallet-core.js - Núcleo da Wallet e Operações Básicas
const WalletCore = {
  // Estado
  currentWallet: null,
  mnemonicPhrase: null,
  isAddressRegistered: false,
  privateKeyVisible: false,
  mnemonicVisible: false,
  
  // Conectar com chave privada
  connectWithPrivateKey: function(privateKeyInput) {
    try {
      let privateKey = privateKeyInput.trim().replace(/\s/g, '');
      if (!privateKey.startsWith('0x')) {
        privateKey = '0x' + privateKey;
      }
      
      this.currentWallet = new ethers.Wallet(privateKey);
      localStorage.setItem('exclusiveWalletPK', privateKey);
      
      return {
        success: true,
        wallet: this.currentWallet
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Criar nova wallet
  createNewWallet: function(password = '') {
    try {
      const wallet = ethers.Wallet.createRandom();
      this.currentWallet = wallet;
      this.mnemonicPhrase = wallet.mnemonic.phrase;
      
      localStorage.setItem('exclusiveWalletPK', this.currentWallet.privateKey);
      
      if (password) {
        localStorage.setItem('exw_psw', password);
      }
      
      return {
        success: true,
        wallet: this.currentWallet,
        mnemonic: this.mnemonicPhrase
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Restaurar com mnemônica
  restoreFromMnemonic: function(mnemonicPhrase) {
    try {
      if (!ethers.Mnemonic.isValidMnemonic(mnemonicPhrase)) {
        return {
          success: false,
          error: 'Frase mnemônica inválida'
        };
      }
      
      const wallet = ethers.Wallet.fromPhrase(mnemonicPhrase);
      this.currentWallet = wallet;
      this.mnemonicPhrase = mnemonicPhrase;
      
      localStorage.setItem('exclusiveWalletPK', this.currentWallet.privateKey);
      
      return {
        success: true,
        wallet: this.currentWallet
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Obter dados sensíveis
  getSensitiveData: function() {
    if (!this.currentWallet) return null;
    
    return {
      address: this.currentWallet.address,
      privateKey: this.privateKeyVisible ? this.currentWallet.privateKey : '••••••••••••••••',
      mnemonic: this.mnemonicVisible && this.mnemonicPhrase ? this.mnemonicPhrase : '••••••••••••••••'
    };
  },
  
  // Alternar visibilidade da chave privada
  togglePrivateKeyVisibility: function() {
    this.privateKeyVisible = !this.privateKeyVisible;
    return this.privateKeyVisible;
  },
  
  // Alternar visibilidade da mnemônica
  toggleMnemonicVisibility: function() {
    this.mnemonicVisible = !this.mnemonicVisible;
    return this.mnemonicVisible;
  },
  
  // Exportar wallet
  exportWallet: function() {
    if (!this.currentWallet) return null;
    
    const walletData = {
      address: this.currentWallet.address,
      privateKey: this.currentWallet.privateKey,
      mnemonic: this.mnemonicPhrase,
      chain: 'Polygon',
      exportDate: new Date().toISOString()
    };
    
    return walletData;
  },
  
  // Desconectar
  disconnect: function() {
    this.currentWallet = null;
    this.mnemonicPhrase = null;
    this.isAddressRegistered = false;
    this.privateKeyVisible = false;
    this.mnemonicVisible = false;
    
    localStorage.removeItem('exclusiveWalletPK');
    localStorage.removeItem('exclusiveWalletAddressRegistered');
    
    return true;
  },
  
  // Verificar se está conectado
  isConnected: function() {
    return !!this.currentWallet;
  },
  
  // Registrar endereço
  registerAddress: function() {
    this.isAddressRegistered = true;
    localStorage.setItem('exclusiveWalletAddressRegistered', 'true');
    return true;
  },
  
  // Restaurar da sessão
  restoreFromSession: function() {
    const savedPK = localStorage.getItem('exclusiveWalletPK');
    if (!savedPK) return false;
    
    try {
      this.currentWallet = new ethers.Wallet(savedPK);
      this.isAddressRegistered = localStorage.getItem('exclusiveWalletAddressRegistered') === 'true';
      return true;
    } catch (error) {
      return false;
    }
  }
};
