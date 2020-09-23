// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./Vault.sol";

/**
 * @notice A vault with rewards.
 */
contract RewardedVault is Vault {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    IERC20 public rewardToken;
    uint256 public constant DURATION = 7 days;      // Rewards are vested for a fixed duration of 7 days.
    uint256 public periodFinish = 0;
    uint256 public rewardRate = 0;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public claims;

    event RewardAdded(uint256 reward);
    event RewardPaid(address indexed user, uint256 reward);

    constructor(address _vaultToken, address _rewardToken) public Vault(_vaultToken) {
        require(_rewardToken != address(0x0), "RewardedVault: Reward token not set");
        rewardToken = IERC20(_rewardToken);
    }

    modifier updateReward(address _account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (_account != address(0)) {
            rewards[_account] = earned(_account);
            userRewardPerTokenPaid[_account] = rewardPerTokenStored;
        }
        _;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return Math.min(block.timestamp, periodFinish);
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalSupply() == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored.add(
                lastTimeRewardApplicable()
                    .sub(lastUpdateTime)
                    .mul(rewardRate)
                    .mul(1e18)
                    .div(totalSupply())
            );
    }

    function earned(address _account) public view returns (uint256) {
        return
            balanceOf(_account)
                .mul(rewardPerToken().sub(userRewardPerTokenPaid[_account]))
                .div(1e18)
                .add(rewards[_account]);
    }

    function deposit(uint256 _amount) public virtual override updateReward(msg.sender) {
        super.deposit(_amount);
    }

    function depositAll() public virtual override updateReward(msg.sender) {
        super.depositAll();
    }

    function withdraw(uint256 _shares) public virtual override updateReward(msg.sender) {
        super.withdraw(_shares);
    }

    function withdrawAll() public virtual override updateReward(msg.sender) {
        super.withdrawAll();
    }

    /**
     * @dev Withdraws all balance and all rewards from the vault.
     */
    function exit() external {
        withdrawAll();
        claimReward();
    }

    /**
     * @dev Claims all rewards from the vault.
     */
    function claimReward() public updateReward(msg.sender) returns (uint256) {
        uint256 reward = earned(msg.sender);
        if (reward > 0) {
            claims[msg.sender] = claims[msg.sender].add(reward);
            rewards[msg.sender] = 0;
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }

        return reward;
    }

    /**
     * @dev Add new rewards to the vault. All rewards will be distributed linearly in 7 days.
     * @param _reward Amount of reward token to add.
     */
    function addRewardAmount(uint256 _reward) public updateReward(address(0)) {
        require(msg.sender == governance, "RewardedVault: Not governance");
        rewardToken.safeTransferFrom(msg.sender, address(this), _reward);

        if (block.timestamp >= periodFinish) {
            rewardRate = _reward.div(DURATION);
        } else {
            uint256 remaining = periodFinish.sub(block.timestamp);
            uint256 leftover = remaining.mul(rewardRate);
            rewardRate = _reward.add(leftover).div(DURATION);
        }
        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp.add(DURATION);
        emit RewardAdded(_reward);
    }
}