# Purchase Flow - Complete Working Guide

## Overview
The Purchase Flow is a 21-step workflow system that manages the entire procurement process from raising a purchase request (indent) to final payment. Each step is assigned to specific roles and tracks progress through Google Sheets.

## How It Works

### 1. **Data Storage**
The system uses **two Google Sheets**:
- **`PurchaseFlow`** - Main indent/item data
- **`PurchaseFlowSteps`** - Step-by-step progress tracking

### 2. **Starting a Purchase Flow**

#### Step 1: Raise Indent (Store Manager)
- **Who**: Store Manager
- **What**: Creates a purchase request (indent) for materials needed
- **How**:
  1. Go to `/purchase-flow/raise-indent`
  2. Fill in indent details:
     - Indent Number (auto-generated)
     - Items needed (Item Code, Item Name, Quantity, Specifications)
     - Priority/Urgency
  3. Submit → Creates records in both sheets
  4. Status: `Step 1` completed, moves to `Step 2`

**Data Created**:
- Row in `PurchaseFlow` sheet with indent details
- Row in `PurchaseFlowSteps` sheet with:
  - `StepId: 1`
  - `Status: 'completed'`
  - `NextStep: 2`
  - `AssignedTo: 'Process Coordinator'`

### 3. **Step-by-Step Flow**

#### Step 2: Approve Indent (Process Coordinator)
- **Who**: Process Coordinator
- **What**: Reviews and approves/rejects the indent
- **How**:
  1. Go to `/purchase-flow/approve-indent`
  2. See pending indents assigned to them
  3. Review indent details
  4. Approve or Reject
  5. If approved → Updates `StepId: 2` to `completed`, moves to `Step 3`
  6. If rejected → Flow stops, can be restarted after corrections

#### Step 3: Float RFQ (Purchase Executive)
- **Who**: Purchase Executive
- **What**: Sends Request for Quotation (RFQ) to vendors
- **How**:
  1. Go to `/purchase-flow/float-rfq`
  2. Select approved indent
  3. Select vendors to send RFQ
  4. Send RFQ → Creates RFQ records
  5. Updates `StepId: 3` to `completed`, moves to `Step 4`

#### Step 4: Follow-up for Quotations (Purchase Executive)
- **Who**: Purchase Executive
- **What**: Follows up with vendors for quotations
- **How**:
  1. Go to `/purchase-flow/followup-quotations`
  2. See pending RFQs
  3. Track vendor responses
  4. Mark quotations received
  5. Updates `StepId: 4` to `completed`, moves to `Step 5`

#### Step 5: Prepare Comparative Statement (Purchase Executive)
- **Who**: Purchase Executive
- **What**: Compares vendor quotations and prepares analysis
- **How**:
  1. Go to `/purchase-flow/comparative-statement`
  2. View all received quotations
  3. Compare prices, terms, quality
  4. Prepare comparative analysis
  5. Updates `StepId: 5` to `completed`, moves to `Step 6`

#### Step 6: Approve Quotation (Management / HOD)
- **Who**: Management / HOD
- **What**: Approves selected vendor based on comparative statement
- **How**:
  1. Go to `/purchase-flow/approve-quotation`
  2. Review comparative statement
  3. Select and approve vendor
  4. Updates `StepId: 6` to `completed`, moves to `Step 7`

#### Step 7: Request & Follow-up for Sample (Purchase Executive)
- **Who**: Purchase Executive
- **What**: Requests sample from approved vendor
- **How**:
  1. Go to `/purchase-flow/request-sample`
  2. Request sample from approved vendor
  3. Track sample request status
  4. Updates `StepId: 7` to `completed`, moves to `Step 8`

#### Step 8: Inspect Sample (QC Manager)
- **Who**: QC Manager
- **What**: Inspects sample quality
- **How**:
  1. Go to `/purchase-flow/inspect-sample`
  2. Receive sample
  3. Inspect quality, specifications
  4. Approve or Reject sample
  5. Updates `StepId: 8` to `completed`, moves to `Step 9`

#### Step 9: Sort Vendors (Purchase Executive)
- **Who**: Purchase Executive
- **What**: Final vendor selection and ranking
- **How**:
  1. Go to `/purchase-flow/sort-vendors`
  2. Review all vendor data
  3. Finalize vendor selection
  4. Updates `StepId: 9` to `completed`, moves to `Step 10`

