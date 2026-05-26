import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  TablePagination,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Autocomplete,
  Checkbox,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  Engineering as PlanningIcon,
  Cable as CableIcon,
  PlayArrow as StartIcon,
  Schedule as ScheduleIcon,
  Inventory as MaterialIcon,
  Build as BunchingIcon,
  Transform as ExtruderIcon,
  GroupWork as LayingIcon,
  Loop as CoilingIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowBack,
  ArrowForward,
  Close,
  Visibility,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import sheetService from "../../services/sheetService";
import poService from "../../services/poService";
import LoadingSpinner from "../common/LoadingSpinner";
import WhatsAppButton from "../common/WhatsAppButton";

const CableProductionPlanning = () => {
  const navigate = useNavigate();
  const [productionPlans, setProductionPlans] = useState([]);
  const [cableProducts, setCableProducts] = useState([]);
  const [soData, setSOData] = useState([]);
  const [filteredSOs, setFilteredSOs] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewPlan, setViewPlan] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Time filter state
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', '3d', '7d', '24d'
  
  // Track if form was auto-filled from flow management batches (to prevent quantity overwrite)
  const isFromFlowManagement = useRef(false);
  
  // Cache for product specs to avoid repeated fetches
  const productSpecsCache = useRef(new Map());
  const debounceTimer = useRef(null);

  const [formData, setFormData] = useState({
    planId: "",
    orderNumber: "",
    customerName: "",
    productCode: "",
    quantity: "",
    length: "",
    strands: "",
    copperDiameter: "",
    numberOfCores: "",
    numberOfCore: "",
    coreColors: [],
    coreOD: "",
    sheathOD: "",
    totalFinishedLength: "",
    dueDate: new Date(),
    priority: "Medium",
    status: "Planning",
    remarks: "",
    createdDate: new Date(),
  });

  const [materialRequirements, setMaterialRequirements] = useState({
    totalWireLength: 0,
    copperRequired: 0,
    pvcRequired: 0,
    pvcCoreRequired: 0,
    pvcSheathRequired: 0,
    colorBreakdown: {},
  });

  const [machineSchedule, setMachineSchedule] = useState({
    bunching: null,
    extruder: [],
    laying: null,
    finalExtruder: null,
  });

  // Production stages
  const productionSteps = [
    {
      label: "Material Calculation",
      icon: <MaterialIcon />,
      description: "Calculate copper and PVC requirements",
    },
    {
      label: "Bunching Process",
      icon: <BunchingIcon />,
      description: "Bundle copper strands if required",
    },
    {
      label: "Extrusion",
      icon: <ExtruderIcon />,
      description: "Create single-core cables with PVC coating",
    },
    {
      label: "Laying Process",
      icon: <LayingIcon />,
      description: "Combine multiple cores into final cable",
    },
    {
      label: "Final Extrusion",
      icon: <ExtruderIcon />,
      description: "Apply outer sheath coating",
    },
    {
      label: "Coiling",
      icon: <CoilingIcon />,
      description: "Wind and package final cable",
    },
  ];

  // Optimized: Fetch all data in parallel on mount
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchProductionPlans(),
          fetchCableProducts(),
          fetchSOData()
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

  // Auto-fill form from sessionStorage when coming from flow management
  useEffect(() => {
    // Wait for cable products to be loaded before autofilling
    if (cableProducts.length === 0) return;

    try {
      const storedData = sessionStorage.getItem('selectedCableProductionBatches');
      if (!storedData) return;

      const batchData = JSON.parse(storedData);
      const combinedData = batchData.combinedData;

      if (!combinedData) return;

      // Find the product in cableProducts to get specifications
      const product = cableProducts.find(p => 
        (p.productCode || "").toString().trim() === (combinedData.ProductCode || "").toString().trim()
      );

      // Auto-fill form with combined batch data
      // Calculate total quantity from all batches - ALWAYS use combined batch quantity
      let totalQuantity = 0;
      
      // Always calculate from batches array to ensure we get the combined quantity
      if (batchData.batches && batchData.batches.length > 0) {
        totalQuantity = batchData.batches.reduce((sum, batch) => {
          return sum + (parseFloat(batch.Quantity || batch.BatchSize || 0));
        }, 0);
      } else {
        // Fallback to combinedData if batches array is not available
        totalQuantity = parseFloat(combinedData.Quantity || combinedData.BatchSize || 0);
      }
      
      // Use POId or SOId for order number (not DispatchUniqueId) to match Autocomplete
      const orderNumberToUse = combinedData.POId || combinedData.SOId || combinedData.DispatchUniqueId || "";
      
      // Mark that this form was auto-filled from flow management
      isFromFlowManagement.current = true;
      
      setFormData(prev => ({
        ...prev,
        orderNumber: orderNumberToUse, // Use POId/SOId to match Autocomplete options
        customerName: combinedData.ClientCode || "",
        productCode: combinedData.ProductCode || "",
        quantity: totalQuantity.toString(), // Always use combined batch quantity
        length: combinedData.CableLength || combinedData.TargetLength || product?.standardLength || "1.5",
        // Product specifications will be auto-filled by the existing useEffect for productCode
      }));

      // Automatically open the form dialog
      setOpenDialog(true);
      setActiveStep(0);
      setSelectedPlan(null); // Ensure it's a new plan, not editing an existing one

      // Show success message
      const batchCount = batchData.batches?.length || 1;
      const batchText = batchCount > 1 ? `${batchCount} batches combined` : '1 batch';
      setSnackbar({
        open: true,
        message: `Auto-filled from ${batchText} (${combinedData.Quantity || combinedData.BatchSize} pcs). Form opened automatically. Batches will be marked as moved after plan creation.`,
        severity: "success",
      });

      // Don't clear sessionStorage here - it will be cleared after plan is successfully created
    } catch (error) {
      console.error("Error auto-filling from sessionStorage:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cableProducts.length]); // Run when cable products are loaded

  // Optimized: Memoize material calculation with debouncing
  const materialCalculationDeps = useMemo(() => ({
    productCode: formData.productCode,
    quantity: formData.quantity,
    length: formData.length,
    strands: formData.strands,
    copperDiameter: formData.copperDiameter,
    numberOfCores: formData.numberOfCores,
    coreOD: formData.coreOD,
    sheathOD: formData.sheathOD,
    coreColors: JSON.stringify(formData.coreColors)
  }), [
    formData.productCode,
    formData.quantity,
    formData.length,
    formData.strands,
    formData.copperDiameter,
    formData.numberOfCores,
    formData.coreOD,
    formData.sheathOD,
    JSON.stringify(formData.coreColors)
  ]);

  // Optimized: Auto-fetch order details with debouncing and proper dependencies
  useEffect(() => {
    if (!formData.orderNumber || soData.length === 0) return;
    
    const timer = setTimeout(() => {
      autoFetchOrderDetails(formData.orderNumber);
    }, 500); // Debounce order fetching

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.orderNumber, soData.length]); // autoFetchOrderDetails uses soData from closure

  // Track previous product code to detect changes
  const prevProductCodeRef = useRef(formData.productCode);
  
  // Optimized: Auto-fetch product specs with instant update for core colors
  useEffect(() => {
    if (!formData.productCode) {
      // Clear core colors when product code is cleared
      setFormData(prev => ({
        ...prev,
        coreColors: [],
        numberOfCores: ""
      }));
      prevProductCodeRef.current = "";
      return;
    }
    
    const normalizedCode = formData.productCode.toString().trim();
    const prevCode = prevProductCodeRef.current?.toString().trim();
    
    // If product code changed, reset core colors first to avoid showing old values
    if (prevCode && prevCode !== normalizedCode) {
      setFormData(prev => ({
        ...prev,
        coreColors: [],
        numberOfCores: ""
      }));
    }
    
    // Update ref
    prevProductCodeRef.current = normalizedCode;
    
    // Check cache first - update immediately if cached
    if (productSpecsCache.current.has(normalizedCode)) {
      const cachedSpecs = productSpecsCache.current.get(normalizedCode);
      setFormData(prev => ({
        ...prev,
        ...cachedSpecs
      }));
      return;
    }
    
    // Try immediate lookup from cableProducts if available (instant update)
    if (Array.isArray(cableProducts) && cableProducts.length > 0) {
      const foundProduct = cableProducts.find(p => (p.productCode || "").toString().trim() === normalizedCode);
      if (foundProduct) {
        // Extract core colors immediately
        let coreColors = foundProduct.coreColors;
        if (!coreColors) {
          coreColors = foundProduct.coreColour || foundProduct.coreColours || foundProduct.colour || foundProduct.color;
        }
        
        // Parse core colors
        if (typeof coreColors === 'string') {
          try {
            coreColors = JSON.parse(coreColors);
            if (!Array.isArray(coreColors)) {
              coreColors = coreColors ? [coreColors] : [];
            }
          } catch {
            if (coreColors.includes(',')) {
              coreColors = coreColors.split(',').map(c => c.trim()).filter(c => c);
            } else {
              coreColors = coreColors.trim() ? [coreColors.trim()] : [];
            }
          }
        }
        if (!Array.isArray(coreColors)) {
          coreColors = coreColors ? [coreColors] : [];
        }
        coreColors = coreColors.filter(c => c && c.trim());
        
        // Update formData immediately with core colors (replace, don't merge)
        setFormData(prev => ({
          ...prev,
          coreColors: coreColors.length > 0 ? coreColors : [],
          numberOfCores: foundProduct.numberOfCore || foundProduct.numberOfCores || foundProduct.coreCount || coreColors.length || prev.numberOfCores || ""
        }));
      } else {
        // Product not found in cableProducts, clear core colors
        setFormData(prev => ({
          ...prev,
          coreColors: [],
          numberOfCores: ""
        }));
      }
    }
    
    // Fetch full product specs (may include additional data from client service)
    autoFetchProductLength(normalizedCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.productCode, cableProducts]); // Include cableProducts to ensure fresh data

  // Optimized: Memoized material calculation (defined early to avoid temporal dead zone)
  const calculateMaterialRequirements = useCallback(() => {
    // Require product, quantity, and length
    if (!formData.productCode || !formData.quantity || !formData.length) {
      setMaterialRequirements({
        totalWireLength: 0,
        totalSingleCoreLength: 0,
        copperRequired: 0,
        pvcRequired: 0,
        pvcCoreRequired: 0,
        pvcSheathRequired: 0,
        colorBreakdown: {},
        error: "Missing required data for calculation",
      });
      return;
    }

    const product = cableProducts.find(p => p.productCode === formData.productCode);
    if (!product) {
      setMaterialRequirements({
        totalWireLength: 0,
        totalSingleCoreLength: 0,
        copperRequired: 0,
        pvcRequired: 0,
        pvcCoreRequired: 0,
        pvcSheathRequired: 0,
        colorBreakdown: {},
        error: "Product not found",
      });
      return;
    }

    const quantity = parseFloat(formData.quantity);
    const length = parseFloat(formData.length);
    const strands = parseFloat(formData.strands || product.strandCount || 0);
    const copper = parseFloat(formData.copperDiameter || product.copperSize || product.conductorSize || 0);
    const numberOfCores = parseFloat(formData.numberOfCores || (product.coreColors ? JSON.parse(product.coreColors || '[]').length : 0));
    const coreOD = parseFloat(formData.coreOD || product.coreOD || 0);
    const sheathOD = parseFloat(formData.sheathOD || product.sheathOD || product.sheathOuterDiameter || product.cableOD || product.overallOD || 0);

    if ([quantity, length, numberOfCores].some(v => isNaN(v) || v <= 0)) {
      setMaterialRequirements({
        totalWireLength: 0,
        totalSingleCoreLength: 0,
        copperRequired: 0,
        pvcRequired: 0,
        pvcCoreRequired: 0,
        pvcSheathRequired: 0,
        colorBreakdown: {},
        error: "Invalid quantity, length or core count",
      });
      return;
    }

    // Prefer cores/colors from the form (user may override product defaults)
    const formCoreColors = Array.isArray(formData.coreColors) ? formData.coreColors : (typeof formData.coreColors === 'string' && formData.coreColors.trim() ? formData.coreColors.split(',').map(s => s.trim()) : []);
    const productCoreColors = product.coreColors ? (() => { try { return JSON.parse(product.coreColors); } catch { return []; } })() : [];
    const coreColors = (formCoreColors.length ? formCoreColors : productCoreColors);
    const coreCount = numberOfCores || (coreColors.length || 0);

    // 1) Total Finished Cable Length
    const totalWireLength = quantity * length; // meters
    // 2) Total Single Core wire needed
    const totalSingleCoreLength = totalWireLength * coreCount; // meters

    // 3) Copper per color/core
    const copperPerCore = (0.703 * strands * Math.pow(copper, 2) * 1.02) * totalWireLength / 100; // kg
    // 4) PVC per color/core (core insulation)
    const pvcCoreAreaTerm = Math.max(Math.pow(coreOD, 2) - Math.max(strands, 0) * Math.pow(copper, 2), 0);
    const pvcPerCore = 0.785 * pvcCoreAreaTerm * (0.162 / 100) * totalWireLength; // kg (never negative)
    // 5) Sheath PVC (outer sheath) — per formula provided
    const pvcSheathAreaTerm = Math.max(Math.pow(sheathOD, 2) - Math.pow(coreOD, 2), 0);
    const pvcSheathPerCore = 0.785 * pvcSheathAreaTerm * (0.162 / 100) * totalWireLength;

    const copperRequired = copperPerCore * coreCount; // kg
    const pvcCoreRequired = pvcPerCore * coreCount; // kg
    const pvcSheathRequired = pvcSheathPerCore; // kg (NOT multiplied by coreCount - outer sheath is per cable, not per core)
    const pvcRequired = pvcCoreRequired + pvcSheathRequired; // total kg

    // Color-wise breakdown
    const colorBreakdown = {};
    (Array.isArray(coreColors) && coreColors.length ? coreColors.slice(0, coreCount) : new Array(coreCount).fill(null).map((_, i) => `Core ${i+1}`))
      .forEach(color => {
        colorBreakdown[color] = {
          length: totalWireLength,
          copper: Math.round(copperPerCore * 100) / 100,
          pvc: Math.round(pvcPerCore * 100) / 100,
        };
      });

    setMaterialRequirements({
      totalWireLength,
      totalSingleCoreLength,
      copperRequired,
      pvcRequired,
      pvcCoreRequired,
      pvcSheathRequired,
      colorBreakdown,
    });

    // Generate machine schedule only if we have valid data
    // Note: generateMachineSchedule is called via a ref to avoid circular dependency
    if (quantity > 0 && length > 0 && totalSingleCoreLength > 0) {
      // We'll handle this in a separate useEffect after generateMachineSchedule is defined
      // For now, we'll just set a flag or call it directly if available
    }
  }, [formData.productCode, formData.quantity, formData.length, formData.strands, formData.copperDiameter, formData.numberOfCores, formData.coreOD, formData.sheathOD, formData.coreColors, cableProducts]);

  // Debounced material calculation to prevent excessive recalculations
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      calculateMaterialRequirements();
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [materialCalculationDeps, calculateMaterialRequirements]);

  // Optimized: Use useCallback to prevent unnecessary re-renders
  const fetchProductionPlans = useCallback(async (forceRefresh = false) => {
    try {
      const data = await sheetService.getSheetData("Cable Production Plans", forceRefresh);
      setProductionPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching production plans:", error);
      setSnackbar({
        open: true,
        message: "Error fetching production plans",
        severity: "error",
      });
      setProductionPlans([]);
    }
  }, []);

  // Optimized: Parallel fetching with better error handling
  const fetchCableProducts = useCallback(async (forceRefresh = false) => {
    try {
      // Fetch both in parallel for better performance
      const [cableProductsData, soData] = await Promise.allSettled([
        sheetService.getSheetData("Cable Products", forceRefresh),
        poService.getAllPOs(forceRefresh)
      ]);
      
      const cableProductsResult = cableProductsData.status === 'fulfilled' 
        ? cableProductsData.value 
        : [];
      const soDataResult = soData.status === 'fulfilled' 
        ? soData.value 
        : [];
      
      if (cableProductsData.status === 'rejected') {
        console.warn("Failed to fetch cable products:", cableProductsData.reason);
      }
      
      if (soData.status === 'rejected') {
        console.warn("Failed to fetch SO data:", soData.reason);
      }
      
      // Filter SOs for cable production
      const cableProductionSOs = soDataResult.filter(so => 
        so.OrderType === 'CABLE_ONLY' || 
        so.OrderType === 'POWER_CORD' ||
        so.Status === 'CABLE_PRODUCTION'
      );
      
      // Merge cable products with SO data - FIXED: Preserve product specifications
      const enhancedProducts = cableProductionSOs.map(so => {
        const existingProduct = cableProductsResult.find(cp => cp.productCode === so.ProductCode);
        
        if (existingProduct) {
          // If product exists, preserve all specifications and add SO context
          return {
            ...existingProduct,
            // Add SO-specific context without overwriting product specs
            poId: so.POId,
            soId: so.SOId || so.POId, // Use SOId if available, fallback to POId
            uniqueId: so.UniqueId || so.POId, // Use UniqueId if available, fallback to POId
            soQuantity: so.Quantity,
            soBatchSize: so.BatchSize,
            soStatus: so.Status,
            clientCode: so.ClientCode,
            soDescription: so.Description,
            // Keep original product name and code
            productCode: existingProduct.productCode,
            productName: existingProduct.productName || so.Name,
            isFromSO: true,
          };
        } else {
          // If no existing product, create new one with SO data and defaults
          return {
            productCode: so.ProductCode,
            productName: so.Name,
            // SO-specific data
            poId: so.POId,
            soId: so.SOId || so.POId, // Use SOId if available, fallback to POId
            uniqueId: so.UniqueId || so.POId, // Use UniqueId if available, fallback to POId
            soQuantity: so.Quantity,
            soBatchSize: so.BatchSize,
            soStatus: so.Status,
            clientCode: so.ClientCode,
            soDescription: so.Description,
            // Default cable specs for new products
            cableType: "Three Core",
            strandCount: "24",
            conductorSize: "1.5",
            conductorMaterial: "Copper",
            coreCount: "3",
            coreColors: '["Brown", "Blue", "Yellow-Green"]',
            copperSize: "1.5",
            isFromSO: true,
            needsConfiguration: true, // Flag to indicate this needs proper specs
          };
        }
      });
      
      // FIXED: Remove duplicates and merge properly
      const allProducts = [...cableProductsResult];
      
      // Add enhanced SO products only if they don't already exist
      enhancedProducts.forEach(enhancedProduct => {
        const existingIndex = allProducts.findIndex(p => p.productCode === enhancedProduct.productCode);
        if (existingIndex >= 0) {
          // Update existing product with SO context
          allProducts[existingIndex] = enhancedProduct;
        } else {
          // Add new product from SO
          allProducts.push(enhancedProduct);
        }
      });
      
      setCableProducts(allProducts);
    } catch (error) {
      console.error("Error fetching cable products:", error);
      setSnackbar({
        open: true,
        message: `Failed to load cable products: ${error.message}`,
        severity: "error",
      });
      setCableProducts([]);
    }
  }, []);

  // Optimized: Memoized SO data fetching
  const fetchSOData = useCallback(async (forceRefresh = false) => {
    try {
      const data = await poService.getAllPOs(forceRefresh);
      
      // Filter relevant SOs for cable production
      const relevantSOs = (Array.isArray(data) ? data : []).filter(so => 
        so.OrderType === 'CABLE_ONLY' || 
        so.OrderType === 'POWER_CORD' ||
        so.Status === 'CABLE_PRODUCTION' ||
        so.Status === 'NEW'
      );
      
      setSOData(relevantSOs);
      setFilteredSOs(relevantSOs);
    } catch (error) {
      console.error("Error fetching SO data:", error);
      setSnackbar({
        open: true,
        message: "Error fetching Sales Order data",
        severity: "error",
      });
      setSOData([]);
      setFilteredSOs([]);
    }
  }, []);

  const autoFetchOrderDetails = async (orderNumber) => {
    try {
      // Find SO data for this order number
      const matchingSO = soData.find(so => so.POId === orderNumber || so.SOId === orderNumber);
      
      if (matchingSO) {
        // Check if product code is changing - if so, reset core colors first
        const newProductCode = matchingSO.ProductCode;
        const currentProductCode = formData.productCode;
        
        // If product code is changing, reset core colors to avoid showing old values
        if (newProductCode && newProductCode !== currentProductCode) {
          setFormData(prev => ({
            ...prev,
            coreColors: [],
            numberOfCores: ""
          }));
        }
        
        // Auto-populate form with SO data
        // BUT: Don't overwrite quantity if form was auto-filled from flow management batches
        setFormData(prev => {
          const updateData = {
            customerName: matchingSO.ClientCode || "",
            productCode: matchingSO.ProductCode || "",
            // Set reasonable defaults for production planning
            length: prev.length || "1", // Keep existing length if set, otherwise default
            priority: prev.priority || "Medium",
            status: prev.status || "Planning",
          };
          
          // Only update quantity if NOT from flow management (to preserve combined batch quantity)
          if (!isFromFlowManagement.current) {
            updateData.quantity = matchingSO.Quantity || "";
          }
          
          return {
            ...prev,
            ...updateData
          };
        });
        
        // Auto-fetch length per piece and core colors from client product data
        // This will trigger machine schedule update via useEffect dependencies
        if (matchingSO.ProductCode) {
          await autoFetchProductLength(matchingSO.ProductCode);
        }
        
        setSnackbar({
          open: true,
          message: `SO details auto-fetched for ${orderNumber}${isFromFlowManagement.current ? ' (quantity preserved from combined batches)' : ''}`,
          severity: "success",
        });
      }
    } catch (error) {
      console.error("Error auto-fetching order details:", error);
    }
  };

  // Optimized: Cached product spec fetching
  const autoFetchProductLength = useCallback(async (productCode) => {
    try {
      const normalized = (productCode || "").toString().trim();
      
      // Check cache first
      if (productSpecsCache.current.has(normalized)) {
        const cached = productSpecsCache.current.get(normalized);
        setFormData(prev => ({ ...prev, ...cached }));
        return;
      }
      // Try client service first
      let foundProduct = null;
      try {
        const { getAllClients } = await import('../../services/clientService');
        const clients = await getAllClients(false); // Use cache if available
        for (const client of clients) {
          if (client.products && Array.isArray(client.products)) {
            const match = client.products.find(p => (p.productCode || "").toString().trim() === normalized);
            if (match) { foundProduct = match; break; }
          }
        }
      } catch (e) {
        console.warn('Client service lookup failed, will try cableProducts fallback', e);
      }

      // Fallback: use loaded cableProducts (from sheet/SO merge)
      if (!foundProduct && Array.isArray(cableProducts) && cableProducts.length) {
        const fromCatalog = cableProducts.find(p => (p.productCode || "").toString().trim() === normalized);
        if (fromCatalog) {
          foundProduct = fromCatalog;
        }
      }

      // If still not found, keep existing values
      if (!foundProduct) {
        setFormData(prev => ({ ...prev, length: prev.length || "1" }));
        return;
      }

      // Flexible extraction for each required parameter, without overwriting with empties
      const strands = foundProduct.strands || foundProduct.strandCount;
      const copperDiameter = foundProduct.copperDiameter || foundProduct.copperDia || foundProduct.copperGauge || foundProduct.copperSize || foundProduct.conductorSize;
      const numberOfCores = foundProduct.numberOfCore || foundProduct.numberOfCores || foundProduct.coreCount;
      let coreColors = foundProduct.coreColors;
      
      // Try multiple ways to extract core colors
      if (!coreColors) {
        // Check alternative field names
        coreColors = foundProduct.coreColour || foundProduct.coreColours || foundProduct.colour || foundProduct.color;
      }
      
      // Parse core colors from various formats
      if (typeof coreColors === 'string') {
        // Try JSON parse first
        try {
          coreColors = JSON.parse(coreColors);
        } catch {
          // If not JSON, try comma-separated or single value
          if (coreColors.includes(',')) {
            coreColors = coreColors.split(',').map(c => c.trim()).filter(c => c);
          } else if (coreColors.includes('[') && coreColors.includes(']')) {
            // Try to extract from array-like string
            try {
              coreColors = JSON.parse(coreColors.replace(/'/g, '"'));
            } catch {
              coreColors = [coreColors.trim()];
            }
          } else {
            coreColors = coreColors.trim() ? [coreColors.trim()] : [];
          }
        }
      }
      
      // Ensure it's an array
      if (!Array.isArray(coreColors)) {
        coreColors = coreColors ? [coreColors] : [];
      }
      
      // Filter out empty values
      coreColors = coreColors.filter(c => c && c.trim());
      const coreOD = foundProduct.coreOD || foundProduct.coreOuterDiameter;
      const sheathOD = foundProduct.sheathOD || foundProduct.sheathOuterDiameter || foundProduct.cableOD || foundProduct.overallOD;
      const totalFinishedLength = foundProduct.totalFinishedLength || foundProduct.totalFinishedCableLength || foundProduct.totalWireLength;
      const length = foundProduct.totalLength || foundProduct.length;

      const specsToCache = {
        length: (length ?? "1").toString(),
        strands: (strands ?? "").toString(),
        copperDiameter: (copperDiameter ?? "").toString(),
        numberOfCores: (numberOfCores ?? "").toString(),
        coreColors: coreColors && coreColors.length ? coreColors : [],
        coreOD: (coreOD ?? "").toString(),
        sheathOD: (sheathOD ?? "").toString(),
        totalFinishedLength: (totalFinishedLength ?? "").toString()
      };
      
      // Cache the specs
      productSpecsCache.current.set(normalized, specsToCache);
      
      // Update formData, ensuring core colors are replaced (not merged)
      setFormData(prev => {
        // If product code changed, ensure we use new core colors
        const currentProductCode = prev.productCode?.toString().trim();
        if (currentProductCode === normalized) {
          return {
            ...prev,
            ...specsToCache,
            // Ensure core colors are replaced, not merged
            coreColors: specsToCache.coreColors || []
          };
        }
        return prev;
      });

      setSnackbar({
        open: true,
        message: `Cable specs auto-fetched for ${normalized}`,
        severity: "success",
      });
    } catch (error) {
      console.error("Error auto-fetching product specs:", error);
    }
  }, [cableProducts]);

  // Industry-standard machine scheduling configuration
  const INDUSTRY_CONFIG = {
    // Working hours configuration
    workingHours: {
      startHour: 6,  // 6:00 AM
      endHour: 22,   // 10:00 PM
      shiftDuration: 8, // 8 hours per shift
      shifts: [
        { name: "Morning", start: 6, end: 14 },   // 6 AM - 2 PM
        { name: "Afternoon", start: 14, end: 22 }, // 2 PM - 10 PM
        { name: "Night", start: 22, end: 6 }      // 10 PM - 6 AM (next day)
      ]
    },
    
    // Weekend and holiday configuration
    workingDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday (0=Sunday, 6=Saturday)
    holidays: [], // Can be populated with holiday dates
    
    // Machine configurations with realistic data
    machineTypes: {
      bunching: {
        name: "Bunching Machine",
        machines: [
          // Capacity in meters/hour per requirement (5000 m/hr)
          { id: "BM-001", capacity: 5000, efficiency: 0.90, maintenanceDay: null }
        ],
        setupTime: 1.0,
        cleanupTime: 0.5,
        changeoverTime: 0.5,
        minBatchSize: 500,
        maxBatchSize: 5000
      },
      extruder: {
        name: "Extruder Machine",
        machines: [
          // 180 m/min = 10,800 m/hr
          { id: "EXT-001", capacity: 10800, efficiency: 0.90, maintenanceDay: null }
        ],
        setupTime: 1.0,
        cleanupTime: 0.5,
        changeoverTime: 0.5,
        minBatchSize: 300,
        maxBatchSize: 20000
      },
      laying: {
        name: "Laying Machine",
        machines: [
          // 5000 m/hr
          { id: "LAY-001", capacity: 5000, efficiency: 0.90, maintenanceDay: null }
        ],
        setupTime: 0.5,
        cleanupTime: 0.5,
        changeoverTime: 0.5,
        minBatchSize: 400,
        maxBatchSize: 30000
      },
      final_extruder: {
        name: "Final Extruder",
        machines: [
          // 50 m/min = 3,000 m/hr
          { id: "FEXT-001", capacity: 3000, efficiency: 0.90, maintenanceDay: null }
        ],
        setupTime: 1.0,
        cleanupTime: 0.5,
        changeoverTime: 0.5,
        minBatchSize: 350,
        maxBatchSize: 25000
      }
    },
    
    // Buffer times between operations
    bufferTimes: {
      betweenOperations: 0.5, // 30 minutes between different operations
      sameOperationDifferentProduct: 1.0, // 1 hour when changing products
      shiftHandover: 0.5, // 30 minutes for shift handover
      qualityCheck: 0.25, // 15 minutes for quality checks
      materialHandling: 0.25 // 15 minutes for material movement
    }
  };

  // Helper function to check if a date is a working day
  const isWorkingDay = (date) => {
    const dayOfWeek = date.getDay();
    return INDUSTRY_CONFIG.workingDays.includes(dayOfWeek);
  };

  // Helper function to get the next working day
  const getNextWorkingDay = (date) => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(INDUSTRY_CONFIG.workingHours.startHour, 0, 0, 0);
    
    while (!isWorkingDay(nextDay)) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
  };

  // Helper function to get the appropriate shift for a given time
  const getShiftForTime = (date) => {
    const hour = date.getHours();
    const shifts = INDUSTRY_CONFIG.workingHours.shifts;
    
    for (const shift of shifts) {
      if (shift.name === "Night") {
        // Night shift spans midnight
        if (hour >= shift.start || hour < shift.end) {
          return shift;
        }
      } else {
        if (hour >= shift.start && hour < shift.end) {
          return shift;
        }
      }
    }
    
    // Default to morning shift if no match
    return shifts[0];
  };

  // Helper function to adjust time to working hours
  const adjustToWorkingHours = (date) => {
    const workingDate = new Date(date);
    const hour = workingDate.getHours();
    
    // If it's outside working hours, move to next working period
    if (hour < INDUSTRY_CONFIG.workingHours.startHour) {
      workingDate.setHours(INDUSTRY_CONFIG.workingHours.startHour, 0, 0, 0);
    } else if (hour >= INDUSTRY_CONFIG.workingHours.endHour) {
      return getNextWorkingDay(workingDate);
    }
    
    // If it's not a working day, move to next working day
    if (!isWorkingDay(workingDate)) {
      return getNextWorkingDay(workingDate);
    }
    
    return workingDate;
  };

  // Helper function to find the best available machine for a given operation
  const findBestAvailableMachine = (machineType, startTime, duration, existingSchedules = []) => {
    const machineConfig = INDUSTRY_CONFIG.machineTypes[machineType];
    if (!machineConfig) return null;

    let bestMachine = null;
    let earliestAvailableTime = null;

    for (const machine of machineConfig.machines) {
      // Check if machine is under maintenance
      const startDay = startTime.getDay();
      if (startDay === machine.maintenanceDay) {
        continue; // Skip this machine on its maintenance day
      }

      // Find when this machine is next available
      const machineSchedules = existingSchedules.filter(s => s.machineId === machine.id);
      let availableTime = new Date(startTime);
      
      // Check for conflicts with existing schedules
      for (const schedule of machineSchedules) {
        const scheduleStart = new Date(schedule.scheduledStartTime);
        const scheduleEnd = new Date(schedule.scheduledEndTime);
        
        // If there's a conflict, push the available time forward
        if (availableTime < scheduleEnd && availableTime >= scheduleStart) {
          availableTime = new Date(scheduleEnd);
          availableTime.setMinutes(availableTime.getMinutes() + 
            INDUSTRY_CONFIG.bufferTimes.betweenOperations * 60);
        }
      }

      // Adjust to working hours
      availableTime = adjustToWorkingHours(availableTime);

      // Check if this is the best option (earliest available time)
      if (!earliestAvailableTime || availableTime < earliestAvailableTime) {
        earliestAvailableTime = availableTime;
        bestMachine = machine;
      }
    }

    return bestMachine ? { machine: bestMachine, availableTime: earliestAvailableTime } : null;
  };

  // Helper function to calculate operation time based on capacity only
  const calculateOperationTime = (machineType, quantity, machine, isFirstOperation = true) => {
    const machineConfig = INDUSTRY_CONFIG.machineTypes[machineType];
    if (!machineConfig || !machine) return 0;

    // Calculate operation time based purely on machine capacity
    // Time = Quantity (meters) / Capacity (meters per hour)
    // Example: 7,500 / 10,800 = 0.694 hours
    const operationTime = quantity / machine.capacity;
    
    // Round to 2 decimal places for precision
    return Math.round(operationTime * 100) / 100;
  };

  // Helper function to calculate end time considering working hours
  const calculateEndTime = (startTime, duration) => {
    const endTime = new Date(startTime);
    let remainingHours = duration;
    
    while (remainingHours > 0) {
      const currentHour = endTime.getHours();
      const currentDay = endTime.getDay();
      
      // Check if we're in working hours
      if (isWorkingDay(endTime) && 
          currentHour >= INDUSTRY_CONFIG.workingHours.startHour && 
          currentHour < INDUSTRY_CONFIG.workingHours.endHour) {
        
        // Calculate hours remaining in current working day
        const hoursLeftInDay = INDUSTRY_CONFIG.workingHours.endHour - currentHour;
        const hoursToAdd = Math.min(remainingHours, hoursLeftInDay);
        
        endTime.setHours(endTime.getHours() + hoursToAdd);
        remainingHours -= hoursToAdd;
        
        // If we've used all hours in the day, move to next working day
        if (remainingHours > 0) {
          const nextWorkingDay = getNextWorkingDay(endTime);
          endTime.setTime(nextWorkingDay.getTime());
        }
      } else {
        // We're outside working hours, move to next working period
        const nextWorkingTime = adjustToWorkingHours(endTime);
        endTime.setTime(nextWorkingTime.getTime());
      }
    }
    
    return endTime;
  };

  // Main industry-standard machine scheduling function
  const generateIndustryMachineSchedule = (product, quantity, length, totalSingleCoreLength) => {
    const needsBunching = product.needsBunching || parseInt(product.strandCount) >= 24;
    
    // Determine cores/colors from form first, then product, then sensible defaults
    // Parse form core colors
    let formCoreColors = [];
    if (formData.coreColors) {
      if (Array.isArray(formData.coreColors)) {
        formCoreColors = formData.coreColors.filter(c => c && c.trim());
      } else if (typeof formData.coreColors === 'string') {
        try {
          formCoreColors = JSON.parse(formData.coreColors);
          if (!Array.isArray(formCoreColors)) {
            formCoreColors = formCoreColors ? [formCoreColors] : [];
          }
        } catch {
          // Try comma-separated
          if (formData.coreColors.includes(',')) {
            formCoreColors = formData.coreColors.split(',').map(c => c.trim()).filter(c => c);
          } else {
            formCoreColors = formData.coreColors.trim() ? [formData.coreColors.trim()] : [];
          }
        }
      }
    }
    
    // Parse product core colors with multiple fallback options
    let productCoreColors = [];
    if (product.coreColors) {
      if (Array.isArray(product.coreColors)) {
        productCoreColors = product.coreColors.filter(c => c && c.trim());
      } else if (typeof product.coreColors === 'string') {
        try {
          productCoreColors = JSON.parse(product.coreColors);
          if (!Array.isArray(productCoreColors)) {
            productCoreColors = productCoreColors ? [productCoreColors] : [];
          }
        } catch {
          // Try comma-separated or single value
          if (product.coreColors.includes(',')) {
            productCoreColors = product.coreColors.split(',').map(c => c.trim()).filter(c => c);
          } else {
            productCoreColors = product.coreColors.trim() ? [product.coreColors.trim()] : [];
          }
        }
      }
    }
    
    // Also check alternative field names in product
    if (!productCoreColors.length && product.coreColour) {
      if (Array.isArray(product.coreColour)) {
        productCoreColors = product.coreColour;
      } else if (typeof product.coreColour === 'string') {
        productCoreColors = product.coreColour.includes(',') 
          ? product.coreColour.split(',').map(c => c.trim()).filter(c => c)
          : [product.coreColour.trim()];
      }
    }
    
    // Determine desired core count
    const desiredCoreCount = parseInt(formData.numberOfCores) || 
                              parseInt(product.numberOfCore || product.numberOfCores || product.coreCount) ||
                              formCoreColors.length || 
                              productCoreColors.length || 
                              3;
    
    // Generate default names if needed
    const defaultNames = Array.from({ length: desiredCoreCount }, (_, i) => `Core ${i + 1}`);
    
    // Select core colors: form > product > defaults, then slice to desired count
    const coreColors = (formCoreColors.length 
      ? formCoreColors 
      : (productCoreColors.length 
          ? productCoreColors 
          : defaultNames)).slice(0, desiredCoreCount);
    
    // Ensure we have the right number of cores
    if (coreColors.length < desiredCoreCount) {
      const missing = desiredCoreCount - coreColors.length;
      for (let i = 0; i < missing; i++) {
        coreColors.push(`Core ${coreColors.length + 1}`);
      }
    }
    
    // Start scheduling from the next working day
    let currentStartTime = adjustToWorkingHours(new Date());
    const allSchedules = [];
    let sequenceNumber = 1;
    
    const schedule = {
      bunching: null,
      extruder: [],
      laying: null,
      finalExtruder: null,
    };

    // 1. Bunching operation (if needed)
    if (needsBunching) {
      const machineAllocation = findBestAvailableMachine("bunching", currentStartTime, 0, allSchedules);
      if (machineAllocation) {
        const operationTime = calculateOperationTime("bunching", totalSingleCoreLength, machineAllocation.machine);
        const endTime = calculateEndTime(machineAllocation.availableTime, operationTime);
        const shift = getShiftForTime(machineAllocation.availableTime);
        
        schedule.bunching = {
          machine: machineAllocation.machine.id,
          machineName: `Bunching Machine ${machineAllocation.machine.id}`,
          operation: "Bundle copper strands",
          quantity: totalSingleCoreLength,
          unit: "meters",
          estimatedTime: operationTime,
          actualCapacity: machineAllocation.machine.capacity,
          efficiency: machineAllocation.machine.efficiency,
          startTime: machineAllocation.availableTime,
          endTime: endTime,
          shift: shift.name,
          sequence: sequenceNumber++,
          setupTime: INDUSTRY_CONFIG.machineTypes.bunching.setupTime,
          cleanupTime: INDUSTRY_CONFIG.machineTypes.bunching.cleanupTime,
          priority: "High" // Bunching is typically high priority
        };
        
        allSchedules.push(schedule.bunching);
        
        // Next operation starts after bunching with buffer
        currentStartTime = new Date(endTime);
        currentStartTime.setMinutes(currentStartTime.getMinutes() + 
          INDUSTRY_CONFIG.bufferTimes.betweenOperations * 60);
        currentStartTime = adjustToWorkingHours(currentStartTime);
      }
    }

    // 2. Extruder operations (parallel for multiple cores)
    const extruderStartTime = new Date(currentStartTime);
    let maxExtruderEndTime = extruderStartTime;
    
    for (let i = 0; i < coreColors.length; i++) {
      const color = coreColors[i];
      const machineAllocation = findBestAvailableMachine("extruder", extruderStartTime, 0, allSchedules);
      
      if (machineAllocation) {
        // First core uses full setup, subsequent cores use changeover time
        const isFirstCore = i === 0;
        const operationTime = calculateOperationTime("extruder", quantity * length, machineAllocation.machine, isFirstCore);
        const endTime = calculateEndTime(machineAllocation.availableTime, operationTime);
        const shift = getShiftForTime(machineAllocation.availableTime);
        
        const extruderSchedule = {
          machine: machineAllocation.machine.id,
          machineName: `Extruder ${machineAllocation.machine.id}`,
          operation: `Extrude ${color} core`,
          color: color,
          quantity: quantity * length,
          unit: "meters",
          estimatedTime: operationTime,
          actualCapacity: machineAllocation.machine.capacity,
          efficiency: machineAllocation.machine.efficiency,
          startTime: machineAllocation.availableTime,
          endTime: endTime,
          shift: shift.name,
          sequence: sequenceNumber++,
          setupTime: INDUSTRY_CONFIG.machineTypes.extruder.setupTime,
          cleanupTime: INDUSTRY_CONFIG.machineTypes.extruder.cleanupTime,
          priority: "Medium"
        };
        
        schedule.extruder.push(extruderSchedule);
        allSchedules.push(extruderSchedule);
        
        // Track the latest end time for all extruders
        if (endTime > maxExtruderEndTime) {
          maxExtruderEndTime = endTime;
        }
      }
    }

    // 3. Laying operation (if multiple cores)
    currentStartTime = new Date(maxExtruderEndTime);
    currentStartTime.setMinutes(currentStartTime.getMinutes() + 
      INDUSTRY_CONFIG.bufferTimes.betweenOperations * 60);
    currentStartTime = adjustToWorkingHours(currentStartTime);
    
    if (coreColors.length > 1) {
      const machineAllocation = findBestAvailableMachine("laying", currentStartTime, 0, allSchedules);
      if (machineAllocation) {
        const operationTime = calculateOperationTime("laying", quantity * length, machineAllocation.machine);
        const endTime = calculateEndTime(machineAllocation.availableTime, operationTime);
        const shift = getShiftForTime(machineAllocation.availableTime);
        
        schedule.laying = {
          machine: machineAllocation.machine.id,
          machineName: `Laying Machine ${machineAllocation.machine.id}`,
          operation: "Combine cores",
          quantity: quantity * length,
          unit: "meters",
          estimatedTime: operationTime,
          actualCapacity: machineAllocation.machine.capacity,
          efficiency: machineAllocation.machine.efficiency,
          startTime: machineAllocation.availableTime,
          endTime: endTime,
          shift: shift.name,
          sequence: sequenceNumber++,
          setupTime: INDUSTRY_CONFIG.machineTypes.laying.setupTime,
          cleanupTime: INDUSTRY_CONFIG.machineTypes.laying.cleanupTime,
          priority: "Medium"
        };
        
        allSchedules.push(schedule.laying);
        currentStartTime = new Date(endTime);
        currentStartTime.setMinutes(currentStartTime.getMinutes() + 
          INDUSTRY_CONFIG.bufferTimes.betweenOperations * 60);
        currentStartTime = adjustToWorkingHours(currentStartTime);
      }
    }

    // 4. Final extruder operation
    const finalMachineAllocation = findBestAvailableMachine("final_extruder", currentStartTime, 0, allSchedules);
    if (finalMachineAllocation) {
      const operationTime = calculateOperationTime("final_extruder", quantity * length, finalMachineAllocation.machine);
      const endTime = calculateEndTime(finalMachineAllocation.availableTime, operationTime);
      const shift = getShiftForTime(finalMachineAllocation.availableTime);
      
      schedule.finalExtruder = {
        machine: finalMachineAllocation.machine.id,
        machineName: `Final Extruder ${finalMachineAllocation.machine.id}`,
        operation: "Apply outer sheath",
        quantity: quantity * length,
        unit: "meters",
        estimatedTime: operationTime,
        actualCapacity: finalMachineAllocation.machine.capacity,
        efficiency: finalMachineAllocation.machine.efficiency,
        startTime: finalMachineAllocation.availableTime,
        endTime: endTime,
        shift: shift.name,
        sequence: sequenceNumber++,
        setupTime: INDUSTRY_CONFIG.machineTypes.final_extruder.setupTime,
        cleanupTime: INDUSTRY_CONFIG.machineTypes.final_extruder.cleanupTime,
        priority: "High"
      };
      
      allSchedules.push(schedule.finalExtruder);
      currentStartTime = new Date(endTime);
      currentStartTime.setMinutes(currentStartTime.getMinutes() + 
        INDUSTRY_CONFIG.bufferTimes.betweenOperations * 60);
      currentStartTime = adjustToWorkingHours(currentStartTime);
    }

    return schedule;
  };

  // Optimized: Memoized machine schedule generation
  // Note: This uses formData from closure, so it will use the latest coreColors and numberOfCores
  const generateMachineSchedule = useCallback((product, quantity, length, totalSingleCoreLength) => {
    if (!product || !quantity || !length || !totalSingleCoreLength) {
      return;
    }
    // Generate schedule with current formData (includes latest coreColors and numberOfCores)
    const schedule = generateIndustryMachineSchedule(product, quantity, length, totalSingleCoreLength);
    setMachineSchedule(schedule);
  }, [formData.coreColors, formData.numberOfCores]); // Include dependencies so it uses latest values

  // Generate machine schedule when material requirements, product, quantity, length, or core colors change
  useEffect(() => {
    if (materialRequirements.totalSingleCoreLength > 0 && formData.productCode && formData.quantity && formData.length) {
      const product = cableProducts.find(p => p.productCode === formData.productCode);
      if (product) {
        // Regenerate machine schedule immediately when core colors or cores change
        generateMachineSchedule(
          product,
          parseFloat(formData.quantity),
          parseFloat(formData.length),
          materialRequirements.totalSingleCoreLength
        );
      }
    } else {
      // Clear machine schedule if required data is missing
      setMachineSchedule({
        bunching: null,
        extruder: [],
        laying: null,
        finalExtruder: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    materialRequirements.totalSingleCoreLength, 
    formData.productCode, 
    formData.quantity, 
    formData.length, 
    formData.coreColors,  // Add coreColors dependency
    formData.numberOfCores,  // Add numberOfCores dependency
    generateMachineSchedule,
    cableProducts  // Include cableProducts to ensure fresh product data
  ]);

  // Optimized: Debounced input change handler
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Auto-fetch length per piece when product code is selected (debounced in useEffect)
    // No need to call here as useEffect will handle it
  }, []);

  // Function to create individual machine schedule entries
  const createMachineSchedules = useCallback(async (planId, machineScheduleData, productCode, priority = "Medium") => {
    try {
      // First, check if Machine Schedules sheet exists
      try {
        await sheetService.getSheetData("Machine Schedules");
      } catch (sheetError) {
        console.error("Machine Schedules sheet error:", sheetError);
        throw new Error(`Machine Schedules sheet not found. Please create it first using Sheet Setup. Error: ${sheetError.message}`);
      }

      const schedules = [];
      
      // Helper function to generate schedule ID
      const generateScheduleId = () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `SCH-${timestamp}-${random}`;
      };

      // Helper function to convert machine allocation to machine type
      const getMachineType = (machineId) => {
        if (machineId.includes("BM-")) return "bunching";
        if (machineId.includes("EXT-")) return "extruder";
        if (machineId.includes("LAY-")) return "laying";
        if (machineId.includes("FEXT-")) return "final_extruder";
        if (machineId.includes("COIL-")) return "coiling";
        return "unknown";
      };

      // Process bunching operation
      if (machineScheduleData.bunching) {
        const operation = machineScheduleData.bunching;
        
        const scheduleData = {
          scheduleId: generateScheduleId(),
          planId: planId,
          machineType: getMachineType(operation.machine),
          machineId: operation.machine,
          operation: operation.operation,
          operationSequence: operation.sequence.toString(),
          productCode: productCode,
          quantity: operation.quantity.toString(),
          unit: operation.unit,
          setupTime: operation.setupTime ? operation.setupTime.toString() : "2.0",
          operationTime: operation.estimatedTime.toString(),
          cleanupTime: operation.cleanupTime ? operation.cleanupTime.toString() : "1.0",
          // Use only operation time (capacity-based) to match production sequence display
          totalTime: operation.estimatedTime ? operation.estimatedTime.toString() : "0",
          scheduledStartTime: operation.startTime ? operation.startTime.toISOString() : new Date().toISOString(),
          scheduledEndTime: operation.endTime ? operation.endTime.toISOString() : new Date().toISOString(),
          status: "Scheduled",
          shift: operation.shift || "Morning",
          priority: operation.priority || priority,
          notes: `Auto-generated from production plan ${planId} - ${operation.shift || 'Morning'} shift`,
          createdDate: new Date().toISOString().split('T')[0]
        };

        schedules.push(scheduleData);
      }

      // Process extruder operations
      if (machineScheduleData.extruder && machineScheduleData.extruder.length > 0) {
        for (let i = 0; i < machineScheduleData.extruder.length; i++) {
          const operation = machineScheduleData.extruder[i];
          
          const scheduleData = {
            scheduleId: generateScheduleId(),
            planId: planId,
            machineType: getMachineType(operation.machine),
            machineId: operation.machine,
            operation: operation.operation,
            operationSequence: operation.sequence.toString(),
            productCode: productCode,
            quantity: operation.quantity.toString(),
            unit: operation.unit,
            setupTime: operation.setupTime ? operation.setupTime.toString() : "3.0",
            operationTime: operation.estimatedTime.toString(),
            cleanupTime: operation.cleanupTime ? operation.cleanupTime.toString() : "2.0",
            // Use only operation time (capacity-based) to match production sequence display
            totalTime: operation.estimatedTime ? operation.estimatedTime.toString() : "0",
            scheduledStartTime: operation.startTime ? operation.startTime.toISOString() : new Date().toISOString(),
            scheduledEndTime: operation.endTime ? operation.endTime.toISOString() : new Date().toISOString(),
            status: "Scheduled",
            shift: operation.shift || "Morning",
            priority: operation.priority || priority,
            notes: `Auto-generated from production plan ${planId} - ${operation.color || 'core'} - ${operation.shift || 'Morning'} shift`,
            createdDate: new Date().toISOString().split('T')[0]
          };

          schedules.push(scheduleData);
        }
      }

      // Process laying operation
      if (machineScheduleData.laying) {
        const operation = machineScheduleData.laying;
        
        const scheduleData = {
          scheduleId: generateScheduleId(),
          planId: planId,
          machineType: getMachineType(operation.machine),
          machineId: operation.machine,
          operation: operation.operation,
          operationSequence: operation.sequence.toString(),
          productCode: productCode,
          quantity: operation.quantity.toString(),
          unit: operation.unit,
          setupTime: operation.setupTime ? operation.setupTime.toString() : "2.5",
          operationTime: operation.estimatedTime.toString(),
          cleanupTime: operation.cleanupTime ? operation.cleanupTime.toString() : "1.5",
          // Use only operation time (capacity-based) to match production sequence display
          totalTime: operation.estimatedTime ? operation.estimatedTime.toString() : "0",
          scheduledStartTime: operation.startTime ? operation.startTime.toISOString() : new Date().toISOString(),
          scheduledEndTime: operation.endTime ? operation.endTime.toISOString() : new Date().toISOString(),
          status: "Scheduled",
          shift: operation.shift || "Morning",
          priority: operation.priority || priority,
          notes: `Auto-generated from production plan ${planId} - ${operation.shift || 'Morning'} shift`,
          createdDate: new Date().toISOString().split('T')[0]
        };

        schedules.push(scheduleData);
      }

      // Process final extruder operation
      if (machineScheduleData.finalExtruder) {
        const operation = machineScheduleData.finalExtruder;
        
        const scheduleData = {
          scheduleId: generateScheduleId(),
          planId: planId,
          machineType: getMachineType(operation.machine),
          machineId: operation.machine,
          operation: operation.operation,
          operationSequence: operation.sequence.toString(),
          productCode: productCode,
          quantity: operation.quantity.toString(),
          unit: operation.unit,
          setupTime: operation.setupTime ? operation.setupTime.toString() : "2.0",
          operationTime: operation.estimatedTime.toString(),
          cleanupTime: operation.cleanupTime ? operation.cleanupTime.toString() : "1.5",
          // Use only operation time (capacity-based) to match production sequence display
          totalTime: operation.estimatedTime ? operation.estimatedTime.toString() : "0",
          scheduledStartTime: operation.startTime ? operation.startTime.toISOString() : new Date().toISOString(),
          scheduledEndTime: operation.endTime ? operation.endTime.toISOString() : new Date().toISOString(),
          status: "Scheduled",
          shift: operation.shift || "Morning",
          priority: operation.priority || priority,
          notes: `Auto-generated from production plan ${planId} - ${operation.shift || 'Morning'} shift`,
          createdDate: new Date().toISOString().split('T')[0]
        };

        schedules.push(scheduleData);
      }
      // Optimized: Batch create all schedules at once instead of sequential
      if (schedules.length === 0) {
        console.warn("No schedules to create");
        return 0;
      }

      try {
        // Batch append all schedules - much faster than sequential
        // Note: If sheetService doesn't support batch append, we'll need to check
        // For now, we'll use Promise.all to create them in parallel
        const appendPromises = schedules.map((schedule, index) => {
          return sheetService.appendRow("Machine Schedules", schedule)
            .then(() => {
              return schedule;
            })
            .catch((error) => {
              console.error(`Failed to create schedule ${schedule.operation}:`, error);
              throw new Error(`Failed to create schedule "${schedule.operation}": ${error.message}`);
            });
        });

        // Wait for all schedules to be created in parallel
        await Promise.all(appendPromises);
        return schedules.length;
      } catch (batchError) {
        console.error("Error in batch schedule creation:", batchError);
        throw batchError;
      }
    } catch (error) {
      console.error("Error creating machine schedules:", error);
      throw error;
    }
  }, []);

  // Helper function to generate next sequential plan ID (PLAN-001, PLAN-002, etc.)
  const generateNextPlanId = useCallback(() => {
    if (!productionPlans || productionPlans.length === 0) {
      return 'PLAN-001';
    }
    
    // Extract numeric part from existing plan IDs that match PLAN-XXX format
    const planNumbers = productionPlans
      .map(plan => {
        if (!plan.planId) return 0;
        const match = plan.planId.toString().match(/^PLAN-(\d+)$/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);
    
    // Find the highest number and increment
    const maxNumber = planNumbers.length > 0 ? Math.max(...planNumbers) : 0;
    const nextNumber = maxNumber + 1;
    
    // Format as PLAN-XXX with zero-padding (3 digits)
    return `PLAN-${String(nextNumber).padStart(3, '0')}`;
  }, [productionPlans]);

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
      // Don't throw - allow plan update/delete to continue even if schedule deletion fails
      return 0;
    }
  }, []);

  // Optimized: Better error handling and validation
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Comprehensive validation
    if (!formData.orderNumber || !formData.orderNumber.trim()) {
      setSnackbar({
        open: true,
        message: "Order Number is required",
        severity: "error",
      });
      return;
    }
    
    if (!formData.productCode || !formData.productCode.trim()) {
      setSnackbar({
        open: true,
        message: "Product Code is required",
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
    
    if (!formData.length || parseFloat(formData.length) <= 0) {
      setSnackbar({
        open: true,
        message: "Valid length is required",
        severity: "error",
      });
      return;
    }

    try {
      setLoading(true);
      const planId = formData.planId || generateNextPlanId();
      
      // Regenerate machine schedule with latest core colors before saving
      // This ensures we always save the most current data, not stale state
      let latestMachineSchedule = machineSchedule;
      if (materialRequirements.totalSingleCoreLength > 0 && formData.productCode && formData.quantity && formData.length) {
        const product = cableProducts.find(p => p.productCode === formData.productCode);
        if (product) {
          // Generate fresh machine schedule with current formData (including latest coreColors)
          // This uses formData from closure which has the latest values
          const freshSchedule = generateIndustryMachineSchedule(
            product,
            parseFloat(formData.quantity),
            parseFloat(formData.length),
            materialRequirements.totalSingleCoreLength
          );
          latestMachineSchedule = freshSchedule;
          // Update state as well for UI consistency
          setMachineSchedule(freshSchedule);
          
          // Log for debugging
          
        }
      }
      
      // Extract batch information from sessionStorage if available (for new plans from flow management)
      let batchInfo = [];
      if (!selectedPlan) {
        try {
          const storedData = sessionStorage.getItem('selectedCableProductionBatches');
          if (storedData) {
            const batchData = JSON.parse(storedData);
            if (batchData.batches && Array.isArray(batchData.batches)) {
              // Store batch IDs in array of objects with dispatch IDs
              batchInfo = batchData.batches.map(batch => ({
                dispatchId: batch.DispatchUniqueId || '',
                batchId: batch._uniqueKey || batch.DispatchUniqueId || '',
                batchNumber: batch.BatchNumber || '',
                quantity: batch.Quantity || batch.BatchSize || 0
              }));
            }
          }
        } catch (batchError) {
          console.error("Error extracting batch information:", batchError);
        }
      } else if (selectedPlan.batchInfo) {
        // For updates, preserve existing batch info if it exists
        try {
          batchInfo = typeof selectedPlan.batchInfo === 'string' 
            ? JSON.parse(selectedPlan.batchInfo) 
            : selectedPlan.batchInfo;
        } catch (e) {
          batchInfo = [];
        }
      }
      
      // Ensure coreColors is properly serialized in planData
      const planData = {
        ...formData,
        planId: planId,
        // Explicitly include coreColors to ensure it's saved
        coreColors: Array.isArray(formData.coreColors) 
          ? JSON.stringify(formData.coreColors) 
          : (typeof formData.coreColors === 'string' ? formData.coreColors : JSON.stringify([])),
        numberOfCores: formData.numberOfCores || "",
        materialRequirements: JSON.stringify(materialRequirements),
        machineSchedule: JSON.stringify(latestMachineSchedule),
        // Store batch IDs with dispatch IDs as JSON string
        batchInfo: batchInfo.length > 0 ? JSON.stringify(batchInfo) : '',
        dueDate: formData.dueDate instanceof Date 
          ? formData.dueDate.toISOString() 
          : formData.dueDate,
        createdDate: formData.createdDate instanceof Date 
          ? formData.createdDate.toISOString() 
          : formData.createdDate,
      };
      
      // Log planData to verify it has latest core colors
      if (selectedPlan) {
        // Update existing plan
        const planIndex = productionPlans.findIndex(p => p.planId === selectedPlan.planId);
        if (planIndex === -1) {
          throw new Error("Plan not found for update");
        }
        
        // Check if plan data changed significantly (quantity, product, length)
        const planChanged = 
          selectedPlan.quantity !== formData.quantity ||
          selectedPlan.productCode !== formData.productCode ||
          selectedPlan.length !== formData.length;
        
        // Delete old machine schedules if plan changed significantly
        if (planChanged) {
          const deletedCount = await deleteMachineSchedulesForPlan(selectedPlan.planId);
          if (deletedCount > 0) {
          }
        }
        
        await sheetService.updateRow("Cable Production Plans", planIndex + 2, planData);
        
        // Check if core colors or cores changed
        const coresChanged = 
          selectedPlan.coreColors !== JSON.stringify(formData.coreColors) ||
          selectedPlan.numberOfCores !== formData.numberOfCores;
        
        // If plan changed or cores changed or machine schedule is new, recreate schedules
        if (planChanged || coresChanged || (latestMachineSchedule && Object.keys(latestMachineSchedule).length > 0)) {
          // Delete old schedules if cores changed
          if (coresChanged && !planChanged) {
            const deletedCount = await deleteMachineSchedulesForPlan(selectedPlan.planId);
            if (deletedCount > 0) {
            }
          }
          
          try {
            const schedulesCreated = await createMachineSchedules(
              planId,
              latestMachineSchedule,
              formData.productCode,
              formData.priority || "Medium"
            );
            if (schedulesCreated > 0) {
              setSnackbar({
                open: true,
                message: `Production plan updated and ${schedulesCreated} machine schedule(s) regenerated`,
                severity: "success",
              });
            } else {
              setSnackbar({
                open: true,
                message: "Production plan updated successfully",
                severity: "success",
              });
            }
          } catch (scheduleError) {
            console.error("Error creating machine schedules:", scheduleError);
            setSnackbar({
              open: true,
              message: "Production plan updated, but failed to regenerate machine schedules. You can generate them manually from Machine Scheduling.",
              severity: "warning",
            });
          }
        } else {
          setSnackbar({
            open: true,
            message: "Production plan updated successfully",
            severity: "success",
          });
        }
      } else {
        // Create new plan - Check if dispatch IDs already have production plans
        const existingPlans = await sheetService.getSheetData("Cable Production Plans");
        let duplicatePlans = [];
        
        if (batchInfo.length > 0) {
          // Extract dispatch IDs from batchInfo
          const newDispatchIds = batchInfo
            .map(batch => batch.dispatchId || batch.batchId)
            .filter(Boolean);
          
          // Check each dispatch ID individually to find which ones already have plans
          const duplicateDispatchIds = [];
          const duplicatePlanDetails = [];
          
          newDispatchIds.forEach(dispatchId => {
            const existingPlan = existingPlans.find(plan => {
              if (!plan.batchInfo) return false;
              
              try {
                const planBatchInfo = typeof plan.batchInfo === 'string' 
                  ? JSON.parse(plan.batchInfo) 
                  : plan.batchInfo;
                
                if (Array.isArray(planBatchInfo)) {
                  return planBatchInfo.some(batch => 
                    (batch.dispatchId === dispatchId || batch.batchId === dispatchId)
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
            
            setSnackbar({
              open: true,
              message: `Cannot create production plan. The following dispatch ID(s) already have production plans: ${duplicateDetails}`,
              severity: "error",
            });
            setLoading(false);
            return;
          }
        } else {
          // If no batchInfo, check by orderNumber for backward compatibility
          duplicatePlans = existingPlans.filter(plan => 
            plan.orderNumber === formData.orderNumber
          );
          
          if (duplicatePlans.length > 0) {
            const duplicatePlanIds = duplicatePlans
              .map(p => p.planId || p.orderNumber || 'Unknown')
              .filter(Boolean)
              .join(', ');
            
            setSnackbar({
              open: true,
              message: `Cannot create production plan. A production plan already exists for order number: ${formData.orderNumber} (Plan IDs: ${duplicatePlanIds})`,
              severity: "error",
            });
            setLoading(false);
            return;
          }
        }
        
        // Create new plan
        await sheetService.appendRow("Cable Production Plans", planData);
        
        // Mark batches as moved in localStorage only after successful plan creation
        try {
          const storedData = sessionStorage.getItem('selectedCableProductionBatches');
          if (storedData) {
            const batchData = JSON.parse(storedData);
            if (batchData.taskKeys && Array.isArray(batchData.taskKeys) && batchData.taskKeys.length > 0) {
              const existingMovedTasks = JSON.parse(localStorage.getItem('movedToCableProductionTasks') || '[]');
              const updatedMovedTasks = [...new Set([...existingMovedTasks, ...batchData.taskKeys])];
              localStorage.setItem('movedToCableProductionTasks', JSON.stringify(updatedMovedTasks));
              
              // Clear sessionStorage after marking as moved
              sessionStorage.removeItem('selectedCableProductionBatches');
            }
          }
        } catch (trackingError) {
          console.error("Error tracking moved batches:", trackingError);
          // Don't fail plan creation if tracking fails
        }
        
        // Auto-create machine schedules if machine schedule data exists
        let schedulesCreated = 0;
        if (latestMachineSchedule && Object.keys(latestMachineSchedule).length > 0) {
          try {
            schedulesCreated = await createMachineSchedules(
              planId,
              latestMachineSchedule,
              formData.productCode,
              formData.priority || "Medium"
            );
          } catch (scheduleError) {
            console.error("Error creating machine schedules:", scheduleError);
            // Don't fail the plan creation if schedule creation fails
          }
        }
        
        if (schedulesCreated > 0) {
          setSnackbar({
            open: true,
            message: `Production plan created successfully with ${schedulesCreated} machine schedule(s). Batches marked as moved.`,
            severity: "success",
          });
        } else {
          setSnackbar({
            open: true,
            message: "Production plan created successfully. Generate machine schedules from Machine Scheduling. Batches marked as moved.",
            severity: "success",
          });
        }
      }
      
      // Refresh with force refresh only after successful save
      await fetchProductionPlans(true);
      
      // Dispatch custom event to notify other components that a plan was created
      window.dispatchEvent(new CustomEvent('productionPlanCreated', {
        detail: { planId, batchInfo }
      }));
      
      // Also trigger storage event for cross-tab communication
      try {
        sessionStorage.setItem('productionPlanCreated', Date.now().toString());
        sessionStorage.removeItem('productionPlanCreated'); // Remove immediately to trigger event
      } catch (e) {
        // Ignore storage errors
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving production plan:", error);
      setSnackbar({
        open: true,
        message: `Error saving production plan: ${error.message || 'Unknown error'}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [formData, materialRequirements, machineSchedule, selectedPlan, productionPlans, fetchProductionPlans, deleteMachineSchedulesForPlan, createMachineSchedules, cableProducts]);

  // Optimized: Better edit handling with error checking
  const handleEdit = useCallback((plan) => {
    if (!plan) {
      setSnackbar({
        open: true,
        message: "Invalid plan selected for editing",
        severity: "error",
      });
      return;
    }

    try {
      setSelectedPlan(plan);
      
      // Parse dates safely
      let dueDate = new Date();
      let createdDate = new Date();
      try {
        if (plan.dueDate) {
          dueDate = new Date(plan.dueDate);
          if (isNaN(dueDate.getTime())) dueDate = new Date();
        }
        if (plan.createdDate) {
          createdDate = new Date(plan.createdDate);
          if (isNaN(createdDate.getTime())) createdDate = new Date();
        }
      } catch (dateError) {
        console.warn("Error parsing dates:", dateError);
      }

      // Parse coreColors if it's a string
      let parsedCoreColors = plan.coreColors;
      if (typeof parsedCoreColors === 'string') {
        try {
          parsedCoreColors = JSON.parse(parsedCoreColors);
        } catch {
          // Try comma-separated
          if (parsedCoreColors.includes(',')) {
            parsedCoreColors = parsedCoreColors.split(',').map(c => c.trim()).filter(c => c);
          } else {
            parsedCoreColors = parsedCoreColors.trim() ? [parsedCoreColors.trim()] : [];
          }
        }
      }
      if (!Array.isArray(parsedCoreColors)) {
        parsedCoreColors = parsedCoreColors ? [parsedCoreColors] : [];
      }
      
      setFormData({
        ...plan,
        coreColors: parsedCoreColors, // Ensure it's an array
        numberOfCores: plan.numberOfCores || "",
        dueDate,
        createdDate,
      });
      
      // Parse JSON safely
      if (plan.materialRequirements) {
        try {
          const parsed = typeof plan.materialRequirements === 'string' 
            ? JSON.parse(plan.materialRequirements) 
            : plan.materialRequirements;
          setMaterialRequirements(parsed);
        } catch (parseError) {
          console.warn("Error parsing materialRequirements:", parseError);
          setMaterialRequirements({
            totalWireLength: 0,
            copperRequired: 0,
            pvcRequired: 0,
            pvcCoreRequired: 0,
            pvcSheathRequired: 0,
            colorBreakdown: {},
          });
        }
      }
      
      if (plan.machineSchedule) {
        try {
          const parsed = typeof plan.machineSchedule === 'string' 
            ? JSON.parse(plan.machineSchedule) 
            : plan.machineSchedule;
          setMachineSchedule(parsed);
        } catch (parseError) {
          console.warn("Error parsing machineSchedule:", parseError);
          setMachineSchedule({
            bunching: null,
            extruder: [],
            laying: null,
            finalExtruder: null,
          });
        }
      } else {
        // Clear machine schedule if not present
        setMachineSchedule({
          bunching: null,
          extruder: [],
          laying: null,
          finalExtruder: null,
        });
      }
      
      setOpenDialog(true);
      setActiveStep(0); // Reset to first step when editing
      
      // Note: Machine schedule will be regenerated automatically via useEffect
      // when formData.coreColors, quantity, length, etc. are set above
    } catch (error) {
      console.error("Error in handleEdit:", error);
      setSnackbar({
        open: true,
        message: `Error loading plan for editing: ${error.message}`,
        severity: "error",
      });
    }
  }, []);

  // Optimized: Better error handling for delete
  const handleDelete = useCallback(async (plan) => {
    if (!window.confirm("Are you sure you want to delete this production plan? This will also delete all associated machine schedules.")) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Find the plan in the full productionPlans array to get the correct row index
      const rowIndex = productionPlans.findIndex(p => 
        p.planId === plan.planId || 
        (p.orderNumber === plan.orderNumber && p.productCode === plan.productCode && p.quantity === plan.quantity)
      );
      
      if (rowIndex === -1 || !plan.planId) {
        throw new Error("Plan not found or missing planId");
      }
      
      // Delete associated machine schedules first
      const deletedSchedulesCount = await deleteMachineSchedulesForPlan(plan.planId);
      
      // Delete the production plan
      await sheetService.deleteRow("Cable Production Plans", rowIndex + 2);
      
      let message = "Production plan deleted successfully";
      if (deletedSchedulesCount > 0) {
        message += ` (${deletedSchedulesCount} machine schedule(s) also deleted)`;
      }
      
      setSnackbar({
        open: true,
        message: message,
        severity: "success",
      });
      await fetchProductionPlans(true);
    } catch (error) {
      console.error("Error deleting plan:", error);
      setSnackbar({
        open: true,
        message: `Error deleting plan: ${error.message || 'Unknown error'}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchProductionPlans, productionPlans, deleteMachineSchedulesForPlan]);

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setActiveStep(0);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPlan(null);
    setActiveStep(0);
    // Reset flow management flag when dialog closes
    isFromFlowManagement.current = false;
    setFormData({
      planId: "",
      orderNumber: "",
      customerName: "",
      productCode: "",
      quantity: "",
      length: "",
      strands: "",
      copperDiameter: "",
      numberOfCores: "",
      numberOfCore: "",
      coreColors: [],
      coreOD: "",
      sheathOD: "",
      totalFinishedLength: "",
      dueDate: new Date(),
      priority: "Medium",
      status: "Planning",
      remarks: "",
      createdDate: new Date(),
    });
    setMaterialRequirements({
      totalWireLength: 0,
      copperRequired: 0,
      pvcRequired: 0,
      colorBreakdown: {},
    });
    setMachineSchedule({
      bunching: null,
      extruder: [],
      laying: null,
      finalExtruder: null,
      coiling: null,
    });
  };

  const handleViewPlan = (plan) => {
    setViewPlan(plan);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setViewPlan(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "success";
      case "In Progress": return "info";
      case "Planning": return "warning";
      default: return "default";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "error";
      case "Medium": return "warning";
      case "Low": return "success";
      default: return "default";
    }
  };

  const getAllMachineOperations = () => {
    const operations = [];
    
    if (machineSchedule.bunching) {
      operations.push(machineSchedule.bunching);
    }
    
    machineSchedule.extruder.forEach(op => operations.push(op));
    
    if (machineSchedule.laying) {
      operations.push(machineSchedule.laying);
    }
    
    if (machineSchedule.finalExtruder) {
      operations.push(machineSchedule.finalExtruder);
    }
    
    if (machineSchedule.coiling) {
      operations.push(machineSchedule.coiling);
    }
    
    return operations.sort((a, b) => a.sequence - b.sequence);
  };

  // Pagination is implemented below the table

  // Filter and sort production plans by time and latest first
  const filteredAndSortedPlans = useMemo(() => {
    let filtered = [...productionPlans];
    
    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      let cutoffDate = new Date(now);
      
      if (timeFilter === '24d') {
        // 24 hours filter
        cutoffDate.setHours(cutoffDate.getHours() - 24);
      } else if (timeFilter === '7d') {
        // 7 days filter
        cutoffDate.setDate(cutoffDate.getDate() - 7);
      } else if (timeFilter === '3d') {
        // 3 days filter
        cutoffDate.setDate(cutoffDate.getDate() - 3);
      }
      
      filtered = filtered.filter(plan => {
        const planDate = plan.createdDate 
          ? new Date(plan.createdDate) 
          : (plan.dueDate ? new Date(plan.dueDate) : null);
        
        if (!planDate) return false;
        return planDate >= cutoffDate;
      });
    }
    
    // Sort by latest first (descending by createdDate, fallback to dueDate)
    filtered.sort((a, b) => {
      const dateA = a.createdDate 
        ? new Date(a.createdDate).getTime() 
        : (a.dueDate ? new Date(a.dueDate).getTime() : 0);
      const dateB = b.createdDate 
        ? new Date(b.createdDate).getTime() 
        : (b.dueDate ? new Date(b.dueDate).getTime() : 0);
      
      return dateB - dateA; // Latest first (descending)
    });
    
    return filtered;
  }, [productionPlans, timeFilter]);

  // Step enablement guards
  const isOrderInfoComplete = Boolean(
    formData.orderNumber && formData.productCode && formData.quantity
  );
  const isMaterialsReady = Boolean(
    !materialRequirements.error &&
    (materialRequirements.totalWireLength || 0) > 0
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header */}
      <Paper
        elevation={2}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backgroundColor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
          borderRadius: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 3,
            py: 2,
            minHeight: 80,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Tooltip title="Back to Flow Management">
              <IconButton
                onClick={() => navigate('/flow-management')}
                sx={{
                  color: '#1976d2',
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.2)',
                    transform: 'translateX(-3px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <ArrowBack />
              </IconButton>
            </Tooltip>
            <Typography variant="h5" sx={{ display: "flex", alignItems: "center", gap: 2, fontWeight: 600 }}>
              <PlanningIcon />
              Cable Production Planning (SO Integrated)
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ScheduleIcon />}
              onClick={() => {
                setLoading(true);
                Promise.all([
                  fetchProductionPlans(true),
                  fetchCableProducts(true),
                  fetchSOData(true)
                ]).finally(() => setLoading(false));
              }}
              disabled={loading}
              sx={{ textTransform: 'none' }}
            >
              {loading ? 'Refreshing...' : 'Refresh All Data'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              sx={{ textTransform: 'none' }}
            >
              Create Production Plan
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <LoadingSpinner message="Loading production plans..." />
          </Box>
        ) : (
          <>
            {/* Time Filter Buttons */}
            <Paper elevation={1} sx={{ p: 1.5, mx: 2, mt: 2, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>
                  Filter by:
                </Typography>
                <Button
                  variant={timeFilter === 'all' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => {
                    setTimeFilter('all');
                    setPage(0);
                  }}
                  sx={{ textTransform: 'none', minWidth: 60 }}
                >
                  All
                </Button>
                <Button
                  variant={timeFilter === '24d' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => {
                    setTimeFilter('24d');
                    setPage(0);
                  }}
                  sx={{ textTransform: 'none', minWidth: 80 }}
                >
                  24 hrs
                </Button>
                <Button
                  variant={timeFilter === '7d' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => {
                    setTimeFilter('7d');
                    setPage(0);
                  }}
                  sx={{ textTransform: 'none', minWidth: 60 }}
                >
                  7d
                </Button>
                <Button
                  variant={timeFilter === '3d' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => {
                    setTimeFilter('3d');
                    setPage(0);
                  }}
                  sx={{ textTransform: 'none', minWidth: 60 }}
                >
                  3d
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredAndSortedPlans.length} plan{filteredAndSortedPlans.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </Paper>

            <TableContainer 
              component={Paper} 
              sx={{ 
                flex: 1,
                overflow: 'auto',
                '& .MuiTableHead-root': {
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  '& .MuiTableCell-root': {
                    backgroundColor: 'background.paper',
                    fontWeight: 'bold',
                    borderBottom: '2px solid',
                    borderColor: 'divider',
                  }
                }
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Plan ID</TableCell>
                    <TableCell>Order Number</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Length</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productionPlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No production plans found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedPlans
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((plan, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography
                          variant="body2"
                          onClick={() => handleViewPlan(plan)}
                          sx={{
                            cursor: 'pointer',
                            color: 'primary.main',
                            fontWeight: 600,
                            '&:hover': {
                              textDecoration: 'underline',
                              color: 'primary.dark'
                            }
                          }}
                        >
                          {plan.planId}
                        </Typography>
                      </TableCell>
                      <TableCell>{plan.orderNumber}</TableCell>
                      <TableCell>{plan.customerName}</TableCell>
                      <TableCell>{plan.productCode}</TableCell>
                      <TableCell>{plan.quantity}</TableCell>
                      <TableCell>{plan.length}m</TableCell>
                      <TableCell>
                        {plan.dueDate ? new Date(plan.dueDate).toLocaleDateString() : ""}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={plan.priority}
                          color={getPriorityColor(plan.priority)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={plan.status}
                          color={getStatusColor(plan.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {/* WhatsApp Button */}
                          <WhatsAppButton
                            task={{
                              POId: plan.orderNumber,
                              DispatchUniqueId: plan.planId,
                              ClientCode: plan.customerName,
                              ClientName: plan.customerName,
                              ProductCode: plan.productCode,
                              Quantity: plan.quantity,
                              Status: plan.status,
                              DueDate: plan.dueDate
                            }}
                            stageName="CABLE_PRODUCTION"
                            status={plan.status || 'NEW'}
                            size="small"
                            variant="icon"
                          />
                          <Tooltip title="Move to Flow Management">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => navigate('/flow-management')}
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'rgba(46, 125, 50, 0.1)'
                                }
                              }}
                            >
                              <ArrowForward />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEdit(plan)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(plan)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Pagination */}
            <TablePagination
              component="div"
              count={filteredAndSortedPlans.length}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </Box>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedPlan ? "Edit Production Plan" : "Create Production Plan"}
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 2 }}>
            <Step>
              <StepLabel>Order Information</StepLabel>
              <StepContent>
                {/* Order Summary Banner */}
                {(formData.orderNumber || formData.productCode) && (
                  <Box sx={{ mb: 3, p: 2.5, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)' }}>
                    <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" alignItems="center">
                      {formData.orderNumber && (<Chip label={`📋 Order: ${formData.orderNumber}`} size="small" sx={{ bgcolor: 'white', fontWeight: 600, color: '#667eea' }} />)}
                      {formData.customerName && (<Chip label={`👤 Client: ${formData.customerName}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.9)', fontWeight: 500 }} />)}
                      {formData.productCode && (<Chip label={`📦 Product: ${formData.productCode}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.9)', fontWeight: 500 }} />)}
                      {formData.quantity && (<Chip label={`🔢 Qty: ${formData.quantity} pcs`} size="small" sx={{ bgcolor: '#4caf50', color: 'white', fontWeight: 600 }} />)}
                    </Stack>
                  </Box>
                )}

                {/* Basic Order Details */}
                <Card variant="outlined" sx={{ mb: 3, borderRadius: 2, border: '2px solid #e3f2fd', overflow: 'hidden' }}>
                  <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1976d2', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box component="span" sx={{ width: 4, height: 16, bgcolor: '#1976d2', borderRadius: 1 }} />
                      Basic Order Details
                    </Typography>
                  </Box>
                  <CardContent sx={{ pt: 3 }}>
                    <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      fullWidth
                      options={filteredSOs}
                      getOptionLabel={(option) => option.POId || option.SOId || ""}
                      value={filteredSOs.find(so => so.POId === formData.orderNumber || so.SOId === formData.orderNumber) || null}
                      onChange={(event, newValue) => {
                        setFormData(prev => ({
                          ...prev,
                          orderNumber: newValue ? (newValue.SOId || newValue.POId) : ""
                        }));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Order Number *"
                          margin="normal"
                          required
                          helperText={filteredSOs.length > 0 
                            ? `${filteredSOs.length} orders available for production` 
                            : "No orders available - check SO Ingestion"
                          }
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Box>
                            <Typography variant="body1">
                              {option.POId}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {option.ClientCode} - {option.Name}
                            </Typography>
                          </Box>
                        </li>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Customer Name"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      margin="normal"
                      InputProps={{
                        readOnly: Boolean(formData.orderNumber), // Read-only when auto-fetched
                      }}
                      helperText={formData.orderNumber ? "Auto-fetched from PO" : ""}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Product Code</InputLabel>
                      <Select
                        name="productCode"
                        value={formData.productCode}
                        onChange={handleInputChange}
                        label="Product Code"
                        disabled={Boolean(formData.orderNumber)} // Disabled when auto-fetched
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: '#e3f2fd' },
                            '&:hover fieldset': { borderColor: '#1976d2' },
                            '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                          }
                        }}
                      >
                        {cableProducts.map((product) => (
                          <MenuItem key={product.productCode} value={product.productCode}>
                            {product.productCode} - {product.productName}
                          </MenuItem>
                        ))}
                      </Select>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {formData.orderNumber ? "Auto-fetched from PO" : "Select the product to be manufactured"}
                      </Typography>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      type="number"
                      required
                      margin="normal"
                      InputProps={{ 
                        endAdornment: "pieces",
                        readOnly: Boolean(formData.orderNumber), // Read-only when auto-fetched
                      }}
                      helperText={formData.orderNumber ? "Auto-fetched from PO" : ""}
                    />
                  </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Product Specifications */}
                <Card variant="outlined" sx={{ mb: 3, borderRadius: 2, border: '2px solid #fff3e0', overflow: 'hidden' }}>
                  <Box sx={{ p: 2, bgcolor: '#fff9f0', borderBottom: '1px solid #ffe0b2' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#f57c00', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box component="span" sx={{ width: 4, height: 16, bgcolor: '#f57c00', borderRadius: 1 }} />
                      Product Specifications
                    </Typography>
                  </Box>
                  <CardContent sx={{ pt: 3 }}>
                    <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Length per piece"
                      name="length"
                      value={formData.length}
                      onChange={handleInputChange}
                      type="number"
                      step="0.1"
                      required
                      margin="normal"
                      InputProps={{ 
                        endAdornment: "meters",
                        readOnly: Boolean(formData.productCode && formData.length !== "1"), // Read-only when auto-fetched
                      }}
                      helperText={formData.productCode && formData.length !== "1" ? "✓ Auto-fetched from client product data" : "Enter cable length per piece"}
                      sx={{
                        '& .MuiInputBase-input': {
                          backgroundColor: formData.productCode && formData.length !== "1" ? 'rgba(76, 175, 80, 0.08)' : 'transparent',
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Strands"
                      name="strands"
                      value={formData.strands}
                      onChange={handleInputChange}
                      type="number"
                      required
                      margin="normal"
                      InputProps={{
                        readOnly: Boolean(formData.productCode && formData.strands),
                      }}
                      helperText={formData.productCode && formData.strands ? "✓ Auto-fetched from client product data" : "Number of copper strands per core"}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Copper Gauge (mm)"
                      name="copperDiameter"
                      value={formData.copperDiameter}
                      onChange={handleInputChange}
                      type="number"
                      step="0.01"
                      required
                      margin="normal"
                      InputProps={{
                        readOnly: Boolean(formData.productCode && formData.copperDiameter),
                      }}
                      helperText={formData.productCode && formData.copperDiameter ? "✓ Auto-fetched from client product data" : "Gauge (diameter) of each copper strand"}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Number of Cores"
                      name="numberOfCores"
                      value={formData.numberOfCores}
                      onChange={handleInputChange}
                      type="number"
                      required
                      margin="normal"
                      InputProps={{
                        readOnly: Boolean(formData.productCode && formData.numberOfCores),
                      }}
                      helperText={formData.productCode && formData.numberOfCores ? "✓ Auto-fetched from client product data" : "Total cores in the cable"}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Core OD (mm)"
                      name="coreOD"
                      value={formData.coreOD}
                      onChange={handleInputChange}
                      type="number"
                      step="0.01"
                      required
                      margin="normal"
                      InputProps={{
                        readOnly: Boolean(formData.productCode && formData.coreOD),
                      }}
                      helperText={formData.productCode && formData.coreOD ? "✓ Auto-fetched from client product data" : "Outer diameter of each core"}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Sheath OD (mm)"
                      name="sheathOD"
                      value={formData.sheathOD}
                      onChange={handleInputChange}
                      type="number"
                      step="0.01"
                      margin="normal"
                      InputProps={{
                        readOnly: Boolean(formData.productCode && formData.sheathOD),
                      }}
                      helperText={formData.productCode && formData.sheathOD ? "✓ Auto-fetched from client product data" : "Overall outer diameter with sheath"}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="core-colors-label">Core Colors</InputLabel>
                      <Select
                        labelId="core-colors-label"
                        multiple
                        name="coreColors"
                        value={formData.coreColors}
                        onChange={e => setFormData(prev => ({ ...prev, coreColors: typeof e.target.value === 'string' ? [e.target.value] : e.target.value }))}
                        disabled={Boolean(formData.productCode && Array.isArray(formData.coreColors) && formData.coreColors.length > 0)}
                        renderValue={(selected) => selected.join(', ')}
                      >
                        {["Red", "Black", "Blue", "Yellow-Green", "Brown", "Green", "White"].map((color) => (
                          <MenuItem key={color} value={color}>
                            <Checkbox checked={formData.coreColors.indexOf(color) > -1} />
                            <ListItemText primary={color} />
                          </MenuItem>
                        ))}
                      </Select>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {formData.productCode && Array.isArray(formData.coreColors) && formData.coreColors.length > 0 ? "✓ Auto-fetched from client product data" : "Select cable core colors"}
                      </Typography>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Due Date"
                        value={formData.dueDate}
                        onChange={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            margin: "normal",
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                    </Grid>
                  </CardContent>
                </Card>
                
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(1)}
                    sx={{ mt: 1, mr: 1 }}
                    disabled={!isOrderInfoComplete}
                  >
                    Next: Calculate Materials
                  </Button>
                </Box>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>Material Requirements</StepLabel>
              <StepContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          <MaterialIcon sx={{ mr: 1 }} />
                          Calculated Material Requirements
                        </Typography>
                        
                        {/* Formula Display */}
                        <Alert severity="info" sx={{ mb: 2, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            Calculation Formulas:
                          </Typography>
                          <Box sx={{ pl: 1 }}>
                            <Typography variant="body2" component="div" sx={{ mb: 0.5 }}>
                              <strong>Copper Required:</strong> (0.703 × strands × copper² × 1.02) / 100 × (quantity × length) × coreCount
                            </Typography>
                            <Typography variant="body2" component="div" sx={{ mb: 0.5 }}>
                              <strong>Core PVC Required:</strong> 0.785 × max(coreOD² - strands × copper², 0) × (0.162 / 100) × (quantity × length) × coreCount
                            </Typography>
                            <Typography variant="body2" component="div">
                              <strong>Sheath PVC Required:</strong> 0.785 × max(sheathOD² - coreOD², 0) × (0.162 / 100) × (quantity × length)
                            </Typography>
                          </Box>
                        </Alert>
                        
                        {/* FIXED: Display calculation errors and warnings */}
                        {materialRequirements.error && (
                          <Alert 
                            severity={materialRequirements.warning ? "warning" : "error"} 
                            sx={{ mb: 2 }}
                          >
                            {materialRequirements.error}
                          </Alert>
                        )}
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Total Finished Cable Length
                            </Typography>
                            <Typography variant="h6">
                              {materialRequirements.totalWireLength?.toLocaleString()} meters
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Total Single Core Wire Needed
                            </Typography>
                            <Typography variant="h6">
                              {materialRequirements.totalSingleCoreLength?.toLocaleString()} meters
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Copper Required
                            </Typography>
                            <Typography variant="h6">
                              {materialRequirements.copperRequired?.toFixed(2)} kg
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              PVC Required
                            </Typography>
                            <Typography variant="h6">
                              {materialRequirements.pvcRequired?.toFixed(2)} kg
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Core PVC
                            </Typography>
                            <Typography variant="h6">
                              {materialRequirements.pvcCoreRequired?.toFixed(2)} kg
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Sheath PVC
                            </Typography>
                            <Typography variant="h6">
                              {materialRequirements.pvcSheathRequired?.toFixed(2)} kg
                            </Typography>
                          </Grid>
                        </Grid>
                        
                        {Object.keys(materialRequirements.colorBreakdown || {}).length > 0 && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>
                              Color-wise Breakdown
                            </Typography>
                            <Grid container spacing={1}>
                              {Object.entries(materialRequirements.colorBreakdown || {}).map(([color, details]) => (
                                <Grid item xs={12} sm={6} key={color}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                    <Box
                                      sx={{
                                        width: 16,
                                        height: 16,
                                        borderRadius: "50%",
                                        backgroundColor: color === 'Yellow-Green' ? '#ADFF2F' : 
                                                       color === 'Brown' ? '#8B4513' :
                                                       color === 'Blue' ? '#0000FF' :
                                                       color === 'Black' ? '#000000' :
                                                       color === 'Grey' ? '#808080' :
                                                       color === 'White' ? '#FFFFFF' :
                                                       color === 'Red' ? '#FF0000' :
                                                       color === 'Orange' ? '#FFA500' :
                                                       color === 'Yellow' ? '#FFFF00' :
                                                       color === 'Green' ? '#008000' :
                                                       color === 'Violet' ? '#8B00FF' :
                                                       color === 'Pink' ? '#FFC0CB' : '#808080',
                                        border: "1px solid #ccc",
                                      }}
                                    />
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {color}: {typeof details === 'object' ? details.length?.toLocaleString() : details?.toLocaleString()}m
                                      </Typography>
                                      {typeof details === 'object' && (
                                        <Typography variant="caption" color="text.secondary">
                                          Copper: {details.copper}kg, PVC: {details.pvc}kg
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                </Grid>
                              ))}
                            </Grid>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(2)}
                    sx={{ mt: 1, mr: 1 }}
                    disabled={!isMaterialsReady}
                  >
                    Next: Machine Schedule
                  </Button>
                  <Button
                    onClick={() => setActiveStep(0)}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>Machine Schedule</StepLabel>
              <StepContent>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <ScheduleIcon sx={{ mr: 1 }} />
                      Production Sequence
                    </Typography>
                    <List>
                      {getAllMachineOperations().map((operation, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Chip label={operation.sequence} color="primary" size="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${operation.machine}: ${operation.operation}`}
                            secondary={`Quantity: ${operation.quantity?.toLocaleString()} ${operation.unit} | Est. Time: ${operation.estimatedTime} hours`}
                          />
                          {operation.color && (
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                backgroundColor: operation.color === 'Yellow-Green' ? '#ADFF2F' : 
                                               operation.color === 'Brown' ? '#8B4513' :
                                               operation.color === 'Blue' ? '#0000FF' :
                                               operation.color === 'Black' ? '#000000' :
                                               operation.color === 'Grey' ? '#808080' :
                                               operation.color === 'White' ? '#FFFFFF' :
                                               operation.color === 'Red' ? '#FF0000' :
                                               operation.color === 'Orange' ? '#FFA500' :
                                               operation.color === 'Yellow' ? '#FFFF00' :
                                               operation.color === 'Green' ? '#008000' :
                                               operation.color === 'Violet' ? '#8B00FF' :
                                               operation.color === 'Pink' ? '#FFC0CB' : '#808080',
                                border: "1px solid #ccc",
                                ml: 2,
                              }}
                            />
                          )}
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(3)}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Finish Planning
                  </Button>
                  <Button
                    onClick={() => setActiveStep(1)}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>Final Details</StepLabel>
              <StepContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Priority</InputLabel>
                      <Select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        label="Priority"
                      >
                        <MenuItem value="Low">Low</MenuItem>
                        <MenuItem value="Medium">Medium</MenuItem>
                        <MenuItem value="High">High</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Status</InputLabel>
                      <Select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        label="Status"
                      >
                        <MenuItem value="Planning">Planning</MenuItem>
                        <MenuItem value="Ready">Ready for Production</MenuItem>
                        <MenuItem value="In Progress">In Progress</MenuItem>
                        <MenuItem value="Completed">Completed</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Remarks"
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Button
                    onClick={() => setActiveStep(2)}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedPlan ? "Update" : "Create"} Plan
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Plan Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Production Plan Details</Typography>
            <IconButton onClick={handleCloseViewDialog} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {viewPlan && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Plan ID */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Plan ID
                </Typography>
                <Chip
                  label={viewPlan.planId}
                  sx={{
                    backgroundColor: '#e8f5e9',
                    color: '#2e7d32',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    mt: 0.5
                  }}
                />
              </Grid>

              {/* Order Information */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Order Number
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {viewPlan.orderNumber || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Customer Name
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {viewPlan.customerName || 'N/A'}
                </Typography>
              </Grid>

              {/* Product Information */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Product Code
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {viewPlan.productCode || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Quantity
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {viewPlan.quantity ? `${viewPlan.quantity} pcs` : 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Length
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {viewPlan.length ? `${viewPlan.length}m` : 'N/A'}
                </Typography>
              </Grid>

              {/* Technical Specifications */}
              {(viewPlan.strands || viewPlan.copperDiameter || viewPlan.numberOfCores) && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Technical Specifications
                    </Typography>
                  </Grid>

                  {viewPlan.strands && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Strands
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {viewPlan.strands}
                      </Typography>
                    </Grid>
                  )}

                  {viewPlan.copperDiameter && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Copper Diameter
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {viewPlan.copperDiameter}
                      </Typography>
                    </Grid>
                  )}

                  {viewPlan.numberOfCores && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Number of Cores
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {viewPlan.numberOfCores}
                      </Typography>
                    </Grid>
                  )}

                  {viewPlan.coreOD && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Core OD
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {viewPlan.coreOD}
                      </Typography>
                    </Grid>
                  )}

                  {viewPlan.sheathOD && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Sheath OD
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {viewPlan.sheathOD}
                      </Typography>
                    </Grid>
                  )}

                  {viewPlan.totalFinishedLength && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Finished Length
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {viewPlan.totalFinishedLength}
                      </Typography>
                    </Grid>
                  )}

                  {viewPlan.coreColors && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Core Colors
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                        {(() => {
                          try {
                            const colors = typeof viewPlan.coreColors === 'string' 
                              ? JSON.parse(viewPlan.coreColors) 
                              : viewPlan.coreColors;
                            if (Array.isArray(colors) && colors.length > 0) {
                              return colors.map((color, idx) => (
                                <Chip key={idx} label={color} size="small" />
                              ));
                            }
                          } catch (e) {
                            return <Typography variant="body2">N/A</Typography>;
                          }
                          return <Typography variant="body2">N/A</Typography>;
                        })()}
                      </Box>
                    </Grid>
                  )}
                </>
              )}

              {/* Dates and Status */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Due Date
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5 }}>
                  {viewPlan.dueDate 
                    ? new Date(viewPlan.dueDate).toLocaleDateString() 
                    : 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created Date
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5 }}>
                  {viewPlan.createdDate 
                    ? new Date(viewPlan.createdDate).toLocaleDateString() 
                    : 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Priority
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={viewPlan.priority || 'Medium'}
                    color={getPriorityColor(viewPlan.priority)}
                    size="small"
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={viewPlan.status || 'Planning'}
                    color={getStatusColor(viewPlan.status)}
                    size="small"
                  />
                </Box>
              </Grid>

              {/* Remarks */}
              {viewPlan.remarks && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Remarks
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    {viewPlan.remarks}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          {viewPlan && (
            <Button 
              onClick={() => {
                handleCloseViewDialog();
                handleEdit(viewPlan);
              }} 
              variant="contained" 
              color="primary"
            >
              Edit Plan
            </Button>
          )}
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

export default CableProductionPlanning; 