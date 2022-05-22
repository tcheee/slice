// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat');
const {
  abi,
} = require('../artifacts/contracts/protocol/Factory.sol/Factory.json');

async function main() {
  const [owner] = await ethers.getSigners();
  const USDC_POLYGON = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
  const FACTORY_ADDRESS = '0x17975FB494576ae89D627F904Ec723B87c7C35c8';
  const Factory = new hre.ethers.Contract(
    FACTORY_ADDRESS,
    abi,
    hre.ethers.provider
  );

  let info = await Factory.returnTranchesByIndex(USDC_POLYGON, 0);
  console.log(info);
  await Factory.connect(owner).changePoolState(USDC_POLYGON, 0, 1);
  info = await Factory.returnTranchesByIndex(USDC_POLYGON, 0);
  console.log(info);
  await Factory.connect(owner).changePoolState(USDC_POLYGON, 0, 2);
  info = await Factory.returnTranchesByIndex(USDC_POLYGON, 0);
  console.log(info);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
