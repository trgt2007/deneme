// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// DEX Router Interfaces
interface IUniswapV3Router {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

interface ISushiSwapRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

interface ICurvePool {
    function exchange(
        int128 i,
        int128 j,
        uint256 dx,
        uint256 min_dy
    ) external returns (uint256);
}

interface IOneInchRouter {
    struct SwapDescription {
        address srcToken;
        address dstToken;
        address srcReceiver;
        address dstReceiver;
        uint256 amount;
        uint256 minReturnAmount;
        uint256 flags;
    }
    
    function swap(
        address executor,
        SwapDescription calldata desc,
        bytes calldata permit,
        bytes calldata data
    ) external payable returns (uint256 returnAmount, uint256 spentAmount);
}

interface IBalancerVault {
    struct SingleSwap {
        bytes32 poolId;
        uint8 kind;
        address assetIn;
        address assetOut;
        uint256 amount;
        bytes userData;
    }
    
    struct FundManagement {
        address sender;
        bool fromInternalBalance;
        address payable recipient;
        bool toInternalBalance;
    }
    
    function swap(
        SingleSwap memory singleSwap,
        FundManagement memory funds,
        uint256 limit,
        uint256 deadline
    ) external payable returns (uint256);
}

/**
 * @title FlashLoanArbitrage
 * @author Arbitrage Bot System
 * @notice Ana flashloan arbitraj kontratı - Aave V3 kullanarak multi-DEX arbitraj yapar
 * @dev Kurumsal seviye güvenlik önlemleri ve optimizasyonlar içerir
 */
contract FlashLoanArbitrage is FlashLoanSimpleReceiverBase, Ownable2Step, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // ============ Constants ============
    uint256 private constant MAX_SLIPPAGE = 300; // 3% max slippage (basis points)
    uint256 private constant MIN_PROFIT_BASIS_POINTS = 30; // 0.3% minimum profit
    uint256 private constant BASIS_POINTS = 10000;
    
    // ============ State Variables ============
    
    // DEX Router addresses
    IUniswapV3Router public immutable uniswapV3Router;
    ISushiSwapRouter public immutable sushiSwapRouter;
    IOneInchRouter public immutable oneInchRouter;
    IBalancerVault public immutable balancerVault;
    
    // Curve pools mapping
    mapping(address => mapping(address => address)) public curvePools; // token0 => token1 => pool
    
    // Security & Risk Management
    mapping(address => bool) public authorizedCallers;
    mapping(address => uint256) public maxFlashLoanAmount;
    uint256 public maxGasPrice = 150 gwei;
    
    // Profit tracking
    mapping(address => uint256) public totalProfitByToken;
    uint256 public totalArbitrageCount;
    uint256 public successfulArbitrageCount;
    
    // Circuit breaker
    uint256 public maxDailyLoss = 1 ether; // Max 1 ETH loss per day
    uint256 public currentDayLoss;
    uint256 public lastResetTimestamp;
    
    // ============ Events ============
    event ArbitrageExecuted(
        address indexed token,
        uint256 amount,
        uint256 profit,
        string[] dexPath,
        uint256 gasUsed
    );
    
    event ArbitrageFailed(
        address indexed token,
        uint256 amount,
        string reason
    );
    
    event CircuitBreakerTriggered(uint256 totalLoss);
    event AuthorizedCallerUpdated(address indexed caller, bool authorized);
    event MaxFlashLoanAmountUpdated(address indexed token, uint256 amount);
    event CurvePoolUpdated(address indexed token0, address indexed token1, address pool);
    
    // ============ Errors ============
    error UnauthorizedCaller();
    error InvalidParameters();
    error InsufficientProfit();
    error ExcessiveGasPrice();
    error MaxLossExceeded();
    error FlashLoanFailed();
    error SwapFailed();
    
    // ============ Modifiers ============
    modifier onlyAuthorized() {
        if (!authorizedCallers[msg.sender] && msg.sender != owner()) {
            revert UnauthorizedCaller();
        }
        _;
    }
    
    modifier checkGasPrice() {
        if (tx.gasprice > maxGasPrice) {
            revert ExcessiveGasPrice();
        }
        _;
    }
    
    modifier resetDailyLossIfNeeded() {
        if (block.timestamp > lastResetTimestamp + 1 days) {
            currentDayLoss = 0;
            lastResetTimestamp = block.timestamp;
        }
        _;
    }
    
