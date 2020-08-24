// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "./AdminUpgradeabilityProxy.sol";

/**
 * @notice Proxy for BasketManager.
 * @dev We define separate proxy contracts for BasketManager and BasketCore to help truffle deployment.
 */
contract BasketManagerProxy is AdminUpgradeabilityProxy {

    constructor(address _logic, address _admin, bytes memory _data) AdminUpgradeabilityProxy(_logic, _admin, _data) public payable {}
}