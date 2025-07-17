"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = void 0;
exports.createDefaultCircuitBreaker = createDefaultCircuitBreaker;
const ethers_1 = require("ethers");
const Logger_1 = require("../utils/Logger");
const NotificationService_1 = require("../services/NotificationService");
const DatabaseService_1 = require("../services/DatabaseService");
// ========================================
// 🛡️ CIRCUIT BREAKER CLASS - Türkçe Dokümantasyon
// ========================================
/**
 * Circuit Breaker - Devre Kesici Sistemi
 *
 * Arbitraj botunu tehlikeli piyasa koşullarından korur.
 * Zarar eşikleri aşıldığında otomatik olarak işlemleri durdurur.
 *
 * Özellikler:
 * - Çoklu zarar eşiği kontrolü
 * - Zaman bazlı limitler
 * - Piyasa koşulu analizi
 * - Otomatik kurtarma sistemi
 * - Detaylı metrik toplama
 */
class CircuitBreaker {
    logger;
    notificationService;
    databaseService;
    config;
    // Durum Yönetimi
    state;
    tripConditions = [];
    recoveryConditions = [];
    // İzleme Sistemleri
    monitoringInterval = null;
    recoveryInterval = null;
    // Geçmiş Veriler
    lossHistory = [];
    gasHistory = [];
    slippageHistory = [];
    /**
     * Constructor - Circuit Breaker Başlatıcı
     * @param config - Devre kesici konfigürasyonu
     */
    constructor(config) {
        this.logger = Logger_1.Logger;
        this.notificationService = new NotificationService_1.NotificationService({});
        this.databaseService = new DatabaseService_1.DatabaseService({});
        this.config = { ...this.getDefaultConfig(), ...config };
        this.state = this.getInitialState();
        this.logger.info('🛡️ Circuit Breaker başlatıldı', {
            config: this.config,
            timestamp: Date.now()
        });
    }
    // ========================================
    // 🎯 ANA KONTROL METODları
    // ========================================
    /**
     * İşlem Öncesi Kontrol
     * Her arbitraj işleminden önce çağrılır
     */
    async checkBeforeTransaction(amount, gasPrice, slippage) {
        try {
            // Devre kesici aktif mi kontrol et
            if (this.state.isTripped) {
                return {
                    allowed: false,
                    reason: `Circuit breaker aktif: ${this.state.tripReason}`
                };
            }
            // Gas fiyatı kontrolü
            if (gasPrice > this.config.maxGasPriceGwei) {
                await this.trip('HIGH_GAS_PRICE', `Gas fiyatı çok yüksek: ${gasPrice} gwei`);
                return {
                    allowed: false,
                    reason: 'Gas fiyatı limit aşıldı'
                };
            }
            // Kayma kontrolü
            if (slippage > this.config.maxSlippagePercent) {
                await this.trip('HIGH_SLIPPAGE', `Kayma çok yüksek: ${slippage}%`);
                return {
                    allowed: false,
                    reason: 'Kayma toleransı aşıldı'
                };
            }
            return { allowed: true };
        }
        catch (error) {
            this.logger.error('İşlem öncesi kontrol hatası:', error);
            return {
                allowed: false,
                reason: 'Güvenlik kontrolü başarısız'
            };
        }
    }
    /**
     * İşlem Sonrası Kontrol
     * Her arbitraj işleminden sonra çağrılır
     */
    async checkAfterTransaction(result) {
        try {
            // Zarar durumunda analiz
            if (!result.success || result.profit < 0n) {
                await this.recordLoss(Math.abs(Number(result.profit)));
                await this.checkLossThresholds();
            }
            else {
                // Başarılı işlem - ardışık zarar sayacını sıfırla
                this.state.consecutiveLosses = 0;
            }
            // Gas ve kayma geçmişini güncelle
            this.updateMarketHistory(result.gasPrice, result.slippage);
            // Durumu kaydet
            await this.saveState();
        }
        catch (error) {
            this.logger.error('İşlem sonrası kontrol hatası:', error);
        }
    }
    /**
     * Circuit Breaker Tetikleme
     * Güvenlik eşiği aşıldığında sistemi durdurur
     */
    async trip(reason, details) {
        try {
            this.state.isTripped = true;
            this.state.tripReason = `${reason}: ${details}`;
            this.state.tripTimestamp = Date.now();
            this.state.expectedRecoveryTime = Date.now() + (this.config.recoveryDelayMinutes * 60 * 1000);
            // Tetikleme koşulunu kaydet
            const condition = {
                type: reason,
                description: details,
                threshold: 0,
                currentValue: 0,
                severity: 'CRITICAL',
                timestamp: Date.now()
            };
            this.tripConditions.push(condition);
            this.logger.warn('🚨 Circuit Breaker tetiklendi!', {
                reason: this.state.tripReason,
                timestamp: this.state.tripTimestamp,
                expectedRecovery: this.state.expectedRecoveryTime
            });
            // Bildirim gönder - mock implementation
            console.log('Circuit breaker trip notification:', {
                reason: this.state.tripReason,
                timestamp: this.state.tripTimestamp
            });
            // Durumu kaydet
            await this.saveState();
            // Kurtarma sürecini başlat
            if (this.config.autoRecoveryEnabled) {
                this.startRecoveryProcess();
            }
        }
        catch (error) {
            this.logger.error('Circuit breaker tetikleme hatası:', error);
        }
    }
    /**
     * Manuel Reset
     * Operatör tarafından manuel olarak sistemi yeniden başlatır
     */
    async manualReset(operatorId, reason) {
        try {
            this.logger.info('📝 Manuel reset başlatıldı', {
                operator: operatorId,
                reason: reason,
                timestamp: Date.now()
            });
            // Durumu sıfırla
            this.state.isTripped = false;
            this.state.tripReason = '';
            this.state.manualOverride = true;
            this.state.consecutiveLosses = 0;
            this.state.recoveryAttempts = 0;
            // Bildirim gönder - mock implementation
            console.log('Circuit breaker reset notification:', {
                operator: operatorId,
                reason: reason,
                timestamp: Date.now()
            });
            // Durumu kaydet
            await this.saveState();
            this.logger.info('✅ Circuit Breaker manuel olarak sıfırlandı');
            return true;
        }
        catch (error) {
            this.logger.error('Manuel reset hatası:', error);
            return false;
        }
    }
    // ========================================
    // 📊 METRIK ve DURUM METODları
    // ========================================
    /**
     * Anlık Durum Bilgisi
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Konfigürasyon Bilgisi
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Detaylı Metrikler
     */
    async getMetrics() {
        return {
            totalTrips: this.tripConditions.length,
            avgTripDuration: 0,
            successfulRecoveries: 0,
            failedRecoveries: 0,
            preventedLosses: 0n,
            uptime: Date.now() - (this.state.tripTimestamp || Date.now())
        };
    }
    /**
     * Sistem Sağlığı Kontrolü
     */
    async healthCheck() {
        const details = [];
        let status = 'HEALTHY';
        // Circuit breaker durumu
        if (this.state.isTripped) {
            status = 'CRITICAL';
            details.push(`Circuit breaker aktif: ${this.state.tripReason}`);
        }
        // Ardışık zarar kontrolü
        if (this.state.consecutiveLosses > this.config.maxConsecutiveLosses * 0.8) {
            status = status === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
            details.push(`Yüksek ardışık zarar: ${this.state.consecutiveLosses}`);
        }
        return {
            status,
            details,
            uptime: Date.now() - (this.state.tripTimestamp || Date.now())
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
            maxLossPercentage: 0.05, // %5 maksimum zarar
            maxConsecutiveLosses: 3, // 3 ardışık zarar
            maxLossAmountETH: ethers_1.ethers.parseEther('0.1'), // 0.1 ETH maksimum zarar
            maxDrawdownPercentage: 0.1, // %10 maksimum düşüş
            maxLossesPerHour: 10, // Saatte 10 zarar
            maxLossesPerDay: 50, // Günde 50 zarar
            maxGasPriceGwei: 100, // 100 gwei maksimum gas
            minLiquidityETH: ethers_1.ethers.parseEther('10'), // 10 ETH minimum likidite
            maxSlippagePercent: 2, // %2 maksimum kayma
            autoRecoveryEnabled: true, // Otomatik kurtarma aktif
            recoveryDelayMinutes: 15, // 15 dakika kurtarma gecikmesi
            manualOverrideRequired: false, // Manuel onay gerekmez
            checkIntervalMs: 30000, // 30 saniye kontrol aralığı
            alertThresholdPercent: 0.8 // %80 uyarı eşiği
        };
    }
    /**
     * Başlangıç Durumu
     */
    getInitialState() {
        return {
            isTripped: false,
            tripReason: '',
            tripTimestamp: 0,
            expectedRecoveryTime: 0,
            manualOverride: false,
            currentLossPercentage: 0,
            consecutiveLosses: 0,
            totalLossAmountETH: 0n,
            currentDrawdown: 0,
            lossesThisHour: 0,
            lossesToday: 0,
            currentGasPrice: 0,
            currentLiquidity: 0n,
            currentSlippage: 0,
            recoveryAttempts: 0,
            lastRecoveryAttempt: 0,
            canAutoRecover: true
        };
    }
    /**
     * Zarar Kaydı
     */
    async recordLoss(amount) {
        const lossRecord = {
            timestamp: Date.now(),
            amount: BigInt(amount),
            percentage: (amount / Number(ethers_1.ethers.parseEther('1'))) * 100
        };
        this.lossHistory.push(lossRecord);
        this.state.consecutiveLosses++;
        this.state.totalLossAmountETH += lossRecord.amount;
        // Son 1 saat içindeki zararları say
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        this.state.lossesThisHour = this.lossHistory.filter(loss => loss.timestamp > oneHourAgo).length;
        // Bugünkü zararları say
        const startOfDay = new Date().setHours(0, 0, 0, 0);
        this.state.lossesToday = this.lossHistory.filter(loss => loss.timestamp > startOfDay).length;
    }
    /**
     * Zarar Eşiklerini Kontrol Et
     */
    async checkLossThresholds() {
        // Ardışık zarar kontrolü
        if (this.state.consecutiveLosses >= this.config.maxConsecutiveLosses) {
            await this.trip('CONSECUTIVE_LOSSES', `${this.state.consecutiveLosses} ardışık zarar`);
            return;
        }
        // Saatlik zarar kontrolü
        if (this.state.lossesThisHour >= this.config.maxLossesPerHour) {
            await this.trip('HOURLY_LOSS_LIMIT', `Bu saatte ${this.state.lossesThisHour} zarar`);
            return;
        }
        // Günlük zarar kontrolü
        if (this.state.lossesToday >= this.config.maxLossesPerDay) {
            await this.trip('DAILY_LOSS_LIMIT', `Bugün ${this.state.lossesToday} zarar`);
            return;
        }
        // Toplam zarar miktarı kontrolü
        if (this.state.totalLossAmountETH >= this.config.maxLossAmountETH) {
            await this.trip('TOTAL_LOSS_AMOUNT', `Toplam zarar: ${ethers_1.ethers.formatEther(this.state.totalLossAmountETH)} ETH`);
            return;
        }
    }
    /**
     * Piyasa Geçmişini Güncelle
     */
    updateMarketHistory(gasPrice, slippage) {
        const now = Date.now();
        this.gasHistory.push({ timestamp: now, gasPrice });
        this.slippageHistory.push({ timestamp: now, slippage });
        // Son 24 saatlik veriyi tut
        const dayAgo = now - (24 * 60 * 60 * 1000);
        this.gasHistory = this.gasHistory.filter(entry => entry.timestamp > dayAgo);
        this.slippageHistory = this.slippageHistory.filter(entry => entry.timestamp > dayAgo);
        // Mevcut değerleri güncelle
        this.state.currentGasPrice = gasPrice;
        this.state.currentSlippage = slippage;
    }
    /**
     * Kurtarma Sürecini Başlat
     */
    startRecoveryProcess() {
        if (this.recoveryInterval) {
            clearInterval(this.recoveryInterval);
        }
        this.recoveryInterval = setInterval(async () => {
            await this.attemptRecovery();
        }, 60000); // Her dakika kontrol et
    }
    /**
     * Kurtarma Denemesi
     */
    async attemptRecovery() {
        try {
            if (!this.state.isTripped || !this.config.autoRecoveryEnabled) {
                return;
            }
            // Kurtarma zamanı henüz gelmedi mi
            if (Date.now() < this.state.expectedRecoveryTime) {
                return;
            }
            this.state.recoveryAttempts++;
            this.state.lastRecoveryAttempt = Date.now();
            // Kurtarma koşullarını kontrol et
            const canRecover = await this.checkRecoveryConditions();
            if (canRecover) {
                this.state.isTripped = false;
                this.state.tripReason = '';
                if (this.recoveryInterval) {
                    clearInterval(this.recoveryInterval);
                    this.recoveryInterval = null;
                }
                this.logger.info('🔄 Circuit breaker otomatik olarak kurtarıldı');
                // Mock notification
                console.log('Circuit breaker recovered notification:', {
                    recoveryAttempts: this.state.recoveryAttempts,
                    timestamp: Date.now()
                });
                await this.saveState();
            }
        }
        catch (error) {
            this.logger.error('Kurtarma denemesi hatası:', error);
        }
    }
    /**
     * Kurtarma Koşullarını Kontrol Et
     */
    async checkRecoveryConditions() {
        // Basit kurtarma koşulu - belirli süre geçtikten sonra
        const timeSinceTrip = Date.now() - this.state.tripTimestamp;
        const minRecoveryTime = this.config.recoveryDelayMinutes * 60 * 1000;
        return timeSinceTrip >= minRecoveryTime;
    }
    /**
     * Durumu Kaydet
     */
    async saveState() {
        try {
            // Mock implementation - saveCircuitBreakerState method
            console.log('Circuit breaker state saved:', this.state);
        }
        catch (error) {
            this.logger.error('Durum kaydetme hatası:', error);
        }
    }
    /**
     * Temizlik - Sistem kapatılırken çağrılır
     */
    async cleanup() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        if (this.recoveryInterval) {
            clearInterval(this.recoveryInterval);
        }
        await this.saveState();
        this.logger.info('🛡️ Circuit Breaker temizlendi');
    }
}
exports.CircuitBreaker = CircuitBreaker;
/**
 * Varsayılan Circuit Breaker Factory
 * Hızlı başlatma için kullanılır
 */
