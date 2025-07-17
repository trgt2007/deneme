import { ethers } from 'ethers';
import { Logger } from '../utils/Logger';
import { NotificationService } from '../services/NotificationService';
import { DatabaseService } from '../services/DatabaseService';

// ========================================
// 🎯 INTERFACES & TYPES - Türkçe Açıklamalar
// ========================================

/**
 * Circuit Breaker Konfigürasyonu
 * Sistem güvenlik ayarları ve eşik değerleri
 */
interface CircuitBreakerConfig {
  // Zarar Eşikleri
  maxLossPercentage: number;          // Maksimum zarar yüzdesi (0.05 = %5)
  maxConsecutiveLosses: number;       // Ardışık maksimum zarar sayısı
  maxLossAmountETH: bigint;          // ETH cinsinden maksimum zarar miktarı
  maxDrawdownPercentage: number;      // Maksimum düşüş yüzdesi (0.1 = %10)
  
  // Zaman Bazlı Eşikler
  maxLossesPerHour: number;          // Saatte maksimum zarar sayısı
  maxLossesPerDay: number;           // Günde maksimum zarar sayısı
  
  // Piyasa Koşulları
  maxGasPriceGwei: number;           // Maksimum gas fiyatı (gwei)
  minLiquidityETH: bigint;           // Minimum gerekli likidite
  maxSlippagePercent: number;        // Maksimum kayma toleransı
  
  // Kurtarma Ayarları
  autoRecoveryEnabled: boolean;       // Otomatik kurtarma etkin mi
  recoveryDelayMinutes: number;      // Kurtarma denemesi öncesi bekleme
  manualOverrideRequired: boolean;   // Manuel onay gerekli mi
  
  // İzleme
  checkIntervalMs: number;           // Kontrol aralığı (ms)
  alertThresholdPercent: number;     // Uyarı eşiği yüzdesi
}

/**
 * Circuit Breaker Durumu
 * Sistemin anlık durumu ve metrikleri
 */
interface CircuitBreakerState {
  isTripped: boolean;                // Devre kesici aktif mi
  tripReason: string;                // Tetikleme nedeni
  tripTimestamp: number;             // Tetikleme zamanı
  expectedRecoveryTime: number;      // Beklenen kurtarma zamanı
  manualOverride: boolean;           // Manuel geçersiz kılma
  
  // Anlık Metrikler
  currentLossPercentage: number;     // Mevcut zarar yüzdesi
  consecutiveLosses: number;         // Ardışık zarar sayısı
  totalLossAmountETH: bigint;        // Bugünkü toplam zarar (ETH)
  currentDrawdown: number;           // Mevcut düşüş yüzdesi
  lossesThisHour: number;           // Bu saatteki zarar sayısı
  lossesToday: number;              // Bugünkü toplam zarar sayısı
  
  // Piyasa Koşulları
  currentGasPrice: number;           // Mevcut gas fiyatı (gwei)
  currentLiquidity: bigint;          // Mevcut mevcut likidite
  currentSlippage: number;           // Mevcut ortalama kayma
  
  // Kurtarma Durumu
  recoveryAttempts: number;          // Kurtarma deneme sayısı
  lastRecoveryAttempt: number;       // Son kurtarma denemesi zamanı
  canAutoRecover: boolean;           // Otomatik kurtarma yapılabilir mi
}

/**
 * Tetikleme Koşulu
 * Circuit breaker tetikleme nedenini detaylandırır
 */
interface TripCondition {
  type: string;                      // Koşul tipi
  description: string;               // Açıklama
  threshold: number | bigint;        // Eşik değer
  currentValue: number | bigint;     // Mevcut değer
  severity: 'WARNING' | 'CRITICAL' | 'EMERGENCY'; // Önem derecesi
  timestamp: number;                 // Zaman damgası
}

/**
 * Kurtarma Koşulu
 * Sistemin normale dönmesi için gereken koşullar
 */
interface RecoveryCondition {
  type: string;                      // Koşul tipi
  description: string;               // Açıklama
  required: boolean;                 // Zorunlu mu
  met: boolean;                      // Karşılandı mı
  value?: number | bigint;           // Değer
  lastChecked: number;               // Son kontrol zamanı
}

/**
 * Circuit Breaker Metrikleri
 * Performans ve istatistik bilgileri
 */
interface CircuitBreakerMetrics {
  totalTrips: number;                // Toplam tetikleme sayısı
  avgTripDuration: number;           // Ortalama tetikleme süresi
  successfulRecoveries: number;      // Başarılı kurtarma sayısı
  failedRecoveries: number;          // Başarısız kurtarma sayısı
  preventedLosses: bigint;           // Önlenen zarar miktarı
  uptime: number;                    // Sistem çalışma süresi
}

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
export class CircuitBreaker {
  private logger: any;
  private notificationService: NotificationService;
  private databaseService: DatabaseService;
  private config: CircuitBreakerConfig;
  
  // Durum Yönetimi
  private state: CircuitBreakerState;
  private tripConditions: TripCondition[] = [];
  private recoveryConditions: RecoveryCondition[] = [];
  
