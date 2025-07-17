import { ethers } from 'ethers';

// ========================================
// 🎯 INTERFACES & TYPES
// ========================================

interface GasConfiguration {
  maxGasPrice: bigint;                    // Maximum gas price in wei
  maxPriorityFeePerGas: bigint;          // Maximum priority fee (EIP-1559)
  gasLimit: bigint;                      // Default gas limit
  gasMultiplier: number;                 // Gas estimation multiplier (1.2 = 20% extra)
  eip1559Enabled: boolean;               // Support for EIP-1559 transactions
  dynamicGasEstimation: boolean;         // Use dynamic gas estimation
  gasOracleUrl?: string;                 // External gas oracle URL
  emergencyGasPrice: bigint;             // Emergency gas price for critical operations
}

interface FlashloanProvider {
  name: string;                          // Provider name (Aave, dYdX, etc.)
  contractAddress: string;               // Flashloan contract address
  poolAddress?: string;                  // Pool address if applicable
  supportedTokens: string[];             // Supported token addresses
  maxLoanAmount: Record<string, bigint>; // Max loan amount per token
  feePercentage: number;                 // Fee percentage (0.0009 = 0.09%)
  isActive: boolean;                     // Is provider currently active
  priority: number;                      // Provider priority (1 = highest)
  gasEstimate: bigint;                   // Estimated gas for flashloan
}

interface DEXConfiguration {
  name: string;                          // DEX name
  routerAddress: string;                 // Router contract address
  factoryAddress: string;                // Factory contract address
  initCodeHash: string;                  // Init code hash for pair calculation
  feePercentage: number;                 // Trading fee percentage
  supportedFeeTiers?: number[];          // Fee tiers for V3 DEXes
  quoterAddress?: string;                // Quoter contract (V3)
  isV3: boolean;                         // Is this a V3-style DEX
  isActive: boolean;                     // Is DEX currently active
  priority: number;                      // DEX priority for routing
  maxSlippage: number;                   // Maximum allowed slippage
  minLiquidity: bigint;                  // Minimum liquidity requirement
}

interface BridgeConfiguration {
  name: string;                          // Bridge name
  contractAddress: string;               // Bridge contract address
  supportedChains: number[];             // Supported chain IDs
  supportedTokens: string[];             // Supported token addresses
  feePercentage: number;                 // Bridge fee percentage
  minBridgeAmount: bigint;               // Minimum bridge amount
  maxBridgeAmount: bigint;               // Maximum bridge amount
  estimatedTime: number;                 // Estimated bridge time in seconds
  isActive: boolean;                     // Is bridge currently active
}

interface OracleConfiguration {
  name: string;                          // Oracle name (Chainlink, etc.)
  aggregatorAddress: string;             // Price aggregator address
  baseCurrency: string;                  // Base currency (USD, ETH)
  decimals: number;                      // Price decimals
  heartbeat: number;                     // Update frequency in seconds
  isActive: boolean;                     // Is oracle currently active
  fallbackOracles?: string[];            // Fallback oracle addresses
}

interface NetworkMonitoring {
  blockExplorer: string;                 // Block explorer URL
  blockExplorerApi: string;              // Block explorer API URL
  statusPageUrl?: string;                // Network status page
  twitterHandle?: string;                // Official Twitter handle
  telegramChannel?: string;              // Official Telegram channel
  discordServer?: string;                // Official Discord server
  healthCheckEndpoint?: string;          // Network health check endpoint
}

interface SecuritySettings {
  maxTransactionValue: bigint;           // Maximum transaction value
  dailyTransactionLimit: bigint;         // Daily transaction limit
  suspiciousActivityThreshold: number;   // Suspicious activity threshold
  blacklistedAddresses: string[];        // Blacklisted contract addresses
  whitelistedAddresses: string[];        // Whitelisted addresses only mode
  enableMEVProtection: boolean;          // Enable MEV protection
  requireMultisig: boolean;              // Require multisig for large transactions
  enableTimelock: boolean;               // Enable timelock for critical operations
}

