/**
 * @title MultiHopArbitrage
 * @author Arbitrage Bot System
 * @notice Multi-hop arbitrage stratejisi - Stub Implementation
 * @dev Çoklu DEX ve token üzerinden multi-hop arbitraj stratejisi
 */
import { DEXAggregator } from '../dex/DEXAggregator';
interface MultiHopArbitrageOpportunity {
    id: string;
    startToken: string;
    endToken: string;
    route: MultiHopRoute;
    totalGasEstimate: bigint;
    expectedProfit: bigint;
    netProfit: bigint;
    profitMargin: number;
    efficiency: number;
    confidence: number;
    timeWindow: number;
    riskScore: number;
    complexity: number;
    liquidity: bigint;
    opportunityType: OpportunityType;
    discoveryMethod: string;
    timestamp: number;
}
interface MultiHopRoute {
    hops: RouteHop[];
    totalHops: number;
    totalFees: bigint;
    maxSlippage: number;
    estimatedExecutionTime: number;
    dexDistribution: string[];
    pathEfficiency: number;
    routeType: RouteType;
    criticalPath: number[];
    fallbackRoutes: MultiHopRoute[];
}
interface RouteHop {
    tokenIn: string;
    tokenOut: string;
    dex: string;
    amountIn: bigint;
    expectedAmountOut: bigint;
    gasEstimate: bigint;
    priceImpact: number;
    slippage: number;
    fee: bigint;
    poolLiquidity: bigint;
    confidence: number;
    hopIndex: number;
}
declare enum OpportunityType {
    SIMPLE_MULTI_HOP = "simple_multi_hop",
    COMPLEX_ROUTING = "complex_routing",
    CROSS_DEX_HOP = "cross_dex_hop",
    ARBITRAGE_CHAIN = "arbitrage_chain"
}
declare enum RouteType {
    LINEAR = "linear",
    SPLIT = "split",
    MERGE = "merge",
    COMPLEX = "complex"
}
interface MultiHopConfig {
    dexAggregator: DEXAggregator;
    maxHops: number;
    minProfitThreshold: bigint;
    maxGasPrice: bigint;
    maxSlippage: number;
    timeoutMs: number;
    enabledTokens: string[];
    enabledDEXs: string[];
    complexityLimit: number;
    riskTolerance: number;
    useFlashLoan: boolean;
    maxConcurrentRoutes: number;
}
interface MultiHopMetrics {
    opportunitiesDetected: number;
    opportunitiesExecuted: number;
    totalProfit: bigint;
    averageProfit: bigint;
    successRate: number;
    averageHops: number;
    averageComplexity: number;
    averageExecutionTime: number;
    averageGasUsed: bigint;
    bestOpportunity: MultiHopArbitrageOpportunity | null;
    routeTypeDistribution: Map<RouteType, number>;
    lastUpdateTime: number;
}
interface RouteOptimization {
    originalRoute: MultiHopRoute;
    optimizedRoute: MultiHopRoute;
    improvement: number;
    optimizationType: string;
    gasSavings: bigint;
    profitIncrease: bigint;
}
interface ExecutionResult {
    opportunity: MultiHopArbitrageOpportunity;
    success: boolean;
    actualProfit: bigint;
    gasUsed: bigint;
    executionTime: number;
    actualHops: number;
    slippageExperienced: number;
    transactions: string[];
    error?: string;
    routePerformance: RouteHop[];
}
/**
 * @class MultiHopArbitrage
 * @notice Multi-hop arbitrage strategy implementation - Stub Implementation
 * @dev Çoklu DEX ve token üzerinden arbitraj fırsatları bulur ve execute eder
 */
