import { JsonRpcProvider } from 'ethers';
interface MEVProtectionConfig {
    flashbots?: any;
    edenNetwork?: any;
    privateMempool?: any;
    gasStrategy?: any;
    monitoring?: any;
    fallback?: any;
    bundleOptimization?: any;
}
interface ProtectionOptions {
    maxSlippage?: number;
    timeout?: number;
    priorityFee?: bigint;
}
interface TransactionBundle {
    transactions: any[];
    blockNumber?: number;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
}
/**
 * MEV Koruma Servisi
 * Maximum Extractable Value (MEV) saldırılarına karşı koruma sağlar
 */
export declare class MEVProtectionService {
    private provider;
    private config;
    private isActive;
    constructor(provider: JsonRpcProvider, config?: MEVProtectionConfig);
    /**
     * MEV korumasını başlatır
     */
    start(): Promise<void>;
    /**
     * MEV korumasını durdurur
     */
    stop(): Promise<void>;
    /**
     * İşlemi MEV koruması ile gönderir
     */
    sendProtectedTransaction(transaction: any, options?: ProtectionOptions): Promise<string>;
    /**
     * İşlem bundlei oluşturur
     */
    createBundle(transactions: any[], targetBlock?: number): Promise<TransactionBundle>;
    /**
     * Bundle gönderir
     */
    submitBundle(bundle: TransactionBundle): Promise<string>;
    /**
     * MEV saldırısını tespit eder
     */
    detectMEVAttack(txHash: string): Promise<boolean>;
    /**
     * Koruma istatistiklerini döndürür
     */
    getProtectionStats(): any;
    /**
     * Private mempool kullanır
     */
    usePrivateMempool(): Promise<boolean>;
    /**
     * Flashbots bundlei gönderir
     */
    sendFlashbotsBundle(bundle: TransactionBundle): Promise<string>;
}
export {};
//# sourceMappingURL=MEVProtection_SIMPLE.d.ts.map