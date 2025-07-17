import { ethers } from 'ethers';

// ========================================
// 🎯 INTERFACES & TYPES
// ========================================

interface DEXPool {
  address: string;                       // Pool contract address
  token0: string;                        // First token address
  token1: string;                        // Second token address
  fee: number;                           // Pool fee (for V3)
  tickSpacing?: number;                  // Tick spacing (V3 only)
  reserve0?: bigint;                     // Token0 reserves (V2)
  reserve1?: bigint;                     // Token1 reserves (V2)
  liquidity?: bigint;                    // Current liquidity (V3)
  sqrtPriceX96?: bigint;                 // Current price (V3)
  tick?: number;                         // Current tick (V3)
  isActive: boolean;                     // Is pool active for trading
  lastUpdated: number;                   // Last data update timestamp
}

interface DEXFeeTier {
  fee: number;                           // Fee in basis points (3000 = 0.3%)
  tickSpacing: number;                   // Tick spacing for this fee tier
  isActive: boolean;                     // Is this fee tier active
  minLiquidity: bigint;                  // Minimum liquidity requirement
}

interface DEXTokenList {
  chainId: number;                       // Chain ID
  tokens: Array<{
    address: string;                     // Token contract address
    symbol: string;                      // Token symbol
    name: string;                        // Token name
    decimals: number;                    // Token decimals
    logoURI?: string;                    // Token logo URL
    isStablecoin: boolean;               // Is this a stablecoin
    isWrappedNative: boolean;            // Is this wrapped native token
    coingeckoId?: string;                // CoinGecko ID for price feeds
  }>;
}

interface DEXConfiguration {
  // Basic Information
  name: string;                          // DEX name
  displayName: string;                   // Display name for UI
  version: string;                       // Protocol version (V2, V3, etc.)
  chainId: number;                       // Chain ID
  
  // Contract Addresses
  addresses: {
    factory: string;                     // Factory contract address
    router: string;                      // Router contract address
    quoter?: string;                     // Quoter contract (V3 only)
    positionManager?: string;            // Position manager (V3 only)
    multicall?: string;                  // Multicall contract
    migrator?: string;                   // Migrator contract
    staker?: string;                     // Staking contract
    governance?: string;                 // Governance contract
  };
  
  // Protocol Information
  protocol: {
    type: 'V2' | 'V3' | 'Stable' | 'OrderBook'; // Protocol type
    initCodeHash: string;                // Init code hash for pair calculation
    feeTiers: DEXFeeTier[];              // Available fee tiers
    defaultFee: number;                  // Default fee percentage
    maxSlippage: number;                 // Maximum allowed slippage
    minLiquidity: bigint;                // Minimum liquidity requirement
  };
  
  // Trading Configuration
  trading: {
    maxHops: number;                     // Maximum hops for routing
    maxPools: number;                    // Maximum pools per route
    gasEstimate: {
      swap: bigint;                      // Gas estimate for swaps
      addLiquidity: bigint;              // Gas estimate for adding liquidity
      removeLiquidity: bigint;           // Gas estimate for removing liquidity
    };
    limits: {
      minTradeAmount: bigint;            // Minimum trade amount
      maxTradeAmount: bigint;            // Maximum trade amount
      maxPriceImpact: number;            // Maximum price impact
    };
  };
  
  // Supported Features
  features: {
    supportsPermit: boolean;             // Supports EIP-2612 permits
    supportsMultihop: boolean;           // Supports multi-hop swaps
    supportsExactOutput: boolean;        // Supports exact output swaps
    supportsOracles: boolean;            // Has price oracles
    supportsLimitOrders: boolean;        // Supports limit orders
    supportsRangeOrders: boolean;        // Supports range orders (V3)
    supportsFlashloan: boolean;          // Supports flashloans
  };
  
  // Monitoring & Status
  status: {
    isActive: boolean;                   // Is DEX currently active
    maintenanceMode: boolean;            // Is DEX in maintenance
    lastHealthCheck: number;             // Last health check timestamp
    avgGasUsed: bigint;                  // Average gas used
    successRate: number;                 // Transaction success rate
    avgSlippage: number;                 // Average slippage experienced
  };
  
  // Metadata
  metadata: {
    website: string;                     // Official website
    documentation: string;               // Documentation URL
    twitter?: string;                    // Twitter handle
    discord?: string;                    // Discord server
    github?: string;                     // GitHub repository
    logoURI: string;                     // Logo URL
    description: string;                 // DEX description
  };
}

// ========================================
// 📋 CONTRACT ABIs
// ========================================

export const UNISWAP_V2_ROUTER_ABI = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
  "function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts)",
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
  "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)",
  "function factory() external pure returns (address)",
  "function WETH() external pure returns (address)"
];

