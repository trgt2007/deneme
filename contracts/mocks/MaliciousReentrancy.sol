// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MaliciousReentrancy {
    address private target;
    bool private attacking = false;

    constructor(address _target) {
        target = _target;
    }

    function attemptReentrancy() external {
        attacking = true;
        // This would attempt to call the target contract recursively
        // In a real attack, this would try to exploit reentrancy vulnerabilities
        (bool success, ) = target.call(abi.encodeWithSignature("pause()"));
        require(!success, "Reentrancy should be prevented");
    }

    fallback() external payable {
        if (attacking) {
            // Attempt to call the target again (reentrancy)
            (bool success, ) = target.call(abi.encodeWithSignature("pause()"));
            // This should fail due to reentrancy guard
        }
    }
}