interface NetworkConfiguration {
  // Basic Network Info
  chainId: number;                       // Chain ID
  name: string;                          // Network name
  displayName: string;                   // Display name for UI
  symbol: string;                        // Native token symbol
  decimals: number;                      // Native token decimals
  
  // RPC Configuration
  rpcUrls: string[];                     // RPC endpoints (primary and fallbacks)
  websocketUrls: string[];               // WebSocket endpoints
  privateRpcUrls?: string[];             // Private/paid RPC endpoints
  rpcTimeout: number;                    // RPC timeout in milliseconds
  maxRetries: number;                    // Maximum RPC retry attempts
  retryDelay: number;                    // Delay between retries
  
  // Network Properties
  isMainnet: boolean;                    // Is this mainnet
  isTestnet: boolean;                    // Is this testnet
  isLayer2: boolean;                     // Is this Layer 2
  parentChainId?: number;                // Parent chain ID for L2s
  confirmationBlocks: number;            // Required confirmation blocks
  blockTime: number;                     // Average block time in seconds
  
  // Gas Configuration
  gasConfig: GasConfiguration;
  
  // DEX Configuration
  dexes: DEXConfiguration[];
  
  // Flashloan Providers
  flashloanProviders: FlashloanProvider[];
  
  // Bridge Configuration
  bridges: BridgeConfiguration[];
  
  // Oracle Configuration
  oracles: Record<string, OracleConfiguration>; // token -> oracle config
  
  // Monitoring
  monitoring: NetworkMonitoring;
  
  // Security
  security: SecuritySettings;
  
  // Feature Flags
  features: {
    enableArbitrage: boolean;            // Enable arbitrage on this network
    enableCrossChain: boolean;           // Enable cross-chain operations
    enableFlashloan: boolean;            // Enable flashloan operations
    enableLimitOrders: boolean;          // Enable limit orders
    enableMEVProtection: boolean;        // Enable MEV protection
    enableBridging: boolean;             // Enable bridging operations
  };
  
  // Token Configuration
  tokens: {
    weth: string;                        // Wrapped ETH address
    usdc: string;                        // USDC address
    usdt: string;                        // USDT address
    dai: string;                         // DAI address
    wbtc: string;                        // Wrapped BTC address
    stablecoins: string[];               // All stablecoin addresses
    commonTokens: string[];              // Common trading tokens
    lpTokens: string[];                  // LP token addresses
  };
  
  // Contract Addresses
  contracts: {
    multicall: string;                   // Multicall contract
    permit2: string;                     // Permit2 contract
    weth: string;                        // WETH contract
    flashloanExecutor: string;           // Our flashloan executor
    arbitrageEngine: string;             // Our arbitrage engine
    gasOracle: string;                   // Gas price oracle
  };
  
  // Network Status
  status: {
    isActive: boolean;                   // Is network currently active
    maintenanceMode: boolean;            // Is network in maintenance
    lastHealthCheck: number;             // Last health check timestamp
    avgLatency: number;                  // Average RPC latency
    successRate: number;                 // RPC success rate percentage
    congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; // Network congestion
  };
}

// ========================================
// 🌐 NETWORK CONFIGURATIONS
// ========================================