export const UNISWAP_V3_ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
  "function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountIn)",
  "function exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)",
  "function exactOutput((bytes path, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum)) external payable returns (uint256 amountIn)",
  "function multicall(bytes[] calldata data) external payable returns (bytes[] memory results)",
  "function refundETH() external payable",
  "function sweepToken(address token, uint256 amountMinimum, address recipient) external payable",
  "function unwrapWETH9(uint256 amountMinimum, address recipient) external payable"
];

export const UNISWAP_V3_QUOTER_ABI = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
  "function quoteExactOutputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountOut, uint160 sqrtPriceLimitX96) external returns (uint256 amountIn)",
  "function quoteExactInput(bytes memory path, uint256 amountIn) external returns (uint256 amountOut)",
  "function quoteExactOutput(bytes memory path, uint256 amountOut) external returns (uint256 amountIn)"
];

export const UNISWAP_V2_FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
  "function createPair(address tokenA, address tokenB) external returns (address pair)",
  "function allPairs(uint) external view returns (address pair)",
  "function allPairsLength() external view returns (uint)",
  "function feeTo() external view returns (address)",
  "function feeToSetter() external view returns (address)"
];

export const UNISWAP_V3_FACTORY_ABI = [
  "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
  "function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)",
  "function enableFeeAmount(uint24 fee, int24 tickSpacing) external",
  "function feeAmountTickSpacing(uint24 fee) external view returns (int24)",
  "function owner() external view returns (address)"
];

export const UNISWAP_V2_PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function price0CumulativeLast() external view returns (uint)",
  "function price1CumulativeLast() external view returns (uint)",
  "function kLast() external view returns (uint)",
  "function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external",
  "function skim(address to) external",
  "function sync() external",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)"
];

export const UNISWAP_V3_POOL_ABI = [
  "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
  "function liquidity() external view returns (uint128)",
  "function fee() external view returns (uint24)",
  "function tickSpacing() external view returns (int24)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function positions(bytes32 key) external view returns (uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
  "function swap(address recipient, bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96, bytes calldata data) external returns (int256 amount0, int256 amount1)",
  "function flash(address recipient, uint256 amount0, uint256 amount1, bytes calldata data) external"
];

export const CURVE_POOL_ABI = [
  "function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy) external",
  "function exchange_underlying(int128 i, int128 j, uint256 dx, uint256 min_dy) external",
  "function get_dy(int128 i, int128 j, uint256 dx) external view returns (uint256)",
  "function get_dy_underlying(int128 i, int128 j, uint256 dx) external view returns (uint256)",
  "function coins(uint256 i) external view returns (address)",
  "function underlying_coins(uint256 i) external view returns (address)",
  "function balances(uint256 i) external view returns (uint256)",
  "function fee() external view returns (uint256)",
  "function A() external view returns (uint256)",
  "function get_virtual_price() external view returns (uint256)"
];

export const BALANCER_V2_VAULT_ABI = [
  "function batchSwap(uint8 kind, (bytes32 poolId, uint256 assetInIndex, uint256 assetOutIndex, uint256 amount, bytes userData)[] memory swaps, address[] memory assets, (address sender, bool fromInternalBalance, address payable recipient, bool toInternalBalance) memory funds, int256[] memory limits, uint256 deadline) external payable returns (int256[] memory)",
  "function swap((bytes32 poolId, uint8 kind, address assetIn, address assetOut, uint256 amount, bytes userData) memory singleSwap, (address sender, bool fromInternalBalance, address payable recipient, bool toInternalBalance) memory funds, uint256 limit, uint256 deadline) external payable returns (uint256)",
  "function queryBatchSwap(uint8 kind, (bytes32 poolId, uint256 assetInIndex, uint256 assetOutIndex, uint256 amount, bytes userData)[] memory swaps, address[] memory assets) external returns (int256[] memory assetDeltas)",
  "function getPool(bytes32 poolId) external view returns (address, uint8)",
  "function getPoolTokens(bytes32 poolId) external view returns (address[] memory tokens, uint256[] memory balances, uint256 lastChangeBlock)"
];

export const ONEINCH_AGGREGATION_ROUTER_ABI = [
  "function swap(address caller, (address srcToken, address dstToken, address srcReceiver, address dstReceiver, uint256 amount, uint256 minReturnAmount, uint256 flags, bytes permit) memory desc, bytes memory data) external payable returns (uint256 returnAmount, uint256 gasLeft)",
  "function unoswap(address srcToken, uint256 amount, uint256 minReturn, bytes32[] calldata pools) external payable returns (uint256 returnAmount)",
  "function clipperSwap(address srcToken, address dstToken, uint256 amount, uint256 minReturn) external payable returns (uint256 returnAmount)",
  "function getExpectedReturn(address srcToken, address dstToken, uint256 amount, uint256 parts, uint256 flags) external view returns (uint256 returnAmount, uint256[] memory distribution)",
  "function getExpectedReturnWithGas(address srcToken, address dstToken, uint256 amount, uint256 parts, uint256 flags, uint256 destTokenEthPriceTimesGasPrice) external view returns (uint256 returnAmount, uint256 estimateGasAmount, uint256[] memory distribution)"
];

