# Company Kitting Sheet - Quick Reference Guide

## 🚀 Quick Start

### Generating Material Kitting List
1. Select BOM from dropdown
2. Enter order quantity
3. Click **"Generate List"**
4. System automatically filters out already-issued items
5. Review kitting list and filtered items panel

### Issuing Materials
1. Review material in kitting list
2. Adjust issue quantity if needed
3. Click **"Issue"** button
4. Material is recorded and removed instantly
5. Progress bar updates automatically

## 🔍 Real-Time Filtering

### What Gets Filtered?
- ✅ Materials already issued for the selected BOM
- ✅ Items with status = "Issued" in Company Material Issues sheet
- ✅ Matches by BOM ID + Item Code/Name

### What's NOT Filtered?
- ❌ Materials for different BOM IDs
- ❌ Items with other statuses
- ❌ Materials not yet issued

## 📊 Visual Indicators

| Indicator | Meaning |
|-----------|---------|
| 🟧 **Filtered Items Panel** | Shows items excluded because already issued |
| 🟦 **Progress Bar** | Shows percentage of materials issued |
| 🟢 **Available Status** | Sufficient stock available |
| 🟡 **Partial Status** | Some stock available |
| 🔴 **Out of Stock** | No stock available |

## 🎯 Key Features

| Feature | Description |
|---------|-------------|
| **Real-Time Check** | Always fetches fresh data from sheets |
| **Duplicate Prevention** | Can't issue same item twice for same BOM |
| **Instant Updates** | UI updates immediately after issuing |
| **Multi-User Safe** | Multiple users can work simultaneously |
| **Visual Feedback** | Clear panels show filtered items |

## 📝 Data Storage

### Company Material Issues Sheet
```
[BOM ID] + [Item Code] + [Status: Issued] = Filtered from list
```

**Example:**
- BOM: BOM-202501-0001
- Item: Copper Wire 0.5mm
- Status: Issued
- Result: Won't show in kitting list for this BOM

## ⚙️ Button Actions

| Button | Action |
|--------|--------|
| **Generate List** | Creates kitting list with real-time filtering |
| **Issue** | Records material issue and updates stock |
| **Refresh Data** | Syncs latest data from Google Sheets |
| **Regenerate List** | Re-generates list with current selections |
| **Clear Issued Items** | Clears local cache (not sheet data) |

## 🔄 Workflow

```
Select BOM → Generate List → Real-Time Check → Filter Issued Items → Display Available Items

Issue Material → Double-Check → Update Stock → Record Issue → Remove from List → Update Progress
```

## 💡 Pro Tips

1. **Always Regenerate**: Click "Generate List" before issuing to get latest data
2. **Check Filtered Panel**: Review what's been issued before proceeding
3. **Use Refresh**: Click "Refresh Data" if multiple users are working
4. **Monitor Progress**: Watch the progress bar to track completion
5. **Verify Stock**: Check available quantity before issuing

## 🐛 Common Issues

### Items Not Filtering?
→ Click "Refresh Data" and regenerate list

### Item Already Issued Message?
→ Another user issued it - regenerate list to see current state

### Can't See Filtered Panel?
→ No items filtered - all materials available

### Wrong Progress Percentage?
→ Refresh data and regenerate list

## 📋 Checklist for Material Issue

- [ ] BOM selected
- [ ] Order quantity entered
- [ ] List generated with real-time check
- [ ] Filtered items reviewed (if any)
- [ ] Stock availability verified
- [ ] Issue quantity confirmed
- [ ] Material issued successfully
- [ ] Progress bar updated
- [ ] Item removed from list

## 🎨 Color Coding

| Color | Meaning | Location |
|-------|---------|----------|
| 🟦 Blue | Primary actions | Generate button, headers |
| 🟧 Orange | Filtered items | Filtered panel, warnings |
| 🟢 Green | Success/Available | Issue success, sufficient stock |
| 🟡 Yellow | Warning/Partial | Partial stock |
| 🔴 Red | Error/Out of Stock | No stock, errors |

## 📊 Tabs

### Material Kitting Tab
- Shows available items for issue
- Displays stock status
- Issue materials here

### View Item Issues Tab
- Shows all issued items by BOM
- View issue history
- Track what's been issued

## 🔐 Safety Features

| Safety Feature | Protection |
|----------------|------------|
| **Real-Time Check** | Prevents viewing already-issued items |
| **Double-Check** | Verifies before issuing to prevent race conditions |
| **Stock Validation** | Can't issue more than available |
| **Negative Stock Prevention** | Blocks issues that would result in negative stock |
| **BOM ID Matching** | Only filters for specific BOM |

## 📞 Need Help?

1. Check console logs (F12 in browser)
2. Look for `[Real-time Check]` and `[Generate Kitting List]` messages
3. Verify data in Google Sheets
4. Use "Refresh Data" button
5. Contact support if issue persists

## 🎓 Learning Resources

- **Full Documentation**: `COMPANY_KITTING_REAL_TIME_FILTERING.md`
- **Console Logs**: Press F12 to view detailed logs
- **Google Sheets**: Check Company Material Issues sheet
- **Progress Bar**: Visual indicator of completion

## ⚡ Keyboard Shortcuts

- `F5`: Refresh browser page
- `F12`: Open developer console (view logs)
- `Ctrl + F`: Search in dropdown

## 📈 Performance

- **Fast Filtering**: Real-time checks complete in seconds
- **Instant Updates**: UI updates immediately after actions
- **Efficient**: Only fetches necessary data
- **Scalable**: Works with large BOMs

## 🔧 Maintenance

### Regular Tasks
- Monitor Company Material Issues sheet size
- Review issued items periodically
- Verify stock levels regularly
- Check for any duplicate entries

### Data Integrity
- System prevents duplicates automatically
- BOM ID + Item Code must match exactly
- Status must be "Issued" to filter
- Real-time checks ensure accuracy

---

**Last Updated**: October 2025
**Feature Version**: 1.0
**Status**: ✅ Active

