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
  TablePagination,
  TableSortLabel,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Factory as ProductIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  Today as TodayIcon,
  Person as PersonIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import Autocomplete from "@mui/material/Autocomplete";
import sheetService from "../../services/sheetService";
import { getAllProductsFromClients, getAllClients, updateClient } from "../../services/clientService";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const updateFGStockLevels = async (productCode, quantity, operation) => {
  try {
    // Get all clients to find the product
    const clients = await getAllClients();
    let clientFound = false;
    
    for (const client of clients) {

      if (client.products && Array.isArray(client.products)) {
        const productIndex = client.products.findIndex(
          p => p.productCode && p.productCode.toUpperCase() === productCode.toUpperCase()
        );
        if (productIndex !== -1) {
          // Update the product's stock information
          const currentStock = parseFloat(client.products[productIndex].currentStock || 0);
          const qty = parseFloat(quantity) || 0;
          const newStock = operation === "inward"
            ? (currentStock + qty).toString()
            : (currentStock - qty).toString();
          client.products[productIndex] = {
            ...client.products[productIndex],
            currentStock: newStock,
            lastUpdated: new Date().toISOString().split("T")[0]
          };
          // Update the client in the sheet
          await updateClient(client, client.clientCode);
          clientFound = true;
          break;
        }
      } else {
      }
    }
    
    if (!clientFound) {
      console.error(`❌ Product ${productCode} not found in any client`);
      throw new Error(`Product ${productCode} not found in any client. Please add the product to a client first.`);
    }
  } catch (error) {
    console.error("❌ Error updating FG Stock in Clients sheet:", error);
    throw error;
  }
};

