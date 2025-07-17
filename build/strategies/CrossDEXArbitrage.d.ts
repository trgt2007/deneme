interface CrossDEXArbitrageOpportunity {
    id: string;
    tokenA: string;
    tokenB: string;
    buyDEX: DEXInfo;
    sellDEX: DEXInfo;
    buyPrice: bigint;
    sellPrice: bigint;
    priceSpread: number;
    optimalAmount: bigint;
    expectedProfit: bigint;
    netProfit: bigint;
    profitMargin: number;
    efficiency: number;
    confidence: number;
    timeWindow: number;
    riskScore: number;
    liquidityDepth: bigint;
    marketImpact: number;
    dexPairRating: number;
    historicalSuccess: number;
    timestamp: number;
}
interface DEXInfo {
    name: string;
    type: DEXType;
    liquidity: bigint;
    volume24h: bigint;
    fee: number;
    gasEstimate: bigint;
    reliability: number;
    latency: number;
    route: any;
}
declare enum DEXType {
    AMM = "AMM",
    ORDERBOOK = "Orderbook",
    HYBRID = "Hybrid",
    AGGREGATOR = "Aggregator"
}
interface CrossDEXArbitrageConfig {
    minProfitMargin: number;
    maxSlippage: number;
    maxGasPrice: bigint;
    minLiquidity: bigint;
    maxExposure: bigint;
    executionTimeout: number;
    priceUpdateInterval: number;
    maxPriceAge: number;
    riskThreshold: number;
    enableMEVProtection: boolean;
    enableDynamicSizing: boolean;
    preferredDEXPairs: string[][];
    stableTokens: string[];
    volatileTokens: string[];
    maxConcurrentOpportunities: number;
    liquidityDepthThreshold: number;
    dexReliabilityThreshold: number;
}
export declare class CrossDEXArbitrageStrategy {
    private logger;
    private config;
    private dexAggregator;
    private flashLoanExecutor;
    private profitCalculator;
    private activeOpportunities;
    private executionQueue;
    private priceFeeds;
    private dexPairAnalytics;
    private marketAnalyzer;
    private competitionTracker;
    private dynamicSizer;
    private performance;
    private isRunning;
    private lastPriceUpdate;
    private executionInProgress;
    private concurrentExecutions;
    private hourlyStats;
    constructor(dexAggregator: any, flashLoanExecutor: any, profitCalculator: any, config: CrossDEXArbitrageConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    scanForCrossDEXOpportunities(tokenPairs: Array<{
        tokenA: string;
        tokenB: string;
    }>): Promise<CrossDEXArbitrageOpportunity[]>;
    private initializeDEXPairAnalytics;
    private initializeMarketComponents;
    private startCrossDEXPriceMonitoring;
    private startCrossDEXOpportunityScanning;
    private startCrossDEXExecutionLoop;
    private startCrossDEXPerformanceMonitoring;
    private getAllDEXQuotes;
    private analyzeCrossDEXPairs;
    private isCrossDEXOpportunityValid;
    healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        isRunning: boolean;
        lastExecution: string;
        queueSize: number;
        concurrentExecutions: number;
        successRate: number;
        totalProfit: string;
        averageSpread: number;
        marketCaptureRate: number;
        dexPairHealth: string;
    }>;
}
export {};
//# sourceMappingURL=CrossDEXArbitrage.d.ts.map