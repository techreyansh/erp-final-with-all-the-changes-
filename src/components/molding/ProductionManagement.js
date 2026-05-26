import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Tabs,
  Tab,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Badge,
  Avatar,
  Pagination,
  Snackbar,
} from "@mui/material";
import {
  ContentCut as CutIcon,
  Build as AssemblyIcon,
  Engineering as MoldingIcon,
  LocalShipping as PackingIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Sync as SyncIcon,
  Timeline as MonitorIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Speed as SpeedIcon,
  Assignment as OrderIcon,
  Factory as FactoryIcon,
} from "@mui/icons-material";
import sheetService from "../../services/sheetService";
import WhatsAppButton from "../common/WhatsAppButton";

const ProductionManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  
  // Pagination state for each table
  const [assemblyPage, setAssemblyPage] = useState(0);
  const [assemblyRowsPerPage, setAssemblyRowsPerPage] = useState(5);
  const [moldingPage, setMoldingPage] = useState(0);
  const [moldingRowsPerPage, setMoldingRowsPerPage] = useState(5);
  const [moldCompatibilityPage, setMoldCompatibilityPage] = useState(0);
  const [moldCompatibilityRowsPerPage, setMoldCompatibilityRowsPerPage] = useState(5);
  const [packingPage, setPackingPage] = useState(0);
  const [packingRowsPerPage, setPackingRowsPerPage] = useState(5);
  
  // Production Order State
  const [currentOrder, setCurrentOrder] = useState({
    orderNumber: "",
    productCode: "",
    quantity: 0,
    cableLength: 0,
    targetLength: 1.5,
    expectedPieces: 0,
    status: "Planning"
  });

  // Batch/Dispatch Integration (works with DispatchUniqueId/BatchNumber)
  const [dispatchData, setDispatchData] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Production Flow State
  const [productionFlow, setProductionFlow] = useState({
    cutting: { input: 0, output: 0, efficiency: 0, status: "Ready" },
    assembly: { input: 0, output: 0, efficiency: 0, status: "Ready" },
    molding: { input: 0, output: 0, efficiency: 0, status: "Ready" },
    packing: { input: 0, output: 0, efficiency: 0, status: "Ready" }
  });

  // Machine States
  const [assemblyLines, setAssemblyLines] = useState([
    {
      id: "ASM-L01",
      name: "Assembly Line 1", 
      status: "Running",
      currentProduct: "PC-3P-16A-1.5",
      capacity: 600,
      currentSpeed: 580,
      efficiency: 97,
      output: 4640,
      target: 4800,
      operator: "John Doe"
    },
    {
      id: "ASM-L02",
      name: "Assembly Line 2",
      status: "Running", 
      currentProduct: "PC-2P-6A-1.25",
      capacity: 580,
      currentSpeed: 565,
      efficiency: 97,
      output: 4520,
      target: 4640,
      operator: "Jane Smith"
    },
    {
      id: "ASM-L03",
      name: "Assembly Line 3",
      status: "Maintenance",
      currentProduct: "",
      capacity: 620,
      currentSpeed: 0,
      efficiency: 0,
      output: 0,
      target: 4960,
      operator: ""
    },
    {
      id: "ASM-L04", 
      name: "Assembly Line 4",
      status: "Ready",
      currentProduct: "",
      capacity: 590,
      currentSpeed: 0,
      efficiency: 0,
      output: 0,
      target: 4720,
      operator: ""
    }
  ]);

  const [moldingMachines, setMoldingMachines] = useState([
    {
      id: "MOLD-M01",
      name: "Molding Machine 1",
      status: "Running",
      moldType: "Inner",
      currentMold: "MOLD-3P-16A-INNER",
      capacity: { inner: 300, outer: 600, grommet: 0 },
      currentSpeed: 285,
      efficiency: 95,
      output: 2280,
      target: 2400,
      compatibility: ["2-pin", "3-pin", "6A", "16A"],
      operator: "Mike Johnson"
    },
    {
      id: "MOLD-M02", 
      name: "Molding Machine 2",
      status: "Running",
      moldType: "Inner",
      currentMold: "MOLD-3P-16A-INNER",
      capacity: { inner: 290, outer: 580, grommet: 0 },
      currentSpeed: 275,
      efficiency: 95,
      output: 2200,
      target: 2320,
      compatibility: ["2-pin", "3-pin", "6A", "16A"],
      operator: "Sarah Wilson"
    },
    {
      id: "MOLD-M03",
      name: "Molding Machine 3", 
      status: "Running",
      moldType: "Outer",
      currentMold: "MOLD-3P-16A-OUTER",
      capacity: { inner: 0, outer: 650, grommet: 800 },
      currentSpeed: 620,
      efficiency: 95,
      output: 4960,
      target: 5200,
      compatibility: ["2-pin", "3-pin", "6A", "16A", "Grommet"],
      operator: "David Brown"
    },
    {
      id: "MOLD-M04",
      name: "Molding Machine 4",
      status: "Changeover",
      moldType: "Outer",
      currentMold: "",
      capacity: { inner: 0, outer: 600, grommet: 750 },
      currentSpeed: 0,
      efficiency: 0,
      output: 0,
      target: 4800,
      compatibility: ["2-pin", "3-pin", "6A", "16A", "Grommet"],
      operator: "Lisa Garcia"
    },
    {
      id: "MOLD-M05",
      name: "Molding Machine 5",
      status: "Ready",
      moldType: "",
      currentMold: "",
      capacity: { inner: 280, outer: 560, grommet: 0 },
      currentSpeed: 0,
      efficiency: 0,
      output: 0,
      target: 0,
      compatibility: ["2-pin", "3-pin", "6A"],
      operator: ""
    },
    {
      id: "MOLD-M06",
      name: "Molding Machine 6",
      status: "Ready",
      moldType: "",
      currentMold: "",
      capacity: { inner: 300, outer: 600, grommet: 800 },
      currentSpeed: 0,
      efficiency: 0,
      output: 0,
      target: 0,
      compatibility: ["2-pin", "3-pin", "6A", "16A", "Grommet"],
      operator: ""
    }
  ]);

  // Available Molds with compatibility matrix
  const [availableMolds, setAvailableMolds] = useState([
    {
      id: "MOLD-2P-6A-INNER",
      name: "2-Pin 6A Inner Mold",
      type: "Inner",
      productTypes: ["2-pin", "6A"],
      compatibleMachines: ["MOLD-M01", "MOLD-M02", "MOLD-M05", "MOLD-M06"],
      status: "Available",
      location: "Mold Storage A"
    },
    {
      id: "MOLD-2P-6A-OUTER", 
      name: "2-Pin 6A Outer Mold",
      type: "Outer",
      productTypes: ["2-pin", "6A"],
      compatibleMachines: ["MOLD-M03", "MOLD-M04", "MOLD-M06"],
      status: "Available",
      location: "Mold Storage A"
    },
    {
      id: "MOLD-3P-6A-INNER",
      name: "3-Pin 6A Inner Mold",
      type: "Inner", 
      productTypes: ["3-pin", "6A"],
      compatibleMachines: ["MOLD-M01", "MOLD-M02", "MOLD-M05", "MOLD-M06"],
      status: "Available",
      location: "Mold Storage B"
    },
    {
      id: "MOLD-3P-6A-OUTER",
      name: "3-Pin 6A Outer Mold",
      type: "Outer",
      productTypes: ["3-pin", "6A"],
      compatibleMachines: ["MOLD-M03", "MOLD-M04", "MOLD-M06"],
      status: "Available",
      location: "Mold Storage B"
    },
    {
      id: "MOLD-3P-16A-INNER",
      name: "3-Pin 16A Inner Mold",
      type: "Inner",
      productTypes: ["3-pin", "16A"],
      compatibleMachines: ["MOLD-M01", "MOLD-M02", "MOLD-M06"],
      status: "In Use",
      location: "Machine M01, M02"
    },
    {
      id: "MOLD-3P-16A-OUTER",
      name: "3-Pin 16A Outer Mold", 
      type: "Outer",
      productTypes: ["3-pin", "16A"],
      compatibleMachines: ["MOLD-M03", "MOLD-M04", "MOLD-M06"],
      status: "In Use",
      location: "Machine M03"
    },
    {
      id: "MOLD-GROMMET-STD",
      name: "Standard Grommet Mold",
      type: "Grommet",
      productTypes: ["Grommet"],
      compatibleMachines: ["MOLD-M03", "MOLD-M04", "MOLD-M06"],
      status: "Available",
      location: "Mold Storage C"
    }
  ]);

  // Packing Lines
  const [packingLines, setPackingLines] = useState([
    {
      id: "PACK-L01",
      name: "Packing Line 1",
      status: "Running",
      capacity: 600,
      currentSpeed: 585,
      efficiency: 97,
      output: 4680,
      target: 4800,
      operator: "Anna Chen"
    }
  ]);

  // Snackbar for auto-load notification
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Handler functions defined before useEffect
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleOrderSelection = (orderId) => {
    const order = availableOrders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setCurrentOrder({
        orderNumber: order.orderNumber,
        productCode: order.productCode,
        quantity: order.quantity,
        cableLength: order.dispatchRecord?.CableLength || 1.5,
        targetLength: order.dispatchRecord?.TargetLength || 1.5,
        expectedPieces: Math.floor(((order.dispatchRecord?.CableLength || 1.5) / (order.dispatchRecord?.TargetLength || 1.5))),
        status: order.status === 'COMPLETED' ? 'Completed' : 'Ready'
      });
    }
  };

  const fetchDispatchData = async () => {
    try {
      const dispatches = await sheetService.getSheetData("Dispatches");

      // Keep all dispatch/batch records that have any stage data relevant for moulding
      const moldingBatches = (dispatches || []).filter(d => {
        // If there is a record in Dispatches it's a valid batch; optionally prioritize those with moulding status present
        return true;
      });

      setDispatchData(moldingBatches);

      // Build available orders list keyed by DispatchUniqueId/BatchNumber
      const orders = moldingBatches.map(d => ({
        id: d.DispatchUniqueId || `${d.UniqueId}-${d.BatchNumber || 'BATCH'}`,
        orderNumber: d.BatchNumber || d.DispatchUniqueId || 'BATCH',
        productCode: d.ProductCode,
        productName: d.ProductName || d.ProductCode,
        quantity: d.Quantity || d.BatchSize,
        status: d.mouldingProdStatus || d.cableProdStatus || d.store2Status || 'NEW',
        priority: d.Priority || 'Medium',
        dueDate: d.MouldingDueDate || d.DispatchDate,
        clientCode: d.ClientCode,
        dispatchRecord: d,
      }));

      setAvailableOrders(orders);

      // Check if there's a production order to auto-load from sessionStorage
      const savedProductionOrder = sessionStorage.getItem('selectedProductionOrder');
      if (savedProductionOrder) {
        try {
          const productionData = JSON.parse(savedProductionOrder);
          // Find the matching order in available orders with more flexible matching
          const matchingOrder = orders.find(o => {
            const match = 
              o.id === productionData.dispatchUniqueId || 
              o.id === productionData.uniqueId ||
              o.id === productionData.DispatchUniqueId ||
              o.id === productionData.UniqueId ||
              o.dispatchRecord?.DispatchUniqueId === productionData.dispatchUniqueId ||
              o.dispatchRecord?.UniqueId === productionData.uniqueId ||
              o.dispatchRecord?.DispatchUniqueId === productionData.DispatchUniqueId ||
              o.dispatchRecord?.UniqueId === productionData.UniqueId;
            
            if (match) {
            }
            return match;
          });
          
          if (matchingOrder) {
            // Directly set the selected order and current order
            setSelectedOrder(matchingOrder);
            setCurrentOrder({
              orderNumber: matchingOrder.orderNumber,
              productCode: matchingOrder.productCode,
              quantity: matchingOrder.quantity,
              cableLength: matchingOrder.dispatchRecord?.CableLength || productionData.cableLength || 1.5,
              targetLength: matchingOrder.dispatchRecord?.TargetLength || productionData.targetLength || 1.5,
              expectedPieces: Math.floor(((matchingOrder.dispatchRecord?.CableLength || productionData.cableLength || 1.5) / (matchingOrder.dispatchRecord?.TargetLength || productionData.targetLength || 1.5))),
              status: matchingOrder.status === 'COMPLETED' ? 'Completed' : 'Ready'
            });
            
            setSnackbarMessage(`✅ Auto-loaded production order: ${matchingOrder.orderNumber || matchingOrder.id}`);
            setSnackbarOpen(true);
          } else {
            console.warn("⚠️ Production order not found in loaded data");
            console.warn("Looking for:", productionData);
            console.warn("Available order IDs:", orders.map(o => o.id));
          }
          
          // Clear from sessionStorage after loading
          sessionStorage.removeItem('selectedProductionOrder');
        } catch (error) {
          console.error("❌ Error loading saved production order:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching Dispatch data:", error);
    }
  };

  // Fetch Dispatch/Batches data on component mount
  useEffect(() => {
    fetchDispatchData();
  }, []);

  // Calculate production flow based on current machine states
  useEffect(() => {
    const runningAssembly = assemblyLines.filter(line => line.status === "Running");
    const runningMolding = moldingMachines.filter(machine => machine.status === "Running");
    const runningPacking = packingLines.filter(line => line.status === "Running");

    const assemblyOutput = runningAssembly.reduce((sum, line) => sum + line.output, 0);
    const moldingOutput = runningMolding.reduce((sum, machine) => sum + machine.output, 0);
    const packingOutput = runningPacking.reduce((sum, line) => sum + line.output, 0);

    setProductionFlow({
      cutting: { 
        input: currentOrder.expectedPieces, 
        output: Math.floor(currentOrder.expectedPieces * 0.98), // 2% cutting loss
        efficiency: 98, 
        status: "Running" 
      },
      assembly: { 
        input: Math.floor(currentOrder.expectedPieces * 0.98), 
        output: assemblyOutput,
        efficiency: runningAssembly.length > 0 ? 
          Math.round(runningAssembly.reduce((sum, line) => sum + line.efficiency, 0) / runningAssembly.length) : 0,
        status: runningAssembly.length > 0 ? "Running" : "Ready"
      },
      molding: { 
        input: assemblyOutput, 
        output: moldingOutput,
        efficiency: runningMolding.length > 0 ?
          Math.round(runningMolding.reduce((sum, machine) => sum + machine.efficiency, 0) / runningMolding.length) : 0,
        status: runningMolding.length > 0 ? "Running" : "Ready"
      },
      packing: { 
        input: moldingOutput, 
        output: packingOutput,
        efficiency: runningPacking.length > 0 ?
          Math.round(runningPacking.reduce((sum, line) => sum + line.efficiency, 0) / runningPacking.length) : 0,
        status: runningPacking.length > 0 ? "Running" : "Ready"
      }
    });
  }, [assemblyLines, moldingMachines, packingLines, currentOrder]);

  // Auto-sync with sheet data
  useEffect(() => {
    if (autoSync) {
      const interval = setInterval(() => {
        syncWithSheets();
      }, 30000); // Sync every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoSync]);

  const syncWithSheets = async () => {
    try {
      // Sync production data with Google Sheets
      const productionData = {
        timestamp: new Date().toISOString(),
        assemblyLines: assemblyLines,
        moldingMachines: moldingMachines,
        packingLines: packingLines,
        productionFlow: productionFlow,
        currentOrder: currentOrder
      };

      // Save to production monitoring sheet
      await sheetService.appendToSheet("Production Monitoring", [
        [
          productionData.timestamp,
          JSON.stringify(productionData.assemblyLines),
          JSON.stringify(productionData.moldingMachines),
          JSON.stringify(productionData.packingLines),
          JSON.stringify(productionData.productionFlow),
          JSON.stringify(productionData.currentOrder)
        ]
      ]);
    } catch (error) {
      console.error("Error syncing with sheets:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Running": return "success";
      case "Ready": return "info";
      case "Maintenance": return "warning";
      case "Changeover": return "secondary";
      case "Error": return "error";
      default: return "default";
    }
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 95) return "success";
    if (efficiency >= 85) return "warning"; 
    return "error";
  };

  // Pagination handlers
  const handleAssemblyPageChange = (event, newPage) => {
    setAssemblyPage(newPage);
  };

  const handleAssemblyRowsPerPageChange = (event) => {
    setAssemblyRowsPerPage(parseInt(event.target.value, 10));
    setAssemblyPage(0);
  };

  const handleMoldingPageChange = (event, newPage) => {
    setMoldingPage(newPage);
  };

  const handleMoldingRowsPerPageChange = (event) => {
    setMoldingRowsPerPage(parseInt(event.target.value, 10));
    setMoldingPage(0);
  };

  const handleMoldCompatibilityPageChange = (event, newPage) => {
    setMoldCompatibilityPage(newPage);
  };

  const handleMoldCompatibilityRowsPerPageChange = (event) => {
    setMoldCompatibilityRowsPerPage(parseInt(event.target.value, 10));
    setMoldCompatibilityPage(0);
  };

  const handlePackingPageChange = (event, newPage) => {
    setPackingPage(newPage);
  };

  const handlePackingRowsPerPageChange = (event) => {
    setPackingRowsPerPage(parseInt(event.target.value, 10));
    setPackingPage(0);
  };

  // Get paginated data functions
  const getPaginatedAssemblyLines = () => {
    const startIndex = assemblyPage * assemblyRowsPerPage;
    const endIndex = startIndex + assemblyRowsPerPage;
    return assemblyLines.slice(startIndex, endIndex);
  };

  const getPaginatedMoldingMachines = () => {
    const startIndex = moldingPage * moldingRowsPerPage;
    const endIndex = startIndex + moldingRowsPerPage;
    return moldingMachines.slice(startIndex, endIndex);
  };

  const getPaginatedMoldCompatibility = () => {
    const startIndex = moldCompatibilityPage * moldCompatibilityRowsPerPage;
    const endIndex = startIndex + moldCompatibilityRowsPerPage;
    return availableMolds.slice(startIndex, endIndex);
  };

  const getPaginatedPackingLines = () => {
    const startIndex = packingPage * packingRowsPerPage;
    const endIndex = startIndex + packingRowsPerPage;
    return packingLines.slice(startIndex, endIndex);
  };

  const handleStartProduction = () => {
    setLoading(true);
    // Simulate starting production
    setTimeout(() => {
      setCurrentOrder({ ...currentOrder, status: "Running" });
      setLoading(false);
    }, 2000);
  };

  const handleMachineControl = (machineId, action) => {
    if (machineId.startsWith("ASM")) {
      setAssemblyLines(prev => prev.map(line => 
        line.id === machineId 
          ? { ...line, status: action === "start" ? "Running" : action === "pause" ? "Paused" : "Stopped" }
          : line
      ));
    } else if (machineId.startsWith("MOLD")) {
      setMoldingMachines(prev => prev.map(machine =>
        machine.id === machineId
          ? { ...machine, status: action === "start" ? "Running" : action === "pause" ? "Paused" : "Stopped" }
          : machine
      ));
    } else if (machineId.startsWith("PACK")) {
      setPackingLines(prev => prev.map(line =>
        line.id === machineId
          ? { ...line, status: action === "start" ? "Running" : action === "pause" ? "Paused" : "Stopped" }
          : line
      ));
    }
  };

  const ProductionFlowCard = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MonitorIcon color="primary" />
          Real-time Production Flow
          <FormControlLabel
            control={<Switch checked={autoSync} onChange={(e) => setAutoSync(e.target.checked)} />}
            label="Auto Sync"
            sx={{ ml: "auto" }}
          />
        </Typography>
        
        <Grid container spacing={2}>
          {Object.entries(productionFlow).map(([stage, data]) => (
            <Grid item xs={12} md={3} key={stage}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                <Box sx={{ mb: 1 }}>
                  {stage === "cutting" && <CutIcon sx={{ fontSize: 32, color: "#1976d2" }} />}
                  {stage === "assembly" && <AssemblyIcon sx={{ fontSize: 32, color: "#f57c00" }} />}
                  {stage === "molding" && <MoldingIcon sx={{ fontSize: 32, color: "#388e3c" }} />}
                  {stage === "packing" && <PackingIcon sx={{ fontSize: 32, color: "#7b1fa2" }} />}
                </Box>
                <Typography variant="h6" sx={{ textTransform: "capitalize", fontWeight: "bold" }}>
                  {stage}
                </Typography>
                <Chip 
                  label={data.status} 
                  color={getStatusColor(data.status)} 
                  size="small" 
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Input: {data.input} pcs
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Output: {data.output} pcs
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Efficiency: {data.efficiency}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={data.efficiency} 
                  color={getEfficiencyColor(data.efficiency)}
                  sx={{ mt: 1 }}
                />
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  const AssemblyLineMonitoring = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "#f5f5f5" }}>
            <TableCell><strong>Line</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Current Product</strong></TableCell>
            <TableCell><strong>Speed (pcs/hr)</strong></TableCell>
            <TableCell><strong>Efficiency</strong></TableCell>
            <TableCell><strong>Daily Output</strong></TableCell>
            <TableCell><strong>Operator</strong></TableCell>
            <TableCell><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {getPaginatedAssemblyLines().map((line) => (
            <TableRow key={line.id}>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {line.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {line.id}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={line.status} 
                  color={getStatusColor(line.status)} 
                  size="small" 
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {line.currentProduct || "-"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {line.currentSpeed} / {line.capacity}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(line.currentSpeed / line.capacity) * 100} 
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </TableCell>
              <TableCell>
                <Chip 
                  label={`${line.efficiency}%`} 
                  color={getEfficiencyColor(line.efficiency)} 
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {line.output} / {line.target}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(line.output / line.target) * 100} 
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                    {line.operator ? line.operator.split(" ").map(n => n[0]).join("") : ""}
                  </Avatar>
                  <Typography variant="caption">
                    {line.operator || "Unassigned"}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  {/* WhatsApp Button */}
                  {selectedOrder && (
                    <WhatsAppButton
                      task={{
                        POId: selectedOrder.orderNumber,
                        DispatchUniqueId: selectedOrder.id,
                        ClientCode: selectedOrder.clientCode,
                        ClientName: selectedOrder.clientCode,
                        ProductCode: selectedOrder.productCode,
                        Status: line.status,
                        Quantity: selectedOrder.quantity
                      }}
                      stageName="MOULDING"
                      status={line.status === "Running" ? "IN_PROGRESS" : line.status === "Stopped" ? "COMPLETED" : "NEW"}
                      size="small"
                      variant="icon"
                    />
                  )}
                  <Tooltip title="Start">
                    <IconButton 
                      size="small" 
                      color="success"
                      onClick={() => handleMachineControl(line.id, "start")}
                      disabled={line.status === "Running"}
                    >
                      <StartIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Pause">
                    <IconButton 
                      size="small" 
                      color="warning"
                      onClick={() => handleMachineControl(line.id, "pause")}
                      disabled={line.status !== "Running"}
                    >
                      <PauseIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Stop">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleMachineControl(line.id, "stop")}
                      disabled={line.status === "Stopped"}
                    >
                      <StopIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {assemblyLines.length > 0 && (
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
                value={assemblyRowsPerPage}
                onChange={(e) => {
                  setAssemblyRowsPerPage(e.target.value);
                  setAssemblyPage(0);
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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
              {assemblyPage * assemblyRowsPerPage + 1}-{Math.min((assemblyPage + 1) * assemblyRowsPerPage, assemblyLines.length)} of {assemblyLines.length} items
            </Typography>
            
            {Math.ceil(assemblyLines.length / assemblyRowsPerPage) > 1 && (
              <Pagination
                count={Math.ceil(assemblyLines.length / assemblyRowsPerPage)}
                page={assemblyPage + 1}
                onChange={(event, value) => setAssemblyPage(value - 1)}
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
  );

  const MoldingMachineMonitoring = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "#f5f5f5" }}>
            <TableCell><strong>Machine</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Mold Type</strong></TableCell>
            <TableCell><strong>Current Mold</strong></TableCell>
            <TableCell><strong>Speed (pcs/hr)</strong></TableCell>
            <TableCell><strong>Efficiency</strong></TableCell>
            <TableCell><strong>Daily Output</strong></TableCell>
            <TableCell><strong>Operator</strong></TableCell>
            <TableCell><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {getPaginatedMoldingMachines().map((machine) => (
            <TableRow key={machine.id}>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {machine.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {machine.id}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={machine.status} 
                  color={getStatusColor(machine.status)} 
                  size="small" 
                />
              </TableCell>
              <TableCell>
                <Chip 
                  label={machine.moldType || "Unassigned"} 
                  size="small"
                  sx={{ 
                    bgcolor: machine.moldType === "Inner" ? "#ffeb3b" : 
                             machine.moldType === "Outer" ? "#4caf50" : 
                             machine.moldType === "Grommet" ? "#ff9800" : "#e0e0e0",
                    color: machine.moldType === "Outer" ? "white" : "black"
                  }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {machine.currentMold || "-"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {machine.currentSpeed} / {
                    machine.moldType === "Inner" ? machine.capacity.inner :
                    machine.moldType === "Outer" ? machine.capacity.outer :
                    machine.moldType === "Grommet" ? machine.capacity.grommet : 0
                  }
                </Typography>
                {machine.moldType && (
                  <LinearProgress 
                    variant="determinate" 
                    value={machine.moldType ? (machine.currentSpeed / (
                      machine.moldType === "Inner" ? machine.capacity.inner :
                      machine.moldType === "Outer" ? machine.capacity.outer :
                      machine.capacity.grommet
                    )) * 100 : 0}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                )}
              </TableCell>
              <TableCell>
                <Chip 
                  label={`${machine.efficiency}%`} 
                  color={getEfficiencyColor(machine.efficiency)} 
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {machine.output} / {machine.target}
                </Typography>
                {machine.target > 0 && (
                  <LinearProgress 
                    variant="determinate" 
                    value={(machine.output / machine.target) * 100} 
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                )}
              </TableCell>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                    {machine.operator ? machine.operator.split(" ").map(n => n[0]).join("") : ""}
                  </Avatar>
                  <Typography variant="caption">
                    {machine.operator || "Unassigned"}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Start">
                    <IconButton 
                      size="small" 
                      color="success"
                      onClick={() => handleMachineControl(machine.id, "start")}
                      disabled={machine.status === "Running"}
                    >
                      <StartIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Pause">
                    <IconButton 
                      size="small" 
                      color="warning"
                      onClick={() => handleMachineControl(machine.id, "pause")}
                      disabled={machine.status !== "Running"}
                    >
                      <PauseIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Stop">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleMachineControl(machine.id, "stop")}
                      disabled={machine.status === "Stopped"}
                    >
                      <StopIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {moldingMachines.length > 0 && (
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
                value={moldingRowsPerPage}
                onChange={(e) => {
                  setMoldingRowsPerPage(e.target.value);
                  setMoldingPage(0);
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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
              {moldingPage * moldingRowsPerPage + 1}-{Math.min((moldingPage + 1) * moldingRowsPerPage, moldingMachines.length)} of {moldingMachines.length} items
            </Typography>
            
            {Math.ceil(moldingMachines.length / moldingRowsPerPage) > 1 && (
              <Pagination
                count={Math.ceil(moldingMachines.length / moldingRowsPerPage)}
                page={moldingPage + 1}
                onChange={(event, value) => setMoldingPage(value - 1)}
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
  );

  const MoldCompatibilityMatrix = () => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "#f5f5f5" }}>
            <TableCell><strong>Mold</strong></TableCell>
            <TableCell><strong>Type</strong></TableCell>
            <TableCell><strong>Product Types</strong></TableCell>
            <TableCell><strong>Compatible Machines</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Location</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {getPaginatedMoldCompatibility().map((mold) => (
            <TableRow key={mold.id}>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {mold.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {mold.id}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={mold.type} 
                  size="small"
                  sx={{ 
                    bgcolor: mold.type === "Inner" ? "#ffeb3b" : 
                             mold.type === "Outer" ? "#4caf50" : 
                             mold.type === "Grommet" ? "#ff9800" : "#e0e0e0",
                    color: mold.type === "Outer" ? "white" : "black"
                  }}
                />
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={0.5}>
                  {mold.productTypes.map((type) => (
                    <Chip key={type} label={type} size="small" variant="outlined" />
                  ))}
                </Stack>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {mold.compatibleMachines.length} machines
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {mold.compatibleMachines.join(", ")}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={mold.status} 
                  color={mold.status === "Available" ? "success" : "warning"} 
                  size="small" 
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {mold.location}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {availableMolds.length > 0 && (
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
                value={moldCompatibilityRowsPerPage}
                onChange={(e) => {
                  setMoldCompatibilityRowsPerPage(e.target.value);
                  setMoldCompatibilityPage(0);
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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
              {moldCompatibilityPage * moldCompatibilityRowsPerPage + 1}-{Math.min((moldCompatibilityPage + 1) * moldCompatibilityRowsPerPage, availableMolds.length)} of {availableMolds.length} items
            </Typography>
            
            {Math.ceil(availableMolds.length / moldCompatibilityRowsPerPage) > 1 && (
              <Pagination
                count={Math.ceil(availableMolds.length / moldCompatibilityRowsPerPage)}
                page={moldCompatibilityPage + 1}
                onChange={(event, value) => setMoldCompatibilityPage(value - 1)}
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
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", color: "#1976d2" }}>
          🏭 Production Management System
        </Typography>
        <Typography variant="body1" sx={{ color: "#666", mb: 2 }}>
          Real-time monitoring and control of power cord production from cutting to packing
        </Typography>
        
        {/* Order Selection */}
        <Card sx={{ mb: 3, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Production Order</InputLabel>
                <Select
                  value={selectedOrder?.id || ""}
                  onChange={(e) => handleOrderSelection(e.target.value)}
                  label="Select Production Order"
                >
                  {availableOrders.map((order) => (
                    <MenuItem key={order.id} value={order.id}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {order.orderNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.productCode} - {order.productName} (Qty: {order.quantity})
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
              {selectedOrder && (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`Order: ${selectedOrder.orderNumber}`} 
                    color="primary" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`Product: ${selectedOrder.productCode}`} 
                    color="secondary" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`Quantity: ${selectedOrder.quantity}`} 
                    color="info" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`Priority: ${selectedOrder.priority}`} 
                    color={selectedOrder.priority === 'High' ? 'error' : selectedOrder.priority === 'Medium' ? 'warning' : 'default'} 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`Status: ${selectedOrder.status}`} 
                    color="success" 
                    variant="outlined" 
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        </Card>

        {/* Quick Actions */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<StartIcon />}
            onClick={handleStartProduction}
            disabled={loading || !selectedOrder}
            color="success"
          >
            {loading ? "Starting..." : "Start Production"}
          </Button>
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={syncWithSheets}
          >
            Sync Now
          </Button>
          <Button
            variant="outlined"
            startIcon={<OrderIcon />}
            onClick={() => window.location.href = '/molding-production'}
          >
            Production Planning
          </Button>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
          >
            Settings
          </Button>
        </Stack>
      </Box>

      {/* Current Order Status */}
      <Card sx={{ mb: 3, bgcolor: "#e3f2fd" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <OrderIcon color="primary" />
            Current Order Status
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">Batch / Dispatch</Typography>
              <Typography variant="h6">{selectedOrder?.orderNumber || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">Product</Typography>
              <Typography variant="h6">{selectedOrder?.productCode || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">Quantity</Typography>
              <Typography variant="h6">{selectedOrder?.quantity ? `${selectedOrder.quantity} pcs` : '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Chip label={selectedOrder?.status || 'N/A'} color="success" />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Production Flow */}
      <ProductionFlowCard />

      {/* Main Tabs */}
      <Box sx={{ width: "100%" }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab 
            label={
              <Badge badgeContent={assemblyLines.filter(l => l.status === "Running").length} color="success">
                Assembly Lines
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={moldingMachines.filter(m => m.status === "Running").length} color="success">
                Molding Machines
              </Badge>
            } 
          />
          <Tab label="Mold Compatibility" />
          <Tab 
            label={
              <Badge badgeContent={packingLines.filter(l => l.status === "Running").length} color="success">
                Packing Lines
              </Badge>
            } 
          />
        </Tabs>

        {/* Tab Panels */}
        <Box sx={{ mt: 3 }}>
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AssemblyIcon color="primary" />
                Assembly Line Monitoring
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  (Stripping, Pin Insertion, Terminal Assembly)
                </Typography>
              </Typography>
              <AssemblyLineMonitoring />
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <MoldingIcon color="primary" />
                Molding Machine Monitoring
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  (Inner 300pcs/hr, Outer 600pcs/hr, Grommet 800pcs/hr)
                </Typography>
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Production Ratio:</strong> Inner molding runs at 2:1 ratio compared to outer molding. 
                Two inner machines typically needed to match one outer machine output.
              </Alert>
              <MoldingMachineMonitoring />
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <SettingsIcon color="primary" />
                Mold-Machine Compatibility Matrix
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  (50-60 molds available)
                </Typography>
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>Changeover Note:</strong> Mold changes require machine downtime. Plan changes during shift breaks or low-demand periods.
              </Alert>
              <MoldCompatibilityMatrix />
            </Box>
          )}

          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PackingIcon color="primary" />
                Packing Line Monitoring
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                      <TableCell><strong>Line</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Speed (pcs/hr)</strong></TableCell>
                      <TableCell><strong>Efficiency</strong></TableCell>
                      <TableCell><strong>Daily Output</strong></TableCell>
                      <TableCell><strong>Operator</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getPaginatedPackingLines().map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                            {line.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {line.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={line.status} 
                            color={getStatusColor(line.status)} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {line.currentSpeed} / {line.capacity}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={(line.currentSpeed / line.capacity) * 100} 
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${line.efficiency}%`} 
                            color={getEfficiencyColor(line.efficiency)} 
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {line.output} / {line.target}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={(line.output / line.target) * 100} 
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                              {line.operator ? line.operator.split(" ").map(n => n[0]).join("") : ""}
                            </Avatar>
                            <Typography variant="caption">
                              {line.operator || "Unassigned"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Start">
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => handleMachineControl(line.id, "start")}
                                disabled={line.status === "Running"}
                              >
                                <StartIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Pause">
                              <IconButton 
                                size="small" 
                                color="warning"
                                onClick={() => handleMachineControl(line.id, "pause")}
                                disabled={line.status !== "Running"}
                              >
                                <PauseIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Stop">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleMachineControl(line.id, "stop")}
                                disabled={line.status === "Stopped"}
                              >
                                <StopIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {packingLines.length > 0 && (
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
                          value={packingRowsPerPage}
                          onChange={(e) => {
                            setPackingRowsPerPage(e.target.value);
                            setPackingPage(0);
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

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                        {packingPage * packingRowsPerPage + 1}-{Math.min((packingPage + 1) * packingRowsPerPage, packingLines.length)} of {packingLines.length} items
                      </Typography>
                      
                      {Math.ceil(packingLines.length / packingRowsPerPage) > 1 && (
                        <Pagination
                          count={Math.ceil(packingLines.length / packingRowsPerPage)}
                          page={packingPage + 1}
                          onChange={(event, value) => setPackingPage(value - 1)}
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
            </Box>
          )}
        </Box>
      </Box>

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

export default ProductionManagement;
