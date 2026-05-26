import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Tabs, Tab, Grid, Card, CardContent, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Tooltip, Stack, Avatar, LinearProgress,
  Alert, Snackbar, Autocomplete, Badge, Divider, useTheme, alpha, Menu, ListItemIcon, ListItemText,
  List, ListItem, ListItemAvatar
} from '@mui/material';
import {
  People, TrendingUp, Assignment, Phone, Email, Event, Note,
  Add, Edit, Delete, Search, FilterList, Refresh, Business,
  AttachMoney, CalendarToday, CheckCircle, Cancel, Schedule,
  Call, Groups, Task, Star, MoreVert, Timeline, Assessment,
  Title, Description, Percent, Category, Person as PersonIcon,
  LocationOn, AccountBalance, AccessTime, PriorityHigh,
  Folder, FolderOpen, Close as CloseIcon, CheckCircle as CheckIcon,
  PersonAdd, ShoppingCart, PhoneInTalk, Payment
} from '@mui/icons-material';
import { DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import crmService from '../../services/crmService';
import salesFlowService from '../../services/salesFlowService';
import { getAllClients as getAllProspectsClients } from '../../services/prospectsClientService';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import AdvancedPagination from '../flowManagement/AdvancedPagination';
import ClientDashboardModal from './ClientDashboardModal';
import CollectionsDashboard from './CollectionsDashboard';

const CRMManagement = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Data states
  const [leads, setLeads] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [clients, setClients] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [orderTaking, setOrderTaking] = useState([]);
  const [activities, setActivities] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);

  // Menu states
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedClientForAction, setSelectedClientForAction] = useState(null);
  
  // Client Dashboard Modal state
  const [openClientDashboard, setOpenClientDashboard] = useState(false);
  const [selectedClientForDashboard, setSelectedClientForDashboard] = useState(null);
  
  // Prospect Dashboard Modal state (can reuse the same modal)
  const [openProspectDashboard, setOpenProspectDashboard] = useState(false);
  const [selectedProspectForDashboard, setSelectedProspectForDashboard] = useState(null);

  // Dialog states
  const [openOpportunityDialog, setOpenOpportunityDialog] = useState(false);
  const [openActivityDialog, setOpenActivityDialog] = useState(false);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [openNoteDialog, setOpenNoteDialog] = useState(false);
  const [openNoteDetailsDialog, setOpenNoteDetailsDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [openInteractionDialog, setOpenInteractionDialog] = useState(false);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [openCallLogDialog, setOpenCallLogDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);

  // Form states
  const [opportunityForm, setOpportunityForm] = useState({
    clientCode: '', title: '', description: '', value: '', currency: 'INR',
    stage: 'Prospecting', probability: 0, expectedCloseDate: null, source: '',
    assignedTo: '', products: [], notes: '', status: 'Active'
  });
  const [activityForm, setActivityForm] = useState({
    clientCode: '', opportunityId: '', type: 'Call', subject: '', description: '',
    activityDate: new Date(), duration: 0, assignedTo: '', status: 'Planned',
    priority: 'Medium', outcome: '', nextAction: ''
  });
  const [taskForm, setTaskForm] = useState({
    clientCode: '', opportunityId: '', title: '', description: '', dueDate: null,
    priority: 'Medium', status: 'Pending', assignedTo: '', reminderDate: null
  });
  const [noteForm, setNoteForm] = useState({
    clientCode: '', opportunityId: '', title: '', content: '', category: 'General', tags: []
  });
  const [interactionForm, setInteractionForm] = useState({
    clientCode: '', opportunityId: '', type: 'Email', direction: 'Outbound', subject: '',
    content: '', to: '', dateTime: new Date(), duration: 0, status: 'Sent'
  });
  const [orderForm, setOrderForm] = useState({
    clientCode: '', date: new Date(), amount: '', currency: 'INR', status: 'Pending', products: [], notes: ''
  });
  const [callLogForm, setCallLogForm] = useState({
    clientCode: '', dateTime: new Date(), direction: 'Outbound', duration: 0, phoneNumber: '',
    status: 'Completed', notes: '', outcome: '', nextAction: ''
  });
  const [paymentForm, setPaymentForm] = useState({
    clientCode: '', opportunityId: '', date: new Date(), amount: '', currency: 'INR',
    method: '', status: 'Pending', reference: '', notes: ''
  });

  // Filter and search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedStage, setSelectedStage] = useState('All');

  // Pagination states
  const [leadsPage, setLeadsPage] = useState(0);
  const [leadsRowsPerPage, setLeadsRowsPerPage] = useState(10);
  const [prospectsPage, setProspectsPage] = useState(0);
  const [prospectsRowsPerPage, setProspectsRowsPerPage] = useState(10);
  const [clientsPage, setClientsPage] = useState(0);
  const [clientsRowsPerPage, setClientsRowsPerPage] = useState(10);
  const [opportunitiesPage, setOpportunitiesPage] = useState(0);
  const [opportunitiesRowsPerPage, setOpportunitiesRowsPerPage] = useState(12);
  const [orderTakingPage, setOrderTakingPage] = useState(0);
  const [orderTakingRowsPerPage, setOrderTakingRowsPerPage] = useState(10);
  const [tasksPage, setTasksPage] = useState(0);
  const [tasksRowsPerPage, setTasksRowsPerPage] = useState(10);
  const [activitiesPage, setActivitiesPage] = useState(0);
  const [activitiesRowsPerPage, setActivitiesRowsPerPage] = useState(10);
  const [interactionsPage, setInteractionsPage] = useState(0);
  const [interactionsRowsPerPage, setInteractionsRowsPerPage] = useState(10);
  const [callLogsPage, setCallLogsPage] = useState(0);
  const [callLogsRowsPerPage, setCallLogsRowsPerPage] = useState(10);
  const [paymentsPage, setPaymentsPage] = useState(0);
  const [paymentsRowsPerPage, setPaymentsRowsPerPage] = useState(10);
  const [notesPage, setNotesPage] = useState(0);
  const [notesRowsPerPage, setNotesRowsPerPage] = useState(12);

  // Analytics
  const [analytics, setAnalytics] = useState({
    totalClients: 0,
    totalLeads: 0,
    totalProspects: 0,
    activeOpportunities: 0,
    pipelineValue: 0,
    weightedPipeline: 0,
    upcomingTasks: 0,
    recentActivities: 0,
    totalOrders: 0,
    totalPayments: 0,
    totalCallLogs: 0,
    pendingTasks: 0,
    completedTasks: 0,
    opportunitiesByStage: {},
    totalPaymentAmount: 0,
    totalOrderAmount: 0
  });

  useEffect(() => {
    loadAllData();
  }, []);

  // Reset pagination when filters change or tab changes
  useEffect(() => {
    setLeadsPage(0);
    setProspectsPage(0);
    setClientsPage(0);
    setOpportunitiesPage(0);
    setOrderTakingPage(0);
    setTasksPage(0);
    setActivitiesPage(0);
    setInteractionsPage(0);
    setCallLogsPage(0);
    setPaymentsPage(0);
    setNotesPage(0);
  }, [selectedClient, selectedStage, searchTerm, activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [prospectsData, clientsData, oppsData, actsData, intsData, tasksData, notesData, leadsData, orderTakingData, callLogsData, paymentsData] = await Promise.all([
        getAllProspectsClients(),
        crmService.getAllClients(),
        crmService.getAllOpportunities(),
        crmService.getAllActivities(),
        crmService.getAllInteractions(),
        crmService.getAllTasks(),
        crmService.getAllNotes(),
        salesFlowService.getAllLeads(),
        crmService.getAllOrderTaking(),
        crmService.getAllCallLogs(),
        crmService.getAllPayments()
      ]);

      setProspects(prospectsData);
      setClients(clientsData);
      setOpportunities(oppsData);
      setActivities(actsData);
      setInteractions(intsData);
      setTasks(tasksData);
      setNotes(notesData);
      setLeads(leadsData.map(lead => ({
        name: lead.FullName || lead.CustomerName || '',
        company: lead.CompanyName || '',
        email: lead.Email || lead.EmailId || '',
        phone: lead.PhoneNumber || lead.MobileNumber || '',
        status: lead.QualificationStatus || lead.Status || 'New',
        source: lead.LeadSource || '',
        clientCode: lead.LogId || lead.EnquiryNumber || ''
      })));
      setOrderTaking(orderTakingData);
      setCallLogs(callLogsData);
      setPayments(paymentsData);

      // Calculate analytics
      const activeOpps = oppsData.filter(o => o.status === 'Active');
      const pipelineValue = activeOpps.reduce((sum, o) => sum + (o.value || 0), 0);
      const weightedPipeline = activeOpps.reduce((sum, o) => {
        return sum + ((o.value || 0) * (o.probability || 0) / 100);
      }, 0);
      const upcomingTasks = tasksData.filter(t => {
        if (t.status === 'Completed' || t.status === 'Cancelled') return false;
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate);
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        return due >= today && due <= nextWeek;
      });

      // Calculate opportunities by stage
      const oppsByStage = {};
      activeOpps.forEach(opp => {
        oppsByStage[opp.stage] = (oppsByStage[opp.stage] || 0) + 1;
      });

      // Calculate payment and order totals
      const totalPaymentAmount = paymentsData
        .filter(p => p.status === 'Completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const totalOrderAmount = orderTakingData
        .filter(o => o.status === 'Completed')
        .reduce((sum, o) => sum + (o.amount || 0), 0);

      setAnalytics({
        totalClients: clientsData.length,
        totalLeads: leadsData.length,
        totalProspects: prospectsData.length,
        activeOpportunities: activeOpps.length,
        pipelineValue,
        weightedPipeline,
        upcomingTasks: upcomingTasks.length,
        recentActivities: actsData.filter(a => {
          const actDate = new Date(a.activityDate);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return actDate >= weekAgo;
        }).length,
        totalOrders: orderTakingData.length,
        totalPayments: paymentsData.length,
        totalCallLogs: callLogsData.length,
        pendingTasks: tasksData.filter(t => t.status === 'Pending').length,
        completedTasks: tasksData.filter(t => t.status === 'Completed').length,
        opportunitiesByStage: oppsByStage,
        totalPaymentAmount,
        totalOrderAmount
      });
    } catch (error) {
      console.error('Error loading CRM data:', error);
      setSnackbar({ open: true, message: 'Error loading data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = !searchTerm || 
      opp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.clientCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = !selectedClient || opp.clientCode === selectedClient;
    const matchesStage = selectedStage === 'All' || opp.stage === selectedStage;
    return matchesSearch && matchesClient && matchesStage && opp.status === 'Active';
  });

  const filteredActivities = activities.filter(act => {
    const matchesClient = !selectedClient || act.clientCode === selectedClient;
    const matchesSearch = !searchTerm || 
      act.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClient && matchesSearch;
  }).sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));

  const filteredTasks = tasks.filter(task => {
    const matchesClient = !selectedClient || task.clientCode === selectedClient;
    const matchesSearch = !searchTerm || 
      task.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClient && matchesSearch;
  }).sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  // Opportunity handlers
  const handleCreateOpportunity = async () => {
    try {
      setLoading(true);
      await crmService.createOpportunity(opportunityForm, user?.email);
      setSnackbar({ open: true, message: 'Opportunity created successfully', severity: 'success' });
      setOpenOpportunityDialog(false);
      resetOpportunityForm();
      loadAllData();
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Error creating opportunity', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOpportunity = async (opportunityId) => {
    try {
      setLoading(true);
      await crmService.updateOpportunity(opportunityId, opportunityForm, user?.email);
      setSnackbar({ open: true, message: 'Opportunity updated successfully', severity: 'success' });
      setOpenOpportunityDialog(false);
      resetOpportunityForm();
      loadAllData();
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Error updating opportunity', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const resetOpportunityForm = () => {
    setOpportunityForm({
      clientCode: '', title: '', description: '', value: '', currency: 'INR',
      stage: 'Prospecting', probability: 0, expectedCloseDate: null, source: '',
      assignedTo: '', products: [], notes: '', status: 'Active'
    });
  };

  // Activity handlers
  const handleCreateActivity = async () => {
    try {
      setLoading(true);
      await crmService.createActivity(activityForm, user?.email);
      setSnackbar({ open: true, message: 'Activity created successfully', severity: 'success' });
      setOpenActivityDialog(false);
      setActivityForm({
        clientCode: '', opportunityId: '', type: 'Call', subject: '', description: '',
        activityDate: new Date(), duration: 0, assignedTo: '', status: 'Planned',
        priority: 'Medium', outcome: '', nextAction: ''
      });
      loadAllData();
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Error creating activity', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Task handlers
  const handleCreateTask = async () => {
    try {
      setLoading(true);
      await crmService.createTask(taskForm, user?.email);
      setSnackbar({ open: true, message: 'Task created successfully', severity: 'success' });
      setOpenTaskDialog(false);
      setTaskForm({
        clientCode: '', opportunityId: '', title: '', description: '', dueDate: null,
        priority: 'Medium', status: 'Pending', assignedTo: '', reminderDate: null
      });
      loadAllData();
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Error creating task', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      setLoading(true);
      const task = tasks.find(t => t.taskId === taskId);
      await crmService.updateTask(taskId, {
        ...task,
        status: newStatus,
        completedDate: newStatus === 'Completed' ? new Date().toISOString() : task.completedDate
      }, user?.email);
      setSnackbar({ open: true, message: 'Task updated successfully', severity: 'success' });
      loadAllData();
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Error updating task', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Interaction handlers
  const handleCreateInteraction = async () => {
    try {
      setLoading(true);
      await crmService.createInteraction(interactionForm, user?.email);
      setSnackbar({ open: true, message: 'Interaction logged successfully', severity: 'success' });
      setOpenInteractionDialog(false);
      setInteractionForm({
        clientCode: '', opportunityId: '', type: 'Email', direction: 'Outbound', subject: '',
        content: '', to: '', dateTime: new Date(), duration: 0, status: 'Sent'
      });
      loadAllData();
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Error logging interaction', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Note handlers
  const handleCreateNote = async () => {
    try {
      setLoading(true);
      await crmService.createNote(noteForm, user?.email);
      setSnackbar({ open: true, message: 'Note created successfully', severity: 'success' });
      setOpenNoteDialog(false);
      setNoteForm({
        clientCode: '', opportunityId: '', title: '', content: '', category: 'General', tags: []
      });
      loadAllData();
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Error creating note', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Order handlers
  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      await crmService.createOrderTaking(orderForm, user?.email);
      setSnackbar({ open: true, message: 'Order created successfully', severity: 'success' });
      setOpenOrderDialog(false);
      setOrderForm({
        clientCode: '', date: new Date(), amount: '', currency: 'INR', status: 'Pending', products: [], notes: ''
      });
      loadAllData();
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Error creating order', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Call Log handlers
  const handleCreateCallLog = async () => {
    try {
      setLoading(true);
      await crmService.createCallLog(callLogForm, user?.email);
      setSnackbar({ open: true, message: 'Call log created successfully', severity: 'success' });
      setOpenCallLogDialog(false);
      setCallLogForm({
        clientCode: '', dateTime: new Date(), direction: 'Outbound', duration: 0, phoneNumber: '',
        status: 'Completed', notes: '', outcome: '', nextAction: ''
      });
      loadAllData();
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Error creating call log', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Payment handlers
  const handleCreatePayment = async () => {
    try {
      setLoading(true);
      await crmService.createPayment(paymentForm, user?.email);
      setSnackbar({ open: true, message: 'Payment recorded successfully', severity: 'success' });
      setOpenPaymentDialog(false);
      setPaymentForm({
        clientCode: '', opportunityId: '', date: new Date(), amount: '', currency: 'INR',
        method: '', status: 'Pending', reference: '', notes: ''
      });
      loadAllData();
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Error recording payment', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Get stage color
  const getStageColor = (stage) => {
    const colors = {
      'Prospecting': 'info',
      'Qualification': 'warning',
      'Proposal': 'primary',
      'Negotiation': 'secondary',
      'Closed Won': 'success',
      'Closed Lost': 'error'
    };
    return colors[stage] || 'default';
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      'High': 'error',
      'Medium': 'warning',
      'Low': 'info'
    };
    return colors[priority] || 'default';
  };

  // Handle action menu
  const handleOpenActionMenu = (event, client) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setSelectedClientForAction(client);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
    setSelectedClientForAction(null);
  };

  const handleActionSelect = (tabIndex, client) => {
    handleCloseActionMenu();
    const clientCode = client?.clientCode || client || '';
    setSelectedClient(clientCode);
    setActiveTab(tabIndex);
    
    // Auto-populate forms based on selected action
    if (tabIndex === 4) {
      // Opportunities - reset form first, then set clientCode
      resetOpportunityForm();
      setOpportunityForm(prev => ({
        ...prev,
        clientCode: clientCode
      }));
      // Use setTimeout to ensure state is updated before opening dialog
      setTimeout(() => {
      setOpenOpportunityDialog(true);
      }, 0);
    } else if (tabIndex === 5) {
      // Order Taking - reset form first, then set clientCode
      setOrderForm({
        clientCode: clientCode, date: new Date(), amount: '', currency: 'INR', status: 'Pending', products: [], notes: ''
      });
      setTimeout(() => {
        setOpenOrderDialog(true);
      }, 0);
    } else if (tabIndex === 6) {
      // Tasks - reset form first, then set clientCode
      setTaskForm({
        clientCode: clientCode, opportunityId: '', title: '', description: '', dueDate: null,
        priority: 'Medium', status: 'Pending', assignedTo: '', reminderDate: null
      });
      setTimeout(() => {
      setOpenTaskDialog(true);
      }, 0);
    } else if (tabIndex === 7) {
      // Activities - reset form first, then set clientCode
      setActivityForm({
        clientCode: clientCode, opportunityId: '', type: 'Call', subject: '', description: '',
        activityDate: new Date(), duration: 0, assignedTo: '', status: 'Planned',
        priority: 'Medium', outcome: '', nextAction: ''
      });
      setTimeout(() => {
      setOpenActivityDialog(true);
      }, 0);
    } else if (tabIndex === 8) {
      // Interactions - reset form first, then set clientCode
      setInteractionForm({
        clientCode: clientCode, opportunityId: '', type: 'Email', direction: 'Outbound', subject: '',
        content: '', to: '', dateTime: new Date(), duration: 0, status: 'Sent'
      });
      setTimeout(() => {
      setOpenInteractionDialog(true);
      }, 0);
    } else if (tabIndex === 9) {
      // Call Logs - reset form first, then set clientCode
      setCallLogForm({
        clientCode: clientCode, dateTime: new Date(), direction: 'Outbound', duration: 0, phoneNumber: '',
        status: 'Completed', notes: '', outcome: '', nextAction: ''
      });
      setTimeout(() => {
        setOpenCallLogDialog(true);
      }, 0);
    } else if (tabIndex === 10) {
      // Payments - reset form first, then set clientCode
      setPaymentForm({
        clientCode: clientCode, opportunityId: '', date: new Date(), amount: '', currency: 'INR',
        method: '', status: 'Pending', reference: '', notes: ''
      });
      setTimeout(() => {
        setOpenPaymentDialog(true);
      }, 0);
    } else if (tabIndex === 11) {
      // Notes - reset form first, then set clientCode
      setNoteForm({
        clientCode: clientCode, opportunityId: '', title: '', content: '', category: 'General', tags: []
      });
      setTimeout(() => {
      setOpenNoteDialog(true);
      }, 0);
    }
  };

  // Combine prospects and clients for Autocomplete options
  const allClientsAndProspects = useMemo(() => {
    const combined = [...clients];
    // Add prospects that aren't already in clients (by clientCode)
    prospects.forEach(prospect => {
      if (!combined.find(c => c.clientCode === prospect.clientCode)) {
        combined.push(prospect);
      }
    });
    return combined;
  }, [clients, prospects]);

  // Helper function to find client/prospect by code
  const findClientByCode = (clientCode) => {
    if (!clientCode) return null;
    return allClientsAndProspects.find(c => c.clientCode === clientCode) || null;
  };

  if (loading && clients.length === 0) {
    return <LoadingSpinner message="Loading CRM data..." />;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Business sx={{ fontSize: 40, color: theme.palette.primary.main }} />
            CRM Management System
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage clients, opportunities, activities, and interactions in one place
          </Typography>
        </Box>

        {/* Analytics Dashboard */}
        {activeTab === 0 && (
          <Box>
            {/* Main KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="text.secondary" gutterBottom variant="body2">Total Clients</Typography>
                        <Typography variant="h4">{analytics.totalClients}</Typography>
                        <Typography variant="caption" color="text.secondary">Active clients</Typography>
                      </Box>
                      <People sx={{ fontSize: 48, color: theme.palette.primary.main, opacity: 0.5 }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="text.secondary" gutterBottom variant="body2">Active Opportunities</Typography>
                        <Typography variant="h4">{analytics.activeOpportunities}</Typography>
                        <Typography variant="caption" color="text.secondary">In pipeline</Typography>
                      </Box>
                      <TrendingUp sx={{ fontSize: 48, color: theme.palette.success.main, opacity: 0.5 }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="text.secondary" gutterBottom variant="body2">Pipeline Value</Typography>
                        <Typography variant="h4">₹{analytics.pipelineValue.toLocaleString('en-IN')}</Typography>
                        <Typography variant="caption" color="text.secondary">Total value</Typography>
                      </Box>
                      <AttachMoney sx={{ fontSize: 48, color: theme.palette.warning.main, opacity: 0.5 }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="text.secondary" gutterBottom variant="body2">Weighted Pipeline</Typography>
                        <Typography variant="h4">₹{analytics.weightedPipeline.toLocaleString('en-IN')}</Typography>
                        <Typography variant="caption" color="text.secondary">Expected value</Typography>
                      </Box>
                      <Assessment sx={{ fontSize: 48, color: theme.palette.info.main, opacity: 0.5 }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Secondary Metrics */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="text.secondary" gutterBottom variant="body2">Total Leads</Typography>
                        <Typography variant="h5">{analytics.totalLeads}</Typography>
                      </Box>
                      <PersonAdd sx={{ fontSize: 36, color: theme.palette.secondary.main, opacity: 0.5 }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="text.secondary" gutterBottom variant="body2">Prospects</Typography>
                        <Typography variant="h5">{analytics.totalProspects}</Typography>
                      </Box>
                      <Business sx={{ fontSize: 36, color: theme.palette.secondary.main, opacity: 0.5 }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="text.secondary" gutterBottom variant="body2">Total Orders</Typography>
                        <Typography variant="h5">{analytics.totalOrders}</Typography>
                        <Typography variant="caption" color="text.secondary">₹{analytics.totalOrderAmount.toLocaleString('en-IN')}</Typography>
                      </Box>
                      <ShoppingCart sx={{ fontSize: 36, color: theme.palette.success.main, opacity: 0.5 }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="text.secondary" gutterBottom variant="body2">Payments</Typography>
                        <Typography variant="h5">{analytics.totalPayments}</Typography>
                        <Typography variant="caption" color="text.secondary">₹{analytics.totalPaymentAmount.toLocaleString('en-IN')}</Typography>
                      </Box>
                      <Payment sx={{ fontSize: 36, color: theme.palette.warning.main, opacity: 0.5 }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="text.secondary" gutterBottom variant="body2">Call Logs</Typography>
                        <Typography variant="h5">{analytics.totalCallLogs}</Typography>
                      </Box>
                      <PhoneInTalk sx={{ fontSize: 36, color: theme.palette.info.main, opacity: 0.5 }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

                      </Box>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab label="Dashboard" icon={<Assessment />} iconPosition="start" />
            <Tab label="Leads" icon={<PersonAdd />} iconPosition="start" />
            <Tab label="Prospects" icon={<Business />} iconPosition="start" />
            <Tab label="Clients" icon={<People />} iconPosition="start" />
            <Tab 
              label={
                <Badge badgeContent={filteredOpportunities.length} color="primary">
                  Opportunities
                </Badge>
              } 
              icon={<TrendingUp />} 
              iconPosition="start" 
            />
            <Tab label="Order Taking" icon={<ShoppingCart />} iconPosition="start" />
            <Tab 
              label={
                <Badge badgeContent={filteredTasks.filter(t => t.status === 'Pending').length} color="error">
                  Tasks
                </Badge>
              } 
              icon={<Task />} 
              iconPosition="start" 
            />
            <Tab label="Activities" icon={<Event />} iconPosition="start" />
            <Tab label="Interactions" icon={<Phone />} iconPosition="start" />
            <Tab label="Call Logs" icon={<PhoneInTalk />} iconPosition="start" />
            <Tab label="Collections" icon={<Payment />} iconPosition="start" />
            <Tab label="Payments" icon={<Payment />} iconPosition="start" />
            <Tab label="Notes" icon={<Note />} iconPosition="start" />
          </Tabs>
        </Paper>

        {/* Filter Bar */}
        {(activeTab === 4 || activeTab === 6 || activeTab === 7) && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                size="small"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
                sx={{ flexGrow: 1 }}
              />
              <Autocomplete
                size="small"
                options={allClientsAndProspects}
                getOptionLabel={(option) => option.clientCode}
                value={selectedClient ? findClientByCode(selectedClient) : null}
                onChange={(e, newValue) => setSelectedClient(newValue?.clientCode || null)}
                renderInput={(params) => <TextField {...params} label="Filter by Client" />}
                sx={{ width: 250 }}
              />
              {activeTab === 4 && (
                <FormControl size="small" sx={{ width: 200 }}>
                  <InputLabel>Stage</InputLabel>
                  <Select value={selectedStage} onChange={(e) => setSelectedStage(e.target.value)} label="Stage">
                    <MenuItem value="All">All Stages</MenuItem>
                    <MenuItem value="Prospecting">Prospecting</MenuItem>
                    <MenuItem value="Qualification">Qualification</MenuItem>
                    <MenuItem value="Proposal">Proposal</MenuItem>
                    <MenuItem value="Negotiation">Negotiation</MenuItem>
                    <MenuItem value="Closed Won">Closed Won</MenuItem>
                    <MenuItem value="Closed Lost">Closed Lost</MenuItem>
                  </Select>
                </FormControl>
              )}
              <IconButton onClick={loadAllData}><Refresh /></IconButton>
            </Stack>
          </Paper>
        )}

        {/* Tab Content */}
        <Box>
          {/* Leads Tab */}
          {activeTab === 1 && (
            <TableContainer component={Paper}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Leads ({leads.length})</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => {
                  // TODO: Implement lead creation dialog
                  setSnackbar({ open: true, message: 'Lead creation feature coming soon', severity: 'info' });
                }}>
                  New Lead
                </Button>
              </Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Lead Name</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Source</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No leads found. Create your first lead to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads
                      .slice(leadsPage * leadsRowsPerPage, leadsPage * leadsRowsPerPage + leadsRowsPerPage)
                      .map((lead, index) => (
                        <TableRow key={index}>
                          <TableCell>{lead.name || 'N/A'}</TableCell>
                          <TableCell>{lead.company || 'N/A'}</TableCell>
                          <TableCell>{lead.email || 'N/A'}</TableCell>
                          <TableCell>{lead.phone || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip label={lead.status || 'New'} color="primary" size="small" />
                          </TableCell>
                          <TableCell>{lead.source || 'N/A'}</TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
              <AdvancedPagination
                totalItems={leads.length}
                itemsPerPage={leadsRowsPerPage}
                currentPage={leadsPage + 1}
                onPageChange={(newPage) => setLeadsPage(newPage - 1)}
                onItemsPerPageChange={(newRowsPerPage) => {
                  setLeadsRowsPerPage(newRowsPerPage);
                  setLeadsPage(0);
                }}
                pageSizeOptions={[5, 10, 25, 50, 100]}
                showPageSizeOptions={true}
                showJumpToPage={true}
                showStatistics={true}
                showRefreshButton={false}
                onRefresh={loadAllData}
              />
            </TableContainer>
          )}

          {/* Prospects Tab */}
          {activeTab === 2 && (
            <TableContainer component={Paper}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Prospects ({prospects.length})</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => window.location.href = '/prospects-clients'}>
                  Manage Prospects
                </Button>
              </Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Client Code</TableCell>
                    <TableCell>Business Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Rating</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prospects
                    .slice(prospectsPage * prospectsRowsPerPage, prospectsPage * prospectsRowsPerPage + prospectsRowsPerPage)
                    .map((prospect) => (
                      <TableRow 
                        key={prospect.clientCode}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { 
                            backgroundColor: alpha(theme.palette.primary.main, 0.05) 
                          }
                        }}
                        onClick={() => {
                          setSelectedProspectForDashboard(prospect);
                          setOpenProspectDashboard(true);
                        }}
                      >
                        <TableCell>{prospect.clientCode}</TableCell>
                        <TableCell>{prospect.businessType}</TableCell>
                        <TableCell>
                          <Chip label={prospect.status || 'Active'} color={prospect.status === 'Active' ? 'success' : 'default'} size="small" />
                        </TableCell>
                        <TableCell>{prospect.city}</TableCell>
                        <TableCell>{prospect.state}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                sx={{ fontSize: 16, color: star <= (prospect.rating || 0) ? 'gold' : 'grey.300' }}
                              />
                            ))}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <AdvancedPagination
                totalItems={prospects.length}
                itemsPerPage={prospectsRowsPerPage}
                currentPage={prospectsPage + 1}
                onPageChange={(newPage) => setProspectsPage(newPage - 1)}
                onItemsPerPageChange={(newRowsPerPage) => {
                  setProspectsRowsPerPage(newRowsPerPage);
                  setProspectsPage(0);
                }}
                pageSizeOptions={[5, 10, 25, 50, 100]}
                showPageSizeOptions={true}
                showJumpToPage={true}
                showStatistics={true}
                showRefreshButton={false}
                onRefresh={loadAllData}
              />
            </TableContainer>
          )}

          {/* Clients Tab */}
          {activeTab === 3 && (
            <TableContainer component={Paper}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Clients ({clients.length})</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => window.location.href = '/clients'}>
                  Manage Clients
                </Button>
              </Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Client Code</TableCell>
                    <TableCell>Business Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Total Orders</TableCell>
                    <TableCell>Total Value</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clients
                    .slice(clientsPage * clientsRowsPerPage, clientsPage * clientsRowsPerPage + clientsRowsPerPage)
                    .map((client) => (
                      <TableRow 
                        key={client.clientCode}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { 
                            backgroundColor: alpha(theme.palette.primary.main, 0.05) 
                          }
                        }}
                        onClick={() => {
                          setSelectedClientForDashboard(client);
                          setOpenClientDashboard(true);
                        }}
                      >
                        <TableCell>{client.clientCode}</TableCell>
                        <TableCell>{client.businessType}</TableCell>
                        <TableCell>
                          <Chip label={client.status} color={client.status === 'Active' ? 'success' : 'default'} size="small" />
                        </TableCell>
                        <TableCell>{client.totalOrders || 0}</TableCell>
                        <TableCell>₹{client.totalValue?.toLocaleString('en-IN') || 0}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                sx={{ fontSize: 16, color: star <= (client.rating || 0) ? 'gold' : 'grey.300' }}
                              />
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Actions">
                            <IconButton 
                              size="small" 
                              onClick={(e) => handleOpenActionMenu(e, client)}
                            >
                              <MoreVert />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <AdvancedPagination
                totalItems={clients.length}
                itemsPerPage={clientsRowsPerPage}
                currentPage={clientsPage + 1}
                onPageChange={(newPage) => setClientsPage(newPage - 1)}
                onItemsPerPageChange={(newRowsPerPage) => {
                  setClientsRowsPerPage(newRowsPerPage);
                  setClientsPage(0);
                }}
                pageSizeOptions={[5, 10, 25, 50, 100]}
                showPageSizeOptions={true}
                showJumpToPage={true}
                showStatistics={true}
                showRefreshButton={false}
                onRefresh={loadAllData}
              />
            </TableContainer>
          )}

          {/* Opportunities Tab */}
          {activeTab === 4 && (
            <TableContainer component={Paper}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Opportunities ({filteredOpportunities.length})</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => {
                  resetOpportunityForm();
                  setOpenOpportunityDialog(true);
                }}>
                  New Opportunity
                </Button>
              </Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Opportunity ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Value</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Stage</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Probability</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Weighted Value</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Expected Close</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOpportunities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No opportunities found. Create your first opportunity to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOpportunities
                      .slice(opportunitiesPage * opportunitiesRowsPerPage, opportunitiesPage * opportunitiesRowsPerPage + opportunitiesRowsPerPage)
                      .map((opp) => (
                        <TableRow key={opp.opportunityId} hover>
                          <TableCell>{opp.opportunityId || 'N/A'}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {opp.title || 'N/A'}
                            </Typography>
                            {opp.description && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {opp.description.length > 50 ? `${opp.description.substring(0, 50)}...` : opp.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{opp.clientCode || 'N/A'}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              ₹{opp.value?.toLocaleString('en-IN') || 0}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={opp.stage || 'Prospecting'} 
                              color={getStageColor(opp.stage)} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2">{opp.probability || 0}%</Typography>
                              <LinearProgress 
                                variant="determinate" 
                                value={opp.probability || 0} 
                                sx={{ width: 60, height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              ₹{((opp.value || 0) * (opp.probability || 0) / 100).toLocaleString('en-IN')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {opp.expectedCloseDate ? (
                              new Date(opp.expectedCloseDate).toLocaleDateString()
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={opp.status || 'Active'} 
                              color={opp.status === 'Active' ? 'success' : opp.status === 'Closed' ? 'default' : 'error'} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="Edit Opportunity">
                                <IconButton 
                                  size="small" 
                                  onClick={() => {
                                    setOpportunityForm({ ...opp, expectedCloseDate: opp.expectedCloseDate ? new Date(opp.expectedCloseDate) : null });
                                    setOpenOpportunityDialog(true);
                                  }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Add Activity">
                                <IconButton 
                                  size="small" 
                                  onClick={() => {
                                    setActivityForm(prev => ({ ...prev, clientCode: opp.clientCode, opportunityId: opp.opportunityId }));
                                    setOpenActivityDialog(true);
                                  }}
                                >
                                  <Event fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
              <AdvancedPagination
                totalItems={filteredOpportunities.length}
                itemsPerPage={opportunitiesRowsPerPage}
                currentPage={opportunitiesPage + 1}
                onPageChange={(newPage) => setOpportunitiesPage(newPage - 1)}
                onItemsPerPageChange={(newRowsPerPage) => {
                  setOpportunitiesRowsPerPage(newRowsPerPage);
                  setOpportunitiesPage(0);
                }}
                pageSizeOptions={[5, 10, 25, 50, 100]}
                showPageSizeOptions={true}
                showJumpToPage={true}
                showStatistics={true}
                showRefreshButton={false}
                onRefresh={loadAllData}
              />
            </TableContainer>
          )}

          {/* Order Taking Tab */}
          {activeTab === 5 && (
            <TableContainer component={Paper}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Order Taking ({orderTaking.length})</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => {
                  setOrderForm({
                    clientCode: '', date: new Date(), amount: '', currency: 'INR', status: 'Pending', products: [], notes: ''
                  });
                  setOpenOrderDialog(true);
                }}>
                  New Order
                </Button>
              </Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderTaking.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No orders found. Create your first order to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orderTaking
                      .slice(orderTakingPage * orderTakingRowsPerPage, orderTakingPage * orderTakingRowsPerPage + orderTakingRowsPerPage)
                      .map((order, index) => (
                        <TableRow key={index}>
                          <TableCell>{order.orderId || 'N/A'}</TableCell>
                          <TableCell>{order.clientCode || 'N/A'}</TableCell>
                          <TableCell>{order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>₹{order.amount?.toLocaleString('en-IN') || 0}</TableCell>
                          <TableCell>
                            <Chip label={order.status || 'Pending'} color={order.status === 'Completed' ? 'success' : 'default'} size="small" />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small">
                              <Edit />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
              <AdvancedPagination
                totalItems={orderTaking.length}
                itemsPerPage={orderTakingRowsPerPage}
                currentPage={orderTakingPage + 1}
                onPageChange={(newPage) => setOrderTakingPage(newPage - 1)}
                onItemsPerPageChange={(newRowsPerPage) => {
                  setOrderTakingRowsPerPage(newRowsPerPage);
                  setOrderTakingPage(0);
                }}
                pageSizeOptions={[5, 10, 25, 50, 100]}
                showPageSizeOptions={true}
                showJumpToPage={true}
                showStatistics={true}
                showRefreshButton={false}
                onRefresh={loadAllData}
              />
            </TableContainer>
          )}

          {/* Tasks Tab */}
          {activeTab === 6 && (
            <Box>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Tasks ({filteredTasks.length})</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => {
                  setTaskForm({
                    clientCode: selectedClient || '', opportunityId: '', title: '', description: '', dueDate: null,
                    priority: 'Medium', status: 'Pending', assignedTo: '', reminderDate: null
                  });
                  setOpenTaskDialog(true);
                }}>
                  New Task
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Assigned To</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTasks
                      .slice(tasksPage * tasksRowsPerPage, tasksPage * tasksRowsPerPage + tasksRowsPerPage)
                      .map((task) => (
                      <TableRow key={task.taskId}>
                        <TableCell>{task.title}</TableCell>
                        <TableCell>
                          {task.clientCode || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip label={task.priority} color={getPriorityColor(task.priority)} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={task.status} 
                            color={task.status === 'Completed' ? 'success' : task.status === 'Pending' ? 'warning' : 'default'} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{task.assignedTo}</TableCell>
                        <TableCell>
                          {task.status !== 'Completed' && (
                            <IconButton size="small" onClick={() => handleUpdateTaskStatus(task.taskId, 'Completed')}>
                              <CheckCircle color="success" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <AdvancedPagination
                totalItems={filteredTasks.length}
                itemsPerPage={tasksRowsPerPage}
                currentPage={tasksPage + 1}
                onPageChange={(newPage) => setTasksPage(newPage - 1)}
                onItemsPerPageChange={(newRowsPerPage) => {
                  setTasksRowsPerPage(newRowsPerPage);
                  setTasksPage(0);
                }}
                pageSizeOptions={[5, 10, 25, 50, 100]}
                showPageSizeOptions={true}
                showJumpToPage={true}
                showStatistics={true}
                showRefreshButton={false}
                onRefresh={loadAllData}
              />
            </Box>
          )}

          {/* Activities Tab */}
          {activeTab === 7 && (
            <Box>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Activities ({filteredActivities.length})</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => {
                  setActivityForm({
                    clientCode: selectedClient || '', opportunityId: '', type: 'Call', subject: '', description: '',
                    activityDate: new Date(), duration: 0, assignedTo: '', status: 'Planned',
                    priority: 'Medium', outcome: '', nextAction: ''
                  });
                  setOpenActivityDialog(true);
                }}>
                  New Activity
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Outcome</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredActivities
                      .slice(activitiesPage * activitiesRowsPerPage, activitiesPage * activitiesRowsPerPage + activitiesRowsPerPage)
                      .map((activity) => (
                      <TableRow key={activity.activityId}>
                        <TableCell>
                          {new Date(activity.activityDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={activity.type} 
                            icon={activity.type === 'Call' ? <Call /> : activity.type === 'Meeting' ? <Groups /> : <Task />}
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{activity.subject}</TableCell>
                        <TableCell>
                          {activity.clientCode || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={activity.status} 
                            color={activity.status === 'Completed' ? 'success' : 'warning'} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{activity.outcome || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <AdvancedPagination
                totalItems={filteredActivities.length}
                itemsPerPage={activitiesRowsPerPage}
                currentPage={activitiesPage + 1}
                onPageChange={(newPage) => setActivitiesPage(newPage - 1)}
                onItemsPerPageChange={(newRowsPerPage) => {
                  setActivitiesRowsPerPage(newRowsPerPage);
                  setActivitiesPage(0);
                }}
                pageSizeOptions={[5, 10, 25, 50, 100]}
                showPageSizeOptions={true}
                showJumpToPage={true}
                showStatistics={true}
                showRefreshButton={false}
                onRefresh={loadAllData}
              />
            </Box>
          )}

          {/* Interactions Tab */}
          {activeTab === 8 && (
            <Box>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Interactions ({interactions.length})</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => {
                  setInteractionForm({
                    clientCode: selectedClient || '', opportunityId: '', type: 'Email', direction: 'Outbound', subject: '',
                    content: '', to: '', dateTime: new Date(), duration: 0, status: 'Sent'
                  });
                  setOpenInteractionDialog(true);
                }}>
                  Log Interaction
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date/Time</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Direction</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {interactions
                      .filter(i => !selectedClient || i.clientCode === selectedClient)
                      .slice(interactionsPage * interactionsRowsPerPage, interactionsPage * interactionsRowsPerPage + interactionsRowsPerPage)
                      .map((interaction) => (
                      <TableRow key={interaction.interactionId}>
                        <TableCell>
                          {new Date(interaction.dateTime).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={interaction.type} 
                            icon={interaction.type === 'Email' ? <Email /> : <Phone />}
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={interaction.direction} 
                            color={interaction.direction === 'Outbound' ? 'primary' : 'secondary'} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{interaction.subject}</TableCell>
                        <TableCell>
                          {interaction.clientCode || 'N/A'}
                        </TableCell>
                        <TableCell>{interaction.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <AdvancedPagination
                totalItems={interactions.filter(i => !selectedClient || i.clientCode === selectedClient).length}
                itemsPerPage={interactionsRowsPerPage}
                currentPage={interactionsPage + 1}
                onPageChange={(newPage) => setInteractionsPage(newPage - 1)}
                onItemsPerPageChange={(newRowsPerPage) => {
                  setInteractionsRowsPerPage(newRowsPerPage);
                  setInteractionsPage(0);
                }}
                pageSizeOptions={[5, 10, 25, 50, 100]}
                showPageSizeOptions={true}
                showJumpToPage={true}
                showStatistics={true}
                showRefreshButton={false}
                onRefresh={loadAllData}
              />
            </Box>
          )}

          {/* Call Logs Tab */}
          {activeTab === 9 && (
            <TableContainer component={Paper}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Call Logs ({callLogs.length})</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => {
                  setCallLogForm({
                    clientCode: '', dateTime: new Date(), direction: 'Outbound', duration: 0, phoneNumber: '',
                    status: 'Completed', notes: '', outcome: '', nextAction: ''
                  });
                  setOpenCallLogDialog(true);
                }}>
                  Log Call
                </Button>
              </Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Direction</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {callLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No call logs found. Log your first call to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    callLogs
                      .slice(callLogsPage * callLogsRowsPerPage, callLogsPage * callLogsRowsPerPage + callLogsRowsPerPage)
                      .map((log, index) => (
                        <TableRow key={index}>
                          <TableCell>{log.dateTime ? new Date(log.dateTime).toLocaleString() : 'N/A'}</TableCell>
                          <TableCell>{log.clientCode || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip label={log.direction || 'Outbound'} color={log.direction === 'Inbound' ? 'primary' : 'default'} size="small" />
                          </TableCell>
                          <TableCell>{log.duration ? `${log.duration} min` : 'N/A'}</TableCell>
                          <TableCell>
                            <Chip label={log.status || 'Completed'} color="success" size="small" />
                          </TableCell>
                          <TableCell>{log.notes || 'N/A'}</TableCell>
                          <TableCell>
                            <IconButton size="small">
                              <Edit />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
              <AdvancedPagination
                totalItems={callLogs.length}
                itemsPerPage={callLogsRowsPerPage}
                currentPage={callLogsPage + 1}
                onPageChange={(newPage) => setCallLogsPage(newPage - 1)}
                onItemsPerPageChange={(newRowsPerPage) => {
                  setCallLogsRowsPerPage(newRowsPerPage);
                  setCallLogsPage(0);
                }}
                pageSizeOptions={[5, 10, 25, 50, 100]}
                showPageSizeOptions={true}
                showJumpToPage={true}
                showStatistics={true}
                showRefreshButton={false}
                onRefresh={loadAllData}
              />
            </TableContainer>
          )}

          {/* Payments Tab */}
          {activeTab === 10 && (
            <TableContainer component={Paper}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Payments ({payments.length})</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => {
                  setPaymentForm({
                    clientCode: '', opportunityId: '', date: new Date(), amount: '', currency: 'INR',
                    method: '', status: 'Pending', reference: '', notes: ''
                  });
                  setOpenPaymentDialog(true);
                }}>
                  Record Payment
                </Button>
              </Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Payment ID</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No payments found. Record your first payment to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments
                      .slice(paymentsPage * paymentsRowsPerPage, paymentsPage * paymentsRowsPerPage + paymentsRowsPerPage)
                      .map((payment, index) => (
                        <TableRow key={index}>
                          <TableCell>{payment.paymentId || 'N/A'}</TableCell>
                          <TableCell>{payment.clientCode || 'N/A'}</TableCell>
                          <TableCell>{payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>₹{payment.amount?.toLocaleString('en-IN') || 0}</TableCell>
                          <TableCell>{payment.method || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip label={payment.status || 'Pending'} color={payment.status === 'Completed' ? 'success' : 'default'} size="small" />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small">
                              <Edit />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
              <AdvancedPagination
                totalItems={payments.length}
                itemsPerPage={paymentsRowsPerPage}
                currentPage={paymentsPage + 1}
                onPageChange={(newPage) => setPaymentsPage(newPage - 1)}
                onItemsPerPageChange={(newRowsPerPage) => {
                  setPaymentsRowsPerPage(newRowsPerPage);
                  setPaymentsPage(0);
                }}
                pageSizeOptions={[5, 10, 25, 50, 100]}
                showPageSizeOptions={true}
                showJumpToPage={true}
                showStatistics={true}
                showRefreshButton={false}
                onRefresh={loadAllData}
              />
            </TableContainer>
          )}

          {/* Notes Tab */}
          {activeTab === 11 && (
            <Box>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Notes ({notes.length})</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => {
                  setNoteForm({
                    clientCode: selectedClient || '', opportunityId: '', title: '', content: '', category: 'General', tags: []
                  });
                  setOpenNoteDialog(true);
                }}>
                  New Note
                </Button>
              </Box>
              <Paper sx={{ mb: 2 }}>
                <List>
                  {(() => {
                    const filteredNotes = notes.filter(n => !selectedClient || n.clientCode === selectedClient);
                    const paginatedNotes = filteredNotes.slice(notesPage * notesRowsPerPage, notesPage * notesRowsPerPage + notesRowsPerPage);
                    
                    if (paginatedNotes.length === 0) {
                      return (
                        <ListItem>
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', width: '100%', py: 4 }}>
                            No notes found
                          </Typography>
                        </ListItem>
                      );
                    }
                    
                    return paginatedNotes.map((note, index) => (
                      <React.Fragment key={note.noteId}>
                        <ListItem
                          alignItems="flex-start"
                          onClick={() => {
                            setSelectedNote(note);
                            setOpenNoteDetailsDialog(true);
                          }}
                          sx={{
                            py: 2,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                              <Note />
                            </Avatar>
                          </ListItemAvatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                                {note.title}
                              </Typography>
                              <Chip 
                                label={note.category} 
                                size="small" 
                                sx={{ ml: 1 }}
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                mb: 1,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {note.content || 'No content'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Client: {note.clientCode || 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                          {new Date(note.createdAt).toLocaleString()}
                        </Typography>
                            </Box>
                          </Box>
                        </ListItem>
                        {index < paginatedNotes.length - 1 && (
                          <Divider component="li" />
                        )}
                      </React.Fragment>
                    ));
                  })()}
                </List>
              </Paper>
              <AdvancedPagination
                totalItems={notes.filter(n => !selectedClient || n.clientCode === selectedClient).length}
                itemsPerPage={notesRowsPerPage}
                currentPage={notesPage + 1}
                onPageChange={(newPage) => setNotesPage(newPage - 1)}
                onItemsPerPageChange={(newRowsPerPage) => {
                  setNotesRowsPerPage(newRowsPerPage);
                  setNotesPage(0);
                }}
                pageSizeOptions={[10, 25, 50, 100]}
                showPageSizeOptions={true}
                showJumpToPage={true}
                showStatistics={true}
                showRefreshButton={false}
                onRefresh={loadAllData}
              />
            </Box>
          )}

          {activeTab === 12 && (
            <CollectionsDashboard />
          )}
        </Box>

        {/* Opportunity Dialog */}
        <Dialog 
          open={openOpportunityDialog} 
          onClose={() => {
            if (!opportunityForm.opportunityId) {
              resetOpportunityForm();
            }
            setOpenOpportunityDialog(false);
          }} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              border: 'none'
            }
          }}
          BackdropProps={{
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(4px)'
            }
          }}
        >
          <DialogTitle sx={{ p: 0, textAlign: 'center', pt: 4, pb: 2, position: 'relative' }}>
            <IconButton
              onClick={() => {
                if (!opportunityForm.opportunityId) {
                  resetOpportunityForm();
                }
                setOpenOpportunityDialog(false);
              }}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#1976d2',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.1)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center',
                lineHeight: 1.2
              }}
            >
                  {opportunityForm.opportunityId ? 'Edit Opportunity' : 'Add New Opportunity'}
                </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                textAlign: 'center',
                mt: 1
              }}
            >
                  {opportunityForm.opportunityId ? 'Update opportunity details' : 'Create new sales opportunity entry'}
                </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 4, py: 2, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Basic Information Section */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#1976d2' }}>
                <Business sx={{ fontSize: 20 }} />
                Basic Information
              </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Autocomplete
                      key={`opportunity-client-${opportunityForm.clientCode}-${openOpportunityDialog}`}
                      options={allClientsAndProspects}
                      getOptionLabel={(option) => option.clientCode}
                      value={findClientByCode(opportunityForm.clientCode)}
                    onChange={(e, newValue) => setOpportunityForm({ ...opportunityForm, clientCode: newValue?.clientCode || '' })}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Client *" 
                        required
                          variant="standard"
                        InputProps={{
                          ...params.InputProps,
                            startAdornment: <People color="action" sx={{ mr: 1 }} />
                          }}
                          sx={{
                            '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                            '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                            '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                            '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#1976d2' } },
                            '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                        }}
                      />
                    )}
                  />
                  </Box>
                  <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <TextField 
                    fullWidth 
                    label="Title *" 
                    value={opportunityForm.title} 
                    onChange={(e) => setOpportunityForm({ ...opportunityForm, title: e.target.value })}
                    required
                      variant="standard"
                    InputProps={{
                        startAdornment: <Title color="action" sx={{ mr: 1 }} />
                      }}
                      sx={{
                        '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                        '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                        '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#1976d2' } },
                        '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                      }}
                    />
                  </Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <TextField 
                    fullWidth 
                    label="Description" 
                    multiline 
                    rows={3} 
                    value={opportunityForm.description}
                    onChange={(e) => setOpportunityForm({ ...opportunityForm, description: e.target.value })}
                    variant="standard"
                    InputProps={{
                      startAdornment: <Description color="action" sx={{ mr: 1, alignSelf: 'flex-start', mt: 1.5 }} />
                    }}
                    sx={{
                      '& .MuiInputBase-root': { alignItems: 'flex-start' },
                      '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                      '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                      '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#1976d2' } }
                    }}
                  />
                </Box>
            </Box>

            {/* Opportunity Details Section */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#1976d2' }}>
                <TrendingUp sx={{ fontSize: 20 }} />
                Opportunity Details
              </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <TextField 
                    fullWidth 
                    label="Value *" 
                    type="number" 
                    value={opportunityForm.value}
                    onChange={(e) => setOpportunityForm({ ...opportunityForm, value: e.target.value })}
                    required
                      variant="standard"
                    InputProps={{
                        startAdornment: <AttachMoney color="action" sx={{ mr: 1 }} />
                      }}
                      sx={{
                        '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                        '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                        '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#1976d2' } },
                        '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <FormControl fullWidth variant="standard">
                    <InputLabel>Currency</InputLabel>
                    <Select 
                      value={opportunityForm.currency} 
                      onChange={(e) => setOpportunityForm({ ...opportunityForm, currency: e.target.value })} 
                      label="Currency"
                    >
                      <MenuItem value="INR">INR</MenuItem>
                      <MenuItem value="USD">USD</MenuItem>
                    </Select>
                  </FormControl>
                  </Box>
                  <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <FormControl fullWidth required variant="standard">
                    <InputLabel>Stage *</InputLabel>
                    <Select 
                      value={opportunityForm.stage} 
                      onChange={(e) => setOpportunityForm({ ...opportunityForm, stage: e.target.value })} 
                      label="Stage *"
                    >
                      <MenuItem value="Prospecting">Prospecting</MenuItem>
                      <MenuItem value="Qualification">Qualification</MenuItem>
                      <MenuItem value="Proposal">Proposal</MenuItem>
                      <MenuItem value="Negotiation">Negotiation</MenuItem>
                      <MenuItem value="Closed Won">Closed Won</MenuItem>
                      <MenuItem value="Closed Lost">Closed Lost</MenuItem>
                    </Select>
                  </FormControl>
                  </Box>
                  <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <TextField 
                    fullWidth 
                    label="Probability (%)" 
                    type="number" 
                    value={opportunityForm.probability}
                    onChange={(e) => setOpportunityForm({ ...opportunityForm, probability: parseInt(e.target.value) || 0 })} 
                    inputProps={{ min: 0, max: 100 }}
                      variant="standard"
                    InputProps={{
                        startAdornment: <Percent color="action" sx={{ mr: 1 }} />
                      }}
                      sx={{
                        '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                        '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                        '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#1976d2' } },
                        '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <DatePicker
                    label="Expected Close Date"
                    value={opportunityForm.expectedCloseDate}
                    onChange={(date) => setOpportunityForm({ ...opportunityForm, expectedCloseDate: date })}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true,
                          variant: 'standard',
                        InputProps: {
                            startAdornment: <CalendarToday color="action" sx={{ mr: 1 }} />
                          },
                          sx: {
                            '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                            '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                            '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                            '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#1976d2' } },
                            '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                        }
                      } 
                    }}
                  />
                  </Box>
                  <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <TextField 
                    fullWidth 
                    label="Source" 
                    value={opportunityForm.source}
                    onChange={(e) => setOpportunityForm({ ...opportunityForm, source: e.target.value })}
                    placeholder="Type or select source"
                      variant="standard"
                    InputProps={{
                        startAdornment: <LocationOn color="action" sx={{ mr: 1 }} />
                      }}
                      sx={{
                        '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                        '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                        '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#1976d2' } },
                        '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <TextField 
                    fullWidth 
                    label="Assigned To" 
                    value={opportunityForm.assignedTo}
                    onChange={(e) => setOpportunityForm({ ...opportunityForm, assignedTo: e.target.value })}
                    placeholder="Type or select person"
                      variant="standard"
                    InputProps={{
                        startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />
                      }}
                      sx={{
                        '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                        '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                        '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#1976d2' } },
                        '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                      }}
                    />
                  </Box>
                </Box>
            </Box>

            {/* Additional Information Section */}
            <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#1976d2' }}>
                <Note sx={{ fontSize: 20 }} />
                Additional Information
              </Typography>
                <Box sx={{ mt: 2 }}>
                  <TextField 
                    fullWidth 
                    label="Notes" 
                    multiline 
                    rows={3} 
                    value={opportunityForm.notes}
                    onChange={(e) => setOpportunityForm({ ...opportunityForm, notes: e.target.value })}
                    placeholder="Add any additional notes or comments..."
                    variant="standard"
                    InputProps={{
                      startAdornment: <Note color="action" sx={{ mr: 1, alignSelf: 'flex-start', mt: 1.5 }} />
                    }}
                    sx={{
                      '& .MuiInputBase-root': { alignItems: 'flex-start' },
                      '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                      '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                      '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#1976d2' } }
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
            <Button 
              onClick={() => {
                if (!opportunityForm.opportunityId) {
                  resetOpportunityForm();
                }
                setOpenOpportunityDialog(false);
              }} 
              variant="outlined"
              startIcon={<CloseIcon />}
              size="large"
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={opportunityForm.opportunityId ? 
                () => handleUpdateOpportunity(opportunityForm.opportunityId) : handleCreateOpportunity}
              startIcon={opportunityForm.opportunityId ? <CheckIcon /> : <Folder />}
              size="large"
              sx={{ 
                bgcolor: '#4caf50',
                '&:hover': { bgcolor: '#2e7d32' }
              }}
            >
              {opportunityForm.opportunityId ? 'Update Opportunity' : 'Create Opportunity'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Activity Dialog */}
        <Dialog 
          open={openActivityDialog} 
          onClose={() => {
            setActivityForm({
              clientCode: '', opportunityId: '', type: 'Call', subject: '', description: '',
              activityDate: new Date(), duration: 0, assignedTo: '', status: 'Planned',
              priority: 'Medium', outcome: '', nextAction: ''
            });
            setOpenActivityDialog(false);
          }} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              border: 'none'
            }
          }}
          BackdropProps={{
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(4px)'
            }
          }}
        >
          <DialogTitle sx={{ p: 0, textAlign: 'center', pt: 4, pb: 2, position: 'relative' }}>
            <IconButton
              onClick={() => {
                setActivityForm({
                  clientCode: '', opportunityId: '', type: 'Call', subject: '', description: '',
                  activityDate: new Date(), duration: 0, assignedTo: '', status: 'Planned',
                  priority: 'Medium', outcome: '', nextAction: ''
                });
                setOpenActivityDialog(false);
              }}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#1976d2',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.1)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center',
                lineHeight: 1.2
              }}
            >
                  Add New Activity
                </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                textAlign: 'center',
                mt: 1
              }}
            >
                  Log a new activity (call, meeting, email, etc.)
                </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 4, py: 2, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
            {/* Basic Information Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.primary.main }}>
                <Event sx={{ fontSize: 20 }} />
                Activity Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    key={`activity-client-${activityForm.clientCode}-${openActivityDialog}`}
                    options={allClientsAndProspects}
                    getOptionLabel={(option) => option.clientCode}
                    value={findClientByCode(activityForm.clientCode)}
                    onChange={(e, newValue) => setActivityForm({ ...activityForm, clientCode: newValue?.clientCode || '' })}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Client *" 
                        required
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <People sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                              {params.InputProps.startAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Type *</InputLabel>
                    <Select 
                      value={activityForm.type} 
                      onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })} 
                      label="Type *"
                    >
                      <MenuItem value="Call">Call</MenuItem>
                      <MenuItem value="Meeting">Meeting</MenuItem>
                      <MenuItem value="Email">Email</MenuItem>
                      <MenuItem value="Task">Task</MenuItem>
                      <MenuItem value="Note">Note</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="Subject *" 
                    value={activityForm.subject}
                    onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                    required
                    InputProps={{
                      startAdornment: <Title sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="Description" 
                    multiline 
                    rows={3} 
                    value={activityForm.description}
                    onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                    placeholder="Add activity details..."
                    InputProps={{
                      startAdornment: <Description sx={{ mr: 1, color: 'text.secondary', fontSize: 20, alignSelf: 'flex-start', mt: 1.5 }} />
                    }}
                    sx={{
                      '& .MuiInputBase-root': {
                        alignItems: 'flex-start'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Schedule & Assignment Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.primary.main }}>
                <Schedule sx={{ fontSize: 20 }} />
                Schedule & Assignment
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <DateTimePicker
                    label="Activity Date *"
                    value={activityForm.activityDate}
                    onChange={(date) => setActivityForm({ ...activityForm, activityDate: date })}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true,
                        required: true,
                        InputProps: {
                          startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                        }
                      } 
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    label="Duration (minutes)" 
                    type="number" 
                    value={activityForm.duration}
                    onChange={(e) => setActivityForm({ ...activityForm, duration: parseInt(e.target.value) || 0 })}
                    placeholder="Optional (e.g., 30, 60, ...)"
                    InputProps={{
                      startAdornment: <AccessTime sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select 
                      value={activityForm.priority} 
                      onChange={(e) => setActivityForm({ ...activityForm, priority: e.target.value })} 
                      label="Priority"
                    >
                      <MenuItem value="High">High</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="Low">Low</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    label="Assigned To" 
                    value={activityForm.assignedTo}
                    onChange={(e) => setActivityForm({ ...activityForm, assignedTo: e.target.value })}
                    placeholder="Type or select person"
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Outcome Section */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.primary.main }}>
                <CheckCircle sx={{ fontSize: 20 }} />
                Outcome & Next Steps
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="Outcome" 
                    value={activityForm.outcome}
                    onChange={(e) => setActivityForm({ ...activityForm, outcome: e.target.value })}
                    placeholder="Describe the outcome of this activity..."
                    multiline
                    rows={2}
                    InputProps={{
                      startAdornment: <CheckCircle sx={{ mr: 1, color: 'text.secondary', fontSize: 20, alignSelf: 'flex-start', mt: 1.5 }} />
                    }}
                    sx={{
                      '& .MuiInputBase-root': {
                        alignItems: 'flex-start'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="Next Action" 
                    value={activityForm.nextAction}
                    onChange={(e) => setActivityForm({ ...activityForm, nextAction: e.target.value })}
                    placeholder="What should be done next?"
                    InputProps={{
                      startAdornment: <Task sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
            <Button 
              onClick={() => {
                setActivityForm({
                  clientCode: '', opportunityId: '', type: 'Call', subject: '', description: '',
                  activityDate: new Date(), duration: 0, assignedTo: '', status: 'Planned',
                  priority: 'Medium', outcome: '', nextAction: ''
                });
                setOpenActivityDialog(false);
              }} 
              variant="outlined"
              startIcon={<CloseIcon />}
              size="large"
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCreateActivity}
              startIcon={<Folder />}
              size="large"
              sx={{ 
                bgcolor: '#4caf50',
                '&:hover': { bgcolor: '#2e7d32' }
              }}
            >
              Create Activity
            </Button>
          </DialogActions>
        </Dialog>

        {/* Task Dialog */}
        <Dialog 
          open={openTaskDialog} 
          onClose={() => {
            setTaskForm({
              clientCode: '', opportunityId: '', title: '', description: '', dueDate: null,
              priority: 'Medium', status: 'Pending', assignedTo: '', reminderDate: null
            });
            setOpenTaskDialog(false);
          }} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              border: 'none'
            }
          }}
          BackdropProps={{
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(4px)'
            }
          }}
        >
          <DialogTitle sx={{ p: 0, textAlign: 'center', pt: 4, pb: 2, position: 'relative' }}>
            <IconButton
              onClick={() => {
                setTaskForm({
                  clientCode: '', opportunityId: '', title: '', description: '', dueDate: null,
                  priority: 'Medium', status: 'Pending', assignedTo: '', reminderDate: null
                });
                setOpenTaskDialog(false);
              }}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#1976d2',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.1)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center',
                lineHeight: 1.2
              }}
            >
                  Add New Task
                </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                textAlign: 'center',
                mt: 1
              }}
            >
                  Create a new follow-up task or reminder
                </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 4, py: 2, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
            {/* Task Information Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.primary.main }}>
                <Task sx={{ fontSize: 20 }} />
                Task Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    key={`task-client-${taskForm.clientCode}-${openTaskDialog}`}
                    options={allClientsAndProspects}
                    getOptionLabel={(option) => option.clientCode}
                    value={findClientByCode(taskForm.clientCode)}
                    onChange={(e, newValue) => setTaskForm({ ...taskForm, clientCode: newValue?.clientCode || '' })}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Client *" 
                        required
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <People sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                              {params.InputProps.startAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Due Date *"
                    value={taskForm.dueDate}
                    onChange={(date) => setTaskForm({ ...taskForm, dueDate: date })}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true,
                        required: true,
                        InputProps: {
                          startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                        }
                      } 
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="Title *" 
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    required
                    InputProps={{
                      startAdornment: <Title sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="Description" 
                    multiline 
                    rows={3} 
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Add task details..."
                    InputProps={{
                      startAdornment: <Description sx={{ mr: 1, color: 'text.secondary', fontSize: 20, alignSelf: 'flex-start', mt: 1.5 }} />
                    }}
                    sx={{
                      '& .MuiInputBase-root': {
                        alignItems: 'flex-start'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Assignment & Priority Section */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.primary.main }}>
                <PersonIcon sx={{ fontSize: 20 }} />
                Assignment & Priority
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select 
                      value={taskForm.priority} 
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} 
                      label="Priority"
                    >
                      <MenuItem value="High">High</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="Low">Low</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    label="Assigned To" 
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    placeholder="Type or select person"
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
            <Button 
              onClick={() => {
                setTaskForm({
                  clientCode: '', opportunityId: '', title: '', description: '', dueDate: null,
                  priority: 'Medium', status: 'Pending', assignedTo: '', reminderDate: null
                });
                setOpenTaskDialog(false);
              }} 
              variant="outlined"
              startIcon={<CloseIcon />}
              size="large"
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCreateTask}
              startIcon={<Folder />}
              size="large"
              sx={{ 
                bgcolor: '#4caf50',
                '&:hover': { bgcolor: '#2e7d32' }
              }}
            >
              Create Task
            </Button>
          </DialogActions>
        </Dialog>

        {/* Interaction Dialog */}
        <Dialog 
          open={openInteractionDialog} 
          onClose={() => {
            setInteractionForm({
              clientCode: '', opportunityId: '', type: 'Email', direction: 'Outbound', subject: '',
              content: '', to: '', dateTime: new Date(), duration: 0, status: 'Sent'
            });
            setOpenInteractionDialog(false);
          }} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              border: 'none'
            }
          }}
          BackdropProps={{
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(4px)'
            }
          }}
        >
          <DialogTitle sx={{ p: 0, textAlign: 'center', pt: 4, pb: 2, position: 'relative' }}>
            <IconButton
              onClick={() => {
                setInteractionForm({
                  clientCode: '', opportunityId: '', type: 'Email', direction: 'Outbound', subject: '',
                  content: '', to: '', dateTime: new Date(), duration: 0, status: 'Sent'
                });
                setOpenInteractionDialog(false);
              }}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#1976d2',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.1)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center',
                lineHeight: 1.2
              }}
            >
                  Log Interaction
                </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                textAlign: 'center',
                mt: 1
              }}
            >
                  Record communication history (email, call, WhatsApp, etc.)
                </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 4, py: 2, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
            {/* Communication Details Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.primary.main }}>
                <Phone sx={{ fontSize: 20 }} />
                Communication Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    key={`interaction-client-${interactionForm.clientCode}-${openInteractionDialog}`}
                    options={allClientsAndProspects}
                    getOptionLabel={(option) => option.clientCode}
                    value={findClientByCode(interactionForm.clientCode)}
                    onChange={(e, newValue) => setInteractionForm({ ...interactionForm, clientCode: newValue?.clientCode || '' })}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Client *" 
                        required
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <People sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                              {params.InputProps.startAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Type *</InputLabel>
                    <Select 
                      value={interactionForm.type} 
                      onChange={(e) => setInteractionForm({ ...interactionForm, type: e.target.value })} 
                      label="Type *"
                    >
                      <MenuItem value="Email">Email</MenuItem>
                      <MenuItem value="Call">Call</MenuItem>
                      <MenuItem value="Meeting">Meeting</MenuItem>
                      <MenuItem value="WhatsApp">WhatsApp</MenuItem>
                      <MenuItem value="SMS">SMS</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Direction *</InputLabel>
                    <Select 
                      value={interactionForm.direction} 
                      onChange={(e) => setInteractionForm({ ...interactionForm, direction: e.target.value })} 
                      label="Direction *"
                    >
                      <MenuItem value="Inbound">Inbound</MenuItem>
                      <MenuItem value="Outbound">Outbound</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DateTimePicker
                    label="Date/Time *"
                    value={interactionForm.dateTime}
                    onChange={(date) => setInteractionForm({ ...interactionForm, dateTime: date })}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true,
                        required: true,
                        InputProps: {
                          startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                        }
                      } 
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="Subject" 
                    value={interactionForm.subject}
                    onChange={(e) => setInteractionForm({ ...interactionForm, subject: e.target.value })}
                    placeholder="Interaction subject or topic"
                    InputProps={{
                      startAdornment: <Title sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="To" 
                    value={interactionForm.to}
                    onChange={(e) => setInteractionForm({ ...interactionForm, to: e.target.value })}
                    placeholder="Recipient email or phone number"
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="Content" 
                    multiline 
                    rows={4} 
                    value={interactionForm.content}
                    onChange={(e) => setInteractionForm({ ...interactionForm, content: e.target.value })}
                    placeholder="Message content or call summary..."
                    InputProps={{
                      startAdornment: <Description sx={{ mr: 1, color: 'text.secondary', fontSize: 20, alignSelf: 'flex-start', mt: 1.5 }} />
                    }}
                    sx={{
                      '& .MuiInputBase-root': {
                        alignItems: 'flex-start'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
            <Button 
              onClick={() => {
                setInteractionForm({
                  clientCode: '', opportunityId: '', type: 'Email', direction: 'Outbound', subject: '',
                  content: '', to: '', dateTime: new Date(), duration: 0, status: 'Sent'
                });
                setOpenInteractionDialog(false);
              }} 
              variant="outlined"
              startIcon={<CloseIcon />}
              size="large"
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCreateInteraction}
              startIcon={<Folder />}
              size="large"
              sx={{ 
                bgcolor: '#4caf50',
                '&:hover': { bgcolor: '#2e7d32' }
              }}
            >
              Log Interaction
            </Button>
          </DialogActions>
        </Dialog>

        {/* Note Dialog */}
        <Dialog 
          open={openNoteDialog} 
          onClose={() => {
            setNoteForm({
              clientCode: '', opportunityId: '', title: '', content: '', category: 'General', tags: []
            });
            setOpenNoteDialog(false);
          }} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              border: 'none'
            }
          }}
          BackdropProps={{
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(4px)'
            }
          }}
        >
          <DialogTitle sx={{ p: 0, textAlign: 'center', pt: 4, pb: 2, position: 'relative' }}>
            <IconButton
              onClick={() => {
                setNoteForm({
                  clientCode: '', opportunityId: '', title: '', content: '', category: 'General', tags: []
                });
                setOpenNoteDialog(false);
              }}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#1976d2',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.1)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center',
                lineHeight: 1.2
              }}
            >
                  Add New Note
                </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                textAlign: 'center',
                mt: 1
              }}
            >
                  Create a quick note for client or opportunity
                </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 4, py: 2, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
            {/* Note Information Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.primary.main }}>
                <Note sx={{ fontSize: 20 }} />
                Note Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    key={`note-client-${noteForm.clientCode}-${openNoteDialog}`}
                    options={allClientsAndProspects}
                    getOptionLabel={(option) => option.clientCode}
                    value={findClientByCode(noteForm.clientCode)}
                    onChange={(e, newValue) => setNoteForm({ ...noteForm, clientCode: newValue?.clientCode || '' })}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Client *" 
                        required
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <People sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                              {params.InputProps.startAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select 
                      value={noteForm.category} 
                      onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })} 
                      label="Category"
                    >
                      <MenuItem value="General">General</MenuItem>
                      <MenuItem value="Meeting">Meeting</MenuItem>
                      <MenuItem value="Call">Call</MenuItem>
                      <MenuItem value="Follow-up">Follow-up</MenuItem>
                      <MenuItem value="Issue">Issue</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="Title *" 
                    value={noteForm.title}
                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                    required
                    InputProps={{
                      startAdornment: <Title sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="Content *" 
                    multiline 
                    rows={6} 
                    value={noteForm.content}
                    onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                    required
                    placeholder="Write your note here..."
                    InputProps={{
                      startAdornment: <Description sx={{ mr: 1, color: 'text.secondary', fontSize: 20, alignSelf: 'flex-start', mt: 1.5 }} />
                    }}
                    sx={{
                      '& .MuiInputBase-root': {
                        alignItems: 'flex-start'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
            <Button 
              onClick={() => {
                setNoteForm({
                  clientCode: '', opportunityId: '', title: '', content: '', category: 'General', tags: []
                });
                setOpenNoteDialog(false);
              }} 
              variant="outlined"
              startIcon={<CloseIcon />}
              size="large"
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCreateNote}
              startIcon={<Folder />}
              size="large"
              sx={{ 
                bgcolor: '#4caf50',
                '&:hover': { bgcolor: '#2e7d32' }
              }}
            >
              Create Note
            </Button>
          </DialogActions>
        </Dialog>

        {/* Note Details Dialog */}
        <Dialog 
          open={openNoteDetailsDialog} 
          onClose={() => {
            setSelectedNote(null);
            setOpenNoteDetailsDialog(false);
          }} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              border: 'none'
            }
          }}
          BackdropProps={{
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(4px)'
            }
          }}
        >
          <DialogTitle sx={{ p: 0, textAlign: 'center', pt: 4, pb: 2, position: 'relative' }}>
            <IconButton
              onClick={() => {
                setSelectedNote(null);
                setOpenNoteDetailsDialog(false);
              }}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#1976d2',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.1)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center',
                lineHeight: 1.2
              }}
            >
              Note Details
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                textAlign: 'center',
                mt: 1
              }}
            >
              View note information
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 4, py: 2, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
            {selectedNote && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Note Header */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: theme.palette.primary.main }}>
                        {selectedNote.title}
                      </Typography>
                      <Chip 
                        label={selectedNote.category || 'General'} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Note Content */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, color: '#1976d2' }}>
                    <Note sx={{ fontSize: 20 }} />
                    Content
                  </Typography>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      backgroundColor: 'grey.50',
                      border: '1px solid',
                      borderColor: 'grey.200',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
                      {selectedNote.content || 'No content'}
                    </Typography>
                  </Paper>
                </Box>

                {/* Note Metadata */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, color: '#1976d2' }}>
                    <Business sx={{ fontSize: 20 }} />
                    Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Client Code
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedNote.clientCode || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    {selectedNote.opportunityId && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Opportunity ID
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {selectedNote.opportunityId}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Created At
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedNote.createdAt ? new Date(selectedNote.createdAt).toLocaleString() : 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    {selectedNote.updatedAt && selectedNote.updatedAt !== selectedNote.createdAt && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Last Updated
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {new Date(selectedNote.updatedAt).toLocaleString()}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>

                {/* Tags if available */}
                {selectedNote.tags && selectedNote.tags.length > 0 && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, color: '#1976d2' }}>
                      <Category sx={{ fontSize: 20 }} />
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedNote.tags.map((tag, index) => (
                        <Chip 
                          key={index}
                          label={tag} 
                          size="small" 
                          variant="outlined"
                          color="primary"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
            <Button 
              onClick={() => {
                setSelectedNote(null);
                setOpenNoteDetailsDialog(false);
              }} 
              variant="contained"
              startIcon={<CloseIcon />}
              size="large"
              sx={{ 
                bgcolor: '#1976d2',
                '&:hover': { bgcolor: '#1565c0' }
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Order Dialog */}
        <Dialog 
          open={openOrderDialog} 
          onClose={() => {
            setOrderForm({
              clientCode: '', date: new Date(), amount: '', currency: 'INR', status: 'Pending', products: [], notes: ''
            });
            setOpenOrderDialog(false);
          }} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              border: 'none'
            }
          }}
          BackdropProps={{
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(4px)'
            }
          }}
        >
          <DialogTitle sx={{ p: 0, textAlign: 'center', pt: 4, pb: 2, position: 'relative' }}>
            <IconButton
              onClick={() => {
                setOrderForm({
                  clientCode: '', date: new Date(), amount: '', currency: 'INR', status: 'Pending', products: [], notes: ''
                });
                setOpenOrderDialog(false);
              }}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#1976d2',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.1)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center',
                lineHeight: 1.2
              }}
            >
              Add New Order
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                textAlign: 'center',
                mt: 1
              }}
            >
              Create new order entry
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 4, py: 2, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.primary.main }}>
                <ShoppingCart sx={{ fontSize: 20 }} />
                Order Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    key={`order-client-${orderForm.clientCode}-${openOrderDialog}`}
                    options={allClientsAndProspects}
                    getOptionLabel={(option) => option.clientCode}
                    value={findClientByCode(orderForm.clientCode)}
                    onChange={(e, newValue) => setOrderForm({ ...orderForm, clientCode: newValue?.clientCode || '' })}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Client *" 
                        required
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <People sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                              {params.InputProps.startAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Order Date *"
                    value={orderForm.date}
                    onChange={(date) => setOrderForm({ ...orderForm, date: date })}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true,
                        required: true,
                        InputProps: {
                          startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                        }
                      } 
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    label="Amount *" 
                    type="number" 
                    value={orderForm.amount}
                    onChange={(e) => setOrderForm({ ...orderForm, amount: e.target.value })}
                    required
                    InputProps={{
                      startAdornment: <AttachMoney sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select 
                      value={orderForm.currency} 
                      onChange={(e) => setOrderForm({ ...orderForm, currency: e.target.value })} 
                      label="Currency"
                    >
                      <MenuItem value="INR">INR</MenuItem>
                      <MenuItem value="USD">USD</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select 
                      value={orderForm.status} 
                      onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })} 
                      label="Status"
                    >
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Processing">Processing</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                      <MenuItem value="Cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="Notes" 
                    multiline 
                    rows={3} 
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                    InputProps={{
                      startAdornment: <Note sx={{ mr: 1, color: 'text.secondary', fontSize: 20, alignSelf: 'flex-start', mt: 1.5 }} />
                    }}
                    sx={{
                      '& .MuiInputBase-root': {
                        alignItems: 'flex-start'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
            <Button 
              onClick={() => {
                setOrderForm({
                  clientCode: '', date: new Date(), amount: '', currency: 'INR', status: 'Pending', products: [], notes: ''
                });
                setOpenOrderDialog(false);
              }} 
              variant="outlined"
              startIcon={<CloseIcon />}
              size="large"
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCreateOrder}
              startIcon={<Folder />}
              size="large"
              sx={{ 
                bgcolor: '#4caf50',
                '&:hover': { bgcolor: '#2e7d32' }
              }}
            >
              Create Order
            </Button>
          </DialogActions>
        </Dialog>

        {/* Call Log Dialog */}
        <Dialog 
          open={openCallLogDialog} 
          onClose={() => {
            setCallLogForm({
              clientCode: '', dateTime: new Date(), direction: 'Outbound', duration: 0, phoneNumber: '',
              status: 'Completed', notes: '', outcome: '', nextAction: ''
            });
            setOpenCallLogDialog(false);
          }} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              border: 'none'
            }
          }}
          BackdropProps={{
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(4px)'
            }
          }}
        >
          <DialogTitle sx={{ p: 0, textAlign: 'center', pt: 4, pb: 2, position: 'relative' }}>
            <IconButton
              onClick={() => {
                setCallLogForm({
                  clientCode: '', dateTime: new Date(), direction: 'Outbound', duration: 0, phoneNumber: '',
                  status: 'Completed', notes: '', outcome: '', nextAction: ''
                });
                setOpenCallLogDialog(false);
              }}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#1976d2',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.1)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center',
                lineHeight: 1.2
              }}
            >
              Log Call
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                textAlign: 'center',
                mt: 1
              }}
            >
              Record call details and outcomes
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 4, py: 2, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.primary.main }}>
                <PhoneInTalk sx={{ fontSize: 20 }} />
                Call Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    key={`calllog-client-${callLogForm.clientCode}-${openCallLogDialog}`}
                    options={allClientsAndProspects}
                    getOptionLabel={(option) => option.clientCode}
                    value={findClientByCode(callLogForm.clientCode)}
                    onChange={(e, newValue) => setCallLogForm({ ...callLogForm, clientCode: newValue?.clientCode || '' })}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Client *" 
                        required
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <People sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                              {params.InputProps.startAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DateTimePicker
                    label="Date & Time *"
                    value={callLogForm.dateTime}
                    onChange={(date) => setCallLogForm({ ...callLogForm, dateTime: date })}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true,
                        required: true,
                        InputProps: {
                          startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                        }
                      } 
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Direction *</InputLabel>
                    <Select 
                      value={callLogForm.direction} 
                      onChange={(e) => setCallLogForm({ ...callLogForm, direction: e.target.value })} 
                      label="Direction *"
                    >
                      <MenuItem value="Inbound">Inbound</MenuItem>
                      <MenuItem value="Outbound">Outbound</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    label="Phone Number" 
                    value={callLogForm.phoneNumber}
                    onChange={(e) => setCallLogForm({ ...callLogForm, phoneNumber: e.target.value })}
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    label="Duration (minutes)" 
                    type="number" 
                    value={callLogForm.duration}
                    onChange={(e) => setCallLogForm({ ...callLogForm, duration: parseInt(e.target.value) || 0 })} 
                    InputProps={{
                      startAdornment: <AccessTime sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select 
                      value={callLogForm.status} 
                      onChange={(e) => setCallLogForm({ ...callLogForm, status: e.target.value })} 
                      label="Status"
                    >
                      <MenuItem value="Completed">Completed</MenuItem>
                      <MenuItem value="Missed">Missed</MenuItem>
                      <MenuItem value="No Answer">No Answer</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="Notes" 
                    multiline 
                    rows={3} 
                    value={callLogForm.notes}
                    onChange={(e) => setCallLogForm({ ...callLogForm, notes: e.target.value })}
                    InputProps={{
                      startAdornment: <Note sx={{ mr: 1, color: 'text.secondary', fontSize: 20, alignSelf: 'flex-start', mt: 1.5 }} />
                    }}
                    sx={{
                      '& .MuiInputBase-root': {
                        alignItems: 'flex-start'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    label="Outcome" 
                    value={callLogForm.outcome}
                    onChange={(e) => setCallLogForm({ ...callLogForm, outcome: e.target.value })}
                    placeholder="Call outcome or result"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    label="Next Action" 
                    value={callLogForm.nextAction}
                    onChange={(e) => setCallLogForm({ ...callLogForm, nextAction: e.target.value })}
                    placeholder="Follow-up action required"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
            <Button 
              onClick={() => {
                setCallLogForm({
                  clientCode: '', dateTime: new Date(), direction: 'Outbound', duration: 0, phoneNumber: '',
                  status: 'Completed', notes: '', outcome: '', nextAction: ''
                });
                setOpenCallLogDialog(false);
              }} 
              variant="outlined"
              startIcon={<CloseIcon />}
              size="large"
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCreateCallLog}
              startIcon={<Folder />}
              size="large"
              sx={{ 
                bgcolor: '#4caf50',
                '&:hover': { bgcolor: '#2e7d32' }
              }}
            >
              Log Call
            </Button>
          </DialogActions>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog 
          open={openPaymentDialog} 
          onClose={() => {
            setPaymentForm({
              clientCode: '', opportunityId: '', date: new Date(), amount: '', currency: 'INR',
              method: '', status: 'Pending', reference: '', notes: ''
            });
            setOpenPaymentDialog(false);
          }} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              border: 'none'
            }
          }}
          BackdropProps={{
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(4px)'
            }
          }}
        >
          <DialogTitle sx={{ p: 0, textAlign: 'center', pt: 4, pb: 2, position: 'relative' }}>
            <IconButton
              onClick={() => {
                setPaymentForm({
                  clientCode: '', opportunityId: '', date: new Date(), amount: '', currency: 'INR',
                  method: '', status: 'Pending', reference: '', notes: ''
                });
                setOpenPaymentDialog(false);
              }}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#1976d2',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.1)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center',
                lineHeight: 1.2
              }}
            >
              Record Payment
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                textAlign: 'center',
                mt: 1
              }}
            >
              Record payment details and transaction information
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 4, py: 2, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.primary.main }}>
                <Payment sx={{ fontSize: 20 }} />
                Payment Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    key={`payment-client-${paymentForm.clientCode}-${openPaymentDialog}`}
                    options={allClientsAndProspects}
                    getOptionLabel={(option) => option.clientCode}
                    value={findClientByCode(paymentForm.clientCode)}
                    onChange={(e, newValue) => setPaymentForm({ ...paymentForm, clientCode: newValue?.clientCode || '' })}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Client *" 
                        required
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <People sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                              {params.InputProps.startAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Payment Date *"
                    value={paymentForm.date}
                    onChange={(date) => setPaymentForm({ ...paymentForm, date: date })}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true,
                        required: true,
                        InputProps: {
                          startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                        }
                      } 
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    label="Amount *" 
                    type="number" 
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    required
                    InputProps={{
                      startAdornment: <AttachMoney sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select 
                      value={paymentForm.currency} 
                      onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })} 
                      label="Currency"
                    >
                      <MenuItem value="INR">INR</MenuItem>
                      <MenuItem value="USD">USD</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    label="Payment Method *" 
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    required
                    placeholder="Cash, Bank Transfer, Cheque, etc."
                    InputProps={{
                      startAdornment: <Payment sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select 
                      value={paymentForm.status} 
                      onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })} 
                      label="Status"
                    >
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                      <MenuItem value="Failed">Failed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    label="Reference Number" 
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    placeholder="Transaction ID, Cheque Number, etc."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="Notes" 
                    multiline 
                    rows={3} 
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    InputProps={{
                      startAdornment: <Note sx={{ mr: 1, color: 'text.secondary', fontSize: 20, alignSelf: 'flex-start', mt: 1.5 }} />
                    }}
                    sx={{
                      '& .MuiInputBase-root': {
                        alignItems: 'flex-start'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
            <Button 
              onClick={() => {
                setPaymentForm({
                  clientCode: '', opportunityId: '', date: new Date(), amount: '', currency: 'INR',
                  method: '', status: 'Pending', reference: '', notes: ''
                });
                setOpenPaymentDialog(false);
              }} 
              variant="outlined"
              startIcon={<CloseIcon />}
              size="large"
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCreatePayment}
              startIcon={<Folder />}
              size="large"
              sx={{ 
                bgcolor: '#4caf50',
                '&:hover': { bgcolor: '#2e7d32' }
              }}
            >
              Record Payment
            </Button>
          </DialogActions>
        </Dialog>

        {/* Action Menu */}
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={handleCloseActionMenu}
          PaperProps={{
            sx: {
              minWidth: 220,
              mt: 1
            }
          }}
        >
          <MenuItem onClick={() => handleActionSelect(4, selectedClientForAction)}>
            <ListItemIcon>
              <TrendingUp fontSize="small" />
            </ListItemIcon>
            <ListItemText>Opportunities</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleActionSelect(5, selectedClientForAction)}>
            <ListItemIcon>
              <ShoppingCart fontSize="small" />
            </ListItemIcon>
            <ListItemText>Order Taking</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleActionSelect(6, selectedClientForAction)}>
            <ListItemIcon>
              <Task fontSize="small" />
            </ListItemIcon>
            <ListItemText>Tasks</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleActionSelect(7, selectedClientForAction)}>
            <ListItemIcon>
              <Event fontSize="small" />
            </ListItemIcon>
            <ListItemText>Activities</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleActionSelect(8, selectedClientForAction)}>
            <ListItemIcon>
              <Phone fontSize="small" />
            </ListItemIcon>
            <ListItemText>Interactions</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleActionSelect(9, selectedClientForAction)}>
            <ListItemIcon>
              <PhoneInTalk fontSize="small" />
            </ListItemIcon>
            <ListItemText>Call Logs</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleActionSelect(10, selectedClientForAction)}>
            <ListItemIcon>
              <Payment fontSize="small" />
            </ListItemIcon>
            <ListItemText>Payments</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleActionSelect(11, selectedClientForAction)}>
            <ListItemIcon>
              <Note fontSize="small" />
            </ListItemIcon>
            <ListItemText>Notes</ListItemText>
          </MenuItem>
        </Menu>

        {/* Client Dashboard Modal */}
        <ClientDashboardModal
          open={openClientDashboard}
          onClose={() => {
            setOpenClientDashboard(false);
            setSelectedClientForDashboard(null);
          }}
          client={selectedClientForDashboard}
        />

        {/* Prospect Dashboard Modal */}
        <ClientDashboardModal
          open={openProspectDashboard}
          onClose={() => {
            setOpenProspectDashboard(false);
            setSelectedProspectForDashboard(null);
          }}
          client={selectedProspectForDashboard}
        />

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default CRMManagement;

