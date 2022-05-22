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

const impersonateAccount = async (address) => {
  await ethers.provider.send('hardhat_impersonateAccount', [address]);
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
      FixedYield: 1000,
      LRmin: 5,
      LRmax: 20,
      CreatedAt: 0,
      Deadline: 0,
      WithdrawLockPeriod: 2 * 7 * 24 * 60 * 60,
      CurrentState: 0,
    };

    const [owner] = await ethers.getSigners();
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
    const balanceWanted = '100000';
    const locallyManipulatedBalance = ethers.utils.parseUnits(balanceWanted);
    const index = ethers.utils.solidityKeccak256(
      ['uint256', 'uint256'],
      [ownerAddress, USDC_SLOT] // key, slot
    );
    await setStorageAt(
      USDC_POLYGON,
      index.toString(),
      toBytes32(locallyManipulatedBalance).toString()
    );
  });

  /*//////////////////////////////////////////////////////////////
                    HARDHAT TESTING FUNCTIONS
    //////////////////////////////////////////////////////////////*/

  it('Should have an user with a USDC balance greater than 0 (testing hardhat)', async function () {
    const [owner] = await ethers.getSigners();
    const ownerAddress = await owner.getAddress();
    const USDC = new ethers.Contract(USDC_POLYGON, ERC20Abi, ethers.provider);
    const USDC_SLOT = 0; // check https://github.com/kendricktan/slot20.git
    const balanceWanted = '100000';
    const locallyManipulatedBalance = ethers.utils.parseUnits(balanceWanted);

    const index = ethers.utils.solidityKeccak256(
      ['uint256', 'uint256'],
      [ownerAddress, USDC_SLOT] // key, slot
    );

    await setStorageAt(
      USDC_POLYGON,
      index.toString(),
      toBytes32(locallyManipulatedBalance).toString()
    );

    const balance = await USDC.balanceOf(ownerAddress);
    expect(balance.toString()).to.be.a.bignumber.that.is.equal(
      toBigNumber(locallyManipulatedBalance)
    );
  });

  it('Should impersonate the targeted account (testing hardhat)', async function () {
    const addressToImpersonate = '0x412549E877135215615e315e99feD13E897cD899';
    await impersonateAccount(addressToImpersonate);
    const signer = await ethers.getSigner(addressToImpersonate);
    const USDC = new ethers.Contract(USDC_POLYGON, ERC20Abi, ethers.provider);
    const amountToApprove = USDC.balanceOf(addressToImpersonate);
    const txn = await USDC.connect(signer).approve(
      '0x9b23553B93acB606D6E8Ed67584Ab935f08B0f0E',
      amountToApprove
    );
    const result = await txn.wait();
    expect(result.events[0].args[0]).to.be.equal(addressToImpersonate);
  });

  // /*//////////////////////////////////////////////////////////////
  //                   RATES GETTING
  // //////////////////////////////////////////////////////////////*/

  it('Should be able to call Aave contract and get a liquidity rate back', async function () {
    const liquidity_rate = await MasterContract.getLiquidityRate(USDC_POLYGON);
    expect(toBigNumber(liquidity_rate)).to.be.a.bignumber.that.is.greaterThan(
      toBigNumber('0')
    );
  });

  it('Should return an error if the pool is empty', async function () {});

  it('Should list all the backers inside the pool', async function () {});

  it('Should get the deposit of a specific address', async function () {});

  it('Should revert if trying to change the deposit of a user as a normal user', async function () {});

  it('Should return the the total assets inside the pool', async function () {});

  it('Should revert if I try to withdraw a null amount', async function () {});

  it('Should revert if I try to withdraw an amount equals to zero', async function () {});

  it('Should revert if I try to withdraw a too small amount', async function () {});

  it('Should revert if I try to withdraw for another person', async function () {});

  it('Should keep 40% of my capital if I try to withdraw before the end of the period lock', async function () {});

  it('Should let me withdraw all my money after the period lock', async function () {});

  it('Should revert if I want to deposit in a closed pool', async function () {});

  it('Should revert if I try to deposit in a pool with a LF > LFMax', async function () {});

  it('Should revert if I try to deposit in a pool with a LF < LFMin', async function () {});

  it('Should not check the leverage factor during the bootstrap period', async function () {});

  it('Should update the backers array if it is the first time an user deposit into the pool', async function () {});

  it('Should update the timestamp the first time I deposit', async function () {});

  it('Should update the timestamp and the amount of my deposit when I deposit before the end of the lock period', async function () {});

  it('Should ', async function () {});

  it('Should', async function () {});

  it('Should', async function () {});

  it('Should', async function () {});

  it('Should', async function () {});

  it('Should', async function () {});

  it('Should', async function () {});

  // /*//////////////////////////////////////////////////////////////
  //                   SUPPLY LIQUIDITY
  // //////////////////////////////////////////////////////////////*/

  // it('Should provide AToken to the Fixed Pool when someone deposits tokens', async function () {
  //   const [owner] = await ethers.getSigners();
  //   const USDC = new ethers.Contract(USDC_POLYGON, ERC20Abi, ethers.provider);
  //   const AUSDC = new ethers.Contract(AUSDC_POLYGON, ERC20Abi, ethers.provider);
  //   const amountToSupply = 5000;

  //   await USDC.connect(owner).approve(MasterContract.address, amountToSupply);
  //   await MasterContract.connect(owner).deposit(amountToSupply, owner.address);
  //   const poolATokenBalance = await AUSDC.balanceOf(MasterContract.address);

  //   expect(poolATokenBalance.toString()).to.be.a.bignumber.that.is.equal(
  //     toBigNumber(amountToSupply)
  //   );
  // });

  // it('Should give to msg.sender the equivalent amount of LTokens that he deposited', async function () {
  //   const [owner] = await ethers.getSigners();
  //   const USDC = new ethers.Contract(USDC_POLYGON, ERC20Abi, ethers.provider);
  //   const amountToSupply = 5000;

  //   await USDC.connect(owner).approve(MasterContract.address, amountToSupply);
  //   await MasterContract.connect(owner).deposit(amountToSupply, owner.address);
  //   const UserLTokenBalance = await MasterContract.balanceOf(owner.address);

  //   expect(UserLTokenBalance.toString()).to.be.a.bignumber.that.is.equal(
  //     toBigNumber(amountToSupply)
  //   );
  // });

  // it('Should be impossible to get Ltokens by using mint function from ERC4626 (revert expected)', async function () {
  //   const [owner] = await ethers.getSigners();
  //   const USDC = new ethers.Contract(USDC_POLYGON, ERC20Abi, ethers.provider);
  //   const amountToSupply = 5000;

  //   await USDC.connect(owner).approve(MasterContract.address, amountToSupply);

  //   await expect(
  //     MasterContract.connect(owner).mint(amountToSupply, owner.address)
  //   ).to.be.revertedWith('only way to provide liquidity is by using deposit');
  // });

  // it('Should emit a Deposit event when liquidity is provided', async function () {
  //   const [owner] = await ethers.getSigners();
  //   const USDC = new ethers.Contract(USDC_POLYGON, ERC20Abi, ethers.provider);
  //   const amountToSupply = 5000;

  //   await USDC.connect(owner).approve(MasterContract.address, amountToSupply);
  //   await expect(
  //     await MasterContract.connect(owner).deposit(amountToSupply, owner.address)
  //   ).to.emit(MasterContract, 'Deposit');
  // });

  // /*//////////////////////////////////////////////////////////////
  //                   WITHDRAW LIQUIDITY
  // //////////////////////////////////////////////////////////////*/

  // // it('Should add liquidity in the Aave Pool when we supply liquidity', async function () {
  // //   const [owner] = await ethers.getSigners();
  // //   const AaveProvider = new ethers.Contract(
  // //     AAVE_PROVIDER_POLYGON,
  // //     AaveProviderAbi,
  // //     ethers.provider
  // //   );
  // //   const USDC = new ethers.Contract(USDC_POLYGON, ERC20Abi, ethers.provider);
  // //   const AUSDC = new ethers.Contract(AUSDC_POLYGON, ERC20Abi, ethers.provider);
  // //   const amountToSupply = 5000;

  // //   const AavePoolBefore = await AaveProvider.getATokenTotalSupply(
  // //     USDC_POLYGON
  // //   );
  // //   // console.log(AavePoolBefore);
  // //   await USDC.connect(owner).approve(MasterContract.address, amountToSupply);
  // //   await MasterContract.connect(owner).deposit(amountToSupply, owner.address);
  // //   const AavePoolAfter = await AaveProvider.getATokenTotalSupply(USDC_POLYGON);

  // //   const balance = await AUSDC.balanceOf(MasterContract.address);
  // //   // console.log(balance);
  // //   // console.log(AavePoolAfter);
  // //   const shouldBeResult = AavePoolBefore.add(toBigNumber(amountToSupply));

  // //   expect(AavePoolAfter.toString()).to.be.a.bignumber.that.is.equal(
  // //     shouldBeResult.toString()
  // //   );
  // // });

  // it('Should provide AToken to the Fixed Pool when someone deposits tokens', async function () {
  //   const [owner] = await ethers.getSigners();
  //   const USDC = new ethers.Contract(USDC_POLYGON, ERC20Abi, ethers.provider);
  //   const AUSDC = new ethers.Contract(AUSDC_POLYGON, ERC20Abi, ethers.provider);
  //   const amountToSupply = 5000;

  //   await USDC.connect(owner).approve(MasterContract.address, amountToSupply);
  //   await MasterContract.connect(owner).deposit(amountToSupply, owner.address);
  //   const poolATokenBalance = await AUSDC.balanceOf(MasterContract.address);

  //   expect(poolATokenBalance.toString()).to.be.a.bignumber.that.is.equal(
  //     toBigNumber(amountToSupply)
  //   );
  // });

  // it('Should give to msg.sender the equivalent amount of LTokens that he deposited', async function () {
  //   const [owner] = await ethers.getSigners();
  //   const USDC = new ethers.Contract(USDC_POLYGON, ERC20Abi, ethers.provider);
  //   const amountToSupply = 5000;

  //   await USDC.connect(owner).approve(MasterContract.address, amountToSupply);
  //   await MasterContract.connect(owner).deposit(amountToSupply, owner.address);
  //   const UserLTokenBalance = await MasterContract.balanceOf(owner.address);

  //   expect(UserLTokenBalance.toString()).to.be.a.bignumber.that.is.equal(
  //     toBigNumber(amountToSupply)
  //   );
  // });

  // it('Should be impossible to get Ltokens by using mint function from ERC4626 (revert expected)', async function () {
  //   const [owner] = await ethers.getSigners();
  //   const USDC = new ethers.Contract(USDC_POLYGON, ERC20Abi, ethers.provider);
  //   const amountToSupply = 5000;

  //   await USDC.connect(owner).approve(MasterContract.address, amountToSupply);

  //   await expect(
  //     MasterContract.connect(owner).mint(amountToSupply, owner.address)
  //   ).to.be.revertedWith('only way to provide liquidity is by using deposit');
  // });

  // it('Should emit a Deposit event when liquidity is provided', async function () {
  //   const [owner] = await ethers.getSigners();
  //   const USDC = new ethers.Contract(USDC_POLYGON, ERC20Abi, ethers.provider);
  //   const amountToSupply = 5000;

  //   await USDC.connect(owner).approve(MasterContract.address, amountToSupply);
  //   await expect(
  //     await MasterContract.connect(owner).deposit(amountToSupply, owner.address)
  //   ).to.emit(MasterContract, 'Deposit');
  // });

  /*//////////////////////////////////////////////////////////////
                      GET REWARDS
  //////////////////////////////////////////////////////////////*/
});
