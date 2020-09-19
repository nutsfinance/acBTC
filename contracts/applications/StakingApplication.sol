// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "../account/Account.sol";
import "../account/AccountFactory.sol";
import "../acoconut/ACoconutVault.sol";

/**
 * @dev Application to help stake and get rewards.
 */
contract StakingApplication {
    using SafeMath for uint256;

    address public accountFactory;
    address public aCoconutVault;

    constructor(address _accountFactory, address _aCoconutVault) public {
        require(_accountFactory != address(0x0), "account factory not set");
        require(_aCoconutVault != address(0x0), "acoconut vault not set");

        accountFactory = _accountFactory;
        aCoconutVault = _aCoconutVault;
    }

    /**
     * @dev Retrieve the active account of the user.
     */
    function _getAccount() internal returns (Account) {
        address _account = AccountFactory(accountFactory).getAccount(msg.sender);
        require(_account != address(0x0), "account not exist");
        Account account = Account(payable(_account));
        require(account.isOperator(address(this)), "not operator");

        return account;
    }

    /**
     * @dev Stake token into ACoconutVault.
     * @param _amount Amount of token to stake.
     */
    function stake(uint256 _amount) public {
        require(_amount > 0, "zero amount");
        Account account = _getAccount();

        IERC20 token = ACoconutVault(aCoconutVault).token();
        account.approveToken(address(token), address(this), _amount);

        bytes memory methodData = abi.encodeWithSignature("deposit(uint256)", _amount);
        account.invoke(aCoconutVault, 0, methodData);
    }

    /**
     * @dev Unstake token out of ACoconutVault.
     * @param _amount Amount of token to unstake.
     */
    function unstake(uint256 _amount) public {
        require(_amount > 0, "zero amount");
        Account account = _getAccount();

        // Important: Need to convert token amount to vault share!
        uint256 shares = _amount.div(ACoconutVault(aCoconutVault).getPricePerFullShare());
        bytes memory methodData = abi.encodeWithSignature("withdraw(uint256)", shares);
        account.invoke(aCoconutVault, 0, methodData);
    }

    /**
     * @dev Claims rewards from ACoconutVault.
     */
    function claimRewards() public {
        Account account = _getAccount();

        bytes memory methodData = abi.encodeWithSignature("getReward()");
        account.invoke(aCoconutVault, 0, methodData);
    }

    /**
     * @dev Retrieves the amount of token staked in ACoconut vault.
     */
    function getStakeBalance() public view returns (uint256) {
        address account = AccountFactory(accountFactory).getAccount(msg.sender);
        ACoconutVault vault = ACoconutVault(aCoconutVault);
        uint256 totalBalance = vault.balance();
        uint256 totalSupply = vault.totalSupply();
        uint256 share = vault.balanceOf(account);

        return totalBalance.mul(share).div(totalSupply);
    }

    /**
     * @dev Return the amount of unclaim rewards.
     */
    function getUnclaimedReward() public view returns (uint256) {
        address account = AccountFactory(accountFactory).getAccount(msg.sender);
        return ACoconutVault(aCoconutVault).rewards(account);
    }

    /**
     * @dev Returns the total amount(claimed + unclaimed) of rewards earned so far.
     */
    function getTotalReward() public view returns (uint256) {
        address account = AccountFactory(accountFactory).getAccount(msg.sender);
        return ACoconutVault(aCoconutVault).earned(account);
    }
}