import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Typography,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Chip,
  Card,
  CardContent,
  Stack,
  Container,
  Avatar,
  Badge,
  useTheme,
  useMediaQuery,
  CircularProgress,
  TablePagination,
  TableSortLabel,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { getAllProductsFromClients, getAllClients, updateClient } from "../../services/clientService";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as StockIcon,
  Factory as ProductIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon,
  LocationOn as LocationIcon,
  Scale as ScaleIcon,
  Category as CategoryIcon,
  Today as TodayIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  InfoOutlined as InfoIcon,
  RemoveCircle as RemoveIcon,
  ArrowForward as ArrowForwardIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import sheetService from "../../services/sheetService";
import * as XLSX from 'xlsx';

const FGStockSheet = () => {
  // Theme and responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const navigate = useNavigate();

  // State management
  const [stockItems, setStockItems] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]); // Products from Clients sheet
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openViewDetailsDialog, setOpenViewDetailsDialog] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState("Product Code");
  const [order, setOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [clientCodeFilter, setClientCodeFilter] = useState("all");

  const [formData, setFormData] = useState({
    "Product Code": "",
    "Product Name": "",
    "Category": "",
    "Current Stock": "",
    "Min Level": "",
    "Max Level": "",
    "Reorder Point": "",
    "Unit": "",
    "Location": "",
    "Last Updated": new Date().toISOString().split("T")[0],
    "Status": "Available",
  });

  // Refresh products from Clients sheet
  const refreshProducts = async () => {
    await fetchProductsFromClients();
  };

  // Helper functions for UI
  const getTotalProducts = () => stockItems.length;

  const getCriticalStock = () => 
    stockItems.filter(item => {
      const current = parseFloat(item["Current Stock"] || 0);
      const min = parseFloat(item["Min Level"] || 0);
      return current < min;
    }).length;

  const getLowStock = () => 
    stockItems.filter(item => {
      const current = parseFloat(item["Current Stock"] || 0);
      const reorder = parseFloat(item["Reorder Point"] || 0);
      const min = parseFloat(item["Min Level"] || 0);
      return current >= min && current <= reorder;
    }).length;

  const getNormalStock = () => 
    stockItems.filter(item => {
      const current = parseFloat(item["Current Stock"] || 0);
      const reorder = parseFloat(item["Reorder Point"] || 0);
      const max = parseFloat(item["Max Level"] || 0);
      return current > reorder && current <= max;
    }).length;

  const getOverStock = () => 
    stockItems.filter(item => {
      const current = parseFloat(item["Current Stock"] || 0);
      const max = parseFloat(item["Max Level"] || 0);
      return current > max;
    }).length;

  const getTotalStockValue = () => 
    stockItems.reduce((total, item) => total + parseFloat(item["Current Stock"] || 0), 0);

  const getUniqueCategories = () => {
    const categories = new Set(stockItems.map(item => item.Category).filter(Boolean));
    return categories.size;
  };

  const getUniqueLocations = () => {
    const locations = new Set(stockItems.map(item => item.Location).filter(Boolean));
    return locations.size;
  };

  const getUniqueClientCodes = () => {
    const clientCodes = new Set(stockItems.map(item => item["Client Code"]).filter(Boolean));
    return Array.from(clientCodes).sort();
  };

  const getStockStatus = (item) => {
    const current = parseFloat(item["Current Stock"] || 0);
    const min = parseFloat(item["Min Level"] || 0);
    const reorder = parseFloat(item["Reorder Point"] || 0);
    const max = parseFloat(item["Max Level"] || 0);

    if (current < min) {
      return { label: "Critical", color: "error", icon: <ErrorIcon color="error" /> };
    } else if (current <= reorder) {
      return { label: "Low", color: "warning", icon: <WarningIcon color="warning" /> };
    } else if (current <= max) {
      return { label: "Normal", color: "success", icon: <CheckIcon color="success" /> };
    } else {
      return { label: "Overstock", color: "info", icon: <TrendingUpIcon color="info" /> };
    }
  };

  useEffect(() => {
    fetchProductsFromClients(); // Fetch products from Clients sheet instead of FG Stock
  }, []);

  const fetchProductsFromClients = async () => {
    try {
      setLoading(true);
      const products = await getAllProductsFromClients();
      // Set available products for auto-fill functionality
      setAvailableProducts(products);
      
      // If no products from Clients sheet, show empty state
      if (products.length === 0) {
        setStockItems([]);
        return;
      }
      
      // Transform products to match the expected format for display
      const transformedProducts = products.map(product => ({
        "Product Code": product.productCode,
        "Product Name": product.productName,
        "Category": product.category,
        "Current Stock": product.currentStock || '',
        "Min Level": product.minLevel || '',
        "Max Level": product.maxLevel || '',
        "Reorder Point": product.reorderPoint || '',
        "Unit": product.unit || '',
        "Location": product.location || '',
        "Last Updated": product.lastUpdated || new Date().toISOString().split("T")[0],
        "Status": product.status || 'Active',
        // Keep source information for reference
        "Client Code": product.clientCode,
        "Client Name": product.clientName
      }));
      
      setStockItems(transformedProducts);
    } catch (error) {
      console.error("Error fetching products from Clients sheet:", error);
      showSnackbar("Error fetching products from Clients sheet: " + error.message, "error");
      setStockItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "Product Code" ? value.toUpperCase() : value,
    }));
  };

  const handleProductCodeChange = (e) => {
    const value = e.target.value.toUpperCase();
    setFormData((prev) => ({
      ...prev,
      "Product Code": value,
    }));
    
    // Try to find matching product from available products
    const matchingProduct = availableProducts.find(product => 
      product.productCode && product.productCode.toUpperCase() === value.toUpperCase()
    );
    
    if (matchingProduct) {
      setFormData((prev) => ({
        ...prev,
        "Product Name": matchingProduct.productName || "",
        "Category": matchingProduct.category || "",
      }));
    } else {
      // Only clear if the field is not being edited manually
      if (value === "") {
        setFormData((prev) => ({
          ...prev,
          "Product Name": "",
          "Category": "",
        }));
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData["Product Code"]) {
        showSnackbar("Product Code is required", "error");
        return;
      }
      
      if (!formData["Product Name"]) {
        showSnackbar("Product Name is required", "error");
        return;
      }
      
      // Check for existing item using Product Code as the primary identifier
      const existingIndex = stockItems.findIndex(
        (item) => item["Product Code"] && formData["Product Code"] && 
        item["Product Code"].toString().trim().toUpperCase() === formData["Product Code"].toString().trim().toUpperCase()
      );
      
      if (existingIndex !== -1) {
        await handleUpdate(existingIndex, {
          ...formData,
          "Last Updated": new Date().toISOString().split("T")[0],
        });
        setOpenDialog(false);
        showSnackbar("Product stock item updated successfully");
      } else {
        // Add new product stock data to Clients sheet
        await addProductStockToClientsSheet({
          ...formData,
          "Last Updated": new Date().toISOString().split("T")[0],
        });
        setOpenDialog(false);
        showSnackbar("Product stock item added successfully");
        fetchProductsFromClients();
        resetForm();
      }
    } catch (error) {
      showSnackbar("Error saving product stock item: " + error.message, "error");
    }
  };

  const handleUpdate = async (rowIndex, newData) => {
    try {
      // Update product stock data in Clients sheet
      await updateProductStockInClientsSheet(newData);
      setStockItems((prev) => {
        const updated = [...prev];
        updated[rowIndex] = { ...newData };
        return updated;
      });
    } catch (error) {
      throw error;
    }
  };

  // Function to add product stock data to Clients sheet
  const addProductStockToClientsSheet = async (productStockData) => {
    try {
      // Find the client that has this product
      const clients = await getAllClients();
      let clientFound = false;
      
      for (const client of clients) {
        if (client.products && Array.isArray(client.products)) {
          const productIndex = client.products.findIndex(
            p => p.productCode && p.productCode.toUpperCase() === productStockData["Product Code"].toUpperCase()
          );
          
          if (productIndex !== -1) {
            // Update the existing product with stock information
            client.products[productIndex] = {
              ...client.products[productIndex],
              currentStock: productStockData["Current Stock"] || '',
              minLevel: productStockData["Min Level"] || '',
              maxLevel: productStockData["Max Level"] || '',
              reorderPoint: productStockData["Reorder Point"] || '',
              unit: productStockData["Unit"] || '',
              location: productStockData["Location"] || '',
              lastUpdated: productStockData["Last Updated"] || new Date().toISOString().split("T")[0],
              status: productStockData["Status"] || 'Active'
            };
            
            // Update the client in the sheet
            await updateClient(client, client.clientCode);
            clientFound = true;
            break;
          }
        }
      }
      
      if (!clientFound) {
        throw new Error(`Product ${productStockData["Product Code"]} not found in any client. Please add the product to a client first.`);
      }
    } catch (error) {
      console.error("Error adding product stock to Clients sheet:", error);
      throw error;
    }
  };

  // Function to update product stock data in Clients sheet
  const updateProductStockInClientsSheet = async (productStockData) => {
    try {
      // Find the client that has this product
      const clients = await getAllClients();
      let clientFound = false;
      
      for (const client of clients) {
        if (client.products && Array.isArray(client.products)) {
          const productIndex = client.products.findIndex(
            p => p.productCode && p.productCode.toUpperCase() === productStockData["Product Code"].toUpperCase()
          );
          
          if (productIndex !== -1) {
            // Update the existing product with stock information
            client.products[productIndex] = {
              ...client.products[productIndex],
              currentStock: productStockData["Current Stock"] || '',
              minLevel: productStockData["Min Level"] || '',
              maxLevel: productStockData["Max Level"] || '',
              reorderPoint: productStockData["Reorder Point"] || '',
              unit: productStockData["Unit"] || '',
              location: productStockData["Location"] || '',
              lastUpdated: productStockData["Last Updated"] || new Date().toISOString().split("T")[0],
              status: productStockData["Status"] || 'Active'
            };
            
            // Update the client in the sheet
            await updateClient(client, client.clientCode);
            clientFound = true;
            break;
          }
        }
      }
      
      if (!clientFound) {
        throw new Error(`Product ${productStockData["Product Code"]} not found in any client. Please add the product to a client first.`);
      }
    } catch (error) {
      console.error("Error updating product stock in Clients sheet:", error);
      throw error;
    }
  };

  const handleDelete = async (rowIndex) => {
    if (!window.confirm('Are you sure you want to delete this product stock item?')) {
      return;
    }
    try {
      const productToDelete = stockItems[rowIndex];
      if (!productToDelete) {
        throw new Error("Product not found");
      }
      
      // Find and update the client that has this product
      const clients = await getAllClients();
      let clientFound = false;
      
      for (const client of clients) {
        if (client.products && Array.isArray(client.products)) {
          const productIndex = client.products.findIndex(
            p => p.productCode && p.productCode.toUpperCase() === productToDelete["Product Code"].toUpperCase()
          );
          
          if (productIndex !== -1) {
            // Remove stock information from the product (keep the product but clear stock data)
            client.products[productIndex] = {
              ...client.products[productIndex],
              currentStock: '',
              minLevel: '',
              maxLevel: '',
              reorderPoint: '',
              unit: '',
              location: '',
              lastUpdated: '',
              status: 'Active'
            };
            
            // Update the client in the sheet
            await updateClient(client, client.clientCode);
            clientFound = true;
            break;
          }
        }
      }
      
      if (!clientFound) {
        throw new Error(`Product ${productToDelete["Product Code"]} not found in any client.`);
      }
      
      showSnackbar("Product stock item deleted successfully");
      fetchProductsFromClients();
    } catch (error) {
      showSnackbar("Error deleting product stock item: " + error.message, "error");
    }
  };

  const resetForm = () => {
    setFormData({
      "Product Code": "",
      "Product Name": "",
      "Category": "",
      "Current Stock": "",
      "Min Level": "",
      "Max Level": "",
      "Reorder Point": "",
      "Unit": "",
      "Location": "",
      "Last Updated": new Date().toISOString().split("T")[0],
      "Status": "Available",
    });
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({ ...item });
    
    setOpenDialog(true);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    resetForm();
  };

  const handleViewDetails = (item) => {
    setSelectedItemDetails(item);
    setOpenViewDetailsDialog(true);
  };

  // BOM Navigation function - similar to product management
  const handleBOMNavigation = (item) => {
    // Create a product-like object for BOM navigation
    const productForBOM = {
      productCode: item["Product Code"],
      productName: item["Product Name"],
      category: item.Category,
      clientCode: item["Client Code"] || '',
      clientName: item["Client Name"] || ''
    };

    // Navigate to BOM page with product information
    navigate('/inventory/bill-of-materials', { 
      state: { 
        selectedProduct: productForBOM,
        focusSelection: true
      }
    });
  };

  const generateFGStockItemPDF = (item) => {
    const companyName = "REYANSH INTERNATIONAL PVT. LTD";
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '/');
    
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>FG Stock Item Details - ${item["Product Name"]}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #1976d2;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 10px;
          }
          .report-title {
            font-size: 18px;
            color: #666;
            margin-bottom: 5px;
          }
          .report-date {
            font-size: 14px;
            color: #999;
          }
          .item-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .detail-section {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #1976d2;
          }
          .detail-section h3 {
            margin: 0 0 15px 0;
            color: #1976d2;
            font-size: 16px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
          }
          .detail-label {
            font-weight: bold;
            color: #555;
          }
          .detail-value {
            color: #333;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-normal { background-color: #d4edda; color: #155724; }
          .status-low { background-color: #fff3cd; color: #856404; }
          .status-critical { background-color: #f8d7da; color: #721c24; }
          .status-overstock { background-color: #d1ecf1; color: #0c5460; }
          .item-list {
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            margin-top: 10px;
          }
          .item-entry {
            padding: 5px 0;
            border-bottom: 1px solid #eee;
          }
          .item-entry:last-child {
            border-bottom: none;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${companyName}</div>
          <div class="report-title">Finished Goods Stock Item Details Report</div>
          <div class="report-date">Generated on: ${currentDate}</div>
        </div>

        <div class="item-details">
          <div class="detail-section">
            <h3>Product Information</h3>
            <div class="detail-row">
              <span class="detail-label">Product Code:</span>
              <span class="detail-value">${item["Product Code"] || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Product Name:</span>
              <span class="detail-value">${item["Product Name"] || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Category:</span>
              <span class="detail-value">${item.Category || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Unit:</span>
              <span class="detail-value">${item.Unit || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Location:</span>
              <span class="detail-value">${item.Location || 'N/A'}</span>
            </div>
          </div>

          <div class="detail-section">
            <h3>Stock Levels</h3>
            <div class="detail-row">
              <span class="detail-label">Current Stock:</span>
              <span class="detail-value">${item["Current Stock"] || '0'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Minimum Level:</span>
              <span class="detail-value">${item["Min Level"] || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Maximum Level:</span>
              <span class="detail-value">${item["Max Level"] || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Reorder Point:</span>
              <span class="detail-value">${item["Reorder Point"] || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">
                <span class="status-badge status-${getStockStatus(item).color}">
                  ${getStockStatus(item).label}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>This report was generated by the Stock Management System</p>
          <p>${companyName} - Inventory Management</p>
        </div>
      </body>
      </html>
    `;

    // Create a new window to generate PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
      printWindow.print();
    };
  };

  // Sorting logic
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedItems = [...stockItems]
    .filter((item) => {
      // Client code filter
      if (clientCodeFilter !== "all" && item["Client Code"] !== clientCodeFilter) {
        return false;
      }
      
      // Search filter
      const searchTerm = search.toLowerCase();
      const matchesProduct = String(item["Product Code"] || "").toLowerCase().includes(searchTerm) ||
                           String(item["Product Name"] || "").toLowerCase().includes(searchTerm) ||
                           String(item.Category || "").toLowerCase().includes(searchTerm) ||
                           String(item["Client Code"] || "").toLowerCase().includes(searchTerm);
      
      return matchesProduct;
    })
    .sort((a, b) => {
      if (order === "asc") {
        return a[orderBy] > b[orderBy] ? 1 : -1;
      } else {
        return a[orderBy] < b[orderBy] ? 1 : -1;
      }
    });

  const paginatedItems = sortedItems.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  function handleChangePage(event, newPage) {
    setPage(newPage);
  }

  function handleChangeRowsPerPage(event) {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }

  // Function to download Excel file for filtered client
  const handleDownloadExcel = () => {
    const itemsToExport = sortedItems; // Already filtered by client code and search
    
    if (itemsToExport.length === 0) {
      showSnackbar("No items to export", "warning");
      return;
    }

    // Prepare data for Excel
    const excelData = itemsToExport.map((item) => ({
      "Product Code": item["Product Code"] || "",
      "Product Name": item["Product Name"] || "",
      "Client Code": item["Client Code"] || "",
      "Category": item.Category || "",
      "Current Stock": item["Current Stock"] || "",
      "Min Level": item["Min Level"] || "",
      "Max Level": item["Max Level"] || "",
      "Reorder Point": item["Reorder Point"] || "",
      "Unit": item.Unit || "",
      "Location": item.Location || "",
      "Last Updated": item["Last Updated"] || "",
      "Status": item["Status"] || "",
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Determine sheet name based on filter
    const sheetName = clientCodeFilter !== "all" 
      ? `FG_Stock_${clientCodeFilter}` 
      : "FG_Stock_All";
    
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Product Code
      { wch: 30 }, // Product Name
      { wch: 15 }, // Client Code
      { wch: 15 }, // Category
      { wch: 12 }, // Current Stock
      { wch: 12 }, // Min Level
      { wch: 12 }, // Max Level
      { wch: 12 }, // Reorder Point
      { wch: 10 }, // Unit
      { wch: 15 }, // Location
      { wch: 15 }, // Last Updated
      { wch: 12 }, // Status
    ];
    ws['!cols'] = colWidths;

    // Generate filename with current date and client code
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = clientCodeFilter !== "all"
      ? `FG_Stock_${clientCodeFilter}_${dateStr}.xlsx`
      : `FG_Stock_All_${dateStr}.xlsx`;

    // Download the file
    XLSX.writeFile(wb, filename);

    showSnackbar(
      `Excel file with ${itemsToExport.length} items downloaded successfully!`,
      "success"
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56 }}>
            <StorageIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #1976d2, #64b5f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              FG Stock Sheet
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Finished Goods Stock Management System
            </Typography>
          </Box>
        </Stack>
        
        <Stack direction="row" alignItems="center" spacing={2}>
          {loading && (
            <CircularProgress 
              size={24} 
              color="primary"
            />
          )}
          <Tooltip title="Next to FG Material Inward">
            <IconButton
              onClick={() => navigate('/inventory/stock-sheet/fg-material-inward')}
              sx={{
                color: theme.palette.primary.main,
                bgcolor: 'rgba(25, 118, 210, 0.1)',
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.2)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <ArrowForwardIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Summary Cards */}
      {stockItems.length > 0 && (
        <Card sx={{ mb: 3, boxShadow: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <AnalyticsIcon color="primary" />
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                Stock Summary
              </Typography>
            </Stack>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Badge badgeContent={getTotalProducts()} color="primary">
                      <AssignmentIcon color="primary" />
                    </Badge>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Products
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {getTotalProducts()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <ErrorIcon color="error" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Critical Stock
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                        {getCriticalStock()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <WarningIcon color="warning" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Low Stock
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                        {getLowStock()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <CheckIcon color="success" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Normal Stock
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {getNormalStock()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Action Bar */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <Stack spacing={3}>
            {/* Search and Filter Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              <SearchIcon color="action" sx={{ display: { xs: 'none', sm: 'block' } }} />
              <TextField
                label="Search products and clients"
                variant="outlined"
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Product Code, Name, Category, Client Code..."
                sx={{ flex: 1, minWidth: { xs: "100%", sm: "300px" } }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active', display: { xs: 'block', sm: 'none' } }} />
                }}
              />
              <Autocomplete
                options={["all", ...getUniqueClientCodes()]}
                value={clientCodeFilter}
                onChange={(event, newValue) => {
                  setClientCodeFilter(newValue || "all");
                  setPage(0); // Reset to first page when filter changes
                }}
                getOptionLabel={(option) => option === "all" ? "All Clients" : option}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filter by Client Code"
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: { xs: "100%", sm: "200px" } }}
                  />
                )}
                sx={{ minWidth: { xs: "100%", sm: "200px" } }}
              />
            </Box>
            
            {/* Action Buttons Section */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, flexWrap: 'wrap' }}>
              {/* Export & Refresh Group */}
              <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ flex: { xs: '1 1 100%', sm: '0 1 auto' } }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadExcel}
                  size="medium"
                  disabled={sortedItems.length === 0}
                  sx={{
                    borderColor: 'success.main',
                    color: 'success.main',
                    '&:hover': {
                      borderColor: 'success.dark',
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    },
                    whiteSpace: 'nowrap'
                  }}
                  title={clientCodeFilter !== "all" 
                    ? `Download Excel for Client: ${clientCodeFilter}` 
                    : "Download Excel for all clients"}
                >
                  {clientCodeFilter !== "all" ? `Download ${clientCodeFilter}` : "Download Excel"}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={refreshProducts}
                  size="medium"
                  title="Refresh products from Clients sheet"
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Refresh
                </Button>
              </Stack>

              {/* Product Management Group */}
              <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ flex: { xs: '1 1 100%', sm: '0 1 auto' } }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenDialog}
                  size="medium"
                  sx={{ 
                    background: 'linear-gradient(45deg, #1976d2, #64b5f6)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #0d47a1, #1976d2)',
                    },
                    whiteSpace: 'nowrap'
                  }}
                >
                  Add Product
                </Button>
              </Stack>

              {/* Material Flow Group */}
              <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ flex: { xs: '1 1 100%', sm: '0 1 auto' } }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/inventory/stock-sheet/fg-material-inward')}
                  startIcon={<AddIcon />}
                  size="medium"
                  sx={{
                    background: 'linear-gradient(45deg, #4caf50, #81c784)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #388e3c, #4caf50)',
                    },
                    whiteSpace: 'nowrap'
                  }}
                >
                  Material Inward
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/inventory/stock-sheet/fg-material-outward')}
                  startIcon={<RemoveIcon />}
                  size="medium"
                  sx={{
                    background: 'linear-gradient(45deg, #f44336, #ef5350)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #d32f2f, #f44336)',
                    },
                    whiteSpace: 'nowrap'
                  }}
                >
                  Material Outward
                </Button>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 0 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <StockIcon color="primary" />
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                Product Stock Items
              </Typography>
              {sortedItems.length > 0 && (
                <Chip 
                  label={`${sortedItems.length} products`} 
                  color="primary" 
                  size="small" 
                />
              )}
            </Stack>
          </Box>

          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 200,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      {[
                        { id: "Product Code", label: "Product Details" },
                        { id: "Client Code", label: "Client Code" },
                        { id: "Current Stock", label: "Stock Levels" },
                        { id: "Location", label: "Location & Unit" },
                        { id: "Last Updated", label: "Last Updated" },
                        { id: "Status", label: "Status" },
                        { id: "actions", label: "Actions" },
                      ].map((col) => (
                        <TableCell
                          key={col.id}
                          sx={{ 
                            fontWeight: 'bold', 
                            textTransform: 'uppercase',
                            bgcolor: 'primary.main',
                            color: 'white',
                            fontSize: '0.75rem'
                          }}
                          sortDirection={orderBy === col.id ? order : false}
                        >
                          {col.id !== "actions" && col.id !== "Product Code" && col.id !== "itemCode" && col.id !== "Current Stock" && col.id !== "Location" && col.id !== "Client Code" ? (
                            <TableSortLabel
                              active={orderBy === col.id}
                              direction={orderBy === col.id ? order : "asc"}
                              onClick={() => handleRequestSort(col.id)}
                              sx={{ color: 'white !important' }}
                            >
                              {col.label}
                            </TableSortLabel>
                          ) : (
                            col.label
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedItems.length > 0 ? (
                      paginatedItems.map((item, index) => {
                        const stockStatus = getStockStatus(item);
                        return (
                          <TableRow 
                            key={index}
                            sx={{ 
                              '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                              '&:hover': { bgcolor: 'action.selected' },
                              transition: 'background-color 0.2s'
                            }}
                          >
                            <TableCell>
                              <Stack alignItems="flex-start" spacing={0.5}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {item["Product Name"]}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Code: {item["Product Code"]}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Category: {item.Category}
                                </Typography>
                              </Stack>
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {item["Client Code"] || 'N/A'}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Stack alignItems="flex-start" spacing={0.5}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                  {item["Current Stock"]} {item.Unit}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Min: {item["Min Level"]} | Max: {item["Max Level"]}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Reorder: {item["Reorder Point"]}
                                </Typography>
                              </Stack>
                            </TableCell>
                            
                            <TableCell>
                              <Stack alignItems="flex-start" spacing={0.5}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {item.Location || 'N/A'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Unit: {item.Unit || 'N/A'}
                                </Typography>
                              </Stack>
                            </TableCell>
                            
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {item["Last Updated"]}
                              </Typography>
                            </TableCell>
                            
                            <TableCell>
                              <Chip
                                label={stockStatus.label}
                                color={stockStatus.color}
                                size="small"
                                icon={stockStatus.icon}
                              />
                            </TableCell>
                            
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <Tooltip title="View Details">
                                  <IconButton
                                    size="small"
                                    color="secondary"
                                    onClick={() => handleViewDetails(item)}
                                  >
                                    <ViewIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="View BOM">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleBOMNavigation(item)}
                                    sx={{ 
                                      color: 'success.main',
                                      '&:hover': { 
                                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                        transform: 'scale(1.1)',
                                        transition: 'all 0.2s ease'
                                      }
                                    }}
                                  >
                                    <AssignmentIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit Product">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleEdit(item)}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="FG Material Inward">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      // Store item data in sessionStorage for pre-selection
                                      sessionStorage.setItem('selectedFGItemForInward', JSON.stringify({
                                        itemCode: item["Product Code"],
                                        itemName: item["Product Name"],
                                        category: item["Category"],
                                        unit: item["Unit"],
                                        location: item["Location"]
                                      }));
                                      navigate('/inventory/stock-sheet/fg-material-inward');
                                    }}
                                    sx={{ 
                                      color: '#4caf50',
                                      '&:hover': { 
                                        backgroundColor: 'rgba(76, 175, 80, 0.1)' 
                                      }
                                    }}
                                  >
                                    <AddIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="FG Material Outward">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      // Store item data in sessionStorage for pre-selection
                                      sessionStorage.setItem('selectedFGItemForOutward', JSON.stringify({
                                        itemCode: item["Product Code"],
                                        itemName: item["Product Name"],
                                        category: item["Category"],
                                        unit: item["Unit"],
                                        location: item["Location"]
                                      }));
                                      navigate('/inventory/stock-sheet/fg-material-outward');
                                    }}
                                    sx={{ 
                                      color: '#f44336',
                                      '&:hover': { 
                                        backgroundColor: 'rgba(244, 67, 54, 0.1)' 
                                      }
                                    }}
                                  >
                                    <RemoveIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Product">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDelete(index)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                          <Stack alignItems="center" spacing={2}>
                            <StockIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                            <Typography variant="h6" color="text.secondary">
                              No stock items found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {search ? 
                                `No products match "${search}". Try a different search term.` :
                                "Create your first product stock item to get started"
                              }
                            </Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={sortedItems.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 20, 50, 100]}
                sx={{ borderTop: 1, borderColor: 'divider' }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            border: 'none'
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(4px)'
          }
        }}
      >
        <DialogTitle sx={{ p: 0, textAlign: 'center', pt: 4, pb: 2, position: 'relative' }}>
          <IconButton
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#1976d2',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center',
              lineHeight: 1.2
            }}
          >
            {selectedItem ? "Edit Product" : "Add New Product"}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              textAlign: 'center',
              mt: 1
            }}
          >
            {selectedItem ? "Update existing product entry" : "Create new product entry"}
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ px: 4, py: 2, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto', position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {availableProducts.length > 0 ? (
              <Alert severity="info" icon={<ProductIcon />}>
                <Typography variant="body2">
                  <strong>Product Selection from Clients Sheet</strong>
                  <br />
                  Select a product code from the dropdown. Product name and category will be automatically filled.
                  <br />
                  <strong>Multi-Item Selection:</strong> Select multiple items from the Stock sheet to associate with this product.
                  <br />
                  <strong>Unique Items:</strong> Each item can only be used in one product. Used items appear at the bottom.
                  <br />
                  <strong>No Duplicates:</strong> Cannot select the same item multiple times. Selected items appear at the end.
                  ({availableProducts.length} products available)
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning" icon={<WarningIcon />}>
                <Typography variant="body2">
                  <strong>No Products Available</strong>
                  <br />
                  No products found in the Clients sheet. Please add products to the CLIENT sheet first.
                </Typography>
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <Autocomplete
                  freeSolo
                  options={availableProducts.map(product => product.productCode).filter(Boolean)}
                  value={formData["Product Code"]}
                  onInputChange={(event, newValue) => {
                    if (newValue !== null) {
                      handleProductCodeChange({ target: { value: newValue } });
                    }
                  }}
                  disabled={!!selectedItem}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      label="Product Code *"
                      name="Product Code"
                      required
                      variant="standard"
                      helperText="Select or enter product code (will auto-fill name and category if found in Clients sheet)"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <ProductIcon color="action" sx={{ mr: 1 }} />
                      }}
                      sx={{
                        '& .MuiInput-underline:before': {
                          borderBottomColor: '#e0e0e0'
                        },
                        '& .MuiInput-underline:after': {
                          borderBottomColor: '#1976d2'
                        },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                          borderBottomColor: '#1976d2'
                        },
                        '& .MuiFormLabel-root': {
                          fontSize: '14px',
                          color: '#666',
                          '&.Mui-focused': {
                            color: '#1976d2'
                          }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '16px',
                          padding: '8px 0'
                        }
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const product = availableProducts.find(p => p.productCode === option);
                    return (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {option}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {product?.productName || 'No name'} - {product?.category || 'No category'}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  fullWidth
                  label="Product Name *"
                  name="Product Name"
                  value={formData["Product Name"]}
                  onChange={handleInputChange}
                  required
                  disabled
                  variant="standard"
                  InputProps={{
                    startAdornment: <AssignmentIcon color="action" sx={{ mr: 1 }} />
                  }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#1976d2'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#1976d2'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#1976d2'
                      }
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  fullWidth
                  label="Category"
                  name="Category"
                  value={formData["Category"]}
                  onChange={handleInputChange}
                  variant="standard"
                  InputProps={{
                    startAdornment: <CategoryIcon color="action" sx={{ mr: 1 }} />
                  }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#1976d2'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#1976d2'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#1976d2'
                      }
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  fullWidth
                  label="Current Stock"
                  name="Current Stock"
                  type="number"
                  value={formData["Current Stock"]}
                  onChange={handleInputChange}
                  variant="standard"
                  InputProps={{
                    startAdornment: <TrendingUpIcon color="action" sx={{ mr: 1 }} />
                  }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#1976d2'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#1976d2'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#1976d2'
                      }
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
                <TextField
                  fullWidth
                  label="Min Level"
                  name="Min Level"
                  type="number"
                  value={formData["Min Level"]}
                  onChange={handleInputChange}
                  variant="standard"
                  InputProps={{
                    startAdornment: <WarningIcon color="action" sx={{ mr: 1 }} />
                  }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#1976d2'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#1976d2'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#1976d2'
                      }
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
                <TextField
                  fullWidth
                  label="Max Level"
                  name="Max Level"
                  type="number"
                  value={formData["Max Level"]}
                  onChange={handleInputChange}
                  variant="standard"
                  InputProps={{
                    startAdornment: <CheckIcon color="action" sx={{ mr: 1 }} />
                  }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#1976d2'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#1976d2'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#1976d2'
                      }
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
                <TextField
                  fullWidth
                  label="Reorder Point"
                  name="Reorder Point"
                  type="number"
                  value={formData["Reorder Point"]}
                  onChange={handleInputChange}
                  variant="standard"
                  InputProps={{
                    startAdornment: <WarningIcon color="action" sx={{ mr: 1 }} />
                  }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#1976d2'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#1976d2'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#1976d2'
                      }
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  fullWidth
                  label="Unit"
                  name="Unit"
                  value={formData["Unit"]}
                  onChange={handleInputChange}
                  variant="standard"
                  InputProps={{
                    startAdornment: <ScaleIcon color="action" sx={{ mr: 1 }} />
                  }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#1976d2'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#1976d2'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#1976d2'
                      }
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  fullWidth
                  label="Location"
                  name="Location"
                  value={formData["Location"]}
                  onChange={handleInputChange}
                  variant="standard"
                  InputProps={{
                    startAdornment: <LocationIcon color="action" sx={{ mr: 1 }} />
                  }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#1976d2'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#1976d2'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#1976d2'
                      }
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 4, pt: 2, justifyContent: 'center' }}>
          <Button 
            onClick={handleCloseDialog}
            startIcon={<CancelIcon />}
            variant="outlined"
            sx={{
              borderRadius: 3,
              border: '1px solid #e0e0e0',
              backgroundColor: 'transparent',
              color: '#666',
              px: 3,
              py: 1.5,
              minWidth: '120px',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderColor: '#1976d2'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            startIcon={selectedItem ? <SaveIcon /> : <AddIcon />}
            sx={{ 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
              color: 'white',
              px: 3,
              py: 1.5,
              minWidth: '180px',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0d47a1, #1976d2)',
                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)',
                boxShadow: 'none'
              }
            }}
          >
            {selectedItem ? "Update Product" : "Add Product"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog
        open={openViewDetailsDialog}
        onClose={() => setOpenViewDetailsDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, bgcolor: 'primary.main', color: 'white' }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
              <ViewIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
                FG Stock Item Details
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {selectedItemDetails ? `${selectedItemDetails["Product Name"]} (${selectedItemDetails["Product Code"]})` : 'Product Details'}
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              startIcon={<PrintIcon />}
              onClick={() => generateFGStockItemPDF(selectedItemDetails)}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Download PDF
            </Button>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {selectedItemDetails && (
            <Box>
              {/* Company Header */}
              <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                  REYANSH INTERNATIONAL PVT. LTD
                </Typography>
                <Typography variant="subtitle2">
                  FG Stock Item Details Report
                </Typography>
                <Typography variant="caption">
                  Generated on: {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  }).replace(/\//g, '/')}
                </Typography>
              </Box>

              {/* Table View */}
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ 
                        fontWeight: 'bold', 
                        textTransform: 'uppercase',
                        bgcolor: 'primary.main',
                        color: 'white',
                        fontSize: '0.75rem',
                        border: 'none'
                      }}>
                        Product Details
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 'bold', 
                        textTransform: 'uppercase',
                        bgcolor: 'primary.main',
                        color: 'white',
                        fontSize: '0.75rem',
                        border: 'none'
                      }}>
                        Stock Levels
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 'bold', 
                        textTransform: 'uppercase',
                        bgcolor: 'primary.main',
                        color: 'white',
                        fontSize: '0.75rem',
                        border: 'none'
                      }}>
                        Location & Unit
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 'bold', 
                        textTransform: 'uppercase',
                        bgcolor: 'primary.main',
                        color: 'white',
                        fontSize: '0.75rem',
                        border: 'none'
                      }}>
                        Last Updated
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 'bold', 
                        textTransform: 'uppercase',
                        bgcolor: 'primary.main',
                        color: 'white',
                        fontSize: '0.75rem',
                        border: 'none'
                      }}>
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow sx={{ '&:hover': { bgcolor: 'action.selected' } }}>
                      {/* Product Details */}
                      <TableCell>
                        <Stack alignItems="flex-start" spacing={0.5}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {selectedItemDetails["Product Name"] || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Code: {selectedItemDetails["Product Code"] || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Category: {selectedItemDetails.Category || 'N/A'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      
                      {/* Stock Levels */}
                      <TableCell>
                        <Stack alignItems="flex-start" spacing={0.5}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {selectedItemDetails["Current Stock"] || '0'} {selectedItemDetails.Unit || ''}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Min: {selectedItemDetails["Min Level"] || 'N/A'} | Max: {selectedItemDetails["Max Level"] || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Reorder: {selectedItemDetails["Reorder Point"] || 'N/A'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      
                      {/* Location & Unit */}
                      <TableCell>
                        <Stack alignItems="flex-start" spacing={0.5}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {selectedItemDetails.Location || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Unit: {selectedItemDetails.Unit || 'N/A'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      
                      {/* Last Updated */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {selectedItemDetails["Last Updated"] || 'N/A'}
                        </Typography>
                      </TableCell>
                      
                      {/* Status */}
                      <TableCell>
                        <Chip 
                          label={getStockStatus(selectedItemDetails).label} 
                          color={getStockStatus(selectedItemDetails).color} 
                          size="small" 
                          icon={getStockStatus(selectedItemDetails).icon}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3, bgcolor: 'grey.50' }}>
          <Button 
            onClick={() => setOpenViewDetailsDialog(false)}
            variant="outlined"
            startIcon={<CloseIcon />}
            sx={{ minWidth: 120 }}
          >
            Close
          </Button>
          <Button 
            onClick={() => generateFGStockItemPDF(selectedItemDetails)}
            variant="contained"
            startIcon={<PrintIcon />}
            sx={{ 
              bgcolor: 'success.main', 
              '&:hover': { bgcolor: 'success.dark' },
              minWidth: 140
            }}
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FGStockSheet; 