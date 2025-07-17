"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChildLogger = exports.Logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const perf_hooks_1 = require("perf_hooks");
// ========================================
// 📝 ADVANCED LOGGER CLASS
// ========================================
class Logger {
    static instance;
    winston;
    config;
    // Performance Tracking
    performanceMetrics = new Map();
    analytics;
    // Rate Limiting
    rateLimitCache = new Map();
    // Sensitive Data Patterns
    sensitivePatterns = [
        /private[_\s]*key/i,
        /secret[_\s]*key/i,
        /api[_\s]*key/i,
        /password/i,
        /token/i,
        /seed[_\s]*phrase/i,
        /mnemonic/i,
        /0x[a-fA-F0-9]{64}/g, // Private keys
        /\b[A-Za-z0-9+/]{88}=?\b/g, // Base64 encoded secrets
    ];
    // Custom Log Levels
    customLevels = {
        levels: {
            error: 0,
            warn: 1,
            info: 2,
            http: 3,
            verbose: 4,
            debug: 5,
            trace: 6,
            performance: 7
        },
        colors: {
            error: 'red',
            warn: 'yellow',
            info: 'green',
            http: 'magenta',
            verbose: 'cyan',
            debug: 'blue',
            trace: 'gray',
            performance: 'rainbow'
        }
    };
    constructor(config) {
        this.config = config;
        this.initializeAnalytics();
        this.initializeWinston();
        this.startPerformanceMonitoring();
        this.startAnalyticsCollection();
    }
    // ========================================
    // 🚀 INITIALIZATION & SETUP
    // ========================================
    static getInstance(config) {
        if (!Logger.instance) {
            const defaultConfig = {
                level: 'info',
                enableConsole: true,
                enableFile: true,
                enableRotation: true,
                logDirectory: './logs',
                maxFileSize: '20m',
                maxFiles: '14d',
                datePattern: 'YYYY-MM-DD',
                timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
                enableColors: true,
                enableJson: false,
                includeMetadata: true,
                enablePerformanceLogging: true,
                enableMemoryLogging: true,
                enableAsyncLogging: true,
                enableSensitiveFilter: true,
                enableRateLimit: true,
                rateLimitWindow: 60000, // 1 minute
                rateLimitMax: 100,
                enableWebhook: false,
                enableMetrics: true,
                metricsPort: 9090
            };
            Logger.instance = new Logger({ ...defaultConfig, ...config });
        }
        return Logger.instance;
    }
    initializeAnalytics() {
        this.analytics = {
            totalLogs: 0,
            logsByLevel: {},
            errorRate: 0,
            avgResponseTime: 0,
            topErrors: [],
            performanceMetrics: [],
            memoryUsage: [],
            lastReset: Date.now()
        };
    }
    initializeWinston() {
        // Ensure log directory exists
        if (this.config.enableFile && !fs_1.default.existsSync(this.config.logDirectory)) {
            try {
                fs_1.default.mkdirSync(this.config.logDirectory, { recursive: true });
            }
            catch (error) {
                console.warn(`⚠️ Logs klasörü oluşturulamadı: ${this.config.logDirectory}. Konsol-only modda çalışıyor.`);
                this.config.enableFile = false; // Dosya loglarını devre dışı bırak
            }
        }
        // Create winston logger
        this.winston = winston_1.default.createLogger({
            levels: this.customLevels.levels,
            level: this.config.level,
            format: this.createLogFormat(),
            transports: this.createTransports(),
            exitOnError: false
        });
        // Add colors
        winston_1.default.addColors(this.customLevels.colors);
        // Handle unhandled exceptions and rejections (only if file logging is enabled)
        if (this.config.enableFile) {
            try {
                this.winston.exceptions.handle(new winston_1.default.transports.File({
                    filename: path_1.default.join(this.config.logDirectory, 'exceptions.log'),
                    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json())
                }));
                this.winston.rejections.handle(new winston_1.default.transports.File({
                    filename: path_1.default.join(this.config.logDirectory, 'rejections.log'),
                    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json())
                }));
            }
            catch (error) {
                console.warn(`⚠️ Exception/rejection logları oluşturulamadı: ${error}`);
            }
        }
    }
    createLogFormat() {
        const formats = [];
        // Add timestamp
        formats.push(winston_1.default.format.timestamp({
            format: this.config.timestampFormat
        }));
        // Add error stack traces
        formats.push(winston_1.default.format.errors({ stack: true }));
        // Filter sensitive data
        if (this.config.enableSensitiveFilter) {
            formats.push(winston_1.default.format.printf((info) => {
                const filtered = this.filterSensitiveData(JSON.stringify(info));
                return JSON.parse(filtered);
            }));
        }
        // Add metadata formatting
        if (this.config.includeMetadata) {
            formats.push(this.createMetadataFormat());
        }
        // Choose output format
        if (this.config.enableJson) {
            formats.push(winston_1.default.format.json());
        }
        else {
            formats.push(this.createPrettyFormat());
        }
        return winston_1.default.format.combine(...formats);
    }
    createMetadataFormat() {
        return winston_1.default.format.printf((info) => {
            // Add system metadata
            const metadata = {
                ...(info.metadata || {}),
                processId: process.pid,
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            };
            // Add memory usage if enabled
            if (this.config.enableMemoryLogging) {
                const memUsage = process.memoryUsage();
                metadata.memoryUsage = Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100;
                metadata.memoryTotal = Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100;
            }
            return JSON.stringify({
                ...info,
                metadata
            });
        });
    }
    createPrettyFormat() {
        return winston_1.default.format.printf((info) => {
            const { timestamp, level, message, metadata = {}, ...rest } = info;
            let output = `${timestamp} [${level.toUpperCase()}]`;
            if (metadata?.component) {
                output += ` [${metadata.component}]`;
            }
            if (metadata?.function) {
                output += ` [${metadata.function}]`;
            }
            output += `: ${message}`;
            // Add metadata if present
            if (Object.keys(rest).length > 0 || (metadata && Object.keys(metadata).length > 0)) {
                const allMeta = { ...rest, ...metadata };
                output += ` ${JSON.stringify(allMeta, null, 2)}`;
            }
            return output;
        });
    }
    createTransports() {
        const transports = [];
        // Console transport
        if (this.config.enableConsole) {
            transports.push(new winston_1.default.transports.Console({
                format: winston_1.default.format.combine(winston_1.default.format.colorize({ all: this.config.enableColors }), this.createPrettyFormat())
            }));
        }
        // File transports
        if (this.config.enableFile) {
            // Combined logs
            if (this.config.enableRotation) {
                transports.push(new winston_1.default.transports.File({
                    filename: path_1.default.join(this.config.logDirectory, `application-${new Date().toISOString().split('T')[0]}.log`),
                    maxsize: parseInt(this.config.maxFileSize.replace('m', '')) * 1024 * 1024
                }));
            }
            else {
                transports.push(new winston_1.default.transports.File({
                    filename: path_1.default.join(this.config.logDirectory, 'application.log')
                }));
            }
            // Error logs
            if (this.config.enableRotation) {
                transports.push(new winston_1.default.transports.File({
                    filename: path_1.default.join(this.config.logDirectory, `error-${new Date().toISOString().split('T')[0]}.log`),
                    level: 'error',
                    maxsize: parseInt(this.config.maxFileSize.replace('m', '')) * 1024 * 1024
                }));
            }
            else {
                transports.push(new winston_1.default.transports.File({
                    filename: path_1.default.join(this.config.logDirectory, 'error.log'),
                    level: 'error'
                }));
            }
            // Performance logs
            if (this.config.enablePerformanceLogging) {
                transports.push(new winston_1.default.transports.File({
                    filename: path_1.default.join(this.config.logDirectory, `performance-${new Date().toISOString().split('T')[0]}.log`),
                    level: 'info',
                    maxsize: parseInt(this.config.maxFileSize.replace('m', '')) * 1024 * 1024
                }));
            }
        }
        return transports;
    }
    // ========================================
    // 📝 CORE LOGGING METHODS
    // ========================================
    error(message, metadata) {
        this.log('error', message, metadata);
        this.updateAnalytics('error');
        // Send webhook for critical errors
        if (this.config.enableWebhook && this.config.webhookUrl) {
            this.sendWebhook('error', message, metadata);
        }
    }
    warn(message, metadata) {
        this.log('warn', message, metadata);
        this.updateAnalytics('warn');
    }
    info(message, metadata) {
        this.log('info', message, metadata);
        this.updateAnalytics('info');
    }
    debug(message, metadata) {
        this.log('debug', message, metadata);
        this.updateAnalytics('debug');
    }
    trace(message, metadata) {
        this.log('trace', message, metadata);
        this.updateAnalytics('trace');
    }
    performance(message, metadata) {
        this.log('performance', message, metadata);
        this.updateAnalytics('performance');
    }
    log(level, message, metadata) {
        // Check rate limiting
        if (this.config.enableRateLimit && this.isRateLimited(message)) {
            return;
        }
        // Create log entry
        const logEntry = {
            level,
            message: this.config.enableSensitiveFilter ? this.filterSensitiveData(message) : message,
            metadata: {
                ...metadata,
                timestamp: Date.now(),
                correlationId: metadata?.correlationId || this.generateCorrelationId()
            }
        };
        // Log with winston
        if (this.config.enableAsyncLogging) {
            setImmediate(() => this.winston.log(logEntry));
        }
        else {
            this.winston.log(logEntry);
        }
    }
    // ========================================
    // ⚡ PERFORMANCE TRACKING
    // ========================================
    startPerformanceTimer(operation, metadata) {
        const timerId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const metric = {
            operation,
            startTime: perf_hooks_1.performance.now(),
            endTime: 0,
            duration: 0,
            memoryBefore: this.config.enableMemoryLogging ? process.memoryUsage().heapUsed : 0,
            memoryAfter: 0,
            success: false,
            metadata
        };
        this.performanceMetrics.set(timerId, metric);
        this.trace(`⏱️ Performance timer started: ${operation}`, {
            ...metadata,
            timerId,
            operation
        });
        return timerId;
    }
    endPerformanceTimer(timerId, success = true, additionalMetadata) {
        const metric = this.performanceMetrics.get(timerId);
        if (!metric) {
            this.warn(`⚠️ Performance timer not found: ${timerId}`);
            return;
        }
        metric.endTime = perf_hooks_1.performance.now();
        metric.duration = metric.endTime - metric.startTime;
        metric.success = success;
        if (this.config.enableMemoryLogging) {
            metric.memoryAfter = process.memoryUsage().heapUsed;
        }
        const logMetadata = {
            ...metric.metadata,
            ...additionalMetadata,
            timerId,
            operation: metric.operation,
            duration: Math.round(metric.duration * 100) / 100,
            success
        };
        if (this.config.enableMemoryLogging) {
            logMetadata.memoryUsed = Math.round((metric.memoryAfter - metric.memoryBefore) / 1024 / 1024 * 100) / 100;
        }
        // Log performance result
        if (success) {
            this.performance(`✅ ${metric.operation} completed in ${Math.round(metric.duration)}ms`, logMetadata);
        }
        else {
            this.performance(`❌ ${metric.operation} failed after ${Math.round(metric.duration)}ms`, logMetadata);
        }
        // Add to analytics
        this.analytics.performanceMetrics.push(metric);
        // Keep only recent metrics (last 1000)
        if (this.analytics.performanceMetrics.length > 1000) {
            this.analytics.performanceMetrics = this.analytics.performanceMetrics.slice(-1000);
        }
        // Remove from active metrics
        this.performanceMetrics.delete(timerId);
    }
    logArbitrageOperation(operation, success, metadata) {
        const level = success ? 'info' : 'error';
        const emoji = success ? '💰' : '💸';
        const status = success ? 'SUCCESS' : 'FAILED';
        const message = `${emoji} Arbitrage ${operation} ${status}`;
        const logMetadata = {
            ...metadata,
            operation,
            success,
            component: 'ArbitrageEngine',
            category: 'ARBITRAGE_OPERATION'
        };
        this.log(level, message, logMetadata);
    }
    logBlockchainOperation(operation, success, metadata) {
        const level = success ? 'info' : 'error';
        const emoji = success ? '⛓️' : '🚫';
        const status = success ? 'SUCCESS' : 'FAILED';
        const message = `${emoji} Blockchain ${operation} ${status}`;
        const logMetadata = {
            ...metadata,
            operation,
            success,
            component: 'BlockchainService',
            category: 'BLOCKCHAIN_OPERATION'
        };
        this.log(level, message, logMetadata);
    }
    // ========================================
    // 🔒 SECURITY & FILTERING
    // ========================================
    filterSensitiveData(text) {
        let filtered = text;
        for (const pattern of this.sensitivePatterns) {
            filtered = filtered.replace(pattern, '[REDACTED]');
        }
        return filtered;
    }
    isRateLimited(message) {
        const key = this.createRateLimitKey(message);
        const now = Date.now();
        const windowStart = now - this.config.rateLimitWindow;
        // Clean old entries
        for (const [k, v] of this.rateLimitCache.entries()) {
            if (v.firstSeen < windowStart) {
                this.rateLimitCache.delete(k);
            }
        }
        // Check current entry
        const existing = this.rateLimitCache.get(key);
        if (!existing) {
            this.rateLimitCache.set(key, { count: 1, firstSeen: now });
            return false;
        }
        if (existing.firstSeen < windowStart) {
            this.rateLimitCache.set(key, { count: 1, firstSeen: now });
            return false;
        }
        existing.count++;
        if (existing.count > this.config.rateLimitMax) {
            // Log rate limit warning once per window
            if (existing.count === this.config.rateLimitMax + 1) {
                this.winston.warn('⚠️ Rate limit exceeded for message pattern', {
                    pattern: key,
                    count: existing.count,
                    window: this.config.rateLimitWindow
                });
            }
            return true;
        }
        return false;
    }
    createRateLimitKey(message) {
        // Create a key based on message pattern, not exact content
        return message.replace(/\d+/g, 'NUM').replace(/0x[a-fA-F0-9]+/g, 'HASH').toLowerCase();
    }
    // ========================================
    // 📊 ANALYTICS & MONITORING
    // ========================================
    startPerformanceMonitoring() {
        if (!this.config.enablePerformanceLogging)
            return;
        setInterval(() => {
            const memUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            this.analytics.memoryUsage.push({
                timestamp: Date.now(),
                usage: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100
            });
            // Keep only last 1000 entries
            if (this.analytics.memoryUsage.length > 1000) {
                this.analytics.memoryUsage = this.analytics.memoryUsage.slice(-1000);
            }
            this.trace('📊 System performance metrics', {
                component: 'Logger',
                memoryHeapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
                memoryHeapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
                memoryExternal: Math.round(memUsage.external / 1024 / 1024 * 100) / 100,
                cpuUser: cpuUsage.user,
                cpuSystem: cpuUsage.system
            });
        }, 30000); // Every 30 seconds
    }
    startAnalyticsCollection() {
        setInterval(() => {
            this.calculateAnalytics();
        }, 60000); // Every minute
    }
    updateAnalytics(level) {
        this.analytics.totalLogs++;
        this.analytics.logsByLevel[level] = (this.analytics.logsByLevel[level] || 0) + 1;
    }
    calculateAnalytics() {
        // Calculate error rate
        const totalErrors = this.analytics.logsByLevel['error'] || 0;
        this.analytics.errorRate = this.analytics.totalLogs > 0 ?
            (totalErrors / this.analytics.totalLogs) * 100 : 0;
        // Calculate average response time
        if (this.analytics.performanceMetrics.length > 0) {
            const totalDuration = this.analytics.performanceMetrics.reduce((sum, metric) => sum + metric.duration, 0);
            this.analytics.avgResponseTime = totalDuration / this.analytics.performanceMetrics.length;
        }
        // Update top errors (simplified)
        this.analytics.topErrors = [];
    }
    // ========================================
    // 🔗 EXTERNAL INTEGRATIONS
    // ========================================
    async sendWebhook(level, message, metadata) {
        if (!this.config.webhookUrl)
            return;
        try {
            const payload = {
                timestamp: new Date().toISOString(),
                level,
                message,
                metadata,
                service: 'FlashLoanArbitrage',
                environment: process.env.NODE_ENV || 'development'
            };
            // Note: In a real implementation, you'd use fetch or axios
            // fetch(this.config.webhookUrl, {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(payload)
            // });
        }
        catch (error) {
            // Don't log webhook errors to avoid infinite loops
            console.error('Failed to send webhook:', error);
        }
    }
    // ========================================
    // 🛠️ UTILITY FUNCTIONS
    // ========================================
    generateCorrelationId() {
        return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    createChildLogger(component) {
        return new ChildLogger(this, component);
    }
    setLogLevel(level) {
        this.config.level = level;
        this.winston.level = level;
        this.info(`📊 Log level changed to: ${level}`, { component: 'Logger' });
    }
    getLogLevel() {
        return this.config.level;
    }
    // ========================================
    // 📊 PUBLIC GETTERS
    // ========================================
    getAnalytics() {
        return { ...this.analytics };
    }
    getActiveTimers() {
        const timers = [];
        for (const [timerId, metric] of this.performanceMetrics.entries()) {
            timers.push({
                timerId,
                operation: metric.operation,
                duration: perf_hooks_1.performance.now() - metric.startTime
            });
        }
        return timers;
    }
    getSystemHealth() {
        const memUsage = process.memoryUsage();
        const currentMemory = Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100;
        let status = 'HEALTHY';
        let details = 'Logger operating normally';
        // Check error rate
        if (this.analytics.errorRate > 10) {
            status = 'CRITICAL';
            details = 'High error rate detected';
        }
        else if (this.analytics.errorRate > 5) {
            status = 'WARNING';
            details = 'Elevated error rate';
        }
        // Check memory usage
        if (currentMemory > 1000) { // 1GB
            status = 'CRITICAL';
            details = 'High memory usage';
        }
        else if (currentMemory > 500) { // 500MB
            if (status === 'HEALTHY') {
                status = 'WARNING';
                details = 'Elevated memory usage';
            }
        }
        return {
            status,
            details,
            metrics: {
                totalLogs: this.analytics.totalLogs,
                errorRate: Math.round(this.analytics.errorRate * 100) / 100,
                memoryUsage: currentMemory,
                activeTimers: this.performanceMetrics.size
            }
        };
    }
    // ========================================
    // 🛠️ ADMIN FUNCTIONS
    // ========================================
    async resetAnalytics() {
        this.initializeAnalytics();
        this.info('🔄 Logger analytics reset', { component: 'Logger' });
    }
    async updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        // Reinitialize winston with new config
        this.winston.clear();
        const transports = this.createTransports();
        transports.forEach(transport => this.winston.add(transport));
        this.winston.level = this.config.level;
        this.info('⚙️ Logger configuration updated', {
            component: 'Logger',
            newConfig: Object.keys(newConfig)
        });
    }
    async flushLogs() {
        return new Promise((resolve) => {
            this.winston.end(() => {
                this.info('💾 Log buffers flushed', { component: 'Logger' });
                resolve();
            });
        });
    }
    async exportLogs(startDate, endDate, level) {
        // This would implement log export functionality
        // For now, return empty array
        this.info('📤 Log export requested', {
            component: 'Logger',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            level
        });
        return [];
    }
}
exports.Logger = Logger;
// ========================================
// 👶 CHILD LOGGER CLASS
// ========================================
class ChildLogger {
    parent;
    component;
    constructor(parent, component) {
        this.parent = parent;
        this.component = component;
    }
    error(message, metadata) {
        this.parent.error(message, { ...metadata, component: this.component });
    }
    warn(message, metadata) {
        this.parent.warn(message, { ...metadata, component: this.component });
    }
    info(message, metadata) {
        this.parent.info(message, { ...metadata, component: this.component });
    }
    debug(message, metadata) {
        this.parent.debug(message, { ...metadata, component: this.component });
    }
    trace(message, metadata) {
        this.parent.trace(message, { ...metadata, component: this.component });
    }
    performance(message, metadata) {
        this.parent.performance(message, { ...metadata, component: this.component });
    }
    startTimer(operation, metadata) {
        return this.parent.startPerformanceTimer(operation, {
            ...metadata,
            component: this.component
        });
    }
    endTimer(timerId, success = true, metadata) {
        this.parent.endPerformanceTimer(timerId, success, metadata);
    }
    logArbitrage(operation, success, metadata) {
        this.parent.logArbitrageOperation(operation, success, {
            ...metadata,
            component: this.component
        });
    }
    logBlockchain(operation, success, metadata) {
        this.parent.logBlockchainOperation(operation, success, {
            ...metadata,
            component: this.component
        });
    }
}
exports.ChildLogger = ChildLogger;
//# sourceMappingURL=Logger.js.map