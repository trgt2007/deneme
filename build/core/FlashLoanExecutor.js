"use strict";
/**
 * @title FlashLoanExecutor
 * @author Arbitrage Bot System
 * @notice Flashloan işlemlerini yöneten executor
 * @dev Smart contract etkileşimi, transaction building, gas optimization ve retry logic
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlashLoanExecutor = void 0;
const events_1 = require("events");
const ethers_1 = require("ethers");
const GasMonitor_1 = require("../monitors/GasMonitor");
const MEVProtection_1 = require("../services/MEVProtection");
const DatabaseService_1 = require("../services/DatabaseService");
const types_1 = require("../types");
const constants_1 = require("../constants");
/**
 * @class FlashLoanExecutor
 * @notice Flashloan execution manager sınıfı
 * @dev EventEmitter'dan türetilmiş, gas optimized transaction yönetimi
 */
class FlashLoanExecutor extends events_1.EventEmitter {
    // ============ Private Properties ============
    /**
     * @notice Executor konfigürasyonu
     */
    config;
    /**
     * @notice Ethereum provider
     */
    provider;
    /**
     * @notice Execution wallet
     */
    wallet;
    /**
     * @notice FlashLoanArbitrage contract instance
     */
    arbitrageContract;
    /**
     * @notice Aave Pool contract instance
     */
    aavePool;
    /**
     * @notice Gas monitor instance
     */
    gasMonitor;
    /**
     * @notice MEV protection service
     */
    mevProtection;
    /**
     * @notice Database service
     */
    databaseService;
    /**
     * @notice Logger instance
     */
    logger;
    /**
     * @notice Active transactions map
     */
    activeTransactions = new Map();
    /**
     * @notice Transaction nonce manager
     */
    nonceManager;
    /**
     * @notice Gas price cache
     */
    gasPriceCache = null;
    /**
     * @notice Execution metrics
     */
    metrics = {
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
    retryStrategy = {
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
    constructor(config) {
        super();
        this.config = config;
        // Logger'ı geçici olarak mock edelim
        this.logger = {
            info: (message, meta) => console.log(`[INFO] ${message}`, meta || ''),
            warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ''),
            error: (message, meta) => console.error(`[ERROR] ${message}`, meta || ''),
            debug: (message, meta) => console.log(`[DEBUG] ${message}`, meta || '')
        };
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
            arbitrageContract: constants_1.FLASHLOAN_ARBITRAGE_ADDRESS
        });
    }
    // ============ Public Methods ============
    /**
     * @notice Arbitraj fırsatını execute eder
     * @param opportunity Arbitraj fırsatı
     * @return ExecutionResult
     */
    async execute(opportunity) {
        const startTime = Date.now();
        const executionId = this.generateExecutionId();
        this.logger.info('Starting flashloan execution', {
            executionId,
            token: opportunity.token,
            amount: ethers_1.ethers.formatEther(opportunity.amountIn),
            expectedProfit: ethers_1.ethers.formatEther(opportunity.expectedProfit)
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
            const result = await this.processExecutionResult(opportunity, receipt, startTime, executionId);
            // Update metrics
            this.updateMetrics(result);
            // Emit success event
            this.emit('execution:success', result);
            return result;
        }
        catch (error) {
            const result = this.handleExecutionError(opportunity, error, startTime, executionId);
            // Emit failure event
            this.emit('execution:failed', result);
            return result;
        }
        finally {
            // Cleanup
            this.activeTransactions.delete(executionId);
        }
    }
    /**
     * @notice Aktif transaction'ları döndürür
     */
    getActiveTransactions() {
        return Array.from(this.activeTransactions.values());
    }
    /**
     * @notice Execution metriklerini döndürür
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * @notice Gas stratejisini günceller
     */
    updateGasStrategy(strategy) {
        this.config.gasStrategy = strategy;
        this.logger.info('Gas strategy updated', { strategy });
    }
    /**
     * @notice Retry stratejisini günceller
     */
    updateRetryStrategy(strategy) {
        this.retryStrategy = { ...strategy };
        this.logger.info('Retry strategy updated', { retryStrategy: JSON.stringify(strategy) });
    }
    // ============ Private Initialization Methods ============
    /**
     * @notice Provider'ı initialize eder
     */
    initializeProvider() {
        if (this.config.customProvider) {
            this.provider = this.config.customProvider;
        }
        else {
            // ethers v6 uyumlu provider
            this.provider = new ethers_1.ethers.AlchemyProvider(this.config.network || 'mainnet', this.config.alchemyApiKey);
        }
    }
    /**
     * @notice Wallet'ı initialize eder
     */
    initializeWallet() {
        if (!this.config.privateKey) {
            throw new Error('Private key not provided');
        }
        this.wallet = new ethers_1.ethers.Wallet(this.config.privateKey, this.provider);
    }
    /**
     * @notice Contract'ları initialize eder
     */
    initializeContracts() {
        // Initialize FlashLoanArbitrage contract
        this.arbitrageContract = new ethers_1.ethers.Contract(constants_1.FLASHLOAN_ARBITRAGE_ADDRESS, constants_1.FLASHLOAN_ARBITRAGE_ABI, this.wallet);
        // Initialize Aave Pool contract
        this.aavePool = new ethers_1.ethers.Contract(constants_1.AAVE_POOL_ADDRESS, ['function getReserveData(address asset) view returns (tuple)'], this.provider);
    }
    /**
     * @notice Servisleri initialize eder
     */
    initializeServices() {
        this.gasMonitor = new GasMonitor_1.GasMonitor({
            provider: this.provider,
            updateInterval: 5000 // 5 seconds
        });
        this.mevProtection = new MEVProtection_1.MEVProtection(this.provider, {
            enabled: true,
            maxGasPriceGwei: 50,
            flashbotsEnabled: Boolean(this.config.flashbotsRpc)
        });
        this.databaseService = new DatabaseService_1.DatabaseService(this.config.databaseConfig);
    }
    // ============ Transaction Building Methods ============
    /**
     * @notice Transaction'ı build eder
     * @param opportunity Arbitraj fırsatı
     * @return TransactionRequest
     */
    async buildTransaction(opportunity) {
        // Encode swap routes
        const encodedParams = await this.encodeArbitrageParams(opportunity);
        // Get optimal gas parameters
        const gasParams = await this.getOptimalGasParams();
        // Build transaction
        const tx = {
            to: constants_1.FLASHLOAN_ARBITRAGE_ADDRESS,
            from: this.wallet.address,
            data: this.arbitrageContract.interface.encodeFunctionData('executeArbitrage', [
                opportunity.token,
                opportunity.amountIn,
                encodedParams
            ]),
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
    async encodeArbitrageParams(opportunity) {
        const dexPath = [];
        const amounts = [];
        const tokens = [];
        const swapData = [];
        for (const route of opportunity.routes) {
            dexPath.push(route.dexName);
            amounts.push(route.minimumAmountOut);
            tokens.push(route.tokenOut);
            swapData.push(await this.encodeSwapData(route));
        }
        return ethers_1.ethers.AbiCoder.defaultAbiCoder().encode(['string[]', 'uint256[]', 'address[]', 'bytes[]'], [dexPath, amounts, tokens, swapData]);
    }
    /**
     * @notice Swap data'sını encode eder
     * @param route Swap route
     * @return Encoded swap data
     */
    async encodeSwapData(route) {
        switch (route.dexName) {
            case 'UniswapV3':
                return ethers_1.ethers.AbiCoder.defaultAbiCoder().encode(['uint24', 'uint160'], [route.fee || 3000, route.sqrtPriceLimitX96 || 0]);
            case 'SushiSwap':
                return '0x'; // No additional data needed
            case 'Curve':
                return ethers_1.ethers.AbiCoder.defaultAbiCoder().encode(['int128', 'int128'], [route.fromIndex || 0, route.toIndex || 1]);
            case '1inch':
                return ethers_1.ethers.AbiCoder.defaultAbiCoder().encode(['address', 'bytes', 'bytes'], [route.executor || ethers_1.ethers.ZeroAddress, '0x', route.executorData || '0x']);
            case 'Balancer':
                return ethers_1.ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'bytes'], [route.poolId || '0x', route.userData || '0x']);
            default:
                throw new Error(`Unknown DEX: ${route.dexName}`);
        }
    }
    // ============ Gas Optimization Methods ============
    /**
     * @notice Optimal gas parametrelerini hesaplar
     * @return Gas parameters
     */
    async getOptimalGasParams() {
        // Update gas price cache if needed
        if (!this.gasPriceCache || Date.now() - this.gasPriceCache.lastUpdate > 5000) {
            await this.updateGasPriceCache();
        }
        const strategy = this.config.gasStrategy || types_1.GasStrategy.ADAPTIVE;
        switch (strategy) {
            case types_1.GasStrategy.AGGRESSIVE:
                return this.getAggressiveGasParams();
            case types_1.GasStrategy.NORMAL:
                return this.getNormalGasParams();
            case types_1.GasStrategy.CONSERVATIVE:
                return this.getConservativeGasParams();
            case types_1.GasStrategy.ADAPTIVE:
            default:
                return this.getAdaptiveGasParams();
        }
    }
    /**
     * @notice Aggressive gas parametreleri (hızlı confirmation)
     */
    getAggressiveGasParams() {
        const baseFee = this.gasPriceCache.baseFee;
        const priorityFee = this.gasPriceCache.priorityFee * BigInt(150) / BigInt(100); // 150% priority
        return {
            maxPriorityFeePerGas: priorityFee,
            maxFeePerGas: baseFee * BigInt(2) + priorityFee // 2x base + priority
        };
    }
    /**
     * @notice Normal gas parametreleri
     */
    getNormalGasParams() {
        const baseFee = this.gasPriceCache.baseFee;
        const priorityFee = this.gasPriceCache.priorityFee;
        return {
            maxPriorityFeePerGas: priorityFee,
            maxFeePerGas: baseFee * BigInt(125) / BigInt(100) + priorityFee // 1.25x base + priority
        };
    }
    /**
     * @notice Conservative gas parametreleri (düşük maliyet)
     */
    getConservativeGasParams() {
        const baseFee = this.gasPriceCache.baseFee;
        const priorityFee = this.gasPriceCache.priorityFee * BigInt(75) / BigInt(100); // 75% priority
        return {
            maxPriorityFeePerGas: priorityFee,
            maxFeePerGas: baseFee + priorityFee
        };
    }
    /**
     * @notice Adaptive gas parametreleri (profit bazlı)
     */
    async getAdaptiveGasParams() {
        const baseFee = this.gasPriceCache.baseFee;
        let priorityFee = this.gasPriceCache.priorityFee;
        // Get pending transaction count
        const pendingCount = await this.getPendingTransactionCount();
        // Adjust priority based on congestion
        if (pendingCount > 100) {
            priorityFee = priorityFee * BigInt(200) / BigInt(100); // 2x for high congestion
        }
        else if (pendingCount > 50) {
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
    async updateGasPriceCache() {
        try {
            const block = await this.provider.getBlock('latest');
            const baseFee = block?.baseFeePerGas || ethers_1.ethers.parseUnits('20', 'gwei');
            // Get priority fee from recent blocks
            const priorityFee = await this.estimatePriorityFee();
            this.gasPriceCache = {
                lastUpdate: Date.now(),
                baseFee,
                priorityFee
            };
        }
        catch (error) {
            // Fallback values
            this.gasPriceCache = {
                lastUpdate: Date.now(),
                baseFee: ethers_1.ethers.parseUnits('20', 'gwei'),
                priorityFee: ethers_1.ethers.parseUnits('2', 'gwei')
            };
        }
    }
    /**
     * @notice Priority fee tahmin eder
     */
    async estimatePriorityFee() {
        try {
            // Get fee history
            const feeHistory = await this.provider.send('eth_feeHistory', [
                10, // Last 10 blocks
                'latest',
                [25, 50, 75] // Percentiles
            ]);
            // Use 75th percentile for aggressive pricing
            const recentFees = feeHistory.reward.map((r) => BigInt(r[2] || '0'));
            const avgFee = recentFees.reduce((a, b) => a + b, BigInt(0)) / BigInt(recentFees.length);
            return avgFee;
        }
        catch (error) {
            // Fallback to default
            return ethers_1.ethers.parseUnits('2', 'gwei');
        }
    }
    /**
     * @notice Gas limit tahmin eder
     */
    async estimateGasLimit(opportunity) {
        try {
            // Base gas for flashloan
            let gasEstimate = BigInt(150000);
            // Add gas per swap
            gasEstimate = gasEstimate + BigInt(100000 * opportunity.routes.length);
            // Add 20% buffer
            return gasEstimate * BigInt(120) / BigInt(100);
        }
        catch (error) {
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
    async simulateTransaction(tx) {
        try {
            // Use eth_call to simulate
            const result = await this.provider.call(tx);
            // Decode result to check success
            const decoded = this.arbitrageContract.interface.decodeFunctionResult('executeArbitrage', result);
            // Estimate actual gas usage
            const gasUsed = await this.provider.estimateGas(tx);
            return {
                success: true,
                gasUsed: typeof gasUsed === 'bigint' ? gasUsed : BigInt(gasUsed.toString())
            };
        }
        catch (error) {
            // Try to decode revert reason
            let reason = 'Unknown error';
            if (error.data) {
                try {
                    reason = ethers_1.ethers.toUtf8String('0x' + error.data.substr(138));
                }
                catch {
                    reason = error.message || 'Simulation failed';
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
    async executeWithRetry(tx, executionId) {
        let lastError = null;
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
            }
            catch (error) {
                lastError = error;
                // Check if error is retryable
                if (!this.isRetryableError(error)) {
                    throw error;
                }
                // Log retry attempt
                this.logger.warn(`Transaction failed, retry ${retryCount + 1}/${this.retryStrategy.maxRetries}`, {
                    error: error.message,
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
                delay = Math.min(delay * this.retryStrategy.backoffMultiplier, this.retryStrategy.maxRetryDelay);
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
    async sendTransaction(tx) {
        // Check if MEV protection is enabled
        if (this.config.useMevProtection) {
            return await this.mevProtection.sendTransaction(tx);
        }
        else {
            return await this.wallet.sendTransaction(tx);
        }
    }
    /**
     * @notice Transaction confirmation bekler
     * @param txResponse Transaction response
     * @param executionId Execution ID
     * @return Transaction receipt
     */
    async waitForConfirmation(txResponse, executionId) {
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
    async processExecutionResult(opportunity, receipt, startTime, executionId) {
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
        const result = {
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
            profit: ethers_1.ethers.formatEther(netProfit),
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
    async parseProfit(receipt) {
        try {
            // Find ArbitrageExecuted event
            const event = receipt.logs.find((log) => {
                try {
                    const parsed = this.arbitrageContract.interface.parseLog(log);
                    return parsed?.name === 'ArbitrageExecuted';
                }
                catch {
                    return false;
                }
            });
            if (event) {
                const parsed = this.arbitrageContract.interface.parseLog(event);
                return parsed?.args.profit || BigInt(0);
            }
            // Fallback: estimate from balance change
            return BigInt(0);
        }
        catch (error) {
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
    handleExecutionError(opportunity, error, startTime, executionId) {
        this.logger.error('Arbitrage execution failed', {
            error: error.message,
            executionId
        });
        // Update metrics
        this.metrics.failedExecutions++;
        // Build error result
        const result = {
            success: false,
            opportunity,
            error,
            executionTime: Date.now() - startTime,
            executionId
        };
        // Record failure
        this.databaseService.recordFailure(result).catch(err => this.logger.error('Failed to record execution failure', err));
        return result;
    }
    /**
     * @notice Error'un retry edilebilir olup olmadığını kontrol eder
     * @param error Error object
     * @return boolean
     */
    isRetryableError(error) {
        const retryableCodes = [
            'NONCE_EXPIRED',
            'REPLACEMENT_UNDERPRICED',
            'TRANSACTION_REPLACED',
            'TIMEOUT',
            'NETWORK_ERROR'
        ];
        return retryableCodes.includes(error.code) ||
            error.message?.includes('timeout') ||
            error.message?.includes('network');
    }
    // ============ Helper Methods ============
    /**
     * @notice Pre-execution validation
     * @param opportunity Arbitraj fırsatı
     */
    async validatePreExecution(opportunity) {
        // Check deadline
        if (Date.now() > opportunity.deadline) {
            throw new Error('Opportunity deadline exceeded');
        }
        // Check wallet balance for gas
        const balance = await this.wallet.provider.getBalance(this.wallet.address);
        const estimatedGasCost = opportunity.estimatedGas * (this.gasPriceCache?.baseFee || ethers_1.ethers.parseUnits('50', 'gwei'));
        if (balance < estimatedGasCost) {
            throw new Error('Insufficient balance for gas');
        }
        // Check contract is not paused
        try {
            const isPaused = await this.arbitrageContract.paused();
            if (isPaused) {
                throw new Error('Arbitrage contract is paused');
            }
        }
        catch (error) {
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
    generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * @notice Transaction status'unu günceller
     * @param executionId Execution ID
     * @param status Status update
     */
    updateTransactionStatus(executionId, status) {
        const current = this.activeTransactions.get(executionId) || {
            executionId,
            status: 'pending',
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
    updateMetrics(result) {
        this.metrics.totalExecutions++;
        if (result.success) {
            this.metrics.successfulExecutions++;
            this.metrics.totalGasUsed = this.metrics.totalGasUsed + (result.gasUsed || BigInt(0));
        }
        else {
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
    async getPendingTransactionCount() {
        try {
            const pending = await this.provider.send('eth_getBlockByNumber', ['pending', false]);
            return pending.transactions.length;
        }
        catch {
            return 0;
        }
    }
    /**
     * @notice Delay utility
     * @param ms Milliseconds
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.FlashLoanExecutor = FlashLoanExecutor;
/**
 * @class NonceManager
 * @notice Transaction nonce yönetimi
 */
class NonceManager {
    wallet;
    currentNonce = null;
    lastUpdate = 0;
    pendingCount = 0;
    constructor(wallet) {
        this.wallet = wallet;
    }
    /**
     * @notice Sonraki nonce'u döndürür
     * @param force Force update
     * @return Nonce
     */
    async getNextNonce(force = false) {
        const now = Date.now();
        // Update if needed
        if (!this.currentNonce || force || now - this.lastUpdate > 5000) {
            try {
                this.currentNonce = await this.wallet.provider.getTransactionCount(this.wallet.address, 'pending');
            }
            catch (error) {
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
    reset() {
        this.pendingCount = 0;
    }
}
//# sourceMappingURL=FlashLoanExecutor.js.map