import React, { useState } from 'react';
import { Button, TextField, ThemeProvider } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { createTheme } from '@material-ui/core/styles';

export default function Popup({
  open,
  handleClick,
  deposit,
  address,
  depositMoney,
  withdrawMoney,
}) {
  const [amount, setAmount] = useState('');
  const theme = createTheme({
    typography: {
      fontFamily: ['Righteous'].join(','),
    },
  });

  const handleMain = async () => {
    if (!amount || parseInt(amount) === 0) {
      handleClick();
    }
    if (deposit) {
      depositMoney(address, amount);
    } else {
      withdrawMoney(address, amount);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClick}
      PaperProps={{
        style: { borderRadius: '25px' },
      }}
    >
      <ThemeProvider theme={theme}>
        <DialogTitle sx={{ backgroundColor: '#1D1F23', color: '#F26A8D' }}>
          {deposit
            ? 'Deposit money into the pool'
            : 'Withdraw money from the pool'}
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: '#1D1F23' }}>
          <DialogContentText sx={{ color: '#fff' }}>
            {deposit
              ? `You are going to deposit money into the pool at ${address}`
              : `You are going to withdraw money from the pool at ${address}`}
          </DialogContentText>
          <TextField
            autoFocus
            id="amount"
            label="Amount"
            type="amount"
            fullWidth
            variant="standard"
            sx={{
              backgroundColor: '#F5F5F5',
              borderRadius: '10px',
              marginTop: '40px',
            }}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
            }}
          />
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#1D1F23', padding: '20px' }}>
          <Button
            onClick={handleClick}
            sx={{
              backgroundColor: '#F26A8D',
              color: '#F5F5F5',
              ':hover': {
                bgcolor: '#FEF7F0', // theme.palette.primary.main
                color: '#F26A8D',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleMain()}
            sx={{
              backgroundColor: '#F26A8D',
              color: '#F5F5F5',
              ':hover': {
                bgcolor: '#FEF7F0', // theme.palette.primary.main
                color: '#F26A8D',
              },
            }}
          >
            {deposit ? 'Deposit' : 'Withdraw'}
          </Button>
        </DialogActions>
      </ThemeProvider>
    </Dialog>
  );
}