export const ETHEREUM_MAINNET: NetworkConfiguration = {
  // Basic Info
  chainId: 1,
  name: 'ethereum',
  displayName: 'Ethereum Mainnet',
  symbol: 'ETH',
  decimals: 18,
  
  // RPC Configuration
  rpcUrls: [
    'https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY',
    'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    'https://rpc.ankr.com/eth',
    'https://ethereum.publicnode.com',
    'https://cloudflare-eth.com'
  ],
  websocketUrls: [
    'wss://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY',
    'wss://mainnet.infura.io/ws/v3/YOUR_INFURA_KEY'
  ],
  privateRpcUrls: [
    'https://rpc.flashbots.net',
    'https://api.edennetwork.io/v1/rpc'
  ],
  rpcTimeout: 10000,
  maxRetries: 3,
  retryDelay: 1000,
  
  // Network Properties
  isMainnet: true,
  isTestnet: false,
  isLayer2: false,
  confirmationBlocks: 12,
  blockTime: 12,
  
  // Gas Configuration
  gasConfig: {
    maxGasPrice: ethers.parseUnits('300', 'gwei'),
    maxPriorityFeePerGas: ethers.parseUnits('5', 'gwei'),
    gasLimit: BigInt(500000),
    gasMultiplier: 1.2,
    eip1559Enabled: true,
    dynamicGasEstimation: true,
    gasOracleUrl: 'https://gasstation-mainnet.matic.network',
    emergencyGasPrice: ethers.parseUnits('500', 'gwei')
  },
  
  // DEX Configuration
  dexes: [
    {
      name: 'Uniswap V3',
      routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      initCodeHash: '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54',
      feePercentage: 0.003,
      supportedFeeTiers: [500, 3000, 10000],
      quoterAddress: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
      isV3: true,
      isActive: true,
      priority: 1,
      maxSlippage: 0.05,
      minLiquidity: ethers.parseEther('10')
    },
    {
      name: 'Uniswap V2',
      routerAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      factoryAddress: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      initCodeHash: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
      feePercentage: 0.003,
      isV3: false,
      isActive: true,
      priority: 2,
      maxSlippage: 0.05,
      minLiquidity: ethers.parseEther('5')
    },
    {
      name: 'SushiSwap',
      routerAddress: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
      factoryAddress: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
      initCodeHash: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
      feePercentage: 0.003,
      isV3: false,
      isActive: true,
      priority: 3,
      maxSlippage: 0.05,
      minLiquidity: ethers.parseEther('5')
    },
    {
      name: 'Curve',
      routerAddress: '0x99a58482BD75cbab83b27EC03CA68fF489b5788f',
      factoryAddress: '0xB9fC157394Af804a3578134A6585C0dc9cc990d4',
      initCodeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      feePercentage: 0.0004,
      isV3: false,
      isActive: true,
      priority: 4,
      maxSlippage: 0.02,
      minLiquidity: ethers.parseEther('100')
    }
  ],
  
  // Flashloan Providers
  flashloanProviders: [
    {
      name: 'Aave V3',
      contractAddress: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
      poolAddress: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
      supportedTokens: [
        '0xA0b86a33E6417E86cbcD9C63c115b4e8e8fbA158', // WETH
        '0xA0b86a33E6417E86cbcD9C63c115b4e8e8fbA158', // USDC
        '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
        '0x6B175474E89094C44Da98b954EedeAC495271d0F'  // DAI
      ],
      maxLoanAmount: {
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': ethers.parseEther('10000'), // WETH
        '0xA0b86a33E6417E86cbcD9C63c115b4e8e8fbA158': BigInt('100000000000'), // USDC (100M)
        '0xdAC17F958D2ee523a2206206994597C13D831ec7': BigInt('100000000000'), // USDT
        '0x6B175474E89094C44Da98b954EedeAC495271d0F': ethers.parseEther('100000000') // DAI
      },
      feePercentage: 0.0009,
      isActive: true,
      priority: 1,
      gasEstimate: BigInt(300000)
    },
    {
      name: 'dYdX',
      contractAddress: '0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e',
      supportedTokens: [
        '0xA0b86a33E6417E86cbcD9C63c115b4e8e8fbA158', // WETH
        '0xA0b86a33E6417E86cbcD9C63c115b4e8e8fbA158', // USDC
        '0x6B175474E89094C44Da98b954EedeAC495271d0F'  // DAI
      ],
      maxLoanAmount: {
        '0xA0b86a33E6417E86cbcD9C63c115b4e8e8fbA158': ethers.parseEther('5000'),
        // '0xA0b86a33E6417E86cbcD9C63c115b4e8e8fbA158': BigInt('50000000000'), // Removed duplicate key
        '0x6B175474E89094C44Da98b954EedeAC495271d0F': ethers.parseEther('50000000')
      },
      feePercentage: 0.0,
      isActive: true,
      priority: 2,
      gasEstimate: BigInt(250000)
    }
  ],
  
  // Bridge Configuration
  bridges: [
    {
      name: 'Polygon Bridge',
      contractAddress: '0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf',
      supportedChains: [137],
      supportedTokens: [
        '0xA0b86a33E6417E86cbcD9C63c115b4e8e8fbA158',
        '0xA0b86a33E6417E86cbcD9C63c115b4e8e8fbA158',
        '0x6B175474E89094C44Da98b954EedeAC495271d0F'
      ],
      feePercentage: 0.001,
      minBridgeAmount: ethers.parseEther('0.01'),
      maxBridgeAmount: ethers.parseEther('1000'),
      estimatedTime: 1800,
      isActive: true
    }
  ],
  
  // Oracle Configuration
  oracles: {
    'ETH/USD': {
      name: 'Chainlink ETH/USD',
      aggregatorAddress: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
      baseCurrency: 'USD',
      decimals: 8,
      heartbeat: 3600,
      isActive: true,
      fallbackOracles: ['0x37bC7498f4FF12C19678ee8fE19d713b87F6a9e6']
    },
    'BTC/USD': {
      name: 'Chainlink BTC/USD',
      aggregatorAddress: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
      baseCurrency: 'USD',
      decimals: 8,
      heartbeat: 3600,
      isActive: true
    }
  },
  
  // Monitoring
  monitoring: {
    blockExplorer: 'https://etherscan.io',
    blockExplorerApi: 'https://api.etherscan.io/api',
    statusPageUrl: 'https://ethstats.net',
    twitterHandle: '@ethereum',
    healthCheckEndpoint: 'https://chainlist.org/chain/1'
  },
  
  // Security Settings
  security: {
    maxTransactionValue: ethers.parseEther('1000'),
    dailyTransactionLimit: ethers.parseEther('10000'),
    suspiciousActivityThreshold: 10,
    blacklistedAddresses: [],
    whitelistedAddresses: [],
    enableMEVProtection: true,
    requireMultisig: false,
    enableTimelock: false
  },
  
  // Feature Flags
  features: {
    enableArbitrage: true,
    enableCrossChain: true,
    enableFlashloan: true,
    enableLimitOrders: true,
    enableMEVProtection: true,
    enableBridging: true
  },
  
  // Token Configuration
  tokens: {
    weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    usdc: '0xA0b86a33E6417E86cbcD9C63c115b4e8e8fbA158',
    usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    dai: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    wbtc: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    stablecoins: [
      '0xA0b86a33E6417E86cbcD9C63c115b4e8e8fbA158', // USDC
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
      '0x853d955aCEf822Db058eb8505911ED77F175b99e'  // FRAX
    ],
    commonTokens: [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      '0xA0b86a33E6417E86cbcD9C63c115b4e8e8fbA158', // USDC
      '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
      '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI
      '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'  // AAVE
    ],
    lpTokens: []
  },
  
  // Contract Addresses
  contracts: {
    multicall: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
    permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
    weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    flashloanExecutor: '0x0000000000000000000000000000000000000000',
    arbitrageEngine: '0x0000000000000000000000000000000000000000',
    gasOracle: '0x169E633A2D1E6c10dD91238Ba11c4A708dfEF37C'
  },
  
  // Network Status
  status: {
    isActive: true,
    maintenanceMode: false,
    lastHealthCheck: Date.now(),
    avgLatency: 150,
    successRate: 99.5,
    congestionLevel: 'MEDIUM'
  }
};

