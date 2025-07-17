/**
 * Pozisyon Konfigürasyonu
 * Risk yönetimi ve pozisyon limitleri
 */
interface PositionConfig {
    maxPositionSize: bigint;
    maxDailyExposure: bigint;
    maxConcurrentPositions: number;
    stopLossThreshold: number;
    maxDrawdown: number;
    cooldownPeriod: number;
    emergencyStopEnabled: boolean;
}
/**
 * Pozisyon Bilgisi
 * Açık pozisyonların detayları
 */
interface Position {
    id: string;
    token: string;
    amount: bigint;
    entryPrice: bigint;
    currentPrice: bigint;
    strategy: string;
    timestamp: number;
    status: 'OPEN' | 'CLOSED' | 'EMERGENCY_CLOSED';
    pnl: bigint;
    maxLoss: bigint;
    stopLossPrice: bigint;
}
/**
 * Risk Metrikleri
 * Anlık risk durumu ve istatistikler
 */
interface RiskMetrics {
    currentExposure: bigint;
    dailyExposure: bigint;
    totalPnL: bigint;
    dailyPnL: bigint;
    currentDrawdown: number;
    maxDrawdownToday: number;
    activePositions: number;
    riskScore: number;
    lastLossTimestamp: number;
    consecutiveLosses: number;
}
/**
 * Pozisyon Kontrolü Sonucu
 * Yeni pozisyon açma izni
 */
interface PositionCheckResult {
    allowed: boolean;
    reason?: string;
    maxAllowedAmount?: bigint;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}
/**
 * PositionManager - Pozisyon Yöneticisi
 *
 * Arbitraj pozisyonlarını izler ve risk yönetimi yapar.
 *
 * Özellikler:
 * - Real-time pozisyon takibi
 * - Otomatik stop loss
 * - Risk limiti kontrolü
 * - Exposure yönetimi
 * - Emergency stop sistemi
 */
export declare class PositionManager {
    private logger;
    private notificationService;
    private databaseService;
    private config;
    private positions;
    private riskMetrics;
    private exposureLimits;
    private isEmergencyStop;
    private monitoringInterval;
    /**
     * Constructor - Pozisyon Yöneticisi Başlatıcı
     * @param config - Pozisyon yönetimi konfigürasyonu
     */
    constructor(config?: Partial<PositionConfig>);
    /**
     * Yeni Pozisyon Kontrolü
     * Yeni pozisyon açmadan önce risk kontrolü yapar
     */
    checkNewPosition(token: string, amount: bigint): Promise<PositionCheckResult>;
    /**
     * Pozisyon Aç
     * Yeni arbitraj pozisyonu açar
     */
    openPosition(token: string, amount: bigint, entryPrice: bigint, strategy: string): Promise<string>;
    /**
     * Pozisyon Kapat
     * Mevcut pozisyonu kapatır
     */
    closePosition(positionId: string, exitPrice: bigint, reason?: string): Promise<bigint>;
    /**
     * Pozisyon Güncelle
     * Mevcut pozisyonun fiyatını günceller
     */
    updatePosition(positionId: string, currentPrice: bigint): Promise<void>;
    /**
     * Risk Metriklerini Al
     */
    getRiskMetrics(): RiskMetrics;
    /**
     * Aktif Pozisyonları Al
     */
    getActivePositions(): Position[];
    /**
     * Pozisyon Detayını Al
     */
    getPosition(positionId: string): Position | undefined;
    /**
     * Sağlık Kontrolü
     */
    healthCheck(): Promise<{
        status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
        details: string[];
        metrics: RiskMetrics;
    }>;
    /**
     * Varsayılan Konfigürasyon
     */
    private getDefaultConfig;
    /**
     * Başlangıç Risk Metrikleri
     */
    private getInitialRiskMetrics;
    /**
     * Risk Seviyesi Hesapla
     */
    private calculateRiskLevel;
    /**
     * Pozisyonu Kaydet
     */
    private savePosition;
    /**
     * Emergency Stop Aktif Et
     */
    activateEmergencyStop(reason: string): Promise<void>;
    /**
     * Emergency Stop Deaktif Et
     */
    deactivateEmergencyStop(operatorId: string): Promise<void>;
    /**
     * Temizlik
     */
    cleanup(): Promise<void>;
}
export default PositionManager;
//# sourceMappingURL=PositionManager.d.ts.map