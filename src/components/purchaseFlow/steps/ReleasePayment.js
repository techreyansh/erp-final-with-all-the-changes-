import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Snackbar, Alert, CircularProgress, Card, CardContent, Avatar, Chip, IconButton, Collapse, Grid, Tooltip, useTheme, alpha } from '@mui/material';
import { Assignment as AssignmentIcon, Business as BusinessIcon, Person as PersonIcon, Visibility as ViewIcon, VisibilityOff as VisibilityOffIcon, Payment as PaymentIcon, Check as CheckIcon, CalendarToday as CalendarIcon, AccountBalance as BankIcon } from '@mui/icons-material';
import purchaseFlowService from '../../../services/purchaseFlowService';
import sheetService from '../../../services/sheetService';
import { useAuth } from '../../../context/AuthContext';

const ReleasePayment = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPOs, setExpandedPOs] = useState({});
  const [releasingPayment, setReleasingPayment] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchPOs();
  }, []);

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const posData = await purchaseFlowService.getPOsForApproveReleasePayment();
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const handlePaymentReleased = async (po) => {
    setReleasingPayment(prev => ({ ...prev, [po.POId]: true }));
    try {
      // Update SortVendor row: stepId 21, action "Approve & Release Payment", assigned to "-", next step "-"
      const sortVendorData = await sheetService.getSheetData('SortVendor');
      const poData = sortVendorData.find(row => row.POId === po.POId);
      if (poData) {
        const poRowIndex = sortVendorData.indexOf(poData) + 2;
        await sheetService.updateRow('SortVendor', poRowIndex, {
          ...poData,
          StepId: 21,
          NextStep: '-',
          Action: 'Approve & Release Payment',
          AssignedTo: '-',
          LastModifiedBy: user?.email || 'system',
          LastModifiedAt: new Date().toISOString()
        });
        setSnackbar({ open: true, message: `Payment released successfully for PO ${po.POId}!`, severity: 'success' });
        setPos(prev => prev.filter(p => p.POId !== po.POId));
      }
    } catch (err) {
      console.error('Error releasing payment:', err);
      setSnackbar({ open: true, message: 'Failed to release payment', severity: 'error' });
    }
    setReleasingPayment(prev => ({ ...prev, [po.POId]: false }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ background: 'linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)', color: 'white', borderRadius: 3, boxShadow: '0 8px 32px ${alpha(theme.palette.success.main, 0.3)', mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 56, height: 56 }}>
              <PaymentIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Approve & Release Payment
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Step 21: Approve and release payments for scheduled purchase orders
              </Typography>
            </Box>
          </Box>
          <Chip label={`${pos.length} Purchase Orders`} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 600, fontSize: '0.9rem' }} />
          <Chip label="Step 21" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 600, fontSize: '0.9rem', ml: 2 }} />
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      ) : pos.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8, background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 255, 0.9))', borderRadius: 3, boxShadow: '0 4px 20px ${alpha(theme.palette.success.main, 0.1)' }}>
          <Box sx={{ mb: 3 }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, background: 'linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})' }}>
              <PaymentIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" sx={{ color: '${theme.palette.success.main}', fontWeight: 600, mb: 1 }}>
              No Purchase Orders Found
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', maxWidth: 400, mx: 'auto' }}>
              There are no purchase orders currently at step 21 (Approve & Release Payment). 
              POs will appear here once they reach this stage after payment scheduling.
            </Typography>
          </Box>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {pos.map(po => (
            <Card key={po.POId} sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px ${alpha(theme.palette.success.main, 0.1)', border: '1px solid ${alpha(theme.palette.success.main, 0.1)', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 32px ${alpha(theme.palette.success.main, 0.2)' } }}>
              <CardContent sx={{ p: 0 }}>
                {/* PO Header */}
                <Box sx={{ p: 3, background: 'linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05), ${alpha(theme.palette.success.dark, 0.05))', borderBottom: '1px solid ${alpha(theme.palette.success.main, 0.1)' }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '${theme.palette.success.main}', width: 48, height: 48, boxShadow: '0 4px 12px ${alpha(theme.palette.success.main, 0.3)' }}>
                          <BusinessIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '${theme.palette.success.main}' }}>
                            PO #{po.POId}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            Created: {po.CreatedAt ? new Date(po.CreatedAt).toLocaleDateString('en-US') : '-'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '${alpha(theme.palette.success.main, 0.1)', width: 40, height: 40 }}>
                          <PersonIcon sx={{ color: '${theme.palette.success.main}' }} />
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
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon sx={{ color: '${theme.palette.success.main}' }} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '${theme.palette.success.main}' }}>
                            Payment Due Date
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            {po.ScheduledPaymentDate ? formatDate(po.ScheduledPaymentDate) : 'Not Scheduled'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title={expandedPOs[po.POId] ? "Hide Details" : "View Details"} arrow>
                          <IconButton onClick={() => togglePOExpansion(po.POId)} sx={{ bgcolor: '${alpha(theme.palette.success.main, 0.1)', color: '${theme.palette.success.main}', '&:hover': { bgcolor: '${alpha(theme.palette.success.main, 0.2)', transform: 'scale(1.1)' } }}>
                            {expandedPOs[po.POId] ? <VisibilityOffIcon /> : <ViewIcon />}
                          </IconButton>
                        </Tooltip>
                        <Button 
                          variant="contained" 
                          color="success" 
                          size="small" 
                          onClick={() => handlePaymentReleased(po)}
                          disabled={releasingPayment[po.POId]}
                          sx={{ fontWeight: 600, borderRadius: 2, minWidth: 140 }}
                        >
                          {releasingPayment[po.POId] ? <CircularProgress size={16} /> : 'Payment Released'}
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

                      {/* Payment Schedule Info */}
                      <Grid item xs={12}>
                        <Card sx={{ bgcolor: '${alpha(theme.palette.success.main, 0.05)', border: '1px solid ${alpha(theme.palette.success.main, 0.2)' }}>
                          <CardContent sx={{ py: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '${theme.palette.success.main}' }}>
                                  Scheduled Payment Date
                                </Typography>
                                <Typography variant="body2">
                                  {po.ScheduledPaymentDate ? formatDate(po.ScheduledPaymentDate) : 'Not Available'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '${theme.palette.success.main}' }}>
                                  Scheduled By
                                </Typography>
                                <Typography variant="body2">
                                  {po.ScheduledBy || 'Not Available'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '${theme.palette.success.main}' }}>
                                  Payment Status
                                </Typography>
                                <Chip 
                                  label="Ready for Release" 
                                  color="warning" 
                                  size="small"
                                  icon={<BankIcon />}
                                />
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
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

export default ReleasePayment; 