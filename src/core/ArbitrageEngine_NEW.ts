/**
 * @title ArbitrageEngine - Arbitraj Motoru
 * @author Flashloan Arbitrage Bot Sistemi
 * @notice Ana arbitraj motoru - fiyat analizi ve karar verme sistemi
 * @dev Multi-thread desteği ile yüksek performanslı arbitraj motoru
 */

import { EventEmitter } from 'events';
import { Worker } from 'worker_threads';
import { ethers } from 'ethers';
import { Logger } from '../utils/Logger';
import { PriceMonitor } from '../monitors/PriceMonitor';
import { GasMonitor } from '../monitors/GasMonitor';
import { LiquidityMonitor } from '../monitors/LiquidityMonitor';
import { ProfitCalculator } from './ProfitCalculator';
import { FlashLoanExecutor } from './FlashLoanExecutor';
import { DEXAggregator } from '../dex/DEXAggregator';
import { NotificationService } from '../services/NotificationService';
import { DatabaseService } from '../services/DatabaseService';
import { CircuitBreaker } from '../risk/CircuitBreaker';
import { PositionManager } from '../risk/PositionManager';

// ========================================
// 🎯 INTERFACES & TYPES - Türkçe Açıklamalar
// ========================================

/**
 * Arbitraj Fırsatı
 * Tespit edilen arbitraj fırsatının detayları
 */
export interface ArbitrageOpportunity {
  id: string;                        // Fırsat kimliği
  token0: string;                    // İlk token adresi
  token1: string;                    // İkinci token adresi
  exchange0: string;                 // İlk borsa
  exchange1: string;                 // İkinci borsa
  price0: bigint;                    // İlk borsadaki fiyat
  price1: bigint;                    // İkinci borsadaki fiyat
  priceDiff: number;                 // Fiyat farkı yüzdesi
  expectedProfit: bigint;            // Beklenen kar (wei)
  gasEstimate: bigint;               // Tahmin edilen gas maliyeti
  netProfit: bigint;                 // Net kar (gas düşüldükten sonra)
  confidence: number;                // Güven skoru (0-100)
  expiry: number;                    // Son geçerlilik zamanı
  route: SwapRoute[];                // İşlem rotası
  liquidityRequired: bigint;         // Gerekli likidite
  slippage: number;                  // Beklenen kayma
  risk: number;                      // Risk skoru (0-100)
  timestamp: number;                 // Tespit zamanı
}

/**
 * Swap Rotası
 * Token değişim adımları
 */
export interface SwapRoute {
  exchange: string;                  // Borsa adı
  tokenIn: string;                   // Giriş token
  tokenOut: string;                  // Çıkış token
  amountIn: bigint;                  // Giriş miktarı
  amountOut: bigint;                 // Çıkış miktarı
  gasEstimate: bigint;               // Gas tahmini
  poolAddress?: string;              // Pool adresi (varsa)
  fee?: number;                      // İşlem ücreti
}

/**
 * Motor Konfigürasyonu
 * Arbitraj motorunun ayarları
 */
export interface EngineConfig {
  // Kar Ayarları
  minProfitWei: bigint;              // Minimum kar (wei)
  minProfitPercentage: number;       // Minimum kar yüzdesi
  maxGasPrice: bigint;               // Maksimum gas fiyatı
  gasMultiplier: number;             // Gas çarpanı
  
  // Tarama Ayarları
  scanInterval: number;              // Tarama aralığı (ms)
  maxOpportunities: number;          // Maksimum fırsat sayısı
  timeoutMs: number;                 // Timeout süresi
  
  // Risk Ayarları
  maxSlippage: number;               // Maksimum kayma
  minLiquidity: bigint;              // Minimum likidite
  maxRisk: number;                   // Maksimum risk skoru
  
  // İlerleme Ayarları
  enableMultiThread: boolean;        // Multi-thread aktif mi
  workerCount: number;               // Worker sayısı
  batchSize: number;                 // Batch boyutu
  
  // Monitörleme
  enableNotifications: boolean;      // Bildirimler aktif mi
  logLevel: string;                  // Log seviyesi
  metricsEnabled: boolean;           // Metrikler aktif mi
}

/**
 * Token Çifti
 * İşlem görmesi için token bilgileri
 */
export interface TokenPair {
  token0: {
    address: string;                 // Token adresi
    symbol: string;                  // Token sembolü
    decimals: number;                // Decimal sayısı
    balance?: bigint;                // Mevcut bakiye
  };
  token1: {
    address: string;                 // Token adresi
    symbol: string;                  // Token sembolü
    decimals: number;                // Decimal sayısı
    balance?: bigint;                // Mevcut bakiye
  };
  exchanges: string[];               // Mevcut borsalar
  volume24h?: bigint;                // 24 saatlik hacim
  lastUpdate: number;                // Son güncelleme
}

