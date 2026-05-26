import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Delete, Visibility } from '@mui/icons-material';
import DocumentViewer from '../common/DocumentViewer';
import config from '../../config/config';

/**
 * Development tool for viewing and managing documents stored in localStorage.
 * Only visible when useLocalStorage is set to true in config.
 */
const StorageDebugger = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [storageSize, setStorageSize] = useState(0);

  // Load documents from localStorage
  useEffect(() => {
    if (!config.useLocalStorage) return;
    
    const loadDocuments = () => {
      try {
        const docs = JSON.parse(localStorage.getItem('documentFiles') || '[]');
        setDocuments(docs);
        
        // Calculate total storage usage
        const storageData = localStorage.getItem('documentFiles') || '';
        setStorageSize((storageData.length * 2) / 1024 / 1024); // Approximate size in MB
      } catch (error) {
        console.error('Error loading documents from localStorage:', error);
      }
    };
    
    loadDocuments();
  }, []);

  // View document details
  const handleViewDocument = (doc) => {
    setSelectedDoc(doc);
    setOpenDialog(true);
  };

  // Delete document from localStorage
  const handleDeleteDocument = (docId) => {
    try {
      const updatedDocs = documents.filter(doc => doc.id !== docId);
      localStorage.setItem('documentFiles', JSON.stringify(updatedDocs));
      setDocuments(updatedDocs);
      
      // Recalculate storage size
      const storageData = localStorage.getItem('documentFiles') || '';
      setStorageSize((storageData.length * 2) / 1024 / 1024);
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  // Clear all documents
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all stored documents?')) {
      localStorage.removeItem('documentFiles');
      setDocuments([]);
      setStorageSize(0);
    }
  };

  // Not relevant if not using localStorage
  if (!config.useLocalStorage) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography>
          Storage debugger is only available when using localStorage for document storage.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Set <code>useLocalStorage: true</code> in <code>config.js</code> to enable this view.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Document Storage Debugger</Typography>
          <Typography variant="body2" color="text.secondary">
            Storage used: <strong>{storageSize.toFixed(2)} MB</strong> (approx.)
          </Typography>
        </Box>
        
        {documents.length > 0 ? (
          <>
            <Typography variant="body2" gutterBottom>
              {documents.length} document(s) stored in localStorage
            </Typography>
            <Button 
              variant="outlined" 
              color="error" 
              size="small" 
              onClick={handleClearAll}
              sx={{ mb: 2 }}
            >
              Clear All Documents
            </Button>
          </>
        ) : (
          <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
            No documents stored in localStorage
          </Typography>
        )}
      </Paper>
      
      {documents.length > 0 && (
        <Paper>
          <List>
            {documents.map((doc) => (
              <ListItem key={doc.id} divider>
                <ListItemText
                  primary={doc.name}
                  secondary={
                    <>
                      <Typography variant="body2" component="span">
                        {new Date(doc.dateUploaded).toLocaleString()} • {(doc.size / 1024).toFixed(2)} KB
                      </Typography>
                      <br />
                      <Typography variant="caption" component="span">
                        ID: {doc.id}
                      </Typography>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton onClick={() => handleViewDocument(doc)}>
                    <Visibility />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDeleteDocument(doc.id)}>
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
      
      {/* Document viewer dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedDoc?.name || 'Document Viewer'}
        </DialogTitle>
        <DialogContent>
          {selectedDoc && (
            <DocumentViewer fileId={selectedDoc.id} height={500} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StorageDebugger; 