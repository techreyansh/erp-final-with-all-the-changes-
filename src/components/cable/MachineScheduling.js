import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip,
  Stack,
  Fade,
  useTheme,
  alpha,
  TablePagination, // <-- add this
} from "@mui/material";
import {
  Build as BunchingIcon,
  Transform as ExtruderIcon,
  GroupWork as LayingIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Dashboard as DashboardIcon,
  Assignment as TaskIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import sheetService from "../../services/sheetService";
import LoadingSpinner from "../common/LoadingSpinner";
import MachineCard from "../common/MachineCard";
import WhatsAppButton from "../common/WhatsAppButton";

const MachineScheduling = () => {
  const theme = useTheme();
  const [machineSchedules, setMachineSchedules] = useState([]);
  const [timeRange, setTimeRange] = useState('24h'); // default: last 24h
  const [productionPlans, setProductionPlans] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [openPlanDetailDialog, setOpenPlanDetailDialog] = useState(false);
  const [selectedPlanSchedules, setSelectedPlanSchedules] = useState([]);
  const [selectedPlanInfo, setSelectedPlanInfo] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sheetError, setSheetError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Debounce timer for form calculations
  const calculationTimer = useRef(null);
  // Track last auto-delete run to avoid running too frequently
  const lastAutoDeleteRun = useRef(null);

  // User-configurable daily slot for scheduling (start time + duration)
  const [slotConfig, setSlotConfig] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('machineSlotConfig') : null;
    if (saved) return JSON.parse(saved);
    // default: start 06:30, 12 hours
    const d = new Date();
    d.setHours(6, 30, 0, 0);
    return { start: d.toISOString(), durationHours: 12 };
  });

  // Header plan selection for quick generation
  const [selectedPlanId, setSelectedPlanId] = useState("");

  const [formData, setFormData] = useState({
    scheduleId: "",
    planId: "",
    machineType: "",
    machineId: "",
    operation: "",
    operationSequence: 1,
    quantity: "",
    unit: "meters",
    scheduledStartTime: new Date(),
    scheduledEndTime: new Date(),
    setupTime: "",
    operationTime: "",
    cleanupTime: "",
    totalTime: "",
    actualStartTime: "",
    actualEndTime: "",
    status: "Scheduled",
    operatorName: "",
    priority: "Medium",
    shift: "Morning",
    notes: "",
  });

  // Machine types and their configurations
  const machineTypes = {
    bunching: {
      name: "Bunching Machine",
      icon: <BunchingIcon />,
      color: "#2196f3",
      machines: ["BM-001"],
      capacity: 5000, // meters per hour
      setupTime: 1.0,
      cleanupTime: 0.5,
    },
    extruder: {
      name: "Extruder Machine", 
      icon: <ExtruderIcon />,
      color: "#ff9800",
      machines: ["EXT-001"],
      capacity: 10800, // 180 m/min => m/hr
      setupTime: 1.0,
      cleanupTime: 0.5,
    },
    laying: {
      name: "Laying Machine",
      icon: <LayingIcon />,
      color: "#4caf50",
      machines: ["LAY-001"],
      capacity: 5000, // meters per hour
      setupTime: 0.5,
      cleanupTime: 0.5,
    },
    final_extruder: {
      name: "Final Extruder",
      icon: <ExtruderIcon />,
      color: "#9c27b0",
      machines: ["FEXT-001"],
      capacity: 3000, // 50 m/min => m/hr
      setupTime: 1.0,
      cleanupTime: 0.5,
    },
    // Coiling removed for cable production
  };

  const statusConfig = {
    Scheduled: { color: "info", icon: <ScheduleIcon /> },
    "In Progress": { color: "warning", icon: <StartIcon /> },
    Paused: { color: "default", icon: <PauseIcon /> },
    Completed: { color: "success", icon: <CompleteIcon /> },
    Delayed: { color: "error", icon: <WarningIcon /> },
    Failed: { color: "error", icon: <ErrorIcon /> },
  };

  const shiftOptions = [
    { value: "Morning", label: "Morning (6 AM - 2 PM)" },
    { value: "Afternoon", label: "Afternoon (2 PM - 10 PM)" },
    { value: "Night", label: "Night (10 PM - 6 AM)" },
  ];

  // Optimized: Fetch all data in parallel on mount
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchMachineSchedules(),
          fetchProductionPlans()
        ]);
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Persist slotConfig
  useEffect(() => {
    try {
      localStorage.setItem('machineSlotConfig', JSON.stringify(slotConfig));
    } catch (_) {}
  }, [slotConfig]);

  // Optimized: Batch delete old completed schedules (defined first to avoid temporal dead zone)
  const autoDeleteCompletedSchedules = useCallback(async (schedules) => {
    if (!Array.isArray(schedules) || schedules.length === 0) {
      return schedules;
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const schedulesToDelete = [];
    const schedulesToKeep = [];
    
    // First pass: identify schedules to delete
    schedules.forEach((schedule, index) => {
      if (schedule.status === "Completed") {
        try {
          const completedDate = schedule.actualEndTime 
            ? new Date(schedule.actualEndTime) 
            : (schedule.scheduledEndTime ? new Date(schedule.scheduledEndTime) : null);
          
          if (completedDate && completedDate < sevenDaysAgo) {
            schedulesToDelete.push({ schedule, index });
          } else {
            schedulesToKeep.push(schedule);
          }
        } catch (dateError) {
          // If date parsing fails, keep the schedule
          console.warn("Error parsing date for schedule:", dateError);
          schedulesToKeep.push(schedule);
        }
      } else {
        schedulesToKeep.push(schedule);
      }
    });

    // Optimized: Batch delete in reverse order (to maintain indices) using Promise.all
    if (schedulesToDelete.length > 0) {
      try {
        // Sort by index descending for safe deletion
        schedulesToDelete.sort((a, b) => b.index - a.index);
        
        // Delete all in parallel - much faster than sequential
        const deletePromises = schedulesToDelete.map(({ index }) => 
          sheetService.deleteRow("Machine Schedules", index + 2)
            .catch(error => {
              console.error(`Error deleting schedule at index ${index}:`, error);
              return null; // Continue with other deletions
            })
        );
        
        await Promise.all(deletePromises);
        
        if (schedulesToDelete.length > 0) {
          setSnackbar({
            open: true,
            message: `Auto-deleted ${schedulesToDelete.length} old completed schedules`,
            severity: "info",
          });
        }
      } catch (error) {
        console.error("Error auto-deleting completed schedules:", error);
      }
    }

    return schedulesToKeep;
  }, []);

  // Optimized: Memoized fetch with forceRefresh support (defined after autoDeleteCompletedSchedules)
  const fetchMachineSchedules = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setSheetError(null);
      const data = await sheetService.getSheetData("Machine Schedules", forceRefresh);
      
      // Optimized: Only run auto-delete once per hour to avoid performance issues
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      const shouldRunAutoDelete = !lastAutoDeleteRun.current || 
        (now - lastAutoDeleteRun.current) > oneHour;
      
      let filteredData = data;
      if (shouldRunAutoDelete && Array.isArray(data) && data.length > 0) {
        filteredData = await autoDeleteCompletedSchedules(data);
        lastAutoDeleteRun.current = now;
      }
      
      setMachineSchedules(Array.isArray(filteredData) ? filteredData : []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error fetching machine schedules:", error);
      
      // Check if it's a sheet not found error
      if (error.message && error.message.includes("does not exist")) {
        setSheetError(error.message);
      } else {
        setSnackbar({
          open: true,
          message: error.message || "Error fetching machine schedules",
          severity: "error",
        });
      }
      setMachineSchedules([]);
    }
  }, [autoDeleteCompletedSchedules]);

  // Optimized: Memoized production plans fetch
  const fetchProductionPlans = useCallback(async (forceRefresh = false) => {
    try {
      const data = await sheetService.getSheetData("Cable Production Plans", forceRefresh);
      setProductionPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching production plans:", error);
      setSnackbar({
        open: true,
        message: "Warning: Could not load production plans. Please check if 'Cable Production Plans' sheet exists.",
        severity: "warning",
      });
      setProductionPlans([]);
    }
  }, []);

  // Optimized: Memoized input change handler
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Optimized: Debounced calculation of duration and end time
  useEffect(() => {
    if (calculationTimer.current) {
      clearTimeout(calculationTimer.current);
    }
    
    calculationTimer.current = setTimeout(() => {
      if (formData.quantity && formData.machineType && formData.scheduledStartTime) {
        const machineConfig = machineTypes[formData.machineType];
        if (machineConfig) {
          const quantity = parseFloat(formData.quantity);
          if (!isNaN(quantity) && quantity > 0) {
            // Calculate operation time based on machine capacity
            const operationTime = Math.ceil((quantity / machineConfig.capacity) * 100) / 100;
            const setupTime = formData.setupTime || machineConfig.setupTime;
            const cleanupTime = formData.cleanupTime || machineConfig.cleanupTime;
            const totalTime = setupTime + operationTime + cleanupTime;
            
            // Calculate end time
            const endTime = new Date(formData.scheduledStartTime);
            endTime.setHours(endTime.getHours() + totalTime);
            
            setFormData(prev => ({ 
              ...prev, 
              setupTime: setupTime.toString(),
              operationTime: operationTime.toString(),
              cleanupTime: cleanupTime.toString(),
              totalTime: totalTime.toString(),
              scheduledEndTime: endTime
            }));
          }
        }
      }
    }, 300); // 300ms debounce

    return () => {
      if (calculationTimer.current) {
        clearTimeout(calculationTimer.current);
      }
    };
  }, [formData.quantity, formData.machineType, formData.scheduledStartTime]);

  const generateScheduleId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SCH-${timestamp}-${random}`;
  };

  // Optimized: Better validation and error handling
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Comprehensive validation
    if (!formData.planId || !formData.planId.trim()) {
      setSnackbar({
        open: true,
        message: "Plan ID is required",
        severity: "error",
      });
      return;
    }
    
    if (!formData.machineType || !formData.machineType.trim()) {
      setSnackbar({
        open: true,
        message: "Machine Type is required",
        severity: "error",
      });
      return;
    }
    
    if (!formData.machineId || !formData.machineId.trim()) {
      setSnackbar({
        open: true,
        message: "Machine ID is required",
        severity: "error",
      });
      return;
    }
    
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      setSnackbar({
        open: true,
        message: "Valid quantity is required",
        severity: "error",
      });
      return;
    }

    setSubmitting(true);

    try {
      const scheduleData = {
        ...formData,
        scheduleId: formData.scheduleId || generateScheduleId(),
        scheduledStartTime: formData.scheduledStartTime instanceof Date 
          ? formData.scheduledStartTime.toISOString() 
          : formData.scheduledStartTime,
        scheduledEndTime: formData.scheduledEndTime instanceof Date 
          ? formData.scheduledEndTime.toISOString() 
          : formData.scheduledEndTime,
        actualStartTime: formData.actualStartTime || "",
        actualEndTime: formData.actualEndTime || "",
        createdDate: new Date().toISOString().split('T')[0]
      };

      if (selectedSchedule) {
        // Update existing schedule
        const scheduleIndex = machineSchedules.findIndex(s => s.scheduleId === selectedSchedule.scheduleId);
        if (scheduleIndex === -1) {
          throw new Error("Schedule not found for update");
        }
        await sheetService.updateRow("Machine Schedules", scheduleIndex + 2, scheduleData);
        setSnackbar({
          open: true,
          message: "Machine schedule updated successfully",
          severity: "success",
        });
      } else {
        // Create new schedule
        await sheetService.appendRow("Machine Schedules", scheduleData);
        setSnackbar({
          open: true,
          message: "Machine schedule created successfully",
          severity: "success",
        });
      }
      
      // Only refetch after successful save
      await fetchMachineSchedules(true);
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving schedule:", error);
      setSnackbar({
        open: true,
        message: `Error ${selectedSchedule ? 'updating' : 'creating'} schedule: ${error.message || 'Unknown error'}`,
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }, [formData, selectedSchedule, machineSchedules, fetchMachineSchedules]);

  // Optimized: Better edit handling with error checking
  const handleEdit = useCallback((schedule) => {
    if (!schedule) {
      setSnackbar({
        open: true,
        message: "Invalid schedule selected for editing",
        severity: "error",
      });
      return;
    }

    try {
      setSelectedSchedule(schedule);
      
      // Parse dates safely
      let scheduledStartTime = new Date();
      let scheduledEndTime = new Date();
      try {
        if (schedule.scheduledStartTime) {
          scheduledStartTime = new Date(schedule.scheduledStartTime);
          if (isNaN(scheduledStartTime.getTime())) scheduledStartTime = new Date();
        }
        if (schedule.scheduledEndTime) {
          scheduledEndTime = new Date(schedule.scheduledEndTime);
          if (isNaN(scheduledEndTime.getTime())) scheduledEndTime = new Date();
        }
      } catch (dateError) {
        console.warn("Error parsing dates:", dateError);
      }

      setFormData({
        ...schedule,
        scheduledStartTime,
        scheduledEndTime,
      });
      setOpenDialog(true);
    } catch (error) {
      console.error("Error in handleEdit:", error);
      setSnackbar({
        open: true,
        message: `Error loading schedule for editing: ${error.message}`,
        severity: "error",
      });
    }
  }, []);

  // Optimized: Better delete handling with confirmation
  const handleDelete = useCallback(async (rowIndex) => {
    if (!window.confirm("Are you sure you want to delete this machine schedule?")) {
      return;
    }
    
    try {
      setLoading(true);
      await sheetService.deleteRow("Machine Schedules", rowIndex + 2);
      setSnackbar({
        open: true,
        message: "Machine schedule deleted successfully",
        severity: "success",
      });
      await fetchMachineSchedules(true);
    } catch (error) {
      console.error("Error deleting schedule:", error);
      setSnackbar({
        open: true,
        message: `Error deleting schedule: ${error.message || 'Unknown error'}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchMachineSchedules]);

  // Optimized: Better status update handling
  const updateScheduleStatus = useCallback(async (schedule, newStatus) => {
    if (!schedule || !newStatus) {
      setSnackbar({
        open: true,
        message: "Invalid schedule or status",
        severity: "error",
      });
      return;
    }

    try {
      const scheduleIndex = machineSchedules.findIndex(s => s.scheduleId === schedule.scheduleId);
      if (scheduleIndex === -1) {
        throw new Error("Schedule not found");
      }

      const now = new Date().toISOString();
      
      const updatedSchedule = { 
        ...schedule, 
        status: newStatus,
        actualStartTime: newStatus === "In Progress" ? now : (schedule.actualStartTime || ""),
        actualEndTime: newStatus === "Completed" ? now : (schedule.actualEndTime || ""),
      };
      
      await sheetService.updateRow("Machine Schedules", scheduleIndex + 2, updatedSchedule);
      setSnackbar({
        open: true,
        message: `Schedule status updated to ${newStatus}`,
        severity: "success",
      });
      
      // Optimized: Only refetch if needed, don't auto-delete immediately
      // Let the auto-delete run during the next scheduled cleanup
      await fetchMachineSchedules(true);
    } catch (error) {
      console.error("Error updating status:", error);
      setSnackbar({
        open: true,
        message: `Error updating status: ${error.message || 'Unknown error'}`,
        severity: "error",
      });
    }
  }, [machineSchedules, fetchMachineSchedules]);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSchedule(null);
    setFormData({
      scheduleId: "",
      planId: "",
      machineType: "",
      machineId: "",
      operation: "",
      operationSequence: 1,
      quantity: "",
      unit: "meters",
      scheduledStartTime: new Date(),
      scheduledEndTime: new Date(),
      setupTime: "",
      operationTime: "",
      cleanupTime: "",
      totalTime: "",
      actualStartTime: "",
      actualEndTime: "",
      status: "Scheduled",
      operatorName: "",
      priority: "Medium",
      shift: "Morning",
      notes: "",
    });
  };

  // Optimized: Memoized time-range filtering
  const getThresholdDate = useCallback(() => {
    const now = new Date();
    if (timeRange === '24h') { now.setDate(now.getDate() - 1); return now; }
    if (timeRange === '7d') { now.setDate(now.getDate() - 7); return now; }
    if (timeRange === '30d') { now.setDate(now.getDate() - 30); return now; }
    return null; // all
  }, [timeRange]);

  const isWithinRange = useCallback((schedule) => {
    const threshold = getThresholdDate();
    if (!threshold) return true;
    const ts = schedule.scheduledStartTime || schedule.scheduledEndTime || schedule.createdDate;
    if (!ts) return false;
    try {
      const d = new Date(ts);
      return !isNaN(d.getTime()) && d >= threshold;
    } catch {
      return false;
    }
  }, [getThresholdDate]);

  // Optimized: Memoized machine filtering
  const getMachinesByType = useCallback((type) => {
    return machineSchedules.filter(schedule => schedule.machineType === type && isWithinRange(schedule));
  }, [machineSchedules, isWithinRange]);

  const getMachineUtilization = useCallback((machineId) => {
    const schedules = machineSchedules.filter(s => s.machineId === machineId && s.status !== "Completed" && isWithinRange(s));
    return Math.min(100, schedules.length * 20); // Simple calculation
  }, [machineSchedules, isWithinRange]);

  const tabNames = ["Dashboard", "Schedule View", "Machine Status"];

  // Optimized: Memoized grouping of schedules by planId
  const planGroups = useMemo(() => {
    const filtered = machineSchedules.filter(isWithinRange);
    const grouped = {};
    
    filtered.forEach(schedule => {
      const planId = schedule.planId;
      if (!planId) return;
      
      if (!grouped[planId]) {
        grouped[planId] = {
          planId: planId,
          productCode: schedule.productCode || "N/A",
          schedules: [],
          earliestDate: null,
        };
      }
      
      grouped[planId].schedules.push(schedule);
      
      // Track earliest scheduled start time or created date
      try {
        const scheduleDate = schedule.scheduledStartTime 
          ? new Date(schedule.scheduledStartTime)
          : (schedule.createdDate ? new Date(schedule.createdDate) : null);
        
        if (scheduleDate && !isNaN(scheduleDate.getTime())) {
          if (!grouped[planId].earliestDate || scheduleDate < grouped[planId].earliestDate) {
            grouped[planId].earliestDate = scheduleDate;
          }
        }
      } catch (dateError) {
        console.warn("Error parsing date in groupSchedulesByPlan:", dateError);
      }
    });
    
    return Object.values(grouped);
  }, [machineSchedules, isWithinRange]);

  // Optimized: Memoized paginated plans
  const paginatedPlans = useMemo(() => {
    return planGroups.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [planGroups, page, rowsPerPage]);

  // Utility: chain schedule times and cap daily utilization to 12h (simple, single-machine unaware)
  const chainSchedulesWithDailyCap = (schedules) => {
    if (!Array.isArray(schedules) || schedules.length === 0) return [];

    // Sort by sequence to ensure order
    const ordered = [...schedules].sort((a, b) => (a.operationSequence || a.sequence || 0) - (b.operationSequence || b.sequence || 0));

    let previousEnd = null;
    let currentDayKey = null; // yyyy-mm-dd for the working day bucket
    let hoursUsedToday = 0;

    const slotStartDate = new Date(slotConfig.start);
    const START_HOUR = slotStartDate.getHours();
    const START_MINUTE = slotStartDate.getMinutes();
    const DAILY_LIMIT = Number(slotConfig.durationHours) || 12; // default 12h per day

    const moveToNextDayStart = (fromDate) => {
      const d = new Date(fromDate);
      d.setDate(d.getDate() + 1);
      d.setHours(START_HOUR, START_MINUTE, 0, 0);
      return d;
    };

    const resetDayTracking = (d) => {
      const key = d.toISOString().slice(0, 10);
      currentDayKey = key;
      hoursUsedToday = 0;
    };

    const results = [];

    ordered.forEach((s, idx) => {
      const durationHours = parseFloat(s.totalTime) || 0;
      const declaredStart = s.scheduledStartTime ? new Date(s.scheduledStartTime) : null;

      // Establish baseline start
      let start = declaredStart || previousEnd;

      if (!start) {
        // If no start yet, initialize from now with configured morning time
        const base = new Date();
        base.setHours(START_HOUR, START_MINUTE, 0, 0);
        start = base;
      }

      // Chain: must start at or after previous end
      if (previousEnd && start < previousEnd) start = new Date(previousEnd);

      // Track working day bucket
      const startDayKey = start.toISOString().slice(0, 10);
      if (currentDayKey !== startDayKey) {
        resetDayTracking(start);
        // Align first task of the day to configured morning if earlier
        const aligned = new Date(start);
        aligned.setHours(START_HOUR, START_MINUTE, 0, 0);
        if (start < aligned) start = aligned;
      }

      // If remaining capacity today is less than required, roll to next day start
      const remainingToday = Math.max(0, DAILY_LIMIT - hoursUsedToday);
      if (durationHours > remainingToday) {
        // Move to next day at configured time
        const nextDayStart = moveToNextDayStart(start);
        resetDayTracking(nextDayStart);
        start = nextDayStart;
      }

      // Compute end and update trackers
      const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
      hoursUsedToday += durationHours;
      previousEnd = end;

      results.push({
        ...s,
        _displayStart: start,
        _displayEnd: end,
      });
    });

    return results;
  };

  // Advanced: machine-aware chaining that respects existing schedules and daily slot window
  const chainWithMachineAvailability = (ops) => {
    if (!Array.isArray(ops) || ops.length === 0) return [];

    const ordered = [...ops].sort((a, b) => (a.operationSequence || a.sequence || 0) - (b.operationSequence || b.sequence || 0));

    const slotStartDate = new Date(slotConfig.start);
    const START_HOUR = slotStartDate.getHours();
    const START_MINUTE = slotStartDate.getMinutes();
    const DAILY_LIMIT = Number(slotConfig.durationHours) || 12;

    const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
    const startOfWindow = (d) => {
      const base = new Date(d);
      base.setHours(START_HOUR, START_MINUTE, 0, 0);
      return base;
    };
    const endOfWindow = (d) => {
      const s = startOfWindow(d);
      return new Date(s.getTime() + DAILY_LIMIT * 60 * 60 * 1000);
    };
    const nextWindowStart = (d) => {
      const x = new Date(d);
      x.setDate(x.getDate() + 1);
      return startOfWindow(x);
    };

    // Collect existing schedules by machineId (only within range of interest)
    const byMachine = {};
    (machineSchedules || []).forEach(s => {
      const m = s.machineId;
      if (!m) return;
      if (!byMachine[m]) byMachine[m] = [];
      const st = s.scheduledStartTime ? new Date(s.scheduledStartTime) : null;
      const et = s.scheduledEndTime ? new Date(s.scheduledEndTime) : null;
      if (st && et) byMachine[m].push({ start: st, end: et });
    });

    // Also include windows from tasks we schedule in this run
    const addInterval = (m, start, end) => {
      if (!byMachine[m]) byMachine[m] = [];
      byMachine[m].push({ start: new Date(start), end: new Date(end) });
      // keep sorted
      byMachine[m].sort((a,b) => a.start - b.start);
    };

    // Per-machine per-day used hours to enforce window cap
    const usedHoursByMachineDay = new Map(); // key: `${machineId}|${yyyy-mm-dd}` -> hours

    const getUsed = (m, d) => usedHoursByMachineDay.get(`${m}|${d}`) || 0;
    const addUsed = (m, d, h) => usedHoursByMachineDay.set(`${m}|${d}`, getUsed(m,d) + h);

    // Find earliest start time for machine m at or after t that respects existing intervals and daily window
    const findMachineEarliest = (m, t) => {
      let candidate = new Date(t);
      // Align to window start if before or outside
      const wStart = startOfWindow(candidate);
      const wEnd = endOfWindow(candidate);
      if (candidate < wStart || candidate >= wEnd) candidate = wStart;

      const intervals = (byMachine[m] || []).slice();
      let changed = true;
      while (changed) {
        changed = false;
        for (const itv of intervals) {
          if (candidate < itv.end && candidate >= itv.start) {
            candidate = new Date(itv.end);
            changed = true;
            break;
          }
        }
        // If moved outside window, advance to next day window
        if (candidate >= endOfWindow(candidate)) {
          candidate = nextWindowStart(candidate);
          changed = true;
        }
      }
      return candidate;
    };

    const results = [];
    let prevEnd = null;

    for (const s of ordered) {
      const machineId = s.machineId || s.machine || '';
      const durationHours = parseFloat(s.totalTime) || (parseFloat(s.setupTime || 0) + parseFloat(s.operationTime || 0) + parseFloat(s.cleanupTime || 0)) || 0;

      // Base candidate: either declared start, previous step end, or slot start today
      let candidate = s.scheduledStartTime ? new Date(s.scheduledStartTime) : (prevEnd ? new Date(prevEnd) : startOfWindow(new Date()));

      // Must also wait for machine availability
      candidate = findMachineEarliest(machineId, candidate);

      // Enforce daily window remaining capacity for this machine
      while (true) {
        const key = dayKey(candidate);
        const used = getUsed(machineId, key);
        const remaining = Math.max(0, DAILY_LIMIT - used);
        if (durationHours <= remaining) {
          break;
        }
        // Move to next day's window if not enough remaining
        candidate = nextWindowStart(candidate);
      }

      // End time
      const end = new Date(candidate.getTime() + durationHours * 60 * 60 * 1000);

      // Record usage and block interval for this machine
      addUsed(machineId, dayKey(candidate), durationHours);
      addInterval(machineId, candidate, end);

      const scheduled = { ...s, _displayStart: candidate, _displayEnd: end };
      results.push(scheduled);
      prevEnd = end; // maintain process sequence dependency
    }

    return results;
  };

  // Helper: check if a plan already has schedules created in sheet
  const planHasExistingSchedules = (planId) => {
    if (!planId) return false;
    return machineSchedules.some(s => s.planId === planId);
  };

  // Handle plan row click to show details
  const handlePlanRowClick = (planGroup) => {
    setSelectedPlanInfo({
      planId: planGroup.planId,
      productCode: planGroup.productCode,
      date: planGroup.earliestDate,
    });
    setSelectedPlanSchedules(planGroup.schedules.sort((a, b) => 
      (a.operationSequence || a.sequence || 0) - (b.operationSequence || b.sequence || 0)
    ));
    setOpenPlanDetailDialog(true);
  };

  // Print a plan from table row without opening dialog
  const printPlanGroup = (planGroup) => {
    if (!planGroup || !Array.isArray(planGroup.schedules)) return;
    const rows = chainSchedulesWithDailyCap(planGroup.schedules);
    const htmlRows = rows.map(r => {
      const start = r._displayStart ? new Date(r._displayStart).toLocaleString('en-GB') : '';
      const end = r._displayEnd ? new Date(r._displayEnd).toLocaleString('en-GB') : '';
      return `<tr>
        <td>${r.operationSequence || r.sequence || ''}</td>
        <td>${r.machineId || ''}</td>
        <td>${r.operation || ''}</td>
        <td>${r.quantity || ''} ${r.unit || ''}</td>
        <td>${r.totalTime || ''}h</td>
        <td>${start}</td>
        <td>${end}</td>
      </tr>`;
    }).join('');
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Plan ${planGroup.planId} Schedule</title>
          <style>
            body{font-family: Arial, sans-serif; padding:16px}
            h2{margin:0 0 12px}
            table{border-collapse: collapse; width:100%}
            th,td{border:1px solid #999; padding:6px; text-align:left; font-size:12px}
          </style>
        </head>
        <body>
          <h2>Plan ${planGroup.planId} - ${planGroup.productCode || ''}</h2>
          <table>
            <thead>
              <tr>
                <th>Seq</th><th>Machine</th><th>Operation</th><th>Qty</th><th>Duration</th><th>Start</th><th>End</th>
              </tr>
            </thead>
            <tbody>${htmlRows}</tbody>
          </table>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  // Generate schedules from a selected production plan using current slotConfig
  // Helper function to delete all machine schedules for a plan
  const deleteMachineSchedulesForPlan = useCallback(async (planId) => {
    if (!planId) return 0;
    
    try {
      const allSchedules = await sheetService.getSheetData("Machine Schedules", true);
      const schedulesToDelete = allSchedules
        .map((schedule, index) => ({ ...schedule, rowIndex: index + 2 }))
        .filter(schedule => schedule.planId === planId);
      
      if (schedulesToDelete.length === 0) {
        return 0;
      }
      
      // Delete in reverse order to maintain correct indices
      const sortedSchedules = schedulesToDelete.sort((a, b) => b.rowIndex - a.rowIndex);
      for (const schedule of sortedSchedules) {
        await sheetService.deleteRow("Machine Schedules", schedule.rowIndex);
      }

      return schedulesToDelete.length;
    } catch (error) {
      console.error(`Error deleting machine schedules for plan ${planId}:`, error);
      throw error;
    }
  }, []);

  const generateSchedulesFromPlan = async (planId) => {
    try {
      const plan = productionPlans.find(p => p.planId === planId);
      if (!plan) {
        setSnackbar({ open: true, message: "Plan not found", severity: "error" });
        return;
      }
      
      // Check if schedules already exist
      const hasExistingSchedules = planHasExistingSchedules(planId);
      if (hasExistingSchedules) {
        // Ask user if they want to regenerate (delete old and create new)
        const shouldRegenerate = window.confirm(
          `Schedules already exist for plan ${planId}. Do you want to delete existing schedules and regenerate them?\n\nThis will delete all current schedules for this plan.`
        );
        if (!shouldRegenerate) {
          return;
        }
        
        // Delete existing schedules
        const deletedCount = await deleteMachineSchedulesForPlan(planId);

      }
      // Parse machineSchedule stored on plan
      let ops = [];
      if (plan.machineSchedule) {
        try {
          const parsed = JSON.parse(plan.machineSchedule);
          const list = [];
          if (parsed.bunching) list.push({ ...parsed.bunching, machineType: 'bunching' });
          if (Array.isArray(parsed.extruder)) parsed.extruder.forEach(o => list.push({ ...o, machineType: 'extruder' }));
          if (parsed.laying) list.push({ ...parsed.laying, machineType: 'laying' });
          if (parsed.finalExtruder) list.push({ ...parsed.finalExtruder, machineType: 'final_extruder' });
          ops = list.sort((a,b) => (a.sequence||0)-(b.sequence||0));
        } catch (e) {
          console.error('Failed to parse machineSchedule on plan', e);
        }
      }
      if (!ops.length) {
        setSnackbar({ open: true, message: "Plan has no machine sequence to schedule", severity: "warning" });
        return;
      }

      // Convert to schedule-like objects expected by chaining
      const scheduleDrafts = ops.map(op => {
        const setup = Number(op.setupTime ?? 1);
        const cleanup = Number(op.cleanupTime ?? 0.5);
        const opTime = Number(op.estimatedTime ?? op.operationTime ?? 0);
        return {
          scheduleId: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
          planId: planId,
          machineType: op.machineType,
          machineId: op.machine || op.machineId,
          operation: op.operation,
          operationSequence: String(op.sequence || 0),
          productCode: plan.productCode,
          quantity: String(op.quantity || ''),
          unit: op.unit || 'meters',
          setupTime: String(setup),
          operationTime: String(opTime),
          cleanupTime: String(cleanup),
          totalTime: String(setup + opTime + cleanup),
          scheduledStartTime: new Date(slotConfig.start).toISOString(),
          status: 'Scheduled',
          shift: 'Morning',
          priority: plan.priority || 'Medium',
          notes: `Auto-generated from plan ${planId} using slot`,
        };
      });

      // Chain with machine availability and daily slot window
      const chained = chainWithMachineAvailability(scheduleDrafts);

      // Persist to sheet
      for (const sch of chained) {
        const row = {
          ...sch,
          scheduledStartTime: sch._displayStart.toISOString(),
          scheduledEndTime: sch._displayEnd.toISOString(),
          createdDate: new Date().toISOString().split('T')[0],
        };
        delete row._displayStart; delete row._displayEnd;
        await sheetService.appendRow('Machine Schedules', row);
      }

      setSnackbar({ open: true, message: `Created ${chained.length} schedule(s) for plan ${planId}`, severity: 'success' });
      await fetchMachineSchedules(true);
    } catch (error) {
      console.error('Error generating schedules from plan', error);
      setSnackbar({ open: true, message: error.message || 'Failed to generate schedules', severity: 'error' });
    }
  };

  // Print: open printable view of selected plan's chained schedule
  const printSelectedPlan = () => {
    if (!selectedPlanInfo) return;
    const rows = chainSchedulesWithDailyCap(selectedPlanSchedules);
    const htmlRows = rows.map(r => {
      const start = r._displayStart ? new Date(r._displayStart).toLocaleString('en-GB') : '';
      const end = r._displayEnd ? new Date(r._displayEnd).toLocaleString('en-GB') : '';
      return `<tr>
        <td>${r.operationSequence || r.sequence || ''}</td>
        <td>${r.machineId || ''}</td>
        <td>${r.operation || ''}</td>
        <td>${r.quantity || ''} ${r.unit || ''}</td>
        <td>${r.totalTime || ''}h</td>
        <td>${start}</td>
        <td>${end}</td>
      </tr>`;
    }).join('');
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Plan ${selectedPlanInfo.planId} Schedule</title>
          <style>
            body{font-family: Arial, sans-serif; padding:16px}
            h2{margin:0 0 12px}
            table{border-collapse: collapse; width:100%}
            th,td{border:1px solid #999; padding:6px; text-align:left; font-size:12px}
          </style>
        </head>
        <body>
          <h2>Plan ${selectedPlanInfo.planId} - ${selectedPlanInfo.productCode || ''}</h2>
          <table>
            <thead>
              <tr>
                <th>Seq</th><th>Machine</th><th>Operation</th><th>Qty</th><th>Duration</th><th>Start</th><th>End</th>
              </tr>
            </thead>
            <tbody>${htmlRows}</tbody>
          </table>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  const handleClosePlanDetailDialog = () => {
    setOpenPlanDetailDialog(false);
    setSelectedPlanSchedules([]);
    setSelectedPlanInfo(null);
  };

  // Optimized: Memoized pagination handlers
  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {sheetError && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 4,
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.error.main, 0.05),
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
          }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={fetchMachineSchedules}
              sx={{ borderRadius: 2 }}
            >
              Retry
            </Button>
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {sheetError}
          </Typography>
        </Alert>
      )}
      
      {/* Header Section */}
      <Box sx={{ mb: { xs: 4, sm: 5, md: 6 } }}>
        <Stack 
          direction={{ xs: "column", sm: "row" }} 
          justifyContent="space-between" 
          alignItems={{ xs: "flex-start", sm: "center" }} 
          spacing={2}
        >
          <Box>
            <Typography 
              variant="h3" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 1,
                fontSize: { xs: '1.75rem', sm: '2.125rem', md: '2.5rem' },
                display: "flex", 
                alignItems: "center", 
                gap: 2,
              }}
            >
              <DashboardIcon sx={{ fontSize: 'inherit', color: theme.palette.primary.main }} />
              Machine Scheduling & Monitoring
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 400,
              }}
            >
              Monitor and optimize machine allocation and production scheduling
            </Typography>
          </Box>
          {/* Plan selection + Slot configuration */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Plan ID</InputLabel>
              <Select
                label="Plan ID"
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
              >
                {productionPlans.map(p => (
                  <MenuItem key={p.planId} value={p.planId}>
                    {p.planId}{p.orderNumber ? ` - ${p.orderNumber}` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TimePicker
                label="Daily Slot Start"
                value={new Date(slotConfig.start)}
                onChange={(d) => {
                  if (!d) return;
                  const base = new Date();
                  base.setHours(d.getHours(), d.getMinutes(), 0, 0);
                  setSlotConfig((prev) => ({ ...prev, start: base.toISOString() }));
                }}
                slotProps={{ textField: { size: 'small' } }}
              />
            </LocalizationProvider>
            <TextField
              label="Slot Duration (hours)"
              size="small"
              type="number"
              value={slotConfig.durationHours}
              onChange={(e) => setSlotConfig((prev) => ({ ...prev, durationHours: Number(e.target.value) }))}
              inputProps={{ min: 1, max: 24, step: 0.5 }}
            />
            <Button
              variant="contained"
              size="small"
              disabled={!selectedPlanId || planHasExistingSchedules(selectedPlanId)}
              onClick={() => selectedPlanId && generateSchedulesFromPlan(selectedPlanId)}
            >
              Generate
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Enhanced Tabs */}
      <Box sx={{ mb: 4 }}>
        {/* Time range filter */}
        <Box sx={{ display: 'inline-flex', borderRadius: 2, overflow: 'hidden', border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, mb: 2 }}>
          {[
            { key: '24h', label: 'Last 24h' },
            { key: '7d', label: 'Last 7d' },
            { key: '30d', label: 'Last 30d' },
            { key: 'all', label: 'All time' },
          ].map(opt => (
            <Box
              key={opt.key}
              onClick={() => setTimeRange(opt.key)}
              sx={{
                px: 1.5,
                py: 0.75,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                color: timeRange === opt.key ? 'common.white' : 'primary.main',
                bgcolor: timeRange === opt.key ? 'primary.main' : 'transparent',
                '&:hover': { bgcolor: timeRange === opt.key ? 'primary.main' : alpha(theme.palette.primary.main, 0.05) }
              }}
            >
              {opt.label}
            </Box>
          ))}
        </Box>
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)} 
          sx={{ 
            '& .MuiTab-root': {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "1rem",
              minHeight: 48,
              px: 3,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          {tabNames.map((name, index) => (
            <Tab key={index} label={name} />
          ))}
        </Tabs>
      </Box>

      {/* Dashboard View */}
      {activeTab === 0 && (
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr', // Mobile: 1 card per row
              sm: 'repeat(2, 1fr)', // Tablet: 2 cards per row
              lg: 'repeat(3, 1fr)', // Desktop: 3 cards per row
            },
            gap: { xs: 3, sm: 4, md: 5 }, // Consistent gap spacing
            alignItems: 'stretch', // All cards same height
          }}
        >
          {Object.entries(machineTypes).map(([type, config], index) => {
            const typeSchedules = getMachinesByType(type);
            const inProgress = typeSchedules.filter(s => s.status === "In Progress").length;
            const scheduled = typeSchedules.filter(s => s.status === "Scheduled").length;
            
            return (
              <Fade in timeout={600 + (index * 200)} key={type}>
                <Box>
                  <MachineCard
                    name={config.name}
                    icon={config.icon}
                    color={config.color}
                    machineCount={config.machines.length}
                    capacity={config.capacity}
                    capacityUnit={"m/hr"}
                    inProgress={inProgress}
                    scheduled={scheduled}
                    machines={config.machines}
                    getMachineUtilization={getMachineUtilization}
                  />
                </Box>
              </Fade>
            );
          })}
        </Box>
      )}

      {/* Schedule View */}
      {activeTab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Plan ID</TableCell>
                <TableCell>Product Code</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPlans.map((planGroup, index) => (
                <TableRow 
                  key={planGroup.planId}
                  onClick={(e) => {
                    // Don't trigger row click if clicking on actions
                    if (e.target.closest('.MuiIconButton-root')) return;
                    handlePlanRowClick(planGroup);
                  }}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { 
                      backgroundColor: alpha(theme.palette.primary.main, 0.05) 
                    }
                  }}
                >
                  <TableCell>{planGroup.planId}</TableCell>
                  <TableCell>{planGroup.productCode}</TableCell>
                  <TableCell>
                    {planGroup.earliestDate 
                      ? planGroup.earliestDate.toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" spacing={0.5}>
                      {/* WhatsApp Button */}
                      <WhatsAppButton
                        task={{
                          POId: planGroup.orderNumber || planGroup.planId,
                          DispatchUniqueId: planGroup.planId,
                          ClientCode: planGroup.customerName,
                          ClientName: planGroup.customerName,
                          ProductCode: planGroup.productCode,
                          Status: 'SCHEDULED'
                        }}
                        stageName="CABLE_PRODUCTION"
                        status="SCHEDULED"
                        size="small"
                        variant="icon"
                      />
                      <Tooltip title="Print Machine Schedule">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            printPlanGroup(planGroup);
                          }}
                        >
                          <ScheduleIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Plan and All Schedules">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              setSnackbar({ open: true, message: `Deleting ${planGroup.planId}…`, severity: 'info' });
                              // Find and delete all schedules for this plan
                              const schedulesToDelete = machineSchedules.filter(s => s.planId === planGroup.planId);
                              // Delete schedules in reverse order to maintain indices
                              for (let i = schedulesToDelete.length - 1; i >= 0; i--) {
                                const schedule = schedulesToDelete[i];
                                const scheduleIndex = machineSchedules.findIndex(s => s.scheduleId === schedule.scheduleId);
                                if (scheduleIndex !== -1) {
                                  await sheetService.deleteRow("Machine Schedules", scheduleIndex + 2);
                                }
                              }
                              // Delete the production plan
                              const planIndex = productionPlans.findIndex(p => p.planId === planGroup.planId);
                              if (planIndex !== -1) {
                                await sheetService.deleteRow("Cable Production Plans", planIndex + 2);
                              }
                              setSnackbar({
                                open: true,
                                message: `Plan ${planGroup.planId} and ${schedulesToDelete.length} schedule(s) deleted`,
                                severity: 'success',
                              });
                              await fetchMachineSchedules();
                              await fetchProductionPlans();
                            } catch (error) {
                              console.error("Error deleting plan:", error);
                              setSnackbar({ open: true, message: "Error deleting plan and schedules", severity: 'error' });
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={planGroups.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      )}

      {/* Machine Status View */}
      {activeTab === 2 && (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                <TableCell sx={{ fontWeight: 600 }}>Machine</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Operation</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Plan ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Start Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>End Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(machineTypes).map(([type, config]) =>
                config.machines.map(machine => {
                  const machineSchedules = getMachinesByType(type).filter(s => s.machineId === machine);
                  const currentSchedule = machineSchedules.find(s => s.status === "In Progress");
                  const nextSchedule = machineSchedules.find(s => s.status === "Scheduled");
                  const schedule = currentSchedule || nextSchedule;
                  
                  const getEndTime = (schedule) => {
                    if (!schedule) return "";
                    if (schedule.scheduledEndTime) {
                      return new Date(schedule.scheduledEndTime).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      });
                    }
                    if (schedule.scheduledStartTime && schedule.totalTime) {
                      const startTime = new Date(schedule.scheduledStartTime);
                      const durationHours = parseFloat(schedule.totalTime) || 0;
                      const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
                      return endTime.toLocaleString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      });
                    }
                    return "";
                  };

                  const getStartTime = (schedule) => {
                    if (!schedule || !schedule.scheduledStartTime) return "";
                    return new Date(schedule.scheduledStartTime).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    });
                  };
                  
                  return (
                    <TableRow 
                      key={`${type}-${machine}`}
                      sx={{ 
                        '&:hover': { 
                          bgcolor: alpha(theme.palette.primary.main, 0.03) 
                        }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {config.icon}
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {machine}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {config.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {schedule ? (
                          <Chip
                            label={schedule.status}
                            color={statusConfig[schedule.status]?.color || "default"}
                            size="small"
                            icon={statusConfig[schedule.status]?.icon}
                          />
                        ) : (
                          <Chip 
                            label="Idle" 
                            color="success" 
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {schedule ? schedule.operation : "No scheduled tasks"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {schedule ? schedule.planId : "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getStartTime(schedule) || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getEndTime(schedule) || "-"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Plan Detail Dialog */}
      <Dialog
        open={openPlanDetailDialog}
        onClose={handleClosePlanDetailDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h6">Plan Details</Typography>
              {selectedPlanInfo && (
                <Typography variant="body2" color="text.secondary">
                  Plan ID: {selectedPlanInfo.planId} | Product Code: {selectedPlanInfo.productCode}
                  {selectedPlanInfo.date && ` | Date: ${selectedPlanInfo.date.toLocaleDateString()}`}
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={1}>
              {selectedPlanInfo && (
                <Button
                  size="small"
                  variant="contained"
                  disabled={planHasExistingSchedules(selectedPlanInfo.planId)}
                  onClick={() => generateSchedulesFromPlan(selectedPlanInfo.planId)}
                >
                  Generate Schedules
                </Button>
              )}
              {selectedPlanInfo && (
                <Button size="small" variant="outlined" onClick={printSelectedPlan}>Print</Button>
              )}
              <IconButton onClick={handleClosePlanDetailDialog} size="small">
                <CloseIcon />
              </IconButton>
            </Stack>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Schedule ID</TableCell>
                  <TableCell>Machine</TableCell>
                  <TableCell>Operation</TableCell>
                  <TableCell>Sequence</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>End Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
                  <TableBody>
                {chainSchedulesWithDailyCap(selectedPlanSchedules).map((schedule, index) => (
                  <TableRow key={schedule.scheduleId || index}>
                    <TableCell>{schedule.scheduleId}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {machineTypes[schedule.machineType]?.icon}
                        {schedule.machineId}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {schedule.operation}
                        {schedule.notes && schedule.notes.includes("Auto-generated") && (
                          <Chip 
                            label="Auto" 
                            size="small" 
                            color="secondary" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={schedule.operationSequence || schedule.sequence} size="small" color="primary" />
                    </TableCell>
                    <TableCell>{schedule.quantity} {schedule.unit}</TableCell>
                    <TableCell>
                      {schedule._displayStart
                        ? new Date(schedule._displayStart).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                          })
                        : ""}
                    </TableCell>
                    <TableCell>{schedule.totalTime}h</TableCell>
                    <TableCell>
                      {schedule._displayEnd
                        ? new Date(schedule._displayEnd).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                          })
                        : ""}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={schedule.status}
                        color={statusConfig[schedule.status]?.color || "default"}
                        size="small"
                        icon={statusConfig[schedule.status]?.icon}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={async () => {
                            const scheduleIndex = machineSchedules.findIndex(s => s.scheduleId === schedule.scheduleId);
                            if (scheduleIndex !== -1) {
                              try {
                                await sheetService.deleteRow("Machine Schedules", scheduleIndex + 2);
                                setSnackbar({
                                  open: true,
                                  message: "Machine schedule deleted successfully",
                                  severity: "success",
                                });
                                await fetchMachineSchedules(true);
                                // Reopen dialog with updated data - use memoized planGroups
                                const updatedPlanGroup = planGroups.find(p => p.planId === selectedPlanInfo.planId);
                                if (updatedPlanGroup) {
                                  handlePlanRowClick(updatedPlanGroup);
                                } else {
                                  handleClosePlanDetailDialog();
                                }
                              } catch (error) {
                                setSnackbar({
                                  open: true,
                                  message: "Error deleting schedule",
                                  severity: "error",
                                });
                              }
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePlanDetailDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedSchedule ? "Edit Machine Schedule" : "Add Machine Schedule"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Production Plan</InputLabel>
                <Select
                  name="planId"
                  value={formData.planId}
                  onChange={handleInputChange}
                  label="Production Plan"
                >
                  {productionPlans.map((plan) => (
                    <MenuItem key={plan.planId} value={plan.planId}>
                      {plan.planId} - {plan.orderNumber}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Machine Type</InputLabel>
                <Select
                  name="machineType"
                  value={formData.machineType}
                  onChange={handleInputChange}
                  label="Machine Type"
                >
                  {Object.entries(machineTypes).map(([type, config]) => (
                    <MenuItem key={type} value={type}>
                      {config.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Machine ID</InputLabel>
                <Select
                  name="machineId"
                  value={formData.machineId}
                  onChange={handleInputChange}
                  label="Machine ID"
                  disabled={!formData.machineType}
                >
                  {formData.machineType && machineTypes[formData.machineType].machines.map((machine) => (
                    <MenuItem key={machine} value={machine}>
                      {machine}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Operation"
                name="operation"
                value={formData.operation}
                onChange={handleInputChange}
                placeholder="e.g., Extrude red core"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Operation Sequence"
                name="operationSequence"
                value={formData.operationSequence}
                onChange={handleInputChange}
                type="number"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                type="number"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Start Time"
                  value={formData.scheduledStartTime}
                  onChange={(date) => setFormData(prev => ({ ...prev, scheduledStartTime: date }))}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="End Time"
                  value={formData.scheduledEndTime}
                  onChange={(date) => setFormData(prev => ({ ...prev, scheduledEndTime: date }))}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Setup Time (hours)"
                name="setupTime"
                value={formData.setupTime}
                onChange={handleInputChange}
                type="number"
                InputProps={{ endAdornment: "h" }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Operation Time (hours)"
                name="operationTime"
                value={formData.operationTime}
                onChange={handleInputChange}
                type="number"
                InputProps={{ endAdornment: "h" }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cleanup Time (hours)"
                name="cleanupTime"
                value={formData.cleanupTime}
                onChange={handleInputChange}
                type="number"
                InputProps={{ endAdornment: "h" }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Duration (hours)"
                name="totalTime"
                value={formData.totalTime}
                onChange={handleInputChange}
                type="number"
                InputProps={{ endAdornment: "h" }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Operator Name"
                name="operatorName"
                value={formData.operatorName}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Shift</InputLabel>
                <Select
                  name="shift"
                  value={formData.shift}
                  onChange={handleInputChange}
                  label="Shift"
                >
                  {shiftOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={submitting}
          >
            {submitting 
              ? `${selectedSchedule ? "Updating" : "Creating"}...` 
              : `${selectedSchedule ? "Update" : "Create"} Schedule`
            }
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MachineScheduling; 