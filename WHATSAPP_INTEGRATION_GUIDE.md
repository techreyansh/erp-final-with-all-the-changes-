# WhatsApp Integration Guide

## Overview
This document describes the WhatsApp update feature integrated into the workflow system. The system generates WhatsApp-ready messages and provides a UI to send them manually via WhatsApp Web/App (NO API integration).

## Features

### 1. WhatsApp Button at Every Workflow Stage
- **Location**: Every task row in FlowManagement/TaskList components
- **Stages Covered**:
  - STORE1 (Store 1)
  - CABLE_PRODUCTION (Cable Production)
  - STORE2 (Store 2)
  - MOULDING (Moulding Production)
  - FG_SECTION (Finished Goods Section)
  - DISPATCH (Dispatch)

### 2. Message Generation
- **Automatic Template Generation**: Pre-filled messages based on workflow stage and status
- **Placeholders Supported**:
  - `{OrderID}` - Order/Purchase Order ID
  - `{CustomerName}` - Customer/Client name
  - `{CurrentStatus}` - Current workflow stage status
  - `{NextStep}` - Next workflow stage
  - `{CompanyName}` - Company name (default: "Reyansh Industries")
  - `{TrackingLink}` - Order tracking URL
  - `{DeliveryDate}` - Expected delivery date
  - `{DelayReason}` - Delay reason (for delayed orders)
  - `{NewDueDate}` - New due date (for delayed orders)
  - `{IssueDescription}` - Issue description (for issue reports)

### 3. WhatsApp Modal Features
- **Editable Message**: Users can edit the pre-filled message before sending
- **Recipient Management**:
  - Primary customer contact auto-loaded from client data
  - Add multiple recipients (name + phone number)
  - Support for customer contacts and custom numbers
- **Multi-Recipient Support**: Send to multiple contacts individually
- **Phone Number Validation**: Basic format validation
- **Country Code Handling**: Automatically adds +91 for India if not present

### 4. Message Logging
- **Internal Logging**: All message drafts are logged to "WhatsApp Message Logs" sheet
- **Logged Information**:
  - Timestamp
  - Order ID
  - Client Code
  - Workflow Stage
  - Status
  - Message Draft Content
  - Recipients List
  - User Email
  - Message Sent Status (Yes/No)

### 5. WhatsApp URL Generation
- **Format**: `https://wa.me/{phoneNumber}?text={encodedMessage}`
- **Phone Number Formatting**: 
  - Removes spaces, dashes, parentheses
  - Adds country code (+91 for India) if missing
  - Handles leading zeros
- **Message Encoding**: URL-encoded for safe transmission

## File Structure

### Services
- `src/services/whatsappMessageService.js` - Message generation and template management
- `src/services/whatsappLogService.js` - Message logging service

### Components
- `src/components/common/WhatsAppButton.js` - Reusable WhatsApp button component
- `src/components/common/WhatsAppModal.js` - WhatsApp modal with message editor and recipient management

### Integration Points
- `src/components/flowManagement/TaskList.js` - WhatsApp buttons integrated in task actions
- `src/components/flowManagement/FlowManagement.js` - Uses TaskList (inherits WhatsApp integration)

## Usage

### For Users
1. Navigate to any workflow stage (Store 1, Cable Production, etc.)
2. Find the WhatsApp icon button in the Actions column for any task
3. Click the WhatsApp button
4. Review/edit the pre-filled message
5. Add recipients if needed
6. Click "Send" for individual recipients or "Send to All" for multiple recipients
7. WhatsApp Web/App will open with the pre-filled message

### For Developers

#### Adding WhatsApp Button to New Components
```jsx
import WhatsAppButton from '../common/WhatsAppButton';

// In your component
<WhatsAppButton
  task={taskObject}
  stageName="STORE1" // or CABLE_PRODUCTION, STORE2, etc.
  status="NEW" // or "COMPLETED"
  size="small"
  variant="icon"
  onMessageSent={(recipients, message) => {
    console.log('Message sent:', { recipients, message });
  }}
/>
```

#### Customizing Message Templates
Edit `src/services/whatsappMessageService.js`:
- Modify `getDefaultTemplate()` method to change message templates
- Add new stage templates in the `templates` object
- Update placeholder replacement logic in `replacePlaceholders()`

#### Accessing Message Logs
```javascript
import whatsappLogService from '../services/whatsappLogService';

// Get logs for an order
const logs = await whatsappLogService.getOrderLogs('PO-12345');

// Get logs for a client
const clientLogs = await whatsappLogService.getClientLogs('C00001');

// Get recent logs
const recentLogs = await whatsappLogService.getRecentLogs(50);
```

## Message Templates

### Default Template Format
```
Hello {CustomerName},

Your order (ID: {OrderID}) has been {CurrentStatus}.
Next step: {NextStep}.

Thank you,
{CompanyName}
```

### Stage-Specific Templates
Each workflow stage has customized templates for:
- **NEW Status**: When stage starts
- **COMPLETED Status**: When stage completes

Special templates for:
- **DELIVERED**: Delivery confirmation
- **DELAYED**: Delay notification
- **ISSUE_RAISED**: Issue reporting

## Configuration

### Company Information
Edit `src/services/whatsappMessageService.js`:
```javascript
this.companyName = 'Reyansh Industries'; // Change company name
this.baseTrackingUrl = 'https://tracking.reyansh.com'; // Change tracking URL
```

### Google Sheet Setup
Create a sheet named "WhatsApp Message Logs" with headers:
- Timestamp
- OrderID
- ClientCode
- WorkflowStage
- Status
- MessageDraft
- Recipients
- UserEmail
- MessageSent

## Future Enhancements

### Ready for API Integration
The system is designed to easily integrate WhatsApp API later:
- Message generation logic is separated from sending logic
- Message templates are reusable for SMS/Email
- Logging structure supports delivery status tracking

### Potential Additions
- Admin panel for template management
- SMS/Email integration using same templates
- Automated sending (when API is available)
- Message delivery status tracking
- Template versioning

## Safety & Compliance

### No Auto-Sending
- Messages are NEVER sent automatically
- User must explicitly click "Send" button
- WhatsApp opens in new tab - user controls final send

### Data Privacy
- Phone numbers are NOT hardcoded
- Recipients must be explicitly added
- All message drafts are logged for audit purposes

### User Control
- Full message editing capability
- Recipient selection control
- Manual send confirmation required

## Troubleshooting

### WhatsApp Button Not Appearing
- Check that `currentStage` is not 'RECEIVING_DOCUMENTS' or 'COMPLETE_O2D'
- Verify task has required fields (ClientCode, POId, etc.)

### Message Not Generating
- Check task object has required fields
- Verify stageName matches supported stages
- Check browser console for errors

### Phone Number Format Issues
- Ensure phone numbers include country code
- Format: +91 9876543210 or 9876543210 (auto-adds +91)

### Client Contacts Not Loading
- Verify client exists in CLIENT sheet
- Check Contacts field is valid JSON array
- Ensure contact has 'number' field

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Google Sheets permissions
3. Check client data structure
4. Review message logs in "WhatsApp Message Logs" sheet
