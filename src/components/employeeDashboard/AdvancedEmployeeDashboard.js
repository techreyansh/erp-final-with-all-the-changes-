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
  Slide,
  Zoom,
  Grow,
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
  TablePagination,
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
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Work as WorkIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AdminPanelSettings as AdminPanelIcon
} from '@mui/icons-material';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import employeeService from '../../services/employeeService';
import EmployeeCard from './EmployeeCard';
import EmployeeForm from './EmployeeForm';
import EmployeeDetailView from './EmployeeDetailView';
import DashboardOverview from './DashboardOverview';
import AdvancedProfileTab from './AdvancedProfileTab';
import EnhancedTasksTab from './EnhancedTasksTab';
import PerformanceTab from './PerformanceTab';
import EnhancedAttendanceTab from './EnhancedAttendanceTab';
import NotificationsTab from './NotificationsTab';
import { useAuth } from '../../context/AuthContext';
import { checkIsSuperAdmin } from '../../services/adminAccessService';
import AdminAccessControlSection from './AdminAccessControlSection';

// Animation components (using regular MUI components for now)
const MotionBox = Box;
const MotionCard = Card;
const MotionGrid = Grid;

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

const AdvancedEmployeeDashboard = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ok = await checkIsSuperAdmin();
        if (!cancelled) setIsSuperAdmin(!!ok);
      } catch {
        if (!cancelled) setIsSuperAdmin(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const isCEO =
    (user?.role || '').toUpperCase() === 'CEO' ||
    (user?.role || '').toUpperCase() === 'DIRECTOR' ||
    isSuperAdmin;
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  
  // Dialog States
  const [employeeFormOpen, setEmployeeFormOpen] = useState(false);
  const [employeeDetailOpen, setEmployeeDetailOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  
  // Menu States
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Load employees on component mount
  useEffect(() => {
    loadEmployees();
  }, []);

  // Filter and search employees
  useEffect(() => {
    filterAndSearchEmployees();
  }, [employees, searchTerm, filterDepartment, filterStatus, sortBy, sortOrder]);

  const loadEmployees = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const employeesData = await employeeService.getAllEmployees(forceRefresh);
      setEmployees(employeesData);
      
      if (!isCEO) {
        // Restrict non-CEO users to their own profile
        // Try multiple matching strategies to support both mock and real logins
        const currentEmail = (user?.email || '').toLowerCase().trim();
        const currentRole = (user?.role || '').toLowerCase().trim();

        // Try exact email match first
        let selfEmp = (employeesData || []).find(emp => 
          (emp.Email || '').toLowerCase().trim() === currentEmail
        );
        
        // If not found and it's a mock user, try matching by role/designation
        if (!selfEmp && currentEmail.includes('mock')) {
          // Clean up the role for matching (remove spaces and special chars)
          const roleKeywords = currentRole.toLowerCase().split(' ').filter(word => word.length > 2);
          
          selfEmp = (employeesData || []).find(emp => {
            const designation = (emp.Designation || '').toLowerCase();
            const department = (emp.Department || '').toLowerCase();
            const email = (emp.Email || '').toLowerCase();
            
            // Check if any role keyword matches designation, department, or email
            return roleKeywords.some(keyword => 
              designation.includes(keyword) || 
              department.includes(keyword) ||
              email.includes(keyword)
            );
          });
          
          // If still not found, try matching the full role string
          if (!selfEmp) {
            selfEmp = (employeesData || []).find(emp => 
              (emp.Designation || '').toLowerCase().replace(/\s+/g, '') === currentRole.replace(/\s+/g, '') ||
              (emp.Department || '').toLowerCase().replace(/\s+/g, '') === currentRole.replace(/\s+/g, '')
            );
          }
        }
        
        // If still not found, try partial email match (before @)
        if (!selfEmp) {
          const emailPrefix = currentEmail.split('@')[0].replace('mock.', '');
          selfEmp = (employeesData || []).find(emp => 
            (emp.Email || '').toLowerCase().includes(emailPrefix)
          );
        }
        
        if (selfEmp) {
          setFilteredEmployees([selfEmp]);
          setSelectedEmployee(selfEmp);
          // Automatically load the employee data
          loadEmployeeData(selfEmp);
        } else {
          console.warn('No employee profile found for:', currentEmail);
          setFilteredEmployees([]);
          setSelectedEmployee(null);
          setError(`Your employee profile was not found. Please ensure your email (${currentEmail}) matches an employee record in the system, or contact admin.`);
        }
      }
    } catch (err) {
      console.error('Error loading employees:', err);
      setError('Failed to load employees: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeData = async (employee) => {
    if (!employee) return;

    try {
      setLoading(true);
      setError(null);
      
      const [profile, summary] = await Promise.all([
        employeeService.getEmployeeProfile(employee.EmployeeCode),
        employeeService.getDashboardSummary(employee.EmployeeCode)
      ]);

      setEmployeeProfile(profile);
      setDashboardSummary(summary);
    } catch (err) {
      setError('Failed to load employee data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSearchEmployees = () => {
    // For non-CEO users, only show their own profile - don't apply other filters
    if (!isCEO) {
      const currentEmail = (user?.email || '').toLowerCase().trim();
      const currentRole = (user?.role || '').toLowerCase().trim();
      
      // Try exact email match first
      let selfEmp = employees.find(emp => 
        (emp.Email || '').toLowerCase().trim() === currentEmail
      );
      
      // If not found and it's a mock user, try matching by role/designation
      if (!selfEmp && currentEmail.includes('mock')) {
        // Clean up the role for matching (remove spaces and special chars)
        const roleKeywords = currentRole.toLowerCase().split(' ').filter(word => word.length > 2);
        
        selfEmp = employees.find(emp => {
          const designation = (emp.Designation || '').toLowerCase();
          const department = (emp.Department || '').toLowerCase();
          const email = (emp.Email || '').toLowerCase();
          
          // Check if any role keyword matches designation, department, or email
          return roleKeywords.some(keyword => 
            designation.includes(keyword) || 
            department.includes(keyword) ||
            email.includes(keyword)
          );
        });
        
        // If still not found, try matching the full role string
        if (!selfEmp) {
          selfEmp = employees.find(emp => 
            (emp.Designation || '').toLowerCase().replace(/\s+/g, '') === currentRole.replace(/\s+/g, '') ||
            (emp.Department || '').toLowerCase().replace(/\s+/g, '') === currentRole.replace(/\s+/g, '')
          );
        }
      }
      
      // If still not found, try partial email match (before @)
      if (!selfEmp) {
        const emailPrefix = currentEmail.split('@')[0].replace('mock.', '');
        selfEmp = employees.find(emp => 
          (emp.Email || '').toLowerCase().includes(emailPrefix)
        );
      }
      
      setFilteredEmployees(selfEmp ? [selfEmp] : []);
      setPage(0);
      return;
    }

    // For CEO and authorized users, apply all filters
    let filtered = [...employees];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.EmployeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.EmployeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.Department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.Designation?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Department filter
    if (filterDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.Department === filterDepartment);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(emp => emp.Status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.EmployeeName || '';
          bValue = b.EmployeeName || '';
          break;
        case 'department':
          aValue = a.Department || '';
          bValue = b.Department || '';
          break;
        case 'joiningDate':
          aValue = new Date(a.JoiningDate || 0);
          bValue = new Date(b.JoiningDate || 0);
          break;
        default:
          aValue = a.EmployeeCode || '';
          bValue = b.EmployeeCode || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredEmployees(filtered);
    setPage(0); // Reset to first page when filtering
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    loadEmployeeData(employee);
    setActiveTab(0); // Reset to overview tab
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEmployees(true); // Force refresh to bypass cache
    if (selectedEmployee) {
      await loadEmployeeData(selectedEmployee);
    }
    setRefreshing(false);
  };

  const handleAddEmployee = () => {
    if (!isCEO) return; // only CEO can add
    setEditingEmployee(null);
    setEmployeeFormOpen(true);
  };

  const handleEditEmployee = (employee) => {
    if (!isCEO) return; // only CEO can edit
    setEditingEmployee(employee);
    setEmployeeFormOpen(true);
  };

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEmployeeDetailOpen(true);
  };

  const handleEmployeeSave = async (employeeData) => {
    try {
      if (editingEmployee) {
        // Update existing employee
        if (!isCEO) throw new Error('Only CEO can update employee profiles');
        await employeeService.updateEmployee(editingEmployee.EmployeeCode, employeeData);
      } else {
        // Create new employee
        if (!isCEO) throw new Error('Only CEO can create employees');
        await employeeService.createEmployee(employeeData);
      }
      
      setEmployeeFormOpen(false);
      setEditingEmployee(null);
      await loadEmployees(true); // Force refresh to bypass cache
    } catch (error) {
      setError('Failed to save employee: ' + error.message);
    }
  };

  const handleDeleteEmployee = async (employee) => {
    if (!isCEO) return; // only CEO can delete
    if (!employee) return;
    const code = employee?.EmployeeCode;
    const name = employee?.EmployeeName || code;
    const confirmed = window.confirm(`Delete employee ${name}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      // Optimistic update
      setEmployees(prev => (Array.isArray(prev) ? prev.filter(e => e.EmployeeCode !== code) : prev));
      await employeeService.deleteEmployee(code);
      if (selectedEmployee && selectedEmployee.EmployeeCode === code) {
        setSelectedEmployee(null);
      }
      setNotification({ open: true, message: 'Employee deleted successfully', severity: 'success' });
    } catch (error) {
      setError('Failed to delete employee: ' + error.message);
      setNotification({ open: true, message: `Failed to delete employee: ${error.message}` , severity: 'error' });
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const getDepartments = () => {
    const departments = [...new Set(employees.map(emp => emp.Department).filter(Boolean))];
    return departments.sort();
  };

  const getStatusList = () => {
    const statuses = [...new Set(employees.map(emp => emp.Status).filter(Boolean))];
    return statuses.sort();
  };

  // Pagination
  const paginatedEmployees = filteredEmployees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Animation variants (placeholders for now)
  const containerVariants = {};
  const itemVariants = {};

  if (loading && employees.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={2}>
          {[...Array(12)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={index}>
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
          
          <Grid container spacing={0} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={8}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {isCEO ? 'Employee Dashboard' : 'My Dashboard'}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                {isCEO ? 'Manage your workforce with advanced tools and insights' : 'View your profile, tasks, and performance'}
              </Typography>
              {isCEO && (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<GroupIcon />}
                    label={`${employees.length} Employees`}
                    sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
                  />
                  <Chip
                    icon={<WorkIcon />}
                    label={`${getDepartments().length} Departments`}
                    sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main' }}
                  />
                </Box>
              )}
              {!isCEO && selectedEmployee && (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<WorkIcon />}
                    label={selectedEmployee.Department || 'N/A'}
                    sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
                  />
                  <Chip
                    icon={<PersonIcon />}
                    label={selectedEmployee.Designation || 'N/A'}
                    sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main' }}
                  />
                </Box>
              )}
            </Grid>
            {isCEO && (
              <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' }, display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={handleAddEmployee}
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    fontWeight: 600,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.16),
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Add New Employee
                </Button>
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>

      {error && (
        <Fade in={!!error}>
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        </Fade>
      )}

      {/* Controls Section - Only show for CEO */}
      {isCEO && (
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
                    bgcolor: alpha(theme.palette.primary.main, 0.02)
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {/* Filter Button */}
                <Button
                  startIcon={<FilterIcon />}
                  onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                >
                  Filter
                </Button>
                
                {/* Sort Button */}
                <Button
                  startIcon={<SortIcon />}
                  onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                >
                  Sort
                </Button>

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
      )}

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
      >
        <MenuItem>
          <FormControl fullWidth size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              label="Department"
            >
              <MenuItem value="all">All Departments</MenuItem>
              {getDepartments().map(dept => (
                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </MenuItem>
        <MenuItem>
          <FormControl fullWidth size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">All Status</MenuItem>
              {getStatusList().map(status => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </MenuItem>
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setSortBy('name'); setSortMenuAnchor(null); }}>
          Sort by Name
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('department'); setSortMenuAnchor(null); }}>
          Sort by Department
        </MenuItem>
        <MenuItem onClick={() => { setSortBy('joiningDate'); setSortMenuAnchor(null); }}>
          Sort by Joining Date
        </MenuItem>
        <MenuItem>
          <FormControlLabel
            control={
              <Switch
                checked={sortOrder === 'desc'}
                onChange={(e) => setSortOrder(e.target.checked ? 'desc' : 'asc')}
              />
            }
            label="Descending"
          />
        </MenuItem>
      </Menu>

      {/* Employee Grid/List - Only show for CEO */}
      {isCEO && (
        <>
          <Grid container spacing={2}>
            {paginatedEmployees.map((employee, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                lg={3}
                xl={2}
                key={employee.EmployeeCode}
              >
                <Box sx={{ height: '100%', p: 0.5 }}>
                  <EmployeeCard
                    employee={employee}
                    onSelect={() => handleEmployeeSelect(employee)}
                    onEdit={isCEO ? (() => handleEditEmployee(employee)) : undefined}
                    onView={() => handleViewEmployee(employee)}
                    onDelete={isCEO ? (() => handleDeleteEmployee(employee)) : undefined}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Enhanced Pagination */}
          {filteredEmployees.length > 0 && (
            <Paper sx={{ mt: 3, borderRadius: 3 }}>
              <TablePagination
            component="div"
            count={filteredEmployees.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[6, 12, 18, 24]}
            labelRowsPerPage="Employees per page:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}–${to} of ${count !== -1 ? count : `more than ${to}`} employees`
            }
            sx={{
              '& .MuiTablePagination-toolbar': {
                paddingLeft: 3,
                paddingRight: 3,
                minHeight: 64
              },
              '& .MuiTablePagination-selectLabel': {
                fontWeight: 600,
                color: 'text.primary'
              },
              '& .MuiTablePagination-displayedRows': {
                fontWeight: 600,
                color: 'text.primary'
              },
              '& .MuiTablePagination-select': {
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                paddingLeft: 1,
                paddingRight: 3
              },
              '& .MuiTablePagination-actions': {
                '& .MuiIconButton-root': {
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider',
                  margin: '0 2px',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.1)
                  },
                  '&.Mui-disabled': {
                    borderColor: 'divider',
                    opacity: 0.5
                  }
                }
              }
            }}
          />
        </Paper>
          )}
        </>
      )}

      {/* Selected Employee Dashboard */}
      {selectedEmployee && (
        <Slide direction="up" in={!!selectedEmployee} timeout={500}>
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
                    {selectedEmployee.EmployeeName?.charAt(0) || 'E'}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {selectedEmployee.EmployeeName || 'Unknown Employee'}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      {selectedEmployee.EmployeeCode}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      {selectedEmployee.Department} • {selectedEmployee.Designation}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={selectedEmployee.Status || 'Active'}
                        color="success"
                        size="small"
                      />
                      <Chip
                        label={selectedEmployee.EmployeeType || 'Full-time'}
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
                    onClick={() => alert('Settings coming soon!')}
                    sx={{ 
                      bgcolor: 'white',
                      boxShadow: theme.shadows[2],
                      '&:hover': { bgcolor: alpha('#fff', 0.9) }
                    }}
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
                  sx={{ gap: 1 }}
                />
                <Tab
                  icon={<PersonIcon />}
                  label="Profile"
                  sx={{ gap: 1 }}
                />
                <Tab
                  icon={<TaskIcon />}
                  label="Tasks"
                  sx={{ gap: 1 }}
                />
                <Tab
                  icon={<PerformanceIcon />}
                  label="Performance"
                  sx={{ gap: 1 }}
                />
                <Tab
                  icon={<AttendanceIcon />}
                  label="Attendance"
                  sx={{ gap: 1 }}
                />

                <Tab
                  icon={
                    <Badge badgeContent={dashboardSummary?.notifications?.unread || 0} color="error">
                      <NotificationIcon />
                    </Badge>
                  }
                  label="Notifications"
                  sx={{ gap: 1 }}
                />
                {isSuperAdmin && (
                  <Tab icon={<AdminPanelIcon />} label="Admin Access" sx={{ gap: 1 }} />
                )}
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
                    employeeCode={selectedEmployee.EmployeeCode}
                    onTaskUpdate={() => loadEmployeeData(selectedEmployee)}
                  />
                </TabPanel>

                <TabPanel value={activeTab} index={3}>
                  <PerformanceTab
                    employeeCode={selectedEmployee.EmployeeCode}
                    performance={employeeProfile?.performance || []}
                  />
                </TabPanel>

                                 <TabPanel value={activeTab} index={4}>
                   <EnhancedAttendanceTab
                     employeeCode={selectedEmployee.EmployeeCode}
                     onUpdate={() => loadEmployeeData(selectedEmployee)}
                   />
                 </TabPanel>

                <TabPanel value={activeTab} index={5}>
                  <NotificationsTab
                    employeeCode={selectedEmployee.EmployeeCode}
                    notifications={dashboardSummary?.notifications?.recent || []}
                    onNotificationRead={() => loadEmployeeData(selectedEmployee)}
                  />
                </TabPanel>
                {isSuperAdmin && (
                  <TabPanel value={activeTab} index={6}>
                    <AdminAccessControlSection userEmail={user?.email} />
                  </TabPanel>
                )}
              </>
            )}
          </Box>
        </Slide>
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
      {isCEO && (
        <Zoom in={!selectedEmployee} timeout={300}>
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
        </Zoom>
      )}

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

export default AdvancedEmployeeDashboard;
