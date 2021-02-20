// SPDX-License-Identifier: MIT
pragma solidity 0.6.8;

import "../upgradeability/AdminUpgradeabilityProxy.sol";

/**
 * @notice Proxy for ACoconutSwap to help truffle deployment.
 */
contract ACoconutSwapProxy is AdminUpgradeabilityProxy {
    constructor(address _logic, address _admin) AdminUpgradeabilityProxy(_logic, _admin) public payable {}
}