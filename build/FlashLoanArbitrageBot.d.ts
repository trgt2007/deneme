/**
 * @title FlashLoanArbitrageBot - Ana Uygulama
 * @author Flashloan Arbitrage Bot Sistemi
 * @notice Production-ready arbitrage bot - FULL IMPLEMENTATION
 * @dev Complete arbitrage bot with all components integrated
 */
interface BotConfig {
    rpcUrl: string;
    chainId: number;
    privateKey: string;
    scanInterval: number;
    maxConcurrentTrades: number;
    emergencyStopEnabled: boolean;
    maxDailyLoss: bigint;
    stopLossPercentage: number;
    healthCheckInterval: number;
    metricsReportInterval: number;
    monitoredTokens: string[];
    enabledStrategies: string[];
}
interface BotStatus {
    isRunning: boolean;
    uptime: number;
    lastScanTime: number;
    activeOpportunities: number;
    totalTrades: number;
    totalProfit: bigint;
    currentBalance: bigint;
    healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    lastError?: string;
}
/**
 * FlashLoanArbitrageBot - Ana Bot Sınıfı
 *
 * Tüm bileşenleri koordine eden ana controller.
 * Production-ready özellikler:
 * - Continuous opportunity scanning
 * - Risk management integration
 * - Performance monitoring
 * - Emergency stop mechanisms
 * - Health checks
 * - Metrics collection
 */
export declare class FlashLoanArbitrageBot {
    private config;
    private provider;
    private signer;
    private wallet;
    private logger;
    private arbitrageStrategy;
    private profitCalculator;
    private isRunning;
    private startTime;
    private scanTimer?;
    private healthTimer?;
    private metricsTimer?;
    private status;
    private dailyMetrics;
    constructor(config?: Partial<BotConfig>);
    /**
     * Bot bileşenlerini başlat
     */
    private initializeComponents;
    /**
     * Bot'u başlat
     */
    start(): Promise<void>;
    /**
     * Bot'u durdur
     */
    stop(): Promise<void>;
    /**
     * Başlangıç kontrolleri
     */
    private performStartupChecks;
    /**
     * Opportunity taramayı başlat
     */
    private startScanning;
    /**
     * Tek tarama döngüsü
     */
    private performScan;
    /**
     * Token çiftleri oluştur
     */
    private generateTokenPairs;
    /**
     * Market koşullarını al
     */
    private getMarketConditions;
    /**
     * Trade sonucu işle
     */
    private handleTradeResult;
    /**
     * Health monitoring başlat
     */
    private startHealthMonitoring;
    /**
     * Health check yap
     */
    private performHealthCheck;
    /**
     * Health status güncelle
     */
    private updateHealthStatus;
    /**
     * Metrics raporlama başlat
     */
    private startMetricsReporting;
    /**
     * Metrics raporu
     */
    private reportMetrics;
    /**
     * Hata işleme
     */
    private handleError;
    /**
     * Acil durdurma
     */
    private emergencyStop;
    /**
     * Bot durumunu al
     */
    getStatus(): BotStatus;
    /**
     * Günlük metrikleri al
     */
    getDailyMetrics(): {
        profit: string;
        loss: string;
        gasSpent: string;
        trades: number;
        errors: number;
        startOfDay: number;
    };
}
export {};
//# sourceMappingURL=FlashLoanArbitrageBot.d.ts.map