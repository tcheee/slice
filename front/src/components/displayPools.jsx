import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
} from '@mui/material';
import { ethers } from 'ethers';
import { useAppContext } from '../context/stateContext';
import poolabi from '../utils/pool.json';
import ERC20abi from '../utils/ERC20.json';
import Gridloader from './Gridloader';
import Popup from './Popup';

export default function DisplayPools({ pools, leverage }) {
  const { address, FactoryAddress, provider, ManagerAddress } = useAppContext();
  const [open, setOpen] = useState(false);
  const [deposit, setDeposit] = useState(false);
  const [activeAddress, setActiveAddress] = useState('');

  const handleClick = (action, address) => {
    setActiveAddress(address);
    setDeposit(action);
    setOpen(!open);
  };

  function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
  }

  const formatDate = (date) => {
    return [
      padTo2Digits(date.getDate()),
      padTo2Digits(date.getMonth() + 1),
      date.getFullYear(),
    ].join('/');
  };

  const depositMoney = async (poolAddress, amount) => {
    const USDC_POLYGON = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
    const signer = provider.getSigner();
    const signerAddress = await signer.getAddress();
    console.log('deposit ' + amount + ' into ' + poolAddress);
    const USDC = new ethers.Contract(USDC_POLYGON, ERC20abi.abi, signer);
    const Pool = new ethers.Contract(poolAddress, poolabi.abi, signer);
    await USDC.approve(poolAddress, amount);
    await Pool.deposit(amount, signerAddress);
    console.log('Money should be deposited by now');
    setOpen(!open);
  };

  const withdrawMoney = async (poolAddress, amount) => {
    console.log('withdraw ' + amount + ' from ' + poolAddress);
    const signer = provider.getSigner();
    const signerAddress = await signer.getAddress();
    const Pool = new ethers.Contract(poolAddress, poolabi.abi, signer);
    const tokenBalance = await Pool.balanceOf(signerAddress);
    console.log(tokenBalance.toNumber());
    await Pool.withdraw(amount, signerAddress, signerAddress);
    console.log('Money should be removed by now');
    setOpen(!open);
  };

  return (
    <>
      {pools.length > 0 ? (
        <Grid
          container
          spacing={4}
          sx={{ overflow: 'auto', maxHeight: { xs: 380, sm: 620 } }}
        >
          {' '}
          {pools.map((pool) => (
            <Grid
              key={pool[1]}
              item
              xs={12}
              md={12}
              lg={12}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Card
                sx={{
                  width: { xs: '7vw', sm: '85vw' },
                  height: '8vh',
                  borderRadius: '15px',
                  display: 'flex',
                  backgroundColor: '#1D1F23',
                  alignItems: 'center',
                }}
              >
                <CardContent
                  sx={{
                    width: '100%',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-around',
                    }}
                  >
                    <img
                      src="https://cryptologos.cc/logos/aave-aave-logo.png"
                      style={{ width: 30 }}
                      alt="poolegy-logo"
                    />
                    <Typography
                      variant="body2"
                      color="#FFFFFF"
                      sx={{ width: 5, fontSize: 14 }}
                    >
                      {pool.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="#FFFFFF"
                      sx={{ width: 300, fontSize: 14 }}
                    >
                      {pool.asset}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="#FFFFFF"
                      sx={{ width: 40, fontSize: 14 }}
                    >
                      {pool[9] === 0
                        ? 'Bootstrap'
                        : pool[9] === 1
                        ? 'Active'
                        : 'Closed'}
                    </Typography>
                    <Box>
                      <Typography
                        variant="body2"
                        color="#FFFFFF"
                        sx={{ width: 80, fontSize: 14 }}
                      >
                        {leverage
                          ? 'Levrg: ' + pool[4] + '-' + pool[5]
                          : parseInt(pool[3]) / 10 ** 10 + '%'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="#FFFFFF"
                        sx={{ width: 10, fontSize: 14 }}
                      >
                        {pool.amount.toNumber()}
                      </Typography>
                    </Box>
                    <Box
                      variant="body2"
                      color="#FFFFFF"
                      sx={{ width: 40, fontSize: 14 }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="#FFFFFF"
                          sx={{ width: 40, fontSize: 14 }}
                        >
                          {' '}
                          {formatDate(
                            new Date(pool[7].toNumber() + Date.now())
                          )}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={pool[9] === 2}
                        sx={{
                          backgroundColor: '#F26A8D',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: '#F5F5F5',
                            color: '#F26A8D',
                          },
                          mr: '20px',
                        }}
                        onClick={() =>
                          handleClick(true, leverage ? pool[2] : pool[1])
                        }
                      >
                        Deposit
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={pool[9] === 2}
                        sx={{
                          backgroundColor: '#F26A8D',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: '#F5F5F5',
                            color: '#F26A8D',
                          },
                        }}
                        onClick={() =>
                          handleClick(false, leverage ? pool[2] : pool[1])
                        }
                      >
                        Withdraw
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Gridloader />
      )}
      <Popup
        open={open}
        handleClick={handleClick}
        deposit={deposit}
        address={activeAddress}
        depositMoney={depositMoney}
        withdrawMoney={withdrawMoney}
      />
    </>
  );
}
