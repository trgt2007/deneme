import { ethers } from 'ethers';
import { Logger } from './Logger';

// ========================================
// 🎯 INTERFACES & TYPES
// ========================================

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
  slippageMap: Map<bigint, number>; // amount -> slippage
}

interface RiskMetrics {
  volatilityRisk: number;        // 0-100
  liquidityRisk: number;         // 0-100
  slippageRisk: number;          // 0-100
  gasRisk: number;               // 0-100
  overallRisk: number;           // 0-100
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// ========================================
// 🧮 ADVANCED MATH HELPERS CLASS
// ========================================

export class MathHelpers {
  private static instance: MathHelpers;
  private logger: any;
  
  // Mathematical Constants
  private static readonly PRECISION = 18;
  private static readonly WAD = BigInt(10) ** BigInt(18);  // 1e18
  private static readonly RAY = BigInt(10) ** BigInt(27);  // 1e27
  private static readonly RAD = BigInt(10) ** BigInt(45);  // 1e45
  
  // Financial Constants
  private static readonly SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60;
  private static readonly BASIS_POINTS = 10000; // 100%
  private static readonly MAX_SLIPPAGE = 0.1; // 10% maximum slippage
  private static readonly MIN_LIQUIDITY_RATIO = 0.01; // 1% minimum liquidity
  
  // Risk Thresholds
  private static readonly VOLATILITY_THRESHOLDS = {
    LOW: 0.02,      // 2%
    MEDIUM: 0.05,   // 5%
    HIGH: 0.1,      // 10%
    CRITICAL: 0.2   // 20%
  };

  private constructor() {
    this.logger = Logger.getInstance().createChildLogger('MathHelpers');
    this.logger.info('🧮 MathHelpers initialized');
  }

  public static getInstance(): MathHelpers {
    if (!MathHelpers.instance) {
      MathHelpers.instance = MathHelpers.getInstance();
    }
    return MathHelpers.instance;
  }

  // ========================================
  // 🔢 BASIC ARITHMETIC OPERATIONS
  // ========================================

  /**
   * Safely adds two bigint values with overflow protection
   */
  public add(a: bigint, b: bigint): bigint {
    try {
      return a + b;
    } catch (error) {
      this.logger.error('Overflow in addition operation', { a: a.toString(), b: b.toString() });
      throw new Error('Arithmetic overflow in addition');
    }
  }

  /**
   * Safely subtracts two bigint values with underflow protection
   */
  public subtract(a: bigint, b: bigint): bigint {
    if (a < b) {
      this.logger.warn('Potential underflow in subtraction', { a: a.toString(), b: b.toString() });
      return BigInt(0);
    }
    return a - b;
  }

  /**
   * Safely multiplies two bigint values with overflow protection
   */
  public multiply(a: bigint, b: bigint): bigint {
    try {
      return a * b;
    } catch (error) {
      this.logger.error('Overflow in multiplication operation', { a: a.toString(), b: b.toString() });
      throw new Error('Arithmetic overflow in multiplication');
    }
  }

  /**
   * Safely divides two bigint values with precision
   */
  public divide(a: bigint, b: bigint, precision: number = 18): bigint {
    if (b === BigInt(0)) {
      this.logger.error('Division by zero attempted', { a: a.toString() });
      throw new Error('Division by zero');
    }
    
    const scaleFactor = BigInt(10) ** BigInt(precision);
    return (a * scaleFactor) / b;
  }

  /**
   * Calculates power with integer exponent
   */
  public power(base: bigint, exponent: number): bigint {
    if (exponent < 0) {
      throw new Error('Negative exponents not supported for bigint');
    }
    
    let result = BigInt(1);
    let currentBase = base;
    let currentExponent = exponent;
    
    while (currentExponent > 0) {
      if (currentExponent % 2 === 1) {
        result = result * currentBase;
      }
      currentBase = currentBase * currentBase;
      currentExponent = Math.floor(currentExponent / 2);
    }
    
    return result;
  }

