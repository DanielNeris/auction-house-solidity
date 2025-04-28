// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAuctionHouseFactory {
    function createAuction(string memory item, uint32 biddingTime) external returns (address);

    function getAuctionCount() external view returns (uint256);

    function getAuction(uint256 index) external view returns (address);

    function getAllAuctions() external view returns (address[] memory);
}