    // ============ Constructor ============
    constructor(
        address _addressProvider,
        address _uniswapV3Router,
        address _sushiSwapRouter,
        address _oneInchRouter,
        address _balancerVault
    ) FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider)) Ownable(msg.sender) {
        uniswapV3Router = IUniswapV3Router(_uniswapV3Router);
        sushiSwapRouter = ISushiSwapRouter(_sushiSwapRouter);
        oneInchRouter = IOneInchRouter(_oneInchRouter);
        balancerVault = IBalancerVault(_balancerVault);
        
        lastResetTimestamp = block.timestamp;
        authorizedCallers[msg.sender] = true;
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Ana arbitraj fonksiyonu - flashloan başlatır
     * @param asset Arbitraj yapılacak token adresi
     * @param amount Flashloan miktarı
     * @param params Arbitraj parametreleri (encoded)
     */
    function executeArbitrage(
        address asset,
        uint256 amount,
        bytes calldata params
    ) external onlyAuthorized checkGasPrice whenNotPaused resetDailyLossIfNeeded {
        // Validate parameters
        if (asset == address(0) || amount == 0) {
            revert InvalidParameters();
        }
        
        // Check max flashloan amount
        if (maxFlashLoanAmount[asset] > 0 && amount > maxFlashLoanAmount[asset]) {
            revert InvalidParameters();
        }
        
        totalArbitrageCount++;
        
        // Request flashloan from Aave
        POOL.flashLoanSimple(
            address(this),
            asset,
            amount,
            params,
            0 // referral code
        );
    }
    
    /**
     * @notice Aave flashloan callback
     * @dev Bu fonksiyon sadece Aave Pool tarafından çağrılabilir
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // Verify the flashloan was initiated by this contract
        if (initiator != address(this)) {
            revert FlashLoanFailed();
        }
        
        // Verify the caller is the Aave pool
        if (msg.sender != address(POOL)) {
            revert UnauthorizedCaller();
        }
        
        uint256 initialBalance = IERC20(asset).balanceOf(address(this));
        
        try this._executeArbitrageInternal(asset, amount, params) returns (uint256 finalBalance) {
            // Calculate profit
            uint256 totalDebt = amount + premium;
            
            if (finalBalance < totalDebt) {
                // Loss occurred
                uint256 loss = totalDebt - finalBalance;
                currentDayLoss += loss;
                
                if (currentDayLoss > maxDailyLoss) {
                    _pause(); // Circuit breaker
                    emit CircuitBreakerTriggered(currentDayLoss);
                }
                
                emit ArbitrageFailed(asset, amount, "Insufficient returns");
                revert InsufficientProfit();
            }
            
            uint256 profit = finalBalance - totalDebt;
            
            // Check minimum profit requirement
            uint256 minProfit = (amount * MIN_PROFIT_BASIS_POINTS) / BASIS_POINTS;
            if (profit < minProfit) {
                emit ArbitrageFailed(asset, amount, "Below minimum profit threshold");
                revert InsufficientProfit();
            }
            
            // Track profit
            totalProfitByToken[asset] += profit;
            successfulArbitrageCount++;
            
            // Approve Aave for repayment
            IERC20(asset).forceApprove(address(POOL), totalDebt);
            
            // Extract decoded path for event
            (string[] memory dexPath, , , ) = abi.decode(params, (string[], uint256[], address[], bytes[]));
            
            emit ArbitrageExecuted(
                asset,
                amount,
                profit,
                dexPath,
                initialBalance // Using as proxy for gas used
            );
            
            return true;
            
        } catch Error(string memory reason) {
            emit ArbitrageFailed(asset, amount, reason);
            revert SwapFailed();
        } catch {
            emit ArbitrageFailed(asset, amount, "Unknown error");
            revert SwapFailed();
        }
    }
    
    /**
     * @notice Internal arbitrage execution logic
     * @dev External call to enable try-catch error handling
     */
    function _executeArbitrageInternal(
        address asset,
        uint256 amount,
        bytes calldata params
    ) external returns (uint256) {
        // Only callable by this contract
        if (msg.sender != address(this)) {
            revert UnauthorizedCaller();
        }
        
        // Decode arbitrage path
        (
            string[] memory dexPath,
            uint256[] memory amounts,
            address[] memory tokens,
            bytes[] memory swapData
        ) = abi.decode(params, (string[], uint256[], address[], bytes[]));
        
        // Validate path
        if (dexPath.length == 0 || dexPath.length != swapData.length) {
            revert InvalidParameters();
        }
        
        // Execute swaps
        uint256 currentAmount = amount;
        address currentToken = asset;
        
        for (uint256 i = 0; i < dexPath.length; i++) {
            address nextToken = tokens[i];
            uint256 minAmountOut = amounts[i];
            
            // Apply slippage protection
            uint256 slippageAdjustedMin = (minAmountOut * (BASIS_POINTS - MAX_SLIPPAGE)) / BASIS_POINTS;
            
            currentAmount = _executeDexSwap(
                dexPath[i],
                currentToken,
                nextToken,
                currentAmount,
                slippageAdjustedMin,
                swapData[i]
            );
            
            currentToken = nextToken;
        }
        
        // Verify we ended with the original asset
        if (currentToken != asset) {
            revert InvalidParameters();
        }
        
        return currentAmount;
    }
    
    /**
     * @notice Execute swap on specific DEX
     */
    function _executeDexSwap(
        string memory dexName,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        bytes memory swapData
    ) private returns (uint256 amountOut) {
        // Approve the respective router
        if (keccak256(bytes(dexName)) == keccak256(bytes("UniswapV3"))) {
            IERC20(tokenIn).forceApprove(address(uniswapV3Router), amountIn);
            
            (uint24 fee, uint160 sqrtPriceLimitX96) = abi.decode(swapData, (uint24, uint160));
            
            IUniswapV3Router.ExactInputSingleParams memory params = IUniswapV3Router.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: fee,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: minAmountOut,
                sqrtPriceLimitX96: sqrtPriceLimitX96
            });
            
            amountOut = uniswapV3Router.exactInputSingle(params);
            
        } else if (keccak256(bytes(dexName)) == keccak256(bytes("SushiSwap"))) {
            IERC20(tokenIn).forceApprove(address(sushiSwapRouter), amountIn);
            
            address[] memory path = new address[](2);
            path[0] = tokenIn;
            path[1] = tokenOut;
            
            uint[] memory amounts = sushiSwapRouter.swapExactTokensForTokens(
                amountIn,
                minAmountOut,
                path,
                address(this),
                block.timestamp
            );
            
            amountOut = amounts[amounts.length - 1];
            
        } else if (keccak256(bytes(dexName)) == keccak256(bytes("Curve"))) {
            address pool = curvePools[tokenIn][tokenOut];
            if (pool == address(0)) {
                revert InvalidParameters();
            }
            
            IERC20(tokenIn).forceApprove(pool, amountIn);
            
            (int128 i, int128 j) = abi.decode(swapData, (int128, int128));
            
            amountOut = ICurvePool(pool).exchange(i, j, amountIn, minAmountOut);
            
        } else if (keccak256(bytes(dexName)) == keccak256(bytes("1inch"))) {
            IERC20(tokenIn).forceApprove(address(oneInchRouter), amountIn);
            
            (address executor, bytes memory permitData, bytes memory executorData) = 
                abi.decode(swapData, (address, bytes, bytes));
            
            IOneInchRouter.SwapDescription memory desc = IOneInchRouter.SwapDescription({
                srcToken: tokenIn,
                dstToken: tokenOut,
                srcReceiver: executor,
                dstReceiver: address(this),
                amount: amountIn,
                minReturnAmount: minAmountOut,
                flags: 0
            });
            
            (amountOut, ) = oneInchRouter.swap(executor, desc, permitData, executorData);
            
        } else if (keccak256(bytes(dexName)) == keccak256(bytes("Balancer"))) {
            IERC20(tokenIn).forceApprove(address(balancerVault), amountIn);
            
            (bytes32 poolId, bytes memory userData) = abi.decode(swapData, (bytes32, bytes));
            
            IBalancerVault.SingleSwap memory singleSwap = IBalancerVault.SingleSwap({
                poolId: poolId,
                kind: 0, // GIVEN_IN
                assetIn: tokenIn,
                assetOut: tokenOut,
                amount: amountIn,
                userData: userData
            });
            
            IBalancerVault.FundManagement memory funds = IBalancerVault.FundManagement({
                sender: address(this),
                fromInternalBalance: false,
                recipient: payable(address(this)),
                toInternalBalance: false
            });
            
            amountOut = balancerVault.swap(singleSwap, funds, minAmountOut, block.timestamp);
        } else {
            revert InvalidParameters();
        }
        
        // Verify we got at least the minimum amount
        if (amountOut < minAmountOut) {
            revert InsufficientProfit();
        }
        
        return amountOut;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update authorized caller status
     */
    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        authorizedCallers[caller] = authorized;
        emit AuthorizedCallerUpdated(caller, authorized);
    }
    
    /**
     * @notice Set maximum flashloan amount for a token
     */
    function setMaxFlashLoanAmount(address token, uint256 amount) external onlyOwner {
        maxFlashLoanAmount[token] = amount;
        emit MaxFlashLoanAmountUpdated(token, amount);
    }
    
    /**
     * @notice Update Curve pool address
     */
    function setCurvePool(address token0, address token1, address pool) external onlyOwner {
        curvePools[token0][token1] = pool;
        curvePools[token1][token0] = pool; // Bidirectional
        emit CurvePoolUpdated(token0, token1, pool);
    }
    
    /**
     * @notice Update max gas price
     */
    function setMaxGasPrice(uint256 _maxGasPrice) external onlyOwner {
        maxGasPrice = _maxGasPrice;
    }
    
    /**
     * @notice Update max daily loss
     */
    function setMaxDailyLoss(uint256 _maxDailyLoss) external onlyOwner {
        maxDailyLoss = _maxDailyLoss;
    }
    
    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Emergency withdraw
     */
    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance > 0) {
            IERC20(token).safeTransfer(owner(), balance);
        }
    }
    
    /**
     * @notice Withdraw profits
     */
    function withdrawProfits(address token, uint256 amount) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (amount > balance) {
            revert InvalidParameters();
        }
        IERC20(token).safeTransfer(owner(), amount);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get contract statistics
     */
    function getStatistics() external view returns (
        uint256 totalCount,
        uint256 successCount,
        uint256 dailyLoss,
        bool isPaused
    ) {
        return (
            totalArbitrageCount,
            successfulArbitrageCount,
            currentDayLoss,
            paused()
        );
    }
    
    /**
     * @notice Check if an address is authorized
     */
    function isAuthorized(address caller) external view returns (bool) {
        return authorizedCallers[caller] || caller == owner();
    }
    
    // ============ Receive Ether ============
    receive() external payable {}
}