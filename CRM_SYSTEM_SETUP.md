# CRM System Setup Guide

## Overview
The CRM Management System is integrated with your existing CLIENT sheet and provides comprehensive customer relationship management features including opportunities, activities, interactions, tasks, and notes.

## Google Sheets Setup

You need to create the following sheets in your Google Spreadsheet. These sheets will be automatically used by the CRM system.

### 1. CRM_Opportunities
**Purpose**: Track sales opportunities and pipeline

**Columns**:
- `OpportunityId` (Text) - Unique ID like OPP1234
- `ClientCode` (Text) - Links to CLIENT sheet
- `ClientName` (Text) - Client name (auto-populated)
- `Title` (Text) - Opportunity title
- `Description` (Text) - Detailed description
- `Value` (Number) - Opportunity value in currency
- `Currency` (Text) - INR, USD, etc.
- `Stage` (Text) - Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost
- `Probability` (Number) - 0-100 percentage
- `ExpectedCloseDate` (Date) - Expected closing date
- `ActualCloseDate` (Date) - Actual closing date
- `Source` (Text) - Lead source
- `AssignedTo` (Text) - Person assigned
- `Products` (Text) - JSON array of products
- `Notes` (Text) - Additional notes
- `Status` (Text) - Active, Closed, Lost
- `CreatedBy` (Text) - User email
- `CreatedAt` (DateTime) - Creation timestamp
- `UpdatedAt` (DateTime) - Last update timestamp
- `LastContactDate` (Date) - Last contact date
- `NextFollowUpDate` (Date) - Next follow-up date
- `LogId` (Text) - Link to SalesFlow LogId (optional)

### 2. CRM_Activities
**Purpose**: Track all activities (calls, meetings, emails, tasks, notes)

**Columns**:
- `ActivityId` (Text) - Unique ID like ACT1234567890
- `ClientCode` (Text) - Links to CLIENT sheet
- `OpportunityId` (Text) - Links to CRM_Opportunities (optional)
- `Type` (Text) - Call, Meeting, Email, Task, Note
- `Subject` (Text) - Activity subject
- `Description` (Text) - Activity details
- `ActivityDate` (DateTime) - When activity occurred/scheduled
- `Duration` (Number) - Duration in minutes
- `AssignedTo` (Text) - Person assigned
- `Status` (Text) - Planned, Completed, Cancelled
- `Priority` (Text) - High, Medium, Low
- `Outcome` (Text) - Activity outcome/result
- `NextAction` (Text) - Next action item
- `CreatedBy` (Text) - User email
- `CreatedAt` (DateTime) - Creation timestamp
- `UpdatedAt` (DateTime) - Last update timestamp

### 3. CRM_Interactions
**Purpose**: Communication history (emails, calls, WhatsApp, SMS)

**Columns**:
- `InteractionId` (Text) - Unique ID like INT1234567890
- `ClientCode` (Text) - Links to CLIENT sheet
- `OpportunityId` (Text) - Links to CRM_Opportunities (optional)
- `Type` (Text) - Email, Call, Meeting, WhatsApp, SMS
- `Direction` (Text) - Inbound, Outbound
- `Subject` (Text) - Interaction subject
- `Content` (Text) - Interaction content/transcript
- `From` (Text) - Sender email/phone
- `To` (Text) - Recipient email/phone
- `DateTime` (DateTime) - Interaction timestamp
- `Duration` (Number) - Duration in minutes (for calls)
- `Status` (Text) - Sent, Received, Read, Replied
- `Attachments` (Text) - JSON array of attachment references
- `CreatedBy` (Text) - User email
- `CreatedAt` (DateTime) - Creation timestamp

### 4. CRM_Tasks
**Purpose**: Follow-up tasks and reminders

**Columns**:
- `TaskId` (Text) - Unique ID like TASK1234567890
- `ClientCode` (Text) - Links to CLIENT sheet
- `OpportunityId` (Text) - Links to CRM_Opportunities (optional)
- `Title` (Text) - Task title
- `Description` (Text) - Task details
- `DueDate` (Date) - Task due date
- `Priority` (Text) - High, Medium, Low
- `Status` (Text) - Pending, In Progress, Completed, Cancelled
- `AssignedTo` (Text) - Person assigned
- `CompletedDate` (Date) - Completion date
- `ReminderDate` (Date) - Reminder date
- `CreatedBy` (Text) - User email
- `CreatedAt` (DateTime) - Creation timestamp
- `UpdatedAt` (DateTime) - Last update timestamp

