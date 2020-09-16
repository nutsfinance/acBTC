// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./IStrategy.sol";

contract Vault is ERC20 {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    IERC20 public token;
    address public governance;
    address public strategy;

    constructor(address _token) public
        ERC20(
            string(abi.encodePacked("ACoconut ", ERC20(_token).name())),
            string(abi.encodePacked("ac", ERC20(_token).symbol()))
        )
    {
        token = IERC20(_token);
        governance = msg.sender;
    }

    function balance() public view returns (uint256) {
        return strategy == address(0x0) ? token.balanceOf(address(this)) :
            token.balanceOf(address(this)).add(IStrategy(strategy).balanceOf());
    }

    function setGovernance(address _governance) public {
        require(msg.sender == governance, "Vault: Not governance");
        governance = _governance;
    }

    function setStrategy(address _strategy) public {
        require(msg.sender == governance, "Vault: Not governance");
        require(address(token) == IStrategy(_strategy).want(), "Vault: Different token");

        // If the vault has an existing strategy, withdraw all funds from it.
        if (strategy != address(0x0)) {
            IStrategy(strategy).withdrawAll();
        }

        strategy = _strategy;
        // Starts earning once a new strategy is set.
        earn();
    }

    function earn() public {
        require(strategy != address(0x0), "Vault: No strategy");
        uint256 _bal = token.balanceOf(address(this));
        token.safeTransfer(strategy, _bal);
        IStrategy(strategy).deposit();
    }

    function depositAll() public {
        deposit(token.balanceOf(msg.sender));
    }

    function deposit(uint256 _amount) public {
        uint256 _pool = balance();
        uint256 _before = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), _amount);
        uint256 _after = token.balanceOf(address(this));
        _amount = _after.sub(_before); // Additional check for deflationary tokens
        uint256 shares = 0;
        if (totalSupply() == 0) {
            shares = _amount;
        } else {
            shares = (_amount.mul(totalSupply())).div(_pool);
        }
        _mint(msg.sender, shares);
    }

    function withdrawAll() public {
        withdraw(balanceOf(msg.sender));
    }

    function withdraw(uint256 _shares) public {
        uint256 r = (balance().mul(_shares)).div(totalSupply());
        _burn(msg.sender, _shares);

        // Check balance
        uint256 b = token.balanceOf(address(this));
        if (b < r) {
            uint256 _withdraw = r.sub(b);
            // Ideally this should not happen. Put here for extra safety.
            require(strategy != address(0x0), "Vault: No strategy");
            IStrategy(strategy).withdraw(_withdraw);
            uint256 _after = token.balanceOf(address(this));
            uint256 _diff = _after.sub(b);
            if (_diff < _withdraw) {
                r = b.add(_diff);
            }
        }

        token.safeTransfer(msg.sender, r);
    }

    /**
     * @dev Used to salvage any token deposited into the vault by mistake.
     */
    function salvage(address tokenAddress, uint256 amount) public {
        require(msg.sender == governance, "Vault: Not governance");
        require(tokenAddress != address(token), "Vault: Cannot salvage");
        IERC20(tokenAddress).safeTransfer(governance, amount);
    }

    function getPricePerFullShare() public view returns (uint256) {
        return balance().mul(1e18).div(totalSupply());
    }
}