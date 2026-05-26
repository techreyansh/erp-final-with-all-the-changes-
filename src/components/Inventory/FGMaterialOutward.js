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
  Autocomplete,
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
} from "@mui/material";
import { inventoryValidators, errorHandlers, edgeCaseHandlers } from "../../utils/inventoryValidation";
import { useInventoryErrorHandling } from "../../hooks/useInventoryErrorHandling";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle,
  CallMade as OutwardIcon,
  Factory as ProductIcon,
  LocalShipping as SupplierIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  TrendingDown as TrendingDownIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  Today as TodayIcon,
  Person as PersonIcon,
  Business as DepartmentIcon,
  Schedule as PendingIcon,
  Refresh as RefreshIcon,
  Comment as RemarksIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import sheetService from "../../services/sheetService";
import { getAllProductsFromClients, getAllClients, updateClient } from "../../services/clientService";

const updateFGStockLevels = async (productCode, quantity, operation = "outward") => {
  try {
    const clients = await getAllClients();
    let clientFound = false;
    
    for (const client of clients) {
      if (client.products && Array.isArray(client.products)) {
        const productIndex = client.products.findIndex(
          p => p.productCode && p.productCode.toUpperCase() === productCode.toUpperCase()
        );
        
        if (productIndex !== -1) {
          const currentStock = parseFloat(client.products[productIndex].currentStock || 0);
          const qty = parseFloat(quantity) || 0;
          client.products[productIndex] = {
            ...client.products[productIndex],
            currentStock: operation === "inward"
              ? (currentStock + qty).toString()
              : (currentStock - qty).toString(),
            lastUpdated: new Date().toISOString().split("T")[0]
          };
          await updateClient(client, client.clientCode);
          clientFound = true;
          break;
        }
      }
    }
    
    if (!clientFound) {
      throw new Error(`Product ${productCode} not found in any client. Please add the product to a client first.`);
    }
  } catch (error) {
    console.error("Error updating FG Stock in Clients sheet:", error);
    throw error;
  }
};

