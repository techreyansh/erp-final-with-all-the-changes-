# Holiday-Aware Dispatch Planning - Testing Guide

## Quick Test Scenarios

### Test 1: October 2025 Scenario (Multiple Holidays)

#### Setup:
- **Today**: September 30, 2025
- **Holidays in October 2025**:
  - October 2 (Thursday) - Gandhi Jayanti
  - October 5 (Sunday) - Sunday
  - October 12 (Sunday) - Sunday
  - October 19 (Sunday) - Sunday
  - October 21 (Tuesday) - Diwali
  - October 26 (Sunday) - Sunday

#### Test Case 1.1: Dispatch on October 6
```
User Action: Select October 6, 2025 as dispatch date

Expected Alert:
┌─────────────────────────────────────────────────────────┐
│ ℹ️  Holiday Detected in Timeline                        │
│                                                         │
│ You selected 6 Oct 2025. There are 2 holidays in your  │
│ timeline (2 Oct 2025 (Gazetted Holiday), 5 Oct 2025    │
│ (Sunday)). Consider selecting 8 Oct 2025 to account    │
│ for non-working days.                                   │
│                                                         │
│                          [Use Suggested Date] Button    │
└─────────────────────────────────────────────────────────┘

Expected Backward Planning (Working Days):
✓ Dispatch (D):        October 6, 2025 (Monday)
✓ FG Section (D-1):    October 4, 2025 (Saturday) 
✓ Moulding (D-2):      October 3, 2025 (Friday)
✓ Store 2 (D-3):       October 1, 2025 (Wednesday) - Skips Oct 2 holiday
✓ Cable Production (D-4): September 30, 2025 (Tuesday)
✓ Store 1 (D-5):       September 29, 2025 (Monday)
```

#### Test Case 1.2: Dispatch on October 22
```
User Action: Select October 22, 2025 as dispatch date

Expected Alert:
┌─────────────────────────────────────────────────────────┐
│ ℹ️  Holiday Detected in Timeline                        │
│                                                         │
│ You selected 22 Oct 2025. There are 5 holidays in your │
│ timeline (2 Oct 2025 (Gazetted Holiday), 5 Oct 2025    │
│ (Sunday), 12 Oct 2025 (Sunday), 19 Oct 2025 (Sunday),  │
│ 21 Oct 2025 (Gazetted Holiday)). Consider selecting    │
│ 27 Oct 2025 to account for non-working days.           │
│                                                         │
│                          [Use Suggested Date] Button    │
└─────────────────────────────────────────────────────────┘

Suggested Date: October 27, 2025
```

---

### Test 2: No Holidays Scenario

#### Test Case 2.1: Clean Week
```
User Action: Select November 6, 2025 (assuming no holidays that week)

Expected Behavior:
✗ No alert shown
✓ Normal processing continues
✓ Backward planning uses consecutive calendar days
```

---

### Test 3: Boundary Cases

#### Test Case 3.1: Weekend Only
```
User Action: Select a Monday with only Sunday in timeline

Expected:
- Alert shows 1 holiday (Sunday)
- Suggests Tuesday (+1 day)
```

#### Test Case 3.2: Multiple Consecutive Holidays
```
Scenario: Festival period with consecutive holidays
- October 2 (Thursday) - Holiday
- October 3 (Friday) - Working day
- October 4 (Saturday) - Weekend
- October 5 (Sunday) - Weekend

User Action: Select October 6 (Monday)

Expected:
- Alert shows 2 holidays (Oct 2, Oct 5)
- Suggests October 8 (Wednesday)
```

---

## Manual Testing Steps

### Step 1: Open Dispatch Form
1. Login to the application
2. Navigate to Dispatch Planning
3. Select "Create Dispatch" mode

### Step 2: Select Client & Product
1. Choose any client code from dropdown
2. System auto-generates batches
3. Note the batch table appears

