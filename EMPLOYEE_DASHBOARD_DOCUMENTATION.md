# Employee Dashboard Documentation

## Overview

The Employee Dashboard is a comprehensive, modern web application built with React and Material-UI that provides employees with access to their personal work information, tasks, performance metrics, attendance records, and more. The dashboard integrates with Google Sheets for data storage and management.

## Features

### 🎯 **Core Features**

1. **Employee Selection & Profile Management**
   - Search and select employees by code or name
   - Comprehensive employee profile with personal and professional information
   - Real-time employee status indicators

2. **Dashboard Overview**
   - Personalized greeting and current date
   - Key performance indicators (KPIs)
   - Task distribution charts
   - Weekly hours tracking
   - Recent notifications summary
   - Quick action buttons

3. **Task Management**
   - View assigned tasks with status tracking
   - Task filtering by status and priority
   - Progress visualization with linear progress bars
   - Task status updates (Start, Complete, Put on Hold)
   - Task details dialog with comprehensive information

4. **Performance Tracking**
   - Performance trend charts over time
   - Skills assessment radar chart
   - Performance history table with ratings
   - Goals and targets tracking
   - Achievement recognition system

5. **Attendance Management**
   - Attendance statistics and metrics
   - Table and calendar view modes
   - Working hours summary
   - Attendance rate calculations
   - Visual attendance calendar with color-coded status

6. **Time Tracking**
   - Real-time clock in/out functionality
   - Daily and weekly hour tracking
   - Break management system
   - Time entry history
   - Progress indicators for daily targets

7. **Notifications System**
   - Categorized notifications (Tasks, Events, Warnings, Info)
   - Unread notification badges
   - Mark as read functionality
   - Notification history
   - Priority-based color coding

### 🎨 **Design Features**

- **Modern UI/UX**: Clean, intuitive interface with Material-UI components
- **Responsive Design**: Fully responsive layout that works on desktop, tablet, and mobile
- **Dark/Light Theme Support**: Customizable theming with professional color schemes
- **Interactive Charts**: Rich data visualization using Recharts library
- **Gradient Headers**: Beautiful gradient backgrounds for enhanced visual appeal
- **Badge Notifications**: Real-time notification indicators
- **Floating Action Buttons**: Quick access to common actions

## Technical Architecture

### 🏗️ **Component Structure**

```
src/components/employeeDashboard/
├── EmployeeDashboard.js          # Main dashboard container
├── EmployeeSelector.js           # Employee search and selection
├── DashboardOverview.js          # Overview tab with KPIs and charts
├── ProfileTab.js                 # Employee profile information
├── TasksTab.js                   # Task management interface
├── PerformanceTab.js             # Performance metrics and charts
├── AttendanceTab.js              # Attendance tracking and calendar
├── TimeTrackingTab.js            # Time tracking and clock in/out
└── NotificationsTab.js           # Notification management
```

### 📊 **Data Integration**

The dashboard integrates with Google Sheets through the following sheets:

1. **Employees Sheet**
   - Employee personal and professional information
   - Department, designation, and status details
   - Contact information and qualifications

2. **TimeTracking Sheet**
   - Clock in/out records
   - Working hours calculations
   - Break time tracking

3. **Performance Sheet**
   - Performance scores and metrics
   - Target vs actual performance
   - Review comments and feedback

4. **Attendance Sheet**
   - Daily attendance records
   - Status tracking (Present, Absent, Late, Half Day)
   - Working hours per day

5. **EmployeeTasks Sheet**
   - Task assignments and details
   - Status and priority tracking
   - Due dates and completion records

6. **Notifications Sheet**
   - System and manual notifications
   - Read/unread status
   - Priority levels and categories

### 🔧 **Services**

**EmployeeService** (`src/services/employeeService.js`)
- Handles all employee-related data operations
- Integrates with Google Sheets API
- Provides methods for:
  - Employee data retrieval
  - Task management
  - Attendance tracking
  - Time tracking
  - Notification handling

## Setup Instructions

### 1. **Prerequisites**

```bash
# Install required dependencies
npm install recharts react-big-calendar moment
```

### 2. **Google Sheets Setup**

Create the following sheets in your Google Spreadsheet:

1. **Employees** - Employee master data
2. **TimeTracking** - Clock in/out records
3. **Performance** - Performance reviews and scores
4. **Attendance** - Daily attendance records
5. **EmployeeTasks** - Task assignments
6. **Notifications** - System notifications

### 3. **Configuration**

Update your `src/config/config.js` to include the employee dashboard sheets:

