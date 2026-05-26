# Holiday-Aware Dispatch Planning System

## Overview

Enhanced the dispatch planning system with **intelligent holiday detection** and **working days calculation** for backward planning. The system now automatically detects holidays and Sundays in the production timeline and suggests adjusted dates to ensure realistic production schedules.

---

## Features Implemented

### 1. Holiday Detection & Suggestion

When planning a dispatch, the system automatically checks for holidays and Sundays between today and the selected dispatch date, then suggests an adjusted date that accounts for non-working days.

#### Example Scenario:
- **Today**: September 30, 2025
- **User Selects**: October 6, 2025
- **Holidays Detected**: 
  - October 2, 2025 (Gandhi Jayanti - Gazetted Holiday)
  - October 5, 2025 (Sunday)
- **System Suggestion**: "You selected 6 Oct 2025. There are 2 holidays in your timeline (2 Oct 2025 (Gazetted Holiday), 5 Oct 2025 (Sunday)). Consider selecting 8 Oct 2025 to account for non-working days."

### 2. Working Days Backward Planning (D-1, D-2, D-3, etc.)

The backward planning formula now **excludes holidays and Sundays** when calculating due dates for each production stage.

#### Old Behavior (Calendar Days):
- **Dispatch Date (D)**: October 6, 2025
- **D-1 (FG Section)**: October 5, 2025 ❌ *This is Sunday!*
- **D-2 (Moulding)**: October 4, 2025
- **D-3 (Store 2)**: October 3, 2025
- **D-4 (Cable Production)**: October 2, 2025 ❌ *This is a holiday!*
- **D-5 (Store 1)**: October 1, 2025

#### New Behavior (Working Days):
- **Dispatch Date (D)**: October 6, 2025
- **D-1 (FG Section)**: October 4, 2025 ✓ *(Skipped October 5 - Sunday)*
- **D-2 (Moulding)**: October 3, 2025 ✓
- **D-3 (Store 2)**: October 1, 2025 ✓ *(Skipped October 2 - Holiday)*
- **D-4 (Cable Production)**: September 30, 2025 ✓
- **D-5 (Store 1)**: September 29, 2025 ✓

---

## Technical Implementation

### 1. Date Restrictions Utility (`src/utils/dateRestrictions.js`)

#### New Functions Added:

##### `countWorkingDays(startDate, endDate)`
Counts the number of working days between two dates (excluding Sundays and holidays).

```javascript
const workingDays = countWorkingDays('2025-09-30', '2025-10-06');
// Returns: 4 (excludes Oct 2 and Oct 5)
```

##### `countHolidaysBetween(startDate, endDate)`
Returns detailed information about holidays between two dates.

```javascript
const result = countHolidaysBetween('2025-09-30', '2025-10-06');
// Returns: {
//   count: 2,
//   holidays: [
//     { date: '2025-10-02', reason: 'Gazetted Holiday' },
//     { date: '2025-10-05', reason: 'Sunday' }
//   ]
// }
```

##### `addWorkingDays(fromDate, workingDays)`
Adds a specific number of working days to a date, skipping holidays and Sundays.

```javascript
const futureDate = addWorkingDays('2025-10-01', 5);
// Returns: October 8, 2025 (skips Oct 2, 5, 6)
```

##### `subtractWorkingDays(fromDate, workingDays)`
Subtracts a specific number of working days from a date, skipping holidays and Sundays.

```javascript
const pastDate = subtractWorkingDays('2025-10-06', 2);
// Returns: October 3, 2025 (skips Oct 5 - Sunday)
```

##### `suggestAdjustedDispatchDate(selectedDate, startDate)`
Analyzes the timeline and suggests an adjusted dispatch date accounting for holidays.

```javascript
const suggestion = suggestAdjustedDispatchDate('2025-10-06', '2025-09-30');
// Returns: {
//   hasHolidays: true,
//   holidayCount: 2,
//   holidays: [...],
//   originalDate: Date(2025-10-06),
//   suggestedDate: Date(2025-10-08),
//   message: "You selected 6 Oct 2025. There are 2 holidays..."
// }
```

---

### 2. Backward Planning Utility (`src/utils/backwardPlanning.js`)

#### Updated Function:

##### `calculateStageDueDates(dispatchDate, orderType, useWorkingDays)`

Now supports a `useWorkingDays` parameter (default: `true`) to exclude holidays in calculations.

```javascript
const dueDates = calculateStageDueDates('2025-10-06', 'POWER_CORD', true);
// Returns: {
//   DispatchDate: '2025-10-06T23:59:59.999Z',
//   FGSectionDueDate: '2025-10-04T23:59:59.999Z',  // D-1 (skips Sunday)
//   MouldingDueDate: '2025-10-03T23:59:59.999Z',   // D-2
//   Store2DueDate: '2025-10-01T23:59:59.999Z',     // D-3 (skips holiday)
//   CableProductionDueDate: '2025-09-30T23:59:59.999Z', // D-4
//   Store1DueDate: '2025-09-29T23:59:59.999Z',     // D-5
//   useWorkingDays: true
// }
```

