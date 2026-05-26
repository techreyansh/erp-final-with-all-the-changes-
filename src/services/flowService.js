import * as db from '../lib/db';
import poService from './poService';
import config from '../config/config';
import { calculateStageDueDates } from '../utils/backwardPlanning';
import { addWorkingDays } from '../utils/dateRestrictions';

class FlowService {
  // Get all tasks assigned to a user
  async getUserTasks(email) {
    try {
      const pos = await db.getTableRows(db.getTableName(config.sheets.poMaster));
      return pos.filter(po => po.AssignedTo === email);
    } catch (error) {
      console.error(`Error fetching tasks for user ${email}:`, error);
      throw error;
    }
  }
  
  // Get tasks by status
  async getTasksByStatus(status) {
    try {
      const pos = await db.getTableRows(db.getTableName(config.sheets.poMaster));
      return pos.filter(po => po.Status === status);
    } catch (error) {
      console.error(`Error fetching tasks with status ${status}:`, error);
      throw error;
    }
  }
  
  // Advance a PO to the next stage
  async advanceTask(poId, currentUserEmail) {
    try {
      const po = await poService.getPOById(poId);
      
      if (!po) {
        throw new Error(`PO with ID ${poId} not found`);
      }
      
      if (po.AssignedTo !== currentUserEmail) {
        throw new Error('You are not authorized to perform this action on this task.');
      }
      
      const currentStatus = po.Status;
      let nextStatus;
      let nextAssignee = '';
      
      // Determine the next status based on the current status and order type
      switch (currentStatus) {
        case config.statusCodes.NEW:
          nextStatus = config.statusCodes.STORE1;
          // Assign to Store Manager
          nextAssignee = await this.getStoreManager();
          break;
          
        case config.statusCodes.STORE1:
          // If order type is cable-only, go to DISPATCH
          if (po.OrderType === 'CABLE_ONLY') {
            nextStatus = config.statusCodes.DISPATCH;
            nextAssignee = await this.getDispatchManager();
          } else {
            nextStatus = config.statusCodes.CABLE_PRODUCTION;
            nextAssignee = await this.getCableProductionSupervisor();
          }
          break;
          
        case config.statusCodes.CABLE_PRODUCTION:
          // If order type is power-cord, go to STORE2, else DISPATCH
          if (po.OrderType === 'POWER_CORD') {
            nextStatus = config.statusCodes.STORE2;
            nextAssignee = await this.getStoreManager();
          } else {
            nextStatus = config.statusCodes.DISPATCH;
            nextAssignee = await this.getDispatchManager();
          }
          break;
          
        case config.statusCodes.STORE2:
          nextStatus = config.statusCodes.MOULDING;
          nextAssignee = await this.getMouldingProductionSupervisor();
          break;
          
        case config.statusCodes.MOULDING:
          nextStatus = config.statusCodes.FG_SECTION;
          nextAssignee = await this.getFGSectionManager();
          break;
          
        case config.statusCodes.FG_SECTION:
          nextStatus = config.statusCodes.DISPATCH;
          nextAssignee = await this.getDispatchManager();
          break;
          
        case config.statusCodes.DISPATCH:
          nextStatus = config.statusCodes.DELIVERED;
          nextAssignee = '';
          break;
          
        default:
          throw new Error(`Cannot advance PO ${poId} from status ${currentStatus}`);
      }
      
      // Calculate due date based on stage-specific due dates (if available) or SLA
      let dueDate = '';
      if (nextStatus !== config.statusCodes.DELIVERED) {
        // Check if we have pre-calculated stage-specific due dates
        switch (nextStatus) {
          case config.statusCodes.STORE1:
            dueDate = po.Store1DueDate || this.calculateSLADueDate(nextStatus);
            break;
          case config.statusCodes.CABLE_PRODUCTION:
            dueDate = po.CableProductionDueDate || this.calculateSLADueDate(nextStatus);
            break;
          case config.statusCodes.STORE2:
            dueDate = po.Store2DueDate || this.calculateSLADueDate(nextStatus);
            break;
          case config.statusCodes.MOULDING:
            dueDate = po.MouldingDueDate || this.calculateSLADueDate(nextStatus);
            break;
          case config.statusCodes.FG_SECTION:
            dueDate = po.FGSectionDueDate || this.calculateSLADueDate(nextStatus);
            break;
          case config.statusCodes.DISPATCH:
            dueDate = po.DispatchDate || this.calculateSLADueDate(nextStatus);
            break;
          default:
            dueDate = this.calculateSLADueDate(nextStatus);
        }
      }
      
      // Update PO
      const updatedPO = await poService.updatePO(poId, {
        Status: nextStatus,
        AssignedTo: nextAssignee,
        DueDate: dueDate
      });
      
      // Log the action
      await this.logAction(
        poId,
        currentStatus,
        nextStatus,
        currentUserEmail,
        'ADVANCE'
      );
      
      return updatedPO;
    } catch (error) {
      console.error(`Error advancing task for PO ${poId}:`, error);
      throw error;
    }
  }

  // Helper method to calculate SLA-based due date using working days
  calculateSLADueDate(status) {
    const slaHours = config.slaHours[status] || 24;
    
    // Convert hours to working days (assuming 24 hours = 1 working day)
    const workingDays = Math.ceil(slaHours / 24);
    
    // Calculate due date by adding working days (skips Sundays and holidays)
    const today = new Date();
    const dueDate = addWorkingDays(today, workingDays);
    
    // Set to end of day
    dueDate.setHours(23, 59, 59, 999);

    return dueDate.toISOString();
  }

