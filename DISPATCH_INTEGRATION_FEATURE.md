# Dispatch Sheet Integration - Stage-Specific Due Dates

## Overview
The Flow Management system now integrates with the **Dispatches sheet** to show scheduled dispatch data in each production stage tab. Each tab displays items with their **stage-specific due dates calculated on-the-fly** from the DispatchDate in the Dispatches sheet.

## How It Works

### Data Flow
1. When a dispatch is scheduled (NEW → Store 1), a record is created in the **Dispatches sheet**
2. This record contains:
   - `UniqueId` - Unique order identifier
   - `ClientCode` - Client code
   - `ProductCode` - Product code
   - `ProductName` - Product name
   - `BatchNumber` - Batch number
   - `BatchSize` - Batch size/quantity
   - `DispatchDate` - Target dispatch date in DD/MM/YYYY format (e.g., 06/10/2025)
   - `CreatedAt` - Timestamp when record was created
   - `Dispatched` - "No" (changes to "Yes" when actually dispatched)

3. Each stage tab in Flow Management:
   - Fetches tasks from **PO_Master** (current status)
   - Fetches dispatch data from **Dispatches sheet**
   - **Calculates stage-specific due date** from DispatchDate:
     - Store 1: DispatchDate - 5 days (D-5)
     - Cable Prod: DispatchDate - 4 days (D-4)
     - Store 2: DispatchDate - 3 days (D-3)
     - Moulding: DispatchDate - 2 days (D-2)
     - FG Section: DispatchDate - 1 day (D-1)
     - Dispatch: DispatchDate (D)

### Stage-Specific Display

#### Store 1 Tab
- Shows tasks with `Status = STORE1` from PO_Master
- **PLUS** dispatch records from Dispatches sheet
- **Due Date shown**: `Store1DueDate` (D-5)

#### Cable Prod Tab
- Shows tasks with `Status = CABLE_PRODUCTION` from PO_Master
- **PLUS** dispatch records from Dispatches sheet
- **Due Date shown**: `CableProductionDueDate` (D-4)

#### Store 2 Tab
- Shows tasks with `Status = STORE2` from PO_Master
- **PLUS** dispatch records from Dispatches sheet
- **Due Date shown**: `Store2DueDate` (D-3)

#### Moulding Tab
- Shows tasks with `Status = MOULDING` from PO_Master
- **PLUS** dispatch records from Dispatches sheet
- **Due Date shown**: `MouldingDueDate` (D-2)

#### FG Section Tab
- Shows tasks with `Status = FG_SECTION` from PO_Master
- **PLUS** dispatch records from Dispatches sheet
- **Due Date shown**: `FGSectionDueDate` (D-1)

#### Dispatch Tab
- Shows tasks with `Status = DISPATCH` from PO_Master
- **PLUS** dispatch records from Dispatches sheet
- **Due Date shown**: `DispatchDate` (D)

## Example Scenario

### You schedule a dispatch for October 5, 2025:

**Dispatches Sheet Record:**
```
UniqueId: SO-624438-095
ClientCode: C10044
ProductCode: INDUCTION 3 C
ProductName: INDUCTION 3 C
BatchNumber: 1
BatchSize: 2000
DispatchDate: 06/10/2025
CreatedAt: 2025-09-30T10:15:00Z
Dispatched: No
```

**System Calculates Due Dates On-The-Fly:**
- Store 1 Due Date: 01/10/2025 (DispatchDate - 5 days)
- Cable Prod Due Date: 02/10/2025 (DispatchDate - 4 days)
- Store 2 Due Date: 03/10/2025 (DispatchDate - 3 days)
- Moulding Due Date: 04/10/2025 (DispatchDate - 2 days)
- FG Section Due Date: 05/10/2025 (DispatchDate - 1 day)
- Dispatch Date: 06/10/2025 (DispatchDate)

### What Users See in Each Tab:

**Store 1 Tab:**
- Order shows with **Due Date: 01/10/2025** (D-5)
- DispatchDate also visible: 06/10/2025

**Cable Prod Tab:**
- Order shows with **Due Date: 02/10/2025** (D-4)
- DispatchDate also visible: 06/10/2025

**Store 2 Tab:**
- Order shows with **Due Date: 03/10/2025** (D-3)
- DispatchDate also visible: 06/10/2025

**Moulding Tab:**
- Order shows with **Due Date: 04/10/2025** (D-2)
- DispatchDate also visible: 06/10/2025

