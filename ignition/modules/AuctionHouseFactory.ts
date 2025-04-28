// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AuctionHouseFactoryModule = buildModule(
  "AuctionHouseFactoryModule",
  (m) => {
    // No parameters needed for factory deployment
    const auctionFactory = m.contract("AuctionHouseFactory", []);

    return { auctionFactory };
  }
);

export default AuctionHouseFactoryModule;
