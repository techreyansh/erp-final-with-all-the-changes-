import sheetService from './sheetService';
import config from '../config/config';
import { getAllClients } from './clientService';
import salesFlowService from './salesFlowService';
import { parseJsonArray } from '../utils/parseJsonField';

const CRM_SHEETS = {
  opportunities: 'CRM_Opportunities',
  activities: 'CRM_Activities',
  interactions: 'CRM_Interactions',
  tasks: 'CRM_Tasks',
  notes: 'CRM_Notes',
  orderTaking: 'CRM_OrderTaking',
  callLogs: 'CRM_CallLogs',
  payments: 'CRM_Payments'
};

const crmService = {
  // ========== CLIENT INTEGRATION ==========
  // Get all clients (from existing CLIENT sheet)
  async getAllClients(forceRefresh = false) {
    return await getAllClients(forceRefresh);
  },

  // Get client by code
  async getClientByCode(clientCode) {
    const clients = await getAllClients();
    return clients.find(c => c.clientCode === clientCode);
  },

  // ========== OPPORTUNITIES MANAGEMENT ==========
  // Generate unique opportunity ID
  generateOpportunityId() {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `OPP${random}`;
  },

  // Get all opportunities
  async getAllOpportunities(forceRefresh = false) {
    try {
      const data = await sheetService.getSheetData(CRM_SHEETS.opportunities, forceRefresh);
      return data.map(row => ({
        opportunityId: row.OpportunityId || '',
        clientCode: row.ClientCode || '',
        clientName: row.ClientName || '',
        title: row.Title || '',
        description: row.Description || '',
        value: parseFloat(row.Value) || 0,
        currency: row.Currency || 'INR',
        stage: row.Stage || 'Prospecting', // Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost
        probability: parseInt(row.Probability) || 0,
        expectedCloseDate: row.ExpectedCloseDate || '',
        actualCloseDate: row.ActualCloseDate || '',
        source: row.Source || '',
        assignedTo: row.AssignedTo || '',
        products: parseJsonArray(row.Products),
        notes: row.Notes || '',
        status: row.Status || 'Active', // Active, Closed, Lost
        createdBy: row.CreatedBy || '',
        createdAt: row.CreatedAt || '',
        updatedAt: row.UpdatedAt || '',
        lastContactDate: row.LastContactDate || '',
        nextFollowUpDate: row.NextFollowUpDate || '',
        logId: row.LogId || '' // Link to SalesFlow
      }));
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      return [];
    }
  },

  // Create opportunity
  async createOpportunity(opportunityData, userEmail) {
    const opportunityId = opportunityData.opportunityId || this.generateOpportunityId();
    const now = new Date().toISOString();
    
    // Get client name if clientCode provided
    let clientName = opportunityData.clientName || '';
    if (opportunityData.clientCode && !clientName) {
      const client = await this.getClientByCode(opportunityData.clientCode);
      clientName = client?.clientName || '';
    }

    const record = {
      OpportunityId: opportunityId,
      ClientCode: opportunityData.clientCode || '',
      ClientName: clientName,
      Title: opportunityData.title || '',
      Description: opportunityData.description || '',
      Value: opportunityData.value || 0,
      Currency: opportunityData.currency || 'INR',
      Stage: opportunityData.stage || 'Prospecting',
      Probability: opportunityData.probability || 0,
      ExpectedCloseDate: opportunityData.expectedCloseDate || '',
      ActualCloseDate: opportunityData.actualCloseDate || '',
      Source: opportunityData.source || '',
      AssignedTo: opportunityData.assignedTo || '',
      Products: JSON.stringify(opportunityData.products || []),
      Notes: opportunityData.notes || '',
      Status: opportunityData.status || 'Active',
      CreatedBy: userEmail,
      CreatedAt: now,
      UpdatedAt: now,
      LastContactDate: opportunityData.lastContactDate || '',
      NextFollowUpDate: opportunityData.nextFollowUpDate || '',
      LogId: opportunityData.logId || ''
    };

    await sheetService.appendRow(CRM_SHEETS.opportunities, record);
    return { ...record, opportunityId };
  },

  // Update opportunity
  async updateOpportunity(opportunityId, opportunityData, userEmail) {
    const data = await this.getAllOpportunities();
    const idx = data.findIndex(o => o.opportunityId === opportunityId);
    if (idx === -1) throw new Error('Opportunity not found');

    const now = new Date().toISOString();
    const existing = data[idx];
    
    // Get client name if clientCode changed
    let clientName = opportunityData.clientName || existing.clientName;
    if (opportunityData.clientCode && opportunityData.clientCode !== existing.clientCode) {
      const client = await this.getClientByCode(opportunityData.clientCode);
      clientName = client?.clientName || clientName;
    }

    const record = {
      OpportunityId: opportunityId,
      ClientCode: opportunityData.clientCode !== undefined ? opportunityData.clientCode : existing.clientCode,
      ClientName: clientName,
      Title: opportunityData.title !== undefined ? opportunityData.title : existing.title,
      Description: opportunityData.description !== undefined ? opportunityData.description : existing.description,
      Value: opportunityData.value !== undefined ? opportunityData.value : existing.value,
      Currency: opportunityData.currency !== undefined ? opportunityData.currency : existing.currency,
      Stage: opportunityData.stage !== undefined ? opportunityData.stage : existing.stage,
      Probability: opportunityData.probability !== undefined ? opportunityData.probability : existing.probability,
      ExpectedCloseDate: opportunityData.expectedCloseDate !== undefined ? opportunityData.expectedCloseDate : existing.expectedCloseDate,
      ActualCloseDate: opportunityData.actualCloseDate !== undefined ? opportunityData.actualCloseDate : existing.actualCloseDate,
      Source: opportunityData.source !== undefined ? opportunityData.source : existing.source,
      AssignedTo: opportunityData.assignedTo !== undefined ? opportunityData.assignedTo : existing.assignedTo,
      Products: JSON.stringify(opportunityData.products !== undefined ? opportunityData.products : existing.products),
      Notes: opportunityData.notes !== undefined ? opportunityData.notes : existing.notes,
      Status: opportunityData.status !== undefined ? opportunityData.status : existing.status,
      CreatedBy: existing.createdBy,
      CreatedAt: existing.createdAt,
      UpdatedAt: now,
      LastContactDate: opportunityData.lastContactDate !== undefined ? opportunityData.lastContactDate : existing.lastContactDate,
      NextFollowUpDate: opportunityData.nextFollowUpDate !== undefined ? opportunityData.nextFollowUpDate : existing.nextFollowUpDate,
      LogId: opportunityData.logId !== undefined ? opportunityData.logId : existing.logId
    };

    await sheetService.updateRow(CRM_SHEETS.opportunities, idx + 2, record);
    return record;
  },

  // Delete opportunity
  async deleteOpportunity(opportunityId) {
    const data = await this.getAllOpportunities();
    const idx = data.findIndex(o => o.opportunityId === opportunityId);
    if (idx === -1) throw new Error('Opportunity not found');
    await sheetService.deleteRow(CRM_SHEETS.opportunities, idx + 2);
  },

  // ========== ACTIVITIES MANAGEMENT ==========
  // Get all activities
  async getAllActivities(forceRefresh = false) {
    try {
      const data = await sheetService.getSheetData(CRM_SHEETS.activities, forceRefresh);
      return data.map(row => ({
        activityId: row.ActivityId || '',
        clientCode: row.ClientCode || '',
        opportunityId: row.OpportunityId || '',
        type: row.Type || '', // Call, Meeting, Email, Task, Note
        subject: row.Subject || '',
        description: row.Description || '',
        activityDate: row.ActivityDate || '',
        duration: parseInt(row.Duration) || 0, // minutes
        assignedTo: row.AssignedTo || '',
        status: row.Status || 'Planned', // Planned, Completed, Cancelled
        priority: row.Priority || 'Medium',
        outcome: row.Outcome || '',
        nextAction: row.NextAction || '',
        createdBy: row.CreatedBy || '',
        createdAt: row.CreatedAt || '',
        updatedAt: row.UpdatedAt || ''
      }));
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  },

  // Create activity
  async createActivity(activityData, userEmail) {
    const activityId = `ACT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const record = {
      ActivityId: activityId,
      ClientCode: activityData.clientCode || '',
      OpportunityId: activityData.opportunityId || '',
      Type: activityData.type || '',
      Subject: activityData.subject || '',
      Description: activityData.description || '',
      ActivityDate: activityData.activityDate || now,
      Duration: activityData.duration || 0,
      AssignedTo: activityData.assignedTo || '',
      Status: activityData.status || 'Planned',
      Priority: activityData.priority || 'Medium',
      Outcome: activityData.outcome || '',
      NextAction: activityData.nextAction || '',
      CreatedBy: userEmail,
      CreatedAt: now,
      UpdatedAt: now
    };

    await sheetService.appendRow(CRM_SHEETS.activities, record);
    return { ...record, activityId };
  },

  // Update activity
  async updateActivity(activityId, activityData, userEmail) {
    const data = await this.getAllActivities();
    const idx = data.findIndex(a => a.activityId === activityId);
    if (idx === -1) throw new Error('Activity not found');

    const now = new Date().toISOString();
    const existing = data[idx];

    const record = {
      ActivityId: activityId,
      ClientCode: activityData.clientCode !== undefined ? activityData.clientCode : existing.clientCode,
      OpportunityId: activityData.opportunityId !== undefined ? activityData.opportunityId : existing.opportunityId,
      Type: activityData.type !== undefined ? activityData.type : existing.type,
      Subject: activityData.subject !== undefined ? activityData.subject : existing.subject,
      Description: activityData.description !== undefined ? activityData.description : existing.description,
      ActivityDate: activityData.activityDate !== undefined ? activityData.activityDate : existing.activityDate,
      Duration: activityData.duration !== undefined ? activityData.duration : existing.duration,
      AssignedTo: activityData.assignedTo !== undefined ? activityData.assignedTo : existing.assignedTo,
      Status: activityData.status !== undefined ? activityData.status : existing.status,
      Priority: activityData.priority !== undefined ? activityData.priority : existing.priority,
      Outcome: activityData.outcome !== undefined ? activityData.outcome : existing.outcome,
      NextAction: activityData.nextAction !== undefined ? activityData.nextAction : existing.nextAction,
      CreatedBy: existing.createdBy,
      CreatedAt: existing.createdAt,
      UpdatedAt: now
    };

    await sheetService.updateRow(CRM_SHEETS.activities, idx + 2, record);
    return record;
  },

  // ========== INTERACTIONS/COMMUNICATION HISTORY ==========
  async getAllInteractions(forceRefresh = false) {
    try {
      const data = await sheetService.getSheetData(CRM_SHEETS.interactions, forceRefresh);
      return data.map(row => ({
        interactionId: row.InteractionId || '',
        clientCode: row.ClientCode || '',
        opportunityId: row.OpportunityId || '',
        type: row.Type || '', // Email, Call, Meeting, WhatsApp, SMS
        direction: row.Direction || '', // Inbound, Outbound
        subject: row.Subject || '',
        content: row.Content || '',
        from: row.From || '',
        to: row.To || '',
        dateTime: row.DateTime || '',
        duration: parseInt(row.Duration) || 0,
        status: row.Status || '', // Sent, Received, Read, Replied
        attachments: parseJsonArray(row.Attachments),
        createdBy: row.CreatedBy || '',
        createdAt: row.CreatedAt || ''
      }));
    } catch (error) {
      console.error('Error fetching interactions:', error);
      return [];
    }
  },

  async createInteraction(interactionData, userEmail) {
    const interactionId = `INT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const record = {
      InteractionId: interactionId,
      ClientCode: interactionData.clientCode || '',
      OpportunityId: interactionData.opportunityId || '',
      Type: interactionData.type || '',
      Direction: interactionData.direction || '',
      Subject: interactionData.subject || '',
      Content: interactionData.content || '',
      From: interactionData.from || userEmail,
      To: interactionData.to || '',
      DateTime: interactionData.dateTime || now,
      Duration: interactionData.duration || 0,
      Status: interactionData.status || 'Sent',
      Attachments: JSON.stringify(interactionData.attachments || []),
      CreatedBy: userEmail,
      CreatedAt: now
    };

    await sheetService.appendRow(CRM_SHEETS.interactions, record);
    return { ...record, interactionId };
  },

  // ========== TASKS MANAGEMENT ==========
  async getAllTasks(forceRefresh = false) {
    try {
      const data = await sheetService.getSheetData(CRM_SHEETS.tasks, forceRefresh);
      return data.map(row => ({
        taskId: row.TaskId || '',
        clientCode: row.ClientCode || '',
        opportunityId: row.OpportunityId || '',
        title: row.Title || '',
        description: row.Description || '',
        dueDate: row.DueDate || '',
        priority: row.Priority || 'Medium',
        status: row.Status || 'Pending', // Pending, In Progress, Completed, Cancelled
        assignedTo: row.AssignedTo || '',
        completedDate: row.CompletedDate || '',
        reminderDate: row.ReminderDate || '',
        createdBy: row.CreatedBy || '',
        createdAt: row.CreatedAt || '',
        updatedAt: row.UpdatedAt || ''
      }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  async createTask(taskData, userEmail) {
    const taskId = `TASK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const record = {
      TaskId: taskId,
      ClientCode: taskData.clientCode || '',
      OpportunityId: taskData.opportunityId || '',
      Title: taskData.title || '',
      Description: taskData.description || '',
      DueDate: taskData.dueDate || '',
      Priority: taskData.priority || 'Medium',
      Status: taskData.status || 'Pending',
      AssignedTo: taskData.assignedTo || '',
      CompletedDate: taskData.completedDate || '',
      ReminderDate: taskData.reminderDate || '',
      CreatedBy: userEmail,
      CreatedAt: now,
      UpdatedAt: now
    };

    await sheetService.appendRow(CRM_SHEETS.tasks, record);
    return { ...record, taskId };
  },

  async updateTask(taskId, taskData, userEmail) {
    const data = await this.getAllTasks();
    const idx = data.findIndex(t => t.taskId === taskId);
    if (idx === -1) throw new Error('Task not found');

    const now = new Date().toISOString();
    const existing = data[idx];

    const record = {
      TaskId: taskId,
      ClientCode: taskData.clientCode !== undefined ? taskData.clientCode : existing.clientCode,
      OpportunityId: taskData.opportunityId !== undefined ? taskData.opportunityId : existing.opportunityId,
      Title: taskData.title !== undefined ? taskData.title : existing.title,
      Description: taskData.description !== undefined ? taskData.description : existing.description,
      DueDate: taskData.dueDate !== undefined ? taskData.dueDate : existing.dueDate,
      Priority: taskData.priority !== undefined ? taskData.priority : existing.priority,
      Status: taskData.status !== undefined ? taskData.status : existing.status,
      AssignedTo: taskData.assignedTo !== undefined ? taskData.assignedTo : existing.assignedTo,
      CompletedDate: taskData.completedDate !== undefined ? taskData.completedDate : existing.completedDate,
      ReminderDate: taskData.reminderDate !== undefined ? taskData.reminderDate : existing.reminderDate,
      CreatedBy: existing.createdBy,
      CreatedAt: existing.createdAt,
      UpdatedAt: now
    };

    await sheetService.updateRow(CRM_SHEETS.tasks, idx + 2, record);
    return record;
  },

  // ========== NOTES MANAGEMENT ==========
  async getAllNotes(forceRefresh = false) {
    try {
      const data = await sheetService.getSheetData(CRM_SHEETS.notes, forceRefresh);
      return data.map(row => ({
        noteId: row.NoteId || '',
        clientCode: row.ClientCode || '',
        opportunityId: row.OpportunityId || '',
        title: row.Title || '',
        content: row.Content || '',
        category: row.Category || 'General',
        tags: parseJsonArray(row.Tags),
        createdBy: row.CreatedBy || '',
        createdAt: row.CreatedAt || '',
        updatedAt: row.UpdatedAt || ''
      }));
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  },

  async createNote(noteData, userEmail) {
    const noteId = `NOTE${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const record = {
      NoteId: noteId,
      ClientCode: noteData.clientCode || '',
      OpportunityId: noteData.opportunityId || '',
      Title: noteData.title || '',
      Content: noteData.content || '',
      Category: noteData.category || 'General',
      Tags: JSON.stringify(noteData.tags || []),
      CreatedBy: userEmail,
      CreatedAt: now,
      UpdatedAt: now
    };

    await sheetService.appendRow(CRM_SHEETS.notes, record);
    return { ...record, noteId };
  },

  // ========== ANALYTICS & REPORTS ==========
  // Get opportunities by stage
  async getOpportunitiesByStage() {
    const opportunities = await this.getAllOpportunities();
    const active = opportunities.filter(o => o.status === 'Active');
    const byStage = {};
    active.forEach(opp => {
      byStage[opp.stage] = (byStage[opp.stage] || 0) + 1;
    });
    return byStage;
  },

  // Get pipeline value
  async getPipelineValue() {
    const opportunities = await this.getAllOpportunities();
    const active = opportunities.filter(o => o.status === 'Active');
    return active.reduce((sum, opp) => sum + (opp.value || 0), 0);
  },

  // Get weighted pipeline value
  async getWeightedPipelineValue() {
    const opportunities = await this.getAllOpportunities();
    const active = opportunities.filter(o => o.status === 'Active');
    return active.reduce((sum, opp) => {
      const weighted = (opp.value || 0) * (opp.probability || 0) / 100;
      return sum + weighted;
    }, 0);
  },

  // Get activities by client
  async getActivitiesByClient(clientCode) {
    const activities = await this.getAllActivities();
    return activities.filter(a => a.clientCode === clientCode).sort((a, b) => 
      new Date(b.activityDate) - new Date(a.activityDate)
    );
  },

  // Get interactions by client
  async getInteractionsByClient(clientCode) {
    const interactions = await this.getAllInteractions();
    return interactions.filter(i => i.clientCode === clientCode).sort((a, b) => 
      new Date(b.dateTime) - new Date(a.dateTime)
    );
  },

  // Get upcoming tasks
  async getUpcomingTasks(days = 7) {
    const tasks = await this.getAllTasks();
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);
    
    return tasks.filter(t => {
      if (t.status === 'Completed' || t.status === 'Cancelled') return false;
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return due >= today && due <= futureDate;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  },

  // ========== ORDER TAKING MANAGEMENT ==========
  async getAllOrderTaking(forceRefresh = false) {
    try {
      const data = await sheetService.getSheetData(CRM_SHEETS.orderTaking, forceRefresh);
      return data.map(row => ({
        orderId: row.OrderId || '',
        clientCode: row.ClientCode || '',
        clientName: row.ClientName || '',
        date: row.Date || '',
        amount: parseFloat(row.Amount) || 0,
        currency: row.Currency || 'INR',
        status: row.Status || 'Pending',
        products: parseJsonArray(row.Products),
        notes: row.Notes || '',
        createdBy: row.CreatedBy || '',
        createdAt: row.CreatedAt || '',
        updatedAt: row.UpdatedAt || ''
      }));
    } catch (error) {
      console.error('Error fetching order taking:', error);
      return [];
    }
  },

  async createOrderTaking(orderData, userEmail) {
    const orderId = orderData.orderId || `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    
    // Get client name if clientCode provided
    let clientName = orderData.clientName || '';
    if (orderData.clientCode && !clientName) {
      const client = await this.getClientByCode(orderData.clientCode);
      clientName = client?.clientName || '';
    }

    const record = {
      OrderId: orderId,
      ClientCode: orderData.clientCode || '',
      ClientName: clientName,
      Date: orderData.date || now,
      Amount: orderData.amount || 0,
      Currency: orderData.currency || 'INR',
      Status: orderData.status || 'Pending',
      Products: JSON.stringify(orderData.products || []),
      Notes: orderData.notes || '',
      CreatedBy: userEmail,
      CreatedAt: now,
      UpdatedAt: now
    };

    await sheetService.appendRow(CRM_SHEETS.orderTaking, record);
    return { ...record, orderId };
  },

  // ========== CALL LOGS MANAGEMENT ==========
  async getAllCallLogs(forceRefresh = false) {
    try {
      const data = await sheetService.getSheetData(CRM_SHEETS.callLogs, forceRefresh);
      return data.map(row => ({
        callLogId: row.CallLogId || '',
        clientCode: row.ClientCode || '',
        clientName: row.ClientName || '',
        dateTime: row.DateTime || '',
        direction: row.Direction || 'Outbound',
        duration: parseInt(row.Duration) || 0,
        phoneNumber: row.PhoneNumber || '',
        status: row.Status || 'Completed',
        notes: row.Notes || '',
        outcome: row.Outcome || '',
        nextAction: row.NextAction || '',
        createdBy: row.CreatedBy || '',
        createdAt: row.CreatedAt || ''
      }));
    } catch (error) {
      console.error('Error fetching call logs:', error);
      return [];
    }
  },

  async createCallLog(callLogData, userEmail) {
    const callLogId = `CALL${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    
    // Get client name if clientCode provided
    let clientName = callLogData.clientName || '';
    if (callLogData.clientCode && !clientName) {
      const client = await this.getClientByCode(callLogData.clientCode);
      clientName = client?.clientName || '';
    }

    const record = {
      CallLogId: callLogId,
      ClientCode: callLogData.clientCode || '',
      ClientName: clientName,
      DateTime: callLogData.dateTime || now,
      Direction: callLogData.direction || 'Outbound',
      Duration: callLogData.duration || 0,
      PhoneNumber: callLogData.phoneNumber || '',
      Status: callLogData.status || 'Completed',
      Notes: callLogData.notes || '',
      Outcome: callLogData.outcome || '',
      NextAction: callLogData.nextAction || '',
      CreatedBy: userEmail,
      CreatedAt: now
    };

    await sheetService.appendRow(CRM_SHEETS.callLogs, record);
    return { ...record, callLogId };
  },

  // ========== PAYMENTS MANAGEMENT ==========
  async getAllPayments(forceRefresh = false) {
    try {
      const data = await sheetService.getSheetData(CRM_SHEETS.payments, forceRefresh);
      return data.map(row => ({
        paymentId: row.PaymentId || '',
        clientCode: row.ClientCode || '',
        clientName: row.ClientName || '',
        date: row.Date || '',
        amount: parseFloat(row.Amount) || 0,
        currency: row.Currency || 'INR',
        method: row.Method || '',
        status: row.Status || 'Pending',
        reference: row.Reference || '',
        notes: row.Notes || '',
        opportunityId: row.OpportunityId || '',
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
    const paymentId = paymentData.paymentId || `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    
    // Get client name if clientCode provided
    let clientName = paymentData.clientName || '';
    if (paymentData.clientCode && !clientName) {
      const client = await this.getClientByCode(paymentData.clientCode);
      clientName = client?.clientName || '';
    }

    const record = {
      PaymentId: paymentId,
      ClientCode: paymentData.clientCode || '',
      ClientName: clientName,
      Date: paymentData.date || now,
      Amount: paymentData.amount || 0,
      Currency: paymentData.currency || 'INR',
      Method: paymentData.method || '',
      Status: paymentData.status || 'Pending',
      Reference: paymentData.reference || '',
      Notes: paymentData.notes || '',
      OpportunityId: paymentData.opportunityId || '',
      CreatedBy: userEmail,
      CreatedAt: now,
      UpdatedAt: now
    };

    await sheetService.appendRow(CRM_SHEETS.payments, record);
    return { ...record, paymentId };
  }
};

export default crmService;