**FG Section Tab:**
- Order shows with **Due Date: 05/10/2025** (D-1)
- DispatchDate also visible: 06/10/2025

**Dispatch Tab:**
- Order shows with **Due Date: 06/10/2025** (D - Dispatch Day)
- Ready for actual dispatch

## Key Features

### 1. **Dual Data Source**
Each tab shows:
- Current tasks from PO_Master (real-time status)
- Scheduled dispatches from Dispatches sheet (planned timeline)

### 2. **Stage-Specific Due Dates**
- Each stage displays the **relevant due date** for that stage
- Store 1 sees D-5, Cable Prod sees D-4, etc.
- Everyone knows their specific deadline

### 3. **Automatic Merging**
- System automatically merges data from both sheets
- Deduplicates by UniqueId
- Shows complete picture in each tab

### 4. **Real-Time Updates**
- When order advances, PO_Master updates
- Dispatch record stays in Dispatches sheet
- Both sources contribute to the view

## Benefits

### For Store Manager
- Sees upcoming work in Store 1 tab
- Knows due date is D-5 (e.g., Sep 30)
- Knows final dispatch is D (e.g., Oct 5)
- Can plan accordingly

### For Production Supervisor
- Sees Cable Production work
- Knows due date is D-4 (e.g., Oct 1)
- Knows final dispatch is D (e.g., Oct 5)
- Can prioritize based on dispatch commitment

### For FG Section Manager
- Sees FG work
- Knows due date is D-1 (e.g., Oct 4)
- Knows dispatch is next day D (e.g., Oct 5)
- Can ensure quality and packaging on time

### For Dispatch Manager
- Sees all items ready for dispatch
- Knows dispatch date is D (e.g., Oct 5)
- Can plan loading and delivery
- Can see if previous stages are on track

## Technical Implementation

### Data Structure
Each tab receives merged data:
```javascript
{
  POId: "PO-123",
  SOId: "SO-456",
  UniqueId: "SO-456-789",
  ClientCode: "ABC Corp",
  ProductCode: "PC-001",
  Quantity: 5000,
  Status: "STORE1", // Current status from PO_Master
  DueDate: "30/09/2025", // Stage-specific due date from Dispatches
  DispatchDate: "05/10/2025", // Final dispatch date
  Store1DueDate: "30/09/2025",
  CableProductionDueDate: "01/10/2025",
  Store2DueDate: "02/10/2025",
  MouldingDueDate: "03/10/2025",
  FGSectionDueDate: "04/10/2025",
  _fromDispatches: true // Flag indicating dispatch data is included
}
```

### Filtering Logic
```javascript
// Store 1 Tab Example
const store1Tasks = tasks.filter(task => task.Status === 'STORE1'); // From PO_Master
const store1Dispatches = getDispatchDataForStage('STORE1', 'Store1DueDate'); // From Dispatches
const combined = mergeTasks(store1Tasks, store1Dispatches); // Merge by UniqueId
```

### Deduplication
- System merges by UniqueId
- PO_Master data takes precedence
- Dispatch data fills in missing records
- No duplicates shown

## Date Format
- **Dispatches Sheet**: DD/MM/YYYY (e.g., 05/10/2025)
- **PO_Master Sheet**: ISO format (e.g., 2025-10-05T23:59:59.999Z)
- **Display**: DD/MM/YYYY for users

## Filter Conditions
Dispatch records are included if:
1. Stage-specific due date field exists (not empty)
2. `Dispatched` field is **not** "Yes"
3. Record exists in Dispatches sheet

## Future Enhancements

### Possible Improvements:
1. **Status Sync**: Update Dispatches sheet status as order progresses
2. **Overdue Alerts**: Highlight items past their stage-specific due date
3. **Dispatch Confirmation**: Mark `Dispatched = "Yes"` when actually dispatched
4. **Timeline View**: Visual timeline showing progress vs. plan
5. **Performance Tracking**: Compare actual vs. planned timings

## Troubleshooting

### If data doesn't appear in a tab:
1. Check if dispatch record exists in Dispatches sheet
2. Verify stage-specific due date field is populated
3. Ensure `Dispatched` is not "Yes"
4. Check UniqueId matches between PO_Master and Dispatches

### If due dates are wrong:
1. Verify dispatch date was calculated correctly
2. Check backward planning calculation (D-5, D-4, etc.)
3. Ensure Dispatches sheet has correct date format (DD/MM/YYYY)

---

**Last Updated**: September 30, 2025
**Version**: 1.0
**Status**: Active
