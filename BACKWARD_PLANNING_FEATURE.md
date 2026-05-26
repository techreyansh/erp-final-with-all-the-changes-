# Backward Planning Feature - Dispatch Date Management

## Overview
This feature implements an automatic backward planning system that calculates production timeline due dates based on the target dispatch date. When a NEW Sales Order is ready to start production, instead of directly moving to Store 1, the system asks for the dispatch date first. It then calculates when each production stage needs to be completed (working backwards from the dispatch date) and moves the order to Store 1 with the complete production timeline already planned.

## How It Works

### Dispatch Date Selection
When a NEW Sales Order is ready to start production:
1. Click "Advance Task" on the NEW order
2. A dispatch date selection dialog appears (instead of moving directly to Store 1)
3. User selects the target dispatch date (D)
4. System validates the date (no Sundays or holidays)
5. System automatically calculates all stage due dates working backwards
6. Order moves to **Store 1** with the complete production timeline

### Backward Planning Formula
The system uses the following backward planning schedule:

| Stage | Due Date | Days Before Dispatch |
|-------|----------|---------------------|
| Store 1 | D-5 | 5 days before |
| Cable Production | D-4 | 4 days before |
| Store 2 | D-3 | 3 days before |
| Moulding | D-2 | 2 days before |
| FG Section | D-1 | 1 day before |
| Dispatch | D | Dispatch day |

### Example
If you select **October 5, 2025** as the dispatch date:
- **Store 1**: September 30, 2025 (D-5)
- **Cable Production**: October 1, 2025 (D-4)
- **Store 2**: October 2, 2025 (D-3)
- **Moulding**: October 3, 2025 (D-4)
- **FG Section**: October 4, 2025 (D-1)
- **Dispatch**: October 5, 2025 (D)

## Features

### 1. **Dispatch Date Dialog**
- **Location**: Appears when clicking "Advance Task" on NEW orders
- **Features**:
  - Date picker with validation (no Sundays/holidays)
  - Real-time calculation preview
  - Visual timeline display showing all stages
  - Color-coded stages (Store 1 through Dispatch)
  - Shows D-5, D-4, D-3, D-2, D-1, D labels

### 2. **Production Timeline Display**
- **Location**: Task Detail dialog for tasks with scheduled dispatch dates
- **Shows**:
  - All stage due dates
  - Current stage highlighted
  - Dispatch date prominently displayed
  - Color-coded status indicators

### 3. **Data Storage**
When dispatch is scheduled (NEW → Store 1), the following fields are stored in PO_Master sheet:
- `DispatchDate` - The target dispatch date (D)
- `Store1DueDate` - Due date for Store 1 completion (D-5)
- `CableProductionDueDate` - Due date for Cable Production completion (D-4)
- `Store2DueDate` - Due date for Store 2 completion (D-3)
- `MouldingDueDate` - Due date for Moulding completion (D-2)
- `FGSectionDueDate` - Due date for FG Section completion (D-1)
- `Status` - Updated to STORE1 to start production
- `DueDate` - Set to Store1DueDate (current stage deadline)

### 4. **Dispatch Record**
When a dispatch is scheduled, a record is created in the Dispatches sheet with:
- All PO details (POId, SOId, UniqueId, ClientCode, ProductCode, Quantity)
- Dispatch date (D)
- All stage due dates (Store1DueDate through FGSectionDueDate)
- Status: "In Production" (changes as order progresses)
- Dispatched: "No" (changes to "Yes" when actually dispatched)
- CreatedAt and CreatedBy for audit trail

**This data can be fetched from the Dispatches sheet** to show all scheduled dispatches with their timelines.

## Files Modified

### New Files Created
1. **`src/utils/backwardPlanning.js`**
   - Core backward planning logic
   - Date calculation functions
   - Display formatting utilities

2. **`src/components/flowManagement/DispatchDateDialog.js`**
   - Dispatch date selection dialog
   - Real-time timeline preview
   - Date validation

### Modified Files
3. **`src/components/flowManagement/FlowManagement.js`**
   - Added dispatch date dialog integration
   - Updated task advancement logic
   - Added handlers for dispatch date confirmation

