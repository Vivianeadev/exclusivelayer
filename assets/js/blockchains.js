// assets/js/blockchains.js
const Blockchains = {
    // Lista completa de 20 blockchains
    list: [
        {
            id: 'polygon',
            name: 'Polygon',
            symbol: 'MATIC',
            chainId: 137,
            rpcUrls: [
                'https://polygon-rpc.com',
                'https://identitydynamic.avizaecosystem.workers.dev',
                'https://rpc-mainnet.maticvigil.com',
                'https://polygon-mainnet.infura.io/v3/',
                'https://matic-mainnet.chainstacklabs.com'
            ],
            explorer: 'https://polygonscan.com',
            decimals: 18,
            color: '#8247E5',
            icon: 'fas fa-gem'
        },
        {
            id: 'ethereum',
            name: 'Ethereum',
            symbol: 'ETH',
            chainId: 1,
            rpcUrls: ['https://mainnet.infura.io/v3/'],
            explorer: 'https://etherscan.io',
            decimals: 18,
            color: '#627EEA',
            icon: 'fab fa-ethereum'
        },
        {
            id: 'bsc',
            name: 'BSC',
            symbol: 'BNB',
            chainId: 56,
            rpcUrls: ['https://bsc-dataseed.binance.org/'],
            explorer: 'https://bscscan.com',
            decimals: 18,
            color: '#F0B90B',
            icon: 'fas fa-exchange-alt'
        },
        {
            id: 'avalanche',
            name: 'Avalanche',
            symbol: 'AVAX',
            chainId: 43114,
            rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
            explorer: 'https://snowtrace.io',
            decimals: 18,
            color: '#E84142',
            icon: 'fas fa-snowflake'
        },
        {
            id: 'fantom',
            name: 'Fantom',
            symbol: 'FTM',
            chainId: 250,
            rpcUrls: ['https://rpc.ftm.tools/'],
            explorer: 'https://ftmscan.com',
            decimals: 18,
            color: '#1969FF',
            icon: 'fas fa-bolt'
        },
        {
            id: 'arbitrum',
            name: 'Arbitrum',
            symbol: 'ETH',
            chainId: 42161,
            rpcUrls: ['https://arb1.arbitrum.io/rpc'],
            explorer: 'https://arbiscan.io',
            decimals: 18,
            color: '#28A0F0',
            icon: 'fas fa-layer-group'
        },
        {
            id: 'optimism',
            name: 'Optimism',
            symbol: 'ETH',
            chainId: 10,
            rpcUrls: ['https://mainnet.optimism.io'],
            explorer: 'https://optimistic.etherscan.io',
            decimals: 18,
            color: '#FF0420',
            icon: 'fas fa-chart-line'
        },
        {
            id: 'base',
            name: 'Base',
            symbol: 'ETH',
            chainId: 8453,
            rpcUrls: ['https://mainnet.base.org'],
            explorer: 'https://basescan.org',
            decimals: 18,
            color: '#0052FF',
            icon: 'fas fa-database'
        },
        {
            id: 'cronos',
            name: 'Cronos',
            symbol: 'CRO',
            chainId: 25,
            rpcUrls: ['https://evm.cronos.org'],
            explorer: 'https://cronoscan.com',
            decimals: 18,
            color: '#121926',
            icon: 'fas fa-clock'
        },
        {
            id: 'harmony',
            name: 'Harmony',
            symbol: 'ONE',
            chainId: 1666600000,
            rpcUrls: ['https://api.harmony.one'],
            explorer: 'https://explorer.harmony.one',
            decimals: 18,
            color: '#00AEE9',
            icon: 'fas fa-music'
        },
        {
            id: 'kava',
            name: 'Kava',
            symbol: 'KAVA',
            chainId: 2222,
            rpcUrls: ['https://evm.kava.io'],
            explorer: 'https://explorer.kava.io',
            decimals: 18,
            color: '#FF433E',
            icon: 'fas fa-shield-alt'
        },
        {
            id: 'celo',
            name: 'Celo',
            symbol: 'CELO',
            chainId: 42220,
            rpcUrls: ['https://forno.celo.org'],
            explorer: 'https://celoscan.io',
            decimals: 18,
            color: '#35D07F',
            icon: 'fas fa-leaf'
        },
        {
            id: 'moonbeam',
            name: 'Moonbeam',
            symbol: 'GLMR',
            chainId: 1284,
            rpcUrls: ['https://rpc.api.moonbeam.network'],
            explorer: 'https://moonscan.io',
            decimals: 18,
            color: '#53CBC9',
            icon: 'fas fa-moon'
        },
        {
            id: 'moonriver',
            name: 'Moonriver',
            symbol: 'MOVR',
            chainId: 1285,
            rpcUrls: ['https://rpc.api.moonriver.moonbeam.network'],
            explorer: 'https://moonriver.moonscan.io',
            decimals: 18,
            color: '#F3B404',
            icon: 'fas fa-water'
        },
        {
            id: 'gnosis',
            name: 'Gnosis',
            symbol: 'xDAI',
            chainId: 100,
            rpcUrls: ['https://rpc.gnosischain.com'],
            explorer: 'https://gnosisscan.io',
            decimals: 18,
            color: '#04795B',
            icon: 'fas fa-brain'
        },
        {
            id: 'fuse',
            name: 'Fuse',
            symbol: 'FUSE',
            chainId: 122,
            rpcUrls: ['https://rpc.fuse.io'],
            explorer: 'https://explorer.fuse.io',
            decimals: 18,
            color: '#46E8B6',
            icon: 'fas fa-bolt'
        },
        {
            id: 'metis',
            name: 'Metis',
            symbol: 'METIS',
            chainId: 1088,
            rpcUrls: ['https://andromeda.metis.io/?owner=1088'],
            explorer: 'https://andromeda-explorer.metis.io',
            decimals: 18,
            color: '#00D3D5',
            icon: 'fas fa-network-wired'
        },
        {
            id: 'polygonzkevm',
            name: 'Polygon zkEVM',
            symbol: 'ETH',
            chainId: 1101,
            rpcUrls: ['https://zkevm-rpc.com'],
            explorer: 'https://zkevm.polygonscan.com',
            decimals: 18,
            color: '#8247E5',
            icon: 'fas fa-lock'
        },
        {
            id: 'linea',
            name: 'Linea',
            symbol: 'ETH',
            chainId: 59144,
            rpcUrls: ['https://rpc.linea.build'],
            explorer: 'https://lineascan.build',
            decimals: 18,
            color: '#121212',
            icon: 'fas fa-road'
        },
        {
            id: 'scroll',
            name: 'Scroll',
            symbol: 'ETH',
            chainId: 534352,
            rpcUrls: ['https://rpc.scroll.io'],
            explorer: 'https://scrollscan.com',
            decimals: 18,
            color: '#FFE66D',
            icon: 'fas fa-scroll'
        }
    ],

    // Estado atual
    current: 'polygon',
    balances: {},
    wallets: {},

    // Inicializar
    init() {
        this.loadState();
        this.updateUI();
        console.log('✅ Blockchains carregadas:', this.list.length);
    },

    // Carregar estado salvo
    loadState() {
        // Carregar chain atual
        const savedChain = localStorage.getItem('exclusiveWallet_currentChain');
        if (savedChain && this.getChain(savedChain)) {
            this.current = savedChain;
        }

        // Carregar saldos
        const savedBalances = localStorage.getItem('exclusiveWallet_balances');
        if (savedBalances) {
            this.balances = JSON.parse(savedBalances);
        } else {
            // Inicializar saldos zerados
            this.list.forEach(chain => {
                this.balances[chain.id] = '0.0000';
            });
        }

        // Carregar wallets
        const savedWallets = localStorage.getItem('exclusiveWallet_wallets');
        if (savedWallets) {
            this.wallets = JSON.parse(savedWallets);
        }
    },

    // Salvar estado
    saveState() {
        localStorage.setItem('exclusiveWallet_currentChain', this.current);
        localStorage.setItem('exclusiveWallet_balances', JSON.stringify(this.balances));
        localStorage.setItem('exclusiveWallet_wallets', JSON.stringify(this.wallets));
    },

    // Obter chain por ID
    getChain(id) {
        return this.list.find(c => c.id === id);
    },

    // Obter chain atual
    getCurrentChain() {
        return this.getChain(this.current);
    },

    // Mudar chain atual
    setCurrentChain(chainId) {
        const chain = this.getChain(chainId);
        if (chain) {
            this.current = chainId;
            this.saveState();
            
            // Atualizar UI
            this.updateCurrentChainUI();
            this.updateBalanceDisplay();
            
            return true;
        }
        return false;
    },

    // Obter saldo
    getBalance(chainId) {
        return this.balances[chainId] || '0.0000';
    },

    // Definir saldo
    setBalance(chainId, balance) {
        const chain = this.getChain(chainId);
        if (chain) {
            this.balances[chainId] = parseFloat(balance).toFixed(4);
            this.saveState();
            
            // Atualizar UI se for a chain atual
            if (chainId === this.current) {
                this.updateBalanceDisplay();
            }
            
            return true;
        }
        return false;
    },

    // Atualizar saldo
    updateBalance(chainId, amount) {
        const current = parseFloat(this.getBalance(chainId)) || 0;
        const change = parseFloat(amount) || 0;
        const newBalance = (current + change).toFixed(4);
        return this.setBalance(chainId, newBalance);
    },

    // Gerar saldo aleatório (para demonstração)
    generateRandomBalance(chainId) {
        const min = 0.001;
        const max = 100;
        const random = (Math.random() * (max - min) + min).toFixed(4);
        this.setBalance(chainId, random);
        return random;
    },

    // Adicionar wallet
    addWallet(chainId, walletData) {
        if (!this.wallets[chainId]) {
            this.wallets[chainId] = [];
        }
        this.wallets[chainId].push(walletData);
        this.saveState();
        
        // Gerar saldo inicial se for primeiro wallet
        if (this.getBalance(chainId) === '0.0000') {
            this.generateRandomBalance(chainId);
        }
        
        return true;
    },

    // Remover wallet
    removeWallet(chainId, walletIndex) {
        if (this.wallets[chainId] && this.wallets[chainId][walletIndex]) {
            this.wallets[chainId].splice(walletIndex, 1);
            this.saveState();
            return true;
        }
        return false;
    },

    // Obter wallets da chain
    getWallets(chainId) {
        return this.wallets[chainId] || [];
    },

    // Atualizar UI
    updateUI() {
        this.createBlockchainButtons();
        this.updateCurrentChainUI();
        this.updateBalanceDisplay();
    },

    // Criar botões de blockchain
    createBlockchainButtons() {
        const container = document.getElementById('blockchainButtonsContainer');
        if (!container) return;

        container.innerHTML = '';

        this.list.forEach(chain => {
            const button = document.createElement('button');
            button.className = `blockchain-button ${chain.id === this.current ? 'active' : ''}`;
            button.dataset.chain = chain.id;
            button.innerHTML = `
                <i class="${chain.icon}"></i>
                <span>${chain.name}</span>
            `;

            button.addEventListener('click', () => {
                this.setCurrentChain(chain.id);
                
                // Atualizar classes ativas
                document.querySelectorAll('.blockchain-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                
                // Notificação
                if (window.showNotification) {
                    window.showNotification(`Switched to ${chain.name}`, 'success');
                }
            });

            container.appendChild(button);
        });
    },

    // Atualizar UI da chain atual
    updateCurrentChainUI() {
        const chain = this.getCurrentChain();
        if (!chain) return;

        // Atualizar elementos da UI
        const elements = [
            { id: 'currentChainName', text: chain.name },
            { id: 'currentChainSymbol', text: chain.symbol },
            { id: 'currentChainId', text: chain.chainId },
        ];

        elements.forEach(el => {
            const element = document.getElementById(el.id);
            if (element) element.textContent = el.text;
        });

        // Atualizar background se houver
        const bgElement = document.getElementById('currentChainBackground');
        if (bgElement) {
            bgElement.style.backgroundColor = `${chain.color}20`;
            bgElement.style.borderColor = chain.color;
        }
    },

    // Atualizar display do saldo
    updateBalanceDisplay() {
        const balance = this.getBalance(this.current);
        const chain = this.getCurrentChain();
        
        const balanceElement = document.getElementById('currentChainBalance');
        if (balanceElement) {
            balanceElement.textContent = balance;
        }

        // Calcular valor em USD (simulado)
        if (chain) {
            const priceMap = {
                polygon: 0.8,
                ethereum: 3500,
                bsc: 300,
                avalanche: 35,
                arbitrum: 3500,
                optimism: 3500,
                base: 3500,
                cronos: 0.1,
                harmony: 0.02,
                fantom: 0.3,
                kava: 0.7,
                celo: 0.5,
                moonbeam: 0.3,
                moonriver: 20,
                gnosis: 100,
                fuse: 0.05,
                metis: 40,
                polygonzkevm: 3500,
                linea: 3500,
                scroll: 3500
            };

            const price = priceMap[chain.id] || 1;
            const usdValue = (parseFloat(balance) * price).toFixed(2);
            
            const usdElement = document.getElementById('currentChainUSD');
            if (usdElement) {
                usdElement.textContent = `≈ $${usdValue} USD`;
            }
        }
    },

    // Buscar saldo real da Polygon (se conectado)
    async fetchRealBalance(address, rpcUrl) {
        if (this.current !== 'polygon') return null;

        try {
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            const balance = await provider.getBalance(address);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error('Erro ao buscar saldo:', error);
            return null;
        }
    },

    // Obter todas as chains
    getAll() {
        return this.list;
    },

    // Obter chains com wallets
    getChainsWithWallets() {
        return this.list.filter(chain => {
            return this.wallets[chain.id] && this.wallets[chain.id].length > 0;
        });
    },

    // Verificar se chain tem wallet
    hasWallet(chainId) {
        return !!(this.wallets[chainId] && this.wallets[chainId].length > 0);
    },

    // Limpar dados
    clear() {
        this.balances = {};
        this.wallets = {};
        this.current = 'polygon';
        this.saveState();
        this.updateUI();
    }
};

// Inicializar quando o DOM estiver pronto
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        Blockchains.init();
    });
}