export declare class MultiHopArbitrage {
    private config;
    private logger;
    private mathHelpers;
    private dexAggregator;
    private opportunities;
    private activeExecutions;
    private routeCache;
    private metrics;
    private scanningActive;
    private scanInterval?;
    private readonly MAX_DEPTH;
    private readonly ROUTE_CACHE_TTL;
    /**
     * @notice MultiHopArbitrage constructor - Stub Implementation
     * @param config Strategy konfigürasyonu
     */
    constructor(config: MultiHopConfig);
    /**
     * @notice Multi-hop scanning başlatır - Stub Implementation
     */
    startScanning(): Promise<void>;
    /**
     * @notice Scanning durdurur - Stub Implementation
     */
    stopScanning(): void;
    /**
     * @notice Mevcut fırsatları döndürür - Stub Implementation
     * @return Array of opportunities
     */
    getOpportunities(): MultiHopArbitrageOpportunity[];
    /**
     * @notice En iyi fırsatı döndürür - Stub Implementation
     * @return Best opportunity or null
     */
    getBestOpportunity(): MultiHopArbitrageOpportunity | null;
    /**
     * @notice Multi-hop route bulur - Stub Implementation
     * @param startToken Başlangıç token
     * @param endToken Bitiş token
     * @param amount Miktar
     * @param maxHops Maksimum hop sayısı
     * @return Multi-hop routes
     */
    findMultiHopRoutes(startToken: string, endToken: string, amount: bigint, maxHops?: number): Promise<MultiHopRoute[]>;
    /**
     * @notice Opportunity execute eder - Stub Implementation
     * @param opportunityId Opportunity ID
     * @param amount Override amount
     * @return Execution result
     */
    executeOpportunity(opportunityId: string, amount?: bigint): Promise<ExecutionResult | null>;
    /**
     * @notice Route optimize eder - Stub Implementation
     * @param route Original route
     * @return Optimization result
     */
    optimizeRoute(route: MultiHopRoute): Promise<RouteOptimization | null>;
    /**
     * @notice Route complexity analiz eder - Stub Implementation
     * @param route Route to analyze
     * @return Complexity score
     */
    analyzeComplexity(route: MultiHopRoute): {
        score: number;
        factors: string[];
        recommendation: string;
    };
    /**
     * @notice Strategy metrics döndürür - Stub Implementation
     * @return Strategy metrics
     */
    getMetrics(): MultiHopMetrics;
    /**
     * @notice Route cache'ini temizler - Stub Implementation
     */
    clearRouteCache(): void;
    /**
     * @notice Opportunity cache'ini temizler - Stub Implementation
     */
    clearOpportunities(): void;
    /**
     * @notice Opportunity scanning yapar - Stub Implementation
     */
    private scanForOpportunities;
    /**
     * @notice Route discovery yapar - Stub Implementation
     */
    private discoverRoutes;
    /**
     * @notice Mock route oluşturur - Stub Implementation
     */
    private createMockRoute;
    /**
     * @notice Intermediate tokens seçer - Stub Implementation
     */
    private selectIntermediateTokens;
    /**
     * @notice Route'dan opportunity oluşturur - Stub Implementation
     */
    private createOpportunityFromRoute;
    /**
     * @notice Route risk hesaplar - Stub Implementation
     */
    private calculateRouteRisk;
    /**
     * @notice Opportunity type belirler - Stub Implementation
     */
    private determineOpportunityType;
    /**
     * @notice Token kombinasyonları oluşturur - Stub Implementation
     */
    private generateTokenCombinations;
    /**
     * @notice Route validate eder - Stub Implementation
     */
    private validateRoute;
    /**
     * @notice Mock transactions oluşturur - Stub Implementation
     */
    private generateMockTransactions;
    /**
     * @notice Eski fırsatları temizler - Stub Implementation
     */
    private cleanupOldOpportunities;
    /**
     * @notice Metrics günceller - Stub Implementation
     */
    private updateMetrics;
}
export { MultiHopArbitrageOpportunity, MultiHopRoute, RouteHop, OpportunityType, RouteType, MultiHopConfig, MultiHopMetrics, RouteOptimization, ExecutionResult };
//# sourceMappingURL=MultiHopArbitrage.d.ts.map