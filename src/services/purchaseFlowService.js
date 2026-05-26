import * as db from '../lib/db';
import { supabase } from '../lib/supabaseClient';
import FloatRFQService from './FloatRFQService';
import config from '../config/config';
import { parseJsonArray, parseJsonObject } from '../utils/parseJsonField';
import { sheetInt, sheetFloat } from '../utils/sheetNumbers';

/** Match flow row to steps row even if types differ (jsonb / legacy sheets). */
function purchaseFlowIndentKey(v) {
  if (v == null || v === '') return '';
  return String(v).trim();
}

function recordIndentNumber(row) {
  if (!row || typeof row !== 'object') return undefined;
  return row.IndentNumber ?? row.indentNumber ?? row.indent_number;
}

function recordFlowId(row) {
  if (!row || typeof row !== 'object') return undefined;
  return row.FlowId ?? row.flowId ?? row.flow_id;
}

/**
 * Next workflow step: prefer flat fields on the steps row (StepsMeta); embedded Steps[] often lags after updates.
 */
function purchaseFlowResolvedNextStep(indent) {
  const meta = indent.StepsMeta || {};
  let n = meta.NextStep ?? meta.nextStep ?? meta.next_step;
  if (n != null && n !== '' && String(n).trim() !== '') return n;
  const stepsJson = indent.Steps || [];
  if (!stepsJson.length) return null;
  const last = stepsJson[stepsJson.length - 1];
  return last?.NextStep ?? last?.nextStep ?? last?.next_step ?? null;
}

/** Postgres timestamptz rejects ""; use null for optional dates. */
function nullIfBlankTimestamp(v) {
  if (v === '' || v == null) return null;
  return v;
}

const MAIN_FLOW_TS_KEYS = ['ExpectedDelivery', 'DueDate', 'ScheduledAt'];
/** Only for rows that still use these as real table columns (legacy flat tables). */
const STEPS_FLAT_TS_KEYS = ['StartTime', 'EndTime', 'LastModifiedAt'];

/** Flat / direct Supabase columns typed numeric reject "". */
function sanitizePurchaseFlowMainRow(row) {
  const r = { ...row };
  r.CurrentStep = sheetInt(r.CurrentStep, 1);
  r.Budget = sheetFloat(r.Budget, 0);
  r.FinalAmount = sheetFloat(r.FinalAmount, 0);
  for (const k of MAIN_FLOW_TS_KEYS) {
    if (k in r) r[k] = nullIfBlankTimestamp(r[k]);
  }
  return r;
}

function sanitizePurchaseFlowStepsFlatRow(row) {
  const r = { ...row };
  r.StepId = sheetInt(r.StepId, 1);
  r.StepNumber = sheetInt(r.StepNumber, 1);
  r.TAT = r.TAT === '' || r.TAT == null ? 1 : sheetFloat(r.TAT, 1);
  for (const k of STEPS_FLAT_TS_KEYS) {
    if (k in r) r[k] = nullIfBlankTimestamp(r[k]);
  }
  return r;
}

const SHEET_NAME = 'PurchaseFlow';
const STEPS_SHEET = 'PurchaseFlowSteps';

function table(sheetName) {
  return db.getTableName(sheetName) || sheetName;
}
async function updateRowByIndex(sheetName, rowIndex, data) {
  const rows = await db.getTableRows(table(sheetName));
  const row = rows[rowIndex - 2];
  if (!row?.id) throw new Error(`Row at index ${rowIndex} not found in ${sheetName}`);
  const merged = { ...row, ...data };
  delete merged.id;
  await db.updateTableRowById(table(sheetName), row.id, merged);
}
async function deleteRowByIndex(sheetName, rowIndex) {
  const rows = await db.getTableRows(table(sheetName));
  const row = rows[rowIndex - 2];
  if (!row?.id) throw new Error(`Row at index ${rowIndex} not found in ${sheetName}`);
  await db.deleteTableRowById(table(sheetName), row.id);
}

