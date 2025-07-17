import { JsonRpcProvider } from 'ethers';
type BigNumberType = bigint;
type TransactionRequest = any;
interface MEVProtectionConfig {
    flashbots: any;
    edenNetwork: any;
    privateMempool: any;
    gasStrategy: any;
    monitoring: any;
    fallback: any;
    bundleOptimization: any;
}
export declare class MEVProtectionService {
    private logger;
    private config;
    private provider;
    private signer;
    private flashbotsProvider;
    private edenProvider;
    private privateMempoolProviders;
    private activeBundles;
    private pendingTransactions;
    private mevDetectionHistory;
    private stats;
    private isRunning;
    private monitoringInterval;
    private bundleCheckInterval;
    private gasTracker;
    constructor(config: MEVProtectionConfig, provider: JsonRpcProvider, signer: any);
    start(): Promise<void>;
    stop(): Promise<void>;
    submitProtectedTransaction(txRequest: TransactionRequest, options?: any): Promise<{
        txHash?: string;
        bundleId?: string;
        status: string;
        protection: string;
    }>;
    getOptimalGasPrice(): Promise<{
        baseFee: BigNumberType;
        priorityFee: BigNumberType;
        maxFee: BigNumberType;
        strategy: string;
    }>;
    private initializeFlashbots;
    private initializeEdenNetwork;
    private initializePrivateMempools;
    private initializeGasTracking;
    private startMEVMonitoring;
    private startBundleMonitoring;
    private submitPublicTransaction;
    private submitWithBasicProtection;
    private submitFlashbotsBundle;
    private submitEdenTransaction;
    private submitPrivateMempoolTransaction;
    private assessMEVRisk;
    private selectOptimalProtectionStrategy;
    private updateGasTracking;
    private assessNetworkCongestion;
    private monitorPendingTransactions;
    private cleanupOldDetections;
    private checkBundleStatus;
    private retryFailedBundles;
    private cleanupExpiredBundles;
    private cancelPendingBundles;
    getMEVProtectionStats(): any;
    getActiveBundles(): any[];
    getMEVDetectionHistory(): any[];
    healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        isRunning: boolean;
        flashbotsConnected: boolean;
        edenConnected: boolean;
        privateMempoolConnected: number;
        protectionRate: number;
        activeBundles: number;
        mevAttacksDetected: number;
    }>;
}
export declare class MEVProtection {
    private config;
    constructor(config: any);
    sendProtectedTransaction(tx: any): Promise<any>;
}
export {};
//# sourceMappingURL=MEVProtection_fixed.d.ts.map