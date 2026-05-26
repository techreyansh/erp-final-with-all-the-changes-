import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
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
  CircularProgress,
  ButtonGroup,
  ToggleButton,
  Stack,
  Divider,
  Snackbar,
  FormControlLabel,
  Radio,
  RadioGroup,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
  alpha
} from '@mui/material';
import {
  Check as CheckIcon
} from '@mui/icons-material';
import BaseStepComponent from './BaseStepComponent';
import { useAuth } from '../../../context/AuthContext';
import purchaseFlowService from '../../../services/purchaseFlowService';

const ApproveQuotation = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [sampleRequired, setSampleRequired] = useState({});
  const [vendorSelections, setVendorSelections] = useState({});
  const [completing, setCompleting] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get all indents whose next step is 6 (Approve Quotation)
        const indentsWithNextStep6 = await purchaseFlowService.getIndentsForApproveQuotation();
        
        // Remove duplicates by IndentNumber (additional safety check)
        const seen = new Set();
        const uniqueIndents = indentsWithNextStep6.filter(indent => {
          if (!indent.IndentNumber) return false;
          if (seen.has(indent.IndentNumber)) {
            return false;
          }
          seen.add(indent.IndentNumber);
          return true;
        });
        
        setIndents(uniqueIndents);
      } catch (error) {
        console.error('Error fetching indents:', error);
        setSnackbar({ open: true, message: 'Failed to fetch indents', severity: 'error' });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleVendorSelection = (indentNumber, itemCode, vendorCode) => {
    setVendorSelections(prev => ({
      ...prev,
      [`${indentNumber}_${itemCode}`]: vendorCode
    }));
  };

  const handleSampleRequiredChange = (indentNumber, itemCode, required) => {
    setSampleRequired(prev => ({
      ...prev,
      [`${indentNumber}_${itemCode}`]: required
    }));
  };

  const isIndentComplete = (indent) => {
    // Handle case where Items might be a JSON string
    let itemsArray = indent.Items;
    if (typeof indent.Items === 'string') {
      try {
        itemsArray = JSON.parse(indent.Items);
      } catch (e) {
        console.error('Error parsing Items string in isIndentComplete:', e);
        return false;
      }
    }
    
    if (!Array.isArray(itemsArray) || itemsArray.length === 0) return false;
    
    for (const item of itemsArray) {
      const selectedVendor = vendorSelections[`${indent.IndentNumber}_${item.itemCode}`];
      if (!selectedVendor) return false;
      
      // Check if sample required is set for this item
      const sampleRequiredForItem = sampleRequired[`${indent.IndentNumber}_${item.itemCode}`];
      if (sampleRequiredForItem === undefined) return false;
    }
    return true;
  };

  const handleCompleteIndent = async (indent) => {
    if (!isIndentComplete(indent)) {
      setSnackbar({ open: true, message: 'Please select vendors and sample requirements for all items', severity: 'warning' });
      return;
    }

    setCompleting(prev => ({ ...prev, [indent.IndentNumber]: true }));

    try {
      // Handle case where Items might be a JSON string
      let itemsArray = indent.Items;
      if (typeof indent.Items === 'string') {
        try {
          itemsArray = JSON.parse(indent.Items);
        } catch (e) {
          console.error('Error parsing Items string in handleCompleteIndent:', e);
          setSnackbar({ open: true, message: 'Error processing items data', severity: 'error' });
          return;
        }
      }
      
      // Prepare approval data for each item
      const approvalData = {};
      
      for (const item of itemsArray) {
        const selectedVendorCode = vendorSelections[`${indent.IndentNumber}_${item.itemCode}`];
        const selectedVendor = item.vendors?.find(v => v.vendorCode === selectedVendorCode);
        const sampleRequiredForItem = sampleRequired[`${indent.IndentNumber}_${item.itemCode}`];
        
        if (selectedVendor) {
          approvalData[item.itemCode] = {
            itemCode: item.itemCode,
            itemName: item.item || item.itemName,
            quantity: item.quantity,
            specifications: item.specifications,
            selectedVendor: {
              vendorCode: selectedVendor.vendorCode,
              vendorName: selectedVendor.vendorName,
              price: selectedVendor.price,
              deliveryTime: selectedVendor.deliveryTime,
              terms: selectedVendor.terms,
              leadTime: selectedVendor.leadTime,
              best: selectedVendor.best,
              quotationDocument: selectedVendor.quotationDocument
            },
            sampleRequired: sampleRequiredForItem
          };
        }
      }

      // Approve quotation for this indent
      await purchaseFlowService.approveQuotationEnhanced({
        indentNumber: indent.IndentNumber,
        approvalData,
        userEmail: user?.email || 'Management / HOD'
      });

      setSnackbar({ open: true, message: `Quotation approved successfully for indent ${indent.IndentNumber}!`, severity: 'success' });
      
      // Remove the completed indent from the list
      setIndents(prev => prev.filter(i => i.IndentNumber !== indent.IndentNumber));
      
      // Clear selections for this indent
      const newVendorSelections = { ...vendorSelections };
      const newSampleRequired = { ...sampleRequired };
      
      Object.keys(newVendorSelections).forEach(key => {
        if (key.startsWith(`${indent.IndentNumber}_`)) {
          delete newVendorSelections[key];
        }
      });
      
      Object.keys(newSampleRequired).forEach(key => {
        if (key.startsWith(`${indent.IndentNumber}_`)) {
          delete newSampleRequired[key];
        }
      });
      
      setVendorSelections(newVendorSelections);
      setSampleRequired(newSampleRequired);

    } catch (error) {
      console.error('Error approving quotation:', error);
      setSnackbar({ open: true, message: 'Error approving quotation: ' + (error.message || String(error)), severity: 'error' });
    } finally {
      setCompleting(prev => ({ ...prev, [indent.IndentNumber]: false }));
    }
  };

  if (loading) {
    return (
      <BaseStepComponent
        title="Approve Quotation"
        description="Review and approve quotations for multiple items and vendors"
        breadcrumbs={[
          { label: 'Purchase Flow', path: '/purchase-flow' }
        ]}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      </BaseStepComponent>
    );
  }

  return (
    <BaseStepComponent
      title="Approve Quotation"
      description="Review and approve quotations for multiple items and vendors"
      breadcrumbs={[
        { label: 'Purchase Flow', path: '/purchase-flow' }
      ]}
    >
      <Box sx={{ p: 2 }}>
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
            <Alert severity="info">No indents pending for quotation approval.</Alert>
          ) : (
            <Stack spacing={4}>
              {validIndents.map((indent) => (
              <Card key={indent.IndentNumber} sx={{ mb: 3, border: '1px solid ${theme.palette.success.main}' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '${theme.palette.success.main}' }}>
                      Indent Number: {indent.IndentNumber}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        startIcon={<CheckIcon />}
                        onClick={() => handleCompleteIndent(indent)}
                        disabled={!isIndentComplete(indent) || completing[indent.IndentNumber]}
                        sx={{ minWidth: 120 }}
                      >
                        {completing[indent.IndentNumber] ? 'Completing...' : 'Complete'}
                      </Button>
                    </Box>
                  </Box>

                  {(() => {
                    // Handle case where Items might be a JSON string
                    let itemsArray = indent.Items;
                    if (typeof indent.Items === 'string') {
                      try {
                        itemsArray = JSON.parse(indent.Items);
                      } catch (e) {
                        console.error('Error parsing Items string:', e);
                        itemsArray = [];
                      }
                    }
                    
                    return itemsArray && Array.isArray(itemsArray) && itemsArray.length > 0 ? (
                      itemsArray.map((item) => (
                        <Box key={item.itemCode} sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" sx={{ color: '${theme.palette.success.main}', mb: 1 }}>
                            Item: {item.item || item.itemName} (Code: {item.itemCode})
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            Quantity: {item.quantity} | Specifications: {item.specifications}
                          </Typography>

                          <TableContainer component={Paper} sx={{ mb: 2 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ background: '#e3f2fd' }}>
                                  <TableCell>Vendor Code</TableCell>
                                  <TableCell>Vendor Name</TableCell>
                                  <TableCell>Price</TableCell>
                                  <TableCell>Delivery Time</TableCell>
                                  <TableCell>Terms</TableCell>
                                  <TableCell>Lead Time</TableCell>
                                  <TableCell>Best</TableCell>
                                  <TableCell>Quotation</TableCell>
                                  <TableCell>Select</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {item.vendors && Array.isArray(item.vendors) && item.vendors.length > 0 ? (
                                  item.vendors.map((vendor) => (
                                    <TableRow key={vendor.vendorCode}>
                                      <TableCell>{vendor.vendorCode}</TableCell>
                                      <TableCell>{vendor.vendorName}</TableCell>
                                      <TableCell>{vendor.price || '-'}</TableCell>
                                      <TableCell>{vendor.deliveryTime || '-'}</TableCell>
                                      <TableCell>{vendor.terms || '-'}</TableCell>
                                      <TableCell>{vendor.leadTime || '-'}</TableCell>
                                      <TableCell>
                                        {vendor.best ? (
                                          <Chip label="Best" color="success" size="small" />
                                        ) : (
                                          <Chip label="No" color="default" size="small" />
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {vendor.quotationDocument ? (
                                          <Button
                                            onClick={() => {
                                              // Handle both Google Drive file IDs and full URLs
                                              const fileId = vendor.quotationDocument.includes('drive.google.com')
                                                ? vendor.quotationDocument
                                                : `https://drive.google.com/file/d/${vendor.quotationDocument}/view`;
                                              window.open(fileId, '_blank');
                                            }}
                                            size="small"
                                            sx={{ color: '${theme.palette.success.main}' }}
                                          >
                                            View
                                          </Button>
                                        ) : (
                                          <Typography variant="body2" color="error">No Doc</Typography>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Radio
                                          checked={vendorSelections[`${indent.IndentNumber}_${item.itemCode}`] === vendor.vendorCode}
                                          onChange={() => handleVendorSelection(indent.IndentNumber, item.itemCode, vendor.vendorCode)}
                                          name={`vendor-${indent.IndentNumber}-${item.itemCode}`}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={9} align="center">No vendors assigned to this item</TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Sample Required:</Typography>
                            <RadioGroup
                              row
                              value={sampleRequired[`${indent.IndentNumber}_${item.itemCode}`] !== undefined ? String(sampleRequired[`${indent.IndentNumber}_${item.itemCode}`]) : ''}
                              onChange={(e) => handleSampleRequiredChange(indent.IndentNumber, item.itemCode, e.target.value === 'true')}
                            >
                              <FormControlLabel
                                value="true"
                                control={<Radio />}
                                label="Yes"
                              />
                              <FormControlLabel
                                value="false"
                                control={<Radio />}
                                label="No"
                              />
                            </RadioGroup>
                          </Box>
                        </Box>
                      ))
                    ) : null;
                  })()}
                </CardContent>
              </Card>
              ))}
            </Stack>
          );
        })()}
      </Box>

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
    </BaseStepComponent>
  );
};

export default ApproveQuotation;