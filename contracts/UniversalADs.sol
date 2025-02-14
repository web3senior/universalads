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
    uint256 public fee = 4; // Owner fee
    uint256 public price = 1 ether; // Per day
    uint256 public claimPercentage = 2; // Per profile
    uint256 public start;
    uint256 public end;
    uint256 public duration;
    address public manager;
    string public metadata;
    mapping(address => uint256) public permission;

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
        return (start, end, duration, manager, metadata);
    }

    function advertiser(
        uint256 _start,
        uint256 _end,
        string memory _metadata,
        uint256 _duration
    )
        public
        payable
        whenNotPaused
        returns (
            bool,
            uint256,
            uint256
        )
    {
        require(block.timestamp > end, "There is an active ads. pls try later");

        require(_duration > 0, "Duration must be grather than 0");

        // Check start
        if (_start < block.timestamp) return (false, _start, _end);

        // Check end
        if (_end < _start) return (false, _start, _end);

        if (msg.value < price * _duration) revert PriceNotMet(price, _msgSender());

        uint256 ownerFee = calcPercentage(msg.value, fee);
        (bool success, ) = owner().call{value: ownerFee}("");
        require(success, "Failed to send Ether");

        start = _start;
        end = _end;
        duration = _duration;
        manager = _msgSender();
        metadata = _metadata;

        return (true, _start, _end);
    }

    ///@notice Claim
    function claim() public whenNotPaused returns (bool) {
        //     // Check if user is eligible?
        //  if (IFOLLOWERSYSTEM.followerCount(_msgSender()) < requiredFollowers) revert NotEligible(_msgSender());
        require (start > block.timestamp, "Too early");
        if (permission[_msgSender()] > 0 && permission[_msgSender()] > start) revert UserClaimedAlready(permission[_msgSender()]);

        _claimCounter.increment();
        permission[_msgSender()] = block.timestamp;

        // send all Ether to owner
        uint256 claimAmount = calcPercentage(address(this).balance, claimPercentage);
        (bool success, ) = manager.call{value: claimAmount}("");
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

    /// @notice Reset permission list
    function updateAD(
        uint256 _start,
        uint256 _end,
        string memory _metadata
    ) public onlyOwner returns (bool) {
        // Update start and end date with new value
        start = _start;
        end = _end;
        metadata = _metadata;

        // Log the event
        return true;
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
