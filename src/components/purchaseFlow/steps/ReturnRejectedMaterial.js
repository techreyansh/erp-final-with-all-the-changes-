import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Snackbar, Alert, CircularProgress, Card, CardContent, Avatar, Chip, IconButton, Tooltip, Collapse, Grid, Divider, useTheme, alpha
} from '@mui/material';
import { Assignment as AssignmentIcon, Business as BusinessIcon, Person as PersonIcon, Visibility as ViewIcon, VisibilityOff as VisibilityOffIcon, Email as EmailIcon, Check as CheckIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material';
import { useAuth } from '../../../context/AuthContext';
import purchaseFlowService from '../../../services/purchaseFlowService';
import sheetService from '../../../services/sheetService';
import jsPDF from 'jspdf';

const tableColumns = [
  'IndentNumber', 'ItemName', 'Specifications', 'Quantity', 'Price', 'VendorCode', 'VendorName', 'VendorContact', 'VendorEmail', 'Status', 'RejectionNote'
];

// Company details for the challan
const companyDetails = {
  name: 'REYANSH ELECTRONICS PRIVATE LIMITED',
  address: 'J-61 Sector-63 , Noida',
  city: ' Uttar Pradesh - 201301',
  phone: '+91-9818079750',
  email: 'REYANSHINTERNATIONAL63@GMAIL.COM',
  website: 'www.reyanshelectronics.com',
  gstin: '09AAECR0689R1ZH',
  pan: 'AAECR0689R'
};

const ReturnRejectedMaterial = () => {
  const theme = useTheme();
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [expandedPOs, setExpandedPOs] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    const fetchPOs = async () => {
      setLoading(true);
      try {
        const result = await purchaseFlowService.getPOsForReturnRejectedMaterial();
        setPos(result);
      } catch (err) {
        setSnackbar({ open: true, message: 'Failed to fetch POs', severity: 'error' });
      }
      setLoading(false);
    };
    fetchPOs();
  }, []);

  const togglePOExpansion = (poId) => {
    setExpandedPOs(prev => ({ ...prev, [poId]: !prev[poId] }));
  };

  const handleSendEmail = (po) => {
    const subject = encodeURIComponent('Return Challan for PO ' + po.POId);
    const body = encodeURIComponent(`Dear ${po.VendorDetails.vendorName},\n\nPlease find the return challan attached for your rejected material.\n\nRegards,\nTeam`);
    const mailto = `mailto:${po.VendorDetails.vendorEmail}?subject=${subject}&body=${body}`;
    window.open(mailto, '_blank');
  };

  const handleGenerateChallan = async (po) => {
    setLoading(true);
    try {
      // Generate PDF content
      const doc = new jsPDF();
      const currentDate = new Date().toLocaleDateString('en-US');
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('RETURN MATERIAL CHALLAN', 105, 20, { align: 'center' });
      
      // Company details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Reyansh Electronics Pvt. Ltd.', 20, 35);
      doc.text('Date: ' + currentDate, 20, 45);
      doc.text('Challan No: RC-' + po.POId, 20, 55);
      
      // Vendor details
      doc.text('Vendor Details:', 20, 75);
      doc.setFontSize(10);
      doc.text('Name: ' + (po.VendorDetails?.vendorName || 'N/A'), 25, 85);
      doc.text('Code: ' + (po.VendorDetails?.vendorCode || 'N/A'), 25, 95);
      doc.text('Contact: ' + (po.VendorDetails?.vendorContact || 'N/A'), 25, 105);
      doc.text('Email: ' + (po.VendorDetails?.vendorEmail || 'N/A'), 25, 115);
      doc.text('Address: ' + (po.VendorDetails?.vendorAddress || 'N/A'), 25, 125);
      
      // Items table header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Items to be Returned:', 20, 150);
      
      // Table headers
      doc.setFontSize(10);
      doc.text('S.No', 20, 165);
      doc.text('Item Code', 40, 165);
      doc.text('Item Name', 80, 165);
      doc.text('Quantity', 130, 165);
      doc.text('Specifications', 160, 165);
      
      // Items data
      doc.setFont('helvetica', 'normal');
      po.Items.forEach((item, index) => {
        const yPos = 175 + (index * 10);
        doc.text((index + 1).toString(), 20, yPos);
        doc.text(item.itemCode || 'N/A', 40, yPos);
        doc.text(item.itemName || 'N/A', 80, yPos);
        doc.text(item.quantity || 'N/A', 130, yPos);
        doc.text(item.specifications || 'N/A', 160, yPos);
      });
      
      // Rejection note
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Rejection Note:', 20, 250 + (po.Items.length * 10));
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(po.RejectionNote || 'Material rejected during inspection', 25, 260 + (po.Items.length * 10));
      
      // Signatures
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Authorized Signature', 30, 290 + (po.Items.length * 10));
      doc.text('Vendor Signature', 130, 290 + (po.Items.length * 10));
      
      // Signature lines
      doc.setDrawColor(44, 62, 80);
      doc.line(25, 295 + (po.Items.length * 10), 60, 295 + (po.Items.length * 10));
      doc.line(125, 295 + (po.Items.length * 10), 160, 295 + (po.Items.length * 10));
      
      // Save the PDF locally for user download
      const fileName = `ReturnChallan_${po.POId}_${currentDate.replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
      
      // Convert PDF to blob for upload to backend
      const pdfBlob = doc.output('blob');
      
      // Create a File object from the blob for upload
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      // Upload PDF to Google Drive and get file ID
      const fileId = await sheetService.uploadFile(pdfFile);
      
      // Save to backend (initialize sheet if needed)
      await purchaseFlowService.initializeReturnMaterialSheet?.();
      await sheetService.appendRow('ReturnMaterial', {
        POId: po.POId,
        Details: JSON.stringify({
          VendorDetails: po.VendorDetails,
          Items: po.Items,
          RejectionNote: po.RejectionNote,
          ChallanFileId: fileId, // Save the PDF file ID
          GeneratedBy: user?.email || 'system',
          GeneratedAt: new Date().toISOString()
        }),
        CreatedBy: user?.email || 'system',
        CreatedAt: new Date().toISOString()
      });
      
      setSnackbar({ open: true, message: 'Challan generated, downloaded, and saved to backend!', severity: 'success' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setSnackbar({ open: true, message: 'Failed to generate/save challan', severity: 'error' });
    }
    setLoading(false);
  };

  const handleCompleteStep = async (po) => {
    setLoading(true);
    try {
      // Update SortVendor row: stepId 15, nextStep 16, action, assigned to
      const sortVendorData = await sheetService.getSheetData('SortVendor');
      const poData = sortVendorData.find(row => row.POId === po.POId);
      if (poData) {
        const poRowIndex = sortVendorData.indexOf(poData) + 2;
        await sheetService.updateRow('SortVendor', poRowIndex, {
          ...poData,
          StepId: 15,
          NextStep: 16,
          Action: 'Return Rejected Material',
          AssignedTo: 'Purchase Executive',
          LastModifiedBy: user?.email || 'system',
          LastModifiedAt: new Date().toISOString()
        });
        setSnackbar({ open: true, message: 'Step completed and flow updated!', severity: 'success' });
        setPos(prev => prev.filter(p => p.POId !== po.POId));
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update flow', severity: 'error' });
    }
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ background: 'linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)', color: 'white', borderRadius: 3, boxShadow: '0 8px 32px ${alpha(theme.palette.success.main, 0.3)', mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 56, height: 56 }}>
              <AssignmentIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Return Rejected Material
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Review rejected POs, generate challan, and complete the step
              </Typography>
            </Box>
          </Box>
          <Chip label={`${pos.length} Purchase Orders`} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 600, fontSize: '0.9rem' }} />
          <Chip label="Step 15" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 600, fontSize: '0.9rem', ml: 2 }} />
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
              <AssignmentIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" sx={{ color: '${theme.palette.success.main}', fontWeight: 600, mb: 1 }}>
              No Purchase Orders Found
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', maxWidth: 400, mx: 'auto' }}>
              There are no purchase orders currently at step 15 (Return Rejected Material). 
              POs will appear here once they reach this stage.
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
                    <Grid item xs={12} md={4}>
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
                    <Grid item xs={12} md={4}>
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
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title={expandedPOs[po.POId] ? "Hide Details" : "View Details"} arrow>
                          <IconButton onClick={() => togglePOExpansion(po.POId)} sx={{ bgcolor: '${alpha(theme.palette.success.main, 0.1)', color: '${theme.palette.success.main}', '&:hover': { bgcolor: '${alpha(theme.palette.success.main, 0.2)', transform: 'scale(1.1)' } }}>
                            {expandedPOs[po.POId] ? <VisibilityOffIcon /> : <ViewIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Send Email to Vendor" arrow>
                          <IconButton onClick={() => handleSendEmail(po)} sx={{ bgcolor: '${alpha(theme.palette.success.main, 0.1)', color: '${theme.palette.success.main}', '&:hover': { bgcolor: '${alpha(theme.palette.success.main, 0.2)', transform: 'scale(1.1)' } }}>
                            <EmailIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Generate Challan" arrow>
                          <IconButton onClick={() => handleGenerateChallan(po)} sx={{ bgcolor: '${alpha(theme.palette.success.main, 0.1)', color: '${theme.palette.success.main}', '&:hover': { bgcolor: '${alpha(theme.palette.success.main, 0.2)', transform: 'scale(1.1)' } }}>
                            <PdfIcon />
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
                                  <TableCell>{item.itemCode}</TableCell>
                                  <TableCell>{item.itemName}</TableCell>
                                  <TableCell>{item.quantity}</TableCell>
                                  <TableCell>{item.specifications}</TableCell>
                                  <TableCell>{item.price}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                    </Grid>
                    {/* Rejection Note */}
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        Rejection Note
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: '#fffbe6', border: '1px solid #ffe082', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: '#b26a00' }}>{po.RejectionNote || 'No rejection note provided.'}</Typography>
                      </Paper>
                    </Box>
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

export default ReturnRejectedMaterial; 