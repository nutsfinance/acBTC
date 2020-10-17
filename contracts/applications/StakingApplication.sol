// SPDX-License-Identifier: MIT
pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "../account/Account.sol";
import "../account/AccountFactory.sol";
import "../libraries/vaults/Controller.sol";
import "../libraries/upgradeability/Initializable.sol";

/**
 * @dev Application to help stake and get rewards.
 */
contract StakingApplication is Initializable {
    using SafeMath for uint256;

    event Staked(address indexed account, uint256 indexed vaultId, address token, uint256 amount);
    event Unstaked(address indexed account, uint256 indexed vaultId, address token, uint256 amount);
    event Claimed(address indexed account, uint256 indexed vaultId, address token, uint256 amount);
    event Exited(address indexed account, uint256 indexed vaultId);

    address public governance;
    Controller public controller;

    /**
     * @dev Initializes staking application.
     */
    function initialize(address _controller) public initializer {
        require(_controller != address(0x0), "controller not set");
        
        governance = msg.sender;
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
     * @dev Updates the controller address.
     */
    function setController(address _controller) public {
        require(msg.sender == governance, "not governance");
        require(_controller != address(0x0), "controller not set");

        controller = Controller(_controller);
    }

    modifier validAccount(address _account) {
        Account account = Account(payable(_account));
        require(account.owner() == msg.sender, "not owner");
        require(account.isOperator(address(this)), "not operator");
        _;
    }

    /**
     * @dev Stake token into rewarded vault.
     * @param _account The account address used to stake.
     * @param _vaultId ID of the vault to stake.
     * @param _amount Amount of token to stake.
     * @param _claimRewards Whether to claim rewards at the same time.
     */
    function stake(address _account, uint256 _vaultId, uint256 _amount, bool _claimRewards) public validAccount(_account) {
        address _vault = controller.vaults(_vaultId);
        require(_vault != address(0x0), "no vault");
        require(_amount > 0, "zero amount");

        Account account = Account(payable(_account));
        RewardedVault vault = RewardedVault(_vault);
        IERC20 token = vault.token();
        account.approveToken(address(token), address(vault), _amount);

        bytes memory methodData = abi.encodeWithSignature("deposit(uint256)", _amount);
        account.invoke(address(vault), 0, methodData);

        emit Staked(_account, _vaultId, address(token), _amount);

        if (_claimRewards) {
            claimRewards(_account, _vaultId);
        }
    }

    /**
     * @dev Unstake token out of RewardedVault.
     * @param _account The account address used to unstake.
     * @param _vaultId ID of the vault to unstake.
     * @param _amount Amount of token to unstake.
     * @param _claimRewards Whether to claim rewards at the same time.
     */
    function unstake(address _account, uint256 _vaultId, uint256 _amount, bool _claimRewards) public validAccount(_account) {
        address _vault = controller.vaults(_vaultId);
        require(_vault != address(0x0), "no vault");
        require(_amount > 0, "zero amount");

        Account account = Account(payable(_account));
        RewardedVault vault = RewardedVault(_vault);
        IERC20 token = vault.token();

        // Important: Need to convert token amount to vault share!
        uint256 totalBalance = vault.balance();
        uint256 totalSupply = vault.totalSupply();
        uint256 shares = _amount.mul(totalSupply).div(totalBalance);
        bytes memory methodData = abi.encodeWithSignature("withdraw(uint256)", shares);
        account.invoke(address(vault), 0, methodData);

        emit Unstaked(_account, _vaultId, address(token), _amount);

        if (_claimRewards) {
            claimRewards(_account, _vaultId);
        }
    }

    /**
     * @dev Exit the vault and claims all rewards.
     * @param _account The account address used to exit.
     * @param _vaultId ID of the vault to unstake.
     */
    function exit(address _account, uint256 _vaultId) public validAccount(_account) {
        address _vault = controller.vaults(_vaultId);
        require(_vault != address(0x0), "no vault");

        Account account = Account(payable(_account));
        RewardedVault vault = RewardedVault(_vault);

        bytes memory methodData = abi.encodeWithSignature("exit()");
        account.invoke(address(vault), 0, methodData);

        emit Exited(_account, _vaultId);
    }

    /**
     * @dev Claims rewards from RewardedVault.
     * @param _account The account address used to claim rewards.
     * @param _vaultId ID of the vault to unstake.
     */
    function claimRewards(address _account, uint256 _vaultId) public validAccount(_account) {
        address _vault = controller.vaults(_vaultId);
        require(_vault != address(0x0), "no vault");

        Account account = Account(payable(_account));
        RewardedVault vault = RewardedVault(_vault);
        IERC20 rewardToken = IERC20(controller.rewardToken());
        bytes memory methodData = abi.encodeWithSignature("claimReward()");
        bytes memory methodResult = account.invoke(address(vault), 0, methodData);
        uint256 claimAmount = abi.decode(methodResult, (uint256));

        emit Claimed(_account, _vaultId, address(rewardToken), claimAmount);
    }

    /**
     * @dev Returns the total balance of the vault.
     */
    function getVaultBalance(uint256 _vaultId) public view returns (uint256) {
        address _vault = controller.vaults(_vaultId);
        require(_vault != address(0x0), "no vault");

        RewardedVault vault = RewardedVault(_vault);
        return vault.balance();
    }

    /**
     * @dev Retrieves the amount of token staked in RewardedVault.
     * @param _account The account address used to stake.
     * @param _vaultId ID of the vault to unstake.
     */
    function getStakeBalance(address _account, uint256 _vaultId) public view returns (uint256) {
        address _vault = controller.vaults(_vaultId);
        require(_vault != address(0x0), "no vault");

        RewardedVault vault = RewardedVault(_vault);
        uint256 totalBalance = vault.balance();
        uint256 totalSupply = vault.totalSupply();
        uint256 share = vault.balanceOf(_account);

        return totalBalance.mul(share).div(totalSupply);
    }

    /**
     * @dev Return the amount of unclaim rewards.
     * @param _account The account address used to stake.
     * @param _vaultId ID of the vault to unstake.
     */
    function getUnclaimedReward(address _account, uint256 _vaultId) public view returns (uint256) {
        address _vault = controller.vaults(_vaultId);
        require(_vault != address(0x0), "no vault");

        return RewardedVault(_vault).earned(_account);
    }

    /**
     * @dev Return the amount of claim rewards.
     * @param _account The account address used to stake.
     * @param _vaultId ID of the vault to unstake.
     */
    function getClaimedReward(address _account, uint256 _vaultId) public view returns (uint256) {
        address _vault = controller.vaults(_vaultId);
        require(_vault != address(0x0), "no vault");
        
        return RewardedVault(_vault).claims(_account);
    }
}