import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { performance } from 'perf_hooks';

// ========================================
// 🎯 INTERFACES & TYPES
// ========================================

interface LoggerConfig {
  // Basic Settings
  level: string;                     // Log level (error, warn, info, debug, trace)
  enableConsole: boolean;            // Enable console output
  enableFile: boolean;               // Enable file logging
  enableRotation: boolean;           // Enable daily file rotation
  
  // File Settings
  logDirectory: string;              // Directory for log files
  maxFileSize: string;               // Maximum file size before rotation
  maxFiles: string;                  // Maximum number of files to keep
  datePattern: string;               // Date pattern for rotation
  
  // Format Settings
  timestampFormat: string;           // Timestamp format
  enableColors: boolean;             // Enable colored output
  enableJson: boolean;               // Use JSON format
  includeMetadata: boolean;          // Include metadata in logs
  
  // Performance Settings
  enablePerformanceLogging: boolean; // Track performance metrics
  enableMemoryLogging: boolean;      // Track memory usage
  enableAsyncLogging: boolean;       // Use async logging
  
  // Filter Settings
  enableSensitiveFilter: boolean;    // Filter sensitive data
  enableRateLimit: boolean;          // Rate limit similar messages
  rateLimitWindow: number;           // Rate limit time window (ms)
  rateLimitMax: number;              // Max messages per window
  
  // External Integration
  enableWebhook: boolean;            // Send logs to webhook
  webhookUrl?: string;               // Webhook URL for critical logs
  enableMetrics: boolean;            // Export metrics to monitoring
  metricsPort?: number;              // Metrics server port
}

interface LogMetadata {
  component?: string;                // Component name
  function?: string;                 // Function name
  transactionId?: string;            // Transaction identifier
  userId?: string;                   // User identifier
  sessionId?: string;                // Session identifier
  correlationId?: string;            // Correlation identifier
  duration?: number;                 // Operation duration
  memoryUsage?: number;              // Memory usage in MB
  gasUsed?: string;                  // Gas used for blockchain operations
  blockNumber?: number;              // Block number
  network?: string;                  // Network name
  dex?: string;                      // DEX name
  token?: string;                    // Token symbol
  amount?: string;                   // Amount involved
  price?: string;                    // Price information
  profit?: string;                   // Profit/loss amount
  strategy?: string;                 // Strategy name
  riskScore?: number;                // Risk score
  [key: string]: any;                // Additional metadata
}

interface PerformanceMetric {
  operation: string;                 // Operation name
  startTime: number;                 // Start timestamp
  endTime: number;                   // End timestamp
  duration: number;                  // Duration in milliseconds
  memoryBefore: number;              // Memory before operation
  memoryAfter: number;               // Memory after operation
  success: boolean;                  // Operation success status
  metadata?: LogMetadata;            // Additional metadata
}

interface LogAnalytics {
  totalLogs: number;                 // Total logs generated
  logsByLevel: Record<string, number>; // Logs by level count
  errorRate: number;                 // Error rate percentage
  avgResponseTime: number;           // Average response time
  topErrors: Array<{ message: string; count: number }>; // Most frequent errors
  performanceMetrics: PerformanceMetric[]; // Performance data
  memoryUsage: Array<{ timestamp: number; usage: number }>; // Memory tracking
  lastReset: number;                 // Last analytics reset
}

// ========================================
// 📝 ADVANCED LOGGER CLASS
// ========================================

export class Logger {
  private static instance: Logger;
  private winston!: winston.Logger;
  private config!: LoggerConfig;
  
  // Performance Tracking
  private performanceMetrics: Map<string, PerformanceMetric> = new Map();
  private analytics!: LogAnalytics;
  
  // Rate Limiting
  private rateLimitCache: Map<string, { count: number; firstSeen: number }> = new Map();
  
  // Sensitive Data Patterns
  private sensitivePatterns = [
    /private[_\s]*key/i,
    /secret[_\s]*key/i,
    /api[_\s]*key/i,
    /password/i,
    /token/i,
    /seed[_\s]*phrase/i,
    /mnemonic/i,
    /0x[a-fA-F0-9]{64}/g,  // Private keys
    /\b[A-Za-z0-9+/]{88}=?\b/g, // Base64 encoded secrets
  ];