### Step 3: Test Holiday Detection
1. Click on "Dispatch Date" field for first batch
2. Select October 6, 2025 (or current date + days with holidays)
3. **Verify**: Blue alert box appears below table
4. **Verify**: Alert message lists holidays correctly
5. **Verify**: Suggested date is correct (original + holiday count)

### Step 4: Test "Use Suggested Date" Button
1. Click "Use Suggested Date" button
2. **Verify**: Date field updates to suggested date
3. **Verify**: Alert disappears
4. **Verify**: No holidays in new timeline

### Step 5: Test Backward Planning
1. Submit the dispatch form
2. Navigate to production stages
3. **Verify**: D-1, D-2, D-3, etc. skip holidays
4. **Verify**: No production scheduled on Sundays/holidays

---

## Validation Checklist

### Holiday Detection
- [ ] Detects Sundays correctly
- [ ] Detects gazetted holidays correctly
- [ ] Counts holidays accurately
- [ ] Handles multiple holidays
- [ ] Handles no holidays scenario

### Date Suggestions
- [ ] Suggests correct adjusted date
- [ ] Message displays all holidays
- [ ] Message format is clear and readable
- [ ] Button applies suggestion correctly

### Backward Planning
- [ ] D-1 skips holidays
- [ ] D-2 skips holidays
- [ ] D-3 skips holidays
- [ ] D-4 skips holidays
- [ ] D-5 skips holidays
- [ ] All stages on working days only

### UI/UX
- [ ] Alert appears at correct location
- [ ] Alert styling is consistent
- [ ] Button is clickable and responsive
- [ ] Alert dismisses when not needed
- [ ] No console errors

---

## Expected vs Actual Results Template

### Test Case: [Description]

**Date Scenario**: [Describe the date and holidays]

**User Action**: [What user does]

**Expected Result**:
```
Holiday Alert: [Yes/No]
Holiday Count: [Number]
Holidays Listed: [Dates and reasons]
Suggested Date: [Date]
```

**Actual Result**:
```
Holiday Alert: [Yes/No]
Holiday Count: [Number]
Holidays Listed: [Dates and reasons]
Suggested Date: [Date]
```

**Status**: ✅ PASS / ❌ FAIL

**Notes**: [Any observations]

---

## Common Issues & Troubleshooting

### Issue 1: Alert Not Showing
**Possible Causes**:
- No holidays in date range
- Date validation failed
- State not updating

**Debug**:
- Check console for errors
- Verify holiday list in `dateRestrictions.js`
- Check `holidaySuggestion` state

### Issue 2: Incorrect Suggestion
**Possible Causes**:
- Holiday calculation error
- Working days function issue

**Debug**:
- Manually count working days
- Check `addWorkingDays` function
- Verify holiday dates in array

### Issue 3: Backward Planning Not Skipping Holidays
**Possible Causes**:
- `useWorkingDays` flag set to false
- `subtractWorkingDays` function issue

**Debug**:
- Check `calculateStageDueDates` call
- Verify `useWorkingDays` parameter
- Test `subtractWorkingDays` independently

---

## Performance Testing

### Large Date Range
- [ ] Test with dispatch date 3 months out
- [ ] Verify alert shows within 1 second
- [ ] Check no UI lag

### Multiple Batches
- [ ] Test with 10+ batches
- [ ] Each batch should handle holidays
- [ ] No performance degradation

---

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

---

## Acceptance Criteria

### Feature is Ready When:

1. ✅ **Holiday Detection Works**
   - Correctly identifies all Sundays
   - Correctly identifies all gazetted holidays
   - Accurate count of holidays

2. ✅ **Suggestions Are Accurate**
   - Suggested date = original date + holiday count
   - Message clearly lists all holidays
   - "Use Suggested Date" button works

3. ✅ **Backward Planning Uses Working Days**
   - D-1, D-2, D-3, etc. skip holidays
   - All stages scheduled on working days
   - No production on Sundays/holidays

4. ✅ **UI is Polished**
   - Alert is visually appealing
   - Message is clear and readable
   - Button is prominent and clickable
   - No layout issues

5. ✅ **No Regressions**
   - Existing dispatch functionality works
   - No console errors
   - No performance issues