// ========================================
// 🌐 DEX CONFIGURATIONS BY CHAIN
// ========================================

export const ETHEREUM_DEXES: DEXConfiguration[] = [
  {
    name: 'uniswap-v3',
    displayName: 'Uniswap V3',
    version: 'V3',
    chainId: 1,
    
    addresses: {
      factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
      positionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
      multicall: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
      staker: '0x1f98407aaB862CdDeF78Ed252D6f557aA5b0f00d'
    },
    
    protocol: {
      type: 'V3',
      initCodeHash: '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54',
      feeTiers: [
        { fee: 100, tickSpacing: 1, isActive: true, minLiquidity: ethers.parseEther('1') },
        { fee: 500, tickSpacing: 10, isActive: true, minLiquidity: ethers.parseEther('5') },
        { fee: 3000, tickSpacing: 60, isActive: true, minLiquidity: ethers.parseEther('10') },
        { fee: 10000, tickSpacing: 200, isActive: true, minLiquidity: ethers.parseEther('20') }
      ],
      defaultFee: 3000,
      maxSlippage: 0.05,
      minLiquidity: ethers.parseEther('10')
    },
    
    trading: {
      maxHops: 3,
      maxPools: 10,
      gasEstimate: {
        swap: BigInt(150000),
        addLiquidity: BigInt(300000),
        removeLiquidity: BigInt(250000)
      },
      limits: {
        minTradeAmount: ethers.parseEther('0.001'),
        maxTradeAmount: ethers.parseEther('10000'),
        maxPriceImpact: 0.15
      }
    },
    
    features: {
      supportsPermit: true,
      supportsMultihop: true,
      supportsExactOutput: true,
      supportsOracles: true,
      supportsLimitOrders: false,
      supportsRangeOrders: true,
      supportsFlashloan: true
    },
    
    status: {
      isActive: true,
      maintenanceMode: false,
      lastHealthCheck: Date.now(),
      avgGasUsed: BigInt(150000),
      successRate: 99.5,
      avgSlippage: 0.02
    },
    
    metadata: {
      website: 'https://uniswap.org',
      documentation: 'https://docs.uniswap.org',
      twitter: '@Uniswap',
      github: 'https://github.com/Uniswap',
      logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
      description: 'The largest decentralized exchange on Ethereum with concentrated liquidity'
    }
  },
  
  {
    name: 'uniswap-v2',
    displayName: 'Uniswap V2',
    version: 'V2',
    chainId: 1,
    
    addresses: {
      factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
    },
    
    protocol: {
      type: 'V2',
      initCodeHash: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
      feeTiers: [
        { fee: 3000, tickSpacing: 0, isActive: true, minLiquidity: ethers.parseEther('5') }
      ],
      defaultFee: 3000,
      maxSlippage: 0.05,
      minLiquidity: ethers.parseEther('5')
    },
    
    trading: {
      maxHops: 4,
      maxPools: 8,
      gasEstimate: {
        swap: BigInt(120000),
        addLiquidity: BigInt(250000),
        removeLiquidity: BigInt(200000)
      },
      limits: {
        minTradeAmount: ethers.parseEther('0.001'),
        maxTradeAmount: ethers.parseEther('5000'),
        maxPriceImpact: 0.12
      }
    },
    
    features: {
      supportsPermit: true,
      supportsMultihop: true,
      supportsExactOutput: true,
      supportsOracles: true,
      supportsLimitOrders: false,
      supportsRangeOrders: false,
      supportsFlashloan: false
    },
    
    status: {
      isActive: true,
      maintenanceMode: false,
      lastHealthCheck: Date.now(),
      avgGasUsed: BigInt(120000),
      successRate: 99.8,
      avgSlippage: 0.025
    },
    
    metadata: {
      website: 'https://uniswap.org',
      documentation: 'https://docs.uniswap.org/protocol/V2/introduction',
      twitter: '@Uniswap',
      github: 'https://github.com/Uniswap/uniswap-v2-core',
      logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
      description: 'Original Uniswap AMM with constant product formula'
    }
  },
  
  {
    name: 'sushiswap',
    displayName: 'SushiSwap',
    version: 'V2',
    chainId: 1,
    
    addresses: {
      factory: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
      router: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F'
    },
    
    protocol: {
      type: 'V2',
      initCodeHash: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
      feeTiers: [
        { fee: 3000, tickSpacing: 0, isActive: true, minLiquidity: ethers.parseEther('3') }
      ],
      defaultFee: 3000,
      maxSlippage: 0.05,
      minLiquidity: ethers.parseEther('3')
    },
    
    trading: {
      maxHops: 4,
      maxPools: 8,
      gasEstimate: {
        swap: BigInt(125000),
        addLiquidity: BigInt(260000),
        removeLiquidity: BigInt(210000)
      },
      limits: {
        minTradeAmount: ethers.parseEther('0.001'),
        maxTradeAmount: ethers.parseEther('3000'),
        maxPriceImpact: 0.12
      }
    },
    
    features: {
      supportsPermit: true,
      supportsMultihop: true,
      supportsExactOutput: true,
      supportsOracles: false,
      supportsLimitOrders: false,
      supportsRangeOrders: false,
      supportsFlashloan: false
    },
    
    status: {
      isActive: true,
      maintenanceMode: false,
      lastHealthCheck: Date.now(),
      avgGasUsed: BigInt(125000),
      successRate: 99.3,
      avgSlippage: 0.03
    },
    
    metadata: {
      website: 'https://sushi.com',
      documentation: 'https://docs.sushi.com',
      twitter: '@SushiSwap',
      github: 'https://github.com/sushiswap',
      logoURI: 'https://raw.githubusercontent.com/sushiswap/logos/main/network/ethereum/0x6B3595068778DD592e39A122f4f5a5cF09C90fE2.jpg',
      description: 'Community-driven DEX with extensive DeFi ecosystem'
    }
  },
  
  {
    name: 'curve',
    displayName: 'Curve Finance',
    version: 'Stable',
    chainId: 1,
    
    addresses: {
      router: '0x99a58482BD75cbab83b27EC03CA68fF489b5788f',
      factory: '0xB9fC157394Af804a3578134A6585C0dc9cc990d4'
    },
    
    protocol: {
      type: 'Stable',
      initCodeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      feeTiers: [
        { fee: 400, tickSpacing: 0, isActive: true, minLiquidity: ethers.parseEther('100') }
      ],
      defaultFee: 400,
      maxSlippage: 0.02,
      minLiquidity: ethers.parseEther('100')
    },
    
    trading: {
      maxHops: 2,
      maxPools: 5,
      gasEstimate: {
        swap: BigInt(180000),
        addLiquidity: BigInt(400000),
        removeLiquidity: BigInt(350000)
      },
      limits: {
        minTradeAmount: ethers.parseEther('0.01'),
        maxTradeAmount: ethers.parseEther('50000'),
        maxPriceImpact: 0.08
      }
    },
    
    features: {
      supportsPermit: false,
      supportsMultihop: false,
      supportsExactOutput: false,
      supportsOracles: false,
      supportsLimitOrders: false,
      supportsRangeOrders: false,
      supportsFlashloan: true
    },
    
    status: {
      isActive: true,
      maintenanceMode: false,
      lastHealthCheck: Date.now(),
      avgGasUsed: BigInt(180000),
      successRate: 99.7,
      avgSlippage: 0.005
    },
    
    metadata: {
      website: 'https://curve.fi',
      documentation: 'https://curve.readthedocs.io',
      twitter: '@CurveFinance',
      github: 'https://github.com/curvefi',
      logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png',
      description: 'Specialized AMM for stablecoins and similar assets'
    }
  },
  
  {
    name: 'balancer-v2',
    displayName: 'Balancer V2',
    version: 'V2',
    chainId: 1,
    
    addresses: {
      factory: '0x0000000000000000000000000000000000000000', // Placeholder, update with actual if available
      router: '0xBA12222222228d8Ba445958a75a0704d566BF2C8' // Vault contract
    },
    
    protocol: {
      type: 'V2',
      initCodeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      feeTiers: [
        { fee: 500, tickSpacing: 0, isActive: true, minLiquidity: ethers.parseEther('10') },
        { fee: 1000, tickSpacing: 0, isActive: true, minLiquidity: ethers.parseEther('5') },
        { fee: 3000, tickSpacing: 0, isActive: true, minLiquidity: ethers.parseEther('3') }
      ],
      defaultFee: 1000,
      maxSlippage: 0.04,
      minLiquidity: ethers.parseEther('10')
    },
    
    trading: {
      maxHops: 3,
      maxPools: 6,
      gasEstimate: {
        swap: BigInt(200000),
        addLiquidity: BigInt(450000),
        removeLiquidity: BigInt(400000)
      },
      limits: {
        minTradeAmount: ethers.parseEther('0.001'),
        maxTradeAmount: ethers.parseEther('8000'),
        maxPriceImpact: 0.10
      }
    },
    
    features: {
      supportsPermit: true,
      supportsMultihop: true,
      supportsExactOutput: true,
      supportsOracles: true,
      supportsLimitOrders: false,
      supportsRangeOrders: false,
      supportsFlashloan: true
    },
    
    status: {
      isActive: true,
      maintenanceMode: false,
      lastHealthCheck: Date.now(),
      avgGasUsed: BigInt(200000),
      successRate: 99.1,
      avgSlippage: 0.025
    },
    
    metadata: {
      website: 'https://balancer.fi',
      documentation: 'https://docs.balancer.fi',
      twitter: '@BalancerLabs',
      github: 'https://github.com/balancer-labs',
      logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xba100000625a3754423978a60c9317c58a424e3D/logo.png',
      description: 'Programmable liquidity with weighted pools and custom curves'
    }
  },
  
  {
    name: '1inch',
    displayName: '1inch',
    version: 'V5',
    chainId: 1,
    
    addresses: {
      factory: '0x0000000000000000000000000000000000000000', // Placeholder, update with actual if available
      router: '0x1111111254EEB25477B68fb85Ed929f73A960582'
    },
    
    protocol: {
      type: 'V2',
      initCodeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      feeTiers: [
        { fee: 0, tickSpacing: 0, isActive: true, minLiquidity: BigInt(0) }
      ],
      defaultFee: 0,
      maxSlippage: 0.03,
      minLiquidity: BigInt(0)
    },
    
    trading: {
      maxHops: 5,
      maxPools: 15,
      gasEstimate: {
        swap: BigInt(250000),
        addLiquidity: BigInt(0),
        removeLiquidity: BigInt(0)
      },
      limits: {
        minTradeAmount: ethers.parseEther('0.0001'),
        maxTradeAmount: ethers.parseEther('50000'),
        maxPriceImpact: 0.20
      }
    },
    
    features: {
      supportsPermit: true,
      supportsMultihop: true,
      supportsExactOutput: false,
      supportsOracles: false,
      supportsLimitOrders: true,
      supportsRangeOrders: false,
      supportsFlashloan: false
    },
    
    status: {
      isActive: true,
      maintenanceMode: false,
      lastHealthCheck: Date.now(),
      avgGasUsed: BigInt(250000),
      successRate: 98.8,
      avgSlippage: 0.015
    },
    
    metadata: {
      website: 'https://1inch.io',
      documentation: 'https://docs.1inch.io',
      twitter: '@1inch',
      github: 'https://github.com/1inch',
      logoURI: 'https://tokens.1inch.io/0x111111111117dc0aa78b770fa6a738034120c302.png',
      description: 'DEX aggregator finding the best rates across multiple exchanges'
    }
  }
];

