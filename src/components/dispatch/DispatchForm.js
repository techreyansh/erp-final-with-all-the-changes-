import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Container,
  Chip,
  Fab,
  IconButton,
  alpha,
  Switch,
  FormControlLabel,
  Tooltip,
  Badge,
  TablePagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from "@mui/material";
import { Autocomplete } from "@mui/material";
import { 
  CalendarToday, 
  Group, 
  ListAlt, 
  LocalShipping,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Emergency as EmergencyIcon,
  Schedule as ScheduleIcon,
  Speed as SpeedIcon,
  Update as UpdateIcon,
  Add as AddIcon,
  Visibility as ViewIcon
} from "@mui/icons-material";
import dispatchService from "../../services/dispatchService";
import poService from "../../services/poService";
import { useNavigate } from "react-router-dom";
import config from "../../config/config";
import sheetService from "../../services/sheetService";
import { getAllClients } from "../../services/clientService";
import { validateDispatchDate, isRestrictedDate, getRestrictionReason, getNextWorkingDay, suggestAdjustedDispatchDate } from "../../utils/dateRestrictions";
import ClientSelector from "../common/ClientSelector";
import { calculateBatchesForPOs } from "../../utils/dispatchUtils";
import LoadingSpinner from "../common/LoadingSpinner";
import dayjs from "dayjs";
import HolidayManagerDialog from "../flowManagement/HolidayManagerDialog";

