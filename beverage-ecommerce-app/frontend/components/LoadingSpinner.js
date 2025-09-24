import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export default function LoadingSpinner({ size = 40, message }) {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="200px">
      <CircularProgress size={size} />
      {message && <Box mt={2}>{message}</Box>}
    </Box>
  );
}
