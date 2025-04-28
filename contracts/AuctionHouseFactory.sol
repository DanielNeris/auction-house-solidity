// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AuctionHouse.sol";
import "./interfaces/IAuctionHouseFactory.sol";


/**
 * @title AuctionHouseFactory
 * @dev Factory to deploy and track multiple AuctionHouse contracts.
 */
contract AuctionHouseFactory is IAuctionHouseFactory {
    /// @notice List of all deployed auctions
    address[] public allAuctions;

    /// @notice Emitted when a new auction is created
    event AuctionCreated(address indexed auctionAddress, string item, uint32 biddingTime);

    /**
     * @notice Deploys a new AuctionHouse contract
     * @param item The name of the item being auctioned
     * @param biddingTime The auction duration in seconds
     * @return auctionAddress Address of the deployed AuctionHouse contract
     */
    function createAuction(string memory item, uint32 biddingTime) external returns (address auctionAddress) {
        AuctionHouse auction = new AuctionHouse(item, biddingTime);
        allAuctions.push(address(auction));

        emit AuctionCreated(address(auction), item, biddingTime);

        return address(auction);
    }

    /**
     * @notice Returns the number of auctions created
     */
    function getAuctionCount() external view returns (uint256) {
        return allAuctions.length;
    }

    /**
     * @notice Returns the auction address at a specific index
     * @param index The index of the auction
     */
    function getAuction(uint256 index) external view returns (address) {
        require(index < allAuctions.length, "Invalid index");
        return allAuctions[index];
    }

    /**
     * @notice Returns all auction addresses
     */
    function getAllAuctions() external view returns (address[] memory) {
        return allAuctions;
    }
}
