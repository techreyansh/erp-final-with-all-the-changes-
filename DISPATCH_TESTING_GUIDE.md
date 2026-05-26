# Dispatch Rescheduling & Emergency Production Testing Guide

## Pre-Testing Setup

1. Ensure you have some existing POs in the system
2. Create at least one dispatch to test rescheduling
3. Set up daily capacity limits in the Daily_CAPACITY sheet

## Testing Scenarios

### 1. Normal Dispatch Creation (Create Mode)
**Steps:**
1. Navigate to Dispatch Management
2. Ensure "Create" mode is selected (should be default)
3. Select a client code from the dropdown
4. Choose a product code (if multiple available)
5. Review the generated batches
6. Set dispatch dates within the allowed range
7. Submit the dispatch

**Expected Results:**
- Client and product selection works smoothly
- Batches are automatically calculated
- Date validation prevents out-of-range dates
- Capacity limits are respected
- Success message appears on submission

### 2. Rescheduling Existing Dispatches
**Steps:**
1. Click the "Reschedule" button in the header
2. Verify existing dispatches are displayed in the table
3. Select a dispatch by clicking the radio button
4. Choose a new dispatch date
5. Test with and without "Emergency Mode" enabled
6. Click "Reschedule"

**Expected Results:**
- Existing dispatches load in a table format
- Selection highlights the chosen dispatch
- Date validation works (shows errors for invalid dates)
- Emergency mode bypasses capacity limits
- Success message confirms rescheduling

### 3. Emergency Production Dispatch
**Steps:**
1. Click the "Emergency" button (orange) in the header
2. Read the warning message about emergency mode
3. Select a client code
4. Enter a product code manually
5. Set quantity and dispatch date
6. Choose priority level (HIGH/CRITICAL/URGENT)
7. Submit emergency dispatch

**Expected Results:**
- Warning message explains emergency mode capabilities
- All form fields accept input
- Capacity override functionality works
- Emergency dispatch is created with proper flags
- Priority is saved correctly

### 4. Capacity Validation Testing
**Steps:**
1. Find a date that's near or at capacity limit
2. Try to schedule normal dispatch (should fail if over limit)
3. Enable emergency mode and try again
4. Verify 150% capacity is allowed in emergency mode

**Expected Results:**
- Normal mode respects capacity limits
- Emergency mode allows 150% of normal capacity
- Clear error messages for capacity violations
- Visual indicators show capacity status

### 5. Visual Indicators Testing
**Steps:**
1. Create both normal and emergency dispatches
2. View them in reschedule mode
3. Check for proper status indicators
4. Verify priority badges appear for emergency dispatches

**Expected Results:**
- Emergency dispatches show warning-colored chips
- Priority badges display correctly
- Status icons (emergency vs schedule) appear
- Tooltips provide helpful information

### 6. Edge Cases Testing
**Steps:**
1. Test with empty client/product lists
2. Try rescheduling to past dates (normal vs emergency)
3. Test with very large quantities
4. Test network error scenarios

**Expected Results:**
- Graceful handling of empty data
- Past date validation (blocked unless emergency)
- Large quantities handled properly
- Error messages for network issues

## Expected Behavior Summary

### Mode Switching:
- Three distinct modes: Create, Reschedule, Emergency
- Mode buttons highlight current selection
- Content changes appropriately for each mode

### Capacity Management:
- Normal mode: Respects daily limits
- Emergency mode: Allows 150% capacity
- Clear visual feedback for capacity status

### Data Validation:
- Required fields are enforced
- Date ranges are validated
- Capacity limits are checked
- User-friendly error messages

### User Experience:
- Smooth transitions between modes
- Loading states during operations
- Success/error notifications
- Intuitive form layouts

## Debugging Tips

1. **Check Browser Console**: Look for JavaScript errors
2. **Network Tab**: Verify API calls are successful
3. **React DevTools**: Inspect component state
4. **Database**: Verify data is saved correctly with emergency flags

## Success Criteria

✅ All three modes function correctly
✅ Rescheduling updates dispatch dates
✅ Emergency mode bypasses capacity limits
✅ Visual indicators display properly
✅ Error handling works as expected
✅ Data persistence works correctly

If all tests pass, the dispatch rescheduling and emergency production functionality is working correctly!
