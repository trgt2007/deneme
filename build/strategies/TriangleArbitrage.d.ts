/**
 * @title TriangleArbitrage
 * @author Arbitrage Bot System
 * @notice Triangle arbitrage stratejisi - Stub Implementation
 * @dev A→B→C→A triangle pattern detection ve execution
 */
import { DEXAggregator } from '../dex/DEXAggregator';
interface TriangleArbitrageOpportunity {
    id: string;
    tokenA: string;
    tokenB: string;
    tokenC: string;
    route: TriangleRoute;
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
    timestamp: number;
}
interface TriangleRoute {
    legs: TriangleLeg[];
    totalHops: number;
    totalFees: bigint;
    maxSlippage: number;
    estimatedExecutionTime: number;
    dexDistribution: string[];
    pathEfficiency: number;
}
interface TriangleLeg {
    tokenIn: string;
    tokenOut: string;
    dex: string;
    amountIn: bigint;
    expectedAmountOut: bigint;
    gasEstimate: bigint;
    priceImpact: number;
    slippage: number;
    fee: bigint;
    route: any;
    poolLiquidity: bigint;
    confidence: number;
}
interface TriangleConfig {
    dexAggregator: DEXAggregator;
    minProfitThreshold: bigint;
    maxGasPrice: bigint;
    maxSlippage: number;
    timeoutMs: number;
    riskTolerance: number;
    maxComplexity: number;
    enabledTokens: string[];
    maxOpportunities: number;
    refreshInterval: number;
}
interface TriangleMetrics {
    opportunitiesDetected: number;
    opportunitiesExecuted: number;
    totalProfit: bigint;
    averageProfit: bigint;
    successRate: number;
    averageExecutionTime: number;
    averageGasUsed: bigint;
    bestOpportunity: TriangleArbitrageOpportunity | null;
    worstOpportunity: TriangleArbitrageOpportunity | null;
    lastUpdateTime: number;
}
interface TriangleExecutionResult {
    opportunity: TriangleArbitrageOpportunity;
    success: boolean;
    actualProfit: bigint;
    gasUsed: bigint;
    executionTime: number;
    transactions: string[];
    error?: string;
    actualRoute: TriangleRoute;
    slippageExperienced: number;
}
/**
 * @class TriangleArbitrage
 * @notice Triangle arbitrage detector ve executor - Stub Implementation
 * @dev Multi-DEX triangle pattern scanning ve execution
 */
export declare class TriangleArbitrage {
    private config;
    private logger;
    private mathHelpers;
    private dexAggregator;
    private opportunities;
    private activeExecutions;
    private metrics;
    private scanningActive;
    private scanInterval?;
    private tokenCombinations;
    /**
     * @notice TriangleArbitrage constructor - Stub Implementation
     * @param config Strategy konfigürasyonu
     */
    constructor(config: TriangleConfig);
    /**
     * @notice Scanning başlatır - Stub Implementation
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
    getOpportunities(): TriangleArbitrageOpportunity[];
    /**
     * @notice En iyi fırsatı döndürür - Stub Implementation
     * @return Best opportunity or null
     */
    getBestOpportunity(): TriangleArbitrageOpportunity | null;
    /**
     * @notice Fırsat execute eder - Stub Implementation
     * @param opportunityId Fırsat ID'si
     * @param amountIn Giriş miktarı
     * @return Execution result
     */
    executeOpportunity(opportunityId: string, amountIn: bigint): Promise<TriangleExecutionResult | null>;
    /**
     * @notice Manual opportunity tarar - Stub Implementation
     * @param tokenTriple Specific token triple
     * @param amountIn Test amount
     * @return Triangle opportunity or null
     */
    scanTriangle(tokenTriple: {
        tokenA: string;
        tokenB: string;
        tokenC: string;
    }, amountIn: bigint): Promise<TriangleArbitrageOpportunity | null>;
    /**
     * @notice Strategy metrics döndürür - Stub Implementation
     * @return Triangle metrics
     */
    getMetrics(): TriangleMetrics;
    /**
     * @notice Active executions sayısını döndürür - Stub Implementation
     * @return Active execution count
     */
    getActiveExecutions(): number;
    /**
     * @notice Opportunity cache'ini temizler - Stub Implementation
     */
    clearOpportunities(): void;
    /**
     * @notice Opportunity scanning yapar - Stub Implementation
     */
    private scanForOpportunities;
    /**
     * @notice Triangle route oluşturur - Stub Implementation
     */
    private buildTriangleRoute;
    /**
     * @notice Token kombinasyonları oluşturur - Stub Implementation
     */
    private generateTokenCombinations;
    /**
     * @notice Eski fırsatları temizler - Stub Implementation
     */
    private cleanupOldOpportunities;
    /**
     * @notice Metrics günceller - Stub Implementation
     */
    private updateMetrics;
}
export { TriangleArbitrageOpportunity, TriangleRoute, TriangleLeg, TriangleConfig, TriangleMetrics, TriangleExecutionResult };
//# sourceMappingURL=TriangleArbitrage.d.ts.map