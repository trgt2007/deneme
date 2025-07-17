import { JsonRpcProvider } from 'ethers';
declare enum PoolType {
    WEIGHTED = "Weighted",
    STABLE = "Stable",
    LIQUIDITY_BOOTSTRAPPING = "LiquidityBootstrapping",
    INVESTMENT = "Investment",
    META_STABLE = "MetaStable"
}
interface BalancerPool {
    id: string;
    address: string;
    poolType: PoolType;
    tokens: string[];
    weights?: number[];
    amplificationParameter?: bigint;
    swapFee: bigint;
    totalLiquidity: bigint;
    volume24h: bigint;
    factory?: string;
}
interface BalancerSwapRoute {
    tokenIn: string;
    tokenOut: string;
    pools: BalancerPool[];
    expectedOutput: bigint;
    priceImpact: number;
    gasEstimate: bigint;
    hops: number;
}
interface BalancerConfig {
    vaultAddress: string;
    subgraphUrl: string;
    maxHops: number;
    maxSlippage: number;
    cacheTTL: number;
    requestTimeout: number;
    retryAttempts: number;
}
/**
 * 🎯 BALANCER V2 HANDLER
 * Balancer V2 Vault sistemi ile entegrasyon sağlar
 */
export declare class BalancerHandler {
    private logger;
    private provider;
    private vault;
    private config;
    private poolCache;
    private routeCache;
    private lastCacheUpdate;
    private stats;
    constructor(provider: JsonRpcProvider, config: BalancerConfig);
    /**
     * 💰 Token fiyatı al (quote)
     */
    getQuote(tokenIn: string, tokenOut: string, amountIn: bigint, options?: {
        maxHops?: number;
        excludePools?: string[];
        preferredPools?: string[];
    }): Promise<{
        amountOut: bigint;
        route: BalancerSwapRoute;
        gasEstimate: bigint;
        priceImpact: number;
    }>;
    /**
     * 🔄 Swap işlemi gerçekleştir
     */
    executeSwap(route: BalancerSwapRoute, amountIn: bigint, minAmountOut: bigint, recipient: string, deadline?: number): Promise<{
        hash: string;
        amountOut: bigint;
        gasUsed: bigint;
    }>;
    /**
     * 🔍 En iyi route bul
     */
    private findBestRoute;
    /**
     * 🔄 Direct pools bul
     */
    private findDirectPools;
    /**
     * 🔀 Multi-hop route bul
     */
    private findMultiHopRoute;
    /**
     * 🏆 En iyi pool seç
     */
    private selectBestPool;
    /**
     * 🔨 Batch swap oluştur
     */
    private buildBatchSwap;
    /**
     * 🔍 Bir sonraki token bul
     */
    private findNextToken;
    /**
     * 📊 Fiyat etkisi hesapla
     */
    private calculatePriceImpact;
    /**
     * ⛽ Gas estimate
     */
    private estimateGas;
    /**
     * 📤 Swap output parse et
     */
    private parseSwapOutput;
    /**
     * 🔄 Pool cache güncelle
     */
    private updatePoolCache;
    /**
     * 📊 Subgraph'dan pool verileri al
     */
    private fetchPoolsFromSubgraph;
    /**
     * 📊 Handler istatistikleri
     */
    getStats(): {
        poolCacheSize: number;
        routeCacheSize: number;
        lastCacheUpdate: string;
        successRate: string;
        cacheHitRate: string;
        totalQueries: number;
        successfulQueries: number;
        cacheHits: number;
        averageLatency: number;
        lastError: string | null;
    };
    /**
     * 🧹 Cache temizle
     */
    clearCache(): void;
    /**
     * 🔧 Health check
     */
    healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        latency: number;
        poolCount: number;
        lastError: string | null;
    }>;
}
export {};
//# sourceMappingURL=BalancerHandler.d.ts.map