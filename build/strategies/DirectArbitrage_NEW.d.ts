/**
 * @title DirectArbitrage
 * @author Arbitrage Bot System
 * @notice Direct arbitrage stratejisi - Stub Implementation
 * @dev İki DEX arası direkt fiyat farkı arbitraj stratejisi
 */
import { DEXAggregator } from '../dex/DEXAggregator';
interface DirectArbitrageOpportunity {
    id: string;
    tokenA: string;
    tokenB: string;
    buyDEX: string;
    sellDEX: string;
    buyPrice: bigint;
    sellPrice: bigint;
    priceSpread: number;
    optimalAmount: bigint;
    expectedProfit: bigint;
    gasEstimate: bigint;
    netProfit: bigint;
    profitMargin: number;
    confidence: number;
    timeWindow: number;
    riskScore: number;
    timestamp: number;
}
interface DirectArbitrageResult {
    opportunityId: string;
    executed: boolean;
    actualProfit: bigint;
    gasUsed: bigint;
    executionTime: number;
    slippage: number;
    buyTxHash?: string;
    sellTxHash?: string;
    flashLoanTxHash?: string;
    error?: string;
    profitMargin: number;
    efficiency: number;
}
interface DirectArbitrageConfig {
    minProfitMargin: number;
    maxSlippage: number;
    maxGasPrice: bigint;
    minLiquidity: bigint;
    maxTradeAmount: bigint;
    enabledTokens: string[];
    enabledDEXs: string[];
    maxExecutionTime: number;
    riskTolerance: number;
    useFlashLoan: boolean;
    flashLoanProviders: string[];
    dexAggregator: DEXAggregator;
}
interface DirectArbitrageMetrics {
    opportunitiesDetected: number;
    opportunitiesExecuted: number;
    totalProfit: bigint;
    averageProfit: bigint;
    successRate: number;
    averageExecutionTime: number;
    averageSlippage: number;
    averageGasUsed: bigint;
    totalGasSpent: bigint;
    bestOpportunity: DirectArbitrageOpportunity | null;
    worstOpportunity: DirectArbitrageOpportunity | null;
    profitabilityTrend: number;
    lastUpdateTime: number;
}
interface RiskAssessment {
    overall: number;
    liquidity: number;
    volatility: number;
    slippage: number;
    gasPrice: number;
    timeRisk: number;
    recommendation: 'execute' | 'wait' | 'skip';
    reasons: string[];
}
interface TokenPairAnalysis {
    tokenA: string;
    tokenB: string;
    symbol: string;
    volume24h: bigint;
    liquidity: bigint;
    volatility: number;
    averageSpread: number;
    opportunityCount: number;
    profitability: number;
    lastOpportunity: number;
}
/**
 * @class DirectArbitrage
 * @notice Direct arbitrage strategy implementation - Stub Implementation
 * @dev İki DEX arasında direkt fiyat farkından arbitraj yapan strateji
 */
export declare class DirectArbitrage {
    private config;
    private logger;
    private mathHelpers;
    private dexAggregator;
    private opportunities;
    private activeExecutions;
    private tokenPairAnalysis;
    private metrics;
    private scanningActive;
    private scanInterval?;
    /**
     * @notice DirectArbitrage constructor - Stub Implementation
     * @param config Strategy konfigürasyonu
     */
    constructor(config: DirectArbitrageConfig);
    /**
     * @notice Opportunity scanning başlatır - Stub Implementation
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
    getOpportunities(): DirectArbitrageOpportunity[];
    /**
     * @notice En iyi fırsatı döndürür - Stub Implementation
     * @return Best opportunity or null
     */
    getBestOpportunity(): DirectArbitrageOpportunity | null;
    /**
     * @notice Specific token pair için fırsat tarar - Stub Implementation
     * @param tokenA Token A address
     * @param tokenB Token B address
     * @return Arbitrage opportunity or null
     */
    scanTokenPair(tokenA: string, tokenB: string): Promise<DirectArbitrageOpportunity | null>;
    /**
     * @notice Fırsat execute eder - Stub Implementation
     * @param opportunityId Opportunity ID
     * @param amount Override amount
     * @return Execution result
     */
    executeOpportunity(opportunityId: string, amount?: bigint): Promise<DirectArbitrageResult | null>;
    /**
     * @notice Token pair analysis yapar - Stub Implementation
     * @param tokenA Token A address
     * @param tokenB Token B address
     * @return Token pair analysis
     */
    analyzeTokenPair(tokenA: string, tokenB: string): Promise<TokenPairAnalysis>;
    /**
     * @notice Risk assessment yapar - Stub Implementation
     * @param opportunity Arbitrage opportunity
     * @return Risk assessment
     */
    assessRisk(opportunity: DirectArbitrageOpportunity): RiskAssessment;
    /**
     * @notice Strategy metrics döndürür - Stub Implementation
     * @return Strategy metrics
     */
    getMetrics(): DirectArbitrageMetrics;
    /**
     * @notice Active executions sayısını döndürür - Stub Implementation
     * @return Active execution count
     */
    getActiveExecutions(): number;
    /**
     * @notice Token pair analysis cache'ini temizler - Stub Implementation
     */
    clearAnalysisCache(): void;
    /**
     * @notice Opportunity cache'ini temizler - Stub Implementation
     */
    clearOpportunities(): void;
    /**
     * @notice Fırsat taraması yapar - Stub Implementation
     */
    private scanForOpportunities;
    /**
     * @notice Tüm DEX'lerden quote alır - Stub Implementation
     */
    private getQuotesFromAllDEXs;
    /**
     * @notice Token pair'leri oluşturur - Stub Implementation
     */
    private generateTokenPairs;
    /**
     * @notice Risk score hesaplar - Stub Implementation
     */
    private calculateRiskScore;
    /**
     * @notice Eski fırsatları temizler - Stub Implementation
     */
    private cleanupOldOpportunities;
    /**
     * @notice Metrics günceller - Stub Implementation
     */
    private updateMetrics;
}
export { DirectArbitrageOpportunity, DirectArbitrageResult, DirectArbitrageConfig, DirectArbitrageMetrics, RiskAssessment, TokenPairAnalysis };
//# sourceMappingURL=DirectArbitrage_NEW.d.ts.map