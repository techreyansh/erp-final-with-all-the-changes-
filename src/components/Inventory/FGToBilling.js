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
  Card,
  CardContent,
  Stack,
  Container,
  Avatar,
  useTheme,
  useMediaQuery,
  CircularProgress,
  TablePagination,
  Autocomplete,
  Chip,
  Divider,
  InputAdornment,
} from "@mui/material";
import {
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Factory as FactoryIcon,
  Business as BusinessIcon,
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { getAllProductsFromClients, getAllClients, updateClient } from "../../services/clientService";
import sheetService from "../../services/sheetService";
import paymentReminderService from "../../services/paymentReminderService";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// Function to update FG stock levels (subtract when bill is completed)
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

const FGToBilling = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  // State management
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openBillDialog, setOpenBillDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [billItems, setBillItems] = useState([]);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [soNumber, setSoNumber] = useState("");
  const [soDate, setSoDate] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsData, clientsData] = await Promise.all([
        getAllProductsFromClients(),
        getAllClients(),
      ]);
      setProducts(productsData);
      setClients(clientsData);
      await fetchBills();
    } catch (error) {
      console.error("Error fetching data:", error);
      showSnackbar("Error loading data: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async () => {
    try {
      // Fetch bills from a sheet (you may need to create this sheet)
      const billsData = await sheetService.getSheetData("FG Billing").catch(() => []);
      setBills(billsData || []);
    } catch (error) {
      console.error("Error fetching bills:", error);
      setBills([]);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Filter bills based on search and client filter
  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      !search ||
      String(bill["Bill Number"] || "").toLowerCase().includes(search.toLowerCase()) ||
      String(bill["Client Code"] || "").toLowerCase().includes(search.toLowerCase()) ||
      String(bill["Client Name"] || "").toLowerCase().includes(search.toLowerCase()) ||
      String(bill["SO Number"] || "").toLowerCase().includes(search.toLowerCase()) ||
      String(bill["Vehicle Number"] || "").toLowerCase().includes(search.toLowerCase());
    
    const matchesClient =
      !clientFilter || bill["Client Code"] === clientFilter.clientCode;

    return matchesSearch && matchesClient;
  });

  // Get unique client codes from bills
  const getUniqueClientCodes = () => {
    const clientCodes = new Set(
      bills.map((bill) => bill["Client Code"]).filter(Boolean)
    );
    return Array.from(clientCodes)
      .map((code) => {
        const client = clients.find((c) => c.clientCode === code);
        return client || { clientCode: code, clientName: code };
      })
      .sort((a, b) => a.clientCode.localeCompare(b.clientCode));
  };

  // Handle create new bill
  const handleCreateBill = () => {
    setSelectedClient(null);
    setBillItems([]);
    setVehicleNumber("");
    setSoNumber("");
    setSoDate("");
    setOpenBillDialog(true);
  };

  const handleAddBillItem = () => {
    setBillItems([
      ...billItems,
      {
        productCode: "",
        productName: "",
        quantity: "",
        unit: "",
        rate: "",
        amount: "",
      },
    ]);
  };

  const handleBillItemChange = (index, field, value) => {
    const updatedItems = [...billItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Auto-fill product name when product code is selected
    if (field === "productCode") {
      const product = products.find((p) => p.productCode === value);
      if (product) {
        updatedItems[index].productName = product.productName || "";
        updatedItems[index].unit = product.unit || "";
      }
    }

    // Calculate amount when quantity or rate changes
    if (field === "quantity" || field === "rate") {
      const quantity = parseFloat(updatedItems[index].quantity) || 0;
      const rate = parseFloat(updatedItems[index].rate) || 0;
      updatedItems[index].amount = (quantity * rate).toFixed(2);
    }

    setBillItems(updatedItems);
  };

  const handleRemoveBillItem = (index) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const handleSaveBill = async () => {
    if (!selectedClient) {
      showSnackbar("Please select a client", "error");
      return;
    }

    if (billItems.length === 0) {
      showSnackbar("Please add at least one item to the bill", "error");
      return;
    }

    // Validate all items
    for (const item of billItems) {
      if (!item.productCode || !item.quantity || !item.rate) {
        showSnackbar("Please fill all required fields for all items", "error");
        return;
      }
    }

    try {
      setLoading(true);

      // Generate bill number
      const billNumber = `BILL-${Date.now()}`;
      const billDate = new Date().toISOString().split("T")[0];

      // Calculate totals
      const subtotal = billItems.reduce(
        (sum, item) => sum + parseFloat(item.amount || 0),
        0
      );
      const taxRate = 18; // GST rate (can be made configurable)
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;

      // Prepare bill data
      const billData = {
        "Bill Number": billNumber,
        "Bill Date": billDate,
        "Client Code": selectedClient.clientCode,
        "Client Name": selectedClient.clientName,
        "Vehicle Number": vehicleNumber || "",
        "SO Number": soNumber || "",
        "SO Date": soDate || "",
        "Items": JSON.stringify(billItems),
        "Subtotal": subtotal.toFixed(2),
        "Tax Rate": taxRate,
        "Tax Amount": taxAmount.toFixed(2),
        "Total Amount": totalAmount.toFixed(2),
        "Status": "Pending",
        "Created By": "System",
        "Created Date": new Date().toISOString(),
      };

      // Save to sheet
      await sheetService.appendRow("FG Billing", billData);

      // If status is "Completed", subtract stock
      if (billData["Status"] === "Completed") {
        try {
          for (const item of billItems) {
            await updateFGStockLevels(item.productCode, item.quantity, "outward");
          }
        } catch (stockError) {
          console.error("Error updating stock:", stockError);
          showSnackbar("Bill created but stock update failed: " + stockError.message, "warning");
        }
      }

      showSnackbar("Bill created successfully!", "success");
      setOpenBillDialog(false);
      setSelectedClient(null);
      setBillItems([]);
      setVehicleNumber("");
      setSoNumber("");
      setSoDate("");
      await fetchBills();
    } catch (error) {
      console.error("Error saving bill:", error);
      showSnackbar("Error creating bill: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteBill = async (bill, billIndex) => {
    if (!window.confirm('Are you sure you want to mark this bill as completed? This will subtract the quantities from FG Stock.')) {
      return;
    }

    try {
      setLoading(true);
      const items = bill.Items ? JSON.parse(bill.Items) : [];

      // Check stock availability before completing
      const clients = await getAllClients();
      const stockChecks = [];

      for (const item of items) {
        let currentStock = 0;
        for (const client of clients) {
          if (client.products && Array.isArray(client.products)) {
            const product = client.products.find(
              p => p.productCode && p.productCode.toUpperCase() === item.productCode.toUpperCase()
            );
            if (product) {
              currentStock = parseFloat(product.currentStock || 0);
              break;
            }
          }
        }
        const requestedQty = parseFloat(item.quantity) || 0;
        if (requestedQty > currentStock) {
          stockChecks.push({
            productCode: item.productCode,
            available: currentStock,
            requested: requestedQty
          });
        }
      }

      if (stockChecks.length > 0) {
        const errorMsg = stockChecks.map(sc => 
          `${sc.productCode}: Available ${sc.available}, Requested ${sc.requested}`
        ).join('\n');
        showSnackbar(`Insufficient stock!\n${errorMsg}`, "error");
        return;
      }

      // Update bill status to Completed
      const updatedBill = {
        ...bill,
        "Status": "Completed",
        "Completed Date": new Date().toISOString().split("T")[0]
      };

      // Find the row index in the sheet (billIndex + 2 because of header and 0-based index)
      await sheetService.updateRow("FG Billing", billIndex + 2, updatedBill);

      // Subtract stock for all items
      for (const item of items) {
        await updateFGStockLevels(item.productCode, item.quantity, "outward");
      }

      showSnackbar("Bill marked as completed and stock updated!", "success");
      await fetchBills();
    } catch (error) {
      console.error("Error completing bill:", error);
      showSnackbar("Error completing bill: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const generateBillPDF = (bill) => {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let y = 40;

    // Parse bill items
    const items = bill.Items ? JSON.parse(bill.Items) : [];
    const subtotal = parseFloat(bill["Subtotal"] || 0);
    const taxRate = parseFloat(bill["Tax Rate"] || 18);
    const taxAmount = parseFloat(bill["Tax Amount"] || 0);
    const totalAmount = parseFloat(bill["Total Amount"] || 0);

    // Header with background
    doc.setFillColor(76, 175, 80); // Green color
    doc.rect(0, 0, pageWidth, 80, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE / BILL', pageWidth / 2, 45, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Bill details section
    y = 100;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill Details:', 40, y);
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Bill Number: ${bill["Bill Number"] || 'N/A'}`, 40, y);
    y += 15;
    doc.text(`Bill Date: ${bill["Bill Date"] || 'N/A'}`, 40, y);
    y += 15;
    if (bill["SO Number"]) {
      doc.text(`SO Number: ${bill["SO Number"]}`, 40, y);
      y += 15;
    }
    if (bill["SO Date"]) {
      doc.text(`SO Date: ${bill["SO Date"]}`, 40, y);
      y += 15;
    }
    if (bill["Vehicle Number"]) {
      doc.text(`Vehicle Number: ${bill["Vehicle Number"]}`, 40, y);
      y += 15;
    }
    doc.text(`Status: ${bill["Status"] || 'Pending'}`, 40, y);

    // Client details section
    y = 100;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Client Details:', pageWidth - 200, y);
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Client Code: ${bill["Client Code"] || 'N/A'}`, pageWidth - 200, y);
    y += 15;
    doc.text(`Client Name: ${bill["Client Name"] || 'N/A'}`, pageWidth - 200, y);

    // Items table
    y = 180;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Items:', 40, y);
    y += 20;

    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(40, y - 10, pageWidth - 80, 20, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('S.No', 50, y + 5);
    doc.text('Product Code', 100, y + 5);
    doc.text('Product Name', 200, y + 5);
    doc.text('Quantity', 350, y + 5);
    doc.text('Unit', 420, y + 5);
    doc.text('Rate', 470, y + 5);
    doc.text('Amount', pageWidth - 80, y + 5, { align: 'right' });
    y += 25;

    // Table rows
    doc.setFont('helvetica', 'normal');
    items.forEach((item, index) => {
      if (y > pageHeight - 150) {
        doc.addPage();
        y = 40;
      }
      doc.setFontSize(9);
      doc.text(String(index + 1), 50, y + 5);
      doc.text(item.productCode || 'N/A', 100, y + 5);
      doc.text((item.productName || 'N/A').substring(0, 30), 200, y + 5);
      doc.text(String(item.quantity || 0), 350, y + 5);
      doc.text(item.unit || 'N/A', 420, y + 5);
      doc.text(`₹${parseFloat(item.rate || 0).toFixed(2)}`, 470, y + 5);
      doc.text(`₹${parseFloat(item.amount || 0).toFixed(2)}`, pageWidth - 80, y + 5, { align: 'right' });
      y += 20;
    });

    // Totals section
    y = Math.max(y + 20, pageHeight - 120);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Subtotal:', pageWidth - 200, y, { align: 'right' });
    doc.text(`₹${subtotal.toFixed(2)}`, pageWidth - 80, y, { align: 'right' });
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.text(`Tax (${taxRate}%):`, pageWidth - 200, y, { align: 'right' });
    doc.text(`₹${taxAmount.toFixed(2)}`, pageWidth - 80, y, { align: 'right' });
    y += 20;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(pageWidth - 200, y, pageWidth - 80, y);
    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setFillColor(76, 175, 80);
    doc.rect(pageWidth - 200, y - 10, 160, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('Total Amount:', pageWidth - 200, y + 8, { align: 'right' });
    doc.text(`₹${totalAmount.toFixed(2)}`, pageWidth - 80, y + 8, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    // Footer
    y = pageHeight - 40;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('This is a computer-generated invoice.', pageWidth / 2, y, { align: 'center' });
    y += 10;
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: 'center' });

    return doc;
  };

  const handlePrintBill = (bill) => {
    try {
      const doc = generateBillPDF(bill);
      const filename = `${bill["Bill Number"] || 'Bill'}_${bill["Bill Date"] || new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      showSnackbar("Bill PDF downloaded successfully!", "success");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showSnackbar("Error generating PDF: " + error.message, "error");
    }
  };

  const handleDownloadExcel = () => {
    const itemsToExport = filteredBills;

    if (itemsToExport.length === 0) {
      showSnackbar("No bills to export", "warning");
      return;
    }

    const excelData = itemsToExport.map((bill) => {
      const items = bill.Items ? JSON.parse(bill.Items) : [];
      return {
        "Bill Number": bill["Bill Number"] || "",
        "Bill Date": bill["Bill Date"] || "",
        "Client Code": bill["Client Code"] || "",
        "Client Name": bill["Client Name"] || "",
        "SO Number": bill["SO Number"] || "",
        "SO Date": bill["SO Date"] || "",
        "Vehicle Number": bill["Vehicle Number"] || "",
        "Items Count": items.length,
        "Subtotal": bill["Subtotal"] || "",
        "Tax Amount": bill["Tax Amount"] || "",
        "Total Amount": bill["Total Amount"] || "",
        "Status": bill["Status"] || "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FG Billing");

    const colWidths = [
      { wch: 15 }, // Bill Number
      { wch: 12 }, // Bill Date
      { wch: 15 }, // Client Code
      { wch: 30 }, // Client Name
      { wch: 15 }, // SO Number
      { wch: 12 }, // SO Date
      { wch: 18 }, // Vehicle Number
      { wch: 12 }, // Items Count
      { wch: 12 }, // Subtotal
      { wch: 12 }, // Tax Amount
      { wch: 12 }, // Total Amount
      { wch: 12 }, // Status
    ];
    ws["!cols"] = colWidths;

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `FG_Billing_${dateStr}.xlsx`;
    XLSX.writeFile(wb, filename);

    showSnackbar(`Excel file with ${itemsToExport.length} bills downloaded!`, "success");
  };

  const paginatedBills = filteredBills.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: theme.palette.success.main, width: 56, height: 56 }}>
            <ReceiptIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: "bold",
                background: "linear-gradient(45deg, #4caf50, #81c784)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              FG to Billing System
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Client-wise billing for finished goods
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {/* Action Bar */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label="Search bills"
                variant="outlined"
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Bill Number, Client Code, Client Name, SO Number, or Vehicle Number..."
                sx={{ flex: 1, minWidth: { xs: "100%", sm: "300px" } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Autocomplete
                options={getUniqueClientCodes()}
                value={clientFilter}
                onChange={(event, newValue) => {
                  setClientFilter(newValue);
                  setPage(0);
                }}
                getOptionLabel={(option) =>
                  `${option.clientCode} - ${option.clientName}`
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filter by Client"
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: { xs: "100%", sm: "250px" } }}
                  />
                )}
                sx={{ minWidth: { xs: "100%", sm: "250px" } }}
              />
            </Box>

            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateBill}
                size="medium"
                sx={{
                  background: "linear-gradient(45deg, #4caf50, #81c784)",
                  "&:hover": {
                    background: "linear-gradient(45deg, #388e3c, #4caf50)",
                  },
                }}
              >
                Create New Bill
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadExcel}
                size="medium"
                disabled={filteredBills.length === 0}
              >
                Download Excel
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchData}
                size="medium"
              >
                Refresh
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Bills Table */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 0 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <ReceiptIcon color="primary" />
              <Typography variant="h6" component="h2" sx={{ fontWeight: "bold" }}>
                Bills
              </Typography>
              {filteredBills.length > 0 && (
                <Chip label={`${filteredBills.length} bills`} color="primary" size="small" />
              )}
            </Stack>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      {[
                        "Bill Number",
                        "Bill Date",
                        "Client Code",
                        "Client Name",
                        "SO Number",
                        "SO Date",
                        "Vehicle Number",
                        "Items",
                        "Total Amount",
                        "Status",
                        "Actions",
                      ].map((col) => (
                        <TableCell
                          key={col}
                          sx={{
                            fontWeight: "bold",
                            textTransform: "uppercase",
                            bgcolor: "primary.main",
                            color: "white",
                            fontSize: "0.75rem",
                          }}
                        >
                          {col}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedBills.length > 0 ? (
                      paginatedBills.map((bill, index) => {
                        const items = bill.Items ? JSON.parse(bill.Items) : [];
                        return (
                          <TableRow
                            key={index}
                            sx={{
                              "&:nth-of-type(odd)": { bgcolor: "action.hover" },
                              "&:hover": { bgcolor: "action.selected" },
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                {bill["Bill Number"]}
                              </Typography>
                            </TableCell>
                            <TableCell>{bill["Bill Date"]}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                {bill["Client Code"]}
                              </Typography>
                            </TableCell>
                            <TableCell>{bill["Client Name"]}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: "500" }}>
                                {bill["SO Number"] || "N/A"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {bill["SO Date"] || "N/A"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: "500" }}>
                                {bill["Vehicle Number"] || "N/A"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={items.length} size="small" color="primary" />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: "bold", color: "success.main" }}>
                                ₹{parseFloat(bill["Total Amount"] || 0).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={bill["Status"] || "Pending"}
                                size="small"
                                color={bill["Status"] === "Paid" ? "success" : "warning"}
                              />
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                {bill["Status"] !== "Completed" && (
                                  <Tooltip title="Mark as Completed (will subtract stock)">
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() => handleCompleteBill(bill, index)}
                                    >
                                      <CheckIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Download Bill PDF">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handlePrintBill(bill)}
                                  >
                                    <DownloadIcon />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            {search || clientFilter
                              ? "No bills match your search criteria"
                              : "No bills found. Create your first bill!"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredBills.length}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Bill Dialog */}
      <Dialog
        open={openBillDialog}
        onClose={() => setOpenBillDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Create New Bill
            </Typography>
            <IconButton onClick={() => setOpenBillDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Autocomplete
              options={clients}
              value={selectedClient}
              onChange={(event, newValue) => setSelectedClient(newValue)}
              getOptionLabel={(option) =>
                option ? `${option.clientCode} - ${option.clientName}` : ""
              }
              renderInput={(params) => (
                <TextField {...params} label="Select Client *" variant="outlined" />
              )}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="SO Number (Sales Order Number)"
                  value={soNumber}
                  onChange={(e) => setSoNumber(e.target.value)}
                  variant="outlined"
                  fullWidth
                  placeholder="Enter SO number (optional)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="SO Date"
                  type="date"
                  value={soDate}
                  onChange={(e) => setSoDate(e.target.value)}
                  variant="outlined"
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Vehicle Number (Gadi Number)"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  variant="outlined"
                  fullWidth
                  placeholder="Enter vehicle number (optional)"
                />
              </Grid>
            </Grid>

            <Divider>Bill Items</Divider>

            {billItems.map((item, index) => (
              <Card key={index} variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                        Item {index + 1}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveBillItem(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={8}>
                        <Autocomplete
                          options={products}
                          value={products.find((p) => p.productCode === item.productCode) || null}
                          onChange={(event, newValue) => {
                            handleBillItemChange(index, "productCode", newValue?.productCode || "");
                          }}
                          getOptionLabel={(option) =>
                            option ? (option.productName || option.productCode) : ""
                          }
                          renderOption={(props, option) => (
                            <Box component="li" {...props} sx={{ py: 1 }}>
                              <Stack spacing={0.5}>
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                  {option.productName || 'No Product Name'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Code: {option.productCode}
                                  {option.category && ` | Category: ${option.category}`}
                                </Typography>
                              </Stack>
                            </Box>
                          )}
                          renderInput={(params) => {
                            const selectedProduct = products.find((p) => p.productCode === item.productCode);
                            const fullProductName = selectedProduct ? (selectedProduct.productName || selectedProduct.productCode) : '';
                            return (
                              <Tooltip title={fullProductName || "Select a product"} arrow placement="top">
                                <TextField 
                                  {...params} 
                                  label="Product *" 
                                  variant="outlined"
                                  placeholder="Select or type to search product..."
                                  sx={{
                                    width: '100%',
                                    '& .MuiInputBase-root': {
                                      '& .MuiInputBase-input': {
                                        textOverflow: 'unset !important',
                                        overflow: 'visible !important',
                                        whiteSpace: 'nowrap',
                                      },
                                      '& .MuiAutocomplete-input': {
                                        textOverflow: 'unset !important',
                                        overflow: 'visible !important',
                                        whiteSpace: 'nowrap',
                                        width: '100% !important',
                                      }
                                    },
                                    '& .MuiInputBase-input': {
                                      textOverflow: 'unset !important',
                                      overflow: 'visible !important',
                                    }
                                  }}
                                />
                              </Tooltip>
                            );
                          }}
                          sx={{
                            width: '100%',
                            '& .MuiAutocomplete-inputRoot': {
                              '& .MuiAutocomplete-input': {
                                textOverflow: 'unset !important',
                                overflow: 'visible !important',
                                whiteSpace: 'nowrap',
                              }
                            }
                          }}
                          noOptionsText="No products found"
                          filterOptions={(options, state) => {
                            const inputValue = state.inputValue.toLowerCase();
                            return options.filter(option => 
                              (option.productName && option.productName.toLowerCase().includes(inputValue)) ||
                              (option.productCode && option.productCode.toLowerCase().includes(inputValue)) ||
                              (option.category && option.category.toLowerCase().includes(inputValue))
                            );
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Product Code"
                          value={item.productCode}
                          variant="outlined"
                          disabled
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Quantity *"
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleBillItemChange(index, "quantity", e.target.value)
                          }
                          variant="outlined"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Unit"
                          value={item.unit}
                          variant="outlined"
                          disabled
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Rate *"
                          type="number"
                          value={item.rate}
                          onChange={(e) =>
                            handleBillItemChange(index, "rate", e.target.value)
                          }
                          variant="outlined"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Amount"
                          value={item.amount}
                          variant="outlined"
                          disabled
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  </Stack>
                </CardContent>
              </Card>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddBillItem}
              fullWidth
            >
              Add Item
            </Button>

            {billItems.length > 0 && (
              <Card variant="outlined" sx={{ bgcolor: "background.default" }}>
                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography>Subtotal:</Typography>
                      <Typography sx={{ fontWeight: "bold" }}>
                        ₹
                        {billItems
                          .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
                          .toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography>Tax (18%):</Typography>
                      <Typography sx={{ fontWeight: "bold" }}>
                        ₹
                        {(
                          (billItems.reduce(
                            (sum, item) => sum + parseFloat(item.amount || 0),
                            0
                          ) *
                            18) /
                          100
                        ).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Typography>
                    </Stack>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        Total:
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: "bold", color: "success.main" }}>
                        ₹
                        {(
                          billItems.reduce(
                            (sum, item) => sum + parseFloat(item.amount || 0),
                            0
                          ) *
                          1.18
                        ).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBillDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveBill}
            variant="contained"
            disabled={loading || !selectedClient || billItems.length === 0}
            sx={{
              background: "linear-gradient(45deg, #4caf50, #81c784)",
              "&:hover": {
                background: "linear-gradient(45deg, #388e3c, #4caf50)",
              },
            }}
          >
            {loading ? <CircularProgress size={24} /> : "Create Bill"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FGToBilling;

