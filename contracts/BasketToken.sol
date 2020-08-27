// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title A composite ERC20 token which are backed by a basket of ERC20 tokens.
 * @dev Each basket token is backed 1:1 by the underlying tokens.
 * @dev The basket token and all underlying tokens should have the same decimals.
 */
contract BasketToken is ERC20 {

    /**
     * @dev Address of the BasketCore contract. The BasketCore contract is upgradeable so the value of
     * this field does not need to be updated.
     * @dev The BasketToken contract must be deployed after the BasketCore contract is deployed.
     */
    address private _basketCoreAddress;

    /**
     * @dev Only BasketCore can call functions affected by this modifier.
     */
    modifier onlyBasketCore {
        require(msg.sender == _basketCoreAddress, "BasketToken: The caller must be BasketCore contract");
        _;
    }

    constructor (string memory name, string memory symbol, address basketCoreAddress) ERC20(name, symbol) public {
        _basketCoreAddress = basketCoreAddress;
    }

    /**
     * @dev Mints basket token to the account address.
     * Only BasketCore contract can mint new tokens.
     */
    function mint(address account, uint256 amount) public onlyBasketCore {
        _mint(account, amount);
    }

    /**
     * @dev Burns basket token from the account address.
     * Only BasketCore contract can burn existing tokens.
     */
    function burn(address account, uint256 amount) public onlyBasketCore {
        _burn(account, amount);
    }
}