# WRITE OPERATIONS TESTING & DEBUGGING GUIDE

## 🎯 OBJECTIVE

Capture actual error messages when WRITE operations fail, so we can identify:
1. Whether it's RLS blocking (permission denied)
2. Whether it's schema mismatch (column not found)
3. Whether it's auth issues (not logged in)
4. What specific policy/table is failing

---

## 🚀 STEP-BY-STEP TESTING PROCEDURE

### PHASE 1: SETUP - Open Browser Developer Tools

1. **Open the app**:
   - Go to: http://localhost:3000

2. **Open Developer Tools**:
   - Press: **F12** (or Ctrl+Shift+I on Windows)
   - Go to **Console** tab

3. **Enable Detailed Logging** (Optional but recommended):
   ```javascript
   // Paste this in console and press Enter:
   localStorage.debug = 'supabase:*'
   ```

4. **Open Network Tab** (to see actual HTTP requests):
   - Click **Network** tab (next to Elements/Console)
   - Enable recording (red dot should be visible)

---

### PHASE 2: TEST #1 - CREATE (INSERT) OPERATION

**Goal**: Test if INSERT works and capture RLS error

#### Steps:

1. **Navigate to Clients page** (or any list view with "Add" button)

2. **Click "Add Client"** (or equivalent button)
   - A form should appear

3. **Fill in required fields**:
   - Client Name: "TEST CLIENT DELETE ME"
   - Client Code: "TEST-001"
   - Other required fields...

4. **Watch Console While Saving**:
   - Click "Save" button
   - **DO NOT NAVIGATE AWAY**
   - Watch console for [DB INSERT] messages
   - Should see one of:
     - `[DB INSERT] ✅ SUCCESS...` (Great! Insert works)
     - `[DB INSERT] ❌ Fatal: insertTableRow...` (Error! Capture the message)
     - `[DB INSERT] ❌ RLS PERMISSION DENIED...` (RLS blocking!)

5. **CAPTURE ERROR** (if visible):
   - Right-click on error message
   - Click "Copy message"
   - **SAVE THIS MESSAGE** - we need it!

6. **Check Network Tab**:
   - Look for a POST request to Supabase
   - Click it
   - Go to **Response** tab
   - Look for error details like:
     ```json
     {
       "code": "PGRST301",
       "message": "new row violates row level security policy..."
     }
     ```

#### Expected Results:

**Best Case** ✅:
```
[DB INSERT] Starting insert into clients2
[DB INSERT] Using wrapped attempt 1
[DB INSERT] ✅ SUCCESS via wrapped attempt 1
```
→ Data should appear in list without page reload

**RLS Blocking** ❌:
```
[DB INSERT] ❌ RLS PERMISSION DENIED for table clients2. 
User may not have INSERT permission. Error: 
new row violates row level security policy "..." on table "clients2"
```
→ This means RLS policies need to be fixed

**Schema Error** ❌:
```
[DB INSERT] ❌ COLUMN ERROR in table clients2. 
Table schema may not support this payload format. Error: 
column "record" of relation "clients2" does not exist
```
→ This means table structure is different than expected

**Auth Error** ❌:
```
[DB INSERT] ❌ Fatal: insertTableRow(clients2): 
column ... permission denied
```
→ This means user is not authenticated

---

### PHASE 3: TEST #2 - UPDATE (UPDATE) OPERATION

**Goal**: Test if UPDATE works and capture RLS error

#### Steps:

1. **Go back to Clients list**

2. **Click on a client to edit** (or find "Edit" button)

3. **Change ONE field**:
   - Example: Change "Notes" field to "TEST UPDATE"

4. **Watch Console While Saving**:
   - Click "Save" button
   - Watch for [DB UPDATE] messages
   - Should see one of:
     - `[DB UPDATE] ✅ SUCCESS...` (Great!)
     - `[DB UPDATE] ❌ RLS PERMISSION DENIED...` (RLS blocking!)
     - `[DB UPDATE] ❌ COLUMN ERROR...` (Schema mismatch!)

5. **CAPTURE ERROR** (if visible):
   - Same as CREATE test above
   - Copy and save the error message

#### Expected Results:

**Best Case** ✅:
```
[DB UPDATE] Starting update in clients2 id=abc123
[DB UPDATE] ✅ SUCCESS: Updated id=abc123 in clients2
```

**RLS Blocking** ❌:
```
[DB UPDATE] ❌ RLS PERMISSION DENIED for table clients2. 
User may not have UPDATE permission. Error: 
new row violates row level security policy
```

---

### PHASE 4: TEST #3 - DELETE (DELETE) OPERATION

**Goal**: Test if DELETE works and capture RLS error

#### Steps:

1. **Go to Clients list**

2. **Click Delete button** on "TEST CLIENT DELETE ME" (or test row)
   - Confirmation dialog may appear

3. **Confirm Delete**:
   - Click "Confirm" or "Yes"
   - Watch console for [DB DELETE] messages

4. **CAPTURE ERROR** (if visible):
   - Same as above

#### Expected Results:

**Best Case** ✅:
```
[DB DELETE] Starting delete in clients2 id=abc123
[DB DELETE] ✅ SUCCESS: Deleted id=abc123 from clients2
```
→ Row should disappear from list

