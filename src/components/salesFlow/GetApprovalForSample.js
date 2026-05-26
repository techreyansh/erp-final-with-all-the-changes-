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
  Switch,
  FormControlLabel
} from '@mui/material';
import { useAuth } from '../../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';
import salesFlowService from '../../services/salesFlowService';
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
  Description,
  AttachFile,
  LocalShipping,
  Mail,
  ThumbUp,
  ThumbDown,
  Gavel
} from '@mui/icons-material';

const GetApprovalForSample = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [sampleApprovalStatus, setSampleApprovalStatus] = useState('Approved');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    loadLeadsForStep9();
  }, []);

  const loadLeadsForStep9 = async () => {
    try {
      setLoading(true);
      const leadsData = await salesFlowService.getSampleApprovalDetails();
      setLeads(leadsData);
    } catch (error) {
      console.error('Error loading leads:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load leads',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (lead) => {
    setSelectedLead(lead);
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

    if (!approvalNotes.trim()) {
      setSnackbar({
        open: true,
        message: 'Please add approval notes',
        severity: 'warning'
      });
      return;
    }

    try {
      setLoading(true);
      const approvalData = {
        LogId: selectedLead.LogId,
        CustomerName: selectedLead.CustomerName,
        CompanyName: selectedLead.CompanyName,
        Email: selectedLead.Email,
        PhoneNumber: selectedLead.PhoneNumber,
        ProductsInterested: selectedLead.ProductsInterested,
        Requirement: selectedLead.Requirement,
        QuotationDocumentId: selectedLead.QuotationDocumentId,
        TotalAmount: selectedLead.TotalAmount,
        SampleType: selectedLead.SampleType,
        SampleMethod: selectedLead.SampleMethod,
        SampleSubmittedAt: selectedLead.SampleSubmittedAt,
        SampleApprovalStatus: sampleApprovalStatus,
        ApprovalNotes: approvalNotes,
        ApprovedBy: user?.email || user?.name,
        Status: 'Completed'
      };

      await salesFlowService.saveSampleApproval(approvalData);
      
      setSnackbar({
        open: true,
        message: `Sample ${sampleApprovalStatus.toLowerCase()} successfully`,
        severity: 'success'
      });

      // Reset form
      setSelectedLead(null);
      setSampleApprovalStatus('Approved');
      setApprovalNotes('');
      
      // Reload leads
      await loadLeadsForStep9();
      
      // Navigate back to sales flow
      setTimeout(() => {
        navigate('/sales-flow');
      }, 2000);
    } catch (error) {
      console.error('Error submitting approval:', error);
      setSnackbar({
        open: true,
        message: 'Failed to submit approval',
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
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatQuotationItems = (items) => {
    try {
      const parsedItems = JSON.parse(items || '[]');
      return parsedItems.map(item => item.name || item).join(', ');
    } catch {
      return items || 'N/A';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'white',
      py: 3,
    }}>
      <Container maxWidth="xl">
        <Fade in timeout={800}>
          <Box>
            {/* Header */}
            <Card sx={{ 
              mb: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <IconButton 
                    onClick={() => navigate('/sales-flow')}
                    sx={{ 
                      color: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.2)'
                      }
                    }}
                  >
                    <ArrowBack />
                  </IconButton>
                  <Avatar sx={{ 
                    width: 60, 
                    height: 60, 
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    boxShadow: '0 4px 16px rgba(251, 191, 36, 0.3)'
                  }}>
                    <Gavel sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h3" component="h1" sx={{ 
                      fontWeight: 700,
                      mb: 1,
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      Get Approval of Sample
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      opacity: 0.9,
                      fontWeight: 300
                    }}>
                      Review and approve/reject submitted samples for strategic deals
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Loading State */}
            {loading && (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress size={60} sx={{ color: 'white' }} />
              </Box>
            )}

            {/* Leads Table */}
            {!loading && (
              <Card sx={{ 
                mb: 3,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}>
                <CardContent sx={{ p: 0 }}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ 
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        }}>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Log ID</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Customer</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Company</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Sample Type</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Sample Method</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Submitted Date</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Quotation Amount</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Priority</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {leads.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                              <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                                <Avatar sx={{ 
                                  width: 80, 
                                  height: 80, 
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  mb: 2
                                }}>
                                  <Gavel sx={{ fontSize: 40 }} />
                                </Avatar>
                                <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 500 }}>
                                  No samples pending approval
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  All samples have been reviewed or no samples are ready for approval
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ) : (
                          leads.map((lead, index) => (
                            <Fade in timeout={300 + index * 100} key={lead.LogId}>
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
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Avatar sx={{ 
                                      width: 32, 
                                      height: 32, 
                                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      fontSize: '0.875rem'
                                    }}>
                                      {lead.CustomerName?.charAt(0)}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {lead.CustomerName}
                                      </Typography>
                                      <Typography variant="caption" color="textSecondary">
                                        {lead.Email}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {lead.CompanyName}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={lead.SampleType || 'N/A'} 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined"
                                    sx={{ fontWeight: 600 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    {lead.SampleMethod === 'Post' ? (
                                      <Mail sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    ) : (
                                      <LocalShipping sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    )}
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {lead.SampleMethod || 'N/A'}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                                    {formatDate(lead.SampleSubmittedAt)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                    ₹{lead.TotalAmount?.toLocaleString() || '0'}
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
                                  <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<Visibility />}
                                    onClick={() => handleViewDetails(lead)}
                                    sx={{ 
                                      background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                                      color: 'white',
                                      fontWeight: 600,
                                      px: 3,
                                      py: 1,
                                      borderRadius: 2,
                                      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                                      transition: 'all 0.3s ease',
                                      '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)'
                                      }
                                    }}
                                  >
                                    Review
                                  </Button>
                                </TableCell>
                              </TableRow>
                            </Fade>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}

            {/* Approval Form */}
            {selectedLead && (
              <Card sx={{ 
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: '#1e3a8a' }}>
                    Sample Approval Form
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" sx={{ mb: 2, color: '#374151' }}>
                        Sample Details
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={2}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ 
                            width: 40, 
                            height: 40, 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          }}>
                            <Person sx={{ fontSize: 20 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {selectedLead.CustomerName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {selectedLead.CompanyName}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ 
                            width: 40, 
                            height: 40, 
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          }}>
                            <AttachFile sx={{ fontSize: 20 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Sample Type: {selectedLead.SampleType || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Method: {selectedLead.SampleMethod || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ 
                            width: 40, 
                            height: 40, 
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                          }}>
                            <Schedule sx={{ fontSize: 20 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Submitted: {formatDate(selectedLead.SampleSubmittedAt)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Quotation: ₹{selectedLead.TotalAmount?.toLocaleString() || '0'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" sx={{ mb: 2, color: '#374151' }}>
                        Approval Decision
                      </Typography>
                      
                      <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Sample Approval Status</InputLabel>
                        <Select
                          value={sampleApprovalStatus}
                          onChange={(e) => setSampleApprovalStatus(e.target.value)}
                          label="Sample Approval Status"
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="Approved">
                            <Box display="flex" alignItems="center" gap={1}>
                              <ThumbUp sx={{ color: 'success.main' }} />
                              Approved
                            </Box>
                          </MenuItem>
                          <MenuItem value="Rejected">
                            <Box display="flex" alignItems="center" gap={1}>
                              <ThumbDown sx={{ color: 'error.main' }} />
                              Rejected
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>
                      
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Approval Notes"
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder="Provide detailed notes about your approval decision..."
                        sx={{ borderRadius: 2 }}
                      />
                    </Grid>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 3 }} />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ 
                          width: 40, 
                          height: 40, 
                          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                          boxShadow: '0 4px 16px rgba(67, 233, 123, 0.3)'
                        }}>
                          <Schedule sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          TAT: 1 day | Next Step: 10
                        </Typography>
                      </Box>
                      
                      <Box display="flex" gap={2}>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setSelectedLead(null);
                            setSampleApprovalStatus('Approved');
                            setApprovalNotes('');
                          }}
                          disabled={loading}
                          sx={{
                            borderRadius: 2,
                            px: 4,
                            py: 1.5,
                            borderColor: '#667eea',
                            color: '#667eea',
                            '&:hover': {
                              borderColor: '#764ba2',
                              backgroundColor: 'rgba(102, 126, 234, 0.04)'
                            }
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          variant="contained"
                          startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
                          disabled={loading || !approvalNotes.trim()}
                          sx={{
                            background: sampleApprovalStatus === 'Approved' 
                              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            fontWeight: 700,
                            px: 5,
                            py: 1.5,
                            borderRadius: 2,
                            boxShadow: sampleApprovalStatus === 'Approved'
                              ? '0 8px 32px rgba(16, 185, 129, 0.4)'
                              : '0 8px 32px rgba(239, 68, 68, 0.4)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: sampleApprovalStatus === 'Approved'
                                ? '0 12px 40px rgba(16, 185, 129, 0.6)'
                                : '0 12px 40px rgba(239, 68, 68, 0.6)'
                            }
                          }}
                        >
                          {loading ? 'Processing...' : `${sampleApprovalStatus} Sample`}
                        </Button>
                      </Box>
                    </Box>
                  </Grid>
                </CardContent>
              </Card>
            )}

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

export default GetApprovalForSample;
