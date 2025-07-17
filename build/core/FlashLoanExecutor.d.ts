/**
 * @title FlashLoanExecutor
 * @author Arbitrage Bot System
 * @notice Flashloan işlemlerini yöneten executor
 * @dev Smart contract etkileşimi, transaction building, gas optimization ve retry logic
 */
import { EventEmitter } from 'events';
import { ArbitrageOpportunity, ExecutionResult, FlashLoanConfig, TransactionStatus, GasStrategy, ExecutionMetrics, RetryStrategy } from '../types';
/**
 * @class FlashLoanExecutor
 * @notice Flashloan execution manager sınıfı
 * @dev EventEmitter'dan türetilmiş, gas optimized transaction yönetimi
 */
export declare class FlashLoanExecutor extends EventEmitter {
    /**
     * @notice Executor konfigürasyonu
     */
    private config;
    /**
     * @notice Ethereum provider
     */
    private provider;
    /**
     * @notice Execution wallet
     */
    private wallet;
    /**
     * @notice FlashLoanArbitrage contract instance
     */
    private arbitrageContract;
    /**
     * @notice Aave Pool contract instance
     */
    private aavePool;
    /**
     * @notice Gas monitor instance
     */
    private gasMonitor;
    /**
     * @notice MEV protection service
     */
    private mevProtection;
    /**
     * @notice Database service
     */
    private databaseService;
    /**
     * @notice Logger instance
     */
    private logger;
    /**
     * @notice Active transactions map
     */
    private activeTransactions;
    /**
     * @notice Transaction nonce manager
     */
    private nonceManager;
    /**
     * @notice Gas price cache
     */
    private gasPriceCache;
    /**
     * @notice Execution metrics
     */
    private metrics;
    /**
     * @notice Retry strategy configuration
     */
    private retryStrategy;
    /**
     * @notice FlashLoanExecutor constructor
     * @param config FlashLoan konfigürasyonu
     */
    constructor(config: FlashLoanConfig);
    /**
     * @notice Arbitraj fırsatını execute eder
     * @param opportunity Arbitraj fırsatı
     * @return ExecutionResult
     */
    execute(opportunity: ArbitrageOpportunity): Promise<ExecutionResult>;
    /**
     * @notice Aktif transaction'ları döndürür
     */
    getActiveTransactions(): TransactionStatus[];
    /**
     * @notice Execution metriklerini döndürür
     */
    getMetrics(): ExecutionMetrics;
    /**
     * @notice Gas stratejisini günceller
     */
    updateGasStrategy(strategy: GasStrategy): void;
    /**
     * @notice Retry stratejisini günceller
     */
    updateRetryStrategy(strategy: RetryStrategy): void;
    /**
     * @notice Provider'ı initialize eder
     */
    private initializeProvider;
    /**
     * @notice Wallet'ı initialize eder
     */
    private initializeWallet;
    /**
     * @notice Contract'ları initialize eder
     */
    private initializeContracts;
    /**
     * @notice Servisleri initialize eder
     */
    private initializeServices;
    /**
     * @notice Transaction'ı build eder
     * @param opportunity Arbitraj fırsatı
     * @return TransactionRequest
     */
    private buildTransaction;
    /**
     * @notice Arbitraj parametrelerini encode eder
     * @param opportunity Arbitraj fırsatı
     * @return Encoded parameters
     */
    private encodeArbitrageParams;
    /**
     * @notice Swap data'sını encode eder
     * @param route Swap route
     * @return Encoded swap data
     */
    private encodeSwapData;
    /**
     * @notice Optimal gas parametrelerini hesaplar
     * @return Gas parameters
     */
    private getOptimalGasParams;
    /**
     * @notice Aggressive gas parametreleri (hızlı confirmation)
     */
    private getAggressiveGasParams;
    /**
     * @notice Normal gas parametreleri
     */
    private getNormalGasParams;
    /**
     * @notice Conservative gas parametreleri (düşük maliyet)
     */
    private getConservativeGasParams;
    /**
     * @notice Adaptive gas parametreleri (profit bazlı)
     */
    private getAdaptiveGasParams;
    /**
     * @notice Gas price cache'i günceller
     */
    private updateGasPriceCache;
    /**
     * @notice Priority fee tahmin eder
     */
    private estimatePriorityFee;
    /**
     * @notice Gas limit tahmin eder
     */
    private estimateGasLimit;
    /**
     * @notice Transaction'ı simüle eder
     * @param tx Transaction request
     * @return Simulation result
     */
    private simulateTransaction;
    /**
     * @notice Transaction'ı retry logic ile execute eder
     * @param tx Transaction request
     * @param executionId Execution ID
     * @return Transaction response
     */
    private executeWithRetry;
    /**
     * @notice Transaction gönderir (MEV korumalı)
     * @param tx Transaction request
     * @return Transaction response
     */
    private sendTransaction;
    /**
     * @notice Transaction confirmation bekler
     * @param txResponse Transaction response
     * @param executionId Execution ID
     * @return Transaction receipt
     */
    private waitForConfirmation;
    /**
     * @notice Execution sonucunu işler
     * @param opportunity Arbitraj fırsatı
     * @param receipt Transaction receipt
     * @param startTime Başlangıç zamanı
     * @param executionId Execution ID
     * @return ExecutionResult
     */
    private processExecutionResult;
    /**
     * @notice Transaction receipt'ten profit parse eder
     * @param receipt Transaction receipt
     * @return Profit amount
     */
    private parseProfit;
    /**
     * @notice Execution error'unu handle eder
     * @param opportunity Arbitraj fırsatı
     * @param error Error object
     * @param startTime Başlangıç zamanı
     * @param executionId Execution ID
     * @return ExecutionResult
     */
    private handleExecutionError;
    /**
     * @notice Error'un retry edilebilir olup olmadığını kontrol eder
     * @param error Error object
     * @return boolean
     */
    private isRetryableError;
    /**
     * @notice Pre-execution validation
     * @param opportunity Arbitraj fırsatı
     */
    private validatePreExecution;
    /**
     * @notice Execution ID generate eder
     * @return Execution ID
     */
    private generateExecutionId;
    /**
     * @notice Transaction status'unu günceller
     * @param executionId Execution ID
     * @param status Status update
     */
    private updateTransactionStatus;
    /**
     * @notice Metrikleri günceller
     * @param result Execution result
     */
    private updateMetrics;
    /**
     * @notice Bekleyen transaction sayısını alır
     */
    private getPendingTransactionCount;
    /**
     * @notice Delay utility
     * @param ms Milliseconds
     */
    private delay;
}
//# sourceMappingURL=FlashLoanExecutor.d.ts.map