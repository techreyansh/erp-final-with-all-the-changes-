import React, { useState, useEffect } from 'react';
import {
  Box,
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
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  Phone,
  Email,
  WhatsApp,
  Schedule,
  CheckCircle,
  Cancel,
  Snooze,
  TrendingUp,
  AttachMoney,
  Warning
} from '@mui/icons-material';
import paymentReminderService from '../../services/paymentReminderService';
import reminderTemplates from '../../services/reminderTemplatesService';
import { useAuth } from '../../context/AuthContext';

const CollectionsDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Call dialog state
  const [callOutcome, setCallOutcome] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [promiseDate, setPromiseDate] = useState('');
  
  // Send dialog state
  const [selectedChannel, setSelectedChannel] = useState('whatsapp');
  const [selectedTemplate, setSelectedTemplate] = useState('friendly');
  const [personalNote, setPersonalNote] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // Payment dialog state
  const [paymentData, setPaymentData] = useState({
    paymentMethod: '',
    chequeNo: '',
    chequeDate: '',
    bankName: '',
    branch: '',
    utr: '',
    amount: 0,
    receivedDate: new Date().toISOString().split('T')[0],
    status: 'received'
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await paymentReminderService.getCollectionsDashboard(30);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCallTask = (task) => {
    setSelectedTask(task);
    setCallDialogOpen(true);
  };

  const handleCallComplete = async () => {
    try {
      setLoading(true);
      await paymentReminderService.updateCallTask(selectedTask.id, {
        status: callOutcome === 'Payment Promise' ? 'open' : 'done',
        lastOutcome: callOutcome,
        lastContactAt: new Date().toISOString(),
        attempts: selectedTask.attempts + 1,
        notes: callNotes
      }, user?.email);

      // If payment promise, create follow-up
      if (callOutcome === 'Payment Promise' && promiseDate) {
        const followUpDate = new Date(promiseDate);
        followUpDate.setDate(followUpDate.getDate() - 1);
        
        await paymentReminderService.createCallTask({
          invoiceId: selectedTask.invoiceId,
          customerId: selectedTask.customerId,
          dueAt: followUpDate.toISOString(),
          priority: 'high'
        }, user?.email);
      }

      setCallDialogOpen(false);
      setCallOutcome('');
      setCallNotes('');
      setPromiseDate('');
      await loadDashboard();
    } catch (error) {
      console.error('Error completing call:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSnooze = async (taskId, hours) => {
    try {
      setLoading(true);
      await paymentReminderService.snoozeTask(taskId, hours, user?.email);
      await loadDashboard();
    } catch (error) {
      console.error('Error snoozing task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = (invoice) => {
    setSelectedInvoice(invoice);
    setSendDialogOpen(true);
  };

  const handleSendReminderSubmit = async () => {
    try {
      setLoading(true);
      const template = reminderTemplates.getTemplate(selectedTemplate, 'en', selectedChannel);
      const invoice = selectedInvoice;
      
      const message = reminderTemplates.replacePlaceholders(
        selectedChannel === 'email' ? template.body : template.body,
        {
          customerName: invoice.customerName,
          invoiceNo: invoice.invoiceNo,
          amount: invoice.amount,
          dueDate: invoice.dueDate,
          crmName: user?.name || 'CRM Team'
        }
      );

      // In a real implementation, you would send via email/WhatsApp API
      // For now, we'll just log it
      await paymentReminderService.scheduleCommunication({
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        channel: selectedChannel,
        templateType: selectedTemplate,
        sendAt: new Date().toISOString()
      }, user?.email);

      setSendDialogOpen(false);
      setSelectedInvoice(null);
      await loadDashboard();
    } catch (error) {
      console.error('Error sending reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      ...paymentData,
      amount: invoice.amount,
      invoiceId: invoice.id
    });
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async () => {
    try {
      setLoading(true);
      await paymentReminderService.createPayment({
        invoiceId: selectedInvoice.id,
        ...paymentData
      }, user?.email);
      
      setPaymentDialogOpen(false);
      setSelectedInvoice(null);
      await loadDashboard();
    } catch (error) {
      console.error('Error recording payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue': return 'error';
      case 'due': return 'warning';
      case 'paid': return 'success';
      default: return 'default';
    }
  };

  if (loading && !dashboardData) {
    return <Box p={3}><Typography>Loading...</Typography></Box>;
  }

  if (!dashboardData) {
    return <Box p={3}><Typography>No data available</Typography></Box>;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Collections Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Outstanding
              </Typography>
              <Typography variant="h4">
                {dashboardData.totalOutstanding}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Amount
              </Typography>
              <Typography variant="h4">
                ₹{dashboardData.totalAmount.toLocaleString('en-IN')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Overdue
              </Typography>
              <Typography variant="h4" color="error">
                {dashboardData.overdue.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Today's Calls
              </Typography>
              <Typography variant="h4">
                {dashboardData.todayTasks.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Today's Calls" />
          <Tab label="Overdue" />
          <Tab label="Due Soon (≤3 days)" />
          <Tab label="Due Later (4-30 days)" />
        </Tabs>
      </Box>

      {/* Today's Calls Tab */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Today's Call Tasks
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>Invoice</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Attempts</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.todayTasks.map((task) => {
                    const invoice = dashboardData.overdue
                      .concat(dashboardData.dueSoon)
                      .concat(dashboardData.dueLater)
                      .find(inv => inv.id === task.invoiceId);
                    
                    if (!invoice) return null;
                    
                    return (
                      <TableRow key={task.id}>
                        <TableCell>{task.customerName}</TableCell>
                        <TableCell>{invoice.invoiceNo}</TableCell>
                        <TableCell>₹{invoice.amount.toLocaleString('en-IN')}</TableCell>
                        <TableCell>{invoice.dueDate}</TableCell>
                        <TableCell>
                          <Chip
                            label={task.priority}
                            color={getPriorityColor(task.priority)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{task.attempts}</TableCell>
                        <TableCell>
                          <Tooltip title="Call">
                            <IconButton
                              size="small"
                              onClick={() => handleCallTask(task)}
                            >
                              <Phone />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Snooze 1 hour">
                            <IconButton
                              size="small"
                              onClick={() => handleSnooze(task.id, 1)}
                            >
                              <Snooze />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Send Reminder">
                            <IconButton
                              size="small"
                              onClick={() => handleSendReminder(invoice)}
                            >
                              <Email />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Overdue Tab */}
      {tabValue === 1 && (
        <InvoiceTable
          invoices={dashboardData.overdue}
          onSendReminder={handleSendReminder}
          onRecordPayment={handleRecordPayment}
          getStatusColor={getStatusColor}
        />
      )}

      {/* Due Soon Tab */}
      {tabValue === 2 && (
        <InvoiceTable
          invoices={dashboardData.dueSoon}
          onSendReminder={handleSendReminder}
          onRecordPayment={handleRecordPayment}
          getStatusColor={getStatusColor}
        />
      )}

      {/* Due Later Tab */}
      {tabValue === 3 && (
        <InvoiceTable
          invoices={dashboardData.dueLater}
          onSendReminder={handleSendReminder}
          onRecordPayment={handleRecordPayment}
          getStatusColor={getStatusColor}
        />
      )}

      {/* Call Dialog */}
      <Dialog open={callDialogOpen} onClose={() => setCallDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Call Outcome</DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Calling: {selectedTask.customerName}
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Outcome</InputLabel>
                <Select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                >
                  <MenuItem value="Connected">Connected</MenuItem>
                  <MenuItem value="Left message">Left message</MenuItem>
                  <MenuItem value="No answer">No answer</MenuItem>
                  <MenuItem value="Will send UTR">Will send UTR</MenuItem>
                  <MenuItem value="Payment Promise">Cheque promised (with date)</MenuItem>
                  <MenuItem value="Dispute">Dispute</MenuItem>
                </Select>
              </FormControl>
              {callOutcome === 'Payment Promise' && (
                <TextField
                  fullWidth
                  margin="normal"
                  type="date"
                  label="Promise Date"
                  value={promiseDate}
                  onChange={(e) => setPromiseDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              )}
              <TextField
                fullWidth
                margin="normal"
                multiline
                rows={3}
                label="Notes"
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCallDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCallComplete} variant="contained" disabled={!callOutcome}>
            Complete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Reminder Dialog */}
      <Dialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Reminder</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Channel</InputLabel>
            <Select value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)}>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="whatsapp">WhatsApp</MenuItem>
              <MenuItem value="sms">SMS</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Template</InputLabel>
            <Select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
              <MenuItem value="friendly">Friendly Reminder</MenuItem>
              <MenuItem value="early">Early Reminder (7 days before)</MenuItem>
              <MenuItem value="final">Final Reminder (1 day before)</MenuItem>
              <MenuItem value="overdue">Overdue Reminder</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            multiline
            rows={2}
            label="Personal Note (Optional)"
            value={personalNote}
            onChange={(e) => setPersonalNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSendReminderSubmit} variant="contained">
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
            >
              <MenuItem value="cheque">Cheque</MenuItem>
              <MenuItem value="rtgs">RTGS</MenuItem>
            </Select>
          </FormControl>
          {paymentData.paymentMethod === 'cheque' && (
            <>
              <TextField
                fullWidth
                margin="normal"
                label="Cheque Number"
                value={paymentData.chequeNo}
                onChange={(e) => setPaymentData({ ...paymentData, chequeNo: e.target.value })}
              />
              <TextField
                fullWidth
                margin="normal"
                type="date"
                label="Cheque Date"
                value={paymentData.chequeDate}
                onChange={(e) => setPaymentData({ ...paymentData, chequeDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Bank Name"
                value={paymentData.bankName}
                onChange={(e) => setPaymentData({ ...paymentData, bankName: e.target.value })}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Branch"
                value={paymentData.branch}
                onChange={(e) => setPaymentData({ ...paymentData, branch: e.target.value })}
              />
            </>
          )}
          {paymentData.paymentMethod === 'rtgs' && (
            <TextField
              fullWidth
              margin="normal"
              label="UTR Number"
              value={paymentData.utr}
              onChange={(e) => setPaymentData({ ...paymentData, utr: e.target.value })}
            />
          )}
          <TextField
            fullWidth
            margin="normal"
            type="date"
            label="Received Date"
            value={paymentData.receivedDate}
            onChange={(e) => setPaymentData({ ...paymentData, receivedDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={paymentData.status}
              onChange={(e) => setPaymentData({ ...paymentData, status: e.target.value })}
            >
              <MenuItem value="received">Received</MenuItem>
              <MenuItem value="cleared">Cleared</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="returned">Returned</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePaymentSubmit} variant="contained">
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Invoice Table Component
const InvoiceTable = ({ invoices, onSendReminder, onRecordPayment, getStatusColor }) => (
  <Card>
    <CardContent>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice No</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment Mode</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.invoiceNo}</TableCell>
                <TableCell>{invoice.customerName}</TableCell>
                <TableCell>₹{invoice.amount.toLocaleString('en-IN')}</TableCell>
                <TableCell>{invoice.dueDate}</TableCell>
                <TableCell>
                  <Chip
                    label={invoice.status}
                    color={getStatusColor(invoice.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{invoice.paymentMode}</TableCell>
                <TableCell>
                  <Tooltip title="Send Reminder">
                    <IconButton size="small" onClick={() => onSendReminder(invoice)}>
                      <Email />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Record Payment">
                    <IconButton size="small" onClick={() => onRecordPayment(invoice)}>
                      <AttachMoney />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </CardContent>
  </Card>
);

export default CollectionsDashboard;

