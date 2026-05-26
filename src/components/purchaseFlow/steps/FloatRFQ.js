import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Pagination,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import purchaseFlowService from '../../../services/purchaseFlowService';

const initialVendorState = {
  VendorCode: '',
  VendorName: ''
};

const FloatRFQ = () => {
  const theme = useTheme();
  const [indents, setIndents] = useState([]);
  const [expandedIndent, setExpandedIndent] = useState(null);
  const [expandedItem, setExpandedItem] = useState({});
  const [vendorDialog, setVendorDialog] = useState({ open: false, indentNumber: '', itemCode: '', vendor: initialVendorState, edit: false });
  const [vendorsList, setVendorsList] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all indents with items and vendors
  const fetchIndents = async () => {
    setLoading(true);
    try {
      const data = await purchaseFlowService.getIndentsWithItemsAndVendors();
      setIndents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching indents:', err);
      setSnackbar({ open: true, message: 'Failed to fetch indents', severity: 'error' });
      setIndents([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all vendors for autocomplete
  const fetchVendorsList = async () => {
    try {
      const allVendors = await purchaseFlowService.getAllVendors();
      setVendorsList(Array.isArray(allVendors) ? allVendors : []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendorsList([]);
    }
  };

  useEffect(() => {
    fetchIndents();
    fetchVendorsList();
  }, []);

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  // Handle opening vendor dialog
  const handleOpenVendorDialog = (indentNumber, itemCode, vendor = initialVendorState, edit = false) => {
    setVendorDialog({ open: true, indentNumber, itemCode, vendor, edit });
  };

  // Handle closing vendor dialog
  const handleCloseVendorDialog = () => {
    setVendorDialog({ open: false, indentNumber: '', itemCode: '', vendor: initialVendorState, edit: false });
  };

  // Handle vendor form change
  const handleVendorChange = (field, value) => {
    setVendorDialog(prev => {
      const updatedVendor = { ...prev.vendor, [field]: value };
      
      // Auto-populate vendor name when vendor code is selected
      if (field === 'VendorCode' && value) {
        const selectedVendor = vendorsList.find(v => v['Vendor Code'] === value);
        if (selectedVendor) {
          const vendorName = selectedVendor['Vendor Name'] || selectedVendor['SKU Description'] || selectedVendor['Alternate Vendors'] || value;
          updatedVendor.VendorName = vendorName;
        }
      }
      
      return { ...prev, vendor: updatedVendor };
    });
  };

  // Add or update vendor
  const handleSaveVendor = async () => {
    const { indentNumber, itemCode, vendor, edit } = vendorDialog;
    try {
      if (edit) {
        await purchaseFlowService.updateVendorForItem({ indentNumber, itemCode, vendor });
        setSnackbar({ open: true, message: 'Vendor updated successfully', severity: 'success' });
      } else {
        await purchaseFlowService.addVendorToItem({ indentNumber, itemCode, vendor });
        setSnackbar({ open: true, message: 'Vendor added successfully', severity: 'success' });
      }
      fetchIndents();
      handleCloseVendorDialog();
    } catch {
      setSnackbar({ open: true, message: 'Failed to save vendor', severity: 'error' });
    }
  };

  // Remove vendor
  const handleRemoveVendor = async (indentNumber, itemCode, vendorCode) => {
    try {
      await purchaseFlowService.removeVendorFromItem({ indentNumber, itemCode, vendorCode });
      setSnackbar({ open: true, message: 'Vendor removed', severity: 'success' });
      fetchIndents();
    } catch {
      setSnackbar({ open: true, message: 'Failed to remove vendor', severity: 'error' });
    }
  };

  // Check if indent can be completed (all items must have at least one vendor)
  const canCompleteIndent = (indent) => {
    if (!indent.Items || !Array.isArray(indent.Items) || indent.Items.length === 0) {
      return false;
    }
    
    // Check if all items have at least one vendor
    return indent.Items.every(item => {
      return item.vendors && Array.isArray(item.vendors) && item.vendors.length > 0;
    });
  };

  // Complete Float RFQ step for an indent
  const handleCompleteStep = async (indentNumber) => {
    const indent = indents.find(ind => ind.IndentNumber === indentNumber);
    
    // Validate that all items have vendors
    if (!canCompleteIndent(indent)) {
      setSnackbar({ 
        open: true, 
        message: 'Cannot complete step: All items must have at least one vendor selected', 
        severity: 'warning' 
      });
      return;
    }

    try {
      setLoading(true);
      await purchaseFlowService.completeFloatRFQStep({ indentNumber });
      setSnackbar({ open: true, message: 'Float RFQ step completed successfully!', severity: 'success' });
      fetchIndents(); // Refresh to show updated status
    } catch (error) {
      console.error('Error completing step:', error);
      setSnackbar({ open: true, message: 'Failed to complete step', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Filter indents based on search query
  const filteredIndents = (Array.isArray(indents) ? indents : []).filter(indent => 
    indent.IndentNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    indent.Items?.some(item => 
      item.itemCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vendors?.some(vendor => 
        vendor.vendorCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.vendorName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  );

  // Paginate indents
  const paginatedIndents = filteredIndents.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{
      p: 3,
      background: `linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 50%, #c8e6c9 100%)`,
      minHeight: '100vh',
    }}>
      <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main, mb: 4, textAlign: 'center', letterSpacing: '-0.5px' }}>
        Float RFQ - Indents Ready for RFQ
      </Typography>
      
      {/* Search Bar */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          placeholder="Search indents, items, or vendors..."
          value={searchQuery}
          onChange={handleSearchChange}
          size="small"
          sx={{ 
            minWidth: 350,
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.1)}`,
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: theme.palette.success.main }} />
              </InputAdornment>
            ),
          }}
        />
        <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
          Showing {paginatedIndents.length} of {filteredIndents.length} indents
        </Typography>
      </Box>
      
      {loading && <Alert severity="info">Loading...</Alert>}
      {!loading && filteredIndents.length === 0 && <Alert severity="warning">No indents found matching your search.</Alert>}
      <Grid container spacing={3}>
        {paginatedIndents.map(indent => (
          <Grid item xs={12} key={indent.IndentNumber}>
            <Accordion
              expanded={expandedIndent === indent.IndentNumber}
              onChange={() => setExpandedIndent(expandedIndent === indent.IndentNumber ? null : indent.IndentNumber)}
              sx={{
                borderRadius: 3,
                boxShadow: `0 4px 24px ${alpha(theme.palette.success.main, 0.08)}`,
                background: 'rgba(255,255,255,0.95)',
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                mb: 2
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Typography variant="h6" sx={{ color: theme.palette.success.main, fontWeight: 700 }}>
                    {indent.IndentNumber}
                  </Typography>
                  <Tooltip 
                    title={!canCompleteIndent(indent) ? "All items must have at least one vendor selected to complete this step" : "Complete Float RFQ step"}
                    arrow
                  >
                    <span>
                      <Button
                        variant="contained"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompleteStep(indent.IndentNumber);
                        }}
                        disabled={!canCompleteIndent(indent) || loading}
                        sx={{ 
                          borderRadius: 2, 
                          fontWeight: 600,
                          textTransform: 'none',
                          px: 2,
                          ml: 2,
                          backgroundColor: canCompleteIndent(indent) ? theme.palette.success.main : 'rgba(0, 0, 0, 0.12)',
                          color: canCompleteIndent(indent) ? '#fff' : 'rgba(0, 0, 0, 0.26)',
                          '&:hover': {
                            backgroundColor: canCompleteIndent(indent) ? theme.palette.success.dark : 'rgba(0, 0, 0, 0.12)',
                          },
                          '&:disabled': {
                            backgroundColor: 'rgba(0, 0, 0, 0.12)',
                            color: 'rgba(0, 0, 0, 0.26)'
                          }
                        }}
                      >
                        Complete Step
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {(!Array.isArray(indent.Items) || indent.Items.length === 0) ? (
                  <Alert severity="info">No items in this indent.</Alert>
                ) : (
                  (Array.isArray(indent.Items) ? indent.Items : []).map(item => (
                    <Card key={item.itemCode} sx={{ mb: 3, borderRadius: 3, boxShadow: `0 2px 12px ${alpha(theme.palette.success.main, 0.06)}`, border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                              {item.itemName} <Chip label={item.itemCode} size="small" sx={{ ml: 1, bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }} />
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>Qty: {item.quantity}</Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>Specs: {item.specifications}</Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenVendorDialog(indent.IndentNumber, item.itemCode)}
                            sx={{ 
                              borderRadius: 2, 
                              fontWeight: 600, 
                              color: theme.palette.success.main, 
                              borderColor: theme.palette.success.main, 
                              background: alpha(theme.palette.success.main, 0.05), 
                              '&:hover': { 
                                background: alpha(theme.palette.success.main, 0.1),
                                borderColor: theme.palette.success.dark
                              } 
                            }}
                          >
                            Add Vendor
                          </Button>
                        </Box>
                        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none', background: alpha(theme.palette.success.main, 0.02) }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ background: alpha(theme.palette.success.main, 0.1) }}>
                                <TableCell sx={{ fontWeight: 700, color: theme.palette.success.main }}>Vendor Code</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: theme.palette.success.main }}>Vendor Name</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: theme.palette.success.main }}>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(!Array.isArray(item.vendors) || item.vendors.length === 0) ? (
                                <TableRow>
                                  <TableCell colSpan={3} align="center" sx={{ color: '#999' }}>
                                    No vendors added for this item.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                (Array.isArray(item.vendors) ? item.vendors : []).map(vendor => {
                                  return (
                                    <TableRow key={vendor.vendorCode}>
                                      <TableCell>{vendor.vendorCode}</TableCell>
                                      <TableCell>{vendor.vendorName}</TableCell>
                                      <TableCell>
                                        <Tooltip title="Edit Vendor" arrow>
                                          <IconButton sx={{ color: theme.palette.success.main }} onClick={() => handleOpenVendorDialog(indent.IndentNumber, item.itemCode, vendor, true)}>
                                            <EditIcon />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Remove Vendor" arrow>
                                          <IconButton color="error" onClick={() => handleRemoveVendor(indent.IndentNumber, item.itemCode, vendor.vendorCode)}>
                                            <DeleteIcon />
                                          </IconButton>
                                        </Tooltip>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  ))
                )}
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>
      
      {/* Pagination */}
      {filteredIndents.length > 0 && (
        <Paper sx={{ mt: 3, borderRadius: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                Indents per page:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(e.target.value);
                    setPage(0);
                  }}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.success.main, 0.3),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.success.main, 0.5),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.success.main,
                    }
                  }}
                >
                  <MenuItem value={3}>3</MenuItem>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={15}>15</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Typography variant="body2" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredIndents.length)} of {filteredIndents.length} indents
              </Typography>
              
              {Math.ceil(filteredIndents.length / rowsPerPage) > 1 && (
                <Pagination
                  count={Math.ceil(filteredIndents.length / rowsPerPage)}
                  page={page + 1}
                  onChange={(event, value) => setPage(value - 1)}
                  size="large"
                  showFirstButton
                  showLastButton
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 3,
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      minWidth: 36,
                      height: 36,
                      margin: '0 2px',
                      transition: 'all 0.3s ease',
                      color: theme.palette.success.main,
                      '&:hover': {
                        transform: 'scale(1.1)',
                        boxShadow: `0 5px 15px ${alpha(theme.palette.success.main, 0.3)}`,
                        backgroundColor: alpha(theme.palette.success.main, 0.1)
                      },
                      '&.Mui-selected': {
                        background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                        color: 'white',
                        fontWeight: 800,
                        boxShadow: `0 8px 20px ${alpha(theme.palette.success.main, 0.4)}`,
                        '&:hover': {
                          transform: 'scale(1.15)',
                          boxShadow: `0 10px 25px ${alpha(theme.palette.success.main, 0.5)}`
                        }
                      }
                    }
                  }}
                />
              )}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Vendor Dialog */}
      <Dialog open={vendorDialog.open} onClose={handleCloseVendorDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>{vendorDialog.edit ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
              Vendor Code
            </Typography>
            <FormControl fullWidth disabled={vendorDialog.edit}>
              <Select
                value={vendorDialog.vendor.VendorCode || ''}
                onChange={e => handleVendorChange('VendorCode', e.target.value)}
                displayEmpty
                sx={{
                  '& .MuiSelect-select': {
                    py: 1.5
                  }
                }}
              >
                <MenuItem value="" disabled>
                  <em>Select Vendor</em>
                </MenuItem>
                {(vendorsList || []).map(v => (
                  <MenuItem key={v['Vendor Code']} value={v['Vendor Code']}>
                    {v['Vendor Name'] || v['SKU Description'] || v['Alternate Vendors'] || v['Vendor Code']} ({v['Vendor Code']})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <TextField
            label="Vendor Name"
            value={vendorDialog.vendor.VendorName}
            onChange={e => handleVendorChange('VendorName', e.target.value)}
            fullWidth
            margin="normal"
            disabled={!!vendorDialog.vendor.VendorCode}
            helperText={vendorDialog.vendor.VendorCode ? "Auto-filled from selected vendor" : "Will be auto-filled when vendor is selected"}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button onClick={handleCloseVendorDialog} startIcon={<CloseIcon />}>Cancel</Button>
          <Button 
            onClick={handleSaveVendor} 
            variant="contained" 
            startIcon={<SaveIcon />}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              color: '#fff',
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
              }
            }}
          >
            {vendorDialog.edit ? 'Update' : 'Add'}
          </Button>
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
    </Box>
  );
};

export default FloatRFQ; 