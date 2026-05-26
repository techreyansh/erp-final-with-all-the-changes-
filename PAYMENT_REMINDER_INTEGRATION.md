# Payment Reminder & Collections CRM Integration

## Overview
This integration provides automated payment reminders and call task management for invoices with Cheque/RTGS payment modes. The system automatically creates reminder schedules, call tasks, and tracks payment reconciliation.

## Features Implemented

### 1. **Payment Reminder Service** (`src/services/paymentReminderService.js`)
   - Invoice management with payment mode tracking
   - Automatic reminder scheduling (Email, WhatsApp, SMS)
   - Call task creation and management
   - Payment reconciliation (Cheque/RTGS)
   - Task snoozing and escalation
   - Collections dashboard data aggregation

### 2. **Reminder Templates Service** (`src/services/reminderTemplatesService.js`)
   - Pre-built templates in English and Hindi
   - Template types: Friendly, Early, Final, Overdue
   - Support for Email, WhatsApp, and SMS channels
   - Call script templates
   - Placeholder replacement functionality

### 3. **Collections Dashboard** (`src/components/crm/CollectionsDashboard.js`)
   - Unified dashboard showing:
     - Total outstanding invoices and amounts
     - Overdue invoices
     - Today's call tasks
     - Invoices due in next 7/30/90 days
   - Tabbed interface for different views
   - One-click actions:
     - Call customer (with outcome tracking)
     - Send reminders (Email/WhatsApp)
     - Record payments
     - Snooze tasks

### 4. **Sheet Definitions**
   Added to `config.js`:
   - `CRM_Invoices` - Invoice records
   - `CRM_ReminderTemplates` - Reminder templates
   - `CRM_Communications` - Scheduled/sent communications
   - `CRM_CallTasks` - Call tasks for CRM
   - `CRM_TaskLogs` - Task action logs

## Automation Rules

### When Invoice is Created (Payment Mode = Cheque/RTGS):
1. **Immediate Call Task**: Created with high priority, due today
2. **Scheduled Reminders**:
   - Friendly reminder: Issue date + 3 days
   - Early reminder: Due date - 7 days
   - Final reminder: Due date - 1 day
   - Overdue reminder: Due date + 3 days

### Call Task Management:
- **Auto-escalation**: After 3 attempts, task is escalated to manager
- **Snooze options**: 1 hour, 4 hours, 1 day, custom
- **Payment promise follow-up**: Creates follow-up task 1 day before promised date

### Payment Received:
- Auto-closes outstanding call tasks
- Updates invoice status (paid/pending_clearance)
- Sends receipt confirmation

## Integration Points

### 1. **FGToBilling Component**
   - Import `paymentReminderService` (already added)
   - When creating a bill/invoice with payment mode = cheque/rtgs:
     ```javascript
     // After saving bill, create invoice record
     if (paymentMode === 'cheque' || paymentMode === 'rtgs') {
       await paymentReminderService.createInvoice({
         invoiceNo: billNumber,
         customerId: selectedClient.clientCode,
         customerName: selectedClient.clientName,
         amount: totalAmount,
         issueDate: billDate,
         dueDate: dueDate, // Calculate based on payment terms
         paymentMode: paymentMode,
         status: 'sent'
       }, user?.email);
     }
     ```

### 2. **CRM Management Component**
   - Collections Dashboard tab added (Tab index 12)
   - Accessible from CRM Management → Collections tab

## Usage

### For CRM Users:

1. **View Collections Dashboard**:
   - Navigate to CRM → Collections tab
   - View summary cards and categorized invoices

2. **Handle Today's Calls**:
   - Click on "Today's Calls" tab
   - Click phone icon to mark call outcome
   - Select outcome: Connected, Left message, No answer, Payment Promise, etc.
   - Add notes and promise date if applicable

3. **Send Reminders**:
   - Click email icon on any invoice
   - Select channel (Email/WhatsApp/SMS)
   - Select template type
   - Add personal note (optional)
   - Send

4. **Record Payments**:
   - Click payment icon on invoice
   - Enter payment details:
     - For Cheque: Cheque number, date, bank, branch
     - For RTGS: UTR number
   - Select status (Received/Cleared/Pending/Returned)
   - System auto-closes tasks and updates invoice

5. **Snooze Tasks**:
   - Click snooze icon on call task
   - Task is rescheduled and attempts incremented

## Templates Available

### English Templates:
- **Friendly**: "Invoice #{invoice_no} of ₹{amount} is due on {due_date}..."
- **Early**: "Invoice is due in 7 days..."
- **Final**: "Invoice is due TOMORROW..."
- **Overdue**: "Invoice is now OVERDUE..."

### Hindi Templates:
- Same structure, translated to Hindi
- Uses Devanagari script

## Data Model

### Invoice Fields:
- Id, InvoiceNo, CustomerId, CustomerName
- Amount, IssueDate, DueDate
- Status (sent/due/paid/overdue)
- PaymentMode (cheque/rtgs)
- Notes, CreatedBy, CreatedAt, UpdatedAt

### Payment Fields:
- Id, InvoiceId, PaymentMethod
- Cheque: ChequeNo, ChequeDate, BankName, Branch
- RTGS: UTR
- Amount, ReceivedDate, Status

### Call Task Fields:
- Id, InvoiceId, CustomerId, CustomerName
- AssignedTo, DueAt, Priority
- Status (open/done/snoozed/escalated)
- Attempts, LastContactAt, LastOutcome

## Next Steps

1. **Add Payment Mode to Bill Form**:
   - Add payment mode dropdown in FGToBilling component
   - Options: Cash, Cheque, RTGS, Online Transfer
   - Add due date calculation based on payment terms

2. **Email/WhatsApp Integration**:
   - Integrate with email service (SendGrid/Mailgun)
   - Integrate with WhatsApp Cloud API or Twilio
   - Implement actual sending in `paymentReminderService.scheduleCommunication()`

3. **Scheduler Implementation**:
   - Create backend cron job or scheduled function
   - Check for scheduled communications daily
   - Send reminders at configured times
   - Respect Do-Not-Disturb windows (9:00-20:00)

4. **Click-to-Dial Integration**:
   - Integrate with SIP/VoIP provider
   - Add browser click-to-dial (tel: links)
   - Auto-log call attempts

5. **Reporting**:
   - Daily morning digest email
   - End-of-day summary
   - Promised payments tracking

## Configuration

### Default Reminder Rules (configurable):
- Friendly: Issue date + 3 days
- Early: Due date - 7 days
- Final: Due date - 1 day
- Overdue: Due date + 3 days

### Escalation Rules:
- Auto-escalate after 3 call attempts
- Notify manager on escalation
- Create high-priority task for manager

### Priority Logic:
1. Overdue invoices with promise date in last 7 days - Highest
2. Due within 3 days - High
3. Past-due but no response - Medium
4. Large amounts (configurable threshold) - Flag for manager

## Testing

1. Create an invoice with payment mode = "cheque" or "rtgs"
2. Verify call task is created
3. Verify reminders are scheduled
4. Test call outcome tracking
5. Test payment recording and task closure
6. Test snooze functionality
7. Test escalation after 3 attempts

## Notes

- All data is stored in Google Sheets
- Templates can be customized in `reminderTemplatesService.js`
- Automation rules can be modified in `paymentReminderService.js`
- UI is mobile-friendly for CRM field use

