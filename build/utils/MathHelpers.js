"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MathHelpers = void 0;
const ethers_1 = require("ethers");
const Logger_1 = require("./Logger");
// ========================================
// 🧮 ADVANCED MATH HELPERS CLASS
// ========================================
class MathHelpers {
    static instance;
    logger;
    // Mathematical Constants
    static PRECISION = 18;
    static WAD = BigInt(10) ** BigInt(18); // 1e18
    static RAY = BigInt(10) ** BigInt(27); // 1e27
    static RAD = BigInt(10) ** BigInt(45); // 1e45
    // Financial Constants
    static SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60;
    static BASIS_POINTS = 10000; // 100%
    static MAX_SLIPPAGE = 0.1; // 10% maximum slippage
    static MIN_LIQUIDITY_RATIO = 0.01; // 1% minimum liquidity
    // Risk Thresholds
    static VOLATILITY_THRESHOLDS = {
        LOW: 0.02, // 2%
        MEDIUM: 0.05, // 5%
        HIGH: 0.1, // 10%
        CRITICAL: 0.2 // 20%
    };
    constructor() {
        this.logger = Logger_1.Logger.getInstance().createChildLogger('MathHelpers');
        this.logger.info('🧮 MathHelpers initialized');
    }
    static getInstance() {
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
    add(a, b) {
        try {
            return a + b;
        }
        catch (error) {
            this.logger.error('Overflow in addition operation', { a: a.toString(), b: b.toString() });
            throw new Error('Arithmetic overflow in addition');
        }
    }
    /**
     * Safely subtracts two bigint values with underflow protection
     */
    subtract(a, b) {
        if (a < b) {
            this.logger.warn('Potential underflow in subtraction', { a: a.toString(), b: b.toString() });
            return BigInt(0);
        }
        return a - b;
    }
    /**
     * Safely multiplies two bigint values with overflow protection
     */
    multiply(a, b) {
        try {
            return a * b;
        }
        catch (error) {
            this.logger.error('Overflow in multiplication operation', { a: a.toString(), b: b.toString() });
            throw new Error('Arithmetic overflow in multiplication');
        }
    }
    /**
     * Safely divides two bigint values with precision
     */
    divide(a, b, precision = 18) {
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
    power(base, exponent) {
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
    sqrt(value) {
        if (value < BigInt(0)) {
            throw new Error('Cannot calculate square root of negative number');
        }
        if (value === BigInt(0))
            return BigInt(0);
        if (value === BigInt(1))
            return BigInt(1);
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
    calculatePercentageChange(oldValue, newValue) {
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
    calculateCAGR(initialValue, finalValue, periods) {
        if (initialValue <= BigInt(0) || finalValue <= BigInt(0) || periods <= 0) {
            throw new Error('Invalid parameters for CAGR calculation');
        }
        const growth = Number(finalValue) / Number(initialValue);
        return Math.pow(growth, 1 / periods) - 1;
    }
    /**
     * Calculates profit margin
     */
    calculateProfitMargin(revenue, costs) {
        if (revenue <= BigInt(0)) {
            return 0;
        }
        const profit = revenue - costs;
        return (Number(profit * BigInt(10000)) / Number(revenue)) / 100;
    }
    /**
     * Calculates return on investment (ROI)
     */
    calculateROI(investment, returns) {
        if (investment <= BigInt(0)) {
            throw new Error('Investment must be positive');
        }
        const profit = returns - investment;
        return (Number(profit * BigInt(10000)) / Number(investment)) / 100;
    }
    /**
     * Calculates basis points
     */
    toBasisPoints(percentage) {
        return percentage * 100; // 1% = 100 basis points
    }
    fromBasisPoints(basisPoints) {
        return basisPoints / 100;
    }
    // ========================================
    // 📊 STATISTICAL FUNCTIONS
    // ========================================
    /**
     * Calculates mean (average) of bigint array
     */
    calculateMean(values) {
        if (values.length === 0) {
            throw new Error('Cannot calculate mean of empty array');
        }
        const sum = values.reduce((acc, val) => acc + val, BigInt(0));
        return sum / BigInt(values.length);
    }
    /**
     * Calculates median of bigint array
     */
    calculateMedian(values) {
        if (values.length === 0) {
            throw new Error('Cannot calculate median of empty array');
        }
        const sorted = [...values].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
        const middle = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / BigInt(2);
        }
        else {
            return sorted[middle];
        }
    }
    /**
     * Calculates standard deviation
     */
    calculateStandardDeviation(values) {
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
    calculateVariance(values) {
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
    calculateCorrelation(x, y) {
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
    calculateArbitrageProfit(amountIn, buyPrice, sellPrice, gasCost, fees) {
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
    calculateOptimalArbitrageAmount(priceDifference, liquidityA, liquidityB, maxSlippage = 0.05) {
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
    calculateSlippage(amountIn, reserveIn, reserveOut, fee = 0.003 // 0.3% default Uniswap fee
    ) {
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
    calculatePriceImpact(amountIn, reserveIn, reserveOut) {
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
    calculateVolatilityMetrics(priceHistory) {
        if (priceHistory.length < 2) {
            throw new Error('Insufficient price history for volatility calculation');
        }
        // Calculate returns
        const returns = [];
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
        let trendDirection;
        if (totalReturn > 0.02) { // >2% increase
            trendDirection = 'BULLISH';
        }
        else if (totalReturn < -0.02) { // >2% decrease
            trendDirection = 'BEARISH';
        }
        else {
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
    calculateLiquidityMetrics(reserves, volume24h, tradeSizes) {
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
        const slippageMap = new Map();
        const testSizes = [
            totalLiquidity / BigInt(1000), // 0.1%
            totalLiquidity / BigInt(100), // 1%
            totalLiquidity / BigInt(20), // 5%
            totalLiquidity / BigInt(10) // 10%
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
    calculateRiskMetrics(volatilityMetrics, liquidityMetrics, currentGasPrice, averageGasPrice) {
        // Volatility Risk (0-100)
        let volatilityRisk = 0;
        if (volatilityMetrics.volatilityScore > MathHelpers.VOLATILITY_THRESHOLDS.CRITICAL * 100) {
            volatilityRisk = 100;
        }
        else if (volatilityMetrics.volatilityScore > MathHelpers.VOLATILITY_THRESHOLDS.HIGH * 100) {
            volatilityRisk = 75;
        }
        else if (volatilityMetrics.volatilityScore > MathHelpers.VOLATILITY_THRESHOLDS.MEDIUM * 100) {
            volatilityRisk = 50;
        }
        else if (volatilityMetrics.volatilityScore > MathHelpers.VOLATILITY_THRESHOLDS.LOW * 100) {
            volatilityRisk = 25;
        }
        // Liquidity Risk (0-100)
        const liquidityRisk = Math.max(0, Math.min(100, (1 - liquidityMetrics.depthScore) * 100 +
            (liquidityMetrics.utilizationRatio > 0.8 ? 20 : 0)));
        // Slippage Risk (0-100)
        const avgSlippage = Array.from(liquidityMetrics.slippageMap.values())
            .reduce((sum, slippage) => sum + slippage, 0) / liquidityMetrics.slippageMap.size;
        const slippageRisk = Math.min(100, avgSlippage * 1000); // Convert to 0-100 scale
        // Gas Risk (0-100)
        const gasPriceRatio = averageGasPrice > BigInt(0) ?
            Number(currentGasPrice) / Number(averageGasPrice) : 1;
        const gasRisk = Math.min(100, Math.max(0, (gasPriceRatio - 1) * 100));
        // Overall Risk (weighted average)
        const overallRisk = Math.round(volatilityRisk * 0.3 +
            liquidityRisk * 0.3 +
            slippageRisk * 0.25 +
            gasRisk * 0.15);
        // Risk Category
        let riskCategory;
        if (overallRisk < 25) {
            riskCategory = 'LOW';
        }
        else if (overallRisk < 50) {
            riskCategory = 'MEDIUM';
        }
        else if (overallRisk < 75) {
            riskCategory = 'HIGH';
        }
        else {
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
    getUniswapV2OutputAmount(amountIn, reserveIn, reserveOut, fee = 0.003) {
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
    getUniswapV3OutputAmount(amountIn, sqrtPriceX96, liquidity, fee = 0.003) {
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
    getCurveOutputAmount(amountIn, balances, amplifier, i, j) {
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
    calculateCompoundInterest(principal, rate, periods, compoundingFrequency = 1) {
        const ratePerPeriod = rate / compoundingFrequency;
        const totalPeriods = periods * compoundingFrequency;
        const multiplier = Math.pow(1 + ratePerPeriod, totalPeriods);
        const result = Number(principal) * multiplier;
        return BigInt(Math.floor(result));
    }
    /**
     * Calculates time-weighted average price (TWAP)
     */
    calculateTWAP(pricePoints, windowSize) {
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
    convertDecimals(amount, fromDecimals, toDecimals) {
        if (fromDecimals === toDecimals) {
            return amount;
        }
        if (fromDecimals > toDecimals) {
            const scaleFactor = BigInt(10) ** BigInt(fromDecimals - toDecimals);
            return amount / scaleFactor;
        }
        else {
            const scaleFactor = BigInt(10) ** BigInt(toDecimals - fromDecimals);
            return amount * scaleFactor;
        }
    }
    /**
     * Formats bigint to human readable string
     */
    formatUnits(amount, decimals = 18, precision = 4) {
        return parseFloat(ethers_1.ethers.formatUnits(amount, decimals)).toFixed(precision);
    }
    /**
     * Parses human readable string to bigint
     */
    parseUnits(amount, decimals = 18) {
        return ethers_1.ethers.parseUnits(amount, decimals);
    }
    /**
     * Clamps a value between min and max
     */
    clamp(value, min, max) {
        if (value < min)
            return min;
        if (value > max)
            return max;
        return value;
    }
    /**
     * Checks if a number is within a percentage tolerance
     */
    isWithinTolerance(value, target, tolerance) {
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
    getPriceImpactWarning(priceImpact) {
        if (priceImpact < 0.01)
            return 'NONE'; // <1%
        if (priceImpact < 0.03)
            return 'LOW'; // 1-3%
        if (priceImpact < 0.05)
            return 'MEDIUM'; // 3-5%
        if (priceImpact < 0.1)
            return 'HIGH'; // 5-10%
        return 'CRITICAL'; // >10%
    }
    /**
     * Calculates gas efficiency score
     */
    calculateGasEfficiency(potentialProfit, gasRequired, gasPrice) {
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
    validateInputs(values, constraints) {
        for (const [key, value] of Object.entries(values)) {
            const constraint = constraints[key];
            if (!constraint)
                continue;
            if (typeof value === 'bigint') {
                const bigintConstraint = constraint;
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
            }
            else {
                const numberConstraint = constraint;
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
    static get WAD_VALUE() {
        return MathHelpers.WAD;
    }
    static get RAY_VALUE() {
        return MathHelpers.RAY;
    }
    static get PRECISION_VALUE() {
        return MathHelpers.PRECISION;
    }
    getVolatilityThresholds() {
        return MathHelpers.VOLATILITY_THRESHOLDS;
    }
    getMaxSlippage() {
        return MathHelpers.MAX_SLIPPAGE;
    }
    getMinLiquidityRatio() {
        return MathHelpers.MIN_LIQUIDITY_RATIO;
    }
    // ========================================
    // 📈 ADVANCED ANALYTICS
    // ========================================
    /**
     * Performs Monte Carlo simulation for profit estimation
     */
    monteCarloSimulation(baseProfit, volatility, iterations = 1000) {
        const results = [];
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
    calculateVaR(portfolioValue, volatility, confidenceLevel = 0.95, timeHorizon = 1) {
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
    getZScore(confidenceLevel) {
        // Approximate inverse normal CDF for common confidence levels
        const zScores = {
            0.90: 1.282,
            0.95: 1.645,
            0.99: 2.326,
            0.995: 2.576,
            0.999: 3.091
        };
        return zScores[confidenceLevel] || 1.645; // Default to 95%
    }
}
exports.MathHelpers = MathHelpers;
//# sourceMappingURL=MathHelpers.js.map