export const POLYGON_DEXES: DEXConfiguration[] = [
  {
    name: 'quickswap',
    displayName: 'QuickSwap',
    version: 'V2',
    chainId: 137,
    
    addresses: {
      factory: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
      router: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff'
    },
    
    protocol: {
      type: 'V2',
      initCodeHash: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
      feeTiers: [
        { fee: 3000, tickSpacing: 0, isActive: true, minLiquidity: ethers.parseEther('1000') }
      ],
      defaultFee: 3000,
      maxSlippage: 0.05,
      minLiquidity: ethers.parseEther('1000')
    },
    
    trading: {
      maxHops: 4,
      maxPools: 8,
      gasEstimate: {
        swap: BigInt(80000),
        addLiquidity: BigInt(150000),
        removeLiquidity: BigInt(120000)
      },
      limits: {
        minTradeAmount: ethers.parseEther('0.01'),
        maxTradeAmount: ethers.parseEther('100000'),
        maxPriceImpact: 0.12
      }
    },
    
    features: {
      supportsPermit: true,
      supportsMultihop: true,
      supportsExactOutput: true,
      supportsOracles: false,
      supportsLimitOrders: false,
      supportsRangeOrders: false,
      supportsFlashloan: false
    },
    
    status: {
      isActive: true,
      maintenanceMode: false,
      lastHealthCheck: Date.now(),
      avgGasUsed: BigInt(80000),
      successRate: 99.6,
      avgSlippage: 0.02
    },
    
    metadata: {
      website: 'https://quickswap.exchange',
      documentation: 'https://docs.quickswap.exchange',
      twitter: '@QuickswapDEX',
      github: 'https://github.com/QuickSwap',
      logoURI: 'https://wallet-asset.matic.network/img/tokens/quick.svg',
      description: 'Leading DEX on Polygon with fast and cheap swaps'
    }
  },
  
  {
    name: 'sushiswap-polygon',
    displayName: 'SushiSwap',
    version: 'V2',
    chainId: 137,
    
    addresses: {
      factory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
    },
    
    protocol: {
      type: 'V2',
      initCodeHash: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
      feeTiers: [
        { fee: 3000, tickSpacing: 0, isActive: true, minLiquidity: ethers.parseEther('500') }
      ],
      defaultFee: 3000,
      maxSlippage: 0.05,
      minLiquidity: ethers.parseEther('500')
    },
    
    trading: {
      maxHops: 4,
      maxPools: 8,
      gasEstimate: {
        swap: BigInt(85000),
        addLiquidity: BigInt(160000),
        removeLiquidity: BigInt(130000)
      },
      limits: {
        minTradeAmount: ethers.parseEther('0.01'),
        maxTradeAmount: ethers.parseEther('50000'),
        maxPriceImpact: 0.12
      }
    },
    
    features: {
      supportsPermit: true,
      supportsMultihop: true,
      supportsExactOutput: true,
      supportsOracles: false,
      supportsLimitOrders: false,
      supportsRangeOrders: false,
      supportsFlashloan: false
    },
    
    status: {
      isActive: true,
      maintenanceMode: false,
      lastHealthCheck: Date.now(),
      avgGasUsed: BigInt(85000),
      successRate: 99.4,
      avgSlippage: 0.025
    },
    
    metadata: {
      website: 'https://sushi.com',
      documentation: 'https://docs.sushi.com',
      twitter: '@SushiSwap',
      github: 'https://github.com/sushiswap',
      logoURI: 'https://raw.githubusercontent.com/sushiswap/logos/main/network/polygon/0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a.jpg',
      description: 'SushiSwap deployment on Polygon'
    }
  }
];

