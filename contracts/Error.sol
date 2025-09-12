// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title Errors
 * @author Aratta Labs
 * @dev This library contains custom errors used throughout the smart contracts.
 * Using custom errors is more gas-efficient than traditional `require` statements
 * with string messages, as the error data is stored as a selector and is logged
 * as part of the transaction's revert reason. This provides more granular feedback.
 */
library Errors {

    /// @notice Thrown when the provided ad duration is zero.
    error DurationMustBeGreaterThanZero();

    /// @notice Thrown when the user's payment is less than the required amount for the ad.
    /// @param required The total amount of LYX required.
    /// @param sent The amount of LYX that was actually sent.
    error PriceNotMet(uint256 required, uint256 sent);

    /// @notice Thrown when a function is called on an ad that has already expired.
    error AdHasExpired();

    /// @notice Thrown when a caller does not have the necessary permissions to perform an action.
    error Unauthorized();

    /// @notice Thrown when an attempt is made to set the maximum number of ads to an invalid value.
    error InvalidMaxAds();

    /// @notice Thrown when the owner attempts to set a fee percentage greater than 100.
    error InvalidFee();

    /// @notice Thrown when the owner attempts to set the daily price to zero.
    error InvalidPrice();

    /// @notice Thrown when the owner attempts to set the claim percentage to a value greater than 100.
    error InvalidClaimPercentage();

    /// @notice Thrown when all available ad slots are occupied and no expired ads can be replaced.
    error MaximumAdReached();

    /// @notice Thrown when a transfer of funds to an address fails.
    error TransferFailed();

    /// @notice Thrown when a user attempts to claim a fee from an ad they have already claimed from.
    error UserClaimedAlready();

    /// @notice Thrown when the provided start index or count for pagination is invalid.
    error InvalidPagination();
}
