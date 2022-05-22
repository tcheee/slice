import { Typography, Box } from '@mui/material';
import { Grid as Gridtimer } from 'react-loader-spinner';

export default function Gridloader() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
        mt: '20vh',
      }}
    >
      <Gridtimer color="#F26A8D" height={200} width={200} radius={10} />
    </Box>
  );
}
