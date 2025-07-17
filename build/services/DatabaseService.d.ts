interface DatabaseConfig {
    redis: RedisConfig;
    cache: CacheConfig;
    persistence: PersistenceConfig;
    performance: PerformanceConfig;
    backup: BackupConfig;
}
interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db: number;
    maxRetriesPerRequest: number;
    retryDelayOnFailover: number;
    connectTimeout: number;
    lazyConnect: boolean;
    keepAlive: number;
    family: number;
    keyPrefix: string;
    enableReadyCheck: boolean;
    cluster?: ClusterConfig;
}
interface ClusterConfig {
    enabled: boolean;
    nodes: Array<{
        host: string;
        port: number;
    }>;
    options: {
        redisOptions: any;
        enableOfflineQueue: boolean;
        maxRetriesPerRequest: number;
    };
}
interface CacheConfig {
    defaultTTL: number;
    priceDataTTL: number;
    transactionTTL: number;
    performanceTTL: number;
    opportunityTTL: number;
    strategyStatsTTL: number;
    maxMemoryUsage: string;
    evictionPolicy: string;
    compressionEnabled: boolean;
    serializationFormat: 'json' | 'msgpack' | 'protobuf';
}
interface PersistenceConfig {
    enableSnapshot: boolean;
    snapshotInterval: number;
    enableAOF: boolean;
    aofSyncPolicy: 'always' | 'everysec' | 'no';
    backupRetention: number;
    dataDirectory: string;
}
interface PerformanceConfig {
    connectionPoolSize: number;
    maxConcurrentOperations: number;
    batchSize: number;
    pipelineEnabled: boolean;
    compressionThreshold: number;
    monitoringInterval: number;
}
interface BackupConfig {
    enabled: boolean;
    schedule: string;
    retentionDays: number;
    compressionEnabled: boolean;
    remoteBackup: {
        enabled: boolean;
        provider: 's3' | 'gcs' | 'azure';
        bucket: string;
        region: string;
        credentials: any;
    };
}
interface PriceData {
    tokenA: string;
    tokenB: string;
    exchange: string;
    price: string;
    volume24h: string;
    liquidity: string;
    timestamp: number;
    blockNumber: number;
    confidence: number;
}
interface TransactionRecord {
    id: string;
    strategy: string;
    txHash: string;
    status: 'pending' | 'confirmed' | 'failed';
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    amountOut: string;
    profit: string;
    profitMargin: number;
    gasUsed: string;
    gasPrice: string;
    exchanges: string[];
    executionTime: number;
    blockNumber?: number;
    timestamp: number;
}
interface OpportunityRecord {
    id: string;
    strategy: string;
    type: string;
    tokens: string[];
    exchanges: string[];
    expectedProfit: string;
    profitMargin: number;
    confidence: number;
    riskScore: number;
    discovered: number;
    executed?: number;
    result?: 'success' | 'failed' | 'expired';
}
interface StrategyStats {
    strategy: string;
    totalOpportunities: number;
    executedOpportunities: number;
    successfulExecutions: number;
    totalProfit: string;
    totalLoss: string;
    averageProfit: string;
    averageExecutionTime: number;
    successRate: number;
    profitability: number;
    lastUpdate: number;
}
interface PerformanceMetrics {
    timestamp: number;
    totalExecutions: number;
    successfulExecutions: number;
    totalProfit: string;
    totalGasUsed: string;
    averageLatency: number;
    activeStrategies: number;
    memoryUsage: number;
    cpuUsage: number;
    connectionCount: number;
}
interface DatabaseStats {
    redisInfo: any;
    cacheHitRate: number;
    totalOperations: number;
    totalErrors: number;
    memoryUsage: number;
    connectedClients: number;
    keyspaceHits: number;
    keyspaceMisses: number;
    evictedKeys: number;
    expiredKeys: number;
    operationsPerSecond: number;
    averageLatency: number;
    lastBackup: number;
}
export declare class DatabaseService {
    private logger;
    private config;
    private redis;
    private clusterRedis?;
    private isConnected;
    private operationQueue;
    private isProcessingQueue;
    private stats;
    private performanceCounters;
    private cacheKeyTemplates;
    constructor(config: DatabaseConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    cachePriceData(priceData: PriceData, ttl?: number): Promise<void>;
    getPriceData(exchange: string, tokenA: string, tokenB: string): Promise<PriceData | null>;
    storeTransaction(transaction: TransactionRecord): Promise<void>;
    getTransaction(strategy: string, txHash: string): Promise<TransactionRecord | null>;
    getRecentTransactions(strategy?: string, limit?: number, status?: 'pending' | 'confirmed' | 'failed'): Promise<TransactionRecord[]>;
    storeOpportunity(opportunity: OpportunityRecord): Promise<void>;
    getOpportunities(strategy: string, limit?: number, timeRange?: {
        start: number;
        end: number;
    }): Promise<OpportunityRecord[]>;
    updateStrategyStats(stats: StrategyStats): Promise<void>;
    getStrategyStats(strategy: string): Promise<StrategyStats | null>;
    getAllStrategyStats(): Promise<Record<string, StrategyStats>>;
    storePerformanceMetrics(metrics: PerformanceMetrics): Promise<void>;
    getPerformanceMetrics(timeRange: {
        start: number;
        end: number;
    }, limit?: number): Promise<PerformanceMetrics[]>;
    clearExpiredData(): Promise<void>;
    optimizeDatabase(): Promise<void>;
    createBackup(): Promise<string>;
    private initializeRedis;
    private setupCacheConfiguration;
    private startPerformanceMonitoring;
    private initializeBackupSystem;
    private getRedisClient;
    private waitForConnection;
    private buildCacheKey;
    private set;
    private setWithExpiration;
    private get;
    private delete;
    private addToList;
    private getListRange;
    private addToSortedSet;
    private getSortedSetRange;
    private getSortedSetRangeByScore;
    private trimSortedSet;
    private addToHash;
    private getHash;
    private executeScript;
    private serialize;
    private deserialize;
    private isExpired;
    private recordOperation;
    private recordCacheHit;
    private recordCacheMiss;
    private handleError;
    private updateStats;
    private parseRedisInfo;
    private resetPerformanceCounters;
    private processRemainingQueue;
    private createSnapshot;
    private compactDatabase;
    private getTransactionById;
    private uploadBackupToRemote;
    private cleanupOldBackups;
    getDatabaseStats(): DatabaseStats;
    getPerformanceCounters(): any;
    healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        isConnected: boolean;
        memoryUsage: number;
        cacheHitRate: number;
        operationsPerSecond: number;
        totalErrors: number;
        lastBackup: string;
    }>;
    recordExecution(result: any): Promise<void>;
    recordFailure(result: any): Promise<void>;
}
export {};
//# sourceMappingURL=DatabaseService.d.ts.map