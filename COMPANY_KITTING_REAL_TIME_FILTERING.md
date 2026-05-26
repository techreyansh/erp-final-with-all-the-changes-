# Company Kitting Sheet - Real-Time Filtering Feature

## Overview
The Company Kitting Sheet now includes **real-time filtering** that automatically checks the "Company Material Issues" sheet when generating the Material Kitting List. This ensures that items already issued for a specific BOM are not shown again, preventing duplicate material issues.

## How It Works

### 1. When Generating Material Kitting List
When you click the **"Generate List"** button:

1. **Real-time Check**: The system fetches the latest data from the "Company Material Issues" sheet
2. **BOM ID Matching**: Checks if each material has been issued for the selected BOM ID
3. **Item Code Matching**: Matches materials by:
   - Direct item code
   - Stock item code
   - Stock item name
4. **Status Verification**: Only filters out items with status = "Issued"
5. **Smart Filtering**: Excludes already-issued items from the kitting list
6. **User Feedback**: Shows a notification indicating how many items were filtered out

### 2. When Issuing Material
When you click the **"Issue"** button for a material:

1. **Double-Check**: Performs a real-time check to ensure the item hasn't been issued by another user
2. **Stock Update**: Deducts the quantity from the Stock sheet
3. **Record Issue**: Creates a record in the "Company Material Issues" sheet with:
   - BOM ID
   - Item Code
   - Issued Quantity
   - Process (Cable or Moulding)
   - Issue Date & Time
   - Status: "Issued"
4. **Immediate Update**: Removes the item from the kitting list instantly
5. **Progress Tracking**: Updates the progress bar and remaining item count

## Visual Indicators

### Filtered Items Panel
When items are filtered out, a **warning panel** is displayed showing:
- Number of filtered items
- Item names and their processes
- BOM ID reference
- Explanation of why items were filtered

### Progress Bar
The progress bar shows:
- Percentage of materials issued for the BOM
- Green color when complete
- Updates in real-time as materials are issued

### Snackbar Notifications
- **Info**: When generating list with real-time checks
- **Success**: When items are issued successfully
- **Warning**: When items have already been issued
- **Error**: If any issues occur during the process

## Key Features

### ✅ Real-Time Data Sync
- Always fetches fresh data from Google Sheets
- No stale or cached data
- Ensures accuracy across multiple users

### ✅ Duplicate Prevention
- Prevents issuing the same material twice for the same BOM
- Automatically filters out already-issued items
- Double-checks before issuing to prevent race conditions

### ✅ Comprehensive Matching
- Matches by item code, item name, and stock references
- Handles different naming conventions
- Backward compatible with existing data

### ✅ Process Tracking
- Tracks whether material is for Cable or Moulding process
- Displays process information in the UI
- Helps organize materials by production stage

### ✅ User Feedback
- Clear notifications for all actions
- Visual indicators for filtered items
- Detailed console logs for debugging

## Data Flow

```
User Actions → Real-Time Check → Filtering → Display
     ↓              ↓                ↓           ↓
Generate List → Fetch Issues → Filter Items → Show List
Issue Material → Double-Check → Record Issue → Remove from List
```

## Google Sheets Integration

### Company Material Issues Sheet
**Columns:**
- `id`: Unique identifier
- `bomId`: BOM ID from Company BOM sheet
- `itemCode`: Item code or name
- `issuedQty`: Quantity issued
- `process`: "Cable" or "Moulding"
- `issueDate`: Date of issue
- `issueTime`: Time of issue
- `status`: "Issued"

**Purpose:**
- Central record of all material issues
- Used for real-time filtering
- Provides audit trail
- Enables progress tracking

### Company BOM Sheet
**Contains:**
- BOM ID
- Product description
- Cable materials (JSON)
- Moulding materials (JSON)
- Plan quantity
- Other BOM details

**Purpose:**
- Source of truth for material requirements
- Used to generate kitting lists

### Stock Sheet
**Contains:**
- Item code
- Item name
- Current stock
- Location
- Unit of measure

