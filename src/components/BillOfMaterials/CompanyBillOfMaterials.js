import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  Chip,
  Stack,
  Container,
  Avatar,
  Badge,
  Fab,
  Zoom,
  LinearProgress,
  useTheme,
  useMediaQuery,
  CircularProgress,
  TablePagination,
  TableSortLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Divider,
  FormControlLabel,
  Switch,
  Stepper,
  Step,
  StepLabel,
  Fade,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as BomIcon,
  Factory as ProductionIcon,
  Inventory as InventoryIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Engineering as ComponentIcon,
  Storage as StockIcon,
  Build as BuildIcon,
  PlayArrow as GenerateIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Visibility as ViewIcon,
  Cable as CableIcon,
  Build as MouldingIcon,
  Build as KittingIcon,
  Business as CompanyIcon,
  DateRange as DateIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Print as PrintIcon,
  InfoOutlined as InfoIcon,
  ContentCopy as QuickAddIcon,
} from "@mui/icons-material";
import sheetService from "../../services/sheetService";
import { getAllClients, getAllProductsFromClients } from "../../services/clientService";

const CompanyBillOfMaterials = () => {
  const navigate = useNavigate();
  // Theme and responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Navigation state handling
  const location = useLocation();
  const [highlightProductCode, setHighlightProductCode] = useState(null);

  // State management
  const [boms, setBoms] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBom, setSelectedBom] = useState(null);
  const [openViewDetailsDialog, setOpenViewDetailsDialog] = useState(false);
  const [selectedBomDetails, setSelectedBomDetails] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState("productCode");
  const [order, setOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState('All'); // All | Cable | Moulding
  const [validationError, setValidationError] = useState("");
  const urlAppliedOnceRef = useRef(false);
  
  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  
  // Form steps for better organization
  const steps = [
    'Header Information',
    'Product Specifications',
    'Production Planning',
    'Cable Materials',
    'Moulding Materials'
  ];

  // Data sources
  const [clients, setClients] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [fgStockItems, setFgStockItems] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);

  // Form data matching the company BOM structure
  const [formData, setFormData] = useState({
    // Header Information
    id: "", // Auto-generated BOM ID
    formatNo: "FM/RI/Dev/03",
    revNo: "00",
    revDate: new Date().toISOString().split("T")[0],
    issueDate: new Date().toISOString().split("T")[0],
    date: new Date().toISOString().split("T")[0],
    
    // Product Specifications
    productCode: "",
    productDescription: "", // HI-TECH 0.5 Sq mm 3 Pin 6 Amp Plug With Hollow pin -2100MM
    length: "",
    colour: "",
    copper: "",
    strands: "",
    coreOD: "",
    sheathOD: "",
    coreColour: "",
    
    // Production Planning
    plan: "",
    corePVC: "",
    sheathPVCInner: "",
    noOfCores: "",
    sheathPVCOuter: "",
    printing: "",
    
  // Cable Process Materials
  cableMaterials: [
    { sno: 1, rawMaterial: "", units: "", qtyPerPc: "", totalQty: "" }
  ],
    
    // Moulding Process Materials
    mouldingMaterials: [
      { sno: 1, rawMaterial: "", units: "", qtyPerPc: "", totalQty: "" }
    ],

    lastUpdated: new Date().toISOString().split("T")[0],
  });

  // Load initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Optionally auto-open create form ONLY when explicitly requested via state.openCreate
  useEffect(() => {
    if (location.state?.openCreate && location.state?.selectedProduct) {
      const product = location.state.selectedProduct;
      setFormData(prev => ({
        ...prev,
        productCode: product.productCode || prev.productCode,
        productDescription: product.productName || "",
        length: product.totalLength || "",
        colour: product.colour || (product.coreColors?.[0]) || "",
        copper: product.conductorSize || product.copper || "",
        strands: product.strandCount || product.strands || "",
        coreOD: product.coreOD || "",
        sheathOD: product.sheathOD || "",
        coreColour: product.coreColors?.join(", ") || "",
        noOfCores: product.numberOfCore || "",
        printing: product.printing || "",
        plan: 1,
      }));
      setActiveStep(0);
      setOpenDialog(true);
      showSnackbar(`Auto-filled BOM form for: ${product.productName}`, "info");
    }
  }, [location.state]);

  // When navigating from Product Management, optionally focus selected product and conditionally auto-open
  useEffect(() => {
    const product = location.state?.selectedProduct;
    if (!product) return; // Do nothing on plain reloads
    if (product.productCode) setHighlightProductCode(product.productCode.trim());
    
    // Only apply the product code to search when explicitly requested (not on refresh)
    // This prevents the search from persisting on page refresh
    if (product.productCode && location.state?.focusSelection) {
      setSearch(product.productCode.trim());
    }

    // Only auto-open details if explicitly requested
    if (location.state?.autoOpenDetails) {
      const match = boms.find(b => b.productCode === product.productCode ||
        (product.productName && b.productDescription?.toLowerCase().includes(product.productName.toLowerCase())));
      if (match) {
        setTimeout(() => handleViewDetails(match), 0);
      } else if (product.productCode) {
        showSnackbar(`No BOM found for product code: ${product.productCode}`, 'warning');
      }
    }
  }, [location.state?.selectedProduct, location.state?.autoOpenDetails, location.state?.focusSelection, boms]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch data individually to handle errors gracefully
      let clientsData = [];
      let stockData = [];
      let fgStockData = [];
      let bomData = [];
      let productsData = [];
      
      try {
        clientsData = await getAllClients();
      } catch (error) {
        console.error("✗ Error fetching clients:", error.message);
      }
      
      try {
        stockData = await sheetService.getSheetData("Stock");
      } catch (error) {
        console.error("✗ Error fetching Stock:", error.message);
      }
      
      try {
        fgStockData = await sheetService.getSheetData("FG Stock");
      } catch (error) {
        console.error("✗ Error fetching FG Stock:", error.message);
        console.error("FG Stock error details:", error);
      }
      
      try {
        bomData = await sheetService.getSheetData("Company BOM");
      } catch (error) {
        console.error("✗ Error fetching Company BOM:", error.message);
        console.error("Company BOM error details:", error);
      }
      
      try {
        productsData = await getAllProductsFromClients();
      } catch (error) {
        console.error("✗ Error fetching products:", error.message);
        console.error("Products error details:", error);
      }
      setClients(clientsData || []);
      setStockItems(stockData || []);
      setFgStockItems(fgStockData || []);
      setBoms(bomData || []);
      setAvailableProducts(productsData || []);
      
      // Debug: Log sample BOM data structure
      if (bomData && bomData.length > 0) {
        
      } else {
      }
      
      // Debug: Log sample product data structure
      if (productsData && productsData.length > 0) {

      } else {
      }
      
      showSnackbar("Data loaded successfully", "success");
    } catch (error) {
      console.error("=== BOM FETCH ERROR DEBUG ===");
      console.error("Error fetching initial data:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      showSnackbar("Failed to load data: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // Generate unique BOM ID
  const generateBOMId = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `BOM-${year}${month}-${randomNum}`;
  };

  // Handle product selection and auto-fill
  const handleProductSelection = async (selectedProduct) => {
    // Safety check for null/undefined values
    if (!selectedProduct) {
      return;
    }

    if (selectedProduct) {
      try {
        // Fetch detailed product data from the specific client's products
        const clients = await getAllClients();
        const sourceClient = clients.find(client => client.clientCode === selectedProduct.clientCode);
        if (sourceClient && sourceClient.products) {
          const detailedProduct = sourceClient.products.find(p => p.productCode === selectedProduct.productCode);
          if (detailedProduct) {
            
            // Parse core colors if it's a JSON string
            let coreColors = [];
            if (detailedProduct.coreColors) {
              try {
                coreColors = typeof detailedProduct.coreColors === 'string' 
                  ? JSON.parse(detailedProduct.coreColors) 
                  : detailedProduct.coreColors;
              } catch (e) {
                coreColors = Array.isArray(detailedProduct.coreColors) 
                  ? detailedProduct.coreColors 
                  : [];
              }
            } else {
            }
            
            // Log all field mappings
            
            // Auto-fill fields with detailed product data
            setFormData(prev => ({
              ...prev,
              productCode: detailedProduct.productCode || selectedProduct.productCode || prev.productCode,
              productDescription: detailedProduct.productName || selectedProduct.productName || prev.productDescription,
              // Auto-fill product specifications from detailed data
              length: detailedProduct.totalLength || detailedProduct.standardLength || prev.length,
              colour: detailedProduct.colour || coreColors?.[0] || detailedProduct.color || prev.colour,
              copper: detailedProduct.conductorSize || detailedProduct.copper || detailedProduct.conductorMaterial || prev.copper,
              strands: detailedProduct.strandCount || detailedProduct.strands || prev.strands,
              coreOD: detailedProduct.coreOD || detailedProduct.conductorSize || prev.coreOD,
              sheathOD: detailedProduct.sheathOD || detailedProduct.outerDiameter || prev.sheathOD,
              coreColour: coreColors?.join(", ") || detailedProduct.coreColors || prev.coreColour,
              noOfCores: detailedProduct.numberOfCore || detailedProduct.coreCount || prev.noOfCores,
              printing: detailedProduct.printing || detailedProduct.description || prev.printing,
              // Auto-fill Production Planning PVC fields
              corePVC: detailedProduct.corePVC || prev.corePVC,
              sheathPVCInner: detailedProduct.sheathInnerPVC || prev.sheathPVCInner,
              sheathPVCOuter: detailedProduct.sheathOuterPVC || prev.sheathPVCOuter,
            }));
            
            showSnackbar(`Auto-filled product details for: ${detailedProduct.productName}`, "success");
          } else {
            // Fallback to basic product data
            setFormData(prev => ({
              ...prev,
              productCode: selectedProduct.productCode || prev.productCode,
              productDescription: selectedProduct.productName || prev.productDescription,
            }));
            showSnackbar(`Basic product info loaded for: ${selectedProduct.productName}`, "info");
          }
        } else {
          // Fallback to basic product data
          setFormData(prev => ({
            ...prev,
            productCode: selectedProduct.productCode || prev.productCode,
            productDescription: selectedProduct.productName || prev.productDescription,
          }));
          showSnackbar(`Basic product info loaded for: ${selectedProduct.productName}`, "info");
        }
      } catch (error) {
        console.error("Error fetching detailed product data:", error);
        // Fallback to basic product data
        setFormData(prev => ({
          ...prev,
          productCode: selectedProduct.productCode || prev.productCode,
          productDescription: selectedProduct.productName || prev.productDescription,
        }));
        showSnackbar(`Basic product info loaded for: ${selectedProduct.productName}`, "info");
      }
    } else {
      // Clear auto-filled fields if no product selected
      setFormData(prev => ({
        ...prev,
        productDescription: "",
        length: "",
        colour: "",
        copper: "",
        strands: "",
        coreOD: "",
        sheathOD: "",
        coreColour: "",
        noOfCores: "",
        printing: "",
        corePVC: "",
        sheathPVCInner: "",
        sheathPVCOuter: "",
      }));
    }
  };

  const calculateTotalQty = (qtyPerPc, plan) => {
    const qty = parseFloat(qtyPerPc) || 0;
    const planQty = parseFloat(plan) || 0;
    return (qty * planQty).toFixed(2);
  };

  // Calculate material quantity based on formulas and product specifications
  const calculateMaterialQuantity = (materialName, formData) => {
    // Get values from form data with fallbacks
    const strands = parseFloat(formData.strands) || 0;
    const copper = parseFloat(formData.copper) || 0;
    const length = parseFloat(formData.length) || 0;
    const cores = parseFloat(formData.noOfCores) || 0;
    const coreOD = parseFloat(formData.coreOD) || 0;
    const sheathOD = parseFloat(formData.sheathOD) || 0;

    // Convert material name to lowercase for case-insensitive matching
    const materialLower = materialName.toLowerCase();

    // Copper formula: (0.703 * strands * copper * copper * cores * 1.02) * length / 100
    if (materialLower.includes('copper')) {
      const result = (0.703 * strands * copper * copper * cores * 1.02) * length / 100;
      return result.toFixed(5);
    }

    // Core PVC formula: 0.785 * (coreOD * coreOD - strands * copper * copper) * (0.162/100) * length
    if (materialLower.includes('core') && (materialLower.includes('pvc') || materialLower.includes('core pvc'))) {
      const result = 0.785 * (coreOD * coreOD - strands * copper * copper) * (0.162/100) * length;
      return result.toFixed(5);
    }

    // Base Outer Sheath PVC formula: 0.785 * (sheathOD² - coreOD² - strands × copper²) × (0.162/100) × length
    const baseOuterSheath = 0.785 * (sheathOD * sheathOD - coreOD * coreOD - strands * copper * copper) * (0.162/100) * length;
    
    // PVC 25 No. formula: outer × 70%
    if (materialLower.includes('pvc') && (materialLower.includes('25') || materialLower.includes('25no') || materialLower.includes('25 no'))) {
      const result = baseOuterSheath * 0.70;
      return result.toFixed(5);
    }
    
    // PVC 12 No. formula: outer × 30%
    if (materialLower.includes('pvc') && (materialLower.includes('12') || materialLower.includes('12no') || materialLower.includes('12 no'))) {
      const result = baseOuterSheath * 0.30;
      return result.toFixed(5);
    }
    
    // General Sheath PVC formula (if not 25 or 12 specified): use full outer calculation
    if (materialLower.includes('sheath') && (materialLower.includes('pvc') || materialLower.includes('sheathing'))) {
      return baseOuterSheath.toFixed(5);
    }

    // Return null if no formula matches
    return null;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updatedData = {
        ...prev,
        [field]: value
      };

      // If product specifications changed, recalculate material quantities
      const specsFields = ['strands', 'copper', 'length', 'noOfCores', 'coreOD', 'sheathOD'];
      if (specsFields.includes(field)) {
        // Recalculate quantities for all cable materials
        updatedData.cableMaterials = prev.cableMaterials.map(material => {
          if (material.rawMaterial) {
            const itemName = material.rawMaterial.includes(' - ') ? 
              material.rawMaterial.split(' - ')[1] : material.rawMaterial;
            const calculatedQty = calculateMaterialQuantity(itemName, updatedData);
            if (calculatedQty !== null) {
              return {
                ...material,
                qtyPerPc: calculatedQty,
                totalQty: calculateTotalQty(calculatedQty, updatedData.plan)
              };
            }
          }
          return material;
        });

        // Moulding materials: Do NOT auto-calculate (manual entry only)
        // Only recalculate totalQty if plan changed, not qtyPerPc
        updatedData.mouldingMaterials = prev.mouldingMaterials.map(material => ({
          ...material,
          totalQty: calculateTotalQty(material.qtyPerPc || 0, updatedData.plan)
        }));
      }

      // If plan quantity changed, recalculate total quantities for all materials
      if (field === 'plan') {
        updatedData.cableMaterials = prev.cableMaterials.map(material => ({
          ...material,
          totalQty: calculateTotalQty(material.qtyPerPc, value)
        }));

        updatedData.mouldingMaterials = prev.mouldingMaterials.map(material => ({
          ...material,
          totalQty: calculateTotalQty(material.qtyPerPc, value)
        }));
      }

      return updatedData;
    });
  };

  const handleMaterialChange = (process, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [process]: prev[process].map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          
          // Auto-fill units and calculate qtyPerPc from Stock sheet when raw material is selected
          if (field === 'rawMaterial' && value) {
            // Extract item name from display string (format: "ITEM001 - Item Name")
            const itemName = value.includes(' - ') ? value.split(' - ')[1] : value;
            
            const stockItem = stockItems.find(stock => 
              stock.itemName === itemName || 
              stock.ItemName === itemName ||
              stock.itemName === value || 
              stock.ItemName === value
            );
            if (stockItem) {
              updatedItem.units = stockItem.unit || stockItem.Unit || '';
              // Auto-calculate qtyPerPc based on material type and formulas
              const calculatedQty = calculateMaterialQuantity(itemName, prev);
              if (calculatedQty !== null) {
                updatedItem.qtyPerPc = calculatedQty;
                updatedItem.totalQty = calculateTotalQty(calculatedQty, prev.plan);
              }
            }
          }
          
          // Auto-calculate totalQty when qtyPerPc changes
          if (field === 'qtyPerPc') {
            updatedItem.totalQty = calculateTotalQty(value, prev.plan);
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const addMaterialRow = (process) => {
    setFormData(prev => {
      const currentMaterials = prev[process];
      const nextSno = currentMaterials.length + 1;
      const newMaterial = {
        sno: nextSno,
        rawMaterial: "",
        units: "",
        qtyPerPc: "",
        totalQty: ""
      };
      return {
        ...prev,
        [process]: [...currentMaterials, newMaterial]
      };
    });
  };

  const removeMaterialRow = (process, index) => {
    setFormData(prev => {
      const updatedMaterials = prev[process].filter((_, i) => i !== index);
      // Reassign serial numbers to maintain sequential order
      const renumberedMaterials = updatedMaterials.map((item, i) => ({
        ...item,
        sno: i + 1
      }));
      return {
        ...prev,
        [process]: renumberedMaterials
      };
    });
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.productDescription.trim()) {
      errors.push("Product description is required");
    }

    if (!formData.plan || parseFloat(formData.plan) <= 0) {
      errors.push("Plan quantity must be greater than 0");
    }

    // Get BOM category - check if editing existing BOM or creating new one
    const bomCategory = selectedBom ? (selectedBom.category || selectedBom.bomCategory) : (formData.category || formData.bomCategory);
    const isEditing = !!selectedBom;
    
    // When editing: only validate materials for the relevant category
    // When creating new: validate both (since we create paired BOMs)
    if (isEditing) {
      // Editing mode - only validate the relevant category
      if (bomCategory === 'Cable') {
        const hasCableMaterials = formData.cableMaterials && formData.cableMaterials.some(item => 
          item.rawMaterial && item.rawMaterial.trim() && item.qtyPerPc && item.qtyPerPc.trim()
        );
        
        if (!hasCableMaterials) {
          errors.push("At least one cable material is required");
        }
      } else if (bomCategory === 'Moulding') {
        const hasMouldingMaterials = formData.mouldingMaterials && formData.mouldingMaterials.some(item => 
          item.rawMaterial && item.rawMaterial.trim() && item.qtyPerPc && item.qtyPerPc.trim()
        );
        
        if (!hasMouldingMaterials) {
          errors.push("At least one moulding material is required");
        }
      }
    } else {
      // Creating new BOM - validate both (will create paired BOMs)
      const hasCableMaterials = formData.cableMaterials && formData.cableMaterials.some(item => 
        item.rawMaterial && item.rawMaterial.trim() && item.qtyPerPc && item.qtyPerPc.trim()
      );
      
      if (!hasCableMaterials) {
        errors.push("At least one cable material is required");
      }
      
      const hasMouldingMaterials = formData.mouldingMaterials && formData.mouldingMaterials.some(item => 
        item.rawMaterial && item.rawMaterial.trim() && item.qtyPerPc && item.qtyPerPc.trim()
      );
      
      if (!hasMouldingMaterials) {
        errors.push("At least one moulding material is required");
      }
    }

    return errors;
  };

  // Stepper helper functions
  const isStepAccessible = (stepIndex) => {
    const bomCategory = selectedBom ? (selectedBom.category || selectedBom.bomCategory) : null;
    
    if (stepIndex === 0) return true;
    if (stepIndex === 1) return formData.formatNo && formData.revNo && formData.revDate && formData.issueDate;
    if (stepIndex === 2) return formData.productDescription && formData.length;
    
    // When editing, only show the relevant materials step
    if (stepIndex === 3) { // Cable Materials step
      if (bomCategory === 'Moulding') return false; // Skip Cable step for Moulding BOM
      return formData.productDescription && formData.plan && formData.plan > 0;
    }
    if (stepIndex === 4) { // Moulding Materials step
      if (bomCategory === 'Cable') return false; // Skip Moulding step for Cable BOM
      return formData.productDescription && formData.plan && formData.plan > 0;
    }
    return false;
  };

  const isCurrentStepCompleted = () => {
    switch (activeStep) {
      case 0: return formData.formatNo && formData.revNo && formData.revDate && formData.issueDate;
      case 1: return formData.productDescription && formData.length;
      case 2: return formData.plan && formData.plan > 0;
      case 3: return true; // Cable materials are optional
      case 4: return true; // Moulding materials are optional
      default: return false;
    }
  };

  const handleNext = () => {
    if (isCurrentStepCompleted()) {
      const bomCategory = selectedBom ? (selectedBom.category || selectedBom.bomCategory) : null;
      setActiveStep((prevActiveStep) => {
        let nextStep = prevActiveStep + 1;
        
        // Skip irrelevant materials step when editing
        if (selectedBom) {
          if (bomCategory === 'Cable' && nextStep === 4) {
            // Skip Moulding Materials step (4) for Cable BOM - stay on Cable Materials (3)
            return prevActiveStep; // Don't advance, user can click Next again or submit
          }
          if (bomCategory === 'Moulding' && nextStep === 3) {
            // Skip Cable Materials step (3) for Moulding BOM - go directly to Moulding Materials (4)
            return 4; // Go directly to Moulding Materials
          }
        }
        
        // Don't go beyond the last step
        if (nextStep >= steps.length) {
          return prevActiveStep; // Stay on last step
        }
        
        return nextStep;
      });
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStepClick = (stepIndex) => {
    if (isStepAccessible(stepIndex)) {
      setActiveStep(stepIndex);
    }
  };

  // Check if current step is the last accessible step
  const isLastAccessibleStep = () => {
    const bomCategory = selectedBom ? (selectedBom.category || selectedBom.bomCategory) : null;
    
    if (selectedBom) {
      // When editing, the last step depends on category
      if (bomCategory === 'Cable') {
        return activeStep === 3; // Cable Materials is last for Cable BOM
      } else if (bomCategory === 'Moulding') {
        return activeStep === 4; // Moulding Materials is last for Moulding BOM
      }
    }
    
    // For new BOMs, step 4 (Moulding Materials) is the last step
    return activeStep === steps.length - 1;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    const errors = validateForm();
    if (errors.length > 0) {
      setValidationError(errors.join(", "));
      return;
    }

    try {
      setLoading(true);

      const bomData = {
        ...formData,
        cableMaterials: JSON.stringify(formData.cableMaterials), // legacy support
        mouldingMaterials: JSON.stringify(formData.mouldingMaterials), // legacy support
        lastUpdated: new Date().toISOString().split("T")[0],
      };

      if (selectedBom) {
        // Update existing BOM
        const bomIndex = boms.findIndex(bom => bom.id === selectedBom.id);
        if (bomIndex === -1) {
          showSnackbar("BOM not found in list", "error");
          return;
        }
        
        // Get the original BOM to preserve all fields
        const originalBom = boms[bomIndex];
        
        // Write Materials column based on this BOM's category
        const selCategory = selectedBom.category || selectedBom.bomCategory;
        const materialsForCategory = selCategory === 'Moulding' 
          ? formData.mouldingMaterials 
          : formData.cableMaterials;
        
        // Merge original BOM data with updated formData to preserve all fields
        const updated = { 
          ...originalBom,  // Start with original to preserve all fields
          ...bomData,      // Override with form data
          category: selCategory, 
          bomCategory: selCategory,
          Materials: JSON.stringify(materialsForCategory),
          lastUpdated: new Date().toISOString().split("T")[0],
          // Ensure ID is preserved
          id: originalBom.id || selectedBom.id
        };
        
        console.log("Updating BOM:", {
          bomIndex: bomIndex + 2,
          originalId: originalBom.id,
          category: selCategory,
          materialsCount: materialsForCategory?.length || 0
        });
        
        await sheetService.updateRow("Company BOM", bomIndex + 2, updated);
        showSnackbar("BOM updated successfully", "success");
      } else {
        // Create paired BOMs for Cable and Moulding with the same details
        const baseId = formData.id || generateBOMId();
        const cableBom = { 
          ...bomData, 
          id: `${baseId}-C`, 
          bomCategory: 'Cable', 
          category: 'Cable',
          Materials: JSON.stringify(formData.cableMaterials)
        };
        const mouldBom = { 
          ...bomData, 
          id: `${baseId}-M`, 
          bomCategory: 'Moulding', 
          category: 'Moulding',
          Materials: JSON.stringify(formData.mouldingMaterials)
        };
        await sheetService.appendRow("Company BOM", cableBom);
        await sheetService.appendRow("Company BOM", mouldBom);
        showSnackbar("BOMs created for Cable and Moulding", "success");
      }

      setOpenDialog(false);
      resetForm();
      fetchInitialData();
    } catch (error) {
      console.error("Error saving BOM:", error);
      showSnackbar("Failed to save BOM: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bom) => {
    setSelectedBom(bom);
    const bomCategory = bom.category || bom.bomCategory;
    
    // Parse materials based on category - only load the relevant materials
    let cableMaterials = [];
    let mouldingMaterials = [];
    
    if (bomCategory === 'Cable') {
      // For Cable BOM, only load cable materials
      if (bom.Materials) {
        try { 
          cableMaterials = typeof bom.Materials === 'string' ? JSON.parse(bom.Materials) : bom.Materials; 
        } catch { 
          cableMaterials = []; 
        }
      } else if (bom.cableMaterials) {
        cableMaterials = typeof bom.cableMaterials === 'string' ? JSON.parse(bom.cableMaterials) : bom.cableMaterials;
      }
      mouldingMaterials = []; // Clear moulding materials for Cable BOM
    } else if (bomCategory === 'Moulding') {
      // For Moulding BOM, only load moulding materials
      if (bom.Materials) {
        try { 
          mouldingMaterials = typeof bom.Materials === 'string' ? JSON.parse(bom.Materials) : bom.Materials; 
        } catch { 
          mouldingMaterials = []; 
        }
      } else if (bom.mouldingMaterials) {
        mouldingMaterials = typeof bom.mouldingMaterials === 'string' ? JSON.parse(bom.mouldingMaterials) : bom.mouldingMaterials;
      }
      cableMaterials = []; // Clear cable materials for Moulding BOM
    } else {
      // Fallback: try to load both if category is not clear
      if (bom.cableMaterials) {
        cableMaterials = typeof bom.cableMaterials === 'string' ? JSON.parse(bom.cableMaterials) : bom.cableMaterials;
      }
      if (bom.mouldingMaterials) {
        mouldingMaterials = typeof bom.mouldingMaterials === 'string' ? JSON.parse(bom.mouldingMaterials) : bom.mouldingMaterials;
      }
    }
    
    setFormData({
      ...bom,
      cableMaterials: cableMaterials,
      mouldingMaterials: mouldingMaterials,
    });
    setActiveStep(0);
    setOpenDialog(true);
  };

  // Navigate to Kitting with this BOM pre-selected
  const handleGoToKitting = (bom) => {
    try {
      const selection = {
        bomId: bom.id,
        productDescription: bom.productDescription,
        productCode: bom.productCode,
        plan: bom.plan,
        category: bom.category || bom.bomCategory,
      };
      localStorage.setItem('selectedBOMForKitting', JSON.stringify(selection));

      // Prefer react-router navigate if present
      if (typeof navigate === 'function') {
        navigate('/inventory/bill-of-materials/kitting-sheet');
      } else {
        window.location.href = '/inventory/bill-of-materials/kitting-sheet';
      }
    } catch (e) {
      console.error('Failed to open Kitting with BOM:', e);
      showSnackbar('Could not open Kitting. Please try again.', 'error');
    }
  };

  const handlePlanQtyUpdate = async (bom, newPlanQty) => {
    try {
      // Find the BOM index
      const bomIndex = boms.findIndex(b => b.id === bom.id);
      if (bomIndex === -1) {
        showSnackbar("BOM not found", "error");
        return false;
      }

      // Update the BOM with new plan qty
      const updatedBom = {
        ...bom,
        plan: newPlanQty
      };

      // Update in Google Sheets (row index is bomIndex + 2 because of header row and 1-based indexing)
      await sheetService.updateRow("Company BOM", bomIndex + 2, updatedBom);
      
      // Update local state
      setBoms(prevBoms => {
        const newBoms = [...prevBoms];
        newBoms[bomIndex] = updatedBom;
        return newBoms;
      });

      showSnackbar(`Plan Qty updated to ${newPlanQty} Pcs`, "success");
      return true;
    } catch (error) {
      console.error("Error updating Plan Qty:", error);
      showSnackbar("Failed to update Plan Qty", "error");
      return false;
    }
  };

  const handleDelete = async (bomId) => {
    if (window.confirm("Are you sure you want to delete this BOM?")) {
      try {
        setLoading(true);
        const bomIndex = boms.findIndex(bom => bom.id === bomId);
        if (bomIndex !== -1) {
          await sheetService.deleteRow("Company BOM", bomIndex + 2);
          showSnackbar("BOM deleted successfully", "success");
          fetchInitialData();
        }
      } catch (error) {
        console.error("Error deleting BOM:", error);
        showSnackbar("Failed to delete BOM: " + error.message, "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenDialog = () => {
    resetForm();
    setSelectedBom(null);
    setActiveStep(0);
    // Generate new ID for new BOM
    setFormData(prev => ({
      ...prev,
      id: generateBOMId()
    }));
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      id: "", // Will be generated when opening dialog
      formatNo: "FM/RI/Dev/03",
      revNo: "00",
      revDate: new Date().toISOString().split("T")[0],
      issueDate: new Date().toISOString().split("T")[0],
      date: new Date().toISOString().split("T")[0],
      productCode: "",
      productDescription: "",
      length: "",
      colour: "",
      copper: "",
      strands: "",
      coreOD: "",
      sheathOD: "",
      coreColour: "",
      plan: "",
      corePVC: "",
      sheathPVCInner: "",
      noOfCores: "",
      sheathPVCOuter: "",
      printing: "",
      cableMaterials: [
        { sno: 1, rawMaterial: "", units: "", qtyPerPc: "", totalQty: "" }
      ],
      mouldingMaterials: [
        { sno: 1, rawMaterial: "", units: "", qtyPerPc: "", totalQty: "" }
      ],
      lastUpdated: new Date().toISOString().split("T")[0],
    });
    setValidationError("");
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBom(null);
    resetForm();
  };

  // Quick Add functionality - Use full BOM form with auto-filled data
  const handleQuickAdd = (bom) => {
    // Generate completely random unique BOM ID that doesn't exist in sheet
    const generateRandomUniqueBOMId = () => {
      let newId;
      let attempts = 0;
      const maxAttempts = 100; // Prevent infinite loops
      
      do {
        // Generate completely random BOM ID
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        newId = `BOM-${year}${month}-${randomNum}`;
        attempts++;
        
        // If we've tried too many times, add a timestamp to ensure uniqueness
        if (attempts >= maxAttempts) {
          const timestamp = Date.now().toString().slice(-6);
          newId = `BOM-${year}${month}-${timestamp}`;
          break;
        }
      } while (boms.some(existingBom => existingBom.id === newId));

      return newId;
    };

    // Parse materials arrays from the original BOM
    let cableMaterials = [];
    let mouldingMaterials = [];
    
    try {
      cableMaterials = typeof bom.cableMaterials === 'string' ? 
        JSON.parse(bom.cableMaterials) : 
        (Array.isArray(bom.cableMaterials) ? bom.cableMaterials : []);
      
      mouldingMaterials = typeof bom.mouldingMaterials === 'string' ? 
        JSON.parse(bom.mouldingMaterials) : 
        (Array.isArray(bom.mouldingMaterials) ? bom.mouldingMaterials : []);
    } catch (error) {
      console.error("Error parsing materials:", error);
      cableMaterials = [];
      mouldingMaterials = [];
    }

    // Auto-calculate all material quantities based on product specifications
    const autoCalculateMaterials = (materials, formData) => {
      return materials.map((material, index) => {
        if (material.rawMaterial) {
          const itemName = material.rawMaterial.includes(' - ') ? 
            material.rawMaterial.split(' - ')[1] : material.rawMaterial;
          
          // Auto-calculate qtyPerPc based on material type and formulas
          const calculatedQty = calculateMaterialQuantity(itemName, formData);
          if (calculatedQty !== null) {
            return {
              ...material,
              sno: index + 1,
              qtyPerPc: calculatedQty,
              totalQty: calculateTotalQty(calculatedQty, formData.plan || 1)
            };
          }
        }
        return {
          ...material,
          sno: index + 1,
          totalQty: calculateTotalQty(material.qtyPerPc || 0, formData.plan || 1)
        };
      });
    };

    // Create comprehensive form data with all fields auto-fetched
    const autoFilledFormData = {
      // Document Information
      originalId: bom.id, // Store original ID for reference
      id: generateRandomUniqueBOMId(), // Generate completely random unique ID
      formatNo: bom.formatNo || "FM/RI/Dev/03",
      revNo: "01", // Reset to new revision
      revDate: new Date().toISOString().split("T")[0], // Update revision date
      issueDate: new Date().toISOString().split("T")[0], // Update issue date
      date: new Date().toISOString().split("T")[0], // Update creation date
      
      // Product Information - Auto-fetched from original
      productCode: bom.productCode || "",
      productDescription: bom.productDescription || "",
      
      // Product Specifications - Auto-fetched from original
      length: bom.length || "",
      colour: bom.colour || "",
      copper: bom.copper || "",
      strands: bom.strands || "",
      coreOD: bom.coreOD || "",
      sheathOD: bom.sheathOD || "",
      coreColour: bom.coreColour || "",
      noOfCores: bom.noOfCores || "",
      corePVC: bom.corePVC || "",
      sheathPVCInner: bom.sheathPVCInner || "",
      sheathPVCOuter: bom.sheathPVCOuter || "",
      printing: bom.printing || "",
      
      // Production Planning - Auto-fetched from original
      plan: bom.plan || 1,
      
      // Materials - Auto-calculated with quantities
      cableMaterials: autoCalculateMaterials(cableMaterials, {
        strands: bom.strands || 0,
        copper: bom.copper || 0,
        length: bom.length || 0,
        noOfCores: bom.noOfCores || 0,
        coreOD: bom.coreOD || 0,
        sheathOD: bom.sheathOD || 0,
        plan: bom.plan || 1
      }),
      
      // Moulding materials: No auto-calculation, only set totalQty from existing qtyPerPc
      mouldingMaterials: mouldingMaterials.map((material, index) => ({
        ...material,
        sno: index + 1,
        totalQty: calculateTotalQty(material.qtyPerPc || 0, bom.plan || 1)
      })),
      
      // Metadata
      lastUpdated: new Date().toISOString().split("T")[0],
    };
    // Set the form data and open the dialog for review/edit before saving
    setFormData(autoFilledFormData);
    setSelectedBom(null); // Important: null means it's a NEW BOM, not editing existing
    setActiveStep(0); // Start from first step
    setOpenDialog(true); // Open the dialog
    
    showSnackbar(`Quick Add: Review and modify the auto-filled BOM before saving (New ID: ${autoFilledFormData.id})`, "info");
  };

  const handleViewDetails = (bom) => {
    
    // Parse JSON strings if they exist
    let cableMaterials = [];
    let mouldingMaterials = [];
    
    try {
      if (typeof bom.cableMaterials === 'string') {
        cableMaterials = JSON.parse(bom.cableMaterials);
      } else if (Array.isArray(bom.cableMaterials)) {
        cableMaterials = bom.cableMaterials;
      } else if (Array.isArray(bom.rawMaterials)) {
        cableMaterials = bom.rawMaterials;
      } else if (Array.isArray(bom.materials)) {
        cableMaterials = bom.materials;
      }
    } catch (error) {
      console.error("Error parsing cableMaterials:", error);
      cableMaterials = [];
    }
    
    try {
      if (typeof bom.mouldingMaterials === 'string') {
        mouldingMaterials = JSON.parse(bom.mouldingMaterials);
      } else if (Array.isArray(bom.mouldingMaterials)) {
        mouldingMaterials = bom.mouldingMaterials;
      } else if (Array.isArray(bom.moulding)) {
        mouldingMaterials = bom.moulding;
      }
    } catch (error) {
      console.error("Error parsing mouldingMaterials:", error);
      mouldingMaterials = [];
    }
    
    // Ensure we have a valid BOM object and initialize arrays if they don't exist
    const bomWithArrays = {
      ...bom,
      cableMaterials: cableMaterials,
      mouldingMaterials: mouldingMaterials
    };
    setSelectedBomDetails(bomWithArrays);
    setOpenViewDetailsDialog(true);
  };

  const generateBOMPDF = (bom) => {
    const companyName = "REYANSH INTERNATIONAL PVT. LTD";
    const currentDate = new Date().toLocaleDateString('en-GB');

    const bomWithArrays = {
      ...bom,
      cableMaterials: Array.isArray(bom.cableMaterials) ? bom.cableMaterials : [],
      mouldingMaterials: Array.isArray(bom.mouldingMaterials) ? bom.mouldingMaterials : []
    };

    const cableRows = bomWithArrays.cableMaterials
      .map((m, i) => `
        <tr class="even:bg-slate-50">
          <td class="p-2 text-center border border-slate-300">${i + 1}</td>
          <td class="p-2 border border-slate-300">${m?.process || m?.rawMaterial || 'Cable Production'}</td>
          <td class="p-2 border border-slate-300">${m?.cableMaterial || m?.itemName || m?.materialType || m?.rawMaterial || 'N/A'}</td>
          <td class="p-2 text-center border border-slate-300">${m?.units || 'Mtr'}</td>
          <td class="p-2 text-center border border-slate-300">${m?.qtyPerPc || m?.quantityPerPiece || '1'}</td>
          <td class="p-2 text-center border border-slate-300">${m?.totalQty || m?.totalQuantity || bomWithArrays.length || 'N/A'}</td>
          <td class="p-2 text-center border border-slate-300"></td>
          <td class="p-2 text-center border border-slate-300"></td>
        </tr>
      `)
      .join('');

    const mouldRows = bomWithArrays.mouldingMaterials
      .map((m, i) => `
        <tr class="even:bg-slate-50">
          <td class="p-2 text-center border border-slate-300">${i + 1}</td>
          <td class="p-2 border border-slate-300">${m?.process || m?.itemName || m?.materialType || 'Moulding'}</td>
          <td class="p-2 border border-slate-300">${m?.materialType || m?.itemName || m?.rawMaterial || 'N/A'}</td>
          <td class="p-2 text-center border border-slate-300">${m?.units || 'Pcs'}</td>
          <td class="p-2 text-center border border-slate-300">${m?.qtyPerPc || m?.quantityPerPiece || '1'}</td>
          <td class="p-2 text-center border border-slate-300">${m?.totalQty || m?.totalQuantity || bomWithArrays.plan || 'N/A'}</td>
          <td class="p-2 text-center border border-slate-300"></td>
          <td class="p-2 text-center border border-slate-300"></td>
        </tr>
      `)
      .join('');

    const htmlContent = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Bill of Material - ${bomWithArrays.productDescription || 'N/A'}</title>
          <style>
            @page { size: A4 portrait; margin: 1in; }
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, "Apple Color Emoji", "Segoe UI Emoji"; color: #0f172a; }
            .container { max-width: 794px; margin: 0 auto; }
            .mb-6 { margin-bottom: 1.5rem; }
            .p-6 { padding: 1.5rem; }
            .p-4 { padding: 1rem; }
            .card { border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 2px rgb(0 0 0 / 0.05); }
            .title { text-align: center; }
            .title h1 { font-size: 20px; font-weight: 800; letter-spacing: .02em; text-transform: uppercase; }
            .title h2 { font-size: 16px; font-weight: 600; }
            .title p { font-size: 12px; color: #475569; }
            .grid { display: grid; gap: 1.5rem; }
            .grid-2 { grid-template-columns: 1fr 1fr; }
            @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }
            .row { display: flex; justify-content: space-between; font-size: 12px; padding: 2px 0; }
            .row .k { color: #475569; }
            .row .v { font-weight: 600; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            thead th { background: #1e3a8a; color: #fff; padding: 8px; border: 1px solid #1b3a7a; }
            tbody td { padding: 8px; border: 1px solid #cbd5e1; }
            tbody tr:nth-child(even) { background: #f8fafc; }
            .sign-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
            @media (max-width: 768px) { .sign-grid { grid-template-columns: repeat(2, 1fr); } }
            .sign { text-align: center; border: 2px solid #e2e8f0; border-radius: 12px; padding: 12px; background: #f8fafc; }
            .sign .label { font-size: 12px; font-weight: 700; color: #1e3a8a; margin-bottom: 8px; }
            .sign .line { height: 40px; border-bottom: 2px solid #64748b; margin-bottom: 6px; }
            .sign .hint { font-size: 10px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container p-6">
            <header class="title mb-6">
              <h1>${companyName}</h1>
              <h2>BILL OF MATERIAL</h2>
              <p>Generated on: ${currentDate}</p>
            </header>

            <section class="grid grid-2 mb-6">
              <div class="card p-4">
                <h3 class="mb-3" style="font-size:13px;font-weight:700;">Document Information</h3>
                <div>
                  <div class="row"><span class="k">Format No:</span><span class="v">FM/B/Dev/03</span></div>
                  <div class="row"><span class="k">Rev No:</span><span class="v">00</span></div>
                  <div class="row"><span class="k">Product Code:</span><span class="v">${bomWithArrays.productCode || 'N/A'}</span></div>
                  <div class="row"><span class="k">Plan:</span><span class="v">${bomWithArrays.plan || 'N/A'}</span></div>
                  <div class="row"><span class="k">Rev Date:</span><span class="v">${currentDate}</span></div>
                  <div class="row"><span class="k">Issue Date:</span><span class="v">${currentDate}</span></div>
                  <div class="row"><span class="k">Date:</span><span class="v">${currentDate}</span></div>
                </div>
              </div>
              <div class="card p-4">
                <h3 class="mb-3" style="font-size:13px;font-weight:700;">Product Specifications</h3>
                <div>
                  <div class="row"><span class="k">Length (Mtr.):</span><span class="v">${bomWithArrays.length || bomWithArrays.totalLength || 'N/A'}</span></div>
                  <div class="row"><span class="k">Colour:</span><span class="v">${bomWithArrays.colour || bomWithArrays.coreColour || 'N/A'}</span></div>
                  <div class="row"><span class="k">Copper Gauge:</span><span class="v">${bomWithArrays.copper || 'N/A'}</span></div>
                  <div class="row"><span class="k">Number of Strands:</span><span class="v">${bomWithArrays.strands || 'N/A'}</span></div>
                  <div class="row"><span class="k">Core OD:</span><span class="v">${bomWithArrays.coreOD || 'N/A'}</span></div>
                  <div class="row"><span class="k">Sheath OD:</span><span class="v">${bomWithArrays.sheathOD || 'N/A'}</span></div>
                </div>
              </div>
            </section>

            <section class="card p-4 mb-6">
              <h3 class="mb-3" style="font-size:13px;font-weight:700;">Additional Specifications</h3>
              <div class="grid grid-2">
                <div>
                  <div class="row"><span class="k">Core PVC:</span><span class="v">${bomWithArrays.corePVC || 'N/A'}</span></div>
                  <div class="row"><span class="k">Sheath PVC Inner:</span><span class="v">${bomWithArrays.sheathPVCInner || 'N/A'}</span></div>
                  <div class="row"><span class="k">No. of Cores:</span><span class="v">${bomWithArrays.numberOfCores || bomWithArrays.noOfCores || 'N/A'}</span></div>
                </div>
                <div>
                  <div class="row"><span class="k">Red, Black:</span><span class="v">${bomWithArrays.redBlack || 'N/A'}</span></div>
                  <div class="row"><span class="k">Sheath PVC Outer:</span><span class="v">${bomWithArrays.sheathPVCOuter || 'N/A'}</span></div>
                  <div class="row"><span class="k">Printing:</span><span class="v">${bomWithArrays.printing || 'N/A'}</span></div>
                </div>
              </div>
            </section>

            <section class="card p-4 mb-6">
              <h3 class="mb-3" style="font-size:13px;font-weight:700;">Cable Materials</h3>
              <table>
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Process</th>
                    <th>Material Type</th>
                    <th>Units</th>
                    <th>Qty/Pc</th>
                    <th>Total Qty</th>
                  </tr>
                </thead>
                <tbody>${cableRows}</tbody>
              </table>
            </section>

            <section class="card p-4 mb-6">
              <h3 class="mb-3" style="font-size:13px;font-weight:700;">Moulding Materials</h3>
              <table>
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Process</th>
                    <th>Material Type</th>
                    <th>Units</th>
                    <th>Qty/Pc</th>
                    <th>Total Qty</th>
                  </tr>
                </thead>
                <tbody>${mouldRows}</tbody>
              </table>
            </section>

          </div>
        </body>
      </html>
    `;

    // Use hidden iframe to avoid popup blockers
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(htmlContent);
    doc.close();
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  };

  // Filter and sort BOMs
  const filteredBOMs = boms
    .filter((bom) => {
      const q = (search || "").toString().trim().toLowerCase();
      const matchesQuery =
        q === "" ||
        bom.productDescription?.toLowerCase().includes(q) ||
        bom.formatNo?.toLowerCase().includes(q) ||
        bom.productCode?.toLowerCase().includes(q) ||
        bom.productName?.toLowerCase().includes(q) ||
        bom.product?.toLowerCase?.().includes(q);
      const categoryValue = bom.category || bom.bomCategory;
      const matchesCategory =
        categoryFilter === 'All' ||
        (categoryValue === categoryFilter);
      // Only use highlight for row styling, not to filter results
      return matchesQuery && matchesCategory;
    })
    .sort((a, b) => {
      if (order === "asc") {
        return a[orderBy] > b[orderBy] ? 1 : -1;
      } else {
        return a[orderBy] < b[orderBy] ? 1 : -1;
      }
    });

  const paginatedBOMs = filteredBOMs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Ensure filtered results are visible from the first page when search changes
  useEffect(() => {
    setPage(0);
  }, [search]);

  // Track if this is a fresh mount (page refresh) vs navigation
  const isInitialMount = useRef(true);
  const hasAppliedNavigation = useRef(false);

  // Reset search and highlight on component mount (page refresh)
  useEffect(() => {
    // Always clear search on initial mount (page refresh)
    setHighlightProductCode(null);
    setSearch("");
    urlAppliedOnceRef.current = false; // Reset the ref on page load
    hasAppliedNavigation.current = false; // Reset navigation flag
    
    // Mark that initial mount is complete
    isInitialMount.current = false;
  }, []); // Run only once on mount

  // Read product selection from navigation state or query
  useEffect(() => {
    try {
      // Skip if this is the initial mount - we want clean state on refresh
      if (isInitialMount.current) {
        return;
      }

      // Handle navigation state (from Product Management or FG Stock Sheet)
      if (location?.state?.selectedProduct && !hasAppliedNavigation.current) {
        const p = location.state.selectedProduct;
        if (p?.productCode) {
          setHighlightProductCode(p.productCode?.trim?.() ?? p.productCode);
          // Only set search on initial navigation when focusSelection flag is present
          if (location.state?.focusSelection) {
            setSearch(p.productCode?.trim?.() ?? p.productCode);
          }
          hasAppliedNavigation.current = true; // Mark as applied
        } else if (p?.name) {
          // Leave input empty for name-only context
          hasAppliedNavigation.current = true;
        }
        
        // Clear navigation state to prevent reapplication on refresh
        window.history.replaceState({}, document.title);
        return;
      }

      // Handle URL query parameters
      const params = new URLSearchParams(window.location.search);
      const code = params.get('productCode');
      if (code) {
        setHighlightProductCode(code.trim());
        // Query param-driven focus only when present
        setSearch(code.trim());
        // After applying once, strip query so refresh shows default list
        if (!urlAppliedOnceRef.current) {
          urlAppliedOnceRef.current = true;
          navigate('.', { replace: true });
        }
      }
    } catch (e) {
      console.warn('BOM auto-focus failed:', e);
    }
  }, [location, navigate]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // Inline editor component for Plan Qty
  const PlanQtyEditor = ({ bom, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(bom.plan || '');
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
      setValue(bom.plan || '');
    }, [bom.plan]);

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditing]);

    const handleSave = async () => {
      if (value === bom.plan) {
        setIsEditing(false);
        return;
      }

      setLoading(true);
      const success = await onUpdate(bom, value);
      setLoading(false);
      
      if (success) {
        setIsEditing(false);
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        setValue(bom.plan || '');
        setIsEditing(false);
      }
    };

    if (isEditing) {
      return (
        <TextField
          inputRef={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyPress}
          size="small"
          type="number"
          disabled={loading}
          sx={{ width: '100px' }}
          InputProps={{
            endAdornment: loading ? <CircularProgress size={16} /> : null,
          }}
        />
      );
    }

    return (
      <Chip 
        label={`${bom.plan} Pcs`} 
        color="primary" 
        size="small"
        onClick={() => setIsEditing(true)}
        sx={{ 
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'primary.dark',
          }
        }}
      />
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56 }}>
          <BomIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #1e3a8a, #4c6cb7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Company Bill of Materials
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Cable & Moulding Process BOM Management
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

      {/* Search and Actions */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search BOMs"
                value={search}
                onChange={(e) => setSearch(e.target.value?.trimStart?.() ?? e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                }}
              />
            </Grid>
            {/* New: Quick select by Product (auto-filters and highlights) */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={(boms || [])
                  .filter(b => b?.productCode)
                  .map(b => ({
                    label: `${b.productCode} — ${b.productDescription || ''}`.trim(),
                    productCode: b.productCode
                  }))
                  .filter((opt, idx, arr) => arr.findIndex(o => o.productCode === opt.productCode) === idx)
                }
                // Auto-select the product when navigated from Product Management
                value={(boms || [])
                  .filter(b => b?.productCode)
                  .map(b => ({
                    label: `${b.productCode} — ${b.productDescription || ''}`.trim(),
                    productCode: b.productCode
                  }))
                  .find(o => o.productCode === highlightProductCode) || null}
                onChange={(e, option) => {
                  if (option?.productCode) {
                    setHighlightProductCode(option.productCode);
                    setSearch(option.productCode.trim());
                  }
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Select Product" 
                    placeholder="Type product code or name"
                    sx={{
                      '& .MuiInputBase-input': {
                        minWidth: '200px', // Minimum width for complete product display
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
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchInitialData}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button
                  variant="text"
                  onClick={() => {
                    setSearch("");
                    setHighlightProductCode(null);
                    navigate('.', { replace: true });
                  }}
                >
                  Clear
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenDialog}
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(45deg, #1e3a8a, #4c6cb7)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #001a5c, #1e3a8a)',
                    }
                  }}
                >
                  Create BOM
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* BOM List */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          {/* Category Filter */}
          <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Filter:</Typography>
            <Chip 
              label="All" 
              color={categoryFilter === 'All' ? 'primary' : 'default'}
              onClick={() => setCategoryFilter('All')}
              size="small"
              variant={categoryFilter === 'All' ? 'filled' : 'outlined'}
            />
            <Chip 
              label="Cable" 
              color={categoryFilter === 'Cable' ? 'primary' : 'default'}
              onClick={() => setCategoryFilter('Cable')}
              size="small"
              variant={categoryFilter === 'Cable' ? 'filled' : 'outlined'}
            />
            <Chip 
              label="Moulding" 
              color={categoryFilter === 'Moulding' ? 'primary' : 'default'}
              onClick={() => setCategoryFilter('Moulding')}
              size="small"
              variant={categoryFilter === 'Moulding' ? 'filled' : 'outlined'}
            />
          </Box>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {[
                    { id: "id", label: "BOM ID" },
                    { id: "bomCategory", label: "Category" },
                    { id: "formatNo", label: "Format No" },
                    { id: "productCode", label: "Product Code" },
                    { id: "productDescription", label: "Product Description" },
                    { id: "plan", label: "Plan Qty" },
                    { id: "date", label: "Date" },
                    { id: "revNo", label: "Rev No" },
                    { id: "actions", label: "Actions" },
                  ].map((col) => (
                    <TableCell
                      key={col.id}
                      sx={{ 
                        fontWeight: 'bold', 
                        textTransform: 'uppercase',
                        bgcolor: 'primary.main',
                        color: 'white',
                        fontSize: '0.75rem'
                      }}
                      sortDirection={orderBy === col.id ? order : false}
                    >
                      {col.id !== "actions" ? (
                        <TableSortLabel
                          active={orderBy === col.id}
                          direction={orderBy === col.id ? order : "asc"}
                          onClick={() => handleRequestSort(col.id)}
                          sx={{ color: 'white !important' }}
                        >
                          {col.label}
                        </TableSortLabel>
                      ) : (
                        col.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedBOMs.length > 0 ? (
                  paginatedBOMs.map((bom, index) => (
                    <TableRow 
                      key={index} 
                      sx={{ 
                        '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                        '&:hover': { bgcolor: 'action.selected' },
                        transition: 'background-color 0.2s',
                        ...(highlightProductCode && bom.productCode === highlightProductCode ? {
                          boxShadow: 'inset 0 0 0 2px #ff9800'
                        } : {})
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
                          {bom.id || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={bom.category || bom.bomCategory || '—'} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {bom.formatNo}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          {bom.productCode || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {bom.productDescription}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Rev: {bom.revNo} • Issue: {bom.issueDate}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <PlanQtyEditor 
                          bom={bom} 
                          onUpdate={handlePlanQtyUpdate}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(bom.date).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={bom.revNo} 
                          color="default" 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => handleViewDetails(bom)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit BOM">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEdit(bom)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Quick Add New BOM">
                            <IconButton
                              size="small"
                              onClick={() => handleQuickAdd(bom)}
                              color="warning"
                            >
                              <QuickAddIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Kitting (Auto-select this BOM)">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleGoToKitting(bom)}
                            >
                              <KittingIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete BOM">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(bom.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Stack alignItems="center" spacing={2}>
                        <BomIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                        <Typography variant="h6" color="text.secondary">
                          No BOMs found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Create your first Bill of Material to get started
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredBOMs.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ borderTop: 1, borderColor: 'divider' }}
          />
        </CardContent>
      </Card>

      {/* Enhanced BOM Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="xl" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(30, 58, 138, 0.2)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
            maxHeight: '95vh',
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #1e3a8a, #4c6cb7, #f59e0b)',
              zIndex: 2
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(76, 108, 183, 0.05) 100%)',
          color: '#2c3e50',
          fontWeight: 700,
          fontSize: '1.8rem',
          py: 3,
          px: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          borderBottom: '1px solid rgba(30, 58, 138, 0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #1e3a8a 0%, #4c6cb7 100%)',
                boxShadow: '0 8px 20px rgba(30, 58, 138, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BomIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#2c3e50', mb: 0.5 }}>
                {selectedBom ? 'Edit Bill of Material' : formData.originalId ? 'Quick Add - New Bill of Material' : 'Create New Bill of Material'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                {selectedBom ? 'Update BOM specifications' : formData.originalId ? 'Auto-filled from BOM ' + formData.originalId + ' - Edit any details as needed' : 'Create comprehensive BOM entry'}
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={handleCloseDialog}
            sx={{ 
              color: '#64748b',
              '&:hover': { 
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444'
              }
            }}
          >
            <CancelIcon sx={{ fontSize: 28 }} />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ 
          p: 0, 
          overflow: 'auto',
          maxHeight: '70vh',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#a8a8a8',
          }
        }}>
          {validationError && (
            <Alert 
              severity="error" 
              sx={{ 
                m: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                border: '1px solid #f44336',
                '& .MuiAlert-icon': { color: '#d32f2f' }
              }}
            >
              {validationError}
            </Alert>
          )}
          
          {/* Enhanced Stepper */}
          <Box sx={{ 
            px: 4, 
            pt: 3, 
            pb: 2,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%)',
            borderBottom: '1px solid rgba(30, 58, 138, 0.1)',
            position: 'relative'
          }}>
            <Stepper 
              activeStep={activeStep} 
              alternativeLabel
              sx={{
                '& .MuiStepConnector-root': {
                  top: 22,
                  left: 'calc(-50% + 16px)',
                  right: 'calc(50% + 16px)',
                },
                  '& .MuiStepConnector-active': {
                    '& .MuiStepConnector-line': {
                      background: 'linear-gradient(90deg, #1e3a8a, #4c6cb7)',
                      boxShadow: '0 2px 8px rgba(30, 58, 138, 0.3)'
                    },
                  },
                '& .MuiStepConnector-completed': {
                  '& .MuiStepConnector-line': {
                    background: 'linear-gradient(90deg, #10b981, #059669)',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  },
                },
                '& .MuiStepConnector-line': {
                  height: 3,
                  border: 0,
                  borderRadius: 2,
                  transition: 'all 0.3s ease'
                }
              }}
            >
              {steps.map((label, index) => {
                // Hide irrelevant materials step when editing
                const bomCategory = selectedBom ? (selectedBom.category || selectedBom.bomCategory) : null;
                if (selectedBom) {
                  if (bomCategory === 'Cable' && index === 4) return null; // Hide Moulding step for Cable BOM
                  if (bomCategory === 'Moulding' && index === 3) return null; // Hide Cable step for Moulding BOM
                }
                
                return (
                <Step key={label}>
                  <Tooltip
                    title={
                      !isStepAccessible(index) && selectedBom === null 
                        ? `Complete step ${index + 1} first to access this step`
                        : `Go to ${label}`
                    }
                    placement="top"
                    arrow
                  >
                    <StepLabel 
                      onClick={() => handleStepClick(index)}
                      StepIconComponent={({ active, completed }) => {
                        const isAccessible = isStepAccessible(index);
                        return (
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: completed 
                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                : active 
                                ? 'linear-gradient(135deg, #1e3a8a 0%, #4c6cb7 100%)'
                                : isAccessible
                                ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%)'
                                : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                              boxShadow: completed || active 
                                ? '0 6px 20px rgba(30, 58, 138, 0.3)' 
                                : isAccessible
                                ? '0 2px 8px rgba(0, 0, 0, 0.1)'
                                : '0 1px 4px rgba(0, 0, 0, 0.05)',
                              color: completed || active ? 'white' : isAccessible ? '#64748b' : '#94a3b8',
                              fontSize: '1.2rem',
                              fontWeight: 700,
                              transition: 'all 0.3s ease',
                              transform: active ? 'scale(1.1)' : 'scale(1)',
                              border: '3px solid',
                              borderColor: completed 
                                ? '#10b981' 
                                : active 
                                ? '#1e3a8a' 
                                : isAccessible
                                ? '#e2e8f0'
                                : '#f1f5f9',
                              cursor: isAccessible ? 'pointer' : 'not-allowed',
                              opacity: isAccessible ? 1 : 0.6,
                              '&:hover': isAccessible ? {
                                transform: 'scale(1.15)',
                                boxShadow: '0 8px 25px rgba(30, 58, 138, 0.4)'
                              } : {}
                            }}
                          >
                            {completed ? (
                              <CheckIcon sx={{ fontSize: 20 }} />
                            ) : (
                              index + 1
                            )}
                          </Box>
                        );
                      }}
                      sx={{
                        cursor: isStepAccessible(index) ? 'pointer' : 'not-allowed',
                        '& .MuiStepLabel-label': {
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: activeStep === index ? '#1e3a8a' : activeStep > index ? '#10b981' : isStepAccessible(index) ? '#64748b' : '#94a3b8',
                          mt: 1,
                          transition: 'all 0.3s ease',
                          cursor: isStepAccessible(index) ? 'pointer' : 'not-allowed',
                          opacity: isStepAccessible(index) ? 1 : 0.6,
                          '&:hover': isStepAccessible(index) ? {
                            color: activeStep === index ? '#1e3a8a' : activeStep > index ? '#10b981' : '#1e3a8a',
                            fontWeight: 700
                          } : {}
                        },
                        '& .MuiStepLabel-active': {
                          '& .MuiStepLabel-label': {
                            color: '#1e3a8a !important',
                            fontWeight: 700
                          }
                        },
                        '& .MuiStepLabel-completed': {
                          '& .MuiStepLabel-label': {
                            color: '#10b981 !important',
                            fontWeight: 600
                          }
                        }
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Tooltip>
                </Step>
                );
              })}
            </Stepper>
            
            {/* Progress indicator */}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: '#374151', fontWeight: 600 }}>
                {(() => {
                  const bomCategory = selectedBom ? (selectedBom.category || selectedBom.bomCategory) : null;
                  let totalSteps = steps.length;
                  if (selectedBom && bomCategory) {
                    totalSteps = steps.length - 1; // Subtract 1 for hidden step
                  }
                  const progress = ((activeStep + 1) / totalSteps) * 100;
                  return `Step ${activeStep + 1} of ${totalSteps}`;
                })()}
              </Typography>
              <Box sx={{ flexGrow: 1, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${(() => {
                      const bomCategory = selectedBom ? (selectedBom.category || selectedBom.bomCategory) : null;
                      const totalSteps = selectedBom && bomCategory ? steps.length - 1 : steps.length;
                      return ((activeStep + 1) / totalSteps) * 100;
                    })()}%`,
                    background: 'linear-gradient(90deg, #1e3a8a, #4c6cb7)',
                    borderRadius: 2,
                    transition: 'width 0.3s ease'
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#1e3a8a', fontWeight: 700 }}>
                {(() => {
                  const bomCategory = selectedBom ? (selectedBom.category || selectedBom.bomCategory) : null;
                  const totalSteps = selectedBom && bomCategory ? steps.length - 1 : steps.length;
                  return Math.round(((activeStep + 1) / totalSteps) * 100);
                })()}%
              </Typography>
            </Box>
          </Box>

          {/* Enhanced Form Content */}
          <Box sx={{ 
            p: 4, 
            maxHeight: '60vh', 
            overflow: 'auto',
            background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.6) 100%)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                radial-gradient(circle at 20% 80%, rgba(30, 58, 138, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(76, 108, 183, 0.05) 0%, transparent 50%)
              `,
              pointerEvents: 'none'
            }
          }}>
            <Box component="form" onSubmit={handleSubmit} sx={{ position: 'relative', zIndex: 1 }}>
              {/* Step 0: Header Information */}
              {activeStep === 0 && (
                <Fade in timeout={500}>
                  <Box>
                    {/* Step Header */}
                    <Box sx={{ 
                      mb: 4,
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(76, 108, 183, 0.05) 100%)',
                      borderRadius: 3,
                      border: '1px solid rgba(30, 58, 138, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #1e3a8a 0%, #4c6cb7 100%)',
                          boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)'
                        }}
                      >
                        <CompanyIcon sx={{ fontSize: 28, color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ 
                          color: '#2c3e50', 
                          fontWeight: 700, 
                          mb: 0.5
                        }}>
                          Header Information
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                          Company and document details
                        </Typography>
                      </Box>
                    </Box>

                    {/* Company Header */}
                    <Card variant="outlined" sx={{ mb: 3, bgcolor: 'primary.50' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <CompanyIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    REYANSH INTERNATIONAL PVT. LTD
                  </Typography>
                </Stack>
                <Typography variant="h5" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2 }}>
                  BILL OF MATERIAL
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="BOM ID"
                      value={formData.id}
                      variant="standard"
                      size="small"
                      InputProps={{
                        readOnly: true,
                        style: { 
                          fontWeight: 'bold',
                          color: '#1e3a8a'
                        }
                      }}
                      helperText="Auto-generated unique identifier"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="FORMAT No"
                      value={formData.formatNo}
                      onChange={(e) => handleInputChange('formatNo', e.target.value)}
                      variant="standard"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="REV No"
                      value={formData.revNo}
                      onChange={(e) => handleInputChange('revNo', e.target.value)}
                      variant="standard"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="REV DATE"
                      type="date"
                      value={formData.revDate}
                      onChange={(e) => handleInputChange('revDate', e.target.value)}
                      variant="standard"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="ISSUE DATE"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => handleInputChange('issueDate', e.target.value)}
                      variant="standard"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Quick Add Indicator */}
            {formData.originalId && (
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 3,
                  background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(245, 124, 0, 0.05) 100%)',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  '& .MuiAlert-icon': { color: '#ff9800' }
                }}
                icon={<QuickAddIcon />}
              >
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ff9800', mb: 1 }}>
                  🚀 Quick Add Mode Active
                </Typography>
                <Typography variant="body2">
                  This BOM was auto-filled from <strong>BOM {formData.originalId}</strong>. 
                  All fields, materials, and quantities have been pre-populated. 
                  You can edit any details before saving.
                </Typography>
              </Alert>
            )}
                  </Box>
                </Fade>
              )}

              {/* Step 1: Product Specifications */}
              {activeStep === 1 && (
                <Fade in timeout={500}>
                  <Box>
                    {/* Step Header */}
                    <Box sx={{ 
                      mb: 4,
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(76, 108, 183, 0.05) 100%)',
                      borderRadius: 3,
                      border: '1px solid rgba(30, 58, 138, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #1e3a8a 0%, #4c6cb7 100%)',
                          boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)'
                        }}
                      >
                        <DescriptionIcon sx={{ fontSize: 28, color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ 
                          color: '#2c3e50', 
                          fontWeight: 700, 
                          mb: 0.5
                        }}>
                          Product Specifications
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                          Detailed product specifications and dimensions
                        </Typography>
                      </Box>
                    </Box>

                    {/* Product Specifications Only */}
                    <Card variant="outlined" sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                          Product Specifications
                        </Typography>
                        
                        {/* Product Selection Dropdown */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12}>
                            <Autocomplete
                              fullWidth
                              options={availableProducts && Array.isArray(availableProducts) ? availableProducts : []}
                              getOptionLabel={(option) => 
                                option && option.productCode && option.productName ? `${option.productCode} - ${option.productName}` : ''
                              }
                              value={availableProducts && Array.isArray(availableProducts) ? availableProducts.find(p => p.productName === formData.productDescription) || null : null}
                              onChange={(event, newValue) => handleProductSelection(newValue)}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Select Product from Clients"
                                  placeholder="Search and select a product to auto-fill details"
                                  helperText="Select a product to auto-fill specifications, or enter manually"
                                  sx={{
                                    '& .MuiInputBase-input': {
                                      minWidth: '200px', // Minimum width for complete product display
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
                                <Box component="li" {...props}>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                      {option.productCode}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {option.productName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                      Client: {option.clientName}
                                    </Typography>
                                  </Box>
                                </Box>
                              )}
                              noOptionsText="No products found"
                              clearOnEscape
                              selectOnFocus
                            />
                          </Grid>
                        </Grid>

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Product Description"
                              value={formData.productDescription}
                              onChange={(e) => handleInputChange('productDescription', e.target.value)}
                              required
                              multiline
                              rows={2}
                              placeholder="HI-TECH 0.5 Sq mm 3 Pin 6 Amp Plug With Hollow pin -2100MM"
                            />
                          </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Product Details
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  fullWidth
                                  label="Length(Mtr.)"
                                  value={formData.length}
                                  onChange={(e) => handleInputChange('length', e.target.value)}
                                  required
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  fullWidth
                                  label="Colour"
                                  value={formData.colour}
                                  onChange={(e) => handleInputChange('colour', e.target.value)}
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  fullWidth
                                  label="Copper Gauge"
                                  value={formData.copper}
                                  onChange={(e) => handleInputChange('copper', e.target.value)}
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  fullWidth
                                  label="Number of Strands"
                                  value={formData.strands}
                                  onChange={(e) => handleInputChange('strands', e.target.value)}
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  fullWidth
                                  label="Core OD"
                                  value={formData.coreOD}
                                  onChange={(e) => handleInputChange('coreOD', e.target.value)}
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  fullWidth
                                  label="Sheath OD"
                                  value={formData.sheathOD}
                                  onChange={(e) => handleInputChange('sheathOD', e.target.value)}
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  fullWidth
                                  label="Core Colour"
                                  value={formData.coreColour}
                                  onChange={(e) => handleInputChange('coreColour', e.target.value)}
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  fullWidth
                                  label="No. of Cores"
                                  value={formData.noOfCores}
                                  onChange={(e) => handleInputChange('noOfCores', e.target.value)}
                                />
                              </Grid>
                            </Grid>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Box>
                </Fade>
              )}

              {/* Step 2: Production Planning */}
              {activeStep === 2 && (
                <Fade in timeout={500}>
                  <Box>
                    {/* Step Header */}
                    <Box sx={{ 
                      mb: 4,
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(76, 108, 183, 0.05) 100%)',
                      borderRadius: 3,
                      border: '1px solid rgba(30, 58, 138, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #1e3a8a 0%, #4c6cb7 100%)',
                          boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)'
                        }}
                      >
                        <ScheduleIcon sx={{ fontSize: 28, color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ 
                          color: '#2c3e50', 
                          fontWeight: 700, 
                          mb: 0.5
                        }}>
                          Production Planning
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                          Production planning and process specifications
                        </Typography>
                      </Box>
                    </Box>

                    {/* Production Planning */}
                    <Card variant="outlined" sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                          Production Planning
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Plan Quantity"
                              type="number"
                              value={formData.plan}
                              onChange={(e) => handleInputChange('plan', e.target.value)}
                              required
                              helperText="Number of pieces to produce"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Core PVC"
                              value={formData.corePVC}
                              onChange={(e) => handleInputChange('corePVC', e.target.value)}
                              placeholder="e.g., PVC Compound"
                              helperText={formData.corePVC && formData.productCode ? "Auto-fetched from product specifications" : ""}
                              InputProps={{
                                readOnly: formData.corePVC && formData.productCode ? true : false,
                              }}
                              sx={{
                                '& .MuiInputBase-input': {
                                  backgroundColor: formData.corePVC && formData.productCode ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Sheath PVC Inner"
                              value={formData.sheathPVCInner}
                              onChange={(e) => handleInputChange('sheathPVCInner', e.target.value)}
                              placeholder="Inner sheath material"
                              helperText={formData.sheathPVCInner && formData.productCode ? "Auto-fetched from product specifications" : ""}
                              InputProps={{
                                readOnly: formData.sheathPVCInner && formData.productCode ? true : false,
                              }}
                              sx={{
                                '& .MuiInputBase-input': {
                                  backgroundColor: formData.sheathPVCInner && formData.productCode ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Sheath PVC Outer"
                              value={formData.sheathPVCOuter}
                              onChange={(e) => handleInputChange('sheathPVCOuter', e.target.value)}
                              placeholder="Outer sheath material"
                              helperText={formData.sheathPVCOuter && formData.productCode ? "Auto-fetched from product specifications" : ""}
                              InputProps={{
                                readOnly: formData.sheathPVCOuter && formData.productCode ? true : false,
                              }}
                              sx={{
                                '& .MuiInputBase-input': {
                                  backgroundColor: formData.sheathPVCOuter && formData.productCode ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Printing Specifications"
                              value={formData.printing}
                              onChange={(e) => handleInputChange('printing', e.target.value)}
                              multiline
                              rows={2}
                              placeholder="Printing requirements and specifications"
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Box>
                </Fade>
              )}

              {/* Step 3: Cable Materials */}
              {activeStep === 3 && (
                <Fade in timeout={500}>
                  <Box>
                    {/* Step Header */}
                    <Box sx={{ 
                      mb: 4,
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(76, 108, 183, 0.05) 100%)',
                      borderRadius: 3,
                      border: '1px solid rgba(30, 58, 138, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #1e3a8a 0%, #4c6cb7 100%)',
                          boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)'
                        }}
                      >
                        <CableIcon sx={{ fontSize: 28, color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ 
                          color: '#2c3e50', 
                          fontWeight: 700, 
                          mb: 0.5
                        }}>
                          Cable Materials
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                          Cable process materials and specifications
                        </Typography>
                      </Box>
                    </Box>

                    {/* Formula Reference Card */}
                    <Alert 
                      severity="info" 
                      icon={<InfoIcon />}
                      sx={{ 
                        mb: 3,
                        '& .MuiAlert-message': {
                          width: '100%'
                        }
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                        📐 Cable Material Auto-Calculation Formulas
                      </Typography>
                      <Box component="div" sx={{ fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.8 }}>
                        <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                          <strong>1. Copper:</strong> (0.703 × strands × copper² × cores × 1.02) × length / 100
                        </Typography>
                        <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                          <strong>2. Core PVC:</strong> 0.785 × (coreOD² - strands × copper²) × (0.162/100) × length
                        </Typography>
                        <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                          <strong>3. Outer Sheath Base:</strong> 0.785 × (sheathOD² - coreOD² - strands × copper²) × (0.162/100) × length
                        </Typography>
                        <Typography variant="body2" component="div" sx={{ mb: 0.5 }}>
                          <strong>4. PVC 25 No.:</strong> Outer × 70%
                        </Typography>
                        <Typography variant="body2" component="div">
                          <strong>5. PVC 12 No.:</strong> Outer × 30%
                        </Typography>
                      </Box>
                    </Alert>

                    {/* Cable Process Materials */}
                    <Card variant="outlined" sx={{ mb: 3 }}>
                      <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                          <CableIcon color="primary" />
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            Process: Cable
                          </Typography>
                        </Stack>
                        
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'success.main' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}>Sno.</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem', minWidth: '300px' }}>Raw Material</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}>Units</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}>Qty/Pc</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}>Total Qty</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem', width: 120 }}>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {formData.cableMaterials.map((material, index) => (
                                <TableRow key={material.sno}>
                                  <TableCell>
                                    <Chip label={material.sno} size="small" />
                                  </TableCell>
                                  <TableCell sx={{ minWidth: '300px', maxWidth: '400px' }}>
                                    <Autocomplete
                                      freeSolo
                                      options={stockItems}
                                      getOptionLabel={(option) => 
                                        typeof option === 'string' 
                                          ? option 
                                          : `${option.itemCode || option.ItemCode || ''} - ${option.itemName || option.ItemName || ''}`
                                      }
                                      value={stockItems.find(item => 
                                        (item.itemName || item.ItemName) === material.rawMaterial ||
                                        `${item.itemCode || item.ItemCode || ''} - ${item.itemName || item.ItemName || ''}` === material.rawMaterial
                                      ) || null}
                                      onChange={(event, newValue) => {
                                        const itemDisplay = typeof newValue === 'string' 
                                          ? newValue 
                                          : `${newValue?.itemCode || newValue?.ItemCode || ''} - ${newValue?.itemName || newValue?.ItemName || ''}`;
                                        handleMaterialChange('cableMaterials', index, 'rawMaterial', itemDisplay);
                                      }}
                                      onInputChange={(event, newValue) => {
                                        if (event?.type === 'change') {
                                          handleMaterialChange('cableMaterials', index, 'rawMaterial', newValue);
                                        }
                                      }}
                                      renderOption={(props, option) => (
                                        <Box component="li" {...props}>
                                          <Box sx={{ width: '100%' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                              {option.itemName || option.ItemName}
                                            </Typography>
                                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                              <Chip 
                                                label={`Unit: ${option.unit || option.Unit || 'N/A'}`} 
                                                size="small" 
                                                variant="outlined"
                                                color="primary"
                                              />
                                              {(option.quantity || option.Quantity) && (
                                                <Chip 
                                                  label={`Qty: ${option.quantity || option.Quantity}`} 
                                                  size="small" 
                                                  variant="outlined"
                                                  color="success"
                                                />
                                              )}
                                            </Stack>
                                          </Box>
                                        </Box>
                                      )}
                                      renderInput={(params) => (
                                        <TextField
                                          {...params} 
                                          size="small" 
                                          placeholder="Select material from stock"
                                          helperText={material.rawMaterial ? `Unit: ${material.units || 'Select material to see unit'}` : ''}
                                          sx={{ minWidth: '280px' }}
                                        />
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      size="small"
                                      value={material.units}
                                      onChange={(e) => handleMaterialChange('cableMaterials', index, 'units', e.target.value)}
                                      placeholder="Kgs, Pcs, etc."
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      size="small"
                                      type="number"
                                      value={material.qtyPerPc}
                                      onChange={(e) => handleMaterialChange('cableMaterials', index, 'qtyPerPc', e.target.value)}
                                      placeholder="0.00"
                                      step="0.01"
                                      helperText={material.qtyPerPc && material.rawMaterial ? "Auto-calculated from formula" : ""}
                                      InputProps={{
                                        readOnly: material.qtyPerPc && material.rawMaterial ? true : false,
                                      }}
                                      sx={{
                                        '& .MuiInputBase-input': {
                                          backgroundColor: material.qtyPerPc && material.rawMaterial ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                        }
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                      {material.totalQty}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Stack direction="row" spacing={0.5}>
                                      <Tooltip title="Add Row">
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={() => addMaterialRow('cableMaterials')}
                                          sx={{ p: 0.5 }}
                                        >
                                          <AddIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      {formData.cableMaterials.length > 1 && (
                                        <Tooltip title="Remove Row">
                                          <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => removeMaterialRow('cableMaterials', index)}
                                            sx={{ p: 0.5 }}
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Box>
                </Fade>
              )}

              {/* Step 4: Moulding Materials */}
              {activeStep === 4 && (
                <Fade in timeout={500}>
                  <Box>
                    {/* Step Header */}
                    <Box sx={{ 
                      mb: 4,
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(76, 108, 183, 0.05) 100%)',
                      borderRadius: 3,
                      border: '1px solid rgba(30, 58, 138, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #1e3a8a 0%, #4c6cb7 100%)',
                          boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)'
                        }}
                      >
                        <MouldingIcon sx={{ fontSize: 28, color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ 
                          color: '#2c3e50', 
                          fontWeight: 700, 
                          mb: 0.5
                        }}>
                          Moulding Materials
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                          Moulding process materials and specifications
                        </Typography>
                      </Box>
                    </Box>

                    {/* Moulding Process Materials */}
                    <Card variant="outlined" sx={{ mb: 3 }}>
                      <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                          <MouldingIcon color="secondary" />
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            Process: Moulding
                          </Typography>
                        </Stack>
                        
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'secondary.main' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}>Sno.</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem', minWidth: '300px' }}>Raw Material</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}>Units</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}>Qty/Pc</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}>Total Qty</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem', width: 120 }}>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {formData.mouldingMaterials.map((material, index) => (
                                <TableRow key={material.sno}>
                                  <TableCell>
                                    <Chip label={material.sno} size="small" />
                                  </TableCell>
                                  <TableCell sx={{ minWidth: '300px', maxWidth: '400px' }}>
                                    <Autocomplete
                                      freeSolo
                                      options={stockItems}
                                      getOptionLabel={(option) => 
                                        typeof option === 'string' 
                                          ? option 
                                          : `${option.itemCode || option.ItemCode || ''} - ${option.itemName || option.ItemName || ''}`
                                      }
                                      value={stockItems.find(item => 
                                        (item.itemName || item.ItemName) === material.rawMaterial ||
                                        `${item.itemCode || item.ItemCode || ''} - ${item.itemName || item.ItemName || ''}` === material.rawMaterial
                                      ) || null}
                                      onChange={(event, newValue) => {
                                        const itemDisplay = typeof newValue === 'string' 
                                          ? newValue 
                                          : `${newValue?.itemCode || newValue?.ItemCode || ''} - ${newValue?.itemName || newValue?.ItemName || ''}`;
                                        handleMaterialChange('mouldingMaterials', index, 'rawMaterial', itemDisplay);
                                      }}
                                      onInputChange={(event, newValue) => {
                                        if (event?.type === 'change') {
                                          handleMaterialChange('mouldingMaterials', index, 'rawMaterial', newValue);
                                        }
                                      }}
                                      renderOption={(props, option) => (
                                        <Box component="li" {...props}>
                                          <Box sx={{ width: '100%' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                              {option.itemName || option.ItemName}
                                            </Typography>
                                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                              <Chip 
                                                label={`Unit: ${option.unit || option.Unit || 'N/A'}`} 
                                                size="small" 
                                                variant="outlined"
                                                color="primary"
                                              />
                                              {(option.quantity || option.Quantity) && (
                                                <Chip 
                                                  label={`Qty: ${option.quantity || option.Quantity}`} 
                                                  size="small" 
                                                  variant="outlined"
                                                  color="success"
                                                />
                                              )}
                                            </Stack>
                                          </Box>
                                        </Box>
                                      )}
                                      renderInput={(params) => (
                                        <TextField
                                          {...params} 
                                          size="small" 
                                          placeholder="Select material from stock"
                                          helperText={material.rawMaterial ? `Unit: ${material.units || 'Select material to see unit'}` : ''}
                                          sx={{ minWidth: '280px' }}
                                        />
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      size="small"
                                      value={material.units}
                                      onChange={(e) => handleMaterialChange('mouldingMaterials', index, 'units', e.target.value)}
                                      placeholder="Kgs, Pcs, etc."
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      size="small"
                                      type="number"
                                      value={material.qtyPerPc}
                                      onChange={(e) => handleMaterialChange('mouldingMaterials', index, 'qtyPerPc', e.target.value)}
                                      placeholder="0.00"
                                      step="0.01"
                                      helperText="Enter quantity manually"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                                      {material.totalQty}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Stack direction="row" spacing={0.5}>
                                      <Tooltip title="Add Row">
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={() => addMaterialRow('mouldingMaterials')}
                                          sx={{ p: 0.5 }}
                                        >
                                          <AddIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      {formData.mouldingMaterials.length > 1 && (
                                        <Tooltip title="Remove Row">
                                          <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => removeMaterialRow('mouldingMaterials', index)}
                                            sx={{ p: 0.5 }}
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Box>
                </Fade>
              )}

            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 4, 
          background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.8) 100%)',
          borderTop: '1px solid rgba(30, 58, 138, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #1e3a8a, #4c6cb7, #f59e0b)',
          }
        }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
              startIcon={<ScheduleIcon />}
              sx={{
                borderColor: activeStep === 0 ? '#e2e8f0' : '#1e3a8a',
                color: activeStep === 0 ? '#94a3b8' : '#1e3a8a',
                borderRadius: 3,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                minWidth: 120,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: activeStep === 0 ? '#e2e8f0' : '#001a5c',
                  backgroundColor: activeStep === 0 ? 'transparent' : 'rgba(30, 58, 138, 0.05)',
                  transform: activeStep === 0 ? 'none' : 'translateY(-2px)',
                  boxShadow: activeStep === 0 ? 'none' : '0 4px 12px rgba(30, 58, 138, 0.2)'
                },
                '&:disabled': {
                  borderColor: '#e2e8f0',
                  color: '#94a3b8',
                  backgroundColor: 'transparent'
                }
              }}
            >
              Back
            </Button>
            {!isLastAccessibleStep() ? (
              <Button 
                onClick={handleNext}
                disabled={!isCurrentStepCompleted()}
                variant="contained"
                endIcon={<ScheduleIcon />}
                sx={{
                  background: isCurrentStepCompleted() 
                    ? 'linear-gradient(135deg, #1e3a8a 0%, #4c6cb7 100%)'
                    : 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                  color: isCurrentStepCompleted() ? 'white' : '#94a3b8',
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '1rem',
                  minWidth: 140,
                  boxShadow: isCurrentStepCompleted() 
                    ? '0 6px 20px rgba(30, 58, 138, 0.3)'
                    : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  cursor: isCurrentStepCompleted() ? 'pointer' : 'not-allowed',
                  '&:hover': isCurrentStepCompleted() ? {
                    background: 'linear-gradient(135deg, #001a5c 0%, #1e3a8a 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(30, 58, 138, 0.4)'
                  } : {},
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                    color: '#94a3b8',
                    cursor: 'not-allowed'
                  }
                }}
              >
                Next Step
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                startIcon={loading ? <Box sx={{ width: 16, height: 16, border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <SaveIcon />}
                variant="contained"
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '1rem',
                  minWidth: 160,
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: loading ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    transform: loading ? 'none' : 'translateY(-2px)',
                    boxShadow: loading ? '0 6px 20px rgba(16, 185, 129, 0.3)' : '0 8px 25px rgba(16, 185, 129, 0.4)'
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                    color: 'white'
                  }
                }}
              >
                {loading ? 'Saving...' : (selectedBom ? 'Update BOM' : 'Create BOM')}
              </Button>
            )}
          </Box>
          
          {/* Progress indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#374151', fontWeight: 600 }}>
              Progress: {(() => {
                const bomCategory = selectedBom ? (selectedBom.category || selectedBom.bomCategory) : null;
                const totalSteps = selectedBom && bomCategory ? steps.length - 1 : steps.length;
                return Math.round(((activeStep + 1) / totalSteps) * 100);
              })()}%
            </Typography>
            <Box sx={{ width: 80, height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
              <Box
                sx={{
                  height: '100%',
                  width: `${(() => {
                    const bomCategory = selectedBom ? (selectedBom.category || selectedBom.bomCategory) : null;
                    const totalSteps = selectedBom && bomCategory ? steps.length - 1 : steps.length;
                    return ((activeStep + 1) / totalSteps) * 100;
                  })()}%`,
                  background: 'linear-gradient(90deg, #1e3a8a, #4c6cb7)',
                  borderRadius: 3,
                  transition: 'width 0.3s ease'
                }}
              />
            </Box>
          </Box>

          <Button 
            onClick={handleCloseDialog} 
            startIcon={<CancelIcon />}
            variant="text"
            sx={{
              color: '#6c757d',
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
              minWidth: 120,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
              }
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog
        open={openViewDetailsDialog}
        onClose={() => setOpenViewDetailsDialog(false)}
        maxWidth="xl"
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
                Bill of Material Details
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedBomDetails ? `${selectedBomDetails.productDescription} (${selectedBomDetails.productCode})` : 'BOM Details'}
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              startIcon={<PrintIcon />}
              onClick={() => generateBOMPDF(selectedBomDetails)}
              sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
            >
              Download PDF
            </Button>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
          {selectedBomDetails && (
            <Box sx={{ maxWidth: '100%', mx: 'auto' }}>
              <Grid container spacing={3}>
                {/* Row 1: Company Header */}
                <Grid item xs={12}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      bgcolor: 'primary.main', 
                      color: 'white', 
                      p: 3, 
                      textAlign: 'center',
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      border: 'none'
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, letterSpacing: '0.5px' }}>
                      REYANSH INTERNATIONAL PVT. LTD
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 500, mb: 1, opacity: 0.9 }}>
                      BILL OF MATERIAL
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Generated on: {new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      }).replace(/\//g, '/')}
                    </Typography>
                  </Card>
                </Grid>

                {/* Row 2: Document Information (Left) + Product Specifications (Right) */}
                <Grid item xs={12} md={6}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      p: 3, 
                      height: '100%',
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      bgcolor: 'white',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                      <DescriptionIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Document Information
                      </Typography>
                    </Stack>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Format No:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>FM/B/Dev/03</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Rev No:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>00</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Product Code:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          {selectedBomDetails.productCode || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Plan:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          {selectedBomDetails.plan || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Rev Date:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          {new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          }).replace(/\//g, '/')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Issue Date:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          {new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          }).replace(/\//g, '/')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Date:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          {new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          }).replace(/\//g, '/')}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      p: 3, 
                      height: '100%',
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      bgcolor: 'white',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                      <CableIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Product Specifications
                      </Typography>
                    </Stack>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Length (Mtr.):</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          {selectedBomDetails.length || selectedBomDetails.totalLength || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Colour:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          {selectedBomDetails.colour || selectedBomDetails.coreColour || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Copper Gauge:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          {selectedBomDetails.copper || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Number of Strands:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          {selectedBomDetails.strands || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Core OD:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          {selectedBomDetails.coreOD || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Sheath OD:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          {selectedBomDetails.sheathOD || 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>

                {/* Row 3: Additional Specifications */}
                <Grid item xs={12}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      p: 3,
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      bgcolor: 'white',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                      <InfoIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Additional Specifications
                      </Typography>
                    </Stack>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          p: 2,
                          bgcolor: '#f8fafc',
                          borderRadius: 1,
                          border: '1px solid #e2e8f0'
                        }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Core PVC:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                            {selectedBomDetails.corePVC || 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          p: 2,
                          bgcolor: '#f8fafc',
                          borderRadius: 1,
                          border: '1px solid #e2e8f0'
                        }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Sheath PVC Inner:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                            {selectedBomDetails.sheathPVCInner || 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          p: 2,
                          bgcolor: '#f8fafc',
                          borderRadius: 1,
                          border: '1px solid #e2e8f0'
                        }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>No. of Cores:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                            {selectedBomDetails.numberOfCores || selectedBomDetails.noOfCores || 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          p: 2,
                          bgcolor: '#f8fafc',
                          borderRadius: 1,
                          border: '1px solid #e2e8f0'
                        }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Red, Black:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                            {selectedBomDetails.redBlack || 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          p: 2,
                          bgcolor: '#f8fafc',
                          borderRadius: 1,
                          border: '1px solid #e2e8f0'
                        }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Sheath PVC Outer:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                            {selectedBomDetails.sheathPVCOuter || 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={9}>
                        <Box sx={{ 
                          p: 2,
                          bgcolor: '#f8fafc',
                          borderRadius: 1,
                          border: '1px solid #e2e8f0'
                        }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>Printing:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary', wordBreak: 'break-word' }}>
                            {selectedBomDetails.printing || 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>

                {/* Row 4: Cable Materials */}
                <Grid item xs={12}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      p: 3,
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      bgcolor: 'white',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                      <CableIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Cable Materials
                      </Typography>
                    </Stack>
                    
                    {selectedBomDetails.cableMaterials && Array.isArray(selectedBomDetails.cableMaterials) && selectedBomDetails.cableMaterials.length > 0 ? (
                      <TableContainer sx={{ borderRadius: 1, border: '1px solid #e2e8f0' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                bgcolor: 'primary.main', 
                                color: 'white',
                                borderRight: '1px solid rgba(255,255,255,0.2)',
                                textAlign: 'center'
                              }}>S.No.</TableCell>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                bgcolor: 'primary.main', 
                                color: 'white',
                                borderRight: '1px solid rgba(255,255,255,0.2)'
                              }}>Process</TableCell>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                bgcolor: 'primary.main', 
                                color: 'white',
                                borderRight: '1px solid rgba(255,255,255,0.2)'
                              }}>Material Type</TableCell>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                bgcolor: 'primary.main', 
                                color: 'white',
                                borderRight: '1px solid rgba(255,255,255,0.2)',
                                textAlign: 'center'
                              }}>Units</TableCell>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                bgcolor: 'primary.main', 
                                color: 'white',
                                borderRight: '1px solid rgba(255,255,255,0.2)',
                                textAlign: 'center'
                              }}>Qty/Pc</TableCell>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                bgcolor: 'primary.main', 
                                color: 'white',
                                borderRight: '1px solid rgba(255,255,255,0.2)',
                                textAlign: 'center'
                              }}>Total Qty</TableCell>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                bgcolor: 'primary.main', 
                                color: 'white',
                                borderRight: '1px solid rgba(255,255,255,0.2)',
                                textAlign: 'center'
                              }}>Issue</TableCell>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                bgcolor: 'primary.main', 
                                color: 'white',
                                textAlign: 'center'
                              }}>Return</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedBomDetails.cableMaterials.map((material, index) => (
                              <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f8fafc' } }}>
                                <TableCell sx={{ textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{index + 1}</TableCell>
                                <TableCell sx={{ borderRight: '1px solid #e2e8f0' }}>{material?.process || material?.rawMaterial || 'Cable Production'}</TableCell>
                                <TableCell sx={{ borderRight: '1px solid #e2e8f0' }}>{material?.cableMaterial || material?.itemName || material?.materialType || material?.rawMaterial || 'N/A'}</TableCell>
                                <TableCell sx={{ textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{material?.units || 'Mtr'}</TableCell>
                                <TableCell sx={{ textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{material?.qtyPerPc || material?.quantityPerPiece || '1'}</TableCell>
                                <TableCell sx={{ textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{material?.totalQty || material?.totalQuantity || selectedBomDetails.length || 'N/A'}</TableCell>
                                <TableCell sx={{ textAlign: 'center', borderRight: '1px solid #e2e8f0' }}></TableCell>
                                <TableCell sx={{ textAlign: 'center' }}></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{ 
                        p: 4, 
                        textAlign: 'center', 
                        bgcolor: '#f8fafc', 
                        borderRadius: 2,
                        border: '1px solid #e2e8f0'
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          No cable materials data available. This BOM may need to be updated with material specifications.
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Expected fields: cableMaterials, rawMaterials, or materials
                        </Typography>
                      </Box>
                    )}
                  </Card>
                </Grid>

                {/* Row 5: Moulding Materials */}
                <Grid item xs={12}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      p: 3,
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      bgcolor: 'white',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                      <MouldingIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Moulding Materials
                      </Typography>
                    </Stack>
                    
                    {selectedBomDetails.mouldingMaterials && Array.isArray(selectedBomDetails.mouldingMaterials) && selectedBomDetails.mouldingMaterials.length > 0 ? (
                      <TableContainer sx={{ borderRadius: 1, border: '1px solid #e2e8f0' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                bgcolor: 'primary.main', 
                                color: 'white',
                                borderRight: '1px solid rgba(255,255,255,0.2)',
                                textAlign: 'center'
                              }}>S.No.</TableCell>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                bgcolor: 'primary.main', 
                                color: 'white',
                                borderRight: '1px solid rgba(255,255,255,0.2)'
                              }}>Process</TableCell>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                bgcolor: 'primary.main', 
                                color: 'white',
                                borderRight: '1px solid rgba(255,255,255,0.2)'
                              }}>Material Type</TableCell>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                bgcolor: 'primary.main', 
                                color: 'white',
                                borderRight: '1px solid rgba(255,255,255,0.2)',
                                textAlign: 'center'
                              }}>Units</TableCell>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                bgcolor: 'primary.main', 
                                color: 'white',
                                borderRight: '1px solid rgba(255,255,255,0.2)',
                                textAlign: 'center'
                              }}>Qty/Pc</TableCell>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                bgcolor: 'primary.main', 
                                color: 'white',
                                borderRight: '1px solid rgba(255,255,255,0.2)',
                                textAlign: 'center'
                              }}>Total Qty</TableCell>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                bgcolor: 'primary.main', 
                                color: 'white',
                                borderRight: '1px solid rgba(255,255,255,0.2)',
                                textAlign: 'center'
                              }}>Issue</TableCell>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                bgcolor: 'primary.main', 
                                color: 'white',
                                textAlign: 'center'
                              }}>Return</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedBomDetails.mouldingMaterials.map((material, index) => (
                              <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f8fafc' } }}>
                                <TableCell sx={{ textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{index + 1}</TableCell>
                                <TableCell sx={{ borderRight: '1px solid #e2e8f0' }}>{material?.process || material?.itemName || material?.materialType || 'Moulding'}</TableCell>
                                <TableCell sx={{ borderRight: '1px solid #e2e8f0' }}>{material?.materialType || material?.itemName || material?.rawMaterial || 'N/A'}</TableCell>
                                <TableCell sx={{ textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{material?.units || 'Pcs'}</TableCell>
                                <TableCell sx={{ textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{material?.qtyPerPc || material?.quantityPerPiece || '1'}</TableCell>
                                <TableCell sx={{ textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{material?.totalQty || material?.totalQuantity || selectedBomDetails.plan || 'N/A'}</TableCell>
                                <TableCell sx={{ textAlign: 'center', borderRight: '1px solid #e2e8f0' }}></TableCell>
                                <TableCell sx={{ textAlign: 'center' }}></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{ 
                        p: 4, 
                        textAlign: 'center', 
                        bgcolor: '#f8fafc', 
                        borderRadius: 2,
                        border: '1px solid #e2e8f0'
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          No moulding materials data available. This BOM may need to be updated with moulding specifications.
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Expected fields: mouldingMaterials or moulding
                        </Typography>
                      </Box>
                    )}
                  </Card>
                </Grid>

                {/* Row 6: Signatures */}
                <Grid item xs={12}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      p: 3,
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      bgcolor: 'white',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                      <CompanyIcon color="primary" sx={{ fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Process Signatures
                      </Typography>
                    </Stack>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ 
                          textAlign: 'center', 
                          border: '2px solid #e2e8f0', 
                          p: 3, 
                          borderRadius: 2,
                          bgcolor: '#f8fafc',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'primary.50'
                          }
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>CABLE PRODUCTION</Typography>
                          <Box sx={{ height: 50, borderBottom: '2px solid #64748b', mb: 1 }}></Box>
                          <Typography variant="caption" color="text.secondary">SIGNATURE</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ 
                          textAlign: 'center', 
                          border: '2px solid #e2e8f0', 
                          p: 3, 
                          borderRadius: 2,
                          bgcolor: '#f8fafc',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'primary.50'
                          }
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>CUTTING</Typography>
                          <Box sx={{ height: 50, borderBottom: '2px solid #64748b', mb: 1 }}></Box>
                          <Typography variant="caption" color="text.secondary">SIGNATURE</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ 
                          textAlign: 'center', 
                          border: '2px solid #e2e8f0', 
                          p: 3, 
                          borderRadius: 2,
                          bgcolor: '#f8fafc',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'primary.50'
                          }
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>ASSEMBLY</Typography>
                          <Box sx={{ height: 50, borderBottom: '2px solid #64748b', mb: 1 }}></Box>
                          <Typography variant="caption" color="text.secondary">SIGNATURE</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ 
                          textAlign: 'center', 
                          border: '2px solid #e2e8f0', 
                          p: 3, 
                          borderRadius: 2,
                          bgcolor: '#f8fafc',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'primary.50'
                          }
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>PACKING</Typography>
                          <Box sx={{ height: 50, borderBottom: '2px solid #64748b', mb: 1 }}></Box>
                          <Typography variant="caption" color="text.secondary">SIGNATURE</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', gap: 2 }}>
          <Button 
            onClick={() => setOpenViewDetailsDialog(false)}
            variant="outlined"
            startIcon={<CloseIcon />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 500,
              borderColor: '#e2e8f0',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'primary.50'
              }
            }}
          >
            Close
          </Button>
          <Button 
            onClick={() => generateBOMPDF(selectedBomDetails)}
            variant="contained"
            startIcon={<PrintIcon />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 500,
              bgcolor: 'success.main',
              boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
              '&:hover': {
                bgcolor: 'success.dark',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)'
              }
            }}
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CompanyBillOfMaterials;
