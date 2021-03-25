// SPDX-License-Identifier: MIT
pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @title acBTCx token contract. Collects and distributes acBTC income
 * to all acBTCx holders.
 * 
 * Credit: https://github.com/acBTCswap/acBTCswap/blob/master/contracts/acBTCBar.sol
 */
contract ACoconutMaker is ERC20("ACoconut Maker", "acBTCx"){
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    event Minted(address indexed account, uint256 share, uint256 amount);
    event Redeemed(address indexed account, uint256 share, uint256 amount);

    IERC20 public acBTC;

    // Define the acBTC token contract
    constructor(IERC20 _acBTC) public {
        acBTC = _acBTC;
    }

    /**
     * @dev Mints acBTCx with acBTC.
     * @param _amount Amount of acBTC used to mint acBTCx.
     */
    function mint(uint256 _amount) public {
        uint256 _totalAmount = acBTC.balanceOf(address(this));
        uint256 _totalShare = totalSupply();

        uint256 _share = 0;
        if (_totalAmount == 0 || _totalShare == 0) {
            _share = _amount;
        } 
        else {
            _share = _amount.mul(_totalShare).div(_totalAmount);
        }
        _mint(msg.sender, _amount);
        acBTC.safeTransferFrom(msg.sender, address(this), _amount);

        emit Minted(msg.sender, _share, _amount);
    }

    /**
     * @dev Redeems acBTCx to acBTC.
     * @param _share Amount of acBTCx to redeem.
     */
    function redeem(uint256 _share) public {
        uint256 _totalAmount = acBTC.balanceOf(address(this));
        uint256 _totalShare = totalSupply();
        uint256 _amount = _share.mul(_totalAmount).div(_totalShare);
        _burn(msg.sender, _share);
        acBTC.safeTransfer(msg.sender, _amount);

        emit Redeemed(msg.sender, _share, _amount);
    }
}