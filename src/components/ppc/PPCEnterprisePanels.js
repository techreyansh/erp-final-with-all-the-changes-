import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import EnterpriseToolbar from "../advanced/EnterpriseToolbar";
import { calculateProductionCostPerUnit } from "../../utils/calculations/erpCalculations";
import { exportToCsv } from "../../utils/calculations/exportCsv";

const PPCEnterprisePanels = ({ section, productionPlan, workOrders, dispatch, enterprise, derived, setRole, addEnterpriseRecord }) => {
  const [search, setSearch] = useState("");
  const [viewName, setViewName] = useState("");

  const saveView = () => {
    if (!viewName.trim()) return;
    addEnterpriseRecord("savedViews", { id: `VIEW-${Date.now()}`, module: "ppc", name: viewName, filters: { search } });
    setViewName("");
  };

  const bomRows = useMemo(() => enterprise.bom.filter((row) => row.productType.toLowerCase().includes(search.toLowerCase())), [enterprise.bom, search]);
  const productionTracking = enterprise.productionTracking;
  if (section === "bom") {
    return (
      <Stack spacing={2}>
        <EnterpriseToolbar search={search} setSearch={setSearch} role={enterprise.userRole} setRole={setRole} onExport={() => exportToCsv(bomRows, "ppc-bom")} viewName={viewName} setViewName={setViewName} onSaveView={saveView} />
        {bomRows.map((bom) => {
          const total = bom.materials.reduce((sum, item) => sum + item.quantityPerUnit * item.costPerUnit, 0);
          return (
            <Paper key={bom.id} sx={{ p: 2, boxShadow: 2 }}>
              <Typography variant="h6">{bom.productType}</Typography>
              <Table size="small">
                <TableHead><TableRow><TableCell>Material</TableCell><TableCell>Qty / Unit</TableCell><TableCell>Cost / Unit</TableCell></TableRow></TableHead>
                <TableBody>
                  {bom.materials.map((material) => (
                    <TableRow key={material.material}><TableCell>{material.material}</TableCell><TableCell>{material.quantityPerUnit}</TableCell><TableCell>{material.costPerUnit}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Total BOM Cost / Unit: INR {Math.round(total)}</Typography>
            </Paper>
          );
        })}
      </Stack>
    );
  }

  if (section === "mrp") {
    return (
      <Paper sx={{ p: 2, boxShadow: 2 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>Material Requirement Planning</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow><TableCell>Material</TableCell><TableCell>Required</TableCell><TableCell>Available</TableCell><TableCell>Shortage</TableCell><TableCell>Suggested Purchase</TableCell></TableRow></TableHead>
            <TableBody>
              {derived.mrp.map((row) => (
                <TableRow key={row.material}>
                  <TableCell>{row.material}</TableCell>
                  <TableCell>{Math.round(row.requiredQty)}</TableCell>
                  <TableCell>{row.availableQty}</TableCell>
                  <TableCell><Chip size="small" color={row.shortageQty > 0 ? "error" : "success"} label={Math.round(row.shortageQty)} /></TableCell>
                  <TableCell>{row.suggestedPurchaseQty}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  if (section === "capacity") {
    return (
      <Paper sx={{ p: 2, boxShadow: 2 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>Machine Capacity Planning</Typography>
        {derived.machineCapacity.map((machine) => (
          <Box key={machine.id} sx={{ mb: 1.5 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2">{machine.id} • {machine.type}</Typography>
              <Typography variant="body2">{machine.currentLoad}/{machine.capacityPerDay} ({machine.utilization}%)</Typography>
            </Stack>
            <LinearProgress value={Math.min(machine.utilization, 100)} variant="determinate" color={machine.overloaded ? "error" : "primary"} />
            {machine.overloaded && <Alert severity="error" sx={{ mt: 0.75 }}>Overbooking detected for {machine.id}</Alert>}
          </Box>
        ))}
      </Paper>
    );
  }

  if (section === "routing") {
    return (
      <Paper sx={{ p: 2, boxShadow: 2 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>Production Routing</Typography>
        {enterprise.routingSteps.map((step) => (
          <Stack key={step.id} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="body2">{step.workOrderId} • {step.step}</Typography>
            <Typography variant="body2">{step.status} • {step.actualHrs}/{step.plannedHrs} hrs</Typography>
          </Stack>
        ))}
      </Paper>
    );
  }

  if (section === "tracking") {
    return (
      <Grid container spacing={2}>
        {productionTracking.map((track) => (
          <Grid item xs={12} md={6} key={track.id}>
            <Paper sx={{ p: 2, boxShadow: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{track.planId}</Typography>
              <Typography variant="body2">Planned vs Actual: {track.actualOutput}/{track.plannedOutput}</Typography>
              <Typography variant="body2">Scrap: {track.scrapGenerated}</Typography>
              <Typography variant="body2">Downtime reason: {track.downtimeReason}</Typography>
              {track.delayFlag && <Alert severity="error" sx={{ mt: 1 }}>Delayed production flagged</Alert>}
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (section === "qc") {
    return (
      <Paper sx={{ p: 2, boxShadow: 2 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>Quality Control</Typography>
        <Table size="small">
          <TableHead><TableRow><TableCell>Work Order</TableCell><TableCell>Test</TableCell><TableCell>Result</TableCell><TableCell>Inspector</TableCell><TableCell>Remarks</TableCell></TableRow></TableHead>
          <TableBody>
            {enterprise.qualityChecks.map((qc) => (
              <TableRow key={qc.id}>
                <TableCell>{qc.workOrderId}</TableCell>
                <TableCell>{qc.testType}</TableCell>
                <TableCell><Chip size="small" color={qc.result === "Fail" ? "error" : "success"} label={qc.result} /></TableCell>
                <TableCell>{qc.inspector}</TableCell>
                <TableCell>{qc.remarks}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    );
  }

  if (section === "scrap") {
    return (
      <Paper sx={{ p: 2, boxShadow: 2 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>Scrap & Wastage Tracking</Typography>
        {enterprise.scrapTracking.map((item) => (
          <Alert key={item.id} severity={item.wastePercent > 2 ? "warning" : "info"} sx={{ mb: 1 }}>
            {item.category} • Waste {item.wastePercent}% • Cost impact INR {item.costImpact.toLocaleString("en-IN")}
          </Alert>
        ))}
      </Paper>
    );
  }

  if (section === "maintenance") {
    return (
      <Paper sx={{ p: 2, boxShadow: 2 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>Maintenance Scheduling</Typography>
        <Table size="small">
          <TableHead><TableRow><TableCell>Machine</TableCell><TableCell>Last Service</TableCell><TableCell>Next Due</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
          <TableBody>
            {enterprise.machines.map((machine) => (
              <TableRow key={machine.id}>
                <TableCell>{machine.id} ({machine.type})</TableCell>
                <TableCell>{machine.lastServiceDate}</TableCell>
                <TableCell>{machine.nextDueDate}</TableCell>
                <TableCell><Chip size="small" color={new Date(machine.nextDueDate) < new Date("2026-05-01") ? "error" : "success"} label={new Date(machine.nextDueDate) < new Date("2026-05-01") ? "Due Soon" : "Planned"} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    );
  }

  if (section === "costing") {
    return (
      <Paper sx={{ p: 2, boxShadow: 2 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>Production Costing</Typography>
        {enterprise.productionCosting.map((cost) => {
          const calc = calculateProductionCostPerUnit(cost);
          return (
            <Alert key={cost.id} severity="info" sx={{ mb: 1 }}>
              {cost.planId}: Raw {cost.rawMaterialCost} + Machine {cost.machineCost} + Labor {cost.laborCost} = Total {calc.totalCost}; Cost/Unit {calc.costPerUnit.toFixed(2)}
            </Alert>
          );
        })}
      </Paper>
    );
  }

  if (section === "dispatch-intelligence") {
    return (
      <Paper sx={{ p: 2, boxShadow: 2 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>Dispatch + Logistics Intelligence</Typography>
        {dispatch.map((item) => {
          const logistic = enterprise.dispatchLogistics.find((row) => row.id === item.id);
          const blockedByQc = derived.qcFailedWorkOrders.includes(workOrders.find((wo) => wo.linkedPlanId === item.orderId)?.id);
          return (
            <Box key={item.id} sx={{ mb: 1.5, p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.id} • {item.customerName}</Typography>
              <Typography variant="caption" color="text.secondary">Vehicle: {logistic?.vehicleType || "N/A"} | Route: {logistic?.route || "N/A"} | ETA: {logistic?.eta || "N/A"} | Packing: {logistic?.packingDetails || "N/A"}</Typography>
              {blockedByQc && <Alert severity="error" sx={{ mt: 1 }}>QC failed. Dispatch blocked until re-test pass.</Alert>}
            </Box>
          );
        })}
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, boxShadow: 2 }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>Integrated CRM + PPC Dashboard</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}><Alert severity="info">Orders in pipeline: {enterprise.salesOrders.length}</Alert></Grid>
        <Grid item xs={12} md={3}><Alert severity="warning">Production backlog: {productionPlan.filter((p) => p.status !== "Completed").length}</Alert></Grid>
        <Grid item xs={12} md={3}><Alert severity="success">Revenue vs Capacity: {Math.round((enterprise.salesOrders.length * 820000) / (derived.machineCapacity.reduce((a, b) => a + b.capacityPerDay, 0) || 1))}%</Alert></Grid>
        <Grid item xs={12} md={3}><Alert severity="info">Avg machine utilization: {Math.round(derived.machineCapacity.reduce((a, b) => a + b.utilization, 0) / Math.max(derived.machineCapacity.length, 1))}%</Alert></Grid>
      </Grid>
    </Paper>
  );
};

export default PPCEnterprisePanels;
