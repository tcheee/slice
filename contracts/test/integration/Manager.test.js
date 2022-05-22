const chai = require('chai');
const BN = require('bn.js');
chai.use(require('chai-bn')(BN));
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BigNumber } = require('ethers');
const ERC20Abi = require('../abi/erc20.json');
const AaveProviderAbi = require('../abi/AaveProvider.json');

const toBigNumber = (x) => {
  return new ethers.BigNumber.from(x).toString();
};

const toBytes32 = (bn) => {
  return ethers.utils.hexlify(ethers.utils.zeroPad(bn.toHexString(), 32));
};

const setStorageAt = async (address, index, value) => {
  await ethers.provider.send('hardhat_setStorageAt', [address, index, value]);
  await ethers.provider.send('evm_mine', []); // Just mines to the next block
};

const addTokensToAddress = async (address, tokenAddress, amount, slot) => {
  const locallyManipulatedBalance = ethers.utils.parseUnits(amount);
  const index = ethers.utils.solidityKeccak256(
    ['uint256', 'uint256'],
    [address, slot] // key, slot
  );
  await setStorageAt(
    tokenAddress,
    index.toString(),
    toBytes32(locallyManipulatedBalance).toString()
  );
};

describe('Factory Pool - Testing', function () {
  const AAVE_POOL_POLYGON = '0x794a61358D6845594F94dc1DB02A252b5b4814aD';
  const AAVE_PROVIDER_POLYGON = '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654';
  const USDC_POLYGON = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
  const AUSDC_POLYGON = '0x625E7708f30cA75bfd92586e17077590C60eb4cD';

  //Starting all the test with a defined amound of USDC
  beforeEach(async function () {
    const Ratio = await ethers.getContractFactory('RatioCalculation');
    RatioLibrary = await Ratio.deploy();
    await RatioLibrary.deployed();
    const Types = await ethers.getContractFactory('Types');
    TypesLibrary = await Types.deploy();
    await TypesLibrary.deployed();
    const Factory = await ethers.getContractFactory('Factory');
    FactoryContract = await Factory.deploy();
    await FactoryContract.deployed();
    const Manager = await ethers.getContractFactory('Manager', {
      libraries: {
        RatioCalculation: RatioLibrary.address,
      },
    });
    ManagerContract = await Manager.deploy(FactoryContract.address);
    await ManagerContract.deployed();

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
    const ownerAddress = await owner.getAddress();

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

    const USDC_SLOT = 0; // check https://github.com/kendricktan/slot20.git
    const balanceWanted = '80000000000';

    await addTokensToAddress(
      ownerAddress,
      USDC_POLYGON,
      balanceWanted,
      USDC_SLOT
    );
    await addTokensToAddress(
      user1.address,
      USDC_POLYGON,
      balanceWanted,
      USDC_SLOT
    );
    await addTokensToAddress(
      user2.address,
      USDC_POLYGON,
      balanceWanted,
      USDC_SLOT
    );
    await addTokensToAddress(
      user3.address,
      USDC_POLYGON,
      balanceWanted,
      USDC_SLOT
    );
    await addTokensToAddress(
      user4.address,
      USDC_POLYGON,
      balanceWanted,
      USDC_SLOT
    );
  });

  //   it('Should revert if someone try to harvest before 7 days', async function () {});

  //   it('Should revert if someone try to harvest in bootstrap period', async function () {});

  //   it('Should revert if someone try to harvest in closed period', async function () {});

  it.only('Should let anyone harvest if 7 days are past and switch amount between pools when EffY > ExpY', async function () {
    // put money inside both pools with a leverage of 5
    const [owner] = await ethers.getSigners();

    const Ratio = await ethers.getContractFactory('RatioCalculation');
    RatioContract = await Ratio.deploy();
    await RatioContract.deployed();

    const USDC = new ethers.Contract(USDC_POLYGON, ERC20Abi, ethers.provider);
    const struct = await FactoryContract.returnTranchesByIndex(USDC_POLYGON, 0);
    const FixPool = await ethers.getContractAt('Pool', struct[1]);
    const LevPool = await ethers.getContractAt('Pool', struct[2]);
    const amountFix = 50000000000;
    const amountLev = 10000000000;
    await USDC.connect(owner).approve(FixPool.address, amountFix);
    await FixPool.deposit(amountFix, owner.address);
    await USDC.connect(owner).approve(LevPool.address, amountLev);
    await LevPool.deposit(amountLev, owner.address);

    // put the pool in active mode and pass data into last harvest
    await ManagerContract.closeBoostrapPeriod(USDC_POLYGON, 0);
    const structAfter = await FactoryContract.returnTranchesByIndex(
      USDC_POLYGON,
      0
    );
    expect(structAfter[9]).to.equal(1);

    // Get rewards inside the pool thanks to Aave
    const FixPoolAmountBefore = await FixPool.totalAssets();
    await hre.network.provider.send('hardhat_mine', ['0xC350']);
    const FixPoolAmountAfter = await FixPool.totalAssets();
    const LevPoolAmountAfter = await LevPool.totalAssets();

    await hre.network.provider.send('evm_increaseTime', [7 * 25 * 60 * 60]);
    await hre.network.provider.send('evm_mine');
    const LevPoolAmountAfterMiningTime = await LevPool.totalAssets();
    const FixPoolAmountAfterMiningTime = await FixPool.totalAssets();

    // console.log(FixPoolAmountAfterMiningTime);
    await ManagerContract.harvest(USDC_POLYGON, 0);
    const FixPoolAmountAfterHarvest = await FixPool.totalAssets();
    // console.log(FixPoolAmountAfterHarvest);
    expect(
      FixPoolAmountAfterHarvest.toString()
    ).to.be.a.bignumber.that.is.lessThan(FixPoolAmountAfter.toString());

    // Verify that the amount staying in Fixed is just more than the calculated yield
    const AmountBeforeNotBN = FixPoolAmountBefore.toNumber();
    const expectedAmount =
      ((10 ** 12 / 1000 / 52) * AmountBeforeNotBN) / 10 ** 12;
    const increasedResult =
      FixPoolAmountAfterHarvest.toNumber() - FixPoolAmountBefore.toNumber();

    // need to add a little difference based on amount streamed from Aave between testing blocks
    expect(increasedResult).to.be.lessThan(expectedAmount * 1.000005);
  });

  it('Should let anyone harvest if 7 days are past and switch amount between pools when EffY < ExpY', async function () {
    // put money inside both pools with a leverage of 5
    const [owner] = await ethers.getSigners();
    const Yield = (5 * 10 ** 12) / 100; // 5% yield annual

    const Variables = {
      Creator: AUSDC_POLYGON,
      FixPool: AUSDC_POLYGON,
      LevPool: AUSDC_POLYGON,
      FixedYield: Yield, // 5% yield annual
      LRmin: 2,
      LRmax: 10,
      CreatedAt: 0,
      Deadline: 0,
      WithdrawLockPeriod: 0,
      CurrentState: 0,
    };

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

    const Ratio = await ethers.getContractFactory('RatioCalculation');
    RatioContract = await Ratio.deploy();
    await RatioContract.deployed();

    const USDC = new ethers.Contract(USDC_POLYGON, ERC20Abi, ethers.provider);
    const struct = await FactoryContract.returnTranchesByIndex(USDC_POLYGON, 1);
    const FixPool = await ethers.getContractAt('Pool', struct[1]);
    const LevPool = await ethers.getContractAt('Pool', struct[2]);
    const amountFix = 50000000000;
    const amountLev = 10000000000;
    await USDC.connect(owner).approve(FixPool.address, amountFix);
    await FixPool.deposit(amountFix, owner.address);
    await USDC.connect(owner).approve(LevPool.address, amountLev);
    await LevPool.deposit(amountLev, owner.address);

    // put the pool in active mode and pass data into last harvest
    await ManagerContract.closeBoostrapPeriod(USDC_POLYGON, 1);
    const structAfter = await FactoryContract.returnTranchesByIndex(
      USDC_POLYGON,
      1
    );
    expect(structAfter[9]).to.equal(1);

    // Get rewards inside the pool thanks to Aave
    const FixPoolAmountBefore = await FixPool.totalAssets();
    const LevPoolAmountBefore = await LevPool.totalAssets();
    await hre.network.provider.send('hardhat_mine', ['0xC350']);
    const FixPoolAmountAfter = await FixPool.totalAssets();
    const LevPoolAmountAfter = await LevPool.totalAssets();
    console.log(LevPoolAmountBefore);
    console.log(LevPoolAmountAfter);

    await hre.network.provider.send('evm_increaseTime', [7 * 25 * 60 * 60]);
    await hre.network.provider.send('evm_mine');
    const LevPoolAmountAfterMiningTime = await LevPool.totalAssets();

    console.log(LevPoolAmountAfterMiningTime);
    await ManagerContract.harvest(USDC_POLYGON, 1);
    const FixPoolAmountAfterHarvest = await FixPool.totalAssets();
    const LevPoolAmountAfterHarvest = await LevPool.totalAssets();
    console.log(LevPoolAmountAfterHarvest);
    expect(
      LevPoolAmountAfterHarvest.toString()
    ).to.be.a.bignumber.that.is.lessThan(
      LevPoolAmountAfterMiningTime.toString()
    );

    // Verify that the amount staying in Fixed is just more than the calculated yield
    const AmountBeforeNotBN = FixPoolAmountBefore.toNumber();
    const expectedAmount = ((Yield / 52) * AmountBeforeNotBN) / 10 ** 12;
    const increasedResult =
      FixPoolAmountAfterHarvest.toNumber() - FixPoolAmountBefore.toNumber();

    console.log(expectedAmount);
    console.log(increasedResult);

    // need to add a little difference based on amount streamed from Aave between testing blocks
    expect(increasedResult).to.be.lessThan(expectedAmount * 1.000005);
  });

  //   it('Should return the information about a specific tranches based on his index', async function () {});

  //   it('Should return the state of the leverage factor', async function () {});

  //   it('Should return the value of the leverage factor', async function () {});

  //   it('Should be able to call the function closing bootstrap only during the bootstrap period', async function () {});

  //   it('Should be able to change the state of the pool from bootstrap to active', async function () {});

  it('Should be able to rebalance the pool from > LF max to inside range', async function () {
    const [owner, user1, user2, user3, user4] = await ethers.getSigners();

    const Ratio = await ethers.getContractFactory('RatioCalculation');
    RatioContract = await Ratio.deploy();
    await RatioContract.deployed();

    // Put money inside the pools with a LF > LFmax
    const USDC = new ethers.Contract(USDC_POLYGON, ERC20Abi, ethers.provider);
    const struct = await FactoryContract.returnTranchesByIndex(USDC_POLYGON, 0);
    const FixPool = await ethers.getContractAt('Pool', struct[1]);
    const LevPool = await ethers.getContractAt('Pool', struct[2]);
    const amountFix = 20000000000;
    const amountLev = 5000000000;
    await USDC.connect(owner).approve(LevPool.address, amountLev);
    await LevPool.deposit(amountLev, owner.address);
    await USDC.connect(owner).approve(FixPool.address, amountFix);
    await FixPool.connect(owner).deposit(amountFix, owner.address);
    await USDC.connect(user1).approve(FixPool.address, amountFix);
    await FixPool.connect(user1).deposit(amountFix, user1.address);
    await USDC.connect(user2).approve(FixPool.address, amountFix);
    await FixPool.connect(user2).deposit(amountFix, user2.address);
    await USDC.connect(user3).approve(FixPool.address, amountFix);
    await FixPool.connect(user3).deposit(amountFix, user3.address);
    await USDC.connect(user4).approve(FixPool.address, amountFix);
    await FixPool.connect(user4).deposit(amountFix, user4.address);

    const FixPoolAmount = await FixPool.totalAssets();
    const LevPoolAmount = await LevPool.totalAssets();
    console.log(FixPoolAmount);
    console.log(LevPoolAmount);
    let factor = await RatioLibrary.calculateLeverageFactor(
      FixPoolAmount.toNumber(),
      LevPoolAmount.toNumber()
    );
    console.log(factor);

    //Close the bootstraping period
    await ManagerContract.closeBoostrapPeriod(USDC_POLYGON, 0);
    const structAfter = await FactoryContract.returnTranchesByIndex(
      USDC_POLYGON,
      0
    );
    expect(structAfter[9]).to.equal(1);

    //Verify that the LF factor is in the range
    console.log('--------------');
    const FixPoolAmountAfter = await FixPool.totalAssets();
    const LevPoolAmountAfter = await LevPool.totalAssets();
    console.log(FixPoolAmountAfter);
    console.log(LevPoolAmountAfter);
    factor = await RatioLibrary.calculateLeverageFactor(
      FixPoolAmountAfter.toNumber(),
      LevPoolAmountAfter.toNumber()
    );
    console.log(factor);

    //Verify that the last users were recredited of their amount

    //Verify that the last users's deposited amount where well updated in the pool
  });

  //   it('Should be able to rebalance the pool from < LF min to inside range', async function () {});

  //   it('Should be able to call the function closing active only during the active period', async function () {});

  //   it('Should be able to change the state of the pool from active to closed', async function () {});

  //   it('Should update the deposit from the last backers to 0 when rebalacing the poolsc', async function () {});

  it('Should be able to call Aave contract and get a liquidity rate back', async function () {
    const liquidity_rate = await ManagerContract.getLiquidityRate(
      USDC_POLYGON,
      0
    );
    expect(
      toBigNumber(liquidity_rate[0])
    ).to.be.a.bignumber.that.is.greaterThan(toBigNumber('0'));
    expect(
      toBigNumber(liquidity_rate[1])
    ).to.be.a.bignumber.that.is.greaterThan(toBigNumber('0'));
  });
});
