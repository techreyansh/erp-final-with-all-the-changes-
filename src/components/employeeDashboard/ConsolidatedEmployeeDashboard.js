import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Fade,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Pagination,
  Skeleton,
  useTheme,
  alpha,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Snackbar
} from '@mui/material';
import {
  Person as PersonIcon,
  Assignment as TaskIcon,
  TrendingUp as PerformanceIcon,
  Schedule as AttendanceIcon,
  Notifications as NotificationIcon,
  Dashboard as DashboardIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Group as GroupIcon,
  Work as WorkIcon
} from '@mui/icons-material';

// Components
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import EmployeeCard from './EmployeeCard';
import EmployeeForm from './EmployeeForm';
import EmployeeDetailView from './EmployeeDetailView';
import DashboardOverview from './DashboardOverview';
import AdvancedProfileTab from './AdvancedProfileTab';
import EnhancedTasksTab from './EnhancedTasksTab';
import PerformanceTab from './PerformanceTab';
import EnhancedAttendanceTab from './EnhancedAttendanceTab';
import NotificationsTab from './NotificationsTab';

// Services
import employeeService from '../../services/employeeService';

// Utility function for safe property access
const safeGet = (obj, path, defaultValue = '') => {
  try {
    return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
  } catch {
    return defaultValue;
  }
};

// Tab panel component with accessibility
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
        <Fade in={value === index} timeout={300}>
          <Box sx={{ py: 3 }}>
            {children}
          </Box>
        </Fade>
      )}
    </div>
  );
}

// Accessibility helper
function a11yProps(index) {
  return {
    id: `employee-tab-${index}`,
    'aria-controls': `employee-tabpanel-${index}`,
  };
}

