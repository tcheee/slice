require('@nomiclabs/hardhat-waffle');
require('dotenv').config({ path: './.env' });
require('hardhat-contract-sizer');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [{ version: '0.8.0' }, { version: '0.8.10' }],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: false,
        },
      },
    },
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      forking: {
        url: process.env.ALCHEMY_URL_POLYGON,
        blockNumber: 28157738,
      },
    },
    // mumbai: {
    //   url: process.env.ALCHEMY_URL_MUMBAI,
    //   accounts: [process.env.PRIVATE_KEY],
    // },
    // rinkeby: {
    //   url: process.env.ALCHEMY_URL_RINKEBY,
    //   accounts: [process.env.PRIVATE_KEY],
    // },
  },
  mocha: {
    timeout: 50000,
  },
};