  /**
   * Calculates square root using Newton's method
   */
  public sqrt(value: bigint): bigint {
    if (value < BigInt(0)) {
      throw new Error('Cannot calculate square root of negative number');
    }
    
    if (value === BigInt(0)) return BigInt(0);
    if (value === BigInt(1)) return BigInt(1);
    
    let x = value;
    let y = (value + BigInt(1)) / BigInt(2);
    
    while (y < x) {
      x = y;
      y = (x + value / x) / BigInt(2);
    }
    
    return x;
  }

  // ========================================
  // 💰 FINANCIAL CALCULATIONS
  // ========================================

  /**
   * Calculates percentage change between two values
   */
  public calculatePercentageChange(oldValue: bigint, newValue: bigint): number {
    if (oldValue === BigInt(0)) {
      return newValue > BigInt(0) ? Number.POSITIVE_INFINITY : 0;
    }
    
    const change = newValue - oldValue;
    const percentage = (Number(change * BigInt(10000)) / Number(oldValue)) / 100;
    
    return percentage;
  }

  /**
   * Calculates compound annual growth rate (CAGR)
   */
  public calculateCAGR(initialValue: bigint, finalValue: bigint, periods: number): number {
    if (initialValue <= BigInt(0) || finalValue <= BigInt(0) || periods <= 0) {
      throw new Error('Invalid parameters for CAGR calculation');
    }
    
    const growth = Number(finalValue) / Number(initialValue);
    return Math.pow(growth, 1 / periods) - 1;
  }

  /**
   * Calculates profit margin
   */
  public calculateProfitMargin(revenue: bigint, costs: bigint): number {
    if (revenue <= BigInt(0)) {
      return 0;
    }
    
    const profit = revenue - costs;
    return (Number(profit * BigInt(10000)) / Number(revenue)) / 100;
  }

  /**
   * Calculates return on investment (ROI)
   */
  public calculateROI(investment: bigint, returns: bigint): number {
    if (investment <= BigInt(0)) {
      throw new Error('Investment must be positive');
    }
    
    const profit = returns - investment;
    return (Number(profit * BigInt(10000)) / Number(investment)) / 100;
  }

  /**
   * Calculates basis points
   */
  public toBasisPoints(percentage: number): number {
    return percentage * 100; // 1% = 100 basis points
  }

  public fromBasisPoints(basisPoints: number): number {
    return basisPoints / 100;
  }

  // ========================================
  // 📊 STATISTICAL FUNCTIONS
  // ========================================

  /**
   * Calculates mean (average) of bigint array
   */
  public calculateMean(values: bigint[]): bigint {
    if (values.length === 0) {
      throw new Error('Cannot calculate mean of empty array');
    }
    
    const sum = values.reduce((acc, val) => acc + val, BigInt(0));
    return sum / BigInt(values.length);
  }

  /**
   * Calculates median of bigint array
   */
  public calculateMedian(values: bigint[]): bigint {
    if (values.length === 0) {
      throw new Error('Cannot calculate median of empty array');
    }
    
    const sorted = [...values].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / BigInt(2);
    } else {
      return sorted[middle];
    }
  }

