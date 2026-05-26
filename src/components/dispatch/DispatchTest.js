import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, CircularProgress, Container } from '@mui/material';
import * as db from '../../lib/db';
import config from '../../config/config';

const DispatchTest = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const testSheetConnection = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Try config sheet name first
      const tableName = db.getTableName(config.sheets.dispatches) || db.getTableName('Dispatches') || 'dispatches';
      const dispatchData = await db.getTableRows(tableName);
      setData(dispatchData);
    } catch (err) {
      console.error('Sheet connection test failed:', err);
      setError(err.message || 'Failed to connect to sheet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testSheetConnection();
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dispatch Sheet Connection Test
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={testSheetConnection}
          disabled={loading}
          sx={{ mr: 2 }}
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography>Testing sheet connection...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Connection Failed</Typography>
          <Typography>{error}</Typography>
        </Alert>
      )}

      {data && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="h6">Connection Successful!</Typography>
          <Typography>Found {data.length} dispatch records</Typography>
        </Alert>
      )}

      {data && data.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Sample Data (First 3 Records):
          </Typography>
          <Box sx={{ 
            backgroundColor: '#f5f5f5', 
            p: 2, 
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            overflow: 'auto'
          }}>
            <pre>{JSON.stringify(data.slice(0, 3), null, 2)}</pre>
          </Box>
        </Box>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Configuration Details:
        </Typography>
        <Box sx={{ 
          backgroundColor: '#f0f0f0', 
          p: 2, 
          borderRadius: 1,
          fontFamily: 'monospace',
          fontSize: '0.875rem'
        }}>
          <div>Backend: Supabase</div>
          <div>Config Sheet Name: "{config.sheets.dispatches}"</div>
          <div>Direct Sheet Name: "Dispatches"</div>
          <div>Use Local Storage: {config.useLocalStorage ? 'Yes' : 'No'}</div>
        </Box>
      </Box>
    </Container>
  );
};

export default DispatchTest;
