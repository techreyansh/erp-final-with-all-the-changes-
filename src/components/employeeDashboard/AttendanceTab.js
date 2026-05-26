import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Calendar,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  TablePagination,
  Pagination
} from '@mui/material';
import {
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Schedule as LateIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const AttendanceTab = ({ employeeCode, attendance }) => {
  const [viewMode, setViewMode] = useState('table');
  const [timeRange, setTimeRange] = useState('month');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
      case 'clocked in':
      case 'clocked out':
        return 'success';
      case 'absent':
        return 'error';
      case 'late':
        return 'warning';
      case 'half day':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
      case 'clocked in':
      case 'clocked out':
        return <PresentIcon />;
      case 'absent':
        return <AbsentIcon />;
      case 'late':
        return <LateIcon />;
      default:
        return <TodayIcon />;
    }
  };

  // Calculate attendance statistics
  const stats = {
    totalDays: attendance.length,
    presentDays: attendance.filter(a => 
      ['present', 'clocked in', 'clocked out'].includes(a.Status?.toLowerCase())
    ).length,
    absentDays: attendance.filter(a => 
      a.Status?.toLowerCase() === 'absent'
    ).length,
    lateDays: attendance.filter(a => 
      a.Status?.toLowerCase() === 'late'
    ).length,
    halfDays: attendance.filter(a => 
      a.Status?.toLowerCase() === 'half day'
    ).length
  };

  stats.attendanceRate = stats.totalDays > 0 
    ? Math.round((stats.presentDays / stats.totalDays) * 100)
    : 0;

  // Calculate total working hours
  const totalHours = attendance.reduce((sum, record) => {
    return sum + (parseFloat(record.WorkingHours) || 0);
  }, 0);

  const averageHours = stats.totalDays > 0 
    ? (totalHours / stats.totalDays).toFixed(1)
    : 0;

  // Prepare calendar events
  const calendarEvents = attendance.map(record => ({
    id: record.Date,
    title: record.Status || 'Present',
    start: new Date(record.Date),
    end: new Date(record.Date),
    resource: record
  }));

  const eventStyleGetter = (event) => {
    const status = event.resource.Status?.toLowerCase();
    let backgroundColor = '#3174ad';
    
    switch (status) {
      case 'present':
      case 'clocked in':
      case 'clocked out':
        backgroundColor = '#4caf50';
        break;
      case 'absent':
        backgroundColor = '#f44336';
        break;
      case 'late':
        backgroundColor = '#ff9800';
        break;
      case 'half day':
        backgroundColor = '#2196f3';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get paginated data
  const paginatedAttendance = attendance.slice().reverse().slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      {/* Attendance Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {stats.totalDays}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                {stats.presentDays}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Present Days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'error.main' }}>
                {stats.absentDays}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Absent Days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {stats.lateDays}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Late Days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                {stats.attendanceRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Attendance Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Work Hours Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.lighter' }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {totalHours.toFixed(1)}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Hours
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.lighter' }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {averageHours}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average/Day
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Attendance Breakdown
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  icon={<PresentIcon />}
                  label={`Present: ${stats.presentDays}`}
                  color="success"
                  variant="outlined"
                />
                <Chip
                  icon={<AbsentIcon />}
                  label={`Absent: ${stats.absentDays}`}
                  color="error"
                  variant="outlined"
                />
                <Chip
                  icon={<LateIcon />}
                  label={`Late: ${stats.lateDays}`}
                  color="warning"
                  variant="outlined"
                />
                <Chip
                  label={`Half Day: ${stats.halfDays}`}
                  color="info"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* View Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>View</InputLabel>
              <Select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                label="View"
              >
                <MenuItem value="table">Table View</MenuItem>
                <MenuItem value="calendar">Calendar View</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Time Range"
              >
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="quarter">This Quarter</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Attendance Data */}
      {viewMode === 'table' ? (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <DateRangeIcon />
              Attendance Records
            </Typography>
            
            {attendance.length > 0 ? (
              <>
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
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedAttendance.map((record, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {formatDate(record.Date)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(record.Date).toLocaleDateString('en-US', { weekday: 'long' })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(record.Status)}
                              label={record.Status || 'Present'}
                              color={getStatusColor(record.Status)}
                              size="small"
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
                              {record.WorkingHours ? `${record.WorkingHours}h` : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {record.Notes || record.Remarks || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={attendance.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage="Rows per page:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
                />
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <DateRangeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No Attendance Records
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Attendance records will appear here once they are recorded.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TodayIcon />
              Attendance Calendar
            </Typography>
            
            <Box sx={{ height: 600 }}>
              <BigCalendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                eventPropGetter={eventStyleGetter}
                views={['month', 'week']}
                defaultView="month"
                popup
                popupOffset={30}
                style={{ height: '100%' }}
                components={{
                  event: ({ event }) => (
                    <Box sx={{ p: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 500 }}>
                        {event.title}
                      </Typography>
                    </Box>
                  )
                }}
                dayPropGetter={(date) => {
                  const today = new Date();
                  const isToday = date.toDateString() === today.toDateString();
                  
                  return {
                    style: {
                      backgroundColor: isToday ? 'rgba(33, 150, 243, 0.1)' : undefined
                    }
                  };
                }}
              />
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AttendanceTab;
