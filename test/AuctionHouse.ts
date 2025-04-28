import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("AuctionHouse", function () {
  async function deployAuctionFixture() {
    const [owner, bidder1, bidder2] = await hre.ethers.getSigners();

    const AuctionHouse = await hre.ethers.getContractFactory("AuctionHouse");
    const auction = await AuctionHouse.deploy("Test Item", 3600); // 1 hour auction

    return { auction, owner, bidder1, bidder2 };
  }

  describe("Deployment", function () {
    it("Should set the correct item and end time", async function () {
      const { auction } = await loadFixture(deployAuctionFixture);

      expect(await auction.item()).to.equal("Test Item");
      expect(await auction.auctionEndTime()).to.be.gt(0);
      expect(await auction.highestBid()).to.equal(0);
      expect(await auction.ended()).to.equal(false);
    });

    it("Should revert if bidding time is zero", async function () {
      const AuctionHouse = await hre.ethers.getContractFactory("AuctionHouse");
      await expect(
        AuctionHouse.deploy("Invalid Item", 0)
      ).to.be.revertedWithCustomError(AuctionHouse, "InvalidBiddingTime");
    });
  });

  describe("Bidding", function () {
    it("Should allow a valid bid", async function () {
      const { auction, bidder1 } = await loadFixture(deployAuctionFixture);

      await expect(
        auction.connect(bidder1).bid({ value: hre.ethers.parseEther("1") })
      )
        .to.emit(auction, "BidPlaced")
        .withArgs(bidder1.address, hre.ethers.parseEther("1"));
    });

    it("Should update highestBid and emit BiggestBid", async function () {
      const { auction, bidder1 } = await loadFixture(deployAuctionFixture);

      await expect(
        auction.connect(bidder1).bid({ value: hre.ethers.parseEther("2") })
      )
        .to.emit(auction, "BiggestBid")
        .withArgs(hre.ethers.parseEther("2"));

      expect(await auction.highestBid()).to.equal(hre.ethers.parseEther("2"));
      expect(await auction.highestBidder()).to.equal(bidder1.address);
    });

    it("Should refund previous bid when rebidding", async function () {
      const { auction, bidder1 } = await loadFixture(deployAuctionFixture);

      await auction.connect(bidder1).bid({ value: hre.ethers.parseEther("1") });

      await expect(
        auction.connect(bidder1).bid({ value: hre.ethers.parseEther("2") })
      )
        .to.emit(auction, "Refunded")
        .withArgs(bidder1.address, hre.ethers.parseEther("1"));
    });

    it("Should revert if bid is lower than previous bid", async function () {
      const { auction, bidder1 } = await loadFixture(deployAuctionFixture);

      await auction.connect(bidder1).bid({ value: hre.ethers.parseEther("1") });

      await expect(
        auction.connect(bidder1).bid({ value: hre.ethers.parseEther("0.5") })
      ).to.be.revertedWithCustomError(auction, "BidNotHighEnough");
    });

    it("Should revert if auction is ended", async function () {
      const { auction, bidder1 } = await loadFixture(deployAuctionFixture);

      await time.increase(3600 + 1); // simulate auction end

      await expect(
        auction.connect(bidder1).bid({ value: hre.ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(auction, "AuctionAlreadyEnded");
    });
  });

  describe("Ending Auction", function () {
    it("Should end auction after time passes", async function () {
      const { auction } = await loadFixture(deployAuctionFixture);

      await time.increase(3600 + 1);

      await expect(auction.endAuction()).to.emit(auction, "AuctionEnded");

      expect(await auction.ended()).to.equal(true);
    });

    it("Should revert if trying to end auction too early", async function () {
      const { auction } = await loadFixture(deployAuctionFixture);

      await expect(auction.endAuction()).to.be.revertedWithCustomError(
        auction,
        "AuctionNotEnded"
      );
    });

    it("Should revert if auction is already ended", async function () {
      const { auction } = await loadFixture(deployAuctionFixture);

      await time.increase(3600 + 1);
      await auction.endAuction();

      await expect(auction.endAuction()).to.be.revertedWithCustomError(
        auction,
        "AuctionAlreadyFinalized"
      );
    });
  });

  describe("Withdrawals", function () {
    it("Non-winning bidder should be able to withdraw after auction ends", async function () {
      const { auction, bidder1, bidder2 } = await loadFixture(
        deployAuctionFixture
      );

      await auction.connect(bidder1).bid({ value: hre.ethers.parseEther("1") });
      await auction.connect(bidder2).bid({ value: hre.ethers.parseEther("2") });

      await time.increase(3600 + 1);
      await auction.endAuction();

      await expect(auction.connect(bidder1).withdraw()).to.changeEtherBalances(
        [bidder1, auction],
        [hre.ethers.parseEther("1"), hre.ethers.parseEther("-1")]
      );
    });

    it("Winner cannot withdraw", async function () {
      const { auction, bidder2 } = await loadFixture(deployAuctionFixture);

      await auction.connect(bidder2).bid({ value: hre.ethers.parseEther("2") });

      await time.increase(3600 + 1);
      await auction.endAuction();

      await expect(
        auction.connect(bidder2).withdraw()
      ).to.be.revertedWithCustomError(auction, "WinnerCannotWithdraw");
    });

    it("Should revert withdraw if no funds", async function () {
      const { auction, bidder1 } = await loadFixture(deployAuctionFixture);

      await time.increase(3600 + 1);
      await auction.endAuction();

      await expect(
        auction.connect(bidder1).withdraw()
      ).to.be.revertedWithCustomError(auction, "NoFundsToWithdraw");
    });

    it("Owner should be able to withdraw winning bid", async function () {
      const { auction, owner, bidder2 } = await loadFixture(
        deployAuctionFixture
      );

      await auction.connect(bidder2).bid({ value: hre.ethers.parseEther("2") });

      await time.increase(3600 + 1);
      await auction.endAuction();

      await expect(
        auction.connect(owner).ownerWithdraw()
      ).to.changeEtherBalances(
        [owner, auction],
        [hre.ethers.parseEther("2"), hre.ethers.parseEther("-2")]
      );
    });

    it("Should revert ownerWithdraw if no funds", async function () {
      const { auction, owner } = await loadFixture(deployAuctionFixture);

      await time.increase(3600 + 1);
      await auction.endAuction();

      await expect(
        auction.connect(owner).ownerWithdraw()
      ).to.be.revertedWithCustomError(auction, "NoFundsToWithdraw");
    });
  });

  describe("getWinner", function () {
    it("Should revert getWinner if auction not ended", async function () {
      const { auction } = await loadFixture(deployAuctionFixture);

      await expect(auction.getWinner()).to.be.revertedWithCustomError(
        auction,
        "AuctionNotEnded"
      );
    });

    it("Should return winner and winning bid after auction ends", async function () {
      const { auction, bidder1 } = await loadFixture(deployAuctionFixture);

      await auction.connect(bidder1).bid({ value: hre.ethers.parseEther("1") });

      await time.increase(3600 + 1);
      await auction.endAuction();

      const [winnerAddress, winningBid] = await auction.getWinner();

      expect(winnerAddress).to.equal(bidder1.address);
      expect(winningBid).to.equal(hre.ethers.parseEther("1"));
    });
  });
});
