# Dispatch Tab Display Logic - All Stages Show All Dispatches

## Overview
Each production stage tab (Store 1, Cable Prod, Store 2, Moulding, FG Section, Dispatch) displays **ALL dispatches** from the Dispatches sheet. The **same dispatches appear in all tabs**, but each tab shows the **stage-specific calculated due date**.

## How It Works

### Display Rule
**Every DispatchUniqueId appears in ALL stage tabs**

The only requirement: Dispatch record must have a `DispatchDate`

### Due Date Calculation
Each tab calculates the due date from the DispatchDate:

| Tab | Due Date Formula | Example (if DispatchDate = 06/10/2025) |
|-----|------------------|----------------------------------------|
| **Store 1** | DispatchDate - 5 days | 01/10/2025 (D-5) |
| **Cable Prod** | DispatchDate - 4 days | 02/10/2025 (D-4) |
| **Store 2** | DispatchDate - 3 days | 03/10/2025 (D-3) |
| **Moulding** | DispatchDate - 2 days | 04/10/2025 (D-2) |
| **FG Section** | DispatchDate - 1 day | 05/10/2025 (D-1) |
| **Dispatch** | DispatchDate - 0 days | 06/10/2025 (D) |

## Example Scenario

### Dispatches Sheet Data:
```
DispatchUniqueId    | UniqueId      | ClientCode | ProductCode    | BatchSize | DispatchDate | Dispatched
DISP-12345678-042   | SO-624438-095 | C10044     | INDUCTION 3 C  | 2000      | 06/10/2025   | Yes
DISP-87654321-157   | SO-624438-095 | C10044     | INDUCTION 3 C  | 2000      | 07/10/2025   | Yes
```

### What Shows in Each Tab:

#### **Store 1 Tab** - Shows BOTH Dispatches
```
Unique ID         | Client | Product        | Batch Size | Due Date   | Dispatch Date
SO-624438-095 #1  | C10044 | INDUCTION 3 C  | 2000       | 01/10/2025 | 06/10/2025
SO-624438-095 #2  | C10044 | INDUCTION 3 C  | 2000       | 02/10/2025 | 07/10/2025
```

#### **Cable Prod Tab** - Shows BOTH Dispatches
```
Unique ID         | Client | Product        | Batch Size | Due Date   | Dispatch Date
SO-624438-095 #1  | C10044 | INDUCTION 3 C  | 2000       | 02/10/2025 | 06/10/2025
SO-624438-095 #2  | C10044 | INDUCTION 3 C  | 2000       | 03/10/2025 | 07/10/2025
```

#### **Store 2 Tab** - Shows BOTH Dispatches
```
Unique ID         | Client | Product        | Batch Size | Due Date   | Dispatch Date
SO-624438-095 #1  | C10044 | INDUCTION 3 C  | 2000       | 03/10/2025 | 06/10/2025
SO-624438-095 #2  | C10044 | INDUCTION 3 C  | 2000       | 04/10/2025 | 07/10/2025
```

#### **Moulding Tab** - Shows BOTH Dispatches
```
Unique ID         | Client | Product        | Batch Size | Due Date   | Dispatch Date
SO-624438-095 #1  | C10044 | INDUCTION 3 C  | 2000       | 04/10/2025 | 06/10/2025
SO-624438-095 #2  | C10044 | INDUCTION 3 C  | 2000       | 05/10/2025 | 07/10/2025
```

#### **FG Section Tab** - Shows BOTH Dispatches
```
Unique ID         | Client | Product        | Batch Size | Due Date   | Dispatch Date
SO-624438-095 #1  | C10044 | INDUCTION 3 C  | 2000       | 05/10/2025 | 06/10/2025
SO-624438-095 #2  | C10044 | INDUCTION 3 C  | 2000       | 06/10/2025 | 07/10/2025
```

#### **Dispatch Tab** - Shows BOTH Dispatches
```
Unique ID         | Client | Product        | Batch Size | Due Date   | Dispatch Date
SO-624438-095 #1  | C10044 | INDUCTION 3 C  | 2000       | 06/10/2025 | 06/10/2025
SO-624438-095 #2  | C10044 | INDUCTION 3 C  | 2000       | 07/10/2025 | 07/10/2025
```

## Key Points

### ✅ **Same Data, Different Due Dates**
- ALL tabs show ALL dispatches
- Each tab calculates due date based on that stage's timeline
- DispatchDate is always visible for reference

### ✅ **No Filtering by Status**
- Doesn't matter if `Dispatched` is "Yes" or "No"
- Shows all planned dispatches
- Each department sees what's coming

### ✅ **Complete Visibility**
- Store 1 Manager sees all upcoming work with D-5 dates
- Cable Prod sees same work with D-4 dates
- Moulding sees same work with D-2 dates
- Everyone sees the full picture with their relevant deadline

## Technical Implementation

```javascript
// For Store 1 Tab
const store1Dispatches = getDispatchDataForStage(STORE1, 5); // D-5 days

// For Cable Prod Tab  
const cableDispatches = getDispatchDataForStage(CABLE_PRODUCTION, 4); // D-4 days

// For each dispatch:
stageDueDate = DispatchDate - daysBeforeDispatch
```

## Benefits

### 1. **Everyone Sees Everything**
- No hidden dispatches
- Complete transparency
- All departments can plan

### 2. **Stage-Specific Deadlines**
- Each department knows their deadline
- Store 1 focuses on D-5 dates
- Moulding focuses on D-2 dates

### 3. **Forward Planning**
- See all upcoming work
- Plan resources accordingly
- Manage capacity proactively

## Example Workflow

### Day 1: Schedule Dispatches
- Create 3 dispatches for different dates
- System generates:
  - DISP-12345678-042 (DispatchDate: 06/10/2025)
  - DISP-12345679-157 (DispatchDate: 07/10/2025)
  - DISP-12345680-893 (DispatchDate: 10/10/2025)

### Day 2: Check Store 1 Tab
**Shows all 3 dispatches:**
- Dispatch 1: Due Date = 01/10/2025 (D-5)
- Dispatch 2: Due Date = 02/10/2025 (D-5)
- Dispatch 3: Due Date = 05/10/2025 (D-5)

### Day 3: Check Moulding Tab
**Shows all 3 dispatches:**
- Dispatch 1: Due Date = 04/10/2025 (D-2)
- Dispatch 2: Due Date = 05/10/2025 (D-2)
- Dispatch 3: Due Date = 08/10/2025 (D-2)

## Current Implementation Status

✅ **Implemented**: All dispatches show in all tabs
✅ **Implemented**: Due dates calculated from DispatchDate
✅ **Implemented**: DispatchUniqueId generated and displayed
✅ **Implemented**: Works with existing Dispatches sheet structure

---

**Summary**: Every DispatchUniqueId appears in every stage tab, with the due date automatically calculated based on that stage's timeline (D-5, D-4, D-3, D-2, D-1, or D).
