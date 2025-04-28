# AuctionHouse

A decentralized Ethereum-based Auction platform built with Solidity, Hardhat, and Hardhat Ignition.

Users can create auctions, place bids, end auctions, and manage auction proceeds in a secure and gas-optimized way.

---

## Project Structure

| Folder               | Purpose                                                         |
| :------------------- | :-------------------------------------------------------------- |
| `/contracts/`        | Smart Contracts (`AuctionHouse.sol`, `AuctionHouseFactory.sol`) |
| `/ignition/modules/` | Hardhat Ignition deployment modules                             |
| `/test/`             | Full test coverage with Hardhat and Chai                        |
| `/deploy/`           | (optional) Legacy deploy scripts (if needed)                    |

---

## Smart Contracts

### AuctionHouse

- Auction of a specific item.
- Bidding with ETH.
- Refunds on rebid.
- Auction ending with owner withdrawal of highest bid.
- Fully gas optimized (custom errors, CEI pattern, ReentrancyGuard).

### AuctionHouseFactory

- Deploys and tracks multiple AuctionHouse instances.
- Emits `AuctionCreated` events for easy off-chain indexing.

---

## Requirements

- Node.js (>= 18.x)
- pnpm (>= 8.x)
- Hardhat (>= 2.23.x)

Install dependencies:

```bash
pnpm install
```

---

## Compile Contracts

```bash
pnpm hardhat compile
```

---

## Run Tests

```bash
pnpm hardhat test
```

> Full coverage: bidding, refunds, withdrawals, factory deployment, view functions, security checks.

Check coverage report:

```bash
pnpm hardhat coverage
```

---

## Local Deployment

Start a local Hardhat network:

```bash
pnpm hardhat node
```

In another terminal, deploy using Hardhat Ignition:

```bash
pnpm hardhat ignition deploy ignition/modules/AuctionHouseFactoryModule.ts --network localhost
```

Your `AuctionHouseFactory` will be deployed locally.

---

## Local Interaction

Open Hardhat console:

```bash
pnpm hardhat console --network localhost
```

Sample interaction:

```javascript
const factory = await ethers.getContractAt(
  "AuctionHouseFactory",
  "0xYourFactoryAddress"
);
await factory.createAuction("Excalibur Sword", 3600);

const auctions = await factory.getAllAuctions();
const auction = await ethers.getContractAt("AuctionHouse", auctions[0]);

await auction.bid({ value: ethers.parseEther("1.0") });
await auction.endAuction();
await auction.ownerWithdraw();
```

---

## Testnet Deployment (Optional)

Configure `.env`:

```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
SEPOLIA_PRIVATE_KEY=YOUR_WALLET_PRIVATE_KEY
```

Deploy to Sepolia:

```bash
pnpm hardhat ignition deploy ignition/modules/AuctionHouseFactoryModule.ts --network sepolia
```

---

## Features

- Gas-optimized contracts
- Full test coverage (~95%+)
- Local + Testnet deployable
- Professional Hardhat Ignition support
- Fully decentralized auction flow

---

## License

MIT License © 2025 Daniel Neris

---

## Contributions

Pull Requests and Issues are welcome!  
Let's build the decentralized future together.

---
