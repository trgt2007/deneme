"use strict";
/**
 * 🍣 SushiSwap Interface Tanımları
 * SushiSwap router ve pool'ları ile etkileşim için gerekli interface'ler
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUSHISWAP_FACTORY_ABI = exports.SUSHISWAP_PAIR_ABI = exports.SUSHISWAP_ROUTER_ABI = void 0;
// ABI'lar
exports.SUSHISWAP_ROUTER_ABI = [
    "function getAmountsOut(uint256, address[]) external view returns (uint256[])",
    "function getAmountsIn(uint256, address[]) external view returns (uint256[])",
    "function swapExactTokensForTokens(uint256, uint256, address[], address, uint256) external returns (uint256[])",
    "function swapTokensForExactTokens(uint256, uint256, address[], address, uint256) external returns (uint256[])"
];
exports.SUSHISWAP_PAIR_ABI = [
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function getReserves() external view returns (uint112, uint112, uint32)",
    "function price0CumulativeLast() external view returns (uint256)",
    "function price1CumulativeLast() external view returns (uint256)",
    "function kLast() external view returns (uint256)"
];
exports.SUSHISWAP_FACTORY_ABI = [
    "function getPair(address, address) external view returns (address)",
    "function allPairs(uint256) external view returns (address)",
    "function allPairsLength() external view returns (uint256)",
    "function createPair(address, address) external returns (address)"
];
//# sourceMappingURL=ISushiSwap.js.map