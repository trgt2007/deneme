/**
 * ⚡ Advanced Arbitrage Strategies Configuration
 * 🎯 Multi-Strategy Framework with Dynamic Optimization
 * 🔧 Real-time Parameter Adjustment & Performance Tracking
 * 🛡️ Risk-Aware Strategy Selection & Auto-Tuning
 */

import { ethers } from 'ethers';

// 📊 Strategy Performance Metrics Interface
export interface StrategyMetrics {
  successRate: number;           // Success percentage (0-100)
  avgProfitMargin: number;      // Average profit margin percentage
  avgExecutionTime: number;     // Average execution time in ms
  totalExecutions: number;      // Total strategy executions
  totalProfit: bigint;          // Total profit generated
  avgGasUsed: number;           // Average gas consumption
  maxDrawdown: number;          // Maximum consecutive loss
  sharpeRatio: number;          // Risk-adjusted return ratio
  winRate: number;              // Winning trades percentage
  avgSlippage: number;          // Average slippage percentage
  lastUpdated: number;          // Last metrics update timestamp
}

// 🎯 Strategy Configuration Interface
export interface StrategyConfig {
  name: string;
  enabled: boolean;
  priority: number;             // 1-10 (10 = highest priority)
  type: 'direct' | 'triangle' | 'multihop' | 'crossdex';
  
  // 💰 Profitability Parameters
  minProfitMargin: number;      // Minimum profit margin (%)
  minProfitAmount: bigint;      // Minimum profit in wei
  maxGasPrice: bigint;          // Maximum gas price willing to pay
  gasPriceMultiplier: number;   // Gas price multiplier for priority
  
  // 🔄 Execution Parameters
  maxHops: number;              // Maximum swap hops allowed
  timeout: number;              // Strategy timeout in ms
  retryAttempts: number;        // Number of retry attempts
  retryDelay: number;           // Delay between retries in ms
  
  // 🎲 Risk Management
  maxSlippage: number;          // Maximum allowed slippage (%)
  maxPositionSize: bigint;      // Maximum position size
  stopLossThreshold: number;    // Stop loss threshold (%)
  maxConsecutiveLosses: number; // Max consecutive losses before pause
  
  // 📈 Performance Thresholds
  minSuccessRate: number;       // Minimum success rate to stay active
  performanceWindow: number;    // Performance evaluation window (trades)
  autoAdjustment: boolean;      // Enable automatic parameter adjustment
  
  // 🎯 Strategy-Specific Settings
  specificSettings: Record<string, any>;
  
  // 📊 Current Metrics
  metrics: StrategyMetrics;
}

// 🔧 Strategy Factory Interface
export interface StrategyFactory {
  createStrategy(type: string, params: any): any;
  getOptimalStrategy(tokenA: string, tokenB: string, amount: bigint): StrategyConfig;
  updateStrategyMetrics(strategyName: string, metrics: Partial<StrategyMetrics>): void;
}

