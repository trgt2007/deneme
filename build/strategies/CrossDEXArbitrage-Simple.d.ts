/**
 * @title CrossDEXArbitrage - Simplified Version
 * @notice Basit Cross-DEX arbitraj stratejisi
 * @dev Ana hataları giderilmiş basitleştirilmiş versiyon
 */
interface SimpleCrossDEXConfig {
    minProfitMargin: number;
    maxSlippage: number;
    maxGasPrice: bigint;
}
interface SimpleCrossDEXOpportunity {
    id: string;
    tokenA: string;
    tokenB: string;
    buyPrice: bigint;
    sellPrice: bigint;
    expectedProfit: bigint;
    timestamp: number;
}
/**
 * @class SimpleCrossDEXArbitrage
 * @notice Basitleştirilmiş Cross-DEX arbitraj stratejisi
 */
export declare class SimpleCrossDEXArbitrage {
    private config;
    private isRunning;
    constructor(config: SimpleCrossDEXConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    scanOpportunities(): Promise<SimpleCrossDEXOpportunity[]>;
    executeOpportunity(opportunity: SimpleCrossDEXOpportunity): Promise<boolean>;
    getPerformance(): {
        isRunning: boolean;
        totalOpportunities: number;
        successfulExecutions: number;
        totalProfit: bigint;
    };
}
export default SimpleCrossDEXArbitrage;
//# sourceMappingURL=CrossDEXArbitrage-Simple.d.ts.map