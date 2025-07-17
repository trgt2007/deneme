/**
 * @title PriceMonitor
 * @author Arbitrage Bot System
 * @notice Çoklu DEX fiyat takibi monitörü - Stub Implementation
 * @dev WebSocket based real-time price monitoring with 10-50ms latency target
 */
import { EventEmitter } from 'events';
interface WebSocket {
    send(data: string): void;
    close(): void;
    on(event: string, callback: Function): void;
    readyState: number;
}
declare const WebSocket: any;
interface PriceUpdate {
    pair: TokenPair;
    dex: string;
    price: bigint;
    timestamp: number;
    blockNumber: number;
    liquidity: bigint;
    volume24h: bigint;
    change24h: number;
    confidence: number;
}
interface PriceFeed {
    pair: TokenPair;
    dex: string;
    subscription: WebSocketConnection;
    lastUpdate: PriceUpdate | null;
    status: SubscriptionStatus;
    retryCount: number;
    latency: number;
}
interface TokenPair {
    token0: string;
    token1: string;
    symbol0: string;
    symbol1: string;
    decimals0: number;
    decimals1: number;
    poolAddress?: string;
    fee?: number;
}
interface DexPrice {
    dex: string;
    price: bigint;
    timestamp: number;
    blockNumber: number;
    liquidity: bigint;
    confidence: number;
}
interface PriceAggregation {
    pair: TokenPair;
    prices: DexPrice[];
    weightedPrice: bigint;
    standardDeviation: number;
    spread: number;
    volume: bigint;
    timestamp: number;
    anomalyDetected: boolean;
}
interface PriceAnomaly {
    pair: TokenPair;
    dex: string;
    anomalyType: 'spike' | 'drop' | 'spread' | 'volume';
    severity: number;
    threshold: number;
    actualValue: number;
    timestamp: number;
    confidence: number;
}
interface WebSocketConnection {
    url: string;
    ws: WebSocket | null;
    status: 'connected' | 'disconnected' | 'connecting' | 'error';
    lastPing: number;
    retryCount: number;
    subscriptions: string[];
}
interface PriceMonitorConfig {
    enabledDEXs: string[];
    targetPairs: TokenPair[];
    updateInterval: number;
    maxRetries: number;
    timeout: number;
    anomalyThreshold: number;
    priceDeviationThreshold: number;
    websocketEndpoints: Map<string, string>;
    enableAnomalyDetection: boolean;
    enableVolumeMonitoring: boolean;
}
declare enum SubscriptionStatus {
    IDLE = "idle",
    CONNECTING = "connecting",
    CONNECTED = "connected",
    SUBSCRIBED = "subscribed",
    ERROR = "error",
    DISCONNECTED = "disconnected"
}
interface PriceSnapshot {
    pair: TokenPair;
    prices: Map<string, DexPrice>;
    aggregatedPrice: bigint;
    spread: number;
    volume24h: bigint;
    timestamp: number;
}
/**
 * @class PriceMonitor
 * @notice Real-time fiyat takip sınıfı - Stub Implementation
 * @dev Multi-DEX WebSocket connections with ultra-low latency
 */
export declare class PriceMonitor extends EventEmitter {
    private config;
    private logger;
    private priceFeeds;
    private connections;
    private priceCache;
    private isMonitoring;
    private monitoringInterval?;
    private heartbeatInterval?;
    private metrics;
    /**
     * @notice PriceMonitor constructor - Stub Implementation
     * @param config Monitor konfigürasyonu
     */
    constructor(config: PriceMonitorConfig);
    /**
     * @notice Monitoring başlatır - Stub Implementation
     */
    startMonitoring(): Promise<void>;
    /**
     * @notice Monitoring durdurur - Stub Implementation
     */
    stopMonitoring(): Promise<void>;
    /**
     * @notice Token pair için latest price döndürür - Stub Implementation
     * @param pair Token pair
     * @return Price snapshot
     */
    getLatestPrice(pair: TokenPair): PriceSnapshot | null;
    /**
     * @notice Token pair için all DEX prices döndürür - Stub Implementation
     * @param pair Token pair
     * @return DEX prices map
     */
    getAllPrices(pair: TokenPair): Map<string, DexPrice>;
    /**
     * @notice Price spread hesaplar - Stub Implementation
     * @param pair Token pair
     * @return Spread percentage
     */
    getPriceSpread(pair: TokenPair): number;
    /**
     * @notice Token pair subscribe eder - Stub Implementation
     * @param pair Token pair
     * @param dex DEX name
     */
    subscribeToPair(pair: TokenPair, dex: string): Promise<void>;
    /**
     * @notice Token pair unsubscribe eder - Stub Implementation
     * @param pair Token pair
     * @param dex DEX name
     */
    unsubscribeFromPair(pair: TokenPair, dex: string): Promise<void>;
    /**
     * @notice Anomaly detection aktif/pasif eder - Stub Implementation
     * @param enabled Enable/disable
     */
    setAnomalyDetection(enabled: boolean): void;
    /**
     * @notice Monitor metrics döndürür - Stub Implementation
     * @return Monitoring metrics
     */
    getMetrics(): typeof this.metrics;
    /**
     * @notice Active connections sayısını döndürür - Stub Implementation
     * @return Connection count
     */
    getActiveConnections(): number;
    /**
     * @notice Connection status döndürür - Stub Implementation
     * @return Connection status map
     */
    getConnectionStatus(): Map<string, string>;
    /**
     * @notice Connections initialize eder - Stub Implementation
     */
    private initializeConnections;
    /**
     * @notice DEX'e bağlanır - Stub Implementation
     */
    private connectToDEX;
    /**
     * @notice Price feeds'e subscribe eder - Stub Implementation
     */
    private subscribeToFeeds;
    /**
     * @notice Monitoring loop başlatır - Stub Implementation
     */
    private startMonitoringLoop;
    /**
     * @notice Heartbeat başlatır - Stub Implementation
     */
    private startHeartbeat;
    /**
     * @notice Mock price updates başlatır - Stub Implementation
     */
    private startMockPriceUpdates;
    /**
     * @notice Price update işler - Stub Implementation
     */
    private handlePriceUpdate;
    /**
     * @notice Price cache günceller - Stub Implementation
     */
    private updatePriceCache;
    /**
     * @notice Snapshot recalculate eder - Stub Implementation
     */
    private recalculateSnapshot;
    /**
     * @notice Updates işler - Stub Implementation
     */
    private processUpdates;
    /**
     * @notice Anomaly detection yapar - Stub Implementation
     */
    private detectAnomalies;
    /**
     * @notice Metrics günceller - Stub Implementation
     */
    private updateMetrics;
    /**
     * @notice Heartbeats gönderir - Stub Implementation
     */
    private sendHeartbeats;
    /**
     * @notice Connection health check yapar - Stub Implementation
     */
    private checkConnectionHealth;
    /**
     * @notice DEX'e reconnect eder - Stub Implementation
     */
    private reconnectToDEX;
    /**
     * @notice Tüm bağlantıları kapatır - Stub Implementation
     */
    private closeAllConnections;
    /**
     * @notice Pair key oluşturur - Stub Implementation
     */
    private getPairKey;
}
export { PriceUpdate, PriceFeed, TokenPair, DexPrice, PriceAggregation, PriceAnomaly, WebSocketConnection, PriceMonitorConfig, SubscriptionStatus, PriceSnapshot };
//# sourceMappingURL=PriceMonitor.d.ts.map