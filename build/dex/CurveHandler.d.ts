/**
 * @title CurveHandler (Basit Stub Versiyonu)
 * @author Arbitrage Bot System
 * @notice Curve Finance protokol entegrasyonu - Basitleştirilmiş versiyon
 * @dev Karmaşık implementasyon geçici olarak devre dışı
 */
import { JsonRpcProvider } from 'ethers';
import { PoolInfo, SwapParams, QuoteResult, PoolReserves, CurveConfig, CurvePoolInfo, SwapResult } from '../types';
/**
 * @class CurveHandler
 * @notice Curve Finance handler - Basit stub implementasyonu
 */
export declare class CurveHandler {
    private logger;
    private provider;
    private config;
    private isActive;
    constructor(provider: JsonRpcProvider, config: CurveConfig);
    /**
     * @notice CurveHandler'ı başlatır (stub)
     */
    initialize(): Promise<void>;
    /**
     * @notice Quote alır (basit implementasyon)
     */
    getQuote(tokenIn: string, tokenOut: string, amountIn: bigint, poolAddress?: string): Promise<QuoteResult | null>;
    /**
     * @notice Swap gerçekleştirir (stub)
     */
    executeSwap(params: SwapParams): Promise<SwapResult>;
    /**
     * @notice Pool bilgisi alır (stub)
     */
    getPoolInfo(poolAddress: string): Promise<CurvePoolInfo | null>;
    /**
     * @notice Pool reserves alır (stub)
     */
    getPoolReserves(poolAddress: string): Promise<PoolReserves | null>;
    /**
     * @notice En iyi pool bulur (stub)
     */
    findBestPool(tokenIn: string, tokenOut: string): Promise<string | null>;
    /**
     * @notice Pool bilgilerini listeler (stub)
     */
    getAllPools(): Promise<PoolInfo[]>;
    /**
     * @notice Health check (stub)
     */
    healthCheck(): Promise<boolean>;
    /**
     * @notice İstatistikler (stub)
     */
    getStats(): any;
    getStableSwapQuote(): Promise<QuoteResult | null>;
    getCryptoSwapQuote(): Promise<QuoteResult | null>;
    getMetaPoolQuote(): Promise<QuoteResult | null>;
}
export default CurveHandler;
//# sourceMappingURL=CurveHandler.d.ts.map