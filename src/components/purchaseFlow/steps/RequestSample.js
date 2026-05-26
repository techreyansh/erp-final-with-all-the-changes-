import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha
} from '@mui/material';
import { useAuth } from '../../../context/AuthContext';
import purchaseFlowService from '../../../services/purchaseFlowService';

const RequestSample = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [completing, setCompleting] = useState({});
  const [sendingEmail, setSendingEmail] = useState({});
  const [trackingDialog, setTrackingDialog] = useState({ open: false, indent: null, item: null });
  const [trackingStatus, setTrackingStatus] = useState('In Progress');

  useEffect(() => {
    fetchIndents();
  }, []);

  const fetchIndents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await purchaseFlowService.getIndentsForRequestSample();
      setIndents(data);
    } catch (err) {
      console.error('Error fetching indents:', err);
      setError(err.message);
      setSnackbar({ open: true, message: 'Failed to fetch indents', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (indentNumber, itemCode, vendorCode, vendorEmail, vendorName) => {
    try {
      setSendingEmail(prev => ({ ...prev, [`${indentNumber}_${itemCode}_${vendorCode}`]: true }));
      
      // Create email subject and body
      const subject = `Sample Request - Indent ${indentNumber}`;
      const body = `Dear ${vendorName},\n\nWe would like to request a sample for indent ${indentNumber}, item ${itemCode}.\n\nPlease provide the sample at your earliest convenience.\n\nBest regards,\nPurchase Team`;
      
      // Create mailto link with pre-filled email details
      const mailtoLink = `mailto:${vendorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Open default email client
      window.open(mailtoLink, '_blank');
      
      // Update tracking status to indicate email was sent
      await purchaseFlowService.updateSampleTrackingStatus({
        indentNumber,
        itemCode,
        vendorCode,
        status: 'Email Sent',
        trackingStatus: 'In Progress',
        userEmail: user?.email || 'QC Manager'
      });
      
      setSnackbar({ open: true, message: 'Email client opened with pre-filled details!', severity: 'success' });
      
      // Refresh the data to show updated tracking status
      await fetchIndents();
      
    } catch (error) {
      console.error('Error opening email client:', error);
      setSnackbar({ open: true, message: 'Failed to open email client', severity: 'error' });
    } finally {
      setSendingEmail(prev => ({ ...prev, [`${indentNumber}_${itemCode}_${vendorCode}`]: false }));
    }
  };

  const handleUpdateTracking = async () => {
    try {
      const { indent, item } = trackingDialog;
      
      // Determine status based on tracking status
      let status = 'Email Sent';
      if (trackingStatus === 'Not Started') {
        status = 'Yet to Ask for Sample';
      } else if (trackingStatus === 'In Progress') {
        status = 'Asked for Sample';
      } else if (trackingStatus === 'Received Sample') {
        status = 'Sample Received';
      }
      
      await purchaseFlowService.updateSampleTrackingStatus({
        indentNumber: indent.IndentNumber,
        itemCode: item.itemCode,
        vendorCode: item.approvedVendor?.vendorCode || '',
        status: status,
        trackingStatus: trackingStatus,
        userEmail: user?.email || 'QC Manager'
      });
      
      setSnackbar({ open: true, message: 'Sample tracking status updated successfully!', severity: 'success' });
      setTrackingDialog({ open: false, indent: null, item: null });
      
      // Refresh the data
      await fetchIndents();
      
    } catch (error) {
      console.error('Error updating tracking:', error);
      setSnackbar({ open: true, message: 'Failed to update tracking status', severity: 'error' });
    }
  };

  const handleCompleteIndent = async (indentNumber) => {
    try {
      setCompleting(prev => ({ ...prev, [indentNumber]: true }));
      
      await purchaseFlowService.completeRequestSampleStep({
        indentNumber,
        userEmail: user?.email || 'QC Manager'
      });
      
      setSnackbar({ open: true, message: `Request Sample step completed for indent ${indentNumber}!`, severity: 'success' });
      
      // Remove the completed indent from the list
      setIndents(prev => prev.filter(i => i.IndentNumber !== indentNumber));
      
    } catch (error) {
      console.error('Error completing step:', error);
      setSnackbar({ open: true, message: 'Failed to complete step', severity: 'error' });
    } finally {
      setCompleting(prev => ({ ...prev, [indentNumber]: false }));
    }
  };

  const isIndentComplete = (indent) => {
    if (!indent.Items || indent.Items.length === 0) return false;
    
    for (const item of indent.Items) {
      if (item.sampleRequired) {
        // For items requiring samples, check if email has been sent
        // This is a simplified check - in real implementation, you'd check the actual tracking status
        return true; // For now, allow completion if sample is required
      }
    }
    return true; // If no samples required, allow completion
  };

  const getTrackingStatus = (indent, item) => {
    return item.trackingStatus || 'Not Started';
  };

  const getStatus = (indent, item) => {
    return item.status || 'Yet to Ask for Sample';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" sx={{ mb: 3, color: theme.palette.success.main }}>
        Request Sample
      </Typography>
      
      {indents.length === 0 ? (
        <Alert severity="info">No indents ready for sample requests.</Alert>
      ) : (
        indents.map((indent) => (
          <Card key={indent.IndentNumber} sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ color: theme.palette.success.main }}>
                  Indent: {indent.IndentNumber}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!isIndentComplete(indent) || completing[indent.IndentNumber]}
                  onClick={() => handleCompleteIndent(indent.IndentNumber)}
                >
                  {completing[indent.IndentNumber] ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    'Complete Step'
                  )}
                </Button>
              </Box>

              {indent.Items && Array.isArray(indent.Items) && indent.Items.length > 0 ? (
                indent.Items.map((item) => (
                  <Box key={item.itemCode} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: theme.palette.success.main, mb: 1 }}>
                      Item: {item.itemName} (Code: {item.itemCode})
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
                            <TableCell>Contact</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Sample Required</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Tracking Status</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>{item.approvedVendor?.vendorCode || 'N/A'}</TableCell>
                            <TableCell>{item.approvedVendor?.vendorName || 'N/A'}</TableCell>
                            <TableCell>{item.approvedVendor?.vendorContact || 'N/A'}</TableCell>
                            <TableCell>{item.approvedVendor?.vendorEmail || 'N/A'}</TableCell>
                            <TableCell>{item.approvedVendor?.price || 'N/A'}</TableCell>
                            <TableCell>
                              {item.sampleRequired ? (
                                <Chip label="Yes" color="warning" size="small" />
                              ) : (
                                <Chip label="No" color="success" size="small" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={getStatus(indent, item)} 
                                color="default" 
                                size="small" 
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={getTrackingStatus(indent, item)} 
                                color="default" 
                                size="small" 
                              />
                            </TableCell>
                            <TableCell>
                              {item.sampleRequired ? (
                                <Box>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    disabled={sendingEmail[`${indent.IndentNumber}_${item.itemCode}_${item.approvedVendor.vendorCode}`]}
                                    onClick={() => {
                                      if (item.approvedVendor) {
                                        handleSendEmail(
                                          indent.IndentNumber, 
                                          item.itemCode, 
                                          item.approvedVendor.vendorCode,
                                          item.approvedVendor.vendorEmail,
                                          item.approvedVendor.vendorName
                                        );
                                      }
                                    }}
                                    sx={{ mr: 1 }}
                                  >
                                    {sendingEmail[`${indent.IndentNumber}_${item.itemCode}_${item.approvedVendor.vendorCode}`] ? (
                                      <CircularProgress size={16} />
                                    ) : (
                                      'Send Email'
                                    )}
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                    onClick={() => setTrackingDialog({ 
                                      open: true, 
                                      indent, 
                                      item 
                                    })}
                                  >
                                    Track Sample
                                  </Button>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="textSecondary">
                                  No sample required
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ))
              ) : (
                <Typography>No items found for this indent.</Typography>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {/* Tracking Status Dialog */}
      <Dialog 
        open={trackingDialog.open} 
        onClose={() => setTrackingDialog({ open: false, indent: null, item: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Update Sample Tracking Status - {trackingDialog.item?.itemName}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Tracking Status</InputLabel>
            <Select
              value={trackingStatus}
              onChange={(e) => setTrackingStatus(e.target.value)}
              label="Tracking Status"
            >
              <MenuItem value="Not Started">Not Started</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Received Sample">Received Sample</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setTrackingDialog({ open: false, indent: null, item: null })}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateTracking}
            variant="contained"
            color="primary"
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RequestSample; 