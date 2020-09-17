// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./IPoolToken.sol";

/**
 * @dev ACoconut BTC token.
 */
contract ACoconutBTC is ERC20, IPoolToken {
    
    address governance;
    mapping(address => bool) minters;

    constructor() public ERC20("ACoconut BTC", "acBTC") {
        governance = msg.sender;
    }

    /**
     * @dev Updates the govenance address.
     */
    function setGovernance(address _governance) public {
        require(msg.sender == governance, "ACoconutBTC: Not governance");
        governance = _governance;
    }

    function setMinter(address user, bool allowed) public {
        require(msg.sender == governance, "ACoconutBTC: not governance");
        minters[user] = allowed;
    }

    function mint(address user, uint256 amount) public override {
        require(minters[msg.sender], "ACoconutBTC: not minter");
        _mint(user, amount);
    }

    function burn(address user, uint256 amount) public override {
        require(minters[msg.sender], "ACoconutBTC: not minter");
        _burn(user, amount);
    }
}