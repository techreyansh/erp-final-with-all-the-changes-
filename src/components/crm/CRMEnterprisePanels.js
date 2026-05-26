import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
  TextField,
  Typography
} from "@mui/material";
import { Add } from "@mui/icons-material";
import EnterpriseToolbar from "../advanced/EnterpriseToolbar";
import { calculateLeadScore, calculateQuotationPrice } from "../../utils/calculations/erpCalculations";
import { exportToCsv } from "../../utils/calculations/exportCsv";

const scoreColor = (category) => (category === "Hot" ? "error" : category === "Warm" ? "warning" : "info");

const CRMEnterprisePanels = ({
  section,
  leads,
  customers,
  productionPlan,
  enterprise,
  addEnterpriseRecord,
  updateEnterpriseRecords,
  setRole
}) => {
  const [search, setSearch] = useState("");
  const [viewName, setViewName] = useState("");
  const [selectedEntity, setSelectedEntity] = useState(leads[0]?.id || "");
  const [timelineType, setTimelineType] = useState("");
  const [timelineDate, setTimelineDate] = useState("");
  const [quoteForm, setQuoteForm] = useState({
    linkedEntity: leads[0]?.companyName || "",
    cableType: "Power Cable",
    coreCount: 3,
    length: 500,
    insulationType: "XLPE",
    voltageGrade: "11kV",
    discountPercent: 0,
    taxPercent: 18
  });

  const leadScored = useMemo(
    () =>
      leads.map((lead) => {
        const computed = calculateLeadScore(lead);
        return { ...lead, ...computed };
      }),
    [leads]
  );

  const filteredTimeline = useMemo(
    () =>
      enterprise.leadActivities.filter((item) => {
        if (selectedEntity && item.entityId !== selectedEntity) return false;
        if (timelineType && item.type !== timelineType) return false;
        if (timelineDate && !item.timestamp.startsWith(timelineDate)) return false;
        return true;
      }),
    [enterprise.leadActivities, selectedEntity, timelineDate, timelineType]
  );

  const quotationRows = useMemo(
    () => enterprise.quotations.filter((q) => JSON.stringify(q).toLowerCase().includes(search.toLowerCase())),
    [enterprise.quotations, search]
  );

  const saveView = () => {
    if (!viewName.trim()) return;
    addEnterpriseRecord("savedViews", {
      id: `VIEW-${Date.now()}`,
      module: "crm",
      name: viewName,
      filters: { search, timelineType, timelineDate }
    });
    setViewName("");
  };

  const createQuotation = () => {
    const pricing = calculateQuotationPrice(quoteForm);
    addEnterpriseRecord("quotations", {
      id: `QT-${Date.now()}`,
      ...quoteForm,
      ...pricing,
      status: "Draft"
    });
  };

  const convertToSalesOrder = (quote) => {
    addEnterpriseRecord("salesOrders", {
      id: `SO-${Date.now()}`,
      customer: quote.linkedEntity,
      productSpecs: `${quote.cableType}, ${quote.coreCount} Core, ${quote.voltageGrade}`,
      quantity: quote.length,
      deliveryDate: "2026-05-15",
      paymentTerms: "45 Days",
      linkedPpcPlanId: "",
      status: "Planned"
    });
    const autoPlan = {
      id: `PLN-${Date.now()}`,
      productType: quote.cableType,
      specification: `${quote.voltageGrade}, ${quote.coreCount} Core`,
      quantity: quote.length,
      startDate: "2026-05-01",
      endDate: "2026-05-14",
      status: "Planned",
      rawMaterialRequired: "Auto-generated from Sales Order",
      machineAllocation: "Pending",
      priority: "High"
    };
    addEnterpriseRecord("leadActivities", {
      id: `ACT-${Date.now()}`,
      entityId: selectedEntity || "GLOBAL",
      type: "Status",
      user: enterprise.userRole,
      action: `Quote ${quote.id} converted to Sales Order and Production Plan`,
      timestamp: new Date().toISOString()
    });
    return autoPlan;
  };

  if (section === "lead-scoring") {
    return (
      <Stack spacing={2}>
        <EnterpriseToolbar
          search={search}
          setSearch={setSearch}
          role={enterprise.userRole}
          setRole={setRole}
          onExport={() => exportToCsv(leadScored, "crm-lead-scoring")}
          viewName={viewName}
          setViewName={setViewName}
          onSaveView={saveView}
        />
        <Paper sx={{ p: 2, boxShadow: 2 }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>Lead Scoring Engine</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Lead</TableCell>
                  <TableCell>Budget</TableCell>
                  <TableCell>Requirement</TableCell>
                  <TableCell>Urgency</TableCell>
                  <TableCell>Engagement</TableCell>
                  <TableCell>Authority</TableCell>
                  <TableCell>Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leadScored.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>{lead.companyName}</TableCell>
                    <TableCell>{lead.budgetScore || 0}</TableCell>
                    <TableCell>{lead.requirementClarityScore || 0}</TableCell>
                    <TableCell>{lead.urgencyScore || 0}</TableCell>
                    <TableCell>{lead.engagementScore || 0}</TableCell>
                    <TableCell>{lead.decisionAuthorityScore || 0}</TableCell>
                    <TableCell><Chip label={`${lead.score} • ${lead.category}`} color={scoreColor(lead.category)} size="small" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Stack>
    );
  }

  if (section === "timeline") {
    return (
      <Stack spacing={2}>
        <EnterpriseToolbar
          search={search}
          setSearch={setSearch}
          role={enterprise.userRole}
          setRole={setRole}
          onExport={() => exportToCsv(filteredTimeline, "crm-activity-timeline")}
          viewName={viewName}
          setViewName={setViewName}
          onSaveView={saveView}
        />
        <Paper sx={{ p: 2, boxShadow: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} mb={2}>
            <TextField size="small" label="Entity ID" value={selectedEntity} onChange={(e) => setSelectedEntity(e.target.value)} />
            <TextField size="small" label="Type" value={timelineType} onChange={(e) => setTimelineType(e.target.value)} />
            <TextField size="small" type="date" label="Date" InputLabelProps={{ shrink: true }} value={timelineDate} onChange={(e) => setTimelineDate(e.target.value)} />
          </Stack>
          <Box sx={{ borderLeft: "2px solid", borderColor: "divider", pl: 2 }}>
            {filteredTimeline.map((event) => (
              <Box key={event.id} sx={{ mb: 2, position: "relative" }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "primary.main", position: "absolute", left: -27, top: 6 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{event.action}</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(event.timestamp).toLocaleString()} • {event.user} • {event.type}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Stack>
    );
  }

  if (section === "quotations") {
    const pricingPreview = calculateQuotationPrice(quoteForm);
    return (
      <Stack spacing={2}>
        <EnterpriseToolbar
          search={search}
          setSearch={setSearch}
          role={enterprise.userRole}
          setRole={setRole}
          onExport={() => exportToCsv(quotationRows, "crm-quotations")}
          viewName={viewName}
          setViewName={setViewName}
          onSaveView={saveView}
        />
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, boxShadow: 2 }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Product Configurator</Typography>
              <Stack spacing={1}>
                {[
                  ["linkedEntity", "Linked Lead/Customer"],
                  ["cableType", "Cable Type"],
                  ["coreCount", "Core Count"],
                  ["length", "Length"],
                  ["insulationType", "Insulation Type"],
                  ["voltageGrade", "Voltage Grade"],
                  ["discountPercent", "Discount %"],
                  ["taxPercent", "Tax %"]
                ].map(([key, label]) => (
                  <TextField
                    key={key}
                    size="small"
                    label={label}
                    value={quoteForm[key]}
                    onChange={(e) => setQuoteForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                ))}
                <Alert severity="info">
                  Base: {pricingPreview.basePrice} | Discount: {pricingPreview.discountAmount} | Tax: {pricingPreview.taxAmount} | Total: {pricingPreview.totalPrice}
                </Alert>
                <Button startIcon={<Add />} variant="contained" onClick={createQuotation}>Create Quotation</Button>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, boxShadow: 2 }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Quotation Management</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Quote ID</TableCell>
                      <TableCell>Linked Entity</TableCell>
                      <TableCell>Product Specs</TableCell>
                      <TableCell>Price Breakdown</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {quotationRows.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell>{quote.id}</TableCell>
                        <TableCell>{quote.linkedEntity}</TableCell>
                        <TableCell>{quote.cableType}, {quote.coreCount}C, {quote.length}m, {quote.insulationType}, {quote.voltageGrade}</TableCell>
                        <TableCell>Base {quote.basePrice} | Disc {quote.discountAmount} | Tax {quote.taxAmount} | Total {quote.totalPrice}</TableCell>
                        <TableCell><Chip size="small" label={quote.status} /></TableCell>
                        <TableCell><Button size="small" onClick={() => convertToSalesOrder(quote)}>Convert to SO</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    );
  }

  if (section === "sales-orders") {
    return (
      <Paper sx={{ p: 2, boxShadow: 2 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>Sales Order Conversion</Typography>
        <Alert severity="success" sx={{ mb: 1.5 }}>Quote conversion auto-creates PPC plans for manufacturing continuity.</Alert>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Product Specs</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Delivery Date</TableCell>
                <TableCell>Payment Terms</TableCell>
                <TableCell>Linked PPC Plan ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enterprise.salesOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.productSpecs}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>{order.deliveryDate}</TableCell>
                  <TableCell>{order.paymentTerms}</TableCell>
                  <TableCell>{order.linkedPpcPlanId || productionPlan[0]?.id || "Auto-link pending"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  if (section === "customer-360") {
    const selectedCustomer = customers[0];
    const paymentRows = enterprise.payments.filter((p) => p.customerId === selectedCustomer?.id);
    const issueRows = enterprise.openIssues.filter((issue) => issue.customerId === selectedCustomer?.id);
    const orderRows = enterprise.salesOrders.filter((order) => order.customer.includes(selectedCustomer?.companyName?.split(" ")[0] || ""));
    const usagePct = Math.round(((selectedCustomer?.outstandingAmount || 480000) / Math.max(selectedCustomer?.creditLimit || 1, 1)) * 100);
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, boxShadow: 2 }}>
            <Typography variant="h6">{selectedCustomer?.companyName} — 360 View</Typography>
            <Typography variant="body2" color="text.secondary">Credit usage vs limit</Typography>
            <LinearProgress variant="determinate" color={usagePct > 90 ? "error" : usagePct > 75 ? "warning" : "success"} value={Math.min(usagePct, 100)} sx={{ my: 1.5 }} />
            <Typography variant="caption">{selectedCustomer?.outstandingAmount || 480000} / {selectedCustomer?.creditLimit}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>Open issues: {issueRows.length}</Typography>
            <Typography variant="body2">Active orders: {orderRows.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, boxShadow: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Payment History</Typography>
            {paymentRows.map((row) => (
              <Typography key={row.id} variant="body2">{row.date} • {row.amount} • {row.status}</Typography>
            ))}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, mt: 2 }}>Communication Timeline</Typography>
            {enterprise.leadActivities.filter((a) => a.entityId === selectedCustomer?.id).map((a) => (
              <Typography key={a.id} variant="body2">{new Date(a.timestamp).toLocaleDateString()} • {a.action}</Typography>
            ))}
          </Paper>
        </Grid>
      </Grid>
    );
  }

  if (section === "documents") {
    return (
      <Paper sx={{ p: 2, boxShadow: 2 }}>
        <Stack direction="row" justifyContent="space-between" mb={1.5}>
          <Typography variant="h6">Document Management</Typography>
          <Button variant="contained">Mock Upload</Button>
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>File Name</TableCell>
                <TableCell>Upload Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enterprise.documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.fileName}</TableCell>
                  <TableCell>{doc.uploadDate}</TableCell>
                  <TableCell>{doc.type}</TableCell>
                  <TableCell><Button size="small">View</Button><Button size="small">Download</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, boxShadow: 2 }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>Sales Performance Dashboard</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}><Alert severity="info">Lead Conversion: {Math.round((enterprise.salesOrders.length / Math.max(leads.length, 1)) * 100)}%</Alert></Grid>
        <Grid item xs={12} md={3}><Alert severity="success">Revenue / Salesperson: INR {Math.round(enterprise.salesOrders.length * 820000 / 3).toLocaleString("en-IN")}</Alert></Grid>
        <Grid item xs={12} md={3}><Alert severity="warning">Avg Deal Cycle: 17 days</Alert></Grid>
        <Grid item xs={12} md={3}><Alert severity="error">Top lost reason: Price mismatch</Alert></Grid>
      </Grid>
    </Paper>
  );
};

export default CRMEnterprisePanels;