// 🌟 Advanced Strategy Configurations
export const STRATEGY_CONFIGS: Record<string, StrategyConfig> = {
  // 🚀 Direct Arbitrage Strategy
  DIRECT_ARBITRAGE: {
    name: 'Direct Arbitrage',
    enabled: true,
    priority: 10,
    type: 'direct',
    
    // Profitability - Ultra-fast execution requirements
    minProfitMargin: 0.15,        // 0.15% minimum for speed
    minProfitAmount: ethers.parseEther('0.001'), // $2 at $2000 ETH
    maxGasPrice: ethers.parseUnits('100', 'gwei'),
    gasPriceMultiplier: 1.1,      // 10% gas premium for speed
    
    // Execution - Speed optimized
    maxHops: 2,                   // A→B direct only
    timeout: 2000,                // 2 second timeout
    retryAttempts: 2,             // Quick retry only
    retryDelay: 100,              // 100ms retry delay
    
    // Risk - Conservative for speed
    maxSlippage: 0.5,            // 0.5% max slippage
    maxPositionSize: ethers.parseEther('100'), // $200k at $2000 ETH
    stopLossThreshold: 2.0,       // 2% stop loss
    maxConsecutiveLosses: 3,      // Pause after 3 losses
    
    // Performance thresholds
    minSuccessRate: 85,           // 85% minimum success rate
    performanceWindow: 50,        // Evaluate over 50 trades
    autoAdjustment: true,
    
    // Direct arbitrage specific settings
    specificSettings: {
      preferredDEXs: ['uniswap_v3', 'sushiswap_v3', 'uniswap_v2'],
      maxPriceAge: 500,           // 500ms max price age
      priceImpactLimit: 0.3,      // 0.3% max price impact
      liquidityThreshold: ethers.parseEther('50'), // $100k min liquidity
      flashloanPreference: 'aave_v3',
      mevProtection: true,
      priorityFee: ethers.parseUnits('2', 'gwei')
    },
    
    metrics: {
      successRate: 0,
      avgProfitMargin: 0,
      avgExecutionTime: 0,
      totalExecutions: 0,
      totalProfit: 0n,
      avgGasUsed: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      winRate: 0,
      avgSlippage: 0,
      lastUpdated: 0
    }
  },

  // 🔺 Triangle Arbitrage Strategy
  TRIANGLE_ARBITRAGE: {
    name: 'Triangle Arbitrage',
    enabled: true,
    priority: 8,
    type: 'triangle',
    
    // Profitability - Higher margins for complexity
    minProfitMargin: 0.3,         // 0.3% minimum for complexity
    minProfitAmount: ethers.parseEther('0.002'), // $4 at $2000 ETH
    maxGasPrice: ethers.parseUnits('80', 'gwei'),
    gasPriceMultiplier: 1.05,     // 5% gas premium
    
    // Execution - Balanced for complexity
    maxHops: 3,                   // A→B→C→A triangle
    timeout: 5000,                // 5 second timeout
    retryAttempts: 3,             // More retries for complex tx
    retryDelay: 200,              // 200ms retry delay
    
    // Risk - Moderate for triangle complexity
    maxSlippage: 0.8,            // 0.8% max slippage
    maxPositionSize: ethers.parseEther('50'), // $100k at $2000 ETH
    stopLossThreshold: 1.5,       // 1.5% stop loss
    maxConsecutiveLosses: 4,      // Allow more attempts
    
    // Performance thresholds
    minSuccessRate: 75,           // 75% minimum success rate
    performanceWindow: 30,        // Evaluate over 30 trades
    autoAdjustment: true,
    
    // Triangle arbitrage specific settings
    specificSettings: {
      preferredTriangles: [
        ['WETH', 'USDC', 'DAI'],
        ['WETH', 'USDT', 'USDC'],
        ['WBTC', 'WETH', 'USDC']
      ],
      balanceThreshold: 0.1,      // 10% balance threshold
      correlationLimit: 0.95,     // Max correlation between assets
      volatilityLimit: 0.05,      // 5% max volatility
      rebalanceFrequency: 300,    // 5 minutes rebalance check
      triangleValidation: true,
      pathOptimization: true
    },
    
    metrics: {
      successRate: 0,
      avgProfitMargin: 0,
      avgExecutionTime: 0,
      totalExecutions: 0,
      totalProfit: 0n,
      avgGasUsed: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      winRate: 0,
      avgSlippage: 0,
      lastUpdated: 0
    }
  },

  // 🔀 Multi-Hop Arbitrage Strategy
  MULTIHOP_ARBITRAGE: {
    name: 'Multi-Hop Arbitrage',
    enabled: true,
    priority: 6,
    type: 'multihop',
    
    // Profitability - Higher margins for complexity
    minProfitMargin: 0.5,         // 0.5% minimum for multi-hop
    minProfitAmount: ethers.parseEther('0.005'), // $10 at $2000 ETH
    maxGasPrice: ethers.parseUnits('60', 'gwei'),
    gasPriceMultiplier: 1.02,     // 2% gas premium
    
    // Execution - Longer timeout for complexity
    maxHops: 5,                   // Up to 5 hops
    timeout: 10000,               // 10 second timeout
    retryAttempts: 2,             // Limited retries for complexity
    retryDelay: 500,              // 500ms retry delay
    
    // Risk - Conservative for complexity
    maxSlippage: 1.2,            // 1.2% max slippage
    maxPositionSize: ethers.parseEther('25'), // $50k at $2000 ETH
    stopLossThreshold: 1.0,       // 1% stop loss
    maxConsecutiveLosses: 2,      // Conservative loss limit
    
    // Performance thresholds
    minSuccessRate: 65,           // 65% minimum success rate
    performanceWindow: 20,        // Evaluate over 20 trades
    autoAdjustment: true,
    
    // Multi-hop specific settings
    specificSettings: {
      maxPathLength: 5,
      pathDiscoveryAlgorithm: 'dijkstra',
      intermediateTokens: ['WETH', 'USDC', 'USDT', 'DAI', 'WBTC'],
      routeOptimization: true,
      gasCostWeighting: 0.7,      // 70% weight on gas efficiency
      priceImpactWeighting: 0.3,  // 30% weight on price impact
      pathCaching: true,
      maxCacheAge: 1000,          // 1 second path cache
      dynamicHopLimit: true
    },
    
    metrics: {
      successRate: 0,
      avgProfitMargin: 0,
      avgExecutionTime: 0,
      totalExecutions: 0,
      totalProfit: 0n,
      avgGasUsed: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      winRate: 0,
      avgSlippage: 0,
      lastUpdated: 0
    }
  },

  // 🌉 Cross-DEX Arbitrage Strategy
  CROSSDEX_ARBITRAGE: {
    name: 'Cross-DEX Arbitrage',
    enabled: true,
    priority: 9,
    type: 'crossdex',
    
    // Profitability - Most common opportunities
    minProfitMargin: 0.2,         // 0.2% minimum cross-DEX
    minProfitAmount: ethers.parseEther('0.0015'), // $3 at $2000 ETH
    maxGasPrice: ethers.parseUnits('90', 'gwei'),
    gasPriceMultiplier: 1.08,     // 8% gas premium
    
    // Execution - Fast cross-DEX execution
    maxHops: 2,                   // Keep simple for speed
    timeout: 3000,                // 3 second timeout
    retryAttempts: 3,             // Retry for network issues
    retryDelay: 150,              // 150ms retry delay
    
    // Risk - Balanced for common strategy
    maxSlippage: 0.6,            // 0.6% max slippage
    maxPositionSize: ethers.parseEther('75'), // $150k at $2000 ETH
    stopLossThreshold: 1.8,       // 1.8% stop loss
    maxConsecutiveLosses: 5,      // Allow more attempts
    
    // Performance thresholds
    minSuccessRate: 80,           // 80% minimum success rate
    performanceWindow: 40,        // Evaluate over 40 trades
    autoAdjustment: true,
    
    // Cross-DEX specific settings
    specificSettings: {
      dexPriority: {
        'uniswap_v3': 10,
        'sushiswap_v3': 9,
        'curve': 8,
        'balancer_v2': 7,
        'uniswap_v2': 6,
        'sushiswap_v2': 5,
        'oneinch': 4
      },
      simultaneousExecution: true,
      crossDexValidation: true,
      latencyOptimization: true,
      failoverStrategy: 'best_alternative',
      dexHealthChecking: true,
      liquidityAggregation: true
    },
    
    metrics: {
      successRate: 0,
      avgProfitMargin: 0,
      avgExecutionTime: 0,
      totalExecutions: 0,
      totalProfit: 0n,
      avgGasUsed: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      winRate: 0,
      avgSlippage: 0,
      lastUpdated: 0
    }
  }
};

