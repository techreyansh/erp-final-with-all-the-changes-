import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
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
  Assessment,
  Visibility
} from '@mui/icons-material';

const EvaluateHighValueProspects = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [evaluationValue, setEvaluationValue] = useState('');
  const [evaluationNotes, setEvaluationNotes] = useState('');
  const [products, setProducts] = useState([]);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadLeadsForStep3();
  }, []);

  const loadLeadsForStep3 = async () => {
    try {
      setLoading(true);
      // Use the new function to get all details from LogAndQualifyLeads
      const [leadsData, productsData] = await Promise.all([
        salesFlowService.getHighValueProspectsDetails(),
        salesFlowService.getProducts()
      ]);
      setLeads(leadsData);
      setProducts(productsData);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedLead) {
      setSnackbar({
        open: true,
        message: 'Please select a lead to evaluate',
        severity: 'error'
      });
      return;
    }

    if (!evaluationValue) {
      setSnackbar({
        open: true,
        message: 'Please select evaluation value',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      
      const evaluationData = {
        ...selectedLead,
        evaluationValue: evaluationValue,
        evaluationNotes: evaluationNotes,
        evaluatedBy: user?.email,
        evaluatedAt: new Date().toISOString()
      };

      await salesFlowService.saveHighValueEvaluation(evaluationData);
      
      setSnackbar({
        open: true,
        message: 'Evaluation completed successfully!',
        severity: 'success'
      });

      // Reset form
      setSelectedLead(null);
      setEvaluationValue('');
      setEvaluationNotes('');

      // Reload leads
      await loadLeadsForStep3();

    } catch (error) {
      console.error('Error saving evaluation:', error);
      const errorMessage = error.message || 'Failed to save evaluation. Please try again.';
      setSnackbar({
        open: true,
        message: errorMessage,
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

  const getValueColor = (value) => {
    switch (value) {
      case 'High Value':
        return 'error';
      case 'Medium Value':
        return 'warning';
      case 'Low Value':
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
                        <Assessment sx={{ fontSize: 28, color: 'white' }} />
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
                          Evaluate High Value Prospects
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          opacity: 0.9,
                          fontWeight: 300,
                          color: 'rgba(255,255,255,0.9)'
                        }}>
                          Assess and categorize prospect value
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
                      Step 3
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Leads Table */}
            <Card sx={{ 
              mb: 4,
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
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    boxShadow: '0 4px 16px rgba(79, 172, 254, 0.3)'
                  }}>
                    <TrendingUp sx={{ fontSize: 24 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2', mb: 0.5 }}>
                      Prospects for Evaluation
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                      Select a prospect to evaluate their value
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
                      No prospects found for evaluation
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      All prospects with NextStep 3 will appear here
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Log ID</TableCell>
                          <TableCell>Full Name</TableCell>
                          <TableCell>Company</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Phone</TableCell>
                          <TableCell>Products Interested</TableCell>
                          <TableCell>Requirement</TableCell>
                          <TableCell>Location</TableCell>
                          <TableCell>Customer Type</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {leads.map((lead) => (
                          <TableRow 
                            key={lead.LogId}
                            hover
                            sx={{ 
                              cursor: 'pointer',
                              backgroundColor: selectedLead?.LogId === lead.LogId ? 'rgba(102, 126, 234, 0.08)' : 'inherit'
                            }}
                            onClick={() => setSelectedLead(lead)}
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
                                {lead.PhoneNumber}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" flexWrap="wrap" gap={0.5}>
                                {lead.ProductsInterested && (() => {
                                  try {
                                    // First, try to parse as JSON
                                    let productCodes;
                                    if (typeof lead.ProductsInterested === 'string') {
                                      productCodes = JSON.parse(lead.ProductsInterested);
                                    } else {
                                      productCodes = lead.ProductsInterested;
                                    }
                                    
                                    if (Array.isArray(productCodes)) {
                                      return productCodes.slice(0, 2).map((productCode, index) => {
                                        const product = products.find(p => p.value === productCode);
                                        const displayLabel = product ? product.label : productCode;
                                        return (
                                          <Chip 
                                            key={index}
                                            label={displayLabel} 
                                            size="small"
                                            sx={{ 
                                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                              color: 'white',
                                              fontSize: '0.7rem'
                                            }}
                                          />
                                        );
                                      });
                                    } else {
                                      // If it's not an array, treat it as a single product code
                                      const product = products.find(p => p.value === lead.ProductsInterested);
                                      const displayLabel = product ? product.label : lead.ProductsInterested;
                                      return (
                                        <Chip 
                                          label={displayLabel} 
                                          size="small"
                                          sx={{ 
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            fontSize: '0.7rem'
                                          }}
                                        />
                                      );
                                    }
                                  } catch (error) {
                                    console.error('Error parsing products in table:', error);
                                    // If JSON parsing fails, try to split by comma or display as is
                                    let productCodes = [];
                                    if (typeof lead.ProductsInterested === 'string') {
                                      // Try to split by comma if it's a string
                                      if (lead.ProductsInterested.includes(',')) {
                                        // Check if it's already an array
        if (Array.isArray(lead.ProductsInterested)) {
          productCodes = lead.ProductsInterested;
        } else if (typeof lead.ProductsInterested === 'string') {
          productCodes = lead.ProductsInterested.split(',').map(p => p.trim());
        } else {
          productCodes = [];
        }
                                      } else {
                                        productCodes = [lead.ProductsInterested];
                                      }
                                    } else {
                                      productCodes = [lead.ProductsInterested];
                                    }
                                    
                                    return productCodes.slice(0, 2).map((productCode, index) => {
                                      const product = products.find(p => p.value === productCode);
                                      const displayLabel = product ? product.label : productCode;
                                      return (
                                        <Chip 
                                          key={index}
                                          label={displayLabel} 
                                          size="small"
                                          sx={{ 
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            fontSize: '0.7rem'
                                          }}
                                        />
                                      );
                                    });
                                  }
                                })()}
                                {lead.ProductsInterested && (() => {
                                  try {
                                    let productCodes;
                                    if (typeof lead.ProductsInterested === 'string') {
                                      productCodes = JSON.parse(lead.ProductsInterested);
                                    } else {
                                      productCodes = lead.ProductsInterested;
                                    }
                                    
                                    if (Array.isArray(productCodes) && productCodes.length > 2) {
                                      return (
                                        <Chip 
                                          label={`+${productCodes.length - 2} more`}
                                          size="small"
                                          sx={{ 
                                            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                            color: 'white',
                                            fontSize: '0.7rem'
                                          }}
                                        />
                                      );
                                    }
                                  } catch (error) {
                                    return null;
                                  }
                                })()}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ 
                                maxWidth: 150, 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {lead.Requirement || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ 
                                maxWidth: 120, 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {lead.CustomerLocation || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={lead.CustomerType || 'N/A'} 
                                size="small"
                                sx={{ 
                                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                  color: 'white'
                                }}
                              />
                            </TableCell>
                            
                            <TableCell>
                              <Chip 
                                label={lead.Status || 'New'} 
                                size="small"
                                sx={{ 
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white'
                                }}
                              />
                            </TableCell>
                            
                            <TableCell>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(lead);
                                  }}
                                  sx={{ 
                                    color: '#667eea',
                                    '&:hover': {
                                      backgroundColor: 'rgba(102, 126, 234, 0.1)'
                                    }
                                  }}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>

            {/* Evaluation Form */}
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
                      <Assessment sx={{ fontSize: 24 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2', mb: 0.5 }}>
                        Evaluate Prospect: {selectedLead.FullName}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                        Assess the value and potential of this prospect
                      </Typography>
                    </Box>
                  </Box>

                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={4}>
                      {/* Evaluation Value */}
                      <Grid item xs={12} lg={6}>
                        <FormControl fullWidth required>
                          <InputLabel>Evaluation Value *</InputLabel>
                          <Select
                            value={evaluationValue}
                            onChange={(e) => setEvaluationValue(e.target.value)}
                            label="Evaluation Value *"
                            sx={{
                              borderRadius: 2,
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#e0e0e0'
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#667eea'
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#667eea',
                                borderWidth: 2
                              }
                            }}
                          >
                            <MenuItem value="High Value">
                              <Box display="flex" alignItems="center" gap={1}>
                                <PriorityHigh sx={{ fontSize: 16, color: '#d32f2f' }} />
                                High Value
                              </Box>
                            </MenuItem>
                            <MenuItem value="Medium Value">
                              <Box display="flex" alignItems="center" gap={1}>
                                <PriorityHigh sx={{ fontSize: 16, color: '#ed6c02' }} />
                                Medium Value
                              </Box>
                            </MenuItem>
                            <MenuItem value="Low Value">
                              <Box display="flex" alignItems="center" gap={1}>
                                <PriorityHigh sx={{ fontSize: 16, color: '#2e7d32' }} />
                                Low Value
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Evaluation Notes */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Evaluation Notes"
                          multiline
                          rows={4}
                          value={evaluationNotes}
                          onChange={(e) => setEvaluationNotes(e.target.value)}
                          placeholder="Provide detailed evaluation notes..."
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
                              <Assessment sx={{ fontSize: 20 }} />
                            </Avatar>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mr: 2 }}>
                              Selected: {selectedLead.FullName} ({selectedLead.CompanyName})
                            </Typography>
                          </Box>
                          
                          <Box display="flex" gap={2}>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                setSelectedLead(null);
                                setEvaluationValue('');
                                setEvaluationNotes('');
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
                              type="submit"
                              variant="contained"
                              startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
                              disabled={loading}
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
                              {loading ? 'Evaluating...' : 'Complete Evaluation'}
                            </Button>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </form>
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
              <DialogTitle>
                <Box display="flex" alignItems="center" gap={2}>
                  <Person sx={{ color: '#667eea' }} />
                  <Typography variant="h6">Lead Details</Typography>
                </Box>
              </DialogTitle>
              <DialogContent>
                {selectedLead && (
                  <Grid container spacing={3}>
                                         {/* Basic Information */}
                     <Grid item xs={12}>
                       <Box sx={{ 
                         p: 2, 
                         mb: 3, 
                         background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                         borderRadius: 2,
                         color: 'white'
                       }}>
                         <Typography variant="h6" sx={{ fontWeight: 600, mb: 0, color: 'white' }}>
                           Basic Information
                         </Typography>
                       </Box>
                     </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Log ID</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.LogId}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Enquiry Number</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.EnquiryNumber || selectedLead.LogId}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.FullName || selectedLead.CustomerName}
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
                        {selectedLead.Email || selectedLead.EmailId}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Phone Number</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.PhoneNumber || selectedLead.MobileNumber}
                      </Typography>
                    </Grid>

                                         {/* Lead Details */}
                     <Grid item xs={12}>
                       <Box sx={{ 
                         p: 2, 
                         mb: 3, 
                         ml: 2,
                         background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                         borderRadius: 2,
                         color: 'white'
                       }}>
                         <Typography variant="h6" sx={{ fontWeight: 600, mb: 0, color: 'white' }}>
                           Lead Details
                         </Typography>
                       </Box>
                     </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Requirement</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.Requirement || 'N/A'}
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
                        size="small"
                        sx={{ 
                          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          color: 'white',
                          mb: 2
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
                      <Typography variant="subtitle2" color="text.secondary">Lead Source</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.LeadSource || 'N/A'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Qualification Status</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.QualificationStatus || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                      <Chip 
                        label={selectedLead.Status || 'New'} 
                        size="small"
                        sx={{ 
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          mb: 2
                        }}
                      />
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
                            console.error('Error parsing products in dialog:', error);
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
                                                              {/* Notes */}
                                                              
                     <Grid item xs={12}>
                       <Box sx={{ 
                         p: 2, 
                         mb: 3, 
                         ml: 2,
                         background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                         borderRadius: 2,
                         color: 'white'
                       }}>
                         <Typography variant="h6" sx={{ fontWeight: 600, mb: 0, color: 'white' }}>
                           Notes
                         </Typography>
                       </Box>
                     </Grid>
                     
                     {/* Notes */}
                     <Grid item xs={12}>
                       <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                       <Paper 
                         elevation={0} 
                         sx={{ 
                           p: 2, 
                           mb: 2, 
                           backgroundColor: '#f8f9fa',
                           border: '1px solid #e9ecef',
                           borderRadius: 2
                         }}
                       >
                         <Typography variant="body1">
                           {selectedLead.Notes || 'No notes available'}
                         </Typography>
                       </Paper>
                     </Grid>

                     {/* Timestamps */}
                     <Grid item xs={12}>
                       <Box sx={{ 
                         p: 2, 
                         mb: 3, 
                         ml: 2,
                         background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                         borderRadius: 2,
                         color: 'white'
                       }}>
                         <Typography variant="h6" sx={{ fontWeight: 600, mb: 0, color: 'white' }}>
                           Timestamps
                         </Typography>
                       </Box>
                     </Grid>
                     <Grid item xs={12} md={6}>
                       <Typography variant="subtitle2" color="text.secondary">Date of Entry</Typography>
                       <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                         {selectedLead.DateOfEntry ? new Date(selectedLead.DateOfEntry).toLocaleDateString() : 'N/A'}
                       </Typography>
                     </Grid>
                     <Grid item xs={12} md={6}>
                       <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                       <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                         {selectedLead.CreatedBy || 'N/A'}
                       </Typography>
                     </Grid>
                     <Grid item xs={12} md={6}>
                       <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                       <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                         {selectedLead.CreatedAt ? new Date(selectedLead.CreatedAt).toLocaleString() : 'N/A'}
                       </Typography>
                     </Grid>
                     <Grid item xs={12} md={6}>
                       <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                       <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                         {selectedLead.UpdatedAt ? new Date(selectedLead.UpdatedAt).toLocaleString() : 'N/A'}
                       </Typography>
                     </Grid>
                  </Grid>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
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

export default EvaluateHighValueProspects; 