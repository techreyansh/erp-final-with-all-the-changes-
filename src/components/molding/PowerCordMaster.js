import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
  Paper,
  IconButton,
  Chip,
  Alert,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  useTheme,
  useMediaQuery,
  Stack,
  Divider,
  Pagination,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Power as PowerIcon,
  Cable as CableIcon,
  Engineering as MoldIcon,
  Close as CloseIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
  LocationOn as LocationIcon,
  Scale as ScaleIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlanIcon,
} from "@mui/icons-material";
import sheetService from "../../services/sheetService";

const PowerCordMaster = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const [powerCords, setPowerCords] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    productCode: "",
    productName: "",
    pinType: "2-pin", // 2-pin, 3-pin
    amperage: "6A", // 6A, 16A
    cableType: "", // From cable master
    standardLength: "1.5", // meters
    plugType: "Standard", // Standard, Heavy Duty
    moldingRequired: {
      inner: true,
      outer: true,
      grommet: false
    },
    assemblySteps: [],
    terminalSpecs: "",
    applications: "", // TV, Washing Machine, etc.
    safetyStandards: "", // IS standards
    isActive: true
  });

  useEffect(() => {
    fetchPowerCords();
  }, []);

  // Helper function to map sheet data to component format
  const mapSheetDataToComponent = (sheetData) => {
    return sheetData.map((row, index) => {
      const mapped = {
        id: index + 2, // Row index in sheet (1-based, +1 for header)
        productCode: row["Product Code"] || "",
        productName: row["Product Name"] || "",
        pinType: row["Pin Type"] || row["PinType"] || "",
        amperage: row["Amperage"] || "",
        cableType: row["Cable Type"] || row["CableType"] || "",
        standardLength: row["Standard Length"] || row["StandardLength"] || "",
        plugType: row["Plug Type"] || row["PlugType"] || "",
        moldingRequired: parseMoldingData(row["Molding Require Assembly Steps"]),
        assemblySteps: parseAssemblySteps(row["Molding Require Assembly Steps"]),
        terminalSpecs: row["Terminal Specs"] || "",
        applications: row["Applications"] || "",
        safetyStandards: parseSafetyStandards(row["Safety Standard: Is Active"]),
        isActive: parseIsActive(row["Safety Standard: Is Active"]),
        lastUpdated: row["Last Updated"] || ""
      };
      return mapped;
    });
  };

  // Helper function to parse molding data from sheet
  const parseMoldingData = (moldingString) => {
    if (!moldingString) return { inner: true, outer: true, grommet: false };
    
    try {
      // Try to parse JSON if it's stored as JSON
      const jsonMatch = moldingString.match(/\{.*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback to default
      return { inner: true, outer: true, grommet: false };
    } catch (error) {
      console.error("Error parsing molding data:", error);
      return { inner: true, outer: true, grommet: false };
    }
  };

  // Helper function to parse assembly steps
  const parseAssemblySteps = (assemblyString) => {
    if (!assemblyString) return [];
    
    try {
      // Remove the JSON part and get the assembly steps
      const stepsMatch = assemblyString.replace(/\{.*?\}/, '').trim();
      if (stepsMatch) {
        return stepsMatch.split(", ").filter(step => step.trim());
      }
      return [];
    } catch (error) {
      console.error("Error parsing assembly steps:", error);
      return [];
    }
  };

  // Helper function to parse safety standards
  const parseSafetyStandards = (safetyString) => {
    if (!safetyString) return "";
    
    const parts = safetyString.split(":");
    return parts[0] || "";
  };

  // Helper function to parse isActive status
  const parseIsActive = (safetyString) => {
    if (!safetyString) return true;
    
    return safetyString.toLowerCase().includes("true");
  };

  const fetchPowerCords = async () => {
    try {
      setLoading(true);
      
      // Fetch Dispatch data for molding production
      const dispatchData = await sheetService.getSheetData("Dispatches").catch(() => []);
      
      // Filter dispatches that are relevant for molding production (Power Cords)
      const moldingProductionDispatches = (dispatchData || []).filter(dispatch => 
        dispatch.ProductCode || dispatch.ProductName
      );
      
      // Get Power Cord Master data
      const powerCordMasterData = await sheetService.getSheetData("Power Cord Master").catch(() => []);
      
      // Transform Dispatch data to include power cord details
      const enhancedProducts = await Promise.all(
        moldingProductionDispatches.map(async (dispatch) => {
          try {
            // Try to get existing power cord details if available
            const existingProduct = powerCordMasterData.find(pc => 
              pc["Product Code"] === dispatch.ProductCode || 
              pc["ProductCode"] === dispatch.ProductCode
            );
            
            return {
              // Unique identifier
              id: dispatch.DispatchUniqueId || `${dispatch.UniqueId}-${dispatch.BatchNumber}`,
              // Core product data from Dispatch
              productCode: dispatch.ProductCode,
              productName: dispatch.ProductName || dispatch.ProductCode,
              // Power Cord Master specifications
              pinType: existingProduct?.["Pin Type"] || existingProduct?.["PinType"] || "",
              amperage: existingProduct?.["Amperage"] || "",
              cableType: existingProduct?.["Cable Type"] || existingProduct?.["CableType"] || "",
              standardLength: existingProduct?.["Standard Length"] || existingProduct?.["StandardLength"] || "",
              plugType: existingProduct?.["Plug Type"] || existingProduct?.["PlugType"] || "",
              moldingRequired: parseMoldingData(existingProduct?.["Molding Require Assembly Steps"] || "{}"),
              assemblySteps: parseAssemblySteps(existingProduct?.["Molding Require Assembly Steps"] || "[]"),
              terminalSpecs: existingProduct?.["Terminal Specs"] || "",
              applications: existingProduct?.["Applications"] || "",
              safetyStandards: existingProduct?.["Safety Standards"] || "",
              isActive: true,
              // Dispatch-specific data
              dispatchUniqueId: dispatch.DispatchUniqueId,
              uniqueId: dispatch.UniqueId,
              batchNumber: dispatch.BatchNumber,
              clientCode: dispatch.ClientCode,
              quantity: dispatch.Quantity || dispatch.BatchSize,
              batchSize: dispatch.BatchSize,
              status: dispatch.mouldingProdStatus || dispatch.cableProdStatus || dispatch.Status,
              description: dispatch.Description,
              dueDate: dispatch.MouldingDueDate,
              completedDate: dispatch.mouldingCompletedDate,
              priority: dispatch.Priority || "Medium",
              // Keep original dispatch data for navigation
              ...dispatch
            };
          } catch (error) {
            console.error(`Error processing Dispatch ${dispatch.DispatchUniqueId}:`, error);
            return null;
          }
        })
      );
      
      // Filter out null entries and set the data
      const validProducts = enhancedProducts.filter(product => product !== null);
      setPowerCords(validProducts);
      setPage(0);
      
    } catch (error) {
      console.error("Error fetching power cords from Dispatches:", error);
      setSnackbar({
        open: true,
        message: `Error loading power cord data from Dispatches: ${error.message}`,
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // Navigate to Production Planning with dispatch data
  const handlePlanProduction = (dispatch) => {
    // Store dispatch data in sessionStorage so it can be auto-loaded in production planning
    sessionStorage.setItem('selectedDispatch', JSON.stringify(dispatch));
    // Navigate to production planning page
    navigate('/molding/production-planning');
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.productCode || !formData.productName) {
        setSnackbar({
          open: true,
          message: "Product code and name are required",
          severity: "error"
        });
        return;
      }

      // Check for duplicate product codes (except when editing)
      if (!editingProduct && powerCords.some(p => p.productCode === formData.productCode)) {
        setSnackbar({
          open: true,
          message: "Product code already exists",
          severity: "error"
        });
        return;
      }

      const dataToSave = {
        "Product Code": formData.productCode,
        "Product Name": formData.productName,
        "Pin Type": formData.pinType,
        "Amperage": formData.amperage,
        "Cable Type": formData.cableType,
        "Standard Length": formData.standardLength,
        "Plug Type": formData.plugType,
        "Molding Require Assembly Steps": JSON.stringify(formData.moldingRequired) + " " + (Array.isArray(formData.assemblySteps) ? formData.assemblySteps.join(", ") : formData.assemblySteps),
        "Terminal Specs": formData.terminalSpecs,
        "Applications": formData.applications,
        "Safety Standard: Is Active": formData.safetyStandards + ": " + (formData.isActive ? "TRUE" : "FALSE"),
        "Last Updated": new Date().toISOString()
      };

      if (editingProduct) {
        await sheetService.updateRow("Power Cord Master", editingProduct.id, dataToSave);
        setSnackbar({
          open: true,
          message: "Power cord updated successfully",
          severity: "success"
        });
      } else {
        await sheetService.appendRow("Power Cord Master", dataToSave);
        setSnackbar({
          open: true,
          message: "Power cord added successfully",
          severity: "success"
        });
      }

      fetchPowerCords();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving power cord:", error);
      setSnackbar({
        open: true,
        message: "Error saving power cord",
        severity: "error"
      });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      productCode: product.productCode || "",
      productName: product.productName || "",
      pinType: product.pinType || "2-pin",
      amperage: product.amperage || "6A",
      cableType: product.cableType || "",
      standardLength: product.standardLength || "1.5",
      plugType: product.plugType || "Standard",
      moldingRequired: product.moldingRequired || { inner: true, outer: true, grommet: false },
      assemblySteps: product.assemblySteps || [],
      terminalSpecs: product.terminalSpecs || "",
      applications: product.applications || "",
      safetyStandards: product.safetyStandards || "",
      isActive: product.isActive !== undefined ? product.isActive : true
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this power cord?")) {
      try {
        await sheetService.deleteRow("Power Cord Master", id);
        setSnackbar({
          open: true,
          message: "Power cord deleted successfully",
          severity: "success"
        });
        fetchPowerCords();
      } catch (error) {
        console.error("Error deleting power cord:", error);
        setSnackbar({
          open: true,
          message: "Error deleting power cord",
          severity: "error"
        });
      }
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setFormData({
      productCode: "",
      productName: "",
      pinType: "2-pin",
      amperage: "6A",
      cableType: "",
      standardLength: "1.5",
      plugType: "Standard",
      moldingRequired: {
        inner: true,
        outer: true,
        grommet: false
      },
      assemblySteps: [],
      terminalSpecs: "",
      applications: "",
      safetyStandards: "",
      isActive: true
    });
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get paginated data
  const getPaginatedData = () => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return powerCords.slice(startIndex, endIndex);
  };

  const predefinedPowerCords = [
    {
      productCode: "PC-2P-6A-1.5",
      productName: "2-Pin 6A Power Cord", 
      pinType: "2-pin",
      amperage: "6A",
      cableType: "2C-1.5sqmm",
      standardLength: "1.5",
      plugType: "Standard",
      applications: "TV, Set-top Box, Small Appliances",
      terminalSpecs: "Brass terminals",
      safetyStandards: "IS 1293",
      moldingRequired: { inner: true, outer: true, grommet: false }
    },
    {
      productCode: "PC-3P-6A-1.5",
      productName: "3-Pin 6A Power Cord",
      pinType: "3-pin", 
      amperage: "6A",
      cableType: "3C-1.5sqmm",
      standardLength: "1.5",
      plugType: "Standard",
      applications: "Washing Machine, Cooler, Small Motors",
      terminalSpecs: "Brass terminals",
      safetyStandards: "IS 1293",
      moldingRequired: { inner: true, outer: true, grommet: true }
    },
    {
      productCode: "PC-3P-16A-1.25",
      productName: "3-Pin 16A Power Cord",
      pinType: "3-pin",
      amperage: "16A", 
      cableType: "3C-2.5sqmm",
      standardLength: "1.25",
      plugType: "Heavy Duty",
      applications: "Geyser, Heavy Duty Appliances",
      terminalSpecs: "Silver plated terminals",
      safetyStandards: "IS 1293",
      moldingRequired: { inner: true, outer: true, grommet: true }
    }
  ];

  // Responsive table component for mobile
  const MobileCardView = ({ cord }) => (
    <Card 
      sx={{ 
        mb: 2, 
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={2}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 0.5 }}>
                {cord.productCode || "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {cord.productName || "—"}
              </Typography>
            </Box>
            <Chip 
              label={cord.isActive ? "Active" : "Inactive"} 
              color={cord.isActive ? "success" : "default"}
              size="small"
            />
          </Box>

          <Divider />

          {/* Specifications */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Specifications
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`${cord.pinType || ""} ${cord.amperage || ""}`} size="small" variant="outlined" />
              <Chip label={`${cord.standardLength || ""}m`} size="small" variant="outlined" />
              <Chip label={cord.plugType || ""} size="small" variant="outlined" />
            </Stack>
          </Box>

          {/* Applications */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Applications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {cord.applications || "—"}
            </Typography>
          </Box>

          {/* Molding Required */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Molding Required
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {(() => {
                const molding = cord.moldingRequired || { inner: true, outer: true, grommet: false };
                return (
                  <>
                    {molding.inner && <Chip label="Inner" size="small" sx={{ bgcolor: "#ffeb3b" }} />}
                    {molding.outer && <Chip label="Outer" size="small" sx={{ bgcolor: "#4caf50", color: "white" }} />}
                    {molding.grommet && <Chip label="Grommet" size="small" sx={{ bgcolor: "#ff9800", color: "white" }} />}
                  </>
                );
              })()}
            </Stack>
          </Box>

          {/* Actions */}
          <Box display="flex" justifyContent="flex-end" gap={1}>
            <IconButton onClick={() => handleEdit(cord)} color="primary" size="small">
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => handleDelete(cord.id)} color="error" size="small">
              <DeleteIcon />
            </IconButton>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header Section - Single Line */}
      <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        mb: 3,
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
        gap: { xs: 1, sm: 2 }
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: "bold", 
              color: "#1976d2",
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
            }}
          >
            ⚡ Power Cord Master
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mt: 0.5,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Manage power cord specifications and molding requirements
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ 
            bgcolor: "#1976d2",
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          Add Power Cord
        </Button>
      </Box>

      {/* Quick Add Cards - Single Line Layout */}
      <Box sx={{ mb: 4 }}>
        <Alert 
          severity="info" 
          sx={{ 
            mb: 2,
            '& .MuiAlert-message': {
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }
          }}
        >
          <strong>Industry Standard Power Cords:</strong> Common specifications used in electrical appliances
        </Alert>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          flexWrap: 'nowrap',
          justifyContent: 'space-between'
        }}>
          {predefinedPowerCords.map((cord, index) => (
            <Box key={index} sx={{ flex: 1, minWidth: 0 }}>
            <Card 
              sx={{ 
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                }
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack spacing={2} height="100%">
                  <Box display="flex" alignItems="center" gap={1}>
                    <PowerIcon sx={{ color: theme.palette.primary.main }} />
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '1rem', sm: '1.125rem' }
                      }}
                    >
                      {cord.productName}
                    </Typography>
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    color="primary" 
                    sx={{ fontWeight: 500 }}
                  >
                    {cord.pinType} {cord.amperage}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      flexGrow: 1,
                      fontSize: { xs: '0.825rem', sm: '0.875rem' }
                    }}
                  >
                    {cord.applications}
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => {
                      setFormData({ 
                        ...formData, 
                        ...cord,
                        moldingRequired: cord.moldingRequired || { inner: true, outer: true, grommet: false }
                      });
                      setDialogOpen(true);
                    }}
                    sx={{ mt: 'auto' }}
                  >
                    Quick Add
                  </Button>
                </Stack>
              </CardContent>
            </Card>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Power Cords Display - Responsive */}
      {isMobile ? (
        // Mobile Card View
        <Box>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Power Cords ({powerCords.length})
          </Typography>
          {loading ? (
            <Card sx={{ p: 4, textAlign: 'center', border: `1px dashed ${theme.palette.divider}` }}>
              <Typography color="text.secondary">
                Loading power cords...
              </Typography>
            </Card>
          ) : powerCords.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', border: `1px dashed ${theme.palette.divider}` }}>
              <Typography color="text.secondary">
                No power cords configured. Click "Add Power Cord" to get started.
              </Typography>
            </Card>
          ) : (
            getPaginatedData().map((cord) => (
              <MobileCardView key={cord.id || cord.productCode} cord={cord} />
            ))
          )}
          
          {/* Mobile Pagination */}
          {powerCords.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              p: 2,
              mt: 3,
              borderRadius: 3,
              backgroundColor: 'rgba(248, 250, 255, 0.5)',
              border: '1px solid rgba(102, 126, 234, 0.1)',
              flexWrap: 'wrap',
              gap: 2
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
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                  {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, powerCords.length)} of {powerCords.length} items
                </Typography>
                
                {Math.ceil(powerCords.length / rowsPerPage) > 1 && (
                  <Pagination
                    count={Math.ceil(powerCords.length / rowsPerPage)}
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
        </Box>
      ) : (
        // Desktop Table View
        <TableContainer 
          component={Paper} 
          sx={{ 
            mt: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden'
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 600 }}>Dispatch ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Unique ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Batch</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Completed Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Dispatch Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getPaginatedData().map((cord) => (
                <TableRow key={cord.id || cord.productCode} hover>
                  <TableCell>
                    <Tooltip title="Click to plan production">
                      <Chip 
                        label={cord.dispatchUniqueId || "—"} 
                        size="small" 
                        onClick={() => handlePlanProduction(cord)}
                        sx={{ 
                          bgcolor: "#e8f5e9", 
                          color: "#2e7d32", 
                          fontWeight: "bold",
                          cursor: "pointer",
                          "&:hover": {
                            bgcolor: "#c8e6c9",
                            transform: "scale(1.05)",
                          },
                          transition: "all 0.2s"
                        }}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Click to plan production">
                      <Box 
                        onClick={() => handlePlanProduction(cord)}
                        sx={{ 
                          bgcolor: "#f3e5f5", 
                          p: 1, 
                          borderRadius: 1,
                          cursor: "pointer",
                          "&:hover": {
                            bgcolor: "#e1bee7",
                            transform: "scale(1.02)",
                          },
                          transition: "all 0.2s"
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: "bold", color: "#7b1fa2" }}>
                          {cord.uniqueId || "—"}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: "bold", color: "#1976d2" }}>
                      {cord.clientCode || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {cord.productCode || "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cord.productName || "—"}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Chip 
                        label={cord.batchNumber ? `Batch ${cord.batchNumber}` : "—"} 
                        size="small" 
                        sx={{ bgcolor: "#fff3e0", color: "#e65100", fontWeight: "bold", mb: 0.5 }}
                      />
                      <Typography variant="caption" color="text.secondary" display="block">
                        {cord.quantity || cord.batchSize || 0} pcs
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: cord.completedDate ? "#2e7d32" : "text.secondary", fontStyle: cord.completedDate ? "normal" : "italic" }}>
                      {cord.completedDate ? new Date(cord.completedDate).toLocaleDateString() : "Not completed"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: "#2e7d32" }}>
                      {cord.DispatchDate ? new Date(cord.DispatchDate).toLocaleDateString() : "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Plan Production">
                        <IconButton onClick={() => handlePlanProduction(cord)} color="success" size="small">
                          <PlanIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleEdit(cord)} color="primary" size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDelete(cord.id)} color="error" size="small">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      Loading dispatch data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : powerCords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No dispatches found for molding production.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          {powerCords.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              p: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
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
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                  {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, powerCords.length)} of {powerCords.length} items
                </Typography>
                
                {Math.ceil(powerCords.length / rowsPerPage) > 1 && (
                  <Pagination
                    count={Math.ceil(powerCords.length / rowsPerPage)}
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
        </TableContainer>
      )}

      {/* Add/Edit Dialog - Responsive */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 2 },
            m: { xs: 0, sm: 2 }
          }
        }}
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
              {editingProduct ? "Edit Power Cord" : "Add New Power Cord"}
            </Typography>
            <Typography 
              variant="subtitle1" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
            >
              {editingProduct ? "Update existing power cord specifications" : "Create new power cord entry"}
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
                    value={formData.productCode}
                    onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                    placeholder="e.g., PC-3P-16A-1.25"
                    size={isMobile ? "small" : "medium"}
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

                {/* Pin Type */}
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                    Pin Type **
                  </Typography>
                  <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                    <Select
                      value={formData.pinType}
                      onChange={(e) => setFormData({ ...formData, pinType: e.target.value })}
                      sx={{
                        borderRadius: 2,
                        '& .MuiSelect-icon': {
                          color: 'text.secondary'
                        }
                      }}
                    >
                      <MenuItem value="2-pin">2-Pin</MenuItem>
                      <MenuItem value="3-pin">3-Pin</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Standard Length */}
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                    Standard Length (m) **
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    step="0.25"
                    value={formData.standardLength}
                    onChange={(e) => setFormData({ ...formData, standardLength: e.target.value })}
                    size={isMobile ? "small" : "medium"}
                    InputProps={{
                      startAdornment: <ScaleIcon sx={{ mr: 1, color: 'text.secondary' }} />
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
                  <TextField
                    fullWidth
                    value={formData.cableType}
                    onChange={(e) => setFormData({ ...formData, cableType: e.target.value })}
                    placeholder="e.g., 3C-2.5sqmm"
                    size={isMobile ? "small" : "medium"}
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
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="e.g., 3-Pin 16A Power Cord"
                    size={isMobile ? "small" : "medium"}
                    InputProps={{
                      startAdornment: <PowerIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Box>

                {/* Amperage */}
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                    Amperage **
                  </Typography>
                  <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                    <Select
                      value={formData.amperage}
                      onChange={(e) => setFormData({ ...formData, amperage: e.target.value })}
                      sx={{
                        borderRadius: 2,
                        '& .MuiSelect-icon': {
                          color: 'text.secondary'
                        }
                      }}
                    >
                      <MenuItem value="6A">6A</MenuItem>
                      <MenuItem value="16A">16A</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Plug Type */}
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                    Plug Type **
                  </Typography>
                  <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                    <Select
                      value={formData.plugType}
                      onChange={(e) => setFormData({ ...formData, plugType: e.target.value })}
                      sx={{
                        borderRadius: 2,
                        '& .MuiSelect-icon': {
                          color: 'text.secondary'
                        }
                      }}
                    >
                      <MenuItem value="Standard">Standard</MenuItem>
                      <MenuItem value="Heavy Duty">Heavy Duty</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Safety Standards */}
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                    Safety Standards **
                  </Typography>
                  <TextField
                    fullWidth
                    value={formData.safetyStandards}
                    onChange={(e) => setFormData({ ...formData, safetyStandards: e.target.value })}
                    placeholder="e.g., IS 1293, IEC 60320"
                    size={isMobile ? "small" : "medium"}
                    InputProps={{
                      startAdornment: <WarningIcon sx={{ mr: 1, color: 'text.secondary' }} />
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

            {/* Molding Required Section */}
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                Molding Required
              </Typography>
              <Stack direction={isMobile ? "column" : "row"} spacing={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.moldingRequired.inner}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        moldingRequired: { ...formData.moldingRequired, inner: e.target.checked }
                      })}
                    />
                  }
                  label="Inner Molding"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.moldingRequired.outer}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        moldingRequired: { ...formData.moldingRequired, outer: e.target.checked }
                      })}
                    />
                  }
                  label="Outer Molding"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.moldingRequired.grommet}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        moldingRequired: { ...formData.moldingRequired, grommet: e.target.checked }
                      })}
                    />
                  }
                  label="Grommet"
                />
              </Stack>
            </Grid>

            {/* Active Product */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active Product"
                sx={{ 
                  '& .MuiFormControlLabel-label': {
                    fontWeight: 600
                  }
                }}
              />
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
            variant="contained" 
            onClick={handleSubmit}
            startIcon={<CheckCircleIcon />}
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
            {editingProduct ? "Update Power Cord" : "Create Power Cord"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      {snackbar.open && (
        <Alert 
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ 
            position: "fixed", 
            bottom: { xs: 20, sm: 20 }, 
            right: { xs: 20, sm: 20 },
            left: { xs: 20, sm: 'auto' },
            zIndex: 9999,
            maxWidth: { xs: 'calc(100vw - 40px)', sm: 400 }
          }}
        >
          {snackbar.message}
        </Alert>
      )}
    </Box>
  );
};

export default PowerCordMaster; 