/**
 * @title ArbitrageEngine - Arbitraj Motoru
 * @author Flashloan Arbitrage Bot Sistemi
 * @notice Ana arbitraj motoru - basitleştirilmiş stub implementasyon
 * @dev Hızlı derleme için minimal interface'ler
 */
import { EventEmitter } from 'events';
/**
 * Arbitraj Fırsatı - Basit Versiyon
 */
export interface ArbitrageOpportunity {
    id: string;
    token0: string;
    token1: string;
    exchange0: string;
    exchange1: string;
    expectedProfit: bigint;
    gasEstimate: bigint;
    slippage: number;
    timestamp: number;
}
/**
 * Swap Rotası - Basit Versiyon
 */
export interface SwapRoute {
    exchange: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    amountOut: bigint;
}
/**
 * Motor Konfigürasyonu - Basit Versiyon
 */
export interface EngineConfig {
    minProfitWei: bigint;
    maxGasPrice: bigint;
    scanInterval: number;
    maxSlippage: number;
    enableNotifications: boolean;
}
/**
 * Token Çifti - Basit Versiyon
 */
export interface TokenPair {
    token0: {
        address: string;
        symbol: string;
        decimals: number;
    };
    token1: {
        address: string;
        symbol: string;
        decimals: number;
    };
    exchanges: string[];
    lastUpdate: number;
}
/**
 * Piyasa Koşulları - Basit Versiyon
 */
export interface MarketConditions {
    gasPrice: bigint;
    volatility: number;
    timestamp: number;
}
/**
 * İşlem Sonucu - Basit Versiyon
 */
export interface ExecutionResult {
    success: boolean;
    transactionHash?: string;
    profit?: bigint;
    gasUsed?: bigint;
    error?: string;
    opportunity: ArbitrageOpportunity;
}
/**
 * Motor İstatistikleri - Basit Versiyon
 */
export interface EngineStats {
    totalOpportunities: number;
    successfulTrades: number;
    failedTrades: number;
    totalProfit: bigint;
    winRate: number;
    lastUpdate: number;
}
/**
 * Log Metadata - Basit Versiyon
 */
export interface LogMetadata {
    method: string;
    duration?: number;
    error?: string;
    [key: string]: any;
}
/**
 * Aggregator Config - Basit Versiyon
 */
export interface AggregatorConfig {
    enabled: boolean;
    timeout: number;
}
/**
 * ArbitrageEngine - Ana Arbitraj Motoru (Basit Stub)
 *
 * Tüm TypeScript hatalarını önlemek için minimal implementasyon.
 * Gerçek fonksiyonalite yerine sadece interface uyumluluğu sağlar.
 */
export declare class ArbitrageEngine extends EventEmitter {
    private config;
    private logger;
    private isRunning;
    private isPaused;
    private stats;
    private lastOpportunities;
    /**
     * Constructor - Basit Başlatıcı
     */
    constructor(config?: Partial<EngineConfig>);
    /**
     * Motoru Başlat
     */
    start(): Promise<void>;
    /**
     * Motoru Durdur
     */
    stop(): Promise<void>;
    /**
     * Motoru Duraklat
     */
    pause(): Promise<void>;
    /**
     * Motoru Devam Ettir
     */
    resume(): Promise<void>;
    /**
     * Arbitraj Fırsatı Ara - Stub
     */
    scanForOpportunities(): Promise<ArbitrageOpportunity[]>;
    /**
     * Arbitraj İşlemi Gerçekleştir - Stub
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
    };
    /**
     * Detaylı İstatistikler - Stub
     */
    getDetailedStats(): Promise<EngineStats & {
        hourlyStats: any[];
        dailyStats: any[];
        tokenStats: any[];
        exchangeStats: any[];
    }>;
    /**
     * Sağlık Kontrolü - Stub
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
}
/**
 * Varsayılan Motor Factory - Basit
 */
export declare function createDefaultEngine(): ArbitrageEngine;
export default ArbitrageEngine;
//# sourceMappingURL=ArbitrageEngine.d.ts.map