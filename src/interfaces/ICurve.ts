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

// Stable swap specific interface
export interface ICurveStableSwap extends ICurvePool {
    get_virtual_price(): Promise<bigint>;
    calc_token_amount(amounts: bigint[], is_deposit: boolean): Promise<bigint>;
}

// Crypto swap specific interface  
export interface ICurveCryptoSwap extends ICurvePool {
    price_oracle(): Promise<bigint>;
    last_prices(): Promise<bigint>;
    gamma(): Promise<bigint>;
}

// Factory interface
export interface ICurveFactory {
    deploy_pool(
        name: string,
        symbol: string,
        coins: string[],
        A: bigint,
        fee: bigint
    ): Promise<string>;
    find_pool_for_coins(coin_a: string, coin_b: string): Promise<string>;
}

// Mock implementations for development
export const CURVE_POOL_ABI = [
    "function coins(uint256) external view returns (address)",
    "function get_dy(int128, int128, uint256) external view returns (uint256)",
    "function exchange(int128, int128, uint256, uint256) external returns (uint256)",
    "function balances(uint256) external view returns (uint256)",
    "function fee() external view returns (uint256)",
    "function A() external view returns (uint256)"
];

export const CURVE_REGISTRY_ABI = [
    "function find_pool_for_coins(address, address) external view returns (address)",
    "function get_pool_info(address) external view returns (tuple)",
    "function get_n_coins(address) external view returns (uint256)",
    "function get_coins(address) external view returns (address[])",
    "function get_balances(address) external view returns (uint256[])"
];