export const ARBITRUM_DEXES: DEXConfiguration[] = [
  {
    name: 'uniswap-v3-arbitrum',
    displayName: 'Uniswap V3',
    version: 'V3',
    chainId: 42161,
    
    addresses: {
      factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
      positionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'
    },
    
    protocol: {
      type: 'V3',
      initCodeHash: '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54',
      feeTiers: [
        { fee: 100, tickSpacing: 1, isActive: true, minLiquidity: ethers.parseEther('1') },
        { fee: 500, tickSpacing: 10, isActive: true, minLiquidity: ethers.parseEther('3') },
        { fee: 3000, tickSpacing: 60, isActive: true, minLiquidity: ethers.parseEther('5') },
        { fee: 10000, tickSpacing: 200, isActive: true, minLiquidity: ethers.parseEther('10') }
      ],
      defaultFee: 3000,
      maxSlippage: 0.03,
      minLiquidity: ethers.parseEther('5')
    },
    
    trading: {
      maxHops: 3,
      maxPools: 10,
      gasEstimate: {
        swap: BigInt(120000),
        addLiquidity: BigInt(250000),
        removeLiquidity: BigInt(200000)
      },
      limits: {
        minTradeAmount: ethers.parseEther('0.0001'),
        maxTradeAmount: ethers.parseEther('10000'),
        maxPriceImpact: 0.15
      }
    },
    
    features: {
      supportsPermit: true,
      supportsMultihop: true,
      supportsExactOutput: true,
      supportsOracles: true,
      supportsLimitOrders: false,
      supportsRangeOrders: true,
      supportsFlashloan: true
    },
    
    status: {
      isActive: true,
      maintenanceMode: false,
      lastHealthCheck: Date.now(),
      avgGasUsed: BigInt(120000),
      successRate: 99.8,
      avgSlippage: 0.015
    },
    
    metadata: {
      website: 'https://uniswap.org',
      documentation: 'https://docs.uniswap.org',
      twitter: '@Uniswap',
      github: 'https://github.com/Uniswap',
      logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
      description: 'Uniswap V3 on Arbitrum with low gas costs'
    }
  },
  
  {
    name: 'sushiswap-arbitrum',
    displayName: 'SushiSwap',
    version: 'V2',
    chainId: 42161,
    
    addresses: {
      factory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
    },
    
    protocol: {
      type: 'V2',
      initCodeHash: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
      feeTiers: [
        { fee: 3000, tickSpacing: 0, isActive: true, minLiquidity: ethers.parseEther('2') }
      ],
      defaultFee: 3000,
      maxSlippage: 0.05,
      minLiquidity: ethers.parseEther('2')
    },
    
    trading: {
      maxHops: 4,
      maxPools: 8,
      gasEstimate: {
        swap: BigInt(100000),
        addLiquidity: BigInt(200000),
        removeLiquidity: BigInt(160000)
      },
      limits: {
        minTradeAmount: ethers.parseEther('0.0001'),
        maxTradeAmount: ethers.parseEther('5000'),
        maxPriceImpact: 0.12
      }
    },
    
    features: {
      supportsPermit: true,
      supportsMultihop: true,
      supportsExactOutput: true,
      supportsOracles: false,
      supportsLimitOrders: false,
      supportsRangeOrders: false,
      supportsFlashloan: false
    },
    
    status: {
      isActive: true,
      maintenanceMode: false,
      lastHealthCheck: Date.now(),
      avgGasUsed: BigInt(100000),
      successRate: 99.7,
      avgSlippage: 0.02
    },
    
    metadata: {
      website: 'https://sushi.com',
      documentation: 'https://docs.sushi.com',
      twitter: '@SushiSwap',
      github: 'https://github.com/sushiswap',
      logoURI: 'https://raw.githubusercontent.com/sushiswap/logos/main/network/arbitrum/0xd4d42F0b6DEF4CE0383636770eF773390d85c61A.jpg',
      description: 'SushiSwap deployment on Arbitrum'
    }
  }
];

