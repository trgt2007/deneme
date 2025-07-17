/**
 * @title MEVProtection (Basit Stub Versiyonu)
 * @author Arbitrage Bot System
 * @notice MEV koruması - Basitleştirilmiş versiyon
 * @dev Karmaşık MEV koruma özellikleri geçici olarak devre dışı
 */
import { JsonRpcProvider } from 'ethers';
interface MEVProtectionConfig {
    enabled: boolean;
    maxGasPriceGwei: number;
    slippageProtection: number;
    flashbotsEnabled: boolean;
    privateMempoolEnabled: boolean;
}
/**
 * @class MEVProtection
 * @notice MEV koruması - Basit stub implementasyonu
 */
export declare class MEVProtection {
    private logger;
    private config;
    private provider;
    private isActive;
    constructor(provider: JsonRpcProvider, config?: Partial<MEVProtectionConfig>);
    /**
     * @notice MEV korumasını başlatır
     */
    initialize(): Promise<void>;
    /**
     * @notice Transaction'ı MEV koruması ile gönderir (stub)
     */
    sendTransaction(transaction: any): Promise<any>;
    /**
     * @notice MEV risk analizi yapar (stub)
     */
    analyzeMEVRisk(transaction: any): Promise<any>;
    /**
     * @notice Optimal gas price hesaplar (stub)
     */
    getOptimalGasPrice(): Promise<bigint>;
    /**
     * @notice MEV bot aktivitesini monitör eder (stub)
     */
    monitorMEVActivity(): Promise<any>;
    /**
     * @notice Slippage koruması uygular (stub)
     */
    applySlippageProtection(expectedAmount: bigint, actualAmount: bigint): Promise<boolean>;
    /**
     * @notice Health check
     */
    healthCheck(): Promise<boolean>;
    /**
     * @notice İstatistikler
     */
    getStats(): any;
    /**
     * @notice MEV korumasını durdurur
     */
    stop(): Promise<void>;
    submitTransaction(tx: any): Promise<any>;
    enableFlashbots(): Promise<void>;
    enablePrivateMempool(): Promise<void>;
}
export default MEVProtection;
//# sourceMappingURL=MEVProtection.d.ts.map