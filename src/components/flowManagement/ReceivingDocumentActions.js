import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Alert,
  alpha,
  useTheme
} from '@mui/material';
import {
  Upload as UploadIcon,
  Visibility as ViewIcon,
  Description as DocumentIcon,
  CloudUpload,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { formatDate } from '../../utils/dateUtils';

const ReceivingDocumentActions = ({ task, onUpload, onView }) => {
  const theme = useTheme();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Parse receivingDocuments from task (stored as JSON string)
  const getDocuments = () => {
    if (!task.receivingDocuments || task.receivingDocuments === '' || task.receivingDocuments === '[]') {
      return [];
    }
    try {
      const parsed = JSON.parse(task.receivingDocuments);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing receivingDocuments:', e);
      return [];
    }
  };

  const documents = getDocuments();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await onUpload(task, selectedFile);
      setSelectedFile(null);
      setUploadDialogOpen(false);
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = (doc) => {
    // View document using fileId (SAME AS SO DOCUMENT PATTERN)
    try {
      if (!doc.fileId) {
        setError('Document fileId not found');
        return;
      }

      // Get file from localStorage (same as sheetService.uploadFile stores it)
      const allFiles = JSON.parse(localStorage.getItem('documentFiles') || '[]');
      const fileData = allFiles.find(f => f.id === doc.fileId);
      
      if (fileData) {
        // Create blob from base64 content
        const byteCharacters = atob(fileData.content.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: fileData.type });
        const url = URL.createObjectURL(blob);
        
        // Open in new tab (SAME AS SO)
        window.open(url, '_blank');
      } else {
        // Fallback to Google Drive if not in localStorage
        window.open(`https://drive.google.com/file/d/${doc.fileId}/view`, '_blank');
      }
    } catch (err) {
      console.error('Error viewing document:', err);
      setError('Failed to view document');
    }
  };

  const handleDownloadDocument = (doc) => {
    // Download document using fileId (SAME AS SO PATTERN)
    try {
      if (!doc.fileId) {
        setError('Document fileId not found');
        return;
      }

      // Get file from localStorage
      const allFiles = JSON.parse(localStorage.getItem('documentFiles') || '[]');
      const fileData = allFiles.find(f => f.id === doc.fileId);
      
      if (fileData) {
        // Create download link
        const link = document.createElement('a');
        link.href = fileData.content;
        link.download = doc.fileName || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setError('Document file not found');
      }
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Failed to download document');
    }
  };

  return (
    <>
      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {documents.length === 0 ? (
          <Tooltip title="Upload Receiving Document">
            <IconButton
              size="small"
              onClick={() => setUploadDialogOpen(true)}
              sx={{
                color: theme.palette.success.main,
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.success.main, 0.2)
                }
              }}
            >
              <UploadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <>
            <Tooltip title="View Document">
              <IconButton
                size="small"
                onClick={() => setViewDialogOpen(true)}
                sx={{
                  color: theme.palette.info.main,
                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.info.main, 0.2)
                  }
                }}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Replace Uploaded Document">
              <IconButton
                size="small"
                onClick={() => setUploadDialogOpen(true)}
                sx={{
                  color: theme.palette.warning.main,
                  backgroundColor: alpha(theme.palette.warning.main, 0.1),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.warning.main, 0.2)
                  }
                }}
              >
                <UploadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => !uploading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: alpha(theme.palette.success.main, 0.1),
          color: theme.palette.success.dark
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudUpload />
            <Typography variant="h6">Upload Receiving Document</Typography>
          </Box>
          <IconButton 
            size="small" 
            onClick={() => setUploadDialogOpen(false)}
            disabled={uploading}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload receiving documents for dispatch: <strong>{task.DispatchUniqueId}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Product: <strong>{task.ProductCode} - {task.ProductName}</strong>
            </Typography>
          </Box>

          <Box
            sx={{
              border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              backgroundColor: alpha(theme.palette.primary.main, 0.02),
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                borderColor: theme.palette.primary.main
              }
            }}
            onClick={() => document.getElementById('file-upload-input').click()}
          >
            <input
              id="file-upload-input"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="body1" sx={{ mb: 1 }}>
              {selectedFile ? selectedFile.name : 'Click to select a file'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Supported formats: PDF, DOC, DOCX, JPG, PNG, XLSX, XLS
            </Typography>
            {selectedFile && (
              <Chip
                label={`${(selectedFile.size / 1024).toFixed(2)} KB`}
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Box>

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                Uploading document...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
            startIcon={<UploadIcon />}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Documents Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: alpha(theme.palette.info.main, 0.1),
          color: theme.palette.info.dark
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DocumentIcon />
            <Typography variant="h6">Receiving Documents</Typography>
          </Box>
          <IconButton size="small" onClick={() => setViewDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Documents for dispatch: <strong>{task.DispatchUniqueId}</strong>
            </Typography>
          </Box>

          {documents.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <DocumentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body1" color="text.secondary">
                No documents uploaded yet
              </Typography>
            </Box>
          ) : (
            <List>
              {documents.map((doc, index) => (
                <ListItem
                  key={index}
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: alpha(theme.palette.background.paper, 0.5)
                  }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View">
                        <IconButton
                          edge="end"
                          onClick={() => handleViewDocument(doc)}
                          sx={{ color: 'info.main' }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton
                          edge="end"
                          onClick={() => handleDownloadDocument(doc)}
                          sx={{ color: 'success.main' }}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemIcon>
                    <DocumentIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={doc.fileName || doc.name}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                        {doc.uploadedAt && (
                          <Typography variant="caption">
                            Uploaded: {formatDate(doc.uploadedAt)}
                          </Typography>
                        )}
                        {doc.uploadedBy && (
                          <Typography variant="caption">
                            By: {doc.uploadedBy}
                          </Typography>
                        )}
                        {doc.size && (
                          <Typography variant="caption">
                            Size: {(doc.size / 1024).toFixed(2)} KB
                          </Typography>
                        )}
                        {doc.mimeType && (
                          <Typography variant="caption" sx={{ textTransform: 'uppercase' }}>
                            {doc.mimeType.split('/')[1]}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReceivingDocumentActions;

