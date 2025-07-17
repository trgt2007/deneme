/**
 * @title UniswapV3Handler - Uniswap V3 Entegrasyonu
 * @author Flashloan Arbitrage Bot Sistemi
 * @notice Gelişmiş Uniswap V3 işlemleri - FULL IMPLEMENTATION
 * @dev Production-ready Uniswap V3 integration with advanced features
 */
import { ethers } from 'ethers';
interface UniswapV3Config {
    factoryAddress: string;
    quoterAddress: string;
    routerAddress: string;
    positionManagerAddress: string;
    maxHops: number;
    slippageTolerance: number;
    deadline: number;
}
interface PoolInfo {
    token0: string;
    token1: string;
    fee: number;
    tickSpacing: number;
    liquidity: bigint;
    sqrtPriceX96: bigint;
    tick: number;
    observationIndex: number;
    observationCardinality: number;
    observationCardinalityNext: number;
    feeProtocol: number;
}
interface SwapQuote {
    amountOut: bigint;
    priceImpact: number;
    gasEstimate: bigint;
    route: string[];
    pools: PoolInfo[];
    executionPrice: number;
    sqrtPriceX96After: bigint;
    initializedTicksCrossed: number;
}
interface LiquidityAnalysis {
    totalLiquidity: bigint;
    availableLiquidity: bigint;
    priceRange: {
        min: number;
        max: number;
    };
    concentratedLiquidity: number;
    utilizationRate: number;
    depth: {
        bid: bigint;
        ask: bigint;
    };
}
/**
 * UniswapV3Handler - Gelişmiş Uniswap V3 Yönetimi
 *
 * Advanced features:
 * - Multi-hop routing optimization
 * - Concentrated liquidity analysis
 * - Price impact calculation
 * - MEV protection strategies
 * - Gas optimization
 */
export declare class UniswapV3Handler {
    private provider;
    private signer?;
    private config;
    private logger;
    private factoryContract;
    private quoterContract;
    private routerContract;
    private readonly FACTORY_ABI;
    private readonly QUOTER_ABI;
    private readonly POOL_ABI;
    constructor(provider: ethers.Provider, config?: Partial<UniswapV3Config>, signer?: ethers.Signer);
    /**
     * Ana swap quote alma fonksiyonu
     */
    getSwapQuote(tokenIn: string, tokenOut: string, amountIn: bigint, recipient?: string): Promise<SwapQuote>;
    /**
     * Direkt pool quote (single hop)
     */
    private getDirectPoolQuote;
    /**
     * Alpha Router ile multi-hop routing (currently disabled)
     */
    private getRoutedQuote;
    /**
     * Pool bilgilerini al
     */
    private getPoolInfo;
    /**
     * Likidite analizi yap
     */
    analyzeLiquidity(tokenA: string, tokenB: string, fee: number): Promise<LiquidityAnalysis>;
    /**
     * En iyi quote'u seç
     */
    private selectBestQuote;
    /**
     * Price impact hesapla
     */
    private calculatePriceImpact;
    /**
     * SqrtPriceX96'dan fiyata çevir
     */
    private sqrtPriceX96ToPrice;
    /**
     * Tick'den fiyata çevir
     */
    private tickToPrice;
    /**
     * Swap execute et
     */
    executeSwap(tokenIn: string, tokenOut: string, amountIn: bigint, minAmountOut: bigint, recipient: string, deadline?: number): Promise<ethers.TransactionResponse>;
    /**
     * Direkt swap execute
     */
    private executeDirectSwap;
    /**
     * Multi-hop swap execute
     */
    private executeMultiHopSwap;
}
export {};
//# sourceMappingURL=UniswapV3Handler.d.ts.map