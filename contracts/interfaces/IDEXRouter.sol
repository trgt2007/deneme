// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IDEXRouter
 * @author Arbitrage Bot System
 * @notice Tüm DEX protokolleri için router interface tanımlamaları
 * @dev Bu dosya Uniswap V3, Sushiswap, Curve, 1inch ve Balancer interface'lerini içerir
 */

// ============ Uniswap V3 Interfaces ============

/**
 * @title IUniswapV3Factory
 * @notice Uniswap V3 Factory interface'i
 * @dev Pool oluşturma ve pool adresi sorgulama için kullanılır
 */
interface IUniswapV3Factory {
    /**
     * @notice Pool oluşturulduğunda emit edilir
     */
    event PoolCreated(
        address indexed token0,
        address indexed token1,
        uint24 indexed fee,
        int24 tickSpacing,
        address pool
    );

    /**
     * @notice Belirli bir token çifti ve fee için pool adresini döndürür
     * @param tokenA İlk token
     * @param tokenB İkinci token
     * @param fee Pool fee tier (500, 3000, 10000)
     * @return pool Pool adresi
     */
    function getPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) external view returns (address pool);

    /**
     * @notice Yeni bir pool oluşturur
     */
    function createPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) external returns (address pool);

    /**
     * @notice Fee amount için tick spacing'i döndürür
     */
    function feeAmountTickSpacing(uint24 fee) external view returns (int24);
}

/**
 * @title IUniswapV3SwapRouter
 * @notice Uniswap V3 SwapRouter02 interface'i
 * @dev Token swap işlemleri için kullanılır
 */
interface IUniswapV3SwapRouter {
    /**
     * @notice Tek havuzdan exact input swap parametreleri
     */
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    /**
     * @notice Çoklu havuzdan exact input swap parametreleri
     */
    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    /**
     * @notice Tek havuzdan exact output swap parametreleri
     */
    struct ExactOutputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountOut;
        uint256 amountInMaximum;
        uint160 sqrtPriceLimitX96;
    }

    /**
     * @notice Tek havuzdan exact input swap
     */
    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);

    /**
     * @notice Çoklu havuzdan exact input swap
     */
    function exactInput(ExactInputParams calldata params)
        external
        payable
        returns (uint256 amountOut);

    /**
     * @notice Tek havuzdan exact output swap
     */
    function exactOutputSingle(ExactOutputSingleParams calldata params)
        external
        payable
        returns (uint256 amountIn);

    /**
     * @notice Multicall - birden fazla fonksiyonu tek transaction'da çağır
     */
    function multicall(bytes[] calldata data)
        external
        payable
        returns (bytes[] memory results);

    /**
     * @notice Kullanılmayan ETH'yi geri gönder
     */
    function refundETH() external payable;

    /**
     * @notice Token'ları çek
     */
    function sweepToken(
        address token,
        uint256 amountMinimum,
        address recipient
    ) external payable;

    /**
     * @notice WETH'i unwrap et
     */
    function unwrapWETH9(uint256 amountMinimum, address recipient) external payable;
}

/**
 * @title IUniswapV3Quoter
 * @notice Uniswap V3 Quoter interface'i
 * @dev Swap simülasyonu ve fiyat tahmini için kullanılır
 */
interface IUniswapV3Quoter {
    /**
     * @notice Exact input single quote
     */
    function quoteExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint160 sqrtPriceLimitX96
    ) external returns (uint256 amountOut);

    /**
     * @notice Exact input multi-hop quote
     */
    function quoteExactInput(bytes memory path, uint256 amountIn)
        external
        returns (uint256 amountOut);

    /**
     * @notice Exact output single quote
     */
    function quoteExactOutputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountOut,
        uint160 sqrtPriceLimitX96
    ) external returns (uint256 amountIn);
}

/**
 * @title IUniswapV3Pool
 * @notice Uniswap V3 Pool interface'i
 * @dev Pool state ve liquidity bilgileri için kullanılır
 */
