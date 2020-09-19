// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "../libraries/upgradeability/AdminUpgradeabilityProxy.sol";

/**
 * @notice Proxy for ACoconutExchange to help truffle deployment.
 */
contract ACoconutExchangeProxy is AdminUpgradeabilityProxy {
    constructor(address _logic, address _admin) AdminUpgradeabilityProxy(_logic, _admin) public payable {}
}