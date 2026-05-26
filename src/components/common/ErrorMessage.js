import React from 'react';
import { Box, Alert, AlertTitle, Button } from '@mui/material';

const ErrorMessage = ({ error, retry }) => {
  const errorMessage = error?.message || 'An unknown error occurred';
  
  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', my: 3 }}>
      <Alert severity="error" variant="filled">
        <AlertTitle>Error</AlertTitle>
        {errorMessage}
        {retry && (
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="contained" 
              color="error" 
              onClick={retry}
              size="small"
            >
              Try Again
            </Button>
          </Box>
        )}
      </Alert>
    </Box>
  );
};

export default ErrorMessage; 