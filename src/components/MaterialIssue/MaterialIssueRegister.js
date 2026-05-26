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
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle,
  CallMade as IssueIcon,
  Person as PersonIcon,
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
  Scale as ScaleIcon,
  Schedule as PendingIcon,
  Refresh as RefreshIcon,
  Comment as RemarksIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  Autocomplete,
} from "@mui/material";
import sheetService from "../../services/sheetService";

const MaterialIssueRegister = () => {
  // Theme and responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  // State management
  const [issueEntries, setIssueEntries] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState("date");
  const [order, setOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [stockItems, setStockItems] = useState([]);

  // Fetch stock items for dropdown
  const fetchStockItems = async () => {
    try {
      const data = await sheetService.getSheetData("Stock");
      setStockItems(data);
    } catch (error) {
      console.error("Error fetching stock items:", error);
    }
  };

  // Handle item code selection and auto-populate fields
  const handleItemCodeChange = (event, newValue) => {
    if (newValue) {
      // newValue is the full object from Autocomplete
      let vendorCode = "";
      
      // Extract vendor code from vendorDetails if it exists
      if (newValue.vendorDetails) {
        try {
          const vendorData = typeof newValue.vendorDetails === 'string' 
            ? JSON.parse(newValue.vendorDetails) 
            : newValue.vendorDetails;
          vendorCode = vendorData.vendorCode || "";
        } catch (e) {
          console.warn("Error parsing vendor details:", e);
          vendorCode = newValue.vendorCode || "";
        }
      } else {
        vendorCode = newValue.vendorCode || "";
      }
      
      setFormData(prev => ({
        ...prev,
        itemCode: newValue.itemCode,
        itemName: newValue.itemName || "",
        unit: newValue.unit || "",
        // Note: Material Issue doesn't have supplier field, but we can add vendor info to remarks if needed
        // supplier: vendorCode, // Uncomment if you want to add supplier field to Material Issue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        itemCode: "",
        itemName: "",
        unit: "",
      }));
    }
  };

  const [formData, setFormData] = useState({
    date: new Date(),
    itemCode: "",
    itemName: "",
    quantity: "",
    unit: "",
    status: "Pending",
    remarks: "",
    lastUpdated: "",
  });

  // Helper functions for UI
  const getTotalIssued = () => 
    issueEntries.reduce((total, entry) => total + parseFloat(entry.quantity || 0), 0);

  const getCompletedIssues = () => 
    issueEntries.filter(entry => entry.status === "Completed").length;

  const getPendingIssues = () => 
    issueEntries.filter(entry => entry.status === "Pending").length;

  // Removed department functionality

  const getTodaysIssues = () => {
    const today = new Date().toDateString();
    return issueEntries.filter(entry => 
      new Date(entry.date).toDateString() === today
    ).length;
  };

  // Fetch issue entries from sheet
  const fetchIssueEntries = async () => {
    try {
      setLoading(true);
      const data = await sheetService.getSheetData("Material Issue");
      setIssueEntries(data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error fetching issue entries",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchStockItems();
    fetchIssueEntries();
    
    // Check for pre-selected item from Stock Management
    const selectedItem = sessionStorage.getItem('selectedItemForIssue');
    if (selectedItem) {
      try {
        const itemData = JSON.parse(selectedItem);
        setFormData(prev => ({
          ...prev,
          itemCode: itemData.itemCode || '',
          itemName: itemData.itemName || '',
          unit: itemData.unit || '',
          // Keep quantity empty for user to fill
          quantity: '',
          // Auto-open the dialog
        }));
        // Auto-open the dialog
        setOpenDialog(true);
        // Clear the sessionStorage after use
        sessionStorage.removeItem('selectedItemForIssue');
      } catch (error) {
        console.error('Error parsing selected item data:', error);
      }
    }
  }, []);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "itemCode") {
      const item = stockItems.find((i) => i.itemCode === value);
      if (item) {
        setFormData((prev) => ({
          ...prev,
          itemName: item.itemName,
          unit: item.unit,
        }));
      }
    }
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      date,
    }));
  };

  // Validation function
  const validateMaterialIssueForm = () => {
    const errors = [];
    
    // Required field validations
    if (!formData.itemCode || formData.itemCode.trim() === "") {
      errors.push("Item Code is required");
    }
    
    if (!formData.itemName || formData.itemName.trim() === "") {
      errors.push("Item Name is required");
    }
    
    if (!formData.quantity || formData.quantity.toString().trim() === "") {
      errors.push("Quantity is required");
    }
    
    if (!formData.unit || formData.unit.trim() === "") {
      errors.push("Unit is required");
    }

    // Numeric validations
    if (formData.quantity && isNaN(parseFloat(formData.quantity))) {
      errors.push("Quantity must be a valid number");
    }
    
    if (formData.quantity && parseFloat(formData.quantity) <= 0) {
      errors.push("Quantity must be greater than zero");
    }
    
    // Check if item exists in stock
    const stockItem = stockItems.find(
      (item) => item.itemCode && item.itemCode.toUpperCase() === formData.itemCode.toUpperCase()
    );
    
    if (!stockItem) {
      errors.push(`Item "${formData.itemCode}" not found in Stock. Please add it to Stock Management first.`);
    } else {
      // Check if sufficient stock is available
      const currentStock = parseFloat(stockItem.currentStock) || 0;
      const requestedQuantity = parseFloat(formData.quantity) || 0;
      
      if (currentStock < requestedQuantity) {
        errors.push(`Insufficient stock. Available: ${currentStock} ${formData.unit}, Requested: ${requestedQuantity} ${formData.unit}`);
      }
    }
    
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateMaterialIssueForm();
    if (validationErrors.length > 0) {
      setSnackbar({
        open: true,
        message: validationErrors.join(", "),
        severity: "error",
      });
      return;
    }
    
    // Sanitize and prepare data
    const newEntry = {
      ...formData,
      itemCode: formData.itemCode.trim(),
      itemName: formData.itemName.trim(),
      quantity: parseFloat(formData.quantity).toString(),
      unit: formData.unit.trim(),
      remarks: formData.remarks ? formData.remarks.trim() : "",
      date:
        formData.date instanceof Date
          ? formData.date.toISOString()
          : formData.date,
      lastUpdated: new Date().toISOString(),
    };
    
    if (selectedEntry) {
      sheetService
        .updateRow(
          "Material Issue",
          issueEntries.findIndex(
            (entry) => entry.issueId === selectedEntry.issueId
          ) + 2,
          newEntry
        )
        .then(() => {
          setSnackbar({
            open: true,
            message: "Material issue entry updated successfully",
            severity: "success",
          });
          fetchIssueEntries();
        })
        .catch((error) =>
          setSnackbar({
            open: true,
            message: "Error updating entry: " + error.message,
            severity: "error",
          })
        );
    } else {
      sheetService
        .appendRow("Material Issue", newEntry)
        .then(() => {
          setSnackbar({
            open: true,
            message: "Material issue entry added successfully. Stock will be updated when marked as complete.",
            severity: "success",
          });
          fetchIssueEntries();
        })
        .catch((error) =>
          setSnackbar({
            open: true,
            message: "Error adding entry: " + error.message,
            severity: "error",
          })
        );
    }
    handleCloseDialog();
  };

  const handleEdit = (entry) => {
    setSelectedEntry(entry);
    setFormData(entry);
    setOpenDialog(true);
  };

  const handleUpdate = async (rowIndex, entry) => {
    try {
      // Get the current entry from sortedItems instead of issueEntries
      const currentEntry = sortedItems[rowIndex];
      // Find the actual index in the original issueEntries array
      const originalIndex = issueEntries.findIndex(
        (e) => e.itemCode === currentEntry.itemCode && 
               e.date === currentEntry.date && 
               e.quantity === currentEntry.quantity
      );
      const isStatusChangingToCompleted = 
        currentEntry.status !== "Completed" && entry.status === "Completed";
      // Add lastUpdated timestamp
      const updatedEntry = {
        ...entry,
        lastUpdated: new Date().toISOString(),
      };
      // Use originalIndex + 2 for sheet row (header + 1-based indexing)
      await sheetService.updateRow("Material Issue", originalIndex + 2, updatedEntry);
      // Update local state using original index
      setIssueEntries((prev) => {
        const updated = [...prev];
        updated[originalIndex] = { ...updatedEntry };
        return updated;
      });
      
      // Only update stock if status is changing from non-Completed to Completed
      if (isStatusChangingToCompleted) {
        await updateStockLevels(entry.itemCode, entry.quantity, "issue");
        setSnackbar({
          open: true,
          message: "Material issue entry updated and stock adjusted successfully",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Material issue entry updated successfully",
          severity: "success",
        });
      }
    } catch (error) {
      console.error('Error in handleUpdate:', error);
      setSnackbar({
        open: true,
        message: "Error updating entry: " + error.message,
        severity: "error",
      });
    }
  };

  const handleDelete = async (rowIndex) => {
    if (!window.confirm('Are you sure you want to delete this issue entry?')) {
      return;
    }
    try {
      const currentEntry = sortedItems[rowIndex];
      
      const originalIndex = issueEntries.findIndex(
        (e) => e.itemCode === currentEntry.itemCode && 
               e.date === currentEntry.date && 
               e.quantity === currentEntry.quantity
      );
      
      await sheetService.deleteRow("Material Issue", originalIndex + 2);
      setSnackbar({
        open: true,
        message: "Material issue entry deleted successfully",
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

  const handleOpenDialog = () => {
    // Reset form data with current date for new entry
    setFormData({
      date: new Date(),
      itemCode: "",
      itemName: "",
      quantity: "",
      unit: "",
      status: "Pending",
      remarks: "",
      lastUpdated: "",
    });
    setSelectedEntry(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEntry(null);
    // Form data will be reset when opening dialog again
  };

  // Sorting logic
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedItems = [...issueEntries]
    .filter((item) =>
      String(item.itemCode || "").toLowerCase().includes(search.toLowerCase()) ||
      String(item.itemName || "").toLowerCase().includes(search.toLowerCase())
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

  const updateStockLevels = async (itemCode, quantity, operation) => {
    const stockData = await sheetService.getSheetData("Stock");
    const stockIndex = stockData.findIndex(
      (item) => item.itemCode === itemCode
    );
    if (stockIndex === -1) {
      setSnackbar({
        open: true,
        message: "Item not found in Stock sheet. Please add it to Stock first.",
        severity: "error",
      });
      return;
    }
    
    const updatedStock = { ...stockData[stockIndex] };
    const currentStock = parseFloat(updatedStock.currentStock) || 0;
    const qty = parseFloat(quantity) || 0;
    updatedStock.currentStock =
      operation === "inward"
        ? (currentStock + qty).toString()
        : (currentStock - qty).toString();
    updatedStock.lastUpdated = new Date().toISOString().split("T")[0];
    await sheetService.updateRow("Stock", stockIndex + 2, updatedStock);
    setSnackbar({
      open: true,
      message: `Stock updated successfully. New stock level: ${updatedStock.currentStock}`,
      severity: "success",
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Avatar sx={{ bgcolor: theme.palette.error.main, width: 56, height: 56 }}>
          <IssueIcon fontSize="large" />
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
            Material Issue Register
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Material Outward & Issue Management System
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
                Issue Summary
              </Typography>
            </Stack>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Badge badgeContent={issueEntries.length} color="error">
                      <AssignmentIcon color="error" />
                    </Badge>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Issues
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {issueEntries.length}
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
                        {getCompletedIssues()}
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
                        {getPendingIssues()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <TrendingDownIcon color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Issued
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {getTotalIssued()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <PersonIcon color="secondary" />
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
                label="Search issue entries"
                variant="outlined"
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Item Code, Name, Recipient, or Department..."
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
            Add New Issue Entry
          </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Issue Entries Table */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 0 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <IssueIcon color="error" />
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                Material Issue Entries
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
                  { id: "date", label: "Date" },
                        { id: "itemCode", label: "Item Details" },
                        { id: "quantity", label: "Quantity & Unit" },
                  { id: "status", label: "Status" },
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
                          {col.id !== "actions" && col.id !== "itemCode" && col.id !== "quantity" ? (
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
                    {entry.date
                      ? new Date(entry.date).toLocaleDateString()
                      : ""}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {entry.date 
                                  ? new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' })
                                  : ""
                                }
                              </Typography>
                            </Stack>
                  </TableCell>
                          
                          <TableCell>
                            <Stack alignItems="flex-start" spacing={0.5}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {entry.itemName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Code: {entry.itemCode}
                              </Typography>
                            </Stack>
                          </TableCell>
                          
                          <TableCell>
                            <Stack alignItems="flex-start" spacing={0.5}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                -{entry.quantity} {entry.unit}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Qty: {entry.quantity}
                              </Typography>
                            </Stack>
                          </TableCell>

                  <TableCell>
                    <Chip
                      label={entry.status}
                              color={getStatusColor(entry.status)}
                      variant={entry.status === "Completed" ? "filled" : "outlined"}
                      size="small"
                              icon={getStatusIcon(entry.status)}
                    />
                  </TableCell>
                          
                  <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Tooltip title={entry.status === "Completed" ? "Already Completed" : "Mark Complete"}>
                                <span>
                      <IconButton
                        size="small"
                        color={entry.status === "Completed" ? "inherit" : "success"}
                        onClick={() => {
                          // Calculate the actual row index based on pagination
                          const actualIndex = page * rowsPerPage + index;
                          if (actualIndex < sortedItems.length) {
                            handleUpdate(actualIndex, {
                              ...entry,
                              status: "Completed",
                            });
                          } else {
                            setSnackbar({
                              open: true,
                              message: "Error: Invalid row index",
                              severity: "error",
                            });
                          }
                        }}
                        disabled={entry.status === "Completed"}
                      >
                        <CheckCircle />
                      </IconButton>
                                </span>
                    </Tooltip>
                              <Tooltip title="Edit Entry">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleEdit(entry)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Entry">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          // Calculate the actual row index based on pagination
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
                            <IssueIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                            <Typography variant="h6" color="text.secondary">
                              No issue entries found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {search ? 
                                `No entries match "${search}". Try a different search term.` :
                                "Create your first issue entry to get started"
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
            <CancelIcon />
          </IconButton>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #d32f2f, #ff8a80)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center',
              lineHeight: 1.2
            }}
          >
          {selectedEntry ? "Edit Issue Entry" : "Add New Issue Entry"}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              textAlign: 'center',
              mt: 1
            }}
          >
            {selectedEntry ? "Update existing issue entry" : "Create new material issue entry"}
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ px: 4, py: 2, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto', position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {stockItems.length > 0 ? (
              <Alert severity="info" icon={<InventoryIcon />}>
                <Typography variant="body2">
                  <strong>Item Selection from Stock</strong>
                  <br />
                  Select an item from the dropdown. Item Name and Unit will be automatically filled. Stock level will be updated when status is Completed.
                  ({stockItems.length} items available)
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning" icon={<InventoryIcon />}>
                <Typography variant="body2">
                  <strong>No Items Available</strong>
                  <br />
                  No items found in Stock. Please add items to the Stock sheet first.
                </Typography>
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                    label="Date **"
                  value={formData.date}
                  onChange={handleDateChange}
                    format="dd-MM-yyyy"
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                        variant="standard"
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
                            padding: '8px 0',
                            color: '#333'
                          },
                          '& .MuiInputAdornment-root': {
                            '& .MuiIconButton-root': {
                              color: '#666',
                              padding: '4px'
                            }
                          }
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <Autocomplete
                  options={stockItems}
                  getOptionLabel={(option) => option.itemCode || ""}
                  value={stockItems.find(item => item.itemCode === formData.itemCode) || null}
                  onChange={handleItemCodeChange}
                  renderInput={(params) => (
              <TextField
                      {...params}
                      label="Item Code *"
                      variant="standard"
                required
                InputProps={{
                        ...params.InputProps,
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
                  )}
                  renderOption={(props, option) => {
                    // Extract vendor info for display
                    let vendorInfo = "";
                    try {
                      if (option.vendorDetails) {
                        const vendorData = typeof option.vendorDetails === 'string' 
                          ? JSON.parse(option.vendorDetails) 
                          : option.vendorDetails;
                        vendorInfo = vendorData.vendorCode || "";
                      } else {
                        vendorInfo = option.vendorCode || "";
                      }
                    } catch (e) {
                      vendorInfo = "";
                    }
                    
                    return (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {option.itemCode}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.itemName} - {option.unit || 'No unit'} (Stock: {option.currentStock})
                          </Typography>
                          {vendorInfo && (
                            <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                              Vendor: {vendorInfo}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <TextField
                fullWidth
                  label="Item Name *"
                name="itemName"
                value={formData.itemName}
                onChange={handleInputChange}
                required
                disabled
                  variant="standard"
                  helperText="Auto-populated from selected item"
                InputProps={{
                  startAdornment: <AssignmentIcon color="action" sx={{ mr: 1 }} />
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
              <TextField
                fullWidth
                  label="Unit *"
                  name="unit"
                  value={formData.unit}
                onChange={handleInputChange}
                required
                  disabled
                  variant="standard"
                  helperText="Auto-populated from selected item"
                InputProps={{
                    startAdornment: <ScaleIcon color="action" sx={{ mr: 1 }} />
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
                  name="quantity"
                  type="number"
                  value={formData.quantity}
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
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                {/* Empty space for alignment */}
              </Box>
            </Box>
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                multiline
                rows={3}
                placeholder="Enter any additional remarks or notes..."
                variant="standard"
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
            variant="outlined"
            startIcon={<CancelIcon />}
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
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : (selectedEntry ? <SaveIcon /> : <AddIcon />)}
            sx={{ 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #d32f2f, #ff8a80)',
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
            {selectedEntry ? "Update Entry" : loading ? "Adding..." : "Add Entry"}
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

export default MaterialIssueRegister;
