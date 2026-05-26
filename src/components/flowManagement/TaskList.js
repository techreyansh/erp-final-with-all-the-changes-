import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Chip, 
  IconButton,
  Button,
  Tooltip,
  Pagination,
  TextField,
  InputAdornment,
  Container,
  Select,
  MenuItem,
  FormControl,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Checkbox,
  Stack,
  alpha,
  useTheme,
  Alert
} from '@mui/material';
import AdvancedPagination from './AdvancedPagination';
import { 
  ArrowForward, 
  Close, 
  Visibility, 
  Search, 
  Info,
  Assignment,
  Schedule,
  Warning,
  ArrowRight,
  ArrowLeft,
  Store,
  Build,
  PrecisionManufacturing,
  LocalShipping,
  Inventory,
  PlayArrow,
  Pause,
  CheckCircle,
  Verified,
  Error as ErrorIcon,
  Edit as EditIcon,
  ArrowForward as UpdateIcon,
  SwapHoriz as MoveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import { formatDate, isOverdue } from '../../utils/dateUtils';
import { canAdvance } from '../../utils/statusUtils';
import { useAuth } from '../../context/AuthContext';
import { formatCompletionDate, getStatusOnly } from '../../utils/statusDateUtils';
import QuickActionButton from './QuickActionButton';
import ReceivingDocumentActions from './ReceivingDocumentActions';
import WhatsAppButton from '../common/WhatsAppButton';
import sheetService from '../../services/sheetService';

// Function to check if previous stages are completed before allowing status updates
// This enforces sequential workflow: can only mark stage as completed if previous stage is completed
const checkPreviousStagesCompleted = (task, currentStage) => {
  if (!task || !task._fromDispatches) {
    return true; // Allow actions for non-dispatch tasks
  }
  
  // Get the dispatch record data from the task
  const dispatchRecord = task._dispatchRecord || task;
  
  // Check dependencies based on current stage - enforce sequential completion
  switch (currentStage) {
    case 'STORE1':
      // Store 1 can always be completed (first stage)
      return true;
      
    case 'CABLE_PRODUCTION':
      // Cable Production requires Store 1 to be completed first
      const store1Status = dispatchRecord.store1Status || 'NEW';
      const store1Completed = getStatusOnly(store1Status) === 'COMPLETED';
      return store1Completed;
      
    case 'STORE2':
      // Store 2 requires Cable Production to be completed first
      const cableProdStatus = dispatchRecord.cableProdStatus || 'NEW';
      const cableProdCompleted = getStatusOnly(cableProdStatus) === 'COMPLETED';
      return cableProdCompleted;
      
    case 'MOULDING':
      // Moulding requires Store 2 to be completed first
      const store2Status = dispatchRecord.store2Status || 'NEW';
      const store2Completed = getStatusOnly(store2Status) === 'COMPLETED';
      return store2Completed;
      
    case 'FG_SECTION':
      // FG Section requires Moulding to be completed first
      const mouldingStatus = dispatchRecord.mouldingProdStatus || 'NEW';
      const mouldingCompleted = getStatusOnly(mouldingStatus) === 'COMPLETED';
      return mouldingCompleted;
      
    case 'DISPATCH':
      // Dispatch requires FG Section to be completed first
      const fgSectionStatus = dispatchRecord.fgSectionStatus || 'NEW';
      const fgSectionCompleted = getStatusOnly(fgSectionStatus) === 'COMPLETED';
      return fgSectionCompleted;
      
    default:
      // For unknown stages, allow completion
      return true;
  }
};

// Function to check if previous stage is completed for move buttons
// This enforces sequential workflow: can only move to next stage if previous is completed
const checkPreviousStageCompletedForMove = (task, currentStage) => {
  if (!task || !task._fromDispatches) {
    return { allowed: true, tooltip: '' }; // Allow moves for non-dispatch tasks
  }
  
  // Get the dispatch record data from the task
  const dispatchRecord = task._dispatchRecord || task;
  
  // Define stage order and check previous stage
  switch (currentStage) {
    case 'STORE1':
      // Store 1 can always move (first stage)
      return { allowed: true, tooltip: 'Move to Inventory' };
      
    case 'CABLE_PRODUCTION':
      // Cable Production requires Store 1 to be completed first
      const store1Status = dispatchRecord.store1Status || 'NEW';
      const store1Completed = getStatusOnly(store1Status) === 'COMPLETED';
      return {
        allowed: store1Completed,
        tooltip: store1Completed 
          ? 'Move to Cable Production Module' 
          : '⚠️ Store 1 must be completed before moving to Cable Production'
      };
      
    case 'STORE2':
      // Store 2 requires Cable Production to be completed first
      const cableProdStatus = dispatchRecord.cableProdStatus || 'NEW';
      const cableProdCompleted = getStatusOnly(cableProdStatus) === 'COMPLETED';
      return {
        allowed: cableProdCompleted,
        tooltip: cableProdCompleted 
          ? 'Move to Inventory' 
          : '⚠️ Cable Production must be completed before moving to Store 2'
      };
      
    case 'MOULDING':
      // Moulding requires Store 2 to be completed first
      const store2Status = dispatchRecord.store2Status || 'NEW';
      const store2Completed = getStatusOnly(store2Status) === 'COMPLETED';
      return {
        allowed: store2Completed,
        tooltip: store2Completed 
          ? 'Move to Moulding Module' 
          : '⚠️ Store 2 must be completed before moving to Moulding'
      };
      
    case 'FG_SECTION':
      // FG Section requires Moulding to be completed first
      const mouldingStatus = dispatchRecord.mouldingProdStatus || 'NEW';
      const mouldingCompleted = getStatusOnly(mouldingStatus) === 'COMPLETED';
      return {
        allowed: mouldingCompleted,
        tooltip: mouldingCompleted 
          ? 'Move to FG Section Module' 
          : '⚠️ Moulding must be completed before moving to FG Section'
      };
      
    case 'DISPATCH':
      // Dispatch requires FG Section to be completed first
      const fgSectionStatus = dispatchRecord.fgSectionStatus || 'NEW';
      const fgSectionCompleted = getStatusOnly(fgSectionStatus) === 'COMPLETED';
      return {
        allowed: fgSectionCompleted,
        tooltip: fgSectionCompleted 
          ? 'Move to Dispatch Module' 
          : '⚠️ FG Section must be completed before moving to Dispatch'
      };
      
    default:
      // For unknown stages, allow move
      return { allowed: true, tooltip: '' };
  }
};

const TaskList = ({ tasks, onAdvanceTask, onEditStageDate, onMoveToModule, onUpdateStatus, onMoveStage, onUploadReceivingDocument, onUpdateBatchSize, onDeleteTask, currentStage, title = "Tasks", timeRange, onTimeRangeChange, getTimeRangeLabel }) => {
  const theme = useTheme();
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [batchSizeDialogOpen, setBatchSizeDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newBatchSize, setNewBatchSize] = useState('');
  const [moveWithBatchSizeDialogOpen, setMoveWithBatchSizeDialogOpen] = useState(false);
  const [taskToMove, setTaskToMove] = useState(null);
  const [moveBatchSize, setMoveBatchSize] = useState('');
  const [specsDialogOpen, setSpecsDialogOpen] = useState(false);
  const [selectedTaskForSpecs, setSelectedTaskForSpecs] = useState(null);
  // Combined dialog for Cable Production: batch size update + status update
  const [combinedBatchSizeDialogOpen, setCombinedBatchSizeDialogOpen] = useState(false);
  const [selectedTaskForCombined, setSelectedTaskForCombined] = useState(null);
  const [combinedBatchSize, setCombinedBatchSize] = useState('');
  const [markAsCompleted, setMarkAsCompleted] = useState(false);
  // Combined dialog for Moulding: batch size update + status update
  const [mouldingCombinedDialogOpen, setMouldingCombinedDialogOpen] = useState(false);
  const [selectedTaskForMouldingCombined, setSelectedTaskForMouldingCombined] = useState(null);
  const [mouldingCombinedBatchSize, setMouldingCombinedBatchSize] = useState('');
  const [mouldingMarkAsCompleted, setMouldingMarkAsCompleted] = useState(false);
  // Combined dialog for FG Section: batch size update + status update
  const [fgCombinedDialogOpen, setFgCombinedDialogOpen] = useState(false);
  const [selectedTaskForFgCombined, setSelectedTaskForFgCombined] = useState(null);
  const [fgCombinedBatchSize, setFgCombinedBatchSize] = useState('');
  // Move History Dialog
  const [moveHistoryDialogOpen, setMoveHistoryDialogOpen] = useState(false);
  const [selectedTaskForMoveHistory, setSelectedTaskForMoveHistory] = useState(null);
  const [fgMarkAsCompleted, setFgMarkAsCompleted] = useState(false);
  // Checkbox selection state for combining batches with same Unique ID
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  // Track which tasks have cable production plans (for CABLE_PRODUCTION stage)
  const [tasksWithPlans, setTasksWithPlans] = useState(new Set());
  // Track which dispatch IDs have been moved to cable production (based on Google Sheet)
  const [movedDispatchIds, setMovedDispatchIds] = useState(new Set());
  
  // Check if a task has already been moved to cable production (based on Google Sheet, not localStorage)
  const isTaskMoved = (task) => {
    const dispatchId = task.DispatchUniqueId || task._uniqueKey || task.UniqueId;
    if (!dispatchId) return false;
    return movedDispatchIds.has(dispatchId);
  };
  
  // Check if cable production plan exists for tasks and track moved dispatch IDs (for CABLE_PRODUCTION stage)
  useEffect(() => {
    const checkCableProductionPlans = async (forceRefresh = false) => {
      if (currentStage !== 'CABLE_PRODUCTION' || tasks.length === 0) {
        setTasksWithPlans(new Set());
        setMovedDispatchIds(new Set());
        return;
      }
      
      try {
        // Force refresh to get latest data from Google Sheet
        const productionPlans = await sheetService.getSheetData("Cable Production Plans", forceRefresh);
        console.log('Checking production plans for moved batches:', {
          plansCount: productionPlans.length,
          tasksCount: tasks.length,
          forceRefresh
        });
        
        // Log all batchInfo data for debugging
        productionPlans.forEach(plan => {
          if (plan.batchInfo) {
            try {
              const batchInfo = typeof plan.batchInfo === 'string' 
                ? JSON.parse(plan.batchInfo) 
                : plan.batchInfo;
              console.log(`Plan ${plan.planId || plan.orderNumber} batchInfo:`, JSON.stringify(batchInfo, null, 2));
            } catch (e) {
              console.error('Error parsing batchInfo for logging:', e);
            }
          }
        });
        
        const tasksWithPlansSet = new Set();
        const movedIdsSet = new Set();
        
        tasks.forEach(task => {
          const dispatchId = task.DispatchUniqueId || task._uniqueKey || task.UniqueId;
          if (!dispatchId) {
            console.log(`⚠️ Task has no dispatch ID:`, task);
            return;
          }
          
          console.log(`\n🔍 Checking dispatch ID: ${dispatchId}`);
          
          // Check if any production plan has this dispatch ID in its batchInfo
          let foundInPlan = false;
          let matchingPlanDetails = null;
          
          for (const plan of productionPlans) {
            // Skip orderNumber check for CABLE_PRODUCTION stage - we only use batchInfo
            // This prevents false positives when multiple tasks share the same POId
            
            // Check if dispatch ID exists in batchInfo array - exact match required
            if (plan.batchInfo) {
              try {
                const batchInfo = typeof plan.batchInfo === 'string' 
                  ? JSON.parse(plan.batchInfo) 
                  : plan.batchInfo;
                
                if (Array.isArray(batchInfo)) {
                  // Extract all dispatch IDs from this plan's batchInfo
                  const planDispatchIds = batchInfo
                    .map(batch => batch.dispatchId)
                    .filter(Boolean);
                  
                  console.log(`  Plan ${plan.planId || plan.orderNumber} has dispatch IDs:`, planDispatchIds);
                  
                  // Check for exact match with dispatchId field in batchInfo
                  const matchingBatch = batchInfo.find(batch => {
                    // STRICT: Only match exact dispatchId, no fallback to batchId
                    return batch.dispatchId === dispatchId;
                  });
                  
                  if (matchingBatch) {
                    foundInPlan = true;
                    matchingPlanDetails = { 
                      planId: plan.planId || plan.orderNumber, 
                      reason: 'batchInfo match',
                      batchInfo: batchInfo,
                      matchingBatch: matchingBatch
                    };
                    console.log(`  ✅ MATCH FOUND in plan ${plan.planId || plan.orderNumber}:`, matchingBatch);
                    break;
                  } else {
                    console.log(`  ❌ No match in plan ${plan.planId || plan.orderNumber}`);
                  }
                }
              } catch (e) {
                console.error(`  Error parsing batchInfo for plan ${plan.planId || plan.orderNumber}:`, e);
              }
            } else {
              console.log(`  Plan ${plan.planId || plan.orderNumber} has no batchInfo - skipping`);
            }
          }
          
          if (foundInPlan) {
            // Track this dispatch ID as moved and having a plan
            movedIdsSet.add(dispatchId);
            tasksWithPlansSet.add(dispatchId);
            console.log(`🚫 Dispatch ID ${dispatchId} is BLOCKED - found in plan:`, matchingPlanDetails);
          } else {
            console.log(`✅ Dispatch ID ${dispatchId} is AVAILABLE - not found in any production plan`);
          }
        });
        
        console.log('Moved dispatch IDs:', Array.from(movedIdsSet));
        setTasksWithPlans(tasksWithPlansSet);
        setMovedDispatchIds(movedIdsSet);
      } catch (error) {
        console.error('Error checking cable production plans:', error);
        setTasksWithPlans(new Set());
        setMovedDispatchIds(new Set());
      }
    };
    
    // Initial check - always force refresh to get latest data
    checkCableProductionPlans(true);
    
    // Listen for custom event when production plan is created
    const handlePlanCreated = (event) => {
      console.log('Production plan created event received, updating in real-time...', event.detail);
      // Force refresh when plan is created - this updates the UI without page refresh
      checkCableProductionPlans(true);
    };
    
    // Listen for window focus to check when user comes back from Cable Production Planning
    const handleFocus = () => {
      console.log('Window focused, checking production plans...');
      checkCableProductionPlans(true);
    };
    
    // Listen for storage event (when sessionStorage changes) - for cross-tab communication
    const handleStorageChange = (e) => {
      if (e.key === 'productionPlanCreated' || e.key === 'selectedCableProductionBatches') {
        console.log('Storage changed, checking production plans...');
        checkCableProductionPlans(true);
      }
    };
    
    // Listen for visibility change - when user switches back to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentStage === 'CABLE_PRODUCTION') {
        console.log('Page visible, checking production plans...');
        checkCableProductionPlans(true);
      }
    };
    
    window.addEventListener('productionPlanCreated', handlePlanCreated);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up interval to check periodically (every 3 seconds for real-time updates)
    // This checks Google Sheet without refreshing the page
    const checkInterval = setInterval(() => {
      if (currentStage === 'CABLE_PRODUCTION' && tasks.length > 0) {
        checkCableProductionPlans(true);
      }
    }, 3000); // Check every 3 seconds for real-time updates
    
    return () => {
      window.removeEventListener('productionPlanCreated', handlePlanCreated);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(checkInterval);
    };
  }, [tasks, currentStage]);
  
  // Helper function to check if a task has a cable production plan
  const hasCableProductionPlan = (task) => {
    if (currentStage !== 'CABLE_PRODUCTION') {
      return true; // Not in cable production stage, so don't block
    }
    
    const dispatchId = task.DispatchUniqueId || task._uniqueKey || task.UniqueId;
    if (!dispatchId) {
      return true; // No dispatch ID, so don't block
    }
    
    return tasksWithPlans.has(dispatchId);
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenBatchSizeDialog = (task) => {
    setSelectedTask(task);
    setNewBatchSize(task.updatedBatch || task.BatchSize || task.Quantity || '');
    setBatchSizeDialogOpen(true);
  };

  const handleCloseBatchSizeDialog = () => {
    setBatchSizeDialogOpen(false);
    setSelectedTask(null);
    setNewBatchSize('');
  };

  const handleSaveBatchSize = async () => {
    if (!selectedTask || !newBatchSize || parseFloat(newBatchSize) <= 0) {
      return;
    }

    if (onUpdateBatchSize) {
      await onUpdateBatchSize(selectedTask, parseFloat(newBatchSize));
      handleCloseBatchSizeDialog();
    }
  };

  // Combined dialog handlers for Cable Production
  const handleOpenCombinedBatchSizeDialog = (task) => {
    setSelectedTaskForCombined(task);
    // Pre-fill with updated batch size if exists, otherwise use original
    setCombinedBatchSize(task.updatedBatch || task.BatchSize || task.Quantity || '');
    // Pre-check "Mark as Completed" if batch size was already updated
    const batchSizeAlreadyUpdated = task.updatedBatch && parseFloat(task.updatedBatch) > 0;
    setMarkAsCompleted(batchSizeAlreadyUpdated);
    setCombinedBatchSizeDialogOpen(true);
  };

  const handleCloseCombinedBatchSizeDialog = () => {
    setCombinedBatchSizeDialogOpen(false);
    setSelectedTaskForCombined(null);
    setCombinedBatchSize('');
    setMarkAsCompleted(false);
  };

  const handleSaveCombinedBatchSizeAndStatus = async () => {
    if (!selectedTaskForCombined || !combinedBatchSize || parseFloat(combinedBatchSize) <= 0) {
      return;
    }

    // First update batch size
    if (onUpdateBatchSize) {
      await onUpdateBatchSize(selectedTaskForCombined, parseFloat(combinedBatchSize));
    }

    // Then update status if checkbox is checked
    if (markAsCompleted && onUpdateStatus) {
      await onUpdateStatus(selectedTaskForCombined);
    }

    handleCloseCombinedBatchSizeDialog();
  };

  // Combined dialog handlers for Moulding
  const handleOpenMouldingCombinedDialog = (task) => {
    setSelectedTaskForMouldingCombined(task);
    // Pre-fill with updated batch size if exists, otherwise use original
    setMouldingCombinedBatchSize(task.updatedBatch || task.BatchSize || task.Quantity || '');
    // Pre-check "Mark as Completed" if batch size was already updated
    const batchSizeAlreadyUpdated = task.updatedBatch && parseFloat(task.updatedBatch) > 0;
    setMouldingMarkAsCompleted(batchSizeAlreadyUpdated);
    setMouldingCombinedDialogOpen(true);
  };

  const handleCloseMouldingCombinedDialog = () => {
    setMouldingCombinedDialogOpen(false);
    setSelectedTaskForMouldingCombined(null);
    setMouldingCombinedBatchSize('');
    setMouldingMarkAsCompleted(false);
  };

  const handleSaveMouldingCombinedBatchSizeAndStatus = async () => {
    if (!selectedTaskForMouldingCombined || !mouldingCombinedBatchSize || parseFloat(mouldingCombinedBatchSize) <= 0) {
      return;
    }

    // Get current batch size for comparison
    const currentBatchSize = parseFloat(
      selectedTaskForMouldingCombined.updatedBatch || 
      selectedTaskForMouldingCombined.BatchSize || 
      selectedTaskForMouldingCombined.Quantity || 
      0
    );
    const enteredBatchSize = parseFloat(mouldingCombinedBatchSize);

    // First update batch size with moulding split flag
    if (onUpdateBatchSize) {
      await onUpdateBatchSize(selectedTaskForMouldingCombined, enteredBatchSize, true); // Pass true for isMouldingSplit
    }

    // Then update status if checkbox is checked
    if (mouldingMarkAsCompleted && onUpdateStatus) {
      await onUpdateStatus(selectedTaskForMouldingCombined);
    }

    handleCloseMouldingCombinedDialog();
  };

  // Combined dialog handlers for FG Section
  const handleOpenFgCombinedDialog = (task) => {
    setSelectedTaskForFgCombined(task);
    // Pre-fill with updated batch size if exists, otherwise use original
    setFgCombinedBatchSize(task.updatedBatch || task.BatchSize || task.Quantity || '');
    // Pre-check "Mark as Completed" if batch size was already updated
    const batchSizeAlreadyUpdated = task.updatedBatch && parseFloat(task.updatedBatch || 0) > 0;
    setFgMarkAsCompleted(batchSizeAlreadyUpdated);
    setFgCombinedDialogOpen(true);
  };

  const handleCloseFgCombinedDialog = () => {
    setFgCombinedDialogOpen(false);
    setSelectedTaskForFgCombined(null);
    setFgCombinedBatchSize('');
    setFgMarkAsCompleted(false);
  };

  const handleSaveFgCombinedBatchSizeAndStatus = async () => {
    if (!selectedTaskForFgCombined) {
      return;
    }

    // Only update status if checkbox is checked - do NOT update batch size
    if (fgMarkAsCompleted && onUpdateStatus) {
      await onUpdateStatus(selectedTaskForFgCombined);
    }

    handleCloseFgCombinedDialog();
  };

  // Move History Dialog handlers
  const handleOpenMoveHistoryDialog = (task) => {
    setSelectedTaskForMoveHistory(task);
    setMoveHistoryDialogOpen(true);
  };

  const handleCloseMoveHistoryDialog = () => {
    setMoveHistoryDialogOpen(false);
    setSelectedTaskForMoveHistory(null);
  };

  const handleCloseMoveWithBatchSizeDialog = () => {
    setMoveWithBatchSizeDialogOpen(false);
    setTaskToMove(null);
    setMoveBatchSize('');
  };

  const handleUpdateBatchSizeAndMove = async () => {
    if (!taskToMove || !moveBatchSize || parseFloat(moveBatchSize) <= 0) {
      return;
    }

    // Update batch size and move stage in one operation
    // Pass batch size to move stage handler which will update it in the sheet
    if (onMoveStage) {
      await onMoveStage(taskToMove, parseFloat(moveBatchSize));
      handleCloseMoveWithBatchSizeDialog();
    }
  };
  
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  // Handle checkbox selection for combining batches
  const handleTaskSelect = (task, isChecked) => {
    // Prevent selection if task has already been moved
    if (isChecked && isTaskMoved(task)) {
      return; // Don't allow selection of already moved tasks
    }
    
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      const taskKey = task._uniqueKey || task.DispatchUniqueId || task.UniqueId;
      
      if (isChecked) {
        // Only allow selecting tasks with the same Unique ID
        if (prev.size > 0) {
          const firstSelectedKey = Array.from(prev)[0];
          const firstSelected = filteredTasks.find(t => {
            const key = t._uniqueKey || t.DispatchUniqueId || t.UniqueId;
            return key === firstSelectedKey;
          });
          
          if (firstSelected && firstSelected.UniqueId !== task.UniqueId) {
            // Prevent selection - tasks must have same Unique ID
            // The checkbox is already disabled in the UI for this case
            return prev;
          }
        }
        
        newSet.add(taskKey);
      } else {
        newSet.delete(taskKey);
      }
      
      return newSet;
    });
  };

  // Handle select all for same Unique ID
  const handleSelectAllForUniqueId = (uniqueId, isChecked) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      const tasksWithSameUniqueId = filteredTasks.filter(t => t.UniqueId === uniqueId);
      
      tasksWithSameUniqueId.forEach(task => {
        // Skip tasks that have already been moved
        if (isChecked && isTaskMoved(task)) {
          return;
        }
        
        const taskKey = task._uniqueKey || task.DispatchUniqueId || task.UniqueId;
        if (isChecked) {
          newSet.add(taskKey);
        } else {
          newSet.delete(taskKey);
        }
      });
      
      return newSet;
    });
  };

  // Filter tasks based on search query
  const filteredTasks = tasks.filter(task => 
    (task.DispatchUniqueId && task.DispatchUniqueId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (task.POId && task.POId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (task.UniqueId && task.UniqueId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (task.ClientCode && task.ClientCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (task.ProductCode && task.ProductCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (task.ProductName && task.ProductName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (task.Name && task.Name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get selected tasks data
  const getSelectedTasksData = () => {
    return filteredTasks.filter(task => {
      const taskKey = task._uniqueKey || task.DispatchUniqueId || task.UniqueId;
      return selectedTasks.has(taskKey);
    });
  };

  // Check if all tasks with same Unique ID are selected
  const areAllTasksWithUniqueIdSelected = (uniqueId) => {
    const tasksWithSameUniqueId = filteredTasks.filter(t => t.UniqueId === uniqueId);
    if (tasksWithSameUniqueId.length === 0) return false;
    
    return tasksWithSameUniqueId.every(task => {
      const taskKey = task._uniqueKey || task.DispatchUniqueId || task.UniqueId;
      return selectedTasks.has(taskKey);
    });
  };

  // Get move selected button props for Cable Production
  const getMoveSelectedButtonProps = () => {
    if (currentStage !== 'CABLE_PRODUCTION' || selectedTasks.size === 0) {
      return null;
    }
    
    const selectedTasksData = getSelectedTasksData();
    const uniqueIds = [...new Set(selectedTasksData.map(t => t.UniqueId))];
    const isValidSelection = uniqueIds.length === 1 && selectedTasksData.length > 0;
    const totalQuantity = selectedTasksData.reduce((sum, t) => 
      sum + (parseFloat(t.Quantity || t.updatedBatch || t.BatchSize || 0)), 0
    );
    
    return {
      selectedTasksData,
      isValidSelection,
      totalQuantity
    };
  };

  const moveSelectedButtonProps = getMoveSelectedButtonProps();
  
  // Paginate tasks
  const paginatedTasks = filteredTasks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Check if current stage allows date editing
  const canEditStageDate = (status) => {
    // Allow editing for any status that has dispatch data, EXCEPT COMPLETED

    return status && status !== '' && status !== 'COMPLETED';
  };

  // Function to get flow action arrows based on status
  const getFlowActionArrows = (status, userEmail, assignedTo, task = null) => {
    const actions = [];

    // Check if user can perform actions
    const canPerformAction = userEmail === assignedTo;
    
    // Determine the current stage - use currentStage prop (from activeTab) as PRIMARY source
    // The currentStage prop is set based on which tab is active, which is the correct stage
    // CRITICAL: For dispatch stage, ALWAYS use currentStage prop to ensure correct identification
    // Only use task._currentStage if currentStage prop is not available
    let resolvedStage = currentStage || (task && task._currentStage) || null;
    
    // CRITICAL FIX: If we're on Dispatch tab (currentStage === 'DISPATCH'), force resolvedStage to DISPATCH
    // This prevents wrong stage identification that might show inventory icon
    if (currentStage === 'DISPATCH') {
      resolvedStage = 'DISPATCH';
    }
    
    // Debug: Log stage resolution to help identify issues
    if (process.env.NODE_ENV === 'development' && task) {
      console.log('Stage Resolution:', {
        taskId: task.DispatchUniqueId || task.UniqueId,
        currentStageProp: currentStage,
        taskCurrentStage: task._currentStage,
        resolvedStage: resolvedStage
      });
    }
    
    // CRITICAL: Check if previous stages are completed before allowing status updates
    // Note: Move buttons are ALWAYS shown and enabled, regardless of previous stage completion or status
    const canPerformActions = checkPreviousStagesCompleted(task, resolvedStage);
    
    // Add module navigation buttons based on current stage
    // Move buttons are shown but ENABLED only if previous stage is completed
    // This enforces sequential workflow: can only move to next stage if previous is completed
    // Each stage shows its own specific icon and navigates to its own module
    // IMPORTANT: Only show move button if resolvedStage matches a known stage
    if (resolvedStage) {
      // Check if previous stage is completed for this move action
      const moveCheck = checkPreviousStageCompletedForMove(task, resolvedStage);
      
      // Debug: Log move check for dispatch
      if (process.env.NODE_ENV === 'development' && resolvedStage === 'DISPATCH' && task) {
        const dispatchRecord = task._dispatchRecord || task;
        const fgSectionStatus = dispatchRecord?.fgSectionStatus || 'NEW';
        console.log('Dispatch Move Check:', {
          taskId: task.DispatchUniqueId || task.UniqueId,
          fgSectionStatus: fgSectionStatus,
          fgSectionCompleted: getStatusOnly(fgSectionStatus) === 'COMPLETED',
          moveCheckAllowed: moveCheck.allowed,
          moveCheckTooltip: moveCheck.tooltip
        });
      }
      
      switch (resolvedStage) {
        case 'STORE1':
          // Store 1 always shows Inventory icon and moves to Inventory
          actions.push({
            icon: <Inventory />,
            tooltip: moveCheck.tooltip || 'Move to Inventory',
            action: 'move_to_inventory',
            color: '#ff9800',
            hoverColor: '#fff3e0',
            disabled: !moveCheck.allowed
          });
          break;
        case 'CABLE_PRODUCTION':
          // Check if production plan already exists for this dispatch ID
          const dispatchId = task?.DispatchUniqueId || task?._uniqueKey || task?.UniqueId;
          // hasCableProductionPlan returns true if plan exists (in tasksWithPlans set)
          const hasExistingPlan = dispatchId && hasCableProductionPlan(task);
          const isDisabled = !moveCheck.allowed || hasExistingPlan;
          const tooltipText = hasExistingPlan 
            ? '⚠️ Production plan already exists for this batch. Cannot create duplicate plan.'
            : (moveCheck.tooltip || 'Move to Cable Production Module');
          
          // Cable Production always shows Build icon and moves to Cable Production Module
          actions.push({
            icon: <Build />,
            tooltip: tooltipText,
            action: 'move_to_cable_production',
            color: '#9c27b0',
            hoverColor: '#f3e5f5',
            disabled: isDisabled
          });
          break;
        case 'STORE2':
          // Store 2 shows Inventory icon and moves to Inventory
          // BUT: Disabled until Cable Production is completed
          actions.push({
            icon: <Inventory />,
            tooltip: moveCheck.tooltip || 'Move to Inventory',
            action: 'move_to_inventory',
            color: '#ff9800',
            hoverColor: '#fff3e0',
            disabled: !moveCheck.allowed
          });
          break;
        case 'MOULDING':
          // Moulding shows PrecisionManufacturing icon and moves to Moulding Module
          // BUT: Disabled until Store 2 is completed
          actions.push({
            icon: <PrecisionManufacturing />,
            tooltip: moveCheck.tooltip || 'Move to Moulding Module',
            action: 'move_to_moulding',
            color: '#795548',
            hoverColor: '#efebe9',
            disabled: !moveCheck.allowed
          });
          break;
        case 'FG_SECTION':
          // FG Section shows Verified icon and moves to FG Section Module
          // BUT: Disabled until Moulding is completed
          actions.push({
            icon: <Verified />,
            tooltip: moveCheck.tooltip || 'Move to FG Section Module',
            action: 'move_to_fg_section',
            color: '#4caf50',
            hoverColor: '#e8f5e8',
            disabled: !moveCheck.allowed
          });
          break;
        case 'DISPATCH':
          // Dispatch functionality is handled directly in the Dispatch Module
          // No move action needed - users manage dispatches in the Dispatch Module
          break;
        default:
          // Don't show move button for unknown stages or stages that don't have a module
          // This prevents showing wrong icons
          break;
      }
    } else {
      // If resolvedStage is null/undefined, don't show any move button
      // This prevents defaulting to inventory icon
    }
    
    // Show status update action LAST (at the end)
    // Status update button is only enabled when previous stage is completed
    if (status === 'NEW' || status === 'IN_PROGRESS' || status === 'PENDING') {
      // Get specific warning message based on which previous stage needs to be completed
      let warningMessage = '⚠️ Complete previous stage first to enable this action';
      if (!canPerformActions && task && task._fromDispatches) {
        const dispatchRecord = task._dispatchRecord || task;
        switch (resolvedStage) {
          case 'CABLE_PRODUCTION':
            warningMessage = '⚠️ Store 1 must be completed before marking Cable Production as completed';
            break;
          case 'STORE2':
            warningMessage = '⚠️ Cable Production must be completed before marking Store 2 as completed';
            break;
          case 'MOULDING':
            warningMessage = '⚠️ Store 2 must be completed before marking Moulding as completed';
            break;
          case 'FG_SECTION':
            warningMessage = '⚠️ Moulding must be completed before marking FG Section as completed';
            break;
          case 'DISPATCH':
            warningMessage = '⚠️ FG Section must be completed before marking Dispatch as completed';
            break;
          default:
            warningMessage = '⚠️ Complete previous stage first to enable this action';
        }
      }
      
      // CRITICAL: For CABLE_PRODUCTION stage, also check if cable production plan exists
      let hasPlan = true;
      let planWarningMessage = '';
      if (resolvedStage === 'CABLE_PRODUCTION' && task) {
        hasPlan = hasCableProductionPlan(task);
        if (!hasPlan) {
          planWarningMessage = '⚠️ Cannot mark as completed. Please create a cable production plan first.';
        }
      }
      
      // Update Status button - toggle complete/incomplete
      // For CABLE_PRODUCTION stage: Only enabled when batch has been moved to Cable Production AND production plan exists
      // For other stages: Enabled when previous stage is completed AND (if CABLE_PRODUCTION) plan exists
      let isUpdateStatusEnabled = canPerformActions && hasPlan;
      let statusUpdateWarningMessage = !canPerformActions ? warningMessage : (!hasPlan ? planWarningMessage : '');
      
      // For CABLE_PRODUCTION stage, check if batch has been moved to Cable Production (based on Google Sheet)
      if (resolvedStage === 'CABLE_PRODUCTION' && task) {
        // Check if dispatch ID exists in production plans batchInfo (this means it's been moved)
        const batchMoved = isTaskMoved(task);
        // Also check if production plan exists (hasCableProductionPlan checks batchInfo in production plans)
        const hasProductionPlan = hasCableProductionPlan(task);
        
        // For Cable Production, batch size update is handled in the combined dialog
        // So we only need to check if batch has been moved and production plan exists
        if (!batchMoved || !hasProductionPlan) {
          isUpdateStatusEnabled = false;
          if (!batchMoved) {
            statusUpdateWarningMessage = '⚠️ This batch must be moved to Cable Production first before status can be updated';
          } else if (!hasProductionPlan) {
            statusUpdateWarningMessage = '⚠️ Cannot mark as completed. Please create a cable production plan first.';
          }
        }
      }
      
      // For CABLE_PRODUCTION, MOULDING, and FG_SECTION, update tooltip to indicate it opens a dialog
      const tooltipText = (resolvedStage === 'CABLE_PRODUCTION' || resolvedStage === 'MOULDING' || resolvedStage === 'FG_SECTION') && isUpdateStatusEnabled
        ? 'Update Batch Size & Complete Status'
        : isUpdateStatusEnabled 
          ? 'Update Status (Complete/Incomplete)' 
          : (statusUpdateWarningMessage || warningMessage);
      
      actions.push({
        icon: <UpdateIcon />,
        tooltip: tooltipText,
        action: 'update_status',
        color: '#9c27b0',
        hoverColor: '#f3e5f5',
        disabled: !isUpdateStatusEnabled // Disabled until batch is moved to Cable Production AND plan exists (for CABLE_PRODUCTION) or previous stage completed
      });
      
      // Add additional arrow for MOULDING stage
      // Visible when status is not COMPLETED, but only enabled when status IS COMPLETED
      // Note: FG_SECTION does not have a second arrow (removed as per user request)
      if (resolvedStage === 'MOULDING') {
        const isStatusCompleted = status === 'COMPLETED';
        actions.push({
          icon: <ArrowForward />,
          tooltip: isStatusCompleted 
            ? 'Complete Work' // User will provide the actual logic/tooltip
            : 'Complete work (Status must be completed first)',
          action: 'complete_work', // User will provide the actual action name
          color: '#4caf50',
          hoverColor: '#e8f5e8',
          disabled: !isStatusCompleted // Only enabled when status is COMPLETED
        });
      }
      
      // Don't show move button for non-completed tasks
    } else if (status === 'COMPLETED') {
      // Tasks automatically move to next stage when marked as completed
      // No need for manual move button
      
      // Add additional arrow for MOULDING stage when status is COMPLETED
      // This arrow is enabled and functional when status is COMPLETED
      // Note: FG_SECTION does not have a second arrow (removed as per user request)
      if (resolvedStage === 'MOULDING') {
        actions.push({
          icon: <ArrowForward />,
          tooltip: 'Complete Work', // User will provide the actual logic/tooltip
          action: 'complete_work', // User will provide the actual action name
          color: '#4caf50',
          hoverColor: '#e8f5e8',
          disabled: false // Enabled when status is COMPLETED
        });
      }

    }

    return actions;
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        pb: 2,
        borderBottom: '1px solid #e3f2fd'
      }}>
        <Box>
          <Typography 
            variant="h5" 
            sx={{ 
              color: '#1976d2',
              fontWeight: 700,
              mb: 0.5
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#546e7a'
            }}
          >
            {filteredTasks.length} tasks found
            {currentStage === 'CABLE_PRODUCTION' && selectedTasks.size > 0 && (
              <span style={{ marginLeft: '10px', color: '#9c27b0', fontWeight: 600 }}>
                ({selectedTasks.size} batch{selectedTasks.size > 1 ? 'es' : ''} selected)
              </span>
            )}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {moveSelectedButtonProps && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Build />}
              onClick={() => {
                if (moveSelectedButtonProps.isValidSelection && onMoveToModule) {
                  // Pass the selected tasks to the move handler
                  onMoveToModule(moveSelectedButtonProps.selectedTasksData, 'move_to_cable_production_combined');
                }
              }}
              disabled={!moveSelectedButtonProps.isValidSelection}
              sx={{ textTransform: 'none' }}
              title={!moveSelectedButtonProps.isValidSelection ? 'Please select batches with the same Unique ID' : `Move ${selectedTasks.size} batch${selectedTasks.size > 1 ? 'es' : ''} (${moveSelectedButtonProps.totalQuantity.toLocaleString()} pcs) to Cable Production`}
            >
              Move Selected to Cable Production ({selectedTasks.size})
            </Button>
          )}
          <TextField
          placeholder="Search Dispatch ID, Unique ID, Client, Product..."
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#1976d2' }} />
              </InputAdornment>
            ),
          }}
          sx={{ 
            width: '350px',
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#e3f2fd' },
              '&:hover fieldset': { borderColor: '#1976d2' },
              '&.Mui-focused fieldset': { borderColor: '#1976d2' }
            }
          }}
        />
        </Box>
      </Box>
      
      {/* Time Range Filter - Show for all tabs */}
      {timeRange && onTimeRangeChange && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Time Range">
            <Box sx={{
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              borderRadius: 2,
              display: 'flex',
              overflow: 'hidden',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
            }}>
              {[
                { key: '24h', label: '24h' },
                { key: '3d', label: '3d' },
                { key: '7d', label: '7d' },
                { key: '30d', label: '30d' },
                { key: 'all', label: 'All' }
              ].map(opt => (
                <Box
                  key={opt.key}
                  onClick={() => onTimeRangeChange(opt.key)}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                    color: timeRange === opt.key ? 'primary.contrastText' : 'primary.main',
                    bgcolor: timeRange === opt.key ? 'primary.main' : 'transparent',
                    '&:hover': { bgcolor: timeRange === opt.key ? 'primary.dark' : alpha(theme.palette.primary.main, 0.08) }
                  }}
                >
                  {opt.label}
                </Box>
              ))}
            </Box>
          </Tooltip>
          {getTimeRangeLabel && (
            <Box sx={{ px: 1, py: 0.75, color: 'text.secondary', fontSize: 12, fontWeight: 600 }}>
              {getTimeRangeLabel(timeRange)}
            </Box>
          )}
        </Box>
      )}
        
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 2,
          border: '1px solid #e3f2fd',
          overflowX: 'auto',
          overflowY: 'hidden',
          '&::-webkit-scrollbar': {
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0, 0, 0, 0.05)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(25, 118, 210, 0.3)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(25, 118, 210, 0.5)',
            },
          },
        }}
      >
        <Table size="small" sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f8fbff' }}>
              {currentStage === 'COMPLETE_O2D' ? (
                <>
                  <TableCell sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>Dispatch ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>Date of Dispatch</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>Product/Spec</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>Total Length (m)</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>Batch Size (pcs)</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>DATE ENTRY</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>Total Cable</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>Actions</TableCell>
                </>
              ) : (
                <>
                  {currentStage === 'CABLE_PRODUCTION' && (() => {
                    // Check if any task has Store 1 completed to show header checkbox
                    const hasStore1CompletedTask = filteredTasks.some(task => {
                      const dispatchRecord = task._dispatchRecord || task;
                      const store1Status = dispatchRecord.store1Status || 'NEW';
                      return getStatusOnly(store1Status) === 'COMPLETED';
                    });
                    
                    // Only show header checkbox if there are tasks with Store 1 completed
                    if (!hasStore1CompletedTask) {
                      return null;
                    }
                    
                    return (
                      <TableCell padding="checkbox" sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>
                        <Tooltip title="Select batches with same Unique ID to combine (only shown when Store 1 is completed)">
                          <Checkbox
                            indeterminate={false}
                            checked={false}
                            disabled
                            size="small"
                          />
                        </Tooltip>
                      </TableCell>
                    );
                  })()}
                  <TableCell sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>Dispatch ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>Unique ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>Client</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>Batch</TableCell>
                  {currentStage !== 'RECEIVING_DOCUMENTS' && currentStage !== 'MOULDING' && (
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>Status</TableCell>
                  )}
                  {currentStage === 'MOULDING' && (
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>Move History</TableCell>
                  )}
                  {currentStage !== 'RECEIVING_DOCUMENTS' && (
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>Due Date</TableCell>
                  )}
                  {currentStage !== 'RECEIVING_DOCUMENTS' && currentStage !== 'MOULDING' && (
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>Completed Date</TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>Dispatch Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>Assigned To</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.7rem', py: 1 }}>Actions</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTasks.length > 0 ? (
              paginatedTasks.map((task) => {
                const taskKey = task._uniqueKey || task.DispatchUniqueId || task.UniqueId;
                const isSelected = selectedTasks.has(taskKey);
                return (
                <TableRow 
                  key={task._uniqueKey || task.DispatchUniqueId || task.UniqueId || task.POId}
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: currentStage === 'COMPLETE_O2D' ? 'transparent' : '#f8fbff',
                      transition: 'background-color 0.2s ease'
                    },
                    '&:nth-of-type(even)': {
                      backgroundColor: currentStage === 'COMPLETE_O2D' ? 'transparent' : '#fafbfc'
                    },
                    backgroundColor: currentStage === 'COMPLETE_O2D' 
                      ? 'transparent' 
                      : (isOverdue(task.DueDate) ? '#fff4f4' : isSelected && currentStage === 'CABLE_PRODUCTION' ? '#f3e5f5' : 'inherit'),
                    borderBottom: currentStage === 'COMPLETE_O2D' ? '1px solid #e0e0e0' : 'inherit',
                    borderLeft: isSelected && currentStage === 'CABLE_PRODUCTION' ? '3px solid #9c27b0' : 'none',
                    '& .MuiTableCell-root': {
                      paddingTop: '4px',
                      paddingBottom: '4px'
                    }
                  }}
                >
                  {currentStage === 'COMPLETE_O2D' ? (
                    <>
                      {/* Dispatch ID */}
                      <TableCell>
                        <Chip
                          label={task.DispatchUniqueId || 'N/A'}
                          size="small"
                          sx={{
                            backgroundColor: task.DispatchUniqueId ? '#e8f5e9' : '#f5f5f5',
                            color: task.DispatchUniqueId ? '#2e7d32' : '#9e9e9e',
                            fontWeight: 600,
                            fontFamily: 'monospace',
                            fontSize: '0.7rem'
                          }}
                        />
                      </TableCell>
                      
                      {/* Date of Dispatch */}
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.8rem',
                            color: '#000000',
                            fontFamily: 'sans-serif',
                            textAlign: 'left',
                            fontVariantNumeric: 'tabular-nums',
                            letterSpacing: '0.01em'
                          }}
                        >
                          {formatDate(task.DispatchDate) || 'N/A'}
                        </Typography>
                      </TableCell>
                      
                      {/* Customer */}
                      <TableCell>
                        <Chip
                          label={task.ClientCode || 'N/A'}
                          size="small"
                          sx={{
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            width: 'fit-content'
                          }}
                        />
                      </TableCell>
                      
                      {/* Product/Spec */}
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#37474f', fontWeight: 500, fontSize: '0.8rem' }}>
                          {task.ProductCode || 'N/A'}
                        </Typography>
                      </TableCell>
                      
                      {/* Total Length (m) */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {task.TotalLength || 'N/A'}
                        </Typography>
                      </TableCell>
                      
                      {/* Batch Size (pcs) */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                          {/* For Complete O2D, show original BatchSize/Quantity */}
                          {currentStage === 'COMPLETE_O2D' 
                            ? (task.BatchSize || task.Quantity || 0).toLocaleString()
                            : (task.updatedBatch || task.BatchSize || task.Quantity || 0).toLocaleString()}
                        </Typography>
                      </TableCell>
                      
                      {/* DATE ENTRY */}
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.8rem',
                            color: '#000000',
                            fontFamily: 'sans-serif',
                            textAlign: 'left',
                            fontVariantNumeric: 'tabular-nums',
                            letterSpacing: '0.01em'
                          }}
                        >
                          {task.DateEntry ? formatDate(task.DateEntry) : 'N/A'}
                        </Typography>
                      </TableCell>
                      
                      {/* Total Cable */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {task.TotalCable || 'N/A'}
                        </Typography>
                      </TableCell>
                      
                      {/* Actions */}
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          {currentStage === 'COMPLETE_O2D' && (
                            <Tooltip title="View Specifications">
                              <IconButton 
                                size="small"
                                onClick={() => {
                                  setSelectedTaskForSpecs(task);
                                  setSpecsDialogOpen(true);
                                }}
                                sx={{ 
                                  color: '#4caf50',
                                  '&:hover': { 
                                    backgroundColor: '#e8f5e9',
                                    transform: 'scale(1.05)'
                                  },
                                  transition: 'all 0.2s ease-in-out'
                                }}
                              >
                                <Info fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </>
                  ) : (
                    <>
                  {/* Checkbox for Cable Production stage - only show when Store 1 is completed */}
                  {currentStage === 'CABLE_PRODUCTION' && (() => {
                    // Check if Store 1 is completed
                    const dispatchRecord = task._dispatchRecord || task;
                    const store1Status = dispatchRecord.store1Status || 'NEW';
                    const isStore1Completed = getStatusOnly(store1Status) === 'COMPLETED';
                    
                    // Only show checkbox if Store 1 is completed
                    if (!isStore1Completed) {
                      return null;
                    }
                    
                    return (
                      <TableCell padding="checkbox">
                        {(() => {
                          const taskKey = task._uniqueKey || task.DispatchUniqueId || task.UniqueId;
                          const hasBeenMoved = isTaskMoved(task);
                          const isDisabled = hasBeenMoved || (() => {
                            // Disable if there are other selected tasks with different Unique ID
                            if (selectedTasks.size === 0) return false;
                            const firstSelected = Array.from(selectedTasks).map(key => {
                              return filteredTasks.find(t => {
                                const tKey = t._uniqueKey || t.DispatchUniqueId || t.UniqueId;
                                return tKey === key;
                              });
                            }).find(t => t);
                            return firstSelected && firstSelected.UniqueId !== task.UniqueId;
                          })();
                          
                          return (
                            <Tooltip 
                              title={hasBeenMoved ? "This batch has already been moved to Cable Production (found in production plan) and cannot be selected again" : ""}
                              arrow
                            >
                              <span>
                                <Checkbox
                                  checked={selectedTasks.has(taskKey)}
                                  onChange={(e) => handleTaskSelect(task, e.target.checked)}
                                  size="small"
                                  disabled={isDisabled}
                                />
                              </span>
                            </Tooltip>
                          );
                        })()}
                      </TableCell>
                    );
                  })()}
                  {/* Dispatch Unique ID */}
                  <TableCell sx={{ py: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip
                        label={task.DispatchUniqueId || 'N/A'}
                        size="small"
                        sx={{
                          backgroundColor: task.DispatchUniqueId ? '#e8f5e9' : '#f5f5f5',
                          color: task.DispatchUniqueId ? '#2e7d32' : '#9e9e9e',
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          fontSize: '0.65rem',
                          height: '20px'
                        }}
                      />
                      {isOverdue(task.DueDate) && (
                        <Tooltip title="Overdue">
                          <Warning color="error" fontSize="small" sx={{ ml: 0.5, fontSize: '0.875rem' }} />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>

                  {/* Unique ID */}
                  <TableCell sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600, 
                        color: '#7b1fa2',
                        fontFamily: 'monospace',
                        fontSize: '0.65rem',
                        backgroundColor: '#f3e5f5',
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 1,
                        display: 'inline-block'
                      }}
                    >
                      {task.UniqueId || 'N/A'}
                    </Typography>
                  </TableCell>

                  {/* Client */}
                  <TableCell sx={{ py: 0.5 }}>
                    <Chip
                      label={task.ClientCode}
                      size="small"
                      sx={{
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        height: '20px'
                      }}
                    />
                  </TableCell>

                  {/* Product */}
                  <TableCell sx={{ py: 0.5 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      <Typography variant="body2" sx={{ color: '#37474f', fontWeight: 500, fontSize: '0.7rem' }}>
                        {task.ProductCode}
                      </Typography>
                      {(task.ProductName || task.Name) && (
                        <Typography variant="caption" sx={{ color: '#546e7a', fontSize: '0.65rem' }}>
                          {(task.ProductName || task.Name).length > 18 
                            ? `${(task.ProductName || task.Name).substring(0, 18)}...` 
                            : (task.ProductName || task.Name)}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  {/* Batch */}
                  <TableCell sx={{ py: 0.5 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#f57c00',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      >
                        Batch #{task.BatchNumber || '1'}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#546e7a',
                          fontSize: '0.65rem'
                        }}
                      >
                        {/* For Store 1, Complete O2D, and Dispatch, show original BatchSize/Quantity. For other stages, show updatedBatch if exists */}
                        {(() => {
                          if (currentStage === 'STORE1' || currentStage === 'COMPLETE_O2D' || currentStage === 'DISPATCH') {
                            // Show original batch size for Store 1, Complete O2D, and Dispatch
                            // For DISPATCH: Always use BatchSize from sheet, NEVER use updatedBatch or moveToFg
                            if (currentStage === 'DISPATCH') {
                              // For DISPATCH stage: ONLY use BatchSize, never fall back to updatedBatch
                              const batchSize = parseFloat(task.BatchSize || 0);
                              return batchSize > 0 ? batchSize.toLocaleString() : '0';
                            }
                            // For STORE1 and COMPLETE_O2D: use BatchSize or Quantity
                            const batchSize = parseFloat(task.BatchSize || task.Quantity || 0);
                            return batchSize.toLocaleString();
                          } else if (currentStage === 'FG_SECTION') {
                            // For FG Section: show moveToFg if exists, otherwise 0
                            const moveToFg = parseFloat(task.moveToFg || 0);
                            return moveToFg.toLocaleString();
                          } else if (currentStage === 'MOULDING') {
                            // For Molding stage: if there's a split (mouldingRemaining exists and > 0), show the remaining quantity
                            // Otherwise show the normal batch size
                            const remaining = parseFloat(task.mouldingRemaining || task.mouldingRemair || 0);
                            if (remaining > 0) {
                              return remaining.toLocaleString();
                            } else {
                              // No split, show normal batch size
                              return (task.updatedBatch || task.BatchSize || task.Quantity || 0).toLocaleString();
                            }
                          } else {
                            // For other stages, show updatedBatch if exists, otherwise original
                            return (task.updatedBatch || task.BatchSize || task.Quantity || 0).toLocaleString();
                          }
                        })()} pcs
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Move History - Only show in MOULDING stage */}
                  {currentStage === 'MOULDING' && (
                    <TableCell sx={{ py: 0.5 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Info />}
                        onClick={() => handleOpenMoveHistoryDialog(task)}
                        sx={{
                          fontSize: '0.7rem',
                          textTransform: 'none',
                          borderColor: task.moveHistory ? '#1976d2' : '#9e9e9e',
                          color: task.moveHistory ? '#1976d2' : '#9e9e9e',
                          '&:hover': {
                            borderColor: task.moveHistory ? '#1565c0' : '#9e9e9e',
                            backgroundColor: task.moveHistory ? '#e3f2fd' : 'transparent'
                          }
                        }}
                        disabled={!task.moveHistory}
                      >
                        {task.moveHistory ? 'View Details' : 'No History'}
                      </Button>
                    </TableCell>
                  )}

                  {/* Status - Hide in RECEIVING_DOCUMENTS and MOULDING tabs */}
                  {currentStage !== 'RECEIVING_DOCUMENTS' && currentStage !== 'MOULDING' && (
                    <TableCell sx={{ py: 0.5 }}>
                      <StatusBadge status={task.Status} size="small" />
                    </TableCell>
                  )}

                  {/* Due Date - Hide in RECEIVING_DOCUMENTS tab */}
                  {currentStage !== 'RECEIVING_DOCUMENTS' && (
                    <TableCell sx={{ py: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Schedule fontSize="small" sx={{ color: '#546e7a', fontSize: '0.875rem' }} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: isOverdue(task.DueDate) ? '#d32f2f' : '#37474f',
                            fontWeight: isOverdue(task.DueDate) ? 600 : 400,
                            fontSize: '0.7rem'
                          }}
                        >
                          {formatDate(task.DueDate)}
                        </Typography>
                      </Box>
                    </TableCell>
                  )}

                  {/* Completed Date - Hide in RECEIVING_DOCUMENTS and MOULDING tabs */}
                  {currentStage !== 'RECEIVING_DOCUMENTS' && currentStage !== 'MOULDING' && (
                    <TableCell sx={{ py: 0.5 }}>
                      {task.CompletionDate ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CheckCircle fontSize="small" sx={{ color: '#4caf50', fontSize: '0.875rem' }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#2e7d32',
                              fontWeight: 500,
                              fontSize: '0.7rem'
                            }}
                          >
                            {formatCompletionDate(task.CompletionDate)}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#9e9e9e', fontStyle: 'italic', fontSize: '0.65rem' }}>
                          Not completed
                        </Typography>
                      )}
                    </TableCell>
                  )}

                  {/* Dispatch Date */}
                  <TableCell sx={{ py: 0.5 }}>
                    {task.DispatchDate ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocalShipping fontSize="small" sx={{ color: '#4caf50', fontSize: '0.875rem' }} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#2e7d32',
                            fontWeight: 500,
                            fontSize: '0.7rem'
                          }}
                        >
                          {formatDate(task.DispatchDate)}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#9e9e9e', fontStyle: 'italic', fontSize: '0.65rem' }}>
                        Not scheduled
                      </Typography>
                    )}
                  </TableCell>

                  {/* Assigned To */}
                  <TableCell sx={{ py: 0.5 }}>
                    {task.AssignedTo ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Assignment fontSize="small" sx={{ color: '#1976d2', fontSize: '0.875rem' }} />
                        <Typography variant="body2" sx={{ color: '#37474f', fontSize: '0.7rem' }}>
                          {task.AssignedTo.split('@')[0]}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#9e9e9e', fontStyle: 'italic', fontSize: '0.65rem' }}>
                        Unassigned
                      </Typography>
                    )}
                  </TableCell>

                  {/* Actions with Flow Arrows */}
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* WhatsApp Button - ALWAYS SHOW FOR TESTING */}
                      {currentStage && currentStage !== 'RECEIVING_DOCUMENTS' && currentStage !== 'COMPLETE_O2D' && task && (
                        <WhatsAppButton
                          task={task}
                          stageName={currentStage}
                          status={getStatusOnly(task.Status || 'NEW')}
                          size="small"
                          variant="icon"
                        />
                      )}
                      
                      {/* Receiving Documents Actions - Show only in receiving documents tab */}
                      {currentStage === 'RECEIVING_DOCUMENTS' && onUploadReceivingDocument && (
                        <ReceivingDocumentActions
                          task={task}
                          onUpload={onUploadReceivingDocument}
                          onView={(doc) => {}}
                        />
                      )}

                      {/* Delete Task */}
                      {onDeleteTask && (
                        <Tooltip title="Delete Task">
                          <IconButton
                            size="small"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete this task? This action cannot be undone.`)) {
                                onDeleteTask(task);
                              }
                            }}
                            sx={{
                              color: '#d32f2f',
                              '&:hover': { 
                                backgroundColor: '#ffebee',
                                transform: 'scale(1.05)'
                              },
                              transition: 'all 0.2s ease-in-out'
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}


                      {/* Edit Stage Date - Only for production stages (hide in Receiving Documents tab) */}
                      {currentStage !== 'RECEIVING_DOCUMENTS' && (() => {
                        const hasDispatchId = task.DispatchUniqueId && task.DispatchUniqueId !== 'N/A';
                        const isProductionStage = canEditStageDate(task.Status);
                        const hasHandler = !!onEditStageDate;
                        const showEdit = hasDispatchId && isProductionStage && hasHandler;

                        return showEdit ? (
                          <Tooltip title="Edit Stage Date">
                            <IconButton
                              size="small"
                              onClick={() => {

                                onEditStageDate(task, currentStage);

                              }}
                              sx={{
                                color: '#ff9800',
                                '&:hover': { backgroundColor: '#fff3e0' }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : null;
                      })()}


                      {/* Flow Action Arrows - Don't show in receiving documents tab */}
                      {currentStage !== 'RECEIVING_DOCUMENTS' && getFlowActionArrows(task.Status, currentUser.email, task.AssignedTo, task).map((action, index) => (
                        <Tooltip key={index} title={action.tooltip}>
                          <IconButton
                            size="small"
                            onClick={() => {

                              if (action.action === 'advance') {
                                onAdvanceTask(task);
                              } else if (action.action.startsWith('move_to_')) {

                                onMoveToModule && onMoveToModule(task, action.action);
                              } else if (action.action === 'update_status') {
                                // For Cable Production, FG Section, and Moulding, open combined dialog (batch size + status update)
                                if (currentStage === 'CABLE_PRODUCTION' && task._fromDispatches && task.DispatchUniqueId) {
                                  handleOpenCombinedBatchSizeDialog(task);
                                } else if (currentStage === 'FG_SECTION' && task._fromDispatches && task.DispatchUniqueId) {
                                  handleOpenFgCombinedDialog(task);
                                } else if (currentStage === 'MOULDING' && task._fromDispatches && task.DispatchUniqueId) {
                                  handleOpenMouldingCombinedDialog(task);
                                } else {
                                  // For other stages, directly update status without popup
                                  onUpdateStatus && onUpdateStatus(task);
                                }
                              } else if (action.action === 'complete_work') {
                                // User will provide the logic for this action
                                // Placeholder: This will be updated based on user's requirements
                                console.log('Complete work action clicked for:', task);
                              } else if (action.action === 'move_stage') {
                                // For Cable Production, show batch size update dialog before moving
                                if (currentStage === 'CABLE_PRODUCTION' && task._fromDispatches && task.DispatchUniqueId) {
                                  setTaskToMove(task);
                                  setMoveBatchSize(task.updatedBatch || task.BatchSize || task.Quantity || '');
                                  setMoveWithBatchSizeDialogOpen(true);
                                } else {
                                  onMoveStage && onMoveStage(task);
                                }
                              }
                            }}
                            disabled={action.disabled}
                            sx={{
                              color: action.color,
                              '&:hover': { backgroundColor: action.hoverColor },
                              '&:disabled': { color: '#ccc' }
                            }}
                          >
                            {action.icon}
                          </IconButton>
                        </Tooltip>
                      ))}
                    </Box>
                  </TableCell>
                    </>
                  )}
                </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={currentStage === 'COMPLETE_O2D' ? 9 : currentStage === 'RECEIVING_DOCUMENTS' ? 8 : (currentStage === 'CABLE_PRODUCTION' ? 12 : 11)} align="center" sx={{ py: 6 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Assignment sx={{ fontSize: 60, color: '#e3f2fd', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#546e7a', mb: 1 }}>
                      {searchQuery ? 'No tasks match your search criteria' : 'No tasks available'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#9e9e9e', mb: 2 }}>
                      {searchQuery ? 'Try adjusting your search terms' : 'Tasks will appear here when they are created'}
                    </Typography>
                    {searchQuery && (
                      <Button 
                        variant="outlined"
                        onClick={() => setSearchQuery('')}
                        sx={{
                          borderColor: '#1976d2',
                          color: '#1976d2',
                          '&:hover': {
                            borderColor: '#1565c0',
                            backgroundColor: '#f8fbff'
                          }
                        }}
                      >
                        Clear Search
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Update Batch Size Dialog */}
      <Dialog
        open={batchSizeDialogOpen}
        onClose={handleCloseBatchSizeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Update Batch Size
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Update the batch size for <strong>Batch #{selectedTask?.BatchNumber || '1'}</strong>
            {selectedTask?.ProductCode && ` - ${selectedTask.ProductCode}`}
          </DialogContentText>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Original Batch Size: <strong>{(selectedTask?.BatchSize || selectedTask?.Quantity || 0).toLocaleString()} pcs</strong>
            </Typography>
            {selectedTask?.updatedBatch && selectedTask.updatedBatch !== selectedTask?.BatchSize && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Updated Batch Size: <strong>{selectedTask.updatedBatch.toLocaleString()} pcs</strong>
              </Typography>
            )}
          </Box>
          <TextField
            autoFocus
            margin="dense"
            label="New Batch Size"
            type="number"
            fullWidth
            variant="outlined"
            value={newBatchSize}
            onChange={(e) => setNewBatchSize(e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">pcs</InputAdornment>
            }}
            inputProps={{
              min: 1,
              step: 1
            }}
            helperText="Enter the updated batch size. Original batch size will be preserved."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBatchSizeDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveBatchSize} 
            variant="contained" 
            color="primary"
            disabled={!newBatchSize || parseFloat(newBatchSize) <= 0}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Move with Batch Size Update Dialog - For Cable Production */}
      <Dialog
        open={moveWithBatchSizeDialogOpen}
        onClose={handleCloseMoveWithBatchSizeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Update Batch Size & Move to Store 2
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Update the batch size for <strong>Batch #{taskToMove?.BatchNumber || '1'}</strong>
            {taskToMove?.ProductCode && ` - ${taskToMove.ProductCode}`}
            <br />
            <strong>This batch size will be used for Store 2, Moulding, FG Section, and Dispatch stages.</strong>
          </DialogContentText>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Original Batch Size: <strong>{(taskToMove?.BatchSize || taskToMove?.Quantity || 0).toLocaleString()} pcs</strong>
            </Typography>
            {taskToMove?.updatedBatch && taskToMove.updatedBatch !== taskToMove?.BatchSize && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Updated Batch Size: <strong>{taskToMove.updatedBatch.toLocaleString()} pcs</strong>
              </Typography>
            )}
          </Box>
          <TextField
            autoFocus
            margin="dense"
            label="New Batch Size"
            type="number"
            fullWidth
            variant="outlined"
            value={moveBatchSize}
            onChange={(e) => setMoveBatchSize(e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">pcs</InputAdornment>
            }}
            inputProps={{
              min: 1,
              step: 1
            }}
            helperText="Enter the updated batch size. This will update the batch size for all subsequent stages."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMoveWithBatchSizeDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateBatchSizeAndMove} 
            variant="contained" 
            color="primary"
            disabled={!moveBatchSize || parseFloat(moveBatchSize) <= 0}
          >
            Update Batch Size & Move to Store 2
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Specifications Dialog */}
      <Dialog
        open={specsDialogOpen}
        onClose={() => {
          setSpecsDialogOpen(false);
          setSelectedTaskForSpecs(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Product Specifications
          {selectedTaskForSpecs?.ProductCode && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {selectedTaskForSpecs.ProductCode}
              {selectedTaskForSpecs.ClientCode && ` - ${selectedTaskForSpecs.ClientCode}`}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            {/* Product Specifications */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'primary.main' }}>
                Product Specifications
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Number of Cores
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedTaskForSpecs?.NumberOfCores || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Copper Strands
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedTaskForSpecs?.CopperStrands || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Copper Gauge
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedTaskForSpecs?.CopperGauge || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Core OD
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedTaskForSpecs?.CoreOD || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Outer OD
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedTaskForSpecs?.OuterOD || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Material Specifications */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'primary.main' }}>
                Material Specifications
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Copper Consumption
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedTaskForSpecs?.CopperConsumption || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    PVC Core
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedTaskForSpecs?.PVCCore || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    PVC Sheath
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedTaskForSpecs?.PVCSheath || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    PVC Type
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedTaskForSpecs?.PVCType || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    PP
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedTaskForSpecs?.PP || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    PVC Moulding
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedTaskForSpecs?.PVCMoulding || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    PVC Type (Moulding)
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedTaskForSpecs?.PVCTypeMoulding || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    PVC Grommet
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedTaskForSpecs?.PVCGrommet || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setSpecsDialogOpen(false);
              setSelectedTaskForSpecs(null);
            }}
            variant="contained"
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
        
      {/* Advanced Pagination */}
      <AdvancedPagination
        totalItems={filteredTasks.length}
        itemsPerPage={rowsPerPage}
        currentPage={page + 1}
        onPageChange={(newPage) => setPage(newPage - 1)}
        onItemsPerPageChange={(newRowsPerPage) => {
          setRowsPerPage(newRowsPerPage);
          setPage(0);
        }}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        showPageSizeOptions={true}
        showJumpToPage={true}
        showStatistics={true}
        showRefreshButton={false}
        sx={{
          border: '1px solid #e3f2fd',
          backgroundColor: 'rgba(248, 250, 255, 0.5)'
        }}
      />

      {/* Combined Batch Size Update & Status Update Dialog - For Cable Production */}
      <Dialog
        open={combinedBatchSizeDialogOpen}
        onClose={handleCloseCombinedBatchSizeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Update Batch Size & Complete Status
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Update the batch size for <strong>Batch #{selectedTaskForCombined?.BatchNumber || '1'}</strong>
            {selectedTaskForCombined?.ProductCode && ` - ${selectedTaskForCombined.ProductCode}`}
          </DialogContentText>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Original Batch Size: <strong>{(selectedTaskForCombined?.BatchSize || selectedTaskForCombined?.Quantity || 0).toLocaleString()} pcs</strong>
            </Typography>
            {selectedTaskForCombined?.updatedBatch && selectedTaskForCombined.updatedBatch !== selectedTaskForCombined?.BatchSize && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Updated Batch Size: <strong>{selectedTaskForCombined.updatedBatch.toLocaleString()} pcs</strong>
              </Typography>
            )}
          </Box>
          <TextField
            autoFocus
            margin="dense"
            label="Batch Size"
            type="number"
            fullWidth
            variant="outlined"
            value={combinedBatchSize}
            onChange={(e) => setCombinedBatchSize(e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">pcs</InputAdornment>
            }}
            inputProps={{
              min: 1,
              step: 1
            }}
            helperText="Enter the batch size. This will be saved as the updated batch size."
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={markAsCompleted}
                onChange={(e) => setMarkAsCompleted(e.target.checked)}
                color="primary"
              />
            }
            label="Mark Cable Production as Completed"
          />
          {markAsCompleted && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
              This will update the batch size and mark the Cable Production stage as completed.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCombinedBatchSizeDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCombinedBatchSizeAndStatus} 
            variant="contained" 
            color="primary"
            disabled={!combinedBatchSize || parseFloat(combinedBatchSize) <= 0}
          >
            {markAsCompleted ? 'Update & Complete' : 'Update Batch Size'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Combined Batch Size Update & Status Update Dialog - For Moulding */}
      <Dialog
        open={mouldingCombinedDialogOpen}
        onClose={handleCloseMouldingCombinedDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Update Batch Size & Complete Status
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Update the batch size for <strong>Batch #{selectedTaskForMouldingCombined?.BatchNumber || '1'}</strong>
            {selectedTaskForMouldingCombined?.ProductCode && ` - ${selectedTaskForMouldingCombined.ProductCode}`}
          </DialogContentText>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Original Batch Size: <strong>{(selectedTaskForMouldingCombined?.BatchSize || selectedTaskForMouldingCombined?.Quantity || 0).toLocaleString()} pcs</strong>
            </Typography>
            {selectedTaskForMouldingCombined?.updatedBatch && selectedTaskForMouldingCombined.updatedBatch !== selectedTaskForMouldingCombined?.BatchSize && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Batch Size in Molding: <strong>{parseFloat(selectedTaskForMouldingCombined.updatedBatch || selectedTaskForMouldingCombined.BatchSize || selectedTaskForMouldingCombined.Quantity || 0).toLocaleString()} pcs</strong>
              </Typography>
            )}
          </Box>
          <TextField
            autoFocus
            margin="dense"
            label="Quantity to Move to FG"
            type="number"
            fullWidth
            variant="outlined"
            value={mouldingCombinedBatchSize}
            onChange={(e) => {
              const value = e.target.value;
              setMouldingCombinedBatchSize(value);
            }}
            InputProps={{
              endAdornment: <InputAdornment position="end">pcs</InputAdornment>
            }}
            inputProps={{
              min: 1,
              step: 1
            }}
            helperText={
              (() => {
                const current = parseFloat(selectedTaskForMouldingCombined?.updatedBatch || selectedTaskForMouldingCombined?.BatchSize || selectedTaskForMouldingCombined?.Quantity || 0);
                const entered = parseFloat(mouldingCombinedBatchSize || 0);
                if (entered > 0 && entered < current) {
                  const remaining = current - entered;
                  return `Enter the quantity to move to FG. ${remaining.toLocaleString()} pcs will remain in Molding.`;
                } else if (entered >= current) {
                  return `Enter the quantity to move to FG. This will move the full batch to FG.`;
                }
                return "Enter the quantity to move to FG. Remaining quantity will stay in Molding.";
              })()
            }
            sx={{ mb: 2 }}
          />
          {(() => {
            const current = parseFloat(selectedTaskForMouldingCombined?.updatedBatch || selectedTaskForMouldingCombined?.BatchSize || selectedTaskForMouldingCombined?.Quantity || 0);
            const entered = parseFloat(mouldingCombinedBatchSize || 0);
            if (entered > 0 && entered < current) {
              const remaining = current - entered;
              return (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>{entered.toLocaleString()} pcs</strong> will move to FG Section<br />
                    <strong>{remaining.toLocaleString()} pcs</strong> will remain in Molding
                  </Typography>
                </Alert>
              );
            }
            return null;
          })()}
          <FormControlLabel
            control={
              <Checkbox
                checked={mouldingMarkAsCompleted}
                onChange={(e) => setMouldingMarkAsCompleted(e.target.checked)}
                color="primary"
              />
            }
            label="Mark Moulding as Completed"
          />
          {mouldingMarkAsCompleted && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
              This will update the batch size and mark the Moulding stage as completed.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMouldingCombinedDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveMouldingCombinedBatchSizeAndStatus} 
            variant="contained" 
            color="primary"
            disabled={!mouldingCombinedBatchSize || parseFloat(mouldingCombinedBatchSize) <= 0}
          >
            {mouldingMarkAsCompleted ? 'Update & Complete' : 'Update Batch Size'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Combined Batch Size Update & Status Update Dialog - For FG Section */}
      <Dialog
        open={fgCombinedDialogOpen}
        onClose={handleCloseFgCombinedDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Move Batch to FG
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Update the batch size for <strong>Batch #{selectedTaskForFgCombined?.BatchNumber || '1'}</strong>
            {selectedTaskForFgCombined?.ProductCode && ` - ${selectedTaskForFgCombined.ProductCode}`}
          </DialogContentText>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Batch Size: <strong>{(selectedTaskForFgCombined?.moveToFg || selectedTaskForFgCombined?.updatedBatch || selectedTaskForFgCombined?.BatchSize || selectedTaskForFgCombined?.Quantity || 0).toLocaleString()} pcs</strong>
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={fgMarkAsCompleted}
                onChange={(e) => setFgMarkAsCompleted(e.target.checked)}
                color="primary"
              />
            }
            label="Mark FG Section as Completed"
          />
          {fgMarkAsCompleted && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
              This will mark the FG Section stage as completed.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFgCombinedDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveFgCombinedBatchSizeAndStatus} 
            variant="contained" 
            color="primary"
            disabled={!fgMarkAsCompleted}
          >
            {fgMarkAsCompleted ? 'Update & Complete' : 'Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Move History Details Dialog */}
      <Dialog
        open={moveHistoryDialogOpen}
        onClose={handleCloseMoveHistoryDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Move History Details - Batch #{selectedTaskForMoveHistory?.BatchNumber || '1'}
          {selectedTaskForMoveHistory?.ProductCode && ` - ${selectedTaskForMoveHistory.ProductCode}`}
        </DialogTitle>
        <DialogContent>
          {(() => {
            try {
              const moveHistory = selectedTaskForMoveHistory?.moveHistory;
              if (!moveHistory) {
                return (
                  <Typography variant="body2" sx={{ color: '#9e9e9e', fontStyle: 'italic', textAlign: 'center', py: 3 }}>
                    No move history available for this batch.
                  </Typography>
                );
              }
              
              // Parse moveHistory if it's a string (JSON)
              let historyData = moveHistory;
              if (typeof moveHistory === 'string') {
                try {
                  historyData = JSON.parse(moveHistory);
                } catch (e) {
                  return (
                    <Typography variant="body2" sx={{ color: '#d32f2f', py: 2 }}>
                      Error parsing move history data.
                    </Typography>
                  );
                }
              }
              
              // Handle array of history entries
              if (Array.isArray(historyData)) {
                return (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
                      Move History ({historyData.length} {historyData.length === 1 ? 'entry' : 'entries'})
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {historyData.map((entry, index) => (
                        <Card key={index} variant="outlined" sx={{ p: 2, backgroundColor: '#fafafa' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                              Entry #{index + 1}
                            </Typography>
                            <Chip 
                              label={entry.date || entry.Date || 'N/A'} 
                              size="small" 
                              sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 100 }}>
                                Quantity:
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 600 }}>
                                {entry.quantity || entry.Quantity || entry.qty || 0} pcs
                              </Typography>
                            </Box>
                            {entry.remaining !== undefined && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 100 }}>
                                  Remaining:
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#f57c00', fontWeight: 600 }}>
                                  {entry.remaining || entry.Remaining || 0} pcs
                                </Typography>
                              </Box>
                            )}
                            {entry.details && (
                              <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #e0e0e0' }}>
                                <Typography variant="caption" sx={{ color: '#546e7a', fontWeight: 500, display: 'block', mb: 0.5 }}>
                                  Details:
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#37474f' }}>
                                  {entry.details}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Card>
                      ))}
                    </Box>
                  </Box>
                );
              }
              
              // Handle single object
              if (typeof historyData === 'object' && historyData !== null) {
                return (
                  <Box sx={{ mt: 2 }}>
                    <Card variant="outlined" sx={{ p: 2, backgroundColor: '#fafafa' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                          Move History Entry
                        </Typography>
                        <Chip 
                          label={historyData.date || historyData.Date || 'N/A'} 
                          size="small" 
                          sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 120 }}>
                            Quantity:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 600 }}>
                            {historyData.quantity || historyData.Quantity || historyData.qty || 0} pcs
                          </Typography>
                        </Box>
                        {historyData.remaining !== undefined && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 120 }}>
                              Remaining:
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#f57c00', fontWeight: 600 }}>
                              {historyData.remaining || historyData.Remaining || 0} pcs
                            </Typography>
                          </Box>
                        )}
                        {historyData.details && (
                          <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #e0e0e0' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                              Details:
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#37474f' }}>
                              {historyData.details}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Card>
                  </Box>
                );
              }
              
              // Fallback: display as string
              return (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ color: '#37474f', whiteSpace: 'pre-wrap' }}>
                    {String(moveHistory)}
                  </Typography>
                </Box>
              );
            } catch (error) {
              console.error('Error parsing moveHistory:', error);
              return (
                <Typography variant="body2" sx={{ color: '#d32f2f', py: 2 }}>
                  Error displaying move history. Please check the data format.
                </Typography>
              );
            }
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMoveHistoryDialog} color="primary" variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    );
};

export default TaskList; 