**Backward Compatibility**: Set `useWorkingDays` to `false` to use old calendar-based behavior.

---

### 3. Dispatch Form UI (`src/components/dispatch/DispatchForm.js`)

#### New State:
```javascript
const [holidaySuggestion, setHolidaySuggestion] = useState(null);
```

#### Enhanced Date Change Handler:
When a user selects a dispatch date, the system:
1. Validates the date (prevents past dates and restricted dates)
2. Checks for holidays in the timeline
3. Displays a suggestion alert if holidays are detected
4. Provides a "Use Suggested Date" button for quick correction

#### UI Component:
An alert box appears below the batch table when holidays are detected:

```
╔═══════════════════════════════════════════════════════════════╗
║  ℹ️  Holiday Detected in Timeline                            ║
║                                                               ║
║  You selected 6 Oct 2025. There are 2 holidays in your       ║
║  timeline (2 Oct 2025 (Gazetted Holiday), 5 Oct 2025         ║
║  (Sunday)). Consider selecting 8 Oct 2025 to account for     ║
║  non-working days.                                            ║
║                                                               ║
║                               [Use Suggested Date] Button     ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Holiday Configuration

### Current Holidays (2024-2025)

The system maintains a list of gazetted holidays in `src/utils/dateRestrictions.js`:

```javascript
const GAZETTED_HOLIDAYS = [
  // 2024
  '2024-01-26', // Republic Day
  '2024-03-08', // Holi
  '2024-03-25', // Good Friday
  '2024-04-11', // Eid al-Fitr
  '2024-04-14', // Ambedkar Jayanti
  '2024-04-17', // Ram Navami
  '2024-05-01', // Labour Day
  '2024-06-17', // Eid al-Adha
  '2024-08-15', // Independence Day
  '2024-08-26', // Janmashtami
  '2024-10-02', // Gandhi Jayanti
  '2024-10-12', // Dussehra
  '2024-11-01', // Diwali
  '2024-11-15', // Guru Nanak Jayanti
  '2024-12-25', // Christmas Day
  
  // 2025
  '2025-01-26', // Republic Day
  '2025-02-27', // Holi
  '2025-04-18', // Good Friday
  '2025-03-31', // Eid al-Fitr
  '2025-04-14', // Ambedkar Jayanti
  '2025-04-06', // Ram Navami
  '2025-05-01', // Labour Day
  '2025-06-07', // Eid al-Adha
  '2025-08-15', // Independence Day
  '2025-10-02', // Gandhi Jayanti
  '2025-10-21', // Diwali
  '2025-11-05', // Guru Nanak Jayanti
  '2025-12-25', // Christmas Day
];
```

**Note**: Update this list annually or make it configurable via admin panel.

---

## User Workflow

### Creating a Dispatch

1. **Select Client Code** from dropdown
2. **View Batches** generated automatically
3. **Select Dispatch Date** for each batch
4. **Holiday Alert Appears** (if holidays detected):
   - Shows number of holidays
   - Lists each holiday with reason
   - Suggests adjusted date
   - Provides "Use Suggested Date" button
5. **Review Timeline**: System calculates D-1, D-2, D-3, etc. using working days
6. **Submit Dispatch**: All production stages scheduled excluding holidays

### Example User Experience

```
User Action: Selects October 6, 2025 as dispatch date

System Response:
╔═══════════════════════════════════════════════════════════════╗
║  ℹ️  Holiday Detected in Timeline                            ║
║                                                               ║
║  You selected 6 Oct 2025. There are 2 holidays in your       ║
║  timeline (2 Oct 2025 (Gazetted Holiday), 5 Oct 2025         ║
║  (Sunday)). Consider selecting 8 Oct 2025 to account for     ║
║  non-working days.                                            ║
║                                                               ║
║                               [Use Suggested Date] Button     ║
╚═══════════════════════════════════════════════════════════════╝

