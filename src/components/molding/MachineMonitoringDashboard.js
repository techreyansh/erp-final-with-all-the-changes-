import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import {
  Thermostat as TempIcon,
  Speed as SpeedIcon,
  Compress as PressureIcon,
  ElectricBolt as PowerIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendIcon,
  Timeline as ChartIcon,
} from "@mui/icons-material";

const MachineMonitoringDashboard = () => {
  const [machineData, setMachineData] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [realTimeAlerts, setRealTimeAlerts] = useState([]);

  // Simulate real-time machine data with IoT sensors
  const simulateMachineData = () => {
    return [
      {
        id: "IM-001",
        name: "Engel Victory 200",
        status: "running",
        currentProduct: "3-Pin 16A Plug",
        sensors: {
          barrelTemperature: 225 + (Math.random() - 0.5) * 10,
          moldTemperature: 60 + (Math.random() - 0.5) * 5,
          injectionPressure: 1800 + (Math.random() - 0.5) * 200,
          clampForce: 180 + (Math.random() - 0.5) * 20,
          cycleTime: 28 + (Math.random() - 0.5) * 3,
          powerConsumption: 22 + (Math.random() - 0.5) * 2,
          hydraulicPressure: 140 + (Math.random() - 0.5) * 10,
          vibration: 0.8 + Math.random() * 0.4
        },
        production: {
          cyclesCompleted: 1547 + Math.floor(Math.random() * 5),
          goodParts: 1521,
          rejectedParts: 26,
          currentCycleRate: 108 + Math.random() * 10,
          plannedCycleRate: 120,
          efficiency: 88 + Math.random() * 4
        },
        maintenance: {
          lastService: "2024-03-15",
          nextService: "2024-04-15",
          hoursToMaintenance: 156,
          oilLevel: 85,
          filterCondition: "Good"
        },
        oee: {
          availability: 92 + Math.random() * 5,
          performance: 88 + Math.random() * 8,
          quality: 95 + Math.random() * 3,
          overall: 0
        }
      },
      {
        id: "IM-002",
        name: "Arburg Allrounder 370S",
        status: "idle",
        currentProduct: null,
        sensors: {
          barrelTemperature: 25,
          moldTemperature: 22,
          injectionPressure: 0,
          clampForce: 0,
          cycleTime: 0,
          powerConsumption: 2.5,
          hydraulicPressure: 20,
          vibration: 0.1
        },
        production: {
          cyclesCompleted: 2341,
          goodParts: 2287,
          rejectedParts: 54,
          currentCycleRate: 0,
          plannedCycleRate: 150,
          efficiency: 0
        },
        maintenance: {
          lastService: "2024-03-10",
          nextService: "2024-04-10",
          hoursToMaintenance: 234,
          oilLevel: 92,
          filterCondition: "Excellent"
        },
        oee: {
          availability: 98,
          performance: 0,
          quality: 97,
          overall: 0
        }
      },
      {
        id: "IM-003",
        name: "Haitian Jupiter III 250",
        status: "setup",
        currentProduct: "2-Pin 6A Plug",
        sensors: {
          barrelTemperature: 190 + (Math.random() - 0.5) * 15,
          moldTemperature: 45 + (Math.random() - 0.5) * 5,
          injectionPressure: 900 + (Math.random() - 0.5) * 100,
          clampForce: 50 + (Math.random() - 0.5) * 10,
          cycleTime: 0,
          powerConsumption: 8 + Math.random() * 2,
          hydraulicPressure: 80 + (Math.random() - 0.5) * 10,
          vibration: 0.3 + Math.random() * 0.2
        },
        production: {
          cyclesCompleted: 986,
          goodParts: 962,
          rejectedParts: 24,
          currentCycleRate: 0,
          plannedCycleRate: 100,
          efficiency: 0
        },
        maintenance: {
          lastService: "2024-03-20",
          nextService: "2024-04-20", 
          hoursToMaintenance: 89,
          oilLevel: 76,
          filterCondition: "Fair"
        },
        oee: {
          availability: 85,
          performance: 0,
          quality: 97,
          overall: 0
        }
      }
    ];
  };

  // Calculate OEE
  const calculateOEE = (machine) => {
    const { availability, performance, quality } = machine.oee;
    return ((availability / 100) * (performance / 100) * (quality / 100) * 100).toFixed(1);
  };

  // Generate real-time alerts based on sensor data
  const generateAlerts = (machines) => {
    const alerts = [];
    
    machines.forEach(machine => {
      // Temperature alerts
      if (machine.sensors.barrelTemperature > 280) {
        alerts.push({
          machineId: machine.id,
          machineName: machine.name,
          type: "Critical",
          message: "Barrel temperature exceeds safe limit",
          value: `${machine.sensors.barrelTemperature.toFixed(1)}°C`,
          timestamp: new Date().toLocaleTimeString()
        });
      }
      
      // Pressure alerts
      if (machine.sensors.injectionPressure > 2200) {
        alerts.push({
          machineId: machine.id,
          machineName: machine.name,
          type: "Warning",
          message: "High injection pressure detected",
          value: `${machine.sensors.injectionPressure.toFixed(0)} bar`,
          timestamp: new Date().toLocaleTimeString()
        });
      }
      
      // Vibration alerts
      if (machine.sensors.vibration > 1.5) {
        alerts.push({
          machineId: machine.id,
          machineName: machine.name,
          type: "Warning",
          message: "Elevated vibration levels",
          value: `${machine.sensors.vibration.toFixed(2)} g`,
          timestamp: new Date().toLocaleTimeString()
        });
      }

      // Maintenance alerts
      if (machine.maintenance.hoursToMaintenance < 100) {
        alerts.push({
          machineId: machine.id,
          machineName: machine.name,
          type: "Info",
          message: "Maintenance due soon",
          value: `${machine.maintenance.hoursToMaintenance}h remaining`,
          timestamp: new Date().toLocaleTimeString()
        });
      }

      // OEE alerts
      const oeeScore = calculateOEE(machine);
      if (oeeScore < 75 && machine.status === "running") {
        alerts.push({
          machineId: machine.id,
          machineName: machine.name,
          type: "Warning",
          message: "OEE below target threshold",
          value: `${oeeScore}%`,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    });

    return alerts.slice(0, 10); // Keep only latest 10 alerts
  };

  // Real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = simulateMachineData();
      setMachineData(newData);
      
      // Update OEE calculation
      newData.forEach(machine => {
        machine.oee.overall = calculateOEE(machine);
      });

      // Generate alerts
      const alerts = generateAlerts(newData);
      setRealTimeAlerts(alerts);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return '#4caf50';
      case 'idle': return '#ff9800';
      case 'setup': return '#2196f3';
      case 'maintenance': return '#f44336';
      case 'alarm': return '#e91e63';
      default: return '#9e9e9e';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'Critical': return 'error';
      case 'Warning': return 'warning';
      case 'Info': return 'info';
      default: return 'default';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'Critical': return <ErrorIcon />;
      case 'Warning': return <WarningIcon />;
      case 'Info': return <CheckIcon />;
      default: return <CheckIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1976d2" }}>
          📊 Real-time Machine Monitoring
        </Typography>
        <Button
          variant="outlined"
          startIcon={<WarningIcon />}
          onClick={() => setAlertsOpen(true)}
          color={realTimeAlerts.length > 0 ? "error" : "primary"}
        >
          Alerts ({realTimeAlerts.length})
        </Button>
      </Box>

      {/* Machine Status Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {machineData.map((machine) => (
          <Grid item xs={12} md={4} key={machine.id}>
            <Card 
              sx={{ 
                border: `2px solid ${getStatusColor(machine.status)}`,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
              onClick={() => setSelectedMachine(machine)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {machine.name}
                  </Typography>
                  <Chip 
                    label={machine.status.toUpperCase()} 
                    sx={{ 
                      bgcolor: getStatusColor(machine.status),
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>

                {machine.currentProduct && (
                  <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                    Current: {machine.currentProduct}
                  </Typography>
                )}

                {/* Key Sensors */}
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TempIcon sx={{ mr: 1, color: '#ff5722' }} />
                      <Typography variant="body2">
                        {Math.round(machine.sensors.barrelTemperature)}°C
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PressureIcon sx={{ mr: 1, color: '#2196f3' }} />
                      <Typography variant="body2">
                        {Math.round(machine.sensors.injectionPressure)} bar
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SpeedIcon sx={{ mr: 1, color: '#4caf50' }} />
                      <Typography variant="body2">
                        {Math.round(machine.production.currentCycleRate)} c/h
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PowerIcon sx={{ mr: 1, color: '#ff9800' }} />
                      <Typography variant="body2">
                        {machine.sensors.powerConsumption.toFixed(1)} kW
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* OEE Score */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      OEE Score
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      {calculateOEE(machine)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={parseFloat(calculateOEE(machine))} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: parseFloat(calculateOEE(machine)) >= 85 ? '#4caf50' : 
                                       parseFloat(calculateOEE(machine)) >= 75 ? '#ff9800' : '#f44336'
                      }
                    }}
                  />
                </Box>

                {/* Production Summary */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#666' }}>
                  <span>Cycles: {machine.production.cyclesCompleted.toLocaleString()}</span>
                  <span>Quality: {((machine.production.goodParts / machine.production.cyclesCompleted) * 100).toFixed(1)}%</span>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Alerts */}
      {realTimeAlerts.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              🚨 Real-time Alerts
            </Typography>
            <Grid container spacing={2}>
              {realTimeAlerts.slice(0, 6).map((alert, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Alert 
                    severity={getAlertColor(alert.type)}
                    icon={getAlertIcon(alert.type)}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {alert.machineName}: {alert.message}
                      </Typography>
                      <Typography variant="body2">
                        Value: {alert.value} • {alert.timestamp}
                      </Typography>
                    </Box>
                  </Alert>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Alerts Dialog */}
      <Dialog 
        open={alertsOpen} 
        onClose={() => setAlertsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          🚨 Real-time System Alerts
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Machine</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Message</strong></TableCell>
                  <TableCell><strong>Value</strong></TableCell>
                  <TableCell><strong>Time</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {realTimeAlerts.map((alert, index) => (
                  <TableRow key={index}>
                    <TableCell>{alert.machineName}</TableCell>
                    <TableCell>
                      <Chip 
                        label={alert.type}
                        color={getAlertColor(alert.type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{alert.message}</TableCell>
                    <TableCell>{alert.value}</TableCell>
                    <TableCell>{alert.timestamp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Machine Detail Dialog */}
      {selectedMachine && (
        <Dialog 
          open={Boolean(selectedMachine)} 
          onClose={() => setSelectedMachine(null)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            {selectedMachine.name} - Detailed Monitoring
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              {/* Sensor Data */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  📡 Sensor Readings
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Barrel Temperature</TableCell>
                        <TableCell>{selectedMachine.sensors.barrelTemperature.toFixed(1)}°C</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Mold Temperature</TableCell>
                        <TableCell>{selectedMachine.sensors.moldTemperature.toFixed(1)}°C</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Injection Pressure</TableCell>
                        <TableCell>{selectedMachine.sensors.injectionPressure.toFixed(0)} bar</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Clamp Force</TableCell>
                        <TableCell>{selectedMachine.sensors.clampForce.toFixed(1)} T</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Power Consumption</TableCell>
                        <TableCell>{selectedMachine.sensors.powerConsumption.toFixed(1)} kW</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Vibration</TableCell>
                        <TableCell>{selectedMachine.sensors.vibration.toFixed(2)} g</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* OEE Breakdown */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  📊 OEE Breakdown
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">Availability: {selectedMachine.oee.availability.toFixed(1)}%</Typography>
                  <LinearProgress variant="determinate" value={selectedMachine.oee.availability} sx={{ mb: 1 }} />
                  
                  <Typography variant="body2">Performance: {selectedMachine.oee.performance.toFixed(1)}%</Typography>
                  <LinearProgress variant="determinate" value={selectedMachine.oee.performance} sx={{ mb: 1 }} />
                  
                  <Typography variant="body2">Quality: {selectedMachine.oee.quality.toFixed(1)}%</Typography>
                  <LinearProgress variant="determinate" value={selectedMachine.oee.quality} sx={{ mb: 1 }} />
                  
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Overall OEE: {calculateOEE(selectedMachine)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={parseFloat(calculateOEE(selectedMachine))} 
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedMachine(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default MachineMonitoringDashboard; 