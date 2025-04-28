import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("AuctionHouseFactory", function () {
  async function deployFactoryFixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const AuctionHouseFactory = await hre.ethers.getContractFactory(
      "AuctionHouseFactory"
    );
    const factory = await AuctionHouseFactory.deploy();

    return { factory, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should deploy the factory correctly", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);

      expect(await factory.getAuctionCount()).to.equal(0);
    });
  });

  describe("Auction Creation", function () {
    it("Should create an auction and emit AuctionCreated event", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);

      const tx = await factory.createAuction("Sword of Power", 3600);

      await expect(tx)
        .to.emit(factory, "AuctionCreated")
        .withArgs(
          await factory.getAuction(0), // address of the auction
          "Sword of Power",
          3600
        );

      expect(await factory.getAuctionCount()).to.equal(1);

      const auctionAddress = await factory.getAuction(0);

      expect(auctionAddress).to.properAddress;

      // Now interact with the deployed AuctionHouse
      const AuctionHouse = await hre.ethers.getContractAt(
        "AuctionHouse",
        auctionAddress
      );

      expect(await AuctionHouse.item()).to.equal("Sword of Power");
      expect(await AuctionHouse.highestBid()).to.equal(0);
      expect(await AuctionHouse.ended()).to.equal(false);
    });

    it("Should revert if trying to access invalid auction index", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);

      await expect(factory.getAuction(0)).to.be.revertedWith("Invalid index");
    });

    it("Should return all created auctions", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);

      // Initially empty
      expect(await factory.getAllAuctions()).to.deep.equal([]);

      // Create two auctions
      await factory.createAuction("Item 1", 3600);
      await factory.createAuction("Item 2", 7200);

      const auctions = await factory.getAllAuctions();

      expect(auctions.length).to.equal(2);
      expect(auctions[0]).to.properAddress;
      expect(auctions[1]).to.properAddress;
    });
  });
});
