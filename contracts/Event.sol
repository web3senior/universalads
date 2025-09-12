// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @notice Emitted when a new ad is successfully created.
/// @param adId The unique ID of the ad.
/// @param metadata The metadata string associated with the ad.
/// @param duration The ad's duration in days.
/// @param startTime The timestamp when the ad became active.
/// @param endTime The timestamp when the ad will expire.
/// @param creator The address of the profile that created the ad.
event AdCreated(uint256 indexed adId, string metadata, uint256 duration, uint256 startTime, uint256 endTime, address indexed creator);

/// @notice Emitted when an existing ad's metadata is updated.
/// @param adId The unique ID of the ad that was updated.
/// @param metadata The new metadata string.
event AdUpdated(uint256 indexed adId, string metadata);

/// @notice Emitted when a user successfully claims a fee from an ad.
/// @param adId The unique ID of the ad from which the fee was claimed.
/// @param claimer The address of the profile that claimed the fee.
/// @param amount The amount of LYX (in wei) that was claimed.
event Claimed(uint256 indexed adId, address indexed claimer, uint256 amount);

/// @notice Emitted when a team member's address is updated.
/// @param key The name of the team member being updated.
/// @param addr The new address assigned to the team member.
event TeamUpdated(string key, address addr);

/// @notice Emitted when ETH is transferred from the contract's balance.
/// @param recipient The address that receives the funds.
/// @param amount The amount of ETH (in wei) that was withdrawn.
/// @param timestamp The block timestamp at which the withdrawal occurred.
event Withdrawal(address indexed recipient, uint256 amount, uint256 timestamp);
