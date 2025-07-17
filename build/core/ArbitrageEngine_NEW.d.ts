/**
 * @title ArbitrageEngine - Arbitraj Motoru
 * @author Flashloan Arbitrage Bot Sistemi
 * @notice Ana arbitraj motoru - fiyat analizi ve karar verme sistemi
 * @dev Multi-thread desteği ile yüksek performanslı arbitraj motoru
 */
import { EventEmitter } from 'events';
/**
 * Arbitraj Fırsatı
 * Tespit edilen arbitraj fırsatının detayları
 */
export interface ArbitrageOpportunity {
    id: string;
    token0: string;
    token1: string;
    exchange0: string;
    exchange1: string;
    price0: bigint;
    price1: bigint;
    priceDiff: number;
    expectedProfit: bigint;
    gasEstimate: bigint;
    netProfit: bigint;
    confidence: number;
    expiry: number;
    route: SwapRoute[];
    liquidityRequired: bigint;
    slippage: number;
    risk: number;
    timestamp: number;
}
/**
 * Swap Rotası
 * Token değişim adımları
 */
export interface SwapRoute {
    exchange: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    amountOut: bigint;
    gasEstimate: bigint;
    poolAddress?: string;
    fee?: number;
}
/**
 * Motor Konfigürasyonu
 * Arbitraj motorunun ayarları
 */
export interface EngineConfig {
    minProfitWei: bigint;
    minProfitPercentage: number;
    maxGasPrice: bigint;
    gasMultiplier: number;
    scanInterval: number;
    maxOpportunities: number;
    timeoutMs: number;
    maxSlippage: number;
    minLiquidity: bigint;
    maxRisk: number;
    enableMultiThread: boolean;
    workerCount: number;
    batchSize: number;
    enableNotifications: boolean;
    logLevel: string;
    metricsEnabled: boolean;
}
/**
 * Token Çifti
 * İşlem görmesi için token bilgileri
 */
export interface TokenPair {
    token0: {
        address: string;
        symbol: string;
        decimals: number;
        balance?: bigint;
    };
    token1: {
        address: string;
        symbol: string;
        decimals: number;
        balance?: bigint;
    };
    exchanges: string[];
    volume24h?: bigint;
    lastUpdate: number;
}
/**
 * Piyasa Koşulları
 * Anlık piyasa durumu
 */
export interface MarketConditions {
    gasPrice: bigint;
    networkCongestion: number;
    volatility: number;
    liquidityIndex: number;
    marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    timestamp: number;
}
/**
 * İşlem Sonucu
 * Arbitraj işleminin sonucu
 */
export interface ExecutionResult {
    success: boolean;
    transactionHash?: string;
    profit?: bigint;
    gasUsed?: bigint;
    gasPrice?: bigint;
    executionTime?: number;
    error?: string;
    opportunity: ArbitrageOpportunity;
}
/**
 * Motor İstatistikleri
 * Performans metrikleri
 */
export interface EngineStats {
    totalOpportunities: number;
    successfulTrades: number;
    failedTrades: number;
    totalProfit: bigint;
    totalGasSpent: bigint;
    averageExecutionTime: number;
    winRate: number;
    uptime: number;
    lastUpdate: number;
}
/**
 * Log Metadata
 * Log kayıtları için metadata
 */
export interface LogMetadata {
    method: string;
    duration?: number;
    gasUsed?: bigint;
    profit?: bigint;
    error?: string;
    [key: string]: any;
}
/**
 * Aggregator Konfigürasyonu
 * DEX aggregator ayarları
 */
export interface AggregatorConfig {
    enabled: boolean;
    timeout: number;
    retryCount: number;
    gasMultiplier: number;
}
/**
 * ArbitrageEngine - Ana Arbitraj Motoru
 *
 * Piyasadaki arbitraj fırsatlarını tespit eder ve otomatik olarak işlem gerçekleştirir.
 * Multi-thread desteği ile yüksek performanslı çalışır.
 *
 * Özellikler:
 * - Real-time fiyat monitörü
 * - Multi-DEX karşılaştırması
 * - Risk yönetimi
 * - Otomatik flashloan yönetimi
 * - Detaylı performans metrikleri
 */
