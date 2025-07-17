import { EventEmitter } from 'events';
/**
 * Bağlantı Durumu
 */
declare enum ConnectionStatus {
    DISCONNECTED = "disconnected",
    CONNECTING = "connecting",
    CONNECTED = "connected",
    RECONNECTING = "reconnecting",
    FAILED = "failed"
}
/**
 * WebSocket Konfigürasyonu
 */
interface WebSocketConfig {
    reconnectInterval: number;
    maxReconnectAttempts: number;
    pingInterval: number;
    connectionTimeout: number;
    enableHeartbeat: boolean;
}
/**
 * WebSocketManager - WebSocket Bağlantı Yöneticisi (Basit Stub)
 *
 * Real-time veri akışı için WebSocket bağlantılarını yönetir.
 * Bu stub versiyonu sadece temel işlevsellik sağlar.
 */
export declare class WebSocketManager extends EventEmitter {
    private logger;
    private config;
    private connections;
    private reconnectTimers;
    private pingTimers;
    /**
     * Constructor - WebSocket Yöneticisi Başlatıcı
     */
    constructor(config?: Partial<WebSocketConfig>);
    /**
     * WebSocket Bağlantısı Ekle
     */
    addConnection(id: string, url: string, subscriptions?: string[]): Promise<void>;
    /**
     * WebSocket'e Bağlan
     */
    connect(connectionId: string): Promise<void>;
    /**
     * WebSocket Bağlantısını Kes
     */
    disconnect(connectionId: string): Promise<void>;
    /**
     * Mesaj Gönder
     */
    sendMessage(connectionId: string, message: any): Promise<void>;
    /**
     * Abonelik Ekle
     */
    subscribe(connectionId: string, subscription: string): Promise<void>;
    /**
     * Abonelik İptal Et
     */
    unsubscribe(connectionId: string, subscription: string): Promise<void>;
    /**
     * Bağlantı Durumunu Al
     */
    getConnectionStatus(connectionId: string): ConnectionStatus | null;
    /**
     * Tüm Bağlantıları Al
     */
    getAllConnections(): {
        [key: string]: any;
    };
    /**
     * Aktif Bağlantı Sayısı
     */
    getActiveConnectionCount(): number;
    /**
     * Sağlık Kontrolü
     */
    healthCheck(): Promise<{
        status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
        details: string[];
        totalConnections: number;
        activeConnections: number;
        failedConnections: number;
    }>;
    /**
     * Varsayılan Konfigürasyon
     */
    private getDefaultConfig;
    /**
     * Heartbeat Başlat
     */
    private startHeartbeat;
    /**
     * Bağlantı Hatası İşle
     */
    private handleConnectionError;
    /**
     * Temizlik
     */
    cleanup(): Promise<void>;
}
export default WebSocketManager;
//# sourceMappingURL=WebSocketManager.d.ts.map