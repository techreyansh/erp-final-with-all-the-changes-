import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Paper } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import config from '../../config/config';

// Document viewer component that can display files from either localStorage or Google Drive
const DocumentViewer = ({ fileId, height = 400 }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFile = async () => {
      try {
        setLoading(true);
        setError(null);

        if (config.useLocalStorage) {
          // Get file from localStorage
          const files = JSON.parse(localStorage.getItem('documentFiles') || '[]');
          const fileData = files.find(f => f.id === fileId);
          
          if (!fileData) {
            throw new Error(`File with ID ${fileId} not found in localStorage`);
          }
          
          setFile(fileData);
        } else {
          // For Google Drive, we would need to implement API calls here
          // This would depend on the specific implementation of your Google Drive integration
          setError('Google Drive viewing not implemented yet - API key required');
        }
      } catch (err) {
        console.error('Error loading file:', err);
        setError(err.message || 'Failed to load file');
      } finally {
        setLoading(false);
      }
    };

    if (fileId) {
      loadFile();
    }
  }, [fileId]);

  const handleDownload = () => {
    if (!file) return;
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = file.content;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Display appropriate icon based on file type
  const getFileIcon = () => {
    if (!file) return <InsertDriveFileIcon sx={{ fontSize: 60 }} />;
    
    if (file.type.includes('pdf')) {
      return <PictureAsPdfIcon sx={{ fontSize: 60, color: 'error.main' }} />;
    } else if (file.type.includes('image')) {
      return <ImageIcon sx={{ fontSize: 60, color: 'primary.main' }} />;
    } else {
      return <InsertDriveFileIcon sx={{ fontSize: 60, color: 'text.secondary' }} />;
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height }}>
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      </Box>
    );
  }

  // Render file preview
  return (
    <Paper elevation={2} sx={{ height, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {file ? (
        <>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" noWrap>
              {file.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(file.dateUploaded).toLocaleString()} • {(file.size / 1024).toFixed(2)} KB
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {file.type.includes('image') ? (
              <img 
                src={file.content} 
                alt={file.name} 
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
              />
            ) : file.type.includes('pdf') && !config.useLocalStorage ? (
              <iframe 
                src={file.content} 
                title={file.name} 
                width="100%" 
                height="100%" 
                style={{ border: 'none' }} 
              />
            ) : (
              <Box sx={{ textAlign: 'center', p: 3 }}>
                {getFileIcon()}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Preview not available. Click download to view this file.
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />} 
              onClick={handleDownload}
            >
              Download
            </Button>
          </Box>
        </>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <InsertDriveFileIcon sx={{ fontSize: 60, color: 'text.disabled' }} />
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            No file selected
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default DocumentViewer; 