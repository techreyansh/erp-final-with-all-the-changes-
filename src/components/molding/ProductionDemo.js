import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  LinearProgress,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  ContentCut as CutIcon,
  Build as AssemblyIcon,
  Engineering as MoldingIcon,
  LocalShipping as PackingIcon,
} from "@mui/icons-material";

const ProductionDemo = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [demoData, setDemoData] = useState({
    order: {
      orderNumber: "ORD-2024-001",
      productCode: "PC-3P-16A-1.5",
      quantity: 10000,
      cableLength: 155, // meters available
      targetLength: 1.5, // meters per piece
      expectedPieces: 103 // 155 / 1.5 = 103 pieces
    },
    cutting: {
      input: 155,
      output: 103,
      efficiency: 98,
      wastePercentage: 2
    },
    assembly: {
      lines: [
        { id: "ASM-L01", capacity: 600, allocated: 26, efficiency: 97 },
        { id: "ASM-L02", capacity: 580, allocated: 26, efficiency: 95 },
        { id: "ASM-L03", capacity: 620, allocated: 26, efficiency: 98 },
        { id: "ASM-L04", capacity: 590, allocated: 25, efficiency: 94 }
      ],
      totalOutput: 103
    },
    molding: {
      inner: [
        { id: "MOLD-M01", type: "Inner", capacity: 300, allocated: 52, efficiency: 95 },
        { id: "MOLD-M02", type: "Inner", capacity: 290, allocated: 51, efficiency: 93 }
      ],
      outer: [
        { id: "MOLD-M03", type: "Outer", capacity: 650, allocated: 103, efficiency: 96 }
      ],
      totalOutput: 103
    },
    packing: {
      lines: [
        { id: "PACK-L01", capacity: 600, allocated: 103, efficiency: 97 }
      ],
      totalOutput: 103
    }
  });

  const steps = [
    {
      label: "Cable Cutting",
      description: "Cut 155m cable into 103 pieces of 1.5m each",
      icon: <CutIcon />,
      data: demoData.cutting
    },
    {
      label: "Assembly Process", 
      description: "4 assembly lines processing stripping, pins, and terminals",
      icon: <AssemblyIcon />,
      data: demoData.assembly
    },
    {
      label: "Molding Process",
      description: "Inner molding (2 machines) + Outer molding (1 machine)",
      icon: <MoldingIcon />,
      data: demoData.molding
    },
    {
      label: "Final Packing",
      description: "Package finished power cords",
      icon: <PackingIcon />,
      data: demoData.packing
    }
  ];

  const runDemo = () => {
    setIsRunning(true);
    setActiveStep(0);
    
    // Simulate production steps
    const interval = setInterval(() => {
      setActiveStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setIsRunning(false);
          return prev;
        }
      });
    }, 2000);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", color: "#1976d2" }}>
        🎬 Production Management Demo
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 4, color: "#666" }}>
        Live demonstration of power cord production flow according to your requirements
      </Typography>

      {/* Current Order */}
      <Card sx={{ mb: 3, bgcolor: "#e3f2fd" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
            📋 Current Production Order
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Order Number</Typography>
              <Typography variant="h6">{demoData.order.orderNumber}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Product</Typography>
              <Typography variant="h6">{demoData.order.productCode}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Cable Available</Typography>
              <Typography variant="h6">{demoData.order.cableLength}m</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Expected Output</Typography>
              <Typography variant="h6">{demoData.order.expectedPieces} pieces</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Production Flow Demo */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              🏭 Production Flow Demonstration
            </Typography>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={runDemo}
              disabled={isRunning}
              color="success"
            >
              {isRunning ? "Running Demo..." : "Start Demo"}
            </Button>
          </Stack>

          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {step.icon}
                    <Typography variant="h6">{step.label}</Typography>
                  </Box>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {step.description}
                  </Typography>

                  {/* Cutting Step */}
                  {index === 0 && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <strong>Cutting Result:</strong> {step.data.input}m cable → {step.data.output} pieces 
                      (Efficiency: {step.data.efficiency}%, Waste: {step.data.wastePercentage}%)
                    </Alert>
                  )}

                  {/* Assembly Step */}
                  {index === 1 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
                        Assembly Line Allocation:
                      </Typography>
                      {step.data.lines.map((line) => (
                        <Box key={line.id} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                          <Typography variant="body2" sx={{ minWidth: 80 }}>{line.id}:</Typography>
                          <Typography variant="body2">{line.allocated} pieces</Typography>
                          <Chip label={`${line.efficiency}%`} size="small" color="success" />
                          <LinearProgress 
                            variant="determinate" 
                            value={line.efficiency} 
                            sx={{ flexGrow: 1, maxWidth: 100 }}
                          />
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* Molding Step */}
                  {index === 2 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
                        Molding Machine Allocation:
                      </Typography>
                      
                      <Typography variant="body2" sx={{ fontStyle: "italic", mb: 1 }}>
                        Inner Molding (2:1 ratio - needs 2 machines for 1 outer):
                      </Typography>
                      {step.data.inner.map((machine) => (
                        <Box key={machine.id} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1, ml: 2 }}>
                          <Typography variant="body2" sx={{ minWidth: 100 }}>{machine.id}:</Typography>
                          <Chip label="Inner" size="small" sx={{ bgcolor: "#ffeb3b" }} />
                          <Typography variant="body2">{machine.allocated} pieces</Typography>
                          <Typography variant="body2">({machine.capacity} pcs/hr)</Typography>
                          <Chip label={`${machine.efficiency}%`} size="small" color="success" />
                        </Box>
                      ))}
                      
                      <Typography variant="body2" sx={{ fontStyle: "italic", mb: 1, mt: 2 }}>
                        Outer Molding:
                      </Typography>
                      {step.data.outer.map((machine) => (
                        <Box key={machine.id} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1, ml: 2 }}>
                          <Typography variant="body2" sx={{ minWidth: 100 }}>{machine.id}:</Typography>
                          <Chip label="Outer" size="small" sx={{ bgcolor: "#4caf50", color: "white" }} />
                          <Typography variant="body2">{machine.allocated} pieces</Typography>
                          <Typography variant="body2">({machine.capacity} pcs/hr)</Typography>
                          <Chip label={`${machine.efficiency}%`} size="small" color="success" />
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* Packing Step */}
                  {index === 3 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <strong>Final Output:</strong> {step.data.totalOutput} power cords ready for shipment
                      <br />
                      <strong>Overall Process Efficiency:</strong> 96% (Target: 600 pcs/hr achieved)
                    </Alert>
                  )}

                  {isRunning && activeStep === index && (
                    <LinearProgress sx={{ mt: 2, width: 300 }} />
                  )}
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {activeStep === steps.length && (
            <Box sx={{ mt: 3, p: 3, bgcolor: "#e8f5e8", borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#2e7d32", mb: 2 }}>
                ✅ Production Complete!
              </Typography>
              <Typography variant="body1">
                Successfully produced {demoData.order.expectedPieces} power cords following the complete workflow:
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: "#666" }}>
                Material Inward → Cable Cutting → Assembly (4 lines) → Molding (Inner + Outer) → Final Packing
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Key Features */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
            🎯 Key Production Management Features Implemented
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Real-time Monitoring
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Live status of 4 assembly lines and 6 molding machines
                  <br />• Production flow tracking from cutting to packing
                  <br />• Efficiency monitoring and alerts
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Mold-Machine Compatibility
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • 50-60 molds with compatibility matrix
                  <br />• Changeover time optimization
                  <br />• Machine allocation planning
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Production Ratios
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Inner molding: 300 pcs/hr (2:1 ratio vs outer)
                  <br />• Outer molding: 600 pcs/hr
                  <br />• Grommet molding: 800 pcs/hr
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Google Sheets Integration
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Auto-sync production data every 30 seconds
                  <br />• Historical performance tracking
                  <br />• Real-time dashboard updates
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProductionDemo;
