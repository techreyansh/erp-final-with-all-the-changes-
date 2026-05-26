// app main code

import React, { Suspense, lazy, useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useUser } from "./context/UserContext";
import FullScreenLogoLoader from "./components/common/FullScreenLogoLoader";
import {
  Box,
  CssBaseline,
  ThemeProvider,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { buildAppTheme } from "./theme/buildAppTheme";
import { ThemeModeProvider, useThemeMode } from "./context/ThemeModeContext";
import { setGlobalErrorNotifier } from "./lib/supabaseErrorHandler";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import { getGoogleWebClientId } from "./lib/googleWebClientId";
import { UserProvider } from "./context/UserContext";
import { StepStatusProvider } from './context/StepStatusContext';

import Header from "./components/common/Header";
import ScrollProgressBar from "./components/common/ScrollProgressBar";
import Login from "./components/auth/Login";
import ProfilePage from "./components/common/ProfilePage";
import SettingsPage from "./components/common/SettingsPage";
import HelpPage from "./components/common/HelpPage";
import SalesOrderIngestion from "./components/poIngestion/POIngestion";
import ClientManager from "./components/common/ClientManager";
import ProspectsClientManager from "./components/common/ProspectsClientManager";
import FlowManagement from "./components/flowManagement/FlowManagement";
import MyTasks from "./components/flowManagement/MyTasks";
import ComingSoon from "./components/common/ComingSoon";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RootRedirect from "./components/auth/RootRedirect";
import CEOOnlyRoute from "./components/auth/CEOOnlyRoute";
import StorageDebugger from "./components/dev/StorageDebugger";
import SheetInitializer from "./components/admin/SheetInitializer";
import SheetsTroubleshooting from "./components/admin/SheetsTroubleshooting";
import DispatchForm from "./components/dispatch/DispatchForm";
import DispatchManagement from "./components/dispatch/DispatchManagement";
import DispatchTest from "./components/dispatch/DispatchTest";
import ProductManagement from "./components/product/ProductManagement";
import Inventory from "./components/Inventory/Inventory";
import InventoryMainNavigation from "./components/Inventory/InventoryMainNavigation";
import StockSheetNavigation from "./components/Inventory/StockSheetNavigation";
import MaterialInwardNavigation from "./components/Inventory/MaterialInwardNavigation";
import MaterialIssueNavigation from "./components/Inventory/MaterialIssueNavigation";
import FinishedGoodsNavigation from "./components/Inventory/FinishedGoodsNavigation";
import FGMaterialInwardNavigation from "./components/Inventory/FGMaterialInwardNavigation";
import FGMaterialOutwardNavigation from "./components/Inventory/FGMaterialOutwardNavigation";
import FGToBilling from "./components/Inventory/FGToBilling";
import BillOfMaterialsNavigation from "./components/Inventory/BillOfMaterialsNavigation";
import KittingSheetNavigation from "./components/Inventory/KittingSheetNavigation";
import PurchaseFlow from "./components/purchaseFlow/PurchaseFlow";
import PurchaseFlowLayout from "./components/purchaseFlow/PurchaseFlowLayout";
import config from './config/config';
import RaiseIndent from './components/purchaseFlow/RaiseIndent';
// Sales Flow imports
import SalesFlow from "./components/salesFlow/SalesFlow";
import SalesFlowLayout from "./components/salesFlow/SalesFlowLayout";
// Client Orders import
import EnhancedClientOrderTakingSheet from "./components/clientOrders/EnhancedClientOrderTakingSheet";
import SalesFlowSubheader from "./components/salesFlow/SalesFlowSubheader";
import LogAndQualifyLeads from "./components/salesFlow/LogAndQualifyLeads";
import InitialCallAndRequirementGathering from "./components/salesFlow/InitialCallAndRequirementGathering";
import EvaluateHighValueProspects from './components/salesFlow/EvaluateHighValueProspects';
import CheckFeasibility from './components/salesFlow/CheckFeasibility';
import StandardsAndCompliance from './components/salesFlow/StandardsAndCompliance';
import SendQuotation from './components/salesFlow/SendQuotation';
import ApprovePaymentTerms from './components/salesFlow/ApprovePaymentTerms';
import SampleSubmission from './components/salesFlow/SampleSubmission';
import GetApprovalForSample from './components/salesFlow/GetApprovalForSample';
import ApproveStrategicDeals from './components/salesFlow/ApproveStrategicDeals';
import SalesFlowDetails from './components/salesFlow/SalesFlowDetails';
import ApproveIndent from './components/purchaseFlow/steps/ApproveIndent';
import VendorManagement from './components/purchaseFlow/steps/VendorManagement';
import FloatRFQ from './components/purchaseFlow/steps/FloatRFQ';
import FollowupQuotations from './components/purchaseFlow/steps/FollowupQuotations';
import ComparativeStatement from './components/purchaseFlow/steps/ComparativeStatement';
import ApproveQuotation from './components/purchaseFlow/steps/ApproveQuotation';
import RequestSample from "./components/purchaseFlow/steps/RequestSample";
import InspectSample from "./components/purchaseFlow/steps/InspectSample";
import PlacePO from './components/purchaseFlow/steps/PlacePO';
import FollowupDelivery from './components/purchaseFlow/steps/FollowupDelivery';
import RecieveAndInspectMaterial from './components/purchaseFlow/steps/RecieveAndInspectMaterial';
import MaterialApproval from './components/purchaseFlow/steps/MaterialApproval';
import DecisionOnRejection from './components/purchaseFlow/steps/DecisionOnRejection';
import ReturnRejectedMaterial from './components/purchaseFlow/steps/ReturnRejectedMaterial';
import ResendMaterial from './components/purchaseFlow/steps/ResendMaterial';
import GenerateGRN from './components/purchaseFlow/steps/GenerateGRN';
import FinalGRN from './components/purchaseFlow/steps/FinalGRN';
import SubmitInvoice from './components/purchaseFlow/steps/SubmitInvoice';
import SchedulePayment from './components/purchaseFlow/steps/SchedulePayment';
import ReleasePayment from './components/purchaseFlow/steps/ReleasePayment';
import Costing from './components/Costing/Costing';
import SortVendors from './components/purchaseFlow/steps/SortVendors';
import CableProductionModule from './components/cable/CableProductionModule';
import MoldingProductionModule from './components/molding/MoldingProductionModule';
import MoldingMainNavigation from './components/molding/MoldingMainNavigation';
import MoldingDashboardNavigation from './components/molding/MoldingDashboardNavigation';
import PowerCordMasterNavigation from './components/molding/PowerCordMasterNavigation';
import ProductionPlanningNavigation from './components/molding/ProductionPlanningNavigation';
import ProductionManagementNavigation from './components/molding/ProductionManagementNavigation';
import ClientDashboard from './components/clientDashboard/ClientDashboard';
import DocumentLibrary from './components/DocumentLibrary/DocumentLibrary';

const Dashboard = lazy(() => import("./components/dashboard/Dashboard"));
const WelcomePage = lazy(() => import("./pages/WelcomePage"));
const CEOExecutiveDashboard = lazy(() => import("./components/ceoDashboard/CEOExecutiveDashboard"));
const AdvancedEmployeeDashboard = lazy(() => import("./components/employeeDashboard/AdvancedEmployeeDashboard"));
const CRMModulePage = lazy(() => import("./pages/crm/CRMModulePage"));
const PPCModulePage = lazy(() => import("./pages/ppc/PPCModulePage"));
const EmployeeTaskChecklist = lazy(() => import("./components/taskCompliance/EmployeeTaskChecklist"));
const AdminTaskApprovalPanel = lazy(() => import("./components/taskCompliance/AdminTaskApprovalPanel"));

const ProtectedRouteGate = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;

function RouteSuspenseFallback() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: 240,
        width: "100%",
      }}
    >
      <CircularProgress size={32} aria-label="Loading page" />
    </Box>
  );
}

