/**
 * 🍣 SushiSwap Interface Tanımları
 * SushiSwap router ve pool'ları ile etkileşim için gerekli interface'ler
 */
export interface ISushiSwapRouter {
    getAmountsOut(amountIn: bigint, path: string[]): Promise<bigint[]>;
    getAmountsIn(amountOut: bigint, path: string[]): Promise<bigint[]>;
    swapExactTokensForTokens(amountIn: bigint, amountOutMin: bigint, path: string[], to: string, deadline: bigint): Promise<any>;
    swapTokensForExactTokens(amountOut: bigint, amountInMax: bigint, path: string[], to: string, deadline: bigint): Promise<any>;
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
export declare const SUSHISWAP_ROUTER_ABI: string[];
export declare const SUSHISWAP_PAIR_ABI: string[];
export declare const SUSHISWAP_FACTORY_ABI: string[];
//# sourceMappingURL=ISushiSwap.d.ts.map