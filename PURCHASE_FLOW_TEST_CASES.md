# Purchase Flow Management - Test Cases for All 21 Steps

## Overview
This document outlines comprehensive test cases for all 21 steps in the Purchase Flow Management system to ensure proper functionality, error handling, and data validation.

---

## Step 1: Raise Indent (Store Manager)

### Test Cases:
1. **TC-001**: Create new indent with valid data
   - Input: Valid item code, item name, quantity, specifications
   - Expected: Indent created successfully, moves to Step 2
   - Validation: All fields required, quantity must be positive number

2. **TC-002**: Create indent with missing required fields
   - Input: Missing item code or quantity
   - Expected: Error message displayed, indent not created
   - Validation: Form validation prevents submission

3. **TC-003**: Create indent with invalid quantity
   - Input: Negative quantity or non-numeric value
   - Expected: Validation error, quantity must be positive number
   - Validation: Numeric validation, min value check

4. **TC-004**: Create indent exceeding max stock level
   - Input: Quantity that exceeds max stock level
   - Expected: Warning message, quantity error displayed
   - Validation: Stock level validation

5. **TC-005**: Add multiple items to indent
   - Input: Multiple items in single indent
   - Expected: All items saved correctly
   - Validation: Array handling, data persistence

6. **TC-006**: Edit existing indent
   - Input: Modify item details
   - Expected: Changes saved successfully
   - Validation: Update functionality

7. **TC-007**: Delete indent
   - Input: Delete confirmation
   - Expected: Indent removed from system
   - Validation: Delete confirmation dialog

8. **TC-008**: Handle network error during save
   - Input: Network failure
   - Expected: Error message displayed, data not lost
   - Validation: Error handling, retry mechanism

---

## Step 2: Approve Indent (Process Coordinator)

### Test Cases:
1. **TC-009**: Approve valid indent
   - Input: Approve button clicked
   - Expected: Indent approved, moves to Step 3
   - Validation: Status update, NextStep set to 3

2. **TC-010**: Reject indent with reason
   - Input: Reject with rejection note
   - Expected: Indent rejected, status updated
   - Validation: Rejection note required

3. **TC-011**: Approve indent without items
   - Input: Indent with empty items array
   - Expected: Error message, cannot approve
   - Validation: Items array validation

4. **TC-012**: Handle concurrent approvals
   - Input: Multiple users trying to approve same indent
   - Expected: Only one approval succeeds
   - Validation: Concurrency handling

---

## Step 3: Float RFQ (Purchase Executive)

### Test Cases:
1. **TC-013**: Assign vendors to items
   - Input: Select vendors for each item
   - Expected: Vendors assigned successfully
   - Validation: Vendor selection required

2. **TC-014**: Complete step without vendors
   - Input: Try to complete with items missing vendors
   - Expected: Error message, step not completed
   - Validation: All items must have at least one vendor

3. **TC-015**: Add multiple vendors to item
   - Input: Assign multiple vendors to single item
   - Expected: All vendors saved correctly
   - Validation: Array handling

4. **TC-016**: Remove vendor from item
   - Input: Remove vendor button
   - Expected: Vendor removed successfully
   - Validation: Remove functionality

---

## Step 4: Follow-up for Quotations (Purchase Executive)

### Test Cases:
1. **TC-017**: Upload quotation documents
   - Input: Upload PDF/document files
   - Expected: Files uploaded successfully
   - Validation: File type validation, size limits

2. **TC-018**: Save quotation details
   - Input: Enter quotation details (date, amount, validity)
   - Expected: Details saved successfully
   - Validation: Required fields validation

3. **TC-019**: Complete step without quotations
   - Input: Try to complete without uploading quotations
   - Expected: Error message, step not completed
   - Validation: At least one quotation required

4. **TC-020**: Handle file upload errors
   - Input: Invalid file or upload failure
   - Expected: Error message displayed
   - Validation: Error handling

---

## Step 5: Prepare Comparative Statement (Purchase Executive)

### Test Cases:
1. **TC-021**: Generate comparative statement
   - Input: Select indent with quotations
   - Expected: Statement generated with vendor comparison
   - Validation: Data aggregation, calculation accuracy

2. **TC-022**: Save comparative statement
   - Input: Save statement data
   - Expected: Statement saved successfully
   - Validation: Data persistence

3. **TC-023**: Handle missing quotation data
   - Input: Indent without quotations
   - Expected: Error message, cannot generate statement
   - Validation: Data availability check

---

## Step 6: Approve Quotation (Management / HOD)

### Test Cases:
1. **TC-024**: Select vendor for items
   - Input: Choose vendor from comparative statement
   - Expected: Vendor selected successfully
   - Validation: Vendor selection required

2. **TC-025**: Complete step without vendor selection
   - Input: Try to complete without selecting vendors
   - Expected: Error message, step not completed
   - Validation: All items must have selected vendor