interface IUniswapV3Pool {
    /**
     * @notice Pool'un mevcut slot0 verilerini döndürür
     */
    function slot0()
        external
        view
        returns (
            uint160 sqrtPriceX96,
            int24 tick,
            uint16 observationIndex,
            uint16 observationCardinality,
            uint16 observationCardinalityNext,
            uint8 feeProtocol,
            bool unlocked
        );

    /**
     * @notice Pool'daki likiditeyi döndürür
     */
    function liquidity() external view returns (uint128);

    /**
     * @notice Token0 adresini döndürür
     */
    function token0() external view returns (address);

    /**
     * @notice Token1 adresini döndürür
     */
    function token1() external view returns (address);

    /**
     * @notice Pool fee'sini döndürür
     */
    function fee() external view returns (uint24);

    /**
     * @notice Tick spacing'i döndürür
     */
    function tickSpacing() external view returns (int24);

    /**
     * @notice Swap fonksiyonu
     */
    function swap(
        address recipient,
        bool zeroForOne,
        int256 amountSpecified,
        uint160 sqrtPriceLimitX96,
        bytes calldata data
    ) external returns (int256 amount0, int256 amount1);

    /**
     * @notice Pozisyon bilgisi
     */
    function positions(bytes32 key)
        external
        view
        returns (
            uint128 liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        );

    /**
     * @notice Observation bilgisi
     */
    function observations(uint256 index)
        external
        view
        returns (
            uint32 blockTimestamp,
            int56 tickCumulative,
            uint160 secondsPerLiquidityCumulativeX128,
            bool initialized
        );
}

// ============ SushiSwap Interfaces ============

/**
 * @title ISushiSwapV2Factory
 * @notice SushiSwap V2 Factory interface'i
 */
interface ISushiSwapV2Factory {
    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function allPairs(uint) external view returns (address pair);
    function allPairsLength() external view returns (uint);
    function createPair(address tokenA, address tokenB) external returns (address pair);
    function feeTo() external view returns (address);
    function feeToSetter() external view returns (address);
}

/**
 * @title ISushiSwapV2Router
 * @notice SushiSwap V2 Router interface'i
 */
interface ISushiSwapV2Router {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);

    /**
     * @notice Add liquidity
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);

    /**
     * @notice Add liquidity ETH
     */
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);

    /**
     * @notice Swap exact tokens for tokens
     */
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    /**
     * @notice Swap tokens for exact tokens
     */
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    /**
     * @notice Swap exact ETH for tokens
     */
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);

    /**
     * @notice Swap exact tokens for ETH
     */
    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    /**
     * @notice Quote fonksiyonu
     */
    function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB);

    /**
     * @notice Get amount out
     */
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut);

    /**
     * @notice Get amount in
     */
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) external pure returns (uint amountIn);

    /**
     * @notice Get amounts out
     */
    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);

    /**
     * @notice Get amounts in
     */
    function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts);
}

/**
 * @title ISushiSwapV2Pair
 * @notice SushiSwap V2 Pair interface'i
 */
interface ISushiSwapV2Pair {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function price0CumulativeLast() external view returns (uint);
    function price1CumulativeLast() external view returns (uint);
    function kLast() external view returns (uint);
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
    function skim(address to) external;
    function sync() external;
}

// ============ Curve Finance Interfaces ============

/**
 * @title ICurveRegistry
 * @notice Curve Registry interface'i
 * @dev Pool discovery ve metadata için kullanılır
 */
interface ICurveRegistry {
    function pool_count() external view returns (uint256);
    function pool_list(uint256 i) external view returns (address);
    function get_pool_from_lp_token(address lp_token) external view returns (address);
    function get_lp_token(address pool) external view returns (address);
    
    /**
     * @notice Pool'daki coin'leri döndürür
     */
    function get_coins(address pool) external view returns (address[8] memory);
    
