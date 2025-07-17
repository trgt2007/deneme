/**
 * @title UniswapV3Handler
 * @author Arbitrage Bot System
 * @notice Uniswap V3 protokol entegrasyonu - Stub Implementation
 * @dev Quote, swap, pool data ve event monitoring fonksiyonları
 */
import { JsonRpcProvider } from 'ethers';
interface IUniswapV3Factory {
    getPool(tokenA: string, tokenB: string, fee: number): Promise<string>;
}
interface IUniswapV3Pool {
    token0(): Promise<string>;
    token1(): Promise<string>;
    fee(): Promise<number>;
    slot0(): Promise<any>;
    liquidity(): Promise<bigint>;
}
interface IUniswapV3SwapRouter {
    exactInputSingle(params: any): Promise<any>;
    exactOutputSingle(params: any): Promise<any>;
}
interface IUniswapV3Quoter {
    quoteExactInputSingle(params: any): Promise<any>;
    quoteExactOutputSingle(params: any): Promise<any>;
}
interface IUniswapV3NonfungiblePositionManager {
    positions(tokenId: bigint): Promise<any>;
    mint(params: any): Promise<any>;
}
interface TickData {
    tick: number;
    liquidityNet: bigint;
    liquidityGross: bigint;
}
interface PositionData {
    tokenId: bigint;
    token0: string;
    token1: string;
    fee: number;
    tickLower: number;
    tickUpper: number;
    liquidity: bigint;
}
interface UniswapV3Config {
    provider: JsonRpcProvider;
    factory: string;
    router: string;
    quoter: string;
    positionManager: string;
    maxSlippage: number;
    defaultGasLimit: bigint;
}
declare enum FeeAmount {
    LOWEST = 100,
    LOW = 500,
    MEDIUM = 3000,
    HIGH = 10000
}
interface PriceRange {
    tickLower: number;
    tickUpper: number;
    minPrice: number;
    maxPrice: number;
}
interface PoolMetrics {
    liquidity: bigint;
    volume24h: bigint;
    fees24h: bigint;
    apr: number;
    utilization: number;
}
interface PoolInfo {
    address: string;
    token0: string;
    token1: string;
    fee: number;
    liquidity: bigint;
    reserve0?: bigint;
    reserve1?: bigint;
}
interface SwapParams {
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    amountOutMin: bigint;
    deadline: bigint;
    recipient: string;
    poolAddress?: string;
    useV3?: boolean;
    path?: string[];
    amountOutMinimum?: bigint;
}
interface QuoteResult {
    amountOut: bigint;
    gasEstimate: bigint;
    priceImpact: number;
    fee?: number;
    route?: any[];
}
interface PoolReserves {
    reserve0: bigint;
    reserve1: bigint;
    blockTimestampLast: number;
}
/**
 * @class UniswapV3Handler
 * @notice Uniswap V3 handler sınıfı - Stub Implementation
 * @dev V3 concentrated liquidity, tick-based sistem ve position management
 */
