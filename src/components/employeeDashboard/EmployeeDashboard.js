import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Grid,
  Alert,
  Chip,
  Avatar,
  Button,
  Paper,
  IconButton,
  Badge,
  Fab,
  alpha
} from '@mui/material';
import {
  Person as PersonIcon,
  Assignment as TaskIcon,
  TrendingUp as PerformanceIcon,
  Schedule as AttendanceIcon,
  Notifications as NotificationIcon,
  Dashboard as DashboardIcon,

  Refresh as RefreshIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import employeeService from '../../services/employeeService';
import EmployeeSelector from './EmployeeSelector';
import DashboardOverview from './DashboardOverview';
import ProfileTab from './ProfileTab';
import TasksTab from './TasksTab';
import PerformanceTab from './PerformanceTab';
import AttendanceTab from './AttendanceTab';
import NotificationsTab from './NotificationsTab';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`employee-tabpanel-${index}`}
      aria-labelledby={`employee-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `employee-tab-${index}`,
    'aria-controls': `employee-tabpanel-${index}`,
  };
}

const EmployeeDashboard = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load employees on component mount
  useEffect(() => {
    loadEmployees();
  }, []);

  // Load employee data when employee is selected
  useEffect(() => {
    if (selectedEmployee) {
      loadEmployeeData();
    }
  }, [selectedEmployee]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const employeesData = await employeeService.getAllEmployees();
      setEmployees(employeesData);
    } catch (err) {
      setError('Failed to load employees: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeData = async () => {
    if (!selectedEmployee) return;

    try {
      setLoading(true);
      setError(null);
      
      const [profile, summary] = await Promise.all([
        employeeService.getEmployeeProfile(selectedEmployee.EmployeeCode),
        employeeService.getDashboardSummary(selectedEmployee.EmployeeCode)
      ]);

      setEmployeeProfile(profile);
      setDashboardSummary(summary);
    } catch (err) {
      setError('Failed to load employee data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEmployeeChange = (employee) => {
    setSelectedEmployee(employee);
    setActiveTab(0); // Reset to overview tab
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEmployeeData();
    setRefreshing(false);
  };

  const getEmployeeStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'on leave':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading && !selectedEmployee) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
          Employee Dashboard
        </Typography>
        
        {/* Employee Selector */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <EmployeeSelector
              employees={employees}
              selectedEmployee={selectedEmployee}
              onEmployeeChange={handleEmployeeChange}
              loading={loading}
            />
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Employee Dashboard Content */}
      {selectedEmployee && (
        <Box>
          {/* Employee Header */}
          <Paper sx={{ 
            p: 3, 
            mb: 3, 
            background: `linear-gradient(135deg, ${alpha('#667eea', 0.08)} 0%, ${alpha('#764ba2', 0.12)} 100%)`,
            color: 'primary.main',
            border: `1px solid ${alpha('#667eea', 0.2)}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    bgcolor: 'white',
                    color: 'primary.main',
                    fontSize: '2rem'
                  }}
                >
                  {selectedEmployee.EmployeeName?.charAt(0) || 'E'}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600 }}>
                    {selectedEmployee.EmployeeName || 'Unknown Employee'}
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'primary.dark' }}>
                    {selectedEmployee.EmployeeCode}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    {selectedEmployee.Department} • {selectedEmployee.Designation}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={selectedEmployee.Status || 'Active'}
                      color={getEmployeeStatusColor(selectedEmployee.Status)}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={selectedEmployee.EmployeeType || 'Full-time'}
                      variant="outlined"
                      size="small"
                      sx={{ color: 'primary.main', borderColor: alpha('primary.main', 0.3) }}
                    />
                  </Box>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{ color: 'primary.main' }}
                >
                  <RefreshIcon />
                </IconButton>
                <IconButton 
                  onClick={() => alert('Settings coming soon!')}
                  sx={{ color: 'primary.main' }}
                >
                  <SettingsIcon />
                </IconButton>
              </Box>
            </Box>
          </Paper>

          {/* Navigation Tabs */}
          <Card sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab
                icon={<DashboardIcon />}
                label="Overview"
                {...a11yProps(0)}
                sx={{ minHeight: 72 }}
              />
              <Tab
                icon={<PersonIcon />}
                label="Profile"
                {...a11yProps(1)}
                sx={{ minHeight: 72 }}
              />
              <Tab
                icon={<TaskIcon />}
                label="Tasks"
                {...a11yProps(2)}
                sx={{ minHeight: 72 }}
              />
              <Tab
                icon={<PerformanceIcon />}
                label="Performance"
                {...a11yProps(3)}
                sx={{ minHeight: 72 }}
              />
              <Tab
                icon={<AttendanceIcon />}
                label="Attendance"
                {...a11yProps(4)}
                sx={{ minHeight: 72 }}
              />

              <Tab
                icon={
                  <Badge badgeContent={dashboardSummary?.notifications?.unread || 0} color="error">
                    <NotificationIcon />
                  </Badge>
                }
                label="Notifications"
                {...a11yProps(5)}
                sx={{ minHeight: 72 }}
              />
            </Tabs>
          </Card>

          {/* Tab Content */}
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <TabPanel value={activeTab} index={0}>
                <DashboardOverview
                  employee={selectedEmployee}
                  profile={employeeProfile}
                  summary={dashboardSummary}
                  onRefresh={handleRefresh}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <ProfileTab
                  employee={selectedEmployee}
                  profile={employeeProfile}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <TasksTab
                  employeeCode={selectedEmployee.EmployeeCode}
                  tasks={employeeProfile?.tasks || []}
                  onTaskUpdate={loadEmployeeData}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={3}>
                <PerformanceTab
                  employeeCode={selectedEmployee.EmployeeCode}
                  performance={employeeProfile?.performance || []}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={4}>
                <AttendanceTab
                  employeeCode={selectedEmployee.EmployeeCode}
                  attendance={employeeProfile?.attendance || []}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={5}>
                <NotificationsTab
                  employeeCode={selectedEmployee.EmployeeCode}
                  notifications={dashboardSummary?.notifications?.recent || []}
                  onNotificationRead={loadEmployeeData}
                />
              </TabPanel>
            </>
          )}
        </Box>
      )}

      {/* Floating Refresh Button */}
      {selectedEmployee && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshIcon />
        </Fab>
      )}
    </Container>
  );
};

export default EmployeeDashboard;
