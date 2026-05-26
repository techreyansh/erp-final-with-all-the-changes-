import { useEffect } from "react";
import crmPpcBackendService from "../services/crmPpcBackendService";

export const useCrmPpcRealtime = ({ onLeadChange, onPlanChange, onWorkOrderChange }) => {
  useEffect(() => {
    const cleanups = [
      crmPpcBackendService.subscribe("crm_leads", onLeadChange),
      crmPpcBackendService.subscribe("ppc_production_plans", onPlanChange),
      crmPpcBackendService.subscribe("ppc_work_orders", onWorkOrderChange)
    ];
    return () => {
      cleanups.forEach((cleanup) => cleanup?.());
    };
  }, [onLeadChange, onPlanChange, onWorkOrderChange]);
};

export default useCrmPpcRealtime;
