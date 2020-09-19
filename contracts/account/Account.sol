// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "../libraries/upgradeability/Initializable.sol";

/**
 * @notice An account contracted created for each user address.
 * @dev Anyone can directy deposit assets to the Account contract.
 * @dev Only operators can withdraw asstes or perform operation from the Account contract.
 */
contract Account is Initializable {
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

    address public owner;
    mapping(address => bool) public admins;
    mapping(address => bool) public operators;

    /**
     * @dev Initializes the owner, admin and operator roles.
     * @param _owner Address of the contract owner
     * @param _initialAdmins The list of addresses that are granted the admin role.
     */
    function initialize(address _owner, address[] memory _initialAdmins) public initializer {
        owner = _owner;
        // Grant the admin role to the initial admins
        for (uint256 i = 0; i < _initialAdmins.length; i++) {
            admins[_initialAdmins[i]] = true;
        }
    }

    /**
     * @dev Throws if called by any account that does not have operator role.
     */
    modifier onlyOperator() {
        require(isOperator(msg.sender), "not operator");
        _;
    }

    /**
     * @dev Transfers the ownership of the account to another address.
     * The new owner can be an zero address which means renouncing the ownership.
     * @param _owner New owner address
     */
    function transferOwnership(address _owner) public {
        require(msg.sender == owner, "not owner");
        owner = _owner;
    }

    /**
     * @dev Grants admin role to a new address.
     * @param _account New admin address.
     */
    function grantAdmin(address _account) public {
        require(msg.sender == owner, "not owner");
        require(!admins[_account], "already admin");

        admins[_account] = true;
    }

    /**
     * @dev Revokes the admin role from an address. Only owner can revoke admin.
     * @param _account The admin address to revoke.
     */
    function revokeAdmin(address _account) public {
        require(msg.sender == owner, "not owner");
        require(admins[_account], "not admin");

        admins[_account] = false;
    }

    /**
     * @dev Grants operator role to a new address. Only owner or admin can grant operator roles.
     * @param _account The new operator address.
     */
    function grantOperator(address _account) public {
        require(msg.sender == owner || admins[msg.sender], "not admin");
        require(!operators[_account], "already operator");

        operators[_account] = true;
    }

    /**
     * @dev Revoke operator role from an address. Only owner or admin can revoke operator roles.
     * @param _account The operator address to revoke.
     */
    function revokeOperator(address _account) public {
        require(msg.sender == owner || admins[msg.sender], "not admin");
        require(operators[_account], "not operator");

        operators[_account] = false;
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
        return userAddress == owner || admins[userAddress] || operators[userAddress];
    }

    /**
     * @dev Withdraws ETH from the Account contract. Only operators can withdraw ETH.
     * @param targetAddress Address to send the ETH to.
     * @param amount Amount of ETH to withdraw.
     */
    function withdraw(address payable targetAddress, uint256 amount) public onlyOperator {
        targetAddress.transfer(amount);
        // Use address(-1) to represent ETH.
        emit Withdrawn(address(-1), targetAddress, amount);
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
            IERC20(tokenAddress).safeTransferFrom(owner, targetAddress, amount.sub(tokenBalance));
            IERC20(tokenAddress).safeTransfer(targetAddress, tokenBalance);
            emit Withdrawn(tokenAddress, targetAddress, amount);
        }
    }

    /**
     * @dev Allows the spender address to spend up to the amount of token.
     * @param tokenAddress Address of the ERC20 that can spend.
     * @param targetAddress Address which can spend the ERC20.
     * @param amount Amount of ERC20 that can be spent by the target address.
     */
    function approveToken(address tokenAddress, address targetAddress, uint256 amount) public onlyOperator {
        IERC20(tokenAddress).safeApprove(targetAddress, 0);
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