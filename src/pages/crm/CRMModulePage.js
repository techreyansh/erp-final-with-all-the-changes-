import React, { useEffect, useMemo, useState } from "react";
import { Box, Container } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import ModuleTablePage from "../../components/common/ModuleTablePage";
import DealsKanban from "../../components/crm/DealsKanban";
import CRMEnterprisePanels from "../../components/crm/CRMEnterprisePanels";
import { crmMock, crmPpcLookups } from "../../data/mock/crmPpcData";
import { calculateLeadScore } from "../../utils/calculations/erpCalculations";
import { useEnterpriseERPStore } from "../../hooks/useEnterpriseERPStore";
import crmPpcBackendService from "../../services/crmPpcBackendService";
import useCrmPpcRealtime from "../../hooks/useCrmPpcRealtime";

const CRMModulePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const section = location.pathname.split("/")[2] || "leads";
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState(crmMock.leads);
  const [customers, setCustomers] = useState(crmMock.customers);
  const [followUps, setFollowUps] = useState(crmMock.followUps);
  const [deals] = useState(crmMock.deals);
  const enterpriseStore = useEnterpriseERPStore({ customers });

  useEffect(() => {
    const handle = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(handle);
  }, [section]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [leadRows, customerRows] = await Promise.all([
        crmPpcBackendService.getLeads(),
        crmPpcBackendService.getCustomers()
      ]);
      if (!mounted) return;
      setLeads(leadRows);
      setCustomers((prev) => {
        if (prev.length && customerRows.length === 0) return prev;
        return customerRows;
      });
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useCrmPpcRealtime({
    onLeadChange: async () => {
      const rows = await crmPpcBackendService.getLeads();
      setLeads(rows);
    }
  });

  const statusColor = (status) => {
    if (["Won", "Completed", "Qualified", "On Time"].includes(status)) return "success";
    if (["Lost", "Overdue"].includes(status)) return "error";
    if (["Contacted", "Scheduled"].includes(status)) return "warning";
    return "default";
  };

  const scoredLeads = useMemo(() => leads.map((lead) => ({ ...lead, ...calculateLeadScore(lead) })), [leads]);
  const customersWithCredit = useMemo(
    () =>
      enterpriseStore.derived.customerCredit.map((customer) => ({
        ...customer,
        creditStatus: customer.risk.label
      })),
    [enterpriseStore.derived.customerCredit]
  );

  const config = useMemo(() => ({
    leads: {
      title: "Leads",
      breadcrumbItems: ["CRM", "Leads"],
      columns: [
        { key: "id", label: "Lead ID", hideBelow: "md" },
        { key: "companyName", label: "Company Name" },
        { key: "contactPerson", label: "Contact Person", hideBelow: "md" },
        { key: "phone", label: "Phone", hideBelow: "md" },
        { key: "email", label: "Email", hideBelow: "md" },
        { key: "source", label: "Source", hideBelow: "md" },
        { key: "productInterest", label: "Product Interest", hideBelow: "md" },
        { key: "status", label: "Status", type: "status", getColor: statusColor },
        { key: "score", label: "Lead Score", hideBelow: "md" },
        { key: "category", label: "Category", type: "status", getColor: (v) => (v === "Hot" ? "error" : v === "Warm" ? "warning" : "info"), hideBelow: "md" },
        { key: "assignedSalesperson", label: "Assigned Salesperson", hideBelow: "md" },
        { key: "createdDate", label: "Created Date", hideBelow: "md" }
      ],
      formFields: [
        { key: "companyName", label: "Company Name", type: "text", required: true },
        { key: "contactPerson", label: "Contact Person", type: "text", required: true },
        { key: "phone", label: "Phone", type: "number", required: true },
        { key: "email", label: "Email", type: "email", required: true },
        { key: "address", label: "Address", type: "textarea" },
        { key: "source", label: "Lead Source", type: "select", options: crmPpcLookups.leadSources, required: true },
        { key: "productInterest", label: "Product Interest", type: "multiselect", options: crmPpcLookups.cableTypes, required: true },
        { key: "requirementDetails", label: "Requirement Details", type: "textarea" },
        { key: "expectedQuantity", label: "Expected Quantity", type: "number" },
        { key: "priority", label: "Priority", type: "select", options: crmPpcLookups.priorities, required: true },
        { key: "assignTo", label: "Assign To", type: "text", required: true },
        { key: "notes", label: "Notes", type: "textarea" },
        { key: "status", label: "Status", type: "select", options: crmPpcLookups.leadStatuses, required: true },
        { key: "budgetScore", label: "Budget (0-20)", type: "number", required: true },
        { key: "requirementClarityScore", label: "Requirement Clarity (0-20)", type: "number", required: true },
        { key: "urgencyScore", label: "Urgency (0-20)", type: "number", required: true },
        { key: "engagementScore", label: "Engagement (0-20)", type: "number", required: true },
        { key: "decisionAuthorityScore", label: "Decision Authority (0-20)", type: "number", required: true },
        { key: "assignedSalesperson", label: "Assigned Salesperson", type: "text", required: true },
        { key: "createdDate", label: "Created Date", type: "date", required: true }
      ],
      data: scoredLeads,
      setData: setLeads,
      idPrefix: "LD",
      onSaveRow: crmPpcBackendService.upsertLead,
      onDeleteRow: (row) => crmPpcBackendService.deleteLead(row.id)
    },
    customers: {
      title: "Customers",
      breadcrumbItems: ["CRM", "Customers"],
      columns: [
        { key: "id", label: "Customer ID", hideBelow: "md" },
        { key: "companyName", label: "Company Name" },
        { key: "gstNumber", label: "GST Number", hideBelow: "md" },
        { key: "contactPerson", label: "Contact Person", hideBelow: "md" },
        { key: "phone", label: "Phone", hideBelow: "md" },
        { key: "email", label: "Email", hideBelow: "md" },
        { key: "activeOrders", label: "Active Orders", hideBelow: "md" },
        { key: "paymentStatus", label: "Payment Status", type: "status", getColor: statusColor },
        { key: "customerType", label: "Customer Type", hideBelow: "md" },
        { key: "creditLimit", label: "Credit Limit", hideBelow: "md" },
        { key: "outstandingAmount", label: "Outstanding Amount", hideBelow: "md" },
        { key: "overdueDays", label: "Overdue Days", hideBelow: "md" },
        { key: "creditStatus", label: "Credit Status", type: "status", getColor: statusColor }
      ],
      formFields: [
        { key: "companyName", label: "Company Name", type: "text", required: true },
        { key: "gstNumber", label: "GST Number", type: "text", required: true },
        { key: "billingAddress", label: "Billing Address", type: "textarea", required: true },
        { key: "shippingAddress", label: "Shipping Address", type: "textarea", required: true },
        { key: "contactDetails", label: "Contact Details", type: "text", required: true },
        { key: "creditLimit", label: "Credit Limit", type: "number" },
        { key: "outstandingAmount", label: "Outstanding Amount", type: "number" },
        { key: "overdueDays", label: "Overdue Days", type: "number" },
        { key: "paymentTerms", label: "Payment Terms", type: "text" },
        { key: "tags", label: "Tags", type: "text" },
        { key: "contactPerson", label: "Contact Person", type: "text", required: true },
        { key: "phone", label: "Phone", type: "number", required: true },
        { key: "email", label: "Email", type: "email", required: true },
        { key: "activeOrders", label: "Active Orders", type: "number" },
        { key: "paymentStatus", label: "Payment Status", type: "select", options: ["On Time", "Overdue"], required: true },
        { key: "customerType", label: "Customer Type", type: "select", options: crmPpcLookups.customerTypes, required: true }
      ],
      data: customersWithCredit,
      setData: setCustomers,
      idPrefix: "CUS",
      onSaveRow: crmPpcBackendService.upsertCustomer
    },
    "follow-ups": {
      title: "Follow-ups",
      breadcrumbItems: ["CRM", "Follow-ups"],
      columns: [
        { key: "id", label: "Follow-up ID", hideBelow: "md" },
        { key: "leadCustomerName", label: "Lead/Customer Name" },
        { key: "date", label: "Date", hideBelow: "md" },
        { key: "type", label: "Type", hideBelow: "md" },
        { key: "notes", label: "Notes", hideBelow: "md" },
        { key: "nextFollowUpDate", label: "Next Follow-up Date", hideBelow: "md" },
        { key: "status", label: "Status", type: "status", getColor: statusColor }
      ],
      formFields: [
        { key: "leadCustomerName", label: "Select Lead/Customer", type: "text", required: true },
        { key: "type", label: "Follow-up Type", type: "select", options: crmPpcLookups.followupTypes, required: true },
        { key: "notes", label: "Notes", type: "textarea", required: true },
        { key: "outcome", label: "Outcome", type: "textarea" },
        { key: "nextFollowUpDate", label: "Next Follow-up Date", type: "date", required: true },
        { key: "date", label: "Date", type: "date", required: true },
        { key: "status", label: "Status", type: "select", options: ["Scheduled", "Completed"], required: true }
      ],
      data: followUps,
      setData: setFollowUps,
      idPrefix: "FU"
    }
  }), [customersWithCredit, followUps, scoredLeads]);

  if (section === "deals") {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 1 }}>
          <DealsKanban deals={deals} />
        </Box>
      </Container>
    );
  }

  const enterpriseSections = ["lead-scoring", "timeline", "quotations", "sales-orders", "customer-360", "documents", "performance"];
  if (enterpriseSections.includes(section)) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 1 }}>
          <CRMEnterprisePanels
            section={section}
            leads={scoredLeads}
            customers={customersWithCredit}
            productionPlan={[]}
            enterprise={enterpriseStore.state}
            addEnterpriseRecord={enterpriseStore.appendRecord}
            updateEnterpriseRecords={enterpriseStore.updateRecords}
            setRole={enterpriseStore.setRole}
          />
        </Box>
      </Container>
    );
  }

  const selectedConfig = config[section];
  if (!selectedConfig) {
    navigate("/crm/leads");
    return null;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 1 }}>
        <ModuleTablePage
          {...selectedConfig}
          loading={loading}
          onSaveRow={selectedConfig.onSaveRow}
          onDeleteRow={selectedConfig.onDeleteRow}
        />
      </Box>
    </Container>
  );
};

export default CRMModulePage;
