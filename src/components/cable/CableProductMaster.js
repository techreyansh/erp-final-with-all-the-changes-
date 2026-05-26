import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Stack,
  Divider,
  Pagination,
  InputAdornment,
  useTheme,
} from "@mui/material";
import {
  Cable as CableIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Engineering as EngineeringIcon,
  ElectricalServices as ElectricalIcon,
  ColorLens as ColorIcon,
  AccountTree as BundlingIcon,
  Assignment as POIcon,
  Close as CloseIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
  Scale as ScaleIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Power as PowerIcon,
  Engineering as MoldIcon,
} from "@mui/icons-material";
import sheetService from "../../services/sheetService";
import poService from "../../services/poService";
import LoadingSpinner from "../common/LoadingSpinner";

const CableProductMaster = () => {
  const theme = useTheme();
  const [products, setProducts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [formData, setFormData] = useState({
    productCode: "",
    productName: "",
    cableType: "Three Core",
    productFamily: "Power Cords",
    strandCount: "24",
    conductorSize: "",
    copperSize: "", // For material calculations
    conductorMaterial: "Copper",
    coreCount: "3",
    coreColors: '["Brown", "Blue", "Yellow-Green"]',
    // PO-related fields
    poId: "",
    soId: "", // Sales Order ID
    uniqueId: "", // Unique ID
    clientCode: "",
    quantity: "",
    batchSize: "",
    status: "PENDING",
  });

  useEffect(() => {
    fetchProductsFromSO();
  }, []);

  const fetchProductsFromSO = async () => {
    try {
      setLoading(true);
      // Fetch SO data for production planning
      const soData = await poService.getAllPOs();
      
      // Filter SOs that are relevant for cable production
      const cableProductionSOs = soData.filter(so => 
        so.OrderType === 'CABLE_ONLY' || 
        so.OrderType === 'POWER_CORD' ||
        so.Status === 'CABLE_PRODUCTION'
      );
      
      // Transform SO data to include cable production details
      const enhancedProducts = await Promise.all(
        cableProductionSOs.map(async (so) => {
          try {
            // Try to get existing cable product details if available
            const cableProducts = await sheetService.getSheetData("Cable Products");
            const existingProduct = cableProducts.find(cp => cp.productCode === so.ProductCode);
            
            return {
              ...so,
              // Merge with existing cable product data if available
              cableType: existingProduct?.cableType || "Three Core",
              strandCount: existingProduct?.strandCount || "24",
              conductorSize: existingProduct?.conductorSize || "",
              conductorMaterial: existingProduct?.conductorMaterial || "Copper",
              coreCount: existingProduct?.coreCount || "3",
              coreColors: existingProduct?.coreColors || '["Brown", "Blue", "Yellow-Green"]',
              productFamily: existingProduct?.productFamily || "Power Cords",
              // Keep SO-specific data with SO ID and Unique ID
              poId: so.POId,
              soId: so.SOId || so.POId, // Use SOId if available, fallback to POId
              uniqueId: so.UniqueId || so.POId, // Use UniqueId if available, fallback to POId
              clientCode: so.ClientCode,
              quantity: so.Quantity,
              batchSize: so.BatchSize,
              status: so.Status,
              productName: so.Name,
              productCode: so.ProductCode,
              description: so.Description,
            };
          } catch (error) {
            console.warn(`Error enhancing SO ${so.POId}:`, error);
            return {
              ...so,
              cableType: "Three Core",
              strandCount: "24",
              conductorSize: "",
              conductorMaterial: "Copper",
              coreCount: "3",
              coreColors: '["Brown", "Blue", "Yellow-Green"]',
              productFamily: "Power Cords",
              poId: so.POId,
              soId: so.SOId || so.POId, // Use SOId if available, fallback to POId
              uniqueId: so.UniqueId || so.POId, // Use UniqueId if available, fallback to POId
              clientCode: so.ClientCode,
              quantity: so.Quantity,
              batchSize: so.BatchSize,
              status: so.Status,
              productName: so.Name,
              productCode: so.ProductCode,
              description: so.Description,
            };
          }
        })
      );
      
      // FIXED: Ensure data consistency and add row indices
      const productsWithIndices = enhancedProducts.map((product, index) => ({
        ...product,
        displayIndex: index,
        // Add rowIndex for products that can be edited/deleted
        ...(product.isFromSO ? {} : { rowIndex: index + 2 })
      }));
      
      setProducts(productsWithIndices);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error fetching SO data:", error);
      setSnackbar({
        open: true,
        message: `Error fetching cable production data: ${error.message}`,
        severity: "error",
      });
      // Set empty array on error to prevent stale state
      setProducts([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Update core count and default colors when cable type changes
    if (name === "cableType") {
      let coreCount = "1";
      let defaultColors = '["Black"]';
      
      switch (value) {
        case "Single Core":
          coreCount = "1";
          defaultColors = '["Black"]';
          break;
        case "Two Core":
          coreCount = "2";
          defaultColors = '["Brown", "Blue"]';
          break;
        case "Three Core":
          coreCount = "3";
          defaultColors = '["Brown", "Blue", "Yellow-Green"]';
          break;
        case "Multi Core":
          coreCount = "4";
          defaultColors = '["Brown", "Blue", "Yellow-Green", "Black"]';
          break;
        default:
          coreCount = "3";
          defaultColors = '["Brown", "Blue", "Yellow-Green"]';
      }
      
      setFormData((prev) => ({ 
        ...prev, 
        [name]: value,
        coreCount: coreCount,
        coreColors: defaultColors
      }));
    } else if (name === "conductorSize") {
      // Sync conductorSize with copperSize for material calculations
      setFormData((prev) => ({ 
        ...prev, 
        [name]: value,
        copperSize: value // Keep both for compatibility
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // FIXED: Validate actually required fields for product definition
    const requiredFields = [];
    if (!formData.productCode) requiredFields.push("Product Code");
    if (!formData.productName) requiredFields.push("Product Name");
    if (!formData.conductorSize) requiredFields.push("Conductor Size");
    if (!formData.strandCount) requiredFields.push("Strand Count");
    
    // PO-related fields are only required if this is a PO-integrated product
    if (formData.poId && (!formData.quantity || !formData.batchSize)) {
      if (!formData.quantity) requiredFields.push("Quantity");
      if (!formData.batchSize) requiredFields.push("Batch Size");
    }
    
    if (requiredFields.length > 0) {
      setSnackbar({
        open: true,
        message: `Please fill in required fields: ${requiredFields.join(", ")}`,
        severity: "error",
      });
      return;
    }

    try {
      setLoading(true);
      const currentDate = new Date().toISOString().split('T')[0];
      const productData = {
        ...formData,
        // Ensure compatibility with material calculation service
        copperSize: formData.conductorSize, // Use conductorSize as copperSize
        standardLength: "1.8", // Default standard length
        strandCount: formData.strandCount, // Use form strand count
        outerSheath: "pvc", // Default outer sheath material
        needsBunching: parseInt(formData.strandCount) >= 24, // Bundling required for 24+ strands
        createdDate: selectedProduct ? selectedProduct.createdDate : currentDate,
        lastModified: currentDate,
        // PO-related fields
        poId: formData.poId,
        soId: formData.soId, // Sales Order ID
        uniqueId: formData.uniqueId, // Unique ID
        clientCode: formData.clientCode,
        quantity: formData.quantity,
        batchSize: formData.batchSize,
        status: formData.status || "CABLE_PRODUCTION",
      };

      if (selectedProduct) {
        await sheetService.updateRow(
          "Cable Products",
          selectedProduct.rowIndex,
          productData
        );
        setSnackbar({
          open: true,
          message: "Product updated successfully",
          severity: "success",
        });
      } else {
        await sheetService.appendRow("Cable Products", productData);
        setSnackbar({
          open: true,
          message: "Product added successfully",
          severity: "success",
        });
      }

      handleCloseDialog();
      fetchProductsFromSO(); // Refresh SO data
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error saving product",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product, index) => {
    setSelectedProduct({ ...product, rowIndex: index + 2 }); // +2 for header row
    setFormData({
      productCode: product.productCode || "",
      productName: product.productName || "",
      cableType: product.cableType || "Three Core",
      productFamily: product.productFamily || "Power Cords",
      strandCount: product.strandCount || "24",
      conductorSize: product.conductorSize || "",
      copperSize: product.copperSize || product.conductorSize || "", // Use copperSize or fallback to conductorSize
      conductorMaterial: product.conductorMaterial || "Copper",
      coreCount: product.coreCount || "3",
      coreColors: product.coreColors || '["Brown", "Blue", "Yellow-Green"]',
      // PO-related fields
      poId: product.poId || "",
      soId: product.soId || "", // Sales Order ID
      uniqueId: product.uniqueId || "", // Unique ID
      clientCode: product.clientCode || "",
      quantity: product.quantity || "",
      batchSize: product.batchSize || "",
      status: product.status || "",
    });
    setOpenDialog(true);
  };

  const handleDelete = async (index) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        setLoading(true);
        const productToDelete = products[index];
        
        if (!productToDelete) {
          throw new Error("Product not found");
        }

        // FIXED: Handle different types of products
        if (productToDelete.isFromPO) {
          // For PO-sourced products, we can't delete from Cable Products sheet
          // but we can remove them from the local state
          setSnackbar({
            open: true,
            message: "PO-sourced products cannot be deleted. They are managed through PO Ingestion.",
            severity: "warning",
          });
          return;
        } else {
          // For regular products, delete from sheet
          const rowIndex = productToDelete.rowIndex || (index + 2); // +2 for header row
          await sheetService.deleteRow("Cable Products", rowIndex);
          setSnackbar({
            open: true,
            message: "Product deleted successfully",
            severity: "success",
          });
        }

        // Refresh data after deletion
        fetchProductsFromSO();
      } catch (error) {
        console.error("Delete error:", error);
        setSnackbar({
          open: true,
          message: `Error deleting product: ${error.message}`,
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenDialog = () => {
    setSelectedProduct(null);
    setFormData({
      productCode: "",
      productName: "",
      cableType: "Three Core",
      productFamily: "Power Cords",
      strandCount: "24",
      conductorSize: "",
      copperSize: "", // For material calculations
      conductorMaterial: "Copper",
      coreCount: "3",
      coreColors: '["Brown", "Blue", "Yellow-Green"]',
      // PO-related fields
      poId: "",
      soId: "", // Sales Order ID
      uniqueId: "", // Unique ID
      clientCode: "",
      quantity: "",
      batchSize: "",
      status: "",
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProduct(null);
  };

  const handleColorChange = (index, color) => {
    try {
      const colors = JSON.parse(formData.coreColors);
      colors[index] = color;
      setFormData(prev => ({ 
        ...prev, 
        coreColors: JSON.stringify(colors)
      }));
    } catch (error) {
      console.error("Error updating colors:", error);
    }
  };

  const getColorsArray = () => {
    try {
      return JSON.parse(formData.coreColors);
    } catch (error) {
      return ["Brown", "Blue", "Yellow-Green"];
    }
  };

  const standardColors = [
    "Brown", "Blue", "Yellow-Green", "Black", "Grey", "White", 
    "Red", "Orange", "Yellow", "Green", "Violet", "Pink"
  ];

  const getTypeColor = (type) => {
    const colors = {
      "Three Core": "primary",
      "Two Core": "secondary", 
      "Single Core": "info",
      "Multi Core": "warning",
    };
    return colors[type] || "default";
  };

  const getStatusColor = (status) => {
    const colors = {
      "NEW": "default",
      "CABLE_PRODUCTION": "primary",
      "POWER_CORD_PRODUCTION": "secondary",
      "COMPLETED": "success",
      "CANCELLED": "error",
    };
    return colors[status] || "default";
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get paginated products
  const paginatedProducts = products.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading && !openDialog) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <CableIcon />
          Cable Production Management (From SO Ingestion)
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Manage cable production planning based on Sales Orders and product specifications.
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add New Product
        </Button>
      </Stack>

      {/* Products Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><strong>Unique ID</strong></TableCell>
                <TableCell><strong>SO ID</strong></TableCell>
                <TableCell><strong>Product Code</strong></TableCell>
                <TableCell><strong>Product Name</strong></TableCell>
                <TableCell><strong>Client Code</strong></TableCell>
                <TableCell><strong>Cable Type</strong></TableCell>
                <TableCell><strong>Quantity</strong></TableCell>
                <TableCell><strong>Batch Size</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Colors</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedProducts.map((product, index) => (
                <TableRow key={product.productCode || index} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip
                        label={product.uniqueId || 'N/A'}
                        size="small"
                        sx={{
                          backgroundColor: product.uniqueId ? '#e3f2fd' : '#f5f5f5',
                          color: product.uniqueId ? '#1976d2' : '#9e9e9e',
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip
                        label={product.soId || 'N/A'}
                        size="small"
                        sx={{
                          backgroundColor: product.soId ? '#e8f5e9' : '#f5f5f5',
                          color: product.soId ? '#2e7d32' : '#9e9e9e',
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>{product.productCode}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {product.productName}
                      {product.isFromPO && (
                        <Chip 
                          label="PO" 
                          size="small" 
                          color="info" 
                          sx={{ fontSize: '0.6rem', height: '18px' }}
                        />
                      )}
                      {product.needsConfiguration && (
                        <Chip 
                          label="Needs Config" 
                          size="small" 
                          color="warning" 
                          sx={{ fontSize: '0.6rem', height: '18px' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{product.clientCode || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={product.cableType} 
                      color={getTypeColor(product.cableType)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{product.quantity || 'N/A'}</TableCell>
                  <TableCell>{product.batchSize || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={product.status || 'NEW'}
                      color={getStatusColor(product.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {(() => {
                        try {
                          const colors = JSON.parse(product.coreColors || '["Brown", "Blue", "Yellow-Green"]');
                          return colors.map((color, idx) => (
                            <Chip
                              key={idx}
                              label={color}
                              size="small"
                              sx={{
                                backgroundColor: color === 'Yellow-Green' ? '#ADFF2F' : 
                                               color === 'Brown' ? '#8B4513' :
                                               color === 'Blue' ? '#0000FF' :
                                               color === 'Black' ? '#000000' :
                                               color === 'Grey' ? '#808080' :
                                               color === 'White' ? '#FFFFFF' :
                                               color === 'Red' ? '#FF0000' :
                                               color === 'Orange' ? '#FFA500' :
                                               color === 'Yellow' ? '#FFFF00' :
                                               color === 'Green' ? '#008000' :
                                               color === 'Violet' ? '#8B00FF' :
                                               color === 'Pink' ? '#FFC0CB' : '#808080',
                                color: ['Yellow', 'White', 'Yellow-Green'].includes(color) ? '#000' : '#fff',
                                fontSize: '0.7rem',
                                height: '20px'
                              }}
                            />
                          ));
                        } catch {
                          return <Chip label="N/A" size="small" />;
                        }
                      })()}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      onClick={() => handleEdit(product, page * rowsPerPage + index)}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDelete(page * rowsPerPage + index)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {products.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 2,
            borderTop: '1px solid rgba(102, 126, 234, 0.1)',
            backgroundColor: 'rgba(248, 250, 255, 0.5)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                Rows per page:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(e.target.value);
                    setPage(0);
                  }}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(102, 126, 234, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(102, 126, 234, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                    }
                  }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, products.length)} of {products.length} products
              </Typography>
              
              {Math.ceil(products.length / rowsPerPage) > 1 && (
                <Pagination
                  count={Math.ceil(products.length / rowsPerPage)}
                  page={page + 1}
                  onChange={(event, value) => setPage(value - 1)}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 3,
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      minWidth: 36,
                      height: 36,
                      margin: '0 2px',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                      },
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        fontWeight: 800,
                        boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                        '&:hover': {
                          transform: 'scale(1.15)',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.4)'
                        }
                      }
                    }
                  }}
                />
              )}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Add/Edit Product Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2
        }}>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                color: theme.palette.primary.main,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                mb: 0.5
              }}
            >
              {selectedProduct ? 'Edit Cable Product' : 'Add New Cable Product'}
          </Typography>
            <Typography 
              variant="subtitle1" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
            >
              {selectedProduct ? 'Update existing cable product specifications' : 'Create new cable product entry'}
            </Typography>
          </Box>
          <IconButton 
            onClick={handleCloseDialog}
            sx={{ 
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.light + '20'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                <Grid container spacing={3}>
              {/* Left Column */}
              <Grid item xs={12} md={6}>
                <Stack spacing={3}>
                  {/* Product Code */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                      Product Code **
                    </Typography>
                    <TextField
                      fullWidth
                      name="productCode"
                      value={formData.productCode}
                      onChange={handleInputChange}
                      placeholder="e.g., CBL-3C-2.5SQ"
                      required
                      InputProps={{
                        startAdornment: <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Box>

                  {/* Cable Type */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                      Cable Type **
                    </Typography>
                    <FormControl fullWidth>
                      <Select
                        name="cableType"
                        value={formData.cableType}
                        onChange={handleInputChange}
                        sx={{
                          borderRadius: 2,
                          '& .MuiSelect-icon': {
                            color: 'text.secondary'
                          }
                        }}
                      >
                        <MenuItem value="Single Core">Single Core</MenuItem>
                        <MenuItem value="Two Core">Two Core</MenuItem>
                        <MenuItem value="Three Core">Three Core</MenuItem>
                        <MenuItem value="Multi Core">Multi Core</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Strand Count */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                      Number of Strands **
                </Typography>
                    <TextField
                      fullWidth
                      name="strandCount"
                      type="number"
                      value={formData.strandCount}
                      onChange={handleInputChange}
                      placeholder="e.g., 24"
                      required
                      InputProps={{
                        startAdornment: <ScaleIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        inputProps: { min: 24 }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Box>

                  {/* Conductor Size */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                      Conductor Size (mm²) **
                    </Typography>
                    <TextField
                      fullWidth
                      name="conductorSize"
                      type="number"
                      step="0.1"
                      value={formData.conductorSize}
                      onChange={handleInputChange}
                      placeholder="e.g., 1.5"
                      required
                      InputProps={{
                        startAdornment: <InventoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Box>

                  {/* PO ID */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                      PO ID
                    </Typography>
                    <TextField
                      fullWidth
                      name="poId"
                      value={formData.poId}
                      onChange={handleInputChange}
                      placeholder="e.g., PO-001"
                      InputProps={{
                        startAdornment: <POIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Box>
                </Stack>
                  </Grid>

              {/* Right Column */}
              <Grid item xs={12} md={6}>
                <Stack spacing={3}>
                  {/* Product Name */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                      Product Name **
                    </Typography>
                    <TextField
                      fullWidth
                      name="productName"
                      value={formData.productName}
                      onChange={handleInputChange}
                      placeholder="e.g., 3-Core 2.5sqmm Cable"
                      required
                      InputProps={{
                        startAdornment: <CableIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Box>

                  {/* Product Family */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                      Product Family **
                    </Typography>
                    <FormControl fullWidth>
                      <Select
                        name="productFamily"
                        value={formData.productFamily}
                        onChange={handleInputChange}
                        sx={{
                          borderRadius: 2,
                          '& .MuiSelect-icon': {
                            color: 'text.secondary'
                          }
                        }}
                      >
                        <MenuItem value="Power Cords">Power Cords</MenuItem>
                        <MenuItem value="Extension Cords">Extension Cords</MenuItem>
                        <MenuItem value="Industrial Cables">Industrial Cables</MenuItem>
                        <MenuItem value="Flexible Cables">Flexible Cables</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Conductor Material */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                      Conductor Material **
                    </Typography>
                    <FormControl fullWidth>
                      <Select
                        name="conductorMaterial"
                        value={formData.conductorMaterial}
                        onChange={handleInputChange}
                        sx={{
                          borderRadius: 2,
                          '& .MuiSelect-icon': {
                            color: 'text.secondary'
                          }
                        }}
                      >
                        <MenuItem value="Copper">Copper</MenuItem>
                        <MenuItem value="Aluminum">Aluminum</MenuItem>
                        <MenuItem value="Tinned Copper">Tinned Copper</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Quantity */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                      Quantity **
                      </Typography>
                    <TextField
                      fullWidth
                      name="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="e.g., 1000"
                      required
                      InputProps={{
                        startAdornment: <InventoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                      />
                    </Box>

                  {/* Client Code */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                      Client Code
                </Typography>
                    <TextField
                      fullWidth
                      name="clientCode"
                      value={formData.clientCode}
                      onChange={handleInputChange}
                      placeholder="e.g., CUST-001"
                      InputProps={{
                        startAdornment: <CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Box>
                </Stack>
                  </Grid>

              {/* Core Colors Section */}
                  <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                  Core Colors Configuration
                    </Typography>
                    <Grid container spacing={2}>
                      {getColorsArray().map((color, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <FormControl fullWidth>
                            <InputLabel>Core {index + 1} Color</InputLabel>
                            <Select
                              value={color}
                              onChange={(e) => handleColorChange(index, e.target.value)}
                              label={`Core ${index + 1} Color`}
                          sx={{
                            borderRadius: 2,
                            '& .MuiSelect-icon': {
                              color: 'text.secondary'
                            }
                          }}
                            >
                              {standardColors.map((colorOption) => (
                                <MenuItem key={colorOption} value={colorOption}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box
                                      sx={{
                                        width: 16,
                                        height: 16,
                                        borderRadius: '50%',
                                        backgroundColor: colorOption === 'Yellow-Green' ? '#ADFF2F' : 
                                                        colorOption === 'Brown' ? '#8B4513' :
                                                        colorOption === 'Blue' ? '#0000FF' :
                                                        colorOption === 'Black' ? '#000000' :
                                                        colorOption === 'Grey' ? '#808080' :
                                                        colorOption === 'White' ? '#FFFFFF' :
                                                        colorOption === 'Red' ? '#FF0000' :
                                                        colorOption === 'Orange' ? '#FFA500' :
                                                        colorOption === 'Yellow' ? '#FFFF00' :
                                                        colorOption === 'Green' ? '#008000' :
                                                        colorOption === 'Violet' ? '#8B00FF' :
                                                        colorOption === 'Pink' ? '#FFC0CB' : '#808080',
                                        border: colorOption === 'White' ? '1px solid #ccc' : 'none'
                                      }}
                                    />
                                    {colorOption}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>

                  </Grid>
          </DialogContent>
          <DialogActions sx={{ 
            p: { xs: 3, sm: 4, md: 5 }, 
            borderTop: `1px solid ${theme.palette.divider}`,
            gap: 2,
            justifyContent: 'flex-end'
          }}>
            <Button 
              onClick={handleCloseDialog} 
              startIcon={<CloseIcon />}
                        sx={{
                minWidth: 120,
                px: 3,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: theme.palette.grey[100],
                color: theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: theme.palette.grey[200]
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              startIcon={<CheckCircleIcon />}
              disabled={loading}
              sx={{ 
                minWidth: 140,
                px: 3,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: `0 4px 12px ${theme.palette.primary.main}30`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                  boxShadow: `0 6px 16px ${theme.palette.primary.main}40`,
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {selectedProduct ? 'Update Cable Product' : 'Create Cable Product'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CableProductMaster; 