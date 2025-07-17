/**
 * 🏦 Curve Finance Interface Tanımları
 * Curve pool'ları ile etkileşim için gerekli interface'ler
 */
export interface ICurvePool {
    coins(index: number): Promise<string>;
    get_dy(i: number, j: number, dx: bigint): Promise<bigint>;
    exchange(i: number, j: number, dx: bigint, min_dy: bigint): Promise<any>;
    balances(index: number): Promise<bigint>;
    fee(): Promise<bigint>;
    A(): Promise<bigint>;
}
export interface ICurveRegistry {
    find_pool_for_coins(from: string, to: string): Promise<string>;
    get_pool_info(pool: string): Promise<any>;
    get_n_coins(pool: string): Promise<bigint>;
    get_coins(pool: string): Promise<string[]>;
    get_balances(pool: string): Promise<bigint[]>;
}
export interface ICurveAddressProvider {
    get_registry(): Promise<string>;
    get_address(id: number): Promise<string>;
}
export interface ICurveGauge {
    lp_token(): Promise<string>;
    working_supply(): Promise<bigint>;
    reward_tokens(index: number): Promise<string>;
}
export interface ICurveStableSwap extends ICurvePool {
    get_virtual_price(): Promise<bigint>;
    calc_token_amount(amounts: bigint[], is_deposit: boolean): Promise<bigint>;
}
export interface ICurveCryptoSwap extends ICurvePool {
    price_oracle(): Promise<bigint>;
    last_prices(): Promise<bigint>;
    gamma(): Promise<bigint>;
}
export interface ICurveFactory {
    deploy_pool(name: string, symbol: string, coins: string[], A: bigint, fee: bigint): Promise<string>;
    find_pool_for_coins(coin_a: string, coin_b: string): Promise<string>;
}
export declare const CURVE_POOL_ABI: string[];
export declare const CURVE_REGISTRY_ABI: string[];
//# sourceMappingURL=ICurve.d.ts.map