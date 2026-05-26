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
  Divider,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, CheckCircle, PlayArrow } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import sheetService from "../../services/sheetService";
import CircularProgress from "@mui/material/CircularProgress";
import TablePagination from "@mui/material/TablePagination";
import TableSortLabel from "@mui/material/TableSortLabel";

const ProductionOrder = () => {
  const [productionOrders, setProductionOrders] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState("orderDate");
  const [order, setOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [billOfMaterials, setBillOfMaterials] = useState([]);

  const [formData, setFormData] = useState({
    orderNo: "",
    orderDate: new Date(),
    productCode: "",
    productName: "",
    quantityToProduce: "",
    status: "Planned",
    priority: "Medium",
    plannedStartDate: new Date(),
    plannedEndDate: new Date(),
    remarks: "",
  });

  useEffect(() => {
    fetchProductionOrders();
    fetchFinishedGoods();
    fetchBillOfMaterials();
  }, []);

  const fetchProductionOrders = async () => {
    try {
      setLoading(true);
      const data = await sheetService.getSheetData("Production Orders");
      setProductionOrders(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setSnackbar({
        open: true,
        message: "Error fetching production orders",
        severity: "error",
      });
    }
  };

  const fetchFinishedGoods = async () => {
    try {
      const data = await sheetService.getSheetData("Finished Goods");
      setFinishedGoods(data);
    } catch (error) {
    }
  };

  const fetchBillOfMaterials = async () => {
    try {
      const data = await sheetService.getSheetData("Bill of Materials");
      setBillOfMaterials(data);
    } catch (error) {
    }
  };

  const consumeRawMaterials = async (productCode, quantity) => {
    // Get BOM for the product
    const bom = billOfMaterials.filter(item => item.productCode === productCode);
    
    for (const bomItem of bom) {
      const totalRequired = parseFloat(bomItem.quantityRequired) * parseFloat(quantity);
      
      // Create material issue entry
      const materialIssueEntry = {
        date: new Date().toISOString(),
        itemCode: bomItem.itemCode,
        itemName: bomItem.itemName,
        quantity: totalRequired,
        unit: bomItem.unit,
        issuedTo: "Production",
        department: "Manufacturing",
        status: "Completed",
        remarks: `Production Order: ${formData.orderNo}`,
        lastUpdated: new Date().toISOString(),
      };
      
      await sheetService.appendRow("Material Issue", materialIssueEntry);
      
      // Update stock levels
      const stockData = await sheetService.getSheetData("Stock");
      const stockIndex = stockData.findIndex(item => item.itemCode === bomItem.itemCode);
      
      if (stockIndex !== -1) {
        const updatedStock = { ...stockData[stockIndex] };
        const currentStock = parseFloat(updatedStock.currentStock) || 0;
        updatedStock.currentStock = (currentStock - totalRequired).toString();
        updatedStock.lastUpdated = new Date().toISOString().split("T")[0];
        await sheetService.updateRow("Stock", stockIndex + 2, updatedStock);
      }
    }
  };

  const produceFinishedGoods = async (productCode, productName, quantity, orderNo) => {
    // Create FG Material Inward entry
    const fgInwardEntry = {
      Date: new Date().toISOString(),
      "Product Code": productCode,
      "Product Name": productName,
      Quantity: quantity,
      Unit: "PCS", // Default unit
      Supplier: "Internal Production",
      "Invoice No": orderNo,
      Status: "Completed",
    };
    
    await sheetService.appendRow("FG Material Inward", fgInwardEntry);
    
    // Update FG Stock
    const fgStockData = await sheetService.getSheetData("FG Stock");
    const stockIndex = fgStockData.findIndex(item => item["Product Code"] === productCode);
    
    if (stockIndex !== -1) {
      const updatedStock = { ...fgStockData[stockIndex] };
      const currentStock = parseFloat(updatedStock["Current Stock"]) || 0;
      updatedStock["Current Stock"] = (currentStock + parseFloat(quantity)).toString();
      updatedStock["Last Updated"] = new Date().toISOString().split("T")[0];
      await sheetService.updateRow("FG Stock", stockIndex + 2, updatedStock);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "productCode") {
      const product = finishedGoods.find((p) => p.productCode === value);
      if (product) {
        setFormData((prev) => ({
          ...prev,
          productName: product.productName,
        }));
      }
    }
  };

  const handleDateChange = (field, date) => {
    setFormData((prev) => ({
      ...prev,
      [field]: date,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newOrder = {
      ...formData,
      orderNo: formData.orderNo || `PO-${Date.now()}`,
      orderDate: formData.orderDate instanceof Date 
        ? formData.orderDate.toISOString() 
        : formData.orderDate,
      plannedStartDate: formData.plannedStartDate instanceof Date 
        ? formData.plannedStartDate.toISOString() 
        : formData.plannedStartDate,
      plannedEndDate: formData.plannedEndDate instanceof Date 
        ? formData.plannedEndDate.toISOString() 
        : formData.plannedEndDate,
    };

    if (selectedOrder) {
      // Update existing order
      sheetService
        .updateRow(
          "Production Orders",
          productionOrders.findIndex(order => order.orderNo === selectedOrder.orderNo) + 2,
          newOrder
        )
        .then(() => {
          setSnackbar({
            open: true,
            message: "Production order updated successfully",
            severity: "success",
          });
          fetchProductionOrders();
        })
        .catch(() =>
          setSnackbar({
            open: true,
            message: "Error updating order",
            severity: "error",
          })
        );
    } else {
      // Create new order
      sheetService
        .appendRow("Production Orders", newOrder)
        .then(() => {
          setSnackbar({
            open: true,
            message: "Production order created successfully",
            severity: "success",
          });
          fetchProductionOrders();
        })
        .catch(() =>
          setSnackbar({
            open: true,
            message: "Error creating order",
            severity: "error",
          })
        );
    }
    handleCloseDialog();
  };

  const handleStartProduction = async (order) => {
    try {
      // Update order status to "In Progress"
      const updatedOrder = { ...order, status: "In Progress" };
      const orderIndex = productionOrders.findIndex(o => o.orderNo === order.orderNo);
      
      await sheetService.updateRow("Production Orders", orderIndex + 2, updatedOrder);
      
      // Consume raw materials
      await consumeRawMaterials(order.productCode, order.quantityToProduce);
      
      setSnackbar({
        open: true,
        message: "Production started and materials consumed",
        severity: "success",
      });
      
      fetchProductionOrders();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error starting production: " + error.message,
        severity: "error",
      });
    }
  };

  const handleCompleteProduction = async (order) => {
    try {
      // Update order status to "Completed"
      const updatedOrder = { ...order, status: "Completed" };
      const orderIndex = productionOrders.findIndex(o => o.orderNo === order.orderNo);
      
      await sheetService.updateRow("Production Orders", orderIndex + 2, updatedOrder);
      
      // Produce finished goods
      await produceFinishedGoods(
        order.productCode, 
        order.productName, 
        order.quantityToProduce,
        order.orderNo
      );
      
      setSnackbar({
        open: true,
        message: "Production completed and finished goods added to inventory",
        severity: "success",
      });
      
      fetchProductionOrders();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error completing production: " + error.message,
        severity: "error",
      });
    }
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setFormData({
      ...order,
      orderDate: order.orderDate ? new Date(order.orderDate) : new Date(),
      plannedStartDate: order.plannedStartDate ? new Date(order.plannedStartDate) : new Date(),
      plannedEndDate: order.plannedEndDate ? new Date(order.plannedEndDate) : new Date(),
    });
    setOpenDialog(true);
  };

  const handleDelete = async (rowIndex) => {
    try {
      await sheetService.deleteRow("Production Orders", rowIndex + 2);
      setSnackbar({
        open: true,
        message: "Production order deleted successfully",
        severity: "success",
      });
      fetchProductionOrders();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error deleting order",
        severity: "error",
      });
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
    setFormData({
      orderNo: "",
      orderDate: new Date(),
      productCode: "",
      productName: "",
      quantityToProduce: "",
      status: "Planned",
      priority: "Medium",
      plannedStartDate: new Date(),
      plannedEndDate: new Date(),
      remarks: "",
    });
  };

  // Sorting logic
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedItems = [...productionOrders]
    .filter((item) =>
      String(item.orderNo || '').toLowerCase().includes(search.toLowerCase()) ||
      String(item.productCode || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (order === "asc") {
        return (a[orderBy] || '') > (b[orderBy] || '') ? 1 : -1;
      } else {
        return (a[orderBy] || '') < (b[orderBy] || '') ? 1 : -1;
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

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "success";
      case "In Progress": return "info";
      case "Planned": return "warning";
      default: return "default";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "error";
      case "Medium": return "warning";
      case "Low": return "success";
      default: return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 2,
        }}
      >
        <Typography variant="h5">Production Orders</Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenDialog}
            fullWidth={false}
          >
            Create Production Order
          </Button>
          <TextField
            label="Search Orders"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: { xs: "100%", sm: "200px" } }}
          />
        </Box>
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
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {[
                  { id: "orderNo", label: "Order No" },
                  { id: "orderDate", label: "Order Date" },
                  { id: "productCode", label: "Product Code" },
                  { id: "productName", label: "Product Name" },
                  { id: "quantityToProduce", label: "Quantity" },
                  { id: "status", label: "Status" },
                  { id: "priority", label: "Priority" },
                  { id: "actions", label: "Actions" },
                ].map((col) => (
                  <TableCell
                    key={col.id}
                    sortDirection={orderBy === col.id ? order : false}
                  >
                    {col.id !== "actions" ? (
                      <TableSortLabel
                        active={orderBy === col.id}
                        direction={orderBy === col.id ? order : "asc"}
                        onClick={() => handleRequestSort(col.id)}
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
              {paginatedItems.map((order, index) => (
                <TableRow key={index}>
                  <TableCell>{order.orderNo}</TableCell>
                  <TableCell>
                    {order.orderDate
                      ? new Date(order.orderDate).toLocaleDateString()
                      : ""}
                  </TableCell>
                  <TableCell>{order.productCode}</TableCell>
                  <TableCell>{order.productName}</TableCell>
                  <TableCell>{order.quantityToProduce}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.priority}
                      color={getPriorityColor(order.priority)}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {order.status === "Planned" && (
                      <Tooltip title="Start Production">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleStartProduction(order)}
                        >
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                    )}
                    {order.status === "In Progress" && (
                      <Tooltip title="Complete Production">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleCompleteProduction(order)}
                        >
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(order)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TablePagination
        component="div"
        count={sortedItems.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 20, 50, 100]}
      />

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedOrder ? "Edit Production Order" : "Create Production Order"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Order Number"
                name="orderNo"
                value={formData.orderNo}
                onChange={handleInputChange}
                placeholder="Auto-generated if empty"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Order Date"
                  value={formData.orderDate}
                  onChange={(date) => handleDateChange("orderDate", date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Code"
                name="productCode"
                value={formData.productCode}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Name"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                required
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity to Produce"
                name="quantityToProduce"
                type="number"
                value={formData.quantityToProduce}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  label="Priority"
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Planned Start Date"
                  value={formData.plannedStartDate}
                  onChange={(date) => handleDateChange("plannedStartDate", date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Planned End Date"
                  value={formData.plannedEndDate}
                  onChange={(date) => handleDateChange("plannedEndDate", date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedOrder ? "Update" : "Create"} Order
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  );
};

export default ProductionOrder; 