### 5. CRM_Notes
**Purpose**: General notes and observations about clients/opportunities

**Columns**:
- `NoteId` (Text) - Unique ID like NOTE1234567890
- `ClientCode` (Text) - Links to CLIENT sheet
- `OpportunityId` (Text) - Links to CRM_Opportunities (optional)
- `Title` (Text) - Note title
- `Content` (Text) - Note content
- `Category` (Text) - General, Meeting, Call, Follow-up, Issue
- `Tags` (Text) - JSON array of tags
- `CreatedBy` (Text) - User email
- `CreatedAt` (DateTime) - Creation timestamp
- `UpdatedAt` (DateTime) - Last update timestamp

## Integration with Existing Sheets

### CLIENT Sheet
The CRM system **automatically uses** your existing `CLIENT` sheet. No changes needed!

- All client data is read from CLIENT sheet
- Client codes are used to link opportunities, activities, interactions, tasks, and notes
- Client information is displayed throughout the CRM interface

### SalesFlow Integration
- Opportunities can be linked to SalesFlow via `LogId` field
- This allows tracking from lead to opportunity to closed deal

## Features

### 1. Dashboard
- **KPIs**: Total clients, active opportunities, pipeline value, weighted pipeline, upcoming tasks, recent activities
- **Real-time analytics**: All metrics update automatically

### 2. Clients Tab
- View all clients from CLIENT sheet
- Quick access to client opportunities
- Client statistics and ratings

### 3. Opportunities Tab
- **Sales Pipeline**: Visual representation of opportunities by stage
- **Probability tracking**: Weighted pipeline value calculation
- **Filtering**: By client, stage, search term
- **Create/Edit**: Full CRUD operations
- **Activity linking**: Add activities directly from opportunities

### 4. Tasks Tab
- **Task management**: Create, view, complete tasks
- **Due date tracking**: Sort by due date
- **Status management**: Pending, In Progress, Completed, Cancelled
- **Priority levels**: High, Medium, Low

### 5. Activities Tab
- **Activity logging**: Calls, meetings, emails, tasks, notes
- **Outcome tracking**: Record outcomes and next actions
- **Timeline view**: Chronological activity history
- **Filtering**: By client, type, date range

### 6. Interactions Tab
- **Communication history**: All client communications in one place
- **Type tracking**: Email, Call, Meeting, WhatsApp, SMS
- **Direction**: Inbound/Outbound tracking
- **Status tracking**: Sent, Received, Read, Replied

### 7. Notes Tab
- **Quick notes**: Fast note-taking for clients/opportunities
- **Categorization**: Organize notes by category
- **Tagging**: Add tags for better organization

## Usage Instructions

1. **Create Sheets**: Add the 5 CRM sheets to your Google Spreadsheet with the column headers listed above
2. **Access CRM**: Navigate to `/crm` in your application
3. **Start Using**: 
   - View dashboard for overview
   - Create opportunities from the Opportunities tab
   - Log activities as you interact with clients
   - Create tasks for follow-ups
   - Add notes for important information

## Data Relationships

```
CLIENT (existing)
  ├── Opportunities (CRM_Opportunities)
  │   ├── Activities (CRM_Activities)
  │   ├── Interactions (CRM_Interactions)
  │   ├── Tasks (CRM_Tasks)
  │   └── Notes (CRM_Notes)
  └── Direct Activities/Interactions/Tasks/Notes (not linked to opportunity)
```

## Best Practices

1. **Link Everything**: Always link activities, interactions, tasks, and notes to a client code
2. **Update Stages**: Regularly update opportunity stages as deals progress
3. **Log Interactions**: Log all client communications for complete history
4. **Set Reminders**: Use tasks with due dates for follow-ups
5. **Track Outcomes**: Always record outcomes and next actions for activities

## Troubleshooting

- **Sheets not found**: Ensure sheet names match exactly (case-sensitive)
- **Client not found**: Verify client code exists in CLIENT sheet
- **Data not loading**: Check Google Sheets API permissions and OAuth token
- **Slow performance**: Large datasets may take time to load initially

