export const calculateLeadScore = (lead) => {
  const score =
    Number(lead.budgetScore || 0) +
    Number(lead.requirementClarityScore || 0) +
    Number(lead.urgencyScore || 0) +
    Number(lead.engagementScore || 0) +
    Number(lead.decisionAuthorityScore || 0);
  if (score >= 80) return { score, category: "Hot", color: "error" };
  if (score >= 50) return { score, category: "Warm", color: "warning" };
  return { score, category: "Cold", color: "info" };
};

export const calculateQuotationPrice = (config) => {
  const baseByCable = { "Power Cable": 220, "Data Cable": 140, "Fiber Cable": 310 };
  const insulationFactor = { PVC: 1, XLPE: 1.15, EPR: 1.28 };
  const voltageFactor = { "1.1kV": 1, "11kV": 1.45, "33kV": 1.9 };
  const base = (baseByCable[config.cableType] || 150) * Number(config.coreCount || 1);
  const lengthFactor = Number(config.length || 100) / 100;
  const net = base * (insulationFactor[config.insulationType] || 1) * (voltageFactor[config.voltageGrade] || 1) * lengthFactor;
  const discountAmount = net * (Number(config.discountPercent || 0) / 100);
  const taxable = net - discountAmount;
  const taxAmount = taxable * (Number(config.taxPercent || 18) / 100);
  return {
    basePrice: Math.round(net),
    discountAmount: Math.round(discountAmount),
    taxAmount: Math.round(taxAmount),
    totalPrice: Math.round(taxable + taxAmount)
  };
};

export const evaluateCreditRisk = (customer) => {
  const usage = Number(customer.outstandingAmount || 0) / Math.max(Number(customer.creditLimit || 1), 1);
  if (usage >= 1 || Number(customer.overdueDays || 0) > 30) return { label: "Blocked", color: "error" };
  if (usage >= 0.8 || Number(customer.overdueDays || 0) > 10) return { label: "Alert", color: "warning" };
  return { label: "Safe", color: "success" };
};

export const calculateMRPShortages = (productionPlan, bom, inventory) => {
  const required = {};
  productionPlan.forEach((plan) => {
    const bomRow = bom.find((item) => item.productType === plan.productType);
    if (!bomRow) return;
    bomRow.materials.forEach((material) => {
      const qty = Number(material.quantityPerUnit || 0) * Number(plan.quantity || 0);
      required[material.material] = (required[material.material] || 0) + qty;
    });
  });
  return Object.entries(required).map(([material, requiredQty]) => {
    const stock = inventory.find((item) => item.materialName === material);
    const available = Number(stock?.availableQuantity || 0);
    const shortage = Math.max(requiredQty - available, 0);
    return {
      material,
      requiredQty,
      availableQty: available,
      shortageQty: shortage,
      suggestedPurchaseQty: shortage > 0 ? Math.ceil(shortage * 1.1) : 0
    };
  });
};

export const calculateMachineUtilization = (machines) =>
  machines.map((machine) => ({
    ...machine,
    utilization: Math.min(Math.round((Number(machine.currentLoad || 0) / Math.max(Number(machine.capacityPerDay || 1), 1)) * 100), 180),
    overloaded: Number(machine.currentLoad || 0) > Number(machine.capacityPerDay || 0)
  }));

export const calculateProductionCostPerUnit = (costing) => {
  const total = Number(costing.rawMaterialCost || 0) + Number(costing.machineCost || 0) + Number(costing.laborCost || 0);
  return { totalCost: total, costPerUnit: Number(costing.outputQty || 1) > 0 ? total / Number(costing.outputQty) : total };
};
