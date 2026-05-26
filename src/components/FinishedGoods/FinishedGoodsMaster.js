import React, { useState, useEffect } from "react";
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Card,
  CardContent,
  CardActions,
  Stack,
  Container,
  Avatar,
  Badge,
  Fab,
  Zoom,
  LinearProgress,
  Divider,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
  Factory as ProductionIcon,
  Storage as StockIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Category as CategoryIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as ViewIcon,
  Launch as LaunchIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import sheetService from "../../services/sheetService";
import { getAllClients, getAllProductsFromClients } from "../../services/clientService";
import { useNavigate } from "react-router-dom";

const FinishedGoodsMaster = () => {
  // Theme and responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  // State management
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductHistory, setSelectedProductHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Products integration state - products from Clients sheet
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const initialFormState = {
    productCode: "",
    productName: "",
    description: "",
  };
  const [formData, setFormData] = useState(initialFormState);

  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("productCode");

  // Load available products from the Clients sheet
  const loadAvailableProducts = async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (forceRefresh) {
        setRefreshing(true);
      }
      // Get all products from all clients
      const products = await getAllProductsFromClients(forceRefresh);
      // Debug: Log first few products to see structure
      if (products.length > 0) {
      } else {
        // Let's also check raw clients data
        const clients = await getAllClients(forceRefresh);
        
      }
      
      setAvailableProducts(products);
      
      setSnackbar({
        open: true,
        message: forceRefresh 
          ? `Refreshed ${products.length} products from Clients sheet` 
          : `Loaded ${products.length} products from Clients sheet`,
        severity: products.length > 0 ? "success" : "warning",
      });
    } catch (error) {
      console.error('Error loading products from Clients sheet:', error);
      setSnackbar({
        open: true,
        message: "Failed to load products from Clients sheet. " + error.message,
        severity: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh products from Clients sheet
  const handleRefreshProducts = async () => {
    await loadAvailableProducts(true);
  };

  // Filter products based on search term
  const filteredAvailableProducts = availableProducts.filter(product =>
    product.productName?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.productCode?.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const navigate = useNavigate();

  // Load products when component mounts
  useEffect(() => {
    loadAvailableProducts();
  }, []);

  // Handle product selection from the Clients sheet
  const handleProductSelect = (product) => {
    if (product) {
      setFormData({
        productCode: product.productCode,
        productName: product.productName,
        description: product.description || "",
      });
      setSelectedProduct(product);
      setShowProductSelector(false);
      setProductSearchTerm("");
    }
  };

  // Handle product code change - auto-fill product name
  const handleProductCodeChange = (event, newValue) => {
    if (newValue && typeof newValue === 'object') {
      // Product selected from dropdown
      handleProductSelect(newValue);
    } else if (typeof newValue === 'string') {
      // Manual input - try to find matching product
      const matchedProduct = availableProducts.find(
        p => p.productCode.toLowerCase() === newValue.toLowerCase()
      );
      
      if (matchedProduct) {
        handleProductSelect(matchedProduct);
      } else {
        // Manual entry without match
        setFormData(prev => ({ 
          ...prev, 
          productCode: newValue,
          productName: '', // Clear name if no match
        }));
        setSelectedProduct(null);
      }
    }
  };

  // Handle creating new product (redirect to products page)
  const handleCreateNewProduct = () => {
    navigate('/products');
  };

  // Helper functions for UI
  const getProductStatusColor = (product) => {
    // You can add logic here based on product properties
    return 'success'; // Default to success for now
  };

  const getProductStatusIcon = (product) => {
    return <CheckIcon color="success" />;
  };

  const getProductStatusChip = (product) => {
    return <Chip label="Active" color="success" size="small" />;
  };

  const getRecentActivity = () => {
    // Mock recent activity data
    return finishedGoods.slice(0, 3);
  };

  useEffect(() => {
    fetchFinishedGoods();
  }, []);

  const fetchFinishedGoods = async () => {
    try {
      setLoading(true);
      const data = await sheetService.getSheetData("Finished Goods");
      setFinishedGoods(data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error fetching finished goods",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Check if productCode already exists
      const existingIndex = finishedGoods.findIndex(
        (item) => item.productCode === formData.productCode
      );
      
      if (existingIndex !== -1) {
        // Update existing row
        await sheetService.updateRow("Finished Goods", existingIndex + 2, {
          ...formData,
          lastUpdated: new Date().toISOString().split("T")[0],
        });
        
        // Update local state
        const updatedGoods = [...finishedGoods];
        updatedGoods[existingIndex] = {
          ...formData,
          lastUpdated: new Date().toISOString().split("T")[0],
        };
        setFinishedGoods(updatedGoods);
        
        setSnackbar({
          open: true,
          message: "Finished good updated successfully",
          severity: "success",
        });
      } else {
        // Add new row
        const newItem = {
          ...formData,
          lastUpdated: new Date().toISOString().split("T")[0],
        };
        await sheetService.appendRow("Finished Goods", newItem);
        setFinishedGoods([...finishedGoods, newItem]);
        
        setSnackbar({
          open: true,
          message: "Finished good added successfully",
          severity: "success",
        });
      }
      
      setFormData(initialFormState);
      setOpenDialog(false);
    } catch (error) {
      console.error("Error saving finished good:", error);
      setSnackbar({
        open: true,
        message: "Error saving finished good: " + error.message,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      productCode: product.productCode || "",
      productName: product.productName || "",
      description: product.description || "",
    });
    setOpenDialog(true);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to delete ${product.productName}?`)) {
      return;
    }

    try {
      setLoading(true);
      const rowIndex = finishedGoods.findIndex(
        (fg) => fg.productCode === product.productCode
      );
      if (rowIndex !== -1) {
        await sheetService.deleteRow("Finished Goods", rowIndex + 2);
        setSnackbar({
          open: true,
          message: "Finished goods deleted successfully",
          severity: "success",
        });
        fetchFinishedGoods();
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error deleting entry",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = (product) => {
    // In a real application, this would fetch the product's history from the backend
    const mockHistory = [
      {
        date: new Date(),
        type: "Production",
        quantity: 100,
        reference: "KIT-001",
        remarks: "Initial production",
      },
      {
        date: new Date(),
        type: "Sales",
        quantity: -20,
        reference: "SO-001",
        remarks: "Customer order",
      },
      {
        date: new Date(Date.now() - 86400000),
        type: "Production",
        quantity: 50,
        reference: "KIT-002",
        remarks: "Additional batch",
      },
    ];
    setSelectedProductHistory(mockHistory);
    setSelectedProduct(product);
    setOpenHistoryDialog(true);
  };

  const handleOpenDialog = () => {
    setFormData(initialFormState);
    setSelectedProduct(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData(initialFormState);
    setSelectedProduct(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "success";
      case "Inactive":
        return "error";
      case "Low Stock":
        return "warning";
      default:
        return "default";
    }
  };

  const filteredProducts = finishedGoods.filter((item) =>
    search === "" ||
    String(item.productCode).toLowerCase().includes(search.toLowerCase()) ||
    String(item.productName).toLowerCase().includes(search.toLowerCase())
  );

  const sortedItems = [...filteredProducts].sort((a, b) => {
    if (order === "asc") {
      return a[orderBy] > b[orderBy] ? 1 : -1;
    } else {
      return a[orderBy] < b[orderBy] ? 1 : -1;
    }
  });

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 56, height: 56 }}>
          <CategoryIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #9c27b0, #e1bee7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Finished Goods Master
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Product Catalog Management System
          </Typography>
        </Box>
        {loading && (
          <CircularProgress 
            size={24} 
            sx={{ ml: 'auto' }} 
            color="secondary"
          />
        )}
      </Stack>

      {/* Controls Card */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <ProductionIcon color="secondary" />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
              Product Management
            </Typography>
          </Stack>
          
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Search Products"
                variant="outlined"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                }}
                placeholder="Search by Product Code or Name..."
              />
            </Grid>
            
            <Grid item xs={12} md={7}>
              <Stack direction={isMobile ? "column" : "row"} spacing={2} sx={{ width: '100%' }}>
                <Button
                  variant="contained"
                  onClick={handleOpenDialog}
                  startIcon={<AddIcon />}
                  size="large"
                  sx={{ 
                    background: 'linear-gradient(45deg, #9c27b0, #e1bee7)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #7b1fa2, #9c27b0)',
                    }
                  }}
                >
                  Add New Product
                </Button>
                
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => navigate("/inventory", { state: { tab: 3 } })}
                  startIcon={<LaunchIcon />}
                >
                  FG Inventory
                </Button>

                <Button
                  variant="outlined"
                  color="info"
                  startIcon={<AnalyticsIcon />}
                  disabled={finishedGoods.length === 0}
                >
                  Analytics
                </Button>

                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={refreshing ? <CircularProgress size={16} /> : <SearchIcon />}
                  onClick={handleRefreshProducts}
                  disabled={refreshing}
                  title="Refresh products from Clients sheet"
                >
                  {refreshing ? "Refreshing..." : "Refresh Products"}
                </Button>

                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<WarningIcon />}
                  onClick={async () => {
                    try {
                      // Test both methods
                      const clients = await getAllClients(true);
                      
                      const products = await getAllProductsFromClients(true);
                      setSnackbar({
                        open: true,
                        message: `Debug: ${clients.length} clients, ${products.length} products from clients. Check console.`,
                        severity: "info",
                      });
                    } catch (error) {
                      console.error('Debug error:', error);
                      setSnackbar({
                        open: true,
                        message: "Debug failed: " + error.message,
                        severity: "error",
                      });
                    }
                  }}
                  title="Debug: Check console for detailed logs"
                >
                  Debug
                </Button>
              </Stack>
            </Grid>
          </Grid>

          {/* Summary Cards */}
          {finishedGoods.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Badge badgeContent={finishedGoods.length} color="secondary">
                        <CategoryIcon color="secondary" />
                      </Badge>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Total Products
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {finishedGoods.length}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Badge badgeContent={finishedGoods.length} color="success">
                        <CheckIcon color="success" />
                      </Badge>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Active Products
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {finishedGoods.length}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <TrendingUpIcon color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Recent Activity
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {getRecentActivity().length}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <ScheduleIcon color="warning" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Last Updated
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          Today
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 0 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <InventoryIcon color="secondary" />
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                Product Catalog
              </Typography>
              {sortedItems.length > 0 && (
                <Chip 
                  label={`${sortedItems.length} products`} 
                  color="secondary" 
                  size="small" 
                />
              )}
            </Stack>
          </Box>

          <TableContainer sx={{ mt: 2 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase',
                    bgcolor: 'secondary.main',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    Product Details
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase',
                    bgcolor: 'secondary.main',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    Description
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase',
                    bgcolor: 'secondary.main',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase',
                    bgcolor: 'secondary.main',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    Last Updated
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase',
                    bgcolor: 'secondary.main',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedItems.length > 0 ? (
                  sortedItems.map((fg, index) => (
                    <TableRow 
                      key={index}
                      sx={{ 
                        '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                        '&:hover': { bgcolor: 'action.selected' },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {fg.productName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Code: {fg.productCode}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 300 }}>
                          {fg.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {getProductStatusIcon(fg)}
                          {getProductStatusChip(fg)}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {fg.lastUpdated || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit Product">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(fg)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View History">
                            <IconButton
                              size="small"
                              onClick={() => handleViewHistory(fg)}
                              color="info"
                            >
                              <HistoryIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Product">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(fg)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Stack alignItems="center" spacing={2}>
                        <CategoryIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                        <Typography variant="h6" color="text.secondary">
                          No products found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {search ? 
                            `No products match "${search}". Try a different search term.` :
                            "Create your first finished good to get started"
                          }
                        </Typography>
                        {!search && (
                          <Button
                            variant="contained"
                            onClick={handleOpenDialog}
                            startIcon={<AddIcon />}
                            sx={{ mt: 2 }}
                          >
                            Create First Product
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Floating Action Button */}
      {finishedGoods.length > 0 && (
        <Zoom in={true}>
          <Fab
            color="secondary"
            aria-label="add new product"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000,
            }}
            onClick={handleOpenDialog}
          >
            <AddIcon />
          </Fab>
        </Zoom>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: selectedProduct ? 'warning.main' : 'secondary.main' }}>
              {selectedProduct ? <EditIcon /> : <AddIcon />}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {selectedProduct ? "Edit Product" : "Add New Product"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedProduct ? "Update existing finished good" : "Create new finished good entry"}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          <form id="fg-form" onSubmit={handleSubmit}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                {availableProducts.length > 0 ? (
                  <Alert severity="info" icon={<InventoryIcon />}>
                    <Typography variant="body2">
                      <strong>Product Selection from Clients Sheet</strong>
                      <br />
                      Select a product code from the dropdown. The product name will be automatically filled.
                      ({availableProducts.length} products available)
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="warning" icon={<WarningIcon />}>
                    <Typography variant="body2">
                      <strong>No Products Available</strong>
                      <br />
                      No products found in the Clients sheet. Please:
                      <br />
                      • Add products to the CLIENT sheet in the "Products" column
                      <br />
                      • Click "Refresh Products" to reload data
                      <br />
                      • Check that the Products column contains valid JSON data
                    </Typography>
                  </Alert>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={availableProducts}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return option.productCode || '';
                  }}
                  value={availableProducts.find(p => p.productCode === formData.productCode) || null}
                  onChange={handleProductCodeChange}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.productCode}>
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#9c27b0' }}>
                          {option.productCode}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {option.productName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Client: {option.clientName} ({option.clientCode})
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      label="Product Code *"
                      name="productCode"
                      required
                      placeholder="Select product code from dropdown..."
                      helperText="Select from Clients sheet products"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <AssignmentIcon color="secondary" sx={{ mr: 1 }} />
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                  disabled={loading || refreshing}
                  noOptionsText={
                    availableProducts.length === 0 
                      ? "No products available. Please add products to Clients sheet."
                      : "No matching products"
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Product Name *"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  required
                  disabled={!!selectedProduct} // Auto-filled when product is selected from dropdown
                  helperText={selectedProduct ? "Auto-filled from Clients sheet" : "Will be auto-filled when product code is selected"}
                  InputProps={{
                    startAdornment: <CategoryIcon color="secondary" sx={{ mr: 1 }} />
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  placeholder="Enter detailed product description..."
                  helperText="Optional: Add additional details about this finished good"
                />
              </Grid>

              {selectedProduct && (
                <Grid item xs={12}>
                  <Alert severity="success" icon={<CheckIcon />}>
                    <Typography variant="body2">
                      <strong>Product Selected:</strong> {selectedProduct.productName} ({selectedProduct.productCode})
                      <br />
                      <strong>From Client:</strong> {selectedProduct.clientName} ({selectedProduct.clientCode})
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </form>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseDialog}
            color="secondary"
            variant="outlined"
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="fg-form"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
            sx={{ 
              background: 'linear-gradient(45deg, #9c27b0, #e1bee7)',
              '&:hover': {
                background: 'linear-gradient(45deg, #7b1fa2, #9c27b0)',
              }
            }}
          >
            {selectedProduct ? "Update Product" : loading ? "Saving..." : "Create Product"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={openHistoryDialog}
        onClose={() => setOpenHistoryDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'info.main' }}>
              <HistoryIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Stock Movement History
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedProduct ? `${selectedProduct.productName} (${selectedProduct.productCode})` : 'Product History'}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          <TableContainer sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Reference</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedProductHistory.length > 0 ? (
                  selectedProductHistory.map((history, index) => (
                    <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      <TableCell>
                        <Typography variant="body2">
                          {history.date.toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={history.type}
                          color={history.type === "Production" ? "success" : "error"}
                          size="small"
                          icon={history.type === "Production" ? <ProductionIcon /> : <TrendingUpIcon />}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 'bold',
                            color: history.quantity > 0 ? 'success.main' : 'error.main'
                          }}
                        >
                          {history.quantity > 0 ? '+' : ''}{history.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {history.reference}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {history.remarks}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Stack alignItems="center" spacing={2}>
                        <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                        <Typography variant="body1" color="text.secondary">
                          No history available
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpenHistoryDialog(false)}
            variant="outlined"
            startIcon={<CancelIcon />}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FinishedGoodsMaster;
