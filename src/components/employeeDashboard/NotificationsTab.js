import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Chip,
  Badge,
  Button,
  Tabs,
  Tab,
  Paper,
  Divider,
  Tooltip,
  TablePagination
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  Mail as MailIcon,
  Assignment as TaskIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkReadIcon,
  Circle as UnreadIcon
} from '@mui/icons-material';
import employeeService from '../../services/employeeService';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const NotificationsTab = ({ employeeCode, notifications, onNotificationRead }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [updatingNotification, setUpdatingNotification] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0); // Reset to first page when switching tabs
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMarkAsRead = async (notificationId) => {
    setUpdatingNotification(notificationId);
    try {
      await employeeService.markNotificationAsRead(notificationId);
      onNotificationRead();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setUpdatingNotification(null);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'task':
        return <TaskIcon />;
      case 'event':
      case 'meeting':
        return <EventIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
        return <InfoIcon />;
      case 'success':
        return <CheckIcon />;
      default:
        return <NotificationIcon />;
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'High') return 'error';
    
    switch (type?.toLowerCase()) {
      case 'task':
        return 'primary';
      case 'event':
      case 'meeting':
        return 'info';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return notificationTime.toLocaleDateString();
  };

  // Mock notifications data with different types
  const allNotifications = [
    {
      id: '1',
      type: 'task',
      title: 'New Task Assigned',
      message: 'You have been assigned a new task: Complete quarterly report',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      priority: 'High',
      read: false,
      from: 'Project Manager'
    },
    {
      id: '2',
      type: 'event',
      title: 'Meeting Reminder',
      message: 'Team standup meeting in 15 minutes',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
      priority: 'Medium',
      read: false,
      from: 'Calendar System'
    },
    {
      id: '3',
      type: 'success',
      title: 'Task Completed',
      message: 'Your task "Update employee database" has been approved',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      priority: 'Low',
      read: true,
      from: 'System'
    },
    {
      id: '4',
      type: 'warning',
      title: 'Deadline Approaching',
      message: 'Your project deadline is in 2 days',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
      priority: 'High',
      read: false,
      from: 'Project Tracker'
    },
    {
      id: '5',
      type: 'info',
      title: 'System Update',
      message: 'The employee portal will be updated tonight from 10 PM to 12 AM',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      priority: 'Low',
      read: true,
      from: 'IT Department'
    }
  ];

  const unreadNotifications = allNotifications.filter(n => !n.read);
  const taskNotifications = allNotifications.filter(n => n.type === 'task');
  const eventNotifications = allNotifications.filter(n => n.type === 'event' || n.type === 'meeting');

  const NotificationList = ({ notifications: notifs, showAll = false }) => {
    // Paginate notifications
    const paginatedNotifications = notifs.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );

    return (
      <>
        <List>
          {paginatedNotifications.length > 0 ? paginatedNotifications.map((notification, index) => (
        <React.Fragment key={notification.id}>
          <ListItem
            sx={{
              bgcolor: notification.read ? 'transparent' : 'action.hover',
              borderRadius: 1,
              mb: 1
            }}
          >
            <ListItemAvatar>
              <Badge
                color="error"
                variant="dot"
                invisible={notification.read}
              >
                <Avatar
                  sx={{
                    bgcolor: `${getNotificationColor(notification.type, notification.priority)}.main`,
                    width: 40,
                    height: 40
                  }}
                >
                  {getNotificationIcon(notification.type)}
                </Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: notification.read ? 400 : 600,
                      flex: 1
                    }}
                  >
                    {notification.title}
                  </Typography>
                  <Chip
                    label={notification.priority}
                    size="small"
                    color={getNotificationColor(notification.type, notification.priority)}
                    variant="outlined"
                  />
                </Box>
              }
              secondary={
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    {notification.message}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      From: {notification.from}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatTimeAgo(notification.timestamp)}
                    </Typography>
                  </Box>
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {!notification.read && (
                  <Tooltip title="Mark as read">
                    <IconButton
                      size="small"
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={updatingNotification === notification.id}
                    >
                      <MarkReadIcon />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Delete">
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </ListItemSecondaryAction>
          </ListItem>
          {index < notifs.length - 1 && <Divider variant="inset" component="li" />}
        </React.Fragment>
      )) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <NotificationIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You're all caught up!
          </Typography>
        </Box>
      )}
        </List>
        
        {/* Pagination Controls */}
        {notifs.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={notifs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: '1px solid #e3f2fd',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                color: '#546e7a',
                fontWeight: 500
              },
              '& .MuiTablePagination-select': {
                color: '#1976d2',
                fontWeight: 600
              },
              '& .MuiIconButton-root': {
                color: '#1976d2',
                '&:hover': { backgroundColor: '#e3f2fd' },
                '&.Mui-disabled': { color: '#9e9e9e' }
              }
            }}
          />
        )}
      </>
    );
  };

  return (
    <Box>
      {/* Notification Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {allNotifications.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Notifications
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'error.main' }}>
                {unreadNotifications.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unread
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {taskNotifications.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Task Related
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                {eventNotifications.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Events & Meetings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<MarkReadIcon />}
              size="small"
            >
              Mark All as Read
            </Button>
            <Button
              variant="outlined"
              startIcon={<DeleteIcon />}
              size="small"
              color="error"
            >
              Clear Read Notifications
            </Button>
            <Button
              variant="outlined"
              startIcon={<NotificationIcon />}
              size="small"
              onClick={() => alert('Notification Settings coming soon!')}
            >
              Notification Settings
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Notification Tabs */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<Badge badgeContent={unreadNotifications.length} color="error"><NotificationIcon /></Badge>}
            label="Unread"
          />
          <Tab
            icon={<NotificationIcon />}
            label="All Notifications"
          />
          <Tab
            icon={<TaskIcon />}
            label="Tasks"
          />
          <Tab
            icon={<EventIcon />}
            label="Events"
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <NotificationList notifications={unreadNotifications} />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <NotificationList notifications={allNotifications} showAll />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <NotificationList notifications={taskNotifications} />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <NotificationList notifications={eventNotifications} />
        </TabPanel>
      </Card>
    </Box>
  );
};

export default NotificationsTab;