```javascript
export default {
  // ... existing config
  sheets: {
    // ... existing sheets
    employees: 'Employees',
    timeTracking: 'TimeTracking',
    performance: 'Performance',
    attendance: 'Attendance',
    employeeTasks: 'EmployeeTasks',
    notifications: 'Notifications'
  }
};
```

### 4. **Navigation**

Add the employee dashboard to your main navigation by accessing:
```
/employee-dashboard
```

## Usage Guide

### 🚀 **Getting Started**

1. **Select Employee**: Use the employee selector to search and choose an employee
2. **Navigate Tabs**: Use the tab navigation to explore different sections
3. **View Overview**: Start with the overview tab for a quick summary
4. **Manage Tasks**: Check and update task status in the Tasks tab
5. **Track Time**: Use the Time Tracking tab for clock in/out operations
6. **Monitor Performance**: Review performance metrics and goals
7. **Check Attendance**: View attendance records and statistics
8. **Read Notifications**: Stay updated with recent notifications

### 📋 **Tab Functions**

**Overview Tab**:
- Dashboard summary with key metrics
- Task distribution pie chart
- Weekly hours bar chart
- Recent notifications list
- Quick action buttons

**Profile Tab**:
- Personal information display
- Employment details
- Education background
- Performance summary cards

**Tasks Tab**:
- Task list with filtering options
- Status and priority indicators
- Progress tracking
- Task detail dialog for updates

**Performance Tab**:
- Performance trend line chart
- Skills assessment radar chart
- Performance history table
- Goals and achievements

**Attendance Tab**:
- Attendance statistics
- Calendar and table views
- Working hours summary
- Status breakdown

**Time Tracking Tab**:
- Real-time clock display
- Clock in/out buttons
- Daily progress indicator
- Time entry history

**Notifications Tab**:
- Categorized notifications
- Unread badges
- Mark as read functionality
- Notification filtering

## Customization

### 🎨 **Styling**

The dashboard uses Material-UI theming. Customize the appearance by modifying:

```javascript
// src/App.js - Theme configuration
const theme = createTheme({
  palette: {
    primary: { main: "#1e3a8a" },
    secondary: { main: "#f59e0b" },
    // ... customize colors
  }
});
```

### 📊 **Charts**

Chart configurations can be modified in individual tab components:

- **DashboardOverview.js**: Pie and bar charts
- **PerformanceTab.js**: Line and radar charts
- **AttendanceTab.js**: Calendar component

### 🔧 **Data Sources**

To integrate with different data sources:

1. Modify `EmployeeService` methods
2. Update sheet names in configuration
3. Adjust data parsing logic
4. Update component data expectations

## API Reference

### EmployeeService Methods

```javascript
// Get all employees
await employeeService.getAllEmployees()

// Get employee by code
await employeeService.getEmployeeByCode(employeeCode)

// Get employee profile with stats
await employeeService.getEmployeeProfile(employeeCode)

// Clock in/out operations
await employeeService.clockIn(employeeCode)
await employeeService.clockOut(employeeCode)

// Task management
await employeeService.updateTaskStatus(taskId, status, notes)

// Dashboard summary
await employeeService.getDashboardSummary(employeeCode)

// Notifications
await employeeService.markNotificationAsRead(notificationId)
```

## Troubleshooting

### Common Issues

1. **Google Sheets Connection**
   - Verify OAuth credentials
   - Check sheet permissions
   - Ensure proper sheet names

2. **Data Loading Issues**
   - Check network connectivity
   - Verify sheet structure
   - Review console for API errors

3. **Chart Rendering Problems**
   - Ensure recharts is installed
   - Verify data format
   - Check for missing data points

### Performance Optimization

1. **Lazy Loading**: Components load data only when accessed
2. **Caching**: Implement service-level caching for frequently accessed data
3. **Pagination**: Add pagination for large datasets
4. **Debouncing**: Use debounced search for employee selection

## Future Enhancements

### Planned Features

1. **Advanced Analytics**
   - Productivity insights
   - Team comparison metrics
   - Predictive analytics

2. **Mobile App**
   - React Native mobile application
   - Push notifications
   - Offline capability

3. **Integration Enhancements**
   - HR system integration
   - Payroll system connectivity
   - External calendar sync

4. **Advanced Permissions**
   - Role-based access control
   - Department-level restrictions
   - Manager view capabilities

## Support

For technical support or feature requests:

1. Check the troubleshooting section
2. Review console logs for errors
3. Verify Google Sheets configuration
4. Contact the development team

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Compatible with**: React 18+, Material-UI 5+
