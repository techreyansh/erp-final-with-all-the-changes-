import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Snackbar, Alert, CircularProgress, Card, CardContent, Avatar, Chip, IconButton, Collapse, Grid, Tooltip, useTheme, alpha } from '@mui/material';
import { Assignment as AssignmentIcon, Business as BusinessIcon, Person as PersonIcon, Visibility as ViewIcon, VisibilityOff as VisibilityOffIcon, Receipt as ReceiptIcon, Check as CheckIcon, Description as DescriptionIcon } from '@mui/icons-material';
import purchaseFlowService from '../../../services/purchaseFlowService';
import sheetService from '../../../services/sheetService';
import { useAuth } from '../../../context/AuthContext';

const SubmitInvoice = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPOs, setExpandedPOs] = useState({});
  const [submittingInvoice, setSubmittingInvoice] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchPOs();
  }, []);

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const posData = await purchaseFlowService.getPOsForSubmitInvoice();
      setPos(posData);
    } catch (error) {
      console.error('Error fetching POs:', error);
      setSnackbar({ open: true, message: 'Failed to fetch purchase orders', severity: 'error' });
    }
    setLoading(false);
  };

  const togglePOExpansion = (poId) => {
    setExpandedPOs(prev => ({
      ...prev,
      [poId]: !prev[poId]
    }));
  };

  const handleSubmitInvoice = async (po) => {
    setSubmittingInvoice(prev => ({ ...prev, [po.POId]: true }));
    try {
      // Update SortVendor row: mark step 19 as completed, move to step 20
      const sortVendorData = await sheetService.getSheetData('SortVendor');
      const poData = sortVendorData.find(row => row.POId === po.POId);
      if (poData) {
        const poRowIndex = sortVendorData.indexOf(poData) + 2;
        await sheetService.updateRow('SortVendor', poRowIndex, {
          ...poData,
          StepId: 19,
          NextStep: 20,
          Status: 'Invoice Submitted',
          Action: 'Submit Invoice to Accounts',
          AssignedTo: 'Accounts Executive', // Next step assigned to Accounts Executive
          LastModifiedBy: user?.email || 'system',
          LastModifiedAt: new Date().toISOString()
        });
        setSnackbar({ open: true, message: 'Invoice submitted to accounts successfully! PO moved to step 20 (Schedule Payment).', severity: 'success' });
        setPos(prev => prev.filter(p => p.POId !== po.POId));
      } else {
        setSnackbar({ open: true, message: 'PO data not found', severity: 'error' });
      }
    } catch (err) {
      console.error('Error submitting invoice:', err);
      setSnackbar({ open: true, message: 'Failed to submit invoice: ' + (err.message || 'Unknown error'), severity: 'error' });
    }
    setSubmittingInvoice(prev => ({ ...prev, [po.POId]: false }));
  };

  const handleViewDocument = async (fileId, documentType) => {
    if (!fileId) {
      setSnackbar({ open: true, message: `${documentType} not available`, severity: 'warning' });
      return;
    }

    try {
      // Check if it's a Google Drive file ID (typically long alphanumeric string)
      // or localStorage file ID (starts with "doc_")
      if (fileId.startsWith('doc_')) {
        // localStorage file - download and open
        const file = await sheetService.getFileById(fileId);
        if (file && file.content) {
          // Create a blob URL and open it
          const byteCharacters = atob(file.content.split(',')[1] || file.content);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: file.type || 'application/pdf' });
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        } else {
          setSnackbar({ open: true, message: `Failed to load ${documentType}`, severity: 'error' });
        }
      } else {
        // Google Drive file - open in Drive viewer
        window.open(`https://drive.google.com/file/d/${fileId}/view`, '_blank');
      }
    } catch (error) {
      console.error(`Error viewing ${documentType}:`, error);
      // Fallback: try opening as Google Drive link
      try {
        window.open(`https://drive.google.com/file/d/${fileId}/view`, '_blank');
      } catch (fallbackError) {
        setSnackbar({ open: true, message: `Failed to open ${documentType}`, severity: 'error' });
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`, color: 'white', borderRadius: 3, boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, 0.3)}`, mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 56, height: 56 }}>
              <ReceiptIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Submit Invoice to Accounts
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Submit invoice documents for payment processing
              </Typography>
            </Box>
          </Box>
          <Chip label={`${pos.length} Purchase Orders`} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 600, fontSize: '0.9rem' }} />
          <Chip label="Step 19" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 600, fontSize: '0.9rem', ml: 2 }} />
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      ) : pos.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8, background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 255, 0.9))', borderRadius: 3, boxShadow: `0 4px 20px ${alpha(theme.palette.success.main, 0.1)}` }}>
          <Box sx={{ mb: 3 }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})` }}>
              <ReceiptIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" sx={{ color: theme.palette.success.main, fontWeight: 600, mb: 1 }}>
              No Purchase Orders Found
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', maxWidth: 400, mx: 'auto' }}>
              There are no purchase orders currently at step 19 (Submit Invoice to Accounts). 
              POs will appear here once they reach this stage.
            </Typography>
          </Box>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {pos.map(po => (
            <Card key={po.POId} sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: `0 4px 20px ${alpha(theme.palette.success.main, 0.1)}`, border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`, transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, 0.2)}` } }}>
              <CardContent sx={{ p: 0 }}>
                {/* PO Header */}
                <Box sx={{ p: 3, background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)}, ${alpha(theme.palette.success.dark, 0.05)})`, borderBottom: `1px solid ${alpha(theme.palette.success.main, 0.1)}` }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: theme.palette.success.main, width: 48, height: 48, boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}` }}>
                          <BusinessIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                            PO #{po.POId}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            Created: {po.CreatedAt ? new Date(po.CreatedAt).toLocaleDateString('en-US') : '-'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), width: 40, height: 40 }}>
                          <PersonIcon sx={{ color: theme.palette.success.main }} />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
                            {po.VendorDetails?.vendorName || 'Vendor Name'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            {po.VendorDetails?.vendorCode || 'Vendor Code'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title={expandedPOs[po.POId] ? "Hide Details" : "View Details"} arrow>
                          <IconButton onClick={() => togglePOExpansion(po.POId)} sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2), transform: 'scale(1.1)' } }}>
                            {expandedPOs[po.POId] ? <VisibilityOffIcon /> : <ViewIcon />}
                          </IconButton>
                        </Tooltip>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          size="small" 
                          onClick={() => handleSubmitInvoice(po)}
                          disabled={submittingInvoice[po.POId]}
                          sx={{ fontWeight: 600, borderRadius: 2, minWidth: 120 }}
                        >
                          {submittingInvoice[po.POId] ? <CircularProgress size={16} /> : 'Submit Invoice'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Expanded Details */}
                <Collapse in={expandedPOs[po.POId]} timeout="auto" unmountOnExit>
                  <Box sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      {/* Vendor Details */}
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                          Vendor Details
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2"><b>Name:</b> {po.VendorDetails?.vendorName}</Typography>
                          <Typography variant="body2"><b>Code:</b> {po.VendorDetails?.vendorCode}</Typography>
                          <Typography variant="body2"><b>Contact:</b> {po.VendorDetails?.vendorContact}</Typography>
                          <Typography variant="body2"><b>Email:</b> {po.VendorDetails?.vendorEmail}</Typography>
                          <Typography variant="body2"><b>Address:</b> {po.VendorDetails?.vendorAddress}</Typography>
                          <Typography variant="body2"><b>GSTIN:</b> {po.VendorDetails?.vendorGSTIN}</Typography>
                          <Typography variant="body2"><b>PAN:</b> {po.VendorDetails?.vendorPAN}</Typography>
                        </Box>
                      </Grid>

                      {/* Items Table */}
                      <Grid item xs={12} md={8}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                          Items
                        </Typography>
                        <TableContainer component={Paper}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Item Code</TableCell>
                                <TableCell>Item Name</TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>Specifications</TableCell>
                                <TableCell>Price</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {po.Items.map((item, idx) => (
                                <TableRow key={item.itemCode || idx}>
                                  <TableCell>{item.itemCode || 'N/A'}</TableCell>
                                  <TableCell>{item.itemName || 'N/A'}</TableCell>
                                  <TableCell>{item.quantity || 'N/A'}</TableCell>
                                  <TableCell>{item.specifications || 'N/A'}</TableCell>
                                  <TableCell>{item.price || 'N/A'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>

                      {/* Documents Section */}
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                          Documents
                        </Typography>
                        <Grid container spacing={2}>
                          {/* Invoice */}
                          <Grid item xs={12} md={4}>
                            <Card sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <DescriptionIcon sx={{ color: theme.palette.success.main }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  Invoice
                                </Typography>
                              </Box>
                              {po.InvoiceFileId ? (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleViewDocument(po.InvoiceFileId, 'Invoice')}
                                  sx={{ color: theme.palette.success.main, borderColor: theme.palette.success.main }}
                                >
                                  View Invoice
                                </Button>
                              ) : (
                                <Chip label="Not Available" size="small" color="error" />
                              )}
                            </Card>
                          </Grid>

                          {/* PO Copy */}
                          <Grid item xs={12} md={4}>
                            <Card sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <DescriptionIcon sx={{ color: theme.palette.success.main }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  PO Copy
                                </Typography>
                              </Box>
                              {po.POCopyFileId ? (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleViewDocument(po.POCopyFileId, 'PO Copy')}
                                  sx={{ color: theme.palette.success.main, borderColor: theme.palette.success.main }}
                                >
                                  View PO Copy
                                </Button>
                              ) : (
                                <Chip label="Not Available" size="small" color="error" />
                              )}
                            </Card>
                          </Grid>

                          {/* GRN */}
                          <Grid item xs={12} md={4}>
                            <Card sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <ReceiptIcon sx={{ color: theme.palette.success.main }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  GRN
                                </Typography>
                              </Box>
                              {po.GRNId && po.GRNFileId ? (
                                <Box>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <b>ID:</b> {po.GRNId}
                                  </Typography>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleViewDocument(po.GRNFileId, 'GRN')}
                                    sx={{ color: theme.palette.success.main, borderColor: theme.palette.success.main }}
                                  >
                                    View GRN
                                  </Button>
                                </Box>
                              ) : (
                                <Chip label="Not Available" size="small" color="error" />
                              )}
                            </Card>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Box>
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
    </Box>
  );
};

export default SubmitInvoice;