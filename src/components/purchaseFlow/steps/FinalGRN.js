import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Snackbar, Alert, CircularProgress, Card, CardContent, Avatar, Chip, IconButton, Collapse, Grid, Tooltip, useTheme, alpha, TextField } from '@mui/material';
import { Business as BusinessIcon, Person as PersonIcon, Visibility as ViewIcon, VisibilityOff as VisibilityOffIcon, Receipt as ReceiptIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import purchaseFlowService from '../../../services/purchaseFlowService';
import sheetService from '../../../services/sheetService';
import { useAuth } from '../../../context/AuthContext';

// Ensure "Material Inward" sheet exists before we try to write GRN-based entries
const ensureMaterialInwardSheet = async () => {
  try {
    await sheetService.createSheetIfNotExists("Material Inward");
  } catch (error) {
    console.error('Error ensuring "Material Inward" sheet exists:', error);
    // Log and continue so Final GRN UI does not crash; write calls may still fail
  }
};

// Function to update stock levels (same as MaterialInwardRegister)
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
const createMaterialInwardEntries = async (po, grnId = null) => {
  // Normalize PO items into an array (supports string, object, or array)
  let itemsArray = po.Items;

  try {
    // Make sure the target sheet exists
    await ensureMaterialInwardSheet();

    if (!itemsArray) {
      console.warn('No Items field on PO for material inward creation:', po.POId || po.id);
      return;
    }

    // If Items is a JSON string, parse it
    if (typeof itemsArray === 'string') {
      try {
        itemsArray = JSON.parse(itemsArray);
      } catch (e) {
        console.warn('Failed to parse PO.Items JSON for material inward creation:', e);
        return;
      }
    }

    // If Items is an object (keyed by itemCode), convert to array
    if (itemsArray && !Array.isArray(itemsArray) && typeof itemsArray === 'object') {
      itemsArray = Object.values(itemsArray);
    }

    if (!Array.isArray(itemsArray) || itemsArray.length === 0) {
      console.warn('Items array is empty or invalid for material inward creation. PO:', po.POId || po.id);
      return;
    }
  } catch (e) {
    console.warn('Unexpected error normalizing PO.Items for material inward creation:', e);
    return;
  }

  const currentDate = new Date().toISOString().split("T")[0];
  const supplier = po.VendorDetails?.vendorCode || po.VendorDetails?.vendorName || 'Unknown Supplier';
  
  // Get stock items to get unit information
  const stockItems = await sheetService.getSheetData("Stock");
  
  const materialInwardEntries = [];
  
  for (const item of itemsArray) {
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
        grnId: grnId || po.GRNId || '',
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

const FinalGRN = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPOs, setExpandedPOs] = useState({});
  const [grnNotes, setGrnNotes] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchPOs();
  }, []);

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const posData = await purchaseFlowService.getPOsForFinalGRN();
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

  const handleGrnNoteChange = (poId, note) => {
    setGrnNotes(prev => ({
      ...prev,
      [poId]: note
    }));
  };

  const handleCompleteStep = async (po) => {
    setLoading(true);
    try {
      // Get GRN ID from GenerateGRN sheet
      let grnId = po.GRNId || null;
      if (!grnId) {
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
      }

      // Create material inward entries for all items in the PO with GRN ID
      let materialInwardCreated = false;
      try {
        const createdEntries = await createMaterialInwardEntries(po, grnId);
        if (createdEntries && createdEntries.length > 0) {
          materialInwardCreated = true;
          console.log(`Created ${createdEntries.length} material inward entries for PO ${po.POId} with GRN ${grnId || 'N/A'}`);
        }
      } catch (materialError) {
        console.error('Error creating material inward entries:', materialError);
        // Continue with flow update even if material inward creation fails
      }
      
      // Update SortVendor row: stepId 18, nextStep 19 (Submit Invoice), action, assigned to Purchase Executive
      const sortVendorData = await sheetService.getSheetData('SortVendor');
      const poData = sortVendorData.find(row => row.POId === po.POId);
      if (poData) {
        const poRowIndex = sortVendorData.indexOf(poData) + 2;
        
        // Update GenerateGRN sheet with final GRN note if provided
        if (grnNotes[po.POId]) {
          const generateGRNData = await sheetService.getSheetData('GenerateGRN');
          const grnData = generateGRNData.find(grn => grn.POId === po.POId);
          if (grnData) {
            const grnRowIndex = generateGRNData.indexOf(grnData) + 2;
            let grnDetails = {};
            try {
              grnDetails = JSON.parse(grnData.Details || '{}');
            } catch {}
            
            await sheetService.updateRow('GenerateGRN', grnRowIndex, {
              ...grnData,
              Details: JSON.stringify({
                ...grnDetails,
                GRNNote: grnNotes[po.POId],
                FinalizedBy: user?.email || 'system',
                FinalizedAt: new Date().toISOString()
              })
            });
          }
        }
        
        await sheetService.updateRow('SortVendor', poRowIndex, {
          ...poData,
          StepId: 18,
          NextStep: 19,
          Action: 'Submit Invoice to Accounts',
          AssignedTo: 'Purchase Executive',
          LastModifiedBy: user?.email || 'system',
          LastModifiedAt: new Date().toISOString()
        });
        
        const successMessage = materialInwardCreated 
          ? `Final GRN completed! Material inward entries created and stock updated.`
          : 'Final GRN completed and flow updated!';
        
        setSnackbar({ open: true, message: successMessage, severity: 'success' });
        setPos(prev => prev.filter(p => p.POId !== po.POId));
        setGrnNotes(prev => {
          const newNotes = { ...prev };
          delete newNotes[po.POId];
          return newNotes;
        });
      }
    } catch (err) {
      console.error('Error completing step:', err);
      setSnackbar({ open: true, message: 'Failed to update flow: ' + err.message, severity: 'error' });
    }
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`, color: 'white', borderRadius: 3, boxShadow: `0 8px 32px ${alpha(theme.palette.info.main, 0.3)}`, mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 56, height: 56 }}>
              <CheckCircleIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Final GRN
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Complete goods receipt documentation and add final notes
              </Typography>
            </Box>
          </Box>
          <Chip label={`${pos.length} Purchase Orders`} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 600, fontSize: '0.9rem' }} />
          <Chip label="Step 18" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 600, fontSize: '0.9rem', ml: 2 }} />
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      ) : pos.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8, background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 255, 0.9))', borderRadius: 3, boxShadow: `0 4px 20px ${alpha(theme.palette.info.main, 0.1)}` }}>
          <Box sx={{ mb: 3 }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})` }}>
              <CheckCircleIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" sx={{ color: theme.palette.info.main, fontWeight: 600, mb: 1 }}>
              No Purchase Orders Found
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', maxWidth: 400, mx: 'auto' }}>
              There are no purchase orders currently at step 18 (Final GRN). 
              POs will appear here once GRN is generated in step 17.
            </Typography>
          </Box>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {pos.map(po => (
            <Card key={po.POId} sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: `0 4px 20px ${alpha(theme.palette.info.main, 0.1)}`, border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`, transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 32px ${alpha(theme.palette.info.main, 0.2)}` } }}>
              <CardContent sx={{ p: 0 }}>
                {/* PO Header */}
                <Box sx={{ p: 3, background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)}, ${alpha(theme.palette.info.dark, 0.05)})`, borderBottom: `1px solid ${alpha(theme.palette.info.main, 0.1)}` }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: theme.palette.info.main, width: 48, height: 48, boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.3)}` }}>
                          <BusinessIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                            PO #{po.POId}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            GRN: {po.GRNId || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), width: 40, height: 40 }}>
                          <PersonIcon sx={{ color: theme.palette.info.main }} />
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
                          <IconButton onClick={() => togglePOExpansion(po.POId)} sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main, '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2), transform: 'scale(1.1)' } }}>
                            {expandedPOs[po.POId] ? <VisibilityOffIcon /> : <ViewIcon />}
                          </IconButton>
                        </Tooltip>
                        <Button variant="contained" color="info" size="small" onClick={() => handleCompleteStep(po)} sx={{ fontWeight: 600, borderRadius: 2, minWidth: 120 }}>
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
                      {/* GRN Note Section */}
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                          GRN Note (Optional)
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          placeholder="Add any notes, observations, or remarks about the goods receipt..."
                          value={grnNotes[po.POId] || ''}
                          onChange={(e) => handleGrnNoteChange(po.POId, e.target.value)}
                          sx={{ mb: 2 }}
                        />
                      </Grid>

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
                        </Box>
                      </Grid>

                      {/* Items Table */}
                      <Grid item xs={12} md={8}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                          Received Items
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

export default FinalGRN;

