import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  Snackbar, 
  Alert, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import purchaseFlowService from '../../../services/purchaseFlowService';
import { useAuth } from '../../../context/AuthContext';

const InspectSample = () => {
  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { user } = useAuth();
  const [noteInputs, setNoteInputs] = useState({});
  const [rejectDialog, setRejectDialog] = useState({ open: false, indent: null, item: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const indentsForStep8 = await purchaseFlowService.getIndentsForApproveSample();
        setIndents(indentsForStep8);
      } catch (error) {
        console.error('Error fetching indents:', error);
        setSnackbar({ open: true, message: 'Failed to fetch indents data', severity: 'error' });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleNoteChange = (indentNumber, itemCode, value) => {
    setNoteInputs(prev => ({ 
      ...prev, 
      [`${indentNumber}-${itemCode}`]: value 
    }));
  };

  const handleApproveItem = async (indent, item) => {
    const processingKey = `${indent.IndentNumber}-${item.itemCode}`;
    setProcessing(prev => ({ ...prev, [processingKey]: true }));
    try {
      const result = await purchaseFlowService.approveSampleItem({
        indentNumber: indent.IndentNumber,
        itemCode: item.itemCode,
        vendorCode: item.approvedVendor.vendorCode,
        userEmail: user?.email || 'Purchase Executive',
        note: noteInputs[`${indent.IndentNumber}-${item.itemCode}`] || '',
      });
      
      if (result.indentMovedToNextStep) {
        // If indent moved to next step, refetch all indents
        setSnackbar({ 
          open: true, 
          message: `All samples approved for indent ${indent.IndentNumber}. Indent moved to step ${result.nextStep}.`, 
          severity: 'success' 
        });
        
        // Refetch all indents
        const updatedIndents = await purchaseFlowService.getIndentsForApproveSample();
        setIndents(updatedIndents);
      } else {
        // Update the local state to reflect the approval
        setIndents(prev => prev.map(ind => {
          if (ind.IndentNumber === indent.IndentNumber) {
            const updatedItems = ind.Items.map(it => {
              if (it.itemCode === item.itemCode) {
                return { 
                  ...it, 
                  inspectionStatus: 'Approved',
                  rejectionReason: '' // Clear rejection reason when approved
                };
              }
              return it;
            });
            
            // Calculate new overall status
            const approvedCount = updatedItems.filter(item => item.inspectionStatus === 'Approved').length;
            const rejectedCount = updatedItems.filter(item => item.inspectionStatus === 'Rejected').length;
            const totalCount = updatedItems.length;
            
            let newOverallStatus = 'Pending';
            if (approvedCount === totalCount) {
              newOverallStatus = 'Approved';
            } else if (rejectedCount === totalCount) {
              newOverallStatus = 'Rejected';
            } else if (approvedCount > 0) {
              newOverallStatus = 'Partial';
            }
            
            return {
              ...ind,
              Items: updatedItems,
              overallStatus: newOverallStatus
            };
          }
          return ind;
        }));
        
        setSnackbar({ open: true, message: `Sample approved for item ${item.itemCode}`, severity: 'success' });
      }
    } catch (error) {
      console.error('Error approving sample item:', error);
      setSnackbar({ open: true, message: 'Failed to approve sample item', severity: 'error' });
    }
    setProcessing(prev => ({ ...prev, [processingKey]: false }));
  };

  const handleRejectItem = async () => {
    if (!rejectDialog.indent || !rejectDialog.item) return;
    
    const processingKey = `${rejectDialog.indent.IndentNumber}-${rejectDialog.item.itemCode}`;
    setProcessing(prev => ({ ...prev, [processingKey]: true }));
    try {
      await purchaseFlowService.rejectSampleItem({
        indentNumber: rejectDialog.indent.IndentNumber,
        itemCode: rejectDialog.item.itemCode,
        vendorCode: rejectDialog.item.approvedVendor.vendorCode,
        userEmail: user?.email || 'Purchase Executive',
        rejectionReason,
        note: noteInputs[`${rejectDialog.indent.IndentNumber}-${rejectDialog.item.itemCode}`] || '',
      });
      setSnackbar({ open: true, message: `Sample rejected for item ${rejectDialog.item.itemCode}`, severity: 'success' });
      
      // Update the local state to reflect the rejection
      setIndents(prev => prev.map(ind => {
        if (ind.IndentNumber === rejectDialog.indent.IndentNumber) {
          const updatedItems = ind.Items.map(it => {
            if (it.itemCode === rejectDialog.item.itemCode) {
              return { 
                ...it, 
                inspectionStatus: 'Rejected',
                rejectionReason: rejectionReason
              };
            }
            return it;
          });
          
          // Calculate new overall status
          const approvedCount = updatedItems.filter(item => item.inspectionStatus === 'Approved').length;
          const rejectedCount = updatedItems.filter(item => item.inspectionStatus === 'Rejected').length;
          const totalCount = updatedItems.length;
          
          let newOverallStatus = 'Pending';
          if (approvedCount === totalCount) {
            newOverallStatus = 'Approved';
          } else if (rejectedCount === totalCount) {
            newOverallStatus = 'Rejected';
          } else if (approvedCount > 0) {
            newOverallStatus = 'Partial';
          }
          
          return {
            ...ind,
            Items: updatedItems,
            overallStatus: newOverallStatus
          };
        }
        return ind;
      }));
      
      setRejectDialog({ open: false, indent: null, item: null });
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting sample item:', error);
      setSnackbar({ open: true, message: 'Failed to reject sample item', severity: 'error' });
    }
    setProcessing(prev => ({ ...prev, [processingKey]: false }));
  };

  const openRejectDialog = (indent, item) => {
    setRejectDialog({ open: true, indent, item });
    setRejectionReason('');
  };

  const closeRejectDialog = () => {
    setRejectDialog({ open: false, indent: null, item: null });
    setRejectionReason('');
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'Approved':
        return <Chip label="Approved" color="success" size="small" />;
      case 'Rejected':
        return <Chip label="Rejected" color="error" size="small" />;
      case 'Pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'Partial':
        return <Chip label="Partially Approved" color="info" size="small" />;
      case 'In Progress':
        return <Chip label="In Progress" color="primary" size="small" />;
      default:
        return <Chip label="Unknown" color="default" size="small" />;
    }
  };

  const handleSendEmail = (indent, item) => {
    const vendorEmail = item.approvedVendor?.vendorEmail || '';
    if (!vendorEmail) {
      setSnackbar({ open: true, message: 'No vendor email found', severity: 'warning' });
      return;
    }
    
    const subject = encodeURIComponent('Sample Rejection Notification');
    const body = encodeURIComponent(`Your sample for indent ${indent.IndentNumber}, item ${item.itemCode} has been rejected. Reason: ${rejectionReason}`);
    window.open(`mailto:${vendorEmail}?subject=${subject}&body=${body}`);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Approve Sample (Step 8)</Typography>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        indents.length === 0 ? (
          <Alert severity="info">No indents ready for sample approval.</Alert>
        ) : (
          <Box>
            {indents.map((indent) => (
              <Accordion key={indent.IndentNumber} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Indent: {indent.IndentNumber}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2">
                        Items: {indent.Items?.length || 0}
                        {indent.Items && (
                          <Box component="span" sx={{ ml: 1 }}>
                            ({indent.Items.filter(item => item.inspectionStatus === 'Approved').length} approved, 
                            {indent.Items.filter(item => item.inspectionStatus === 'Rejected').length} rejected)
                            {indent.Items.filter(item => item.inspectionStatus === 'Approved').length === indent.Items.length && (
                              <Chip 
                                label="Ready for Next Step" 
                                color="success" 
                                size="small" 
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        )}
                      </Typography>
                      {indent.Items && indent.Items.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={(indent.Items.filter(item => item.inspectionStatus === 'Approved').length / indent.Items.length) * 100}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      )}
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2">
                        Status: {getStatusChip(indent.overallStatus || indent.Status)}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item Code</TableCell>
                          <TableCell>Item Name</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Specifications</TableCell>
                          <TableCell>Vendor Code</TableCell>
                          <TableCell>Vendor Name</TableCell>
                          <TableCell>Price</TableCell>
                          <TableCell>Delivery Time</TableCell>
                          <TableCell>Terms</TableCell>
                          <TableCell>Lead Time</TableCell>
                          <TableCell>Sample Required</TableCell>
                          <TableCell>Inspection Status</TableCell>
                          <TableCell>Note</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {indent.Items?.map((item, index) => {
                          const processingKey = `${indent.IndentNumber}-${item.itemCode}`;
                          const isProcessing = processing[processingKey];
                          
                          return (
                            <TableRow key={`${indent.IndentNumber}-${item.itemCode}-${index}`}>
                              <TableCell>{item.itemCode}</TableCell>
                              <TableCell>{item.itemName}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{item.specifications}</TableCell>
                              <TableCell>{item.approvedVendor?.vendorCode}</TableCell>
                              <TableCell>{item.approvedVendor?.vendorName}</TableCell>
                              <TableCell>₹{item.approvedVendor?.price}</TableCell>
                              <TableCell>{item.approvedVendor?.deliveryTime}</TableCell>
                              <TableCell>{item.approvedVendor?.terms}</TableCell>
                              <TableCell>{item.approvedVendor?.leadTime}</TableCell>
                              <TableCell>
                                {item.sampleRequired ? (
                                  <Chip label="Yes" color="primary" size="small" />
                                ) : (
                                  <Chip label="No" color="default" size="small" />
                                )}
                              </TableCell>
                              <TableCell>
                                {getStatusChip(item.inspectionStatus)}
                                {item.inspectionStatus === 'Rejected' && item.rejectionReason && (
                                  <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                                    Reason: {item.rejectionReason}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  placeholder="Add note..."
                                  value={noteInputs[`${indent.IndentNumber}-${item.itemCode}`] || ''}
                                  onChange={e => handleNoteChange(indent.IndentNumber, item.itemCode, e.target.value)}
                                  disabled={isProcessing || item.inspectionStatus === 'Approved'}
                                  sx={{ width: 120 }}
                                />
                              </TableCell>
                              <TableCell>
                                {item.inspectionStatus === 'Pending' && (
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Tooltip title="Approve Sample">
                                      <IconButton
                                        color="success"
                                        size="small"
                                        onClick={() => handleApproveItem(indent, item)}
                                        disabled={isProcessing}
                                      >
                                        <CheckCircleIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Reject Sample">
                                      <IconButton
                                        color="error"
                                        size="small"
                                        onClick={() => openRejectDialog(indent, item)}
                                        disabled={isProcessing}
                                      >
                                        <CancelIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                )}
                                {item.inspectionStatus === 'Approved' && (
                                  <Chip label="Approved" color="success" size="small" />
                                )}
                                {item.inspectionStatus === 'Rejected' && (
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Tooltip title="Approve Sample">
                                      <IconButton
                                        color="success"
                                        size="small"
                                        onClick={() => handleApproveItem(indent, item)}
                                        disabled={isProcessing}
                                      >
                                        <CheckCircleIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Reject Sample Again">
                                      <IconButton
                                        color="error"
                                        size="small"
                                        onClick={() => openRejectDialog(indent, item)}
                                        disabled={isProcessing}
                                      >
                                        <CancelIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {indent.Items?.some(item => item.inspectionStatus === 'Rejected') && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="error" gutterBottom>
                        Rejection Reasons:
                      </Typography>
                      {indent.Items?.filter(item => item.inspectionStatus === 'Rejected').map((item, index) => (
                        <Typography key={index} variant="body2" color="error" sx={{ ml: 2 }}>
                          • {item.itemCode}: {item.rejectionReason}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )
      )}
      
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
      
      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onClose={closeRejectDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Sample</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for rejecting the sample for Indent: {rejectDialog.indent?.IndentNumber}, Item: {rejectDialog.item?.itemCode}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="Please specify the reason for rejection..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRejectDialog} disabled={!!processing[`${rejectDialog.indent?.IndentNumber}-${rejectDialog.item?.itemCode}`]}>
            Cancel
          </Button>
          <Button 
            onClick={handleRejectItem} 
            variant="contained" 
            color="error"
            disabled={!!processing[`${rejectDialog.indent?.IndentNumber}-${rejectDialog.item?.itemCode}`] || !rejectionReason.trim()}
          >
            {processing[`${rejectDialog.indent?.IndentNumber}-${rejectDialog.item?.itemCode}`] ? 'Processing...' : 'Reject'}
          </Button>
          {rejectDialog.indent && rejectDialog.item && (() => {
            const vendorEmail = rejectDialog.item.approvedVendor?.vendorEmail || '';
            const subject = encodeURIComponent('Sample Rejection Notification');
            const body = encodeURIComponent(
              `Your sample for indent ${rejectDialog.indent.IndentNumber}, item ${rejectDialog.item.itemCode} has been rejected. Reason: ${rejectionReason}`
            );
            return (
              <Button
                variant="outlined"
                color="primary"
                disabled={!rejectionReason.trim() || !vendorEmail}
                href={`mailto:${vendorEmail}?subject=${subject}&body=${body}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Send Email to Vendor
              </Button>
            );
          })()}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InspectSample; 