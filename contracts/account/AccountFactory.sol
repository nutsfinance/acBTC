// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.6.8;

import "../libraries/upgradeability/AdminUpgradeabilityProxy.sol";
import "./Account.sol";

/**
 * @notice Factory of Account contracts.
 */
contract AccountFactory {

    /**
     * @dev A new Account contract is created.
     */
    event AccountCreated(address indexed userAddress, address indexed accountAddress);

    address public governance;
    address public accountBase;
    mapping(address => address[]) public accounts;

    /**
     * @dev Constructor for Account Factory.
     * @param _accountBase Base account implementation.
     */
    constructor(address _accountBase) public {
        require(_accountBase != address(0x0), "account base not set");
        governance = msg.sender;
        accountBase = _accountBase;
    }

    /**
     * @dev Updates the base account implementation. Base account must be set.
     */
    function setAccountBase(address _accountBase) public {
        require(msg.sender == governance, "not governance");
        require(_accountBase != address(0x0), "account base not set");

        accountBase = _accountBase;
    }

    /**
     * @dev Updates the govenance address. Governance can be empty address which means
     * renouncing the governance.
     */
    function setGovernance(address _governance) public {
        require(msg.sender == governance, "not governance");
        governance = _governance;
    }

    /**
     * @dev Creates a new Account contract for the caller.
     * Users can create multiple accounts by invoking this method multiple times. However,
     * only the latest one is actively tracked and used by the platform.
     * @param _initialAdmins The list of addresses that are granted the admin role.
     */
    function createAccount(address[] memory _initialAdmins) public returns (Account) {
        AdminUpgradeabilityProxy proxy = new AdminUpgradeabilityProxy(accountBase, msg.sender);
        Account account = Account(address(proxy));
        account.initialize(msg.sender, _initialAdmins);
        accounts[msg.sender].push(address(account));

        emit AccountCreated(msg.sender, address(account));

        return account;
    }

    /**
     * @dev Retrives the active account for a user. The active account is the last account created.
     * @param _user Address of the owner of the Account contract.
     */
    function getAccount(address _user) public view returns (address) {
        if(accounts[_user].length == 0)    return address(0x0);

        return accounts[_user][accounts[_user].length - 1];
    }
}