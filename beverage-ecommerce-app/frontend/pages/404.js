import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/router';

export default function Custom404() {
  const router = useRouter();
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
      <Typography variant="h2" color="primary" gutterBottom>
        404
      </Typography>
      <Typography variant="h5" gutterBottom>
        Oops! Page not found.
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        The page you are looking for does not exist or has been moved.
      </Typography>
      <Button variant="contained" color="primary" onClick={() => router.push('/')}
        sx={{ mt: 2 }}>
        Go to Homepage
      </Button>
    </Box>
  );
}
