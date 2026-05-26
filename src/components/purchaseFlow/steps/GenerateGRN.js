import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Snackbar, Alert, CircularProgress, Card, CardContent, Avatar, Chip, IconButton, Collapse, Grid, Tooltip, useTheme, alpha } from '@mui/material';
import { Assignment as AssignmentIcon, Business as BusinessIcon, Person as PersonIcon, Visibility as ViewIcon, VisibilityOff as VisibilityOffIcon, Receipt as ReceiptIcon, Check as CheckIcon } from '@mui/icons-material';
import purchaseFlowService from '../../../services/purchaseFlowService';
import sheetService from '../../../services/sheetService';
import { useAuth } from '../../../context/AuthContext';
import jsPDF from 'jspdf';

// Function to update stock levels
const updateStockLevels = async (itemCode, quantity, operation) => {
  const stockData = await sheetService.getSheetData("Stock");
  const stockIndex = stockData.findIndex((item) => item.itemCode === itemCode);
  if (stockIndex === -1) {
    throw new Error(
      "Item not found in Stock sheet. Please add it to Stock first."
    );
  }
  const updatedStock = { ...stockData[stockIndex] };
  const currentStock = parseFloat(updatedStock.currentStock) || 0;
  const qty = parseFloat(quantity) || 0;
  updatedStock.currentStock =
    operation === "inward"
      ? (currentStock + qty).toString()
      : (currentStock - qty).toString();
  updatedStock.lastUpdated = new Date().toISOString().split("T")[0];
  await sheetService.updateRow("Stock", stockIndex + 2, updatedStock);
};

// Function to create material inward entries from PO data
const createMaterialInwardEntries = async (po, grnId) => {
  if (!po.Items || !Array.isArray(po.Items) || po.Items.length === 0) {
    console.warn('No items found in PO for material inward creation');
    return [];
  }

  const currentDate = new Date().toISOString().split("T")[0];
  const supplier = po.VendorDetails?.vendorCode || po.VendorDetails?.vendorName || 'Unknown Supplier';
  
  // Get stock items to get unit information
  const stockItems = await sheetService.getSheetData("Stock");
  
  const materialInwardEntries = [];
  
  for (const item of po.Items) {
    try {
      const itemCode = item.itemCode || item.ItemCode;
      const itemName = item.itemName || item.ItemName || item.item || item.Item || '';
      const quantity = item.quantity || item.Quantity || '0';
      
      if (!itemCode) {
        console.warn('Skipping item without itemCode:', item);
        continue;
      }
      
      // Find stock item to get unit
      const stockItem = stockItems.find(si => si.itemCode === itemCode);
      const unit = stockItem?.unit || item.unit || item.Unit || 'PCS';
      
      // Create material inward entry
      const materialInwardEntry = {
        date: currentDate,
        itemCode: itemCode,
        itemName: itemName,
        quantity: parseFloat(quantity).toString(),
        unit: unit,
        supplier: supplier,
        status: "Completed", // Set as Completed so stock is updated automatically
        lastUpdated: currentDate,
        // Additional fields for tracking
        poId: po.POId || '',
        grnId: grnId || '',
        source: 'Purchase Flow - GRN'
      };
      
      // Add to Material Inward sheet
      await sheetService.appendRow("Material Inward", materialInwardEntry);
      materialInwardEntries.push(materialInwardEntry);
      
      // Update stock levels (since status is Completed)
      await updateStockLevels(itemCode, quantity, "inward");
      
    } catch (error) {
      console.error(`Error creating material inward entry for item ${item.itemCode || 'unknown'}:`, error);
      // Continue with other items even if one fails
    }
  }
  
  return materialInwardEntries;
};