**Purpose:**
- Track available quantities
- Provide stock levels for kitting list
- Update after material issues

## Usage Instructions

### Step 1: Select BOM
1. Open Company Kitting Sheet
2. Click on "Select BOM" dropdown
3. Search or select your desired BOM
4. Enter the order quantity

### Step 2: Generate Kitting List
1. Click **"Generate List"** button
2. System performs real-time check against issued items
3. Filtered items panel appears if any items were excluded
4. Material Kitting List shows only available items

### Step 3: Issue Materials
1. Review the kitting list
2. Verify quantities and stock availability
3. Adjust issue quantity if needed
4. Click **"Issue"** button for each material
5. Material is recorded and removed from list instantly
6. Progress bar updates automatically

### Step 4: Track Progress
1. View progress bar to see completion percentage
2. Check filtered items panel to see what's been issued
3. Switch to "View Item Issues" tab to see full history
4. Use "Refresh Data" button to sync latest changes

## Best Practices

### ✅ Do's
- Always click "Generate List" to get the latest data
- Review the filtered items panel before proceeding
- Issue materials one at a time for better tracking
- Use "Refresh Data" if multiple users are working simultaneously
- Verify quantities before issuing

### ❌ Don'ts
- Don't issue materials without checking stock availability
- Don't manually edit the Company Material Issues sheet
- Don't rely on cached data - always regenerate the list
- Don't issue more quantity than available in stock

## Troubleshooting

### Issue: Items still showing after being issued
**Solution:** Click "Refresh Data" or "Regenerate List" to fetch the latest data

### Issue: Can't see filtered items panel
**Solution:** No items were filtered out. All materials are available for issue.

### Issue: Item shows as already issued but isn't in the sheet
**Solution:** Check the Company Material Issues sheet for the specific BOM ID and item code combination

### Issue: Duplicate entries in issues sheet
**Solution:** This shouldn't happen with real-time checking. Contact support if this occurs.

## Console Logs

The system provides detailed console logs for debugging:

```
[Real-time Check] Checking against X material issues for BOM Y, itemCode Z
[Real-time Check] ✓ Item already issued: BOM Y, Item Z
[Generate Kitting List] Processing X materials for BOM Y
[Generate Kitting List] ✓ Available for issue: Material Name
[Generate Kitting List] ✗ Excluded (already issued): Material Name
[Issue Material] Starting issue process for Material Name
[Issue Material] ✓ Material issued successfully: Material Name
```

## Technical Details

### Real-Time Check Function
```javascript
isItemAlreadyIssued(bomId, itemCode)
```
- Always fetches fresh data from Google Sheets
- Checks BOM ID, item code/name, and status
- Returns true if already issued, false otherwise

### Generate Kitting List Function
```javascript
generateKittingList()
```
- Parses cable and moulding materials from BOM
- Performs real-time check for each material
- Filters out already-issued items
- Displays filtered items panel
- Generates kitting list with available items only

### Issue Material Function
```javascript
handleIssueMaterial(item, index)
```
- Double-checks if item was issued by another user
- Updates stock sheet
- Records in Company Material Issues sheet
- Removes from kitting list immediately
- Updates progress tracking

## Benefits

1. **Accuracy**: Real-time data ensures accurate information
2. **Efficiency**: Automatic filtering saves time
3. **Prevention**: Stops duplicate material issues
4. **Transparency**: Clear visibility of what's been issued
5. **Collaboration**: Multiple users can work safely
6. **Audit Trail**: Complete record in issues sheet
7. **User-Friendly**: Clear visual indicators and feedback

## Support

For issues or questions about the real-time filtering feature:
1. Check console logs for detailed information
2. Verify data in Google Sheets manually
3. Use "Refresh Data" to sync latest changes
4. Contact technical support if problems persist

## Version History

### Version 1.0 (Current)
- Real-time filtering on list generation
- Duplicate prevention on material issue
- Visual filtered items panel
- Comprehensive logging
- Progress tracking
- Multi-user support

