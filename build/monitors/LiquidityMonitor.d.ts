/**
 * @title LiquidityMonitor - STUB VERSION
 * @author Arbitrage Bot System
 * @notice Pool reserve monitoring, depth analysis ve large trade detection - Basitleştirilmiş sürüm
 * @dev Simplified liquidity monitoring for compilation purposes
 */
import { EventEmitter } from 'events';
import { ethers } from 'ethers';
import { TokenPair, PoolReserves } from '../types';
interface LiquidityMonitorConfig {
    enabledDEXs: string[];
    updateInterval?: number;
    monitoredPairs?: TokenPair[];
    cacheTimeout?: number;
}
interface LiquidityData {
    poolAddress: string;
    dexName: string;
    reserves: PoolReserves;
    timestamp: number;
    blockNumber: number;
}
/**
 * @class LiquidityMonitor
 * @notice Likidite takip ve analiz sınıfı - STUB VERSION
 * @dev Simplified implementation for compilation
 */
export declare class LiquidityMonitor extends EventEmitter {
    private config;
    private logger;
    private isRunning;
    private monitoredPairs;
    private liquidityCache;
    /**
     * @notice LiquidityMonitor constructor
     * @param config Monitor konfigürasyonu
     * @param provider Ethereum provider
     */
    constructor(config: LiquidityMonitorConfig, provider: ethers.Provider);
    /**
     * @notice Monitor'ı başlatır
     */
    start(): Promise<void>;
    /**
     * @notice Monitor'ı durdurur
     */
    stop(): Promise<void>;
    /**
     * @notice Pool likidite verilerini getirir
     * @param poolAddress Pool contract address
     * @param dexName DEX identifier
     * @return Mock liquidity data
     */
    getLiquidityData(poolAddress: string, dexName: string): Promise<LiquidityData | null>;
    /**
     * @notice Pool reserves verilerini getirir
     * @param poolAddress Pool contract address
     * @param dexName DEX identifier
     * @return Mock pool reserves
     */
    getPoolReserves(poolAddress: string, dexName: string): Promise<PoolReserves | null>;
    /**
     * @notice Monitored pair ekler
     * @param pair Token pair to monitor
     */
    addMonitoredPair(pair: TokenPair): void;
    /**
     * @notice Monitored pair kaldırır
     * @param token0 First token address
     * @param token1 Second token address
     */
    removeMonitoredPair(token0: string, token1: string): void;
    /**
     * @notice Aktif monitored pairs listesini döner
     * @return Array of monitored pairs
     */
    getMonitoredPairs(): TokenPair[];
    /**
     * @notice Monitor çalışma durumunu döner
     * @return Is running status
     */
    isMonitorRunning(): boolean;
}
export default LiquidityMonitor;
//# sourceMappingURL=LiquidityMonitor.d.ts.map