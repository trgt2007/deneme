/**
 * @title SushiswapHandler
 * @author Arbitrage Bot System
 * @notice Sushiswap V2 ve V3 protokol entegrasyonu
 * @dev Quote, swap, pool data ve event monitoring fonksiyonları
 */
import { SwapParams, QuoteResult, PoolReserves, SushiswapConfig, PoolMetrics, BentoBoxData } from '../types';
/**
 * @class SushiswapHandler
 * @notice Sushiswap handler sınıfı
 * @dev V2 ve V3 (Trident) desteği ile full entegrasyon
 */
export declare class SushiswapHandler {
    /**
     * @notice Handler konfigürasyonu
     */
    private config;
    /**
     * @notice Logger instance
     */
    private logger;
    /**
     * @notice Math helpers
     */
    private mathHelpers;
    /**
     * @notice Ethereum provider
     */
    private provider;
    /**
     * @notice V2 Factory contract instance
     */
    private v2Factory;
    /**
     * @notice V2 Router contract instance
     */
    private v2Router;
    /**
     * @notice V3 Factory contract instance (Trident)
     */
    private v3Factory;
    /**
     * @notice BentoBox contract instance
     */
    private bentoBox;
    /**
     * @notice Pool contract cache
     */
    private poolCache;
    /**
     * @notice Pool info cache
     */
    private poolInfoCache;
    /**
     * @notice BentoBox balance cache
     */
    private bentoBalanceCache;
    /**
     * @notice Event listeners
     */
    private eventListeners;
    /**
     * @notice Performance metrics
     */
    private metrics;
    /**
     * @notice Trident pool type mapping
     */
    private tridentPoolTypes;
    /**
     * @notice SushiswapHandler constructor
     * @param config Handler konfigürasyonu
     */
    constructor(config: SushiswapConfig);
    /**
     * @notice Token çifti için fiyat teklifi alır
     * @param tokenIn Giriş token adresi
     * @param tokenOut Çıkış token adresi
     * @param amountIn Giriş miktarı
     * @param useV3 V3 kullanılsın mı (opsiyonel)
     * @return Quote result
     */
    getQuote(tokenIn: string, tokenOut: string, amountIn: bigint, useV3?: boolean): Promise<QuoteResult | null>;
    /**
     * @notice V2 quote alır
     * @param tokenIn Giriş token adresi
     * @param tokenOut Çıkış token adresi
     * @param amountIn Giriş miktarı
     * @return Quote result
     */
    private getV2Quote;
    /**
     * @notice V3 quote alır (Trident)
     * @param tokenIn Giriş token adresi
     * @param tokenOut Çıkış token adresi
     * @param amountIn Giriş miktarı
     * @return Quote result
     */
    private getV3Quote;
    /**
     * @notice Multi-hop quote alır
     * @param path Token path
     * @param amountIn Giriş miktarı
     * @param useV3 V3 kullanılsın mı
     * @return Quote result
     */
    getQuoteMultihop(path: string[], amountIn: bigint, useV3?: boolean): Promise<QuoteResult | null>;
    /**
     * @notice Swap parametreleri oluşturur
     * @param params Swap parameters
     * @return Encoded swap data
     */
    buildSwapTransaction(params: SwapParams): Promise<string>;
    /**
     * @notice V2 swap transaction oluşturur
     */
    private buildV2SwapTransaction;
    /**
     * @notice V3 swap transaction oluşturur
     */
    private buildV3SwapTransaction;
    /**
     * @notice Pool adresi döndürür
     * @param token0 İlk token
     * @param token1 İkinci token
     * @param useV3 V3 kullanılsın mı
     * @return Pool address
     */
    getPoolAddress(token0: string, token1: string, useV3?: boolean): Promise<string>;
    /**
     * @notice Pool rezervlerini döndürür
     * @param token0 İlk token
     * @param token1 İkinci token
     * @param useV3 V3 kullanılsın mı
     * @return Pool reserves
     */
    getReserves(token0: string, token1: string, useV3?: boolean): Promise<PoolReserves | null>;
    /**
     * @notice V2 rezervlerini döndürür
     */
    private getV2Reserves;
    /**
     * @notice V3 rezervlerini döndürür
     */
    private getV3Reserves;
    /**
     * @notice Pool fee'sini döndürür
     * @param poolAddress Pool adresi
     * @return Fee amount
     */
    getPoolFee(poolAddress: string): Promise<number>;
    /**
     * @notice 24 saatlik volume döndürür
     * @param token0 İlk token
     * @param token1 İkinci token
     * @param useV3 V3 kullanılsın mı
     * @return 24h volume
     */
    get24hVolume(token0: string, token1: string, useV3?: boolean): Promise<bigint>;
    /**
     * @notice Total supply döndürür
     * @param token0 İlk token
     * @param token1 İkinci token
     * @param useV3 V3 kullanılsın mı
     * @return Total supply
     */
    getTotalSupply(token0: string, token1: string, useV3?: boolean): Promise<bigint>;
    /**
     * @notice BentoBox balance'ını döndürür
     * @param token Token adresi
     * @param user User adresi
     * @return BentoBox balance data
     */
    getBentoBoxBalance(token: string, user: string): Promise<BentoBoxData | null>;
    /**
     * @notice Event'lere subscribe olur
     * @param callback Event callback
     * @return Unsubscribe function
     */
    subscribeToEvents(callback: (event: any) => void): Promise<() => void>;
    /**
     * @notice Contract'ları initialize eder
     */
    private initializeContracts;
    /**
     * @notice V2 pair contract döndürür
     */
    private getV2Pair;
    /**
     * @notice V2 pair olup olmadığını kontrol eder
     */
    private isV2Pair;
    /**
     * @notice Amount out hesaplar (V2)
     */
    private getAmountOut;
    /**
     * @notice V2 price impact hesaplar
     */
    private calculateV2PriceImpact;
    /**
     * @notice En iyi V3 pool'u bulur
     */
    private findBestV3Pool;
    /**
     * @notice Pool type döndürür
     */
    private getPoolType;
    /**
     * @notice Constant product pool quote
     */
    private getConstantProductQuote;
    /**
     * @notice Concentrated liquidity pool quote
     */
    private getConcentratedQuote;
    /**
     * @notice Stable pool quote
     */
    private getStableQuote;
    /**
     * @notice Hybrid pool quote
     */
    private getHybridQuote;
    /**
     * @notice Get reserves for different pool types
     */
    private getConstantProductReserves;
    private getConcentratedReserves;
    private getStableReserves;
    /**
     * @notice Update quote metrics
     */
    private updateQuoteMetrics;
    /**
     * @notice Get pool metrics
     */
    getPoolMetrics(poolAddress: string): Promise<PoolMetrics>;
}
//# sourceMappingURL=SushiswapHandler.d.ts.map