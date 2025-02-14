// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

event Log(string message);
event Minted(address sender, bytes32 tokenId, uint256 timestamp);
event Claimed(address sender, uint256 amount);