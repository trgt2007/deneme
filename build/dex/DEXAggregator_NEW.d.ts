/**
 * @title DEXAggregator
 * @author Arbitrage Bot System
 * @notice DEX aggregator - tüm DEX'leri birleştiren ana sınıf - Stub Implementation
 * @dev Quote karşılaştırma, routing optimizasyonu ve execution management
 */
import { JsonRpcProvider } from 'ethers';
declare enum DEXType {
    UNISWAP_V3 = "UniswapV3",
    SUSHISWAP = "Sushiswap",
    CURVE = "Curve",
    ONEINCH = "1inch",
    BALANCER = "Balancer"
}
interface DEXQuote {
    dex: DEXType;
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    amountOut: bigint;
    gasEstimate: bigint;
    priceImpact: number;
    route: any;
    fee: bigint;
    confidence: number;
    latency: number;
    timestamp: number;
}
interface BestQuoteResult {
    bestQuote: DEXQuote;
    allQuotes: DEXQuote[];
    savings: bigint;
    confidence: number;
    recommendedSlippage: number;
    estimatedExecutionTime: number;
}
interface SwapExecutionResult {
    dex: DEXType;
    hash: string;
    amountOut: bigint;
    gasUsed: bigint;
    success: boolean;
    timestamp: number;
    priceImpact: number;
    slippage: number;
}
interface DEXPerformance {
    dex: DEXType;
    quotes: number;
    swaps: number;
    averageLatency: number;
    averageGasUsed: bigint;
    averagePriceImpact: number;
    successRate: number;
    totalVolume: bigint;
    lastUpdated: number;
}
interface AggregatorConfig {
    provider: JsonRpcProvider;
    maxSlippage: number;
    timeout: number;
    enabledDEXs: DEXType[];
    gasOptimization: boolean;
    priceImpactThreshold: number;
    minLiquidityThreshold: bigint;
}
interface RouteOptions {
    maxHops: number;
    includeStablePairs: boolean;
    prioritizeLiquidity: boolean;
    optimizeForGas: boolean;
    slippageTolerance: number;
}
/**
 * @class DEXAggregator
 * @notice Ana DEX aggregator sınıfı - Stub Implementation
 * @dev Tüm DEX handler'ları yönetir ve en iyi fiyatları bulur
 */
export declare class DEXAggregator {
    private config;
    private logger;
    private mathHelpers;
    private handlers;
    private performance;
    private metrics;
    private quoteCache;
    private readonly CACHE_TTL;
    /**
     * @notice DEXAggregator constructor - Stub Implementation
     * @param config Aggregator konfigürasyonu
     */
    constructor(config: AggregatorConfig);
    /**
     * @notice En iyi quote'u bulur - Stub Implementation
     * @param tokenIn Giriş token adresi
     * @param tokenOut Çıkış token adresi
     * @param amountIn Giriş miktarı
     * @param options Route seçenekleri
     * @return Best quote result
     */
    getBestQuote(tokenIn: string, tokenOut: string, amountIn: bigint, options?: RouteOptions): Promise<BestQuoteResult | null>;
    /**
     * @notice Swap işlemini gerçekleştirir - Stub Implementation
     * @param quote Seçilen quote
     * @param recipient Alıcı adres
     * @param slippageOverride Slippage override
     * @return Swap execution result
     */
    executeSwap(quote: DEXQuote, recipient: string, slippageOverride?: number): Promise<SwapExecutionResult | null>;
    /**
     * @notice Multi-hop route bulur - Stub Implementation
     * @param tokenIn Giriş token
     * @param tokenOut Çıkış token
     * @param amountIn Giriş miktarı
     * @param maxHops Maksimum hop sayısı
     * @return Multi-hop route
     */
    findBestRoute(tokenIn: string, tokenOut: string, amountIn: bigint, maxHops?: number): Promise<DEXQuote[]>;
    /**
     * @notice DEX performanslarını döndürür - Stub Implementation
     * @return DEX performance map
     */
    getPerformanceMetrics(): Map<DEXType, DEXPerformance>;
    /**
     * @notice Aggregator metrics döndürür - Stub Implementation
     * @return Aggregator metrics
     */
    getMetrics(): typeof this.metrics;
    /**
     * @notice Desteklenen DEX listesini döndürür - Stub Implementation
     * @return Enabled DEX types
     */
    getSupportedDEXs(): DEXType[];
    /**
     * @notice Cache'i temizler - Stub Implementation
     */
    clearCache(): void;
    /**
     * @notice Handler'ları initialize eder - Stub Implementation
     */
    private initializeHandlers;
    /**
     * @notice Performance tracking initialize eder - Stub Implementation
     */
    private initializePerformanceTracking;
    /**
     * @notice Tüm DEX'lerden quote alır - Stub Implementation
     */
    private getAllQuotes;
    /**
     * @notice Handler'dan quote alır - Stub Implementation
     */
    private getQuoteFromHandler;
    /**
     * @notice En iyi quote'u seçer - Stub Implementation
     */
    private selectBestQuote;
    /**
     * @notice Best quote result oluşturur - Stub Implementation
     */
    private buildBestQuoteResult;
    /**
     * @notice Cache key oluşturur - Stub Implementation
     */
    private generateCacheKey;
    /**
     * @notice Performance'ı günceller - Stub Implementation
     */
    private updatePerformance;
    /**
     * @notice Metrics günceller - Stub Implementation
     */
    private updateMetrics;
}
export { DEXType, DEXQuote, BestQuoteResult, SwapExecutionResult, DEXPerformance, AggregatorConfig, RouteOptions };
//# sourceMappingURL=DEXAggregator_NEW.d.ts.map