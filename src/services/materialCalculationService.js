class MaterialCalculationService {
  constructor() {
    // Material density constants (kg/m³)
    this.materialDensity = {
      copper: 8960, // kg/m³
      pvc: 1380,    // kg/m³
      rubber: 1520  // kg/m³
    };

    // Standard waste factors (percentage)
    this.wasteFactor = {
      copper: 0.05,     // 5% waste in copper processing
      pvc: 0.08,        // 8% waste in PVC extrusion
      bunching: 0.03,   // 3% waste in bunching process
      laying: 0.02,     // 2% waste in laying process
      coiling: 0.01     // 1% waste in coiling
    };

    // PVC coating thickness (mm)
    this.pvcThickness = {
      core_coating: 0.5,     // Single core PVC coating
      outer_sheath: 0.8      // Outer sheath thickness
    };
  }

  /**
   * Calculate material requirements for a cable production order
   * @param {Object} orderData - Order specifications
   * @param {Object} productData - Cable product specifications
   * @returns {Object} Material requirements breakdown
   */
  calculateMaterialRequirements(orderData, productData) {
    try {
      const {
        quantity,
        length,
        customLength = null
      } = orderData;

      const {
        cableType,
        copperSize,        // sq mm
        strandCount,
        coreColors,
        outerSheath,
        needsBunching
      } = productData;

      // Parse core colors if it's a JSON string
      const colors = typeof coreColors === 'string' ? JSON.parse(coreColors) : coreColors;
      const coreCount = colors.length;

      // Calculate basic measurements
      const totalFinishedLength = quantity * (customLength || length); // meters
      const totalSingleCoreLength = totalFinishedLength * coreCount;   // meters

      // Calculate copper requirements
      const copperCalculation = this.calculateCopperRequirements({
        totalSingleCoreLength,
        copperSize: parseFloat(copperSize),
        strandCount: parseInt(strandCount),
        needsBunching
      });

      // Calculate PVC requirements
      const pvcCalculation = this.calculatePVCRequirements({
        totalFinishedLength,
        totalSingleCoreLength,
        copperSize: parseFloat(copperSize),
        coreCount,
        outerSheath
      });

      // Calculate color-wise breakdown
      const colorBreakdown = this.calculateColorBreakdown({
        colors,
        totalFinishedLength,
        copperCalculation
      });

      // Calculate process-wise material consumption
      const processBreakdown = this.calculateProcessBreakdown({
        copperCalculation,
        pvcCalculation,
        needsBunching,
        coreCount
      });

      // Calculate costs (if material prices are available)
      const costCalculation = this.calculateMaterialCosts({
        copperCalculation,
        pvcCalculation
      });

      return {
        orderSummary: {
          totalFinishedLength,
          totalSingleCoreLength,
          coreCount,
          colors
        },
        copper: copperCalculation,
        pvc: pvcCalculation,
        colorBreakdown,
        processBreakdown,
        costs: costCalculation,
        calculations: {
          timestamp: new Date().toISOString(),
          orderData,
          productData
        }
      };

    } catch (error) {
      console.error('Error calculating material requirements:', error);
      throw new Error(`Material calculation failed: ${error.message}`);
    }
  }

  /**
   * Calculate copper requirements including waste factors
   */
  calculateCopperRequirements({ totalSingleCoreLength, copperSize, strandCount, needsBunching }) {
    // Calculate cross-sectional area of copper (circular)
    const copperRadius = Math.sqrt(copperSize / Math.PI); // mm
    const copperVolume = totalSingleCoreLength * 1000 * copperSize; // mm³

    // Convert to cubic meters and calculate weight
    const copperVolumeM3 = copperVolume / (1000 * 1000 * 1000); // m³
    const baseCopperWeight = copperVolumeM3 * this.materialDensity.copper; // kg

    // Apply waste factors
    let totalWasteFactor = this.wasteFactor.copper;
    if (needsBunching) {
      totalWasteFactor += this.wasteFactor.bunching;
    }

    const copperWithWaste = baseCopperWeight * (1 + totalWasteFactor);

    // Calculate copper wire requirements by diameter
    const wireDetails = this.calculateWireSpecifications(copperSize, strandCount);

    return {
      totalLengthRequired: totalSingleCoreLength,
      baseCopperWeight: Math.round(baseCopperWeight * 100) / 100,
      copperWithWaste: Math.round(copperWithWaste * 100) / 100,
      wasteFactor: totalWasteFactor,
      copperSize: copperSize,
      strandCount: strandCount,
      needsBunching: needsBunching,
      wireDetails: wireDetails,
      estimatedCost: 0 // To be calculated separately
    };
  }

  /**
   * Calculate PVC requirements for core coating and outer sheath
   */
  calculatePVCRequirements({ totalFinishedLength, totalSingleCoreLength, copperSize, coreCount, outerSheath }) {
    // Default outerSheath if not provided
    const sheathType = outerSheath || 'pvc';
    
    // Core coating PVC calculation
    const coreCoatingVolume = this.calculatePVCCoatingVolume({
      length: totalSingleCoreLength,
      innerDiameter: Math.sqrt(copperSize / Math.PI) * 2, // mm
      thickness: this.pvcThickness.core_coating
    });

    // Outer sheath PVC calculation
    const outerSheathVolume = this.calculateOuterSheathVolume({
      length: totalFinishedLength,
      coreCount: coreCount,
      copperSize: copperSize,
      sheathType: sheathType
    });

    // Convert volumes to weights
    const densityToUse = sheathType === 'rubber' ? 
      this.materialDensity.rubber : this.materialDensity.pvc;

    const coreCoatingWeight = (coreCoatingVolume / 1000000000) * this.materialDensity.pvc; // kg
    const outerSheathWeight = (outerSheathVolume / 1000000000) * densityToUse; // kg

    // Apply waste factors
    const coreCoatingWithWaste = coreCoatingWeight * (1 + this.wasteFactor.pvc);
    const outerSheathWithWaste = outerSheathWeight * (1 + this.wasteFactor.pvc);

    return {
      coreCoating: {
        volume: coreCoatingVolume, // mm³
        baseWeight: Math.round(coreCoatingWeight * 100) / 100,
        weightWithWaste: Math.round(coreCoatingWithWaste * 100) / 100,
        thickness: this.pvcThickness.core_coating
      },
      outerSheath: {
        volume: outerSheathVolume, // mm³
        baseWeight: Math.round(outerSheathWeight * 100) / 100,
        weightWithWaste: Math.round(outerSheathWithWaste * 100) / 100,
        thickness: this.pvcThickness.outer_sheath,
        material: sheathType
      },
      totalPVCWeight: Math.round((coreCoatingWithWaste + outerSheathWithWaste) * 100) / 100,
      wasteFactor: this.wasteFactor.pvc
    };
  }

  /**
   * Calculate material breakdown by core colors
   */
  calculateColorBreakdown({ colors, totalFinishedLength, copperCalculation }) {
    const breakdown = {};
    const copperPerCore = copperCalculation.copperWithWaste / colors.length;

    colors.forEach(color => {
      breakdown[color] = {
        length: totalFinishedLength, // Each color needs full finished length
        copperWeight: Math.round(copperPerCore * 100) / 100,
        pvcWeight: Math.round((copperCalculation.copperWithWaste / colors.length) * 0.2 * 100) / 100 // Approximate
      };
    });

    return breakdown;
  }

  /**
   * Calculate material consumption by production process
   */
  calculateProcessBreakdown({ copperCalculation, pvcCalculation, needsBunching, coreCount }) {
    const processes = [];

    if (needsBunching) {
      processes.push({
        process: 'Bunching',
        machine: 'Bunching Machine',
        materialType: 'Copper Wire',
        inputWeight: copperCalculation.baseCopperWeight,
        outputWeight: copperCalculation.baseCopperWeight * (1 - this.wasteFactor.bunching),
        wasteWeight: copperCalculation.baseCopperWeight * this.wasteFactor.bunching,
        efficiency: (1 - this.wasteFactor.bunching) * 100
      });
    }

    processes.push({
      process: 'Core Extrusion',
      machine: 'Extruder',
      materialType: 'Copper + PVC',
      inputWeight: copperCalculation.copperWithWaste + pvcCalculation.coreCoating.weightWithWaste,
      outputWeight: (copperCalculation.copperWithWaste + pvcCalculation.coreCoating.weightWithWaste) * (1 - this.wasteFactor.pvc),
      wasteWeight: (copperCalculation.copperWithWaste + pvcCalculation.coreCoating.weightWithWaste) * this.wasteFactor.pvc,
      efficiency: (1 - this.wasteFactor.pvc) * 100,
      coreCount: coreCount
    });

    if (coreCount > 1) {
      processes.push({
        process: 'Laying',
        machine: 'Laying Machine',
        materialType: 'Single Core Cables',
        inputWeight: 0, // No additional material
        wasteWeight: 0,
        efficiency: (1 - this.wasteFactor.laying) * 100
      });
    }

    processes.push({
      process: 'Final Extrusion',
      machine: 'Final Extruder',
      materialType: 'Outer Sheath PVC',
      inputWeight: pvcCalculation.outerSheath.weightWithWaste,
      outputWeight: pvcCalculation.outerSheath.weightWithWaste * (1 - this.wasteFactor.pvc),
      wasteWeight: pvcCalculation.outerSheath.weightWithWaste * this.wasteFactor.pvc,
      efficiency: (1 - this.wasteFactor.pvc) * 100
    });

    processes.push({
      process: 'Coiling',
      machine: 'Coiling Machine',
      materialType: 'Finished Cable',
      wasteWeight: 0,
      efficiency: (1 - this.wasteFactor.coiling) * 100
    });

    return processes;
  }

  /**
   * Calculate wire specifications based on copper size and strand count
   */
  calculateWireSpecifications(copperSize, strandCount) {
    // Calculate individual strand diameter
    const strandArea = copperSize / strandCount; // sq mm per strand
    const strandDiameter = Math.sqrt(strandArea * 4 / Math.PI); // mm

    return {
      totalCopperArea: copperSize,
      strandCount: strandCount,
      strandArea: Math.round(strandArea * 1000) / 1000,
      strandDiameter: Math.round(strandDiameter * 1000) / 1000,
      bundleType: strandCount > 24 ? 'Twisted Bundle' : 'Straight Lay'
    };
  }

  /**
   * Calculate PVC coating volume for cores
   */
  calculatePVCCoatingVolume({ length, innerDiameter, thickness }) {
    const innerRadius = innerDiameter / 2; // mm
    const outerRadius = innerRadius + thickness; // mm
    
    // Volume of cylindrical shell = π * (R² - r²) * L
    const volume = Math.PI * (Math.pow(outerRadius, 2) - Math.pow(innerRadius, 2)) * length * 1000; // mm³
    
    return volume;
  }

  /**
   * Calculate outer sheath volume
   */
  calculateOuterSheathVolume({ length, coreCount, copperSize, sheathType }) {
    // Estimate cable bundle diameter
    const coreRadius = Math.sqrt(copperSize / Math.PI) + this.pvcThickness.core_coating; // mm
    const bundleDiameter = this.estimateBundleDiameter(coreCount, coreRadius * 2);
    
    const innerRadius = bundleDiameter / 2;
    const outerRadius = innerRadius + this.pvcThickness.outer_sheath;
    
    // Volume calculation
    const volume = Math.PI * (Math.pow(outerRadius, 2) - Math.pow(innerRadius, 2)) * length * 1000; // mm³
    
    return volume;
  }

  /**
   * Estimate bundle diameter based on core count and core diameter
   */
  estimateBundleDiameter(coreCount, coreDiameter) {
    switch (coreCount) {
      case 1: return coreDiameter;
      case 2: return coreDiameter * 2.2;
      case 3: return coreDiameter * 2.5;
      case 4: return coreDiameter * 3.0;
      default: return coreDiameter * Math.sqrt(coreCount) * 1.2;
    }
  }

  /**
   * Calculate material costs (requires material price data)
   */
  calculateMaterialCosts({ copperCalculation, pvcCalculation }) {
    // These would typically come from a pricing service or database
    const defaultPrices = {
      copper: 650,    // Rs per kg
      pvc: 85,        // Rs per kg
      rubber: 120     // Rs per kg
    };

    const copperCost = copperCalculation.copperWithWaste * defaultPrices.copper;
    const pvcCost = pvcCalculation.totalPVCWeight * defaultPrices.pvc;
    const totalCost = copperCost + pvcCost;

    return {
      copperCost: Math.round(copperCost * 100) / 100,
      pvcCost: Math.round(pvcCost * 100) / 100,
      totalMaterialCost: Math.round(totalCost * 100) / 100,
      prices: defaultPrices,
      breakdown: {
        copper: {
          weight: copperCalculation.copperWithWaste,
          rate: defaultPrices.copper,
          cost: Math.round(copperCost * 100) / 100
        },
        pvc: {
          weight: pvcCalculation.totalPVCWeight,
          rate: defaultPrices.pvc,
          cost: Math.round(pvcCost * 100) / 100
        }
      }
    };
  }

  /**
   * Calculate inventory requirements and check availability
   */
  async calculateInventoryRequirements(materialRequirements, inventoryData) {
    const requirements = [];
    
    // Copper requirements
    requirements.push({
      materialType: 'Copper Wire',
      specification: `${materialRequirements.copper.copperSize} sq mm`,
      requiredWeight: materialRequirements.copper.copperWithWaste,
      unit: 'kg',
      category: 'Raw Material'
    });

    // PVC requirements by color
    Object.entries(materialRequirements.colorBreakdown).forEach(([color, data]) => {
      requirements.push({
        materialType: 'PVC Granules',
        specification: `${color} color`,
        requiredWeight: data.pvcWeight,
        unit: 'kg',
        category: 'PVC'
      });
    });

    // Outer sheath material
    requirements.push({
      materialType: (materialRequirements.pvc.outerSheath.material || 'pvc').toUpperCase(),
      specification: 'Outer Sheath',
      requiredWeight: materialRequirements.pvc.outerSheath.weightWithWaste,
      unit: 'kg',
      category: 'Outer Sheath'
    });

    // Check availability if inventory data is provided
    if (inventoryData) {
      requirements.forEach(req => {
        const inventoryItem = inventoryData.find(item => 
          item.specification?.toLowerCase().includes(req.specification.toLowerCase())
        );
        
        if (inventoryItem) {
          req.availableStock = parseFloat(inventoryItem.currentStock || 0);
          req.shortfall = Math.max(0, req.requiredWeight - req.availableStock);
          req.availability = req.availableStock >= req.requiredWeight ? 'Available' : 'Insufficient';
        } else {
          req.availability = 'Not Found';
          req.shortfall = req.requiredWeight;
        }
      });
    }

    return requirements;
  }

  /**
   * Generate material requisition for production
   */
  generateMaterialRequisition(materialRequirements, orderData) {
    const requisition = {
      requisitionId: `REQ-${Date.now()}`,
      orderNumber: orderData.orderNumber,
      requestDate: new Date().toISOString(),
      requestedBy: 'Production Planning',
      items: []
    };

    // Add copper items
    requisition.items.push({
      itemCode: `CU-${materialRequirements.copper.copperSize}`,
      itemName: `Copper Wire ${materialRequirements.copper.copperSize} sq mm`,
      specification: `${materialRequirements.copper.strandCount} strands`,
      quantity: materialRequirements.copper.copperWithWaste,
      unit: 'kg',
      purpose: 'Cable Core Production'
    });

    // Add PVC items by color
    if (materialRequirements.colorBreakdown) {
      Object.entries(materialRequirements.colorBreakdown).forEach(([color, data]) => {
        requisition.items.push({
          itemCode: `PVC-${(color || 'unknown').toUpperCase()}`,
          itemName: `PVC Granules - ${color || 'Unknown'}`,
          specification: 'Core Coating Grade',
          quantity: data.pvcWeight || 0,
          unit: 'kg',
          purpose: `${color || 'Unknown'} Core Coating`
        });
      });
    }

    // Add outer sheath material
    const sheathMaterial = materialRequirements.pvc.outerSheath.material || 'pvc';
    requisition.items.push({
      itemCode: `${sheathMaterial.toUpperCase()}-SHEATH`,
      itemName: `${sheathMaterial.toUpperCase()} Granules`,
      specification: 'Outer Sheath Grade',
      quantity: materialRequirements.pvc.outerSheath.weightWithWaste,
      unit: 'kg',
      purpose: 'Outer Sheath Coating'
    });

    return requisition;
  }

  /**
   * Get cable production tasks assigned to a user
   */
  async getUserCableProductionTasks(userEmail) {
    try {
      const sheetService = (await import('./sheetService')).default;
      const plans = await sheetService.getSheetData('Cable Production Plans');
      
      // Filter plans assigned to the user that are not completed
      const userTasks = plans.filter(plan => 
        plan.AssignedTo === userEmail && 
        plan.Status !== 'Completed' &&
        plan.Status !== 'completed'
      );
      
      // Enhance with additional data
      return userTasks.map(plan => ({
        ...plan,
        PlanId: plan.PlanId || plan.Id || plan['Plan ID'] || '',
        DueDate: plan.DueDate || plan.ExpectedCompletion || '',
        Priority: plan.Priority || 'Medium',
        CreatedAt: plan.CreatedAt || plan['Created Date'] || '',
        Status: plan.Status || 'Pending'
      }));
    } catch (error) {
      console.error(`Error fetching cable production tasks for user ${userEmail}:`, error);
      return [];
    }
  }

  /**
   * Get inventory/material requisition tasks assigned to a user
   */
  async getUserInventoryTasks(userEmail) {
    try {
      const sheetService = (await import('./sheetService')).default;
      const requisitions = await sheetService.getSheetData('Material Requisitions');
      
      // Filter requisitions assigned to the user that are not approved
      const userTasks = requisitions.filter(req => 
        req.AssignedTo === userEmail && 
        req.Status !== 'Approved' &&
        req.Status !== 'approved'
      );
      
      // Enhance with additional data
      return userTasks.map(req => ({
        ...req,
        ReqId: req.ReqId || req.Id || req['Requisition ID'] || '',
        DueDate: req.DueDate || req.RequiredDate || '',
        Priority: req.Priority || 'Medium',
        CreatedAt: req.CreatedAt || req['Created Date'] || '',
        Status: req.Status || 'Pending'
      }));
    } catch (error) {
      console.error(`Error fetching inventory tasks for user ${userEmail}:`, error);
      return [];
    }
  }
}

export default new MaterialCalculationService(); 