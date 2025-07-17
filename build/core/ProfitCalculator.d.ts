/**
 * @title ProfitCalculator - Kar Hesaplayıcı
 * @author Flashloan Arbitrage Bot Sistemi
 * @notice Detaylı kar/zarar hesaplaması - basitleştirilmiş stub
 * @dev Hızlı derleme için minimal implementasyon
 */
/**
 * Kar Hesaplama Konfigürasyonu
 */
interface ProfitConfig {
    flashloanFeeRate: number;
    swapFeeRate: number;
    gasBuffer: number;
    slippageTolerance: number;
    minProfitThreshold: bigint;
}
/**
 * Hesaplama Sonucu
 */
interface CalculationResult {
    grossProfit: bigint;
    flashloanFee: bigint;
    gasCost: bigint;
    swapFees: bigint;
    slippageCost: bigint;
    netProfit: bigint;
    profitMargin: number;
    isprofitable: boolean;
    riskScore: number;
}
/**
 * Swap Route - Basit Versiyon
 */
interface SwapRoute {
    exchange: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    amountOut: bigint;
    gasEstimate?: bigint;
    fee?: number;
}
/**
 * Arbitraj Fırsatı - Basit Versiyon
 */
interface ArbitrageOpportunity {
    id: string;
    token0: string;
    token1: string;
    route: SwapRoute[];
    expectedProfit: bigint;
    gasEstimate: bigint;
    slippage: number;
}
/**
 * Piyasa Koşulları - Basit Versiyon
 */
interface MarketConditions {
    gasPrice: bigint;
    volatility: number;
    timestamp: number;
}
/**
 * ProfitCalculator - Kar Hesaplayıcı (Basit Stub)
 *
 * Arbitraj fırsatlarının karlılığını analiz eder.
 * Bu stub versiyonu sadece basic hesaplamalar yapar.
 */
export declare class ProfitCalculator {
    private logger;
    private config;
    /**
     * Constructor - Kar Hesaplayıcı Başlatıcı
     */
    constructor(config?: Partial<ProfitConfig>);
    /**
     * Arbitraj Karlılığını Hesapla - Ana Metod
     */
    calculateArbitrageProfit(opportunity: ArbitrageOpportunity, marketConditions: MarketConditions): Promise<CalculationResult>;
    /**
     * Hızlı Karlılık Kontrolü
     * Detaylı hesaplama yapmadan hızlı kontrol
     */
    quickProfitabilityCheck(expectedProfit: bigint, gasEstimate: bigint, gasPrice: bigint): Promise<{
        isPotentiallyProfitable: boolean;
        estimatedNetProfit: bigint;
    }>;
    /**
     * Optimal Loan Miktarını Hesapla
     */
    calculateOptimalLoanAmount(tokenPrice: bigint, liquidityAvailable: bigint, maxLoanAmount?: bigint): bigint;
    /**
     * Loan Miktarını Hesapla
     */
    private calculateLoanAmount;
    /**
     * Flashloan Ücretini Hesapla
     */
    private calculateFlashloanFee;
    /**
     * Gas Maliyetini Hesapla
     */
    private calculateGasCost;
    /**
     * Swap Ücretlerini Hesapla
     */
    private calculateSwapFees;
    /**
     * Kayma Maliyetini Hesapla
     */
    private calculateSlippageCost;
    /**
     * Risk Skorunu Hesapla
     */
    private calculateRiskScore;
    /**
     * Varsayılan Konfigürasyon
     */
    private getDefaultConfig;
    /**
     * Sonuçları Formatla
     */
    formatCalculationResult(result: CalculationResult): {
        grossProfitEth: string;
        netProfitEth: string;
        totalCostsEth: string;
        profitMarginPercent: string;
        riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    };
    /**
     * Konfigürasyon Güncelle
     */
    updateConfig(newConfig: Partial<ProfitConfig>): void;
    /**
     * Mevcut Konfigürasyonu Al
     */
    getConfig(): ProfitConfig;
}
/**
 * Varsayılan Kar Hesaplayıcı Factory
 */
export declare function createDefaultProfitCalculator(): ProfitCalculator;
export default ProfitCalculator;
//# sourceMappingURL=ProfitCalculator.d.ts.map