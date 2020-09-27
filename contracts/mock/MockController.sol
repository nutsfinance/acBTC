// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "../libraries/vaults/RewardedVault.sol";

contract MockController {
    address public rewardToken;

    constructor(address _rewardToken) public {
        rewardToken = _rewardToken;
    }

    function notifyReward(address vault, uint256 rewardAmount) public {
        RewardedVault(vault).notifyRewardAmount(rewardAmount);
    }
}