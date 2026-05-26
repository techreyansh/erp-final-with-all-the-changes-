# Testing Dispatch Integration - Quick Guide

## Prerequisites
Make sure you have:
1. Created at least one Sales Order (SO)
2. The SO is in NEW status
3. Access to Flow Management page

## Step-by-Step Test

### Step 1: Create a Sales Order (if you haven't)
1. Go to Sales Order creation page
2. Fill in:
   - SO Number: SO-TEST-001
   - Client Code: (select any client)
   - Add at least one item
3. Click "Create Sales Order"
4. Verify it appears in "New SOs" tab in Flow Management

### Step 2: Schedule Dispatch
1. Go to Flow Management
2. Click on "New SOs" tab
3. You should see your SO with Status = NEW
4. Click "Advance Task" on the SO
5. **Dispatch Date Dialog should appear**
6. Select a dispatch date (e.g., 7 days from today)
7. Verify the timeline shows:
   - Store 1: D-5 (2 days from today)
   - Cable Prod: D-4 (3 days from today)
   - Store 2: D-3 (4 days from today)
   - Moulding: D-2 (5 days from today)
   - FG Section: D-1 (6 days from today)
   - Dispatch: D (7 days from today)
8. Click "Confirm & Start Production"

### Step 3: Verify Data in Store 1 Tab
1. Order should now show in **Store 1** tab
2. You should see:
   - The SO you just created
   - Status: STORE1
   - Due Date: D-5 date
   - Dispatch Date: D date

### Step 4: Check Dispatches Sheet
Open your Google Sheet and check the **Dispatches** sheet:

Expected data:
```
POId | SOId | UniqueId | ClientCode | ProductCode | Quantity | DispatchDate | Store1DueDate | CableProductionDueDate | Store2DueDate | MouldingDueDate | FGSectionDueDate | Status | Dispatched
-----|------|----------|------------|-------------|----------|--------------|---------------|------------------------|---------------|-----------------|------------------|--------|------------
PO-X | SO-Y | SO-Y-Z   | CLIENT-A   | PROD-1      | 5000     | 05/10/2025   | 30/09/2025    | 01/10/2025             | 02/10/2025    | 03/10/2025      | 04/10/2025       | In Production | No
```

### Step 5: Check Browser Console
Press F12 and look at Console tab for logs:

**Expected Logs:**
```
=== FLOW MANAGEMENT DEBUG ===
Total tasks fetched: 1
Total dispatches fetched: 1

=== STORE 1 TAB FILTER ===
Store 1 tasks from PO_Master: 1
Store 1 dispatch items: 1
Store 1 combined total: 1

=== GET DISPATCH DATA FOR STAGE ===
Status: STORE1
Due Date Field: Store1DueDate
Dispatches length: 1
Dispatch item: {
  UniqueId: "SO-Y-Z",
  Store1DueDate: "30/09/2025",
  Dispatched: "No",
  hasDueDate: true,
  notDispatched: true,
  willInclude: true
}
Filtered dispatches count: 1
```

## Common Issues & Solutions

### Issue: "0 tasks found" in Store 1
**Diagnosis:**
- Console shows: `Dispatches length: 0`
- **Cause**: No dispatch record in Dispatches sheet
- **Solution**: Go back to Step 2 and schedule a dispatch

### Issue: Dispatch data exists but not showing
**Diagnosis:**
- Console shows: `Dispatches length: 1` but `Filtered dispatches count: 0`
- **Cause**: 
  - `Store1DueDate` is empty or undefined
  - `Dispatched` field is "Yes" (already dispatched)
- **Solution**: 
  - Check Dispatches sheet - ensure Store1DueDate column has value
  - Check Dispatched column is "No", not "Yes"

### Issue: Column name mismatch
**Diagnosis:**
- Console shows dispatch data but field is undefined
- **Cause**: Column name in Dispatches sheet doesn't match
- **Solution**: 
  - Check exact column names in Dispatches sheet
  - Should be: `Store1DueDate`, `CableProductionDueDate`, etc.
  - Case-sensitive!

### Issue: Status mismatch
**Diagnosis:**
- Console shows: `Store 1 tasks from PO_Master: 0`
- **Cause**: Status in PO_Master is not exactly "STORE1"
- **Solution**: 
  - Check PO_Master sheet Status column
  - Should be exactly: `STORE1` (all caps, no spaces)

## Verification Checklist

After scheduling a dispatch, verify:

- [ ] Dispatches sheet has a new row
- [ ] Row has all due dates populated (Store1DueDate through FGSectionDueDate)
- [ ] DispatchDate is set
- [ ] Dispatched column is "No"
- [ ] Status is "In Production"
- [ ] PO_Master shows order with Status = STORE1
- [ ] Store 1 tab in Flow Management shows the order
- [ ] Due Date in Store 1 tab shows D-5 date
- [ ] DispatchDate is visible in task details

## Expected Data Flow

```
1. NEW Order Created
   └─ PO_Master: Status = NEW

2. Click "Advance Task" → Schedule Dispatch
   ├─ Dispatch Date Dialog opens
   ├─ Select Oct 5, 2025
   └─ Click Confirm

3. System Actions
   ├─ Creates record in Dispatches sheet with all due dates
   ├─ Updates PO_Master: Status = STORE1, DueDate = Sep 30
   └─ Stores all stage due dates in PO_Master

4. Store 1 Tab Display
   ├─ Fetches PO_Master tasks (Status = STORE1)
   ├─ Fetches Dispatches sheet data
   ├─ Merges both sources
   └─ Shows with Due Date = Sep 30 (Store1DueDate)

5. Other Tabs
   ├─ Cable Prod: Shows Due Date = Oct 1 (CableProductionDueDate)
   ├─ Store 2: Shows Due Date = Oct 2 (Store2DueDate)
   ├─ Moulding: Shows Due Date = Oct 3 (MouldingDueDate)
   ├─ FG Section: Shows Due Date = Oct 4 (FGSectionDueDate)
   └─ Dispatch: Shows Due Date = Oct 5 (DispatchDate)
```

## Still Having Issues?

Check console logs and share:
1. Full console output (copy/paste)
2. Screenshot of Dispatches sheet
3. Screenshot of PO_Master Status column
4. Which tab you're looking at

This will help diagnose the exact issue!