// ========================================
// 🏭 DEX CONFIGURATION MANAGER
// ========================================

export class DEXConfigManager {
  private static instance: DEXConfigManager;
  private dexConfigs: Map<string, DEXConfiguration> = new Map();
  private abis: Map<string, string[]> = new Map();
  private poolCache: Map<string, DEXPool> = new Map();

  private constructor() {
    this.initializeDEXConfigs();
    this.initializeABIs();
  }

  public static getInstance(): DEXConfigManager {
    if (!DEXConfigManager.instance) {
      DEXConfigManager.instance = new DEXConfigManager();
    }
    return DEXConfigManager.instance;
  }

  private initializeDEXConfigs(): void {
    // Add Ethereum DEXes
    ETHEREUM_DEXES.forEach(dex => {
      this.dexConfigs.set(`${dex.chainId}-${dex.name}`, dex);
    });
    
    // Add Polygon DEXes
    POLYGON_DEXES.forEach(dex => {
      this.dexConfigs.set(`${dex.chainId}-${dex.name}`, dex);
    });
    
    // Add Arbitrum DEXes
    ARBITRUM_DEXES.forEach(dex => {
      this.dexConfigs.set(`${dex.chainId}-${dex.name}`, dex);
    });
  }

  private initializeABIs(): void {
    this.abis.set('uniswap-v2-router', UNISWAP_V2_ROUTER_ABI);
    this.abis.set('uniswap-v3-router', UNISWAP_V3_ROUTER_ABI);
    this.abis.set('uniswap-v3-quoter', UNISWAP_V3_QUOTER_ABI);
    this.abis.set('uniswap-v2-factory', UNISWAP_V2_FACTORY_ABI);
    this.abis.set('uniswap-v3-factory', UNISWAP_V3_FACTORY_ABI);
    this.abis.set('uniswap-v2-pair', UNISWAP_V2_PAIR_ABI);
    this.abis.set('uniswap-v3-pool', UNISWAP_V3_POOL_ABI);
    this.abis.set('curve-pool', CURVE_POOL_ABI);
    this.abis.set('balancer-v2-vault', BALANCER_V2_VAULT_ABI);
    this.abis.set('1inch-router', ONEINCH_AGGREGATION_ROUTER_ABI);
  }

