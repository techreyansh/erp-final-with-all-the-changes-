import * as db from '../lib/db';
import { supabase } from '../lib/supabaseClient';
import config from '../config/config';

const PO_MASTER_TABLE = db.getTableName(config.sheets.poMaster);

class POService {
  // Get all POs
  async getAllPOs(forceRefresh = false) {
    try {
      return await db.getTableRows(PO_MASTER_TABLE);
    } catch (error) {
      console.error('Error fetching POs:', error);
      throw error;
    }
  }
  
  // Get PO by ID
  async getPOById(poId) {
    try {
      const pos = await db.getTableRows(PO_MASTER_TABLE);
      return pos.find(po => po.POId === poId) || null;
    } catch (error) {
      console.error(`Error fetching PO with ID ${poId}:`, error);
      throw error;
    }
  }
  
  // Create a new PO
  async createPO(poData, createdByEmail) {
    try {
      const now = new Date().toISOString();

      // For each item, add a row to PO_Master
      if (Array.isArray(poData.items)) {
        for (const item of poData.items) {
          const newPO = {
            UniqueId: item.uniqueId || '', // Unique ID for each item
            SOId: item.soId || poData.name, // Sales Order ID (same for all items in same SO)
            POId: poData.name, // PO Number from form
            Name: item.itemName, // Item Name
            PODocumentId: poData.poDocumentId || '', // Use the same doc for all items
            ClientCode: poData.clientCode,
            OrderType: item.orderType,
            ProductCode: item.productCode,
            Description: item.productDesc,
            Quantity: item.qty,
            BatchSize: item.batchSize,
            Price: item.price || '', // Price per unit
            Status: config.statusCodes.NEW,
            CreatedBy: createdByEmail || '',
            CreatedAt: now,
            UpdatedAt: now,
            AssignedTo: poData.assignedTo || '',
            DueDate: ''
          };
          await db.insertTableRow(PO_MASTER_TABLE, newPO);
        }
      }
      return { success: true };
    } catch (error) {
      console.error('Error creating PO:', error);
      throw error;
    }
  }
  
  // Update a PO by UniqueId (for individual items within a sales order)
  async updatePOByUniqueId(uniqueId, poData) {
    try {
      const pos = await db.getTableRows(PO_MASTER_TABLE);

      const row = pos.find(po => po.UniqueId === uniqueId);
      if (!row || !row.id) {
        throw new Error(`PO with UniqueId ${uniqueId} not found`);
      }

      const updatedPO = {
        ...row,
        ...poData,
        UpdatedAt: new Date().toISOString()
      };
      delete updatedPO.id;
      await db.updateTableRowById(PO_MASTER_TABLE, row.id, updatedPO);
      return updatedPO;
    } catch (error) {
      console.error(`Error updating PO with UniqueId ${uniqueId}:`, error);
      console.error(`Error details:`, error.message);
      console.error(`Error stack:`, error.stack);
      throw error;
    }
  }

  // Update a PO
  async updatePO(poId, poData) {
    try {
      const pos = await db.getTableRows(PO_MASTER_TABLE);

      const row = pos.find(po => po.POId === poId);
      if (!row || !row.id) {
        throw new Error(`PO with ID ${poId} not found`);
      }

      const updatedPO = {
        ...row,
        ...poData,
        UpdatedAt: new Date().toISOString()
      };
      delete updatedPO.id;
      await db.updateTableRowById(PO_MASTER_TABLE, row.id, updatedPO);
      return updatedPO;
    } catch (error) {
      console.error(`Error updating PO with ID ${poId}:`, error);
      console.error(`Error details:`, error.message);
      console.error(`Error stack:`, error.stack);
      throw error;
    }
  }
  
  // Get BOM for a PO
  async getBOM(poId, bomType = 'BOM1') {
    try {
      const po = await this.getPOById(poId);
      
      if (!po) {
        throw new Error(`PO with ID ${poId} not found`);
      }
      
      const bomTemplates = await db.getTableRows(db.getTableName(config.sheets.bomTemplates));
      
      // Find the template for this product
      const template = bomTemplates.find(t => 
        t.ProductCode === po.ProductCode && 
        t.BOMType === bomType
      );
      
      if (!template) {
        throw new Error(`BOM template for product ${po.ProductCode} and type ${bomType} not found`);
      }
      
      // TODO: In a real implementation, this would calculate BOM based on
      // template, inventory levels, and batch size
      // For now, we'll just return the template with calculated quantities
      const bom = {
        POId: poId,
        ProductCode: po.ProductCode,
        BOMType: bomType,
        Materials: JSON.parse(template.Materials || '[]').map(material => ({
          ...material,
          RequiredQuantity: material.QuantityPerUnit * po.Quantity
        }))
      };
      
      return bom;
    } catch (error) {
      console.error(`Error fetching BOM for PO ${poId}:`, error);
      throw error;
    }
  }
  
  // Upload PO document and update PO with document ID
  async uploadPODocument(poId, file) {
    try {
      const ext = (file.name && file.name.split('.').pop()) || 'bin';
      const path = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`;
      const { data, error } = await supabase.storage.from('documents').upload(path, file, { upsert: false });
      if (error) throw error;
      const documentId = data?.path || path;

      await this.updatePO(poId, { PODocumentId: documentId });
      return documentId;
    } catch (error) {
      console.error(`Error uploading document for PO ${poId}:`, error);
      throw error;
    }
  }

  // Get PO document details by PO ID
  async getPODocument(poId) {
    try {
      const po = await this.getPOById(poId);
      if (!po.PODocumentId) {
        throw new Error(`No document attached to PO ${poId}`);
      }
      const { data } = supabase.storage.from('documents').getPublicUrl(po.PODocumentId);
      return { url: data?.publicUrl || po.PODocumentId, path: po.PODocumentId };
    } catch (error) {
      console.error(`Error fetching document for PO ${poId}:`, error);
      throw error;
    }
  }

  // Delete a PO (deletes all items belonging to the sales order)
  async deletePO(poId) {
    try {
      const pos = await db.getTableRows(PO_MASTER_TABLE);

      let matchingRows = pos.filter(po => po.POId === poId).map(po => ({ po, id: po.id }));
      if (matchingRows.length === 0) {
        matchingRows = pos.filter(po => po.SOId === poId).map(po => ({ po, id: po.id }));
        if (matchingRows.length === 0) {
          throw new Error(`PO with ID ${poId} not found (also checked SOId)`);
        }
      }

      for (const { id } of matchingRows) {
        await db.deleteTableRowById(PO_MASTER_TABLE, id);
      }
      return { success: true, deletedRows: matchingRows.length };
    } catch (error) {
      console.error(`Error deleting PO with ID ${poId}:`, error);
      throw error;
    }
  }
}

export default new POService(); 