export const POLYGON_MAINNET: NetworkConfiguration = {
  // Basic Info
  chainId: 137,
  name: 'polygon',
  displayName: 'Polygon',
  symbol: 'MATIC',
  decimals: 18,
  
  // RPC Configuration
  rpcUrls: [
    'https://polygon-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY',
    'https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY',
    'https://rpc.ankr.com/polygon',
    'https://polygon.publicnode.com',
    'https://polygon.llamarpc.com'
  ],
  websocketUrls: [
    'wss://polygon-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY',
    'wss://polygon-mainnet.infura.io/ws/v3/YOUR_INFURA_KEY'
  ],
  rpcTimeout: 8000,
  maxRetries: 3,
  retryDelay: 800,
  
  // Network Properties
  isMainnet: true,
  isTestnet: false,
  isLayer2: true,
  parentChainId: 1,
  confirmationBlocks: 200,
  blockTime: 2,
  
  // Gas Configuration
  gasConfig: {
    maxGasPrice: ethers.parseUnits('500', 'gwei'),
    maxPriorityFeePerGas: ethers.parseUnits('50', 'gwei'),
    gasLimit: BigInt(800000),
    gasMultiplier: 1.3,
    eip1559Enabled: true,
    dynamicGasEstimation: true,
    gasOracleUrl: 'https://gasstation-mainnet.matic.network',
    emergencyGasPrice: ethers.parseUnits('1000', 'gwei')
  },
  
  // DEX Configuration
  dexes: [
    {
      name: 'QuickSwap',
      routerAddress: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
      factoryAddress: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
      initCodeHash: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
      feePercentage: 0.003,
      isV3: false,
      isActive: true,
      priority: 1,
      maxSlippage: 0.05,
      minLiquidity: ethers.parseEther('1000')
    },
    {
      name: 'SushiSwap',
      routerAddress: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      factoryAddress: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      initCodeHash: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
      feePercentage: 0.003,
      isV3: false,
      isActive: true,
      priority: 2,
      maxSlippage: 0.05,
      minLiquidity: ethers.parseEther('500')
    }
  ],
  
  // Flashloan Providers
  flashloanProviders: [
    {
      name: 'Aave V3',
      contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
      poolAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
      supportedTokens: [
        '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
        '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC
        '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'  // DAI
      ],
      maxLoanAmount: {
        '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270': ethers.parseEther('1000000'),
        '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': BigInt('10000000000000'),
        '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063': ethers.parseEther('10000000')
      },
      feePercentage: 0.0009,
      isActive: true,
      priority: 1,
      gasEstimate: BigInt(200000)
    }
  ],
  
  // Bridge Configuration
  bridges: [
    {
      name: 'Polygon Bridge',
      contractAddress: '0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf',
      supportedChains: [1],
      supportedTokens: [
        '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
        '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
      ],
      feePercentage: 0.001,
      minBridgeAmount: ethers.parseEther('1'),
      maxBridgeAmount: ethers.parseEther('100000'),
      estimatedTime: 1800,
      isActive: true
    }
  ],
  
  // Oracle Configuration
  oracles: {
    'MATIC/USD': {
      name: 'Chainlink MATIC/USD',
      aggregatorAddress: '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0',
      baseCurrency: 'USD',
      decimals: 8,
      heartbeat: 300,
      isActive: true
    }
  },
  
  // Monitoring
  monitoring: {
    blockExplorer: 'https://polygonscan.com',
    blockExplorerApi: 'https://api.polygonscan.com/api',
    statusPageUrl: 'https://status.polygon.technology',
    twitterHandle: '@0xPolygon'
  },
  
  // Security Settings
  security: {
    maxTransactionValue: ethers.parseEther('100000'),
    dailyTransactionLimit: ethers.parseEther('1000000'),
    suspiciousActivityThreshold: 20,
    blacklistedAddresses: [],
    whitelistedAddresses: [],
    enableMEVProtection: false,
    requireMultisig: false,
    enableTimelock: false
  },
  
  // Feature Flags
  features: {
    enableArbitrage: true,
    enableCrossChain: true,
    enableFlashloan: true,
    enableLimitOrders: true,
    enableMEVProtection: false,
    enableBridging: true
  },
  
  // Token Configuration
  tokens: {
    weth: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    dai: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    wbtc: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
    stablecoins: [
      '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC
      '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT
      '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'  // DAI
    ],
    commonTokens: [
      '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
      '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH
      '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC
      '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6'  // WBTC
    ],
    lpTokens: []
  },
  
  // Contract Addresses
  contracts: {
    multicall: '0x275617327c958bD06b5D6b871E7f491D76113dd8',
    permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
    weth: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    flashloanExecutor: '0x0000000000000000000000000000000000000000',
    arbitrageEngine: '0x0000000000000000000000000000000000000000',
    gasOracle: '0x0000000000000000000000000000000000000000'
  },
  
  // Network Status
  status: {
    isActive: true,
    maintenanceMode: false,
    lastHealthCheck: Date.now(),
    avgLatency: 80,
    successRate: 99.8,
    congestionLevel: 'LOW'
  }
};

