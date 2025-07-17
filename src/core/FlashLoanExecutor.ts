/**
 * @title FlashLoanExecutor
 * @author Arbitrage Bot System
 * @notice Flashloan işlemlerini yöneten executor
 * @dev Smart contract etkileşimi, transaction building, gas optimization ve retry logic
 */

import { EventEmitter } from 'events';
import { ethers } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { TransactionRequest, TransactionResponse } from '@ethersproject/abstract-provider';
import { Logger } from '../utils/Logger';
import { GasMonitor } from '../monitors/GasMonitor';
import { MEVProtection } from '../services/MEVProtection';
import { DatabaseService } from '../services/DatabaseService';
import { 
  ArbitrageOpportunity,
  ExecutionResult,
  FlashLoanConfig,
  SwapRoute,
  TransactionStatus,
  GasStrategy,
  ExecutionMetrics,
  RetryStrategy
} from '../types';
import { 
  FLASHLOAN_ARBITRAGE_ABI,
  FLASHLOAN_ARBITRAGE_ADDRESS,
  AAVE_POOL_ADDRESS 
} from '../constants';

/**
 * @class FlashLoanExecutor
 * @notice Flashloan execution manager sınıfı
 * @dev EventEmitter'dan türetilmiş, gas optimized transaction yönetimi
 */
export class FlashLoanExecutor extends EventEmitter {
  // ============ Private Properties ============
  
  /**
   * @notice Executor konfigürasyonu
   */
  private config: FlashLoanConfig;
  
  /**
   * @notice Ethereum provider
   */
  private provider!: Provider;
  
  /**
   * @notice Execution wallet
   */
  private wallet!: ethers.Wallet;
  
  /**
   * @notice FlashLoanArbitrage contract instance
   */
  private arbitrageContract!: ethers.Contract;
  
  /**
   * @notice Aave Pool contract instance
   */
  private aavePool!: ethers.Contract;
  
  /**
   * @notice Gas monitor instance
   */
  private gasMonitor!: GasMonitor;
  
  /**
   * @notice MEV protection service
   */
  private mevProtection!: MEVProtection;
  
  /**
   * @notice Database service
   */
  private databaseService!: DatabaseService;
  
  /**
   * @notice Logger instance
   */
  private logger: any;
  
  /**
   * @notice Active transactions map
   */
  private activeTransactions: Map<string, TransactionStatus> = new Map();
  
  /**
   * @notice Transaction nonce manager
   */
  private nonceManager: NonceManager;
  
  /**
   * @notice Gas price cache
   */
  private gasPriceCache: {
    lastUpdate: number;
    baseFee: bigint;
    priorityFee: bigint;
  } | null = null;
  
