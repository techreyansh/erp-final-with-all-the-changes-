import sheetService from './sheetService';
import config from '../config/config';

class ClientDashboardService {
  async getClientSummary(clientCode) {
    const [orders, payments, quotations, notifications] = await Promise.all([
      this.getClientOrders(clientCode),
      this.getClientPayments(clientCode),
      this.getClientQuotations(clientCode),
      this.getClientNotifications(clientCode),
    ]);

    return { orders, payments, quotations, notifications };
  }

  async getClientOrders(clientCode) {
    // Prefer Client_Orders; fallback to PO_Master, then PlacePO if not present
    let rows = [];
    try {
      rows = await sheetService.getSheetData(config.sheets.clientOrders);
    } catch (e) {
      try {
        rows = await sheetService.getSheetData(config.sheets.poMaster);
        // Map PO_Master to client order shape
        rows = rows.map(po => ({
          Id: po.POId || po.PO_Number || po.Id,
          ClientCode: po.ClientCode,
          OrderNumber: po.POId || po.PO_Number || po.OrderNumber,
          OrderDate: po.CreatedAt || po.Date,
          Status: po.Status,
          TotalAmount: po.Total_Amount || po.TotalAmount,
          Items: 1,
        }));
      } catch (_) {
        try {
          const placePO = await sheetService.getSheetData(config.sheets.placePO);
          rows = placePO.map(p => ({
            Id: p.POId,
            ClientCode: p.ClientCode || '',
            OrderNumber: p.POId,
            OrderDate: p.PlacedAt,
            Status: 'PO_PLACED',
            TotalAmount: p.Price || '',
            Items: 1,
          }));
        } catch (__){
          rows = [];
        }
      }
    }
    const code = clientCode ? String(clientCode).trim().toUpperCase() : null;
    return rows
      .filter(r => {
        if (!code) return true;
        const rc = String(r.ClientCode || '').trim().toUpperCase();
        return rc === code;
      })
      .map(r => ({
        id: r.Id || r.OrderId || `${r.ClientCode}-${r.OrderNumber}`,
        orderNumber: r.OrderNumber,
        orderDate: r.OrderDate,
        status: r.Status,
        totalAmount: Number(r.TotalAmount || 0),
        items: Number(r.Items || 0),
      }));
  }

  async getClientPayments(clientCode) {
    const rows = await sheetService.getSheetData(config.sheets.clientPayments).catch(() => []);
    const code = clientCode ? String(clientCode).trim().toUpperCase() : null;
    return rows
      .filter(r => {
        if (!code) return true;
        const rc = String(r.ClientCode || '').trim().toUpperCase();
        return rc === code;
      })
      .map(r => ({
        id: r.Id || r.PaymentId,
        orderId: r.OrderId,
        amount: Number(r.Amount || 0),
        paymentDate: r.PaymentDate,
        status: r.Status,
        method: r.Method,
      }));
  }

  async getClientQuotations(clientCode) {
    const rows = await sheetService.getSheetData(config.sheets.clientQuotations).catch(() => []);
    const code = clientCode ? String(clientCode).trim().toUpperCase() : null;
    return rows
      .filter(r => {
        if (!code) return true;
        const rc = String(r.ClientCode || '').trim().toUpperCase();
        return rc === code;
      })
      .map(r => ({
        id: r.Id || r.QuotationId,
        quotationNumber: r.QuotationNumber,
        issueDate: r.IssueDate,
        status: r.Status,
        totalAmount: Number(r.TotalAmount || 0),
        validUntil: r.ValidUntil,
      }));
  }

  async getClientNotifications(clientCode) {
    const rows = await sheetService.getSheetData(config.sheets.clientNotifications).catch(() => []);
    const code = clientCode ? String(clientCode).trim().toUpperCase() : null;
    return rows
      .filter(r => {
        if (!code) return true;
        const rc = String(r.ClientCode || '').trim().toUpperCase();
        return rc === code;
      })
      .map(r => ({
        id: r.Id || r.NotificationId,
        type: r.Type,
        message: r.Message,
        timestamp: r.Timestamp,
        read: String(r.Read || '').toLowerCase() === 'true',
      }));
  }
}

export default new ClientDashboardService();

