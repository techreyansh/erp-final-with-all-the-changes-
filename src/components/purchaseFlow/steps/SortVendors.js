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
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SendIcon from '@mui/icons-material/Send';
import purchaseFlowService from '../../../services/purchaseFlowService';
import { useAuth } from '../../../context/AuthContext';

const SortVendors = () => {
  const [vendorGroups, setVendorGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { user } = useAuth();
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Initialize SortVendor sheet first
        await purchaseFlowService.initializeSortVendorSheet();
        
        // Get vendor groups
        const groups = await purchaseFlowService.groupItemsByVendor();
        setVendorGroups(groups);
      } catch (error) {
        console.error('Error fetching vendor groups:', error);
        setSnackbar({ open: true, message: 'Failed to fetch vendor groups', severity: 'error' });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSendPO = async (vendorGroup) => {
    const processingKey = vendorGroup.poId;
    setProcessing(prev => ({ ...prev, [processingKey]: true }));
    
    try {
      await purchaseFlowService.saveVendorGroupToSortVendor({
        poId: vendorGroup.poId,
        vendorDetails: vendorGroup.vendorDetails,
        items: vendorGroup.items,
        userEmail: user?.email || 'Purchase Executive'
      });
      
      setSnackbar({ 
        open: true, 
        message: `PO ${vendorGroup.poId} sent successfully for vendor ${vendorGroup.vendorDetails.vendorName}`, 
        severity: 'success' 
      });
      
      // Remove the vendor group from the list after sending
      setVendorGroups(prev => prev.filter(group => group.poId !== vendorGroup.poId));
      
    } catch (error) {
      console.error('Error sending PO:', error);
      setSnackbar({ open: true, message: 'Failed to send PO', severity: 'error' });
    }
    
    setProcessing(prev => ({ ...prev, [processingKey]: false }));
  };

  const calculateTotalValue = (items) => {
    return items.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseFloat(item.quantity) || 0;
      return total + (price * quantity);
    }, 0);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'Pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'Sent':
        return <Chip label="Sent" color="success" size="small" />;
      case 'Completed':
        return <Chip label="Completed" color="primary" size="small" />;
      default:
        return <Chip label="Unknown" color="default" size="small" />;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Sort Vendors (Step 9)</Typography>
      {loading ? (
        <Typography>Loading vendor groups...</Typography>
      ) : (
        vendorGroups.length === 0 ? (
          <Alert severity="info">No vendor groups ready for PO generation.</Alert>
        ) : (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Vendor Groups ({vendorGroups.length} groups)
            </Typography>
            
            {vendorGroups.map((vendorGroup) => {
              const isProcessing = processing[vendorGroup.poId];
              const totalValue = calculateTotalValue(vendorGroup.items);
              
              return (
                <Card key={vendorGroup.poId} sx={{ mb: 3 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={6}>
                        <Typography variant="h6" color="primary">
                          PO ID: {vendorGroup.poId}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {vendorGroup.vendorDetails.vendorName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Code: {vendorGroup.vendorDetails.vendorCode}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Contact: {vendorGroup.vendorDetails.vendorContact}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Email: {vendorGroup.vendorDetails.vendorEmail}
                        </Typography>
                        {vendorGroup.vendorDetails.vendorAddress && (
                          <Typography variant="body2" color="textSecondary">
                            Address: {vendorGroup.vendorDetails.vendorAddress}
                          </Typography>
                        )}
                        {vendorGroup.vendorDetails.vendorGSTIN && (
                          <Typography variant="body2" color="textSecondary">
                            GSTIN: {vendorGroup.vendorDetails.vendorGSTIN}
                          </Typography>
                        )}
                        {vendorGroup.vendorDetails.vendorPAN && (
                          <Typography variant="body2" color="textSecondary">
                            PAN: {vendorGroup.vendorDetails.vendorPAN}
                          </Typography>
                        )}
                      </Grid>
                      
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2">
                          Items: {vendorGroup.items.length}
                        </Typography>
                        <Typography variant="body2">
                          Total Value: ₹{totalValue.toFixed(2)}
                        </Typography>
                        <Typography variant="body2">
                          Indents: {new Set(vendorGroup.items.map(item => item.indentNumber)).size}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={3}>
                        <Box display="flex" justifyContent="flex-end">
                          <Tooltip title="Send PO">
                            <IconButton
                              color="primary"
                              onClick={() => handleSendPO(vendorGroup)}
                              disabled={isProcessing}
                              size="large"
                            >
                              <SendIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    <Accordion sx={{ mt: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">
                          View Items ({vendorGroup.items.length} items)
                        </Typography>
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
                                <TableCell>Price (₹)</TableCell>
                                <TableCell>Delivery Time</TableCell>
                                <TableCell>Terms</TableCell>
                                <TableCell>Lead Time</TableCell>
                                <TableCell>Indent Number</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {vendorGroup.items.map((item, index) => (
                                <TableRow key={`${item.itemCode}-${index}`}>
                                  <TableCell>{item.itemCode}</TableCell>
                                  <TableCell>{item.itemName}</TableCell>
                                  <TableCell>{item.quantity}</TableCell>
                                  <TableCell>{item.specifications}</TableCell>
                                  <TableCell>₹{item.price}</TableCell>
                                  <TableCell>{item.deliveryTime}</TableCell>
                                  <TableCell>{item.terms}</TableCell>
                                  <TableCell>{item.leadTime}</TableCell>
                                  <TableCell>{item.indentNumber}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SendIcon />}
                      onClick={() => handleSendPO(vendorGroup)}
                      disabled={isProcessing}
                      fullWidth
                    >
                      {isProcessing ? 'Sending PO...' : `Send PO ${vendorGroup.poId}`}
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
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
    </Box>
  );
};

export default SortVendors; 