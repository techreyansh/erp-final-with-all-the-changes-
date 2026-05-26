# General Holiday-Aware Due Date Calculation

## Overview

The system now has **centralized, holiday-aware due date calculation** that works throughout the entire application. All due dates automatically skip Sundays and gazetted holidays.

---

## How It Works

### 1. Centralized Calculation Functions

Two main utility functions handle all due date calculations:

#### `calculateDueDate(fromDate, hours, useWorkingDays)`
Returns a Date object.

```javascript
import { calculateDueDate } from './utils/dateUtils';

// Calculate due date 48 hours from now (skipping holidays)
const dueDate = calculateDueDate(new Date(), 48, true);
```

#### `calculateDueDateISO(fromDate, hours, useWorkingDays)`
Returns an ISO date string.

```javascript
import { calculateDueDateISO } from './utils/dateUtils';

// Get due date as ISO string
const dueDateStr = calculateDueDateISO(new Date(), 24, true);
```

### 2. Updated Services

#### Flow Service (`flowService.js`)
The `calculateSLADueDate()` method now uses working days:

```javascript
// OLD: Simple hour addition (no holiday skip)
calculateSLADueDate(status) {
  const slaHours = config.slaHours[status] || 24;
  const dueDateTime = new Date();
  dueDateTime.setHours(dueDateTime.getHours() + slaHours);
  return dueDateTime.toISOString();
}

// NEW: Working days calculation (skips holidays)
calculateSLADueDate(status) {
  const slaHours = config.slaHours[status] || 24;
  const workingDays = Math.ceil(slaHours / 24);
  const dueDate = addWorkingDays(new Date(), workingDays);
  dueDate.setHours(23, 59, 59, 999);
  return dueDate.toISOString();
}
```

#### Dispatch Service (`dispatchService.js`)
Calculates all backward planning dates using `calculateStageDueDates()` with `useWorkingDays = true`.

---

## Usage Examples

### Example 1: Calculate Due Date for a Task

```javascript
import { calculateDueDateISO } from './utils/dateUtils';

// Task created today, due in 24 hours (1 working day)
const createdAt = new Date();
const dueDate = calculateDueDateISO(createdAt, 24, true);

// If today is Friday, due date will be Monday (skipping weekend)
// If Monday is a holiday, due date will be Tuesday
```

### Example 2: Store 1 Due Date (5 working days before dispatch)

```javascript
import { subtractWorkingDays } from './utils/dateRestrictions';

const dispatchDate = new Date('2025-10-07');
const store1DueDate = subtractWorkingDays(dispatchDate, 5);

// Result: 2025-09-30 (skips Oct 2 holiday and Oct 5 Sunday)
```

### Example 3: Calculate Multiple Stage Dates

```javascript
import { calculateStageDueDates } from './utils/backwardPlanning';

const dueDates = calculateStageDueDates('2025-10-07', 'POWER_CORD', true);

console.log(dueDates);
// {
//   DispatchDate: '2025-10-07T23:59:59.999Z',
//   FGSectionDueDate: '2025-10-06T23:59:59.999Z',
//   MouldingDueDate: '2025-10-04T23:59:59.999Z',
//   Store2DueDate: '2025-10-03T23:59:59.999Z',
//   CableProductionDueDate: '2025-10-01T23:59:59.999Z',
//   Store1DueDate: '2025-09-30T23:59:59.999Z'
// }
```

---

## Configuration

### SLA Hours (config.js)

```javascript
slaHours: {
  STORE1: 24,              // 1 working day
  CABLE_PRODUCTION: 48,    // 2 working days
  STORE2: 24,              // 1 working day
  MOULDING: 48,            // 2 working days
  FG_SECTION: 24,          // 1 working day
  DISPATCH: 24,            // 1 working day
}
```

These SLA hours are automatically converted to working days:
- 24 hours = 1 working day
- 48 hours = 2 working days
- 72 hours = 3 working days

### Working Days

```
Monday - Friday:    ✓ Working days
Saturday:           ✓ Working day
Sunday:             ❌ Non-working day (SKIPPED)
Gazetted Holidays:  ❌ Non-working days (SKIPPED)
```

### Holidays (dateRestrictions.js)

Holidays are maintained in the `GAZETTED_HOLIDAYS` array:

```javascript
const GAZETTED_HOLIDAYS = [
  '2025-01-26', // Republic Day
  '2025-10-02', // Gandhi Jayanti
  '2025-12-25', // Christmas
  // ... etc
];
```

---

## What Changed

### Before (Calendar Days)

