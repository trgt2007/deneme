"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalancerHandler = void 0;
const ethers_1 = require("ethers");
const Logger_1 = require("../utils/Logger");
// 🏊 Pool Types
var PoolType;
(function (PoolType) {
    PoolType["WEIGHTED"] = "Weighted";
    PoolType["STABLE"] = "Stable";
    PoolType["LIQUIDITY_BOOTSTRAPPING"] = "LiquidityBootstrapping";
    PoolType["INVESTMENT"] = "Investment";
    PoolType["META_STABLE"] = "MetaStable";
})(PoolType || (PoolType = {}));
/**
 * 🎯 BALANCER V2 HANDLER
 * Balancer V2 Vault sistemi ile entegrasyon sağlar
 */
class BalancerHandler {
    logger;
    provider;
    vault;
    config;
    // 💾 Cache sistemi
    poolCache = new Map();
    routeCache = new Map();
    lastCacheUpdate = 0;
    // 📊 İstatistikler
    stats = {
        totalQueries: 0,
        successfulQueries: 0,
        cacheHits: 0,
        averageLatency: 0,
        lastError: null
    };
    constructor(provider, config) {
        this.logger = Logger_1.Logger.getInstance().createChildLogger('BalancerHandler');
        this.provider = provider;
        this.config = config;
        // Balancer V2 Vault contract
        this.vault = new ethers_1.ethers.Contract(config.vaultAddress, BALANCER_VAULT_ABI, provider);
        this.logger.info('🏊 Balancer V2 Handler başlatıldı', {
            vault: config.vaultAddress,
            maxHops: config.maxHops
        });
    }
    /**
     * 💰 Token fiyatı al (quote)
     */
    async getQuote(tokenIn, tokenOut, amountIn, options = {}) {
        const startTime = Date.now();
        this.stats.totalQueries++;
        try {
            this.logger.debug('📊 Balancer quote alınıyor', {
                tokenIn,
                tokenOut,
                amountIn: amountIn.toString(),
                maxHops: options.maxHops
            });
            // Cache kontrolü
            const cacheKey = `${tokenIn}-${tokenOut}-${amountIn.toString()}`;
            if (this.routeCache.has(cacheKey)) {
                this.stats.cacheHits++;
                const cached = this.routeCache.get(cacheKey);
                return {
                    amountOut: cached.expectedOutput,
                    route: cached,
                    gasEstimate: cached.gasEstimate,
                    priceImpact: cached.priceImpact
                };
            }
            // En iyi route bul
            const route = await this.findBestRoute(tokenIn, tokenOut, amountIn, options);
            if (!route) {
                throw new Error('Route bulunamadı');
            }
            // Batch swap query
            const { swaps, assets } = this.buildBatchSwap(route, amountIn);
            const amounts = await this.vault.queryBatchSwap(0, // SwapKind.GIVEN_IN
            swaps, assets, {
                sender: ethers_1.ethers.ZeroAddress,
                fromInternalBalance: false,
                recipient: ethers_1.ethers.ZeroAddress,
                toInternalBalance: false
            });
            const amountOut = amounts[amounts.length - 1];
            const priceImpact = this.calculatePriceImpact(amountIn, amountOut, route);
            // Gas estimate
            const gasEstimate = await this.estimateGas(swaps, assets, amountIn);
            // Cache'e kaydet
            route.expectedOutput = amountOut;
            route.priceImpact = priceImpact;
            route.gasEstimate = gasEstimate;
            this.routeCache.set(cacheKey, route);
            this.stats.successfulQueries++;
            this.stats.averageLatency = (this.stats.averageLatency + (Date.now() - startTime)) / 2;
            return {
                amountOut,
                route,
                gasEstimate,
                priceImpact
            };
        }
        catch (error) {
            this.stats.lastError = error.message;
            this.logger.error('❌ Balancer quote hatası', {
                error: error.message,
                tokenIn,
                tokenOut,
                amountIn: amountIn.toString()
            });
            throw error;
        }
    }
    /**
     * 🔄 Swap işlemi gerçekleştir
     */
    async executeSwap(route, amountIn, minAmountOut, recipient, deadline = Math.floor(Date.now() / 1000) + 300 // 5 dakika
    ) {
        try {
            this.logger.info('🔄 Balancer swap başlatılıyor', {
                route: route.pools.map(p => p.id),
                amountIn: amountIn.toString(),
                minAmountOut: minAmountOut.toString()
            });
            const { swaps, assets } = this.buildBatchSwap(route, amountIn);
            // Limits array oluştur
            const limits = new Array(assets.length).fill(0n);
            limits[0] = amountIn; // Input token için pozitif limit
            limits[limits.length - 1] = -minAmountOut; // Output token için negatif limit
            // Batch swap execute
            const tx = await this.vault.batchSwap(0, // SwapKind.GIVEN_IN
            swaps, assets, {
                sender: recipient,
                fromInternalBalance: false,
                recipient: recipient,
                toInternalBalance: false
            }, limits, BigInt(deadline));
            const receipt = await tx.wait();
            // Output amount hesapla (events'den)
            const amountOut = this.parseSwapOutput(receipt, route.tokenOut);
            this.logger.info('✅ Balancer swap tamamlandı', {
                hash: receipt.transactionHash,
                amountOut: amountOut.toString(),
                gasUsed: receipt.gasUsed.toString()
            });
            return {
                hash: receipt.transactionHash,
                amountOut,
                gasUsed: receipt.gasUsed
            };
        }
        catch (error) {
            this.logger.error('❌ Balancer swap hatası', {
                error: error.message,
                route: route.pools.map(p => p.id)
            });
            throw error;
        }
    }
    /**
     * 🔍 En iyi route bul
     */
    async findBestRoute(tokenIn, tokenOut, amountIn, options) {
        try {
            // Pool cache güncelle
            await this.updatePoolCache();
            const maxHops = options.maxHops || this.config.maxHops;
            const excludePools = new Set(options.excludePools || []);
            // Direct pools ara
            const directPools = this.findDirectPools(tokenIn, tokenOut, excludePools);
            if (directPools.length > 0) {
                // En iyi direct pool seç
                const bestDirect = this.selectBestPool(directPools, amountIn);
                return {
                    tokenIn,
                    tokenOut,
                    pools: [bestDirect],
                    expectedOutput: 0n, // Sonra hesaplanacak
                    priceImpact: 0,
                    gasEstimate: 0n,
                    hops: 1
                };
            }
            // Multi-hop routes ara
            if (maxHops > 1) {
                return await this.findMultiHopRoute(tokenIn, tokenOut, maxHops, excludePools);
            }
            return null;
        }
        catch (error) {
            this.logger.error('❌ Route bulma hatası', {
                error: error.message,
                tokenIn,
                tokenOut
            });
            return null;
        }
    }
    /**
     * 🔄 Direct pools bul
     */
    findDirectPools(tokenIn, tokenOut, excludePools) {
        const pools = [];
        for (const pool of this.poolCache.values()) {
            if (excludePools.has(pool.id))
                continue;
            const hasTokenIn = pool.tokens.includes(tokenIn.toLowerCase());
            const hasTokenOut = pool.tokens.includes(tokenOut.toLowerCase());
            if (hasTokenIn && hasTokenOut) {
                pools.push(pool);
            }
        }
        return pools.sort((a, b) => {
            // Likidite ve hacme göre sırala
            const scoreA = a.totalLiquidity + (a.volume24h / 10n);
            const scoreB = b.totalLiquidity + (b.volume24h / 10n);
            return scoreB > scoreA ? 1 : -1;
        });
    }
    /**
     * 🔀 Multi-hop route bul
     */
    async findMultiHopRoute(tokenIn, tokenOut, maxHops, excludePools) {
        // BFS ile en iyi route ara
        const queue = [];
        // İlk hop'ları bul
        for (const pool of this.poolCache.values()) {
            if (excludePools.has(pool.id))
                continue;
            if (!pool.tokens.includes(tokenIn.toLowerCase()))
                continue;
            for (const token of pool.tokens) {
                if (token.toLowerCase() === tokenIn.toLowerCase())
                    continue;
                queue.push({
                    currentToken: token,
                    pools: [pool],
                    hops: 1
                });
            }
        }
        // BFS ile devam et
        while (queue.length > 0) {
            const current = queue.shift();
            if (current.hops >= maxHops)
                continue;
            // Hedef token'a ulaştık mı?
            if (current.currentToken.toLowerCase() === tokenOut.toLowerCase()) {
                return {
                    tokenIn,
                    tokenOut,
                    pools: current.pools,
                    expectedOutput: 0n,
                    priceImpact: 0,
                    gasEstimate: 0n,
                    hops: current.hops
                };
            }
            // Bir sonraki hop'ları ekle
            for (const pool of this.poolCache.values()) {
                if (excludePools.has(pool.id))
                    continue;
                if (current.pools.some(p => p.id === pool.id))
                    continue;
                if (!pool.tokens.includes(current.currentToken.toLowerCase()))
                    continue;
                for (const token of pool.tokens) {
                    if (token.toLowerCase() === current.currentToken.toLowerCase())
                        continue;
                    queue.push({
                        currentToken: token,
                        pools: [...current.pools, pool],
                        hops: current.hops + 1
                    });
                }
            }
        }
        return null;
    }
    /**
     * 🏆 En iyi pool seç
     */
    selectBestPool(pools, amountIn) {
        let bestPool = pools[0];
        let bestScore = 0;
        for (const pool of pools) {
            // Score hesapla: likidite + hacim + düşük fee
            const liquidityScore = Number(ethers_1.ethers.formatEther(pool.totalLiquidity));
            const volumeScore = Number(ethers_1.ethers.formatEther(pool.volume24h)) / 10;
            const feeScore = 1 / (Number(ethers_1.ethers.formatEther(pool.swapFee)) + 0.001);
            const totalScore = liquidityScore + volumeScore + feeScore;
            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestPool = pool;
            }
        }
        return bestPool;
    }
    /**
     * 🔨 Batch swap oluştur
     */
    buildBatchSwap(route, amountIn) {
        const swaps = [];
        const assetsSet = new Set();
        if (route.hops === 1) {
            // Direct swap
            const pool = route.pools[0];
            assetsSet + route.tokenIn;
            assetsSet + route.tokenOut;
            swaps.push({
                poolId: pool.id,
                assetInIndex: 0,
                assetOutIndex: 1,
                amount: amountIn,
                userData: '0x'
            });
        }
        else {
            // Multi-hop swap
            let currentToken = route.tokenIn;
            assetsSet + currentToken;
            for (let i = 0; i < route.pools.length; i++) {
                const pool = route.pools[i];
                const nextToken = i === route.pools.length - 1
                    ? route.tokenOut
                    : this.findNextToken(pool, currentToken, route);
                assetsSet + nextToken;
                swaps.push({
                    poolId: pool.id,
                    assetInIndex: Array.from(assetsSet).indexOf(currentToken),
                    assetOutIndex: Array.from(assetsSet).indexOf(nextToken),
                    amount: i === 0 ? amountIn : 0n,
                    userData: '0x'
                });
                currentToken = nextToken;
            }
        }
        return {
            swaps,
            assets: Array.from(assetsSet)
        };
    }
    /**
     * 🔍 Bir sonraki token bul
     */
    findNextToken(pool, currentToken, route) {
        // Multi-hop'ta bir sonraki en uygun token'ı bul
        for (const token of pool.tokens) {
            if (token.toLowerCase() === currentToken.toLowerCase())
                continue;
            if (token.toLowerCase() === route.tokenOut.toLowerCase()) {
                return route.tokenOut; // Hedef token varsa direkt dön
            }
        }
        // En yüksek likiditeye sahip token'ı seç
        return pool.tokens.find(t => t.toLowerCase() !== currentToken.toLowerCase()) || pool.tokens[0];
    }
    /**
     * 📊 Fiyat etkisi hesapla
     */
    calculatePriceImpact(amountIn, amountOut, route) {
        try {
            // Basit fiyat etkisi hesabı
            // Gerçek implementasyonda pool type'a göre farklı hesaplamalar
            const inputValue = Number(ethers_1.ethers.formatEther(amountIn));
            const outputValue = Number(ethers_1.ethers.formatEther(amountOut));
            // Theoretical price (1:1 ratio) ile karşılaştır
            const theoreticalOutput = inputValue; // Simplified
            const actualOutput = outputValue;
            const priceImpact = Math.abs((theoreticalOutput - actualOutput) / theoreticalOutput);
            return Math.min(priceImpact, 1); // Cap at 100%
        }
        catch (error) {
            this.logger.warn('⚠️ Price impact hesaplama hatası', {
                error: error.message
            });
            return 0.01; // Default %1
        }
    }
    /**
     * ⛽ Gas estimate
     */
    async estimateGas(swaps, assets, amountIn) {
        try {
            // Base gas + per hop
            const baseGas = 150000; // Base Balancer swap gas
            const gasPerHop = 50000; // Additional gas per hop
            const totalGas = baseGas + (swaps.length * gasPerHop);
            return BigInt(totalGas);
        }
        catch (error) {
            this.logger.warn('⚠️ Gas estimate hatası', {
                error: error.message
            });
            return BigInt(200000); // Safe default
        }
    }
    /**
     * 📤 Swap output parse et
     */
    parseSwapOutput(receipt, tokenOut) {
        try {
            // Swap events'lerden output amount'u bul
            // Simplified - gerçek implementasyonda event parsing
            return BigInt("1000000000000000000"); // Placeholder
        }
        catch (error) {
            this.logger.warn('⚠️ Swap output parse hatası', {
                error: error.message
            });
            return 0n;
        }
    }
    /**
     * 🔄 Pool cache güncelle
     */
    async updatePoolCache() {
        const now = Date.now();
        if (now - this.lastCacheUpdate < this.config.cacheTTL) {
            return; // Cache hala fresh
        }
        try {
            this.logger.debug('🔄 Balancer pool cache güncelleniyor...');
            // Subgraph'dan pool bilgilerini al
            const pools = await this.fetchPoolsFromSubgraph();
            // Cache'i güncelle
            this.poolCache.clear();
            for (const pool of pools) {
                this.poolCache.set(pool.id, pool);
            }
            this.lastCacheUpdate = now;
            this.logger.info('✅ Pool cache güncellendi', {
                poolCount: pools.length,
                cacheSize: this.poolCache.size
            });
        }
        catch (error) {
            this.logger.error('❌ Pool cache güncelleme hatası', {
                error: error.message
            });
        }
    }
    /**
     * 📊 Subgraph'dan pool verileri al
     */
    async fetchPoolsFromSubgraph() {
        // Simplified subgraph query
        // Gerçek implementasyonda GraphQL query
        const mockPools = [
            {
                id: '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014',
                address: '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56',
                poolType: PoolType.WEIGHTED,
                tokens: [
                    '0xa0b86a33e6a39dc80c977e83bb59eb8d3c9ed3ef', // BAL
                    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' // WETH
                ],
                weights: [0.8, 0.2],
                swapFee: ethers_1.ethers.parseEther('0.01'),
                totalLiquidity: ethers_1.ethers.parseEther('1000000'),
                volume24h: ethers_1.ethers.parseEther('100000'),
                factory: '0x8e9aa87e45f92ead5f0b6ff1e7969f9e2e4a78cd'
            }
        ];
        return mockPools;
    }
    /**
     * 📊 Handler istatistikleri
     */
    getStats() {
        return {
            ...this.stats,
            poolCacheSize: this.poolCache.size,
            routeCacheSize: this.routeCache.size,
            lastCacheUpdate: new Date(this.lastCacheUpdate).toISOString(),
            successRate: this.stats.totalQueries > 0
                ? (this.stats.successfulQueries / this.stats.totalQueries * 100).toFixed(2) + '%'
                : '0%',
            cacheHitRate: this.stats.totalQueries > 0
                ? (this.stats.cacheHits / this.stats.totalQueries * 100).toFixed(2) + '%'
                : '0%'
        };
    }
    /**
     * 🧹 Cache temizle
     */
    clearCache() {
        this.poolCache.clear();
        this.routeCache.clear();
        this.lastCacheUpdate = 0;
        this.logger.info('🧹 Balancer cache temizlendi');
    }
    /**
     * 🔧 Health check
     */
    async healthCheck() {
        try {
            const startTime = Date.now();
            // Test query
            await this.vault.getPoolTokens('0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014');
            const latency = Date.now() - startTime;
            return {
                status: latency < 1000 ? 'healthy' : 'degraded',
                latency,
                poolCount: this.poolCache.size,
                lastError: this.stats.lastError
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                latency: -1,
                poolCount: this.poolCache.size,
                lastError: error.message
            };
        }
    }
}
exports.BalancerHandler = BalancerHandler;
// 🔗 Balancer V2 Vault ABI (Simplified)
const BALANCER_VAULT_ABI = [
    'function batchSwap(uint8 kind, tuple(bytes32 poolId, uint256 assetInIndex, uint256 assetOutIndex, uint256 amount, bytes userData)[] swaps, address[] assets, tuple(address sender, bool fromInternalBalance, address recipient, bool toInternalBalance) funds, int256[] limits, uint256 deadline) external returns (int256[])',
    'function queryBatchSwap(uint8 kind, tuple(bytes32 poolId, uint256 assetInIndex, uint256 assetOutIndex, uint256 amount, bytes userData)[] swaps, address[] assets, tuple(address sender, bool fromInternalBalance, address recipient, bool toInternalBalance) funds) external returns (int256[])',
    'function getPoolTokens(bytes32 poolId) external view returns (address[] tokens, uint256[] balances, uint256 lastChangeBlock)',
    'function flashLoan(address recipient, address[] tokens, uint256[] amounts, bytes userData) external'
];
//# sourceMappingURL=BalancerHandler.js.map