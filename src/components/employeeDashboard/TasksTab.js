import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Fab,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Assignment as TaskIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  CheckCircle as CompleteIcon,
  Schedule as PendingIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import employeeService from '../../services/employeeService';

const TasksTab = ({ employeeCode, tasks = [], onTaskUpdate }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [updating, setUpdating] = useState(false);

  // Safe property access utility
  const safeGet = (obj, path, defaultValue = '') => {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // Ensure tasks is always an array
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const taskStatuses = [
    { value: 'all', label: 'All Tasks' },
    { value: 'Pending', label: 'Pending' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'On Hold', label: 'On Hold' }
  ];

  const priorityLevels = [
    { value: 'all', label: 'All Priorities' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'warning';
      case 'Pending':
        return 'info';
      case 'On Hold':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'error';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CompleteIcon />;
      case 'In Progress':
        return <StartIcon />;
      case 'Pending':
        return <PendingIcon />;
      case 'On Hold':
        return <PauseIcon />;
      default:
        return <TaskIcon />;
    }
  };

  const filteredTasks = safeTasks.filter(task => {
    if (!task) return false;
    const statusMatch = statusFilter === 'all' || safeGet(task, 'Status') === statusFilter;
    const priorityMatch = priorityFilter === 'all' || safeGet(task, 'Priority') === priorityFilter;
    return statusMatch && priorityMatch;
  });

  const handleUpdateTask = async (taskId, newStatus, notes = '') => {
    setUpdating(true);
    try {
      await employeeService.updateTaskStatus(taskId, newStatus, notes);
      onTaskUpdate();
      setDialogOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTaskProgress = (task) => {
    switch (task.Status) {
      case 'Completed':
        return 100;
      case 'In Progress':
        return 60;
      case 'Pending':
        return 0;
      case 'On Hold':
        return 30;
      default:
        return 0;
    }
  };

  const taskStats = {
    total: safeTasks.length,
    completed: safeTasks.filter(t => safeGet(t, 'Status') === 'Completed').length,
    inProgress: safeTasks.filter(t => safeGet(t, 'Status') === 'In Progress').length,
    pending: safeTasks.filter(t => safeGet(t, 'Status') === 'Pending').length,
    onHold: safeTasks.filter(t => safeGet(t, 'Status') === 'On Hold').length
  };

  return (
    <Box>
      {/* Task Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {taskStats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Tasks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                {taskStats.completed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {taskStats.inProgress}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                {taskStats.pending}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'error.main' }}>
                {taskStats.onHold}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                On Hold
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FilterIcon />
            <Typography variant="h6">Filters:</Typography>
            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
            >
              {taskStatuses.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
            >
              {priorityLevels.map((priority) => (
                <MenuItem key={priority.value} value={priority.value}>
                  {priority.label}
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredTasks.length} of {safeTasks.length} tasks
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TaskIcon />
            My Tasks
          </Typography>
          
          {filteredTasks.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Task</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTasks.map((task, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                            {safeGet(task, 'TaskTitle') || safeGet(task, 'Title') || 'Untitled Task'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {safeGet(task, 'Description') || 'No description'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={safeGet(task, 'Priority') || 'Medium'}
                          color={getPriorityColor(safeGet(task, 'Priority'))}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(safeGet(task, 'Status'))}
                          label={safeGet(task, 'Status') || 'Pending'}
                          color={getStatusColor(safeGet(task, 'Status'))}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(safeGet(task, 'DueDate'))}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ width: 120 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={getTaskProgress(task)}
                            sx={{ flex: 1, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption">
                            {getTaskProgress(task)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewTask(task)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          {safeGet(task, 'Status') !== 'Completed' && (
                            <Tooltip title="Update Status">
                              <IconButton
                                size="small"
                                onClick={() => handleViewTask(task)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <TaskIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No tasks found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {safeTasks.length === 0 
                  ? 'No tasks assigned yet.'
                  : 'No tasks match the current filters.'
                }
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Task Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTask?.TaskTitle || selectedTask?.Title || 'Task Details'}
        </DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedTask.Description || 'No description provided'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Status
                  </Typography>
                  <Chip
                    icon={getStatusIcon(selectedTask.Status)}
                    label={selectedTask.Status || 'Pending'}
                    color={getStatusColor(selectedTask.Status)}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Priority
                  </Typography>
                  <Chip
                    label={selectedTask.Priority || 'Medium'}
                    color={getPriorityColor(selectedTask.Priority)}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Due Date
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(selectedTask.DueDate)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Created Date
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(selectedTask.CreatedAt)}
                  </Typography>
                </Grid>

                {selectedTask.Notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Notes
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedTask.Notes}
                    </Typography>
                  </Grid>
                )}

                {selectedTask.Status !== 'Completed' && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Update Status
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {selectedTask.Status !== 'In Progress' && (
                        <Button
                          variant="outlined"
                          color="warning"
                          onClick={() => handleUpdateTask(selectedTask.TaskId, 'In Progress')}
                          disabled={updating}
                          startIcon={<StartIcon />}
                        >
                          Start Task
                        </Button>
                      )}
                      {selectedTask.Status !== 'Completed' && (
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleUpdateTask(selectedTask.TaskId, 'Completed')}
                          disabled={updating}
                          startIcon={<CompleteIcon />}
                        >
                          Mark Complete
                        </Button>
                      )}
                      {selectedTask.Status !== 'On Hold' && (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleUpdateTask(selectedTask.TaskId, 'On Hold')}
                          disabled={updating}
                          startIcon={<PauseIcon />}
                        >
                          Put On Hold
                        </Button>
                      )}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={() => {/* Handle new task creation */}}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default TasksTab;
