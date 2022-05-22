const { expect } = require('chai');
const { ethers } = require('hardhat');

//Need to isolate the test scenario
describe('Liquidity Pool - Testing', function () {
  const LEVERAGE_MULTIPLE = 5;
  const ERC20_DECIMALS = 18;
  const ERC20_SYMBOL = 'MDai';
  const TOKEN_TO_MINT = 20000;
  const POOL_MAX_DEPOSIT = ethers.constants.MaxUint256;

  before(async function () {
    // Deploy the MockERC20 to interact with it
    const ERC20 = await ethers.getContractFactory('MintableERC20');
    ERC20Contract = await ERC20.deploy('MockDai', ERC20_SYMBOL, ERC20_DECIMALS);
    await ERC20Contract.deployed();
    const ERC20Address = ERC20Contract.address;
    ERC20Contract.mint(TOKEN_TO_MINT);

    // Deploy liquidity pool using the ERC20 as a responsive contract
    const LPool = await ethers.getContractFactory('LeveragePool');
    poolContract = await LPool.deploy(
      ERC20Address,
      'Shares of LP-Test',
      'LP-Test',
      LEVERAGE_MULTIPLE
    );
    await poolContract.deployed();
  });

  it('Should return the leverage multiple from the pool', async function () {
    const leverageMultiple = await poolContract.leverageMultiple();
    expect(leverageMultiple).to.equal(LEVERAGE_MULTIPLE);
  });

  it('Should return the number of decimals and the right symbol from the token', async function () {
    const decimals = await ERC20Contract.decimals();
    const symbol = await ERC20Contract.symbol();
    expect(decimals).to.equal(ERC20_DECIMALS);
    expect(symbol).to.equal(ERC20_SYMBOL);
  });

  it('Should return the balance of the deployer address', async function () {
    const [owner] = await ethers.getSigners();
    const balance = await ERC20Contract.balanceOf(owner.address);
    expect(balance).to.equal(TOKEN_TO_MINT);
  });

  it('Should return the max deposit of LPool', async function () {
    const [owner] = await ethers.getSigners();
    const maxDeposit = await poolContract.maxDeposit(owner.address);
    expect(maxDeposit).to.equal(POOL_MAX_DEPOSIT);
  });

  it('Should let people deposit token inside the Vault', async function () {
    const [owner] = await ethers.getSigners();
    await ERC20Contract.approve(poolContract.address, TOKEN_TO_MINT);
    await poolContract.deposit(TOKEN_TO_MINT, owner.address);
    const total = await poolContract.maxRedeem(owner.address);
    expect(total).to.equal(TOKEN_TO_MINT);
  });

  it('Should let a non-owner to deposit his token inside the Vault', async function () {
    const [_, addr1] = await ethers.getSigners();
    await ERC20Contract.connect(addr1).mint(TOKEN_TO_MINT);
    await ERC20Contract.connect(addr1).approve(
      poolContract.address,
      TOKEN_TO_MINT
    );
    await poolContract.connect(addr1).deposit(TOKEN_TO_MINT, addr1.address);
    const total = await poolContract.connect(addr1).maxRedeem(addr1.address);
    expect(total).to.equal(TOKEN_TO_MINT);
  });

  it('Should show that the total assets is equal to the sum of all the previous deposit', async function () {
    const total = await poolContract.totalAssets();
    expect(total).to.equal(TOKEN_TO_MINT * 2);
  });

  it('Should let the owner withdraw his assets against his shares', async function () {
    const [owner] = await ethers.getSigners();
    await poolContract.withdraw(TOKEN_TO_MINT, owner.address, owner.address);

    const balance = await ERC20Contract.balanceOf(owner.address);
    expect(balance).to.equal(TOKEN_TO_MINT);
    const total = await poolContract.totalAssets();
    expect(total).to.equal(TOKEN_TO_MINT);
    const shareOfOwner = await poolContract.maxRedeem(owner.address);
    expect(shareOfOwner).to.equal(0);
  });

  it('Should let a non-owner withdraw his assets against his shares', async function () {
    const [_, addr1] = await ethers.getSigners();
    await poolContract
      .connect(addr1)
      .withdraw(TOKEN_TO_MINT, addr1.address, addr1.address);

    const balance = await ERC20Contract.connect(addr1).balanceOf(addr1.address);
    expect(balance).to.equal(TOKEN_TO_MINT);
    const total = await poolContract.totalAssets();
    expect(total).to.equal(0);
    const shareOfaddr1 = await poolContract
      .connect(addr1)
      .maxRedeem(addr1.address);
    expect(shareOfaddr1).to.equal(0);
  });

  it('Should burn all the balance of the deployer address', async function () {
    const [owner] = await ethers.getSigners();
    await ERC20Contract.burn(TOKEN_TO_MINT);
    const balance = await ERC20Contract.balanceOf(owner.address);
    expect(balance).to.equal(0);
  });
});
