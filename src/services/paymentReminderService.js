import sheetService from './sheetService';
import crmService from './crmService';
import config from '../config/config';

const PAYMENT_SHEETS = {
  invoices: 'CRM_Invoices',
  payments: 'CRM_Payments',
  reminderTemplates: 'CRM_ReminderTemplates',
  communications: 'CRM_Communications',
  callTasks: 'CRM_CallTasks',
  taskLogs: 'CRM_TaskLogs'
};

const paymentReminderService = {
  // ========== INVOICE MANAGEMENT ==========
  async getAllInvoices(forceRefresh = false) {
    try {
      const data = await sheetService.getSheetData(PAYMENT_SHEETS.invoices, forceRefresh);
      return data.map(row => ({
        id: row.Id || '',
        invoiceNo: row.InvoiceNo || '',
        customerId: row.CustomerId || '',
        customerName: row.CustomerName || '',
        amount: parseFloat(row.Amount) || 0,
        issueDate: row.IssueDate || '',
        dueDate: row.DueDate || '',
        status: row.Status || 'sent', // sent/due/paid/overdue
        paymentMode: row.PaymentMode || '', // cheque/rtgs
        notes: row.Notes || '',
        createdBy: row.CreatedBy || '',
        createdAt: row.CreatedAt || '',
        updatedAt: row.UpdatedAt || ''
      }));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  },

  async createInvoice(invoiceData, userEmail) {
    const invoiceId = invoiceData.id || `INV${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    
    // Get customer name if customerId provided
    let customerName = invoiceData.customerName || '';
    if (invoiceData.customerId && !customerName) {
      const client = await crmService.getClientByCode(invoiceData.customerId);
      customerName = client?.clientName || '';
    }

    const record = {
      Id: invoiceId,
      InvoiceNo: invoiceData.invoiceNo || invoiceId,
      CustomerId: invoiceData.customerId || '',
      CustomerName: customerName,
      Amount: invoiceData.amount || 0,
      IssueDate: invoiceData.issueDate || now.split('T')[0],
      DueDate: invoiceData.dueDate || '',
      Status: invoiceData.status || 'sent',
      PaymentMode: invoiceData.paymentMode || '',
      Notes: invoiceData.notes || '',
      CreatedBy: userEmail,
      CreatedAt: now,
      UpdatedAt: now
    };

    await sheetService.appendRow(PAYMENT_SHEETS.invoices, record);
    
    // Auto-create reminders and call task if payment mode is cheque/rtgs
    if (['cheque', 'rtgs'].includes(invoiceData.paymentMode?.toLowerCase())) {
      await this.autoCreateRemindersAndCallTask(invoiceId, invoiceData, userEmail);
    }
    
    return { ...record, id: invoiceId };
  },

  // ========== AUTO-CREATE REMINDERS AND CALL TASKS ==========
  async autoCreateRemindersAndCallTask(invoiceId, invoiceData, userEmail) {
    try {
      const issueDate = new Date(invoiceData.issueDate || new Date());
      const dueDate = new Date(invoiceData.dueDate || new Date());
      
      // Create immediate call task
      await this.createCallTask({
        invoiceId: invoiceId,
        customerId: invoiceData.customerId,
        customerName: invoiceData.customerName,
        dueAt: new Date().toISOString(), // Immediate
        priority: 'high',
        assignedTo: userEmail // Default to CRM user
      }, userEmail);

      // Schedule reminders based on default rules
      const reminderRules = [
        { offsetDays: 3, type: 'friendly' }, // issue_date + 3 days
        { offsetDays: -7, type: 'early' }, // due_date - 7 days
        { offsetDays: -1, type: 'final' }, // due_date - 1 day
        { offsetDays: 3, type: 'overdue' } // due_date + 3 days
      ];

      for (const rule of reminderRules) {
        let sendDate;
        if (rule.offsetDays < 0) {
          // Before due date
          sendDate = new Date(dueDate);
          sendDate.setDate(sendDate.getDate() + rule.offsetDays);
        } else if (rule.type === 'friendly') {
          // After issue date
          sendDate = new Date(issueDate);
          sendDate.setDate(sendDate.getDate() + rule.offsetDays);
        } else {
          // After due date
          sendDate = new Date(dueDate);
          sendDate.setDate(sendDate.getDate() + rule.offsetDays);
        }

        // Only schedule if date is in future
        if (sendDate > new Date()) {
          await this.scheduleCommunication({
            invoiceId: invoiceId,
            customerId: invoiceData.customerId,
            channel: 'email',
            templateType: rule.type,
            sendAt: sendDate.toISOString()
          }, userEmail);

          await this.scheduleCommunication({
            invoiceId: invoiceId,
            customerId: invoiceData.customerId,
            channel: 'whatsapp',
            templateType: rule.type,
            sendAt: sendDate.toISOString()
          }, userEmail);
        }
      }
    } catch (error) {
      console.error('Error auto-creating reminders:', error);
    }
  },

  // ========== PAYMENT MANAGEMENT ==========
  async getAllPayments(forceRefresh = false) {
    try {
      const data = await sheetService.getSheetData(PAYMENT_SHEETS.payments, forceRefresh);
      return data.map(row => ({
        id: row.Id || '',
        invoiceId: row.InvoiceId || '',
        paymentMethod: row.PaymentMethod || '', // cheque/rtgs
        chequeNo: row.ChequeNo || '',
        chequeDate: row.ChequeDate || '',
        bankName: row.BankName || '',
        branch: row.Branch || '',
        utr: row.UTR || '',
        amount: parseFloat(row.Amount) || 0,
        receivedDate: row.ReceivedDate || '',
        status: row.Status || 'received', // received/cleared/pending/returned
        createdBy: row.CreatedBy || '',
        createdAt: row.CreatedAt || '',
        updatedAt: row.UpdatedAt || ''
      }));
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  },

  async createPayment(paymentData, userEmail) {
    const paymentId = paymentData.id || `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const record = {
      Id: paymentId,
      InvoiceId: paymentData.invoiceId || '',
      PaymentMethod: paymentData.paymentMethod || '',
      ChequeNo: paymentData.chequeNo || '',
      ChequeDate: paymentData.chequeDate || '',
      BankName: paymentData.bankName || '',
      Branch: paymentData.branch || '',
      UTR: paymentData.utr || '',
      Amount: paymentData.amount || 0,
      ReceivedDate: paymentData.receivedDate || now.split('T')[0],
      Status: paymentData.status || 'received',
      CreatedBy: userEmail,
      CreatedAt: now,
      UpdatedAt: now
    };

    await sheetService.appendRow(PAYMENT_SHEETS.payments, record);
    
    // Auto-close tasks and update invoice status
    if (paymentData.invoiceId) {
      await this.closeTasksForInvoice(paymentData.invoiceId, userEmail);
      await this.updateInvoiceStatus(paymentData.invoiceId, paymentData.status === 'cleared' ? 'paid' : 'pending_clearance', userEmail);
    }
    
    return { ...record, id: paymentId };
  },

  // ========== CALL TASKS MANAGEMENT ==========
  async getAllCallTasks(forceRefresh = false) {
    try {
      const data = await sheetService.getSheetData(PAYMENT_SHEETS.callTasks, forceRefresh);
      return data.map(row => ({
        id: row.Id || '',
        invoiceId: row.InvoiceId || '',
        customerId: row.CustomerId || '',
        customerName: row.CustomerName || '',
        assignedTo: row.AssignedTo || '',
        dueAt: row.DueAt || '',
        priority: row.Priority || 'medium',
        status: row.Status || 'open', // open/done/snoozed/escalated
        attempts: parseInt(row.Attempts) || 0,
        lastContactAt: row.LastContactAt || '',
        lastOutcome: row.LastOutcome || '',
        createdBy: row.CreatedBy || '',
        createdAt: row.CreatedAt || '',
        updatedAt: row.UpdatedAt || ''
      }));
    } catch (error) {
      console.error('Error fetching call tasks:', error);
      return [];
    }
  },

  async createCallTask(taskData, userEmail) {
    const taskId = taskData.id || `TASK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    
    // Get customer name if customerId provided
    let customerName = taskData.customerName || '';
    if (taskData.customerId && !customerName) {
      const client = await crmService.getClientByCode(taskData.customerId);
      customerName = client?.clientName || '';
    }

    const record = {
      Id: taskId,
      InvoiceId: taskData.invoiceId || '',
      CustomerId: taskData.customerId || '',
      CustomerName: customerName,
      AssignedTo: taskData.assignedTo || userEmail,
      DueAt: taskData.dueAt || now,
      Priority: taskData.priority || 'medium',
      Status: taskData.status || 'open',
      Attempts: taskData.attempts || 0,
      LastContactAt: taskData.lastContactAt || '',
      LastOutcome: taskData.lastOutcome || '',
      CreatedBy: userEmail,
      CreatedAt: now,
      UpdatedAt: now
    };

    await sheetService.appendRow(PAYMENT_SHEETS.callTasks, record);
    return { ...record, id: taskId };
  },

  async updateCallTask(taskId, taskData, userEmail) {
    const tasks = await this.getAllCallTasks();
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) throw new Error('Call task not found');

    const now = new Date().toISOString();
    const existing = tasks[idx];

    const record = {
      Id: taskId,
      InvoiceId: taskData.invoiceId !== undefined ? taskData.invoiceId : existing.invoiceId,
      CustomerId: taskData.customerId !== undefined ? taskData.customerId : existing.customerId,
      CustomerName: taskData.customerName !== undefined ? taskData.customerName : existing.customerName,
      AssignedTo: taskData.assignedTo !== undefined ? taskData.assignedTo : existing.assignedTo,
      DueAt: taskData.dueAt !== undefined ? taskData.dueAt : existing.dueAt,
      Priority: taskData.priority !== undefined ? taskData.priority : existing.priority,
      Status: taskData.status !== undefined ? taskData.status : existing.status,
      Attempts: taskData.attempts !== undefined ? taskData.attempts : existing.attempts,
      LastContactAt: taskData.lastContactAt !== undefined ? taskData.lastContactAt : existing.lastContactAt,
      LastOutcome: taskData.lastOutcome !== undefined ? taskData.lastOutcome : existing.lastOutcome,
      CreatedBy: existing.createdBy,
      CreatedAt: existing.createdAt,
      UpdatedAt: now
    };

    await sheetService.updateRow(PAYMENT_SHEETS.callTasks, idx + 2, record);
    
    // Auto-escalate if attempts >= 3
    if (record.Attempts >= 3 && record.Status !== 'done' && record.Status !== 'escalated') {
      await this.escalateTask(taskId, userEmail);
    }
    
    return record;
  },

  async snoozeTask(taskId, snoozeHours, userEmail) {
    const task = await this.getAllCallTasks();
    const found = task.find(t => t.id === taskId);
    if (!found) throw new Error('Task not found');

    const newDueAt = new Date();
    newDueAt.setHours(newDueAt.getHours() + snoozeHours);

    await this.updateCallTask(taskId, {
      dueAt: newDueAt.toISOString(),
      attempts: found.attempts + 1,
      status: 'snoozed'
    }, userEmail);

    // Log the snooze action
    await this.createTaskLog({
      taskId: taskId,
      action: 'snooze',
      note: `Snoozed for ${snoozeHours} hours`,
      userId: userEmail
    });
  },

  async escalateTask(taskId, userEmail) {
    await this.updateCallTask(taskId, {
      status: 'escalated',
      priority: 'high'
    }, userEmail);

    // Log escalation
    await this.createTaskLog({
      taskId: taskId,
      action: 'escalate',
      note: 'Auto-escalated after 3 attempts',
      userId: userEmail
    });
  },

  async closeTasksForInvoice(invoiceId, userEmail) {
    const tasks = await this.getAllCallTasks();
    const openTasks = tasks.filter(t => t.invoiceId === invoiceId && t.status !== 'done');
    
    for (const task of openTasks) {
      await this.updateCallTask(task.id, {
        status: 'done'
      }, userEmail);
    }
  },

  async updateInvoiceStatus(invoiceId, status, userEmail) {
    const invoices = await this.getAllInvoices();
    const idx = invoices.findIndex(i => i.id === invoiceId);
    if (idx === -1) throw new Error('Invoice not found');

    const existing = invoices[idx];
    const record = {
      ...existing,
      Status: status,
      UpdatedAt: new Date().toISOString()
    };

    await sheetService.updateRow(PAYMENT_SHEETS.invoices, idx + 2, record);
    return record;
  },

  // ========== COMMUNICATIONS MANAGEMENT ==========
  async getAllCommunications(forceRefresh = false) {
    try {
      const data = await sheetService.getSheetData(PAYMENT_SHEETS.communications, forceRefresh);
      return data.map(row => ({
        id: row.Id || '',
        invoiceId: row.InvoiceId || '',
        customerId: row.CustomerId || '',
        channel: row.Channel || '', // whatsapp/email/sms
        templateId: row.TemplateId || '',
        sendAt: row.SendAt || '',
        sentBy: row.SentBy || '',
        status: row.Status || 'scheduled', // scheduled/sent/failed
        deliveryMeta: row.DeliveryMeta ? JSON.parse(row.DeliveryMeta) : {},
        createdAt: row.CreatedAt || ''
      }));
    } catch (error) {
      console.error('Error fetching communications:', error);
      return [];
    }
  },

  async scheduleCommunication(commData, userEmail) {
    const commId = `COMM${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const record = {
      Id: commId,
      InvoiceId: commData.invoiceId || '',
      CustomerId: commData.customerId || '',
      Channel: commData.channel || '',
      TemplateId: commData.templateId || '',
      SendAt: commData.sendAt || now,
      SentBy: commData.sentBy || userEmail,
      Status: 'scheduled',
      DeliveryMeta: JSON.stringify(commData.deliveryMeta || {}),
      CreatedAt: now
    };

    await sheetService.appendRow(PAYMENT_SHEETS.communications, record);
    return { ...record, id: commId };
  },

  // ========== TASK LOGS ==========
  async createTaskLog(logData, userEmail) {
    const logId = `LOG${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const record = {
      Id: logId,
      TaskId: logData.taskId || '',
      UserId: logData.userId || userEmail,
      Action: logData.action || '', // snooze/complete/escalate
      Note: logData.note || '',
      CreatedAt: now
    };

    await sheetService.appendRow(PAYMENT_SHEETS.taskLogs, record);
    return { ...record, id: logId };
  },

  // ========== COLLECTIONS DASHBOARD DATA ==========
  async getCollectionsDashboard(days = 30) {
    const invoices = await this.getAllInvoices();
    const tasks = await this.getAllCallTasks();
    const payments = await this.getAllPayments();
    
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);
    
    // Filter invoices by due date range
    const relevantInvoices = invoices.filter(inv => {
      if (!inv.dueDate) return false;
      const due = new Date(inv.dueDate);
      return due >= today && due <= futureDate;
    });

    // Categorize by priority
    const overdue = invoices.filter(inv => {
      if (!inv.dueDate || inv.status === 'paid') return false;
      return new Date(inv.dueDate) < today;
    });

    const dueSoon = relevantInvoices.filter(inv => {
      if (inv.status === 'paid') return false;
      const due = new Date(inv.dueDate);
      const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 3;
    });

    const dueLater = relevantInvoices.filter(inv => {
      if (inv.status === 'paid') return false;
      const due = new Date(inv.dueDate);
      const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      return daysUntilDue > 3 && daysUntilDue <= 30;
    });

    // Get today's call tasks
    const todayTasks = tasks.filter(t => {
      if (t.status === 'done') return false;
      const due = new Date(t.dueAt);
      return due.toDateString() === today.toDateString();
    });

    return {
      overdue,
      dueSoon,
      dueLater,
      todayTasks,
      totalOutstanding: invoices.filter(inv => inv.status !== 'paid').length,
      totalAmount: invoices
        .filter(inv => inv.status !== 'paid')
        .reduce((sum, inv) => sum + inv.amount, 0)
    };
  }
};

export default paymentReminderService;

