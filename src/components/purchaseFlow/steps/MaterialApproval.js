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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  CloudUpload as CloudUploadIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon
} from '@mui/icons-material';
import BaseStepComponent from './BaseStepComponent';
import { useStepStatus } from '../../../context/StepStatusContext';
import purchaseFlowService from '../../../services/purchaseFlowService';
import { useAuth } from '../../../context/AuthContext';
import config from '../../../config/config';
import sheetService from '../../../services/sheetService';

const MaterialApproval = () => {
  const { stepStatuses, setStepStatuses } = useStepStatus();
  const { user } = useAuth();
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [approveFiles, setApproveFiles] = useState({ invoice: null, dc: null, poCopy: null });
  const [approveUploading, setApproveUploading] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [expandedPOs, setExpandedPOs] = useState({});
  const [noteUpdates, setNoteUpdates] = useState({});
  const theme = useTheme();

  useEffect(() => {
    const fetchPOs = async () => {
      setLoading(true);
      try {
        // Get all POs from SortVendor whose nextStep is 13
        const pos = await purchaseFlowService.getPOsForMaterialApproval();
        setPOs(pos);
      } catch (err) {
        setSnackbar({ open: true, message: 'Failed to fetch POs: ' + err.message, severity: 'error' });
      }
      setLoading(false);
    };
    fetchPOs();
  }, []);

  const openApproveDialog = async (po) => {
    // Try to pre-fill PO Copy from FollowUpDelivery if available
    let poCopyFileId = '';
    try {
      const followUpDelivery = await sheetService.getSheetData('FollowUpDelivery');
      const entry = followUpDelivery.find(e => e.POId === po.POId);
      if (entry && entry.POCopyFileId) poCopyFileId = entry.POCopyFileId;
    } catch {}
    setApproveFiles({ invoice: null, dc: null, poCopy: poCopyFileId ? { name: 'PO Copy', fileId: poCopyFileId } : null });
    setSelectedPO(po);
    setApproveDialog(true);
  };
  const closeApproveDialog = () => {
    setApproveDialog(false);
    setSelectedPO(null);
    setApproveFiles({ invoice: null, dc: null, poCopy: null });
  };
  const openRejectDialog = (po) => {
    setSelectedPO(po);
    setRejectionNote('');
    setRejectDialog(true);
  };
  const closeRejectDialog = () => {
    setRejectDialog(false);
    setSelectedPO(null);
    setRejectionNote('');
  };
  const handleApproveFileChange = (field, file) => {
    setApproveFiles(prev => ({ ...prev, [field]: file }));
  };

  // Check if all required documents are uploaded
  const areAllDocumentsUploaded = () => {
    const hasInvoice = !!approveFiles.invoice;
    const hasDC = !!approveFiles.dc;
    const hasPOCopy = !!(approveFiles.poCopy && (approveFiles.poCopy.name || approveFiles.poCopy.fileId));
    return hasInvoice && hasDC && hasPOCopy;
  };

  const handleApprove = async () => {
    if (!selectedPO) return;
    
    // Documents are optional - proceed with approval
    setApproveUploading(true);
    try {
      // Get or create Material Approval folder in Google Drive
      const materialApprovalFolderId = await sheetService.getOrCreateFolder('Material Approval');
      
      // Get or create PO-specific subfolder for better organization
      let poFolderId = null;
      if (materialApprovalFolderId && selectedPO.POId) {
        poFolderId = await sheetService.getOrCreateFolder(selectedPO.POId, materialApprovalFolderId);
      }

      // Use PO folder if available, otherwise use Material Approval folder, otherwise null (root)
      const targetFolderId = poFolderId || materialApprovalFolderId;

      // Upload files to the organized folder structure on Google Drive
      let invoiceFileId = approveFiles.invoice ? await sheetService.uploadFile(approveFiles.invoice, targetFolderId) : '';
      let dcFileId = approveFiles.dc ? await sheetService.uploadFile(approveFiles.dc, targetFolderId) : '';
      let poCopyFileId = approveFiles.poCopy?.fileId || (approveFiles.poCopy ? await sheetService.uploadFile(approveFiles.poCopy, targetFolderId) : '');
      
      await purchaseFlowService.saveMaterialApproval({
        poId: selectedPO.POId,
        vendorDetails: selectedPO.VendorDetails,
        items: selectedPO.Items,
        approvalStatus: 'approved',
        invoiceFileId,
        dcFileId,
        poCopyFileId,
        rejectionNote: '',
        userEmail: user?.email || 'Store Manager'
      });
      setSnackbar({ open: true, message: 'Material approved successfully! Files stored on Google Drive.', severity: 'success' });
      setPOs(prev => prev.filter(po => po.POId !== selectedPO.POId));
      closeApproveDialog();
    } catch (err) {
      console.error('Error approving material:', err);
      setSnackbar({ open: true, message: 'Failed to approve material: ' + (err.message || 'Unknown error'), severity: 'error' });
    }
    setApproveUploading(false);
  };
  const handleReject = async () => {
    if (!selectedPO || !rejectionNote.trim()) {
      setSnackbar({ open: true, message: 'Please provide a rejection note', severity: 'error' });
      return;
    }
    try {
      await purchaseFlowService.saveMaterialApproval({
        poId: selectedPO.POId,
        vendorDetails: selectedPO.VendorDetails,
        items: selectedPO.Items,
        approvalStatus: 'rejected',
        invoiceFileId: '',
        dcFileId: '',
        poCopyFileId: '',
        rejectionNote,
        userEmail: user?.email || 'Purchase Executive'
      });
      setSnackbar({ open: true, message: 'Material rejected successfully!', severity: 'success' });
      setPOs(prev => prev.filter(po => po.POId !== selectedPO.POId));
      closeRejectDialog();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to reject material', severity: 'error' });
    }
  };

  const togglePOExpansion = (poId) => {
    setExpandedPOs(prev => ({ ...prev, [poId]: !prev[poId] }));
  };

  const handleNoteChange = (poId, note) => {
    setNoteUpdates(prev => ({ ...prev, [poId]: note }));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
      default:
        return 'warning';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckIcon color="success" />;
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

  return (
    <BaseStepComponent>
      {/* Header Card */}
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
                <AssignmentIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Material Approval
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Review, approve, or reject received materials for purchase orders
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
                label="Step 13" 
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
          boxShadow: `0 4px 20px ${alpha(theme.palette.success.main, 0.1)}`
        }}>
          <Box sx={{ mb: 3 }}>
            <Avatar sx={{ 
              width: 80, 
              height: 80, 
              mx: 'auto', 
              mb: 2,
              background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`
            }}>
              <AssignmentIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" sx={{ color: theme.palette.success.main, fontWeight: 600, mb: 1 }}>
              No Purchase Orders Found
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', maxWidth: 400, mx: 'auto' }}>
              There are no purchase orders currently at step 13 (Material Approval). 
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
              boxShadow: `0 4px 20px ${alpha(theme.palette.success.main, 0.1)}`,
              border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, 0.2)}`
              }
            }}>
              <CardContent sx={{ p: 0 }}>
                {/* PO Header */}
                <Box sx={{ 
                  p: 3, 
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)}, ${alpha(theme.palette.success.dark, 0.05)})`,
                  borderBottom: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
                }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: theme.palette.success.main, 
                          width: 48, 
                          height: 48,
                          boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`
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
                          bgcolor: alpha(theme.palette.success.main, 0.1), 
                          width: 40, 
                          height: 40 
                        }}>
                          <PersonIcon sx={{ color: theme.palette.success.main }} />
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
                              bgcolor: alpha(theme.palette.success.main, 0.1),
                              color: theme.palette.success.main,
                              '&:hover': {
                                bgcolor: alpha(theme.palette.success.main, 0.2),
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
                  borderBottom: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
                }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(po.ApprovalStatus)}
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
                          Status:
                        </Typography>
                        <Chip 
                          label={po.ApprovalStatus || 'Pending'} 
                          color={getStatusColor(po.ApprovalStatus)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Approval/Rejection Note"
                        value={noteUpdates[po.POId] || po.RejectionNote || ''}
                        onChange={(e) => handleNoteChange(po.POId, e.target.value)}
                        placeholder="Add approval or rejection notes..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': {
                              borderColor: theme.palette.success.main
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.success.main
                            }
                          }
                        }}
                        disabled={po.ApprovalStatus === 'approved'}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => openApproveDialog(po)}
                          disabled={po.ApprovalStatus === 'approved'}
                          sx={{
                            fontWeight: 600,
                            borderRadius: 2,
                            minWidth: 120
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => openRejectDialog(po)}
                          disabled={po.ApprovalStatus === 'approved'}
                          sx={{
                            fontWeight: 600,
                            borderRadius: 2,
                            minWidth: 120
                          }}
                        >
                          Reject
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
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                          Vendor Details
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2"><b>Name:</b> {po.VendorDetails?.vendorName}</Typography>
                          <Typography variant="body2"><b>Code:</b> {po.VendorDetails?.vendorCode}</Typography>
                          <Typography variant="body2"><b>Contact:</b> {po.VendorDetails?.vendorContact}</Typography>
                          <Typography variant="body2"><b>Email:</b> {po.VendorDetails?.vendorEmail}</Typography>
                          <Typography variant="body2"><b>Address:</b> {po.VendorDetails?.vendorAddress}</Typography>
                          <Typography variant="body2"><b>GSTIN:</b> {po.VendorDetails?.vendorGSTIN}</Typography>
                          <Typography variant="body2"><b>PAN:</b> {po.VendorDetails?.vendorPAN}</Typography>
                        </Box>
                      </Grid>
                      {/* Items Table */}
                      <Grid item xs={12} md={8}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                          Items
                        </Typography>
                        <TableContainer component={Paper}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Item Code</TableCell>
                                <TableCell>Item Name</TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>Specifications</TableCell>
                                <TableCell>Price</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {po.Items.map((item, idx) => (
                                <TableRow key={item.itemCode || idx}>
                                  <TableCell>{item.itemCode}</TableCell>
                                  <TableCell>{item.itemName}</TableCell>
                                  <TableCell>{item.quantity}</TableCell>
                                  <TableCell>{item.specifications}</TableCell>
                                  <TableCell>{item.price}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                    </Grid>
                    {/* Document Links */}
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        Documents
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Chip label={po.InvoiceFileId ? 'Invoice Uploaded' : 'No Invoice'} color={po.InvoiceFileId ? 'success' : 'default'} />
                        <Chip label={po.DCFileId ? 'DC Uploaded' : 'No DC'} color={po.DCFileId ? 'success' : 'default'} />
                        <Chip label={po.POCopyFileId ? 'PO Copy Uploaded' : 'No PO Copy'} color={po.POCopyFileId ? 'success' : 'default'} />
                      </Box>
                    </Box>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
      {/* Approve Dialog */}
      <Dialog open={approveDialog} onClose={closeApproveDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Material</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Upload documents (optional) for PO: <strong>{selectedPO?.POId}</strong>
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Button 
                  component="label" 
                  variant="outlined" 
                  fullWidth 
                  sx={{ 
                    borderColor: approveFiles.invoice ? theme.palette.success.main : undefined,
                    color: approveFiles.invoice ? theme.palette.success.main : undefined
                  }}
                >
                  Upload Invoice
                  <input type="file" hidden onChange={e => handleApproveFileChange('invoice', e.target.files[0])} />
                </Button>
                {approveFiles.invoice && <CheckIcon sx={{ color: theme.palette.success.main }} />}
              </Box>
              {approveFiles.invoice && (
                <Typography variant="body2" sx={{ color: theme.palette.success.main, fontWeight: 500 }}>
                  ✓ {approveFiles.invoice.name}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Button 
                  component="label" 
                  variant="outlined" 
                  fullWidth
                  sx={{ 
                    borderColor: approveFiles.dc ? theme.palette.success.main : undefined,
                    color: approveFiles.dc ? theme.palette.success.main : undefined
                  }}
                >
                  Upload DC
                  <input type="file" hidden onChange={e => handleApproveFileChange('dc', e.target.files[0])} />
                </Button>
                {approveFiles.dc && <CheckIcon sx={{ color: theme.palette.success.main }} />}
              </Box>
              {approveFiles.dc && (
                <Typography variant="body2" sx={{ color: theme.palette.success.main, fontWeight: 500 }}>
                  ✓ {approveFiles.dc.name}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Button 
                  component="label" 
                  variant="outlined" 
                  fullWidth
                  sx={{ 
                    borderColor: approveFiles.poCopy && (approveFiles.poCopy.name || approveFiles.poCopy.fileId) ? theme.palette.success.main : undefined,
                    color: approveFiles.poCopy && (approveFiles.poCopy.name || approveFiles.poCopy.fileId) ? theme.palette.success.main : undefined
                  }}
                >
                  Upload PO Copy
                  <input type="file" hidden onChange={e => handleApproveFileChange('poCopy', e.target.files[0])} />
                </Button>
                {approveFiles.poCopy && (approveFiles.poCopy.name || approveFiles.poCopy.fileId) && <CheckIcon sx={{ color: theme.palette.success.main }} />}
              </Box>
              {approveFiles.poCopy && (approveFiles.poCopy.name || approveFiles.poCopy.fileId) && (
                <Typography variant="body2" sx={{ color: theme.palette.success.main, fontWeight: 500 }}>
                  ✓ {approveFiles.poCopy.name || 'PO Copy (from FollowUpDelivery)'}
                </Typography>
              )}
            </Grid>
          </Grid>
          <Alert severity="info" sx={{ mt: 2 }}>
            Documents (Invoice, DC, and PO Copy) are optional. You can approve without uploading them.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeApproveDialog} disabled={approveUploading}>Cancel</Button>
          <Button 
            onClick={handleApprove} 
            variant="contained" 
            color="success" 
            disabled={approveUploading}
            sx={{
              minWidth: 120
            }}
          >
            {approveUploading ? <CircularProgress size={20} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onClose={closeRejectDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Material</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for rejecting the material for PO: {selectedPO?.POId}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Note"
            value={rejectionNote}
            onChange={e => setRejectionNote(e.target.value)}
            placeholder="Please specify the reason for rejection..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRejectDialog}>Cancel</Button>
          <Button onClick={handleReject} variant="contained" color="error" disabled={!rejectionNote.trim()}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </BaseStepComponent>
  );
};

export default MaterialApproval; 