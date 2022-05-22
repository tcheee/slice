// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat');
const ERC20Abi = require('../test/abi/erc20.json');
const {
  abi,
} = require('../artifacts/contracts/protocol/Factory.sol/Factory.json');
const poolabi = require('../artifacts/contracts/protocol/Pool.sol/Pool.json');

async function main() {
  const [owner] = await ethers.getSigners();
  const USDC_POLYGON = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
  const FACTORY_ADDRESS = '0x60e09dB8212008106601646929360D20eFC4BE33';
  const Factory = new hre.ethers.Contract(
    FACTORY_ADDRESS,
    abi,
    hre.ethers.provider
  );

  const signer = ethers.provider.getSigner(0);
  await Factory.connect(owner).changePoolState(USDC_POLYGON, 0, 0);
  const USDC = new ethers.Contract(USDC_POLYGON, ERC20Abi, signer);
  const struct = await Factory.returnTranchesByIndex(USDC_POLYGON, 0);
  const FixPool = new hre.ethers.Contract(struct[1], poolabi.abi, signer);
  const LevPool = new hre.ethers.Contract(struct[2], poolabi.abi, signer);
  const amountFix = 20;
  const amountLev = 50;
  console.log(struct[1]);
  console.log(FixPool.address);
  console.log(struct);
  //   await USDC.connect(owner).approve(LevPool.address, amountLev);
  //   //   await LevPool.connect(owner).deposit(amountLev, owner.address);
  await USDC.approve(FixPool.address, amountFix);
  const approval = await USDC.allowance(owner.address, owner.address);
  console.log(approval);
  await FixPool.deposit(amountFix, owner.address);
  console.log('Money should be deposited by now');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
