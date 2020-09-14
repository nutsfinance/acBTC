// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../library/util/Constants.sol";

/**
 * @notice An account contracted created for each user address.
 * @dev Anyone can directy deposit assets to the Account contract.
 * @dev Only operators can withdraw asstes from the Account contract.
 */
contract Account is AccessControl {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /**
     * @dev Asset is withdrawn from the Account.
     */
    event Withdrawn(address indexed tokenAddress, address indexed targetAddress, uint256 amount);

    /**
     * @dev Spender is allowed to spend an asset.
     */
    event Approved(address indexed tokenAddress, address indexed targetAddress, uint256 amount);

    /**
     * @dev A transaction is invoked on the Account.
     */
    event Invoked(address indexed targetAddress, uint256 value, bytes data);

    // Owner role can grant/revoke admin roles
    // The Account owner is the only member of owner role
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");

    // Admin role can grant/revoke operator roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Operators can withdraw assets or invoke transactions from the Account
    // Operator roles are often ephemeral as it usually lasts only one transaction
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /**
     * @dev Initializes the owner, admin and operator roles.
     * @param owner Address of the contract owner
     * @param initialAdmins The list of addresses that are granted the admin role.
     */
    constructor(address owner, address[] memory initialAdmins) public {
        // Grant the owner role to the contract owner
        // The Account owner is the only member of the owner role!
        _setupRole(OWNER_ROLE, owner);
        // Grant the role admin of admin role to the contract owner
        _setRoleAdmin(ADMIN_ROLE, OWNER_ROLE);
        // Grant the role admin of operator role to the admin role
        _setRoleAdmin(OPERATOR_ROLE, ADMIN_ROLE);

        // Grant the admin role to the contract owner so that owner can assign operators
        _setupRole(ADMIN_ROLE, owner);

        // Grant the admin role to the initial admins
        for (uint256 i = 0; i < initialAdmins.length; i++) {
            _setupRole(ADMIN_ROLE, initialAdmins[i]);
        }
    }

    /**
     * @dev Throws if called by any account that does not have operator role.
     */
    modifier onlyOperator() {
        require(isOperator(msg.sender), "Account: Caller is not an operator");
        _;
    }

    /**
     * @dev Allows Account contract to receive ETH.
     */
    receive() payable external {}

    /**
     * @dev Checks whether a user is an operator of the contract.
     * Since admin role can grant operator role and owner can grant admin role, we treat both
     * admins and owner as operators!
     * @param userAddress Address to check whether it's an operator.
     */
    function isOperator(address userAddress) public view returns (bool) {
        return hasRole(OWNER_ROLE, userAddress) || hasRole(ADMIN_ROLE, userAddress) || hasRole(OPERATOR_ROLE, userAddress);
    }

    /**
     * @dev Withdraws ETH from the Account contract. Only operators can withdraw ETH.
     * @param targetAddress Address to send the ETH to.
     * @param amount Amount of ETH to withdraw.
     */
    function withdraw(address payable targetAddress, uint256 amount) public onlyOperator {
        (bool success,) = targetAddress.call{value: amount}(new bytes(0));
        require(success, 'Account: Withdraw ETH failed');
        emit Withdrawn(Constants.getEthAddress(), targetAddress, amount);
    }

    /**
     * @dev Withdraws ERC20 token from the Account contract. Only operators can withdraw ERC20 tokens.
     * @param tokenAddress Address of the ERC20 to withdraw.
     * @param targetAddress Address to send the ERC20 to.
     * @param amount Amount of ERC20 token to withdraw.
     */
    function withdrawToken(address tokenAddress, address targetAddress, uint256 amount) public onlyOperator {
        IERC20(tokenAddress).safeTransfer(targetAddress, amount);
        emit Withdrawn(tokenAddress, targetAddress, amount);
    }

    /**
     * @dev Withdraws ERC20 token from the Account contract. If the Account contract does not have sufficient balance,
     * try to withdraw from the owner's address as well. This is useful if users wants to keep assets in their own wallet
     * by setting adequate allowance to the Account contract.
     * @param tokenAddress Address of the ERC20 to withdraw.
     * @param targetAddress Address to send the ERC20 to.
     * @param amount Amount of ERC20 token to withdraw.
     */
    function withdrawTokenFallThrough(address tokenAddress, address targetAddress, uint256 amount) public onlyOperator {
        uint256 tokenBalance = IERC20(tokenAddress).balanceOf(address(this));
        // If we have enough token balance, send the token directly.
        if (tokenBalance >= amount) {
            IERC20(tokenAddress).safeTransfer(targetAddress, amount);
            emit Withdrawn(tokenAddress, targetAddress, amount);
        } else {
            // Owner is the only member of the owner role!
            address owner = getRoleMember(OWNER_ROLE, 0);
            IERC20(tokenAddress).safeTransferFrom(owner, targetAddress, amount.sub(tokenBalance));
            IERC20(tokenAddress).safeTransfer(targetAddress, tokenBalance);
            emit Withdrawn(tokenAddress, targetAddress, amount);
        }
    }

    /**
     * @dev Allows the spender address to spend up to the amount of token.
     * Caller of this method is expected to set allowance and then reset to 0 in the same transaction,
     * so that the ERC20 approve attack is not an issue.
     * @param tokenAddress Address of the ERC20 that can spend.
     * @param targetAddress Address which can spend the ERC20.
     * @param amount Amount of ERC20 that can be spent by the target address.
     */
    function approveToken(address tokenAddress, address targetAddress, uint256 amount) public onlyOperator {
        IERC20(tokenAddress).safeApprove(targetAddress, amount);
        emit Approved(tokenAddress, targetAddress, amount);
    }

    /**
     * @notice Performs a generic transaction on the Account contract.
     * @param target The address for the target contract.
     * @param value The value of the transaction.
     * @param data The data of the transaction.
     */
    function invoke(address target, uint256 value, bytes memory data) public onlyOperator returns (bytes memory result) {
        bool success;
        (success, result) = target.call{value: value}(data);
        if (!success) {
            // solhint-disable-next-line no-inline-assembly
            assembly {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
        emit Invoked(target, value, data);
    }
}