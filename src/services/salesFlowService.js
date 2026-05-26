import * as db from '../lib/db';
import config from '../config/config';
import { getAllProductsFromClients } from './clientService';
import { sheetInt, sheetFloat } from '../utils/sheetNumbers';
import { parseJsonArray } from '../utils/parseJsonField';

/** Postgres timestamptz / date columns reject ""; use null for optional dates (legacy flat tables). */
function nullIfBlankTimestamp(v) {
  if (v === '' || v == null) return null;
  return v;
}

/** Flat sheet tables often omit ClientCode; keep link in Notes when needed. */
function notesWithOptionalClientCode(notes, clientCode) {
  const c = clientCode != null && String(clientCode).trim() ? String(clientCode).trim() : '';
  if (!c) return notes || '';
  const line = `[Linked client: ${c}]`;
  const n = notes != null && String(notes).trim() ? String(notes).trim() : '';
  return n ? `${n}\n${line}` : line;
}

function productsInterestedJsonString(val) {
  if (val == null) return '[]';
  if (Array.isArray(val)) return JSON.stringify(val);
  if (typeof val === 'string') {
    const t = val.trim();
    if (!t) return '[]';
    try {
      const p = JSON.parse(t);
      return Array.isArray(p) ? t : JSON.stringify([p]);
    } catch {
      return JSON.stringify([val]);
    }
  }
  return JSON.stringify([val]);
}

/** Flat Supabase inserts: arrays/objects must become JSON text (e.g. ProductsInterested). */
function normalizeSheetRowForInsert(row) {
  if (!row || typeof row !== 'object') return row;
  const out = { ...row };
  for (const key of Object.keys(out)) {
    const v = out[key];
    if (v instanceof Date) {
      out[key] = v.toISOString();
    } else if (v != null && typeof v === 'object') {
      try {
        out[key] = JSON.stringify(v);
      } catch {
        out[key] = '';
      }
    }
  }
  return out;
}

function sanitizeSalesFlowMainInsert(row) {
  const r = { ...row };
  const cs = r.CurrentStep;
  if (cs === '-' || String(cs).trim() === '-1') r.CurrentStep = '-';
  else r.CurrentStep = sheetInt(cs, 1);
  r.TAT = sheetFloat(r.TAT, 1);
  r.StepId = sheetInt(r.StepId, 1);
  const ns = r.NextStep;
  if (ns === '-' || String(ns).trim() === '-1') r.NextStep = '-';
  else r.NextStep = sheetInt(ns, 2);
  if (r.PreviousStep === '' || r.PreviousStep == null) r.PreviousStep = null;
  else r.PreviousStep = sheetInt(r.PreviousStep, 0);
  r.ExpectedDelivery = nullIfBlankTimestamp(r.ExpectedDelivery);
  r.CreatedBy = r.CreatedBy || 'system';
  r.LastModifiedBy = r.LastModifiedBy || r.CreatedBy;
  return r;
}

function sanitizeSalesFlowStepTimestampsForDb(row) {
  if (!row || typeof row !== 'object') return row;
  const r = { ...row };
  if ('StartTime' in r) r.StartTime = nullIfBlankTimestamp(r.StartTime);
  if ('EndTime' in r) r.EndTime = nullIfBlankTimestamp(r.EndTime);
  return r;
}

function sanitizeSalesFlowStepInsert(row) {
  const r = { ...row };
  r.StartTime = nullIfBlankTimestamp(r.StartTime);
  r.EndTime = nullIfBlankTimestamp(r.EndTime);
  if (r.PreviousStep === '' || r.PreviousStep == null) r.PreviousStep = '0';
  else r.PreviousStep = String(sheetInt(r.PreviousStep, 0));
  r.TAT = r.TAT === '' || r.TAT == null ? '1' : String(sheetFloat(r.TAT, 1));
  r.LastModifiedBy = r.LastModifiedBy || 'system';
  const sid = sheetInt(r.StepId, 1);
  r.StepId = String(sid);
  r.StepNumber = String(sheetInt(r.StepNumber, sid));
  const next = coerceSalesFlowNextStep(r.NextStep, 2);
  r.NextStep = next === '-' ? '-' : String(next);
  return r;
}

/** Flatten legacy snake_case / mixed keys from jsonb or flat tables. */
function normalizeSalesFlowRow(flow) {
  if (flow == null || typeof flow !== 'object' || Array.isArray(flow)) return null;
  const out = { ...flow };
  const logId = flow.LogId ?? flow.logId ?? flow.log_id;
  if (logId !== undefined && logId !== null && logId !== '') out.LogId = logId;
  const next = flow.NextStep ?? flow.nextStep ?? flow.next_step;
  if (next !== undefined) out.NextStep = next;
  const cur = flow.CurrentStep ?? flow.currentStep ?? flow.current_step;
  if (cur !== undefined) out.CurrentStep = cur;
  return out;
}

function parseStepNumber(raw) {
  if (raw == null || raw === '' || raw === '-') return null;
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    const inner = raw.nextStep ?? raw.NextStep ?? raw.step;
    if (inner !== undefined) return parseStepNumber(inner);
    return null;
  }
  const n = parseInt(String(raw).trim(), 10);
  return Number.isFinite(n) ? n : null;
}

/** Next step on step rows: integer or '-' / -1; never String(object). */
function coerceSalesFlowNextStep(value, fallback) {
  if (value == null || value === '') return fallback;
  if (value === '-' || value === -1 || value === '-1') return '-';
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const inner = value.nextStep ?? value.NextStep ?? value.step;
    if (inner !== undefined) return coerceSalesFlowNextStep(inner, fallback);
    return fallback;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  const s = String(value).trim();
  if (s === '-' || s === '-1') return '-';
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : fallback;
}

function flowNumericNextStep(flow) {
  const raw = flow?.NextStep ?? flow?.nextStep ?? flow?.next_step;
  return parseStepNumber(raw);
}

function stepRowNumericNext(step) {
  const raw = step?.NextStep ?? step?.nextStep ?? step?.next_step;
  return parseStepNumber(raw);
}

function logIdEquals(a, b) {
  return String(a ?? '') === String(b ?? '');
}

function stepIdEquals(stepIdField, expected) {
  return String(stepIdField ?? '').trim() === String(expected ?? '').trim();
}

function isStepStatusCompleted(status) {
  const s = String(status ?? '').toLowerCase().trim();
  return s === 'completed' || s === 'done';
}

/**
 * Flows that should appear in the "next step" queue (numeric match + step-2 fallback from step 1 row).
 */
function collectFlowsForNextStep(salesFlows, salesFlowSteps, targetStep) {
  const target = Number(targetStep);
  if (!Number.isFinite(target)) return [];
  const seen = new Set();
  const out = [];

  const pushFlow = (flow) => {
    const id = flow?.LogId ?? flow?.logId ?? flow?.log_id;
    if (id == null || id === '') return;
    const key = String(id);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(flow);
  };

  for (const flow of salesFlows) {
    if (flow == null || typeof flow !== 'object') continue;
    if (flowNumericNextStep(flow) === target) pushFlow(flow);
  }

  if (target === 2 && Array.isArray(salesFlowSteps)) {
    for (const step of salesFlowSteps) {
      const sid = String(step.StepId ?? step.stepId ?? step.step_id ?? '').trim();
      if (sid !== '1') continue;
      if (stepRowNumericNext(step) !== 2) continue;
      const status = String(step.Status ?? step.status ?? '').toLowerCase();
      if (status === 'completed') continue;
      const logId = step.LogId ?? step.logId ?? step.log_id;
      const flow = salesFlows.find((f) => String(f.LogId ?? f.logId ?? f.log_id ?? '') === String(logId ?? ''));
      if (flow) pushFlow(flow);
    }
  }

  return out;
}

const SHEET_NAME = config.sheets.salesFlow;
const STEPS_SHEET = config.sheets.salesFlowSteps;
const LEADS_SHEET = config.sheets.logAndQualifyLeads;
const INITIAL_CALL_SHEET = config.sheets.initialCall;
const CHECK_FEASIBILITY_SHEET = config.sheets.checkFeasibility;
const CONFIRM_STANDARD_AND_COMPLIANCE_SHEET = config.sheets.confirmStandardAndCompliance;

function table(sheetName) {
  return db.getTableName(sheetName) || sheetName;
}

async function insertTableRowWithLabel(label, logicalName, row) {
  try {
    await db.insertTableRow(table(logicalName), row);
  } catch (err) {
    const msg = err?.message || err?.details || String(err);
    throw new Error(`${label}: ${msg}`);
  }
}

const COMPLIANCE_PHYSICAL_TABLES = [
  'confirm_standard_and_compliance',
  'confirm_standard_and_compliance_data'
];

function isPostgrestMissingTableError(err) {
  const m = String(err?.message || err?.details || err?.hint || '').toLowerCase();
  return (
    m.includes('schema cache') ||
    m.includes('pgrst205') ||
    m.includes('could not find the table') ||
    (m.includes('relation') && m.includes('does not exist'))
  );
}

/**
 * Try multiple physical table names (migration vs legacy *_data). Table must exist in the Supabase project used by .env.
 */
