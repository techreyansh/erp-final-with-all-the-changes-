# FG Material Outward Entry Enhancement

## Overview
Enhanced the FG Material Outward entry system with product dropdown selection, automatic data fetching, and stock level updates that **subtract** from inventory when materials are issued out.

## Features Implemented

### 1. **Product Code Dropdown Selection**
- Added an enhanced Autocomplete dropdown that loads all products from the FG Stock sheet
- Users can now select product codes from a searchable dropdown
- The dropdown displays:
  - Product Code (primary)
  - Product Name
  - **Current Stock levels and Unit** (helps users verify availability before issuing)
  - Category information

### 2. **Auto-Fetch Product Details**
When a product code is selected from the dropdown, the following fields are automatically filled:
- **Product Name**: Auto-filled from FG Stock sheet
- **Unit**: Auto-filled from FG Stock sheet

These fields are disabled to prevent manual editing, ensuring data consistency.

### 3. **Quantity Field**
- Added **Quantity** field to specify how much stock is being issued out
- This was previously missing and is now integrated with the stock update functionality

### 4. **Stock Level Updates (SUBTRACTION)**
The system automatically **reduces** FG Stock levels when:
- Adding a new entry with Status = "Completed"
- Updating an existing entry and changing Status from "Pending" to "Completed"

**Stock Update Logic:**
```javascript
// When entry is marked as "Completed"
Current Stock (FG Stock) = Current Stock - Quantity (from outward entry)
```

### 5. **User Experience Improvements**
- **Information Alert**: Displays available products count and clear instructions about stock reduction
- **Warning Alert**: Shown when no products are available in FG Stock
- **Helper Text**: Indicates which fields are auto-filled
- **Visual Feedback**: Product dropdown shows current stock levels to help users make informed decisions
- **Stock Visibility**: Users can see available stock before issuing to prevent over-allocation
- **Disabled Fields**: Auto-filled fields are disabled to prevent data inconsistency

## How to Use

### Adding a New FG Material Outward Entry

1. **Click "Add New Outward Entry"** button
2. **Select Date** for the outward transaction
3. **Select Product Code** from the dropdown
   - The dropdown shows all products available in FG Stock
   - Each product displays its **current stock level** (important for checking availability)
4. **Auto-filled fields** (Product Name and Unit) will populate automatically
5. **Select Item Code** from Stock sheet (optional mapping)
6. **Enter Quantity** to be issued out
7. **Enter "Issued To"** (recipient name)
8. **Enter Department**
9. **Add Remarks** (optional)
10. **Select Status**:
    - **Pending**: Entry saved but stock **NOT** reduced
    - **Completed**: Entry saved AND stock levels **reduced** immediately
11. **Click "Add Entry"** to save

### Stock Update Behavior (SUBTRACTION)

#### When Status = "Completed"
- Stock is **reduced immediately** in FG Stock sheet
- Example:
  ```
  Product: XYZ-789
  Current Stock in FG Stock: 500 units
  Outward Quantity: 50 units
  New Stock after entry: 450 units ✅ (500 - 50)
  ```

#### When Status = "Pending"
- Entry is saved in FG Material Outward sheet
- Stock levels in FG Stock **remain unchanged**
- Stock will be reduced when status is changed to "Completed"

### Important: Stock Visibility
The dropdown shows **current stock levels** to help you verify:
- ✅ Sufficient stock available before issuing
- ⚠️ Avoid over-issuing beyond available stock
- 📊 Make informed decisions about issue quantities

### Editing Existing Entries

1. Click the **Edit** button on any entry
2. The Product Code field will be **disabled** to prevent changing the product
3. You can modify:
   - Date
   - Item Code
   - Quantity
   - Issued To
   - Department
   - Status
   - Remarks
4. **Important**: Changing status from "Pending" to "Completed" will reduce stock levels

## Technical Implementation

### Files Modified
- ✅ `src/components/Inventory/FGMaterialOutward.js`

### Key Changes

1. **Enhanced Product Code Autocomplete**
   ```javascript
   // Now shows current stock levels in dropdown
   renderOption={(props, option) => (
     <Box component="li" {...props} key={option["Product Code"]}>
       <Typography variant="body1">{option["Product Code"]}</Typography>
       <Typography variant="body2">{option["Product Name"]}</Typography>
       <Typography variant="caption">
         Stock: {option["Current Stock"]} {option["Unit"]} | Category: {option["Category"]}
       </Typography>
     </Box>
   )}
   ```

2. **Added Quantity Field**
   ```javascript
   // Form now includes Quantity field
   const [formData, setFormData] = useState({
     ...
     Quantity: "",
     ...
   });
   ```

3. **Stock Update Function** (Existing - Subtracts Stock)
   ```javascript
   const updateFGStockLevels = async (productCode, quantity) => {
     // Fetches FG Stock data
     // Finds matching product
     // Updates current stock: currentStock - quantity (SUBTRACTION)
     updatedStock["Current Stock"] = (currentStock - qty).toString();
     // Saves updated stock to Google Sheets
   };
   ```

### Data Flow

