import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Typography,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Card,
  CardContent,
  CardActions,
  Chip,
  LinearProgress,
  Divider,
  Stack,
  Container,
  Avatar,
  Badge,
  Tooltip,
  IconButton,
  Fab,
  Zoom,
  useTheme,
  useMediaQuery,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Inventory as InventoryIcon,
  PlayArrow as GenerateIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Assignment as KittingIcon,
  ShoppingCart as IssueIcon,
  Factory as ProductionIcon,
  Storage as StockIcon,
  Timeline as ProgressIcon,
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Cable as CableIcon,
  Build as MouldingIcon,
  Business as CompanyIcon,
  Build as BuildIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  WhatsApp as WhatsAppIcon,
  InfoOutlined as InfoIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import sheetService from "../../services/sheetService";
import { createFilterOptions } from '@mui/material/Autocomplete';
import config from "../../config/config";

const CompanyKittingSheet = () => {
  // Navigation and theme
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Data states
  const [companyBoms, setCompanyBoms] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [issuedItems, setIssuedItems] = useState([]);
  const [bookedItems, setBookedItems] = useState([]);

  // Input states
  const [selectedBom, setSelectedBom] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [orderQty, setOrderQty] = useState(1);
  const [orderNumber, setOrderNumber] = useState("");

  // Display state
  const [kittingList, setKittingList] = useState([]);
  const [bookingList, setBookingList] = useState([]);
  const [issuedItemsList, setIssuedItemsList] = useState([]);
  const [activeTab, setActiveTab] = useState("kitting");
  const [currentIssueBatchId, setCurrentIssueBatchId] = useState(null);
 const [showLast24Hours, setShowLast24Hours] = useState(true);

  // Generate a simple sequential Kitting ID - always real-time from sheet
  const generateUniqueKittingId = async (bomId) => {
    try {
      // Always fetch fresh data from Google Sheets (no caching)
      const existing = await sheetService.getSheetData("Company Material Issues");
      
      if (!existing || existing.length === 0) {
        return "KIT-1";
      }
      // Extract existing kitting IDs and find the highest number
      const existingIds = existing
        .map(row => row.uniqueKittingId)
        .filter(id => id && typeof id === 'string' && id.startsWith('KIT-'))
        .map(id => {
          const match = id.match(/KIT-(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(num => !isNaN(num) && num > 0);
      const nextNumber = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
      const newId = `KIT-${nextNumber}`;
      return newId;
    } catch (error) {
      console.error("[Generate Kitting ID] Error fetching from sheet:", error);
      // Fallback to timestamp-based ID if there's an error accessing the sheet
      const fallbackId = `KIT-${Date.now()}`;
      return fallbackId;
    }
  };
  const goPrev = () => navigate('/inventory/stock-sheet/material-inward');
  const goNext = () => navigate('/inventory/stock-sheet');

  // UI states
  const [loading, setLoading] = useState(true);
  const [openViewDetailsDialog, setOpenViewDetailsDialog] = useState(false);
  const [selectedKittingDetails, setSelectedKittingDetails] = useState(null);
  const [openIssuedItemDetailsDialog, setOpenIssuedItemDetailsDialog] = useState(false);
  const [selectedIssuedItemDetails, setSelectedIssuedItemDetails] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // WhatsApp link from config
  const whatsappLink = config.externalLinks.whatsapp;

  // Material Intent Dialog state
  const [materialIntentDialog, setMaterialIntentDialog] = useState({
    open: false,
    item: null,
    requiredQty: 0,
    availableQty: 0,
  });

  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true);
        const [bomData, stockItems] = await Promise.all([
          sheetService.getSheetData("Company BOM"),
          sheetService.getSheetData("Stock"),
        ]);
        
        setCompanyBoms(bomData || []);
        setStockData(stockItems || []);
        setIssuedItems([]);
        
        // Initialize issued items list
        setIssuedItemsList({});
        
        setSnackbar({ open: true, message: "Data loaded successfully.", severity: "success" });
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setSnackbar({ open: true, message: "Failed to load essential data.", severity: "error" });
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, []);

  // Auto-select BOM from Company BOM page, if present
  useEffect(() => {
    try {
      const raw = localStorage.getItem('selectedBOMForKitting');
      if (!raw) return;
      const sel = JSON.parse(raw);
      if (!sel?.bomId) return;
      // Find matching BOM from loaded list when available
      const trySelect = () => {
        if (companyBoms && companyBoms.length) {
          const match = companyBoms.find(b => String(b.id) === String(sel.bomId));
          if (match) {
            setSelectedBom(match);
            if (sel.plan) setOrderQty(Number(sel.plan) || 1);
            showSnackbar(`Auto-selected BOM ${match.id} for kitting.`, 'success');
            localStorage.removeItem('selectedBOMForKitting');
            return true;
          }
        }
        return false;
      };

      // If data not yet loaded, poll briefly until available
      if (!trySelect()) {
        const t = setInterval(() => {
          if (trySelect()) clearInterval(t);
        }, 300);
        setTimeout(() => clearInterval(t), 5000);
      }
    } catch (e) {
      console.warn('Failed to auto-select BOM for kitting:', e);
    }
  }, [companyBoms]);

  // Helper functions
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const getAvailableQuantity = (itemCode) => {
    // Enhanced matching logic to handle different field names and formats
    let stockItem = stockData.find(s => 
      s.itemCode === itemCode || 
      s.ItemCode === itemCode ||
      s.itemName === itemCode ||
      s.ItemName === itemCode
    );
    
    // If itemCode contains the new format "ItemCode - ItemName", try to match by item code
    if (!stockItem && itemCode && itemCode.includes(' - ')) {
      const codePart = itemCode.split(' - ')[0].trim();
      stockItem = stockData.find(s => 
        s.itemCode === codePart || 
        s.ItemCode === codePart
      );
    }
    
    const onHandQty = stockItem ? Number(stockItem.currentStock || stockItem.CurrentStock || 0) : 0;
    return onHandQty; // Simplified - no booking system
  };

  const getStockStatusColor = (availableQty, requiredQty) => {
    if (availableQty >= requiredQty) return 'success';
    if (availableQty > 0) return 'warning';
    return 'error';
  };

  const getStatusIcon = (availableQty, requiredQty) => {
    if (availableQty >= requiredQty) return <CheckIcon color="success" />;
    if (availableQty > 0) return <WarningIcon color="warning" />;
    return <ErrorIcon color="error" />;
  };

  const getStatusChip = (availableQty, requiredQty) => {
    if (availableQty >= requiredQty) {
      return <Chip label="Available" color="success" size="small" />;
    }
    if (availableQty > 0) {
      return <Chip label="Partial" color="warning" size="small" />;
    }
    return <Chip label="Out of Stock" color="error" size="small" />;
  };

  // Check if item is already issued in the current kitting batch (allow multiple kitting batches per BOM)
  const isItemAlreadyIssued = async (bomId, itemCode, currentKittingId = null) => {
    try {
      // Always fetch fresh data from the sheet to ensure real-time accuracy
      const kittingIssues = await sheetService.getSheetData("Company Material Issues");
      if (!kittingIssues || kittingIssues.length === 0) {
        return false;
      }
      // Find the stock item to get both itemCode and itemName for comprehensive checking
      const stockItem = stockData.find(s => 
        s.itemCode === itemCode || 
        s.itemName === itemCode
      );

      // Check for issued status - only check within the current kitting batch if provided
      const isIssued = kittingIssues.some(row => {
        // If we have a current kitting ID, only check within that batch
        if (currentKittingId && row.uniqueKittingId !== currentKittingId) {
          return false;
        }
        
        // If no current kitting ID, check if item is already issued in ANY batch for this BOM
        const bomMatches = row.bomId === String(bomId);
        if (!bomMatches) return false;
        
        let detailsArray = [];
        try {
          const parsed = typeof row.itemIssueDetails === 'string' ? JSON.parse(row.itemIssueDetails) : row.itemIssueDetails;
          // Handle both array and single object formats for backward compatibility
          detailsArray = Array.isArray(parsed) ? parsed : [parsed];
        } catch (_) {
          return false;
        }
        
        if (!detailsArray || detailsArray.length === 0) return false;
        
        // Check if any item in the array matches
        const itemMatches = detailsArray.some(details => {
          if (!details) return false;
          return details.itemCode === itemCode ||
                 details.itemCode === stockItem?.itemCode ||
                 details.itemCode === stockItem?.itemName;
        });
        
        if (itemMatches) {
        }
        return itemMatches;
      });

      if (isIssued) {
      } else {
        
      }

      return isIssued;

    } catch (error) {
      console.error("Error checking Company Material Issues sheet:", error);
      showSnackbar("Error checking issued items: " + error.message, "warning");
      return false; // Assume not issued on error to prevent blocking
    }
  };

  // Ensure Company Kitting Issues sheet exists
  const ensureKittingIssuesSheetExists = async () => {
    const sheetName = "Company Material Issues";
    try {
      await sheetService.getSheetData(sheetName);
      return true; // Sheet exists
    } catch (error) {
      if (error.message && (error.message.includes("does not exist") || error.message.includes("Unable to parse range"))) {
        try {
          // Create the sheet with headers
          await sheetService.createSheet(sheetName);
          // Add headers
          const headers = {
            uniqueKittingId: "uniqueKittingId",
            bomId: "bomId",
            itemIssueDetails: "itemIssueDetails"
          };
          await sheetService.appendRow(sheetName, headers);
          return true;
        } catch (createError) {
          console.error(`Failed to create ${sheetName} sheet:`, createError);
          console.error("Create error details:", createError.response?.data || createError.message);
          throw new Error(`Failed to create ${sheetName} sheet: ${createError.message}`);
        }
      }
      throw error;
    }
  };

  // Record material issue into Company Kitting Issues with new columns
  const recordMaterialIssue = async (bomId, item, issuedQty, process, uniqueKittingId) => {
    // Ensure sheet exists first
    await ensureKittingIssuesSheetExists();
    
    const kittingId = uniqueKittingId || await generateUniqueKittingId(bomId);
    
    try {
      const existing = await sheetService.getSheetData("Company Material Issues");
      
      // Find existing row with same kitting ID and BOM ID
      const existingRowIndex = existing?.findIndex(r => 
        r.uniqueKittingId === kittingId && String(r.bomId) === String(bomId)
      );
      
      if (existingRowIndex !== undefined && existingRowIndex >= 0) {
        // Update existing row by adding new item to the array
        const existingRow = existing[existingRowIndex];
        let itemDetailsArray = [];
        
        try {
          const existingDetails = typeof existingRow.itemIssueDetails === 'string' 
            ? JSON.parse(existingRow.itemIssueDetails) 
            : existingRow.itemIssueDetails;
          
          // Handle both array and single object formats for backward compatibility
          itemDetailsArray = Array.isArray(existingDetails) ? existingDetails : [existingDetails];
        } catch (_) {
          // If parsing fails, start with empty array
          itemDetailsArray = [];
        }
        
        // Check if item already exists in this specific kitting batch
        const itemExists = itemDetailsArray.some(d => d.itemCode === item.itemCode);
        if (itemExists) {
          showSnackbar("This item is already issued for this kitting batch. Skipping store.", "info");
          return null;
        }
        
        // Add new item to the array
        itemDetailsArray.push({
          itemCode: item.itemCode,
          itemName: item.itemName,
          process: process,
          requiredQty: item.requiredQty,
          issuedQty: issuedQty,
          unit: item.uom,
          location: item.location,
          availableQty: item.availableQty,
          balanceQty: item.balanceQty
        });
        
        // Update the existing row
        const updatedRow = {
          ...existingRow,
          itemIssueDetails: JSON.stringify(itemDetailsArray)
        };
        
        await sheetService.updateRow("Company Material Issues", existingRowIndex + 2, updatedRow);
      } else {
        // Create new row with single item in array (only if no kitting batch exists for this BOM)
        const row = {
          uniqueKittingId: kittingId,
          bomId: bomId,
          itemIssueDetails: JSON.stringify([{
            itemCode: item.itemCode,
            itemName: item.itemName,
            process: process,
            requiredQty: item.requiredQty,
            issuedQty: issuedQty,
            unit: item.uom,
            location: item.location,
            availableQty: item.availableQty,
            balanceQty: item.balanceQty
          }])
        };
        
        await sheetService.appendRow("Company Material Issues", row);
      }
    } catch (error) {
      console.error("Failed to save to Company Material Issues sheet:", error);
      throw new Error("Failed to save issue record to sheet");
    }

    return { uniqueKittingId: kittingId, bomId: bomId };
  };

  const handleIssueQtyChange = (value, index) => {
    const updatedList = [...kittingList];
    updatedList[index].issuedQty = value;
    setKittingList(updatedList);
  };

  const handleDeleteKittingItem = (index) => {
    if (window.confirm('Are you sure you want to delete this kitting item?')) {
      const updatedList = [...kittingList];
      updatedList.splice(index, 1);
      setKittingList(updatedList);
      showSnackbar("Kitting item deleted successfully", "success");
    }
  };

  const generateKittingList = async () => {
    if (!selectedBom || !orderQty || orderQty <= 0) {
      setKittingList([]);
      return;
    }

    try {
      setLoading(true);
      showSnackbar("Generating kitting list and checking issued items in real-time...", "info");

      const category = selectedBom.category || selectedBom.bomCategory;
      let allMaterials = [];
      if (selectedBom.Materials) {
        try {
          const parsed = typeof selectedBom.Materials === 'string' ? JSON.parse(selectedBom.Materials) : selectedBom.Materials;
          allMaterials = (Array.isArray(parsed) ? parsed : []).filter(m => m.rawMaterial && m.qtyPerPc).map(m => ({ ...m, process: category || 'Cable' }));
        } catch {
          allMaterials = [];
        }
      } else {
        // Legacy support: combine cable + moulding arrays
        const cableMaterials = typeof selectedBom.cableMaterials === 'string' 
          ? JSON.parse(selectedBom.cableMaterials) 
          : selectedBom.cableMaterials || [];
        const mouldingMaterials = typeof selectedBom.mouldingMaterials === 'string' 
          ? JSON.parse(selectedBom.mouldingMaterials) 
          : selectedBom.mouldingMaterials || [];
        allMaterials = [
          ...cableMaterials.filter(item => item.rawMaterial && item.qtyPerPc).map(item => ({ ...item, process: 'Cable' })),
          ...mouldingMaterials.filter(item => item.rawMaterial && item.qtyPerPc).map(item => ({ ...item, process: 'Moulding' }))
        ];
      }

      if (allMaterials.length === 0) {
        showSnackbar("No materials found in this BOM.", "warning");
        setKittingList([]);
        setLoading(false);
        return;
      }
      // Start a fresh batch id so repeating the same BOM is allowed; duplicates only within a batch are blocked
      setCurrentIssueBatchId(`BATCH-${selectedBom.id}-${Date.now()}`);

      // Include all items for kitting (allow multiple kitting batches per BOM)
      const availableItems = allMaterials;

      if (availableItems.length === 0) {
        showSnackbar(
          `No materials found for this BOM.`, 
          "info"
        );
        setKittingList([]);
        setLoading(false);
        return;
      }

      // Build the kitting list with available items only
      const newList = availableItems.map((material, index) => {
        // Enhanced item matching logic to handle the new format
        let stockItem = null;
        
        // Try multiple matching strategies
        if (material.rawMaterial) {
          // First try: exact match with itemName or ItemName
          stockItem = stockData.find((s) => 
            s.itemName === material.rawMaterial || 
            s.ItemName === material.rawMaterial ||
            s.itemCode === material.rawMaterial ||
            s.ItemCode === material.rawMaterial
          );
          
          // Second try: match with the new format "ItemCode - ItemName"
          if (!stockItem && material.rawMaterial.includes(' - ')) {
            const [itemCode, itemName] = material.rawMaterial.split(' - ');
            stockItem = stockData.find((s) => 
              (s.itemCode === itemCode.trim() || s.ItemCode === itemCode.trim()) ||
              (s.itemName === itemName.trim() || s.ItemName === itemName.trim())
            );
          }
          
          // Third try: partial match with item code
          if (!stockItem && material.rawMaterial.includes(' - ')) {
            const itemCode = material.rawMaterial.split(' - ')[0].trim();
            stockItem = stockData.find((s) => 
              s.itemCode === itemCode || s.ItemCode === itemCode
            );
          }
        }
        const requiredQty = Number(material.qtyPerPc) * Number(orderQty);
        const onHandQty = stockItem ? Number(stockItem.currentStock || stockItem.CurrentStock || 0) : 0;
        const availableQty = getAvailableQuantity(stockItem?.itemCode || stockItem?.ItemCode || material.rawMaterial);
        const balanceQty = availableQty - requiredQty;

        return {
          sno: index + 1,
          itemName: material.rawMaterial,
          itemCode: stockItem?.itemCode || material.rawMaterial,
          process: material.process,
          qtyPerPc: material.qtyPerPc,
          uom: material.units,
          location: stockItem ? stockItem.location : "N/A",
          requiredQty,
          onHandQty,
          availableQty,
          balanceQty,
          issuedQty: requiredQty,
          originalMaterial: material,
        };
      });

      setKittingList(newList);
      
      // Provide detailed feedback to user
      showSnackbar(`Kitting list generated successfully with ${availableItems.length} items.`, "success");
    } catch (error) {
      console.error("[Generate Kitting List] Error:", error);
      showSnackbar("Error generating kitting list: " + error.message, "error");
      setKittingList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueMaterial = async (item, index) => {
    try {
      const issueQty = parseFloat(item.issuedQty) || 0;
      
      if (issueQty <= 0) {
        showSnackbar("Please enter a valid quantity to issue.", "warning");
        return;
      }

      // Check if sufficient stock is available
      if (issueQty > item.availableQty) {
        showSnackbar(`Insufficient stock! Available: ${item.availableQty}, Requested: ${issueQty}.`, "error");
        return;
      }

      // Double-check if item hasn't been issued already (real-time check)
      const alreadyIssued = await isItemAlreadyIssued(selectedBom.id, item.itemCode);
      if (alreadyIssued) {
        showSnackbar(`This item has already been issued for this BOM. Refreshing list...`, "warning");
        // Refresh the kitting list to show current state
        await generateKittingList();
        return;
      }

      // Block issuing entire BOM if any item has negative balance
      const hasNegative = kittingList.some(k => (k.availableQty - k.requiredQty) < 0);
      if (hasNegative) {
        showSnackbar("Cannot issue: At least one material has negative balance. Resolve shortages first.", "error");
        return;
      }

      setLoading(true);

      try {
        // First, deduct from Stock Sheet
        const stockIndex = stockData.findIndex((s) => 
          s.itemCode === item.itemCode || 
          s.ItemCode === item.itemCode ||
          (item.itemCode.includes(' - ') && s.itemCode === item.itemCode.split(' - ')[0].trim())
        );
        if (stockIndex === -1) {
          showSnackbar("Stock item not found in Stock sheet!", "error");
          setLoading(false);
          return;
        }

        const updatedStockItem = { ...stockData[stockIndex] };
        const currentStock = parseFloat(updatedStockItem.currentStock) || 0;
        const newStock = currentStock - issueQty;
        
        if (newStock < 0) {
          showSnackbar(`Cannot issue: Would result in negative stock (${newStock})`, "error");
          setLoading(false);
          return;
        }
        
        updatedStockItem.currentStock = newStock.toString();
        updatedStockItem.lastUpdated = new Date().toISOString().split("T")[0];
        // Update Stock sheet (row index is array index + 2 for header and 1-based indexing)
        await sheetService.updateRow("Stock", stockIndex + 2, updatedStockItem);

        // Update local stock data
        const updatedStockData = [...stockData];
        updatedStockData[stockIndex] = updatedStockItem;
        setStockData(updatedStockData);
        // Record the material issue in Company Kitting Issues sheet
        await recordMaterialIssue(
          selectedBom.id,
          item,
          issueQty,
          item.process,
          currentIssueBatchId || await generateUniqueKittingId(selectedBom.id)
        );
        showSnackbar(
          `Successfully issued ${issueQty} ${item.uom} of ${item.itemName}. Stock: ${currentStock} → ${newStock}`, 
          "success"
        );

        // Remove the issued item from the kitting list immediately for real-time update
        const updatedList = kittingList.filter(kittingItem => kittingItem.itemCode !== item.itemCode);
        setKittingList(updatedList);
        // Update remaining items with fresh stock data for real-time stock levels
        const updatedListWithFreshStock = updatedList.map(kittingItem => {
          const stockItem = stockData.find(s => 
            s.itemCode === kittingItem.itemCode || 
            s.ItemCode === kittingItem.itemCode ||
            (kittingItem.itemCode.includes(' - ') && s.itemCode === kittingItem.itemCode.split(' - ')[0].trim())
          );
          if (stockItem) {
            const currentStock = parseFloat(stockItem.currentStock) || 0;
            const availableQty = Math.max(0, currentStock);
            const balanceQty = availableQty - kittingItem.requiredQty;
            
            return {
              ...kittingItem,
              availableQty: availableQty,
              balanceQty: balanceQty
            };
          }
          return kittingItem;
        });
        setKittingList(updatedListWithFreshStock);
        
        // Show updated count with process information
        if (updatedList.length > 0) {
          showSnackbar(
            `Item issued successfully! ${updatedList.length} items remaining in kitting list.`, 
            "success"
          );
        } else {
          showSnackbar(
            `All materials for this BOM have been issued! Kitting complete.`, 
            "success"
          );
        }

      } catch (error) {
        console.error("[Issue Material] Error:", error);
        showSnackbar("Error issuing material: " + error.message, "error");
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error("[Issue Material] Unexpected error:", error);
      showSnackbar("Error processing material issue: " + error.message, "error");
      setLoading(false);
    }
  };

  const handleIssueAllMaterials = async () => {
    if (!selectedBom || kittingList.length === 0) {
      showSnackbar("Generate kitting list first.", "warning");
      return;
    }
    const hasNegative = kittingList.some(k => (k.availableQty - k.requiredQty) < 0);
    if (hasNegative) {
      showSnackbar("Cannot issue full BOM: one or more items have negative balance.", "error");
      return;
    }
    try {
      setLoading(true);
      // Ensure the sheet exists before proceeding
      await ensureKittingIssuesSheetExists();
      
      // Work on a stable snapshot to avoid index churn while list mutates
      const itemsSnapshot = kittingList.map(it => ({ ...it, issuedQty: it.issuedQty || it.requiredQty }));
      
      // Check stock availability before proceeding
      const stockCheckResults = itemsSnapshot.map(item => {
        const stockItem = stockData.find(s => 
          s.itemCode === item.itemCode || 
          s.ItemCode === item.itemCode ||
          (item.itemCode.includes(' - ') && s.itemCode === item.itemCode.split(' - ')[0].trim())
        );
        const availableQty = parseFloat(stockItem?.currentStock || 0);
        const requiredQty = item.issuedQty;
        const hasEnoughStock = availableQty >= requiredQty;
        return {
          ...item,
          availableQty,
          hasEnoughStock
        };
      });
      
      // Check if any items don't have enough stock
      const insufficientStock = stockCheckResults.filter(item => !item.hasEnoughStock);
      if (insufficientStock.length > 0) {
        const itemNames = insufficientStock.map(item => `${item.itemCode} (Available: ${item.availableQty}, Required: ${item.issuedQty})`).join(', ');
        showSnackbar(`Cannot issue: Insufficient stock for: ${itemNames}`, "error");
        return;
      }
      
      // Use one uniqueKittingId for the whole batch (or existing one if BOM already has kitting)
      const batchKittingId = await generateUniqueKittingId(selectedBom.id);
      // Create array of all item details for batch issue
      const itemDetailsArray = itemsSnapshot.map(item => ({
        itemCode: item.itemCode,
        itemName: item.itemName,
        process: item.process,
        requiredQty: item.requiredQty,
        issuedQty: item.issuedQty,
        unit: item.uom,
        location: item.location,
        availableQty: item.availableQty,
        balanceQty: item.balanceQty
      }));

      // Store all items in a single row with array of item details
      const row = {
        uniqueKittingId: batchKittingId,
        bomId: selectedBom.id,
        itemIssueDetails: JSON.stringify(itemDetailsArray)
      };
      await sheetService.appendRow("Company Material Issues", row);
      
      // Then, process each item (deduct stock and update local state)
      for (const item of itemsSnapshot) {
        // eslint-disable-next-line no-await-in-loop
        await (async () => {
          // Deduct from Stock Sheet
          const stockIndex = stockData.findIndex((s) => 
          s.itemCode === item.itemCode || 
          s.ItemCode === item.itemCode ||
          (item.itemCode.includes(' - ') && s.itemCode === item.itemCode.split(' - ')[0].trim())
        );
          if (stockIndex === -1) {
            console.warn(`[Issue All] Stock item not found: ${item.itemCode}`);
            return;
          }

          const updatedStockItem = { ...stockData[stockIndex] };
          const currentStock = parseFloat(updatedStockItem.currentStock) || 0;
          const newStock = currentStock - item.issuedQty;
          
          if (newStock < 0) {
            console.warn(`[Issue All] Cannot issue: Would result in negative stock for ${item.itemCode}`);
            return;
          }

          updatedStockItem.currentStock = newStock.toString();
          updatedStockItem.lastUpdated = new Date().toISOString().split("T")[0];

          // Update Stock sheet
          await sheetService.updateRow("Stock", stockIndex + 2, updatedStockItem);
          // Update local stock data
          const updatedStockData = [...stockData];
          updatedStockData[stockIndex] = updatedStockItem;
          setStockData(updatedStockData);
        })();
      }
      
      // Clear the kitting list since all items are now issued
      setKittingList([]);
      
      // Refresh issued-items view and switch tab so the user can see the result immediately
      await generateIssuedItemsList();
      setActiveTab("issued");
      showSnackbar(`All ${itemsSnapshot.length} materials issued successfully! Batch ID: ${batchKittingId}`, "success");
    } catch (e) {
      console.error("Issue All failed:", e);
      showSnackbar("Failed to issue all materials: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClearIssuedItems = async () => {
    showSnackbar("Issued items are managed in the sheet. Clearing from UI is disabled.", "info");
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleViewDetails = (item) => {
    setSelectedKittingDetails(item);
    setOpenViewDetailsDialog(true);
  };

  const handleViewIssuedItemDetails = (issue) => {
    setSelectedIssuedItemDetails(issue);
    setOpenIssuedItemDetailsDialog(true);
  };

  const handleDeleteIssuedItem = async (issue) => {
    if (window.confirm(`Are you sure you want to delete this issued item: ${issue.itemCode}?`)) {
      try {
        // Delete from the Company Material Issues sheet
        await sheetService.deleteRow("Company Material Issues", issue.rowIndex);
        
        // Refresh the issued items list
        await generateIssuedItemsList();
        
        showSnackbar("Issued item deleted successfully", "success");
      } catch (error) {
        console.error("Error deleting issued item:", error);
        showSnackbar("Error deleting issued item: " + error.message, "error");
      }
    }
  };

  const handleDeleteBatch = async (kittingId, issues) => {
    const confirmMessage = `Are you sure you want to delete the entire batch "${kittingId}"?\n\nThis will delete ${issues.length} items from the Google Sheet and cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true);
        
        // Get all kitting issues to find the rows to delete
        const kittingIssues = await sheetService.getSheetData("Company Material Issues");

        // Find all rows that belong to this kitting batch
        const rowsToDelete = kittingIssues
          .map((issue, index) => ({ ...issue, rowIndex: index + 2 })) // +2 for header and 1-based indexing
          .filter(issue => issue.uniqueKittingId === kittingId);
        // Delete rows in reverse order to maintain correct row indices
        for (let i = rowsToDelete.length - 1; i >= 0; i--) {
          const row = rowsToDelete[i];
          await sheetService.deleteRow("Company Material Issues", row.rowIndex);
        }
        
        // Refresh the issued items list to update UI
        await generateIssuedItemsList();
        
        showSnackbar(`Batch "${kittingId}" deleted successfully (${rowsToDelete.length} items removed)`, "success");
      } catch (error) {
        console.error("Error deleting batch:", error);
        showSnackbar("Error deleting batch: " + error.message, "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const generateKittingBatchPDF = (kittingId, issues) => {
    const companyName = "REYANSH INTERNATIONAL PVT. LTD";
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '/');
    
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Kitting Batch Report - ${kittingId}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #1976d2;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 10px;
          }
          .report-title {
            font-size: 18px;
            color: #666;
            margin-bottom: 5px;
          }
          .report-date {
            font-size: 14px;
            color: #999;
          }
          .batch-info {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #1976d2;
            margin-bottom: 30px;
          }
          .batch-info h3 {
            margin: 0 0 15px 0;
            color: #1976d2;
            font-size: 16px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
          }
          .info-label {
            font-weight: bold;
            color: #555;
          }
          .info-value {
            color: #333;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          .items-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            color: #1976d2;
          }
          .items-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .process-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .process-cable {
            background-color: #e3f2fd;
            color: #1976d2;
          }
          .process-moulding {
            background-color: #fff3e0;
            color: #f57c00;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          .signature-section {
            margin-top: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .signature-box {
            text-align: center;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 8px;
          }
          .signature-label {
            font-weight: bold;
            margin-bottom: 20px;
          }
          .signature-line {
            border-bottom: 1px solid #333;
            height: 40px;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${companyName}</div>
          <div class="report-title">Kitting Batch Report</div>
          <div class="report-date">Generated on: ${currentDate}</div>
        </div>

        <div class="batch-info">
          <h3>Batch Information</h3>
          <div class="info-row">
            <span class="info-label">Kitting ID:</span>
            <span class="info-value">${kittingId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">BOM ID:</span>
            <span class="info-value">${issues[0]?.bomId || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total Items:</span>
            <span class="info-value">${issues.length}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Issue Date:</span>
            <span class="info-value">${issues[0]?.issueDate || 'N/A'}</span>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item Code</th>
              <th>Item Name</th>
              <th>Process</th>
              <th>Required Qty</th>
              <th>Issued Qty</th>
              <th>Unit</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            ${issues.map(issue => `
              <tr>
                <td>${issue.itemCode || 'N/A'}</td>
                <td>${issue.itemName || 'N/A'}</td>
                <td>
                  <span class="process-badge process-${issue.process?.toLowerCase() || 'cable'}">
                    ${issue.process || 'N/A'}
                  </span>
                </td>
                <td>${issue.requiredQty || '0'}</td>
                <td>${issue.issuedQty || '0'}</td>
                <td>${issue.unit || 'N/A'}</td>
                <td>${issue.location || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-label">MATERIAL ISSUED BY</div>
            <div class="signature-line"></div>
            <div>SIGNATURE</div>
          </div>
          <div class="signature-box">
            <div class="signature-label">RECEIVED BY</div>
            <div class="signature-line"></div>
            <div>SIGNATURE</div>
          </div>
        </div>

        <div class="footer">
          <p>This report was generated by the Material Kitting Management System</p>
          <p>${companyName} - Manufacturing Management</p>
        </div>
      </body>
      </html>
    `;

    // Create a new window to generate PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
      printWindow.print();
    };
  };

  const generateIssuedItemPDF = (issue) => {
    const companyName = "REYANSH INTERNATIONAL PVT. LTD";
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '/');
    
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Issued Item Details - ${issue.itemCode}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #1976d2;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 10px;
          }
          .report-title {
            font-size: 18px;
            color: #666;
            margin-bottom: 5px;
          }
          .report-date {
            font-size: 14px;
            color: #999;
          }
          .item-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .detail-section {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #1976d2;
          }
          .detail-section h3 {
            margin: 0 0 15px 0;
            color: #1976d2;
            font-size: 16px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
          }
          .detail-label {
            font-weight: bold;
            color: #555;
          }
          .detail-value {
            color: #333;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-issued { background-color: #d4edda; color: #155724; }
          .status-pending { background-color: #fff3cd; color: #856404; }
          .status-completed { background-color: #d1ecf1; color: #0c5460; }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          .signature-section {
            margin-top: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .signature-box {
            text-align: center;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 8px;
          }
          .signature-label {
            font-weight: bold;
            margin-bottom: 20px;
          }
          .signature-line {
            border-bottom: 1px solid #333;
            height: 40px;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${companyName}</div>
          <div class="report-title">Issued Item Details Report</div>
          <div class="report-date">Generated on: ${currentDate}</div>
        </div>

        <div class="item-details">
          <div class="detail-section">
            <h3>Item Information</h3>
            <div class="detail-row">
              <span class="detail-label">Item Code:</span>
              <span class="detail-value">${issue.itemCode || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Item Name:</span>
              <span class="detail-value">${issue.itemName || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Process:</span>
              <span class="detail-value">${issue.process || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">BOM ID:</span>
              <span class="detail-value">${issue.bomId || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Unit:</span>
              <span class="detail-value">${issue.unit || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Location:</span>
              <span class="detail-value">${issue.location || 'N/A'}</span>
            </div>
          </div>

          <div class="detail-section">
            <h3>Issue Information</h3>
            <div class="detail-row">
              <span class="detail-label">Issued Quantity:</span>
              <span class="detail-value">${issue.issuedQty || '0'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Issue Date:</span>
              <span class="detail-value">${issue.issueDate || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Issue Time:</span>
              <span class="detail-value">${issue.issueTime || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Required Quantity:</span>
              <span class="detail-value">${issue.requiredQty || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Available Quantity:</span>
              <span class="detail-value">${issue.availableQty || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">
                <span class="status-badge status-${issue.status?.toLowerCase() || 'issued'}">
                  ${issue.status || 'Issued'}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-label">MATERIAL ISSUED BY</div>
            <div class="signature-line"></div>
            <div>SIGNATURE</div>
          </div>
          <div class="signature-box">
            <div class="signature-label">RECEIVED BY</div>
            <div class="signature-line"></div>
            <div>SIGNATURE</div>
          </div>
        </div>

        <div class="footer">
          <p>This report was generated by the Material Issue Management System</p>
          <p>${companyName} - Manufacturing Management</p>
        </div>
      </body>
      </html>
    `;

    // Create a new window to generate PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
      printWindow.print();
    };
  };

  const generateKittingPDF = (item) => {
    const companyName = "REYANSH INTERNATIONAL PVT. LTD";
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '/');
    
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Kitting Details - ${item.itemName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #1976d2;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 10px;
          }
          .report-title {
            font-size: 18px;
            color: #666;
            margin-bottom: 5px;
          }
          .report-date {
            font-size: 14px;
            color: #999;
          }
          .item-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .detail-section {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #1976d2;
          }
          .detail-section h3 {
            margin: 0 0 15px 0;
            color: #1976d2;
            font-size: 16px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
          }
          .detail-label {
            font-weight: bold;
            color: #555;
          }
          .detail-value {
            color: #333;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-available { background-color: #d4edda; color: #155724; }
          .status-shortage { background-color: #f8d7da; color: #721c24; }
          .status-critical { background-color: #fff3cd; color: #856404; }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          .signature-section {
            margin-top: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .signature-box {
            text-align: center;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 8px;
          }
          .signature-label {
            font-weight: bold;
            margin-bottom: 20px;
          }
          .signature-line {
            border-bottom: 1px solid #333;
            height: 40px;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${companyName}</div>
          <div class="report-title">Material Kitting Details Report</div>
          <div class="report-date">Generated on: ${currentDate}</div>
        </div>

        <div class="item-details">
          <div class="detail-section">
            <h3>Item Information</h3>
            <div class="detail-row">
              <span class="detail-label">Item Code:</span>
              <span class="detail-value">${item.itemCode || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Item Name:</span>
              <span class="detail-value">${item.itemName || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Process:</span>
              <span class="detail-value">${item.process || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Unit:</span>
              <span class="detail-value">${item.unit || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Location:</span>
              <span class="detail-value">${item.location || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Serial No:</span>
              <span class="detail-value">${item.sno || 'N/A'}</span>
            </div>
          </div>

          <div class="detail-section">
            <h3>Quantity Information</h3>
            <div class="detail-row">
              <span class="detail-label">Quantity Per PC:</span>
              <span class="detail-value">${item.qtyPerPc || '0'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Required Quantity:</span>
              <span class="detail-value">${item.requiredQty || '0'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">On-Hand Quantity:</span>
              <span class="detail-value">${item.onHandQty || '0'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Available Quantity:</span>
              <span class="detail-value">${item.availableQty || '0'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Balance Quantity:</span>
              <span class="detail-value">${item.balanceQty || '0'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Issue Quantity:</span>
              <span class="detail-value">${item.issuedQty || '0'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">
                <span class="status-badge status-${item.availableQty >= item.requiredQty ? 'available' : 'shortage'}">
                  ${item.availableQty >= item.requiredQty ? 'Available' : 'Shortage'}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-label">KITTING OPERATOR</div>
            <div class="signature-line"></div>
            <div>SIGNATURE</div>
          </div>
          <div class="signature-box">
            <div class="signature-label">SUPERVISOR</div>
            <div class="signature-line"></div>
            <div>SIGNATURE</div>
          </div>
        </div>

        <div class="footer">
          <p>This report was generated by the Material Kitting Management System</p>
          <p>${companyName} - Manufacturing Management</p>
        </div>
      </body>
      </html>
    `;

    // Create a new window to generate PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
      printWindow.print();
    };
  };

  // Filter issued items by last 24 hours
  const filterIssuedItemsByTime = (issuesByKittingId, showLast24Hours) => {
    if (!showLast24Hours) return issuesByKittingId;
    
    const now = new Date().getTime();
    const last24Hours = now - (24 * 60 * 60 * 1000); // 24 hours in milliseconds
    
    const filteredIssues = {};
    
    Object.entries(issuesByKittingId).forEach(([kittingId, issues]) => {
      const recentIssues = issues.filter(issue => {
        // For now, we'll use current timestamp since we don't have historical timestamps
        // In a real system, you'd store the actual issue timestamp
        return issue.issueTimestamp >= last24Hours;
      });
      
      if (recentIssues.length > 0) {
        filteredIssues[kittingId] = recentIssues;
      }
    });
    
    return filteredIssues;
  };

  const generateIssuedItemsList = async () => {
    try {
      setLoading(true);
      
      // Check if sheet exists, if not, create it
      try {
        await ensureKittingIssuesSheetExists();
      } catch (error) {
        console.warn("Could not ensure kitting issues sheet exists:", error);
      }
      
      const kittingIssues = await sheetService.getSheetData("Company Material Issues");

      if (kittingIssues && kittingIssues.length > 0) {
        const issuesByKittingId = {};
        const parsedIssues = [];
        kittingIssues.forEach(row => {
          let detailsArray = [];
          try {
            const parsed = typeof row.itemIssueDetails === 'string' ? JSON.parse(row.itemIssueDetails) : row.itemIssueDetails;
            // Handle both array and single object formats for backward compatibility
            detailsArray = Array.isArray(parsed) ? parsed : [parsed];
          } catch (_) { /* ignore */ }
          
          if (!detailsArray || detailsArray.length === 0) return;
          
          // Process each item in the array
          detailsArray.forEach(details => {
            if (!details) return;
            const issue = {
              id: `${row.uniqueKittingId}-${details.itemCode}`,
              uniqueKittingId: row.uniqueKittingId,
              bomId: row.bomId || 'Unknown',
              itemCode: details.itemCode,
              itemName: details.itemName,
              process: details.process,
              issuedQty: details.issuedQty,
              unit: details.unit,
              location: details.location,
              requiredQty: details.requiredQty,
              availableQty: details.availableQty,
              status: 'Issued',
              issueDate: new Date().toISOString().split('T')[0],
              issueTime: new Date().toLocaleTimeString(),
              issueTimestamp: new Date().getTime() // Add timestamp for filtering
            };
            parsedIssues.push(issue);
            const key = row.uniqueKittingId; // Group by kitting ID instead of BOM ID
            if (!issuesByKittingId[key]) issuesByKittingId[key] = [];
            issuesByKittingId[key].push(issue);
          });
        });

        setIssuedItemsList(issuesByKittingId);
        
        // Show count based on current filter
        const filteredIssues = filterIssuedItemsByTime(issuesByKittingId, showLast24Hours);
        const filteredCount = Object.values(filteredIssues).flat().length;
        
        if (showLast24Hours) {
          showSnackbar(`Loaded ${filteredCount} items from last 24 hours (${parsedIssues.length} total items)`, "success");
        } else {
          showSnackbar(`Loaded ${parsedIssues.length} issued items from ${Object.keys(issuesByKittingId).length} kitting batches`, "success");
        }
      } else {
        setIssuedItemsList({});
        showSnackbar("No issued items found", "info");
      }
    } catch (error) {
      console.error("Error loading issued items:", error);
      showSnackbar("Failed to load issued items: " + error.message, "error");
      setIssuedItemsList({});
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => {
    if (!selectedBom) return 0;
    
    // Parse BOM materials
    let totalMaterials = 0;
    if (selectedBom.Materials) {
      try {
        const arr = typeof selectedBom.Materials === 'string' ? JSON.parse(selectedBom.Materials) : selectedBom.Materials;
        totalMaterials = (Array.isArray(arr) ? arr : []).filter(item => item.rawMaterial && item.qtyPerPc).length;
      } catch { totalMaterials = 0; }
    } else {
      const cableMaterials = typeof selectedBom.cableMaterials === 'string' 
        ? JSON.parse(selectedBom.cableMaterials) 
        : selectedBom.cableMaterials || [];
      const mouldingMaterials = typeof selectedBom.mouldingMaterials === 'string' 
        ? JSON.parse(selectedBom.mouldingMaterials) 
        : selectedBom.mouldingMaterials || [];
      totalMaterials = [
        ...cableMaterials.filter(item => item.rawMaterial && item.qtyPerPc),
        ...mouldingMaterials.filter(item => item.rawMaterial && item.qtyPerPc)
      ].length;
    }
    
    // Count issued items from current kitting list (items that will be filtered out)
    const issuedCount = totalMaterials - kittingList.length;
    
    return totalMaterials > 0 ? (issuedCount / totalMaterials) * 100 : 0;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Left/Right navigation arrows consistent with Stock/Material Inward */}
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Button variant="outlined" startIcon={<CloseIcon />} onClick={goPrev}>
          Material Inward
        </Button>
        <Button variant="contained" onClick={goNext}>
          Stock Sheet
        </Button>
      </Stack>
      {/* Header Section */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56 }}>
          <KittingIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Company Kitting Sheet
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Cable & Moulding Material Issue Management
          </Typography>
        </Box>
        {loading && (
          <CircularProgress 
            size={24} 
            sx={{ ml: 'auto' }} 
            color="primary"
          />
        )}
      </Stack>

      {/* BOM Selection Card */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <CompanyIcon color="primary" />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
              BOM Selection
            </Typography>
          </Stack>
          
          <Grid container spacing={3} alignItems="flex-end">
            <Grid item xs={12} sm={6} md={3} lg={3}>
              <Autocomplete
                options={companyBoms}
                getOptionLabel={(option) => (option && option.id ? String(option.id) : "")}
                inputValue={selectedBom ? String(selectedBom.id || '') : ''}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                value={selectedBom}
                onChange={(event, newValue) => setSelectedBom(newValue)}
                filterOptions={createFilterOptions({
                  stringify: (option) => `${option.id}`
                })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select BOM *"
                    required
                    fullWidth
                    placeholder="Choose BOM ID..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <AssignmentIcon color="action" sx={{ mr: 1 }} />,
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        minWidth: '200px', // Increased minimum width for complete BOM ID display
                        fontSize: '0.875rem', // Slightly smaller font to fit more text
                        whiteSpace: 'nowrap', // Prevent text wrapping
                        overflow: 'visible', // Allow text to extend beyond bounds if needed
                        textOverflow: 'unset', // Don't truncate with ellipsis
                      },
                      '& .MuiInputBase-root': {
                        minWidth: '200px', // Ensure the entire input has minimum width
                        '& .MuiInputBase-input': {
                          minWidth: '200px',
                        }
                      },
                      '& .MuiAutocomplete-input': {
                        minWidth: '200px',
                        fontSize: '0.875rem',
                      }
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                    <AssignmentIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {String(option.id || '')}
                    </Typography>
                  </Box>
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3} lg={3}>
              <TextField
                label="Order Quantity"
                type="number"
                value={orderQty}
                onChange={(e) => setOrderQty(e.target.value)}
                fullWidth
                disabled={loading}
                InputProps={{ 
                  inputProps: { min: 1 },
                  startAdornment: <AddIcon color="action" sx={{ mr: 1 }} />
                }}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={6} lg={6}>
              <Button
                variant="contained"
                onClick={generateKittingList}
                disabled={!selectedBom || !orderQty || orderQty <= 0 || loading}
                fullWidth
                size="large"
                startIcon={<GenerateIcon />}
                sx={{ 
                  py: 1.5,
                  background: 'linear-gradient(45deg, #2196f3, #21cbf3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976d2, #00bcd4)',
                  }
                }}
              >
                Generate List
              </Button>
            </Grid>
          </Grid>

          {/* Removed Progress and Status Section for cleaner UI */}
        </CardContent>
        
        {/* Action Buttons */}
        <CardActions sx={{ px: 3, pb: 3 }}>
          <Stack direction={isMobile ? "column" : "row"} spacing={1} sx={{ width: '100%' }}>
            <Button
              variant="outlined"
              color="warning"
              onClick={handleClearIssuedItems}
              disabled={!selectedBom || loading}
              startIcon={<ClearIcon />}
              size="small"
            >
              Clear Issued Items
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleIssueAllMaterials}
              disabled={!selectedBom || loading || kittingList.length === 0}
              startIcon={<IssueIcon />}
              size="small"
            >
              Issue All
            </Button>
            <Button
              variant="outlined"
              color="info"
              onClick={async () => {
                setLoading(true);
                try {
                  const [bomData, stockItems] = await Promise.all([
                    sheetService.getSheetData("Company BOM"),
                    sheetService.getSheetData("Stock"),
                  ]);
                  setCompanyBoms(bomData || []);
                  setStockData(stockItems || []);
                  
                  showSnackbar("BOM and stock data refreshed successfully!", "success");
                  
                  if (selectedBom) {
                    setTimeout(() => {
                      generateKittingList();
                    }, 100);
                  }
                } catch (error) {
                  showSnackbar("Failed to refresh data: " + error.message, "error");
                }
                setLoading(false);
              }}
              disabled={loading}
              startIcon={<RefreshIcon />}
              size="small"
            >
              Refresh Data
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={generateKittingList}
              disabled={!selectedBom || loading}
              startIcon={<GenerateIcon />}
              size="small"
            >
              Regenerate List
            </Button>
          </Stack>
        </CardActions>
      </Card>

      {/* Tab Navigation System */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <Box sx={{ 
          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          color: 'white',
          p: 2
        }}>
          <Stack direction="row" spacing={3}>
            <Button
              onClick={() => setActiveTab("kitting")}
              variant={activeTab === "kitting" ? "contained" : "outlined"}
              startIcon={<IssueIcon />}
              sx={{
                backgroundColor: activeTab === "kitting" ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              Material Kitting
            </Button>
            <Button
              onClick={() => {
                setActiveTab("issued");
                generateIssuedItemsList();
              }}
              variant={activeTab === "issued" ? "contained" : "outlined"}
              startIcon={<ViewIcon />}
              sx={{
                backgroundColor: activeTab === "issued" ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              View Item Issues
            </Button>
          </Stack>
        </Box>
      </Card>

      {/* Issued Items View Interface */}
      {activeTab === "issued" && (
        <Card sx={{ mb: 3, boxShadow: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Avatar sx={{ bgcolor: '#2196f3' }}>
                <ViewIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Issued Items History
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  View all materials issued from Company Material Issues sheet
                </Typography>
              </Box>
              <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showLast24Hours}
                      onChange={(e) => setShowLast24Hours(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Last 24 Hours"
                  sx={{ mr: 1 }}
                />
                <Button
                  variant="outlined"
                  onClick={generateIssuedItemsList}
                  disabled={loading}
                  startIcon={<RefreshIcon />}
                  size="small"
                >
                  Refresh
                </Button>
              </Box>
            </Stack>

            {(() => {
              const filteredIssues = filterIssuedItemsByTime(issuedItemsList, showLast24Hours);
              return Object.keys(filteredIssues).length === 0;
            })() ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 6,
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                borderRadius: 2,
                border: '2px dashed #ddd'
              }}>
                <ViewIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {showLast24Hours ? 'No Items Issued in Last 24 Hours' : 'No Issued Items Found'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {showLast24Hours ? 'Try turning off the 24-hour filter or issue some materials' : 'Issue some materials first to see them here'}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={3}>
                {Object.entries(filterIssuedItemsByTime(issuedItemsList, showLast24Hours)).map(([kittingId, issues]) => (
                  <Card key={kittingId} variant="outlined" sx={{ 
                    border: '2px solid #2196f3',
                    '&:hover': { boxShadow: 6 }
                  }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                            Kitting ID: {kittingId}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            BOM ID: {issues[0]?.bomId || 'N/A'} • {issues.length} items issued • Latest: {issues[0]?.issueDate}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Chip 
                            label={`${issues.length} Items`} 
                            color="primary" 
                            size="small" 
                          />
                          <Chip 
                            label="Issued" 
                            color="success" 
                            size="small" 
                            variant="outlined"
                          />
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteBatch(kittingId, issues)}
                            sx={{ ml: 1 }}
                          >
                            Delete Batch
                          </Button>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<PrintIcon />}
                            onClick={() => generateKittingBatchPDF(kittingId, issues)}
                            sx={{ ml: 1 }}
                          >
                            Print Batch
                          </Button>
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => window.open(whatsappLink, '_blank')}
                            sx={{ ml: 1 }}
                            title="Open WhatsApp"
                          >
                            <WhatsAppIcon />
                          </IconButton>
                        </Stack>
                      </Stack>

                      <TableContainer sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Item Details</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Process</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Issued Qty</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Issue Date</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Issue Time</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Status</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {issues.map((issue) => (
                              <TableRow key={issue.id} sx={{ '&:hover': { bgcolor: '#f9f9f9' } }}>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                      {issue.itemCode}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      BOM ID: {issue.bomId}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={issue.process}
                                    size="small"
                                    color={issue.process === 'Cable' ? 'primary' : 'secondary'}
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={issue.issuedQty}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {issue.issueDate}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {issue.issueTime}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={issue.status} 
                                    color="success" 
                                    size="small" 
                                  />
                                </TableCell>
                                <TableCell>
                                  <Stack direction="row" spacing={1}>
                                    <Tooltip title="View Details">
                                      <IconButton
                                        size="small"
                                        color="secondary"
                                        onClick={() => handleViewIssuedItemDetails(issue)}
                                      >
                                        <ViewIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete Item">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteIssuedItem(issue)}
                                        sx={{
                                          '&:hover': {
                                            bgcolor: 'error.light',
                                            color: 'white'
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
                      </TableContainer>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      )}

      {/* Kitting List Table */}
      {activeTab === "kitting" && (
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, pb: 0 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <StockIcon color="primary" />
                <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                  Material Kitting List
                </Typography>
                {kittingList.length > 0 && (
                  <Chip 
                    label={`${kittingList.length} items`} 
                    color="primary" 
                    size="small" 
                  />
                )}
              </Stack>
            </Box>

            <TableContainer sx={{ mt: 2 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'uppercase',
                      bgcolor: 'primary.main',
                      color: 'white',
                      fontSize: '0.75rem'
                    }}>
                      S.No
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'uppercase',
                      bgcolor: 'primary.main',
                      color: 'white',
                      fontSize: '0.75rem'
                    }}>
                      Item Details
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'uppercase',
                      bgcolor: 'primary.main',
                      color: 'white',
                      fontSize: '0.75rem'
                    }}>
                      Process
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'uppercase',
                      bgcolor: 'primary.main',
                      color: 'white',
                      fontSize: '0.75rem'
                    }}>
                      Qty/PC
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'uppercase',
                      bgcolor: 'primary.main',
                      color: 'white',
                      fontSize: '0.75rem'
                    }}>
                      Unit
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'uppercase',
                      bgcolor: 'primary.main',
                      color: 'white',
                      fontSize: '0.75rem'
                    }}>
                      Location
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'uppercase',
                      bgcolor: 'primary.main',
                      color: 'white',
                      fontSize: '0.75rem'
                    }}>
                      Required
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'uppercase',
                      bgcolor: 'primary.main',
                      color: 'white',
                      fontSize: '0.75rem'
                    }}>
                      On-Hand
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'uppercase',
                      bgcolor: 'primary.main',
                      color: 'white',
                      fontSize: '0.75rem'
                    }}>
                      Available
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'uppercase',
                      bgcolor: 'primary.main',
                      color: 'white',
                      fontSize: '0.75rem'
                    }}>
                      Balance
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'uppercase',
                      bgcolor: 'primary.main',
                      color: 'white',
                      fontSize: '0.75rem'
                    }}>
                      Issue Qty
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'uppercase',
                      bgcolor: 'primary.main',
                      color: 'white',
                      fontSize: '0.75rem'
                    }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {kittingList.length > 0 ? (
                    kittingList.map((item, index) => (
                      <TableRow 
                        key={item.sno} 
                        sx={{ 
                          '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                          '&:hover': { bgcolor: 'action.selected' },
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <TableCell>
                          <Chip 
                            label={item.sno} 
                            size="small" 
                            color="default" 
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {item.itemName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Code: {item.itemCode}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={item.process}
                            size="small"
                            color={item.process === 'Cable' ? 'primary' : 'secondary'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {item.qtyPerPc}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={item.uom} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {item.location}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {item.requiredQty}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {getStatusIcon(item.availableQty, item.requiredQty)}
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: getStockStatusColor(item.availableQty, item.requiredQty) === 'error' ? 'error.main' : 
                                       getStockStatusColor(item.availableQty, item.requiredQty) === 'warning' ? 'warning.main' : 'success.main'
                              }}
                            >
                              {item.onHandQty}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: getStockStatusColor(item.availableQty, item.requiredQty) === 'error' ? 'error.main' : 
                                       getStockStatusColor(item.availableQty, item.requiredQty) === 'warning' ? 'warning.main' : 'success.main'
                              }}
                            >
                              {item.availableQty}
                            </Typography>
                            {getStatusChip(item.availableQty, item.requiredQty)}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: item.balanceQty >= 0 ? 'success.main' : 'error.main'
                            }}
                          >
                            {item.balanceQty}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.issuedQty}
                            onChange={(e) => handleIssueQtyChange(e.target.value, index)}
                            size="small"
                            sx={{ width: '100px' }}
                            InputProps={{
                              inputProps: { min: 0, max: item.availableQty }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Delete Item">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteKittingItem(index)}
                              sx={{
                                '&:hover': {
                                  bgcolor: 'error.light',
                                  color: 'white'
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={13} align="center" sx={{ py: 6 }}>
                        <Stack alignItems="center" spacing={2}>
                          <InventoryIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                          <Typography variant="h6" color="text.secondary">
                            No kitting list generated
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Select a BOM and enter quantity to generate the kitting list
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* View Details Dialog */}
      <Dialog
        open={openViewDetailsDialog}
        onClose={() => setOpenViewDetailsDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              <ViewIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Kitting Item Details
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedKittingDetails ? `${selectedKittingDetails.itemName} (${selectedKittingDetails.itemCode})` : 'Kitting Details'}
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              startIcon={<PrintIcon />}
              onClick={() => generateKittingPDF(selectedKittingDetails)}
              sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
            >
              Download PDF
            </Button>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          {selectedKittingDetails && (
            <Grid container spacing={3}>
              {/* Company Header */}
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'primary.main', color: 'white', p: 2, textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                    REYANSH INTERNATIONAL PVT. LTD
                  </Typography>
                  <Typography variant="subtitle2">
                    Material Kitting Details Report
                  </Typography>
                  <Typography variant="caption">
                    Generated on: {new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    }).replace(/\//g, '/')}
                  </Typography>
                </Card>
              </Grid>

              {/* Item Information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <InventoryIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Item Information
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Item Code:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedKittingDetails.itemCode || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Item Name:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedKittingDetails.itemName || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Process:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedKittingDetails.process || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Unit:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedKittingDetails.unit || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Location:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedKittingDetails.location || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Serial No:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedKittingDetails.sno || 'N/A'}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>

              {/* Quantity Information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <StockIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Quantity Information
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Quantity Per PC:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {selectedKittingDetails.qtyPerPc || '0'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Required Quantity:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedKittingDetails.requiredQty || '0'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">On-Hand Quantity:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedKittingDetails.onHandQty || '0'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Available Quantity:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedKittingDetails.availableQty || '0'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Balance Quantity:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedKittingDetails.balanceQty || '0'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Issue Quantity:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedKittingDetails.issuedQty || '0'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Status:</Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {selectedKittingDetails.availableQty >= selectedKittingDetails.requiredQty ? 
                          <CheckIcon color="success" /> : 
                          <WarningIcon color="warning" />
                        }
                        <Chip 
                          label={selectedKittingDetails.availableQty >= selectedKittingDetails.requiredQty ? 'Available' : 'Shortage'} 
                          color={selectedKittingDetails.availableQty >= selectedKittingDetails.requiredQty ? 'success' : 'warning'} 
                          size="small" 
                        />
                      </Stack>
                    </Box>
                  </Stack>
                </Card>
              </Grid>

              {/* Signature Section */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <CompanyIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Process Signatures
                    </Typography>
                  </Stack>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ textAlign: 'center', border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2 }}>KITTING OPERATOR</Typography>
                        <Box sx={{ height: 40, borderBottom: '1px solid #333', mb: 1 }}></Box>
                        <Typography variant="caption">SIGNATURE</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ textAlign: 'center', border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2 }}>SUPERVISOR</Typography>
                        <Box sx={{ height: 40, borderBottom: '1px solid #333', mb: 1 }}></Box>
                        <Typography variant="caption">SIGNATURE</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpenViewDetailsDialog(false)}
            variant="outlined"
            startIcon={<CloseIcon />}
          >
            Close
          </Button>
          <Button 
            onClick={() => generateKittingPDF(selectedKittingDetails)}
            variant="contained"
            startIcon={<PrintIcon />}
            sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* Issued Item Details Dialog */}
      <Dialog
        open={openIssuedItemDetailsDialog}
        onClose={() => setOpenIssuedItemDetailsDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'success.main' }}>
              <IssueIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Issued Item Details
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedIssuedItemDetails ? `${selectedIssuedItemDetails.itemCode} - Issued on ${selectedIssuedItemDetails.issueDate}` : 'Issued Item Details'}
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              startIcon={<PrintIcon />}
              onClick={() => generateIssuedItemPDF(selectedIssuedItemDetails)}
              sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
            >
              Download PDF
            </Button>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          {selectedIssuedItemDetails && (
            <Grid container spacing={3}>
              {/* Company Header */}
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'success.main', color: 'white', p: 2, textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                    REYANSH INTERNATIONAL PVT. LTD
                  </Typography>
                  <Typography variant="subtitle2">
                    Issued Item Details Report
                  </Typography>
                  <Typography variant="caption">
                    Generated on: {new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    }).replace(/\//g, '/')}
                  </Typography>
                </Card>
              </Grid>

              {/* Item Information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <InventoryIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Item Information
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Item Code:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedIssuedItemDetails.itemCode || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Item Name:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedIssuedItemDetails.itemName || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Process:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedIssuedItemDetails.process || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">BOM ID:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedIssuedItemDetails.bomId || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Unit:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedIssuedItemDetails.unit || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Location:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedIssuedItemDetails.location || 'N/A'}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>

              {/* Issue Information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <IssueIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Issue Information
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Issued Quantity:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'success.main' }}>
                        {selectedIssuedItemDetails.issuedQty || '0'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Issue Date:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedIssuedItemDetails.issueDate || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Issue Time:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedIssuedItemDetails.issueTime || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Required Quantity:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedIssuedItemDetails.requiredQty || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Available Quantity:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedIssuedItemDetails.availableQty || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Status:</Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CheckIcon color="success" />
                        <Chip 
                          label={selectedIssuedItemDetails.status || 'Issued'} 
                          color="success" 
                          size="small" 
                        />
                      </Stack>
                    </Box>
                  </Stack>
                </Card>
              </Grid>

              {/* Signature Section */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <CompanyIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Issue Signatures
                    </Typography>
                  </Stack>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ textAlign: 'center', border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2 }}>MATERIAL ISSUED BY</Typography>
                        <Box sx={{ height: 40, borderBottom: '1px solid #333', mb: 1 }}></Box>
                        <Typography variant="caption">SIGNATURE</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ textAlign: 'center', border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2 }}>RECEIVED BY</Typography>
                        <Box sx={{ height: 40, borderBottom: '1px solid #333', mb: 1 }}></Box>
                        <Typography variant="caption">SIGNATURE</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpenIssuedItemDetailsDialog(false)}
            variant="outlined"
            startIcon={<CloseIcon />}
          >
            Close
          </Button>
          <Button 
            onClick={() => generateIssuedItemPDF(selectedIssuedItemDetails)}
            variant="contained"
            startIcon={<PrintIcon />}
            sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CompanyKittingSheet;