function createDefaultCircuitBreaker() {
    const defaultConfig = {
        maxLossPercentage: 0.03, // %3 maksimum zarar
        maxConsecutiveLosses: 2, // 2 ardışık zarar
        maxLossAmountETH: ethers_1.ethers.parseEther('0.05'), // 0.05 ETH maksimum zarar
        maxDrawdownPercentage: 0.08, // %8 maksimum düşüş
        maxLossesPerHour: 8, // Saatte 8 zarar
        maxLossesPerDay: 30, // Günde 30 zarar
        maxGasPriceGwei: 80, // 80 gwei maksimum gas
        minLiquidityETH: ethers_1.ethers.parseEther('5'), // 5 ETH minimum likidite
        maxSlippagePercent: 1.5, // %1.5 maksimum kayma
        autoRecoveryEnabled: true, // Otomatik kurtarma aktif
        recoveryDelayMinutes: 10, // 10 dakika kurtarma gecikmesi
        manualOverrideRequired: false, // Manuel onay gerekmez
        checkIntervalMs: 20000, // 20 saniye kontrol aralığı
        alertThresholdPercent: 0.75 // %75 uyarı eşiği
    };
    return new CircuitBreaker(defaultConfig);
}
exports.default = CircuitBreaker;
//# sourceMappingURL=CircuitBreaker_NEW.js.map