**RLS Blocking** ❌:
```
[DB DELETE] ❌ RLS PERMISSION DENIED for table clients2. 
User may not have DELETE permission. Error: 
new row violates row level security policy "..." on table "clients2"
```
→ Row should NOT disappear

---

## 🔍 CONSOLE OUTPUT ANALYSIS

### What Each Message Type Means:

**[DB INSERT]** - INSERT operation debug logs
- Shows payload being sent
- Shows attempt strategy
- Most important: SUCCESS or ERROR status

**[DB UPDATE]** - UPDATE operation debug logs
- Shows which record being updated
- Shows column names being modified
- Most important: SUCCESS or ERROR status

**[DB DELETE]** - DELETE operation debug logs
- Shows which record being deleted
- Most important: SUCCESS or ERROR status

**[addClient]/[updateClient]/[deleteClient]** - Service-level logging
- Shows business logic flow
- Catches errors at service level
- Should show SUCCESS or ERROR

### Error Code Reference:

| Code | Meaning | Root Cause |
|------|---------|-----------|
| None (silent) | Operation completes but no error caught | Check if data actually saved |
| PGRST301 | Permission Denied | RLS policy blocking |
| 42703 | Column doesn't exist | Table missing `record` column OR wrong columns |
| 42P01 | Table doesn't exist | TABLE_NAMES mapping wrong |
| 23505 | Duplicate key | Unique constraint (clientCode exists) |
| 22P02 | Invalid input | Data type mismatch |

---

## 📊 TRACKING RESULTS

### CREATE Test Result:
- Status: [ ] Pass / [ ] Fail
- Error Code: ___________
- Error Message: ___________
- Time taken: ___________

### UPDATE Test Result:
- Status: [ ] Pass / [ ] Fail
- Error Code: ___________
- Error Message: ___________
- Time taken: ___________

### DELETE Test Result:
- Status: [ ] Pass / [ ] Fail
- Error Code: ___________
- Error Message: ___________
- Time taken: ___________

### Verify in Database:
1. Go to Supabase Dashboard
2. Select your project
3. Go to **Database** → **clients2** table
4. Check for:
   - [ ] New row from CREATE test (should exist if working)
   - [ ] Updated row from UPDATE test (Notes field should show "TEST UPDATE")
   - [ ] Deleted row from DELETE test (should be gone if working)

---

## 🔧 IF ALL OPERATIONS FAIL

If you see RLS errors like:
```
new row violates row level security policy "..." on table "clients2"
```

**Follow RLS_DIAGNOSIS_FIX_GUIDE.md** to:
1. Check RLS policy status in Supabase
2. Disable RLS for development
3. Or enable proper RLS policies
4. Re-test

---

## 📝 SAMPLE ERROR CAPTURE FORMAT

When you see an error, capture it in this format and share:

```
ERROR REPORT:
Operation: [CREATE / UPDATE / DELETE]
Table: clients2
Error Code: PGRST301
Full Error Message: "new row violates row level security policy "policies_xxx" on table "clients2""
Browser Console Stack:
  [DB INSERT] ❌ RLS PERMISSION DENIED for table clients2...
Network Tab Response:
  {"code":"PGRST301","message":"...","details":"..."}
```

---

## ✅ SUCCESS INDICATORS

**You'll know WRITE operations are working when**:

1. **CREATE Test** ✅:
   - Console shows `[DB INSERT] ✅ SUCCESS`
   - New client appears in list immediately
   - Supabase Dashboard shows new row in clients2 table

2. **UPDATE Test** ✅:
   - Console shows `[DB UPDATE] ✅ SUCCESS`
   - Changed field updates immediately in UI
   - Supabase Dashboard shows updated row data

3. **DELETE Test** ✅:
   - Console shows `[DB DELETE] ✅ SUCCESS`
   - Deleted row disappears from list immediately
   - Supabase Dashboard no longer shows the row

---

## 🎯 NEXT STEPS AFTER TESTING

### If All Tests PASS ✅:
1. Apply same logging to vendorService, productService, etc.
2. Test all ERP modules (vendors, products, inventory, etc.)
3. Test complete workflows (order to dispatch)
4. Set up proper RLS policies for production

### If Tests FAIL ❌ (RLS errors):
1. Note exact error messages
2. Go to RLS_DIAGNOSIS_FIX_GUIDE.md
3. Disable RLS or enable proper policies
4. Re-run tests

### If Tests FAIL ❌ (Column errors):
1. Check Supabase table schema
2. Verify `record` column exists
3. Verify column data types match
4. May need to adjust TABLE_NAMES mapping

---

## 🆘 DEBUGGING CHECKLIST

- [ ] F12 Console opened and watching
- [ ] Network tab recording enabled
- [ ] Logged in to app (can see client data loading)
- [ ] CREATE test completed and result captured
- [ ] UPDATE test completed and result captured
- [ ] DELETE test completed and result captured
- [ ] Errors (if any) captured in format above
- [ ] Checked Supabase dashboard for data presence
- [ ] Ready to share results or proceed with RLS fix