  // ========================================
  // 📊 PUBLIC METHODS
  // ========================================

  public getDEXConfig(chainId: number, dexName: string): DEXConfiguration | undefined {
    return this.dexConfigs.get(`${chainId}-${dexName}`);
  }

  public getAllDEXes(chainId?: number): DEXConfiguration[] {
    if (chainId) {
      return Array.from(this.dexConfigs.values()).filter(dex => dex.chainId === chainId);
    }
    return Array.from(this.dexConfigs.values());
  }

  public getActiveDEXes(chainId: number): DEXConfiguration[] {
    return this.getAllDEXes(chainId).filter(dex => 
      dex.status.isActive && !dex.status.maintenanceMode
    );
  }

  public getABI(abiName: string): string[] | undefined {
    return this.abis.get(abiName);
  }

  public getDEXesByFeature(chainId: number, feature: keyof DEXConfiguration['features']): DEXConfiguration[] {
    return this.getActiveDEXes(chainId).filter(dex => dex.features[feature]);
  }

  public getBestDEXForPair(chainId: number, tokenA: string, tokenB: string): DEXConfiguration | null {
    const activeDEXes = this.getActiveDEXes(chainId);
    
    // Sort by success rate and average slippage
    const sortedDEXes = activeDEXes.sort((a, b) => {
      const scoreA = a.status.successRate - (a.status.avgSlippage * 1000);
      const scoreB = b.status.successRate - (b.status.avgSlippage * 1000);
      return scoreB - scoreA;
    });
    
    return sortedDEXes[0] || null;
  }

  public updateDEXStatus(chainId: number, dexName: string, updates: Partial<DEXConfiguration['status']>): void {
    const dex = this.getDEXConfig(chainId, dexName);
    if (dex) {
      Object.assign(dex.status, updates);
    }
  }

  public addDEXConfig(config: DEXConfiguration): void {
    this.dexConfigs.set(`${config.chainId}-${config.name}`, config);
  }

  public removeDEXConfig(chainId: number, dexName: string): void {
    this.dexConfigs.delete(`${chainId}-${dexName}`);
  }

  public getRouterAddress(chainId: number, dexName: string): string | null {
    const dex = this.getDEXConfig(chainId, dexName);
    return dex?.addresses.router || null;
  }

  public getFactoryAddress(chainId: number, dexName: string): string | null {
    const dex = this.getDEXConfig(chainId, dexName);
    return dex?.addresses.factory || null;
  }

  public getSupportedFeeTiers(chainId: number, dexName: string): DEXFeeTier[] {
    const dex = this.getDEXConfig(chainId, dexName);
    return dex?.protocol.feeTiers.filter(tier => tier.isActive) || [];
  }

