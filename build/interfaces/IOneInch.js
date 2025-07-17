"use strict";
/**
 * 🔄 1inch DEX Aggregator Interface Tanımları
 * 1inch API ile etkileşim için gerekli interface'ler
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ONEINCH_ENDPOINTS = exports.ONEINCH_BASE_URL = void 0;
// 1inch API endpoints
exports.ONEINCH_BASE_URL = 'https://api.1inch.dev/swap/v5.2/1';
exports.ONEINCH_ENDPOINTS = {
    QUOTE: '/quote',
    SWAP: '/swap',
    TOKENS: '/tokens',
    PROTOCOLS: '/liquidity-sources'
};
//# sourceMappingURL=IOneInch.js.map