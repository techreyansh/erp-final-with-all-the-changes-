import * as db from "../lib/db";
import config from "../config/config";
import poService from "./poService";
import { validateDispatchDate, isRestrictedDate, getRestrictionReason } from "../utils/dateRestrictions";
import { calculateStageDueDates } from "../utils/backwardPlanning";

function formatDateTime(dtString) {
  // dtString is in 'YYYY-MM-DDTHH:mm' or 'YYYY-MM-DDTHH:mm:ss' format
  if (!dtString) return "";
  const dt = new Date(dtString);
  if (isNaN(dt.getTime())) return ""; // Prevent NaN output if date is invalid
  const pad = (n) => n.toString().padStart(2, "0");
  return (
    pad(dt.getDate()) +
    "/" +
    pad(dt.getMonth() + 1) +
    "/" +
    dt.getFullYear() +
    " " +
    pad(dt.getHours()) +
    ":" +
    pad(dt.getMinutes()) +
    ":" +
    pad(dt.getSeconds())
  );
}

class DispatchService {
  async createDispatch({ DispatchDateTime }) {
    // Backend validation: prevent date before today and check for restrictions
    const now = new Date();
    const selected = new Date(DispatchDateTime);
    if (selected < now.setSeconds(0, 0)) {
      throw new Error("Dispatch date cannot be before today.");
    }
    
    // Validate dispatch date for restrictions (Sundays and gazetted holidays)
    const validation = validateDispatchDate(DispatchDateTime);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }
    
