/**
 * 🍣 SushiSwap Interface Tanımları
 * SushiSwap router ve pool'ları ile etkileşim için gerekli interface'ler
 */

export interface ISushiSwapRouter {
    getAmountsOut(amountIn: bigint, path: string[]): Promise<bigint[]>;
    getAmountsIn(amountOut: bigint, path: string[]): Promise<bigint[]>;
    swapExactTokensForTokens(
        amountIn: bigint,
        amountOutMin: bigint,
        path: string[],
        to: string,
        deadline: bigint
    ): Promise<any>;
    swapTokensForExactTokens(
        amountOut: bigint,
        amountInMax: bigint,
        path: string[],
        to: string,
        deadline: bigint
    ): Promise<any>;
}

export interface ISushiSwapPair {
    token0(): Promise<string>;
    token1(): Promise<string>;
    getReserves(): Promise<[bigint, bigint, number]>;
    price0CumulativeLast(): Promise<bigint>;
    price1CumulativeLast(): Promise<bigint>;
    kLast(): Promise<bigint>;
}

export interface ISushiSwapFactory {
    getPair(tokenA: string, tokenB: string): Promise<string>;
    allPairs(index: bigint): Promise<string>;
    allPairsLength(): Promise<bigint>;
    createPair(tokenA: string, tokenB: string): Promise<string>;
}

export interface ISushiSwapPair {
    token0(): Promise<string>;
    token1(): Promise<string>;
    getReserves(): Promise<{
        reserve0: bigint;
        reserve1: bigint;
        blockTimestampLast: bigint;
    }>;
    price0CumulativeLast(): Promise<bigint>;
    price1CumulativeLast(): Promise<bigint>;
    kLast(): Promise<bigint>;
}

export interface ISushiSwapFactory {
    getPair(tokenA: string, tokenB: string): Promise<string>;
    allPairsLength(): Promise<bigint>;
    allPairs(index: number): Promise<string>;
    createPair(tokenA: string, tokenB: string): Promise<string>;
}

// ABI'lar
export const SUSHISWAP_ROUTER_ABI = [
    "function getAmountsOut(uint256, address[]) external view returns (uint256[])",
    "function getAmountsIn(uint256, address[]) external view returns (uint256[])",
    "function swapExactTokensForTokens(uint256, uint256, address[], address, uint256) external returns (uint256[])",
    "function swapTokensForExactTokens(uint256, uint256, address[], address, uint256) external returns (uint256[])"
];

export const SUSHISWAP_PAIR_ABI = [
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function getReserves() external view returns (uint112, uint112, uint32)",
    "function price0CumulativeLast() external view returns (uint256)",
    "function price1CumulativeLast() external view returns (uint256)",
    "function kLast() external view returns (uint256)"
];

export const SUSHISWAP_FACTORY_ABI = [
    "function getPair(address, address) external view returns (address)",
    "function allPairs(uint256) external view returns (address)",
    "function allPairsLength() external view returns (uint256)",
    "function createPair(address, address) external returns (address)"
];
