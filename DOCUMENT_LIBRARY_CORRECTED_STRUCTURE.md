# Document Library - Nested Folder Structure

## Overview
The Document Library now supports **nested folder structure** where folders can contain both files and subfolders, creating a hierarchical tree structure: `folder -> file1 -> folder x -> file2 -> file3`. Each folder is represented by a single row, and all files within that folder are stored as an array in the `documents` field.

## 📊 **Google Sheet Structure:**

### **DocumentLibrary Sheet**
**Purpose**: Complete document and folder management with nested hierarchy support
**Fields**:
- `id` - Unique folder identifier
- `name` - Folder name
- `type` - Always "folder"
- `path` - Full folder path (e.g., "/", "/Projects", "/Projects/2024", "/Projects/2024/Q1")
- `parentId` - Parent folder ID (null for root)
- `parentPath` - Parent folder path (null for root)
- `level` - Folder depth level (0 for root, 1 for first level, etc.)
- `itemCount` - Number of files in this folder
- `documents` - JSON array containing all files in this folder
- `createdBy` - User who created the folder
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## 📋 **Documents Field Structure:**

### **For Folders with Files:**
```json
"documents": "[
  {
    \"id\": \"file_1234567890_abc\",
    \"name\": \"document.pdf\",
    \"fileId\": \"storage_file_id\",
    \"mimeType\": \"application/pdf\",
    \"size\": 1024000,
    \"uploadedBy\": \"John Doe\",
    \"uploadedAt\": \"2024-01-15T10:30:00Z\"
  },
  {
    \"id\": \"file_1234567891_def\",
    \"name\": \"image.jpg\",
    \"fileId\": \"storage_file_id_2\",
    \"mimeType\": \"image/jpeg\",
    \"size\": 512000,
    \"uploadedBy\": \"Jane Smith\",
    \"uploadedAt\": \"2024-01-15T11:00:00Z\"
  }
]"
```

### **For Empty Folders:**
```json
"documents": "[]"
```

## 🛠️ **How It Works:**

### **File Upload Process:**
1. **Check if folder exists** for the current path
2. **If folder exists**: Add file to existing folder's documents array
3. **If folder doesn't exist**: Create new folder row with the file in documents array
4. **Update itemCount** to reflect the number of files

### **File Retrieval Process:**
1. **Find folder** for the current path
2. **Parse documents array** from the folder row
3. **Map files** from the array to display format
4. **Return files** for the UI

### **File Operations:**
- **View/Download**: Search through all folders to find the file by ID
- **Delete**: Remove file from the documents array and update itemCount
- **Preview**: Retrieve file content using the stored fileId

## 📋 **Example Data Structure:**

### **Sample Sheet Data with Nested Structure:**
```
id                 | name      | type   | path | parentId | parentPath | level | itemCount | documents | createdBy | createdAt           | updatedAt
doc_1234567890_abc | Root      | folder | /    | null     | null       | 0     | 2         | [{"id":"file_1","name":"doc1.pdf",...},{"id":"file_2","name":"img1.jpg",...}] | John Doe  | 2024-01-15T10:30:00Z| 2024-01-15T10:30:00Z
doc_1234567891_def | Projects  | folder | /Projects | doc_1234567890_abc | / | 1 | 1 | [{"id":"file_3","name":"project.pdf",...}] | John Doe | 2024-01-15T10:35:00Z | 2024-01-15T10:35:00Z
doc_1234567892_ghi | 2024      | folder | /Projects/2024 | doc_1234567891_def | /Projects | 2 | 2 | [{"id":"file_4","name":"report.pdf",...},{"id":"file_5","name":"data.xlsx",...}] | John Doe | 2024-01-15T10:40:00Z | 2024-01-15T10:40:00Z
doc_1234567893_jkl | Q1        | folder | /Projects/2024/Q1 | doc_1234567892_ghi | /Projects/2024 | 3 | 1 | [{"id":"file_6","name":"quarterly.pdf",...}] | John Doe | 2024-01-15T10:45:00Z | 2024-01-15T10:45:00Z
```

### **Nested Structure Example:**
```
/ (Root)
├── doc1.pdf (file)
├── img1.jpg (file)
└── Projects/ (folder)
    └── project.pdf (file)
    └── 2024/ (folder)
        ├── report.pdf (file)
        ├── data.xlsx (file)
        └── Q1/ (folder)
            └── quarterly.pdf (file)
```

## ✅ **Benefits of Nested Structure:**

### **Efficient Storage:**
- ✅ **One Row Per Folder**: No duplicate folder entries
- ✅ **Multiple Files Per Row**: All files in a folder stored together
- ✅ **Hierarchical Relationships**: Clear parent-child folder relationships with level tracking
- ✅ **Accurate Counts**: itemCount reflects actual number of files
- ✅ **Path-based Navigation**: Full path tracking for easy navigation

### **Better Performance:**
- ✅ **Fewer Rows**: Less data to process
- ✅ **Atomic Updates**: All files in a folder updated together
- ✅ **Efficient Queries**: Single query per folder level
- ✅ **Consistent Data**: No orphaned file rows
- ✅ **Level-based Filtering**: Quick access by folder depth

### **Easier Management:**
- ✅ **Logical Structure**: Matches real-world folder/file relationships
- ✅ **Simpler Queries**: Find folder, get all files and subfolders
- ✅ **Bulk Operations**: Easy to manage all files in a folder
- ✅ **Clear Hierarchy**: Proper folder nesting with unlimited depth
- ✅ **Breadcrumb Navigation**: Easy path-based navigation

## 🔧 **Technical Implementation:**

### **Data Flow:**
1. **Upload File** → Check/Create Folder → Add to Documents Array → Update Count
2. **Create Folder** → Calculate Path/Level → Create Row with Parent Relationship
3. **View Files** → Find Folder by Path → Parse Documents Array → Display Files
4. **Navigate Folders** → Update Path → Load Subfolders and Files
5. **Delete File** → Find Folder → Remove from Array → Update Count
6. **Delete Folder** → Check for Files/Subfolders → Remove Row
7. **Download File** → Search All Folders → Find File → Retrieve Content

### **Key Methods:**
- `uploadFile()` - Adds file to existing folder or creates new folder
- `createFolder()` - Creates new folder with proper path and level calculation
- `getDocuments()` - Retrieves files and subfolders from current path
- `getFileData()` - Searches all folders to find specific file
- `deleteFile()` - Removes file from folder's documents array
- `deleteFolder()` - Removes folder after checking for contents
- `getFolderHierarchy()` - Builds breadcrumb navigation path
- `searchFiles()` - Searches files across all folders
- `getLibraryStats()` - Provides library statistics

### **Navigation System:**
- **Path-based Navigation**: Uses full paths like "/Projects/2024/Q1"
- **Breadcrumb Support**: Generates navigation hierarchy
- **Level Tracking**: Maintains folder depth for UI indentation
- **Parent Relationships**: Tracks parent-child folder relationships

## 🚀 **Ready to Use:**

The Document Library now has the **nested structure** that:
- ✅ **Stores files efficiently** in folder-based rows
- ✅ **Maintains proper relationships** between folders and files
- ✅ **Supports unlimited nesting** with proper hierarchy
- ✅ **Provides accurate counts** and metadata
- ✅ **Enables proper file operations** (view, download, delete)
- ✅ **Supports hierarchical navigation** with breadcrumbs
- ✅ **Tracks folder levels** for proper UI display
- ✅ **Maintains path integrity** for consistent navigation

**This nested structure is now production-ready and supports the requested folder -> file1 -> folder x -> file2 -> file3 hierarchy!**