export declare class UniswapV3Handler {
    private config;
    private logger;
    private mathHelpers;
    private provider;
    private factory;
    private router;
    private quoter;
    private positionManager;
    private poolCache;
    private poolInfoCache;
    private tickCache;
    private metrics;
    /**
     * @notice UniswapV3Handler constructor - Stub Implementation
     * @param config Handler konfigürasyonu
     */
    constructor(config: UniswapV3Config);
    /**
     * @notice Token çifti için fiyat teklifi alır - Stub Implementation
     * @param tokenIn Giriş token adresi
     * @param tokenOut Çıkış token adresi
     * @param amountIn Giriş miktarı
     * @param fee Fee tier (opsiyonel)
     * @return Quote result
     */
    getQuote(tokenIn: string, tokenOut: string, amountIn: bigint, fee?: FeeAmount): Promise<QuoteResult | null>;
    /**
     * @notice Multi-fee quote alır - Stub Implementation
     * @param tokenIn Giriş token adresi
     * @param tokenOut Çıkış token adresi
     * @param amountIn Giriş miktarı
     * @return Best quote result
     */
    getBestQuote(tokenIn: string, tokenOut: string, amountIn: bigint): Promise<QuoteResult | null>;
    /**
     * @notice Multi-hop quote alır - Stub Implementation
     * @param path Token path with fees
     * @param amountIn Giriş miktarı
     * @return Quote result
     */
    getQuoteMultihop(path: {
        token: string;
        fee?: number;
    }[], amountIn: bigint): Promise<QuoteResult | null>;
    /**
     * @notice Swap parametreleri oluşturur - Stub Implementation
     * @param params Swap parameters
     * @return Encoded swap data
     */
    buildSwapTransaction(params: SwapParams): Promise<string>;
    /**
     * @notice Pool adresi döndürür - Stub Implementation
     * @param token0 İlk token
     * @param token1 İkinci token
     * @param fee Fee tier
     * @return Pool address
     */
    getPoolAddress(token0: string, token1: string, fee: FeeAmount): Promise<string>;
    /**
     * @notice Pool bilgilerini döndürür - Stub Implementation
     * @param poolAddress Pool adresi
     * @return Pool info
     */
    getPoolInfo(poolAddress: string): Promise<PoolInfo | null>;
    /**
     * @notice Pool slot0 bilgilerini döndürür - Stub Implementation
     * @param poolAddress Pool adresi
     * @return Slot0 data
     */
    getSlot0(poolAddress: string): Promise<{
        sqrtPriceX96: bigint;
        tick: number;
        observationIndex: number;
        observationCardinality: number;
        observationCardinalityNext: number;
        feeProtocol: number;
        unlocked: boolean;
    } | null>;
    /**
     * @notice Tick data döndürür - Stub Implementation
     * @param poolAddress Pool adresi
     * @param tick Tick number
     * @return Tick data
     */
    getTickData(poolAddress: string, tick: number): Promise<TickData | null>;
    /**
     * @notice Position bilgilerini döndürür - Stub Implementation
     * @param tokenId Position token ID
     * @return Position data
     */
    getPosition(tokenId: bigint): Promise<PositionData | null>;
    /**
     * @notice Pool metrics döndürür - Stub Implementation
     * @param poolAddress Pool adresi
     * @return Pool metrics
     */
    getPoolMetrics(poolAddress: string): Promise<PoolMetrics>;
    /**
     * @notice Price range hesaplar - Stub Implementation
     * @param tickLower Lower tick
     * @param tickUpper Upper tick
     * @return Price range
     */
    calculatePriceRange(tickLower: number, tickUpper: number): PriceRange;
    /**
     * @notice Pool fee döndürür - Stub Implementation
     * @param poolAddress Pool adresi
     * @return Fee amount
     */
    getPoolFee(poolAddress: string): Promise<number>;
    /**
     * @notice Pool reserves döndürür - Stub Implementation
     * @param token0 Token 0
     * @param token1 Token 1
     * @param fee Fee tier
     * @return Pool reserves
     */
    getReserves(token0: string, token1: string, fee: FeeAmount): Promise<PoolReserves | null>;
    /**
     * @notice 24h volume döndürür - Stub Implementation
     * @param token0 Token 0
     * @param token1 Token 1
     * @param fee Fee tier
     * @return 24h volume
     */
    get24hVolume(token0: string, token1: string, fee: FeeAmount): Promise<bigint>;
    /**
     * @notice Total supply döndürür - Stub Implementation
     * @param token0 Token 0
     * @param token1 Token 1
     * @param fee Fee tier
     * @return Total liquidity
     */
    getTotalSupply(token0: string, token1: string, fee: FeeAmount): Promise<bigint>;
    /**
     * @notice Contract'ları initialize eder - Stub Implementation
     */
    private initializeContracts;
    /**
     * @notice Single swap transaction oluşturur - Stub Implementation
     */
    private buildSingleSwapTransaction;
    /**
     * @notice Exact input transaction oluşturur - Stub Implementation
     */
    private buildExactInputTransaction;
    /**
     * @notice Quote metrics günceller - Stub Implementation
     */
    private updateQuoteMetrics;
    /**
     * @notice Event monitoring başlatır - Stub Implementation
     * @param callback Event callback
     * @return Unsubscribe function
     */
    subscribeToEvents(callback: (event: any) => void): Promise<() => void>;
    /**
     * @notice Metrics döndürür - Stub Implementation
     * @return Handler metrics
     */
    getMetrics(): typeof this.metrics;
}
export { IUniswapV3Factory, IUniswapV3Pool, IUniswapV3SwapRouter, IUniswapV3Quoter, IUniswapV3NonfungiblePositionManager, TickData, PositionData, UniswapV3Config, FeeAmount, PriceRange, PoolMetrics };
//# sourceMappingURL=UniswapV3Handler.d.ts.map