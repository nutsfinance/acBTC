// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "../account/Account.sol";
import "../account/AccountFactory.sol";
import "../libraries/vaults/Controller.sol";

/**
 * @dev Application to help stake and get rewards.
 */
contract StakingApplication {
    using SafeMath for uint256;

    event Staked(address indexed staker, uint256 indexed vaultId, address indexed token, uint256 amount);
    event Unstaked(address indexed staker, uint256 indexed vaultId, address indexed token, uint256 amount);
    event Claimed(address indexed staker, uint256 indexed vaultId, address indexed token, uint256 amount);

    address public governance;
    address public accountFactory;
    Controller public controller;

    constructor(address _accountFactory, address _controller) public {
        require(_accountFactory != address(0x0), "account factory not set");
        require(_controller != address(0x0), "controller not set");
        
        governance = msg.sender;
        accountFactory = _accountFactory;
        controller = Controller(_controller);
    }

    /**
     * @dev Updates the govenance address.
     */
    function setGovernance(address _governance) public {
        require(msg.sender == governance, "not governance");
        governance = _governance;
    }

    /**
     * @dev Updates the account factory.
     */
    function setAccountFactory(address _accountFactory) public {
        require(msg.sender == governance, "not governance");
        require(_accountFactory != address(0x0), "account factory not set");

        accountFactory = _accountFactory;
    }

    /**
     * @dev Updates the controller address.
     */
    function setController(address _controller) public {
        require(msg.sender == governance, "not governance");
        require(_controller != address(0x0), "controller not set");

        controller = Controller(_controller);
    }

    /**
     * @dev Retrieve the active account of the user.
     */
    function _getAccount() internal view returns (Account) {
        address _account = AccountFactory(accountFactory).accounts(msg.sender);
        require(_account != address(0x0), "no account");
        Account account = Account(payable(_account));
        require(account.isOperator(address(this)), "not operator");

        return account;
    }

    /**
     * @dev Stake token into rewarded vault.
     * @param _vaultId ID of the vault to stake.
     * @param _amount Amount of token to stake.
     */
    function stake(uint256 _vaultId, uint256 _amount) public {
        address _vault = controller.vaults(_vaultId);
        require(_vault != address(0x0), "no vault");
        require(_amount > 0, "zero amount");

        Account account = _getAccount();
        RewardedVault vault = RewardedVault(_vault);
        IERC20 token = vault.token();
        account.approveToken(address(token), address(vault), _amount);

        bytes memory methodData = abi.encodeWithSignature("deposit(uint256)", _amount);
        account.invoke(address(vault), 0, methodData);

        emit Staked(msg.sender, _vaultId, address(token), _amount);
    }

    /**
     * @dev Unstake token out of RewardedVault.
     * @param _vaultId ID of the vault to unstake.
     * @param _amount Amount of token to unstake.
     */
    function unstake(uint256 _vaultId, uint256 _amount) public {
        address _vault = controller.vaults(_vaultId);
        require(_vault != address(0x0), "no vault");
        require(_amount > 0, "zero amount");

        Account account = _getAccount();
        RewardedVault vault = RewardedVault(_vault);
        IERC20 token = vault.token();

        // Important: Need to convert token amount to vault share!
        uint256 totalBalance = vault.balance();
        uint256 totalSupply = vault.totalSupply();
        uint256 shares = _amount.mul(totalSupply).div(totalBalance);
        bytes memory methodData = abi.encodeWithSignature("withdraw(uint256)", shares);
        account.invoke(address(vault), 0, methodData);

        emit Unstaked(msg.sender, _vaultId, address(token), _amount);
    }

    /**
     * @dev Unstake all token out of RewardedVault.
     * @param _vaultId ID of the vault to unstake.
     */
    function unstakeAll(uint256 _vaultId) public {
        address _vault = controller.vaults(_vaultId);
        require(_vault != address(0x0), "no vault");

        Account account = _getAccount();
        RewardedVault vault = RewardedVault(_vault);
        IERC20 token = vault.token();

        uint256 totalBalance = vault.balance();
        uint256 totalSupply = vault.totalSupply();
        uint256 shares = vault.balanceOf(address(account));
        uint256 amount = shares.mul(totalBalance).div(totalSupply);
        bytes memory methodData = abi.encodeWithSignature("withdraw(uint256)", shares);
        account.invoke(address(vault), 0, methodData);

        emit Unstaked(msg.sender, _vaultId, address(token), amount);
    }

    /**
     * @dev Claims rewards from RewardedVault.
     * @param _vaultId ID of the vault to unstake.
     */
    function claimRewards(uint256 _vaultId) public {
        address _vault = controller.vaults(_vaultId);
        require(_vault != address(0x0), "no vault");

        Account account = _getAccount();
        RewardedVault vault = RewardedVault(_vault);
        IERC20 rewardToken = IERC20(controller.rewardToken());
        bytes memory methodData = abi.encodeWithSignature("claimReward()");
        bytes memory methodResult = account.invoke(address(vault), 0, methodData);
        uint256 claimAmount = abi.decode(methodResult, (uint256));

        emit Claimed(msg.sender, _vaultId, address(rewardToken), claimAmount);
    }

    /**
     * @dev Retrieves the amount of token staked in RewardedVault.
     * @param _vaultId ID of the vault to unstake.
     */
    function getStakeBalance(uint256 _vaultId) public view returns (uint256) {
        address _vault = controller.vaults(_vaultId);
        require(_vault != address(0x0), "no vault");
        address account = AccountFactory(accountFactory).accounts(msg.sender);
        require(account != address(0x0), "no account");

        RewardedVault vault = RewardedVault(_vault);
        uint256 totalBalance = vault.balance();
        uint256 totalSupply = vault.totalSupply();
        uint256 share = vault.balanceOf(account);

        return totalBalance.mul(share).div(totalSupply);
    }

    /**
     * @dev Returns the total balance of the vault.
     */
    function getVaultBalance(uint256 _vaultId) public view returns (uint256) {
        address _vault = controller.vaults(_vaultId);
        require(_vault != address(0x0), "no vault");
        address account = AccountFactory(accountFactory).accounts(msg.sender);
        require(account != address(0x0), "no account");

        RewardedVault vault = RewardedVault(_vault);
        return vault.balance();
    }

    /**
     * @dev Return the amount of unclaim rewards.
     * @param _vaultId ID of the vault to unstake.
     */
    function getUnclaimedReward(uint256 _vaultId) public view returns (uint256) {
        address _vault = controller.vaults(_vaultId);
        require(_vault != address(0x0), "no vault");
        address account = AccountFactory(accountFactory).accounts(msg.sender);
        require(account != address(0x0), "no account");

        return RewardedVault(_vault).earned(account);
    }

    /**
     * @dev Return the amount of claim rewards.
     * @param _vaultId ID of the vault to unstake.
     */
    function getClaimedReward(uint256 _vaultId) public view returns (uint256) {
        address _vault = controller.vaults(_vaultId);
        require(_vault != address(0x0), "no vault");
        address account = AccountFactory(accountFactory).accounts(msg.sender);
        require(account != address(0x0), "no account");
        
        return RewardedVault(_vault).claims(account);
    }
}