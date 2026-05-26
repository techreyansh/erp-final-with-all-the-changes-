import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  alpha,
  LinearProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Send as SendIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Upload as UploadIcon,
  Visibility as VisibilityIcon,
  PictureAsPdf as PictureAsPdfIcon,
  SkipNext as SkipIcon
} from '@mui/icons-material';
import BaseStepComponent from './BaseStepComponent';
import { useStepStatus } from '../../../context/StepStatusContext';
import sheetService from '../../../services/sheetService';
import config from '../../../config/config';
import purchaseFlowService from '../../../services/purchaseFlowService';
import vendorService from '../../../services/vendorService';
import { useAuth } from '../../../context/AuthContext';

const FollowupQuotations = ({ onComplete }) => {
  const { stepStatuses, setStepStatuses } = useStepStatus();
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [indents, setIndents] = useState([]);
  const [selectedIndent, setSelectedIndent] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [uploading, setUploading] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [expandedIndent, setExpandedIndent] = useState(null);
  const [followUpQuotations, setFollowUpQuotations] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({}); // Track upload status per vendor
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [indentToSkip, setIndentToSkip] = useState(null);
  const theme = useTheme();

  const handleAddQuotation = () => {
    setQuotations([
      ...quotations,
      {
        vendor: '',
        date: '',
        amount: '',
        validity: '',
        deliveryTime: '',
        paymentTerms: '',
        status: 'pending'
      }
    ]);
  };

  const handleQuotationChange = (index, field, value) => {
    const updatedQuotations = [...quotations];
    updatedQuotations[index] = {
      ...updatedQuotations[index],
      [field]: value
    };
    setQuotations(updatedQuotations);
  };

  const handleStatusChange = (index, status) => {
    const updatedQuotations = [...quotations];
    updatedQuotations[index] = {
      ...updatedQuotations[index],
      status
    };
    setQuotations(updatedQuotations);
  };

  const handleRemoveQuotation = (index) => {
    const updatedQuotations = quotations.filter((_, i) => i !== index);
    setQuotations(updatedQuotations);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      if (!selectedIndent) {
        setError('Please select an indent to save for.');
        setIsSaving(false);
        return;
      }
      if (Object.keys(uploadedFiles).length === 0) {
        setError('Please upload at least one quotation document (successfully) before saving.');
        setIsSaving(false);
        return;
      }
      // Merge uploadedFiles and quotations by vendor
      const filesWithDetails = Object.entries(uploadedFiles).map(([vendorCode, fileObj], idx) => {
        const q = quotations[idx] || {};
        return {
          ...fileObj,
          vendor: vendorCode,
          date: q.date || '',
          amount: q.amount || '',
          validity: q.validity || '',
          deliveryTime: q.deliveryTime || '',
          paymentTerms: q.paymentTerms || '',
          status: q.status || '',
        };
      });
      // Save all uploaded file info for this indent
      await purchaseFlowService.saveFollowupQuotationDraft({
        indentNumber: selectedIndent.IndentNumber,
        files: filesWithDetails,
        userEmail: user?.email || 'system',
      });
      setSnackbarOpen(true);
      setSelectedIndent(null);
      setVendors([]);
      setUploading({});
      setUploadedFiles({});
      setQuotations([]);
      setSuccess(null);
      const updatedIndents = await purchaseFlowService.getIndentsAtStep4WithItemsAndVendors();
      setIndents(Array.isArray(updatedIndents) ? updatedIndents : []);
    } catch (err) {
      console.error('Error saving:', err);
      setError(err.message || String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Get the current flow ID from the URL or context
      const flowId = window.location.pathname.split('/').pop();

      // First save the quotations data
      await handleSave();

      // Get existing data first
      const existingData = await sheetService.getSheetData(config.sheets.purchaseFlowSteps);
      
      // Find the current step record
      const currentStep = existingData.find(record => 
        record.FlowId === flowId && record.StepId === 4
      );

      // Prepare the step data
      const stepData = {
        StepId: 4,
        FlowId: flowId,
        StepNumber: 4,
        Role: 'Purchase Executive',
        Action: 'Follow-up for Quotations',
        Status: 'completed',
        AssignedTo: 'Purchase Executive', // TODO: Get from auth context
        StartTime: currentStep?.StartTime || new Date().toISOString(),
        EndTime: new Date().toISOString(),
        TAT: '2 days',
        TATStatus: 'On Time',
        Documents: JSON.stringify(quotations),
        Comments: 'Quotation follow-up completed',
        ApprovalStatus: 'Approved',
        RejectionReason: '',
        NextStep: 5,
        PreviousStep: 3,
        Dependencies: '3',
        LastModifiedBy: 'Purchase Executive', // TODO: Get from auth context
        LastModifiedAt: new Date().toISOString()
      };

      if (currentStep) {
        // Update existing record
        const rowIndex = existingData.indexOf(currentStep) + 2; // +2 for header row
        await sheetService.updateSheetData(
          config.sheets.purchaseFlowSteps,
          rowIndex,
          stepData
        );
      } else {
        // Append new record
        await sheetService.appendRow(
          config.sheets.purchaseFlowSteps,
          stepData
        );
      }

      // Update local state
      setStepStatuses(prev => ({
        ...prev,
        4: 'completed'
      }));

      setSuccess('Step completed successfully');
      if (onComplete) onComplete();
    } catch (err) {
      console.error('Error completing step:', err);
      setError('Failed to complete step. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'received':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleSelectIndent = async (indent) => {
    setSelectedIndent(indent);
    setError(null);
    try {
      const vendors = await purchaseFlowService.getVendorsForIndent(indent.IndentNumber);
      setVendors(vendors);
    } catch (e) {
      setError('Failed to load vendors for this indent');
    }
  };

  const handleFileChange = async (vendorCode, file) => {
    setUploading(prev => ({ ...prev, [vendorCode]: file }));
    // Try uploading to Google Drive immediately
    try {
      setError(null);
      const fileId = await sheetService.uploadFile(file);
      setUploadedFiles(prev => ({ ...prev, [vendorCode]: { fileId, fileName: file.name } }));
    } catch (err) {
      setError('Failed to upload file to Google Drive. ' + (err.message || String(err)));
      setUploadedFiles(prev => {
        const copy = { ...prev };
        delete copy[vendorCode];
        return copy;
      });
    }
  };

  const handleUploadQuotation = async (indentNumber, itemCode, vendorCode) => {
    const quotationDocument = window.prompt('Paste quotation document link:');
    if (!quotationDocument) return;
    await purchaseFlowService.addOrUpdateFollowUpQuotation({
      indentNumber,
      itemCode,
      vendorCode,
      quotationDocument,
      userEmail: 'currentUser@example.com',
    });
    fetchFollowUpQuotations(indentNumber);
  };

  const fetchIndents = async () => {
    setLoading(true);
    try {
      const data = await purchaseFlowService.getIndentsAtStep4WithItemsAndVendors();
      setIndents(Array.isArray(data) ? data : []);
      if (Array.isArray(data)) {
        data.forEach(indent => fetchFollowUpQuotations(indent.IndentNumber));
      }
    } catch (err) {
      setIndents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowUpQuotations = async (indentNumber) => {
    try {
      const data = await purchaseFlowService.getFollowUpQuotationsForIndent(indentNumber);
      setFollowUpQuotations(prev => ({ ...prev, [indentNumber]: data }));
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchIndents();
  }, []);

  const handleQuotationFieldChange = (indentNumber, itemCode, vendorCode, field, value) => {
    setFollowUpQuotations(prev => {
      const updated = { ...prev };
      if (!updated[indentNumber]) updated[indentNumber] = {};
      if (!updated[indentNumber][itemCode]) updated[indentNumber][itemCode] = {};
      if (!updated[indentNumber][itemCode][vendorCode]) updated[indentNumber][itemCode][vendorCode] = {};
      updated[indentNumber][itemCode][vendorCode] = {
        ...updated[indentNumber][itemCode][vendorCode],
        [field]: value
      };
      return updated;
    });
  };
  const handleFileUpload = async (indentNumber, itemCode, vendorCode, file) => {
    if (!file) return;
    
    const uploadKey = `${indentNumber}_${itemCode}_${vendorCode}`;
    setUploadStatus(prev => ({ ...prev, [uploadKey]: { uploading: true, error: null } }));
    
    try {
      // Upload file to Google Drive
      const fileId = await sheetService.uploadFile(file);
      
      // Update local state
      setFollowUpQuotations(prev => {
        const updated = { ...prev };
        if (!updated[indentNumber]) updated[indentNumber] = {};
        if (!updated[indentNumber][itemCode]) updated[indentNumber][itemCode] = {};
        if (!updated[indentNumber][itemCode][vendorCode]) updated[indentNumber][itemCode][vendorCode] = {};
        updated[indentNumber][itemCode][vendorCode] = {
          ...updated[indentNumber][itemCode][vendorCode],
          quotationDocument: fileId,
          fileName: file.name,
          uploadedAt: new Date().toISOString()
        };
        return updated;
      });
      
      // Save to backend
      await purchaseFlowService.addOrUpdateFollowUpQuotation({
        indentNumber,
        itemCode,
        vendorCode,
        quotationDocument: fileId,
        userEmail: user?.email || 'system',
      });
      
      setUploadStatus(prev => ({ ...prev, [uploadKey]: { uploading: false, error: null, success: true } }));
      setSnackbarOpen(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadStatus(prev => {
          const updated = { ...prev };
          if (updated[uploadKey]) {
            delete updated[uploadKey].success;
          }
          return updated;
        });
      }, 3000);
      
    } catch (error) {
      console.error('Error uploading quotation:', error);
      setUploadStatus(prev => ({ 
        ...prev, 
        [uploadKey]: { 
          uploading: false, 
          error: error.message || 'Failed to upload quotation' 
        } 
      }));
      setError('Failed to upload quotation: ' + (error.message || String(error)));
    }
  };
  const allQuotationsUploaded = (indent) => {
    if (!indent.Items) return false;
    for (const item of indent.Items) {
      for (const vendor of item.vendors) {
        const q = followUpQuotations[indent.IndentNumber]?.[item.itemCode]?.[vendor.vendorCode];
        if (!q || !q.quotationDocument) return false;
      }
    }
    return true;
  };
  const handleCompleteStep = async (indent = null) => {
    const indentToProcess = indent || selectedIndent;
    if (!indentToProcess) return;

    setLoading(true);
    try {
      // Save all quotations to backend if indent is selected
      if (indentToProcess.Items) {
        for (const item of indentToProcess.Items) {
          if (item.vendors) {
            for (const vendor of item.vendors) {
              const q = followUpQuotations[indentToProcess.IndentNumber]?.[item.itemCode]?.[vendor.vendorCode] || {};
              if (q.quotationDocument) {
                await purchaseFlowService.addOrUpdateFollowUpQuotation({
                  indentNumber: indentToProcess.IndentNumber,
                  itemCode: item.itemCode,
                  vendorCode: vendor.vendorCode,
                  quotationDocument: q.quotationDocument,
                  userEmail: user?.email || 'system',
                });
              }
            }
          }
        }
      }
      
      // Update PurchaseFlow and PurchaseFlowSteps for this indent
      await purchaseFlowService.completeFollowUpQuotationStep({
        indentNumber: indentToProcess.IndentNumber,
        userEmail: user?.email || 'system',
      });
      
      // Refetch all indents
      await fetchIndents();
      setSnackbarOpen(true);
      if (!indent) {
        setSelectedIndent(null);
      }
    } catch (error) {
      console.error('Error completing step:', error);
      setError('Failed to complete step: ' + (error.message || String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleSkipClick = (indent) => {
    setIndentToSkip(indent);
    setSkipDialogOpen(true);
  };

  const handleSkipConfirm = async () => {
    if (!indentToSkip) return;
    
    setLoading(true);
    setSkipDialogOpen(false);
    try {
      // Update PurchaseFlow and PurchaseFlowSteps for this indent with skipped status
      await purchaseFlowService.skipFollowUpQuotationStep({
        indentNumber: indentToSkip.IndentNumber,
        userEmail: user?.email || 'system',
        stepId: 4
      });
      
      // Refetch all indents
      await fetchIndents();
      setSnackbarOpen(true);
      setIndentToSkip(null);
    } catch (error) {
      console.error('Error skipping step:', error);
      setError('Failed to skip step: ' + (error.message || String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleSkipCancel = () => {
    setSkipDialogOpen(false);
    setIndentToSkip(null);
  };

  return (
    <BaseStepComponent
      title="Follow-up for Quotations"
      description="Track and manage vendor quotations"
      breadcrumbs={[
        { label: 'Purchase Flow', path: '/purchase-flow' }
      ]}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Follow-up for Quotations</Typography>
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: '#e3f2fd' }}>
                <TableCell>Indent Number</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {indents.map(indent => (
                <TableRow key={indent.IndentNumber} selected={selectedIndent?.IndentNumber === indent.IndentNumber}>
                  <TableCell>{indent.IndentNumber}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={() => handleSelectIndent(indent)}
                        sx={{ 
                          borderColor: theme.palette.primary.main,
                          color: theme.palette.primary.main,
                          '&:hover': {
                            borderColor: theme.palette.primary.dark,
                            backgroundColor: alpha(theme.palette.primary.main, 0.1)
                          }
                        }}
                      >
                        Select
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="warning"
                        startIcon={<SkipIcon />}
                        onClick={() => handleSkipClick(indent)}
                        disabled={loading}
                        sx={{
                          borderColor: theme.palette.warning.main,
                          color: theme.palette.warning.main,
                          '&:hover': {
                            borderColor: theme.palette.warning.dark,
                            backgroundColor: alpha(theme.palette.warning.main, 0.1)
                          }
                        }}
                      >
                        Skip
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        color="success"
                        startIcon={<CheckIcon />}
                        onClick={() => handleCompleteStep(indent)}
                        disabled={loading || !allQuotationsUploaded(indent)}
                        sx={{
                          backgroundColor: theme.palette.success.main,
                          '&:hover': {
                            backgroundColor: theme.palette.success.dark
                          }
                        }}
                      >
                        Complete
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      {selectedIndent && (
        <Box>
          <Typography variant="h6" sx={{ color: theme.palette.success.main, mb: 2 }}>Items for Indent {selectedIndent.IndentNumber}</Typography>
          {selectedIndent.Items && selectedIndent.Items.length > 0 ? (
            selectedIndent.Items.map(item => (
              <Card key={item.itemCode} sx={{ mb: 3, border: `1px solid ${theme.palette.success.main}`, background: '#fff' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ color: theme.palette.success.main }}>Item: {item.itemName} (Code: {item.itemCode})</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>Quantity: {item.quantity} | Specifications: {item.specifications}</Typography>
                  <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: '#e3f2fd' }}>
                          <TableCell sx={{ fontWeight: 700 }}>Vendor Code</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Vendor Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Quotation Document</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {item.vendors.map(vendor => {
                          const vendorCode = vendor.vendorCode;
                          const q = (followUpQuotations[selectedIndent.IndentNumber]?.[item.itemCode]?.[vendorCode]) || {};
                          const uploadKey = `${selectedIndent.IndentNumber}_${item.itemCode}_${vendorCode}`;
                          const uploadState = uploadStatus[uploadKey] || {};
                          const hasQuotation = q.quotationDocument;
                          
                          return (
                            <TableRow key={vendorCode}>
                              <TableCell>{vendorCode}</TableCell>
                              <TableCell>{vendor.vendorName}</TableCell>
                              <TableCell>
                                {hasQuotation ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PictureAsPdfIcon sx={{ color: '#d32f2f', fontSize: 20 }} />
                                    <Typography variant="body2" sx={{ color: theme.palette.success.main, fontWeight: 500 }}>
                                      {q.fileName || 'Quotation Document'}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
                                    No quotation uploaded
                                  </Typography>
                                )}
                                {uploadState.uploading && (
                                  <Typography variant="caption" sx={{ color: theme.palette.success.main, display: 'block', mt: 0.5 }}>
                                    Uploading...
                                  </Typography>
                                )}
                                {uploadState.error && (
                                  <Typography variant="caption" sx={{ color: '#d32f2f', display: 'block', mt: 0.5 }}>
                                    {uploadState.error}
                                  </Typography>
                                )}
                                {uploadState.success && (
                                  <Typography variant="caption" sx={{ color: '#2e7d32', display: 'block', mt: 0.5 }}>
                                    ✓ Uploaded successfully
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                  <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<UploadIcon />}
                                    size="small"
                                    disabled={uploadState.uploading}
                                    sx={{
                                      borderColor: theme.palette.success.main,
                                      color: theme.palette.success.main,
                                      textTransform: 'none',
                                      '&:hover': {
                                        borderColor: theme.palette.success.dark,
                                        backgroundColor: '#f8fbff'
                                      },
                                      '&:disabled': {
                                        borderColor: 'rgba(0, 0, 0, 0.26)',
                                        color: 'rgba(0, 0, 0, 0.26)'
                                      }
                                    }}
                                  >
                                    {hasQuotation ? 'Replace' : 'Upload'}
                                    <input
                                      type="file"
                                      hidden
                                      accept="application/pdf,image/*,.pdf,.jpg,.jpeg,.png"
                                      onChange={(e) => {
                                        const selectedFile = e.target.files?.[0];
                                        if (selectedFile) {
                                          handleFileUpload(selectedIndent.IndentNumber, item.itemCode, vendorCode, selectedFile);
                                        }
                                      }}
                                    />
                                  </Button>
                                  {hasQuotation && (
                                    <Tooltip title="View quotation in Google Drive">
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          window.open(`https://drive.google.com/file/d/${q.quotationDocument}/view`, '_blank');
                                        }}
                                        sx={{
                                          color: theme.palette.success.main,
                                          '&:hover': {
                                            backgroundColor: '#e3f2fd'
                                          }
                                        }}
                                      >
                                        <VisibilityIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography>No items found for this indent.</Typography>
          )}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="contained"
              sx={{ background: theme.palette.success.main, color: '#fff' }}
              onClick={handleCompleteStep}
              disabled={!allQuotationsUploaded(selectedIndent)}
            >
              Complete Step
            </Button>
          </Box>
        </Box>
      )}

      {/* Skip Confirmation Dialog */}
      <Dialog
        open={skipDialogOpen}
        onClose={handleSkipCancel}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <SkipIcon />
          Skip Step 4 - Follow-up for Quotations
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText>
            Are you sure you want to skip the Follow-up for Quotations step for Indent <strong>{indentToSkip?.IndentNumber}</strong>?
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, color: theme.palette.warning.main, fontWeight: 600 }}>
            Note: Skipping this step will mark it as skipped and move the indent to the next step (Step 5) without uploading quotations.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleSkipCancel}
            variant="outlined"
            sx={{
              borderColor: theme.palette.grey[400],
              color: theme.palette.grey[700],
              '&:hover': {
                borderColor: theme.palette.grey[600],
                backgroundColor: alpha(theme.palette.grey[500], 0.1)
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSkipConfirm}
            variant="contained"
            color="warning"
            disabled={loading}
            startIcon={<SkipIcon />}
            sx={{
              backgroundColor: theme.palette.warning.main,
              '&:hover': {
                backgroundColor: theme.palette.warning.dark
              }
            }}
          >
            {loading ? 'Skipping...' : 'Skip Step'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Operation completed successfully!"
      />
    </BaseStepComponent>
  );
};

export default FollowupQuotations; 