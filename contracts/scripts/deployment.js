// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat');

async function main() {
  const LEVERAGE_MULTIPLE = 5;
  const ERC20_DECIMALS = 18;
  const ERC20_SYMBOL = 'MDai';
  const AAVE_POOL_POLYGON = '0x794a61358D6845594F94dc1DB02A252b5b4814aD';
  const AAVE_PROVIDER_POLYGON = '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654';
  const USDC_POLYGON = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
  const AUSDC_POLYGON = '0x625E7708f30cA75bfd92586e17077590C60eb4cD';

  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const Ratio = await hre.ethers.getContractFactory('RatioCalculation');
  const RatioLibrary = await Ratio.deploy();
  await RatioLibrary.deployed();
  console.log('Ratio deployed to:', RatioLibrary.address);
  const Types = await hre.ethers.getContractFactory('Types');
  const TypesLibrary = await Types.deploy();
  await TypesLibrary.deployed();
  console.log('Types deployed to:', TypesLibrary.address);
  const Factory = await hre.ethers.getContractFactory('Factory');
  const FactoryContract = await Factory.deploy();
  await FactoryContract.deployed();
  console.log('Factory deployed to:', FactoryContract.address);
  const Manager = await hre.ethers.getContractFactory('Manager', {
    libraries: {
      RatioCalculation: RatioLibrary.address,
    },
  });
  const ManagerContract = await Manager.deploy(FactoryContract.address);
  await ManagerContract.deployed();
  console.log('Manager deployed to:', ManagerContract.address);

  const Variables = {
    Creator: AUSDC_POLYGON,
    FixPool: AUSDC_POLYGON,
    LevPool: AUSDC_POLYGON,
    FixedYield: 10 ** 12 / 1000, // 0.1% yield annual
    LRmin: 2,
    LRmax: 10,
    CreatedAt: 0,
    Deadline: 0,
    WithdrawLockPeriod: 0,
    CurrentState: 0,
  };

  const [owner, user1, user2, user3, user4] = await ethers.getSigners();

  await FactoryContract.connect(owner).createNewPool(
    USDC_POLYGON,
    AAVE_POOL_POLYGON,
    AAVE_PROVIDER_POLYGON,
    AUSDC_POLYGON,
    ManagerContract.address,
    'test',
    'aaaa',
    Variables
  );

  console.log('Everything should be deployed by now!');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