export declare class ArbitrageEngine extends EventEmitter {
    private config;
    private logger;
    private priceMonitor;
    private gasMonitor;
    private liquidityMonitor;
    private profitCalculator;
    private flashLoanExecutor;
    private dexAggregator;
    private notificationService;
    private databaseService;
    private circuitBreaker;
    private positionManager;
    private isRunning;
    private isPaused;
    private workers;
    private stats;
    private lastOpportunities;
    private scanTimer;
    private metricsTimer;
    /**
     * Constructor - Arbitraj Motoru Başlatıcı
     * @param config - Motor konfigürasyonu
     */
    constructor(config?: Partial<EngineConfig>);
    /**
     * Motoru Başlat
     * Arbitraj taramaya başlar
     */
    start(): Promise<void>;
    /**
     * Motoru Durdur
     * Güvenli şekilde motoru kapatır
     */
    stop(): Promise<void>;
    /**
     * Motoru Duraklat
     * Geçici olarak taramayı durdurur
     */
    pause(): Promise<void>;
    /**
     * Motoru Devam Ettir
     * Duraklatılmış motoru yeniden başlatır
     */
    resume(): Promise<void>;
    /**
     * Arbitraj Fırsatı Ara
     * Piyasadaki fırsatları tarar ve analiz eder
     */
    scanForOpportunities(): Promise<ArbitrageOpportunity[]>;
    /**
     * Arbitraj İşlemi Gerçekleştir
     * En iyi fırsatı seçer ve işlem yapar
     */
    executeArbitrage(opportunity: ArbitrageOpportunity): Promise<ExecutionResult>;
    /**
     * Motor Durumunu Al
     */
    getStatus(): {
        isRunning: boolean;
        isPaused: boolean;
        stats: EngineStats;
        lastOpportunities: ArbitrageOpportunity[];
        marketConditions?: MarketConditions;
    };
    /**
     * Detaylı İstatistikler
     */
    getDetailedStats(): Promise<EngineStats & {
        hourlyStats: any[];
        dailyStats: any[];
        tokenStats: any[];
        exchangeStats: any[];
    }>;
    /**
     * Sağlık Kontrolü
     */
    healthCheck(): Promise<{
        status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
        details: string[];
        uptime: number;
        components: Record<string, 'OK' | 'WARNING' | 'ERROR'>;
    }>;
    /**
     * Varsayılan Konfigürasyon
     */
    private getDefaultConfig;
    /**
     * Başlangıç İstatistikleri
     */
    private getInitialStats;
    /**
     * Servisleri Başlat
     */
    private initializeServices;
    /**
     * Monitörleri Başlat
     */
    private startMonitoring;
    /**
     * Worker'ları Başlat
     */
    private startWorkers;
    /**
     * Ana Tarama Döngüsü
     */
    private startScanningLoop;
    /**
     * Metrik Toplama Başlat
     */
    private startMetricsCollection;
    /**
     * Piyasa Koşullarını Al
     */
    private getMarketConditions;
    /**
     * Piyasa Uygunluğu Kontrolü
     */
    private isMarketSuitable;
    /**
     * Aktif Token Çiftlerini Al
     */
    private getActiveTokenPairs;
    /**
     * Token Çifti Tarama
     */
    private scanTokenPair;
    /**
     * Fırsatları Filtrele ve Sırala
     */
    private filterAndRankOpportunities;
    /**
     * İstatistikleri Güncelle
     */
    private updateStats;
    /**
     * İşlem Bildirimi Gönder
     */
    private sendExecutionNotification;
    /**
     * Worker'ları Durdur
     */
    private stopWorkers;
    /**
     * Monitörleri Durdur
     */
    private stopMonitoring;
    /**
     * Servisleri Temizle
     */
    private cleanupServices;
    /**
     * Metrik Toplama
     */
    private collectMetrics;
}
/**
 * Varsayılan Motor Factory
 * Hızlı başlatma için kullanılır
 */
export declare function createDefaultEngine(): ArbitrageEngine;
export default ArbitrageEngine;
//# sourceMappingURL=ArbitrageEngine_NEW.d.ts.map