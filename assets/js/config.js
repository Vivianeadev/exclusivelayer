// VARIÁVEIS GLOBAIS COMPARTILHADAS
const { ethers } = window;

// CONFIGURAÇÕES DA POLYGON
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

// SALDOS REAIS DAS BLOCKCHAINS (inicial)
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

// CONFIGURAÇÃO WEBRTC (STUN SERVERS)
const stunServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};