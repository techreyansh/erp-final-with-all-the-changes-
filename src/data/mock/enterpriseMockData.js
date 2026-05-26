export const enterpriseInitialState = {
  userRole: "Admin",
  leadActivities: [
    { id: "ACT-1", entityId: "LD-1001", type: "Call", user: "Ritika Shah", action: "Initial qualification call", timestamp: "2026-04-20T09:15:00Z" },
    { id: "ACT-2", entityId: "LD-1001", type: "Status", user: "Ritika Shah", action: "Status changed to Qualified", timestamp: "2026-04-21T14:20:00Z" },
    { id: "ACT-3", entityId: "CUS-501", type: "Meeting", user: "Aman Rao", action: "Monthly review meeting", timestamp: "2026-04-22T11:00:00Z" }
  ],
  quotations: [
    {
      id: "QT-1001",
      linkedEntity: "VoltCrest Electronics",
      cableType: "Power Cable",
      coreCount: 3,
      length: 500,
      insulationType: "XLPE",
      voltageGrade: "11kV",
      discountPercent: 5,
      taxPercent: 18,
      basePrice: 520000,
      discountAmount: 26000,
      taxAmount: 88920,
      totalPrice: 582920,
      status: "Sent"
    }
  ],
  salesOrders: [
    {
      id: "SO-3001",
      customer: "Axis Powertech",
      productSpecs: "Power Cable, 3 Core, 11kV",
      quantity: 1800,
      deliveryDate: "2026-05-04",
      paymentTerms: "45 Days",
      linkedPpcPlanId: "PLN-301",
      status: "In Production"
    }
  ],
  payments: [
    { id: "PAY-1", customerId: "CUS-501", amount: 320000, date: "2026-04-18", status: "Received" },
    { id: "PAY-2", customerId: "CUS-502", amount: 180000, date: "2026-04-02", status: "Pending" }
  ],
  openIssues: [
    { id: "ISS-1", customerId: "CUS-501", issue: "Drum labeling mismatch", severity: "Low", status: "Open" },
    { id: "ISS-2", customerId: "CUS-502", issue: "Late delivery complaint", severity: "High", status: "Open" }
  ],
  documents: [
    { id: "DOC-1", entityId: "LD-1001", fileName: "RFQ_VoltCrest_Apr.pdf", uploadDate: "2026-04-19", type: "RFQ" },
    { id: "DOC-2", entityId: "CUS-501", fileName: "Axis_PO_3001.pdf", uploadDate: "2026-04-21", type: "Purchase Order" }
  ],
  bom: [
    {
      id: "BOM-1",
      productType: "Power Cable",
      materials: [
        { material: "Copper", quantityPerUnit: 0.85, costPerUnit: 780 },
        { material: "PVC", quantityPerUnit: 0.22, costPerUnit: 120 },
        { material: "XLPE", quantityPerUnit: 0.31, costPerUnit: 210 }
      ]
    },
    {
      id: "BOM-2",
      productType: "Data Cable",
      materials: [
        { material: "Copper", quantityPerUnit: 0.33, costPerUnit: 780 },
        { material: "PVC", quantityPerUnit: 0.14, costPerUnit: 120 }
      ]
    }
  ],
  machines: [
    { id: "MC-01", type: "Wire Drawing", capacityPerDay: 5000, currentLoad: 4200, lastServiceDate: "2026-03-29", nextDueDate: "2026-05-05" },
    { id: "MC-02", type: "Stranding", capacityPerDay: 3600, currentLoad: 3950, lastServiceDate: "2026-04-01", nextDueDate: "2026-04-28" },
    { id: "MC-03", type: "Insulation", capacityPerDay: 4100, currentLoad: 2600, lastServiceDate: "2026-03-18", nextDueDate: "2026-05-11" }
  ],
  routingSteps: [
    { id: "RT-1", workOrderId: "WO-8501", step: "Wire Drawing", status: "Completed", plannedHrs: 3, actualHrs: 3.2 },
    { id: "RT-2", workOrderId: "WO-8501", step: "Stranding", status: "In Progress", plannedHrs: 4, actualHrs: 2.5 },
    { id: "RT-3", workOrderId: "WO-8501", step: "Insulation", status: "Pending", plannedHrs: 2, actualHrs: 0 },
    { id: "RT-4", workOrderId: "WO-8501", step: "Armouring", status: "Pending", plannedHrs: 3, actualHrs: 0 },
    { id: "RT-5", workOrderId: "WO-8501", step: "Testing", status: "Pending", plannedHrs: 1, actualHrs: 0 }
  ],
  productionTracking: [
    { id: "TRK-1", planId: "PLN-302", plannedOutput: 12000, actualOutput: 4100, scrapGenerated: 135, downtimeReason: "Conductor reel alignment", delayFlag: true }
  ],
  qualityChecks: [
    { id: "QC-1", workOrderId: "WO-8501", testType: "Insulation", result: "Pass", inspector: "Vikas M", remarks: "Within tolerance" },
    { id: "QC-2", workOrderId: "WO-8502", testType: "Voltage", result: "Fail", inspector: "Vikas M", remarks: "Breakdown at 9kV" }
  ],
  scrapTracking: [
    { id: "SCR-1", category: "Copper loss", wastePercent: 2.4, costImpact: 64000 },
    { id: "SCR-2", category: "Insulation waste", wastePercent: 1.1, costImpact: 28000 }
  ],
  dispatchLogistics: [
    { id: "DSP-7701", vehicleType: "10T Truck", route: "Mumbai -> Nashik", eta: "2026-04-26", packingDetails: "Drum 1200mm" },
    { id: "DSP-7702", vehicleType: "7T Truck", route: "Delhi -> Ghaziabad", eta: "2026-04-29", packingDetails: "Coil type B" }
  ],
  productionCosting: [
    { id: "COST-1", planId: "PLN-302", rawMaterialCost: 720000, machineCost: 120000, laborCost: 90000, outputQty: 12000 }
  ],
  savedViews: [
    { id: "VIEW-1", module: "crm", name: "High Value Leads", filters: { minScore: 70 } },
    { id: "VIEW-2", module: "ppc", name: "Capacity Risk", filters: { utilizationAbove: 90 } }
  ]
};
