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
        require(msg.sender == governance, "not governance");
        governance = _governance;
    }

    function setMinter(address _user, bool _allowed) public {
        require(msg.sender == governance, "not governance");
        minters[_user] = _allowed;
    }

    function mint(address _user, uint256 _amount) public override {
        require(minters[msg.sender], "not minter");
        _mint(_user, _amount);
    }

    function burn(address _user, uint256 _amount) public override {
        require(minters[msg.sender], "not minter");
        _burn(_user, _amount);
    }
}