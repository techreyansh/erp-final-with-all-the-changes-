import React, { useEffect, useMemo, useState } from "react";
import { Box, Container } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import ModuleTablePage from "../../components/common/ModuleTablePage";
import ReportsDashboard from "../../components/ppc/ReportsDashboard";
import PPCEnterprisePanels from "../../components/ppc/PPCEnterprisePanels";
import { crmMock, crmPpcLookups, ppcMock } from "../../data/mock/crmPpcData";
import { useEnterpriseERPStore } from "../../hooks/useEnterpriseERPStore";
import crmPpcBackendService from "../../services/crmPpcBackendService";
import useCrmPpcRealtime from "../../hooks/useCrmPpcRealtime";

const PPCModulePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const section = location.pathname.split("/")[2] || "production-plan";
  const [loading, setLoading] = useState(true);
  const [productionPlan, setProductionPlan] = useState(ppcMock.productionPlan);
  const [workOrders, setWorkOrders] = useState(ppcMock.workOrders);
  const [inventory] = useState(ppcMock.inventory);
  const [dispatch, setDispatch] = useState(ppcMock.dispatch);
  const enterpriseStore = useEnterpriseERPStore({ productionPlan, inventory, customers: crmMock.customers });
  const { salesOrders } = enterpriseStore.state;
  const { updateRecords } = enterpriseStore;

  useEffect(() => {
    const handle = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(handle);
  }, [section]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [planRows, workOrderRows] = await Promise.all([
        crmPpcBackendService.getProductionPlans(),
        crmPpcBackendService.getWorkOrders()
      ]);
      if (!mounted) return;
      if (planRows?.length) setProductionPlan(planRows);
      if (workOrderRows?.length) setWorkOrders(workOrderRows);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useCrmPpcRealtime({
    onPlanChange: async () => {
      const rows = await crmPpcBackendService.getProductionPlans();
      if (rows?.length) setProductionPlan(rows);
    },
    onWorkOrderChange: async () => {
      const rows = await crmPpcBackendService.getWorkOrders();
      if (rows?.length) setWorkOrders(rows);
    }
  });

  useEffect(() => {
    // Cross-module link: sales order conversion can auto-create production plans.
    const missingPlans = salesOrders.filter((order) => !order.linkedPpcPlanId);
    if (missingPlans.length === 0) return;
    setProductionPlan((prev) => {
      const next = [...prev];
      missingPlans.forEach((order) => {
        const existing = next.find((plan) => plan.id === order.linkedPpcPlanId || plan.specification.includes(order.productSpecs.split(",")[0]));
        if (!existing) {
          const generatedId = `PLN-SO-${order.id.split("-")[1]}`;
          next.unshift({
            id: generatedId,
            productType: order.productSpecs.split(",")[0],
            specification: order.productSpecs,
            quantity: order.quantity,
            startDate: "2026-05-01",
            endDate: order.deliveryDate,
            status: "Planned",
            rawMaterialRequired: "Derived from sales order",
            machineAllocation: "Auto-assignment pending",
            priority: "High"
          });
          updateRecords("salesOrders", (rows) =>
            rows.map((row) => (row.id === order.id ? { ...row, linkedPpcPlanId: generatedId } : row))
          );
        }
      });
      return next;
    });
  }, [salesOrders, updateRecords]);

  const statusColor = (status) => {
    if (["Completed", "Ready", "OK", "Running"].includes(status)) return "success";
    if (["Critical"].includes(status)) return "error";
    if (["Low", "Planned", "Pending", "In Progress"].includes(status)) return "warning";
    return "default";
  };

  const leadConversionRate = useMemo(() => {
    const totalLeads = crmMock.leads.length;
    const wonDeals = crmMock.deals.filter((deal) => deal.stage === "Won").length;
    return totalLeads ? Math.round((wonDeals / totalLeads) * 100) : 0;
  }, []);

  const config = useMemo(() => ({
    "production-plan": {
      title: "Production Plan",
      breadcrumbItems: ["PPC", "Production Plan"],
      columns: [
        { key: "id", label: "Plan ID", hideBelow: "md" },
        { key: "productType", label: "Product Type" },
        { key: "specification", label: "Specification", hideBelow: "md" },
        { key: "quantity", label: "Quantity", hideBelow: "md" },
        { key: "startDate", label: "Start Date", hideBelow: "md" },
        { key: "endDate", label: "End Date", hideBelow: "md" },
        { key: "status", label: "Status", type: "status", getColor: statusColor }
      ],
      formFields: [
        { key: "productType", label: "Product Type", type: "select", options: crmPpcLookups.cableTypes, required: true },
        { key: "specification", label: "Cable Specification", type: "text", required: true },
        { key: "quantity", label: "Quantity", type: "number", required: true },
        { key: "rawMaterialRequired", label: "Raw Material Required", type: "textarea", required: true },
        { key: "machineAllocation", label: "Machine Allocation", type: "text", required: true },
        { key: "startDate", label: "Start Date", type: "date", required: true },
        { key: "endDate", label: "End Date", type: "date", required: true },
        { key: "priority", label: "Priority", type: "select", options: crmPpcLookups.priorities, required: true },
        { key: "status", label: "Status", type: "select", options: crmPpcLookups.planStatuses, required: true }
      ],
      data: productionPlan,
      setData: setProductionPlan,
      idPrefix: "PLN",
      onSaveRow: crmPpcBackendService.upsertProductionPlan
    },
    "work-orders": {
      title: "Work Orders",
      breadcrumbItems: ["PPC", "Work Orders"],
      columns: [
        { key: "id", label: "Work Order ID", hideBelow: "md" },
        { key: "linkedPlanId", label: "Linked Plan ID", hideBelow: "md" },
        { key: "machine", label: "Machine" },
        { key: "operator", label: "Operator", hideBelow: "md" },
        { key: "shift", label: "Shift", hideBelow: "md" },
        { key: "status", label: "Status", type: "status", getColor: statusColor },
        { key: "outputProduced", label: "Output Produced", hideBelow: "md" },
        { key: "defects", label: "Defects", hideBelow: "md" }
      ],
      formFields: [
        { key: "linkedPlanId", label: "Select Production Plan", type: "select", options: productionPlan.map((plan) => plan.id), required: true },
        { key: "machine", label: "Assign Machine", type: "text", required: true },
        { key: "operator", label: "Assign Operator", type: "text", required: true },
        { key: "shift", label: "Shift Timing", type: "text", required: true },
        { key: "notes", label: "Notes", type: "textarea" },
        { key: "status", label: "Status", type: "select", options: ["Pending", "Running", "Completed"], required: true },
        { key: "outputProduced", label: "Output Produced", type: "number" },
        { key: "defects", label: "Defects", type: "number" }
      ],
      data: workOrders,
      setData: setWorkOrders,
      idPrefix: "WO"
    },
    inventory: {
      title: "Inventory",
      breadcrumbItems: ["PPC", "Inventory"],
      columns: [
        { key: "id", label: "Material ID", hideBelow: "md" },
        { key: "materialName", label: "Material Name" },
        { key: "availableQuantity", label: "Available Quantity", hideBelow: "md" },
        { key: "unit", label: "Unit", hideBelow: "md" },
        { key: "reorderLevel", label: "Reorder Level", hideBelow: "md" },
        { key: "status", label: "Status", type: "status", getColor: statusColor }
      ],
      formFields: [],
      data: inventory,
      setData: () => null,
      idPrefix: "MAT",
      readOnly: true
    },
    dispatch: {
      title: "Dispatch",
      breadcrumbItems: ["PPC", "Dispatch"],
      columns: [
        { key: "id", label: "Dispatch ID", hideBelow: "md" },
        { key: "orderId", label: "Order ID", hideBelow: "md" },
        { key: "customerName", label: "Customer Name" },
        { key: "product", label: "Product" },
        { key: "quantity", label: "Quantity", hideBelow: "md" },
        { key: "dispatchDate", label: "Dispatch Date", hideBelow: "md" },
        { key: "transportDetails", label: "Transport Details", hideBelow: "md" },
        { key: "status", label: "Status", type: "status", getColor: statusColor }
      ],
      formFields: [
        { key: "orderId", label: "Order ID", type: "text", required: true },
        { key: "customerName", label: "Customer Name", type: "text", required: true },
        { key: "product", label: "Product", type: "text", required: true },
        { key: "quantity", label: "Quantity", type: "number", required: true },
        { key: "dispatchDate", label: "Dispatch Date", type: "date", required: true },
        { key: "transportDetails", label: "Transport Details", type: "textarea", required: true },
        { key: "status", label: "Status", type: "select", options: ["Planned", "Ready", "Dispatched"], required: true }
      ],
      data: dispatch,
      setData: setDispatch,
      idPrefix: "DSP"
    }
  }), [dispatch, inventory, productionPlan, workOrders]);

  if (section === "reports") {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 1 }}>
          <ReportsDashboard reportMetrics={ppcMock.reportMetrics} leadConversionRate={leadConversionRate} />
        </Box>
      </Container>
    );
  }

  const enterpriseSections = [
    "bom",
    "mrp",
    "capacity",
    "routing",
    "tracking",
    "qc",
    "scrap",
    "maintenance",
    "dispatch-intelligence",
    "costing",
    "advanced-dashboard"
  ];
  if (enterpriseSections.includes(section)) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 1 }}>
          <PPCEnterprisePanels
            section={section}
            productionPlan={productionPlan}
            workOrders={workOrders}
            dispatch={dispatch}
            enterprise={enterpriseStore.state}
            derived={enterpriseStore.derived}
            setRole={enterpriseStore.setRole}
            addEnterpriseRecord={enterpriseStore.appendRecord}
          />
        </Box>
      </Container>
    );
  }

  const selectedConfig = config[section];
  if (!selectedConfig) {
    navigate("/ppc/production-plan");
    return null;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 1 }}>
        <ModuleTablePage
          {...selectedConfig}
          loading={loading}
          readOnly={selectedConfig.readOnly}
          onSaveRow={selectedConfig.onSaveRow}
          onDeleteRow={selectedConfig.onDeleteRow}
        />
      </Box>
    </Container>
  );
};

export default PPCModulePage;
