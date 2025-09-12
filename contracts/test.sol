// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MaxUint
 * @dev A contract to demonstrate how to get the maximum value of a uint256.
 */
contract MaxUint {

    /**
     * @dev This function returns the maximum value that can be stored in a uint256.
     * The `type(uint256).max` expression is the modern and recommended way to do this.
     * @return The maximum uint256 value, which is 2^256 - 1.
     */
    function getMaxValue() public pure returns (uint256) {
        return type(uint256).max;
    }
}