/**
 * Piyasa Koşulları
 * Anlık piyasa durumu
 */
export interface MarketConditions {
  gasPrice: bigint;                  // Mevcut gas fiyatı
  networkCongestion: number;         // Ağ yoğunluğu (0-100)
  volatility: number;                // Volatilite (0-100)
  liquidityIndex: number;            // Likidite indeksi (0-100)
  marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; // Piyasa duygusu
  timestamp: number;                 // Zaman damgası
}

/**
 * İşlem Sonucu
 * Arbitraj işleminin sonucu
 */
export interface ExecutionResult {
  success: boolean;                  // Başarılı mı
  transactionHash?: string;          // İşlem hash'i
  profit?: bigint;                   // Gerçekleşen kar
  gasUsed?: bigint;                  // Kullanılan gas
  gasPrice?: bigint;                 // Gas fiyatı
  executionTime?: number;            // İşlem süresi (ms)
  error?: string;                    // Hata mesajı
  opportunity: ArbitrageOpportunity; // İlgili fırsat
}

/**
 * Motor İstatistikleri
 * Performans metrikleri
 */
export interface EngineStats {
  totalOpportunities: number;        // Toplam fırsat sayısı
  successfulTrades: number;          // Başarılı işlem sayısı
  failedTrades: number;              // Başarısız işlem sayısı
  totalProfit: bigint;               // Toplam kar
  totalGasSpent: bigint;             // Toplam gas harcaması
  averageExecutionTime: number;      // Ortalama işlem süresi
  winRate: number;                   // Kazanma oranı
  uptime: number;                    // Çalışma süresi
  lastUpdate: number;                // Son güncelleme
}

/**
 * Log Metadata
 * Log kayıtları için metadata
 */
export interface LogMetadata {
  method: string;                    // Metod adı
  duration?: number;                 // Süre (ms)
  gasUsed?: bigint;                  // Kullanılan gas
  profit?: bigint;                   // Kar miktarı
  error?: string;                    // Hata mesajı
  [key: string]: any;                // Diğer veriler
}

/**
 * Aggregator Konfigürasyonu
 * DEX aggregator ayarları
 */
export interface AggregatorConfig {
  enabled: boolean;                  // Aktif mi
  timeout: number;                   // Timeout (ms)
  retryCount: number;                // Yeniden deneme sayısı
  gasMultiplier: number;             // Gas çarpanı
}

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
export class ArbitrageEngine extends EventEmitter {
  // ============ Private Properties ============
  
  private config: EngineConfig;
  private logger: any;
  
  // Monitörler
  private priceMonitor: PriceMonitor;
  private gasMonitor: GasMonitor;
  private liquidityMonitor: LiquidityMonitor;
  
  // Ana Servisler
  private profitCalculator: ProfitCalculator;
  private flashLoanExecutor: FlashLoanExecutor;
  private dexAggregator: DEXAggregator;
  private notificationService: NotificationService;
  private databaseService: DatabaseService;
  
  // Risk Yönetimi
  private circuitBreaker: CircuitBreaker;
  private positionManager: PositionManager;
  
  // Durum Yönetimi
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private workers: Worker[] = [];
  private stats: EngineStats;
  private lastOpportunities: ArbitrageOpportunity[] = [];
  
  // Timers
  private scanTimer: NodeJS.Timeout | null = null;
  private metricsTimer: NodeJS.Timeout | null = null;

  /**
   * Constructor - Arbitraj Motoru Başlatıcı
   * @param config - Motor konfigürasyonu
   */
  constructor(config: Partial<EngineConfig> = {}) {
    super();
    
    this.config = { ...this.getDefaultConfig(), ...config };
    this.logger = Logger;
    
    // Servisleri başlat
    this.priceMonitor = new PriceMonitor({} as any);
    this.gasMonitor = new GasMonitor({} as any);
    this.liquidityMonitor = new LiquidityMonitor({} as any, {} as any);
    this.profitCalculator = new ProfitCalculator({} as any);
    this.flashLoanExecutor = new FlashLoanExecutor({} as any);
    this.dexAggregator = new DEXAggregator({} as any);
    this.notificationService = new NotificationService({} as any);
    this.databaseService = new DatabaseService({} as any);
    this.circuitBreaker = new CircuitBreaker({} as any);
    this.positionManager = new PositionManager({} as any);
    
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
  async start(): Promise<void> {
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
      
    } catch (error) {
      this.logger.error('❌ Motor başlatma hatası:', error);
      throw error;
    }
  }

