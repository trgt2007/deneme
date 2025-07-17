import { ethers } from 'ethers';
import { Logger } from '../utils/Logger';
import { NotificationService } from '../services/NotificationService';
import { DatabaseService } from '../services/DatabaseService';

// ========================================
// 🎯 INTERFACES & TYPES - Türkçe Açıklamalar
// ========================================

/**
 * Pozisyon Konfigürasyonu
 * Risk yönetimi ve pozisyon limitleri
 */
interface PositionConfig {
  maxPositionSize: bigint;           // Maksimum pozisyon boyutu
  maxDailyExposure: bigint;          // Günlük maksimum risk
  maxConcurrentPositions: number;     // Eşzamanlı maksimum pozisyon sayısı
  stopLossThreshold: number;          // Stop loss yüzdesi (0.02 = %2)
  maxDrawdown: number;               // Maksimum düşüş (0.05 = %5)
  cooldownPeriod: number;            // Zarar sonrası bekleme süresi (ms)
  emergencyStopEnabled: boolean;      // Acil durdurma aktif mi
}

/**
 * Pozisyon Bilgisi
 * Açık pozisyonların detayları
 */
interface Position {
  id: string;                        // Pozisyon kimliği
  token: string;                     // Token adresi
  amount: bigint;                    // Pozisyon miktarı
  entryPrice: bigint;                // Giriş fiyatı
  currentPrice: bigint;              // Mevcut fiyat
  strategy: string;                  // Strateji adı
  timestamp: number;                 // Açılış zamanı
  status: 'OPEN' | 'CLOSED' | 'EMERGENCY_CLOSED'; // Durum
  pnl: bigint;                       // Kar/Zarar
  maxLoss: bigint;                   // Maksimum zarar
  stopLossPrice: bigint;             // Stop loss fiyatı
}

/**
 * Risk Metrikleri
 * Anlık risk durumu ve istatistikler
 */
interface RiskMetrics {
  currentExposure: bigint;           // Mevcut toplam risk
  dailyExposure: bigint;             // Günlük toplam risk
  totalPnL: bigint;                  // Toplam kar/zarar
  dailyPnL: bigint;                  // Günlük kar/zarar
  currentDrawdown: number;           // Mevcut düşüş yüzdesi
  maxDrawdownToday: number;          // Bugünkü maksimum düşüş
  activePositions: number;           // Aktif pozisyon sayısı
  riskScore: number;                 // Genel risk skoru (0-100)
  lastLossTimestamp: number;         // Son zarar zamanı
  consecutiveLosses: number;         // Ardışık zarar sayısı
}

/**
 * Risk Limiti
 * Token bazında risk sınırları
 */
interface ExposureLimit {
  token: string;                     // Token adresi
  maxAmount: bigint;                 // Maksimum miktar
  currentAmount: bigint;             // Mevcut miktar
  utilization: number;               // Kullanım oranı (0-1)
}

/**
 * Pozisyon Kontrolü Sonucu
 * Yeni pozisyon açma izni
 */
interface PositionCheckResult {
  allowed: boolean;                  // İzin verildi mi
  reason?: string;                   // Red nedeni
  maxAllowedAmount?: bigint;         // İzin verilen maksimum miktar
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; // Risk seviyesi
}

// ========================================
// 💼 POSITION MANAGER CLASS - Türkçe Dokümantasyon
// ========================================

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
export class PositionManager {
  private logger: any;
  private notificationService: NotificationService;
  private databaseService: DatabaseService;
  private config: PositionConfig;
  
  // Durum Yönetimi
  private positions: Map<string, Position> = new Map();
  private riskMetrics: RiskMetrics;
  private exposureLimits: Map<string, ExposureLimit> = new Map();
  private isEmergencyStop: boolean = false;
  
