"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const Logger_1 = require("../utils/Logger");
// ========================================
// 📢 NOTIFICATION SERVICE CLASS - Basit Stub
// ========================================
/**
 * NotificationService - Bildirim Servisi (Basit Stub)
 *
 * Sistem bildirimleri ve uyarıları gönderir.
 * Bu stub versiyonu sadece console log yapar.
 */
class NotificationService {
    logger;
    config;
    /**
     * Constructor - Bildirim Servisi Başlatıcı
     */
    constructor(config = {}) {
        this.logger = Logger_1.Logger;
        this.config = {
            enableAlerts: true,
            enableLogs: true,
            ...config
        };
        this.logger.info('📢 Bildirim servisi başlatıldı (stub mode)', {
            timestamp: Date.now()
        });
    }
    // ========================================
    // 🎯 ANA BİLDİRİM METODları - Stub
    // ========================================
    /**
     * Genel Uyarı Gönder
     */
    async sendAlert(type, data) {
        if (!this.config.enableAlerts) {
            return;
        }
        this.logger.info(`🚨 ALERT [${type}]`, data);
    }
    async sendLossNotification(messageOrResult) {
        if (!this.config.enableLogs) {
            return;
        }
        if (typeof messageOrResult === 'string') {
            this.logger.warn('💸 Zarar Bildirimi:', messageOrResult);
        }
        else {
            this.logger.warn('💸 Zarar Bildirimi:', {
                success: messageOrResult.success,
                error: messageOrResult.error,
                gasUsed: messageOrResult.gasUsed?.toString()
            });
        }
    }
    /**
     * Kar Bildirimi Gönder
     */
    async sendProfitNotification(result) {
        if (!this.config.enableLogs) {
            return;
        }
        this.logger.info('💰 Kar Bildirimi:', {
            success: result.success,
            profit: result.profit?.toString(),
            gasUsed: result.gasUsed?.toString()
        });
    }
    /**
     * Sistem Durumu Bildirimi
     */
    async sendSystemStatus(status, details) {
        this.logger.info(`🔧 Sistem Durumu: ${status}`, details);
    }
    /**
     * Acil Durum Bildirimi
     */
    async sendEmergencyAlert(message, data) {
        this.logger.error(`🆘 ACİL DURUM: ${message}`, data);
    }
    /**
     * Test Bildirimi
     */
    async sendTestNotification() {
        try {
            this.logger.info('🧪 Test bildirimi gönderildi');
            return true;
        }
        catch (error) {
            this.logger.error('Test bildirimi hatası:', error);
            return false;
        }
    }
    // ========================================
    // 🔧 YARDIMCI METODlar - Stub
    // ========================================
    /**
     * Konfigürasyonu Güncelle
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.logger.info('⚙️ Bildirim konfigürasyonu güncellendi', this.config);
    }
    /**
     * Servis Durumunu Al
     */
    getStatus() {
        return {
            isActive: true,
            config: this.config,
            lastNotification: Date.now()
        };
    }
    /**
     * Sağlık Kontrolü
     */
    async healthCheck() {
        return {
            status: 'HEALTHY',
            details: ['Bildirim servisi stub mode\'da çalışıyor']
        };
    }
    /**
     * Temizlik
     */
    async cleanup() {
        this.logger.info('📢 Bildirim servisi temizlendi');
    }
}
exports.NotificationService = NotificationService;
exports.default = NotificationService;
//# sourceMappingURL=NotificationService.js.map