    /**
     * @notice Pool'daki coin sayısını döndürür
     */
    function get_n_coins(address pool) external view returns (uint256[2] memory);
    
    /**
     * @notice Coin balance'larını döndürür
     */
    function get_balances(address pool) external view returns (uint256[8] memory);
    
    /**
     * @notice Underlying coin'leri döndürür (wrapped için)
     */
    function get_underlying_coins(address pool) external view returns (address[8] memory);
    
    /**
     * @notice Exchange amount'u hesaplar
     */
    function get_exchange_amount(
        address pool,
        address from,
        address to,
        uint256 amount
    ) external view returns (uint256);
}

/**
 * @title ICurvePool
 * @notice Genel Curve pool interface'i
 * @dev Farklı pool tipleri için temel fonksiyonlar
 */
interface ICurvePool {
    /**
     * @notice İki coin arasında exchange yapar
     * @param i Input coin index
     * @param j Output coin index
     * @param dx Input amount
     * @param min_dy Minimum output amount
     * @return Actual output amount
     */
    function exchange(
        int128 i,
        int128 j,
        uint256 dx,
        uint256 min_dy
    ) external returns (uint256);
    
    /**
     * @notice Underlying coin'lerle exchange (wrapped pool'lar için)
     */
    function exchange_underlying(
        int128 i,
        int128 j,
        uint256 dx,
        uint256 min_dy
    ) external returns (uint256);
    
    /**
     * @notice Exchange amount'u hesaplar
     */
    function get_dy(
        int128 i,
        int128 j,
        uint256 dx
    ) external view returns (uint256);
    
    /**
     * @notice Underlying için exchange amount'u hesaplar
     */
    function get_dy_underlying(
        int128 i,
        int128 j,
        uint256 dx
    ) external view returns (uint256);
    
    /**
     * @notice Coin adresini döndürür
     */
    function coins(uint256 index) external view returns (address);
    
    /**
     * @notice Coin balance'ını döndürür
     */
    function balances(uint256 index) external view returns (uint256);
    
    /**
     * @notice Fee'yi döndürür
     */
    function fee() external view returns (uint256);
    
    /**
     * @notice Admin fee'yi döndürür
     */
    function admin_fee() external view returns (uint256);
}

/**
 * @title ICurveStableSwap
 * @notice Curve StableSwap pool interface'i (3pool, sUSD, etc.)
 */
interface ICurveStableSwap is ICurvePool {
    function A() external view returns (uint256);
    function A_precise() external view returns (uint256);
    function get_virtual_price() external view returns (uint256);
    function calc_token_amount(uint256[3] calldata amounts, bool is_deposit) external view returns (uint256);
    function add_liquidity(uint256[3] calldata amounts, uint256 min_mint_amount) external returns (uint256);
    function remove_liquidity(uint256 _amount, uint256[3] calldata min_amounts) external returns (uint256[3] memory);
    function remove_liquidity_imbalance(uint256[3] calldata amounts, uint256 max_burn_amount) external returns (uint256);
    function remove_liquidity_one_coin(uint256 _token_amount, int128 i, uint256 min_amount) external returns (uint256);
}

/**
 * @title ICurveCryptoSwap
 * @notice Curve CryptoSwap pool interface'i (tricrypto, etc.)
 */
interface ICurveCryptoSwap is ICurvePool {
    function token() external view returns (address);
    function price_scale() external view returns (uint256);
    function price_oracle() external view returns (uint256);
    function last_prices() external view returns (uint256);
    function last_prices_timestamp() external view returns (uint256);
    function initial_A_gamma() external view returns (uint256, uint256);
    function future_A_gamma() external view returns (uint256, uint256);
}

// ============ 1inch Interfaces ============

/**
 * @title IAggregationRouterV5
 * @notice 1inch Aggregation Router V5 interface'i
 * @dev En güncel 1inch router versiyonu
 */