export const ARBITRUM_ONE: NetworkConfiguration = {
  // Basic Info
  chainId: 42161,
  name: 'arbitrum',
  displayName: 'Arbitrum One',
  symbol: 'ETH',
  decimals: 18,
  
  // RPC Configuration
  rpcUrls: [
    'https://arb-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY',
    'https://arbitrum-mainnet.infura.io/v3/YOUR_INFURA_KEY',
    'https://rpc.ankr.com/arbitrum',
    'https://arbitrum.publicnode.com',
    'https://arbitrum.llamarpc.com'
  ],
  websocketUrls: [
    'wss://arb-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY',
    'wss://arbitrum-mainnet.infura.io/ws/v3/YOUR_INFURA_KEY'
  ],
  rpcTimeout: 8000,
  maxRetries: 3,
  retryDelay: 800,
  
  // Network Properties
  isMainnet: true,
  isTestnet: false,
  isLayer2: true,
  parentChainId: 1,
  confirmationBlocks: 1,
  blockTime: 0.25,
  
  // Gas Configuration
  gasConfig: {
    maxGasPrice: ethers.parseUnits('2', 'gwei'),
    maxPriorityFeePerGas: ethers.parseUnits('0.01', 'gwei'),
    gasLimit: BigInt(1000000),
    gasMultiplier: 1.1,
    eip1559Enabled: true,
    dynamicGasEstimation: true,
    emergencyGasPrice: ethers.parseUnits('5', 'gwei')
  },
  
  // DEX Configuration
  dexes: [
    {
      name: 'Uniswap V3',
      routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      initCodeHash: '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54',
      feePercentage: 0.003,
      supportedFeeTiers: [500, 3000, 10000],
      quoterAddress: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
      isV3: true,
      isActive: true,
      priority: 1,
      maxSlippage: 0.03,
      minLiquidity: ethers.parseEther('5')
    },
    {
      name: 'SushiSwap',
      routerAddress: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      factoryAddress: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      initCodeHash: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
      feePercentage: 0.003,
      isV3: false,
      isActive: true,
      priority: 2,
      maxSlippage: 0.05,
      minLiquidity: ethers.parseEther('2')
    }
  ],
  
  // Flashloan Providers
  flashloanProviders: [
    {
      name: 'Aave V3',
      contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
      poolAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
      supportedTokens: [
        '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
        '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
        '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'  // DAI
      ],
      maxLoanAmount: {
        '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1': ethers.parseEther('5000'),
        '0xaf88d065e77c8cC2239327C5EDb3A432268e5831': BigInt('50000000000'),
        '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1': ethers.parseEther('50000000')
      },
      feePercentage: 0.0009,
      isActive: true,
      priority: 1,
      gasEstimate: BigInt(150000)
    }
  ],
  
  // Bridge Configuration
  bridges: [
    {
      name: 'Arbitrum Bridge',
      contractAddress: '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a',
      supportedChains: [1],
      supportedTokens: [
        '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
      ],
      feePercentage: 0.0005,
      minBridgeAmount: ethers.parseEther('0.001'),
      maxBridgeAmount: ethers.parseEther('1000'),
      estimatedTime: 900,
      isActive: true
    }
  ],
  
  // Oracle Configuration
  oracles: {
    'ETH/USD': {
      name: 'Chainlink ETH/USD',
      aggregatorAddress: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612',
      baseCurrency: 'USD',
      decimals: 8,
      heartbeat: 3600,
      isActive: true
    }
  },
  
  // Monitoring
  monitoring: {
    blockExplorer: 'https://arbiscan.io',
    blockExplorerApi: 'https://api.arbiscan.io/api',
    statusPageUrl: 'https://status.arbitrum.io',
    twitterHandle: '@arbitrum'
  },
  
  // Security Settings
  security: {
    maxTransactionValue: ethers.parseEther('500'),
    dailyTransactionLimit: ethers.parseEther('5000'),
    suspiciousActivityThreshold: 15,
    blacklistedAddresses: [],
    whitelistedAddresses: [],
    enableMEVProtection: false,
    requireMultisig: false,
    enableTimelock: false
  },
  
  // Feature Flags
  features: {
    enableArbitrage: true,
    enableCrossChain: true,
    enableFlashloan: true,
    enableLimitOrders: true,
    enableMEVProtection: false,
    enableBridging: true
  },
  
  // Token Configuration
  tokens: {
    weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    wbtc: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    stablecoins: [
      '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
      '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT
      '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'  // DAI
    ],
    commonTokens: [
      '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
      '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
      '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', // WBTC
      '0x912CE59144191C1204E64559FE8253a0e49E6548'  // ARB
    ],
    lpTokens: []
  },
  
  // Contract Addresses
  contracts: {
    multicall: '0x842eC2c7D803033Edf55E478F461FC547Bc54EB2',
    permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
    weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    flashloanExecutor: '0x0000000000000000000000000000000000000000',
    arbitrageEngine: '0x0000000000000000000000000000000000000000',
    gasOracle: '0x0000000000000000000000000000000000000000'
  },
  
  // Network Status
  status: {
    isActive: true,
    maintenanceMode: false,
    lastHealthCheck: Date.now(),
    avgLatency: 50,
    successRate: 99.9,
    congestionLevel: 'LOW'
  }
};

