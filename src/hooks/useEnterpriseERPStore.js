import { useCallback, useEffect, useMemo, useState } from "react";
import { enterpriseInitialState } from "../data/mock/enterpriseMockData";
import { calculateMachineUtilization, calculateMRPShortages, evaluateCreditRisk } from "../utils/calculations/erpCalculations";

const STORE_KEY = "erp-enterprise-store-v1";

export const useEnterpriseERPStore = ({ productionPlan = [], inventory = [], customers = [] }) => {
  const [state, setState] = useState(() => {
    try {
      const stored = window.localStorage.getItem(STORE_KEY);
      return stored ? JSON.parse(stored) : enterpriseInitialState;
    } catch (error) {
      return enterpriseInitialState;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }, [state]);

  const machineCapacity = useMemo(() => calculateMachineUtilization(state.machines), [state.machines]);
  const mrp = useMemo(() => calculateMRPShortages(productionPlan, state.bom, inventory), [inventory, productionPlan, state.bom]);
  const customerCredit = useMemo(
    () =>
      customers.map((customer) => ({
        ...customer,
        outstandingAmount: customer.outstandingAmount || Math.round((customer.creditLimit || 0) * 0.68),
        overdueDays: customer.overdueDays || (customer.paymentStatus === "Overdue" ? 19 : 0),
        risk: evaluateCreditRisk({
          creditLimit: customer.creditLimit,
          outstandingAmount: customer.outstandingAmount || Math.round((customer.creditLimit || 0) * 0.68),
          overdueDays: customer.overdueDays || (customer.paymentStatus === "Overdue" ? 19 : 0)
        })
      })),
    [customers]
  );

  const qcFailedWorkOrders = useMemo(
    () => state.qualityChecks.filter((item) => item.result === "Fail").map((item) => item.workOrderId),
    [state.qualityChecks]
  );

  const setRole = useCallback((role) => setState((prev) => ({ ...prev, userRole: role })), []);
  const appendRecord = useCallback((key, record) => setState((prev) => ({ ...prev, [key]: [{ ...record }, ...(prev[key] || [])] })), []);
  const updateRecords = useCallback((key, updater) => setState((prev) => ({ ...prev, [key]: updater(prev[key] || []) })), []);

  return {
    state,
    setState,
    setRole,
    appendRecord,
    updateRecords,
    derived: { machineCapacity, mrp, customerCredit, qcFailedWorkOrders }
  };
};
