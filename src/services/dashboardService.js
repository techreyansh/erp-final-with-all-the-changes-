import sheetService from './sheetService';
import config from '../config/config';

class DashboardService {
  // Get summary metrics for the CEO dashboard
  async getSummaryMetrics() {
    try {
      const pos = await sheetService.getSheetData(config.sheets.poMaster);
      const now = new Date();
      
      // Count POs by status
      const countByStatus = {};
      Object.values(config.statusCodes).forEach(status => {
        countByStatus[status] = 0;
      });
      
      // Count on-track and off-track POs
      let onTrackCount = 0;
      let offTrackCount = 0;
      let deliveredCount = 0;
      
      pos.forEach(po => {
        // Count by status
        countByStatus[po.Status] = (countByStatus[po.Status] || 0) + 1;
        
        // Count delivered
        if (po.Status === config.statusCodes.DELIVERED) {
          deliveredCount++;
          return;
        }
        
        // Check if on-track or off-track
        if (po.DueDate) {
          const dueDate = new Date(po.DueDate);
          if (dueDate < now) {
            offTrackCount++;
          } else {
            onTrackCount++;
          }
        }
      });
      
      return {
        countByStatus,
        onTrackCount,
        offTrackCount,
        deliveredCount,
        totalCount: pos.length
      };
    } catch (error) {
      console.error('Error fetching summary metrics:', error);
      throw error;
    }
  }
  
  // Get employee efficiency metrics
  async getEmployeeEfficiency() {
    try {
      const auditLog = await sheetService.getSheetData(config.sheets.auditLog);
      const now = new Date();
      
      // Group by user and calculate average time per task
      const userStats = {};
      
      auditLog.forEach(log => {
        const userId = log.UserId;
        if (!userStats[userId]) {
          userStats[userId] = {
            taskCount: 0,
            totalHours: 0
          };
        }
        
        // Skip entries without timestamps
        if (!log.Timestamp) return;
        
        userStats[userId].taskCount++;
        
        // Calculate time spent if there's a previous and next status
        if (log.PreviousStatus && log.NewStatus) {
          // Find the timestamp of when the task was assigned to this user
          const assignmentLog = auditLog.find(l => 
            l.POId === log.POId && 
            l.NewStatus === log.PreviousStatus
          );
          
          if (assignmentLog && assignmentLog.Timestamp) {
            const startTime = new Date(assignmentLog.Timestamp);
            const endTime = new Date(log.Timestamp);
            const hoursDiff = (endTime - startTime) / (1000 * 60 * 60);
            
            userStats[userId].totalHours += hoursDiff;
          }
        }
      });
      
      // Calculate average time per task
      Object.keys(userStats).forEach(userId => {
        const stats = userStats[userId];
        stats.averageHoursPerTask = stats.taskCount > 0 ? stats.totalHours / stats.taskCount : 0;
        
        // TODO: In a real implementation, compare with standard hours
        // For now, use a placeholder of 8 hours per task
        const standardHours = 8;
        stats.efficiency = stats.averageHoursPerTask > 0 ? 
          (standardHours / stats.averageHoursPerTask) * 100 : 0;
      });
      
      return userStats;
    } catch (error) {
      console.error('Error fetching employee efficiency metrics:', error);
      throw error;
    }
  }
  
  // Get cost metrics per PO
  async getCostMetrics() {
    try {
      const pos = await sheetService.getSheetData(config.sheets.poMaster);
      
      // TODO: In a real implementation, fetch cost data from inventory, labor rates, etc.
      // For now, return placeholder data
      return pos.map(po => {
        // Generate random costs
        const bomCost = Math.random() * 1000 + 500;
        const laborCost = Math.random() * 500 + 200;
        const fgCost = Math.random() * 300 + 100;
        const totalCost = bomCost + laborCost + fgCost;
        
        return {
          POId: po.POId,
          ClientCode: po.ClientCode,
          ProductCode: po.ProductCode,
          Quantity: po.Quantity,
          BOMCost: bomCost.toFixed(2),
          LaborCost: laborCost.toFixed(2),
          FGCost: fgCost.toFixed(2),
          TotalCost: totalCost.toFixed(2),
          CostPerUnit: (totalCost / po.Quantity).toFixed(2)
        };
      });
    } catch (error) {
      console.error('Error fetching cost metrics:', error);
      throw error;
    }
  }

  // Get KPIs like inventory turns, utilization, and rejection rate
  async getKPIs() {
    try {
      // TODO: In a real implementation, calculate these based on actual data
      // For now, return placeholder data
      return {
        inventoryTurns: (Math.random() * 5 + 3).toFixed(2),
        utilizationPercentage: (Math.random() * 30 + 70).toFixed(2),
        rejectionRate: (Math.random() * 5).toFixed(2)
      };
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      throw error;
    }
  }

  // Get dashboard tasks for CEO and Process Coordinator
  async getDashboardTasks(userEmail, userRole) {
    try {
      const tasks = [];
      
      if (userRole === 'CEO' || userRole === 'Process Coordinator') {
        // Get POs that need attention (overdue, high priority, etc.)
        const pos = await sheetService.getSheetData(config.sheets.poMaster);
        const now = new Date();
        
        const urgentPOs = pos.filter(po => {
          if (po.Status === config.statusCodes.DELIVERED) return false;
          
          // Check if overdue
          if (po.DueDate) {
            const dueDate = new Date(po.DueDate);
            if (dueDate < now) return true;
          }
          
          // Check if high priority
          if (po.Priority === 'High') return true;
          
          // Check if stuck in a stage for too long
          if (po.CreatedAt) {
            const createdDate = new Date(po.CreatedAt);
            const daysDiff = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
            if (daysDiff > 7) return true; // Stuck for more than 7 days
          }
          
          return false;
        });
        
        tasks.push(...urgentPOs.map(po => ({
          ...po,
          TaskType: 'PO',
          TaskId: po.POId,
          Priority: po.Priority || 'Medium',
          DueDate: po.DueDate || '',
          CreatedAt: po.CreatedAt || '',
          Status: po.Status || 'NEW'
        })));
      }
      
      return tasks;
    } catch (error) {
      console.error(`Error fetching dashboard tasks for user ${userEmail}:`, error);
      return [];
    }
  }
}

export default new DashboardService(); 