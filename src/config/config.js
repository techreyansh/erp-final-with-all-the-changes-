const config = {
  // Forced false: `db.getTableRows` and related helpers always call Supabase (never skip API).
  // `REACT_APP_USE_LOCAL_STORAGE` is not applied here — do not re-enable via env without fixing db.js.
  useLocalStorage: false,

  // Table names: logical keys mapped to Supabase table names via db.getTableName()
  sheets: {
    poMaster: "PO_Master",
    soMaster: "SO_Master",
    bomTemplates: "BOM_Templates",
    inventory: "Inventory",
    users: "Users",
    auditLog: "Audit_Log",
    metrics: "Metrics",
    purchaseFlow: "Purchase_Flow",
    purchaseFlowSteps: "PurchaseFlowSteps",
    purchaseFlowDocuments: "PurchaseFlowDocuments",
    purchaseFlowVendors: "PurchaseFlowVendors",
    vendor: "Vendor",
    purchaseFlowApprovals: "PurchaseFlowApprovals",
    purchaseFlowPayments: "PurchaseFlowPayments",
    placePO: "PlacePO",
    materialApproval: "MaterialApproval",
    followUpQuotations: "FollowUpQuotations",
    inspectMaterial: "InspectMaterial",
    inspectSample: "InspectSample",
    generateGrn: "GenerateGRN",
    schedulePayment: "SchedulePayment",
    releasePayment: "ReleasePayment",
    sortVendor: "SortVendor",
    followUpDelivery: "FollowUpDelivery",
    inspectMaterial: "InspectMaterial",
    returnMaterial: "ReturnMaterial",
    clients: "CLIENT", // primary client sheet name
    prospectsClients: "PROSPECTS_CLIENTS", // prospects clients sheet name
    
    // Client Dashboard sheets
    clientOrders: "Client_Orders",
    clientPayments: "Client_Payments",
    clientQuotations: "Client_Quotations",
    clientNotifications: "Client_Notifications",
    clientMessages: "Client_Messages",
    pettyCash: "Petty_Cash",
    scotSheet: "SCOT_Sheet",
    enquiries: "Enquiries",
    enquiriesExport: "Enquiries_Export",
    enquiriesIndiaMart: "Enquiries_IndiaMart",
    
    // Future flows
    dieRepair: "Die_Repair",
    hrInduction: "HR_Induction",
    hrResignation: "HR_Resignation",
    checklists: "Checklists",
    delegation: "Delegation",
    misScores: "MIS_Scores",
    delegationScores: "Delegation_Scores",
    employeeDashboards: "Employee_Dashboards",
    costingBreakup: "Costing_Breakup",
    quotationFormats: "Quotation_Formats",
    // Sales Flow sheets
    salesFlow: "SalesFlow",
    salesFlowSteps: "SalesFlowSteps",
    logAndQualifyLeads: "LogAndQualifyLeads",
    initialCall: "InitialCall",
    evaluateHighValueProspects: "EvaluateHighValueProspects",
    checkFeasibility: "CheckFeasibility",
    confirmStandardAndCompliance: "ConfirmStandardAndCompliance",
    sendQuotation: "SendQuotation", // Added for saving quotations
    approvePaymentTerms: "ApprovePaymentTerms", // Added for payment terms approval
    sampleSubmission: "SampleSubmission", // Added for sample submission
    getApprovalForSample: "GetApprovalForSample", // Added for sample approval
    approveStrategicDeals: "ApproveStrategicDeals", // Added for strategic deals approval
    
    // CRM sheets
    crmOpportunities: "CRM_Opportunities",
    crmActivities: "CRM_Activities",
    crmInteractions: "CRM_Interactions",
    crmTasks: "CRM_Tasks",
    crmNotes: "CRM_Notes",
    crmOrderTaking: "CRM_OrderTaking",
    crmCallLogs: "CRM_CallLogs",
    crmPayments: "CRM_Payments",
    
    // Payment Reminder sheets
    crmInvoices: "CRM_Invoices",
    crmReminderTemplates: "CRM_ReminderTemplates",
    crmCommunications: "CRM_Communications",
    crmCallTasks: "CRM_CallTasks",
    crmTaskLogs: "CRM_TaskLogs",
    
    // Cable Production Sheets
    cableProducts: "Cable Products",
    cableProductionPlans: "Cable Production Plans",
    machineSchedules: "Machine Schedules",
    materialRequisitions: "Material Requisitions",
    productionOrders: "Production Orders",
    
    // Employee Management Sheets
    employees: "Employees",
    performance: "Performance",
    attendance: "Attendance",
    employeeTasks: "EmployeeTasks",
    notifications: "Notifications",
    
    // Existing sheets that will be used by cable production
    stock: "Stock",
    finishedGoods: "Finished Goods",
    billOfMaterials: "Bill of Materials",
    fgMaterialInward: "FG Material Inward",
    fgStock: "FG Stock",
    materialIssue: "Material Issue",
    dispatches: "Dispatches",
  },

  // Status codes for flow management
  statusCodes: {
    NEW: "NEW",
    STORE1: "STORE1",
    CABLE_PRODUCTION: "CABLE_PRODUCTION",
    STORE2: "STORE2",
    MOULDING: "MOULDING",
    FG_SECTION: "FG_SECTION",
    DISPATCH: "DISPATCH",
    DELIVERED: "DELIVERED",
  },

  // Purchase Flow Configuration
  purchaseFlow: {
    steps: {
      INDENT_RAISED: "INDENT_RAISED",
      INDENT_APPROVED: "INDENT_APPROVED",
      RFQ_FLOATED: "RFQ_FLOATED",
      QUOTATIONS_RECEIVED: "QUOTATIONS_RECEIVED",
      COMPARATIVE_PREPARED: "COMPARATIVE_PREPARED",
      QUOTATION_APPROVED: "QUOTATION_APPROVED",
      SAMPLE_REQUESTED: "SAMPLE_REQUESTED",
      SAMPLE_INSPECTED: "SAMPLE_INSPECTED",
      PO_PLACED: "PO_PLACED",
      DELIVERY_FOLLOWUP: 0, // As per PO
      MATERIAL_RECEIVED: 24,
      QC_INSPECTION: 24,
      MATERIAL_APPROVED: 24,
      MATERIAL_REJECTED: 24,
      REJECTION_DECISION: 24,
      MATERIAL_RETURNED: 24,
      MATERIAL_RESENT: 120,
      GRN_GENERATED: 24,
      INVOICE_SUBMITTED: 24,
      PAYMENT_SCHEDULED: 0, // As per credit
      PAYMENT_RELEASED: 0 // On/before due
    },

    // TAT (Turn Around Time) in hours for each step
    tatHours: {
      INDENT_RAISED: 24,
      INDENT_APPROVED: 24,
      RFQ_FLOATED: 24,
      QUOTATIONS_RECEIVED: 48,
      COMPARATIVE_PREPARED: 24,
      QUOTATION_APPROVED: 24,
      SAMPLE_REQUESTED: 72,
      SAMPLE_INSPECTED: 24,
      PO_PLACED: 24,
      DELIVERY_FOLLOWUP: 0, // As per PO
      MATERIAL_RECEIVED: 24,
      QC_INSPECTION: 24,
      MATERIAL_APPROVED: 24,
      MATERIAL_REJECTED: 24,
      REJECTION_DECISION: 24,
      MATERIAL_RETURNED: 24,
      MATERIAL_RESENT: 120,
      GRN_GENERATED: 24,
      INVOICE_SUBMITTED: 24,
      PAYMENT_SCHEDULED: 0, // As per credit
      PAYMENT_RELEASED: 0 // On/before due
    },

    // Role-based access control
    roles: {
      STORE_HEAD: "STORE_HEAD",
      PROCESS_COORDINATOR: "PROCESS_COORDINATOR",
      PURCHASE_EXECUTIVE: "PURCHASE_EXECUTIVE",
      MANAGEMENT: "MANAGEMENT",
      QC_TEAM: "QC_TEAM",
      STORE_EXECUTIVE: "STORE_EXECUTIVE",
      ACCOUNTS_EXECUTIVE: "ACCOUNTS_EXECUTIVE",
    },

    // Document types
    documentTypes: {
      INDENT_FORM: "INDENT_FORM",
      INTERNAL_APPROVAL: "INTERNAL_APPROVAL",
      RFQ_TEMPLATE: "RFQ_TEMPLATE",
      QUOTATION_LOG: "QUOTATION_LOG",
      COMPARATIVE_SHEET: "COMPARATIVE_SHEET",
      QUOTATION_SHEET: "QUOTATION_SHEET",
      SAMPLE_TRACKER: "SAMPLE_TRACKER",
      QC_REPORT: "QC_REPORT",
      PO_FORMAT: "PO_FORMAT",
      DELIVERY_TRACKER: "DELIVERY_TRACKER",
      INVOICE: "INVOICE",
      DELIVERY_CHALLAN: "DELIVERY_CHALLAN",
      REJECTION_REPORT: "REJECTION_REPORT",
      RETURN_DC: "RETURN_DC",
      REPLACEMENT_CHALLAN: "REPLACEMENT_CHALLAN",
      GRN: "GRN",
      PAYMENT_LOG: "PAYMENT_LOG",
      PAYMENT_RELEASE_SHEET: "PAYMENT_RELEASE_SHEET"
    }
  },

  // Sales Flow Configuration
  salesFlow: {
    steps: {
      LOG_AND_QUALIFY_LEADS: "LOG_AND_QUALIFY_LEADS",
      INITIAL_CALL: "INITIAL_CALL",
      EVALUATE_PROSPECTS: "EVALUATE_PROSPECTS",
      CHECK_FEASIBILITY: "CHECK_FEASIBILITY",
      CONFIRM_STANDARDS: "CONFIRM_STANDARDS",
      SEND_QUOTATION: "SEND_QUOTATION",
      APPROVE_PAYMENT_TERMS: "APPROVE_PAYMENT_TERMS",
      APPROVE_STRATEGIC_DEALS: "APPROVE_STRATEGIC_DEALS",
      ORDER_BOOKING: "ORDER_BOOKING",
      PLAN_MANUFACTURING: "PLAN_MANUFACTURING",
      PACK_DISPATCH: "PACK_DISPATCH",
      GENERATE_INVOICE: "GENERATE_INVOICE",
      UPDATE_CLIENT: "UPDATE_CLIENT",
      FOLLOW_UP_FEEDBACK: "FOLLOW_UP_FEEDBACK",
      FOLLOW_UP_PAYMENT: "FOLLOW_UP_PAYMENT"
    },

    // TAT (Turn Around Time) in days for each step
    tatDays: {
      LOG_AND_QUALIFY_LEADS: 1,
      INITIAL_CALL: 1,
      EVALUATE_PROSPECTS: 1,
      CHECK_FEASIBILITY: 2,
      CONFIRM_STANDARDS: 1,
      SEND_QUOTATION: 1,
      APPROVE_PAYMENT_TERMS: 1,
      APPROVE_STRATEGIC_DEALS: 1,
      ORDER_BOOKING: 1,
      PLAN_MANUFACTURING: 3,
      PACK_DISPATCH: 1,
      GENERATE_INVOICE: 1,
      UPDATE_CLIENT: 1,
      FOLLOW_UP_FEEDBACK: 7,
      FOLLOW_UP_PAYMENT: 7
    },

    // Role-based access control
    roles: {
      CRM_EXECUTIVE: "Customer Relations Manager",
      SALES_EXECUTIVE: "Sales Executive",
      NPD: "NPD",
      QUALITY_ENGINEER: "Quality Engineer",
      DIRECTOR: "Director",
      PRODUCTION_MANAGER: "Production Manager",
      STORE_MANAGER: "Store Manager",
      ACCOUNTS_EXECUTIVE: "Accounts Executive",
    },

    // Document types
    documentTypes: {
      LEAD_FORM: "LEAD_FORM",
      QUOTATION: "QUOTATION",
      ORDER_FORM: "ORDER_FORM",
      INVOICE: "INVOICE",
      DELIVERY_CHALLAN: "DELIVERY_CHALLAN",
      PAYMENT_RECEIPT: "PAYMENT_RECEIPT"
    }
  },

  // SLA times in hours for each stage
  slaHours: {
    STORE1: 24,
    CABLE_PRODUCTION: 48,
    STORE2: 24,
    MOULDING: 48,
    FG_SECTION: 24,
    DISPATCH: 24,
  },

  // Email notification settings
  notifications: {
    sender: "system@reyanshelectronics.com",
    escalationHours: 4, // Hours after SLA breach to escalate
  },

  // External links
  externalLinks: {
    whatsapp: process.env.REACT_APP_WHATSAPP_LINK || "https://wa.me/", // WhatsApp link from environment variable
  },
};

// Create a deep copy of the config to ensure it's fully initialized
const configCopy = JSON.parse(JSON.stringify(config));

// Freeze the config and its nested objects
Object.freeze(configCopy);
Object.freeze(configCopy.sheets);
Object.freeze(configCopy.purchaseFlow);
Object.freeze(configCopy.purchaseFlow.steps);
Object.freeze(configCopy.purchaseFlow.tatHours);
Object.freeze(configCopy.purchaseFlow.roles);
Object.freeze(configCopy.purchaseFlow.documentTypes);
Object.freeze(configCopy.externalLinks);

// Environment-based configuration
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

// OAuth configuration based on environment
export const oauthSettings = {
  // For localhost development
  localhost: {
    redirectUri: 'http://localhost:3000',
    allowedOrigins: ['http://localhost:3000', 'http://localhost:3001']
  },
  // For Vercel production
  vercel: {
    redirectUri: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    allowedOrigins: []
  }
};

// Get current environment settings
export const getCurrentOAuthSettings = () => {
  if (isVercel && process.env.VERCEL_URL) {
    return oauthSettings.vercel;
  }
  return oauthSettings.localhost;
};

export default configCopy;
