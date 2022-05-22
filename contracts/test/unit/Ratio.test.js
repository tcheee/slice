const chai = require('chai');
const BN = require('bn.js');
chai.use(require('chai-bn')(BN));
const { expect } = require('chai');
const { ethers } = require('hardhat');

const toBigNumber = (x) => {
  return new ethers.BigNumber.from(x).toString();
};

describe('Factory Pool - Testing', function () {
  const LEVERAGE_MULTIPLE = 5;
  const ERC20_DECIMALS = 18;
  const ERC20_SYMBOL = 'MDai';
  const AAVE_POOL_POLYGON = '0x794a61358D6845594F94dc1DB02A252b5b4814aD';
  const AAVE_PROVIDER_POLYGON = '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654';
  const USDC_POLYGON = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
  const AUSDC_POLYGON = '0x625E7708f30cA75bfd92586e17077590C60eb4cD';

  beforeEach(async function () {
    // Deploy the Ratio contrat
    const Types = await ethers.getContractFactory('Types');
    TypesContract = await Types.deploy();
    await TypesContract.deployed();
    const Ratio = await ethers.getContractFactory('RatioCalculation');
    RatioContract = await Ratio.deploy();
    await RatioContract.deployed();
  });

  /*//////////////////////////////////////////////////////////////
                    TESTING LEVERAGE RATIO CALCULATION
    //////////////////////////////////////////////////////////////*/

  it('Should return a ratio for valid amount', async function () {
    const factor = await RatioContract.calculateLeverageFactor(4200000, 100000);
    expect(factor.toString()).to.be.a.bignumber.that.is.equal(toBigNumber(42));
  });

  it('Should revert if LevPool is null', async function () {
    await expect(
      RatioContract.calculateLeverageFactor(4200000, 0)
    ).to.be.revertedWith('There is a problem with the amount in the pools.');
  });

  it('Should revert if FixPool is null', async function () {
    await expect(
      RatioContract.calculateLeverageFactor(0, 100000)
    ).to.be.revertedWith('There is a problem with the amount in the pools.');
  });

  /*//////////////////////////////////////////////////////////////
                    TESTING LEVERAGE RATIO CHECK
    //////////////////////////////////////////////////////////////*/

  it('Should return 0 if the LF is in the given range', async function () {
    const result = await RatioContract.TestCheckLeverageFactor(
      1400000,
      100000,
      5,
      15
    );
    expect(result.toString()).to.be.a.bignumber.that.is.equal(toBigNumber(0));
  });

  it('Should return 1 if the LF is below the min', async function () {
    const result = await RatioContract.TestCheckLeverageFactor(
      320000,
      100000,
      5,
      15
    );
    expect(result.toString()).to.be.a.bignumber.that.is.equal(toBigNumber(1));
  });

  it('Should return 1 if the LF is equal to the min', async function () {
    const result = await RatioContract.TestCheckLeverageFactor(
      500000,
      100000,
      5,
      15
    );
    expect(result.toString()).to.be.a.bignumber.that.is.equal(toBigNumber(1));
  });

  it('Should return 2 if the LF is above the max', async function () {
    const result = await RatioContract.TestCheckLeverageFactor(
      4200000,
      100000,
      5,
      15
    );
    expect(result.toString()).to.be.a.bignumber.that.is.equal(toBigNumber(2));
  });

  it('Should return 2 if the LF is equal to the max', async function () {
    const result = await RatioContract.TestCheckLeverageFactor(
      1500000,
      100000,
      5,
      15
    );
    expect(result.toString()).to.be.a.bignumber.that.is.equal(toBigNumber(2));
  });

  it('Should revert if LevPool is null', async function () {
    await expect(
      RatioContract.checkLeverageFactor(0, 100000, 5, 15)
    ).to.be.revertedWith('There is a problem with the amount in the pools.');
  });

  it('Should revert if FixPool is null', async function () {
    await expect(
      RatioContract.checkLeverageFactor(4200000, 0, 5, 15)
    ).to.be.revertedWith('There is a problem with the amount in the pools.');
  });

  /*//////////////////////////////////////////////////////////////
                    TESTING PERCENTAGE CALCULATION
    //////////////////////////////////////////////////////////////*/

  it('Should revert if we have no money in the pool before harvesting', async function () {
    await expect(RatioContract.calculateYield(0, 100)).to.be.revertedWith(
      'There is an issue with the amount in the pool.'
    );
  });

  it('Should return 1000 if the rewards is a 10% yield', async function () {
    const amount = 100000;
    const amountHarvested = 0.1 * amount;

    const yield = await RatioContract.calculateYield(amount, amountHarvested);
    expect(yield.toString()).to.be.a.bignumber.that.is.equal(toBigNumber(1000));
  });

  it('Should return 20000 if the rewards is a 200% yield', async function () {
    const amount = 545123;
    const amountHarvested = (1 + 1) * amount;

    const yield = await RatioContract.calculateYield(amount, amountHarvested);
    expect(yield.toString()).to.be.a.bignumber.that.is.equal(
      toBigNumber(20000)
    );
  });
});
