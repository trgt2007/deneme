interface PricePoint {
    price: bigint;
    timestamp: number;
    source: string;
}
interface SwapQuote {
    amountIn: bigint;
    amountOut: bigint;
    slippage: number;
    priceImpact: number;
    route: string[];
    gasEstimate: bigint;
    fee: bigint;
}
interface ArbitrageOpportunity {
    tokenA: string;
    tokenB: string;
    amountIn: bigint;
    expectedProfit: bigint;
    profitPercentage: number;
    gasRequired: bigint;
    netProfit: bigint;
    confidence: number;
    route: string[];
    dexes: string[];
}
interface VolatilityMetrics {
    standardDeviation: number;
    variance: number;
    mean: number;
    volatilityScore: number;
    trendDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confidenceLevel: number;
}
interface LiquidityMetrics {
    totalLiquidity: bigint;
    availableLiquidity: bigint;
    utilizationRatio: number;
    depthScore: number;
    slippageMap: Map<bigint, number>;
}
interface RiskMetrics {
    volatilityRisk: number;
    liquidityRisk: number;
    slippageRisk: number;
    gasRisk: number;
    overallRisk: number;
    riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
export declare class MathHelpers {
    private static instance;
    private logger;
    private static readonly PRECISION;
    private static readonly WAD;
    private static readonly RAY;
    private static readonly RAD;
    private static readonly SECONDS_PER_YEAR;
    private static readonly BASIS_POINTS;
    private static readonly MAX_SLIPPAGE;
    private static readonly MIN_LIQUIDITY_RATIO;
    private static readonly VOLATILITY_THRESHOLDS;
    private constructor();
    static getInstance(): MathHelpers;
    /**
     * Safely adds two bigint values with overflow protection
     */
    add(a: bigint, b: bigint): bigint;
    /**
     * Safely subtracts two bigint values with underflow protection
     */
    subtract(a: bigint, b: bigint): bigint;
    /**
     * Safely multiplies two bigint values with overflow protection
     */
    multiply(a: bigint, b: bigint): bigint;
    /**
     * Safely divides two bigint values with precision
     */
    divide(a: bigint, b: bigint, precision?: number): bigint;
    /**
     * Calculates power with integer exponent
     */
    power(base: bigint, exponent: number): bigint;
    /**
     * Calculates square root using Newton's method
     */
    sqrt(value: bigint): bigint;
    /**
     * Calculates percentage change between two values
     */
    calculatePercentageChange(oldValue: bigint, newValue: bigint): number;
    /**
     * Calculates compound annual growth rate (CAGR)
     */
    calculateCAGR(initialValue: bigint, finalValue: bigint, periods: number): number;
    /**
     * Calculates profit margin
     */
    calculateProfitMargin(revenue: bigint, costs: bigint): number;
    /**
     * Calculates return on investment (ROI)
     */
    calculateROI(investment: bigint, returns: bigint): number;
    /**
     * Calculates basis points
     */
    toBasisPoints(percentage: number): number;
    fromBasisPoints(basisPoints: number): number;
    /**
     * Calculates mean (average) of bigint array
     */
    calculateMean(values: bigint[]): bigint;
    /**
     * Calculates median of bigint array
     */
    calculateMedian(values: bigint[]): bigint;
    /**
     * Calculates standard deviation
     */
    calculateStandardDeviation(values: number[]): number;
    /**
     * Calculates variance
     */
    calculateVariance(values: number[]): number;
    /**
     * Calculates correlation coefficient between two arrays
     */
    calculateCorrelation(x: number[], y: number[]): number;
    /**
     * Calculates potential arbitrage profit
     */
    calculateArbitrageProfit(amountIn: bigint, buyPrice: bigint, sellPrice: bigint, gasCost: bigint, fees: bigint): {
        grossProfit: bigint;
        netProfit: bigint;
        profitPercentage: number;
    };
    /**
     * Calculates optimal arbitrage amount based on liquidity
     */
    calculateOptimalArbitrageAmount(priceDifference: bigint, liquidityA: bigint, liquidityB: bigint, maxSlippage?: number): bigint;
    /**
     * Calculates slippage for a given trade
     */
    calculateSlippage(amountIn: bigint, reserveIn: bigint, reserveOut: bigint, fee?: number): number;
    /**
     * Calculates price impact of a trade
     */
    calculatePriceImpact(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): number;
    /**
     * Calculates volatility metrics from price history
     */
    calculateVolatilityMetrics(priceHistory: PricePoint[]): VolatilityMetrics;
    /**
     * Calculates liquidity metrics
     */
    calculateLiquidityMetrics(reserves: {
        tokenA: bigint;
        tokenB: bigint;
    }, volume24h: bigint, tradeSizes: bigint[]): LiquidityMetrics;
    /**
     * Calculates comprehensive risk metrics
     */
    calculateRiskMetrics(volatilityMetrics: VolatilityMetrics, liquidityMetrics: LiquidityMetrics, currentGasPrice: bigint, averageGasPrice: bigint): RiskMetrics;
    /**
     * Calculates Uniswap V2 output amount
     */
    getUniswapV2OutputAmount(amountIn: bigint, reserveIn: bigint, reserveOut: bigint, fee?: number): bigint;
    /**
     * Calculates Uniswap V3 output amount (simplified)
     */
    getUniswapV3OutputAmount(amountIn: bigint, sqrtPriceX96: bigint, liquidity: bigint, fee?: number): bigint;
    /**
     * Calculates Curve stable swap output
     */
    getCurveOutputAmount(amountIn: bigint, balances: bigint[], amplifier: bigint, i: number, j: number): bigint;
    /**
     * Calculates compound interest
     */
    calculateCompoundInterest(principal: bigint, rate: number, periods: number, compoundingFrequency?: number): bigint;
    /**
     * Calculates time-weighted average price (TWAP)
     */
    calculateTWAP(pricePoints: PricePoint[], windowSize: number): bigint;
    /**
     * Converts between different decimal precisions
     */
    convertDecimals(amount: bigint, fromDecimals: number, toDecimals: number): bigint;
    /**
     * Formats bigint to human readable string
     */
    formatUnits(amount: bigint, decimals?: number, precision?: number): string;
    /**
     * Parses human readable string to bigint
     */
    parseUnits(amount: string, decimals?: number): bigint;
    /**
     * Clamps a value between min and max
     */
    clamp(value: bigint, min: bigint, max: bigint): bigint;
    /**
     * Checks if a number is within a percentage tolerance
     */
    isWithinTolerance(value: bigint, target: bigint, tolerance: number): boolean;
    /**
     * Generates a price impact warning level
     */
    getPriceImpactWarning(priceImpact: number): 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    /**
     * Calculates gas efficiency score
     */
    calculateGasEfficiency(potentialProfit: bigint, gasRequired: bigint, gasPrice: bigint): number;
    /**
     * Validates numerical inputs for safety
     */
    validateInputs(values: {
        [key: string]: bigint | number;
    }, constraints: {
        [key: string]: {
            min?: bigint | number;
            max?: bigint | number;
        };
    }): boolean;
    static get WAD_VALUE(): bigint;
    static get RAY_VALUE(): bigint;
    static get PRECISION_VALUE(): number;
    getVolatilityThresholds(): {
        LOW: number;
        MEDIUM: number;
        HIGH: number;
        CRITICAL: number;
    };
    getMaxSlippage(): number;
    getMinLiquidityRatio(): number;
    /**
     * Performs Monte Carlo simulation for profit estimation
     */
    monteCarloSimulation(baseProfit: bigint, volatility: number, iterations?: number): {
        mean: bigint;
        std: number;
        percentiles: {
            p5: bigint;
            p50: bigint;
            p95: bigint;
        };
    };
    /**
     * Calculates Value at Risk (VaR)
     */
    calculateVaR(portfolioValue: bigint, volatility: number, confidenceLevel?: number, timeHorizon?: number): bigint;
    /**
     * Gets Z-score for given confidence level
     */
    private getZScore;
}
export { PricePoint, SwapQuote, ArbitrageOpportunity, VolatilityMetrics, LiquidityMetrics, RiskMetrics };
//# sourceMappingURL=MathHelpers.d.ts.map