interface IAggregationRouterV5 {
    /**
     * @notice Swap description struct
     */
    struct SwapDescription {
        address srcToken;
        address dstToken;
        address srcReceiver;
        address dstReceiver;
        uint256 amount;
        uint256 minReturnAmount;
        uint256 flags;
    }

    /**
     * @notice Ana swap fonksiyonu
     * @param executor Executor adresi (genelde router)
     * @param desc Swap açıklaması
     * @param permit Permit data (opsiyonel)
     * @param data Executor'a gönderilecek data
     * @return returnAmount Alınan miktar
     * @return spentAmount Harcanan miktar
     */
    function swap(
        address executor,
        SwapDescription calldata desc,
        bytes calldata permit,
        bytes calldata data
    ) external payable returns (uint256 returnAmount, uint256 spentAmount);

    /**
     * @notice Swap with minimal parameters
     */
    function unoswap(
        address srcToken,
        uint256 amount,
        uint256 minReturn,
        uint256[] calldata pools
    ) external payable returns (uint256 returnAmount);

    /**
     * @notice Multiple unoswaps
     */
    function unoswapMulti(
        address srcToken,
        uint256[] calldata amounts,
        uint256 minReturn,
        uint256[][] calldata pools
    ) external payable returns (uint256 returnAmount);

    /**
     * @notice Clipper swap için özel fonksiyon
     */
    function clipperSwap(
        address clipperExchange,
        address srcToken,
        address dstToken,
        uint256 inputAmount,
        uint256 outputAmount,
        uint256 goodUntil,
        bytes32 r,
        bytes32 vs
    ) external payable returns (uint256 returnAmount);

    /**
     * @notice RFQ (Request for Quote) swap
     */
    function fillOrderRFQ(
        uint256 info,
        address makerAsset,
        address takerAsset,
        address maker,
        address allowedSender,
        uint256 makingAmount,
        uint256 takingAmount
    ) external payable returns (uint256, uint256);
}

/**
 * @title IAggregationExecutor
 * @notice 1inch Aggregation Executor interface'i
 */
interface IAggregationExecutor {
    /**
     * @notice Execute swap logic
     */
    function execute(address msgSender) external payable;
}

// ============ Balancer V2 Interfaces ============

/**
 * @title IBalancerVault
 * @notice Balancer V2 Vault interface'i
 * @dev Tüm Balancer swap ve likidite işlemleri Vault üzerinden yapılır
 */
interface IBalancerVault {
    /**
     * @notice Swap türleri
     */
    enum SwapKind { GIVEN_IN, GIVEN_OUT }

    /**
     * @notice Single swap struct
     */
    struct SingleSwap {
        bytes32 poolId;
        SwapKind kind;
        address assetIn;
        address assetOut;
        uint256 amount;
        bytes userData;
    }

    /**
     * @notice Batch swap struct
     */
    struct BatchSwapStep {
        bytes32 poolId;
        uint256 assetInIndex;
        uint256 assetOutIndex;
        uint256 amount;
        bytes userData;
    }

    /**
     * @notice Fund management struct
     */
    struct FundManagement {
        address sender;
        bool fromInternalBalance;
        address payable recipient;
        bool toInternalBalance;
    }

    /**
     * @notice Join/Exit türleri
     */
    enum PoolSpecialization { GENERAL, MINIMAL_SWAP_INFO, TWO_TOKEN }

    /**
     * @notice Single swap
     */
    function swap(
        SingleSwap memory singleSwap,
        FundManagement memory funds,
        uint256 limit,
        uint256 deadline
    ) external payable returns (uint256);

    /**
     * @notice Batch swap
     */
    function batchSwap(
        SwapKind kind,
        BatchSwapStep[] memory swaps,
        address[] memory assets,
        FundManagement memory funds,
        int256[] memory limits,
        uint256 deadline
    ) external payable returns (int256[] memory);

    /**
     * @notice Query batch swap (simülasyon için)
     */
    function queryBatchSwap(
        SwapKind kind,
        BatchSwapStep[] memory swaps,
        address[] memory assets,
        FundManagement memory funds
    ) external returns (int256[] memory);

