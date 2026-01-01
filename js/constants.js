// Configurações da Polygon
const POLYGON_CONFIG = {
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
const BLOCKCHAINS = [
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

// Configurações de RPC
const DEFAULT_RPC = 'https://polygon-rpc.com';
const IDENTITY_DYNAMIC_RPC = 'https://identitydynamic.avizaecosystem.workers.dev';

// Configurações de notificação
const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

// Configurações de cores para notificações
const NOTIFICATION_COLORS = {
  info: 'var(--primary-color)',
  success: 'var(--success-color)',
  warning: 'var(--warning-color)',
  error: 'var(--error-color)'
};

// Configurações de tempo
const MNEMONIC_TIMER_SECONDS = 300; // 5 minutos
const NOTIFICATION_TIMEOUT = 4000; // 4 segundos

// Status de autorização
const AUTHORIZATION_STATUS = {
  PENDING: 'pending',
  AUTHORIZED: 'authorized',
  REVOKED: 'revoked'
};

// Status de transação
const TRANSACTION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed'
};

// URLs de APIs (se necessário)
const API_ENDPOINTS = {
  GAS_PRICE: 'https://api.polygonscan.com/api?module=gastracker&action=gasoracle',
  TOKEN_PRICE: 'https://api.coingecko.com/api/v3/simple/price'
};

// Cores dos temas
const THEME_COLORS = {
  LUXURY: {
    primary: '#D4AF37',
    secondary: '#F4E4B8',
    background: '#0A0A0A'
  },
  LIGHT: {
    primary: '#D4AF37',
    secondary: '#F4E4B8',
    background: '#FFFFFF'
  }
};

// Mensagens padrão
const MESSAGES = {
  WALLET_CREATED: '✅ Identidade Polygon criada com sucesso!',
  WALLET_RESTORED: '✅ Identidade Polygon restaurada com sucesso!',
  TRANSACTION_SENT: '✅ Transação enviada com sucesso!',
  BALANCE_UPDATED: '✅ Saldo atualizado com sucesso!',
  CONTACT_ADDED: '✅ Contato adicionado com sucesso!',
  AUTHORIZATION_GRANTED: '✅ Autorização concedida com sucesso!'
};

// Erros padrão
const ERRORS = {
  INVALID_PRIVATE_KEY: 'Chave privada inválida. Verifique o formato.',
  INVALID_MNEMONIC: 'Frase mnemônica inválida. Verifique as palavras.',
  INVALID_ADDRESS: 'Endereço inválido. Verifique o formato.',
  RPC_CONNECTION_FAILED: 'Falha na conexão com o RPC.',
  INSUFFICIENT_BALANCE: 'Saldo insuficiente para a transação.',
  NETWORK_ERROR: 'Erro de rede. Verifique sua conexão.'
};

// Exportar constantes para uso global
if (typeof window !== 'undefined') {
  window.CONSTANTS = {
    POLYGON_CONFIG,
    BLOCKCHAINS,
    DEFAULT_RPC,
    IDENTITY_DYNAMIC_RPC,
    NOTIFICATION_TYPES,
    NOTIFICATION_COLORS,
    MNEMONIC_TIMER_SECONDS,
    NOTIFICATION_TIMEOUT,
    AUTHORIZATION_STATUS,
    TRANSACTION_STATUS,
    API_ENDPOINTS,
    THEME_COLORS,
    MESSAGES,
    ERRORS
  };
}
