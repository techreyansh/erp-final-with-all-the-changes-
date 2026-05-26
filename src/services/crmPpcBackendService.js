import { supabase } from "../lib/supabaseClient";
import { crmMock, ppcMock } from "../data/mock/crmPpcData";

const mapLead = (row) => ({
  id: row.id,
  companyName: row.company_name,
  contactPerson: row.contact_person,
  phone: row.phone,
  email: row.email,
  source: row.source,
  status: row.status,
  assignedTo: row.assigned_to,
  score: row.score ?? 0,
  budgetScore: row.budget_score ?? 0,
  requirementClarityScore: row.requirement_clarity_score ?? 0,
  urgencyScore: row.urgency_score ?? 0,
  engagementScore: row.engagement_score ?? 0,
  decisionAuthorityScore: row.decision_authority_score ?? 0,
  createdDate: row.created_at?.slice(0, 10) || ""
});

const mapCustomer = (row) => ({
  id: row.id,
  companyName: row.company_name || row.name,
  gstNumber: row.gstin || "",
  contactPerson: row.contact_person || "",
  phone: row.phone || "",
  email: row.email || "",
  creditLimit: Number(row.credit_limit || 0),
  outstandingAmount: Number(row.outstanding_amount || 0),
  overdueDays: Number(row.overdue_days || 0),
  createdDate: row.created_at?.slice(0, 10) || ""
});

const mapProductionPlan = (row) => ({
  id: row.id,
  salesOrderId: row.sales_order_id,
  productType: row.products?.name || row.product_id,
  productId: row.product_id,
  quantity: Number(row.quantity || 0),
  startDate: row.start_date,
  endDate: row.end_date,
  status: row.status
});

const mapWorkOrder = (row) => ({
  id: row.id,
  linkedPlanId: row.production_plan_id,
  machine: row.machine_id || "",
  operator: row.operator_id || "",
  status: row.status,
  outputProduced: Number(row.output || 0),
  defects: Number(row.defects || 0)
});

const safe = async (fn, fallback) => {
  try {
    return await fn();
  } catch (error) {
    console.warn("[crmPpcBackendService] fallback to mock data:", error?.message || error);
    return fallback;
  }
};

export const crmPpcBackendService = {
  async getLeads() {
    return safe(async () => {
      const { data, error } = await supabase
        .from("crm_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapLead);
    }, crmMock.leads);
  },

  async upsertLead(lead) {
    const payload = {
      id: lead.id?.startsWith("LD-") ? undefined : lead.id,
      company_name: lead.companyName,
      contact_person: lead.contactPerson,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      status: lead.status || "NEW",
      score: Number(lead.score || 0),
      budget_score: Number(lead.budgetScore || 0),
      requirement_clarity_score: Number(lead.requirementClarityScore || 0),
      urgency_score: Number(lead.urgencyScore || 0),
      engagement_score: Number(lead.engagementScore || 0),
      decision_authority_score: Number(lead.decisionAuthorityScore || 0)
    };
    const { data, error } = await supabase
      .from("crm_leads")
      .upsert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return mapLead(data);
  },

  async deleteLead(id) {
    const { error } = await supabase.from("crm_leads").delete().eq("id", id);
    if (error) throw error;
  },

  async getCustomers() {
    return safe(async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, company_name, gstin, contact_person, phone, email, credit_limit, outstanding_amount, overdue_days, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapCustomer);
    }, crmMock.customers);
  },

  async upsertCustomer(customer) {
    const payload = {
      id: customer.id?.startsWith("CUS-") ? undefined : customer.id,
      name: customer.companyName,
      company_name: customer.companyName,
      gstin: customer.gstNumber,
      contact_person: customer.contactPerson,
      phone: customer.phone,
      email: customer.email,
      credit_limit: Number(customer.creditLimit || 0),
      outstanding_amount: Number(customer.outstandingAmount || 0),
      overdue_days: Number(customer.overdueDays || 0)
    };
    const { data, error } = await supabase.from("customers").upsert(payload).select("*").single();
    if (error) throw error;
    return mapCustomer(data);
  },

  async getProductionPlans() {
    return safe(async () => {
      const { data, error } = await supabase
        .from("ppc_production_plans")
        .select("id, sales_order_id, product_id, quantity, start_date, end_date, status, products(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapProductionPlan);
    }, ppcMock.productionPlan);
  },

  async upsertProductionPlan(plan) {
    const payload = {
      id: plan.id?.startsWith("PLN-") ? undefined : plan.id,
      sales_order_id: plan.salesOrderId,
      product_id: plan.productId,
      quantity: Number(plan.quantity || 0),
      start_date: plan.startDate,
      end_date: plan.endDate,
      status: plan.status || "PLANNED"
    };
    const { data, error } = await supabase
      .from("ppc_production_plans")
      .upsert(payload)
      .select("id, sales_order_id, product_id, quantity, start_date, end_date, status, products(name)")
      .single();
    if (error) throw error;
    return mapProductionPlan(data);
  },

  async getWorkOrders() {
    return safe(async () => {
      const { data, error } = await supabase.from("ppc_work_orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapWorkOrder);
    }, ppcMock.workOrders);
  },

  subscribe(table, onEvent) {
    const channel = supabase
      .channel(`realtime-${table}-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, (payload) => onEvent?.(payload))
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }
};

export default crmPpcBackendService;
