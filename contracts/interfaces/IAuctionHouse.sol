// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAuctionHouse {
    function item() external view returns (string memory);

    function auctionEndTime() external view returns (uint32);

    function highestBidder() external view returns (address);

    function highestBid() external view returns (uint256);

    function ended() external view returns (bool);

    function bid() external payable;

    function endAuction() external;

    function withdraw() external;

    function getWinner() external view returns (address winner, uint256 winningBid);

    function ownerWithdraw() external;
}
