/**
 * @title CrossDEXArbitrage-Mix (Basit Stub Versiyonu)
 * @author Arbitrage Bot System
 * @notice Bu dosya çok karmaşık olduğu için basitleştirildi
 * @dev CrossDEXArbitrage-Simple.ts dosyasını kullanın
 */
export interface CrossDEXArbitrageOpportunity {
    id: string;
    tokenA: string;
    tokenB: string;
    buyDEX: any;
    sellDEX: any;
    buyPrice: bigint;
    sellPrice: bigint;
    spread: number;
    expectedProfit: bigint;
    netProfit: bigint;
    optimalAmount: bigint;
    efficiency: number;
    confidence: number;
    timeWindow: number;
    riskScore: number;
    liquidityDepth: bigint;
    marketImpact: number;
    dexPairRating: number;
    historicalSuccess: number;
    timestamp: number;
    deadline: number;
}
export interface DEXInfo {
    name: string;
    handler: any;
    router: string;
    factory: string;
    fee: number;
    version: string;
    liquidity: bigint;
    volume24h: bigint;
    reliability: number;
}
export interface MarketConditions {
    volatility: number;
    gasPrice: bigint;
    networkCongestion: number;
    liquidityLevel: number;
}
/**
 * @class CrossDEXArbitrageMix
 * @notice Bu sınıf şu anda devre dışı - CrossDEXArbitrage-Simple kullanın
 */
export declare class CrossDEXArbitrageMix {
    private logger;
    private isActive;
    constructor(config?: any);
    /**
     * @notice Bu strateji devre dışı bırakıldı
     */
    start(): Promise<void>;
    stop(): Promise<void>;
    scanCrossDEXOpportunities(): Promise<CrossDEXArbitrageOpportunity[]>;
    executeCrossDEXOpportunity(opportunity: CrossDEXArbitrageOpportunity): Promise<any>;
    getStats(): any;
    private generateCrossDEXOpportunityId;
    private calculateOptimalAmount;
    private calculateCrossDEXProfit;
    private calculateCrossDEXRiskScore;
    private calculateCrossDEXEfficiency;
    private calculateMarketImpact;
    private calculateCrossDEXConfidence;
    private calculateTimeWindow;
    private calculateLiquidityDepth;
    private calculateDEXPairRating;
    private calculateHistoricalSuccess;
    private getDEXInfo;
}
export { CrossDEXArbitrageMix as CrossDEXArbitrageStrategy };
export default CrossDEXArbitrageMix;
//# sourceMappingURL=CrossDEXArbitrage-Mix.d.ts.map