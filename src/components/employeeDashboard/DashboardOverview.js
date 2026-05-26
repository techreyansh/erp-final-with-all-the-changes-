import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Button,
  Chip,
  Avatar,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton
} from '@mui/material';
import {
  Assignment as TaskIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  AccessTime as TimeIcon,
  Notifications as NotificationIcon,
  Today as TodayIcon,
  CalendarToday as CalendarIcon,
  MoreHoriz as MoreIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import KPICard from '../common/KPICard';
import employeeService from '../../services/employeeService';

const COLORS = ['#4caf50', '#ff9800', '#f44336', '#2196f3'];

const DashboardOverview = ({ employee, profile, summary, onRefresh }) => {
  const [timeTrackingData, setTimeTrackingData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    if (employee?.EmployeeCode) {
      loadChartData();
    }
  }, [employee?.EmployeeCode]);

  const loadChartData = async () => {
    try {
      const [timeData, perfData] = await Promise.all([
        employeeService.getTimeTrackingData(employee.EmployeeCode, 7),
        employeeService.getPerformanceMetrics(employee.EmployeeCode)
      ]);
      setTimeTrackingData(timeData);
      setPerformanceData(perfData.slice(-5)); // Last 5 performance records
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const taskData = [
    { name: 'Completed', value: summary?.tasks?.completed || 0, color: '#4caf50' },
    { name: 'In Progress', value: summary?.tasks?.inProgress || 0, color: '#ff9800' },
    { name: 'Pending', value: summary?.tasks?.pending || 0, color: '#f44336' }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Box>
      {/* Welcome Section */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          {getGreeting()}, {employee?.EmployeeName?.split(' ')[0] || 'Employee'}! 👋
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          {formatDate(new Date())}
        </Typography>
        {(!employee?.EmployeeName || employee?.EmployeeName === '') && (
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
            Welcome to your dashboard! Your profile data will appear here once it's added to the system.
          </Typography>
        )}
      </Paper>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Tasks"
            value={summary?.tasks?.total || 0}
            icon={<TaskIcon />}
            color="primary"
            subtitle={`${summary?.tasks?.completed || 0} completed`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Attendance Rate"
            value={`${summary?.attendance?.attendanceRate || 0}%`}
            icon={<ScheduleIcon />}
            color="success"
            subtitle="This month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Weekly Hours"
            value={`${summary?.attendance?.weeklyHours || 0}h`}
            icon={<TimeIcon />}
            color="info"
            subtitle="This week"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Performance"
            value={`${profile?.stats?.performanceScore || 0}/100`}
            icon={<TrendingUpIcon />}
            color="warning"
            subtitle="Average score"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Tasks Overview */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TaskIcon />
                  Task Distribution
                </Typography>
                <IconButton size="small">
                  <MoreIcon />
                </IconButton>
              </Box>
              
              {taskData.some(item => item.value > 0) ? (
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {taskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ 
                  height: 250, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'text.secondary'
                }}>
                  No task data available
                </Box>
              )}

              <Box sx={{ mt: 2 }}>
                {taskData.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: item.color,
                        mr: 1
                      }}
                    />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Hours Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TimeIcon />
                Weekly Hours
              </Typography>
              
              {timeTrackingData.length > 0 ? (
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeTrackingData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        formatter={(value) => [`${value}h`, 'Hours']}
                      />
                      <Bar dataKey="hours" fill="#2196f3" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ 
                  height: 250, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'text.secondary'
                }}>
                  No time tracking data available
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Notifications */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <NotificationIcon />
                Recent Notifications
                {summary?.notifications?.unread > 0 && (
                  <Chip 
                    label={summary.notifications.unread} 
                    size="small" 
                    color="error" 
                  />
                )}
              </Typography>
              
              {summary?.notifications?.recent?.length > 0 ? (
                <List>
                  {summary.notifications.recent.slice(0, 5).map((notification, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          <NotificationIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={notification.Title || notification.Message}
                        secondary={new Date(notification.CreatedAt).toLocaleDateString()}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ 
                  py: 4, 
                  textAlign: 'center',
                  color: 'text.secondary'
                }}>
                  <NotificationIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                  <Typography variant="body2">
                    No recent notifications
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TodayIcon />
                Quick Actions
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Button
                    variant={summary?.attendance?.isCheckedIn ? "outlined" : "contained"}
                    color={summary?.attendance?.isCheckedIn ? "error" : "success"}
                    fullWidth
                    startIcon={<TimeIcon />}
                    sx={{ mb: 1 }}
                  >
                    {summary?.attendance?.isCheckedIn ? 'Clock Out' : 'Clock In'}
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<TaskIcon />}
                    sx={{ mb: 1 }}
                  >
                    View My Tasks
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<CalendarIcon />}
                    sx={{ mb: 1 }}
                  >
                    Check Schedule
                  </Button>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Today's Summary */}
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Today's Summary
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Status:
                </Typography>
                <Chip
                  label={summary?.attendance?.isCheckedIn ? 'Checked In' : 'Not Checked In'}
                  size="small"
                  color={summary?.attendance?.isCheckedIn ? 'success' : 'default'}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Pending Tasks:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {summary?.tasks?.pending || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Unread Notifications:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {summary?.notifications?.unread || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardOverview;