```
Task created: Oct 1 (Wed)
SLA: 48 hours (2 days)
Due Date: Oct 3 (Fri) ✓

Task created: Oct 3 (Fri)
SLA: 48 hours (2 days)
Due Date: Oct 5 (Sun) ❌ SUNDAY!
```

### After (Working Days)

```
Task created: Oct 1 (Wed)
SLA: 48 hours → 2 working days
Due Date: Oct 3 (Fri) ✓

Task created: Oct 3 (Fri)
SLA: 48 hours → 2 working days
Due Date: Oct 7 (Tue) ✓ (skipped Oct 5 Sunday + Oct 2 if needed)
```

---

## Where It's Used

### 1. Flow Management
When tasks advance through stages (NEW → STORE1 → CABLE_PRODUCTION → etc.), due dates are calculated using `flowService.calculateSLADueDate()`.

### 2. Dispatch Planning
When creating dispatches, all backward planning dates (D-5, D-4, D-3, D-2, D-1) are calculated using `calculateStageDueDates()`.

### 3. Task Rejection
When tasks are rejected and sent back, new due dates are calculated using working days.

### 4. Any New Features
Any new feature can use these centralized functions for consistent holiday-aware calculations.

---

## Testing

### Test Scenario 1: Weekend Skip

```javascript
// Test: Due date falls on Sunday
const friday = new Date('2025-10-03');
const dueDate = calculateDueDate(friday, 48); // 2 working days

// Expected: Tuesday Oct 7 (skips Sat-Sun weekend)
console.log(dueDate); // 2025-10-07
```

### Test Scenario 2: Holiday Skip

```javascript
// Test: Due date falls on Gandhi Jayanti (Oct 2)
const wednesday = new Date('2025-10-01');
const dueDate = calculateDueDate(wednesday, 24); // 1 working day

// Expected: Friday Oct 3 (skips Thursday Oct 2 holiday)
console.log(dueDate); // 2025-10-03
```

### Test Scenario 3: Multiple Holidays

```javascript
// Test: Multiple holidays in range
const sept30 = new Date('2025-09-30');
const dueDate = calculateDueDate(sept30, 5 * 24); // 5 working days

// Expected: Oct 7 (skips Oct 2 holiday + Oct 5 Sunday)
console.log(dueDate); // 2025-10-07
```

---

## Migration

### For Existing Code

Replace old due date calculations:

```javascript
// OLD: Manual calculation
const dueDate = new Date();
dueDate.setDate(dueDate.getDate() + 2);

// NEW: Holiday-aware calculation
import { calculateDueDate } from './utils/dateUtils';
const dueDate = calculateDueDate(new Date(), 48);
```

### For New Features

Always use the centralized functions:

```javascript
import { calculateDueDateISO } from './utils/dateUtils';
import { calculateStageDueDates } from './utils/backwardPlanning';
import { subtractWorkingDays, addWorkingDays } from './utils/dateRestrictions';
```

---

## Benefits

✅ **Consistency:** All due dates calculated the same way across the system
✅ **Accuracy:** Automatically skips Sundays and holidays
✅ **Maintainability:** Change logic in one place, affects entire system
✅ **Realistic:** No more due dates on Sundays or holidays
✅ **Compliance:** Respects statutory holidays

---

## Console Output

When due dates are calculated, you'll see detailed logs:

```
SLA Due Date Calculation for STORE1:
  SLA Hours: 24 hours
  Working Days: 1 days
  Calculated Due Date: 2025-10-03 (skipping Sundays & holidays)

=== CALCULATING BACKWARD PLANNING DATES ===
Dispatch Date Selected: 2025-10-07
Order Type: POWER_CORD

📅 CALCULATED PRODUCTION TIMELINE (WORKING DAYS ONLY):
─────────────────────────────────────────────────────────
D-5 (Store 1 Cable Production): 2025-09-30
D-4 (Cable Production):         2025-10-01
D-3 (Store 2 Moulding FG):      2025-10-03
D-2 (Moulding):                 2025-10-04
D-1 (FG Section):               2025-10-06
D   (Dispatch):                 2025-10-07
─────────────────────────────────────────────────────────
✓ Store 1 Cable Production date is a working day
✓ Store 2 Moulding FG Section date is a working day
```

---

## Summary

The entire system now uses **holiday-aware due date calculation**. Whether it's:
- Task advancement in flow management
- Dispatch backward planning
- SLA-based due dates
- Task rejection and rescheduling

**All calculations automatically skip Sundays and gazetted holidays!** 🎉
