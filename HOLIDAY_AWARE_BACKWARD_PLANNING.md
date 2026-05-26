# Holiday-Aware Backward Planning for Dispatch Scheduling

## Overview

The dispatch planning system now automatically ensures that **Store 1 Cable Production** and **Store 2 Moulding FG Section** due dates never fall on Sundays or gazetted holidays. The system uses working days calculation for backward planning, automatically skipping non-working days.

---

## Key Features

### 1. Automatic Holiday Skip in Date Calculations

When planning dispatch, the system:
- ✅ Validates that the dispatch date is a working day (not Sunday/holiday)
- ✅ Calculates all production stage dates (D-5, D-4, D-3, D-2, D-1) using **working days only**
- ✅ Ensures Store 1 Cable Production and Store 2 Moulding FG Section dates are working days
- ✅ Saves all calculated dates to the PO for tracking

### 2. Special Case Handling

**Important:** If the dispatch date is selected and there are holidays in between, but all required production stages (D-5, D-4, D-3, D-2, D-1) can be performed on working days, the system **allows** the dispatch to proceed.

#### Example Scenario:
```
Selected Dispatch Date: October 10, 2025
Holidays in Timeline:
  - October 2, 2025 (Gandhi Jayanti - Gazetted Holiday)
  - October 5, 2025 (Sunday)

System Calculation (Working Days):
  D   (Dispatch):                October 10, 2025 ✓ (Friday)
  D-1 (FG Section):             October 9, 2025 ✓ (Thursday)
  D-2 (Moulding):               October 8, 2025 ✓ (Wednesday)
  D-3 (Store 2):                October 7, 2025 ✓ (Tuesday)
  D-4 (Cable Production):       October 6, 2025 ✓ (Monday)
  D-5 (Store 1):                October 3, 2025 ✓ (Thursday, skipped Oct 5 Sunday)

Result: ✅ DISPATCH CAN PROCEED
All production stages can be scheduled on working days despite 2 holidays in the timeline.
```

### 3. Validation Rules

The system enforces the following rules:

1. **Dispatch Date Validation:**
   - Cannot be in the past
   - Cannot be a Sunday or gazetted holiday
   - Must allow enough working days for production (minimum D-5 to D-1)

2. **Production Stage Date Validation:**
   - All stage due dates are calculated using working days only
   - Sundays are automatically skipped
   - Gazetted holidays are automatically skipped
   - System warns if any calculated date falls on a restricted day (should never happen)

3. **Timeline Validation:**
   - If today is October 3 and dispatch is October 6, the system checks if there are 5 working days available
   - If not enough working days, dispatch date is rejected with helpful error message

---

## How It Works

### Backward Planning Formula (Working Days)

For **POWER_CORD** orders (full production cycle):
```
Dispatch Date (D):              Selected by user (must be working day)
FG Section (D-1):               1 working day before dispatch
Moulding (D-2):                 2 working days before dispatch
Store 2 (D-3):                  3 working days before dispatch
Cable Production (D-4):         4 working days before dispatch
Store 1 (D-5):                  5 working days before dispatch
```

For **CABLE_ONLY** orders:
```
Dispatch Date (D):              Selected by user (must be working day)
Store 1 (D-5):                  5 working days before dispatch
```

### Holiday Skip Logic

The `subtractWorkingDays` function:
```javascript
// Example: Subtract 3 working days from October 10, 2025
// October 9: Working day (count 1)
// October 8: Working day (count 2)
// October 7: Working day (count 3)
// Result: October 7, 2025

// If October 5 was Sunday in between:
// October 9: Working day (count 1)
// October 8: Working day (count 2)
// October 7: Working day (count 3)
// October 6: Working day (skip Sunday on Oct 5)
// Result: Still October 7, 2025 (because counting backwards)
```

---

## User Experience

### Scenario 1: No Holidays in Timeline

**User Action:** Select October 10 as dispatch date (no holidays between today and Oct 10)

**System Response:**
```
✅ No holidays detected in your timeline.
All production stages can be scheduled.

Timeline:
D-5 (Store 1):              October 3
D-4 (Cable Production):     October 4
D-3 (Store 2):              October 7
D-2 (Moulding):             October 8
D-1 (FG Section):           October 9
D   (Dispatch):             October 10
```

### Scenario 2: Holidays Present, But Dispatch Can Proceed

**User Action:** Select October 10 as dispatch date (Oct 2 holiday, Oct 5 Sunday)

**System Response:**
```
ℹ️ 2 holidays detected (2 Oct 2025 (Gazetted Holiday), 5 Oct 2025 (Sunday)), 
but all required production stages (D-5 to D-1) can be scheduled on working days. 
Dispatch can proceed as planned.

Timeline (Working Days):
D-5 (Store 1):              October 3 ✓
D-4 (Cable Production):     October 6 ✓
D-3 (Store 2):              October 7 ✓
D-2 (Moulding):             October 8 ✓
D-1 (FG Section):           October 9 ✓
D   (Dispatch):             October 10 ✓
```

### Scenario 3: Not Enough Working Days

