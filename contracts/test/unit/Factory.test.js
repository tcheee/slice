const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Factory Pool - Testing', function () {
  const ERC20_DECIMALS = 18;
  const ERC20_SYMBOL = 'MDai';
  const AAVE_POOL_POLYGON = '0x794a61358D6845594F94dc1DB02A252b5b4814aD';
  const AAVE_PROVIDER_POLYGON = '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654';
  const USDC_POLYGON = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
  const AUSDC_POLYGON = '0x625E7708f30cA75bfd92586e17077590C60eb4cD';

  beforeEach(async function () {
    // Deploy the MockERC20 to interact with it
    const ERC20 = await ethers.getContractFactory('MintableERC20');
    ERC20Contract = await ERC20.deploy('MockDai', ERC20_SYMBOL, ERC20_DECIMALS);
    await ERC20Contract.deployed();

    // Deploy the Factory contrat
    const Factory = await ethers.getContractFactory('Factory');
    FactoryContract = await Factory.deploy();
    await FactoryContract.deployed();
  });

  it('Should be the msg.sender the owner of the factory', async function () {
    const [owner] = await ethers.getSigners();
    const contractOwner = await FactoryContract.Admin();
    expect(contractOwner).to.equal(owner.address);
  });

  it('Should create a new pool and put it in the mapping. The creator must be register in the struct.', async function () {
    const [owner] = await ethers.getSigners();
    const Ratio = await ethers.getContractFactory('RatioCalculation');
    RatioLibrary = await Ratio.deploy();
    await RatioLibrary.deployed();
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
      FixedYield: 1000,
      LRmin: 5,
      LRmax: 20,
      CreatedAt: 0,
      Deadline: 0,
      WithdrawLockPeriod: 2 * 7 * 24 * 60 * 60,
      CurrentState: 0,
    };

    await FactoryContract.createNewPool(
      USDC_POLYGON,
      AAVE_POOL_POLYGON,
      AAVE_PROVIDER_POLYGON,
      AUSDC_POLYGON,
      ManagerContract.address,
      'test',
      'aaaa',
      Variables
    );

    const struct = await FactoryContract.returnTranchesByIndex(USDC_POLYGON, 0);
    expect(struct[0]).to.equal(owner.address);
  });

  it('Should be able to create several pools for the same assets and return them', async function () {
    const [owner] = await ethers.getSigners();
    const Ratio = await ethers.getContractFactory('RatioCalculation');
    RatioLibrary = await Ratio.deploy();
    await RatioLibrary.deployed();
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
      FixedYield: 1000,
      LRmin: 5,
      LRmax: 20,
      CreatedAt: 0,
      Deadline: 0,
      WithdrawLockPeriod: 2 * 7 * 24 * 60 * 60,
      CurrentState: 0,
    };

    await FactoryContract.createNewPool(
      USDC_POLYGON,
      AAVE_POOL_POLYGON,
      AAVE_PROVIDER_POLYGON,
      AUSDC_POLYGON,
      ManagerContract.address,
      'test',
      'aaaa',
      Variables
    );

    await FactoryContract.createNewPool(
      USDC_POLYGON,
      AAVE_POOL_POLYGON,
      AAVE_PROVIDER_POLYGON,
      AUSDC_POLYGON,
      ManagerContract.address,
      'test',
      'aaaa',
      Variables
    );

    const struct = await FactoryContract.returnTranchesByIndex(USDC_POLYGON, 0);
    const struct1 = await FactoryContract.returnTranchesByIndex(
      USDC_POLYGON,
      1
    );
    expect(struct[0]).to.equal(owner.address);
    expect(struct1[0]).to.equal(owner.address);
  });

  it('Should emit an event when a new pool is created', async function () {
    const Ratio = await ethers.getContractFactory('RatioCalculation');
    RatioLibrary = await Ratio.deploy();
    await RatioLibrary.deployed();
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
      FixedYield: 1000,
      LRmin: 5,
      LRmax: 20,
      CreatedAt: 0,
      Deadline: 0,
      WithdrawLockPeriod: 2 * 7 * 24 * 60 * 60,
      CurrentState: 0,
    };

    await expect(
      await FactoryContract.createNewPool(
        USDC_POLYGON,
        AAVE_POOL_POLYGON,
        AAVE_PROVIDER_POLYGON,
        AUSDC_POLYGON,
        ManagerContract.address,
        'test',
        'aaaa',
        Variables
      )
    ).to.emit(FactoryContract, 'NewPoolCreated');
  });

  it('Should let the admin change the state of a specific pool', async function () {
    const [owner] = await ethers.getSigners();
    const Ratio = await ethers.getContractFactory('RatioCalculation');
    RatioLibrary = await Ratio.deploy();
    await RatioLibrary.deployed();
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
      FixedYield: 1000,
      LRmin: 5,
      LRmax: 20,
      CreatedAt: 0,
      Deadline: 0,
      WithdrawLockPeriod: 2 * 7 * 24 * 60 * 60,
      CurrentState: 0,
    };

    await FactoryContract.createNewPool(
      USDC_POLYGON,
      AAVE_POOL_POLYGON,
      AAVE_PROVIDER_POLYGON,
      AUSDC_POLYGON,
      ManagerContract.address,
      'test',
      'aaaa',
      Variables
    );

    const struct = await FactoryContract.returnTranchesByIndex(USDC_POLYGON, 0);
    expect(struct[9]).to.equal(0);

    await FactoryContract.changePoolState(USDC_POLYGON, 0, 1);
    let structAfter = await FactoryContract.returnTranchesByIndex(
      USDC_POLYGON,
      0
    );
    expect(structAfter[9]).to.equal(1);

    await FactoryContract.changePoolState(USDC_POLYGON, 0, 2);
    structAfter = await FactoryContract.returnTranchesByIndex(USDC_POLYGON, 0);
    expect(structAfter[9]).to.equal(2);
  });

  it('Should revert if a non-admin try to change the state of a pool', async function () {
    const [_, user] = await ethers.getSigners();
    const Ratio = await ethers.getContractFactory('RatioCalculation');
    RatioLibrary = await Ratio.deploy();
    await RatioLibrary.deployed();
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
      FixedYield: 1000,
      LRmin: 5,
      LRmax: 20,
      CreatedAt: 0,
      Deadline: 0,
      WithdrawLockPeriod: 2 * 7 * 24 * 60 * 60,
      CurrentState: 0,
    };

    await FactoryContract.createNewPool(
      USDC_POLYGON,
      AAVE_POOL_POLYGON,
      AAVE_PROVIDER_POLYGON,
      AUSDC_POLYGON,
      ManagerContract.address,
      'test',
      'aaaa',
      Variables
    );

    await expect(
      FactoryContract.connect(user).changePoolState(USDC_POLYGON, 0, 1)
    ).to.be.revertedWith('');
  });

  it('Should retrieve the tranches stored for a specific asset', async function () {
    const [owner] = await ethers.getSigners();
    const Ratio = await ethers.getContractFactory('RatioCalculation');
    RatioLibrary = await Ratio.deploy();
    await RatioLibrary.deployed();
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
      FixedYield: 1000,
      LRmin: 5,
      LRmax: 20,
      CreatedAt: 0,
      Deadline: 0,
      WithdrawLockPeriod: 2 * 7 * 24 * 60 * 60,
      CurrentState: 0,
    };

    await FactoryContract.createNewPool(
      USDC_POLYGON,
      AAVE_POOL_POLYGON,
      AAVE_PROVIDER_POLYGON,
      AUSDC_POLYGON,
      ManagerContract.address,
      'test',
      'aaaa',
      Variables
    );
    await FactoryContract.createNewPool(
      USDC_POLYGON,
      AAVE_POOL_POLYGON,
      AAVE_PROVIDER_POLYGON,
      AUSDC_POLYGON,
      ManagerContract.address,
      'test',
      'aaaa',
      Variables
    );

    const struct = await FactoryContract.returnTranchesByIndex(USDC_POLYGON, 0);
    expect(struct[9]).to.equal(0);

    const info = await FactoryContract.AssetIndexes(USDC_POLYGON);
    console.log(info);
  });
});
