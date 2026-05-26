export const crmMock = {
  leads: [
    {
      id: "LD-1001",
      companyName: "VoltCrest Electronics",
      contactPerson: "Ankit Mehra",
      phone: "9876501201",
      email: "ankit@voltcrest.com",
      source: "Website",
      productInterest: ["Power Cable", "Data Cable"],
      status: "New",
      assignedSalesperson: "Ritika Shah",
      createdDate: "2026-04-08",
      address: "Noida, Uttar Pradesh",
      requirementDetails: "Need low-loss cable for automation line.",
      expectedQuantity: 12000,
      priority: "High",
      assignTo: "Ritika Shah",
      notes: "Requested technical datasheet."
    },
    {
      id: "LD-1002",
      companyName: "NexaGrid Controls",
      contactPerson: "Pratik Jain",
      phone: "9823407781",
      email: "pratik@nexagrid.in",
      source: "Referral",
      productInterest: ["Fiber Cable"],
      status: "Qualified",
      assignedSalesperson: "Aman Rao",
      createdDate: "2026-04-05",
      address: "Pune, Maharashtra",
      requirementDetails: "Fiber harness for smart metering rollout.",
      expectedQuantity: 9000,
      priority: "Medium",
      assignTo: "Aman Rao",
      notes: "Commercial discussion in progress."
    }
  ],
  customers: [
    {
      id: "CUS-501",
      companyName: "Axis Powertech",
      gstNumber: "27AAXPA9900A1ZA",
      contactPerson: "Neha Kulkarni",
      phone: "9898001122",
      email: "neha@axispowertech.in",
      activeOrders: 4,
      paymentStatus: "On Time",
      customerType: "OEM",
      billingAddress: "Mumbai, Maharashtra",
      shippingAddress: "Navi Mumbai, Maharashtra",
      contactDetails: "Neha / 9898001122",
      creditLimit: 2000000,
      paymentTerms: "45 Days",
      tags: "priority,western-region"
    },
    {
      id: "CUS-502",
      companyName: "PrimeLink Distribution",
      gstNumber: "07AAECP2211D1ZT",
      contactPerson: "Irfan Ali",
      phone: "9988123400",
      email: "irfan@primelink.in",
      activeOrders: 2,
      paymentStatus: "Overdue",
      customerType: "Distributor",
      billingAddress: "Delhi",
      shippingAddress: "Ghaziabad, UP",
      contactDetails: "Irfan / 9988123400",
      creditLimit: 800000,
      paymentTerms: "30 Days",
      tags: "north-zone,followup"
    }
  ],
  followUps: [
    {
      id: "FU-2101",
      leadCustomerName: "VoltCrest Electronics",
      date: "2026-04-18",
      type: "Call",
      notes: "Discussed required insulation grade.",
      outcome: "Requested revised quote",
      nextFollowUpDate: "2026-04-26",
      status: "Scheduled"
    },
    {
      id: "FU-2102",
      leadCustomerName: "Axis Powertech",
      date: "2026-04-17",
      type: "Meeting",
      notes: "Plant visit completed.",
      outcome: "Technical sign-off received",
      nextFollowUpDate: "2026-04-28",
      status: "Completed"
    }
  ],
  deals: [
    {
      id: "DL-1",
      stage: "New",
      companyName: "VoltCrest Electronics",
      dealValue: 1800000,
      probability: 30,
      expectedClosingDate: "2026-05-12"
    },
    {
      id: "DL-2",
      stage: "Negotiation",
      companyName: "NexaGrid Controls",
      dealValue: 2600000,
      probability: 65,
      expectedClosingDate: "2026-05-07"
    },
    {
      id: "DL-3",
      stage: "Quotation Sent",
      companyName: "PrimeLink Distribution",
      dealValue: 900000,
      probability: 50,
      expectedClosingDate: "2026-05-20"
    },
    {
      id: "DL-4",
      stage: "Won",
      companyName: "Axis Powertech",
      dealValue: 3200000,
      probability: 100,
      expectedClosingDate: "2026-04-19"
    },
    {
      id: "DL-5",
      stage: "Lost",
      companyName: "SecureWire Components",
      dealValue: 700000,
      probability: 0,
      expectedClosingDate: "2026-04-11"
    }
  ]
};