**User Action:** Select October 5 as dispatch date (only 2 working days available)

**System Response:**
```
❌ Not enough working days for production. 
Need to start 3 day(s) earlier. 
Please select a later dispatch date.

Suggested Date: October 10
```

### Scenario 4: Dispatch Date is Sunday/Holiday

**User Action:** Select October 5 (Sunday) as dispatch date

**System Response:**
```
❌ Dispatch not available on Sunday. Please select a working day.
```

---

## Technical Implementation

### Files Modified

1. **`src/utils/dateRestrictions.js`**
   - Enhanced `validateDispatchDate()` to check for sufficient working days
   - Enhanced `suggestAdjustedDispatchDate()` to handle special case
   - Added `canProceed` flag to indicate if dispatch can proceed despite holidays

2. **`src/services/dispatchService.js`**
   - Updated `createBatchDispatch()` to:
     - Validate all batch dates before processing
     - Calculate backward planning dates for each PO
     - Save all stage due dates (Store1DueDate, CableProductionDueDate, etc.) to PO
     - Warn if any calculated date falls on restricted day

3. **`src/components/dispatch/DispatchForm.js`**
   - Enhanced `handleBatchDateChange()` to:
     - Get order type for proper validation
     - Show informational message (blue) if dispatch can proceed with holidays
     - Show warning message (orange) if date should be changed

### Database Fields

The following fields are saved to each PO:

```javascript
{
  POId: "PO-123",
  UniqueId: "SO-456-789",
  Status: "DISPATCH",
  
  // Backward planning dates (all working days)
  DispatchDate: "2025-10-10T23:59:59.999Z",
  FGSectionDueDate: "2025-10-09T23:59:59.999Z",    // D-1
  MouldingDueDate: "2025-10-08T23:59:59.999Z",     // D-2
  Store2DueDate: "2025-10-07T23:59:59.999Z",       // D-3
  CableProductionDueDate: "2025-10-06T23:59:59.999Z", // D-4
  Store1DueDate: "2025-10-03T23:59:59.999Z"        // D-5 (skipped Oct 5 Sunday)
}
```

---

## Holiday Configuration

### Current Holidays (2024-2025)

Defined in `src/utils/dateRestrictions.js`:

```javascript
const GAZETTED_HOLIDAYS = [
  // 2025
  '2025-01-26', // Republic Day
  '2025-02-27', // Holi
  '2025-03-31', // Eid al-Fitr
  '2025-04-06', // Ram Navami
  '2025-04-14', // Ambedkar Jayanti
  '2025-04-18', // Good Friday
  '2025-05-01', // Labour Day
  '2025-06-07', // Eid al-Adha
  '2025-08-15', // Independence Day
  '2025-10-02', // Gandhi Jayanti
  '2025-10-21', // Diwali
  '2025-11-05', // Guru Nanak Jayanti
  '2025-12-25', // Christmas Day
];
```

### Updating Holidays

To add new holidays:

1. Open `src/utils/dateRestrictions.js`
2. Add the holiday to the `GAZETTED_HOLIDAYS` array in YYYY-MM-DD format
3. Restart the application

**Recommendation:** Update holidays annually at the start of each year.

---

## Testing Scenarios

### Test Case 1: Normal Working Days
```
Input:
  Today: October 1, 2025
  Dispatch: October 8, 2025
  No holidays in between

Expected:
  ✅ Dispatch allowed
  All dates calculated as simple D-1, D-2, etc.
```

### Test Case 2: Weekend in Timeline
```
Input:
  Today: October 1, 2025
  Dispatch: October 10, 2025
  Weekend: October 4-5 (Sat-Sun)

Expected:
  ✅ Dispatch allowed
  D-3 calculated skipping weekend
```

### Test Case 3: Holiday in Timeline
```
Input:
  Today: September 30, 2025
  Dispatch: October 6, 2025
  Holiday: October 2, 2025 (Gandhi Jayanti)

Expected:
  ✅ Dispatch allowed
  D-4 calculated skipping holiday
```

### Test Case 4: Multiple Holidays
```
Input:
  Today: September 30, 2025
  Dispatch: October 10, 2025
  Holidays: October 2 (holiday), October 5 (Sunday)

Expected:
  ✅ Dispatch allowed
  All stages D-5 to D-1 scheduled on working days
  Info message shown about holidays
```

### Test Case 5: Insufficient Working Days
```
Input:
  Today: October 6, 2025
  Dispatch: October 8, 2025
  (Only 2 working days available, need 5)

Expected:
  ❌ Dispatch rejected
  Error message: "Not enough working days for production"
  Suggested date provided
```

### Test Case 6: Dispatch on Holiday
```
Input:
  Dispatch: October 5, 2025 (Sunday)

Expected:
  ❌ Dispatch rejected
  Error message: "Dispatch not available on Sunday"
```

---

## Benefits

### For Production Team
- ✅ **Realistic Schedules:** All production stages scheduled on actual working days
- ✅ **No Weekend Work:** System never schedules work on Sundays
- ✅ **Holiday Awareness:** System respects gazetted holidays automatically
- ✅ **Clear Timelines:** Visual timeline shows all working day dates

