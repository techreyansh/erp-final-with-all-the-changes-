/**
 * WhatsApp Message Logging Service
 * Stores message drafts and usage logs internally
 * NO delivery tracking - only logs when WhatsApp button was used
 */

import * as db from '../lib/db';

const WHATSAPP_LOGS_TABLE = 'whatsapp_logs';

class WhatsAppLogService {
  /**
   * No-op: tables are managed by Supabase migrations.
   */
  async initializeSheet() {}

  /**
   * Log a WhatsApp message draft
   */
  async logMessageDraft(orderId, clientCode, workflowStage, status, messageDraft, recipients, messageSent = false, userEmail = 'Unknown') {
    try {
      const timestamp = new Date().toISOString();

      const logEntry = {
        Timestamp: timestamp,
        OrderID: orderId || '',
        ClientCode: clientCode || '',
        WorkflowStage: workflowStage || '',
        Status: status || '',
        MessageDraft: messageDraft || '',
        Recipients: JSON.stringify(recipients || []),
        UserEmail: userEmail || 'Unknown',
        MessageSent: messageSent ? 'Yes' : 'No'
      };

      await db.insertTableRow(WHATSAPP_LOGS_TABLE, logEntry);
      return logEntry;
    } catch (error) {
      console.error('Error logging WhatsApp message draft:', error);
      return null;
    }
  }

  async getOrderLogs(orderId) {
    try {
      const logs = await db.getTableRows(WHATSAPP_LOGS_TABLE);
      return logs.filter(log => log.OrderID === orderId);
    } catch (error) {
      console.error('Error fetching order logs:', error);
      return [];
    }
  }

  async getClientLogs(clientCode) {
    try {
      const logs = await db.getTableRows(WHATSAPP_LOGS_TABLE);
      return logs.filter(log =>
        log.ClientCode === clientCode ||
        log.ClientCode?.toLowerCase() === clientCode?.toLowerCase()
      );
    } catch (error) {
      console.error('Error fetching client logs:', error);
      return [];
    }
  }

  async getRecentLogs(limit = 50) {
    try {
      const logs = await db.getTableRows(WHATSAPP_LOGS_TABLE);
      return logs
        .sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent logs:', error);
      return [];
    }
  }
}

export default new WhatsAppLogService();