  public getOptimalFeeTier(chainId: number, dexName: string, tokenA: string, tokenB: string): DEXFeeTier | null {
    const feeTiers = this.getSupportedFeeTiers(chainId, dexName);
    
    // For now, return the middle fee tier
    // In practice, this would analyze pool liquidity and historical data
    const sortedTiers = feeTiers.sort((a, b) => a.fee - b.fee);
    const middleIndex = Math.floor(sortedTiers.length / 2);
    
    return sortedTiers[middleIndex] || null;
  }

  public isStablePair(tokenA: string, tokenB: string, stablecoins: string[]): boolean {
    return stablecoins.includes(tokenA.toLowerCase()) && 
           stablecoins.includes(tokenB.toLowerCase());
  }

  public getRecommendedDEX(
    chainId: number, 
    tokenA: string, 
    tokenB: string, 
    stablecoins: string[]
  ): DEXConfiguration | null {
    const activeDEXes = this.getActiveDEXes(chainId);
    
    // If it's a stable pair, prefer Curve
    if (this.isStablePair(tokenA, tokenB, stablecoins)) {
      const curve = activeDEXes.find(dex => dex.name.includes('curve'));
      if (curve) return curve;
    }
    
    // Otherwise, prefer V3 DEXes for better capital efficiency
    const v3DEXes = activeDEXes.filter(dex => dex.protocol.type === 'V3');
    if (v3DEXes.length > 0) {
      return v3DEXes[0];
    }
    
    // Fallback to best available DEX
    return this.getBestDEXForPair(chainId, tokenA, tokenB);
  }

  public validateDEXConfig(config: DEXConfiguration): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.name) errors.push('DEX name is required');
    if (!config.chainId) errors.push('Chain ID is required');
    if (!config.addresses.router) errors.push('Router address is required');
    if (!config.addresses.factory) errors.push('Factory address is required');
    if (config.protocol.feeTiers.length === 0) errors.push('At least one fee tier is required');
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  public getDEXHealthScore(chainId: number, dexName: string): number {
    const dex = this.getDEXConfig(chainId, dexName);
    if (!dex) return 0;
    
    const status = dex.status;
    let score = 0;
    
    // Success rate (40% weight)
    score += (status.successRate / 100) * 40;
    
    // Slippage score (30% weight) - lower is better
    const slippageScore = Math.max(0, 1 - (status.avgSlippage / 0.1)) * 30;
    score += slippageScore;
    
    // Gas efficiency (20% weight)
    const maxGas = 500000;
    const gasScore = Math.max(0, 1 - (Number(status.avgGasUsed) / maxGas)) * 20;
    score += gasScore;
    
    // Maintenance status (10% weight)
    if (status.isActive && !status.maintenanceMode) {
      score += 10;
    }
    
    return Math.round(score);
  }
}

// ========================================
// 🚀 UTILITY FUNCTIONS
// ========================================

export function getDEXConfig(chainId: number, dexName: string): DEXConfiguration | undefined {
  return DEXConfigManager.getInstance().getDEXConfig(chainId, dexName);
}

export function getAllDEXes(chainId?: number): DEXConfiguration[] {
  return DEXConfigManager.getInstance().getAllDEXes(chainId);
}

export function getActiveDEXes(chainId: number): DEXConfiguration[] {
  return DEXConfigManager.getInstance().getActiveDEXes(chainId);
}

export function getDEXABI(abiName: string): string[] | undefined {
  return DEXConfigManager.getInstance().getABI(abiName);
}

export function getRouterContract(chainId: number, dexName: string, provider: ethers.Provider): ethers.Contract | null {
  const config = getDEXConfig(chainId, dexName);
  if (!config) return null;
  
  let abi: string[] | undefined;
  if (config.protocol.type === 'V3') {
    abi = getDEXABI('uniswap-v3-router');
  } else if (config.protocol.type === 'V2') {
    abi = getDEXABI('uniswap-v2-router');
  } else if (config.protocol.type === 'Stable') {
    abi = getDEXABI('curve-pool');
  }
  
  if (!abi) return null;
  
  return new ethers.Contract(config.addresses.router, abi, provider);
}

export function getFactoryContract(chainId: number, dexName: string, provider: ethers.Provider): ethers.Contract | null {
  const config = getDEXConfig(chainId, dexName);
  if (!config || !config.addresses.factory) return null;
  
  let abi: string[] | undefined;
  if (config.protocol.type === 'V3') {
    abi = getDEXABI('uniswap-v3-factory');
  } else if (config.protocol.type === 'V2') {
    abi = getDEXABI('uniswap-v2-factory');
  }
  
  if (!abi) return null;
  
  return new ethers.Contract(config.addresses.factory, abi, provider);
}

// ========================================
// 📋 EXPORT
// ========================================

export {
  DEXConfiguration,
  DEXPool,
  DEXFeeTier,
  DEXTokenList
};