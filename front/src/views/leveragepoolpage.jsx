import '../App.css';
import React, { useEffect, useState, useContext } from 'react';
import { useAppContext } from '../context/stateContext';
import { Container, Typography, Box, ThemeProvider } from '@mui/material';
import { createTheme } from '@material-ui/core/styles';
import { ethers } from 'ethers';
import DisplayPools from '../components/displayPools';
import abi from '../utils/factory.json';
import poolabi from '../utils/pool.json';
import Gridloader from '../components/Gridloader';
const USDC_POLYGON = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

export default function Homepage() {
  const { address, provider, FactoryAddress } = useAppContext();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(false);
  const theme = createTheme({
    typography: {
      fontFamily: ['Righteous', 'cursive'].join(','),
    },
  });

  useEffect(() => {
    async function getData() {
      try {
        const Factory = new ethers.Contract(FactoryAddress, abi.abi, provider);
        let length = await Factory.AssetIndexes(USDC_POLYGON);
        length = length.toNumber();
        let array = [];
        for (let i = length - 1; i >= 0; i--) {
          let info = await Factory.returnTranchesByIndex(USDC_POLYGON, i);
          array.push(info);
        }
        const enhancedArray = await Promise.all(
          array.map(async (pool) => {
            const Pool = new ethers.Contract(pool[2], poolabi.abi, provider);
            const totalAmount = await Pool.totalAssets();
            const name = await Pool.name();
            return {
              ...pool,
              amount: totalAmount,
              name: name,
              asset: USDC_POLYGON,
            };
          })
        );
        console.log(enhancedArray);
        setPools(enhancedArray);
      } catch (err) {
        console.log(err);
      }
    }

    setLoading(true);
    getData();
    setLoading(false);
  }, [FactoryAddress, provider]);

  return (
    <Container className="main-container" maxWidth="xl">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ThemeProvider theme={theme}>
          <Typography
            variant="h4"
            color="#000000"
            sx={{
              mt: '40px',
              mb: '40px',
              ml: '50px',
              fontWeight: 'bold',
              color: '#F26A8D',
            }}
          >
            Leveraged Pools
          </Typography>
        </ThemeProvider>
      </Box>
      {loading ? (
        <Gridloader />
      ) : (
        <DisplayPools pools={pools} leverage={true} />
      )}
    </Container>
  );
}