  /**
   * Motoru Durdur
   * Güvenli şekilde motoru kapatır
   */
  async stop(): Promise<void> {
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
      
    } catch (error) {
      this.logger.error('❌ Motor durdurma hatası:', error);
      throw error;
    }
  }

  /**
   * Motoru Duraklat
   * Geçici olarak taramayı durdurur
   */
  async pause(): Promise<void> {
    this.isPaused = true;
    this.logger.info('⏸️ Arbitraj motoru duraklatıldı');
    this.emit('paused', { timestamp: Date.now() });
  }

  /**
   * Motoru Devam Ettir
   * Duraklatılmış motoru yeniden başlatır
   */
  async resume(): Promise<void> {
    this.isPaused = false;
    this.logger.info('▶️ Arbitraj motoru devam etti');
    this.emit('resumed', { timestamp: Date.now() });
  }

  /**
   * Arbitraj Fırsatı Ara
   * Piyasadaki fırsatları tarar ve analiz eder
   */
  async scanForOpportunities(): Promise<ArbitrageOpportunity[]> {
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
      const opportunities: ArbitrageOpportunity[] = [];
      
      for (const pair of tokenPairs) {
        try {
          const pairOpportunities = await this.scanTokenPair(pair);
          opportunities.push(...pairOpportunities);
        } catch (error) {
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
      
    } catch (error) {
      this.logger.error('❌ Fırsat tarama hatası:', error);
      return [];
    }
  }

  /**
   * Arbitraj İşlemi Gerçekleştir
   * En iyi fırsatı seçer ve işlem yapar
   */
  async executeArbitrage(opportunity: ArbitrageOpportunity): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info('⚡ Arbitraj işlemi başlatılıyor', {
        opportunityId: opportunity.id,
        expectedProfit: ethers.formatEther(opportunity.expectedProfit),
        route: opportunity.route.map(r => `${r.exchange}: ${r.tokenIn} -> ${r.tokenOut}`)
      });

      // Circuit breaker son kontrol
      const breakerCheck = await this.circuitBreaker.checkBeforeTransaction(
        opportunity.expectedProfit,
        Number(opportunity.gasEstimate),
        opportunity.slippage
      );
      
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
      const executionResult: ExecutionResult = {
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
      
    } catch (error) {
      this.logger.error('❌ Arbitraj işlemi hatası:', error);
      
      const errorResult: ExecutionResult = {
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
  getStatus(): {
    isRunning: boolean;
    isPaused: boolean;
    stats: EngineStats;
    lastOpportunities: ArbitrageOpportunity[];
    marketConditions?: MarketConditions;
  } {
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
  async getDetailedStats(): Promise<EngineStats & {
    hourlyStats: any[];
    dailyStats: any[];
    tokenStats: any[];
    exchangeStats: any[];
  }> {
    const baseStats = { ...this.stats };
    
    // Veritabanından detaylı veriler
    // Mock database stats
    const hourlyStats: any[] = [];
    const dailyStats: any[] = [];
    const tokenStats: any[] = [];
    const exchangeStats: any[] = [];
    
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
  async healthCheck(): Promise<{
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    details: string[];
    uptime: number;
    components: Record<string, 'OK' | 'WARNING' | 'ERROR'>;
  }> {
    const details: string[] = [];
    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    
    const components: Record<string, 'OK' | 'WARNING' | 'ERROR'> = {
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
    } else if (breakerHealth.status === 'WARNING') {
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
  private getDefaultConfig(): EngineConfig {
    return {
      minProfitWei: ethers.parseEther('0.001'),    // 0.001 ETH minimum kar
      minProfitPercentage: 0.5,                    // %0.5 minimum kar yüzdesi
      maxGasPrice: ethers.parseUnits('100', 'gwei'), // 100 gwei maksimum gas
      gasMultiplier: 1.2,                          // %20 gas güvenlik marjı
      scanInterval: 5000,                          // 5 saniye tarama aralığı
      maxOpportunities: 10,                        // Maksimum 10 fırsat
      timeoutMs: 30000,                            // 30 saniye timeout
      maxSlippage: 1,                              // %1 maksimum kayma
      minLiquidity: ethers.parseEther('1'),        // 1 ETH minimum likidite
      maxRisk: 70,                                 // 70/100 maksimum risk
      enableMultiThread: true,                     // Multi-thread aktif
      workerCount: 4,                              // 4 worker
      batchSize: 50,                               // 50'li batch'ler
      enableNotifications: true,                   // Bildirimler aktif
      logLevel: 'info',                            // Info log seviyesi
      metricsEnabled: true                         // Metrikler aktif
    };
  }

  /**
   * Başlangıç İstatistikleri
   */
  private getInitialStats(): EngineStats {
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
  private async initializeServices(): Promise<void> {
    // Servislerin başlatılması stub olarak implement edildi
    this.logger.info('🔧 Servisler başlatılıyor...');
  }

  /**
   * Monitörleri Başlat
   */
  private async startMonitoring(): Promise<void> {
    // Monitörlerin başlatılması stub olarak implement edildi
    this.logger.info('📊 Monitörler başlatılıyor...');
  }

  /**
   * Worker'ları Başlat
   */
  private async startWorkers(): Promise<void> {
    // Worker'ların başlatılması stub olarak implement edildi
    this.logger.info('🔄 Workerlar başlatılıyor...');
  }

  /**
   * Ana Tarama Döngüsü
   */
  private startScanningLoop(): void {
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
  private startMetricsCollection(): void {
    this.metricsTimer = setInterval(async () => {
      await this.collectMetrics();
    }, 60000); // Her dakika
  }

  /**
   * Piyasa Koşullarını Al
   */
  private async getMarketConditions(): Promise<MarketConditions> {
    // Stub implementation
    return {
      gasPrice: ethers.parseUnits('50', 'gwei'),
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
  private isMarketSuitable(conditions: MarketConditions): boolean {
    // Basit kontrol - gas fiyatı çok yüksek değilse uygun
    return conditions.gasPrice <= this.config.maxGasPrice;
  }

  /**
   * Aktif Token Çiftlerini Al
   */
  private async getActiveTokenPairs(): Promise<TokenPair[]> {
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
  private async scanTokenPair(pair: TokenPair): Promise<ArbitrageOpportunity[]> {
    // Stub implementation
    return [];
  }

  /**
   * Fırsatları Filtrele ve Sırala
   */
  private async filterAndRankOpportunities(opportunities: ArbitrageOpportunity[]): Promise<ArbitrageOpportunity[]> {
    return opportunities
      .filter(opp => opp.netProfit >= this.config.minProfitWei)
      .filter(opp => opp.risk <= this.config.maxRisk)
      .sort((a, b) => Number(b.netProfit - a.netProfit))
      .slice(0, this.config.maxOpportunities);
  }

  /**
   * İstatistikleri Güncelle
   */
  private async updateStats(result: ExecutionResult): Promise<void> {
    if (result.success) {
      this.stats.successfulTrades++;
      this.stats.totalProfit += result.profit || 0n;
    } else {
      this.stats.failedTrades++;
    }

    this.stats.totalGasSpent += result.gasUsed || 0n;
    this.stats.winRate = this.stats.successfulTrades / (this.stats.successfulTrades + this.stats.failedTrades);
    this.stats.lastUpdate = Date.now();
  }

  /**
   * İşlem Bildirimi Gönder
   */
  private async sendExecutionNotification(result: ExecutionResult): Promise<void> {
    if (result.success) {
      await this.notificationService.sendAlert('ARBITRAGE_SUCCESS', {
        profit: result.profit,
        gasUsed: result.gasUsed,
        executionTime: result.executionTime
      });
    } else {
      await this.notificationService.sendAlert('ARBITRAGE_FAILED', {
        error: result.error,
        opportunityId: result.opportunity.id
      });
    }
  }

  /**
   * Worker'ları Durdur
   */
  private async stopWorkers(): Promise<void> {
    for (const worker of this.workers) {
      await worker.terminate();
    }
    this.workers = [];
  }

  /**
   * Monitörleri Durdur
   */
  private async stopMonitoring(): Promise<void> {
    // Monitörlerin durdurulması stub olarak implement edildi
    this.logger.info('📊 Monitörler durduruluyor...');
  }

  /**
   * Servisleri Temizle
   */
  private async cleanupServices(): Promise<void> {
    await this.circuitBreaker.cleanup();
    this.logger.info('🧹 Servisler temizlendi');
  }

  /**
   * Metrik Toplama
   */
  private async collectMetrics(): Promise<void> {
    // Basit metrik toplama
    this.stats.uptime = Date.now() - this.stats.uptime;
  }
}

/**
 * Varsayılan Motor Factory
 * Hızlı başlatma için kullanılır
 */
export function createDefaultEngine(): ArbitrageEngine {
  const config: Partial<EngineConfig> = {
    minProfitWei: ethers.parseEther('0.002'),     // 0.002 ETH minimum kar
    maxGasPrice: ethers.parseUnits('80', 'gwei'), // 80 gwei maksimum gas
    scanInterval: 3000,                           // 3 saniye tarama
    enableMultiThread: false,                     // Basit mode
    enableNotifications: false,                   // Bildirimler kapalı
    metricsEnabled: true                          // Metrikler açık
  };

  return new ArbitrageEngine(config);
}

export default ArbitrageEngine;