const ConsolidatedEmployeeDashboard = () => {
  const theme = useTheme();
  
  // Core state
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  
  // Dialog states
  const [employeeFormOpen, setEmployeeFormOpen] = useState(false);
  const [employeeDetailOpen, setEmployeeDetailOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  
  // Menu states
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  
  // Notification state
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Load employees on component mount
  useEffect(() => {
    loadEmployees();
  }, []);

  // Filter and search employees
  useEffect(() => {
    filterAndSearchEmployees();
  }, [employees, searchTerm, filterDepartment, filterStatus, sortBy, sortOrder]);

  // Load employee data when employee is selected
  useEffect(() => {
    if (selectedEmployee?.EmployeeCode) {
      loadEmployeeData(selectedEmployee);
    }
  }, [selectedEmployee]);

  const loadEmployees = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const employeesData = await employeeService.getAllEmployees(forceRefresh);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
    } catch (err) {
      console.error('Error loading employees:', err);
      setError(`Failed to load employees: ${err.message}`);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEmployeeData = useCallback(async (employee) => {
    if (!employee?.EmployeeCode) {
      console.warn('No employee code provided for loading data');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [profile, summary] = await Promise.allSettled([
        employeeService.getEmployeeProfile(employee.EmployeeCode),
        employeeService.getDashboardSummary(employee.EmployeeCode)
      ]);

      // Handle profile result
      if (profile.status === 'fulfilled') {
        setEmployeeProfile(profile.value || null);
      } else {
        console.error('Failed to load employee profile:', profile.reason);
        setEmployeeProfile(null);
      }

      // Handle summary result
      if (summary.status === 'fulfilled') {
        setDashboardSummary(summary.value || null);
      } else {
        console.error('Failed to load dashboard summary:', summary.reason);
        setDashboardSummary(null);
      }

    } catch (err) {
      console.error('Error loading employee data:', err);
      setError(`Failed to load employee data: ${err.message}`);
      setEmployeeProfile(null);
      setDashboardSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterAndSearchEmployees = useCallback(() => {
    if (!Array.isArray(employees)) {
      setFilteredEmployees([]);
      return;
    }

    let filtered = [...employees];

    // Search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(emp =>
        safeGet(emp, 'EmployeeName', '').toLowerCase().includes(lowerSearchTerm) ||
        safeGet(emp, 'EmployeeCode', '').toLowerCase().includes(lowerSearchTerm) ||
        safeGet(emp, 'Department', '').toLowerCase().includes(lowerSearchTerm) ||
        safeGet(emp, 'Designation', '').toLowerCase().includes(lowerSearchTerm) ||
        safeGet(emp, 'Email', '').toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Department filter
    if (filterDepartment !== 'all') {
      filtered = filtered.filter(emp => safeGet(emp, 'Department') === filterDepartment);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(emp => safeGet(emp, 'Status') === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = safeGet(a, 'EmployeeName', '');
          bValue = safeGet(b, 'EmployeeName', '');
          break;
        case 'department':
          aValue = safeGet(a, 'Department', '');
          bValue = safeGet(b, 'Department', '');
          break;
        case 'joiningDate':
          aValue = new Date(safeGet(a, 'JoiningDate', '1970-01-01'));
          bValue = new Date(safeGet(b, 'JoiningDate', '1970-01-01'));
          break;
        default:
          aValue = safeGet(a, 'EmployeeCode', '');
          bValue = safeGet(b, 'EmployeeCode', '');
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredEmployees(filtered);
    setPage(0); // Reset to first page when filtering
  }, [employees, searchTerm, filterDepartment, filterStatus, sortBy, sortOrder]);

  // Memoized computed values
  const departments = useMemo(() => {
    if (!Array.isArray(employees)) return [];
    const depts = [...new Set(employees.map(emp => safeGet(emp, 'Department')).filter(Boolean))];
    return depts.sort();
  }, [employees]);

  const statusList = useMemo(() => {
    if (!Array.isArray(employees)) return [];
    const statuses = [...new Set(employees.map(emp => safeGet(emp, 'Status')).filter(Boolean))];
    return statuses.sort();
  }, [employees]);

  const paginatedEmployees = useMemo(() => {
    if (!Array.isArray(filteredEmployees)) return [];
    return filteredEmployees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredEmployees, page, rowsPerPage]);

  // Event handlers
  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  const handleEmployeeSelect = useCallback((employee) => {
    if (!employee) return;
    setSelectedEmployee(employee);
    setActiveTab(0); // Reset to overview tab
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadEmployees(true); // Force refresh to bypass cache
      if (selectedEmployee?.EmployeeCode) {
        await loadEmployeeData(selectedEmployee);
      }
      showNotification('Data refreshed successfully', 'success');
    } catch (error) {
      showNotification('Failed to refresh data', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [loadEmployees, loadEmployeeData, selectedEmployee]);

  const handleAddEmployee = useCallback(() => {
    setEditingEmployee(null);
    setEmployeeFormOpen(true);
  }, []);

  const handleEditEmployee = useCallback((employee) => {
    setEditingEmployee(employee);
    setEmployeeFormOpen(true);
  }, []);

  const handleViewEmployee = useCallback((employee) => {
    setSelectedEmployee(employee);
    setEmployeeDetailOpen(true);
  }, []);

  const handleEmployeeSave = useCallback(async (employeeData) => {
    try {
      if (editingEmployee) {
        await employeeService.updateEmployee(editingEmployee.EmployeeCode, employeeData);
        showNotification('Employee updated successfully', 'success');
      } else {
        await employeeService.createEmployee(employeeData);
        showNotification('Employee created successfully', 'success');
      }
      
      setEmployeeFormOpen(false);
      setEditingEmployee(null);
      await loadEmployees(true); // Force refresh to bypass cache
    } catch (error) {
      console.error('Error saving employee:', error);
      showNotification(`Failed to save employee: ${error.message}`, 'error');
    }
  }, [editingEmployee, loadEmployees]);

  const handleDeleteEmployee = useCallback(async (employee) => {
    if (!employee) return;
    const code = safeGet(employee, 'EmployeeCode');
    const name = safeGet(employee, 'EmployeeName', code);
    const confirmed = window.confirm(`Delete employee ${name}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await employeeService.deleteEmployee(code);
      showNotification('Employee deleted successfully', 'success');
      if (selectedEmployee && safeGet(selectedEmployee, 'EmployeeCode') === code) {
        setSelectedEmployee(null);
      }
      await loadEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      showNotification(`Failed to delete employee: ${error.message}`, 'error');
    }
  }, [loadEmployees, selectedEmployee, showNotification]);

  const showNotification = useCallback((message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  }, []);

  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Loading skeleton
  if (loading && employees.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {[...Array(12)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.secondary.main, 0.12)})`,
          borderRadius: 3,
          p: 4,
          color: 'primary.main',
          position: 'relative',
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
        }}>
          <Box sx={{ 
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: alpha(theme.palette.primary.main, 0.05),
            borderRadius: '50%'
          }} />
          
          <Grid container spacing={3} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={8}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                Employee Dashboard
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                Manage your workforce with advanced tools and insights
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<GroupIcon />}
                  label={`${employees.length} Employees`}
                  sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
                />
                <Chip
                  icon={<WorkIcon />}
                  label={`${departments.length} Departments`}
                  sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main' }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' }, display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleAddEmployee}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.9),
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Add New Employee
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Fade in={!!error}>
          <Alert 
            severity="error" 
            sx={{ mb: 3 }} 
            onClose={() => setError(null)}
            action={
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </Fade>
      )}

      {/* Controls Section */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.04)
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {/* Filter Controls */}
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  label="Department"
                >
                  <MenuItem value="all">All Departments</MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  {statusList.map(status => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Sort Controls */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="department">Department</MenuItem>
                  <MenuItem value="joiningDate">Joining Date</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={sortOrder === 'desc'}
                    onChange={(e) => setSortOrder(e.target.checked ? 'desc' : 'asc')}
                    size="small"
                  />
                }
                label="Desc"
              />

              {/* Refresh Button */}
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{ 
                  border: 1, 
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Employee Grid/List */}
      {paginatedEmployees.length > 0 ? (
        <>
          <Grid container spacing={2}>
            {paginatedEmployees.map((employee) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                lg={3}
                xl={2}
                key={safeGet(employee, 'EmployeeCode', Math.random())}
              >
                <Box sx={{ height: '100%', p: 0.5 }}>
                  <EmployeeCard
                    employee={employee}
                    onSelect={() => handleEmployeeSelect(employee)}
                    onEdit={() => handleEditEmployee(employee)}
                    onView={() => handleViewEmployee(employee)}
                    onDelete={() => handleDeleteEmployee(employee)}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Enhanced Pagination */}
          {filteredEmployees.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              p: 2,
              mt: 3,
              borderRadius: 3,
              backgroundColor: 'rgba(248, 250, 255, 0.5)',
              border: '1px solid rgba(102, 126, 234, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                  Rows per page:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <Select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(e.target.value);
                      setPage(0);
                    }}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(102, 126, 234, 0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(102, 126, 234, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#667eea',
                      }
                    }}
                  >
                    <MenuItem value={6}>6</MenuItem>
                    <MenuItem value={12}>12</MenuItem>
                    <MenuItem value={18}>18</MenuItem>
                    <MenuItem value={24}>24</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                  {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
                </Typography>
                
                {Math.ceil(filteredEmployees.length / rowsPerPage) > 1 && (
                  <Pagination
                    count={Math.ceil(filteredEmployees.length / rowsPerPage)}
                    page={page + 1}
                    onChange={(event, value) => setPage(value - 1)}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                    sx={{
                      '& .MuiPaginationItem-root': {
                        borderRadius: 3,
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        minWidth: 36,
                        height: 36,
                        margin: '0 2px',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                        },
                        '&.Mui-selected': {
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          fontWeight: 800,
                          boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                          '&:hover': {
                            transform: 'scale(1.15)',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.4)'
                          }
                        }
                      }
                    }}
                  />
                )}
              </Box>
            </Box>
          )}
        </>
      ) : (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No employees found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {employees.length === 0 
              ? 'No employees in the system yet.'
              : 'No employees match the current filters.'
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddEmployee}
          >
            Add First Employee
          </Button>
        </Card>
      )}

      {/* Selected Employee Dashboard */}
      {selectedEmployee && (
        <Fade in={!!selectedEmployee} timeout={500}>
          <Box sx={{ mt: 4 }}>
            {/* Employee Header */}
            <Paper sx={{ 
              p: 3, 
              mb: 3, 
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
              borderRadius: 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Avatar
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: 'primary.main',
                      fontSize: '2rem',
                      border: 4,
                      borderColor: 'white',
                      boxShadow: theme.shadows[4]
                    }}
                  >
                    {safeGet(selectedEmployee, 'EmployeeName', 'E').charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {safeGet(selectedEmployee, 'EmployeeName', 'Unknown Employee')}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      {safeGet(selectedEmployee, 'EmployeeCode')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      {safeGet(selectedEmployee, 'Department')} • {safeGet(selectedEmployee, 'Designation')}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={safeGet(selectedEmployee, 'Status', 'Active')}
                        color="success"
                        size="small"
                      />
                      <Chip
                        label={safeGet(selectedEmployee, 'EmployeeType', 'Full-time')}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    onClick={handleRefresh}
                    disabled={refreshing}
                    sx={{ 
                      bgcolor: 'white',
                      boxShadow: theme.shadows[2],
                      '&:hover': { bgcolor: alpha('#fff', 0.9) }
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleEditEmployee(selectedEmployee)}
                    sx={{ 
                      bgcolor: 'white',
                      boxShadow: theme.shadows[2],
                      '&:hover': { bgcolor: alpha('#fff', 0.9) }
                    }}
                  >
                    <EditIcon />
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
                sx={{ 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  '& .MuiTab-root': {
                    minHeight: 72,
                    fontWeight: 600
                  }
                }}
              >
                <Tab
                  icon={<DashboardIcon />}
                  label="Overview"
                  {...a11yProps(0)}
                />
                <Tab
                  icon={<PersonIcon />}
                  label="Profile"
                  {...a11yProps(1)}
                />
                <Tab
                  icon={<TaskIcon />}
                  label="Tasks"
                  {...a11yProps(2)}
                />
                <Tab
                  icon={<PerformanceIcon />}
                  label="Performance"
                  {...a11yProps(3)}
                />
                <Tab
                  icon={<AttendanceIcon />}
                  label="Attendance"
                  {...a11yProps(4)}
                />
                <Tab
                  icon={
                    <Badge badgeContent={safeGet(dashboardSummary, 'notifications.unread', 0)} color="error">
                      <NotificationIcon />
                    </Badge>
                  }
                  label="Notifications"
                  {...a11yProps(5)}
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
                  <AdvancedProfileTab
                    employee={selectedEmployee}
                    profile={employeeProfile}
                    onUpdate={async () => {
                      await loadEmployees(true); // Force refresh to bypass cache
                      // Update selectedEmployee with fresh data
                      const freshEmployees = await employeeService.getAllEmployees(true);
                      const updatedEmployee = freshEmployees.find(emp => emp.EmployeeCode === selectedEmployee?.EmployeeCode);
                      if (updatedEmployee) {
                        setSelectedEmployee(updatedEmployee);
                      }
                      await loadEmployeeData(selectedEmployee);
                    }}
                  />
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                  <EnhancedTasksTab
                    employeeCode={safeGet(selectedEmployee, 'EmployeeCode')}
                    onTaskUpdate={() => loadEmployeeData(selectedEmployee)}
                  />
                </TabPanel>

                <TabPanel value={activeTab} index={3}>
                  <PerformanceTab
                    employeeCode={safeGet(selectedEmployee, 'EmployeeCode')}
                    performance={safeGet(employeeProfile, 'performance', [])}
                  />
                </TabPanel>

                <TabPanel value={activeTab} index={4}>
                  <EnhancedAttendanceTab
                    employeeCode={safeGet(selectedEmployee, 'EmployeeCode')}
                    onUpdate={() => loadEmployeeData(selectedEmployee)}
                  />
                </TabPanel>

                <TabPanel value={activeTab} index={5}>
                  <NotificationsTab
                    employeeCode={safeGet(selectedEmployee, 'EmployeeCode')}
                    notifications={safeGet(dashboardSummary, 'notifications.recent', [])}
                    onNotificationRead={() => loadEmployeeData(selectedEmployee)}
                  />
                </TabPanel>
              </>
            )}
          </Box>
        </Fade>
      )}

      {/* Employee Form Dialog */}
      <EmployeeForm
        open={employeeFormOpen}
        onClose={() => setEmployeeFormOpen(false)}
        employee={editingEmployee}
        onSave={handleEmployeeSave}
      />

      {/* Employee Detail Dialog */}
      <EmployeeDetailView
        open={employeeDetailOpen}
        onClose={() => setEmployeeDetailOpen(false)}
        employee={selectedEmployee}
      />

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ 
          position: 'fixed', 
          bottom: 24, 
          right: 24,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
        }}
        onClick={handleAddEmployee}
      >
        <AddIcon />
      </Fab>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ConsolidatedEmployeeDashboard;
