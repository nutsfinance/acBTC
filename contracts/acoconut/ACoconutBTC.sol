// SPDX-License-Identifier: MIT
pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @notice ACoconut BTC token. Only ACoconutSwap could mint and burn ACoconut BTC.
 */
contract ACoconutBTC is ERC20 {
    event MinterUpdated(address indexed account, bool allowed);
    
    address public governance;
    mapping(address => bool) public minters;

    constructor() public ERC20("ACoconut BTC", "acBTC") {
        governance = msg.sender;
    }

    /**
     * @dev Updates the govenance address.
     */
    function setGovernance(address _governance) public {
        require(msg.sender == governance, "not governance");
        governance = _governance;
    }

    /**
     * @dev Sets minter for acBTC. Only minter can mint acBTC.
     * @param _user Address of the minter.
     * @param _allowed Whether the user is accepted as a minter or not.
     */
    function setMinter(address _user, bool _allowed) public {
        require(msg.sender == governance, "not governance");
        minters[_user] = _allowed;

        emit MinterUpdated(_user, _allowed);
    }

    /**
     * @dev Mints new acBTC. Only minters can mint acBTC.
     * @param _user Recipient of the minted acBTC.
     * @param _amount Amount of acBTC to mint.
     */
    function mint(address _user, uint256 _amount) public {
        require(minters[msg.sender], "not minter");
        _mint(_user, _amount);
    }

    /**
     * @dev Burns acBTC. Only minters can burn acBTC. Since acBTC is backed by a basket of ERC20 BTCs,
     * burning acBTC is restricted to minters(ACoconutSwap) in order to properly release the underlying
     * ERC20 BTCs when acBTC is burned.
     * @param _user The address to burn acBTC.
     * @param _amount Amount of acBTC to burn.
     */
    function burn(address _user, uint256 _amount) public {
        require(minters[msg.sender], "not minter");
        _burn(_user, _amount);
    }
}