// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockDEXRouter {
    using SafeERC20 for IERC20;

    address public immutable WETH;
    mapping(address => mapping(address => uint256)) public priceRatios;
    mapping(address => bool) public supportedTokens;

    constructor(address _weth, address[] memory _supportedTokens) {
        WETH = _weth;
        for (uint256 i = 0; i < _supportedTokens.length; i++) {
            supportedTokens[_supportedTokens[i]] = true;
        }
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        require(deadline >= block.timestamp, "Deadline expired");
        require(supportedTokens[tokenA] && supportedTokens[tokenB], "Unsupported token");

        // Transfer tokens from sender
        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountADesired);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountBDesired);

        // Set price ratios
        priceRatios[tokenA][tokenB] = (amountBDesired * 1e18) / amountADesired;
        priceRatios[tokenB][tokenA] = (amountADesired * 1e18) / amountBDesired;

        return (amountADesired, amountBDesired, amountADesired + amountBDesired);
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "Deadline expired");
        require(path.length >= 2, "Invalid path");

        amounts = new uint256[](path.length);
        amounts[0] = amountIn;

        // Transfer input token
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);

        // Calculate output amount
        uint256 currentAmount = amountIn;
        for (uint256 i = 0; i < path.length - 1; i++) {
            uint256 priceRatio = priceRatios[path[i]][path[i + 1]];
            if (priceRatio == 0) {
                priceRatio = 1e18; // Default 1:1 ratio
            }
            currentAmount = (currentAmount * priceRatio) / 1e18;
            amounts[i + 1] = currentAmount;
        }

        require(amounts[amounts.length - 1] >= amountOutMin, "Insufficient output amount");

        // Transfer output token
        IERC20(path[path.length - 1]).safeTransfer(to, amounts[amounts.length - 1]);

        return amounts;
    }

    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts)
    {
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;

        uint256 currentAmount = amountIn;
        for (uint256 i = 0; i < path.length - 1; i++) {
            uint256 priceRatio = priceRatios[path[i]][path[i + 1]];
            if (priceRatio == 0) {
                priceRatio = 1e18; // Default 1:1 ratio
            }
            currentAmount = (currentAmount * priceRatio) / 1e18;
            amounts[i + 1] = currentAmount;
        }

        return amounts;
    }

    function setPriceRatio(address tokenA, address tokenB, uint256 amountB, uint256 amountA) external {
        priceRatios[tokenA][tokenB] = (amountB * 1e18) / amountA;
        priceRatios[tokenB][tokenA] = (amountA * 1e18) / amountB;
    }

    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB)
        external
        pure
        returns (uint256 amountB)
    {
        require(amountA > 0, "Insufficient amount");
        require(reserveA > 0 && reserveB > 0, "Insufficient liquidity");
        amountB = (amountA * reserveB) / reserveA;
    }
}
