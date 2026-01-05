// CONFIGURAÇÕES REAIS DAS BLOCKCHAINS
const BLOCKCHAINS = {
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    chainId: 137,
    rpc: [
      'https://polygon-rpc.com',
      'https://rpc-mainnet.maticvigil.com',
      'https://polygon-mainnet.infura.io/v3/'
    ],
    explorer: 'https://polygonscan.com',
    decimals: 18,
    logo: 'polygon.svg'
  },
  
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: 1,
    rpc: [
      'https://eth.llamarpc.com',
      'https://rpc.ankr.com/eth',
      'https://eth-mainnet.public.blastapi.io'
    ],
    explorer: 'https://etherscan.io',
    decimals: 18,
    logo: 'ethereum.svg'
  },
  
  bsc: {
    id: 'bsc',
    name: 'Binance Smart Chain',
    symbol: 'BNB',
    chainId: 56,
    rpc: [
      'https://bsc-dataseed.binance.org',
      'https://bsc-dataseed1.defibit.io',
      'https://bsc-dataseed1.ninicoin.io'
    ],
    explorer: 'https://bscscan.com',
    decimals: 18,
    logo: 'bsc.svg'
  },
  
  // Adicione outras 17 blockchains aqui
  // Mantenha o mesmo formato
};

// TOKENS POPULARES POR BLOCKCHAIN
const TOKENS = {
  polygon: [
    {
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6
    },
    {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6
    },
    {
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18
    }
  ],
  
  ethereum: [
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6
    }
  ]
  
  // Adicione tokens para outras chains
};

// FUNÇÕES PARA BUSCAR DADOS REAIS
async function getChainBalance(chainId, address) {
  const chain = BLOCKCHAINS[chainId];
  if (!chain) return '0';
  
  try {
    // Usar o primeiro RPC da lista
    const provider = new ethers.JsonRpcProvider(chain.rpc[0], {
      chainId: chain.chainId,
      name: chain.name
    });
    
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error(`Erro ao buscar saldo ${chainId}:`, error);
    return '0';
  }
}

async function getTokenBalance(chainId, tokenAddress, walletAddress) {
  const chain = BLOCKCHAINS[chainId];
  if (!chain) return '0';
  
  try {
    const provider = new ethers.JsonRpcProvider(chain.rpc[0]);
    
    // ABI mínima para balanceOf
    const abi = ['function balanceOf(address owner) view returns (uint256)'];
    const contract = new ethers.Contract(tokenAddress, abi, provider);
    
    const balance = await contract.balanceOf(walletAddress);
    const token = TOKENS[chainId]?.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
    const decimals = token?.decimals || 18;
    
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error(`Erro ao buscar token ${tokenAddress}:`, error);
    return '0';
  }
}

// EXPORTAR PARA USO GLOBAL
window.BLOCKCHAINS = BLOCKCHAINS;
window.TOKENS = TOKENS;
window.getChainBalance = getChainBalance;
window.getTokenBalance = getTokenBalance;
