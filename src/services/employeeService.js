import sheetService from './sheetService';
import config from '../config/config';
import cvService from './cvService';
import {
  createDefaultEmployeeProfile,
  createDefaultDashboardSummary,
  isNewEmployee,
  sanitizeEmployeeData,
  needsDataInitialization,
  createSampleTasks,
  createWelcomeNotifications,
  handleEmployeeError,
  createSuccessResponse
} from '../utils/employeeDataUtils';

class EmployeeService {
  constructor() {
    this.employeesSheetName = config.sheets.employees;

    this.performanceSheetName = config.sheets.performance;
    this.attendanceSheetName = config.sheets.attendance;
    this.employeeTasksSheetName = config.sheets.employeeTasks;
    this.notificationsSheetName = config.sheets.notifications;
  }

  // Get all employees from the Employees sheet
  async getAllEmployees(forceRefresh = false) {
    try {
      const data = await sheetService.getSheetData(this.employeesSheetName, forceRefresh);
      return data || [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  // Get employee by employee code
  async getEmployeeByCode(employeeCode) {
    try {
      const employees = await this.getAllEmployees();
      return employees.find(emp => emp.EmployeeCode === employeeCode);
    } catch (error) {
      console.error('Error fetching employee by code:', error);
      throw error;
    }
  }

  // Get employee profile with additional details
  async getEmployeeProfile(employeeCode) {
    try {
      // Input validation
      if (!employeeCode || typeof employeeCode !== 'string') {
        throw new Error('Invalid employee code provided');
      }

      const employee = await this.getEmployeeByCode(employeeCode);
      
      // Create default profile structure
      const defaultProfile = {
        EmployeeCode: employeeCode,
        EmployeeName: employee?.EmployeeName || '',
        Email: employee?.Email || '',
        Phone: employee?.Phone || '',
        Department: employee?.Department || '',
        Designation: employee?.Designation || '',
        Status: employee?.Status || 'Active',
        EmployeeType: employee?.EmployeeType || 'Full-time',
        JoiningDate: employee?.JoiningDate || '',
        DateOfBirth: employee?.DateOfBirth || '',
        Address: employee?.Address || '',
        ReportingManager: employee?.ReportingManager || '',
        SalaryGrade: employee?.SalaryGrade || '',
        HighestQualification: employee?.HighestQualification || '',
        University: employee?.University || '',
        GraduationYear: employee?.GraduationYear || '',
        Specialization: employee?.Specialization || '',
        Experience: employee?.Experience || '',
        Skills: employee?.Skills || '',
        Certifications: employee?.Certifications || '',
        UpiId: employee?.UpiId || '',
        BankName: employee?.BankName || '',
        AccountNumber: employee?.AccountNumber || '',
        IfscCode: employee?.IfscCode || '',
        BankBranch: employee?.BankBranch || '',
        AccountHolderName: employee?.AccountHolderName || '',
        EmployeeId: employee?.EmployeeId || employeeCode,
        CreatedAt: employee?.CreatedAt || new Date().toISOString(),
        UpdatedAt: employee?.UpdatedAt || new Date().toISOString(),
        attendance: [],
        performance: [],
        tasks: [],
        stats: {
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          attendanceRate: 0,
          performanceScore: 0
        }
      };

      if (!employee) {
        console.warn(`No employee found with code: ${employeeCode}`);
        return defaultProfile;
      }

      // Get additional data for the employee with error handling for each
      const [attendance, performance, tasks] = await Promise.allSettled([
        this.getEmployeeAttendance(employeeCode),
        this.getEmployeePerformance(employeeCode),
        this.getEmployeeTasks(employeeCode)
      ]);

      // Safely extract results with fallbacks
      const attendanceData = attendance.status === 'fulfilled' ? attendance.value : [];
      const performanceData = performance.status === 'fulfilled' ? performance.value : [];
      const tasksData = tasks.status === 'fulfilled' ? tasks.value : [];

      // Log any failures for debugging
      if (attendance.status === 'rejected') console.warn('Failed to load attendance:', attendance.reason);
      if (performance.status === 'rejected') console.warn('Failed to load performance:', performance.reason);
      if (tasks.status === 'rejected') console.warn('Failed to load tasks:', tasks.reason);

      return {
        ...defaultProfile,
        ...employee, // Override defaults with actual employee data
        attendance: attendanceData || [],
        performance: performanceData || [],
        tasks: tasksData || [],
        stats: {
          totalTasks: (tasksData || []).length,
          completedTasks: (tasksData || []).filter(task => task?.Status === 'Completed').length,
          pendingTasks: (tasksData || []).filter(task => task?.Status === 'Pending').length,
          attendanceRate: this.calculateAttendanceRate(attendanceData || []),
          performanceScore: this.calculatePerformanceScore(performanceData || [])
        }
      };
    } catch (error) {
      console.error('Error fetching employee profile:', error);
      
      // Return a safe default profile structure on error
      return {
        EmployeeCode: employeeCode || 'UNKNOWN',
        EmployeeName: '',
        Email: '',
        Phone: '',
        Department: '',
        Designation: '',
        Status: 'Active',
        EmployeeType: 'Full-time',
        JoiningDate: '',
        DateOfBirth: '',
        Address: '',
        ReportingManager: '',
        SalaryGrade: '',
        HighestQualification: '',
        University: '',
        GraduationYear: '',
        Specialization: '',
        Experience: '',
        Skills: '',
        Certifications: '',
        UpiId: '',
        BankName: '',
        AccountNumber: '',
        IfscCode: '',
        BankBranch: '',
        AccountHolderName: '',
        EmployeeId: employeeCode || 'UNKNOWN',
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
        attendance: [],
        performance: [],
        tasks: [],
        stats: {
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          attendanceRate: 0,
          performanceScore: 0
        },
        error: error.message
      };
    }
  }

  // Get employee attendance data
  async getEmployeeAttendance(employeeCode, days = 30) {
    try {
      const data = await sheetService.getSheetData(this.attendanceSheetName);
      const employeeAttendance = data.filter(record => 
        record.EmployeeCode === employeeCode
      );

      // Sort by date (most recent first)
      return employeeAttendance.sort((a, b) => 
        new Date(b.Date) - new Date(a.Date)
      ).slice(0, days);
    } catch (error) {
      console.error('Error fetching employee attendance:', error);
      return [];
    }
  }

  // Get employee performance data
  async getEmployeePerformance(employeeCode) {
    try {
      const data = await sheetService.getSheetData(this.performanceSheetName);
      return data.filter(record => record.EmployeeCode === employeeCode);
    } catch (error) {
      console.error('Error fetching employee performance:', error);
      return [];
    }
  }

  // Get employee tasks
  async getEmployeeTasks(employeeCode) {
    try {
      const data = await sheetService.getSheetData(this.employeeTasksSheetName);
      return data.filter(task => task.AssignedTo === employeeCode);
    } catch (error) {
      console.error('Error fetching employee tasks:', error);
      return [];
    }
  }

  // Get employee notifications
  async getEmployeeNotifications(employeeCode) {
    try {
      const data = await sheetService.getSheetData(this.notificationsSheetName);
      return data.filter(notification => 
        notification.EmployeeCode === employeeCode && 
        notification.Read !== 'true'
      ).sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
    } catch (error) {
      console.error('Error fetching employee notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      const data = await sheetService.getSheetData(this.notificationsSheetName);
      const notificationIndex = data.findIndex(n => n.Id === notificationId);
      
      if (notificationIndex !== -1) {
        const updatedNotification = {
          ...data[notificationIndex],
          Read: 'true',
          ReadAt: new Date().toISOString()
        };
        
        await sheetService.updateRow(
          this.notificationsSheetName, 
          notificationIndex + 2, // +2 for header and 0-based index
          updatedNotification
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Update task status
  async updateTaskStatus(taskId, status, notes = '') {
    try {
      const data = await sheetService.getSheetData(this.employeeTasksSheetName);
      const taskIndex = data.findIndex(task => task.TaskId === taskId);
      
      if (taskIndex !== -1) {
        const updatedTask = {
          ...data[taskIndex],
          Status: status,
          Notes: notes,
          UpdatedAt: new Date().toISOString()
        };

        await sheetService.updateRow(
          this.employeeTasksSheetName,
          taskIndex + 2,
          updatedTask
        );

        return updatedTask;
      } else {
        throw new Error('Task not found');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  // Get employee dashboard summary
  async getDashboardSummary(employeeCode) {
    try {
      // Input validation
      if (!employeeCode || typeof employeeCode !== 'string') {
        throw new Error('Invalid employee code provided');
      }

      // Use Promise.allSettled for better error handling
      const [tasks, attendance, notifications] = await Promise.allSettled([
        this.getEmployeeTasks(employeeCode),
        this.getEmployeeAttendance(employeeCode, 7),
        this.getEmployeeNotifications(employeeCode)
      ]);

      // Safely extract results with fallbacks
      const tasksData = tasks.status === 'fulfilled' ? (tasks.value || []) : [];
      const attendanceData = attendance.status === 'fulfilled' ? (attendance.value || []) : [];
      const notificationsData = notifications.status === 'fulfilled' ? (notifications.value || []) : [];

      // Log any failures for debugging
      if (tasks.status === 'rejected') console.warn('Failed to load dashboard tasks:', tasks.reason);
      if (attendance.status === 'rejected') console.warn('Failed to load dashboard attendance:', attendance.reason);
      if (notifications.status === 'rejected') console.warn('Failed to load dashboard notifications:', notifications.reason);

      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendanceData.find(record => 
        record && record.Date === today
      );

      return {
        tasks: {
          total: tasksData.length,
          completed: tasksData.filter(task => task?.Status === 'Completed').length,
          pending: tasksData.filter(task => task?.Status === 'Pending').length,
          inProgress: tasksData.filter(task => task?.Status === 'In Progress').length
        },
        attendance: {
          isCheckedIn: todayAttendance?.Status === 'Clocked In' || todayAttendance?.Status === 'Present',
          weeklyHours: parseFloat(this.calculateWeeklyHours(attendanceData)) || 0,
          attendanceRate: this.calculateAttendanceRate(attendanceData)
        },
        notifications: {
          unread: notificationsData.length,
          recent: notificationsData.slice(0, 5)
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      
      // Return safe default dashboard summary
      return {
        tasks: {
          total: 0,
          completed: 0,
          pending: 0,
          inProgress: 0
        },
        attendance: {
          isCheckedIn: false,
          weeklyHours: 0,
          attendanceRate: 0
        },
        notifications: {
          unread: 0,
          recent: []
        },
        error: error.message
      };
    }
  }

  // Helper functions with improved error handling
  calculateAttendanceRate(attendance) {
    if (!attendance || !Array.isArray(attendance) || attendance.length === 0) {
      return 0;
    }
    
    try {
      const validRecords = attendance.filter(record => record && record.Status);
      if (validRecords.length === 0) return 0;
      
      const presentDays = validRecords.filter(record => 
        record.Status && record.Status.toLowerCase() !== 'absent'
      ).length;
      
      return Math.round((presentDays / validRecords.length) * 100);
    } catch (error) {
      console.error('Error calculating attendance rate:', error);
      return 0;
    }
  }

  calculatePerformanceScore(performance) {
    if (!performance || !Array.isArray(performance) || performance.length === 0) {
      return 0;
    }
    
    try {
      const validScores = performance
        .map(record => parseFloat(record?.Score || 0))
        .filter(score => !isNaN(score) && score > 0);
      
      if (validScores.length === 0) return 0;
      
      const totalScore = validScores.reduce((sum, score) => sum + score, 0);
      return Math.round(totalScore / validScores.length);
    } catch (error) {
      console.error('Error calculating performance score:', error);
      return 0;
    }
  }

  calculateWeeklyHours(attendance) {
    if (!attendance || !Array.isArray(attendance)) {
      return "0.0";
    }
    
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const weeklyRecords = attendance.filter(record => {
        if (!record || !record.Date) return false;
        
        try {
          const recordDate = new Date(record.Date);
          return !isNaN(recordDate.getTime()) && recordDate >= weekAgo;
        } catch (error) {
          return false;
        }
      });

      const totalHours = weeklyRecords.reduce((total, record) => {
        const hours = parseFloat(record?.WorkingHours || 0);
        return total + (isNaN(hours) ? 0 : hours);
      }, 0);

      return totalHours.toFixed(1);
    } catch (error) {
      console.error('Error calculating weekly hours:', error);
      return "0.0";
    }
  }

  // Get performance metrics for charts
  async getPerformanceMetrics(employeeCode) {
    try {
      const data = await sheetService.getSheetData(this.performanceSheetName);
      const employeePerformance = data.filter(record => 
        record.EmployeeCode === employeeCode
      );

      return employeePerformance
        .sort((a, b) => new Date(a.Date) - new Date(b.Date))
        .map(record => ({
          date: record.Date,
          score: parseFloat(record.Score) || 0,
          metric: record.Metric,
          target: parseFloat(record.Target) || 0
        }));
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return [];
    }
  }

  // Create new employee
  async createEmployee(employeeData) {
    try {
      // Sanitize and validate employee data
      const sanitizedData = sanitizeEmployeeData(employeeData);
      
      // Create the employee record
      await sheetService.appendRow(this.employeesSheetName, sanitizedData);
      
      // Initialize sample data for new employee
      await this.initializeNewEmployeeData(sanitizedData.EmployeeCode);
      
      return createSuccessResponse(sanitizedData, 'Employee created successfully');
    } catch (error) {
      console.error('Error creating employee:', error);
      return handleEmployeeError(error, 'create employee');
    }
  }

  // Initialize data for new employee
  async initializeNewEmployeeData(employeeCode) {
    try {
      // Create sample tasks for new employee
      const sampleTasks = createSampleTasks(employeeCode);
      for (const task of sampleTasks) {
        await sheetService.appendRow(this.employeeTasksSheetName, task);
      }

      // Create welcome notifications
      const welcomeNotifications = createWelcomeNotifications(employeeCode);
      for (const notification of welcomeNotifications) {
        await sheetService.appendRow(this.notificationsSheetName, notification);
      }

      // Create initial attendance record for today (if not weekend)
      const today = new Date();
      const dayOfWeek = today.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        const todayDate = today.toISOString().split('T')[0];
        const initialAttendance = {
          EmployeeCode: employeeCode,
          Date: todayDate,
          Status: 'Present',
          ClockIn: '',
          ClockOut: '',
          WorkingHours: '',
          Notes: 'Initial record created',
          CreatedAt: new Date().toISOString()
        };
        await sheetService.appendRow(this.attendanceSheetName, initialAttendance);
      }

      return true;
    } catch (error) {
      console.error('Error initializing new employee data:', error);
      // Don't throw here as the employee is already created
      return false;
    }
  }

  // Update existing employee
  async updateEmployee(employeeCode, employeeData) {
    try {
      const employees = await this.getAllEmployees();
      const employeeIndex = employees.findIndex(emp => emp.EmployeeCode === employeeCode);
      
      if (employeeIndex === -1) {
        throw new Error('Employee not found');
      }

      const updatedEmployee = {
        ...employees[employeeIndex],
        ...employeeData,
        UpdatedAt: new Date().toISOString()
      };

      await sheetService.updateRow(
        this.employeesSheetName,
        employeeIndex + 2, // +2 for header and 0-based index
        updatedEmployee
      );

      return updatedEmployee;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  // Delete employee
  async deleteEmployee(employeeCode) {
    try {
      const employees = await this.getAllEmployees();
      const employeeIndex = employees.findIndex(emp => emp.EmployeeCode === employeeCode);
      
      if (employeeIndex === -1) {
        throw new Error('Employee not found');
      }

      await sheetService.deleteRow(this.employeesSheetName, employeeIndex + 2);
      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  // Search employees
  async searchEmployees(searchTerm) {
    try {
      const employees = await this.getAllEmployees();
      
      if (!searchTerm) return employees;

      const lowerSearchTerm = searchTerm.toLowerCase();
      return employees.filter(emp =>
        emp.EmployeeName?.toLowerCase().includes(lowerSearchTerm) ||
        emp.EmployeeCode?.toLowerCase().includes(lowerSearchTerm) ||
        emp.Department?.toLowerCase().includes(lowerSearchTerm) ||
        emp.Designation?.toLowerCase().includes(lowerSearchTerm) ||
        emp.Email?.toLowerCase().includes(lowerSearchTerm)
      );
    } catch (error) {
      console.error('Error searching employees:', error);
      throw error;
    }
  }

  // Get employees by department
  async getEmployeesByDepartment(department) {
    try {
      const employees = await this.getAllEmployees();
      return employees.filter(emp => emp.Department === department);
    } catch (error) {
      console.error('Error fetching employees by department:', error);
      throw error;
    }
  }

  // Get employees by status
  async getEmployeesByStatus(status) {
    try {
      const employees = await this.getAllEmployees();
      return employees.filter(emp => emp.Status === status);
    } catch (error) {
      console.error('Error fetching employees by status:', error);
      throw error;
    }
  }

  // Get employee statistics
  async getEmployeeStatistics() {
    try {
      const employees = await this.getAllEmployees();
      
      const stats = {
        total: employees.length,
        active: employees.filter(emp => emp.Status === 'Active').length,
        inactive: employees.filter(emp => emp.Status === 'Inactive').length,
        onLeave: employees.filter(emp => emp.Status === 'On Leave').length,
        byDepartment: {},
        byEmployeeType: {},
        averageExperience: 0
      };

      // Group by department
      employees.forEach(emp => {
        const dept = emp.Department || 'Unknown';
        stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1;
      });

      // Group by employee type
      employees.forEach(emp => {
        const type = emp.EmployeeType || 'Unknown';
        stats.byEmployeeType[type] = (stats.byEmployeeType[type] || 0) + 1;
      });

      // Calculate average experience
      const experienceValues = employees
        .map(emp => {
          const exp = emp.Experience || '';
          const match = exp.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(exp => exp > 0);

      if (experienceValues.length > 0) {
        stats.averageExperience = experienceValues.reduce((sum, exp) => sum + exp, 0) / experienceValues.length;
      }

      return stats;
    } catch (error) {
      console.error('Error fetching employee statistics:', error);
      throw error;
    }
  }

  // Task CRUD operations
  async createTask(taskData) {
    try {
      const now = new Date().toISOString();
      const newTask = {
        ...taskData,
        CreatedAt: now,
        UpdatedAt: now
      };

      await sheetService.appendRow(this.employeeTasksSheetName, newTask);
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async updateTask(taskId, taskData) {
    try {
      const tasks = await sheetService.getSheetData(this.employeeTasksSheetName);
      const taskIndex = tasks.findIndex(task => task.TaskId === taskId);
      
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      const updatedTask = {
        ...tasks[taskIndex],
        ...taskData,
        UpdatedAt: new Date().toISOString()
      };

      await sheetService.updateRow(
        this.employeeTasksSheetName,
        taskIndex + 2, // +2 for header and 0-based index
        updatedTask
      );

      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(taskId) {
    try {
      const tasks = await sheetService.getSheetData(this.employeeTasksSheetName);
      const taskIndex = tasks.findIndex(task => task.TaskId === taskId);
      
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      await sheetService.deleteRow(this.employeeTasksSheetName, taskIndex + 2);
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  // Performance CRUD operations
  async createPerformanceRecord(performanceData) {
    try {
      const now = new Date().toISOString();
      const newRecord = {
        ...performanceData,
        CreatedAt: now
      };

      await sheetService.appendRow(this.performanceSheetName, newRecord);
      return newRecord;
    } catch (error) {
      console.error('Error creating performance record:', error);
      throw error;
    }
  }

  async updatePerformanceRecord(recordId, performanceData) {
    try {
      const records = await sheetService.getSheetData(this.performanceSheetName);
      const recordIndex = records.findIndex(record => 
        record.EmployeeCode === performanceData.EmployeeCode && 
        record.Date === performanceData.Date &&
        record.Metric === performanceData.Metric
      );
      
      if (recordIndex === -1) {
        throw new Error('Performance record not found');
      }

      const updatedRecord = {
        ...records[recordIndex],
        ...performanceData
      };

      await sheetService.updateRow(
        this.performanceSheetName,
        recordIndex + 2,
        updatedRecord
      );

      return updatedRecord;
    } catch (error) {
      console.error('Error updating performance record:', error);
      throw error;
    }
  }

  // Attendance CRUD operations
  async createAttendanceRecord(attendanceData) {
    try {
      const now = new Date().toISOString();
      const newRecord = {
        ...attendanceData,
        CreatedAt: now
      };

      await sheetService.appendRow(this.attendanceSheetName, newRecord);
      return newRecord;
    } catch (error) {
      console.error('Error creating attendance record:', error);
      throw error;
    }
  }

  async updateAttendanceRecord(employeeCode, date, attendanceData) {
    try {
      const records = await sheetService.getSheetData(this.attendanceSheetName);
      const recordIndex = records.findIndex(record => 
        record.EmployeeCode === employeeCode && record.Date === date
      );
      
      if (recordIndex === -1) {
        throw new Error('Attendance record not found');
      }

      const updatedRecord = {
        ...records[recordIndex],
        ...attendanceData
      };

      await sheetService.updateRow(
        this.attendanceSheetName,
        recordIndex + 2,
        updatedRecord
      );

      return updatedRecord;
    } catch (error) {
      console.error('Error updating attendance record:', error);
      throw error;
    }
  }

  // Notifications CRUD operations
  async createNotification(notificationData) {
    try {
      const now = new Date().toISOString();
      const newNotification = {
        ...notificationData,
        Id: `NOTIF${Date.now()}`,
        Read: false,
        CreatedAt: now
      };

      await sheetService.appendRow(this.notificationsSheetName, newNotification);
      return newNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      const notifications = await sheetService.getSheetData(this.notificationsSheetName);
      const notificationIndex = notifications.findIndex(notif => notif.Id === notificationId);
      
      if (notificationIndex === -1) {
        throw new Error('Notification not found');
      }

      const updatedNotification = {
        ...notifications[notificationIndex],
        Read: true,
        ReadAt: new Date().toISOString()
      };

      await sheetService.updateRow(
        this.notificationsSheetName,
        notificationIndex + 2,
        updatedNotification
      );

      return updatedNotification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Get today's attendance for quick check
  async getTodayAttendance(employeeCode) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await sheetService.getSheetData(this.attendanceSheetName);
      return data.find(record => record.EmployeeCode === employeeCode && record.Date === today);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      return null;
    }
  }

  // Download employee CV
  async downloadEmployeeCV(employeeCode, template = 'default') {
    try {
      // Get employee profile data
      const employeeProfile = await this.getEmployeeProfile(employeeCode);
      
      if (!employeeProfile || !employeeProfile.EmployeeCode) {
        throw new Error('Employee not found');
      }

      // Generate and download CV
      const filename = `${employeeProfile.EmployeeName || employeeProfile.EmployeeCode}_CV_${new Date().toISOString().split('T')[0]}.pdf`;
      cvService.downloadCV(employeeProfile, filename);
      
      return {
        success: true,
        message: 'CV downloaded successfully',
        filename: filename
      };
    } catch (error) {
      console.error('Error downloading employee CV:', error);
      throw new Error('Failed to download CV: ' + error.message);
    }
  }

  // Generate employee CV blob for preview
  async generateEmployeeCVBlob(employeeCode, template = 'default') {
    try {
      // Get employee profile data
      const employeeProfile = await this.getEmployeeProfile(employeeCode);
      
      if (!employeeProfile || !employeeProfile.EmployeeCode) {
        throw new Error('Employee not found');
      }

      // Generate CV blob
      const blob = cvService.generateCVBlob(employeeProfile);
      
      return {
        success: true,
        blob: blob,
        filename: `${employeeProfile.EmployeeName || employeeProfile.EmployeeCode}_CV_${new Date().toISOString().split('T')[0]}.pdf`
      };
    } catch (error) {
      console.error('Error generating employee CV blob:', error);
      throw new Error('Failed to generate CV: ' + error.message);
    }
  }
}

export default new EmployeeService();