  /**
   * Calculates standard deviation
   */
  public calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) {
      throw new Error('Cannot calculate standard deviation of empty array');
    }
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Calculates variance
   */
  public calculateVariance(values: number[]): number {
    if (values.length === 0) {
      throw new Error('Cannot calculate variance of empty array');
    }
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    
    return squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculates correlation coefficient between two arrays
   */
  public calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) {
      throw new Error('Arrays must have equal length and not be empty');
    }
    
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    if (denominator === 0) {
      return 0;
    }
    
    return numerator / denominator;
  }

  // ========================================
  // 🔄 ARBITRAGE CALCULATIONS
  // ========================================

  /**
   * Calculates potential arbitrage profit
   */
  public calculateArbitrageProfit(
    amountIn: bigint,
    buyPrice: bigint,
    sellPrice: bigint,
    gasCost: bigint,
    fees: bigint
  ): { grossProfit: bigint; netProfit: bigint; profitPercentage: number } {
    
    // Calculate amounts with 18 decimal precision
    const amountOut = (amountIn * sellPrice) / MathHelpers.WAD;
    const totalCost = (amountIn * buyPrice) / MathHelpers.WAD;
    
    const grossProfit = amountOut - totalCost;
    const netProfit = grossProfit - gasCost - fees;
    
    const profitPercentage = totalCost > BigInt(0) ? 
      (Number(netProfit * BigInt(10000)) / Number(totalCost)) / 100 : 0;
    
    return {
      grossProfit,
      netProfit,
      profitPercentage
    };
  }

  /**
   * Calculates optimal arbitrage amount based on liquidity
   */
  public calculateOptimalArbitrageAmount(
    priceDifference: bigint,
    liquidityA: bigint,
    liquidityB: bigint,
    maxSlippage: number = 0.05
  ): bigint {
    
    // Use geometric mean of liquidities as base
    const combinedLiquidity = this.sqrt(liquidityA * liquidityB);
    
    // Calculate maximum amount before hitting slippage threshold
    const maxSlippageAmount = (combinedLiquidity * BigInt(Math.floor(maxSlippage * 1000))) / BigInt(1000);
    
    // Calculate amount based on price difference efficiency
    const priceBasedAmount = (priceDifference * combinedLiquidity) / MathHelpers.WAD;
    
    // Return minimum of the two to stay within safe limits
    return maxSlippageAmount < priceBasedAmount ? maxSlippageAmount : priceBasedAmount;
  }

  /**
   * Calculates slippage for a given trade
   */
  public calculateSlippage(
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint,
    fee: number = 0.003 // 0.3% default Uniswap fee
  ): number {
    
    if (reserveIn <= BigInt(0) || reserveOut <= BigInt(0)) {
      return 1; // 100% slippage if no liquidity
    }
    
    // Uniswap V2 constant product formula: x * y = k
    const feeMultiplier = BigInt(Math.floor((1 - fee) * 1000000));
    const amountInWithFee = (amountIn * feeMultiplier) / BigInt(1000000);
    
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn + amountInWithFee;
    const amountOut = numerator / denominator;
    
    // Calculate ideal amount out without slippage
    const idealRate = reserveOut / reserveIn;
    const idealAmountOut = (amountIn * idealRate) / MathHelpers.WAD;
    
    if (idealAmountOut <= BigInt(0)) {
      return 1;
    }
    
    const slippage = Number(idealAmountOut - amountOut) / Number(idealAmountOut);
    return Math.max(0, slippage);
  }

  /**
   * Calculates price impact of a trade
   */
  public calculatePriceImpact(
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint
  ): number {
    
    if (reserveIn <= BigInt(0) || reserveOut <= BigInt(0)) {
      return 1; // 100% price impact if no liquidity
    }
    
    const initialPrice = (reserveOut * MathHelpers.WAD) / reserveIn;
    
    const newReserveIn = reserveIn + amountIn;
    const newReserveOut = (reserveIn * reserveOut) / newReserveIn;
    
    const finalPrice = (newReserveOut * MathHelpers.WAD) / newReserveIn;
    
    if (initialPrice <= BigInt(0)) {
      return 1;
    }
    
    const priceImpact = Number(initialPrice - finalPrice) / Number(initialPrice);
    return Math.max(0, priceImpact);
  }

  // ========================================
  // 📈 VOLATILITY & RISK ANALYSIS
  // ========================================

  /**
   * Calculates volatility metrics from price history
   */
  public calculateVolatilityMetrics(priceHistory: PricePoint[]): VolatilityMetrics {
    if (priceHistory.length < 2) {
      throw new Error('Insufficient price history for volatility calculation');
    }
    
    // Calculate returns
    const returns: number[] = [];
    for (let i = 1; i < priceHistory.length; i++) {
      const currentPrice = Number(priceHistory[i].price);
      const previousPrice = Number(priceHistory[i - 1].price);
      const return_ = (currentPrice - previousPrice) / previousPrice;
      returns.push(return_);
    }
    
    const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    const variance = this.calculateVariance(returns);
    const standardDeviation = Math.sqrt(variance);
    
    // Annualize volatility (assuming daily returns)
    const annualizedVolatility = standardDeviation * Math.sqrt(365);
    
    // Determine trend direction
    const firstPrice = Number(priceHistory[0].price);
    const lastPrice = Number(priceHistory[priceHistory.length - 1].price);
    const totalReturn = (lastPrice - firstPrice) / firstPrice;
    
    let trendDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    if (totalReturn > 0.02) { // >2% increase
      trendDirection = 'BULLISH';
    } else if (totalReturn < -0.02) { // >2% decrease
      trendDirection = 'BEARISH';
    } else {
      trendDirection = 'NEUTRAL';
    }
    
    // Calculate volatility score (0-100)
    const volatilityScore = Math.min(100, annualizedVolatility * 100);
    
    // Calculate confidence level based on data points
    const confidenceLevel = Math.min(1, priceHistory.length / 30); // Max confidence with 30+ data points
    
    return {
      standardDeviation: annualizedVolatility,
      variance,
      mean,
      volatilityScore,
      trendDirection,
      confidenceLevel
    };
  }

  /**
   * Calculates liquidity metrics
   */
  public calculateLiquidityMetrics(
    reserves: { tokenA: bigint; tokenB: bigint },
    volume24h: bigint,
    tradeSizes: bigint[]
  ): LiquidityMetrics {
    
    const totalLiquidity = reserves.tokenA + reserves.tokenB; // Simplified
    const availableLiquidity = totalLiquidity; // Can be reduced by active orders
    
    const utilizationRatio = volume24h > BigInt(0) ? 
      Number(volume24h) / Number(totalLiquidity) : 0;
    
    // Calculate depth score based on largest trade size vs reserves
    const maxTradeSize = tradeSizes.length > 0 ? 
      tradeSizes.reduce((max, size) => size > max ? size : max, BigInt(0)) : BigInt(0);
    
    const depthScore = totalLiquidity > BigInt(0) ? 
      Math.min(1, Number(maxTradeSize) / Number(totalLiquidity)) : 0;
    
    // Create slippage map for different trade sizes
    const slippageMap = new Map<bigint, number>();
    const testSizes = [
      totalLiquidity / BigInt(1000), // 0.1%
      totalLiquidity / BigInt(100),  // 1%
      totalLiquidity / BigInt(20),   // 5%
      totalLiquidity / BigInt(10)    // 10%
    ];
    
    for (const size of testSizes) {
      if (size > BigInt(0)) {
        const slippage = this.calculateSlippage(size, reserves.tokenA, reserves.tokenB);
        slippageMap.set(size, slippage);
      }
    }
    
    return {
      totalLiquidity,
      availableLiquidity,
      utilizationRatio,
      depthScore,
      slippageMap
    };
  }

  /**
   * Calculates comprehensive risk metrics
   */
  public calculateRiskMetrics(
    volatilityMetrics: VolatilityMetrics,
    liquidityMetrics: LiquidityMetrics,
    currentGasPrice: bigint,
    averageGasPrice: bigint
  ): RiskMetrics {
    
    // Volatility Risk (0-100)
    let volatilityRisk = 0;
    if (volatilityMetrics.volatilityScore > MathHelpers.VOLATILITY_THRESHOLDS.CRITICAL * 100) {
      volatilityRisk = 100;
    } else if (volatilityMetrics.volatilityScore > MathHelpers.VOLATILITY_THRESHOLDS.HIGH * 100) {
      volatilityRisk = 75;
    } else if (volatilityMetrics.volatilityScore > MathHelpers.VOLATILITY_THRESHOLDS.MEDIUM * 100) {
      volatilityRisk = 50;
    } else if (volatilityMetrics.volatilityScore > MathHelpers.VOLATILITY_THRESHOLDS.LOW * 100) {
      volatilityRisk = 25;
    }
    
    // Liquidity Risk (0-100)
    const liquidityRisk = Math.max(0, Math.min(100, 
      (1 - liquidityMetrics.depthScore) * 100 + 
      (liquidityMetrics.utilizationRatio > 0.8 ? 20 : 0)
    ));
    
    // Slippage Risk (0-100)
    const avgSlippage = Array.from(liquidityMetrics.slippageMap.values())
      .reduce((sum, slippage) => sum + slippage, 0) / liquidityMetrics.slippageMap.size;
    const slippageRisk = Math.min(100, avgSlippage * 1000); // Convert to 0-100 scale
    
    // Gas Risk (0-100)
    const gasPriceRatio = averageGasPrice > BigInt(0) ? 
      Number(currentGasPrice) / Number(averageGasPrice) : 1;
    const gasRisk = Math.min(100, Math.max(0, (gasPriceRatio - 1) * 100));
    
    // Overall Risk (weighted average)
    const overallRisk = Math.round(
      volatilityRisk * 0.3 +
      liquidityRisk * 0.3 +
      slippageRisk * 0.25 +
      gasRisk * 0.15
    );
    
    // Risk Category
    let riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (overallRisk < 25) {
      riskCategory = 'LOW';
    } else if (overallRisk < 50) {
      riskCategory = 'MEDIUM';
    } else if (overallRisk < 75) {
      riskCategory = 'HIGH';
    } else {
      riskCategory = 'CRITICAL';
    }
    
    return {
      volatilityRisk,
      liquidityRisk,
      slippageRisk,
      gasRisk,
      overallRisk,
      riskCategory
    };
  }

  // ========================================
  // 🎯 SPECIALIZED CALCULATIONS
  // ========================================

  /**
   * Calculates Uniswap V2 output amount
   */
  public getUniswapV2OutputAmount(
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint,
    fee: number = 0.003
  ): bigint {
    
    if (amountIn <= BigInt(0) || reserveIn <= BigInt(0) || reserveOut <= BigInt(0)) {
      return BigInt(0);
    }
    
    const feeMultiplier = BigInt(Math.floor((1 - fee) * 1000000));
    const amountInWithFee = (amountIn * feeMultiplier) / BigInt(1000000);
    
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn + amountInWithFee;
    
    return numerator / denominator;
  }

  /**
   * Calculates Uniswap V3 output amount (simplified)
   */
  public getUniswapV3OutputAmount(
    amountIn: bigint,
    sqrtPriceX96: bigint,
    liquidity: bigint,
    fee: number = 0.003
  ): bigint {
    
    // Simplified V3 calculation - in reality, this would involve tick math
    const Q96 = BigInt(2) ** BigInt(96);
    const price = (sqrtPriceX96 * sqrtPriceX96) / Q96;
    
    const feeMultiplier = BigInt(Math.floor((1 - fee) * 1000000));
    const amountInWithFee = (amountIn * feeMultiplier) / BigInt(1000000);
    
    return (amountInWithFee * price) / MathHelpers.WAD;
  }

  /**
   * Calculates Curve stable swap output
   */
  public getCurveOutputAmount(
    amountIn: bigint,
    balances: bigint[],
    amplifier: bigint,
    i: number,
    j: number
  ): bigint {
    
    // Simplified Curve StableSwap invariant calculation
    // Real implementation would use Newton's method for D calculation
    
    if (i === j || i >= balances.length || j >= balances.length) {
      return BigInt(0);
    }
    
    const n = BigInt(balances.length);
    const A = amplifier;
    
    // Simplified calculation - assume small trade with minimal slippage
    const rate = MathHelpers.WAD; // 1:1 rate for stablecoins
    const fee = BigInt(4); // 0.04% fee
    
    const amountOut = (amountIn * rate) / MathHelpers.WAD;
    const feeAmount = (amountOut * fee) / BigInt(10000);
    
    return amountOut - feeAmount;
  }

  /**
   * Calculates compound interest
   */
  public calculateCompoundInterest(
    principal: bigint,
    rate: number,
    periods: number,
    compoundingFrequency: number = 1
  ): bigint {
    
    const ratePerPeriod = rate / compoundingFrequency;
    const totalPeriods = periods * compoundingFrequency;
    
    const multiplier = Math.pow(1 + ratePerPeriod, totalPeriods);
    const result = Number(principal) * multiplier;
    
    return BigInt(Math.floor(result));
  }

  /**
   * Calculates time-weighted average price (TWAP)
   */
  public calculateTWAP(pricePoints: PricePoint[], windowSize: number): bigint {
    if (pricePoints.length === 0) {
      return BigInt(0);
    }
    
    const now = Date.now();
    const cutoff = now - windowSize;
    
    const relevantPoints = pricePoints.filter(point => point.timestamp >= cutoff);
    
    if (relevantPoints.length === 0) {
      return pricePoints[pricePoints.length - 1].price;
    }
    
    let weightedSum = BigInt(0);
    let totalWeight = 0;
    
    for (let i = 0; i < relevantPoints.length - 1; i++) {
      const duration = relevantPoints[i + 1].timestamp - relevantPoints[i].timestamp;
      weightedSum += relevantPoints[i].price * BigInt(duration);
      totalWeight += duration;
    }
    
    // Add the last point with remaining time
    const lastDuration = now - relevantPoints[relevantPoints.length - 1].timestamp;
    weightedSum += relevantPoints[relevantPoints.length - 1].price * BigInt(lastDuration);
    totalWeight += lastDuration;
    
    return totalWeight > 0 ? weightedSum / BigInt(totalWeight) : BigInt(0);
  }

  // ========================================
  // 🔄 UTILITY FUNCTIONS
  // ========================================

  /**
   * Converts between different decimal precisions
   */
  public convertDecimals(amount: bigint, fromDecimals: number, toDecimals: number): bigint {
    if (fromDecimals === toDecimals) {
      return amount;
    }
    
    if (fromDecimals > toDecimals) {
      const scaleFactor = BigInt(10) ** BigInt(fromDecimals - toDecimals);
      return amount / scaleFactor;
    } else {
      const scaleFactor = BigInt(10) ** BigInt(toDecimals - fromDecimals);
      return amount * scaleFactor;
    }
  }

  /**
   * Formats bigint to human readable string
   */
  public formatUnits(amount: bigint, decimals: number = 18, precision: number = 4): string {
    return parseFloat(ethers.formatUnits(amount, decimals)).toFixed(precision);
  }

  /**
   * Parses human readable string to bigint
   */
  public parseUnits(amount: string, decimals: number = 18): bigint {
    return ethers.parseUnits(amount, decimals);
  }

  /**
   * Clamps a value between min and max
   */
  public clamp(value: bigint, min: bigint, max: bigint): bigint {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  /**
   * Checks if a number is within a percentage tolerance
   */
  public isWithinTolerance(value: bigint, target: bigint, tolerance: number): boolean {
    if (target === BigInt(0)) {
      return value === BigInt(0);
    }
    
    const diff = value > target ? value - target : target - value;
    const toleranceAmount = (target * BigInt(Math.floor(tolerance * 10000))) / BigInt(10000);
    
    return diff <= toleranceAmount;
  }

  /**
   * Generates a price impact warning level
   */
  public getPriceImpactWarning(priceImpact: number): 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (priceImpact < 0.01) return 'NONE';      // <1%
    if (priceImpact < 0.03) return 'LOW';       // 1-3%
    if (priceImpact < 0.05) return 'MEDIUM';    // 3-5%
    if (priceImpact < 0.1) return 'HIGH';       // 5-10%
    return 'CRITICAL';                          // >10%
  }

  /**
   * Calculates gas efficiency score
   */
  public calculateGasEfficiency(
    potentialProfit: bigint,
    gasRequired: bigint,
    gasPrice: bigint
  ): number {
    
    const gasCost = gasRequired * gasPrice;
    
    if (gasCost >= potentialProfit) {
      return 0; // No efficiency if gas cost exceeds profit
    }
    
    const netProfit = potentialProfit - gasCost;
    const efficiency = Number(netProfit * BigInt(100)) / Number(potentialProfit);
    
    return Math.max(0, Math.min(100, efficiency));
  }

  /**
   * Validates numerical inputs for safety
   */
  public validateInputs(values: { [key: string]: bigint | number }, constraints: { [key: string]: { min?: bigint | number; max?: bigint | number } }): boolean {
    for (const [key, value] of Object.entries(values)) {
      const constraint = constraints[key];
      if (!constraint) continue;
      
      if (typeof value === 'bigint') {
        const bigintConstraint = constraint as { min?: bigint; max?: bigint };
        if (bigintConstraint.min !== undefined && value < bigintConstraint.min) {
          this.logger.warn(`Validation failed: ${key} below minimum`, { 
            value: value.toString(), 
            min: bigintConstraint.min.toString() 
          });
          return false;
        }
        if (bigintConstraint.max !== undefined && value > bigintConstraint.max) {
          this.logger.warn(`Validation failed: ${key} above maximum`, { 
            value: value.toString(), 
            max: bigintConstraint.max.toString() 
          });
          return false;
        }
      } else {
        const numberConstraint = constraint as { min?: number; max?: number };
        if (numberConstraint.min !== undefined && value < numberConstraint.min) {
          this.logger.warn(`Validation failed: ${key} below minimum`, { 
            value, 
            min: numberConstraint.min 
          });
          return false;
        }
        if (numberConstraint.max !== undefined && value > numberConstraint.max) {
          this.logger.warn(`Validation failed: ${key} above maximum`, { 
            value, 
            max: numberConstraint.max 
          });
          return false;
        }
      }
    }
    
    return true;
  }

  // ========================================
  // 📊 PUBLIC GETTERS & CONSTANTS
  // ========================================

  public static get WAD_VALUE(): bigint {
    return MathHelpers.WAD;
  }

  public static get RAY_VALUE(): bigint {
    return MathHelpers.RAY;
  }

  public static get PRECISION_VALUE(): number {
    return MathHelpers.PRECISION;
  }

  public getVolatilityThresholds() {
    return MathHelpers.VOLATILITY_THRESHOLDS;
  }

  public getMaxSlippage(): number {
    return MathHelpers.MAX_SLIPPAGE;
  }

  public getMinLiquidityRatio(): number {
    return MathHelpers.MIN_LIQUIDITY_RATIO;
  }

  // ========================================
  // 📈 ADVANCED ANALYTICS
  // ========================================

  /**
   * Performs Monte Carlo simulation for profit estimation
   */
  public monteCarloSimulation(
    baseProfit: bigint,
    volatility: number,
    iterations: number = 1000
  ): { mean: bigint; std: number; percentiles: { p5: bigint; p50: bigint; p95: bigint } } {
    
    const results: bigint[] = [];
    
    for (let i = 0; i < iterations; i++) {
      // Generate random factor using Box-Muller transform
      const u1 = Math.random();
      const u2 = Math.random();
      const randomFactor = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      // Apply volatility
      const adjustedFactor = 1 + (randomFactor * volatility);
      const simulatedProfit = BigInt(Math.floor(Number(baseProfit) * adjustedFactor));
      
      results.push(simulatedProfit);
    }
    
    // Sort results for percentile calculation
    results.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
    
    const mean = this.calculateMean(results);
    const numbersArray = results.map(r => Number(r));
    const std = this.calculateStandardDeviation(numbersArray);
    
    const p5Index = Math.floor(iterations * 0.05);
    const p50Index = Math.floor(iterations * 0.5);
    const p95Index = Math.floor(iterations * 0.95);
    
    return {
      mean,
      std,
      percentiles: {
        p5: results[p5Index],
        p50: results[p50Index],
        p95: results[p95Index]
      }
    };
  }

  /**
   * Calculates Value at Risk (VaR)
   */
  public calculateVaR(
    portfolioValue: bigint,
    volatility: number,
    confidenceLevel: number = 0.95,
    timeHorizon: number = 1
  ): bigint {
    
    // Standard normal distribution quantile for given confidence level
    const zScore = this.getZScore(confidenceLevel);
    
    // VaR calculation: Portfolio * Volatility * Z-Score * sqrt(Time)
    const portfolioNumber = Number(portfolioValue);
    const varAmount = portfolioNumber * volatility * zScore * Math.sqrt(timeHorizon);
    
    return BigInt(Math.floor(Math.abs(varAmount)));
  }

  /**
   * Gets Z-score for given confidence level
   */
  private getZScore(confidenceLevel: number): number {
    // Approximate inverse normal CDF for common confidence levels
    const zScores: { [key: number]: number } = {
      0.90: 1.282,
      0.95: 1.645,
      0.99: 2.326,
      0.995: 2.576,
      0.999: 3.091
    };
    
    return zScores[confidenceLevel] || 1.645; // Default to 95%
  }
}

// ========================================
// 📋 EXPORT
// ========================================

export {
  PricePoint,
  SwapQuote,
  ArbitrageOpportunity,
  VolatilityMetrics,
  LiquidityMetrics,
  RiskMetrics
};
