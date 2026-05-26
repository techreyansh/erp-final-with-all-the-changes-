import sheetService from './sheetService';
import vendorService from './vendorService';

const RFQ_SHEET = 'RFQ';

const FloatRFQService = {
  // Get all indents at step 2 (ready for RFQ)
  async getIndentsReadyForRFQ() {
    const steps = await sheetService.getSheetData('PurchaseFlowSteps');
    // StepId 2 means approved indent, ready for RFQ
    return steps.filter(
      s => s.StepId === '2' && (s.Status === 'completed' || s.Status === 'Completed')
    );
  },

  // Get details for a specific indent
  async getIndentDetails(indentNumber) {
    const steps = await sheetService.getSheetData('PurchaseFlowSteps');
    const indent = steps.find(s => s.IndentNumber === indentNumber && s.StepId === '2');
    if (!indent) throw new Error('Indent not found');
    return {
      IndentNumber: indent.IndentNumber,
      ItemName: indent.ItemName,
      Quantity: indent.Quantity,
      Specifications: indent.Specifications,
    };
  },

  // Get all vendors
  async getVendors() {
    return vendorService.getVendors();
  },

  // Create or update RFQ for an indent (single row, vendor codes as array of objects)
  async upsertRFQs(indentNumber, rfqs) {
    // rfqs: array of { VendorCode }
    await sheetService.initializeAllSheets();
    const existing = await sheetService.getSheetData(RFQ_SHEET);
    // Remove old RFQ for this indent
    const indicesToDelete = existing
      .map((row, i) => row.IndentNumber === indentNumber ? i + 2 : null)
      .filter(idx => idx !== null)
      .sort((a, b) => b - a);
    for (const rowIndex of indicesToDelete) {
      await sheetService.deleteRow(RFQ_SHEET, rowIndex);
    }
    // Prepare vendor codes as array of objects
    const vendorCodes = rfqs.map(r => ({ VendorCode: r.VendorCode }));
    // Get indent details
    const indent = await this.getIndentDetails(indentNumber);
    // Add new RFQ row
    await sheetService.appendRow(RFQ_SHEET, {
      IndentNumber: indent.IndentNumber,
      VendorCode: JSON.stringify(vendorCodes),
      ItemName: indent.ItemName,
      Quantity: indent.Quantity,
      Specifications: indent.Specifications,
      Status: 'Draft',
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    });

    // --- Update PurchaseFlow and PurchaseFlowSteps ---
    // 1. Update PurchaseFlow: set CurrentStep to 3
    const purchaseFlowRows = await sheetService.getSheetData('PurchaseFlow');
    for (const [i, row] of purchaseFlowRows.entries()) {
      if (row.IndentNumber === indentNumber) {
        const rowIndex = i + 2;
        await sheetService.updateRow('PurchaseFlow', rowIndex, {
          ...row,
          CurrentStep: 3,
          Status: 'In Progress',
          UpdatedAt: new Date().toISOString(),
        });
      }
    }

    // 2. Update PurchaseFlowSteps: set StepNumber/StepId to 3, etc.
    const stepsRows = await sheetService.getSheetData('PurchaseFlowSteps');
    let foundStep3 = false;
    for (const [i, row] of stepsRows.entries()) {
      if (row.IndentNumber === indentNumber && (row.StepId === '2' || row.StepId === 2)) {
        foundStep3 = true;
        const rowIndex = i + 2;
        await sheetService.updateRow('PurchaseFlowSteps', rowIndex, {
          ...row,
          StepNumber: 3,
          StepId: 3,
          Role: 'Purchase Executive',
          Action: 'Float RFQ',
          Status: 'completed',
          NextStep: 4,
          PreviousStep: 2,
          EndTime: new Date().toISOString(),
          LastModifiedAt: new Date().toISOString(),
        });
      }
    }
    // If no step 3 row exists, add it (find step 2 row for details)
    if (!foundStep3) {
      const step2 = stepsRows.find(row => row.IndentNumber === indentNumber && (row.StepId === '2' || row.StepId === 2));
      await sheetService.appendRow('PurchaseFlowSteps', {
        ...step2,
        StepNumber: 3,
        StepId: 3,
        Role: 'Purchase Executive',
        Action: 'Float RFQ',
        Status: 'completed',
        NextStep: 4,
        PreviousStep: 2,
        StartTime: step2?.EndTime || new Date().toISOString(),
        EndTime: new Date().toISOString(),
        LastModifiedAt: new Date().toISOString(),
      });
    }
    return true;
  },

  // Fetch RFQ for a given indent
  async getRFQsForIndent(indentNumber) {
    const rfqs = await sheetService.getSheetData(RFQ_SHEET);
    const row = rfqs.find(r => r.IndentNumber === indentNumber);
    if (!row) return [];
    try {
      const vendorCodes = JSON.parse(row.VendorCode || '[]');
      return vendorCodes;
    } catch {
      return [];
    }
  },

  // Fetch all RFQ rows (for table display)
  async getAllRFQRows() {
    return await sheetService.getSheetData(RFQ_SHEET);
  },
};

export default FloatRFQService; 