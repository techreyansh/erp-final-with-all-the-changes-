import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  useTheme,
  alpha
} from '@mui/material';
import {
  Save as SaveIcon,
  Send as SendIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import BaseStepComponent from './BaseStepComponent';
import { useStepStatus } from '../../../context/StepStatusContext';
import sheetService from '../../../services/sheetService';
import config from '../../../config/config';
import { useAuth } from '../../../context/AuthContext';
import purchaseFlowService from '../../../services/purchaseFlowService';

/** Price may be a string from inputs or a number from JSON — never call .trim() on it directly. */
function comparativeVendorPriceFilled(vendorData) {
  if (!vendorData) return false;
  const p = vendorData.price;
  if (p == null || p === '') return false;
  return String(p).trim() !== '';
}

const ComparativeStatement = ({ onComplete }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const { stepStatuses, setStepStatuses } = useStepStatus();
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFlowId, setCurrentFlowId] = useState(null);
  const [indents, setIndents] = useState([]);
  const [selectedIndent, setSelectedIndent] = useState(null);
  const [comparativeData, setComparativeData] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  // Add state to track completion status for each indent
  const [indentCompletionStatus, setIndentCompletionStatus] = useState({});
  // Add state to track saved status for each item
  const [savedItems, setSavedItems] = useState({});
  // Update state to track saved status per vendor per item
  const [savedVendors, setSavedVendors] = useState({});

  // Check if comparative statement is prepared for an indent (optionally pass data snapshot, e.g. after save merge)
  const isComparativePrepared = (indent, dataSource) => {
    const data = dataSource ?? comparativeData;
    if (!indent || !indent.Items || indent.Items.length === 0) return false;

    let itemsArray = indent.Items;
    if (typeof indent.Items === 'string') {
      try {
        itemsArray = JSON.parse(indent.Items);
      } catch (e) {
        return false;
      }
    }
    if (itemsArray && !Array.isArray(itemsArray) && typeof itemsArray === 'object') {
      itemsArray = Object.values(itemsArray);
    }
    if (!Array.isArray(itemsArray) || itemsArray.length === 0) return false;

    for (const item of itemsArray) {
      if (!item.vendors || item.vendors.length === 0) return false;

      const itemCode = item.itemCode ?? item.ItemCode;
      const itemData = data[itemCode];
      if (!itemData) return false;

      for (const vendor of item.vendors) {
        const vCode = vendor.vendorCode ?? vendor.VendorCode;
        const vendorData = itemData[vCode];
        if (!comparativeVendorPriceFilled(vendorData)) return false;
      }
    }
    return true;
  };

  // Optional legacy sheet preload (does not drive list loading — avoids racing fetchIndents / isLoading)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const flowData = await sheetService.getSheetData(config.sheets.purchaseFlow);
        const activeFlow = flowData.find((flow) => flow.Status === 'In Progress');
        if (activeFlow) {
          setCurrentFlowId(activeFlow.FlowId);
        }

        const existingData = await sheetService.getSheetData(config.sheets.purchaseFlowSteps);
        const currentStep = existingData.find(
          (record) => record.FlowId === activeFlow?.FlowId && String(record.StepId) === '5'
        );

        if (currentStep?.Items) {
          try {
            const savedItems =
              typeof currentStep.Items === 'string'
                ? JSON.parse(currentStep.Items)
                : currentStep.Items;
            if (Array.isArray(savedItems)) setItems(savedItems);
          } catch (e) {
            console.error('Error parsing saved items:', e);
          }
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    async function fetchIndents() {
      try {
        setIsLoading(true);
        const data = await purchaseFlowService.getIndentsForComparativeStatement();
        setIndents(data);
        
        // Initialize completion status for all indents
        const status = {};
        data.forEach(indent => {
          status[indent.IndentNumber] = isComparativePrepared(indent);
        });
        setIndentCompletionStatus(status);
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setIsLoading(false);
      }
    }
    fetchIndents();
  }, []);

  // Update completion status when comparative data changes
  useEffect(() => {
    if (indents.length > 0 && Object.keys(comparativeData).length > 0) {
      const status = {};
      indents.forEach(indent => {
        status[indent.IndentNumber] = isComparativePrepared(indent);
      });
      setIndentCompletionStatus(prev => {
        // Only update if there are actual changes
        const hasChanges = Object.keys(status).some(key => prev[key] !== status[key]);
        return hasChanges ? status : prev;
      });
    }
  }, [comparativeData]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        name: '',
        specifications: '',
        quantity: '',
        unit: '',
        prices: vendors.reduce((acc, vendor) => ({
          ...acc,
          [vendor.id]: ''
        }), {})
      }
    ]);
  };

  const handleAddVendor = () => {
    const newVendor = {
      id: Date.now(),
      name: '',
      contact: '',
      deliveryTime: ''
    };
    setVendors([...vendors, newVendor]);
    // Add price field for new vendor to all items
    setItems(items.map(item => ({
      ...item,
      prices: {
        ...item.prices,
        [newVendor.id]: ''
      }
    })));
  };

  const handleItemChange = (itemId, field, value) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handlePriceChange = (itemId, vendorId, value) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          prices: {
            ...item.prices,
            [vendorId]: value
          }
        };
      }
      return item;
    }));
  };

  const handleVendorChange = (vendorId, field, value) => {
    setVendors(vendors.map(vendor => {
      if (vendor.id === vendorId) {
        return { ...vendor, [field]: value };
      }
      return vendor;
    }));
  };

  const handleRemoveItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleRemoveVendor = (vendorId) => {
    setVendors(vendors.filter(vendor => vendor.id !== vendorId));
    // Remove vendor's prices from all items
    setItems(items.map(item => {
      const { [vendorId]: removed, ...remainingPrices } = item.prices;
      return { ...item, prices: remainingPrices };
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      if (!currentFlowId) {
        console.error('No current flow ID found');
        throw new Error('No active flow found');
      }
      // Save comparative statement data
      const stepData = {
        StepId: '5',
        FlowId: currentFlowId,
        StepNumber: '5',
        Role: 'Purchase Executive',
        Action: 'Prepare Comparative Statement',
        Status: 'in_progress',
        AssignedTo: user?.email || 'Purchase Executive',
        StartTime: new Date().toISOString(),
        EndTime: '',
        TAT: '1 day',
        TATStatus: 'On Time',
        Documents: JSON.stringify(items),
        Comments: 'Draft saved',
        ApprovalStatus: 'Pending',
        RejectionReason: '',
        NextStep: '6',
        PreviousStep: '4',
        Dependencies: '4',
        LastModifiedBy: user?.email || 'Purchase Executive',
        LastModifiedAt: new Date().toISOString()
      };
      try {
        // Get existing data first
        const existingData = await sheetService.getSheetData(config.sheets.purchaseFlowSteps);
        // Find the current step record
        const currentStep = existingData.find(record => 
          record.FlowId === currentFlowId && record.StepId === '5'
        );
        if (currentStep) {
          // Update existing record
          const rowIndex = existingData.indexOf(currentStep) + 2; // +2 for header row
          try {
            const updateResult = await sheetService.updateRow(
              config.sheets.purchaseFlowSteps,
              rowIndex,
              stepData
            );
          } catch (updateError) {
            console.error('Error updating row:', updateError);
            throw new Error(`Failed to update row: ${updateError.message}`);
          }
        } else {
          // Append new record
          try {
            const appendResult = await sheetService.appendRow(
              config.sheets.purchaseFlowSteps,
              stepData
            );
          } catch (appendError) {
            console.error('Error appending row:', appendError);
            throw new Error(`Failed to append row: ${appendError.message}`);
          }
        }
      } catch (sheetError) {
        console.error('Error accessing sheet:', sheetError);
        throw new Error(`Failed to access sheet: ${sheetError.message}`);
      }

      setSnackbar({ open: true, message: 'Draft saved successfully', severity: 'success' });
    } catch (err) {
      console.error('Error saving draft:', err);
      setError(`Failed to save draft: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    try {
      setIsSaving(true);
      setError(null);

      if (!currentFlowId) {
        console.error('No current flow ID found');
        throw new Error('No active flow found');
      }
      // First save the comparative statement data
      await handleSave();

      try {
        // Get existing data first
        const existingData = await sheetService.getSheetData(config.sheets.purchaseFlowSteps);
        // Find the current step record
        const currentStep = existingData.find(record => 
          record.FlowId === currentFlowId && record.StepId === '5'
        );
        if (!currentStep) {
          // If step doesn't exist, create it first
          const stepData = {
            StepId: '5',
            FlowId: currentFlowId,
            StepNumber: '5',
            Role: 'Purchase Executive',
            Action: 'Prepare Comparative Statement',
            Status: 'completed',
            AssignedTo: user?.email || 'Purchase Executive',
            StartTime: new Date().toISOString(),
            EndTime: new Date().toISOString(),
            TAT: '1 day',
            TATStatus: 'On Time',
            Documents: JSON.stringify(items),
            Comments: 'Comparative statement prepared and completed',
            ApprovalStatus: 'Approved',
            RejectionReason: '',
            NextStep: '6',
            PreviousStep: '4',
            Dependencies: '4',
            LastModifiedBy: user?.email || 'Purchase Executive',
            LastModifiedAt: new Date().toISOString()
          };
          try {
            const appendResult = await sheetService.appendRow(
              config.sheets.purchaseFlowSteps,
              stepData
            );
          } catch (appendError) {
            console.error('Error appending row:', appendError);
            throw new Error(`Failed to append row: ${appendError.message}`);
          }
        } else {
          // Update existing step
          const stepData = {
            ...currentStep,
            Status: 'completed',
            EndTime: new Date().toISOString(),
            Documents: JSON.stringify(items),
            Comments: 'Comparative statement prepared and completed',
            ApprovalStatus: 'Approved',
            LastModifiedBy: user?.email || 'Purchase Executive',
            LastModifiedAt: new Date().toISOString()
          };

          const rowIndex = existingData.indexOf(currentStep) + 2; // +2 for header row
          try {
            const updateResult = await sheetService.updateRow(
              config.sheets.purchaseFlowSteps,
              rowIndex,
              stepData
            );
          } catch (updateError) {
            console.error('Error updating row:', updateError);
            throw new Error(`Failed to update row: ${updateError.message}`);
          }
        }

        // Update local state
        setStepStatuses(prev => ({
          ...prev,
          5: 'completed'
        }));

        setSnackbar({ open: true, message: 'Step completed successfully', severity: 'success' });
        if (onComplete) onComplete();
      } catch (sheetError) {
        console.error('Error accessing sheet:', sheetError);
        throw new Error(`Failed to access sheet: ${sheetError.message}`);
      }
    } catch (err) {
      console.error('Error completing step:', err);
      setSnackbar({ open: true, message: 'Error completing step', severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Update handleComparativeChange to work with itemCode structure
  const handleComparativeChange = (itemCode, vendorCode, field, value) => {
    setComparativeData(prev => ({
      ...prev,
      [itemCode]: {
        ...prev[itemCode],
        [vendorCode]: {
          ...prev[itemCode]?.[vendorCode],
          [field]: value
        }
      }
    }));
    
    // Update completion status for the current indent
    if (selectedIndent) {
      const updatedData = {
        ...comparativeData,
        [itemCode]: {
          ...comparativeData[itemCode],
          [vendorCode]: {
            ...comparativeData[itemCode]?.[vendorCode],
            [field]: value
          }
        }
      };
      
      const isComplete = checkIndentCompletionWithData(selectedIndent, updatedData);
      setIndentCompletionStatus(prev => ({
        ...prev,
        [selectedIndent.IndentNumber]: isComplete
      }));
    }
  };

  // Update checkIndentCompletion to work with itemCode structure
  const checkIndentCompletion = (indent) => {
    if (!indent.Items || indent.Items.length === 0) return false;

    for (const item of indent.Items) {
      if (!item.vendors || item.vendors.length === 0) return false;

      const itemCode = item.itemCode ?? item.ItemCode;
      const itemData = comparativeData[itemCode];
      if (!itemData) return false;
      
      for (const vendor of item.vendors) {
        const vCode = vendor.vendorCode ?? vendor.VendorCode;
        const vendorData = itemData[vCode];
        if (!comparativeVendorPriceFilled(vendorData)) return false;
      }
    }
    return true;
  };

  // Update checkIndentCompletionWithData to work with itemCode structure
  const checkIndentCompletionWithData = (indent, data) => {
    if (!indent.Items || indent.Items.length === 0) return false;

    for (const item of indent.Items) {
      if (!item.vendors || item.vendors.length === 0) return false;

      const itemCode = item.itemCode ?? item.ItemCode;
      const itemData = data[itemCode];
      if (!itemData) return false;

      for (const vendor of item.vendors) {
        const vCode = vendor.vendorCode ?? vendor.VendorCode;
        const vendorData = itemData[vCode];
        if (!comparativeVendorPriceFilled(vendorData)) return false;
      }
    }
    return true;
  };

  // Update handleCompleteIndentStep to clear saved status for completed indent
  const handleCompleteIndentStep = async (indentNumber) => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Get the indent
      const indent = indents.find(i => i.IndentNumber === indentNumber);
      
      // Validate that comparative statement is prepared
      if (!isComparativePrepared(indent)) {
        setSnackbar({ 
          open: true, 
          message: 'Cannot complete step: Please prepare comparative statement for all items with prices before completing', 
          severity: 'warning' 
        });
        setIsSaving(false);
        return;
      }
      
      // Get comparative data for this indent (already in correct structure)
      const indentComparativeData = {};
      
      if (indent && indent.Items) {
        // Handle case where Items might be a JSON string or an object
        let itemsArray = indent.Items;
        if (typeof indent.Items === 'string') {
          try {
            itemsArray = JSON.parse(indent.Items);
          } catch (e) {
            itemsArray = [];
          }
        }
        if (itemsArray && !Array.isArray(itemsArray) && typeof itemsArray === 'object') {
          itemsArray = Object.values(itemsArray);
        }
        
        for (const item of itemsArray) {
          const ic = item.itemCode ?? item.ItemCode;
          const itemData = comparativeData[ic];
          if (itemData) {
            indentComparativeData[ic] = itemData;
          }
        }
      }
      
      // Save comparative statement
      await purchaseFlowService.saveComparativeStatement({
        indentNumber: indentNumber,
        comparativeData: indentComparativeData,
        userEmail: user?.email || 'system',
      });
      
      // Complete the step (updates PurchaseFlow and PurchaseFlowSteps so next steps can see this indent)
      await purchaseFlowService.completeComparativeStatementStep({
        indentNumber: indentNumber,
        userEmail: user?.email || 'system',
      });
      
      setSnackbar({ open: true, message: `Comparative statement completed for indent ${indentNumber}!`, severity: 'success' });
      
      // Refresh indents
      const data = await purchaseFlowService.getIndentsForComparativeStatement();
      setIndents(data);
      
      // Clear completion status and saved status for this indent
      setIndentCompletionStatus(prev => {
        const updated = { ...prev };
        delete updated[indentNumber];
        return updated;
      });
      
      setSavedVendors(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (key.startsWith(`${indentNumber}_`)) {
            delete updated[key];
          }
        });
        return updated;
      });
      
    } catch (err) {
      setError(err.message || String(err));
      setSnackbar({ open: true, message: 'Error completing step: ' + (err.message || String(err)), severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Update handlePrepareComparative to load existing data for saved vendors
  const handlePrepareComparative = async (indent, item) => {
    setSelectedIndent({ ...indent, selectedItem: item });
    setDialogOpen(true);
    
    // Always load existing data for the entire indent
    try {
      const existingData = await purchaseFlowService.getComparativeStatementForIndent(indent.IndentNumber);
      if (existingData && Object.keys(existingData).length > 0) {
        setComparativeData(existingData);
      } else {
        setComparativeData({});
      }
    } catch (err) {
      console.error('Error loading existing comparative data:', err);
      setComparativeData({});
    }
    
    // Initialize completion status for this indent
    const isComplete = checkIndentCompletion(indent);
    setIndentCompletionStatus(prev => ({
      ...prev,
      [indent.IndentNumber]: isComplete
    }));
  };

  // Update handleSaveComparative to mark specific vendor as saved
  const handleSaveComparative = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Get existing comparative data for this indent
      let existingData = {};
      try {
        existingData = await purchaseFlowService.getComparativeStatementForIndent(selectedIndent.IndentNumber);
      } catch (err) {
        existingData = {};
      }
      
      // Deep-merge per item so other items/vendors from DB are not dropped
      const mergedData = { ...existingData };
      for (const ic of Object.keys(comparativeData || {})) {
        mergedData[ic] = {
          ...(existingData[ic] || {}),
          ...(comparativeData[ic] || {}),
        };
      }

      await purchaseFlowService.saveComparativeStatement({
        indentNumber: selectedIndent.IndentNumber,
        comparativeData: mergedData,
        userEmail: user?.email || 'system',
      });

      setComparativeData(mergedData);

      const itemCode = selectedIndent.selectedItem.itemCode ?? selectedIndent.selectedItem.ItemCode;
      const savedKey = `${selectedIndent.IndentNumber}_${itemCode}`;
      const currentSavedVendors = savedVendors[savedKey] || {};
      const updatedSavedVendors = { ...currentSavedVendors };
      selectedIndent.selectedItem.vendors.forEach((vendor) => {
        const vCode = vendor.vendorCode ?? vendor.VendorCode;
        const vendorData = mergedData[itemCode]?.[vCode];
        if (comparativeVendorPriceFilled(vendorData)) {
          updatedSavedVendors[vCode] = true;
        }
      });

      setSavedVendors((prev) => ({
        ...prev,
        [savedKey]: updatedSavedVendors,
      }));

      const indent = indents.find((i) => i.IndentNumber === selectedIndent.IndentNumber);
      if (indent) {
        const isComplete = isComparativePrepared(indent, mergedData);
        setIndentCompletionStatus((prev) => ({
          ...prev,
          [selectedIndent.IndentNumber]: isComplete,
        }));
      }

      setSnackbar({ open: true, message: 'Comparative statement saved!', severity: 'success' });
      setDialogOpen(false);
      setSelectedIndent(null);
    } catch (err) {
      const msg = err?.message || String(err);
      setError(msg);
      setSnackbar({ open: true, message: `Save failed: ${msg}`, severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <BaseStepComponent
        title="Prepare Comparative Statement"
        description="Compare quotations from different vendors and prepare a detailed comparison"
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </BaseStepComponent>
    );
  }

  return (
    <BaseStepComponent
      title="Prepare Comparative Statement"
      description="Compare quotations from different vendors and prepare a detailed comparison"
      breadcrumbs={[
        { label: 'Purchase Flow', path: '/purchase-flow' }
      ]}
    >
      {/* {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )} */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2, color: theme.palette.success.main }}>Indents Ready for Comparative Statement</Typography>
        {(() => {
          // Filter indents that have valid items
          const validIndents = indents.filter(indent => {
            // Skip if no IndentNumber
            if (!indent.IndentNumber) return false;
            
            // Skip if no Items field
            if (!indent.Items) return false;
            
            let itemsArray = indent.Items;
            
            // Handle string Items
            if (typeof indent.Items === 'string') {
              // If it's an empty string or empty array string, skip
              if (indent.Items.trim() === '' || indent.Items.trim() === '[]' || indent.Items.trim() === '{}') {
                return false;
              }
              try {
                itemsArray = JSON.parse(indent.Items);
              } catch (e) {
                return false;
              }
            }
            
            // Handle object Items
            if (itemsArray && !Array.isArray(itemsArray) && typeof itemsArray === 'object') {
              itemsArray = Object.values(itemsArray);
            }
            
            // Must be a non-empty array
            return itemsArray && Array.isArray(itemsArray) && itemsArray.length > 0;
          });

          return validIndents.length === 0 ? (
            <Alert severity="info">No indents ready for comparative statement.</Alert>
          ) : (
            validIndents.map(indent => (
              <Card key={indent.IndentNumber} sx={{ mb: 3, border: `1px solid ${theme.palette.success.main}`, background: '#fff' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: theme.palette.success.main }}>Indent: {indent.IndentNumber}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip 
                        title={!isComparativePrepared(indent) ? "Please prepare comparative statement for all items with prices before completing this step" : "Complete Comparative Statement step"}
                        arrow
                      >
                        <span>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<CheckIcon />}
                            sx={{ 
                              background: isComparativePrepared(indent) ? theme.palette.success.main : 'rgba(0, 0, 0, 0.12)',
                              color: isComparativePrepared(indent) ? '#fff' : 'rgba(0, 0, 0, 0.26)',
                              '&:disabled': {
                                backgroundColor: 'rgba(0, 0, 0, 0.12)',
                                color: 'rgba(0, 0, 0, 0.26)'
                              }
                            }}
                            onClick={() => handleCompleteIndentStep(indent.IndentNumber)}
                            disabled={!isComparativePrepared(indent) || isSaving}
                          >
                            Complete
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                  {(() => {
                    // Handle case where Items might be a JSON string or an object
                    let itemsArray = indent.Items;
                    if (typeof indent.Items === 'string') {
                      try {
                        itemsArray = JSON.parse(indent.Items);
                      } catch (e) {
                        console.error('Error parsing Items string:', e);
                        itemsArray = [];
                      }
                    }
                    // If itemsArray is an object, convert to array
                    if (itemsArray && !Array.isArray(itemsArray) && typeof itemsArray === 'object') {
                      itemsArray = Object.values(itemsArray);
                    }
                    
                    return itemsArray && Array.isArray(itemsArray) && itemsArray.length > 0 ? (
                      itemsArray.map(item => (
                      <Box key={item.itemCode} sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ color: theme.palette.success.main, mb: 1 }}>Item: {item.itemName} (Code: {item.itemCode})</Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>Quantity: {item.quantity} | Specifications: {item.specifications}</Typography>
                        <TableContainer component={Paper} sx={{ mb: 2 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ background: '#e3f2fd' }}>
                                <TableCell>Vendor Code</TableCell>
                                <TableCell>Vendor Name</TableCell>
                                <TableCell>Contact</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Quotation</TableCell>
                                <TableCell>Action</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {item.vendors && Object.values(item.vendors).length > 0 ? (
                                Object.values(item.vendors).map(vendor => {
                                  const savedKey = `${indent.IndentNumber}_${item.itemCode}`;
                                  const savedVendorsForItem = savedVendors[savedKey] || {};
                                  const isVendorSaved = savedVendorsForItem[vendor.vendorCode];
                                  
                                  return (
                                    <TableRow key={vendor.vendorCode}>
                                      <TableCell>{vendor.vendorCode}</TableCell>
                                      <TableCell>{vendor.vendorName}</TableCell>
                                      <TableCell>{vendor.vendorContact}</TableCell>
                                      <TableCell>{vendor.vendorEmail}</TableCell>
                                      <TableCell>
                                        {vendor.quotationDocument ? (
                                          <Tooltip title="View Quotation Document">
                                            <IconButton
                                              size="small"
                                              onClick={() => window.open(`https://drive.google.com/file/d/${vendor.quotationDocument}/view`, '_blank')}
                                              sx={{ color: theme.palette.success.main }}
                                            >
                                              <PictureAsPdfIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        ) : (
                                          <Typography variant="body2" color="error">No Quotation</Typography>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="contained"
                                          size="small"
                                          sx={{ 
                                            background: isVendorSaved ? '#4caf50' : theme.palette.success.main,
                                            color: '#fff'
                                          }}
                                          onClick={() => handlePrepareComparative(indent, item)}
                                        >
                                          {isVendorSaved ? 'Update Comparative' : 'Prepare Comparative'}
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={6} align="center">No vendors assigned to this item</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    ))
                    ) : null;
                  })()}
                </CardContent>
              </Card>
            ))
          );
        })()}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Prepare Comparative Statement - {selectedIndent?.selectedItem?.itemName}</DialogTitle>
        <DialogContent>
          {selectedIndent && selectedIndent.selectedItem && (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: '#e3f2fd' }}>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Delivery Time</TableCell>
                    <TableCell>Terms</TableCell>
                    <TableCell>Lead Time</TableCell>
                    <TableCell>Quotation</TableCell>
                    <TableCell>Best?</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedIndent.selectedItem.vendors.map(vendor => {
                    const vCode = vendor.vendorCode;
                    const itemCode = selectedIndent.selectedItem.itemCode;
                    const data = comparativeData[itemCode]?.[vCode] || {};
                    return (
                      <TableRow key={vCode}>
                        <TableCell>{vendor.vendorName} ({vCode})</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={data.price || ''}
                            onChange={e => handleComparativeChange(itemCode, vCode, 'price', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={data.deliveryTime || ''}
                            onChange={e => handleComparativeChange(itemCode, vCode, 'deliveryTime', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={data.terms || ''}
                            onChange={e => handleComparativeChange(itemCode, vCode, 'terms', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={data.leadTime || ''}
                            onChange={e => handleComparativeChange(itemCode, vCode, 'leadTime', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          {vendor.quotationDocument ? (
                            <Tooltip title="View Quotation Document">
                              <IconButton
                                size="small"
                                onClick={() => window.open(`https://drive.google.com/file/d/${vendor.quotationDocument}/view`, '_blank')}
                                sx={{ color: theme.palette.success.main }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Typography variant="body2" color="text.secondary">No Document</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <input
                            type="radio"
                            name={`bestVendor_${itemCode}`}
                            checked={data.best || false}
                            onChange={e => handleComparativeChange(itemCode, vCode, 'best', e.target.checked)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 2 }}>
          <Button 
            onClick={() => setDialogOpen(false)}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveComparative} 
            disabled={isSaving}
            variant="contained"
            startIcon={isSaving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : null}
            sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              color: '#fff',
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              minWidth: 120,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)',
              }
            }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Skip Confirmation Dialog */}
    </BaseStepComponent>
  );
};

export default ComparativeStatement; 