  // Monitoring
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Constructor - Pozisyon Yöneticisi Başlatıcı
   * @param config - Pozisyon yönetimi konfigürasyonu
   */
  constructor(config?: Partial<PositionConfig>) {
    this.logger = Logger;
    this.notificationService = new NotificationService();
    this.databaseService = new DatabaseService({} as any);
    this.config = { ...this.getDefaultConfig(), ...config };
    
    this.riskMetrics = this.getInitialRiskMetrics();
    
    this.logger.info('💼 Pozisyon yöneticisi başlatıldı', {
      config: this.config,
      timestamp: Date.now()
    });
  }

  // ========================================
  // 🎯 ANA KONTROL METODları
  // ========================================

  /**
   * Yeni Pozisyon Kontrolü
   * Yeni pozisyon açmadan önce risk kontrolü yapar
   */
  async checkNewPosition(
    token: string,
    amount: bigint
  ): Promise<PositionCheckResult> {
    try {
      // Emergency stop kontrolü
      if (this.isEmergencyStop) {
        return {
          allowed: false,
          reason: 'Emergency stop aktif',
          riskLevel: 'HIGH'
        };
      }

      // Pozisyon boyutu kontrolü
      if (amount > this.config.maxPositionSize) {
        return {
          allowed: false,
          reason: `Pozisyon çok büyük. Maksimum: ${ethers.formatEther(this.config.maxPositionSize)} ETH`,
          maxAllowedAmount: this.config.maxPositionSize,
          riskLevel: 'HIGH'
        };
      }

      // Eşzamanlı pozisyon kontrolü
      if (this.positions.size >= this.config.maxConcurrentPositions) {
        return {
          allowed: false,
          reason: `Maksimum eşzamanlı pozisyon sayısı aşıldı: ${this.config.maxConcurrentPositions}`,
          riskLevel: 'MEDIUM'
        };
      }

      // Günlük exposure kontrolü
      const totalDailyExposure = this.riskMetrics.dailyExposure + amount;
      if (totalDailyExposure > this.config.maxDailyExposure) {
        return {
          allowed: false,
          reason: 'Günlük risk limiti aşılıyor',
          maxAllowedAmount: this.config.maxDailyExposure - this.riskMetrics.dailyExposure,
          riskLevel: 'HIGH'
        };
      }

      // Drawdown kontrolü
      if (this.riskMetrics.currentDrawdown > this.config.maxDrawdown) {
        return {
          allowed: false,
          reason: `Maksimum drawdown aşıldı: ${(this.riskMetrics.currentDrawdown * 100).toFixed(2)}%`,
          riskLevel: 'HIGH'
        };
      }

      // Cooldown kontrolü
      const timeSinceLastLoss = Date.now() - this.riskMetrics.lastLossTimestamp;
      if (timeSinceLastLoss < this.config.cooldownPeriod) {
        return {
          allowed: false,
          reason: `Cooldown periyodu: ${Math.ceil((this.config.cooldownPeriod - timeSinceLastLoss) / 1000)} saniye kaldı`,
          riskLevel: 'MEDIUM'
        };
      }

      // Risk seviyesi hesapla
      const riskLevel = this.calculateRiskLevel(amount);

      return {
        allowed: true,
        riskLevel
      };

    } catch (error) {
      this.logger.error('Pozisyon kontrolü hatası:', error);
      return {
        allowed: false,
        reason: 'Risk kontrolü başarısız',
        riskLevel: 'HIGH'
      };
    }
  }

  /**
   * Pozisyon Aç
   * Yeni arbitraj pozisyonu açar
   */
  async openPosition(
    token: string,
    amount: bigint,
    entryPrice: bigint,
    strategy: string
  ): Promise<string> {
    try {
      const positionId = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const position: Position = {
        id: positionId,
        token,
        amount,
        entryPrice,
        currentPrice: entryPrice,
        strategy,
        timestamp: Date.now(),
        status: 'OPEN',
        pnl: 0n,
        maxLoss: 0n,
        stopLossPrice: entryPrice - (entryPrice * BigInt(Math.floor(this.config.stopLossThreshold * 10000)) / 10000n)
      };

      this.positions.set(positionId, position);
      
      // Risk metriklerini güncelle
      this.riskMetrics.currentExposure += amount;
      this.riskMetrics.dailyExposure += amount;
      this.riskMetrics.activePositions = this.positions.size;

      this.logger.info('📈 Yeni pozisyon açıldı', {
        positionId,
        token,
        amount: ethers.formatEther(amount),
        strategy
      });

      // Veritabanına kaydet
      await this.savePosition(position);

      return positionId;

    } catch (error) {
      this.logger.error('Pozisyon açma hatası:', error);
      throw error;
    }
  }

