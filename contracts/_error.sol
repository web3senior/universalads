// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

error Unauthorized();
error NotAuthorizedAmount(uint256 totalAmount, uint256 authorizedAmount);
error SupplyLimitExceeded(uint256 totalSupply);
error SupplyLimitExceededAccount(address sender);
error PriceNotMet(uint256, address);
error NotEligible(address sender);
error UserClaimedAlready(uint claimedTime);