// 🎯 Global Strategy Settings
export const GLOBAL_STRATEGY_CONFIG = {
  // 🔄 Execution Framework
  maxConcurrentStrategies: 3,     // Max strategies running simultaneously
  strategyRotationInterval: 300,  // 5 minutes rotation check
  performanceEvaluationInterval: 600, // 10 minutes performance review
  
  // 📊 Performance Tracking
  metricsRetentionPeriod: 86400,  // 24 hours metrics retention
  performanceHistoryLimit: 1000,  // Max performance records
  benchmarkUpdateInterval: 3600,  // 1 hour benchmark update
  
  // 🛡️ Risk Management
  globalStopLoss: 5.0,            // 5% global stop loss
  dailyLossLimit: ethers.parseEther('1'), // $2k daily loss limit
  maxPositionSizeRatio: 0.1,      // 10% of available capital
  emergencyShutdownThreshold: 10.0, // 10% emergency shutdown
  
  // ⚡ Auto-Optimization
  autoOptimization: {
    enabled: true,
    optimizationInterval: 1800,   // 30 minutes optimization cycle
    parameterAdjustmentStep: 0.05, // 5% parameter adjustment
    minSampleSize: 10,            // Minimum trades for optimization
    confidenceLevel: 0.95,        // 95% confidence for changes
    rollbackOnPoorPerformance: true
  },
  
  // 🎨 Strategy Selection Algorithm
  selectionAlgorithm: {
    method: 'weighted_performance', // weighted_performance | round_robin | best_only
    weightFactors: {
      successRate: 0.3,
      profitMargin: 0.25,
      executionSpeed: 0.2,
      gasEfficiency: 0.15,
      reliability: 0.1
    },
    dynamicWeighting: true,
    adaptationRate: 0.1           // 10% adaptation rate
  }
};