    const formatted = formatDateTime(DispatchDateTime);
    // Get all POs and find the most recent one (by CreatedAt or last in the list)
    const pos = await poService.getAllPOs();
    if (!pos || pos.length === 0) throw new Error("No POs found");
    // Sort by CreatedAt descending, fallback to last in the list
    let mostRecentPO = pos[pos.length - 1];
    if (pos[0]?.CreatedAt) {
      mostRecentPO = pos
        .slice()
        .sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt))[0];
    }
    // Update the PO with DispatchDateTime
    await poService.updatePO(mostRecentPO.POId, {
      DispatchDateTime: formatted,
    });
    return { POId: mostRecentPO.POId, DispatchDateTime: formatted };
  }

  async createBatchDispatch({ clientCode, batches, specificItem = null, isUrgentDispatch = false }) {
    // CRITICAL: Validate that all batches have dates
    const batchesWithoutDates = batches.filter(batch => !batch.date || batch.date === '');
    if (batchesWithoutDates.length > 0) {
      console.error("❌ Batches without dates found:", batchesWithoutDates);
      throw new Error(`All batches must have dispatch dates. Found ${batchesWithoutDates.length} batch(es) without dates.`);
    }
    
    // Validate batch dates for holidays and calculate backward planning dates
    for (const batch of batches) {
      if (batch.date) {
        // Validate the dispatch date (skip working days check for urgent dispatch)
        const validation = validateDispatchDate(batch.date, 'POWER_CORD', isUrgentDispatch);
        if (!validation.isValid) {
          throw new Error(`Dispatch date ${batch.date} is invalid: ${validation.message}`);
        }
      }
    }
    
    // Get all POs and dispatch records
    const pos = await poService.getAllPOs();
    const dispatchRecords = await db.getTableRows("dispatches");
    // Get already dispatched Unique IDs (more precise than ProductCode)
    const alreadyDispatchedUniqueIds = dispatchRecords
      .filter(record => record.Dispatched === "Yes")
      .map(record => record.UniqueId);
    let clientPOs;
    if (specificItem) {
      // If specific item is provided, only process that specific item by Unique ID
      clientPOs = pos.filter(
        (po) => {
          const matches = po.UniqueId === specificItem.UniqueId && 
                         po.Status !== config.statusCodes.DISPATCH &&
                         !alreadyDispatchedUniqueIds.includes(po.UniqueId);
          if (po.UniqueId === specificItem.UniqueId) {
            
          }
          return matches;
        }
      );
    } else {
      // Original logic for all client items (fallback)
      clientPOs = pos.filter(
        (po) =>
          po.ClientCode === clientCode &&
          po.Status !== config.statusCodes.DISPATCH &&
          !alreadyDispatchedUniqueIds.includes(po.UniqueId)
      );
    }

    if (clientPOs.length === 0) {
      return {
        success: false,
        message:
          "All POs for this item are already dispatched or no new items available.",
      };
    }

    // Helper function to generate DispatchUniqueId
    const generateDispatchUniqueId = () => {
      const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 3-digit random number
      return `DISP-${timestamp}-${randomNum}`;
    };

    // Store each batch as a row in the Dispatches sheet with required fields
    for (const batch of batches) {
      const poForProduct = clientPOs.find(
        (po) => po.UniqueId === specificItem?.UniqueId || po.ProductCode === batch.productCode
      );
      const productName = poForProduct ? poForProduct.Name : "";
      const batchNumberToUse = batch.batchNumber || 1;
      const uniqueId = specificItem ? specificItem.UniqueId : poForProduct?.UniqueId || `DP-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`;
      
      // Generate DispatchUniqueId for this batch
      const dispatchUniqueId = generateDispatchUniqueId();
      
      await db.insertTableRow("dispatches", {
        DispatchUniqueId: dispatchUniqueId,
        UniqueId: uniqueId,
        ClientCode: clientCode,
        ProductCode: batch.productCode,
        ProductName: productName,
        BatchNumber: batchNumberToUse,
        BatchSize: batch.batchSize,
        DispatchDate: batch.date,
        DateEntry: new Date().toLocaleDateString('en-GB'), // Date when data entered in Dispatches sheet
        Dispatched: "Yes",
        CreatedAt: new Date().toISOString(),
        // Initialize status columns with NEW status
        store1Status: "NEW",
        cableProdStatus: "NEW",
        store2Status: "NEW",
        mouldingProdStatus: "NEW",
        fgSectionStatus: "NEW",
        DispatchStatus: "NEW",
        // Support sheets that use lowercase column header
        dispatchStatus: "NEW",
        deliveryStatus: "NEW"
      });
    }

    // Update all POs for this specific item to DISPATCH status with backward planning dates

    for (const po of clientPOs) {
      try {
        
        // Find the batch for this PO to get dispatch date
        const batch = batches.find(b => 
          (specificItem && po.UniqueId === specificItem.UniqueId) || 
          (!specificItem && b.productCode === po.ProductCode)
        );
        
        // Calculate backward planning dates for this dispatch
        let backwardPlanningDates = {};
        if (batch && batch.date) {
          const calculatedDates = calculateStageDueDates(batch.date, po.OrderType || 'POWER_CORD', true, isUrgentDispatch);

          // Skip holiday/restriction validation for urgent dispatch
          if (!isUrgentDispatch) {
            // Validate that Store1 and Store2 dates don't fall on holidays/Sundays
            if (isRestrictedDate(calculatedDates.Store1DueDate)) {
              const reason = getRestrictionReason(calculatedDates.Store1DueDate);
              console.error(`❌ ERROR: Store 1 Cable Production due date falls on ${reason}! This should NOT happen!`);
              throw new Error(`Store 1 date calculation error: ${reason}`);
            } else {
            }
            
            if (isRestrictedDate(calculatedDates.Store2DueDate)) {
              const reason = getRestrictionReason(calculatedDates.Store2DueDate);
              console.error(`❌ ERROR: Store 2 Moulding FG Section due date falls on ${reason}! This should NOT happen!`);
              throw new Error(`Store 2 date calculation error: ${reason}`);
            } else {
            }
          }
          
          backwardPlanningDates = {
            DispatchDate: calculatedDates.DispatchDate,
            Store1DueDate: calculatedDates.Store1DueDate,
            CableProductionDueDate: calculatedDates.CableProductionDueDate,
            Store2DueDate: calculatedDates.Store2DueDate,
            MouldingDueDate: calculatedDates.MouldingDueDate,
            FGSectionDueDate: calculatedDates.FGSectionDueDate
          };
        }
        
        // CRITICAL FIX: Use UniqueId instead of POId for updating individual items
        // POId is the same for all items in a sales order, but UniqueId is unique per item
        const updateResult = await poService.updatePOByUniqueId(po.UniqueId, {
          Status: config.statusCodes.DISPATCH,
          ...backwardPlanningDates
        });
        // Verify the update by fetching the PO again
        const updatedPOs = await poService.getAllPOs();
        const verifyPO = updatedPOs.find(p => p.UniqueId === po.UniqueId);
      } catch (error) {
        console.error(`Failed to update PO with UniqueId ${po.UniqueId} to DISPATCH status:`, error);
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
        throw new Error(`Failed to update PO with UniqueId ${po.UniqueId} status: ${error.message}`);
      }
    }
    return { 
      success: true, 
      updatedPOs: clientPOs.map(po => ({ POId: po.POId, UniqueId: po.UniqueId, Status: config.statusCodes.DISPATCH }))
    };
  }

  async checkExistingDispatch(clientCode) {
    try {
      const dispatchRecords = await db.getTableRows("dispatches");
      return dispatchRecords.some((record) => record.ClientCode === clientCode);
    } catch (error) {
      console.error("Error checking existing dispatches:", error);
      return false; // Assume no existing dispatch if there's an error
    }
  }

  // Get all existing scheduled dispatches
  async getScheduledDispatches(clientCode = null) {
    try {
      const dispatchRecords = await db.getTableRows("dispatches");
      let scheduledDispatches = dispatchRecords.filter(
        (record) => record.Dispatched === "Yes" && record.DispatchDate
      );

      if (clientCode) {
        scheduledDispatches = scheduledDispatches.filter(
          (record) => record.ClientCode === clientCode
        );
      }

      // Sort by dispatch date
      return scheduledDispatches.sort((a, b) => 
        new Date(a.DispatchDate) - new Date(b.DispatchDate)
      );
    } catch (error) {
      console.error("Error getting scheduled dispatches:", error);
      return [];
    }
  }

  // Reschedule an existing dispatch
  async rescheduleDispatch(dispatchId, newDate, isEmergency = false) {
    try {
      // Get all dispatch records
      const dispatchRecords = await db.getTableRows("dispatches");
      const dispatchIndex = dispatchRecords.findIndex(
        (record, index) => index.toString() === dispatchId.toString()
      );

      if (dispatchIndex === -1) {
        throw new Error("Dispatch record not found");
      }

      const dispatch = dispatchRecords[dispatchIndex];

      // Validate new date is not in the past (unless emergency)
      if (!isEmergency) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const selectedDate = new Date(newDate);
        if (selectedDate < now) {
          throw new Error("Cannot reschedule to a past date unless marked as emergency");
        }
      }

      // Update the dispatch record
      const updatedDispatch = {
        ...dispatch,
        DispatchDate: newDate,
        LastModified: new Date().toISOString(),
        IsEmergency: isEmergency ? "Yes" : "No",
        ModifiedBy: "System" // Could be replaced with actual user info
      };

      const row = dispatchRecords[dispatchIndex];
      if (row?.id) {
        const nextRecord = { ...dispatch, ...updatedDispatch };
        delete nextRecord.id;
        await db.updateTableRowById("dispatches", row.id, nextRecord);
      }

      return {
        success: true,
        message: `Dispatch successfully rescheduled to ${newDate}${isEmergency ? ' (Emergency)' : ''}`,
        updatedDispatch
      };
    } catch (error) {
      console.error("Error rescheduling dispatch:", error);
      throw new Error(`Failed to reschedule dispatch: ${error.message}`);
    }
  }

  // Create emergency production dispatch
  async createEmergencyDispatch({ clientCode, productCode, quantity, dispatchDate, priority = "HIGH" }) {
    try {
      // Validate dispatch date for restrictions (Sundays and gazetted holidays)
      const validation = validateDispatchDate(dispatchDate);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
      
      // Get PO information
      const pos = await poService.getAllPOs();
      const po = pos.find(p => p.ClientCode === clientCode && p.ProductCode === productCode);

      if (!po) {
        throw new Error(`No PO found for client ${clientCode} and product ${productCode}`);
      }

      // Generate DispatchUniqueId for emergency dispatch
      const generateDispatchUniqueId = () => {
        const timestamp = Date.now().toString().slice(-8);
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `DISP-${timestamp}-${randomNum}`;
      };
      
      const dispatchUniqueId = generateDispatchUniqueId();

      // Create emergency dispatch record
      const emergencyDispatch = {
        DispatchUniqueId: dispatchUniqueId,
        ClientCode: clientCode,
        ProductCode: productCode,
        ProductName: po.Name || "",
        BatchNumber: 1, // Emergency production gets priority batch number
        BatchSize: quantity,
        DispatchDate: dispatchDate,
        Dispatched: "Yes",
        IsEmergency: "Yes",
        Priority: priority,
        CreatedAt: new Date().toISOString(),
        Notes: "Emergency production dispatch",
        // Initialize status columns with NEW status
        store1Status: "NEW",
        cableProdStatus: "NEW",
        store2Status: "NEW",
        mouldingProdStatus: "NEW",
        fgSectionStatus: "NEW",
        DispatchStatus: "NEW",
        deliveryStatus: "NEW"
      };

      await db.insertTableRow("dispatches", emergencyDispatch);
      // Update PO status if needed
      if (po.Status !== config.statusCodes.DISPATCH) {
        await poService.updatePO(po.POId, {
          Status: config.statusCodes.DISPATCH,
          IsEmergency: "Yes",
          Priority: priority
        });
      }

      return {
        success: true,
        message: "Emergency dispatch created successfully",
        dispatch: emergencyDispatch
      };
    } catch (error) {
      console.error("Error creating emergency dispatch:", error);
      throw new Error(`Failed to create emergency dispatch: ${error.message}`);
    }
  }

  // Check if date capacity allows emergency override
  async checkEmergencyCapacity(date, additionalQuantity) {
    try {
      const range = await db.getLatestDispatchLimitRange("daily_capacity", date);
      if (!range) return { allowed: true, message: "No capacity limits defined" };

      const dispatchRecords = await db.getTableRows("dispatches");
      const scheduledQuantity = dispatchRecords
        .filter(record => record.DispatchDate?.split(' ')[0] === date)
        .reduce((total, record) => total + Number(record.BatchSize || 0), 0);

      const totalQuantity = scheduledQuantity + additionalQuantity;
      const emergencyLimit = range.limit * 1.5; // 50% emergency override capacity

      return {
        allowed: totalQuantity <= emergencyLimit,
        currentCapacity: scheduledQuantity,
        requestedTotal: totalQuantity,
        normalLimit: range.limit,
        emergencyLimit: emergencyLimit,
        message: totalQuantity <= emergencyLimit 
          ? "Emergency capacity available" 
          : `Emergency capacity exceeded. Current: ${scheduledQuantity}, Requested: ${additionalQuantity}, Emergency Limit: ${emergencyLimit}`
      };
    } catch (error) {
      console.error("Error checking emergency capacity:", error);
      return { allowed: false, message: "Error checking capacity" };
    }
  }

  // Update existing dispatch records with empty status columns to have NEW status values
  async updateExistingDispatchStatuses() {
    try {
      const dispatchRecords = await db.getTableRows("dispatches");
      // Find records with empty status columns
      const recordsToUpdate = dispatchRecords.filter((record, index) => {
        const hasEmptyStatuses = !record.store1Status || !record.cableProdStatus || !record.store2Status;
        if (hasEmptyStatuses) {
          
        }
        return hasEmptyStatuses;
      });
      if (recordsToUpdate.length === 0) {
        return {
          success: true,
          message: "All dispatch records already have status columns populated",
          updatedCount: 0
        };
      }
      
      // Update each record
      let updatedCount = 0;
      for (let i = 0; i < dispatchRecords.length; i++) {
        const record = dispatchRecords[i];
        const needsUpdate = !record.store1Status || !record.cableProdStatus || !record.store2Status;
        
        if (needsUpdate) {
              const updatedRecord = {
                ...record,
                store1Status: record.store1Status || "NEW",
                cableProdStatus: record.cableProdStatus || "NEW",
                store2Status: record.store2Status || "NEW",
                mouldingProdStatus: record.mouldingProdStatus || "NEW",
                fgSectionStatus: record.fgSectionStatus || "NEW",
                DispatchStatus: record.DispatchStatus || "NEW",
                deliveryStatus: record.deliveryStatus || "NEW"
              };
          
          const r = dispatchRecords[i];
          if (r?.id) {
            const rec = { ...updatedRecord };
            delete rec.id;
            await db.updateTableRowById("dispatches", r.id, rec);
          }
          updatedCount++;
          
        }
      }
      return {
        success: true,
        message: `Successfully updated ${updatedCount} dispatch records with NEW status values`,
        updatedCount: updatedCount
      };
      
    } catch (error) {
      console.error("Error updating existing dispatch statuses:", error);
      throw new Error(`Failed to update existing dispatch statuses: ${error.message}`);
    }
  }
}

export default new DispatchService();