  /**
   * @notice Execution metrics
   */
  private metrics: ExecutionMetrics = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    totalGasUsed: BigInt(0),
    averageGasPrice: BigInt(0),
    averageExecutionTime: 0,
    lastExecutionTime: 0
  };
  
  /**
   * @notice Retry strategy configuration
   */
  private retryStrategy: RetryStrategy = {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    backoffMultiplier: 2,
    maxRetryDelay: 10000 // 10 seconds
  };
  
  // ============ Constructor ============
  
  /**
   * @notice FlashLoanExecutor constructor
   * @param config FlashLoan konfigürasyonu
   */
  constructor(config: FlashLoanConfig) {
    super();
    
    this.config = config;
    // Logger'ı geçici olarak mock edelim
    this.logger = {
      info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
      warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
      error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
      debug: (message: string, meta?: any) => console.log(`[DEBUG] ${message}`, meta || '')
    } as Logger;
    
    // Initialize provider and wallet first
    this.initializeProvider();
    this.initializeWallet();
    
    // Initialize contracts
    this.initializeContracts();
    
    // Initialize services
    this.initializeServices();
    
    // Setup nonce manager
    this.nonceManager = new NonceManager(this.wallet);
    
    this.logger.info('FlashLoanExecutor initialized', {
      address: this.wallet.address,
      arbitrageContract: FLASHLOAN_ARBITRAGE_ADDRESS
    });
  }
  
  // ============ Public Methods ============
  
  /**
   * @notice Arbitraj fırsatını execute eder
   * @param opportunity Arbitraj fırsatı
   * @return ExecutionResult
   */
  public async execute(opportunity: ArbitrageOpportunity): Promise<ExecutionResult> {
    const startTime = Date.now();
    const executionId = this.generateExecutionId();
    
    this.logger.info('Starting flashloan execution', {
      executionId,
      token: opportunity.token,
      amount: ethers.formatEther(opportunity.amountIn),
      expectedProfit: ethers.formatEther(opportunity.expectedProfit)
    });
    
    try {
      // Pre-execution validation
      await this.validatePreExecution(opportunity);
      
      // Build transaction
      const tx = await this.buildTransaction(opportunity);
      
      // Simulate transaction
      const simulationResult = await this.simulateTransaction(tx);
      if (!simulationResult.success) {
        throw new Error(`Simulation failed: ${simulationResult.reason}`);
      }
      
      // Execute with retry logic
      const txResponse = await this.executeWithRetry(tx, executionId);
      
      // Wait for confirmation
      const receipt = await this.waitForConfirmation(txResponse, executionId);
      
      // Process result
      const result = await this.processExecutionResult(
        opportunity,
        receipt,
        startTime,
        executionId
      );
      
      // Update metrics
      this.updateMetrics(result);
      
      // Emit success event
      this.emit('execution:success', result);
      
      return result;
      
    } catch (error) {
      const result = this.handleExecutionError(
        opportunity,
        error,
        startTime,
        executionId
      );
      
      // Emit failure event
      this.emit('execution:failed', result);
      
      return result;
    } finally {
      // Cleanup
      this.activeTransactions.delete(executionId);
    }
  }
  
  /**
   * @notice Aktif transaction'ları döndürür
   */
  public getActiveTransactions(): TransactionStatus[] {
    return Array.from(this.activeTransactions.values());
  }
  
  /**
   * @notice Execution metriklerini döndürür
   */
  public getMetrics(): ExecutionMetrics {
    return { ...this.metrics };
  }
  
  /**
   * @notice Gas stratejisini günceller
   */
  public updateGasStrategy(strategy: GasStrategy): void {
    this.config.gasStrategy = strategy;
    this.logger.info('Gas strategy updated', { strategy });
  }
  
  /**
   * @notice Retry stratejisini günceller
   */
  public updateRetryStrategy(strategy: RetryStrategy): void {
    this.retryStrategy = { ...strategy };
    this.logger.info('Retry strategy updated', { retryStrategy: JSON.stringify(strategy) });
  }
  
  // ============ Private Initialization Methods ============
  
  /**
   * @notice Provider'ı initialize eder
   */
  private initializeProvider(): void {
    if (this.config.customProvider) {
      this.provider = this.config.customProvider;
    } else {
      // ethers v6 uyumlu provider
      this.provider = new ethers.AlchemyProvider(
        this.config.network || 'mainnet',
        this.config.alchemyApiKey
      ) as any;
    }
  }
  
  /**
   * @notice Wallet'ı initialize eder
   */
  private initializeWallet(): void {
    if (!this.config.privateKey) {
      throw new Error('Private key not provided');
    }
    
    this.wallet = new ethers.Wallet(this.config.privateKey, this.provider as any);
  }
  
  /**
   * @notice Contract'ları initialize eder
   */
  private initializeContracts(): void {
    // Initialize FlashLoanArbitrage contract
    this.arbitrageContract = new ethers.Contract(
      FLASHLOAN_ARBITRAGE_ADDRESS,
      FLASHLOAN_ARBITRAGE_ABI,
      this.wallet
    );
    
    // Initialize Aave Pool contract
    this.aavePool = new ethers.Contract(
      AAVE_POOL_ADDRESS,
      ['function getReserveData(address asset) view returns (tuple)'],
      this.provider as any
    );
  }
  
  /**
   * @notice Servisleri initialize eder
   */
  private initializeServices(): void {
    this.gasMonitor = new GasMonitor({
      provider: this.provider as any,
      updateInterval: 5000 // 5 seconds
    });
    
    this.mevProtection = new MEVProtection(this.provider as any, {
      enabled: true,
      maxGasPriceGwei: 50,
      flashbotsEnabled: Boolean(this.config.flashbotsRpc)
    });
    
    this.databaseService = new DatabaseService(this.config.databaseConfig);
  }
  
  // ============ Transaction Building Methods ============
  
  /**
   * @notice Transaction'ı build eder
   * @param opportunity Arbitraj fırsatı
   * @return TransactionRequest
   */
  private async buildTransaction(
    opportunity: ArbitrageOpportunity
  ): Promise<TransactionRequest> {
    // Encode swap routes
    const encodedParams = await this.encodeArbitrageParams(opportunity);
    
    // Get optimal gas parameters
    const gasParams = await this.getOptimalGasParams();
    
    // Build transaction
    const tx: TransactionRequest = {
      to: FLASHLOAN_ARBITRAGE_ADDRESS,
      from: this.wallet.address,
      data: this.arbitrageContract.interface.encodeFunctionData(
        'executeArbitrage',
        [
          opportunity.token,
          opportunity.amountIn,
          encodedParams
        ]
      ),
      gasLimit: await this.estimateGasLimit(opportunity),
      ...gasParams,
      nonce: await this.nonceManager.getNextNonce()
    };
    
    this.logger.debug('Transaction built', {
      to: tx.to,
      gasLimit: tx.gasLimit?.toString(),
      maxFeePerGas: tx.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString()
    });
    
    return tx;
  }
  
  /**
   * @notice Arbitraj parametrelerini encode eder
   * @param opportunity Arbitraj fırsatı
   * @return Encoded parameters
   */
  private async encodeArbitrageParams(
    opportunity: ArbitrageOpportunity
  ): Promise<string> {
    const dexPath: string[] = [];
    const amounts: bigint[] = [];
    const tokens: string[] = [];
    const swapData: string[] = [];
    
    for (const route of opportunity.routes) {
      dexPath.push(route.dexName);
      amounts.push(route.minimumAmountOut);
      tokens.push(route.tokenOut);
      swapData.push(await this.encodeSwapData(route));
    }
    
    return ethers.AbiCoder.defaultAbiCoder().encode(
      ['string[]', 'uint256[]', 'address[]', 'bytes[]'],
      [dexPath, amounts, tokens, swapData]
    );
  }
  
  /**
   * @notice Swap data'sını encode eder
   * @param route Swap route
   * @return Encoded swap data
   */
  private async encodeSwapData(route: SwapRoute): Promise<string> {
    switch (route.dexName) {
      case 'UniswapV3':
        return ethers.AbiCoder.defaultAbiCoder().encode(
          ['uint24', 'uint160'],
          [route.fee || 3000, route.sqrtPriceLimitX96 || 0]
        );
        
      case 'SushiSwap':
        return '0x'; // No additional data needed
        
      case 'Curve':
        return ethers.AbiCoder.defaultAbiCoder().encode(
          ['int128', 'int128'],
          [route.fromIndex || 0, route.toIndex || 1]
        );
        
      case '1inch':
        return ethers.AbiCoder.defaultAbiCoder().encode(
          ['address', 'bytes', 'bytes'],
          [route.executor || ethers.ZeroAddress, '0x', route.executorData || '0x']
        );
        
      case 'Balancer':
        return ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes32', 'bytes'],
          [route.poolId || '0x', route.userData || '0x']
        );
        
      default:
        throw new Error(`Unknown DEX: ${route.dexName}`);
    }
  }
  
  // ============ Gas Optimization Methods ============
  
  /**
   * @notice Optimal gas parametrelerini hesaplar
   * @return Gas parameters
   */
  private async getOptimalGasParams(): Promise<{
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    gasPrice?: bigint;
  }> {
    // Update gas price cache if needed
    if (!this.gasPriceCache || Date.now() - this.gasPriceCache.lastUpdate > 5000) {
      await this.updateGasPriceCache();
    }
    
    const strategy = this.config.gasStrategy || GasStrategy.ADAPTIVE;
    
    switch (strategy) {
      case GasStrategy.AGGRESSIVE:
        return this.getAggressiveGasParams();
        
      case GasStrategy.NORMAL:
        return this.getNormalGasParams();
        
      case GasStrategy.CONSERVATIVE:
        return this.getConservativeGasParams();
        
      case GasStrategy.ADAPTIVE:
      default:
        return this.getAdaptiveGasParams();
    }
  }
  
  /**
   * @notice Aggressive gas parametreleri (hızlı confirmation)
   */
  private getAggressiveGasParams(): {
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  } {
    const baseFee = this.gasPriceCache!.baseFee;
    const priorityFee = this.gasPriceCache!.priorityFee * BigInt(150) / BigInt(100); // 150% priority
    
    return {
      maxPriorityFeePerGas: priorityFee,
      maxFeePerGas: baseFee * BigInt(2) + priorityFee // 2x base + priority
    };
  }
  
  /**
   * @notice Normal gas parametreleri
   */
  private getNormalGasParams(): {
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  } {
    const baseFee = this.gasPriceCache!.baseFee;
    const priorityFee = this.gasPriceCache!.priorityFee;
    
    return {
      maxPriorityFeePerGas: priorityFee,
      maxFeePerGas: baseFee * BigInt(125) / BigInt(100) + priorityFee // 1.25x base + priority
    };
  }
  
  /**
   * @notice Conservative gas parametreleri (düşük maliyet)
   */
  private getConservativeGasParams(): {
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  } {
    const baseFee = this.gasPriceCache!.baseFee;
    const priorityFee = this.gasPriceCache!.priorityFee * BigInt(75) / BigInt(100); // 75% priority
    
    return {
      maxPriorityFeePerGas: priorityFee,
      maxFeePerGas: baseFee + priorityFee
    };
  }
  
  /**
   * @notice Adaptive gas parametreleri (profit bazlı)
   */
  private async getAdaptiveGasParams(): Promise<{
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  }> {
    const baseFee = this.gasPriceCache!.baseFee;
    let priorityFee = this.gasPriceCache!.priorityFee;
    
    // Get pending transaction count
    const pendingCount = await this.getPendingTransactionCount();
    
    // Adjust priority based on congestion
    if (pendingCount > 100) {
      priorityFee = priorityFee * BigInt(200) / BigInt(100); // 2x for high congestion
    } else if (pendingCount > 50) {
      priorityFee = priorityFee * BigInt(150) / BigInt(100); // 1.5x for medium congestion
    }
    
    return {
      maxPriorityFeePerGas: priorityFee,
      maxFeePerGas: baseFee * BigInt(150) / BigInt(100) + priorityFee // 1.5x base + priority
    };
  }
  
  /**
   * @notice Gas price cache'i günceller
   */
  private async updateGasPriceCache(): Promise<void> {
    try {
      const block = await (this.provider as any).getBlock('latest');
      const baseFee = block?.baseFeePerGas || ethers.parseUnits('20', 'gwei');
      
      // Get priority fee from recent blocks
      const priorityFee = await this.estimatePriorityFee();
      
      this.gasPriceCache = {
        lastUpdate: Date.now(),
        baseFee,
        priorityFee
      };
    } catch (error) {
      // Fallback values
      this.gasPriceCache = {
        lastUpdate: Date.now(),
        baseFee: ethers.parseUnits('20', 'gwei'),
        priorityFee: ethers.parseUnits('2', 'gwei')
      };
    }
  }
  
  /**
   * @notice Priority fee tahmin eder
   */
  private async estimatePriorityFee(): Promise<bigint> {
    try {
      // Get fee history
      const feeHistory = await (this.provider as any).send('eth_feeHistory', [
        10, // Last 10 blocks
        'latest',
        [25, 50, 75] // Percentiles
      ]);
      
      // Use 75th percentile for aggressive pricing
      const recentFees = feeHistory.reward.map((r: string[]) => 
        BigInt(r[2] || '0')
      );
      
      const avgFee = recentFees.reduce((a: bigint, b: bigint) => 
        a + b, BigInt(0)
      ) / BigInt(recentFees.length);
      
      return avgFee;
      
    } catch (error) {
      // Fallback to default
      return ethers.parseUnits('2', 'gwei');
    }
  }
  
  /**
   * @notice Gas limit tahmin eder
   */
  private async estimateGasLimit(opportunity: ArbitrageOpportunity): Promise<bigint> {
    try {
      // Base gas for flashloan
      let gasEstimate = BigInt(150000);
      
      // Add gas per swap
      gasEstimate = gasEstimate + BigInt(100000 * opportunity.routes.length);
      
      // Add 20% buffer
      return gasEstimate * BigInt(120) / BigInt(100);
      
    } catch (error) {
      // Fallback to safe default
      return BigInt(500000);
    }
  }
  
  // ============ Transaction Simulation Methods ============
  
  /**
   * @notice Transaction'ı simüle eder
   * @param tx Transaction request
   * @return Simulation result
   */
  private async simulateTransaction(tx: TransactionRequest): Promise<{
    success: boolean;
    reason?: string;
    gasUsed?: bigint;
  }> {
    try {
      // Use eth_call to simulate
      const result = await (this.provider as any).call(tx);
      
      // Decode result to check success
      const decoded = this.arbitrageContract.interface.decodeFunctionResult(
        'executeArbitrage',
        result
      );
      
      // Estimate actual gas usage
      const gasUsed = await (this.provider as any).estimateGas(tx);
      
      return {
        success: true,
        gasUsed: typeof gasUsed === 'bigint' ? gasUsed : BigInt(gasUsed.toString())
      };
      
    } catch (error: any) {
      // Try to decode revert reason
      let reason = 'Unknown error';
      
      if (error.data) {
        try {
          reason = ethers.toUtf8String('0x' + error.data.substr(138));
        } catch {
          reason = (error as Error).message || 'Simulation failed';
        }
      }
      
      this.logger.warn('Transaction simulation failed', { reason });
      
      return {
        success: false,
        reason
      };
    }
  }
  
  // ============ Transaction Execution Methods ============
  
  /**
   * @notice Transaction'ı retry logic ile execute eder
   * @param tx Transaction request
   * @param executionId Execution ID
   * @return Transaction response
   */
  private async executeWithRetry(
    tx: TransactionRequest,
    executionId: string
  ): Promise<any> {
    let lastError: Error | null = null;
    let retryCount = 0;
    let delay = this.retryStrategy.retryDelay;
    
    while (retryCount <= this.retryStrategy.maxRetries) {
      try {
        // Update transaction status
        this.updateTransactionStatus(executionId, {
          status: 'pending',
          retryCount,
          lastUpdate: Date.now()
        });
        
        // Execute transaction
        const txResponse = await this.sendTransaction(tx);
        
        // Update status
        this.updateTransactionStatus(executionId, {
          status: 'sent',
          txHash: txResponse.hash,
          lastUpdate: Date.now()
        });
        
        return txResponse;
        
      } catch (error: any) {
        lastError = error;
        
        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          throw error;
        }
        
        // Log retry attempt
        this.logger.warn(`Transaction failed, retry ${retryCount + 1}/${this.retryStrategy.maxRetries}`, {
          error: (error as Error).message,
          executionId
        });
        
        // Wait before retry
        await this.delay(delay);
        
        // Update gas price for retry
        const newGasParams = await this.getOptimalGasParams();
        tx = { ...tx, ...newGasParams };
        
        // Increase nonce if needed
        if (error.code === 'NONCE_EXPIRED') {
          tx.nonce = await this.nonceManager.getNextNonce(true);
        }
        
        // Update delay with backoff
        delay = Math.min(
          delay * this.retryStrategy.backoffMultiplier,
          this.retryStrategy.maxRetryDelay
        );
        
        retryCount++;
      }
    }
    
    // All retries failed
    throw lastError || new Error('Transaction failed after all retries');
  }
  
  /**
   * @notice Transaction gönderir (MEV korumalı)
   * @param tx Transaction request
   * @return Transaction response
   */
  private async sendTransaction(tx: TransactionRequest): Promise<any> {
    // Check if MEV protection is enabled
    if (this.config.useMevProtection) {
      return await this.mevProtection.sendTransaction(tx);
    } else {
      return await (this.wallet as any).sendTransaction(tx);
    }
  }
  
  /**
   * @notice Transaction confirmation bekler
   * @param txResponse Transaction response
   * @param executionId Execution ID
   * @return Transaction receipt
   */
  private async waitForConfirmation(
    txResponse: any,
    executionId: string
  ): Promise<any> {
    this.logger.info('Waiting for transaction confirmation', {
      txHash: txResponse.hash,
      executionId
    });
    
    // Update status
    this.updateTransactionStatus(executionId, {
      status: 'confirming',
      txHash: txResponse.hash,
      lastUpdate: Date.now()
    });
    
    // Wait for confirmation
    const confirmations = this.config.requiredConfirmations || 1;
    const receipt = await txResponse.wait(confirmations);
    
    // Check if transaction was successful
    if (receipt.status === 0) {
      throw new Error('Transaction reverted');
    }
    
    return receipt;
  }
  
  // ============ Result Processing Methods ============
  
  /**
   * @notice Execution sonucunu işler
   * @param opportunity Arbitraj fırsatı
   * @param receipt Transaction receipt
   * @param startTime Başlangıç zamanı
   * @param executionId Execution ID
   * @return ExecutionResult
   */
  private async processExecutionResult(
    opportunity: ArbitrageOpportunity,
    receipt: any,
    startTime: number,
    executionId: string
  ): Promise<ExecutionResult> {
    // Parse events to get actual profit
    const profit = await this.parseProfit(receipt);
    
    // Calculate gas cost
    const gasUsed = receipt.gasUsed;
    const gasPrice = receipt.effectiveGasPrice || receipt.gasPrice;
    const gasCost = typeof gasUsed === 'bigint' && typeof gasPrice === 'bigint' 
      ? gasUsed * gasPrice 
      : BigInt(gasUsed.toString()) * BigInt(gasPrice.toString());
    
    // Calculate net profit
    const netProfit = profit - gasCost;
    
    // Build result
    const result: ExecutionResult = {
      success: true,
      opportunity,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed,
      gasPrice,
      gasCost,
      profit: netProfit,
      executionTime: Date.now() - startTime,
      executionId
    };
    
    // Record to database
    await this.databaseService.recordExecution(result);
    
    this.logger.info('Arbitrage executed successfully', {
      txHash: receipt.transactionHash,
      profit: ethers.formatEther(netProfit),
      gasUsed: gasUsed.toString(),
      executionTime: result.executionTime
    });
    
    return result;
  }
  
  /**
   * @notice Transaction receipt'ten profit parse eder
   * @param receipt Transaction receipt
   * @return Profit amount
   */
  private async parseProfit(
    receipt: any
  ): Promise<bigint> {
    try {
      // Find ArbitrageExecuted event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.arbitrageContract.interface.parseLog(log);
          return parsed?.name === 'ArbitrageExecuted';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = this.arbitrageContract.interface.parseLog(event);
        return parsed?.args.profit || BigInt(0);
      }
      
      // Fallback: estimate from balance change
      return BigInt(0);
      
    } catch (error) {
      this.logger.error('Failed to parse profit from receipt', { error: String(error) });
      return BigInt(0);
    }
  }
  
  // ============ Error Handling Methods ============
  
  /**
   * @notice Execution error'unu handle eder
   * @param opportunity Arbitraj fırsatı
   * @param error Error object
   * @param startTime Başlangıç zamanı
   * @param executionId Execution ID
   * @return ExecutionResult
   */
  private handleExecutionError(
    opportunity: ArbitrageOpportunity,
    error: any,
    startTime: number,
    executionId: string
  ): ExecutionResult {
    this.logger.error('Arbitrage execution failed', {
      error: (error as Error).message,
      executionId
    });
    
    // Update metrics
    this.metrics.failedExecutions++;
    
    // Build error result
    const result: ExecutionResult = {
      success: false,
      opportunity,
      error,
      executionTime: Date.now() - startTime,
      executionId
    };
    
    // Record failure
    this.databaseService.recordFailure(result).catch(err => 
      this.logger.error('Failed to record execution failure', err)
    );
    
    return result;
  }
  
  /**
   * @notice Error'un retry edilebilir olup olmadığını kontrol eder
   * @param error Error object
   * @return boolean
   */
  private isRetryableError(error: any): boolean {
    const retryableCodes = [
      'NONCE_EXPIRED',
      'REPLACEMENT_UNDERPRICED',
      'TRANSACTION_REPLACED',
      'TIMEOUT',
      'NETWORK_ERROR'
    ];
    
    return retryableCodes.includes(error.code) ||
           (error as Error).message?.includes('timeout') ||
           (error as Error).message?.includes('network');
  }
  
  // ============ Helper Methods ============
  
  /**
   * @notice Pre-execution validation
   * @param opportunity Arbitraj fırsatı
   */
  private async validatePreExecution(opportunity: ArbitrageOpportunity): Promise<void> {
    // Check deadline
    if (Date.now() > opportunity.deadline) {
      throw new Error('Opportunity deadline exceeded');
    }
    
    // Check wallet balance for gas
    const balance = await (this.wallet as any).provider.getBalance(this.wallet.address);
    const estimatedGasCost = opportunity.estimatedGas * (
      this.gasPriceCache?.baseFee || ethers.parseUnits('50', 'gwei')
    );
    
    if (balance < estimatedGasCost) {
      throw new Error('Insufficient balance for gas');
    }
    
    // Check contract is not paused
    try {
      const isPaused = await this.arbitrageContract.paused();
      if (isPaused) {
        throw new Error('Arbitrage contract is paused');
      }
    } catch (error) {
      // Contract might not have paused function, continue
    }
    
    // Validate routes
    if (opportunity.routes.length === 0) {
      throw new Error('No routes provided');
    }
  }
  
  /**
   * @notice Execution ID generate eder
   * @return Execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * @notice Transaction status'unu günceller
   * @param executionId Execution ID
   * @param status Status update
   */
  private updateTransactionStatus(executionId: string, status: Partial<TransactionStatus>): void {
    const current = this.activeTransactions.get(executionId) || {
      executionId,
      status: 'pending' as const,
      createdAt: Date.now(),
      lastUpdate: Date.now()
    };
    
    this.activeTransactions.set(executionId, {
      ...current,
      ...status,
      lastUpdate: status.lastUpdate || Date.now()
    });
  }
  
  /**
   * @notice Metrikleri günceller
   * @param result Execution result
   */
  private updateMetrics(result: ExecutionResult): void {
    this.metrics.totalExecutions++;
    
    if (result.success) {
      this.metrics.successfulExecutions++;
      this.metrics.totalGasUsed = this.metrics.totalGasUsed + (result.gasUsed || BigInt(0));
    } else {
      this.metrics.failedExecutions++;
    }
    
    // Update average execution time
    const executionTime = result.executionTime || 0;
    const totalTime = this.metrics.averageExecutionTime * (this.metrics.totalExecutions - 1);
    this.metrics.averageExecutionTime = (totalTime + executionTime) / this.metrics.totalExecutions;
    
    this.metrics.lastExecutionTime = Date.now();
  }
  
  /**
   * @notice Bekleyen transaction sayısını alır
   */
  private async getPendingTransactionCount(): Promise<number> {
    try {
      const pending = await (this.provider as any).send('eth_getBlockByNumber', ['pending', false]);
      return pending.transactions.length;
    } catch {
      return 0;
    }
  }
  
  /**
   * @notice Delay utility
   * @param ms Milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * @class NonceManager
 * @notice Transaction nonce yönetimi
 */
class NonceManager {
  private wallet: ethers.Wallet;
  private currentNonce: number | null = null;
  private lastUpdate: number = 0;
  private pendingCount: number = 0;
  
  constructor(wallet: ethers.Wallet) {
    this.wallet = wallet;
  }
  
  /**
   * @notice Sonraki nonce'u döndürür
   * @param force Force update
   * @return Nonce
   */
  async getNextNonce(force: boolean = false): Promise<number> {
    const now = Date.now();
    
    // Update if needed
    if (!this.currentNonce || force || now - this.lastUpdate > 5000) {
      try {
        this.currentNonce = await (this.wallet as any).provider.getTransactionCount(
          this.wallet.address, 
          'pending'
        );
      } catch (error) {
        // Fallback
        this.currentNonce = Math.floor(Math.random() * 1000000);
      }
      this.lastUpdate = now;
      this.pendingCount = 0;
    }
    
    const nonce = (this.currentNonce ?? 0) + this.pendingCount;
    this.pendingCount++;
    
    return nonce;
  }
  
  /**
   * @notice Pending count'u sıfırlar
   */
  reset(): void {
    this.pendingCount = 0;
  }
}
