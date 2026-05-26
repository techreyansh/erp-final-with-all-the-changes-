import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  LinearProgress,
  Alert,
  Snackbar,
  Fab,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  Badge,
  Menu,
  Divider,
  ListItemIcon,
  ListItemText,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Schedule as AttendanceIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  AccessTime as TimeIcon,
  Event as EventIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  MoreVert as MoreIcon,
  Work as WorkIcon,
  Timer as TimerIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import employeeService from '../../services/employeeService';

const localizer = momentLocalizer(moment);

const EnhancedAttendanceTab = ({ employeeCode, onUpdate }) => {
  const theme = useTheme();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attendanceFormOpen, setAttendanceFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'calendar'
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Menu states
  const [menuAnchor, setMenuAnchor] = useState(null);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const [attendanceForm, setAttendanceForm] = useState({
    EmployeeCode: employeeCode,
    Date: new Date().toISOString().split('T')[0],
    Status: 'Present',
    ClockIn: '',
    ClockOut: '',
    WorkingHours: '',
    Notes: '',
    Remarks: ''
  });

  const statusOptions = [
    { value: 'Present', label: 'Present', color: 'success' },
    { value: 'Absent', label: 'Absent', color: 'error' },
    { value: 'Half Day', label: 'Half Day', color: 'warning' },
    { value: 'Leave', label: 'Leave', color: 'info' },
    { value: 'Holiday', label: 'Holiday', color: 'default' },
    { value: 'Work From Home', label: 'Work From Home', color: 'primary' }
  ];

  useEffect(() => {
    if (employeeCode) {
      loadAttendanceData();
    }
  }, [employeeCode]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getEmployeeAttendance(employeeCode, 90); // Get last 90 days
      setAttendanceData(data);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to load attendance data: ' + error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = () => {
    setEditingRecord(null);
    setAttendanceForm({
      EmployeeCode: employeeCode,
      Date: new Date().toISOString().split('T')[0],
      Status: 'Present',
      ClockIn: '',
      ClockOut: '',
      WorkingHours: '',
      Notes: '',
      Remarks: ''
    });
    setAttendanceFormOpen(true);
  };

  const handleMarkTodayAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5);
    
    setEditingRecord(null);
    setAttendanceForm({
      EmployeeCode: employeeCode,
      Date: today,
      Status: 'Present',
      ClockIn: currentTime,
      ClockOut: '',
      WorkingHours: '',
      Notes: '',
      Remarks: ''
    });
    setAttendanceFormOpen(true);
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setAttendanceForm({
      ...record,
      ClockIn: record.ClockIn ? moment(record.ClockIn).format('HH:mm') : '',
      ClockOut: record.ClockOut ? moment(record.ClockOut).format('HH:mm') : ''
    });
    setAttendanceFormOpen(true);
  };

  const calculateWorkingHours = () => {
    if (attendanceForm.ClockIn && attendanceForm.ClockOut) {
      const clockIn = moment(`${attendanceForm.Date} ${attendanceForm.ClockIn}`);
      const clockOut = moment(`${attendanceForm.Date} ${attendanceForm.ClockOut}`);
      
      if (clockOut.isAfter(clockIn)) {
        const duration = moment.duration(clockOut.diff(clockIn));
        const hours = duration.asHours().toFixed(2);
        setAttendanceForm(prev => ({ ...prev, WorkingHours: hours }));
      }
    }
  };

  useEffect(() => {
    calculateWorkingHours();
  }, [attendanceForm.ClockIn, attendanceForm.ClockOut, attendanceForm.Date]);

  const handleSaveRecord = async () => {
    try {
      setLoading(true);
      
      // Prepare data with proper timestamp format
      const recordData = {
        ...attendanceForm,
        ClockIn: attendanceForm.ClockIn ? `${attendanceForm.Date}T${attendanceForm.ClockIn}:00` : '',
        ClockOut: attendanceForm.ClockOut ? `${attendanceForm.Date}T${attendanceForm.ClockOut}:00` : ''
      };
      
      if (editingRecord) {
        await employeeService.updateAttendanceRecord(employeeCode, attendanceForm.Date, recordData);
        setSnackbar({ open: true, message: 'Attendance record updated successfully!', severity: 'success' });
      } else {
        await employeeService.createAttendanceRecord(recordData);
        setSnackbar({ open: true, message: 'Attendance record created successfully!', severity: 'success' });
      }
      
      setAttendanceFormOpen(false);
      await loadAttendanceData();
      if (onUpdate) onUpdate();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save attendance record: ' + error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.color : 'default';
  };

  const getAttendanceStats = () => {
    const total = attendanceData.length;
    const present = attendanceData.filter(record => 
      ['Present', 'Work From Home'].includes(record.Status)
    ).length;
    const absent = attendanceData.filter(record => record.Status === 'Absent').length;
    const halfDay = attendanceData.filter(record => record.Status === 'Half Day').length;
    const leave = attendanceData.filter(record => record.Status === 'Leave').length;
    
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return { total, present, absent, halfDay, leave, attendanceRate };
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return moment(timeString).format('h:mm A');
  };

  const formatDate = (dateString) => {
    return moment(dateString).format('MMM DD, YYYY');
  };

  // Check if today's attendance is already marked
  const isTodayMarked = () => {
    const today = new Date().toISOString().split('T')[0];
    return attendanceData.some(record => record.Date === today);
  };

  // Calendar events for calendar view
  const calendarEvents = attendanceData.map(record => ({
    id: record.Date,
    title: record.Status,
    start: new Date(record.Date),
    end: new Date(record.Date),
    resource: record,
    color: getStatusColor(record.Status)
  }));

  const stats = getAttendanceStats();
  const paginatedData = attendanceData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.08), borderRadius: 2 }}>
            <CalendarIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Days
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.lighter', borderRadius: 2 }}>
            <PresentIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
              {stats.present}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Present
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'error.lighter', borderRadius: 2 }}>
            <AbsentIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
              {stats.absent}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Absent
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.lighter', borderRadius: 2 }}>
            <TimerIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
              {stats.halfDay + stats.leave}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Half Day / Leave
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'info.lighter', borderRadius: 2 }}>
            <TrendingUpIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
              {stats.attendanceRate}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Attendance Rate
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<TodayIcon />}
                onClick={handleMarkTodayAttendance}
                disabled={isTodayMarked()}
                sx={{ borderRadius: 2 }}
              >
                {isTodayMarked() ? 'Today Marked' : 'Mark Today'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleCreateRecord}
                sx={{ borderRadius: 2 }}
              >
                Add Record
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant={viewMode === 'table' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('table')}
                sx={{ borderRadius: 2 }}
              >
                Table View
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('calendar')}
                sx={{ borderRadius: 2 }}
              >
                Calendar View
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content */}
      {viewMode === 'table' ? (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttendanceIcon />
              Attendance Records
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Clock In</TableCell>
                    <TableCell>Clock Out</TableCell>
                    <TableCell>Working Hours</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((record, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EventIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          {formatDate(record.Date)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={record.Status}
                          color={getStatusColor(record.Status)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatTime(record.ClockIn)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatTime(record.ClockOut)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {record.WorkingHours ? `${record.WorkingHours} hrs` : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Tooltip title={record.Notes || record.Remarks || 'No notes'}>
                          <Typography variant="body2" noWrap>
                            {record.Notes || record.Remarks || 'No notes'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            setSelectedRecord(record);
                            setMenuAnchor(e.currentTarget);
                          }}
                        >
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {attendanceData.length === 0 && !loading && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <AttendanceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No attendance records found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Start tracking attendance by marking your first record
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateRecord}>
                  Mark Attendance
                </Button>
              </Box>
            )}

            {/* Table Pagination */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={attendanceData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  color: '#546e7a',
                  fontWeight: 500
                },
                '& .MuiTablePagination-select': {
                  borderColor: '#e3f2fd',
                  '&:focus': {
                    borderColor: '#1976d2'
                  }
                }
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon />
              Attendance Calendar
            </Typography>
            <Box sx={{ height: 600 }}>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month']}
                eventPropGetter={(event) => ({
                  style: {
                    backgroundColor: 
                      event.resource.Status === 'Present' ? theme.palette.success.main :
                      event.resource.Status === 'Absent' ? theme.palette.error.main :
                      event.resource.Status === 'Half Day' ? theme.palette.warning.main :
                      event.resource.Status === 'Leave' ? theme.palette.info.main :
                      theme.palette.primary.main
                  }
                })}
                onSelectEvent={(event) => handleEditRecord(event.resource)}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <MenuItem onClick={() => {
          handleEditRecord(selectedRecord);
          setMenuAnchor(null);
        }}>
          <ListItemIcon><EditIcon /></ListItemIcon>
          <ListItemText>Edit Record</ListItemText>
        </MenuItem>
      </Menu>

      {/* Attendance Form Dialog */}
      <Dialog
        open={attendanceFormOpen}
        onClose={() => setAttendanceFormOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 4,
            position: 'relative',
            zIndex: 1300,
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            border: 'none'
          } 
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 1299,
            backdropFilter: 'blur(4px)'
          }
        }}
      >
        <DialogTitle sx={{ 
          p: 0,
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          pt: 4,
          pb: 2
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            px: 4,
            position: 'relative'
          }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1976d2, #00bcd4)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center',
                lineHeight: 1.2
              }}
            >
              {editingRecord ? 'Edit Attendance' : 'Mark Attendance'}
            </Typography>
            <IconButton 
              onClick={() => setAttendanceFormOpen(false)}
              sx={{ 
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#00bcd4',
                '&:hover': {
                  backgroundColor: 'rgba(0, 188, 212, 0.1)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ 
          px: 4,
          py: 2,
          maxHeight: 'calc(90vh - 200px)',
          overflowY: 'auto',
          position: 'relative',
          zIndex: 1
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Date and Status Row */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                label="Date *"
                type="date"
                value={attendanceForm.Date}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, Date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
                variant="standard"
                sx={{
                  flex: '1 1 200px',
                  minWidth: '200px',
                  '& .MuiInput-underline:before': {
                    borderBottomColor: '#e0e0e0'
                  },
                  '& .MuiInput-underline:after': {
                    borderBottomColor: '#00bcd4'
                  },
                  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                    borderBottomColor: '#00bcd4'
                  },
                  '& .MuiFormLabel-root': {
                    color: '#666',
                    fontSize: '14px'
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '16px',
                    padding: '8px 0'
                  }
                }}
              />
              
              <FormControl 
                variant="standard" 
                required
                sx={{ 
                  flex: '1 1 200px',
                  minWidth: '200px'
                }}
              >
                <InputLabel sx={{ color: '#666', fontSize: '14px' }}>Status *</InputLabel>
                <Select
                  value={attendanceForm.Status}
                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, Status: e.target.value }))}
                  label="Status *"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                >
                  {statusOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            {/* Clock In and Clock Out Row */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                label="Clock In Time"
                type="time"
                value={attendanceForm.ClockIn}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, ClockIn: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                disabled={attendanceForm.Status === 'Absent' || attendanceForm.Status === 'Leave'}
                variant="standard"
                sx={{
                  flex: '1 1 200px',
                  minWidth: '200px',
                  '& .MuiInput-underline:before': {
                    borderBottomColor: '#e0e0e0'
                  },
                  '& .MuiInput-underline:after': {
                    borderBottomColor: '#00bcd4'
                  },
                  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                    borderBottomColor: '#00bcd4'
                  },
                  '& .MuiFormLabel-root': {
                    color: '#666',
                    fontSize: '14px'
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '16px',
                    padding: '8px 0'
                  }
                }}
              />
              
              <TextField
                fullWidth
                label="Clock Out Time"
                type="time"
                value={attendanceForm.ClockOut}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, ClockOut: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                disabled={attendanceForm.Status === 'Absent' || attendanceForm.Status === 'Leave'}
                variant="standard"
                sx={{
                  flex: '1 1 200px',
                  minWidth: '200px',
                  '& .MuiInput-underline:before': {
                    borderBottomColor: '#e0e0e0'
                  },
                  '& .MuiInput-underline:after': {
                    borderBottomColor: '#00bcd4'
                  },
                  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                    borderBottomColor: '#00bcd4'
                  },
                  '& .MuiFormLabel-root': {
                    color: '#666',
                    fontSize: '14px'
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '16px',
                    padding: '8px 0'
                  }
                }}
              />
            </Box>
            
            {/* Working Hours and Remarks Row */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                label="Working Hours"
                value={attendanceForm.WorkingHours}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, WorkingHours: e.target.value }))}
                InputProps={{
                  endAdornment: <Typography variant="body2">hours</Typography>
                }}
                disabled
                variant="standard"
                sx={{
                  flex: '1 1 200px',
                  minWidth: '200px',
                  '& .MuiInput-underline:before': {
                    borderBottomColor: '#e0e0e0'
                  },
                  '& .MuiInput-underline:after': {
                    borderBottomColor: '#00bcd4'
                  },
                  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                    borderBottomColor: '#00bcd4'
                  },
                  '& .MuiFormLabel-root': {
                    color: '#666',
                    fontSize: '14px'
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '16px',
                    padding: '8px 0'
                  }
                }}
              />
              
              <TextField
                fullWidth
                label="Remarks"
                value={attendanceForm.Remarks}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, Remarks: e.target.value }))}
                variant="standard"
                sx={{
                  flex: '1 1 200px',
                  minWidth: '200px',
                  '& .MuiInput-underline:before': {
                    borderBottomColor: '#e0e0e0'
                  },
                  '& .MuiInput-underline:after': {
                    borderBottomColor: '#00bcd4'
                  },
                  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                    borderBottomColor: '#00bcd4'
                  },
                  '& .MuiFormLabel-root': {
                    color: '#666',
                    fontSize: '14px'
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '16px',
                    padding: '8px 0'
                  }
                }}
              />
            </Box>
            
            {/* Notes */}
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={attendanceForm.Notes}
              onChange={(e) => setAttendanceForm(prev => ({ ...prev, Notes: e.target.value }))}
              placeholder="Any additional notes about this attendance record..."
              variant="standard"
              sx={{
                '& .MuiInput-underline:before': {
                  borderBottomColor: '#e0e0e0'
                },
                '& .MuiInput-underline:after': {
                  borderBottomColor: '#00bcd4'
                },
                '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                  borderBottomColor: '#00bcd4'
                },
                '& .MuiFormLabel-root': {
                  color: '#666',
                  fontSize: '14px'
                },
                '& .MuiInputBase-input': {
                  fontSize: '16px',
                  padding: '8px 0'
                }
              }}
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 4,
          pt: 2,
          justifyContent: 'center',
          gap: 2,
          position: 'relative',
          zIndex: 1,
          flexShrink: 0
        }}>
          <Button 
            onClick={() => setAttendanceFormOpen(false)} 
            sx={{ 
              borderRadius: 3,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              color: '#666',
              border: '1px solid #e0e0e0',
              backgroundColor: 'transparent',
              minWidth: '120px',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderColor: '#00bcd4'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveRecord}
            disabled={!attendanceForm.Date || !attendanceForm.Status}
            sx={{ 
              borderRadius: 3,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '16px',
              minWidth: '180px',
              background: 'linear-gradient(135deg, #1976d2, #00bcd4)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0, #00acc1)',
                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                background: '#e0e0e0',
                color: '#999',
                boxShadow: 'none',
                transform: 'none'
              }
            }}
          >
            {editingRecord ? 'UPDATE RECORD' : 'SAVE RECORD'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB for mobile */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 80, right: 24 }}
        onClick={handleCreateRecord}
      >
        <AddIcon />
      </Fab>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnhancedAttendanceTab;