// Enhanced Client Selector Component
const EnhancedClientSelector = ({ 
  options, 
  value, 
  onChange, 
  loading, 
  disabled,
  label = "Select Client Code"
}) => {
  const renderOption = (props, option) => (
    <Box component="li" {...props}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
          {option?.charAt(0) || 'C'}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            {option}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Client Code
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  const renderInput = (params) => (
    <TextField
      {...params}
      label={label}
      placeholder={`Search by ${label.toLowerCase()}...`}
      variant="outlined"
      fullWidth
      InputProps={{
        ...params.InputProps,
        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
        endAdornment: (
          <>
            {loading ? (
              <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary' }}>
                Loading...
              </Typography>
            ) : null}
            {params.InputProps.endAdornment}
          </>
        ),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          minHeight: 56,
        }
      }}
    />
  );

  return (
    <Box>
      <Autocomplete
        options={options}
        value={value || null}
        onChange={(_, newValue) => onChange(newValue)}
        getOptionLabel={(option) => option || ''}
        isOptionEqualToValue={(option, val) => option === val}
        renderOption={renderOption}
        renderInput={renderInput}
        loading={loading}
        disabled={disabled}
        PaperComponent={({ children, ...props }) => (
          <Paper {...props} sx={{ maxHeight: 400, overflow: 'auto' }}>
            {children}
          </Paper>
        )}
        sx={{
          '& .MuiAutocomplete-listbox': {
            '& li': {
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': {
                borderBottom: 'none',
              },
            },
          },
        }}
        noOptionsText={
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {loading ? 'Loading...' : 'No options found'}
            </Typography>
          </Box>
        }
        filterOptions={(options, { inputValue }) => {
          if (!inputValue) return options;
          
          const filterValue = inputValue.toLowerCase();
          return options.filter(option =>
            option?.toLowerCase().includes(filterValue)
          );
        }}
      />

      {value && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Selected {label}:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {value?.charAt(0) || 'C'}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

const DispatchForm = ({ onSuccess, onClose }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [noClient, setNoClient] = useState(false);
  const [batches, setBatches] = useState([]);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [alreadyDispatched, setAlreadyDispatched] = useState(false);
  const [clientOptions, setClientOptions] = useState([]);
  const [selectedClientCode, setSelectedClientCode] = useState("");
  const [allPOs, setAllPOs] = useState([]);
  const [dispatchRecords, setDispatchRecords] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedProductCode, setSelectedProductCode] = useState("");
  const [productOptions, setProductOptions] = useState([]);
  const [limitRange, setLimitRange] = useState(null);
  const [scheduled, setScheduled] = useState({});
  const [viewMode, setViewMode] = useState('create'); // 'create', 'reschedule', 'emergency'
  const [existingDispatches, setExistingDispatches] = useState([]);
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    clientCode: '',
    productCode: '',
    quantity: '',
    dispatchDate: '',
    priority: 'HIGH'
  });
  
  // State for specific item dispatch
  const [specificItem, setSpecificItem] = useState(null);
  
  // Pagination state for reschedule mode
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // State for holiday suggestions
  const [holidaySuggestion, setHolidaySuggestion] = useState(null);
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [isUrgentDispatch, setIsUrgentDispatch] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [pos, dispatches] = await Promise.all([
          poService.getAllPOs(),
          sheetService.getSheetData("Dispatches"),
        ]);
        setAllPOs(pos);
        setDispatchRecords(dispatches);
        
        // Check for item passed from sales orders
        const itemForDispatch = sessionStorage.getItem('itemForDispatch');
        if (itemForDispatch) {
          try {
            const selectedItem = JSON.parse(itemForDispatch);
            // Verify the item exists in the current POs
            const itemExists = pos.find(po => 
              po.UniqueId === selectedItem.UniqueId && 
              po.ClientCode === selectedItem.ClientCode &&
              po.ProductCode === selectedItem.ProductCode
            );
            
            if (itemExists) {
              // Pre-select the client and product from the selected item
              setSelectedClientCode(selectedItem.ClientCode);
              setSelectedProductCode(selectedItem.ProductCode);
              setSpecificItem(selectedItem);
            } else {
              console.warn('Selected item not found in current POs:', selectedItem);
              // Fall back to general logic
              const alreadyDispatched = dispatches
                .filter((r) => r.Dispatched === "Yes")
                .map((r) => r.ProductCode + "-" + r.ClientCode);
              const undeliveredPOs = pos.filter(
                (po) =>
                  po.Status !== config.statusCodes.DISPATCH &&
                  !alreadyDispatched.includes(po.ProductCode + "-" + po.ClientCode)
              );
              const uniqueClientCodes = [
                ...new Set(undeliveredPOs.map((po) => po.ClientCode)),
              ];
              setClientOptions(uniqueClientCodes);
              if (uniqueClientCodes.length === 1) {
                setSelectedClientCode(uniqueClientCodes[0]);
              }
            }
            
            // Clear the session storage after use
            sessionStorage.removeItem('itemForDispatch');
          } catch (err) {
            console.error('Error parsing itemForDispatch:', err);
            // Fall back to general logic
            const alreadyDispatched = dispatches
              .filter((r) => r.Dispatched === "Yes")
              .map((r) => r.ProductCode + "-" + r.ClientCode);
            const undeliveredPOs = pos.filter(
              (po) =>
                po.Status !== config.statusCodes.DISPATCH &&
                !alreadyDispatched.includes(po.ProductCode + "-" + po.ClientCode)
            );
            const uniqueClientCodes = [
              ...new Set(undeliveredPOs.map((po) => po.ClientCode)),
            ];
            setClientOptions(uniqueClientCodes);
            if (uniqueClientCodes.length === 1) {
              setSelectedClientCode(uniqueClientCodes[0]);
            }
          }
        } else {
          // Original logic for when no specific item is selected
          const alreadyDispatched = dispatches
            .filter((r) => r.Dispatched === "Yes")
            .map((r) => r.ProductCode + "-" + r.ClientCode);
          const undeliveredPOs = pos.filter(
            (po) =>
              po.Status !== config.statusCodes.DISPATCH &&
              !alreadyDispatched.includes(po.ProductCode + "-" + po.ClientCode)
          );
          const uniqueClientCodes = [
            ...new Set(undeliveredPOs.map((po) => po.ClientCode)),
          ];
          setClientOptions(uniqueClientCodes);
          if (uniqueClientCodes.length === 1) {
            setSelectedClientCode(uniqueClientCodes[0]);
          }
        }
      } catch (err) {
        setError("Failed to load client/PO data");
        setClientOptions([]);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Clear errors and holiday suggestions when urgent dispatch is enabled
  useEffect(() => {
    if (isUrgentDispatch) {
      // When urgent dispatch is enabled, clear all validation errors
      setError(null);
      setHolidaySuggestion(null);
    }
  }, [isUrgentDispatch]);

  useEffect(() => {
    if (selectedClientCode) {
      const undeliveredPOsForClient = allPOs.filter(
        (po) =>
          po.ClientCode === selectedClientCode &&
          po.Status !== config.statusCodes.DISPATCH
      );
      const uniqueProductCodes = [
        ...new Set(undeliveredPOsForClient.map((po) => po.ProductCode)),
      ];
      setProductOptions(uniqueProductCodes);
      
      // Preserve the pre-selected product code if it exists and is valid for this client
      if (selectedProductCode && uniqueProductCodes.includes(selectedProductCode)) {
        // Keep the current selection if it's valid
        return;
      }
      
      // If only one product, pre-select it
      if (uniqueProductCodes.length === 1) {
        setSelectedProductCode(uniqueProductCodes[0]);
      } else if (uniqueProductCodes.length === 0) {
        setSelectedProductCode(""); // Clear if no products available
      }
      // If multiple products and no valid pre-selection, keep current selection or clear
    } else {
      setProductOptions([]);
      setSelectedProductCode("");
    }
  }, [selectedClientCode, allPOs, selectedProductCode]);

  useEffect(() => {
    if (!selectedClientCode) {
      setBatches([]);
      setTotalQuantity(0);
      return;
    }
    setError(null);
    setAlreadyDispatched(false);
    setNoClient(false);
    
    // Use utility for batch calculation - pass specific Unique ID if available
    const { batches: newBatches, totalQuantity: newTotalQty } =
      calculateBatchesForPOs(
        allPOs,
        dispatchRecords,
        selectedClientCode,
        selectedProductCode,
        specificItem?.UniqueId // Pass the specific Unique ID for precise item targeting
      );
      
    if (newBatches.length === 0) {
      setError(
        specificItem 
          ? `No new items available for this specific item (${specificItem.UniqueId}).`
          : "No new items available for this client code or selected product."
      );
      setBatches([]);
      setTotalQuantity(0);
      return;
    }
    
    setBatches(newBatches);
    setTotalQuantity(newTotalQty);
  }, [selectedClientCode, allPOs, dispatchRecords, selectedProductCode, specificItem]);

  useEffect(() => {
    const fetchLimitRange = async () => {
      try {
        const range = await sheetService.getLatestDispatchLimitRange(
          "Daily_CAPACITY"
        );
        setLimitRange(range);
        // Calculate scheduled quantities for each date
        const scheduledMap = {};
        dispatchRecords.forEach((rec) => {
          if (rec.DispatchDate) {
            const date = rec.DispatchDate.split(" ")[0];
            scheduledMap[date] =
              (scheduledMap[date] || 0) + Number(rec.BatchSize || 0);
          }
        });
        setScheduled(scheduledMap);
      } catch (err) {
        setLimitRange(null);
      }
    };
    if (dispatchRecords.length) fetchLimitRange();
  }, [dispatchRecords]);

  // Fetch existing dispatches when view mode changes
  useEffect(() => {
    const fetchExistingDispatches = async () => {
      if (viewMode === 'reschedule') {
        try {
          const dispatches = await dispatchService.getScheduledDispatches();
          setExistingDispatches(dispatches);
          // Reset pagination when new data loads
          setPage(0);
          setSelectedDispatch(null);
        } catch (err) {
          console.error("Failed to fetch existing dispatches:", err);
          setExistingDispatches([]);
        }
      }
    };
    fetchExistingDispatches();
  }, [viewMode]);

  // Filter and search functionality
  const filteredDispatches = existingDispatches.filter(dispatch => {
    const matchesSearch = searchTerm === '' || 
      dispatch.ClientCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispatch.ProductCode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'emergency' && dispatch.IsEmergency === 'Yes') ||
      (statusFilter === 'normal' && dispatch.IsEmergency !== 'Yes');
    
    return matchesSearch && matchesStatus;
  });

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    setSelectedDispatch(null); // Clear selection when changing pages
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSelectedDispatch(null);
  };

  // Get paginated data
  const paginatedDispatches = filteredDispatches.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleBatchDateChange = (idx, value) => {
    // Validate the date for restrictions
    if (value) {
      // Get the order type for the batch
      const batch = batches[idx];
      const orderType = batch?.orderType || 'POWER_CORD';
      
      const validation = validateDispatchDate(value, orderType, isUrgentDispatch);
      if (!validation.isValid) {
        setError(validation.message);
        // Don't set the date if it's restricted
        return;
      }
      
      // Check for holidays in timeline and suggest adjusted date (skip for urgent dispatch)
      const suggestion = suggestAdjustedDispatchDate(value, new Date(), orderType, isUrgentDispatch);
      if (suggestion.hasHolidays) {
        // Only show suggestion if we cannot proceed
        // If canProceed is true, it means we can schedule dispatch even with holidays
        if (suggestion.canProceed) {
          // Show informational message but allow dispatch
          setHolidaySuggestion({
            ...suggestion,
            severity: 'info' // Informational, not warning
          });
        } else {
          setHolidaySuggestion({
            ...suggestion,
            severity: 'warning' // Warning, should consider changing date
          });
        }
      } else {
        setHolidaySuggestion(null);
      }
    }
    
    setBatches((batches) =>
      batches.map((b, i) => (i === idx ? { ...b, date: value } : b))
    );
  };

  // Handle rescheduling an existing dispatch
  const handleReschedule = async () => {
    if (!selectedDispatch || !rescheduleDate) {
      setError("Please select a dispatch and new date");
      return;
    }

    setLoading(true);
    try {
      // Check capacity for the new date
      const capacityCheck = await dispatchService.checkEmergencyCapacity(
        rescheduleDate, 
        Number(selectedDispatch.BatchSize)
      );

      if (!capacityCheck.allowed && !isEmergency) {
        setError("New date exceeds capacity. Enable emergency mode to override.");
        setLoading(false);
        return;
      }

      const result = await dispatchService.rescheduleDispatch(
        existingDispatches.indexOf(selectedDispatch),
        rescheduleDate,
        isEmergency
      );

      setSuccess(true);
      setSelectedDispatch(null);
      setRescheduleDate('');
      setIsEmergency(false);
      
      // Refresh existing dispatches
      const dispatches = await dispatchService.getScheduledDispatches();
      setExistingDispatches(dispatches);
      
      // Check if current page is still valid after potential data changes
      const maxPage = Math.max(0, Math.ceil(dispatches.length / rowsPerPage) - 1);
      if (page > maxPage) {
        setPage(maxPage);
      }
      
    } catch (err) {
      setError("Failed to reschedule: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle creating emergency production
  const handleEmergencyProduction = async () => {
    const { clientCode, productCode, quantity, dispatchDate, priority } = emergencyForm;
    
    if (!clientCode || !productCode || !quantity || !dispatchDate) {
      setError("Please fill all emergency production fields");
      return;
    }

    setLoading(true);
    try {
      const result = await dispatchService.createEmergencyDispatch({
        clientCode,
        productCode,
        quantity: Number(quantity),
        dispatchDate,
        priority
      });

      setSuccess(true);
      setEmergencyForm({
        clientCode: '',
        productCode: '',
        quantity: '',
        dispatchDate: '',
        priority: 'HIGH'
      });
      
      // Refresh data
      const [pos, dispatches] = await Promise.all([
        poService.getAllPOs(),
        sheetService.getSheetData("Dispatches"),
      ]);
      setAllPOs(pos);
      setDispatchRecords(dispatches);
      
    } catch (err) {
      setError("Failed to create emergency dispatch: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConfirmOpen(true);
  };

  const isDateDisabled = (dateStr, currentBatchSize, currentBatchIdx, allowEmergencyOverride = false) => {
    // If no capacity limits are defined, allow all dates
    if (!limitRange) return false;
    
    const date = dayjs(dateStr);
    const start = dayjs(limitRange.startDate);
    const end = dayjs(limitRange.endDate);
    
    // Allow emergency override for date range if in emergency mode
    if (!allowEmergencyOverride && (date.isBefore(start, "day") || date.isAfter(end, "day"))) {
      return true;
    }
    
    // Calculate total quantity for this date from already selected batches in the form
    let totalForThisDateInForm = 0;
    batches.forEach((b, idx) => {
      if (idx !== currentBatchIdx && b.date === dateStr) {
        totalForThisDateInForm += Number(b.batchSize || 0);
      }
    });
    const scheduledQty = scheduled[dateStr] || 0;
    const potentialTotal =
      scheduledQty + totalForThisDateInForm + Number(currentBatchSize || 0);
    
    // Use emergency limit (150% of normal) if emergency override is allowed
    const effectiveLimit = allowEmergencyOverride ? limitRange.limit * 1.5 : limitRange.limit;
    return potentialTotal > effectiveLimit;
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    setConfirmOpen(false);
    if (batches.some((b) => !b.date)) {
      setError("Please enter a date for every batch.");
      setLoading(false);
      return;
    }
    // Prevent submission if any batch is over the limit
    const overLimit = batches.some(
      (b, idx) => b.date && isDateDisabled(b.date, b.batchSize, idx)
    );
    if (overLimit) {
      setError(
        "One or more batches exceed the daily dispatch limit or are out of range."
      );
      setLoading(false);
      return;
    }
    try {
      const result = await dispatchService.createBatchDispatch({
        clientCode: selectedClientCode,
        batches: batches.map((b) => ({
          ...b,
          date: b.date,
        })),
        specificItem: specificItem, // Pass the specific item for individual dispatch planning
        isUrgentDispatch: isUrgentDispatch, // Pass urgent dispatch flag
      });
      if (result.success) {
        setSuccess(true);
        
        // Wait a moment for the Google Sheets to process the update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh the PO data to reflect status changes
        try {
          const [pos, dispatches] = await Promise.all([
            poService.getAllPOs(),
            sheetService.getSheetData("Dispatches"),
          ]);
          setAllPOs(pos);
          setDispatchRecords(dispatches);
          
          // Verify the status was updated
          const updatedPO = pos.find(po => 
            result.updatedPOs.some(updated => updated.POId === po.POId)
          );
          if (updatedPO) {
          } else {
            console.warn('Could not find updated PO in refreshed data');
          }
        } catch (refreshError) {
          console.warn('Failed to refresh data after dispatch:', refreshError);
          // Don't fail the dispatch if refresh fails
        }
        
        // Clear specific item state after successful dispatch
        setSpecificItem(null);
        setSelectedClientCode("");
        setSelectedProductCode("");
        
        // Set a flag to indicate dispatch completion for the parent component
        sessionStorage.setItem('dispatchCompleted', 'true');
        
        // Force a complete page refresh to ensure data is updated
        // Use window.location for a hard refresh instead of navigate
        window.location.href = "/flow-management";
        
        setBatches(batches.map((b) => ({ ...b, date: "" })));
        if (onSuccess) onSuccess();
      } else {
        setError(result.message || "Failed to submit dispatch");
      }
    } catch (err) {
      console.error('Dispatch error:', err);
      setError("Failed to submit dispatch: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const summaryCards = (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          height: '100%',
          background: 'linear-gradient(135deg, #e3f2fd 0%, #e8f5e8 100%)',
          border: '1px solid rgba(25, 118, 210, 0.1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            transition: 'transform 0.3s ease-in-out',
            boxShadow: '0 4px 20px rgba(25, 118, 210, 0.1)'
          }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(25, 118, 210, 0.1)', 
                width: 56, 
                height: 56,
                color: 'primary.main'
              }}>
                <Group />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Client Code
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {selectedClientCode || "-"}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          height: '100%',
          background: 'linear-gradient(135deg, #fce4ec 0%, #f3e5f5 100%)',
          border: '1px solid rgba(156, 39, 176, 0.1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            transition: 'transform 0.3s ease-in-out',
            boxShadow: '0 4px 20px rgba(156, 39, 176, 0.1)'
          }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(156, 39, 176, 0.1)', 
                width: 56, 
                height: 56,
                color: 'secondary.main'
              }}>
                <ListAlt />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Total Quantity
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                  {totalQuantity.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          height: '100%',
          background: 'linear-gradient(135deg, #e0f2f1 0%, #e8f5e8 100%)',
          border: '1px solid rgba(76, 175, 80, 0.1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            transition: 'transform 0.3s ease-in-out',
            boxShadow: '0 4px 20px rgba(76, 175, 80, 0.1)'
          }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(76, 175, 80, 0.1)', 
                width: 56, 
                height: 56,
                color: 'success.main'
              }}>
                <CalendarToday />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Number of Batches
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {batches.length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          height: '100%',
          background: 'linear-gradient(135deg, #fff3e0 0%, #fce4ec 100%)',
          border: '1px solid rgba(255, 152, 0, 0.1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            transition: 'transform 0.3s ease-in-out',
            boxShadow: '0 4px 20px rgba(255, 152, 0, 0.1)'
          }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(255, 152, 0, 0.1)', 
                width: 56, 
                height: 56,
                color: 'warning.main'
              }}>
                <LocalShipping />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Status
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  {batches.length > 0 ? 'Ready' : 'Pending'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (loading) return <LoadingSpinner message="Submitting dispatch..." />;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
          Dispatch Planning
        </Typography>
        
        {/* Welcome Section */}
        <Paper sx={{ 
          p: 4, 
          mb: 3, 
          background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
          color: 'primary.main',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(25, 118, 210, 0.1)'
        }}>
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background: 'rgba(25, 118, 210, 0.05)',
              borderRadius: '50%',
              zIndex: 0
            }}
          />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: 'primary.main' }}>
                  Dispatch Planning Center 🚚
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 300, color: 'text.secondary' }}>
                  Plan and schedule dispatch batches for client orders with capacity management.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={viewMode === 'create' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('create')}
                  startIcon={<AddIcon />}
                  sx={{ minWidth: 120 }}
                >
                  Create
                </Button>
                <Button
                  variant={viewMode === 'reschedule' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('reschedule')}
                  startIcon={<EditIcon />}
                  sx={{ minWidth: 120 }}
                >
                  Reschedule
                </Button>
                <Button
                  variant={viewMode === 'emergency' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('emergency')}
                  startIcon={<EmergencyIcon />}
                  color="warning"
                  sx={{ minWidth: 120 }}
                >
                  Emergency
                </Button>
                <IconButton
                  onClick={() => window.location.reload()}
                  sx={{ 
                    color: 'primary.main',
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                    '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.15)' }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
                <Tooltip title="Holiday Overrides">
                  <IconButton
                    onClick={() => setHolidayDialogOpen(true)}
                    sx={{ 
                      color: 'primary.main',
                      bgcolor: 'rgba(25, 118, 210, 0.08)',
                      '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.15)' }
                    }}
                  >
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      <HolidayManagerDialog open={holidayDialogOpen} onClose={() => setHolidayDialogOpen(false)} />

      {/* Client Selection */}
      <Card sx={{ 
        mb: 3,
        background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.02) 0%, rgba(25, 118, 210, 0.05) 100%)',
        border: '1px solid rgba(25, 118, 210, 0.08)'
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ 
            mb: 2, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            color: 'primary.main',
            fontWeight: 600
          }}>
            <Group />
            Select Client Code
          </Typography>
          {loadingData ? (
            <LoadingSpinner />
          ) : (
            <EnhancedClientSelector
              options={clientOptions}
              value={selectedClientCode}
              onChange={setSelectedClientCode}
              loading={loadingData}
              disabled={clientOptions.length === 0}
            />
          )}
          
          {/* Urgent Dispatch Option */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(25, 118, 210, 0.1)' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isUrgentDispatch}
                  onChange={(e) => setIsUrgentDispatch(e.target.checked)}
                  color="error"
                  size="medium"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SpeedIcon sx={{ color: isUrgentDispatch ? 'error.main' : 'text.secondary' }} />
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: isUrgentDispatch ? 600 : 400,
                      color: isUrgentDispatch ? 'error.main' : 'text.primary'
                    }}
                  >
                    Urgent Dispatch
                  </Typography>
                </Box>
              }
            />
            {isUrgentDispatch && (
              <Alert 
                severity="warning" 
                sx={{ mt: 2, borderRadius: 2 }}
                icon={<EmergencyIcon />}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Urgent Mode Enabled
                </Typography>
                <Typography variant="body2">
                  Dispatch will be scheduled without the standard 5-6 day production lead time. 
                  All production stages will be set to the dispatch date.
                </Typography>
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>

      {selectedClientCode && productOptions.length > 0 && (
        <Card sx={{ 
          mb: 3,
          background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.02) 0%, rgba(156, 39, 176, 0.05) 100%)',
          border: '1px solid rgba(156, 39, 176, 0.08)'
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'secondary.main',
              fontWeight: 600
            }}>
              <ListAlt />
              Select Product Code
            </Typography>
            <EnhancedClientSelector
              options={productOptions}
              value={selectedProductCode}
              onChange={setSelectedProductCode}
              loading={loadingData}
              disabled={productOptions.length === 0}
              label="Product Code"
            />
          </CardContent>
        </Card>
      )}

      {viewMode === 'create' && summaryCards}

      {/* Main Content Based on View Mode */}
      {viewMode === 'create' && (
        <Card sx={{ 
          mb: 3,
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.02) 0%, rgba(76, 175, 80, 0.05) 100%)',
          border: '1px solid rgba(76, 175, 80, 0.08)'
        }}>
          <CardContent sx={{ p: 4 }}>
            {noClient ? (
              <Alert 
                severity="warning" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  '& .MuiAlert-icon': { color: '#f57c00' }
                }}
                icon={<Warning />}
              >
                Please complete Client Ingestion first. You cannot plan a dispatch
                until at least one Client is created.
              </Alert>
            ) : alreadyDispatched ? (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  '& .MuiAlert-icon': { color: '#d32f2f' }
                }}
                icon={<ErrorIcon />}
              >
                You have already dispatched items for this client code.
              </Alert>
            ) : (
              <form onSubmit={handleSubmit}>
                <TableContainer 
                  component={Paper} 
                  sx={{ 
                    mb: 4, 
                    borderRadius: 3,
                    border: '1px solid rgba(76, 175, 80, 0.1)',
                    overflow: 'hidden',
                    boxShadow: '0 2px 10px rgba(76, 175, 80, 0.05)'
                  }}
                >
                  <Table size="medium">
                    <TableHead>
                      <TableRow sx={{ 
                        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(76, 175, 80, 0.08) 100%)'
                      }}>
                        <TableCell sx={{ 
                          fontWeight: 700, 
                          color: 'success.main', 
                          fontSize: '0.875rem',
                          borderBottom: '1px solid rgba(76, 175, 80, 0.2)'
                        }}>
                          Product
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 700, 
                          color: 'success.main', 
                          fontSize: '0.875rem',
                          borderBottom: '1px solid rgba(76, 175, 80, 0.2)'
                        }}>
                          Batch #
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 700, 
                          color: 'success.main', 
                          fontSize: '0.875rem',
                          borderBottom: '1px solid rgba(76, 175, 80, 0.2)'
                        }}>
                          Batch Size
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 700, 
                          color: 'success.main', 
                          fontSize: '0.875rem',
                          borderBottom: '1px solid rgba(76, 175, 80, 0.2)'
                        }}>
                          Dispatch Date
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {batches.map((batch, idx) => (
                        <TableRow 
                          key={idx}
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: 'rgba(76, 175, 80, 0.03)',
                              transition: 'background-color 0.2s ease',
                              transform: 'scale(1.005)',
                              boxShadow: '0 1px 4px rgba(76, 175, 80, 0.05)'
                            },
                            '&:nth-of-type(even)': {
                              backgroundColor: 'rgba(76, 175, 80, 0.01)'
                            }
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {batch.productCode}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={batch.batchNumber}
                              size="small"
                              sx={{
                                background: 'rgba(25, 118, 210, 0.1)',
                                color: 'primary.main',
                                fontWeight: 600,
                                border: '1px solid rgba(25, 118, 210, 0.2)',
                                '&:hover': {
                                  transform: 'scale(1.02)',
                                  transition: 'transform 0.2s ease',
                                  background: 'rgba(25, 118, 210, 0.15)'
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {batch.batchSize.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="date"
                              size="small"
                              value={batch.date}
                              onChange={(e) =>
                                handleBatchDateChange(idx, e.target.value)
                              }
                              InputLabelProps={{ shrink: true }}
                              inputProps={{
                                min: limitRange
                                  ? dayjs(limitRange.startDate).format(
                                      "YYYY-MM-DD"
                                    )
                                  : dayjs().format("YYYY-MM-DD"), // Default to today if no limits
                                max: limitRange
                                  ? dayjs(limitRange.endDate).format("YYYY-MM-DD")
                                  : undefined, // No max limit if no capacity limits defined
                              }}
                              error={
                                (batch.date &&
                                isDateDisabled(batch.date, batch.batchSize, idx)) ||
                                (batch.date && isRestrictedDate(batch.date))
                              }
                              helperText={
                                batch.date && isRestrictedDate(batch.date)
                                  ? `Cannot dispatch on ${getRestrictionReason(batch.date)}`
                                  : batch.date &&
                                    isDateDisabled(batch.date, batch.batchSize, idx)
                                  ? "Date is full or out of range"
                                  : ""
                              }
                              onBlur={(e) => {
                                if (
                                  isDateDisabled(
                                    e.target.value,
                                    batch.batchSize,
                                    idx
                                  )
                                ) {
                                  setError(
                                    "Selected date is full or out of range. Please choose another date."
                                  );
                                  handleBatchDateChange(idx, "");
                                } else if (e.target.value && isRestrictedDate(e.target.value)) {
                                  const nextWorkingDay = getNextWorkingDay(e.target.value);
                                  setError(
                                    `Cannot dispatch on ${getRestrictionReason(e.target.value)}. Next working day: ${nextWorkingDay.toISOString().split('T')[0]}.`
                                  );
                                  handleBatchDateChange(idx, "");
                                }
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': { borderColor: 'divider' },
                                  '&:hover fieldset': { borderColor: 'primary.main' },
                                  '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                                }
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Holiday Suggestion Alert */}
                {holidaySuggestion && holidaySuggestion.hasHolidays && (
                  <Alert 
                    severity="info" 
                    icon={<CalendarToday />}
                    sx={{ 
                      mt: 3, 
                      mb: 2,
                      borderRadius: 2,
                      border: '1px solid rgba(25, 118, 210, 0.2)',
                      background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.08) 100%)'
                    }}
                    action={
                      <Button 
                        color="primary" 
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          // Apply suggested date to the batch
                          const batchIndex = batches.findIndex(b => b.date);
                          if (batchIndex !== -1) {
                            const suggestedDateStr = holidaySuggestion.suggestedDate.toISOString().split('T')[0];
                            handleBatchDateChange(batchIndex, suggestedDateStr);
                          }
                        }}
                        sx={{ mr: 1 }}
                      >
                        Use Suggested Date
                      </Button>
                    }
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Holiday Detected in Timeline
                    </Typography>
                    <Typography variant="body2">
                      {holidaySuggestion.message}
                    </Typography>
                  </Alert>
                )}
                
                <Button
                  variant="contained"
                  type="submit"
                  disabled={
                    loading || noClient || batches.some((b) => !b.date)
                  }
                  fullWidth
                  size="large"
                  sx={{ 
                    fontWeight: 600, 
                    borderRadius: 3,
                    py: 2,
                    fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.8) 0%, rgba(76, 175, 80, 0.9) 100%)',
                    color: 'white',
                    boxShadow: '0 2px 10px rgba(76, 175, 80, 0.2)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.9) 0%, rgba(76, 175, 80, 1) 100%)',
                      boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                      transform: 'translateY(-1px)',
                      transition: 'all 0.3s ease'
                    },
                    '&:disabled': {
                      background: 'grey.300',
                      color: 'grey.500',
                      boxShadow: 'none',
                      transform: 'none'
                    }
                  }}
                >
                  Schedule Dispatch
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reschedule Mode */}
      {viewMode === 'reschedule' && (
        <Card sx={{ 
          mb: 3,
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.02) 0%, rgba(25, 118, 210, 0.05) 100%)',
          border: '1px solid rgba(25, 118, 210, 0.08)'
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ 
              mb: 3, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'primary.main',
              fontWeight: 600
            }}>
              <EditIcon />
              Reschedule Existing Dispatches
            </Typography>

            {existingDispatches.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No existing dispatches found to reschedule.
              </Alert>
            ) : (
              <Box>
                {/* Search and Filter Controls */}
                <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <TextField
                    label="Search"
                    placeholder="Search by client, product code, or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="small"
                    sx={{ minWidth: 300, flexGrow: 1 }}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Status Filter</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label="Status Filter"
                    >
                      <MenuItem value="all">All Dispatches</MenuItem>
                      <MenuItem value="normal">Normal Only</MenuItem>
                      <MenuItem value="emergency">Emergency Only</MenuItem>
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                    <Typography variant="body2">
                      {filteredDispatches.length} dispatch{filteredDispatches.length !== 1 ? 'es' : ''} found
                    </Typography>
                    {(searchTerm || statusFilter !== 'all') && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setPage(0);
                        }}
                        sx={{ ml: 1 }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </Box>
                </Box>

                <TableContainer component={Paper} sx={{ mb: 3, borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'rgba(25, 118, 210, 0.05)' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Select</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Client Code</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Product Code</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Batch Size</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Current Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedDispatches.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              No dispatches match your search criteria
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedDispatches.map((dispatch, idx) => (
                          <TableRow 
                            key={`${dispatch.ClientCode}-${dispatch.ProductCode}-${idx}`}
                            onClick={() => setSelectedDispatch(dispatch)}
                            sx={{
                              cursor: 'pointer',
                              backgroundColor: selectedDispatch === dispatch ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                              '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' }
                            }}
                          >
                            <TableCell>
                              <input 
                                type="radio" 
                                checked={selectedDispatch === dispatch}
                                onChange={() => setSelectedDispatch(dispatch)}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {dispatch.ClientCode}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {dispatch.ProductCode}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {Number(dispatch.BatchSize).toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {dispatch.DispatchDate}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Chip 
                                  label={dispatch.IsEmergency === 'Yes' ? 'Emergency' : 'Normal'} 
                                  size="small"
                                  color={dispatch.IsEmergency === 'Yes' ? 'warning' : 'primary'}
                                  icon={dispatch.IsEmergency === 'Yes' ? <EmergencyIcon /> : <ScheduleIcon />}
                                />
                                {dispatch.Priority && dispatch.IsEmergency === 'Yes' && (
                                  <Tooltip title={`Priority: ${dispatch.Priority}`}>
                                    <Badge 
                                      badgeContent={dispatch.Priority} 
                                      color="error"
                                      sx={{ ml: 1 }}
                                    >
                                      <SpeedIcon fontSize="small" />
                                    </Badge>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination Controls */}
                  <TablePagination
                    component="div"
                    count={filteredDispatches.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50, 100]}
                    showFirstButton
                    showLastButton
                    sx={{
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: 'rgba(25, 118, 210, 0.02)'
                    }}
                  />
                </TableContainer>

                {selectedDispatch && (
                  <Box sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, backgroundColor: 'rgba(25, 118, 210, 0.02)' }}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                      Reschedule Selected Dispatch
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={4}>
                        <TextField
                          type="date"
                          label="New Dispatch Date"
                          value={rescheduleDate}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value) {
                              const validation = validateDispatchDate(value);
                              if (!validation.isValid) {
                                setError(validation.message);
                                return;
                              }
                            }
                            setRescheduleDate(value);
                          }}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          error={rescheduleDate && isRestrictedDate(rescheduleDate)}
                          helperText={
                            rescheduleDate && isRestrictedDate(rescheduleDate)
                              ? `Cannot reschedule to ${getRestrictionReason(rescheduleDate)}`
                              : ""
                          }
                          onBlur={(e) => {
                            if (e.target.value && isRestrictedDate(e.target.value)) {
                              const nextWorkingDay = getNextWorkingDay(e.target.value);
                              setError(
                                `Cannot reschedule to ${getRestrictionReason(e.target.value)}. Next working day: ${nextWorkingDay.toISOString().split('T')[0]}.`
                              );
                              setRescheduleDate("");
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FormControlLabel
                            control={
                              <Switch 
                                checked={isEmergency}
                                onChange={(e) => setIsEmergency(e.target.checked)}
                                color="warning"
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2">Emergency Mode</Typography>
                                {isEmergency && (
                                  <Tooltip title="Allows capacity override up to 150%">
                                    <Chip 
                                      label="Override Enabled" 
                                      size="small" 
                                      color="warning"
                                      icon={<EmergencyIcon />}
                                    />
                                  </Tooltip>
                                )}
                              </Box>
                            }
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Button
                          variant="contained"
                          onClick={handleReschedule}
                          disabled={!rescheduleDate || loading}
                          startIcon={<UpdateIcon />}
                          fullWidth
                        >
                          Reschedule
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Emergency Production Mode */}
      {viewMode === 'emergency' && (
        <Card sx={{ 
          mb: 3,
          background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.02) 0%, rgba(255, 152, 0, 0.05) 100%)',
          border: '1px solid rgba(255, 152, 0, 0.08)'
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ 
              mb: 3, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'warning.main',
              fontWeight: 600
            }}>
              <EmergencyIcon />
              Emergency Production Dispatch
            </Typography>

            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <EmergencyIcon />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Emergency Production Mode Active
                </Typography>
              </Box>
              <Typography variant="body2">
                • Allows capacity override up to 150% of daily limits<br/>
                • Enables immediate scheduling even for past dates<br/>
                • Use only for critical and urgent orders<br/>
                • Emergency dispatches will be highlighted in the system
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <EnhancedClientSelector
                  options={clientOptions}
                  value={emergencyForm.clientCode}
                  onChange={(value) => setEmergencyForm(prev => ({ ...prev, clientCode: value || '' }))}
                  loading={loadingData}
                  disabled={clientOptions.length === 0}
                  label="Emergency Client Code"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Product Code"
                  value={emergencyForm.productCode}
                  onChange={(e) => setEmergencyForm(prev => ({ ...prev, productCode: e.target.value }))}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Quantity"
                  type="number"
                  value={emergencyForm.quantity}
                  onChange={(e) => setEmergencyForm(prev => ({ ...prev, quantity: e.target.value }))}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Dispatch Date"
                  type="date"
                  value={emergencyForm.dispatchDate}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      const validation = validateDispatchDate(value);
                      if (!validation.isValid) {
                        setError(validation.message);
                        return;
                      }
                    }
                    setEmergencyForm(prev => ({ ...prev, dispatchDate: value }));
                  }}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  error={emergencyForm.dispatchDate && isRestrictedDate(emergencyForm.dispatchDate)}
                  helperText={
                    emergencyForm.dispatchDate && isRestrictedDate(emergencyForm.dispatchDate)
                      ? `Cannot dispatch on ${getRestrictionReason(emergencyForm.dispatchDate)}`
                      : ""
                  }
                  onBlur={(e) => {
                    if (e.target.value && isRestrictedDate(e.target.value)) {
                      const nextWorkingDay = getNextWorkingDay(e.target.value);
                      setError(
                        `Cannot dispatch on ${getRestrictionReason(e.target.value)}. Next working day: ${nextWorkingDay.toISOString().split('T')[0]}.`
                      );
                      setEmergencyForm(prev => ({ ...prev, dispatchDate: "" }));
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Priority"
                  select
                  value={emergencyForm.priority}
                  onChange={(e) => setEmergencyForm(prev => ({ ...prev, priority: e.target.value }))}
                  fullWidth
                  SelectProps={{ native: true }}
                >
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="URGENT">URGENT</option>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleEmergencyProduction}
                  disabled={loading}
                  startIcon={<SpeedIcon />}
                  color="warning"
                  size="large"
                  fullWidth
                  sx={{ 
                    fontWeight: 600,
                    borderRadius: 3,
                    py: 2,
                    fontSize: '1.1rem'
                  }}
                >
                  Create Emergency Dispatch
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmOpen} 
        onClose={() => setConfirmOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: '1px solid #e3f2fd'
          }
        }}
      >
        <DialogTitle sx={{ color: '#1976d2', fontWeight: 600 }}>
          Confirm Dispatch Submission
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#37474f', lineHeight: 1.6 }}>
            Are you sure you want to submit this dispatch plan? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setConfirmOpen(false)} 
            variant="outlined"
            sx={{
              borderColor: '#1976d2',
              color: '#1976d2',
              '&:hover': {
                borderColor: '#1565c0',
                backgroundColor: '#f8fbff'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            variant="contained"
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': { backgroundColor: '#1565c0' }
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={4000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          sx={{ 
            width: "100%",
            borderRadius: 2,
            '& .MuiAlert-icon': { color: '#2e7d32' }
          }}
          icon={<CheckCircle />}
        >
          Dispatch submitted successfully!
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="error" 
          sx={{ 
            width: "100%",
            borderRadius: 2,
            '& .MuiAlert-icon': { color: '#d32f2f' }
          }}
          icon={<ErrorIcon />}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Floating Action Button */}
      <Fab
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16,
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.8) 0%, rgba(25, 118, 210, 0.9) 100%)',
          color: 'white',
          boxShadow: '0 2px 10px rgba(25, 118, 210, 0.2)',
          '&:hover': {
            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.9) 0%, rgba(25, 118, 210, 1) 100%)',
            boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
            transform: 'scale(1.02)',
            transition: 'all 0.3s ease'
          }
        }}
        onClick={() => window.location.reload()}
      >
        <RefreshIcon />
      </Fab>
    </Container>
  );
};

export default DispatchForm;