    /**
     * @notice Flash loan
     */
    function flashLoan(
        address recipient,
        address[] memory tokens,
        uint256[] memory amounts,
        bytes memory userData
    ) external;

    /**
     * @notice Get pool tokens
     */
    function getPoolTokens(bytes32 poolId)
        external
        view
        returns (
            address[] memory tokens,
            uint256[] memory balances,
            uint256 lastChangeBlock
        );

    /**
     * @notice Get pool info
     */
    function getPool(bytes32 poolId)
        external
        view
        returns (address, PoolSpecialization);

    /**
     * @notice Join pool
     */
    function joinPool(
        bytes32 poolId,
        address sender,
        address recipient,
        JoinPoolRequest memory request
    ) external payable;

    /**
     * @notice Exit pool
     */
    function exitPool(
        bytes32 poolId,
        address sender,
        address payable recipient,
        ExitPoolRequest memory request
    ) external;

    struct JoinPoolRequest {
        address[] assets;
        uint256[] maxAmountsIn;
        bytes userData;
        bool fromInternalBalance;
    }

    struct ExitPoolRequest {
        address[] assets;
        uint256[] minAmountsOut;
        bytes userData;
        bool toInternalBalance;
    }

    /**
     * @notice Get protocol fees
     */
    function getProtocolFeesCollector() external view returns (address);

    /**
     * @notice Pause state
     */
    function getPausedState()
        external
        view
        returns (
            bool paused,
            uint256 pauseWindowEndTime,
            uint256 bufferPeriodEndTime
        );
}

/**
 * @title IBalancerPool
 * @notice Genel Balancer pool interface'i
 */
interface IBalancerPool {
    function getPoolId() external view returns (bytes32);
    function getVault() external view returns (address);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function getInvariant() external view returns (uint256);
    function getLastInvariant() external view returns (uint256);
    function getSwapFeePercentage() external view returns (uint256);
    function getScalingFactors() external view returns (uint256[] memory);
    
    /**
     * @notice Calculate amounts out for BPT in
     */
    function calcTokensOutGivenExactBptIn(
        uint256 bptAmountIn
    ) external view returns (uint256[] memory);
    
    /**
     * @notice Calculate BPT out for exact tokens in
     */
    function calcBptOutGivenExactTokensIn(
        uint256[] memory amountsIn
    ) external view returns (uint256);
}

/**
 * @title IBalancerWeightedPool
 * @notice Weighted pool interface'i
 */
interface IBalancerWeightedPool is IBalancerPool {
    function getNormalizedWeights() external view returns (uint256[] memory);
    function getGradualWeightUpdateParams()
        external
        view
        returns (
            uint256 startTime,
            uint256 endTime,
            uint256[] memory startWeights,
            uint256[] memory endWeights
        );
}

/**
 * @title IBalancerStablePool
 * @notice Stable pool interface'i
 */
interface IBalancerStablePool is IBalancerPool {
    function getAmplificationParameter()
        external
        view
        returns (
            uint256 value,
            bool isUpdating,
            uint256 precision
        );
}

// ============ Common DEX Interfaces ============

/**
 * @title IWETH9
 * @notice Wrapped ETH interface'i
 * @dev Tüm DEX'lerde kullanılan WETH9 kontratı için
 */
interface IWETH9 {
    function deposit() external payable;
    function withdraw(uint256 wad) external;
    function totalSupply() external view returns (uint256);
    function approve(address guy, uint256 wad) external returns (bool);
    function transfer(address dst, uint256 wad) external returns (bool);
    function transferFrom(address src, address dst, uint256 wad) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title IERC20Extended
 * @notice Extended ERC20 interface with metadata
 */
interface IERC20Extended {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    
    // Metadata extensions
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    
    // EIP-2612 permit
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
    
    function nonces(address owner) external view returns (uint256);
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}