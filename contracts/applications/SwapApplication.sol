// SPDX-License-Identifier: MIT
pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "../account/Account.sol";
import "../account/AccountFactory.sol";
import "../acoconut/ACoconutSwap.sol";
import "../libraries/upgradeability/Initializable.sol";

/**
 * @dev Application to help interact with ACoconutSwap with account.
 */
contract SwapApplication is Initializable {
    using SafeMath for uint256;

    address public governance;
    ACoconutSwap public swap;

    /**
     * @dev Initializes swap application.
     */
    function initialize(address _swap) external initializer {
        require(_swap != address(0x0), "swap not set");
        
        governance = msg.sender;
        swap = ACoconutSwap(_swap);
    }

    /**
     * @dev Updates the govenance address.
     */
    function setGovernance(address _governance) external {
        require(msg.sender == governance, "not governance");
        governance = _governance;
    }

    /**
     * @dev Updates the swap address.
     */
    function setSwap(address _swap) external {
        require(msg.sender == governance, "not governance");
        require(_swap != address(0x0), "swap not set");

        swap = ACoconutSwap(_swap);
    }

    modifier validAccount(address _account) {
        Account account = Account(payable(_account));
        require(account.owner() == msg.sender, "not owner");
        require(account.isOperator(address(this)), "not operator");
        _;
    }

    /**
     * @dev Mints new pool token.
     * @param _account The account address used to mint.
     * @param _amounts Unconverted token balances used to mint pool token.
     * @param _minMintAmount Minimum amount of pool token to mint.
     */
    function mintToken(address _account, uint256[] calldata _amounts, uint256 _minMintAmount) external validAccount(_account) {
        Account account = Account(payable(_account));
        ACoconutSwap _swap = swap;
        // We don't perform input validations here as they are done in ACoconutSwap.
        for (uint256 i = 0; i < _amounts.length; i++) {
            if (_amounts[i] == 0)   continue;
            account.approveToken(_swap.tokens(i), address(_swap), _amounts[i]);
        }

        bytes memory methodData = abi.encodeWithSignature("mint(uint256[],uint256)", _amounts, _minMintAmount);
        account.invoke(address(_swap), 0, methodData);
    }

    /**
     * @dev Exchange between two underlying tokens.
     * @param _account The account address used to swap.
     * @param _i Token index to swap in.
     * @param _j Token index to swap out.
     * @param _dx Unconverted amount of token _i to swap in.
     * @param _minDy Minimum token _j to swap out in converted balance.
     */
    function swapToken(address _account, uint256 _i, uint256 _j, uint256 _dx, uint256 _minDy) external validAccount(_account) {
        Account account = Account(payable(_account));
        ACoconutSwap _swap = swap;
        // We don't perform input validations here as they are done in ACoconutSwap.
        account.approveToken(_swap.tokens(_i), address(_swap), _dx);

        bytes memory methodData = abi.encodeWithSignature("swap(uint256,uint256,uint256,uint256)", _i, _j, _dx, _minDy);
        account.invoke(address(_swap), 0, methodData);
    }

    /**
     * @dev Redeems pool token to underlying tokens proportionally.
     * @param _account The account address used to redeem.
     * @param _amount Amount of pool token to redeem.
     * @param _minRedeemAmounts Minimum amount of underlying tokens to get.
     */
    function redeemProportion(address _account, uint256 _amount, uint256[] calldata _minRedeemAmounts) external validAccount(_account) {
        Account account = Account(payable(_account));
        ACoconutSwap _swap = swap;
        // We don't perform input validations here as they are done in ACoconutSwap.
        account.approveToken(_swap.poolToken(), address(_swap), _amount);

        bytes memory methodData = abi.encodeWithSignature("redeemProportion(uint256,uint256[])", _amount, _minRedeemAmounts);
        account.invoke(address(_swap), 0, methodData);
    }

    /**
     * @dev Redeem pool token to one specific underlying token.
     * @param _account The account address used to redeem.
     * @param _amount Amount of pool token to redeem.
     * @param _i Index of the token to redeem to.
     * @param _minRedeemAmount Minimum amount of the underlying token to redeem to.
     */
    function redeemSingle(address _account, uint256 _amount, uint256 _i, uint256 _minRedeemAmount) external validAccount(_account) {
        Account account = Account(payable(_account));
        ACoconutSwap _swap = swap;
        // We don't perform input validations here as they are done in ACoconutSwap.
        account.approveToken(_swap.poolToken(), address(_swap), _amount);

        bytes memory methodData = abi.encodeWithSignature("redeemSingle(uint256,uint256,uint256)", _amount, _i, _minRedeemAmount);
        account.invoke(address(_swap), 0, methodData);
    }

    /**
     * @dev Redeems underlying tokens.
     * @param _account The account address used to redeem.
     * @param _amounts Amounts of underlying tokens to redeem to.
     * @param _maxRedeemAmount Maximum of pool token to redeem.
     */
    function redeemMulti(address _account, uint256[] calldata _amounts, uint256 _maxRedeemAmount) external validAccount(_account) {
        Account account = Account(payable(_account));
        ACoconutSwap _swap = swap;
        // We don't perform input validations here as they are done in ACoconutSwap.
        // The amount of acBTC to burn is unknown yet. Simply set the allowance to the maximum redeem amount.
        account.approveToken(_swap.poolToken(), address(_swap), _maxRedeemAmount);

        bytes memory methodData = abi.encodeWithSignature("redeemMulti(uint256[],uint256)", _amounts, _maxRedeemAmount);
        account.invoke(address(_swap), 0, methodData);

        // Clears the allowance afterward
        account.approveToken(_swap.poolToken(), address(this), 0);
    }
}