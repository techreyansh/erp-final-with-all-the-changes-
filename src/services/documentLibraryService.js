import sheetService from './sheetService';
import config from '../config/config';

class DocumentLibraryService {
  constructor() {
    this.sheetName = 'DocumentLibrary';
    this.initializeSheet();
  }

  // Initialize the DocumentLibrary sheet with proper structure
  async initializeSheet() {
    try {
      const headers = [
        'id',
        'name', 
        'type',
        'path',
        'parentId',
        'parentPath',
        'level',
        'itemCount',
        'documents',
        'createdBy',
        'createdAt',
        'updatedAt'
      ];

      // Ensure the sheet exists with the required headers
      await sheetService.createSheetIfNotExists(this.sheetName, headers);
    } catch (error) {
      console.error('Error initializing DocumentLibrary sheet:', error);
    }
  }

  // Generate unique ID for folders and files
  generateId(prefix = 'doc') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  }

  // Normalize a path: ensure leading '/', no trailing '/', collapse multiple slashes
  normalizePath(path) {
    if (!path) return '/';
    let p = String(path).trim();
    p = p.replace(/\\/g, '/');
    p = p.replace(/\s+/g, '');
    p = p.replace(/\/+/g, '/');
    if (!p.startsWith('/')) p = '/' + p;
    // remove trailing slash except root
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p;
  }

  // Normalize parent path; treat null/empty as '/'
  normalizeParentPath(parentPath) {
    const p = this.normalizePath(parentPath || '/');
    return p === '' ? '/' : p;
  }

  // Resolve row index (1-based in Sheets) by row id, returns null if not found
  async getRowIndexById(id) {
    try {
      const rows = await sheetService.getSheetData(this.sheetName);
      const idx = rows.findIndex(r => r.id === id);
      return idx === -1 ? null : (idx + 2); // +2 to account for header row and 1-based index
    } catch (error) {
      console.error('Error getting row index by id:', error);
      return null;
    }
  }

  // Get all documents and subfolders for a specific path
  async getDocuments(path = '/') {
    try {
      const allData = await sheetService.getSheetData(this.sheetName);

      if (!allData || allData.length === 0) {
        return { folders: [], files: [] };
      }

      // Folders directly under the current path
      const normPath = this.normalizePath(path);

      // Precompute subfolder counts keyed by parentPath
      const subfolderCountByParentPath = allData.reduce((acc, row) => {
        if (row.type !== 'folder') return acc;
        const key = this.normalizeParentPath(row.parentPath);
        if (this.normalizePath(row.path) !== '/') {
          acc[key] = (acc[key] || 0) + 1;
        }
        return acc;
      }, {});

      const foldersRaw = allData
        .filter(row => {
          if (row.type !== 'folder') return false;
          
          const rowPath = this.normalizePath(row.path);
          
          // Handle parentPath - could be null, undefined, empty string, or actual path
          let rowParent = this.normalizeParentPath(row.parentPath || null);
          
          // Also check parentId to ensure we have the right parent relationship
          // If parentId exists but parentPath is wrong, use the parent's path
          if (row.parentId && (!row.parentPath || row.parentPath === '/' || row.parentPath === '')) {
            // Try to find the parent folder to get its correct path
            const parentFolder = allData.find(r => r.id === row.parentId);
            if (parentFolder) {
              rowParent = this.normalizePath(parentFolder.path);
            }
          }
          
          if (normPath === '/') {
            // At root: only show folders with parentPath '/' or null/empty (root-level folders)
            // Exclude any row representing the root itself
            const isRootChild = (rowParent === '/' || !rowParent || rowParent === '');
            return isRootChild && rowPath !== '/';
          }
          
          // For nested paths: show folders where parentPath matches current path
          return rowParent === normPath;
        })
        .map(folder => ({
          id: folder.id,
          name: folder.name,
          type: 'folder',
          path: this.normalizePath(folder.path),
          parentId: folder.parentId || null,
          parentPath: this.normalizeParentPath(folder.parentPath),
          level: Number(folder.level) || 0,
          itemCount: Number(folder.itemCount) || 0,
          subfolderCount: subfolderCountByParentPath[this.normalizePath(folder.path)] || 0,
          createdBy: folder.createdBy,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt
        }));

      // Deduplicate by path in case the sheet has accidental duplicates
      const seenPaths = new Set();
      const folders = foldersRaw.filter(f => {
        if (seenPaths.has(f.path)) return false;
        seenPaths.add(f.path);
        return true;
      });

      // Files for the current folder (only from the folder whose path matches)
      const currentFolder = allData.find(r => r.type === 'folder' && this.normalizePath(r.path) === normPath);
      let files = [];
      if (currentFolder && currentFolder.documents && currentFolder.documents !== '[]') {
        try {
          const documents = JSON.parse(currentFolder.documents);
          files = documents.map(doc => ({
            id: doc.id,
            name: doc.name,
            type: 'file',
            fileId: doc.fileId,
            mimeType: doc.mimeType,
            size: doc.size,
            uploadedBy: doc.uploadedBy,
            uploadedAt: doc.uploadedAt,
            folderId: currentFolder.id,
            folderName: currentFolder.name,
            path: currentFolder.path
          }));
        } catch (err) {
          console.error('Error parsing documents for current folder:', currentFolder.id, err);
        }
      }

      return { folders, files };
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  // Create a new folder
  async createFolder(path, folderName) {
    try {
      const folderId = this.generateId('folder');
      const normParent = this.normalizePath(path);
      const parentPath = normParent === '/' ? '/' : normParent;
      let parentId = await this.getFolderIdForPath(normParent);
      
      // If we're creating inside a folder that doesn't exist, throw an error
      // (except for root, where parentId can be null)
      if (normParent !== '/' && !parentId) {
        throw new Error(`Parent folder does not exist at path: ${normParent}. Please create it first or navigate to the correct location.`);
      }
      
      const newFolderPath = this.normalizePath(normParent === '/' ? `/${folderName}` : `${normParent}/${folderName}`);
      const level = this.calculateLevel(newFolderPath);

      // If folder already exists at this path, just return it
      const existingId = await this.getFolderIdForPath(newFolderPath);
      if (existingId) {
        const existing = await this.getFolderById(existingId);
        return existing || { id: existingId, name: folderName, type: 'folder', path: newFolderPath };
      }

      const folderData = {
        id: folderId,
        name: folderName,
        type: 'folder',
        path: newFolderPath,
        parentId: parentId, // null for root folders, actual ID for nested folders
        parentPath: parentPath, // '/' for root folders, actual path for nested folders
        level: level,
        itemCount: 0,
        documents: '[]',
        createdBy: this.getCurrentUser(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await sheetService.appendRow(this.sheetName, folderData);
      return folderData;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  // Upload file to a specific folder
  async uploadFile(path, file) {
    try {
      if (!file || !file.name) {
        throw new Error('Invalid file provided');
      }

      // Ensure folder exists before uploading
      const folderId = await this.getFolderIdForPath(path);
      if (!folderId) {
        // Try to ensure root folder exists if uploading to root
        if (path === '/') {
          await this.ensureRootFolder();
          const newFolderId = await this.getFolderIdForPath(path);
          if (!newFolderId) {
            throw new Error('Cannot upload file: Root folder could not be created');
          }
        } else {
          throw new Error(`Cannot upload file: Folder not found at path "${path}". Please create the folder first.`);
        }
      }

      // Get the final folder ID (in case root was just created)
      const finalFolderId = await this.getFolderIdForPath(path);
      if (!finalFolderId) {
        throw new Error('Folder not found for path: ' + path);
      }

      // Upload the file and get a storage fileId (Drive/localStorage)
      const uploadedFileId = await sheetService.uploadFile(file);
      
      if (!uploadedFileId) {
        throw new Error('File upload failed: No file ID returned from storage');
      }

      // Create file object
      const fileData = {
        id: this.generateId('file'),
        name: file.name,
        fileId: uploadedFileId,
        mimeType: file.type || 'application/octet-stream',
        size: file.size || 0,
        uploadedBy: this.getCurrentUser(),
        uploadedAt: new Date().toISOString()
      };

      // Get current folder data
      const folderData = await this.getFolderById(finalFolderId);
      if (!folderData) {
        throw new Error('Folder data not found after upload');
      }

      // Parse existing documents
      let documents = [];
      if (folderData.documents && folderData.documents !== '[]') {
        try {
          documents = JSON.parse(folderData.documents);
          // Ensure it's an array
          if (!Array.isArray(documents)) {
            documents = [];
          }
        } catch (error) {
          console.error('Error parsing existing documents:', error);
          documents = [];
        }
      }

      // Check if file with same name already exists
      const existingFileIndex = documents.findIndex(doc => doc.name === file.name);
      if (existingFileIndex !== -1) {
        // Replace existing file with same name
        documents[existingFileIndex] = fileData;
      } else {
        // Add new file to documents array
        documents.push(fileData);
      }

      // Update folder with new documents array
      const updatedFolderData = {
        ...folderData,
        documents: JSON.stringify(documents),
        itemCount: documents.length,
        updatedAt: new Date().toISOString()
      };

      const rowIndex = await this.getRowIndexById(finalFolderId);
      if (!rowIndex) throw new Error('Folder row not found for update');
      
      await sheetService.updateRow(this.sheetName, rowIndex, updatedFolderData);
      return fileData;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Get file data by file ID (searches through all folders)
  async getFileData(fileId) {
    try {
      const allData = await sheetService.getSheetData(this.sheetName);
      
      for (const row of allData) {
        if (row.documents && row.documents !== '[]') {
          try {
            const documents = JSON.parse(row.documents);
            const file = documents.find(doc => doc.id === fileId);
            if (file) {
              return {
                ...file,
                folderId: row.id,
                folderName: row.name,
                path: row.path
              };
            }
          } catch (error) {
            console.error('Error parsing documents for folder:', row.id, error);
          }
        }
      }
      
      throw new Error('File not found');
    } catch (error) {
      console.error('Error getting file data:', error);
      throw error;
    }
  }

  // Get file URL for preview/download
  async getFileUrl(fileId) {
    try {
      // Use sheetService to get the file URL from Google Drive or localStorage
      if (config.useLocalStorage) {
        // For localStorage, construct the URL
        const fileData = localStorage.getItem(`file_${fileId}`);
        if (fileData) {
          const parsed = JSON.parse(fileData);
          return parsed.url || `data:${parsed.mimeType};base64,${parsed.data}`;
        }
        throw new Error('File not found in localStorage');
      } else {
        // For Google Drive, construct the download URL
        // In a real implementation, you would use Google Drive API to get the file URL
        // For now, return a placeholder that can be replaced with actual Drive URL
        return `https://drive.google.com/file/d/${fileId}/view`;
      }
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw error;
    }
  }

  // Download file
  async downloadFile(fileId) {
    try {
      const fileData = await this.getFileData(fileId);
      
      // Get the file URL for download
      const fileUrl = await this.getFileUrl(fileData.fileId);
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileData.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return fileData;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  // Delete file
  async deleteFile(fileId) {
    try {
      const allData = await sheetService.getSheetData(this.sheetName);
      
      for (const row of allData) {
        if (row.documents && row.documents !== '[]') {
          try {
            const documents = JSON.parse(row.documents);
            const fileIndex = documents.findIndex(doc => doc.id === fileId);
            
            if (fileIndex !== -1) {
              // Remove file from documents array
              documents.splice(fileIndex, 1);
              
              // Update folder with new documents array
              const updatedFolderData = {
                ...row,
                documents: JSON.stringify(documents),
                itemCount: documents.length,
                updatedAt: new Date().toISOString()
              };

              const rowIndex = await this.getRowIndexById(row.id);
              if (!rowIndex) throw new Error('Folder row not found for deleteFile');
              await sheetService.updateRow(this.sheetName, rowIndex, updatedFolderData);
              return true;
            }
          } catch (error) {
            console.error('Error parsing documents for folder:', row.id, error);
          }
        }
      }
      
      throw new Error('File not found');
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Delete folder (with cascade option to delete contents)
  async deleteFolder(folderId, cascade = false) {
    try {
      const folderData = await this.getFolderById(folderId);
      if (!folderData) {
        throw new Error('Folder not found');
      }

      if (cascade) {
        // Cascade delete: delete all contents first
        
        // 1. Delete all files in this folder
        if (folderData.documents && folderData.documents !== '[]') {
          try {
            const documents = JSON.parse(folderData.documents);
            // Just clear the documents array - files are already stored in this row
            // No need to delete them separately
          } catch (err) {
            console.error('Error parsing documents:', err);
          }
        }
        
        // 2. Delete all subfolders recursively
        const subfolders = await this.getSubfolders(folderId);
        for (const subfolder of subfolders) {
          await this.deleteFolder(subfolder.id, true); // Recursive cascade delete
        }
        
        // 3. Now delete the folder itself
        const rowIndex = await this.getRowIndexById(folderId);
        if (!rowIndex) throw new Error('Folder row not found for delete');
        await sheetService.deleteRow(this.sheetName, rowIndex);
        return true;
      } else {
        // Non-cascade: Check if folder is empty
        
        // Check if folder has any files
        if (folderData && folderData.itemCount > 0) {
          throw new Error('FOLDER_HAS_FILES');
        }

        // Check if folder has subfolders
        const subfolders = await this.getSubfolders(folderId);
        if (subfolders.length > 0) {
          throw new Error('FOLDER_HAS_SUBFOLDERS');
        }

        // Delete empty folder
        const rowIndex = await this.getRowIndexById(folderId);
        if (!rowIndex) throw new Error('Folder row not found for delete');
        await sheetService.deleteRow(this.sheetName, rowIndex);
        return true;
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }

  // Rename file or folder
  async renameItem(itemId, newName) {
    try {
      const allData = await sheetService.getSheetData(this.sheetName);
      
      // Check if it's a folder
      const folderRow = allData.find(row => row.id === itemId && row.type === 'folder');
      if (folderRow) {
        // Rename folder
        const updatedFolderData = {
          ...folderRow,
          name: newName,
          updatedAt: new Date().toISOString()
        };
        
        const rowIndex = await this.getRowIndexById(itemId);
        if (!rowIndex) throw new Error('Folder row not found for rename');
        await sheetService.updateRow(this.sheetName, rowIndex, updatedFolderData);
        return true;
      }
      
      // Check if it's a file (search through all folders)
      for (const row of allData) {
        if (row.documents && row.documents !== '[]') {
          try {
            const documents = JSON.parse(row.documents);
            const fileIndex = documents.findIndex(doc => doc.id === itemId);
            
            if (fileIndex !== -1) {
              // Rename file
              documents[fileIndex].name = newName;
              
              // Update folder with renamed file
              const updatedFolderData = {
                ...row,
                documents: JSON.stringify(documents),
                updatedAt: new Date().toISOString()
              };
              
              const rowIndex = await this.getRowIndexById(row.id);
              if (!rowIndex) throw new Error('Folder row not found for rename');
              await sheetService.updateRow(this.sheetName, rowIndex, updatedFolderData);
              return true;
            }
          } catch (error) {
            console.error('Error parsing documents for folder:', row.id, error);
          }
        }
      }
      
      throw new Error('Item not found');
    } catch (error) {
      console.error('Error renaming item:', error);
      throw error;
    }
  }

  // Ensure root folder exists (creates it if it doesn't)
  async ensureRootFolder() {
    try {
      const rootFolderId = await this.getFolderIdForPath('/');
      if (rootFolderId) {
        return rootFolderId;
      }
      
      // Create root folder
      const rootFolderData = {
        id: this.generateId('folder'),
        name: 'Root',
        type: 'folder',
        path: '/',
        parentId: null,
        parentPath: null,
        level: 0,
        itemCount: 0,
        documents: '[]',
        createdBy: this.getCurrentUser(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await sheetService.appendRow(this.sheetName, rootFolderData);
      return rootFolderData.id;
    } catch (error) {
      console.error('Error ensuring root folder:', error);
      throw error;
    }
  }

  // Helper method to get folder ID for a specific path
  async getFolderIdForPath(path) {
    try {
      const norm = this.normalizePath(path);
      const allData = await sheetService.getSheetData(this.sheetName);
      const folder = allData.find(row => this.normalizePath(row.path) === norm && row.type === 'folder');
      return folder ? folder.id : null;
    } catch (error) {
      console.error('Error getting folder ID for path:', error);
      return null;
    }
  }

  // Helper method to get parent folder ID
  async getParentFolderId(path) {
    if (path === '/') return null;
    
    const pathParts = path.split('/').filter(part => part !== '');
    if (pathParts.length === 1) return null;
    
    const parentPath = '/' + pathParts.slice(0, -1).join('/');
    return await this.getFolderIdForPath(parentPath);
  }

  // Helper method to calculate folder level
  calculateLevel(path) {
    if (!path || path === '/') return 0;
    return path.split('/').filter(part => part !== '').length;
  }

  // Helper method to get folder by ID
  async getFolderById(folderId) {
    try {
      const allData = await sheetService.getSheetData(this.sheetName);
      return allData.find(row => row.id === folderId);
    } catch (error) {
      console.error('Error getting folder by ID:', error);
      return null;
    }
  }

  // Helper method to get subfolders
  async getSubfolders(parentId) {
    try {
      const allData = await sheetService.getSheetData(this.sheetName);
      return allData.filter(row => row.parentId === parentId && row.type === 'folder');
    } catch (error) {
      console.error('Error getting subfolders:', error);
      return [];
    }
  }

  // Helper method to get current user (you may need to adjust this based on your auth system)
  getCurrentUser() {
    // This should be replaced with actual user from your auth context
    return 'Current User';
  }

  // Get folder hierarchy for breadcrumb navigation
  async getFolderHierarchy(currentPath) {
    try {
      const pathParts = currentPath.split('/').filter(part => part !== '');
      const hierarchy = [{ name: 'Home', path: '/' }];
      
      let currentPathStr = '';
      for (const part of pathParts) {
        currentPathStr += '/' + part;
        const folderData = await this.getFolderById(await this.getFolderIdForPath(currentPathStr));
        if (folderData) {
          hierarchy.push({
            name: folderData.name,
            path: currentPathStr
          });
        }
      }
      
      return hierarchy;
    } catch (error) {
      console.error('Error getting folder hierarchy:', error);
      return [{ name: 'Home', path: '/' }];
    }
  }

  // Search files across all folders
  async searchFiles(query) {
    try {
      const allData = await sheetService.getSheetData(this.sheetName);
      const results = [];
      
      for (const row of allData) {
        if (row.documents && row.documents !== '[]') {
          try {
            const documents = JSON.parse(row.documents);
            const matchingFiles = documents.filter(doc => 
              doc.name.toLowerCase().includes(query.toLowerCase())
            );
            
            matchingFiles.forEach(file => {
              results.push({
                ...file,
                folderId: row.id,
                folderName: row.name,
                path: row.path
              });
            });
          } catch (error) {
            console.error('Error parsing documents for folder:', row.id, error);
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error searching files:', error);
      return [];
    }
  }

  // Get library statistics
  async getLibraryStats() {
    try {
      const allData = await sheetService.getSheetData(this.sheetName);
      let totalFolders = 0;
      let totalFiles = 0;
      let totalSize = 0;
      
      for (const row of allData) {
        if (row.type === 'folder') {
          totalFolders++;
          
          if (row.documents && row.documents !== '[]') {
            try {
              const documents = JSON.parse(row.documents);
              totalFiles += documents.length;
              documents.forEach(doc => {
                totalSize += doc.size || 0;
              });
            } catch (error) {
              console.error('Error parsing documents for folder:', row.id, error);
            }
          }
        }
      }
      
      return {
        totalFolders,
        totalFiles,
        totalSize,
        formattedSize: this.formatFileSize(totalSize)
      };
    } catch (error) {
      console.error('Error getting library stats:', error);
      return {
        totalFolders: 0,
        totalFiles: 0,
        totalSize: 0,
        formattedSize: '0 Bytes'
      };
    }
  }

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default new DocumentLibraryService();