const FGMaterialInward = () => {
  // Theme and responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  // State management
  const [entries, setEntries] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState("Date");
  const [order, setOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [availableProducts, setAvailableProducts] = useState([]);

  const [formData, setFormData] = useState({
    Date: new Date().toISOString().split("T")[0],
    "Product Code": "",
    "Product Name": "",
    Quantity: "",
    Status: "Pending",
  });

  // Helper functions for UI
  const getTotalEntries = () => entries.length;

  const getCompletedEntries = () => 
    entries.filter(entry => entry.Status === "Completed").length;

  const getPendingEntries = () => 
    entries.filter(entry => entry.Status === "Pending").length;

  const getTotalQuantity = () => 
    entries.reduce((total, entry) => total + parseFloat(entry.Quantity || 0), 0);

  const getRecentEntries = () => 
    entries
      .sort((a, b) => new Date(b.Date) - new Date(a.Date))
      .slice(0, 5);

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "success";
      case "Pending":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <CheckIcon color="success" />;
      case "Pending":
        return <PendingIcon color="warning" />;
      default:
        return <InventoryIcon color="action" />;
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchAvailableProducts();
    
    // Check for pre-selected item from FG Stock Sheet
    const selectedItem = sessionStorage.getItem('selectedFGItemForInward');
    if (selectedItem) {
      try {
        const itemData = JSON.parse(selectedItem);
        setFormData(prev => ({
          ...prev,
          "Product Code": itemData.itemCode || '',
          "Product Name": itemData.itemName || '',
          // Keep quantity empty for user to fill
          "Quantity": '',
          // Auto-open the dialog
        }));
        // Auto-open the dialog
        setOpenDialog(true);
        // Clear the sessionStorage after use
        sessionStorage.removeItem('selectedFGItemForInward');
      } catch (error) {
        console.error('Error parsing selected FG item data:', error);
      }
    }
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const data = await sheetService.getSheetData("FG Material Inward");
      setEntries(data);
    } catch (error) {
      showSnackbar("Error fetching product material inward entries", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableProducts = async () => {
    try {
      const products = await getAllProductsFromClients();
      // Transform products to match the expected format for dropdown
      const transformedProducts = products.map(product => ({
        "Product Code": product.productCode,
        "Product Name": product.productName,
        "Category": product.category,
        "Current Stock": product.currentStock || '',
        "Unit": product.unit || '',
        "Location": product.location || '',
        "Status": product.status || 'Active',
        "Client Code": product.clientCode,
        "Client Name": product.clientName
      }));
      setAvailableProducts(transformedProducts);
    } catch (error) {
      console.error("Error fetching products from Clients sheet:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProductCodeChange = (event, newValue) => {
    if (newValue && typeof newValue === 'object') {
      // Product selected from Clients sheet dropdown
      setFormData((prev) => ({
        ...prev,
        "Product Code": newValue["Product Code"] || "",
        "Product Name": newValue["Product Name"] || "",
      }));
    } else if (typeof newValue === 'string') {
      // Manual input - try to find matching product
      const matchedProduct = availableProducts.find(
        p => p["Product Code"] && p["Product Code"].toLowerCase() === newValue.toLowerCase()
      );
      
      if (matchedProduct) {
        setFormData((prev) => ({
          ...prev,
          "Product Code": matchedProduct["Product Code"] || "",
          "Product Name": matchedProduct["Product Name"] || "",
        }));
      } else {
        // Manual entry without match
        setFormData((prev) => ({ 
          ...prev, 
          "Product Code": newValue,
        }));
      }
    } else {
      // Clear selection
      setFormData((prev) => ({
        ...prev,
        "Product Code": "",
        "Product Name": "",
      }));
    }
  };

  const handleDateChange = (date) => {
    const dateString = date ? date.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
    setFormData((prev) => ({
      ...prev,
      Date: dateString,
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData["Product Code"] || !formData["Product Name"]) {
        showSnackbar("Product Code and Product Name are required", "error");
        return;
      }

      if (!formData.Quantity || parseFloat(formData.Quantity) <= 0) {
        showSnackbar("Quantity must be greater than 0", "error");
        return;
      }
      const newEntry = {
        ...formData,
        Date: formData.Date || new Date().toISOString().split("T")[0],
      };
      
      await sheetService.appendRow("FG Material Inward", newEntry);
      
      // Update stock if status is Completed
      if (newEntry.Status === "Completed") {
        await updateFGStockLevels(newEntry["Product Code"], newEntry.Quantity, "inward");
        // Refresh available products to show updated stock levels
        await fetchAvailableProducts();
        showSnackbar(`Entry added and ${newEntry.Quantity} units added to FG Stock successfully!`, "success");
      } else {
        showSnackbar("Entry added successfully (Stock will be updated when marked as Completed)", "info");
      }
      
      setOpenDialog(false);
      fetchEntries();
      resetForm();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      showSnackbar("Error adding entry: " + error.message, "error");
    }
  };

  const handleUpdate = async (rowIndex, entry) => {
    try {
      const originalEntry = entries[rowIndex];
      const isStatusChangingToCompleted =
        originalEntry.Status !== "Completed" && entry.Status === "Completed";
      const updatedEntry = {
        ...entry,
        Date: entry.Date || new Date().toISOString().split("T")[0],
      };
      
      await sheetService.updateRow("FG Material Inward", rowIndex + 2, updatedEntry);
      
      if (isStatusChangingToCompleted) {
        await updateFGStockLevels(entry["Product Code"], entry.Quantity, "inward");
        // Refresh available products to show updated stock levels
        await fetchAvailableProducts();
        showSnackbar(`Entry updated and ${entry.Quantity} units added to FG Stock successfully!`, "success");
      } else {
        showSnackbar("Entry updated successfully", "success");
      }
      
      fetchEntries();
    } catch (error) {
      console.error("Error in handleUpdate:", error);
      showSnackbar("Error updating entry: " + error.message, "error");
    }
  };

  const handleDelete = async (rowIndex) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }
    try {
      await sheetService.deleteRow("FG Material Inward", rowIndex + 2);
      showSnackbar("Entry deleted successfully");
      fetchEntries();
    } catch (error) {
      showSnackbar("Error deleting entry", "error");
    }
  };

  const handleComplete = async (item, rowIndex) => {
    if (!window.confirm('Are you sure you want to mark this entry as complete? This will update the FG Stock levels.')) {
      return;
    }
    try {
      // Find the original index in entries array
      const originalIndex = entries.findIndex(
        (e) => e["Product Code"] === item["Product Code"] && 
               e.Date === item.Date &&
               e.Quantity === item.Quantity
      );
      
      if (originalIndex === -1) {
        showSnackbar("Entry not found in the database", "error");
        return;
      }
      
      const updatedEntry = {
        ...item,
        Status: "Completed",
        Date: item.Date || new Date().toISOString().split("T")[0],
      };
      
      // Update the entry status to Completed
      await sheetService.updateRow("FG Material Inward", originalIndex + 2, updatedEntry);
      
      // Update FG Stock levels
      await updateFGStockLevels(item["Product Code"], item.Quantity, "inward");
      
      // Refresh available products to show updated stock levels
      await fetchAvailableProducts();
      
      showSnackbar(`Entry marked as complete and ${item.Quantity} units added to FG Stock successfully!`, "success");
      fetchEntries();
    } catch (error) {
      console.error("Error in handleComplete:", error);
      showSnackbar("Error completing entry: " + error.message, "error");
    }
  };

  const resetForm = () => {
    setFormData({
      Date: new Date().toISOString().split("T")[0],
      "Product Code": "",
      "Product Name": "",
      Quantity: "",
      Status: "Pending",
    });
    setSelectedItem(null);
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedItems = [...entries]
    .filter((item) =>
      String(item["Product Code"] || "").toLowerCase().includes(search.toLowerCase()) ||
      String(item["Product Name"] || "").toLowerCase().includes(search.toLowerCase())
    )
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

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Avatar sx={{ bgcolor: '#4caf50', width: 56, height: 56 }}>
          <ProductIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
        sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #4caf50, #81c784)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            FG Material Inward
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Finished Goods Inward Material Management
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ ml: 'auto' }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchEntries} sx={{ color: '#4caf50' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {loading && (
            <CircularProgress 
              size={24} 
              sx={{ color: '#4caf50' }}
            />
          )}
        </Stack>
      </Stack>

      {/* Summary Cards */}
      {entries.length > 0 && (
        <Card sx={{ mb: 3, boxShadow: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <AnalyticsIcon sx={{ color: '#4caf50' }} />
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                Inward Summary
              </Typography>
            </Stack>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Badge badgeContent={getTotalEntries()} sx={{ '& .MuiBadge-badge': { bgcolor: '#4caf50' } }}>
                      <AssignmentIcon sx={{ color: '#4caf50' }} />
                    </Badge>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Entries
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {getTotalEntries()}
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
                        Completed
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {getCompletedEntries()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <PendingIcon color="warning" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Pending
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                        {getPendingEntries()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <TrendingUpIcon color="info" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Quantity
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {getTotalQuantity()}
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
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SearchIcon color="action" />
          <TextField
                label="Search entries"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Product Code or Name..."
                sx={{ minWidth: { xs: "100%", sm: "300px" } }}
          />
        </Box>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              size="large"
              sx={{ 
                background: 'linear-gradient(45deg, #4caf50, #81c784)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #388e3c, #4caf50)',
                }
              }}
            >
              Add New Entry
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 0 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <ProductIcon sx={{ color: '#4caf50' }} />
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                Material Inward Entries
              </Typography>
              {sortedItems.length > 0 && (
                <Chip 
                  label={`${sortedItems.length} entries`} 
                  sx={{ bgcolor: '#4caf50', color: 'white' }}
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
                      {["Date", "Product Details", "Quantity", "Status", "Actions"].map((col) => (
                        <TableCell key={col} sx={{ 
                          fontWeight: 'bold', 
                          textTransform: 'uppercase',
                          bgcolor: '#4caf50',
                          color: 'white',
                          fontSize: '0.75rem'
                        }}>
                          {col !== "Actions" && col !== "Product Details" && col !== "Quantity" ? (
                      <TableSortLabel
                        active={orderBy === col}
                        direction={orderBy === col ? order : "asc"}
                        onClick={() => handleRequestSort(col)}
                              sx={{ color: 'white !important' }}
                      >
                        {col}
                      </TableSortLabel>
                    ) : (
                      col
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
                    {paginatedItems.length > 0 ? (
                      paginatedItems.map((item, index) => (
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
                                {new Date(item["Date"]).toLocaleDateString()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(item["Date"]).toLocaleDateString('en-US', { weekday: 'short' })}
                              </Typography>
                            </Stack>
                          </TableCell>
                          
                          <TableCell>
                            <Stack alignItems="flex-start" spacing={0.5}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {item["Product Name"]}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Code: {item["Product Code"]}
                              </Typography>
                            </Stack>
                          </TableCell>
                          
                          <TableCell>
                            <Stack alignItems="flex-start" spacing={0.5}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                                {item["Quantity"]}
                              </Typography>
                            </Stack>
                          </TableCell>
                          
                  <TableCell>
                            <Chip 
                              label={item["Status"]} 
                              color={getStatusColor(item["Status"])} 
                              size="small"
                              icon={getStatusIcon(item["Status"])}
                            />
                  </TableCell>
                          
                  <TableCell>
                            <Stack direction="row" spacing={1}>
                              {item["Status"] !== "Completed" && (
                                <Tooltip title="Mark as Complete">
                                  <IconButton
                                    size="small"
                                    sx={{ color: '#2e7d32' }}
                                    onClick={() => handleComplete(item, index)}
                                  >
                                    <CheckIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Delete Entry">
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
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                          <Stack alignItems="center" spacing={2}>
                            <ProductIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                            <Typography variant="h6" color="text.secondary">
                              No inward entries found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {search ? 
                                `No entries match "${search}". Try a different search term.` :
                                "Create your first inward entry to get started"
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
              color: '#4caf50',
              '&:hover': {
                backgroundColor: 'rgba(76, 175, 80, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center',
              lineHeight: 1.2
            }}
          >
            {selectedItem ? "Edit Entry" : "Add New Entry"}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              textAlign: 'center',
              mt: 1
            }}
          >
            {selectedItem ? "Update existing FG material entry" : "Create new FG material entry"}
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ px: 4, py: 2, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto', position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {availableProducts.length > 0 ? (
              <Alert severity="info" icon={<ProductIcon />}>
                <Typography variant="body2">
                  <strong>Product Selection from Clients Sheet</strong>
                  <br />
                  Select a product code from the dropdown. Product name and unit will be automatically filled.
                  ({availableProducts.length} products available)
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning" icon={<WarningIcon />}>
                <Typography variant="body2">
                  <strong>No Products Available</strong>
                  <br />
                  No products found in the Clients sheet. Please add products to the Clients sheet first.
                </Typography>
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  fullWidth
                  label="Date *"
                  name="Date"
                  type="date"
                  value={formData.Date || new Date().toISOString().split('T')[0]}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                  variant="standard"
                  InputProps={{
                    startAdornment: <TodayIcon color="action" sx={{ mr: 1 }} />
                  }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#4caf50'
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
                <Autocomplete
                  options={availableProducts}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return option["Product Code"] || '';
                  }}
                  value={availableProducts.find(p => p["Product Code"] === formData["Product Code"]) || null}
                  onChange={handleProductCodeChange}
                  disabled={!!selectedItem}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option["Product Code"]}>
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#4caf50' }}>
                          {option["Product Code"]}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {option["Product Name"]}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Stock: {option["Current Stock"]} | Category: {option["Category"]}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      label="Product Code *"
                      name="Product Code"
                      required
                      variant="standard"
                      placeholder="Select product code from dropdown..."
                      helperText="Select from Clients sheet products"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InventoryIcon color="action" sx={{ mr: 1 }} />
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                      sx={{
                        '& .MuiInput-underline:before': {
                          borderBottomColor: '#e0e0e0'
                        },
                        '& .MuiInput-underline:after': {
                          borderBottomColor: '#4caf50'
                        },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                          borderBottomColor: '#4caf50'
                        },
                        '& .MuiFormLabel-root': {
                          fontSize: '14px',
                          color: '#666',
                          '&.Mui-focused': {
                            color: '#4caf50'
                          }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '16px',
                          padding: '8px 0'
                        }
                      }}
                    />
                  )}
                  noOptionsText={
                    availableProducts.length === 0 
                      ? "No products available. Please add products to Clients sheet."
                      : "No matching products"
                  }
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
                  helperText="Auto-filled from Clients sheet"
                  InputProps={{
                    startAdornment: <ProductIcon color="action" sx={{ mr: 1 }} />
                  }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#4caf50'
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
                  label="Quantity *"
                  name="Quantity"
                  type="number"
                  value={formData["Quantity"]}
                  onChange={handleInputChange}
                  required
                  variant="standard"
                  InputProps={{
                    startAdornment: <TrendingUpIcon color="action" sx={{ mr: 1 }} />
                  }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#4caf50'
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
                  select
                  fullWidth
                  label="Status *"
                  name="Status"
                  value={formData["Status"]}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData((prev) => ({ ...prev, Status: value }));
                  }}
                  required
                  variant="standard"
                  SelectProps={{ native: true }}
                  InputProps={{
                    startAdornment: getStatusIcon(formData["Status"])
                  }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#4caf50'
                      }
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                >
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                </TextField>
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
                borderColor: '#4caf50'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedItem) {
                handleUpdate(selectedItem._rowIndex, formData);
              } else {
                handleSubmit();
              }
            }}
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
              color: 'white',
              px: 3,
              py: 1.5,
              minWidth: '180px',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #388e3c, #4caf50)',
                boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)',
                boxShadow: 'none'
              }
            }}
          >
            Add Entry
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FGMaterialInward; 