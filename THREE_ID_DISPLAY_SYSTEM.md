# Three ID Display System - DispatchUniqueId, UniqueId, and SO ID

## Overview
The Flow Management UI now displays **three separate IDs** for complete traceability:
1. **DispatchUniqueId** - Unique identifier for each dispatch batch (green chip)
2. **UniqueId** - Unique identifier for the SO item (purple chip)
3. **SO ID** - Sales Order ID (green text)

## Table Columns Layout

### Updated Column Structure
```
| Dispatch ID | Unique ID | SO ID | Client | Product | Batch | Status | Due Date | Dispatch Date | Assigned To | Actions |
```

### Column Details

#### 1. **Dispatch ID** (Column 1)
- **Display**: Green chip with monospace font
- **Format**: `DISP-XXXXXXXX-XXX`
- **Example**: `DISP-12345678-042`
- **Color**: Green background (#e8f5e9), dark green text (#2e7d32)
- **Purpose**: Identify specific dispatch batch
- **Fallback**: Shows "N/A" if not available

#### 2. **Unique ID** (Column 2)
- **Display**: Purple chip with monospace font
- **Format**: `SO-XXXXXX-XXX`
- **Example**: `SO-624438-095`
- **Color**: Purple background (#f3e5f5), purple text (#7b1fa2)
- **Purpose**: Identify specific SO item

#### 3. **SO ID** (Column 3)
- **Display**: Green text chip with monospace font
- **Format**: `SO-XXXXX`
- **Example**: `SO-12345`
- **Color**: Green background (#e8f5e9), dark green text (#2e7d32)
- **Purpose**: Identify the sales order
- **Fallback**: Shows POId if SOId not available

#### 4-11. **Other Columns**
- Client, Product, Batch, Status, Due Date, Dispatch Date, Assigned To, Actions

## Visual Example

### Table Display
```
┌─────────────────┬───────────────┬──────────┬─────────┬───────────────┬──────────┬─────────┬──────────┬──────────────┬─────────────┬─────────┐
│ Dispatch ID     │ Unique ID     │ SO ID    │ Client  │ Product       │ Batch    │ Status  │ Due Date │ Dispatch Date│ Assigned To │ Actions │
├─────────────────┼───────────────┼──────────┼─────────┼───────────────┼──────────┼─────────┼──────────┼──────────────┼─────────────┼─────────┤
│ DISP-12345-042  │ SO-624438-095 │ SO-12345 │ C10044  │ INDUCTION 3 C │ Batch #1 │ STORE1  │ Oct 1    │ Oct 6        │ store.mgr   │   👁️    │
│ 🟢              │ 🟣            │ 🟢       │         │               │ 2000 pcs │         │          │              │             │         │
├─────────────────┼───────────────┼──────────┼─────────┼───────────────┼──────────┼─────────┼──────────┼──────────────┼─────────────┼─────────┤
│ DISP-12346-157  │ SO-624438-095 │ SO-12345 │ C10044  │ INDUCTION 3 C │ Batch #2 │ STORE1  │ Oct 2    │ Oct 7        │ store.mgr   │   👁️    │
│ 🟢              │ 🟣            │ 🟢       │         │               │ 2000 pcs │         │          │              │             │         │
└─────────────────┴───────────────┴──────────┴─────────┴───────────────┴──────────┴─────────┴──────────┴──────────────┴─────────────┴─────────┘
```

## Real Data Example

### For 2 Batches of Same SO:

**Batch 1:**
```
Dispatch ID:    DISP-12345678-042  (green chip)
Unique ID:      SO-624438-095      (purple chip)
SO ID:          SO-12345           (green text)
Client:         C10044
Product:        INDUCTION 3 C
Batch:          Batch #1
                2000 pcs
Status:         STORE1
Due Date:       Oct 1, 2025        (D-5 for Oct 6 dispatch)
Dispatch Date:  Oct 6, 2025        (final dispatch date)
Assigned To:    store.manager@...
```

**Batch 2:**
```
Dispatch ID:    DISP-87654321-915  (green chip) ← Different!
Unique ID:      SO-624438-095      (purple chip) ← Same SO item
SO ID:          SO-12345           (green text)  ← Same SO
Client:         C10044
Product:        INDUCTION 3 C
Batch:          Batch #2           ← Different batch
                2000 pcs
Status:         STORE1
Due Date:       Oct 2, 2025        (D-5 for Oct 7 dispatch)
Dispatch Date:  Oct 7, 2025        ← Different dispatch date!
Assigned To:    store.manager@...
```

## Key Differences

### Why Three IDs?

#### **DispatchUniqueId** (DISP-XXXXXXXX-XXX)
- **Unique per dispatch batch**
- **Different for each batch** even from the same SO
- **Purpose**: Track individual dispatch batches
- **Example**: Batch 1 and Batch 2 have different DispatchUniqueIds

#### **UniqueId** (SO-XXXXXX-XXX)
- **Unique per SO item**
- **Same for all batches** of the same SO item
- **Purpose**: Link back to the original sales order item
- **Example**: Both batches share `SO-624438-095`

#### **SO ID** (SO-XXXXX)
- **Unique per sales order**
- **Same for all items and batches** in that sales order
- **Purpose**: Group all items from the same sales order
- **Example**: All items share `SO-12345`

## Search Functionality

### Searchable Fields
The search box now searches across:
- ✅ DispatchUniqueId
- ✅ UniqueId
- ✅ SO ID
- ✅ Client Code
- ✅ Product Code
- ✅ Product Name

### Search Examples
- Search `DISP-123` → Finds all dispatches with that ID
- Search `SO-624438` → Finds all batches with that UniqueId
- Search `C10044` → Finds all batches for that client
- Search `INDUCTION` → Finds all batches with that product

## Color Coding

### Visual Identification
- **Green Chip** (DispatchUniqueId): `#e8f5e9` background, `#2e7d32` text
- **Purple Chip** (UniqueId): `#f3e5f5` background, `#7b1fa2` text
- **Green Text** (SO ID): `#e8f5e9` background, `#2e7d32` text

### Why Different Colors?
- **Quick visual distinction** between ID types
- **Easy to spot** which ID you're looking at
- **Professional appearance** with color hierarchy

## Batch Information Display

### New Batch Column
Instead of separate Qty and Batch Size columns, now shows:
```
Batch #1
2000 pcs
```

- **Line 1**: Batch number (orange/amber color)
- **Line 2**: Batch size in pieces (gray caption)
- **Compact**: Saves horizontal space
- **Clear**: Shows both pieces of information

## Benefits of Three IDs

### 1. **Complete Traceability**
- Track from dispatch back to SO
- See which batches belong to which order
- Understand batch relationships

### 2. **Unique Batch Identification**
- Each dispatch batch has unique ID
- No confusion between batches
- Easy to reference in communication

### 3. **Sales Order Grouping**
- See all batches from same SO
- Understand order fulfillment
- Track SO progress

### 4. **Item-Level Tracking**
- UniqueId links to original SO item
- See which SO line item the batch is for
- Maintain item-level history

## Example Scenario

### Scenario: SO with 2 items, each with 2 batches

**Sales Order: SO-12345**
- Item 1: UniqueId: SO-624438-095 (Product A)
  - Dispatch Batch 1: DISP-11111111-001 (Dispatch: Oct 6)
  - Dispatch Batch 2: DISP-11111112-002 (Dispatch: Oct 7)
- Item 2: UniqueId: SO-624438-096 (Product B)
  - Dispatch Batch 1: DISP-11111113-003 (Dispatch: Oct 8)
  - Dispatch Batch 2: DISP-11111114-004 (Dispatch: Oct 9)

**What You See in Store 1 Tab:**
```
Dispatch ID       | Unique ID     | SO ID     | Product   | Batch   | Due Date  | Dispatch Date
DISP-11111111-001 | SO-624438-095 | SO-12345  | Product A | Batch #1| Oct 1     | Oct 6
DISP-11111112-002 | SO-624438-095 | SO-12345  | Product A | Batch #2| Oct 2     | Oct 7
DISP-11111113-003 | SO-624438-096 | SO-12345  | Product B | Batch #1| Oct 3     | Oct 8
DISP-11111114-004 | SO-624438-096 | SO-12345  | Product B | Batch #2| Oct 4     | Oct 9
```

**Analysis:**
- **4 rows** = 4 separate dispatch batches (4 unique DispatchUniqueIds)
- **2 UniqueIds** = 2 SO items
- **1 SO ID** = All from same sales order
- **Each batch** has its own due date based on its dispatch date

## Implementation Summary

### Files Updated
- **`src/components/flowManagement/TaskList.js`**
  - Added 3 separate ID columns
  - Updated search to include DispatchUniqueId
  - Added Dispatch Date column
  - Consolidated Batch display

### Display Priority
1. **DispatchUniqueId** (if available) - Primary identifier for dispatch batches
2. **UniqueId** - SO item identifier
3. **SO ID** - Sales order identifier

All three are always visible when data is from Dispatches sheet!

---

**Last Updated**: September 30, 2025
**Version**: 1.0
**Status**: Active