  // İzleme Sistemleri
  private monitoringInterval: NodeJS.Timeout | null = null;
  private recoveryInterval: NodeJS.Timeout | null = null;
  
  // Geçmiş Veriler
  private lossHistory: Array<{ 
    timestamp: number; 
    amount: bigint; 
    percentage: number 
  }> = [];
  
  private gasHistory: Array<{ 
    timestamp: number; 
    gasPrice: number 
  }> = [];
  
  private slippageHistory: Array<{ 
    timestamp: number; 
    slippage: number 
  }> = [];

  /**
   * Constructor - Circuit Breaker Başlatıcı
   * @param config - Devre kesici konfigürasyonu
   */
  constructor(config: CircuitBreakerConfig = {} as any) {
    this.logger = Logger;
    this.notificationService = new NotificationService();
    this.databaseService = new DatabaseService({} as any);
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
  async checkBeforeTransaction(
    amount: bigint,
    gasPrice: number,
    slippage: number
  ): Promise<{ allowed: boolean; reason?: string }> {
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
    } catch (error) {
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
  async checkAfterTransaction(result: {
    success: boolean;
    profit: bigint;
    gasUsed: bigint;
    gasPrice: number;
    slippage: number;
  }): Promise<void> {
    try {
      // Zarar durumunda analiz
      if (!result.success || result.profit < 0n) {
        await this.recordLoss(Math.abs(Number(result.profit)));
        await this.checkLossThresholds();
      } else {
        // Başarılı işlem - ardışık zarar sayacını sıfırla
        this.state.consecutiveLosses = 0;
      }

      // Gas ve kayma geçmişini güncelle
      this.updateMarketHistory(result.gasPrice, result.slippage);
      
      // Durumu kaydet
      await this.saveState();
      
    } catch (error) {
      this.logger.error('İşlem sonrası kontrol hatası:', error);
    }
  }

  /**
   * Circuit Breaker Tetikleme
   * Güvenlik eşiği aşıldığında sistemi durdurur
   */
  async trip(reason: string, details: string): Promise<void> {
    try {
      this.state.isTripped = true;
      this.state.tripReason = `${reason}: ${details}`;
      this.state.tripTimestamp = Date.now();
      this.state.expectedRecoveryTime = Date.now() + (this.config.recoveryDelayMinutes * 60 * 1000);

      // Tetikleme koşulunu kaydet
      const condition: TripCondition = {
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

      // Bildirim gönder
      await this.notificationService.sendAlert('CIRCUIT_BREAKER_TRIP', {
        reason: this.state.tripReason,
        timestamp: this.state.tripTimestamp
      });

      // Durumu kaydet
      await this.saveState();

      // Kurtarma sürecini başlat
      if (this.config.autoRecoveryEnabled) {
        this.startRecoveryProcess();
      }

    } catch (error) {
      this.logger.error('Circuit breaker tetikleme hatası:', error);
    }
  }

  /**
   * Manuel Reset
   * Operatör tarafından manuel olarak sistemi yeniden başlatır
   */
  async manualReset(operatorId: string, reason: string): Promise<boolean> {
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

      // Bildirim gönder
      await this.notificationService.sendAlert('CIRCUIT_BREAKER_RESET', {
        operator: operatorId,
        reason: reason,
        timestamp: Date.now()
      });

      // Durumu kaydet
      await this.saveState();

      this.logger.info('✅ Circuit Breaker manuel olarak sıfırlandı');
      return true;

    } catch (error) {
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
  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  /**
   * Konfigürasyon Bilgisi
   */
  getConfig(): CircuitBreakerConfig {
    return { ...this.config };
  }

  /**
   * Detaylı Metrikler
   */
  async getMetrics(): Promise<CircuitBreakerMetrics> {
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
  async healthCheck(): Promise<{
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    details: string[];
    uptime: number;
  }> {
    const details: string[] = [];
    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';

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
  private getDefaultConfig(): CircuitBreakerConfig {
    return {
      maxLossPercentage: 0.05,        // %5 maksimum zarar
      maxConsecutiveLosses: 3,        // 3 ardışık zarar
      maxLossAmountETH: ethers.parseEther('0.1'), // 0.1 ETH maksimum zarar
      maxDrawdownPercentage: 0.1,     // %10 maksimum düşüş
      maxLossesPerHour: 10,           // Saatte 10 zarar
      maxLossesPerDay: 50,            // Günde 50 zarar
      maxGasPriceGwei: 100,           // 100 gwei maksimum gas
      minLiquidityETH: ethers.parseEther('10'), // 10 ETH minimum likidite
      maxSlippagePercent: 2,          // %2 maksimum kayma
      autoRecoveryEnabled: true,      // Otomatik kurtarma aktif
      recoveryDelayMinutes: 15,       // 15 dakika kurtarma gecikmesi
      manualOverrideRequired: false,  // Manuel onay gerekmez
      checkIntervalMs: 30000,         // 30 saniye kontrol aralığı
      alertThresholdPercent: 0.8      // %80 uyarı eşiği
    };
  }

  /**
   * Başlangıç Durumu
   */
  private getInitialState(): CircuitBreakerState {
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
  private async recordLoss(amount: number): Promise<void> {
    const lossRecord = {
      timestamp: Date.now(),
      amount: BigInt(amount),
      percentage: (amount / Number(ethers.parseEther('1'))) * 100
    };

    this.lossHistory.push(lossRecord);
    this.state.consecutiveLosses++;
    this.state.totalLossAmountETH += lossRecord.amount;

    // Son 1 saat içindeki zararları say
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.state.lossesThisHour = this.lossHistory.filter(
      loss => loss.timestamp > oneHourAgo
    ).length;

    // Bugünkü zararları say
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    this.state.lossesToday = this.lossHistory.filter(
      loss => loss.timestamp > startOfDay
    ).length;
  }

  /**
   * Zarar Eşiklerini Kontrol Et
   */
  private async checkLossThresholds(): Promise<void> {
    // Ardışık zarar kontrolü
    if (this.state.consecutiveLosses >= this.config.maxConsecutiveLosses) {
      await this.trip('CONSECUTIVE_LOSSES', 
        `${this.state.consecutiveLosses} ardışık zarar`);
      return;
    }

    // Saatlik zarar kontrolü
    if (this.state.lossesThisHour >= this.config.maxLossesPerHour) {
      await this.trip('HOURLY_LOSS_LIMIT', 
        `Bu saatte ${this.state.lossesThisHour} zarar`);
      return;
    }

    // Günlük zarar kontrolü
    if (this.state.lossesToday >= this.config.maxLossesPerDay) {
      await this.trip('DAILY_LOSS_LIMIT', 
        `Bugün ${this.state.lossesToday} zarar`);
      return;
    }

    // Toplam zarar miktarı kontrolü
    if (this.state.totalLossAmountETH >= this.config.maxLossAmountETH) {
      await this.trip('TOTAL_LOSS_AMOUNT', 
        `Toplam zarar: ${ethers.formatEther(this.state.totalLossAmountETH)} ETH`);
      return;
    }
  }

  /**
   * Piyasa Geçmişini Güncelle
   */
  private updateMarketHistory(gasPrice: number, slippage: number): void {
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
  private startRecoveryProcess(): void {
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
  private async attemptRecovery(): Promise<void> {
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
        
        await this.notificationService.sendAlert('CIRCUIT_BREAKER_RECOVERED', {
          recoveryAttempts: this.state.recoveryAttempts,
          timestamp: Date.now()
        });

        await this.saveState();
      }

    } catch (error) {
      this.logger.error('Kurtarma denemesi hatası:', error);
    }
  }

  /**
   * Kurtarma Koşullarını Kontrol Et
   */
  private async checkRecoveryConditions(): Promise<boolean> {
    // Basit kurtarma koşulu - belirli süre geçtikten sonra
    const timeSinceTrip = Date.now() - this.state.tripTimestamp;
    const minRecoveryTime = this.config.recoveryDelayMinutes * 60 * 1000;
    
    return timeSinceTrip >= minRecoveryTime;
  }

  /**
   * Durumu Kaydet
   */
  private async saveState(): Promise<void> {
    try {
      // Mock implementation - saveCircuitBreakerState method
      console.log('Circuit breaker state saved:', this.state);
    } catch (error) {
      this.logger.error('Durum kaydetme hatası:', error);
    }
  }

  /**
   * Temizlik - Sistem kapatılırken çağrılır
   */
  async cleanup(): Promise<void> {
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

/**
 * Varsayılan Circuit Breaker Factory
 * Hızlı başlatma için kullanılır
 */
export function createDefaultCircuitBreaker(): CircuitBreaker {
  const defaultConfig: CircuitBreakerConfig = {
    maxLossPercentage: 0.03,          // %3 maksimum zarar
    maxConsecutiveLosses: 2,          // 2 ardışık zarar
    maxLossAmountETH: ethers.parseEther('0.05'), // 0.05 ETH maksimum zarar
    maxDrawdownPercentage: 0.08,      // %8 maksimum düşüş
    maxLossesPerHour: 8,              // Saatte 8 zarar
    maxLossesPerDay: 30,              // Günde 30 zarar
    maxGasPriceGwei: 80,              // 80 gwei maksimum gas
    minLiquidityETH: ethers.parseEther('5'), // 5 ETH minimum likidite
    maxSlippagePercent: 1.5,          // %1.5 maksimum kayma
    autoRecoveryEnabled: true,        // Otomatik kurtarma aktif
    recoveryDelayMinutes: 10,         // 10 dakika kurtarma gecikmesi
    manualOverrideRequired: false,    // Manuel onay gerekmez
    checkIntervalMs: 20000,           // 20 saniye kontrol aralığı
    alertThresholdPercent: 0.75       // %75 uyarı eşiği
  };

  return new CircuitBreaker(defaultConfig);
}

export default CircuitBreaker;
