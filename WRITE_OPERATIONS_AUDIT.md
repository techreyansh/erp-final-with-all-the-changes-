# WRITE OPERATIONS AUDIT & FIX GUIDE

## Executive Summary

**Status**: WRITE operations failing silently across entire ERP
- ✅ READ operations: Working (data loads correctly)
- ❌ WRITE operations: Not persisting to database
- 🔍 Root Causes Identified: RLS policies + Silent error handling + Payload format

---

## 1. WRITE OPERATION INVENTORY (59 DB Calls Found)

### 1.1 Core db.js WRITE Functions (Lines 394-650)
```javascript
✓ insertTableRow()    - INSERT with record/sort_order wrapping, fallback
✓ updateTableRowById() - UPDATE with record wrapping, fallback
✓ deleteTableRowById() - DELETE with fallback retry
```

### 1.2 Direct Supabase I/O Calls (Potentially Bypassing db.js)

**CRM/PPC Module** (`src/services/crmPpcBackendService.js`):
- Line 95: `.upsert(payload)` - CRM leads
- Line 103: `.delete().eq("text", id)` - Delete lead (TWO calls)
- Line 131: `.upsert(payload).select("*")` - CRM customers
- Line 159: `.upsert(payload)` - Production plans

**Product Service** (`src/services/productService.js`):
- Line 94: `.eq('id', id)` - SELECT (read, not write)
- Line 149: `.insert(payload)` - CREATE product
- Line 203-204: `.update(payload).eq('id', id)` - UPDATE product
- Line 233-237: `.update({...}).eq('id', id)` - Publish product

**Purchase Order Service** (`src/services/purchaseOrderService.js`):
- Line 46: `.eq('id', id)` - SELECT by id
- Line 81: `.insert({...})` - CREATE PO
- Line 124-128: `.update({...}).eq('id', id)` - UPDATE PO
- Line 159-163: `.update({...}).eq('id', id)` - Update PO detail

**Admin Access Service** (`src/services/adminAccessService.js`):
- Line 23: `.insert({ email: normalized })` - ADD admin
- Line 29: `.delete().eq('id', id)` - REMOVE admin (TWO calls)
- Line 34: `rpc('is_super_admin')` - Check permissions

**Task Compliance** (`src/services/taskComplianceService.js`):
- Line 15: `rpc('generate_task_instances_for_date', payload)` - Generate tasks
- Line 49: `rpc('submit_task_instance', {...})` - Submit task
- Line 59: `rpc('approve_task_instance', {...})` - Approve task
- Line 67: `rpc('reject_task_instance', {...})` - Reject task

**Inventory Service** (`src/services/inventoryService.js`):
- Line 140: `rpc(RPC_UPDATE_INVENTORY, {...})` - RPC inventory update

---

## 2. ROOT CAUSE ANALYSIS

### Root Cause #1: RLS (Row Level Security) Blocking WRITES
**Problem**: Supabase RLS policies likely require additional conditions for INSERT/UPDATE/DELETE
**Evidence**: 
- SELECT works ✅ (maybe RLS allows public read)
- INSERT/UPDATE/DELETE fail ❌ (RLS policies not configured)
**Impact**: All direct Supabase writes fail silently

### Root Cause #2: Payload Format Mismatch
**Problem**: Two schema types in use:
- **jsonb wrapped** (new): `{ record: {...}, sort_order: N }`
- **direct columns** (legacy): `{ col1: val1, col2: val2 }`

**Evidence**: 
- `updateTableRowById()` sends `{ record: row }`
- But table may have direct columns, not `record` field
**Impact**: UPDATE requests fail silently when schema mismatch

### Root Cause #3: No Error Logging
**Problem**: Errors thrown in services aren't logged to console
```javascript
// Current: Silent failure
const { error } = await supabase.from(name).insert(payload);
if (error) throw error; // Caught but not logged!
```

**Impact**: Silent failures, developers can't debug

### Root Cause #4: Service Layer Errors Uncaught
**Problem**: Errors in `addClient()`, `updateClient()`, etc. are caught but not logged
```javascript
try {
  await db.insertTableRow(...)
} catch(err) {
  // No logging here!
}
```

---

## 3. CRITICAL SERVICES WITH WRITE OPERATIONS

