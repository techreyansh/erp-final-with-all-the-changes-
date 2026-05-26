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
  MenuItem
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
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
  Mail
} from '@mui/icons-material';

const SampleSubmission = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [sampleType, setSampleType] = useState('');
  const [sampleMethod, setSampleMethod] = useState('');
  const [sampleNotes, setSampleNotes] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    loadLeadsForStep8();
  }, []);

  const loadLeadsForStep8 = async () => {
    try {
      setLoading(true);
      const leadsData = await salesFlowService.getSampleSubmissionDetails();
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
    if (!selectedLead || !sampleMethod.trim()) {
      setSnackbar({
        open: true,
        message: 'Please select a lead and choose sample method',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      
      await salesFlowService.saveSampleSubmission({
        ...selectedLead,
        sampleType: sampleType.trim(),
        sampleMethod: sampleMethod.trim(),
        sampleNotes: sampleNotes.trim(),
        submittedBy: user?.email,
        submittedAt: new Date().toISOString()
      });
      
      setSnackbar({
        open: true,
        message: 'Sample submission completed successfully!',
        severity: 'success'
      });

      // Reset form
      setSelectedLead(null);
      setSampleType('');
      setSampleMethod('');
      setSampleNotes('');
      setDetailsDialogOpen(false);

      // Reload leads
      await loadLeadsForStep8();

      // Navigate back to sales flow after a short delay
      setTimeout(() => {
        navigate('/sales-flow');
      }, 2000);

    } catch (error) {
      console.error('Error saving sample submission:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save sample submission. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'error';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New':
        return 'primary';
      case 'In Progress':
        return 'warning';
      case 'Completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatQuotationItems = (quotationItems) => {
    try {
      if (typeof quotationItems === 'string') {
        const items = JSON.parse(quotationItems);
        if (Array.isArray(items)) {
          return items.map(item => `${item.productName || item.name || 'Product'} - ${item.quantity || 0} units`).join(', ');
        }
      }
      return 'No items specified';
    } catch (error) {
      return 'Error parsing items';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)',
      py: 3
    }}>
      <Container maxWidth="xl">
        <Fade in timeout={800}>
          <Box>
            {/* Enhanced Header */}
            <Card sx={{ 
              mb: 4,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              position: 'relative',
              overflow: 'hidden',
              maxWidth: '1400px',
              mx: 'auto',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                opacity: 0.3
              }
            }}>
              <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={3}>
                    <Tooltip title="Back to Sales Flow">
                      <IconButton
                        onClick={() => navigate('/sales-flow')}
                        sx={{ 
                          color: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            transform: 'translateX(-3px)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <ArrowBack />
                      </IconButton>
                    </Tooltip>
                    
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(250, 112, 154, 0.4)',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: -2,
                          left: -2,
                          right: -2,
                          bottom: -2,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb)',
                          zIndex: -1,
                          opacity: 0.7
                        }
                      }}>
                        <LocalShipping sx={{ fontSize: 28, color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h3" sx={{ 
                          fontWeight: 800,
                          background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          textShadow: '0 4px 8px rgba(0,0,0,0.1)',
                          mb: 1
                        }}>
                          Sample Submission
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          opacity: 0.9,
                          fontWeight: 300,
                          color: 'rgba(255,255,255,0.9)'
                        }}>
                          Submit samples to customers with quotation details
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 3,
                    py: 1.5,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <WorkspacePremium sx={{ color: '#fee140', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                      Step 8
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Leads Table */}
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              background: 'white',
              maxWidth: '1400px',
              mx: 'auto',
              mb: 4
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" gap={2} mb={4}>
                  <Avatar sx={{ 
                    width: 48, 
                    height: 48, 
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    boxShadow: '0 4px 16px rgba(79, 172, 254, 0.3)'
                  }}>
                    <Assignment sx={{ fontSize: 24 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2', mb: 0.5 }}>
                      Leads Ready for Sample Submission
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                      Select a lead to submit samples with quotation details
                    </Typography>
                  </Box>
                </Box>

                {loading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : leads.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Typography variant="h6" color="text.secondary">
                      No leads ready for sample submission
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      All leads have been processed or are in other steps
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Enquiry Number</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Customer Name</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Company</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Email</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Mobile</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Quotation Amount</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {leads.map((lead) => (
                          <TableRow 
                            key={lead.LogId}
                            sx={{ 
                              '&:hover': { 
                                backgroundColor: 'rgba(102, 126, 234, 0.04)',
                                cursor: 'pointer'
                              }
                            }}
                          >
                            <TableCell>
                              <Chip 
                                label={lead.LogId} 
                                size="small"
                                sx={{ 
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  fontWeight: 600
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                                {lead.FullName}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Business sx={{ fontSize: 16, color: 'text.secondary' }} />
                                {lead.CompanyName}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                                {lead.Email}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                                {lead.PhoneNumber || 'N/A'}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={`₹${lead.TotalAmount || 0}`} 
                                size="small"
                                sx={{ 
                                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                                  color: 'white',
                                  fontWeight: 600
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={lead.Status} 
                                size="small"
                                color={getStatusColor(lead.Status)}
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box display="flex" gap={1}>
                                <Tooltip title="View Details">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleViewDetails(lead)}
                                    sx={{ 
                                      color: '#667eea',
                                      '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' }
                                    }}
                                  >
                                    <Visibility />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>

            {/* Sample Submission Form */}
            {selectedLead && (
              <Card sx={{ 
                borderRadius: 3,
                boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                background: 'white',
                maxWidth: '1400px',
                mx: 'auto'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={4}>
                    <Avatar sx={{ 
                      width: 48, 
                      height: 48, 
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      boxShadow: '0 4px 16px rgba(67, 233, 123, 0.3)'
                    }}>
                      <CheckCircleOutline sx={{ fontSize: 24 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#2e7d32', mb: 0.5 }}>
                        Sample Submission for {selectedLead.FullName}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                        Submit samples with quotation details and delivery method
                      </Typography>
                    </Box>
                  </Box>

                  {/* Quotation Details */}
                  {selectedLead.QuotationDocumentId && (
                    <Box sx={{ 
                      mb: 3, 
                      p: 3, 
                      backgroundColor: 'rgba(67, 233, 123, 0.1)', 
                      borderRadius: 2,
                      border: '1px solid rgba(67, 233, 123, 0.3)'
                    }}>
                      <Typography variant="h6" sx={{ mb: 2, color: '#2e7d32', fontWeight: 600 }}>
                        Quotation Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Quotation Document ID:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                            {selectedLead.QuotationDocumentId}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Total Amount:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                            ₹{selectedLead.TotalAmount || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Quotation Items:
                          </Typography>
                          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                            {formatQuotationItems(selectedLead.QuotationItems)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Sample Type"
                        value={sampleType}
                        onChange={(e) => setSampleType(e.target.value)}
                        placeholder="e.g., Product sample, Material sample, etc."
                        InputProps={{
                          startAdornment: (
                            <Description sx={{ mr: 1, color: 'text.secondary' }} />
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea',
                              borderWidth: 2
                            }
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Sample Method *</InputLabel>
                        <Select
                          value={sampleMethod}
                          onChange={(e) => setSampleMethod(e.target.value)}
                          label="Sample Method *"
                          startAdornment={
                            <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                              {sampleMethod === 'Post' ? (
                                <Mail sx={{ color: 'text.secondary' }} />
                              ) : sampleMethod === 'Physical' ? (
                                <LocalShipping sx={{ color: 'text.secondary' }} />
                              ) : (
                                <AttachFile sx={{ color: 'text.secondary' }} />
                              )}
                            </Box>
                          }
                          sx={{
                            borderRadius: 2,
                            '& .MuiOutlinedInput-notchedOutline': {
                              '&:hover': {
                                borderColor: '#667eea'
                              }
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea',
                              borderWidth: 2
                            }
                          }}
                        >
                          <MenuItem value="Post">
                            <Box display="flex" alignItems="center" gap={1}>
                              <Mail />
                              Post
                            </Box>
                          </MenuItem>
                          <MenuItem value="Physical">
                            <Box display="flex" alignItems="center" gap={1}>
                              <LocalShipping />
                              Physical Delivery
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Sample Notes"
                        multiline
                        rows={4}
                        value={sampleNotes}
                        onChange={(e) => setSampleNotes(e.target.value)}
                        placeholder="Enter any additional notes about the sample submission, delivery instructions, etc..."
                        InputProps={{
                          startAdornment: (
                            <Notes sx={{ mr: 1, color: 'text.secondary', mt: 1, alignSelf: 'flex-start' }} />
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea',
                              borderWidth: 2
                            }
                          }
                        }}
                      />
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
                            TAT: 2 days | Next Step: 9
                          </Typography>
                        </Box>
                        
                        <Box display="flex" gap={2}>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setSelectedLead(null);
                              setSampleType('');
                              setSampleMethod('');
                              setSampleNotes('');
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
                            disabled={loading || !sampleMethod.trim()}
                            sx={{
                              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                              color: 'white',
                              fontWeight: 700,
                              px: 5,
                              py: 1.5,
                              borderRadius: 2,
                              boxShadow: '0 8px 32px rgba(250, 112, 154, 0.4)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 12px 40px rgba(250, 112, 154, 0.6)',
                                background: 'linear-gradient(135deg, #fee140 0%, #fa709a 100%)'
                              }
                            }}
                          >
                            {loading ? 'Submitting...' : 'Submit Sample & Complete Step'}
                          </Button>
                        </Box>
                      </Box>
                    </Grid>
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

export default SampleSubmission;
