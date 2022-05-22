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
const managerabi = require('../artifacts/contracts/protocol/Manager.sol/Manager.json');

async function main() {
  const [owner] = await ethers.getSigners();
  const USDC_POLYGON = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
  const FACTORY_ADDRESS = '0x60e09dB8212008106601646929360D20eFC4BE33';
  const MANAGER_ADDRESS = '0x1e86fCe4d102A5924A9EF503f772fCA162Af2067';
  const Factory = new hre.ethers.Contract(
    FACTORY_ADDRESS,
    abi,
    hre.ethers.provider
  );

  const signer = ethers.provider.getSigner(0);
  await Factory.connect(owner).changePoolState(USDC_POLYGON, 0, 0);
  const USDC = new ethers.Contract(USDC_POLYGON, ERC20Abi, signer);
  const struct = await Factory.returnTranchesByIndex(USDC_POLYGON, 0);
  const Manager = new hre.ethers.Contract(
    MANAGER_ADDRESS,
    managerabi.abi,
    signer
  );
  const FixPool = new hre.ethers.Contract(struct[1], poolabi.abi, signer);
  const LevPool = new hre.ethers.Contract(struct[2], poolabi.abi, signer);
  const amountFix = 50000000000;
  const amountLev = 10000000000;
  await USDC.approve(FixPool.address, amountFix);
  await FixPool.deposit(amountFix, owner.address);
  await USDC.approve(LevPool.address, amountLev);
  await LevPool.deposit(amountLev, owner.address);
  console.log('Money should be deposited by now');

  // put the pool in active mode and pass data into last harvest
  await Manager.closeBoostrapPeriod(USDC_POLYGON, 0);

  // Get rewards inside the pool thanks to Aave
  const FixPoolAmountBefore = await FixPool.totalAssets();
  await hre.network.provider.send('hardhat_mine', ['0xC350']);
  await hre.network.provider.send('evm_increaseTime', [7 * 25 * 60 * 60]);
  await hre.network.provider.send('evm_mine');
  const LevPoolAmountAfterMiningTime = await LevPool.totalAssets();
  const FixPoolAmountAfterMiningTime = await FixPool.totalAssets();
  console.log('============== BEFORE HARVEST ==================');
  console.log('LevPool: ' + LevPoolAmountAfterMiningTime);
  console.log('FixPool: ' + FixPoolAmountAfterMiningTime);

  await Manager.harvest(USDC_POLYGON, 0);
  const FixPoolAmountAfterHarvest = await FixPool.totalAssets();
  const LevPoolAmountAfterHarvest = await LevPool.totalAssets();
  console.log('============== AFTER HARVEST ==================');
  console.log('LevPool: ' + LevPoolAmountAfterHarvest);
  console.log('FixPool: ' + FixPoolAmountAfterHarvest);

  // ANNUAL FIXED YIELD: 10 ** 12 / 1000
  const AmountBeforeNotBN = FixPoolAmountBefore.toNumber();
  const expectedAmount =
    ((10 ** 12 / 1000 / 52) * AmountBeforeNotBN) / 10 ** 12;
  const increasedResult =
    FixPoolAmountAfterHarvest.toNumber() - FixPoolAmountBefore.toNumber();
  console.log('============== TIME TRAVEL FINALIZED ==================');
  console.log(
    'Expected amount for the Fixed Pool based on equation: ' +
      parseInt(expectedAmount)
  );
  console.log(
    'Realized amount for the Fixed Pool after rebalancing: ' + increasedResult
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