  // Custom Log Levels
  private customLevels = {
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

  private constructor(config: LoggerConfig) {
    this.config = config;
    this.initializeAnalytics();
    this.initializeWinston();
    this.startPerformanceMonitoring();
    this.startAnalyticsCollection();
  }

  // ========================================
  // 🚀 INITIALIZATION & SETUP
  // ========================================

  public static getInstance(config?: LoggerConfig): Logger {
    if (!Logger.instance) {
      const defaultConfig: LoggerConfig = {
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

  private initializeAnalytics(): void {
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

  private initializeWinston(): void {
    // Ensure log directory exists
    if (this.config.enableFile && !fs.existsSync(this.config.logDirectory)) {
      try {
        fs.mkdirSync(this.config.logDirectory, { recursive: true });
      } catch (error) {
        console.warn(`⚠️ Logs klasörü oluşturulamadı: ${this.config.logDirectory}. Konsol-only modda çalışıyor.`);
        this.config.enableFile = false; // Dosya loglarını devre dışı bırak
      }
    }

    // Create winston logger
    this.winston = winston.createLogger({
      levels: this.customLevels.levels,
      level: this.config.level,
      format: this.createLogFormat(),
      transports: this.createTransports(),
      exitOnError: false
    });

    // Add colors
    winston.addColors(this.customLevels.colors);

    // Handle unhandled exceptions and rejections (only if file logging is enabled)
    if (this.config.enableFile) {
      try {
        this.winston.exceptions.handle(
          new winston.transports.File({ 
            filename: path.join(this.config.logDirectory, 'exceptions.log'),
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json()
            )
          })
        );

        this.winston.rejections.handle(
          new winston.transports.File({ 
            filename: path.join(this.config.logDirectory, 'rejections.log'),
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json()
            )
          })
        );
      } catch (error) {
        console.warn(`⚠️ Exception/rejection logları oluşturulamadı: ${error}`);
      }
    }
  }

  private createLogFormat(): winston.Logform.Format {
    const formats = [];

    // Add timestamp
    formats.push(winston.format.timestamp({
      format: this.config.timestampFormat
    }));

    // Add error stack traces
    formats.push(winston.format.errors({ stack: true }));

    // Filter sensitive data
    if (this.config.enableSensitiveFilter) {
      formats.push(winston.format.printf((info: any) => {
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
      formats.push(winston.format.json());
    } else {
      formats.push(this.createPrettyFormat());
    }

    return winston.format.combine(...formats);
  }

  private createMetadataFormat(): winston.Logform.Format {
    return winston.format.printf((info: any) => {
      // Add system metadata
      const metadata: LogMetadata = {
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

  private createPrettyFormat(): winston.Logform.Format {
    return winston.format.printf((info: any) => {
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

  private createTransports(): winston.transport[] {
    const transports: winston.transport[] = [];

    // Console transport
    if (this.config.enableConsole) {
      transports.push(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize({ all: this.config.enableColors }),
          this.createPrettyFormat()
        )
      }));
    }

    // File transports
    if (this.config.enableFile) {
      // Combined logs
      if (this.config.enableRotation) {
        transports.push(new winston.transports.File({
          filename: path.join(this.config.logDirectory, `application-${new Date().toISOString().split('T')[0]}.log`),
          maxsize: parseInt(this.config.maxFileSize.replace('m', '')) * 1024 * 1024
        }));
      } else {
        transports.push(new winston.transports.File({
          filename: path.join(this.config.logDirectory, 'application.log')
        }));
      }

      // Error logs
      if (this.config.enableRotation) {
        transports.push(new winston.transports.File({
          filename: path.join(this.config.logDirectory, `error-${new Date().toISOString().split('T')[0]}.log`),
          level: 'error',
          maxsize: parseInt(this.config.maxFileSize.replace('m', '')) * 1024 * 1024
        }));
      } else {
        transports.push(new winston.transports.File({
          filename: path.join(this.config.logDirectory, 'error.log'),
          level: 'error'
        }));
      }

      // Performance logs
      if (this.config.enablePerformanceLogging) {
        transports.push(new winston.transports.File({
          filename: path.join(this.config.logDirectory, `performance-${new Date().toISOString().split('T')[0]}.log`),
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

  public error(message: string, metadata?: LogMetadata): void {
    this.log('error', message, metadata);
    this.updateAnalytics('error');
    
    // Send webhook for critical errors
    if (this.config.enableWebhook && this.config.webhookUrl) {
      this.sendWebhook('error', message, metadata);
    }
  }

  public warn(message: string, metadata?: LogMetadata): void {
    this.log('warn', message, metadata);
    this.updateAnalytics('warn');
  }

  public info(message: string, metadata?: LogMetadata): void {
    this.log('info', message, metadata);
    this.updateAnalytics('info');
  }

  public debug(message: string, metadata?: LogMetadata): void {
    this.log('debug', message, metadata);
    this.updateAnalytics('debug');
  }

  public trace(message: string, metadata?: LogMetadata): void {
    this.log('trace', message, metadata);
    this.updateAnalytics('trace');
  }

  public performance(message: string, metadata?: LogMetadata): void {
    this.log('performance', message, metadata);
    this.updateAnalytics('performance');
  }

  private log(level: string, message: string, metadata?: LogMetadata): void {
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
    } else {
      this.winston.log(logEntry);
    }
  }

  // ========================================
  // ⚡ PERFORMANCE TRACKING
  // ========================================

  public startPerformanceTimer(operation: string, metadata?: LogMetadata): string {
    const timerId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const metric: PerformanceMetric = {
      operation,
      startTime: performance.now(),
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

  public endPerformanceTimer(timerId: string, success: boolean = true, additionalMetadata?: LogMetadata): void {
    const metric = this.performanceMetrics.get(timerId);
    if (!metric) {
      this.warn(`⚠️ Performance timer not found: ${timerId}`);
      return;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.success = success;
    
    if (this.config.enableMemoryLogging) {
      metric.memoryAfter = process.memoryUsage().heapUsed;
    }

    const logMetadata: LogMetadata = {
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
    } else {
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

  public logArbitrageOperation(
    operation: string,
    success: boolean,
    metadata: {
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
    }
  ): void {
    const level = success ? 'info' : 'error';
    const emoji = success ? '💰' : '💸';
    const status = success ? 'SUCCESS' : 'FAILED';
    
    const message = `${emoji} Arbitrage ${operation} ${status}`;
    
    const logMetadata: LogMetadata = {
      ...metadata,
      operation,
      success,
      component: 'ArbitrageEngine',
      category: 'ARBITRAGE_OPERATION'
    };

    this.log(level, message, logMetadata);
  }

  public logBlockchainOperation(
    operation: string,
    success: boolean,
    metadata: {
      network?: string;
      blockNumber?: number;
      transactionHash?: string;
      gasUsed?: string;
      gasPrice?: string;
      value?: string;
      contractAddress?: string;
      functionName?: string;
      duration?: number;
    }
  ): void {
    const level = success ? 'info' : 'error';
    const emoji = success ? '⛓️' : '🚫';
    const status = success ? 'SUCCESS' : 'FAILED';
    
    const message = `${emoji} Blockchain ${operation} ${status}`;
    
    const logMetadata: LogMetadata = {
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

  private filterSensitiveData(text: string): string {
    let filtered = text;
    
    for (const pattern of this.sensitivePatterns) {
      filtered = filtered.replace(pattern, '[REDACTED]');
    }
    
    return filtered;
  }

  private isRateLimited(message: string): boolean {
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

  private createRateLimitKey(message: string): string {
    // Create a key based on message pattern, not exact content
    return message.replace(/\d+/g, 'NUM').replace(/0x[a-fA-F0-9]+/g, 'HASH').toLowerCase();
  }

  // ========================================
  // 📊 ANALYTICS & MONITORING
  // ========================================

  private startPerformanceMonitoring(): void {
    if (!this.config.enablePerformanceLogging) return;

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

  private startAnalyticsCollection(): void {
    setInterval(() => {
      this.calculateAnalytics();
    }, 60000); // Every minute
  }

  private updateAnalytics(level: string): void {
    this.analytics.totalLogs++;
    this.analytics.logsByLevel[level] = (this.analytics.logsByLevel[level] || 0) + 1;
  }

  private calculateAnalytics(): void {
    // Calculate error rate
    const totalErrors = this.analytics.logsByLevel['error'] || 0;
    this.analytics.errorRate = this.analytics.totalLogs > 0 ? 
      (totalErrors / this.analytics.totalLogs) * 100 : 0;
    
    // Calculate average response time
    if (this.analytics.performanceMetrics.length > 0) {
      const totalDuration = this.analytics.performanceMetrics.reduce(
        (sum, metric) => sum + metric.duration, 0
      );
      this.analytics.avgResponseTime = totalDuration / this.analytics.performanceMetrics.length;
    }
    
    // Update top errors (simplified)
    this.analytics.topErrors = [];
  }

  // ========================================
  // 🔗 EXTERNAL INTEGRATIONS
  // ========================================

  private async sendWebhook(level: string, message: string, metadata?: LogMetadata): Promise<void> {
    if (!this.config.webhookUrl) return;

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

    } catch (error) {
      // Don't log webhook errors to avoid infinite loops
      console.error('Failed to send webhook:', error);
    }
  }

  // ========================================
  // 🛠️ UTILITY FUNCTIONS
  // ========================================

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public createChildLogger(component: string): ChildLogger {
    return new ChildLogger(this, component);
  }

  public setLogLevel(level: string): void {
    this.config.level = level;
    this.winston.level = level;
    this.info(`📊 Log level changed to: ${level}`, { component: 'Logger' });
  }

  public getLogLevel(): string {
    return this.config.level;
  }

  // ========================================
  // 📊 PUBLIC GETTERS
  // ========================================

  public getAnalytics(): LogAnalytics {
    return { ...this.analytics };
  }

  public getActiveTimers(): Array<{ timerId: string; operation: string; duration: number }> {
    const timers: Array<{ timerId: string; operation: string; duration: number }> = [];
    
    for (const [timerId, metric] of this.performanceMetrics.entries()) {
      timers.push({
        timerId,
        operation: metric.operation,
        duration: performance.now() - metric.startTime
      });
    }
    
    return timers;
  }

  public getSystemHealth(): {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    details: string;
    metrics: {
      totalLogs: number;
      errorRate: number;
      memoryUsage: number;
      activeTimers: number;
    };
  } {
    const memUsage = process.memoryUsage();
    const currentMemory = Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100;
    
    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    let details = 'Logger operating normally';
    
    // Check error rate
    if (this.analytics.errorRate > 10) {
      status = 'CRITICAL';
      details = 'High error rate detected';
    } else if (this.analytics.errorRate > 5) {
      status = 'WARNING';
      details = 'Elevated error rate';
    }
    
    // Check memory usage
    if (currentMemory > 1000) { // 1GB
      status = 'CRITICAL';
      details = 'High memory usage';
    } else if (currentMemory > 500) { // 500MB
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

  public async resetAnalytics(): Promise<void> {
    this.initializeAnalytics();
    this.info('🔄 Logger analytics reset', { component: 'Logger' });
  }

  public async updateConfig(newConfig: Partial<LoggerConfig>): Promise<void> {
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

  public async flushLogs(): Promise<void> {
    return new Promise((resolve) => {
      this.winston.end(() => {
        this.info('💾 Log buffers flushed', { component: 'Logger' });
        resolve();
      });
    });
  }

  public async exportLogs(
    startDate: Date, 
    endDate: Date, 
    level?: string
  ): Promise<string[]> {
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

// ========================================
// 👶 CHILD LOGGER CLASS
// ========================================

export class ChildLogger {
  private parent: Logger;
  private component: string;

  constructor(parent: Logger, component: string) {
    this.parent = parent;
    this.component = component;
  }

  public error(message: string, metadata?: LogMetadata): void {
    this.parent.error(message, { ...metadata, component: this.component });
  }

  public warn(message: string, metadata?: LogMetadata): void {
    this.parent.warn(message, { ...metadata, component: this.component });
  }

  public info(message: string, metadata?: LogMetadata): void {
    this.parent.info(message, { ...metadata, component: this.component });
  }

  public debug(message: string, metadata?: LogMetadata): void {
    this.parent.debug(message, { ...metadata, component: this.component });
  }

  public trace(message: string, metadata?: LogMetadata): void {
    this.parent.trace(message, { ...metadata, component: this.component });
  }

  public performance(message: string, metadata?: LogMetadata): void {
    this.parent.performance(message, { ...metadata, component: this.component });
  }

  public startTimer(operation: string, metadata?: LogMetadata): string {
    return this.parent.startPerformanceTimer(operation, { 
      ...metadata, 
      component: this.component 
    });
  }

  public endTimer(timerId: string, success: boolean = true, metadata?: LogMetadata): void {
    this.parent.endPerformanceTimer(timerId, success, metadata);
  }

  public logArbitrage(operation: string, success: boolean, metadata: any): void {
    this.parent.logArbitrageOperation(operation, success, {
      ...metadata,
      component: this.component
    });
  }

  public logBlockchain(operation: string, success: boolean, metadata: any): void {
    this.parent.logBlockchainOperation(operation, success, {
      ...metadata,
      component: this.component
    });
  }
}

// ========================================
// 📋 EXPORT
// ========================================

export { LoggerConfig, LogMetadata, PerformanceMetric, LogAnalytics };
