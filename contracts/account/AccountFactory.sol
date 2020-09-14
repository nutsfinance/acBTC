// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "./Account.sol";

/**
 * @notice Factory of Account contracts.
 */
contract AccountFactory {

    /**
     * @dev A new Account contract is created.
     */
    event AccountCreated(address indexed userAddress, address indexed accountAddress);

    mapping(address => Account) private _accounts;

    /**
     * @dev Creates a new Account contract for the caller.
     * Users can create multiple accounts by invoking this method multiple times. However,
     * only the latest one is actively tracked and used by the platform.
     * @param initialAdmins The list of addresses that are granted the admin role.
     */
    function createAccount(address[] memory initialAdmins) public returns (Account) {
        Account account = new Account(msg.sender, initialAdmins);
        _accounts[msg.sender] = account;

        emit AccountCreated(msg.sender, address(account));

        return account;
    }

    /**
     * @dev Retrives the Account contract address for a user address.
     * @param owner Address of the owner of the Account contract.
     */
    function getAccount(address owner) public view returns (Account) {
        return _accounts[owner];
    }
}