const purchaseFlowService = {
  // Update an indent by IndentNumber (in both sheets)
  async updateIndent(indentNumber, updatedData) {
    // Update in PurchaseFlow (can be multiple rows)
    const data = await db.getTableRows(table(SHEET_NAME));
    const updates = [];
    data.forEach((row, i) => {
      if (row.IndentNumber === indentNumber) {
        const rowIndex = i + 2;
        const updatedRow = { ...row, ...updatedData };
        updates.push(updateRowByIndex(SHEET_NAME, rowIndex, updatedRow));
      }
    });

    // Update in PurchaseFlowSteps (all steps with this IndentNumber)
    const steps = await db.getTableRows(table(STEPS_SHEET));
    steps.forEach((step, i) => {
      if (step.IndentNumber === indentNumber) {
        const stepRowIndex = i + 2;
        const updatedStep = {
          ...step,
          ItemCode: updatedData.ItemCode ?? step.ItemCode,
          ItemName: updatedData.ItemName ?? step.ItemName,
          Quantity: updatedData.Quantity ?? step.Quantity,
          Specifications: updatedData.Specifications ?? step.Specifications,
        };
        updates.push(updateRowByIndex(STEPS_SHEET, stepRowIndex, updatedStep));
      }
    });
    await Promise.all(updates);
    return true;
  },

  // Delete an indent by IndentNumber (in both sheets)
  async deleteIndent(indentNumber) {
    // Delete from PurchaseFlow (can be multiple rows)
    let data = await db.getTableRows(table(SHEET_NAME));
    let indicesToDelete = data
      .map((row, i) => (row.IndentNumber === indentNumber ? i + 2 : null))
      .filter(idx => idx !== null)
      .sort((a, b) => b - a);
    for (const rowIndex of indicesToDelete) {
      await deleteRowByIndex(SHEET_NAME, rowIndex);
    }

    // Delete all steps from PurchaseFlowSteps with this IndentNumber
    let steps = await db.getTableRows(table(STEPS_SHEET));
    let stepIndicesToDelete = steps
      .map((step, i) => (step.IndentNumber === indentNumber ? i + 2 : null))
      .filter(idx => idx !== null)
      .sort((a, b) => b - a);
    for (const rowIndex of stepIndicesToDelete) {
      await deleteRowByIndex(STEPS_SHEET, rowIndex);
    }
    return true;
  },

  // Approve an indent (step 2) by IndentNumber
  async approveIndent(indentNumber, userEmail) {
    // Get all steps with this IndentNumber and StepId=2
    const steps = await db.getTableRows(table(STEPS_SHEET));
    const updates = [];
    for (const [i, step] of steps.entries()) {
      if (step.IndentNumber === indentNumber) {
        const rowIndex = i + 2;
        let stepsArr = [];
        try { stepsArr = step.Steps ? JSON.parse(step.Steps) : []; } catch { stepsArr = []; }
        const timestamp = new Date().toISOString();
        // Update only the last step object in the array
        if (stepsArr.length > 0) {
          const lastStep = stepsArr[stepsArr.length - 1];
          lastStep.StepId = 2;
          lastStep.StepNumber = 2;
          lastStep.Role = 'Process Coordinator';
          lastStep.Action = 'Approve Indent';
          lastStep.Status = 'completed';
          lastStep.AssignedTo = 'Purchase Executive';
          lastStep.StartTime = lastStep.StartTime || timestamp;
          lastStep.EndTime = timestamp;
          lastStep.TAT = '1';
          lastStep.TATStatus = 'On Time';
          lastStep.ApprovalStatus = 'Approved';
          lastStep.RejectionReason = '';
          lastStep.NextStep = 3;
          lastStep.PreviousStep = 1;
          lastStep.Dependencies = '';
          lastStep.LastModifiedBy = userEmail;
          lastStep.LastModifiedAt = timestamp;
        }
        const updatedRow = {
          ...step,
          StepNumber: 2,
          StepId: '2',
          Status: 'completed',
          Role: 'Process Coordinator',
          Action: 'Approve Indent',
          ApprovalStatus: 'Approved',
          AssignedTo: 'Purchase Executive',
          EndTime: timestamp,
          LastModifiedAt: timestamp,
          LastModifiedBy: userEmail,
          NextStep: '3',
          PreviousStep: 1,
          Steps: JSON.stringify(stepsArr)
        };
        updates.push(updateRowByIndex(STEPS_SHEET, rowIndex, updatedRow));
      }
    }
    // Update main flow status for this IndentNumber
    const flows = await db.getTableRows(table(SHEET_NAME));
    for (const [i, flow] of flows.entries()) {
      if (flow.IndentNumber === indentNumber) {
        const rowIndex = i + 2;
        const updatedFlow = {
          ...flow,
          CurrentStep: 2, // move to next step
          Status: 'In Progress',
          UpdatedAt: new Date().toISOString(),
          LastModifiedBy: userEmail,
        };
        updates.push(updateRowByIndex(SHEET_NAME, rowIndex, updatedFlow));
      }
    }
    await Promise.all(updates);
    return true;
  },

  // Reject an indent (step 2) by IndentNumber
  async rejectIndent(indentNumber, reason, userEmail) {
    // Get all steps with this IndentNumber and StepId=2
    const steps = await db.getTableRows(table(STEPS_SHEET));
    const updates = [];
    for (const [i, step] of steps.entries()) {
      if (step.IndentNumber === indentNumber) {
        const rowIndex = i + 2;
        let stepsArr = [];
        try { stepsArr = step.Steps ? JSON.parse(step.Steps) : []; } catch { stepsArr = []; }
        const timestamp = new Date().toISOString();
        // Update only the last step object in the array
        if (stepsArr.length > 0) {
          const lastStep = stepsArr[stepsArr.length - 1];
          lastStep.StepId = 2;
          lastStep.StepNumber = 2;
          lastStep.Role = 'Process Coordinator';
          lastStep.Action = 'Approve Indent';
          lastStep.Status = 'rejected';
          lastStep.AssignedTo = '';
          lastStep.StartTime = lastStep.StartTime || timestamp;
          lastStep.EndTime = timestamp;
          lastStep.TAT = '1';
          lastStep.TATStatus = '';
          lastStep.ApprovalStatus = 'Rejected';
          lastStep.RejectionReason = reason;
          lastStep.NextStep = '';
          lastStep.PreviousStep = 1;
          lastStep.Dependencies = '';
          lastStep.LastModifiedBy = userEmail;
          lastStep.LastModifiedAt = timestamp;
        }
        const updatedRow = {
          ...step,
          StepNumber: 2,
          StepId: '2',
          Status: 'rejected',
          ApprovalStatus: 'Rejected',
          Role: 'Process Coordinator',
          Action: 'Approve Indent',
          RejectionReason: reason,
          EndTime: timestamp,
          LastModifiedAt: timestamp,
          LastModifiedBy: userEmail,
          NextStep: '',
          PreviousStep: 1,
          AssignedTo: '',
          Steps: JSON.stringify(stepsArr)
        };
        updates.push(updateRowByIndex(STEPS_SHEET, rowIndex, updatedRow));
      }
    }
    // Update main flow status for this IndentNumber
    const flows = await db.getTableRows(table(SHEET_NAME));
    for (const [i, flow] of flows.entries()) {
      if (flow.IndentNumber === indentNumber) {
        const rowIndex = i + 2;
        const updatedFlow = {
          ...flow,
          Status: 'Rejected',
          UpdatedAt: new Date().toISOString(),
          LastModifiedBy: userEmail,
        };
        updates.push(updateRowByIndex(SHEET_NAME, rowIndex, updatedFlow));
      }
    }
    await Promise.all(updates);
    return true;
  },

  /** @deprecated Prefer getIndentsWithItemsAndVendors(); kept for any legacy callers. */
  async getIndentsAtStep3() {
    return this.getIndentsWithItemsAndVendors();
  },

  // Get vendors for a given indent (by IndentNumber)
  async getVendorsForIndent(indentNumber) {
    const rfqRows = await db.getTableRows(table('RFQ'));
    const want = purchaseFlowIndentKey(indentNumber);
    const row = rfqRows.find((r) => purchaseFlowIndentKey(recordIndentNumber(r)) === want);
    const rfqItems = parseJsonArray(row?.Items);
    const vendorCodesSet = new Set();
    for (const item of rfqItems) {
      const vv = item.vendors;
      if (!Array.isArray(vv)) continue;
      for (const v of vv) {
        const c = v.vendorCode ?? v.VendorCode;
        if (c) vendorCodesSet.add(c);
      }
    }
    const vendorCodes = [...vendorCodesSet];
    if (vendorCodes.length === 0) return [];
    const allVendors = await db.getTableRows(table('Vendor'));
    const vendors = allVendors.filter(v => vendorCodes.includes(v['Vendor Code']));

    const steps = await db.getTableRows(table('PurchaseFlowSteps'));
    const step =
      steps.find(
        (s) =>
          purchaseFlowIndentKey(recordIndentNumber(s)) === want &&
          (String(s.StepNumber) === '3' || String(s.StepNumber) === '4' || Number(s.StepNumber) === 3 || Number(s.StepNumber) === 4)
      ) || steps.find((s) => purchaseFlowIndentKey(recordIndentNumber(s)) === want);
    const docs = parseJsonArray(step?.Documents);
    // docs is an array of { vendorCode, status, ... }
    return vendors.map(vendor => {
      const doc = docs.find(d => d.vendorCode === vendor['Vendor Code']);
      return {
        ...vendor,
        status: doc && doc.status === 'contacted' ? 'Contacted' : 'Not Contacted',
      };
    });
  },

  // Get all vendors for dropdown selection
  async getAllVendors() {
    try {
      const allVendors = await db.getTableRows(table('Vendor'));
      return allVendors || [];
    } catch (error) {
      console.error('Error fetching all vendors:', error);
      return [];
    }
  },

  // Update vendor quotation status and upload file
  async uploadVendorQuotation({ indentNumber, vendorCode, file, userEmail }) {
    // Upload file to Google Drive
    const fileId = (await (async () => { const path = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`; const { data, error } = await supabase.storage.from('documents').upload(path, file, { upsert: false }); if (error) throw error; return data?.path || path; })());
    // Update the step row for this vendor/indent
    const steps = await db.getTableRows(table(STEPS_SHEET));
    const stepIdx = steps.findIndex(
      s => s.IndentNumber === indentNumber && String(s.StepNumber) === '3'
    );
    if (stepIdx === -1) throw new Error('Step not found for this indent/vendor');
    const rowIndex = stepIdx + 2;
    const step = steps[stepIdx];
    // Update quotations (store as JSON in Documents field)
    let docs = [];
    try { docs = JSON.parse(step.Documents || '[]'); } catch {}
    const docIdx = docs.findIndex(d => d.vendorCode === vendorCode);
    if (docIdx !== -1) {
      docs[docIdx] = { ...docs[docIdx], fileId, status: 'contacted' };
    } else {
      docs.push({ vendorCode, fileId, status: 'contacted' });
    }
    await updateRowByIndex(STEPS_SHEET, rowIndex, {
      ...step,
      Documents: JSON.stringify(docs),
      LastModifiedBy: userEmail,
      LastModifiedAt: new Date().toISOString(),
    });
    return fileId;
  },

  // Save draft for Follow-up Quotations (step 4)
  async saveFollowupQuotationDraft({ indentNumber, files, userEmail }) {
    // 1. Update PurchaseFlow: set CurrentStep to 4
    const flows = await db.getTableRows(table(SHEET_NAME));
    const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
    if (flowIdx !== -1) {
      const rowIndex = flowIdx + 2;
      const flow = flows[flowIdx];
      await updateRowByIndex(SHEET_NAME, rowIndex, {
        ...flow,
        CurrentStep: 4,
        UpdatedAt: new Date().toISOString(),
        LastModifiedBy: userEmail,
      });
    }
    // 2. Update PurchaseFlowSteps: update existing row for step 4
    const steps = await db.getTableRows(table(STEPS_SHEET));
    const stepIdx = steps.findIndex(
      s => s.IndentNumber === indentNumber && String(s.StepNumber) === '3'
    );
    if (stepIdx !== -1) {
      const rowIndex = stepIdx + 2;
      const step = steps[stepIdx];
      // Update Documents with the file (simulate as array of files)
      let docs = [];
      try { docs = JSON.parse(step.Documents || '[]'); } catch {}
      if (files && Array.isArray(files)) {
        docs = docs.concat(files.map(f => ({ fileId: f.fileId || 'dummy-file-id', fileName: f.name })));
      }
      await updateRowByIndex(STEPS_SHEET, rowIndex, {
        ...step,
        StepNumber: 4,
        StepId: 4,
        Role: 'Purchase Executive',
        AssignedTo: 'Purchase Executive',
        Action: 'Prepare Comparative Statement',
        TAT: 2,
        NextStep: 5,
        PreviousStep: 3,
        Documents: JSON.stringify(docs),
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString(),
      });
    }
    // 3. Append to FollowUpQuotations
    if (files && Array.isArray(files)) {
      for (const file of files) {
        await db.insertTableRow(table('FollowUpQuotations'), {
          IndentNumber: indentNumber,
          Vendor: file.vendor || '',
          QuotationDocument: file.fileId || file.fileName || '',
          CreatedBy: userEmail,
          CreatedAt: new Date().toISOString(),
        });
      }
    }
    return true;
  },

  // Get all indents for Comparative Statement (follow-up complete → NextStep 5; exclude once NextStep 6)
  async getIndentsForComparativeStatement() {
    try {
      const allMerged = await this.getAllIndents();
      const queued = allMerged.filter((i) => this.isAwaitingComparativeStatement(i));

      const rfqData = await db.getTableRows(table('RFQ'));
      const followupQuotationData = await db.getTableRows(table('FollowUpQuotations'));
      const vendorData = await db.getTableRows(table('Vendor'));

      return queued.map((indent) => {
        const indentKey = purchaseFlowIndentKey(recordIndentNumber(indent));
        const indentNum = recordIndentNumber(indent) ?? indent.IndentNumber;

        let originalItems = parseJsonArray(indent.Items);
        if (!Array.isArray(originalItems) && originalItems && typeof originalItems === 'object') {
          originalItems = Object.values(originalItems);
        }

        const rfqRow = rfqData.find(
          (row) => purchaseFlowIndentKey(recordIndentNumber(row)) === indentKey
        );
        const rfqItems = parseJsonArray(rfqRow?.Items);
        const fqRows = followupQuotationData.filter(
          (row) => purchaseFlowIndentKey(recordIndentNumber(row)) === indentKey
        );
        let quotationsData = {};
        for (const row of fqRows) {
          if (row.Quotations != null && row.Quotations !== '') {
            const parsed = parseJsonObject(row.Quotations);
            quotationsData = { ...quotationsData, ...parsed };
          }
        }

        const itemsWithVendors = [];
        for (const originalItem of originalItems) {
          const itemCode = originalItem.itemCode ?? originalItem.ItemCode;
          if (!itemCode) continue;

          const rfqItem = rfqItems.find(
            (i) => (i.itemCode ?? i.ItemCode) === itemCode
          );
          const vendorsFromRFQ =
            rfqItem && Array.isArray(rfqItem.vendors) ? rfqItem.vendors : [];

          const vendors = vendorsFromRFQ.map((vendor) => {
            const vCode = vendor.vendorCode ?? vendor.VendorCode;
            const quotationData = quotationsData[itemCode]?.[vCode];
            const quotationDocument = quotationData?.quotationDocument || null;
            const vendorDetails = vendorData.find((v) => v['Vendor Code'] === vCode);
            return {
              vendorCode: vCode,
              vendorName:
                vendor.vendorName ||
                vendor.VendorName ||
                vendorDetails?.['Vendor Name'] ||
                vCode,
              vendorContact:
                vendorDetails?.['Vendor Contact'] || vendorDetails?.['Contact'] || '',
              vendorEmail:
                vendorDetails?.['Vendor Email'] || vendorDetails?.['Email'] || '',
              quotationDocument,
            };
          });

          itemsWithVendors.push({
            itemCode,
            item: originalItem.item || originalItem.itemName || itemCode,
            itemName: originalItem.item || originalItem.itemName || itemCode,
            quantity: originalItem.quantity ?? originalItem.Quantity ?? '',
            specifications: originalItem.specifications ?? originalItem.Specifications ?? '',
            vendors,
          });
        }

        return {
          ...indent,
          IndentNumber: indentNum,
          Items: itemsWithVendors,
        };
      });
    } catch (error) {
      console.error('Error fetching indents for Comparative Statement:', error);
      return [];
    }
  },

  // Save comparative statement and update flow/steps (single row per indent)
  async saveComparativeStatement({ indentNumber, comparativeData, userEmail }) {
    let clean;
    try {
      clean = JSON.parse(JSON.stringify(comparativeData ?? {}));
    } catch (e) {
      throw new Error('Comparative data could not be serialized');
    }

    const rows = await db.getTableRows(table('Comparative Statement'));
    const want = purchaseFlowIndentKey(indentNumber);
    const idx = rows.findIndex(
      (r) => purchaseFlowIndentKey(recordIndentNumber(r)) === want
    );
    const now = new Date().toISOString();
    const email = userEmail || 'system';

    const rowData = {
      IndentNumber: indentNumber,
      ComparativeData: clean,
      Data: clean,
      CreatedAt: idx === -1 ? now : rows[idx].CreatedAt,
      CreatedBy: idx === -1 ? email : rows[idx].CreatedBy ?? email,
      LastModifiedAt: now,
      LastModifiedBy: email,
    };

    if (idx !== -1) {
      await updateRowByIndex('Comparative Statement', idx + 2, { ...rows[idx], ...rowData });
    } else {
      await db.insertTableRow(table('Comparative Statement'), rowData);
    }
    return true;
  },

  /**
   * Complete Comparative Statement step: update PurchaseFlow and PurchaseFlowSteps for the indent
   */
  async completeComparativeStatementStep({ indentNumber, userEmail }) {
    // 1. Update PurchaseFlow: move to step 6 (Approve Quotation) after comparative is done
    const flows = await db.getTableRows(table(SHEET_NAME));
    const wantFlow = purchaseFlowIndentKey(indentNumber);
    const flowIdx = flows.findIndex(
      (row) => purchaseFlowIndentKey(recordIndentNumber(row)) === wantFlow
    );
    if (flowIdx !== -1) {
      const rowIndex = flowIdx + 2;
      const flow = flows[flowIdx];
      let stepsArr = [];
      try { stepsArr = flow.Steps ? JSON.parse(flow.Steps) : []; } catch { stepsArr = []; }
      // Replace last step with step 5 object
      const timestamp = new Date().toISOString();
      const step5Obj = {
        StepId: 5,
        StepNumber: 5,
        Role: 'Management / HOD',
        Action: 'Prepare Comparative Statement',
        Status: 'completed',
        AssignedTo: 'Management / HOD',
        StartTime: stepsArr.length > 0 ? stepsArr[stepsArr.length-1].EndTime || timestamp : timestamp,
        EndTime: timestamp,
        TAT: '2',
        TATStatus: 'On Time',
        ApprovalStatus: 'Pending',
        RejectionReason: '',
        NextStep: 6,
        PreviousStep: 4,
        Dependencies: '',
        LastModifiedBy: userEmail,
        LastModifiedAt: timestamp,
      };
      if (stepsArr.length > 0) {
        stepsArr[stepsArr.length - 1] = step5Obj;
      } else {
        stepsArr.push(step5Obj);
      }
      await updateRowByIndex(SHEET_NAME, rowIndex, {
        ...flow,
        CurrentStep: 6,
        Steps: JSON.stringify(stepsArr),
        UpdatedAt: timestamp,
        LastModifiedBy: userEmail,
      });
    }
    // 2. Update PurchaseFlowSteps: update the indent row as stepId and stepNumber 5, nextStep 6, prevStep 4, assignedTo Management / HOD, action Prepare Comparative Statement, and update Steps array
    const steps = await db.getTableRows(table(STEPS_SHEET));
    const want = purchaseFlowIndentKey(indentNumber);
    let stepIdx = steps.findIndex(
      (s) =>
        purchaseFlowIndentKey(recordIndentNumber(s)) === want &&
        String(s.StepNumber) === '4'
    );
    if (stepIdx === -1) {
      stepIdx = steps.findIndex(
        (s) =>
          purchaseFlowIndentKey(recordIndentNumber(s)) === want &&
          String(s.StepNumber) === '5' &&
          (Number(s.NextStep) === 5 || String(s.NextStep) === '5')
      );
    }
    if (stepIdx === -1) {
      stepIdx = steps.findIndex((s) => purchaseFlowIndentKey(recordIndentNumber(s)) === want);
    }
    if (stepIdx !== -1) {
      const rowIndex = stepIdx + 2;
      const step = steps[stepIdx];
      let stepsArr2 = [];
      try { stepsArr2 = step.Steps ? JSON.parse(step.Steps) : []; } catch { stepsArr2 = []; }
      const timestamp = new Date().toISOString();
      const step5Obj2 = {
        StepId: 5,
        StepNumber: 5,
        Role: 'Management / HOD',
        Action: 'Prepare Comparative Statement',
        Status: 'completed',
        AssignedTo: 'Management / HOD',
        StartTime: stepsArr2.length > 0 ? stepsArr2[stepsArr2.length-1].EndTime || timestamp : timestamp,
        EndTime: timestamp,
        TAT: '2',
        TATStatus: 'On Time',
        ApprovalStatus: 'Pending',
        RejectionReason: '',
        NextStep: 6,
        PreviousStep: 4,
        Dependencies: '',
        LastModifiedBy: userEmail,
        LastModifiedAt: timestamp,
      };
      if (stepsArr2.length > 0) {
        stepsArr2[stepsArr2.length - 1] = step5Obj2;
      } else {
        stepsArr2.push(step5Obj2);
      }
      await updateRowByIndex(STEPS_SHEET, rowIndex, {
        ...step,
        StepNumber: 5,
        StepId: 5,
        NextStep: 6,
        PreviousStep: 4,
        AssignedTo: 'Management / HOD',
        Action: 'Prepare Comparative Statement',
        Steps: JSON.stringify(stepsArr2),
        LastModifiedBy: userEmail,
        LastModifiedAt: timestamp,
      });
    }
    return true;
  },

  // Fetch all indents at step 5 (Comparative Statement prepared, not yet approved)
  async getIndentsAtStep5() {
    const steps = await db.getTableRows(table(STEPS_SHEET));
    // StepNumber and StepId for 'Approve Quotation' is 6, but we want those at step 5, ready for approval
    return steps.filter(
      step => String(step.StepNumber) === '5' && (step.Status === 'completed' || step.Status === 'in_progress')
    );
  },

  // Get comparative statement data for a given indent number
  async getComparativeStatementForIndent(indentNumber) {
    const comparativeRows = await db.getTableRows(table('Comparative Statement'));
    const want = purchaseFlowIndentKey(indentNumber);
    const row = comparativeRows.find(
      (r) => purchaseFlowIndentKey(recordIndentNumber(r)) === want
    );
    if (!row) return {};
    const raw = row.ComparativeData ?? row.Data;
    return parseJsonObject(raw);
  },

  // Approve a quotation: save to SheetApproveQuotation, update PurchaseFlow and PurchaseFlowSteps
  async approveQuotation({ indentNumber, bestQuotation, userEmail, sampleRequired = true }) {
    // 1. Save to SheetApproveQuotation
    await db.insertTableRow(table('SheetApproveQuotation'), {
      IndentNumber: indentNumber,
      ApprovedQuotation: JSON.stringify(bestQuotation),
      ApprovedBy: userEmail,
      ApprovedAt: new Date().toISOString(),
      SampleRequired: sampleRequired ? 'Yes' : 'No',
    });
    // 2. Update PurchaseFlow: set CurrentStep to 6
    const flows = await db.getTableRows(table(SHEET_NAME));
    const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
    if (flowIdx !== -1) {
      const rowIndex = flowIdx + 2;
      const flow = flows[flowIdx];
      await updateRowByIndex(SHEET_NAME, rowIndex, {
        ...flow,
        CurrentStep: 6,
        UpdatedAt: new Date().toISOString(),
        LastModifiedBy: userEmail,
      });
    }
    // 3. Update PurchaseFlowSteps: update or add step 6
    const steps = await db.getTableRows(table(STEPS_SHEET));
    let stepIdx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.StepNumber) === '5');
    const nextStep = sampleRequired ? 7 : 9;
    if (stepIdx !== -1) {
      const rowIndex = stepIdx + 2;
      const step = steps[stepIdx];
      await updateRowByIndex(STEPS_SHEET, rowIndex, {
        ...step,
        StepNumber: 6,
        StepId: 6,
        AssignedTo: 'Purchase Executive',
        Action: 'Approve Quotation',
        NextStep: nextStep,
        PreviousStep: 5,
        Status: 'completed',
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString(),
      });
    } else {
      // Add new step 6 row if not found
      await db.insertTableRow(table(STEPS_SHEET), {
        IndentNumber: indentNumber,
        StepNumber: 6,
        StepId: 6,
        AssignedTo: 'Purchase Executive',
        Action: 'Approve Quotation',
        NextStep: nextStep,
        PreviousStep: 5,
        Status: 'completed',
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString(),
      });
    }
    return true;
  },

  // Fetch all indents at step 6 (Request Sample) with next step 7
  async getIndentsAtStep6() {
    const steps = await db.getTableRows(table('PurchaseFlowSteps'));
    return steps.filter(
      step => String(step.StepNumber) === '6' && String(step.StepId) === '6' && String(step.NextStep) === '7'
    );
  },

  // For a given indent, fetch all vendors and their details from Comparative Statement
  async getVendorsForIndentWithComparative(indentNumber) {
    // Get comparative statement data for this indent
    const comparativeRows = await db.getTableRows(table('Comparative Statement'));
    const followupQuotationRows = await db.getTableRows(table('FollowUpQuotations'));
    const vendorRows = await db.getTableRows(table('Vendor'));
    const row = comparativeRows.find(r => r.IndentNumber === indentNumber);
    if (!row) return [];
    let comparativeData = {};
    try { comparativeData = JSON.parse(row.ComparativeData); } catch {}
    // Each key is a vendor code, value is vendor details
    return Object.entries(comparativeData).map(([vendorCode, details]) => {
      const quotation = followupQuotationRows.find(q => q.IndentNumber === indentNumber && q.Vendor === vendorCode);
      const vendorObj = vendorRows.find(v => v['Vendor Code'] === vendorCode);
      return {
        vendorCode,
        ...details,
        QuotationDocument: quotation ? quotation.QuotationDocument : null,
        vendorEmail: vendorObj?.['Vendor Email'] || vendorObj?.email || vendorObj?.Email || '',
      };
    });
  },

  // Get request sample status for all vendors for a given indent
  async getRequestSampleStatus(indentNumber) {
    const rows = await db.getTableRows(table('RequestSample'));
    return rows.filter(r => r.IndentNumber === indentNumber);
  },

  // Update request sample status for a vendor
  async updateRequestSampleStatus({ indentNumber, vendorCode, status, trackingStatus, userEmail }) {
    // Check if row exists
    const rows = await db.getTableRows(table('RequestSample'));
    const idx = rows.findIndex(r => r.IndentNumber === indentNumber && r.VendorCode === vendorCode);
    const now = new Date().toISOString();
    if (idx !== -1) {
      // Update existing row
      await updateRowByIndex('RequestSample', idx + 2, {
        ...rows[idx],
        Status: status,
        TrackingStatus: trackingStatus,
        LastModifiedBy: userEmail,
        LastModifiedAt: now
      });
    } else {
      // Append new row
      await db.insertTableRow(table('RequestSample'), {
        IndentNumber: indentNumber,
        VendorCode: vendorCode,
        Status: status,
        TrackingStatus: trackingStatus,
        LastModifiedBy: userEmail,
        LastModifiedAt: now
      });
    }
    return true;
  },

  // Complete the Request & Follow-up for Sample step for an indent
  async completeRequestSampleStep({ indentNumber, userEmail }) {
    // 1. Update PurchaseFlow: set CurrentStep to 7
    const flows = await db.getTableRows(table(SHEET_NAME));
    const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
    if (flowIdx !== -1) {
      const rowIndex = flowIdx + 2;
      const flow = flows[flowIdx];
      await updateRowByIndex(SHEET_NAME, rowIndex, {
        ...flow,
        CurrentStep: 7,
        UpdatedAt: new Date().toISOString(),
        LastModifiedBy: userEmail,
      });
    }
    // 2. Update PurchaseFlowSteps: update or add step 7
    const steps = await db.getTableRows(table(STEPS_SHEET));
    let stepIdx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.StepNumber) === '6');
    if (stepIdx !== -1) {
      const rowIndex = stepIdx + 2;
      const step = steps[stepIdx];
      await updateRowByIndex(STEPS_SHEET, rowIndex, {
        ...step,
        StepNumber: 7,
        StepId: 7,
        NextStep: 8,
        PreviousStep: 6,
        Action: 'Request & Follow-up for Sample',
        TAT: 3,
        AssignedTo: 'QC Manager',
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString(),
      });
    } else {
      // Add new step 7 row if not found
      await db.insertTableRow(table(STEPS_SHEET), {
        IndentNumber: indentNumber,
        StepNumber: 7,
        StepId: 7,
        NextStep: 8,
        PreviousStep: 6,
        Action: 'Request & Follow-up for Sample',
        TAT: 3,
        AssignedTo: 'QC Manager',
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString(),
      });
    }
    return true;
  },

  // Fetch all indents at step 7 (Inspect Sample)
  async getIndentsAtStep7() {
    const steps = await db.getTableRows(table('PurchaseFlowSteps'));
    return steps.filter(
      step => String(step.StepNumber) === '7' && String(step.StepId) === '7'
    );
  },

  // For a given indent, fetch the approved vendor details from SheetApproveQuotation
  async getApprovedVendorForIndent(indentNumber) {
    const rows = await db.getTableRows(table('SheetApproveQuotation'));
    const row = rows.find(r => r.IndentNumber === indentNumber);
    if (!row) return null;
    try {
      return JSON.parse(row.ApprovedQuotation);
    } catch {
      return null;
    }
  },

  // Mark sample as inspected: update PurchaseFlow and PurchaseFlowSteps
  async updateSampleInspected({ indentNumber, userEmail, note }) {
    // 1. Update PurchaseFlow: set CurrentStep to 8
    const flows = await db.getTableRows(table(SHEET_NAME));
    const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
    if (flowIdx !== -1) {
      const rowIndex = flowIdx + 2;
      const flow = flows[flowIdx];
      await updateRowByIndex(SHEET_NAME, rowIndex, {
        ...flow,
        CurrentStep: 8,
        UpdatedAt: new Date().toISOString(),
        LastModifiedBy: userEmail,
      });
    }
    // 2. Update PurchaseFlowSteps: update or add step 8
    const steps = await db.getTableRows(table(STEPS_SHEET));
    let stepIdx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.StepNumber) === '7');
    if (stepIdx !== -1) {
      const rowIndex = stepIdx + 2;
      const step = steps[stepIdx];
      await updateRowByIndex(STEPS_SHEET, rowIndex, {
        ...step,
        StepNumber: 8,
        StepId: 8,
        NextStep: 9,
        PreviousStep: 7,
        Action: 'Inspect Sample',
        AssignedTo: 'Purchase Executive',
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString(),
      });
    } else {
      // Add new step 8 row if not found
      await db.insertTableRow(table(STEPS_SHEET), {
        IndentNumber: indentNumber,
        StepNumber: 8,
        StepId: 8,
        NextStep: 9,
        PreviousStep: 7,
        Action: 'Inspect Sample',
        AssignedTo: 'Purchase Executive',
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString(),
      });
    }
    // 3. Update InspectMaterial sheet: update or append with note
    const inspectMaterials = await db.getTableRows(table(config.sheets.inspectMaterial));
    const inspectIdx = inspectMaterials.findIndex(im => im.IndentNumber === indentNumber);
    const now = new Date().toISOString();
    if (inspectIdx !== -1) {
      // Update existing row
      const rowIndex = inspectIdx + 2;
      const row = inspectMaterials[inspectIdx];
      await updateRowByIndex(config.sheets.inspectMaterial, rowIndex, {
        ...row,
        Note: note || '',
        InspectionDate: now,
        InspectedBy: userEmail,
        Status: 'Inspected',
      });
    } else {
      // Append new row
      await db.insertTableRow(table(config.sheets.inspectMaterial), {
        IndentNumber: indentNumber,
        ItemName: '',
        Specifications: '',
        Quantity: '',
        Price: '',
        VendorCode: '',
        VendorName: '',
        VendorContact: '',
        VendorEmail: '',
        DCDocumentId: '',
        InvoiceDocumentId: '',
        PODocumentId: '',
        InspectionDate: now,
        InspectedBy: userEmail,
        Status: 'Inspected',
        Note: note || '',
      });
    }
    return true;
  },

  uploadPODocument: async function(file) {
    // Upload file to Supabase storage
    return (await (async () => { const path = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`; const { data, error } = await supabase.storage.from('documents').upload(path, file, { upsert: false }); if (error) throw error; return data?.path || path; })());
  },

  placePO: async function({ indent, quotation, vendor, poFileId, quantity }) {
    // Tables managed by Supabase migrations
    // Generate POId: PO + 5 digits (incremental)
    const existingPOs = await db.getTableRows(table('PlacePO'));
    let maxNum = 0;
    for (const row of existingPOs) {
      if (row.POId && /^PO\d{5}$/.test(row.POId)) {
        const num = parseInt(row.POId.slice(2), 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextNum = (maxNum + 1).toString().padStart(5, '0');
    const POId = `PO${nextNum}`;

    await db.insertTableRow(table('PlacePO'), {
      POId,
      IndentNumber: indent.IndentNumber,
      ItemName: indent.ItemName,
      Specifications: indent.Specifications,
      Quantity: quantity || indent.Quantity || '',
      VendorCode: quotation.vendorCode,
      Price: quotation.price,
      DeliveryTime: quotation.deliveryTime,
      Terms: quotation.terms,
      LeadTime: quotation.leadTime,
      VendorName: vendor['Vendor Name'] || vendor['Alternate Vendors'] || '',
      VendorContact: vendor['Vendor Contact'] || '',
      VendorEmail: vendor['Vendor Email'] || '',
      PlacedAt: new Date().toISOString(),
      PODocumentId: poFileId || '',
    });

    // 2. Update PurchaseFlow sheet to set CurrentStep to 9
    const flows = await db.getTableRows(table('PurchaseFlow'));
    const flowIdx = flows.findIndex(row => row.IndentNumber === indent.IndentNumber);
    if (flowIdx !== -1) {
      const rowIndex = flowIdx + 2;
      const flow = flows[flowIdx];
      await updateRowByIndex('PurchaseFlow', rowIndex, {
        ...flow,
        CurrentStep: 9,
        UpdatedAt: new Date().toISOString(),
      });
    }

    // 3. Update or append PurchaseFlowSteps: step 9
    const steps = await db.getTableRows(table('PurchaseFlowSteps'));
    const prevStep = steps.filter(s => s.IndentNumber === indent.IndentNumber).sort((a, b) => b.StepNumber - a.StepNumber)[0];
    const step9Idx = steps.findIndex(s => s.IndentNumber === indent.IndentNumber && String(s.NextStep) == '9');
    const step9Data = {
      IndentNumber: indent.IndentNumber,
      StepNumber: 9,
      StepId: 9,
      Action: 'Place PO',
      AssignedTo: 'Purchase Executive',
      Status: 'completed',
      NextStep: 10,
      PreviousStep: prevStep ? prevStep.StepNumber : '',
      LastModifiedBy: 'Purchase Executive',
      LastModifiedAt: new Date().toISOString(),
      POId,
    };
    if (step9Idx !== -1) {
      await updateRowByIndex('PurchaseFlowSteps', step9Idx + 2, {
        ...steps[step9Idx],
        ...step9Data
      });
    }
    return POId;
  },

  getIndentsAtStep9WithPO: async function() {
    const steps = await db.getTableRows(table('PurchaseFlowSteps'));
    const placePOs = await db.getTableRows(table('PlacePO'));
    // Find all indents at step 9
    const step9s = steps.filter(s => String(s.StepNumber) === '9' && String(s.StepId) === '9');
    // For each, get PO details from PlacePO
    return step9s.map(s => {
      const po = placePOs.find(p => p.IndentNumber === s.IndentNumber);
      return {
        IndentNumber: s.IndentNumber,
        POId: po?.POId || '',
        PODocumentId: po?.PODocumentId || '',
        VendorCode: po?.VendorCode || '',
        VendorContact: po?.VendorContact || '',
        VendorEmail: po?.VendorEmail || '',
        DeliveryTime: po?.DeliveryTime || '',
        Price: po?.Price || '',
        Quantity: po?.Quantity || '',
      };
    });
  },

  markShipmentTracked: async function(indentNumber) {
    // 1. Update PurchaseFlow: set CurrentStep to 10
    const flows = await db.getTableRows(table('PurchaseFlow'));
    const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
    if (flowIdx !== -1) {
      const rowIndex = flowIdx + 2;
      const flow = flows[flowIdx];
      await updateRowByIndex('PurchaseFlow', rowIndex, {
        ...flow,
        CurrentStep: 10,
        UpdatedAt: new Date().toISOString(),
      });
    }
    // 2. Update or append PurchaseFlowSteps: step 10
    const steps = await db.getTableRows(table('PurchaseFlowSteps'));
    const prevStep = steps.filter(s => s.IndentNumber === indentNumber).sort((a, b) => b.StepNumber - a.StepNumber)[0];
    const step10Idx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.StepNumber) === '9');
    const step10Data = {
      IndentNumber: indentNumber,
      StepNumber: 10,
      StepId: 10,
      Action: 'Follow-up for delivery',
      AssignedTo: 'Store Manager',
      Status: 'completed',
      NextStep: 11,
      PreviousStep: prevStep ? prevStep.StepNumber : '',
      LastModifiedBy: 'Store Manager',
      LastModifiedAt: new Date().toISOString(),
    };
    if (step10Idx !== -1) {
      await updateRowByIndex('PurchaseFlowSteps', step10Idx + 2, {
        ...steps[step10Idx],
        ...step10Data
      });
    } 
    return true;
  },

  getIndentsAtStep10WithPO: async function() {
    const steps = await db.getTableRows(table('PurchaseFlowSteps'));
    const placePOs = await db.getTableRows(table('PlacePO'));
    // Find all indents at step 10
    const step10s = steps.filter(s => String(s.StepNumber) === '10' && String(s.StepId) === '10');
    // For each, get PO details from PlacePO
    return step10s.map(s => {
      const po = placePOs.find(p => p.IndentNumber === s.IndentNumber);
      return {
        IndentNumber: s.IndentNumber,
        ItemName: po?.ItemName || '',
        Specifications: po?.Specifications || '',
        VendorCode: po?.VendorCode || '',
        VendorName: po?.VendorName || '',
        Price: po?.Price || '',
        DeliveryQty: po?.DeliveryQty || '',
        Quantity: po?.Quantity || '',
        PODocumentId: po?.PODocumentId || '',
      };
    });
  },

  getIndentsWithNextStep11: async function() {
    const steps = await db.getTableRows(table('PurchaseFlowSteps'));
    const placePOs = await db.getTableRows(table('PlacePO'));
    
    // Find all indents whose next step is 11 OR step 10 is completed
    const nextStep11s = steps.filter(s => String(s.NextStep) === '11');
    
    // Get indents with step 10 completed that don't already have NextStep === '11'
    const step10Completed = steps.filter(s => 
      String(s.StepNumber) === '10' && 
      String(s.StepId) === '10' && 
      s.Status === 'completed' &&
      !nextStep11s.some(indent => indent.IndentNumber === s.IndentNumber)
    );
    
    // Combine both lists
    const allIndentsForStep11 = [...nextStep11s, ...step10Completed];
    
    // Get unique indent numbers to avoid duplicates
    const uniqueIndentNumbers = [...new Set(allIndentsForStep11.map(s => s.IndentNumber))];
    
    // For each, get PO details from PlacePO
    const result = uniqueIndentNumbers.map(indentNumber => {
      const step = allIndentsForStep11.find(s => s.IndentNumber === indentNumber);
      const po = placePOs.find(p => p.IndentNumber === indentNumber);
      return {
        IndentNumber: indentNumber,
        ItemName: po?.ItemName || '',
        Specifications: po?.Specifications || '',
        VendorCode: po?.VendorCode || '',
        VendorName: po?.VendorName || '',
        Price: po?.Price || '',
        DeliveryQty: po?.DeliveryQty || '',
        Quantity: po?.Quantity || '',
        PODocumentId: po?.PODocumentId || '',
        CurrentStep: step?.StepNumber || '',
        CurrentAction: step?.Action || '',
      };
    });
    
    // Final deduplication
    const seen = new Set();
    return result.filter(item => {
      if (seen.has(item.IndentNumber)) {
        return false;
      }
      seen.add(item.IndentNumber);
      return true;
    });
  },

  markMaterialInspected: async function(indentNumber, documents = {}, userEmail = 'QC Manager', note = '') {
    // Tables managed by Supabase migrations
    
    // 1. Save documents to InspectMaterial sheet
    const placePOs = await db.getTableRows(table('PlacePO'));
    const po = placePOs.find(p => p.IndentNumber === indentNumber);
    
    await db.insertTableRow(table(config.sheets.inspectMaterial), {
      IndentNumber: indentNumber,
      ItemName: po?.ItemName || '',
      Specifications: po?.Specifications || '',
      Quantity: po?.Quantity || '',
      Price: po?.Price || '',
      VendorCode: po?.VendorCode || '',
      VendorName: po?.VendorName || '',
      VendorContact: po?.VendorContact || '',
      VendorEmail: po?.VendorEmail || '',
      DCDocumentId: documents.dcDocumentId || '',
      InvoiceDocumentId: documents.invoiceDocumentId || '',
      PODocumentId: documents.poDocumentId || '',
      InspectionDate: new Date().toISOString(),
      InspectedBy: userEmail,
      Status: 'Inspected',
      Note: note || '',
    });

    // 2. Update PurchaseFlow: set CurrentStep to 11
    const flows = await db.getTableRows(table('PurchaseFlow'));
    const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
    if (flowIdx !== -1) {
      const rowIndex = flowIdx + 2;
      const flow = flows[flowIdx];
      await updateRowByIndex('PurchaseFlow', rowIndex, {
        ...flow,
        CurrentStep: 11,
        UpdatedAt: new Date().toISOString(),
        LastModifiedBy: userEmail,
      });
    }
    // 3. Update or append PurchaseFlowSteps: step 11
    const steps = await db.getTableRows(table('PurchaseFlowSteps'));
    const prevStep = steps.filter(s => s.IndentNumber === indentNumber).sort((a, b) => b.StepNumber - a.StepNumber)[0];
    const step11Idx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.NextStep) === '11');
    const step11Data = {
      IndentNumber: indentNumber,
      StepNumber: 11,
      StepId: 11,
      Action: 'Recieve and Inspect Material',
        AssignedTo: 'QC Manager',
      Status: 'completed',
      NextStep: 12,
      PreviousStep: prevStep ? prevStep.StepNumber : '',
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString(),
      EndTime: new Date().toISOString(),
    };
    if (step11Idx !== -1) {
      await updateRowByIndex('PurchaseFlowSteps', step11Idx + 2, {
        ...steps[step11Idx],
        ...step11Data
      });
    }
    return true;
  },

  approveMaterial: async function(indentNumber, userEmail, docIds = {}) {
    // Tables managed by Supabase migrations
    
    // 1. Update PurchaseFlow: set CurrentStep to 12
    const flows = await db.getTableRows(table('PurchaseFlow'));
    const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
    if (flowIdx !== -1) {
      const rowIndex = flowIdx + 2;
      const flow = flows[flowIdx];
      await updateRowByIndex('PurchaseFlow', rowIndex, {
        ...flow,
        CurrentStep: 12,
        UpdatedAt: new Date().toISOString(),
      });
    }

    // 2. Update PurchaseFlowSteps: step 12
    const steps = await db.getTableRows(table('PurchaseFlowSteps'));
    const prevStep = steps.filter(s => s.IndentNumber === indentNumber).sort((a, b) => b.StepNumber - a.StepNumber)[0];
    const step12Idx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.StepNumber) === '11');
    const step12Data = {
      IndentNumber: indentNumber,
      StepNumber: 12,
      StepId: 12,
      Action: 'Material Approval',
      AssignedTo: 'Store Manager',
      Status: 'completed',
      NextStep: 16,
      PreviousStep: prevStep ? prevStep.StepNumber : '',
      LastModifiedBy: userEmail,
      LastModifiedAt: new Date().toISOString(),
    };
    if (step12Idx !== -1) {
      await updateRowByIndex('PurchaseFlowSteps', step12Idx + 2, {
        ...steps[step12Idx],
        ...step12Data
      });
    }

    // 3. Add entry to MaterialApproval sheet
    const placePOs = await db.getTableRows(table('PlacePO'));
    const po = placePOs.find(p => p.IndentNumber === indentNumber);
    
    await db.insertTableRow(table(config.sheets.materialApproval), {
      IndentNumber: indentNumber,
      ItemName: po?.ItemName || '',
      Specifications: po?.Specifications || '',
      Quantity: po?.Quantity || '',
      Price: po?.Price || '',
      VendorCode: po?.VendorCode || '',
      VendorName: po?.VendorName || '',
      VendorContact: po?.VendorContact || '',
      VendorEmail: po?.VendorEmail || '',
      Status: 'Approved',
      ApprovalDate: new Date().toISOString(),
      ApprovedBy: userEmail,
      RejectionNote: '',
      DCDocumentId: docIds.dcDocumentId || '',
      InvoiceDocumentId: docIds.invoiceDocumentId || '',
      PODocumentId: docIds.poDocumentId || '',
    });

    return true;
  },

  rejectMaterial: async function(indentNumber, rejectionNote, userEmail) {
    // Tables managed by Supabase migrations
    
    // 1. Update PurchaseFlow: set CurrentStep to 12
    const flows = await db.getTableRows(table('PurchaseFlow'));
    const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
    if (flowIdx !== -1) {
      const rowIndex = flowIdx + 2;
      const flow = flows[flowIdx];
      await updateRowByIndex('PurchaseFlow', rowIndex, {
        ...flow,
        CurrentStep: 12,
        UpdatedAt: new Date().toISOString(),
      });
    }

    // 2. Update PurchaseFlowSteps: step 12
    const steps = await db.getTableRows(table('PurchaseFlowSteps'));
    const prevStep = steps.filter(s => s.IndentNumber === indentNumber).sort((a, b) => b.StepNumber - a.StepNumber)[0];
    const step12Idx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.StepNumber) === '11');
    const step12Data = {
      IndentNumber: indentNumber,
      StepNumber: 12,
      StepId: 12,
      Action: 'Material Approval',
      AssignedTo: 'Purchase Executive',
      Status: 'rejected',
      NextStep: 13,
      PreviousStep: prevStep ? prevStep.StepNumber : '',
      LastModifiedBy: userEmail,
      LastModifiedAt: new Date().toISOString(),
    };
    if (step12Idx !== -1) {
      await updateRowByIndex('PurchaseFlowSteps', step12Idx + 2, {
        ...steps[step12Idx],
        ...step12Data
      });
    }

    // 3. Add entry to MaterialApproval sheet
    const placePOs = await db.getTableRows(table('PlacePO'));
    const po = placePOs.find(p => p.IndentNumber === indentNumber);
    
    await db.insertTableRow(table(config.sheets.materialApproval), {
      IndentNumber: indentNumber,
      ItemName: po?.ItemName || '',
      Specifications: po?.Specifications || '',
      Quantity: po?.Quantity || '',
      Price: po?.Price || '',
      VendorCode: po?.VendorCode || '',
      VendorName: po?.VendorName || '',
      VendorContact: po?.VendorContact || '',
      VendorEmail: po?.VendorEmail || '',
      Status: 'Rejected',
      ApprovalDate: new Date().toISOString(),
      ApprovedBy: userEmail,
      RejectionNote: rejectionNote,
    });

    return true;
  },

  async markVendorContactedDecisionOnRejection({ indentNumber }) {
    // 1. Update PurchaseFlow: set CurrentStep to 13
    const flows = await db.getTableRows(table(SHEET_NAME));
    const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
    if (flowIdx !== -1) {
      const rowIndex = flowIdx + 2;
      const flow = flows[flowIdx];
      await updateRowByIndex(SHEET_NAME, rowIndex, {
        ...flow,
        CurrentStep: 13,
        UpdatedAt: new Date().toISOString(),
      });
    }
    // 2. Update PurchaseFlowSteps: update or add step 13
    const steps = await db.getTableRows(table(STEPS_SHEET));
    let stepIdx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.StepNumber) === '12');
    if (stepIdx !== -1) {
      // Update existing step 12 to next step 13
      const rowIndex = stepIdx + 2;
      const step = steps[stepIdx];
      await updateRowByIndex(STEPS_SHEET, rowIndex, {
        ...step,
        StepNumber: 13,
        StepId: 13,
        NextStep: 14,
        PreviousStep: 12,
        Action: 'Decision on Rejection',
        AssignedTo: 'Store Manager',
        LastModifiedAt: new Date().toISOString(),
      });
    } else {
      // Add new step 13 row if not found
      await db.insertTableRow(table(STEPS_SHEET), {
        IndentNumber: indentNumber,
        StepNumber: 13,
        StepId: 13,
        NextStep: 14,
        PreviousStep: 12,
        Action: 'Decision on Rejection',
        AssignedTo: 'Store Manager',
        Status: 'in_progress',
        LastModifiedAt: new Date().toISOString(),
      });
    }
    return true;
  },

  async getIndentsAtStep13() {
    const steps = await db.getTableRows(table('PurchaseFlowSteps'));
    const materialApprovals = await db.getTableRows(table('MaterialApproval'));
    // StepNumber and StepId for 'Return Rejected Material' is 13
    const indents = steps.filter(step => String(step.StepNumber) === '13' && String(step.StepId) === '13');
    // Join with MaterialApproval for required columns
    return indents.map(indent => {
      const approval = materialApprovals.find(m => m.IndentNumber === indent.IndentNumber);
      return approval ? {
        IndentNumber: approval.IndentNumber,
        ItemName: approval.ItemName,
        Specifications: approval.Specifications,
        Quantity: approval.Quantity,
        Price: approval.Price,
        VendorCode: approval.VendorCode,
        VendorName: approval.VendorName,
        VendorContact: approval.VendorContact,
        VendorEmail: approval.VendorEmail,
        Status: approval.Status,
        RejectionNote: approval.RejectionNote
      } : null;
    }).filter(Boolean);
  },

  async submitReturnRejectedMaterial({ indent, form, docFiles }) {
    // Validate PO & item details (basic example)
    if (!indent || !form.poNumber || !form.itemName) throw new Error('Missing PO or item details');
    // Log activity in return history (simulate)
    await db.insertTableRow(table('ReturnHistory'), {
      IndentNumber: form.poNumber,
      ItemName: form.itemName,
      QuantityRejected: form.quantityRejected,
      Reason: form.reason,
      Remarks: form.remarks,
      VendorName: form.vendorName,
      DateOfReturn: form.dateOfReturn,
      ExpectedReturnDate: form.expectedReturnDate,
      TransportAgency: form.transportAgency,
      DispatchDate: form.dispatchDate,
      TrackingNumber: form.trackingNumber,
      DispatchStatus: form.dispatchStatus,
      CreatedAt: new Date().toISOString(),
    });
    // Update PurchaseFlow: set CurrentStep to 14
    const flows = await db.getTableRows(table(SHEET_NAME));
    const flowIdx = flows.findIndex(row => row.IndentNumber === form.poNumber);
    if (flowIdx !== -1) {
      const rowIndex = flowIdx + 2;
      const flow = flows[flowIdx];
      await updateRowByIndex(SHEET_NAME, rowIndex, {
        ...flow,
        CurrentStep: 14,
        UpdatedAt: new Date().toISOString(),
      });
    }
    // Update PurchaseFlowSteps: update or add step 14
    const steps = await db.getTableRows(table(STEPS_SHEET));
    let stepIdx = steps.findIndex(s => s.IndentNumber === form.poNumber && String(s.StepNumber) === '13');
    if (stepIdx !== -1) {
      const rowIndex = stepIdx + 2;
      const step = steps[stepIdx];
      await updateRowByIndex(STEPS_SHEET, rowIndex, {
        ...step,
        StepNumber: 14,
        StepId: 14,
        NextStep: 15,
        PreviousStep: 13,
        Action: 'Return Rejected Material',
        AssignedTo: 'Store Manager',
        LastModifiedAt: new Date().toISOString(),
      });
    } else {
      await db.insertTableRow(table(STEPS_SHEET), {
        IndentNumber: form.poNumber,
        StepNumber: 14,
        StepId: 14,
        NextStep: 15,
        PreviousStep: 13,
        Action: 'Return Rejected Material',
        AssignedTo: 'Store Manager',
        Status: 'in_progress',
        LastModifiedAt: new Date().toISOString(),
      });
    }
    // (Optional) Send notification to vendor or purchase team (simulate)
    // (Optional) Upload documents to Google Drive (simulate)
    return true;
  },

  async completeReturnRejectedStep(indentNumber) {
    // 1. Update PurchaseFlow: set CurrentStep to 14
    const flows = await db.getTableRows(table(SHEET_NAME));
    const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
    if (flowIdx !== -1) {
      const rowIndex = flowIdx + 2;
      const flow = flows[flowIdx];
      await updateRowByIndex(SHEET_NAME, rowIndex, {
        ...flow,
        CurrentStep: 14,
        UpdatedAt: new Date().toISOString(),
      });
    }
    // 2. Update PurchaseFlowSteps: update or add step 14
    const steps = await db.getTableRows(table(STEPS_SHEET));
    let stepIdx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.StepNumber) === '13');
    if (stepIdx !== -1) {
      const rowIndex = stepIdx + 2;
      const step = steps[stepIdx];
      await updateRowByIndex(STEPS_SHEET, rowIndex, {
        ...step,
        StepNumber: 14,
        StepId: 14,
        NextStep: 15,
        PreviousStep: 13,
        Action: 'Return Rejected Material',
        AssignedTo: 'Purchase Executive',
        LastModifiedAt: new Date().toISOString(),
      });
    } else {
      await db.insertTableRow(table(STEPS_SHEET), {
        IndentNumber: indentNumber,
        StepNumber: 14,
        StepId: 14,
        NextStep: 15,
        PreviousStep: 13,
        Action: 'Return Rejected Material',
        AssignedTo: 'Purchase Executive',
        Status: 'in_progress',
        LastModifiedAt: new Date().toISOString(),
      });
    }
    return true;
  },

  async getIndentsAtStep14() {
    const steps = await db.getTableRows(table('PurchaseFlowSteps'));
    const materialApprovals = await db.getTableRows(table('MaterialApproval'));
    // StepNumber and StepId for 'Resend Material' is 14
    const indents = steps.filter(step => String(step.StepNumber) === '14' && String(step.StepId) === '14');
    // Join with MaterialApproval for required columns
    return indents.map(indent => {
      const approval = materialApprovals.find(m => m.IndentNumber === indent.IndentNumber);
      return approval ? {
        IndentNumber: approval.IndentNumber,
        ItemName: approval.ItemName,
        Specifications: approval.Specifications,
        Quantity: approval.Quantity,
        Price: approval.Price,
        VendorCode: approval.VendorCode,
        VendorName: approval.VendorName,
        VendorContact: approval.VendorContact,
        VendorEmail: approval.VendorEmail,
        Status: approval.Status,
        RejectionNote: approval.RejectionNote
      } : null;
    }).filter(Boolean);
  },

  async completeResendMaterialStep(indentNumber) {
    // 1. Update PurchaseFlow: set CurrentStep to 15
    const flows = await db.getTableRows(table(SHEET_NAME));
    const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
    if (flowIdx !== -1) {
      const rowIndex = flowIdx + 2;
      const flow = flows[flowIdx];
      await updateRowByIndex(SHEET_NAME, rowIndex, {
        ...flow,
        CurrentStep: 15,
        UpdatedAt: new Date().toISOString(),
      });
    }
    // 2. Update PurchaseFlowSteps: update or add step 15
    const steps = await db.getTableRows(table(STEPS_SHEET));
    let stepIdx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.StepNumber) === '14');
    if (stepIdx !== -1) {
      const rowIndex = stepIdx + 2;
      const step = steps[stepIdx];
      await updateRowByIndex(STEPS_SHEET, rowIndex, {
        ...step,
        StepNumber: 15,
        StepId: 15,
        NextStep: 11,
        PreviousStep: 14,
        Action: 'Resend Material',
        AssignedTo: 'Store Manager',
        LastModifiedAt: new Date().toISOString(),
      });
    } else {
      await db.insertTableRow(table(STEPS_SHEET), {
        IndentNumber: indentNumber,
        StepNumber: 15,
        StepId: 15,
        NextStep: 11,
        PreviousStep: 14,
        Action: 'Resend Material',
        AssignedTo: 'Store Manager',
        Status: 'in_progress',
        LastModifiedAt: new Date().toISOString(),
      });
    }
    return true;
  },

  // Get all indents ready for GRN generation (next step 16)
  async getIndentsForGRNGeneration() {
    const steps = await db.getTableRows(table(STEPS_SHEET));
    const inspectMaterials = await db.getTableRows(table(config.sheets.inspectMaterial));
    const vendors = await db.getTableRows(table('Vendor'));
    const placePOs = await db.getTableRows(table('PlacePO'));
    
    // Find indents that have completed step 12 (material approval) with NextStep: 16
    // These are indents that are ready for GRN generation
    const completedStep12WithNextStep16 = steps.filter(step => 
      String(step.StepNumber) === '12' && 
      String(step.StepId) === '12' && 
      step.Status === 'completed' &&
      String(step.NextStep) === '16'
    );
    
    // Get all indent numbers that are ready for GRN
    const indentsForGRN = completedStep12WithNextStep16.map(step => step.IndentNumber);
    // Get inspection details for each indent
    return indentsForGRN.map(indentNumber => {
      const inspection = inspectMaterials.find(im => im.IndentNumber === indentNumber);
      const po = placePOs.find(p => p.IndentNumber === indentNumber);
      const vendor = vendors.find(v => v['Vendor Code'] === (inspection?.VendorCode || po?.VendorCode));
      
      // Find step 11 (material inspection) data for inspection details
      const step11 = steps.find(step => 
        step.IndentNumber === indentNumber && 
        String(step.StepNumber) === '11' && 
        String(step.StepId) === '11'
      );
      
      // Use inspection data if available, otherwise fall back to PO data
      const itemData = inspection || po;
      
      // Get inspection details from step 11 or inspection sheet
      const inspectionDate = inspection?.InspectionDate || step11?.LastModifiedAt || step11?.EndTime || new Date().toISOString();
      const inspectedBy = inspection?.InspectedBy || step11?.LastModifiedBy || 'QC Manager';
      
      return {
        IndentNumber: indentNumber,
        ItemName: itemData?.ItemName || '',
        Specifications: itemData?.Specifications || '',
        Quantity: itemData?.Quantity || '',
        Price: itemData?.Price || '',
        VendorCode: itemData?.VendorCode || '',
        VendorName: itemData?.VendorName || vendor?.['Vendor Name'] || '',
        VendorContact: itemData?.VendorContact || vendor?.['Vendor Contact'] || '',
        VendorEmail: itemData?.VendorEmail || vendor?.['Vendor Email'] || '',
        DCDocumentId: inspection?.DCDocumentId || '',
        InvoiceDocumentId: inspection?.InvoiceDocumentId || '',
        PODocumentId: inspection?.PODocumentId || po?.PODocumentId || '',
        InspectionDate: inspectionDate,
        InspectedBy: inspectedBy,
        Status: inspection?.Status || 'Approved',
        // Additional vendor details
        VendorAddress: vendor?.Address || '',
        VendorGSTIN: vendor?.GSTIN || '',
        VendorPAN: vendor?.['PAN No.'] || '',
      };
    });
  },

  // Generate GRN for an indent
  async generateGRN(indentNumber, userEmail) {
    try {
      // Tables managed by Supabase migrations
      // Get inspection details
      const inspectMaterials = await db.getTableRows(table(config.sheets.inspectMaterial));
      let inspection = inspectMaterials.find(im => im.IndentNumber === indentNumber);
      if (!inspection) {
        // Try to get data from PlacePO as fallback
        const placePOs = await db.getTableRows(table('PlacePO'));
        const po = placePOs.find(p => p.IndentNumber === indentNumber);
        if (!po) {
          throw new Error('No inspection or PO data found for this indent');
        }
        
        // Create a mock inspection object from PO data
        inspection = {
          IndentNumber: indentNumber,
          ItemName: po.ItemName || '',
          Specifications: po.Specifications || '',
          Quantity: po.Quantity || '',
          Price: po.Price || '',
          VendorCode: po.VendorCode || '',
          VendorName: po.VendorName || '',
          VendorContact: po.VendorContact || '',
          VendorEmail: po.VendorEmail || '',
          DCDocumentId: '',
          InvoiceDocumentId: '',
          PODocumentId: po.PODocumentId || '',
          InspectionDate: new Date().toISOString(),
          InspectedBy: userEmail,
          Status: 'Approved',
        };
      }
      
      // Get vendor details
      const vendors = await db.getTableRows(table('Vendor'));
      const vendor = vendors.find(v => v['Vendor Code'] === inspection.VendorCode);
      // Generate GRN ID: GRN + 5 digits (incremental)
      const existingGRNs = await db.getTableRows(table(config.sheets.generateGrn));
      let maxNum = 0;
      for (const row of existingGRNs) {
        if (row.GRNId && /^GRN\d{5}$/.test(row.GRNId)) {
          const num = parseInt(row.GRNId.slice(3), 10);
          if (num > maxNum) maxNum = num;
        }
      }
      const nextNum = (maxNum + 1).toString().padStart(5, '0');
      const GRNId = `GRN${nextNum}`;
      // Generate PDF content
      const pdfContent = purchaseFlowService.generateGRNPDFContent({
        GRNId,
        inspection,
        vendor,
        companyDetails: {
          name: 'REYANSH ELECTRONICS PRIVATE LIMITED',
          address: 'J-61 Sector-63, Noida',
          city: 'Uttar Pradesh - 201301',
          phone: '+91-9818079750',
          email: 'REYANSHINTERNATIONAL63@GMAIL.COM',
          website: 'www.reyanshelectronics.com',
          gstin: '09AAECR0689R1ZH',
          pan: 'AAECR0689R'
        }
      });
      // For now, we'll create a simple text file as PDF (in production, use a proper PDF library)
      const pdfBlob = new Blob([pdfContent], { type: 'text/plain' });
      const pdfFile = new File([pdfBlob], `${GRNId}.txt`, { type: 'text/plain' });
      const uploadPath = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}_${pdfFile.name}`;
      const { data: upData, error: upErr } = await supabase.storage.from('documents').upload(uploadPath, pdfFile, { upsert: false });
      if (upErr) throw upErr;
      const grnDocumentId = upData?.path || uploadPath;
      // Save to GenerateGRN sheet
      const grnData = {
        GRNId,
        IndentNumber: inspection.IndentNumber,
        ItemName: inspection.ItemName,
        Specifications: inspection.Specifications,
        Quantity: inspection.Quantity,
        Price: inspection.Price,
        VendorCode: inspection.VendorCode,
        VendorName: inspection.VendorName,
        VendorContact: inspection.VendorContact,
        VendorEmail: inspection.VendorEmail,
        DCDocumentId: inspection.DCDocumentId,
        InvoiceDocumentId: inspection.InvoiceDocumentId,
        PODocumentId: inspection.PODocumentId,
        InspectionDate: inspection.InspectionDate,
        InspectedBy: inspection.InspectedBy,
        GRNDate: new Date().toISOString(),
        GeneratedBy: userEmail,
        GRNDocumentId: grnDocumentId,
        Status: 'Generated',
      };
      await db.insertTableRow(table(config.sheets.generateGrn), grnData);
      
      // Update PurchaseFlow: set CurrentStep to 16
      const flows = await db.getTableRows(table(SHEET_NAME));
      const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
      if (flowIdx !== -1) {
        const rowIndex = flowIdx + 2;
        const flow = flows[flowIdx];
        await updateRowByIndex(SHEET_NAME, rowIndex, {
          ...flow,
          CurrentStep: 16,
          UpdatedAt: new Date().toISOString(),
          LastModifiedBy: userEmail,
        });
      }
      
      // Update PurchaseFlowSteps: update or add step 16
      const steps = await db.getTableRows(table(STEPS_SHEET));
      const prevStep = steps.filter(s => s.IndentNumber === indentNumber).sort((a, b) => b.StepNumber - a.StepNumber)[0];
      const step16Idx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.NextStep) === '16');
      
      const step16Data = {
        IndentNumber: indentNumber,
        StepNumber: 16,
        StepId: 16,
        Action: 'Generate GRN',
        AssignedTo: 'Purchase Executive',
        Status: 'completed',
        NextStep: 17,
        PreviousStep:12,
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString(),
      };
      
      if (step16Idx !== -1) {
        // Update existing step 16
        await updateRowByIndex(STEPS_SHEET, step16Idx + 2, {
          ...steps[step16Idx],
          ...step16Data
        });
      } else {
        // Append new step 16 row
        await db.insertTableRow(table(STEPS_SHEET), step16Data);
      }
      return { GRNId, grnDocumentId };
    } catch (error) {
      console.error('Error generating GRN:', error);
      throw new Error(`Failed to generate GRN: ${error.message}`);
    }
  },

  // Generate GRN PDF content
  generateGRNPDFContent({ GRNId, inspection, vendor, companyDetails }) {
    const currentDate = new Date().toLocaleDateString('en-IN');
    
    return `
================================================================================
                           GOODS RECEIPT NOTE (GRN)
================================================================================

GRN Number: ${GRNId}                                    Date: ${currentDate}

================================================================================
COMPANY DETAILS:
${companyDetails.name}
${companyDetails.address}
${companyDetails.city}
Phone: ${companyDetails.phone}
Email: ${companyDetails.email}
Website: ${companyDetails.website}
GSTIN: ${companyDetails.gstin}
PAN: ${companyDetails.pan}

================================================================================
VENDOR DETAILS:
Name: ${vendor?.['Vendor Name'] || inspection.VendorName}
Code: ${inspection.VendorCode}
Contact: ${vendor?.['Vendor Contact'] || inspection.VendorContact}
Email: ${vendor?.['Vendor Email'] || inspection.VendorEmail}
Address: ${vendor?.Address || 'N/A'}
GSTIN: ${vendor?.GSTIN || 'N/A'}
PAN: ${vendor?.['PAN No.'] || 'N/A'}

================================================================================
MATERIAL DETAILS:
Indent Number: ${inspection.IndentNumber}
Item Name: ${inspection.ItemName}
Specifications: ${inspection.Specifications}
Quantity: ${inspection.Quantity}
Price: ₹${inspection.Price}
Total Value: ₹${(parseFloat(inspection.Quantity) * parseFloat(inspection.Price)).toFixed(2)}

================================================================================
INSPECTION DETAILS:
Inspection Date: ${new Date(inspection.InspectionDate).toLocaleDateString('en-IN')}
Inspected By: ${inspection.InspectedBy}
Status: ${inspection.Status}

================================================================================
DOCUMENTS:
DC Document: ${inspection.DCDocumentId ? 'Available' : 'Not Available'}
Invoice Document: ${inspection.InvoiceDocumentId ? 'Available' : 'Not Available'}
PO Document: ${inspection.PODocumentId ? 'Available' : 'Not Available'}

================================================================================
AUTHORIZATION:
Generated By: Purchase Executive
Generated Date: ${currentDate}
GRN Status: Generated

================================================================================
NOTES:
- This GRN confirms receipt of goods as per the above details
- All documents have been verified and materials inspected
- Goods are accepted in good condition
- This document serves as proof of receipt for accounting purposes

================================================================================
    `;
  },

  // Get all generated GRNs
  async getGeneratedGRNs() {
    try {
      const generatedGRNs = await db.getTableRows(table(config.sheets.generateGrn));
      return generatedGRNs.filter(grn => grn.GRNId && grn.Status === 'Generated');
    } catch (error) {
      console.error('Error fetching generated GRNs:', error);
      throw new Error(`Failed to fetch generated GRNs: ${error.message}`);
    }
  },

  async getGRNContentById(grnId) {
    // Fetch the GRN row by ID
    const grns = await db.getTableRows(table(config.sheets.generateGrn));
    const grn = grns.find(g => g.GRNId === grnId);
    if (!grn) throw new Error('GRN not found');

    // Fetch inspection details
    const inspections = await db.getTableRows(table(config.sheets.inspectMaterial));
    const inspection = inspections.find(im => im.IndentNumber === grn.IndentNumber) || grn;

    // Fetch vendor details
    const vendors = await db.getTableRows(table('Vendor'));
    const vendor = vendors.find(v => v['Vendor Code'] === (inspection.VendorCode || grn.VendorCode));

    // Company details (hardcoded as in generateGRN)
    const companyDetails = {
      name: 'REYANSH ELECTRONICS PRIVATE LIMITED',
      address: 'J-61 Sector-63, Noida',
      city: 'Uttar Pradesh - 201301',
      phone: '+91-9818079750',
      email: 'REYANSHINTERNATIONAL63@GMAIL.COM',
      website: 'www.reyanshelectronics.com',
      gstin: '09AAECR0689R1ZH',
      pan: 'AAECR0689R'
    };

    // Use the same PDF content generator
    return this.generateGRNPDFContent({
      GRNId: grn.GRNId,
      inspection,
      vendor,
      companyDetails
    });
  },

  // Get all indents ready for vendor sorting (next step 9)
  async getIndentsForVendorSorting() {
    try {
      // Get indents where next step is 9 OR step 8 is completed
      const stepData = await db.getTableRows(table('PurchaseFlowSteps'));
      
      // First, get indents with NextStep === '9'
      const indentsWithNextStep9 = stepData.filter(row => String(row.NextStep) === '9');
      
      // Then, get indents with step 8 completed that don't already have NextStep === '9'
      const step8Completed = stepData.filter(row => 
        String(row.StepNumber) === '8' && 
        String(row.StepId) === '8' && 
        row.Status === 'completed' &&
        !indentsWithNextStep9.some(indent => indent.IndentNumber === row.IndentNumber)
      );
      
      // Combine both lists
      const indentsForStep9 = [...indentsWithNextStep9, ...step8Completed];
      
      // Get unique indent numbers to avoid duplicates
      const uniqueIndentNumbers = [...new Set(indentsForStep9.map(row => row.IndentNumber))];
      
      // Get indent details from PurchaseFlow sheet
      const purchaseFlowData = await db.getTableRows(table('PurchaseFlow'));
      const indentsWithDetails = uniqueIndentNumbers.map(indentNumber => {
        const step = indentsForStep9.find(row => row.IndentNumber === indentNumber);
        // Get the first matching indent detail (in case there are duplicates in PurchaseFlow)
        const indentDetail = purchaseFlowData.find(row => row.IndentNumber === indentNumber);
        return {
          ...step,
          ...indentDetail,
          IndentNumber: indentNumber
        };
      }).filter(indent => indent.IndentNumber); // Filter out any undefined entries
      // Get approved quotation data
      const approvedQuotationData = await db.getTableRows(table('SheetApproveQuotation'));
      // Get vendor data
      const vendorData = await db.getTableRows(table('Vendor'));
      const result = indentsWithDetails.map(indent => {
        // Find approved quotation for this indent
        const approvedQuotation = approvedQuotationData.find(row => row.IndentNumber === indent.IndentNumber);
        
        let itemsWithApprovedVendors = [];
        
        if (approvedQuotation && approvedQuotation.ApprovedQuotation) {
          try {
            // Parse approved quotation data
            const approvedData = typeof approvedQuotation.ApprovedQuotation === 'string' 
              ? JSON.parse(approvedQuotation.ApprovedQuotation) 
              : approvedQuotation.ApprovedQuotation;
            // Get original items data from the indent
            let originalItems = [];
            if (indent.Items) {
              try {
                originalItems = typeof indent.Items === 'string' 
                  ? JSON.parse(indent.Items) 
                  : indent.Items;
              } catch (e) {
                console.error('Error parsing original items:', e);
              }
            }
            
            // Convert approved data to items with approved vendors
            itemsWithApprovedVendors = Object.entries(approvedData).map(([itemCode, itemData]) => {
              // Find original item data
              const originalItem = originalItems.find(item => item.itemCode === itemCode);
              
              // Find vendor details
              const vendorDetails = vendorData.find(v => v['Vendor Code'] === itemData.selectedVendor.vendorCode);
              
              return {
                itemCode: itemCode,
                item: originalItem?.item || originalItem?.itemName || itemCode,
                itemName: originalItem?.item || originalItem?.itemName || itemCode,
                quantity: originalItem?.quantity || '',
                specifications: originalItem?.specifications || '',
                approvedVendor: {
                  vendorCode: itemData.selectedVendor.vendorCode,
                  vendorName: itemData.selectedVendor.vendorName || vendorDetails?.['Vendor Name'] || itemData.selectedVendor.vendorCode,
                  vendorContact: vendorDetails?.['Vendor Contact'] || '',
                  vendorEmail: vendorDetails?.['Vendor Email'] || '',
                  vendorAddress: vendorDetails?.Address || '',
                  vendorGSTIN: vendorDetails?.GSTIN || '',
                  vendorPAN: vendorDetails?.['PAN No.'] || '',
                  price: itemData.selectedVendor.price,
                  deliveryTime: itemData.selectedVendor.deliveryTime,
                  terms: itemData.selectedVendor.terms,
                  leadTime: itemData.selectedVendor.leadTime,
                  best: itemData.selectedVendor.best,
                  quotationDocument: itemData.selectedVendor.quotationDocument
                },
                sampleRequired: itemData.sampleRequired || false,
                indentNumber: indent.IndentNumber
              };
            });
          } catch (error) {
            console.error('Error parsing approved quotation data for indent', indent.IndentNumber, ':', error);
          }
        } else {
        }
        
        return {
          ...indent,
          IndentNumber: indent.IndentNumber,
          Items: itemsWithApprovedVendors
        };
      });
      
      // Filter out duplicates by IndentNumber (in case there are multiple entries)
      const seen = new Set();
      const uniqueResults = result.filter(indent => {
        if (seen.has(indent.IndentNumber)) {
          return false;
        }
        seen.add(indent.IndentNumber);
        return true;
      });
      
      return uniqueResults;
      
    } catch (error) {
      console.error('Error fetching indents for vendor sorting:', error);
      throw error;
    }
  },

  // Group items by vendor for PO generation
  async groupItemsByVendor() {
    try {
      const indentsData = await this.getIndentsForVendorSorting();
      
      // Flatten all items from all indents
      const allItems = indentsData.flatMap(indent => indent.Items || []);
      
      // Group items by vendor
      const vendorGroups = {};
      
      allItems.forEach(item => {
        const vendorCode = item.approvedVendor.vendorCode;
        
        if (!vendorGroups[vendorCode]) {
          vendorGroups[vendorCode] = {
            vendorDetails: {
              vendorCode: item.approvedVendor.vendorCode,
              vendorName: item.approvedVendor.vendorName,
              vendorContact: item.approvedVendor.vendorContact,
              vendorEmail: item.approvedVendor.vendorEmail,
              vendorAddress: item.approvedVendor.vendorAddress,
              vendorGSTIN: item.approvedVendor.vendorGSTIN,
              vendorPAN: item.approvedVendor.vendorPAN
            },
            items: []
          };
        }
        
        vendorGroups[vendorCode].items.push({
          itemCode: item.itemCode,
          itemName: item.itemName,
          quantity: item.quantity,
          specifications: item.specifications,
          price: item.approvedVendor.price,
          deliveryTime: item.approvedVendor.deliveryTime,
          terms: item.approvedVendor.terms,
          leadTime: item.approvedVendor.leadTime,
          indentNumber: item.indentNumber
        });
      });
      
      // Generate PO IDs for each vendor group
      const result = Object.keys(vendorGroups).map(vendorCode => {
        const poId = this.generatePOId();
        return {
          poId,
          vendorCode,
          ...vendorGroups[vendorCode]
        };
      });
      return result;
      
    } catch (error) {
      console.error('Error grouping items by vendor:', error);
      throw error;
    }
  },

  // Generate PO ID (PO + 4 digits)
  generatePOId() {
    const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PO${randomDigits}`;
  },

  // Save vendor group to SortVendor sheet
  async saveVendorGroupToSortVendor({ poId, vendorDetails, items, userEmail }) {
    try {
      // Remove sampleRequired from items before saving
      const itemsWithoutSample = items.map(item => {
        const { sampleRequired, ...itemWithoutSample } = item;
        return itemWithoutSample;
      });
      
      const rowData = {
        POId: poId,
        VendorDetails: JSON.stringify(vendorDetails),
        Items: JSON.stringify(itemsWithoutSample),
        StepId: 9,
        NextStep: 10,
        CreatedBy: userEmail,
        CreatedAt: new Date().toISOString(),
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString(),
        Status: 'Pending'
      };
      
      await db.insertTableRow(table(config.sheets.sortVendor), rowData);
      
      // Update PurchaseFlow sheet for all indents in this vendor group
      const indentNumbers = [...new Set(items.map(item => item.indentNumber))];
      const flows = await db.getTableRows(table(SHEET_NAME));
      const updates = [];
      
      for (const indentNumber of indentNumbers) {
        const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
        if (flowIdx !== -1) {
          const rowIndex = flowIdx + 2;
          const flow = flows[flowIdx];
          let stepsArr = [];
          try { stepsArr = flow.Steps ? JSON.parse(flow.Steps) : []; } catch { stepsArr = []; }
          
          const timestamp = new Date().toISOString();
          const step9Obj = {
            StepId: 9,
            StepNumber: 9,
            Role: 'Purchase Executive',
            Action: 'Sort Vendors',
            Status: 'completed',
            AssignedTo: 'Purchase Executive',
            StartTime: stepsArr.length > 0 ? stepsArr[stepsArr.length-1].EndTime || timestamp : timestamp,
            EndTime: timestamp,
            TAT: '1',
            TATStatus: 'On Time',
            ApprovalStatus: 'Approved',
            RejectionReason: '',
            NextStep: 10,
            PreviousStep: 8,
            Dependencies: '',
            LastModifiedBy: userEmail,
            LastModifiedAt: timestamp,
          };
          
          if (stepsArr.length > 0) {
            stepsArr[stepsArr.length - 1] = step9Obj;
          } else {
            stepsArr.push(step9Obj);
          }
          
          updates.push(updateRowByIndex(SHEET_NAME, rowIndex, {
            ...flow,
            CurrentStep: 9,
            Steps: JSON.stringify(stepsArr),
            UpdatedAt: timestamp,
            LastModifiedBy: userEmail,
          }));
        }
      }
      
      // Update PurchaseFlowSteps sheet for all indents in this vendor group
      const steps = await db.getTableRows(table(STEPS_SHEET));
      const stepUpdates = [];
      
      for (const indentNumber of indentNumbers) {
        const stepIdx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.NextStep) === '9');
        if (stepIdx !== -1) {
          const rowIndex = stepIdx + 2;
          const step = steps[stepIdx];
          let stepsArr2 = [];
          try { stepsArr2 = step.Steps ? JSON.parse(step.Steps) : []; } catch { stepsArr2 = []; }
          
          const timestamp = new Date().toISOString();
          const step9Obj2 = {
            StepId: 9,
            StepNumber: 9,
            Role: 'Purchase Executive',
            Action: 'Sort Vendors',
            Status: 'completed',
            AssignedTo: 'Purchase Executive',
            StartTime: stepsArr2.length > 0 ? stepsArr2[stepsArr2.length-1].EndTime || timestamp : timestamp,
            EndTime: timestamp,
            TAT: '1',
            TATStatus: 'On Time',
            ApprovalStatus: 'Approved',
            RejectionReason: '',
            NextStep: 10,
            PreviousStep: 8,
            Dependencies: '',
            LastModifiedBy: userEmail,
            LastModifiedAt: timestamp,
          };
          
          if (stepsArr2.length > 0) {
            stepsArr2[stepsArr2.length - 1] = step9Obj2;
          } else {
            stepsArr2.push(step9Obj2);
          }
          
          stepUpdates.push(updateRowByIndex(STEPS_SHEET, rowIndex, {
            ...step,
            StepNumber: 9,
            StepId: 9,
            NextStep: 10,
            PreviousStep: 8,
            AssignedTo: 'Purchase Executive',
            Action: 'Sort Vendors',
            Status: 'completed',
            Steps: JSON.stringify(stepsArr2),
            LastModifiedBy: userEmail,
            LastModifiedAt: timestamp,
          }));
        }
      }
      
      // Execute all updates
      await Promise.all([...updates, ...stepUpdates]);
      return { success: true, poId };
      
    } catch (error) {
      console.error('Error saving vendor group to SortVendor sheet:', error);
      throw error;
    }
  },

  // Initialize SortVendor sheet with headers
  async initializeSortVendorSheet() {
    try {
      // First, ensure all sheets are initialized (this will create SortVendor if it doesn't exist)
      // Tables managed by Supabase migrations
      
      return true;
      
    } catch (error) {
      console.error('Error initializing SortVendor sheet:', error);
      throw error;
    }
  },

  // Get all indents ready for invoice submission (next step 17)
  async getIndentsForInvoiceSubmission() {
    const steps = await db.getTableRows(table(STEPS_SHEET));
    const inspectMaterials = await db.getTableRows(table(config.sheets.inspectMaterial));
    const generatedGRNs = await db.getTableRows(table(config.sheets.generateGrn));
    const vendors = await db.getTableRows(table('Vendor'));
    
    // Find indents that have completed step 18 (Final GRN) with NextStep: 19
    const completedStep18WithNextStep19 = steps.filter(step => 
      String(step.StepNumber) === '18' && 
      String(step.StepId) === '18' && 
      step.Status === 'completed' &&
      String(step.NextStep) === '19'
    );
    
    // Get all indent numbers that are ready for invoice submission
    const indentsForInvoice = completedStep18WithNextStep19.map(step => step.IndentNumber);
    // Get inspection and GRN details for each indent
    return indentsForInvoice.map(indentNumber => {
      const inspection = inspectMaterials.find(im => im.IndentNumber === indentNumber);
      const grn = generatedGRNs.find(g => g.IndentNumber === indentNumber);
      const vendor = vendors.find(v => v['Vendor Code'] === (inspection?.VendorCode || grn?.VendorCode));
      
      // Use inspection data if available, otherwise fall back to GRN data
      const itemData = inspection || grn;
      
      return {
        IndentNumber: indentNumber,
        ItemName: itemData?.ItemName || '',
        Specifications: itemData?.Specifications || '',
        Quantity: itemData?.Quantity || '',
        Price: itemData?.Price || '',
        VendorCode: itemData?.VendorCode || '',
        VendorName: itemData?.VendorName || vendor?.['Vendor Name'] || '',
        VendorContact: itemData?.VendorContact || vendor?.['Vendor Contact'] || '',
        VendorEmail: itemData?.VendorEmail || vendor?.['Vendor Email'] || '',
        DCDocumentId: inspection?.DCDocumentId || '',
        InvoiceDocumentId: inspection?.InvoiceDocumentId || '',
        PODocumentId: inspection?.PODocumentId || grn?.PODocumentId || '',
        GRNId: grn?.GRNId || '',
        GRNDate: grn?.GRNDate || '',
        Status: grn?.Status || 'Generated',
      };
    });
  },

  // Submit invoice for an indent
  async submitInvoice(indentNumber, userEmail) {
    try {
      // Tables managed by Supabase migrations
      // Update PurchaseFlow: set CurrentStep to 19
      const flows = await db.getTableRows(table(SHEET_NAME));
      const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
      if (flowIdx !== -1) {
        const rowIndex = flowIdx + 2;
        const flow = flows[flowIdx];
        await updateRowByIndex(SHEET_NAME, rowIndex, {
          ...flow,
          CurrentStep: 19,
          UpdatedAt: new Date().toISOString(),
          LastModifiedBy: userEmail,
        });
      }
      
      // Update PurchaseFlowSteps: update or add step 19
      const steps = await db.getTableRows(table(STEPS_SHEET));
      const prevStep = steps.filter(s => s.IndentNumber === indentNumber).sort((a, b) => b.StepNumber - a.StepNumber)[0];
      const step19Idx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.NextStep) === '19');
      
      const step19Data = {
        IndentNumber: indentNumber,
        StepNumber: 19,
        StepId: 19,
        Action: 'Submit Invoice to Accounts',
        AssignedTo: 'Purchase Executive',
        Status: 'completed',
        NextStep: 20,
        PreviousStep: 18,
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString(),
      };
      
      if (step19Idx !== -1) {
        // Update existing step 19
        await updateRowByIndex(STEPS_SHEET, step19Idx + 2, {
          ...steps[step19Idx],
          ...step19Data
        });
      } else {
        // Append new step 19 row
        await db.insertTableRow(table(STEPS_SHEET), step19Data);
      }
      return true;
    } catch (error) {
      console.error('Error submitting invoice:', error);
      throw new Error(`Failed to submit invoice: ${error.message}`);
    }
  },

  // Get all indents ready for payment scheduling (next step 20)
  async getIndentsForPaymentScheduling() {
    const steps = await db.getTableRows(table(STEPS_SHEET));
    const inspectMaterials = await db.getTableRows(table(config.sheets.inspectMaterial));
    const generatedGRNs = await db.getTableRows(table(config.sheets.generateGrn));
    const vendors = await db.getTableRows(table('Vendor'));
    
    // Find indents that have completed step 19 (invoice submission) with NextStep: 20
    const completedStep19WithNextStep20 = steps.filter(step => 
      String(step.StepNumber) === '19' && 
      String(step.StepId) === '19' && 
      step.Status === 'completed' &&
      String(step.NextStep) === '20'
    );
    
    // Get all indent numbers that are ready for payment scheduling
    const indentsForPayment = completedStep19WithNextStep20.map(step => step.IndentNumber);
    // Get inspection and GRN details for each indent
    return indentsForPayment.map(indentNumber => {
      const inspection = inspectMaterials.find(im => im.IndentNumber === indentNumber);
      const grn = generatedGRNs.find(g => g.IndentNumber === indentNumber);
      const vendor = vendors.find(v => v['Vendor Code'] === (inspection?.VendorCode || grn?.VendorCode));
      
      // Use inspection data if available, otherwise fall back to GRN data
      const itemData = inspection || grn;
      
      return {
        IndentNumber: indentNumber,
        ItemName: itemData?.ItemName || '',
        Specifications: itemData?.Specifications || '',
        Quantity: itemData?.Quantity || '',
        Price: itemData?.Price || '',
        VendorCode: itemData?.VendorCode || '',
        VendorName: itemData?.VendorName || vendor?.['Vendor Name'] || '',
        VendorContact: itemData?.VendorContact || vendor?.['Vendor Contact'] || '',
        VendorEmail: itemData?.VendorEmail || vendor?.['Vendor Email'] || '',
        DCDocumentId: inspection?.DCDocumentId || '',
        InvoiceDocumentId: inspection?.InvoiceDocumentId || '',
        PODocumentId: inspection?.PODocumentId || grn?.PODocumentId || '',
        GRNId: grn?.GRNId || '',
        GRNDate: grn?.GRNDate || '',
        Status: grn?.Status || 'Generated',
      };
    });
  },

  // Schedule payment for an indent
  async schedulePayment(indentNumber, paymentDate, userEmail) {
    try {
      // Tables managed by Supabase migrations
      // Get inspection and GRN details
      const inspectMaterials = await db.getTableRows(table(config.sheets.inspectMaterial));
      const generatedGRNs = await db.getTableRows(table(config.sheets.generateGrn));
      const vendors = await db.getTableRows(table('Vendor'));
      
      const inspection = inspectMaterials.find(im => im.IndentNumber === indentNumber);
      const grn = generatedGRNs.find(g => g.IndentNumber === indentNumber);
      const vendor = vendors.find(v => v['Vendor Code'] === (inspection?.VendorCode || grn?.VendorCode));
      
      // Use inspection data if available, otherwise fall back to GRN data
      const itemData = inspection || grn;
      
      // Save to SchedulePayment sheet
      const paymentData = {
        IndentNumber: indentNumber,
        ItemName: itemData?.ItemName || '',
        Specifications: itemData?.Specifications || '',
        Quantity: itemData?.Quantity || '',
        Price: itemData?.Price || '',
        VendorCode: itemData?.VendorCode || '',
        VendorName: itemData?.VendorName || vendor?.['Vendor Name'] || '',
        VendorContact: itemData?.VendorContact || vendor?.['Vendor Contact'] || '',
        VendorEmail: itemData?.VendorEmail || vendor?.['Vendor Email'] || '',
        DCDocumentId: inspection?.DCDocumentId || '',
        InvoiceDocumentId: inspection?.InvoiceDocumentId || '',
        PODocumentId: inspection?.PODocumentId || grn?.PODocumentId || '',
        GRNId: grn?.GRNId || '',
        GRNDate: grn?.GRNDate || '',
        PaymentDate: paymentDate,
        ScheduledBy: userEmail,
        ScheduledAt: new Date().toISOString(),
        Status: 'Scheduled',
      };
      await db.insertTableRow(table(config.sheets.schedulePayment), paymentData);
      
      // Update PurchaseFlow: set CurrentStep to 20
      const flows = await db.getTableRows(table(SHEET_NAME));
      const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
      if (flowIdx !== -1) {
        const rowIndex = flowIdx + 2;
        const flow = flows[flowIdx];
        await updateRowByIndex(SHEET_NAME, rowIndex, {
          ...flow,
          CurrentStep: 20,
          UpdatedAt: new Date().toISOString(),
          LastModifiedBy: userEmail,
        });
      }
      
      // Update PurchaseFlowSteps: update or add step 20
      const steps = await db.getTableRows(table(STEPS_SHEET));
      const prevStep = steps.filter(s => s.IndentNumber === indentNumber).sort((a, b) => b.StepNumber - a.StepNumber)[0];
      const step20Idx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.NextStep) === '20');
      
      const step20Data = {
        IndentNumber: indentNumber,
        StepNumber: 20,
        StepId: 20,
        Action: 'Schedule Payment',
        AssignedTo: 'Accounts Executive',
        Status: 'completed',
        NextStep: 21,
        PreviousStep: 19,
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString(),
      };
      
      if (step20Idx !== -1) {
        // Update existing step 20
        await updateRowByIndex(STEPS_SHEET, step20Idx + 2, {
          ...steps[step20Idx],
          ...step20Data
        });
      } else {
        // Append new step 20 row
        await db.insertTableRow(table(STEPS_SHEET), step20Data);
      }
      return true;
    } catch (error) {
      console.error('Error scheduling payment:', error);
      throw new Error(`Failed to schedule payment: ${error.message}`);
    }
  },

  // Get all indents ready for payment release (next step 21)
  async getIndentsForPaymentRelease() {
    const steps = await db.getTableRows(table(STEPS_SHEET));
    const scheduledPayments = await db.getTableRows(table(config.sheets.schedulePayment));
    
    // Find indents that have completed step 20 (payment scheduling) with NextStep: 21
    const completedStep20WithNextStep21 = steps.filter(step => 
      String(step.StepNumber) === '20' && 
      String(step.StepId) === '20' && 
      step.Status === 'completed' &&
      String(step.NextStep) === '21'
    );
    
    // Get all indent numbers that are ready for payment release
    const indentsForRelease = completedStep20WithNextStep21.map(step => step.IndentNumber);
    // Get scheduled payment details for each indent
    return indentsForRelease.map(indentNumber => {
      const scheduledPayment = scheduledPayments.find(sp => sp.IndentNumber === indentNumber);
      
      if (!scheduledPayment) {
        console.warn(`No scheduled payment found for indent ${indentNumber}`);
        return null;
      }
      
      return {
        IndentNumber: scheduledPayment.IndentNumber,
        ItemName: scheduledPayment.ItemName,
        Specifications: scheduledPayment.Specifications,
        Quantity: scheduledPayment.Quantity,
        Price: scheduledPayment.Price,
        VendorCode: scheduledPayment.VendorCode,
        VendorName: scheduledPayment.VendorName,
        VendorContact: scheduledPayment.VendorContact,
        VendorEmail: scheduledPayment.VendorEmail,
        DCDocumentId: scheduledPayment.DCDocumentId,
        InvoiceDocumentId: scheduledPayment.InvoiceDocumentId,
        PODocumentId: scheduledPayment.PODocumentId,
        GRNId: scheduledPayment.GRNId,
        GRNDate: scheduledPayment.GRNDate,
        PaymentDate: scheduledPayment.PaymentDate,
        ScheduledBy: scheduledPayment.ScheduledBy,
        ScheduledAt: scheduledPayment.ScheduledAt,
        Status: scheduledPayment.Status,
      };
    }).filter(Boolean); // Remove null entries
  },

  // Release payment for an indent
  async releasePayment(indentNumber, paymentDetails, userEmail) {
    try {
      // Tables managed by Supabase migrations
      // Get scheduled payment details
      const scheduledPayments = await db.getTableRows(table(config.sheets.schedulePayment));
      const scheduledPayment = scheduledPayments.find(sp => sp.IndentNumber === indentNumber);
      
      if (!scheduledPayment) {
        throw new Error('No scheduled payment found for this indent');
      }
      
      // Save to ReleasePayment sheet
      const releaseData = {
        IndentNumber: indentNumber,
        ItemName: scheduledPayment.ItemName,
        Specifications: scheduledPayment.Specifications,
        Quantity: scheduledPayment.Quantity,
        Price: scheduledPayment.Price,
        VendorCode: scheduledPayment.VendorCode,
        VendorName: scheduledPayment.VendorName,
        VendorContact: scheduledPayment.VendorContact,
        VendorEmail: scheduledPayment.VendorEmail,
        DCDocumentId: scheduledPayment.DCDocumentId,
        InvoiceDocumentId: scheduledPayment.InvoiceDocumentId,
        PODocumentId: scheduledPayment.PODocumentId,
        GRNId: scheduledPayment.GRNId,
        GRNDate: scheduledPayment.GRNDate,
        ScheduledPaymentDate: scheduledPayment.PaymentDate,
        ScheduledBy: scheduledPayment.ScheduledBy,
        ScheduledAt: scheduledPayment.ScheduledAt,
        PaymentMethod: paymentDetails.paymentMethod,
        TransactionId: paymentDetails.transactionId,
        PaymentAmount: paymentDetails.paymentAmount,
        PaymentNotes: paymentDetails.paymentNotes,
        PaymentDate: paymentDetails.paymentDate,
        ReleasedBy: userEmail,
        ReleasedAt: new Date().toISOString(),
        Status: 'Released',
      };
      await db.insertTableRow(table(config.sheets.releasePayment), releaseData);
      
      // Update PurchaseFlow: set CurrentStep to 19
      const flows = await db.getTableRows(table(SHEET_NAME));
      const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
      if (flowIdx !== -1) {
        const rowIndex = flowIdx + 2;
        const flow = flows[flowIdx];
        await updateRowByIndex(SHEET_NAME, rowIndex, {
          ...flow,
          CurrentStep: 19,
          UpdatedAt: new Date().toISOString(),
          LastModifiedBy: userEmail,
        });
      }
      
      // Update PurchaseFlowSteps: update or add step 19
      const steps = await db.getTableRows(table(STEPS_SHEET));
      const prevStep = steps.filter(s => s.IndentNumber === indentNumber).sort((a, b) => b.StepNumber - a.StepNumber)[0];
      const step19Idx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.NextStep) === '19');
      
      const step19Data = {
        IndentNumber: indentNumber,
        StepNumber: 19,
        StepId: 19,
        Action: 'Approve and Release Payment',
        AssignedTo: 'Accounts Executive',
        Status: 'completed',
        NextStep: '', // Final step
        PreviousStep: 18,
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString(),
      };
      
      if (step19Idx !== -1) {
        // Update existing step 19
        await updateRowByIndex(STEPS_SHEET, step19Idx + 2, {
          ...steps[step19Idx],
          ...step19Data
        });
      } else {
        // Append new step 19 row
        await db.insertTableRow(table(STEPS_SHEET), step19Data);
      }
      return true;
    } catch (error) {
      console.error('Error releasing payment:', error);
      throw new Error(`Failed to release payment: ${error.message}`);
    }
  },

  // Update or append InspectSample status (approve/reject sample) - Updated for new structure
  async updateInspectSampleStatus({ indentNumber, vendorCode, note, status, userEmail, rejectionReason }) {
    // Tables managed by Supabase migrations
    const now = new Date().toISOString();
    
    // 1. Update or append InspectSample sheet with new structure
    const inspectSamples = await db.getTableRows(table(config.sheets.inspectSample));
    const idx = inspectSamples.findIndex(row => row.IndentNumber === indentNumber);
    
    // Get approved quotation data to get all items for this indent
    const quotationData = await db.getTableRows(table('SheetApproveQuotation'));
    const quotation = quotationData.find(row => row.IndentNumber === indentNumber);
    
    let sampleData = {};
    if (idx !== -1 && inspectSamples[idx].Data) {
      try {
        sampleData = JSON.parse(inspectSamples[idx].Data);
      } catch (e) {
        console.error('Error parsing existing sample data:', e);
      }
    }
    
    // If no existing data, initialize with approved quotation data
    if (Object.keys(sampleData).length === 0 && quotation && quotation.ApprovedQuotation) {
      try {
        const approvedData = typeof quotation.ApprovedQuotation === 'string' 
          ? JSON.parse(quotation.ApprovedQuotation) 
          : quotation.ApprovedQuotation;
        
        // Initialize sample data structure
        Object.keys(approvedData).forEach(itemCode => {
          sampleData[itemCode] = {
            vendorCode: approvedData[itemCode].selectedVendor.vendorCode,
            vendorName: approvedData[itemCode].selectedVendor.vendorName,
            status: 'Pending',
            note: '',
            rejectionReason: '',
            inspectedBy: '',
            inspectedAt: ''
          };
        });
      } catch (error) {
        console.error('Error initializing sample data from approved quotation:', error);
      }
    }
    
    // Update all items for this vendor to the specified status
    Object.keys(sampleData).forEach(itemCode => {
      if (sampleData[itemCode].vendorCode === vendorCode) {
        sampleData[itemCode] = {
          ...sampleData[itemCode],
          status: status,
          note: note || '',
          rejectionReason: rejectionReason || '',
          inspectedBy: userEmail,
          inspectedAt: now
        };
      }
    });
    
    const rowData = {
      IndentNumber: indentNumber,
      Data: JSON.stringify(sampleData),
      LastModifiedBy: userEmail,
      LastModifiedAt: now
    };
    
    if (idx !== -1) {
      await updateRowByIndex(config.sheets.inspectSample, idx + 2, rowData);
    } else {
      await db.insertTableRow(table(config.sheets.inspectSample), rowData);
    }
    // 2. If approved, update PurchaseFlow and PurchaseFlowSteps as in updateSampleInspected
    if (status === 'Approved') {
      // Update PurchaseFlow: set CurrentStep to 8
      const flows = await db.getTableRows(table(SHEET_NAME));
      const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
      if (flowIdx !== -1) {
        const rowIndex = flowIdx + 2;
        const flow = flows[flowIdx];
        await updateRowByIndex(SHEET_NAME, rowIndex, {
          ...flow,
          CurrentStep: 8,
          UpdatedAt: now,
          LastModifiedBy: userEmail,
        });
      }
      // Update PurchaseFlowSteps: update or add step 8
      const steps = await db.getTableRows(table(STEPS_SHEET));
      let stepIdx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.StepNumber) === '7');
      if (stepIdx !== -1) {
        const rowIndex = stepIdx + 2;
        const step = steps[stepIdx];
        await updateRowByIndex(STEPS_SHEET, rowIndex, {
          ...step,
          StepNumber: 8,
          StepId: 8,
          NextStep: 9,
          PreviousStep: 7,
          Action: 'Inspect Sample',
          AssignedTo: 'Purchase Executive',
          LastModifiedBy: userEmail,
          LastModifiedAt: now,
        });
      } else {
        await db.insertTableRow(table(STEPS_SHEET), {
          IndentNumber: indentNumber,
          StepNumber: 8,
          StepId: 8,
          NextStep: 9,
          PreviousStep: 7,
          Action: 'Inspect Sample',
          AssignedTo: 'Purchase Executive',
          LastModifiedBy: userEmail,
          LastModifiedAt: now,
        });
      }
    } else if (status === 'Rejected') {
      // If rejected, also update PurchaseFlow and PurchaseFlowSteps to reflect rejection at step 8
      const flows = await db.getTableRows(table(SHEET_NAME));
      const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
      if (flowIdx !== -1) {
        const rowIndex = flowIdx + 2;
        const flow = flows[flowIdx];
        await updateRowByIndex(SHEET_NAME, rowIndex, {
          ...flow,
          CurrentStep: 8,
          Status: 'Rejected',
          UpdatedAt: now,
          LastModifiedBy: userEmail,
        });
      }
      // Update PurchaseFlowSteps: update or add step 8 as rejected
      const steps = await db.getTableRows(table(STEPS_SHEET));
      let stepIdx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.StepNumber) === '7');
      if (stepIdx !== -1) {
        const rowIndex = stepIdx + 2;
        const step = steps[stepIdx];
        await updateRowByIndex(STEPS_SHEET, rowIndex, {
          ...step,
          StepNumber: 8,
          StepId: 8,
          NextStep: 9,
          PreviousStep: 7,
          Action: 'Inspect Sample',
          AssignedTo: 'Purchase Executive',
          Status: 'rejected',
          LastModifiedBy: userEmail,
          LastModifiedAt: now,
          RejectionReason: rejectionReason || '',
        });
      } else {
        await db.insertTableRow(table(STEPS_SHEET), {
          IndentNumber: indentNumber,
          StepNumber: 8,
          StepId: 8,
          NextStep: 9,
          PreviousStep: 7,
          Action: 'Inspect Sample',
          AssignedTo: 'Purchase Executive',
          Status: 'rejected',
          LastModifiedBy: userEmail,
          LastModifiedAt: now,
          RejectionReason: rejectionReason || '',
        });
      }
    }
    return true;
  },

  // For a given indent, fetch only the approved vendor details for Request Sample step
  async getApprovedVendorForRequestSample(indentNumber) {
    const rows = await db.getTableRows(table('SheetApproveQuotation'));
    const vendorRows = await db.getTableRows(table('Vendor'));
    const followupQuotationRows = await db.getTableRows(table('FollowUpQuotations'));
    
    const row = rows.find(r => r.IndentNumber === indentNumber);
    if (!row) return [];
    
    try {
      const approvedQuotation = JSON.parse(row.ApprovedQuotation);
      if (!approvedQuotation || !approvedQuotation.vendorCode) return [];
      
      const vendorObj = vendorRows.find(v => v['Vendor Code'] === approvedQuotation.vendorCode);
      const quotation = followupQuotationRows.find(q => q.IndentNumber === indentNumber && q.Vendor === approvedQuotation.vendorCode);
      
      return [{
        vendorCode: approvedQuotation.vendorCode,
        price: approvedQuotation.price,
        deliveryTime: approvedQuotation.deliveryTime,
        terms: approvedQuotation.terms,
        leadTime: approvedQuotation.leadTime,
        best: approvedQuotation.best,
        QuotationDocument: quotation ? quotation.QuotationDocument : null,
        vendorEmail: vendorObj?.['Vendor Email'] || vendorObj?.email || vendorObj?.Email || '',
        vendorName: vendorObj?.['Vendor Name'] || vendorObj?.['SKU Description'] || '',
        vendorContact: vendorObj?.['Vendor Contact'] || '',
        address: vendorObj?.Address || '',
      }];
    } catch (error) {
      console.error('Error parsing approved quotation:', error);
      return [];
    }
  },

  // For a given indent, fetch all vendors and their details from Comparative Statement
  async getVendorsForIndentWithComparative(indentNumber) {
    // Get comparative statement data for this indent
    const comparativeRows = await db.getTableRows(table('Comparative Statement'));
    const followupQuotationRows = await db.getTableRows(table('FollowUpQuotations'));
    const vendorRows = await db.getTableRows(table('Vendor'));
    const row = comparativeRows.find(r => r.IndentNumber === indentNumber);
    if (!row) return [];
    let comparativeData = {};
    try { comparativeData = JSON.parse(row.Data); } catch {}
    // Each key is a vendor code, value is vendor details
    return Object.entries(comparativeData).map(([vendorCode, details]) => {
      const quotation = followupQuotationRows.find(q => q.IndentNumber === indentNumber && q.Vendor === vendorCode);
      const vendorObj = vendorRows.find(v => v['Vendor Code'] === vendorCode);
      return {
        vendorCode,
        ...details,
        QuotationDocument: quotation ? quotation.QuotationDocument : null,
        vendorEmail: vendorObj?.['Vendor Email'] || vendorObj?.email || vendorObj?.Email || '',
      };
    });
  },

  // Add a new indent with multiple items (one row per indent in both sheets)
  async addIndentWithItems({ items, createdBy = 'Store Manager' }) {
    const flowId = `PF${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const indentNumber = `IND-${Date.now()}`;
    const itemsNormalized = (items || []).map((it) => ({
      ...it,
      quantity: sheetFloat(it?.quantity, 0),
    }));
    // Store all items as JSON in a single row
    const mainFlowData = sanitizePurchaseFlowMainRow({
      FlowId: flowId,
      IndentNumber: indentNumber,
      Items: JSON.stringify(itemsNormalized),
      CurrentStep: 1,
      Status: 'In Progress',
      CreatedBy: createdBy,
      /** Stored inside jsonb `record` for the app; not separate SQL columns on sheet-style tables. */
      CreatedAt: timestamp,
      UpdatedAt: timestamp,
      ExpectedDelivery: '',
      Priority: 'Medium',
      Department: '',
      Budget: '',
      VendorDetails: '',
      Documents: '',
      Comments: '',
      TATBreaches: '',
      ApprovalChain: '',
      FinalAmount: '',
      PaymentStatus: '',
      LastModifiedBy: createdBy
    });
    await db.insertTableRow(table('PurchaseFlow'), mainFlowData);
    // Store all steps as JSON in a single row in PurchaseFlowSteps
    const initialSteps = [
      {
        FlowId: flowId,
        StepId: 1,
        StepNumber: 1,
        Role: 'Store Manager',
        Action: 'Raise Indent',
        Status: 'In Progress',
        AssignedTo: 'Process Coordinator',
        StartTime: timestamp,
        EndTime: null,
        TAT: '1',
        TATStatus: 'On Time',
        ApprovalStatus: 'Pending',
        RejectionReason: '',
        NextStep: '2',
        PreviousStep: '0',
        Dependencies: '',
        LastModifiedBy: createdBy,
        LastModifiedAt: timestamp
      }
    ];
    const stepsRow = sanitizePurchaseFlowStepsFlatRow({
      FlowId: flowId,
      IndentNumber: indentNumber,
      Steps: JSON.stringify(initialSteps),
      Items: JSON.stringify(itemsNormalized),
      Status: 'In Progress',
      CreatedBy: createdBy,
      LastModifiedBy: createdBy,
      // Step 1 details (timestamps live inside Steps JSON + DB created_at)
      StepId: 1,
      StepNumber: 1,
      NextStep: '2',
      PreviousStep: '0',
      Role: 'Store Manager',
      Action: 'Raise Indent',
      AssignedTo: 'Process Coordinator',
      TAT: '1',
      TATStatus: 'On Time',
      ApprovalStatus: 'Pending',
      RejectionReason: ''
    });
    await db.insertTableRow(table('PurchaseFlowSteps'), stepsRow);
    return { indentNumber };
  },

  // Fetch all indents, parsing Items JSON and Steps JSON from both sheets
  async getAllIndents() {
    const data = await db.getTableRows(table('PurchaseFlow'));
    const stepsData = await db.getTableRows(table('PurchaseFlowSteps'));
    const stepsByIndent = {};
    const stepsByFlowId = {};
    for (const row of stepsData) {
      const ik = purchaseFlowIndentKey(recordIndentNumber(row));
      if (ik) stepsByIndent[ik] = row;
      const fk = purchaseFlowIndentKey(recordFlowId(row));
      if (fk) stepsByFlowId[fk] = row;
    }
    return data.map((row) => {
      const flowKey = purchaseFlowIndentKey(recordIndentNumber(row));
      const flowFk = purchaseFlowIndentKey(recordFlowId(row));
      const stepsRow =
        (flowKey && stepsByIndent[flowKey]) ||
        (flowFk && stepsByFlowId[flowFk]) ||
        {};
      const itemsFromFlow = parseJsonArray(row.Items);
      const itemsFromSteps = parseJsonArray(stepsRow.Items);
      const items = itemsFromFlow.length > 0 ? itemsFromFlow : itemsFromSteps;
      const steps = parseJsonArray(stepsRow.Steps);
      return {
        ...row,
        Items: items,
        Steps: steps,
        StepsMeta: stepsRow,
      };
    });
  },

  /**
   * Indents that belong on "Approve Indent": main flow is still at step 1, or steps metadata says next human step is 2.
   */
  isAwaitingApproveIndent(indent) {
    const status = String(indent.Status ?? indent.status ?? '').toLowerCase();
    if (status === 'rejected' || status === 'cancelled') return false;

    const cur = Number(indent.CurrentStep ?? indent.currentStep ?? indent.current_step);
    if (Number.isFinite(cur) && cur >= 2) return false;
    if (Number.isFinite(cur) && cur === 1) return true;

    const steps = indent.Steps || [];
    const meta = indent.StepsMeta || {};
    let n = null;
    if (steps.length > 0) {
      const last = steps[steps.length - 1];
      n = last.NextStep ?? last.nextStep ?? last.next_step;
    }
    if (n == null || n === '') {
      n = meta.NextStep ?? meta.nextStep ?? meta.next_step;
    }
    return String(n) === '2' || Number(n) === 2;
  },

  /**
   * Indents that belong on Float RFQ (step 3): main flow at step 2 after approve, or steps say next is 3.
   */
  isAwaitingFloatRFQ(indent) {
    const status = String(indent.Status ?? indent.status ?? '').toLowerCase();
    if (status === 'rejected' || status === 'cancelled') return false;

    const cur = Number(indent.CurrentStep ?? indent.currentStep ?? indent.current_step);
    if (Number.isFinite(cur) && cur >= 3) return false;
    if (Number.isFinite(cur) && cur === 2) return true;

    const steps = indent.Steps || [];
    const meta = indent.StepsMeta || {};
    let n = null;
    if (steps.length > 0) {
      const last = steps[steps.length - 1];
      n = last.NextStep ?? last.nextStep ?? last.next_step;
    }
    if (n == null || n === '') {
      n = meta.NextStep ?? meta.nextStep ?? meta.next_step;
    }
    return String(n) === '3' || Number(n) === 3;
  },

  /**
   * Indents on Follow-up Quotations (step 4): after Float RFQ CurrentStep is 3; draft save sets 4 until step completes (5).
   */
  isAwaitingFollowUpQuotations(indent) {
    const status = String(indent.Status ?? indent.status ?? '').toLowerCase();
    if (status === 'rejected' || status === 'cancelled') return false;

    const cur = Number(indent.CurrentStep ?? indent.currentStep ?? indent.current_step);
    if (Number.isFinite(cur) && cur >= 5) return false;
    if (Number.isFinite(cur) && (cur === 3 || cur === 4)) return true;

    const steps = indent.Steps || [];
    const meta = indent.StepsMeta || {};
    let n = null;
    if (steps.length > 0) {
      const last = steps[steps.length - 1];
      n = last.NextStep ?? last.nextStep ?? last.next_step;
    }
    if (n == null || n === '') {
      n = meta.NextStep ?? meta.nextStep ?? meta.next_step;
    }
    return String(n) === '4' || Number(n) === 4;
  },

  /**
   * Indents ready for Prepare Comparative Statement (step 5): follow-up done (NextStep 5), not yet sent to approve (NextStep 6).
   */
  isAwaitingComparativeStatement(indent) {
    const status = String(indent.Status ?? indent.status ?? '').toLowerCase();
    if (status === 'rejected' || status === 'cancelled') return false;

    const cur = Number(indent.CurrentStep ?? indent.currentStep ?? indent.current_step);
    if (Number.isFinite(cur) && cur >= 6) return false;

    const n = purchaseFlowResolvedNextStep(indent);
    const nNum = n == null || n === '' ? NaN : Number(String(n).trim());
    if (Number.isFinite(nNum) && nNum >= 6) return false;
    if (Number.isFinite(nNum) && nNum === 5) return true;

    if (Number.isFinite(cur) && cur === 5) return true;

    return false;
  },

  /** Indents waiting on Approve Quotation (step 6): comparative done, NextStep 6 until management approves (NextStep 7+). */
  isAwaitingApproveQuotation(indent) {
    const status = String(indent.Status ?? indent.status ?? '').toLowerCase();
    if (status === 'rejected' || status === 'cancelled') return false;

    const meta = indent.StepsMeta || {};
    if (String(meta.Status ?? '').toLowerCase() === 'skipped') return false;

    const n = purchaseFlowResolvedNextStep(indent);
    const nNum = n == null || n === '' ? NaN : Number(String(n).trim());

    const stepsJson = indent.Steps || [];
    const last = stepsJson.length > 0 ? stepsJson[stepsJson.length - 1] : null;
    const lastStepNum = last != null ? Number(last.StepNumber ?? last.stepNumber) : NaN;
    const lastStatus = String(last?.Status ?? last?.status ?? '').toLowerCase();
    const jsonSaysAwaitingApprove =
      last != null &&
      lastStepNum === 5 &&
      lastStatus === 'completed' &&
      (Number(last.NextStep) === 6 || String(last.NextStep ?? '').trim() === '6');

    if (Number.isFinite(nNum) && nNum >= 7) return false;
    if (Number.isFinite(nNum) && nNum === 6) return true;
    if (jsonSaysAwaitingApprove) return true;

    const cur = Number(indent.CurrentStep ?? indent.currentStep ?? indent.current_step);
    if (Number.isFinite(cur) && cur === 6) return true;

    return false;
  },

  /**
   * Get all indents whose next step is 3 (Float RFQ) with their items and associated vendors
   * Returns: [{ IndentNumber, Items: [{ itemCode, itemName, quantity, specifications, vendors: [...] }] }]
   */
  async getIndentsWithItemsAndVendors() {
    try {
      await this.validateRFQSheet();
      const allIndents = await this.getAllIndents();
      const rfqRows = await db.getTableRows(table('RFQ'));
      const queued = allIndents.filter((i) => this.isAwaitingFloatRFQ(i));

      return queued.map((indent) => {
        const indentKey = purchaseFlowIndentKey(recordIndentNumber(indent));
        const rfqRow = rfqRows.find(
          (r) => purchaseFlowIndentKey(recordIndentNumber(r)) === indentKey
        );
        const rfqItems = parseJsonArray(rfqRow?.Items);
        const baseItems = Array.isArray(indent.Items) ? indent.Items : parseJsonArray(indent.Items);
        const itemsWithVendors = baseItems.map((item) => {
          const code = item.itemCode ?? item.ItemCode;
          const rfqItem = rfqItems.find((i) => (i.itemCode ?? i.ItemCode) === code);
          return {
            ...item,
            vendors:
              rfqItem && Array.isArray(rfqItem.vendors) ? rfqItem.vendors : [],
          };
        });
        return {
          IndentNumber: recordIndentNumber(indent) ?? indent.IndentNumber,
          Items: itemsWithVendors,
        };
      });
    } catch (error) {
      console.error('Error in getIndentsWithItemsAndVendors:', error);
      return [];
    }
  },

  /**
   * Add a vendor to an item in an indent (new structure)
   * vendor = { VendorCode, VendorName }
   */
  async addVendorToItem({ indentNumber, itemCode, vendor }) {
    try {
      const rfqRows = await db.getTableRows(table('RFQ'));
      const want = purchaseFlowIndentKey(indentNumber);
      const rfqIdx = rfqRows.findIndex(
        (r) => purchaseFlowIndentKey(recordIndentNumber(r)) === want
      );
      let items = [];
      if (rfqIdx !== -1) {
        // Existing indent: update items
        items = parseJsonArray(rfqRows[rfqIdx].Items);
        const itemIdx = items.findIndex(i => i.itemCode === itemCode);
        if (itemIdx !== -1) {
          // Add vendor to existing item
          if (!Array.isArray(items[itemIdx].vendors)) items[itemIdx].vendors = [];
          // Prevent duplicate vendor
          if (!items[itemIdx].vendors.some(v => v.vendorCode === vendor.VendorCode)) {
            items[itemIdx].vendors.push({ vendorCode: vendor.VendorCode, vendorName: vendor.VendorName });
          }
        } else {
          // Add new item with vendor
          items.push({ itemCode, vendors: [{ vendorCode: vendor.VendorCode, vendorName: vendor.VendorName }] });
        }
        await updateRowByIndex('RFQ', rfqIdx + 2, {
          ...rfqRows[rfqIdx],
          Items: JSON.stringify(items)
        });
      } else {
        // New indent: create row
        items = [{ itemCode, vendors: [{ vendorCode: vendor.VendorCode, vendorName: vendor.VendorName }] }];
        await db.insertTableRow(table('RFQ'), {
          IndentNumber: indentNumber,
          Items: JSON.stringify(items)
        });
      }
      return true;
    } catch (error) {
      console.error('Error adding vendor to RFQ:', error);
      throw error;
    }
  },

  /**
   * Complete step 3 (Float RFQ) for an indent
   * This updates both PurchaseFlow and PurchaseFlowSteps sheets
   */
  async completeFloatRFQStep({ indentNumber, userEmail = 'Purchase Executive' }) {
    try {
      const timestamp = new Date().toISOString();
      const wantFlow = purchaseFlowIndentKey(indentNumber);
      // 1. Update PurchaseFlow: set CurrentStep to 4 and update Steps array
      const flows = await db.getTableRows(table(SHEET_NAME));
      const flowIdx = flows.findIndex(
        (row) => purchaseFlowIndentKey(recordIndentNumber(row)) === wantFlow
      );
      if (flowIdx !== -1) {
        const rowIndex = flowIdx + 2;
        const flow = flows[flowIdx];
        let stepsArr = [];
        try { stepsArr = flow.Steps ? JSON.parse(flow.Steps) : []; } catch { stepsArr = []; }
        // Update only the last step object in the array, or push if empty (like approveIndent)
        const step3Obj = {
          StepId: 3,
          StepNumber: 3,
          Role: 'Purchase Executive',
          Action: 'Float RFQ',
          Status: 'completed',
          AssignedTo: 'Purchase Executive',
          StartTime: timestamp,
          EndTime: timestamp,
          TAT: '2',
          TATStatus: 'On Time',
          ApprovalStatus: 'Pending',
          RejectionReason: '',
          NextStep: 4,
          PreviousStep: 2,
          Dependencies: '',
          LastModifiedBy: userEmail,
          LastModifiedAt: timestamp,
        };
        if (stepsArr.length > 0) {
          stepsArr[stepsArr.length - 1] = step3Obj;
        } else {
          stepsArr.push(step3Obj);
        }
        // Sort steps by StepNumber
        stepsArr.sort((a, b) => a.StepNumber - b.StepNumber);
        await updateRowByIndex(SHEET_NAME, rowIndex, {
          ...flow,
          CurrentStep: 3,
          Steps: JSON.stringify(stepsArr),
          UpdatedAt: timestamp,
          LastModifiedBy: userEmail,
        });
      }
      // 2. Update PurchaseFlowSteps: find current step and update it to step 4
      const steps = await db.getTableRows(table(STEPS_SHEET));
      const currentStepIdx = steps.findIndex((s) => {
        if (purchaseFlowIndentKey(recordIndentNumber(s)) !== wantFlow) return false;
        return String(s.NextStep) === '3' || Number(s.NextStep) === 3;
      });
      if (currentStepIdx !== -1) {
        const currentStep = steps[currentStepIdx];
        const rowIndex = currentStepIdx + 2;
        // Parse Steps array from currentStep (not from main flow)
        let stepsArr2 = [];
        try { stepsArr2 = currentStep.Steps ? JSON.parse(currentStep.Steps) : []; } catch { stepsArr2 = []; }
        // Update only the last step object in the array, or push if empty
        const step3Obj2 = {
          StepId: 3,
          StepNumber: 3,
          Role: 'Purchase Executive',
          Action: 'Float RFQ',
          Status: 'completed',
          AssignedTo: 'Purchase Executive',
          StartTime: timestamp,
          EndTime: timestamp,
          TAT: '2',
          TATStatus: 'On Time',
          ApprovalStatus: 'Pending',
          RejectionReason: '',
          NextStep: 4,
          PreviousStep: 2,
          Dependencies: '',
          LastModifiedBy: userEmail,
          LastModifiedAt: timestamp,
        };
        if (stepsArr2.length > 0) {
          stepsArr2[stepsArr2.length - 1] = step3Obj2;
        } else {
          stepsArr2.push(step3Obj2);
        }
        stepsArr2.sort((a, b) => a.StepNumber - b.StepNumber);
        await updateRowByIndex(STEPS_SHEET, rowIndex, {
          ...currentStep,
          StepNumber: 3,
          StepId: 3,
          Steps: JSON.stringify(stepsArr2),
          Role: 'Purchase Executive',
          Action: 'Follow-up Quotations',
          Status: 'in_progress',
          AssignedTo: 'Purchase Executive',
          StartTime: timestamp,
          EndTime: '',
          TAT: '2',
          TATStatus: 'On Time',
          ApprovalStatus: 'Pending',
          RejectionReason: '',
          NextStep: '4',
          PreviousStep: '2',
          Dependencies: '',
          LastModifiedBy: userEmail,
          LastModifiedAt: timestamp,
        });
      }
      return true;
    } catch (error) {
      console.error('Error completing Float RFQ step:', error);
      throw error;
    }
  },

  /**
   * Remove a vendor from an item in an indent (new structure)
   */
  async removeVendorFromItem({ indentNumber, itemCode, vendorCode }) {
    try {
      const rfqRows = await db.getTableRows(table('RFQ'));
      const want = purchaseFlowIndentKey(indentNumber);
      const rfqIdx = rfqRows.findIndex(
        (r) => purchaseFlowIndentKey(recordIndentNumber(r)) === want
      );
      if (rfqIdx === -1) return false;
      let items = parseJsonArray(rfqRows[rfqIdx].Items);
      const itemIdx = items.findIndex(i => i.itemCode === itemCode);
      if (itemIdx === -1) return false;
      if (!Array.isArray(items[itemIdx].vendors)) items[itemIdx].vendors = [];
      items[itemIdx].vendors = items[itemIdx].vendors.filter(v => v.vendorCode !== vendorCode);
      await updateRowByIndex('RFQ', rfqIdx + 2, {
        ...rfqRows[rfqIdx],
        Items: JSON.stringify(items)
      });
      return true;
    } catch (error) {
      console.error('Error removing vendor from RFQ:', error);
      return false;
    }
  },

  /**
   * Update a vendor for an item in an indent (new structure)
   */
  async updateVendorForItem({ indentNumber, itemCode, vendor }) {
    try {
      const rfqRows = await db.getTableRows(table('RFQ'));
      const want = purchaseFlowIndentKey(indentNumber);
      const rfqIdx = rfqRows.findIndex(
        (r) => purchaseFlowIndentKey(recordIndentNumber(r)) === want
      );
      if (rfqIdx === -1) return false;
      let items = parseJsonArray(rfqRows[rfqIdx].Items);
      const itemIdx = items.findIndex(i => i.itemCode === itemCode);
      if (itemIdx === -1) return false;
      if (!Array.isArray(items[itemIdx].vendors)) items[itemIdx].vendors = [];
      const vendorIdx = items[itemIdx].vendors.findIndex(v => v.vendorCode === vendor.VendorCode);
      if (vendorIdx === -1) return false;
      items[itemIdx].vendors[vendorIdx] = { vendorCode: vendor.VendorCode, vendorName: vendor.VendorName };
      await updateRowByIndex('RFQ', rfqIdx + 2, {
        ...rfqRows[rfqIdx],
        Items: JSON.stringify(items)
      });
      return true;
    } catch (error) {
      console.error('Error updating vendor in RFQ:', error);
      return false;
    }
  },

  /**
   * Validate and ensure RFQ sheet has correct structure
   */
  async validateRFQSheet() {
    try {
      const rfqData = await db.getTableRows(table('RFQ'));
      if (rfqData.length === 0) {
        // Create a sample row to establish the structure
        await db.insertTableRow(table('RFQ'), {
          IndentNumber: 'SAMPLE',
          ItemCode: 'SAMPLE_ITEM',
          VendorCode: 'SAMPLE_VENDOR',
          VendorName: 'Sample Vendor Name',
          CreatedAt: new Date().toISOString(),
          CreatedBy: 'System'
        });
      } else {
        
      }
      
      return true;
    } catch (error) {
      console.error('Error validating RFQ sheet:', error);
      return false;
    }
  },

  /** Debug helper: RFQ rows for an indent number. */
  async debugRFQData(indentNumber) {
    try {
      const rfqData = await db.getTableRows(table('RFQ'));
      const indentRFQ = rfqData.filter(rfq => rfq.IndentNumber === indentNumber);
      return indentRFQ;
    } catch (error) {
      console.error('Error debugging RFQ data:', error);
      return [];
    }
  },

  /**
   * Add or update a quotation for a vendor for a specific item in an indent (single row per indent)
   * All quotations are stored in a JSON object in the 'Quotations' field
   */
  async addOrUpdateFollowUpQuotation({ indentNumber, itemCode, vendorCode, quotationDocument, userEmail }) {
    const rows = await db.getTableRows(table('FollowUpQuotations'));
    const idx = rows.findIndex(r => r.IndentNumber === indentNumber);
    const now = new Date().toISOString();
    let quotations = {};
    if (idx !== -1) {
      try { quotations = rows[idx].Quotations ? JSON.parse(rows[idx].Quotations) : {}; } catch { quotations = {}; }
    }
    if (!quotations[itemCode]) quotations[itemCode] = {};
    quotations[itemCode][vendorCode] = { quotationDocument };
    const rowData = {
      IndentNumber: indentNumber,
      Quotations: JSON.stringify(quotations),
      CreatedAt: idx === -1 ? now : rows[idx].CreatedAt,
      CreatedBy: idx === -1 ? userEmail : rows[idx].CreatedBy,
      LastModifiedAt: now,
      LastModifiedBy: userEmail,
    };
    if (idx !== -1) {
      await updateRowByIndex('FollowUpQuotations', idx + 2, { ...rows[idx], ...rowData });
    } else {
      await db.insertTableRow(table('FollowUpQuotations'), rowData);
    }
    return true;
  },

  /**
   * Get all follow-up quotations for an indent, grouped by item and vendor (from Quotations field)
   * Returns: { [itemCode]: { [vendorCode]: { quotationDocument } } }
   */
  async getFollowUpQuotationsForIndent(indentNumber) {
    const rows = await db.getTableRows(table('FollowUpQuotations'));
    const want = purchaseFlowIndentKey(indentNumber);
    const row = rows.find((r) => purchaseFlowIndentKey(recordIndentNumber(r)) === want);
    if (!row) return {};
    return parseJsonObject(row.Quotations);
  },

  /**
   * Get all indents at step 4 (Follow-up Quotations) with their items and associated vendors
   * Returns: [{ IndentNumber, Items: [{ itemCode, itemName, quantity, specifications, vendors: [...] }] }]
   */
  async getIndentsAtStep4WithItemsAndVendors() {
    try {
      const allIndents = await this.getAllIndents();
      const rfqRows = await db.getTableRows(table('RFQ'));
      const queued = allIndents.filter((i) => this.isAwaitingFollowUpQuotations(i));

      return queued.map((indent) => {
        const indentKey = purchaseFlowIndentKey(recordIndentNumber(indent));
        const rfqRow = rfqRows.find(
          (r) => purchaseFlowIndentKey(recordIndentNumber(r)) === indentKey
        );
        const rfqItems = parseJsonArray(rfqRow?.Items);
        const baseItems = Array.isArray(indent.Items) ? indent.Items : parseJsonArray(indent.Items);
        const itemsWithVendors = baseItems.map((item) => {
          const code = item.itemCode ?? item.ItemCode;
          const rfqItem = rfqItems.find((i) => (i.itemCode ?? i.ItemCode) === code);
          return {
            ...item,
            vendors:
              rfqItem && Array.isArray(rfqItem.vendors) ? rfqItem.vendors : [],
          };
        });
        return {
          IndentNumber: recordIndentNumber(indent) ?? indent.IndentNumber,
          Items: itemsWithVendors,
        };
      });
    } catch (error) {
      console.error('Error in getIndentsAtStep4WithItemsAndVendors:', error);
      return [];
    }
  },

  /**
   * Skip Follow-up for Quotation step: update PurchaseFlow and PurchaseFlowSteps for the indent
   */
  async skipFollowUpQuotationStep({ indentNumber, userEmail, stepId = 4 }) {
    // 1. Update PurchaseFlow: set CurrentStep to stepId and mark as skipped
    const flows = await db.getTableRows(table(SHEET_NAME));
    const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
    if (flowIdx !== -1) {
      const rowIndex = flowIdx + 2;
      const flow = flows[flowIdx];
      let stepsArr = [];
      try { stepsArr = flow.Steps ? JSON.parse(flow.Steps) : []; } catch { stepsArr = []; }
      const timestamp = new Date().toISOString();
      const stepObj = {
        StepId: stepId,
        StepNumber: stepId,
        Role: 'Purchase Executive',
        Action: 'FollowUpQuotations',
        Status: 'skipped',
        AssignedTo: 'Purchase Executive',
        StartTime: stepsArr.length > 0 ? stepsArr[stepsArr.length-1].EndTime || timestamp : timestamp,
        EndTime: timestamp,
        TAT: '2',
        TATStatus: 'Skipped',
        ApprovalStatus: 'Skipped',
        RejectionReason: '',
        NextStep: stepId + 1,
        PreviousStep: stepId - 1,
        Dependencies: '',
        LastModifiedBy: userEmail,
        LastModifiedAt: timestamp,
      };
      if (stepsArr.length > 0) {
        stepsArr[stepsArr.length - 1] = stepObj;
      } else {
        stepsArr.push(stepObj);
      }
      await updateRowByIndex(SHEET_NAME, rowIndex, {
        ...flow,
        CurrentStep: stepId + 1, // Move to next step after skipping
        Steps: JSON.stringify(stepsArr),
        UpdatedAt: timestamp,
        LastModifiedBy: userEmail,
      });
    }
    // 2. Update PurchaseFlowSteps
    const steps = await db.getTableRows(table(STEPS_SHEET));
    const stepIdx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.StepNumber) === String(stepId - 1));
    if (stepIdx !== -1) {
      const rowIndex = stepIdx + 2;
      const step = steps[stepIdx];
      let stepsArr2 = [];
      try { stepsArr2 = step.Steps ? JSON.parse(step.Steps) : []; } catch { stepsArr2 = []; }
      const timestamp = new Date().toISOString();
      const stepObj2 = {
        StepId: stepId,
        StepNumber: stepId,
        Role: 'Purchase Executive',
        Action: 'FollowUpQuotations',
        Status: 'skipped',
        AssignedTo: 'Purchase Executive',
        StartTime: stepsArr2.length > 0 ? stepsArr2[stepsArr2.length-1].EndTime || timestamp : timestamp,
        EndTime: timestamp,
        TAT: '2',
        TATStatus: 'Skipped',
        ApprovalStatus: 'Skipped',
        RejectionReason: '',
        NextStep: stepId + 1,
        PreviousStep: stepId - 1,
        Dependencies: '',
        LastModifiedBy: userEmail,
        LastModifiedAt: timestamp,
      };
      if (stepsArr2.length > 0) {
        stepsArr2[stepsArr2.length - 1] = stepObj2;
      } else {
        stepsArr2.push(stepObj2);
      }
      await updateRowByIndex(STEPS_SHEET, rowIndex, {
        ...step,
        StepNumber: stepId,
        StepId: stepId,
        NextStep: stepId + 1,
        PreviousStep: stepId - 1,
        AssignedTo: 'Purchase Executive',
        Action: 'FollowUpQuotations',
        Steps: JSON.stringify(stepsArr2),
        LastModifiedBy: userEmail,
        LastModifiedAt: timestamp,
      });
    }
    return true;
  },

  /**
   * Generic function to skip any step (5-16)
   * @param {Object} params - { stepId, indentNumber, poId, userEmail, role, action }
   */
  async skipStep({ stepId, indentNumber, poId, userEmail, role, action }) {
    const timestamp = new Date().toISOString();
    
    // Step configuration mapping
    const stepConfig = {
      5: { role: 'Purchase Executive', action: 'Prepare Comparative Statement', tat: '1' },
      6: { role: 'Management / HOD', action: 'Approve Quotation', tat: '1' },
      7: { role: 'Purchase Executive', action: 'Request & Follow-up for Sample', tat: '3' },
      8: { role: 'QC Manager', action: 'Inspect Sample', tat: '1' },
      9: { role: 'Purchase Executive', action: 'Sort Vendors', tat: '1' },
      10: { role: 'Purchase Executive', action: 'Place PO', tat: '1' },
      11: { role: 'Purchase Executive', action: 'Follow-up for Delivery', tat: 'As per PO' },
      12: { role: 'Store Manager', action: 'Receive & Inspect Material', tat: '1' },
      13: { role: 'QC Manager', action: 'Material Approval', tat: '1' },
      14: { role: 'Purchase Executive', action: 'Decision on Rejection', tat: '1' },
      15: { role: 'Store Manager', action: 'Return Rejected Material', tat: '1' },
      16: { role: 'Purchase Executive', action: 'Resend Material', tat: '3-5' }
    };

    const config = stepConfig[stepId] || { role: role || 'Purchase Executive', action: action || 'Unknown', tat: '1' };
    const stepRole = role || config.role;
    const stepAction = action || config.action;
    const stepTat = config.tat;

    // Determine next step (some steps have conditional next steps)
    let nextStep = stepId + 1;
    if (stepId === 13) {
      // Material Approval can go to 14 (rejection) or 17 (GRN)
      // For skip, we'll go to 17 (GRN) as default
      nextStep = 17;
    }

    // If indentNumber is provided, update PurchaseFlow
    if (indentNumber) {
      const flows = await db.getTableRows(table(SHEET_NAME));
      const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
      if (flowIdx !== -1) {
        const rowIndex = flowIdx + 2;
        const flow = flows[flowIdx];
        let stepsArr = [];
        try { stepsArr = flow.Steps ? JSON.parse(flow.Steps) : []; } catch { stepsArr = []; }
        
        const stepObj = {
          StepId: stepId,
          StepNumber: stepId,
          Role: stepRole,
          Action: stepAction,
          Status: 'skipped',
          AssignedTo: stepRole,
          StartTime: stepsArr.length > 0 ? stepsArr[stepsArr.length-1].EndTime || timestamp : timestamp,
          EndTime: timestamp,
          TAT: stepTat,
          TATStatus: 'Skipped',
          ApprovalStatus: 'Skipped',
          RejectionReason: '',
          NextStep: nextStep,
          PreviousStep: stepId - 1,
          Dependencies: '',
          LastModifiedBy: userEmail,
          LastModifiedAt: timestamp,
        };
        
        if (stepsArr.length > 0) {
          stepsArr[stepsArr.length - 1] = stepObj;
        } else {
          stepsArr.push(stepObj);
        }
        
        await updateRowByIndex(SHEET_NAME, rowIndex, {
          ...flow,
          CurrentStep: nextStep,
          Steps: JSON.stringify(stepsArr),
          UpdatedAt: timestamp,
          LastModifiedBy: userEmail,
        });
      }
    }

    // Update PurchaseFlowSteps if indentNumber is provided
    if (indentNumber) {
      const steps = await db.getTableRows(table(STEPS_SHEET));
      const stepIdx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.StepNumber) === String(stepId - 1));
      if (stepIdx !== -1) {
        const rowIndex = stepIdx + 2;
        const step = steps[stepIdx];
        let stepsArr2 = [];
        try { stepsArr2 = step.Steps ? JSON.parse(step.Steps) : []; } catch { stepsArr2 = []; }
        
        const stepObj2 = {
          StepId: stepId,
          StepNumber: stepId,
          Role: stepRole,
          Action: stepAction,
          Status: 'skipped',
          AssignedTo: stepRole,
          StartTime: stepsArr2.length > 0 ? stepsArr2[stepsArr2.length-1].EndTime || timestamp : timestamp,
          EndTime: timestamp,
          TAT: stepTat,
          TATStatus: 'Skipped',
          ApprovalStatus: 'Skipped',
          RejectionReason: '',
          NextStep: nextStep,
          PreviousStep: stepId - 1,
          Dependencies: '',
          LastModifiedBy: userEmail,
          LastModifiedAt: timestamp,
        };
        
        if (stepsArr2.length > 0) {
          stepsArr2[stepsArr2.length - 1] = stepObj2;
        } else {
          stepsArr2.push(stepObj2);
        }
        
        await updateRowByIndex(STEPS_SHEET, rowIndex, {
          ...step,
          StepNumber: stepId,
          StepId: stepId,
          NextStep: nextStep,
          PreviousStep: stepId - 1,
          AssignedTo: stepRole,
          Action: stepAction,
          Steps: JSON.stringify(stepsArr2),
          LastModifiedBy: userEmail,
          LastModifiedAt: timestamp,
        });
      }
    }

    // If poId is provided, update SortVendor sheet (for PO-based steps)
    if (poId) {
      const sortVendorData = await db.getTableRows(table('SortVendor'));
      const poData = sortVendorData.find(row => row.POId === poId);
      if (poData) {
        const poRowIndex = sortVendorData.indexOf(poData) + 2;
        await updateRowByIndex('SortVendor', poRowIndex, {
          ...poData,
          StepId: nextStep,
          NextStep: nextStep + 1,
          Action: stepAction,
          Status: 'skipped',
          LastModifiedBy: userEmail,
          LastModifiedAt: timestamp
        });
      }
    }

    return true;
  },

  /**
   * Complete Follow-up for Quotation step: update PurchaseFlow and PurchaseFlowSteps for the indent
   */
  async completeFollowUpQuotationStep({ indentNumber, userEmail }) {
    // 1. Update PurchaseFlow: set CurrentStep to 4
    const flows = await db.getTableRows(table(SHEET_NAME));
    const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
    if (flowIdx !== -1) {
      const rowIndex = flowIdx + 2;
      const flow = flows[flowIdx];
      let stepsArr = [];
      try { stepsArr = flow.Steps ? JSON.parse(flow.Steps) : []; } catch { stepsArr = []; }
      // Replace last step with step 4 object
      const timestamp = new Date().toISOString();
      const step4Obj = {
        StepId: 4,
        StepNumber: 4,
        Role: 'Purchase Executive',
        Action: 'FollowUpQuotations',
        Status: 'completed',
        AssignedTo: 'Purchase Executive',
        StartTime: stepsArr.length > 0 ? stepsArr[stepsArr.length-1].EndTime || timestamp : timestamp,
        EndTime: timestamp,
        TAT: '2',
        TATStatus: 'On Time',
        ApprovalStatus: 'Pending',
        RejectionReason: '',
        NextStep: 5,
        PreviousStep: 3,
        Dependencies: '',
        LastModifiedBy: userEmail,
        LastModifiedAt: timestamp,
      };
      if (stepsArr.length > 0) {
        stepsArr[stepsArr.length - 1] = step4Obj;
      } else {
        stepsArr.push(step4Obj);
      }
      await updateRowByIndex(SHEET_NAME, rowIndex, {
        ...flow,
        CurrentStep: 5, // Move to next step after completion
        Steps: JSON.stringify(stepsArr),
        UpdatedAt: timestamp,
        LastModifiedBy: userEmail,
      });
    }
    // 2. Update PurchaseFlowSteps: update the indent row as stepId and stepNumber 4, nextStep 5, prevStep 3, assignedTo Purchase Executive, action FollowUpQuotations, and update Steps array
    const steps = await db.getTableRows(table(STEPS_SHEET));
    const stepIdx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.StepNumber) === '3');
    if (stepIdx !== -1) {
      const rowIndex = stepIdx + 2;
      const step = steps[stepIdx];
      let stepsArr2 = [];
      try { stepsArr2 = step.Steps ? JSON.parse(step.Steps) : []; } catch { stepsArr2 = []; }
      const timestamp = new Date().toISOString();
      const step4Obj2 = {
        StepId: 4,
        StepNumber: 4,
        Role: 'Purchase Executive',
        Action: 'FollowUpQuotations',
        Status: 'completed',
        AssignedTo: 'Purchase Executive',
        StartTime: stepsArr2.length > 0 ? stepsArr2[stepsArr2.length-1].EndTime || timestamp : timestamp,
        EndTime: timestamp,
        TAT: '2',
        TATStatus: 'On Time',
        ApprovalStatus: 'Pending',
        RejectionReason: '',
        NextStep: 5,
        PreviousStep: 3,
        Dependencies: '',
        LastModifiedBy: userEmail,
        LastModifiedAt: timestamp,
      };
      if (stepsArr2.length > 0) {
        stepsArr2[stepsArr2.length - 1] = step4Obj2;
      } else {
        stepsArr2.push(step4Obj2);
      }
      await updateRowByIndex(STEPS_SHEET, rowIndex, {
        ...step,
        StepNumber: 4,
        StepId: 4,
        NextStep: 5,
        PreviousStep: 3,
        AssignedTo: 'Purchase Executive',
        Action: 'FollowUpQuotations',
        Steps: JSON.stringify(stepsArr2),
        LastModifiedBy: userEmail,
        LastModifiedAt: timestamp,
      });
    }
    return true;
  },

  // Get indents ready for Approve Quotation (next step 6) with quotation lines from Comparative Statement
  async getIndentsForApproveQuotation() {
    try {
      const allMerged = await this.getAllIndents();
      const queued = allMerged.filter((i) => this.isAwaitingApproveQuotation(i));

      const comparativeRows = await db.getTableRows(table('Comparative Statement'));
      const followUpQuotationsData = await db.getTableRows(table('FollowUpQuotations'));
      const vendorData = await db.getTableRows(table('Vendor'));

      const rows = queued.map((indent) => {
        const indentKey = purchaseFlowIndentKey(recordIndentNumber(indent));
        const indentNum = recordIndentNumber(indent) ?? indent.IndentNumber;

        const comparativeStatement = comparativeRows.find(
          (row) => purchaseFlowIndentKey(recordIndentNumber(row)) === indentKey
        );
        const rawComp =
          comparativeStatement?.ComparativeData ?? comparativeStatement?.Data ?? comparativeStatement?.comparativeData;
        const comparativeDataParsed = parseJsonObject(rawComp);

        const fqRows = followUpQuotationsData.filter(
          (row) => purchaseFlowIndentKey(recordIndentNumber(row)) === indentKey
        );
        let quotationDocuments = {};
        for (const row of fqRows) {
          if (row.Quotations != null && row.Quotations !== '') {
            const p = parseJsonObject(row.Quotations);
            quotationDocuments = { ...quotationDocuments, ...p };
          }
        }

        let originalItems = parseJsonArray(indent.Items);
        if (!Array.isArray(originalItems) && originalItems && typeof originalItems === 'object') {
          originalItems = Object.values(originalItems);
        }

        const itemsWithVendors = [];
        for (const [itemCode, itemData] of Object.entries(comparativeDataParsed)) {
          if (!itemData || typeof itemData !== 'object' || Array.isArray(itemData)) continue;

          const originalItem = originalItems.find(
            (item) => (item.itemCode ?? item.ItemCode) === itemCode
          );

          const vendors = [];
          for (const [vendorCode, vendorQuoteData] of Object.entries(itemData)) {
            if (!vendorQuoteData || typeof vendorQuoteData !== 'object' || Array.isArray(vendorQuoteData)) {
              continue;
            }
            const vendorDetails = vendorData.find((v) => v['Vendor Code'] === vendorCode);
            const quotationDoc =
              quotationDocuments[itemCode]?.[vendorCode]?.quotationDocument ??
              vendorQuoteData.quotationDocument ??
              null;
            vendors.push({
              vendorCode,
              vendorName:
                vendorQuoteData.vendorName ||
                vendorDetails?.['Vendor Name'] ||
                vendorCode,
              price: vendorQuoteData.price ?? '',
              deliveryTime: vendorQuoteData.deliveryTime ?? '',
              terms: vendorQuoteData.terms ?? '',
              leadTime: vendorQuoteData.leadTime ?? '',
              best: vendorQuoteData.best || false,
              quotationDocument: quotationDoc,
            });
          }

          itemsWithVendors.push({
            itemCode,
            item: originalItem?.item || originalItem?.itemName || itemCode,
            itemName: originalItem?.item || originalItem?.itemName || itemCode,
            quantity: originalItem?.quantity ?? originalItem?.Quantity ?? '',
            specifications: originalItem?.specifications ?? originalItem?.Specifications ?? '',
            vendors,
          });
        }

        return {
          ...indent,
          IndentNumber: indentNum,
          Items: itemsWithVendors,
        };
      });

      const seen = new Set();
      return rows.filter((r) => {
        if (!r.IndentNumber || seen.has(r.IndentNumber)) return false;
        seen.add(r.IndentNumber);
        return true;
      });
    } catch (error) {
      console.error('Error fetching indents for Approve Quotation:', error);
      return [];
    }
  },

  // Enhanced approve quotation method for multiple items per indent
  async approveQuotationEnhanced({ indentNumber, approvalData, userEmail }) {
    try {
      // 1. Save to SheetApproveQuotation with enhanced structure
      const rows = await db.getTableRows(table('SheetApproveQuotation'));
      const idx = rows.findIndex(r => r.IndentNumber === indentNumber);
      const now = new Date().toISOString();
      
      const rowData = {
        IndentNumber: indentNumber,
        ApprovedQuotation: JSON.stringify(approvalData),
        ApprovedBy: userEmail,
        ApprovedAt: now,
        SampleRequired: 'Mixed' // Since we now have per-item sample requirements
      };
      
      if (idx !== -1) {
        await updateRowByIndex('SheetApproveQuotation', idx + 2, { ...rows[idx], ...rowData });
      } else {
        await db.insertTableRow(table('SheetApproveQuotation'), rowData);
      }
      
      // Determine next step based on sample requirements
      // If all items have sampleRequired: false, skip steps 7 and 8, go directly to step 9
      // If any item has sampleRequired: true, go to step 7 (Request Sample)
      const hasAnySampleRequired = Object.values(approvalData).some(item => item.sampleRequired === true);
      const nextStep = hasAnySampleRequired ? 7 : 9;
      
      // 2. Update PurchaseFlow: set CurrentStep to 6 and update Steps array
      const flows = await db.getTableRows(table(SHEET_NAME));
      const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
      if (flowIdx !== -1) {
        const rowIndex = flowIdx + 2;
        const flow = flows[flowIdx];
        let stepsArr = [];
        try { stepsArr = flow.Steps ? JSON.parse(flow.Steps) : []; } catch { stepsArr = []; }
        
        // Replace last step with step 6 object
        const step6Obj = {
          StepId: 6,
          StepNumber: 6,
          Role: 'Management / HOD',
          Action: 'Approve Quotation',
          Status: 'completed',
          AssignedTo: userEmail || 'Management / HOD',
          StartTime: stepsArr.length > 0 ? stepsArr[stepsArr.length-1].EndTime || now : now,
          EndTime: now,
          TAT: '1',
          TATStatus: 'On Time',
          ApprovalStatus: 'Approved',
          RejectionReason: '',
          NextStep: nextStep,
          PreviousStep: 5,
          Dependencies: '',
          LastModifiedBy: userEmail,
          LastModifiedAt: now,
        };
        
        if (stepsArr.length > 0) {
          stepsArr[stepsArr.length - 1] = step6Obj;
        } else {
          stepsArr.push(step6Obj);
        }
        
        await updateRowByIndex(SHEET_NAME, rowIndex, {
          ...flow,
          CurrentStep: 6,
          Steps: JSON.stringify(stepsArr),
          UpdatedAt: now,
          LastModifiedBy: userEmail,
        });
      }
      
      // 3. Update PurchaseFlowSteps: update the indent row as stepId and stepNumber 6, nextStep 7, prevStep 5
      const steps = await db.getTableRows(table(STEPS_SHEET));
      // Try to find step 5 first, if not found, try to find any step for this indent
      let stepIdx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.StepNumber) === '5');
      if (stepIdx === -1) {
        // If step 5 not found, find the latest step for this indent
        const indentSteps = steps.filter(s => s.IndentNumber === indentNumber);
        if (indentSteps.length > 0) {
          // Find the step with highest step number
          const latestStep = indentSteps.reduce((prev, current) => {
            const prevNum = parseInt(prev.StepNumber) || 0;
            const currNum = parseInt(current.StepNumber) || 0;
            return currNum > prevNum ? current : prev;
          });
          stepIdx = steps.findIndex(s => s === latestStep);
        }
      }
      
      if (stepIdx !== -1) {
        const rowIndex = stepIdx + 2;
        const step = steps[stepIdx];
        let stepsArr2 = [];
        try { stepsArr2 = step.Steps ? JSON.parse(step.Steps) : []; } catch { stepsArr2 = []; }
        
        const step6Obj2 = {
          StepId: 6,
          StepNumber: 6,
          Role: 'Management / HOD',
          Action: 'Approve Quotation',
          Status: 'completed',
          AssignedTo: userEmail || 'Management / HOD',
          StartTime: stepsArr2.length > 0 ? stepsArr2[stepsArr2.length-1].EndTime || now : now,
          EndTime: now,
          TAT: '1',
          TATStatus: 'On Time',
          ApprovalStatus: 'Approved',
          RejectionReason: '',
          NextStep: nextStep,
          PreviousStep: 5,
          Dependencies: '',
          LastModifiedBy: userEmail,
          LastModifiedAt: now,
        };
        
        if (stepsArr2.length > 0) {
          stepsArr2[stepsArr2.length - 1] = step6Obj2;
        } else {
          stepsArr2.push(step6Obj2);
        }
        
        await updateRowByIndex(STEPS_SHEET, rowIndex, {
          ...step,
          StepNumber: 6,
          StepId: 6,
          NextStep: nextStep,
          PreviousStep: 5,
          AssignedTo: userEmail || 'Management / HOD',
          Action: 'Approve Quotation',
          Status: 'completed',
          Steps: JSON.stringify(stepsArr2),
          LastModifiedBy: userEmail,
          LastModifiedAt: now,
        });
      } else {
        // If no step found, create a new one
        await db.insertTableRow(table(STEPS_SHEET), {
          IndentNumber: indentNumber,
          StepNumber: 6,
          StepId: 6,
          NextStep: nextStep,
          PreviousStep: 5,
          AssignedTo: userEmail || 'Management / HOD',
          Action: 'Approve Quotation',
          Status: 'completed',
          Role: 'Management / HOD',
          Steps: JSON.stringify([{
            StepId: 6,
            StepNumber: 6,
            Role: 'Management / HOD',
            Action: 'Approve Quotation',
            Status: 'completed',
            AssignedTo: userEmail || 'Management / HOD',
            StartTime: now,
            EndTime: now,
            TAT: '1',
            TATStatus: 'On Time',
            ApprovalStatus: 'Approved',
            NextStep: 7,
            PreviousStep: 5,
            LastModifiedBy: userEmail,
            LastModifiedAt: now,
          }]),
          LastModifiedBy: userEmail,
          LastModifiedAt: now,
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error in approveQuotationEnhanced:', error);
      throw error;
    }
  },

  // Get indents for Request Sample step (next step is 7)
  async getIndentsForRequestSample() {
    try {
      // Get indents where next step is 7 OR step 6 is completed
      const stepData = await db.getTableRows(table('PurchaseFlowSteps'));
      
      // First, get indents with NextStep === '7'
      const indentsWithNextStep7 = stepData.filter(row => String(row.NextStep) === '7');
      
      // Then, get indents with step 6 completed that don't already have NextStep === '7'
      const step6Completed = stepData.filter(row => 
        String(row.StepNumber) === '6' && 
        String(row.StepId) === '6' && 
        row.Status === 'completed' &&
        !indentsWithNextStep7.some(indent => indent.IndentNumber === row.IndentNumber)
      );
      
      // Combine both lists
      const indentsForStep7 = [...indentsWithNextStep7, ...step6Completed];
      
      // Get unique indent numbers to avoid duplicates
      const uniqueIndentNumbers = [...new Set(indentsForStep7.map(row => row.IndentNumber))];
      
      // Get indent details from PurchaseFlow sheet
      const purchaseFlowData = await db.getTableRows(table('PurchaseFlow'));
      const indentsWithDetails = uniqueIndentNumbers.map(indentNumber => {
        const step = indentsForStep7.find(row => row.IndentNumber === indentNumber);
        // Get the first matching indent detail (in case there are duplicates in PurchaseFlow)
        const indentDetail = purchaseFlowData.find(row => row.IndentNumber === indentNumber);
        return {
          ...step,
          ...indentDetail,
          IndentNumber: indentNumber
        };
      }).filter(indent => indent.IndentNumber); // Filter out any undefined entries
      // Get approved quotation data
      const approvedQuotationData = await db.getTableRows(table('SheetApproveQuotation'));
      // Get vendor data
      const vendorData = await db.getTableRows(table('Vendor'));
      // Get RequestSample data for tracking status
      const requestSampleData = await db.getTableRows(table('RequestSample'));
      const result = indentsWithDetails.map(indent => {
        // Find approved quotation for this indent
        const approvedQuotation = approvedQuotationData.find(row => row.IndentNumber === indent.IndentNumber);
        
        let itemsWithApprovedVendors = [];
        
        if (approvedQuotation && approvedQuotation.ApprovedQuotation) {
          try {
            // Parse approved quotation data
            const approvedData = typeof approvedQuotation.ApprovedQuotation === 'string' 
              ? JSON.parse(approvedQuotation.ApprovedQuotation) 
              : approvedQuotation.ApprovedQuotation;
            // Get original items data from the indent
            let originalItems = [];
            if (indent.Items) {
              try {
                originalItems = typeof indent.Items === 'string' 
                  ? JSON.parse(indent.Items) 
                  : indent.Items;
              } catch (e) {
                console.error('Error parsing original items:', e);
              }
            }
            
            // Convert approved data to items with approved vendors
            // Filter to only include items where sampleRequired is true
            itemsWithApprovedVendors = Object.entries(approvedData)
              .filter(([itemCode, itemData]) => itemData.sampleRequired === true)
              .map(([itemCode, itemData]) => {
                // Find original item data
                const originalItem = originalItems.find(item => item.itemCode === itemCode);
                
                // Find vendor details
                const vendorDetails = vendorData.find(v => v['Vendor Code'] === itemData.selectedVendor.vendorCode);
                
                return {
                  itemCode: itemCode,
                  item: originalItem?.item || originalItem?.itemName || itemCode,
                  itemName: originalItem?.item || originalItem?.itemName || itemCode,
                  quantity: originalItem?.quantity || '',
                  specifications: originalItem?.specifications || '',
                  approvedVendor: {
                    vendorCode: itemData.selectedVendor.vendorCode,
                    vendorName: itemData.selectedVendor.vendorName || vendorDetails?.['Vendor Name'] || itemData.selectedVendor.vendorCode,
                    vendorContact: vendorDetails?.['Vendor Contact'] || '',
                    vendorEmail: vendorDetails?.['Vendor Email'] || '',
                    price: itemData.selectedVendor.price,
                    deliveryTime: itemData.selectedVendor.deliveryTime,
                    terms: itemData.selectedVendor.terms,
                    leadTime: itemData.selectedVendor.leadTime,
                    best: itemData.selectedVendor.best,
                    quotationDocument: itemData.selectedVendor.quotationDocument
                  },
                  sampleRequired: itemData.sampleRequired || false
                };
              });
          } catch (error) {
            console.error('Error parsing approved quotation data for indent', indent.IndentNumber, ':', error);
          }
        } else {
        }
        
        const result = {
          ...indent,
          IndentNumber: indent.IndentNumber,
          Items: itemsWithApprovedVendors
        };
        
        // Only process if there are items requiring samples
        if (itemsWithApprovedVendors.length > 0) {
          // Add tracking data from RequestSample sheet
          const requestSampleRow = requestSampleData.find(row => row.IndentNumber === indent.IndentNumber);
          if (requestSampleRow && requestSampleRow.SampleData) {
            try {
              const sampleData = JSON.parse(requestSampleRow.SampleData);
              result.Items = result.Items.map(item => {
                const itemTrackingData = sampleData[item.itemCode] || {};
                const vendorTrackingData = itemTrackingData[item.approvedVendor.vendorCode] || {};
                
                return {
                  ...item,
                  status: vendorTrackingData.status || 'Yet to Ask for Sample',
                  trackingStatus: vendorTrackingData.trackingStatus || 'Not Started'
                };
              });
            } catch (error) {
              console.error('Error parsing sample data for indent', indent.IndentNumber, ':', error);
            }
          }
        }
        return result;
      });
      
      // Filter out duplicates by IndentNumber (in case there are multiple entries)
      const seen = new Set();
      const uniqueResults = result.filter(indent => {
        if (seen.has(indent.IndentNumber)) {
          return false;
        }
        seen.add(indent.IndentNumber);
        return true;
      });
      
      return uniqueResults;
      
    } catch (error) {
      console.error('Error fetching indents for Request Sample:', error);
      throw error;
    }
  },

  // Update sample tracking status
  async updateSampleTrackingStatus({ indentNumber, itemCode, vendorCode, status, trackingStatus, userEmail }) {
    try {
      // Get existing RequestSample data
      const requestSampleData = await db.getTableRows(table('RequestSample'));
      const existingRow = requestSampleData.find(row => row.IndentNumber === indentNumber);
      
      let sampleData = {};
      if (existingRow && existingRow.SampleData) {
        try {
          sampleData = JSON.parse(existingRow.SampleData);
        } catch (e) {
          console.error('Error parsing existing sample data:', e);
        }
      }
      
      // Update or add tracking data for this item-vendor combination
      if (!sampleData[itemCode]) {
        sampleData[itemCode] = {};
      }
      
      sampleData[itemCode][vendorCode] = {
        status: status,
        trackingStatus: trackingStatus,
        lastUpdatedBy: userEmail,
        lastUpdatedAt: new Date().toISOString()
      };
      
      // Save updated data
      const rowData = {
        IndentNumber: indentNumber,
        SampleData: JSON.stringify(sampleData),
        CreatedBy: existingRow?.CreatedBy || userEmail,
        CreatedAt: existingRow?.CreatedAt || new Date().toISOString(),
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString()
      };
      
      if (existingRow) {
        const rowIndex = requestSampleData.indexOf(existingRow) + 2;
        await updateRowByIndex('RequestSample', rowIndex, rowData);
      } else {
        await db.insertTableRow(table('RequestSample'), rowData);
      }
      
      return { success: true, message: 'Sample tracking status updated successfully' };
      
    } catch (error) {
      console.error('Error updating sample tracking status:', error);
      throw error;
    }
  },

  // Complete Request Sample step
  async completeRequestSampleStep({ indentNumber, userEmail }) {
    try {
      // 1. Update PurchaseFlow: set CurrentStep to 7
      const flows = await db.getTableRows(table(SHEET_NAME));
      const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
      if (flowIdx !== -1) {
        const rowIndex = flowIdx + 2;
        const flow = flows[flowIdx];
        let stepsArr = [];
        try { stepsArr = flow.Steps ? JSON.parse(flow.Steps) : []; } catch { stepsArr = []; }
        
        const timestamp = new Date().toISOString();
        const step7Obj = {
          StepId: 7,
          StepNumber: 7,
          Role: 'QC Manager',
          Action: 'Request and Follow up for Sample',
          Status: 'completed',
          AssignedTo: 'QC Manager',
          StartTime: stepsArr.length > 0 ? stepsArr[stepsArr.length-1].EndTime || timestamp : timestamp,
          EndTime: timestamp,
          TAT: '3',
          TATStatus: 'On Time',
          ApprovalStatus: 'Approved',
          RejectionReason: '',
          NextStep: 8,
          PreviousStep: 6,
          Dependencies: '',
          LastModifiedBy: userEmail,
          LastModifiedAt: timestamp,
        };
        
        if (stepsArr.length > 0) {
          stepsArr[stepsArr.length - 1] = step7Obj;
        } else {
          stepsArr.push(step7Obj);
        }
        
        await updateRowByIndex(SHEET_NAME, rowIndex, {
          ...flow,
          CurrentStep: 7,
          Steps: JSON.stringify(stepsArr),
          UpdatedAt: timestamp,
          LastModifiedBy: userEmail,
        });
      }
      
      // 2. Update PurchaseFlowSteps: update the indent row as stepId and stepNumber 7, nextStep 8, prevStep 6, assignedTo QC Manager, action Request and Follow up for Sample
      const steps = await db.getTableRows(table(STEPS_SHEET));
      const stepIdx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.StepNumber) === '6');
      if (stepIdx !== -1) {
        const rowIndex = stepIdx + 2;
        const step = steps[stepIdx];
        let stepsArr2 = [];
        try { stepsArr2 = step.Steps ? JSON.parse(step.Steps) : []; } catch { stepsArr2 = []; }
        
        const timestamp = new Date().toISOString();
        const step7Obj2 = {
          StepId: 7,
          StepNumber: 7,
          Role: 'QC Manager',
          Action: 'Request and Follow up for Sample',
          Status: 'completed',
          AssignedTo: 'QC Manager',
          StartTime: stepsArr2.length > 0 ? stepsArr2[stepsArr2.length-1].EndTime || timestamp : timestamp,
          EndTime: timestamp,
          TAT: '3',
          TATStatus: 'On Time',
          ApprovalStatus: 'Approved',
          RejectionReason: '',
          NextStep: 8,
          PreviousStep: 6,
          Dependencies: '',
          LastModifiedBy: userEmail,
          LastModifiedAt: timestamp,
        };
        
        if (stepsArr2.length > 0) {
          stepsArr2[stepsArr2.length - 1] = step7Obj2;
        } else {
          stepsArr2.push(step7Obj2);
        }
        
        await updateRowByIndex(STEPS_SHEET, rowIndex, {
          ...step,
          StepNumber: 7,
          StepId: 7,
          NextStep: 8,
          PreviousStep: 6,
          AssignedTo: 'QC Manager',
          Action: 'Request and Follow up for Sample',
          Status: 'completed',
          Steps: JSON.stringify(stepsArr2),
          LastModifiedBy: userEmail,
          LastModifiedAt: timestamp,
        });
      }
      
      return { success: true, message: 'Request Sample step completed successfully' };
      
    } catch (error) {
      console.error('Error completing Request Sample step:', error);
      throw error;
    }
  },

  // Get indents for Approve Sample step (next step is 8)
  async getIndentsForApproveSample() {
    try {
      // Get indents where next step is 8 OR step 7 is completed
      const stepData = await db.getTableRows(table('PurchaseFlowSteps'));
      
      // First, get indents with NextStep === '8'
      const indentsWithNextStep8 = stepData.filter(row => String(row.NextStep) === '8');
      
      // Then, get indents with step 7 completed that don't already have NextStep === '8'
      const step7Completed = stepData.filter(row => 
        String(row.StepNumber) === '7' && 
        String(row.StepId) === '7' && 
        row.Status === 'completed' &&
        !indentsWithNextStep8.some(indent => indent.IndentNumber === row.IndentNumber)
      );
      
      // Combine both lists
      const indentsForStep8 = [...indentsWithNextStep8, ...step7Completed];
      
      // Get unique indent numbers to avoid duplicates
      const uniqueIndentNumbers = [...new Set(indentsForStep8.map(row => row.IndentNumber))];
      
      // Get indent details from PurchaseFlow sheet
      const purchaseFlowData = await db.getTableRows(table('PurchaseFlow'));
      const indentsWithDetails = uniqueIndentNumbers.map(indentNumber => {
        const step = indentsForStep8.find(row => row.IndentNumber === indentNumber);
        // Get the first matching indent detail (in case there are duplicates in PurchaseFlow)
        const indentDetail = purchaseFlowData.find(row => row.IndentNumber === indentNumber);
        return {
          ...step,
          ...indentDetail,
          IndentNumber: indentNumber
        };
      }).filter(indent => indent.IndentNumber); // Filter out any undefined entries
      // Get approved quotation data
      const approvedQuotationData = await db.getTableRows(table('SheetApproveQuotation'));
      // Get vendor data
      const vendorData = await db.getTableRows(table('Vendor'));
      // Get InspectSample data for existing approvals/rejections
      const inspectSampleData = await db.getTableRows(table(config.sheets.inspectSample));
      const result = indentsWithDetails.map(indent => {
        // Find approved quotation for this indent
        const approvedQuotation = approvedQuotationData.find(row => row.IndentNumber === indent.IndentNumber);
        
        // Find existing inspection data for this indent
        const existingInspection = inspectSampleData.find(row => row.IndentNumber === indent.IndentNumber);
        let sampleData = {};
        if (existingInspection && existingInspection.Data) {
          try {
            sampleData = JSON.parse(existingInspection.Data);
          } catch (e) {
            console.error('Error parsing existing sample data for indent', indent.IndentNumber, ':', e);
          }
        }
        
        let itemsWithApprovedVendors = [];
        
        if (approvedQuotation && approvedQuotation.ApprovedQuotation) {
          try {
            // Parse approved quotation data
            const approvedData = typeof approvedQuotation.ApprovedQuotation === 'string' 
              ? JSON.parse(approvedQuotation.ApprovedQuotation) 
              : approvedQuotation.ApprovedQuotation;
            // Get original items data from the indent
            let originalItems = [];
            if (indent.Items) {
              try {
                originalItems = typeof indent.Items === 'string' 
                  ? JSON.parse(indent.Items) 
                  : indent.Items;
              } catch (e) {
                console.error('Error parsing original items:', e);
              }
            }
            
            // Convert approved data to items with approved vendors
            // Filter to only include items where sampleRequired is true
            itemsWithApprovedVendors = Object.entries(approvedData)
              .filter(([itemCode, itemData]) => itemData.sampleRequired === true)
              .map(([itemCode, itemData]) => {
                // Find original item data
                const originalItem = originalItems.find(item => item.itemCode === itemCode);
                
                // Find vendor details
                const vendorDetails = vendorData.find(v => v['Vendor Code'] === itemData.selectedVendor.vendorCode);
                
                // Get inspection status from the new data structure
                const itemSampleData = sampleData[itemCode] || {};
                
                return {
                  itemCode: itemCode,
                  item: originalItem?.item || originalItem?.itemName || itemCode,
                  itemName: originalItem?.item || originalItem?.itemName || itemCode,
                  quantity: originalItem?.quantity || '',
                  specifications: originalItem?.specifications || '',
                  approvedVendor: {
                    vendorCode: itemData.selectedVendor.vendorCode,
                    vendorName: itemData.selectedVendor.vendorName || vendorDetails?.['Vendor Name'] || itemData.selectedVendor.vendorCode,
                    vendorContact: vendorDetails?.['Vendor Contact'] || '',
                    vendorEmail: vendorDetails?.['Vendor Email'] || '',
                    price: itemData.selectedVendor.price,
                    deliveryTime: itemData.selectedVendor.deliveryTime,
                    terms: itemData.selectedVendor.terms,
                    leadTime: itemData.selectedVendor.leadTime,
                    best: itemData.selectedVendor.best,
                    quotationDocument: itemData.selectedVendor.quotationDocument
                  },
                  sampleRequired: itemData.sampleRequired || false,
                  inspectionStatus: itemSampleData.status || 'Pending',
                  inspectionNote: itemSampleData.note || '',
                  rejectionReason: itemSampleData.rejectionReason || '',
                  inspectedBy: itemSampleData.inspectedBy || '',
                  inspectedAt: itemSampleData.inspectedAt || ''
                };
              });
          } catch (error) {
            console.error('Error parsing approved quotation data for indent', indent.IndentNumber, ':', error);
          }
        } else {
        }
        
        // Calculate overall indent status based on individual item statuses
        let overallStatus = 'Pending';
        if (itemsWithApprovedVendors.length > 0) {
          const approvedCount = itemsWithApprovedVendors.filter(item => item.inspectionStatus === 'Approved').length;
          const rejectedCount = itemsWithApprovedVendors.filter(item => item.inspectionStatus === 'Rejected').length;
          const totalCount = itemsWithApprovedVendors.length;
          
          if (approvedCount === totalCount) {
            overallStatus = 'Approved';
          } else if (rejectedCount === totalCount) {
            overallStatus = 'Rejected';
          } else if (approvedCount > 0) {
            overallStatus = 'Partial';
          }
        }
        
        const result = {
          ...indent,
          IndentNumber: indent.IndentNumber,
          Items: itemsWithApprovedVendors,
          overallStatus: overallStatus
        };
        return result;
      });
      
      // Filter out duplicates by IndentNumber (in case there are multiple entries)
      const seen = new Set();
      const uniqueResults = result.filter(indent => {
        if (seen.has(indent.IndentNumber)) {
          return false;
        }
        seen.add(indent.IndentNumber);
        return true;
      });
      
      // Filter out indents that have no items requiring samples
      return uniqueResults.filter(indent => indent.Items && indent.Items.length > 0);
      
    } catch (error) {
      console.error('Error fetching indents for Approve Sample:', error);
      throw error;
    }
  },

  // Approve sample for an indent
  async approveSample({ indentNumber, userEmail, note = '' }) {
    try {
      // 1. Update PurchaseFlow: set CurrentStep to 8 and update Steps array
      const flows = await db.getTableRows(table(SHEET_NAME));
      const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
      if (flowIdx !== -1) {
        const rowIndex = flowIdx + 2;
        const flow = flows[flowIdx];
        let stepsArr = [];
        try { stepsArr = flow.Steps ? JSON.parse(flow.Steps) : []; } catch { stepsArr = []; }
        
        const timestamp = new Date().toISOString();
        const step8Obj = {
          StepId: 8,
          StepNumber: 8,
          Role: 'Purchase Executive',
          Action: 'Inspect Sample',
          Status: 'completed',
          AssignedTo: 'Purchase Executive',
          StartTime: stepsArr.length > 0 ? stepsArr[stepsArr.length-1].EndTime || timestamp : timestamp,
          EndTime: timestamp,
          TAT: '1',
          TATStatus: 'On Time',
          ApprovalStatus: 'Approved',
          RejectionReason: '',
          NextStep: 9,
          PreviousStep: 7,
          Dependencies: '',
          LastModifiedBy: userEmail,
          LastModifiedAt: timestamp,
        };
        
        if (stepsArr.length > 0) {
          stepsArr[stepsArr.length - 1] = step8Obj;
        } else {
          stepsArr.push(step8Obj);
        }
        
        await updateRowByIndex(SHEET_NAME, rowIndex, {
          ...flow,
          CurrentStep: 8,
          Steps: JSON.stringify(stepsArr),
          UpdatedAt: timestamp,
          LastModifiedBy: userEmail,
        });
      }
      
      // 2. Update PurchaseFlowSteps: update the indent row as stepId and stepNumber 8, nextStep 9, prevStep 7, assignedTo Purchase Executive, action Inspect Sample
      const steps = await db.getTableRows(table(STEPS_SHEET));
      const stepIdx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.NextStep) === '8');
      if (stepIdx !== -1) {
        const rowIndex = stepIdx + 2;
        const step = steps[stepIdx];
        let stepsArr2 = [];
        try { stepsArr2 = step.Steps ? JSON.parse(step.Steps) : []; } catch { stepsArr2 = []; }
        
        const timestamp = new Date().toISOString();
        const step8Obj2 = {
          StepId: 8,
          StepNumber: 8,
          Role: 'Purchase Executive',
          Action: 'Inspect Sample',
          Status: 'completed',
          AssignedTo: 'Purchase Executive',
          StartTime: stepsArr2.length > 0 ? stepsArr2[stepsArr2.length-1].EndTime || timestamp : timestamp,
          EndTime: timestamp,
          TAT: '1',
          TATStatus: 'On Time',
          ApprovalStatus: 'Approved',
          RejectionReason: '',
          NextStep: 9,
          PreviousStep: 7,
          Dependencies: '',
          LastModifiedBy: userEmail,
          LastModifiedAt: timestamp,
        };
        
        if (stepsArr2.length > 0) {
          stepsArr2[stepsArr2.length - 1] = step8Obj2;
        } else {
          stepsArr2.push(step8Obj2);
        }
        
        await updateRowByIndex(STEPS_SHEET, rowIndex, {
          ...step,
          StepNumber: 8,
          StepId: 8,
          NextStep: 9,
          PreviousStep: 7,
          AssignedTo: 'Purchase Executive',
          Action: 'Inspect Sample',
          Steps: JSON.stringify(stepsArr2),
          LastModifiedBy: userEmail,
          LastModifiedAt: timestamp,
        });
      }
      
      // 3. Update InspectSample sheet with approval
      const approvedQuotationData = await db.getTableRows(table('SheetApproveQuotation'));
      const approvedQuotation = approvedQuotationData.find(row => row.IndentNumber === indentNumber);
      
      if (approvedQuotation && approvedQuotation.ApprovedQuotation) {
        try {
          const approvedData = typeof approvedQuotation.ApprovedQuotation === 'string' 
            ? JSON.parse(approvedQuotation.ApprovedQuotation) 
            : approvedQuotation.ApprovedQuotation;
          
          // Update InspectSample for each approved vendor
          Object.entries(approvedData).forEach(async ([itemCode, itemData]) => {
            const vendorCode = itemData.selectedVendor.vendorCode;
            
            // Check if entry exists
            const inspectSamples = await db.getTableRows(table(config.sheets.inspectSample));
            const existingIdx = inspectSamples.findIndex(
              row => row.IndentNumber === indentNumber && row.VendorCode === vendorCode
            );
            
            const rowData = {
              IndentNumber: indentNumber,
              VendorCode: vendorCode,
              Note: note || '',
              Status: 'Approved',
              Action: 'Inspect Sample',
              InspectedBy: userEmail,
              InspectedAt: new Date().toISOString(),
              RejectionReason: '',
            };
            
            if (existingIdx !== -1) {
              await updateRowByIndex(config.sheets.inspectSample, existingIdx + 2, rowData);
            } else {
              await db.insertTableRow(table(config.sheets.inspectSample), rowData);
            }
          });
        } catch (error) {
          console.error('Error updating InspectSample for approved vendors:', error);
        }
      }
      return { success: true, message: 'Sample approved successfully' };
      
    } catch (error) {
      console.error('Error approving sample:', error);
      throw error;
    }
  },

  // Reject sample for an indent
  async rejectSample({ indentNumber, userEmail, rejectionReason, note = '' }) {
    try {
      // 1. Update PurchaseFlow: set CurrentStep to 8 and update Steps array (but keep next step as 8 for rejection)
      const flows = await db.getTableRows(table(SHEET_NAME));
      const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
      if (flowIdx !== -1) {
        const rowIndex = flowIdx + 2;
        const flow = flows[flowIdx];
        let stepsArr = [];
        try { stepsArr = flow.Steps ? JSON.parse(flow.Steps) : []; } catch { stepsArr = []; }
        
        const timestamp = new Date().toISOString();
        const step8Obj = {
          StepId: 8,
          StepNumber: 8,
          Role: 'Purchase Executive',
          Action: 'Inspect Sample',
          Status: 'rejected',
          AssignedTo: 'Purchase Executive',
          StartTime: stepsArr.length > 0 ? stepsArr[stepsArr.length-1].EndTime || timestamp : timestamp,
          EndTime: timestamp,
          TAT: '1',
          TATStatus: 'On Time',
          ApprovalStatus: 'Rejected',
          RejectionReason: rejectionReason,
          NextStep: 8, // Keep at step 8 until approved
          PreviousStep: 7,
          Dependencies: '',
          LastModifiedBy: userEmail,
          LastModifiedAt: timestamp,
        };
        
        if (stepsArr.length > 0) {
          stepsArr[stepsArr.length - 1] = step8Obj;
        } else {
          stepsArr.push(step8Obj);
        }
        
        await updateRowByIndex(SHEET_NAME, rowIndex, {
          ...flow,
          CurrentStep: 8,
          Status: 'Rejected',
          Steps: JSON.stringify(stepsArr),
          UpdatedAt: timestamp,
          LastModifiedBy: userEmail,
        });
      }
      
      // 2. Update PurchaseFlowSteps: update the indent row as stepId and stepNumber 8, nextStep 8 (keep at 8), prevStep 7, assignedTo Purchase Executive, action Inspect Sample
      const steps = await db.getTableRows(table(STEPS_SHEET));
      const stepIdx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.NextStep) === '8');
      if (stepIdx !== -1) {
        const rowIndex = stepIdx + 2;
        const step = steps[stepIdx];
        let stepsArr2 = [];
        try { stepsArr2 = step.Steps ? JSON.parse(step.Steps) : []; } catch { stepsArr2 = []; }
        
        const timestamp = new Date().toISOString();
        const step8Obj2 = {
          StepId: 8,
          StepNumber: 8,
          Role: 'Purchase Executive',
          Action: 'Inspect Sample',
          Status: 'rejected',
          AssignedTo: 'Purchase Executive',
          StartTime: stepsArr2.length > 0 ? stepsArr2[stepsArr2.length-1].EndTime || timestamp : timestamp,
          EndTime: timestamp,
          TAT: '1',
          TATStatus: 'On Time',
          ApprovalStatus: 'Rejected',
          RejectionReason: rejectionReason,
          NextStep: 8, // Keep at step 8 until approved
          PreviousStep: 7,
          Dependencies: '',
          LastModifiedBy: userEmail,
          LastModifiedAt: timestamp,
        };
        
        if (stepsArr2.length > 0) {
          stepsArr2[stepsArr2.length - 1] = step8Obj2;
        } else {
          stepsArr2.push(step8Obj2);
        }
        
        await updateRowByIndex(STEPS_SHEET, rowIndex, {
          ...step,
          StepNumber: 8,
          StepId: 8,
          NextStep: 8, // Keep at step 8 until approved
          PreviousStep: 7,
          AssignedTo: 'Purchase Executive',
          Action: 'Inspect Sample',
          Status: 'rejected',
          Steps: JSON.stringify(stepsArr2),
          LastModifiedBy: userEmail,
          LastModifiedAt: timestamp,
          RejectionReason: rejectionReason,
        });
      }
      
      // 3. Update InspectSample sheet with rejection
      const approvedQuotationData = await db.getTableRows(table('SheetApproveQuotation'));
      const approvedQuotation = approvedQuotationData.find(row => row.IndentNumber === indentNumber);
      
      if (approvedQuotation && approvedQuotation.ApprovedQuotation) {
        try {
          const approvedData = typeof approvedQuotation.ApprovedQuotation === 'string' 
            ? JSON.parse(approvedQuotation.ApprovedQuotation) 
            : approvedQuotation.ApprovedQuotation;
          
          // Update InspectSample for each approved vendor
          Object.entries(approvedData).forEach(async ([itemCode, itemData]) => {
            const vendorCode = itemData.selectedVendor.vendorCode;
            
            // Check if entry exists
            const inspectSamples = await db.getTableRows(table(config.sheets.inspectSample));
            const existingIdx = inspectSamples.findIndex(
              row => row.IndentNumber === indentNumber && row.VendorCode === vendorCode
            );
            
            const rowData = {
              IndentNumber: indentNumber,
              VendorCode: vendorCode,
              Note: note || '',
              Status: 'Rejected',
              Action: 'Inspect Sample',
              InspectedBy: userEmail,
              RejectionReason: rejectionReason,
            };
            
            if (existingIdx !== -1) {
              await updateRowByIndex(config.sheets.inspectSample, existingIdx + 2, rowData);
            } else {
              await db.insertTableRow(table(config.sheets.inspectSample), rowData);
            }
          });
        } catch (error) {
          console.error('Error updating InspectSample for rejected vendors:', error);
        }
      }
      return { success: true, message: 'Sample rejected successfully' };
      
    } catch (error) {
      console.error('Error rejecting sample:', error);
      throw error;
    }
  },

  // Approve sample for a specific item
  async approveSampleItem({ indentNumber, itemCode, vendorCode, userEmail, note = '' }) {
    try {
      // 1. Update InspectSample sheet with approval for this specific item-vendor combination
      const inspectSamples = await db.getTableRows(table(config.sheets.inspectSample));
      const existingIdx = inspectSamples.findIndex(row => row.IndentNumber === indentNumber);
      
      // Get approved quotation data to get all items for this indent
      const quotationData = await db.getTableRows(table('SheetApproveQuotation'));
      const quotation = quotationData.find(row => row.IndentNumber === indentNumber);
      
      let sampleData = {};
      if (existingIdx !== -1 && inspectSamples[existingIdx].Data) {
        try {
          sampleData = JSON.parse(inspectSamples[existingIdx].Data);
        } catch (e) {
          console.error('Error parsing existing sample data:', e);
        }
      }
      
      // If no existing data, initialize with approved quotation data
      if (Object.keys(sampleData).length === 0 && quotation && quotation.ApprovedQuotation) {
        try {
          const approvedData = typeof quotation.ApprovedQuotation === 'string' 
            ? JSON.parse(quotation.ApprovedQuotation) 
            : quotation.ApprovedQuotation;
          
          // Initialize sample data structure
          Object.keys(approvedData).forEach(itemCode => {
            sampleData[itemCode] = {
              vendorCode: approvedData[itemCode].selectedVendor.vendorCode,
              vendorName: approvedData[itemCode].selectedVendor.vendorName,
              status: 'Pending',
              note: '',
              rejectionReason: '',
              inspectedBy: '',
              inspectedAt: ''
            };
          });
        } catch (error) {
          console.error('Error initializing sample data from approved quotation:', error);
        }
      }
      
      // Update the specific item's status
      if (sampleData[itemCode]) {
        sampleData[itemCode] = {
          ...sampleData[itemCode],
          status: 'Approved',
          note: note || '',
          rejectionReason: '', // Clear rejection reason when approving
          inspectedBy: userEmail,
          inspectedAt: new Date().toISOString()
        };
      }
      
      const rowData = {
        IndentNumber: indentNumber,
        Data: JSON.stringify(sampleData),
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString()
      };
      
      if (existingIdx !== -1) {
        await updateRowByIndex(config.sheets.inspectSample, existingIdx + 2, rowData);
      } else {
        await db.insertTableRow(table(config.sheets.inspectSample), rowData);
      }
      
      // 2. Check if all items in this indent are approved
      const approvedQuotationData = await db.getTableRows(table('SheetApproveQuotation'));
      const approvedQuotation = approvedQuotationData.find(row => row.IndentNumber === indentNumber);
      
      if (approvedQuotation && approvedQuotation.ApprovedQuotation) {
        try {
          const approvedData = typeof approvedQuotation.ApprovedQuotation === 'string' 
            ? JSON.parse(approvedQuotation.ApprovedQuotation) 
            : approvedQuotation.ApprovedQuotation;
          
          // Get all approved items for this indent
          const allApprovedItems = Object.keys(approvedData);
          
          // Check if all items are approved using the new data structure
          const allItemsApproved = allApprovedItems.every(itemCode => {
            const itemSampleData = sampleData[itemCode];
            return itemSampleData && itemSampleData.status === 'Approved';
          });
          // If all items are approved, update the main flow to step 9
          if (allItemsApproved) {
            // Update PurchaseFlow: set CurrentStep to 9 and update Steps array
            const flows = await db.getTableRows(table(SHEET_NAME));
            const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
            if (flowIdx !== -1) {
              const rowIndex = flowIdx + 2;
              const flow = flows[flowIdx];
              let stepsArr = [];
              try { stepsArr = flow.Steps ? JSON.parse(flow.Steps) : []; } catch { stepsArr = []; }
              
              const timestamp = new Date().toISOString();
              const step8Obj = {
                StepId: 8,
                StepNumber: 8,
                Role: 'Purchase Executive',
                Action: 'Inspect Sample',
                Status: 'completed',
                AssignedTo: 'Purchase Executive',
                StartTime: stepsArr.length > 0 ? stepsArr[stepsArr.length-1].EndTime || timestamp : timestamp,
                EndTime: timestamp,
                TAT: '1',
                TATStatus: 'On Time',
                ApprovalStatus: 'Approved',
                RejectionReason: '',
                NextStep: 9,
                PreviousStep: 7,
                Dependencies: '',
                LastModifiedBy: userEmail,
                LastModifiedAt: timestamp,
              };
              
              if (stepsArr.length > 0) {
                stepsArr[stepsArr.length - 1] = step8Obj;
              } else {
                stepsArr.push(step8Obj);
              }
              
              await updateRowByIndex(SHEET_NAME, rowIndex, {
                ...flow,
                CurrentStep: 9, // Move to step 9 (Place PO)
                Status: 'In Progress',
                Steps: JSON.stringify(stepsArr),
                UpdatedAt: timestamp,
                LastModifiedBy: userEmail,
              });
            }
            
            // Update PurchaseFlowSteps: update the indent row as stepId and stepNumber 8, nextStep 9, prevStep 7, assignedTo Purchase Executive, action Inspect Sample
            const steps = await db.getTableRows(table(STEPS_SHEET));
            const stepIdx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.NextStep) === '8');
            if (stepIdx !== -1) {
              const rowIndex = stepIdx + 2;
              const step = steps[stepIdx];
              let stepsArr2 = [];
              try { stepsArr2 = step.Steps ? JSON.parse(step.Steps) : []; } catch { stepsArr2 = []; }
              
              const timestamp = new Date().toISOString();
              const step8Obj2 = {
                StepId: 8,
                StepNumber: 8,
                Role: 'Purchase Executive',
                Action: 'Inspect Sample',
                Status: 'completed',
                AssignedTo: 'Purchase Executive',
                StartTime: stepsArr2.length > 0 ? stepsArr2[stepsArr2.length-1].EndTime || timestamp : timestamp,
                EndTime: timestamp,
                TAT: '1',
                TATStatus: 'On Time',
                ApprovalStatus: 'Approved',
                RejectionReason: '',
                NextStep: 9,
                PreviousStep: 7,
                Dependencies: '',
                LastModifiedBy: userEmail,
                LastModifiedAt: timestamp,
              };
              
              if (stepsArr2.length > 0) {
                stepsArr2[stepsArr2.length - 1] = step8Obj2;
              } else {
                stepsArr2.push(step8Obj2);
              }
              
              await updateRowByIndex(STEPS_SHEET, rowIndex, {
                ...step,
                StepNumber: 8,
                StepId: 8,
                NextStep: 9,
                PreviousStep: 7,
                AssignedTo: 'Purchase Executive',
                Action: 'Inspect Sample',
                Status: 'completed',
                Steps: JSON.stringify(stepsArr2),
                LastModifiedBy: userEmail,
                LastModifiedAt: timestamp,
              });
            }
            
            // Return a flag indicating that the indent has moved to the next step
            return { 
              success: true, 
              message: 'Sample item approved successfully',
              indentMovedToNextStep: true,
              nextStep: 9
            };
          }
        } catch (error) {
          console.error('Error checking if all items are approved:', error);
        }
      }
      return { 
        success: true, 
        message: 'Sample item approved successfully',
        indentMovedToNextStep: false
      };
      
    } catch (error) {
      console.error('Error approving sample item:', error);
      throw error;
    }
  },

  // Reject sample for a specific item
  async rejectSampleItem({ indentNumber, itemCode, vendorCode, userEmail, rejectionReason, note = '' }) {
    try {
      // 1. Update InspectSample sheet with rejection for this specific item-vendor combination
      const inspectSamples = await db.getTableRows(table(config.sheets.inspectSample));
      const existingIdx = inspectSamples.findIndex(row => row.IndentNumber === indentNumber);
      
      // Get approved quotation data to get all items for this indent
      const quotationData = await db.getTableRows(table('SheetApproveQuotation'));
      const quotation = quotationData.find(row => row.IndentNumber === indentNumber);
      
      let sampleData = {};
      if (existingIdx !== -1 && inspectSamples[existingIdx].Data) {
        try {
          sampleData = JSON.parse(inspectSamples[existingIdx].Data);
        } catch (e) {
          console.error('Error parsing existing sample data:', e);
        }
      }
      
      // If no existing data, initialize with approved quotation data
      if (Object.keys(sampleData).length === 0 && quotation && quotation.ApprovedQuotation) {
        try {
          const approvedData = typeof quotation.ApprovedQuotation === 'string' 
            ? JSON.parse(quotation.ApprovedQuotation) 
            : quotation.ApprovedQuotation;
          
          // Initialize sample data structure
          Object.keys(approvedData).forEach(itemCode => {
            sampleData[itemCode] = {
              vendorCode: approvedData[itemCode].selectedVendor.vendorCode,
              vendorName: approvedData[itemCode].selectedVendor.vendorName,
              status: 'Pending',
              note: '',
              rejectionReason: '',
              inspectedBy: '',
              inspectedAt: ''
            };
          });
        } catch (error) {
          console.error('Error initializing sample data from approved quotation:', error);
        }
      }
      
      // Update the specific item's status
      if (sampleData[itemCode]) {
        sampleData[itemCode] = {
          ...sampleData[itemCode],
          status: 'Rejected',
          note: note || '',
          rejectionReason: rejectionReason,
          inspectedBy: userEmail,
          inspectedAt: new Date().toISOString()
        };
      }
      
      const rowData = {
        IndentNumber: indentNumber,
        Data: JSON.stringify(sampleData),
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString()
      };
      
      if (existingIdx !== -1) {
        await updateRowByIndex(config.sheets.inspectSample, existingIdx + 2, rowData);
      } else {
        await db.insertTableRow(table(config.sheets.inspectSample), rowData);
      }
      
      // 2. Check if there are any approved items for this indent
      const approvedQuotationData = await db.getTableRows(table('SheetApproveQuotation'));
      const approvedQuotation = approvedQuotationData.find(row => row.IndentNumber === indentNumber);
      
      let hasApprovedItems = false;
      if (approvedQuotation && approvedQuotation.ApprovedQuotation) {
        try {
          const approvedData = typeof approvedQuotation.ApprovedQuotation === 'string' 
            ? JSON.parse(approvedQuotation.ApprovedQuotation) 
            : approvedQuotation.ApprovedQuotation;
          
          // Check if any items are approved using the new data structure
          hasApprovedItems = Object.keys(approvedData).some(itemCode => {
            const itemSampleData = sampleData[itemCode];
            return itemSampleData && itemSampleData.status === 'Approved';
          });
        } catch (error) {
          console.error('Error checking approved items:', error);
        }
      }
      
      // 3. Update PurchaseFlow and PurchaseFlowSteps based on whether there are approved items
      const flows = await db.getTableRows(table(SHEET_NAME));
      const flowIdx = flows.findIndex(row => row.IndentNumber === indentNumber);
      if (flowIdx !== -1) {
        const rowIndex = flowIdx + 2;
        const flow = flows[flowIdx];
        let stepsArr = [];
        try { stepsArr = flow.Steps ? JSON.parse(flow.Steps) : []; } catch { stepsArr = []; }
        
        const timestamp = new Date().toISOString();
        const step8Obj = {
          StepId: 8,
          StepNumber: 8,
          Role: 'Purchase Executive',
          Action: 'Inspect Sample',
          Status: hasApprovedItems ? 'in_progress' : 'rejected', // Keep in progress if some items are approved
          AssignedTo: 'Purchase Executive',
          StartTime: stepsArr.length > 0 ? stepsArr[stepsArr.length-1].EndTime || timestamp : timestamp,
          EndTime: timestamp,
          TAT: '1',
          TATStatus: 'On Time',
          ApprovalStatus: hasApprovedItems ? 'Partial' : 'Rejected',
          RejectionReason: hasApprovedItems ? '' : rejectionReason,
          NextStep: 8, // Keep at step 8 until all items are approved
          PreviousStep: 7,
          Dependencies: '',
          LastModifiedBy: userEmail,
          LastModifiedAt: timestamp,
        };
        
        if (stepsArr.length > 0) {
          stepsArr[stepsArr.length - 1] = step8Obj;
        } else {
          stepsArr.push(step8Obj);
        }
        
        await updateRowByIndex(SHEET_NAME, rowIndex, {
          ...flow,
          CurrentStep: 8,
          Status: hasApprovedItems ? 'In Progress' : 'Rejected', // Keep in progress if some items are approved
          Steps: JSON.stringify(stepsArr),
          UpdatedAt: timestamp,
          LastModifiedBy: userEmail,
        });
      }
      
      // Update PurchaseFlowSteps
      const steps = await db.getTableRows(table(STEPS_SHEET));
      const stepIdx = steps.findIndex(s => s.IndentNumber === indentNumber && String(s.NextStep) === '8');
      if (stepIdx !== -1) {
        const rowIndex = stepIdx + 2;
        const step = steps[stepIdx];
        let stepsArr2 = [];
        try { stepsArr2 = step.Steps ? JSON.parse(step.Steps) : []; } catch { stepsArr2 = []; }
        
        const timestamp = new Date().toISOString();
        const step8Obj2 = {
          StepId: 8,
          StepNumber: 8,
          Role: 'Purchase Executive',
          Action: 'Inspect Sample',
          Status: hasApprovedItems ? 'in_progress' : 'rejected', // Keep in progress if some items are approved
          AssignedTo: 'Purchase Executive',
          StartTime: stepsArr2.length > 0 ? stepsArr2[stepsArr2.length-1].EndTime || timestamp : timestamp,
          EndTime: timestamp,
          TAT: '1',
          TATStatus: 'On Time',
          ApprovalStatus: hasApprovedItems ? 'Partial' : 'Rejected',
          RejectionReason: hasApprovedItems ? '' : rejectionReason,
          NextStep: 8, // Keep at step 8 until all items are approved
          PreviousStep: 7,
          Dependencies: '',
          LastModifiedBy: userEmail,
          LastModifiedAt: timestamp,
        };
        
        if (stepsArr2.length > 0) {
          stepsArr2[stepsArr2.length - 1] = step8Obj2;
        } else {
          stepsArr2.push(step8Obj2);
        }
        
        await updateRowByIndex(STEPS_SHEET, rowIndex, {
          ...step,
          StepNumber: 8,
          StepId: 8,
          NextStep: 8, // Keep at step 8 until all items are approved
          PreviousStep: 7,
          AssignedTo: 'Purchase Executive',
          Action: 'Inspect Sample',
          Status: hasApprovedItems ? 'in_progress' : 'rejected',
          Steps: JSON.stringify(stepsArr2),
          LastModifiedBy: userEmail,
          LastModifiedAt: timestamp,
          RejectionReason: hasApprovedItems ? '' : rejectionReason,
        });
      }
      return { success: true, message: 'Sample item rejected successfully' };
      
    } catch (error) {
      console.error('Error rejecting sample item:', error);
      throw error;
    }
  },

  // Get POs for Receive and Inspect Material (NextStep = 12)
  async getPOsForReceiveAndInspectMaterial() {
    try {
      // Get all POs from SortVendor sheet where NextStep is 12 OR step 11 is completed
      const sortVendorData = await db.getTableRows(table(config.sheets.sortVendor));
      
      // First, get POs with NextStep === '12'
      const posWithNextStep12 = sortVendorData.filter(po => String(po.NextStep) === '12');
      
      // Then, get POs with step 11 completed that don't already have NextStep === '12'
      // Check PurchaseFlowSteps to find step 11 completed indents
      const steps = await db.getTableRows(table('PurchaseFlowSteps'));
      const step11Completed = steps.filter(s => 
        String(s.StepNumber) === '11' && 
        String(s.StepId) === '11' && 
        s.Status === 'completed'
      );
      
      // Get indent numbers from step 11 completed
      const step11IndentNumbers = new Set(step11Completed.map(s => s.IndentNumber));
      
      // Find POs for these indents that don't already have NextStep === '12'
      const posForStep11Completed = sortVendorData.filter(po => {
        // Check if this PO's items belong to a step 11 completed indent
        try {
          const items = JSON.parse(po.Items || '[]');
          const indentNumbers = new Set(items.map(item => item.indentNumber));
          const hasStep11Indent = Array.from(indentNumbers).some(indNum => step11IndentNumbers.has(indNum));
          return hasStep11Indent && String(po.NextStep) !== '12';
        } catch {
          return false;
        }
      });
      
      // Combine both lists
      const posForInspection = [...posWithNextStep12, ...posForStep11Completed];
      
      // Get unique PO IDs to avoid duplicates
      const uniquePOIds = [...new Set(posForInspection.map(po => po.POId))];
      const uniquePOs = uniquePOIds.map(poId => posForInspection.find(po => po.POId === poId));
      // Get all vendor details from Vendor sheet
      const vendorData = await db.getTableRows(table('Vendor'));
      
      // Get existing inspection data
      const inspectMaterialData = await db.getTableRows(table(config.sheets.inspectMaterial));
      
      const result = uniquePOs.map(po => {
        let vendorDetails = {};
        let items = [];
        
        try {
          vendorDetails = JSON.parse(po.VendorDetails);
        } catch (e) {
          console.error('Error parsing vendor details for PO', po.POId, ':', e);
        }
        
        try {
          items = JSON.parse(po.Items);
        } catch (e) {
          console.error('Error parsing items for PO', po.POId, ':', e);
        }
        
        // Fetch complete vendor details from Vendor sheet
        const completeVendorDetails = vendorData.find(v => v['Vendor Code'] === vendorDetails.vendorCode);
        
        // Merge vendor details from SortVendor with complete details from Vendor sheet
        const enhancedVendorDetails = {
          ...vendorDetails,
          vendorName: completeVendorDetails?.['Vendor Name'] || vendorDetails.vendorName || '',
          vendorContact: completeVendorDetails?.['Vendor Contact'] || vendorDetails.vendorContact || '',
          vendorEmail: completeVendorDetails?.['Vendor Email'] || vendorDetails.vendorEmail || '',
          vendorPhone: completeVendorDetails?.['Vendor Contact'] || vendorDetails.vendorPhone || '',
          vendorAddress: completeVendorDetails?.Address || vendorDetails.vendorAddress || '',
          vendorGSTIN: completeVendorDetails?.GSTIN || vendorDetails.vendorGSTIN || '',
          vendorPAN: completeVendorDetails?.['PAN No.'] || vendorDetails.vendorPAN || '',
          vendorState: completeVendorDetails?.State || vendorDetails.vendorState || '',
          vendorStateCode: completeVendorDetails?.['State Code'] || vendorDetails.vendorStateCode || '',
          vendorACCode: completeVendorDetails?.['A/C Code'] || vendorDetails.vendorACCode || '',
          vendorPaymentTerms: completeVendorDetails?.['Payment Terms'] || vendorDetails.vendorPaymentTerms || '',
          vendorRemarks: completeVendorDetails?.Remarks || vendorDetails.vendorRemarks || ''
        };
        
        // Check if inspection data exists for this PO
        const existingInspection = inspectMaterialData.find(inspection => inspection.POId === po.POId);
        
        return {
          POId: po.POId,
          VendorDetails: enhancedVendorDetails,
          Items: items,
          StepId: po.StepId,
          NextStep: po.NextStep,
          Status: po.Status,
          CreatedBy: po.CreatedBy,
          CreatedAt: po.CreatedAt,
          LastModifiedBy: po.LastModifiedBy,
          LastModifiedAt: po.LastModifiedAt,
          InspectionStatus: existingInspection?.Status || 'Not Yet Received',
          InspectionNote: existingInspection?.Note || ''
        };
      });
      return result;
      
    } catch (error) {
      console.error('Error fetching POs for material inspection:', error);
      throw error;
    }
  },

  // Save inspection information to InspectMaterial sheet
  async saveInspectionData({ poId, vendorDetails, items, status, note, userEmail }) {
    try {
      // Check if entry already exists
      const existingData = await db.getTableRows(table(config.sheets.inspectMaterial));
      const existingEntry = existingData.find(entry => entry.POId === poId);
      
      const inspectionData = {
        POId: poId,
        VendorDetails: JSON.stringify(vendorDetails),
        Items: JSON.stringify(items),
        Status: status,
        Note: note || '',
        CreatedBy: userEmail,
        CreatedAt: new Date().toISOString(),
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString()
      };
      
      if (existingEntry) {
        // Update existing entry
        const rowIndex = existingData.indexOf(existingEntry) + 2;
        await updateRowByIndex(config.sheets.inspectMaterial, rowIndex, {
          ...existingEntry,
          ...inspectionData
        });
      } else {
        // Create new entry
        await db.insertTableRow(table(config.sheets.inspectMaterial), inspectionData);
      }
      return { success: true, poId };
      
    } catch (error) {
      console.error('Error saving inspection data:', error);
      throw error;
    }
  },

  // Complete Receive and Inspect Material step and move to next step
  async completeReceiveAndInspectMaterialStep({ poId, userEmail }) {
    try {
      // Update SortVendor sheet - move to step 13
      const sortVendorData = await db.getTableRows(table(config.sheets.sortVendor));
      const poData = sortVendorData.find(po => po.POId === poId);
      
      if (!poData) {
        throw new Error(`PO ${poId} not found in SortVendor sheet`);
      }
      
      const poRowIndex = sortVendorData.indexOf(poData) + 2;
      await updateRowByIndex(config.sheets.sortVendor, poRowIndex, {
        ...poData,
        StepId: 12,
        NextStep: 13,
        Status: 'Material Received and Inspected',
        Action: 'Receive and Inspect Material',
        AssignedTo: 'QC Manager',
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString()
      });
      return { success: true, poId };
      
    } catch (error) {
      console.error('Error completing receive and inspect material step:', error);
      throw error;
    }
  },

  // Get POs for Follow-up Delivery (NextStep = 11)
  async getPOsForFollowupDelivery() {
    try {
      // Get all POs from SortVendor sheet where NextStep is 11 OR step 10 is completed
      const sortVendorData = await db.getTableRows(table(config.sheets.sortVendor));
      
      // First, get POs with NextStep === '11'
      const posWithNextStep11 = sortVendorData.filter(po => String(po.NextStep) === '11');
      
      // Then, get POs with step 10 completed that don't already have NextStep === '11'
      // Check PurchaseFlowSteps to find step 10 completed indents
      const steps = await db.getTableRows(table('PurchaseFlowSteps'));
      const step10Completed = steps.filter(s => 
        String(s.StepNumber) === '10' && 
        String(s.StepId) === '10' && 
        s.Status === 'completed'
      );
      
      // Get indent numbers from step 10 completed
      const step10IndentNumbers = new Set(step10Completed.map(s => s.IndentNumber));
      
      // Find POs for these indents that don't already have NextStep === '11'
      const posForStep10Completed = sortVendorData.filter(po => {
        // Check if this PO's items belong to a step 10 completed indent
        try {
          const items = JSON.parse(po.Items || '[]');
          const indentNumbers = new Set(items.map(item => item.indentNumber));
          const hasStep10Indent = Array.from(indentNumbers).some(indNum => step10IndentNumbers.has(indNum));
          return hasStep10Indent && String(po.NextStep) !== '11';
        } catch {
          return false;
        }
      });
      
      // Combine both lists
      const posForDelivery = [...posWithNextStep11, ...posForStep10Completed];
      
      // Get unique PO IDs to avoid duplicates
      const uniquePOIds = [...new Set(posForDelivery.map(po => po.POId))];
      const uniquePOs = uniquePOIds.map(poId => posForDelivery.find(po => po.POId === poId));
      // Get all vendor details from Vendor sheet
      const vendorData = await db.getTableRows(table('Vendor'));
      
      // Get PO Copy information from FollowUpDelivery sheet
      const followUpDeliveryData = await db.getTableRows(table(config.sheets.followUpDelivery));
      
      const result = uniquePOs.map(po => {
        let vendorDetails = {};
        let items = [];
        
        try {
          vendorDetails = JSON.parse(po.VendorDetails);
        } catch (e) {
          console.error('Error parsing vendor details for PO', po.POId, ':', e);
        }
        
        try {
          items = JSON.parse(po.Items);
        } catch (e) {
          console.error('Error parsing items for PO', po.POId, ':', e);
        }
        
        // Fetch complete vendor details from Vendor sheet
        const completeVendorDetails = vendorData.find(v => v['Vendor Code'] === vendorDetails.vendorCode);
        
        // Merge vendor details from SortVendor with complete details from Vendor sheet
        const enhancedVendorDetails = {
          ...vendorDetails,
          vendorName: completeVendorDetails?.['Vendor Name'] || vendorDetails.vendorName || '',
          vendorContact: completeVendorDetails?.['Vendor Contact'] || vendorDetails.vendorContact || '',
          vendorEmail: completeVendorDetails?.['Vendor Email'] || vendorDetails.vendorEmail || '',
          vendorPhone: completeVendorDetails?.['Vendor Contact'] || vendorDetails.vendorPhone || '',
          vendorAddress: completeVendorDetails?.Address || vendorDetails.vendorAddress || '',
          vendorGSTIN: completeVendorDetails?.GSTIN || vendorDetails.vendorGSTIN || '',
          vendorPAN: completeVendorDetails?.['PAN No.'] || vendorDetails.vendorPAN || '',
          vendorState: completeVendorDetails?.State || vendorDetails.vendorState || '',
          vendorStateCode: completeVendorDetails?.['State Code'] || vendorDetails.vendorStateCode || '',
          vendorACCode: completeVendorDetails?.['A/C Code'] || vendorDetails.vendorACCode || '',
          vendorPaymentTerms: completeVendorDetails?.['Payment Terms'] || vendorDetails.vendorPaymentTerms || '',
          vendorRemarks: completeVendorDetails?.Remarks || vendorDetails.vendorRemarks || ''
        };
        
        // Get PO Copy information from FollowUpDelivery sheet
        const followUpEntry = followUpDeliveryData.find(entry => entry.POId === po.POId);
        const poCopyFileId = followUpEntry?.POCopyFileId || po.POCopyFileId || '';
        const expectedDate = followUpEntry?.ExpectedDate || '';
        
        return {
          POId: po.POId,
          VendorDetails: enhancedVendorDetails,
          Items: items,
          StepId: po.StepId,
          NextStep: po.NextStep,
          Status: po.Status,
          POCopyFileId: poCopyFileId,
          ExpectedDate: expectedDate,
          CreatedBy: po.CreatedBy,
          CreatedAt: po.CreatedAt,
          LastModifiedBy: po.LastModifiedBy,
          LastModifiedAt: po.LastModifiedAt
        };
      });
      return result;
      
    } catch (error) {
      console.error('Error fetching POs for delivery follow-up:', error);
      throw error;
    }
  },

  // Save delivery tracking information to FollowUpDelivery sheet
  async saveDeliveryTracking({ poId, vendorDetails, items, expectedDate, poCopyFileId, userEmail }) {
    try {
      // Check if entry already exists in FollowUpDelivery sheet
      const existingData = await db.getTableRows(table(config.sheets.followUpDelivery));
      const existingEntry = existingData.find(entry => entry.POId === poId);
      
      const trackingData = {
        POId: poId,
        VendorDetails: JSON.stringify(vendorDetails),
        Items: JSON.stringify(items),
        ExpectedDate: expectedDate,
        POCopyFileId: poCopyFileId || '',
        CreatedBy: userEmail,
        CreatedAt: new Date().toISOString(),
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString()
      };
      
      if (existingEntry) {
        // Update existing entry
        const rowIndex = existingData.indexOf(existingEntry) + 2;
        await updateRowByIndex(config.sheets.followUpDelivery, rowIndex, {
          ...existingEntry,
          ...trackingData
        });
      } else {
        // Create new entry
        await db.insertTableRow(table(config.sheets.followUpDelivery), trackingData);
      }
      
      // Also update the SortVendor sheet with PO Copy information
      const sortVendorData = await db.getTableRows(table(config.sheets.sortVendor));
      const poData = sortVendorData.find(po => po.POId === poId);
      
      if (poData) {
        const poRowIndex = sortVendorData.indexOf(poData) + 2;
        await updateRowByIndex(config.sheets.sortVendor, poRowIndex, {
          ...poData,
          POCopyFileId: poCopyFileId || '',
          LastModifiedBy: userEmail,
          LastModifiedAt: new Date().toISOString()
        });
      }
      return { success: true, poId };
      
    } catch (error) {
      console.error('Error saving delivery tracking:', error);
      throw error;
    }
  },

  // Complete Follow-up Delivery step and move to next step
  async completeFollowupDeliveryStep({ poId, userEmail, poCopyFileId }) {
    try {
      // Update SortVendor sheet - move to step 12
      const sortVendorData = await db.getTableRows(table(config.sheets.sortVendor));
      const poData = sortVendorData.find(po => po.POId === poId);
      
      if (!poData) {
        throw new Error(`PO ${poId} not found in SortVendor sheet`);
      }
      
      const poRowIndex = sortVendorData.indexOf(poData) + 2;
      
      // Prepare update data
      const updateData = {
        ...poData,
        StepId: 11,
        NextStep: 12,
        Status: 'Delivery Followed Up',
        Action: 'Follow-up for Delivery',
        AssignedTo: 'QC Manager',
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString()
      };

      // Include PO Copy file ID if provided
      if (poCopyFileId) {
        updateData.POCopyFileId = poCopyFileId;
      }
      
      await updateRowByIndex(config.sheets.sortVendor, poRowIndex, updateData);
      return { success: true, poId };
      
    } catch (error) {
      console.error('Error completing follow-up delivery step:', error);
      throw error;
    }
  },

  // Get all POs from SortVendor sheet for display in PurchaseFlow
  async getPOsForDisplay() {
    try {
      // Get all POs from SortVendor sheet
      const sortVendorData = await db.getTableRows(table(config.sheets.sortVendor));
      const result = sortVendorData.map(po => {
        let vendorDetails = {};
        let items = [];
        
        try {
          vendorDetails = JSON.parse(po.VendorDetails);
        } catch (e) {
          console.error('Error parsing vendor details for PO', po.POId, ':', e);
        }
        
        try {
          items = JSON.parse(po.Items);
        } catch (e) {
          console.error('Error parsing items for PO', po.POId, ':', e);
        }
        
        return {
          POId: po.POId,
          VendorDetails: vendorDetails,
          Items: items,
          StepId: po.StepId,
          NextStep: po.NextStep,
          Status: po.Status,
          CreatedBy: po.CreatedBy,
          CreatedAt: po.CreatedAt,
          LastModifiedBy: po.LastModifiedBy,
          LastModifiedAt: po.LastModifiedAt
        };
      });
      return result;
      
    } catch (error) {
      console.error('Error fetching POs for display:', error);
      throw error;
    }
  },

  // Get POs ready for placement (NextStep = 10)
  async getPOsForPlacement() {
    try {
      // Get all POs from SortVendor sheet where NextStep is 10 OR step 9 is completed
      const sortVendorData = await db.getTableRows(table(config.sheets.sortVendor));
      
      // First, get POs with NextStep === '10' and Status is not completed
      const posWithNextStep10 = sortVendorData.filter(po => {
        const nextStep = String(po.NextStep);
        const status = String(po.Status || '').trim().toLowerCase();
        const completedStatuses = ['placed', 'completed', 'done', 'finished', 'closed'];
        
        return nextStep === '10' && !completedStatuses.includes(status);
      });
      
      // Then, get POs with step 9 completed that don't already have NextStep === '10'
      // Check PurchaseFlowSteps to find step 9 completed indents
      const steps = await db.getTableRows(table('PurchaseFlowSteps'));
      const step9Completed = steps.filter(s => 
        String(s.StepNumber) === '9' && 
        String(s.StepId) === '9' && 
        s.Status === 'completed'
      );
      
      // Get indent numbers from step 9 completed
      const step9IndentNumbers = new Set(step9Completed.map(s => s.IndentNumber));
      
      // Find POs for these indents that don't already have NextStep === '10' and are not completed
      const posForStep9Completed = sortVendorData.filter(po => {
        // Check if this PO's items belong to a step 9 completed indent
        try {
          const items = JSON.parse(po.Items || '[]');
          const indentNumbers = new Set(items.map(item => item.indentNumber));
          const hasStep9Indent = Array.from(indentNumbers).some(indNum => step9IndentNumbers.has(indNum));
          
          const nextStep = String(po.NextStep);
          const status = String(po.Status || '').trim().toLowerCase();
          const completedStatuses = ['placed', 'completed', 'done', 'finished', 'closed'];
          
          return hasStep9Indent && 
                 nextStep !== '10' && 
                 !completedStatuses.includes(status);
        } catch {
          return false;
        }
      });
      
      // Combine both lists
      const posForPlacement = [...posWithNextStep10, ...posForStep9Completed];
      
      // Filter out sample POs and ensure no completed POs are included
      // Only show POs that are ready for placement (NextStep === '10' or should be at step 10)
      // and are not already completed
      const filteredPOs = posForPlacement.filter(po => {
        // Exclude sample POs
        if (po.POId === 'SAMPLE_PO' || 
            po.Status === 'Sample' ||
            po.POId?.toUpperCase().includes('SAMPLE')) {
          return false;
        }
        
        // Exclude completed POs - check status (case-insensitive, trimmed)
        const status = String(po.Status || '').trim().toLowerCase();
        const completedStatuses = ['placed', 'completed', 'done', 'finished', 'closed'];
        if (completedStatuses.includes(status)) {
          return false;
        }
        
        // Exclude POs that have already moved past step 10
        const nextStep = parseInt(po.NextStep);
        if (!isNaN(nextStep) && nextStep > 10) {
          return false;
        }
        
        // Additional check: If status is empty/null but NextStep > 10, exclude it
        if ((!status || status === '') && !isNaN(nextStep) && nextStep > 10) {
          return false;
        }
        
        return true;
      });
      
      // Get unique PO IDs to avoid duplicates
      const uniquePOIds = [...new Set(filteredPOs.map(po => po.POId))];
      const uniquePOs = uniquePOIds.map(poId => filteredPOs.find(po => po.POId === poId));
      const result = uniquePOs.map(po => {
        let vendorDetails = {};
        let items = [];
        
        try {
          vendorDetails = JSON.parse(po.VendorDetails);
        } catch (e) {
          console.error('Error parsing vendor details for PO', po.POId, ':', e);
        }
        
        try {
          items = JSON.parse(po.Items);
          // Remove sampleRequired from items if present
          items = items.map(item => {
            const { sampleRequired, ...itemWithoutSample } = item;
            return itemWithoutSample;
          });
        } catch (e) {
          console.error('Error parsing items for PO', po.POId, ':', e);
        }
        
        return {
          POId: po.POId,
          VendorDetails: vendorDetails,
          Items: items,
          StepId: po.StepId,
          NextStep: po.NextStep,
          Status: po.Status,
          CreatedBy: po.CreatedBy,
          CreatedAt: po.CreatedAt,
          LastModifiedBy: po.LastModifiedBy,
          LastModifiedAt: po.LastModifiedAt
        };
      });
      return result;
      
    } catch (error) {
      console.error('Error fetching POs for placement:', error);
      throw error;
    }
  },

  // Place PO and update SortVendor sheet
  async placePOWithDocument({ poId, poDocumentId, userEmail }) {
    try {
      // Get PO data from SortVendor sheet
      const sortVendorData = await db.getTableRows(table(config.sheets.sortVendor));
      const poData = sortVendorData.find(po => po.POId === poId);
      
      if (!poData) {
        throw new Error(`PO ${poId} not found in SortVendor sheet`);
      }
      
      // Update SortVendor sheet - mark as placed and update step info
      const poRowIndex = sortVendorData.indexOf(poData) + 2;
      await updateRowByIndex(config.sheets.sortVendor, poRowIndex, {
        ...poData,
        StepId: 10,
        NextStep: 11,
        Status: 'Placed',
        PODocumentId: poDocumentId,
        Action: 'Place PO',
        AssignedTo: 'Purchase Executive',
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString()
      });
      return { success: true, poId };
      
    } catch (error) {
      console.error('Error placing PO:', error);
      throw error;
    }
  },

  // Get POs for Material Approval (NextStep = 13)
  async getPOsForMaterialApproval() {
    try {

      // Get all POs from SortVendor sheet where NextStep is 13
      const sortVendorData = await db.getTableRows(table(config.sheets.sortVendor));
      const posForApproval = sortVendorData.filter(po => String(po.NextStep) === '13');
      // Get all vendor details from Vendor sheet
      const vendorData = await db.getTableRows(table('Vendor'));
      
      // Get PO Copy information from FollowUpDelivery sheet
      const followUpDeliveryData = await db.getTableRows(table(config.sheets.followUpDelivery));
      
      const result = posForApproval.map(po => {
        let vendorDetails = {};
        let items = [];
        
        try {
          vendorDetails = JSON.parse(po.VendorDetails);
        } catch (e) {
          console.error('Error parsing vendor details for PO', po.POId, ':', e);
        }
        
        try {
          items = JSON.parse(po.Items);
        } catch (e) {
          console.error('Error parsing items for PO', po.POId, ':', e);
        }
        
        // Fetch complete vendor details from Vendor sheet
        const completeVendorDetails = vendorData.find(v => v['Vendor Code'] === vendorDetails.vendorCode);
        
        // Merge vendor details from SortVendor with complete details from Vendor sheet
        const enhancedVendorDetails = {
          ...vendorDetails,
          vendorName: completeVendorDetails?.['Vendor Name'] || vendorDetails.vendorName || '',
          vendorContact: completeVendorDetails?.['Vendor Contact'] || vendorDetails.vendorContact || '',
          vendorEmail: completeVendorDetails?.['Vendor Email'] || vendorDetails.vendorEmail || '',
          vendorPhone: completeVendorDetails?.['Vendor Contact'] || vendorDetails.vendorPhone || '',
          vendorAddress: completeVendorDetails?.Address || vendorDetails.vendorAddress || '',
          vendorGSTIN: completeVendorDetails?.GSTIN || vendorDetails.vendorGSTIN || '',
          vendorPAN: completeVendorDetails?.['PAN No.'] || vendorDetails.vendorPAN || '',
          vendorState: completeVendorDetails?.State || vendorDetails.vendorState || '',
          vendorStateCode: completeVendorDetails?.['State Code'] || vendorDetails.vendorStateCode || '',
          vendorACCode: completeVendorDetails?.['A/C Code'] || vendorDetails.vendorACCode || '',
          vendorPaymentTerms: completeVendorDetails?.['Payment Terms'] || vendorDetails.vendorPaymentTerms || '',
          vendorRemarks: completeVendorDetails?.Remarks || vendorDetails.vendorRemarks || ''
        };
        
        // Get PO Copy information from FollowUpDelivery sheet
        const followUpEntry = followUpDeliveryData.find(entry => entry.POId === po.POId);
        const poCopyFileId = followUpEntry?.POCopyFileId || po.POCopyFileId || '';
        
        return {
          POId: po.POId,
          VendorDetails: enhancedVendorDetails,
          Items: items,
          StepId: po.StepId,
          NextStep: po.NextStep,
          Status: po.Status,
          POCopyFileId: poCopyFileId,
          CreatedBy: po.CreatedBy,
          CreatedAt: po.CreatedAt,
          LastModifiedBy: po.LastModifiedBy,
          LastModifiedAt: po.LastModifiedAt
        };
      });
      return result;
      
    } catch (error) {
      console.error('Error fetching POs for Material Approval:', error);
      throw error;
    }
  },

  // Save Material Approval data
  async saveMaterialApproval({ poId, vendorDetails, items, approvalStatus, invoiceFileId, dcFileId, poCopyFileId, rejectionNote, userEmail }) {
    try {
      // Check if entry already exists in MaterialApproval sheet
      const existingData = await db.getTableRows(table(config.sheets.materialApproval));
      const existingEntry = existingData.find(entry => entry.POId === poId);
      
      const approvalData = {
        POId: poId,
        VendorDetails: JSON.stringify(vendorDetails),
        Items: JSON.stringify(items),
        ApprovalStatus: approvalStatus,
        InvoiceFileId: invoiceFileId || '',
        DCFileId: dcFileId || '',
        POCopyFileId: poCopyFileId || '',
        RejectionNote: rejectionNote || '',
        CreatedBy: userEmail,
        CreatedAt: new Date().toISOString(),
        LastModifiedBy: userEmail,
        LastModifiedAt: new Date().toISOString()
      };
      
      if (existingEntry) {
        // Update existing entry
        const rowIndex = existingData.indexOf(existingEntry) + 2;
        await updateRowByIndex(config.sheets.materialApproval, rowIndex, {
          ...existingEntry,
          ...approvalData
        });
      } else {
        // Create new entry
        await db.insertTableRow(table(config.sheets.materialApproval), approvalData);
      }
      
      // Update SortVendor sheet based on approval status
      const sortVendorData = await db.getTableRows(table(config.sheets.sortVendor));
      const poData = sortVendorData.find(po => po.POId === poId);
      
      if (poData) {
        const poRowIndex = sortVendorData.indexOf(poData) + 2;
        
        if (approvalStatus === 'approved') {
          // Material approved - move to step 17 (Generate GRN)
          await updateRowByIndex(config.sheets.sortVendor, poRowIndex, {
            ...poData,
            StepId: 13,
            NextStep: 17,
            Status: 'Material Approved',
            Action: 'Material Approval',
            AssignedTo: 'Store Manager',
            LastModifiedBy: userEmail,
            LastModifiedAt: new Date().toISOString()
          });
        } else {
          // Material rejected - move to step 14 (Decision on Rejection)
          await updateRowByIndex(config.sheets.sortVendor, poRowIndex, {
            ...poData,
            StepId: 13,
            NextStep: 14,
            Status: 'Material Rejected',
            Action: 'Material Approval',
            AssignedTo: 'Purchase Executive',
            LastModifiedBy: userEmail,
            LastModifiedAt: new Date().toISOString()
          });
        }
      }
      return { success: true, poId, approvalStatus };
      
    } catch (error) {
      console.error('Error saving Material Approval:', error);
      throw error;
    }
  },

  // Complete Material Approval step
  async completeMaterialApprovalStep({ poId, userEmail }) {
    try {
      // Get approval data from MaterialApproval sheet
      const approvalData = await db.getTableRows(table(config.sheets.materialApproval));
      const approvalEntry = approvalData.find(entry => entry.POId === poId);
      
      if (!approvalEntry) {
        throw new Error(`Material Approval data not found for PO ${poId}`);
      }
      
      const approvalStatus = approvalEntry.ApprovalStatus;
      
      // Update SortVendor sheet based on approval status
      const sortVendorData = await db.getTableRows(table(config.sheets.sortVendor));
      const poData = sortVendorData.find(po => po.POId === poId);
      
      if (!poData) {
        throw new Error(`PO ${poId} not found in SortVendor sheet`);
      }
      
      const poRowIndex = sortVendorData.indexOf(poData) + 2;
      
      if (approvalStatus === 'approved') {
        // Material approved - move to step 17 (Generate GRN)
        await updateRowByIndex(config.sheets.sortVendor, poRowIndex, {
          ...poData,
          StepId: 13,
          NextStep: 17,
          Status: 'Material Approved',
          Action: 'Generate GRN',
          AssignedTo: 'Store Manager',
          LastModifiedBy: userEmail,
          LastModifiedAt: new Date().toISOString()
        });
      } else {
        // Material rejected - move to step 14 (Decision on Rejection)
        await updateRowByIndex(config.sheets.sortVendor, poRowIndex, {
          ...poData,
          StepId: 13,
          NextStep: 14,
          Status: 'Material Rejected',
          Action: 'Decision on Rejection',
          AssignedTo: 'Purchase Executive',
          LastModifiedBy: userEmail,
          LastModifiedAt: new Date().toISOString()
        });
      }
      return { success: true, poId, approvalStatus };
      
    } catch (error) {
      console.error('Error completing Material Approval step:', error);
      throw error;
    }
  },

  // Get all POs from SortVendor whose nextStep is 15 (for Return Rejected Material)
  async getPOsForReturnRejectedMaterial() {
    const sortVendorData = await db.getTableRows(table('SortVendor'));
    const vendorData = await db.getTableRows(table('Vendor'));
    // Get all POs where NextStep is 15
    const pos = sortVendorData.filter(po => String(po.NextStep) === '15');
    return pos.map(po => {
      let vendorDetails = {};
      let items = [];
      try { vendorDetails = JSON.parse(po.VendorDetails); } catch {}
      try { items = JSON.parse(po.Items); } catch {}
      const completeVendorDetails = vendorData.find(v => v['Vendor Code'] === vendorDetails.vendorCode);
      const enhancedVendorDetails = {
        ...vendorDetails,
        vendorName: completeVendorDetails?.['Vendor Name'] || vendorDetails.vendorName || '',
        vendorContact: completeVendorDetails?.['Vendor Contact'] || vendorDetails.vendorContact || '',
        vendorEmail: completeVendorDetails?.['Vendor Email'] || vendorDetails.vendorEmail || '',
        vendorAddress: completeVendorDetails?.Address || vendorDetails.vendorAddress || '',
        vendorGSTIN: completeVendorDetails?.GSTIN || vendorDetails.vendorGSTIN || '',
        vendorPAN: completeVendorDetails?.['PAN No.'] || vendorDetails.vendorPAN || ''
      };
      return {
        ...po,
        VendorDetails: enhancedVendorDetails,
        Items: items
      };
    });
  },

  // Initialize ReturnMaterial sheet with headers if not present
  async initializeReturnMaterialSheet() {
    const existingData = await db.getTableRows(table('ReturnMaterial'));
    if (existingData.length === 0) {
      await db.insertTableRow(table('ReturnMaterial'), {
        POId: 'SAMPLE_PO',
        Details: JSON.stringify({
          VendorDetails: {},
          Items: [],
          RejectionNote: '',
          GeneratedBy: 'system',
          GeneratedAt: new Date().toISOString()
        })
      });
    }
    return true;
  },

  // Get all POs from SortVendor whose nextStep is 16 (for Resend Material)
  async getPOsForResendMaterial() {
    const sortVendorData = await db.getTableRows(table('SortVendor'));
    const vendorData = await db.getTableRows(table('Vendor'));
    const materialApprovalData = await db.getTableRows(table('MaterialApproval'));
    
    // Get all POs where NextStep is 16
    const pos = sortVendorData.filter(po => String(po.NextStep) === '16');
    return pos.map(po => {
      let vendorDetails = {};
      let items = [];
      let rejectionNote = '';
      
      try { vendorDetails = JSON.parse(po.VendorDetails); } catch {}
      try { items = JSON.parse(po.Items); } catch {}
      
      // Get rejection note from MaterialApproval sheet
      const materialApproval = materialApprovalData.find(ma => ma.POId === po.POId);
      if (materialApproval) {
        try {
          const approvalDetails = JSON.parse(materialApproval.Details || '{}');
          rejectionNote = approvalDetails.RejectionNote || materialApproval.RejectionNote || '';
        } catch {}
      }
      
      const completeVendorDetails = vendorData.find(v => v['Vendor Code'] === vendorDetails.vendorCode);
      const enhancedVendorDetails = {
        ...vendorDetails,
        vendorName: completeVendorDetails?.['Vendor Name'] || vendorDetails.vendorName || '',
        vendorContact: completeVendorDetails?.['Vendor Contact'] || vendorDetails.vendorContact || '',
        vendorEmail: completeVendorDetails?.['Vendor Email'] || vendorDetails.vendorEmail || '',
        vendorAddress: completeVendorDetails?.Address || vendorDetails.vendorAddress || '',
        vendorGSTIN: completeVendorDetails?.GSTIN || vendorDetails.vendorGSTIN || '',
        vendorPAN: completeVendorDetails?.['PAN No.'] || vendorDetails.vendorPAN || ''
      };
      
      return {
        ...po,
        VendorDetails: enhancedVendorDetails,
        Items: items,
        RejectionNote: rejectionNote
      };
    });
  },

  // Get all POs from SortVendor whose nextStep is 17 (for Generate GRN)
  async getPOsForGenerateGRN() {
    const sortVendorData = await db.getTableRows(table('SortVendor'));
    const vendorData = await db.getTableRows(table('Vendor'));
    
    // Get all POs where NextStep is 17
    const pos = sortVendorData.filter(po => String(po.NextStep) === '17');
    return pos.map(po => {
      let vendorDetails = {};
      let items = [];
      
      try { vendorDetails = JSON.parse(po.VendorDetails); } catch {}
      try { items = JSON.parse(po.Items); } catch {}
      
      const completeVendorDetails = vendorData.find(v => v['Vendor Code'] === vendorDetails.vendorCode);
      const enhancedVendorDetails = {
        ...vendorDetails,
        vendorName: completeVendorDetails?.['Vendor Name'] || vendorDetails.vendorName || '',
        vendorContact: completeVendorDetails?.['Vendor Contact'] || vendorDetails.vendorContact || '',
        vendorEmail: completeVendorDetails?.['Vendor Email'] || vendorDetails.vendorEmail || '',
        vendorAddress: completeVendorDetails?.Address || vendorDetails.vendorAddress || '',
        vendorGSTIN: completeVendorDetails?.GSTIN || vendorDetails.vendorGSTIN || '',
        vendorPAN: completeVendorDetails?.['PAN No.'] || vendorDetails.vendorPAN || ''
      };
      
      return {
        ...po,
        VendorDetails: enhancedVendorDetails,
        Items: items
      };
    });
  },

  // Get all POs from SortVendor whose nextStep is 18 (for Final GRN)
  async getPOsForFinalGRN() {
    const sortVendorData = await db.getTableRows(table('SortVendor'));
    const vendorData = await db.getTableRows(table('Vendor'));
    const generateGRNData = await db.getTableRows(table('GenerateGRN'));
    
    // Get all POs where NextStep is 18
    const pos = sortVendorData.filter(po => String(po.NextStep) === '18');
    return pos.map(po => {
      let vendorDetails = {};
      let items = [];
      let grnId = '';
      
      try { vendorDetails = JSON.parse(po.VendorDetails); } catch {}
      try { items = JSON.parse(po.Items); } catch {}
      
      // Get GRN from GenerateGRN sheet
      const grnData = generateGRNData.find(grn => grn.POId === po.POId);
      if (grnData) {
        try {
          const grnDetails = JSON.parse(grnData.Details || '{}');
          grnId = grnDetails.GRNId || grnData.GRNId || '';
        } catch {}
      }
      
      const completeVendorDetails = vendorData.find(v => v['Vendor Code'] === vendorDetails.vendorCode);
      const enhancedVendorDetails = {
        ...vendorDetails,
        vendorName: completeVendorDetails?.['Vendor Name'] || vendorDetails.vendorName || '',
        vendorContact: completeVendorDetails?.['Vendor Contact'] || vendorDetails.vendorContact || '',
        vendorEmail: completeVendorDetails?.['Vendor Email'] || vendorDetails.vendorEmail || '',
        vendorAddress: completeVendorDetails?.Address || vendorDetails.vendorAddress || '',
        vendorGSTIN: completeVendorDetails?.GSTIN || vendorDetails.vendorGSTIN || '',
        vendorPAN: completeVendorDetails?.['PAN No.'] || vendorDetails.vendorPAN || ''
      };
      
      return {
        ...po,
        VendorDetails: enhancedVendorDetails,
        Items: items,
        GRNId: grnId
      };
    });
  },

  // Get all POs from SortVendor whose nextStep is 19 (for Submit Invoice)
  async getPOsForSubmitInvoice() {
    const sortVendorData = await db.getTableRows(table('SortVendor'));
    const vendorData = await db.getTableRows(table('Vendor'));
    const materialApprovalData = await db.getTableRows(table('MaterialApproval'));
    const generateGRNData = await db.getTableRows(table('GenerateGRN'));
    
    // Get all POs where NextStep is 19
    const pos = sortVendorData.filter(po => String(po.NextStep) === '19');
    return pos.map(po => {
      let vendorDetails = {};
      let items = [];
      let invoiceFileId = '';
      let poCopyFileId = '';
      let grnId = '';
      let grnFileId = '';
      
      try { vendorDetails = JSON.parse(po.VendorDetails); } catch {}
      try { items = JSON.parse(po.Items); } catch {}
      
      // Get invoice and PO copy from MaterialApproval sheet
      const materialApproval = materialApprovalData.find(ma => ma.POId === po.POId);
      if (materialApproval) {
        // File IDs are stored directly in MaterialApproval sheet fields
        invoiceFileId = materialApproval.InvoiceFileId || '';
        poCopyFileId = materialApproval.POCopyFileId || '';
        
        // Also check Details field as fallback (for backward compatibility)
        if (!invoiceFileId || !poCopyFileId) {
          try {
            const approvalDetails = JSON.parse(materialApproval.Details || '{}');
            invoiceFileId = invoiceFileId || approvalDetails.InvoiceFileId || '';
            poCopyFileId = poCopyFileId || approvalDetails.POCopyFileId || '';
          } catch {}
        }
      }
      
      // Get GRN from GenerateGRN sheet
      const grnData = generateGRNData.find(grn => grn.POId === po.POId);
      if (grnData) {
        try {
          const grnDetails = JSON.parse(grnData.Details || '{}');
          grnId = grnDetails.GRNId || grnData.GRNId || '';
          grnFileId = grnDetails.GRNFileId || grnData.GRNDocumentId || '';
        } catch {}
      }
      
      const completeVendorDetails = vendorData.find(v => v['Vendor Code'] === vendorDetails.vendorCode);
      const enhancedVendorDetails = {
        ...vendorDetails,
        vendorName: completeVendorDetails?.['Vendor Name'] || vendorDetails.vendorName || '',
        vendorContact: completeVendorDetails?.['Vendor Contact'] || vendorDetails.vendorContact || '',
        vendorEmail: completeVendorDetails?.['Vendor Email'] || vendorDetails.vendorEmail || '',
        vendorAddress: completeVendorDetails?.Address || vendorDetails.vendorAddress || '',
        vendorGSTIN: completeVendorDetails?.GSTIN || vendorDetails.vendorGSTIN || '',
        vendorPAN: completeVendorDetails?.['PAN No.'] || vendorDetails.vendorPAN || ''
      };
      
      return {
        ...po,
        VendorDetails: enhancedVendorDetails,
        Items: items,
        InvoiceFileId: invoiceFileId,
        POCopyFileId: poCopyFileId,
        GRNId: grnId,
        GRNFileId: grnFileId
      };
    });
  },

  // Get all POs from SortVendor whose nextStep is 20 (for Schedule Payment)
  async getPOsForSchedulePayment() {
    const sortVendorData = await db.getTableRows(table('SortVendor'));
    const vendorData = await db.getTableRows(table('Vendor'));
    const generateGRNData = await db.getTableRows(table('GenerateGRN'));
    
    // Get all POs where NextStep is 20
    const pos = sortVendorData.filter(po => String(po.NextStep) === '20');

    return pos.map(po => {
      let vendorDetails = {};
      let items = [];
      let grnDate = '';
      
      try { vendorDetails = JSON.parse(po.VendorDetails); } catch {}
      try { items = JSON.parse(po.Items); } catch {}
      
      // Get GRN date from GenerateGRN sheet - check CreatedAt field

      const grnData = generateGRNData.find(grn => grn.POId === po.POId);
      if (grnData) {
        // Try to get date from CreatedAt field first, then from Details JSON
        grnDate = grnData.CreatedAt || grnData.GRNDate || '';
        if (!grnDate && grnData.Details) {
          try {
            const grnDetails = JSON.parse(grnData.Details);
            grnDate = grnDetails.GeneratedAt || grnDetails.CreatedAt || grnData.CreatedAt || '';
          } catch (parseError) {
            console.error('Error parsing GRN details:', parseError);
          }
        }
        
        // If still no date, use the CreatedAt from the sheet row
        if (!grnDate) {
          grnDate = grnData.CreatedAt || '';
        }
      } else {
        
      }
      
      const completeVendorDetails = vendorData.find(v => v['Vendor Code'] === vendorDetails.vendorCode);
      const enhancedVendorDetails = {
        ...vendorDetails,
        vendorName: completeVendorDetails?.['Vendor Name'] || vendorDetails.vendorName || '',
        vendorContact: completeVendorDetails?.['Vendor Contact'] || vendorDetails.vendorContact || '',
        vendorEmail: completeVendorDetails?.['Vendor Email'] || vendorDetails.vendorEmail || '',
        vendorAddress: completeVendorDetails?.Address || vendorDetails.vendorAddress || '',
        vendorGSTIN: completeVendorDetails?.GSTIN || vendorDetails.vendorGSTIN || '',
        vendorPAN: completeVendorDetails?.['PAN No.'] || vendorDetails.vendorPAN || ''
      };
      
      return {
        ...po,
        VendorDetails: enhancedVendorDetails,
        Items: items,
        GRNDate: grnDate
      };
    });
  },

  // Get tasks assigned to a specific user
  async getUserTasks(userEmail) {
    try {
      const steps = await db.getTableRows(table(STEPS_SHEET));
      const flowData = await db.getTableRows(table(SHEET_NAME));
      
      // Get all steps assigned to the user that are not completed
      const userSteps = steps.filter(step => 
        step.AssignedTo === userEmail && 
        step.Status !== 'completed' &&
        step.Status !== 'Completed'
      );
      
      // Enhance with flow data
      const enhancedTasks = userSteps.map(step => {
        const flowRecord = flowData.find(flow => flow.IndentNumber === step.IndentNumber);
        return {
          ...step,
          ItemCode: flowRecord?.ItemCode || '',
          ItemName: flowRecord?.ItemName || '',
          Quantity: flowRecord?.Quantity || '',
          Specifications: flowRecord?.Specifications || '',
          Priority: flowRecord?.Priority || 'Medium',
          ExpectedDelivery: flowRecord?.ExpectedDelivery || '',
          CreatedAt: flowRecord?.CreatedAt || step.StartTime || '',
          DueDate: step.DueDate || step.EndTime || ''
        };
      });
      
      return enhancedTasks;
    } catch (error) {
      console.error(`Error fetching tasks for user ${userEmail}:`, error);
      throw error;
    }
  },

  // Get all POs from SortVendor whose nextStep is 21 (for Approve & Release Payment)
  async getPOsForApproveReleasePayment() {
    const sortVendorData = await db.getTableRows(table('SortVendor'));
    const vendorData = await db.getTableRows(table('Vendor'));
    const schedulePaymentData = await db.getTableRows(table('SchedulePayment'));
    
    // Get all POs where NextStep is 21
    const pos = sortVendorData.filter(po => String(po.NextStep) === '21');

    return pos.map(po => {
      let vendorDetails = {};
      let items = [];
      let scheduledPaymentDate = '';
      let scheduledBy = '';
      
      try { vendorDetails = JSON.parse(po.VendorDetails); } catch {}
      try { items = JSON.parse(po.Items); } catch {}
      
      // Get scheduled payment date from SchedulePayment sheet
      const scheduleData = schedulePaymentData.find(schedule => schedule.POId === po.POId);
      if (scheduleData) {
        try {
          const scheduleDetails = JSON.parse(scheduleData.Details || '{}');
          scheduledPaymentDate = scheduleDetails.PaymentDate || scheduleData.PaymentDate || '';
          scheduledBy = scheduleDetails.ScheduledBy || scheduleData.ScheduledBy || '';
        } catch {}
      }
      
      const completeVendorDetails = vendorData.find(v => v['Vendor Code'] === vendorDetails.vendorCode);
      const enhancedVendorDetails = {
        ...vendorDetails,
        vendorName: completeVendorDetails?.['Vendor Name'] || vendorDetails.vendorName || '',
        vendorContact: completeVendorDetails?.['Vendor Contact'] || vendorDetails.vendorContact || '',
        vendorEmail: completeVendorDetails?.['Vendor Email'] || vendorDetails.vendorEmail || '',
        vendorAddress: completeVendorDetails?.Address || vendorDetails.vendorAddress || '',
        vendorGSTIN: completeVendorDetails?.GSTIN || vendorDetails.vendorGSTIN || '',
        vendorPAN: completeVendorDetails?.['PAN No.'] || vendorDetails.vendorPAN || ''
      };
      
      return {
        ...po,
        VendorDetails: enhancedVendorDetails,
        Items: items,
        ScheduledPaymentDate: scheduledPaymentDate,
        ScheduledBy: scheduledBy
      };
    });
  },
};

export default purchaseFlowService; 