---

## Sample Test Data

### October 2025 Calendar
```
Sun Mon Tue Wed Thu Fri Sat
             1   2🎯  3   4
 5🎯  6   7   8   9  10  11
12🎯 13  14  15  16  17  18
19🎯 20  21🎯 22  23  24  25
26🎯 27  28  29  30  31

🎯 = Holiday (Sunday or Gazetted Holiday)
```

### Test Dates with Expected Results

| Selected Date | Holidays Count | Suggested Date | Holiday Details |
|---------------|----------------|----------------|-----------------|
| Oct 6, 2025   | 2              | Oct 8, 2025    | Oct 2 (Holiday), Oct 5 (Sunday) |
| Oct 13, 2025  | 3              | Oct 16, 2025   | Oct 2, 5, 12 |
| Oct 22, 2025  | 5              | Oct 27, 2025   | Oct 2, 5, 12, 19, 21 |
| Oct 3, 2025   | 1              | Oct 4, 2025    | Oct 2 (Holiday) |
| Nov 6, 2025   | 0              | Nov 6, 2025    | None |

---

## Regression Test Cases

### Ensure These Still Work:

1. **Date Validation**
   - [ ] Cannot select past dates
   - [ ] Cannot select Sundays directly
   - [ ] Cannot select holidays directly

2. **Batch Generation**
   - [ ] Batches generate correctly
   - [ ] Batch sizes calculated properly
   - [ ] Product codes assigned

3. **Dispatch Submission**
   - [ ] Form submits successfully
   - [ ] Data saved to Google Sheets
   - [ ] Success message appears

4. **Reschedule Mode**
   - [ ] Existing dispatches load
   - [ ] Reschedule function works
   - [ ] Holiday checking in reschedule

5. **Emergency Mode**
   - [ ] Emergency dispatches work
   - [ ] Holiday checking in emergency mode

---

## Demo Script for Stakeholders

### Scenario: Planning October Dispatch

**Presenter**: "Let me show you our new intelligent dispatch planning system."

1. **Open Dispatch Form**
   - "First, I'll select a client code..."
   - "The system automatically generates batches based on pending orders."

2. **Select Problematic Date**
   - "Now, let's say I want to dispatch on October 6th..."
   - "Notice what happens when I select this date..."

3. **Holiday Alert Appears**
   - "The system detected 2 holidays in our timeline!"
   - "It lists October 2nd (Gandhi Jayanti) and October 5th (Sunday)"
   - "And it suggests October 8th instead to account for these non-working days."

4. **Apply Suggestion**
   - "With one click, I can apply the suggested date."
   - "The alert disappears because the new date has no holiday conflicts."

5. **Show Backward Planning**
   - "Behind the scenes, the system calculates all production stages..."
   - "D-1 for FG Section, D-2 for Moulding, and so on..."
   - "But now, it skips holidays! So D-1 is October 4th, not the 5th which is Sunday."

6. **Submit**
   - "When I submit, all production stages are scheduled only on working days."
   - "This ensures realistic timelines and better resource management."

**Key Points**:
- ✅ Automatic holiday detection
- ✅ Clear suggestions
- ✅ One-click fix
- ✅ Realistic production schedules

---

## Success Metrics

### Measure These:

1. **Accuracy**
   - Holiday detection: 100% accurate
   - Date suggestions: 100% accurate
   - Backward planning: All on working days

2. **User Adoption**
   - % of users using suggested dates
   - Reduction in manual date adjustments
   - User feedback score

3. **Business Impact**
   - Fewer missed deadlines
   - Better production schedule adherence
   - Reduced planning errors

---

## Sign-Off Checklist

Before deploying to production:

- [ ] All test cases pass
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] UI is polished
- [ ] Documentation complete
- [ ] Stakeholder demo successful
- [ ] Holiday list updated for current year
- [ ] Backup plan in place
- [ ] Team trained on feature
- [ ] Support docs ready

---

**Happy Testing! 🎯**
