import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  Grid, 
  Divider, 
  Chip,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  ArrowForward, 
  Close, 
  Upload, 
  Description, 
  Info, 
  Timeline,
  Schedule,
  Assignment,
  Business,
  Build,
  CheckCircle,
  Warning,
  Cable as CableIcon,
  LocalShipping,
  Inventory,
  Verified,
  PlayArrow,
  Analytics,
  Speed,
  TrendingUp,
  Assessment
} from '@mui/icons-material';
import StatusBadge from '../common/StatusBadge';
import { formatDate, formatDateTime, isOverdue } from '../../utils/dateUtils';
import { canAdvance } from '../../utils/statusUtils';
import { useAuth } from '../../context/AuthContext';
import CableProductionTaskDetail from './CableProductionTaskDetail';
import FlowNavigation from './FlowNavigation';
import config from '../../config/config';
import { getOrderedStageDueDates, formatDispatchDate, calculateStageDueDates } from '../../utils/backwardPlanning';
import { getStatusOnly } from '../../utils/statusDateUtils';
import sheetService from '../../services/sheetService';
import { getAllClients } from '../../services/clientService';

const TaskDetail = ({ task, open, onClose, onAdvance, auditLog = [] }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [file, setFile] = useState(null);
  const [sheetData, setSheetData] = useState(null);
  const [loadingSheetData, setLoadingSheetData] = useState(false);
  const { user: currentUser } = useAuth();

  // Fetch data from Google Sheets when task is opened
  useEffect(() => {
    if (open && task) {
      fetchSheetData();
    }
  }, [open, task]);

  const fetchSheetData = async () => {
    if (!task) return;
    
    try {
      setLoadingSheetData(true);
      
      // Fetch dispatch data from Dispatches sheet
      let dispatchData = null;
      if (task.DispatchUniqueId || task.UniqueId) {
        const dispatches = await sheetService.getSheetData('Dispatches', true);
        dispatchData = dispatches.find(d => 
          d.DispatchUniqueId === task.DispatchUniqueId || 
          d.UniqueId === task.UniqueId
        );
      }

      // Fetch client and product data from Clients sheet
      let clientData = null;
      let productData = null;
      if (task.ClientCode) {
        const clients = await getAllClients(true);
        clientData = clients.find(c => c.clientCode === task.ClientCode);
        
        if (clientData && clientData.products && Array.isArray(clientData.products)) {
          productData = clientData.products.find(p => 
            (p.productCode || p.code) === task.ProductCode
          );
        }
      }

      setSheetData({
        dispatch: dispatchData,
        client: clientData,
        product: productData
      });
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      setSheetData(null);
    } finally {
      setLoadingSheetData(false);
    }
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleAdvance = () => {
    onAdvance(task, file);
    onClose();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  if (!task) return null;
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      scroll="paper"
      PaperProps={{ 
        sx: { 
          borderRadius: { xs: 0, sm: 3, md: 4 },
          border: '1px solid rgba(59, 130, 246, 0.15)',
          overflow: 'hidden',
          maxHeight: { xs: '100vh', sm: '90vh' },
          margin: { xs: 0, sm: 2 },
          width: { xs: '100%', sm: 'calc(100% - 32px)' },
          boxShadow: '0 20px 40px rgba(59, 130, 246, 0.12)',
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95))',
          backdropFilter: 'blur(20px)'
        } 
      }}
    >
      <DialogTitle 
        sx={{ 
          backgroundColor: '#1976d2',
          color: 'white',
          py: 2,
          px: 3,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                fontSize: '1.1rem',
                mb: 0.5
              }}
            >
              {task.POId}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              {task.ProductCode || task.Name || 'Product Batch'}
            </Typography>
          </Box>
          <StatusBadge status={task.Status} />
        </Box>
      </DialogTitle>
      
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ 
          px: { xs: 2, sm: 3 }, 
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          minHeight: 56,
          '& .MuiTabs-indicator': {
            backgroundColor: '#1976d2',
            height: 2,
            borderRadius: '2px 2px 0 0'
          },
          '& .MuiTabs-flexContainer': {
            gap: 1
          }
        }}
      >
        <Tab 
          icon={<Info />} 
          label="Details" 
          iconPosition="start"
          sx={{
            color: '#64748b',
            fontWeight: 500,
            textTransform: 'none',
            padding: '12px 20px',
            minHeight: 56,
            fontSize: '0.875rem',
            '&.Mui-selected': { 
              color: '#1976d2',
              fontWeight: 600
            },
            '&:hover': {
              color: '#1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.04)'
            }
          }}
        />
        <Tab 
          icon={<Timeline />} 
          label="Flow Progress" 
          iconPosition="start"
          sx={{
            color: '#64748b',
            fontWeight: 500,
            textTransform: 'none',
            padding: '12px 20px',
            minHeight: 56,
            fontSize: '0.875rem',
            '&.Mui-selected': { 
              color: '#1976d2',
              fontWeight: 600
            },
            '&:hover': {
              color: '#1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.04)'
            }
          }}
        />
        {task.Status === config.statusCodes.CABLE_PRODUCTION && (
          <Tab 
            icon={<CableIcon />} 
            label="Cable Production" 
            iconPosition="start"
            sx={{
              color: '#64748b',
              fontWeight: 500,
              textTransform: 'none',
              padding: '12px 20px',
              minHeight: 56,
              fontSize: '0.875rem',
              '&.Mui-selected': { 
                color: '#1976d2',
                fontWeight: 600
              },
              '&:hover': {
                color: '#1976d2',
                backgroundColor: 'rgba(25, 118, 210, 0.04)'
              }
            }}
          />
        )}
        <Tab 
          icon={<Timeline />} 
          label="History" 
          iconPosition="start"
          sx={{
            color: '#64748b',
            fontWeight: 500,
            textTransform: 'none',
            padding: '12px 20px',
            minHeight: 56,
            fontSize: '0.875rem',
            '&.Mui-selected': { 
              color: '#1976d2',
              fontWeight: 600
            },
            '&:hover': {
              color: '#1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.04)'
            }
          }}
        />
        <Tab 
          icon={<Analytics />} 
          label="Analytics" 
          iconPosition="start"
          sx={{
            color: '#64748b',
            fontWeight: 500,
            textTransform: 'none',
            padding: '12px 20px',
            minHeight: 56,
            fontSize: '0.875rem',
            '&.Mui-selected': { 
              color: '#1976d2',
              fontWeight: 600
            },
            '&:hover': {
              color: '#1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.04)'
            }
          }}
        />
      </Tabs>
      
      <DialogContent sx={{ 
        py: { xs: 2, sm: 3 }, 
        px: { xs: 2, sm: 3 }, 
        backgroundColor: 'rgba(248, 250, 252, 0.5)',
        position: 'relative'
      }}>
        {loadingSheetData && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ ml: 2, color: '#64748b' }}>
              Loading data from sheets...
            </Typography>
          </Box>
        )}
        {activeTab === 0 ? (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ 
                  p: 2.5, 
                  borderRadius: 2, 
                  backgroundColor: '#fff',
                  border: '1px solid #e8eaf6',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.08)',
                    borderColor: '#1976d2'
                  }
                }}>
                  <Typography variant="caption" sx={{ 
                    display: 'block', 
                    mb: 1, 
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#64748b'
                  }}>
                    Client Code
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', fontSize: '1rem' }}>
                    {task.ClientCode}
                  </Typography>
                  {sheetData?.client?.clientName && (
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
                      {sheetData.client.clientName}
                    </Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ 
                  p: 2.5, 
                  borderRadius: 2, 
                  backgroundColor: '#fff',
                  border: '1px solid #e8eaf6',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.08)',
                    borderColor: '#1976d2'
                  }
                }}>
                  <Typography variant="caption" sx={{ 
                    display: 'block', 
                    mb: 1, 
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#64748b'
                  }}>
                    Product Code
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', fontSize: '1rem' }}>
                    {task.ProductCode}
                  </Typography>
                  {sheetData?.product?.productName && (
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
                      {sheetData.product.productName}
                    </Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ 
                  p: 2.5, 
                  borderRadius: 2, 
                  backgroundColor: '#fff',
                  border: '1px solid #e8eaf6',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.08)',
                    borderColor: '#1976d2'
                  }
                }}>
                  <Typography variant="caption" sx={{ 
                    display: 'block', 
                    mb: 1, 
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#64748b'
                  }}>
                    PO Name
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 500, color: '#1e293b', fontSize: '0.95rem' }}>
                    {task.Name || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ 
                  p: 2.5, 
                  borderRadius: 2, 
                  backgroundColor: '#fff',
                  border: '1px solid #e8eaf6',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.08)',
                    borderColor: '#1976d2'
                  }
                }}>
                  <Typography variant="caption" sx={{ 
                    display: 'block', 
                    mb: 1, 
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#64748b'
                  }}>
                    Quantity
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#059669', fontSize: '1rem' }}>
                    {task.Quantity?.toLocaleString() || '0'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ 
                  p: 2.5, 
                  borderRadius: 2, 
                  backgroundColor: '#fff',
                  border: '1px solid #e8eaf6',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.08)',
                    borderColor: '#1976d2'
                  }
                }}>
                  <Typography variant="caption" sx={{ 
                    display: 'block', 
                    mb: 1, 
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#64748b'
                  }}>
                    Order Type
                  </Typography>
                  <Chip 
                    label={task.OrderType === 'CABLE_ONLY' ? 'Cable Only' : 'Power Cord'}
                    size="small"
                    sx={{ 
                      fontWeight: 600,
                      backgroundColor: task.OrderType === 'CABLE_ONLY' ? '#ede9fe' : '#dbeafe',
                      color: task.OrderType === 'CABLE_ONLY' ? '#7c3aed' : '#1e40af',
                      height: 24,
                      fontSize: '0.75rem'
                    }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ 
                  p: 2.5, 
                  borderRadius: 2, 
                  backgroundColor: '#fff',
                  border: isOverdue(task.DueDate) ? '1px solid #fee2e2' : '1px solid #e8eaf6',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: isOverdue(task.DueDate) 
                      ? '0 4px 12px rgba(220, 38, 38, 0.12)' 
                      : '0 4px 12px rgba(25, 118, 210, 0.08)',
                    borderColor: isOverdue(task.DueDate) ? '#dc2626' : '#1976d2'
                  }
                }}>
                  <Typography variant="caption" sx={{ 
                    display: 'block', 
                    mb: 1, 
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#64748b'
                  }}>
                    Due Date
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: isOverdue(task.DueDate) ? '#dc2626' : '#1e293b', 
                      fontSize: '0.95rem'
                    }}>
                      {formatDate(task.DueDate)}
                    </Typography>
                    {isOverdue(task.DueDate) && (
                      <Chip 
                        label="OVERDUE" 
                        size="small" 
                        sx={{ 
                          fontWeight: 600, 
                          height: 22,
                          fontSize: '0.7rem',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626'
                        }} 
                      />
                    )}
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ 
                  p: 2.5, 
                  borderRadius: 2, 
                  backgroundColor: '#fff',
                  border: '1px solid #e8eaf6',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.08)',
                    borderColor: '#1976d2'
                  }
                }}>
                  <Typography variant="caption" sx={{ 
                    display: 'block', 
                    mb: 1, 
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#64748b'
                  }}>
                    Created By
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#475569', fontSize: '0.9rem' }}>
                    {task.CreatedBy?.split('@')[0] || task.CreatedBy || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ 
                  p: 2.5, 
                  borderRadius: 2, 
                  backgroundColor: '#fff',
                  border: '1px solid #e8eaf6',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.08)',
                    borderColor: '#1976d2'
                  }
                }}>
                  <Typography variant="caption" sx={{ 
                    display: 'block', 
                    mb: 1, 
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#64748b'
                  }}>
                    Assigned To
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#475569', fontSize: '0.9rem' }}>
                    {task.AssignedTo?.split('@')[0] || task.AssignedTo || 'Unassigned'}
                  </Typography>
                </Box>
              </Grid>
              
              {task.Description && (
                <Grid item xs={12}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(59, 130, 246, 0.1)',
                      borderRadius: 3,
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 20px rgba(25, 118, 210, 0.12)',
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(255, 255, 255, 1)'
                      }
                    }}
                  >
                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1, fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      <Description sx={{ fontSize: 16, mr: 1, color: '#1976d2' }} />
                      Description
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#37474f', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      {task.Description}
                    </Typography>
                  </Paper>
                </Grid>
              )}
              
              {task.PODocumentId && (
                <Grid item xs={12}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(59, 130, 246, 0.1)',
                      borderRadius: 3,
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 20px rgba(25, 118, 210, 0.12)',
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(255, 255, 255, 1)'
                      }
                    }}
                  >
                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1, fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      <Description sx={{ fontSize: 16, mr: 1, color: '#1976d2' }} />
                      PO Document
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Description />}
                      size="small"
                      sx={{ mt: 1 }}
                      // In a real app, this would link to the document
                      onClick={() => window.open(`https://drive.google.com/file/d/${task.PODocumentId}/view`, '_blank')}
                    >
                      View Document
                    </Button>
                  </Paper>
                </Grid>
              )}

              {/* Production Timeline - Show when dispatch date is scheduled */}
              {task.DispatchDate && task.Store1DueDate && (
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      backgroundColor: 'rgba(76, 175, 80, 0.05)',
                      border: '2px solid rgba(76, 175, 80, 0.3)',
                      borderRadius: 3,
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 24px rgba(76, 175, 80, 0.2)',
                        borderColor: '#4caf50',
                        backgroundColor: 'rgba(76, 175, 80, 0.08)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <LocalShipping sx={{ fontSize: 20, color: '#4caf50' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4caf50', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        Production Timeline (Backward Planning)
                      </Typography>
                    </Box>
                    
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Dispatch Scheduled:</strong> {formatDispatchDate(task.DispatchDate)}
                      </Typography>
                    </Alert>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {(() => {
                        // Use sheet data if available, otherwise fall back to task data
                        const dispatchData = sheetData?.dispatch || {};
                        let dispatchDate = task.DispatchDate || dispatchData.DispatchDate;
                        
                        // Helper function to parse date from DD/MM/YYYY or other formats
                        const parseDispatchDate = (dateStr) => {
                          if (!dateStr) return null;
                          // Try parsing DD/MM/YYYY format first
                          if (typeof dateStr === 'string' && dateStr.includes('/')) {
                            const parts = dateStr.split('/');
                            if (parts.length === 3) {
                              // DD/MM/YYYY format
                              const day = parseInt(parts[0], 10);
                              const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
                              const year = parseInt(parts[2], 10);
                              const date = new Date(year, month, day);
                              if (!isNaN(date.getTime())) return date;
                            }
                          }
                          // Try standard Date parsing
                          const date = new Date(dateStr);
                          return !isNaN(date.getTime()) ? date : null;
                        };
                        
                        // Parse dispatch date
                        const parsedDispatchDate = parseDispatchDate(dispatchDate);
                        
                        // If we have a dispatch date, calculate missing dates
                        let calculatedDates = {};
                        if (parsedDispatchDate) {
                          try {
                            calculatedDates = calculateStageDueDates(parsedDispatchDate, task.OrderType || 'POWER_CORD', true);
                          } catch (error) {
                            console.error('Error calculating dates:', error);
                          }
                        }
                        
                        const dueDates = {
                          DispatchDate: dispatchDate || calculatedDates.DispatchDate,
                          Store1DueDate: task.Store1DueDate || dispatchData.Store1DueDate || calculatedDates.Store1DueDate,
                          CableProductionDueDate: task.CableProductionDueDate || dispatchData.CableProductionDueDate || calculatedDates.CableProductionDueDate,
                          Store2DueDate: task.Store2DueDate || dispatchData.Store2DueDate || calculatedDates.Store2DueDate,
                          MouldingDueDate: task.MouldingDueDate || dispatchData.MouldingDueDate || calculatedDates.MouldingDueDate,
                          FGSectionDueDate: task.FGSectionDueDate || dispatchData.FGSectionDueDate || calculatedDates.FGSectionDueDate
                        };
                        const orderedDates = getOrderedStageDueDates(dueDates);
                        
                        return orderedDates.map((stageInfo, index) => {
                          // Ensure we have a date to display
                          const displayDate = stageInfo.dueDate ? formatDispatchDate(stageInfo.dueDate) : 'N/A';
                          
                          return (
                          <Box
                            key={stageInfo.status}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              p: 1.5,
                              backgroundColor: task.Status === stageInfo.status 
                                ? '#fff3e0'
                                : index === orderedDates.length - 1
                                ? '#e8f5e9'
                                : '#f8fbff',
                              borderRadius: 1,
                              border: task.Status === stageInfo.status
                                ? '2px solid #ff9800'
                                : index === orderedDates.length - 1
                                ? '1px solid #4caf50'
                                : '1px solid #e3f2fd',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              {task.Status === stageInfo.status && (
                                <PlayArrow sx={{ color: '#ff9800', fontSize: 20 }} />
                              )}
                              <Chip
                                label={stageInfo.label}
                                size="small"
                                sx={{
                                  backgroundColor: task.Status === stageInfo.status
                                    ? '#ff9800'
                                    : index === orderedDates.length - 1
                                    ? '#4caf50'
                                    : '#1976d2',
                                  color: 'white',
                                  fontWeight: 600,
                                  minWidth: 45,
                                  fontSize: '0.75rem'
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: task.Status === stageInfo.status ? 700 : 500,
                                  color: task.Status === stageInfo.status
                                    ? '#e65100'
                                    : index === orderedDates.length - 1
                                    ? '#2e7d32'
                                    : '#37474f',
                                  fontSize: { xs: '0.85rem', sm: '0.9rem' }
                                }}
                              >
                                {stageInfo.stage}
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: 'monospace',
                                fontSize: { xs: '0.8rem', sm: '0.85rem' },
                                fontWeight: 600,
                                color: displayDate === 'N/A' 
                                  ? '#94a3b8'
                                  : task.Status === stageInfo.status
                                  ? '#e65100'
                                  : index === orderedDates.length - 1
                                  ? '#2e7d32'
                                  : '#1976d2',
                                backgroundColor: displayDate === 'N/A'
                                  ? '#f1f5f9'
                                  : task.Status === stageInfo.status
                                  ? 'white'
                                  : index === orderedDates.length - 1
                                  ? 'white'
                                  : '#e3f2fd',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1,
                                fontStyle: displayDate === 'N/A' ? 'italic' : 'normal'
                              }}
                            >
                              {displayDate}
                            </Typography>
                          </Box>
                        );
                        });
                      })()}
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
            
            {/* Completion Summary for Completed Tasks */}
            {task.Status === 'COMPLETED' && (
              <Paper 
                elevation={0}
                sx={{ 
                  mt: { xs: 2, sm: 3 }, 
                  p: { xs: 2, sm: 2.5, md: 3 }, 
                  backgroundColor: 'rgba(76, 175, 80, 0.08)',
                  border: '2px solid rgba(76, 175, 80, 0.3)',
                  borderRadius: 3,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 24px rgba(76, 175, 80, 0.2)',
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.12)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CheckCircle sx={{ color: '#4caf50', fontSize: 24 }} />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: '#2e7d32', 
                      fontWeight: 600,
                      fontSize: { xs: '1.1rem', sm: '1.25rem' }
                    }}
                  >
                    Task Completed Successfully
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
                      Completed Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#2e7d32' }}>
                      {task.CompletionDate ? formatDate(task.CompletionDate) : 'Date not recorded'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
                      Completed By
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#2e7d32' }}>
                      {task.AssignedTo || 'Unknown'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Action Section */}
            {canAdvance(task.Status) && currentUser.email === task.AssignedTo && (
              <Paper 
                elevation={0}
                sx={{ 
                  mt: { xs: 2, sm: 3 }, 
                  p: { xs: 2, sm: 2.5, md: 3 }, 
                  backgroundColor: 'rgba(25, 118, 210, 0.03)',
                  border: '1px solid rgba(25, 118, 210, 0.15)',
                  borderRadius: 3,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(25, 118, 210, 0.12)',
                    borderColor: '#1976d2',
                    backgroundColor: 'rgba(25, 118, 210, 0.05)'
                  }
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#3b82f6', 
                    fontWeight: 600, 
                    mb: 2,
                    fontSize: { xs: '1.1rem', sm: '1.25rem' }
                  }}
                >
                  Task Actions
                </Typography>
                
                <Box>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: { xs: 1, sm: 2 }, 
                    flexWrap: 'wrap',
                    flexDirection: { xs: 'column', sm: 'row' }
                  }}>
                    {canAdvance(task.Status) && (
                      <Box>
                        <input
                          type="file"
                          id="file-upload"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="file-upload">
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<Upload />}
                            size="small"
                            sx={{
                              borderColor: '#3b82f6',
                              color: '#3b82f6',
                              '&:hover': {
                                borderColor: '#1565c0',
                                backgroundColor: '#f8fbff'
                              },
                              width: { xs: '100%', sm: 'auto' }
                            }}
                          >
                            Upload Document
                          </Button>
                        </label>
                        {file && (
                          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#1976d2' }}>
                            Selected: {file.name}
                          </Typography>
                        )}
                      </Box>
                    )}
                    
                    {canAdvance(task.Status) && (
                      <Button
                        variant="contained"
                        startIcon={<ArrowForward />}
                        onClick={handleAdvance}
                        size="small"
                        sx={{
                          backgroundColor: '#4caf50',
                          '&:hover': { backgroundColor: '#2e7d32' },
                          width: { xs: '100%', sm: 'auto' }
                        }}
                      >
                        Advance Task
                      </Button>
                    )}
                    
                  </Box>
                </Box>
              </Paper>
            )}
          </>
        ) : activeTab === 1 ? (
          <Paper 
            elevation={0}
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(25, 118, 210, 0.1)',
              borderRadius: 3,
              p: 4,
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                boxShadow: '0 8px 20px rgba(25, 118, 210, 0.12)',
                borderColor: '#1976d2'
              }
            }}
          >
            <Timeline sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
            <Typography variant="h5" sx={{ color: '#1976d2', fontWeight: 600, mb: 1 }}>
              Flow Progress
            </Typography>
            <Typography variant="h6" sx={{ color: '#546e7a', fontWeight: 500, mb: 2 }}>
              Coming Soon
            </Typography>
            <Typography variant="body1" sx={{ color: '#78909c', opacity: 0.8 }}>
              This feature is currently under development and will be available soon.
            </Typography>
          </Paper>
        ) : activeTab === 2 && task.Status === config.statusCodes.CABLE_PRODUCTION ? (
          <CableProductionTaskDetail task={task} />
        ) : activeTab === 3 ? (
          <Paper 
            elevation={0}
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(59, 130, 246, 0.1)',
              borderRadius: 3,
              p: 4,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                boxShadow: '0 12px 24px rgba(59, 130, 246, 0.12)',
                borderColor: '#3b82f6'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Analytics sx={{ fontSize: 32, color: '#3b82f6' }} />
              <Typography variant="h5" sx={{ color: '#3b82f6', fontWeight: 600 }}>
                Task Analytics
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                  <Speed sx={{ fontSize: 32, color: '#3b82f6', mb: 1 }} />
                  <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 600 }}>
                    {task.Status === 'COMPLETED' ? '100%' : '75%'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Progress
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <TrendingUp sx={{ fontSize: 32, color: '#10b981', mb: 1 }} />
                  <Typography variant="h6" sx={{ color: '#047857', fontWeight: 600 }}>
                    {task.Quantity || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Quantity
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                  <Schedule sx={{ fontSize: 32, color: '#f59e0b', mb: 1 }} />
                  <Typography variant="h6" sx={{ color: '#d97706', fontWeight: 600 }}>
                    {task.DueDate ? new Date(task.DueDate).toLocaleDateString() : 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Due Date
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
                  <Assessment sx={{ fontSize: 32, color: '#8b5cf6', mb: 1 }} />
                  <Typography variant="h6" sx={{ color: '#7c3aed', fontWeight: 600 }}>
                    {task.Status}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Status
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(248, 250, 252, 0.8)', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 600, mb: 2 }}>
                Performance Metrics
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                • Task created: {task.CreatedDate ? new Date(task.CreatedDate).toLocaleDateString() : 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                • Assigned to: {task.AssignedTo || 'Unassigned'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                • Client: {task.ClientCode}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                • Product: {task.ProductCode}
              </Typography>
            </Box>
          </Paper>
        ) : (
          <Paper 
            elevation={0}
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(59, 130, 246, 0.1)',
              borderRadius: 3,
              p: 4,
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                boxShadow: '0 12px 24px rgba(59, 130, 246, 0.12)',
                borderColor: '#3b82f6'
              }
            }}
          >
            <Timeline sx={{ fontSize: 48, color: '#3b82f6', mb: 2 }} />
            <Typography variant="h5" sx={{ color: '#3b82f6', fontWeight: 600, mb: 1 }}>
              History
            </Typography>
            <Typography variant="h6" sx={{ color: '#546e7a', fontWeight: 500, mb: 2 }}>
              Coming Soon
            </Typography>
            <Typography variant="body1" sx={{ color: '#78909c', opacity: 0.8 }}>
              This feature is currently under development and will be available soon.
            </Typography>
          </Paper>
        )}
      </DialogContent>
      
      <DialogActions sx={{ 
        p: { xs: 2, sm: 3 }, 
        backgroundColor: 'rgba(25, 118, 210, 0.02)',
        justifyContent: { xs: 'center', sm: 'flex-end' },
        borderTop: '1px solid rgba(25, 118, 210, 0.1)'
      }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          size="medium"
          sx={{
            borderColor: 'rgba(25, 118, 210, 0.5)',
                    color: '#3b82f6',
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              borderColor: '#1976d2',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
            },
            minWidth: { xs: 120, sm: 'auto' },
            width: { xs: '100%', sm: 'auto' },
            maxWidth: { xs: 200, sm: 'none' }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetail; 