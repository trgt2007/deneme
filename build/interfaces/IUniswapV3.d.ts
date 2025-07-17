/**
 * 🦄 Uniswap V3 Interface Tanımları
 * Uniswap V3 router ve pool'ları ile etkileşim için gerekli interface'ler
 */
export interface IUniswapV3Router {
    exactInputSingle(params: ExactInputSingleParams): Promise<bigint>;
    exactOutputSingle(params: ExactOutputSingleParams): Promise<bigint>;
    exactInput(params: ExactInputParams): Promise<bigint>;
    exactOutput(params: ExactOutputParams): Promise<bigint>;
}
export interface ExactInputSingleParams {
    tokenIn: string;
    tokenOut: string;
    fee: number;
    recipient: string;
    deadline: bigint;
    amountIn: bigint;
    amountOutMinimum: bigint;
    sqrtPriceLimitX96: bigint;
}
export interface ExactOutputSingleParams {
    tokenIn: string;
    tokenOut: string;
    fee: number;
    recipient: string;
    deadline: bigint;
    amountOut: bigint;
    amountInMaximum: bigint;
    sqrtPriceLimitX96: bigint;
}
export interface ExactInputParams {
    path: string;
    recipient: string;
    deadline: bigint;
    amountIn: bigint;
    amountOutMinimum: bigint;
}
export interface ExactOutputParams {
    path: string;
    recipient: string;
    deadline: bigint;
    amountOut: bigint;
    amountInMaximum: bigint;
}
export interface IUniswapV3Pool {
    token0(): Promise<string>;
    token1(): Promise<string>;
    fee(): Promise<number>;
    tickSpacing(): Promise<number>;
    liquidity(): Promise<bigint>;
    slot0(): Promise<{
        sqrtPriceX96: bigint;
        tick: number;
        observationIndex: number;
        observationCardinality: number;
        observationCardinalityNext: number;
        feeProtocol: number;
        unlocked: boolean;
    }>;
}
export interface IUniswapV3Factory {
    getPool(tokenA: string, tokenB: string, fee: number): Promise<string>;
    createPool(tokenA: string, tokenB: string, fee: number): Promise<string>;
}
export declare const UNISWAP_V3_ROUTER_ABI: string[];
export declare const UNISWAP_V3_POOL_ABI: string[];
export declare const UNISWAP_V3_FACTORY_ABI: string[];
//# sourceMappingURL=IUniswapV3.d.ts.map