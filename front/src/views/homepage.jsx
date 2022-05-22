import '../App.css';
import React, { useEffect, useState, useContext } from 'react';
import { useAppContext } from '../context/stateContext';
import { Container, Typography, Box, ThemeProvider } from '@mui/material';
import { createTheme } from '@material-ui/core/styles';
import { ethers } from 'ethers';
import abi from '../utils/factory.json';
import { useNavigate } from 'react-router-dom';

const USDC_POLYGON = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
const FACTORY_ADDRESS = '0x17975FB494576ae89D627F904Ec723B87c7C35c8';

export default function Homepage() {
  const { address, provider } = useAppContext();
  const navigate = useNavigate();

  const theme = createTheme({
    typography: {
      fontFamily: ['Righteous'].join(','),
    },
  });

  return (
    <Container className="main-container" maxWidth="xl">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          alignItems: 'center',
          mt: 20,
        }}
      >
        <ThemeProvider theme={theme}>
          {address ? (
            <Box
              sx={{
                justifyContent: 'center',
                flexGrow: 1,
              }}
            >
              <Typography
                sx={{ mt: '20px', mb: '20px', fontSize: 45, color: '#FFF' }}
              >
                Now, you have the choice between Fixed and Leveraged yields.
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  alignItems: 'center',
                  mt: '75px',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: '#F26A8D',
                    width: 380,
                    letterSpacing: 1,
                    height: '7vh',
                    fontSize: '30px',
                    fontWeight: 'bold',
                    borderRadius: 30,
                    cursor: 'pointer',
                    color: '#F5F5F5',
                    ':hover': {
                      bgcolor: '#FEF7F0', // theme.palette.primary.main
                      color: '#F26A8D',
                    },
                  }}
                  onClick={() => navigate('/fixed-pools')}
                >
                  Fixed
                </Box>
                <Typography
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: 180,
                    letterSpacing: 1,
                    height: '7vh',
                    fontSize: '30px',
                    fontWeight: 'bold',
                    color: '#F5F5F5',
                  }}
                >
                  OR
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: '#F26A8D',
                    width: 380,
                    letterSpacing: 1,
                    height: '7vh',
                    fontSize: '30px',
                    fontWeight: 'bold',
                    borderRadius: 30,
                    color: '#F5F5F5',
                    cursor: 'pointer',
                    ':hover': {
                      bgcolor: '#FEF7F0', // theme.palette.primary.main
                      color: '#F26A8D',
                    },
                  }}
                  onClick={() => navigate('/leverage-pools')}
                >
                  Leveraged
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography sx={{ mt: '30px', fontSize: 25, color: '#F5F5F5' }}>
              Please connect by clicking on the "log in" button on the right
              <br></br>
              <br></br>
              If you don't have metamask installed, follow these instructions:
              <br></br>
              <a
                href="https://metamask.io/faqs/"
                target="_blank"
                rel="noreferrer"
              >
                Instructions{' '}
              </a>
            </Typography>
          )}
        </ThemeProvider>
      </Box>
      {/* {loading ? (
        <Gridloader />
      ) : (
        <DisplayNFT lessons={lessons} displayPrice={true} />
      )} */}
    </Container>
  );
}
