import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Button,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Stack,
  IconButton,
  Collapse,
  LinearProgress,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Cable as CableIcon,
  ContentCut as CuttingIcon,
  Search as SearchIcon,
  Info as InfoIcon,
  Engineering as PlanningIcon,
  Calculate as CalculateIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckIcon,
  Assignment as OrderIcon,
  Inventory as MaterialIcon,
} from "@mui/icons-material";
import sheetService from "../../services/sheetService";
import poService from "../../services/poService";

const CableCuttingPlanSelector = ({ onPlanGenerated }) => {
  const theme = useTheme();
  
  // State management
  const [orders, setOrders] = useState([]);
  const [powerCords, setPowerCords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProductCode, setSelectedProductCode] = useState("");
  const [autoFetchedData, setAutoFetchedData] = useState(null);
  const [cuttingPlan, setCuttingPlan] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Form data for cutting plan
  const [planData, setPlanData] = useState({
    cableLengthAvailable: -1, // From cable production output
    targetLength: "1.5m", // Default target length
    expectedPieces: -1, // Auto-calculated
    wastagePercentage: 5, // Default 5% wastage
    priority: "Medium",
    dueDate: "",
    remarks: ""
  });

  // Load initial data
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-fetch when order or product code changes
  useEffect(() => {
    if (selectedOrder && selectedProductCode && powerCords.length > 0) {
      autoFetchPowerCordData();
    }
  }, [selectedOrder, selectedProductCode, powerCords]);

  // Auto-calculate expected pieces when available length or target length changes
  useEffect(() => {
    if (planData.cableLengthAvailable > 0 && planData.targetLength) {
      const availableLength = parseFloat(planData.cableLengthAvailable);
      const targetLength = parseFloat(planData.targetLength.replace('m', ''));
      const expectedPieces = Math.floor(availableLength / targetLength);
      setPlanData(prev => ({ ...prev, expectedPieces }));
    }
  }, [planData.cableLengthAvailable, planData.targetLength]);

  // Sample data for demonstration
  const sampleOrders = [
    { POId: "PO-2024-001", ClientCode: "BAJAJ", Name: "3-Pin Power Cord", ProductCode: "PC-3P-6A-1.5", Quantity: 1000, OrderType: "POWER_CORD", Status: "NEW" },
    { POId: "PO-2024-002", ClientCode: "LG", Name: "2-Pin Power Cord", ProductCode: "PC-2P-6A-1.5", Quantity: 500, OrderType: "POWER_CORD", Status: "CABLE_PRODUCTION" },
    { POId: "PO-2024-003", ClientCode: "SAMSUNG", Name: "3-Pin Heavy Duty", ProductCode: "PC-3P-16A-1.25", Quantity: 2000, OrderType: "POWER_CORD", Status: "NEW" },
  ];

  const samplePowerCords = [
    {
      id: 1,
      productCode: "PC-2P-6A-1.5",
      productName: "2-Pin 6A Power Cord",
      pinType: "2-pin",
      amperage: "6A",
      cableType: "2C-1.5sqmm",
      standardLength: 1.5,
      plugType: "Standard",
      applications: "TV, Set-top Box, Small Appliances",
      isActive: true
    },
    {
      id: 2,
      productCode: "PC-3P-6A-1.5",
      productName: "3-Pin 6A Power Cord",
      pinType: "3-pin",
      amperage: "6A",
      cableType: "3C-1.5sqmm",
      standardLength: 1.5,
      plugType: "Standard",
      applications: "Washing Machine, Cooler, Small Motors",
      isActive: true
    },
    {
      id: 3,
      productCode: "PC-3P-16A-1.25",
      productName: "3-Pin 16A Power Cord",
      pinType: "3-pin",
      amperage: "16A",
      cableType: "3C-2.5sqmm",
      standardLength: 1.25,
      plugType: "Heavy Duty",
      applications: "Geyser, Heavy Duty Appliances",
      isActive: true
    }
  ];

  // Fetch orders and power cord data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Try to fetch real PO data, fallback to sample data
      try {
        const poData = await poService.getAllPOs();
        const cableOrders = poData.filter(po => 
          po.OrderType === 'CABLE_ONLY' || 
          po.OrderType === 'POWER_CORD' ||
          po.Status === 'CABLE_PRODUCTION' ||
          po.Status === 'NEW'
        );
        
        if (cableOrders.length > 0) {
          setOrders(cableOrders);
        } else {
          setOrders(sampleOrders);
        }
      } catch (poError) {
        console.warn("PO service not available, using sample data:", poError);
        setOrders(sampleOrders);
      }

      // Try to fetch power cord master data, fallback to sample data
      try {
        const powerCordData = await sheetService.getSheetData("Power Cord Master");
        if (powerCordData && powerCordData.length > 0) {
          const mappedPowerCords = powerCordData.map((row, index) => ({
            id: index + 2,
            productCode: row["Product Code"] || "",
            productName: row["Product Name"] || "",
            pinType: row["Pin Type"] || "2-pin",
            amperage: row["Amperage"] || "6A",
            cableType: row["Cable Type"] || "",
            standardLength: parseFloat(row["Standard Length"]) || 1.5,
            plugType: row["Plug Type"] || "Standard",
            moldingRequired: parseMoldingData(row["Molding Require Assembly Steps"]),
            assemblySteps: parseAssemblySteps(row["Molding Require Assembly Steps"]),
            terminalSpecs: row["Terminal Specs"] || "",
            applications: row["Applications"] || "",
            safetyStandards: parseSafetyStandards(row["Safety Standard: Is Active"]),
            isActive: parseIsActive(row["Safety Standard: Is Active"]),
            lastUpdated: row["Last Updated"] || ""
          }));
          setPowerCords(mappedPowerCords);
        } else {
          setPowerCords(samplePowerCords);
        }
      } catch (powerCordError) {
        console.warn("Power Cord Master sheet not found, using sample data:", powerCordError);
        setPowerCords(samplePowerCords);
        setSnackbar({
          open: true,
          message: "Using sample Power Cord data. To use real data, please set up Power Cord Master sheet.",
          severity: "info"
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Use sample data as fallback
      setOrders(sampleOrders);
      setPowerCords(samplePowerCords);
      setSnackbar({
        open: true,
        message: "Using sample data. Check console for details.",
        severity: "warning"
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to parse power cord data
  const parseMoldingData = (moldingString) => {
    if (!moldingString) return { inner: true, outer: true, grommet: false };
    try {
      const jsonMatch = moldingString.match(/\{.*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { inner: true, outer: true, grommet: false };
    } catch (error) {
      return { inner: true, outer: true, grommet: false };
    }
  };

  const parseAssemblySteps = (assemblyString) => {
    if (!assemblyString) return [];
    try {
      const stepsMatch = assemblyString.replace(/\{.*?\}/, '').trim();
      if (stepsMatch) {
        return stepsMatch.split(", ").filter(step => step.trim());
      }
      return [];
    } catch (error) {
      return [];
    }
  };

  const parseSafetyStandards = (safetyString) => {
    if (!safetyString) return "";
    const parts = safetyString.split(":");
    return parts[0] || "";
  };

  const parseIsActive = (safetyString) => {
    if (!safetyString) return true;
    return safetyString.toLowerCase().includes("true");
  };

    // Auto-fetch power cord data based on selections
  const autoFetchPowerCordData = async () => {
    try {

      // Find matching power cord data
      const powerCord = powerCords.find(pc => pc.productCode === selectedProductCode);
      
      if (powerCord && selectedOrder) {
        const fetchedData = {
          order: selectedOrder,
          powerCord: powerCord,
          orderQuantity: selectedOrder.Quantity || 0,
          orderDescription: selectedOrder.Description || selectedOrder.Name || "",
          clientCode: selectedOrder.ClientCode || "",
          suggestedLength: powerCord.standardLength || 1.5,
          cableType: powerCord.cableType || "",
          moldingRequirements: powerCord.moldingRequired || {},
          assemblySteps: powerCord.assemblySteps || [],
          applications: powerCord.applications || "",
          terminalSpecs: powerCord.terminalSpecs || ""
        };

        setAutoFetchedData(fetchedData);
        
        // For cable cutting, we use order quantity as total cable length available
        // For example: if order is for 1000 pieces of 1.5m cables, we have 1500m of cable available
        const totalCableLengthProduced = (selectedOrder.Quantity || 0) * (powerCord.standardLength || 1.5);
        
        // Auto-populate plan data
        setPlanData(prev => ({
          ...prev,
          cableLengthAvailable: totalCableLengthProduced,
          targetLength: `${powerCord.standardLength || 1.5}m`,
          expectedPieces: Math.floor(totalCableLengthProduced / (powerCord.standardLength || 1.5))
        }));

        setSnackbar({
          open: true,
          message: `Auto-fetched: ${powerCord.productName} specifications`,
          severity: "success"
        });
      } else {
      }
    } catch (error) {
      console.error("Error auto-fetching data:", error);
      setSnackbar({
        open: true,
        message: "Error auto-fetching power cord specifications",
        severity: "error"
      });
    }
  };

  // Calculate cutting plan
  const calculateCuttingPlan = () => {
    if (!autoFetchedData || planData.cableLengthAvailable <= 0) {
      setSnackbar({
        open: true,
        message: "Please select order and product code to auto-fetch data",
        severity: "error"
      });
      return;
    }

    const availableLength = parseFloat(planData.cableLengthAvailable);
    const targetLength = parseFloat(planData.targetLength.replace('m', ''));
    const wastage = parseFloat(planData.wastagePercentage) / 100;

    // Basic cutting calculations
    const expectedPieces = Math.floor(availableLength / targetLength);
    const totalLengthRequired = expectedPieces * targetLength;
    const wastageLength = totalLengthRequired * wastage;
    const totalLengthWithWastage = totalLengthRequired + wastageLength;

    // Core calculations for multi-core cables
    const coreColors = getCoreColors(autoFetchedData.powerCord);
    const coreCount = coreColors.length;
    const totalSingleCoreLength = totalLengthWithWastage * coreCount;

    // Material calculations
    const copperSize = parseFloat(autoFetchedData.powerCord.cableType?.match(/(\d+\.?\d*)/)?.[1] || "1.5");
    const copperWeight = calculateCopperWeight(totalSingleCoreLength, copperSize);
    const pvcWeight = calculatePVCWeight(totalSingleCoreLength);

    // Cutting schedule
    const cuttingSchedule = generateCuttingSchedule(expectedPieces, targetLength, coreColors, autoFetchedData.powerCord);

    const plan = {
      id: `CCP-${Date.now()}`,
      orderNumber: selectedOrder.POId,
      productCode: selectedProductCode,
      productName: autoFetchedData.powerCord.productName,
      totalQuantity: expectedPieces,
      cableLength: targetLength,
      totalLengthRequired,
      wastagePercentage: planData.wastagePercentage,
      wastageLength,
      totalLengthWithWastage,
      coreColors,
      coreCount,
      totalSingleCoreLength,
      materialRequirements: {
        copper: {
          totalWeight: copperWeight,
          size: copperSize,
          perCore: copperWeight / coreCount
        },
        pvc: {
          totalWeight: pvcWeight,
          perCore: pvcWeight / coreCount
        }
      },
      moldingRequirements: autoFetchedData.moldingRequirements,
      assemblySteps: autoFetchedData.assemblySteps,
      cuttingSchedule,
      priority: planData.priority,
      dueDate: planData.dueDate,
      remarks: planData.remarks,
      createdDate: new Date().toISOString(),
      status: "Planning"
    };

    setCuttingPlan(plan);
    setShowDetails(true);

    // Callback to parent component
    if (onPlanGenerated) {
      onPlanGenerated(plan);
    }

    setSnackbar({
      open: true,
      message: "Cable cutting plan generated successfully!",
      severity: "success"
    });
  };

  // Helper function to get core colors
  const getCoreColors = (powerCord) => {
    if (powerCord.pinType === "2-pin") {
      return ["Brown", "Blue"];
    } else if (powerCord.pinType === "3-pin") {
      return ["Brown", "Blue", "Yellow-Green"];
    } else {
      // Parse from cable type or default
      const coreMatch = powerCord.cableType?.match(/(\d+)C/);
      const coreCount = coreMatch ? parseInt(coreMatch[1]) : 3;
      
      const colorMap = {
        1: ["Brown"],
        2: ["Brown", "Blue"],
        3: ["Brown", "Blue", "Yellow-Green"],
        4: ["Brown", "Blue", "Yellow-Green", "Black"],
        5: ["Brown", "Blue", "Yellow-Green", "Black", "Grey"]
      };
      
      return colorMap[coreCount] || ["Brown", "Blue", "Yellow-Green"];
    }
  };

  // Calculate copper weight
  const calculateCopperWeight = (totalLength, copperSize) => {
    const copperDensity = 8.96; // g/cm³
    const crossSectionArea = copperSize; // mm²
    const volume = (totalLength * 1000 * crossSectionArea) / 1000000; // cm³
    return Math.round((volume * copperDensity) / 1000 * 100) / 100; // kg
  };

  // Calculate PVC weight
  const calculatePVCWeight = (totalLength) => {
    // Approximate PVC weight calculation
    return Math.round(totalLength * 0.05 * 100) / 100; // kg
  };

  // Generate cutting schedule
  const generateCuttingSchedule = (quantity, length, coreColors, powerCord) => {
    const schedule = [];
    
    coreColors.forEach((color, index) => {
      schedule.push({
        step: index + 1,
        operation: `Cut ${color} core wire`,
        color: color,
        length: quantity * length,
        unit: "meters",
        sequence: index + 1,
        machine: "Wire Cutting Machine",
        estimatedTime: Math.ceil((quantity * length) / 1000 * 0.5), // hours
        notes: `${powerCord.cableType} - ${color} core`
      });
    });

    return schedule;
  };

  // Get available product codes based on selected order
  const getAvailableProductCodes = () => {
    if (!selectedOrder) return powerCords;
    
    // If order has specific product code, filter to that
    if (selectedOrder.ProductCode) {
      return powerCords.filter(pc => pc.productCode === selectedOrder.ProductCode);
    }
    
    // Otherwise return all active power cords
    return powerCords.filter(pc => pc.isActive);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: "white",
          borderRadius: 3,
          mb: 3,
          overflow: "hidden",
          position: "relative"
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            opacity: 0.3,
          }}
        />
        <CardContent sx={{ p: 4, position: "relative", zIndex: 1 }}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems="center" spacing={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: alpha("#ffffff", 0.15),
                backdropFilter: "blur(10px)"
              }}
            >
              <CuttingIcon sx={{ fontSize: 40 }} />
            </Box>
                         <Box sx={{ textAlign: { xs: "center", sm: "left" } }}>
               <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                 Cable Cutting Plan
               </Typography>
               <Typography variant="h6" sx={{ opacity: 0.9 }}>
                 Select order and product code to auto-fetch from Power Cord Master
               </Typography>
             </Box>
          </Stack>
        </CardContent>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Selection Section */}
      <Card sx={{ mb: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
            <OrderIcon color="primary" />
            Order and Product Selection
          </Typography>
          
          {/* Debug Info */}
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Data Status:</strong> {orders.length} orders loaded, {powerCords.length} power cord products available
            </Typography>
          </Alert>
          
          <Grid container spacing={3}>
            {/* Order Number Selection */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                fullWidth
                options={orders}
                getOptionLabel={(option) => `${option.POId} - ${option.ClientCode}`}
                value={selectedOrder}
                onChange={(event, newValue) => {
                  setSelectedOrder(newValue);
                  // Auto-select product code if order has one
                  if (newValue?.ProductCode) {
                    setSelectedProductCode(newValue.ProductCode);
                  } else {
                    setSelectedProductCode("");
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Order Number"
                    variant="outlined"
                    helperText={orders.length > 0 
                      ? `${orders.length} cable orders available` 
                      : "No cable orders found"
                    }
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box sx={{ width: "100%" }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {option.POId}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.ClientCode} - {option.Name}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        <Chip label={option.OrderType} size="small" variant="outlined" />
                        <Chip label={option.Status} size="small" color="info" />
                      </Stack>
                    </Box>
                  </li>
                )}
              />
            </Grid>

            {/* Product Code Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Product Code</InputLabel>
                <Select
                  value={selectedProductCode}
                  onChange={(e) => setSelectedProductCode(e.target.value)}
                  label="Product Code"
                  disabled={!selectedOrder}
                >
                  {getAvailableProductCodes().map((powerCord) => (
                    <MenuItem key={powerCord.productCode} value={powerCord.productCode}>
                      <Box>
                        <Typography variant="body1">
                          {powerCord.productCode}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {powerCord.productName} - {powerCord.pinType} {powerCord.amperage}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {selectedOrder && !selectedOrder.ProductCode && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Select product code manually for this order
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>

                     {/* Auto-fetched Data Display */}
           {autoFetchedData && (
             <Box sx={{ mt: 3 }}>
               <Alert
                 severity="success"
                 icon={<CheckIcon />}
                 sx={{ mb: 2 }}
               >
                 <Typography variant="body1" sx={{ fontWeight: 600 }}>
                   Auto-fetched: {autoFetchedData.powerCord.productName} ({autoFetchedData.powerCord.productCode})
                 </Typography>
                 <Typography variant="body2">
                   Cable Type: {autoFetchedData.cableType || "Not specified"} | Standard Length: {autoFetchedData.suggestedLength}m
                 </Typography>
               </Alert>
             </Box>
           )}
        </CardContent>
      </Card>

             {/* Plan Parameters */}
       {autoFetchedData && (
         <Card sx={{ mb: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
           <CardContent sx={{ p: 4 }}>
             <Typography variant="h6" sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
               <PlanningIcon color="primary" />
               Cutting Plan Parameters
             </Typography>
             
             <Grid container spacing={3}>
               <Grid item xs={12} sm={6}>
                 <TextField
                   fullWidth
                   label="Cable Length Available (m)"
                   type="number"
                   value={planData.cableLengthAvailable}
                   onChange={(e) => setPlanData(prev => ({ ...prev, cableLengthAvailable: e.target.value }))}
                   helperText="From cable production output"
                 />
               </Grid>
               <Grid item xs={12} sm={6}>
                 <FormControl fullWidth>
                   <InputLabel>Target Length</InputLabel>
                   <Select
                     value={planData.targetLength}
                     onChange={(e) => setPlanData(prev => ({ ...prev, targetLength: e.target.value }))}
                     label="Target Length"
                   >
                     <MenuItem value="1.5m">1.5m</MenuItem>
                     <MenuItem value="2.0m">2.0m</MenuItem>
                     <MenuItem value="2.5m">2.5m</MenuItem>
                     <MenuItem value="3.0m">3.0m</MenuItem>
                     <MenuItem value="5.0m">5.0m</MenuItem>
                   </Select>
                 </FormControl>
               </Grid>
               <Grid item xs={12} sm={6}>
                 <TextField
                   fullWidth
                   label="Expected Pieces"
                   type="number"
                   value={planData.expectedPieces}
                   InputProps={{ readOnly: true }}
                   helperText="Auto-calculated"
                 />
               </Grid>
               <Grid item xs={12} sm={6}>
                 <TextField
                   fullWidth
                   label="Wastage %"
                   type="number"
                   step="0.1"
                   value={planData.wastagePercentage}
                   onChange={(e) => setPlanData(prev => ({ ...prev, wastagePercentage: e.target.value }))}
                   InputProps={{ endAdornment: "%" }}
                 />
               </Grid>
             </Grid>
             
             <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
               <Button
                 variant="contained"
                 size="large"
                 startIcon={<CalculateIcon />}
                 onClick={calculateCuttingPlan}
                 disabled={!autoFetchedData || planData.cableLengthAvailable <= 0}
                 sx={{ px: 4 }}
               >
                 Generate Production Schedule
               </Button>
               
               <Button
                 variant="outlined"
                 size="large"
                 startIcon={<SearchIcon />}
                 onClick={fetchData}
                 disabled={loading}
               >
                 Refresh Data
               </Button>
             </Box>
           </CardContent>
         </Card>
       )}

      {/* Generated Cutting Plan */}
      {cuttingPlan && (
        <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.success.main}` }}>
          <CardContent sx={{ p: 0 }}>
            {/* Plan Header */}
            <Box
              sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                borderBottom: `1px solid ${theme.palette.success.main}`,
                p: 3
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.success.main, mb: 1 }}>
                    Cutting Plan Generated
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Plan ID: {cuttingPlan.id} | Order: {cuttingPlan.orderNumber}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setShowDetails(!showDetails)}
                  sx={{ color: theme.palette.success.main }}
                >
                  {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Stack>
            </Box>

            <Collapse in={showDetails}>
              <Box sx={{ p: 3 }}>
                {/* Summary Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ textAlign: "center", p: 2 }}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                        {cuttingPlan.totalQuantity}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Pieces
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ textAlign: "center", p: 2 }}>
                      <Typography variant="h4" color="secondary" sx={{ fontWeight: 700 }}>
                        {cuttingPlan.totalLengthWithWastage.toLocaleString()}m
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Length (with wastage)
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ textAlign: "center", p: 2 }}>
                      <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                        {cuttingPlan.coreCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Core Count
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ textAlign: "center", p: 2 }}>
                      <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                        {cuttingPlan.materialRequirements.copper.totalWeight}kg
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Copper Required
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>

                {/* Core Colors Breakdown */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <MaterialIcon color="primary" />
                    Core Wire Breakdown
                  </Typography>
                  <Grid container spacing={2}>
                    {cuttingPlan.coreColors.map((color, index) => (
                      <Grid item xs={12} sm={6} md={4} key={color}>
                        <Card variant="outlined" sx={{ p: 2 }}>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                backgroundColor: color === 'Yellow-Green' ? '#ADFF2F' : 
                                               color === 'Brown' ? '#8B4513' :
                                               color === 'Blue' ? '#0000FF' :
                                               color === 'Black' ? '#000000' :
                                               color === 'Grey' ? '#808080' : '#808080',
                                border: "1px solid #ccc",
                              }}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {color}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {cuttingPlan.totalLengthWithWastage.toLocaleString()}m
                              </Typography>
                            </Box>
                          </Stack>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Cutting Schedule */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <CuttingIcon color="primary" />
                    Cutting Schedule
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Step</TableCell>
                          <TableCell>Operation</TableCell>
                          <TableCell>Color</TableCell>
                          <TableCell>Length (m)</TableCell>
                          <TableCell>Estimated Time (hrs)</TableCell>
                          <TableCell>Machine</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cuttingPlan.cuttingSchedule.map((step, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Chip label={step.step} size="small" color="primary" />
                            </TableCell>
                            <TableCell>{step.operation}</TableCell>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Box
                                  sx={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: "50%",
                                    backgroundColor: step.color === 'Yellow-Green' ? '#ADFF2F' : 
                                                   step.color === 'Brown' ? '#8B4513' :
                                                   step.color === 'Blue' ? '#0000FF' :
                                                   step.color === 'Black' ? '#000000' :
                                                   step.color === 'Grey' ? '#808080' : '#808080',
                                    border: "1px solid #ccc",
                                  }}
                                />
                                <Typography variant="body2">{step.color}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>{step.length.toLocaleString()}</TableCell>
                            <TableCell>{step.estimatedTime}</TableCell>
                            <TableCell>{step.machine}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* Snackbar for notifications */}
      {snackbar.open && (
        <Alert 
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ 
            position: "fixed", 
            bottom: 20, 
            right: 20,
            zIndex: 9999,
            maxWidth: 400
          }}
        >
          {snackbar.message}
        </Alert>
      )}
    </Box>
  );
};

export default CableCuttingPlanSelector;
