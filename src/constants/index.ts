/**
 * @title Constan// Gas Settings
export const DEFAULT_GAS_LIMIT = BigInt(500000);
export const MAX_GAS_PRICE = BigInt(100000000000); // 100 gwei
export const MIN_GAS_PRICE = BigInt(1000000000); // 1 gwei * @author Arbitrage Bot System
 * @notice Sistem konstantları
 */

// Contract addresses
export const FLASHLOAN_ARBITRAGE_ADDRESS = "0x0000000000000000000000000000000000000000";
export const AAVE_POOL_ADDRESS = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";

// Contract ABIs
export const FLASHLOAN_ARBITRAGE_ABI = [
  "function executeArbitrage(address asset, uint256 amount, bytes calldata params) external",
  "function paused() external view returns (bool)",
  "event ArbitrageExecuted(address indexed token, uint256 amount, uint256 profit, uint256 gasUsed)"
];

// DEX addresses
export const UNISWAP_V3_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
export const SUSHISWAP_ROUTER = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
export const CURVE_REGISTRY = "0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5";

// Gas settings
export const DEFAULT_GAS_LIMIT = BigInt(500000);
export const MAX_GAS_PRICE = BigInt(100000000000); // 100 gwei
export const MIN_GAS_PRICE = BigInt(1000000000); // 1 gwei

// Timing
export const OPPORTUNITY_DEADLINE_MS = 30000; // 30 seconds
export const PRICE_UPDATE_INTERVAL = 1000; // 1 second
export const GAS_UPDATE_INTERVAL = 5000; // 5 seconds

// Thresholds
export const MIN_PROFIT_WEI = BigInt(1000000000000000); // 0.001 ETH
export const MAX_SLIPPAGE_BPS = 300; // 3%
export const MAX_PRICE_IMPACT_BPS = 100; // 1%
