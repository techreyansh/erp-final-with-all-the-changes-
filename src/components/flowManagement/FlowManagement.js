import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Tabs,
  Tab,
  Button,
  Alert,
  Snackbar,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardContent,
  Chip,
  alpha,
  useTheme,
  Fade,
  IconButton,
  Badge,
  Fab,
  Zoom,
  Slide,
  Grow,
  CircularProgress,
  Skeleton,
  LinearProgress,
  Tooltip,
  Avatar,
  Stack,
  Divider,
  Collapse,
  styled,
  keyframes
} from "@mui/material";
import { 
  Refresh, 
  Timeline, 
  Assignment, 
  CheckCircle, 
  Error, 
  Schedule, 
  LocalShipping, 
  Inventory, 
  Build, 
  PrecisionManufacturing,
  Verified, 
  Add as AddIcon, 
  Settings as SettingsIcon,
  TrendingUp,
  TrendingDown,
  Speed,
  AutoAwesome,
  FilterList,
  Search,
  ViewModule,
  ViewList,
  MoreVert,
  Notifications,
  Dashboard,
  Analytics,
  PlayArrow,
  Pause,
  Stop,
  Update,
  CloudUpload
} from "@mui/icons-material";
import TaskList from "./TaskList";
import FlowVisualization from "./FlowVisualization";
import DispatchDateDialog from "./DispatchDateDialog";
import EditStageDateDialog from "./EditStageDateDialog";
import HolidayManagerDialog from "./HolidayManagerDialog";
import ReceivingDocumentsList from "./ReceivingDocumentsList";
import LoadingSpinner from "../common/LoadingSpinner";
import ErrorMessage from "../common/ErrorMessage";
import poService from "../../services/poService";
import flowService from "../../services/flowService";
import config from "../../config/config";
import sheetService from "../../services/sheetService";
import dispatchService from "../../services/dispatchService";
import { useAuth } from "../../context/AuthContext";
import { getNextStatus } from "../../utils/statusUtils";
import { subtractWorkingDays } from "../../utils/dateRestrictions";
import { getAllClients } from "../../services/clientService";
import { 
  parseStatusWithDate, 
  getStatusOnly, 
  getCompletionDate,
  getDueDate,
  formatCompletionDate,
  isCompletedStatus,
  markAsCompletedWithDate,
  updateStatus,
  updateDueDate,
  formatDateForStorage
} from "../../utils/statusDateUtils";

// Modern styled components with lighter colors
const ModernCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: theme.spacing(3),
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: theme.shadows[2],
  '&:hover': {
    transform: 'translateY(-4px) scale(1.01)',
    boxShadow: theme.shadows[8],
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    background: theme.palette.background.paper
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
    opacity: 0,
    transition: 'opacity 0.3s ease'
  },
  '&:hover::before': {
    opacity: 1
  }
}));

const AnimatedIcon = styled(Box)(({ theme }) => ({
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '0',
    height: '0',
    borderRadius: '50%',
    background: alpha(theme.palette.primary.main, 0.15),
    transform: 'translate(-50%, -50%)',
    transition: 'all 0.3s ease'
  },
  '&:hover::before': {
    width: '60px',
    height: '60px'
  }
}));

const PulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const ModernButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  textTransform: 'none',
  fontWeight: 600,
  padding: theme.spacing(1.5, 3),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  border: 'none',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.common.white, 0.3)}, transparent)`,
    transition: 'left 0.5s ease'
  },
  '&:hover::before': {
    left: '100%'
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
    background: theme.palette.primary.dark
  }
}));

// Function to check if previous stages are completed before allowing status updates
const checkPreviousStagesCompletedForUpdate = (dispatchRecord, currentStageName) => {
  // Define stage order
  const stageOrder = ['STORE1', 'CABLE_PRODUCTION', 'STORE2', 'MOULDING', 'FG_SECTION', 'DISPATCH'];
  const currentStageIndex = stageOrder.indexOf(currentStageName);
  
  if (currentStageIndex === -1) {
    return { allowed: true, reason: 'Unknown stage' }; // Allow for unknown stages
  }
  
  // Allow independent completion of stores - no strict sequential dependency
  // Only check for specific dependencies if needed
  if (currentStageName === 'STORE1') {
    // Store 1 can always be completed independently
    return { allowed: true, reason: 'Store 1 can be completed independently' };
  }
  
  if (currentStageName === 'CABLE_PRODUCTION') {
    // Cable Production can be completed independently
    return { allowed: true, reason: 'Cable Production can be completed independently' };
  }
  
  if (currentStageName === 'STORE2') {
    // Store 2 requires Cable Production to be completed first
    const cableProdStatus = dispatchRecord.cableProdStatus || 'NEW';
    const cableProdCompleted = getStatusOnly(cableProdStatus) === 'COMPLETED';
    
    if (!cableProdCompleted) {
      return { 
        allowed: false, 
        reason: '⚠️ Cannot complete Store 2: Cable Production must be completed first. Please complete Cable Production stage before proceeding.' 
      };
    }
    
    return { allowed: true, reason: 'Cable Production is completed, Store 2 can proceed' };
  }
  
  if (currentStageName === 'MOULDING') {
    // Moulding can be completed independently
    return { allowed: true, reason: 'Moulding can be completed independently' };
  }
  
  if (currentStageName === 'FG_SECTION') {
    // FG Section can be completed independently
    return { allowed: true, reason: 'FG Section can be completed independently' };
  }
  
  if (currentStageName === 'DISPATCH') {
    // Dispatch requires FG Section to be completed first
    const fgSectionStatus = dispatchRecord.fgSectionStatus || 'NEW';
    const fgSectionCompleted = getStatusOnly(fgSectionStatus) === 'COMPLETED';
    
    if (!fgSectionCompleted) {
      return { 
        allowed: false, 
        reason: '⚠️ Cannot complete Dispatch: FG Section must be completed first. Please complete FG Section stage before proceeding.' 
      };
    }
    
    return { allowed: true, reason: 'FG Section is completed, Dispatch can proceed' };
  }
  
  // Fallback - allow all stages to be completed independently
  return { allowed: true, reason: 'Stage can be completed independently' };
};

const FlowManagement = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [dispatches, setDispatches] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statsVisible, setStatsVisible] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [dispatchDateDialogOpen, setDispatchDateDialogOpen] = useState(false);
  const [pendingAdvanceTask, setPendingAdvanceTask] = useState(null);
  const [pendingAdvanceFile, setPendingAdvanceFile] = useState(null);
  const [editStageDateDialogOpen, setEditStageDateDialogOpen] = useState(false);
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [taskToEditDate, setTaskToEditDate] = useState(null);
  const [currentEditStage, setCurrentEditStage] = useState(null);
  const [updatingStatuses, setUpdatingStatuses] = useState(false);
  const [clients, setClients] = useState([]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const fetchTasks = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const allTasks = await poService.getAllPOs(forceRefresh);
      
      // Fetch data from Dispatches sheet for Complete O2D tab
      const dispatchesData = await sheetService.getSheetData("Dispatches");
      console.log('✅ Fetched from Dispatches sheet:', {
        count: dispatchesData?.length || 0,
        sample: dispatchesData?.[0] ? {
          DispatchUniqueId: dispatchesData[0].DispatchUniqueId,
          ClientCode: dispatchesData[0].ClientCode,
          ProductCode: dispatchesData[0].ProductCode
        } : null
      });
      
      // Fetch data from Clients sheet (includes Products column) for Complete O2D tab
      // The Clients sheet contains a Products column with product details for each client
      const clientsData = await getAllClients(forceRefresh);
      console.log('✅ Fetched from Clients sheet:', {
        count: clientsData?.length || 0,
        sample: clientsData?.[0] ? {
          clientCode: clientsData[0].clientCode,
          clientName: clientsData[0].clientName,
          productsCount: clientsData[0].products?.length || 0
        } : null
      });
      
      setClients(clientsData || []);
      
      // Set dispatches BEFORE logging so it's available
      setDispatches(dispatchesData || []);
      
      if (dispatchesData && dispatchesData.length > 0) {

        dispatchesData.forEach((dispatch, index) => {

        });
      } else {
        console.warn("⚠️ No dispatches data found in Dispatches sheet!");
      }
      
      if (allTasks && allTasks.length > 0) {

        allTasks.forEach((task, index) => {

        });
        
        // Check how many have NEW status
        const newTasks = allTasks.filter(t => t.Status === config.statusCodes.NEW);

      }

      setTasks(allTasks || []);
    } catch (error) {
      console.error("❌ Error fetching tasks:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      setError(error.message || "Failed to fetch tasks");
      setTasks([]);
      setDispatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTasks(true); // Force refresh to bypass cache
    setRefreshing(false);
  };

  // Auto refresh functionality
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchTasks(true); // Force refresh to get latest data
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  useEffect(() => {
    fetchTasks();
  }, [activeTab]);

  // Refresh when page becomes visible (user navigates back from Cable Production Planning)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh tasks when page becomes visible
        fetchTasks(true);
      }
    };

    // Listen for visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for custom event when production plan is created
    const handlePlanCreated = () => {
      fetchTasks(true);
    };
    
    window.addEventListener('productionPlanCreated', handlePlanCreated);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('productionPlanCreated', handlePlanCreated);
    };
  }, []);

  const handleAdvanceTask = async (task, file) => {
    try {
      // Check if task is in NEW status - Schedule Dispatch first
      if (task.Status === 'NEW' || task.Status === config.statusCodes.NEW) {
        // Show dispatch date dialog for backward planning before starting production
        setPendingAdvanceTask(task);
        setPendingAdvanceFile(file);
        setDispatchDateDialogOpen(true);
        return;
      }

      // Otherwise, proceed with normal advancement
      await advanceTaskWithoutDispatchDate(task, file);
    } catch (error) {
      console.error("Error advancing task:", error);
      setError(error.message || "Failed to advance task");
      setLoading(false);
    }
  };

  const advanceTaskWithoutDispatchDate = async (task, file) => {
    try {
      setLoading(true);
      setError(null);

      // Upload file if exists
      if (file) {
        await poService.uploadPODocument(task.POId, file);
      }

      // Advance the task
      const updatedTask = await flowService.advanceTask(task.POId, user?.email || '');

      // Show success message
      setSuccessMessage(`SO ${task.SOId || task.POId} (${task.UniqueId}) advanced successfully to ${updatedTask.Status}`);
      setSuccessOpen(true);

      // Refresh tasks with force refresh to show updated data
      await fetchTasks(true);
    } catch (error) {
      console.error("Error advancing task:", error);
      setError(error.message || "Failed to advance task");
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchDateConfirm = async (dispatchDate, calculatedDueDates) => {
    try {
      setLoading(true);
      setError(null);

      const task = pendingAdvanceTask;
      const file = pendingAdvanceFile;

      // Upload file if exists
      if (file) {
        await poService.uploadPODocument(task.POId, file);
      }

      // Schedule dispatch and move to STORE1 to start production
      const updatedTask = await flowService.scheduleDispatchAndStartProduction(
        task.POId,
        dispatchDate,
        calculatedDueDates,
        user?.email || ''
      );

      // Show success message with dispatch date
      setSuccessMessage(
        `SO ${task.SOId || task.POId} (${task.UniqueId}) scheduled for dispatch on ${new Date(dispatchDate).toLocaleDateString()}. Moved to Store 1 to start production.`
      );
      setSuccessOpen(true);

      // Clear pending task
      setPendingAdvanceTask(null);
      setPendingAdvanceFile(null);

      // Refresh tasks with force refresh to show updated data
      await fetchTasks(true);
    } catch (error) {
      console.error("Error scheduling dispatch:", error);
      setError(error.message || "Failed to schedule dispatch");
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchDateDialogClose = () => {
    setDispatchDateDialogOpen(false);
    setPendingAdvanceTask(null);
    setPendingAdvanceFile(null);
  };

  const handleEditStageDate = (task, stage) => {

    setTaskToEditDate(task);
    setCurrentEditStage(stage);
    setEditStageDateDialogOpen(true);

  };

  const handleEditStageDateClose = () => {
    setEditStageDateDialogOpen(false);
    setTaskToEditDate(null);
    setCurrentEditStage(null);
  };

  const handleEditStageDateConfirm = async (task, calculatedDates) => {
    try {
      setLoading(true);
      setError(null);

      // Update the Dispatches sheet with new DispatchDate
      const dispatchRecords = await sheetService.getSheetData("Dispatches");
      const dispatchIndex = dispatchRecords.findIndex(
        record => record.DispatchUniqueId === task.DispatchUniqueId
      );

      if (dispatchIndex === -1) {
        throw new Error("Dispatch record not found");
      }

      // Format dispatch date properly to avoid timezone issues
      const formatDateForSheet = (dateStr) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const updatedDispatch = {
        ...dispatchRecords[dispatchIndex],
        DispatchDate: formatDateForSheet(calculatedDates.DispatchDate),
        // Update all stage due dates so they appear instantly in Complete O2D
        ...(calculatedDates.Store1DueDate && { Store1DueDate: formatDateForSheet(calculatedDates.Store1DueDate) }),
        ...(calculatedDates.CableProductionDueDate && { CableProductionDueDate: formatDateForSheet(calculatedDates.CableProductionDueDate) }),
        ...(calculatedDates.Store2DueDate && { Store2DueDate: formatDateForSheet(calculatedDates.Store2DueDate) }),
        ...(calculatedDates.MouldingDueDate && { MouldingDueDate: formatDateForSheet(calculatedDates.MouldingDueDate) }),
        ...(calculatedDates.FGSectionDueDate && { FGSectionDueDate: formatDateForSheet(calculatedDates.FGSectionDueDate) }),
        LastModified: new Date().toISOString()
      };

      await sheetService.updateRow("Dispatches", dispatchIndex + 2, updatedDispatch);

      // Update PO_Master with all calculated stage dates
      const pos = await poService.getAllPOs();
      const poIndex = pos.findIndex(po => po.UniqueId === task.UniqueId);
      
      if (poIndex !== -1) {
        const updateData = {
          DispatchDate: formatDateForSheet(calculatedDates.DispatchDate),
        };

        // Initialize status fields with just 'NEW' (without dates) when dispatch is first scheduled
        // Dates will be added later when status is actually updated to different stages
        if (!task.store1Status) {
          updateData.store1Status = 'NEW';
        }
        if (!task.cableProdStatus) {
          updateData.cableProdStatus = 'NEW';
        }
        if (!task.store2Status) {
          updateData.store2Status = 'NEW';
        }
        if (!task.mouldingProdStatus) {
          updateData.mouldingProdStatus = 'NEW';
        }
        if (!task.fgSectionStatus) {
          updateData.fgSectionStatus = 'NEW';
        }

        await poService.updatePOByUniqueId(task.UniqueId, updateData);

      }

      setSuccessMessage(
        `Timeline updated! New dispatch date: ${new Date(calculatedDates.DispatchDate).toLocaleDateString()}`
      );
      setSuccessOpen(true);

      // Refresh tasks
      await fetchTasks(true);
    } catch (error) {
      console.error("Error updating stage date:", error);
      setError(error.message || "Failed to update stage date");
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToModule = async (task, action) => {
    try {
      setLoading(true);
      setError(null);

      // Handle combined batch move for cable production
      if (action === 'move_to_cable_production_combined' && Array.isArray(task)) {
        // Combine multiple batches with same Unique ID
        if (task.length === 0) {
          setError("No batches selected");
          return;
        }

        // Verify all selected tasks have the same Unique ID
        const uniqueIds = [...new Set(task.map(t => t.UniqueId))];
        if (uniqueIds.length > 1) {
          setError("Cannot combine batches with different Unique IDs. Please select batches with the same Unique ID.");
          return;
        }

        // Check each dispatch ID individually to see which ones already have production plans
        try {
          const productionPlans = await sheetService.getSheetData("Cable Production Plans");
          const dispatchIds = task.map(t => t.DispatchUniqueId || t._uniqueKey || t.UniqueId).filter(Boolean);
          
          // Check each dispatch ID individually
          const duplicateDispatchIds = [];
          const duplicatePlanDetails = [];
          
          dispatchIds.forEach(dispatchId => {
            const existingPlan = productionPlans.find(plan => {
              if (!plan.batchInfo) return false;
              
              try {
                const batchInfo = typeof plan.batchInfo === 'string' 
                  ? JSON.parse(plan.batchInfo) 
                  : plan.batchInfo;
                
                if (Array.isArray(batchInfo)) {
                  return batchInfo.some(batch => 
                    batch.dispatchId === dispatchId || batch.batchId === dispatchId
                  );
                }
              } catch (e) {
                console.error('Error parsing batchInfo:', e);
              }
              
              return false;
            });
            
            if (existingPlan) {
              duplicateDispatchIds.push(dispatchId);
              duplicatePlanDetails.push({
                dispatchId: dispatchId,
                planId: existingPlan.planId || existingPlan.orderNumber || 'Unknown'
              });
            }
          });
          
          // Only block if there are duplicate dispatch IDs
          if (duplicateDispatchIds.length > 0) {
            const duplicateDetails = duplicatePlanDetails
              .map(d => `${d.dispatchId} (Plan: ${d.planId})`)
              .join(', ');
            
            setError(`Cannot create production plan. The following dispatch ID(s) already have production plans: ${duplicateDetails}`);
            setLoading(false);
            return;
          }
        } catch (checkError) {
          console.error('Error checking existing production plans:', checkError);
          // Continue with move if check fails (don't block user)
        }

        // Calculate combined quantity
        const combinedQuantity = task.reduce((sum, t) => {
          return sum + (parseFloat(t.Quantity || t.updatedBatch || t.BatchSize || 0));
        }, 0);

        // Use the first task as base for other properties
        const baseTask = task[0];
        
        // Get task keys for tracking after plan creation (not marking as moved yet)
        const taskKeys = task.map(t => t._uniqueKey || t.DispatchUniqueId || t.UniqueId);
        
        // Store combined dispatch data in sessionStorage (including task keys for later tracking)
        sessionStorage.setItem('selectedCableProductionBatches', JSON.stringify({
          batches: task.map(t => ({
            DispatchUniqueId: t.DispatchUniqueId,
            BatchNumber: t.BatchNumber,
            Quantity: t.Quantity || t.updatedBatch || t.BatchSize,
            BatchSize: t.BatchSize,
            _uniqueKey: t._uniqueKey || t.DispatchUniqueId || t.UniqueId // Store key for tracking
          })),
          taskKeys: taskKeys, // Store task keys to mark as moved after plan creation
          combinedData: {
            // Include all relevant task data first
            ...baseTask,
            // Then override with combined values to ensure combined quantity is used
            UniqueId: baseTask.UniqueId,
            DispatchUniqueId: baseTask.DispatchUniqueId, // Use first batch's dispatch ID
            ClientCode: baseTask.ClientCode,
            ProductCode: baseTask.ProductCode,
            ProductName: baseTask.ProductName,
            Quantity: combinedQuantity, // Combined quantity - this will override individual batch quantity
            BatchSize: combinedQuantity, // Combined batch size - this will override individual batch size
            CableLength: baseTask.CableLength,
            TargetLength: baseTask.TargetLength,
            DispatchDate: baseTask.DispatchDate,
            POId: baseTask.POId,
            SOId: baseTask.SOId,
          }
        }));

        // Show success message
        const batchCount = task.length;
        const message = `${batchCount} batch${batchCount > 1 ? 'es' : ''} (${combinedQuantity.toLocaleString()} pcs) selected and moved to Cable Production. These batches will not be selectable again.`;
        setSuccessMessage(message);
        setSuccessOpen(true);

        // Navigate to cable production planning with combined batch
        navigate('/cable-production/production-planning');
        return;
      }

      // Navigate to the appropriate module based on the action
      switch (action) {
        case 'move_to_inventory':
          // Navigate to inventory module in same window
          window.location.href = '/inventory';
          break;
        case 'move_to_cable_production':
          // Check if this dispatch ID already has a production plan
          try {
            const dispatchId = task.DispatchUniqueId || task._uniqueKey || task.UniqueId;
            if (dispatchId) {
              const productionPlans = await sheetService.getSheetData("Cable Production Plans");
              
              const existingPlan = productionPlans.find(plan => {
                if (!plan.batchInfo) return false;
                
                try {
                  const batchInfo = typeof plan.batchInfo === 'string' 
                    ? JSON.parse(plan.batchInfo) 
                    : plan.batchInfo;
                  
                  if (Array.isArray(batchInfo)) {
                    return batchInfo.some(batch => 
                      batch.dispatchId === dispatchId || batch.batchId === dispatchId
                    );
                  }
                } catch (e) {
                  console.error('Error parsing batchInfo:', e);
                }
                
                return false;
              });
              
              if (existingPlan) {
                const planId = existingPlan.planId || existingPlan.orderNumber || 'Unknown';
                setError(`Cannot create production plan. This batch already has a production plan: ${planId}`);
                setLoading(false);
                return;
              }
            }
          } catch (checkError) {
            console.error('Error checking existing production plans:', checkError);
            // Continue with move if check fails (don't block user)
          }
          
          // Get task key for tracking after plan creation (not marking as moved yet)
          const taskKey = task._uniqueKey || task.DispatchUniqueId || task.UniqueId;
          
          // Single batch move - store dispatch data in sessionStorage (including task key for later tracking)
          sessionStorage.setItem('selectedCableProductionBatches', JSON.stringify({
            batches: [{
              DispatchUniqueId: task.DispatchUniqueId,
              BatchNumber: task.BatchNumber,
              Quantity: task.Quantity || task.updatedBatch || task.BatchSize,
              BatchSize: task.BatchSize,
              _uniqueKey: taskKey // Store key for tracking
            }],
            taskKeys: [taskKey], // Store task key to mark as moved after plan creation
            combinedData: {
              DispatchUniqueId: task.DispatchUniqueId,
              UniqueId: task.UniqueId,
              BatchNumber: task.BatchNumber,
              ClientCode: task.ClientCode,
              ProductCode: task.ProductCode,
              ProductName: task.ProductName,
              Quantity: task.Quantity || task.updatedBatch || task.BatchSize,
              BatchSize: task.BatchSize,
              CableLength: task.CableLength,
              TargetLength: task.TargetLength,
              DispatchDate: task.DispatchDate,
              POId: task.POId,
              SOId: task.SOId,
              // Include all relevant task data
              ...task
            }
          }));
          
          // Show success message
          setSuccessMessage(`Batch ${task.DispatchUniqueId || task.UniqueId} (${(task.Quantity || task.updatedBatch || task.BatchSize || 0).toLocaleString()} pcs) selected and moved to Cable Production. This batch will not be selectable again.`);
          setSuccessOpen(true);
          
          // Navigate to cable production planning
          navigate('/cable-production/production-planning');
          break;
        case 'move_to_moulding':
          // Store dispatch data in sessionStorage for auto-loading in molding production
          sessionStorage.setItem('selectedDispatch', JSON.stringify({
            DispatchUniqueId: task.DispatchUniqueId,
            UniqueId: task.UniqueId,
            BatchNumber: task.BatchNumber,
            ClientCode: task.ClientCode,
            ProductCode: task.ProductCode,
            ProductName: task.ProductName,
            Quantity: task.Quantity,
            BatchSize: task.BatchSize,
            CableLength: task.CableLength,
            TargetLength: task.TargetLength,
            DispatchDate: task.DispatchDate,
            mouldingCompletedDate: task.mouldingCompletedDate,
            // Include all relevant task data
            ...task
          }));

          // Navigate to molding production planning page
          navigate('/molding/production-planning');
          break;
        case 'move_to_fg_section':
          // Navigate to FG production module
          navigate('/fg-production');
          break;
        case 'move_to_dispatch':
          // Navigate to dispatch module
          navigate('/dispatch');
          break;
        default:
          console.warn('Unknown move action:', action);
          break;
      }

      // Show success message (only if not already shown for combined batch or single cable production)
      if (action !== 'move_to_cable_production_combined' && action !== 'move_to_cable_production') {
        setSuccessMessage(`Moving ${task.DispatchUniqueId || task.UniqueId} to ${action.replace('move_to_', '').replace('_', ' ')} module`);
        setSuccessOpen(true);
      }

    } catch (error) {
      console.error("Error moving to module:", error);
      setError(error.message || "Failed to move to module");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (task) => {
    try {
      setLoading(true);
      setError(null);

      // Update the status in the Dispatches sheet
      const dispatchRecords = await sheetService.getSheetData("Dispatches");
      const dispatchIndex = dispatchRecords.findIndex(
        record => record.DispatchUniqueId === task.DispatchUniqueId
      );

      if (dispatchIndex === -1) {
        throw new Error("Dispatch record not found");
      }

      const dispatchRecord = dispatchRecords[dispatchIndex];
      let updatedRecord = { ...dispatchRecord };
      
      // Determine which status field to update based on current stage
      const currentStage = activeTab;
      let statusField = '';
      let stageName = '';
      
      switch (currentStage) {
        case 0: // Complete O2D - read-only view, cannot update status
          throw new Error("Cannot update status in Complete O2D view. This tab shows completed orders only.");
        case 1: // Store 1
          statusField = 'store1Status';
          stageName = 'STORE1';
          break;
        case 2: // Cable Production
          statusField = 'cableProdStatus';
          stageName = 'CABLE_PRODUCTION';
          break;
        case 3: // Store 2
          statusField = 'store2Status';
          stageName = 'STORE2';
          break;
        case 4: // Moulding
          statusField = 'mouldingProdStatus';
          stageName = 'MOULDING';
          break;
        case 5: // FG Section
          statusField = 'fgSectionStatus';
          stageName = 'FG_SECTION';
          break;
        case 6: // Dispatch
          // Prefer canonical 'DispatchStatus' but fall back to 'dispatchStatus' if sheet uses lowercase
          statusField = dispatchRecord && (dispatchRecord.DispatchStatus !== undefined ? 'DispatchStatus' : 'dispatchStatus');
          stageName = 'DISPATCH';
          break;
        default:
          throw new Error("Invalid stage for status update");
      }

      // CRITICAL: Check if previous stages are completed before allowing status update
      const canUpdateStatus = checkPreviousStagesCompletedForUpdate(dispatchRecord, stageName);
      if (!canUpdateStatus.allowed) {
        throw new Error(canUpdateStatus.reason);
      }

      // CRITICAL: For CABLE_PRODUCTION stage, check if a cable production plan has been created
      if (stageName === 'CABLE_PRODUCTION') {
        const productionPlans = await sheetService.getSheetData("Cable Production Plans");
        const existingPlan = productionPlans.find(p => p.orderNumber === task.POId);
        if (!existingPlan) {
          throw new Error("Cannot mark Cable Production as completed. Please create a cable production plan first.");
        }
        
        // Check if batch size has been updated before allowing status update (can be same value, just needs to be set)
        const updatedBatchSize = parseFloat(dispatchRecord.updatedBatch || 0);
        const batchSizeUpdated = dispatchRecord.updatedBatch && updatedBatchSize > 0;
        
        if (!batchSizeUpdated) {
          throw new Error("Please update the batch size before marking Cable Production as completed.");
        }
      }

      // CRITICAL: For MOULDING stage, check if batch size has been updated before allowing status update
      if (stageName === 'MOULDING') {
        // Check if batch size has been updated before allowing status update (can be same value, just needs to be set)
        const updatedBatchSize = parseFloat(dispatchRecord.updatedBatch || 0);
        const batchSizeUpdated = dispatchRecord.updatedBatch && updatedBatchSize > 0;
        
        if (!batchSizeUpdated) {
          throw new Error("Please update the batch size before marking Moulding as completed.");
        }
      }

      // Toggle status between NEW and COMPLETED
      const currentStatusString = dispatchRecord[statusField] || 'NEW';
      const currentStatus = getStatusOnly(currentStatusString);
      const newStatus = currentStatus === 'NEW' ? 'COMPLETED' : 'NEW';
      
      // Get the current due date from the task or calculate it
      const currentDueDate = formatDateForStorage(task.DueDate);
      
      // Create new status string with date if completing, preserving due date
      const newStatusString = updateStatus(currentStatusString, newStatus, currentDueDate);
      
      updatedRecord[statusField] = newStatusString;
      // Mirror to the other variant for consistency in filters/UI
      if (statusField === 'DispatchStatus') {
        updatedRecord.dispatchStatus = newStatusString;
      } else if (statusField === 'dispatchStatus') {
        updatedRecord.DispatchStatus = newStatusString;
      }
      
      // AUTO-MOVE: If we're marking as COMPLETED, automatically move to next stage
      if (newStatus === 'COMPLETED') {
        let nextStageField = '';
        
        switch (stageName) {
          case 'STORE1':
            nextStageField = 'cableProdStatus';
            updatedRecord[nextStageField] = 'NEW';

            break;
          case 'CABLE_PRODUCTION':
            nextStageField = 'store2Status';
            updatedRecord[nextStageField] = 'NEW';

            break;
          case 'STORE2':
            nextStageField = 'mouldingProdStatus';
            updatedRecord[nextStageField] = 'NEW';

            break;
          case 'MOULDING':
            nextStageField = 'fgSectionStatus';
            updatedRecord[nextStageField] = 'NEW';

            break;
          case 'FG_SECTION':
            // Initialize both dispatch status variants
            updatedRecord.DispatchStatus = 'NEW';
            updatedRecord.dispatchStatus = 'NEW';

            break;
          case 'DISPATCH':
            // For dispatch, mark batch as completed and set delivery status
            const dispatchStatusValue = updatedRecord.DispatchStatus || updatedRecord.dispatchStatus;
            const allStagesCompleted = 
              updatedRecord.store1Status === 'COMPLETED' &&
              updatedRecord.cableProdStatus === 'COMPLETED' &&
              updatedRecord.store2Status === 'COMPLETED' &&
              updatedRecord.mouldingProdStatus === 'COMPLETED' &&
              updatedRecord.fgSectionStatus === 'COMPLETED' &&
              dispatchStatusValue === 'COMPLETED';
            
            if (allStagesCompleted) {
              updatedRecord.BatchCompleted = 'Yes';
              // Set delivery status to COMPLETED when dispatch is completed
              updatedRecord.deliveryStatus = 'COMPLETED';

            }
            break;
        }
      }
      
      updatedRecord.LastModified = new Date().toISOString();

      // Update the sheet
      await sheetService.updateRow("Dispatches", dispatchIndex + 2, updatedRecord);

      // Show success message with auto-move information
      let successMessage = '';
      if (newStatus === 'COMPLETED') {
        let nextStageName = '';
        switch (stageName) {
          case 'STORE1':
            nextStageName = 'Cable Production';
            break;
          case 'CABLE_PRODUCTION':
            nextStageName = 'Store 2';
            break;
          case 'STORE2':
            nextStageName = 'Moulding';
            break;
          case 'MOULDING':
            nextStageName = 'FG Section';
            break;
          case 'FG_SECTION':
            nextStageName = 'Dispatch';
            break;
          case 'DISPATCH':
            successMessage = `Dispatch completed for ${task.DispatchUniqueId || task.UniqueId}`;
            break;
        }
        if (nextStageName) {
          successMessage = `${stageName} marked as completed. Task automatically moved to ${nextStageName} stage.`;
        }
      } else {
        successMessage = `Status updated to ${newStatus} for ${task.DispatchUniqueId || task.UniqueId}`;
      }
      setSuccessMessage(successMessage);
      setSuccessOpen(true);

      // Auto-switch to next tab when task moves to next stage
      // This automatically navigates to the next stage tab after marking current stage as completed
      // Tab indices: 0=Complete O2D, 1=Store1, 2=Cable Prod, 3=Store2, 4=Moulding, 5=FG Section, 6=Dispatch, 7=Upload Receiving
      if (newStatus === 'COMPLETED' && stageName !== 'DISPATCH') {
        let nextTabIndex = -1;
        switch (stageName) {
          case 'STORE1':
            nextTabIndex = 2; // Cable Production (tab index 2)
            break;
          case 'CABLE_PRODUCTION':
            nextTabIndex = 3; // Store 2 (tab index 3)
            break;
          case 'STORE2':
            nextTabIndex = 4; // Moulding (tab index 4)
            break;
          case 'MOULDING':
            nextTabIndex = 5; // FG Section (tab index 5)
            break;
          case 'FG_SECTION':
            nextTabIndex = 6; // Dispatch (tab index 6)
            break;
        }
        
        if (nextTabIndex !== -1) {
          // Automatically switch to the next stage tab so user can see the task in the next stage
          setTimeout(() => {
            setActiveTab(nextTabIndex);
          }, 100); // Small delay to ensure data is refreshed first
        }
      }

      // Refresh tasks to show updated data
      await fetchTasks(true);

    } catch (error) {
      console.error("Error updating status:", error);
      setError(error.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadReceivingDocument = async (task, file) => {
    try {
      setLoading(true);
      setError(null);

      // Upload file using sheetService (SAME AS SO DOCUMENT PATTERN)
      const fileId = await sheetService.uploadFile(file);

      // Create document metadata (SAME PATTERN AS SO)
      const documentData = {
        fileId: fileId,              // Primary file reference (SAME AS SO)
        fileName: file.name,         // File name
        mimeType: file.type,         // File type
        size: file.size,             // File size in bytes
        uploadedBy: user?.email || 'system',  // User who uploaded
        uploadedAt: new Date().toISOString() // Upload timestamp
      };

      // Get existing documents for this dispatch
      const dispatchRecords = await sheetService.getSheetData("Dispatches");

      const dispatchIndex = dispatchRecords.findIndex(
        record => record.DispatchUniqueId === task.DispatchUniqueId
      );

      if (dispatchIndex === -1) {
        console.error("❌ Dispatch record not found!");
        console.error("Available DispatchUniqueIds:", dispatchRecords.map(r => r.DispatchUniqueId));
        throw new Error(`Dispatch record not found: ${task.DispatchUniqueId}`);
      }

      const dispatchRecord = dispatchRecords[dispatchIndex];

      // Parse existing receivingDocuments or initialize empty array (same as sales flow)
      let receivingDocuments = [];
      if (dispatchRecord.receivingDocuments && 
          dispatchRecord.receivingDocuments !== '' && 
          dispatchRecord.receivingDocuments !== '[]') {
        try {
          const parsed = JSON.parse(dispatchRecord.receivingDocuments);
          receivingDocuments = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.error('Error parsing existing receivingDocuments:', e);
          receivingDocuments = [];
        }
      }

      // Replace any existing document; only one upload allowed
      receivingDocuments = [documentData];

      // Update dispatch record with JSON stringified array (same as sales flow)
      const updatedRecord = {
        ...dispatchRecord,
        receivingDocuments: JSON.stringify(receivingDocuments),
        LastModified: new Date().toISOString()
      };

      // Get sheet headers to verify column exists
      const headers = await sheetService.getSheetHeaders("Dispatches");

      // Row index should be dispatchIndex + 2 (accounting for 0-index and header row)
      const rowNumber = dispatchIndex + 2;

      const updateResult = await sheetService.updateRow("Dispatches", rowNumber, updatedRecord);

      // CRITICAL: Verify the save by reading back the data

      const verifyRecords = await sheetService.getSheetData("Dispatches");
      const verifyRecord = verifyRecords[dispatchIndex];

      // Show success message
      setSuccessMessage(`Document "${file.name}" uploaded successfully for ${task.DispatchUniqueId}`);
      setSuccessOpen(true);

      // Refresh tasks to show updated data
      await fetchTasks(true);

    } catch (error) {
      console.error("❌ Error uploading receiving document:", error);
      setError(error.message || "Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  // Separate time filter states: Complete O2D, Production Stages (shared), Upload Receiving
  const [completeO2DTimeRange, setCompleteO2DTimeRange] = useState('24h'); // Tab 0: Complete O2D - separate filter
  const [productionStagesTimeRange, setProductionStagesTimeRange] = useState('24h'); // Tabs 1-6: Store 1, Cable Prod, Store 2, Moulding, FG Section, Dispatch - shared filter
  const [uploadReceivingTimeRange, setUploadReceivingTimeRange] = useState('24h'); // Tab 7: Upload Receiving - separate filter

  // Get current time range based on active tab
  const getCurrentTimeRange = () => {
    switch (activeTab) {
      case 0: return completeO2DTimeRange; // Complete O2D
      case 1: // Store 1
      case 2: // Cable Production
      case 3: // Store 2
      case 4: // Moulding
      case 5: // FG Section
      case 6: // Dispatch
        return productionStagesTimeRange; // Shared for all production stages
      case 7: return uploadReceivingTimeRange; // Upload Receiving
      default: return 'all';
    }
  };

  // Get current time range setter based on active tab
  const setCurrentTimeRange = (value) => {
    switch (activeTab) {
      case 0: setCompleteO2DTimeRange(value); break; // Complete O2D
      case 1: // Store 1
      case 2: // Cable Production
      case 3: // Store 2
      case 4: // Moulding
      case 5: // FG Section
      case 6: // Dispatch
        setProductionStagesTimeRange(value); break; // Shared for all production stages
      case 7: setUploadReceivingTimeRange(value); break; // Upload Receiving
    }
  };

  const getTimeRangeLabel = (timeRange) => {
    const range = timeRange || getCurrentTimeRange();
    if (range === 'all') return 'All time';
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    if (range === '24h') return `Last 24h from ${formatted}`;
    if (range === '3d') return `Last 3d from ${formatted}`;
    if (range === '7d') return `Last 7d from ${formatted}`;
    if (range === '30d') return `Last 30d from ${formatted}`;
    return `Last ${range} from ${formatted}`;
  };

  // Get dispatches filtered by selected time range
  const getTimeFilteredDispatches = (timeRangeParam) => {
    if (!dispatches || dispatches.length === 0) return [];
    const range = timeRangeParam || getCurrentTimeRange();
    if (range === 'all') return dispatches;
    const now = new Date();
    let windowMs;
    if (range === '24h') {
      windowMs = 24*60*60*1000;
    } else if (range === '3d') {
      windowMs = 3*24*60*60*1000;
    } else if (range === '7d') {
      windowMs = 7*24*60*60*1000;
    } else if (range === '30d') {
      windowMs = 30*24*60*60*1000;
    } else {
      windowMs = 24*60*60*1000; // Default to 24h
    }
    const cutoff = new Date(now.getTime() - windowMs);
    return dispatches.filter(d => {
      const created = d.CreatedAt;
      if (!created) return false;
      const dt = new Date(created);
      return !isNaN(dt) && dt >= cutoff;
    });
  };

  const handleMoveStage = async (task, updatedBatchSize = null) => {
    try {
      setLoading(true);
      setError(null);

      // Check if current status is COMPLETED before allowing move
      if (task.Status !== 'COMPLETED') {
        setError("Task must be marked as COMPLETED before moving to next stage");
        setLoading(false);
        return;
      }

      // Update the status in the Dispatches sheet to mark current stage as completed
      // and move to next stage
      const dispatchRecords = await sheetService.getSheetData("Dispatches");
      const dispatchIndex = dispatchRecords.findIndex(
        record => record.DispatchUniqueId === task.DispatchUniqueId
      );

      if (dispatchIndex === -1) {
        throw new Error("Dispatch record not found");
      }

      const dispatchRecord = dispatchRecords[dispatchIndex];
      let updatedRecord = { ...dispatchRecord };
      
      // Determine which stage this task is currently in based on actual status
      let currentStage = null;
      let nextStage = null;
      
      // Find the current stage based on task status
      if (task.Status === 'COMPLETED') {
        // Determine which stage is completed and ready to move
        if (dispatchRecord.store1Status === 'COMPLETED' && (!dispatchRecord.cableProdStatus || dispatchRecord.cableProdStatus === 'NEW')) {
          currentStage = 'STORE1';
          nextStage = 'CABLE_PRODUCTION';
        } else if (dispatchRecord.cableProdStatus === 'COMPLETED' && (!dispatchRecord.store2Status || dispatchRecord.store2Status === 'NEW')) {
          currentStage = 'CABLE_PRODUCTION';
          nextStage = 'STORE2';
        } else if (dispatchRecord.store2Status === 'COMPLETED' && (!dispatchRecord.mouldingProdStatus || dispatchRecord.mouldingProdStatus === 'NEW')) {
          currentStage = 'STORE2';
          nextStage = 'MOULDING';
        } else if (dispatchRecord.mouldingProdStatus === 'COMPLETED' && (!dispatchRecord.fgSectionStatus || dispatchRecord.fgSectionStatus === 'NEW')) {
          currentStage = 'MOULDING';
          nextStage = 'FG_SECTION';
        } else if (dispatchRecord.fgSectionStatus === 'COMPLETED' && (!dispatchRecord.DispatchStatus && !dispatchRecord.dispatchStatus || (dispatchRecord.DispatchStatus || dispatchRecord.dispatchStatus) === 'NEW')) {
          currentStage = 'FG_SECTION';
          nextStage = 'DISPATCH';
        } else if ((dispatchRecord.DispatchStatus || dispatchRecord.dispatchStatus) === 'COMPLETED') {
          currentStage = 'DISPATCH';
          nextStage = 'DELIVERED';
        }
      }
      
      if (!currentStage) {
        throw new Error("Cannot determine current stage or task is not ready to move");
      }

      // Move to next stage based on current stage
      switch (currentStage) {
        case 'STORE1':
          updatedRecord.store1Status = 'COMPLETED';
          updatedRecord.cableProdStatus = 'NEW';
          break;
        case 'CABLE_PRODUCTION':
          updatedRecord.cableProdStatus = 'COMPLETED';
          updatedRecord.store2Status = 'NEW';
          // If batch size is updated, update it for all subsequent stages
          if (updatedBatchSize !== null && updatedBatchSize > 0) {
            updatedRecord.updatedBatch = updatedBatchSize.toString();
          }
          break;
        case 'STORE2':
          updatedRecord.store2Status = 'COMPLETED';
          updatedRecord.mouldingProdStatus = 'NEW';
          break;
        case 'MOULDING':
          updatedRecord.mouldingProdStatus = 'COMPLETED';
          updatedRecord.fgSectionStatus = 'NEW';
          break;
        case 'FG_SECTION':
          updatedRecord.fgSectionStatus = 'COMPLETED';
          updatedRecord.DispatchStatus = 'NEW';
          break;
        case 'DISPATCH':
          updatedRecord.DispatchStatus = 'COMPLETED';
          // Check if all stages are completed before marking batch as delivered
          const allStagesCompleted = 
            updatedRecord.store1Status === 'COMPLETED' &&
            updatedRecord.cableProdStatus === 'COMPLETED' &&
            updatedRecord.store2Status === 'COMPLETED' &&
            updatedRecord.mouldingProdStatus === 'COMPLETED' &&
            updatedRecord.fgSectionStatus === 'COMPLETED' &&
            updatedRecord.DispatchStatus === 'COMPLETED';
          
          if (allStagesCompleted) {
            updatedRecord.BatchCompleted = 'Yes';
          }
          break;
        default:
          throw new Error(`Invalid current stage: ${currentStage}`);
      }

      // If batch size is provided (from Cable Production move), update it for all subsequent stages
      if (updatedBatchSize !== null && updatedBatchSize > 0 && currentStage === 'CABLE_PRODUCTION') {
        updatedRecord.updatedBatch = updatedBatchSize.toString();
      }

      updatedRecord.LastModified = new Date().toISOString();

      // Update the sheet
      await sheetService.updateRow("Dispatches", dispatchIndex + 2, updatedRecord);

      // Show success message
      setSuccessMessage(`Task moved to next stage for ${task.DispatchUniqueId || task.UniqueId}`);
      setSuccessOpen(true);

      // Refresh tasks to show updated data

      await fetchTasks(true);
    } catch (error) {
      console.error("Error moving task to next stage:", error);
      setError(error.message || "Failed to move task to next stage");
    } finally {
      setLoading(false);
    }
  };

  // Handle batch size update
  const handleUpdateBatchSize = async (task, newBatchSize, isMouldingSplit = false) => {
    try {
      setLoading(true);
      setError(null);

      // Update the updatedBatch in the Dispatches sheet
      const dispatchRecords = await sheetService.getSheetData("Dispatches", true);
      const dispatchIndex = dispatchRecords.findIndex(
        record => record.DispatchUniqueId === task.DispatchUniqueId
      );

      if (dispatchIndex === -1) {
        throw new Error("Dispatch record not found");
      }

      const dispatchRecord = dispatchRecords[dispatchIndex];
      // Get the original batch size (before any updates) - this is what we want to keep in Molding
      const originalBatchSize = parseFloat(dispatchRecord.BatchSize || dispatchRecord.Quantity || 0);
      const currentBatchSize = parseFloat(dispatchRecord.updatedBatch || dispatchRecord.BatchSize || dispatchRecord.Quantity || 0);
      const enteredBatchSize = parseFloat(newBatchSize);
      const existingRemaining = parseFloat(dispatchRecord.mouldingRemaining || dispatchRecord.mouldingRemair || 0);
      
      // Check if this is moving the remaining quantity from a previous split
      const isMovingRemaining = isMouldingSplit && existingRemaining > 0 && enteredBatchSize <= existingRemaining;
      
      // For moulding split: if entered amount is less than current, split the batch
      if (isMouldingSplit && enteredBatchSize < currentBatchSize && !isMovingRemaining) {
        const remainingQuantity = currentBatchSize - enteredBatchSize;
        
        // Generate new DispatchUniqueId for the split batch (FG portion)
        const generateDispatchUniqueId = () => {
          const timestamp = Date.now().toString().slice(-8);
          const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          return `DISP-${timestamp}-${randomNum}`;
        };
        
        const newDispatchUniqueId = generateDispatchUniqueId();
        
        // Create a new dispatch record for the portion moving to FG (1000 pcs)
        const newDispatchRecord = {
          DispatchUniqueId: newDispatchUniqueId,
          UniqueId: dispatchRecord.UniqueId,
          ClientCode: dispatchRecord.ClientCode,
          ProductCode: dispatchRecord.ProductCode,
          ProductName: dispatchRecord.ProductName,
          BatchNumber: dispatchRecord.BatchNumber,
          BatchSize: originalBatchSize.toString(), // Always preserve original batch size (e.g., 1005 pcs)
          updatedBatch: enteredBatchSize.toString(), // 1000 pcs for FG
          DispatchDate: dispatchRecord.DispatchDate || new Date().toLocaleDateString('en-GB'),
          DateEntry: new Date().toLocaleDateString('en-GB'),
          CreatedAt: new Date().toISOString(),
          Dispatched: dispatchRecord.Dispatched || "No",
          // Copy all status fields from original
          store1Status: dispatchRecord.store1Status || "COMPLETED",
          cableProdStatus: dispatchRecord.cableProdStatus || "COMPLETED",
          store2Status: dispatchRecord.store2Status || "COMPLETED",
          mouldingProdStatus: "COMPLETED", // Mark as completed since it's moving from molding
          fgSectionStatus: "NEW", // New in FG Section
          DispatchStatus: dispatchRecord.DispatchStatus || "NEW",
          dispatchStatus: dispatchRecord.dispatchStatus || "NEW",
          deliveryStatus: dispatchRecord.deliveryStatus || "NEW",
          moveToFg: enteredBatchSize.toString(), // Store quantity moving to FG
          mouldingRemaining: "", // Not applicable for this record
          LastModified: new Date().toISOString().split('T')[0]
        };
        
        // Prepare move history entry
        const moveHistoryEntry = {
          date: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY format
          quantity: enteredBatchSize,
          remaining: remainingQuantity,
          details: `${enteredBatchSize.toLocaleString()} pcs moved to FG Section, ${remainingQuantity.toLocaleString()} pcs remaining in Molding`
        };
        
        // Get existing move history and append new entry
        let existingHistory = [];
        if (dispatchRecord.moveHistory) {
          try {
            const parsed = typeof dispatchRecord.moveHistory === 'string' 
              ? JSON.parse(dispatchRecord.moveHistory) 
              : dispatchRecord.moveHistory;
            existingHistory = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {
            // If parsing fails, start fresh
            existingHistory = [];
          }
        }
        
        // Append new move to history
        existingHistory.push(moveHistoryEntry);
        const updatedMoveHistory = JSON.stringify(existingHistory);
        
        // Update original record: keep full batch size (1005) in Molding, show remaining (5 pcs) in mouldingRemain
        // The batch will display as "1005 pcs (was 1000)" with 5 pcs in mouldingRemain column
        const updatedRecord = {
          ...dispatchRecord,
          // Keep original BatchSize (1005) - don't change it, so it shows the full batch
          BatchSize: originalBatchSize.toString(), // Keep original batch size (1005)
          updatedBatch: currentBatchSize.toString(), // Keep current batch size for display (1005)
          mouldingProdStatus: dispatchRecord.mouldingProdStatus || "NEW", // Keep current status
          fgSectionStatus: "", // Clear FG status since this portion stays in molding
          mouldingRemaining: remainingQuantity.toString(), // Store remaining quantity in molding (5 pcs)
          mouldingRemair: remainingQuantity.toString(), // Store remaining quantity in molding (alternative column name)
          moveToFg: enteredBatchSize.toString(), // Store what was moved to FG (1000) for reference
          moveHistory: updatedMoveHistory, // Store move history with all moves (will be updated when remaining is moved)
          LastModified: new Date().toISOString().split('T')[0]
        };

        // Update original record and create new record
        await Promise.all([
          sheetService.updateRow("Dispatches", dispatchIndex + 2, updatedRecord),
          sheetService.appendRow("Dispatches", newDispatchRecord)
        ]);

        // Show success message with split information
        setSuccessMessage(
          `Batch split successfully: ${enteredBatchSize.toLocaleString()} pcs moved to FG Section (Batch ${newDispatchUniqueId}), ${remainingQuantity.toLocaleString()} pcs remaining in Molding (Batch ${task.DispatchUniqueId || task.UniqueId})`
        );
      } else if (isMovingRemaining) {
        // Moving the remaining quantity that was left from a previous split
        const newRemaining = existingRemaining - enteredBatchSize;
        
        // Generate new DispatchUniqueId for the remaining portion moving to FG
        const generateDispatchUniqueId = () => {
          const timestamp = Date.now().toString().slice(-8);
          const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          return `DISP-${timestamp}-${randomNum}`;
        };
        
        const newDispatchUniqueId = generateDispatchUniqueId();
        
        // Create a new dispatch record for the remaining portion moving to FG
        const newDispatchRecord = {
          DispatchUniqueId: newDispatchUniqueId,
          UniqueId: dispatchRecord.UniqueId,
          ClientCode: dispatchRecord.ClientCode,
          ProductCode: dispatchRecord.ProductCode,
          ProductName: dispatchRecord.ProductName,
          BatchNumber: dispatchRecord.BatchNumber,
          BatchSize: originalBatchSize.toString(), // Always preserve original batch size (e.g., 1005 pcs)
          updatedBatch: enteredBatchSize.toString(),
          DispatchDate: dispatchRecord.DispatchDate || new Date().toLocaleDateString('en-GB'),
          DateEntry: new Date().toLocaleDateString('en-GB'),
          CreatedAt: new Date().toISOString(),
          Dispatched: dispatchRecord.Dispatched || "No",
          store1Status: dispatchRecord.store1Status || "COMPLETED",
          cableProdStatus: dispatchRecord.cableProdStatus || "COMPLETED",
          store2Status: dispatchRecord.store2Status || "COMPLETED",
          mouldingProdStatus: "COMPLETED",
          fgSectionStatus: "NEW",
          DispatchStatus: dispatchRecord.DispatchStatus || "NEW",
          dispatchStatus: dispatchRecord.dispatchStatus || "NEW",
          deliveryStatus: dispatchRecord.deliveryStatus || "NEW",
          moveToFg: enteredBatchSize.toString(),
          mouldingRemaining: "",
          LastModified: new Date().toISOString().split('T')[0]
        };
        
        // Prepare move history entry for remaining quantity move
        const moveHistoryEntry = {
          date: new Date().toLocaleDateString('en-GB'),
          quantity: enteredBatchSize,
          remaining: newRemaining > 0 ? newRemaining : 0,
          details: `Remaining ${enteredBatchSize.toLocaleString()} pcs moved to FG Section${newRemaining > 0 ? `, ${newRemaining.toLocaleString()} pcs still remaining` : ', all remaining quantity moved'}`
        };
        
        // Get existing move history and append new entry
        let existingHistory = [];
        if (dispatchRecord.moveHistory) {
          try {
            const parsed = typeof dispatchRecord.moveHistory === 'string' 
              ? JSON.parse(dispatchRecord.moveHistory) 
              : dispatchRecord.moveHistory;
            existingHistory = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {
            existingHistory = [];
          }
        }
        
        // Append new move to history
        existingHistory.push(moveHistoryEntry);
        const updatedMoveHistory = JSON.stringify(existingHistory);
        
        // Update original record: update remaining quantity
        const updatedRecord = {
          ...dispatchRecord,
          mouldingRemaining: newRemaining > 0 ? newRemaining.toString() : "0",
          mouldingRemair: newRemaining > 0 ? newRemaining.toString() : "0",
          moveHistory: updatedMoveHistory, // Update move history with remaining quantity move
          LastModified: new Date().toISOString().split('T')[0]
        };
        
        // Update original record and create new record
        await Promise.all([
          sheetService.updateRow("Dispatches", dispatchIndex + 2, updatedRecord),
          sheetService.appendRow("Dispatches", newDispatchRecord)
        ]);
        
        // Show success message
        setSuccessMessage(
          `Remaining ${enteredBatchSize.toLocaleString()} pcs moved to FG Section (Batch ${newDispatchUniqueId})${newRemaining > 0 ? `, ${newRemaining.toLocaleString()} pcs still remaining in Molding` : ', all remaining quantity moved'}`
        );
      } else {
        // Normal batch size update
        const updatedRecord = {
          ...dispatchRecord,
          updatedBatch: newBatchSize.toString(), // Update the updatedBatch column
          // BatchSize remains unchanged (original batch size stored in store 1)
          LastModified: new Date().toISOString().split('T')[0]
        };

        await sheetService.updateRow("Dispatches", dispatchIndex + 2, updatedRecord);

        // Show success message
        setSuccessMessage(`Batch size updated to ${newBatchSize.toLocaleString()} pcs for ${task.DispatchUniqueId || task.UniqueId}`);
      }

      setSuccessOpen(true);

      // Refresh tasks to show updated data
      await fetchTasks(true);

    } catch (error) {
      console.error("Error updating batch size:", error);
      setError(error.message || "Failed to update batch size");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessOpen(false);
  };

  // Handler for updating existing dispatch statuses
  const handleUpdateDispatchStatuses = async () => {
    try {
      setUpdatingStatuses(true);
      setError(null);

      const result = await dispatchService.updateExistingDispatchStatuses();

      setSuccessMessage(result.message);
      setSuccessOpen(true);
      
      // Refresh tasks to show updated data
      await fetchTasks(true);
      
    } catch (error) {
      console.error("Error updating dispatch statuses:", error);
      setError(error.message || "Failed to update dispatch statuses");
    } finally {
      setUpdatingStatuses(false);
    }
  };

  // Helper function to get workflow status for a task
  const getWorkflowStatus = (task) => {
    if (!task._fromDispatches) return null;
    
    const statuses = {
      store1: task.store1Status || 'NEW',
      cableProd: task.cableProdStatus || 'NEW',
      store2: task.store2Status || 'NEW',
      moulding: task.mouldingProdStatus || 'NEW',
      fgSection: task.fgSectionStatus || 'NEW',
      dispatch: task.DispatchStatus || 'NEW'
    };
    
    const completedStages = Object.values(statuses).filter(status => status === 'COMPLETED').length;
    const totalStages = Object.keys(statuses).length;
    
    return {
      completedStages,
      totalStages,
      percentage: Math.round((completedStages / totalStages) * 100),
      canMove: task.Status === 'COMPLETED'
    };
  };

  // Helper function to calculate due date for a specific stage from dispatch date
  const calculateDueDateForStage = (dispatchDateStr, daysBeforeDispatch) => {
    if (!dispatchDateStr) return null;
    
    // Parse dispatch date (DD/MM/YYYY or YYYY-MM-DD format)
    let dispatchDate;
    if (dispatchDateStr.includes('/')) {
      // DD/MM/YYYY format
      const parts = dispatchDateStr.split('/');
      dispatchDate = new Date(parts[2], parts[1] - 1, parts[0]);
    } else if (dispatchDateStr.includes('-')) {
      // YYYY-MM-DD format
      dispatchDate = new Date(dispatchDateStr);
    } else {
      return null;
    }
    
    // Use working days calculation to skip holidays and Sundays
    const dueDate = subtractWorkingDays(dispatchDate, daysBeforeDispatch);
    
    return dueDate.toISOString();
  };

  // Helper function to get dispatch data for a specific stage with calculated due date
  const getDispatchDataForStage = (status, daysBeforeDispatch, timeRangeParam) => {
    // Use provided time range or get current tab's time range
    const range = timeRangeParam || getCurrentTimeRange();
    const sourceDispatches = getTimeFilteredDispatches(range);

    if (!sourceDispatches || sourceDispatches.length === 0) {

      return [];
    }
    
    // Filter dispatches - include those with dispatch date OR those marked as dispatched
    // If a dispatch record exists (Dispatched=Yes), we should show it even if date is missing
    let filteredDispatches = sourceDispatches.filter(dispatch => {
      const hasDispatchDate = dispatch.DispatchDate && dispatch.DispatchDate !== '';
      const isDispatchedRecord = dispatch.Dispatched === "Yes";

      // Include if has dispatch date OR is marked as dispatched (we'll look up date from PO_Master)
      return hasDispatchDate || isDispatchedRecord;
    });
    
    // SHOW ALL TASKS: Show all dispatch records that have any status in this stage
    // This ensures we see all tasks regardless of their status (NEW, COMPLETED, etc.)
    filteredDispatches = filteredDispatches.filter(dispatch => {
      let isInCurrentStage = false;
      
      switch (status) {
        case config.statusCodes.STORE1:
          // Show ALL tasks that have store1Status (regardless of value)
          isInCurrentStage = dispatch.store1Status && dispatch.store1Status.trim() !== '';
          break;
        case config.statusCodes.CABLE_PRODUCTION:
          // Show ALL tasks that have cableProdStatus (regardless of value)
          isInCurrentStage = dispatch.cableProdStatus && dispatch.cableProdStatus.trim() !== '';
          break;
        case config.statusCodes.STORE2:
          // Show ALL tasks that have store2Status (regardless of value)
          isInCurrentStage = dispatch.store2Status && dispatch.store2Status.trim() !== '';
          break;
        case config.statusCodes.MOULDING:
          // Show ALL tasks that have mouldingProdStatus (regardless of value)
          isInCurrentStage = dispatch.mouldingProdStatus && dispatch.mouldingProdStatus.trim() !== '';
          break;
        case config.statusCodes.FG_SECTION:
          // Show ALL tasks that have fgSectionStatus (regardless of value)
          isInCurrentStage = dispatch.fgSectionStatus && dispatch.fgSectionStatus.trim() !== '';
          break;
        case config.statusCodes.DISPATCH:
          // Show ALL tasks that have DispatchStatus (regardless of value)
          // Handle both DispatchStatus and dispatchStatus (case variations)
          const dispatchStatus = dispatch.DispatchStatus || dispatch.dispatchStatus;
          const hasDispatchStatus = dispatchStatus && dispatchStatus.trim() !== '';
          
          // ENHANCED LOGIC: Show tasks that are ready for dispatch
          // 1. Tasks that have DispatchStatus set
          // 2. Tasks that have completed ALL previous stages (Store1, Cable, Store2, Moulding, FG Section)
          const allPreviousStagesCompleted = 
            dispatch.store1Status && getStatusOnly(dispatch.store1Status) === 'COMPLETED' &&
            dispatch.cableProdStatus && getStatusOnly(dispatch.cableProdStatus) === 'COMPLETED' &&
            dispatch.store2Status && getStatusOnly(dispatch.store2Status) === 'COMPLETED' &&
            dispatch.mouldingProdStatus && getStatusOnly(dispatch.mouldingProdStatus) === 'COMPLETED' &&
            dispatch.fgSectionStatus && getStatusOnly(dispatch.fgSectionStatus) === 'COMPLETED';
          
          isInCurrentStage = hasDispatchStatus || allPreviousStagesCompleted;
          
          // Enhanced debug logging for dispatch status

          break;
        default:
          isInCurrentStage = true; // Show all for unknown stages
      }

      return isInCurrentStage;
    });

    // IMPORTANT: Don't group by UniqueId - each dispatch record should be shown separately
    // Each dispatch has a unique DispatchUniqueId and represents a separate batch
    const dispatchItems = filteredDispatches.map((dispatch, index) => {
      const uniqueId = dispatch.UniqueId;
      
      // Find the corresponding task from PO_Master first to check for fallback date
      const task = tasks.find(t => t.UniqueId === uniqueId || t.POId === dispatch.POId);
      
      // Use dispatch date from Dispatches sheet only (no fallback to PO_Master)
      const dispatchDate = dispatch.DispatchDate;
      
      // Calculate stage-specific due date from dispatch date
      // For completed tasks, try to use the stored due date from PO_Master to preserve original due date
      // For non-completed tasks, calculate dynamically based on current stage
      let stageDueDate;
      
      // Check if task is completed in any stage
      const isCompleted = dispatch.store1Status === 'COMPLETED' || 
                         dispatch.cableProdStatus === 'COMPLETED' || 
                         dispatch.store2Status === 'COMPLETED' || 
                         dispatch.mouldingProdStatus === 'COMPLETED' || 
                         dispatch.fgSectionStatus === 'COMPLETED' || 
                         dispatch.DispatchStatus === 'COMPLETED' || 
                         dispatch.dispatchStatus === 'COMPLETED';
      
      if (isCompleted && task) {
        // For completed tasks, try to use stored due date from PO_Master based on current stage
        let storedDueDate = null;
        
        switch (status) {
          case config.statusCodes.STORE1:
            storedDueDate = task.Store1DueDate;
            break;
          case config.statusCodes.CABLE_PRODUCTION:
            storedDueDate = task.CableProductionDueDate;
            break;
          case config.statusCodes.STORE2:
            storedDueDate = task.Store2DueDate;
            break;
          case config.statusCodes.MOULDING:
            storedDueDate = task.MouldingDueDate;
            break;
          case config.statusCodes.FG_SECTION:
            storedDueDate = task.FGSectionDueDate;
            break;
          case config.statusCodes.DISPATCH:
            storedDueDate = task.DispatchDate;
            break;
        }
        
        if (storedDueDate) {
          // Use stored due date if available
          stageDueDate = storedDueDate;
        } else {
          // Fallback to dynamic calculation if no stored date
          stageDueDate = calculateDueDateForStage(dispatchDate, daysBeforeDispatch);
        }
      } else {
        // For non-completed tasks, always calculate dynamically
        stageDueDate = calculateDueDateForStage(dispatchDate, daysBeforeDispatch);
      }

      // Create a unique key for this dispatch item to prevent duplication
      const uniqueKey = `${dispatch.DispatchUniqueId}-${index}`;
      
      // Get the actual status from the Google Sheet based on the stage
      let actualStatus = status; // Default to the stage name if no specific status found
      let actualStatusString = 'NEW';
      
      switch (status) {
        case config.statusCodes.STORE1:
          actualStatusString = dispatch.store1Status || 'NEW';
          actualStatus = getStatusOnly(actualStatusString);
          break;
        case config.statusCodes.CABLE_PRODUCTION:
          actualStatusString = dispatch.cableProdStatus || 'NEW';
          actualStatus = getStatusOnly(actualStatusString);
          break;
        case config.statusCodes.STORE2:
          actualStatusString = dispatch.store2Status || 'NEW';
          actualStatus = getStatusOnly(actualStatusString);
          break;
        case config.statusCodes.MOULDING:
          actualStatusString = dispatch.mouldingProdStatus || 'NEW';
          actualStatus = getStatusOnly(actualStatusString);
          break;
        case config.statusCodes.FG_SECTION:
          actualStatusString = dispatch.fgSectionStatus || 'NEW';
          actualStatus = getStatusOnly(actualStatusString);
          break;
        case config.statusCodes.DISPATCH:
          actualStatusString = dispatch.DispatchStatus || dispatch.dispatchStatus || 'NEW';
          actualStatus = getStatusOnly(actualStatusString);
          break;
        case config.statusCodes.DELIVERED:
          actualStatusString = dispatch.deliveryStatus || 'NEW';
          actualStatus = getStatusOnly(actualStatusString);
          break;
        default:
          actualStatus = status;
      }

      // Parse the status to get completion date and due date
      const parsedStatus = parseStatusWithDate(actualStatusString);
      const statusDueDate = parsedStatus.dueDate;
      const statusCompletionDate = parsedStatus.completionDate;
      
      // CRITICAL FIX: Always use dispatch sheet data directly, don't merge with PO_Master
      // This ensures we show the correct Unique ID from the dispatch sheet
      return {
        // Use dispatch sheet data as primary source
        UniqueId: uniqueId, // This is the Unique ID from dispatch sheet
        DispatchUniqueId: dispatch.DispatchUniqueId,
        ClientCode: dispatch.ClientCode,
        ProductCode: dispatch.ProductCode,
        ProductName: dispatch.ProductName,
        Quantity: dispatch.Quantity || dispatch.BatchSize,
        BatchSize: dispatch.BatchSize, // Original batch size (stored in store 1)
        updatedBatch: dispatch.updatedBatch, // Updated batch size from dispatch sheet
        BatchNumber: dispatch.BatchNumber,
        Status: actualStatus, // Use the actual status from the sheet
        StatusString: actualStatusString, // Store the full status string with date
        CompletionDate: statusCompletionDate, // Extract completion date
        DueDate: statusDueDate || stageDueDate, // Use due date from status, fallback to calculated
        DispatchDate: dispatch.DispatchDate, // Use dispatch date from dispatch sheet only
        Name: `${dispatch.ProductName || dispatch.ProductCode} for ${dispatch.ClientCode}`,
        AssignedTo: 'store.manager@reyanshelectronics.com', // Default assignment based on stage
        _fromDispatches: true,
        // Add unique key to prevent React key conflicts
        _uniqueKey: uniqueKey,
        // Add current stage information for action buttons - determine based on actual status
        // IMPORTANT: Use currentStage prop from activeTab as primary source, not task._currentStage
        // This ensures correct stage identification for action buttons
        _currentStage: status, // Use the status parameter which comes from the active tab
        // Optional: Include some PO_Master data for reference (but don't override dispatch data)
        POId: task?.POId || dispatch.POId,
        SOId: task?.SOId || dispatch.SOId,
        // Include batch split information
        mouldingRemaining: dispatch.mouldingRemaining || dispatch.mouldingRemair || '', // Remaining quantity in molding
        mouldingRemair: dispatch.mouldingRemair || dispatch.mouldingRemaining || '', // Remaining quantity in molding (alternative)
        moveToFg: dispatch.moveToFg || '', // Quantity moving to FG
        moveHistory: dispatch.moveHistory || '', // Move history data (object with quantity, date, remaining details)
        // Include dispatch record data for dependency checking
        _dispatchRecord: dispatch
      };
    });

    return dispatchItems;
  };

  // Helper function to parse date from sheet (handles YYYY-MM-DD, DD/MM/YYYY, and other formats)
  const parseDateFromSheet = (dateValue) => {
    if (!dateValue) return null;
    
    // Trim whitespace and check if empty
    const trimmed = String(dateValue).trim();
    if (!trimmed || trimmed === '' || trimmed === 'N/A' || trimmed === 'null' || trimmed === 'undefined') {
      return null;
    }
    
    try {
      // Try parsing YYYY-MM-DD format first (what we save)
      if (trimmed.match(/^\d{4}-\d{2}-\d{2}/)) {
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      // Try parsing DD/MM/YYYY format
      if (trimmed.includes('/')) {
        const parts = trimmed.split('/');
        if (parts.length === 3) {
          // Check if it's DD/MM/YYYY or MM/DD/YYYY by checking if first part > 12
          const firstPart = parseInt(parts[0], 10);
          const secondPart = parseInt(parts[1], 10);
          const thirdPart = parseInt(parts[2], 10);
          
          if (firstPart > 12) {
            // DD/MM/YYYY format
            const day = firstPart;
            const month = secondPart - 1;
            const year = thirdPart;
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
              return date;
            }
          } else if (secondPart > 12) {
            // MM/DD/YYYY format
            const month = firstPart - 1;
            const day = secondPart;
            const year = thirdPart;
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
              return date;
            }
          }
        }
      }
      
      // Try standard Date parsing
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (e) {
      console.warn('Error parsing date:', trimmed, e);
    }
    
    return null;
  };

  // Filter tasks based on the active tab
  const getFilteredTasks = () => {
    // Debug: Log dispatches and clients data availability for Complete O2D
    if (activeTab === 0) {
      console.log('Complete O2D - Data Check:', {
        dispatchesCount: dispatches?.length || 0,
        clientsCount: clients?.length || 0,
        hasDispatches: !!dispatches && dispatches.length > 0,
        hasClients: !!clients && clients.length > 0
      });
    }
    
    switch (activeTab) {
      case 0: // Complete O2D
        // Show all dispatches that have been dispatched (Dispatched === "Yes")
        // This fetches data from both Dispatches sheet and Clients sheet
        // Apply Complete O2D time range filter first
        const completeO2DTimeFilteredDispatches = getTimeFilteredDispatches(completeO2DTimeRange);
        if (!completeO2DTimeFilteredDispatches || completeO2DTimeFilteredDispatches.length === 0) {
          console.warn('Complete O2D: No dispatches data available');
          return [];
        }

        const completeO2DDispatches = completeO2DTimeFilteredDispatches.filter(dispatch => {
          // Show dispatches that have been marked as dispatched
          // This is simpler and more reliable than checking all 6 stage statuses
          const isDispatched = dispatch.Dispatched === "Yes" || dispatch.Dispatched === "yes" || dispatch.Dispatched === "YES";
          
          // Debug logging for first few dispatches
          if (completeO2DTimeFilteredDispatches.indexOf(dispatch) < 5) {
            console.log('Complete O2D Check:', {
              DispatchUniqueId: dispatch.DispatchUniqueId,
              ClientCode: dispatch.ClientCode,
              ProductCode: dispatch.ProductCode,
              Dispatched: dispatch.Dispatched,
              isDispatched,
              store1Status: dispatch.store1Status,
              cableProdStatus: dispatch.cableProdStatus,
              store2Status: dispatch.store2Status,
              mouldingStatus: dispatch.mouldingProdStatus,
              fgSectionStatus: dispatch.fgSectionStatus,
              dispatchStatus: dispatch.DispatchStatus || dispatch.dispatchStatus
            });
          }
          
          return isDispatched;
        });
        
        console.log('Complete O2D Filter Result:', {
          totalDispatches: completeO2DTimeFilteredDispatches.length,
          completeO2DCount: completeO2DDispatches.length,
          filteredDispatches: completeO2DDispatches.map(d => ({
            DispatchUniqueId: d.DispatchUniqueId,
            ClientCode: d.ClientCode
          }))
        });
        
        // Merge data from both Dispatches sheet and Clients sheet
        return completeO2DDispatches.map((dispatch, index) => {
          // STEP 1: Find client information from Clients sheet
          // Match by ClientCode (case-insensitive)
          const client = clients.find(c => 
            c.clientCode === dispatch.ClientCode || 
            c.clientCode?.toLowerCase() === dispatch.ClientCode?.toLowerCase()
          );
          
          if (index < 3) {
            console.log('Merging data from both sheets:', {
              DispatchUniqueId: dispatch.DispatchUniqueId,
              ClientCode: dispatch.ClientCode,
              foundClient: !!client,
              clientProductsCount: client?.products?.length || 0
            });
          }
          
          // STEP 2: Find matching product from client's Products column in Clients sheet
          // The Clients sheet has a Products column containing an array of products
          let clientProduct = null;
          if (client?.products && Array.isArray(client.products)) {
            clientProduct = client.products.find(p => {
              // Match by product code (case-insensitive)
              const productCodeMatch = 
                p.productCode?.toLowerCase() === dispatch.ProductCode?.toLowerCase() ||
                p.code?.toLowerCase() === dispatch.ProductCode?.toLowerCase();
              // Match by product name (case-insensitive)
              const productNameMatch = 
                p.productName?.toLowerCase() === dispatch.ProductName?.toLowerCase() ||
                p.name?.toLowerCase() === dispatch.ProductName?.toLowerCase();
              return productCodeMatch || productNameMatch;
            });
            
            if (index < 3 && clientProduct) {
              console.log('Found matching product from Clients sheet:', {
                productCode: clientProduct.productCode || clientProduct.code,
                hasSpec: !!clientProduct.specification,
                hasNumberOfCore: !!clientProduct.numberOfCore
              });
            }
          }
          
          // STEP 3: Merge data from both sheets
          // Priority: Use product data from Clients sheet Products column if available,
          // otherwise fall back to data from Dispatches sheet
          const productCode = dispatch.ProductCode || clientProduct?.productCode || clientProduct?.code || '';
          const productSpec = clientProduct?.specification || clientProduct?.spec || clientProduct?.description || '';
          
          // Build enriched task object with all dispatch and client data
          return {
            UniqueId: dispatch.UniqueId,
            DispatchUniqueId: dispatch.DispatchUniqueId,
            ClientCode: dispatch.ClientCode,
            ClientName: client?.clientName || dispatch.ClientName || '',
            ProductCode: productCode,
            ProductName: dispatch.ProductName || clientProduct?.productName || clientProduct?.name || '',
            Quantity: dispatch.Quantity || dispatch.BatchSize,
            BatchSize: dispatch.BatchSize,
            updatedBatch: dispatch.updatedBatch,
            BatchNumber: dispatch.BatchNumber,
            Status: 'COMPLETED',
            StatusString: 'COMPLETED',
            CompletionDate: dispatch.DispatchDate,
            DueDate: dispatch.DispatchDate,
            DispatchDate: dispatch.DispatchDate,
            DateEntry: dispatch.DateEntry || dispatch['Date Entry'] || dispatch.DateOfEntry || dispatch['Date of Entry'] || (dispatch.CreatedAt ? new Date(dispatch.CreatedAt).toISOString().split('T')[0] : ''),
            // Calculate due dates from DispatchDate (working backwards using working days)
            // Priority: 1) Use updated date from sheet if exists, 2) Calculate from DispatchDate
            // Store 1 Due Date: D-5 working days
            Store1DueDate: (() => {
              // First priority: Check if updated date exists in dispatch sheet
              const sheetDate = parseDateFromSheet(dispatch.Store1DueDate);
              if (sheetDate) {
                return sheetDate.toISOString().split('T')[0];
              }
              
              // Second priority: Calculate from DispatchDate using working days
              const dispatchDate = parseDateFromSheet(dispatch.DispatchDate);
              if (dispatchDate) {
                // D-5: Store 1 Due Date (5 working days before dispatch)
                const store1DueDate = subtractWorkingDays(dispatchDate, 5);
                return store1DueDate.toISOString().split('T')[0];
              }
              
              return '';
            })(),
            // Cable Manufacturing Date: Show Cable Production Due Date (D-4 working days)
            // Priority: 1) Use updated date from sheet if exists, 2) Calculate from DispatchDate
            CableManufacturingDate: (() => {
              // First priority: Check if updated date exists in dispatch sheet
              const sheetDate = parseDateFromSheet(dispatch.CableProductionDueDate);
              if (sheetDate) {
                return sheetDate.toISOString().split('T')[0];
              }
              
              // Second priority: Calculate from DispatchDate using working days
              const dispatchDate = parseDateFromSheet(dispatch.DispatchDate);
              if (dispatchDate) {
                // D-4: Cable Production Due Date (4 working days before dispatch)
                const cableDueDate = subtractWorkingDays(dispatchDate, 4);
                return cableDueDate.toISOString().split('T')[0];
              }
              
              return '';
            })(),
            // Store 2 Due Date: D-3 working days
            // Priority: 1) Use updated date from sheet if exists, 2) Calculate from DispatchDate
            Store2DueDate: (() => {
              // First priority: Check if updated date exists in dispatch sheet
              const sheetDate = parseDateFromSheet(dispatch.Store2DueDate);
              if (sheetDate) {
                return sheetDate.toISOString().split('T')[0];
              }
              
              // Second priority: Calculate from DispatchDate using working days
              const dispatchDate = parseDateFromSheet(dispatch.DispatchDate);
              if (dispatchDate) {
                // D-3: Store 2 Due Date (3 working days before dispatch)
                const store2DueDate = subtractWorkingDays(dispatchDate, 3);
                return store2DueDate.toISOString().split('T')[0];
              }
              
              return '';
            })(),
            // Moulding Date: Show Moulding Due Date (D-2 working days)
            // Priority: 1) Use updated date from sheet if exists, 2) Calculate from DispatchDate
            MouldingDate: (() => {
              // First priority: Check if updated date exists in dispatch sheet
              const sheetDate = parseDateFromSheet(dispatch.MouldingDueDate);
              if (sheetDate) {
                return sheetDate.toISOString().split('T')[0];
              }
              
              // Second priority: Calculate from DispatchDate using working days
              const dispatchDate = parseDateFromSheet(dispatch.DispatchDate);
              if (dispatchDate) {
                // D-2: Moulding Due Date (2 working days before dispatch)
                const mouldingDueDate = subtractWorkingDays(dispatchDate, 2);
                return mouldingDueDate.toISOString().split('T')[0];
              }
              
              return '';
            })(),
            // FG Section Date: Show FG Section Due Date (D-1 working day)
            // Priority: 1) Use updated date from sheet if exists, 2) Calculate from DispatchDate
            FGSectionDate: (() => {
              // First priority: Check if updated date exists in dispatch sheet
              const sheetDate = parseDateFromSheet(dispatch.FGSectionDueDate);
              if (sheetDate) {
                return sheetDate.toISOString().split('T')[0];
              }
              
              // Second priority: Calculate from DispatchDate using working days
              const dispatchDate = parseDateFromSheet(dispatch.DispatchDate);
              if (dispatchDate) {
                // D-1: FG Section Due Date (1 working day before dispatch)
                const fgDueDate = subtractWorkingDays(dispatchDate, 1);
                return fgDueDate.toISOString().split('T')[0];
              }
              
              return '';
            })(),
            Name: `${productCode} for ${dispatch.ClientCode}`,
            AssignedTo: 'system@reyanshelectronics.com',
            _fromDispatches: true,
            _uniqueKey: `complete-o2d-${dispatch.DispatchUniqueId}-${index}`,
            _currentStage: 'COMPLETE_O2D',
            _dispatchRecord: dispatch,
            // Include all dispatch fields from Dispatches sheet for Complete O2D view
            // TotalLength: Fetch from Clients sheet Products column first, then fallback to Dispatches sheet
            TotalLength: clientProduct?.totalLength || dispatch.TotalLength || dispatch.CableLength || '',
            // Calculate TotalCable as TotalLength * BatchSize (use original BatchSize for Complete O2D)
            TotalCable: (() => {
              // Get TotalLength from Clients sheet Products column first, then fallback to Dispatches sheet
              const totalLength = parseFloat(
                clientProduct?.totalLength || 
                dispatch.TotalLength || 
                dispatch.CableLength || 
                0
              );
              // For Complete O2D, use original BatchSize/Quantity, not updatedBatch
              const batchSize = parseFloat(dispatch.BatchSize || dispatch.Quantity || 0);
              if (totalLength > 0 && batchSize > 0) {
                return (totalLength * batchSize).toFixed(2);
              }
              // Fallback to direct value if calculation not possible
              return dispatch.TotalCable || '';
            })(),
            // Product specifications: Use Clients sheet Products column data if available, else Dispatches sheet
            NumberOfCores: dispatch.NumberOfCores || dispatch.Cores || clientProduct?.numberOfCore || '',
            CopperStrands: dispatch.CopperStrands || clientProduct?.strandCount || '',
            CopperGauge: dispatch.CopperGauge || clientProduct?.conductorSize || '',
            CoreOD: dispatch.CoreOD || dispatch['Core OD'] || clientProduct?.coreOD || '',
            OuterOD: dispatch.OuterOD || dispatch['Outer OD'] || clientProduct?.sheathOD || '',
            CopperConsumption: dispatch.CopperConsumption || '',
            PVCCore: dispatch.PVCCore || dispatch['PVC Core'] || clientProduct?.corePVC || '',
            PVCSheath: dispatch.PVCSheath || dispatch['PVC Sheath'] || clientProduct?.sheathOuterPVC || '',
            PVCType: dispatch.PVCType || dispatch['PVC Type'] || '',
            PP: dispatch.PP || '',
            PVCMoulding: dispatch.PVCMoulding || dispatch['PVC Moulding'] || '',
            PVCTypeMoulding: dispatch.PVCTypeMoulding || dispatch['PVC Type (Moulding)'] || '',
            PVCGrommet: dispatch.PVCGrommet || dispatch['PVC Grommet'] || '',
            // Client data from Clients sheet
            ClientAddress: client?.address || '',
            ClientCity: client?.city || '',
            ClientState: client?.state || '',
            ClientGSTIN: client?.gstin || '',
            ClientProducts: client?.products || [],
            // Product data from Clients sheet
            ClientProduct: clientProduct,
            // Product specification from Clients sheet
            ProductSpecification: productSpec
          };
        });

        console.log('Complete O2D Final Result:', {
          count: completeO2DDispatches.length,
          sample: completeO2DDispatches[0] ? {
            DispatchUniqueId: completeO2DDispatches[0].DispatchUniqueId,
            ClientCode: completeO2DDispatches[0].ClientCode,
            ProductCode: completeO2DDispatches[0].ProductCode
          } : null,
          allIds: completeO2DDispatches.map(d => d.DispatchUniqueId)
        });

        return completeO2DDispatches;
        
      case 1: // Store 1
        // ONLY show dispatch records from Dispatches sheet (they have complete batch info)
        // Apply shared production stages time range filter
        const store1Dispatches = getDispatchDataForStage(config.statusCodes.STORE1, 5, productionStagesTimeRange); // D-5 days
        return store1Dispatches;
        
      case 2: // Cable Production
        // ONLY show dispatch records from Dispatches sheet
        // Apply shared production stages time range filter
        const cableDispatches = getDispatchDataForStage(config.statusCodes.CABLE_PRODUCTION, 4, productionStagesTimeRange); // D-4 days
        return cableDispatches;
        
      case 3: // Store 2
        // ONLY show dispatch records from Dispatches sheet
        // Apply shared production stages time range filter
        const store2Dispatches = getDispatchDataForStage(config.statusCodes.STORE2, 3, productionStagesTimeRange); // D-3 days
        return store2Dispatches;
        
      case 4: // Moulding
        // ONLY show dispatch records from Dispatches sheet
        // Apply shared production stages time range filter
        const mouldingDispatches = getDispatchDataForStage(config.statusCodes.MOULDING, 2, productionStagesTimeRange); // D-2 days
        return mouldingDispatches;
        
      case 5: // FG Section (QC)
        // ONLY show dispatch records from Dispatches sheet
        // Apply shared production stages time range filter
        const fgDispatches = getDispatchDataForStage(config.statusCodes.FG_SECTION, 1, productionStagesTimeRange); // D-1 day
        return fgDispatches;
        
      case 6: // Dispatch
        // ONLY show dispatch records from Dispatches sheet
        // Apply shared production stages time range filter
        const dispatchDispatches = getDispatchDataForStage(config.statusCodes.DISPATCH, 0, productionStagesTimeRange); // D (dispatch day)
        return dispatchDispatches;
        
      case 7: // Upload Receiving Documents
        // Show ALL dispatches that exist (not yet delivered)
        // Apply Upload Receiving time range filter first
        const uploadReceivingTimeFilteredDispatches = getTimeFilteredDispatches(uploadReceivingTimeRange);

        const receivingDispatches = uploadReceivingTimeFilteredDispatches.filter(dispatch => {
          // Show all dispatches that have been created (Dispatched = "Yes")
          const hasDispatchRecord = dispatch.Dispatched === "Yes";
          // But not yet delivered
          const isNotDelivered = !dispatch.deliveryStatus || dispatch.deliveryStatus !== 'COMPLETED';

          return hasDispatchRecord && isNotDelivered;
        }).map((dispatch, index) => {
          // Map to task format similar to other tabs
          return {
            UniqueId: dispatch.UniqueId,
            DispatchUniqueId: dispatch.DispatchUniqueId,
            ClientCode: dispatch.ClientCode,
            ProductCode: dispatch.ProductCode,
            ProductName: dispatch.ProductName,
            Quantity: dispatch.Quantity || dispatch.BatchSize,
            BatchSize: dispatch.BatchSize, // Original batch size (stored in store 1)
            updatedBatch: dispatch.updatedBatch, // Updated batch size from dispatch sheet
            BatchNumber: dispatch.BatchNumber,
            Status: getStatusOnly(dispatch.DispatchStatus || dispatch.dispatchStatus || 'NEW'),
            StatusString: dispatch.DispatchStatus || dispatch.dispatchStatus || 'NEW',
            CompletionDate: null,
            DueDate: dispatch.DispatchDate,
            DispatchDate: dispatch.DispatchDate,
            Name: `${dispatch.ProductName || dispatch.ProductCode} for ${dispatch.ClientCode}`,
            AssignedTo: 'dispatch.manager@reyanshelectronics.com',
            receivingDocuments: dispatch.receivingDocuments || '[]',
            _fromDispatches: true,
            _uniqueKey: `${dispatch.DispatchUniqueId}-${index}`,
            _currentStage: 'RECEIVING_DOCUMENTS',
            _dispatchRecord: dispatch
          };
        });

        return receivingDispatches;
        
      default:
        return tasks;
    }
  };

  // Count tasks by status
  const getStatusCount = (status) => {
    return tasks.filter((task) => task.Status === status).length;
  };

  // Get count for each tab - matching the actual filtered data logic
  const getTabCount = (tabIndex) => {
    switch (tabIndex) {
      case 0: // Complete O2D
        // Use the same logic as getFilteredTasks() for consistency
        // Show dispatches that have been dispatched (Dispatched === "Yes")
        // Apply Complete O2D time range filter first
        const completeO2DTimeFilteredForCount = getTimeFilteredDispatches(completeO2DTimeRange);
        if (!completeO2DTimeFilteredForCount || completeO2DTimeFilteredForCount.length === 0) return 0;
        return completeO2DTimeFilteredForCount.filter(dispatch => {
          const isDispatched = dispatch.Dispatched === "Yes" || dispatch.Dispatched === "yes" || dispatch.Dispatched === "YES";
          return isDispatched;
        }).length;
      case 1: // Store 1
        return getDispatchDataForStage(config.statusCodes.STORE1, 5, productionStagesTimeRange).length;
      case 2: // Cable Production
        return getDispatchDataForStage(config.statusCodes.CABLE_PRODUCTION, 4, productionStagesTimeRange).length;
      case 3: // Store 2
        return getDispatchDataForStage(config.statusCodes.STORE2, 3, productionStagesTimeRange).length;
      case 4: // Moulding
        return getDispatchDataForStage(config.statusCodes.MOULDING, 2, productionStagesTimeRange).length;
      case 5: // FG Section
        return getDispatchDataForStage(config.statusCodes.FG_SECTION, 1, productionStagesTimeRange).length;
      case 6: // Dispatch
        return getDispatchDataForStage(config.statusCodes.DISPATCH, 0, productionStagesTimeRange).length;
      case 7: // Upload Receiving
        // Apply Upload Receiving time range filter first
        const uploadReceivingTimeFilteredForCount = getTimeFilteredDispatches(uploadReceivingTimeRange);
        return uploadReceivingTimeFilteredForCount.filter(dispatch => {
          const hasDispatchRecord = dispatch.Dispatched === "Yes";
          const isNotDelivered = !dispatch.deliveryStatus || dispatch.deliveryStatus !== 'COMPLETED';
          return hasDispatchRecord && isNotDelivered;
        }).length;
      default:
        return 0;
    }
  };

  // Calculate efficiency metrics
  const getEfficiencyMetrics = () => {
    // Get total unique dispatch records (not double-counting across stages)
    // Use 'all' for efficiency metrics to show overall performance
    const list = getTimeFilteredDispatches('all');
    const totalDispatches = list ? list.length : 0;
    
    // Count completed (delivered) dispatches
    const completed = list ? list.filter(dispatch => dispatch.deliveryStatus === 'COMPLETED').length : 0;
    
    // Count in-progress dispatches (all non-delivered dispatches)
    const inProgress = totalDispatches - completed;
    
    return {
      total: totalDispatches,
      completed,
      inProgress,
      completionRate: totalDispatches > 0 ? Math.round((completed / totalDispatches) * 100) : 0,
      efficiency: totalDispatches > 0 ? Math.round(((completed + inProgress * 0.5) / totalDispatches) * 100) : 0
    };
  };

  const metrics = getEfficiencyMetrics();

  // Get tab icon based on index
  const getTabIcon = (index) => {
    switch (index) {
      case 0: return <Timeline />; // Complete O2D
      case 1: return <Inventory />; // Store 1
      case 2: return <Build />; // Cable Production
      case 3: return <Inventory />; // Store 2
      case 4: return <PrecisionManufacturing />; // Moulding
      case 5: return <Verified />; // FG Section
      case 6: return <LocalShipping />; // Dispatch
      case 7: return <CloudUpload />; // Upload Receiving
      default: return <Timeline />;
    }
  };

  // Get tab color based on index
  const getTabColor = (index) => {
    switch (index) {
      case 0: return '#1976d2';
      case 1: return '#2196f3';
      case 2: return '#4caf50';
      case 3: return '#ff9800';
      case 4: return '#4caf50';
      case 5: return '#ff9800';
      case 6: return '#2196f3';
      case 7: return '#9c27b0';
      default: return '#1976d2';
    }
  };

  return (
    <Container 
      maxWidth="xl" 
      sx={{ 
        py: 3,
        maxHeight: 'calc(100vh - 64px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: alpha(theme.palette.grey[300], 0.1),
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: alpha(theme.palette.primary.main, 0.3),
          borderRadius: '4px',
          '&:hover': {
            background: alpha(theme.palette.primary.main, 0.5),
          },
        },
      }}
    >
      {/* Modern Header Section */}
      <Slide direction="down" in={true} timeout={800}>
        <Box sx={{ mb: 4 }}>
          <ModernCard sx={{ 
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.primary.main, 0.06)} 100%)`,
            p: 4,
            color: 'primary.main',
            position: 'relative',
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
            '&::before': {
              background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.main, 0.06)})`
            }
          }}>
            {/* Animated background elements */}
            <Box sx={{ 
              position: 'absolute',
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              background: alpha(theme.palette.primary.main, 0.02),
              borderRadius: '50%',
              animation: `${PulseAnimation} 4s ease-in-out infinite`
            }} />
            <Box sx={{ 
              position: 'absolute',
              bottom: -50,
              left: -50,
              width: 200,
              height: 200,
              background: alpha(theme.palette.primary.main, 0.02),
              borderRadius: '50%'
            }} />
            
            <Grid container spacing={3} alignItems="center" justifyContent="space-between">
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Timeline sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 600,
                        mb: 1,
                        color: 'primary.main'
                      }}
                    >
                      Order to Dispatch System
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        opacity: 0.9,
                        fontWeight: 400,
                        maxWidth: 600,
                        color: 'text.secondary'
                      }}
                    >
                      Advanced Production Workflow Control Center
                    </Typography>
                  </Box>
                </Box>
                
              </Grid>
              
              <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Auto Refresh">
                    <IconButton
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      sx={{ 
                        color: autoRefresh ? 'success.main' : 'primary.main',
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                        backdropFilter: 'blur(10px)',
                        '&:hover': { bgcolor: alpha(theme.palette.background.paper, 0.9) }
                      }}
                    >
                      {autoRefresh ? <Pause /> : <PlayArrow />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Refresh Data">
                    <IconButton
                      onClick={handleRefresh}
                      disabled={refreshing}
                      sx={{ 
                        color: 'primary.main',
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                        backdropFilter: 'blur(10px)',
                        '&:hover': { bgcolor: alpha(theme.palette.background.paper, 0.9) },
                        '&.Mui-disabled': { color: 'text.disabled' }
                      }}
                    >
                      <Refresh className={refreshing ? 'rotating' : ''} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Update Dispatch Statuses">
                    <IconButton
                      onClick={handleUpdateDispatchStatuses}
                      disabled={updatingStatuses}
                      sx={{ 
                        color: 'warning.main',
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                        backdropFilter: 'blur(10px)',
                        '&:hover': { bgcolor: alpha(theme.palette.background.paper, 0.9) },
                        '&.Mui-disabled': { color: 'text.disabled' }
                      }}
                    >
                      {updatingStatuses ? <CircularProgress size={20} /> : <Update />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Holiday Manager">
                    <IconButton onClick={() => setHolidayDialogOpen(true)} sx={{ 
                      color: 'primary.main',
                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(10px)',
                      '&:hover': { bgcolor: alpha(theme.palette.background.paper, 0.9) }
                    }}>
                      <SettingsIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Grid>
            </Grid>
          </ModernCard>
        </Box>
      </Slide>

      <HolidayManagerDialog open={holidayDialogOpen} onClose={() => setHolidayDialogOpen(false)} />

      {/* Error Display */}
      {error && (
        <Fade in={!!error}>
          <Alert 
            severity="error" 
            sx={{ mb: 3 }} 
            onClose={() => setError(null)}
            action={
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </Fade>
      )}

      <Card 
        elevation={0}
        sx={{ 
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          boxShadow: theme.shadows[2],
          '&:hover': {
            boxShadow: theme.shadows[8],
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
          }
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {/* Custom Tabs */}
          <Box sx={{ 
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            backgroundColor: alpha(theme.palette.background.default, 0.5)
          }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 64,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    color: 'primary.main',
                    backgroundColor: 'background.paper',
                    borderBottom: `2px solid ${theme.palette.primary.main}`
                  },
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.06),
                    color: 'primary.dark'
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: theme.palette.primary.main,
                  height: 3
                }
              }}
            >
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Timeline sx={{ fontSize: 20, color: activeTab === 0 ? 'primary.main' : 'text.secondary' }} />
                    <span>Complete O2D ({getTabCount(0)})</span>
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Inventory sx={{ fontSize: 20, color: activeTab === 1 ? 'primary.main' : 'text.secondary' }} />
                    <span>Store 1 ({getTabCount(1)})</span>
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Build sx={{ fontSize: 20, color: activeTab === 2 ? 'primary.main' : 'text.secondary' }} />
                    <span>Cable Prod ({getTabCount(2)})</span>
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Inventory sx={{ fontSize: 20, color: activeTab === 3 ? 'primary.main' : 'text.secondary' }} />
                    <span>Store 2 ({getTabCount(3)})</span>
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PrecisionManufacturing sx={{ fontSize: 20, color: activeTab === 4 ? 'primary.main' : 'text.secondary' }} />
                    <span>Moulding ({getTabCount(4)})</span>
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Verified sx={{ fontSize: 20, color: activeTab === 5 ? 'primary.main' : 'text.secondary' }} />
                    <span>FG Section ({getTabCount(5)})</span>
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShipping sx={{ fontSize: 20, color: activeTab === 6 ? 'primary.main' : 'text.secondary' }} />
                    <span>Dispatch ({getTabCount(6)})</span>
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CloudUpload sx={{ fontSize: 20, color: activeTab === 7 ? 'primary.main' : 'text.secondary' }} />
                    <span>Upload Receiving ({getTabCount(7)})</span>
                  </Box>
                } 
              />
            </Tabs>
          </Box>

          {/* Content Area */}
          <Box sx={{ p: 3, backgroundColor: alpha(theme.palette.background.default, 0.5) }}>
            {loading ? (
              <LoadingSpinner message="Loading tasks..." />
            ) : (
              <>
                {/* Flow Visualization - Show only on "All Tasks" tab */}
                {/* Removed Production Flow Overview as per user request */}
                {/* {activeTab === 0 && (
                  <FlowVisualization
                    tasks={tasks}
                    onTaskAction={handleAdvanceTask}
                    currentUser={user}
                  />
                )} */}
                
                {/* Use table/list view for all tabs */}
                <TaskList
                  tasks={(() => {
                    const filtered = getFilteredTasks();
                    console.log('TaskList receiving tasks:', {
                      count: filtered?.length || 0,
                      activeTab,
                      currentStage: activeTab === 0 ? 'COMPLETE_O2D' : 'OTHER',
                      sample: filtered?.[0] ? {
                        DispatchUniqueId: filtered[0].DispatchUniqueId,
                        ClientCode: filtered[0].ClientCode
                      } : null
                    });
                    return filtered;
                  })()}
                  onAdvanceTask={handleAdvanceTask}
                  onEditStageDate={handleEditStageDate}
                  onMoveToModule={handleMoveToModule}
                  onUpdateStatus={handleUpdateStatus}
                  onMoveStage={handleMoveStage}
                  onUploadReceivingDocument={handleUploadReceivingDocument}
                  onUpdateBatchSize={handleUpdateBatchSize}
                  currentStage={
                    activeTab === 0 ? 'COMPLETE_O2D' :
                    activeTab === 1 ? 'STORE1' :
                    activeTab === 2 ? 'CABLE_PRODUCTION' :
                    activeTab === 3 ? 'STORE2' :
                    activeTab === 4 ? 'MOULDING' :
                    activeTab === 5 ? 'FG_SECTION' :
                    activeTab === 6 ? 'DISPATCH' :
                    activeTab === 7 ? 'RECEIVING_DOCUMENTS' :
                    null
                  }
                  // Time range props for all tabs
                  timeRange={getCurrentTimeRange()}
                  onTimeRangeChange={setCurrentTimeRange}
                  getTimeRangeLabel={getTimeRangeLabel}
                  title={
                    activeTab === 0
                      ? "Complete O2D"
                      : activeTab === 1
                      ? "Store 1"
                      : activeTab === 2
                      ? "Cable Production"
                      : activeTab === 3
                      ? "Store 2"
                      : activeTab === 4
                      ? "Moulding"
                      : activeTab === 5
                      ? "FG Section"
                      : activeTab === 6
                      ? "Dispatch"
                      : activeTab === 7
                      ? "Upload Receiving Documents"
                      : "Complete O2D"
                  }
                />
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      <DispatchDateDialog
        open={dispatchDateDialogOpen}
        onClose={handleDispatchDateDialogClose}
        onConfirm={handleDispatchDateConfirm}
        task={pendingAdvanceTask}
      />

      <EditStageDateDialog
        open={editStageDateDialogOpen}
        onClose={handleEditStageDateClose}
        onConfirm={handleEditStageDateConfirm}
        task={taskToEditDate}
        currentStage={currentEditStage}
      />

      {/* Modern Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Zoom in={true} timeout={400}>
          <Fab
            sx={{ 
              background: theme.palette.primary.main,
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.25)}`,
              color: theme.palette.primary.contrastText,
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.35)}`,
                background: theme.palette.primary.dark
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <Refresh 
              sx={{ 
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} 
            />
          </Fab>
        </Zoom>
        
        <Zoom in={true} timeout={600}>
          <Fab
            sx={{ 
              background: theme.palette.success.main,
              boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, 0.25)}`,
              color: theme.palette.success.contrastText,
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: `0 12px 40px ${alpha(theme.palette.success.main, 0.35)}`,
                background: theme.palette.success.dark
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onClick={() => setStatsVisible(!statsVisible)}
          >
            {statsVisible ? <TrendingDown /> : <TrendingUp />}
          </Fab>
        </Zoom>
      </Box>

      {/* Success Snackbar */}
      <Snackbar
        open={successOpen}
        autoHideDuration={2000}
        onClose={handleSuccessClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSuccessClose}
          severity="success"
          sx={{ 
            width: "100%",
            borderRadius: 2,
            '& .MuiAlert-icon': { color: theme.palette.success.main }
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FlowManagement;
