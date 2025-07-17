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

// ABI'lar
export const UNISWAP_V3_ROUTER_ABI = [
    "function exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160)) external returns (uint256)",
    "function exactOutputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160)) external returns (uint256)",
    "function exactInput((bytes,address,uint256,uint256,uint256)) external returns (uint256)",
    "function exactOutput((bytes,address,uint256,uint256,uint256)) external returns (uint256)"
];

export const UNISWAP_V3_POOL_ABI = [
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function fee() external view returns (uint24)",
    "function tickSpacing() external view returns (int24)",
    "function liquidity() external view returns (uint128)",
    "function slot0() external view returns (uint160, int24, uint16, uint16, uint16, uint8, bool)"
];

export const UNISWAP_V3_FACTORY_ABI = [
    "function getPool(address, address, uint24) external view returns (address)",
    "function createPool(address, address, uint24) external returns (address)"
];