function AppContent() {
  const { authLoading } = useAuth();
  const { loading: userLoading } = useUser();
  const location = useLocation();
  const isPublicEntry =
    location.pathname === "/login" || location.pathname === "/";
  if (!isPublicEntry && (authLoading || userLoading)) {
    return <FullScreenLogoLoader />;
  }
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "background.default",
      }}
    >
      {!isPublicEntry && <Header />}
      {!isPublicEntry && <ScrollProgressBar />}
      <Box component="main" sx={{ flex: 1, py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 2, md: 3 }, maxWidth: "100%" }}>
        <Box
          key={location.pathname}
          className="motion-page-enter"
          sx={{ width: "100%", minHeight: 0 }}
        >
          <Suspense fallback={<RouteSuspenseFallback />}>
          <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<RootRedirect />} />

                  <Route path="/home" element={
                    <ProtectedRouteGate>
                      <WelcomePage />
                    </ProtectedRouteGate>
                  } />
                  <Route path="/welcome" element={
                    <ProtectedRouteGate>
                      <WelcomePage />
                    </ProtectedRouteGate>
                  } />

                  <Route path="/dashboard" element={
                    <ProtectedRouteGate>
                      <Dashboard />
                    </ProtectedRouteGate>
                  } />
                  <Route path="/ceo-command" element={
                    <CEOOnlyRoute>
                      <CEOExecutiveDashboard />
                    </CEOOnlyRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRouteGate>
                      <ProfilePage />
                    </ProtectedRouteGate>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRouteGate>
                      <SettingsPage />
                    </ProtectedRouteGate>
                  } />
                  <Route path="/help" element={
                    <ProtectedRouteGate>
                      <HelpPage />
                    </ProtectedRouteGate>
                  } />

                  <Route path="/clients" element={
                    <ProtectedRouteGate>
                      <ClientManager />
                    </ProtectedRouteGate>
                  } />

                  <Route path="/prospects-clients" element={
                    <ProtectedRouteGate>
                      <ProspectsClientManager />
                    </ProtectedRouteGate>
                  } />

                  <Route path="/client-dashboard" element={
                    <ProtectedRouteGate>
                      <ClientDashboard />
                    </ProtectedRouteGate>
                  } />

                  <Route path="/products" element={
                    <ProtectedRouteGate>
                      <ProductManagement />
                    </ProtectedRouteGate>
                  } />

                  <Route path="/client-orders" element={
                    <ProtectedRouteGate>
                      <EnhancedClientOrderTakingSheet />
                    </ProtectedRouteGate>
                  } />

                  <Route path="/po-ingestion" element={
                    <ProtectedRouteGate>
                      <SalesOrderIngestion />
                    </ProtectedRouteGate>
                  } />
                  
                  <Route path="/flow-management" element={
                    <ProtectedRouteGate>
                      <FlowManagement />
                    </ProtectedRouteGate>
                  } />
                  
                  <Route path="/my-tasks" element={
                    <ProtectedRouteGate>
                      <ComingSoon 
                        title="My Tasks"
                        subtitle="Task Management Feature Coming Soon"
                        description="We're building a comprehensive task management system that will help you track and manage all your assigned tasks in one place. This feature will include task prioritization, status tracking, due dates, and much more!"
                        showBackButton={true}
                        showNotifyButton={false}
                      />
                    </ProtectedRouteGate>
                  } />

                  <Route path="/cable-production" element={
                    <ProtectedRouteGate>
                      <Navigate to="/cable-production/dashboard" replace />
                    </ProtectedRouteGate>
                  } />
                  <Route path="/cable-production/dashboard" element={
                    <ProtectedRouteGate>
                      <CableProductionModule />
                    </ProtectedRouteGate>
                  } />
                  <Route path="/cable-production/production-planning" element={
                    <ProtectedRouteGate>
                      <CableProductionModule />
                    </ProtectedRouteGate>
                  } />
                  <Route path="/cable-production/machine-scheduling" element={
                    <ProtectedRouteGate>
                      <CableProductionModule />
                    </ProtectedRouteGate>
                  } />

                  {/* Old Molding Route (kept for backward compatibility) */}
                  <Route path="/molding-production" element={
                    <ProtectedRouteGate>
                      <MoldingProductionModule />
                    </ProtectedRouteGate>
                  } />

                  {/* New Molding Routes Structure */}
                  <Route path="/molding" element={
                    <ProtectedRouteGate>
                      <MoldingMainNavigation />
                    </ProtectedRouteGate>
                  } />

                  <Route path="/molding/dashboard" element={
                    <ProtectedRouteGate>
                      <MoldingDashboardNavigation />
                    </ProtectedRouteGate>
                  } />

                  <Route path="/molding/power-cord-master" element={
                    <ProtectedRouteGate>
                      <PowerCordMasterNavigation />
                    </ProtectedRouteGate>
                  } />

                  <Route path="/molding/production-planning" element={
                    <ProtectedRouteGate>
                      <ProductionPlanningNavigation />
                    </ProtectedRouteGate>
                  } />

                  <Route path="/molding/production-management" element={
                    <ProtectedRouteGate>
                      <ProductionManagementNavigation />
                    </ProtectedRouteGate>
                  } />

                  <Route path="/purchase-flow" element={
                    <ProtectedRouteGate>
                      <StepStatusProvider>
                        <PurchaseFlowLayout />
                      </StepStatusProvider>
                    </ProtectedRouteGate>
                  }>
                    <Route index element={<PurchaseFlow />} />
                    <Route path="raise-indent" element={<RaiseIndent />} />
                    <Route path="approve-indent" element={<ApproveIndent />} />
                    <Route path="float-rfq" element={<FloatRFQ />} />
                    <Route path="followup-quotations" element={<FollowupQuotations />} />
                    <Route path="comparative-statement" element={<ComparativeStatement />} />
                    <Route path="approve-quotation" element={<ApproveQuotation />} />
                    <Route path="request-sample" element={<RequestSample />} />
                    <Route path="inspect-sample" element={<InspectSample />} />
                    <Route path="place-po" element={<PlacePO />} />
                    <Route path="followup-delivery" element={<FollowupDelivery />} />
                    <Route path="recieve-inspect-material" element={<RecieveAndInspectMaterial />} />
                    <Route path="material-approval" element={<MaterialApproval />} />
                    <Route path="decision-on-rejection" element={<DecisionOnRejection />} />
                    <Route path="return-rejected-material" element={<ReturnRejectedMaterial />} />
                    <Route path="resend-material" element={<ResendMaterial />} />
                    <Route path="generate-grn" element={<GenerateGRN />} />
                    <Route path="final-grn" element={<FinalGRN />} />
                    <Route path="submit-invoice" element={<SubmitInvoice />} />
                    <Route path="schedule-payment" element={<SchedulePayment />} />
                    <Route path="release-payment" element={<ReleasePayment />} />
                    <Route path="sort-vendors" element={<SortVendors />} />
                  </Route>

                  <Route
                    path="/vendor-management"
                    element={
                      <ProtectedRouteGate>
                        <VendorManagement />
                      </ProtectedRouteGate>
                    }
                  />

                  <Route
                    path="/inventory"
                    element={
                      <ProtectedRouteGate>
                        <InventoryMainNavigation />
                      </ProtectedRouteGate>
                    } />

                  {/* Separate Inventory Module Routes */}
                  <Route
                    path="/inventory/stock-sheet"
                    element={
                      <ProtectedRouteGate>
                        <StockSheetNavigation />
                      </ProtectedRouteGate>
                    } />

                  <Route
                    path="/inventory/stock-sheet/material-inward"
                    element={
                      <ProtectedRouteGate>
                        <MaterialInwardNavigation />
                      </ProtectedRouteGate>
                    } />

                  <Route
                    path="/inventory/stock-sheet/material-outward"
                    element={
                      <ProtectedRouteGate>
                        <MaterialIssueNavigation />
                      </ProtectedRouteGate>
                    } />

                  <Route
                    path="/inventory/stock-sheet/fg-material-inward"
                    element={
                      <ProtectedRouteGate>
                        <FGMaterialInwardNavigation />
                      </ProtectedRouteGate>
                    } />

                  <Route
                    path="/inventory/stock-sheet/fg-material-outward"
                    element={
                      <ProtectedRouteGate>
                        <FGMaterialOutwardNavigation />
                      </ProtectedRouteGate>
                    } />

                  <Route
                    path="/inventory/finished-goods"
                    element={
                      <ProtectedRouteGate>
                        <FinishedGoodsNavigation />
                      </ProtectedRouteGate>
                    } />

                  <Route
                    path="/inventory/bill-of-materials"
                    element={
                      <ProtectedRouteGate>
                        <BillOfMaterialsNavigation />
                      </ProtectedRouteGate>
                    } />

                  <Route
                    path="/inventory/bill-of-materials/kitting-sheet"
                    element={
                      <ProtectedRouteGate>
                        <KittingSheetNavigation />
                      </ProtectedRouteGate>
                    } />

                  <Route
                    path="/inventory/kitting-sheet"
                    element={
                      <ProtectedRouteGate>
                        <KittingSheetNavigation />
                      </ProtectedRouteGate>
                    } />

                  <Route
                    path="/inventory/fg-to-billing"
                    element={
                      <ProtectedRouteGate>
                        <FGToBilling />
                      </ProtectedRouteGate>
                    } />

                  {/* Legacy Inventory Route (for backward compatibility) */}
                  <Route
                    path="/inventory/legacy"
                    element={
                      <ProtectedRouteGate>
                        <Inventory />
                      </ProtectedRouteGate>
                    } />

                  {/* Sales Flow Routes */}
                  <Route path="/sales-flow" element={
                    <ProtectedRouteGate>
                      <SalesFlowLayout />
                    </ProtectedRouteGate>
                  }>
                    <Route index element={<SalesFlow />} />
                    <Route path="log-and-qualify-leads" element={<LogAndQualifyLeads />} />
                    <Route path="initial-call" element={<InitialCallAndRequirementGathering />} />
                    <Route path="evaluate-high-value-prospects" element={<EvaluateHighValueProspects />} />
                    <Route path="check-feasibility" element={<CheckFeasibility />} />
                    <Route path="confirm-standards" element={<StandardsAndCompliance />} />
                    <Route path="send-quotation" element={<SendQuotation />} />
                    <Route path="approve-payment-terms" element={<ApprovePaymentTerms />} />
                    <Route path="sample-submission" element={<SampleSubmission />} />
                    <Route path="get-approval-for-sample" element={<GetApprovalForSample />} />
                    <Route path="approve-strategic-deals" element={<ApproveStrategicDeals />} />
                    <Route path="order-booking" element={
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4">Order Booking</Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>This step is under development.</Typography>
                      </Box>
                    } />
                    <Route path="details" element={<SalesFlowDetails />} />
                    {/* Legacy routes for backward compatibility */}
                    <Route path="create-lead" element={<LogAndQualifyLeads />} />
                  </Route>
                  
                  <Route path="/sales-flow/plan-manufacturing" element={
                    <ProtectedRouteGate>
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4">Plan & Execute Manufacturing</Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>This step is under development.</Typography>
                      </Box>
                    </ProtectedRouteGate>
                  } />
                  
                  <Route path="/sales-flow/pack-dispatch" element={
                    <ProtectedRouteGate>
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4">Pack & Dispatch Material</Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>This step is under development.</Typography>
                      </Box>
                    </ProtectedRouteGate>
                  } />
                  
                  <Route path="/sales-flow/generate-invoice" element={
                    <ProtectedRouteGate>
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4">Generate Invoice</Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>This step is under development.</Typography>
                      </Box>
                    </ProtectedRouteGate>
                  } />
                  
                  <Route path="/sales-flow/update-client" element={
                    <ProtectedRouteGate>
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4">Update Client on Dispatch</Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>This step is under development.</Typography>
                      </Box>
                    </ProtectedRouteGate>
                  } />
                  
                  <Route path="/sales-flow/follow-up-feedback" element={
                    <ProtectedRouteGate>
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4">Follow up for Feedback & Repeat Order</Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>This step is under development.</Typography>
                      </Box>
                    </ProtectedRouteGate>
                  } />
                  
                  <Route path="/sales-flow/follow-up-payment" element={
                    <ProtectedRouteGate>
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4">Follow-up on Balance Payment</Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>This step is under development.</Typography>
                      </Box>
                    </ProtectedRouteGate>
                  } />
                  
                  <Route path="/sales-flow/view-details" element={
                    <ProtectedRouteGate>
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4">Sales Flow Details</Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>This view is under development.</Typography>
                      </Box>
                    </ProtectedRouteGate>
                  } />

                  <Route
                    path="/setup-sheets"
                    element={
                      <ProtectedRouteGate>
                        <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
                          <Typography variant="h4" sx={{ mb: 3 }}>
                            Database Setup
                          </Typography>
                          <SheetInitializer />
                        </Box>
                      </ProtectedRouteGate>
                    }
                  />

                  <Route
                    path="/troubleshoot-sheets"
                    element={
                      <ProtectedRouteGate>
                        <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
                          <Typography variant="h4" sx={{ mb: 3 }}>
                            Troubleshoot connection
                          </Typography>
                          <SheetsTroubleshooting />
                        </Box>
                      </ProtectedRouteGate>
                    }
                  />

                  {config.useLocalStorage && (
                    <Route
                      path="/storage-debug"
                      element={
                        <ProtectedRouteGate>
                          <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
                            <Typography variant="h4" sx={{ mb: 3 }}>
                              Document Storage Debugger
                            </Typography>
                            <StorageDebugger />
                          </Box>
                        </ProtectedRouteGate>
                      }
                    />
                  )}

                  <Route
                    path="/dispatch"
                    element={
                      <ProtectedRouteGate>
                        <DispatchForm />
                      </ProtectedRouteGate>
                    }
                  />

                  <Route
                    path="/dispatch-management"
                    element={
                      <ProtectedRouteGate>
                        <DispatchManagement />
                      </ProtectedRouteGate>
                    }
                  />

                  <Route
                    path="/dispatch-test"
                    element={
                      <ProtectedRouteGate>
                        <DispatchTest />
                      </ProtectedRouteGate>
                    }
                  />

                  <Route
                    path="/costing"
                    element={
                      <ProtectedRouteGate>
                        <Costing />
                      </ProtectedRouteGate>
                    }
                  />

                  <Route
                    path="/client-dashboard"
                    element={
                      <ProtectedRouteGate>
                        <ClientDashboard />
                      </ProtectedRouteGate>
                    }
                  />

                  <Route
                    path="/employee-dashboard"
                    element={
                      <ProtectedRouteGate>
                        <AdvancedEmployeeDashboard />
                      </ProtectedRouteGate>
                    }
                  />

                  <Route
                    path="/document-library"
                    element={
                      <ProtectedRouteGate>
                        <DocumentLibrary />
                      </ProtectedRouteGate>
                    }
                  />

                  <Route
                    path="/task-checklist"
                    element={
                      <ProtectedRouteGate>
                        <EmployeeTaskChecklist />
                      </ProtectedRouteGate>
                    }
                  />
                  <Route
                    path="/task-compliance-admin"
                    element={
                      <ProtectedRouteGate>
                        <AdminTaskApprovalPanel />
                      </ProtectedRouteGate>
                    }
                  />

                  <Route
                    path="/crm"
                    element={
                      <ProtectedRouteGate>
                        <Navigate to="/crm/leads" replace />
                      </ProtectedRouteGate>
                    }
                  />
                  <Route
                    path="/crm/:section"
                    element={
                      <ProtectedRouteGate>
                        <CRMModulePage />
                      </ProtectedRouteGate>
                    }
                  />
                  <Route
                    path="/ppc"
                    element={
                      <ProtectedRouteGate>
                        <Navigate to="/ppc/production-plan" replace />
                      </ProtectedRouteGate>
                    }
                  />
                  <Route
                    path="/ppc/:section"
                    element={
                      <ProtectedRouteGate>
                        <PPCModulePage />
                      </ProtectedRouteGate>
                    }
                  />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
          </Suspense>
        </Box>
      </Box>
              <Box
                component="footer"
                sx={{
                  py: 2.5,
                  px: 3,
                  mt: "auto",
                  backgroundColor: "grey.100",
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" color="text.secondary" align="center" sx={{ letterSpacing: "0.02em" }}>
                  Reyansh Factory Operations Monitoring System &copy;{" "}
                  {new Date().getFullYear()}
                </Typography>
              </Box>
            </Box>
  );
}

function GlobalErrorToaster({ children }) {
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "error",
  });
  React.useEffect(() => {
    setGlobalErrorNotifier((message, severity) => {
      setSnackbar({ open: true, message, severity: severity || "error" });
    });
    return () => setGlobalErrorNotifier(null);
  }, []);
  const handleClose = () => setSnackbar((s) => ({ ...s, open: false }));
  return (
    <>
      {children}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleClose} severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

function AppShell() {
  return (
    <AuthProvider>
      <UserProvider>
        <StepStatusProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </StepStatusProvider>
      </UserProvider>
    </AuthProvider>
  );
}

function ThemedApp() {
  const { mode } = useThemeMode();
  const theme = useMemo(() => buildAppTheme(mode), [mode]);
  const googleClientId = getGoogleWebClientId();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalErrorToaster>
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>
            <AppShell />
          </GoogleOAuthProvider>
        ) : (
          <AppShell />
        )}
      </GlobalErrorToaster>
    </ThemeProvider>
  );
}

function App() {
  return (
    <ThemeModeProvider>
      <ThemedApp />
    </ThemeModeProvider>
  );
}

export default App;
