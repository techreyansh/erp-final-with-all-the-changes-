import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  useTheme,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  Avatar,
  Fade,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  LinearProgress,
  Zoom,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import salesFlowService from '../../services/salesFlowService';
import sheetService from '../../services/sheetService';
import config from '../../config/config';
import { 
  Save, 
  ArrowBack, 
  Person, 
  Business, 
  Email, 
  Phone, 
  ShoppingCart, 
  Source, 
  PriorityHigh, 
  CheckCircle, 
  Notes, 
  AutoAwesome,
  Diamond,
  WorkspacePremium,
  TrendingUp,
  Call,
  Assignment,
  Visibility,
  Send,
  CheckCircleOutline,
  Schedule,
  LocationOn,
  Download,
  Mail,
  AttachMoney,
  Receipt,
  Description,
  Print,
  ExpandMore,
  Payment,
  CalendarToday,
  AccountBalance,
  CreditCard,
  LocalShipping,
  ReceiptLong,
  MonetizationOn,
  BusinessCenter,
  Assessment,
  Timeline
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

function sameLogId(a, b) {
  return String(a ?? '') === String(b ?? '');
}

const ApprovePaymentTerms = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentMethod: '',
    estimatedPaymentDate: null,
    terms: '',
    notes: ''
  });

  useEffect(() => {
    loadLeadsForStep7();
  }, []);

  const loadLeadsForStep7 = async () => {
    try {
      setLoading(true);
      const [leadsData, quotationsData] = await Promise.all([
        salesFlowService.getLeadsByNextStep(7),
        sheetService.getSheetData(config.sheets.sendQuotation)
      ]);
      setLeads(leadsData);
      setQuotations(quotationsData);
    } catch (error) {
      console.error('Error loading leads:', error);
      const detail = error?.message || error?.details || String(error);
      setSnackbar({
        open: true,
        message: detail ? `Failed to load leads or quotations: ${detail}` : 'Failed to load leads or quotations',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getQuotationForLead = (logId) => {
    return quotations.find(
      (q) => q && (sameLogId(q.LogId, logId) || sameLogId(q.logId, logId))
    );
  };

  const handleViewDetails = (lead) => {
    setSelectedLead(lead);
    const quotation = getQuotationForLead(lead.LogId);
    if (quotation) {
      setPaymentData({
        paymentMethod: quotation.PaymentMethod || '',
        estimatedPaymentDate: quotation.EstimatedPaymentDate ? new Date(quotation.EstimatedPaymentDate) : null,
        terms: quotation.PaymentTerms || '',
        notes: quotation.Notes || ''
      });
    } else {
      setPaymentData({
        paymentMethod: '',
        estimatedPaymentDate: null,
        terms: '',
        notes: ''
      });
    }
    setDetailsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedLead) {
      setSnackbar({
        open: true,
        message: 'Please select a lead first',
        severity: 'warning'
      });
      return;
    }

    if (!paymentData.paymentMethod || !paymentData.estimatedPaymentDate) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'warning'
      });
      return;
    }

    try {
      setLoading(true);
      
      // Use the salesFlowService to save payment terms and update flow steps
      const paymentDataForService = {
        LogId: selectedLead.LogId,
        CustomerName: selectedLead.FullName || selectedLead.CustomerName || '',
        CompanyName: selectedLead.CompanyName || '',
        Email: selectedLead.Email || selectedLead.EmailId || '',
        PhoneNumber: selectedLead.PhoneNumber || selectedLead.MobileNumber || '',
        ProductsInterested: selectedLead.ProductsInterested || '',
        Requirement: selectedLead.Requirement || '',
        QuotationDocumentId: getQuotationForLead(selectedLead.LogId)?.QuotationDocumentId || '',
        TotalAmount: getQuotationForLead(selectedLead.LogId)?.TotalAmount || 0,
        PaymentMethod: paymentData.paymentMethod,
        EstimatedPaymentDate: paymentData.estimatedPaymentDate.toISOString(),
        PaymentTerms: paymentData.terms,
        Notes: paymentData.notes,
        ApprovedBy: user?.email || '',
        ApprovedAt: new Date().toISOString(),
        Status: 'Approved'
      };

      await salesFlowService.saveApprovePaymentTerms(paymentDataForService);

      setSnackbar({
        open: true,
        message: 'Payment terms approved successfully! Lead moved to next step.',
        severity: 'success'
      });

      // Refresh the leads list
      await loadLeadsForStep7();
      setDetailsDialogOpen(false);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error approving payment terms:', error);
      setSnackbar({
        open: true,
        message: 'Failed to approve payment terms',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in progress':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'new':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const paymentMethods = [
    { value: 'advance', label: 'Advance Payment', icon: <MonetizationOn /> },
    { value: 'credit', label: 'Credit Payment', icon: <CreditCard /> },
    { value: 'cod', label: 'Cash on Delivery', icon: <LocalShipping /> },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: <AccountBalance /> },
    { value: 'cheque', label: 'Cheque Payment', icon: <ReceiptLong /> },
    { value: 'installments', label: 'Installments', icon: <Timeline /> }
  ];

  if (loading && leads.length === 0) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          p: 4
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
        <Typography variant="h6" color="white" sx={{ fontWeight: 300 }}>
          Loading Payment Terms Data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: 3,
    }}>
      <Container maxWidth="xl">
        <Fade in timeout={800}>
          <Box>
            {/* Enhanced Header */}
            <Card sx={{ 
              mb: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h3" component="h1" sx={{ 
                      fontWeight: 700,
                      mb: 1,
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      Approve Payment Terms
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      opacity: 0.9,
                      fontWeight: 300
                    }}>
                      Review and approve payment terms for qualified leads
                    </Typography>
                  </Box>
                  <Box display="flex" gap={2}>
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBack />}
                      onClick={() => navigate('/sales-flow')}
                      sx={{ 
                        color: 'white',
                        borderColor: 'white',
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      Back to Sales Flow
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {leads.length}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Pending Approvals
                        </Typography>
                      </Box>
                      <Payment sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)'
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {leads.filter(l => l.Priority === 'High').length}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          High Priority
                        </Typography>
                      </Box>
                      <PriorityHigh sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {quotations.length}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Quotations Available
                        </Typography>
                      </Box>
                      <Receipt sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {formatCurrency(quotations.reduce((sum, q) => sum + (parseFloat(q.TotalAmount) || 0), 0))}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Total Value
                        </Typography>
                      </Box>
                      <AttachMoney sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Enhanced Table */}
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Log ID</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Customer</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Company</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Quotation Amount</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Priority</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Status</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Created</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                            <Avatar sx={{ 
                              width: 80, 
                              height: 80, 
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              mb: 2
                            }}>
                              <Payment sx={{ fontSize: 40 }} />
                            </Avatar>
                            <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 500 }}>
                              No payment terms pending approval
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              All leads have been processed or no leads are ready for payment terms approval
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      leads.map((lead, index) => {
                        const quotation = getQuotationForLead(lead.LogId);
                        
                        return (
                          <Fade in timeout={300 + index * 100} key={`${lead.LogId}-${index}`}>
                            <TableRow 
                              hover 
                              sx={{ 
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  backgroundColor: 'rgba(102, 126, 234, 0.04)',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold" color="primary" sx={{ fontSize: '1rem' }}>
                                  {lead.LogId}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Avatar sx={{ 
                                    width: 40, 
                                    height: 40, 
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                  }}>
                                    {(lead.FullName || lead.CustomerName || 'C').charAt(0)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {lead.FullName || lead.CustomerName || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      {lead.Email || lead.EmailId || 'N/A'}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {lead.CompanyName || 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                  {quotation ? formatCurrency(quotation.TotalAmount) : 'No quotation'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={lead.Priority || 'Medium'} 
                                  size="small" 
                                  color={getPriorityColor(lead.Priority)}
                                  sx={{ fontWeight: 600 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={lead.Status || 'New'} 
                                  size="small" 
                                  color={getStatusColor(lead.Status)}
                                  sx={{ fontWeight: 600 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                                  {formatDate(lead.CreatedAt || lead.DateOfEntry)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box display="flex" gap={1}>
                                  <Tooltip title="Review & Approve">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleViewDetails(lead)}
                                      sx={{ 
                                        color: 'primary.main',
                                        '&:hover': {
                                          backgroundColor: 'rgba(102, 126, 234, 0.1)'
                                        }
                                      }}
                                    >
                                      <Visibility />
                                    </IconButton>
                                  </Tooltip>
                                  {quotation && (
                                    <Tooltip title="Download Quotation">
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          // Handle download quotation
                                          window.open(`https://drive.google.com/file/d/${quotation.QuotationDocumentId}/view`, '_blank');
                                        }}
                                        sx={{ 
                                          color: 'success.main',
                                          '&:hover': {
                                            backgroundColor: 'rgba(16, 185, 129, 0.1)'
                                          }
                                        }}
                                      >
                                        <Download />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          </Fade>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            {/* Details Dialog */}
            <Dialog 
              open={detailsDialogOpen} 
              onClose={() => setDetailsDialogOpen(false)}
              maxWidth="lg"
              fullWidth
            >
              <DialogTitle sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Payment />
                  <Typography variant="h6">Approve Payment Terms</Typography>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ p: 3 }}>
                {selectedLead && (
                  <Grid container spacing={3}>
                    {/* Customer Information */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                          Customer Information
                        </Typography>
                        <Box display="flex" flexDirection="column" gap={1}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="textSecondary">Name:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {selectedLead.FullName || selectedLead.CustomerName || 'N/A'}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="textSecondary">Company:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {selectedLead.CompanyName || 'N/A'}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="textSecondary">Email:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {selectedLead.Email || selectedLead.EmailId || 'N/A'}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="textSecondary">Phone:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {selectedLead.PhoneNumber || selectedLead.MobileNumber || 'N/A'}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="textSecondary">Location:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {selectedLead.CustomerLocation || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                    
                    {/* Quotation Information */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                          Quotation Details
                        </Typography>
                        {(() => {
                          const quotation = getQuotationForLead(selectedLead.LogId);
                          if (!quotation) {
                            return (
                              <Typography variant="body2" color="textSecondary">
                                No quotation found for this lead
                              </Typography>
                            );
                          }
                          return (
                            <Box display="flex" flexDirection="column" gap={1}>
                              <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2" color="textSecondary">Total Amount:</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                  {formatCurrency(quotation.TotalAmount)}
                                </Typography>
                              </Box>
                              <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2" color="textSecondary">Status:</Typography>
                                <Chip 
                                  label={quotation.Status || 'Sent'} 
                                  size="small" 
                                  color="success"
                                />
                              </Box>
                              <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2" color="textSecondary">Created:</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {formatDate(quotation.CreatedAt)}
                                </Typography>
                              </Box>
                              <Button
                                variant="outlined"
                                startIcon={<Download />}
                                onClick={() => {
                                  window.open(`https://drive.google.com/file/d/${quotation.QuotationDocumentId}/view`, '_blank');
                                }}
                                sx={{ mt: 1 }}
                              >
                                View Quotation Document
                              </Button>
                            </Box>
                          );
                        })()}
                      </Card>
                    </Grid>
                    
                    {/* Payment Terms Form */}
                    <Grid item xs={12}>
                      <Card sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                          Payment Terms Configuration
                        </Typography>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                              <InputLabel>Payment Method *</InputLabel>
                              <Select
                                value={paymentData.paymentMethod}
                                onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                                label="Payment Method *"
                              >
                                {paymentMethods.map((method) => (
                                  <MenuItem key={method.value} value={method.value}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                      {method.icon}
                                      {method.label}
                                    </Box>
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          
                                                     <Grid item xs={12} md={6}>
                             <LocalizationProvider dateAdapter={AdapterDateFns}>
                               <DatePicker
                                 label="Estimated Payment Date *"
                                 value={paymentData.estimatedPaymentDate}
                                 onChange={(newValue) => setPaymentData({...paymentData, estimatedPaymentDate: newValue})}
                                 slotProps={{
                                   textField: {
                                     fullWidth: true,
                                     required: true
                                   }
                                 }}
                                 minDate={new Date()}
                               />
                             </LocalizationProvider>
                           </Grid>
                          
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              multiline
                              rows={3}
                              label="Payment Terms"
                              value={paymentData.terms}
                              onChange={(e) => setPaymentData({...paymentData, terms: e.target.value})}
                              placeholder="e.g., 50% advance, 50% before delivery"
                            />
                          </Grid>
                          
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              multiline
                              rows={3}
                              label="Additional Notes"
                              value={paymentData.notes}
                              onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                              placeholder="Any additional notes or special conditions..."
                            />
                          </Grid>
                        </Grid>
                      </Card>
                    </Grid>
                  </Grid>
                )}
              </DialogContent>
              <DialogActions sx={{ p: 3, gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setDetailsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<CheckCircle />}
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                    }
                  }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Approve Payment Terms'}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Enhanced Snackbar */}
            <Snackbar
              open={snackbar.open}
              autoHideDuration={6000}
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Alert 
                onClose={() => setSnackbar({ ...snackbar, open: false })} 
                severity={snackbar.severity}
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                {snackbar.message}
              </Alert>
            </Snackbar>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default ApprovePaymentTerms;