  /**
   * Pozisyon Kapat
   * Mevcut pozisyonu kapatır
   */
  async closePosition(
    positionId: string,
    exitPrice: bigint,
    reason: string = 'MANUAL'
  ): Promise<bigint> {
    try {
      const position = this.positions.get(positionId);
      if (!position) {
        throw new Error(`Pozisyon bulunamadı: ${positionId}`);
      }

      // P&L hesapla
      const pnl = (exitPrice - position.entryPrice) * position.amount / position.entryPrice;
      
      // Pozisyonu güncelle
      position.currentPrice = exitPrice;
      position.pnl = pnl;
      position.status = reason === 'EMERGENCY' ? 'EMERGENCY_CLOSED' : 'CLOSED';

      // Risk metriklerini güncelle
      this.riskMetrics.currentExposure -= position.amount;
      this.riskMetrics.totalPnL += pnl;
      this.riskMetrics.dailyPnL += pnl;
      
      if (pnl < 0n) {
        this.riskMetrics.lastLossTimestamp = Date.now();
        this.riskMetrics.consecutiveLosses++;
      } else {
        this.riskMetrics.consecutiveLosses = 0;
      }

      // Pozisyonu kaldır
      this.positions.delete(positionId);
      this.riskMetrics.activePositions = this.positions.size;

      this.logger.info('📉 Pozisyon kapatıldı', {
        positionId,
        pnl: ethers.formatEther(pnl),
        reason
      });

      // Veritabanına kaydet
      await this.savePosition(position);

      return pnl;

    } catch (error) {
      this.logger.error('Pozisyon kapatma hatası:', error);
      throw error;
    }
  }

  /**
   * Pozisyon Güncelle
   * Mevcut pozisyonun fiyatını günceller
   */
  async updatePosition(
    positionId: string,
    currentPrice: bigint
  ): Promise<void> {
    try {
      const position = this.positions.get(positionId);
      if (!position) {
        return;
      }

      const oldPrice = position.currentPrice;
      position.currentPrice = currentPrice;
      
      // P&L güncelle
      position.pnl = (currentPrice - position.entryPrice) * position.amount / position.entryPrice;

      // Stop loss kontrolü
      if (currentPrice <= position.stopLossPrice) {
        await this.closePosition(positionId, currentPrice, 'STOP_LOSS');
        
        await this.notificationService.sendAlert('STOP_LOSS_TRIGGERED', {
          positionId,
          token: position.token,
          loss: position.pnl
        });
      }

      // Maksimum zarar güncelle
      if (position.pnl < position.maxLoss) {
        position.maxLoss = position.pnl;
      }

    } catch (error) {
      this.logger.error('Pozisyon güncelleme hatası:', error);
    }
  }

  // ========================================
  // 📊 DURUM ve METRİK METODları
  // ========================================

  /**
   * Risk Metriklerini Al
   */
  getRiskMetrics(): RiskMetrics {
    return { ...this.riskMetrics };
  }

  /**
   * Aktif Pozisyonları Al
   */
  getActivePositions(): Position[] {
    return Array.from(this.positions.values());
  }

  /**
   * Pozisyon Detayını Al
   */
  getPosition(positionId: string): Position | undefined {
    return this.positions.get(positionId);
  }

