/**
 * @title EnhancedDirectArbitrage - Gelişmiş Direkt Arbitraj Stratejisi
 * @author Flashloan Arbitrage Bot Sistemi
 * @notice Production-ready arbitrage strategy - FULL IMPLEMENTATION
 * @dev Advanced multi-DEX arbitrage with MEV protection and risk management
 */
import { ethers } from 'ethers';
interface ArbitrageConfig {
    minProfitThreshold: bigint;
    maxInvestmentAmount: bigint;
    slippageTolerance: number;
    gasMultiplier: number;
    maxConcurrentTrades: number;
    priorityFeeMultiplier: number;
    mevProtectionEnabled: boolean;
    blacklistedTokens: string[];
    whitelistedDEXes: string[];
}
interface OpportunityData {
    id: string;
    tokenA: string;
    tokenB: string;
    dexA: string;
    dexB: string;
    priceA: bigint;
    priceB: bigint;
    priceDifference: number;
    liquidityA: bigint;
    liquidityB: bigint;
    optimalAmount: bigint;
    estimatedProfit: bigint;
    gasEstimate: bigint;
    confidence: number;
    detectedAt: number;
    expiryTime: number;
}
interface ExecutionResult {
    success: boolean;
    transactionHash?: string;
    profit?: bigint;
    gasUsed?: bigint;
    executionTime: number;
    error?: string;
    slippage?: number;
    mevDetected?: boolean;
}
interface MarketConditions {
    gasPrice: bigint;
    networkCongestion: number;
    mevActivity: number;
    volatility: number;
    blockNumber: number;
    timestamp: number;
}
/**
 * EnhancedDirectArbitrage - Gelişmiş Arbitraj Stratejisi
 *
 * Features:
 * - Multi-DEX opportunity scanning
 * - Real-time profit optimization
 * - MEV protection mechanisms
 * - Dynamic gas pricing
 * - Risk-adjusted execution
 * - Circuit breaker integration
 */
export declare class EnhancedDirectArbitrage {
    private provider;
    private signer;
    private config;
    private logger;
    private profitCalculator;
    private dexHandlers;
    private activeOpportunities;
    private executionQueue;
    private isExecuting;
    private performanceMetrics;
    constructor(provider: ethers.Provider, signer: ethers.Signer, config?: Partial<ArbitrageConfig>);
    /**
     * DEX handler'larını başlat
     */
    private initializeDEXHandlers;
    /**
     * Ana arbitraj taraması
     */
    scanForOpportunities(tokenPairs: Array<{
        tokenA: string;
        tokenB: string;
    }>, marketConditions: MarketConditions): Promise<OpportunityData[]>;
    /**
     * Token çifti taraması
     */
    private scanTokenPair;
    /**
     * İki DEX arasında token çifti karşılaştırması
     */
    private compareTokenPairOnDEXes;
    /**
     * Arbitraj fırsatını execute et
     */
    executeArbitrage(opportunity: OpportunityData): Promise<ExecutionResult>;
    /**
     * Optimal miktar hesapla
     */
    private calculateOptimalAmount;
    /**
     * Kar tahmini
     */
    private estimateProfit;
    /**
     * Pre-execution checks
     */
    private preExecutionChecks;
    /**
     * MEV risk değerlendirmesi
     */
    private assessMEVRisk;
    /**
     * Arbitraj transaction execute
     */
    private executeArbitrageTransaction;
    /**
     * Performance metrics güncelle
     */
    private updatePerformanceMetrics;
    /**
     * Confidence hesapla
     */
    private calculateConfidence;
    /**
     * Token blacklist kontrolü
     */
    private isTokenBlacklisted;
    /**
     * Performance metrikleri al
     */
    getPerformanceMetrics(): {
        successRate: number;
        averageProfit: bigint;
        totalTrades: number;
        successfulTrades: number;
        totalProfit: bigint;
        totalGasSpent: bigint;
        averageExecutionTime: number;
        mevBlocked: number;
    };
}
export {};
//# sourceMappingURL=EnhancedDirectArbitrage.d.ts.map