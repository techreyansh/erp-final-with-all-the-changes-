import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  Cable as CableIcon,
  Engineering as PlanningIcon,
  Schedule as ScheduleIcon,
  Inventory as MaterialIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Build as BunchingIcon,
  Transform as ExtruderIcon,
  GroupWork as LayingIcon,
  Loop as CoilingIcon,
} from '@mui/icons-material';
import sheetService from '../../services/sheetService';
import materialCalculationService from '../../services/materialCalculationService';

const CableProductionTaskDetail = ({ task, onCreatePlan, onUpdateTask }) => {
  const [productionPlan, setProductionPlan] = useState(null);
  const [machineSchedules, setMachineSchedules] = useState([]);
  const [materialRequirements, setMaterialRequirements] = useState(null);
  const [cableProduct, setCableProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openPlanDialog, setOpenPlanDialog] = useState(false);

  const machineTypeIcons = {
    bunching: <BunchingIcon />,
    extruder: <ExtruderIcon />,
    laying: <LayingIcon />,
    final_extruder: <ExtruderIcon />,
    coiling: <CoilingIcon />,
  };

  useEffect(() => {
    if (task) {
      fetchCableProductionData();
    }
  }, [task]);

  const fetchCableProductionData = async () => {
    try {
      setLoading(true);

      // Check if there's already a production plan for this task
      const plans = await sheetService.getSheetData("Cable Production Plans");
      const existingPlan = plans.find(p => p.orderNumber === task.POId);
      
      if (existingPlan) {
        setProductionPlan(existingPlan);
        
        // Fetch related machine schedules
        const schedules = await sheetService.getSheetData("Machine Schedules");
        const taskSchedules = schedules.filter(s => s.planId === existingPlan.planId);
        setMachineSchedules(taskSchedules);

        // Parse material requirements if available
        if (existingPlan.materialRequirements) {
          setMaterialRequirements(JSON.parse(existingPlan.materialRequirements));
        }
      }

      // Try to find cable product information
      const products = await sheetService.getSheetData("Cable Products");
      const product = products.find(p => p.productCode === task.ProductCode);
      if (product) {
        setCableProduct(product);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching cable production data:', error);
      setLoading(false);
    }
  };

  const handleCreateProductionPlan = async () => {
    if (!cableProduct) {
      alert('Cable product information not found. Please add product to Cable Products first.');
      return;
    }

    try {
      // Calculate material requirements
      const orderData = {
        orderNumber: task.POId,
        quantity: task.Quantity,
        length: cableProduct.standardLength // Use standard length or allow customization
      };

      const requirements = materialCalculationService.calculateMaterialRequirements(
        orderData,
        cableProduct
      );

      // Create production plan
      const planData = {
        planId: `PDP-${task.POId}`,
        orderNumber: task.POId,
        customerName: task.ClientCode,
        productCode: task.ProductCode,
        quantity: task.Quantity,
        length: cableProduct.standardLength,
        dueDate: task.DueDate,
        priority: "Medium",
        status: "Ready",
        materialRequirements: JSON.stringify(requirements),
        machineSchedule: JSON.stringify({}),
        remarks: `Auto-generated from PO ${task.POId}`,
        createdDate: new Date().toISOString()
      };

      await sheetService.appendRow("Cable Production Plans", planData);
      
      // Generate machine schedules
      await generateMachineSchedules(planData.planId, requirements, cableProduct);

      // Refresh data
      await fetchCableProductionData();
      
      setOpenPlanDialog(false);
    } catch (error) {
      console.error('Error creating production plan:', error);
      alert('Error creating production plan: ' + error.message);
    }
  };

  const generateMachineSchedules = async (planId, requirements, product) => {
    const schedules = [];
    const needsBunching = product.needsBunching || parseInt(product.strandCount) > 24;
    const coreColors = JSON.parse(product.coreColors || '["red"]');
    let sequence = 1;

    // Bunching if needed
    if (needsBunching) {
      schedules.push({
        scheduleId: `SCH-${planId}-${sequence}`,
        planId: planId,
        machineType: "bunching",
        machineId: "BM-001",
        operation: "Bundle copper strands",
        sequence: sequence++,
        quantity: requirements.orderSummary.totalSingleCoreLength,
        unit: "meters",
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
        estimatedDuration: "10",
        actualDuration: "",
        status: "Scheduled",
        operatorName: "",
        priority: "Medium",
        dependencies: "",
        notes: "Copper bunching for all cores"
      });
    }

    // Extrusion for each core color
    coreColors.forEach((color, index) => {
      schedules.push({
        scheduleId: `SCH-${planId}-${sequence}`,
        planId: planId,
        machineType: "extruder",
        machineId: `EXT-${String(index + 1).padStart(3, '0')}`,
        operation: `Extrude ${color} core`,
        sequence: sequence++,
        quantity: requirements.orderSummary.totalFinishedLength,
        unit: "meters",
        startTime: new Date(Date.now() + (needsBunching ? 10 : 0) * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + (needsBunching ? 28 : 18) * 60 * 60 * 1000).toISOString(),
        estimatedDuration: "18",
        actualDuration: "",
        status: "Scheduled",
        operatorName: "",
        priority: "Medium",
        dependencies: needsBunching ? `SCH-${planId}-1` : "",
        notes: `${color} core extrusion`
      });
    });

    // Laying (if multi-core)
    if (coreColors.length > 1) {
      schedules.push({
        scheduleId: `SCH-${planId}-${sequence}`,
        planId: planId,
        machineType: "laying",
        machineId: "LAY-001",
        operation: "Combine cores",
        sequence: sequence++,
        quantity: requirements.orderSummary.totalFinishedLength,
        unit: "meters",
        startTime: new Date(Date.now() + (needsBunching ? 28 : 18) * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + (needsBunching ? 40 : 30) * 60 * 60 * 1000).toISOString(),
        estimatedDuration: "12",
        actualDuration: "",
        status: "Scheduled",
        operatorName: "",
        priority: "Medium",
        dependencies: schedules.filter(s => s.machineType === "extruder").map(s => s.scheduleId).join(","),
        notes: "Combine all cores into final cable"
      });
    }

    // Final extrusion
    schedules.push({
      scheduleId: `SCH-${planId}-${sequence}`,
      planId: planId,
      machineType: "final_extruder",
      machineId: "FEXT-001",
      operation: "Apply outer sheath",
      sequence: sequence++,
      quantity: requirements.orderSummary.totalFinishedLength,
      unit: "meters",
      startTime: new Date(Date.now() + (needsBunching ? 40 : 30) * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + (needsBunching ? 52 : 42) * 60 * 60 * 1000).toISOString(),
      estimatedDuration: "12",
      actualDuration: "",
      status: "Scheduled",
      operatorName: "",
      priority: "Medium",
      dependencies: coreColors.length > 1 ? `SCH-${planId}-${sequence-1}` : schedules.filter(s => s.machineType === "extruder").map(s => s.scheduleId).join(","),
      notes: "Apply outer PVC sheath"
    });

    // Coiling
    schedules.push({
      scheduleId: `SCH-${planId}-${sequence}`,
      planId: planId,
      machineType: "coiling",
      machineId: "COIL-001",
      operation: "Wind and package",
      sequence: sequence++,
      quantity: task.Quantity,
      unit: "pieces",
      startTime: new Date(Date.now() + (needsBunching ? 52 : 42) * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + (needsBunching ? 60 : 50) * 60 * 60 * 1000).toISOString(),
      estimatedDuration: "8",
      actualDuration: "",
      status: "Scheduled",
      operatorName: "",
      priority: "Medium",
      dependencies: `SCH-${planId}-${sequence-1}`,
      notes: "Final coiling and packaging"
    });

    // Save all schedules
    for (const schedule of schedules) {
      await sheetService.appendRow("Machine Schedules", schedule);
    }
  };

  const updateScheduleStatus = async (schedule, newStatus) => {
    try {
      const scheduleIndex = machineSchedules.findIndex(s => s.scheduleId === schedule.scheduleId);
      const updatedSchedule = { 
        ...schedule, 
        status: newStatus,
        actualStartTime: newStatus === "In Progress" ? new Date().toISOString() : schedule.actualStartTime,
        actualEndTime: newStatus === "Completed" ? new Date().toISOString() : schedule.actualEndTime,
      };
      
      await sheetService.updateRow("Machine Schedules", scheduleIndex + 2, updatedSchedule);
      
      // Refresh data
      await fetchCableProductionData();
    } catch (error) {
      console.error('Error updating schedule status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "success";
      case "In Progress": return "warning";
      case "Scheduled": return "info";
      default: return "default";
    }
  };

  const getProductionProgress = () => {
    if (!machineSchedules.length) return 0;
    const completed = machineSchedules.filter(s => s.status === "Completed").length;
    return (completed / machineSchedules.length) * 100;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <LinearProgress />
          <Typography>Loading cable production details...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Production Plan Overview */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <CableIcon sx={{ mr: 1 }} />
            Cable Production Overview
          </Typography>
          
          {productionPlan ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Plan ID
                </Typography>
                <Typography variant="body1">{productionPlan.planId}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip 
                  label={productionPlan.status} 
                  color={getStatusColor(productionPlan.status)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Progress
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={getProductionProgress()} 
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption">
                    {Math.round(getProductionProgress())}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Due Date
                </Typography>
                <Typography variant="body1">
                  {new Date(productionPlan.dueDate).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          ) : (
            <Alert 
              severity="warning" 
              action={
                <Button 
                  size="small" 
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenPlanDialog(true)}
                >
                  Create Plan
                </Button>
              }
            >
              No production plan found for this cable order. Create a detailed production plan to track machine scheduling and material requirements.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Cable Product Information */}
      {cableProduct && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Product Specifications
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Cable Type</Typography>
                <Typography variant="body1">{cableProduct.cableType?.replace('_', ' ')}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Amp Rating</Typography>
                <Typography variant="body1">{cableProduct.ampRating}A</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Copper Size</Typography>
                <Typography variant="body1">{cableProduct.copperSize} sq mm</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Cores</Typography>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {(cableProduct.coreColors ? JSON.parse(cableProduct.coreColors) : []).map((color, idx) => (
                    <Chip
                      key={idx}
                      label={color}
                      size="small"
                      sx={{
                        backgroundColor: color === "yellow-green" ? "#9ccc65" : color,
                        color: ["yellow", "white", "pink"].includes(color) ? "black" : "white",
                      }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Material Requirements */}
      {materialRequirements && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <MaterialIcon sx={{ mr: 1 }} />
              Material Requirements
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Copper Required</Typography>
                <Typography variant="h6" color="warning.main">
                  {materialRequirements.copper?.copperWithWaste} kg
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">PVC Required</Typography>
                <Typography variant="h6" color="info.main">
                  {materialRequirements.pvc?.totalPVCWeight} kg
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Total Length</Typography>
                <Typography variant="h6">
                  {materialRequirements.orderSummary?.totalFinishedLength?.toLocaleString()} m
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Estimated Cost</Typography>
                <Typography variant="h6" color="success.main">
                  ₹{materialRequirements.costs?.totalMaterialCost?.toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Machine Schedule */}
      {machineSchedules.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <ScheduleIcon sx={{ mr: 1 }} />
              Machine Schedule
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Seq</TableCell>
                    <TableCell>Machine</TableCell>
                    <TableCell>Operation</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {machineSchedules
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((schedule, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Chip label={schedule.sequence} size="small" color="primary" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {machineTypeIcons[schedule.machineType]}
                          {schedule.machineId}
                        </Box>
                      </TableCell>
                      <TableCell>{schedule.operation}</TableCell>
                      <TableCell>{schedule.quantity} {schedule.unit}</TableCell>
                      <TableCell>{schedule.estimatedDuration}h</TableCell>
                      <TableCell>
                        <Chip
                          label={schedule.status}
                          color={getStatusColor(schedule.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {schedule.status === "Scheduled" && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<StartIcon />}
                            onClick={() => updateScheduleStatus(schedule, "In Progress")}
                          >
                            Start
                          </Button>
                        )}
                        {schedule.status === "In Progress" && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            startIcon={<CompleteIcon />}
                            onClick={() => updateScheduleStatus(schedule, "Completed")}
                          >
                            Complete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Create Plan Dialog */}
      <Dialog open={openPlanDialog} onClose={() => setOpenPlanDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Cable Production Plan</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            This will create a detailed production plan for PO {task.POId} including:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><MaterialIcon /></ListItemIcon>
              <ListItemText primary="Material requirement calculations" />
            </ListItem>
            <ListItem>
              <ListItemIcon><ScheduleIcon /></ListItemIcon>
              <ListItemText primary="Machine scheduling workflow" />
            </ListItem>
            <ListItem>
              <ListItemIcon><PlanningIcon /></ListItemIcon>
              <ListItemText primary="Production sequence planning" />
            </ListItem>
          </List>
          {!cableProduct && (
            <Alert severity="error">
              Product {task.ProductCode} not found in Cable Products master. Please add it first.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPlanDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateProductionPlan} 
            variant="contained"
            disabled={!cableProduct}
          >
            Create Plan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CableProductionTaskDetail; 