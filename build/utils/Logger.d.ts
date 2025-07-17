interface LoggerConfig {
    level: string;
    enableConsole: boolean;
    enableFile: boolean;
    enableRotation: boolean;
    logDirectory: string;
    maxFileSize: string;
    maxFiles: string;
    datePattern: string;
    timestampFormat: string;
    enableColors: boolean;
    enableJson: boolean;
    includeMetadata: boolean;
    enablePerformanceLogging: boolean;
    enableMemoryLogging: boolean;
    enableAsyncLogging: boolean;
    enableSensitiveFilter: boolean;
    enableRateLimit: boolean;
    rateLimitWindow: number;
    rateLimitMax: number;
    enableWebhook: boolean;
    webhookUrl?: string;
    enableMetrics: boolean;
    metricsPort?: number;
}
interface LogMetadata {
    component?: string;
    function?: string;
    transactionId?: string;
    userId?: string;
    sessionId?: string;
    correlationId?: string;
    duration?: number;
    memoryUsage?: number;
    gasUsed?: string;
    blockNumber?: number;
    network?: string;
    dex?: string;
    token?: string;
    amount?: string;
    price?: string;
    profit?: string;
    strategy?: string;
    riskScore?: number;
    [key: string]: any;
}
interface PerformanceMetric {
    operation: string;
    startTime: number;
    endTime: number;
    duration: number;
    memoryBefore: number;
    memoryAfter: number;
    success: boolean;
    metadata?: LogMetadata;
}
interface LogAnalytics {
    totalLogs: number;
    logsByLevel: Record<string, number>;
    errorRate: number;
    avgResponseTime: number;
    topErrors: Array<{
        message: string;
        count: number;
    }>;
    performanceMetrics: PerformanceMetric[];
    memoryUsage: Array<{
        timestamp: number;
        usage: number;
    }>;
    lastReset: number;
}
export declare class Logger {
    private static instance;
    private winston;
    private config;
    private performanceMetrics;
    private analytics;
    private rateLimitCache;
    private sensitivePatterns;
    private customLevels;
    private constructor();
    static getInstance(config?: LoggerConfig): Logger;
    private initializeAnalytics;
    private initializeWinston;
    private createLogFormat;
    private createMetadataFormat;
    private createPrettyFormat;
    private createTransports;
    error(message: string, metadata?: LogMetadata): void;
    warn(message: string, metadata?: LogMetadata): void;
    info(message: string, metadata?: LogMetadata): void;
    debug(message: string, metadata?: LogMetadata): void;
    trace(message: string, metadata?: LogMetadata): void;
    performance(message: string, metadata?: LogMetadata): void;
    private log;
    startPerformanceTimer(operation: string, metadata?: LogMetadata): string;
    endPerformanceTimer(timerId: string, success?: boolean, additionalMetadata?: LogMetadata): void;
    logArbitrageOperation(operation: string, success: boolean, metadata: {
        strategy?: string;
        token?: string;
        amount?: string;
        profit?: string;
        gasUsed?: string;
        dex?: string;
        blockNumber?: number;
        transactionHash?: string;
        riskScore?: number;
        slippage?: number;
        duration?: number;
    }): void;
    logBlockchainOperation(operation: string, success: boolean, metadata: {
        network?: string;
        blockNumber?: number;
        transactionHash?: string;
        gasUsed?: string;
        gasPrice?: string;
        value?: string;
        contractAddress?: string;
        functionName?: string;
        duration?: number;
    }): void;
    private filterSensitiveData;
    private isRateLimited;
    private createRateLimitKey;
    private startPerformanceMonitoring;
    private startAnalyticsCollection;
    private updateAnalytics;
    private calculateAnalytics;
    private sendWebhook;
    private generateCorrelationId;
    createChildLogger(component: string): ChildLogger;
    setLogLevel(level: string): void;
    getLogLevel(): string;
    getAnalytics(): LogAnalytics;
    getActiveTimers(): Array<{
        timerId: string;
        operation: string;
        duration: number;
    }>;
    getSystemHealth(): {
        status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
        details: string;
        metrics: {
            totalLogs: number;
            errorRate: number;
            memoryUsage: number;
            activeTimers: number;
        };
    };
    resetAnalytics(): Promise<void>;
    updateConfig(newConfig: Partial<LoggerConfig>): Promise<void>;
    flushLogs(): Promise<void>;
    exportLogs(startDate: Date, endDate: Date, level?: string): Promise<string[]>;
}
export declare class ChildLogger {
    private parent;
    private component;
    constructor(parent: Logger, component: string);
    error(message: string, metadata?: LogMetadata): void;
    warn(message: string, metadata?: LogMetadata): void;
    info(message: string, metadata?: LogMetadata): void;
    debug(message: string, metadata?: LogMetadata): void;
    trace(message: string, metadata?: LogMetadata): void;
    performance(message: string, metadata?: LogMetadata): void;
    startTimer(operation: string, metadata?: LogMetadata): string;
    endTimer(timerId: string, success?: boolean, metadata?: LogMetadata): void;
    logArbitrage(operation: string, success: boolean, metadata: any): void;
    logBlockchain(operation: string, success: boolean, metadata: any): void;
}
export { LoggerConfig, LogMetadata, PerformanceMetric, LogAnalytics };
//# sourceMappingURL=Logger.d.ts.map