User Options:
1. Click "Use Suggested Date" → Auto-fills October 8, 2025
2. Ignore and proceed with October 6, 2025
3. Manually select a different date
```

---

## Benefits

### 1. Realistic Production Schedules
- Automatically accounts for non-working days
- Prevents impossible deadlines
- Ensures production capacity alignment

### 2. Reduced Planning Errors
- Visual alerts for holiday conflicts
- Automatic suggestions eliminate manual calculations
- Clear communication of timeline issues

### 3. Better Resource Management
- Production stages scheduled only on working days
- Avoids weekend or holiday production expectations
- Improves employee scheduling

### 4. Enhanced User Experience
- Intelligent suggestions reduce user effort
- One-click application of suggested dates
- Clear, informative messages

---

## Testing Scenarios

### Scenario 1: Single Holiday in Timeline
- **Input**: Dispatch date with 1 holiday between today and selected date
- **Expected**: Alert shows 1 holiday, suggests date +1 day

### Scenario 2: Multiple Holidays
- **Input**: Dispatch date with 2+ holidays (Sunday + gazetted holiday)
- **Expected**: Alert lists all holidays, suggests date +2 days

### Scenario 3: No Holidays
- **Input**: Dispatch date with no holidays in range
- **Expected**: No alert shown, normal processing

### Scenario 4: Backward Planning
- **Input**: Dispatch date = October 6, 2025
- **Expected**: 
  - D-1 = October 4 (not Oct 5 - Sunday)
  - D-3 = October 1 (not Oct 2 - Holiday)

---

## Future Enhancements

### 1. Configurable Holidays
- Admin panel to manage holiday list
- Company-specific holiday calendars
- Regional holiday support

### 2. Advanced Suggestions
- Multiple suggestion options
- Capacity-aware suggestions
- Smart date recommendations based on workload

### 3. Holiday Impact Analysis
- Show impact on all production stages
- Highlight affected tasks
- Reschedule recommendations

### 4. Integration with Calendar
- Sync with Google Calendar
- Company-wide holiday calendar
- Automatic updates from HR systems

---

## API Reference

### Date Restriction Functions

```javascript
// Import
import { 
  countWorkingDays,
  countHolidaysBetween,
  addWorkingDays,
  subtractWorkingDays,
  suggestAdjustedDispatchDate,
  isRestrictedDate,
  getRestrictionReason
} from './utils/dateRestrictions';

// Usage Examples

// Count working days
const days = countWorkingDays('2025-09-30', '2025-10-06');

// Get holiday info
const info = countHolidaysBetween('2025-09-30', '2025-10-06');

// Add working days
const future = addWorkingDays('2025-10-01', 5);

// Subtract working days
const past = subtractWorkingDays('2025-10-06', 2);

// Get suggestion
const suggestion = suggestAdjustedDispatchDate('2025-10-06');

// Check if date is restricted
const restricted = isRestrictedDate('2025-10-05'); // true (Sunday)

// Get restriction reason
const reason = getRestrictionReason('2025-10-02'); // "Gazetted Holiday"
```

### Backward Planning Functions

```javascript
// Import
import { 
  calculateStageDueDates,
  getDueDateForStage,
  getOrderedStageDueDates
} from './utils/backwardPlanning';

// Usage Examples

// Calculate all stage due dates (with working days)
const dueDates = calculateStageDueDates('2025-10-06', 'POWER_CORD', true);

// Calculate with calendar days (old behavior)
const calendarDates = calculateStageDueDates('2025-10-06', 'POWER_CORD', false);

// Get specific stage due date
const store1Date = getDueDateForStage('2025-10-06', config.statusCodes.STORE1);

// Get ordered list for display
const orderedStages = getOrderedStageDueDates(dueDates);
```

---

## Maintenance

### Annual Holiday Update

Update the `GAZETTED_HOLIDAYS` array in `src/utils/dateRestrictions.js`:

```javascript
const GAZETTED_HOLIDAYS = [
  // 2026
  '2026-01-26', // Republic Day
  '2026-03-05', // Holi
  // ... add more holidays
];
```

### Testing After Updates

1. Test date selection with new holidays
2. Verify backward planning calculations
3. Check suggestion messages
4. Validate all production stages

---

## Support

For issues or questions:
- Check holiday configuration in `src/utils/dateRestrictions.js`
- Review backward planning in `src/utils/backwardPlanning.js`
- Test with different date scenarios
- Verify holiday list is current

---

## Version History

### Version 1.0 (September 30, 2025)
- ✅ Holiday detection in dispatch planning
- ✅ Automatic date suggestions
- ✅ Working days backward planning (D-1, D-2, D-3, etc.)
- ✅ Visual alerts for holiday conflicts
- ✅ One-click suggested date application
- ✅ Comprehensive holiday list (2024-2025)

---

## Summary

The Holiday-Aware Dispatch Planning System ensures realistic production schedules by:

1. **Detecting holidays** in the timeline between today and dispatch date
2. **Suggesting adjusted dates** that account for non-working days
3. **Calculating backward planning** (D-1, D-2, etc.) using working days only
4. **Providing clear visual alerts** with actionable suggestions
5. **Improving planning accuracy** and resource management

This intelligent system eliminates manual holiday calculations and prevents scheduling conflicts, resulting in more reliable production timelines.
