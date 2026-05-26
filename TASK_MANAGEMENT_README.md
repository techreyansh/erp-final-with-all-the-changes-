# Task Management System

## Overview
The new task management system provides a comprehensive view of all pending tasks across different flows and a today's checklist for users. It's integrated into the header and shows tasks based on the user's role.

## Features

### 1. Header Task Icon
- **Location**: Right side of the header, next to the user avatar
- **Icon**: Bell icon with a badge showing total pending task count
- **Function**: Click to open the task management panel

### 2. Task Categories
The system shows tasks from the following flows based on user roles:

#### PO Tasks
- **Roles**: Customer Relations Manager, Store Manager, Cable Production Supervisor, QC Manager
- **Source**: PO_Master sheet
- **Navigation**: Clicking a task navigates to `/flow-management?poId={POId}`

#### Purchase Flow Tasks
- **Roles**: Process Coordinator, Purchase Executive, Management / HOD, Store Manager, QC Manager, Accounts Executive
- **Source**: PurchaseFlowSteps sheet
- **Navigation**: Clicking a task navigates to `/purchase-flow?indentNumber={IndentNumber}`

#### Sales Flow Tasks
- **Roles**: Customer Relations Manager, Sales Executive, NPD, Quality Engineer, Director, Production Manager, Store Manager, Accounts Executive
- **Source**: SalesFlowSteps sheet
- **Navigation**: Clicking a task navigates to `/sales-flow?logId={LogId}`

#### Production Tasks
- **Roles**: Cable Production Supervisor, Customer Relations Manager
- **Source**: Cable Production Plans sheet
- **Navigation**: Clicking a task navigates to `/cable-production?planId={PlanId}`

#### Inventory Tasks
- **Roles**: Store Manager
- **Source**: Material Requisitions sheet
- **Navigation**: Clicking a task navigates to `/inventory?reqId={ReqId}`

#### Dashboard Tasks
- **Roles**: CEO, Process Coordinator
- **Source**: PO_Master sheet (urgent/overdue POs)
- **Navigation**: Clicking a task navigates to `/dashboard?poId={POId}`

### 3. Today's Checklist
- **Purpose**: Shows all tasks due today or created recently
- **Logic**: 
  - Tasks with DueDate = today
  - Tasks with ExpectedDelivery = today
  - Tasks created today or yesterday
- **Display**: First tab in the task panel

### 4. Task Panel Features
- **Tabs**: Organized by flow type with task counts
- **Search**: Refresh button to reload tasks
- **Navigation**: Click any task to go directly to the corresponding flow
- **Responsive**: Adapts to different screen sizes

## Technical Implementation

### Components
- `HeaderTasks.js`: Main task management component
- `Header.js`: Updated to include the task icon

### Services
- `flowService.js`: PO task management
- `purchaseFlowService.js`: Purchase flow tasks
- `salesFlowService.js`: Sales flow tasks
- `materialCalculationService.js`: Production and inventory tasks
- `dashboardService.js`: Dashboard tasks for executives

### Data Flow
1. User clicks task icon in header
2. Component fetches tasks from all relevant services based on user role
3. Tasks are categorized and displayed in tabs
4. Today's checklist is generated from all tasks
5. Clicking a task navigates to the appropriate flow

## Usage

### For Users
1. Look for the bell icon in the header
2. Click to see your pending tasks
3. Use tabs to filter by flow type
4. Check "Today" tab for urgent tasks
5. Click any task to navigate and complete it

### For Developers
1. Add new task types by extending the services
2. Update role-based access in the component
3. Modify navigation paths as needed
4. Add new task sources by updating the fetchAllTasks method

## Configuration

### Role-Based Access
Tasks are filtered based on user roles defined in the system. Update the role arrays in `HeaderTasks.js` to modify access.

### Task Sources
Each flow type has its own service method:
- `getUserTasks(email)`: Returns tasks for a specific user
- `getUserCableProductionTasks(email)`: Returns production tasks
- `getUserInventoryTasks(email)`: Returns inventory tasks
- `getDashboardTasks(email, role)`: Returns executive dashboard tasks

### Navigation
Update the `handleTaskClick` method to modify where tasks navigate to when clicked.

## Future Enhancements
- Task priority indicators
- Due date highlighting
- Task completion tracking
- Email notifications for overdue tasks
- Task assignment and reassignment
- Task history and audit trail
