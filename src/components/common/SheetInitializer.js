import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Alert, Paper, LinearProgress, List, ListItem, ListItemIcon, ListItemText, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { Check, Error, Refresh, Add } from '@mui/icons-material';
import config from '../../config/config';
import * as db from '../../lib/db';

const SheetInitializer = () => {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [results, setResults] = useState({});
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState(null);

  // Sheet definitions with their headers
  const sheetDefinitions = {
    [config.sheets.poMaster]: [
      'POId', 'Name', 'ClientCode', 'OrderType', 'ProductCode', 'Description', 
      'Quantity', 'BatchSize', 'Price', 'Status', 'CreatedAt', 'UpdatedAt', 'CreatedBy', 
      'AssignedTo', 'DueDate', 'PODocumentId'
    ],
    [config.sheets.bomTemplates]: [
      'TemplateId', 'ProductCode', 'BOMType', 'Description', 'Materials', 'CreatedAt'
    ],
    [config.sheets.inventory]: [
      'MaterialId', 'Name', 'Category', 'UnitOfMeasure', 'QuantityAvailable',
      'ReorderLevel', 'LastUpdated'
    ],
    [config.sheets.users]: [
      'UserId', 'Name', 'Email', 'Role', 'Department', 'LastLogin'
    ],
    [config.sheets.auditLog]: [
      'LogId', 'POId', 'PreviousStatus', 'NewStatus', 'UserId', 'Timestamp'
    ],
    [config.sheets.metrics]: [
      'MetricId', 'MetricName', 'MetricValue', 'DateRecorded', 'Category'
    ],
    // Add CLIENT sheet definition
    CLIENT: [
      'ClientCode', 'ClientName', 'Address', 'Contacts', 'Products', 'CreatedAt', 'UpdatedAt'
    ],
    // Add PRODUCT sheet definition
    PRODUCT: [
      'ProductCode', 'ProductName', 'Description', 'AssemblyLineManpower', 'CableCuttingManpower', 'MoldingMachineManpower', 'PackingLineManpower', 'SingleShiftTarget', 'BasePrice',
      'Drawing', 'FPA', 'PDI', 'ProcessChecksheet', 'PackagingStandard', 'BOM', 'SOP', 'PFC',
      'CreatedAt', 'UpdatedAt'
    ],
    Vendor: [
      'SKU Code',
      'SKU Description',
      'Category',
      'UOM',
      'Vendor Name',
      'Alternate Vendors',
      'Vendor Code',
      'Vendor Contact',
      'Vendor Email',
      'MOQ',
      'Lead Time (Days)',
      'Last Purchase Rate (b9)',
      'Rate Validity',
      'Payment Terms',
      'Remarks',
    ],
    PlacePO: [
      'POId',
      'IndentNumber',
      'ItemName',
      'Specifications',
      'VendorCode',
      'Price',
      'DeliveryTime',
      'Terms',
      'LeadTime',
      'VendorName',
      'VendorContact',
      'VendorEmail',
      'PlacedAt',
      'PODocumentId',
    ],
  };

  const initializeSheet = async (sheetName, headers) => {
    try {
      const tableName = db.getTableName(sheetName);
      const data = await db.getTableRows(tableName);
      if (data.length === 0 && headers?.length) {
        const headerRow = Object.fromEntries(headers.map((h) => [h, '']));
        await db.insertTableRow(tableName, headerRow);
        return { status: 'created', message: `Initialized ${sheetName}` };
      }
      const existingKeys = data[0] ? Object.keys(data[0]).filter((k) => k !== 'id') : [];
      const missingHeaders = headers.filter((h) => !existingKeys.includes(h));
      if (missingHeaders.length > 0) {
        return { status: 'warning', message: `Sheet ${sheetName} exists but is missing columns: ${missingHeaders.join(', ')}` };
      }
      return { status: 'exists', message: `Sheet ${sheetName} already exists` };
    } catch (error) {
      return { status: 'error', message: `Error: ${error.message}` };
    }
  };

  // Initialize all defined sheets
  const initializeAllSheets = async () => {
    setStatus('loading');
    setResults({});
    setError(null);
    
    try {
      const results = {};
      
      for (const [sheetName, headers] of Object.entries(sheetDefinitions)) {
        const result = await initializeSheet(sheetName, headers);
        results[sheetName] = result;
      }
      
      setResults(results);
      setStatus('success');
    } catch (error) {
      setError(error.message || 'Failed to initialize sheets');
      setStatus('error');
    }
  };

  // Run initialization on component mount
  useEffect(() => {
    initializeAllSheets();
  }, []);

  // Get icon based on status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'exists':
      case 'created':
        return <Check color="success" />;
      case 'warning':
        return <Refresh color="warning" />;
      case 'error':
        return <Error color="error" />;
      default:
        return null;
    }
  };

  // Function to attempt to create a sheet
  const attemptCreateSheet = async (sheetName) => {
    setSelectedSheet(sheetName);
    setOpenDialog(true);
  };

  const createSheet = async () => {
    try {
      const tableName = db.getTableName(selectedSheet);
      const headers = sheetDefinitions[selectedSheet] || [];
      const headerRow = headers.length ? Object.fromEntries(headers.map((h) => [h, ''])) : {};
      if (Object.keys(headerRow).length) await db.insertTableRow(tableName, headerRow);
      await initializeAllSheets();
      setOpenDialog(false);
    } catch (error) {
      console.error(`Error creating table ${selectedSheet}:`, error);
      setError(error.message || 'Failed to create table');
      setOpenDialog(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Database structure initializer
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Tables are managed by Supabase migrations. This page verifies that tables exist and are accessible.
      </Alert>

      {status === 'loading' && (
        <>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Checking and initializing data tables...
          </Typography>
          <LinearProgress sx={{ mb: 2 }} />
        </>
      )}
      
      {status === 'error' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {status === 'success' && Object.keys(results).length > 0 && (
        <List>
          {Object.entries(results).map(([sheetName, result]) => (
            <ListItem key={sheetName}>
              <ListItemIcon>
                {getStatusIcon(result.status)}
              </ListItemIcon>
              <ListItemText 
                primary={sheetName} 
                secondary={result.message}
                secondaryTypographyProps={{
                  color: result.status === 'error' ? 'error' : 'textSecondary'
                }}
              />
              {result.status === 'error' && result.message.includes('doesn\'t exist') && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<Add />}
                  onClick={() => attemptCreateSheet(sheetName)}
                >
                  Create
                </Button>
              )}
            </ListItem>
          ))}
        </List>
      )}
      
      <Box sx={{ mt: 2 }}>
        <Button 
          variant="contained" 
          onClick={initializeAllSheets} 
          disabled={status === 'loading'}
          startIcon={<Refresh />}
        >
          {status === 'loading' ? 'Checking...' : 'Refresh'}
        </Button>
        
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          This tool checks that required data tables exist and have the correct columns.
          Use the button above to create any missing tables.
        </Typography>
      </Box>
      
      {/* Dialog for sheet creation confirmation */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>Create table</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Create the table &quot;{selectedSheet}&quot; and add column headers?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={createSheet} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default SheetInitializer; 