  /**
   * Sağlık Kontrolü
   */
  async healthCheck(): Promise<{
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    details: string[];
    metrics: RiskMetrics;
  }> {
    const details: string[] = [];
    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';

    // Emergency stop kontrolü
    if (this.isEmergencyStop) {
      status = 'CRITICAL';
      details.push('Emergency stop aktif');
    }

    // Drawdown kontrolü
    if (this.riskMetrics.currentDrawdown > this.config.maxDrawdown * 0.8) {
      status = status === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
      details.push(`Yüksek drawdown: ${(this.riskMetrics.currentDrawdown * 100).toFixed(2)}%`);
    }

    // Consecutive loss kontrolü
    if (this.riskMetrics.consecutiveLosses >= 3) {
      status = status === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
      details.push(`Ardışık zarar: ${this.riskMetrics.consecutiveLosses}`);
    }

    return {
      status,
      details,
      metrics: this.riskMetrics
    };
  }

  // ========================================
  // 🔧 ÖZEL YARDIMCI METODlar
  // ========================================

  /**
   * Varsayılan Konfigürasyon
   */
  private getDefaultConfig(): PositionConfig {
    return {
      maxPositionSize: ethers.parseEther('1'),      // 1 ETH maksimum pozisyon
      maxDailyExposure: ethers.parseEther('5'),     // 5 ETH günlük maksimum risk
      maxConcurrentPositions: 3,                    // 3 eşzamanlı pozisyon
      stopLossThreshold: 0.05,                      // %5 stop loss
      maxDrawdown: 0.1,                             // %10 maksimum drawdown
      cooldownPeriod: 300000,                       // 5 dakika cooldown
      emergencyStopEnabled: true                    // Emergency stop aktif
    };
  }

  /**
   * Başlangıç Risk Metrikleri
   */
  private getInitialRiskMetrics(): RiskMetrics {
    return {
      currentExposure: 0n,
      dailyExposure: 0n,
      totalPnL: 0n,
      dailyPnL: 0n,
      currentDrawdown: 0,
      maxDrawdownToday: 0,
      activePositions: 0,
      riskScore: 0,
      lastLossTimestamp: 0,
      consecutiveLosses: 0
    };
  }

  /**
   * Risk Seviyesi Hesapla
   */
  private calculateRiskLevel(amount: bigint): 'LOW' | 'MEDIUM' | 'HIGH' {
    const utilizationRatio = Number(amount * 100n / this.config.maxPositionSize);
    
    if (utilizationRatio <= 30) return 'LOW';
    if (utilizationRatio <= 70) return 'MEDIUM';
    return 'HIGH';
  }

  /**
   * Pozisyonu Kaydet
   */
  private async savePosition(position: Position): Promise<void> {
    try {
      // Veritabanına kaydetme stub
      this.logger.debug('💾 Pozisyon kaydedildi', { positionId: position.id });
    } catch (error) {
      this.logger.error('Pozisyon kaydetme hatası:', error);
    }
  }

  /**
   * Emergency Stop Aktif Et
   */
  async activateEmergencyStop(reason: string): Promise<void> {
    this.isEmergencyStop = true;
    
    this.logger.warn('🚨 Emergency stop aktif edildi', { reason });
    
    // Tüm açık pozisyonları kapat
    for (const [positionId, position] of this.positions) {
      await this.closePosition(positionId, position.currentPrice, 'EMERGENCY');
    }

    await this.notificationService.sendAlert('EMERGENCY_STOP_ACTIVATED', {
      reason,
      timestamp: Date.now()
    });
  }

  /**
   * Emergency Stop Deaktif Et
   */
  async deactivateEmergencyStop(operatorId: string): Promise<void> {
    this.isEmergencyStop = false;
    
    this.logger.info('✅ Emergency stop deaktif edildi', { operatorId });
    
    await this.notificationService.sendAlert('EMERGENCY_STOP_DEACTIVATED', {
      operatorId,
      timestamp: Date.now()
    });
  }

  /**
   * Temizlik
   */
  async cleanup(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Açık pozisyonları kapat
    for (const [positionId, position] of this.positions) {
      await this.closePosition(positionId, position.currentPrice, 'SHUTDOWN');
    }

    this.logger.info('💼 Pozisyon yöneticisi temizlendi');
  }
}

export default PositionManager;
