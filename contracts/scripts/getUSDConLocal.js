// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const ERC20Abi = require('../test/abi/erc20.json');

const hre = require('hardhat');
const {
  abi,
} = require('../artifacts/contracts/protocol/Factory.sol/Factory.json');

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

async function main() {
  const [owner, user1, user2, user3, user4] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();
  const USDC_POLYGON = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
  const USDC_SLOT = 0; // check https://github.com/kendricktan/slot20.git
  const balanceWanted = '800000000000';

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

  console.log('Should have money by now!');

  const USDC = new ethers.Contract(USDC_POLYGON, ERC20Abi, hre.ethers.provider);

  const amount = await USDC.balanceOf(ownerAddress);
  console.log(amount);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