#### Step 10: Place PO (Purchase Executive)
- **Who**: Purchase Executive
- **What**: Creates and sends Purchase Order to vendor
- **How**:
  1. Go to `/purchase-flow/place-po`
  2. Create PO with:
     - Vendor details
     - Items, quantities, prices
     - Delivery terms
     - Payment terms
  3. Send PO to vendor
  4. Updates `StepId: 10` to `completed`, moves to `Step 11`

#### Step 11: Follow-up for Delivery (Purchase Executive)
- **Who**: Purchase Executive
- **What**: Tracks material delivery from vendor
- **How**:
  1. Go to `/purchase-flow/followup-delivery`
  2. Track delivery status
  3. Follow up with vendor
  4. Updates `StepId: 11` to `completed`, moves to `Step 12`

#### Step 12: Receive & Inspect Material (Store Manager)
- **Who**: Store Manager
- **What**: Receives material and performs initial inspection
- **How**:
  1. Go to `/purchase-flow/recieve-inspect-material`
  2. Receive material
  3. Inspect quantity, packaging
  4. Updates `StepId: 12` to `completed`, moves to `Step 13`

#### Step 13: Material Approval (QC Manager)
- **Who**: QC Manager
- **What**: Final quality check and approval
- **How**:
  1. Go to `/purchase-flow/material-approval`
  2. Perform quality inspection
  3. Approve or Reject material
  4. If approved → Updates `StepId: 13` to `completed`, moves to `Step 17`
  5. If rejected → Moves to `Step 14` (Decision on Rejection)

#### Step 14: Decision on Rejection (Purchase Executive)
- **Who**: Purchase Executive
- **What**: Decides action on rejected material
- **How**:
  1. Go to `/purchase-flow/decision-on-rejection`
  2. Review rejection reason
  3. Decide: Return or Accept with conditions
  4. Updates `StepId: 14` to `completed`, moves to `Step 15` or `Step 17`

#### Step 15: Return Rejected Material (Store Manager)
- **Who**: Store Manager
- **What**: Returns rejected material to vendor
- **How**:
  1. Go to `/purchase-flow/return-rejected-material`
  2. Process return
  3. Updates `StepId: 15` to `completed`, moves to `Step 16`

#### Step 16: Resend Material (Purchase Executive)
- **Who**: Purchase Executive
- **What**: Requests replacement material from vendor
- **How**:
  1. Go to `/purchase-flow/resend-material`
  2. Request replacement
  3. Updates `StepId: 16` to `completed`, moves back to `Step 12`

#### Step 17: Generate GRN (Store Manager)
- **Who**: Store Manager
- **What**: Generates Goods Receipt Note for approved material
- **How**:
  1. Go to `/purchase-flow/generate-grn`
  2. Generate GRN with:
     - Material details
     - Quantity received
     - Quality status
  3. Updates `StepId: 17` to `completed`, moves to `Step 19`

#### Step 18: Generate GRN (Duplicate - can be removed)
- Same as Step 17

#### Step 19: Submit Invoice to Accounts (Purchase Executive)
- **Who**: Purchase Executive
- **What**: Submits vendor invoice to accounts department
- **How**:
  1. Go to `/purchase-flow/submit-invoice`
  2. Attach vendor invoice
  3. Submit to accounts
  4. Updates `StepId: 19` to `completed`, moves to `Step 20`

#### Step 20: Schedule Payment (Accounts Executive)
- **Who**: Accounts Executive
- **What**: Schedules payment based on credit terms
- **How**:
  1. Go to `/purchase-flow/schedule-payment`
  2. Review invoice
  3. Schedule payment date based on credit terms
  4. Updates `StepId: 20` to `completed`, moves to `Step 21`

#### Step 21: Approve & Release Payment (Accounts Executive)
- **Who**: Accounts Executive
- **What**: Final approval and payment release
- **How**:
  1. Go to `/purchase-flow/release-payment`
  2. Review scheduled payment
  3. Approve and release payment
  4. Updates `StepId: 21` to `completed`
  5. **Flow Complete!**

## Key Concepts

### 1. **Step Progression**
- Steps must be completed **in order**
- Each step updates the `PurchaseFlowSteps` sheet
- `NextStep` field indicates which step comes next
- `AssignedTo` field shows who handles the next step