4. **`src/services/flowService.js`**
   - Added `advanceTaskWithDispatchDate()` function
   - Handles dispatch date and due dates storage
   - Creates dispatch record in Dispatches sheet

5. **`src/components/flowManagement/TaskDetail.js`**
   - Added production timeline display
   - Shows stage-specific due dates
   - Highlights current stage

## User Workflow

### Step 1: Create Sales Order
1. Create a new Sales Order as usual
2. Order is in NEW status
3. Ready to schedule dispatch and start production

### Step 2: Schedule Dispatch
When ready to start production:
1. Click "Advance Task" button on NEW order
2. **Dispatch Date Dialog appears** (instead of moving to Store 1)

### Step 3: Select Dispatch Date
1. Select target dispatch date from calendar (e.g., October 5, 2025)
2. View auto-calculated production timeline:
   - Store 1: September 30 (D-5)
   - Cable Prod: October 1 (D-4)
   - Store 2: October 2 (D-3)
   - Moulding: October 3 (D-2)
   - FG Section: October 4 (D-1)
   - Dispatch: October 5 (D)
3. Verify all stage due dates
4. Click "Confirm & Start Production"

### Step 4: Production Starts
1. Order moves to **Store 1** status
2. All stage due dates are saved
3. Dispatch record created in Dispatches sheet
4. Store Manager can see the order with due date

### Step 5: Progress Through Stages
1. As order advances through each stage, the system shows the due date for that stage
2. Open task details to view complete production timeline
3. Current stage is highlighted
4. All due dates are visible to all stakeholders

### Step 6: Flow Management
1. Each stage has a specific due date (from backward planning)
2. Managers track progress against pre-planned timeline
3. System shows dispatch date on Dispatches tab
4. Production is aligned with dispatch commitment

## Benefits

### 1. **Automatic Planning**
- No manual calculation of stage due dates
- Eliminates planning errors
- Ensures consistent lead times

### 2. **Clear Visibility**
- All stakeholders see the same timeline
- Production stages have clear deadlines
- Dispatch commitments are tracked

### 3. **Better Coordination**
- Each department knows their deadline
- Backward planning from dispatch date
- Realistic production scheduling

### 4. **Dispatch Tracking**
- All dispatch dates recorded in Dispatches sheet
- Easy to view upcoming dispatches
- Track on-time performance

## Technical Details

### Validation Rules
- Dispatch date cannot be in the past
- Dispatch date cannot be on Sunday
- Dispatch date cannot be on a gazetted holiday
- Uses existing `validateDispatchDate()` function

### Date Formatting
- Stored in ISO format in PO_Master sheet
- Displayed in DD/MM/YYYY format in Dispatches sheet and UI
- All times set to end of day (23:59:59)

### Order Type Handling
- Works with both CABLE_ONLY and POWER_CORD orders
- Different stages may be skipped based on order type
- Timeline adjusts accordingly

### Due Date Usage
When advancing through stages:
1. **Store 1**: Uses `Store1DueDate` (D-5)
2. **Cable Production**: Uses `CableProductionDueDate` (D-4)
3. **Store 2**: Uses `Store2DueDate` (D-3)
4. **Moulding**: Uses `MouldingDueDate` (D-2)
5. **FG Section**: Uses `FGSectionDueDate` (D-1)
6. **Dispatch**: Uses `DispatchDate` (D)

The system automatically sets the `DueDate` field to the appropriate stage-specific due date when advancing.

## Future Enhancements

Potential future improvements:
1. **Customizable Lead Times**: Allow configuration of days for each stage
2. **Working Days Calculation**: Skip weekends and holidays in calculations
3. **Stage Duration Tracking**: Monitor actual vs. planned duration
4. **Alerts**: Notify if a stage is at risk of missing its due date
5. **Bulk Dispatch Scheduling**: Schedule multiple orders at once
6. **Capacity Planning**: Check production capacity before confirming dates

## Support

For questions or issues with the backward planning feature:
1. Check the production timeline in Task Detail dialog
2. Verify dispatch date in Dispatches sheet
3. Review stage due dates in PO_Master sheet
4. Contact system administrator if dates need adjustment

---

**Last Updated**: September 30, 2025
**Version**: 1.0
**Status**: Active
