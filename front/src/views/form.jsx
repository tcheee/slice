import '../App.css';
import React, { Component, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ethers, utils } from 'ethers';
import { useAppContext } from '../context/stateContext';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import 'react-toastify/dist/ReactToastify.css';
import ButtonLoader from '../components/buttonLoader';
import abi from '../utils/factory.json';
import { Container, Typography, Box, TextField, Grid } from '@mui/material';
const notifyMinting = () =>
  toast.info('Transaction sent!', {
    position: 'top-left',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
const notifyMinted = () =>
  toast.success('Course minted!', {
    position: 'top-left',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });

const AAVE_POOL_POLYGON = '0x794a61358D6845594F94dc1DB02A252b5b4814aD';
const AAVE_PROVIDER_POLYGON = '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654';
const USDC_POLYGON = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
const AUSDC_POLYGON = '0x625E7708f30cA75bfd92586e17077590C60eb4cD';

export default function Form() {
  const { address, FactoryAddress, provider, ManagerAddress } = useAppContext();
  const [name, setName] = useState('');
  const [addressToken, setAddressToken] = useState('');
  const [addressAToken, setAddressAToken] = useState('');
  const [Lmin, setLmin] = useState('');
  const [Lmax, setLmax] = useState('');
  const [fixedYield, setFixedYield] = useState('');
  const [period, setPeriod] = useState('');
  const navigate = useNavigate();

  const handleChange = (event) => {
    setPeriod(event.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const Variables = {
        Creator: address,
        FixPool: address,
        LevPool: address,
        FixedYield: parseInt((parseFloat(fixedYield) * 10 ** 12) / 100), // yield annual
        LRmin: Lmin,
        LRmax: Lmax,
        CreatedAt: 0,
        Deadline: parseInt(period) * 30 * 42 * 60 * 60,
        WithdrawLockPeriod: 0,
        CurrentState: 0,
      };

      const signer = provider.getSigner();

      const Factory = new ethers.Contract(FactoryAddress, abi.abi, signer);
      const LenghtBefore = await Factory.AssetIndexes(USDC_POLYGON);
      const txn = await Factory.createNewPool(
        USDC_POLYGON,
        AAVE_POOL_POLYGON,
        AAVE_PROVIDER_POLYGON,
        AUSDC_POLYGON,
        ManagerAddress,
        name,
        'sli' + name,
        Variables
      );
      await txn.wait();
      console.log(txn);
      const LengthAfter = await Factory.AssetIndexes(USDC_POLYGON);

      console.log(LenghtBefore);
      console.log(LengthAfter);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Container>
      <ToastContainer />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h4"
          color="#000000"
          sx={{
            mt: '80px',
            mb: '20px',
            fontWeight: 'bold',
            color: '#F26A8D',
            typography: {
              fontFamily: ['Righteous', 'cursive'].join(','),
            },
          }}
        >
          Create New Pools
        </Typography>
      </Box>
      <Grid
        container
        spacing={0}
        direction="column"
        alignItems="center"
        justifyContent="center"
        style={{ minHeight: '10vh' }}
      >
        <TextField
          id="outlined-basic"
          label="Name of the pool"
          variant="outlined"
          type="text"
          margin="dense"
          sx={{
            width: '60%',
            backgroundColor: '#F5F5F5',
            borderRadius: '10px',
          }}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
        <TextField
          id="outlined-basic"
          label="Address of the underlying token"
          variant="outlined"
          type="text"
          margin="dense"
          sx={{
            width: '60%',
            backgroundColor: '#F5F5F5',
            borderRadius: '10px',
          }}
          value={addressToken}
          onChange={(e) => {
            setAddressToken(e.target.value);
          }}
        />
        <TextField
          id="outlined-basic"
          label="Address of the aToken (Aave)"
          variant="outlined"
          type="text"
          margin="dense"
          sx={{
            width: '60%',
            backgroundColor: '#F5F5F5',
            borderRadius: '10px',
          }}
          value={addressAToken}
          onChange={(e) => {
            setAddressAToken(e.target.value);
          }}
        />
        <TextField
          id="outlined-start-adornment"
          label="Leverage Min"
          margin="dense"
          sx={{
            width: '60%',
            backgroundColor: '#F5F5F5',
            borderRadius: '10px',
          }}
          value={Lmin}
          onChange={(e) => {
            setLmin(e.target.value);
          }}
        />
        <TextField
          id="outlined-start-adornment"
          label="Leverage Max"
          margin="dense"
          sx={{
            width: '60%',
            backgroundColor: '#F5F5F5',
            borderRadius: '10px',
          }}
          value={Lmax}
          onChange={(e) => {
            setLmax(e.target.value);
          }}
        />
        <FormControl
          fullWidth
          sx={{
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'center',
            mt: '5px',
          }}
        >
          <Select
            sx={{
              width: '60%',
              backgroundColor: '#F5F5F5',
              borderRadius: '10px',
            }}
            displayEmpty
            value={period}
            label="Age"
            onChange={handleChange}
            renderValue={(selected) => {
              if (selected.length === 0) {
                return <em>Pool Period</em>;
              }

              return selected;
            }}
          >
            <MenuItem disabled value="">
              <em>Pool Period</em>
            </MenuItem>
            <MenuItem value={1}>1 month</MenuItem>
            <MenuItem value={3}>3 months</MenuItem>
            <MenuItem value={6}>6 months</MenuItem>
          </Select>
        </FormControl>
        <TextField
          id="outlined-start-adornment"
          label="Fixed Yield to offer (i.e: 3.1542)"
          margin="dense"
          sx={{
            width: '60%',
            backgroundColor: '#F5F5F5',
            borderRadius: '10px',
          }}
          value={fixedYield}
          onChange={(e) => {
            setFixedYield(e.target.value);
          }}
        />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#F26A8D',
            color: 'white',
            width: 160,
            height: 45,
            borderRadius: 30,
            mb: 4,
            mt: 4,
            typography: {
              fontFamily: ['Righteous', 'cursive'].join(','),
            },
            cursor: 'pointer',
            ':hover': {
              bgcolor: '#FEF7F0', // theme.palette.primary.main
              color: '#F26A8D',
            },
          }}
          onClick={handleSubmit}
        >
          Create Pools
        </Box>
      </Grid>
    </Container>
  );
}

// address _asset,
// address _poolToken,
// uint256 FixedYield;
// uint256 LRmin;
// uint256 LRmax;
// uint256 Deadline;