const FGMaterialOutward = () => {
  // Theme and responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  // Error handling hook
  const {
    errors,
    warnings,
    loading,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    handleAsyncOperation,
    handleSheetOperation,
    validateFormData,
    getFieldError,
    hasErrors,
    createSnackbarMessage
  } = useInventoryErrorHandling();

  // State management
  const [issueEntries, setIssueEntries] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState("Date");
  const [order, setOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [availableProducts, setAvailableProducts] = useState([]); // Products from Clients sheet
  const [mainStockItems, setMainStockItems] = useState([]);

  const [formData, setFormData] = useState({
    Date: new Date().toISOString().split("T")[0],
    "Product Code": "",
    "Product Name": "",
    Quantity: "",
    Status: "Pending",
    Remarks: "",
  });

  // Helper functions for UI
  const getTotalOutward = () => issueEntries.length;

  const getCompletedOutward = () => 
    issueEntries.filter(entry => entry.Status === "Completed").length;

  const getPendingOutward = () => 
    issueEntries.filter(entry => entry.Status === "Pending").length;

  const getUniqueDepartments = () => {
    const departments = new Set(issueEntries.map(entry => entry.Department).filter(Boolean));
    return departments.size;
  };

  const getTodaysOutward = () => {
    const today = new Date().toDateString();
    return issueEntries.filter(entry => 
      new Date(entry.Date).toDateString() === today
    ).length;
  };

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
        return <CheckCircle color="success" />;
      case "Pending":
        return <PendingIcon color="warning" />;
      default:
        return <InventoryIcon color="action" />;
    }
  };

  useEffect(() => {
    fetchIssueEntries();
    fetchAvailableProducts(); // Fetch from Clients sheet
    fetchMainStockItems();
    
    // Check for pre-selected item from FG Stock Sheet
    const selectedItem = sessionStorage.getItem('selectedFGItemForOutward');
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
        sessionStorage.removeItem('selectedFGItemForOutward');
      } catch (error) {
        console.error('Error parsing selected FG item data:', error);
      }
    }
  }, []);

  // Ensure FG Material Outward sheet exists with proper headers
  const ensureSheetExists = async () => {
    try {
      const sheetExists = await sheetService.doesSheetExist("FG Material Outward");
      if (!sheetExists) {
        const headers = [
          "Date",
          "Product Code", 
          "Product Name",
          "Quantity",
          "Status",
          "Remarks",
          "lastUpdated"
        ];
        await sheetService.createSheetWithHeaders("FG Material Outward", headers);
      }
    } catch (error) {
      console.error("Error ensuring FG Material Outward sheet exists:", error);
    }
  };

  const fetchIssueEntries = async () => {
    const result = await handleSheetOperation(async () => {
      await ensureSheetExists(); // Ensure sheet exists before fetching
      const data = await sheetService.getSheetData("FG Material Outward");
      return edgeCaseHandlers.handleEmptyData(data, []);
    }, "FG Material Outward", "fetch entries");

    if (result.success) {
      setIssueEntries(result.data);
    } else {
      // Error is already handled by the hook
      console.error('Failed to fetch entries:', result.error);
    }
  };

  const fetchAvailableProducts = async () => {
    try {
      const products = await getAllProductsFromClients();
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

  const fetchMainStockItems = async () => {
    try {
      const data = await sheetService.getSheetData("Stock");
      
      setMainStockItems(data);
    } catch (error) {
      console.error("Error fetching main stock items:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
          "Product Name": "", // Clear name if no match
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

  const handleDateChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      Date: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    // Clear previous errors
    clearAllErrors();

    // Validate form data using comprehensive validation
    const isValid = validateFormData(
      inventoryValidators.validateFGMaterialOutward,
      formData,
      availableProducts
    );

    if (!isValid) {
      const snackbarMessage = createSnackbarMessage('error');
      if (snackbarMessage) {
        setSnackbar(snackbarMessage);
      }
      return;
    }

    // Handle the submission with comprehensive error handling
    const result = await handleAsyncOperation(async () => {
      const newEntry = {
        ...formData,
        Date: edgeCaseHandlers.handleDateEdgeCases(formData.Date),
        lastUpdated: new Date().toISOString(),
      };

      if (selectedEntry) {
        // Update existing entry
        const originalEntry = issueEntries[selectedEntry._index];
        const isStatusChangingToCompleted =
          originalEntry.Status !== "Completed" && newEntry.Status === "Completed";
        
        await sheetService.updateRow(
          "FG Material Outward",
          selectedEntry._index + 2,
          newEntry
        );
        
        // Update FG Stock levels only if status changed to completed
        if (isStatusChangingToCompleted) {
          await updateFGStockLevels(newEntry["Product Code"], newEntry.Quantity, "outward");
        }
        
        return { type: 'update', isStatusChangingToCompleted, newEntry };
      } else {
        // Add new entry
        await sheetService.appendRow("FG Material Outward", newEntry);
        
        // Update FG Stock levels for completed entries
        if (newEntry.Status === "Completed") {
          await updateFGStockLevels(newEntry["Product Code"], newEntry.Quantity, "outward");
        }
        
        return { type: 'create', newEntry };
      }
    }, 'FG Material Outward submission');

    if (result.success) {
      const { type, isStatusChangingToCompleted, newEntry } = result.data;
      
      if (type === 'update') {
        if (isStatusChangingToCompleted) {
          setSnackbar({
            open: true,
            message: `Entry updated and ${newEntry.Quantity} units subtracted from FG Stock successfully!`,
            severity: "success",
          });
        } else {
          setSnackbar({
            open: true,
            message: "FG Material Outward entry updated successfully",
            severity: "success",
          });
        }
      } else {
        if (newEntry.Status === "Completed") {
          setSnackbar({
            open: true,
            message: `Entry added and ${newEntry.Quantity} units subtracted from FG Stock successfully!`,
            severity: "success",
          });
        } else {
          setSnackbar({
            open: true,
            message: "Entry added successfully (Stock will be updated when marked as Completed)",
            severity: "info",
          });
        }
      }
      
      fetchIssueEntries();
      handleCloseDialog();
    } else {
      // Error is already handled by the hook and displayed
      console.error('Submission failed:', result.error);
    }
  };

  const handleUpdate = async (rowIndex, entry) => {
    try {
      const currentEntry = sortedItems[rowIndex];
      
      const originalIndex = issueEntries.findIndex(
        (e) => e["Product Code"] === currentEntry["Product Code"] && 
               e.Date === currentEntry.Date
      );
      
      const updatedEntry = {
        ...entry,
        lastUpdated: new Date().toISOString(),
      };

      await sheetService.updateRow("FG Material Outward", originalIndex + 2, updatedEntry);
        setSnackbar({
          open: true,
        message: "FG Material Outward entry updated successfully",
          severity: "success",
        });
      fetchIssueEntries();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error updating entry",
        severity: "error",
      });
    }
  };

  const handleDelete = async (rowIndex) => {
    if (!window.confirm('Are you sure you want to delete this outward entry?')) {
      return;
    }
    try {
      const currentEntry = sortedItems[rowIndex];
      
      const originalIndex = issueEntries.findIndex(
        (e) => e["Product Code"] === currentEntry["Product Code"] && 
               e.Date === currentEntry.Date
      );
      
      await sheetService.deleteRow("FG Material Outward", originalIndex + 2);
      setSnackbar({
        open: true,
        message: "FG Material Outward entry deleted successfully",
        severity: "success",
      });
      fetchIssueEntries();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error deleting entry",
        severity: "error",
      });
    }
  };

  const handleComplete = async (entry, rowIndex) => {
    if (!window.confirm('Are you sure you want to mark this entry as complete? This will subtract the quantity from FG Stock.')) {
      return;
    }
    try {
      // Check stock availability before completing
      const clients = await getAllClients();
      let currentStock = 0;
      
      for (const client of clients) {
        if (client.products && Array.isArray(client.products)) {
          const product = client.products.find(
            p => p.productCode && p.productCode.toUpperCase() === entry["Product Code"].toUpperCase()
          );
          if (product) {
            currentStock = parseFloat(product.currentStock || 0);
            break;
          }
        }
      }
      
      const requestedQty = parseFloat(entry.Quantity) || 0;
      
      if (requestedQty > currentStock) {
        setSnackbar({
          open: true,
          message: `Insufficient stock! Available: ${currentStock}, Requested: ${requestedQty}`,
          severity: "error",
        });
        return;
      }

      // Find the original index in issueEntries array
      const originalIndex = issueEntries.findIndex(
        (e) => e["Product Code"] === entry["Product Code"] && 
               e.Date === entry.Date &&
               e.Quantity === entry.Quantity
      );
      
      if (originalIndex === -1) {
        setSnackbar({
          open: true,
          message: "Entry not found in the database",
          severity: "error",
        });
        return;
      }
      
      const updatedEntry = {
        ...entry,
        Status: "Completed",
        Date: entry.Date || new Date().toISOString().split("T")[0],
      };
      
      // Update the entry status to Completed
      await sheetService.updateRow("FG Material Outward", originalIndex + 2, updatedEntry);
      
      // Update FG Stock levels (reduce stock)
      await updateFGStockLevels(entry["Product Code"], entry.Quantity, "outward");
      
      setSnackbar({
        open: true,
        message: `Entry marked as complete and ${entry.Quantity} units subtracted from FG Stock successfully!`,
        severity: "success",
      });
      fetchIssueEntries();
    } catch (error) {
      console.error("Error in handleComplete:", error);
      setSnackbar({
        open: true,
        message: "Error completing entry: " + error.message,
        severity: "error",
      });
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEntry(null);
    setFormData({
      Date: new Date().toISOString().split("T")[0],
      "Product Code": "",
      "Product Name": "",
      Quantity: "",
      Status: "Pending",
      Remarks: "",
    });
  };

  // Sorting logic
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedItems = [...issueEntries]
    .filter((item) =>
      String(item["Product Code"] || "").toLowerCase().includes(search.toLowerCase()) ||
      String(item["Product Name"] || "").toLowerCase().includes(search.toLowerCase()) ||
      String(item.Department || "").toLowerCase().includes(search.toLowerCase())
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
        <Avatar sx={{ bgcolor: theme.palette.error.main, width: 56, height: 56 }}>
          <OutwardIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
        sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #d32f2f, #ff8a80)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            FG Material Outward
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Finished Goods Outward Material Management
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ ml: 'auto' }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchIssueEntries} color="error">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {loading && (
            <CircularProgress 
              size={24} 
              color="error"
            />
          )}
        </Stack>
      </Stack>

      {/* Summary Cards */}
      {issueEntries.length > 0 && (
        <Card sx={{ mb: 3, boxShadow: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <AnalyticsIcon color="error" />
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                Outward Summary
              </Typography>
            </Stack>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Badge badgeContent={getTotalOutward()} color="error">
                      <AssignmentIcon color="error" />
                    </Badge>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Outward
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {getTotalOutward()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <CheckCircle color="success" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Completed
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {getCompletedOutward()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <PendingIcon color="warning" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Pending
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                        {getPendingOutward()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <DepartmentIcon color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Departments
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {getUniqueDepartments()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <PersonIcon color="info" />
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <TodayIcon color="warning" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Today's Items
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {getTodaysOutward()}
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
                label="Search outward entries"
                variant="outlined"
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Product Code, Name, Recipient, or Department..."
                sx={{ minWidth: { xs: "100%", sm: "300px" } }}
              />
            </Box>
            
          <Button
            variant="contained"
              startIcon={<AddIcon />}
            onClick={handleOpenDialog}
              size="large"
              sx={{ 
                background: 'linear-gradient(45deg, #d32f2f, #ff8a80)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #b71c1c, #d32f2f)',
                }
              }}
          >
            Add New Outward Entry
          </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Outward Entries Table */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 0 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <OutwardIcon color="error" />
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                Material Outward Entries
              </Typography>
              {sortedItems.length > 0 && (
                <Chip 
                  label={`${sortedItems.length} entries`} 
                  color="error" 
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
                  { id: "Date", label: "Date" },
                        { id: "Product Code", label: "Product Details" },
                        { id: "Quantity", label: "Quantity" },
                  { id: "Status", label: "Status" },
                  { id: "actions", label: "Actions" },
                ].map((col) => (
                  <TableCell
                    key={col.id}
                          sx={{ 
                            fontWeight: 'bold', 
                            textTransform: 'uppercase',
                            bgcolor: 'error.main',
                            color: 'white',
                            fontSize: '0.75rem'
                          }}
                    sortDirection={orderBy === col.id ? order : false}
                  >
                          {col.id !== "actions" && col.id !== "Product Code" && col.id !== "Quantity" ? (
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
                      paginatedItems.map((entry, index) => (
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
                    {entry.Date
                      ? new Date(entry.Date).toLocaleDateString()
                      : ""}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {entry.Date 
                                  ? new Date(entry.Date).toLocaleDateString('en-US', { weekday: 'short' })
                                  : ""
                                }
                              </Typography>
                            </Stack>
                  </TableCell>
                          
                          <TableCell>
                            <Stack alignItems="flex-start" spacing={0.5}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {entry["Product Name"]}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Code: {entry["Product Code"]}
                              </Typography>
                            </Stack>
                          </TableCell>
                          
                          <TableCell>
                            <Stack alignItems="flex-start" spacing={0.5}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                                {entry.Quantity || '0'}
                              </Typography>
                            </Stack>
                          </TableCell>

                  <TableCell>
                    <Chip
                      label={entry.Status}
                              color={getStatusColor(entry.Status)}
                      variant={entry.Status === "Completed" ? "filled" : "outlined"}
                      size="small"
                              icon={getStatusIcon(entry.Status)}
                    />
                  </TableCell>
                          
                  <TableCell>
                            <Stack direction="row" spacing={1}>
                              {entry.Status !== "Completed" && (
                                <Tooltip title="Mark as Complete">
                                  <IconButton
                                    size="small"
                                    sx={{ color: '#2e7d32' }}
                                    onClick={() => handleComplete(entry, index)}
                                  >
                                    <CheckCircle />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Delete Entry">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          const actualIndex = page * rowsPerPage + index;
                          handleDelete(actualIndex);
                        }}
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
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <Stack alignItems="center" spacing={2}>
                            <OutwardIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                            <Typography variant="h6" color="text.secondary">
                              No outward entries found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {search ? 
                                `No entries match "${search}". Try a different search term.` :
                                "Create your first outward entry to get started"
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
              color: '#d32f2f',
              '&:hover': {
                backgroundColor: 'rgba(211, 47, 47, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #d32f2f, #f44336)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center',
              lineHeight: 1.2
            }}
          >
          Add New Outward Entry
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              textAlign: 'center',
              mt: 1
            }}
          >
            Create new FG outward entry
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ px: 4, py: 2, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto', position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {availableProducts.length > 0 ? (
              <Alert severity="info" icon={<ProductIcon />}>
                <Typography variant="body2">
                  <strong>Product Selection from Clients Sheet</strong>
                  <br />
                  Select a product code from the dropdown. Product name will be automatically filled.
                  Stock levels will be reduced when Status = "Completed". ({availableProducts.length} products available)
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning" icon={<WarningIcon />}>
                <Typography variant="body2">
                  <strong>No Products Available</strong>
                  <br />
                  No products found in the Clients sheet. Please add products to a client first.
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
                  onChange={handleDateChange}
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
                      borderBottomColor: '#d32f2f'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#d32f2f'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#d32f2f'
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
                options={availableProducts.filter(item => item["Product Code"] && item["Product Code"].trim() !== "")}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return option["Product Code"] || '';
                }}
                value={availableProducts.find(item => item["Product Code"] === formData["Product Code"]) || null}
                onChange={handleProductCodeChange}
                disabled={!!selectedEntry}
                renderInput={(params) => (
              <TextField
                    {...params}
                fullWidth
                      label="Product Code *"
                required
                      variant="standard"
                    placeholder="Select product code from dropdown..."
                    helperText="Select from Clients sheet products"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <ProductIcon color="action" sx={{ mr: 1 }} />
                          {params.InputProps.startAdornment}
                        </>
                      )
                    }}
                      sx={{
                        '& .MuiInput-underline:before': {
                          borderBottomColor: '#e0e0e0'
                        },
                        '& .MuiInput-underline:after': {
                          borderBottomColor: '#d32f2f'
                        },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                          borderBottomColor: '#d32f2f'
                        },
                        '& .MuiFormLabel-root': {
                          fontSize: '14px',
                          color: '#666',
                          '&.Mui-focused': {
                            color: '#d32f2f'
                          }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '16px',
                          padding: '8px 0'
                        }
                      }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option["Product Code"]}>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#d32f2f' }}>
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
                  startAdornment: <InventoryIcon color="action" sx={{ mr: 1 }} />
                }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#d32f2f'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#d32f2f'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#d32f2f'
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
                  label="Quantity *"
                name="Quantity"
                type="number"
                value={formData.Quantity}
                onChange={handleInputChange}
                required
                  variant="standard"
                InputProps={{
                  startAdornment: <TrendingDownIcon color="action" sx={{ mr: 1 }} />
                }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#d32f2f'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#d32f2f'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#d32f2f'
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
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  select
                  fullWidth
                  label="Status *"
                  name="Status"
                  value={formData.Status}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData((prev) => ({ ...prev, Status: value }));
                  }}
                  required
                  variant="standard"
                  SelectProps={{ native: true }}
                  InputProps={{
                    startAdornment: getStatusIcon(formData.Status)
                  }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#d32f2f'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#d32f2f'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#d32f2f'
                      }
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </TextField>
              </Box>
            </Box>
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Remarks"
                name="Remarks"
                value={formData.Remarks}
                onChange={handleInputChange}
                multiline
                rows={3}
                variant="standard"
                InputProps={{
                  startAdornment: <RemarksIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{
                  '& .MuiInput-underline:before': {
                    borderBottomColor: '#e0e0e0'
                  },
                  '& .MuiInput-underline:after': {
                    borderBottomColor: '#d32f2f'
                  },
                  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                    borderBottomColor: '#d32f2f'
                  },
                  '& .MuiFormLabel-root': {
                    fontSize: '14px',
                    color: '#666',
                    '&.Mui-focused': {
                      color: '#d32f2f'
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
                borderColor: '#d32f2f'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            startIcon={<AddIcon />}
            sx={{ 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #d32f2f, #f44336)',
              color: 'white',
              px: 3,
              py: 1.5,
              minWidth: '180px',
              boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #b71c1c, #d32f2f)',
                boxShadow: '0 6px 16px rgba(211, 47, 47, 0.4)',
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
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FGMaterialOutward; 