async function insertComplianceSheetRow(label, row) {
  let lastErr;
  for (const physicalName of COMPLIANCE_PHYSICAL_TABLES) {
    try {
      await db.insertTableRow(physicalName, row);
      return;
    } catch (err) {
      lastErr = err;
      if (isPostgrestMissingTableError(err)) continue;
      const msg = err?.message || err?.details || String(err);
      throw new Error(`${label}: ${msg}`);
    }
  }
  const base =
    lastErr?.message || lastErr?.details || String(lastErr || 'table not available');
  const hint =
    `Neither public.confirm_standard_and_compliance nor public.confirm_standard_and_compliance_data exists for the Supabase project in your .env URL. In that project's SQL Editor, run supabase/migrations/20260405150000_ensure_confirm_standard_and_compliance_table.sql (it ends with NOTIFY to refresh the API). If saving still fails, use Dashboard → Settings → API → Reload schema.`;
  throw new Error(`${label}: ${base} — ${hint}`);
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

// Step Routing Configuration for Sales Flow
// Defines conditional skip rules for various steps
const STEP_ROUTING_CONFIG = {
  // Step 3: Evaluate High-Value Prospects
  // If prospect is not high value, skip to step 6 (Send Quotation)
  3: {
    defaultNext: 4,
    skipConditions: [
      {
        condition: (context) => {
          return context.isHighValue === false || context.highValueStatus === 'No';
        },
        skipTo: 6,
        skipSteps: [4, 5],
        reason: 'Prospect is not high value, skipping feasibility and standards check'
      }
    ]
  },
  // Step 7: Approve Payment Terms
  // If payment terms are rejected, skip to end or handle rejection flow
  7: {
    defaultNext: 8,
    skipConditions: [
      {
        condition: (context) => {
          return context.paymentTermsApproved === false || context.approvalStatus === 'rejected';
        },
        skipTo: 11, // Skip to Order Booking (or handle rejection)
        skipSteps: [8, 9, 10],
        reason: 'Payment terms rejected, skipping sample submission and approvals'
      }
    ]
  },
  // Step 9: Get Approval of Sample
  // If sample is not required, skip sample-related steps
  9: {
    defaultNext: 10,
    skipConditions: [
      {
        condition: (context) => {
          return context.sampleRequired === false || context.sampleNotRequired === true;
        },
        skipTo: 10,
        skipSteps: [8], // Skip step 8 (Sample Submission) if sample not required
        reason: 'Sample not required, skipping sample submission'
      }
    ]
  },
  // Step 10: Approve Strategic Deals
  // If not a strategic deal, skip to order booking
  10: {
    defaultNext: 11,
    skipConditions: [
      {
        condition: (context) => {
          return context.isStrategicDeal === false || context.strategicDealApprovalStatus === 'Not Required';
        },
        skipTo: 11,
        skipSteps: [],
        reason: 'Not a strategic deal, proceeding directly to order booking'
      }
    ]
  }
};

// Get next step based on current step and context
// Returns: { nextStep, skippedSteps, reason }
function getNextStep(currentStep, context = {}) {
  const stepConfig = STEP_ROUTING_CONFIG[currentStep];
  
  if (!stepConfig) {
    // No routing config for this step, return default next (currentStep + 1)
    return {
      nextStep: currentStep + 1,
      skippedSteps: [],
      reason: 'Default routing: next sequential step'
    };
  }

  // Check skip conditions
  for (const skipCondition of stepConfig.skipConditions) {
    if (skipCondition.condition(context)) {
      return {
        nextStep: skipCondition.skipTo,
        skippedSteps: skipCondition.skipSteps || [],
        reason: skipCondition.reason || `Conditional skip from step ${currentStep} to step ${skipCondition.skipTo}`
      };
    }
  }

  // No conditions met, return default next step
  return {
    nextStep: stepConfig.defaultNext,
    skippedSteps: [],
    reason: 'Default routing: no skip conditions met'
  };
}

// Check if a step was previously marked as skipped
async function shouldSkipStep(logId, stepId) {
  try {
    const steps = await db.getTableRows(table(STEPS_SHEET));
    const step = steps.find(s => s.LogId === logId && String(s.StepId) === String(stepId));
    
    if (!step) return false;
    
    // Check if this step is in the SkippedSteps array of any previous step
    const allSteps = steps.filter(s => s.LogId === logId);
    for (const s of allSteps) {
      if (s.SkippedSteps) {
        try {
          const skippedSteps = JSON.parse(s.SkippedSteps);
          if (Array.isArray(skippedSteps) && skippedSteps.includes(stepId)) {
            return true;
          }
        } catch (e) {
          // Invalid JSON, ignore
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if step should be skipped:', error);
    return false;
  }
}

const salesFlowService = {
  // Generate unique EnquiryId (EN + 4 random digits)
  generateLogId() {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `EN${randomDigits}`;
  },

  // Create a new lead and initialize sales flow
  async createLead(leadData, userEmail) {
    const logId = leadData.enquiryNumber || this.generateLogId();
    const now = new Date().toISOString();
    const actor = userEmail && String(userEmail).trim() ? String(userEmail).trim() : 'system';
    const productsJson = productsInterestedJsonString(leadData.productsInterested);

    // Prepare lead data for LogAndQualifyLeads sheet with new fields
    const leadRecord = {
      EnquiryNumber: logId,
      CustomerName: leadData.customerName || leadData.fullName,
      CompanyName: leadData.companyName,
      MobileNumber: leadData.mobileNumber || leadData.phoneNumber,
      EmailId: leadData.emailId || leadData.email,
      ProductsInterested: productsJson,
      Requirement: leadData.requirement,
      LeadAssignedTo: leadData.leadAssignedTo,
      CustomerLocation: leadData.customerLocation,
      CustomerType: leadData.customerType,
      Notes: notesWithOptionalClientCode(leadData.notes, leadData.clientCode),
      DateOfEntry: now,
      CreatedBy: actor,
      CreatedAt: now,
      UpdatedAt: now,
      Status: 'New'
    };

    // Prepare sales flow data
    const salesFlowRecord = sanitizeSalesFlowMainInsert({
      LogId: logId,
      FullName: leadData.customerName || leadData.fullName,
      CompanyName: leadData.companyName,
      Email: leadData.emailId || leadData.email,
      PhoneNumber: leadData.mobileNumber || leadData.phoneNumber,
      ProductsInterested: productsJson,
      LeadSource: leadData.leadSource || '',
      Priority: leadData.priority || 'Medium',
      QualificationStatus: leadData.qualificationStatus || 'New',
      Notes: notesWithOptionalClientCode(leadData.notes, leadData.clientCode),
      CurrentStep: 1,
      Status: 'New',
      CreatedBy: actor,
      CreatedAt: now,
      UpdatedAt: now,
      ExpectedDelivery: '',
      AssignedTo: leadData.leadAssignedTo || 'Sales Executive',
      TAT: 1,
      TATStatus: 'On Time',
      Documents: '[]',
      Comments: '[]',
      LastModifiedBy: actor,
      NextStep: 2,
      PreviousStep: '',
      StepId: 1
    });

    // Prepare step data for SalesFlowSteps - Step 1 only
    const stepRecord = sanitizeSalesFlowStepInsert({
      StepId: '1',
      LogId: logId,
      StepNumber: '1',
      Role: 'Customer Relations Manager',
      Action: 'Log & Qualify Leads',
      Status: 'new',
      AssignedTo: leadData.leadAssignedTo || 'Sales Executive',
      StartTime: now,
      EndTime: '',
      TAT: '1',
      TATStatus: 'On Time',
      Documents: '[]',
      Comments: '[]',
      ApprovalStatus: 'Pending',
      RejectionReason: '',
      NextStep: '2',
      PreviousStep: '',
      Dependencies: '[]',
      LastModifiedBy: actor,
      LastModifiedAt: now,
      Note: 'Lead created and qualified'
    });

    const insertWithLabel = async (label, logicalTable, row) => {
      try {
        await db.insertTableRow(table(logicalTable), row);
      } catch (err) {
        const msg = err?.message || err?.details || String(err);
        throw new Error(`${label}: ${msg}`);
      }
    };

    await insertWithLabel('Lead sheet', LEADS_SHEET, leadRecord);
    await insertWithLabel('Sales flow', SHEET_NAME, salesFlowRecord);
    await insertWithLabel('Sales flow steps', STEPS_SHEET, stepRecord);

    return {
      success: true,
      logId: logId,
      message: 'Lead created successfully'
    };
  },

  // Get all sales flows
  async getAllSalesFlows() {
    try {
      const data = await db.getTableRows(table(SHEET_NAME));

      const activeFlows = data
        .map(normalizeSalesFlowRow)
        .filter((flow) => flow != null && flow.NextStep !== '-');

      return activeFlows.map((flow) => ({
        ...flow,
        ProductsInterested: parseJsonArray(flow.ProductsInterested),
        Documents: parseJsonArray(flow.Documents),
        Comments: parseJsonArray(flow.Comments)
      }));
    } catch (error) {
      console.error('Error getting sales flows:', error);
      throw error;
    }
  },

  // Get all sales flow steps
  async getAllSalesFlowSteps() {
    try {
      const data = await db.getTableRows(table(STEPS_SHEET));

      const activeSteps = (data || []).filter(
        (step) => step != null && typeof step === 'object' && step.NextStep !== '-'
      );

      return activeSteps.map((step) => ({
        ...step,
        Documents: parseJsonArray(step.Documents),
        Comments: parseJsonArray(step.Comments),
        Dependencies: parseJsonArray(step.Dependencies)
      }));
    } catch (error) {
      console.error('Error getting sales flow steps:', error);
      throw error;
    }
  },

  // Delete completed sales flows (where NextStep is "-")
  async deleteCompletedSalesFlows() {
    try {
      const steps = await db.getTableRows(table(STEPS_SHEET));
      const flows = await db.getTableRows(table(SHEET_NAME));
      
      const completedSteps = steps.filter(step => step.NextStep === '-');
      const completedFlows = flows.filter(flow => flow.NextStep === '-');
      // Delete completed steps
      for (let i = steps.length - 1; i >= 0; i--) {
        const step = steps[i];
        if (step.NextStep === '-') {
          const rowIndex = i + 2; // +2 for header and 1-based indexing
          await deleteRowByIndex(STEPS_SHEET, rowIndex);
        }
      }
      
      // Delete completed flows
      for (let i = flows.length - 1; i >= 0; i--) {
        const flow = flows[i];
        if (flow.NextStep === '-') {
          const rowIndex = i + 2; // +2 for header and 1-based indexing
          await deleteRowByIndex(SHEET_NAME, rowIndex);
        }
      }
      
      return {
        deletedSteps: completedSteps.length,
        deletedFlows: completedFlows.length
      };
    } catch (error) {
      console.error('Error deleting completed sales flows:', error);
      throw error;
    }
  },

  // Delete a specific sales flow by LogId
  async deleteSalesFlow(logId) {
    try {
      const steps = await db.getTableRows(table(STEPS_SHEET));
      const flows = await db.getTableRows(table(SHEET_NAME));
      const leads = await db.getTableRows(table(LEADS_SHEET));
      
      let deletedSteps = 0;
      let deletedFlows = 0;
      let deletedLeads = 0;
      
      // Delete all steps for this LogId (iterate in reverse to avoid index issues)
      for (let i = steps.length - 1; i >= 0; i--) {
        const step = steps[i];
        if (step.LogId === logId) {
          const rowIndex = i + 2; // +2 for header and 1-based indexing
          await deleteRowByIndex(STEPS_SHEET, rowIndex);
          deletedSteps++;
        }
      }
      
      // Delete the main flow record
      for (let i = flows.length - 1; i >= 0; i--) {
        const flow = flows[i];
        if (flow.LogId === logId) {
          const rowIndex = i + 2; // +2 for header and 1-based indexing
          await deleteRowByIndex(SHEET_NAME, rowIndex);
          deletedFlows++;
        }
      }
      
      // Delete the lead record
      for (let i = leads.length - 1; i >= 0; i--) {
        const lead = leads[i];
        if (lead.EnquiryNumber === logId || lead.LogId === logId) {
          const rowIndex = i + 2; // +2 for header and 1-based indexing
          await deleteRowByIndex(LEADS_SHEET, rowIndex);
          deletedLeads++;
        }
      }
      
      return {
        success: true,
        deletedSteps,
        deletedFlows,
        deletedLeads,
        message: `Successfully deleted sales flow ${logId} (${deletedSteps} steps, ${deletedFlows} flows, ${deletedLeads} leads)`
      };
    } catch (error) {
      console.error(`Error deleting sales flow ${logId}:`, error);
      throw error;
    }
  },

  // Get sales flows by user role
  async getSalesFlowsByRole(userRole) {
    try {
      const flows = await this.getAllSalesFlows();
      
      // Filter flows based on user role and current step
      const roleStepMapping = {
        'Customer Relations Manager': [1, 9, 11],
        'Sales Executive': [2, 3, 6, 8],
        'NPD': [4],
        'Quality Engineer': [5],
        'Director': [7, 10]
      };

      const allowedSteps = roleStepMapping[userRole] || [];
      
      return flows.filter(flow => {
        const currentStep = parseInt(flow.CurrentStep) || parseInt(flow.StepId);
        const nextStep = parseInt(flow.NextStep);
        
        // For Sales Executive, allow access to flows where they are assigned OR where the next step is one they can handle
        if (userRole === 'Sales Executive') {
          return (allowedSteps.includes(currentStep) && flow.AssignedTo === userRole) ||
                 (allowedSteps.includes(nextStep) && flow.AssignedTo === userRole);
        }
        
        return allowedSteps.includes(currentStep) && (flow.AssignedTo) === (userRole)|| (allowedSteps.includes(nextStep) && flow.AssignedTo === userRole);;
      });
    } catch (error) {
      console.error('Error getting sales flows by role:', error);
      throw error;
    }
  },

  // Get sales flow by LogId
  async getSalesFlowByLogId(logId) {
    try {
      const flows = await this.getAllSalesFlows();
      return flows.find(flow => flow.LogId === logId);
    } catch (error) {
      console.error('Error getting sales flow by LogId:', error);
      throw error;
    }
  },

  // Update sales flow step
  async updateSalesFlowStep(logId, stepId, status, data, userEmail) {
    try {
      const now = new Date().toISOString();
      const stepIdNum = sheetInt(stepId, 1);
      // Update SalesFlowSteps
      const steps = await db.getTableRows(table(STEPS_SHEET));

      const stepUpdates = [];

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        if (logIdEquals(step.LogId, logId) && stepIdEquals(step.StepId, stepId)) {
          const rowIndex = i + 2;
          let commentsVal = step.Comments;
          if (data.comments != null) commentsVal = JSON.stringify(data.comments);
          else if (data.Comments != null && typeof data.Comments === 'object')
            commentsVal = JSON.stringify(data.Comments);
          else if (typeof data.Comments === 'string') commentsVal = data.Comments;

          const updatedStepDraft = sanitizeSalesFlowStepTimestampsForDb({
            ...step,
            Status: status,
            ApprovalStatus: data.ApprovalStatus || step.ApprovalStatus,
            RejectionReason: data.RejectionReason || step.RejectionReason,
            Documents: data.documents ? JSON.stringify(data.documents) : step.Documents,
            Comments: commentsVal,
            LastModifiedBy: userEmail,
            LastModifiedAt: now,
            EndTime: status === 'completed' ? now : step.EndTime
          });

          if (status === 'completed') {
            const defaultNext = this.getNextStep(stepIdNum);
            const nextStepNum =
              data.NextStep !== undefined
                ? coerceSalesFlowNextStep(data.NextStep, defaultNext)
                : defaultNext;
            updatedStepDraft.NextStep =
              nextStepNum === '-' || nextStepNum == null ? '-' : String(nextStepNum);
            
            // Create/update the next step record if it exists and is not the final step
            if (nextStepNum != null && nextStepNum !== '' && nextStepNum !== '-' && nextStepNum !== null) {
              // Check if next step record already exists
              const nextStepExists = steps.find(
                (s) => logIdEquals(s.LogId, logId) && stepIdEquals(s.StepId, nextStepNum)
              );
              
              if (!nextStepExists) {
                const nextStepRecord = sanitizeSalesFlowStepInsert({
                  StepId: String(nextStepNum),
                  LogId: logId,
                  StepNumber: String(nextStepNum),
                  Role: this.getStepRole(Number(nextStepNum)),
                  Action: this.getStepAction(Number(nextStepNum)),
                  Status: 'new',
                  AssignedTo: this.getNextAssignee(Number(nextStepNum)),
                  StartTime: now,
                  EndTime: '',
                  TAT: '1',
                  TATStatus: 'On Time',
                  Documents: '[]',
                  Comments: '[]',
                  ApprovalStatus: 'Pending',
                  RejectionReason: '',
                  NextStep: this.getNextStep(Number(nextStepNum))
                    ? String(this.getNextStep(Number(nextStepNum)))
                    : '-',
                  PreviousStep: String(stepIdNum),
                  Dependencies: '[]',
                  LastModifiedBy: userEmail,
                  LastModifiedAt: now,
                  Note: `Step ${nextStepNum} ready for ${this.getStepRole(Number(nextStepNum))}`
                });

                await db.insertTableRow(table(STEPS_SHEET), nextStepRecord);
              } else {
                // Update existing next step record to make it active
                const nextStepIndex = steps.findIndex(
                  (s) => logIdEquals(s.LogId, logId) && stepIdEquals(s.StepId, nextStepNum)
                );
                
                if (nextStepIndex !== -1) {
                  const nextStepRowIndex = nextStepIndex + 2;
                  const existingStart = nullIfBlankTimestamp(steps[nextStepIndex].StartTime);
                  const nextStepUpdate = sanitizeSalesFlowStepInsert(
                    sanitizeSalesFlowStepTimestampsForDb({
                      ...steps[nextStepIndex],
                      Status: 'new',
                      AssignedTo: this.getNextAssignee(Number(nextStepNum)),
                      StartTime: existingStart ?? now,
                      LastModifiedBy: userEmail,
                      LastModifiedAt: now
                    })
                  );
                  stepUpdates.push(updateRowByIndex(STEPS_SHEET, nextStepRowIndex, nextStepUpdate));
                }
              }
            }
          }
          stepUpdates.push(
            updateRowByIndex(STEPS_SHEET, rowIndex, sanitizeSalesFlowStepInsert(updatedStepDraft))
          );
        }
      }

      // Update main SalesFlow
      const flows = await db.getTableRows(table(SHEET_NAME));

      const flowUpdates = [];
      
      for (let i = 0; i < flows.length; i++) {
        const flow = flows[i];
        if (flow.LogId === logId) {
          const rowIndex = i + 2;
          const defaultNext = this.getNextStep(stepIdNum);
          const resolvedNext =
            status === 'completed'
              ? data.NextStep !== undefined
                ? coerceSalesFlowNextStep(data.NextStep, defaultNext)
                : defaultNext
              : null;
          const newStatus =
            status === 'completed'
              ? resolvedNext === '-'
                ? 'Completed'
                : 'In Progress'
              : status === 'rejected'
                ? 'Rejected'
                : flow.Status;

          const updatedFlow = sanitizeSalesFlowMainInsert({
            ...flow,
            Status: newStatus,
            CurrentStep:
              status === 'completed' ? resolvedNext ?? flow.CurrentStep : flow.CurrentStep,
            NextStep: status === 'completed' ? resolvedNext ?? flow.NextStep : flow.NextStep,
            UpdatedAt: now,
            LastModifiedBy: userEmail,
            AssignedTo:
              status === 'completed' && resolvedNext != null && resolvedNext !== '-'
                ? this.getNextAssignee(Number(resolvedNext))
                : flow.AssignedTo
          });
          flowUpdates.push(updateRowByIndex(SHEET_NAME, rowIndex, updatedFlow));
        }
      }
      await Promise.all([...stepUpdates, ...flowUpdates]);
      return true;
    } catch (error) {
      console.error('Error updating sales flow step:', error);
      throw error;
    }
  },

  // Get next step number - updated for 11-step flow
  getNextStep(currentStep) {
    const stepFlow = {
      1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 
      10: 11, 11: null  // Step 11 is the final step
    };
    return stepFlow[currentStep] || null;
  },

  // Get next assignee based on step - updated for 11-step flow
  getNextAssignee(stepId) {
    const assigneeMapping = {
      1: 'Customer Relations Manager',
      2: 'Sales Executive',
      3: 'Sales Executive',
      4: 'NPD',
      5: 'Quality Engineer',
      6: 'Sales Executive',
      7: 'Director',
      8: 'Sales Executive',
      9: 'Customer Relations Manager',
      10: 'Director',
      11: 'Customer Relations Manager'  // Final step
    };
    return assigneeMapping[stepId] || '';
  },

  // Get step action name based on step number
  getStepAction(stepId) {
    const actionMapping = {
      1: 'Log & Qualify Leads',
      2: 'Initial Call & Requirement Gathering',
      3: 'Evaluate High-Value Prospects',
      4: 'Check feasibility',
      5: 'Confirm standards and compliance',
      6: 'Send Quotation',
      7: 'Approve Payment Terms',
      8: 'Sample Submission',
      9: 'Get Approval of Sample',
      10: 'Approve Strategic Deals',
      11: 'Order Booking'
    };
    return actionMapping[stepId] || '';
  },

  // Get step role based on step number
  getStepRole(stepId) {
    return this.getNextAssignee(stepId);
  },

  // Get step details by LogId and StepId
  async getStepDetails(logId, stepId) {
    try {
      const steps = await db.getTableRows(table(STEPS_SHEET));
      return steps.find(
        (step) => logIdEquals(step.LogId, logId) && stepIdEquals(step.StepId, stepId)
      );
    } catch (error) {
      console.error('Error getting step details:', error);
      throw error;
    }
  },

  // Get all leads
  async getAllLeads() {
    try {
      const data = await db.getTableRows(table(LEADS_SHEET));
      return (data || [])
        .filter((lead) => lead != null && typeof lead === 'object' && !Array.isArray(lead))
        .map((lead) => ({
          ...lead,
          LogId: lead.EnquiryNumber || lead.LogId || lead.logId || lead.enquiry_number,
          FullName: lead.CustomerName || lead.FullName,
          Email: lead.EmailId || lead.Email,
          PhoneNumber: lead.MobileNumber || lead.PhoneNumber,
          ProductsInterested: parseJsonArray(lead.ProductsInterested)
        }));
    } catch (error) {
      console.error('Error getting leads:', error);
      throw error;
    }
  },

  // Get lead by LogId
  async getLeadByLogId(logId) {
    try {
      const leads = await this.getAllLeads();
      return leads.find(lead => lead.LogId === logId || lead.EnquiryNumber === logId);
    } catch (error) {
      console.error('Error getting lead by LogId:', error);
      throw error;
    }
  },

  // Update lead
  async updateLead(logId, updatedData, userEmail) {
    try {
      const now = new Date().toISOString();
      const leads = await db.getTableRows(table(LEADS_SHEET));
      
      for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        if (lead.LogId === logId || lead.EnquiryNumber === logId) {
          const rowIndex = i + 2;
          const updatedLead = {
            ...lead,
            ...updatedData,
            UpdatedAt: now,
            LastModifiedBy: userEmail
          };
          
          await updateRowByIndex(LEADS_SHEET, rowIndex, updatedLead);
          return true;
        }
      }
      
      throw new Error('Lead not found');
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  },

  // Get products for dropdown
  async getProducts() {
    try {
      // First, try to get products from PRODUCT sheet
      const products = await db.getTableRows(table('PRODUCT'));
      
      if (products && products.length > 0) {
        return products.map(product => ({
          value: product.ProductCode,
          label: product.ProductCode
        }));
      }
      
      // If PRODUCT sheet is empty or doesn't exist, fall back to getting products from CLIENT sheet
      console.log('PRODUCT sheet is empty or not found. Falling back to products from CLIENT sheet...');
      const clientProducts = await getAllProductsFromClients();
      
      if (clientProducts && clientProducts.length > 0) {
        return clientProducts.map(product => ({
          value: product.productCode,
          label: product.productCode
        }));
      }
      
      console.warn('No products found in either PRODUCT sheet or CLIENT sheet');
      return [];
    } catch (error) {
      console.error('Error getting products:', error);
      
      // Try fallback to CLIENT sheet even if PRODUCT sheet throws an error
      try {
        console.log('Attempting to get products from CLIENT sheet as fallback...');
        const clientProducts = await getAllProductsFromClients();
        
        if (clientProducts && clientProducts.length > 0) {
          return clientProducts.map(product => ({
            value: product.productCode,
            label: product.productCode
          }));
        }
      } catch (fallbackError) {
        console.error('Error getting products from CLIENT sheet:', fallbackError);
      }
      
      return [];
    }
  },

  // Get all clients (from both regular clients and prospects)
  async getAllClientsAndProspects() {
    try {
      const { getAllClients } = await import('./clientService');
      const { getAllClients: getAllProspects } = await import('./prospectsClientService');
      
      const [regularClients, prospects] = await Promise.all([
        getAllClients().catch(() => []),
        getAllProspects().catch(() => [])
      ]);
      
      // Combine and format for dropdown
      const allClients = [
        ...regularClients.map(client => ({
          value: client.clientCode,
          label: `${client.clientCode} - ${client.clientName}`,
          type: 'Client',
          ...client
        })),
        ...prospects.map(prospect => ({
          value: prospect.clientCode,
          label: `${prospect.clientCode} - ${prospect.clientName}`,
          type: 'Prospect',
          ...prospect
        }))
      ];
      
      return allClients;
    } catch (error) {
      console.error('Error getting clients and prospects:', error);
      return [];
    }
  },

  // Get products for a specific client
  async getClientProducts(clientCode) {
    try {
      const { getAllClients } = await import('./clientService');
      const { getAllClients: getAllProspects } = await import('./prospectsClientService');
      
      // Try to find in regular clients first
      const regularClients = await getAllClients().catch(() => []);
      let client = regularClients.find(c => c.clientCode === clientCode);
      
      // If not found, try prospects
      if (!client) {
        const prospects = await getAllProspects().catch(() => []);
        client = prospects.find(c => c.clientCode === clientCode);
      }
      
      if (!client || !client.products || client.products.length === 0) {
        return [];
      }
      
      // Format products for dropdown
      return client.products.map(product => ({
        value: product.productCode || product.ProductCode,
        label: `${product.productCode || product.ProductCode} - ${product.productName || product.ProductName || 'Unknown Product'}`,
        ...product
      }));
    } catch (error) {
      console.error('Error getting client products:', error);
      return [];
    }
  },

  // Get lead sources
  getLeadSources() {
    return [
      { value: 'LinkedIn', label: 'LinkedIn' },
      { value: 'Email', label: 'Email' },
      { value: 'Website', label: 'Website' },
      { value: 'Trade Show', label: 'Trade Show' },
      { value: 'Referral', label: 'Referral' },
      { value: 'Cold Call', label: 'Cold Call' },
      { value: 'Social Media', label: 'Social Media' },
      { value: 'Other', label: 'Other' }
    ];
  },

  // Get priority levels
  getPriorityLevels() {
    return [
      { value: 'Low', label: 'Low' },
      { value: 'Medium', label: 'Medium' },
      { value: 'High', label: 'High' }
    ];
  },

  // Get qualification statuses
  getQualificationStatuses() {
    return [
      { value: 'New', label: 'New' },
      { value: 'Contacted', label: 'Contacted' },
      { value: 'Qualified', label: 'Qualified' },
      { value: 'Disqualified', label: 'Disqualified' }
    ];
  },

  // Get leads by next step
  async getLeadsByNextStep(nextStep) {
    try {
      const salesFlows = await this.getAllSalesFlows();
      const salesFlowSteps = await db.getTableRows(table(STEPS_SHEET)).catch(() => []);

      // Step 6: same relaxed matching as getStandardsAndComplianceDetails / getCheckFeasibilityDetails
      if (nextStep == 6) {
        const step5CompletedNext6 = salesFlowSteps.filter(
          (step) =>
            step &&
            typeof step === 'object' &&
            stepIdEquals(step.StepId, 5) &&
            isStepStatusCompleted(step.Status) &&
            stepRowNumericNext(step) === 6
        );

        const flowsForStep = salesFlows.filter((flow) => {
          if (flow == null || typeof flow !== 'object') return false;
          const step5Match = step5CompletedNext6.some((s) => logIdEquals(s.LogId, flow.LogId));
          const mainNextIs6 = flowNumericNextStep(flow) === 6;
          if (!step5Match && !mainNextIs6) return false;

          const step6 = salesFlowSteps.find(
            (s) => s && logIdEquals(s.LogId, flow.LogId) && stepIdEquals(s.StepId, 6)
          );
          return !step6 || !isStepStatusCompleted(step6.Status);
        });

        const allLeads = await this.getAllLeads();

        const enrichedFlows = flowsForStep.map((flow) => {
          const leadDetails = allLeads.find(
            (lead) =>
              logIdEquals(lead.LogId, flow.LogId) || logIdEquals(lead.EnquiryNumber, flow.LogId)
          );
          
          if (leadDetails) {
            return {
              ...flow,
              // Override with detailed lead information from LogAndQualifyLeads
              FullName: leadDetails.FullName || leadDetails.CustomerName,
              Email: leadDetails.Email || leadDetails.EmailId,
              PhoneNumber: leadDetails.PhoneNumber || leadDetails.MobileNumber,
              CompanyName: leadDetails.CompanyName,
              // Add all detailed fields from LogAndQualifyLeads
              Requirement: leadDetails.Requirement,
              LeadAssignedTo: leadDetails.LeadAssignedTo,
              CustomerLocation: leadDetails.CustomerLocation,
              CustomerType: leadDetails.CustomerType,
              DateOfEntry: leadDetails.DateOfEntry,
              CreatedBy: leadDetails.CreatedBy,
              CreatedAt: leadDetails.CreatedAt,
              UpdatedAt: leadDetails.UpdatedAt,
              Status: leadDetails.Status,
              // Keep original fields for backward compatibility
              ProductsInterested: leadDetails.ProductsInterested,
              LeadSource: leadDetails.LeadSource,
              Priority: leadDetails.Priority,
              QualificationStatus: leadDetails.QualificationStatus,
              Notes: leadDetails.Notes,
              // Include all other fields from LogAndQualifyLeads
              EnquiryNumber: leadDetails.EnquiryNumber,
              CustomerName: leadDetails.CustomerName,
              MobileNumber: leadDetails.MobileNumber,
              EmailId: leadDetails.EmailId
            };
          }
          
          return flow;
        });
        
        return enrichedFlows;
      }

      // Step 7 (Approve payment): step 6 row completed → 7, or main NextStep 7; exclude if step 7 already completed
      if (nextStep == 7) {
        const step6CompletedNext7 = salesFlowSteps.filter(
          (step) =>
            step &&
            typeof step === 'object' &&
            stepIdEquals(step.StepId, 6) &&
            isStepStatusCompleted(step.Status) &&
            stepRowNumericNext(step) === 7
        );

        const flowsForStep = salesFlows.filter((flow) => {
          if (flow == null || typeof flow !== 'object') return false;
          const step6Match = step6CompletedNext7.some((s) => logIdEquals(s.LogId, flow.LogId));
          const mainNextIs7 = flowNumericNextStep(flow) === 7;
          if (!step6Match && !mainNextIs7) return false;

          const step7 = salesFlowSteps.find(
            (s) => s && logIdEquals(s.LogId, flow.LogId) && stepIdEquals(s.StepId, 7)
          );
          return !step7 || !isStepStatusCompleted(step7.Status);
        });

        const allLeads = await this.getAllLeads();

        const enrichedFlows = flowsForStep.map((flow) => {
          const leadDetails = allLeads.find(
            (lead) =>
              logIdEquals(lead.LogId, flow.LogId) || logIdEquals(lead.EnquiryNumber, flow.LogId)
          );

          if (leadDetails) {
            return {
              ...flow,
              FullName: leadDetails.FullName || leadDetails.CustomerName,
              Email: leadDetails.Email || leadDetails.EmailId,
              PhoneNumber: leadDetails.PhoneNumber || leadDetails.MobileNumber,
              CompanyName: leadDetails.CompanyName,
              Requirement: leadDetails.Requirement,
              LeadAssignedTo: leadDetails.LeadAssignedTo,
              CustomerLocation: leadDetails.CustomerLocation,
              CustomerType: leadDetails.CustomerType,
              DateOfEntry: leadDetails.DateOfEntry,
              CreatedBy: leadDetails.CreatedBy,
              CreatedAt: leadDetails.CreatedAt,
              UpdatedAt: leadDetails.UpdatedAt,
              Status: leadDetails.Status,
              ProductsInterested: leadDetails.ProductsInterested,
              LeadSource: leadDetails.LeadSource,
              Priority: leadDetails.Priority,
              QualificationStatus: leadDetails.QualificationStatus,
              Notes: leadDetails.Notes,
              EnquiryNumber: leadDetails.EnquiryNumber,
              CustomerName: leadDetails.CustomerName,
              MobileNumber: leadDetails.MobileNumber,
              EmailId: leadDetails.EmailId
            };
          }

          return flow;
        });

        return enrichedFlows;
      }

      const flowsForStep = collectFlowsForNextStep(salesFlows, salesFlowSteps, nextStep);

      // Get detailed lead information from LogAndQualifyLeads sheet
      const allLeads = await this.getAllLeads();

      // Merge sales flow data with detailed lead information
      const enrichedFlows = flowsForStep.map((flow) => {
        const flowKey = String(flow.LogId ?? '');
        const leadDetails = allLeads.find(
          (lead) =>
            String(lead.LogId ?? '') === flowKey ||
            String(lead.EnquiryNumber ?? '') === flowKey
        );
        
        if (leadDetails) {
          return {
            ...flow,
            // Override with detailed lead information from LogAndQualifyLeads
            FullName: leadDetails.FullName || leadDetails.CustomerName,
            Email: leadDetails.Email || leadDetails.EmailId,
            PhoneNumber: leadDetails.PhoneNumber || leadDetails.MobileNumber,
            CompanyName: leadDetails.CompanyName,
            // Add all detailed fields from LogAndQualifyLeads
            Requirement: leadDetails.Requirement,
            LeadAssignedTo: leadDetails.LeadAssignedTo,
            CustomerLocation: leadDetails.CustomerLocation,
            CustomerType: leadDetails.CustomerType,
            DateOfEntry: leadDetails.DateOfEntry,
            CreatedBy: leadDetails.CreatedBy,
            CreatedAt: leadDetails.CreatedAt,
            UpdatedAt: leadDetails.UpdatedAt,
            Status: leadDetails.Status,
            // Keep original fields for backward compatibility
            ProductsInterested: leadDetails.ProductsInterested,
            LeadSource: leadDetails.LeadSource,
            Priority: leadDetails.Priority,
            QualificationStatus: leadDetails.QualificationStatus,
            Notes: leadDetails.Notes,
            // Include all other fields from LogAndQualifyLeads
            EnquiryNumber: leadDetails.EnquiryNumber,
            CustomerName: leadDetails.CustomerName,
            MobileNumber: leadDetails.MobileNumber,
            EmailId: leadDetails.EmailId
          };
        }
        
        return flow;
      });
      
      return enrichedFlows;
    } catch (error) {
      console.error('Error getting leads by next step:', error);
      throw error;
    }
  },

  // Get all details from LogAndQualifyLeads for prospects with next step 3
  async getHighValueProspectsDetails() {
    try {
      // Get all leads from LogAndQualifyLeads sheet
      const allLeads = await this.getAllLeads();
      
      // Get sales flows with next step 3
      const salesFlows = await this.getAllSalesFlows();
      const flowsForStep3 = salesFlows.filter(flow => flow.NextStep == 3);
      
      // Get SalesFlowSteps to verify step 3 records exist
      const salesFlowSteps = await db.getTableRows(table(STEPS_SHEET)).catch(() => []);
      
      // Get InitialCall data to include needs/requirements gathered in step 2
      const initialCallData = await db.getTableRows(table(INITIAL_CALL_SHEET)).catch(() => []);
      
      // Get detailed information for each prospect
      const prospectsWithDetails = flowsForStep3.map(flow => {
        const leadDetails = allLeads.find(lead => 
          lead.LogId === flow.LogId || lead.EnquiryNumber === flow.LogId
        );
        
        // Find corresponding InitialCall data (most recent one for this LogId)
        const initialCallRecords = initialCallData.filter(ic => 
          ic.LogId === flow.LogId || ic.logId === flow.LogId || ic.EnquiryNumber === flow.LogId
        );
        const latestInitialCall = initialCallRecords.length > 0 
          ? initialCallRecords[initialCallRecords.length - 1] 
          : null;
        
        // Find corresponding step 3 record
        const step3Record = salesFlowSteps.find(step => 
          step.LogId === flow.LogId && String(step.StepId) === '3'
        );
        
        // Build base object with flow data and InitialCall data (always include InitialCall data)
        const baseData = {
          // Sales flow information
          LogId: flow.LogId,
          CurrentStep: flow.CurrentStep,
          NextStep: flow.NextStep,
          Status: flow.Status,
          AssignedTo: flow.AssignedTo,
          TAT: flow.TAT,
          TATStatus: flow.TATStatus,
          ExpectedDelivery: flow.ExpectedDelivery,
          LastModifiedBy: flow.LastModifiedBy,
          // Initial Call data from step 2 (CRITICAL - always include this)
          Needs: latestInitialCall?.Needs || latestInitialCall?.needs || '',
          ContactedBy: latestInitialCall?.ContactedBy || latestInitialCall?.contactedBy || '',
          ContactedAt: latestInitialCall?.ContactedAt || latestInitialCall?.contactedAt || '',
          InitialCallStatus: latestInitialCall?.Status || '',
          // Step 3 record information
          Step3Status: step3Record?.Status || 'new',
          Step3AssignedTo: step3Record?.AssignedTo || flow.AssignedTo
        };
        
        // If leadDetails exists, merge it with base data
        if (leadDetails) {
          return {
            ...baseData,
            // Complete lead details from LogAndQualifyLeads
            EnquiryNumber: leadDetails.EnquiryNumber,
            CustomerName: leadDetails.CustomerName,
            CompanyName: leadDetails.CompanyName,
            MobileNumber: leadDetails.MobileNumber,
            EmailId: leadDetails.EmailId,
            Requirement: leadDetails.Requirement,
            LeadAssignedTo: leadDetails.LeadAssignedTo,
            CustomerLocation: leadDetails.CustomerLocation,
            CustomerType: leadDetails.CustomerType,
            Notes: leadDetails.Notes,
            DateOfEntry: leadDetails.DateOfEntry,
            CreatedBy: leadDetails.CreatedBy,
            CreatedAt: leadDetails.CreatedAt,
            UpdatedAt: leadDetails.UpdatedAt,
            LeadStatus: leadDetails.Status,
            // Additional fields for compatibility
            FullName: leadDetails.CustomerName,
            Email: leadDetails.EmailId,
            PhoneNumber: leadDetails.MobileNumber,
            ProductsInterested: leadDetails.ProductsInterested,
            LeadSource: leadDetails.LeadSource,
            Priority: leadDetails.Priority,
            QualificationStatus: leadDetails.QualificationStatus
          };
        }
        
        // If no leadDetails, still return base data with flow and InitialCall data
        // Also try to get data from InitialCall record itself
        if (latestInitialCall) {
          return {
            ...baseData,
            // Get data from InitialCall record if leadDetails not found
            CustomerName: latestInitialCall.FullName || latestInitialCall.fullName || flow.FullName || '',
            CompanyName: latestInitialCall.CompanyName || latestInitialCall.companyName || flow.CompanyName || '',
            MobileNumber: latestInitialCall.PhoneNumber || latestInitialCall.phoneNumber || flow.PhoneNumber || '',
            EmailId: latestInitialCall.Email || latestInitialCall.email || flow.Email || '',
            FullName: latestInitialCall.FullName || latestInitialCall.fullName || flow.FullName || '',
            Email: latestInitialCall.Email || latestInitialCall.email || flow.Email || '',
            PhoneNumber: latestInitialCall.PhoneNumber || latestInitialCall.phoneNumber || flow.PhoneNumber || '',
            ProductsInterested: latestInitialCall.ProductsInterested || latestInitialCall.productsInterested || flow.ProductsInterested || '[]',
            LeadSource: latestInitialCall.LeadSource || latestInitialCall.leadSource || flow.LeadSource || '',
            Priority: latestInitialCall.Priority || latestInitialCall.priority || flow.Priority || 'Medium',
            QualificationStatus: latestInitialCall.QualificationStatus || latestInitialCall.qualificationStatus || flow.QualificationStatus || 'New'
          };
        }
        
        // Fallback: return flow data with empty InitialCall fields
        return {
          ...baseData,
          CustomerName: flow.FullName || '',
          CompanyName: flow.CompanyName || '',
          MobileNumber: flow.PhoneNumber || '',
          EmailId: flow.Email || '',
          FullName: flow.FullName || '',
          Email: flow.Email || '',
          PhoneNumber: flow.PhoneNumber || '',
          ProductsInterested: flow.ProductsInterested || '[]',
          LeadSource: flow.LeadSource || '',
          Priority: flow.Priority || 'Medium',
          QualificationStatus: flow.QualificationStatus || 'New'
        };
      });
      
      // Filter to only include leads where step 3 exists and is ready (status 'new' or doesn't exist yet)
      // Also ensure that InitialCall data exists (step 2 was completed)
      const readyForStep3 = prospectsWithDetails.filter(prospect => {
        const step3Record = salesFlowSteps.find(step => 
          step.LogId === prospect.LogId && String(step.StepId) === '3'
        );
        // Include if step 3 doesn't exist yet (will be created) or if it has status 'new'
        // Also ensure that InitialCall was completed (has Needs or ContactedBy)
        const hasInitialCallData = prospect.Needs || prospect.ContactedBy;
        return (!step3Record || step3Record.Status === 'new' || step3Record.Status === '') && hasInitialCallData;
      });
      
      return readyForStep3;
    } catch (error) {
      console.error('Error getting high value prospects details:', error);
      throw error;
    }
  },

  // Get all details from LogAndQualifyLeads for prospects with next step 4 (Check Feasibility)
  async getCheckFeasibilityDetails() {
    try {
      // Get all leads from LogAndQualifyLeads sheet
      const allLeads = await this.getAllLeads();
      
      // Get sales flows and steps
      const salesFlows = await this.getAllSalesFlows();
      const salesFlowSteps = (await db.getTableRows(table(STEPS_SHEET)).catch(() => [])) || [];

      // Step 3 finished and routed to feasibility (next = 4). Allow numeric StepId / case on Status.
      const step3Completed = salesFlowSteps.filter(
        (step) =>
          step &&
          typeof step === 'object' &&
          stepIdEquals(step.StepId, 3) &&
          isStepStatusCompleted(step.Status) &&
          stepRowNumericNext(step) === 4
      );

      // Include if step-3 row qualifies OR main flow already points to step 4 (covers StepId type bugs in updates)
      const flowsForStep4 = salesFlows.filter((flow) => {
        if (flow == null || typeof flow !== 'object') return false;
        const step3Match = step3Completed.some((s) => logIdEquals(s.LogId, flow.LogId));
        const mainNextIs4 = flowNumericNextStep(flow) === 4;
        if (!step3Match && !mainNextIs4) return false;

        const step4 = salesFlowSteps.find(
          (s) => s && logIdEquals(s.LogId, flow.LogId) && stepIdEquals(s.StepId, 4)
        );
        return !step4 || !isStepStatusCompleted(step4.Status);
      });
      
      // Get InitialCall data to include needs/requirements gathered in step 2
      const initialCallData = await db.getTableRows(table(INITIAL_CALL_SHEET)).catch(() => []);
      
      // Get detailed information for each prospect
      const feasibilityWithDetails = flowsForStep4.map((flow) => {
        const leadDetails = allLeads.find(
          (lead) =>
            logIdEquals(lead.LogId, flow.LogId) || logIdEquals(lead.EnquiryNumber, flow.LogId)
        );

        const initialCallRecords = initialCallData.filter(
          (ic) =>
            ic &&
            (logIdEquals(ic.LogId, flow.LogId) ||
              logIdEquals(ic.logId, flow.LogId) ||
              logIdEquals(ic.EnquiryNumber, flow.LogId))
        );
        const latestInitialCall = initialCallRecords.length > 0
          ? initialCallRecords[initialCallRecords.length - 1]
          : null;

        const step3Record = salesFlowSteps.find(
          (step) => step && logIdEquals(step.LogId, flow.LogId) && stepIdEquals(step.StepId, 3)
        );
        
        if (leadDetails) {
          return {
            // Sales flow information
            LogId: flow.LogId,
            CurrentStep: flow.CurrentStep,
            NextStep: flow.NextStep,
            Status: flow.Status,
            AssignedTo: flow.AssignedTo,
            TAT: flow.TAT,
            TATStatus: flow.TATStatus,
            ExpectedDelivery: flow.ExpectedDelivery,
            LastModifiedBy: flow.LastModifiedBy,
            // Initial Call data from step 2
            Needs: latestInitialCall?.Needs || latestInitialCall?.needs || '',
            ContactedBy: latestInitialCall?.ContactedBy || latestInitialCall?.contactedBy || '',
            ContactedAt: latestInitialCall?.ContactedAt || latestInitialCall?.contactedAt || '',
            InitialCallStatus: latestInitialCall?.Status || '',
            // Step 3 record information
            Step3Status: step3Record?.Status || 'completed',
            Step3AssignedTo: step3Record?.AssignedTo || flow.AssignedTo,
            // Complete lead details from LogAndQualifyLeads
            EnquiryNumber: leadDetails.EnquiryNumber,
            CustomerName: leadDetails.CustomerName,
            CompanyName: leadDetails.CompanyName,
            MobileNumber: leadDetails.MobileNumber,
            EmailId: leadDetails.EmailId,
            Requirement: leadDetails.Requirement,
            LeadAssignedTo: leadDetails.LeadAssignedTo,
            CustomerLocation: leadDetails.CustomerLocation,
            CustomerType: leadDetails.CustomerType,
            Notes: leadDetails.Notes,
            DateOfEntry: leadDetails.DateOfEntry,
            CreatedBy: leadDetails.CreatedBy,
            CreatedAt: leadDetails.CreatedAt,
            UpdatedAt: leadDetails.UpdatedAt,
            LeadStatus: leadDetails.Status,
            // Additional fields for compatibility
            FullName: leadDetails.CustomerName,
            Email: leadDetails.EmailId,
            PhoneNumber: leadDetails.MobileNumber,
            ProductsInterested: leadDetails.ProductsInterested,
            LeadSource: leadDetails.LeadSource,
            Priority: leadDetails.Priority,
            QualificationStatus: leadDetails.QualificationStatus
          };
        }
        
        // Fallback: return flow data if leadDetails not found
        return {
          ...flow,
          FullName: flow.FullName || '',
          Email: flow.Email || '',
          PhoneNumber: flow.PhoneNumber || '',
          CustomerName: flow.FullName || '',
          CompanyName: flow.CompanyName || '',
          MobileNumber: flow.PhoneNumber || '',
          EmailId: flow.Email || '',
          Requirement: flow.Notes || '',
          ProductsInterested: flow.ProductsInterested || '[]',
          LeadSource: flow.LeadSource || '',
          Priority: flow.Priority || 'Medium',
          QualificationStatus: flow.QualificationStatus || 'New'
        };
      });
      
      return feasibilityWithDetails;
    } catch (error) {
      console.error('Error getting check feasibility details:', error);
      throw error;
    }
  },

  // Save initial call details
  async saveInitialCall(initialCallData) {
    try {
      const now = new Date().toISOString();
      const logId = initialCallData.LogId || initialCallData.logId;
      // 1. Save ALL details to InitialCall sheet (append as new row)
      const initialCallHeaders = [
        'LogId', 'FullName', 'CompanyName', 'Email', 'PhoneNumber', 'ProductsInterested',
        'LeadSource', 'Priority', 'QualificationStatus', 'Notes', 'Needs', 'ContactedBy',
        'ContactedAt', 'Status'
      ];
      // Build the row as an object with keys matching the headers
      const initialCallRecord = {};
      initialCallHeaders.forEach(header => {
        let value = initialCallData[header]; // Try exact match first
        if (value === undefined) {
          // Try camelCase variations
          const camelCase = header.charAt(0).toUpperCase() + header.slice(1);
          value = initialCallData[camelCase];
        }
        if (value === undefined) {
          // Try other variations
          value = initialCallData[header.toLowerCase()];
        }
        // Special handling for ProductsInterested
        if (header === 'ProductsInterested' && Array.isArray(value)) {
          value = JSON.stringify(value);
        }
        // Special handling for Needs field (check both capitalized and lowercase)
        if (header === 'Needs' && value === undefined) {
          value = initialCallData.needs || initialCallData.Needs || initialCallData.Requirement || '';
        }
        // Special handling for ContactedBy field
        if (header === 'ContactedBy' && value === undefined) {
          value = initialCallData.contactedBy || initialCallData.ContactedBy || '';
        }
        // Special handling for ContactedAt field
        if (header === 'ContactedAt' && value === undefined) {
          value = initialCallData.contactedAt || initialCallData.ContactedAt || new Date().toISOString();
        }
        initialCallRecord[header] = value !== undefined ? value : '';
      });
      await db.insertTableRow(table(INITIAL_CALL_SHEET), initialCallRecord);

      // 2. Update step 2 (Initial Call) to completed and move to next step using updateSalesFlowStep
      await this.updateSalesFlowStep(
        logId,
        '2', // Step 2: Initial Call and Requirement Gathering
        'completed',
        {
          NextStep: '3', // Move to step 3: Evaluate High-Value Prospects
          Comments: JSON.stringify([{
            comment: `Requirements gathered: ${initialCallData.needs || initialCallData.Needs}`,
            user: initialCallData.contactedBy || initialCallData.ContactedBy,
            timestamp: now
          }]),
          Note: 'Initial call completed and requirements gathered'
        },
        initialCallData.contactedBy || initialCallData.ContactedBy
      );

      return true;
    } catch (error) {
      console.error('Error saving initial call:', error);
      throw error;
    }
  },

  // Update sales flow
  async updateSalesFlow(logId, updatedData, userEmail) {
    try {
      const now = new Date().toISOString();
      const salesFlows = await db.getTableRows(table(SHEET_NAME));
      
      for (let i = 0; i < salesFlows.length; i++) {
        const flow = salesFlows[i];
        if (flow.LogId === logId) {
          const rowIndex = i + 2;
          const updatedFlow = {
            ...flow,
            ...updatedData,
            UpdatedAt: now,
            LastModifiedBy: userEmail
          };
          
          await updateRowByIndex(SHEET_NAME, rowIndex, updatedFlow);
          return true;
        }
      }
      
      throw new Error('Sales flow not found');
    } catch (error) {
      console.error('Error updating sales flow:', error);
      throw error;
    }
  },

  // Update sales flow steps
  async updateSalesFlowSteps(logId, stepId, updatedData, userEmail) {
    try {
      const now = new Date().toISOString();
      const salesFlowSteps = await db.getTableRows(table(STEPS_SHEET));
      
      for (let i = 0; i < salesFlowSteps.length; i++) {
        const step = salesFlowSteps[i];
        if (logIdEquals(step.LogId, logId) && stepIdEquals(step.StepId, stepId)) {
          const rowIndex = i + 2;
          const updatedStep = sanitizeSalesFlowStepTimestampsForDb({
            ...step,
            ...updatedData,
            LastModifiedBy: userEmail,
            LastModifiedAt: now
          });

          await updateRowByIndex(STEPS_SHEET, rowIndex, updatedStep);
          return true;
        }
      }
      
      throw new Error('Sales flow step not found');
    } catch (error) {
      console.error('Error updating sales flow step:', error);
      throw error;
    }
  },

  // Save high value evaluation
  async saveHighValueEvaluation(evaluationData) {
    try {
      const now = new Date().toISOString();
      const logId = evaluationData.LogId || evaluationData.logId;
      
      if (!logId) {
        throw new Error('LogId is required for high value evaluation');
      }
      
      // 1. Save ALL details to EvaluateHighValueProspects sheet (append as new row)
      const evaluationHeaders = [
        'logId', 'fullName', 'companyName', 'email', 'phoneNumber',
        'leadSource', 'priority', 'qualificationStatus', 'notes', 'evaluationValue',
        'evaluationNotes', 'evaluatedBy', 'evaluatedAt', 'status'
      ];
      
      // Build the row as an object with keys matching the headers
      const evaluationRecord = {};
      evaluationHeaders.forEach(header => {
        let value = evaluationData[header]; // Try exact match first
        if (value === undefined) {
          // Try camelCase variations
          const camelCase = header.charAt(0).toUpperCase() + header.slice(1);
          value = evaluationData[camelCase];
        }
        if (value === undefined) {
          // Try other variations
          value = evaluationData[header.toLowerCase()];
        }
        
        // Special handling for specific fields
        if (header === 'logId' && value === undefined) {
          value = logId;
        }
        
        if (header === 'fullName' && value === undefined) {
          value = evaluationData.FullName || evaluationData.fullName || evaluationData.CustomerName || '';
        }
        
        if (header === 'companyName' && value === undefined) {
          value = evaluationData.CompanyName || evaluationData.companyName || '';
        }
        
        if (header === 'email' && value === undefined) {
          value = evaluationData.Email || evaluationData.email || evaluationData.EmailId || '';
        }
        
        if (header === 'phoneNumber' && value === undefined) {
          value = evaluationData.PhoneNumber || evaluationData.phoneNumber || evaluationData.MobileNumber || '';
        }
        
        if (header === 'evaluationValue' && value === undefined) {
          value = evaluationData.evaluationValue || evaluationData.EvaluationValue || '';
        }
        
        if (header === 'evaluationNotes' && value === undefined) {
          value = evaluationData.evaluationNotes || evaluationData.EvaluationNotes || '';
        }
        
        if (header === 'evaluatedBy' && value === undefined) {
          value = evaluationData.evaluatedBy || evaluationData.EvaluatedBy || '';
        }
        
        if (header === 'evaluatedAt' && value === undefined) {
          value = evaluationData.evaluatedAt || evaluationData.EvaluatedAt || now;
        }
        
        evaluationRecord[header] = value !== undefined ? value : '';
      });
      
      // Ensure logId is set
      evaluationRecord.logId = logId;
      
      await db.insertTableRow(table(config.sheets.evaluateHighValueProspects), evaluationRecord);

      // 2. Use routing system to determine next step
      const evaluationValue = evaluationData.evaluationValue || evaluationData.EvaluationValue || '';
      const isHighValue = evaluationValue === 'Yes' || evaluationValue === 'High' || evaluationValue === 'High Value';
      
      const routingContext = {
        isHighValue: isHighValue,
        highValueStatus: evaluationValue
      };

      const evaluatedBy = evaluationData.evaluatedBy || evaluationData.EvaluatedBy || 'Sales Executive';
      
      // 2. Check if step 3 exists, if not create it first
      const steps = await db.getTableRows(table(STEPS_SHEET));
      const step3Exists = steps.find(s => s.LogId === logId && String(s.StepId) === '3');
      
      if (!step3Exists) {
        // Create step 3 record
        const step3Record = {
          StepId: '3',
          LogId: logId,
          StepNumber: '3',
          Role: 'Sales Executive',
          Action: 'Evaluate High-Value Prospects',
          Status: 'new',
          AssignedTo: 'Sales Executive',
          StartTime: now,
          EndTime: '',
          TAT: '1',
          TATStatus: 'On Time',
          Documents: '[]',
          Comments: '[]',
          ApprovalStatus: 'Pending',
          RejectionReason: '',
          NextStep: '4',
          PreviousStep: '2',
          Dependencies: '[]',
          LastModifiedBy: evaluatedBy,
          LastModifiedAt: now,
          Note: 'Step 3 ready for evaluation'
        };
        await db.insertTableRow(table(STEPS_SHEET), sanitizeSalesFlowStepInsert(step3Record));
      }

      // 3. Determine next step based on routing
      const routingResult = getNextStep(3, routingContext);
      const nextStep = routingResult.nextStep;
      
      // 4. Update step 3 (Evaluate High-Value Prospects) to completed and move to next step using updateSalesFlowStep
      await this.updateSalesFlowStep(
        logId,
        '3', // Step 3: Evaluate High-Value Prospects
        'completed',
        {
          NextStep: String(nextStep), // Move to next step based on routing
          Comments: JSON.stringify([{
            comment: `Evaluation completed: ${evaluationValue}. ${routingResult.reason}`,
            user: evaluatedBy,
            timestamp: now
          }]),
          Note: `High value evaluation completed: ${evaluationValue}`
        },
        evaluatedBy
      );

      return true;
    } catch (error) {
      console.error('Error saving high value evaluation:', error);
      console.error('Evaluation data received:', evaluationData);
      throw error;
    }
  },

  // Save feasibility check details
  async saveFeasibilityCheck(feasibilityData) {
    try {
      const now = new Date().toISOString();
      const logId = feasibilityData.LogId || feasibilityData.logId;
      
      if (!logId) {
        throw new Error('LogId is required for feasibility check');
      }

      // 1. Save ALL details to CheckFeasibility sheet (append as new row)
      const feasibilityHeaders = [
        'LogId', 'FullName', 'CompanyName', 'Email', 'PhoneNumber', 'Requirement',
        'LeadSource', 'Priority', 'QualificationStatus', 'Notes', 'FeasibilityStatus',
        'FeasibilityNotes', 'CheckedBy', 'CheckedAt', 'Status'
      ];
      
      // Build the row as an object with keys matching the headers
      const feasibilityRecord = {};
      feasibilityHeaders.forEach(header => {
        let value = feasibilityData[header]; // Try exact match first
        if (value === undefined) {
          // Try camelCase variations
          const camelCase = header.charAt(0).toUpperCase() + header.slice(1);
          value = feasibilityData[camelCase];
        }
        if (value === undefined) {
          // Try other variations
          value = feasibilityData[header.toLowerCase()];
        }
        
        // Special handling for feasibilityStatus field
        if (header === 'FeasibilityStatus' && value === undefined) {
          value = feasibilityData.feasibilityStatus || feasibilityData.FeasibilityStatus || '';
        }
        
        // Special handling for feasibilityNotes field
        if (header === 'FeasibilityNotes' && value === undefined) {
          value = feasibilityData.feasibilityNotes || feasibilityData.FeasibilityNotes || '';
        }
        
        // Special handling for checkedBy field
        if (header === 'CheckedBy' && value === undefined) {
          value = feasibilityData.checkedBy || feasibilityData.CheckedBy || '';
        }
        
        // Special handling for checkedAt field
        if (header === 'CheckedAt' && value === undefined) {
          value = feasibilityData.checkedAt || feasibilityData.CheckedAt || now;
        }
        
        feasibilityRecord[header] = value !== undefined ? value : '';
      });
      
      // Ensure LogId is set
      feasibilityRecord.LogId = logId;
      
      await db.insertTableRow(table(CHECK_FEASIBILITY_SHEET), feasibilityRecord);

      // 2. Update step 4 (Check Feasibility) to completed and move to next step using updateSalesFlowStep
      const checkedBy = feasibilityData.checkedBy || feasibilityData.CheckedBy || 'NPD';
      const feasibilityStatusValue = feasibilityData.FeasibilityStatus || feasibilityData.feasibilityStatus || (feasibilityData.feasibilityStatus === true ? 'Feasible' : 'Not Feasible') || '';
      
      await this.updateSalesFlowStep(
        logId,
        '4', // Step 4: Check Feasibility
        'completed',
        {
          NextStep: '5', // Move to step 5: Confirm Standards and Compliance
          Comments: JSON.stringify([{
            comment: `Feasibility check completed: ${feasibilityStatusValue}`,
            user: checkedBy,
            timestamp: now
          }]),
          Note: 'Feasibility check completed'
        },
        checkedBy
      );

      return true;
    } catch (error) {
      console.error('Error saving feasibility check:', error);
      console.error('Feasibility data received:', feasibilityData);
      throw error;
    }
  },

  // Get leads for step 5 (Standards and Compliance)
  async getStandardsAndComplianceDetails() {
    try {
      const allLeads = await this.getAllLeads();
      const salesFlows = await this.getAllSalesFlows();
      const salesFlowSteps = (await db.getTableRows(table(STEPS_SHEET)).catch(() => [])) || [];

      const step4CompletedAndNextIs5 = salesFlowSteps.filter(
        (step) =>
          step &&
          typeof step === 'object' &&
          stepIdEquals(step.StepId, 4) &&
          isStepStatusCompleted(step.Status) &&
          stepRowNumericNext(step) === 5
      );

      const flowsForStep5 = salesFlows.filter((flow) => {
        if (flow == null || typeof flow !== 'object') return false;
        const step4Match = step4CompletedAndNextIs5.some((s) => logIdEquals(s.LogId, flow.LogId));
        const mainNextIs5 = flowNumericNextStep(flow) === 5;
        if (!step4Match && !mainNextIs5) return false;

        const step5 = salesFlowSteps.find(
          (s) => s && logIdEquals(s.LogId, flow.LogId) && stepIdEquals(s.StepId, 5)
        );
        return !step5 || !isStepStatusCompleted(step5.Status);
      });

      const complianceWithDetails = flowsForStep5.map((flow) => {
        const leadDetails = allLeads.find(
          (lead) =>
            logIdEquals(lead.LogId, flow.LogId) || logIdEquals(lead.EnquiryNumber, flow.LogId)
        );

        if (leadDetails) {
          return {
            ...flow,
            EnquiryNumber: leadDetails.EnquiryNumber,
            CustomerName: leadDetails.CustomerName,
            CompanyName: leadDetails.CompanyName,
            MobileNumber: leadDetails.MobileNumber,
            EmailId: leadDetails.EmailId,
            Requirement: leadDetails.Requirement,
            LeadAssignedTo: leadDetails.LeadAssignedTo,
            CustomerLocation: leadDetails.CustomerLocation,
            CustomerType: leadDetails.CustomerType,
            Notes: leadDetails.Notes,
            DateOfEntry: leadDetails.DateOfEntry,
            CreatedBy: leadDetails.CreatedBy,
            CreatedAt: leadDetails.CreatedAt,
            UpdatedAt: leadDetails.UpdatedAt,
            LeadStatus: leadDetails.Status,
            FullName: leadDetails.CustomerName,
            Email: leadDetails.EmailId,
            PhoneNumber: leadDetails.MobileNumber,
            ProductsInterested: leadDetails.ProductsInterested,
            LeadSource: leadDetails.LeadSource,
            Priority: leadDetails.Priority,
            QualificationStatus: leadDetails.QualificationStatus
          };
        }
        return flow;
      });
      return complianceWithDetails;
    } catch (error) {
      console.error('Error getting standards and compliance details:', error);
      throw error;
    }
  },

  // Save standards and compliance check
  async saveStandardsAndComplianceCheck(complianceData) {
    try {
      const now = new Date().toISOString();
      const logId = complianceData.LogId || complianceData.logId;
      
      if (!logId) {
        throw new Error('LogId is required for standards and compliance check');
      }
      
      // 1. Save ALL details to ConfirmStandardAndCompliance sheet (append as new row)
      const complianceHeaders = [
        'LogId', 'FullName', 'CompanyName', 'Email', 'PhoneNumber', 'ProductsInterested', 'Requirement',
        'LeadSource', 'Priority', 'QualificationStatus', 'Notes', 'ComplianceStatus',
        'ComplianceNotes', 'CheckedBy', 'CheckedAt', 'Status'
      ];
      
      // Build the row as an object with keys matching the headers
      const complianceRecord = {};
      complianceHeaders.forEach(header => {
        let value = complianceData[header]; // Try exact match first
        if (value === undefined) {
          // Try camelCase variations
          const camelCase = header.charAt(0).toUpperCase() + header.slice(1);
          value = complianceData[camelCase];
        }
        if (value === undefined) {
          // Try other variations
          value = complianceData[header.toLowerCase()];
        }
        
        // Special handling for complianceStatus field
        if (header === 'ComplianceStatus' && value === undefined) {
          value = complianceData.complianceStatus || complianceData.ComplianceStatus || '';
        }
        
        // Special handling for complianceNotes field
        if (header === 'ComplianceNotes' && value === undefined) {
          value = complianceData.complianceNotes || complianceData.ComplianceNotes || '';
        }
        
        // Special handling for checkedBy field
        if (header === 'CheckedBy' && value === undefined) {
          value = complianceData.checkedBy || complianceData.CheckedBy || '';
        }
        
        // Special handling for checkedAt field
        if (header === 'CheckedAt' && value === undefined) {
          value = complianceData.checkedAt || complianceData.CheckedAt || new Date().toISOString();
        }
        
        complianceRecord[header] = value !== undefined ? value : '';
      });
      complianceRecord.LogId = logId;
      await insertComplianceSheetRow(
        'Standards & compliance sheet',
        normalizeSheetRowForInsert(complianceRecord)
      );

      const checkedBy = complianceData.checkedBy || complianceData.CheckedBy || 'Quality Engineer';
      const complianceStatusValue = complianceData.ComplianceStatus || complianceData.complianceStatus || '';

      // Ensure step 5 exists before updating
      const steps = await db.getTableRows(table(STEPS_SHEET));
      const step5Exists = steps.find((s) => logIdEquals(s.LogId, logId) && stepIdEquals(s.StepId, 5));

      if (!step5Exists) {
        const step5Record = {
          StepId: '5',
          LogId: logId,
          StepNumber: '5',
          Role: 'Quality Engineer',
          Action: 'Confirm Standards and Compliance',
          Status: 'new',
          AssignedTo: 'Quality Engineer',
          StartTime: now,
          EndTime: '',
          TAT: '3',
          TATStatus: 'On Time',
          Documents: '[]',
          Comments: '[]',
          ApprovalStatus: 'Pending',
          RejectionReason: '',
          NextStep: '6',
          PreviousStep: '4',
          Dependencies: '[]',
          LastModifiedBy: checkedBy,
          LastModifiedAt: now,
          Note: 'Step 5 ready for compliance check'
        };
        await db.insertTableRow(table(STEPS_SHEET), sanitizeSalesFlowStepInsert(step5Record));
      }

      // 2. Update step 5 (Confirm Standards and Compliance) to completed and move to next step using updateSalesFlowStep
      await this.updateSalesFlowStep(
        logId,
        '5', // Step 5: Confirm Standards and Compliance
        'completed',
        {
          NextStep: '6', // Move to step 6: Send Quotation
          Comments: JSON.stringify([{
            comment: `Standards and compliance check completed: ${complianceStatusValue}`,
            user: checkedBy,
            timestamp: now
          }]),
          Note: 'Standards and compliance check completed'
        },
        checkedBy
      );

      return true;
    } catch (error) {
      console.error('Error saving standards and compliance check:', error);
      throw error;
    }
  },

  // Save Send Quotation data and update sales flow steps
  async saveSendQuotation(quotationData) {
    try {
      const now = new Date().toISOString();
      const logId = quotationData.logId || quotationData.LogId;
      
      if (!logId) {
        throw new Error('LogId is required for sending quotation');
      }

      // 1. Save quotation data to SendQuotation sheet
      const quotationRecord = {
        LogId: logId,
        CustomerName: quotationData.customerName || quotationData.CustomerName || '',
        CompanyName: quotationData.companyName || quotationData.CompanyName || '',
        Email: quotationData.email || quotationData.Email || '',
        PhoneNumber: quotationData.phoneNumber || quotationData.PhoneNumber || '',
        ProductsInterested: quotationData.productsInterested ? JSON.stringify(quotationData.productsInterested) : '[]',
        Requirement: quotationData.requirement || quotationData.Requirement || '',
        QuotationItems: quotationData.quotationItems ? JSON.stringify(quotationData.quotationItems) : '[]',
        TotalAmount: quotationData.totalAmount || quotationData.TotalAmount || 0,
        QuotationDocumentId: quotationData.quotationDocumentId || quotationData.QuotationDocumentId || '',
        CreatedBy: quotationData.createdBy || quotationData.CreatedBy || '',
        CreatedAt: now,
        Status: 'Sent'
      };

      await db.insertSendQuotationRow(quotationRecord);

      // 2. Update step 6 (Send Quotation) to completed and move to next step using updateSalesFlowStep
      await this.updateSalesFlowStep(
        logId,
        '6', // Step 6: Send Quotation
        'completed',
        {
          NextStep: '7', // Move to step 7: Approve Payment Terms
          Comments: JSON.stringify([{
            comment: `Quotation sent successfully with total amount: ${quotationData.totalAmount || quotationData.TotalAmount || 0}`,
            user: quotationData.createdBy || quotationData.CreatedBy,
            timestamp: now
          }]),
          Note: 'Quotation sent successfully'
        },
        quotationData.createdBy || quotationData.CreatedBy
      );

      return true;
    } catch (error) {
      console.error('Error saving send quotation:', error);
      throw error;
    }
  },

  // Save approve payment terms
  async saveApprovePaymentTerms(paymentData) {
    try {
      const now = new Date().toISOString();
      const logId = paymentData.LogId || paymentData.logId;
      
      if (!logId) {
        throw new Error('LogId is required for approving payment terms');
      }

      // 1. Save payment terms data to ApprovePaymentTerms sheet
      const paymentHeaders = [
        'LogId', 'CustomerName', 'CompanyName', 'Email', 'PhoneNumber', 'ProductsInterested',
        'Requirement', 'QuotationDocumentId', 'TotalAmount', 'PaymentMethod', 'EstimatedPaymentDate',
        'PaymentTerms', 'Notes', 'ApprovedBy', 'ApprovedAt', 'Status'
      ];
      
      // Build the row as an object with keys matching the headers
      const paymentRecord = {};
      paymentHeaders.forEach(header => {
        let value = paymentData[header]; // Try exact match first
        if (value === undefined) {
          // Try camelCase variations
          const camelCase = header.charAt(0).toUpperCase() + header.slice(1);
          value = paymentData[camelCase];
        }
        if (value === undefined) {
          // Try other variations
          value = paymentData[header.toLowerCase()];
        }
        
        // Special handling for specific fields
        if (header === 'PaymentMethod' && value === undefined) {
          value = paymentData.paymentMethod || paymentData.PaymentMethod || '';
        }
        
        if (header === 'EstimatedPaymentDate' && value === undefined) {
          value = paymentData.estimatedPaymentDate || paymentData.EstimatedPaymentDate || '';
        }
        
        if (header === 'PaymentTerms' && value === undefined) {
          value = paymentData.paymentTerms || paymentData.PaymentTerms || '';
        }
        
        if (header === 'Notes' && value === undefined) {
          value = paymentData.notes || paymentData.Notes || '';
        }
        
        if (header === 'ApprovedBy' && value === undefined) {
          value = paymentData.approvedBy || paymentData.ApprovedBy || '';
        }
        
        if (header === 'ApprovedAt' && value === undefined) {
          value = paymentData.approvedAt || paymentData.ApprovedAt || new Date().toISOString();
        }
        
        paymentRecord[header] = value !== undefined ? value : '';
      });
      await db.insertTableRow(table(config.sheets.approvePaymentTerms), paymentRecord);

      // 2. Update step 7 (Approve Payment Terms) to completed and move to next step using updateSalesFlowStep
      await this.updateSalesFlowStep(
        logId,
        '7', // Step 7: Approve Payment Terms
        'completed',
        {
          NextStep: '8', // Move to step 8: Sample Submission
          Comments: JSON.stringify([{
            comment: `Payment terms approved: ${paymentData.paymentMethod || paymentData.PaymentMethod || 'N/A'}`,
            user: paymentData.approvedBy || paymentData.ApprovedBy,
            timestamp: now
          }]),
          Note: 'Payment terms approved successfully'
        },
        paymentData.approvedBy || paymentData.ApprovedBy
      );

      return true;
    } catch (error) {
      console.error('Error saving approve payment terms:', error);
      throw error;
    }
  },

  // Get leads for sample submission (next step 8)
  async getSampleSubmissionDetails() {
    try {
      const allLeads = await this.getAllLeads();
      const salesFlows = await this.getAllSalesFlows();
      const salesFlowSteps = (await db.getTableRows(table(STEPS_SHEET)).catch(() => [])) || [];

      // Same pattern as step 6: step 7 row completed → 8, or main flow NextStep 8; exclude if step 8 already done
      const step7CompletedNext8 = salesFlowSteps.filter(
        (step) =>
          step &&
          typeof step === 'object' &&
          stepIdEquals(step.StepId, 7) &&
          isStepStatusCompleted(step.Status) &&
          stepRowNumericNext(step) === 8
      );

      const flowsForStep8 = salesFlows.filter((flow) => {
        if (flow == null || typeof flow !== 'object') return false;
        const step7Match = step7CompletedNext8.some((s) => logIdEquals(s.LogId, flow.LogId));
        const mainNextIs8 = flowNumericNextStep(flow) === 8;
        if (!step7Match && !mainNextIs8) return false;

        const step8 = salesFlowSteps.find(
          (s) => s && logIdEquals(s.LogId, flow.LogId) && stepIdEquals(s.StepId, 8)
        );
        return !step8 || !isStepStatusCompleted(step8.Status);
      });

      const quotationData = await db.getSendQuotationRows();

      const sampleSubmissionWithDetails = flowsForStep8.map((flow) => {
        const leadDetails = allLeads.find(
          (lead) =>
            logIdEquals(lead.LogId, flow.LogId) || logIdEquals(lead.EnquiryNumber, flow.LogId)
        );

        const quotationDoc = quotationData.find(
          (quote) =>
            quote &&
            (logIdEquals(quote.LogId, flow.LogId) ||
              logIdEquals(quote.logId, flow.LogId))
        );
        
        if (leadDetails) {
          return {
            // Sales flow information
            LogId: flow.LogId,
            CurrentStep: flow.CurrentStep,
            NextStep: flow.NextStep,
            Status: flow.Status,
            AssignedTo: flow.AssignedTo,
            TAT: flow.TAT,
            TATStatus: flow.TATStatus,
            ExpectedDelivery: flow.ExpectedDelivery,
            LastModifiedBy: flow.LastModifiedBy,
            // Complete lead details from LogAndQualifyLeads
            EnquiryNumber: leadDetails.EnquiryNumber,
            CustomerName: leadDetails.CustomerName,
            CompanyName: leadDetails.CompanyName,
            MobileNumber: leadDetails.MobileNumber,
            EmailId: leadDetails.EmailId,
            Requirement: leadDetails.Requirement,
            LeadAssignedTo: leadDetails.LeadAssignedTo,
            CustomerLocation: leadDetails.CustomerLocation,
            CustomerType: leadDetails.CustomerType,
            Notes: leadDetails.Notes,
            DateOfEntry: leadDetails.DateOfEntry,
            CreatedBy: leadDetails.CreatedBy,
            CreatedAt: leadDetails.CreatedAt,
            UpdatedAt: leadDetails.UpdatedAt,
            LeadStatus: leadDetails.Status,
            // Additional fields for compatibility
            FullName: leadDetails.CustomerName,
            Email: leadDetails.EmailId,
            PhoneNumber: leadDetails.MobileNumber,
            ProductsInterested: leadDetails.ProductsInterested,
            LeadSource: leadDetails.LeadSource,
            Priority: leadDetails.Priority,
            QualificationStatus: leadDetails.QualificationStatus,
            // Quotation document details
            QuotationDocumentId: quotationDoc ? quotationDoc.QuotationDocumentId : '',
            QuotationItems: quotationDoc ? quotationDoc.QuotationItems : '[]',
            TotalAmount: quotationDoc ? quotationDoc.TotalAmount : 0,
            QuotationCreatedAt: quotationDoc ? quotationDoc.CreatedAt : '',
            QuotationStatus: quotationDoc ? quotationDoc.Status : ''
          };
        }
        
        return flow;
      });
      
      return sampleSubmissionWithDetails;
    } catch (error) {
      console.error('Error getting sample submission details:', error);
      throw error;
    }
  },

  // Save sample submission
  async saveSampleSubmission(sampleData) {
    try {
      const now = new Date().toISOString();
      const logId = sampleData.LogId || sampleData.logId;
      
      if (!logId) {
        throw new Error('LogId is required for sample submission');
      }

      // 1. Save sample submission data to SampleSubmission sheet
      const sampleHeaders = [
        'LogId', 'CustomerName', 'CompanyName', 'Email', 'PhoneNumber', 'ProductsInterested',
        'Requirement', 'QuotationDocumentId', 'TotalAmount', 'SampleType', 'SampleMethod',
        'SampleNotes', 'SubmittedBy', 'SubmittedAt', 'Status'
      ];
      
      // Build the row as an object with keys matching the headers
      const sampleRecord = {};
      sampleHeaders.forEach(header => {
        let value = sampleData[header]; // Try exact match first
        if (value === undefined) {
          // Try camelCase variations
          const camelCase = header.charAt(0).toUpperCase() + header.slice(1);
          value = sampleData[camelCase];
        }
        if (value === undefined) {
          // Try other variations
          value = sampleData[header.toLowerCase()];
        }
        
        // Special handling for specific fields
        if (header === 'SampleType' && value === undefined) {
          value = sampleData.sampleType || sampleData.SampleType || '';
        }
        
        if (header === 'SampleMethod' && value === undefined) {
          value = sampleData.sampleMethod || sampleData.SampleMethod || '';
        }
        
        if (header === 'SampleNotes' && value === undefined) {
          value = sampleData.sampleNotes || sampleData.SampleNotes || '';
        }
        
        if (header === 'SubmittedBy' && value === undefined) {
          value = sampleData.submittedBy || sampleData.SubmittedBy || '';
        }
        
        if (header === 'SubmittedAt' && value === undefined) {
          value = sampleData.submittedAt || sampleData.SubmittedAt || new Date().toISOString();
        }
        
        sampleRecord[header] = value !== undefined ? value : '';
      });
      await db.insertTableRow(table(config.sheets.sampleSubmission), sampleRecord);

      // 2. Update step 8 (Sample Submission) to completed and move to next step using updateSalesFlowStep
      await this.updateSalesFlowStep(
        logId,
        '8', // Step 8: Sample Submission
        'completed',
        {
          NextStep: '9', // Move to step 9: Get Approval of Sample
          Comments: JSON.stringify([{
            comment: `Sample submitted via ${sampleData.sampleMethod || sampleData.SampleMethod || 'N/A'}`,
            user: sampleData.submittedBy || sampleData.SubmittedBy,
            timestamp: now
          }]),
          Note: 'Sample submitted successfully'
        },
        sampleData.submittedBy || sampleData.SubmittedBy
      );

      return true;
    } catch (error) {
      console.error('Error saving sample submission:', error);
      throw error;
    }
  },

  // Get sample approval details for step 9
  async getSampleApprovalDetails() {
    try {
      const allLeads = await this.getAllLeads();
      const salesFlows = await this.getAllSalesFlows();
      const flowsForStep9 = salesFlows.filter(flow => flow.NextStep == 9);
      const quotationData = await db.getSendQuotationRows();
      const sampleSubmissionData = await db.getTableRows(table(config.sheets.sampleSubmission));
      
      const sampleApprovalWithDetails = flowsForStep9.map(flow => {
        const leadDetails = allLeads.find(lead =>
          lead.LogId === flow.LogId || lead.EnquiryNumber === flow.LogId
        );
        const quotationDoc = quotationData.find(quote => quote.LogId === flow.LogId);
        const sampleSubmission = sampleSubmissionData.find(sample => sample.LogId === flow.LogId);
        
        if (leadDetails) {
          return {
            ...flow,
            EnquiryNumber: leadDetails.EnquiryNumber,
            CustomerName: leadDetails.CustomerName,
            CompanyName: leadDetails.CompanyName,
            MobileNumber: leadDetails.MobileNumber,
            EmailId: leadDetails.EmailId,
            Requirement: leadDetails.Requirement,
            LeadAssignedTo: leadDetails.LeadAssignedTo,
            CustomerLocation: leadDetails.CustomerLocation,
            CustomerType: leadDetails.CustomerType,
            Notes: leadDetails.Notes,
            DateOfEntry: leadDetails.DateOfEntry,
            CreatedBy: leadDetails.CreatedBy,
            CreatedAt: leadDetails.CreatedAt,
            UpdatedAt: leadDetails.UpdatedAt,
            LeadStatus: leadDetails.Status,
            FullName: leadDetails.CustomerName,
            Email: leadDetails.EmailId,
            PhoneNumber: leadDetails.MobileNumber,
            ProductsInterested: leadDetails.ProductsInterested,
            LeadSource: leadDetails.LeadSource,
            Priority: leadDetails.Priority,
            QualificationStatus: leadDetails.QualificationStatus,
            QuotationDocumentId: quotationDoc ? quotationDoc.QuotationDocumentId : '',
            QuotationItems: quotationDoc ? quotationDoc.QuotationItems : '[]',
            TotalAmount: quotationDoc ? quotationDoc.TotalAmount : 0,
            QuotationCreatedAt: quotationDoc ? quotationDoc.CreatedAt : '',
            QuotationStatus: quotationDoc ? quotationDoc.Status : '',
            SampleType: sampleSubmission ? sampleSubmission.SampleType : '',
            SampleMethod: sampleSubmission ? sampleSubmission.SampleMethod : '',
            SampleSubmittedAt: sampleSubmission ? sampleSubmission.SubmittedAt : '',
            SampleNotes: sampleSubmission ? sampleSubmission.SampleNotes : ''
          };
        }
        return flow;
      });
      return sampleApprovalWithDetails;
    } catch (error) {
      console.error('Error getting sample approval details:', error);
      throw error;
    }
  },

  // Save sample approval
    async saveSampleApproval(approvalData) {
    try {
      const now = new Date().toISOString();
      const logId = approvalData.LogId || approvalData.logId;

      if (!logId) {
        throw new Error('LogId is required for sample approval');
      }

      // 1. Save sample approval data to GetApprovalForSample sheet
      const approvalHeaders = [
        'LogId', 'CustomerName', 'CompanyName', 'Email', 'PhoneNumber', 'ProductsInterested',
        'Requirement', 'QuotationDocumentId', 'TotalAmount', 'SampleType', 'SampleMethod',
        'SampleSubmittedAt', 'SampleApprovalStatus', 'ApprovalNotes', 'ApprovedBy', 'ApprovedAt', 'Status'
      ];

      // Build the row as an object with keys matching the headers
      const approvalRecord = {};
      approvalHeaders.forEach(header => {
        let value = approvalData[header]; // Try exact match first
        if (value === undefined) {
          // Try camelCase variations
          const camelCase = header.charAt(0).toUpperCase() + header.slice(1);
          value = approvalData[camelCase];
        }
        if (value === undefined) {
          // Try other variations
          value = approvalData[header.toLowerCase()];
        }

        // Special handling for specific fields
        if (header === 'SampleApprovalStatus' && value === undefined) {
          value = approvalData.sampleApprovalStatus || approvalData.SampleApprovalStatus || '';
        }

        if (header === 'ApprovalNotes' && value === undefined) {
          value = approvalData.approvalNotes || approvalData.ApprovalNotes || '';
        }

        if (header === 'ApprovedBy' && value === undefined) {
          value = approvalData.approvedBy || approvalData.ApprovedBy || '';
        }

        if (header === 'ApprovedAt' && value === undefined) {
          value = approvalData.approvedAt || approvalData.ApprovedAt || now;
        }

        approvalRecord[header] = value !== undefined ? value : '';
      });
      await db.insertTableRow(table(config.sheets.getApprovalForSample), approvalRecord);

      // 2. Update step 9 (Get Approval of Sample) to completed and move to next step using updateSalesFlowStep
      await this.updateSalesFlowStep(
        logId,
        '9', // Step 9: Get Approval of Sample
        'completed',
        {
          NextStep: '10', // Move to step 10: Approve Strategic Deals
          ApprovalStatus: approvalData.sampleApprovalStatus === 'Approved' ? 'Approved' : 'Rejected',
          RejectionReason: approvalData.sampleApprovalStatus === 'Rejected' ? (approvalData.approvalNotes || approvalData.ApprovalNotes || 'Sample rejected') : '',
          Comments: JSON.stringify([{
            comment: `Sample ${approvalData.sampleApprovalStatus || approvalData.SampleApprovalStatus || 'N/A'} - ${approvalData.approvalNotes || approvalData.ApprovalNotes || 'No notes'}`,
            user: approvalData.approvedBy || approvalData.ApprovedBy,
            timestamp: now
          }]),
          Note: `Sample ${approvalData.sampleApprovalStatus || approvalData.SampleApprovalStatus || 'N/A'} successfully`
        },
        approvalData.approvedBy || approvalData.ApprovedBy
      );

      return true;
    } catch (error) {
      console.error('Error saving sample approval:', error);
      throw error;
    }
  },

  async getStrategicDealApprovalDetails() {
    try {
      const allLeads = await this.getAllLeads();
      const salesFlows = await this.getAllSalesFlows();
      const flowsForStep10 = salesFlows.filter(flow => flow.NextStep == 10);
      const quotationData = await db.getSendQuotationRows();
      const sampleApprovalData = await db.getTableRows(table(config.sheets.getApprovalForSample));

      const strategicDealWithDetails = flowsForStep10.map(flow => {
        const leadDetails = allLeads.find(lead =>
          lead.LogId === flow.LogId || lead.EnquiryNumber === flow.LogId
        );
        const quotationDoc = quotationData.find(quote => quote.LogId === flow.LogId);
        const sampleApproval = sampleApprovalData.find(sample => sample.LogId === flow.LogId);

        if (leadDetails) {
          return {
            ...flow,
            EnquiryNumber: leadDetails.EnquiryNumber,
            CustomerName: leadDetails.CustomerName,
            CompanyName: leadDetails.CompanyName,
            MobileNumber: leadDetails.MobileNumber,
            EmailId: leadDetails.EmailId,
            Requirement: leadDetails.Requirement,
            LeadAssignedTo: leadDetails.LeadAssignedTo,
            CustomerLocation: leadDetails.CustomerLocation,
            CustomerType: leadDetails.CustomerType,
            Notes: leadDetails.Notes,
            DateOfEntry: leadDetails.DateOfEntry,
            CreatedBy: leadDetails.CreatedBy,
            CreatedAt: leadDetails.CreatedAt,
            UpdatedAt: leadDetails.UpdatedAt,
            LeadStatus: leadDetails.Status,
            FullName: leadDetails.CustomerName,
            Email: leadDetails.EmailId,
            PhoneNumber: leadDetails.MobileNumber,
            ProductsInterested: leadDetails.ProductsInterested,
            LeadSource: leadDetails.LeadSource,
            Priority: leadDetails.Priority,
            QualificationStatus: leadDetails.QualificationStatus,
            QuotationDocumentId: quotationDoc ? quotationDoc.QuotationDocumentId : '',
            QuotationItems: quotationDoc ? quotationDoc.QuotationItems : '[]',
            TotalAmount: quotationDoc ? quotationDoc.TotalAmount : 0,
            QuotationCreatedAt: quotationDoc ? quotationDoc.CreatedAt : '',
            QuotationStatus: quotationDoc ? quotationDoc.Status : '',
            SampleType: sampleApproval ? sampleApproval.SampleType : '',
            SampleMethod: sampleApproval ? sampleApproval.SampleMethod : '',
            SampleSubmittedAt: sampleApproval ? sampleApproval.SampleSubmittedAt : '',
            SampleApprovalStatus: sampleApproval ? sampleApproval.SampleApprovalStatus : '',
            SampleApprovalNotes: sampleApproval ? sampleApproval.ApprovalNotes : '',
            SampleApprovedBy: sampleApproval ? sampleApproval.ApprovedBy : '',
            SampleApprovedAt: sampleApproval ? sampleApproval.ApprovedAt : ''
          };
        }
        return flow;
      });
      return strategicDealWithDetails;
    } catch (error) {
      console.error('Error getting strategic deal approval details:', error);
      throw error;
    }
  },

  async saveStrategicDealApproval(approvalData) {
    try {
      const now = new Date().toISOString();
      const logId = approvalData.LogId || approvalData.logId;

      if (!logId) {
        throw new Error('LogId is required for strategic deal approval');
      }

      // 1. Save strategic deal approval data to ApproveStrategicDeals sheet
      const approvalHeaders = [
        'LogId', 'CustomerName', 'CompanyName', 'Email', 'PhoneNumber', 'ProductsInterested',
        'Requirement', 'QuotationDocumentId', 'TotalAmount', 'SampleType', 'SampleMethod',
        'SampleSubmittedAt', 'SampleApprovalStatus', 'SampleApprovalNotes', 'StrategicDealApprovalStatus',
        'StrategicDealNotes', 'ApprovedBy', 'ApprovedAt', 'Status'
      ];

      // Build the row as an object with keys matching the headers
      const approvalRecord = {};
      approvalHeaders.forEach(header => {
        let value = approvalData[header]; // Try exact match first
        if (value === undefined) {
          // Try camelCase variations
          const camelCase = header.charAt(0).toUpperCase() + header.slice(1);
          value = approvalData[camelCase];
        }
        if (value === undefined) {
          // Try other variations
          value = approvalData[header.toLowerCase()];
        }

        // Special handling for specific fields
        if (header === 'StrategicDealApprovalStatus' && value === undefined) {
          value = approvalData.strategicDealApprovalStatus || approvalData.StrategicDealApprovalStatus || '';
        }

        if (header === 'StrategicDealNotes' && value === undefined) {
          value = approvalData.strategicDealNotes || approvalData.StrategicDealNotes || '';
        }

        if (header === 'ApprovedBy' && value === undefined) {
          value = approvalData.approvedBy || approvalData.ApprovedBy || '';
        }

        if (header === 'ApprovedAt' && value === undefined) {
          value = approvalData.approvedAt || approvalData.ApprovedAt || now;
        }

        approvalRecord[header] = value !== undefined ? value : '';
      });
      await db.insertTableRow(table(config.sheets.approveStrategicDeals), approvalRecord);

      // 2. Update step 10 (Approve Strategic Deals) to completed and move to next step using updateSalesFlowStep
      await this.updateSalesFlowStep(
        logId,
        '10', // Step 10: Approve Strategic Deals
        'completed',
        {
          NextStep: '11', // Move to step 11: Order Booking
          ApprovalStatus: approvalData.strategicDealApprovalStatus === 'Approved' ? 'Approved' : 'Rejected',
          RejectionReason: approvalData.strategicDealApprovalStatus === 'Rejected' ? (approvalData.strategicDealNotes || approvalData.StrategicDealNotes || 'Strategic deal rejected') : '',
          Comments: JSON.stringify([{
            comment: `Strategic Deal ${approvalData.strategicDealApprovalStatus || approvalData.StrategicDealApprovalStatus || 'N/A'} - ${approvalData.strategicDealNotes || approvalData.StrategicDealNotes || 'No notes'}`,
            user: approvalData.approvedBy || approvalData.ApprovedBy,
            timestamp: now
          }]),
          Note: `Strategic Deal ${approvalData.strategicDealApprovalStatus || approvalData.StrategicDealApprovalStatus || 'N/A'} successfully`
        },
        approvalData.approvedBy || approvalData.ApprovedBy
      );

      return true;
    } catch (error) {
      console.error('Error saving strategic deal approval:', error);
      throw error;
    }
  },

  // Get tasks assigned to a specific user
  async getUserTasks(userEmail, userRole) {
    try {
      const steps = await db.getTableRows(table(STEPS_SHEET));
      const flowData = await db.getTableRows(table(SHEET_NAME));
      // Debug: Show the structure of the first few steps
      if (steps.length > 1) {
        
      }
      
      // Get all steps assigned to the user that are not completed
      // Check both email and role-based assignment
      // Tasks should show up until NextStep is -1 or empty
      const userSteps = steps.filter(step => {
        const isAssigned = step.AssignedTo === userEmail || 
                          step.AssignedTo === userRole ||
                          step.AssignedTo === 'Sales Executive'; // Temporary fix for role-based assignment
        
        // Task is not completed if NextStep is not -1 and not empty
        const isNotCompleted = step.NextStep !== '-1' && step.NextStep !== '' && step.NextStep !== undefined;

        return isAssigned && isNotCompleted;
      });
      // Enhance with flow data
      const enhancedTasks = userSteps.map(step => {
        const flowRecord = flowData.find(flow => flow.LogId === step.LogId);
        return {
          ...step,
          FullName: flowRecord?.FullName || '',
          CompanyName: flowRecord?.CompanyName || '',
          ProductsInterested: flowRecord?.ProductsInterested || '[]',
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

  // Generic helper to complete a step using routing system
  async completeStepWithRouting({ logId, currentStep, context = {}, stepData = {}, userEmail }) {
    try {
      const routingResult = getNextStep(currentStep, context);
      const nextStep = routingResult.nextStep;
      const skippedSteps = routingResult.skippedSteps;
      const timestamp = new Date().toISOString();

      // Get current step data
      const steps = await db.getTableRows(table(STEPS_SHEET));
      const stepIdx = steps.findIndex(s => s.LogId === logId && String(s.StepId) === String(currentStep));
      
      if (stepIdx === -1) {
        throw new Error(`Step not found for LogId: ${logId}, StepId: ${currentStep}`);
      }

      const rowIndex = stepIdx + 2;
      const step = steps[stepIdx];
      
      // Get previous step's end time for start time
      const previousSteps = steps.filter(s => s.LogId === logId && parseInt(s.StepId) < currentStep);
      const lastPreviousStep = previousSteps.length > 0 
        ? previousSteps.sort((a, b) => parseInt(b.StepId) - parseInt(a.StepId))[0]
        : null;
      const startTime =
        nullIfBlankTimestamp(lastPreviousStep?.EndTime) ??
        nullIfBlankTimestamp(step.StartTime) ??
        timestamp;

      const stepObj = {
        StepId: String(currentStep),
        StepNumber: String(currentStep),
        ...stepData,
        Status: 'completed',
        NextStep: String(nextStep),
        SkippedSteps: skippedSteps.length > 0 ? JSON.stringify(skippedSteps) : '',
        RoutingReason: routingResult.reason,
        StartTime: startTime,
        EndTime: timestamp,
        LastModifiedBy: userEmail,
        LastModifiedAt: timestamp,
      };

      await updateRowByIndex(
        STEPS_SHEET,
        rowIndex,
        sanitizeSalesFlowStepTimestampsForDb({
          ...step,
          ...stepObj,
        })
      );

      // Update main flow
      const flows = await db.getTableRows(table(SHEET_NAME));
      const flowIdx = flows.findIndex(f => f.LogId === logId);
      if (flowIdx !== -1) {
        const flowRowIndex = flowIdx + 2;
        await updateRowByIndex(SHEET_NAME, flowRowIndex, {
          ...flows[flowIdx],
          CurrentStep: currentStep,
          NextStep: String(nextStep),
          UpdatedAt: timestamp,
          LastModifiedBy: userEmail,
        });
      }

      return {
        success: true,
        nextStep,
        skippedSteps,
        reason: routingResult.reason
      };
    } catch (error) {
      console.error(`Error completing step ${currentStep} with routing:`, error);
      throw error;
    }
  },

  // Expose routing helper functions
  getNextStep,
  shouldSkipStep,
};

export default salesFlowService; 