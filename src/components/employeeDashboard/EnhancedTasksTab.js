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
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Avatar,
  LinearProgress,
  Tooltip,
  Menu,
  Divider,
  Alert,
  Snackbar,
  Fab,
  useTheme,
  alpha,
  Fade,
  Grow,
  Pagination
} from '@mui/material';
import {
  Add as AddIcon,
  Assignment as TaskIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  Flag as PriorityIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import employeeService from '../../services/employeeService';

const EnhancedTasksTab = ({ employeeCode, onTaskUpdate }) => {
  const theme = useTheme();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  
  // Menu states
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);

  // Form state
  const [taskForm, setTaskForm] = useState({
    TaskTitle: '',
    Description: '',
    Priority: 'Medium',
    Status: 'To Do',
    DueDate: '',
    AssignedTo: employeeCode,
    CreatedBy: 'System',
    Notes: ''
  });

  useEffect(() => {
    if (employeeCode) {
      loadTasks();
    }
  }, [employeeCode]);

  useEffect(() => {
    filterAndSearchTasks();
  }, [tasks, searchTerm, statusFilter, priorityFilter, sortBy]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const tasksData = await employeeService.getEmployeeTasks(employeeCode);
      setTasks(tasksData);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to load tasks: ' + error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSearchTasks = () => {
    let filtered = [...tasks];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.TaskTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.Description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.Status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.Priority === priorityFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.DueDate || '9999-12-31') - new Date(b.DueDate || '9999-12-31');
        case 'priority':
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          return (priorityOrder[b.Priority] || 0) - (priorityOrder[a.Priority] || 0);
        case 'status':
          return (a.Status || '').localeCompare(b.Status || '');
        default:
          return (a.TaskTitle || '').localeCompare(b.TaskTitle || '');
      }
    });

    setFilteredTasks(filtered);
    setPage(0);
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setTaskForm({
      TaskTitle: '',
      Description: '',
      Priority: 'Medium',
      Status: 'To Do',
      DueDate: '',
      AssignedTo: employeeCode,
      CreatedBy: 'System',
      Notes: ''
    });
    setTaskFormOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({ ...task });
    setTaskFormOpen(true);
  };

  const handleSaveTask = async () => {
    try {
      setLoading(true);
      
      if (editingTask) {
        // Update existing task
        await employeeService.updateTask(editingTask.TaskId, {
          ...taskForm,
          UpdatedAt: new Date().toISOString()
        });
        setSnackbar({ open: true, message: 'Task updated successfully!', severity: 'success' });
      } else {
        // Create new task
        const newTask = {
          ...taskForm,
          TaskId: `TASK${Date.now()}`,
          CreatedAt: new Date().toISOString(),
          UpdatedAt: new Date().toISOString()
        };
        await employeeService.createTask(newTask);
        setSnackbar({ open: true, message: 'Task created successfully!', severity: 'success' });
      }
      
      setTaskFormOpen(false);
      setEditingTask(null);
      await loadTasks();
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save task: ' + error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      setLoading(true);
      await employeeService.deleteTask(taskId);
      setSnackbar({ open: true, message: 'Task deleted successfully!', severity: 'success' });
      await loadTasks();
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete task: ' + error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t.TaskId === taskId);
      await employeeService.updateTask(taskId, {
        ...task,
        Status: newStatus,
        UpdatedAt: new Date().toISOString()
      });
      setSnackbar({ open: true, message: 'Task status updated!', severity: 'success' });
      await loadTasks();
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update task status: ' + error.message, severity: 'error' });
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'in progress': return 'info';
      case 'to do': return 'default';
      case 'on hold': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.Status === 'Completed').length;
    const inProgress = tasks.filter(t => t.Status === 'In Progress').length;
    const pending = tasks.filter(t => t.Status === 'To Do').length;
    return { total, completed, inProgress, pending };
  };

  const stats = getTaskStats();
  const paginatedTasks = filteredTasks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.lighter', borderRadius: 2 }}>
            <TaskIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Tasks
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.lighter', borderRadius: 2 }}>
            <CompleteIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
              {stats.completed}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completed
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'info.lighter', borderRadius: 2 }}>
            <StartIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
              {stats.inProgress}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              In Progress
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.lighter', borderRadius: 2 }}>
            <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
              {stats.pending}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                startIcon={<FilterIcon />}
                onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Filter
              </Button>
              <Button
                startIcon={<AddIcon />}
                onClick={handleCreateTask}
                variant="contained"
                sx={{ borderRadius: 2 }}
              >
                New Task
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 200 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Status</Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="To Do">To Do</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="On Hold">On Hold</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Priority</Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <MenuItem value="all">All Priorities</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Sort By</Typography>
          <FormControl fullWidth size="small">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="dueDate">Due Date</MenuItem>
              <MenuItem value="priority">Priority</MenuItem>
              <MenuItem value="status">Status</MenuItem>
              <MenuItem value="title">Title</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Menu>

      {/* Tasks Grid */}
      <Grid container spacing={3}>
        {paginatedTasks.map((task, index) => (
          <Grid item xs={12} md={6} lg={4} key={task.TaskId}>
            <Grow in timeout={500 + index * 100}>
              <Card 
                sx={{ 
                  height: '100%',
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8]
                  }
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  {/* Task Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {task.TaskTitle}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Chip
                          label={task.Status}
                          color={getStatusColor(task.Status)}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                        <Chip
                          label={task.Priority}
                          color={getPriorityColor(task.Priority)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setSelectedTask(task);
                        setMenuAnchor(e.currentTarget);
                      }}
                    >
                      <MoreIcon />
                    </IconButton>
                  </Box>

                  {/* Task Description */}
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {task.Description || 'No description provided'}
                  </Typography>

                  {/* Task Footer */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(task.DueDate)}
                      </Typography>
                    </Box>
                    
                    {task.Status !== 'Completed' && (
                      <Button
                        size="small"
                        startIcon={<CompleteIcon />}
                        onClick={() => handleStatusChange(task.TaskId, 'Completed')}
                        sx={{ borderRadius: 2 }}
                      >
                        Complete
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {filteredTasks.length === 0 && !loading && (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
          <TaskIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No tasks found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
              ? 'Try adjusting your filters or search terms'
              : 'Get started by creating your first task'
            }
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateTask}>
            Create Task
          </Button>
        </Paper>
      )}

      {/* Enhanced Pagination */}
      {filteredTasks.length > 0 && (
        <Paper sx={{ mt: 3, borderRadius: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                Tasks per page:
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
                  <MenuItem value={3}>3</MenuItem>
                  <MenuItem value={6}>6</MenuItem>
                  <MenuItem value={9}>9</MenuItem>
                  <MenuItem value={12}>12</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
              </Typography>
              
              {Math.ceil(filteredTasks.length / rowsPerPage) > 1 && (
                <Pagination
                  count={Math.ceil(filteredTasks.length / rowsPerPage)}
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
        </Paper>
      )}

      {/* Task Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <MenuItem onClick={() => {
          setTaskDetailOpen(true);
          setMenuAnchor(null);
        }}>
          <ListItemIcon><ViewIcon /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleEditTask(selectedTask);
          setMenuAnchor(null);
        }}>
          <ListItemIcon><EditIcon /></ListItemIcon>
          <ListItemText>Edit Task</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            handleDeleteTask(selectedTask?.TaskId);
            setMenuAnchor(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><DeleteIcon sx={{ color: 'error.main' }} /></ListItemIcon>
          <ListItemText>Delete Task</ListItemText>
        </MenuItem>
      </Menu>

      {/* Task Form Dialog */}
      <Dialog
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
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
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </Typography>
            <IconButton 
              onClick={() => setTaskFormOpen(false)}
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
            {/* Task Title */}
            <TextField
              fullWidth
              label="Task Title *"
              value={taskForm.TaskTitle}
              onChange={(e) => setTaskForm(prev => ({ ...prev, TaskTitle: e.target.value }))}
              required
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
            
            {/* Description */}
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={taskForm.Description}
              onChange={(e) => setTaskForm(prev => ({ ...prev, Description: e.target.value }))}
              placeholder="Describe the task in detail..."
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
            
            {/* Priority and Status Row */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <FormControl 
                variant="standard" 
                required
                sx={{ 
                  flex: '1 1 200px',
                  minWidth: '200px'
                }}
              >
                <InputLabel sx={{ color: '#666', fontSize: '14px' }}>Priority *</InputLabel>
                <Select
                  value={taskForm.Priority}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, Priority: e.target.value }))}
                  label="Priority *"
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
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                </Select>
              </FormControl>
              
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
                  value={taskForm.Status}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, Status: e.target.value }))}
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
                  <MenuItem value="To Do">To Do</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="On Hold">On Hold</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {/* Due Date */}
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              value={taskForm.DueDate}
              onChange={(e) => setTaskForm(prev => ({ ...prev, DueDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
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
            
            {/* Notes */}
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={taskForm.Notes}
              onChange={(e) => setTaskForm(prev => ({ ...prev, Notes: e.target.value }))}
              placeholder="Any additional notes about this task..."
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
            onClick={() => setTaskFormOpen(false)} 
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
            onClick={handleSaveTask}
            disabled={!taskForm.TaskTitle || !taskForm.Priority || !taskForm.Status}
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
            {editingTask ? 'UPDATE TASK' : 'CREATE TASK'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Task Detail Dialog */}
      <Dialog
        open={taskDetailOpen}
        onClose={() => setTaskDetailOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={false}
        PaperProps={{ 
          sx: { 
            borderRadius: { xs: 0, sm: 4 },
            maxHeight: '95vh',
            m: { xs: 0, sm: 2 },
            boxShadow: theme.shadows[20]
          } 
        }}
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 400 }}
      >
        <DialogTitle sx={{ 
          p: 0,
          position: 'sticky',
          top: 0,
          zIndex: 1,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          color: 'white',
          borderRadius: { xs: 0, sm: '16px 16px 0 0' }
        }}>
          <Box sx={{ 
            p: { xs: 2, sm: 3 },
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background decoration */}
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                background: alpha('#fff', 0.1),
                borderRadius: '50%',
                display: { xs: 'none', sm: 'block' }
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -30,
                left: -30,
                width: 100,
                height: 100,
                background: alpha('#fff', 0.05),
                borderRadius: '50%',
                display: { xs: 'none', sm: 'block' }
              }}
            />
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: { xs: 'flex-start', sm: 'center' }, 
              justifyContent: 'space-between',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 2, sm: 0 },
              position: 'relative',
              zIndex: 1
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 2, sm: 3 },
                flex: 1,
                minWidth: 0
              }}>
                <Avatar sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  width: { xs: 48, sm: 60 },
                  height: { xs: 48, sm: 60 },
                  border: 2,
                  borderColor: 'rgba(255,255,255,0.3)',
                  boxShadow: theme.shadows[8]
                }}>
                  <TaskIcon sx={{ fontSize: { xs: 24, sm: 30 } }} />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700,
                      mb: 0.5,
                      fontSize: { xs: '1.5rem', sm: '2rem' },
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: { xs: 'normal', sm: 'nowrap' }
                    }}
                  >
                    {selectedTask?.TaskTitle || 'Task Details'}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      opacity: 0.9,
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    Task ID: {selectedTask?.TaskId}
                  </Typography>
                </Box>
              </Box>
              <IconButton 
                onClick={() => setTaskDetailOpen(false)}
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: 1,
                  borderColor: 'rgba(255,255,255,0.2)',
                  alignSelf: { xs: 'flex-end', sm: 'center' },
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.2)',
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ 
          p: { xs: 2, sm: 3 },
          maxHeight: 'calc(95vh - 200px)',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: 6
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: alpha(theme.palette.grey[300], 0.3),
            borderRadius: 3
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(theme.palette.primary.main, 0.5),
            borderRadius: 3,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.7)
            }
          }
        }}>
          {selectedTask && (
            <Fade in timeout={300}>
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {/* Task Status and Priority */}
                <Grid item xs={12}>
                  <Grow in timeout={400}>
                    <Box sx={{ 
                      display: 'flex', 
                      gap: { xs: 1, sm: 2 }, 
                      mb: { xs: 2, sm: 3 },
                      flexWrap: 'wrap'
                    }}>
                      <Chip
                        label={selectedTask.Status}
                        color={getStatusColor(selectedTask.Status)}
                        size="medium"
                        sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          height: { xs: 28, sm: 32 },
                          boxShadow: theme.shadows[2],
                          '& .MuiChip-label': {
                            px: { xs: 1, sm: 1.5 }
                          }
                        }}
                      />
                      <Chip
                        label={selectedTask.Priority}
                        color={getPriorityColor(selectedTask.Priority)}
                        variant="outlined"
                        size="medium"
                        sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          height: { xs: 28, sm: 32 },
                          borderWidth: 2,
                          '& .MuiChip-label': {
                            px: { xs: 1, sm: 1.5 }
                          }
                        }}
                      />
                    </Box>
                  </Grow>
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <Grow in timeout={500}>
                    <Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          mb: { xs: 1, sm: 2 }, 
                          fontWeight: 700,
                          fontSize: { xs: '1.1rem', sm: '1.25rem' },
                          color: 'text.primary',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <ViewIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                        Description
                      </Typography>
                      <Paper sx={{ 
                        p: { xs: 2, sm: 3 },
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                        border: 1,
                        borderColor: alpha(theme.palette.primary.main, 0.1),
                        borderRadius: 3,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: alpha(theme.palette.primary.main, 0.2),
                          boxShadow: theme.shadows[4]
                        }
                      }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            lineHeight: 1.6,
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }}
                        >
                          {selectedTask.Description || 'No description provided'}
                        </Typography>
                      </Paper>
                    </Box>
                  </Grow>
                </Grid>

                {/* Task Information Cards */}
                <Grid item xs={12}>
                  <Grow in timeout={600}>
                    <Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          mb: { xs: 2, sm: 3 }, 
                          fontWeight: 700,
                          fontSize: { xs: '1.1rem', sm: '1.25rem' },
                          color: 'text.primary',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <PersonIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                        Task Information
                      </Typography>
                      
                      <Grid container spacing={{ xs: 2, sm: 3 }}>
                        {/* Assigned To Card */}
                        <Grid item xs={12} sm={6} md={4}>
                          <Card sx={{ 
                            p: { xs: 2, sm: 3 },
                            border: 1,
                            borderColor: alpha(theme.palette.success.main, 0.2),
                            bgcolor: alpha(theme.palette.success.main, 0.02),
                            borderRadius: 3,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              borderColor: alpha(theme.palette.success.main, 0.4),
                              transform: 'translateY(-2px)',
                              boxShadow: theme.shadows[8]
                            }
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Avatar sx={{ 
                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                color: 'success.main',
                                width: 32,
                                height: 32
                              }}>
                                <PersonIcon sx={{ fontSize: 18 }} />
                              </Avatar>
                              <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                Assigned To
                              </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ 
                              fontWeight: 600,
                              fontSize: { xs: '0.875rem', sm: '1rem' }
                            }}>
                              {selectedTask.AssignedTo || 'Not assigned'}
                            </Typography>
                          </Card>
                        </Grid>

                        {/* Created By Card */}
                        <Grid item xs={12} sm={6} md={4}>
                          <Card sx={{ 
                            p: { xs: 2, sm: 3 },
                            border: 1,
                            borderColor: alpha(theme.palette.info.main, 0.2),
                            bgcolor: alpha(theme.palette.info.main, 0.02),
                            borderRadius: 3,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              borderColor: alpha(theme.palette.info.main, 0.4),
                              transform: 'translateY(-2px)',
                              boxShadow: theme.shadows[8]
                            }
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Avatar sx={{ 
                                bgcolor: alpha(theme.palette.info.main, 0.1),
                                color: 'info.main',
                                width: 32,
                                height: 32
                              }}>
                                <PersonIcon sx={{ fontSize: 18 }} />
                              </Avatar>
                              <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                Created By
                              </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ 
                              fontWeight: 600,
                              fontSize: { xs: '0.875rem', sm: '1rem' }
                            }}>
                              {selectedTask.CreatedBy || 'Unknown'}
                            </Typography>
                          </Card>
                        </Grid>

                        {/* Due Date Card */}
                        <Grid item xs={12} sm={6} md={4}>
                          <Card sx={{ 
                            p: { xs: 2, sm: 3 },
                            border: 1,
                            borderColor: alpha(theme.palette.warning.main, 0.2),
                            bgcolor: alpha(theme.palette.warning.main, 0.02),
                            borderRadius: 3,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              borderColor: alpha(theme.palette.warning.main, 0.4),
                              transform: 'translateY(-2px)',
                              boxShadow: theme.shadows[8]
                            }
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Avatar sx={{ 
                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                color: 'warning.main',
                                width: 32,
                                height: 32
                              }}>
                                <ScheduleIcon sx={{ fontSize: 18 }} />
                              </Avatar>
                              <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                Due Date
                              </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ 
                              fontWeight: 600,
                              fontSize: { xs: '0.875rem', sm: '1rem' }
                            }}>
                              {formatDate(selectedTask.DueDate)}
                            </Typography>
                          </Card>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grow>
                </Grid>

                {/* Timeline Section */}
                <Grid item xs={12}>
                  <Grow in timeout={700}>
                    <Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          mb: { xs: 2, sm: 3 }, 
                          fontWeight: 700,
                          fontSize: { xs: '1.1rem', sm: '1.25rem' },
                          color: 'text.primary',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <ScheduleIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                        Timeline
                      </Typography>
                      
                      <Grid container spacing={{ xs: 2, sm: 3 }}>
                        {/* Created Card */}
                        <Grid item xs={12} sm={6} md={6}>
                          <Card sx={{ 
                            p: { xs: 2, sm: 3 },
                            border: 1,
                            borderColor: alpha(theme.palette.primary.main, 0.2),
                            bgcolor: alpha(theme.palette.primary.main, 0.02),
                            borderRadius: 3,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              borderColor: alpha(theme.palette.primary.main, 0.4),
                              transform: 'translateY(-2px)',
                              boxShadow: theme.shadows[8]
                            }
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Avatar sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: 'primary.main',
                                width: 32,
                                height: 32
                              }}>
                                <ScheduleIcon sx={{ fontSize: 18 }} />
                              </Avatar>
                              <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                Created
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 500,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              lineHeight: 1.4
                            }}>
                              {selectedTask.CreatedAt ? new Date(selectedTask.CreatedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Unknown'}
                            </Typography>
                          </Card>
                        </Grid>

                        {/* Last Updated Card */}
                        <Grid item xs={12} sm={6} md={6}>
                          <Card sx={{ 
                            p: { xs: 2, sm: 3 },
                            border: 1,
                            borderColor: alpha(theme.palette.secondary.main, 0.2),
                            bgcolor: alpha(theme.palette.secondary.main, 0.02),
                            borderRadius: 3,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              borderColor: alpha(theme.palette.secondary.main, 0.4),
                              transform: 'translateY(-2px)',
                              boxShadow: theme.shadows[8]
                            }
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Avatar sx={{ 
                                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                color: 'secondary.main',
                                width: 32,
                                height: 32
                              }}>
                                <EditIcon sx={{ fontSize: 18 }} />
                              </Avatar>
                              <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                Last Updated
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 500,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              lineHeight: 1.4
                            }}>
                              {selectedTask.UpdatedAt ? new Date(selectedTask.UpdatedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Not updated'}
                            </Typography>
                          </Card>
                        </Grid>

                        {/* Notes moved to its own section below */}

                        {/* Completed Card (if completed) */}
                        {selectedTask.CompletedDate && (
                          <Grid item xs={12} sm={6} md={4}>
                            <Card sx={{ 
                              p: { xs: 2, sm: 3 },
                              border: 1,
                              borderColor: alpha(theme.palette.success.main, 0.2),
                              bgcolor: alpha(theme.palette.success.main, 0.02),
                              borderRadius: 3,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                borderColor: alpha(theme.palette.success.main, 0.4),
                                transform: 'translateY(-2px)',
                                boxShadow: theme.shadows[8]
                              }
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Avatar sx={{ 
                                  bgcolor: alpha(theme.palette.success.main, 0.1),
                                  color: 'success.main',
                                  width: 32,
                                  height: 32
                                }}>
                                  <CompleteIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                  Completed
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 500,
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                lineHeight: 1.4
                              }}>
                                {new Date(selectedTask.CompletedDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Typography>
                            </Card>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </Grow>
                </Grid>

                {/* Project and Category */}
                {(selectedTask.Project || selectedTask.Category) && (
                  <Grid item xs={12}>
                    <Grow in timeout={800}>
                      <Box>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            mb: { xs: 2, sm: 3 }, 
                            fontWeight: 700,
                            fontSize: { xs: '1.1rem', sm: '1.25rem' },
                            color: 'text.primary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <TaskIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                          Additional Information
                        </Typography>
                        <Grid container spacing={{ xs: 2, sm: 3 }}>
                          {selectedTask.Project && (
                            <Grid item xs={12} md={6}>
                              <Card sx={{ 
                                p: { xs: 2, sm: 3 },
                                border: 1,
                                borderColor: alpha(theme.palette.primary.main, 0.2),
                                bgcolor: alpha(theme.palette.primary.main, 0.02),
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                height: '100%',
                                '&:hover': {
                                  borderColor: alpha(theme.palette.primary.main, 0.4),
                                  transform: 'translateY(-2px)',
                                  boxShadow: theme.shadows[8]
                                }
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                  <Avatar sx={{ 
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: 'primary.main',
                                    width: 32,
                                    height: 32
                                  }}>
                                    <TaskIcon sx={{ fontSize: 18 }} />
                                  </Avatar>
                                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                    Project
                                  </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: 600,
                                  fontSize: { xs: '0.875rem', sm: '1rem' }
                                }}>
                                  {selectedTask.Project}
                                </Typography>
                              </Card>
                            </Grid>
                          )}
                          {selectedTask.Category && (
                            <Grid item xs={12} md={6}>
                              <Card sx={{ 
                                p: { xs: 2, sm: 3 },
                                border: 1,
                                borderColor: alpha(theme.palette.secondary.main, 0.2),
                                bgcolor: alpha(theme.palette.secondary.main, 0.02),
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                height: '100%',
                                '&:hover': {
                                  borderColor: alpha(theme.palette.secondary.main, 0.4),
                                  transform: 'translateY(-2px)',
                                  boxShadow: theme.shadows[8]
                                }
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                  <Avatar sx={{ 
                                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                    color: 'secondary.main',
                                    width: 32,
                                    height: 32
                                  }}>
                                    <TaskIcon sx={{ fontSize: 18 }} />
                                  </Avatar>
                                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                    Category
                                  </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: 600,
                                  fontSize: { xs: '0.875rem', sm: '1rem' }
                                }}>
                                  {selectedTask.Category}
                                </Typography>
                              </Card>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    </Grow>
                  </Grid>
                )}

                {/* Time Tracking */}
                {(selectedTask.EstimatedHours || selectedTask.ActualHours || selectedTask.Progress) && (
                  <Grid item xs={12}>
                    <Grow in timeout={900}>
                      <Box>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            mb: { xs: 2, sm: 3 }, 
                            fontWeight: 700,
                            fontSize: { xs: '1.1rem', sm: '1.25rem' },
                            color: 'text.primary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <ScheduleIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                          Time Tracking
                        </Typography>
                        <Grid container spacing={{ xs: 2, sm: 3 }}>
                          <Grid item xs={12} sm={4}>
                            <Card sx={{ 
                              p: { xs: 2, sm: 3 },
                              textAlign: 'center',
                              border: 1,
                              borderColor: alpha(theme.palette.info.main, 0.2),
                              bgcolor: alpha(theme.palette.info.main, 0.02),
                              borderRadius: 3,
                              transition: 'all 0.3s ease',
                              height: '100%',
                              '&:hover': {
                                borderColor: alpha(theme.palette.info.main, 0.4),
                                transform: 'translateY(-2px)',
                                boxShadow: theme.shadows[8]
                              }
                            }}>
                              <Avatar sx={{ 
                                bgcolor: alpha(theme.palette.info.main, 0.1),
                                color: 'info.main',
                                width: 40,
                                height: 40,
                                mx: 'auto',
                                mb: 2
                              }}>
                                <ScheduleIcon sx={{ fontSize: 20 }} />
                              </Avatar>
                              <Typography variant="h3" sx={{ 
                                fontWeight: 700, 
                                color: 'info.main',
                                fontSize: { xs: '1.5rem', sm: '2rem' },
                                mb: 1
                              }}>
                                {selectedTask.EstimatedHours || 0}h
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Estimated Hours
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Card sx={{ 
                              p: { xs: 2, sm: 3 },
                              textAlign: 'center',
                              border: 1,
                              borderColor: alpha(theme.palette.warning.main, 0.2),
                              bgcolor: alpha(theme.palette.warning.main, 0.02),
                              borderRadius: 3,
                              transition: 'all 0.3s ease',
                              height: '100%',
                              '&:hover': {
                                borderColor: alpha(theme.palette.warning.main, 0.4),
                                transform: 'translateY(-2px)',
                                boxShadow: theme.shadows[8]
                              }
                            }}>
                              <Avatar sx={{ 
                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                color: 'warning.main',
                                width: 40,
                                height: 40,
                                mx: 'auto',
                                mb: 2
                              }}>
                                <ScheduleIcon sx={{ fontSize: 20 }} />
                              </Avatar>
                              <Typography variant="h3" sx={{ 
                                fontWeight: 700, 
                                color: 'warning.main',
                                fontSize: { xs: '1.5rem', sm: '2rem' },
                                mb: 1
                              }}>
                                {selectedTask.ActualHours || 0}h
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Actual Hours
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Card sx={{ 
                              p: { xs: 2, sm: 3 },
                              textAlign: 'center',
                              border: 1,
                              borderColor: alpha(theme.palette.success.main, 0.2),
                              bgcolor: alpha(theme.palette.success.main, 0.02),
                              borderRadius: 3,
                              transition: 'all 0.3s ease',
                              height: '100%',
                              '&:hover': {
                                borderColor: alpha(theme.palette.success.main, 0.4),
                                transform: 'translateY(-2px)',
                                boxShadow: theme.shadows[8]
                              }
                            }}>
                              <Avatar sx={{ 
                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                color: 'success.main',
                                width: 40,
                                height: 40,
                                mx: 'auto',
                                mb: 2
                              }}>
                                <CompleteIcon sx={{ fontSize: 20 }} />
                              </Avatar>
                              <Typography variant="h3" sx={{ 
                                fontWeight: 700, 
                                color: 'success.main',
                                fontSize: { xs: '1.5rem', sm: '2rem' },
                                mb: 1
                              }}>
                                {selectedTask.Progress || 0}%
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Progress
                              </Typography>
                              <Box sx={{ mt: 2, width: '100%' }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={selectedTask.Progress || 0} 
                                  sx={{ 
                                    height: 8, 
                                    borderRadius: 4,
                                    bgcolor: alpha(theme.palette.success.main, 0.1),
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: 'success.main',
                                      borderRadius: 4
                                    }
                                  }}
                                />
                              </Box>
                            </Card>
                          </Grid>
                        </Grid>
                      </Box>
                    </Grow>
                  </Grid>
                )}

                {/* Notes */}
                <Grid item xs={12}>
                  <Grow in timeout={1000}>
                    <Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          mb: { xs: 2, sm: 3 }, 
                          fontWeight: 700,
                          fontSize: { xs: '1.1rem', sm: '1.25rem' },
                          color: 'text.primary',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <EditIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                        Notes
                      </Typography>
                      <Card sx={{ 
                        p: { xs: 2, sm: 3 },
                        border: 1,
                        borderColor: alpha(theme.palette.grey[400], 0.3),
                        bgcolor: alpha(theme.palette.grey[50], 0.5),
                        borderRadius: 3,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                          boxShadow: theme.shadows[4]
                        }
                      }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            lineHeight: 1.6,
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            fontStyle: (selectedTask?.Notes || 'NA') === 'NA' ? 'italic' : 'normal',
                            color: (selectedTask?.Notes || 'NA') === 'NA' ? 'text.secondary' : 'text.primary'
                          }}
                        >
                          {selectedTask?.Notes || 'NA'}
                        </Typography>
                      </Card>
                    </Box>
                  </Grow>
                </Grid>
            </Grid>
            </Fade>
          )}
        </DialogContent>

        <DialogActions sx={{ 
          p: { xs: 2, sm: 3 }, 
          gap: { xs: 1, sm: 2 },
          flexDirection: { xs: 'column', sm: 'row' },
          position: 'sticky',
          bottom: 0,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          borderRadius: { xs: 0, sm: '0 0 16px 16px' }
        }}>
          <Button
            onClick={() => setTaskDetailOpen(false)}
            sx={{ 
              borderRadius: 3,
              px: { xs: 3, sm: 4 },
              py: { xs: 1, sm: 1.5 },
              width: { xs: '100%', sm: 'auto' },
              order: { xs: 3, sm: 1 }
            }}
          >
            Close
          </Button>
          {selectedTask && selectedTask.Status !== 'Completed' && (
            <>
              <Button
                onClick={() => {
                  handleEditTask(selectedTask);
                  setTaskDetailOpen(false);
                }}
                variant="outlined"
                startIcon={<EditIcon />}
                sx={{ 
                  borderRadius: 3,
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1, sm: 1.5 },
                  width: { xs: '100%', sm: 'auto' },
                  order: { xs: 2, sm: 2 },
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-1px)',
                    boxShadow: theme.shadows[4]
                  }
                }}
              >
                Edit Task
              </Button>
              <Button
                onClick={() => {
                  handleStatusChange(selectedTask.TaskId, 'Completed');
                  setTaskDetailOpen(false);
                }}
                variant="contained"
                startIcon={<CompleteIcon />}
                sx={{ 
                  borderRadius: 3,
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1, sm: 1.5 },
                  width: { xs: '100%', sm: 'auto' },
                  order: { xs: 1, sm: 3 },
                  boxShadow: theme.shadows[4],
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: theme.shadows[8]
                  }
                }}
              >
                Mark Complete
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* FAB for mobile */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={handleCreateTask}
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

export default EnhancedTasksTab;