### For Management
- ✅ **Accurate Planning:** Dispatch dates account for non-working days
- ✅ **Resource Optimization:** No expectation of work on holidays
- ✅ **Compliance:** Respects statutory holidays
- ✅ **Reduced Delays:** Realistic timelines prevent scheduling conflicts

### For Operations
- ✅ **Automated Calculation:** No manual holiday counting needed
- ✅ **Intelligent Validation:** System prevents impossible schedules
- ✅ **Flexible Handling:** Can proceed if working days available
- ✅ **Clear Feedback:** Helpful messages guide date selection

---

## Maintenance

### Annual Tasks

1. **Update Holiday List** (January each year)
   - Open `src/utils/dateRestrictions.js`
   - Add new year's gazetted holidays
   - Test with sample dates

2. **Verify Working Days Calculation**
   - Test with new year's first week
   - Verify weekends are correctly identified
   - Check edge cases (year boundaries)

### Troubleshooting

**Issue:** Calculated dates falling on holidays
- **Cause:** Holiday list not updated or working days function error
- **Fix:** Update `GAZETTED_HOLIDAYS` array and restart

**Issue:** Dispatch rejected despite enough days
- **Cause:** Validation logic counting calendar days instead of working days
- **Fix:** Verify `useWorkingDays` parameter is `true` in calculations

**Issue:** Wrong dates shown in timeline
- **Cause:** Timezone or date parsing issues
- **Fix:** Check `setHours(0,0,0,0)` calls in date calculations

---

## API Reference

### Key Functions

#### `validateDispatchDate(date, orderType)`
Validates if a dispatch date is valid for scheduling.

**Parameters:**
- `date` (string|Date): The dispatch date to validate
- `orderType` (string, optional): 'CABLE_ONLY' or 'POWER_CORD'

**Returns:**
```javascript
{
  isValid: boolean,
  message: string
}
```

**Example:**
```javascript
const validation = validateDispatchDate('2025-10-10', 'POWER_CORD');
if (validation.isValid) {
  // Proceed with dispatch
} else {
  // Show error: validation.message
}
```

#### `suggestAdjustedDispatchDate(selectedDate, startDate, orderType)`
Analyzes timeline and suggests adjusted date if needed.

**Parameters:**
- `selectedDate` (string|Date): User selected dispatch date
- `startDate` (string|Date, optional): Starting date (default: today)
- `orderType` (string, optional): 'CABLE_ONLY' or 'POWER_CORD'

**Returns:**
```javascript
{
  hasHolidays: boolean,
  canProceed: boolean,
  holidayCount: number,
  holidays: Array<{date, reason}>,
  originalDate: Date,
  suggestedDate: Date,
  message: string
}
```

**Example:**
```javascript
const suggestion = suggestAdjustedDispatchDate('2025-10-10');
if (suggestion.hasHolidays && !suggestion.canProceed) {
  alert(`Consider using ${suggestion.suggestedDate} instead`);
} else if (suggestion.hasHolidays && suggestion.canProceed) {
  console.info(suggestion.message); // Informational only
}
```

#### `calculateStageDueDates(dispatchDate, orderType, useWorkingDays)`
Calculates all production stage due dates using backward planning.

**Parameters:**
- `dispatchDate` (string|Date): Target dispatch date
- `orderType` (string, optional): 'CABLE_ONLY' or 'POWER_CORD' (default: 'POWER_CORD')
- `useWorkingDays` (boolean, optional): Use working days calculation (default: true)

**Returns:**
```javascript
{
  DispatchDate: string (ISO),
  FGSectionDueDate: string (ISO),
  MouldingDueDate: string (ISO),
  Store2DueDate: string (ISO),
  CableProductionDueDate: string (ISO),
  Store1DueDate: string (ISO),
  useWorkingDays: boolean
}
```

**Example:**
```javascript
const dueDates = calculateStageDueDates('2025-10-10', 'POWER_CORD', true);
console.log('Store 1 starts:', dueDates.Store1DueDate); // Will be working day
```

---

## Version History

### Version 2.0 (Current)
- ✅ Enhanced validation with special case handling
- ✅ Automatic backward planning date calculation in batch dispatch
- ✅ Informational vs warning messages based on canProceed flag
- ✅ Validation for sufficient working days
- ✅ Store1DueDate and Store2DueDate holiday validation

### Version 1.0 (Previous)
- ✅ Basic holiday detection
- ✅ Working days calculation
- ✅ Manual dispatch date dialog

---

## Summary

The Holiday-Aware Backward Planning system ensures that:

1. **Store 1 Cable Production** and **Store 2 Moulding FG Section** due dates never fall on Sundays or gazetted holidays
2. The system automatically skips holidays when calculating production stage dates
3. Dispatch can proceed if all required working days (D-5 to D-1) are available, even if holidays exist in the timeline
4. Users receive clear, helpful messages about holiday impacts
5. All calculated dates are saved to the PO for tracking and reference

This intelligent system eliminates manual holiday calculations, prevents scheduling conflicts, and ensures realistic production timelines that respect non-working days.