// ========================================
// 🔧 NETWORK MANAGEMENT
// ========================================

export class NetworkManager {
  private static instance: NetworkManager;
  private networks: Map<number, NetworkConfiguration>;
  private activeNetworks: Set<number>;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.networks = new Map();
    this.activeNetworks = new Set();
    this.initializeNetworks();
    this.startHealthMonitoring();
  }

  public static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  private initializeNetworks(): void {
    // Add predefined networks
    this.networks.set(1, ETHEREUM_MAINNET);
    this.networks.set(137, POLYGON_MAINNET);
    this.networks.set(42161, ARBITRUM_ONE);
    
    // Set active networks
    this.activeNetworks.add(1);
    this.activeNetworks.add(137);
    this.activeNetworks.add(42161);
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const [chainId, network] of this.networks) {
        if (this.activeNetworks.has(chainId)) {
          await this.checkNetworkHealth(chainId);
        }
      }
    }, 60000); // Check every minute
  }

  private async checkNetworkHealth(chainId: number): Promise<void> {
    const network = this.networks.get(chainId);
    if (!network) return;

    try {
      const start = Date.now();
      
      // Create provider and test connection
      const provider = new ethers.JsonRpcProvider(network.rpcUrls[0]);
      await provider.getBlockNumber();
      
      const latency = Date.now() - start;
      
      // Update network status
      network.status.lastHealthCheck = Date.now();
      network.status.avgLatency = (network.status.avgLatency + latency) / 2;
      network.status.successRate = Math.min(100, network.status.successRate + 0.1);
      network.status.isActive = true;
      
    } catch (error) {
      // Update on failure
      network.status.successRate = Math.max(0, network.status.successRate - 1);
      network.status.isActive = network.status.successRate > 90;
      
      if (!network.status.isActive) {
        this.activeNetworks.delete(chainId);
      }
    }
  }

  // ========================================
  // 📊 PUBLIC METHODS
  // ========================================

  public getNetwork(chainId: number): NetworkConfiguration | undefined {
    return this.networks.get(chainId);
  }

  public getAllNetworks(): NetworkConfiguration[] {
    return Array.from(this.networks.values());
  }

  public getActiveNetworks(): NetworkConfiguration[] {
    return Array.from(this.activeNetworks)
      .map(chainId => this.networks.get(chainId))
      .filter(network => network !== undefined) as NetworkConfiguration[];
  }

  public isNetworkActive(chainId: number): boolean {
    return this.activeNetworks.has(chainId);
  }

  public addNetwork(network: NetworkConfiguration): void {
    this.networks.set(network.chainId, network);
    if (network.status.isActive) {
      this.activeNetworks.add(network.chainId);
    }
  }

  public updateNetwork(chainId: number, updates: Partial<NetworkConfiguration>): void {
    const network = this.networks.get(chainId);
    if (network) {
      Object.assign(network, updates);
    }
  }

  public activateNetwork(chainId: number): void {
    const network = this.networks.get(chainId);
    if (network) {
      this.activeNetworks.add(chainId);
      network.status.isActive = true;
    }
  }

  public deactivateNetwork(chainId: number): void {
    this.activeNetworks.delete(chainId);
    const network = this.networks.get(chainId);
    if (network) {
      network.status.isActive = false;
    }
  }

  public getNetworkProvider(chainId: number): ethers.JsonRpcProvider | null {
    const network = this.networks.get(chainId);
    if (!network || network.rpcUrls.length === 0) {
      return null;
    }
    
    return new ethers.JsonRpcProvider(network.rpcUrls[0]);
  }

  public getBestRpcUrl(chainId: number): string | null {
    const network = this.networks.get(chainId);
    if (!network) return null;
    
    // Return the first active RPC URL
    // In a production system, this would select based on latency/reliability
    return network.rpcUrls[0] || null;
  }

  public getSupportedChains(): number[] {
    return Array.from(this.networks.keys());
  }

  public getChainInfo(chainId: number): {
    name: string;
    displayName: string;
    symbol: string;
    blockExplorer: string;
  } | null {
    const network = this.networks.get(chainId);
    if (!network) return null;
    
    return {
      name: network.name,
      displayName: network.displayName,
      symbol: network.symbol,
      blockExplorer: network.monitoring.blockExplorer
    };
  }
}

