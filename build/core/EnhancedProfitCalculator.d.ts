/**
 * @title Enhanced ProfitCalculator - Gelişmiş Kar Hesaplayıcı
 * @author Flashloan Arbitrage Bot Sistemi
 * @notice Gerçek zamanlı kar/zarar hesaplaması - FULL IMPLEMENTATION
 * @dev Production-ready profit calculation with real market data
 */
interface EnhancedProfitConfig {
    flashloanFeeRate: number;
    swapFeeRate: number;
    gasBuffer: number;
    slippageTolerance: number;
    minProfitThreshold: bigint;
    maxGasPriceGwei: number;
    priceImpactThreshold: number;
    volatilityFactor: number;
    mevProtectionFee: number;
    networkCongestionMultiplier: number;
}
interface DetailedCalculationResult {
    grossProfit: bigint;
    flashloanFee: bigint;
    gasCost: bigint;
    swapFees: bigint;
    slippageCost: bigint;
    mevProtectionCost: bigint;
    networkFees: bigint;
    netProfit: bigint;
    profitMargin: number;
    roi: number;
    isProfitable: boolean;
    riskScore: number;
    confidence: number;
    priceImpact: number;
    expectedSlippage: number;
    marketVolatility: number;
    liquidityDepth: bigint;
    executionWindow: number;
    competitionLevel: number;
    mevRisk: number;
    optimalGasPrice: bigint;
    impermanentLossRisk: number;
    smartContractRisk: number;
    liquidityRisk: number;
    counterpartyRisk: number;
}
interface MarketDataInput {
    tokenPrices: Map<string, number>;
    gasPrice: bigint;
    blockNumber: number;
    timestamp: number;
    networkCongestion: number;
    mevActivity: number;
    volatilityIndex: number;
}
interface ArbitrageRoute {
    exchanges: string[];
    tokens: string[];
    amounts: bigint[];
    fees: number[];
    gasEstimates: bigint[];
    priceImpacts: number[];
    liquidityDepths: bigint[];
}
/**
 * Enhanced ProfitCalculator - Gelişmiş Kar Hesaplayıcı
 *
 * Real-world arbitraj karlılığını detaylı olarak analiz eder.
 * Market conditions, competition, MEV risks dahil.
 */
export declare class EnhancedProfitCalculator {
    private logger;
    private config;
    private marketData;
    constructor(config?: Partial<EnhancedProfitConfig>);
    /**
     * Ana kar hesaplama fonksiyonu - FULL IMPLEMENTATION
     */
    calculateProfitability(route: ArbitrageRoute, investmentAmount: bigint, marketData: MarketDataInput): Promise<DetailedCalculationResult>;
    /**
     * Brüt kar hesaplama
     */
    private calculateGrossProfit;
    /**
     * Tüm maliyetleri hesapla
     */
    private calculateAllCosts;
    /**
     * Risk metriklerini hesapla
     */
    private calculateRiskMetrics;
    private getDefaultConfig;
    private simulateSwap;
    private calculateTotalGasCost;
    private calculateSwapFees;
    private calculateSlippageCost;
    private calculateMEVProtectionCost;
    private calculateNetworkFees;
    private calculateMarketImpact;
    private calculateTimingFactors;
    private calculateLiquidityRisk;
    private calculateTotalLiquidity;
    private calculateSmartContractRisk;
    private calculateCounterpartyRisk;
    private calculateProfitMargin;
    private calculateROI;
    private calculateConfidence;
    private calculateOptimalGasPrice;
}
export {};
//# sourceMappingURL=EnhancedProfitCalculator.d.ts.map