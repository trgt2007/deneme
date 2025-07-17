"use strict";
/**
 * 🦄 Uniswap V3 Interface Tanımları
 * Uniswap V3 router ve pool'ları ile etkileşim için gerekli interface'ler
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNISWAP_V3_FACTORY_ABI = exports.UNISWAP_V3_POOL_ABI = exports.UNISWAP_V3_ROUTER_ABI = void 0;
// ABI'lar
exports.UNISWAP_V3_ROUTER_ABI = [
    "function exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160)) external returns (uint256)",
    "function exactOutputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160)) external returns (uint256)",
    "function exactInput((bytes,address,uint256,uint256,uint256)) external returns (uint256)",
    "function exactOutput((bytes,address,uint256,uint256,uint256)) external returns (uint256)"
];
exports.UNISWAP_V3_POOL_ABI = [
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function fee() external view returns (uint24)",
    "function tickSpacing() external view returns (int24)",
    "function liquidity() external view returns (uint128)",
    "function slot0() external view returns (uint160, int24, uint16, uint16, uint16, uint8, bool)"
];
exports.UNISWAP_V3_FACTORY_ABI = [
    "function getPool(address, address, uint24) external view returns (address)",
    "function createPool(address, address, uint24) external returns (address)"
];
//# sourceMappingURL=IUniswapV3.js.map