// ========================================
// 🚀 UTILITY FUNCTIONS
// ========================================

export function getNetworkConfig(chainId: number): NetworkConfiguration | undefined {
  return NetworkManager.getInstance().getNetwork(chainId);
}

export function isMainnet(chainId: number): boolean {
  const network = getNetworkConfig(chainId);
  return network?.isMainnet ?? false;
}

export function isTestnet(chainId: number): boolean {
  const network = getNetworkConfig(chainId);
  return network?.isTestnet ?? false;
}

export function isLayer2(chainId: number): boolean {
  const network = getNetworkConfig(chainId);
  return network?.isLayer2 ?? false;
}

export function getCommonTokens(chainId: number): string[] {
  const network = getNetworkConfig(chainId);
  return network?.tokens.commonTokens ?? [];
}

export function getStablecoins(chainId: number): string[] {
  const network = getNetworkConfig(chainId);
  return network?.tokens.stablecoins ?? [];
}

export function getActiveDEXes(chainId: number): DEXConfiguration[] {
  const network = getNetworkConfig(chainId);
  return network?.dexes.filter(dex => dex.isActive) ?? [];
}

export function getFlashloanProviders(chainId: number): FlashloanProvider[] {
  const network = getNetworkConfig(chainId);
  return network?.flashloanProviders.filter(provider => provider.isActive) ?? [];
}

// ========================================
// 📋 EXPORT
// ========================================

export {
  NetworkConfiguration,
  DEXConfiguration,
  FlashloanProvider,
  GasConfiguration,
  SecuritySettings
};