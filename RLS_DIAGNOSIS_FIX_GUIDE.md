# Supabase RLS PERMISSION DIAGNOSTIC & FIX GUIDE

## CRITICAL: RLS (Row Level Security) is Likely Blocking ALL WRITE Operations

---

## 🔴 THE PROBLEM

**Symptoms**:
- ✅ SELECT/READ operations work (data loads)
- ❌ INSERT/UPDATE/DELETE fail silently
- Browser console shows error: `"RLS policy ... permission denied"` or `"PGRST301"`

**Root Cause**:
Supabase RLS policies are configured to allow public READ but NOT authenticated WRITE

---

## 🔍 HOW TO DIAGNOSE RLS ISSUES

### Step 1: Check Browser Console (NOW)

1. Open app on localhost:3000
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Try to **Delete a client/vendor** (or Create/Update)
5. Look for errors like:
   - `"policy ... denied"` - RLS blocking
   - `"PGRST301"` - Access denied
   - `"permission denied"` - Auth issue
   - `"column ... does not exist"` - Schema mismatch

**Example errors you might see**:
```
[DB DELETE] ❌ RLS PERMISSION DENIED for table clients2. 
User may not have DELETE permission. Error: new row violates row level security policy "..." on table "clients2"
```

### Step 2: Check Supabase Dashboard (RLS Policies)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Left sidebar → **Authentication** → **Policies**
4. Look for each table: `clients2`, `vendors_data`, `inventory`, etc.

**What you should see**:
- Policies for each table
- Enable/Disable toggle to check if they're active
- Click each policy to view details

**Current Policy Status** (Unknown - CHECK NOW):
- [ ] clients2 - ? (need to verify)
- [ ] vendors_data - ? (need to verify)
- [ ] inventory - ? (need to verify)
- [ ] stock_data - ? (need to verify)
- [ ] material_inward_data - ? (need to verify)
- [ ] All ERP tables - ? (need to verify)

---

## 🛠️ HOW TO FIX RLS POLICIES

### Fix #1: Disable RLS for Development (Quick - NOT PRODUCTION SAFE)

**⚠️ WARNING: This makes data PUBLIC. Only for development!**

1. Go to Supabase Dashboard
2. For EACH ERP table:
   - Click table name
   - Click **Policies** tab
   - Find any RLS policies
   - Toggle **OFF** to disable (while developing)
3. Test WRITE operations again

**After Testing**: 
- **DO NOT KEEP RLS DISABLED** in production
- Must re-enable with proper policies

### Fix #2: Enable RLS with Proper Auth (Recommended)

If RLS is disabled, you need to:
1. Enable RLS
2. Create policies that allow authenticated users to INSERT/UPDATE/DELETE

**Enabled Policies Needed**:

For each table (clients2, vendors_data, etc.):

```sql
-- SELECT - Allow public read
CREATE POLICY "Allow public read"
  ON clients2
  FOR SELECT
  USING (true);

-- INSERT - Allow authenticated users
CREATE POLICY "Allow authenticated insert"
  ON clients2
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE - Allow owner to update
CREATE POLICY "Allow user update"
  ON clients2
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- DELETE - Allow authenticated delete
CREATE POLICY "Allow authenticated delete"
  ON clients2
  FOR DELETE
  USING (auth.role() = 'authenticated');
```

**To Apply These Policies**:
1. Go to Supabase Dashboard
2. Left sidebar → **SQL Editor**
3. Click **New Query**
4. Copy & modify SQL above for each table
5. Replace `clients2` with table name
6. Click **Run**

---

## 🧪 TEST EACH OPERATION AFTER FIX

### Test Sequence:

```javascript
// 1. READ (should already work)
console.log("1. Testing READ...");
// Navigate to Clients page - should show list

// 2. CREATE (test INSERT)  
console.log("2. Testing CREATE...");
// Click "Add Client", fill form, click Save
// Check browser console for [DB INSERT] messages
// Check Supabase Dashboard → clients2 table for new row

// 3. UPDATE (test UPDATE)
console.log("3. Testing UPDATE...");
// Edit a client, change field, click Save
// Check browser console for [DB UPDATE] messages
// Verify change in clients2 table

// 4. DELETE (test DELETE)
console.log("4. Testing DELETE...");
// Click Delete on a client
// Check browser console for [DB DELETE] messages
// Verify row removed from clients2 table
```

---

## 📋 CHECKLIST: RLS Policy Audit

### Tables to Check/Fix (ALL ERP Tables):

