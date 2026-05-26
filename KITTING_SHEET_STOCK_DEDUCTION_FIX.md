# Kitting Sheet Stock Deduction Fix

## Problem Description

When generating a kitting list and issuing items from the Kitting Sheet, the system was:
- ✅ Recording the issue in localStorage
- ✅ Removing the item from the kitting list display
- ✅ Tracking issued items per product/BOM
- ❌ **NOT subtracting the quantity from the Stock sheet**

This meant that stock levels remained unchanged even after materials were issued, causing inventory discrepancies.

## Root Cause

The `handleIssueMaterial` function in both Kitting Sheet components was only:
1. Recording the issue to localStorage
2. Optionally logging to a "Material Issues" sheet
3. Removing the item from the display

It was missing the critical step of updating the Stock sheet to reflect the reduced inventory.

## Solution Implemented

### Files Modified:
1. `src/components/KittingSheet/KittingSheet.js`
2. `src/components/KittingSheet/CompanyKittingSheet.js`

### Changes Made:

#### 1. Updated `handleIssueMaterial` Function
Added stock deduction logic before recording the issue:

```javascript
// First, deduct from Stock Sheet
const stockIndex = stockData.findIndex((s) => s.itemCode === item.itemCode);
if (stockIndex === -1) {
  // Show error if stock item not found
  return;
}

const updatedStockItem = { ...stockData[stockIndex] };
const currentStock = parseFloat(updatedStockItem.currentStock) || 0;
const newStock = currentStock - issueQty;

updatedStockItem.currentStock = newStock.toString();
updatedStockItem.lastUpdated = new Date().toISOString().split("T")[0];

// Update Stock sheet via API
await sheetService.updateRow("Stock", stockIndex + 2, updatedStockItem);

// Update local stock data for immediate UI refresh
const updatedStockData = [...stockData];
updatedStockData[stockIndex] = updatedStockItem;
setStockData(updatedStockData);

// Then record the material issue
await recordMaterialIssue(...);
```

#### 2. Updated Booking Conversion Function
Also added stock deduction when converting bookings to issues:

```javascript
const convertBookingToIssue = async (booking) => {
  // Deduct from Stock Sheet first
  const stockIndex = stockData.findIndex((s) => s.itemCode === booking.itemCode);
  // ... update stock ...
  await sheetService.updateRow("Stock", stockIndex + 2, updatedStockItem);
  
  // Then record the issue and update booking status
  await recordMaterialIssue(...);
  updateBookingStatus(booking.id, "Converted");
};
```

## How It Works Now

### Material Issue Flow:
1. User selects a product and generates kitting list
2. User clicks "Issue" button for a material
3. System validates available stock
4. **System deducts quantity from Stock sheet** ✅ NEW
5. System updates the Stock sheet's `lastUpdated` field ✅ NEW
6. System updates local stock data for UI refresh ✅ NEW
7. System records the issue in localStorage (for tracking)
8. System removes item from kitting list display
9. User sees success message with before/after stock levels ✅ NEW

### Booking Conversion Flow:
1. User books materials for an order (reserves without physical issue)
2. When ready, user clicks "Issue" button on booking
3. **System deducts quantity from Stock sheet** ✅ NEW
4. System records the issue
5. System marks booking as "Converted"
6. Stock levels are updated immediately ✅ NEW

## Benefits

1. **Accurate Inventory**: Stock levels now reflect actual material consumption
2. **Real-time Updates**: Local state is updated immediately for instant UI feedback
3. **Audit Trail**: Both stock updates and issue records are maintained
4. **Transparency**: Success messages show before/after stock levels
5. **Data Integrity**: Stock sheet remains the single source of truth

## Testing Recommendations

1. **Issue Material from Kitting List**:
   - Generate kitting list for a product
   - Note the current stock level
   - Issue a material
   - Verify stock is reduced in Stock sheet
   - Verify success message shows correct before/after values

2. **Book and Convert Order**:
   - Book materials for an order
   - Verify "Available" quantity reduces (booking reserves stock)
   - Convert booking to issue
   - Verify stock is deducted from Stock sheet

3. **Error Handling**:
   - Try to issue more than available stock (should be blocked)
   - Try to issue with 0 stock (should be blocked)
   - Verify appropriate error messages are shown

4. **Stock Refresh**:
   - After issuing, click "Refresh BOM Data" button
   - Verify stock levels are correctly loaded
   - Verify already-issued items don't reappear in kitting list

## Important Notes

- The fix maintains backward compatibility with existing issued items in localStorage
- Stock updates use the existing `sheetService.updateRow()` API
- Row index calculation: `stockIndex + 2` (accounts for array index + header row + 1-based indexing)
- The `lastUpdated` field is automatically set to current date
- Both regular kitting and company BOM kitting now work correctly

## Future Enhancements

Consider adding:
1. Stock update transaction log for audit purposes
2. Undo functionality for accidental issues
3. Batch issue capability for multiple items
4. Stock level warnings before issuing
5. Integration with Material Issues sheet for historical tracking

