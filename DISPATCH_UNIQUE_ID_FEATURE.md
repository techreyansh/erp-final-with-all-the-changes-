# Dispatch Unique ID Generation

## Overview
When scheduling a dispatch, the system now automatically generates a unique **DispatchUniqueId** for tracking purposes. This ID is stored in the Dispatches sheet and can be used to identify and track each dispatch uniquely.

## DispatchUniqueId Format

### Pattern
```
DISP-{timestamp}-{random}
```

### Components
- **Prefix**: `DISP-` (identifies this as a dispatch ID)
- **Timestamp**: Last 8 digits of current timestamp (e.g., `12345678`)
- **Random**: 3-digit random number (e.g., `042`)

### Examples
- `DISP-12345678-042`
- `DISP-87654321-915`
- `DISP-45678901-234`

## When It's Generated

The DispatchUniqueId is generated when:
1. A NEW Sales Order is advanced to production
2. User selects dispatch date in the Dispatch Date Dialog
3. User clicks "Confirm & Start Production"
4. System creates the dispatch record in Dispatches sheet

**Important**: One DispatchUniqueId is created per dispatch scheduling action.

## Where It's Stored

### Dispatches Sheet
The DispatchUniqueId is stored in column A of the Dispatches sheet:

| Column | Field | Example |
|--------|-------|---------|
| A | DispatchUniqueId | DISP-12345678-042 |
| B | UniqueId | SO-624438-095 |
| C | ClientCode | C10044 |
| D | ProductCode | INDUCTION 3 C |
| E | ProductName | INDUCTION 3 C |
| F | BatchNumber | 1 |
| G | BatchSize | 2000 |
| H | DispatchDate | 06/10/2025 |
| I | CreatedAt | 2025-09-30T10:15:00Z |
| J | Dispatched | No |

## Usage in the System

### 1. Flow Management Tabs
When viewing dispatches in any production stage tab, the DispatchUniqueId is available in the task data:

```javascript
{
  DispatchUniqueId: "DISP-12345678-042",
  UniqueId: "SO-624438-095",
  ClientCode: "C10044",
  DispatchDate: "06/10/2025",
  DueDate: "01/10/2025", // Calculated based on stage
  // ... other fields
}
```

### 2. Tracking Dispatches
The DispatchUniqueId can be used to:
- Track a specific dispatch across all stages
- Link dispatch records to other systems
- Generate dispatch reports
- Filter and search for specific dispatches

## Implementation Details

### Generation Function
```javascript
const generateDispatchUniqueId = () => {
  const timestamp = Date.now().toString().slice(-8); // Last 8 digits
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 3 digits
  return `DISP-${timestamp}-${randomNum}`;
};
```

### Creation Process
1. When `scheduleDispatchAndStartProduction()` is called:
   ```javascript
   const dispatchUniqueId = generateDispatchUniqueId();
   // e.g., "DISP-12345678-042"
   ```

2. Dispatch record is created in Dispatches sheet:
   ```javascript
   await sheetService.appendRow('Dispatches', {
     DispatchUniqueId: dispatchUniqueId,
     UniqueId: po.UniqueId,
     ClientCode: po.ClientCode,
     // ... other fields
   });
   ```

3. Success message logged:
   ```
   Dispatch record created with DispatchUniqueId: DISP-12345678-042
   ```

## Benefits

### 1. **Unique Identification**
- Each dispatch has a unique identifier
- No conflicts between dispatches
- Easy to track specific dispatches

### 2. **Traceability**
- Link dispatches across different systems
- Track dispatch history
- Audit trail for dispatches

### 3. **Reporting**
- Generate dispatch reports by DispatchUniqueId
- Filter dispatches easily
- Track dispatch status

### 4. **Integration**
- Use DispatchUniqueId in external systems
- API integration reference
- Barcode/QR code generation

## Example Workflow

### Step 1: Create Sales Order
```
Sales Order: SO-624438-095
Client: C10044
Product: INDUCTION 3 C
```

### Step 2: Schedule Dispatch
```
User clicks "Advance Task"
Selects Dispatch Date: 06/10/2025
Clicks "Confirm & Start Production"
```

### Step 3: System Generates ID
```
DispatchUniqueId generated: DISP-87654321-456
```

### Step 4: Record Created in Dispatches Sheet
```
DispatchUniqueId: DISP-87654321-456
UniqueId: SO-624438-095
ClientCode: C10044
ProductCode: INDUCTION 3 C
DispatchDate: 06/10/2025
Dispatched: No
```

### Step 5: Available in All Tabs
```
Store 1 Tab:
  - DispatchUniqueId: DISP-87654321-456
  - Due Date: 01/10/2025 (D-5)
  
Cable Prod Tab:
  - DispatchUniqueId: DISP-87654321-456
  - Due Date: 02/10/2025 (D-4)
  
... and so on for all stages
```

## Future Enhancements

### Possible Improvements
1. **QR Code Generation**: Generate QR codes from DispatchUniqueId
2. **Barcode Labels**: Print dispatch labels with DispatchUniqueId
3. **Tracking System**: Track dispatch status using DispatchUniqueId
4. **SMS/Email Notifications**: Send updates with DispatchUniqueId
5. **Customer Portal**: Allow customers to track using DispatchUniqueId
6. **Analytics**: Dispatch performance metrics by DispatchUniqueId

## Console Logging

When a dispatch is created, you'll see in the console:
```
Dispatch record created with DispatchUniqueId: DISP-12345678-042
```

This confirms the DispatchUniqueId was generated and stored successfully.

---

**Last Updated**: September 30, 2025
**Version**: 1.0
**Status**: Active
