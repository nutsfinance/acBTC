// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @notice Mock renBTC.
 */
contract MockRenBTC is ERC20 {

    constructor() ERC20("Mock Ren BTC", "MockRenBTC") public {}

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }
}