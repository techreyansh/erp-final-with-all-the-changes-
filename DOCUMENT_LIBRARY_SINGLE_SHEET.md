# Document Library - Single Sheet Structure

## Overview
The Document Library now uses a **single Google Sheet** for efficient document and folder management. This approach simplifies data management while maintaining all functionality.

## 📊 **Required Google Sheet:**

### **DocumentLibrary** (Single Sheet)
**Purpose**: Complete document and folder management
**Fields**:
- `id` - Unique document identifier
- `name` - Document/folder name
- `type` - Document type ("folder" or "file")
- `path` - File path location (e.g., "/", "/Projects", "/Projects/2024")
- `parentId` - Parent folder ID (null for root)
- `itemCount` - Number of items in folder (for folders only)
- `documents` - JSON string containing file details (for files) or empty array (for folders)
- `createdBy` - User who created/uploaded the item
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## 📋 **Documents Field Structure:**

### **For Folders:**
```json
"documents": "[]"
```
- Empty JSON array indicating no documents in folder

### **For Files:**
```json
"documents": "{\"fileId\":\"google_drive_file_id\",\"mimeType\":\"application/pdf\",\"size\":1024000,\"uploadedBy\":\"John Doe\",\"uploadedAt\":\"2024-01-15T10:30:00Z\"}"
```
- JSON string containing all file metadata

## 🛠️ **How to Create the Sheet:**

### **Option 1: Automatic Creation (Recommended)**
The Document Library will automatically create the sheet when first accessed. Just navigate to the Document Library and it will set up everything for you.

### **Option 2: Manual Creation**
If you prefer to create it manually:

1. **Go to Google Sheets**
2. **Create a new spreadsheet** with the name: `DocumentLibrary`
3. **Add these field names** as the first row (headers):
   ```
   id | name | type | path | parentId | itemCount | documents | createdBy | createdAt | updatedAt
   ```

## 📋 **Example Data Structure:**

### **Sample Sheet Data:**
```
id                 | name      | type   | path | parentId | itemCount | documents | createdBy | createdAt           | updatedAt
doc_1234567890_abc | Projects  | folder | /    | null     | 3         | []        | John Doe  | 2024-01-15T10:30:00Z| 2024-01-15T10:30:00Z
doc_1234567891_def | 2024      | folder | /Projects | doc_1234567890_abc | 2 | [] | John Doe | 2024-01-15T10:35:00Z | 2024-01-15T10:35:00Z
doc_1234567892_ghi | report.pdf| file   | /    | null     | 0         | {"fileId":"1ABC123","mimeType":"application/pdf","size":1024000,"uploadedBy":"John Doe","uploadedAt":"2024-01-15T11:00:00Z"} | John Doe | 2024-01-15T11:00:00Z | 2024-01-15T11:00:00Z
doc_1234567893_jkl | image.jpg | file   | /Projects | doc_1234567890_abc | 0 | {"fileId":"2DEF456","mimeType":"image/jpeg","size":512000,"uploadedBy":"Jane Smith","uploadedAt":"2024-01-15T11:15:00Z"} | Jane Smith | 2024-01-15T11:15:00Z | 2024-01-15T11:15:00Z
```

## ✅ **Benefits of Single Sheet Structure:**

### **Simplified Management:**
- ✅ **One Sheet**: Only need to manage one Google Sheet
- ✅ **Unified Data**: All documents and folders in one place
- ✅ **Easier Backup**: Single sheet to backup and restore
- ✅ **Simpler Permissions**: One sheet to share and manage access

### **Efficient Operations:**
- ✅ **Faster Queries**: Single data source for all operations
- ✅ **Atomic Updates**: All changes in one transaction
- ✅ **Consistent Data**: No synchronization issues between sheets
- ✅ **Reduced Complexity**: Simpler service layer and data management

### **Better Performance:**
- ✅ **Single API Call**: One call to get all data
- ✅ **Reduced Latency**: No multiple sheet requests
- ✅ **Efficient Filtering**: Filter by type and path in one operation
- ✅ **Optimized Storage**: JSON field for flexible file metadata

## 🔧 **Technical Implementation:**

### **Data Structure:**
- **Folders**: `type = "folder"`, `documents = "[]"`, `itemCount = number`
- **Files**: `type = "file"`, `documents = JSON string`, `itemCount = 0`

### **Path Management:**
- **Root**: `path = "/"`
- **Subfolders**: `path = "/Projects"`, `path = "/Projects/2024"`
- **Parent Tracking**: `parentId` links to parent folder

### **File Metadata:**
- **Storage**: All file details in `documents` JSON field
- **Flexibility**: Easy to add new file properties
- **Efficiency**: Single field contains all file information

## 🔐 **Access Control:**

### **CEO Only Access:**
- ✅ **Restricted Access**: Only users with "CEO" role can access the Document Library
- ✅ **Navigation Protection**: Document Library menu item only visible to CEO
- ✅ **Route Protection**: Automatic redirect to dashboard for non-CEO users
- ✅ **Secure Management**: CEO has full control over all documents and folders

## 🚀 **Ready to Use:**

The Document Library is now optimized with a single sheet structure that provides:
- ✅ **Simplified Setup**: One sheet to create and manage
- ✅ **Better Performance**: Faster operations and queries
- ✅ **Easier Maintenance**: Single data source to maintain
- ✅ **Full Functionality**: All features work with the new structure
- ✅ **CEO Exclusive**: Secure access limited to CEO role only

**The system will automatically create the sheet when the CEO first accesses the Document Library!**
