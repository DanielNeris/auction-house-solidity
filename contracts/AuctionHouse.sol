// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
/**
 * @title AuctionHouse
 * @dev Gas-optimized ETH auction contract following CEI and ReentrancyGuard.
 */
contract AuctionHouse is Ownable, ReentrancyGuard {
    /// @notice The item being auctioned
    string public item;

    /// @notice Timestamp when the auction ends
    uint32 public immutable auctionEndTime;

    /// @notice Current highest bidder
    address public highestBidder;

    /// @notice Amount of the highest bid
    uint256 public highestBid;

    /// @notice Whether the auction has ended
    bool public ended;

    /// @notice Mapping to track if an address has placed a bid
    mapping(address => bool) public hasBid;

    /// @notice Mapping to track each bidder's latest bid
    mapping(address => uint256) public bids;

    /// @notice Emitted when a new bid is placed
    event BidPlaced(address indexed bidder, uint256 amount);

    /// @notice Emitted when the auction ends
    event AuctionEnded(address indexed winner, uint256 winningBid);

    /// @notice Emitted when the highest bid is updated
    event BiggestBid(uint256 indexed winningBid);

    /// @notice Emitted when a refund is issued
    event Refunded(address indexed bidder, uint256 amount);


    /// @dev Custom errors for gas efficiency
    error AuctionAlreadyEnded();
    error AuctionNotEnded();
    error AuctionAlreadyFinalized();
    error BidNotHighEnough(uint256 currentBid);
    error InvalidBidAmount();
    error NoFundsToWithdraw();
    error WinnerCannotWithdraw();
    error WithdrawalFailed();
    error RefundFailed();
    error InvalidBiddingTime();

    /**
     * @dev Initializes the auction.
     * @param _item The item being auctioned
     * @param _biddingTime The bidding duration in seconds
     */
    constructor(string memory _item, uint32 _biddingTime) Ownable(msg.sender) {
        if (_biddingTime == 0) revert InvalidBiddingTime();
        item = _item;
        auctionEndTime = uint32(block.timestamp) + _biddingTime;
    }

    /**
     * @notice Place a bid by sending ETH.
     * @dev Requires higher bid than previous.
     */
    function bid() external payable nonReentrant {
        if (block.timestamp >= auctionEndTime) revert AuctionAlreadyEnded();
        if (msg.value == 0) revert InvalidBidAmount();
        if (msg.value <= bids[msg.sender]) revert BidNotHighEnough(bids[msg.sender]);
        if (msg.value <= highestBid) revert BidNotHighEnough(highestBid);

        uint256 previousBid = bids[msg.sender];

        // Update hasBid mapping if it's the first bid
        if (!hasBid[msg.sender]) {
            hasBid[msg.sender] = true;
        }

        // Update new bid first
        bids[msg.sender] = msg.value;

        // Refund previous bid if there was one
        if (previousBid > 0) {
            (bool refunded, ) = payable(msg.sender).call{value: previousBid}("");
            if (!refunded) revert RefundFailed();
            emit Refunded(msg.sender, previousBid);
        }

        if (msg.value > highestBid) {
            highestBid = msg.value;
            highestBidder = msg.sender;
            emit BiggestBid(highestBid);
        }

        emit BidPlaced(msg.sender, msg.value);
    }

    /**
     * @notice End the auction after bidding time has passed.
     */
    function endAuction() external nonReentrant {
        if (block.timestamp < auctionEndTime) revert AuctionNotEnded();
        if (ended) revert AuctionAlreadyFinalized();

        ended = true;

        emit AuctionEnded(highestBidder, highestBid);
    }

    /**
     * @notice Allow non-winners to withdraw their bids.
     */
    function withdraw() external nonReentrant {
        if (!ended) revert AuctionNotEnded();
        if (msg.sender == highestBidder) revert WinnerCannotWithdraw();
        
        uint256 amount = bids[msg.sender];
        if (amount == 0) revert NoFundsToWithdraw();

        bids[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert WithdrawalFailed();
    }

    /**
     * @notice View the auction winner and winning bid.
     * @return winner Address of the highest bidder
     * @return winningBid Amount of the highest bid
     */
    function getWinner() external view returns (address winner, uint256 winningBid) {
        if (!ended) revert AuctionNotEnded();
        return (highestBidder, highestBid);
    }

    /**
     * @notice Allow the contract owner to withdraw the highest bid.
     */
    function ownerWithdraw() external onlyOwner nonReentrant {
        if (!ended) revert AuctionNotEnded();
        if (highestBid == 0) revert NoFundsToWithdraw();

        uint256 amount = highestBid;
        highestBid = 0;

        (bool success, ) = payable(owner()).call{value: amount}("");
        if (!success) revert WithdrawalFailed();
    }
}
