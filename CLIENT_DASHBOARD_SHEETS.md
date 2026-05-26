# Client Dashboard - Google Sheets Setup

Create the following sheets in your Google Spreadsheet. Use these exact tab names to match `src/config/config.js`.

1) Client_Orders
- Columns: `Id, ClientCode, OrderNumber, OrderDate, Status, TotalAmount, Items`

2) Client_Payments
- Columns: `Id, ClientCode, OrderId, Amount, PaymentDate, Method, Status, TransactionId`

3) Client_Quotations
- Columns: `Id, ClientCode, QuotationNumber, IssueDate, Status, TotalAmount, ValidUntil`

4) Client_Notifications
- Columns: `Id, ClientCode, Type, Message, Timestamp, Read`

5) Client_Messages (optional for later)
- Columns: `Id, ClientCode, Channel, Subject, Body, Timestamp, From, To, Read`

Optional future modules (tabs may be empty initially):
- Petty_Cash: `Id, ClientCode, Date, Amount, Category, Note, ApprovedBy`
- SCOT_Sheet: `Id, ClientCode, EntryDate, ProductCode, Qty, Specs, Notes`
- Enquiries: `Id, ClientCode, Source, Date, Contact, Details, Status`
- Enquiries_Export: `Id, Country, ClientName, Contact, Details, Status`
- Enquiries_IndiaMart: `Id, LeadId, ClientName, Contact, Details, Status`

Future flows (placeholders):
- Die_Repair: `Id, DieCode, ClientCode, ComplaintDate, Issue, Status, ReturnDate`
- HR_Induction: `Id, EmpId, Name, DOJ, Department, ChecklistStatus`
- HR_Resignation: `Id, EmpId, Name, LWD, HandoverStatus`
- Checklists: `Id, Module, Item, OwnerRole, Frequency, Active`
- Delegation: `Id, FromRole, ToRole, Task, StartDate, EndDate`
- MIS_Scores: `Id, Period, Metric, Value, OwnerRole`
- Delegation_Scores: `Id, Period, Role, Score`
- Employee_Dashboards: `Id, EmpId, Period, KPI, Value`
- Costing_Breakup: `Id, POId, BOMCost, LaborCost, FGCost, Overheads, Total`
- Quotation_Formats: `Id, Name, Version, Url`

Notes
- Dates should be ISO strings where possible (YYYY-MM-DD or full ISO timestamp)
- Status values should be consistent across tabs
- Boolean columns like `Read` should be TRUE/FALSE
- Numeric fields must be numbers (no commas)



