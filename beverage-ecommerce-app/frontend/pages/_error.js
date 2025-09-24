import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/router';

export default function Error({ statusCode }) {
  const router = useRouter();
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
      <Typography variant="h2" color="error" gutterBottom>
        {statusCode || 'Error'}
      </Typography>
      <Typography variant="h5" gutterBottom>
        Something went wrong.
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        An unexpected error has occurred. Please try again later.
      </Typography>
      <Button variant="contained" color="primary" onClick={() => router.push('/')}
        sx={{ mt: 2 }}>
        Go to Homepage
      </Button>
    </Box>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
