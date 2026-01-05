// assets/js/wallet-core.js
const WalletCore = {
    // Estado da wallet
    currentWallet: null,
    mnemonic: null,
    isConnected: false,
    isRegistered: false,

    // Configurações
    config: {
        storageKey: 'exclusiveWallet',
        autoConnect: true
    },

    // Inicializar
    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        console.log('✅ WalletCore inicializado');
    },

    // Carregar do armazenamento
    loadFromStorage() {
        try {
            const saved = localStorage.getItem(this.config.storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                
                if (data.privateKey) {
                    this.currentWallet = new ethers.Wallet(data.privateKey);
                    this.isConnected = true;
                    this.mnemonic = data.mnemonic || null;
                    this.isRegistered = data.isRegistered || false;
                    
                    console.log('Wallet restaurada:', this.currentWallet.address);
                    return true;
                }
            }
        } catch (error) {
            console.error('Erro ao carregar wallet:', error);
        }
        return false;
    },

    // Salvar no armazenamento
    saveToStorage() {
        if (!this.currentWallet) return false;

        const data = {
            address: this.currentWallet.address,
            privateKey: this.currentWallet.privateKey,
            mnemonic: this.mnemonic,
            isRegistered: this.isRegistered,
            lastAccess: new Date().toISOString()
        };

        try {
            localStorage.setItem(this.config.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Erro ao salvar wallet:', error);
            return false;
        }
    },

    // Conectar com chave privada
    connectWithPrivateKey(privateKey) {
        try {
            // Limpar e formatar chave
            let cleanKey = privateKey.trim();
            if (!cleanKey.startsWith('0x')) {
                cleanKey = '0x' + cleanKey;
            }

            // Validar formato
            if (cleanKey.length !== 66) {
                throw new Error('Chave privada inválida: deve ter 64 caracteres hex + 0x');
            }

            // Criar wallet
            this.currentWallet = new ethers.Wallet(cleanKey);
            this.isConnected = true;
            this.saveToStorage();

            console.log('Wallet conectada:', this.currentWallet.address);
            return {
                success: true,
                address: this.currentWallet.address,
                message: 'Wallet conectada com sucesso'
            };

        } catch (error) {
            console.error('Erro ao conectar:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Criar nova wallet
    createNewWallet(password = '') {
        try {
            // Criar wallet aleatória
            const wallet = ethers.Wallet.createRandom();
            this.currentWallet = wallet;
            this.mnemonic = wallet.mnemonic?.phrase || null;
            this.isConnected = true;

            // Salvar senha se fornecida
            if (password) {
                localStorage.setItem(`${this.config.storageKey}_password`, password);
            }

            this.saveToStorage();

            return {
                success: true,
                address: wallet.address,
                mnemonic: this.mnemonic,
                privateKey: wallet.privateKey,
                message: 'Nova wallet criada com sucesso'
            };

        } catch (error) {
            console.error('Erro ao criar wallet:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Restaurar com mnemônica
    restoreFromMnemonic(mnemonicPhrase, password = '') {
        try {
            // Validar mnemônica
            if (!ethers.Mnemonic.isValidMnemonic(mnemonicPhrase)) {
                throw new Error('Frase mnemônica inválida');
            }

            // Restaurar wallet
            const wallet = ethers.Wallet.fromPhrase(mnemonicPhrase);
            this.currentWallet = wallet;
            this.mnemonic = mnemonicPhrase;
            this.isConnected = true;

            // Salvar senha se fornecida
            if (password) {
                localStorage.setItem(`${this.config.storageKey}_password`, password);
            }

            this.saveToStorage();

            return {
                success: true,
                address: wallet.address,
                message: 'Wallet restaurada com sucesso'
            };

        } catch (error) {
            console.error('Erro ao restaurar wallet:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Registrar endereço
    registerAddress() {
        if (!this.currentWallet) {
            return {
                success: false,
                error: 'Nenhuma wallet conectada'
            };
        }

        this.isRegistered = true;
        this.saveToStorage();

        return {
            success: true,
            address: this.currentWallet.address,
            message: 'Endereço registrado com sucesso'
        };
    },

    // Desconectar
    disconnect() {
        this.currentWallet = null;
        this.mnemonic = null;
        this.isConnected = false;
        this.isRegistered = false;

        // Limpar armazenamento
        localStorage.removeItem(this.config.storageKey);
        localStorage.removeItem(`${this.config.storageKey}_password`);

        return {
            success: true,
            message: 'Wallet desconectada'
        };
    },

    // Obter informações da wallet
    getWalletInfo() {
        if (!this.currentWallet) {
            return null;
        }

        return {
            address: this.currentWallet.address,
            privateKey: this.currentWallet.privateKey,
            mnemonic: this.mnemonic,
            isConnected: this.isConnected,
            isRegistered: this.isRegistered,
            shortAddress: `${this.currentWallet.address.substring(0, 6)}...${this.currentWallet.address.substring(38)}`
        };
    },

    // Assinar mensagem
    async signMessage(message) {
        if (!this.currentWallet) {
            throw new Error('Nenhuma wallet conectada');
        }

        try {
            const signature = await this.currentWallet.signMessage(message);
            return signature;
        } catch (error) {
            console.error('Erro ao assinar mensagem:', error);
            throw error;
        }
    },

    // Verificar assinatura
    verifySignature(message, signature, address) {
        try {
            const recoveredAddress = ethers.verifyMessage(message, signature);
            return recoveredAddress.toLowerCase() === address.toLowerCase();
        } catch (error) {
            console.error('Erro ao verificar assinatura:', error);
            return false;
        }
    },

    // Exportar wallet
    exportWallet(format = 'json') {
        if (!this.currentWallet) {
            return null;
        }

        const data = {
            address: this.currentWallet.address,
            privateKey: this.currentWallet.privateKey,
            mnemonic: this.mnemonic,
            exportedAt: new Date().toISOString(),
            format: 'exclusive-wallet-export'
        };

        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'object') {
            return data;
        }

        return null;
    },

    // Verificar se está conectada
    checkConnection() {
        return this.isConnected && this.currentWallet !== null;
    },

    // Configurar event listeners
    setupEventListeners() {
        // Eventos serão configurados no main.js
    },

    // Validar endereço
    isValidAddress(address) {
        try {
            return ethers.isAddress(address);
        } catch (error) {
            return false;
        }
    },

    // Formatar endereço
    formatAddress(address, start = 6, end = 4) {
        if (!address || address.length < 42) return address;
        return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
    },

    // Limpar tudo
    clearAll() {
        this.disconnect();
        localStorage.clear();
        return true;
    }
};
