/**
 * @title ErrorHandler
 * @author Arbitrage Bot System
 * @notice Advanced error handling and recovery system - Stub Implementation
 * @dev Comprehensive error classification, recovery strategies, and monitoring
 */
interface ErrorConfig {
    enableAutoClassification: boolean;
    enableContextCapture: boolean;
    enableStackTrace: boolean;
    enableAutoRecovery: boolean;
    maxRetryAttempts: number;
    retryDelayMs: number;
    exponentialBackoff: boolean;
    enableNotifications: boolean;
    criticalErrorWebhook: string;
    notificationThreshold: ErrorSeverity;
    enableErrorStorage: boolean;
    maxStoredErrors: number;
    errorRetentionDays: number;
    enableMetrics: boolean;
    metricsWindowMs: number;
    alertThresholds: {
        errorRate: number;
        criticalErrorCount: number;
        memoryLeakThreshold: number;
    };
}
declare enum ErrorSeverity {
    TRACE = 0,
    DEBUG = 1,
    INFO = 2,
    WARNING = 3,
    ERROR = 4,
    CRITICAL = 5,
    FATAL = 6
}
declare enum ErrorCategory {
    NETWORK = "network",
    BLOCKCHAIN = "blockchain",
    DEX = "dex",
    VALIDATION = "validation",
    CALCULATION = "calculation",
    SYSTEM = "system",
    EXTERNAL_API = "external_api",
    DATABASE = "database",
    ARBITRAGE = "arbitrage",
    UNKNOWN = "unknown"
}
interface ErrorContext {
    timestamp: number;
    errorId: string;
    severity: ErrorSeverity;
    category: ErrorCategory;
    message: string;
    stack?: string;
    component: string;
    function: string;
    metadata: Record<string, any>;
    userContext?: {
        userId?: string;
        sessionId?: string;
        operation?: string;
    };
    systemContext: {
        memoryUsage: NodeJS.MemoryUsage;
        cpuUsage: NodeJS.CpuUsage;
        platform: string;
        nodeVersion: string;
    };
}
interface ErrorRecoveryStrategy {
    strategyId: string;
    name: string;
    description: string;
    applicableCategories: ErrorCategory[];
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
    conditions: (error: ErrorContext) => boolean;
    execute: (error: ErrorContext, attempt: number) => Promise<boolean>;
}
interface ErrorMetrics {
    totalErrors: number;
    errorsByCategory: Map<ErrorCategory, number>;
    errorsBySeverity: Map<ErrorSeverity, number>;
    errorRate: number;
    averageResolutionTime: number;
    recoverySuccessRate: number;
    recentErrors: ErrorContext[];
    lastUpdateTime: number;
}
interface RetryResult {
    success: boolean;
    attempts: number;
    totalTime: number;
    lastError?: ErrorContext;
    recoveryStrategy?: string;
}
/**
 * @class ErrorHandler
 * @notice Advanced error handling system - Stub Implementation
 * @dev Comprehensive error classification, recovery, and monitoring
 */
export declare class ErrorHandler {
    private static instance;
    private config;
    private logger;
    private recoveryStrategies;
    private errorHistory;
    private metrics;
    private metricsInterval?;
    /**
     * @notice ErrorHandler constructor - Stub Implementation
     * @param config Error handler configuration
     */
    private constructor();
    /**
     * @notice Get ErrorHandler singleton instance - Stub Implementation
     * @param config Configuration (only used for first initialization)
     * @return ErrorHandler instance
     */
    static getInstance(config?: ErrorConfig): ErrorHandler;
    /**
     * @notice Handle error with full context capture - Stub Implementation
     * @param error Error object or string
     * @param component Component where error occurred
     * @param functionName Function where error occurred
     * @param metadata Additional metadata
     * @return Error context
     */
    handleError(error: Error | string, component: string, functionName: string, metadata?: Record<string, any>): Promise<ErrorContext>;
    /**
     * @notice Retry operation with exponential backoff - Stub Implementation
     * @param operation Operation to retry
     * @param maxAttempts Maximum retry attempts
     * @param baseDelay Base delay between retries
     * @param errorContext Error context for logging
     * @return Retry result
     */
    retryWithBackoff<T>(operation: () => Promise<T>, maxAttempts?: number, baseDelay?: number, errorContext?: Partial<ErrorContext>): Promise<T>;
    /**
     * @notice Classify error automatically - Stub Implementation
     * @param error Error to classify
     * @return Error category
     */
    classifyError(error: Error | string): ErrorCategory;
    /**
     * @notice Determine error severity - Stub Implementation
     * @param error Error to analyze
     * @param category Error category
     * @return Error severity
     */
    determineSeverity(error: Error | string, category: ErrorCategory): ErrorSeverity;
    /**
     * @notice Get error metrics - Stub Implementation
     * @return Current error metrics
     */
    getMetrics(): ErrorMetrics;
    /**
     * @notice Get recent errors - Stub Implementation
     * @param limit Maximum number of errors to return
     * @param category Filter by category
     * @param severity Filter by minimum severity
     * @return Recent errors
     */
    getRecentErrors(limit?: number, category?: ErrorCategory, severity?: ErrorSeverity): ErrorContext[];
    /**
     * @notice Register custom recovery strategy - Stub Implementation
     * @param strategy Recovery strategy
     */
    registerRecoveryStrategy(strategy: ErrorRecoveryStrategy): void;
    /**
     * @notice Clear error history - Stub Implementation
     * @param olderThanDays Clear errors older than specified days
     */
    clearErrorHistory(olderThanDays?: number): void;
    /**
     * @notice Create error context - Stub Implementation
     */
    private createErrorContext;
    /**
     * @notice Generate unique error ID - Stub Implementation
     */
    private generateErrorId;
    /**
     * @notice Store error context - Stub Implementation
     */
    private storeError;
    /**
     * @notice Update error metrics - Stub Implementation
     */
    private updateMetrics;
    /**
     * @notice Attempt error recovery - Stub Implementation
     */
    private attemptRecovery;
    /**
     * @notice Check if error should trigger notification - Stub Implementation
     */
    private shouldNotify;
    /**
     * @notice Send error notification - Stub Implementation
     */
    private sendNotification;
    /**
     * @notice Initialize default recovery strategies - Stub Implementation
     */
    private initializeDefaultStrategies;
    /**
     * @notice Start metrics collection - Stub Implementation
     */
    private startMetricsCollection;
    /**
     * @notice Calculate error rate - Stub Implementation
     */
    private calculateErrorRate;
    /**
     * @notice Sleep utility - Stub Implementation
     */
    private sleep;
    /**
     * @notice Cleanup resources - Stub Implementation
     */
    destroy(): void;
}
export { ErrorConfig, ErrorSeverity, ErrorCategory, ErrorContext, ErrorRecoveryStrategy, ErrorMetrics, RetryResult };
//# sourceMappingURL=ErrorHandler.d.ts.map