const GenerateGRN = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPOs, setExpandedPOs] = useState({});
  const [generatingGRN, setGeneratingGRN] = useState({});
  const [grnGenerated, setGrnGenerated] = useState({}); // Track which POs have GRN generated
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchPOs();
  }, []);

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const posData = await purchaseFlowService.getPOsForGenerateGRN();
      setPos(posData);
      
      // Check which POs already have GRN generated
      const grnStatus = {};
      try {
        const generateGRNData = await sheetService.getSheetData('GenerateGRN');
        posData.forEach(po => {
          const grnData = generateGRNData.find(grn => grn.POId === po.POId);
          if (grnData && grnData.Details) {
            try {
              const details = JSON.parse(grnData.Details);
              if (details.GRNId) {
                grnStatus[po.POId] = true;
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        });
      } catch (error) {
        console.warn('Error checking GRN status:', error);
      }
      setGrnGenerated(grnStatus);
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

  const handleGenerateGRN = async (po) => {
    setGeneratingGRN(prev => ({ ...prev, [po.POId]: true }));
    try {
      // Generate GRN ID
      const grnId = `GRN-${po.POId}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      const currentDate = new Date().toLocaleDateString('en-US');
      
      // Generate PDF content
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('GOODS RECEIPT NOTE (GRN)', 105, 20, { align: 'center' });
      
      // Company details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Reyansh Electronics Pvt. Ltd.', 20, 35);
      doc.text('Date: ' + currentDate, 20, 45);
      doc.text('GRN No: ' + grnId, 20, 55);
      doc.text('PO No: ' + po.POId, 20, 65);
      
      // Vendor details
      doc.text('Vendor Details:', 20, 85);
      doc.setFontSize(10);
      doc.text('Name: ' + (po.VendorDetails?.vendorName || 'N/A'), 25, 95);
      doc.text('Code: ' + (po.VendorDetails?.vendorCode || 'N/A'), 25, 105);
      doc.text('Contact: ' + (po.VendorDetails?.vendorContact || 'N/A'), 25, 115);
      doc.text('Email: ' + (po.VendorDetails?.vendorEmail || 'N/A'), 25, 125);
      doc.text('Address: ' + (po.VendorDetails?.vendorAddress || 'N/A'), 25, 135);
      doc.text('GSTIN: ' + (po.VendorDetails?.vendorGSTIN || 'N/A'), 25, 145);
      
      // Items table header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Received Items:', 20, 165);
      
      // Table headers
      doc.setFontSize(10);
      doc.text('S.No', 20, 180);
      doc.text('Item Code', 40, 180);
      doc.text('Item Name', 80, 180);
      doc.text('Quantity', 130, 180);
      doc.text('Specifications', 160, 180);
      
      // Items data
      doc.setFont('helvetica', 'normal');
      po.Items.forEach((item, index) => {
        const yPos = 190 + (index * 10);
        doc.text((index + 1).toString(), 20, yPos);
        doc.text(item.itemCode || 'N/A', 40, yPos);
        doc.text(item.itemName || 'N/A', 80, yPos);
        doc.text(item.quantity || 'N/A', 130, yPos);
        doc.text(item.specifications || 'N/A', 160, yPos);
      });
      
      // Quality check section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Quality Check:', 20, 250 + (po.Items.length * 10));
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('✓ Material received in good condition', 25, 260 + (po.Items.length * 10));
      doc.text('✓ Quantity matches PO specifications', 25, 270 + (po.Items.length * 10));
      doc.text('✓ Quality standards met', 25, 280 + (po.Items.length * 10));
      
      // Signatures
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Authorized Signature', 30, 310 + (po.Items.length * 10));
      doc.text('Vendor Signature', 130, 310 + (po.Items.length * 10));
      
      // Signature lines
      doc.setDrawColor(44, 62, 80);
      doc.line(25, 315 + (po.Items.length * 10), 60, 315 + (po.Items.length * 10));
      doc.line(125, 315 + (po.Items.length * 10), 160, 315 + (po.Items.length * 10));
      
      // Save the PDF locally for user download
      const fileName = `${grnId}_${currentDate.replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
      
      // Convert PDF to blob for upload to backend
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      // Get or create GRN folder in Google Drive for organized storage
      const grnFolderId = await sheetService.getOrCreateFolder('GRN Documents');
      
      // Get or create PO-specific subfolder for better organization
      let poFolderId = null;
      if (grnFolderId && po.POId) {
        poFolderId = await sheetService.getOrCreateFolder(po.POId, grnFolderId);
      }
      
      // Use PO folder if available, otherwise use GRN folder, otherwise null (root)
      const targetFolderId = poFolderId || grnFolderId;
      
      // Upload PDF to Google Drive and get file ID
      const fileId = await sheetService.uploadFile(pdfFile, targetFolderId);
      
      // Save to backend GenerateGRN sheet
      await sheetService.appendRow('GenerateGRN', {
        POId: po.POId,
        Details: JSON.stringify({
          GRNId: grnId,
          VendorDetails: po.VendorDetails,
          Items: po.Items,
          GRNFileId: fileId,
          GeneratedBy: user?.email || 'system',
          GeneratedAt: new Date().toISOString()
        }),
        CreatedBy: user?.email || 'system',
        CreatedAt: new Date().toISOString()
      });
      
      setSnackbar({ open: true, message: `GRN ${grnId} generated, downloaded, and saved to Google Drive!`, severity: 'success' });
      
      // Mark GRN as generated for this PO
      setGrnGenerated(prev => ({ ...prev, [po.POId]: true }));
    } catch (error) {
      console.error('Error generating GRN:', error);
      setSnackbar({ open: true, message: 'Failed to generate GRN', severity: 'error' });
    }
    setGeneratingGRN(prev => ({ ...prev, [po.POId]: false }));
  };

  const handleCompleteStep = async (po) => {
    // Check if GRN has been generated (mandatory)
    if (!grnGenerated[po.POId]) {
      setSnackbar({ 
        open: true, 
        message: 'Please generate GRN before completing this step. GRN generation is mandatory.', 
        severity: 'warning' 
      });
      return;
    }
    
    setLoading(true);
    try {
      // Get GRN ID from GenerateGRN sheet
      let grnId = null;
      try {
        const generateGRNData = await sheetService.getSheetData('GenerateGRN');
        const grnData = generateGRNData.find(grn => grn.POId === po.POId);
        if (grnData && grnData.Details) {
          try {
            const details = JSON.parse(grnData.Details);
            grnId = details.GRNId || null;
          } catch (e) {
            console.warn('Error parsing GRN details:', e);
          }
        }
      } catch (error) {
        console.warn('Error fetching GRN data:', error);
      }
      
      // Double-check: if GRN ID is still null, don't proceed
      if (!grnId) {
        setSnackbar({ 
          open: true, 
          message: 'GRN not found. Please generate GRN before completing this step.', 
          severity: 'error' 
        });
        setLoading(false);
        return;
      }

      // Create material inward entries if GRN exists
      let materialInwardCreated = false;
      if (grnId) {
        try {
          const createdEntries = await createMaterialInwardEntries(po, grnId);
          if (createdEntries && createdEntries.length > 0) {
            materialInwardCreated = true;
            console.log(`Created ${createdEntries.length} material inward entries for PO ${po.POId} with GRN ${grnId}`);
          }
        } catch (materialError) {
          console.error('Error creating material inward entries:', materialError);
          // Continue with flow update even if material inward creation fails
        }
      }

      // Update SortVendor row: stepId 17, nextStep 18 (Final GRN), action, assigned to Store Manager
      const sortVendorData = await sheetService.getSheetData('SortVendor');
      const poData = sortVendorData.find(row => row.POId === po.POId);
      if (poData) {
        const poRowIndex = sortVendorData.indexOf(poData) + 2;
        await sheetService.updateRow('SortVendor', poRowIndex, {
          ...poData,
          StepId: 17,
          NextStep: 18,
          Action: 'Final GRN',
          AssignedTo: 'Store Manager',
          LastModifiedBy: user?.email || 'system',
          LastModifiedAt: new Date().toISOString()
        });
        
        const successMessage = materialInwardCreated 
          ? `Step completed! Material inward entries created and stock updated.`
          : 'Step completed and flow updated!';
        
        setSnackbar({ open: true, message: successMessage, severity: 'success' });
        setPos(prev => prev.filter(p => p.POId !== po.POId));
      }
    } catch (err) {
      console.error('Error completing step:', err);
      setSnackbar({ open: true, message: 'Failed to update flow: ' + err.message, severity: 'error' });
    }
    setLoading(false);
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
                Generate GRN
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Generate Goods Receipt Notes for approved materials
              </Typography>
            </Box>
          </Box>
          <Chip label={`${pos.length} Purchase Orders`} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 600, fontSize: '0.9rem' }} />
          <Chip label="Step 17" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 600, fontSize: '0.9rem', ml: 2 }} />
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
              There are no purchase orders currently at step 17 (Generate GRN). 
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
                        <Tooltip title="Generate GRN" arrow>
                          <IconButton 
                            onClick={() => handleGenerateGRN(po)} 
                            disabled={generatingGRN[po.POId]}
                            sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2), transform: 'scale(1.1)' } }}
                          >
                            {generatingGRN[po.POId] ? <CircularProgress size={20} /> : <ReceiptIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip 
                          title={!grnGenerated[po.POId] ? "Generate GRN first (mandatory)" : "Complete this step"}
                          arrow
                        >
                          <span>
                            <Button 
                              variant="contained" 
                              color="success" 
                              size="small" 
                              onClick={() => handleCompleteStep(po)} 
                              disabled={!grnGenerated[po.POId] || loading}
                              sx={{ 
                                fontWeight: 600, 
                                borderRadius: 2, 
                                minWidth: 120,
                                opacity: !grnGenerated[po.POId] ? 0.6 : 1
                              }}
                            >
                              Complete Step
                            </Button>
                          </span>
                        </Tooltip>
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
                          Items for GRN
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

export default GenerateGRN; 