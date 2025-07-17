/**
 * @title Type Definitions
 * @author Arbitrage Bot System
 * @notice Tüm type tanımlamaları
 */
import { JsonRpcProvider } from 'ethers';
export interface Token {
    address: string;
    symbol: string;
    decimals: number;
    name?: string;
}
export interface TokenPair {
    token0: Token;
    token1: Token;
    fee?: number;
}
export interface ArbitrageOpportunity {
    id: string;
    timestamp: number;
    deadline: number;
    token: string;
    tokenIn: Token;
    tokenOut: Token;
    amountIn: bigint;
    expectedAmountOut: bigint;
    expectedProfit: bigint;
    estimatedGas: bigint;
    routes: SwapRoute[];
    confidence: number;
}
export interface SwapRoute {
    dex: string;
    dexName: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    amountOut: bigint;
    minimumAmountOut: bigint;
    fee: number;
    slippage: number;
    pool?: string;
    sqrtPriceLimitX96?: bigint;
    fromIndex?: number;
    toIndex?: number;
    executor?: string;
    executorData?: string;
    poolId?: string;
    userData?: string;
}
export interface EngineConfig {
    minProfitThreshold: bigint;
    maxGasPrice: bigint;
    maxConcurrentOpportunities: number;
    maxSlippage: number;
    minPriceSpreadBasisPoints: number;
    highDivergenceThreshold: number;
    numWorkers?: number;
    defaultPairs?: TokenPair[];
    priceMonitorConfig: any;
    gasMonitorConfig: any;
    liquidityMonitorConfig: any;
    profitCalculatorConfig: any;
    flashLoanConfig: any;
    dexConfig: any;
    notificationConfig: any;
    databaseConfig: any;
    circuitBreakerConfig: any;
    positionManagerConfig: any;
}
export interface MarketConditions {
    gasPrice: bigint;
    blockNumber: number;
    timestamp: number;
    volatilityIndex: number;
    liquidityDepth: Map<string, number>;
}
export interface ExecutionResult {
    success: boolean;
    opportunity: ArbitrageOpportunity;
    profit?: bigint;
    gasUsed?: bigint;
    gasPrice?: bigint;
    gasCost?: bigint;
    txHash?: string;
    blockNumber?: number;
    executionTime?: number;
    executionId?: string;
    error?: Error;
}
export interface EngineStats {
    startTime: number;
    runtime?: number;
    opportunitiesFound: number;
    opportunitiesExecuted: number;
    totalProfit: bigint;
    totalGasUsed: bigint;
    successRate: number;
    averageProfit: bigint;
    lastOpportunityTime: number;
}
export interface LogMetadata {
    [key: string]: any;
}
export interface LoggerConfig {
    level: string;
    enableConsole: boolean;
    enableFile: boolean;
    enableRotation?: boolean;
    logDirectory?: string;
    maxFileSize?: string;
    maxFiles?: string;
    datePattern?: string;
    zippedArchive?: boolean;
    silent?: boolean;
    handleExceptions?: boolean;
    handleRejections?: boolean;
    exitOnError?: boolean;
    format?: any;
    transports?: any[];
    defaultMeta?: any;
    levels?: any;
    exceptionHandlers?: any[];
    rejectionHandlers?: any[];
}
export interface AggregatorConfig {
    maxConcurrentQuotes: number;
    quoteTimeout: number;
    retryAttempts: number;
    circuitBreakerThreshold: number;
    enabledDEXes: string[];
    slippageTolerance: number;
    gasEstimateBuffer: number;
    priceImpactThreshold: number;
    performanceWindowMs: number;
    cacheEnabled: boolean;
    cacheTTL: number;
    enableFailover: boolean;
}
export interface FlashLoanConfig {
    privateKey?: string;
    alchemyApiKey?: string;
    network?: string;
    customProvider?: any;
    flashbotsRpc?: string;
    databaseConfig?: any;
    gasStrategy?: GasStrategy;
    useMevProtection?: boolean;
    requiredConfirmations?: number;
}
export interface TransactionStatus {
    executionId: string;
    status: 'pending' | 'sent' | 'confirming' | 'confirmed' | 'failed';
    txHash?: string;
    retryCount?: number;
    createdAt: number;
    lastUpdate: number;
}
export declare enum GasStrategy {
    AGGRESSIVE = "aggressive",
    NORMAL = "normal",
    CONSERVATIVE = "conservative",
    ADAPTIVE = "adaptive"
}
export interface ExecutionMetrics {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    totalGasUsed: bigint;
    averageGasPrice: bigint;
    averageExecutionTime: number;
    lastExecutionTime: number;
}
export interface RetryStrategy {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
    maxRetryDelay: number;
}
export interface PoolInfo {
    address: string;
    token0: string;
    token1: string;
    fee: number;
    liquidity: bigint;
    reserve0?: bigint;
    reserve1?: bigint;
}
export interface SwapParams {
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    amountOutMin: bigint;
    deadline: bigint;
    recipient: string;
    poolAddress?: string;
    useV3?: boolean;
    path?: string[];
    amountOutMinimum?: bigint;
}
export interface QuoteResult {
    amountOut: bigint;
    gasEstimate: bigint;
    priceImpact: number;
    fee?: number;
    route?: SwapRoute[];
}
export interface PoolReserves {
    reserve0: bigint;
    reserve1: bigint;
    blockTimestampLast: number;
}
export interface CurveConfig {
    provider: JsonRpcProvider;
    registry: string;
    addressProvider: string;
    cryptoRegistry?: string;
    factoryRegistry?: string;
    registryAddress: string;
    addressProviderAddress: string;
    maxSlippage: number;
    defaultGasLimit: bigint;
}
export declare enum CurvePoolType {
    STABLE = "stable",
    CRYPTO = "crypto",
    META = "meta",
    FACTORY = "factory"
}
export interface CurvePoolInfo {
    address: string;
    type: CurvePoolType;
    poolType: CurvePoolType;
    coins: string[];
    underlyingCoins?: string[];
    name: string;
    A?: bigint;
    fee: bigint;
    adminFee: bigint;
}
export interface MetaPoolInfo extends CurvePoolInfo {
    basePool: string;
    basePoolCoins: string[];
}
export interface GaugeInfo {
    address: string;
    lpToken: string;
    workingSupply: bigint;
    rewardTokens: string[];
}
export interface PoolParameters {
    A: bigint;
    fee: bigint;
    adminFee: bigint;
    balances: bigint[];
    totalSupply: bigint;
}
export interface SwapResult {
    success: boolean;
    amountOut: bigint;
    gasUsed: bigint;
    transactionHash?: string;
    error?: string;
}
export interface SushiswapConfig {
    provider: any;
    v2Factory: string;
    v2Router: string;
    v3Factory?: string;
    bentoBox?: string;
    tridentRouter?: string;
    routerAddress: string;
    factoryAddress: string;
    initCodeHash: string;
    enableV3: boolean;
    maxHops: number;
    defaultSlippage: number;
}
export interface PoolMetrics {
    liquidity: bigint;
    volume24h: bigint;
    fees24h: bigint;
    apr: number;
    utilization: number;
}
export declare enum TridentPoolType {
    ConstantProduct = "constant-product",
    Concentrated = "concentrated",
    Stable = "stable",
    Hybrid = "hybrid"
}
export interface BentoBoxData {
    totalSupply: bigint;
    balance: bigint;
    strategy: string;
    targetPercentage: number;
}
export interface ConcentratedLiquidityData {
    tick: number;
    sqrtPriceX96: bigint;
    liquidity: bigint;
    token0Price: number;
    token1Price: number;
}
//# sourceMappingURL=index.d.ts.map