import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  alpha,
  useTheme,
  styled,
  Badge,
  Stack,
  Divider,
  Pagination,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import {
  Search,
  Visibility,
  Warning,
  CheckCircle,
  LocalShipping,
  Description as DocumentIcon,
  CloudUpload,
  Assignment
} from '@mui/icons-material';
import { formatDate, isOverdue } from '../../utils/dateUtils';
import StatusBadge from '../common/StatusBadge';
import ReceivingDocumentActions from './ReceivingDocumentActions';

// Animated Card component matching dispatch UI
const AnimatedCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: theme.spacing(2),
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'visible',
  boxShadow: theme.shadows[2],
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: theme.shadows[12],
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
    opacity: 0,
    transition: 'opacity 0.3s ease'
  },
  '&:hover::before': {
    opacity: 1
  }
}));

const ReceivingDocumentsList = ({ dispatches, onUploadDocument, title = "Upload Receiving Documents" }) => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter dispatches based on search query
  const filteredDispatches = dispatches.filter(dispatch =>
    (dispatch.DispatchUniqueId && dispatch.DispatchUniqueId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (dispatch.UniqueId && dispatch.UniqueId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (dispatch.ClientCode && dispatch.ClientCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (dispatch.ProductCode && dispatch.ProductCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (dispatch.ProductName && dispatch.ProductName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Paginate dispatches
  const totalPages = Math.ceil(filteredDispatches.length / rowsPerPage);
  const paginatedDispatches = filteredDispatches.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(event.target.value);
    setPage(1);
  };

  // Get document count for a dispatch (same pattern as sales flow)
  const getDocumentCount = (dispatch) => {
    if (!dispatch.receivingDocuments || 
        dispatch.receivingDocuments === '' || 
        dispatch.receivingDocuments === '[]') {
      return 0;
    }
    try {
      const docs = JSON.parse(dispatch.receivingDocuments);
      return Array.isArray(docs) ? docs.length : 0;
    } catch (e) {
      console.error('Error parsing receivingDocuments:', e);
      return 0;
    }
  };

  // Get status chip for dispatch
  const getStatusChip = (dispatch) => {
    const docCount = getDocumentCount(dispatch);
    if (docCount > 0) {
      return (
        <Chip
          icon={<CheckCircle sx={{ fontSize: 16 }} />}
          label={`${docCount} Document${docCount > 1 ? 's' : ''}`}
          size="small"
          sx={{
            backgroundColor: alpha(theme.palette.success.main, 0.1),
            color: theme.palette.success.main,
            fontWeight: 600,
            fontSize: '0.75rem',
            border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
          }}
        />
      );
    } else {
      return (
        <Chip
          icon={<Warning sx={{ fontSize: 16 }} />}
          label="No Documents"
          size="small"
          sx={{
            backgroundColor: alpha(theme.palette.warning.main, 0.1),
            color: theme.palette.warning.main,
            fontWeight: 600,
            fontSize: '0.75rem',
            border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
          }}
        />
      );
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        pb: 2,
        borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`
      }}>
        <Box>
          <Typography 
            variant="h5" 
            sx={{ 
              color: theme.palette.primary.main,
              fontWeight: 700,
              mb: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <CloudUpload sx={{ fontSize: 28 }} />
            {title}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.secondary
            }}
          >
            {filteredDispatches.length} dispatch{filteredDispatches.length !== 1 ? 'es' : ''} ready for receiving documents
          </Typography>
        </Box>
        
        <TextField
          placeholder="Search Dispatch ID, Unique ID, Client, Product..."
          size="small"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: theme.palette.primary.main }} />
              </InputAdornment>
            ),
          }}
          sx={{ 
            width: '400px',
            '& .MuiOutlinedInput-root': {
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              '& fieldset': { 
                borderColor: alpha(theme.palette.primary.main, 0.2),
                borderWidth: 2
              },
              '&:hover fieldset': { 
                borderColor: theme.palette.primary.main 
              },
              '&.Mui-focused fieldset': { 
                borderColor: theme.palette.primary.main 
              }
            }
          }}
        />
      </Box>

      {/* Cards Grid */}
      {paginatedDispatches.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {paginatedDispatches.map((dispatch) => (
              <Grid item xs={12} sm={6} md={4} key={dispatch._uniqueKey || dispatch.DispatchUniqueId}>
                <AnimatedCard>
                  <CardContent sx={{ p: 3 }}>
                    {/* Header with Dispatch ID and Status */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Chip
                          label={dispatch.DispatchUniqueId || 'N/A'}
                          size="small"
                          sx={{
                            backgroundColor: alpha(theme.palette.success.main, 0.1),
                            color: theme.palette.success.dark,
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            fontSize: '0.7rem',
                            mb: 1,
                            border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                          }}
                        />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                          {dispatch.UniqueId}
                        </Typography>
                      </Box>
                      {getStatusChip(dispatch)}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Dispatch Details */}
                    <Stack spacing={1.5}>
                      {/* Client */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Assignment sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                            Client
                          </Typography>
                          <Chip
                            label={dispatch.ClientCode}
                            size="small"
                            sx={{
                              backgroundColor: alpha(theme.palette.info.main, 0.1),
                              color: theme.palette.info.dark,
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 24
                            }}
                          />
                        </Box>
                      </Box>

                      {/* Product */}
                      <Box>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                          Product
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                          {dispatch.ProductCode}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {dispatch.ProductName}
                        </Typography>
                      </Box>

                      {/* Batch Info */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                            Batch
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.warning.dark }}>
                            Batch #{dispatch.BatchNumber || '1'}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                            Quantity
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {/* Show updatedBatch if exists, otherwise show original BatchSize */}
                            {(dispatch.updatedBatch || dispatch.BatchSize || dispatch.Quantity || 0).toLocaleString()} pcs
                            {dispatch.updatedBatch && dispatch.BatchSize && dispatch.updatedBatch !== dispatch.BatchSize && (
                              <Typography 
                                component="span" 
                                variant="caption" 
                                sx={{ 
                                  color: '#9e9e9e',
                                  fontSize: '0.7rem',
                                  textDecoration: 'line-through',
                                  ml: 0.5,
                                  display: 'block'
                                }}
                              >
                                Original: {dispatch.BatchSize.toLocaleString()} pcs
                              </Typography>
                            )}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Dispatch Date */}
                      {dispatch.DispatchDate && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocalShipping sx={{ fontSize: 18, color: theme.palette.success.main }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                              Dispatch Date
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.dark }}>
                              {formatDate(dispatch.DispatchDate)}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    {/* Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                      <ReceivingDocumentActions
                        task={dispatch}
                        onUpload={onUploadDocument}
                        onView={(doc) => {}}
                      />
                    </Box>
                  </CardContent>
                </AnimatedCard>
              </Grid>
            ))}
          </Grid>
        </>
      ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No receiving documents to display
              </Typography>
            </Box>
          )}
    </Box>
  );
};

export default ReceivingDocumentsList;