### 2. **Status Tracking**
Each step has a status:
- `pending` - Not started
- `in_progress` - Currently being worked on
- `completed` - Finished successfully
- `rejected` - Rejected/returned

### 3. **Role-Based Access**
- Each step is assigned to specific roles
- Users only see tasks assigned to their role
- Navigation tabs show only relevant steps

### 4. **Data Flow**
```
Raise Indent (Step 1)
    ↓
Approve Indent (Step 2)
    ↓
Float RFQ (Step 3)
    ↓
Follow-up Quotations (Step 4)
    ↓
Comparative Statement (Step 5)
    ↓
Approve Quotation (Step 6)
    ↓
Request Sample (Step 7)
    ↓
Inspect Sample (Step 8)
    ↓
Sort Vendors (Step 9)
    ↓
Place PO (Step 10)
    ↓
Follow-up Delivery (Step 11)
    ↓
Receive Material (Step 12)
    ↓
Material Approval (Step 13)
    ├─→ Approved → Generate GRN (Step 17)
    └─→ Rejected → Decision (Step 14) → Return (Step 15) → Resend (Step 16) → Back to Step 12
    ↓
Submit Invoice (Step 19)
    ↓
Schedule Payment (Step 20)
    ↓
Release Payment (Step 21)
    ↓
COMPLETE
```

### 5. **Google Sheets Structure**

#### PurchaseFlow Sheet
- `IndentNumber` - Unique indent identifier
- `FlowId` - Flow identifier
- `ItemCode`, `ItemName`, `Quantity`, `Specifications`
- `Status` - Overall flow status
- `CreatedBy`, `CreatedAt`

#### PurchaseFlowSteps Sheet
- `FlowId` - Links to PurchaseFlow
- `IndentNumber` - Links to indent
- `StepId` - Current step (1-21)
- `StepNumber` - Step number
- `Status` - Step status
- `Role` - Who should do this step
- `Action` - What action to perform
- `AssignedTo` - Next person assigned
- `NextStep` - Next step number
- `PreviousStep` - Previous step number
- `Steps` - JSON array of all step history
- `TAT` - Turnaround time
- `TATStatus` - On Time / Delayed
- `ApprovalStatus` - Approved / Rejected / Pending

## How to Use

### For Store Manager:
1. **Start a Flow**: Go to "Raise Indent" → Create new indent
2. **Receive Material**: Go to "Receive & Inspect Material" when material arrives
3. **Generate GRN**: Go to "Generate GRN" after material approval

### For Process Coordinator:
1. **Approve Indents**: Go to "Approve Indent" → Review and approve/reject

### For Purchase Executive:
1. **Float RFQ**: Go to "Float RFQ" → Send quotation requests
2. **Follow-up**: Go to "Follow-up for Quotations" → Track responses
3. **Compare**: Go to "Prepare Comparative Statement" → Analyze quotes
4. **Place PO**: Go to "Place PO" → Create purchase order
5. **Track Delivery**: Go to "Follow-up for Delivery" → Monitor delivery

### For QC Manager:
1. **Inspect Sample**: Go to "Inspect Sample" → Check sample quality
2. **Approve Material**: Go to "Material Approval" → Final quality check

### For Management / HOD:
1. **Approve Quotation**: Go to "Approve Quotation" → Select vendor

### For Accounts Executive:
1. **Schedule Payment**: Go to "Schedule Payment" → Set payment date
2. **Release Payment**: Go to "Release Payment" → Process payment

## Important Notes

1. **Sequential Flow**: Steps must be completed in order
2. **Role-Based**: Each user only sees their assigned tasks
3. **Real-Time Updates**: All changes sync to Google Sheets immediately
4. **History Tracking**: All step changes are logged in the `Steps` JSON array
5. **TAT Tracking**: System tracks if steps are completed on time
6. **Rejection Handling**: If material is rejected, flow goes through rejection steps before continuing

## Troubleshooting

**Q: I don't see any tasks assigned to me**
- Check your role matches the step requirements
- Verify previous steps are completed
- Check if there are any active flows

**Q: Step is stuck**
- Verify previous step is marked as `completed`
- Check `NextStep` field in the sheet
- Ensure `AssignedTo` matches your role

**Q: Can't proceed to next step**
- Previous step must be `completed`
- Check for any rejection/rework cycles
- Verify your role has permission for the next step

