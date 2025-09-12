// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./Event.sol";
import "./Error.sol";

/// @title UniversalADs
/// @author Aratta Labs
/// @notice A decentralized ad network on the LUKSO blockchain where Universal Profiles can monetize their presence by displaying ads.
/// @dev This contract manages the creation, updating, and claiming of ads. It supports a fixed number of active ads and allows expired ad slots to be reused.
/// @custom:emoji 📢
/// @custom:security-contact atenyun@gmail.com
contract UniversalADs is Ownable(msg.sender), Pausable {
    // --- State Variables ---

    /// @notice The fee percentage for the contract owner.
    /// @dev The value ranges from 0-100.
    uint256 public fee = 5;

    /// @notice The price for a single day of advertising.
    /// @dev The value is denominated in wei.
    uint256 public price = 1 ether;

    /// @notice The percentage of the ad value that a profile can claim.
    /// @dev The value ranges from 0-100.
    uint256 public claimPercentage = 2;

    /// @notice The version of the smart contract.
    string public constant VERSION = "2.0.0";

    // --- Data Structures ---

    /// @dev The data structure for an ad, stored in the `ads` array.
    /// It includes ad content, timing, and a claim counter.
    struct AD {
        string metadata;
        string title;
        string image;
        string link;
        uint256 startTime;
        uint256 endTime;
        uint256 claimCounter;
        uint256 createdAt;
        uint256 duration;
        address creator;
        /// @dev A mapping to track which profiles have claimed their fee for this ad.
        mapping(address => bool) claimed;
    }

    /// @dev A view-friendly version of the AD struct without internal mappings.
    /// Used for returning ad data from public view functions.
    struct ADWithoutMappings {
        uint256 adIndex;
        string metadata;
        string title;
        string image;
        string link;
        uint256 startTime;
        uint256 endTime;
        uint256 claimCounter;
        uint256 createdAt;
        uint256 duration;
        address creator;
    }

    /// @dev A fixed-size array to hold the ads. The size is set to 2.
    AD[9] public ads;

    /// @dev A mapping from team member's name to their address.
    mapping(string => address) public team;

    constructor() {
        team["jxn"] = 0xd64Deb40240209473f676945c2ed2bfA2CeF2B7d;
    }

    // --- Ad Management Functions ---

    /// @notice Creates a new ad with specified metadata and duration.
    /// @dev The function first checks for an expired ad slot to overwrite to optimize space. If no expired slots are found and the ad array is full, the transaction will revert. It ensures the caller has sent enough LUKSO to cover the cost, and then transfers the fees to the owner and team.
    /// @param _metadata A JSON string containing the ad's content metadata.
    /// @param _title The title of the ad.
    /// @param _image The URL of the ad image.
    /// @param _link The external link for the ad's call-to-action.
    /// @param _duration The duration of the ad in days.
    /// @return bool Returns true if the ad was successfully created or replaced.
    /// @return adId The index of the newly created or replaced ad in the `ads` array.
    function newAd(string memory _metadata, string memory _title, string memory _image, string memory _link, uint256 _duration) public payable whenNotPaused returns (bool, uint256 adId) {
        // Enforce a positive duration
        if (_duration == 0) revert Errors.DurationMustBeGreaterThanZero();

        // Calculate the required payment and ensure it's met
        uint256 requiredAmount = price * _duration;
        if (msg.value < requiredAmount) {
            revert Errors.PriceNotMet(requiredAmount, msg.value);
        }

        // --- Ad slot selection logic ---
        for (uint8 i = 0; i < ads.length; i++) {
            if (block.timestamp > ads[i].endTime) {
                // Resets the value at `index` and its associated mapping data to their default state.
                delete ads[i];

                // Overwrite the existing expired ad data.
                AD storage adObj = ads[i];
                adObj.metadata = _metadata;
                adObj.title = _title;
                adObj.image = _image;
                adObj.link = _link;
                adObj.duration = _duration;
                adObj.startTime = block.timestamp;
                adObj.endTime = block.timestamp + (_duration * 1 days);
                adObj.claimCounter = 0;
                adObj.createdAt = block.timestamp;
                adObj.creator = _msgSender();

                // The adId is the index in the fixed-size array.
                adId = i;

                emit AdCreated(adId, _metadata, _duration, block.timestamp, block.timestamp + (_duration * 1 days), _msgSender());

                // Transfer funds only after a slot has been found
                uint256 ownerFee = calculatePercentage(requiredAmount, fee);
                (bool success, ) = team["jxn"].call{value: calculatePercentage(ownerFee, 20)}("");
                if (!success) revert Errors.TransferFailed();
                (bool success1, ) = owner().call{value: calculatePercentage(ownerFee, 80)}("");
                if (!success1) revert Errors.TransferFailed();

                return (true, adId);
            }
        }

        revert Errors.MaximumAdReached();
    }

    /// @notice Updates the metadata for an existing ad.
    /// @dev This function can only be called by the original ad creator, and only while the ad is still active.
    /// @param _index The index of the ad to update in the `ads` array.
    /// @param _metadata The new metadata string.
    /// @param _title The new title of the ad.
    /// @param _image The new URL of the ad image.
    /// @param _link The new external link for the ad's call-to-action.
    function updateAd(uint256 _index, string memory _metadata, string memory _title, string memory _image, string memory _link) public {
        AD storage ad = ads[_index];
        // Ensure the caller is the original ad creator and the ad has not expired
        if (_msgSender() != ad.creator) revert Errors.Unauthorized();
        if (block.timestamp > ad.endTime) revert Errors.AdHasExpired();

        ad.metadata = _metadata;
        ad.title = _title;
        ad.image = _image;
        ad.link = _link;
        emit AdUpdated(_index, _metadata);
    }

    /// @notice Updates the owner fee percentage.
    /// @dev Only the contract owner can call this function. The new fee must be between 0 and 100.
    /// @param _newFee The new fee percentage (0-100).
    function updateFee(uint256 _newFee) public onlyOwner {
        if (_newFee > 100) revert Errors.InvalidFee();
        fee = _newFee;
    }

    /// @notice Updates the price per day for a new ad.
    /// @dev Only the contract owner can call this function. The new price must be greater than zero.
    /// @param _newPrice The new price in wei.
    function updatePrice(uint256 _newPrice) public onlyOwner {
        if (_newPrice == 0) revert Errors.InvalidPrice();
        price = _newPrice;
    }

    /// @notice Updates a team member's address.
    /// @dev Only the contract owner can call this function.
    /// @param _name The name of the team member.
    /// @param _addr The new address for the team member.
    function updateTeam(string memory _name, address _addr) public onlyOwner {
        team[_name] = _addr;
        emit TeamUpdated(_name, _addr);
    }

    /// @notice Updates the claim percentage for each profile.
    /// @dev Only the contract owner can call this function. The new percentage must be between 0 and 100.
    /// @param _newClaimPercentage The new claim percentage (0-100).
    function updateClaimPercentage(uint256 _newClaimPercentage) public onlyOwner {
        if (_newClaimPercentage > 100) revert Errors.InvalidClaimPercentage();
        claimPercentage = _newClaimPercentage;
    }

    // --- Claiming Functions ---

    /// @notice Allows a user to claim a fee from an ad's revenue.
    /// @dev The function checks that the ad is active and that the caller has not already claimed a fee for it. It then calculates and transfers the claim amount to the user.
    /// @param _index The index of the ad to claim from in the `ads` array.
    function claimFee(uint256 _index) public whenNotPaused {
        AD storage ad = ads[_index];

        // Ensure the ad is still active
        if (block.timestamp > ad.endTime) revert Errors.AdHasExpired();

        // Check if the user has already claimed from this specific ad
        if (ad.claimed[_msgSender()]) revert Errors.UserClaimedAlready();

        // Mark the user as having claimed for this ad
        ad.claimed[_msgSender()] = true;
        ad.claimCounter++;

        // Calculate and send the claim amount to the user
        uint256 adValue = price * ad.duration;
        uint256 claimAmount = calculatePercentage(adValue, claimPercentage);
        (bool success, ) = _msgSender().call{value: claimAmount}("");
        if (!success) revert Errors.TransferFailed();

        emit Claimed(_index, _msgSender(), claimAmount);
    }

    // --- View Functions ---

    /// @notice Returns the total number of ads in the fixed-size array.
    /// @return The length of the `ads` array.
    function getAdLength() public view returns (uint256) {
        return ads.length;
    }

    /// @notice Returns the total number of empty ads.
    /// @return The length of the `ads` array.
    function hasSpace() public view returns (uint8) {
        uint8 adSpaceCounter = 0;
        for (uint8 i = 0; i < ads.length; i++) if (block.timestamp > ads[i].endTime) adSpaceCounter++;
        return adSpaceCounter;
    }

    /// @notice Retrieves a paginated list of ads.
    /// @dev This function returns an array of `ADWithoutMappings` structs to avoid returning the internal `claimed` mapping.
    /// @param _startIndex The starting index of the ad list to retrieve.
    /// @param _count The number of ads to retrieve.
    /// @return An array of `ADWithoutMappings` structs.
    function getADs(uint256 _startIndex, uint256 _count) external view returns (ADWithoutMappings[] memory) {
        if (_startIndex + _count > ads.length) {
            revert Errors.InvalidPagination();
        }

        ADWithoutMappings[] memory adsArray = new ADWithoutMappings[](_count);

        for (uint256 i = 0; i < _count; i++) {
            AD storage currentAd = ads[_startIndex + i];
            adsArray[i] = ADWithoutMappings({adIndex: i, metadata: currentAd.metadata, title: currentAd.title, image: currentAd.image, link: currentAd.link, startTime: currentAd.startTime, endTime: currentAd.endTime, claimCounter: currentAd.claimCounter, createdAt: currentAd.createdAt, duration: currentAd.duration, creator: currentAd.creator});
        }
        return adsArray;
    }
    
    /// @notice Checks if a user has already claimed a specific ad.
    /// @param _adIndex The index of the ad to check.
    /// @param _userAddress The address of the user.
    /// @return A boolean indicating if the user has claimed the ad.
    function hasUserClaimedAd(uint256 _adIndex, address _userAddress) public view returns (bool) {
        return ads[_adIndex].claimed[_userAddress];
    }

    // --- Utility Functions ---

    /// @notice Calculates a percentage of a given amount.
    /// @param _amount The total amount.
    /// @param _percentage The percentage value (e.g., 5 for 5%).
    /// @return The calculated percentage.
    function calculatePercentage(uint256 _amount, uint256 _percentage) internal pure returns (uint256) {
        return (_amount * _percentage) / 100;
    }

    /// @notice Transfers the entire contract's ETH balance to the contract owner.
    /// @dev This function can only be called by the contract owner and is non-reentrant.
    function withdrawAll() public onlyOwner {
        uint256 amount = address(this).balance;
        if (amount == 0) {
            revert Errors.TransferFailed();
        }
        (bool success, ) = payable(owner()).call{value: amount}("");
        if (!success) {
            revert Errors.TransferFailed();
        }

        // Emit the Withdrawal event to signal a successful withdrawal.
        emit Withdrawal(owner(), amount, block.timestamp);
    }

    /// @notice Pauses contract operations.
    /// @dev Only the contract owner can call this function.
    function pause() public onlyOwner {
        _pause();
    }

    /// @notice Unpauses contract operations.
    /// @dev Only the contract owner can call this function.
    function unpause() public onlyOwner {
        _unpause();
    }
}