```
User Selects Product Code
         ↓
Auto-fetch from FG Stock Sheet
         ↓
Fill Product Name & Unit
Display Current Stock Level
         ↓
User Enters Quantity & Recipient Details
         ↓
User Selects Status = "Completed"
         ↓
Save Entry to FG Material Outward Sheet
         ↓
Update FG Stock Sheet (Current Stock -= Quantity) ⬇️
```

## Key Differences from Inward

| Feature | FG Material Inward | FG Material Outward |
|---------|-------------------|---------------------|
| Stock Operation | **Addition (+)** | **Subtraction (-)** |
| Use Case | Receiving goods | Issuing goods |
| Additional Fields | Supplier, Invoice No | Issued To, Department, Item Code |
| Icon | Green (⬆️) | Red (⬇️) |
| Color Theme | Green (#4caf50) | Red (#d32f2f) |
| Stock Impact | Increases inventory | Decreases inventory |

## Benefits

1. **Accurate Inventory**: Stock levels automatically decrease when goods are issued
2. **Stock Visibility**: See available stock before issuing to prevent shortages
3. **Data Accuracy**: Auto-fill prevents manual entry errors
4. **Efficiency**: Faster data entry with dropdown selection and auto-fill
5. **Consistency**: Ensures product codes, names, and units match exactly with FG Stock
6. **Real-time Updates**: Stock levels update immediately when entries are completed
7. **Audit Trail**: All outward entries tracked with date, recipient, department, and remarks
8. **Informed Decisions**: Current stock display helps plan issue quantities

## Validation

### Required Fields
- Date *
- Product Code *
- Product Name * (auto-filled)
- Item Code *
- Item Name * (auto-filled)
- Quantity *
- Unit * (auto-filled)
- Issued To *
- Department *
- Status *
- Remarks (optional)

### Error Handling
- Shows error if required fields are missing
- Displays warning if no products are available in FG Stock
- Provides helpful messages for troubleshooting
- Stock update failures are caught and reported to user

## Usage Scenarios

### Scenario 1: Production Department Needs Materials
```
1. Select Product: PCB-001
   Current Stock: 1000 units
2. Enter Quantity: 100
3. Issued To: Production Team
4. Department: Manufacturing
5. Status: Completed
Result: Stock reduced to 900 units
```

### Scenario 2: Pending Issue (Future Allocation)
```
1. Select Product: CABLE-A
   Current Stock: 500 units
2. Enter Quantity: 75
3. Issued To: Assembly Line
4. Department: Assembly
5. Status: Pending
Result: Entry saved, stock remains at 500 units
       (Stock will be reduced when status changes to "Completed")
```

### Scenario 3: Multiple Department Issues
```
Morning:
- Issue 50 units to Production → Stock: 1000 - 50 = 950
Afternoon:
- Issue 30 units to QC Dept → Stock: 950 - 30 = 920
Evening:
- Issue 20 units to R&D → Stock: 920 - 20 = 900
Total issued: 100 units
Final stock: 900 units
```

## Important Notes

- Stock update feature only works when status is set to "Completed"
- Editing an entry after it's completed won't re-update stock levels (prevents double-counting)
- Product Code cannot be changed when editing an entry
- All products must exist in FG Stock sheet before they can be issued
- **Check current stock levels in dropdown before issuing to avoid negative stock**

## Future Enhancements (Potential)

1. Add low stock warnings when issue quantity approaches available stock
2. Add stock reservation system for pending issues
3. Add return/rejection handling for issued materials
4. Add multi-location stock tracking
5. Add barcode scanning for product and recipient verification
6. Add approval workflow for large quantity issues
7. Add printing functionality for issue slips/gate passes
8. Add bulk issue capability for multiple products at once

## Testing Checklist

- [x] Product dropdown loads all FG Stock items with current stock levels
- [x] Product Name auto-fills when product is selected
- [x] Unit auto-fills when product is selected
- [x] Quantity field is visible and editable
- [x] Stock reduces (subtracts) when new entry is added with Status="Completed"
- [x] Stock reduces when existing entry status changes from "Pending" to "Completed"
- [x] Stock does NOT reduce when Status="Pending"
- [x] Product Code is disabled when editing
- [x] Current stock levels displayed in dropdown
- [x] Form validation works correctly
- [x] Error messages display appropriately
- [x] No linting errors

## Support

For issues or questions, verify:
1. FG Stock sheet has products with valid Product Code, Product Name, Unit, and Current Stock
2. Product Code in FG Stock is unique
3. Current Stock field in FG Stock is numeric and sufficient for the issue quantity
4. Status field is properly set to "Completed" for stock updates
5. Quantity entered is not greater than available stock (check dropdown)

## Stock Level Formula

```javascript
// INWARD (Addition)
New Stock = Current Stock + Inward Quantity

// OUTWARD (Subtraction) ✅
New Stock = Current Stock - Outward Quantity

Example:
Initial Stock: 1000 units
Inward: +200 units → Stock: 1200 units
Outward: -150 units → Stock: 1050 units
Net Change: +50 units
```

