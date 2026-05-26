import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
  Tooltip,
  Breadcrumbs,
  Link,
  Chip,
  Avatar,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
  InputAdornment,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  LinearProgress,
  Divider,
  Badge,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton
} from '@mui/material';
import {
  Folder as FolderIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  CreateNewFolder as CreateFolderIcon,
  Home as HomeIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  CloudUpload as CloudUploadIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Archive as ArchiveIcon,
  Code as CodeIcon,
  TableChart as SpreadsheetIcon,
  Slideshow as PresentationIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  DriveFileMove as MoveIcon,
  ContentCopy as CopyIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  Dashboard as DashboardIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  FolderOpen as FolderOpenIcon,
  InsertDriveFile as FileIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import documentLibraryService from '../../services/documentLibraryService';
import { Navigate } from 'react-router-dom';

const DocumentLibrary = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State management
  const [currentPath, setCurrentPath] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list' - default is list
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'date', 'size', 'type'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [filterType, setFilterType] = useState('all'); // 'all', 'folders', 'files', or file types
  
  // Selection states
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  
  // Dialog states
  const [createFolderDialog, setCreateFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviewDialog, setFilePreviewDialog] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [renameDialog, setRenameDialog] = useState(false);
  const [renameItem, setRenameItem] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [statsDialog, setStatsDialog] = useState(false);
  const [libraryStats, setLibraryStats] = useState(null);
  const [infoDialog, setInfoDialog] = useState(false);
  const [infoItem, setInfoItem] = useState(null);
  
  // Upload progress
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  // Context menu states
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Snackbar states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // SpeedDial state
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  
  // Refs
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Load documents on component mount and path change
  useEffect(() => {
    loadDocuments();
  }, [currentPath]); // eslint-disable-line react-hooks/exhaustive-deps

  const userRole = user?.role || 'Employee';
  
  // Redirect if not CEO
  if (userRole !== 'CEO') {
    return <Navigate to="/dashboard" replace />;
  }

  const buildPathFromSegments = (segments) => {
    const parts = (segments || []).filter(Boolean).filter(p => p !== '/');
    return '/' + parts.join('/');
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const path = buildPathFromSegments(currentPath);
      const data = await documentLibraryService.getDocuments(path);
      setFolders(data.folders || []);
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      showSnackbar('Error loading documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      setLoading(true);
      const path = buildPathFromSegments(currentPath);
      await documentLibraryService.createFolder(path, newFolderName.trim());
      setCreateFolderDialog(false);
      setNewFolderName('');
      await loadDocuments();
      showSnackbar(`✅ Folder "${newFolderName.trim()}" created successfully`, 'success');
    } catch (error) {
      console.error('Error creating folder:', error);
      showSnackbar('❌ Error creating folder: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      const path = buildPathFromSegments(currentPath);
      
      // Ensure the current path folder exists, create if it doesn't
      let folderId = await documentLibraryService.getFolderIdForPath(path);
      
      if (!folderId) {
        if (path === '/') {
          // For root, create a root folder if it doesn't exist
          // The root folder is special - it represents the root directory
          try {
            await documentLibraryService.ensureRootFolder();
            folderId = await documentLibraryService.getFolderIdForPath(path);
          } catch (err) {
            console.error('Error creating root folder:', err);
          }
        } else {
          // Create the folder hierarchy if it doesn't exist
          const pathParts = path.split('/').filter(part => part !== '');
          let currentPathStr = '/';
          
          for (const part of pathParts) {
            currentPathStr += (currentPathStr === '/' ? '' : '/') + part;
            const existingFolderId = await documentLibraryService.getFolderIdForPath(currentPathStr);
            if (!existingFolderId) {
              const parentPath = currentPathStr === '/' + part ? '/' : (currentPathStr.substring(0, currentPathStr.lastIndexOf('/')) || '/');
              await documentLibraryService.createFolder(parentPath, part);
            }
          }
          // Get folderId after creating the path
          folderId = await documentLibraryService.getFolderIdForPath(path);
        }
      }
      
      // Verify folder exists before uploading
      if (!folderId) {
        throw new Error(`Cannot upload files: Folder not found at path "${path}"`);
      }
      
      // Upload files with progress tracking
      const fileArray = Array.from(files);
      const totalFiles = fileArray.length;
      let uploadedCount = 0;
      const errors = [];
      
      for (const file of fileArray) {
        try {
          await documentLibraryService.uploadFile(path, file);
          uploadedCount++;
          setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
        } catch (err) {
          console.error(`Error uploading ${file.name}:`, err);
          errors.push({ fileName: file.name, error: err.message });
          showSnackbar(`⚠️ Error uploading ${file.name}: ${err.message}`, 'error');
        }
      }
      
      // Close dialog and reset state
      setUploadDialog(false);
      setSelectedFiles([]);
      setUploadProgress(0);
      
      // Reload documents to show newly uploaded files
      await loadDocuments();
      
      // Show success message
      if (uploadedCount === totalFiles) {
        showSnackbar(`✅ ${uploadedCount} file(s) uploaded successfully`, 'success');
      } else if (uploadedCount > 0) {
        showSnackbar(`⚠️ ${uploadedCount} of ${totalFiles} file(s) uploaded successfully. ${errors.length} failed.`, 'warning');
      } else {
        showSnackbar(`❌ All uploads failed. Please check the errors above.`, 'error');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      showSnackbar('❌ Error uploading files: ' + (error.message || 'Unknown error'), 'error');
      setUploadDialog(false);
      setSelectedFiles([]);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (event) => {
    const files = event.target.files;
    setSelectedFiles(Array.from(files));
    setUploadDialog(true);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFiles(Array.from(files));
      setUploadDialog(true);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDownload = async (file) => {
    try {
      setLoading(true);
      await documentLibraryService.downloadFile(file.id);
      showSnackbar(`✅ Download started for "${file.name}"`, 'success');
    } catch (error) {
      console.error('Error downloading file:', error);
      showSnackbar('❌ Error downloading file: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    try {
      setLoading(true);
      
      if (item.type === 'folder') {
        // First try to delete without cascade
        try {
          const confirmed = window.confirm(
            `Are you sure you want to delete folder "${item.name}"?`
          );
          
          if (!confirmed) {
            setLoading(false);
            return;
          }
          
          await documentLibraryService.deleteFolder(item.id, false);
          showSnackbar(`✅ Folder "${item.name}" deleted successfully`, 'success');
        } catch (error) {
          // If folder has contents, ask for cascade delete
          if (error.message === 'FOLDER_HAS_FILES' || error.message === 'FOLDER_HAS_SUBFOLDERS') {
            const totalItems = (item.itemCount || 0) + (item.subfolderCount || 0);
            const cascadeConfirmed = window.confirm(
              `⚠️ Folder "${item.name}" contains ${totalItems} item(s).\n\n` +
              `Do you want to delete this folder and ALL its contents?\n\n` +
              `This will permanently delete:\n` +
              `• ${item.itemCount || 0} file(s)\n` +
              `• ${item.subfolderCount || 0} subfolder(s)\n\n` +
              `This action CANNOT be undone!`
            );
            
            if (cascadeConfirmed) {
              await documentLibraryService.deleteFolder(item.id, true);
              showSnackbar(`✅ Folder "${item.name}" and all its contents deleted successfully`, 'success');
      } else {
              setLoading(false);
              return;
            }
          } else {
            throw error;
          }
        }
      } else {
        // Delete file
        const confirmed = window.confirm(
          `Are you sure you want to delete file "${item.name}"?\n\nThis action cannot be undone.`
        );
        
        if (!confirmed) {
          setLoading(false);
          return;
        }
        
        await documentLibraryService.deleteFile(item.id);
        showSnackbar(`✅ File "${item.name}" deleted successfully`, 'success');
      }
      
      handleContextMenuClose();
      await loadDocuments();
    } catch (error) {
      console.error('Error deleting item:', error);
      const errorMessage = error.message || 'Error deleting item';
      showSnackbar(`❌ ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folder) => {
    // Use the folder's path directly for proper nested navigation
    const newPath = folder.path.split('/').filter(part => part !== '');
    setCurrentPath(newPath);
  };

  const handleFileClick = async (file) => {
    // Preview images and PDFs when clicking on file
    const fileType = (file.type || file.mimeType || '').toLowerCase();
    const isImage = fileType.startsWith('image/');
    const isPDF = fileType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    
    if (isImage || isPDF) {
      try {
        setLoading(true);
        const fileData = await documentLibraryService.getFileData(file.id);
        
        // Get the file URL for preview
        const fileUrl = await documentLibraryService.getFileUrl(fileData.fileId);
        
        setPreviewFile({
          ...fileData,
          previewUrl: fileUrl,
          type: fileData.mimeType || file.type
        });
        setFilePreviewDialog(true);
      } catch (error) {
        console.error('Error loading file for preview:', error);
        showSnackbar('Error loading file preview: ' + (error.message || 'Unknown error'), 'error');
      } finally {
        setLoading(false);
      }
    } else {
      // For other file types, download directly
      handleDownload(file);
    }
  };

  const handleBreadcrumbClick = (index) => {
    if (index === 0) {
      // Go to root
      setCurrentPath([]);
    } else {
      // Navigate to the selected path level
      setCurrentPath(currentPath.slice(0, index));
    }
  };

  const handleContextMenu = (event, item) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
    });
    setSelectedItem(item);
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
    setSelectedItem(null);
  };

  const getFileIcon = (fileType) => {
    const type = fileType?.toLowerCase() || '';
    if (type.includes('pdf')) return <PdfIcon color="error" />;
    if (type.includes('image')) return <ImageIcon color="primary" />;
    if (type.includes('video')) return <VideoIcon color="secondary" />;
    if (type.includes('audio')) return <AudioIcon color="info" />;
    if (type.includes('zip') || type.includes('rar')) return <ArchiveIcon color="warning" />;
    if (type.includes('code') || type.includes('text')) return <CodeIcon color="success" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <SpreadsheetIcon color="success" />;
    if (type.includes('presentation') || type.includes('powerpoint')) return <PresentationIcon color="warning" />;
    return <DocumentIcon color="action" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter and sort items
  const getFilteredAndSortedItems = () => {
    let allItems = [];
    
    // Combine folders and files
    if (filterType === 'all' || filterType === 'folders') {
      allItems = [...allItems, ...folders];
    }
    if (filterType === 'all' || filterType === 'files') {
      allItems = [...allItems, ...files];
    }
    
    // Apply file type filter
    if (filterType !== 'all' && filterType !== 'folders' && filterType !== 'files') {
      allItems = files.filter(file => {
        const fileType = file.type?.toLowerCase() || file.mimeType?.toLowerCase() || '';
        return fileType.includes(filterType);
      });
    }
    
    // Apply search filter
    if (searchQuery) {
      allItems = allItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply sorting
    allItems.sort((a, b) => {
      let compareValue = 0;
      
      // Always put folders first unless sorting by type
      if (sortBy !== 'type' && a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      
      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'date':
          compareValue = new Date(a.createdAt || a.uploadedAt) - new Date(b.createdAt || b.uploadedAt);
          break;
        case 'size':
          compareValue = (a.size || 0) - (b.size || 0);
          break;
        case 'type':
          compareValue = (a.type || '').localeCompare(b.type || '');
          break;
        default:
          compareValue = 0;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
    
    return allItems;
  };

  // Toggle item selection
  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  // Select all visible items
  const handleSelectAll = () => {
    const allItems = getFilteredAndSortedItems();
    if (selectedItems.length === allItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(allItems.map(item => item.id));
    }
  };

  // Bulk delete selected items
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      showSnackbar('No items selected', 'warning');
      return;
    }
    
    const allItems = [...folders, ...files];
    const itemsToDelete = allItems.filter(item => selectedItems.includes(item.id));
    
    // Count folders with contents
    const foldersWithContents = itemsToDelete.filter(
      item => item.type === 'folder' && ((item.itemCount || 0) + (item.subfolderCount || 0)) > 0
    );
    
    // Show appropriate confirmation dialog
    let confirmMessage = `Are you sure you want to delete ${selectedItems.length} item(s)?`;
    
    if (foldersWithContents.length > 0) {
      confirmMessage += `\n\n⚠️ ${foldersWithContents.length} folder(s) contain files/subfolders and will be deleted with ALL their contents.`;
    }
    
    confirmMessage += '\n\nThis action CANNOT be undone!';
    
    const confirmed = window.confirm(confirmMessage);
    
    if (!confirmed) return;
    
    try {
      setLoading(true);
      
      let successCount = 0;
      let failCount = 0;
      const errors = [];
      
      for (const item of itemsToDelete) {
        try {
          if (item.type === 'folder') {
            // Use cascade delete for folders
            await documentLibraryService.deleteFolder(item.id, true);
          } else {
            await documentLibraryService.deleteFile(item.id);
          }
          successCount++;
        } catch (err) {
          failCount++;
          errors.push(`Failed to delete "${item.name}": ${err.message}`);
          console.error(`Error deleting ${item.name}:`, err);
        }
      }
      
      setSelectedItems([]);
      setSelectionMode(false);
      await loadDocuments();
      
      if (failCount === 0) {
        showSnackbar(`✅ ${successCount} item(s) deleted successfully`, 'success');
      } else {
        showSnackbar(
          `⚠️ ${successCount} item(s) deleted, ${failCount} failed. Check console for details.`,
          'warning'
        );
        console.error('Deletion errors:', errors);
      }
    } catch (error) {
      console.error('Error deleting items:', error);
      showSnackbar('❌ Error deleting items: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle rename
  const handleRenameClick = (item) => {
    setRenameItem(item);
    setNewItemName(item.name);
    setRenameDialog(true);
    handleContextMenuClose();
  };

  const handleRename = async () => {
    if (!newItemName.trim() || !renameItem) return;
    
    try {
      setLoading(true);
      await documentLibraryService.renameItem(renameItem.id, newItemName.trim());
      setRenameDialog(false);
      setRenameItem(null);
      setNewItemName('');
      await loadDocuments();
      showSnackbar(`✅ "${renameItem.name}" renamed to "${newItemName.trim()}" successfully`, 'success');
    } catch (error) {
      console.error('Error renaming item:', error);
      showSnackbar('❌ Error renaming item: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show item info
  const handleShowInfo = async (item) => {
    setInfoItem(item);
    setInfoDialog(true);
    handleContextMenuClose();
  };

  // Load library statistics
  const handleShowStats = async () => {
    try {
      setLoading(true);
      const stats = await documentLibraryService.getLibraryStats();
      setLibraryStats(stats);
      setStatsDialog(true);
    } catch (error) {
      console.error('Error loading stats:', error);
      showSnackbar('Error loading statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get file type for filtering
  const getFileTypeCategory = (file) => {
    const type = file.type?.toLowerCase() || file.mimeType?.toLowerCase() || '';
    if (type.includes('pdf')) return 'pdf';
    if (type.includes('image')) return 'image';
    if (type.includes('video')) return 'video';
    if (type.includes('audio')) return 'audio';
    if (type.includes('zip') || type.includes('rar')) return 'archive';
    if (type.includes('spreadsheet') || type.includes('excel')) return 'spreadsheet';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'presentation';
    if (type.includes('text') || type.includes('code')) return 'document';
    return 'other';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Fade in timeout={600}>
        <Box sx={{ 
          mb: 4, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)'
        }}>
          {/* Decorative background pattern */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '50%',
            height: '100%',
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
          
          <CardContent sx={{ py: 4, position: 'relative', zIndex: 1 }}>
            <Stack direction={{ xs: "column", md: "row" }} alignItems="center" spacing={3} justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={3}>
                <Avatar sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  width: 72, 
                  height: 72,
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.3)'
                }}>
                  <FolderOpenIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Box>
                  <Typography variant="h3" component="h1" sx={{ 
                    fontWeight: 'bold', 
                    mb: 0.5, 
                    fontSize: { xs: '1.75rem', md: '2.5rem' },
                    textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                  }}>
                    📁 Document Library
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.95, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                    Organize, manage, and access your files with ease
                  </Typography>
                </Box>
              </Stack>
              
              <Stack direction={{ xs: "row", md: "column" }} spacing={1} alignItems={{ xs: "center", md: "flex-end" }}>
                <Chip 
                  icon={<CloudUploadIcon />}
                  label={user?.name || 'User'}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white', 
                    backdropFilter: 'blur(10px)',
                    fontWeight: 'bold',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
                <Chip 
                  icon={<FolderIcon />}
                  label={`${folders.length + files.length} items`}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white', 
                    backdropFilter: 'blur(10px)',
                    fontWeight: 'bold',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
              </Stack>
            </Stack>
          </CardContent>
        </Box>
      </Fade>

      {/* Navigation and Controls */}
      <Zoom in timeout={800}>
        <Card sx={{ mb: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: 3 }}>
          <CardContent sx={{ pb: '16px !important' }}>
              {/* Breadcrumb Navigation */}
            <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }} spacing={2} justifyContent="space-between" mb={2}>
              <Paper elevation={0} sx={{ bgcolor: 'grey.50', px: 2, py: 1, borderRadius: 2, flex: 1, width: { xs: '100%', md: 'auto' } }}>
                <Breadcrumbs 
                  aria-label="breadcrumb"
                  separator={<Box component="span" sx={{ mx: 0.5, color: 'primary.main' }}>›</Box>}
                >
                <Link
                    underline="none"
                    color={currentPath.length === 0 ? "primary" : "inherit"}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleBreadcrumbClick(0);
                  }}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      fontWeight: currentPath.length === 0 ? 'bold' : 'medium',
                      transition: 'all 0.2s',
                      '&:hover': { 
                        color: 'primary.main',
                        transform: 'translateY(-1px)'
                      } 
                    }}
                  >
                    <HomeIcon sx={{ mr: 0.5, fontSize: 18 }} />
                  Home
                </Link>
                {currentPath.map((segment, idx) => (
                  <Link
                    key={idx}
                      underline="none"
                      color={idx === currentPath.length - 1 ? "primary" : "inherit"}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleBreadcrumbClick(idx + 1);
                    }}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        fontWeight: idx === currentPath.length - 1 ? 'bold' : 'medium',
                        transition: 'all 0.2s',
                        '&:hover': { 
                          color: 'primary.main',
                          transform: 'translateY(-1px)'
                        } 
                      }}
                  >
                    {segment}
                  </Link>
                ))}
              </Breadcrumbs>
              </Paper>

              {/* Quick Action Buttons */}
              <Stack direction="row" spacing={1}>
                <Tooltip title="Create Folder" arrow>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<CreateFolderIcon />}
                    onClick={() => setCreateFolderDialog(true)}
                    sx={{ 
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    {!isMobile && 'New Folder'}
                  </Button>
                </Tooltip>
                
                <Tooltip title="Upload Files" arrow>
                  <Button
                    variant="contained"
                    size="small"
                    color="secondary"
                    startIcon={<UploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ 
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 12px rgba(244, 143, 177, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(244, 143, 177, 0.4)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    {!isMobile && 'Upload'}
                  </Button>
                </Tooltip>

                <Tooltip title="Library Statistics" arrow>
                  <IconButton 
                    onClick={handleShowStats} 
                    color="info" 
                    size="small"
                    sx={{
                      bgcolor: 'info.lighter',
                      '&:hover': { bgcolor: 'info.light' }
                    }}
                  >
                    <DashboardIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={selectionMode ? 'Exit Selection' : 'Select Multiple'} arrow>
                  <IconButton 
                    onClick={() => {
                      setSelectionMode(!selectionMode);
                      setSelectedItems([]);
                    }} 
                    color={selectionMode ? 'secondary' : 'default'}
                    size="small"
                    sx={{
                      bgcolor: selectionMode ? 'secondary.lighter' : 'grey.100',
                      '&:hover': { bgcolor: selectionMode ? 'secondary.light' : 'grey.200' }
                    }}
                  >
                    <CheckCircleIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Search, Filter, and Sort Controls */}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
              {/* Search Bar */}
              <TextField
                placeholder="🔍 Search documents and folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{ 
                  flex: 1, 
                  minWidth: { xs: '100%', md: 300 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: 'grey.50',
                    '&:hover': {
                      bgcolor: 'background.paper',
                    },
                    '&.Mui-focused': {
                      bgcolor: 'background.paper',
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Filter Type */}
              <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 160 } }}>
                <InputLabel>Filter</InputLabel>
                <Select
                  value={filterType}
                  label="Filter"
                  onChange={(e) => setFilterType(e.target.value)}
                  sx={{
                    borderRadius: 3,
                    bgcolor: 'grey.50',
                    '&:hover': {
                      bgcolor: 'background.paper',
                    }
                  }}
                >
                  <MenuItem value="all">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FolderOpenIcon fontSize="small" color="action" />
                      <span>All Items</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="folders">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FolderIcon fontSize="small" color="primary" />
                      <span>Folders Only</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="files">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FileIcon fontSize="small" color="secondary" />
                      <span>Files Only</span>
                    </Stack>
                  </MenuItem>
                  <Divider />
                  <MenuItem value="pdf">📄 PDF Files</MenuItem>
                  <MenuItem value="image">🖼️ Images</MenuItem>
                  <MenuItem value="video">🎥 Videos</MenuItem>
                  <MenuItem value="document">📝 Documents</MenuItem>
                  <MenuItem value="spreadsheet">📊 Spreadsheets</MenuItem>
                  <MenuItem value="archive">📦 Archives</MenuItem>
                </Select>
              </FormControl>

              {/* Sort Options */}
              <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 140 } }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{
                    borderRadius: 3,
                    bgcolor: 'grey.50',
                    '&:hover': {
                      bgcolor: 'background.paper',
                    }
                  }}
                >
                  <MenuItem value="name">📝 Name</MenuItem>
                  <MenuItem value="date">📅 Date</MenuItem>
                  <MenuItem value="size">💾 Size</MenuItem>
                  <MenuItem value="type">🏷️ Type</MenuItem>
                </Select>
              </FormControl>

              {/* Sort Order & View Mode */}
              <Stack direction="row" spacing={1}>
                <Tooltip title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'} arrow>
                  <IconButton 
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    size="small"
                    sx={{ 
                      bgcolor: 'grey.100',
                      transform: sortOrder === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)',
                      transition: 'all 0.3s',
                      '&:hover': {
                        bgcolor: 'primary.lighter',
                        color: 'primary.main',
                        transform: sortOrder === 'asc' ? 'rotate(0deg) scale(1.1)' : 'rotate(180deg) scale(1.1)'
                      }
                    }}
                  >
                    <SortIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'} arrow>
                  <IconButton 
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    size="small"
                    sx={{
                      bgcolor: viewMode === 'grid' ? 'primary.lighter' : 'secondary.lighter',
                      color: viewMode === 'grid' ? 'primary.main' : 'secondary.main',
                      transition: 'all 0.3s',
                      '&:hover': {
                        bgcolor: viewMode === 'grid' ? 'primary.light' : 'secondary.light',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    {viewMode === 'grid' ? <ListViewIcon /> : <GridViewIcon />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            {/* Selection Mode Actions */}
            {selectionMode && (
              <Fade in>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'action.selected', borderRadius: 1 }}>
                  <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">
                      {selectedItems.length} item(s) selected
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleSelectAll}
                        startIcon={<CheckCircleIcon />}
                      >
                        {selectedItems.length === getFilteredAndSortedItems().length ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={handleBulkDelete}
                        disabled={selectedItems.length === 0}
                        startIcon={<DeleteIcon />}
                      >
                        Delete Selected
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              </Fade>
            )}
          </CardContent>
        </Card>
      </Zoom>

      {/* Upload Progress */}
      {uploading && (
        <Paper sx={{ mb: 2, p: 2 }}>
          <Typography variant="body2" gutterBottom>
            Uploading files... {uploadProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Paper>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        multiple
        onChange={handleFileSelect}
      />

      {/* Main Content Area */}
      <Paper
        ref={dropZoneRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        sx={{
          minHeight: 400,
          p: 3,
          border: '2px dashed transparent',
          transition: 'border-color 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover'
          }
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress size={60} />
          </Box>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <Grid container spacing={2.5}>
            {getFilteredAndSortedItems().map((item, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                <Zoom in timeout={300 + index * 50}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: selectedItems.includes(item.id) ? `3px solid ${theme.palette.primary.main}` : '1px solid',
                      borderColor: selectedItems.includes(item.id) ? 'primary.main' : 'divider',
                      bgcolor: selectedItems.includes(item.id) ? 'primary.lighter' : 'background.paper',
                      borderRadius: 3,
                      boxShadow: selectedItems.includes(item.id) ? '0 8px 24px rgba(102, 126, 234, 0.25)' : '0 2px 8px rgba(0,0,0,0.08)',
                      position: 'relative',
                      overflow: 'visible',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: item.type === 'folder' 
                          ? '0 12px 32px rgba(102, 126, 234, 0.3)' 
                          : '0 12px 32px rgba(244, 143, 177, 0.3)',
                        borderColor: item.type === 'folder' ? 'primary.main' : 'secondary.main',
                        '& .item-actions': {
                          opacity: 1,
                          transform: 'translateY(0)'
                        }
                      }
                    }}
                    onClick={(e) => {
                      if (selectionMode) {
                        e.stopPropagation();
                        toggleItemSelection(item.id);
                      } else {
                        if (item.type === 'folder') {
                          handleFolderClick(item);
                        } else {
                          handleFileClick(item);
                        }
                      }
                    }}
                    onContextMenu={(e) => handleContextMenu(e, item)}
                  >
                    {/* Type Badge */}
                    <Box sx={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      zIndex: 2
                    }}>
                      <Chip
                        label={item.type === 'folder' ? 'Folder' : 'File'}
                        size="small"
                        sx={{
                          bgcolor: item.type === 'folder' ? 'primary.main' : 'secondary.main',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.7rem',
                          height: 24,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      />
                    </Box>

                    {/* Selection Checkbox or Actions */}
                    <Box 
                      className="item-actions"
                    sx={{
                        position: 'absolute', 
                        top: 12, 
                        right: 12, 
                        zIndex: 2,
                        opacity: selectionMode ? 1 : 0,
                        transform: selectionMode ? 'translateY(0)' : 'translateY(-10px)',
                        transition: 'all 0.3s'
                      }}
                    >
                      {selectionMode ? (
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          sx={{ 
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                      '&:hover': {
                              bgcolor: 'grey.100'
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleItemSelection(item.id);
                          }}
                        />
                      ) : (
                        <IconButton
                          size="small"
                          sx={{
                            bgcolor: 'background.paper',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            '&:hover': {
                              bgcolor: 'primary.main',
                              color: 'white'
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContextMenu(e, item);
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>

                    <CardContent sx={{ 
                      textAlign: 'center', 
                      py: 4, 
                      px: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 200
                    }}>
                      {/* Icon with gradient background */}
                      <Box sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: item.type === 'folder'
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        mb: 2,
                        boxShadow: item.type === 'folder'
                          ? '0 8px 16px rgba(102, 126, 234, 0.3)'
                          : '0 8px 16px rgba(245, 87, 108, 0.3)',
                        transition: 'transform 0.3s',
                        '&:hover': {
                          transform: 'scale(1.1) rotate(5deg)'
                        }
                      }}>
                        {item.type === 'folder' ? (
                          <FolderIcon sx={{ fontSize: 40, color: 'white' }} />
                        ) : (
                          <Box sx={{ color: 'white', '& svg': { fontSize: 40 } }}>
                            {getFileIcon(item.type || item.mimeType)}
                          </Box>
                        )}
                      </Box>
                      
                      {/* Item Name */}
                      <Tooltip title={item.name} arrow>
                        <Typography 
                          variant="subtitle1" 
                          fontWeight="bold"
                          sx={{ 
                            mt: 1,
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            width: '100%',
                            minHeight: 48
                          }}
                        >
                          {item.name}
                      </Typography>
                      </Tooltip>
                      
                      {/* Item Details */}
                      {item.type === 'folder' ? (
                        <Stack spacing={0.5} alignItems="center">
                          <Chip
                            icon={<FolderIcon />}
                            label={`${(item.itemCount || 0) + (item.subfolderCount || 0)} items`}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                          {item.level > 0 && (
                            <Typography variant="caption" color="text.disabled">
                              📊 Level {item.level}
                            </Typography>
                          )}
                        </Stack>
                      ) : (
                        <Stack spacing={0.5} alignItems="center" width="100%">
                          <Typography variant="body2" color="primary" fontWeight="medium">
                            {formatFileSize(item.size)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                            📅 {formatDate(item.uploadedAt)}
                      </Typography>
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
            ))}

            {/* Empty State */}
            {getFilteredAndSortedItems().length === 0 && !loading && (
              <Grid item xs={12}>
                <Box textAlign="center" py={8}>
                  {searchQuery || filterType !== 'all' ? (
                    <>
                      <SearchIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No items match your search
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Try adjusting your search or filter criteria
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setSearchQuery('');
                          setFilterType('all');
                        }}
                      >
                        Clear Filters
                      </Button>
                    </>
                  ) : (
                    <>
                  <DocumentIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No documents found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Create a folder or upload files to get started
                  </Typography>
                  <Stack direction="row" spacing={2} justifyContent="center">
                    <Button
                      variant="contained"
                      startIcon={<CreateFolderIcon />}
                      onClick={() => setCreateFolderDialog(true)}
                    >
                      Create Folder
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload Files
                    </Button>
                  </Stack>
                    </>
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
        ) : (
          /* List View */
          <List sx={{ p: 0 }}>
            {getFilteredAndSortedItems().map((item, index) => (
              <Zoom in timeout={200 + index * 30} key={item.id}>
                <Paper
                  elevation={0}
                  sx={{
                    mb: 1.5,
                    border: '2px solid',
                    borderColor: selectedItems.includes(item.id) ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    bgcolor: selectedItems.includes(item.id) ? 'primary.lighter' : 'background.paper',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: item.type === 'folder' ? 'primary.main' : 'secondary.main',
                      boxShadow: item.type === 'folder'
                        ? '0 4px 20px rgba(102, 126, 234, 0.2)'
                        : '0 4px 20px rgba(244, 143, 177, 0.2)',
                      transform: 'translateX(8px)',
                      '& .list-item-actions': {
                        opacity: 1
                      }
                    }
                  }}
                >
                  <ListItem
                    sx={{
                      py: 2,
                      px: 2.5
                    }}
                    secondaryAction={
                      <Stack 
                        direction="row" 
                        spacing={1} 
                        className="list-item-actions"
                        sx={{
                          opacity: selectionMode ? 1 : 0.7,
                          transition: 'opacity 0.3s'
                        }}
                      >
                        {item.type === 'file' && (
                          <Tooltip title="Download" arrow>
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(item);
                              }}
                              sx={{
                                bgcolor: 'success.lighter',
                                color: 'success.main',
                                '&:hover': {
                                  bgcolor: 'success.main',
                                  color: 'white'
                                }
                              }}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="More Actions" arrow>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={(e) => handleContextMenu(e, item)}
                            sx={{
                              bgcolor: 'grey.100',
                              '&:hover': {
                                bgcolor: 'grey.300'
                              }
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    }
                  >
                    {selectionMode && (
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        sx={{ 
                          mr: 2,
                          '&.Mui-checked': {
                            color: 'primary.main'
                          }
                        }}
                      />
                    )}

                    <ListItemButton
                      onClick={(e) => {
                        if (!selectionMode) {
                          if (item.type === 'folder') {
                            handleFolderClick(item);
                          } else {
                            handleFileClick(item);
                          }
                        }
                      }}
                      sx={{ 
                        borderRadius: 1.5,
                        mr: 2,
                        '&:hover': {
                          bgcolor: 'transparent'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            width: 56,
                            height: 56,
                            background: item.type === 'folder'
                              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                              : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            boxShadow: item.type === 'folder'
                              ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                              : '0 4px 12px rgba(245, 87, 108, 0.3)'
                          }}
                        >
                          {item.type === 'folder' ? (
                            <FolderIcon sx={{ fontSize: 28 }} />
                          ) : (
                            <Box sx={{ '& svg': { fontSize: 28 } }}>
                              {getFileIcon(item.type || item.mimeType)}
                            </Box>
                          )}
                        </Avatar>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                              {item.name}
                            </Typography>
                            <Chip
                              label={item.type === 'folder' ? '📁 Folder' : '📄 File'}
                              size="small"
                              sx={{
                                bgcolor: item.type === 'folder' ? 'primary.main' : 'secondary.main',
                                color: 'white',
                                fontWeight: 'bold',
                                height: 24
                              }}
                            />
                          </Stack>
                        }
                        secondary={
                          <Stack direction="row" spacing={3} sx={{ mt: 1 }} alignItems="center">
                            {item.type === 'folder' ? (
                              <>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <FileIcon fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    {item.itemCount || 0} files
                                  </Typography>
                                </Box>
                                {item.subfolderCount > 0 && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <FolderIcon fontSize="small" color="action" />
                                    <Typography variant="body2" color="text.secondary">
                                      {item.subfolderCount} folder{item.subfolderCount > 1 ? 's' : ''}
                                    </Typography>
                                  </Box>
                                )}
                                {item.level > 0 && (
                                  <Chip
                                    label={`Level ${item.level}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 22 }}
                                  />
                                )}
                              </>
                            ) : (
                              <>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="body2" color="primary" fontWeight="medium">
                                    💾 {formatFileSize(item.size)}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    📅 {formatDate(item.uploadedAt)}
                                  </Typography>
                                </Box>
                                {item.uploadedBy && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      👤 {item.uploadedBy}
                                    </Typography>
                                  </Box>
                                )}
                              </>
                            )}
                          </Stack>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
      </Paper>
              </Zoom>
            ))}
            
            {/* Empty State for List View */}
            {getFilteredAndSortedItems().length === 0 && !loading && (
              <Box textAlign="center" py={8}>
                {searchQuery || filterType !== 'all' ? (
                  <>
                    <SearchIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No items match your search
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setSearchQuery('');
                        setFilterType('all');
                      }}
                      sx={{ mt: 2 }}
                    >
                      Clear Filters
                    </Button>
                  </>
                ) : (
                  <>
                    <DocumentIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No documents found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Create a folder or upload files to get started
                    </Typography>
                  </>
                )}
              </Box>
            )}
          </List>
        )}
      </Paper>

      {/* Speed Dial for Quick Actions */}
      {!isMobile && (
        <SpeedDial
          ariaLabel="Quick actions"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          icon={<SpeedDialIcon />}
          onClose={() => setSpeedDialOpen(false)}
          onOpen={() => setSpeedDialOpen(true)}
          open={speedDialOpen}
        >
          <SpeedDialAction
            icon={<CreateFolderIcon />}
            tooltipTitle="Create Folder"
            tooltipOpen
            onClick={() => {
              setCreateFolderDialog(true);
              setSpeedDialOpen(false);
            }}
          />
          <SpeedDialAction
            icon={<UploadIcon />}
            tooltipTitle="Upload Files"
            tooltipOpen
            onClick={() => {
              fileInputRef.current?.click();
              setSpeedDialOpen(false);
            }}
          />
          <SpeedDialAction
            icon={<DashboardIcon />}
            tooltipTitle="Statistics"
            tooltipOpen
            onClick={() => {
              handleShowStats();
              setSpeedDialOpen(false);
            }}
          />
        </SpeedDial>
      )}

      {/* Mobile FAB */}
      {isMobile && (
      <Fab
        color="primary"
        aria-label="upload"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadIcon />
      </Fab>
      )}

      {/* Create Folder Dialog */}
      <Dialog open={createFolderDialog} onClose={() => setCreateFolderDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            variant="outlined"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFolderDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder} variant="contained" disabled={!newFolderName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Upload Files</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedFiles.length} file(s) selected for upload
          </Typography>
          {selectedFiles.map((file, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
              {getFileIcon(file.type)}
              <Box sx={{ ml: 2, flex: 1 }}>
                <Typography variant="body2">{file.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(file.size)}
                </Typography>
              </Box>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => handleFileUpload(selectedFiles)} 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
        }
      >
        {selectedItem && (
          <>
            <MenuItem onClick={() => handleShowInfo(selectedItem)}>
              <ListItemIcon>
                <InfoIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>View Info</ListItemText>
            </MenuItem>
            
            {selectedItem.type === 'file' && (
              <MenuItem onClick={() => {
                handleDownload(selectedItem);
                handleContextMenuClose();
              }}>
                <ListItemIcon>
                  <DownloadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Download</ListItemText>
              </MenuItem>
            )}
            
            <MenuItem onClick={() => handleRenameClick(selectedItem)}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Rename</ListItemText>
            </MenuItem>
            
            <Divider />
            
            <MenuItem 
              onClick={() => {
                handleDelete(selectedItem);
                handleContextMenuClose();
              }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* File Preview Dialog */}
      <Dialog 
        open={filePreviewDialog} 
        onClose={() => setFilePreviewDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            {previewFile && getFileIcon(previewFile.type)}
            <Box>
              <Typography variant="h6">{previewFile?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {previewFile && formatFileSize(previewFile.size)} • {previewFile && formatDate(previewFile.uploadedAt)}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {previewFile && (
            <Box sx={{ textAlign: 'center', mt: 2, minHeight: 400 }}>
              {(() => {
                const fileType = (previewFile.type || previewFile.mimeType || '').toLowerCase();
                
                // PDF preview
                if (fileType === 'application/pdf' || previewFile.name.toLowerCase().endsWith('.pdf')) {
                  return (
                    <iframe
                      src={previewFile.previewUrl}
                      title={previewFile.name}
                      style={{
                        width: '100%',
                        height: '70vh',
                        border: 'none',
                        borderRadius: '8px'
                      }}
                    />
                  );
                }
                
                // Image preview
                return (
                  <>
              <img
                src={previewFile.previewUrl}
                alt={previewFile.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                        const errorBox = e.target.nextElementSibling;
                        if (errorBox) errorBox.style.display = 'block';
                }}
              />
              <Box sx={{ display: 'none', mt: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  Unable to preview this image
                </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        The image may be corrupted or not accessible.
                      </Typography>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownload(previewFile)}
                  sx={{ mt: 2 }}
                >
                  Download File
                </Button>
              </Box>
                  </>
                );
              })()}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilePreviewDialog(false)}>
            Close
          </Button>
          <Button 
            variant="contained" 
            startIcon={<DownloadIcon />}
            onClick={() => {
              handleDownload(previewFile);
              setFilePreviewDialog(false);
            }}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialog} onClose={() => setRenameDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <EditIcon />
            <Typography variant="h6">Rename {renameItem?.type === 'folder' ? 'Folder' : 'File'}</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Name"
            fullWidth
            variant="outlined"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleRename()}
            helperText={`Current name: ${renameItem?.name || ''}`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialog(false)}>Cancel</Button>
          <Button onClick={handleRename} variant="contained" disabled={!newItemName.trim()}>
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={infoDialog} onClose={() => setInfoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <InfoIcon color="primary" />
            <Typography variant="h6">Item Information</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {infoItem && (
            <Box>
              <Stack spacing={2}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                  <Typography variant="body1" fontWeight="medium">{infoItem.name}</Typography>
                </Paper>
                
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                  <Chip 
                    label={infoItem.type === 'folder' ? 'Folder' : 'File'} 
                    color={infoItem.type === 'folder' ? 'primary' : 'secondary'}
                    size="small"
                  />
                </Paper>

                {infoItem.type === 'folder' ? (
                  <>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Items</Typography>
                      <Typography variant="body1">
                        {(infoItem.itemCount || 0) + (infoItem.subfolderCount || 0)} total items
                        ({infoItem.itemCount || 0} files, {infoItem.subfolderCount || 0} folders)
                      </Typography>
                    </Paper>

                    {infoItem.level > 0 && (
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Level</Typography>
                        <Typography variant="body1">{infoItem.level}</Typography>
                      </Paper>
                    )}

                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Path</Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {infoItem.path}
                      </Typography>
                    </Paper>
                  </>
                ) : (
                  <>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Size</Typography>
                      <Typography variant="body1">{formatFileSize(infoItem.size)}</Typography>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">File Type</Typography>
                      <Typography variant="body2">{infoItem.mimeType || infoItem.type || 'Unknown'}</Typography>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Uploaded By</Typography>
                      <Typography variant="body1">{infoItem.uploadedBy || 'Unknown'}</Typography>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Uploaded At</Typography>
                      <Typography variant="body1">{formatDate(infoItem.uploadedAt)}</Typography>
                    </Paper>
                  </>
                )}

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                  <Typography variant="body1">{infoItem.createdBy || 'Unknown'}</Typography>
                </Paper>

                {infoItem.createdAt && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                    <Typography variant="body1">{formatDate(infoItem.createdAt)}</Typography>
                  </Paper>
                )}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialog(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Statistics Dialog */}
      <Dialog open={statsDialog} onClose={() => setStatsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <DashboardIcon color="primary" />
            <Typography variant="h6">Library Statistics</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {libraryStats && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  textAlign: 'center',
                  p: 3
                }}>
                  <FolderIcon sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h3" fontWeight="bold">
                    {libraryStats.totalFolders}
                  </Typography>
                  <Typography variant="body1">
                    Total Folders
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  textAlign: 'center',
                  p: 3
                }}>
                  <FileIcon sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h3" fontWeight="bold">
                    {libraryStats.totalFiles}
                  </Typography>
                  <Typography variant="body1">
                    Total Files
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  textAlign: 'center',
                  p: 3
                }}>
                  <CloudUploadIcon sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h3" fontWeight="bold">
                    {libraryStats.formattedSize}
                  </Typography>
                  <Typography variant="body1">
                    Total Storage
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Quick Facts
                  </Typography>
                  <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary">Average files per folder:</Typography>
                      <Typography fontWeight="medium">
                        {libraryStats.totalFolders > 0 
                          ? (libraryStats.totalFiles / libraryStats.totalFolders).toFixed(1)
                          : '0'}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary">Current location:</Typography>
                      <Typography fontWeight="medium">
                        {buildPathFromSegments(currentPath)}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary">Items in current folder:</Typography>
                      <Typography fontWeight="medium">
                        {folders.length + files.length}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsDialog(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DocumentLibrary;