3. **TC-026**: Mark sample requirement
   - Input: Toggle sample required for items
   - Expected: Sample requirement saved
   - Validation: Boolean handling

---

## Step 7: Request & Follow-up for Sample (Purchase Executive)

### Test Cases:
1. **TC-027**: Request sample from vendor
   - Input: Create sample request
   - Expected: Request sent successfully
   - Validation: Vendor details validation

2. **TC-028**: Track sample status
   - Input: Update sample status
   - Expected: Status updated correctly
   - Validation: Status enum validation

3. **TC-029**: Complete step without sample request
   - Input: Try to complete without requesting samples
   - Expected: Warning if sample required but not requested
   - Validation: Sample requirement check

---

## Step 8: Inspect Sample (QC Manager)

### Test Cases:
1. **TC-030**: Approve sample
   - Input: Approve sample quality
   - Expected: Sample approved, moves to next step
   - Validation: Approval status update

2. **TC-031**: Reject sample with reason
   - Input: Reject with rejection note
   - Expected: Sample rejected, reason saved
   - Validation: Rejection note required

3. **TC-032**: Handle multiple samples
   - Input: Multiple items requiring samples
   - Expected: Each sample inspected independently
   - Validation: Per-item handling

---

## Step 9: Sort Vendors (Purchase Executive)

### Test Cases:
1. **TC-033**: Rank vendors
   - Input: Assign ranking to vendors
   - Expected: Rankings saved successfully
   - Validation: Ranking validation

2. **TC-034**: Complete vendor sorting
   - Input: Complete sorting step
   - Expected: Step completed, moves to Place PO
   - Validation: All vendors ranked

---

## Step 10: Place PO (Purchase Executive)

### Test Cases:
1. **TC-035**: Generate Purchase Order
   - Input: Create PO with items and vendor
   - Expected: PO generated successfully
   - Validation: All required fields

2. **TC-036**: Download PO PDF
   - Input: Download PO document
   - Expected: PDF generated correctly, A4 format
   - Validation: PDF formatting, no overlapping content

3. **TC-037**: Save PO to system
   - Input: Save PO details
   - Expected: PO saved, moves to Step 11
   - Validation: Data persistence

4. **TC-038**: Handle PO generation errors
   - Input: Missing vendor or item data
   - Expected: Error message displayed
   - Validation: Data validation

---

## Step 11: Follow-up for Delivery (Purchase Executive)

### Test Cases:
1. **TC-039**: Track delivery status
   - Input: Update delivery status
   - Expected: Status updated successfully
   - Validation: Status enum validation

2. **TC-040**: Upload delivery documents
   - Input: Upload DC, PO copy
   - Expected: Documents uploaded successfully
   - Validation: File upload validation

3. **TC-041**: Complete delivery follow-up
   - Input: Mark delivery as complete
   - Expected: Step completed, moves to Step 12
   - Validation: Status update

---

## Step 12: Receive & Inspect Material (Store Manager)

### Test Cases:
1. **TC-042**: Record material receipt
   - Input: Enter received quantity
   - Expected: Receipt recorded successfully
   - Validation: Quantity validation

2. **TC-043**: Save inspection data
   - Input: Enter inspection status and notes
   - Expected: Inspection data saved
   - Validation: Status validation

3. **TC-044**: Complete inspection step
   - Input: Complete inspection
   - Expected: Step completed, moves to Step 13
   - Validation: Status update

---

## Step 13: Material Approval (QC Manager)

### Test Cases:
1. **TC-045**: Approve material with all documents
   - Input: Upload Invoice, DC, PO Copy
   - Expected: Material approved, moves to Step 17
   - Validation: All three documents required

2. **TC-046**: Try to approve without all documents
   - Input: Missing one or more documents
   - Expected: Error message, approval disabled
   - Validation: Document validation

3. **TC-047**: Reject material with reason
   - Input: Reject with rejection note
   - Expected: Material rejected, moves to Step 14
   - Validation: Rejection note required

4. **TC-048**: Handle file upload errors
   - Input: Invalid file or upload failure
   - Expected: Error message displayed
   - Validation: Error handling

---

## Step 14: Decision on Rejection (Purchase Executive)

### Test Cases:
1. **TC-049**: Decide to return material
   - Input: Select return option
   - Expected: Moves to Step 15
   - Validation: Decision selection

2. **TC-050**: Decide to accept with conditions
   - Input: Accept with conditions
   - Expected: Moves to appropriate step
   - Validation: Decision handling

---

## Step 15: Return Rejected Material (Store Manager)

### Test Cases:
1. **TC-051**: Process material return
   - Input: Complete return process
   - Expected: Return processed, moves to Step 16
   - Validation: Return documentation

---

## Step 16: Resend Material (Purchase Executive)

