/**
 * Circuit Breaker Konfigürasyonu
 * Sistem güvenlik ayarları ve eşik değerleri
 */
interface CircuitBreakerConfig {
    maxLossPercentage: number;
    maxConsecutiveLosses: number;
    maxLossAmountETH: bigint;
    maxDrawdownPercentage: number;
    maxLossesPerHour: number;
    maxLossesPerDay: number;
    maxGasPriceGwei: number;
    minLiquidityETH: bigint;
    maxSlippagePercent: number;
    autoRecoveryEnabled: boolean;
    recoveryDelayMinutes: number;
    manualOverrideRequired: boolean;
    checkIntervalMs: number;
    alertThresholdPercent: number;
}
/**
 * Circuit Breaker Durumu
 * Sistemin anlık durumu ve metrikleri
 */
interface CircuitBreakerState {
    isTripped: boolean;
    tripReason: string;
    tripTimestamp: number;
    expectedRecoveryTime: number;
    manualOverride: boolean;
    currentLossPercentage: number;
    consecutiveLosses: number;
    totalLossAmountETH: bigint;
    currentDrawdown: number;
    lossesThisHour: number;
    lossesToday: number;
    currentGasPrice: number;
    currentLiquidity: bigint;
    currentSlippage: number;
    recoveryAttempts: number;
    lastRecoveryAttempt: number;
    canAutoRecover: boolean;
}
/**
 * Circuit Breaker Metrikleri
 * Performans ve istatistik bilgileri
 */
interface CircuitBreakerMetrics {
    totalTrips: number;
    avgTripDuration: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    preventedLosses: bigint;
    uptime: number;
}
/**
 * Circuit Breaker - Devre Kesici Sistemi
 *
 * Arbitraj botunu tehlikeli piyasa koşullarından korur.
 * Zarar eşikleri aşıldığında otomatik olarak işlemleri durdurur.
 *
 * Özellikler:
 * - Çoklu zarar eşiği kontrolü
 * - Zaman bazlı limitler
 * - Piyasa koşulu analizi
 * - Otomatik kurtarma sistemi
 * - Detaylı metrik toplama
 */
export declare class CircuitBreaker {
    private logger;
    private notificationService;
    private databaseService;
    private config;
    private state;
    private tripConditions;
    private recoveryConditions;
    private monitoringInterval;
    private recoveryInterval;
    private lossHistory;
    private gasHistory;
    private slippageHistory;
    /**
     * Constructor - Circuit Breaker Başlatıcı
     * @param config - Devre kesici konfigürasyonu
     */
    constructor(config: CircuitBreakerConfig);
    /**
     * İşlem Öncesi Kontrol
     * Her arbitraj işleminden önce çağrılır
     */
    checkBeforeTransaction(amount: bigint, gasPrice: number, slippage: number): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    /**
     * İşlem Sonrası Kontrol
     * Her arbitraj işleminden sonra çağrılır
     */
    checkAfterTransaction(result: {
        success: boolean;
        profit: bigint;
        gasUsed: bigint;
        gasPrice: number;
        slippage: number;
    }): Promise<void>;
    /**
     * Circuit Breaker Tetikleme
     * Güvenlik eşiği aşıldığında sistemi durdurur
     */
    trip(reason: string, details: string): Promise<void>;
    /**
     * Manuel Reset
     * Operatör tarafından manuel olarak sistemi yeniden başlatır
     */
    manualReset(operatorId: string, reason: string): Promise<boolean>;
    /**
     * Anlık Durum Bilgisi
     */
    getState(): CircuitBreakerState;
    /**
     * Konfigürasyon Bilgisi
     */
    getConfig(): CircuitBreakerConfig;
    /**
     * Detaylı Metrikler
     */
    getMetrics(): Promise<CircuitBreakerMetrics>;
    /**
     * Sistem Sağlığı Kontrolü
     */
    healthCheck(): Promise<{
        status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
        details: string[];
        uptime: number;
    }>;
    /**
     * Varsayılan Konfigürasyon
     */
    private getDefaultConfig;
    /**
     * Başlangıç Durumu
     */
    private getInitialState;
    /**
     * Zarar Kaydı
     */
    private recordLoss;
    /**
     * Zarar Eşiklerini Kontrol Et
     */
    private checkLossThresholds;
    /**
     * Piyasa Geçmişini Güncelle
     */
    private updateMarketHistory;
    /**
     * Kurtarma Sürecini Başlat
     */
    private startRecoveryProcess;
    /**
     * Kurtarma Denemesi
     */
    private attemptRecovery;
    /**
     * Kurtarma Koşullarını Kontrol Et
     */
    private checkRecoveryConditions;
    /**
     * Durumu Kaydet
     */
    private saveState;
    /**
     * Temizlik - Sistem kapatılırken çağrılır
     */
    cleanup(): Promise<void>;
}
/**
 * Varsayılan Circuit Breaker Factory
 * Hızlı başlatma için kullanılır
 */
export declare function createDefaultCircuitBreaker(): CircuitBreaker;
export default CircuitBreaker;
//# sourceMappingURL=CircuitBreaker_NEW.d.ts.map