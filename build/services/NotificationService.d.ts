/**
 * Bildirim Konfigürasyonu
 */
interface NotificationConfig {
    enableAlerts?: boolean;
    enableLogs?: boolean;
}
/**
 * Arbitraj Sonucu
 */
interface ArbitrageResult {
    success: boolean;
    profit?: bigint;
    gasUsed?: bigint;
    error?: string;
}
/**
 * NotificationService - Bildirim Servisi (Basit Stub)
 *
 * Sistem bildirimleri ve uyarıları gönderir.
 * Bu stub versiyonu sadece console log yapar.
 */
export declare class NotificationService {
    private logger;
    private config;
    /**
     * Constructor - Bildirim Servisi Başlatıcı
     */
    constructor(config?: NotificationConfig);
    /**
     * Genel Uyarı Gönder
     */
    sendAlert(type: string, data: any): Promise<void>;
    /**
     * Zarar Bildirimi Gönder
     */
    sendLossNotification(message: string): Promise<void>;
    sendLossNotification(result: ArbitrageResult): Promise<void>;
    /**
     * Kar Bildirimi Gönder
     */
    sendProfitNotification(result: ArbitrageResult): Promise<void>;
    /**
     * Sistem Durumu Bildirimi
     */
    sendSystemStatus(status: string, details?: any): Promise<void>;
    /**
     * Acil Durum Bildirimi
     */
    sendEmergencyAlert(message: string, data?: any): Promise<void>;
    /**
     * Test Bildirimi
     */
    sendTestNotification(): Promise<boolean>;
    /**
     * Konfigürasyonu Güncelle
     */
    updateConfig(newConfig: Partial<NotificationConfig>): void;
    /**
     * Servis Durumunu Al
     */
    getStatus(): {
        isActive: boolean;
        config: NotificationConfig;
        lastNotification?: number;
    };
    /**
     * Sağlık Kontrolü
     */
    healthCheck(): Promise<{
        status: 'HEALTHY' | 'WARNING' | 'ERROR';
        details: string[];
    }>;
    /**
     * Temizlik
     */
    cleanup(): Promise<void>;
}
export default NotificationService;
//# sourceMappingURL=NotificationService.d.ts.map