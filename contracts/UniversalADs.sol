// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// import {ILSP26FollowerSystem as IFOLLOWERSYSTEM} from "@lukso/lsp26-contracts/contracts/ILSP26FollowerSystem.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./_event.sol";
import "./_error.sol";
import "./_pausable.sol";
import "./_ownable.sol";

/// @title UniversalADs
/// @author Aratta Labs
/// @notice UniversalADs
/// @dev You will find the deployed contract addresses in the repo
/// @custom:emoji 📢
/// @custom:security-contact atenyun@gmail.com
contract UniversalADs is Ownable(msg.sender), Pausable {
    using Counters for Counters.Counter;
    Counters.Counter public _claimCounter;
    uint256 public requiredFollowers = 20;
    uint256 public fee = 1; // Owner fee
    uint256 public price = 1 ether; // Per day
    uint256 public claimPercentage = 2; // Per profile
    uint256 public end;
    uint256 public duration;
    uint256 public amount;
    address public manager;
    string public metadata;
    address[] public permission;
    string public constant VERSION = "1.0.0";

    constructor() {}

    function getAD()
        public
        view
        returns (
            uint256,
            uint256,
            uint256,
            address,
            string memory
        )
    {
        return (end, duration, amount, manager, metadata);
    }

    function advertiser(string memory _metadata, uint256 _duration) public payable whenNotPaused returns (bool, uint256) {
        uint256 aDay = 1 days;
        // require(block.timestamp > end, "There is an active ads. pls try later");

        require(_duration > 0, "Duration must be grather than 0");

        // Check if there is an active ad
        if (block.timestamp < end) revert ThereIsActiveAd(end);

        // Check end
        // if (_end < _start) return (false, _start, _end);

        if (msg.value < price * _duration) revert PriceNotMet(price, price * _duration, _msgSender());

        uint256 ownerFee = calcPercentage(msg.value, fee);
        (bool success, ) = owner().call{value: ownerFee}("");
        require(success, "Failed to send Ether");

        end = block.timestamp + (aDay * _duration);
        duration = _duration;
        manager = _msgSender();
        metadata = _metadata;
        amount = price * _duration;

        delete permission;

        return (true, end);
    }

    function updateAds(string memory _metadata) public whenNotPaused returns (bool) {
        // Check start
        if (_msgSender() != manager && end < block.timestamp) revert Unauthorized();
        metadata = _metadata;

        return true;
    }

    ///@notice Claim
    function claim() public whenNotPaused returns (bool) {
        require(block.timestamp < end, "There is no active ad");

        for (uint256 i = 0; i < permission.length; i++) {
            if (permission[i] == _msgSender()) revert UserClaimedAlready(_msgSender());
        }

        _claimCounter.increment();
        permission.push(_msgSender());

        // send all Ether to owner
        uint256 claimAmount = calcPercentage(amount, claimPercentage);
        (bool success, ) = address(_msgSender()).call{value: claimAmount}("");
        require(success, "Failed to send Ether");
        // Log
        emit Claimed(_msgSender(), claimAmount);

        return true;
    }

    ///@notice calcPercentage percentage
    ///@param _amount The total amount
    ///@param bps The precentage
    ///@return percentage
    function calcPercentage(uint256 _amount, uint256 bps) public pure returns (uint256) {
        require((_amount * bps) >= 100);
        return (_amount * bps) / 100;
    }

    /// @notice Update token claim count
    function updateClaimPercentage(uint256 _newVal) public onlyOwner returns (bool) {
        claimPercentage = _newVal;
        return true;
    }

    ///@notice Withdraw the balance from this contract and transfer it to the owner's address
    function withdraw() public onlyOwner {
        uint256 _amount = address(this).balance;
        (bool success, ) = owner().call{value: _amount}("");
        require(success, "Failed");
    }

    ///@notice Transfer balance from this contract to input address
    function transferBalance(address payable _to, uint256 _amount) public onlyOwner {
        // Note that "to" is declared as payable
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Failed");
    }

    /// @notice Return the balance of this contract
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Pause
    function pause() public onlyOwner {
        _pause();
    }

    /// @notice Unpause
    function unpause() public onlyOwner {
        _unpause();
    }

    function time() public view returns (uint256) {
        return block.timestamp;
    }
}
