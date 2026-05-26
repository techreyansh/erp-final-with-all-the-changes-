/**
 * Stock Sheet Debugger Component
 * Helps debug stock sheet data structure and vendor details storage
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  Chip,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  BugReport as DebugIcon,
  Storage as StorageIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import sheetService from '../../services/sheetService';

const StockSheetDebugger = () => {
  const [debugResults, setDebugResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testItem, setTestItem] = useState({
    itemCode: 'DEBUG-001',
    itemName: 'Debug Test Item',
    category: 'Debug',
    currentStock: '10',
    unit: 'Pcs',
    location: 'Debug Location',
    vendorDetails: {
      vendorCode: 'VENDOR-DEBUG',
      vendorName: 'Debug Vendor Company',
      vendorContact: 'Debug Contact',
      vendorEmail: 'debug@vendor.com'
    }
  });

  const runDebugTest = async () => {
    setIsRunning(true);
    const results = [];

    try {
      // Step 1: Check current sheet headers
      results.push({ step: 'Checking sheet headers...', status: 'info' });
      
      const headers = await sheetService.getSheetHeaders('Stock');
      results.push({ 
        step: 'Sheet headers retrieved', 
        status: 'success',
        data: headers 
      });

      // Step 2: Check if vendorDetails column exists
      const hasVendorDetailsColumn = headers.includes('vendorDetails');
      results.push({
        step: 'Checking vendorDetails column...',
        status: hasVendorDetailsColumn ? 'success' : 'warning',
        data: `vendorDetails column exists: ${hasVendorDetailsColumn}`
      });

      // Step 3: Get current stock data
      results.push({ step: 'Fetching current stock data...', status: 'info' });
      
      const stockData = await sheetService.getSheetData('Stock');
      results.push({
        step: 'Stock data retrieved',
        status: 'success',
        data: `Found ${stockData.length} items`
      });

      // Step 4: Analyze existing vendor details
      if (stockData.length > 0) {
        results.push({ step: 'Analyzing existing vendor details...', status: 'info' });
        
        const vendorAnalysis = stockData.map((item, index) => ({
          index,
          itemCode: item.itemCode,
          itemName: item.itemName,
          vendorDetailsType: typeof item.vendorDetails,
          vendorDetailsValue: item.vendorDetails,
          vendorDetailsKeys: item.vendorDetails && typeof item.vendorDetails === 'object' 
            ? Object.keys(item.vendorDetails) 
            : 'N/A'
        }));

        results.push({
          step: 'Vendor details analysis complete',
          status: 'success',
          data: vendorAnalysis
        });
      }

      // Step 5: Test saving with vendor details
      results.push({ step: 'Testing save operation with vendor details...', status: 'info' });
      
      const testData = {
        ...testItem,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      await sheetService.appendRow('Stock', testData);
      results.push({
        step: 'Test item saved successfully',
        status: 'success',
        data: testData
      });

      // Step 6: Retrieve and verify the saved data
      results.push({ step: 'Retrieving saved test item...', status: 'info' });
      
      // Wait a moment for data to be available
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedStockData = await sheetService.getSheetData('Stock');
      const savedTestItem = updatedStockData.find(item => item.itemCode === testItem.itemCode);
      
      if (savedTestItem) {
        results.push({
          step: 'Test item retrieved successfully',
          status: 'success',
          data: savedTestItem
        });

        // Step 7: Verify vendor details preservation
        results.push({ step: 'Verifying vendor details preservation...', status: 'info' });
        
        const vendorVerification = {
          originalVendorDetails: testItem.vendorDetails,
          savedVendorDetails: savedTestItem.vendorDetails,
          vendorDetailsType: typeof savedTestItem.vendorDetails,
          vendorDetailsParsed: null,
          verificationResults: {}
        };

        // Try to parse vendor details
        if (typeof savedTestItem.vendorDetails === 'string') {
          try {
            vendorVerification.vendorDetailsParsed = JSON.parse(savedTestItem.vendorDetails);
          } catch (error) {
            results.push({
              step: `ERROR: Failed to parse vendor details - ${error.message}`,
              status: 'error'
            });
          }
        } else {
          vendorVerification.vendorDetailsParsed = savedTestItem.vendorDetails;
        }

        // Verify each vendor field
        if (vendorVerification.vendorDetailsParsed) {
          Object.keys(testItem.vendorDetails).forEach(key => {
            const expected = testItem.vendorDetails[key];
            const actual = vendorVerification.vendorDetailsParsed[key];
            vendorVerification.verificationResults[key] = {
              expected,
              actual,
              match: expected === actual
            };
          });
        }

        results.push({
          step: 'Vendor details verification complete',
          status: 'success',
          data: vendorVerification
        });
      } else {
        results.push({
          step: 'ERROR: Test item not found after saving',
          status: 'error'
        });
      }

      // Step 8: Cleanup test data
      results.push({ step: 'Cleaning up test data...', status: 'info' });
      
      if (savedTestItem) {
        const itemIndex = updatedStockData.findIndex(item => item.itemCode === testItem.itemCode);
        if (itemIndex !== -1) {
          await sheetService.deleteRow('Stock', itemIndex + 2);
          results.push({
            step: 'Test data cleaned up successfully',
            status: 'success'
          });
        }
      }

      // Summary
      const hasVendorDetailsIssues = results.some(r => 
        r.step.includes('ERROR') || 
        (r.data && r.data.verificationResults && 
         Object.values(r.data.verificationResults).some(v => !v.match))
      );

      results.push({
        step: hasVendorDetailsIssues 
          ? '❌ VENDOR DETAILS ISSUES DETECTED - See details above'
          : '✅ VENDOR DETAILS WORKING CORRECTLY',
        status: hasVendorDetailsIssues ? 'error' : 'success'
      });

    } catch (error) {
      results.push({
        step: `ERROR: ${error.message}`,
        status: 'error'
      });
    } finally {
      setIsRunning(false);
      setDebugResults(results);
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

  const renderDebugData = (data) => {
    if (!data) return null;

    if (Array.isArray(data)) {
      return (
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Index</TableCell>
                <TableCell>Item Code</TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell>Vendor Details Type</TableCell>
                <TableCell>Vendor Details Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.index}</TableCell>
                  <TableCell>{item.itemCode}</TableCell>
                  <TableCell>{item.itemName}</TableCell>
                  <TableCell>
                    <Chip 
                      label={item.vendorDetailsType} 
                      color={item.vendorDetailsType === 'object' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {JSON.stringify(item.vendorDetailsValue)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    if (typeof data === 'object') {
      return (
        <Box sx={{ mt: 1, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </Box>
      );
    }

    return (
      <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace' }}>
        {String(data)}
      </Typography>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <DebugIcon color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Stock Sheet Vendor Details Debugger
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Debug vendor details storage and retrieval issues
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Test Configuration
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Item Code"
                value={testItem.itemCode}
                onChange={(e) => setTestItem(prev => ({ ...prev, itemCode: e.target.value }))}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Item Name"
                value={testItem.itemName}
                onChange={(e) => setTestItem(prev => ({ ...prev, itemName: e.target.value }))}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Vendor Code"
                value={testItem.vendorDetails.vendorCode}
                onChange={(e) => setTestItem(prev => ({ 
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
                value={testItem.vendorDetails.vendorName}
                onChange={(e) => setTestItem(prev => ({ 
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
                value={testItem.vendorDetails.vendorContact}
                onChange={(e) => setTestItem(prev => ({ 
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
                value={testItem.vendorDetails.vendorEmail}
                onChange={(e) => setTestItem(prev => ({ 
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
              startIcon={<DebugIcon />}
              onClick={runDebugTest}
              disabled={isRunning}
              size="large"
            >
              {isRunning ? 'Running Debug Test...' : 'Run Debug Test'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {debugResults && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Debug Results
            </Typography>
            
            <Stack spacing={2}>
              {debugResults.map((result, index) => (
                <Accordion key={index}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {getStatusIcon(result.status)}
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {result.step}
                      </Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    {result.data && renderDebugData(result.data)}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default StockSheetDebugger;
