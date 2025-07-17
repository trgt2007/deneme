"use strict";
/**
 * 🏦 Curve Finance Interface Tanımları
 * Curve pool'ları ile etkileşim için gerekli interface'ler
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURVE_REGISTRY_ABI = exports.CURVE_POOL_ABI = void 0;
// Mock implementations for development
exports.CURVE_POOL_ABI = [
    "function coins(uint256) external view returns (address)",
    "function get_dy(int128, int128, uint256) external view returns (uint256)",
    "function exchange(int128, int128, uint256, uint256) external returns (uint256)",
    "function balances(uint256) external view returns (uint256)",
    "function fee() external view returns (uint256)",
    "function A() external view returns (uint256)"
];
exports.CURVE_REGISTRY_ABI = [
    "function find_pool_for_coins(address, address) external view returns (address)",
    "function get_pool_info(address) external view returns (tuple)",
    "function get_n_coins(address) external view returns (uint256)",
    "function get_coins(address) external view returns (address[])",
    "function get_balances(address) external view returns (uint256[])"
];
//# sourceMappingURL=ICurve.js.map