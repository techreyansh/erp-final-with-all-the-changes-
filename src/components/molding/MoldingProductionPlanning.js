import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
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
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Divider,
  Autocomplete,
  Snackbar,
} from "@mui/material";
import {
  ExpandMore,
  ContentCut as CutIcon,
  Build as AssemblyIcon,
  Engineering as MoldingIcon,
  LocalShipping as PackingIcon,
  Schedule as ScheduleIcon,
  PlayArrow as StartIcon,
  Analytics as OptimizeIcon,
  Cable as CableIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import sheetService from "../../services/sheetService";

const MoldingProductionPlanning = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [planningData, setPlanningData] = useState({
    dispatchUniqueId: "",
    uniqueId: "",
    batchNumber: "",
    clientCode: "",
    productCode: "",
    productName: "",
    quantity: "",
    cableLength: "", // From cable production
    targetLength: "1.5", // Target cut length
    expectedPieces: 0,
    actualCutPieces: 0,
    completedDate: "",
    dispatchDate: ""
  });

  const [assemblySchedule, setAssemblySchedule] = useState([]);
  const [moldingSchedule, setMoldingSchedule] = useState([]);
  const [packingSchedule, setPackingSchedule] = useState([]);
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Dispatch Integration
  const [dispatchData, setDispatchData] = useState([]);
  const [filteredDispatches, setFilteredDispatches] = useState([]);
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [productOptions, setProductOptions] = useState([]);
  
  // Snackbar for auto-load notification
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Production stages with target metrics
  const productionStages = [
    {
      stage: "Cable Cutting",
      icon: <CutIcon />,
      description: "Cut cables to specific lengths (1.25m, 1.75m)",
      targetRate: 600, // pieces/hour
      currentRate: 0,
      efficiency: 0
    },
    {
      stage: "Assembly Lines", 
      icon: <AssemblyIcon />,
      description: "4 lines - stripping, pins, terminals",
      targetRate: 600,
      currentRate: 0,
      efficiency: 0
    },
    {
      stage: "Molding Machines",
      icon: <MoldingIcon />,
      description: "Inner, Outer, Grommet molding",
      targetRate: 600,
      currentRate: 0,
      efficiency: 0
    },
    {
      stage: "Packing Line",
      icon: <PackingIcon />,
      description: "Final packaging",
      targetRate: 600,
      currentRate: 0,
      efficiency: 0
    }
  ];

  // Assembly line configuration (4 lines as mentioned in conversation)
  const assemblyLines = [
    {
      lineCode: "ASM-L01",
      lineName: "Assembly Line 1",
      capacity: 600, // pieces/hour
      efficiency: 92,
      currentProduct: "",
      status: "Available"
    },
    {
      lineCode: "ASM-L02", 
      lineName: "Assembly Line 2",
      capacity: 580,
      efficiency: 88,
      currentProduct: "",
      status: "Available"
    },
    {
      lineCode: "ASM-L03",
      lineName: "Assembly Line 3", 
      capacity: 620,
      efficiency: 90,
      currentProduct: "",
      status: "Available"
    },
    {
      lineCode: "ASM-L04",
      lineName: "Assembly Line 4",
      capacity: 590,
      efficiency: 85,
      currentProduct: "",
      status: "Available"
    }
  ];

  // Molding machine configuration with speed ratios
  const moldingMachines = [
    {
      machineCode: "MOLD-M01",
      machineName: "Molding Machine 1",
      type: "Inner/Outer",
      innerCapacity: 300, // pieces/hour (slower for inner molding)
      outerCapacity: 600, // pieces/hour (faster for outer molding)
      efficiency: 88,
      currentMold: "",
      status: "Available"
    },
    {
      machineCode: "MOLD-M02",
      machineName: "Molding Machine 2", 
      type: "Inner/Outer",
      innerCapacity: 290,
      outerCapacity: 580,
      efficiency: 85,
      currentMold: "",
      status: "Available"
    },
    {
      machineCode: "MOLD-M03",
      machineName: "Molding Machine 3",
      type: "Outer/Grommet",
      innerCapacity: 0, // Not compatible with inner molding
      outerCapacity: 650,
      grometCapacity: 800, // Grommet molding is fastest
      efficiency: 90,
      currentMold: "",
      status: "Available"
    }
  ];

  const calculateCuttingPlan = () => {
    if (!planningData.cableLength || !planningData.targetLength) return;
    
    const totalLength = parseFloat(planningData.cableLength);
    const targetLength = parseFloat(planningData.targetLength);
    const expectedPieces = Math.floor(totalLength / targetLength);
    
    setPlanningData({
      ...planningData,
      expectedPieces: expectedPieces
    });
  };

  const generateProductionSchedule = () => {
    if (!planningData.expectedPieces || !planningData.productCode) {
      alert("Please complete cable cutting plan first");
      return;
    }

    setLoading(true);
    
    // Simulate production scheduling calculation
    setTimeout(() => {
      const pieces = planningData.expectedPieces;
      
      // Calculate assembly line allocation
      const assemblyAllocation = assemblyLines.map((line, index) => ({
        ...line,
        allocatedPieces: Math.floor(pieces / 4) + (index === 0 ? pieces % 4 : 0),
        estimatedTime: Math.ceil((pieces / 4) / (line.capacity * line.efficiency / 100)),
        startTime: "08:00",
        endTime: calculateEndTime("08:00", Math.ceil((pieces / 4) / (line.capacity * line.efficiency / 100)))
      }));

      // Calculate molding machine allocation with 2:1 ratio consideration
      const innerMoldingNeeded = true; // Assume inner molding needed
      const outerMoldingNeeded = true; // Assume outer molding needed
      
      const moldingAllocation = [];
      
      if (innerMoldingNeeded) {
        // Need 2 machines for inner molding to match 1 outer molding machine
        moldingAllocation.push({
          ...moldingMachines[0],
          moldType: "Inner",
          allocatedPieces: Math.floor(pieces / 2),
          estimatedTime: Math.ceil((pieces / 2) / (moldingMachines[0].innerCapacity * moldingMachines[0].efficiency / 100)),
          startTime: "09:00", // After assembly
          endTime: calculateEndTime("09:00", Math.ceil((pieces / 2) / (moldingMachines[0].innerCapacity * moldingMachines[0].efficiency / 100)))
        });
        
        moldingAllocation.push({
          ...moldingMachines[1],
          moldType: "Inner", 
          allocatedPieces: Math.ceil(pieces / 2),
          estimatedTime: Math.ceil((pieces / 2) / (moldingMachines[1].innerCapacity * moldingMachines[1].efficiency / 100)),
          startTime: "09:00",
          endTime: calculateEndTime("09:00", Math.ceil((pieces / 2) / (moldingMachines[1].innerCapacity * moldingMachines[1].efficiency / 100)))
        });
      }
      
      if (outerMoldingNeeded) {
        moldingAllocation.push({
          ...moldingMachines[2],
          moldType: "Outer",
          allocatedPieces: pieces,
          estimatedTime: Math.ceil(pieces / (moldingMachines[2].outerCapacity * moldingMachines[2].efficiency / 100)),
          startTime: "10:00", // After inner molding
          endTime: calculateEndTime("10:00", Math.ceil(pieces / (moldingMachines[2].outerCapacity * moldingMachines[2].efficiency / 100)))
        });
      }

      // Calculate packing allocation
      const packingAllocation = [{
        lineCode: "PACK-L01",
        lineName: "Packing Line 1",
        allocatedPieces: pieces,
        capacity: 600,
        efficiency: 95,
        estimatedTime: Math.ceil(pieces / (600 * 0.95)),
        startTime: "11:00", // After molding
        endTime: calculateEndTime("11:00", Math.ceil(pieces / (600 * 0.95)))
      }];

      setAssemblySchedule(assemblyAllocation);
      setMoldingSchedule(moldingAllocation);
      setPackingSchedule(packingAllocation);

      // Calculate optimization metrics
      const totalAssemblyTime = Math.max(...assemblyAllocation.map(a => a.estimatedTime));
      const totalMoldingTime = Math.max(...moldingAllocation.map(m => m.estimatedTime));
      const totalPackingTime = packingAllocation[0].estimatedTime;
      
      const bottleneck = Math.max(totalAssemblyTime, totalMoldingTime, totalPackingTime);
      const overallEfficiency = Math.min(
        (pieces / (bottleneck * 600)) * 100,
        100
      );

      setOptimizationResults({
        bottleneckStage: bottleneck === totalAssemblyTime ? "Assembly" : 
                        bottleneck === totalMoldingTime ? "Molding" : "Packing",
        overallEfficiency: Math.round(overallEfficiency),
        totalProductionTime: bottleneck,
        recommendedImprovements: generateRecommendations(assemblyAllocation, moldingAllocation)
      });

      setLoading(false);
      setActiveStep(1);
    }, 2000);
  };

  const calculateEndTime = (startTime, durationHours) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + Math.floor(durationHours);
    const endMinutes = minutes + ((durationHours % 1) * 60);
    
    return `${String(endHours).padStart(2, '0')}:${String(Math.round(endMinutes)).padStart(2, '0')}`;
  };

  const generateRecommendations = (assembly, molding) => {
    const recommendations = [];
    
    // Check assembly line balance
    const assemblyTimes = assembly.map(a => a.estimatedTime);
    const maxAssemblyTime = Math.max(...assemblyTimes);
    const minAssemblyTime = Math.min(...assemblyTimes);
    
    if (maxAssemblyTime - minAssemblyTime > 1) {
      recommendations.push("Rebalance assembly line allocation for better utilization");
    }

    // Check molding balance
    const innerMolding = molding.filter(m => m.moldType === "Inner");
    if (innerMolding.length > 0) {
      const avgInnerTime = innerMolding.reduce((sum, m) => sum + m.estimatedTime, 0) / innerMolding.length;
      const outerMolding = molding.find(m => m.moldType === "Outer");
      
      if (outerMolding && avgInnerTime > outerMolding.estimatedTime * 1.1) {
        recommendations.push("Consider adding another inner molding machine to balance with outer molding");
      }
    }

    // General efficiency recommendations
    const avgEfficiency = (assembly.reduce((sum, a) => sum + a.efficiency, 0) / assembly.length +
                          molding.reduce((sum, m) => sum + m.efficiency, 0) / molding.length) / 2;
    
    if (avgEfficiency < 85) {
      recommendations.push("Overall machine efficiency is below target - schedule maintenance");
    }

    return recommendations;
  };

  useEffect(() => {
    calculateCuttingPlan();
  }, [planningData.cableLength, planningData.targetLength]);

  useEffect(() => {
    fetchDispatchData();
  }, []);

  // Generate unique order number
  const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `MP-${timestamp}-${random}`;
  };

  const fetchDispatchData = async () => {
    try {
      setLoading(true);
      const data = await sheetService.getSheetData("Dispatches");
      
      // Filter dispatches that are relevant for molding production
      const moldingDispatches = (data || []).filter(dispatch => 
        dispatch.ProductCode || dispatch.ProductName
      );
      
      setDispatchData(moldingDispatches);
      setFilteredDispatches(moldingDispatches);
      
      // Fetch Power Cord Master data for detailed specifications
      const powerCordMasterData = await sheetService.getSheetData("Power Cord Master").catch(() => []);
      
      // Extract unique product codes for dropdown with Power Cord Master details
      const productMap = new Map();
      moldingDispatches.forEach(dispatch => {
        if (!productMap.has(dispatch.ProductCode)) {
          // Find matching product in Power Cord Master
          const masterProduct = powerCordMasterData.find(pc => 
            pc["Product Code"] === dispatch.ProductCode || 
            pc["ProductCode"] === dispatch.ProductCode
          );
          
          productMap.set(dispatch.ProductCode, {
            value: dispatch.ProductCode,
            label: `${dispatch.ProductCode} - ${dispatch.ProductName || 'Power Cord'}`,
            dispatch: dispatch,
            masterData: masterProduct || null
          });
        }
      });
      setProductOptions(Array.from(productMap.values()));
      
      // Check if there's a dispatch to auto-load from sessionStorage
      const savedDispatch = sessionStorage.getItem('selectedDispatch');
      if (savedDispatch) {
        try {
          const dispatchToLoad = JSON.parse(savedDispatch);
          // Find the dispatch in the loaded data
          const matchingDispatch = moldingDispatches.find(d => 
            d.DispatchUniqueId === dispatchToLoad.DispatchUniqueId ||
            d.UniqueId === dispatchToLoad.UniqueId
          );
          
          if (matchingDispatch) {
            // Auto-select the dispatch
            handleDispatchSelection(matchingDispatch);
            setSnackbarMessage(`✅ Auto-loaded dispatch: ${matchingDispatch.DispatchUniqueId || matchingDispatch.UniqueId}`);
            setSnackbarOpen(true);
          } else {
            console.warn("⚠️ Dispatch not found in loaded data:", dispatchToLoad);
          }
          
          // Clear from sessionStorage after loading
          sessionStorage.removeItem('selectedDispatch');
        } catch (error) {
          console.error("❌ Error loading saved dispatch:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching dispatch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleMoveToProductionManagement = () => {
    if (!selectedDispatch) {
      alert("Please select a dispatch first");
      return;
    }

    // Store production planning data in sessionStorage for Production Management
    const productionData = {
      dispatchUniqueId: planningData.dispatchUniqueId,
      uniqueId: planningData.uniqueId,
      batchNumber: planningData.batchNumber,
      clientCode: planningData.clientCode,
      productCode: planningData.productCode,
      productName: planningData.productName,
      quantity: planningData.quantity,
      cableLength: planningData.cableLength,
      targetLength: planningData.targetLength,
      expectedPieces: planningData.expectedPieces,
      dispatchDate: planningData.dispatchDate,
      completedDate: planningData.completedDate,
      // Include schedule data if available
      assemblySchedule: assemblySchedule,
      moldingSchedule: moldingSchedule,
      packingSchedule: packingSchedule,
      optimizationResults: optimizationResults,
      // Include full dispatch record
      ...selectedDispatch
    };

    sessionStorage.setItem('selectedProductionOrder', JSON.stringify(productionData));
    // Show success message
    setSnackbarMessage(`Moving to Production Management with dispatch: ${planningData.dispatchUniqueId || planningData.uniqueId}`);
    setSnackbarOpen(true);

    // Navigate after a short delay to show the snackbar
    setTimeout(() => {
      navigate('/molding/production-management');
    }, 1000);
  };

  const handleDispatchSelection = (dispatch) => {
    setSelectedDispatch(dispatch);
    setPlanningData({
      ...planningData,
      dispatchUniqueId: dispatch.DispatchUniqueId,
      uniqueId: dispatch.UniqueId,
      batchNumber: dispatch.BatchNumber,
      clientCode: dispatch.ClientCode,
      productCode: dispatch.ProductCode,
      productName: dispatch.ProductName,
      quantity: dispatch.Quantity || dispatch.BatchSize,
      cableLength: dispatch.CableLength || "1.5",
      targetLength: dispatch.TargetLength || "1.5",
      dispatchDate: dispatch.DispatchDate,
      completedDate: dispatch.mouldingCompletedDate
    });
  };

  const handleProductSelection = (productCode) => {
    const selectedProduct = productOptions.find(p => p.value === productCode);
    if (selectedProduct) {
      const dispatch = selectedProduct.dispatch;
      const masterData = selectedProduct.masterData;
      
      setSelectedDispatch(dispatch);
      setPlanningData(prev => ({
        ...prev,
        dispatchUniqueId: dispatch.DispatchUniqueId,
        uniqueId: dispatch.UniqueId,
        batchNumber: dispatch.BatchNumber,
        clientCode: dispatch.ClientCode,
        productCode: productCode,
        productName: dispatch.ProductName,
        quantity: dispatch.Quantity || dispatch.BatchSize,
        cableLength: dispatch.CableLength || masterData?.["Standard Length"] || masterData?.["StandardLength"] || "1.5",
        targetLength: dispatch.TargetLength || masterData?.["Standard Length"] || masterData?.["StandardLength"] || "1.5",
        dispatchDate: dispatch.DispatchDate,
        completedDate: dispatch.mouldingCompletedDate
      }));
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", color: "#1976d2" }}>
        🏭 Molding Production Planning
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 4, color: "#666" }}>
        Plan and optimize molding production from cable cutting to final packaging
      </Typography>

      {/* Production Process Overview */}
      <Card sx={{ mb: 4, p: 2, backgroundColor: "#f8f9fa" }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
          🎯 Production Stages Overview
        </Typography>
        <Grid container spacing={2}>
          {productionStages.map((stage, index) => (
            <Grid item xs={12} md={3} key={index}>
              <Box sx={{ textAlign: "center", p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                <Box sx={{ color: "#1976d2", mb: 1 }}>{stage.icon}</Box>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>{stage.stage}</Typography>
                <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 1 }}>
                  {stage.description}
                </Typography>
                <Chip 
                  label={`${stage.targetRate} pcs/hr`} 
                  size="small" 
                  color="primary" 
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Card>

      {/* Production Planning Stepper */}
      <Stepper activeStep={activeStep} orientation="vertical">
        {/* Step 1: Cable Cutting Plan */}
        <Step>
          <StepLabel>
            <Typography variant="h6">✂️ Cable Cutting Plan</Typography>
          </StepLabel>
          <StepContent>
            <Card sx={{ p: 3, mb: 2 }}>
              <Grid container spacing={3}>
                 {/* Dispatch Selector */}
                 <Grid item xs={12}>
                   <Alert severity="info" sx={{ mb: 2 }}>
                     Select a dispatch to automatically load all production details including cable cutting data
                   </Alert>
                   <Autocomplete
                     options={filteredDispatches}
                     getOptionLabel={(option) => option.DispatchUniqueId || ""}
                     value={selectedDispatch}
                     onChange={(event, newValue) => {
                       if (newValue) {
                         handleDispatchSelection(newValue);
                       }
                     }}
                     renderInput={(params) => (
                       <TextField
                         {...params}
                         fullWidth
                         label="Select Dispatch ID *"
                         required
                         variant="outlined"
                         helperText={`${filteredDispatches.length} dispatches available for molding production`}
                       />
                     )}
                     renderOption={(props, option) => (
                       <Box component="li" {...props} sx={{ py: 1.5, borderBottom: '1px solid #e0e0e0' }}>
                         <Box sx={{ width: '100%' }}>
                           <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                             <Chip 
                               label={option.DispatchUniqueId} 
                               size="small" 
                               sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: "bold" }}
                             />
                             <Chip 
                               label={option.UniqueId} 
                               size="small" 
                               sx={{ bgcolor: "#f3e5f5", color: "#7b1fa2" }}
                             />
                             <Chip 
                               label={option.ClientCode} 
                               size="small" 
                               sx={{ bgcolor: "#e3f2fd", color: "#1976d2" }}
                             />
                           </Box>
                           <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                             {option.ProductCode} - {option.ProductName}
                           </Typography>
                           <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                             <Typography variant="caption" color="text.secondary">
                               Batch: {option.BatchNumber || 'N/A'}
                             </Typography>
                             <Typography variant="caption" color="text.secondary">
                               Qty: {option.Quantity || option.BatchSize || 0} pcs
                             </Typography>
                             <Typography variant="caption" color="text.secondary">
                               Dispatch: {option.DispatchDate ? new Date(option.DispatchDate).toLocaleDateString() : 'N/A'}
                             </Typography>
                           </Box>
                         </Box>
                       </Box>
                     )}
                     sx={{ mb: 3 }}
                   />
                 </Grid>

                 {/* Display selected dispatch details */}
                 {selectedDispatch && (
                   <>
                     <Grid item xs={12}>
                       <Divider sx={{ my: 2 }}>
                         <Chip label="Selected Dispatch Details" color="primary" />
                       </Divider>
                     </Grid>
                     <Grid item xs={12} md={4}>
                       <TextField
                         fullWidth
                         label="Dispatch ID"
                         value={planningData.dispatchUniqueId}
                         InputProps={{ readOnly: true }}
                         sx={{ 
                           "& .MuiInputBase-input": { 
                             backgroundColor: "#e8f5e9",
                             fontWeight: "bold",
                             color: "#2e7d32"
                           }
                         }}
                       />
                     </Grid>
                     <Grid item xs={12} md={4}>
                       <TextField
                         fullWidth
                         label="Unique ID"
                         value={planningData.uniqueId}
                         InputProps={{ readOnly: true }}
                         sx={{ 
                           "& .MuiInputBase-input": { 
                             backgroundColor: "#f3e5f5",
                             fontWeight: "bold",
                             color: "#7b1fa2"
                           }
                         }}
                       />
                     </Grid>
                     <Grid item xs={12} md={4}>
                       <TextField
                         fullWidth
                         label="Client Code"
                         value={planningData.clientCode}
                         InputProps={{ readOnly: true }}
                         sx={{ 
                           "& .MuiInputBase-input": { 
                             backgroundColor: "#e3f2fd",
                             fontWeight: "bold",
                             color: "#1976d2"
                           }
                         }}
                       />
                     </Grid>
                     <Grid item xs={12} md={6}>
                       <TextField
                         fullWidth
                         label="Product Code"
                         value={planningData.productCode}
                         InputProps={{ readOnly: true }}
                         sx={{ 
                           "& .MuiInputBase-input": { 
                             backgroundColor: "#f5f5f5",
                             fontWeight: "bold"
                           }
                         }}
                       />
                     </Grid>
                     <Grid item xs={12} md={6}>
                       <TextField
                         fullWidth
                         label="Product Name"
                         value={planningData.productName}
                         InputProps={{ readOnly: true }}
                         sx={{ 
                           "& .MuiInputBase-input": { 
                             backgroundColor: "#f5f5f5"
                           }
                         }}
                       />
                     </Grid>
                     <Grid item xs={12} md={4}>
                       <TextField
                         fullWidth
                         label="Batch Number"
                         value={planningData.batchNumber}
                         InputProps={{ readOnly: true }}
                         sx={{ 
                           "& .MuiInputBase-input": { 
                             backgroundColor: "#fff3e0",
                             fontWeight: "bold",
                             color: "#e65100"
                           }
                         }}
                       />
                     </Grid>
                     <Grid item xs={12} md={4}>
                       <TextField
                         fullWidth
                         label="Quantity"
                         value={planningData.quantity}
                         InputProps={{ readOnly: true }}
                         helperText="pieces"
                         sx={{ 
                           "& .MuiInputBase-input": { 
                             backgroundColor: "#f5f5f5",
                             fontWeight: "bold"
                           }
                         }}
                       />
                     </Grid>
                     <Grid item xs={12} md={4}>
                       <TextField
                         fullWidth
                         label="Dispatch Date"
                         value={planningData.dispatchDate ? new Date(planningData.dispatchDate).toLocaleDateString() : ""}
                         InputProps={{ readOnly: true }}
                         sx={{ 
                           "& .MuiInputBase-input": { 
                             backgroundColor: "#e8f5e9",
                             color: "#2e7d32"
                           }
                         }}
                       />
                     </Grid>

                     <Grid item xs={12}>
                       <Divider sx={{ my: 2 }}>
                         <Chip label="Cable Cutting Details" color="secondary" />
                       </Divider>
                     </Grid>

                 <Grid item xs={12} md={6}>
                   <TextField
                     fullWidth
                     label="Cable Length Available (m)"
                     type="number"
                     value={planningData.cableLength}
                     onChange={(e) => setPlanningData({ ...planningData, cableLength: e.target.value })}
                     placeholder="e.g., 155"
                     helperText="From cable production output"
                   />
                 </Grid>
                 <Grid item xs={12} md={3}>
                   <FormControl fullWidth>
                     <InputLabel>Target Length (m)</InputLabel>
                     <Select
                       value={planningData.targetLength}
                       onChange={(e) => setPlanningData({ ...planningData, targetLength: e.target.value })}
                       label="Target Length (m)"
                     >
                       <MenuItem value="1.25">1.25m</MenuItem>
                       <MenuItem value="1.5">1.5m</MenuItem>
                       <MenuItem value="1.75">1.75m</MenuItem>
                       <MenuItem value="2.0">2.0m</MenuItem>
                     </Select>
                   </FormControl>
                 </Grid>
                 <Grid item xs={12} md={3}>
                   <TextField
                     fullWidth
                     label="Expected Pieces"
                     value={planningData.expectedPieces}
                     InputProps={{ readOnly: true }}
                     helperText="Auto-calculated"
                     sx={{ 
                       "& .MuiInputBase-input": { 
                         backgroundColor: "#f5f5f5",
                         fontWeight: "bold",
                         color: "#1976d2"
                       }
                     }}
                   />
                 </Grid>
                   </>
                 )}
                
                {selectedDispatch && planningData.expectedPieces > 0 && (
                  <Grid item xs={12}>
                    <Alert severity="success">
                      <strong>Cutting Plan Ready:</strong> {planningData.cableLength}m cable will produce {planningData.expectedPieces} pieces of {planningData.targetLength}m power cords
                    </Alert>
                  </Grid>
                )}

                {/* Product Specifications from Power Cord Master */}
                {selectedDispatch && productOptions.find(p => p.value === planningData.productCode)?.masterData && (
                  <Grid item xs={12}>
                    <Card sx={{ mt: 2, bgcolor: '#f8f9fa' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                          📋 Product Specifications (from Power Cord Master)
                        </Typography>
                        {(() => {
                          const masterData = productOptions.find(p => p.value === planningData.productCode)?.masterData;
                          return (
                            <Grid container spacing={2}>
                              {masterData["Pin Type"] && (
                                <Grid item xs={6} sm={3}>
                                  <Typography variant="caption" color="text.secondary">Pin Type</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {masterData["Pin Type"]} {masterData["Amperage"] || ""}
                                  </Typography>
                                </Grid>
                              )}
                              {masterData["Standard Length"] && (
                                <Grid item xs={6} sm={3}>
                                  <Typography variant="caption" color="text.secondary">Standard Length</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {masterData["Standard Length"]}m
                                  </Typography>
                                </Grid>
                              )}
                              {masterData["Plug Type"] && (
                                <Grid item xs={6} sm={3}>
                                  <Typography variant="caption" color="text.secondary">Plug Type</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {masterData["Plug Type"]}
                                  </Typography>
                                </Grid>
                              )}
                              {masterData["Applications"] && (
                                <Grid item xs={6} sm={3}>
                                  <Typography variant="caption" color="text.secondary">Applications</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {masterData["Applications"]}
                                  </Typography>
                                </Grid>
                              )}
                              {masterData["Cable Type"] && (
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="caption" color="text.secondary">Cable Type</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {masterData["Cable Type"]}
                                  </Typography>
                                </Grid>
                              )}
                              {masterData["Safety Standards"] && (
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="caption" color="text.secondary">Safety Standards</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {masterData["Safety Standards"]}
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
              
               <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: 'wrap' }}>
                 <Button
                   variant="contained"
                   startIcon={<ScheduleIcon />}
                   onClick={generateProductionSchedule}
                   disabled={!planningData.expectedPieces || loading}
                   sx={{ bgcolor: "#1976d2" }}
                 >
                   {loading ? "Generating Schedule..." : "Generate Production Schedule"}
                 </Button>
                 {assemblySchedule.length > 0 && (
                   <Button
                     variant="outlined"
                     onClick={() => setActiveStep(1)}
                     disabled={!planningData.expectedPieces}
                   >
                     View Production Schedule →
                   </Button>
                 )}
               </Box>
              
              {loading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                    Optimizing assembly lines and molding machines...
                  </Typography>
                </Box>
              )}
            </Card>
          </StepContent>
        </Step>

        {/* Step 2: Production Schedule */}
        <Step>
          <StepLabel>
            <Typography variant="h6">🏭 Production Schedule</Typography>
          </StepLabel>
          <StepContent>
            {assemblySchedule.length > 0 && (
              <>
                {/* Assembly Line Schedule */}
                <Accordion sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">🔧 Assembly Line Schedule</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                            <TableCell><strong>Line</strong></TableCell>
                            <TableCell><strong>Allocated Pieces</strong></TableCell>
                            <TableCell><strong>Capacity</strong></TableCell>
                            <TableCell><strong>Efficiency</strong></TableCell>
                            <TableCell><strong>Time Required</strong></TableCell>
                            <TableCell><strong>Schedule</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {assemblySchedule.map((line) => (
                            <TableRow key={line.lineCode}>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                  {line.lineName}
                                </Typography>
                              </TableCell>
                              <TableCell>{line.allocatedPieces} pcs</TableCell>
                              <TableCell>{line.capacity} pcs/hr</TableCell>
                              <TableCell>
                                <Chip 
                                  label={`${line.efficiency}%`} 
                                  size="small" 
                                  color={line.efficiency >= 90 ? "success" : "warning"}
                                />
                              </TableCell>
                              <TableCell>{line.estimatedTime}h</TableCell>
                              <TableCell>
                                <Typography variant="caption">
                                  {line.startTime} - {line.endTime}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>

                {/* Molding Machine Schedule */}
                <Accordion sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">🏭 Molding Machine Schedule</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <strong>Industry Insight:</strong> Inner molding machines operate at 300 pcs/hr while outer molding runs at 600 pcs/hr (2:1 ratio). Multiple inner machines may be needed.
                    </Alert>
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                            <TableCell><strong>Machine</strong></TableCell>
                            <TableCell><strong>Mold Type</strong></TableCell>
                            <TableCell><strong>Allocated Pieces</strong></TableCell>
                            <TableCell><strong>Capacity</strong></TableCell>
                            <TableCell><strong>Time Required</strong></TableCell>
                            <TableCell><strong>Schedule</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {moldingSchedule.map((machine, index) => (
                            <TableRow key={`${machine.machineCode}-${index}`}>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                  {machine.machineName}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={machine.moldType} 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: machine.moldType === "Inner" ? "#ffeb3b" : 
                                             machine.moldType === "Outer" ? "#4caf50" : "#ff9800",
                                    color: machine.moldType === "Outer" ? "white" : "black"
                                  }}
                                />
                              </TableCell>
                              <TableCell>{machine.allocatedPieces} pcs</TableCell>
                              <TableCell>
                                {machine.moldType === "Inner" ? machine.innerCapacity : machine.outerCapacity} pcs/hr
                              </TableCell>
                              <TableCell>{machine.estimatedTime}h</TableCell>
                              <TableCell>
                                <Typography variant="caption">
                                  {machine.startTime} - {machine.endTime}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>

                {/* Packing Schedule */}
                <Accordion sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">📦 Packing Line Schedule</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                            <TableCell><strong>Line</strong></TableCell>
                            <TableCell><strong>Pieces</strong></TableCell>
                            <TableCell><strong>Capacity</strong></TableCell>
                            <TableCell><strong>Time Required</strong></TableCell>
                            <TableCell><strong>Schedule</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {packingSchedule.map((line) => (
                            <TableRow key={line.lineCode}>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                  {line.lineName}
                                </Typography>
                              </TableCell>
                              <TableCell>{line.allocatedPieces} pcs</TableCell>
                              <TableCell>{line.capacity} pcs/hr</TableCell>
                              <TableCell>{line.estimatedTime}h</TableCell>
                              <TableCell>
                                <Typography variant="caption">
                                  {line.startTime} - {line.endTime}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>

                {/* Optimization Results */}
                {optimizationResults && (
                  <Card sx={{ p: 3, mt: 2, backgroundColor: "#e3f2fd" }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                      📊 Production Optimization Analysis
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="h4" sx={{ color: "#1976d2", fontWeight: "bold" }}>
                            {optimizationResults.overallEfficiency}%
                          </Typography>
                          <Typography variant="body2">Overall Efficiency</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="h4" sx={{ color: "#f57c00", fontWeight: "bold" }}>
                            {optimizationResults.totalProductionTime}h
                          </Typography>
                          <Typography variant="body2">Total Time</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="h5" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                            {optimizationResults.bottleneckStage}
                          </Typography>
                          <Typography variant="body2">Bottleneck Stage</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="h4" sx={{ color: "#4caf50", fontWeight: "bold" }}>
                            600
                          </Typography>
                          <Typography variant="body2">Target pcs/hr</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    {optimizationResults.recommendedImprovements.length > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                          💡 Recommended Improvements:
                        </Typography>
                        {optimizationResults.recommendedImprovements.map((improvement, index) => (
                          <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                            {improvement}
                          </Alert>
                        ))}
                      </Box>
                    )}
                  </Card>
                )}

                 <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: 'wrap' }}>
                   <Button
                     variant="outlined"
                     onClick={() => setActiveStep(0)}
                     sx={{ order: { xs: 2, sm: 1 } }}
                   >
                     ← Back to Cable Cutting Plan
                   </Button>
                   <Button
                     variant="contained"
                     startIcon={<ArrowForwardIcon />}
                     color="primary"
                     onClick={handleMoveToProductionManagement}
                     disabled={!selectedDispatch}
                     sx={{ order: { xs: 1, sm: 2 } }}
                   >
                     Move to Production Management
                   </Button>
                   <Button
                     variant="outlined"
                     startIcon={<OptimizeIcon />}
                     onClick={() => setDialogOpen(true)}
                     sx={{ order: 3 }}
                   >
                     Optimize Further
                   </Button>
                 </Box>
              </>
            )}
          </StepContent>
        </Step>
      </Stepper>

      {/* Optimization Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>🔧 Advanced Production Optimization</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Advanced optimization features for molding production planning:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, border: "1px solid #e0e0e0" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Machine Load Balancing
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Automatically balance workload across assembly lines and molding machines
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, border: "1px solid #e0e0e0" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Changeover Optimization
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Minimize mold changeover times by optimizing production sequence
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, border: "1px solid #e0e0e0" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Maintenance Scheduling
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Consider machine maintenance windows in production planning
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, border: "1px solid #e0e0e0" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Multi-Order Planning
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Optimize production across multiple orders simultaneously
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <Button variant="contained">Apply Optimizations</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for Auto-Load Notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity="success" 
          sx={{ 
            width: '100%',
            fontSize: '1rem',
            fontWeight: 600
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MoldingProductionPlanning; 