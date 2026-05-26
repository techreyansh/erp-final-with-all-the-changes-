import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Snackbar, Alert, CircularProgress, Card, CardContent, Avatar, Chip, IconButton, Collapse, Grid, Tooltip, useTheme, alpha } from '@mui/material';
import { Assignment as AssignmentIcon, Business as BusinessIcon, Person as PersonIcon, Visibility as ViewIcon, VisibilityOff as VisibilityOffIcon, Email as EmailIcon, Check as CheckIcon } from '@mui/icons-material';
import purchaseFlowService from '../../../services/purchaseFlowService';
import sheetService from '../../../services/sheetService';
import { useAuth } from '../../../context/AuthContext';

const ResendMaterial = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPOs, setExpandedPOs] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchPOs();
  }, []);

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const posData = await purchaseFlowService.getPOsForResendMaterial();
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

  const handleSendEmail = (po) => {
    const subject = `Material Resend Request - PO ${po.POId}`;
    const body = `Dear ${po.VendorDetails?.vendorName || 'Vendor'},

We are requesting you to resend the following materials that were rejected during inspection:

Purchase Order: ${po.POId}
Rejection Note: ${po.RejectionNote || 'Quality issues detected during inspection'}

Please ensure the replacement materials meet our quality standards and specifications.

Best regards,
Reyansh Electronics Pvt. Ltd.`;

    const mailtoLink = `mailto:${po.VendorDetails?.vendorEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const handleCompleteStep = async (po) => {
    setLoading(true);
    try {
      // Update SortVendor row: stepId 16, nextStep 11, action, assigned to QC Manager
      const sortVendorData = await sheetService.getSheetData('SortVendor');
      const poData = sortVendorData.find(row => row.POId === po.POId);
      if (poData) {
        const poRowIndex = sortVendorData.indexOf(poData) + 2;
        await sheetService.updateRow('SortVendor', poRowIndex, {
          ...poData,
          StepId: 16,
          NextStep: 12,
          Action: 'Resend Material',
          AssignedTo: 'QC Manager',
          LastModifiedBy: user?.email || 'system',
          LastModifiedAt: new Date().toISOString()
        });
        setSnackbar({ open: true, message: 'Step completed and flow updated!', severity: 'success' });
        setPos(prev => prev.filter(p => p.POId !== po.POId));
      }
    } catch (err) {
      console.error('Error completing step:', err);
      setSnackbar({ open: true, message: 'Failed to update flow', severity: 'error' });
    }
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`, color: 'white', borderRadius: 3, boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, 0.3)}`, mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 56, height: 56 }}>
              <AssignmentIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Resend Material
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Review rejected materials and request resend from vendors
              </Typography>
            </Box>
          </Box>
          <Chip label={`${pos.length} Purchase Orders`} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 600, fontSize: '0.9rem' }} />
          <Chip label="Step 16" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 600, fontSize: '0.9rem', ml: 2 }} />
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
              <AssignmentIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" sx={{ color: theme.palette.success.main, fontWeight: 600, mb: 1 }}>
              No Purchase Orders Found
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', maxWidth: 400, mx: 'auto' }}>
              There are no purchase orders currently at step 16 (Resend Material). 
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
                        <Tooltip title="Send Email to Vendor" arrow>
                          <IconButton onClick={() => handleSendEmail(po)} sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2), transform: 'scale(1.1)' } }}>
                            <EmailIcon />
                          </IconButton>
                        </Tooltip>
                        <Button variant="contained" color="success" size="small" onClick={() => handleCompleteStep(po)} sx={{ fontWeight: 600, borderRadius: 2, minWidth: 120 }}>
                          Complete Step
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
                          Items to be Resent
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

                      {/* Rejection Note */}
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                          Rejection Note
                        </Typography>
                        <Card sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
                          <CardContent sx={{ py: 2 }}>
                            <Typography variant="body2" sx={{ color: '#d32f2f' }}>
                              {po.RejectionNote || 'No rejection note available'}
                            </Typography>
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

export default ResendMaterial; 