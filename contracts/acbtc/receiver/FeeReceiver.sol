// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IFeeReceiver.sol";

/**
 * @notice Contract that receives fees from BasketCore.
 * @dev Only admin can withdraw fees from the contract.
 */
contract FeeReceiver is IFeeReceiver, AccessControl {

    /**
     * @dev A fee is received.
     */
    event FeeReceived(address indexed feeToken, uint256 feeAmount);

    // Creates a new role identifier for the owner role
    // Owners can grant/revoke admin roles, and owners are also admin
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");

    // Creates a new role identifier for the admin role
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    constructor() public {
        // Grant the owner role to the contract creator
        _setupRole(OWNER_ROLE, msg.sender);
        // Grant the admin role to the contract creator as well
        _setupRole(ADMIN_ROLE, msg.sender);
        // Grant the admin of admin role to the contract creator
        _setRoleAdmin(ADMIN_ROLE, OWNER_ROLE);
    }

    /**
     * @dev Throws if called by any account that does not have admin role.
     */
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "FeeReceiver: Caller is not an admin");
        _;
    }

    /**
     * @dev Hook on fee received.
     * @param feeToken The address of the token paid as fee
     * @param feeAmount The amount of fee token
     */
    function onFeeReceived(address feeToken, uint256 feeAmount) public override {
        emit FeeReceived(feeToken, feeAmount);
    }

    /**
     * @dev Withdraws token from the fee receiver contract. Only owner can withdraw.
     * @param tokenAddress Address of the token to withdraw.
     * @param amount Amount of token to withdraw.
     */
    function withdrawToken(address tokenAddress, uint256 amount) public onlyAdmin {
        IERC20(tokenAddress).transfer(msg.sender, amount);
    }
}