  // Schedule dispatch and start production (NEW -> STORE1)
  async scheduleDispatchAndStartProduction(poId, dispatchDate, calculatedDueDates, currentUserEmail) {
    try {
      const po = await poService.getPOById(poId);
      
      if (!po) {
        throw new Error(`PO with ID ${poId} not found`);
      }
      
      if (po.AssignedTo !== currentUserEmail) {
        throw new Error('You are not authorized to perform this action on this task.');
      }
      
      if (po.Status !== config.statusCodes.NEW) {
        throw new Error('Dispatch can only be scheduled for NEW orders');
      }
      
      const currentStatus = po.Status;
      const nextStatus = config.statusCodes.STORE1;
      const nextAssignee = await this.getStoreManager();
      
      // Format dispatch date
      const dispatchDateTime = new Date(dispatchDate).toISOString();
      
      // Calculate due date for Store 1 (first stage)
      const store1DueDate = calculatedDueDates.Store1DueDate;
      
      // Update PO with dispatch date, all calculated due dates, and move to STORE1
      const updatedPO = await poService.updatePO(poId, {
        Status: nextStatus,
        AssignedTo: nextAssignee,
        DueDate: store1DueDate, // Current stage due date
        DispatchDate: dispatchDateTime,
        // Stage-specific due dates for backward planning
        Store1DueDate: calculatedDueDates.Store1DueDate,
        CableProductionDueDate: calculatedDueDates.CableProductionDueDate,
        Store2DueDate: calculatedDueDates.Store2DueDate,
        MouldingDueDate: calculatedDueDates.MouldingDueDate,
        FGSectionDueDate: calculatedDueDates.FGSectionDueDate
      });
      
      // Log the action
      await this.logAction(
        poId,
        currentStatus,
        nextStatus,
        currentUserEmail,
        'SCHEDULE_DISPATCH',
        `Dispatch scheduled for ${new Date(dispatchDate).toLocaleDateString()} - Production started`
      );
      
      // Generate unique DispatchUniqueId
      const generateDispatchUniqueId = () => {
        const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 3-digit random number
        return `DISP-${timestamp}-${randomNum}`;
      };
      
      const dispatchUniqueId = generateDispatchUniqueId();
      
      // Create a dispatch record in Dispatches sheet
      // Note: Only store DispatchDate - stage due dates are calculated on-the-fly in the UI
      try {
        await db.insertTableRow('dispatches', {
          DispatchUniqueId: dispatchUniqueId,
          UniqueId: po.UniqueId,
          ClientCode: po.ClientCode,
          ProductCode: po.ProductCode,
          ProductName: po.Description || po.ProductCode,
          BatchNumber: po.BatchNumber || '',
          BatchSize: po.BatchSize || po.Quantity,
          DispatchDate: new Date(dispatchDate).toLocaleDateString('en-GB'), // DD/MM/YYYY format
          DateEntry: new Date().toLocaleDateString('en-GB'), // Date when data entered in Dispatches sheet
          CreatedAt: new Date().toISOString(),
          Dispatched: 'No'
        });
      } catch (dispatchError) {
        console.error('Error creating dispatch record:', dispatchError);
        // Don't fail the main operation if dispatch record creation fails
      }
      
      return updatedPO;
    } catch (error) {
      console.error(`Error scheduling dispatch for PO ${poId}:`, error);
      throw error;
    }
  }

  // Get all tasks that are overdue
  async getOverdueTasks() {
    try {
      const pos = await db.getTableRows(db.getTableName(config.sheets.poMaster));
      const now = new Date();
      
      return pos.filter(po => {
        // Skip delivered POs
        if (po.Status === config.statusCodes.DELIVERED) {
          return false;
        }
        
        // Check if dueDate has passed
        const dueDate = new Date(po.DueDate);
        return dueDate < now;
      });
    } catch (error) {
      console.error('Error fetching overdue tasks:', error);
      throw error;
    }
  }
  
  // Get audit log for a PO
  async getPOAuditLog(poId) {
    try {
      const auditLog = await db.getTableRows(db.getTableName(config.sheets.auditLog));
      return auditLog.filter(log => log.POId === poId);
    } catch (error) {
      console.error(`Error fetching audit log for PO ${poId}:`, error);
      throw error;
    }
  }
  
  // Helper methods to get assignees by role
  // In a real application, these would query the Users sheet based on role
  async getStoreManager() {
    return 'store.manager@reyanshelectronics.com';
  }
  
  async getCableProductionSupervisor() {
    return 'cable.supervisor@reyanshelectronics.com';
  }
  
  async getMouldingProductionSupervisor() {
    return 'moulding.supervisor@reyanshelectronics.com';
  }
  
  async getFGSectionManager() {
    return 'fg.manager@reyanshelectronics.com';
  }
  
  async getDispatchManager() {
    return 'dispatch.manager@reyanshelectronics.com';
  }
  
  async getQCManager() {
    return 'qc.manager@reyanshelectronics.com';
  }

  // Enhanced logging method
  async logAction(poId, fromStatus, toStatus, userEmail, actionType, reason = '') {
    try {
      const logEntry = {
        POId: poId,
        action: actionType,
        fromStatus: fromStatus,
        toStatus: toStatus,
        user: userEmail,
        timestamp: new Date().toISOString(),
        reason: reason,
        description: this.getActionDescription(actionType, fromStatus, toStatus, reason)
      };

      await db.insertTableRow(db.getTableName(config.sheets.auditLog), logEntry);
    } catch (error) {
      console.error('Error logging action:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  getActionDescription(actionType, fromStatus, toStatus, reason) {
    switch (actionType) {
      case 'ADVANCE':
        return `Task advanced from ${fromStatus} to ${toStatus}`;
      case 'REJECT':
        return `Task rejected from ${fromStatus} to ${toStatus}. Reason: ${reason}`;
      default:
        return `Action ${actionType} performed on task`;
    }
  }
}

export default new FlowService(); 