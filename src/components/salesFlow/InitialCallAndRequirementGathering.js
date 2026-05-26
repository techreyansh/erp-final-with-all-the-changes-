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
import { useNavigate, useLocation } from 'react-router-dom';
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
  LocationOn
} from '@mui/icons-material';

const InitialCallAndRequirementGathering = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [needs, setNeeds] = useState('');
  const [products, setProducts] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    loadLeadsForStep2();
  }, [routerLocation.pathname, routerLocation.key]);

  const loadLeadsForStep2 = async () => {
    setLoading(true);
    let leadsData = [];
    let productsData = [];
    try {
      try {
        leadsData = await salesFlowService.getLeadsByNextStep(2);
      } catch (leadsErr) {
        console.error('Error loading leads:', leadsErr);
        const detail =
          leadsErr?.message || leadsErr?.details || (typeof leadsErr === 'string' ? leadsErr : '');
        setSnackbar({
          open: true,
          message: detail ? `Failed to load leads: ${detail}` : 'Failed to load leads',
          severity: 'error'
        });
      }
      try {
        productsData = await salesFlowService.getProducts();
      } catch (productsErr) {
        console.error('Error loading products:', productsErr);
      }
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMail = (email, lead = null) => {
    if (!email || !email.trim()) {
      setSnackbar({
        open: true,
        message: 'No email address available for this lead',
        severity: 'warning'
      });
      return;
    }

    try {
      const customerName = lead?.FullName || lead?.customerName || 'Customer';
      const companyName = lead?.CompanyName || lead?.companyName || '';
      
      const subject = 'Initial Call - Requirement Gathering';
      const body = `Dear ${customerName}${companyName ? ` (${companyName})` : ''},

Thank you for your interest in our products and services.

We would like to schedule an initial call to discuss your requirements in detail. This will help us better understand your needs and provide you with the most suitable solutions.

Please let us know your preferred date and time for the call, and we will confirm accordingly.

Looking forward to speaking with you.

Best regards,
Sales Team`;
      
      const mailtoLink = `mailto:${email.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;
      
      setSnackbar({
        open: true,
        message: 'Email client opened with pre-filled message',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error opening email client:', error);
      setSnackbar({
        open: true,
        message: 'Failed to open email client. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleViewDetails = (lead) => {
    setSelectedLead(lead);
    setDetailsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedLead || !needs.trim()) {
      setSnackbar({
        open: true,
        message: 'Please select a lead and enter the needs/requirements',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      
      await salesFlowService.saveInitialCall({
        ...selectedLead,
        needs: needs.trim(),
        contactedBy: user?.email,
        contactedAt: new Date().toISOString()
      });
      
      setSnackbar({
        open: true,
        message: 'Initial call completed successfully! Lead moved to next step (Evaluate High-Value Prospects).',
        severity: 'success'
      });

      // Reset form
      setSelectedLead(null);
      setNeeds('');
      setDetailsDialogOpen(false);
      
      // Reload leads to remove the completed one from the list
      await loadLeadsForStep2();

    } catch (error) {
      console.error('Error saving initial call:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save initial call details. Please try again.',
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
                        <Call sx={{ fontSize: 28, color: 'white' }} />
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
                          Initial Call & Requirement Gathering
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          opacity: 0.9,
                          fontWeight: 300,
                          color: 'rgba(255,255,255,0.9)'
                        }}>
                          Contact leads and gather detailed requirements
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
                      Step 2
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
                      Leads Ready for Initial Call
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                      Select a lead to contact and gather requirements
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
                      No leads ready for initial call
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
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Location</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Customer Type</TableCell>
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
                              <Box display="flex" alignItems="center" gap={1}>
                                <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                                {lead.CustomerLocation || 'N/A'}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={lead.CustomerType || 'N/A'} 
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
                                <Tooltip title="Send Email">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleSendMail(lead.Email, lead)}
                                    sx={{ 
                                      color: '#4caf50',
                                      '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                                    }}
                                  >
                                    <Send />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Gather Requirements & Move to Step 3">
                                  <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<CheckCircle />}
                                    onClick={() => {
                                      setSelectedLead(lead);
                                      setDetailsDialogOpen(false);
                                      // Scroll to form after a brief delay
                                      setTimeout(() => {
                                        const formSection = document.getElementById('requirements-form-section');
                                        if (formSection) {
                                          formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                      }, 100);
                                    }}
                                    sx={{ 
                                      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                      color: 'white',
                                      fontSize: '0.75rem',
                                      px: 1.5,
                                      py: 0.5,
                                      '&:hover': {
                                        background: 'linear-gradient(135deg, #fee140 0%, #fa709a 100%)',
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 4px 12px rgba(250, 112, 154, 0.4)'
                                      }
                                    }}
                                  >
                                    Gather Requirements
                                  </Button>
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

            {/* Requirements Input Section */}
            {selectedLead && (
              <Card 
                id="requirements-form-section"
                sx={{ 
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
                        Requirements for {selectedLead.FullName}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                        Enter the needs and requirements gathered during the initial call
                      </Typography>
                    </Box>
                  </Box>

                  {/* Show existing requirement if available */}
                  {selectedLead.Requirement && (
                    <Box sx={{ 
                      mb: 3, 
                      p: 2, 
                      backgroundColor: 'rgba(67, 233, 123, 0.1)', 
                      borderRadius: 2,
                      border: '1px solid rgba(67, 233, 123, 0.3)'
                    }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Original Requirement:
                      </Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        {selectedLead.Requirement}
                      </Typography>
                    </Box>
                  )}

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Needs & Requirements *"
                        multiline
                        rows={6}
                        value={needs}
                        onChange={(e) => setNeeds(e.target.value)}
                        placeholder="Enter detailed requirements, needs, specifications, timeline, budget, etc..."
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
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 ,mr:2}}>
                            TAT: 2 days | Next Step: 3
                          </Typography>
                        </Box>
                        
                        <Box display="flex" gap={2}>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setSelectedLead(null);
                              setNeeds('');
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
                            disabled={loading || !needs.trim()}
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
                            {loading ? 'Saving...' : 'Save & Complete Step'}
                          </Button>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Lead Details Dialog */}
            <Dialog 
              open={detailsDialogOpen} 
              onClose={() => setDetailsDialogOpen(false)}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <Person />
                Lead Details
              </DialogTitle>
              <DialogContent sx={{ pt: 3 }}>
                {selectedLead && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Enquiry Number</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.LogId}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Customer Name</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.FullName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Company Name</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.CompanyName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.Email}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Mobile Number</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.PhoneNumber || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Customer Location</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.CustomerLocation || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Customer Type</Typography>
                      <Chip 
                        label={selectedLead.CustomerType || 'N/A'} 
                        sx={{ 
                          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Lead Assigned To</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.LeadAssignedTo || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                      <Chip 
                        label={selectedLead.Priority || 'Medium'} 
                        color={getPriorityColor(selectedLead.Priority || 'Medium')}
                        sx={{ fontWeight: 600 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                      <Chip 
                        label={selectedLead.Status} 
                        color={getStatusColor(selectedLead.Status)}
                        sx={{ fontWeight: 600 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Requirement</Typography>
                      <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
                        {selectedLead.Requirement || 'No requirement specified'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Products Interested</Typography>
                                             <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                         {selectedLead.ProductsInterested && (() => {
                           try {
                             // First, try to parse as JSON
                             let productCodes;
                             if (typeof selectedLead.ProductsInterested === 'string') {
                               productCodes = JSON.parse(selectedLead.ProductsInterested);
                             } else {
                               productCodes = selectedLead.ProductsInterested;
                             }
                             if (Array.isArray(productCodes)) {
                               return productCodes.map((productCode, index) => {
                                 // Find the product details from the products array
                                 const product = products.find(p => p.value === productCode);
                                 const displayLabel = product ? product.label : productCode;
                                 
                                 return (
                                   <Chip 
                                     key={index}
                                     label={displayLabel} 
                                     size="small"
                                     sx={{ 
                                       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                       color: 'white'
                                     }}
                                   />
                                 );
                               });
                             } else {
                               // If it's not an array, treat it as a single product code
                               const product = products.find(p => p.value === selectedLead.ProductsInterested);
                               const displayLabel = product ? product.label : selectedLead.ProductsInterested;
                               
                               return (
                                 <Chip 
                                   label={displayLabel} 
                                   size="small"
                                   sx={{ 
                                     background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                     color: 'white'
                                   }}
                                 />
                               );
                             }
                           } catch (error) {
                             console.error('Error parsing products:', error);
                             // If JSON parsing fails, try to split by comma or display as is
                             let productCodes = [];
                             if (typeof selectedLead.ProductsInterested === 'string') {
                               // Try to split by comma if it's a string
                               if (selectedLead.ProductsInterested.includes(',')) {
                                 // Check if it's already an array
        if (Array.isArray(selectedLead.ProductsInterested)) {
          productCodes = selectedLead.ProductsInterested;
        } else if (typeof selectedLead.ProductsInterested === 'string') {
          productCodes = selectedLead.ProductsInterested.split(',').map(p => p.trim());
        } else {
          productCodes = [];
        }
                               } else {
                                 productCodes = [selectedLead.ProductsInterested];
                               }
                             } else {
                               productCodes = [selectedLead.ProductsInterested];
                             }
                             
                             return productCodes.map((productCode, index) => {
                               const product = products.find(p => p.value === productCode);
                               const displayLabel = product ? product.label : productCode;
                               
                               return (
                                 <Chip 
                                   key={index}
                                   label={displayLabel} 
                                   size="small"
                                   sx={{ 
                                     background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                     color: 'white'
                                   }}
                                 />
                               );
                             });
                           }
                         })()}
                       </Box>
                    </Grid>
                    {selectedLead.Notes && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {selectedLead.Notes}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                )}
              </DialogContent>
              <DialogActions sx={{ p: 3 }}>
                <Button 
                  onClick={() => setDetailsDialogOpen(false)}
                  variant="outlined"
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    // Ensure the lead is selected so the form appears
                    if (selectedLead) {
                      // Scroll to the requirements form section
                      setTimeout(() => {
                        const formSection = document.getElementById('requirements-form-section');
                        if (formSection) {
                          formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }
                  }}
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    color: 'white'
                  }}
                >
                  Proceed with this Lead
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

export default InitialCallAndRequirementGathering; 