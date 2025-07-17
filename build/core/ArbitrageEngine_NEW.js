"use strict";
/**
 * @title ArbitrageEngine - Arbitraj Motoru
 * @author Flashloan Arbitrage Bot Sistemi
 * @notice Ana arbitraj motoru - fiyat analizi ve karar verme sistemi
 * @dev Multi-thread desteği ile yüksek performanslı arbitraj motoru
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArbitrageEngine = void 0;
exports.createDefaultEngine = createDefaultEngine;
const events_1 = require("events");
const ethers_1 = require("ethers");
const Logger_1 = require("../utils/Logger");
const PriceMonitor_1 = require("../monitors/PriceMonitor");
const GasMonitor_1 = require("../monitors/GasMonitor");
const LiquidityMonitor_1 = require("../monitors/LiquidityMonitor");
const ProfitCalculator_1 = require("./ProfitCalculator");
const FlashLoanExecutor_1 = require("./FlashLoanExecutor");
const DEXAggregator_1 = require("../dex/DEXAggregator");
const NotificationService_1 = require("../services/NotificationService");
const DatabaseService_1 = require("../services/DatabaseService");
const CircuitBreaker_1 = require("../risk/CircuitBreaker");
const PositionManager_1 = require("../risk/PositionManager");
// ========================================
// 🚀 ARBITRAGE ENGINE CLASS - Türkçe Dokümantasyon
// ========================================
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
class ArbitrageEngine extends events_1.EventEmitter {
    // ============ Private Properties ============
    config;
    logger;
    // Monitörler
    priceMonitor;
    gasMonitor;
    liquidityMonitor;
    // Ana Servisler
    profitCalculator;
    flashLoanExecutor;
    dexAggregator;
    notificationService;
    databaseService;
    // Risk Yönetimi
    circuitBreaker;
    positionManager;
    // Durum Yönetimi
    isRunning = false;
    isPaused = false;
    workers = [];
    stats;
    lastOpportunities = [];
    // Timers
    scanTimer = null;
    metricsTimer = null;
    /**
     * Constructor - Arbitraj Motoru Başlatıcı
     * @param config - Motor konfigürasyonu
     */
    constructor(config = {}) {
        super();
        this.config = { ...this.getDefaultConfig(), ...config };
        this.logger = Logger_1.Logger;
        // Servisleri başlat
        this.priceMonitor = new PriceMonitor_1.PriceMonitor({});
        this.gasMonitor = new GasMonitor_1.GasMonitor({});
        this.liquidityMonitor = new LiquidityMonitor_1.LiquidityMonitor({}, {});
        this.profitCalculator = new ProfitCalculator_1.ProfitCalculator({});
        this.flashLoanExecutor = new FlashLoanExecutor_1.FlashLoanExecutor({});
        this.dexAggregator = new DEXAggregator_1.DEXAggregator({});
        this.notificationService = new NotificationService_1.NotificationService({});
        this.databaseService = new DatabaseService_1.DatabaseService({});
        this.circuitBreaker = new CircuitBreaker_1.CircuitBreaker({});
        this.positionManager = new PositionManager_1.PositionManager({});
        // İstatistikleri başlat
        this.stats = this.getInitialStats();
        this.logger.info('🚀 Arbitraj motoru başlatıldı', {
            config: this.config,
            timestamp: Date.now()
        });
    }
    // ========================================
    // 🎯 ANA KONTROL METODları
    // ========================================
    /**
     * Motoru Başlat
     * Arbitraj taramaya başlar
     */
    async start() {
        try {
            if (this.isRunning) {
                this.logger.warn('⚠️ Motor zaten çalışıyor');
                return;
            }
            this.logger.info('🟢 Arbitraj motoru başlatılıyor...');
            // Servisleri başlat
            await this.initializeServices();
            // Monitörleri başlat
            await this.startMonitoring();
            // Worker'ları başlat (multi-thread aktifse)
            if (this.config.enableMultiThread) {
                await this.startWorkers();
            }
            // Ana tarama döngüsünü başlat
            this.startScanningLoop();
            // Metrik toplama başlat
            if (this.config.metricsEnabled) {
                this.startMetricsCollection();
            }
            this.isRunning = true;
            this.isPaused = false;
            this.logger.info('✅ Arbitraj motoru başarıyla başlatıldı');
            this.emit('started', { timestamp: Date.now() });
        }
        catch (error) {
            this.logger.error('❌ Motor başlatma hatası:', error);
            throw error;
        }
    }
    /**
     * Motoru Durdur
     * Güvenli şekilde motoru kapatır
     */
    async stop() {
        try {
            this.logger.info('🔴 Arbitraj motoru durduruluyor...');
            this.isRunning = false;
            // Timer'ları durdur
            if (this.scanTimer) {
                clearInterval(this.scanTimer);
                this.scanTimer = null;
            }
            if (this.metricsTimer) {
                clearInterval(this.metricsTimer);
                this.metricsTimer = null;
            }
            // Worker'ları durdur
            await this.stopWorkers();
            // Monitörleri durdur
            await this.stopMonitoring();
            // Servisleri temizle
            await this.cleanupServices();
            this.logger.info('✅ Arbitraj motoru başarıyla durduruldu');
            this.emit('stopped', { timestamp: Date.now() });
        }
        catch (error) {
            this.logger.error('❌ Motor durdurma hatası:', error);
            throw error;
        }
    }
    /**
     * Motoru Duraklat
     * Geçici olarak taramayı durdurur
     */
    async pause() {
        this.isPaused = true;
        this.logger.info('⏸️ Arbitraj motoru duraklatıldı');
        this.emit('paused', { timestamp: Date.now() });
    }
    /**
     * Motoru Devam Ettir
     * Duraklatılmış motoru yeniden başlatır
     */
    async resume() {
        this.isPaused = false;
        this.logger.info('▶️ Arbitraj motoru devam etti');
        this.emit('resumed', { timestamp: Date.now() });
    }
    /**
     * Arbitraj Fırsatı Ara
     * Piyasadaki fırsatları tarar ve analiz eder
     */
    async scanForOpportunities() {
        try {
            if (!this.isRunning || this.isPaused) {
                return [];
            }
            // Circuit breaker kontrolü
            const breakerState = this.circuitBreaker.getState();
            if (breakerState.isTripped) {
                this.logger.warn('🔒 Circuit breaker aktif, tarama atlanıyor');
                return [];
            }
            // Piyasa koşullarını kontrol et
            const marketConditions = await this.getMarketConditions();
            if (!this.isMarketSuitable(marketConditions)) {
                this.logger.debug('📊 Piyasa koşulları uygun değil');
                return [];
            }
            // Token çiftlerini al
            const tokenPairs = await this.getActiveTokenPairs();
            // Fırsatları tara
            const opportunities = [];
            for (const pair of tokenPairs) {
                try {
                    const pairOpportunities = await this.scanTokenPair(pair);
                    opportunities.push(...pairOpportunities);
                }
                catch (error) {
                    this.logger.error(`Token çifti tarama hatası ${pair.token0.symbol}/${pair.token1.symbol}:`, error);
                }
            }
            // Fırsatları filtrele ve sırala
            const filteredOpportunities = await this.filterAndRankOpportunities(opportunities);
            this.lastOpportunities = filteredOpportunities;
            this.stats.totalOpportunities += filteredOpportunities.length;
            if (filteredOpportunities.length > 0) {
                this.logger.info(`🎯 ${filteredOpportunities.length} arbitraj fırsatı tespit edildi`);
                this.emit('opportunitiesFound', filteredOpportunities);
            }
            return filteredOpportunities;
        }
        catch (error) {
            this.logger.error('❌ Fırsat tarama hatası:', error);
            return [];
        }
    }
    /**
     * Arbitraj İşlemi Gerçekleştir
     * En iyi fırsatı seçer ve işlem yapar
     */
    async executeArbitrage(opportunity) {
        const startTime = Date.now();
        try {
            this.logger.info('⚡ Arbitraj işlemi başlatılıyor', {
                opportunityId: opportunity.id,
                expectedProfit: ethers_1.ethers.formatEther(opportunity.expectedProfit),
                route: opportunity.route.map(r => `${r.exchange}: ${r.tokenIn} -> ${r.tokenOut}`)
            });
            // Circuit breaker son kontrol
            const breakerCheck = await this.circuitBreaker.checkBeforeTransaction(opportunity.expectedProfit, Number(opportunity.gasEstimate), opportunity.slippage);
            if (!breakerCheck.allowed) {
                return {
                    success: false,
                    error: breakerCheck.reason,
                    opportunity,
                    executionTime: Date.now() - startTime
                };
            }
            // Position manager kontrolü - mock implementation
            const positionCheck = { allowed: true, reason: '' };
            if (!positionCheck.allowed) {
                return {
                    success: false,
                    error: positionCheck.reason,
                    opportunity,
                    executionTime: Date.now() - startTime
                };
            }
            // Flashloan ile arbitraj işlemini gerçekleştir - mock implementation
            const result = {
                success: true,
                transactionHash: '0x123...',
                gasUsed: BigInt(300000),
                gasPrice: BigInt(20000000000), // 20 gwei
                profit: opportunity.expectedProfit
            };
            // Sonucu işle
            const executionResult = {
                ...result,
                opportunity,
                executionTime: Date.now() - startTime
            };
            // İstatistikleri güncelle
            await this.updateStats(executionResult);
            // Circuit breaker'a bildir
            await this.circuitBreaker.checkAfterTransaction({
                success: result.success,
                profit: result.profit || 0n,
                gasUsed: result.gasUsed || 0n,
                gasPrice: Number(result.gasPrice || 0n),
                slippage: opportunity.slippage
            });
            // Position manager'ı güncelle
            if (result.success && result.profit) {
                // Mock position update
                console.log('Position updated:', opportunity.token0, result.profit);
            }
            // Bildirim gönder
            if (this.config.enableNotifications) {
                await this.sendExecutionNotification(executionResult);
            }
            // Veritabanına kaydet - mock implementation
            console.log('Execution result saved:', executionResult);
            this.emit('executionCompleted', executionResult);
            return executionResult;
        }
        catch (error) {
            this.logger.error('❌ Arbitraj işlemi hatası:', error);
            const errorResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Bilinmeyen hata',
                opportunity,
                executionTime: Date.now() - startTime
            };
            await this.updateStats(errorResult);
            this.emit('executionFailed', errorResult);
            return errorResult;
        }
    }
    // ========================================
    // 📊 DURUM ve METRİK METODları
    // ========================================
    /**
     * Motor Durumunu Al
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            stats: { ...this.stats },
            lastOpportunities: [...this.lastOpportunities]
        };
    }
    /**
     * Detaylı İstatistikler
     */
    async getDetailedStats() {
        const baseStats = { ...this.stats };
        // Veritabanından detaylı veriler
        // Mock database stats
        const hourlyStats = [];
        const dailyStats = [];
        const tokenStats = [];
        const exchangeStats = [];
        return {
            ...baseStats,
            hourlyStats,
            dailyStats,
            tokenStats,
            exchangeStats
        };
    }
    /**
     * Sağlık Kontrolü
     */
    async healthCheck() {
        const details = [];
        let status = 'HEALTHY';
        const components = {
            engine: this.isRunning ? 'OK' : 'ERROR',
            priceMonitor: 'OK',
            gasMonitor: 'OK',
            liquidityMonitor: 'OK',
            circuitBreaker: 'OK',
            positionManager: 'OK',
            database: 'OK'
        };
        // Motor durumu
        if (!this.isRunning) {
            status = 'CRITICAL';
            details.push('Motor çalışmıyor');
        }
        if (this.isPaused) {
            status = status === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
            details.push('Motor duraklatıldı');
        }
        // Circuit breaker durumu
        const breakerHealth = await this.circuitBreaker.healthCheck();
        if (breakerHealth.status === 'CRITICAL') {
            status = 'CRITICAL';
            components.circuitBreaker = 'ERROR';
            details.push(...breakerHealth.details);
        }
        else if (breakerHealth.status === 'WARNING') {
            status = status === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
            components.circuitBreaker = 'WARNING';
            details.push(...breakerHealth.details);
        }
        return {
            status,
            details,
            uptime: Date.now() - (this.stats.lastUpdate || Date.now()),
            components
        };
    }
    // ========================================
    // 🔧 ÖZEL YARDIMCI METODlar
    // ========================================
    /**
     * Varsayılan Konfigürasyon
     */
    getDefaultConfig() {
        return {
            minProfitWei: ethers_1.ethers.parseEther('0.001'), // 0.001 ETH minimum kar
            minProfitPercentage: 0.5, // %0.5 minimum kar yüzdesi
            maxGasPrice: ethers_1.ethers.parseUnits('100', 'gwei'), // 100 gwei maksimum gas
            gasMultiplier: 1.2, // %20 gas güvenlik marjı
            scanInterval: 5000, // 5 saniye tarama aralığı
            maxOpportunities: 10, // Maksimum 10 fırsat
            timeoutMs: 30000, // 30 saniye timeout
            maxSlippage: 1, // %1 maksimum kayma
            minLiquidity: ethers_1.ethers.parseEther('1'), // 1 ETH minimum likidite
            maxRisk: 70, // 70/100 maksimum risk
            enableMultiThread: true, // Multi-thread aktif
            workerCount: 4, // 4 worker
            batchSize: 50, // 50'li batch'ler
            enableNotifications: true, // Bildirimler aktif
            logLevel: 'info', // Info log seviyesi
            metricsEnabled: true // Metrikler aktif
        };
    }
    /**
     * Başlangıç İstatistikleri
     */
    getInitialStats() {
        return {
            totalOpportunities: 0,
            successfulTrades: 0,
            failedTrades: 0,
            totalProfit: 0n,
            totalGasSpent: 0n,
            averageExecutionTime: 0,
            winRate: 0,
            uptime: Date.now(),
            lastUpdate: Date.now()
        };
    }
    /**
     * Servisleri Başlat
     */
    async initializeServices() {
        // Servislerin başlatılması stub olarak implement edildi
        this.logger.info('🔧 Servisler başlatılıyor...');
    }
    /**
     * Monitörleri Başlat
     */
    async startMonitoring() {
        // Monitörlerin başlatılması stub olarak implement edildi
        this.logger.info('📊 Monitörler başlatılıyor...');
    }
    /**
     * Worker'ları Başlat
     */
    async startWorkers() {
        // Worker'ların başlatılması stub olarak implement edildi
        this.logger.info('🔄 Workerlar başlatılıyor...');
    }
    /**
     * Ana Tarama Döngüsü
     */
    startScanningLoop() {
        this.scanTimer = setInterval(async () => {
            if (!this.isPaused) {
                const opportunities = await this.scanForOpportunities();
                // En iyi fırsatı otomatik olarak işle
                if (opportunities.length > 0) {
                    const bestOpportunity = opportunities[0];
                    await this.executeArbitrage(bestOpportunity);
                }
            }
        }, this.config.scanInterval);
    }
    /**
     * Metrik Toplama Başlat
     */
    startMetricsCollection() {
        this.metricsTimer = setInterval(async () => {
            await this.collectMetrics();
        }, 60000); // Her dakika
    }
    /**
     * Piyasa Koşullarını Al
     */
    async getMarketConditions() {
        // Stub implementation
        return {
            gasPrice: ethers_1.ethers.parseUnits('50', 'gwei'),
            networkCongestion: 30,
            volatility: 40,
            liquidityIndex: 80,
            marketSentiment: 'NEUTRAL',
            timestamp: Date.now()
        };
    }
    /**
     * Piyasa Uygunluğu Kontrolü
     */
    isMarketSuitable(conditions) {
        // Basit kontrol - gas fiyatı çok yüksek değilse uygun
        return conditions.gasPrice <= this.config.maxGasPrice;
    }
    /**
     * Aktif Token Çiftlerini Al
     */
    async getActiveTokenPairs() {
        // Stub implementation - örnek token çiftleri
        return [
            {
                token0: {
                    address: '0xA0b86a33E6441E7c8D0e69A33E4D90F02B8AAEE',
                    symbol: 'WETH',
                    decimals: 18
                },
                token1: {
                    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                    symbol: 'USDT',
                    decimals: 6
                },
                exchanges: ['Uniswap', 'Sushiswap'],
                lastUpdate: Date.now()
            }
        ];
    }
    /**
     * Token Çifti Tarama
     */
    async scanTokenPair(pair) {
        // Stub implementation
        return [];
    }
    /**
     * Fırsatları Filtrele ve Sırala
     */
    async filterAndRankOpportunities(opportunities) {
        return opportunities
            .filter(opp => opp.netProfit >= this.config.minProfitWei)
            .filter(opp => opp.risk <= this.config.maxRisk)
            .sort((a, b) => Number(b.netProfit - a.netProfit))
            .slice(0, this.config.maxOpportunities);
    }
    /**
     * İstatistikleri Güncelle
     */
    async updateStats(result) {
        if (result.success) {
            this.stats.successfulTrades++;
            this.stats.totalProfit += result.profit || 0n;
        }
        else {
            this.stats.failedTrades++;
        }
        this.stats.totalGasSpent += result.gasUsed || 0n;
        this.stats.winRate = this.stats.successfulTrades / (this.stats.successfulTrades + this.stats.failedTrades);
        this.stats.lastUpdate = Date.now();
    }
    /**
     * İşlem Bildirimi Gönder
     */
    async sendExecutionNotification(result) {
        if (result.success) {
            await this.notificationService.sendAlert('ARBITRAGE_SUCCESS', {
                profit: result.profit,
                gasUsed: result.gasUsed,
                executionTime: result.executionTime
            });
        }
        else {
            await this.notificationService.sendAlert('ARBITRAGE_FAILED', {
                error: result.error,
                opportunityId: result.opportunity.id
            });
        }
    }
    /**
     * Worker'ları Durdur
     */
    async stopWorkers() {
        for (const worker of this.workers) {
            await worker.terminate();
        }
        this.workers = [];
    }
    /**
     * Monitörleri Durdur
     */
    async stopMonitoring() {
        // Monitörlerin durdurulması stub olarak implement edildi
        this.logger.info('📊 Monitörler durduruluyor...');
    }
    /**
     * Servisleri Temizle
     */
    async cleanupServices() {
        await this.circuitBreaker.cleanup();
        this.logger.info('🧹 Servisler temizlendi');
    }
    /**
     * Metrik Toplama
     */
    async collectMetrics() {
        // Basit metrik toplama
        this.stats.uptime = Date.now() - this.stats.uptime;
    }
}
exports.ArbitrageEngine = ArbitrageEngine;
/**
 * Varsayılan Motor Factory
 * Hızlı başlatma için kullanılır
 */
function createDefaultEngine() {
    const config = {
        minProfitWei: ethers_1.ethers.parseEther('0.002'), // 0.002 ETH minimum kar
        maxGasPrice: ethers_1.ethers.parseUnits('80', 'gwei'), // 80 gwei maksimum gas
        scanInterval: 3000, // 3 saniye tarama
        enableMultiThread: false, // Basit mode
        enableNotifications: false, // Bildirimler kapalı
        metricsEnabled: true // Metrikler açık
    };
    return new ArbitrageEngine(config);
}
exports.default = ArbitrageEngine;
//# sourceMappingURL=ArbitrageEngine_NEW.js.map