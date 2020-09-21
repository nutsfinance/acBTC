// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "../account/Account.sol";
import "../account/AccountFactory.sol";
import "../libraries/vaults/RewardedVault.sol";

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
    uint256 public numVaults;
    mapping(uint256 => address) public vaults;

    constructor(address _accountFactory) public {
        require(_accountFactory != address(0x0), "account factory not set");
        
        governance = msg.sender;
        accountFactory = _accountFactory;
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
     * @dev Add a new vault to the staking application.
     */
    function addVault(address _vault) public {
        require(msg.sender == governance, "not governance");
        require(_vault != address(0x0), "vault not set");

        vaults[numVaults++] = _vault;
    }

    /**
     * @dev Retrieve the active account of the user.
     */
    function _getAccount() internal view returns (Account) {
        address _account = AccountFactory(accountFactory).getAccount(msg.sender);
        require(_account != address(0x0), "no account");
        Account account = Account(payable(_account));
        require(account.isOperator(address(this)), "not operator");

        return account;
    }

    /**
     * @dev Stake token into ACoconutVault.
     * @param _vaultId ID of the vault to stake.
     * @param _amount Amount of token to stake.
     */
    function stake(uint256 _vaultId, uint256 _amount) public {
        require(vaults[_vaultId] != address(0x0), "no vault");
        require(_amount > 0, "zero amount");

        Account account = _getAccount();
        address vault = vaults[_vaultId];
        IERC20 token = RewardedVault(vault).token();
        account.approveToken(address(token), vault, _amount);

        bytes memory methodData = abi.encodeWithSignature("deposit(uint256)", _amount);
        account.invoke(vault, 0, methodData);

        emit Staked(msg.sender, _vaultId, address(token), _amount);
    }

    /**
     * @dev Unstake token out of RewardedVault.
     * @param _vaultId ID of the vault to unstake.
     * @param _amount Amount of token to unstake.
     */
    function unstake(uint256 _vaultId, uint256 _amount) public {
        require(vaults[_vaultId] != address(0x0), "no vault");
        require(_amount > 0, "zero amount");

        Account account = _getAccount();
        address vault = vaults[_vaultId];
        IERC20 token = RewardedVault(vault).token();
        // Important: Need to convert token amount to vault share!
        uint256 shares = _amount.div(RewardedVault(vault).getPricePerFullShare());
        bytes memory methodData = abi.encodeWithSignature("withdraw(uint256)", shares);
        account.invoke(vault, 0, methodData);

        emit Unstaked(msg.sender, _vaultId, address(token), _amount);
    }

    /**
     * @dev Claims rewards from RewardedVault.
     * @param _vaultId ID of the vault to unstake.
     */
    function claimRewards(uint256 _vaultId) public {
        require(vaults[_vaultId] != address(0x0), "no vault");

        Account account = _getAccount();
        address vault = vaults[_vaultId];
        IERC20 rewardToken = RewardedVault(vault).rewardToken();
        bytes memory methodData = abi.encodeWithSignature("getReward()");
        bytes memory methodResult = account.invoke(vault, 0, methodData);
        uint256 claimAmount = abi.decode(methodResult, (uint256));

        emit Claimed(msg.sender, _vaultId, address(rewardToken), claimAmount);
    }

    /**
     * @dev Retrieves the amount of token staked in RewardedVault.
     * @param _vaultId ID of the vault to unstake.
     */
    function getStakeBalance(uint256 _vaultId) public view returns (uint256) {
        require(vaults[_vaultId] != address(0x0), "no vault");

        address account = AccountFactory(accountFactory).getAccount(msg.sender);
        RewardedVault vault = RewardedVault(vaults[_vaultId]);
        uint256 totalBalance = vault.balance();
        uint256 totalSupply = vault.totalSupply();
        uint256 share = vault.balanceOf(account);

        return totalBalance.mul(share).div(totalSupply);
    }

    /**
     * @dev Return the amount of unclaim rewards.
     * @param _vaultId ID of the vault to unstake.
     */
    function getUnclaimedReward(uint256 _vaultId) public view returns (uint256) {
        require(vaults[_vaultId] != address(0x0), "no vault");

        address account = AccountFactory(accountFactory).getAccount(msg.sender);
        return RewardedVault(vaults[_vaultId]).rewards(account);
    }

    /**
     * @dev Returns the total amount(claimed + unclaimed) of rewards earned so far.
     * @param _vaultId ID of the vault to unstake.
     */
    function getTotalReward(uint256 _vaultId) public view returns (uint256) {
        require(vaults[_vaultId] != address(0x0), "no vault");

        address account = AccountFactory(accountFactory).getAccount(msg.sender);
        return RewardedVault(vaults[_vaultId]).earned(account);
    }
}