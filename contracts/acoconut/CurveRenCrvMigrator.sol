// SPDX-License-Identifier: MIT
pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "../libraries/curve/ICurveFi.sol";
import "../libraries/interfaces/IMigrator.sol";
import "./ACoconutSwap.sol";

contract CurveRenCrvMigrator is IMigrator {
    using SafeERC20 for IERC20;

    address public constant override want = address(0x49849C98ae39Fff122806C06791Fa73784FB3675); // renCrv token
    address public constant override get = address(0xAcf806FeAeD6455244D34590AE57F772e80AA1a8);  // acBTC
    address public constant wbtc = address(0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599);    // WBTC token
    address public constant renbtc = address(0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D);  // renBTC token
    address public constant acSwap = address(0); // To be added after ACoconutSwap is deployed
    address public constant acVault = address(0x1eB47C01cfAb26D2346B449975b7BF20a34e0d45);    // acBTC vault
    address public constant curve = address(0x93054188d876f558f4a66B2EF1d97d16eDf0895B); // REN swap

    /**
     * @dev Performs the token migration. Only acBTC vault can trigger the migration.
     */
    function migrate() public override {
        require(msg.sender == acVault, "not vault");
        uint256 _want = IERC20(want).balanceOf(address(this));  // renCrv balance
        IERC20(want).safeApprove(curve, _want);
        if (_want > 0) {
            ICurveFi(curve).remove_liquidity(_want, [uint256(0), 0]);
        }
        uint256 _wbtc = IERC20(wbtc).balanceOf(address(this));
        uint256 _renbtc = IERC20(renbtc).balanceOf(address(this));
        // The initial deposit requires both WBTC and RenBTC.
        if (_wbtc > 0 && _renbtc > 0) {
            IERC20(wbtc).safeApprove(acSwap, _wbtc);
            IERC20(renbtc).safeApprove(acSwap, _renbtc);
            // WBTC is the first token and renBTC is the second!
            uint256[] memory amounts = new uint256[](2);
            amounts[0] = _wbtc;
            amounts[1] = _renbtc;
            ACoconutSwap(acSwap).mint(amounts, 0);
        }
        uint256 _get = IERC20(get).balanceOf(address(this));    // acBTC balance
        if (_get > 0) {
            IERC20(get).safeTransfer(acVault, _get);
        }
    }
}