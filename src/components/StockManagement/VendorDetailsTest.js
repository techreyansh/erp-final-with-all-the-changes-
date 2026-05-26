/**
 * Vendor Details Test Component
 * Tests the storage and retrieval of vendor details in stock management
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Alert,
  Chip,
  Stack,
  Divider,
  Paper
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Business as VendorIcon
} from '@mui/icons-material';
import sheetService from '../../services/sheetService';

const VendorDetailsTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testData, setTestData] = useState({
    itemCode: 'TEST-VENDOR-001',
    itemName: 'Test Item with Vendor',
    category: 'Test Category',
    currentStock: '10',
    unit: 'Pcs',
    location: 'Test Location',
    vendorDetails: {
      vendorCode: 'VENDOR-001',
      vendorName: 'Test Vendor Company',
      vendorContact: 'John Doe',
      vendorEmail: 'john@testvendor.com'
    }
  });

  const runVendorDetailsTest = async () => {
    setIsRunning(true);
    const results = [];

    try {
      // Test 1: Save item with vendor details
      results.push({ step: 'Saving item with vendor details...', status: 'info' });
      
      const dataToSave = {
        itemCode: testData.itemCode,
        itemName: testData.itemName,
        category: testData.category,
        currentStock: testData.currentStock,
        unit: testData.unit,
        location: testData.location,
        vendorDetails: testData.vendorDetails, // Pass object directly
        lastUpdated: new Date().toISOString().split("T")[0],
      };
      await sheetService.appendRow('Stock', dataToSave);
      results.push({ step: 'Item saved successfully', status: 'success' });

      // Test 2: Retrieve item and verify vendor details
      results.push({ step: 'Retrieving saved item...', status: 'info' });
      
      // Wait a moment for the data to be available
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const stockData = await sheetService.getSheetData('Stock');
      const savedItem = stockData.find(item => item.itemCode === testData.itemCode);
      
      if (!savedItem) {
        results.push({ step: 'ERROR: Item not found after saving', status: 'error' });
        throw new Error('Item not found after saving');
      }
      
      results.push({ step: 'Item retrieved successfully', status: 'success' });
      
      // Test 3: Parse vendor details
      results.push({ step: 'Parsing vendor details...', status: 'info' });
      
      let parsedVendorDetails;
      try {
        if (typeof savedItem.vendorDetails === 'string') {
          parsedVendorDetails = JSON.parse(savedItem.vendorDetails);
        } else {
          parsedVendorDetails = savedItem.vendorDetails;
        }
      } catch (error) {
        results.push({ step: `ERROR: Failed to parse vendor details - ${error.message}`, status: 'error' });
        throw error;
      }
      
      results.push({ step: 'Vendor details parsed successfully', status: 'success' });
      
      // Test 4: Verify vendor details content
      results.push({ step: 'Verifying vendor details content...', status: 'info' });
      
      const expectedVendorDetails = testData.vendorDetails;
      const verificationResults = [];
      
      Object.keys(expectedVendorDetails).forEach(key => {
        const expected = expectedVendorDetails[key];
        const actual = parsedVendorDetails[key];
        
        if (expected === actual) {
          verificationResults.push({ field: key, status: 'success', message: `✓ ${key}: "${actual}"` });
        } else {
          verificationResults.push({ field: key, status: 'error', message: `✗ ${key}: Expected "${expected}", got "${actual}"` });
        }
      });
      
      results.push({ step: 'Vendor details verification complete', status: 'success' });
      
      // Test 5: Display verification results
      results.push({ step: 'Verification Results:', status: 'info' });
      results.push(...verificationResults);
      
      // Test 6: Cleanup - Remove test item
      results.push({ step: 'Cleaning up test data...', status: 'info' });
      
      const itemIndex = stockData.findIndex(item => item.itemCode === testData.itemCode);
      if (itemIndex !== -1) {
        await sheetService.deleteRow('Stock', itemIndex + 2); // +2 because of header row and 0-based index
        results.push({ step: 'Test data cleaned up successfully', status: 'success' });
      } else {
        results.push({ step: 'WARNING: Test item not found for cleanup', status: 'warning' });
      }
      
      // Summary
      const successCount = verificationResults.filter(r => r.status === 'success').length;
      const errorCount = verificationResults.filter(r => r.status === 'error').length;
      
      if (errorCount === 0) {
        results.push({ step: `🎉 ALL TESTS PASSED! (${successCount}/${verificationResults.length} fields verified)`, status: 'success' });
      } else {
        results.push({ step: `❌ TESTS FAILED! (${successCount}/${verificationResults.length} fields verified, ${errorCount} errors)`, status: 'error' });
      }
      
    } catch (error) {
      results.push({ step: `ERROR: ${error.message}`, status: 'error' });
    } finally {
      setIsRunning(false);
      setTestResults(results);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckIcon color="success" fontSize="small" />;
      case 'error':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'warning':
        return <ErrorIcon color="warning" fontSize="small" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <VendorIcon color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Vendor Details Storage Test
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tests the storage and retrieval of vendor details in the stock management system
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Test Data
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Item Code"
                value={testData.itemCode}
                onChange={(e) => setTestData(prev => ({ ...prev, itemCode: e.target.value }))}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Item Name"
                value={testData.itemName}
                onChange={(e) => setTestData(prev => ({ ...prev, itemName: e.target.value }))}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Vendor Code"
                value={testData.vendorDetails.vendorCode}
                onChange={(e) => setTestData(prev => ({ 
                  ...prev, 
                  vendorDetails: { ...prev.vendorDetails, vendorCode: e.target.value }
                }))}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Vendor Name"
                value={testData.vendorDetails.vendorName}
                onChange={(e) => setTestData(prev => ({ 
                  ...prev, 
                  vendorDetails: { ...prev.vendorDetails, vendorName: e.target.value }
                }))}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Vendor Contact"
                value={testData.vendorDetails.vendorContact}
                onChange={(e) => setTestData(prev => ({ 
                  ...prev, 
                  vendorDetails: { ...prev.vendorDetails, vendorContact: e.target.value }
                }))}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Vendor Email"
                value={testData.vendorDetails.vendorEmail}
                onChange={(e) => setTestData(prev => ({ 
                  ...prev, 
                  vendorDetails: { ...prev.vendorDetails, vendorEmail: e.target.value }
                }))}
                variant="outlined"
                size="small"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={runVendorDetailsTest}
              disabled={isRunning}
              size="large"
            >
              {isRunning ? 'Running Test...' : 'Run Vendor Details Test'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Test Results
            </Typography>
            
            <Stack spacing={1}>
              {testResults.map((result, index) => (
                <Box key={index}>
                  {result.field ? (
                    // Verification result
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        backgroundColor: result.status === 'success' ? 'success.light' : 'error.light',
                        opacity: 0.9
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {getStatusIcon(result.status)}
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {result.message}
                        </Typography>
                      </Stack>
                    </Paper>
                  ) : (
                    // Step result
                    <Alert 
                      severity={getStatusColor(result.status)} 
                      icon={getStatusIcon(result.status)}
                      sx={{ '& .MuiAlert-message': { width: '100%' } }}
                    >
                      <Typography variant="body2">
                        {result.step}
                      </Typography>
                    </Alert>
                  )}
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default VendorDetailsTest;
