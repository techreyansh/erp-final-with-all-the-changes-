import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  CircularProgress,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  alpha,
  Divider,
  Avatar,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Save as SaveIcon,
  Send as SendIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Comment as CommentIcon,
  ExpandMore as ExpandMoreIcon,
  Email as EmailIcon,
  LocalShipping as LocalShippingIcon,
  CalendarToday as CalendarIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import BaseStepComponent from './BaseStepComponent';
import { useStepStatus } from '../../../context/StepStatusContext';
import purchaseFlowService from '../../../services/purchaseFlowService';
import { useAuth } from '../../../context/AuthContext';

const RecieveAndInspectMaterial = () => {
  const { stepStatuses, setStepStatuses } = useStepStatus();
  const [pos, setPos] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [processing, setProcessing] = useState({});
  const [expandedPOs, setExpandedPOs] = useState({});
  const [statusUpdates, setStatusUpdates] = useState({});
  const [noteUpdates, setNoteUpdates] = useState({});
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    fetchPOs();
  }, []);

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const data = await purchaseFlowService.getPOsForReceiveAndInspectMaterial();
      setPos(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching POs:', err);
      setError('Failed to fetch purchase orders');
      setSnackbar({ open: true, message: 'Failed to fetch purchase orders', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (poId, status) => {
    setStatusUpdates(prev => ({ ...prev, [poId]: status }));
  };

  const handleNoteChange = (poId, note) => {
    setNoteUpdates(prev => ({ ...prev, [poId]: note }));
  };

  const handleSaveInspection = (po) => {
    setSelectedPO(po);
    setSaveDialogOpen(true);
  };

  const handleSaveInspectionData = async () => {
    if (!selectedPO) return;

    const status = statusUpdates[selectedPO.POId] || selectedPO.InspectionStatus;
    const note = noteUpdates[selectedPO.POId] || selectedPO.InspectionNote;

    setProcessing(prev => ({ ...prev, [selectedPO.POId]: true }));
    
    try {
      await purchaseFlowService.saveInspectionData({
        poId: selectedPO.POId,
        vendorDetails: selectedPO.VendorDetails,
        items: selectedPO.Items,
        status: status,
        note: note,
        userEmail: user?.email || 'system'
      });
      
      setSnackbar({ open: true, message: 'Inspection data saved successfully', severity: 'success' });
      setSaveDialogOpen(false);
      setSelectedPO(null);
      
      // Refresh data
      await fetchPOs();
    } catch (err) {
      console.error('Error saving inspection data:', err);
      setSnackbar({ open: true, message: 'Failed to save inspection data', severity: 'error' });
    } finally {
      setProcessing(prev => ({ ...prev, [selectedPO.POId]: false }));
    }
  };

  const handleCompleteStep = async (po) => {
    setProcessing(prev => ({ ...prev, [po.POId]: true }));
    
    try {
      await purchaseFlowService.completeReceiveAndInspectMaterialStep({
        poId: po.POId,
        userEmail: user?.email || 'system'
      });
      
      setSnackbar({ open: true, message: 'Step completed successfully! PO moved to next step.', severity: 'success' });
      setPos(prev => prev.filter(p => p.POId !== po.POId));
      
      // Update step status
      setStepStatuses(prev => ({
        ...prev,
        12: 'completed'
      }));
    } catch (err) {
      console.error('Error completing step:', err);
      setSnackbar({ open: true, message: 'Failed to complete step', severity: 'error' });
    } finally {
      setProcessing(prev => ({ ...prev, [po.POId]: false }));
    }
  };

  const togglePOExpansion = (poId) => {
    setExpandedPOs(prev => ({ ...prev, [poId]: !prev[poId] }));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'received':
        return 'success';
      case 'not yet received':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'received':
        return <CheckCircleIcon color="success" />;
      case 'not yet received':
        return <WarningIcon color="warning" />;
      case 'rejected':
        return <CloseIcon color="error" />;
      default:
        return <AssignmentIcon />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <BaseStepComponent
        breadcrumbs={[
          { label: 'Purchase Flow', path: '/purchase-flow' }
        ]}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={60} sx={{ color: '${theme.palette.success.main}' }} />
        </Box>
      </BaseStepComponent>
    );
  }

  return (
    <BaseStepComponent
      breadcrumbs={[
        { label: 'Purchase Flow', path: '/purchase-flow' }
      ]}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Card sx={{ 
          background: 'linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)',
          color: 'white',
          borderRadius: 3,
          boxShadow: '0 8px 32px ${alpha(theme.palette.success.main, 0.3)'
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 56, height: 56 }}>
                <AssignmentIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Receive and Inspect Material
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Track material receipt and inspection status for purchase orders
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={`${pos.length} Purchase Orders`} 
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.2)', 
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }} 
              />
              <Chip 
                label="Step 12" 
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.2)', 
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }} 
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {pos.length === 0 ? (
        <Card sx={{ 
          textAlign: 'center', 
          py: 8, 
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 255, 0.9))',
          borderRadius: 3,
          boxShadow: '0 4px 20px ${alpha(theme.palette.success.main, 0.1)'
        }}>
          <Box sx={{ mb: 3 }}>
            <Avatar sx={{ 
              width: 80, 
              height: 80, 
              mx: 'auto', 
              mb: 2,
              background: 'linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})'
            }}>
              <AssignmentIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" sx={{ color: '${theme.palette.success.main}', fontWeight: 600, mb: 1 }}>
              No Purchase Orders Found
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', maxWidth: 400, mx: 'auto' }}>
              There are no purchase orders currently at step 12 (Receive and Inspect Material). 
              Purchase orders will appear here once they reach this stage.
            </Typography>
          </Box>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {pos.map((po, index) => (
            <Card key={po.POId} sx={{ 
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 4px 20px ${alpha(theme.palette.success.main, 0.1)',
              border: '1px solid ${alpha(theme.palette.success.main, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 32px ${alpha(theme.palette.success.main, 0.2)'
              }
            }}>
              <CardContent sx={{ p: 0 }}>
                {/* PO Header */}
                <Box sx={{ 
                  p: 3, 
                  background: 'linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05), ${alpha(theme.palette.success.dark, 0.05))',
                  borderBottom: '1px solid ${alpha(theme.palette.success.main, 0.1)'
                }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: '${theme.palette.success.main}', 
                          width: 48, 
                          height: 48,
                          boxShadow: '0 4px 12px ${alpha(theme.palette.success.main, 0.3)'
                        }}>
                          <BusinessIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '${theme.palette.success.main}' }}>
                            PO #{po.POId}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            Created: {formatDate(po.CreatedAt)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: '${alpha(theme.palette.success.main, 0.1)', 
                          width: 40, 
                          height: 40 
                        }}>
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
                          <IconButton
                            onClick={() => togglePOExpansion(po.POId)}
                            sx={{ 
                              bgcolor: '${alpha(theme.palette.success.main, 0.1)',
                              color: '${theme.palette.success.main}',
                              '&:hover': {
                                bgcolor: '${alpha(theme.palette.success.main, 0.2)',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            {expandedPOs[po.POId] ? <HideIcon /> : <ViewIcon />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Status and Actions Row */}
                <Box sx={{ 
                  p: 3, 
                  background: 'rgba(248, 250, 255, 0.9)',
                  borderBottom: '1px solid ${alpha(theme.palette.success.main, 0.1)'
                }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(po.InspectionStatus)}
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
                          Status:
                        </Typography>
                        <Chip 
                          label={po.InspectionStatus} 
                          color={getStatusColor(po.InspectionStatus)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Inspection Note"
                        value={noteUpdates[po.POId] || po.InspectionNote || ''}
                        onChange={(e) => handleNoteChange(po.POId, e.target.value)}
                        placeholder="Add inspection notes..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': {
                              borderColor: '${theme.palette.success.main}'
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '${theme.palette.success.main}'
                            }
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleSaveInspection(po)}
                          disabled={!!processing[po.POId]}
                          sx={{ 
                            borderColor: '${theme.palette.success.main}',
                            color: '${theme.palette.success.main}',
                            fontWeight: 600,
                            borderRadius: 2,
                            '&:hover': {
                              borderColor: '${theme.palette.success.dark}',
                              backgroundColor: '${alpha(theme.palette.success.main, 0.05)'
                            }
                          }}
                        >
                          Save
                        </Button>
                        
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleCompleteStep(po)}
                          disabled={!!processing[po.POId]}
                          sx={{ 
                            background: 'linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})',
                            color: 'white',
                            fontWeight: 600,
                            borderRadius: 2,
                            '&:hover': {
                              background: 'linear-gradient(135deg, ${theme.palette.success.dark}, #0d47a1)'
                            },
                            '&:disabled': {
                              background: 'rgba(0, 0, 0, 0.12)',
                              color: 'rgba(0, 0, 0, 0.38)'
                            }
                          }}
                        >
                          {processing[po.POId] ? (
                            <CircularProgress size={16} sx={{ color: 'white' }} />
                          ) : (
                            'Complete Step'
                          )}
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
                      <Grid item xs={12} md={6}>
                        <Card sx={{ 
                          background: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: 2,
                          border: '1px solid ${alpha(theme.palette.success.main, 0.1)'
                        }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ 
                              color: '${theme.palette.success.main}', 
                              fontWeight: 600, 
                              mb: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}>
                              <BusinessIcon fontSize="small" />
                              Vendor Details
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <Box>
                                <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 600 }}>
                                  Vendor Name
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#333', fontWeight: 500 }}>
                                  {po.VendorDetails?.vendorName || 'N/A'}
                                </Typography>
                              </Box>
                              
                              <Box>
                                <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 600 }}>
                                  Vendor Code
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#333', fontWeight: 500 }}>
                                  {po.VendorDetails?.vendorCode || 'N/A'}
                                </Typography>
                              </Box>
                              
                              <Box>
                                <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 600 }}>
                                  Contact Person
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#333', fontWeight: 500 }}>
                                  {po.VendorDetails?.vendorContact || 'N/A'}
                                </Typography>
                              </Box>
                              
                              <Box>
                                <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 600 }}>
                                  Email
                                </Typography>
                                <Typography variant="body1" sx={{ color: '${theme.palette.success.main}', fontWeight: 500 }}>
                                  {po.VendorDetails?.vendorEmail || 'N/A'}
                                </Typography>
                              </Box>
                              
                              <Box>
                                <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 600 }}>
                                  Phone
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#333', fontWeight: 500 }}>
                                  {po.VendorDetails?.vendorPhone || 'N/A'}
                                </Typography>
                              </Box>
                              
                              <Box>
                                <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 600 }}>
                                  Address
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#333', fontWeight: 500 }}>
                                  {po.VendorDetails?.vendorAddress || 'N/A'}
                                </Typography>
                              </Box>
                              
                              <Box>
                                <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 600 }}>
                                  GSTIN
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#333', fontWeight: 500 }}>
                                  {po.VendorDetails?.vendorGSTIN || 'N/A'}
                                </Typography>
                              </Box>
                              
                              <Box>
                                <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 600 }}>
                                  PAN
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#333', fontWeight: 500 }}>
                                  {po.VendorDetails?.vendorPAN || 'N/A'}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Items Details */}
                      <Grid item xs={12} md={6}>
                        <Card sx={{ 
                          background: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: 2,
                          border: '1px solid ${alpha(theme.palette.success.main, 0.1)'
                        }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ 
                              color: '${theme.palette.success.main}', 
                              fontWeight: 600, 
                              mb: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}>
                              <InventoryIcon fontSize="small" />
                              Items ({po.Items?.length || 0})
                            </Typography>
                            
                            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                              {po.Items && po.Items.length > 0 ? (
                                po.Items.map((item, idx) => (
                                  <Box key={idx} sx={{ 
                                    p: 2, 
                                    mb: 2, 
                                    borderRadius: 2,
                                    background: '${alpha(theme.palette.success.main, 0.05)',
                                    border: '1px solid ${alpha(theme.palette.success.main, 0.1)'
                                  }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '${theme.palette.success.main}', mb: 1 }}>
                                      {item.itemName || item.item || 'Item Name'}
                                    </Typography>
                                    <Grid container spacing={1}>
                                      <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: '#666' }}>
                                          Quantity:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          {item.quantity}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: '#666' }}>
                                          Price:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          ₹{item.price || 'N/A'}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: '#666' }}>
                                          Delivery Time:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          {item.deliveryTime || 'N/A'}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: '#666' }}>
                                          Terms:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          {item.terms || 'N/A'}
                                        </Typography>
                                      </Grid>
                                    </Grid>
                                  </Box>
                                ))
                              ) : (
                                <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', py: 2 }}>
                                  No items found
                                </Typography>
                              )}
                            </Box>
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

      {/* Save Dialog */}
      <Dialog 
        open={saveDialogOpen} 
        onClose={() => setSaveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px ${alpha(theme.palette.success.main, 0.2)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})',
          color: 'white',
          fontWeight: 600
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SaveIcon />
            Save Inspection Data
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          {selectedPO && (
            <Box>
              <Typography variant="h6" sx={{ color: '${theme.palette.success.main}', mb: 2 }}>
                PO #{selectedPO.POId}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
                Save the current inspection status and notes for this purchase order.
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusUpdates[selectedPO.POId] || selectedPO.InspectionStatus || 'Not Yet Received'}
                      onChange={(e) => handleStatusChange(selectedPO.POId, e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="Not Yet Received">Not Yet Received</MenuItem>
                      <MenuItem value="Received">Received</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Inspection Note"
                    value={noteUpdates[selectedPO.POId] || selectedPO.InspectionNote || ''}
                    onChange={(e) => handleNoteChange(selectedPO.POId, e.target.value)}
                    placeholder="Add detailed inspection notes..."
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={() => setSaveDialogOpen(false)}
            sx={{ 
              color: '#666',
              fontWeight: 600,
              borderRadius: 2
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveInspectionData}
            variant="contained"
            disabled={!selectedPO || !!processing[selectedPO?.POId]}
            sx={{ 
              background: 'linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})',
              color: 'white',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              '&:hover': {
                background: 'linear-gradient(135deg, ${theme.palette.success.dark}, #0d47a1)'
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.38)'
              }
            }}
          >
            {processing[selectedPO?.POId] ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              'Save Data'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            borderRadius: 2,
            fontWeight: 600
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </BaseStepComponent>
  );
};

export default RecieveAndInspectMaterial; 