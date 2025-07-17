/**
 * @title GasMonitor - Gas Fiyat Monitörü
 * @author Flashloan Arbitrage Bot Sistemi
 * @notice Gas fiyat takibi - basitleştirilmiş stub
 * @dev Hızlı derleme için minimal implementasyon
 */
import { EventEmitter } from 'events';
import { JsonRpcProvider } from 'ethers';
/**
 * Gas Fiyatları
 */
interface GasPrice {
    slow: bigint;
    standard: bigint;
    fast: bigint;
    instant: bigint;
}
/**
 * Gas Tahmini
 */
interface GasEstimate {
    gasLimit: bigint;
    gasPrice: bigint;
    estimatedCost: bigint;
}
/**
 * Gas Metrikleri
 */
interface GasMetrics {
    currentGasPrice: bigint;
    averageGasPrice: bigint;
    networkCongestion: number;
    lastUpdated: number;
}
/**
 * Gas Monitör Konfigürasyonu
 */
interface GasMonitorConfig {
    updateInterval?: number;
    provider?: JsonRpcProvider;
}
/**
 * İşlem Tipi
 */
declare enum TransactionType {
    STANDARD = "standard",
    SWAP = "swap",
    ARBITRAGE = "arbitrage",
    FLASHLOAN = "flashloan"
}
/**
 * Öncelik Seviyesi
 */
declare enum PriorityLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
/**
 * GasMonitor - Gas Fiyat Monitörü (Basit Stub)
 *
 * Gas fiyatlarını izler ve tahminler yapar.
 * Bu stub versiyonu sadece temel işlevsellik sağlar.
 */
export declare class GasMonitor extends EventEmitter {
    private logger;
    private config;
    private isMonitoring;
    private currentGasPrice;
    private metrics;
    /**
     * Constructor - Gas Monitörü Başlatıcı
     */
    constructor(config?: GasMonitorConfig);
    /**
     * Gas Monitoring Başlat
     */
    start(): Promise<void>;
    /**
     * Gas Monitoring Durdur
     */
    stop(): Promise<void>;
    /**
     * Mevcut Gas Fiyatlarını Al
     */
    getCurrentGasPrice(): GasPrice;
    /**
     * Gas Tahmini Yap
     */
    estimateGas(txType: TransactionType, priority: PriorityLevel, gasLimit?: bigint): Promise<GasEstimate>;
    /**
     * Gas Metriklerini Al
     */
    getMetrics(): GasMetrics;
    /**
     * Gas Strateji Önerisi
     */
    suggestGasStrategy(txType: TransactionType, urgency: PriorityLevel): {
        gasPrice: bigint;
        strategy: string;
    };
    /**
     * Monitoring Aktif Mi
     */
    isActive(): boolean;
    /**
     * Gas Fiyat Güncelle
     */
    updateGasPrice(): Promise<void>;
    /**
     * Temizlik
     */
    cleanup(): Promise<void>;
}
export { GasPrice, GasEstimate, GasMetrics, GasMonitorConfig, TransactionType, PriorityLevel };
export default GasMonitor;
//# sourceMappingURL=GasMonitor.d.ts.map