### Service Files Confirmed Using WRITE Ops:
1. **clientService.js** - Lines 152-223 (addClient, updateClient, deleteClient)
2. **vendorService.js** - Similar pattern (add, update, delete)
3. **crmPpcBackendService.js** - upsertLead, deleteLead, upsertCustomer
4. **productService.js** - addProduct, updateProduct, publishProduct
5. **purchaseOrderService.js** - All PO CRUD ops
6. **adminAccessService.js** - Add/remove admin access
7. **taskComplianceService.js** - Task management

### Component-Level WRITE Handlers (200+ found):
- handleSubmit() - Form submissions
- handleSave() - Save buttons
- handleDelete() - Delete buttons
- handleUpdate() - Update operations
- onSaveRow() - DataGrid row saves
- onDeleteRow() - DataGrid row deletes

---

## 4. DIAGNOSTIC COMMANDS

### Check Browser Console for Errors:
```javascript
// Add in browser console:
localStorage.debug = 'supabase:*'
// Then perform a delete/create/update operation
// Watch for error messages
```

### Check for RLS Policy Violations:
```
GET http://localhost:3000
Network tab → Find any 4xx/5xx responses
Look for error messages about RLS or policies
```

### Test Direct DB Insert:
```sql
-- In Supabase SQL editor:
SELECT * FROM public.clients2 LIMIT 5; -- Should work
INSERT INTO public.clients2(record) VALUES ('{"name":"test"}'); -- Check if this works
```

---

## 5. FIX STRATEGY (In Order)

### ✅ STEP 1: Add Error Logging to db.js (IMMEDIATE)
Make all errors visible in console

### ✅ STEP 2: Add Error Logging to Service Layer (IMMEDIATE)
Catch and log service-level errors

### ⚠️ STEP 3: Fix RLS Policies in Supabase (REQUIRED)
Enable INSERT/UPDATE/DELETE for authenticated users

### ✅ STEP 4: Verify Payload Format Compliance (CHECK)
Ensure payloads match table schemas

### ✅ STEP 5: Add Silent Failure Detection (OPTIONAL)
Auto-detect failed writes and suggest fixes

---

## 6. FILES TO MODIFY

**Priority 1 (Immediate - Make Errors Visible)**:
- [ ] db.js - Add console.error/warn for all failures
- [ ] clientService.js - Log catch blocks
- [ ] vendorService.js - Log catch blocks
- [ ] Same for all 7 main services

**Priority 2 (Fix RLS)**:
- [ ] Supabase RLS policies (not in code repo)
- [ ] May need permission settings in Supabase dashboard

**Priority 3 (Verify)**:
- [ ] Test each CRUD operation
- [ ] Check browser console for errors
- [ ] Verify data persists in DB

---

## 7. KNOWN ISSUES & WORKAROUNDS

| Issue | Symptom | Workaround |
|-------|---------|-----------|
| RLS block | Insert/update/delete returns null/empty | Check Supabase RLS policies |
| jsonb schema | Update fails with column mismatch | Verify table has `record` column |
| Silent errors | Operation appears successful but fails | Add error logging (Step 1) |
| Auth required | RLS blocks unauthenticated writes | Ensure user is logged in |

---

## 8. LOCATION REFERENCE

### Files with WRITE Operations:
```
CRUD Layer:
  src/lib/db.js (core CRUD, 394-650+)

Service Layer (Business Logic):
  src/services/adminAccessService.js
  src/services/crmPpcBackendService.js
  src/services/inventoryService.js
  src/services/productService.js
  src/services/purchaseOrderService.js
  src/services/taskComplianceService.js
  src/services/clientService.js
  src/services/vendorService.js

Component Layer (UI Handlers):
  src/components/product/ProductManagement.js (handleDelete, handleSubmit)
  src/components/product/ProductForm.js (handleSubmit/create)
  src/components/StockManagement/StockManagement.js (handleUpdate, handleDelete)
  src/components/purchaseFlow/steps/VendorManagement.js (handleSave, handleDelete)
  src/components/poIngestion/POForm.js (handleSubmit, handleDelete)
  +100+ more component handlers
```

---

## 9. NEXT ACTIONS

**IMMEDIATE** (Happening Now):
1. [x] Audit all WRITE operations
2. [ ] Add error logging to db.js
3. [ ] Add error logging to service layer
4. [ ] Test in browser and capture errors

**BLOCKING** (Requires Supabase Access):
- Review RLS policies for all ERP tables
- Check if `auth.uid()` is being used correctly
- Verify policy grants INSERT/UPDATE/DELETE permissions

**VALIDATION** (Quality Check):
- Test CREATE client → verify in DB
- Test UPDATE client → verify in DB
- Test DELETE client → verify in DB
- Same for vendors, products, inventory