**Core ERP Tables**:
- [ ] clients2 - RLS status: ?, Need policies: ?, Fixed: ?
- [ ] vendors_data - RLS status: ?, Need policies: ?, Fixed: ?
- [ ] products - RLS status: ?, Need policies: ?, Fixed: ?
- [ ] inventory - RLS status: ?, Need policies: ?, Fixed: ?
- [ ] stock_data - RLS status: ?, Need policies: ?, Fixed: ?

**Material Flow**:
- [ ] material_inward_data - RLS status: ?, Need policies: ?, Fixed: ?
- [ ] material_issue_data - RLS status: ?, Need policies: ?, Fixed: ?
- [ ] company_material_issue_data - RLS status: ?, Need policies: ?, Fixed: ?
- [ ] finished_goods - RLS status: ?, Need policies: ?, Fixed: ?

**Sales & Purchase**:
- [ ] purchase_flow_data - RLS status: ?, Need policies: ?, Fixed: ?
- [ ] purchase_flow_steps_data - RLS status: ?, Need policies: ?, Fixed: ?
- [ ] client_orders_data - RLS status: ?, Need policies: ?, Fixed: ?
- [ ] dispatches - RLS status: ?, Need policies: ?, Fixed: ?

**CRM & Admin**:
- [ ] crm_leads - RLS status: ?, Need policies: ?, Fixed: ?
- [ ] customers - RLS status: ?, Need policies: ?, Fixed: ?
- [ ] allowed_admins - RLS status: ?, Need policies: ?, Fixed: ?
- [ ] users - RLS status: ?, Need policies: ?, Fixed: ?

---

## 🔗 RELATED ERROR CODES

| Code | Meaning | Solution |
|------|---------|----------|
| PGRST301 | Access denied | Check RLS policies |
| 42703 | Column doesn't exist | Schema mismatch - check table columns |
| 42P01 | Table doesn't exist | Table name wrong - check TABLE_NAMES in db.js |
| 23505 | Duplicate key | Unique constraint violation |
| 22P02 | Invalid format | Data type mismatch |

---

## 📍 CURRENT STATUS TRACKING

### ERROR LOGGING ENHANCEMENTS (✅ DONE):
- [x] db.js insertTableRow() - Added comprehensive logging
- [x] db.js updateTableRowById() - Added comprehensive logging  
- [x] db.js deleteTableRowById() - Added comprehensive logging
- [x] clientService.js addClient() - Added try/catch with logging
- [x] clientService.js updateClient() - Added try/catch with logging
- [x] clientService.js deleteClient() - Added try/catch with logging

### NEXT STEPS (⏳ PENDING):
- [ ] Run app and test DELETE/CREATE/UPDATE
- [ ] Capture error messages from console
- [ ] Identify specific RLS policy issues
- [ ] Fix RLS policies in Supabase
- [ ] Re-test all CRUD operations
- [ ] Verify data persists in database
- [ ] Apply same fix to all other service files

---

## 📞 DEBUGGING COMMANDS

### In Browser Console:

```javascript
// Enable detailed logging
localStorage.debug = 'supabase:*'

// Try a CREATE operation
await fetch('...', { method: 'POST', ... })

// Check network requests
// Network tab → Look for fetch calls to Supabase
// Check response → Should show error details
```

---

## 🚀 AFTER RLS FIX

1. **Verify All WRITE Operations Work**:
   - Test CREATE client
   - Test UPDATE client
   - Test DELETE client
   - Same for vendors, products, inventory, etc.

2. **Apply Same Service-Level Logging** to:
   - vendorService.js
   - productService.js
   - purchaseOrderService.js
   - crmPpcBackendService.js
   - All other services with WRITE ops

3. **Full System Test**:
   - Complete client workflow (add, edit, delete)
   - Complete vendor workflow
   - Complete product workflow
   - All ERP modules

4. **Production RLS Setup**:
   - Implement proper auth-based RLS policies
   - Test with multiple user roles
   - Document permission matrix

---

## 🆘 STILL NOT WORKING?

If WRITE operations still fail after fixing RLS:

1. **Check Auth State**:
   ```javascript
   const { data: { user } } = await supabase.auth.getUser();
   console.log("Current user:", user); // Should not be null
   ```

2. **Check Supabase Logs**:
   - Dashboard → Logs
   - Filter for your operations
   - Look for detailed error info

3. **Test Direct SQL**:
   - SQL Editor in Dashboard
   - Try INSERT/UPDATE/DELETE manually
   - If it works manually but not via JS = code issue
   - If it fails manually = RLS issue

4. **Contact Supabase Support**:
   - Provide error code + message
   - Provide RLS policy definition
   - Provide test data

