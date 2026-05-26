import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Badge,
  Typography,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Alert,
  Collapse,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ListItemButton,
  CircularProgress
} from '@mui/material';
import {
  Assignment,
  Notifications,
  Today,
  ExpandMore,
  CheckCircle,
  Schedule,
  Warning,
  Error,
  Info,
  Close,
  Refresh,
  CalendarToday,
  AccessTime,
  Person,
  Business,
  Description,
  ArrowForward,
  Build,
  Inventory,
  Dashboard
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import flowService from '../../services/flowService';
import purchaseFlowService from '../../services/purchaseFlowService';
import salesFlowService from '../../services/salesFlowService';
import poService from '../../services/poService';
import materialCalculationService from '../../services/materialCalculationService';
import dashboardService from '../../services/dashboardService';
import config from '../../config/config';

const HeaderTasks = () => {
  const { user, role: userRole } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState({
    po: [],
    purchase: [],
    sales: [],
    cable: [],
    inventory: [],
    dashboard: []
  });
  const [todaysTasks, setTodaysTasks] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && tasksOpen) {
      fetchAllTasks();
    }
  }, [user, tasksOpen]);

  const fetchAllTasks = async () => {
    if (!user || !user.email) {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const promises = [];

      // Fetch PO tasks
      if (['CEO', 'Process Coordinator', 'Customer Relations Manager'].includes(userRole)) {
        promises.push(
          poService.getAllPOs().catch(() => [])
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      // Fetch Purchase Flow tasks
      if (['Purchase Manager', 'Store Manager', 'Quality Engineer'].includes(userRole)) {
        promises.push(
          purchaseFlowService.getUserTasks(user.email).catch(() => [])
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      // Fetch Sales Flow tasks
      if (['Sales Executive', 'Customer Relations Manager', 'Director'].includes(userRole)) {
        promises.push(
          salesFlowService.getUserTasks(user.email, userRole).catch((error) => {
            console.error('❌ Error fetching sales tasks:', error);
            return [];
          })
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      // Fetch Cable Production tasks
      if (['Cable Production Supervisor', 'Customer Relations Manager'].includes(userRole)) {
        promises.push(
          materialCalculationService.getUserCableProductionTasks(user.email).catch(() => [])
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      // Fetch Inventory tasks
      if (['Store Manager'].includes(userRole)) {
        promises.push(
          materialCalculationService.getUserInventoryTasks(user.email).catch(() => [])
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      // Fetch Dashboard tasks
      if (['CEO', 'Process Coordinator'].includes(userRole)) {
        promises.push(
          dashboardService.getDashboardTasks(user.email, userRole).catch(() => [])
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      const [po, purchase, sales, cable, inventory, dashboard] = await Promise.all(promises);
      setTasks({ po, purchase, sales, cable, inventory, dashboard });
      
             // Combine all tasks for today's checklist
       const allTasks = [...po, ...purchase, ...sales, ...cable, ...inventory, ...dashboard];
       const today = new Date().toDateString();
       
       const todayTasks = allTasks.filter(task => {
         // Check if task is due today based on calculated due date (CreatedAt + TAT)
         const calculatedDueDate = calculateDueDate(task);
         if (calculatedDueDate) {
           return calculatedDueDate.toDateString() === today;
         }
         
         // Fallback to original fields if calculation fails
         if (task.DueDate) {
           return new Date(task.DueDate).toDateString() === today;
         }
         if (task.ExpectedDelivery) {
           return new Date(task.ExpectedDelivery).toDateString() === today;
         }
         
         // Show tasks created today or yesterday as fallback
         if (task.CreatedAt) {
           const createdDate = new Date(task.CreatedAt);
           const daysDiff = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));
           return daysDiff <= 1;
         }
         return false;
       });
      
      setTodaysTasks(todayTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setTasksOpen(true);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setTasksOpen(false);
  };

  const getTaskIcon = (task) => {
    // Use a consistent icon for all tasks
    return <Assignment color="primary" />;
  };

  const getTaskPriority = (task) => {
    // Only show priority if it's explicitly set
    if (task.Priority === 'High') {
      return 'error';
    }
    if (task.Priority === 'Medium') {
      return 'warning';
    }
    if (task.Priority === 'Low') {
      return 'default';
    }
    return 'default';
  };

  const calculateDueDate = (task) => {
    // Calculate due date as CreatedAt + TAT
    const createdAt = task.CreatedAt || task.CreatedAt;
    const tat = task.TAT || task.TAT;
    
    if (!createdAt || !tat) return null;
    
    try {
      const createdDate = new Date(createdAt);
      const tatDays = parseInt(tat) || 0;
      
      // Add TAT days to created date
      const dueDate = new Date(createdDate);
      dueDate.setDate(createdDate.getDate() + tatDays);
      
      return dueDate;
    } catch (error) {
      console.error('Error calculating due date:', error);
      return null;
    }
  };

  const getDueDateChip = (task) => {
    const dueDate = calculateDueDate(task);
    if (!dueDate) return null;
    
    const today = new Date();
    const due = new Date(dueDate);
    const isOverdue = due < today;
    const isDueToday = due.toDateString() === today.toDateString();
    const isDueTomorrow = due.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    let label = '';
    let color = 'default';
    
    if (isOverdue) {
      label = 'Overdue';
      color = 'error';
    } else if (isDueToday) {
      label = 'Due Today';
      color = 'warning';
    } else if (isDueTomorrow) {
      label = 'Due Tomorrow';
      color = 'info';
    } else {
      const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 3) {
        label = `Due in ${daysUntilDue} days`;
        color = 'warning';
      } else if (daysUntilDue <= 7) {
        label = `Due in ${daysUntilDue} days`;
        color = 'info';
      } else {
        label = `Due in ${daysUntilDue} days`;
        color = 'default';
      }
    }
    
    return (
      <Chip
        label={label}
        size="small"
        color={color}
        variant="outlined"
        sx={{ fontSize: '0.7rem' }}
      />
    );
  };

  const getTaskCount = () => {
    return tasks.po.length + tasks.purchase.length + tasks.sales.length + tasks.cable.length + tasks.inventory.length + tasks.dashboard.length;
  };

  const getTodaysTaskCount = () => {
    return todaysTasks.length;
  };

  const handleTaskClick = (task, flowType) => {
    let path = '/';
    
    switch (flowType) {
      case 'po':
        path = `/flow-management?poId=${task.POId}`;
        break;
      case 'purchase':
        path = `/purchase-flow?indentNumber=${task.IndentNumber}`;
        break;
      case 'sales':
        // For sales, navigate to the specific step based on NextStep
        path = getSalesStepPath(task);
        // Store sales flow step data in sessionStorage like the Take Action button
        sessionStorage.setItem('currentSalesFlowStep', JSON.stringify(task));
        break;
      case 'cable':
        path = `/cable-production?planId=${task.PlanId}`;
        break;
      case 'inventory':
        path = `/inventory?reqId=${task.ReqId}`;
        break;
      case 'dashboard':
        path = `/dashboard?poId=${task.POId}`;
        break;
      default:
        path = '/';
    }
    navigate(path);
    handleClose();
  };

  // Get the specific sales step path based on NextStep
  const getSalesStepPath = (task) => {
    const nextStep = task.NextStep;
    const logId = task.LogId;
    switch (nextStep) {
      case '1':
        return `/sales-flow/log-and-qualify-leads`;
      case '2':
        return `/sales-flow/initial-call`;
      case '3':
        return `/sales-flow/evaluate-high-value-prospects`;
      case '4':
        return `/sales-flow/check-feasibility`;
      case '5':
        return `/sales-flow/confirm-standards`;
      case '6':
        return `/sales-flow/send-quotation`;
      case '7':
        return `/sales-flow/approve-payment-terms`;
      case '8':
        return `/sales-flow/sample-submission`;
      case '9':
        return `/sales-flow/get-approval-for-sample`;
      case '10':
        return `/sales-flow/approve-strategic-deals`;
      case '11':
        return `/sales-flow/details`;
      default:
        // Fallback to general sales flow
        return `/sales-flow`;
    }
  };

  const renderTaskList = (taskList, flowType, title) => {
    if (!taskList || taskList.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            No pending tasks
          </Typography>
        </Box>
      );
    }

    return (
      <List dense>
        {taskList.slice(0, 5).map((task, index) => (
          <ListItem key={index} disablePadding>
            <ListItemButton onClick={() => handleTaskClick(task, flowType)}>
              <ListItemIcon>
                {getTaskIcon(task)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" noWrap>
                      {getTaskDisplayName(task, flowType)}
                    </Typography>
                    {task.Priority && task.Priority !== 'Medium' && (
                      <Chip
                        label={task.Priority}
                        size="small"
                        color={getTaskPriority(task)}
                        variant="outlined"
                      />
                    )}
                    {getDueDateChip(task)}
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="textSecondary" noWrap>
                    {getTaskDescription(task, flowType)}
                  </Typography>
                }
              />
              <ArrowForward fontSize="small" color="action" />
            </ListItemButton>
          </ListItem>
        ))}
        {taskList.length > 5 && (
          <ListItem>
            <Typography variant="caption" color="textSecondary">
              +{taskList.length - 5} more tasks
            </Typography>
          </ListItem>
        )}
      </List>
    );
  };

  const renderTodaysChecklist = () => {
    if (todaysTasks.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="body1" color="success.main">
            All caught up for today!
          </Typography>
        </Box>
      );
    }

    return (
      <List dense>
        {todaysTasks.map((task, index) => (
          <ListItem key={index} disablePadding>
            <ListItemButton onClick={() => handleTaskClick(task, getTaskFlowType(task))}>
              <ListItemIcon>
                {getTaskIcon(task)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" noWrap>
                      {getTaskDisplayName(task, getTaskFlowType(task))}
                    </Typography>
                    <Chip
                      label="Today"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    {getDueDateChip(task)}
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="textSecondary" noWrap>
                    {getTaskDescription(task, getTaskFlowType(task))}
                  </Typography>
                }
              />
              <ArrowForward fontSize="small" color="action" />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    );
  };

  const getTaskDisplayName = (task, flowType) => {
    switch (flowType) {
      case 'po':
        return `PO: ${task.POId || 'Unknown'}`;
      case 'purchase':
        return `Purchase: ${task.ItemName || task.ItemCode || task.IndentNumber || 'Unknown'}`;
      case 'sales':
        return `Sales: ${task.FullName || task.CompanyName || task.LogId || 'Unknown'}`;
      case 'cable':
        return `Production: ${task.PlanId || 'Unknown'}`;
      case 'inventory':
        return `Inventory: ${task.ReqId || 'Unknown'}`;
      case 'dashboard':
        return `Dashboard: ${task.POId || 'Unknown'}`;
      default:
        return task.POId || task.IndentNumber || task.LogId || task.PlanId || task.ReqId || 'Task';
    }
  };

  const getTaskDescription = (task, flowType) => {
    let description = '';
    
    switch (flowType) {
      case 'po':
        description = task.Status || 'PO Task';
        break;
      case 'purchase':
        description = task.Action || 'Purchase Task';
        break;
      case 'sales':
        description = getSalesStepDescription(task.NextStep) || 'Sales Task';
        break;
      case 'cable':
        description = task.Status || 'Production Task';
        break;
      case 'inventory':
        description = task.Status || 'Inventory Task';
        break;
      case 'dashboard':
        description = task.Status || 'Dashboard Task';
        break;
      default:
        description = 'Task';
    }
    
    // Add calculated due date (CreatedAt + TAT) if available
    const dueDate = calculateDueDate(task);
    if (dueDate) {
      const formattedDate = dueDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      description += ` • Due: ${formattedDate}`;
    }
    
    return description;
  };

  // Get human-readable description for sales steps
  const getSalesStepDescription = (nextStep) => {
    switch (nextStep) {
      case '1':
        return 'Log & Qualify Leads';
      case '2':
        return 'Initial Call & Requirement Gathering';
      case '3':
        return 'Evaluate High Value Prospects';
      case '4':
        return 'Check Feasibility';
      case '5':
        return 'Confirm Standard & Compliance';
      case '6':
        return 'Send Quotation';
      case '7':
        return 'Approve Payment Terms';
      case '8':
        return 'Sample Submission';
      case '9':
        return 'Get Approval for Sample';
      case '10':
        return 'Approve Strategic Deals';
      case '11':
        return 'Final Step';
      default:
        return 'Sales Task';
    }
  };

  const getTaskFlowType = (task) => {
    // Check for sales tasks first (they have LogId and Action fields)
    if (task.LogId && (task.Action || task.Role === 'Sales Executive')) {
      return 'sales';
    }
    if (task.TaskType === 'PO') {
      return 'dashboard';
    }
    if (task.POId) {
      return 'po';
    }
    if (task.IndentNumber) {
      return 'purchase';
    }
    if (task.PlanId) {
      return 'cable';
    }
    if (task.ReqId) {
      return 'inventory';
    }
    
    return 'po';
  };

  const tabLabels = [
    { label: 'Today', count: getTodaysTaskCount(), icon: <Today /> },
    { label: 'PO Tasks', count: tasks.po.length, icon: <Assignment /> },
    { label: 'Purchase', count: tasks.purchase.length, icon: <Business /> },
    { label: 'Sales', count: tasks.sales.length, icon: <Description /> },
    { label: 'Production', count: tasks.cable.length, icon: <Build /> },
    { label: 'Inventory', count: tasks.inventory.length, icon: <Inventory /> },
    { label: 'Dashboard', count: tasks.dashboard.length, icon: <Dashboard /> }
  ];

  return (
    <>
      <Tooltip title="View Tasks & Today's Checklist">
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{ 
            ml: 1,
            color: "#6b7280",
            "&:hover": { 
              backgroundColor: "#f3f4f6",
              color: "#374151"
            }
          }}
        >
          <Badge badgeContent={getTaskCount()} color="error">
            <Notifications sx={{ color: "#6b7280" ,"&:hover": { 
              backgroundColor: "#f3f4f6",
              color: "#374151"
            }}} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 600,
            maxHeight: 600,
            mt: 1
          }
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">
              Tasks & Today's Checklist
            </Typography>
            <Box>
              <IconButton size="small" onClick={fetchAllTasks} disabled={loading}>
                {loading ? <CircularProgress size={16} /> : <Refresh />}
              </IconButton>
              <IconButton size="small" onClick={handleClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}

          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 40 }}
          >
            {tabLabels.map((tab, index) => (
              <Tab
                key={index}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {tab.icon}
                    {tab.label}
                    {tab.count > 0 && (
                      <Chip
                        label={tab.count}
                        size="small"
                        color="primary"
                        sx={{ minWidth: 20, height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                }
                sx={{ minHeight: 40, fontSize: '0.8rem' }}
              />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ p: 0 }}>
          {activeTab === 0 && (
            <Box>
              <Box sx={{ p: 2, bgcolor: 'primary.50', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday fontSize="small" />
                  Today's Checklist ({getTodaysTaskCount()} tasks)
                </Typography>
              </Box>
              {renderTodaysChecklist()}
            </Box>
          )}
          
          {activeTab === 1 && (
            <Box>
              <Box sx={{ p: 2, bgcolor: 'info.50', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" color="info.main">
                  PO Tasks ({tasks.po.length} pending)
                </Typography>
              </Box>
              {renderTaskList(tasks.po, 'po', 'PO Tasks')}
            </Box>
          )}
          
          {activeTab === 2 && (
            <Box>
              <Box sx={{ p: 2, bgcolor: 'warning.50', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" color="warning.main">
                  Purchase Flow ({tasks.purchase.length} pending)
                </Typography>
              </Box>
              {renderTaskList(tasks.purchase, 'purchase', 'Purchase Flow')}
            </Box>
          )}
          
          {activeTab === 3 && (
            <Box>
              <Box sx={{ p: 2, bgcolor: 'success.50', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" color="success.main">
                  Sales Flow ({tasks.sales.length} pending)
                </Typography>
              </Box>
              {renderTaskList(tasks.sales, 'sales', 'Sales Flow')}
            </Box>
          )}
          
          {activeTab === 4 && (
            <Box>
              <Box sx={{ p: 2, bgcolor: 'secondary.50', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" color="secondary.main">
                  Production ({tasks.cable.length} pending)
                </Typography>
              </Box>
              {renderTaskList(tasks.cable, 'cable', 'Production')}
            </Box>
          )}
          
          {activeTab === 5 && (
            <Box>
              <Box sx={{ p: 2, bgcolor: 'error.50', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" color="error.main">
                  Inventory ({tasks.inventory.length} pending)
                </Typography>
              </Box>
              {renderTaskList(tasks.inventory, 'inventory', 'Inventory')}
            </Box>
          )}
          
          {activeTab === 6 && (
            <Box>
              <Box sx={{ p: 2, bgcolor: 'primary.50', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" color="primary.main">
                  Dashboard ({tasks.dashboard.length} urgent)
                </Typography>
              </Box>
              {renderTaskList(tasks.dashboard, 'dashboard', 'Dashboard')}
            </Box>
          )}
        </Box>

        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Typography variant="caption" color="textSecondary">
            Click on any task to navigate to the corresponding flow
          </Typography>
        </Box>
      </Menu>
    </>
  );
};

export default HeaderTasks;