export const ppcMock = {
  productionPlan: [
    {
      id: "PLN-301",
      productType: "Power Cable",
      specification: "11kV, 3 Core, 240 sqmm",
      quantity: 5000,
      startDate: "2026-04-26",
      endDate: "2026-05-03",
      status: "Planned",
      rawMaterialRequired: "Copper 8T, PVC 2T",
      machineAllocation: "CCV-02",
      priority: "High"
    },
    {
      id: "PLN-302",
      productType: "Data Cable",
      specification: "Cat6, 4 Pair",
      quantity: 12000,
      startDate: "2026-04-22",
      endDate: "2026-04-30",
      status: "In Progress",
      rawMaterialRequired: "Copper 3T, XLPE 1T",
      machineAllocation: "Twister-04",
      priority: "Medium"
    }
  ],
  workOrders: [
    {
      id: "WO-8501",
      linkedPlanId: "PLN-302",
      machine: "Twister-04",
      operator: "Mukesh S",
      shift: "A (06:00 - 14:00)",
      status: "Running",
      outputProduced: 4100,
      defects: 28,
      notes: "Minor speed calibration done."
    },
    {
      id: "WO-8502",
      linkedPlanId: "PLN-301",
      machine: "CCV-02",
      operator: "Rohan P",
      shift: "B (14:00 - 22:00)",
      status: "Pending",
      outputProduced: 0,
      defects: 0,
      notes: "Waiting for copper drum issue."
    }
  ],
  inventory: [
    { id: "MAT-01", materialName: "Copper", availableQuantity: 8250, unit: "kg", reorderLevel: 3000, status: "OK" },
    { id: "MAT-02", materialName: "PVC", availableQuantity: 1700, unit: "kg", reorderLevel: 2000, status: "Low" },
    { id: "MAT-03", materialName: "Insulation", availableQuantity: 450, unit: "kg", reorderLevel: 1200, status: "Critical" }
  ],
  dispatch: [
    {
      id: "DSP-7701",
      orderId: "SO-2012",
      customerName: "Axis Powertech",
      product: "Power Cable 11kV",
      quantity: 1800,
      dispatchDate: "2026-04-25",
      transportDetails: "BlueDart Freight - MH12AB9911",
      status: "Ready"
    },
    {
      id: "DSP-7702",
      orderId: "SO-2014",
      customerName: "PrimeLink Distribution",
      product: "Data Cable Cat6",
      quantity: 3200,
      dispatchDate: "2026-04-28",
      transportDetails: "Delhivery Surface - DL01CD7722",
      status: "Planned"
    }
  ],
  reportMetrics: {
    productionVsTarget: [
      { period: "W1", production: 4200, target: 5000 },
      { period: "W2", production: 5200, target: 5000 },
      { period: "W3", production: 4800, target: 5000 },
      { period: "W4", production: 5600, target: 5000 }
    ],
    machineUtilization: [
      { machine: "CCV-01", utilization: 74 },
      { machine: "CCV-02", utilization: 81 },
      { machine: "Twister-04", utilization: 69 },
      { machine: "Armour-03", utilization: 58 }
    ],
    defectRate: 2.6
  }
};

export const crmPpcLookups = {
  leadSources: ["Website", "Referral", "Sales Team", "Trade Show"],
  cableTypes: ["Power Cable", "Data Cable", "Fiber Cable"],
  leadStatuses: ["New", "Contacted", "Qualified", "Lost"],
  priorities: ["Low", "Medium", "High"],
  followupTypes: ["Call", "Email", "Meeting"],
  customerTypes: ["Dealer", "Distributor", "OEM"],
  planStatuses: ["Planned", "In Progress", "Completed"]
};