### Test Cases:
1. **TC-052**: Request material resend
   - Input: Create resend request
   - Expected: Request sent, moves back to Step 12
   - Validation: Request handling

---

## Step 17: Generate GRN (Store Manager)

### Test Cases:
1. **TC-053**: Generate GRN for approved material
   - Input: Generate GRN
   - Expected: GRN generated successfully
   - Validation: GRN ID generation, PDF creation

2. **TC-054**: Download GRN PDF
   - Input: Download GRN document
   - Expected: PDF generated correctly
   - Validation: PDF formatting

3. **TC-055**: Complete GRN generation
   - Input: Complete step
   - Expected: Moves to Step 19
   - Validation: Status update

---

## Step 18: Final GRN (Store Manager)

### Test Cases:
1. **TC-056**: Complete final GRN documentation
   - Input: Finalize GRN
   - Expected: GRN finalized, moves to Step 19
   - Validation: Documentation completion

---

## Step 19: Submit Invoice to Accounts (Purchase Executive)

### Test Cases:
1. **TC-057**: Submit invoice
   - Input: Upload invoice document
   - Expected: Invoice submitted, moves to Step 20
   - Validation: File upload, document validation

2. **TC-058**: Handle missing invoice
   - Input: Try to submit without invoice
   - Expected: Error message, submission disabled
   - Validation: Invoice required

---

## Step 20: Schedule Payment (Accounts Executive)

### Test Cases:
1. **TC-059**: Schedule payment date
   - Input: Set payment schedule
   - Expected: Payment scheduled, moves to Step 21
   - Validation: Date validation, credit terms

2. **TC-060**: Handle payment scheduling errors
   - Input: Invalid date or missing data
   - Expected: Error message displayed
   - Validation: Date validation

---

## Step 21: Approve & Release Payment (Accounts Executive)

### Test Cases:
1. **TC-061**: Approve and release payment
   - Input: Approve payment
   - Expected: Payment released, flow complete
   - Validation: Final status update

2. **TC-062**: Complete purchase flow
   - Input: Final approval
   - Expected: Flow marked as complete
   - Validation: Completion status

---

## Common Test Cases (Applicable to All Steps)

### Error Handling:
1. **TC-063**: Network error handling
   - Input: Simulate network failure
   - Expected: Error message, graceful degradation
   - Validation: Error handling

2. **TC-064**: Null/undefined data handling
   - Input: Missing or null data
   - Expected: Graceful handling, no crashes
   - Validation: Null checks

3. **TC-065**: Empty array handling
   - Input: Empty arrays in data
   - Expected: Proper display, no errors
   - Validation: Array checks

4. **TC-066**: Invalid data format
   - Input: Malformed JSON or data
   - Expected: Error message, data not corrupted
   - Validation: Data format validation

### UI/UX:
1. **TC-067**: Loading states
   - Input: Async operations
   - Expected: Loading indicators displayed
   - Validation: Loading state management

2. **TC-068**: Success notifications
   - Input: Successful operations
   - Expected: Success messages displayed
   - Validation: Snackbar/notification system

3. **TC-069**: Form validation
   - Input: Invalid form data
   - Expected: Validation errors displayed
   - Validation: Form validation

4. **TC-070**: Responsive design
   - Input: Different screen sizes
   - Expected: UI adapts correctly
   - Validation: Responsive design

### Data Integrity:
1. **TC-071**: Data persistence
   - Input: Save operations
   - Expected: Data saved correctly
   - Validation: Database/Sheet updates

2. **TC-072**: Data retrieval
   - Input: Fetch operations
   - Expected: Correct data retrieved
   - Validation: Data fetching

3. **TC-073**: Concurrent updates
   - Input: Multiple users updating same data
   - Expected: No data corruption
   - Validation: Concurrency handling

---

## Bug Checklist

### Common Bugs to Check:
- [ ] Missing null/undefined checks
- [ ] Array operations without length checks
- [ ] Missing error handling in async functions
- [ ] Missing validation for required fields
- [ ] Incorrect step number assignments
- [ ] Missing loading states
- [ ] Missing error messages
- [ ] Duplicate step labels
- [ ] Incorrect NextStep values
- [ ] Missing role-based access checks
- [ ] File upload size/type validation
- [ ] Date validation issues
- [ ] Number validation issues
- [ ] JSON parsing errors
- [ ] Missing try-catch blocks

---

## Test Execution Priority

### High Priority (Critical Path):
- Steps 1, 2, 3, 10, 13, 17, 19, 20, 21

### Medium Priority:
- Steps 4, 5, 6, 7, 8, 9, 11, 12

### Low Priority:
- Steps 14, 15, 16, 18

---

## Notes
- All test cases should be executed in a test environment
- Test data should be cleaned up after each test run
- Document any bugs found during testing
- Update test cases as system evolves

