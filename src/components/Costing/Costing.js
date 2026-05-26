import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Pagination
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import costingService from '../../services/costingService';

const Costing = () => {
  const [costingEntries, setCostingEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Form state
  const [formData, setFormData] = useState({
    specifications: '',
    cuStrands: '',
    gauge: '',
    innerOD: '',
    bunch: '',
    noOfCores: '',
    roundOD: '',
    flatB: '',
    flatW: '',
    laying: '',
    labourOnWire: 12,
    lengthReq: '',
    type: 'Wire',
    plugCost: '',
    terminalAccCost: '',
    enquiryBy: 'CEO',
    company: '',
    remarks: ''
  });

  // Settings state
  const [settings, setSettings] = useState({
    copperRate: 700,
    pvcRate: 100,
    labourOnWire: 12
  });

  useEffect(() => {
    fetchCostingEntries();
  }, []);

  const fetchCostingEntries = async () => {
    try {
      setLoading(true);
      const data = await costingService.getAllCostingEntries();
      setCostingEntries(data);
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Error fetching costing entries: ' + error.message, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    
    // Auto-calculate bunch based on copper strands
    if (field === 'cuStrands') {
      const cuStrands = parseFloat(value) || 0;
      if (cuStrands > 24) {
        newFormData.bunch = '3';
      } else {
        newFormData.bunch = '0';
      }
    }
    
    // Auto-calculate laying based on number of cores
    if (field === 'noOfCores') {
      const noOfCores = parseFloat(value) || 0;
      if (noOfCores > 2) {
        newFormData.laying = '1';
      } else {
        newFormData.laying = '0';
      }
    }
    
    // Auto-increment gauge by 0.003 for calculations
    if (field === 'gauge') {
      const gauge = parseFloat(value) || 0;
      if (gauge > 0) {
        newFormData.gaugeForCalculation = (gauge + 0.003).toFixed(3);
      }
    }
    
    // Auto-increment dimensions by 0.5 for calculations
    if (field === 'innerOD') {
      const innerOD = parseFloat(value) || 0;
      if (innerOD > 0) {
        newFormData.innerODForCalculation = (innerOD + 0.5).toFixed(2);
      }
    }
    
    if (field === 'roundOD') {
      const roundOD = parseFloat(value) || 0;
      if (roundOD > 0) {
        newFormData.roundODForCalculation = (roundOD + 0.5).toFixed(2);
      }
    }
    
    if (field === 'flatB') {
      const flatB = parseFloat(value) || 0;
      if (flatB > 0) {
        newFormData.flatBForCalculation = (flatB + 0.5).toFixed(2);
      }
    }
    
    if (field === 'flatW') {
      const flatW = parseFloat(value) || 0;
      if (flatW > 0) {
        newFormData.flatWForCalculation = (flatW + 0.5).toFixed(2);
      }
    }
    
    // Auto-calculate copper weight using formula: 0.703*D2*D2*C2+F2*G2
    // Use incremented gauge for calculation if available
    if (field === 'cuStrands' || field === 'gauge' || field === 'noOfCores' || field === 'bunch') {
      const cuStrands = parseFloat(newFormData.cuStrands) || 0;
      const gauge = parseFloat(newFormData.gaugeForCalculation || newFormData.gauge) || 0;
      const noOfCores = parseFloat(newFormData.noOfCores) || 0;
      const bunch = parseFloat(newFormData.bunch) || 0;
      
      if (cuStrands > 0 && gauge > 0 && noOfCores > 0 && bunch >= 0) {
        const copperWeight = 0.703 * gauge * gauge * cuStrands + bunch * noOfCores;
        newFormData.copperWeight = copperWeight.toFixed(2);
      }
    }
    
    setFormData(newFormData);
  };

  const handleSettingsChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      // Use incremented values for saving
      const dataToSubmit = {
        ...formData,
        gauge: formData.gaugeForCalculation || formData.gauge,
        innerOD: formData.innerODForCalculation || formData.innerOD,
        roundOD: formData.roundODForCalculation || formData.roundOD,
        flatB: formData.flatBForCalculation || formData.flatB,
        flatW: formData.flatWForCalculation || formData.flatW,
        ...settings
      };
      const result = await costingService.addCostingEntry(dataToSubmit);
      
      setSnackbar({ 
        open: true, 
        message: result.message, 
        severity: 'success' 
      });
      
      setOpenDialog(false);
      setFormData({
        specifications: '',
        cuStrands: '',
        gauge: '',
        innerOD: '',
        bunch: '',
        noOfCores: '',
        roundOD: '',
        flatB: '',
        flatW: '',
        laying: '',
        labourOnWire: settings.labourOnWire,
        lengthReq: '',
        type: 'Wire',
        plugCost: '',
        terminalAccCost: '',
        enquiryBy: 'CEO',
        company: '',
        remarks: ''
      });
      
      fetchCostingEntries();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Error adding costing entry: ' + error.message, 
        severity: 'error' 
      });
    }
  };

  const handleInitializeSheet = async () => {
    try {
      await costingService.initializeSheet();
      setSnackbar({ 
        open: true, 
        message: 'Costing sheet initialized successfully!', 
        severity: 'success' 
      });
      fetchCostingEntries();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Error initializing sheet: ' + error.message, 
        severity: 'error' 
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      p: 3
    }}>
      {/* Header Section */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        borderRadius: 3,
        p: 4,
        mb: 4,
        boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              width: 60, 
              height: 60, 
              borderRadius: '50%', 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>💰</Typography>
            </Box>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                Costing Management
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Manage and track all costing calculations and material pricing
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Settings">
              <IconButton 
                onClick={() => setOpenSettings(true)}
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchCostingEntries}
              disabled={loading}
              sx={{ 
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  transform: 'scale(1.02)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Add New
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ 
              p: 3, 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              textAlign: 'center',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {costingEntries.length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Entries
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ 
              p: 3, 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              textAlign: 'center',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                ₹{settings.copperRate || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Copper Rate/kg
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ 
              p: 3, 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              textAlign: 'center',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                ₹{settings.pvcRate || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                PVC Rate/kg
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ 
              p: 3, 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white',
              textAlign: 'center',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {settings.labourOnWire || 0}%
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Labour Rate
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Settings Dialog */}
      <Dialog 
        open={openSettings} 
        onClose={() => setOpenSettings(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#1976d2', 
          color: 'white',
          py: 3,
          px: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Box sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: '50%', 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <SettingsIcon />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Costing Settings
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4, backgroundColor: '#fafafa' }}>
          <Box sx={{ mb: 3, p: 3, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#1976d2', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              💰 Material Rates Configuration
            </Typography>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3, lineHeight: 1.6 }}>
              Configure the default rates for copper and PVC materials. These rates will be used in all costing calculations unless overridden.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Copper Rate"
                  type="number"
                  value={settings.copperRate}
                  onChange={(e) => handleSettingsChange('copperRate', e.target.value)}
                  fullWidth
                  InputProps={{
                    endAdornment: <Typography variant="caption" sx={{ color: '#666', ml: 1 }}>₹/kg</Typography>,
                    sx: {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Current market rate for copper per kilogram
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="PVC Rate"
                  type="number"
                  value={settings.pvcRate}
                  onChange={(e) => handleSettingsChange('pvcRate', e.target.value)}
                  fullWidth
                  InputProps={{
                    endAdornment: <Typography variant="caption" sx={{ color: '#666', ml: 1 }}>₹/kg</Typography>,
                    sx: {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Current market rate for PVC per kilogram
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Labour on Wire"
                  type="number"
                  value={settings.labourOnWire}
                  onChange={(e) => handleSettingsChange('labourOnWire', e.target.value)}
                  fullWidth
                  InputProps={{
                    endAdornment: <Typography variant="caption" sx={{ color: '#666', ml: 1 }}>%</Typography>,
                    sx: {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Labour for wire processing
                </Typography>
              </Grid>
            </Grid>
          </Box>
          
          <Box sx={{ p: 3, backgroundColor: '#e3f2fd', borderRadius: 2, border: '1px solid #bbdefb' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1565c0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              ℹ️ Information
            </Typography>
            <Typography variant="body2" color="#1565c0" sx={{ lineHeight: 1.6 }}>
              These rates are used as default values for all new costing entries. Copper rate: ₹700/kg, PVC rate: ₹100/kg, Labour rate: 12%. You can modify them at any time, and the changes will apply to future calculations. Existing entries will retain their original rates.
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, backgroundColor: '#f5f5f5', gap: 2 }}>
          <Button 
            onClick={() => setOpenSettings(false)}
            variant="outlined"
            sx={{ 
              borderRadius: 2, 
              px: 3,
              py: 1,
              borderColor: '#666',
              color: '#666',
              '&:hover': {
                borderColor: '#333',
                backgroundColor: '#f0f0f0'
              }
            }}
          >
            Close
          </Button>
          <Button 
            onClick={() => setOpenSettings(false)}
            variant="contained"
            sx={{ 
              borderRadius: 2, 
              px: 4,
              py: 1,
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0'
              }
            }}
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add New Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#1976d2', 
          color: 'white',
          py: 3,
          px: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Box sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: '50%', 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <AddIcon />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Add New Costing Entry
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4, backgroundColor: '#fafafa' }}>
          <Box sx={{ mb: 3, p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 600 }}>
              📋 Basic Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Specifications"
                  value={formData.specifications}
                  onChange={(e) => handleFormChange('specifications', e.target.value)}
                  fullWidth
                  required
                  multiline
                  rows={3}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Company"
                  value={formData.company}
                  onChange={(e) => handleFormChange('company', e.target.value)}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 3, p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 600 }}>
              🔧 Technical Specifications
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Cu Strands"
                  type="number"
                  value={formData.cuStrands}
                  onChange={(e) => handleFormChange('cuStrands', e.target.value)}
                  fullWidth
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Gauge"
                  type="number"
                  value={formData.gauge}
                  onChange={(e) => handleFormChange('gauge', e.target.value)}
                  fullWidth
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Inner OD"
                  type="number"
                  value={formData.innerOD}
                  onChange={(e) => handleFormChange('innerOD', e.target.value)}
                  fullWidth
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
              </Grid>
              {/* <Grid item xs={12} sm={4}>
                <TextField
                  label="Bunch (%)"
                  type="number"
                  value={formData.bunch}
                  fullWidth
                  required
                  InputProps={{ readOnly: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#f5f5f5',
                      '& fieldset': {
                        borderColor: '#ccc',
                      },
                    },
                  }}
                  helperText="Auto-calculated: 3% if >24 strands, 0% otherwise"
                />
              </Grid> */}
              <Grid item xs={12} sm={4}>
                <TextField
                  label="No. of Cores"
                  type="number"
                  value={formData.noOfCores}
                  onChange={(e) => handleFormChange('noOfCores', e.target.value)}
                  fullWidth
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
              </Grid>

            </Grid>
          </Box>

          <Box sx={{ mb: 3, p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 600 }}>
              📏 Dimensions
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Round OD"
                  type="number"
                  value={formData.roundOD}
                  onChange={(e) => handleFormChange('roundOD', e.target.value)}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Flat B"
                  type="number"
                  value={formData.flatB}
                  onChange={(e) => handleFormChange('flatB', e.target.value)}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Flat W"
                  type="number"
                  value={formData.flatW}
                  onChange={(e) => handleFormChange('flatW', e.target.value)}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 3, p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 600 }}>
              💰 Cost & Labor
            </Typography>
            <Grid container spacing={3}>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Length Required"
                  type="number"
                  value={formData.lengthReq}
                  onChange={(e) => handleFormChange('lengthReq', e.target.value)}
                  fullWidth
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => handleFormChange('type', e.target.value)}
                    label="Type"
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        '&:hover': {
                          borderColor: '#1976d2',
                        },
                      },
                    }}
                  >
                    <MenuItem value="Wire">Wire</MenuItem>
                    <MenuItem value="Plug">Plug</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Plug Cost"
                  type="number"
                  value={formData.plugCost}
                  onChange={(e) => handleFormChange('plugCost', e.target.value)}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Terminal/Acc Cost"
                  type="number"
                  value={formData.terminalAccCost}
                  onChange={(e) => handleFormChange('terminalAccCost', e.target.value)}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 600 }}>
              📝 Additional Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Remarks"
                  value={formData.remarks}
                  onChange={(e) => handleFormChange('remarks', e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, backgroundColor: '#f5f5f5', gap: 2 }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            variant="outlined"
            sx={{ 
              borderRadius: 2, 
              px: 3,
              py: 1,
              borderColor: '#666',
              color: '#666',
              '&:hover': {
                borderColor: '#333',
                backgroundColor: '#f0f0f0'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={
              !formData.specifications ||
              !formData.cuStrands ||
              !formData.gauge ||
              !formData.innerOD ||
              !formData.noOfCores ||
              !formData.lengthReq ||
              !formData.type
            }
            sx={{ 
              borderRadius: 2, 
              px: 4,
              py: 1,
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0'
              },
              '&:disabled': {
                backgroundColor: '#ccc',
                color: '#666'
              }
            }}
          >
            <AddIcon sx={{ mr: 1 }} />
            Add Entry
          </Button>
        </DialogActions>
      </Dialog>

      {/* Table */}
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2' }}>
            Costing Entries
          </Typography>
          <Button
            variant="outlined"
            onClick={handleInitializeSheet}
            size="small"
            sx={{ borderRadius: 2 }}
          >
            Initialize Sheet
          </Button>
        </Box>
        
        <TableContainer sx={{ maxHeight: 500, borderRadius: 2, border: '2px solid #e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1565c0', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 100,
                  textAlign: 'center',
                  py: 1
                }}>
                  Costing ID
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 90
                }}>
                  Date
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 150
                }}>
                  Specifications
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 80
                }}>
                  Cu Strands
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 70
                }}>
                  Gauge
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 80
                }}>
                  Inner OD
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 80
                }}>
                  Bunch (%)
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 100
                }}>
                  No. of Cores
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 80
                }}>
                  Round OD
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 70
                }}>
                  Flat B
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 70
                }}>
                  Flat W
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 80
                }}>
                  Laying (%)
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 120
                }}>
                  Copper Weight
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 120
                }}>
                  PVC Weight
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 120
                }}>
                  Final Copper
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 120
                }}>
                  Final PVC Round
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 120
                }}>
                  Final PVC Flat
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 90
                }}>
                  RMC
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 100
                }}>
                  Bundle Cost
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 100
                }}>
                  Bundle Weight
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 100
                }}>
                  Wire Cost/Mtr
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 100
                }}>
                  Length Req
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 90
                }}>
                  Wire Cost
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 80
                }}>
                  Type
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 90
                }}>
                  Plug Cost
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 120
                }}>
                  Terminal Cost
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 90
                }}>
                  Cord Cost
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 100
                }}>
                  Enquiry By
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  borderRight: '1px solid #e0e0e0',
                  minWidth: 100
                }}>
                  Company
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  minWidth: 120
                }}>
                  Remarks
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={32} align="center" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress size={24} sx={{ mr: 2 }} />
                      <Typography>Loading costing entries...</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : costingEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={32} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography variant="h5" color="textSecondary" sx={{ mb: 2 }}>
                        📊 No costing entries found
                      </Typography>
                      <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                        Start by adding your first costing entry
                      </Typography>
                      <Button 
                        variant="contained" 
                        onClick={() => setOpenDialog(true)}
                        sx={{ borderRadius: 2 }}
                      >
                        Add First Entry
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                costingEntries
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((entry, index) => (
                  <TableRow 
                    key={entry.Unique || index}
                    sx={{ 
                      '&:nth-of-type(odd)': { backgroundColor: '#f8f9fa' },
                      '&:hover': { 
                        backgroundColor: '#e3f2fd',
                        transform: 'scale(1.001)',
                        transition: 'all 0.2s ease'
                      },
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      color: '#1976d2',
                      borderRight: '1px solid #e0e0e0',
                      fontFamily: 'monospace',
                      textAlign: 'center'
                    }}>
                      {entry['Costing ID']}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                      {formatDate(entry.Date)}
                    </TableCell>
                    <TableCell sx={{ 
                      borderRight: '1px solid #e0e0e0',
                      maxWidth: 150,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {entry.Specifications}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>
                      {entry['Cu Strands']}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>
                      {entry.Gauge}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>
                      {entry['Inner OD']}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>
                      {entry.Bunch}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>
                      {entry['No. Of Cores']}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>
                      {entry['Round OD']}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>
                      {entry['Flat B']}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>
                      {entry['Flat W']}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>
                      {entry.Laying}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', textAlign: 'right', fontFamily: 'monospace' }}>
                      {entry['Copper Weight (Kgs/100 mtr)']}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', textAlign: 'right', fontFamily: 'monospace' }}>
                      {entry['PVC Weight (Kgs/100 mtr)']}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', textAlign: 'right', fontFamily: 'monospace' }}>
                      {entry['Final Copper (Kgs/100 mtr)']}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', textAlign: 'right', fontFamily: 'monospace' }}>
                      {entry['Final PVC Round (Kgs/100 mtr)']}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', textAlign: 'right', fontFamily: 'monospace' }}>
                      {entry['Final PVC Flat (Kgs/100 mtr)']}
                    </TableCell>
                    <TableCell sx={{ 
                      borderRight: '1px solid #e0e0e0', 
                      textAlign: 'right', 
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      color: '#2e7d32'
                    }}>
                      ₹{entry.RMC}
                    </TableCell>
                    <TableCell sx={{ 
                      borderRight: '1px solid #e0e0e0', 
                      textAlign: 'right', 
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      color: '#1976d2'
                    }}>
                      ₹{entry['Bundle Cost']}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', textAlign: 'right', fontFamily: 'monospace' }}>
                      {entry['Bundle Weight']}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', textAlign: 'right', fontFamily: 'monospace' }}>
                      ₹{entry['Cost Of Wire/Mtr']}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>
                      {entry['Length Required']}
                    </TableCell>
                    <TableCell sx={{ 
                      borderRight: '1px solid #e0e0e0', 
                      textAlign: 'right', 
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      color: '#d32f2f'
                    }}>
                      ₹{entry['Wire Cost']}
                    </TableCell>
                    <TableCell sx={{ 
                      borderRight: '1px solid #e0e0e0', 
                      textAlign: 'center',
                      '& .MuiChip-root': {
                        fontSize: '0.75rem',
                        height: 20
                      }
                    }}>
                      <Chip 
                        label={entry['Type (Wire/Plug)']} 
                        size="small"
                        color={entry['Type (Wire/Plug)'] === 'Wire' ? 'primary' : 'secondary'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', textAlign: 'right', fontFamily: 'monospace' }}>
                      ₹{entry['Plug Cost']}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', textAlign: 'right', fontFamily: 'monospace' }}>
                      ₹{entry['Terminal/Acc. Cost']}
                    </TableCell>
                    <TableCell sx={{ 
                      borderRight: '1px solid #e0e0e0', 
                      textAlign: 'right', 
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      color: '#ed6c02',
                      fontSize: '1.1rem'
                    }}>
                      ₹{entry['Cord Cost']}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>
                      {entry['Enquiry By']}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                      {entry.Company}
                    </TableCell>
                    <TableCell sx={{ 
                      maxWidth: 120,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {entry.Remarks}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        {costingEntries.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 2,
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#f8f9fa'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                Rows per page:
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
                      borderColor: 'rgba(25, 118, 210, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(25, 118, 210, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
                    }
                  }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, costingEntries.length)} of {costingEntries.length} entries
              </Typography>
              
              {Math.ceil(costingEntries.length / rowsPerPage) > 1 && (
                <Pagination
                  count={Math.ceil(costingEntries.length / rowsPerPage)}
                  page={page + 1}
                  onChange={(event, value) => setPage(value - 1)}
                  color="primary"
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
                      '&:hover': {
                        transform: 'scale(1.1)',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                      },
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                        color: 'white',
                        fontWeight: 800,
                        boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                        '&:hover': {
                          transform: 'scale(1.15)',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.4)'
                        }
                      }
                    }
                  }}
                />
              )}
            </Box>
          </Box>
        )}
        
        {costingEntries.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 500, color: '#1976d2' }}>
              📊 Total Entries: <strong>{costingEntries.length}</strong>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Last updated: {new Date().toLocaleString()}
            </Typography>
          </Box>
        )}
      </Paper>

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

export default Costing; 