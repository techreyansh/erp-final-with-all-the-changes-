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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import AddIcon from "@mui/icons-material/Add";
import sheetService from "../services/sheetService";

const CustomerOrderSheet = () => {
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(false);
  const [stockItems, setStockItems] = useState([]);
  const [bomItems, setBomItems] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [kittingStatus, setKittingStatus] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [newOrder, setNewOrder] = useState({
    customerName: "",
    productName: "",
    quantity: "",
    orderDate: new Date(),
    status: "Pending",
    deliveryDate: null,
    priority: "Normal",
  });

  useEffect(() => {
    fetchStockItems();
    fetchBomItems();
    fetchOrders();
  }, []);

  const fetchStockItems = async () => {
    try {
      setLoading(true);
      const data = await sheetService.getSheetData("Stock");
      setStockItems(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showSnackbar("Error fetching stock items", "error");
    }
  };

  const fetchBomItems = async () => {
    try {
      setLoading(true);
      const data = await sheetService.getSheetData("BOM");
      setBomItems(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showSnackbar("Error fetching BOM items", "error");
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await sheetService.getSheetData("Customer Orders");
      setOrders(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showSnackbar("Error fetching orders", "error");
    }
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setNewOrder({
      customerName: "",
      productName: "",
      quantity: "",
      orderDate: new Date(),
      deliveryDate: null,
      status: "Pending",
      priority: "Normal",
    });
  };

  const validateOrderForm = () => {
    const { customerName, productName, quantity, orderDate } = newOrder;
    if (!customerName || !productName || !quantity || !orderDate) {
      showSnackbar("Please fill all required fields", "warning");
      return false;
    }
    return true;
  };

  const handleAddOrder = async () => {
    if (!validateOrderForm()) return;
    try {
      // Add order to orders list
      setOrders([...orders, newOrder]);

      // Generate kitting sheet
      const kittingResult = generateKittingSheet(newOrder);
      setKittingStatus(kittingResult);

      showSnackbar("Order added successfully. Kitting sheet generated.");
      handleClose();
    } catch (error) {
      showSnackbar("Error processing order", "error");
    }
  };

  const generateKittingSheet = (order) => {
    const requiredMaterials = calculateRequiredMaterials(order);
    // Check stock availability
    const stockStatus = requiredMaterials.map((material) => {
      const stockItem = stockItems.find(
        (item) => item.itemCode === material.item_code
      );
      const availableQuantity = stockItem
        ? parseFloat(stockItem.currentStock)
        : 0;
      return {
        ...material,
        availableQuantity,
        status:
          availableQuantity >= material.requiredQuantity
            ? "Available"
            : "Short",
      };
    });
    return stockStatus;
  };

  const handleViewKittingSheet = (order) => {
    try {
      setLoading(true);
      const kittingResult = generateKittingSheet(order);
      setSelectedOrder(order);
      setKittingStatus(kittingResult);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showSnackbar("Error generating kitting sheet", "error");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOrder({
      ...newOrder,
      [name]: value,
    });
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Add responsive design improvements
  const styles = {
    container: {
      padding: "16px",
      maxWidth: "1200px",
      margin: "0 auto",
    },
  };

  const calculateRequiredMaterials = (order) => {
    const bom = bomItems.find((b) => b.product_code === order.productCode);
    if (!bom) {
      showSnackbar("BOM not found for the product", "error");
      return [];
    }
    return bom.components.map((component) => ({
      ...component,
      requiredQuantity:
        parseFloat(component.quantity) * parseFloat(order.quantity),
    }));
  };

  return (
    <Box style={styles.container}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" component="h1">
          Customer Order Sheet
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleClickOpen}
        >
          Add New Order
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer Name</TableCell>
              <TableCell>Product Name</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Order Date</TableCell>
              <TableCell>Delivery Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order, index) => (
              <TableRow key={index}>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{order.productName}</TableCell>
                <TableCell>{order.quantity}</TableCell>
                <TableCell>
                  {order.orderDate
                    ? new Date(order.orderDate).toLocaleDateString()
                    : ""}
                </TableCell>
                <TableCell>
                  {order.deliveryDate
                    ? new Date(order.deliveryDate).toLocaleDateString()
                    : ""}
                </TableCell>
                <TableCell>
                  <Chip
                    label={order.status}
                    color={order.status === "Pending" ? "warning" : "success"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={order.priority}
                    color={order.priority === "High" ? "error" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => handleViewKittingSheet(order)}
                  >
                    View Kitting
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Kitting Sheet Dialog */}
      <Dialog
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Kitting Sheet - {selectedOrder?.productName}</DialogTitle>
        <DialogContent>
          {kittingStatus && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Order Details
                  </Typography>
                  <Typography>
                    Customer: {kittingStatus.customerName}
                  </Typography>
                  <Typography>Quantity: {kittingStatus.quantity}</Typography>
                  <Typography>Status: {kittingStatus.status}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Required Materials
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Material</TableCell>
                          <TableCell>Required</TableCell>
                          <TableCell>Available</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {kittingStatus.map((material, index) => (
                          <TableRow key={index}>
                            <TableCell>{material.name}</TableCell>
                            <TableCell>{material.requiredQuantity}</TableCell>
                            <TableCell>{material.availableQuantity}</TableCell>
                            <TableCell>
                              <Chip
                                label={material.status}
                                color={
                                  material.status === "Available"
                                    ? "success"
                                    : "error"
                                }
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedOrder(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add Order Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Order</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="customerName"
            label="Customer Name"
            type="text"
            fullWidth
            value={newOrder.customerName}
            onChange={handleInputChange}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Product Name</InputLabel>
            <Select
              name="productName"
              value={newOrder.productName}
              onChange={handleInputChange}
              label="Product Name"
            >
              {bomItems.map((product) => (
                <MenuItem key={product.id} value={product.name}>
                  {product.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="quantity"
            label="Quantity"
            type="number"
            fullWidth
            value={newOrder.quantity}
            onChange={handleInputChange}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Priority</InputLabel>
            <Select
              name="priority"
              value={newOrder.priority}
              onChange={handleInputChange}
              label="Priority"
            >
              <MenuItem value="Normal">Normal</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Order Date"
              value={newOrder.orderDate}
              onChange={(newValue) => {
                setNewOrder({
                  ...newOrder,
                  orderDate: newValue,
                });
              }}
              renderInput={(params) => (
                <TextField {...params} margin="dense" fullWidth />
              )}
            />
            <DatePicker
              label="Delivery Date"
              value={newOrder.deliveryDate}
              onChange={(newValue) => {
                setNewOrder({
                  ...newOrder,
                  deliveryDate: newValue,
                });
              }}
              renderInput={(params) => (
                <TextField {...params} margin="dense" fullWidth />
              )}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAddOrder} variant="contained">
            Add Order
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Improve user feedback with loading indicators */}
      {loading && <Typography>Loading...</Typography>}
    </Box>
  );
};

export default CustomerOrderSheet;
