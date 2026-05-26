import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Collapse
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import BaseStepComponent from './BaseStepComponent';
import sheetService from '../../../services/sheetService';
import purchaseFlowService from '../../../services/purchaseFlowService';
import config from '../../../config/config';
import { useAuth } from '../../../context/AuthContext';

const ApproveIndent = () => {
  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({ open: false, indent: null, reason: '' });
  const { user } = useAuth();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openGroups, setOpenGroups] = useState({});

  const fetchIndents = async () => {
    setLoading(true);
    setError(null);
    try {
      const allIndents = await purchaseFlowService.getAllIndents();
      const filtered = allIndents.filter((indent) =>
        purchaseFlowService.isAwaitingApproveIndent(indent)
      );
      setIndents(filtered);
    } catch (err) {
      setError('Failed to fetch indents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndents();
  }, []);

  const validateIndentForApproval = (indent) => {
    // Check if indent has items
    const items = indent.Items || [];
    if (!Array.isArray(items) || items.length === 0) {
      return {
        isValid: false,
        error: 'Cannot approve indent: Indent must have at least one item'
      };
    }
    
    // Check if all items have required fields
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.itemCode && !item.ItemCode) {
        return {
          isValid: false,
          error: `Cannot approve indent: Item ${i + 1} is missing item code`
        };
      }
      if (!item.quantity && !item.Quantity) {
        return {
          isValid: false,
          error: `Cannot approve indent: Item ${i + 1} is missing quantity`
        };
      }
    }
    
    return { isValid: true };
  };

  const handleApprove = async (indent) => {
    // Validate indent before approving
    const validation = validateIndentForApproval(indent);
    if (!validation.isValid) {
      setSnackbar({ open: true, message: validation.error, severity: 'error' });
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await purchaseFlowService.approveIndent(indent.IndentNumber, user?.email || 'Process Coordinator');
      setSnackbar({ open: true, message: 'Indent approved successfully', severity: 'success' });
      await fetchIndents();
    } catch (err) {
      console.error('Error approving indent:', err);
      setSnackbar({ 
        open: true, 
        message: 'Failed to approve indent: ' + (err.message || 'Unknown error'), 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    // Validate rejection note is provided
    if (!rejectDialog.reason || rejectDialog.reason.trim() === '') {
      setSnackbar({ open: true, message: 'Please provide a reason for rejection', severity: 'warning' });
      return;
    }
    
    if (!rejectDialog.indent) {
      setSnackbar({ open: true, message: 'No indent selected for rejection', severity: 'error' });
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await purchaseFlowService.rejectIndent(rejectDialog.indent.IndentNumber, rejectDialog.reason.trim(), user?.email || 'Process Coordinator');
      setSnackbar({ open: true, message: 'Indent rejected successfully', severity: 'success' });
      setRejectDialog({ open: false, indent: null, reason: '' });
      await fetchIndents();
    } catch (err) {
      console.error('Error rejecting indent:', err);
      setSnackbar({ 
        open: true, 
        message: 'Failed to reject indent: ' + (err.message || 'Unknown error'), 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (indentNumber) => {
    setOpenGroups((prev) => ({ ...prev, [indentNumber]: !prev[indentNumber] }));
  };

  return (
    <BaseStepComponent
      title="Approve Indent"
      description="Approve or reject new indents raised by Store/Dept Head."
      breadcrumbs={[]}
    >
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Indent Number</TableCell>
              <TableCell>Expand</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {indents.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">No new indents to approve.</TableCell>
              </TableRow>
            )}
            {indents.map((indent) => {
              // Use Items array from backend
              const items = indent.Items || [];
              return (
                <React.Fragment key={indent.IndentNumber}>
                  <TableRow>
                    <TableCell>{indent.IndentNumber}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => toggleGroup(indent.IndentNumber)}>
                        {openGroups[indent.IndentNumber] ? <ExpandLess /> : <ExpandMore />}
                      </Button>
                    </TableCell>
                    <TableCell>{indent.Status}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => handleApprove(indent)}
                        disabled={loading}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => setRejectDialog({ open: true, indent, reason: '' })}
                        disabled={loading}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} sx={{ p: 0, border: 0 }}>
                      <Collapse in={openGroups[indent.IndentNumber]} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Items in this Indent</Typography>
                          <Table size="small" sx={{ background: '#f9f9f9', borderRadius: 2 }}>
                            <TableHead>
                              <TableRow>
                                <TableCell>Item Code</TableCell>
                                <TableCell>Item Name</TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>Specifications</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {items.length > 0 ? (
                                items.map((item, idx) => (
                                  <TableRow key={item.itemCode + '-' + idx}>
                                    <TableCell>{item.itemCode}</TableCell>
                                    <TableCell>{item.item}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>{item.specifications}</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={4} align="center">No items</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, indent: null, reason: '' })}>
        <DialogTitle>Reject Indent</DialogTitle>
        <DialogContent>
          <TextField
            label="Rejection Reason"
            value={rejectDialog.reason}
            onChange={e => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
            fullWidth
            multiline
            rows={3}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, indent: null, reason: '' })}>Cancel</Button>
          <Button onClick={handleReject} color="error" variant="contained" disabled={loading || !rejectDialog.reason}>Reject</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </BaseStepComponent>
  );
};

export default ApproveIndent; 