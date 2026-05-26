import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from "@mui/material";
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Factory as FactoryIcon,
} from "@mui/icons-material";
import * as db from "../../lib/db";

const ProductionSheetInitializer = ({ onInitialized }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});

  const requiredSheets = [
    {
      name: "Production Monitoring",
      description: "Real-time production data tracking",
      headers: [
        "Timestamp",
        "Assembly Lines Data", 
        "Molding Machines Data",
        "Packing Lines Data",
        "Production Flow Data",
        "Current Order Data"
      ]
    },
    {
      name: "Machine Status Log",
      description: "Historical machine status and performance",
      headers: [
        "Timestamp",
        "Machine ID",
        "Machine Type",
        "Status",
        "Current Speed",
        "Efficiency",
        "Operator",
        "Product Code",
        "Output"
      ]
    },
    {
      name: "Mold Compatibility Matrix",
      description: "Mold-machine compatibility and changeover tracking",
      headers: [
        "Mold ID",
        "Mold Name",
        "Mold Type",
        "Compatible Machines",
        "Product Types",
        "Status",
        "Location",
        "Last Used",
        "Changeover Time"
      ]
    },
    {
      name: "Production Orders",
      description: "Production order tracking and status",
      headers: [
        "Order Number",
        "Product Code",
        "Quantity",
        "Start Date",
        "End Date",
        "Status",
        "Cutting Output",
        "Assembly Output", 
        "Molding Output",
        "Packing Output",
        "Overall Efficiency"
      ]
    }
  ];

  const initializeSheets = async () => {
    setLoading(true);
    setActiveStep(0);
    const newResults = {};

    try {
      for (let i = 0; i < requiredSheets.length; i++) {
        const sheet = requiredSheets[i];
        setActiveStep(i);

        try {
          // Check if sheet exists
          const tableName = db.getTableName(sheet.name);
          const existing = await db.getTableRows(tableName);
          const exists = existing.length > 0;
          
          if (!exists) {
            const headerRow = (sheet.headers || []).length
              ? Object.fromEntries((sheet.headers || []).map((h) => [h, '']))
              : {};
            if (Object.keys(headerRow).length) await db.insertTableRow(tableName, headerRow);
            
            // Add sample data for Production Orders
            if (sheet.name === "Production Orders") {
              const sampleOrders = [
                [
                  "ORD-2024-001",
                  "PC-3P-16A-1.5", 
                  "10000",
                  new Date().toISOString().split('T')[0],
                  "",
                  "Running",
                  "9800",
                  "9400",
                  "8900",
                  "8500",
                  "97%"
                ],
                [
                  "ORD-2024-002",
                  "PC-2P-6A-1.25",
                  "5000", 
                  new Date().toISOString().split('T')[0],
                  "",
                  "Planning",
                  "0",
                  "0",
                  "0", 
                  "0",
                  "0%"
                ]
              ];
              await db.batchInsertTableRows(tableName, sampleOrders);
            }

            // Add sample data for Mold Compatibility Matrix
            if (sheet.name === "Mold Compatibility Matrix") {
              const sampleMolds = [
                [
                  "MOLD-3P-16A-INNER",
                  "3-Pin 16A Inner Mold",
                  "Inner",
                  "MOLD-M01,MOLD-M02,MOLD-M06",
                  "3-pin,16A",
                  "In Use",
                  "Machine M01, M02",
                  new Date().toISOString(),
                  "45 minutes"
                ],
                [
                  "MOLD-3P-16A-OUTER", 
                  "3-Pin 16A Outer Mold",
                  "Outer",
                  "MOLD-M03,MOLD-M04,MOLD-M06",
                  "3-pin,16A",
                  "In Use",
                  "Machine M03",
                  new Date().toISOString(),
                  "30 minutes"
                ],
                [
                  "MOLD-2P-6A-INNER",
                  "2-Pin 6A Inner Mold", 
                  "Inner",
                  "MOLD-M01,MOLD-M02,MOLD-M05,MOLD-M06",
                  "2-pin,6A",
                  "Available",
                  "Mold Storage A",
                  "",
                  "45 minutes"
                ]
              ];
              await db.batchInsertTableRows(tableName, sampleMolds);
            }
          }

          newResults[sheet.name] = { success: true, message: exists ? "Already exists" : "Created successfully" };
        } catch (error) {
          console.error(`Error initializing ${sheet.name}:`, error);
          newResults[sheet.name] = { success: false, message: error.message };
        }
      }

      setResults(newResults);
      setActiveStep(requiredSheets.length);
      
      // Check if all sheets were created successfully
      const allSuccess = Object.values(newResults).every(result => result.success);
      if (allSuccess && onInitialized) {
        setTimeout(() => {
          onInitialized();
        }, 2000);
      }

    } catch (error) {
      console.error("Error during sheet initialization:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <FactoryIcon sx={{ fontSize: 64, color: "#1976d2", mb: 2 }} />
            <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
              Production Management Setup
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Initialize Google Sheets for production monitoring and control
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              This will create {requiredSheets.length} new sheets in your Google Sheets document to support:
            </Typography>
            <List dense sx={{ mt: 1 }}>
              <ListItem>
                <ListItemText primary="• Real-time production monitoring and machine status tracking" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Mold-machine compatibility matrix and changeover management" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Production order tracking from cutting to packing" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Historical performance data and analytics" />
              </ListItem>
            </List>
          </Alert>

          {/* Required Sheets List */}
          <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
            Required Sheets:
          </Typography>
          <List>
            {requiredSheets.map((sheet, index) => (
              <ListItem key={sheet.name} sx={{ border: "1px solid #e0e0e0", borderRadius: 1, mb: 1 }}>
                <ListItemIcon>
                  {results[sheet.name] ? (
                    results[sheet.name].success ? (
                      <CheckIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )
                  ) : (
                    <FactoryIcon color="action" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={sheet.name}
                  secondary={sheet.description}
                />
                {results[sheet.name] && (
                  <Chip 
                    label={results[sheet.name].message} 
                    color={results[sheet.name].success ? "success" : "error"}
                    size="small"
                  />
                )}
              </ListItem>
            ))}
          </List>

          {/* Initialization Stepper */}
          {loading && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Initializing Sheets...
              </Typography>
              <Stepper activeStep={activeStep} orientation="vertical">
                {requiredSheets.map((sheet, index) => (
                  <Step key={sheet.name}>
                    <StepLabel>
                      {sheet.name}
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        {sheet.description}
                      </Typography>
                      {activeStep === index && (
                        <LinearProgress sx={{ mt: 1, width: 200 }} />
                      )}
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}

          {/* Results Summary */}
          {Object.keys(results).length > 0 && !loading && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Initialization Results:
              </Typography>
              {Object.values(results).every(result => result.success) ? (
                <Alert severity="success">
                  All sheets have been initialized successfully! 
                  The production management system is ready to use.
                </Alert>
              ) : (
                <Alert severity="warning">
                  Some sheets could not be initialized. Please check the errors above and try again.
                </Alert>
              )}
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Button
              variant="contained"
              onClick={initializeSheets}
              disabled={loading}
              size="large"
              sx={{ mr: 2 }}
            >
              {loading ? "Initializing..." : "Initialize Production Sheets"}
            </Button>
            
            {Object.keys(results).length > 0 && Object.values(results).every(result => result.success) && (
              <Button
                variant="outlined"
                onClick={() => onInitialized && onInitialized()}
                size="large"
              >
                Continue to Production Management
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProductionSheetInitializer;