// 🔧 Strategy Performance Analyzer
export class StrategyPerformanceAnalyzer {
  private strategies: Map<string, StrategyConfig> = new Map();
  private performanceHistory: Map<string, StrategyMetrics[]> = new Map();

  constructor() {
    // Initialize strategies
    Object.entries(STRATEGY_CONFIGS).forEach(([key, config]) => {
      this.strategies.set(key, config);
      this.performanceHistory.set(key, []);
    });
  }

  // 📈 Update strategy metrics
  updateMetrics(strategyName: string, newMetrics: Partial<StrategyMetrics>): void {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) return;

    // Update current metrics
    strategy.metrics = { ...strategy.metrics, ...newMetrics, lastUpdated: Date.now() };
    
    // Add to history
    const history = this.performanceHistory.get(strategyName) || [];
    history.push({ ...strategy.metrics });
    
    // Limit history size
    if (history.length > GLOBAL_STRATEGY_CONFIG.performanceHistoryLimit) {
      history.shift();
    }
    
    this.performanceHistory.set(strategyName, history);
  }

  // 🎯 Get optimal strategy for opportunity
  getOptimalStrategy(
    tokenA: string,
    tokenB: string,
    amount: bigint,
    context: any = {}
  ): StrategyConfig | null {
    const availableStrategies = Array.from(this.strategies.values())
      .filter(s => s.enabled && s.metrics.successRate >= s.minSuccessRate);

    if (availableStrategies.length === 0) return null;

    // Calculate strategy scores
    const scoredStrategies = availableStrategies.map(strategy => ({
      strategy,
      score: this.calculateStrategyScore(strategy, context)
    }));

    // Sort by score descending
    scoredStrategies.sort((a, b) => b.score - a.score);

    return scoredStrategies[0]?.strategy || null;
  }

  // 🧮 Calculate strategy performance score
  private calculateStrategyScore(strategy: StrategyConfig, context: any): number {
    const weights = GLOBAL_STRATEGY_CONFIG.selectionAlgorithm.weightFactors;
    const metrics = strategy.metrics;

    const successScore = (metrics.successRate / 100) * weights.successRate;
    const profitScore = Math.min(metrics.avgProfitMargin / 2, 1) * weights.profitMargin;
    const speedScore = Math.max(0, 1 - (metrics.avgExecutionTime / 10000)) * weights.executionSpeed;
    const gasScore = Math.max(0, 1 - (metrics.avgGasUsed / 500000)) * weights.gasEfficiency;
    const reliabilityScore = Math.max(0, 1 - (metrics.maxDrawdown / 10)) * weights.reliability;

    return successScore + profitScore + speedScore + gasScore + reliabilityScore;
  }

  // 🔄 Auto-optimize strategy parameters
  optimizeStrategies(): void {
    if (!GLOBAL_STRATEGY_CONFIG.autoOptimization.enabled) return;

    this.strategies.forEach((strategy, name) => {
      const history = this.performanceHistory.get(name) || [];
      
      if (history.length < GLOBAL_STRATEGY_CONFIG.autoOptimization.minSampleSize) return;

      // Calculate recent performance
      const recentMetrics = history.slice(-10);
      const avgSuccessRate = recentMetrics.reduce((sum, m) => sum + m.successRate, 0) / recentMetrics.length;
      
      // Adjust parameters based on performance
      if (avgSuccessRate < strategy.minSuccessRate) {
        this.adjustStrategyParameters(strategy, 'conservative');
      } else if (avgSuccessRate > strategy.minSuccessRate + 10) {
        this.adjustStrategyParameters(strategy, 'aggressive');
      }
    });
  }

  // ⚙️ Adjust strategy parameters
  private adjustStrategyParameters(strategy: StrategyConfig, direction: 'conservative' | 'aggressive'): void {
    const adjustment = GLOBAL_STRATEGY_CONFIG.autoOptimization.parameterAdjustmentStep;
    
    if (direction === 'conservative') {
      // Make strategy more conservative
      strategy.minProfitMargin *= (1 + adjustment);
      strategy.maxSlippage *= (1 - adjustment);
      strategy.maxPositionSize = strategy.maxPositionSize * 95n / 100n;
    } else {
      // Make strategy more aggressive
      strategy.minProfitMargin *= (1 - adjustment);
      strategy.maxSlippage *= (1 + adjustment);
      strategy.maxPositionSize = strategy.maxPositionSize * 105n / 100n;
    }
  }

  // 📊 Get strategy analytics
  getStrategyAnalytics(strategyName: string): any {
    const strategy = this.strategies.get(strategyName);
    const history = this.performanceHistory.get(strategyName) || [];
    
    if (!strategy || history.length === 0) return null;

    return {
      current: strategy.metrics,
      trend: this.calculateTrend(history),
      performance: this.calculatePerformanceMetrics(history),
      ranking: this.getStrategyRanking(strategyName)
    };
  }

  // 📈 Calculate performance trend
  private calculateTrend(history: StrategyMetrics[]): any {
    if (history.length < 2) return { direction: 'neutral', change: 0 };

    const recent = history.slice(-5);
    const older = history.slice(-10, -5);

    const recentAvg = recent.reduce((sum, m) => sum + m.successRate, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.successRate, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    return {
      direction: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
      change: Math.round(change * 100) / 100
    };
  }

  // 🏆 Calculate detailed performance metrics
  private calculatePerformanceMetrics(history: StrategyMetrics[]): any {
    if (history.length === 0) return {};

    const successRates = history.map(h => h.successRate);
    const profitMargins = history.map(h => h.avgProfitMargin);

    return {
      volatility: this.calculateVolatility(successRates),
      consistency: this.calculateConsistency(successRates),
      trend: this.calculateLinearTrend(profitMargins),
      peakPerformance: Math.max(...successRates),
      worstPerformance: Math.min(...successRates)
    };
  }

  // 📊 Calculate strategy ranking
  private getStrategyRanking(strategyName: string): number {
    const strategies = Array.from(this.strategies.entries())
      .map(([name, strategy]) => ({
        name,
        score: this.calculateStrategyScore(strategy, {})
      }))
      .sort((a, b) => b.score - a.score);

    return strategies.findIndex(s => s.name === strategyName) + 1;
  }

  // 🧮 Helper calculation methods
  private calculateVolatility(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateConsistency(values: number[]): number {
    const volatility = this.calculateVolatility(values);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    return mean > 0 ? (1 - (volatility / mean)) * 100 : 0;
  }

  private calculateLinearTrend(values: number[]): number {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((sum, v) => sum + v, 0);
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = x.reduce((sum, v, i) => sum + v * values[i], 0);
    const sumXX = x.reduce((sum, v) => sum + v * v, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }
}

// 🚀 Strategy Manager Factory
export const createStrategyManager = (): StrategyPerformanceAnalyzer => {
  return new StrategyPerformanceAnalyzer();
};

// 📝 Strategy configuration validation
export const validateStrategyConfig = (config: StrategyConfig): boolean => {
  return (
    !!config.name && config.name.length > 0 &&
    config.priority >= 1 && config.priority <= 10 &&
    config.minProfitMargin >= 0 &&
    config.maxSlippage > 0 && config.maxSlippage < 10 &&
    config.timeout > 0 &&
    config.retryAttempts >= 0
  );
};

// 📊 Export configuration summary
export const getConfigurationSummary = () => ({
  totalStrategies: Object.keys(STRATEGY_CONFIGS).length,
  enabledStrategies: Object.values(STRATEGY_CONFIGS).filter(s => s.enabled).length,
  highPriorityStrategies: Object.values(STRATEGY_CONFIGS).filter(s => s.priority >= 8).length,
  avgMinProfitMargin: Object.values(STRATEGY_CONFIGS).reduce((sum, s) => sum + s.minProfitMargin, 0) / Object.keys(STRATEGY_CONFIGS).length,
  totalMaxPositionSize: Object.values(STRATEGY_CONFIGS).reduce((sum, s) => sum + s.maxPositionSize, 0n),
  configVersion: '1.0.0',
  lastUpdated: new Date().toISOString()
});

export default STRATEGY_CONFIGS;