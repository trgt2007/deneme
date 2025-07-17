// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockAavePool {
    using SafeERC20 for IERC20;

    mapping(address => uint256) public flashLoanFees;

    constructor() {
        // Set default flash loan fee to 0.09%
        flashLoanFees[address(0)] = 9; // 0.09% in basis points (9/10000)
    }

    function flashLoan(
        address receiverAddress,
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata modes,
        address onBehalfOf,
        bytes calldata params,
        uint16 referralCode
    ) external {
        require(assets.length == amounts.length, "Inconsistent params length");
        
        // Calculate premiums
        uint256[] memory premiums = new uint256[](assets.length);
        for (uint256 i = 0; i < assets.length; i++) {
            premiums[i] = amounts[i] * flashLoanFees[assets[i]] / 10000;
            // Transfer tokens to receiver
            IERC20(assets[i]).safeTransfer(receiverAddress, amounts[i]);
        }

        // Call receiver
        (bool success, ) = receiverAddress.call(
            abi.encodeWithSignature(
                "executeOperation(address[],uint256[],uint256[],address,bytes)",
                assets,
                amounts,
                premiums,
                msg.sender,
                params
            )
        );
        require(success, "Flash loan execution failed");

        // Verify repayment
        for (uint256 i = 0; i < assets.length; i++) {
            uint256 expectedReturn = amounts[i] + premiums[i];
            require(
                IERC20(assets[i]).balanceOf(address(this)) >= expectedReturn,
                "Flash loan not repaid"
            );
        }
    }

    function setFlashLoanFee(address asset, uint256 fee) external {
        flashLoanFees[asset] = fee;
    }

    // For compatibility with IPool interface
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(address asset, uint256 amount, address to) external returns (uint256) {
        IERC20(asset).safeTransfer(to, amount);
        return amount;
    }
}
