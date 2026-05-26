import React, { useEffect, useState, useMemo } from 'react';
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
  Pagination,
  LinearProgress,
  Fade,
  Zoom
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
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import BaseStepComponent from './BaseStepComponent';
import { useStepStatus } from '../../../context/StepStatusContext';
import purchaseFlowService from '../../../services/purchaseFlowService';
import sheetService from '../../../services/sheetService';
import { useAuth } from '../../../context/AuthContext';

const FollowupDelivery = () => {
  const { stepStatuses, setStepStatuses } = useStepStatus();
  const [pos, setPos] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [tracking, setTracking] = useState({});
  const [expandedPOs, setExpandedPOs] = useState({});
  const [expectedDates, setExpectedDates] = useState({});
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [poCopyFiles, setPoCopyFiles] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [emailSent, setEmailSent] = useState({});
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    fetchPOs();
  }, []);

  // Load existing PO Copy files when POs are fetched
  useEffect(() => {
    if (pos.length > 0) {
      const existingPoCopyFiles = {};
      pos.forEach(po => {
        if (po.POCopyFileId) {
          existingPoCopyFiles[po.POId] = {
            fileId: po.POCopyFileId,
            fileName: `PO Copy - ${po.POId}`,
            uploadedAt: po.LastModifiedAt || new Date().toISOString()
          };
        }
      });
      setPoCopyFiles(existingPoCopyFiles);
    }
  }, [pos]);

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const data = await purchaseFlowService.getPOsForFollowupDelivery();
      setPos(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching POs:', err);
      setError('Failed to fetch purchase orders');
      setPos([]); // Set empty array on error
      setSnackbar({ 
        open: true, 
        message: 'Failed to fetch purchase orders: ' + (err.message || 'Unknown error'), 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = (po) => {
    const vendorEmail = po.VendorDetails?.vendorEmail || '';
    if (!vendorEmail) {
      setSnackbar({ open: true, message: 'No vendor email available', severity: 'warning' });
      return;
    }
    
    const subject = encodeURIComponent(`Follow-up for PO ${po.POId} - Delivery Status`);
    const body = encodeURIComponent(`Dear ${po.VendorDetails?.vendorName || 'Vendor'},

We are following up on Purchase Order ${po.POId} regarding the delivery status.

Please provide an update on the delivery timeline and any tracking information.

Best regards,
${user?.name || user?.email || 'Purchase Team'}`);
    
    window.open(`mailto:${vendorEmail}?subject=${subject}&body=${body}`, '_blank');
    setEmailSent(prev => ({ ...prev, [po.POId]: true }));
    setSnackbar({ open: true, message: 'Email client opened', severity: 'success' });
  };

  const handleTrackShipment = (po) => {
    setSelectedPO(po);
    setDateDialogOpen(true);
  };

  const handleFileUpload = async (poId, file) => {
    if (!file) return;
    
    setUploadingFiles(prev => ({ ...prev, [poId]: true }));
    
    try {
      // Upload file to Google Drive
      const fileId = await sheetService.uploadFile(file);
      
      // Update local state
      setPoCopyFiles(prev => ({ 
        ...prev, 
        [poId]: { 
          fileId, 
          fileName: file.name,
          uploadedAt: new Date().toISOString()
        } 
      }));

      // Find the PO to get its details
      const po = pos.find(p => p.POId === poId);
      if (po) {
        // Save PO Copy file ID to Google Sheets immediately
        await purchaseFlowService.saveDeliveryTracking({
          poId: poId,
          vendorDetails: po.VendorDetails,
          items: po.Items,
          expectedDate: expectedDates[poId] || null,
          poCopyFileId: fileId,
          userEmail: user?.email || 'system'
        });
      }
      
      setSnackbar({ open: true, message: 'PO Copy uploaded to Google Drive successfully', severity: 'success' });
    } catch (err) {
      console.error('Error uploading file:', err);
      setSnackbar({ open: true, message: 'Failed to upload PO Copy to Google Drive', severity: 'error' });
    } finally {
      setUploadingFiles(prev => ({ ...prev, [poId]: false }));
    }
  };

  const handleSaveExpectedDate = async () => {
    if (!selectedPO || !expectedDates[selectedPO.POId]) {
      setSnackbar({ open: true, message: 'Please select an expected delivery date', severity: 'warning' });
      return;
    }

    setTracking(prev => ({ ...prev, [selectedPO.POId]: true }));
    
    try {
      await purchaseFlowService.saveDeliveryTracking({
        poId: selectedPO.POId,
        vendorDetails: selectedPO.VendorDetails,
        items: selectedPO.Items,
        expectedDate: expectedDates[selectedPO.POId],
        poCopyFileId: poCopyFiles[selectedPO.POId]?.fileId,
        userEmail: user?.email || 'system'
      });
      
      setSnackbar({ open: true, message: 'Expected delivery date and PO Copy saved successfully', severity: 'success' });
      setDateDialogOpen(false);
      setSelectedPO(null);
    } catch (err) {
      console.error('Error saving expected date:', err);
      setSnackbar({ open: true, message: 'Failed to save expected delivery date', severity: 'error' });
    } finally {
      setTracking(prev => ({ ...prev, [selectedPO.POId]: false }));
    }
  };

  const handleCompleteStep = async (po) => {
    // Check if email is sent
    if (!emailSent[po.POId]) {
      setSnackbar({ 
        open: true, 
        message: 'Please send email to vendor before completing the step', 
        severity: 'warning' 
      });
      return;
    }

    setTracking(prev => ({ ...prev, [po.POId]: true }));
    
    try {
      // Ensure PO Copy file ID is saved before completing step
      const poCopyFileId = poCopyFiles[po.POId]?.fileId;
      if (poCopyFileId) {
        // Save/update delivery tracking with PO Copy file ID
        await purchaseFlowService.saveDeliveryTracking({
          poId: po.POId,
          vendorDetails: po.VendorDetails,
          items: po.Items,
          expectedDate: expectedDates[po.POId] || null,
          poCopyFileId: poCopyFileId,
          userEmail: user?.email || 'system'
        });
      }

      await purchaseFlowService.completeFollowupDeliveryStep({
        poId: po.POId,
        userEmail: user?.email || 'system',
        poCopyFileId: poCopyFileId
      });
      
      const successMessage = poCopyFileId 
        ? 'Step completed successfully! PO Copy saved to Google Drive and PO moved to next step.'
        : 'Step completed successfully! PO moved to next step.';
      setSnackbar({ open: true, message: successMessage, severity: 'success' });
      setPos(prev => prev.filter(p => p.POId !== po.POId));
      
      // Update step status
      setStepStatuses(prev => ({
        ...prev,
        11: 'completed'
      }));
    } catch (err) {
      console.error('Error completing step:', err);
      setSnackbar({ open: true, message: 'Failed to complete step', severity: 'error' });
    } finally {
      setTracking(prev => ({ ...prev, [po.POId]: false }));
    }
  };

  // Check if step can be completed for a PO
  const canCompleteStep = (po) => {
    // PO Copy is optional, only email sent is required
    const hasEmailSent = emailSent[po.POId];
    return hasEmailSent;
  };

  const togglePOExpansion = (poId) => {
    setExpandedPOs(prev => ({ ...prev, [poId]: !prev[poId] }));
  };

  // Calculate total amount helper
  const calculateTotalAmount = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      return sum + (quantity * price);
    }, 0);
  };

  // Pagination handlers
  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate pagination with useMemo to ensure it's always defined
  const paginatedPOs = useMemo(() => {
    if (!pos || !Array.isArray(pos)) return [];
    return pos.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  }, [pos, page, rowsPerPage]);

  const totalPages = useMemo(() => {
    if (!pos || !Array.isArray(pos)) return 0;
    return Math.ceil(pos.length / rowsPerPage);
  }, [pos, rowsPerPage]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'success';
      case 'in_progress':
      case 'in_transit':
        return 'warning';
      case 'rejected':
      case 'delayed':
        return 'error';
      default:
        return 'default';
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
        title="Follow-up for Delivery"
        description="Track and manage delivery status of purchase orders"
        breadcrumbs={[
          { label: 'Purchase Flow', path: '/purchase-flow' }
        ]}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={60} sx={{ color: theme.palette.success.main }} />
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
          background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
          color: 'white',
          borderRadius: 3,
          boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, 0.3)}`
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 56, height: 56 }}>
                <LocalShippingIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Follow-up for Delivery
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Track delivery status and manage vendor communications for purchase orders
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'rgba(255, 255, 255, 0.15)', 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 2
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                      {pos.length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Total POs
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'rgba(255, 255, 255, 0.15)', 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 2
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                      {pos.filter(po => poCopyFiles[po.POId]).length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      With PO Copy
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'rgba(255, 255, 255, 0.15)', 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 2
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                      Step 11
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Follow-up Delivery
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'rgba(255, 255, 255, 0.15)', 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 2
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                      {pos.reduce((sum, po) => sum + (po.Items?.length || 0), 0)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Total Items
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {pos.length === 0 ? (
        <Card sx={{ 
          textAlign: 'center', 
          py: 8, 
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 255, 0.9))',
          borderRadius: 3,
          boxShadow: '0 4px 20px ${alpha(theme.palette.success.main, 0.1)}'
        }}>
          <Box sx={{ mb: 3 }}>
            <Avatar sx={{ 
              width: 80, 
              height: 80, 
              mx: 'auto', 
              mb: 2,
              background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`
            }}>
              <LocalShippingIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" sx={{ color: theme.palette.success.main, fontWeight: 600, mb: 1 }}>
              No Purchase Orders Found
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', maxWidth: 400, mx: 'auto' }}>
              There are no purchase orders currently at step 11 (Follow-up for Delivery). 
              Purchase orders will appear here once they reach this stage.
            </Typography>
          </Box>
        </Card>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
            {paginatedPOs.map((po, index) => (
            <Fade in={true} timeout={300 + (index * 100)}>
              <Card key={po.POId} sx={{ 
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 4px 20px ${alpha(theme.palette.success.main, 0.1)}',
                border: '1px solid ${alpha(theme.palette.success.main, 0.1)}',
                transition: 'all 0.3s ease',
                background: 'white',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px ${alpha(theme.palette.success.main, 0.2)}'
                }
              }}>
              <CardContent sx={{ p: 0 }}>
                {/* PO Header */}
                <Box sx={{ 
                  p: 3, 
                  background: 'linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)}, ${alpha(theme.palette.success.dark, 0.05)})',
                  borderBottom: '1px solid ${alpha(theme.palette.success.main, 0.1)}'
                }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: theme.palette.success.main, 
                          width: 48, 
                          height: 48,
                          boxShadow: '0 4px 12px ${alpha(theme.palette.success.main, 0.3)}'
                        }}>
                          <BusinessIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
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
                          bgcolor: '${alpha(theme.palette.success.main, 0.1)}', 
                          width: 48, 
                          height: 48 
                        }}>
                          <BusinessIcon sx={{ color: theme.palette.success.main }} />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.success.main, mb: 0.5 }}>
                            {po.VendorDetails?.vendorName || 'N/A'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            {po.VendorDetails?.vendorCode || 'N/A'} • {po.Items?.length || 0} items
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                          Total Amount
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff9800' }}>
                          Rs {calculateTotalAmount(po.Items || []).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          <Chip
                            icon={poCopyFiles[po.POId]?.fileId ? <CheckIcon /> : <CloseIcon />}
                            label={poCopyFiles[po.POId]?.fileId ? 'PO Copy Uploaded' : 'PO Copy Pending'}
                            size="small"
                            color={poCopyFiles[po.POId]?.fileId ? 'success' : 'default'}
                            sx={{ fontSize: '0.7rem', height: 24 }}
                          />
                          <Chip
                            icon={emailSent[po.POId] ? <CheckIcon /> : <CloseIcon />}
                            label={emailSent[po.POId] ? 'Email Sent' : 'Email Pending'}
                            size="small"
                            color={emailSent[po.POId] ? 'success' : 'default'}
                            sx={{ fontSize: '0.7rem', height: 24 }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Tooltip title={emailSent[po.POId] ? "Email Already Sent" : "Send Email to Vendor"} arrow>
                          <IconButton
                            onClick={() => handleSendEmail(po)}
                            sx={{ 
                              bgcolor: emailSent[po.POId] 
                                ? 'rgba(76, 175, 80, 0.1)' 
                                : '${alpha(theme.palette.success.main, 0.1)}',
                              color: emailSent[po.POId] ? '#4caf50' : theme.palette.success.main,
                              '&:hover': {
                                bgcolor: emailSent[po.POId]
                                  ? 'rgba(76, 175, 80, 0.2)'
                                  : '${alpha(theme.palette.success.main, 0.2)}',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            {emailSent[po.POId] ? <CheckIcon /> : <EmailIcon />}
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Track Shipment" arrow>
                          <IconButton
                            onClick={() => handleTrackShipment(po)}
                            sx={{ 
                              bgcolor: '${alpha(theme.palette.success.main, 0.1)}',
                              color: theme.palette.success.main,
                              '&:hover': {
                                bgcolor: '${alpha(theme.palette.success.main, 0.2)}',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <LocalShippingIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={expandedPOs[po.POId] ? "Hide Details" : "View Details"} arrow>
                          <IconButton
                            onClick={() => togglePOExpansion(po.POId)}
                            sx={{ 
                              bgcolor: '${alpha(theme.palette.success.main, 0.1)}',
                              color: theme.palette.success.main,
                              '&:hover': {
                                bgcolor: '${alpha(theme.palette.success.main, 0.2)}',
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

                {/* Expanded Details */}
                <Collapse in={expandedPOs[po.POId]} timeout="auto" unmountOnExit>
                  <Box sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      {/* Vendor Details */}
                      <Grid item xs={12} md={6}>
                        <Card sx={{ 
                          background: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: 2,
                          border: '1px solid ${alpha(theme.palette.success.main, 0.1)}'
                        }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ 
                              color: theme.palette.success.main, 
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
                                <Typography variant="body1" sx={{ color: theme.palette.success.main, fontWeight: 500 }}>
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
                                  State
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#333', fontWeight: 500 }}>
                                  {po.VendorDetails?.vendorState || 'N/A'}
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
                              
                              <Box>
                                <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 600 }}>
                                  Payment Terms
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#333', fontWeight: 500 }}>
                                  {po.VendorDetails?.vendorPaymentTerms || 'N/A'}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* PO Copy Upload */}
                      <Grid item xs={12}>
                        <Card sx={{ 
                          background: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: 2,
                          border: '1px solid ${alpha(theme.palette.success.main, 0.1)}'
                        }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ 
                              color: theme.palette.success.main, 
                              fontWeight: 600, 
                              mb: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}>
                              <DescriptionIcon fontSize="small" />
                              PO Copy Upload
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                              {poCopyFiles[po.POId] ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, bgcolor: '${alpha(theme.palette.success.main, 0.05)}', border: '1px solid ${alpha(theme.palette.success.main, 0.2)}' }}>
                                  <DescriptionIcon sx={{ color: '${theme.palette.success.main}' }} />
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '${theme.palette.success.main}' }}>
                                      {poCopyFiles[po.POId].fileName}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#666' }}>
                                      Uploaded: {new Date(poCopyFiles[po.POId].uploadedAt).toLocaleString()}
                                    </Typography>
                                  </Box>
                                  <Tooltip title="View PO Copy" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        // Open file in new tab
                                        if (poCopyFiles[po.POId].fileId) {
                                          window.open(`https://drive.google.com/file/d/${poCopyFiles[po.POId].fileId}/view`, '_blank');
                                        }
                                      }}
                                      sx={{ color: theme.palette.success.main }}
                                    >
                                      <ViewIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Remove PO Copy" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => setPoCopyFiles(prev => {
                                        const newState = { ...prev };
                                        delete newState[po.POId];
                                        return newState;
                                      })}
                                      sx={{ color: '#f44336' }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <input
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    style={{ display: 'none' }}
                                    id={`po-copy-upload-${po.POId}`}
                                    type="file"
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        handleFileUpload(po.POId, file);
                                      }
                                    }}
                                  />
                                  <Tooltip title="Upload PO Copy document" arrow>
                                    <label htmlFor={`po-copy-upload-${po.POId}`}>
                                      <Button
                                        variant="outlined"
                                        component="span"
                                        startIcon={uploadingFiles[po.POId] ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                                        disabled={uploadingFiles[po.POId]}
                                        sx={{ 
                                          borderColor: '${theme.palette.success.main}',
                                          color: theme.palette.success.main,
                                          fontWeight: 600,
                                          borderRadius: 2,
                                          '&:hover': {
                                            borderColor: theme.palette.success.dark,
                                            backgroundColor: '${alpha(theme.palette.success.main, 0.05)}'
                                          }
                                        }}
                                      >
                                        {uploadingFiles[po.POId] ? 'Uploading...' : 'Upload PO Copy'}
                                      </Button>
                                    </label>
                                  </Tooltip>
                                  <Typography variant="caption" sx={{ color: '#666' }}>
                                    Supported formats: PDF, DOC, DOCX, JPG, PNG
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Items Details */}
                      <Grid item xs={12} md={6}>
                        <Card sx={{ 
                          background: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: 2,
                          border: '1px solid ${alpha(theme.palette.success.main, 0.1)}'
                        }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ 
                              color: theme.palette.success.main, 
                              fontWeight: 600, 
                              mb: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}>
                              <InventoryIcon fontSize="small" />
                              Items ({po.Items?.length || 0})
                            </Typography>
                            
                            <TableContainer sx={{ maxHeight: 350, borderRadius: 2 }}>
                              <Table size="small" stickyHeader>
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ 
                                      background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`, 
                                      color: 'white',
                                      fontWeight: 700,
                                      fontSize: '0.85rem'
                                    }}>#</TableCell>
                                    <TableCell sx={{ 
                                      background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`, 
                                      color: 'white',
                                      fontWeight: 700,
                                      fontSize: '0.85rem'
                                    }}>Item Name</TableCell>
                                    <TableCell align="center" sx={{ 
                                      background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`, 
                                      color: 'white',
                                      fontWeight: 700,
                                      fontSize: '0.85rem'
                                    }}>Qty</TableCell>
                                    <TableCell align="right" sx={{ 
                                      background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`, 
                                      color: 'white',
                                      fontWeight: 700,
                                      fontSize: '0.85rem'
                                    }}>Price</TableCell>
                                    <TableCell align="right" sx={{ 
                                      background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`, 
                                      color: 'white',
                                      fontWeight: 700,
                                      fontSize: '0.85rem'
                                    }}>Total</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {po.Items && po.Items.length > 0 ? (
                                    po.Items.map((item, idx) => {
                                      const quantity = parseFloat(item.quantity) || 0;
                                      const price = parseFloat(item.price) || 0;
                                      const itemTotal = quantity * price;
                                      return (
                                        <TableRow 
                                          key={idx}
                                          sx={{ 
                                            '&:nth-of-type(odd)': { bgcolor: alpha(theme.palette.success.main, 0.02) },
                                            '&:hover': { bgcolor: '${alpha(theme.palette.success.main, 0.05)}' }
                                          }}
                                        >
                                          <TableCell sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                                            {idx + 1}
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                              {item.itemName || item.item || 'N/A'}
                                            </Typography>
                                            {item.specifications && (
                                              <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.5 }}>
                                                {item.specifications.substring(0, 50)}
                                                {item.specifications.length > 50 ? '...' : ''}
                                              </Typography>
                                            )}
                                          </TableCell>
                                          <TableCell align="center">
                                            <Chip 
                                              label={quantity} 
                                              size="small" 
                                              sx={{ 
                                                background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                                                color: 'white',
                                                fontWeight: 600
                                              }} 
                                            />
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 500 }}>
                                            Rs {price.toFixed(2)}
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                                            Rs {itemTotal.toFixed(2)}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                        <Typography variant="body2" sx={{ color: '#666' }}>
                                          No items found
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  {po.Items && po.Items.length > 0 && (
                                    <TableRow sx={{ bgcolor: '${alpha(theme.palette.success.main, 0.05)}' }}>
                                      <TableCell colSpan={4} align="right" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Grand Total:
                                      </TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1rem', color: '#ff9800' }}>
                                        Rs {calculateTotalAmount(po.Items).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Box>
                </Collapse>

                {/* Action Buttons */}
                <Box sx={{ 
                  p: 3, 
                  background: 'rgba(248, 250, 255, 0.9)',
                  borderTop: '1px solid ${alpha(theme.palette.success.main, 0.1)}'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant={emailSent[po.POId] ? "contained" : "outlined"}
                        startIcon={emailSent[po.POId] ? <CheckIcon /> : <EmailIcon />}
                        onClick={() => handleSendEmail(po)}
                        sx={{ 
                          borderColor: emailSent[po.POId] ? '#4caf50' : '${theme.palette.success.main}',
                          backgroundColor: emailSent[po.POId] ? '#4caf50' : 'transparent',
                          color: emailSent[po.POId] ? 'white' : '${theme.palette.success.main}',
                          fontWeight: 600,
                          borderRadius: 2,
                          '&:hover': {
                            borderColor: emailSent[po.POId] ? '#388e3c' : '${theme.palette.success.dark}',
                            backgroundColor: emailSent[po.POId] ? '#388e3c' : '${alpha(theme.palette.success.main, 0.05)}'
                          }
                        }}
                      >
                        {emailSent[po.POId] ? 'Email Sent' : 'Send Email'}
                      </Button>
                      
                      <Button
                        variant="outlined"
                        startIcon={<CalendarIcon />}
                        onClick={() => handleTrackShipment(po)}
                        sx={{ 
                                          borderColor: theme.palette.success.main,
                                          color: theme.palette.success.main,
                          fontWeight: 600,
                          borderRadius: 2,
                          '&:hover': {
                            borderColor: '${theme.palette.success.dark}',
                            backgroundColor: '${alpha(theme.palette.success.main, 0.05)}'
                          }
                        }}
                      >
                        Track Shipment
                      </Button>
                    </Box>
                    
                    <Tooltip 
                      title={
                        !canCompleteStep(po) 
                          ? 'Send Email to vendor first'
                          : 'Complete this step'
                      }
                      arrow
                    >
                      <span>
                        <Button
                          variant="contained"
                          startIcon={<CheckIcon />}
                          onClick={() => handleCompleteStep(po)}
                          disabled={!!tracking[po.POId] || !canCompleteStep(po)}
                          sx={{ 
                            background: canCompleteStep(po) 
                              ? 'linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})'
                              : 'rgba(0, 0, 0, 0.12)',
                            color: canCompleteStep(po) ? 'white' : 'rgba(0, 0, 0, 0.38)',
                            fontWeight: 700,
                            borderRadius: 2,
                            px: 4,
                            py: 1.5,
                            boxShadow: canCompleteStep(po) ? '0 4px 12px ${alpha(theme.palette.success.main, 0.3)}' : 'none',
                            '&:hover': {
                              background: canCompleteStep(po)
                                ? 'linear-gradient(135deg, ${theme.palette.success.dark}, #0d47a1)'
                                : 'rgba(0, 0, 0, 0.12)',
                              boxShadow: canCompleteStep(po) ? `0 6px 20px ${alpha(theme.palette.success.main, 0.4)}` : 'none',
                              transform: canCompleteStep(po) ? 'translateY(-1px)' : 'none'
                            },
                            '&:disabled': {
                              background: 'rgba(0, 0, 0, 0.12)',
                              color: 'rgba(0, 0, 0, 0.38)'
                            }
                          }}
                        >
                          {tracking[po.POId] ? (
                            <CircularProgress size={20} sx={{ color: 'white' }} />
                          ) : (
                            'Complete Step'
                          )}
                        </Button>
                      </span>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            </Fade>
            ))}
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontSize: '1rem',
                    fontWeight: 600,
                    '&.Mui-selected': {
                      background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(135deg, ${theme.palette.success.dark}, #0d47a1)'
                      }
                    }
                  }
                }}
              />
            </Box>
          )}
        </Box>
      )}

      {/* Expected Date Dialog */}
      <Dialog 
        open={dateDialogOpen} 
        onClose={() => setDateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px ${alpha(theme.palette.success.main, 0.2)}'
          }
        }}
      >
        <DialogTitle sx={{ 
                                      background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
          color: 'white',
          fontWeight: 600
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CalendarIcon />
            Set Expected Delivery Date
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          {selectedPO && (
            <Box>
              <Typography variant="h6" sx={{ color: '${theme.palette.success.main}', mb: 2 }}>
                PO #{selectedPO.POId}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
                Set the expected delivery date for tracking purposes.
              </Typography>
              
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Expected Delivery Date"
                  value={expectedDates[selectedPO.POId] || null}
                  onChange={(newValue) => {
                    setExpectedDates(prev => ({
                      ...prev,
                      [selectedPO.POId]: newValue
                    }));
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: '${theme.palette.success.main}'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '${theme.palette.success.main}'
                          }
                        }
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={() => setDateDialogOpen(false)}
            sx={{ 
              color: '#666',
              fontWeight: 600,
              borderRadius: 2
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveExpectedDate}
            variant="contained"
            disabled={!selectedPO || !expectedDates[selectedPO.POId] || !!tracking[selectedPO.POId]}
            sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
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
            {tracking[selectedPO?.POId] ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              'Save Date'
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

export default FollowupDelivery; 