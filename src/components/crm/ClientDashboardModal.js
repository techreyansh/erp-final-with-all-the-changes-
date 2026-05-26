import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Pagination,
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Payment as PaymentIcon,
  Call as CallIcon,
  Note as NoteIcon,
  Task as TaskIcon,
  Timeline as TimelineIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import crmService from '../../services/crmService';
import { getAllClients as getAllProspectsClients } from '../../services/prospectsClientService';
import { getAllClients } from '../../services/clientService';
import clientDashboardService from '../../services/clientDashboardService';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`client-dashboard-tabpanel-${index}`}
      aria-labelledby={`client-dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const ITEMS_PER_PAGE = 10;

const ClientDashboardModal = ({ open, onClose, client }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [clientData, setClientData] = useState(null);
  const [crmData, setCrmData] = useState({
    opportunities: [],
    activities: [],
    tasks: [],
    notes: [],
    payments: [],
    callLogs: [],
  });
  const [prospects, setProspects] = useState([]);
  
  // Pagination states
  const [oppPage, setOppPage] = useState(1);
  const [actPage, setActPage] = useState(1);
  const [taskPage, setTaskPage] = useState(1);
  const [prospectPage, setProspectPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [callLogPage, setCallLogPage] = useState(1);
  const [notePage, setNotePage] = useState(1);

  useEffect(() => {
    if (open && client) {
      loadClientData();
      // Reset pagination when tab changes
      setOppPage(1);
      setActPage(1);
      setTaskPage(1);
      setProspectPage(1);
      setPaymentPage(1);
      setCallLogPage(1);
      setNotePage(1);
    }
  }, [open, client]);

  const loadClientData = async () => {
    if (!client?.clientCode) return;

    setLoading(true);
    try {
      // Load client details
      const allClients = await getAllClients();
      const foundClient = allClients.find(c => c.clientCode === client.clientCode);
      setClientData(foundClient || client);

      // Load CRM data
      const [opps, acts, tasks, notes, payments, callLogs] = await Promise.all([
        crmService.getAllOpportunities(),
        crmService.getAllActivities(),
        crmService.getAllTasks(),
        crmService.getAllNotes(),
        crmService.getAllPayments(),
        crmService.getAllCallLogs(),
      ]);

      const clientCode = client.clientCode.toUpperCase();
      setCrmData({
        opportunities: opps.filter(o => o.clientCode?.toUpperCase() === clientCode),
        activities: acts.filter(a => a.clientCode?.toUpperCase() === clientCode),
        tasks: tasks.filter(t => t.clientCode?.toUpperCase() === clientCode),
        notes: notes.filter(n => n.clientCode?.toUpperCase() === clientCode),
        payments: payments.filter(p => p.clientCode?.toUpperCase() === clientCode),
        callLogs: callLogs.filter(c => c.clientCode?.toUpperCase() === clientCode),
      });

      // Load prospects
      const [prospectsClients, regularClients] = await Promise.all([
        getAllProspectsClients().catch(() => []),
        getAllClients().catch(() => []),
      ]);
      
      const relatedProspects = [
        ...prospectsClients.filter(p => 
          p.clientCode?.toUpperCase() === clientCode ||
          p.clientName?.toLowerCase().includes(client.clientName?.toLowerCase() || '') ||
          p.businessType === foundClient?.businessType
        ),
        ...regularClients.filter(c => 
          c.clientCode?.toUpperCase() === clientCode ||
          (c.clientName?.toLowerCase().includes(client.clientName?.toLowerCase() || '') && c !== foundClient)
        ),
      ];
      setProspects(relatedProspects);
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getStatusColor = (status) => {
    const statusLower = String(status || '').toLowerCase();
    if (statusLower.includes('active') || statusLower.includes('completed') || statusLower.includes('won')) {
      return 'success';
    }
    if (statusLower.includes('pending') || statusLower.includes('in progress')) {
      return 'warning';
    }
    if (statusLower.includes('cancelled') || statusLower.includes('lost') || statusLower.includes('rejected')) {
      return 'error';
    }
    return 'default';
  };

  // Pagination helpers
  const getPaginatedData = (data, page) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data) => Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));

  const totalOpportunityValue = crmData.opportunities
    .filter(o => o.status === 'Active')
    .reduce((sum, o) => sum + (o.value || 0), 0);

  const activeTasksCount = crmData.tasks.filter(t => t.status === 'Active' || t.status === 'Pending').length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.15)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                width: 48,
                height: 48,
              }}
            >
              <BusinessIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                {clientData?.clientName || client?.clientName || 'Client Dashboard'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {clientData?.clientCode || client?.clientCode}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300, p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Summary Cards */}
            <Box sx={{ p: 2, background: alpha(theme.palette.background.default, 0.5) }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                        {crmData.opportunities.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Opportunities
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: theme.palette.success.main, fontWeight: 600, mt: 0.5 }}>
                        ₹{totalOpportunityValue.toLocaleString('en-IN')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.success.main, 0.1)}` }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                        {activeTasksCount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Active Tasks
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}` }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                        {crmData.payments.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Payments
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.info.main, 0.1)}` }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                        {prospects.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Prospects
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                <Tab label={`Opportunities (${crmData.opportunities.length})`} />
                <Tab label={`Activities (${crmData.activities.length})`} />
                <Tab label={`Tasks (${crmData.tasks.length})`} />
                <Tab label={`Prospects (${prospects.length})`} />
                <Tab label={`Payments (${crmData.payments.length})`} />
                <Tab label={`Call Logs (${crmData.callLogs.length})`} />
                <Tab label={`Notes (${crmData.notes.length})`} />
              </Tabs>
            </Box>

            {/* Tab Panels */}
            <Box sx={{ px: 2, py: 2, maxHeight: '45vh', overflow: 'auto' }}>
              {/* Opportunities */}
              <TabPanel value={activeTab} index={0}>
                {crmData.opportunities.length === 0 ? (
                  <Alert severity="info">No opportunities found.</Alert>
                ) : (
                  <>
                    <List sx={{ p: 0 }}>
                      {getPaginatedData(crmData.opportunities, oppPage).map((opp, idx) => (
                        <React.Fragment key={opp.opportunityId}>
                          <ListItem
                            sx={{
                              px: 2,
                              py: 1.5,
                              borderRadius: 1,
                              mb: 1,
                              bgcolor: alpha(theme.palette.primary.main, 0.02),
                              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), width: 40, height: 40 }}>
                                <TrendingUpIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {opp.title}
                                  </Typography>
                                  <Chip label={opp.stage} size="small" color={getStatusColor(opp.stage)} />
                                </Box>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {opp.opportunityId}
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                                    ₹{opp.value?.toLocaleString('en-IN') || 0}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          {idx < getPaginatedData(crmData.opportunities, oppPage).length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                    {getTotalPages(crmData.opportunities) > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination
                          count={getTotalPages(crmData.opportunities)}
                          page={oppPage}
                          onChange={(e, page) => setOppPage(page)}
                          size="small"
                          color="primary"
                        />
                      </Box>
                    )}
                  </>
                )}
              </TabPanel>

              {/* Activities */}
              <TabPanel value={activeTab} index={1}>
                {crmData.activities.length === 0 ? (
                  <Alert severity="info">No activities found.</Alert>
                ) : (
                  <>
                    <List sx={{ p: 0 }}>
                      {getPaginatedData(crmData.activities, actPage).map((act, idx) => (
                        <React.Fragment key={act.activityId}>
                          <ListItem
                            sx={{
                              px: 2,
                              py: 1.5,
                              borderRadius: 1,
                              mb: 1,
                              bgcolor: alpha(theme.palette.info.main, 0.02),
                              '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.05) },
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), width: 40, height: 40 }}>
                                <TimelineIcon sx={{ fontSize: 20, color: theme.palette.info.main }} />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {act.type}
                                  </Typography>
                                  <Chip label={act.status} size="small" color={getStatusColor(act.status)} />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    {act.description || act.subject || 'No description'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {act.activityDate ? new Date(act.activityDate).toLocaleDateString() : 'N/A'}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          {idx < getPaginatedData(crmData.activities, actPage).length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                    {getTotalPages(crmData.activities) > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination
                          count={getTotalPages(crmData.activities)}
                          page={actPage}
                          onChange={(e, page) => setActPage(page)}
                          size="small"
                          color="primary"
                        />
                      </Box>
                    )}
                  </>
                )}
              </TabPanel>

              {/* Tasks */}
              <TabPanel value={activeTab} index={2}>
                {crmData.tasks.length === 0 ? (
                  <Alert severity="info">No tasks found.</Alert>
                ) : (
                  <>
                    <List sx={{ p: 0 }}>
                      {getPaginatedData(crmData.tasks, taskPage).map((task, idx) => (
                        <React.Fragment key={task.taskId}>
                          <ListItem
                            sx={{
                              px: 2,
                              py: 1.5,
                              borderRadius: 1,
                              mb: 1,
                              bgcolor: alpha(theme.palette.warning.main, 0.02),
                              '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.05) },
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), width: 40, height: 40 }}>
                                <TaskIcon sx={{ fontSize: 20, color: theme.palette.warning.main }} />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {task.title}
                                  </Typography>
                                  <Chip label={task.status} size="small" color={getStatusColor(task.status)} />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    {task.description || 'No description'}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                                    </Typography>
                                    {task.assignedTo && (
                                      <Typography variant="caption" color="text.secondary">
                                        Assigned: {task.assignedTo}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              }
                            />
                          </ListItem>
                          {idx < getPaginatedData(crmData.tasks, taskPage).length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                    {getTotalPages(crmData.tasks) > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination
                          count={getTotalPages(crmData.tasks)}
                          page={taskPage}
                          onChange={(e, page) => setTaskPage(page)}
                          size="small"
                          color="primary"
                        />
                      </Box>
                    )}
                  </>
                )}
              </TabPanel>

              {/* Prospects */}
              <TabPanel value={activeTab} index={3}>
                {prospects.length === 0 ? (
                  <Alert severity="info">No prospects found.</Alert>
                ) : (
                  <>
                    <List sx={{ p: 0 }}>
                      {getPaginatedData(prospects, prospectPage).map((prospect, idx) => (
                        <React.Fragment key={prospect.clientCode}>
                          <ListItem
                            sx={{
                              px: 2,
                              py: 1.5,
                              borderRadius: 1,
                              mb: 1,
                              bgcolor: alpha(theme.palette.info.main, 0.02),
                              '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.05) },
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), width: 40, height: 40 }}>
                                <PeopleIcon sx={{ fontSize: 20, color: theme.palette.info.main }} />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {prospect.clientName || prospect.clientCode}
                                  </Typography>
                                  <Chip
                                    label={prospect.status || 'Active'}
                                    size="small"
                                    color={prospect.status === 'Active' ? 'success' : 'default'}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    {prospect.clientCode} • {prospect.businessType || 'N/A'}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      {prospect.city || 'N/A'}, {prospect.state || 'N/A'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.25 }}>
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <StarIcon
                                          key={star}
                                          sx={{
                                            fontSize: 12,
                                            color: star <= (prospect.rating || 0) ? 'gold' : 'grey.300',
                                          }}
                                        />
                                      ))}
                                    </Box>
                                  </Box>
                                </Box>
                              }
                            />
                          </ListItem>
                          {idx < getPaginatedData(prospects, prospectPage).length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                    {getTotalPages(prospects) > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination
                          count={getTotalPages(prospects)}
                          page={prospectPage}
                          onChange={(e, page) => setProspectPage(page)}
                          size="small"
                          color="primary"
                        />
                      </Box>
                    )}
                  </>
                )}
              </TabPanel>

              {/* Payments */}
              <TabPanel value={activeTab} index={4}>
                {crmData.payments.length === 0 ? (
                  <Alert severity="info">No payments found.</Alert>
                ) : (
                  <>
                    <List sx={{ p: 0 }}>
                      {getPaginatedData(crmData.payments, paymentPage).map((payment, idx) => (
                        <React.Fragment key={payment.paymentId}>
                          <ListItem
                            sx={{
                              px: 2,
                              py: 1.5,
                              borderRadius: 1,
                              mb: 1,
                              bgcolor: alpha(theme.palette.success.main, 0.02),
                              '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.05) },
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), width: 40, height: 40 }}>
                                <PaymentIcon sx={{ fontSize: 20, color: theme.palette.success.main }} />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {payment.paymentId}
                                  </Typography>
                                  <Chip label={payment.status} size="small" color={getStatusColor(payment.status)} />
                                </Box>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'} • {payment.method || 'N/A'}
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                                    ₹{payment.amount?.toLocaleString('en-IN') || 0}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          {idx < getPaginatedData(crmData.payments, paymentPage).length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                    {getTotalPages(crmData.payments) > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination
                          count={getTotalPages(crmData.payments)}
                          page={paymentPage}
                          onChange={(e, page) => setPaymentPage(page)}
                          size="small"
                          color="primary"
                        />
                      </Box>
                    )}
                  </>
                )}
              </TabPanel>

              {/* Call Logs */}
              <TabPanel value={activeTab} index={5}>
                {crmData.callLogs.length === 0 ? (
                  <Alert severity="info">No call logs found.</Alert>
                ) : (
                  <>
                    <List sx={{ p: 0 }}>
                      {getPaginatedData(crmData.callLogs, callLogPage).map((log, idx) => (
                        <React.Fragment key={log.callLogId}>
                          <ListItem
                            sx={{
                              px: 2,
                              py: 1.5,
                              borderRadius: 1,
                              mb: 1,
                              bgcolor: alpha(theme.palette.info.main, 0.02),
                              '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.05) },
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), width: 40, height: 40 }}>
                                <CallIcon sx={{ fontSize: 20, color: theme.palette.info.main }} />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {log.callType || 'Call'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {log.duration || 'N/A'}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    {log.notes || 'No notes'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {log.callDate ? new Date(log.callDate).toLocaleDateString() : 'N/A'}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          {idx < getPaginatedData(crmData.callLogs, callLogPage).length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                    {getTotalPages(crmData.callLogs) > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination
                          count={getTotalPages(crmData.callLogs)}
                          page={callLogPage}
                          onChange={(e, page) => setCallLogPage(page)}
                          size="small"
                          color="primary"
                        />
                      </Box>
                    )}
                  </>
                )}
              </TabPanel>

              {/* Notes */}
              <TabPanel value={activeTab} index={6}>
                {crmData.notes.length === 0 ? (
                  <Alert severity="info">No notes found.</Alert>
                ) : (
                  <>
                    <List sx={{ p: 0 }}>
                      {getPaginatedData(crmData.notes, notePage).map((note, idx) => (
                        <React.Fragment key={note.noteId}>
                          <ListItem
                            sx={{
                              px: 2,
                              py: 1.5,
                              borderRadius: 1,
                              mb: 1,
                              bgcolor: alpha(theme.palette.warning.main, 0.02),
                              '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.05) },
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), width: 40, height: 40 }}>
                                <NoteIcon sx={{ fontSize: 20, color: theme.palette.warning.main }} />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                  {note.title || 'Untitled Note'}
                                </Typography>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    {note.content || note.notes || 'No content'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {note.createdAt ? new Date(note.createdAt).toLocaleString() : 'N/A'}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          {idx < getPaginatedData(crmData.notes, notePage).length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                    {getTotalPages(crmData.notes) > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination
                          count={getTotalPages(crmData.notes)}
                          page={notePage}
                          onChange={(e, page) => setNotePage(page)}
                          size="small"
                          color="primary"
                        />
                      </Box>
                    )}
                  </>
                )}
              </TabPanel>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 1.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Button onClick={onClose} variant="contained" size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClientDashboardModal;
